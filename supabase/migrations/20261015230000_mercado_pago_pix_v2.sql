-- 💳 MERCADO PAGO · PIX ÚNICO, parte 2 (15/10). Diego: telefone OPCIONAL (só e-mail e telefone, nada de CPF/nome), o Pix
-- vale 24h, "você tem um Pix esperando" quando a pessoa volta, e depois de pagar Batismo/Fundador ela conta POR ESCRITO
-- como imagina o clube (*"eu não quero que mandem imagem… eu que quero fazer as artes"*).
-- Liberação: o que é automático entra sozinho (Craque, Lenda, salas extras e tudo do Lenda no Batismo/Fundador); o
-- personalizado (escudo, mascote, manto, canto, gala) continua com o Diego — `esc_mp_entregar` nunca mexe nisso.
alter table public.esc_mp_pedidos add column if not exists telefone text;
alter table public.esc_mp_pedidos add column if not exists qr_code text;
alter table public.esc_mp_pedidos add column if not exists qr_base64 text;
alter table public.esc_mp_pedidos add column if not exists expira_em timestamptz;
alter table public.esc_mp_pedidos add column if not exists briefing jsonb;
alter table public.esc_mp_pedidos add column if not exists briefing_em timestamptz;

-- (a versão de 2 argumentos ficou no banco, sem uso; o `drop` travou no MCP e não faz falta)
create or replace function public.esc_mp_criar_pedido(p_email text, p_produto text, p_telefone text)
returns table (pedido_id uuid, valor numeric) language plpgsql security definer set search_path = public as $$
declare v numeric; e text := lower(trim(p_email)); tel text := nullif(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), '');
begin
  if not exists (select 1 from auth.users u where lower(u.email) = e) then raise exception 'SEM_CONTA'; end if;
  v := public.esc_mp_preco(e, p_produto);
  if v is null then raise exception 'JA_TEM_OU_INVALIDO'; end if;
  if tel is not null and (length(tel) < 10 or length(tel) > 13) then tel := null; end if;
  return query insert into public.esc_mp_pedidos (email, produto, valor, telefone) values (e, p_produto, v, tel) returning id, esc_mp_pedidos.valor;
end $$;
revoke all on function public.esc_mp_criar_pedido(text, text, text) from public, anon, authenticated;

create or replace function public.esc_mp_anota_pix(p_pedido uuid, p_mp_id text, p_mp_status text, p_qr text, p_qr64 text, p_expira timestamptz)
returns void language sql security definer set search_path = public as $$
  update public.esc_mp_pedidos set mp_payment_id = p_mp_id, mp_status = p_mp_status, qr_code = p_qr, qr_base64 = p_qr64, expira_em = p_expira
  where id = p_pedido and mp_payment_id is null;
$$;
revoke all on function public.esc_mp_anota_pix(uuid, text, text, text, text, timestamptz) from public, anon, authenticated;

-- ⏳ "você tem um Pix esperando": o último Pix ainda válido daquele produto, com o MESMO preço de agora
create or replace function public.esc_mp_meu_pendente(p_produto text)
returns table (pedido_id uuid, valor numeric, qr_code text, qr_base64 text, expira_em timestamptz)
language sql stable security definer set search_path = public as $$
  select id, p.valor, p.qr_code, p.qr_base64, p.expira_em from public.esc_mp_pedidos p
  where p.email = lower(coalesce(auth.jwt() ->> 'email', '')) and p.produto = p_produto and p.status = 'criado'
    and p.qr_code is not null and p.expira_em > now() + interval '2 minutes'
    and p.valor = public.esc_mp_preco(p.email, p_produto)
  order by p.criado_em desc limit 1;
$$;
revoke all on function public.esc_mp_meu_pendente(text) from public, anon;
grant execute on function public.esc_mp_meu_pendente(text) to authenticated;

-- (nome novo porque o retorno mudou; a `esc_mp_meu_pedido` antiga ficou sem uso)
create or replace function public.esc_mp_status_pedido(p_id uuid)
returns table (status text, produto text, valor numeric, briefing_em timestamptz) language sql stable security definer set search_path = public as $$
  select status, produto, valor, briefing_em from public.esc_mp_pedidos where id = p_id and email = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;
revoke all on function public.esc_mp_status_pedido(uuid) from public, anon;
grant execute on function public.esc_mp_status_pedido(uuid) to authenticated;

-- ✍️ depois de pagar: como a pessoa imagina o clube (só texto, só no pedido DELA, só se já pagou)
create or replace function public.esc_mp_briefing(p_id uuid, p_dados jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare k text; limpo jsonb := '{}'::jsonb;
begin
  for k in select unnest(array['clube','coracao','cores','escudo','mascote','canto','contato']) loop
    if p_dados ? k then limpo := limpo || jsonb_build_object(k, left(trim(p_dados ->> k), 600)); end if;
  end loop;
  update public.esc_mp_pedidos set briefing = limpo, briefing_em = now()
  where id = p_id and email = lower(coalesce(auth.jwt() ->> 'email', '')) and status in ('pago', 'liberado') and produto in ('batismo', 'fundador', 'teste');
  return found;
end $$;
revoke all on function public.esc_mp_briefing(uuid, jsonb) from public, anon;
grant execute on function public.esc_mp_briefing(uuid, jsonb) to authenticated;

-- ✅ Diego (15/10): o que dá pra liberar sozinho, libera sozinho
update public.esc_mp_config set auto_liberar = true, atualizado_em = now() where id;

-- 📲 15/10 (Diego: "o telefone não quero antes do Pix… tudo é depois"): o WhatsApp opcional é pedido DEPOIS de pagar
create or replace function public.esc_mp_telefone(p_id uuid, p_tel text)
returns boolean language plpgsql security definer set search_path = public as $$
declare tel text := nullif(regexp_replace(coalesce(p_tel, ''), '\D', '', 'g'), '');
begin
  if tel is null or length(tel) < 10 or length(tel) > 13 then return false; end if;
  update public.esc_mp_pedidos set telefone = tel
  where id = p_id and email = lower(coalesce(auth.jwt() ->> 'email', '')) and status in ('pago', 'liberado');
  return found;
end $$;
revoke all on function public.esc_mp_telefone(uuid, text) from public, anon;
grant execute on function public.esc_mp_telefone(uuid, text) to authenticated;
