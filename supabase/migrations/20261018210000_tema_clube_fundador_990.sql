-- 🖋 TEMA DO CLUBE: Fundador paga R$ 9,90 e leva o tema do clube + uma 2ª cor de fundo com a mascote (18/10, Diego).
-- Batismo segue R$ 6,90. O resto da função é igual à de 20261018200000.
create or replace function public.esc_mp_preco_ref(p_email text, p_produto text, p_ref text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare pl text; rk int; alvo int; duplo boolean := coalesce(p_ref, '') ~ '^d-\d{1,12}$'; rid text;
begin
  if p_produto in ('moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000') then return substring(p_produto from 8)::numeric; end if;
  if p_produto = 'dia_marca' then return 50.00; end if;
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
    return case when rk >= 4 then 9.90 else 6.90 end; -- 🖋 Fundador 9,90 (clube + 2ª cor da mascote) · Batismo 6,90
  end if;
  return public.esc_mp_preco(p_email, p_produto);
end $$;
