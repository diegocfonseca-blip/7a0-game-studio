-- 🌍 26/11: o perfil conta o SUPER MUNDIAL nos títulos do online.
--  · Só Super Mundial (com o seu time): o campeão vem como league_champion + comp 'supermundial' (igual à Só Champions/Relâmpago)
--  · Liga + Super Mundial (convocando): vem em cup_titles 'supermundial'
-- As duas formas somam na mesma taça. O resto da função é o mesmo de antes.
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
      count(*) filter (where coalesce((r->>'league_champion')::boolean, false) and r->>'comp' = 'supermundial') as supermundial_direto,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'copa')), 0) as copa,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'libertadores')), 0) as libertadores,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'mundial')), 0) as mundial,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'regional')), 0) as regional,
      coalesce(sum((select count(*) from jsonb_array_elements_text(case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) t where t = 'supermundial')), 0) as supermundial_conv
    from x
  )
  select jsonb_build_object('liga', liga, 'champions', champions, 'relampago', relampago, 'copa', copa,
    'libertadores', libertadores, 'mundial', mundial, 'regional', regional, 'supermundial', supermundial_direto + supermundial_conv) from c
$function$;
