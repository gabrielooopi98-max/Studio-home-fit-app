-- Home Fit · telefone (WhatsApp) do aluno
-- Rode no SQL Editor do Supabase depois do 0001_inicial.sql.
-- Guardado só com números, com DDD: 10 dígitos (fixo) ou 11 (celular).

alter table public.perfis
  add column telefone text not null default ''
  check (telefone = '' or telefone ~ '^[1-9][0-9][0-9]{8,9}$');

-- O cadastro envia o telefone junto; números inválidos ficam vazios em vez de bloquear a conta.
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  numero text := regexp_replace(coalesce(new.raw_user_meta_data ->> 'telefone', ''), '[^0-9]', '', 'g');
begin
  insert into public.perfis (id, nome, telefone)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), 40),
    case when numero ~ '^[1-9][0-9][0-9]{8,9}$' then numero else '' end
  );
  return new;
end;
$$;

-- O aluno pode corrigir o próprio telefone pela aba Conta.
grant update (telefone) on public.perfis to authenticated;
