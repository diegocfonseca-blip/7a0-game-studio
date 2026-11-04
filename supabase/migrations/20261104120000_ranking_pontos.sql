-- 🏅 RANKING POR PONTOS (04/11, Diego: "na hora de escolher a liga… a pessoa agora escolhe 10 times ou 20 times… Campeão da
-- liga e da copa nesse modo [10] ganhará apenas 1 ponto… quando for campeão com 20 times na liga ganha 2 pontos… mata-mata
-- Relâmpago também vale 1 ponto").
--
-- O QUE MUDA:
--  · cada linha de `game_champions` (uma partida/temporada de uma sala) ganha o PESO dos títulos dela:
--      2 = padrão (liga de 20, Só Champions, Kings, Copa do Mundo, Liberta…)
--      1 = sala com LIGA DE 10 TIMES (`game_state.tamanhoLiga = 10` — liga e tudo que vem depois dela na mesma sala)
--          ou ⚡ MATA-MATA RELÂMPAGO (`game_state.copaMode = 'relampago'`)
--  · o peso é decidido pelo BANCO (gatilho antes de gravar, lendo a sala): o aparelho não escolhe o próprio peso.
--  · linhas antigas ficam com 2 (o default da coluna): todas foram em liga de 20 — ordem do Diego.
--  · as SOMAS do ranking passam a somar pontos = (nº de títulos da linha) × peso:
--      esc_titulos_por_uid (clãs: semana, pódio, fechamento, bloco) · esc_rank_online (perfil: semana/mês/sempre, rival,
--      amigos) · esc_fecha_semanas (medalhas/moedas do ranking da semana) · esc_vitrine_calc_ (Ranking da semana, pódio).
--    Os nomes das colunas ("titulos") ficam iguais pra não quebrar o app de quem ainda está na versão velha: só o
--    conteúdo vira ponto. Semanas JÁ fechadas em esc_premio_semana ficam como estavam (contadas em títulos).
--  · NÃO muda: a coleção de taças do perfil (esc_tacas_online / esc_perfil_publico) — lá continua contando TÍTULOS.
--
-- Reverter: recriar as 4 funções com o `* coalesce(g.peso, 2)` tirado (o resto da conta é idêntico) — a coluna e o
-- gatilho podem ficar, não atrapalham nada.

alter table public.game_champions add column if not exists peso smallint not null default 2;
alter table public.game_champions_arquivo add column if not exists peso smallint not null default 2;

-- ⚖️ o peso sai da SALA na hora de gravar (o aparelho não manda). Sala não achada = 2 (nunca rebaixa por leitura que falhou).
create or replace function public.esc_titulo_peso_()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare gs jsonb;
begin
  select g.game_state into gs from game_rooms g where g.id = new.room_id;
  new.peso := case
    when gs is not null and (gs->>'tamanhoLiga' = '10' or gs->>'copaMode' = 'relampago') then 1
    else 2 end;
  return new;
end $function$;

create or replace trigger trg_titulo_peso
  before insert on public.game_champions
  for each row execute function public.esc_titulo_peso_();

-- 🏆 pontos online por conta num intervalo (clãs)
create or replace function public.esc_titulos_por_uid(p_de timestamp with time zone, p_ate timestamp with time zone)
 returns table(uid uuid, titulos integer)
 language sql stable security definer set search_path to 'public'
as $function$
  select (x->>'user_id')::uuid, sum(
      ((case when coalesce((x->>'league_champion')::boolean, false) then 1 else 0 end)
      + coalesce(jsonb_array_length(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end), 0)) * coalesce(g.peso, 2))::int
  from (select created_at, human_results, peso from game_champions union all select created_at, human_results, peso from game_champions_arquivo) g,
       jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
  where g.created_at >= p_de and g.created_at < p_ate and x->>'user_id' ~ '^[0-9a-f-]{36}$' and (x->>'user_id' is null or x->>'user_id' not in (select conta::text from esc_contas_ligadas) or esc_titulo_vale(g.human_results, x->>'user_id', g.created_at))
  group by 1
$function$;

-- 🔨 ranking online (perfil: semana/mês/sempre, rival; amigos: pontos da semana)
create or replace function public.esc_rank_online(p_desde timestamp with time zone)
 returns table(uid text, titulos integer, pos integer)
 language sql stable security definer set search_path to 'public'
as $function$
  with t as (
    select x->>'user_id' as uid,
      sum(((case when coalesce((x->>'league_champion')::boolean, false) then 1 else 0 end)
        + coalesce(jsonb_array_length(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end), 0)) * coalesce(g.peso, 2))::int as n
    from (select created_at, human_results, peso from game_champions union all select created_at, human_results, peso from game_champions_arquivo) g,
         jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
    where g.created_at >= p_desde and x->>'user_id' is not null and (x->>'user_id' is null or x->>'user_id' not in (select conta::text from esc_contas_ligadas) or esc_titulo_vale(g.human_results, x->>'user_id', g.created_at))
    group by 1
  )
  select uid, n, (rank() over (order by n desc))::int from t where n > 0
$function$;

-- 🥇 fecha as semanas (medalhas + moedas do top 3) — agora por pontos
create or replace function public.esc_fecha_semanas()
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare atual date := (date_trunc('week', now() at time zone 'America/Sao_Paulo'))::date; s date := date '2026-10-12';
  ini timestamptz; fim timestamptz;
begin
  while s < atual loop
    if not exists (select 1 from esc_semana_fechada where semana = s) then
      perform pg_advisory_xact_lock(hashtext('esc_fecha_semana_' || s));
      if not exists (select 1 from esc_semana_fechada where semana = s) then
        ini := (s::timestamp) at time zone 'America/Sao_Paulo';
        fim := ((s + 7)::timestamp) at time zone 'America/Sao_Paulo';
        insert into esc_premio_semana (semana, user_id, pos, moedas, nome, titulos)
        with gente as (
          select g.created_at, g.peso, x
          from (select created_at, human_results, peso from game_champions
                union all select created_at, human_results, peso from game_champions_arquivo) g,
               jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
          where g.created_at >= ini and g.created_at < fim and x->>'user_id' is not null
            and (x->>'user_id' is null or x->>'user_id' not in (select conta::text from esc_contas_ligadas) or esc_titulo_vale(g.human_results, x->>'user_id', g.created_at))
        ), taca as (
          select created_at, x,
            ((case when coalesce((x->>'league_champion')::boolean, false) then 1 else 0 end)
              + coalesce(jsonb_array_length(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end), 0)) * coalesce(peso, 2) as n
          from gente
        ), ultimo as (
          select distinct on (x->>'user_id') x->>'user_id' as uid, x->>'display_name' as nome
          from gente order by x->>'user_id', created_at desc
        ), rk as (
          select x->>'user_id' as uid, sum(n)::int as titulos from taca where n > 0 group by 1
        ), pos as (
          select r.uid, u.nome, r.titulos, rank() over (order by r.titulos desc) as p from rk r left join ultimo u on u.uid = r.uid
        )
        select s, uid::uuid, p, case p when 1 then 20 when 2 then 10 else 5 end, nome, titulos
        from pos where p <= 3 and uid ~ '^[0-9a-f-]{36}$'
        on conflict do nothing;
        insert into esc_semana_fechada (semana) values (s) on conflict do nothing;
      end if;
    end if;
    s := s + 7;
  end loop;
end $function$;

-- 📊 vitrine da lista de salas (Ranking da semana, pódio, minha posição) — por pontos. "Campeões de hoje" continua
-- listando as TAÇAS (nomes), só a ordem/soma do ranking é que vira ponto.
create or replace function public.esc_vitrine_calc_()
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
with marcos as (
  select (date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as hoje,
         (date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as semana
),
gente as (
  select g.id, g.created_at, g.peso, x
  from (select id, created_at, human_results, peso from game_champions
        union all select id, created_at, human_results, peso from game_champions_arquivo) g,
       marcos m, jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
  where g.created_at >= m.semana and (x->>'user_id' is null or x->>'user_id' not in (select conta::text from esc_contas_ligadas) or esc_titulo_vale(g.human_results, x->>'user_id', g.created_at))
),
taca as (
  select id, created_at, peso, x,
    (case when coalesce((x->>'league_champion')::boolean, false) then 1 else 0 end)
      + coalesce(jsonb_array_length(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end), 0) as n
  from gente
),
hoje as (
  select distinct on (t.id, x->>'team_name')
    t.created_at, x->>'display_name' as nome, x->>'team_name' as time,
    (case when coalesce((x->>'league_champion')::boolean, false) then '["liga"]'::jsonb else '[]'::jsonb end)
      || coalesce(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end, '[]'::jsonb) as titulos
  from taca t, marcos m
  where t.n > 0 and t.created_at >= m.hoje
  order by t.id, x->>'team_name', t.created_at desc
),
ultimo as (
  select distinct on (x->>'user_id') x->>'user_id' as uid, x->>'display_name' as nome
  from gente where x->>'user_id' is not null
  order by x->>'user_id', created_at desc
),
rk0 as (
  select x->>'user_id' as uid, coalesce(x->>'user_id', 'nome:' || (x->>'display_name')) as k,
         max(x->>'display_name') as nm, sum(n * coalesce(peso, 2))::int as titulos
  from taca where n > 0 group by 1, 2
),
rk as (select r.k, coalesce(u.nome, r.nm) as nome, r.titulos from rk0 r left join ultimo u on u.uid = r.uid),
pos as (
  select k, nome, titulos, rank() over (order by titulos desc) as pos,
         row_number() over (order by titulos desc, nome) as ord from rk
),
bat as (
  select escudo_time, desde from esc_socios
  where origem = 'batismo' and escudo_time is not null
  order by socio_n desc nulls last limit 1
),
fechada as (select max(semana) as semana from esc_premio_semana)
select jsonb_build_object(
  'hoje', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'time', time, 'titulos', titulos, 'em', created_at) order by created_at desc)
                    from (select * from hoje order by created_at desc limit 3) h), '[]'::jsonb),
  'semana', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'titulos', titulos, 'pos', pos, 'uid', case when k like 'nome:%' then null else k end) order by ord)
                      from pos where ord <= 5), '[]'::jsonb),
  'todos', coalesce((select jsonb_object_agg(k, jsonb_build_object('nome', nome, 'titulos', titulos, 'pos', pos)) from pos where k not like 'nome:%'), '{}'::jsonb),
  'batismo', (select jsonb_build_object('clube', escudo_time, 'desde', desde) from bat),
  'podio', coalesce((select jsonb_agg(jsonb_build_object('uid', k, 'pos', pos)) from pos where pos <= 3 and k not like 'nome:%'), '[]'::jsonb),
  'passada', coalesce((select jsonb_agg(jsonb_build_object('nome', p.nome, 'titulos', p.titulos, 'pos', p.pos, 'uid', p.user_id) order by p.pos, p.nome)
                       from esc_premio_semana p, fechada f where p.semana = f.semana and p.pos <= 3), '[]'::jsonb)
);
$function$;
