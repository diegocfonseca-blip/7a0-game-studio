-- 💳 PLANOS V2 (08/10, Diego): Gratuito · ⭐ Craque completo R$ 9,90/mês · 🖋 Batismo Lenda R$ 69,90 ·
-- 🖋✨ Batismo Plus R$ 79,99. Esta migração só ACRESCENTA: tabelas novas e funções novas. Nenhuma linha
-- antiga é tocada (user_colors, esc_socios, esc_fundadores ficam como estão — são os direitos de quem já
-- comprou, e eles valem pra sempre).
--
-- Três camadas SEPARADAS, de propósito:
--   1. LEGADO     → user_colors / esc_fundadores / esc_socios (o que já existia; nunca vence nem muda)
--   2. ASSINATURA → esc_assinaturas (Craque mensal; vence sozinho na data, sem apagar nada)
--   3. BATISMO NOVO → esc_compras_batismo (Lenda ou Plus; pra sempre)
-- e UMA função que junta tudo (`esc_direitos_de`). O jogo lê o resultado por `esc_meus_direitos()`.
--
-- Nada aqui libera benefício por clique, link ou volta do checkout: só o Diego (conta admin) registra
-- pagamento, e cada pagamento tem um ID único — o mesmo ID duas vezes não estende nada (idempotente).

-- ── contas que só existem na lista RESERVA do código (apoio.tsx FOUNDERS), sem linha em user_colors ──
-- Medido em 08/10: 2 ouro + 2 verde. Copiar pra cá deixa o servidor enxergar o mesmo que o jogo enxerga,
-- sem escrever nada em user_colors.
create table if not exists public.esc_legado_codigo (
  email text primary key,
  tier text not null check (tier in ('bege','verde','roxo','prata','ouro')),
  criado_em timestamptz not null default now()
);
alter table public.esc_legado_codigo enable row level security;
insert into public.esc_legado_codigo (email, tier) values
  ('chiarentin.dyno127@gmail.com', 'ouro'),
  ('delaofut@gmail.com', 'ouro'),
  ('brunomontoya011@gmail.com', 'verde'),
  ('beatrizsilvavieira624@gmail.com', 'verde')
on conflict (email) do nothing;

-- ── ⭐ assinatura do Craque completo (1 linha por conta) ──
create table if not exists public.esc_assinaturas (
  email text primary key,
  plano text not null default 'craque_mensal' check (plano = 'craque_mensal'),
  inicio timestamptz not null default now(),
  valido_ate timestamptz not null,
  cancelada_em timestamptz,          -- cancelou: continua valendo até valido_ate
  atualizado_em timestamptz not null default now()
);
alter table public.esc_assinaturas enable row level security;

-- ── 🧾 todo pagamento confirmado, com ID ÚNICO (Pix: id da transação · MP: id do pagamento) ──
create table if not exists public.esc_pagamentos (
  pagamento_id text primary key,
  email text not null,
  produto text not null check (produto in ('craque_mensal','batismo_lenda','batismo_plus')),
  valor numeric(10,2),
  meio text,
  periodo_ini timestamptz,
  periodo_fim timestamptz,
  criado_em timestamptz not null default now()
);
alter table public.esc_pagamentos enable row level security;

-- ── 🖋 batismos vendidos no formato novo (o antigo continua em esc_socios origem 'batismo') ──
create table if not exists public.esc_compras_batismo (
  email text primary key,
  plano text not null check (plano in ('lenda','plus')),
  desde timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.esc_compras_batismo enable row level security;

-- ── 📲 pedidos do mensal enquanto não há cobrança automática: a pessoa deixa o WhatsApp ──
create table if not exists public.esc_pedidos_craque (
  id bigserial primary key,
  user_id uuid not null,
  email text not null,
  whatsapp text not null,
  status text not null default 'novo' check (status in ('novo','link_enviado','pago','desistiu')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.esc_pedidos_craque enable row level security;
create index if not exists esc_pedidos_craque_email on public.esc_pedidos_craque (email);

-- ═══ a função que junta as três camadas ═══
-- ⚠️ interna: NÃO é liberada pra anon/authenticated (senão qualquer um consultaria o e-mail dos outros).
create or replace function public.esc_direitos_de(p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with e as (select lower(trim(coalesce(p_email, ''))) as email),
  x as (
    select
      coalesce((select c.tier from user_colors c, e where lower(c.email) = e.email limit 1),
               (select l.tier from esc_legado_codigo l, e where l.email = e.email)) as tier_legado,
      exists (select 1 from user_colors c, e where lower(c.email) = e.email and c.manual) as manual_col,
      exists (select 1 from esc_fundadores f, e where lower(f.email) = e.email) as fundador,
      exists (select 1 from esc_socios s, e where lower(s.email) = e.email and coalesce(s.valido_ate, current_date) >= current_date) as socio_ativo,
      exists (select 1 from esc_socios s, e where lower(s.email) = e.email and s.origem = 'batismo' and coalesce(s.valido_ate, current_date) >= current_date) as batismo_antigo,
      (select b.plano from esc_compras_batismo b, e where b.email = e.email) as batismo_plano,
      (select a.valido_ate from esc_assinaturas a, e where a.email = e.email) as craque_ate,
      (select a.cancelada_em from esc_assinaturas a, e where a.email = e.email) as craque_cancelada_em
  ),
  y as (
    select x.*,
      (craque_ate is not null and craque_ate > now()) as craque_ativo,
      (batismo_plano is not null or batismo_antigo) as batismo
    from x
  )
  select jsonb_build_object(
    'tier_legado', tier_legado,
    'fundador', fundador,
    'socio_ativo', socio_ativo,
    'batismo', batismo,
    'batismo_plano', coalesce(batismo_plano, case when batismo_antigo then 'antigo' end),
    'plus', coalesce(batismo_plano = 'plus', false),
    'craque_ativo', craque_ativo,
    'craque_ate', craque_ate,
    'craque_cancelada', craque_cancelada_em is not null,
    -- cor/tier na tela: o maior entre o que já tinha e o que a assinatura/batismo dá
    'tier', case when craque_ativo or batismo then 'ouro' else tier_legado end,
    'manual', manual_col or craque_ativo or batismo or coalesce(tier_legado in ('prata','ouro'), false),
    -- criar sala de modo pago (Minhas Ligas, Carreira Online, Bafo): assinatura, batismo ou qualquer
    -- direito antigo (Craque/Lenda permanente, fundador, sócio em dia)
    'salas_pagas', craque_ativo or batismo or fundador or socio_ativo or coalesce(tier_legado in ('prata','ouro'), false),
    -- nuvem nas carreiras novas (mesma régua de 07/10 + assinatura + batismo novo)
    'pago', craque_ativo or batismo_plano is not null or fundador or socio_ativo or coalesce(tier_legado in ('prata','ouro'), false)
  )
  from y
$$;
revoke all on function public.esc_direitos_de(text) from public, anon, authenticated;

-- o jogo lê os PRÓPRIOS direitos (+ o pedido do mensal, se tiver)
create or replace function public.esc_meus_direitos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.esc_direitos_de(auth.jwt() ->> 'email') || jsonb_build_object(
    'pedido', (select jsonb_build_object('status', p.status, 'criado_em', p.criado_em)
               from esc_pedidos_craque p
               where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', '')) and p.status in ('novo','link_enviado')
               order by p.criado_em desc limit 1)
  )
  where coalesce(auth.jwt() ->> 'email', '') <> ''
$$;
revoke all on function public.esc_meus_direitos() from public, anon;
grant execute on function public.esc_meus_direitos() to authenticated;

-- 📲 a pessoa deixa o WhatsApp pro Diego mandar o link do mensal. 1 pedido aberto por conta (atualiza).
create or replace function public.esc_pedir_craque(p_whatsapp text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_num text := regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g');
  v_id bigint;
begin
  if v_uid is null or v_email = '' then raise exception 'precisa entrar na conta'; end if;
  if length(v_num) < 10 or length(v_num) > 15 then raise exception 'whatsapp inválido'; end if;
  select id into v_id from esc_pedidos_craque where user_id = v_uid and status in ('novo','link_enviado') order by criado_em desc limit 1;
  if v_id is not null then
    update esc_pedidos_craque set whatsapp = v_num, atualizado_em = now() where id = v_id;
  else
    insert into esc_pedidos_craque (user_id, email, whatsapp) values (v_uid, v_email, v_num) returning id into v_id;
  end if;
  return jsonb_build_object('id', v_id, 'status', 'novo');
end;
$$;
revoke all on function public.esc_pedir_craque(text) from public, anon;
grant execute on function public.esc_pedir_craque(text) to authenticated;

-- ═══ só o Diego ═══
create or replace function public.esc_admin_pedidos_craque()
returns table (id bigint, email text, whatsapp text, status text, criado_em timestamptz, craque_ate timestamptz, craque_cancelada boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  return query
    select p.id, p.email, p.whatsapp, p.status, p.criado_em, a.valido_ate, a.cancelada_em is not null
    from esc_pedidos_craque p left join esc_assinaturas a on a.email = p.email
    order by (p.status in ('novo','link_enviado')) desc, p.criado_em desc
    limit 200;
end;
$$;
revoke all on function public.esc_admin_pedidos_craque() from public, anon;
grant execute on function public.esc_admin_pedidos_craque() to authenticated;

create or replace function public.esc_admin_pedido_status(p_id bigint, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  update esc_pedidos_craque set status = p_status, atualizado_em = now() where id = p_id;
end;
$$;
revoke all on function public.esc_admin_pedido_status(bigint, text) from public, anon;
grant execute on function public.esc_admin_pedido_status(bigint, text) to authenticated;

-- 💰 pagamento do mensal CONFIRMADO pelo Diego. Mesmo pagamento_id de novo = não faz nada (repetido).
-- O período novo começa no fim do período atual (se ainda vale) ou agora (se já venceu).
create or replace function public.esc_admin_craque_pagamento(p_email text, p_pagamento_id text, p_valor numeric default 9.90, p_meio text default 'pix', p_meses int default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id text := trim(coalesce(p_pagamento_id, ''));
  v_ini timestamptz;
  v_fim timestamptz;
  v_n int;
  v_ant esc_pagamentos;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  if length(v_id) < 3 then raise exception 'falta o ID do pagamento (o código da transação)'; end if;
  if p_meses < 1 or p_meses > 12 then raise exception 'meses fora do intervalo (1 a 12)'; end if;
  -- ⛔ a conta tem que existir ANTES (regra de 07/09: senão quem criar a conta com esse e-mail leva o plano)
  if not exists (select 1 from auth.users u where lower(u.email) = v_email) then raise exception 'não existe conta com o e-mail %', v_email; end if;
  perform pg_advisory_xact_lock(hashtext('craque:' || v_email));
  select * into v_ant from esc_pagamentos where pagamento_id = v_id;
  if found then
    return jsonb_build_object('repetido', true, 'email', v_ant.email, 'valido_ate', (select valido_ate from esc_assinaturas where email = v_ant.email));
  end if;
  select greatest(a.valido_ate, now()) into v_ini from esc_assinaturas a where a.email = v_email;
  v_ini := coalesce(v_ini, now());
  v_fim := v_ini + make_interval(months => p_meses);
  insert into esc_pagamentos (pagamento_id, email, produto, valor, meio, periodo_ini, periodo_fim)
  values (v_id, v_email, 'craque_mensal', p_valor, p_meio, v_ini, v_fim)
  on conflict (pagamento_id) do nothing;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    return jsonb_build_object('repetido', true, 'email', v_email, 'valido_ate', (select valido_ate from esc_assinaturas where email = v_email));
  end if;
  insert into esc_assinaturas (email, valido_ate) values (v_email, v_fim)
  on conflict (email) do update set valido_ate = excluded.valido_ate, cancelada_em = null, atualizado_em = now();
  update esc_pedidos_craque set status = 'pago', atualizado_em = now() where email = v_email and status in ('novo','link_enviado');
  return jsonb_build_object('repetido', false, 'email', v_email, 'valido_ate', v_fim);
end;
$$;
revoke all on function public.esc_admin_craque_pagamento(text, text, numeric, text, int) from public, anon;
grant execute on function public.esc_admin_craque_pagamento(text, text, numeric, text, int) to authenticated;

-- ✋ cancelou: marca, mas CONTINUA valendo até o fim do que foi pago. Nada é apagado.
create or replace function public.esc_admin_craque_cancelar(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_ate timestamptz;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  update esc_assinaturas set cancelada_em = coalesce(cancelada_em, now()), atualizado_em = now()
  where email = lower(trim(p_email)) returning valido_ate into v_ate;
  return jsonb_build_object('valido_ate', v_ate);
end;
$$;
revoke all on function public.esc_admin_craque_cancelar(text) from public, anon;
grant execute on function public.esc_admin_craque_cancelar(text) to authenticated;

-- 🖋 batismo novo pago (Lenda ou Plus). Nunca rebaixa (Plus continua Plus). ID repetido = nada.
-- ⚠️ isto é SÓ a perna do direito. O roteiro do batismo (arte, user_colors ouro, esc_socios, fundador,
-- nome reservado) continua sendo feito como sempre — ver CLAUDE.md.
create or replace function public.esc_admin_batismo_compra(p_email text, p_plano text, p_pagamento_id text, p_valor numeric default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id text := trim(coalesce(p_pagamento_id, ''));
  v_n int;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  if p_plano not in ('lenda','plus') then raise exception 'plano inválido (lenda ou plus)'; end if;
  if length(v_id) < 3 then raise exception 'falta o ID do pagamento'; end if;
  if not exists (select 1 from auth.users u where lower(u.email) = v_email) then raise exception 'não existe conta com o e-mail %', v_email; end if;
  insert into esc_pagamentos (pagamento_id, email, produto, valor, meio)
  values (v_id, v_email, 'batismo_' || p_plano, p_valor, 'pix')
  on conflict (pagamento_id) do nothing;
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('repetido', true); end if;
  insert into esc_compras_batismo (email, plano) values (v_email, p_plano)
  on conflict (email) do update set plano = case when esc_compras_batismo.plano = 'plus' then 'plus' else excluded.plano end, atualizado_em = now();
  return jsonb_build_object('repetido', false, 'plano', (select plano from esc_compras_batismo where email = v_email));
end;
$$;
revoke all on function public.esc_admin_batismo_compra(text, text, text, numeric) from public, anon;
grant execute on function public.esc_admin_batismo_compra(text, text, text, numeric) to authenticated;

-- ☁️ a régua da nuvem (07/10) passa a enxergar a assinatura e o batismo novo. Continua a mesma pra todo
-- mundo que já existe (as condições antigas estão todas dentro de esc_direitos_de → 'pago').
create or replace function public.esc_nuvem_regra()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with eu as (select auth.uid() as uid, lower(coalesce((select email from auth.users where id = auth.uid()), '')) as email),
  sv as (select p.save from esc_pyramid_saves p, eu where p.user_id = eu.uid)
  select jsonb_build_object(
    'pago', coalesce((select (public.esc_direitos_de(eu.email) ->> 'pago')::boolean from eu), false),
    'seeds', coalesce((
      select jsonb_agg(x) from (
        select (c->'save'->>'seed')::bigint as x from sv, jsonb_array_elements(case when jsonb_typeof(sv.save->'careers') = 'array' then sv.save->'careers' else '[]'::jsonb end) c
        where c->'save'->>'seed' ~ '^-?[0-9]+$'
        union
        select (sv.save->>'seed')::bigint from sv where sv.save->>'seed' ~ '^-?[0-9]+$'
      ) q), '[]'::jsonb)
  )
$$;
grant execute on function public.esc_nuvem_regra() to authenticated;
