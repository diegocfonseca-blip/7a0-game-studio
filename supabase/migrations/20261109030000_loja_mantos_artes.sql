-- 🎽🐾🛡️🎬 09/11 (Diego aprovou o mockup scripts/mockups/loja-mantos-mascote-gala.png: "pode aprovar tudo já")
-- LOJA DO CLUBE, aba "Seu clube": MANTOS (1ª e 2ª camisa, 2 ou 3 cores), MASCOTE, ESCUDO e ENTRADA DE GALA personalizados.
--  · 🎽 manto_camisa (ref '1' | '2') R$ 9,90 · manto_duas R$ 14,90 — quem tem Batismo/Fundador já tem a 1ª (o manto do batismo).
--    A camisa veste a bolinha do Campo 2D (e o jogo do mapa) e a cartinha sem rosto. A 2ª entra quando a 1ª bate com a do rival.
--  · 🐾 mascote_clube R$ 29,90 · 🛡️ escudo_clube R$ 19,90 · 🎬 gala_clube R$ 49,90 — a arte é feita pelo Diego (igual ao Fundador:
--    a pessoa paga, escreve a ideia e o Diego faz). 🔒 GALA SÓ COM MASCOTE (Diego: "pra ter entrada de gala tem que ter mascote…
--    não dá nem pra pagar quem não tem mascote ainda") — sem mascote o preço é nulo (sem Pix).

create table if not exists public.esc_kits_conta (
  email text primary key,
  tem1 boolean not null default false,
  tem2 boolean not null default false,
  k1 text[],           -- null = a 1ª é o manto do batismo (esc_socios)
  k2 text[],
  atualizado_em timestamptz not null default now()
);
alter table public.esc_kits_conta enable row level security; -- sem política: só as funções leem/escrevem

create table if not exists public.esc_artes_conta (
  email text not null,
  item text not null check (item in ('mascote','escudo','gala')),
  status text not null default 'producao' check (status in ('producao','pronto')),
  pedido_id uuid,
  criado_em timestamptz not null default now(),
  primary key (email, item)
);
alter table public.esc_artes_conta enable row level security;

-- produto novo nos dois filtros (lista = a de 05/11 + os 5 de hoje)
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora','recado_hora','recado_dia',
  'peca_presidente','escudo_cla','cla_extra','cla_criar','manual_24h','cor_extra','doacao_luca',
  'manto_camisa','manto_duas','mascote_clube','escudo_clube','gala_clube'])) not valid;
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check check (produto = any (array[
  'craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste','moedas_10','moedas_50','moedas_100',
  'moedas_500','moedas_1000','canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora',
  'recado_hora','recado_dia','peca_presidente','escudo_cla','cla_extra','cla_criar','manual_24h','cor_extra','doacao_luca',
  'manto_camisa','manto_duas','mascote_clube','escudo_clube','gala_clube'])) not valid;

-- 👀 o que a conta JÁ tem (manto do batismo conta como 1ª camisa; mascote/escudo do batismo contam; Fundador já tem a gala)
create or replace function public.esc_loja_clube_de(p_email text) returns jsonb
language sql stable security definer set search_path = public as $$
  with e as (select lower(p_email) em),
  s as (select s.* from esc_socios s, e where lower(s.email) = e.em and (s.valido_ate is null or s.valido_ate > now()) limit 1),
  k as (select k.* from esc_kits_conta k, e where k.email = e.em)
  select jsonb_build_object(
    'manto_batismo', case when (select manto_c1 from s) is not null and (select manto_c2 from s) is not null
                          then to_jsonb(array[(select manto_c1 from s), (select manto_c2 from s)]) end,
    'tem1', coalesce((select tem1 from k), false) or ((select manto_c1 from s) is not null and (select manto_c2 from s) is not null),
    'tem2', coalesce((select tem2 from k), false),
    'k1', (select to_jsonb(k1) from k),
    'k2', (select to_jsonb(k2) from k),
    'mascote', (select mascote_key from s) is not null or exists (select 1 from esc_artes_conta a, e where a.email = e.em and a.item = 'mascote'),
    'escudo', (select escudo_time from s) is not null or exists (select 1 from esc_artes_conta a, e where a.email = e.em and a.item = 'escudo'),
    'gala', coalesce(public.esc_plano_rank(p_email), 0) >= 4 or exists (select 1 from esc_artes_conta a, e where a.email = e.em and a.item = 'gala'),
    'producao', coalesce((select jsonb_agg(a.item) from esc_artes_conta a, e where a.email = e.em and a.status = 'producao'), '[]'::jsonb))
  -- 🔒 de fora, cada conta só lê a PRÓPRIA (o servidor — Pix/preço — lê qualquer uma)
  where auth.jwt() is null or coalesce(auth.jwt() ->> 'role', '') = 'service_role' or lower(auth.jwt() ->> 'email') = lower(p_email)
$$;

create or replace function public.esc_meus_kits() returns jsonb
language sql stable security definer set search_path = public as $$
  select public.esc_loja_clube_de(u.email) from auth.users u where u.id = auth.uid()
$$;
grant execute on function public.esc_meus_kits() to authenticated;

-- ✏️ salva as cores de uma camisa (2 ou 3 cores #rrggbb). Só camisa que é dela.
-- A 1ª do BATISMO não se edita (é a medida na arte dele); dá pra trocar a ORDEM com a 2ª.
create or replace function public.esc_kit_salvar(p_slot int, p_cores text[]) returns boolean
language plpgsql security definer set search_path = public as $$
declare em text; j jsonb; n int;
begin
  select lower(email) into em from auth.users where id = auth.uid();
  if em is null or p_slot not in (1, 2) then return false; end if;
  n := coalesce(array_length(p_cores, 1), 0);
  if n < 2 or n > 3 then return false; end if;
  if exists (select 1 from unnest(p_cores) c where c !~* '^#[0-9a-f]{6}$') then return false; end if;
  j := public.esc_loja_clube_de(em);
  if p_slot = 1 then
    if not coalesce((j ->> 'tem1')::boolean, false) then return false; end if;
    if j -> 'k1' is null and j -> 'manto_batismo' is not null then return false; end if; -- a 1ª do batismo é fixa
  else
    if not coalesce((j ->> 'tem2')::boolean, false) then return false; end if;
  end if;
  insert into esc_kits_conta (email, tem1, tem2, k1, k2) values (em, p_slot = 1, p_slot = 2,
    case when p_slot = 1 then p_cores end, case when p_slot = 2 then p_cores end)
  on conflict (email) do update set
    k1 = case when p_slot = 1 then p_cores else esc_kits_conta.k1 end,
    k2 = case when p_slot = 2 then p_cores else esc_kits_conta.k2 end,
    atualizado_em = now();
  return true;
end $$;
grant execute on function public.esc_kit_salvar(int, text[]) to authenticated;

-- ⇅ troca a ORDEM (quem tem as duas). A tela manda as duas como estão AGORA (a do batismo vai com a 3ª cor que só o código sabe).
create or replace function public.esc_kit_trocar(p_k1 text[], p_k2 text[]) returns boolean
language plpgsql security definer set search_path = public as $$
declare em text; j jsonb;
begin
  select lower(email) into em from auth.users where id = auth.uid();
  if em is null then return false; end if;
  j := public.esc_loja_clube_de(em);
  if not (coalesce((j ->> 'tem1')::boolean, false) and coalesce((j ->> 'tem2')::boolean, false)) then return false; end if;
  if coalesce(array_length(p_k1, 1), 0) not between 2 and 3 or coalesce(array_length(p_k2, 1), 0) not between 2 and 3 then return false; end if;
  if exists (select 1 from unnest(p_k1 || p_k2) c where c !~* '^#[0-9a-f]{6}$') then return false; end if;
  insert into esc_kits_conta (email, tem1, tem2, k1, k2) values (em, true, true, p_k2, p_k1)
  on conflict (email) do update set k1 = p_k2, k2 = p_k1, tem1 = true, tem2 = true, atualizado_em = now();
  return true;
end $$;
grant execute on function public.esc_kit_trocar(text[], text[]) to authenticated;

-- 🏟️ as camisas de cada assento da sala (a do batismo + as compradas). A v1 (`esc_mantos_sala`) segue como está pro código velho.
create or replace function public.esc_mantos_sala2(p_room uuid) returns table(player_index integer, k1 text[], k2 text[])
language sql stable security definer set search_path = public as $$
  select rp.player_index,
    coalesce(k.k1, case when s.manto_c1 is not null and s.manto_c2 is not null then array[s.manto_c1, s.manto_c2] end),
    case when k.tem2 then k.k2 end
  from room_players rp
  join auth.users u on u.id = rp.user_id
  left join esc_socios s on lower(s.email) = lower(u.email) and (s.valido_ate is null or s.valido_ate > now())
  left join esc_kits_conta k on k.email = lower(u.email)
  where rp.room_id = p_room
    and (k.k1 is not null or k.k2 is not null or (s.manto_c1 is not null and s.manto_c2 is not null))
$$;
grant execute on function public.esc_mantos_sala2(uuid) to authenticated, anon;

-- 💰 preço (nulo = já tem / não pode = sem Pix)
do $m$
declare d text;
begin
  d := pg_get_functiondef('public.esc_mp_preco_ref(text,text,text)'::regprocedure);
  if position('manto_camisa' in d) = 0 then
    d := replace(d, $x$  if p_produto = 'cor_extra' then$x$,
      $x$  if p_produto in ('manto_camisa','manto_duas','mascote_clube','escudo_clube','gala_clube') then
    declare j jsonb := public.esc_loja_clube_de(p_email);
    begin
      if p_produto = 'manto_camisa' then
        if coalesce(p_ref, '') = '1' then return case when (j ->> 'tem1')::boolean then null else 9.90 end; end if;
        if coalesce(p_ref, '') = '2' then return case when (j ->> 'tem2')::boolean then null else 9.90 end; end if;
        return null;
      end if;
      if p_produto = 'manto_duas' then return case when (j ->> 'tem1')::boolean or (j ->> 'tem2')::boolean then null else 14.90 end; end if;
      if p_produto = 'mascote_clube' then return case when (j ->> 'mascote')::boolean then null else 29.90 end; end if;
      if p_produto = 'escudo_clube' then return case when (j ->> 'escudo')::boolean then null else 19.90 end; end if;
      if p_produto = 'gala_clube' then return case when (j ->> 'gala')::boolean or not (j ->> 'mascote')::boolean then null else 49.90 end; end if;
    end;
  end if;
  if p_produto = 'cor_extra' then$x$);
    execute d;
  end if;
end $m$;

-- 📦 entrega: camisa fica dela na hora; mascote/escudo/gala nascem "em produção" (o Diego faz a arte)
do $m$
declare d text;
begin
  d := pg_get_functiondef('public.esc_mp_entregar(uuid,text)'::regprocedure);
  if position('manto_camisa' in d) = 0 then
    d := replace(d, $x$  elsif p.produto = 'cor_extra' then$x$,
      $x$  elsif p.produto in ('manto_camisa', 'manto_duas') then
    insert into public.esc_kits_conta (email, tem1, tem2) values (lower(p.email),
      p.produto = 'manto_duas' or p.ref = '1', p.produto = 'manto_duas' or p.ref = '2')
    on conflict (email) do update set
      tem1 = esc_kits_conta.tem1 or excluded.tem1, tem2 = esc_kits_conta.tem2 or excluded.tem2, atualizado_em = now();
  elsif p.produto in ('mascote_clube', 'escudo_clube', 'gala_clube') then
    insert into public.esc_artes_conta (email, item, pedido_id) values (lower(p.email), split_part(p.produto, '_', 1), p.id)
      on conflict (email, item) do nothing;
  elsif p.produto = 'cor_extra' then$x$);
    execute d;
  end if;
end $m$;

-- ✍️ a ideia escrita depois do Pix (mesmo caminho do Batismo/Fundador) + o campo novo 'gala'
create or replace function public.esc_mp_briefing(p_id uuid, p_dados jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare k text; limpo jsonb := '{}'::jsonb;
begin
  for k in select unnest(array['clube','coracao','cores','escudo','mascote','canto','contato','gala']) loop
    if p_dados ? k then limpo := limpo || jsonb_build_object(k, left(trim(p_dados ->> k), 600)); end if;
  end loop;
  update public.esc_mp_pedidos set briefing = limpo, briefing_em = now()
  where id = p_id and email = lower(coalesce(auth.jwt() ->> 'email', '')) and status in ('pago', 'liberado')
    and produto in ('batismo', 'fundador', 'teste', 'canto', 'mascote_clube', 'escudo_clube', 'gala_clube');
  return found;
end $$;
