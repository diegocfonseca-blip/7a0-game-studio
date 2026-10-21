-- 🚫🖋 ESCUDO DE BATISMO NÃO É EMBLEMA DE CLÃ CRIADO (Diego 21/10, print do Ranking dos clãs: *"tá aparecendo escudo de batismo no nome
-- dos caras do clã… tá errado"*). O escudo do batismo é do DONO; num clã comum ele ia pro selo de TODO membro, como se todos fossem
-- donos do clube. 🔁 Mesmo dia (Diego, print da tela de criar: *"faltou aparecer a opção de quem tem batismo entrar com seu escudo e nome do time"*):
-- o escudo do batismo SÓ vem junto com o NOME do time — 'escudo' agora cria o clã com o nome do batismo; escudo com outro nome não existe.
-- Os 2 clãs que já tinham nascido com o escudo do batismo (Pontuadores · Oliver Clã) ganharam um emblema pronto.
update public.esc_clas set emblema = 'e:3' where id = 17 and emblema like 'escudo:%' and not extra; -- Pontuadores (dono do Futpoint FC)
update public.esc_clas set emblema = 'e:4' where id = 18 and emblema like 'escudo:%' and not extra; -- Oliver Clã (dona do Julia Barranquila)

create or replace function public.esc_cla_criar(p_nome text, p_emblema text, p_aberto boolean, p_trocar boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); em text; nm text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g')); emb text; esc text; novo bigint; atual bigint;
begin
  if eu is null then return jsonb_build_object('erro', 'login'); end if;
  select lower(email) into em from auth.users where id = eu;
  if coalesce(esc_plano_rank(em), 0) < 1 then return jsonb_build_object('erro', 'plano'); end if;
  if p_emblema = 'escudo' then
    -- 🖋 clã do batismo: NOME e ESCUDO do time do dono, juntos
    select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
    if esc is null then return jsonb_build_object('erro', 'sem_escudo'); end if;
    nm := esc; emb := 'escudo:' || esc;
  else
    if char_length(nm) < 3 or char_length(nm) > 20 then return jsonb_build_object('erro', 'tamanho'); end if;
    if esc_nome_ofensivo(nm) then return jsonb_build_object('erro', 'ofensivo'); end if;
    emb := case when p_emblema ~ '^e:[0-9]{1,2}$' then p_emblema else 'e:0' end;
  end if;
  atual := esc_cla_de(eu);
  if atual is not null and not coalesce(p_trocar, false) then return jsonb_build_object('erro', 'ja_tem'); end if;
  if atual is not null and esc_cla_presidente_preso(eu) then return jsonb_build_object('erro', 'presidente'); end if;
  if esc_cla_espera_ate(eu) is not null then return jsonb_build_object('erro', 'espera', 'ate', esc_cla_espera_ate(eu)); end if;
  if exists (select 1 from esc_clas where ativo and nome_norm = lower(nm)) then return jsonb_build_object('erro', 'nome_em_uso'); end if;
  if atual is not null then perform esc_cla_sai_de(eu); end if;
  insert into esc_clas (nome, nome_norm, emblema, lider, aberto) values (nm, lower(nm), emb, eu, coalesce(p_aberto, true)) returning id into novo;
  insert into esc_cla_membros (cla_id, user_id) values (novo, eu);
  update esc_cla_pedidos set status = 'vencido' where user_id = eu and status = 'aberto';
  return jsonb_build_object('ok', true, 'id', novo);
end $$;
