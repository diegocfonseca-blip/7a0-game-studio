-- 🏆 PERFIL COM AS TAÇAS DO ONLINE (28/10, mockup scripts/mockups/perfil-trofeus.png). Conta, por competição, os títulos de sala de
-- uma conta, a partir do que a sala já anota em `human_results`: `league_champion` (a liga — ou o título da Só Champions/Relâmpago,
-- que não têm liga; desde 28/10 essas duas vêm com `comp`) e `cup_titles` (copa · libertadores · mundial · regional).
-- Mesma régua de datas do ranking "todos os tempos" (desde 01/09) e as duas tabelas (a viva e o arquivo).
create or replace function public.esc_tacas_online(p_uid uuid)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  with x as (
    select r
    from (select created_at, human_results from game_champions union all select created_at, human_results from game_champions_arquivo) g,
         jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) r
    where g.created_at >= '2026-09-01'::timestamptz and r->>'user_id' = p_uid::text
  ), c as (
    select
      count(*) filter (where coalesce((r->>'league_champion')::boolean, false) and coalesce(r->>'comp', '') = '') as liga,
      count(*) filter (where coalesce((r->>'league_champion')::boolean, false) and r->>'comp' = 'champions') as champions,
      count(*) filter (where coalesce((r->>'league_champion')::boolean, false) and r->>'comp' = 'relampago') as relampago,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'copa')), 0) as copa,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'libertadores')), 0) as libertadores,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'mundial')), 0) as mundial,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'regional')), 0) as regional
    from x
  )
  select jsonb_build_object('liga', liga, 'champions', champions, 'relampago', relampago, 'copa', copa,
    'libertadores', libertadores, 'mundial', mundial, 'regional', regional) from c
$function$;
grant execute on function public.esc_tacas_online(uuid) to anon, authenticated;
