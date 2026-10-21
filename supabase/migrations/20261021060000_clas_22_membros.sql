-- ⚔️ Clãs: máximo de membros 20 → 22 (Diego 21/10: "coloque 22"). O código tem o MESMO número em `CLA_MAX` (cla.tsx).
create or replace function public.esc_cla_cabe(p_cla bigint) returns boolean language sql stable security definer set search_path = public as $$
  select count(*) < 22 from esc_cla_membros where cla_id = p_cla and saiu_em is null
$$;
create or replace function public.esc_cla_lista(p_q text default '', p_filtro text default 'vaga') returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(j order by (j->>'titulos')::int desc, j->>'nome'), '[]'::jsonb) from (
    select esc_cla_json(c.id) as j from esc_clas c
    where c.ativo and (coalesce(p_q, '') = '' or c.nome_norm like '%' || lower(btrim(p_q)) || '%')
      and (p_filtro <> 'batismo' or c.emblema like 'escudo:%')
    limit 60) x
  where p_filtro <> 'vaga' or (j->>'membros')::int < 22
$$;
