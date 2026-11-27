-- A mesma ficha compartilhada, também nas copas de clubes (fase/perna identificadas por chave).
alter table public.esc_carr_jogo drop constraint esc_carr_jogo_rodada_check;
alter table public.esc_carr_jogo add constraint esc_carr_jogo_rodada_check check(rodada>=0);
alter table public.esc_carr_jogo add column chave text;
create unique index carr_jogo_chave on public.esc_carr_jogo(sala,temporada,chave) where chave is not null;
create or replace function public.esc_carr_jogo_foto(p_sala uuid, p_temporada integer, p_rodada integer, p_z text, p_meta jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare s public.esc_carr_sala%rowtype; k text; v jsonb; dur double precision; chave_copa text;
begin
  if not public.esc_carr_sou_comandante(p_sala) then return 'sem_permissao'; end if;
  select * into s from public.esc_carr_sala where id=p_sala for update;
  chave_copa=p_meta->>'_chave';
  if s.temporada<>p_temporada or (chave_copa is null and (s.fase<>'jogando' or s.rodada<>p_rodada)) or (chave_copa is not null and (s.fase not in ('virada','preparo','jogando') or length(chave_copa)>300)) then return 'fora_de_hora'; end if;
  if chave_copa is not null then
    if exists(select 1 from public.esc_carr_jogo where sala=p_sala and temporada=p_temporada and chave=chave_copa) then return 'ok';end if;
    select greatest(100,coalesce(max(rodada)+1,100)) into p_rodada from public.esc_carr_jogo where sala=p_sala and temporada=p_temporada;
  end if;
  p_meta=p_meta-'_chave';
  if p_z is null or octet_length(p_z)>262144 or p_meta is null or jsonb_typeof(p_meta)<>'object' or pg_column_size(p_meta)>65536 then return 'invalido'; end if;
  if exists(select 1 from public.esc_carr_jogo where sala=p_sala and temporada=p_temporada and rodada=p_rodada) then return 'ok'; end if;
  if p_meta ? '_duracao' and jsonb_typeof(p_meta->'_duracao')<>'number' then return 'invalido'; end if;
  dur=coalesce((p_meta->>'_duracao')::double precision,90000);
  if dur<9000 or dur>180000 then return 'invalido'; end if;
  p_meta=p_meta-'_duracao';
  if p_meta='{}' then return 'invalido'; end if;
  for k,v in select * from jsonb_each(p_meta) loop
    if k !~ '^[0-9]{1,5}$' or s.mundo->'ordem'->>k::integer is null
      or not exists(select 1 from public.esc_carr_clube where sala=p_sala and user_id::text=s.mundo->'ordem'->>k::integer)
      or jsonb_typeof(v->'xi') is distinct from 'array' or jsonb_array_length(v->'xi')<>11
      or jsonb_typeof(v->'pos') is distinct from 'object' or jsonb_typeof(v->'allowed') is distinct from 'object'
      or not (v->'allowed' ? (v->>'formation')) then return 'invalido'; end if;
  end loop;
  insert into public.esc_carr_jogo(sala,temporada,rodada,z,meta,duration_ms,velocidade,pausado,chave)
    values(p_sala,p_temporada,p_rodada,p_z,p_meta,dur,s.velocidade,s.pausado,chave_copa);
  -- Fotografias anteriores permanecem recuperáveis; o cliente lê só as temporadas necessárias.
  return 'ok';
end $$;

create or replace function public.esc_carr_jogos_le(p_sala uuid, p_temporada integer, p_rodada integer default null, p_conhecidas integer[] default null)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare jogos jsonb;
begin
  if not public.esc_carr_sou_membro(p_sala) then return null; end if;
  select coalesce(jsonb_agg(case when j.rodada=any(coalesce(p_conhecidas,'{}'::integer[])) then to_jsonb(j)-'pedidos'-'z'-'meta' else to_jsonb(j)-'pedidos' end order by j.temporada,j.rodada),'[]'::jsonb) into jogos
    from public.esc_carr_jogo j where j.sala=p_sala and j.temporada=p_temporada and (p_rodada is null or j.rodada=p_rodada or j.chave is not null);
  return jsonb_build_object('agora',clock_timestamp(),'jogos',jogos);
end $$;

create or replace function public.esc_carr_jogo_troca(p_sala uuid,p_temporada integer,p_rodada integer,p_pedido uuid,p_base integer,p_novas jsonb)
returns text language plpgsql security definer set search_path=public as $$
declare s public.esc_carr_sala%rowtype; j public.esc_carr_jogo%rowtype; actor text; m jsonb; lista jsonb; x jsonb; nova jsonb='[]';
  xi text[]; sa text; en text; forma text; pos text; qtd integer; usadas integer; t double precision; ms double precision;
begin
  if auth.uid() is null then return 'sem_login'; end if;
  if p_pedido is null then return 'invalido'; end if;
  select * into s from public.esc_carr_sala where id=p_sala for update;
  if not found or not public.esc_carr_sou_membro(p_sala) then return 'sem_permissao'; end if;
  select * into j from public.esc_carr_jogo where sala=p_sala and temporada=p_temporada and rodada=p_rodada for update;
  if not found then return 'aguarde'; end if;
  if j.pedidos ? p_pedido::text then
    return case when j.pedidos->>p_pedido::text=auth.uid()::text then 'ok' else 'sem_permissao' end;
  end if;
  if s.temporada<>p_temporada or j.encerrado or (j.chave is null and (s.fase<>'jogando' or s.rodada<>p_rodada)) then return 'fora_de_hora'; end if;
  select (o.ordinality-1)::text into actor from jsonb_array_elements_text(s.mundo->'ordem') with ordinality o(uid,ordinality) where o.uid=auth.uid()::text;
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
  for x in select value from jsonb_array_elements(p_novas) loop
    if jsonb_typeof(x)<>'object' or (x-'sai'-'entra'-'tactic'-'formation')<>'{}'::jsonb or x='{}'::jsonb then return 'invalido'; end if;
    if x ? 'tactic' and (x->>'tactic' is null or x->>'tactic' not in ('retranca','equilibrio','ataque')) then return 'invalido'; end if;
    if x ? 'formation' then
      if x->>'formation' is null or not(m->'allowed' ? (x->>'formation')) then return 'invalido'; end if;
      forma=x->>'formation';
    end if;
    if x ? 'sai' or x ? 'entra' then
      sa=x->>'sai';en=x->>'entra';usadas=usadas+1;
      if sa is null or en is null or usadas>3 or not(sa=any(xi)) or en=any(xi) or not(m->'pos' ? en)
        or coalesce(m->'blocked','[]'::jsonb) ? en
        or exists(select 1 from jsonb_array_elements(lista||nova) a where a->>'sai'=en) then return 'invalido'; end if;
      xi=array_replace(xi,sa,en);
    end if;
    nova=nova||jsonb_build_array(x||jsonb_build_object('t',t));
  end loop;
  for pos,qtd in select key,value::integer from jsonb_each_text(m->'allowed'->forma) loop
    if (select count(*) from unnest(xi) a where m->'pos'->>a=pos)<>qtd then return 'invalido'; end if;
  end loop;
  update public.esc_carr_jogo set comandos=jsonb_set(comandos,array[actor],lista||nova,true),pedidos=pedidos||jsonb_build_object(p_pedido::text,auth.uid()::text),revisao=revisao+1
    where sala=p_sala and temporada=p_temporada and rodada=p_rodada;
  return 'ok';
end $$;
