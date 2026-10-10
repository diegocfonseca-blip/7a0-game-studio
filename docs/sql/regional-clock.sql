-- 🏟️ RELÓGIO DA COPA REGIONAL NAS SALAS ONLINE (Diego 10/10)
--
-- Liga + Rio × SP / Sul × Minas-PR / Nordeste: 16 clubes em dois lados de 8, cada
-- um joga contra os 8 do OUTRO lado (formato real da Copa do Nordeste 2018-22),
-- depois quartas cruzadas, semi e final em jogo único.
--
-- É o MESMO relógio da Copa do Mundo da sala (`esc_copa_preview_clock`): o banco
-- carimba o início de cada passo e todo aparelho lê o mesmo minuto; só o DONO da
-- sala manda (next/skip/finish/manual/auto/speed), com CAS pela `revision`.
-- A diferença: a Copa do Mundo tem os passos FIXOS (3 rodadas + mata-mata); aqui o
-- número de rodadas e de fases do mata-mata vem do tamanho da copa (8 por lado =
-- 8 rodadas + quartas/semi/final; 4 por lado = 4 rodadas + semi/final), então o
-- cliente manda `p_rodadas` e `p_ko`. Como só o dono avança, isso não abre brecha:
-- o pior que o dono poderia fazer é estragar o relógio da PRÓPRIA sala.
--
-- Passos: 1..R = rodadas (bola rolando) · R+1 = chaveamento (parado) ·
--         R+2..R+1+KO = mata-mata (bola rolando) · R+2+KO = cerimônia (fim).
-- Tabela própria (não mexe na da Copa do Mundo, que está no ar).
create table if not exists public.esc_regional_clock (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  edicao integer not null,
  seed bigint not null,
  revision bigint not null default 0,
  step integer not null default 0,
  running boolean not null default false,
  manual boolean not null default false,
  speed numeric not null default 1,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  duration_ms integer not null default 15000,
  extra_ms integer not null default 700,
  primary key (room_id, edicao, seed)
);
alter table public.esc_regional_clock enable row level security;
drop policy if exists regional_clock_read on public.esc_regional_clock;
create policy regional_clock_read on public.esc_regional_clock for select to authenticated using (
  exists(select 1 from public.game_rooms g where g.id = room_id and g.host_id = (select auth.uid()))
  or exists(select 1 from public.room_players p where p.room_id = esc_regional_clock.room_id and p.user_id = (select auth.uid())));
drop policy if exists regional_clock_insert on public.esc_regional_clock;
create policy regional_clock_insert on public.esc_regional_clock for insert to authenticated with check (
  exists(select 1 from public.game_rooms g where g.id = room_id and g.host_id = (select auth.uid())));
drop policy if exists regional_clock_update on public.esc_regional_clock;
create policy regional_clock_update on public.esc_regional_clock for update to authenticated using (
  exists(select 1 from public.game_rooms g where g.id = room_id and g.host_id = (select auth.uid())))
  with check (exists(select 1 from public.game_rooms g where g.id = room_id and g.host_id = (select auth.uid())));

create or replace function public.esc_regional_clock(p_room uuid, p_edicao integer, p_seed bigint, p_command text default 'read',
  p_revision bigint default -1, p_speed numeric default 1, p_extra integer default 0, p_rodadas integer default 8, p_ko integer default 3)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.esc_regional_clock; stamp timestamptz := clock_timestamp(); target integer; fim integer;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_command <> 'read' and not exists(select 1 from public.game_rooms g where g.id=p_room and g.host_id=auth.uid()) then raise exception 'Only the room host can control the clock' using errcode='42501'; end if;
 if p_rodadas not between 1 and 16 or p_ko not between 1 and 4 then raise exception 'Formato inválido' using errcode='22023'; end if;
 fim := p_rodadas + 2 + p_ko;
 if p_command='init' then
  insert into public.esc_regional_clock(room_id,edicao,seed) values(p_room,p_edicao,p_seed) on conflict do nothing;
 end if;
 select * into r from public.esc_regional_clock c where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed;
 if r.room_id is null then return jsonb_build_object('clock',null,'server_ms',extract(epoch from stamp)*1000); end if;
 if p_command not in ('read','init') then
  select * into r from public.esc_regional_clock c where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed for update;
  if p_revision <> r.revision then return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000); end if;
  if p_command='finish' and r.running and stamp>=r.started_at+((r.duration_ms+r.extra_ms)*interval '1 millisecond') then r.running:=false;
  elsif p_command='skip' and r.running then r.running:=false;
  elsif p_command='next' and not r.running and r.step<fim then
   target:=r.step+1; r.step:=target; r.running:=target between 1 and p_rodadas or target between p_rodadas+2 and p_rodadas+1+p_ko;
   r.started_at:=stamp; r.duration_ms:=round(15000/r.speed); r.extra_ms:=700+greatest(0,least(60000,p_extra));
  elsif p_command='manual' then r.manual:=true;
  elsif p_command='auto' then r.manual:=false;
  elsif p_command='speed' and p_speed in (0.25,0.5,1,2,4) and not r.running then r.speed:=p_speed;
  else return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
  end if;
  update public.esc_regional_clock c set step=r.step,running=r.running,manual=r.manual,speed=r.speed,started_at=r.started_at,duration_ms=r.duration_ms,extra_ms=r.extra_ms,updated_at=stamp,revision=c.revision+1
  where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed returning * into r;
 end if;
 return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
end $$;
revoke all on function public.esc_regional_clock(uuid,integer,bigint,text,bigint,numeric,integer,integer,integer) from public, anon;
grant execute on function public.esc_regional_clock(uuid,integer,bigint,text,bigint,numeric,integer,integer,integer) to authenticated;
