-- 🛡️ ESCUDO DE CLÃ PERSONALIZADO NA LOJA (Diego 21/10: "valor 19,99… depois que a pessoa pagar ela manda WhatsApp pra mim pra eu
-- fazer… e ela bota nome do clã e ideia"; pronto em até 24 h). Produto 'escudo_cla' no Pix do Mercado Pago. Só o PRESIDENTE de um clã
-- compra. O nome e a ideia só aparecem DEPOIS do Pix confirmado (status vem do webhook) e o botão do zap leva tudo escrito.
--
-- 🩹 E UM CONSERTO QUE ESTAVA ESCONDIDO: as listas de produto aceitas pelas tabelas de pagamento tinham ficado pra trás.
--   · esc_mp_pedidos não aceitava 'peca_presidente' (o Pix da peça nem nascia);
--   · esc_pagamentos não aceitava giro/recado/ficha/temas/peça — o webhook quebraria NA HORA de registrar um Pix aprovado
--     desses produtos (o pagamento ficava sem liberar). Ninguém tinha pago nenhum deles ainda (conferido em 21/10).
alter table public.esc_mp_pedidos drop constraint if exists esc_mp_pedidos_produto_check;
alter table public.esc_mp_pedidos add constraint esc_mp_pedidos_produto_check check (produto = any (array[
  'craque','lenda','batismo','fundador','salas_extras','teste','moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000',
  'canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora','recado_hora','recado_dia',
  'peca_presidente','escudo_cla'])) not valid;
alter table public.esc_pagamentos drop constraint if exists esc_pagamentos_produto_check;
alter table public.esc_pagamentos add constraint esc_pagamentos_produto_check check (produto = any (array[
  'craque_mensal','batismo_lenda','batismo_plus','craque','lenda','salas_extras','teste','moedas_10','moedas_50','moedas_100',
  'moedas_500','moedas_1000','canto','presente','dia_marca','giro_dia','ficha_carreira','tema_coracao','tema_clube','giro_hora',
  'recado_hora','recado_dia','peca_presidente','escudo_cla'])) not valid;

-- o que a pessoa escreveu depois de pagar (o Diego desenha à mão e manda a arte pra entrar no jogo)
create table if not exists public.esc_cla_escudo_pedidos (
  pedido_id uuid primary key references public.esc_mp_pedidos(id),
  email text not null,
  cla_id bigint references public.esc_clas(id),
  nome_cla text not null check (char_length(nome_cla) between 2 and 30),
  ideia text not null check (char_length(ideia) between 5 and 300),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  pronto_em timestamptz
);
alter table public.esc_cla_escudo_pedidos enable row level security;

-- preço: só o presidente de um clã ativo pode comprar
create or replace function public.esc_cla_presidente_email(p_email text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from auth.users u join public.esc_clas c on c.lider = u.id and c.ativo
    where lower(u.email) = lower(p_email) and c.id = public.esc_cla_de(u.id))
$$;

create or replace function public.esc_mp_preco_ref(p_email text, p_produto text, p_ref text)
 returns numeric language plpgsql stable security definer set search_path = public as $$
declare pl text; rk int; alvo int; duplo boolean := coalesce(p_ref, '') ~ '^d-\d{1,12}$'; rid text;
begin
  if p_produto = 'escudo_cla' then return case when public.esc_cla_presidente_email(p_email) then 19.99 else null end; end if; -- 🛡️ 21/10
  if p_produto in ('moedas_10','moedas_50','moedas_100','moedas_500','moedas_1000') then return substring(p_produto from 8)::numeric; end if;
  if p_produto = 'dia_marca' then return 50.00; end if;
  if p_produto = 'peca_presidente' then return public.esc_preco_peca(p_email, p_ref); end if; -- 🧑‍💼 peça avulsa (19/10)
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

-- escrever (ou corrigir) nome + ideia: só com o Pix CONFIRMADO, só o dono do pedido
create or replace function public.esc_cla_escudo_escrever(p_id uuid, p_nome text, p_ideia text) returns text
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  n text := regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g'); i text := regexp_replace(btrim(coalesce(p_ideia, '')), '\s+', ' ', 'g');
begin
  if not exists (select 1 from public.esc_mp_pedidos where id = p_id and email = em and produto = 'escudo_cla' and status in ('pago', 'liberado')) then return 'sem_pedido'; end if;
  if char_length(n) < 2 or char_length(n) > 30 then return 'nome'; end if;
  if char_length(i) < 5 or char_length(i) > 300 then return 'ideia'; end if;
  insert into public.esc_cla_escudo_pedidos (pedido_id, email, cla_id, nome_cla, ideia)
    values (p_id, em, public.esc_cla_de(auth.uid()), n, i)
    on conflict (pedido_id) do update set nome_cla = excluded.nome_cla, ideia = excluded.ideia, atualizado_em = now();
  return 'ok';
end $$;

-- os escudos que eu paguei (a Loja mostra o campo/botão do zap de novo pra quem fechou a tela)
create or replace function public.esc_cla_escudo_meus() returns table(id uuid, nome text, ideia text, pronto boolean)
language sql stable security definer set search_path = public as $$
  select p.id, e.nome_cla, e.ideia, e.pronto_em is not null
  from public.esc_mp_pedidos p left join public.esc_cla_escudo_pedidos e on e.pedido_id = p.id
  where p.email = lower(coalesce(auth.jwt() ->> 'email', '')) and p.produto = 'escudo_cla' and p.status in ('pago', 'liberado')
  order by p.criado_em desc
$$;
grant execute on function public.esc_cla_escudo_escrever(uuid, text, text), public.esc_cla_escudo_meus() to authenticated;
