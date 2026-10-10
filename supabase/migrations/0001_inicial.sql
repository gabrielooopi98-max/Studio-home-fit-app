-- Home Fit · esquema inicial
-- Rode este arquivo inteiro no SQL Editor do Supabase (ou com `supabase db push`).
-- Cada aluno só enxerga e altera os próprios dados (RLS). Quem tem papel 'dono'
-- pode LER os dados de todos os alunos, para o futuro painel da academia.

-- ---------------------------------------------------------------- tabelas

create table public.perfis (
  id            uuid primary key references auth.users (id) on delete cascade,
  nome          text        not null default '' check (char_length(nome) <= 40),
  meta_semanal  smallint    not null default 3  check (meta_semanal between 1 and 5),
  papel         text        not null default 'aluno' check (papel in ('aluno', 'dono')),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.pesos (
  usuario_id uuid         not null default auth.uid() references auth.users (id) on delete cascade,
  dia        date         not null,
  kg         numeric(5,2) not null check (kg > 0 and kg <= 400),
  primary key (usuario_id, dia)
);

create table public.checkins (
  usuario_id uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  dia        date        not null,
  criado_em  timestamptz not null default now(),
  primary key (usuario_id, dia)
);

create table public.sessoes_treino (
  usuario_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  dia           date        not null,
  inicio        timestamptz,
  fim           timestamptz,
  exercicios    jsonb       not null default '{}'::jsonb check (jsonb_typeof(exercicios) = 'object'),
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, dia),
  check (fim is null or inicio is null or fim >= inicio)
);

-- ---------------------------------------------------------------- gatilhos

create function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.tocar_atualizado_em();

create trigger sessoes_treino_atualizado_em
  before update on public.sessoes_treino
  for each row execute function public.tocar_atualizado_em();

-- Cria o perfil assim que a conta é criada (o nome vem do formulário de cadastro).
create function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, left(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), 40));
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------- permissões

create function public.eh_dono()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = (select auth.uid()) and papel = 'dono'
  );
$$;

revoke execute on function public.eh_dono() from public, anon;
grant execute on function public.eh_dono() to authenticated;

alter table public.perfis         enable row level security;
alter table public.pesos          enable row level security;
alter table public.checkins       enable row level security;
alter table public.sessoes_treino enable row level security;

-- Visitantes sem login não acessam nada.
revoke all on public.perfis, public.pesos, public.checkins, public.sessoes_treino from anon;

-- O aluno só pode mudar nome e meta; o papel ('dono') nunca é alterável pelo app.
revoke insert, update, delete on public.perfis from authenticated;
grant update (nome, meta_semanal) on public.perfis to authenticated;

-- Check-ins e treinos finalizados não são apagados pelo app.
revoke delete on public.checkins, public.sessoes_treino from authenticated;

-- perfis
create policy "perfis: ler o próprio ou ser dono" on public.perfis
  for select to authenticated
  using (id = (select auth.uid()) or (select public.eh_dono()));

create policy "perfis: alterar o próprio" on public.perfis
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- pesos
create policy "pesos: ler os próprios ou ser dono" on public.pesos
  for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_dono()));

create policy "pesos: registrar os próprios" on public.pesos
  for insert to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "pesos: corrigir os próprios" on public.pesos
  for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "pesos: apagar os próprios" on public.pesos
  for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- checkins
create policy "checkins: ler os próprios ou ser dono" on public.checkins
  for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_dono()));

create policy "checkins: registrar os próprios" on public.checkins
  for insert to authenticated
  with check (usuario_id = (select auth.uid()));

-- sessoes_treino: depois de finalizada (fim preenchido) a sessão fica travada.
create policy "sessoes: ler as próprias ou ser dono" on public.sessoes_treino
  for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_dono()));

create policy "sessoes: criar as próprias" on public.sessoes_treino
  for insert to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "sessoes: alterar as próprias em andamento" on public.sessoes_treino
  for update to authenticated
  using (usuario_id = (select auth.uid()) and fim is null)
  with check (usuario_id = (select auth.uid()));
