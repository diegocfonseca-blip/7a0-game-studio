-- 🎟️ 21/11: CUPOM DE INFLUENCIADOR NO PIX NOVO (Mercado Pago) — Batismo E Fundador (Diego: "Sim").
-- O cupom viaja na REF do pedido ('cupom-<CODIGO>'); o banco confere o código (esc_cupom_validar) e cobra com o desconto.
-- Cupom inválido/vencido = pedido recusado (a tela confere antes, igual a tela antiga). O uso do cupom fica anotado em
-- esc_cupom_usos quando o Pix CAI (gatilho), pro painel do influenciador continuar contando.
create or replace function public.esc_mp_criar_pedido(p_email text, p_produto text, p_telefone text, p_ref text)
 returns table(pedido_id uuid, valor numeric)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v numeric; e text := lower(trim(p_email)); tel text := nullif(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), ''); pct int;
begin
  if not exists (select 1 from auth.users u where lower(u.email) = e) then raise exception 'SEM_CONTA'; end if;
  if p_produto in ('batismo', 'fundador') and coalesce(p_ref, '') ~ '^cupom-[A-Za-z0-9]{2,30}$' then
    v := public.esc_mp_preco(e, p_produto);
    select c.desconto_pct into pct from public.esc_cupom_validar(substring(p_ref from 7), 'batismo') c;
    if v is null or pct is null then raise exception 'JA_TEM_OU_INVALIDO'; end if;
    v := round(v * (100 - pct) / 100.0, 2);
  else
    v := public.esc_mp_preco_ref(e, p_produto, p_ref);
  end if;
  if v is null then raise exception 'JA_TEM_OU_INVALIDO'; end if;
  if tel is not null and (length(tel) < 10 or length(tel) > 13) then tel := null; end if;
  return query insert into public.esc_mp_pedidos (email, produto, valor, telefone, ref) values (e, p_produto, v, tel, nullif(p_ref, '')) returning id, esc_mp_pedidos.valor;
end $function$;

create or replace function public.esc_mp_cupom_anota()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare cod text := upper(substring(new.ref from 7)); pct int;
begin
  select c.desconto_pct into pct from public.esc_cupons c where c.codigo = cod;
  insert into public.esc_cupom_usos (codigo, email, clube, serie, valor_cheio, valor_pago)
  values (cod, new.email, left(coalesce(new.briefing ->> 'clube', ''), 40), case new.produto when 'fundador' then 'FUN' else 'BAT' end,
          case when pct is null or pct >= 100 then new.valor else round(new.valor * 100 / (100 - pct), 2) end, new.valor);
  return new;
end $function$;

create trigger esc_mp_cupom_anota after update of status on public.esc_mp_pedidos
  for each row when (new.status = 'pago' and old.status is distinct from 'pago' and coalesce(new.ref, '') like 'cupom-%')
  execute function public.esc_mp_cupom_anota();
