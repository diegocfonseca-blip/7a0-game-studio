-- ⚡ 03/11 (Diego, print do "carregando..." ao tocar num clã da caixa Clãs da semana: "por que tá demorando pra abrir o clã?").
-- esc_cla_ver levava 15–23 s: era SQL "inlinável" e o banco fundia esc_cla_bloco + esc_cla_json + esc_clas_semana numa consulta
-- só, recalculando o ranking da semana várias vezes. Em plpgsql cada pedaço roda UMA vez → ~0,5 s.
-- esc_cla_lista (Entrar num clã) levava ~4 s (esc_cla_json por clã) → ranking e campeão calculados uma vez → ~0,5 s.
-- Mesma saída e mesma assinatura das duas.
create or replace function public.esc_cla_ver(p_cla bigint) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_eu uuid := auth.uid(); v_bloco jsonb;
begin
  if not exists (select 1 from esc_clas c where c.id = p_cla and c.ativo) then return null; end if;
  v_bloco := esc_cla_bloco(p_cla, v_eu);
  return v_bloco || jsonb_build_object(
    'sou', esc_cla_membro_de(v_eu, p_cla),
    'pedi', exists (select 1 from esc_cla_pedidos p where p.cla_id = p_cla and p.user_id = v_eu and p.tipo = 'pedido' and p.status = 'aberto'));
end $$;

create or replace function public.esc_cla_lista(p_q text default ''::text, p_filtro text default 'vaga'::text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_camp bigint := esc_cla_campeao_passado(); v jsonb;
begin
  with sem as materialized (select cla_id, titulos from esc_clas_semana(0)),
  gente as materialized (select cla_id, count(*)::int n from esc_cla_gente() group by cla_id),
  j as (
    select jsonb_build_object('id', c.id, 'nome', c.nome, 'emblema', c.emblema, 'aberto', c.aberto, 'lider', c.lider, 'lider_nome', esc_nome_conta(c.lider),
      'membros', coalesce(g.n, 0), 'titulos', coalesce(s.titulos, 0), 'campeao', c.id = v_camp, 'extra', c.extra, 'descricao', c.descricao,
      'limite', esc_cla_limite(c.id), 'plano', esc_cla_limite(c.id) - 22) as j
    from esc_clas c left join sem s on s.cla_id = c.id left join gente g on g.cla_id = c.id
    where c.ativo and (coalesce(p_q, '') = '' or c.nome_norm like '%' || lower(btrim(p_q)) || '%')
      and (p_filtro <> 'batismo' or c.emblema like 'escudo:%')
    limit 60)
  select coalesce(jsonb_agg(j order by (j->>'titulos')::int desc, j->>'nome'), '[]'::jsonb) into v
  from j where p_filtro <> 'vaga' or (j->>'membros')::int < (j->>'limite')::int;
  return v;
end $$;
