-- 📊 19/10 (Diego: "quero que apareça ranking da pessoa na temporada que ela tá da última carreira… tipo 43 da temporada 360,
-- igual tem no global"). O perfil mostra a ÚLTIMA carreira que subiu pro ranking (antes era a MELHOR), na temporada dela.
create or replace function public.esc_perfil_rank(p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $function$
declare b record; r record;
begin
  select s.season_no, s.team_name, s.career_id into b
    from esc_pyramid_rank_snap s where s.user_id = p_uid
    order by s.updated_at desc nulls last, s.season_no desc limit 1;
  if b.season_no is null then return null; end if;
  select * into r from esc_pyramid_career_rank(b.season_no, p_uid, b.career_id);
  if r.pos is null then return null; end if;
  return jsonb_build_object('pos', r.pos, 'total', r.total, 'temporada', b.season_no, 'clube', b.team_name, 'ultima', true);
end $function$;
