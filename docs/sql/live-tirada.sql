-- 🚫🔴 DESTAQUE DE LIVE TIRADO PELO DIEGO (13/10). Sala com link que não é live de verdade perde a faixa
-- "AO VIVO" na lista. Tabela à parte: o estado do jogo (game_rooms.game_state) nunca é tocado.
-- Aplicado no projeto em 13/10.
create table if not exists public.esc_live_tirada (room_id uuid primary key, tirada_em timestamptz not null default now());
alter table public.esc_live_tirada enable row level security;
create policy live_tirada_le on public.esc_live_tirada for select to authenticated, anon using (true);
create or replace function public.esc_tira_destaque(p_room uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt()->>'email','') <> 'diego.c.fonseca@gmail.com' then return false; end if;
  insert into public.esc_live_tirada(room_id, tirada_em) values (p_room, now())
    on conflict (room_id) do update set tirada_em = now();
  return true;
end $$;
revoke all on function public.esc_tira_destaque(uuid) from public;
grant execute on function public.esc_tira_destaque(uuid) to authenticated;
