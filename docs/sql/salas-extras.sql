-- 🎟️ SALAS EXTRAS DO DIA (14/10, Diego: "pode fazer sala extras do dia"). Pacote de 3 por R$ 4,90 na Loja, pra quem NÃO cria
-- à vontade (grátis e Craque novo). Paga no Pix + comprovante → o Diego credita no #admin (esc_admin_salas_extras_add).
-- O gatilho da sala do dia gasta 1 extra só quando a sala grátis do dia já foi usada. Extra não vence.
create table if not exists public.esc_salas_extras (email text primary key, saldo int not null default 0 check (saldo >= 0), atualizado_em timestamptz not null default now());
alter table public.esc_salas_extras enable row level security;

create or replace function public.esc_sala_por_dia() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_email text; v_dir jsonb; v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select u.email into v_email from auth.users u where u.id = new.host_id;
  v_dir := public.esc_direitos_de(v_email);
  if coalesce((v_dir->>'salas_pagas')::boolean, false) then return new; end if;
  insert into public.esc_salas_dia(user_id, dia) values (new.host_id, v_dia) on conflict do nothing;
  if not found then
    -- 🎟️ já usou a do dia: gasta uma sala extra, se tiver
    update public.esc_salas_extras set saldo = saldo - 1, atualizado_em = now() where email = lower(v_email) and saldo > 0;
    if not found then
      raise exception 'LIMITE_SALA_DIA' using errcode = 'P0001', hint = 'O gratuito cria 1 sala por dia; entrar em sala e sempre livre.';
    end if;
  end if;
  return new;
end $$;

create or replace function public.esc_minhas_salas_extras() returns int language sql stable security definer set search_path = public as $$
  select coalesce((select saldo from esc_salas_extras where email = lower(coalesce(auth.jwt()->>'email',''))), 0)
$$;
grant execute on function public.esc_minhas_salas_extras() to authenticated;

create or replace function public.esc_admin_salas_extras_add(p_email text, p_qtd int) returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if coalesce(auth.jwt()->>'email','') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  if p_qtd is null or p_qtd < 1 or p_qtd > 30 then raise exception 'QTD_INVALIDA'; end if;
  if not exists (select 1 from auth.users u where lower(u.email) = lower(trim(p_email))) then raise exception 'SEM_CONTA'; end if;
  insert into esc_salas_extras(email, saldo) values (lower(trim(p_email)), p_qtd)
    on conflict (email) do update set saldo = esc_salas_extras.saldo + p_qtd, atualizado_em = now()
    returning saldo into v;
  return v;
end $$;
grant execute on function public.esc_admin_salas_extras_add(text, int) to authenticated;
