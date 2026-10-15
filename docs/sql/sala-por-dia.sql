-- 🏟️ 1 SALA POR DIA NO GRÁTIS (Diego 14/10: "já faça valer a regra de criar sala apenas uma vez no dia a partir de agora,
-- com todos zerado"). APLICADO 14/10 ~00h30 (Brasília). Contagem começou zerada pra todo mundo.
-- Quem decide é o banco: gatilho antes de inserir em game_rooms. Quem tem `salas_pagas` (Craque/Lenda antigos, assinatura,
-- batismo, fundador, sócio em dia — `esc_direitos_de`) cria à vontade, como sempre (regra 13/10: planos novos não mexem
-- em quem já paga). Grátis: 1 por dia de Brasília. ENTRAR em sala nunca é limitado.
create table if not exists public.esc_salas_dia (user_id uuid not null, dia date not null, criado timestamptz not null default now(), primary key (user_id, dia));
alter table public.esc_salas_dia enable row level security; -- sem política: só o gatilho mexe
create or replace function public.esc_sala_por_dia() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_email text; v_dir jsonb; v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select u.email into v_email from auth.users u where u.id = new.host_id;
  v_dir := public.esc_direitos_de(v_email);
  if coalesce((v_dir->>'salas_pagas')::boolean, false) then return new; end if;
  insert into public.esc_salas_dia(user_id, dia) values (new.host_id, v_dia) on conflict do nothing;
  if not found then
    raise exception 'LIMITE_SALA_DIA' using errcode = 'P0001', hint = 'O gratuito cria 1 sala por dia; entrar em sala e sempre livre.';
  end if;
  return new;
end $$;
create trigger esc_sala_por_dia_trg before insert on public.game_rooms for each row execute function public.esc_sala_por_dia();
-- desligar (se precisar):  drop trigger esc_sala_por_dia_trg on public.game_rooms;
