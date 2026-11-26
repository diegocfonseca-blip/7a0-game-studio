-- 🏛️ Sala de Troféus do Clã (26/11, mockup scripts/mockups/cla-sala-trofeus.png aprovado: "Sim").
-- Soma as taças do online dos MEMBROS ATUAIS do clã (mesma régua do perfil, esc_tacas_online: desde 01/09) + quantas
-- semanas o clã fechou no pódio do ranking de clãs. Só leitura.
create or replace function public.esc_cla_tacas(p_cla bigint)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  with m as (select g.user_id::text as uid from esc_cla_gente() g where g.cla_id = p_cla),
  x as (
    select r
    from (select created_at, human_results from game_champions union all select created_at, human_results from game_champions_arquivo) g,
         jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) r
    where g.created_at >= '2026-09-01'::timestamptz and r->>'user_id' in (select uid from m)
  ), t as (select r, (case when jsonb_typeof(r->'cup_titles') = 'array' then r->'cup_titles' else '[]'::jsonb end) ct from x),
  c as (
    select
      count(*) filter (where coalesce((r->>'league_champion')::boolean, false) and coalesce(r->>'comp', '') = '') as liga,
      count(*) filter (where coalesce((r->>'league_champion')::boolean, false) and r->>'comp' = 'champions') as champions,
      count(*) filter (where coalesce((r->>'league_champion')::boolean, false) and r->>'comp' = 'relampago') as relampago,
      coalesce(sum((select count(*) from jsonb_array_elements_text(ct) e where e = 'copa')), 0) as copa,
      coalesce(sum((select count(*) from jsonb_array_elements_text(ct) e where e = 'libertadores')), 0) as libertadores,
      coalesce(sum((select count(*) from jsonb_array_elements_text(ct) e where e = 'mundial')), 0) as mundial,
      coalesce(sum((select count(*) from jsonb_array_elements_text(ct) e where e = 'regional')), 0) as regional
    from t
  )
  select jsonb_build_object('liga', liga, 'champions', champions, 'relampago', relampago, 'copa', copa,
    'libertadores', libertadores, 'mundial', mundial, 'regional', regional,
    'membros', (select count(*) from m),
    'ouro', (select count(*) from esc_podio_cla_semana p where p.cla_id = p_cla and p.pos = 1),
    'prata', (select count(*) from esc_podio_cla_semana p where p.cla_id = p_cla and p.pos = 2),
    'bronze', (select count(*) from esc_podio_cla_semana p where p.cla_id = p_cla and p.pos = 3))
  from c
$$;
grant execute on function public.esc_cla_tacas(bigint) to anon, authenticated;
