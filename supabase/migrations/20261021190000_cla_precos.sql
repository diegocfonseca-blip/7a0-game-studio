-- 💸 PREÇOS DOS CLÃS (Diego 21/10): *"todo segundo clã para criar é R$ 9,90, só para criar. O escudo, que é R$ 19,90… pode deixar R$ 19,90"*.
-- 2º clã ('cla_extra') = R$ 9,90 e NÃO traz escudo personalizado (nasce com emblema pronto, ou com nome + escudo do batismo pra quem tem).
-- Escudo personalizado ('escudo_cla') = R$ 19,90, à parte, pra qualquer clã do presidente. O pedido do 2º clã que já virou clã fica em
-- esc_clas.pedido_criar (o mesmo campo do crédito de R$ 9,90 do 1º clã sem plano).
create or replace function public.esc_mp_preco_ref(p_email text, p_produto text, p_ref text)
 returns numeric language plpgsql stable security definer set search_path = public as $$
declare pl text; rk int; alvo int; duplo boolean := coalesce(p_ref, '') ~ '^d-\d{1,12}$'; rid text;
begin
  if p_produto = 'escudo_cla' then return case when public.esc_cla_presidente_email(p_email) then 19.90 else null end; end if; -- 🛡️ 21/10 (19,90)
  if p_produto = 'cla_criar' then return case when coalesce(public.esc_plano_rank(lower(p_email)), 0) < 1 and public.esc_cla_credito_criar(p_email) is null then 9.90 else null end; end if; -- 🔓 21/10
  if p_produto = 'cla_extra' then return case when public.esc_cla_pode_extra(p_email) then 9.90 else null end; end if;   -- ⚔️⚔️ 21/10 (9,90, só criar)
  if p_produto in ('moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000') then return substring(p_produto from 8)::numeric; end if;
  if p_produto = 'dia_marca' then return 50.00; end if;
  if p_produto = 'peca_presidente' then return public.esc_preco_peca(p_email, p_ref); end if;
  if p_produto = 'giro_dia' then return 25.00; end if;
  if p_produto = 'giro_hora' then return 4.99; end if;
  if p_produto = 'recado_hora' then return 2.99; end if;
  if p_produto = 'recado_dia' then return 9.90; end if;
  if p_produto = 'canto' then
    rk := coalesce(public.esc_plano_rank(p_email), 0);
    return case when rk = 3 then 10.00 else null end;
  end if;
  if p_produto = 'presente' then
    rid := case when duplo then substring(p_ref from 3) else p_ref end;
    if coalesce(rid, '') !~ '^\d{1,12}$' then return null; end if;
    select plano into pl from public.esc_presentes where id = rid::bigint and lower(de_email) = lower(p_email) and status = 'pedido';
    if pl is null then return null; end if;
    if duplo then
      alvo := case pl when 'craque' then 1 when 'lenda' then 2 when 'batismo' then 3 when 'fundador' then 4 end;
      if coalesce(public.esc_plano_rank(p_email), 0) >= alvo then return null; end if;
      return case pl when 'craque' then 53.90 when 'lenda' then 80.90 when 'batismo' then 143.90 when 'fundador' then 179.90 end;
    end if;
    return case pl when 'craque' then 29.90 when 'lenda' then 44.90 when 'batismo' then 79.90 when 'fundador' then 99.90 else null end;
  end if;
  if p_produto = 'tema_coracao' then
    if coalesce(p_ref, '') !~ '^[a-z0-9-]{2,20}$' then return null; end if;
    if exists (select 1 from public.esc_temas_conta t where lower(t.email) = lower(p_email) and t.tipo = 'coracao' and t.alvo = p_ref) then return null; end if;
    return 6.90;
  end if;
  if p_produto = 'tema_clube' then
    rk := coalesce(public.esc_plano_rank(p_email), 0);
    if rk < 3 then return null; end if;
    return case when rk >= 4 then 9.90 else 6.90 end;
  end if;
  return public.esc_mp_preco(p_email, p_produto);
end $$;

-- pode comprar o 2º? presidente do seu clã, sem 2º ainda, e sem Pix de 2º clã pago esperando virar clã
create or replace function public.esc_cla_pode_extra(p_email text) returns boolean language sql stable security definer set search_path = public as $$
  select public.esc_cla_presidente_email(p_email)
    and not exists (select 1 from auth.users u where lower(u.email) = lower(p_email) and public.esc_cla_extra_de(u.id) is not null)
    and not exists (select 1 from esc_mp_pedidos p where p.email = lower(p_email) and p.produto = 'cla_extra' and p.status in ('pago', 'liberado')
                    and not exists (select 1 from esc_clas c where c.pedido_criar = p.id)
                    and not exists (select 1 from esc_cla_escudo_pedidos e where e.pedido_id = p.id))
$$;

-- os Pix de 2º clã pagos que ainda não viraram clã (a Loja mostra o formulário de criar)
create or replace function public.esc_cla_extra_pendentes() returns table(id uuid) language sql stable security definer set search_path = public as $$
  select p.id from esc_mp_pedidos p
  where p.email = lower(coalesce(auth.jwt() ->> 'email', '')) and p.produto = 'cla_extra' and p.status in ('pago', 'liberado')
    and not exists (select 1 from esc_clas c where c.pedido_criar = p.id)
    and not exists (select 1 from esc_cla_escudo_pedidos e where e.pedido_id = p.id)
  order by p.criado_em
$$;

-- criar o 2º clã com o Pix de R$ 9,90: batismo → o time (nome sem FC + escudo); sem batismo → nome + emblema pronto
create or replace function public.esc_cla_extra_criar2(p_id uuid, p_nome text, p_emblema text, p_batismo boolean) returns text
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', '')); eu uuid := auth.uid(); esc text; n text; emb text;
begin
  if not exists (select 1 from esc_mp_pedidos where id = p_id and email = em and produto = 'cla_extra' and status in ('pago', 'liberado')) then return 'sem_pedido'; end if;
  if exists (select 1 from esc_clas where pedido_criar = p_id) or exists (select 1 from esc_cla_escudo_pedidos where pedido_id = p_id) then return 'ja_tem'; end if;
  if esc_cla_extra_de(eu) is not null then return 'ja_tem'; end if;
  if coalesce(p_batismo, false) then
    select escudo_time into esc from esc_socios where lower(email) = em and escudo_time is not null order by socio_n desc nulls last limit 1;
    if esc is null then return 'sem_escudo'; end if;
    n := esc_cla_sem_fc(esc); emb := 'escudo:' || esc;
  else
    n := esc_cla_sem_fc(regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g'));
    if char_length(n) < 3 or char_length(n) > 20 then return 'tamanho'; end if;
    if esc_nome_ofensivo(n) then return 'ofensivo'; end if;
    emb := case when p_emblema ~ '^e:[0-9]{1,2}$' then p_emblema else 'e:0' end;
  end if;
  if exists (select 1 from esc_clas where ativo and nome_norm = lower(n)) then return 'nome_em_uso'; end if;
  insert into esc_clas (nome, nome_norm, emblema, lider, aberto, extra, pedido_criar) values (n, lower(n), emb, eu, true, true, p_id);
  return 'ok';
end $$;
grant execute on function public.esc_cla_extra_pendentes(), public.esc_cla_extra_criar2(uuid, text, text, boolean) to authenticated;
