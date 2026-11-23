-- 📜 LIVRO DO CLÁSSICO (23/11, mockup scripts/mockups/rivalidade-zoeira.png aprovado): o retrospecto passa a guardar também
-- o ÚLTIMO jogo, a MAIOR goleada e os artilheiros DO CONFRONTO (nome da carta → gols, por lado). Só acrescenta colunas;
-- o que já existia (vit_a/empates/vit_b/ultimos) segue igual. Começa vazio e enche daqui pra frente.
alter table public.esc_retrospecto add column if not exists ultimo jsonb;
alter table public.esc_retrospecto add column if not exists maior jsonb;
alter table public.esc_retrospecto add column if not exists artilheiros jsonb not null default '{}'::jsonb;

create or replace function public.esc_retrospecto_soma(p_room uuid, p_chave text, p_jogos jsonb)
 returns integer language plpgsql security definer set search_path to ''
as $function$
declare j jsonb; ua uuid; ub uuid; ga integer; gb integer; tu uuid; tg integer; n integer := 0; r text;
  ea jsonb; eb jsonb; te jsonb; nome text; lado text; arts jsonb; mx jsonb;
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
    ea := case when jsonb_typeof(j->'ea') = 'array' then j->'ea' else '[]'::jsonb end;
    eb := case when jsonb_typeof(j->'eb') = 'array' then j->'eb' else '[]'::jsonb end;
    if ua is null or ub is null or ua = ub or ga is null or gb is null or ga not between 0 and 30 or gb not between 0 and 30 then continue; end if;
    if not exists (select 1 from public.room_players rp where rp.room_id = p_room and rp.user_id = ua)
       or not exists (select 1 from public.room_players rp where rp.room_id = p_room and rp.user_id = ub) then continue; end if;
    if ua > ub then tu := ua; ua := ub; ub := tu; tg := ga; ga := gb; gb := tg; te := ea; ea := eb; eb := te; end if;
    r := case when ga > gb then 'A' when ga = gb then 'E' else 'B' end;
    insert into public.esc_retrospecto as t (a, b, vit_a, empates, vit_b, ultimos) values (ua, ub, (ga > gb)::int, (ga = gb)::int, (gb > ga)::int, r)
      on conflict (a, b) do update set vit_a = t.vit_a + (ga > gb)::int, empates = t.empates + (ga = gb)::int, vit_b = t.vit_b + (gb > ga)::int,
        ultimos = right(t.ultimos || r, 10), atualizado = now();
    -- 📜 livro: último jogo, maior goleada (maior diferença; empate de diferença fica a mais antiga) e artilheiros do confronto
    select t.artilheiros, t.maior into arts, mx from public.esc_retrospecto t where t.a = ua and t.b = ub;
    arts := coalesce(arts, '{}'::jsonb);
    for lado, nome in (select 'a', x from jsonb_array_elements_text(ea) x limit 15) union all (select 'b', x from jsonb_array_elements_text(eb) x limit 15) loop
      if nome is null or length(nome) = 0 or length(nome) > 60 then continue; end if;
      arts := jsonb_set(arts, array[lado || '|' || nome], to_jsonb(coalesce((arts->>(lado || '|' || nome))::int, 0) + 1));
    end loop;
    update public.esc_retrospecto t set
      ultimo = jsonb_build_object('ga', ga, 'gb', gb, 'em', now()),
      maior = case when mx is null or abs(ga - gb) > abs((mx->>'ga')::int - (mx->>'gb')::int) then jsonb_build_object('ga', ga, 'gb', gb, 'em', now()) else mx end,
      artilheiros = arts
    where t.a = ua and t.b = ub;
    n := n + 1;
  end loop;
  return n;
end $function$;
