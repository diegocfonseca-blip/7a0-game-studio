-- ════════════════════════════════════════════════════════════════════════════
-- 📱✉️ 3ª CONTA NO MESMO APARELHO CONFIRMA O E-MAIL PRA CRIAR SALA (30/10, Diego: "Gostei disso.. Faz aí")
-- Mockup aprovado: scripts/mockups/confirmar-aparelho.png.
--
-- Por quê: medido em 30/10, aparelhos com 3+ contas (o pior com 26) criavam ~10% das salas — conta nova pra
-- burlar a sala grátis do dia. Confirmar e-mail de TODO MUNDO não cabe no Resend grátis (100/dia), então o código
-- vai só pra conta que é a 3ª+ do mesmo aparelho.
--
-- Regras:
--  • Só conta criada depois de `desde`; quem já tinha conta nunca vê nada. Quem paga plano também não.
--  • Aparelho = `esc_sid` do localStorage (o mesmo de site_visits/game_plays), registrado no login.
--  • Precisa confirmar quando o aparelho já tem `min_outros` contas criadas ANTES desta.
--  • Falha NOSSA (e-mail não saiu, limite do dia) = passe livre naquele dia (`esc_conf_passe`).
--  • Enquanto `ligado = false`, vale SÓ em aparelho onde a conta do Diego já entrou (teste), com mínimo 1.
-- Quem barra é o gatilho da sala (`esc_sala_por_dia`, erro CONFIRMA_EMAIL); a tela só explica e pede o código.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.esc_conf_cfg (
  id int primary key default 1 check (id = 1),
  ligado boolean not null default false,
  testador uuid,
  desde timestamptz not null default now(),
  min_outros int not null default 2,
  teto_dia int not null default 40          -- e-mails de código por dia (o resto da cota é da campanha)
);
insert into public.esc_conf_cfg (id, ligado, testador) values (1, false, '6b5cf422-d4ad-4c69-a7e6-da1125c85844')
  on conflict (id) do nothing;

create table if not exists public.esc_aparelho_contas (
  sid text not null, user_id uuid not null, visto timestamptz not null default now(),
  primary key (sid, user_id)
);
create index if not exists esc_aparelho_contas_user on public.esc_aparelho_contas (user_id);

create table if not exists public.esc_conf_ok (
  user_id uuid primary key, email text not null, em timestamptz not null default now()
);
create table if not exists public.esc_conf_cod (
  user_id uuid primary key, email text not null, cod text, criado timestamptz not null default now(),
  tentativas int not null default 0, envios_dia int not null default 0, dia date not null default current_date,
  pedido bigint
);
create table if not exists public.esc_conf_passe (
  user_id uuid not null, dia date not null, motivo text, primary key (user_id, dia)
);
alter table public.esc_conf_cfg enable row level security;
alter table public.esc_aparelho_contas enable row level security;
alter table public.esc_conf_ok enable row level security;
alter table public.esc_conf_cod enable row level security;
alter table public.esc_conf_passe enable row level security;
-- sem política: só as funções abaixo (security definer) mexem

-- 📱 o aparelho avisa quem entrou nele
create or replace function public.esc_aparelho_registra(p_sid text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or coalesce(p_sid, '') = '' or p_sid like 'nostore-%' then return; end if;
  insert into public.esc_aparelho_contas (sid, user_id) values (left(p_sid, 80), auth.uid())
    on conflict (sid, user_id) do update set visto = now();
end $$;

-- 🔎 esta conta precisa confirmar o e-mail pra criar sala?
create or replace function public.esc_conf_precisa(p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare cfg record; v_criado timestamptz; v_email text; v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
        v_min int; v_outros int;
begin
  select * into cfg from public.esc_conf_cfg where id = 1;
  if not found or (not cfg.ligado and cfg.testador is null) then return false; end if;
  select u.created_at, u.email into v_criado, v_email from auth.users u where u.id = p_uid;
  if v_criado is null or v_criado < cfg.desde then return false; end if;           -- conta antiga: nunca
  if exists (select 1 from public.esc_conf_ok where user_id = p_uid) then return false; end if;
  if exists (select 1 from public.esc_conf_passe where user_id = p_uid and dia = v_dia) then return false; end if;
  if coalesce((public.esc_direitos_de(v_email)->>'pago')::boolean, false) then return false; end if;
  -- aparelhos desta conta: os registrados + os das visitas/partidas dos últimos 30 dias
  with meus as (
    select sid from public.esc_aparelho_contas where user_id = p_uid
    union select session_id from public.site_visits where user_id = p_uid and created_at > now() - interval '30 days'
    union select session_id from public.game_plays where user_id = p_uid and created_at > now() - interval '30 days'
  ), outros as (
    select a.user_id from public.esc_aparelho_contas a join meus m on m.sid = a.sid where a.user_id <> p_uid
    union select g.user_id from public.game_plays g join meus m on m.sid = g.session_id
      where g.user_id is not null and g.user_id <> p_uid and g.created_at > now() - interval '30 days'
  )
  select count(*) filter (where u.created_at < v_criado),
         bool_or(o.user_id = cfg.testador)::int
    into v_outros, v_min
    from outros o join auth.users u on u.id = o.user_id;
  if not cfg.ligado then
    -- 🧪 teste: só no aparelho do Diego, e já a partir da 2ª conta
    if coalesce(v_min, 0) = 0 then return false; end if;
    return coalesce(v_outros, 0) >= 1;
  end if;
  return coalesce(v_outros, 0) >= cfg.min_outros;
end $$;

create or replace function public.esc_conf_status() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_email text; c record;
begin
  if auth.uid() is null then return jsonb_build_object('precisa', false); end if;
  select email into v_email from auth.users where id = auth.uid();
  select * into c from public.esc_conf_cod where user_id = auth.uid();
  return jsonb_build_object('precisa', public.esc_conf_precisa(auth.uid()), 'email', v_email,
    'enviado_para', case when c.cod is not null then c.email end);
end $$;

-- ✉️ manda o código (pro e-mail da conta, ou pra um e-mail NOVO que a pessoa digitou)
create or replace function public.esc_conf_enviar(p_email text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare cfg record; v_uid uuid := auth.uid(); v_conta text; v_para text; v_cod text; v_hoje int; chave text;
        c record; pedido bigint; v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'motivo', 'sem_login'); end if;
  if not public.esc_conf_precisa(v_uid) then return jsonb_build_object('ok', true, 'liberado', true); end if;
  select * into cfg from public.esc_conf_cfg where id = 1;
  select email into v_conta from auth.users where id = v_uid;
  v_para := lower(trim(coalesce(nullif(p_email, ''), v_conta)));
  if v_para !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' then return jsonb_build_object('ok', false, 'motivo', 'email_invalido'); end if;
  if v_para <> lower(v_conta) and exists (select 1 from auth.users where lower(email) = v_para) then
    return jsonb_build_object('ok', false, 'motivo', 'email_em_uso');
  end if;
  select * into c from public.esc_conf_cod where user_id = v_uid;
  if found and c.dia = v_dia and c.envios_dia >= 5 then
    return jsonb_build_object('ok', false, 'motivo', 'muitos_envios');
  end if;
  -- cota do dia esgotada = falha nossa: passe livre hoje
  select count(*) into v_hoje from public.esc_conf_cod where dia = v_dia and envios_dia > 0;
  select decrypted_secret into chave from vault.decrypted_secrets where name = 'RESEND_API_KEY';
  if v_hoje >= cfg.teto_dia or chave is null then
    insert into public.esc_conf_passe (user_id, dia, motivo) values (v_uid, v_dia, case when chave is null then 'sem_chave' else 'teto_dia' end)
      on conflict do nothing;
    return jsonb_build_object('ok', true, 'liberado', true);
  end if;
  v_cod := lpad((floor(random() * 1000000))::int::text, 6, '0');
  select net.http_post(
    url := 'https://api.resend.com/emails',
    body := jsonb_build_object(
      'from', 'Leilão Legends <contato@leilaolegends.com>',
      'to', jsonb_build_array(v_para),
      'subject', 'Seu código do Leilão Legends: ' || v_cod,
      'html', '<div style="font-family:Arial,sans-serif;background:#F4ECD6;padding:24px"><div style="max-width:420px;margin:auto;background:#fff;border:3px solid #000;border-radius:16px;padding:24px;text-align:center">'
        || '<h2 style="margin:0 0 8px">🔨 Leilão Legends</h2><p>Seu código pra confirmar o e-mail e criar sala:</p>'
        || '<p style="font-size:38px;font-weight:900;letter-spacing:8px;margin:12px 0">' || v_cod || '</p>'
        || '<p style="color:#555;font-size:13px">Your code to confirm your e-mail. Se não foi você, é só ignorar este e-mail.</p></div></div>'),
    headers := jsonb_build_object('Authorization', 'Bearer ' || chave, 'Content-Type', 'application/json')
  ) into pedido;
  insert into public.esc_conf_cod (user_id, email, cod, criado, tentativas, envios_dia, dia, pedido)
    values (v_uid, v_para, v_cod, now(), 0, 1, v_dia, pedido)
    on conflict (user_id) do update set email = excluded.email, cod = excluded.cod, criado = now(), tentativas = 0,
      envios_dia = case when public.esc_conf_cod.dia = v_dia then public.esc_conf_cod.envios_dia + 1 else 1 end,
      dia = v_dia, pedido = excluded.pedido;
  return jsonb_build_object('ok', true, 'enviado_para', v_para);
end $$;

-- 📬 o e-mail saiu mesmo? (o envio é assíncrono). Resend recusou = falha nossa = passe livre hoje.
create or replace function public.esc_conf_checa_envio() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c record; r record; v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select * into c from public.esc_conf_cod where user_id = auth.uid();
  if not found or c.pedido is null then return jsonb_build_object('estado', 'nada'); end if;
  select status_code, error_msg into r from net._http_response where id = c.pedido;
  if r is null then return jsonb_build_object('estado', 'esperando'); end if;
  if r.status_code between 200 and 299 then return jsonb_build_object('estado', 'ok'); end if;
  insert into public.esc_conf_passe (user_id, dia, motivo) values (auth.uid(), v_dia, 'resend_' || coalesce(r.status_code::text, 'erro'))
    on conflict do nothing;
  return jsonb_build_object('estado', 'liberado');
end $$;

-- ✅ confere o código. Se foi pra um e-mail NOVO, a conta passa a usar ele (time, cartas, tudo continua).
create or replace function public.esc_conf_verificar(p_cod text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c record; v_uid uuid := auth.uid(); v_conta text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'motivo', 'sem_login'); end if;
  select * into c from public.esc_conf_cod where user_id = v_uid;
  if not found or c.cod is null then return jsonb_build_object('ok', false, 'motivo', 'sem_codigo'); end if;
  if c.criado < now() - interval '30 minutes' then return jsonb_build_object('ok', false, 'motivo', 'expirou'); end if;
  if c.tentativas >= 5 then return jsonb_build_object('ok', false, 'motivo', 'muitas_tentativas'); end if;
  if trim(coalesce(p_cod, '')) <> c.cod then
    update public.esc_conf_cod set tentativas = tentativas + 1 where user_id = v_uid;
    return jsonb_build_object('ok', false, 'motivo', 'errado', 'restam', 4 - c.tentativas);
  end if;
  select email into v_conta from auth.users where id = v_uid;
  if lower(c.email) <> lower(v_conta) then
    if exists (select 1 from auth.users where lower(email) = lower(c.email) and id <> v_uid) then
      return jsonb_build_object('ok', false, 'motivo', 'email_em_uso');
    end if;
    update auth.users set email = c.email, email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = v_uid;
    update auth.identities set identity_data = identity_data || jsonb_build_object('email', c.email), updated_at = now()
      where user_id = v_uid and provider = 'email';
  end if;
  insert into public.esc_conf_ok (user_id, email) values (v_uid, c.email)
    on conflict (user_id) do update set email = excluded.email, em = now();
  update public.esc_conf_cod set cod = null where user_id = v_uid;
  return jsonb_build_object('ok', true, 'email', c.email, 'trocou', lower(c.email) <> lower(v_conta));
end $$;

grant execute on function public.esc_aparelho_registra(text) to authenticated;
grant execute on function public.esc_conf_status() to authenticated;
grant execute on function public.esc_conf_enviar(text) to authenticated;
grant execute on function public.esc_conf_checa_envio() to authenticated;
grant execute on function public.esc_conf_verificar(text) to authenticated;

-- 🏟️ o gatilho da sala: 1º o e-mail (só pra quem precisa), DEPOIS a regra da sala do dia de sempre
create or replace function public.esc_sala_por_dia() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_email text; v_dir jsonb; v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select u.email into v_email from auth.users u where u.id = new.host_id;
  v_dir := public.esc_direitos_de(v_email);
  if coalesce((v_dir->>'salas_pagas')::boolean, false) then return new; end if;
  if public.esc_conf_precisa(new.host_id) then
    raise exception 'CONFIRMA_EMAIL' using errcode = 'P0001', hint = 'Aparelho com outras contas: confirme o e-mail pra criar sala.';
  end if;
  insert into public.esc_salas_dia(user_id, dia) values (new.host_id, v_dia) on conflict do nothing;
  if not found then
    update public.esc_salas_extras set saldo = saldo - 1, atualizado_em = now() where email = lower(v_email) and saldo > 0;
    if not found then
      raise exception 'LIMITE_SALA_DIA' using errcode = 'P0001', hint = 'O gratuito cria 1 sala por dia; entrar em sala e sempre livre.';
    end if;
  end if;
  return new;
end $$;
