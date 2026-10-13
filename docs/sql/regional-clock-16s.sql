-- ⏱️ +1 SEGUNDO NA PARTIDA DAS COPAS REGIONAIS ONLINE (13/10) — 15000 → 16000
-- Pedido do Diego, junto com o da Copa do Mundo (`online-copa-clock-16s.sql`): *"aumente mais 1s em cada jogo da copa"* → *"sim, quero"* nas regionais.
-- ÚNICA mudança em relação a `regional-clock.sql`: `15000` → `16000`. APLICADO no banco em 13/10.
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
   r.started_at:=stamp; r.duration_ms:=round(16000/r.speed); r.extra_ms:=700+greatest(0,least(60000,p_extra));
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
