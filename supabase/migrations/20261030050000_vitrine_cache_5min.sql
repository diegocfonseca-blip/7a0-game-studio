-- 📉 Aliviar o banco (30/10, OK do Diego): as caixas da lista de salas (Campeões de hoje, Ranking da semana, pódio,
-- batismo em destaque, semana passada) passam a ser calculadas UMA vez a cada 5 min pra todo mundo (cache em
-- esc_cache_rpc). A parte de CADA pessoa ('eu' = minha posição, 'ganhas' = minhas medalhas) continua por conta:
-- 'eu' sai do mapa 'todos' guardado no cache; 'ganhas' é lida na hora (consulta pequena).
-- Campeões de hoje: só os 3 últimos (era 5). Clãs da semana: cache 2 → 5 min.

create or replace function public.esc_vitrine_calc_()
returns jsonb language sql stable security definer set search_path to 'public' as $function$
with marcos as (
  select (date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as hoje,
         (date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as semana
),
gente as (
  select g.id, g.created_at, x
  from (select id, created_at, human_results from game_champions
        union all select id, created_at, human_results from game_champions_arquivo) g,
       marcos m, jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
  where g.created_at >= m.semana and (x->>'user_id' is null or x->>'user_id' not in (select conta::text from esc_contas_ligadas) or esc_titulo_vale(g.human_results, x->>'user_id', g.created_at))
),
taca as (
  select id, created_at, x,
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
         max(x->>'display_name') as nm, sum(n)::int as titulos
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

create or replace function public.esc_vitrine_salas()
returns jsonb language plpgsql volatile security definer set search_path to 'public' as $function$
declare c_valor jsonb; c_em timestamptz; v jsonb; eu text := auth.uid()::text;
begin
  select valor, em into c_valor, c_em from esc_cache_rpc where chave = 'vitrine_salas';
  if c_em is not null and c_em > now() - interval '5 minutes' then
    v := c_valor;
  elsif pg_try_advisory_xact_lock(7731002) then
    v := esc_vitrine_calc_();
    insert into esc_cache_rpc (chave, valor, em) values ('vitrine_salas', v, now())
      on conflict (chave) do update set valor = excluded.valor, em = excluded.em;
  else
    v := coalesce(c_valor, esc_vitrine_calc_());
  end if;
  return (v - 'todos') || jsonb_build_object(
    'eu', case when eu is null then null else v->'todos'->eu end,
    'ganhas', coalesce((select string_agg(case p.pos when 1 then '🥇' when 2 then '🥈' else '🥉' end, '' order by p.semana desc)
                        from esc_premio_semana p where p.user_id = auth.uid() and p.pos <= 3 and p.semana >= current_date - 37), ''));
end $function$;

create or replace function public.esc_cla_ranking() returns jsonb language plpgsql volatile security definer set search_path to 'public' as $$
declare c_valor jsonb; c_em timestamptz; v jsonb;
begin
  select valor, em into c_valor, c_em from esc_cache_rpc where chave = 'cla_ranking';
  if c_em is not null and c_em > now() - interval '5 minutes' then return c_valor; end if;
  if not pg_try_advisory_xact_lock(7731001) then return coalesce(c_valor, '[]'::jsonb); end if;
  select coalesce(jsonb_agg(esc_cla_json(s.cla_id) || jsonb_build_object('pos', s.pos) order by s.pos, s.cla_id), '[]'::jsonb) into v
  from (select cla_id, titulos, rank() over (order by titulos desc) as pos from esc_clas_semana(0)) s where s.pos <= 20;
  insert into esc_cache_rpc (chave, valor, em) values ('cla_ranking', v, now()) on conflict (chave) do update set valor = excluded.valor, em = excluded.em;
  return v;
end $$;
