-- 💳 MERCADO PAGO · PIX ÚNICO (15/10). Diego: *"não vou mais fazer pela Vendria. Irei fazer pelo Mercado Pago, somente
-- Pix direto"* e *"todos os meus pagamentos não têm nada mensal, é tudo no Pix. Pix único só"*.
--
-- Como funciona (o cliente NUNCA decide preço nem libera nada):
--   1. o jogo pede um Pix pra Edge Function `mp-criar-pix` (com login). Ela chama `esc_mp_criar_pedido`, que CALCULA o
--      preço aqui no banco (tabela de preço + subida pela diferença + R$ 5) e grava o pedido; depois cria o Pix no MP.
--   2. o MP avisa a Edge Function `mp-webhook` (assinatura conferida). Ela BUSCA o pagamento no MP (a fonte da verdade)
--      e chama `esc_mp_registrar_pagamento`: só conta se estiver APROVADO e o VALOR bater com o do pedido.
--   3. pago → se `esc_mp_config.auto_liberar` estiver ligado, entrega na hora; senão fica 'pago' esperando o Diego
--      apertar LIBERAR no #admin (`esc_admin_mp_liberar`). Começa DESLIGADO até ele decidir.
-- Batismo/Fundador: o pagamento registra o direito (`esc_compras_batismo`) e o ouro; a arte, o nome reservado, o sócio
-- e o nº de fundador continuam no roteiro de batismo (precisam do Diego e de deploy).

create table if not exists public.esc_mp_config (
  id boolean primary key default true check (id),
  auto_liberar boolean not null default false,
  atualizado_em timestamptz not null default now()
);
insert into public.esc_mp_config (id) values (true) on conflict do nothing;
alter table public.esc_mp_config enable row level security;

create table if not exists public.esc_mp_pedidos (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  produto text not null check (produto in ('craque','lenda','batismo','fundador','salas_extras','teste')),
  valor numeric(10,2) not null check (valor > 0),
  status text not null default 'criado' check (status in ('criado','pago','liberado','divergente','cancelado')),
  mp_payment_id text unique,
  mp_status text,
  criado_em timestamptz not null default now(),
  pago_em timestamptz,
  liberado_em timestamptz,
  liberado_por text,
  detalhe jsonb
);
create index if not exists esc_mp_pedidos_email on public.esc_mp_pedidos (lower(email), criado_em desc);
alter table public.esc_mp_pedidos enable row level security; -- sem política: só o servidor lê/escreve

-- o registro de pagamentos passa a aceitar os produtos do Pix único
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check
  check (produto in ('craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste'));

-- 💰 preço de um produto PRA ESSA CONTA (a mesma régua de `PRECOS_UNICO`/`precoSubida`/`TAXA_SUBIDA` do planos-regras.ts)
-- null = não pode comprar (já tem esse plano ou maior, ou produto de teste fora da conta do Diego)
create or replace function public.esc_mp_preco(p_email text, p_produto text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  precos numeric[] := array[29.90, 49.90, 79.90, 99.90]; -- craque, lenda, batismo, fundador
  alvo int; atual int;
begin
  if p_produto = 'salas_extras' then return 4.90; end if;
  if p_produto = 'teste' then
    return case when lower(p_email) = 'diego.c.fonseca@gmail.com' then 1.00 else null end;
  end if;
  alvo := case p_produto when 'craque' then 1 when 'lenda' then 2 when 'batismo' then 3 when 'fundador' then 4 else null end;
  if alvo is null then return null; end if;
  atual := coalesce(public.esc_plano_rank(p_email), 0);
  if alvo <= atual then return null; end if;
  if atual = 0 then return precos[alvo]; end if;
  return precos[alvo] - precos[atual] + 5; -- subida = a diferença + R$ 5 (Diego 14/10)
end $$;
revoke all on function public.esc_mp_preco(text, text) from public, anon, authenticated;

-- 🧾 cria o pedido (só o servidor chama, depois de conferir o login)
create or replace function public.esc_mp_criar_pedido(p_email text, p_produto text)
returns table (pedido_id uuid, valor numeric) language plpgsql security definer set search_path = public as $$
declare v numeric; e text := lower(trim(p_email));
begin
  if not exists (select 1 from auth.users u where lower(u.email) = e) then raise exception 'SEM_CONTA'; end if;
  v := public.esc_mp_preco(e, p_produto);
  if v is null then raise exception 'JA_TEM_OU_INVALIDO'; end if;
  return query insert into public.esc_mp_pedidos (email, produto, valor) values (e, p_produto, v) returning id, esc_mp_pedidos.valor;
end $$;
revoke all on function public.esc_mp_criar_pedido(text, text) from public, anon, authenticated;

create or replace function public.esc_mp_anota_pix(p_pedido uuid, p_mp_id text, p_mp_status text)
returns void language sql security definer set search_path = public as $$
  update public.esc_mp_pedidos set mp_payment_id = p_mp_id, mp_status = p_mp_status where id = p_pedido and mp_payment_id is null;
$$;
revoke all on function public.esc_mp_anota_pix(uuid, text, text) from public, anon, authenticated;

-- 🎁 entrega o produto (interno)
create or replace function public.esc_mp_entregar(p_pedido uuid, p_quem text)
returns text language plpgsql security definer set search_path = public as $$
declare p public.esc_mp_pedidos; rk int;
begin
  select * into p from public.esc_mp_pedidos where id = p_pedido for update;
  if not found then return 'sem_pedido'; end if;
  if p.status = 'liberado' then return 'ja_liberado'; end if;
  if p.status <> 'pago' then return 'nao_pago'; end if;
  rk := coalesce(public.esc_plano_rank(p.email), 0);
  if p.produto = 'craque' and rk < 1 then
    insert into public.user_colors (email, tier, manual, updated_at) values (p.email, 'prata', true, now())
      on conflict (email) do update set tier = 'prata', manual = true, updated_at = now();
  elsif p.produto in ('lenda', 'batismo', 'fundador') and rk < 2 then
    insert into public.user_colors (email, tier, manual, updated_at) values (p.email, 'ouro', true, now())
      on conflict (email) do update set tier = 'ouro', manual = true, updated_at = now();
  end if;
  if p.produto in ('batismo', 'fundador') then
    insert into public.esc_compras_batismo (email, plano) values (p.email, case p.produto when 'fundador' then 'plus' else 'lenda' end)
      on conflict (email) do update set plano = case when esc_compras_batismo.plano = 'plus' then 'plus' else excluded.plano end, atualizado_em = now();
  elsif p.produto = 'salas_extras' then
    insert into public.esc_salas_extras (email, saldo, atualizado_em) values (p.email, 3, now())
      on conflict (email) do update set saldo = esc_salas_extras.saldo + 3, atualizado_em = now();
  end if;
  update public.esc_mp_pedidos set status = 'liberado', liberado_em = now(), liberado_por = p_quem where id = p_pedido;
  return 'liberado';
end $$;
revoke all on function public.esc_mp_entregar(uuid, text) from public, anon, authenticated;

-- 📬 o webhook chama isto com o que o MERCADO PAGO disse (nunca com o que o cliente disse)
create or replace function public.esc_mp_registrar_pagamento(p_pedido uuid, p_mp_id text, p_mp_status text, p_valor numeric, p_payload jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare p public.esc_mp_pedidos;
begin
  select * into p from public.esc_mp_pedidos where id = p_pedido for update;
  if not found then return 'sem_pedido'; end if;
  if p.mp_payment_id is not null and p.mp_payment_id <> p_mp_id then return 'outro_pagamento'; end if;
  update public.esc_mp_pedidos set mp_payment_id = p_mp_id, mp_status = p_mp_status, detalhe = p_payload where id = p_pedido;
  if p.status in ('pago', 'liberado') or p_mp_status <> 'approved' then return 'ok_' || coalesce(p_mp_status, '?'); end if;
  if round(p_valor, 2) <> p.valor then
    update public.esc_mp_pedidos set status = 'divergente' where id = p_pedido;
    return 'valor_divergente';
  end if;
  update public.esc_mp_pedidos set status = 'pago', pago_em = now() where id = p_pedido;
  insert into public.esc_pagamentos (pagamento_id, email, produto, valor, meio)
    values ('mp:' || p_mp_id, p.email, case p.produto when 'batismo' then 'batismo_lenda' when 'fundador' then 'batismo_plus' else p.produto end, p.valor, 'pix')
    on conflict (pagamento_id) do nothing;
  if (select auto_liberar from public.esc_mp_config where id) then
    return public.esc_mp_entregar(p_pedido, 'auto');
  end if;
  return 'pago_aguardando';
end $$;
revoke all on function public.esc_mp_registrar_pagamento(uuid, text, text, numeric, jsonb) from public, anon, authenticated;

-- 👀 o jogo pergunta "já caiu?" — só enxerga pedido da PRÓPRIA conta
create or replace function public.esc_mp_meu_pedido(p_id uuid)
returns table (status text, produto text, valor numeric) language sql stable security definer set search_path = public as $$
  select status, produto, valor from public.esc_mp_pedidos where id = p_id and email = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;
revoke all on function public.esc_mp_meu_pedido(uuid) from public, anon;
grant execute on function public.esc_mp_meu_pedido(uuid) to authenticated;

-- 🛠️ #admin: lista e botão de liberar (só a conta do Diego)
create or replace function public.esc_admin_mp_lista()
returns setof public.esc_mp_pedidos language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  return query select * from public.esc_mp_pedidos where status <> 'criado' or criado_em > now() - interval '1 day' order by criado_em desc limit 100;
end $$;
revoke all on function public.esc_admin_mp_lista() from public, anon;
grant execute on function public.esc_admin_mp_lista() to authenticated;

create or replace function public.esc_admin_mp_liberar(p_pedido uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  return public.esc_mp_entregar(p_pedido, 'admin');
end $$;
revoke all on function public.esc_admin_mp_liberar(uuid) from public, anon;
grant execute on function public.esc_admin_mp_liberar(uuid) to authenticated;
