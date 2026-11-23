-- Helpers privilegiadas internas; RPCs públicas apenas encaminham parâmetros.
-- BEGIN ATOMIC resolve OIDs na definição: o cliente não recebe USAGE no esquema interno.


create or replace function esc_copa_plano_private.esc_copa_plano_registrar(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); inserted integer;
begin
 if me is null or p_tipo not in ('mundo','regional') or not exists(select 1 from public.room_players where room_id=p_room and user_id=me) then
  return jsonb_build_object('ok',false);
 end if;
 if not exists(select 1 from public.esc_copa_salas s where s.room_id=p_room and s.edicao=p_edicao and s.seed=p_seed and exists(select 1 from jsonb_array_elements(s.times) t where t->>'uid'=me::text)) then return jsonb_build_object('ok',false);end if;
 insert into esc_copa_plano_private.capabilities values(p_room,p_tipo,p_edicao,p_seed,me) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted>0 then
  if p_tipo='mundo' then update public.esc_copa_clock_preview set revision=revision+1 where room_id=p_room and edicao=p_edicao and seed=p_seed;
  else update public.esc_regional_clock set revision=revision+1 where room_id=p_room and edicao=p_edicao and seed=p_seed;end if;
 end if;
 return jsonb_build_object('ok',true);
end $$;

revoke all on function esc_copa_plano_private.esc_copa_plano_registrar(uuid,text,integer,bigint) from public,anon;
grant execute on function esc_copa_plano_private.esc_copa_plano_registrar(uuid,text,integer,bigint) to authenticated;

create or replace function esc_copa_plano_private.esc_copa_taticas(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint)
returns jsonb language sql stable security definer set search_path='' as $$
 with relogio as (
  select c.step,c.running,c.revision from public.esc_copa_clock_preview c where p_tipo='mundo' and c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed
  union all select c.step,c.running,c.revision from public.esc_regional_clock c where p_tipo='regional' and c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed
 ) select case when auth.uid() is null or not exists(select 1 from public.room_players where room_id=p_room and user_id=auth.uid()) then jsonb_build_object('rev',-1,'linhas','[]'::jsonb)
 else coalesce((select jsonb_build_object('rev',r.revision,'step',r.step,'running',r.running,
  'linhas',coalesce((select jsonb_agg(jsonb_build_object('uid',t.uid,'passo',t.passo,'tatica',t.tatica) order by t.uid,t.passo) from public.esc_copa_tatica t where t.room_id=p_room and t.tipo=p_tipo and t.edicao=p_edicao and t.seed=p_seed and(t.passo<r.step or(t.passo=r.step and not r.running))),'[]'::jsonb),
  'planos',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'uid',p.uid,'seq',p.seq,'step',p.step,'from',p.from_min,'plan',p.plan) order by p.seq) from esc_copa_plano_private.plans p where p.room_id=p_room and p.tipo=p_tipo and p.edicao=p_edicao and p.seed=p_seed),'[]'::jsonb),
  'planos_ativos',exists(select 1 from public.esc_copa_salas s where s.room_id=p_room and s.edicao=p_edicao and s.seed=p_seed and jsonb_array_length(s.times)>0 and not exists(select 1 from jsonb_array_elements(s.times) t where nullif(t->>'uid','') is not null and not exists(select 1 from esc_copa_plano_private.capabilities c where c.room_id=p_room and c.tipo=p_tipo and c.edicao=p_edicao and c.seed=p_seed and c.uid::text=t->>'uid')))
 ) from relogio r limit 1),jsonb_build_object('rev',-1,'linhas','[]'::jsonb)) end
$$;

revoke all on function esc_copa_plano_private.esc_copa_taticas(uuid,text,integer,bigint) from public,anon;
grant execute on function esc_copa_plano_private.esc_copa_taticas(uuid,text,integer,bigint) to authenticated;

create or replace function esc_copa_plano_private.esc_copa_plano_set(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint,p_plan jsonb,p_id uuid,p_live boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); c record; cutoff integer:=0; target integer; prior record; payload jsonb;
begin
 if me is null or me not in('6b5cf422-d4ad-4c69-a7e6-da1125c85844'::uuid,'eb02f1d6-de80-4304-ab49-512342f3c7b7'::uuid) or not exists(select 1 from public.room_players where room_id=p_room and user_id=me) then raise exception 'Plano indisponível para esta conta ou sala' using errcode='42501';end if;
 if not coalesce(jsonb_typeof(p_plan)='object' and p_plan->>'posture' in('retranca','equilibrio','ataque') and p_plan->>'attack' in('mixed','middle','wings') and p_plan->>'pressure' in('normal','high') and p_plan->>'pace' in('normal','slow','fast') and p_plan->'mark'='null'::jsonb and length(p_plan::text)<=300 and p_id is not null,false) then raise exception 'Plano inválido' using errcode='22023';end if;
 if not exists(select 1 from public.esc_copa_salas s where s.room_id=p_room and s.edicao=p_edicao and s.seed=p_seed and exists(select 1 from jsonb_array_elements(s.times) t where t->>'uid'=me::text)) then raise exception 'Sem time nesta edição' using errcode='42501';end if;
 if p_tipo='mundo' then select * into c from public.esc_copa_clock_preview where room_id=p_room and edicao=p_edicao and seed=p_seed for update;
 elsif p_tipo='regional' then select * into c from public.esc_regional_clock where room_id=p_room and edicao=p_edicao and seed=p_seed for update;
 else raise exception 'Copa inválida' using errcode='22023';end if;
 if c is null then return jsonb_build_object('ok',false,'motivo','sem_relogio');end if;
 payload:=public.esc_copa_taticas(p_room,p_tipo,p_edicao,p_seed);
 if not coalesce((payload->>'planos_ativos')::boolean,false) then return jsonb_build_object('ok',false,'motivo','aguardando_versoes');end if;
 select * into prior from esc_copa_plano_private.plans where room_id=p_room and tipo=p_tipo and edicao=p_edicao and seed=p_seed and id=p_id;
 if found then
  if prior.uid<>me or prior.plan<>p_plan then return jsonb_build_object('ok',false,'motivo','pedido_reutilizado');end if;
  return jsonb_build_object('ok',true,'from',prior.from_min,'state',payload);
 end if;
 target:=c.step+1;
 if p_live then
  if not c.running then return jsonb_build_object('ok',false,'motivo','fora_do_jogo');end if;
  -- 4,5 s de antecedência para todos receberem a revisão pela leitura já existente (2 s).
  cutoff:=ceil(extract(epoch from(clock_timestamp()-c.started_at+interval '4.5 seconds'))*1000/(c.duration_ms*.82)*93)::integer;
  if cutoff>=88 then return jsonb_build_object('ok',false,'motivo','janela_encerrada');end if;
  if(select count(*) from esc_copa_plano_private.plans where room_id=p_room and tipo=p_tipo and edicao=p_edicao and seed=p_seed and uid=me and step=c.step and from_min>0)>=16 then return jsonb_build_object('ok',false,'motivo','limite_ordens');end if;
  target:=c.step;
 end if;
 -- Histórico imutável: pedido repetido continua idempotente mesmo depois de outra escolha.
 insert into esc_copa_plano_private.plans(room_id,tipo,edicao,seed,uid,id,step,from_min,plan) values(p_room,p_tipo,p_edicao,p_seed,me,p_id,target,cutoff,p_plan);
 if p_tipo='mundo' then update public.esc_copa_clock_preview set revision=revision+1 where room_id=p_room and edicao=p_edicao and seed=p_seed;
 else update public.esc_regional_clock set revision=revision+1 where room_id=p_room and edicao=p_edicao and seed=p_seed;end if;
 return jsonb_build_object('ok',true,'from',cutoff,'state',public.esc_copa_taticas(p_room,p_tipo,p_edicao,p_seed));
end $$;

revoke all on function esc_copa_plano_private.esc_copa_plano_set(uuid,text,integer,bigint,jsonb,uuid,boolean) from public,anon;
grant execute on function esc_copa_plano_private.esc_copa_plano_set(uuid,text,integer,bigint,jsonb,uuid,boolean) to authenticated;

create or replace function esc_copa_plano_private.esc_copa_tatica_set(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint,p_tatica text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();st integer;run boolean;previous_plan jsonb;reply jsonb;
begin
 if me is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_tatica is null or p_tatica not in('retranca','equilibrio','ataque') then raise exception 'Tática inválida' using errcode='22023';end if;
 if not exists(select 1 from public.room_players where room_id=p_room and user_id=me) then raise exception 'Você não está nesta sala' using errcode='42501';end if;
 -- Serializa com finish/ordens. Nunca altera started_at ou updated_at do relógio.
 if p_tipo='mundo' then select step,running into st,run from public.esc_copa_clock_preview where room_id=p_room and edicao=p_edicao and seed=p_seed for update;
 elsif p_tipo='regional' then select step,running into st,run from public.esc_regional_clock where room_id=p_room and edicao=p_edicao and seed=p_seed for update;
 else raise exception 'Copa inválida' using errcode='22023';end if;
 if st is null or not run then return jsonb_build_object('ok',false,'motivo','fora_do_jogo');end if;
 select plan into previous_plan from esc_copa_plano_private.plans where room_id=p_room and tipo=p_tipo and edicao=p_edicao and seed=p_seed and uid=me order by seq desc limit 1;
 if previous_plan is not null then
  reply:=public.esc_copa_plano_set(p_room,p_tipo,p_edicao,p_seed,previous_plan||jsonb_build_object('posture',p_tatica),gen_random_uuid(),false);
  if not coalesce((reply->>'ok')::boolean,false) then return reply;end if;
 end if;
 insert into public.esc_copa_tatica(room_id,tipo,edicao,seed,uid,passo,tatica) values(p_room,p_tipo,p_edicao,p_seed,me,st,p_tatica)
 on conflict(room_id,tipo,edicao,seed,uid,passo) do update set tatica=excluded.tatica,updated_at=now();
 return jsonb_build_object('ok',true,'passo',st);
end $$;

revoke all on function esc_copa_plano_private.esc_copa_tatica_set(uuid,text,integer,bigint,text) from public,anon;
grant execute on function esc_copa_plano_private.esc_copa_tatica_set(uuid,text,integer,bigint,text) to authenticated;

create or replace function public.esc_copa_plano_registrar(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint) returns jsonb language sql security invoker set search_path='' begin atomic
 select esc_copa_plano_private.esc_copa_plano_registrar(p_room,p_tipo,p_edicao,p_seed);
end;
revoke all on function public.esc_copa_plano_registrar(uuid,text,integer,bigint) from public,anon;
grant execute on function public.esc_copa_plano_registrar(uuid,text,integer,bigint) to authenticated;

create or replace function public.esc_copa_taticas(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint) returns jsonb language sql stable security invoker set search_path='' begin atomic
 select esc_copa_plano_private.esc_copa_taticas(p_room,p_tipo,p_edicao,p_seed);
end;
revoke all on function public.esc_copa_taticas(uuid,text,integer,bigint) from public,anon;
grant execute on function public.esc_copa_taticas(uuid,text,integer,bigint) to authenticated;

create or replace function public.esc_copa_plano_set(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint,p_plan jsonb,p_id uuid,p_live boolean default false) returns jsonb language sql security invoker set search_path='' begin atomic
 select esc_copa_plano_private.esc_copa_plano_set(p_room,p_tipo,p_edicao,p_seed,p_plan,p_id,p_live);
end;
revoke all on function public.esc_copa_plano_set(uuid,text,integer,bigint,jsonb,uuid,boolean) from public,anon;
grant execute on function public.esc_copa_plano_set(uuid,text,integer,bigint,jsonb,uuid,boolean) to authenticated;

create or replace function public.esc_copa_tatica_set(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint,p_tatica text) returns jsonb language sql security invoker set search_path='' begin atomic
 select esc_copa_plano_private.esc_copa_tatica_set(p_room,p_tipo,p_edicao,p_seed,p_tatica);
end;
revoke all on function public.esc_copa_tatica_set(uuid,text,integer,bigint,text) from public,anon;
grant execute on function public.esc_copa_tatica_set(uuid,text,integer,bigint,text) to authenticated;
