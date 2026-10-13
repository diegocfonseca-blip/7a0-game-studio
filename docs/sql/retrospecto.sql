-- 🆚 RETROSPECTO ENTRE AMIGOS (13/10) — Diego aprovou o mockup `scripts/mockups/online-3-ideias.png` (nº 1).
-- Quantas vezes cada PAR de contas se enfrentou nas salas online (sala rápida e Minhas Ligas), de todas as salas.
-- Só jogo de GENTE × GENTE. É estatística de zoeira: não dá benefício nenhum, não mexe em jogo nem em ranking.
--
-- Quem escreve: SÓ o dono da sala (host-autoritativo, igual ao resto do online), por esta função, e só de quem está
-- sentado na sala. Cada rodada tem uma CHAVE própria (`esc_retrospecto_log`): host que recarrega e manda de novo não
-- conta duas vezes. Quem lê: cada um só enxerga os pares em que ELE está.
-- Tráfego: 1 chamada do host por rodada com jogo de gente × gente; leitura de cada jogador = poucas linhas minúsculas.
create table if not exists public.esc_retrospecto (
  a uuid not null, b uuid not null,           -- sempre a < b
  vit_a integer not null default 0, empates integer not null default 0, vit_b integer not null default 0,
  atualizado timestamptz not null default now(),
  primary key (a, b), check (a < b)
);
create table if not exists public.esc_retrospecto_log (
  room_id uuid not null, chave text not null, criado timestamptz not null default now(),
  primary key (room_id, chave)
);
alter table public.esc_retrospecto enable row level security;
alter table public.esc_retrospecto_log enable row level security;
drop policy if exists esc_retrospecto_le on public.esc_retrospecto;
create policy esc_retrospecto_le on public.esc_retrospecto for select to authenticated using (auth.uid() = a or auth.uid() = b);
revoke all on public.esc_retrospecto from anon;
revoke insert, update, delete on public.esc_retrospecto from authenticated;
revoke all on public.esc_retrospecto_log from anon, authenticated;
grant select on public.esc_retrospecto to authenticated;

create or replace function public.esc_retrospecto_soma(p_room uuid, p_chave text, p_jogos jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare j jsonb; ua uuid; ub uuid; ga integer; gb integer; n integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from public.game_rooms g where g.id = p_room and g.host_id = auth.uid()) then
    raise exception 'Only the room host' using errcode = '42501'; end if;
  if p_chave is null or length(p_chave) > 120 or jsonb_typeof(p_jogos) <> 'array' or jsonb_array_length(p_jogos) > 20 then
    raise exception 'Invalid' using errcode = '22023'; end if;
  insert into public.esc_retrospecto_log(room_id, chave) values (p_room, p_chave) on conflict do nothing;
  if not found then return 0; end if; -- essa rodada já foi contada
  for j in select * from jsonb_array_elements(p_jogos) loop
    ua := (j->>'a')::uuid; ub := (j->>'b')::uuid; ga := (j->>'ga')::integer; gb := (j->>'gb')::integer;
    if ua is null or ub is null or ua = ub or ga is null or gb is null or ga not between 0 and 30 or gb not between 0 and 30 then continue; end if;
    if not exists (select 1 from public.room_players r where r.room_id = p_room and r.user_id = ua)
       or not exists (select 1 from public.room_players r where r.room_id = p_room and r.user_id = ub) then continue; end if;
    if ua > ub then select ub, ua, gb, ga into ua, ub, ga, gb; end if;
    insert into public.esc_retrospecto as t (a, b, vit_a, empates, vit_b) values (ua, ub, (ga > gb)::int, (ga = gb)::int, (gb > ga)::int)
      on conflict (a, b) do update set vit_a = t.vit_a + (ga > gb)::int, empates = t.empates + (ga = gb)::int, vit_b = t.vit_b + (gb > ga)::int, atualizado = now();
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.esc_retrospecto_soma(uuid, text, jsonb) from public, anon;
grant execute on function public.esc_retrospecto_soma(uuid, text, jsonb) to authenticated;
