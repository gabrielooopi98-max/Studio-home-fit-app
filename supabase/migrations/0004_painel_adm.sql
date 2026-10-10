-- Home Fit · painel da academia (ADM) e fichas de treino montadas pelo personal
-- Rode no SQL Editor do Supabase depois do 0001, 0002 e 0003. Pode ser rodado de novo sem erro.
--
-- Papéis:
--   aluno    → usa o app
--   personal → monta fichas e vê os dados dos alunos
--   dono     → tudo do personal + loja (produtos e pedidos)

-- ---------------------------------------------------------------- papéis e e-mail

alter table public.perfis drop constraint if exists perfis_papel_check;
alter table public.perfis
  add constraint perfis_papel_check check (papel in ('aluno', 'personal', 'dono'));

-- E-mail no perfil, para a equipe saber como falar com o aluno.
alter table public.perfis add column if not exists email text not null default '';
update public.perfis p set email = coalesce(u.email, '') from auth.users u where u.id = p.id;

create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  numero text := regexp_replace(coalesce(new.raw_user_meta_data ->> 'telefone', ''), '[^0-9]', '', 'g');
begin
  insert into public.perfis (id, nome, telefone, email)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), 40),
    case when numero ~ '^[1-9][0-9][0-9]{8,9}$' then numero else '' end,
    coalesce(new.email, '')
  );
  return new;
end;
$$;

-- Mantém o e-mail do perfil igual ao da conta se o aluno trocar de e-mail.
create or replace function public.sincronizar_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.perfis set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists ao_trocar_email on auth.users;
create trigger ao_trocar_email
  after update of email on auth.users
  for each row execute function public.sincronizar_email();

-- Equipe = dono ou personal.
create or replace function public.eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = (select auth.uid()) and papel in ('dono', 'personal')
  );
$$;

revoke execute on function public.eh_equipe() from public, anon;
grant execute on function public.eh_equipe() to authenticated;

-- ---------------------------------------------------------------- a equipe lê os dados dos alunos

drop policy if exists "perfis: ler o próprio ou ser dono" on public.perfis;
drop policy if exists "perfis: ler o próprio ou ser da equipe" on public.perfis;
create policy "perfis: ler o próprio ou ser da equipe" on public.perfis
  for select to authenticated
  using (id = (select auth.uid()) or (select public.eh_equipe()));

drop policy if exists "pesos: ler os próprios ou ser dono" on public.pesos;
drop policy if exists "pesos: ler os próprios ou ser da equipe" on public.pesos;
create policy "pesos: ler os próprios ou ser da equipe" on public.pesos
  for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_equipe()));

drop policy if exists "checkins: ler os próprios ou ser dono" on public.checkins;
drop policy if exists "checkins: ler os próprios ou ser da equipe" on public.checkins;
create policy "checkins: ler os próprios ou ser da equipe" on public.checkins
  for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_equipe()));

drop policy if exists "sessoes: ler as próprias ou ser dono" on public.sessoes_treino;
drop policy if exists "sessoes: ler as próprias ou ser da equipe" on public.sessoes_treino;
create policy "sessoes: ler as próprias ou ser da equipe" on public.sessoes_treino
  for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_equipe()));

-- ---------------------------------------------------------------- fichas de treino

create table if not exists public.fichas_treino (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid        not null references public.perfis (id) on delete cascade,
  titulo        text        not null check (char_length(trim(titulo)) between 1 and 60),
  objetivo      text        not null default '' check (char_length(objetivo) <= 40),
  observacoes   text        not null default '' check (char_length(observacoes) <= 1000),
  inicio        date        not null,
  fim           date        not null,
  -- [{ letra, nome, dias: [0..4], exercicios: [{ id, nome, grupo, series, repeticoes, descanso, carga, observacao }] }]
  treinos       jsonb       not null check (jsonb_typeof(treinos) = 'array' and jsonb_array_length(treinos) between 1 and 6),
  criado_por    uuid        default auth.uid() references public.perfis (id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (fim >= inicio and fim - inicio <= 366)
);

create index if not exists fichas_treino_aluno_idx on public.fichas_treino (aluno_id, inicio desc);
create index if not exists fichas_treino_fim_idx on public.fichas_treino (fim);

drop trigger if exists fichas_treino_atualizado_em on public.fichas_treino;
create trigger fichas_treino_atualizado_em
  before update on public.fichas_treino
  for each row execute function public.tocar_atualizado_em();

alter table public.fichas_treino enable row level security;
revoke all on public.fichas_treino from anon;

drop policy if exists "fichas: o aluno vê as suas, a equipe vê todas" on public.fichas_treino;
create policy "fichas: o aluno vê as suas, a equipe vê todas" on public.fichas_treino
  for select to authenticated
  using (aluno_id = (select auth.uid()) or (select public.eh_equipe()));

drop policy if exists "fichas: a equipe cria" on public.fichas_treino;
create policy "fichas: a equipe cria" on public.fichas_treino
  for insert to authenticated
  with check ((select public.eh_equipe()));

drop policy if exists "fichas: a equipe edita" on public.fichas_treino;
create policy "fichas: a equipe edita" on public.fichas_treino
  for update to authenticated
  using ((select public.eh_equipe()))
  with check ((select public.eh_equipe()));

drop policy if exists "fichas: a equipe exclui" on public.fichas_treino;
create policy "fichas: a equipe exclui" on public.fichas_treino
  for delete to authenticated
  using ((select public.eh_equipe()));
