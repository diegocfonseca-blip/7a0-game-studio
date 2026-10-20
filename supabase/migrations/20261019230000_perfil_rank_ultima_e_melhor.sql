-- 📊 19/10 (Diego): o ranking é POR TEMPORADA, igual ao global. O perfil mostra a ÚLTIMA carreira (posição na temporada em que
-- ela está) e a MELHOR posição que a pessoa já teve entre as carreiras dela (cada uma na temporada dela; até as 8 mais recentes).
create or replace function public.esc_perfil_rank(p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $function$
declare b record; r record; m record;
begin
  select s.season_no, s.team_name, s.career_id into b
    from esc_pyramid_rank_snap s where s.user_id = p_uid
    order by s.updated_at desc nulls last, s.season_no desc limit 1;
  if b.season_no is null then return null; end if;
  select * into r from esc_pyramid_career_rank(b.season_no, p_uid, b.career_id);
  if r.pos is null then return null; end if;
  select c.season_no, c.team_name, x.pos into m from (
      select * from (
        select distinct on (career_id) career_id, season_no, team_name, updated_at from esc_pyramid_rank_snap
         where user_id = p_uid order by career_id, season_no desc
      ) u order by u.updated_at desc nulls last limit 8
    ) c, lateral esc_pyramid_career_rank(c.season_no, p_uid, c.career_id) x
   order by x.pos, c.season_no desc limit 1;
  return jsonb_build_object('pos', r.pos, 'total', r.total, 'temporada', b.season_no, 'clube', b.team_name, 'ultima', true,
    'melhor', case when m.pos is not null and m.pos < r.pos then jsonb_build_object('pos', m.pos, 'temporada', m.season_no, 'clube', m.team_name) end);
end $function$;
