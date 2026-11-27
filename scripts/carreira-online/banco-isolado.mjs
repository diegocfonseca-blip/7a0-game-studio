import { readFileSync } from 'node:fs'
export async function bancoCo2(){
 const {PGlite}=await import(process.env.CO2_PGLITE_PATH??'/tmp/co2-pg-test/node_modules/@electric-sql/pglite/dist/index.js')
 const db=new PGlite()
 await db.exec(`create role anon; create role authenticated; alter default privileges in schema public grant execute on functions to anon,authenticated; create schema auth;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated,anon;
 create table esc_carr_sala(id uuid primary key,dono uuid,comandante uuid,temporada integer,rodada integer,fase text,mundo jsonb,velocidade integer default 1,pausado boolean default false,auto boolean default true,prazo timestamptz,inicio_rodada timestamptz,atualizado_em timestamptz);
 create table esc_carr_clube(sala uuid,user_id uuid,publico jsonb);
 create function esc_carr_sou_comandante(p_sala uuid) returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from esc_carr_sala where id=p_sala and comandante=auth.uid()) $$;
 create function esc_carr_sou_membro(p_sala uuid) returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from esc_carr_clube where sala=p_sala and user_id=auth.uid()) $$;
 create function esc_carr_comecar(p_sala uuid) returns text language plpgsql security definer set search_path=public as $$ begin if not esc_carr_sou_comandante(p_sala) then return 'sem_permissao';end if;update esc_carr_sala set fase='jogando',inicio_rodada=now() where id=p_sala and fase='preparo';return case when found then 'ok' else 'fora_de_hora' end;end $$;
 create function esc_carr_ritmo(p_sala uuid,p_auto boolean,p_velocidade integer,p_pausado boolean) returns text language plpgsql security definer set search_path=public as $$ begin if not esc_carr_sou_comandante(p_sala) then return 'sem_permissao';end if;update esc_carr_sala set auto=coalesce(p_auto,auto),velocidade=least(greatest(coalesce(p_velocidade,velocidade),1),4),pausado=coalesce(p_pausado,pausado) where id=p_sala;return 'ok';end $$;
 create function esc_carr_apito(p_sala uuid,p_rodada integer,p_prazo_s integer default 60) returns text language plpgsql security definer set search_path=public as $$ begin if not esc_carr_sou_comandante(p_sala) then return 'sem_permissao';end if;update esc_carr_sala set rodada=p_rodada,fase=case when p_rodada>=38 then 'virada' else 'preparo' end where id=p_sala and fase='jogando' and p_rodada=rodada+1;return case when found then 'ok' else 'fora_de_hora' end;end $$;`)
 await db.exec(readFileSync('docs/sql/carreira-online-partidas-20261127.sql','utf8'))
 return db
}
