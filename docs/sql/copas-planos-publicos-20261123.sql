-- 23/11: liberação autorizada a todos os participantes da própria sala/edição.
-- Mantém RPC pública invoker, validação de auth.uid(), histórico e corte do servidor.
create or replace function esc_copa_plano_private.esc_copa_plano_set(p_room uuid,p_tipo text,p_edicao integer,p_seed bigint,p_plan jsonb,p_id uuid,p_live boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); c record; cutoff integer:=0; target integer; prior record; payload jsonb;
begin
 if me is null or not exists(select 1 from public.room_players where room_id=p_room and user_id=me) then raise exception 'Plano indisponível para esta conta ou sala' using errcode='42501';end if;
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
