-- 🔁 QUEM JÁ FOI DA LIGA SEMPRE PODE VOLTAR (10/11, sala XUPREG do Reffati: o Realengo FC caiu, o time virou bot e, sem plano,
-- o banco barrou a volta dele com LIGA_SO_PLANO). A trava de 06/11 é pra GENTE NOVA; quem já entrou naquela liga não é gente nova.
-- O que muda: a checagem do PLANO é pulada pra quem já foi membro. O resto fica igual — a volta continua passando pelo PEDIDO
-- (LIGA_SO_ACEITO → o dono aceita e escolhe o time, na virada da temporada). Nada de coroa, cadeira ou partida é tocado.
create table if not exists public.esc_liga_membros (
  room_id uuid not null,
  user_id uuid not null,
  desde timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.esc_liga_membros enable row level security; -- sem policy: só as funções (security definer) leem/gravam

create or replace function public.esc_liga_membro_anota() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from public.game_rooms g where g.id = new.room_id and coalesce(g.game_state->>'mode','') = 'liga') then
    insert into public.esc_liga_membros(room_id, user_id) values (new.room_id, new.user_id) on conflict do nothing;
  end if;
  return new;
end $$;
create or replace trigger esc_liga_membro_anota_trg after insert on public.room_players
  for each row execute function public.esc_liga_membro_anota();

-- quem já está nas ligas hoje + quem já fechou temporada nelas
insert into public.esc_liga_membros(room_id, user_id)
select p.room_id, p.user_id from public.room_players p join public.game_rooms g on g.id = p.room_id
 where coalesce(g.game_state->>'mode','') = 'liga' on conflict do nothing;
insert into public.esc_liga_membros(room_id, user_id)
select distinct c.room_id, (h->>'user_id')::uuid from public.game_champions c join public.game_rooms g on g.id = c.room_id,
  jsonb_array_elements(c.human_results) h
 where c.room_id is not null and coalesce(g.game_state->>'mode','') = 'liga' and h->>'user_id' is not null on conflict do nothing;

create or replace function public.esc_liga_ja_foi_membro(p_room uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.esc_liga_membros m where m.room_id = p_room and m.user_id = p_uid)
$$;

create or replace function public.esc_liga_comecada_so_plano() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
declare g public.game_rooms%rowtype;
begin
  select * into g from public.game_rooms where id = new.room_id;
  if not found or not esc_liga_ja_jogou(g.game_state) then return new; end if;
  if coalesce(g.liga_dono, g.host_id) = new.user_id then return new; end if;
  if position(new.user_id::text in g.game_state::text) > 0 then return new; end if; -- já é da liga (crachá/dupla gravados)
  -- 🔁 10/11: quem já foi desta liga não precisa de plano pra voltar (segue pelo pedido, como todo mundo)
  if not esc_pago_uid(new.user_id) and not esc_liga_ja_foi_membro(new.room_id, new.user_id) then raise exception 'LIGA_SO_PLANO' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.esc_liga_pedidos p where p.room_id = new.room_id and p.user_id = new.user_id and p.status in ('aceito','entrou')) then
    raise exception 'LIGA_SO_ACEITO' using errcode = 'P0001';
  end if;
  return new;
end $function$;

create or replace function public.esc_liga_pedir(p_room uuid, p_nome text) returns text
language plpgsql security definer set search_path to 'public' as $function$
declare eu uuid := auth.uid(); r public.game_rooms%rowtype; st text;
begin
  if eu is null then return 'login'; end if;
  select * into r from public.game_rooms where id = p_room;
  if not found or coalesce(r.game_state->>'mode','') <> 'liga' then return 'erro'; end if;
  if coalesce(r.liga_dono, r.host_id) = eu then return 'dono'; end if;
  if exists (select 1 from public.room_players where room_id = p_room and user_id = eu) then return 'ja'; end if;
  if not esc_pago_uid(eu) and not esc_liga_ja_foi_membro(p_room, eu) then return 'plano'; end if; -- 🔁 10/11: ex-membro pede sem plano
  select status into st from public.esc_liga_pedidos where room_id = p_room and user_id = eu;
  if st = 'aceito' then return 'aceito'; end if;
  insert into public.esc_liga_pedidos(room_id, user_id, nome, status)
  values (p_room, eu, left(coalesce(p_nome,''), 40), 'pendente')
  on conflict (room_id, user_id) do update set nome = excluded.nome, updated_at = now(),
    status = case when esc_liga_pedidos.status in ('recusado','entrou') then 'pendente' else esc_liga_pedidos.status end;
  return 'ok';
end $function$;
