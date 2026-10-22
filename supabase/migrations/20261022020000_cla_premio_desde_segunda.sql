-- 🪙 22/10 (Diego: "quem entrar num time que tá em primeiro só pra ganhar as moedas?" → "sim"): o prêmio da semana do clã
-- (30/20/10 por membro) vai SÓ pra quem já estava no clã desde o COMEÇO da semana (segunda 0h, Brasília). Quem entrou no
-- meio da semana soma título pro clã normalmente — só não recebe a moeda daquela semana (recebe a partir da seguinte).
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
        where p.p <= 3 and (mb.desde <= ini or s = date '2026-10-19') -- 🪙 só quem já estava no clã desde segunda (a semana de estreia, 19/10, vale pra todos: os clãs nasceram na terça)
        order by p.p
        on conflict do nothing;
        insert into esc_semana_cla_fechada (semana) values (s) on conflict do nothing;
      end if;
    end if;
    s := s + 7;
  end loop;
end $$;
