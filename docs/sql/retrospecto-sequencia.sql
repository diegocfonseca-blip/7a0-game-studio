-- 🆚 08/11: prateleira de rivalidades — o retrospecto passa a guardar os ÚLTIMOS 10 resultados do par (pra "3 vitórias seguidas").
-- Do ponto de vista de `a` (a < b): 'A' = a venceu · 'E' = empate · 'B' = b venceu. Coluna nova com default: nada do que existe muda.
alter table public.esc_retrospecto add column if not exists ultimos text not null default '';

create or replace function public.esc_retrospecto_soma(p_room uuid, p_chave text, p_jogos jsonb)
 returns integer language plpgsql security definer set search_path to ''
as $function$
declare j jsonb; ua uuid; ub uuid; ga integer; gb integer; tu uuid; tg integer; n integer := 0; r text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from public.game_rooms g where g.id = p_room and g.host_id = auth.uid()) then
    raise exception 'Only the room host' using errcode = '42501'; end if;
  if p_chave is null or length(p_chave) > 120 or jsonb_typeof(p_jogos) <> 'array' or jsonb_array_length(p_jogos) > 20 then
    raise exception 'Invalid' using errcode = '22023'; end if;
  insert into public.esc_retrospecto_log(room_id, chave) values (p_room, p_chave) on conflict do nothing;
  if not found then return 0; end if;
  for j in select * from jsonb_array_elements(p_jogos) loop
    ua := (j->>'a')::uuid; ub := (j->>'b')::uuid; ga := (j->>'ga')::integer; gb := (j->>'gb')::integer;
    if ua is null or ub is null or ua = ub or ga is null or gb is null or ga not between 0 and 30 or gb not between 0 and 30 then continue; end if;
    if not exists (select 1 from public.room_players rp where rp.room_id = p_room and rp.user_id = ua)
       or not exists (select 1 from public.room_players rp where rp.room_id = p_room and rp.user_id = ub) then continue; end if;
    if ua > ub then tu := ua; ua := ub; ub := tu; tg := ga; ga := gb; gb := tg; end if;
    r := case when ga > gb then 'A' when ga = gb then 'E' else 'B' end;
    insert into public.esc_retrospecto as t (a, b, vit_a, empates, vit_b, ultimos) values (ua, ub, (ga > gb)::int, (ga = gb)::int, (gb > ga)::int, r)
      on conflict (a, b) do update set vit_a = t.vit_a + (ga > gb)::int, empates = t.empates + (ga = gb)::int, vit_b = t.vit_b + (gb > ga)::int,
        ultimos = right(t.ultimos || r, 10), atualizado = now();
    n := n + 1;
  end loop;
  return n;
end $function$;
