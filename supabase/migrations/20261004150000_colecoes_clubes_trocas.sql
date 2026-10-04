-- 📚🤝 COLEÇÕES DE CLUBES + TROCAS DE CARTAS (04/10, regras fechadas com o Diego)
--
-- Coleção: TODAS as cartas de um clube (clube com 11+ no baralho) fecham o time. O jogador aperta "Receber",
-- escolhe a carreira, e as moedas caem no caixa dela (isso é no aparelho, o save é local).
-- Aqui no banco fica só o que impede usar a mesma carta duas vezes: `esc_cartas_usadas`.
-- A carta usada CONTINUA no álbum (a linha de user_cards não muda); ela só deixa de contar
-- pra fechar o clube de novo. Fechar de novo = o clube inteiro outra vez (repetidas valem).
--
-- Troca: proposta com até 3 cartas de cada lado + recado de até 120 letras, vale 48 h.
-- Aceitar troca o dono das cartas NO SERVIDOR, os dois lados de uma vez (nada fica pela
-- metade). Carta usada ou já presa noutra proposta aberta não entra.
-- Carta de carreira (season_key 'co:solo<seed>:…') que sai numa troca é anotada em
-- `esc_cartas_saidas`, pra a carreira de quem deu tirar a carta da Agência ao abrir.

create table if not exists public.esc_cartas_usadas (
  card_id uuid primary key references public.user_cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  clube text not null,
  carreira_seed text not null,
  carreira_nome text,
  recebido_em timestamptz not null default now()
);
create index if not exists esc_cartas_usadas_user on public.esc_cartas_usadas(user_id);
alter table public.esc_cartas_usadas enable row level security;
drop policy if exists esc_cartas_usadas_select on public.esc_cartas_usadas;
create policy esc_cartas_usadas_select on public.esc_cartas_usadas for select using (true);

create table if not exists public.esc_trocas (
  id bigserial primary key,
  de uuid not null references auth.users(id) on delete cascade,
  para uuid not null references auth.users(id) on delete cascade,
  de_nome text,
  para_nome text,
  de_cartas uuid[] not null,
  para_cartas uuid[] not null,
  recado text check (recado is null or char_length(recado) <= 120),
  status text not null default 'aberta' check (status in ('aberta','aceita','recusada','cancelada','contra')),
  origem bigint references public.esc_trocas(id) on delete set null,
  criada_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '48 hours',
  respondida_em timestamptz
);
create index if not exists esc_trocas_para on public.esc_trocas(para, status);
create index if not exists esc_trocas_de on public.esc_trocas(de, status);
alter table public.esc_trocas enable row level security;
drop policy if exists esc_trocas_select on public.esc_trocas;
create policy esc_trocas_select on public.esc_trocas for select using (auth.uid() = de or auth.uid() = para);

create table if not exists public.esc_cartas_saidas (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  troca_id bigint not null references public.esc_trocas(id) on delete cascade,
  season_key_antiga text not null,
  card_name text not null, card_club text not null, card_year int not null,
  saiu_em timestamptz not null default now()
);
create index if not exists esc_cartas_saidas_user on public.esc_cartas_saidas(user_id);
alter table public.esc_cartas_saidas enable row level security;
drop policy if exists esc_cartas_saidas_select on public.esc_cartas_saidas;
create policy esc_cartas_saidas_select on public.esc_cartas_saidas for select using (auth.uid() = user_id);

-- carta presa numa proposta ABERTA e dentro do prazo (de qualquer lado)
create or replace function public.esc_carta_presa(p_card uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.esc_trocas t
    where t.status = 'aberta' and t.expira_em > now()
      and (p_card = any(t.de_cartas) or p_card = any(t.para_cartas)))
$$;

-- 📚 RECEBER UMA COLEÇÃO: marca uma cópia de cada carta do clube como usada naquela carreira.
-- O banco não conhece o baralho; quem diz quantas cartas o clube tem é o jogo (p_total). Aqui se
-- garante o que importa pra não gastar duas vezes: as cartas são da pessoa, são do mesmo clube, são
-- todas diferentes, nenhuma já foi usada e nenhuma está presa numa troca aberta.
create or replace function public.esc_colecao_receber(p_cards uuid[], p_seed text, p_nome text, p_total int)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_n int; v_clubes int; v_clube text; v_distintas int; v_c uuid;
begin
  if v_uid is null then raise exception 'sem conta'; end if;
  if p_seed is null or length(p_seed) = 0 then raise exception 'carreira obrigatoria'; end if;
  if p_total is null or p_total < 11 or p_total > 300 then raise exception 'clube invalido'; end if;
  v_n := coalesce(array_length(p_cards, 1), 0);
  if v_n <> p_total or (select count(distinct x) from unnest(p_cards) x) <> v_n then raise exception 'faltam cartas do clube'; end if;
  if (select count(*) from public.user_cards where id = any(p_cards) and user_id = v_uid) <> v_n then raise exception 'carta que nao e sua'; end if;
  select min(card_club), count(distinct card_club), count(distinct (card_name, card_club, card_year))
    into v_clube, v_clubes, v_distintas from public.user_cards where id = any(p_cards);
  if v_clubes <> 1 then raise exception 'cartas de clubes diferentes'; end if;
  if v_distintas <> v_n then raise exception 'carta repetida na colecao'; end if;
  if exists (select 1 from public.esc_cartas_usadas where card_id = any(p_cards)) then raise exception 'carta ja usada'; end if;
  foreach v_c in array p_cards loop
    if public.esc_carta_presa(v_c) then raise exception 'carta presa numa troca'; end if;
  end loop;
  insert into public.esc_cartas_usadas (card_id, user_id, clube, carreira_seed, carreira_nome)
    select x, v_uid, v_clube, p_seed, left(p_nome, 60) from unnest(p_cards) x;
  return jsonb_build_object('ok', true, 'clube', v_clube);
end $$;

-- 🤝 PROPOR (ou contrapropor, com p_origem)
create or replace function public.esc_troca_propor(p_para uuid, p_dou uuid[], p_quero uuid[], p_recado text, p_de_nome text, p_para_nome text, p_origem bigint default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_c uuid; v_id bigint; v_o public.esc_trocas%rowtype;
begin
  if v_uid is null then raise exception 'sem conta'; end if;
  if p_para is null or p_para = v_uid then raise exception 'escolha outro tecnico'; end if;
  if coalesce(array_length(p_dou,1),0) not between 1 and 3 or coalesce(array_length(p_quero,1),0) not between 1 and 3 then raise exception 'de 1 a 3 cartas de cada lado'; end if;
  if (select count(distinct x) from unnest(p_dou) x) <> array_length(p_dou,1) or (select count(distinct x) from unnest(p_quero) x) <> array_length(p_quero,1) then raise exception 'carta repetida na proposta'; end if;
  if (select count(*) from public.user_cards where id = any(p_dou) and user_id = v_uid) <> array_length(p_dou,1) then raise exception 'carta que nao e sua'; end if;
  if (select count(*) from public.user_cards where id = any(p_quero) and user_id = p_para) <> array_length(p_quero,1) then raise exception 'carta que nao e dele'; end if;
  if exists (select 1 from public.esc_cartas_usadas where card_id = any(p_dou) or card_id = any(p_quero)) then raise exception 'carta usada nao troca'; end if;
  if (select count(*) from public.esc_trocas where de = v_uid and status = 'aberta' and expira_em > now()) >= 20 then raise exception 'muitas propostas abertas'; end if;
  if p_origem is not null then
    select * into v_o from public.esc_trocas where id = p_origem;
    if v_o.id is null or v_o.para <> v_uid or v_o.de <> p_para or v_o.status <> 'aberta' then raise exception 'proposta original invalida'; end if;
    update public.esc_trocas set status = 'contra', respondida_em = now() where id = p_origem;
  end if;
  foreach v_c in array (p_dou || p_quero) loop
    if public.esc_carta_presa(v_c) then raise exception 'carta presa noutra proposta'; end if;
  end loop;
  insert into public.esc_trocas (de, para, de_nome, para_nome, de_cartas, para_cartas, recado, origem)
    values (v_uid, p_para, left(p_de_nome, 60), left(p_para_nome, 60), p_dou, p_quero, nullif(left(btrim(coalesce(p_recado,'')), 120), ''), p_origem)
    returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- ✅/✖️ RESPONDER (só quem recebeu)
create or replace function public.esc_troca_responder(p_id bigint, p_aceitar boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); t public.esc_trocas%rowtype; r public.user_cards%rowtype;
begin
  select * into t from public.esc_trocas where id = p_id for update;
  if t.id is null or t.para <> v_uid then raise exception 'proposta nao encontrada'; end if;
  if t.status <> 'aberta' then raise exception 'proposta ja respondida'; end if;
  if t.expira_em <= now() then raise exception 'proposta venceu'; end if;
  if not p_aceitar then
    update public.esc_trocas set status = 'recusada', respondida_em = now() where id = p_id;
    return jsonb_build_object('ok', true, 'status', 'recusada');
  end if;
  -- confere TUDO de novo na hora: cada um ainda tem a carta e nenhuma foi usada
  if (select count(*) from public.user_cards where id = any(t.de_cartas) and user_id = t.de) <> array_length(t.de_cartas,1)
     or (select count(*) from public.user_cards where id = any(t.para_cartas) and user_id = t.para) <> array_length(t.para_cartas,1)
     or exists (select 1 from public.esc_cartas_usadas where card_id = any(t.de_cartas) or card_id = any(t.para_cartas)) then
    update public.esc_trocas set status = 'cancelada', respondida_em = now() where id = p_id;
    -- devolve em vez de dar erro: um erro desfaria o 'cancelada' junto, e a proposta morta ficaria aberta
    return jsonb_build_object('ok', false, 'erro', 'indisponivel');
  end if;
  for r in select * from public.user_cards where id = any(t.de_cartas || t.para_cartas) for update loop
    if r.season_key like 'co:solo%' then
      insert into public.esc_cartas_saidas (user_id, troca_id, season_key_antiga, card_name, card_club, card_year)
        values (r.user_id, t.id, r.season_key, r.card_name, r.card_club, r.card_year);
    end if;
    update public.user_cards
      set user_id = case when r.user_id = t.de then t.para else t.de end,
          season_key = 'troca:' || t.id || ':' || r.id,
          taken_from = r.user_id,
          taken_from_name = case when r.user_id = t.de then t.de_nome else t.para_nome end,
          taken_at = now()
      where id = r.id;
  end loop;
  update public.esc_trocas set status = 'aceita', respondida_em = now() where id = p_id;
  return jsonb_build_object('ok', true, 'status', 'aceita');
end $$;

-- 🚫 CANCELAR (só quem propôs)
create or replace function public.esc_troca_cancelar(p_id bigint)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  update public.esc_trocas set status = 'cancelada', respondida_em = now()
    where id = p_id and de = auth.uid() and status = 'aberta';
  if not found then raise exception 'proposta nao encontrada'; end if;
  return jsonb_build_object('ok', true);
end $$;

-- 👥 com quem trocar: quem jogou sala com você nos últimos 60 dias (nome do time mais recente)
create or replace function public.esc_troca_parceiros()
returns table(user_id uuid, nome text, quando timestamptz)
language sql stable security definer set search_path to 'public' as $$
  with minhas as (
    select distinct rp.room_id from public.room_players rp
    join public.game_rooms g on g.id = rp.room_id
    where rp.user_id = auth.uid() and g.updated_at > now() - interval '60 days'
  ), outros as (
    select rp.user_id, rp.manager_name, g.updated_at,
      row_number() over (partition by rp.user_id order by g.updated_at desc) rn
    from public.room_players rp join minhas m on m.room_id = rp.room_id
    join public.game_rooms g on g.id = rp.room_id
    where rp.user_id <> auth.uid() and rp.user_id is not null
  )
  select user_id, manager_name, updated_at from outros where rn = 1 order by updated_at desc limit 30
$$;

-- 🔎 buscar técnico pelo nome do time (o nome que ele usou nas salas)
create or replace function public.esc_troca_buscar(p_txt text)
returns table(user_id uuid, nome text)
language sql stable security definer set search_path to 'public' as $$
  select distinct on (rp.user_id) rp.user_id, rp.manager_name
  from public.room_players rp
  where length(btrim(coalesce(p_txt,''))) >= 3
    and rp.user_id is not null and rp.user_id <> auth.uid()
    and rp.manager_name ilike '%' || btrim(p_txt) || '%'
  order by rp.user_id
  limit 15
$$;

grant execute on function public.esc_colecao_receber(uuid[], text, text, int) to authenticated;
grant execute on function public.esc_troca_propor(uuid, uuid[], uuid[], text, text, text, bigint) to authenticated;
grant execute on function public.esc_troca_responder(bigint, boolean) to authenticated;
grant execute on function public.esc_troca_cancelar(bigint) to authenticated;
grant execute on function public.esc_troca_parceiros() to authenticated;
grant execute on function public.esc_troca_buscar(text) to authenticated;
revoke execute on function public.esc_carta_presa(uuid) from public, anon;
