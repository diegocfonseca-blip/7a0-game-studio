-- 📊 19/10 (Diego): só o número grande e a temporada embaixo. Hoje a temporada é a do save jogado por último e a posição é a
-- MELHOR de todos os saves nessa temporada (`esc_pyramid_my_rank`, a mesma do ranking global). ⏳ Diego ainda vai confirmar se a
-- temporada deve ser a do save que chegou MAIS LONGE (max season_no) em vez da do último jogado.
create or replace function public.esc_perfil_rank(p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $function$
declare s int; r record;
begin
  select season_no into s from esc_pyramid_rank_snap where user_id = p_uid
    order by updated_at desc nulls last, season_no desc limit 1;
  if s is null then return null; end if;
  select * into r from esc_pyramid_my_rank(s, p_uid);
  if r.pos is null then return null; end if;
  return jsonb_build_object('pos', r.pos, 'total', r.total, 'temporada', s);
end $function$;
