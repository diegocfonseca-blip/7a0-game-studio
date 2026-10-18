-- 💬📣 RECADO EM DESTAQUE + ANÚNCIO DE 1 HORA (18/10, mockup `scripts/mockups/recado-destaque.png`, Diego: "ok pode fazer").
-- Recado de jogador: 1 h R$ 2,99 · dia todo R$ 9,90 — gira no MESMO letreiro do Anúncio do dia, em rosa, com o nome do time.
-- Anúncio de empresa ganha o 1 h por R$ 4,99 (o dia todo continua R$ 25, produto 'giro_dia').
-- Tudo ADITIVO: as funções antigas (esc_mp_anuncio_giro / esc_mp_anuncio_pendente) continuam pra quem estiver com o jogo velho aberto.

-- 1) produtos novos no pedido
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora','recado_hora','recado_dia'])) not valid;

-- 2) o letreiro ganha o tipo 'recado' e o nome de quem mandou
alter table public.esc_anuncios drop constraint if exists esc_anuncios_tipo_check;
alter table public.esc_anuncios add constraint esc_anuncios_tipo_check check (tipo in ('giro','marca','recado'));
alter table public.esc_anuncios add column if not exists autor text check (autor is null or char_length(autor) between 2 and 30);

-- 3) preços (o resto da função é a de 17-18/10, sem mudança)
create or replace function public.esc_mp_preco_ref(p_email text, p_produto text, p_ref text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare pl text; rk int; alvo int; duplo boolean := coalesce(p_ref, '') ~ '^d-\d{1,12}$'; rid text;
begin
  if p_produto in ('moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000') then return substring(p_produto from 8)::numeric; end if;
  if p_produto = 'dia_marca' then return 50.00; end if;
  if p_produto = 'giro_dia' then return 25.00; end if;
  if p_produto = 'giro_hora' then return 4.99; end if;   -- 📣 anúncio de empresa, 1 hora (18/10)
  if p_produto = 'recado_hora' then return 2.99; end if; -- 💬 recado de jogador, 1 hora (18/10)
  if p_produto = 'recado_dia' then return 9.90; end if;  -- 💬 recado de jogador, dia todo (18/10)
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
    return 9.90;
  end if;
  if p_produto = 'tema_clube' then
    if coalesce(public.esc_plano_rank(p_email), 0) < 3 then return null; end if;
    return 9.90;
  end if;
  return public.esc_mp_preco(p_email, p_produto);
end $$;

-- 4) escrever e pôr no ar (os 4 produtos). Só com o Pix CONFIRMADO (status vem do webhook). Recado: sem link e sem palavrão.
create or replace function public.esc_mp_anuncio_escrever(p_id uuid, p_texto text, p_autor text)
returns text language plpgsql security definer set search_path = public as $$
declare t text := regexp_replace(trim(coalesce(p_texto, '')), '\s+', ' ', 'g');
  a text := nullif(regexp_replace(trim(coalesce(p_autor, '')), '\s+', ' ', 'g'), '');
  prod text; recado boolean; maxlen int; dur interval;
begin
  select produto into prod from public.esc_mp_pedidos where id = p_id and email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and produto in ('giro_dia','giro_hora','recado_hora','recado_dia') and status in ('pago', 'liberado');
  if prod is null then return 'sem_pedido'; end if;
  recado := prod like 'recado%';
  maxlen := case when recado then 60 else 82 end;
  dur := case when prod in ('giro_dia','recado_dia') then interval '24 hours' else interval '1 hour' end;
  if char_length(t) < 4 then return 'curto'; end if;
  if char_length(t) > maxlen then return 'longo'; end if;
  if recado then
    if a is null or char_length(a) < 2 then return 'sem_time'; end if;
    a := left(a, 30);
    if t ~* '(https?://|www\.|\.com|\.br\M|\.net|wa\.me)' then return 'link'; end if;
    if t ~* '\m(porra|caralh|puta|merda|buceta|viad|fdp|vsf|arromb|cuz[aã]o|desgra[cç]|piroc|xoxot)' then return 'palavrao'; end if;
  end if;
  if exists (select 1 from public.esc_anuncios where pedido_id = p_id) then return 'ja_tem'; end if;
  insert into public.esc_anuncios (tipo, texto, emoji, inicio, fim, pedido_id, autor)
    values (case when recado then 'recado' else 'giro' end, t, case when recado then '💬' else '📣' end, now(), now() + dur, p_id, case when recado then a end);
  update public.esc_mp_pedidos set status = 'liberado', liberado_por = 'anuncio' where id = p_id and status = 'pago';
  return 'ok';
end $$;
revoke all on function public.esc_mp_anuncio_escrever(uuid, text, text) from public, anon;
grant execute on function public.esc_mp_anuncio_escrever(uuid, text, text) to authenticated;

-- 5) quem pagou e fechou a tela antes de escrever: a Loja mostra o campo de novo (agora dizendo QUAL produto é)
create or replace function public.esc_mp_anuncio_pendentes2()
returns table(id uuid, produto text) language sql stable security definer set search_path = public as $$
  select p.id, p.produto from public.esc_mp_pedidos p
  where p.email = lower(coalesce(auth.jwt() ->> 'email', '')) and p.produto in ('giro_dia','giro_hora','recado_hora','recado_dia')
    and p.status in ('pago', 'liberado') and not exists (select 1 from public.esc_anuncios a where a.pedido_id = p.id)
  order by p.criado_em
$$;
revoke all on function public.esc_mp_anuncio_pendentes2() from public, anon;
grant execute on function public.esc_mp_anuncio_pendentes2() to authenticated;
