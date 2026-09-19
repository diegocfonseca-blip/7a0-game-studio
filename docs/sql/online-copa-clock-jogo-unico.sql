-- 🏆 COPA DO MUNDO EM JOGO ÚNICO (19/09) — o relógio da sala acompanha os passos novos.
--
-- Antes o mata-mata era ida e volta: 12 passos (5 rodadas de grupo · sorteio ·
-- QF ida · QF volta · SF ida · SF volta · final · cerimônia), e "roda bola" nos
-- passos 1–5 e 7–11. Agora quartas, semi e final são UMA partida cada: 10 passos
-- (5 rodadas · sorteio 6 · quartas 7 · semi 8 · final 9 · cerimônia 10), bola
-- rolando em 1–5 e 7–9.
--
-- ⚠️ Estes números são a CÓPIA de `src/escalacao/copa-passos.ts` (PASSO_COPA).
-- Mudou lá, muda aqui. Só duas linhas mudam em relação a
-- `online-copa-clock-public.sql`: o `r.step<10` e o `target between 7 and 9`.
-- RLS, SECURITY INVOKER, CAS e a assinatura ficam iguais.
create or replace function public.esc_copa_preview_clock(p_room uuid,p_edicao integer,p_seed bigint,p_command text default 'read',p_revision bigint default -1,p_speed numeric default 1,p_extra integer default 0)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.esc_copa_clock_preview; stamp timestamptz := clock_timestamp(); target integer;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_command <> 'read' and not exists(select 1 from public.game_rooms g where g.id=p_room and g.host_id=auth.uid()) then raise exception 'Only the room host can control the clock' using errcode='42501'; end if;
 if p_command='init' then
  insert into public.esc_copa_clock_preview(room_id,edicao,seed) values(p_room,p_edicao,p_seed) on conflict do nothing;
 end if;
 select * into r from public.esc_copa_clock_preview c where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed;
 if r.room_id is null then return jsonb_build_object('clock',null,'server_ms',extract(epoch from stamp)*1000); end if;
 if p_command not in ('read','init') then
  -- CAS: a segunda aba do mesmo host não avança a fase duas vezes.
  select * into r from public.esc_copa_clock_preview c where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed for update;
  if p_revision <> r.revision then return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000); end if;
  if p_command='finish' and r.running and stamp>=r.started_at+((r.duration_ms+r.extra_ms)*interval '1 millisecond') then r.running:=false;
  elsif p_command='skip' and r.running then r.running:=false;
  -- 🏆 jogo único: 10 passos; bola rolando nas 5 rodadas de grupo e em quartas/semi/final (7–9)
  elsif p_command='next' and not r.running and r.step<10 then
   target:=r.step+1; r.step:=target; r.running:=target between 1 and 5 or target between 7 and 9;
   r.started_at:=stamp; r.duration_ms:=round(14000/r.speed); r.extra_ms:=700+greatest(0,least(60000,p_extra));
  elsif p_command='manual' then r.manual:=true;
  elsif p_command='auto' then r.manual:=false;
  elsif p_command='speed' and p_speed in (0.25,0.5,1,2,4) and not r.running then r.speed:=p_speed;
  else return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
  end if;
  update public.esc_copa_clock_preview c set step=r.step,running=r.running,manual=r.manual,speed=r.speed,started_at=r.started_at,duration_ms=r.duration_ms,extra_ms=r.extra_ms,updated_at=stamp,revision=c.revision+1
  where c.room_id=p_room and c.edicao=p_edicao and c.seed=p_seed returning * into r;
 end if;
 return jsonb_build_object('clock',to_jsonb(r),'server_ms',extract(epoch from stamp)*1000);
end $$;
revoke all on function public.esc_copa_preview_clock(uuid,integer,bigint,text,bigint,numeric,integer) from public,anon;
grant execute on function public.esc_copa_preview_clock(uuid,integer,bigint,text,bigint,numeric,integer) to authenticated;
