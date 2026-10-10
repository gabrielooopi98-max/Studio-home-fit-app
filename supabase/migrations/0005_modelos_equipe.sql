-- Home Fit · modelos de treino e gestão da equipe pelo painel
-- Rode no SQL Editor do Supabase depois do 0004. Pode ser rodado de novo sem erro.

-- ---------------------------------------------------------------- modelos de treino
-- Fichas salvas como modelo para reaproveitar com outros alunos (ex.: "Iniciante 3x").

create table if not exists public.modelos_treino (
  id            uuid primary key default gen_random_uuid(),
  nome          text        not null check (char_length(trim(nome)) between 1 and 60),
  objetivo      text        not null default '' check (char_length(objetivo) <= 40),
  observacoes   text        not null default '' check (char_length(observacoes) <= 1000),
  duracao_dias  integer     not null default 30 check (duracao_dias between 1 and 366),
  treinos       jsonb       not null check (jsonb_typeof(treinos) = 'array' and jsonb_array_length(treinos) between 1 and 6),
  criado_por    uuid        default auth.uid() references public.perfis (id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists modelos_treino_nome_idx on public.modelos_treino (nome);

drop trigger if exists modelos_treino_atualizado_em on public.modelos_treino;
create trigger modelos_treino_atualizado_em
  before update on public.modelos_treino
  for each row execute function public.tocar_atualizado_em();

alter table public.modelos_treino enable row level security;
revoke all on public.modelos_treino from anon;

drop policy if exists "modelos: a equipe vê" on public.modelos_treino;
create policy "modelos: a equipe vê" on public.modelos_treino
  for select to authenticated using ((select public.eh_equipe()));

drop policy if exists "modelos: a equipe cria" on public.modelos_treino;
create policy "modelos: a equipe cria" on public.modelos_treino
  for insert to authenticated with check ((select public.eh_equipe()));

drop policy if exists "modelos: a equipe edita" on public.modelos_treino;
create policy "modelos: a equipe edita" on public.modelos_treino
  for update to authenticated using ((select public.eh_equipe())) with check ((select public.eh_equipe()));

drop policy if exists "modelos: a equipe exclui" on public.modelos_treino;
create policy "modelos: a equipe exclui" on public.modelos_treino
  for delete to authenticated using ((select public.eh_equipe()));

-- ---------------------------------------------------------------- equipe
-- Só o dono muda o papel de alguém, e nunca o próprio (para não se trancar fora do painel).

create or replace function public.definir_papel(p_usuario uuid, p_papel text)
returns public.perfis
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.perfis;
begin
  if not public.eh_dono() then
    raise exception 'Só o dono da academia pode mudar a equipe.' using errcode = '42501';
  end if;
  if p_papel not in ('aluno', 'personal', 'dono') then
    raise exception 'Papel inválido.' using errcode = '22023';
  end if;
  if p_usuario = (select auth.uid()) then
    raise exception 'Você não pode mudar o seu próprio papel.' using errcode = 'P0001';
  end if;

  update public.perfis set papel = p_papel where id = p_usuario returning * into v_perfil;
  if not found then
    raise exception 'Pessoa não encontrada.' using errcode = 'P0002';
  end if;
  return v_perfil;
end;
$$;

revoke execute on function public.definir_papel(uuid, text) from public, anon;
grant execute on function public.definir_papel(uuid, text) to authenticated;
