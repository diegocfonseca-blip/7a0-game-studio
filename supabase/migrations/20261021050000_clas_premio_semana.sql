-- ⚔️🏆 PRÊMIO DOS CLÃS DA SEMANA (21/10, Diego: "ranking da semana de clãs embaixo do de usuários… com prêmio p moedas, 30 moedas
-- por usuário pra jogar modo carreira, vice 20 e terceiro 10, e também aparece no telão… mas não entra no lugar do usuário solo").
-- A semana fecha sozinha (preguiçosa, como a dos técnicos): os 3 clãs com mais títulos online — contando quem era membro NO FIM da
-- semana — e CADA membro ganha uma linha aqui. A carreira resgata 1× (mesmo jeito do prêmio dos técnicos).
create table if not exists public.esc_premio_cla_semana (
  semana date not null,
  user_id uuid not null references auth.users(id),
  cla_id bigint not null references public.esc_clas(id),
  pos int not null,
  nome_cla text not null,
  emblema text not null,
  titulos int not null,
  resgatado_em timestamptz,
  resgatado_seed bigint,
  primary key (semana, user_id)
);
create table if not exists public.esc_semana_cla_fechada (semana date primary key, em timestamptz not null default now());
alter table public.esc_premio_cla_semana enable row level security;
alter table public.esc_semana_cla_fechada enable row level security;

create or replace function public.esc_fecha_semanas_clas() returns void language plpgsql security definer set search_path = public as $$
declare atual date := (date_trunc('week', now() at time zone 'America/Sao_Paulo'))::date; s date := date '2026-10-19'; ini timestamptz; fim timestamptz;
begin
  while s < atual loop
    if not exists (select 1 from esc_semana_cla_fechada where semana = s) then
      perform pg_advisory_xact_lock(hashtext('esc_fecha_semana_cla_' || s));
      if not exists (select 1 from esc_semana_cla_fechada where semana = s) then
        ini := (s::timestamp) at time zone 'America/Sao_Paulo';
        fim := ((s + 7)::timestamp) at time zone 'America/Sao_Paulo';
        insert into esc_premio_cla_semana (semana, user_id, cla_id, pos, nome_cla, emblema, titulos)
        with membros as (
          select m.cla_id, m.user_id from esc_cla_membros m
          where m.desde < fim and (m.saiu_em is null or m.saiu_em >= fim)
        ), soma as (
          select mb.cla_id, coalesce(sum(t.titulos), 0)::int as titulos
          from membros mb left join esc_titulos_por_uid(ini, fim) t on t.uid = mb.user_id group by mb.cla_id
        ), pos as (
          select cla_id, titulos, rank() over (order by titulos desc) as p from soma where titulos > 0
        )
        select s, mb.user_id, p.cla_id, p.p, c.nome, c.emblema, p.titulos
        from pos p join esc_clas c on c.id = p.cla_id join membros mb on mb.cla_id = p.cla_id
        where p.p <= 3
        on conflict do nothing;
        insert into esc_semana_cla_fechada (semana) values (s) on conflict do nothing;
      end if;
    end if;
    s := s + 7;
  end loop;
end $$;

create or replace function public.esc_meus_premios_cla() returns table(semana date, pos int, nome_cla text, titulos int)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  perform esc_fecha_semanas_clas();
  return query select p.semana, p.pos, p.nome_cla, p.titulos from esc_premio_cla_semana p
    where p.user_id = auth.uid() and p.resgatado_em is null order by p.semana;
end $$;
create or replace function public.esc_resgata_premio_cla(p_semana date, p_seed bigint) returns int
language plpgsql security definer set search_path = public as $$
declare r int;
begin
  update esc_premio_cla_semana set resgatado_em = now(), resgatado_seed = p_seed
    where semana = p_semana and user_id = auth.uid() and resgatado_em is null returning pos into r;
  return r;
end $$;
-- 📺 o pódio dos clãs da última semana FECHADA (pro telão, depois do pódio dos técnicos)
create or replace function public.esc_cla_podio_passado() returns jsonb language plpgsql security definer set search_path = public as $$
declare ult date;
begin
  perform esc_fecha_semanas_clas();
  select max(semana) into ult from esc_semana_cla_fechada;
  return coalesce((select jsonb_agg(jsonb_build_object('pos', pos, 'nome', nome_cla, 'emblema', emblema, 'titulos', titulos) order by pos, nome_cla)
    from (select distinct pos, cla_id, nome_cla, emblema, titulos from esc_premio_cla_semana where semana = ult) x), '[]'::jsonb);
end $$;
grant execute on function public.esc_meus_premios_cla(), public.esc_resgata_premio_cla(date, bigint), public.esc_cla_podio_passado() to authenticated, anon;
