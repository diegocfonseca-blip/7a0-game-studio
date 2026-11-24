-- 🚫 24/11 (Diego: "o host tentou remover outro do Liga Draft, mas o removido voltou"): a remoção pelo dono não ficava anotada
-- em lugar nenhum — só o crachá saía do save. Na janela até o save do dono chegar ao banco (≤ 3 s) o removido ainda aparecia no
-- estado e a trava de entrada (`esc_liga_comecada_so_plano`) deixava ele voltar. Agora o banco guarda QUEM o dono removeu de cada
-- liga, e essa pessoa só volta se o dono aceitar um pedido NOVO dela (pedido aceito depois da remoção).
create table if not exists public.esc_liga_removidos (
  room_id uuid not null,
  user_id uuid not null,
  em timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.esc_liga_removidos enable row level security;
create policy "liga_removidos_le_proprio" on public.esc_liga_removidos for select using (auth.uid() = user_id);

-- o dono (host ou dono da liga) anota a remoção; se o uid não vier, acha pela vaga
create or replace function public.esc_liga_remove(p_room uuid, p_uid uuid, p_index int)
returns boolean language plpgsql security definer set search_path = public as $$
declare g public.game_rooms%rowtype; v_uid uuid := p_uid;
begin
  select * into g from public.game_rooms where id = p_room;
  if not found or auth.uid() is null or auth.uid() not in (g.host_id, coalesce(g.liga_dono, g.host_id)) then return false; end if;
  if coalesce(g.game_state->>'mode','') <> 'liga' then return false; end if;
  if v_uid is null then select user_id into v_uid from public.room_players where room_id = p_room and player_index = p_index limit 1; end if;
  if v_uid is null or v_uid in (g.host_id, coalesce(g.liga_dono, g.host_id)) then return false; end if;
  insert into public.esc_liga_removidos(room_id, user_id, em) values (p_room, v_uid, now())
  on conflict (room_id, user_id) do update set em = now();
  return true;
end $$;
grant execute on function public.esc_liga_remove(uuid, uuid, int) to authenticated;

create or replace function public.esc_liga_removido_ativo(p_room uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.esc_liga_removidos r where r.room_id = p_room and r.user_id = p_uid
    and not exists (select 1 from public.esc_liga_pedidos p where p.room_id = p_room and p.user_id = p_uid
      and p.status in ('aceito','entrou') and coalesce(p.updated_at, p.created_at) > r.em))
$$;

create or replace function public.esc_liga_fui_removido(p_room uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.esc_liga_removido_ativo(p_room, auth.uid())
    or (exists (select 1 from public.esc_liga_pedidos p where p.room_id = p_room and p.alvo_uid = auth.uid() and p.status in ('aceito','entrou'))
        and not coalesce((select (g.game_state->'seatUids') ? auth.uid()::text from public.game_rooms g where g.id = p_room), false)))
$$;

-- a trava de entrada: removido pelo dono não volta (nem pela janela do save atrasado), a não ser com pedido aceito depois
create or replace function public.esc_liga_comecada_so_plano()
returns trigger language plpgsql security definer set search_path = public as $function$
declare g public.game_rooms%rowtype;
begin
  select * into g from public.game_rooms where id = new.room_id;
  if not found then return new; end if;
  if coalesce(g.liga_dono, g.host_id) = new.user_id then return new; end if;
  if coalesce(g.game_state->>'mode','') = 'liga' and public.esc_liga_removido_ativo(new.room_id, new.user_id) then
    raise exception 'LIGA_REMOVIDO' using errcode = 'P0001';
  end if;
  if not esc_liga_ja_jogou(g.game_state) then return new; end if;
  if position(new.user_id::text in g.game_state::text) > 0 then return new; end if;
  if not esc_pago_uid(new.user_id) and not esc_liga_ja_foi_membro(new.room_id, new.user_id) then raise exception 'LIGA_SO_PLANO' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.esc_liga_pedidos p where p.room_id = new.room_id and p.user_id = new.user_id and p.status in ('aceito','entrou')) then
    raise exception 'LIGA_SO_ACEITO' using errcode = 'P0001';
  end if;
  return new;
end $function$;
