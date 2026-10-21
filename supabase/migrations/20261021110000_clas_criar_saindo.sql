-- ⚔️ CRIAR CLÃ ESTANDO EM OUTRO (Diego 21/10: "mesma coisa pra ele criar… ele precisa sair do clã onde ele está e aí também aparece o
-- banner pra ele sair"). Quem está num clã e tem plano pode criar o seu: a tela avisa antes, e com p_trocar = true o banco tira ele
-- do clã atual e cria o novo NA MESMA HORA (sai só se o nome novo passar). Presidente com gente no clã: antes passa a presidência ou
-- fecha ('presidente'). A espera de 3 dias de saídas ANTERIORES continua valendo.
create or replace function public.esc_cla_criar(p_nome text, p_emblema text, p_aberto boolean, p_trocar boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); em text; nm text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g')); emb text; esc text; novo bigint; atual bigint;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select lower(email) into em from auth.users where id = eu;
  if coalesce(esc_plano_rank(em), 0) < 1 then return jsonb_build_object('erro', 'plano'); end if;
  if char_length(nm) < 3 or char_length(nm) > 20 then return jsonb_build_object('erro', 'tamanho'); end if;
  if esc_nome_ofensivo(nm) then return jsonb_build_object('erro', 'ofensivo'); end if;
  atual := esc_cla_de(eu);
  if atual is not null and not coalesce(p_trocar, false) then return jsonb_build_object('erro', 'ja_tem'); end if;
  if atual is not null and esc_cla_presidente_preso(eu) then return jsonb_build_object('erro', 'presidente'); end if;
  if esc_cla_espera_ate(eu) is not null then return jsonb_build_object('erro', 'espera', 'ate', esc_cla_espera_ate(eu)); end if;
  if exists (select 1 from esc_clas where ativo and nome_norm = lower(nm)) then return jsonb_build_object('erro', 'nome_em_uso'); end if;
  if p_emblema = 'escudo' then
    select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
    if esc is null then return jsonb_build_object('erro', 'sem_escudo'); end if;
    emb := 'escudo:' || esc;
  elsif p_emblema ~ '^e:[0-9]{1,2}$' then emb := p_emblema;
  else emb := 'e:0'; end if;
  if atual is not null then perform esc_cla_sai_de(eu); end if;
  insert into esc_clas (nome, nome_norm, emblema, lider, aberto) values (nm, lower(nm), emb, eu, coalesce(p_aberto, true)) returning id into novo;
  insert into esc_cla_membros (cla_id, user_id) values (novo, eu);
  update esc_cla_pedidos set status = 'vencido' where user_id = eu and status = 'aberto';
  return jsonb_build_object('ok', true, 'id', novo);
end $$;
create or replace function public.esc_cla_criar(p_nome text, p_emblema text, p_aberto boolean default true)
returns jsonb language sql security definer set search_path = public as $$
  select esc_cla_criar(p_nome, p_emblema, p_aberto, false)
$$;
grant execute on function public.esc_cla_criar(text, text, boolean, boolean) to authenticated;
