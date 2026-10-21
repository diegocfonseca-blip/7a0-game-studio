-- 👆 21/10 (Diego): "todos que aparecem no ranking da semana, dá pra clicar… chamar como amigo, convidar pro clã" e "no ranking
-- dos clãs, aperto no Futpoint e abre um modal pra ver quem são os usuários… e entrar (sem cadeado) ou pedir pra entrar (com
-- cadeado)… se já tiver 22, aparece escrito". 1) o ranking da semana passa a mandar o id da conta (uid) de cada linha;
-- 2) esc_cla_ver: o clã com a lista de membros + se EU já estou nele / já pedi.
create or replace function public.esc_vitrine_salas() returns jsonb language sql stable security definer set search_path = public as $$
with marcos as (
  select (date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as hoje,
         (date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') as semana
),
gente as (
  select g.id, g.created_at, x
  from (select id, created_at, human_results from game_champions
        union all select id, created_at, human_results from game_champions_arquivo) g,
       marcos m, jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
  where g.created_at >= m.semana
),
taca as (
  select id, created_at, x,
    (case when coalesce((x->>'league_champion')::boolean, false) then 1 else 0 end)
      + coalesce(jsonb_array_length(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end), 0) as n
  from gente
),
hoje as (
  select distinct on (t.id, x->>'team_name')
    t.created_at, x->>'display_name' as nome, x->>'team_name' as time,
    (case when coalesce((x->>'league_champion')::boolean, false) then '["liga"]'::jsonb else '[]'::jsonb end)
      || coalesce(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end, '[]'::jsonb) as titulos
  from taca t, marcos m
  where t.n > 0 and t.created_at >= m.hoje
  order by t.id, x->>'team_name', t.created_at desc
),
ultimo as (
  select distinct on (x->>'user_id') x->>'user_id' as uid, x->>'display_name' as nome
  from gente where x->>'user_id' is not null
  order by x->>'user_id', created_at desc
),
rk0 as (
  select x->>'user_id' as uid, coalesce(x->>'user_id', 'nome:' || (x->>'display_name')) as k,
         max(x->>'display_name') as nm, sum(n)::int as titulos
  from taca where n > 0 group by 1, 2
),
rk as (select r.k, coalesce(u.nome, r.nm) as nome, r.titulos from rk0 r left join ultimo u on u.uid = r.uid),
pos as (
  select k, nome, titulos, rank() over (order by titulos desc) as pos,
         row_number() over (order by titulos desc, nome) as ord from rk
),
bat as (
  select escudo_time, desde from esc_socios
  where origem = 'batismo' and escudo_time is not null
  order by socio_n desc nulls last limit 1
),
fechada as (select max(semana) as semana from esc_premio_semana)
select jsonb_build_object(
  'hoje', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'time', time, 'titulos', titulos, 'em', created_at) order by created_at desc)
                    from (select * from hoje order by created_at desc limit 5) h), '[]'::jsonb),
  'semana', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'titulos', titulos, 'pos', pos, 'uid', case when k like 'nome:%' then null else k end) order by ord)
                      from pos where ord <= 5), '[]'::jsonb),
  'eu', (select jsonb_build_object('nome', nome, 'titulos', titulos, 'pos', pos) from pos where k = auth.uid()::text),
  'batismo', (select jsonb_build_object('clube', escudo_time, 'desde', desde) from bat),
  'podio', coalesce((select jsonb_agg(jsonb_build_object('uid', k, 'pos', pos)) from pos where pos <= 3 and k not like 'nome:%'), '[]'::jsonb),
  'passada', coalesce((select jsonb_agg(jsonb_build_object('nome', p.nome, 'titulos', p.titulos, 'pos', p.pos, 'uid', p.user_id) order by p.pos, p.nome)
                       from esc_premio_semana p, fechada f where p.semana = f.semana and p.pos <= 3), '[]'::jsonb),
  'ganhas', coalesce((select string_agg(case p.pos when 1 then '🥇' when 2 then '🥈' else '🥉' end, '' order by p.semana desc)
                      from esc_premio_semana p where p.user_id = auth.uid() and p.pos <= 3 and p.semana >= current_date - 37), '')
);
$$;
create or replace function public.esc_cla_ver(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select esc_cla_bloco(c.id, auth.uid()) || jsonb_build_object(
    'sou', esc_cla_membro_de(auth.uid(), c.id),
    'pedi', exists (select 1 from esc_cla_pedidos p where p.cla_id = c.id and p.user_id = auth.uid() and p.tipo = 'pedido' and p.status = 'aberto'))
  from esc_clas c where c.id = p_cla and c.ativo
$$;
grant execute on function public.esc_cla_ver(bigint) to authenticated, anon;
