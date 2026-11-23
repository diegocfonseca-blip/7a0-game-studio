-- Executar após o DDL, dentro de BEGIN ... ROLLBACK. Não deixa sala nem plano persistidos.
insert into public.game_rooms(id,code,host_id,mode,status,max_players,game_state) values('7f313500-1123-4000-8000-000000000001','QACUPP','6b5cf422-d4ad-4c69-a7e6-da1125c85844','rapido','playing',2,'{}');
insert into public.room_players(room_id,user_id,player_index,manager_name) values
 ('7f313500-1123-4000-8000-000000000001','6b5cf422-d4ad-4c69-a7e6-da1125c85844',0,'QA plano dono'),
 ('7f313500-1123-4000-8000-000000000001','b068eff2-098f-4370-87de-3f90dd7b12f6',1,'QA plano convidado');
insert into public.esc_copa_salas(room_id,edicao,seed,times,fase) values('7f313500-1123-4000-8000-000000000001',999,1123999,'[{"uid":"6b5cf422-d4ad-4c69-a7e6-da1125c85844","pais":"Brasil"},{"uid":"b068eff2-098f-4370-87de-3f90dd7b12f6","pais":"Argentina"}]','torneio');
insert into public.esc_copa_clock_preview(room_id,edicao,seed,revision,step,running,manual,speed,started_at,updated_at,duration_ms,extra_ms) values('7f313500-1123-4000-8000-000000000001',999,1123999,1,1,true,true,1,clock_timestamp()-interval '2 seconds',now(),16000,700);
insert into public.esc_regional_clock(room_id,edicao,seed,revision,step,running,manual,speed,started_at,updated_at,duration_ms,extra_ms) select room_id,edicao,seed,revision,step,running,manual,speed,started_at,updated_at,duration_ms,extra_ms from public.esc_copa_clock_preview where room_id='7f313500-1123-4000-8000-000000000001';
do $$
declare room constant uuid:='7f313500-1123-4000-8000-000000000001';main constant uuid:='6b5cf422-d4ad-4c69-a7e6-da1125c85844';guest constant uuid:='b068eff2-098f-4370-87de-3f90dd7b12f6';kind text;v jsonb;before_time timestamptz;before_updated timestamptz;plan constant jsonb:='{"posture":"ataque","attack":"wings","pressure":"high","pace":"fast","mark":null}';invalid_caught boolean;request_id uuid;
begin
 assert not has_function_privilege('anon','public.esc_copa_plano_set(uuid,text,integer,bigint,jsonb,uuid,boolean)','execute');
 for kind in select unnest(array['mundo','regional']) loop
  perform set_config('request.jwt.claim.sub',main::text,true);
  perform public.esc_copa_plano_registrar(room,kind,999,1123999);
  v:=public.esc_copa_plano_set(room,kind,999,1123999,plan,gen_random_uuid(),false);
  assert v->>'motivo'='aguardando_versoes','older participant must prevent new orders';
  perform set_config('request.jwt.claim.sub',guest::text,true);
  perform public.esc_copa_plano_registrar(room,kind,999,1123999);
  perform set_config('request.jwt.claim.sub',main::text,true);
  v:=public.esc_copa_plano_set(room,kind,999,1123999,plan,gen_random_uuid(),false);
  assert(v->>'ok')::boolean,'saved choice accepted';
  assert(v->'state'->'planos'->0->>'step')::integer=2,'saved choice targets future match';
  request_id:=gen_random_uuid();
  if kind='mundo' then select c.started_at,c.updated_at into before_time,before_updated from public.esc_copa_clock_preview c where c.room_id=room;else select c.started_at,c.updated_at into before_time,before_updated from public.esc_regional_clock c where c.room_id=room;end if;
  v:=public.esc_copa_plano_set(room,kind,999,1123999,plan,request_id,true);
  assert(v->>'ok')::boolean,'live order accepted';
  assert(v->>'from')::integer between 30 and 87,'server cut-off leaves delivery time';
  assert jsonb_array_length(v->'state'->'planos')=2,'save plus live order';
  if kind='mundo' then assert exists(select 1 from public.esc_copa_clock_preview c where c.room_id=room and c.started_at=before_time and c.updated_at=before_updated),'clock and reading countdown stay unchanged';else assert exists(select 1 from public.esc_regional_clock c where c.room_id=room and c.started_at=before_time and c.updated_at=before_updated),'clock and reading countdown stay unchanged';end if;
  v:=public.esc_copa_plano_set(room,kind,999,1123999,plan,request_id,true);
  assert jsonb_array_length(v->'state'->'planos')=2,'duplicate request remains idempotent';
  perform set_config('request.jwt.claim.sub',guest::text,true);
  v:=public.esc_copa_plano_set(room,kind,999,1123999,plan||'{"posture":"retranca"}',gen_random_uuid(),false);
  assert(v->>'ok')::boolean,'participant outside the former allowlist can save its own choice';
  assert jsonb_array_length(v->'state'->'planos')=3,'guest does not overwrite host';
  v:=public.esc_copa_plano_set(room,kind,999,1123999,plan,request_id,true);
  assert v->>'motivo'='pedido_reutilizado','another participant cannot reuse a host request';
  v:=public.esc_copa_tatica_set(room,kind,999,1123999,'retranca');
  assert(v->>'ok')::boolean,'legacy selector still works';
  select p.plan into v from esc_copa_plano_private.plans p where p.room_id=room and p.tipo=kind and p.uid=guest order by p.seq desc limit 1;
  assert v->>'posture'='retranca' and v->>'pressure'='high','legacy selector replaces posture without resetting remaining plan';
  invalid_caught:=false;
  begin perform public.esc_copa_plano_set(room,kind,999,1123999,plan||'{"posture":null}',gen_random_uuid(),false);exception when sqlstate '22023' then invalid_caught:=true;end;
  assert invalid_caught,'JSON null enum rejected';
  invalid_caught:=false;
  begin perform public.esc_copa_plano_set(room,kind,999,1123999,plan||'{"mark":"someone"}',gen_random_uuid(),false);exception when sqlstate '22023' then invalid_caught:=true;end;
  assert invalid_caught,'individual marking rejected';
  perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000088',true);
  assert(public.esc_copa_taticas(room,kind,999,1123999)->>'rev')::integer=-1,'outsider cannot read';
  invalid_caught:=false;
  begin perform public.esc_copa_plano_set(room,kind,999,1123999,plan,gen_random_uuid(),false);exception when sqlstate '42501' then invalid_caught:=true;end;
  assert invalid_caught,'outsider cannot write';
  perform set_config('request.jwt.claim.sub',main::text,true);
  if kind='mundo' then update public.esc_copa_clock_preview set running=false where room_id=room;else update public.esc_regional_clock set running=false where room_id=room;end if;
  v:=public.esc_copa_plano_set(room,kind,999,1123999,plan,gen_random_uuid(),true);
  assert v->>'motivo'='fora_do_jogo','no live change after full time';
  v:=public.esc_copa_plano_set(room,kind,999,1123999,plan,gen_random_uuid(),false);
  assert(v->>'ok')::boolean,'between-games choice is allowed';
 end loop;
end $$;
select 'PASS: mundo/regional, capabilities, guest identity, server timing, immutable requests, enums, permissions and between-match saves' as test;
