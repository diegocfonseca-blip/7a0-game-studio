-- 📊 19/10 (Diego, regra final): "o save dele atual que tá com melhor ranking em temporada". Cada save tem a sua posição no
-- ranking global NA TEMPORADA em que ele está (`esc_pyramid_career_rank`, a mesma conta do ranking global); o perfil mostra o save
-- com a MELHOR posição: só o número e a temporada dele. Até as 8 carreiras mais recentes, pra o perfil abrir rápido.
create or replace function public.esc_perfil_rank(p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $function$
declare m record;
begin
  select c.season_no, x.pos, x.total into m from (
      select * from (
        select distinct on (career_id) career_id, season_no, updated_at from esc_pyramid_rank_snap
         where user_id = p_uid order by career_id, season_no desc
      ) u order by u.updated_at desc nulls last limit 8
    ) c, lateral esc_pyramid_career_rank(c.season_no, p_uid, c.career_id) x
   order by x.pos, c.season_no desc limit 1;
  if m.pos is null then return null; end if;
  return jsonb_build_object('pos', m.pos, 'total', m.total, 'temporada', m.season_no);
end $function$;
