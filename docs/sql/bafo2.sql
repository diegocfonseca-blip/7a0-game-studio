-- 🃏 BAFO NOVO (21/11, regras do Diego — ver docs/pendencias.md "BAFO NOVO").
-- Cada um convoca 22 cartas da PRÓPRIA coleção (user_cards, qualquer origem). Só gente, só liga. No fim, SÓ o campeão toma
-- 1 carta das 22 convocadas de alguém da sala (60 s; senão o jogo sorteia). Dono que encerra antes do fim perde 2 cartas
-- sorteadas das 22 dele: 1 pro 1º e 1 pro 2º da tabela (fora ele); antes de qualquer jogo, as 2 somem (ninguém ganha).
-- Tudo que mexe em carta é SECURITY DEFINER e confere a POSSE no servidor — o aparelho nunca troca dono de carta sozinho.

create table if not exists public.esc_bafo2 (
  id bigserial primary key,
  room_id uuid not null,
  code text,
  dono uuid not null,
  valendo boolean not null default true,
  squads jsonb not null,            -- { uid: [id da carta em user_cards, ...] } — as 22 convocadas de cada um
  assentos jsonb not null,          -- { mgrId (texto): uid } — quem senta em cada time da tabela
  nomes jsonb not null default '{}'::jsonb, -- { uid: nome do time }
  fase text not null default 'jogando' check (fase in ('jogando', 'escolha', 'fim', 'encerrada')),
  campeao uuid,
  escolha_ate timestamptz,
  resultado jsonb,
  punicao jsonb,
  criada_em timestamptz not null default now(),
  batida_em timestamptz not null default now() -- 💓 o aparelho do dono bate aqui (hora do SERVIDOR) enquanto a liga rola
);
create unique index if not exists esc_bafo2_uma_viva on public.esc_bafo2 (room_id) where fase in ('jogando', 'escolha');
create index if not exists esc_bafo2_room on public.esc_bafo2 (room_id, id desc);
alter table public.esc_bafo2 enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'esc_bafo2' and policyname = 'esc_bafo2_le') then
    create policy esc_bafo2_le on public.esc_bafo2 for select using (true);
  end if;
end $$;

-- ── a carta troca de dono (uso INTERNO: mora num esquema que a API não enxerga — ninguém chama de fora) ──
create schema if not exists bafo_int;
create or replace function bafo_int.passa(p_card uuid, p_de uuid, p_para uuid, p_chave text, p_de_nome text)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c public.user_cards%rowtype;
begin
  update public.user_cards set user_id = p_para, season_key = p_chave, taken_from = p_de, taken_from_name = p_de_nome, taken_at = now()
    where id = p_card and user_id = p_de returning * into c;
  if c.id is null then return null; end if;
  return jsonb_build_object('id', c.id, 'name', c.card_name, 'club', c.card_club, 'year', c.card_year, 'pos', c.card_pos, 'fame', c.card_fame);
end $$;

-- ── 1) o DONO fecha a convocação: o servidor confere que cada carta é de quem diz ser ──
create or replace function public.bafo2_fecha(p_room uuid, p_squads jsonb, p_assentos jsonb, p_nomes jsonb, p_valendo boolean default true)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_host uuid; v_code text; k text; v_ids uuid[]; v_n int; v_ok int; v_tot int := 0; v_id bigint;
begin
  select host_id, code into v_host, v_code from public.game_rooms where id = p_room;
  if v_host is null then raise exception 'sala nao encontrada'; end if;
  if auth.uid() is null or auth.uid() <> v_host then raise exception 'so o dono fecha a convocacao'; end if;
  if exists (select 1 from public.esc_bafo2 where room_id = p_room and fase in ('jogando', 'escolha')) then
    raise exception 'ja existe um bafo rolando nesta sala';
  end if;
  for k in select jsonb_object_keys(p_squads) loop
    if not exists (select 1 from public.room_players where room_id = p_room and user_id = k::uuid) then raise exception 'jogador fora da sala'; end if;
    select array_agg(distinct x::uuid) into v_ids from jsonb_array_elements_text(p_squads -> k) x;
    v_n := coalesce(array_length(v_ids, 1), 0);
    if v_n < 11 or v_n > 22 or v_n <> jsonb_array_length(p_squads -> k) then raise exception 'convocacao invalida'; end if;
    select count(*) into v_ok from public.user_cards where id = any(v_ids) and user_id = k::uuid;
    if v_ok <> v_n then raise exception 'carta que nao e do jogador'; end if;
    v_tot := v_tot + 1;
  end loop;
  if v_tot < 2 then raise exception 'bafo precisa de 2 jogadores'; end if;
  insert into public.esc_bafo2 (room_id, code, dono, valendo, squads, assentos, nomes)
  values (p_room, v_code, v_host, coalesce(p_valendo, true), p_squads, coalesce(p_assentos, '{}'::jsonb), coalesce(p_nomes, '{}'::jsonb))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- ── 💓 o aparelho do dono avisa que está vivo (hora do servidor) ──
create or replace function public.bafo2_bate(p_room uuid)
 returns void language sql security definer set search_path to 'public' as $$
  update public.esc_bafo2 set batida_em = now() where room_id = p_room and fase = 'jogando' and dono = auth.uid();
$$;

-- ── 2) acabou a liga: o dono abre a escolha do campeão (60 s) ──
create or replace function public.bafo2_abre_escolha(p_room uuid, p_campeao uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare b public.esc_bafo2%rowtype; v_host uuid;
begin
  select host_id into v_host from public.game_rooms where id = p_room;
  if auth.uid() is null or v_host is null or auth.uid() <> v_host then raise exception 'so o dono abre a escolha'; end if;
  select * into b from public.esc_bafo2 where room_id = p_room and fase in ('jogando', 'escolha') order by id desc limit 1 for update;
  if b.id is null then return jsonb_build_object('ok', false); end if;
  if b.fase = 'escolha' then return jsonb_build_object('ok', true, 'ja', true); end if;
  if not (b.squads ? p_campeao::text) then raise exception 'campeao fora do bafo'; end if;
  if not b.valendo then
    update public.esc_bafo2 set fase = 'fim', campeao = p_campeao, resultado = jsonb_build_object('amistoso', true) where id = b.id;
  else
    update public.esc_bafo2 set fase = 'escolha', campeao = p_campeao, escolha_ate = now() + interval '60 seconds' where id = b.id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ── 3) o CAMPEÃO toma 1 carta das 22 de alguém ──
create or replace function public.bafo2_tomar(p_room uuid, p_card uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare b public.esc_bafo2%rowtype; k text; v_de uuid; v_carta jsonb; v_res jsonb;
begin
  select * into b from public.esc_bafo2 where room_id = p_room and fase = 'escolha' order by id desc limit 1 for update;
  if b.id is null then raise exception 'a escolha nao esta aberta'; end if;
  if auth.uid() is null or auth.uid() <> b.campeao then raise exception 'so o campeao escolhe'; end if;
  if now() > b.escolha_ate + interval '5 seconds' then raise exception 'o tempo acabou'; end if;
  for k in select jsonb_object_keys(b.squads) loop
    if k::uuid <> b.campeao and (b.squads -> k) ? p_card::text then v_de := k::uuid; end if;
  end loop;
  if v_de is null then raise exception 'carta fora das convocadas'; end if;
  v_carta := bafo_int.passa(p_card, v_de, b.campeao, 'bafo2:' || b.id || ':c', b.nomes ->> v_de::text);
  if v_carta is null then raise exception 'essa carta nao esta mais com o dono'; end if;
  v_res := jsonb_build_object('de', v_de, 'para', b.campeao, 'deNome', b.nomes ->> v_de::text, 'paraNome', b.nomes ->> b.campeao::text, 'carta', v_carta, 'sorteio', false);
  update public.esc_bafo2 set fase = 'fim', resultado = v_res where id = b.id;
  return v_res;
end $$;

-- ── 3b) passou o tempo (ou o campeão saiu): qualquer um da sala pede o SORTEIO ──
create or replace function public.bafo2_sorteia(p_room uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare b public.esc_bafo2%rowtype; v_card uuid; v_de uuid; v_carta jsonb; v_res jsonb;
begin
  select * into b from public.esc_bafo2 where room_id = p_room and fase = 'escolha' order by id desc limit 1 for update;
  if b.id is null then return null; end if;
  if auth.uid() is null or not (b.squads ? auth.uid()::text) then raise exception 'so quem esta no bafo'; end if;
  if now() <= b.escolha_ate + interval '5 seconds' then return null; end if;
  select uc.id, uc.user_id into v_card, v_de
    from jsonb_each(b.squads) s
    cross join lateral jsonb_array_elements_text(s.value) cid
    join public.user_cards uc on uc.id = cid::uuid and uc.user_id = s.key::uuid
    where s.key::uuid <> b.campeao
    order by random() limit 1;
  if v_card is null then
    v_res := jsonb_build_object('semCarta', true);
  else
    v_carta := bafo_int.passa(v_card, v_de, b.campeao, 'bafo2:' || b.id || ':c', b.nomes ->> v_de::text);
    v_res := jsonb_build_object('de', v_de, 'para', b.campeao, 'deNome', b.nomes ->> v_de::text, 'paraNome', b.nomes ->> b.campeao::text, 'carta', v_carta, 'sorteio', true);
  end if;
  update public.esc_bafo2 set fase = 'fim', resultado = v_res where id = b.id;
  return v_res;
end $$;

-- ── a punição do dono (uso interno): 2 cartas sorteadas das 22 dele ──
create or replace function bafo_int.pune(p_id bigint, p_motivo text)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare b public.esc_bafo2%rowtype; v_liga jsonb; v_jogos int := 0; v_dono_mgr text; v_ord uuid[]; v_cards uuid[]; v_out jsonb := '[]'::jsonb; i int; v_para uuid; v_carta jsonb; r record;
begin
  select * into b from public.esc_bafo2 where id = p_id for update;
  if b.id is null or b.fase <> 'jogando' then return null; end if;
  if not b.valendo then
    update public.esc_bafo2 set fase = 'encerrada', punicao = jsonb_build_object('motivo', p_motivo, 'amistoso', true) where id = b.id;
    return jsonb_build_object('amistoso', true);
  end if;
  select game_state -> 'league' into v_liga from public.game_rooms where id = b.room_id;
  if jsonb_typeof(v_liga) = 'array' then
    select coalesce(sum((t ->> 'w')::int + (t ->> 'd')::int + (t ->> 'l')::int), 0) into v_jogos from jsonb_array_elements(v_liga) t;
    select a.key into v_dono_mgr from jsonb_each_text(b.assentos) a where a.value = b.dono::text limit 1;
    select array_agg(u order by pts desc, w desc, sg desc, gf desc) into v_ord from (
      select (b.assentos ->> (t ->> 'id'))::uuid u, (t ->> 'pts')::int pts, (t ->> 'w')::int w, (t ->> 'gf')::int - (t ->> 'ga')::int sg, (t ->> 'gf')::int gf
      from jsonb_array_elements(v_liga) t
      where b.assentos ? (t ->> 'id') and (t ->> 'id') is distinct from v_dono_mgr
    ) x;
  end if;
  select array_agg(id) into v_cards from (
    select uc.id from jsonb_array_elements_text(b.squads -> b.dono::text) cid
    join public.user_cards uc on uc.id = cid::uuid and uc.user_id = b.dono
    order by random() limit 2
  ) y;
  for i in 1 .. coalesce(array_length(v_cards, 1), 0) loop
    if v_jogos > 0 and coalesce(array_length(v_ord, 1), 0) > 0 then
      v_para := v_ord[least(i, array_length(v_ord, 1))];
      v_carta := bafo_int.passa(v_cards[i], b.dono, v_para, 'bafo2:' || b.id || ':p' || i, b.nomes ->> b.dono::text);
      v_out := v_out || jsonb_build_object('para', v_para, 'paraNome', b.nomes ->> v_para::text, 'carta', v_carta);
    else
      -- antes de qualquer jogo: a carta vai pro SISTEMA (ninguém ganha). Fica guardada aqui na punição.
      for r in delete from public.user_cards where id = v_cards[i] and user_id = b.dono returning * loop
        v_out := v_out || jsonb_build_object('para', null, 'carta', jsonb_build_object('id', r.id, 'name', r.card_name, 'club', r.card_club, 'year', r.card_year, 'pos', r.card_pos, 'fame', r.card_fame, 'season_key', r.season_key, 'origin', r.origin, 'obtained_at', r.obtained_at));
      end loop;
    end if;
  end loop;
  update public.esc_bafo2 set fase = 'encerrada', punicao = jsonb_build_object('motivo', p_motivo, 'dono', b.dono, 'donoNome', b.nomes ->> b.dono::text, 'cartas', v_out) where id = b.id;
  return jsonb_build_object('cartas', v_out);
end $$;

-- ── 4) o dono encerra antes do fim (botão) ──
create or replace function public.bafo2_encerra(p_room uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_id bigint;
begin
  select id into v_id from public.esc_bafo2 where room_id = p_room and fase = 'jogando' and dono = auth.uid() order by id desc limit 1;
  if v_id is null then return null; end if;
  return bafo_int.pune(v_id, 'encerrou');
end $$;

-- ── 4b) o dono SUMIU: 10 min sem bater → qualquer um do bafo aciona ──
create or replace function public.bafo2_sumiu(p_room uuid)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare b public.esc_bafo2%rowtype;
begin
  select * into b from public.esc_bafo2 where room_id = p_room and fase = 'jogando' order by id desc limit 1;
  if b.id is null then return null; end if;
  if auth.uid() is null or not (b.squads ? auth.uid()::text) or auth.uid() = b.dono then return null; end if;
  if b.batida_em > now() - interval '10 minutes' then return null; end if;
  return bafo_int.pune(b.id, 'sumiu');
end $$;
