-- 🏆🪙 PRÊMIO DO RANKING DA SEMANA (17/10, Diego: "quem ficar entre os 3 ganha moedas na carreira… cai direto na conta
-- após acabar a semana… 1º 20 · 2º 10 · 3º 5"). A régua do ranking é a MESMA de `esc_vitrine_salas` (títulos online de
-- segunda 0h a segunda 0h, Brasília; empate divide a posição, como a vitrine mostra). Só quem tem conta (user_id).
-- A 1ª semana paga é a de 12/10 (fecha na segunda 19/10). Espelho no código: `RANKING_SEMANA_MOEDAS` (store.tsx).
create table if not exists public.esc_premio_semana (
  semana date not null,
  user_id uuid not null,
  pos int not null check (pos between 1 and 3),
  moedas int not null,
  nome text,
  titulos int,
  criado_em timestamptz not null default now(),
  resgatado_em timestamptz,
  resgatado_seed bigint,
  primary key (semana, user_id)
);
alter table public.esc_premio_semana enable row level security;
create table if not exists public.esc_semana_fechada (semana date primary key, fechada_em timestamptz not null default now());
alter table public.esc_semana_fechada enable row level security;

-- fecha TODA semana já terminada (desde 12/10) que ainda não foi fechada. Idempotente.
create or replace function public.esc_fecha_semanas()
returns void language plpgsql security definer set search_path to 'public' as $$
declare atual date := (date_trunc('week', now() at time zone 'America/Sao_Paulo'))::date; s date := date '2026-10-12';
  ini timestamptz; fim timestamptz;
begin
  while s < atual loop
    if not exists (select 1 from esc_semana_fechada where semana = s) then
      perform pg_advisory_xact_lock(hashtext('esc_fecha_semana_' || s));
      if not exists (select 1 from esc_semana_fechada where semana = s) then
        ini := (s::timestamp) at time zone 'America/Sao_Paulo';
        fim := ((s + 7)::timestamp) at time zone 'America/Sao_Paulo';
        insert into esc_premio_semana (semana, user_id, pos, moedas, nome, titulos)
        with gente as (
          select g.created_at, x
          from (select created_at, human_results from game_champions
                union all select created_at, human_results from game_champions_arquivo) g,
               jsonb_array_elements(coalesce(g.human_results, '[]'::jsonb)) x
          where g.created_at >= ini and g.created_at < fim and x->>'user_id' is not null
        ), taca as (
          select created_at, x,
            (case when coalesce((x->>'league_champion')::boolean, false) then 1 else 0 end)
              + coalesce(jsonb_array_length(case when jsonb_typeof(x->'cup_titles') = 'array' then x->'cup_titles' end), 0) as n
          from gente
        ), ultimo as (
          select distinct on (x->>'user_id') x->>'user_id' as uid, x->>'display_name' as nome
          from gente order by x->>'user_id', created_at desc
        ), rk as (
          select x->>'user_id' as uid, sum(n)::int as titulos from taca where n > 0 group by 1
        ), pos as (
          select r.uid, u.nome, r.titulos, rank() over (order by r.titulos desc) as p from rk r left join ultimo u on u.uid = r.uid
        )
        select s, uid::uuid, p, case p when 1 then 20 when 2 then 10 else 5 end, nome, titulos
        from pos where p <= 3 and uid ~ '^[0-9a-f-]{36}$'
        on conflict do nothing;
        insert into esc_semana_fechada (semana) values (s) on conflict do nothing;
      end if;
    end if;
    s := s + 7;
  end loop;
end $$;

-- o que EU tenho pra receber (fecha as semanas antes de olhar)
create or replace function public.esc_meus_premios_semana()
returns table (semana date, pos int, moedas int, titulos int) language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then return; end if;
  perform esc_fecha_semanas();
  return query select p.semana, p.pos, p.moedas, p.titulos from esc_premio_semana p
    where p.user_id = auth.uid() and p.resgatado_em is null order by p.semana;
end $$;

-- marca como recebido (1× só) e devolve a POSIÇÃO; o valor quem decide é o código do jogo
create or replace function public.esc_resgata_premio_semana(p_semana date, p_seed bigint)
returns int language plpgsql security definer set search_path to 'public' as $$
declare r int;
begin
  update esc_premio_semana set resgatado_em = now(), resgatado_seed = p_seed
    where semana = p_semana and user_id = auth.uid() and resgatado_em is null
    returning pos into r;
  return r;
end $$;
revoke all on function public.esc_fecha_semanas() from public, anon, authenticated;
grant execute on function public.esc_meus_premios_semana() to authenticated;
grant execute on function public.esc_resgata_premio_semana(date, bigint) to authenticated;
