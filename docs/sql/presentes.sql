-- 🎁 DAR DE PRESENTE (14/10, Diego: "por agora só o presente, e presente apenas de plano").
-- Quem compra pede pelo jogo (esc_pedir_presente), paga no Pix e manda o comprovante. NADA é liberado nesse pedido:
-- quem entrega é o Diego, no #admin (esc_admin_presente_entregar), depois de ver o pagamento. Só então o amigo vê o
-- "FULANO TE DEU UM PRESENTE!" (esc_meus_presentes) ao entrar. Regra de segurança: conta do amigo tem que existir.
create table if not exists public.esc_presentes (
  id bigserial primary key,
  de_email text not null,
  de_nome text,
  para_email text not null,
  plano text not null check (plano in ('craque','lenda','batismo','fundador')),
  recado text check (char_length(recado) <= 140),
  status text not null default 'pedido' check (status in ('pedido','entregue','recusado')),
  criado_em timestamptz not null default now(),
  entregue_em timestamptz,
  visto_em timestamptz
);
alter table public.esc_presentes enable row level security; -- sem política: só as funções abaixo mexem

-- o plano que a pessoa tem hoje, de 0 (nada) a 4 (fundador) — mesma régua de `planoAtual` (planos-regras.ts)
create or replace function public.esc_plano_rank(p_email text) returns int language sql stable security definer set search_path = public as $$
  select case
    when d->>'batismo_plano' = 'plus' then 4
    when d->>'batismo_plano' is not null then 3
    when d->>'tier' = 'ouro' then 2
    when d->>'tier' = 'prata' then 1
    else 0 end
  from (select public.esc_direitos_de(p_email) as d) x
$$;

create or replace function public.esc_pedir_presente(p_para text, p_plano text, p_recado text, p_de_nome text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_de text := lower(coalesce(auth.jwt()->>'email','')); v_para text := lower(trim(coalesce(p_para,''))); v_id bigint;
  v_alvo int := case p_plano when 'craque' then 1 when 'lenda' then 2 when 'batismo' then 3 when 'fundador' then 4 else 0 end;
begin
  if v_de = '' then raise exception 'SEM_LOGIN'; end if;
  if v_alvo = 0 then raise exception 'PLANO_INVALIDO'; end if;
  if v_para !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'EMAIL_INVALIDO'; end if;
  if v_para = v_de then raise exception 'PRA_SI_MESMO'; end if;
  if not exists (select 1 from auth.users u where lower(u.email) = v_para) then raise exception 'SEM_CONTA'; end if;
  if public.esc_plano_rank(v_para) >= v_alvo then raise exception 'JA_TEM'; end if;
  if (select count(*) from esc_presentes where de_email = v_de and status = 'pedido') >= 5 then raise exception 'MUITOS_PEDIDOS'; end if;
  insert into esc_presentes(de_email, de_nome, para_email, plano, recado)
    values (v_de, left(nullif(trim(p_de_nome),''), 40), v_para, p_plano, left(nullif(trim(p_recado),''), 140))
    returning id into v_id;
  return v_id;
end $$;
grant execute on function public.esc_pedir_presente(text, text, text, text) to authenticated;

-- o amigo: presentes ENTREGUES que ele ainda não abriu
create or replace function public.esc_meus_presentes() returns table(id bigint, de_nome text, plano text, recado text)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(p.de_nome, split_part(p.de_email,'@',1)), p.plano, p.recado from esc_presentes p
  where p.para_email = lower(coalesce(auth.jwt()->>'email','')) and p.status = 'entregue' and p.visto_em is null
  order by p.entregue_em
$$;
grant execute on function public.esc_meus_presentes() to authenticated;
create or replace function public.esc_presente_visto(p_id bigint) returns void language sql security definer set search_path = public as $$
  update esc_presentes set visto_em = now() where id = p_id and para_email = lower(coalesce(auth.jwt()->>'email','')) and status = 'entregue'
$$;
grant execute on function public.esc_presente_visto(bigint) to authenticated;

-- 🔒 Diego
create or replace function public.esc_admin_presentes() returns table(id bigint, de_email text, para_email text, plano text, recado text, status text, criado_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(auth.jwt()->>'email','') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  return query select p.id, p.de_email, p.para_email, p.plano, p.recado, p.status, p.criado_em from esc_presentes p
    order by (p.status = 'pedido') desc, p.criado_em desc limit 200;
end $$;
grant execute on function public.esc_admin_presentes() to authenticated;

-- entrega: Craque/Lenda ligam o tier na hora (nunca rebaixam quem já tem mais); Batismo/Fundador só marcam entregue
-- (o clube o Diego monta pelo roteiro de batismo de sempre, falando com o amigo).
create or replace function public.esc_admin_presente_entregar(p_id bigint) returns text language plpgsql security definer set search_path = public as $$
declare r esc_presentes; v_alvo int;
begin
  if coalesce(auth.jwt()->>'email','') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  select * into r from esc_presentes where id = p_id for update;
  if r.id is null or r.status <> 'pedido' then raise exception 'NAO_PENDENTE'; end if;
  v_alvo := case r.plano when 'craque' then 1 when 'lenda' then 2 else 9 end;
  if v_alvo <= 2 and public.esc_plano_rank(r.para_email) < v_alvo then
    insert into user_colors(email, tier, manual, updated_at) values (r.para_email, case r.plano when 'craque' then 'prata' else 'ouro' end, true, now())
    on conflict (email) do update set tier = excluded.tier, manual = true, updated_at = now();
  end if;
  update esc_presentes set status = 'entregue', entregue_em = now() where id = p_id;
  return case when r.plano in ('craque','lenda') then 'tier ligado' else 'marcado — monte o batismo pelo roteiro' end;
end $$;
grant execute on function public.esc_admin_presente_entregar(bigint) to authenticated;
create or replace function public.esc_admin_presente_recusar(p_id bigint) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt()->>'email','') <> 'diego.c.fonseca@gmail.com' then raise exception 'not authorized'; end if;
  update esc_presentes set status = 'recusado' where id = p_id and status = 'pedido';
end $$;
grant execute on function public.esc_admin_presente_recusar(bigint) to authenticated;
