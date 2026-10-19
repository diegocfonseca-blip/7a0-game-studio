-- 🏅 PÓDIO DA SEMANA: medalha de 30 dias + aviso do pódio (19/10, Diego, mockup `scripts/mockups/podio-30d.png`).
-- A vitrine ganha 3 campos (tudo ADITIVO, o jogo velho ignora):
--   · podio   = user_ids de quem está no TOP 3 AGORA — a moldura/fita da sala e do chat passam a olhar o id, não o emoji
--               do nome (com medalha de 30 dias no nome, "tem 🥇 no nome" deixou de significar "é o 1º de agora").
--   · passada = o pódio da última semana FECHADA (`esc_premio_semana`), pra caixa embaixo do ranking e pro telão roxo.
--   · ganhas  = as medalhas que ESTA conta ganhou nos fechos dos últimos 30 dias (mais nova primeiro) — vão grudadas no nome.
create or replace function public.esc_vitrine_salas()
returns jsonb language sql stable security definer set search_path = public as $$
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
  'semana', coalesce((select jsonb_agg(jsonb_build_object('nome', nome, 'titulos', titulos, 'pos', pos) order by ord)
                      from pos where ord <= 5), '[]'::jsonb),
  'eu', (select jsonb_build_object('nome', nome, 'titulos', titulos, 'pos', pos) from pos where k = auth.uid()::text),
  'batismo', (select jsonb_build_object('clube', escudo_time, 'desde', desde) from bat),
  'podio', coalesce((select jsonb_agg(jsonb_build_object('uid', k, 'pos', pos)) from pos where pos <= 3 and k not like 'nome:%'), '[]'::jsonb),
  'passada', coalesce((select jsonb_agg(jsonb_build_object('nome', p.nome, 'titulos', p.titulos, 'pos', p.pos) order by p.pos, p.nome)
                       from esc_premio_semana p, fechada f where p.semana = f.semana and p.pos <= 3), '[]'::jsonb),
  'ganhas', coalesce((select string_agg(case p.pos when 1 then '🥇' when 2 then '🥈' else '🥉' end, '' order by p.semana desc)
                      from esc_premio_semana p where p.user_id = auth.uid() and p.pos <= 3 and p.semana >= current_date - 37), '')
);
$$;
