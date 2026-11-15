import assert from 'node:assert/strict'
import{readFileSync,writeFileSync,mkdirSync}from'node:fs'
const{PGlite}=await import(process.env.PGLITE_MODULE??'@electric-sql/pglite')
const db=new PGlite(),checks=[]
const ok=(condition,name)=>{assert.ok(condition,name);checks.push(name)}
const scalar=async(sql,params)=>Object.values((await db.query(sql,params)).rows[0])[0]
const set=async(sql)=>JSON.stringify((await db.query(`select jsonb_agg(v order by v) from jsonb_array_elements_text((${sql})) v`)).rows[0].jsonb_agg)
const old=readFileSync('docs/sql/custos-salas-20261110-rollback-funcoes.sql','utf8'),change=readFileSync('docs/sql/custos-salas-20261110-cache-clas.sql','utf8')
assert.ok(readFileSync('supabase/migrations/20261110220342_custos_presenca_nomes_clas_criacao.sql','utf8').endsWith(change),'Migração versionada contém exatamente o SQL testado')
try{
await db.exec(`
create schema auth; create schema private; create schema cron;
create role anon; create role authenticated; create role service_role;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
create table public.esc_nomes_batismo(email text,nome_norm text);
create function public.esc_nome_chave(t text) returns text language sql immutable as $$select regexp_replace(translate(lower(coalesce(t,'')),'áàâãäéèêëíìîïóòôõöúùûüçñ','aaaaaeeeeiiiiooooouuuucn'),'[^a-z0-9]','','g')$$;
create table public.esc_clas(id bigint primary key,ativo boolean);
create table public.esc_cla_limite_cache(cla_id bigint primary key,limite int,plano int,em timestamptz);
create table public.local_calls(n int);insert into public.local_calls values(0);
create function public.esc_cla_limite_vivo(id bigint) returns integer language plpgsql as $$begin update public.local_calls set n=n+1;return 22+id::int;end$$;
create table cron.job(id bigint generated always as identity,name text,schedule text,command text);
create function cron.schedule(text,text,text)returns bigint language sql as $$insert into cron.job(name,schedule,command)values($1,$2,$3)returning id$$;
create table public.game_rooms(id uuid primary key,code text unique,host_id uuid references auth.users(id),mode text,status text,max_players int,game_state jsonb);
create table public.room_players(room_id uuid references public.game_rooms(id),user_id uuid references auth.users(id),player_index int,manager_name text,is_ready bool,primary key(room_id,user_id),unique(room_id,player_index));
alter table public.game_rooms enable row level security;alter table public.room_players enable row level security;
create policy rooms_select on public.game_rooms for select using(true);
create policy rooms_insert on public.game_rooms for insert to authenticated with check(host_id=auth.uid());
create policy players_select on public.room_players for select using(true);
create policy players_insert on public.room_players for insert to authenticated with check(user_id=auth.uid());
grant select,insert on public.game_rooms,public.room_players to authenticated;
insert into auth.users values
('11111111-1111-4111-8111-111111111111','owner@example.test','{"display_name":"Aurora FC"}'),
('22222222-2222-4222-8222-222222222222','copy@example.test','{"display_name":"Aurora_FC"}'),
('33333333-3333-4333-8333-333333333333','exact@example.test','{"display_name":"Aurora FC"}');
insert into public.esc_nomes_batismo values('owner@example.test','Aurora FC');
insert into public.esc_clas values(1,true),(2,true),(3,false);
`)
await db.exec(old)
const baseline=await set('select public.esc_nomes_sem_escudo()')
await db.exec('select public.esc_cla_limites_atualiza()')
const clanBefore=(await db.query('select cla_id,limite,plano from public.esc_cla_limite_cache order by 1')).rows
ok(await scalar('select n from local_calls')===4,'Rotina antiga repete duas vezes por clã')
await db.exec('begin;'+change+'commit;')
ok(await set('select public.esc_nomes_sem_escudo()')===baseline,'Cache conserva os mesmos nomes protegidos')
ok(await scalar('select valido from private.esc_nomes_escudos_cache'),'Cache inicial válido')
ok(await scalar('select count(*)::int from cron.job where name=\'esc-nomes-escudos-cache\'')===1,'Apenas uma rotina de atualização do cache')
await db.exec(`update auth.users set raw_user_meta_data='{"display_name":"Aurora.FC"}' where email='copy@example.test'`)
ok(!await scalar('select valido from private.esc_nomes_escudos_cache'),'Renomear conta invalida imediatamente')
ok(await set('select public.esc_nomes_sem_escudo()')===await set('select private.esc_calcula_nomes_sem_escudo()'),'Cache inválido usa cálculo original atualizado')
await db.exec('select private.esc_atualiza_nomes_sem_escudo()')
const generation=await scalar('select geracao from private.esc_nomes_escudos_cache')
await db.exec(`update auth.users set raw_user_meta_data=jsonb_set(raw_user_meta_data,'{outra}', 'true') where email='copy@example.test'`)
ok(await scalar('select geracao from private.esc_nomes_escudos_cache')===generation,'Metadado sem mudar nome não invalida')
await db.exec(`insert into public.esc_nomes_batismo values('new@example.test','Outro FC')`)
ok(!await scalar('select valido from private.esc_nomes_escudos_cache'),'Novo Batismo invalida sem erro de estrutura do trigger')
await db.exec('select private.esc_atualiza_nomes_sem_escudo();update private.esc_nomes_escudos_cache set atualizado_em=now()-interval \'2 minutes\'')
ok(await set('select public.esc_nomes_sem_escudo()')===await set('select private.esc_calcula_nomes_sem_escudo()'),'Cache vencido conserva proteção pelo cálculo original')
await db.exec('update public.local_calls set n=0;select public.esc_cla_limites_atualiza()')
ok(await scalar('select n from local_calls')===2,'Nova rotina calcula uma vez por clã')
assert.deepEqual((await db.query('select cla_id,limite,plano from public.esc_cla_limite_cache order by 1')).rows,clanBefore);checks.push('Limites e benefícios dos clãs preservados')
const anonExpected=await set('select private.esc_calcula_nomes_sem_escudo()')
await db.exec('grant usage on schema private to anon;set role anon')
ok(await set('select public.esc_nomes_sem_escudo()')===anonExpected,'API de nomes conserva resultado ao visitante sem acesso ao cache')
for(const sql of['select * from private.esc_nomes_escudos_cache','select private.esc_calcula_nomes_sem_escudo()','select private.esc_atualiza_nomes_sem_escudo()']){await assert.rejects(db.query(sql),/permission denied/);checks.push('Cache interno inacessível ao visitante')}
await assert.rejects(db.query(`select public.esc_criar_sala_segura('44444444-4444-4444-8444-444444444444','LOCAL1',20,'{}','Teste')`),/permission denied/);checks.push('Visitante não chama criação')
await db.exec('reset role;create table public.local_quotas(n int);insert into public.local_quotas values(0);')
await db.exec(`create function public.local_charge()returns trigger language plpgsql security definer as $$begin update public.local_quotas set n=n+1;return new;end$$;
create trigger local_charge before insert on public.game_rooms for each row execute function public.local_charge();
create function public.local_fail_seat()returns trigger language plpgsql as $$begin if new.manager_name='FALHAR' then raise exception 'cadastro falhou' using errcode='57014';end if;return new;end$$;
create trigger local_fail_seat before insert on public.room_players for each row execute function public.local_fail_seat();`)
await db.exec(`set role authenticated;set "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111'`)
const params=['44444444-4444-4444-8444-444444444444','LOCAL1',20,{__game:'leilao'},'Técnico local']
const rpc=()=>db.query('select public.esc_criar_sala_segura($1,$2,$3,$4,$5) as room',params)
const room=(await rpc()).rows[0].room
ok(room.host_id==='11111111-1111-4111-8111-111111111111','Dono vem de auth.uid, não do payload')
ok(await scalar('select count(*)::int from public.room_players')===1,'Dono e sala cadastrados juntos')
await rpc();ok(await scalar('select count(*)::int from public.game_rooms')===1,'Repetir UUID não cria outra sala')
await db.exec('reset role');ok(await scalar('select n from public.local_quotas')===1,'Repetição não cobra nova cota')
await db.exec(`set role authenticated;set "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222'`)
await assert.rejects(rpc(),/outra conta/);checks.push('Outra conta não recupera/assume a sala')
params[0]='55555555-5555-4555-8555-555555555555';params[1]='LOCAL2';params[4]='FALHAR'
await assert.rejects(rpc(),/cadastro falhou/);ok(await scalar('select count(*)::int from public.game_rooms')===1,'Falha no dono desfaz criação da sala')
await db.exec('reset role');ok(await scalar('select n from public.local_quotas')===1,'Falha atômica também desfaz cobrança da cota')
await db.exec(`update public.game_rooms set status='started',game_state='{"round":18}'`)
await db.exec(`set role authenticated;set "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111'`)
params[0]='44444444-4444-4444-8444-444444444444';params[1]='LOCAL1';params[4]='Técnico local'
const resumed=(await rpc()).rows[0].room
ok(resumed.status==='started'&&resumed.game_state.round===18,'Tentativa antiga não recomeça partida em andamento')
console.log('PASS PostgreSQL isolado:',checks.length,'verificações')
}finally{mkdirSync('/workspace/shared/custos-salas-20261110',{recursive:true});writeFileSync('/workspace/shared/custos-salas-20261110/testes-banco.json',JSON.stringify({checks,realAccounts:false,productionWrites:false},null,2));await db.close()}
