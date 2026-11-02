-- 🥇⚔️ MEDALHA DO CLÃ DA SEMANA (02/11, mockup scripts/mockups/cla-semana-medalha.png, Diego: "ok pode fazer e publica").
-- O top 3 de clãs de cada semana fechada ganha medalha 🥇🥈🥉 NA PÍLULA do clã por 30 dias (todo membro carrega).
-- Pódio por CLÃ (não por membro): o `esc_premio_cla_semana` só guarda quem está desde segunda (regra da moeda), então
-- um clã campeão sem ninguém "desde segunda" sumia — aqui ele entra sempre. Mesma conta de títulos do fecho da moeda.
create table if not exists public.esc_podio_cla_semana (
  semana date not null, cla_id bigint not null, pos int not null, titulos int not null,
  primary key (semana, cla_id)
);
alter table public.esc_podio_cla_semana enable row level security;

create or replace function public.esc_podio_clas_preenche() returns void language plpgsql security definer set search_path = public as $$
declare atual date := (date_trunc('week', now() at time zone 'America/Sao_Paulo'))::date; s date := date '2026-10-19'; ini timestamptz; fim timestamptz;
begin
  while s < atual loop
    if not exists (select 1 from esc_podio_cla_semana where semana = s) then
      ini := (s::timestamp) at time zone 'America/Sao_Paulo';
      fim := ((s + 7)::timestamp) at time zone 'America/Sao_Paulo';
      insert into esc_podio_cla_semana (semana, cla_id, pos, titulos)
      with membros as (
        select m.cla_id, m.user_id from esc_cla_membros m
        where m.desde < fim and (m.saiu_em is null or m.saiu_em >= fim)
      ), soma as (
        select mb.cla_id, coalesce(sum(t.titulos), 0)::int as titulos
        from membros mb left join esc_titulos_por_uid(ini, fim) t on t.uid = mb.user_id group by mb.cla_id
      ), pos as (
        select cla_id, titulos, rank() over (order by titulos desc) as p from soma where titulos > 0
      )
      select s, cla_id, p, titulos from pos where p <= 3
      on conflict do nothing;
    end if;
    s := s + 7;
  end loop;
end $$;

-- a medalha que vale AGORA pro clã: a melhor posição entre as semanas fechadas há menos de 30 dias
-- (semana fecha na segunda seguinte = semana + 7; medalha some 30 dias depois = semana + 37)
create or replace function public.esc_cla_medalha(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('pos', pos, 'ate', semana + 37)
  from esc_podio_cla_semana
  where cla_id = p_cla and (semana + 37) > (now() at time zone 'America/Sao_Paulo')::date
  order by pos, semana desc limit 1
$$;

-- a pílula ganha `medalha` (1/2/3), `medalha_ate` e `presidente` (coroa dourada quando o clã tem medalha)
create or replace function public.esc_clas_de(p_uids uuid[]) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('uid', m.user_id, 'id', c.id, 'nome', c.nome, 'emblema', c.emblema,
    'campeao', c.id = esc_cla_campeao_passado(),
    'medalha', (esc_cla_medalha(c.id)->>'pos')::int, 'medalha_ate', esc_cla_medalha(c.id)->>'ate',
    'presidente', c.lider = m.user_id)), '[]'::jsonb)
  from esc_cla_membros m join esc_clas c on c.id = m.cla_id and c.ativo
  where m.saiu_em is null and m.vaga = 1 and m.user_id = any(p_uids[1:60])
$$;

grant execute on function public.esc_cla_medalha(bigint) to authenticated;
grant execute on function public.esc_clas_de(uuid[]) to authenticated;
select public.esc_podio_clas_preenche();

-- o fecho da semana (o mesmo de sempre, que paga as moedas) agora também grava o pódio por clã no fim
create or replace function public.esc_fecha_semanas_clas() returns void language plpgsql security definer set search_path = public as $function$
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
          select m.cla_id, m.user_id, m.desde from esc_cla_membros m
          where m.desde < fim and (m.saiu_em is null or m.saiu_em >= fim)
        ), soma as (
          select mb.cla_id, coalesce(sum(t.titulos), 0)::int as titulos
          from membros mb left join esc_titulos_por_uid(ini, fim) t on t.uid = mb.user_id group by mb.cla_id
        ), pos as (
          select cla_id, titulos, rank() over (order by titulos desc) as p from soma where titulos > 0
        )
        select s, mb.user_id, p.cla_id, p.p, c.nome, c.emblema, p.titulos
        from pos p join esc_clas c on c.id = p.cla_id join membros mb on mb.cla_id = p.cla_id
        where p.p <= 3 and (mb.desde <= ini or s = date '2026-10-19')
        order by p.p
        on conflict do nothing;
        insert into esc_semana_cla_fechada (semana) values (s) on conflict do nothing;
      end if;
    end if;
    s := s + 7;
  end loop;
  perform esc_podio_clas_preenche(); -- 🥇 02/11: pódio por clã (medalha na pílula)
end $function$;
