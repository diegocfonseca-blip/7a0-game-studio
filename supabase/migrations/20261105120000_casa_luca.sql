-- 💙 CASA LUCA (05/11, Diego — mockups scripts/mockups/casa-luca/*.png, com as mudanças dele):
--   A) 💙 PLANO CORAÇÃO = 50% de desconto nos planos MENSAIS (⭐ Craque Salas / ⭐ Craque Completo, Vendria) pra quem é PcD ou
--      pai/mãe/responsável de criança especial, enquanto a pessoa pagar. A pessoa manda FOTO (carteirinha ou laudo) → bucket
--      PRIVADO `coracao-provas` → o Diego aprova/recusa no #admin → a Edge Function `coracao-decidir` APAGA a foto na hora.
--      Fica só o registro (e-mail, quem, tipo de prova, aprovado/recusado, datas). O DESCONTO é aplicado pelo SERVIDOR
--      (`vendria-checkout` pergunta `esc_coracao_tem_desconto` e cria a assinatura já com metade do preço).
--   B) 💙 DOAÇÃO PRO LUCA pelo Pix do Mercado Pago do jogo: produto `doacao_luca`, ref 'v<centavos>' (R$ 2 a R$ 1.000), sem dar
--      NADA no jogo. Depois de pago a pessoa pode pôr o nome no MURAL. O mural NUNCA devolve valor, total nem contagem.
-- 🔒 Enquanto o Diego não aprova o visual: tudo só pra conta dele (`esc_casa_luca_config.aberto = false`). Liberar geral =
--    `update esc_casa_luca_config set aberto = true` (e CASA_LUCA_GERAL = true em src/escalacao/sport.ts).
-- Regra do repo: nada de tirar política ou permissão nesta migration — as funções de servidor se guardam por dentro (auth.role()).

-- ─── config (trava de teste) ─────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.esc_casa_luca_config (
  id boolean primary key default true check (id),
  aberto boolean not null default false,
  atualizado_em timestamptz not null default now()
);
insert into public.esc_casa_luca_config (id) values (true) on conflict do nothing;
alter table public.esc_casa_luca_config enable row level security; -- sem política: só as funções leem

create or replace function public.esc_casa_luca_aberto(p_email text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select aberto from esc_casa_luca_config where id), false)
      or lower(coalesce(p_email, '')) = 'diego.c.fonseca@gmail.com'
$$;

-- ─── A) PLANO CORAÇÃO ────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.esc_coracao_pedidos (
  id bigserial primary key,
  email text not null,
  user_id uuid not null,
  quem text not null check (quem in ('pcd', 'responsavel')),
  prova text not null check (prova in ('carteirinha', 'laudo')),
  foto_path text,                       -- vira NULL quando a foto é apagada do storage
  status text not null default 'pedido' check (status in ('pedido', 'aprovado', 'recusado')),
  criado_em timestamptz not null default now(),
  decidido_em timestamptz,
  foto_apagada_em timestamptz
);
create index if not exists esc_coracao_pedidos_email on public.esc_coracao_pedidos (email, criado_em desc);
create unique index if not exists esc_coracao_um_pedido_aberto on public.esc_coracao_pedidos (email) where status = 'pedido';
alter table public.esc_coracao_pedidos enable row level security; -- sem política: só as funções mexem

-- o selo 💙 é opcional e começa DESLIGADO (só liga se a pessoa escolher). Ele não diz "Plano Coração" em lugar nenhum.
create table if not exists public.esc_coracao_prefs (
  email text primary key,
  selo boolean not null default false,
  atualizado_em timestamptz not null default now()
);
alter table public.esc_coracao_prefs enable row level security;

-- 🗄️ bucket PRIVADO das fotos (3 MB, só imagem). Ninguém lê, a não ser a conta do Diego (pra gerar o link assinado no #admin).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('coracao-provas', 'coracao-provas', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do nothing;

-- quem pode mandar foto agora: logado, Casa Luca aberta pra ele, sem pedido esperando, não aprovado, e no máximo 4 fotos/dia
create or replace function public.esc_coracao_pode_enviar() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', '')); uid uuid := auth.uid();
begin
  if uid is null or em = '' then return false; end if;
  if not public.esc_casa_luca_aberto(em) then return false; end if;
  if exists (select 1 from esc_coracao_pedidos where email = em and status in ('pedido', 'aprovado')) then return false; end if;
  if (select count(*) from storage.objects o where o.bucket_id = 'coracao-provas' and o.name like uid::text || '/%'
        and o.created_at > now() - interval '1 day') >= 4 then return false; end if;
  return true;
end $$;
grant execute on function public.esc_coracao_pode_enviar() to authenticated;

do $p$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'coracao_provas_envia') then
    create policy coracao_provas_envia on storage.objects for insert to authenticated
      with check (bucket_id = 'coracao-provas' and (storage.foldername(name))[1] = auth.uid()::text and public.esc_coracao_pode_enviar());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'coracao_provas_admin_le') then
    create policy coracao_provas_admin_le on storage.objects for select to authenticated
      using (bucket_id = 'coracao-provas' and lower(coalesce(auth.jwt() ->> 'email', '')) = 'diego.c.fonseca@gmail.com');
  end if;
end $p$;

-- 👤 o meu estado: status do último pedido, o selo e se a Casa Luca está aberta pra mim
create or replace function public.esc_coracao_meu() returns jsonb
language sql stable security definer set search_path = public as $$
  with e as (select lower(coalesce(auth.jwt() ->> 'email', '')) as em)
  select jsonb_build_object(
    'aberto', public.esc_casa_luca_aberto(e.em),
    'status', (select p.status from esc_coracao_pedidos p where p.email = e.em
               order by (p.status = 'aprovado') desc, p.criado_em desc limit 1),
    'desde', (select min(p.decidido_em) from esc_coracao_pedidos p where p.email = e.em and p.status = 'aprovado'),
    'selo', coalesce((select s.selo from esc_coracao_prefs s where s.email = e.em), false)
            and exists (select 1 from esc_coracao_pedidos p where p.email = e.em and p.status = 'aprovado'))
  from e where e.em <> ''
$$;
grant execute on function public.esc_coracao_meu() to authenticated;

-- 📨 mandar o pedido (depois de subir a foto). A foto tem que ser DESTA conta e existir no bucket.
create or replace function public.esc_coracao_pedir(p_quem text, p_prova text, p_path text) returns bigint
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', '')); uid uuid := auth.uid(); v_id bigint;
begin
  if uid is null or em = '' then raise exception 'SEM_LOGIN'; end if;
  if not public.esc_casa_luca_aberto(em) then raise exception 'FECHADO'; end if;
  if p_quem not in ('pcd', 'responsavel') or p_prova not in ('carteirinha', 'laudo') then raise exception 'INVALIDO'; end if;
  if coalesce(p_path, '') not like uid::text || '/%' then raise exception 'FOTO_DE_OUTRO'; end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'coracao-provas' and o.name = p_path) then raise exception 'SEM_FOTO'; end if;
  if exists (select 1 from esc_coracao_pedidos where email = em and status = 'aprovado') then raise exception 'JA_APROVADO'; end if;
  if exists (select 1 from esc_coracao_pedidos where email = em and status = 'pedido') then raise exception 'JA_PEDIU'; end if;
  insert into esc_coracao_pedidos (email, user_id, quem, prova, foto_path) values (em, uid, p_quem, p_prova, p_path) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.esc_coracao_pedir(text, text, text) to authenticated;

-- 💙 liga/desliga o selo (só quem foi aprovado)
create or replace function public.esc_coracao_selo(p_on boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if em = '' or not exists (select 1 from esc_coracao_pedidos where email = em and status = 'aprovado') then return false; end if;
  insert into esc_coracao_prefs (email, selo, atualizado_em) values (em, coalesce(p_on, false), now())
    on conflict (email) do update set selo = excluded.selo, atualizado_em = now();
  return true;
end $$;
grant execute on function public.esc_coracao_selo(boolean) to authenticated;

-- 💰 SÓ O SERVIDOR (vendria-checkout): esta conta tem o desconto de 50%?
create or replace function public.esc_coracao_tem_desconto(p_email text) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'SO_SERVIDOR'; end if;
  return exists (select 1 from esc_coracao_pedidos where email = lower(trim(coalesce(p_email, ''))) and status = 'aprovado');
end $$;

-- 🛠️ #admin: a fila (só a conta do Diego). O caminho da foto vai junto pra gerar o link assinado (vale poucos minutos).
create or replace function public.esc_admin_coracao_lista() returns table (
  id bigint, email text, clube text, quem text, prova text, foto_path text, status text,
  criado_em timestamptz, decidido_em timestamptz, foto_apagada_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  return query
    select p.id, p.email, (select u.raw_user_meta_data ->> 'display_name' from auth.users u where u.id = p.user_id),
           p.quem, p.prova, p.foto_path, p.status, p.criado_em, p.decidido_em, p.foto_apagada_em
    from esc_coracao_pedidos p
    order by (p.status = 'pedido') desc, coalesce(p.decidido_em, p.criado_em) desc
    limit 200;
end $$;
grant execute on function public.esc_admin_coracao_lista() to authenticated;

-- ⚖️ SÓ O SERVIDOR (Edge Function `coracao-decidir`, que confere que é o Diego): grava a decisão e devolve a foto a apagar.
-- p_aprovar = null → só "apagar a foto de novo" (quando a remoção falhou da 1ª vez).
create or replace function public.esc_coracao_decidir(p_id bigint, p_aprovar boolean) returns text
language plpgsql security definer set search_path = public as $$
declare p esc_coracao_pedidos;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'SO_SERVIDOR'; end if;
  select * into p from esc_coracao_pedidos where id = p_id for update;
  if not found then raise exception 'SEM_PEDIDO'; end if;
  if p_aprovar is not null then
    if p.status <> 'pedido' then raise exception 'JA_DECIDIDO'; end if;
    update esc_coracao_pedidos set status = case when p_aprovar then 'aprovado' else 'recusado' end, decidido_em = now() where id = p_id;
  elsif p.status = 'pedido' then raise exception 'SEM_DECISAO';
  end if;
  return p.foto_path; -- null = já apagada
end $$;

create or replace function public.esc_coracao_foto_apagada(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'SO_SERVIDOR'; end if;
  update esc_coracao_pedidos set foto_path = null, foto_apagada_em = now() where id = p_id and status <> 'pedido';
end $$;

-- 🧾 a assinatura da Vendria guarda se nasceu com o desconto (só pro #admin conferir; quem decide o preço é o vendria-checkout)
alter table public.esc_vendria_pedidos add column if not exists coracao boolean not null default false;

-- (caminho antigo do webhook, que lê o plano pelo VALOR: reconhece também a metade — 4,95 / 7,45, com e sem a taxa de 1,99)
do $m$
declare d text;
begin
  d := pg_get_functiondef('public.esc_vendria_aplica(jsonb)'::regprocedure);
  if position('when 495 then' in d) = 0 then
    d := replace(d, $x$when 1689 then 'craque_completo' end;$x$,
      $x$when 1689 then 'craque_completo' when 495 then 'craque_salas' when 694 then 'craque_salas' when 745 then 'craque_completo' when 944 then 'craque_completo' end;$x$);
    if position('when 495 then' in d) = 0 then raise exception 'esc_vendria_aplica: ponto de enxerto não achado'; end if;
    execute d;
  end if;
end $m$;

-- ─── B) DOAÇÃO PRO LUCA ──────────────────────────────────────────────────────────────────────────────────────────
-- produto novo nos dois filtros (lista = a de 02/11 + 'doacao_luca')
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora','recado_hora','recado_dia',
  'peca_presidente','escudo_cla','cla_extra','cla_criar','manual_24h','cor_extra','doacao_luca'])) not valid;
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check check (produto = any (array[
  'craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste','moedas_10','moedas_50','moedas_100',
  'moedas_500','moedas_1000','canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora',
  'recado_hora','recado_dia','peca_presidente','escudo_cla','cla_extra','cla_criar','manual_24h','cor_extra','doacao_luca'])) not valid;

-- 💰 preço = o valor que a pessoa escolheu, em centavos na ref ('v500' = R$ 5). Mínimo R$ 2, teto R$ 1.000 (pega dedo errado).
-- Não precisa de entrega: o `esc_mp_entregar` só marca o pedido como liberado (não dá NADA no jogo).
do $m$
declare d text;
begin
  d := pg_get_functiondef('public.esc_mp_preco_ref(text,text,text)'::regprocedure);
  if position('doacao_luca' in d) = 0 then
    d := replace(d, $x$  if p_produto = 'cor_extra' then$x$,
      $x$  if p_produto = 'doacao_luca' then
    if not public.esc_casa_luca_aberto(p_email) then return null; end if;
    if coalesce(p_ref, '') !~ '^v[0-9]{3,6}$' then return null; end if;
    if substring(p_ref from 2)::int < 200 or substring(p_ref from 2)::int > 100000 then return null; end if;
    return round(substring(p_ref from 2)::numeric / 100, 2);
  end if;
  if p_produto = 'cor_extra' then$x$);
    if position('doacao_luca' in d) = 0 then raise exception 'esc_mp_preco_ref: ponto de enxerto não achado'; end if;
    execute d;
  end if;
end $m$;

-- 🧱 MURAL "Obrigado a quem ajudou o Luca 💙": um nome por conta, só depois de PAGAR, opcional. Sem valor, sem total, sem posição.
create table if not exists public.esc_luca_mural (
  email text primary key,
  pedido_id uuid not null,
  nome text not null check (char_length(nome) between 2 and 30),
  escondido boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table public.esc_luca_mural enable row level security; -- sem política: só as funções

create or replace function public.esc_luca_mural_assinar(p_pedido uuid, p_nome text) returns boolean
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  n text := left(regexp_replace(trim(coalesce(p_nome, '')), '\s+', ' ', 'g'), 30);
begin
  if em = '' then return false; end if;
  if char_length(n) < 2 or n ~* '(https?:|www\.|\.com|\.br|@)' or public.esc_nome_ofensivo(n) then return false; end if;
  if not exists (select 1 from esc_mp_pedidos p where p.id = p_pedido and p.email = em and p.produto = 'doacao_luca' and p.status in ('pago', 'liberado')) then
    return false;
  end if;
  insert into esc_luca_mural (email, pedido_id, nome) values (em, p_pedido, n)
    on conflict (email) do update set nome = excluded.nome, pedido_id = excluded.pedido_id, criado_em = now()
    where not esc_luca_mural.escondido;
  return true;
end $$;
grant execute on function public.esc_luca_mural_assinar(uuid, text) to authenticated;

-- 👀 o mural público: SÓ nome + data. Nunca valor, total ou contagem (a tela também não conta).
create or replace function public.esc_luca_mural() returns table (nome text, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select m.nome, m.criado_em from esc_luca_mural m where not m.escondido order by m.criado_em desc limit 300
$$;
grant execute on function public.esc_luca_mural() to anon, authenticated;

-- 🛠️ #admin: o Diego vê e esconde nomes do mural (moderação). Sem valor aqui também.
create or replace function public.esc_admin_luca_mural() returns table (email text, nome text, escondido boolean, criado_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  return query select m.email, m.nome, m.escondido, m.criado_em from esc_luca_mural m order by m.criado_em desc limit 300;
end $$;
grant execute on function public.esc_admin_luca_mural() to authenticated;

create or replace function public.esc_admin_luca_mural_esconder(p_email text, p_esconder boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  update esc_luca_mural set escondido = coalesce(p_esconder, true) where email = lower(p_email);
end $$;
grant execute on function public.esc_admin_luca_mural_esconder(text, boolean) to authenticated;
