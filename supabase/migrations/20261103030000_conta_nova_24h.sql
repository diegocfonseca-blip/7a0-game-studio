-- 🕐 CONTA NOVA REPETIDA NO MESMO APARELHO ESPERA 24 H PRA CRIAR SALA (03/11, mockup scripts/mockups/conta-nova-24h.png;
-- Diego: "faz assim e publica, mas só pra quem joga no mesmo celular e faz nova conta").
-- Medido (12 dias): 337 contas criaram sala no 1º dia; 299 eram a PRIMEIRA conta do aparelho (gente nova de verdade, streamer)
-- e só 38 eram conta repetida. Então a espera vale só pra conta que NÃO é a primeira do aparelho:
--   • conta criada a partir de hoje (esc_conta_nova_cfg.desde) · com menos de 24 h · sem plano pago
--   • e o aparelho (esc_sid do navegador: esc_aparelho_contas + visitas/partidas dos últimos 30 dias) já tem OUTRA conta mais velha.
-- Entrar em sala continua livre. Pode antecipar: sala extra (3 por R$ 4,90 — gasta 1 aqui) ou ⭐ Craque Salas (salas_pagas).
create table if not exists public.esc_conta_nova_cfg (id int primary key default 1 check (id = 1), ligado boolean not null default true, desde timestamptz not null default now(), horas int not null default 24);
insert into public.esc_conta_nova_cfg (id) values (1) on conflict do nothing;
alter table public.esc_conta_nova_cfg enable row level security;

-- segundos que faltam pra esta conta poder criar sala grátis (0 = livre)
create or replace function public.esc_conta_nova_espera(p_uid uuid) returns int
language plpgsql stable security definer set search_path = '' as $$
declare cfg record; v_criado timestamptz; v_email text; v_fim timestamptz; v_outros int;
begin
  select * into cfg from public.esc_conta_nova_cfg where id = 1;
  if not found or not cfg.ligado then return 0; end if;
  select u.created_at, u.email into v_criado, v_email from auth.users u where u.id = p_uid;
  if v_criado is null or v_criado < cfg.desde then return 0; end if;
  v_fim := v_criado + make_interval(hours => cfg.horas);
  if v_fim <= now() then return 0; end if;
  if coalesce((public.esc_direitos_de(v_email)->>'pago')::boolean, false) then return 0; end if;
  with meus as (
    select sid from public.esc_aparelho_contas where user_id = p_uid
    union select session_id from public.site_visits where user_id = p_uid and created_at > now() - interval '30 days'
    union select session_id from public.game_plays where user_id = p_uid and created_at > now() - interval '30 days'
  ), outros as (
    select a.user_id from public.esc_aparelho_contas a join meus m on m.sid = a.sid where a.user_id <> p_uid
    union select g.user_id from public.game_plays g join meus m on m.sid = g.session_id
      where g.user_id is not null and g.user_id <> p_uid and g.created_at > now() - interval '30 days'
  )
  select count(*) into v_outros from outros o join auth.users u on u.id = o.user_id where u.created_at < v_criado;
  if coalesce(v_outros, 0) = 0 then return 0; end if;   -- 1ª conta do aparelho: cria na hora, como sempre
  return greatest(1, ceil(extract(epoch from (v_fim - now())))::int);
end $$;

-- pra tela mostrar a contagem (a minha conta)
create or replace function public.esc_conta_nova_minha_espera() returns int language sql stable security definer set search_path = '' as $$
  select case when auth.uid() is null then 0 else public.esc_conta_nova_espera(auth.uid()) end
$$;
grant execute on function public.esc_conta_nova_minha_espera() to authenticated;

create or replace function public.esc_sala_por_dia() returns trigger
language plpgsql security definer set search_path = '' as $function$
declare v_email text; v_dir jsonb; v_dia date := (now() at time zone 'America/Sao_Paulo')::date; v_espera int;
begin
  select u.email into v_email from auth.users u where u.id = new.host_id;
  v_dir := public.esc_direitos_de(v_email);
  if coalesce((v_dir->>'salas_pagas')::boolean, false) then return new; end if;
  -- 🕐 03/11: conta nova repetida no mesmo aparelho — espera 24 h ou usa sala extra
  v_espera := public.esc_conta_nova_espera(new.host_id);
  if v_espera > 0 then
    update public.esc_salas_extras set saldo = saldo - 1, atualizado_em = now() where email = lower(v_email) and saldo > 0;
    if found then return new; end if;
    raise exception 'CONTA_NOVA_24H' using errcode = 'P0001', hint = v_espera::text;
  end if;
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
end $function$;
