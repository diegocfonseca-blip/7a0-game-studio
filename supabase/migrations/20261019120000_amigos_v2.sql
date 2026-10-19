-- 👥 AMIGOS v2 (19/10, liberado pra todos): rival, convite pra sala, avisos (sininho) e ranking do online no perfil.
-- Já aplicado no banco (migrations amigos_v2_rival_convites_avisos, esc_avisos_status_pedido,
-- esc_amigos_lista2_rank_uma_vez, esc_meu_rival, amigos_v2_so_logado). Este arquivo é a memória do repo.
-- Nada de canal em tempo real: o jogo lê esc_avisos ao abrir e a cada 60s com a aba visível.

create table if not exists public.esc_rivais (
  user_id uuid primary key, rival_id uuid not null, desde timestamptz not null default now()
);
create table if not exists public.esc_convites (
  id bigserial primary key, de uuid not null, para uuid not null, room_code text not null,
  criado_em timestamptz not null default now(), visto boolean not null default false
);
alter table public.esc_rivais enable row level security;   -- sem policy: só pelas funções abaixo
alter table public.esc_convites enable row level security;

CREATE OR REPLACE FUNCTION public.esc_rank_online(p_desde timestamp with time zone)
 RETURNS TABLE(uid text, titulos integer, pos integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  with t as (
    select x->>'user_id' as uid,
      sum((case when coalesce((x->>'league_champion')::boolean, false) then 1 else 0 end)
        + coalesce(jsonb_array_length(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end), 0))::int as n
    from (select created_at, human_results from game_champions union all select created_at, human_results from game_champions_arquivo) g,
         jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
    where g.created_at >= p_desde and x->>'user_id' is not null
    group by 1
  )
  select uid, n, (rank() over (order by n desc))::int from t where n > 0
$function$;

CREATE OR REPLACE FUNCTION public.esc_perfil_publico2(p_uid uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare eu uuid := auth.uid(); base jsonb; sem timestamptz; mes timestamptz; r record; extra jsonb := '{}'::jsonb;
begin
  base := esc_perfil_publico(p_uid);
  if base is null then return null; end if;
  sem := date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  mes := date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  extra := jsonb_build_object(
    'semana', (select jsonb_build_object('pos', pos, 'titulos', titulos, 'total', (select count(*) from esc_rank_online(sem))) from esc_rank_online(sem) where uid = p_uid::text),
    'mes', (select jsonb_build_object('pos', pos, 'titulos', titulos, 'total', (select count(*) from esc_rank_online(mes))) from esc_rank_online(mes) where uid = p_uid::text),
    'medalhas', (select jsonb_build_object('ouro', count(*) filter (where pos = 1), 'prata', count(*) filter (where pos = 2), 'bronze', count(*) filter (where pos = 3)) from esc_premio_semana where user_id = p_uid),
    'meu_rival', coalesce((select rival_id = p_uid from esc_rivais where user_id = eu), false)
  );
  select v.rival_id, v.desde into r from esc_rivais v where v.user_id = p_uid;
  if r.rival_id is not null and r.rival_id <> p_uid then
    extra := extra || jsonb_build_object('rival', jsonb_build_object('uid', r.rival_id, 'nome', esc_nome_conta(r.rival_id),
      'eu', coalesce((select titulos from esc_rank_online(r.desde) where uid = p_uid::text), 0),
      'ele', coalesce((select titulos from esc_rank_online(r.desde) where uid = r.rival_id::text), 0)));
  end if;
  return base || extra;
end $function$;

CREATE OR REPLACE FUNCTION public.esc_amigos_lista2()
 RETURNS TABLE(amizade_id bigint, outro uuid, nome text, relacao text, visto_em timestamp with time zone, tela text, online boolean, sala_code text, sala_status text, titulos_semana integer, rival boolean)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare eu uuid := auth.uid(); sem timestamptz := date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'; meu_rival uuid;
begin
  if eu is null then return; end if;
  select v.rival_id into meu_rival from esc_rivais v where v.user_id = eu;
  return query
  with ro as materialized (select r.uid, r.titulos from esc_rank_online(sem) r)
  select l.amizade_id, l.outro, l.nome, l.relacao, l.visto_em, l.tela, l.online,
    s.code, s.status,
    case when l.relacao = 'aceito' then coalesce((select ro.titulos from ro where ro.uid = l.outro::text), 0) end,
    coalesce(meu_rival = l.outro, false)
  from esc_amigos_lista() l
  left join lateral (
    select g.code, g.status from room_players rp join game_rooms g on g.id = rp.room_id
    where l.relacao = 'aceito' and l.online and rp.user_id = l.outro and g.updated_at > now() - interval '15 minutes'
    order by g.updated_at desc limit 1
  ) s on true;
end $function$;

CREATE OR REPLACE FUNCTION public.esc_rival_marcar(p_outro uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare eu uuid := auth.uid();
begin
  if eu is null or p_outro is null or p_outro = eu then return false; end if;
  if not exists (select 1 from esc_amizades z where z.ativo and z.status = 'aceito' and least(z.de, z.para) = least(eu, p_outro) and greatest(z.de, z.para) = greatest(eu, p_outro)) then return false; end if;
  insert into esc_rivais (user_id, rival_id, desde) values (eu, p_outro, now())
    on conflict (user_id) do update set rival_id = excluded.rival_id, desde = now();
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.esc_rival_tirar()
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  update esc_rivais set rival_id = user_id where user_id = auth.uid(); -- "sem rival" = aponta pra si mesmo (o perfil ignora)
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.esc_meu_rival()
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select jsonb_build_object('uid', v.rival_id, 'nome', esc_nome_conta(v.rival_id))
  from esc_rivais v where v.user_id = auth.uid() and v.rival_id <> v.user_id
$function$;

CREATE OR REPLACE FUNCTION public.esc_convite_enviar(p_para uuid, p_room text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare eu uuid := auth.uid(); st text;
begin
  if eu is null then return 'sem_conta'; end if;
  if not exists (select 1 from esc_amizades z where z.ativo and z.status = 'aceito' and least(z.de, z.para) = least(eu, p_para) and greatest(z.de, z.para) = greatest(eu, p_para)) then return 'nao_amigo'; end if;
  select g.status into st from game_rooms g join room_players rp on rp.room_id = g.id and rp.user_id = eu where g.code = upper(p_room) limit 1;
  if st is null then return 'sem_sala'; end if;
  if st <> 'waiting' then return 'comecou'; end if;
  if exists (select 1 from esc_convites c where c.de = eu and c.para = p_para and c.criado_em > now() - interval '60 seconds') then return 'espera'; end if;
  insert into esc_convites (de, para, room_code) values (eu, p_para, upper(p_room));
  return 'ok';
end $function$;

CREATE OR REPLACE FUNCTION public.esc_convite_visto(p_id bigint)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  update esc_convites set visto = true where id = p_id and para = auth.uid()
$function$;

CREATE OR REPLACE FUNCTION public.esc_avisos()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare eu uuid := auth.uid();
begin
  if eu is null then return null; end if;
  return jsonb_build_object(
    'convites', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'de', c.de, 'nome', esc_nome_conta(c.de), 'code', c.room_code,
        'status', (select g.status from game_rooms g where g.code = c.room_code order by g.updated_at desc limit 1), 'em', c.criado_em) order by c.criado_em desc)
      from esc_convites c where c.para = eu and not c.visto and c.criado_em > now() - interval '20 minutes'), '[]'::jsonb),
    'pedidos', coalesce((select jsonb_agg(jsonb_build_object('id', z.id, 'de', z.de, 'nome', esc_nome_conta(z.de), 'em', z.criado_em) order by z.criado_em desc)
      from esc_amizades z where z.para = eu and z.ativo and z.status = 'pedido'), '[]'::jsonb),
    'aceitos', coalesce((select jsonb_agg(jsonb_build_object('uid', z.para, 'nome', esc_nome_conta(z.para), 'em', z.aceito_em) order by z.aceito_em desc)
      from esc_amizades z where z.de = eu and z.ativo and z.status = 'aceito' and z.aceito_em > now() - interval '2 days'), '[]'::jsonb),
    'online', coalesce((select jsonb_agg(jsonb_build_object('uid', l.outro, 'nome', l.nome)) from esc_amigos_lista() l where l.relacao = 'aceito' and l.online), '[]'::jsonb)
  );
end $function$;

revoke execute on function public.esc_amigos_lista2(), public.esc_avisos(), public.esc_convite_enviar(uuid, text), public.esc_convite_visto(bigint),
  public.esc_perfil_publico2(uuid), public.esc_rank_online(timestamptz), public.esc_rival_marcar(uuid), public.esc_rival_tirar(), public.esc_meu_rival() from public, anon;
grant execute on function public.esc_amigos_lista2(), public.esc_avisos(), public.esc_convite_enviar(uuid, text), public.esc_convite_visto(bigint),
  public.esc_perfil_publico2(uuid), public.esc_rank_online(timestamptz), public.esc_rival_marcar(uuid), public.esc_rival_tirar(), public.esc_meu_rival() to authenticated;
