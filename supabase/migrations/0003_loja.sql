-- Home Fit · loja de suplementos
-- Rode no SQL Editor do Supabase depois do 0001 e do 0002.
-- Modelo: o aluno reserva pelo app, paga no balcão e retira na academia.
-- Preço e estoque são sempre decididos aqui no banco (funções abaixo), nunca pelo app.

-- ---------------------------------------------------------------- tabelas

create table public.produtos (
  id                    uuid primary key default gen_random_uuid(),
  nome                  text        not null check (char_length(trim(nome)) between 2 and 80),
  marca                 text        not null default '' check (char_length(marca) <= 40),
  descricao             text        not null default '' check (char_length(descricao) <= 1000),
  categoria             text        not null default 'outros' check (categoria in (
                          'proteinas', 'creatina', 'pre-treino', 'aminoacidos', 'vitaminas', 'acessorios', 'outros')),
  preco_centavos        integer     not null check (preco_centavos between 1 and 10000000),
  preco_antigo_centavos integer     check (preco_antigo_centavos is null or preco_antigo_centavos > preco_centavos),
  estoque               integer     not null default 0 check (estoque >= 0),
  imagem_url            text        not null default '' check (char_length(imagem_url) <= 500),
  ativo                 boolean     not null default true,
  destaque              boolean     not null default false,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

create table public.pedidos (
  id             uuid primary key default gen_random_uuid(),
  numero         bigint generated always as identity unique,
  usuario_id     uuid        not null references public.perfis (id) on delete cascade,
  status         text        not null default 'recebido'
                   check (status in ('recebido', 'separado', 'retirado', 'cancelado')),
  total_centavos integer     not null check (total_centavos >= 0),
  observacao     text        not null default '' check (char_length(observacao) <= 300),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create index pedidos_usuario_idx on public.pedidos (usuario_id, criado_em desc);
create index pedidos_status_idx on public.pedidos (status, criado_em desc);

-- Nome e preço ficam copiados no item: o pedido não muda se o produto for editado depois.
create table public.itens_pedido (
  id             bigint generated always as identity primary key,
  pedido_id      uuid    not null references public.pedidos (id) on delete cascade,
  produto_id     uuid    references public.produtos (id) on delete set null,
  nome           text    not null,
  preco_centavos integer not null check (preco_centavos > 0),
  quantidade     integer not null check (quantidade between 1 and 20)
);

create index itens_pedido_pedido_idx on public.itens_pedido (pedido_id);
create index itens_pedido_produto_idx on public.itens_pedido (produto_id);

create trigger produtos_atualizado_em
  before update on public.produtos
  for each row execute function public.tocar_atualizado_em();

create trigger pedidos_atualizado_em
  before update on public.pedidos
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------- permissões

alter table public.produtos     enable row level security;
alter table public.pedidos      enable row level security;
alter table public.itens_pedido enable row level security;

revoke all on public.produtos, public.pedidos, public.itens_pedido from anon;
-- Pedidos só nascem e mudam pelas funções abaixo.
revoke insert, update, delete on public.pedidos, public.itens_pedido from authenticated;

create policy "produtos: alunos veem os ativos, dono vê todos" on public.produtos
  for select to authenticated
  using (ativo or (select public.eh_dono()));

create policy "produtos: dono cadastra" on public.produtos
  for insert to authenticated
  with check ((select public.eh_dono()));

create policy "produtos: dono edita" on public.produtos
  for update to authenticated
  using ((select public.eh_dono()))
  with check ((select public.eh_dono()));

create policy "produtos: dono exclui" on public.produtos
  for delete to authenticated
  using ((select public.eh_dono()));

create policy "pedidos: o próprio aluno ou o dono" on public.pedidos
  for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_dono()));

create policy "itens: do pedido do próprio aluno ou do dono" on public.itens_pedido
  for select to authenticated
  using (exists (
    select 1 from public.pedidos p
    where p.id = pedido_id and (p.usuario_id = (select auth.uid()) or (select public.eh_dono()))
  ));

-- ---------------------------------------------------------------- funções

-- Cria o pedido inteiro de uma vez: confere produtos, trava e baixa o estoque e calcula o total.
-- Se qualquer item falhar, nada é gravado.
create function public.criar_pedido(p_itens jsonb, p_observacao text default '')
returns public.pedidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_item    record;
  v_produto public.produtos;
  v_total   integer := 0;
  v_pedido  public.pedidos;
begin
  if v_usuario is null then
    raise exception 'Faça login para reservar produtos.' using errcode = '28000';
  end if;
  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Seu carrinho está vazio.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_itens) > 30 then
    raise exception 'Pedido com itens demais.' using errcode = '22023';
  end if;

  insert into public.pedidos (usuario_id, total_centavos, observacao)
  values (v_usuario, 0, left(trim(coalesce(p_observacao, '')), 300))
  returning * into v_pedido;

  -- Junta linhas repetidas do mesmo produto e trava as linhas em ordem fixa (evita deadlock).
  for v_item in
    select (elemento ->> 'produto_id')::uuid as produto_id,
           sum((elemento ->> 'quantidade')::integer)::integer as quantidade
    from jsonb_array_elements(p_itens) as elemento
    group by 1
    order by 1
  loop
    if v_item.produto_id is null or v_item.quantidade is null or v_item.quantidade < 1 or v_item.quantidade > 20 then
      raise exception 'Quantidade inválida no carrinho.' using errcode = '22023';
    end if;

    select * into v_produto from public.produtos
    where id = v_item.produto_id and ativo
    for update;

    if not found then
      raise exception 'Um produto do carrinho não está mais disponível.' using errcode = 'P0002';
    end if;
    if v_produto.estoque < v_item.quantidade then
      raise exception 'Estoque insuficiente de %: restam %.', v_produto.nome, v_produto.estoque using errcode = 'P0001';
    end if;

    update public.produtos set estoque = estoque - v_item.quantidade where id = v_produto.id;
    insert into public.itens_pedido (pedido_id, produto_id, nome, preco_centavos, quantidade)
    values (v_pedido.id, v_produto.id, v_produto.nome, v_produto.preco_centavos, v_item.quantidade);
    v_total := v_total + v_produto.preco_centavos * v_item.quantidade;
  end loop;

  update public.pedidos set total_centavos = v_total where id = v_pedido.id returning * into v_pedido;
  return v_pedido;
end;
$$;

-- O aluno cancela enquanto o pedido não foi separado; o dono cancela até a retirada.
-- O estoque volta para a prateleira.
create function public.cancelar_pedido(p_pedido uuid)
returns public.pedidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos;
  v_dono   boolean := public.eh_dono();
begin
  select * into v_pedido from public.pedidos where id = p_pedido for update;

  if not found or (v_pedido.usuario_id is distinct from auth.uid() and not v_dono) then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;
  if v_pedido.status = 'cancelado' then
    return v_pedido;
  end if;
  if v_pedido.status = 'retirado' then
    raise exception 'Este pedido já foi retirado.' using errcode = 'P0001';
  end if;
  if v_pedido.status = 'separado' and not v_dono then
    raise exception 'Seu pedido já foi separado. Fale com a recepção para cancelar.' using errcode = 'P0001';
  end if;

  update public.produtos p
  set estoque = p.estoque + i.quantidade
  from (
    select produto_id, sum(quantidade)::integer as quantidade
    from public.itens_pedido
    where pedido_id = v_pedido.id and produto_id is not null
    group by produto_id
  ) i
  where p.id = i.produto_id;

  update public.pedidos set status = 'cancelado' where id = v_pedido.id returning * into v_pedido;
  return v_pedido;
end;
$$;

-- Só o dono avança o pedido: recebido → separado → retirado (e pode voltar de separado para recebido).
create function public.atualizar_status_pedido(p_pedido uuid, p_status text)
returns public.pedidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos;
begin
  if not public.eh_dono() then
    raise exception 'Apenas a academia pode alterar pedidos.' using errcode = '42501';
  end if;
  if p_status not in ('recebido', 'separado', 'retirado') then
    raise exception 'Status inválido. Para cancelar, use o cancelamento.' using errcode = '22023';
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido for update;
  if not found then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;
  if v_pedido.status in ('retirado', 'cancelado') then
    raise exception 'Pedido já finalizado não pode mudar de status.' using errcode = 'P0001';
  end if;

  update public.pedidos set status = p_status where id = v_pedido.id returning * into v_pedido;
  return v_pedido;
end;
$$;

revoke execute on function public.criar_pedido(jsonb, text) from public, anon;
revoke execute on function public.cancelar_pedido(uuid) from public, anon;
revoke execute on function public.atualizar_status_pedido(uuid, text) from public, anon;
grant execute on function public.criar_pedido(jsonb, text) to authenticated;
grant execute on function public.cancelar_pedido(uuid) to authenticated;
grant execute on function public.atualizar_status_pedido(uuid, text) to authenticated;

-- ---------------------------------------------------------------- fotos dos produtos

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "fotos de produtos: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'produtos' and (select public.eh_dono()));

create policy "fotos de produtos: dono troca" on storage.objects
  for update to authenticated
  using (bucket_id = 'produtos' and (select public.eh_dono()));

create policy "fotos de produtos: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'produtos' and (select public.eh_dono()));
