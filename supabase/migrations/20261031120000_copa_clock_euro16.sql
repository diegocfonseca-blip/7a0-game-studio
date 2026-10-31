-- 🇪🇺 EUROCOPA DE 16 NA SALA (31/10): a Copa de 16 não tem oitavas. O relógio da sala pula do sorteio (passo 4)
-- direto pras QUARTAS (passo 6). Quem decide é o nº de seleções gravado na linha da copa (`esc_copa_salas.times`):
-- 16 ou menos = sem oitavas. Copa do Mundo (32) e Euro de 32 seguem igualzinho. Única linha nova: o `if target=5 …`.
-- Espelho no jogo: `copaSemOitavas` (copa-mundo.tsx) e o `avanca`/`proxPasso` do CupScreen.
CREATE OR REPLACE FUNCTION public.esc_copa_preview_clock(p_room uuid, p_edicao integer, p_seed bigint, p_command text DEFAULT 'read'::text, p_revision bigint DEFAULT '-1'::integer, p_speed numeric DEFAULT 1, p_extra integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
   r.started_at:=stamp; r.duration_ms:=round((case when d2 then 109756 else 16000 end)/r.speed); r.extra_ms:=700+greatest(0,least(60000,p_extra));
  elsif p_command='manual' then r.manual:=true;
  elsif p_command='auto' then r.manual:=false;
  elsif p_command='speed' and p_speed in (0.25,0.5,1,2,4) and not r.running then r.speed:=p_speed;
  else return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
  end if;
  update public.esc_copa_clock_preview c set step=r.step,running=r.running,manual=r.manual,speed=r.speed,started_at=r.started_at,duration_ms=r.duration_ms,extra_ms=r.extra_ms,updated_at=stamp,revision=c.revision+1 where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed returning * into r;
 end if;
 return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
end $function$;
