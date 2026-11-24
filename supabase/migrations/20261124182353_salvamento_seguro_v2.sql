-- Revisões por carreira; a linha legada fica preservada durante a transição.
create schema if not exists esc_save_private;
revoke all on schema esc_save_private from public, anon;
grant usage on schema esc_save_private to authenticated;
create table if not exists esc_save_private.accounts (
 uid uuid primary key references auth.users(id) on delete cascade,
 migrated_at timestamptz not null default now(), legacy_slots integer not null default 0
);
create table if not exists esc_save_private.careers (
 uid uuid not null references auth.users(id) on delete cascade, seed bigint not null,
 revision bigint not null default 1, saved_at timestamptz not null default now(),
 payload jsonb, details jsonb not null default '{}'::jsonb, fingerprint text not null, deleted_at timestamptz,
 primary key(uid,seed)
);
create table if not exists esc_save_private.versions (
 uid uuid not null, seed bigint not null, revision bigint not null,
 saved_at timestamptz not null, payload jsonb not null, details jsonb not null default '{}'::jsonb,
 primary key(uid,seed,revision),
 foreign key(uid,seed) references esc_save_private.careers(uid,seed) on delete cascade
);
create table if not exists esc_save_private.requests (
 uid uuid not null references auth.users(id) on delete cascade, request_id uuid not null,
 seed bigint not null, result jsonb not null, created_at timestamptz not null default now(),
 primary key(uid,request_id)
);
create index if not exists esc_save_requests_uid_time on esc_save_private.requests(uid,created_at);
alter table esc_save_private.accounts enable row level security;
alter table esc_save_private.careers enable row level security;
alter table esc_save_private.versions enable row level security;
alter table esc_save_private.requests enable row level security;
revoke all on all tables in schema esc_save_private from public,anon,authenticated;

create or replace function esc_save_private.rights()
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e text; d jsonb; extra integer; base integer;
begin
 if u is null then raise exception 'save:sem_conta' using errcode='42501'; end if;
 select lower(email) into e from auth.users where id=u;
 if e is null then raise exception 'save:sem_conta' using errcode='42501'; end if;
 d:=public.esc_direitos_de(e);
 select coalesce(sum(qtd),0)::int into extra from public.esc_fichas_extras where lower(email)=e;
 -- Mesma régua de tierEfetivo/fichasDoPlano; não inventa perda de vagas antigas.
 base:=case when coalesce((d->>'fundador')::boolean,false) or d->>'tier'='ouro' then 4 when d->>'tier'='prata' then 2 else 1 end;
 return jsonb_build_object('paid',coalesce((d->>'pago')::boolean,false),
  'slots',least(8,base+coalesce(extra,0)),
  'versions',case when base=4 then 3 when coalesce((d->>'pago')::boolean,false) then 1 else 0 end);
end $$;

create or replace function esc_save_private.details(p jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('seasonNo',coalesce((p->>'seasonNo')::int,1),'round',coalesce((p->>'round')::int,0),
  'teamName',p->'managers'->coalesce((p->>'youIdx')::int,0)->>'teamName',
  'official',coalesce(p ? 'oficial' and p->'oficial'<>'null'::jsonb,false),
  'sport',coalesce(p->>'sport','futebol'),
  'division',coalesce(p->'careerPlacements'->>('m'||(p->'managers'->coalesce((p->>'youIdx')::int,0)->>'id')),p->>'careerDivision','D'),
  'coins',coalesce(p->'careerCoins'->>(p->'managers'->coalesce((p->>'youIdx')::int,0)->>'id'),'0')::numeric)
$$;

create or replace function esc_save_private.bootstrap()
returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); raw jsonb; c jsonb; n integer:=0; sd bigint; stamp timestamptz;
begin
 if u is null then raise exception 'save:sem_conta' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('esc-save:'||u::text,0));
 if exists(select 1 from esc_save_private.accounts where uid=u) then return; end if;
 select save,updated_at into raw,stamp from public.esc_pyramid_saves where user_id=u for update;
 for c in select value from jsonb_array_elements(case when jsonb_typeof(raw->'careers')='array' then raw->'careers' when raw ? 'seed' then jsonb_build_array(jsonb_build_object('save',raw)) else '[]'::jsonb end) loop
  if jsonb_typeof(c->'save')<>'object' or (c->'save'->>'seed') !~ '^-?[0-9]+$' then
   raise exception 'save:legado_invalido'; -- não sela uma importação parcial
  end if;
  sd:=(c->'save'->>'seed')::bigint;
  insert into esc_save_private.careers(uid,seed,payload,details,fingerprint,saved_at)
   values(u,sd,(c->'save')-'_saveSync',esc_save_private.details(c->'save'),md5(((c->'save')-'_saveSync'-'_ll')::text),coalesce(stamp,now()))
   on conflict(uid,seed) do nothing;
  if exists(select 1 from public.esc_carreiras_barradas b where b.user_id=u and b.seed=sd::text) then
   update esc_save_private.careers set deleted_at=now() where uid=u and seed=sd;
  end if;
  n:=n+1;
 end loop;
 insert into esc_save_private.accounts(uid,legacy_slots) values(u,n);
end $$;

create or replace function esc_save_private.summary(c esc_save_private.careers)
returns jsonb language sql stable set search_path='' as $$
 select c.details || jsonb_build_object('seed',c.seed,'revision',c.revision,'savedAt',c.saved_at,'fingerprint',c.fingerprint)
$$;

create or replace function esc_save_private.manifest()
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rights jsonb;
begin
 perform esc_save_private.bootstrap(); rights:=esc_save_private.rights();
 return jsonb_build_object('protocol',2,'serverTime',now(),'rights',rights,
  'deleted',coalesce((select jsonb_agg(seed) from esc_save_private.careers where uid=u and deleted_at is not null),'[]'::jsonb),
  'careers',coalesce((select jsonb_agg(esc_save_private.summary(c) order by saved_at desc) from esc_save_private.careers c where c.uid=u and deleted_at is null),'[]'::jsonb));
end $$;

create or replace function esc_save_private.read_career(p_seed bigint,p_revision bigint default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c esc_save_private.careers; body jsonb; stamp timestamptz; rev bigint;
begin
 perform esc_save_private.bootstrap();
 select * into c from esc_save_private.careers where uid=u and seed=p_seed and deleted_at is null;
 if not found then return jsonb_build_object('status','missing'); end if;
 if p_revision is null or p_revision=c.revision then body:=c.payload; stamp:=c.saved_at; rev:=c.revision;
 else select payload,saved_at,revision into body,stamp,rev from esc_save_private.versions where uid=u and seed=p_seed and revision=p_revision;
 end if;
 if body is null then return jsonb_build_object('status','missing'); end if;
 return jsonb_build_object('status','ok','summary',esc_save_private.summary(c),
  'save',body,'versionAt',stamp,'version',rev);
end $$;

create or replace function esc_save_private.save_career(p_seed bigint,p_save jsonb,p_expected bigint,p_request uuid,p_restore bigint default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c esc_save_private.careers; rights jsonb; body jsonb; result jsonb;
 hash text; n integer; slots integer; keep integer; previous_count integer; allowed boolean;
begin
 perform esc_save_private.bootstrap();
 if p_request is null or p_expected is null or p_expected<0 then raise exception 'save:pedido_invalido'; end if;
 select r.result into result from esc_save_private.requests r where uid=u and request_id=p_request and seed=p_seed;
 if found then return result; end if;
 select * into c from esc_save_private.careers where uid=u and seed=p_seed for update;
 if c.deleted_at is not null or exists(select 1 from public.esc_carreiras_barradas b where b.user_id=u and b.seed=p_seed::text) then return jsonb_build_object('status','deleted'); end if;
 if coalesce(c.revision,0) is distinct from p_expected then
  return jsonb_build_object('status','conflict','current',case when c.seed is not null then esc_save_private.summary(c) else null end);
 end if;
 if p_restore is not null then
  select payload into body from esc_save_private.versions where uid=u and seed=p_seed and revision=p_restore;
  if body is null then return jsonb_build_object('status','missing'); end if;
 else body:=p_save-'_saveSync'; end if;
 if body is null or jsonb_typeof(body)<>'object' or (body->>'seed')::bigint is distinct from p_seed
  or coalesce((body->>'careerOnline')::boolean,false) is not true or jsonb_typeof(body->'managers')<>'array'
  or jsonb_array_length(body->'managers')=0 or coalesce(body->>'sport','futebol')<>'futebol'
  or body ? 'co2' and body->'co2'<>'null'::jsonb or body->>'onlineMode'='online'
 then raise exception 'save:carreira_invalida'; end if;
 rights:=esc_save_private.rights(); allowed:=coalesce((rights->>'paid')::boolean,false);
 if not allowed then return jsonb_build_object('status','local_only'); end if;
 -- Proteção contra abuso sem invalidar um save grande já existente.
 if octet_length(body::text)>greatest(33554432,coalesce(octet_length(c.payload::text),0)+8388608) then return jsonb_build_object('status','too_large'); end if;
 if c.seed is null then
  select count(*) into n from esc_save_private.careers where uid=u and deleted_at is null;
  select greatest((rights->>'slots')::integer,legacy_slots) into slots from esc_save_private.accounts where uid=u;
  if n>=slots then return jsonb_build_object('status','slots_full'); end if;
 end if;
 hash:=md5((body-'_ll')::text);
 if c.seed is not null and c.fingerprint=hash then
  result:=jsonb_build_object('status','saved','summary',esc_save_private.summary(c));
 else
  if c.seed is not null then
   insert into esc_save_private.versions(uid,seed,revision,saved_at,payload,details) values(u,p_seed,c.revision,c.saved_at,c.payload,c.details) on conflict do nothing;
  end if;
  insert into esc_save_private.careers(uid,seed,revision,payload,details,fingerprint,saved_at)
   values(u,p_seed,coalesce(c.revision,0)+1,body,esc_save_private.details(body),hash,clock_timestamp())
   on conflict(uid,seed) do update set revision=excluded.revision,payload=excluded.payload,details=excluded.details,fingerprint=excluded.fingerprint,saved_at=excluded.saved_at
   returning * into c;
  result:=jsonb_build_object('status','saved','summary',esc_save_private.summary(c));
  -- Um anterior para todo pagante; três para os tiers superiores. Não corta direitos já existentes.
  keep:=greatest(1,(rights->>'versions')::integer);
  select count(*) into previous_count from esc_save_private.versions where uid=u and seed=p_seed;
  keep:=greatest(keep,least(3,previous_count-1));
  delete from esc_save_private.versions where uid=u and seed=p_seed and revision not in
   (select revision from esc_save_private.versions where uid=u and seed=p_seed order by revision desc limit keep);
 end if;
 insert into esc_save_private.requests(uid,request_id,seed,result) values(u,p_request,p_seed,result);
 delete from esc_save_private.requests where uid=u and request_id in
  (select request_id from esc_save_private.requests where uid=u order by created_at desc offset 64);
 return result;
end $$;

create or replace function esc_save_private.history(p_seed bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 perform esc_save_private.bootstrap();
 return coalesce((select jsonb_agg(jsonb_build_object('revision',v.revision,'savedAt',v.saved_at,
  'seasonNo',coalesce((v.details->>'seasonNo')::int,1),'round',coalesce((v.details->>'round')::int,0)) order by v.revision desc)
  from esc_save_private.versions v join esc_save_private.careers c using(uid,seed)
  where v.uid=u and v.seed=p_seed and c.deleted_at is null),'[]'::jsonb);
end $$;

drop function if exists esc_save_private.delete_career(bigint,bigint,uuid);
create or replace function esc_save_private.delete_career(p_seed bigint,p_expected bigint,p_request uuid,p_auto boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c esc_save_private.careers; result jsonb;
begin
 perform esc_save_private.bootstrap();
 if p_request is null or p_expected is null or p_expected<0 then raise exception 'save:pedido_invalido'; end if;
 select r.result into result from esc_save_private.requests r where uid=u and request_id=p_request and seed=p_seed;
 if found then return result; end if;
 select * into c from esc_save_private.careers where uid=u and seed=p_seed for update;
 if not found or c.deleted_at is not null then return jsonb_build_object('status','deleted'); end if;
 if c.revision<>p_expected then return jsonb_build_object('status','conflict','current',esc_save_private.summary(c)); end if;
 if p_auto and coalesce((esc_save_private.rights()->>'paid')::boolean,false) then return jsonb_build_object('status','protected'); end if;
 insert into esc_save_private.versions(uid,seed,revision,saved_at,payload,details) values(u,p_seed,c.revision,c.saved_at,c.payload,c.details) on conflict do nothing;
 update esc_save_private.careers set deleted_at=now(),revision=revision+1 where uid=u and seed=p_seed;
 result:=jsonb_build_object('status','deleted');
 insert into esc_save_private.requests(uid,request_id,seed,result) values(u,p_request,p_seed,result);
 return result;
end $$;

-- Clientes antigos não podem sobrepor o progresso após a migração desta conta.
create or replace function esc_save_private.migrated()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from esc_save_private.accounts where uid=auth.uid())
$$;
-- A regra nova também alcança versões antigas do cliente: grátis nunca envia carreira à nuvem.
create or replace function esc_save_private.can_upload()
returns boolean language sql security definer set search_path='' as $$
 select coalesce((esc_save_private.rights()->>'paid')::boolean,false)
$$;
create or replace function esc_save_private.guard_legacy()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if (current_user in ('anon','authenticated') or coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role',current_setting('request.jwt.claim.role',true),'') in ('anon','authenticated')) and esc_save_private.migrated() then
  raise exception 'save:atualize_a_pagina_para_salvar' using errcode='40001';
 end if;
 if tg_op='DELETE' then return old; end if;
 if (current_user in ('anon','authenticated') or coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role',current_setting('request.jwt.claim.role',true),'') in ('anon','authenticated')) and not esc_save_private.can_upload() then
  raise exception 'save:nuvem_requer_plano' using errcode='42501';
 end if;
 return new;
end $$;
drop trigger if exists esc_save_v2_guard_legacy on public.esc_pyramid_saves;
create trigger esc_save_v2_guard_legacy before insert or update or delete on public.esc_pyramid_saves for each row execute function esc_save_private.guard_legacy();

-- Remove assinaturas de rascunhos do protocolo, se existirem em uma bancada.
drop function if exists public.esc_carreiras_manifesto_v2();
drop function if exists public.esc_carreira_ler_v2(bigint,bigint);
drop function if exists public.esc_carreira_salvar_v2(bigint,jsonb,bigint,uuid,bigint);
drop function if exists public.esc_carreira_historico_v2(bigint);
drop function if exists public.esc_carreira_excluir_v2(bigint,bigint,uuid);
drop function if exists public.esc_carreira_excluir_v2(uuid,bigint,bigint,uuid);
-- A conta esperada acompanha cada pedido: troca de login durante o envio não muda o dono.
create or replace function esc_save_private.check_owner(p_owner uuid)
returns void language plpgsql security invoker set search_path='' as $$begin
 if p_owner is null or p_owner is distinct from auth.uid() then raise exception 'save:conta_alterada' using errcode='42501'; end if;
end$$;
-- RPCs públicos mínimos; núcleo privado com auth.uid e direitos no servidor.
create or replace function public.esc_carreiras_manifesto_v2(p_owner uuid) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform esc_save_private.check_owner(p_owner); return esc_save_private.manifest(); end$$;
create or replace function public.esc_carreira_ler_v2(p_owner uuid,p_seed bigint,p_revision bigint default null) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform esc_save_private.check_owner(p_owner); return esc_save_private.read_career(p_seed,p_revision); end$$;
create or replace function public.esc_carreira_salvar_v2(p_owner uuid,p_seed bigint,p_save jsonb,p_expected bigint,p_request uuid,p_restore bigint default null) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform esc_save_private.check_owner(p_owner); return esc_save_private.save_career(p_seed,p_save,p_expected,p_request,p_restore); end$$;
create or replace function public.esc_carreira_historico_v2(p_owner uuid,p_seed bigint) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform esc_save_private.check_owner(p_owner); return esc_save_private.history(p_seed); end$$;
create or replace function public.esc_carreira_excluir_v2(p_owner uuid,p_seed bigint,p_expected bigint,p_request uuid,p_auto boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform esc_save_private.check_owner(p_owner); return esc_save_private.delete_career(p_seed,p_expected,p_request,p_auto); end$$;
revoke all on all functions in schema esc_save_private from public,anon,authenticated;
grant execute on function esc_save_private.check_owner(uuid),esc_save_private.manifest(),esc_save_private.read_career(bigint,bigint),esc_save_private.save_career(bigint,jsonb,bigint,uuid,bigint),esc_save_private.history(bigint),esc_save_private.delete_career(bigint,bigint,uuid,boolean),esc_save_private.migrated(),esc_save_private.can_upload() to authenticated;
revoke all on function public.esc_carreiras_manifesto_v2(uuid),public.esc_carreira_ler_v2(uuid,bigint,bigint),public.esc_carreira_salvar_v2(uuid,bigint,jsonb,bigint,uuid,bigint),public.esc_carreira_historico_v2(uuid,bigint),public.esc_carreira_excluir_v2(uuid,bigint,bigint,uuid,boolean) from public,anon;
grant execute on function public.esc_carreiras_manifesto_v2(uuid),public.esc_carreira_ler_v2(uuid,bigint,bigint),public.esc_carreira_salvar_v2(uuid,bigint,jsonb,bigint,uuid,bigint),public.esc_carreira_historico_v2(uuid,bigint),public.esc_carreira_excluir_v2(uuid,bigint,bigint,uuid,boolean) to authenticated;
-- Rotina obsoleta de um dia: nunca deve ser acionável por clientes.
revoke execute on function public.esc_nuvem_gratis_limpa() from public,anon,authenticated;

-- Conservação limitada, após uma semana de transição. Não remove carreira ativa.
create table if not exists esc_save_private.policy (
 singleton boolean primary key default true check(singleton),
 cleanup_after timestamptz not null default now()+interval '7 days'
);
insert into esc_save_private.policy(singleton) values(true) on conflict do nothing;
alter table esc_save_private.policy enable row level security;
revoke all on esc_save_private.policy from public,anon,authenticated;
create index if not exists esc_saves_lixeira_apagar_idx on public.esc_saves_lixeira(apagar_em,id);
create or replace function esc_save_private.maintenance()
returns jsonb language plpgsql security definer set search_path='' as $$
declare n integer:=0; legacy_n integer:=0;
begin
 if now()<(select cleanup_after from esc_save_private.policy where singleton) then return jsonb_build_object('status','grace'); end if;
 -- Lixeira cujo prazo antigo já acabou: lote pequeno, com mais 7 dias de margem.
 with expired as (select id from public.esc_saves_lixeira where apagar_em<now()-interval '7 days' order by apagar_em,id for update skip locked limit 100)
 delete from public.esc_saves_lixeira t using expired e where t.id=e.id;
 get diagnostics n=row_count;
 -- O marcador de exclusão permanece. Uma aba velha não pode recriar a carreira.
 delete from esc_save_private.versions v using esc_save_private.careers c where v.uid=c.uid and v.seed=c.seed and c.deleted_at<now()-interval '30 days';
 update esc_save_private.careers set payload=null where deleted_at<now()-interval '30 days' and payload is not null;
 delete from esc_save_private.requests where created_at<now()-interval '30 days';
 -- Só a linha de transição de uma conta já migrada, com todas as seeds preservadas.
 -- Um mês de margem para verificar o novo protocolo. Contas não migradas ficam intactas.
 with eligible as (
  select p.user_id from public.esc_pyramid_saves p join esc_save_private.accounts a on a.uid=p.user_id
  where a.migrated_at<now()-interval '30 days' and p.updated_at<=a.migrated_at
  and not exists (
   select 1 from jsonb_array_elements(case when jsonb_typeof(p.save->'careers')='array' then p.save->'careers' when p.save ? 'seed' then jsonb_build_array(jsonb_build_object('save',p.save)) else '[]'::jsonb end) x
   where not exists(select 1 from esc_save_private.careers c where c.uid=p.user_id and c.seed=(x->'save'->>'seed')::bigint)
  ) limit 20
 ) delete from public.esc_pyramid_saves p using eligible e where p.user_id=e.user_id;
 get diagnostics legacy_n=row_count;
 return jsonb_build_object('status','ok','expiredTrash',n,'legacyCopies',legacy_n);
end $$;
revoke all on function esc_save_private.maintenance() from public,anon,authenticated;
-- PostgreSQL local de teste não precisa do pg_cron; no projeto a tarefa roda como postgres.
do $$begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  execute $schedule$select cron.schedule('esc-saves-v2-conservacao','17 3 * * *','select esc_save_private.maintenance()')$schedule$;
 end if;
end$$;
