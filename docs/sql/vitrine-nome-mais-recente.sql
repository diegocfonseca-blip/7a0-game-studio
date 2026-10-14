-- 🏆 Ranking da Semana (vitrine das salas): a CONTA aparece com o nome MAIS RECENTE que usou (Diego 14/10).
-- Antes era max(display_name) = o último no alfabeto: o dono do Labubu FC aparecia como "M.D.REAL" (nome velho)
-- mesmo jogando como LABUBU F.C. Os títulos já eram somados por conta (user_id); a regra de contar NÃO mudou.
create or replace function public.esc_vitrine_salas()
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
with marcos as (
  select (date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as hoje,
         (date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as semana
),
gente as (
  select g.id, g.created_at, x
  from game_champions g, marcos m, jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
  where g.created_at >= m.semana
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
-- 📛 nome = o MAIS RECENTE da conta nesta semana (inclusive de sala que não deu título)
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
)
select jsonb_build_object(
  'hoje', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'time', time, 'titulos', titulos, 'em', created_at) order by created_at desc)
                    from (select * from hoje order by created_at desc limit 5) h), '[]'::jsonb),
  'semana', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'titulos', titulos, 'pos', pos) order by ord)
                      from pos where ord <= 5), '[]'::jsonb),
  'eu', (select jsonb_build_object('nome', nome, 'titulos', titulos, 'pos', pos) from pos where k = auth.uid()::text),
  'batismo', (select jsonb_build_object('clube', escudo_time, 'desde', desde) from bat)
);
$function$;
