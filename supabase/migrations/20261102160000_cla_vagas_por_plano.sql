-- ⭐⚔️ CADA MEMBRO COM PLANO = +1 VAGA NO CLÃ, SEM LIMITE (02/11, mockup scripts/mockups/cla-vagas-por-plano.png; Diego: "sem limite").
-- Limite do clã = 22 + quantos membros (contando o presidente) têm plano pago. Ninguém é tirado quando o limite baixa: o clã só
-- deixa de aceitar gente nova. A vaga que abre é de QUALQUER um.
-- ⚡ Peso: esc_direitos_de custa ~5 ms por membro. A ENTRADA (esc_cla_cabe) confere AO VIVO, só daquele clã; a lista e as caixas
-- (esc_cla_json) leem o número guardado em esc_cla_limite_cache, que um relógio do banco (pg_cron) refaz a cada 5 min.
-- Tudo de leitura continua STABLE (sem gravar): esc_cla_json é chamado de dentro de funções stable (painel do clã).
create table if not exists public.esc_cla_limite_cache (cla_id bigint primary key, limite int not null, plano int not null, em timestamptz not null default now());
alter table public.esc_cla_limite_cache enable row level security;

create or replace function public.esc_cla_limite_vivo(p_cla bigint) returns int language sql stable security definer set search_path = public as $$
  select 22 + count(*) filter (where coalesce((esc_direitos_de(lower(u.email))->>'pago')::boolean, false))::int
  from esc_cla_gente() g join auth.users u on u.id = g.user_id where g.cla_id = p_cla
$$;

create or replace function public.esc_cla_limites_atualiza() returns void language plpgsql security definer set search_path = public as $$
begin
  insert into esc_cla_limite_cache (cla_id, limite, plano, em)
  select c.id, esc_cla_limite_vivo(c.id), esc_cla_limite_vivo(c.id) - 22, now() from esc_clas c where c.ativo
  on conflict (cla_id) do update set limite = excluded.limite, plano = excluded.plano, em = now();
end $$;

create or replace function public.esc_cla_limite(p_cla bigint) returns int language sql stable security definer set search_path = public as $$
  select coalesce((select limite from esc_cla_limite_cache where cla_id = p_cla), 22)
$$;

-- entrar: conta AO VIVO
create or replace function public.esc_cla_cabe(p_cla bigint) returns boolean language sql stable security definer set search_path = public as $$
  select (select count(*) from esc_cla_gente() g where g.cla_id = p_cla) < esc_cla_limite_vivo(p_cla)
$$;

create or replace function public.esc_cla_json(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', c.id, 'nome', c.nome, 'emblema', c.emblema, 'aberto', c.aberto, 'lider', c.lider, 'lider_nome', esc_nome_conta(c.lider),
    'membros', (select count(*) from esc_cla_gente() g where g.cla_id = c.id),
    'titulos', coalesce((select s.titulos from esc_clas_semana(0) s where s.cla_id = c.id), 0),
    'campeao', c.id = esc_cla_campeao_passado(), 'extra', c.extra, 'descricao', c.descricao,
    'limite', esc_cla_limite(c.id), 'plano', esc_cla_limite(c.id) - 22)
  from esc_clas c where c.id = p_cla
$$;

create or replace function public.esc_cla_lista(p_q text default ''::text, p_filtro text default 'vaga'::text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(j order by (j->>'titulos')::int desc, j->>'nome'), '[]'::jsonb) from (
    select esc_cla_json(c.id) as j from esc_clas c
    where c.ativo and (coalesce(p_q, '') = '' or c.nome_norm like '%' || lower(btrim(p_q)) || '%')
      and (p_filtro <> 'batismo' or c.emblema like 'escudo:%')
    limit 60) x
  where p_filtro <> 'vaga' or (j->>'membros')::int < (j->>'limite')::int
$$;

select public.esc_cla_limites_atualiza();
select cron.schedule('esc-cla-limites', '*/5 * * * *', 'select public.esc_cla_limites_atualiza()');
