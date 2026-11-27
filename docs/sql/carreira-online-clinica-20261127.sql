-- A lesão já sorteada é registrada na ficha; não cria uma segunda chance de lesão.
alter table public.esc_carr_jogo add column clinica jsonb not null default '{}',add column lesoes jsonb not null default '{}';
create or replace function public.esc_carr_jogo_troca_interna(p_sala uuid,p_temporada integer,p_rodada integer,p_pedido uuid,p_base integer,p_novas jsonb,p_actor uuid default null)
returns text language plpgsql security definer set search_path=public as $$
declare s public.esc_carr_sala%rowtype; j public.esc_carr_jogo%rowtype; actor text; m jsonb; lista jsonb; x jsonb; nova jsonb='[]';
  quem uuid;clinica boolean;xi text[]; sa text; en text; forma text; pos text; qtd integer; usadas integer; t double precision; ms double precision;
begin
  quem=coalesce(p_actor,auth.uid());
  if quem is null then return 'sem_login';end if;
  if p_actor is not null and not public.esc_carr_sou_comandante(p_sala) then return 'sem_permissao';end if;
  if p_pedido is null then return 'invalido'; end if;
  select * into s from public.esc_carr_sala where id=p_sala for update;
  if not found or not public.esc_carr_sou_membro(p_sala) then return 'sem_permissao'; end if;
  select * into j from public.esc_carr_jogo where sala=p_sala and temporada=p_temporada and rodada=p_rodada for update;
  if not found then return 'aguarde'; end if;
  if j.pedidos ? p_pedido::text then
    return case when j.pedidos->>p_pedido::text=quem::text then 'ok' else 'sem_permissao' end;
  end if;
  if s.temporada<>p_temporada or j.encerrado or (j.chave is null and (s.fase<>'jogando' or s.rodada<>p_rodada)) then return 'fora_de_hora'; end if;
  select (o.ordinality-1)::text into actor from jsonb_array_elements_text(s.mundo->'ordem') with ordinality o(uid,ordinality) where o.uid=quem::text;
  m=j.meta->actor;
  if m is null then return 'sem_permissao'; end if;
  lista=coalesce(j.comandos->actor,'[]'::jsonb);
  if p_base is distinct from jsonb_array_length(lista) then return 'atualize'; end if;
  if p_novas is null or jsonb_typeof(p_novas)<>'array' or jsonb_array_length(p_novas) not between 1 and 3 or pg_column_size(p_novas)>4096 or jsonb_array_length(lista)+jsonb_array_length(p_novas)>64 then return 'invalido'; end if;
  ms=j.elapsed_ms+case when j.pausado then 0 else greatest(0,extract(epoch from (clock_timestamp()-j.inicio_em))*1000)*j.velocidade end;
  -- A decisão entra à frente do relógio: não altera um lance já mostrado. Perto do apito não aceita nova troca.
  t=greatest((ms+least(2000*j.velocidade,j.duration_ms*0.04))/j.duration_ms*90,coalesce((lista->-1->>'t')::double precision,0)+0.001);
  if t<=0 or t>=86 then return 'fora_de_hora'; end if;
  select array_agg(value) into xi from jsonb_array_elements_text(m->'xi');
  forma=m->>'formation'; usadas=0;
  for x in select value from jsonb_array_elements(lista) loop
    if x ? 'sai' then xi=array_replace(xi,x->>'sai',x->>'entra'); usadas=usadas+1; end if;
    forma=coalesce(x->>'formation',forma);
  end loop;
  if j.clinica<>'{}' and not coalesce((p_novas->0->>'injury')::boolean,false) then return 'clinica';end if;
  for x in select value from jsonb_array_elements(p_novas) loop
    if jsonb_typeof(x)<>'object' or (x-'sai'-'entra'-'tactic'-'formation'-'injury'-'emergencyKeeper')<>'{}'::jsonb or x='{}'::jsonb then return 'invalido'; end if;
    if x ? 'tactic' and (x->>'tactic' is null or x->>'tactic' not in ('retranca','equilibrio','ataque')) then return 'invalido'; end if;
    if x ? 'formation' then
      if x->>'formation' is null or not(m->'allowed' ? (x->>'formation')) then return 'invalido'; end if;
      forma=x->>'formation';
    end if;
    clinica=coalesce((x->>'injury')::boolean,false);
    if clinica and (jsonb_array_length(p_novas)<>1 or not(j.clinica?actor) or x->>'sai' is distinct from j.clinica->actor->>'cardId' or x?'formation' or x?'tactic') then return 'invalido';end if;
    if x?'emergencyKeeper' and not clinica then return 'invalido';end if;
    if x ? 'sai' or x ? 'entra' then
      sa=x->>'sai';en=x->>'entra';
      if sa is null or not(sa=any(xi)) then return 'invalido';end if;
      if clinica and en is null then
        xi=array_remove(xi,sa);
        if m->'pos'->>sa='GOL' and (x->>'emergencyKeeper' is null or not((x->>'emergencyKeeper')=any(xi))) then return 'invalido';end if;
      else
        usadas=usadas+1;
        if en is null or usadas>3 or en=any(xi) or not(m->'pos'?en) or coalesce(m->'blocked','[]'::jsonb)?en
         or exists(select 1 from jsonb_array_elements(lista||nova) a where a->>'sai'=en)
         or clinica and m->'pos'->>sa is distinct from m->'pos'->>en then return 'invalido';end if;
        xi=array_replace(xi,sa,en);
      end if;
    end if;
    nova=nova||jsonb_build_array(x||jsonb_build_object('t',t));
  end loop;
  for pos,qtd in select key,value::integer from jsonb_each_text(m->'allowed'->forma) loop
    if (select count(*) from unnest(xi) a where m->'pos'->>a=pos)<>qtd-(select count(*) from jsonb_array_elements(lista||nova) a where coalesce((a->>'injury')::boolean,false) and not(a?'entra') and m->'pos'->>(a->>'sai')=pos) then return 'invalido'; end if;
  end loop;
  update public.esc_carr_jogo set comandos=jsonb_set(comandos,array[actor],lista||nova,true),pedidos=pedidos||jsonb_build_object(p_pedido::text,quem::text),revisao=revisao+1
    where sala=p_sala and temporada=p_temporada and rodada=p_rodada;
  if coalesce((p_novas->0->>'injury')::boolean,false) then
   update public.esc_carr_jogo set clinica=esc_carr_jogo.clinica-actor,lesoes=lesoes||jsonb_build_object(actor,j.clinica->actor),pausado=case when esc_carr_jogo.clinica-actor='{}' then s.pausado else true end,inicio_em=clock_timestamp() where sala=p_sala and temporada=p_temporada and rodada=p_rodada;
  end if;
  return 'ok';
end $$;


create or replace function public.esc_carr_jogo_troca(p_sala uuid,p_temporada integer,p_rodada integer,p_pedido uuid,p_base integer,p_novas jsonb)
returns text language sql security definer set search_path=public as $$
 select public.esc_carr_jogo_troca_interna(p_sala,p_temporada,p_rodada,p_pedido,p_base,p_novas,null)
$$;
create or replace function public.esc_carr_jogo_lesao(p_sala uuid,p_temporada integer,p_rodada integer)
returns text language plpgsql security definer set search_path=public as $$
declare s public.esc_carr_sala%rowtype;j public.esc_carr_jogo%rowtype;k text;m jsonb;l jsonb;x jsonb;lista jsonb;xi text[];ms double precision;ent text;goleiro text;cmd jsonb;actor_uid uuid;
begin
 if not public.esc_carr_sou_comandante(p_sala) then return 'sem_permissao';end if;
 select * into s from public.esc_carr_sala where id=p_sala for update;
 select * into j from public.esc_carr_jogo where sala=p_sala and temporada=p_temporada and rodada=p_rodada for update;
 if not found or s.temporada<>p_temporada or j.encerrado then return 'fora_de_hora';end if;
 if j.clinica<>'{}' then
  for k,l in select * from jsonb_each(j.clinica) loop
   if clock_timestamp()<(l->>'abriu')::timestamptz+interval '60 seconds' then continue;end if;
   m=j.meta->k;lista=coalesce(j.comandos->k,'[]');select array_agg(value) into xi from jsonb_array_elements_text(m->'xi');
   for x in select value from jsonb_array_elements(lista) loop if x?'sai' then xi=array_replace(xi,x->>'sai',x->>'entra');end if;end loop;
   ent=null;goleiro=null;
   if (select count(*) from jsonb_array_elements(lista) a where a?'entra')<3 then
    select key into ent from jsonb_each_text(m->'pos') where value=m->'pos'->>(l->>'cardId') and not(key=any(xi)) and not(coalesce(m->'blocked','[]')?key) and not exists(select 1 from jsonb_array_elements(lista) a where a->>'sai'=key) order by key limit 1;
   end if;
   if ent is null and m->'pos'->>(l->>'cardId')='GOL' then select a into goleiro from unnest(xi) a where a<>l->>'cardId' order by a limit 1;end if;
   cmd=jsonb_build_object('injury',true,'sai',l->>'cardId')||case when ent is not null then jsonb_build_object('entra',ent) else '{}' end||case when goleiro is not null then jsonb_build_object('emergencyKeeper',goleiro) else '{}' end;
   actor_uid=(s.mundo->'ordem'->>k::integer)::uuid;
   perform public.esc_carr_jogo_troca_interna(p_sala,p_temporada,p_rodada,md5(p_sala::text||p_temporada||p_rodada||k||':lesao')::uuid,jsonb_array_length(lista),jsonb_build_array(cmd),actor_uid);
  end loop;
  return 'ok';
 end if;
 ms=j.elapsed_ms+case when j.pausado then 0 else greatest(0,extract(epoch from(clock_timestamp()-j.inicio_em))*1000)*j.velocidade end;
 select least(ms,coalesce(min((a.v->'lesao'->>'minute')::double precision/93*j.duration_ms),ms)) into ms from jsonb_each(j.meta) a(k,v) where a.v?'lesao' and a.v->'lesao'<>'null' and not(j.lesoes?a.k) and not exists(select 1 from jsonb_array_elements(coalesce(j.comandos->a.k,'[]')) c where c->>'sai'=a.v->'lesao'->>'cardId');
 if ms>=j.duration_ms then return 'fora_de_hora';end if;
 for k,m in select * from jsonb_each(j.meta) loop
  l=m->'lesao';if l is null or j.lesoes?k or ms/j.duration_ms*93<(l->>'minute')::integer then continue;end if;
  lista=coalesce(j.comandos->k,'[]');
  if exists(select 1 from jsonb_array_elements(lista) a where a->>'sai'=l->>'cardId') then
   update public.esc_carr_jogo set lesoes=lesoes||jsonb_build_object(k,jsonb_build_object('cancelada',true)),revisao=revisao+1 where sala=p_sala and temporada=p_temporada and rodada=p_rodada;
   continue;
  end if;
  update public.esc_carr_jogo set elapsed_ms=ms,inicio_em=clock_timestamp(),pausado=true,clinica=clinica||jsonb_build_object(k,l||jsonb_build_object('abriu',clock_timestamp())),revisao=revisao+1 where sala=p_sala and temporada=p_temporada and rodada=p_rodada;
 end loop;
 return 'ok';
end $$;
revoke all on function public.esc_carr_jogo_troca_interna(uuid,integer,integer,uuid,integer,jsonb,uuid),public.esc_carr_jogo_lesao(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.esc_carr_jogo_lesao(uuid,integer,integer) to authenticated;
create or replace function public.esc_carr_jogo_ritmo(p_sala uuid,p_auto boolean,p_velocidade integer,p_pausado boolean)
returns text language plpgsql security definer set search_path=public as $$
declare s public.esc_carr_sala%rowtype; j public.esc_carr_jogo%rowtype;
begin
  if not public.esc_carr_sou_comandante(p_sala) then return 'sem_permissao'; end if;
  select * into s from public.esc_carr_sala where id=p_sala for update;
  select * into j from public.esc_carr_jogo where sala=p_sala and temporada=s.temporada and rodada=s.rodada for update;
  if j.clinica<>'{}' then return 'clinica';end if;
  if found and not j.encerrado then
    update public.esc_carr_jogo set elapsed_ms=elapsed_ms+case when pausado then 0 else greatest(0,extract(epoch from(clock_timestamp()-inicio_em))*1000)*velocidade end,
      inicio_em=clock_timestamp(),velocidade=least(greatest(coalesce(p_velocidade,velocidade),1),4),pausado=coalesce(p_pausado,pausado),revisao=revisao+1
      where sala=p_sala and temporada=s.temporada and rodada=s.rodada;
  end if;
  return public.esc_carr_ritmo(p_sala,p_auto,p_velocidade,p_pausado);
end $$;

create or replace function public.esc_carr_jogo_apito(p_sala uuid,p_temporada integer,p_rodada integer,p_prazo_s integer default 60)
returns text language plpgsql security definer set search_path=public as $$
declare s public.esc_carr_sala%rowtype; j public.esc_carr_jogo%rowtype; ms double precision; r text;
begin
  if not public.esc_carr_sou_comandante(p_sala) then return 'sem_permissao'; end if;
  select * into s from public.esc_carr_sala where id=p_sala for update;
  if s.temporada<>p_temporada then return 'fora_de_hora'; end if;
  if exists(select 1 from public.esc_carr_jogo where sala=p_sala and temporada=p_temporada and rodada=p_rodada-1 and encerrado) then return 'ok'; end if;
  if s.fase<>'jogando' or p_rodada<>s.rodada+1 then return 'fora_de_hora'; end if;
  select * into j from public.esc_carr_jogo where sala=p_sala and temporada=s.temporada and rodada=s.rodada for update;
  if not found then return 'aguarde'; end if;
  ms=j.elapsed_ms+case when j.pausado then 0 else greatest(0,extract(epoch from(clock_timestamp()-j.inicio_em))*1000)*j.velocidade end;
  if exists(select 1 from jsonb_each(j.meta) a(k,v) where v?'lesao' and v->'lesao'<>'null' and not(j.lesoes?k) and not exists(select 1 from jsonb_array_elements(coalesce(j.comandos->k,'[]')) c where c->>'sai'=v->'lesao'->>'cardId')) then perform public.esc_carr_jogo_lesao(p_sala,p_temporada,s.rodada);return 'aguarde';end if;
  if ms<j.duration_ms then return 'aguarde'; end if;
  r=public.esc_carr_apito(p_sala,p_rodada,p_prazo_s);
  if r='ok' then update public.esc_carr_jogo set elapsed_ms=j.duration_ms,encerrado=true,revisao=revisao+1 where sala=p_sala and temporada=s.temporada and rodada=s.rodada; end if;
  return r;
end $$;
