-- 🏆👥 VICE DAS MINHAS LIGAS (19/10, aprovado pelo Diego: "Sobre o vice de minhas ligas, pode fazer sim").
-- A liga guarda o DONO pra sempre (liga_dono, nunca muda). host_id continua sendo quem COMANDA a partida.
-- O vice só assume na SALA DE ESPERA, quando o dono não está lá (sem sinal dele há 2 min).
-- O dono, ao entrar na sala de espera, retoma o comando — nunca no meio do pregão/partida.
-- O vice NÃO exclui, NÃO troca o vice, NÃO muda regra/modo e NÃO tira o dono da sala.

alter table public.game_rooms add column if not exists liga_dono uuid;
alter table public.game_rooms add column if not exists liga_vice uuid;
update public.game_rooms set liga_dono = host_id where liga_dono is null and coalesce(game_state->>'mode','') = 'liga';

create or replace function public.game_rooms_liga_dono_trg() returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.liga_dono is null and coalesce(new.game_state->>'mode','') = 'liga' then new.liga_dono := new.host_id; end if;
  return new;
end $$;
create trigger game_rooms_liga_dono before insert on public.game_rooms for each row execute function public.game_rooms_liga_dono_trg();

alter policy rooms_delete on public.game_rooms using ((select auth.uid()) = coalesce(liga_dono, host_id));

-- 📡 presença do dono numa tabela pequena (mexer na game_rooms a cada minuto mandaria a linha inteira pra sala toda)
create table if not exists public.esc_liga_presenca (room uuid primary key references public.game_rooms(id) on delete cascade, dono_visto timestamptz not null default now());
alter table public.esc_liga_presenca enable row level security;

-- quem comanda (host_id) tira jogador; ninguém além dele mesmo tira o DONO da liga
alter policy players_delete on public.room_players using (
  ((select auth.uid()) = user_id) or (
    (select auth.uid()) = (select g.host_id from public.game_rooms g where g.id = room_players.room_id)
    and room_players.user_id is distinct from (select g.liga_dono from public.game_rooms g where g.id = room_players.room_id)));

-- ⚙️ regras/modo: só o DONO (o vice comanda a partida, não a liga)
-- (liga_patch e esc_liga_modo: troca "r.host_id <> eu" por "coalesce(r.liga_dono, r.host_id) <> eu")

create or replace function public.esc_liga_vice(p_room uuid, p_vice uuid) returns text language plpgsql security definer set search_path to 'public' as $$
declare r public.game_rooms%rowtype; eu uuid := auth.uid(); dono uuid;
begin
  if eu is null then return 'erro'; end if;
  select * into r from public.game_rooms where id = p_room for update;
  if not found or coalesce(r.game_state->>'mode','') <> 'liga' then return 'erro'; end if;
  dono := coalesce(r.liga_dono, r.host_id);
  if dono <> eu then return 'dono'; end if;
  if p_vice is not null then
    if p_vice = dono then return 'erro'; end if;
    if not exists (select 1 from public.room_players where room_id = p_room and user_id = p_vice) then return 'fora'; end if;
  end if;
  update public.game_rooms set liga_vice = p_vice, liga_dono = dono,
    host_id = case when r.status = 'waiting' and r.host_id is distinct from dono and r.host_id = r.liga_vice then dono else r.host_id end
   where id = p_room;
  return 'ok';
end $$;

create or replace function public.esc_liga_dono_aqui(p_room uuid, p_aqui boolean default true) returns text language plpgsql security definer set search_path to 'public' as $$
declare r public.game_rooms%rowtype; eu uuid := auth.uid();
begin
  if eu is null then return 'erro'; end if;
  select * into r from public.game_rooms where id = p_room;
  if not found or coalesce(r.game_state->>'mode','') <> 'liga' then return 'erro'; end if;
  if coalesce(r.liga_dono, r.host_id) <> eu then return 'dono'; end if;
  -- saiu da espera (✅ Guardar e sair): o vice não precisa esperar os 2 minutos
  insert into public.esc_liga_presenca(room, dono_visto) values (p_room, case when p_aqui then now() else to_timestamp(0) end)
    on conflict (room) do update set dono_visto = excluded.dono_visto;
  if not p_aqui then return 'ok'; end if;
  if r.status = 'waiting' and r.host_id <> eu then
    update public.game_rooms set host_id = eu where id = p_room and status = 'waiting';
    return 'voltou';
  end if;
  return 'ok';
end $$;

create or replace function public.esc_liga_vice_abrir(p_room uuid) returns text language plpgsql security definer set search_path to 'public' as $$
declare r public.game_rooms%rowtype; eu uuid := auth.uid(); visto timestamptz;
begin
  if eu is null then return 'erro'; end if;
  select * into r from public.game_rooms where id = p_room for update;
  if not found or coalesce(r.game_state->>'mode','') <> 'liga' then return 'erro'; end if;
  if r.liga_vice is distinct from eu then return 'nao_vice'; end if;
  if r.host_id = eu then return 'ok'; end if;
  if r.status <> 'waiting' then return 'rolando'; end if;
  select dono_visto into visto from public.esc_liga_presenca where room = p_room;
  if visto is not null and visto > now() - interval '2 minutes' then return 'dono_aqui'; end if;
  update public.game_rooms set host_id = eu where id = p_room;
  return 'ok';
end $$;

grant execute on function public.esc_liga_vice(uuid, uuid), public.esc_liga_dono_aqui(uuid, boolean), public.esc_liga_vice_abrir(uuid) to authenticated;
