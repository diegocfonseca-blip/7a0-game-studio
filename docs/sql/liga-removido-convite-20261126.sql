-- 🚫🙋 26/11 (Diego: "quem foi removido não pode estar dentro da liga… se quiser pedir convite pode, mas como qualquer outra
-- pessoa… só com plano… e entra como algo novo, nada de voltar pro time que era o dele"). Complementa liga-removidos-20261124.sql.
-- 1) a remoção guarda TAMBÉM a vaga (crachá) que era dele — pra ele nunca voltar pro mesmo time
-- 2) removido só pede convite COM PLANO (sem a exceção de "já foi membro") e o pedido aceito ANTIGO não vale mais
-- 3) o dono não consegue pôr o removido de volta no time antigo (esc_liga_responder devolve 'antigo')
-- 4) esc_liga_removidos_dono: o dono lê {uid: vaga antiga} pra tela de aceitar e pra virada esconderem esse time

alter table public.esc_liga_removidos add column if not exists indice int;

create or replace function public.esc_liga_remove(p_room uuid, p_uid uuid, p_index int)
returns boolean language plpgsql security definer set search_path = public as $$
declare g public.game_rooms%rowtype; v_uid uuid := p_uid;
begin
  select * into g from public.game_rooms where id = p_room;
  if not found or auth.uid() is null or auth.uid() not in (g.host_id, coalesce(g.liga_dono, g.host_id)) then return false; end if;
  if coalesce(g.game_state->>'mode','') <> 'liga' then return false; end if;
  if v_uid is null then select user_id into v_uid from public.room_players where room_id = p_room and player_index = p_index limit 1; end if;
  if v_uid is null or v_uid in (g.host_id, coalesce(g.liga_dono, g.host_id)) then return false; end if;
  insert into public.esc_liga_removidos(room_id, user_id, em, indice) values (p_room, v_uid, now(), p_index)
  on conflict (room_id, user_id) do update set em = now(), indice = coalesce(excluded.indice, esc_liga_removidos.indice);
  return true;
end $$;

create or replace function public.esc_liga_pedir(p_room uuid, p_nome text)
returns text language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); r public.game_rooms%rowtype; st text; removido boolean;
begin
  if eu is null then return 'login'; end if;
  select * into r from public.game_rooms where id = p_room;
  if not found or coalesce(r.game_state->>'mode','') <> 'liga' then return 'erro'; end if;
  if coalesce(r.liga_dono, r.host_id) = eu then return 'dono'; end if;
  if exists (select 1 from public.room_players where room_id = p_room and user_id = eu) then return 'ja'; end if;
  removido := public.esc_liga_removido_ativo(p_room, eu);
  if removido then
    if not esc_pago_uid(eu) then return 'plano'; end if;
  elsif not esc_pago_uid(eu) and not esc_liga_ja_foi_membro(p_room, eu) then return 'plano'; end if;
  select status into st from public.esc_liga_pedidos where room_id = p_room and user_id = eu;
  if st = 'aceito' and not removido then return 'aceito'; end if;
  insert into public.esc_liga_pedidos(room_id, user_id, nome, status)
  values (p_room, eu, left(coalesce(p_nome,''), 40), 'pendente')
  on conflict (room_id, user_id) do update set nome = excluded.nome, updated_at = now(), alvo_bot = case when removido then null else esc_liga_pedidos.alvo_bot end,
    alvo_uid = case when removido then null else esc_liga_pedidos.alvo_uid end,
    status = case when removido or esc_liga_pedidos.status in ('recusado','entrou') then 'pendente' else esc_liga_pedidos.status end;
  return 'ok';
end $$;

create or replace function public.esc_liga_responder(p_id uuid, p_aceitar boolean, p_bot integer, p_uid uuid)
returns text language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); p public.esc_liga_pedidos%rowtype; v_ant int;
begin
  select * into p from public.esc_liga_pedidos where id = p_id;
  if not found then return 'erro'; end if;
  if eu is null or not exists (select 1 from public.game_rooms g where g.id = p.room_id and coalesce(g.liga_dono, g.host_id) = eu) then return 'dono'; end if;
  if not p_aceitar then
    update public.esc_liga_pedidos set status = 'recusado', alvo_bot = null, alvo_uid = null, updated_at = now() where id = p_id;
    return 'ok';
  end if;
  if not esc_pago_uid(p.user_id) then return 'plano'; end if;
  if p_bot is null and p_uid is null then return 'alvo'; end if;
  select indice into v_ant from public.esc_liga_removidos where room_id = p.room_id and user_id = p.user_id;
  if v_ant is not null and p_bot = v_ant then return 'antigo'; end if;
  update public.esc_liga_pedidos set status = 'aceito', alvo_bot = p_bot, alvo_uid = p_uid, updated_at = now() where id = p_id;
  return 'ok';
end $$;

create or replace function public.esc_liga_removidos_dono(p_room uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(r.user_id::text, r.indice), '{}'::jsonb)
  from public.esc_liga_removidos r join public.game_rooms g on g.id = r.room_id
  where r.room_id = p_room and r.indice is not null and auth.uid() is not null and coalesce(g.liga_dono, g.host_id) = auth.uid()
$$;
grant execute on function public.esc_liga_removidos_dono(uuid) to authenticated;
