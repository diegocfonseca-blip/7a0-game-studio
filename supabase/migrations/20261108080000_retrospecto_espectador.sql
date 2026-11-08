-- 👁️🆚 08/11: o espectador (liberado no #admin) vê a rivalidade de verdade de quem ele está assistindo.
-- Antes a tela lia `esc_retrospecto` com a conta do PRÓPRIO espectador (o RLS só deixa ler os seus pares) e dava 0×0.
-- Só leitura, só pra espectador liberado, e só de pares em que as DUAS contas estão na sala.
create or replace function public.esc_retrospecto_espectador(p_room uuid, p_eu uuid, p_rivais uuid[])
returns table(a uuid, b uuid, vit_a integer, empates integer, vit_b integer, ultimos text)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
begin
  if not public.esc_sou_espectador() then raise exception 'not authorized' using errcode = '42501'; end if;
  if p_room is null or p_eu is null or p_rivais is null or array_length(p_rivais, 1) > 40 then return; end if;
  if not exists (select 1 from room_players rp where rp.room_id = p_room and rp.user_id = p_eu) then return; end if;
  return query
    select t.a, t.b, t.vit_a, t.empates, t.vit_b, t.ultimos
    from esc_retrospecto t
    where ((t.a = p_eu and t.b = any(p_rivais)) or (t.b = p_eu and t.a = any(p_rivais)))
      and exists (select 1 from room_players rp where rp.room_id = p_room and rp.user_id = case when t.a = p_eu then t.b else t.a end);
end $function$;
grant execute on function public.esc_retrospecto_espectador(uuid, uuid, uuid[]) to authenticated;
