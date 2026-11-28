-- 28/11 (Diego: "na hora que eu aperto criar… já aparece a sala criada… igual liga draft, igual sala rápido").
-- A carreira online espera numa SALA NORMAL do jogo (game_rooms, com código/senha/provocações/chat de sempre).
-- Na largada, o dono chama esta função: quem está na sala vira clube da carreira (mesmas regras do esc_carr_entrar2:
-- sem plano = uma carreira por vez; quem não pode é pulado e volta na lista "pulados").
create or replace function public.esc_carr_da_sala(p_sala uuid, p_room uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare eu uuid := auth.uid(); s public.esc_carr_sala; r public.game_rooms; p record; livre int; pulados jsonb := '[]'::jsonb; n int := 0; nm text;
begin
  if eu is null then return jsonb_build_object('erro', 'sem_login'); end if;
  select * into s from public.esc_carr_sala where id = p_sala;
  select * into r from public.game_rooms where id = p_room;
  if s.id is null or r.id is null then return jsonb_build_object('erro', 'nao_achou'); end if;
  if s.dono <> eu or r.host_id <> eu or coalesce(r.game_state->>'co2Sala', '') <> p_sala::text then return jsonb_build_object('erro', 'sem_permissao'); end if;
  if public.esc_carr_comecou(s) then return jsonb_build_object('erro', 'comecou'); end if;
  for p in select rp.user_id, rp.manager_name from public.room_players rp where rp.room_id = p_room order by rp.player_index loop
    if exists (select 1 from public.esc_carr_clube where sala = s.id and user_id = p.user_id) then continue; end if;
    if not public.esc_pago_uid(p.user_id) and exists (select 1 from public.esc_carr_clube c where c.user_id = p.user_id and c.sala <> s.id) then
      pulados := pulados || to_jsonb(coalesce(p.manager_name, '?')); continue;
    end if;
    select min(g) into livre from generate_series(0, 19) g where not exists (select 1 from public.esc_carr_clube where sala = s.id and assento = g);
    exit when livre is null;
    -- nome do clube = o apelido da sala sem os selos/emoji de tier (👑⭐💎…); vazio → "Clube N"
    nm := left(btrim(regexp_replace(coalesce(p.manager_name, ''), '[\u2000-\U0010FFFF]', '', 'g')), 24);
    if char_length(coalesce(nm, '')) < 2 then nm := 'Clube ' || (livre + 1); end if;
    insert into public.esc_carr_clube (sala, assento, user_id, nome) values (s.id, livre, p.user_id, nm);
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'adicionados', n, 'pulados', pulados);
end $function$;
grant execute on function public.esc_carr_da_sala(uuid, uuid) to authenticated;
