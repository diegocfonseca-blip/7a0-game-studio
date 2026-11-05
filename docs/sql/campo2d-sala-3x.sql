-- ⏩ 05/11 — CAMPO 2D NAS SALAS ONLINE A 3× (Diego: "deixa na velocidade 3x o modo auto das salas online"). Carreira é 2× no código.
-- Copa do Mundo/Euro e regionais: o passo 2D passa de 109756 ms (1:30) pra 36585 ms (= 109756 ÷ 3, ~30 s na tela).
-- E a marcha 3× entra na lista do comando 'speed' (Diego: 3× como opção no Manual em todo modo).
-- Cópia das funções que estavam valendo no banco em 05/11 + só isso. Reverter = trocar 36585 de volta por 109756.
create or replace function public.esc_copa_preview_clock(p_room uuid, p_edicao integer, p_seed bigint, p_command text default 'read'::text, p_revision bigint default '-1'::integer, p_speed numeric default 1, p_extra integer default 0)
 returns jsonb language plpgsql set search_path to '' as $function$
declare r public.esc_copa_clock_preview; stamp timestamptz := clock_timestamp(); target integer; d2 boolean := false;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_command <> 'read' and not exists(select 1 from public.game_rooms g where g.id=p_room and g.host_id=auth.uid()) then raise exception 'Only the room host can control the clock' using errcode='42501'; end if;
 if p_command='init' then
  insert into public.esc_copa_clock_preview(room_id,edicao,seed) values(p_room,p_edicao,p_seed) on conflict do nothing;
 end if;
 select * into r from public.esc_copa_clock_preview c where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed;
 if r.room_id is null then return jsonb_build_object('clock',null,'server_ms',extract(epoch from stamp)*1000); end if;
 if p_command not in ('read','init') then
  select * into r from public.esc_copa_clock_preview c where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed for update;
  if p_revision <> r.revision then return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000); end if;
  if p_command in ('next','finish') then select coalesce((g.game_state->>'campo2d')::boolean,false) into d2 from public.game_rooms g where g.id=p_room; d2 := coalesce(d2,false); end if;
  if p_command='finish' and r.running and stamp>=r.started_at+(((case when d2 then round(r.duration_ms*0.82)+3000 else r.duration_ms end)+r.extra_ms)*interval '1 millisecond') then r.running:=false;
  elsif p_command='skip' and r.running then r.running:=false;
  elsif p_command='next' and not r.running and r.step<9 then
   target:=r.step+1;
   if target=5 and coalesce((select jsonb_array_length(s.times) from public.esc_copa_salas s where s.room_id=p_room and s.edicao=p_edicao and jsonb_typeof(s.times)='array' limit 1),32) <= 16 then target:=6; end if;
   r.step:=target; r.running:=target between 1 and 3 or target between 5 and 8;
   r.started_at:=stamp; r.duration_ms:=round((case when d2 then 36585 else 16000 end)/r.speed); r.extra_ms:=700+greatest(0,least(60000,p_extra));
  elsif p_command='manual' then r.manual:=true;
  elsif p_command='auto' then r.manual:=false;
  elsif p_command='speed' and p_speed in (0.25,0.5,1,2,3,4) and not r.running then r.speed:=p_speed;
  else return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
  end if;
  update public.esc_copa_clock_preview c set step=r.step,running=r.running,manual=r.manual,speed=r.speed,started_at=r.started_at,duration_ms=r.duration_ms,extra_ms=r.extra_ms,updated_at=stamp,revision=c.revision+1 where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed returning * into r;
 end if;
 return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
end $function$;

create or replace function public.esc_regional_clock(p_room uuid, p_edicao integer, p_seed bigint, p_command text default 'read'::text, p_revision bigint default '-1'::integer, p_speed numeric default 1, p_extra integer default 0, p_rodadas integer default 8, p_ko integer default 3)
 returns jsonb language plpgsql set search_path to '' as $function$
declare r public.esc_regional_clock; stamp timestamptz := clock_timestamp(); target integer; fim integer; d2 boolean := false;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_command <> 'read' and not exists(select 1 from public.game_rooms g where g.id=p_room and g.host_id=auth.uid()) then raise exception 'Only the room host can control the clock' using errcode='42501'; end if;
 if p_rodadas not between 1 and 16 or p_ko not between 1 and 4 then raise exception 'Formato inválido' using errcode='22023'; end if;
 fim := p_rodadas + 2 + p_ko;
 if p_command='init' then insert into public.esc_regional_clock(room_id,edicao,seed) values(p_room,p_edicao,p_seed) on conflict do nothing; end if;
 select * into r from public.esc_regional_clock c where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed;
 if r.room_id is null then return jsonb_build_object('clock',null,'server_ms',extract(epoch from stamp)*1000); end if;
 if p_command not in ('read','init') then
  select * into r from public.esc_regional_clock c where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed for update;
  if p_revision <> r.revision then return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000); end if;
  if p_command in ('next','finish') then select coalesce((g.game_state->>'campo2d')::boolean,false) into d2 from public.game_rooms g where g.id=p_room; d2 := coalesce(d2,false); end if;
  if p_command='finish' and r.running and stamp>=r.started_at+(((case when d2 then round(r.duration_ms*0.82)+3000 else r.duration_ms end)+r.extra_ms)*interval '1 millisecond') then r.running:=false;
  elsif p_command='skip' and r.running then r.running:=false;
  elsif p_command='next' and not r.running and r.step<fim then
   target:=r.step+1; r.step:=target; r.running:=target between 1 and p_rodadas or target between p_rodadas+2 and p_rodadas+1+p_ko;
   r.started_at:=stamp; r.duration_ms:=round((case when d2 then 36585 else 16000 end)/r.speed); r.extra_ms:=700+greatest(0,least(60000,p_extra));
  elsif p_command='manual' then r.manual:=true;
  elsif p_command='auto' then r.manual:=false;
  elsif p_command='speed' and p_speed in (0.25,0.5,1,2,3,4) and not r.running then r.speed:=p_speed;
  else return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
  end if;
  update public.esc_regional_clock c set step=r.step,running=r.running,manual=r.manual,speed=r.speed,started_at=r.started_at,duration_ms=r.duration_ms,extra_ms=r.extra_ms,updated_at=stamp,revision=c.revision+1 where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed returning * into r;
 end if;
 return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
end $function$;
