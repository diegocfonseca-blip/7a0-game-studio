-- 🔒 TRAVA NO SERVIDOR: modo PAGO de sala só nasce com o dono pagante (planos v2, 08/10).
-- Modos pagos: 🏆 Minhas Ligas ('liga') · 🎮 Carreira Online ('carreira') · 🃏 Bafo ('elenco').
-- Quem pode CRIAR: esc_direitos_de(...)->>'salas_pagas' = Craque ativo, batismo (antigo, Lenda ou Plus),
-- Craque/Lenda permanente antigo, fundador ou sócio em dia.
-- Quem ENTRA: qualquer conta (convidado não paga) — a trava olha só o dono, e só na criação.
--
-- ⚠️ NÃO APLICADO AINDA. Sobe junto com o código dos planos v2 (no mesmo dia da publicação), porque
-- antes disso não faz diferença e é melhor não mexer numa tabela quente sem necessidade.
-- Testado em transação desfeita: docs/sql/testa-planos-v2.sql (bloco "sala").
-- Desfazer: drop trigger game_rooms_exige_plano_ins on game_rooms; drop trigger game_rooms_exige_plano_upd on game_rooms;
--
-- ⚠️ SALA RÁPIDA CONTINUA GRÁTIS PRA CRIAR (ordem do Diego: não restringir nesta etapa). Pra mudar isso
-- um dia, é acrescentar o modo aqui E em LIMITES_SALA.modosPagos (planos.ts) — os dois juntos.
create or replace function public.esc_sala_exige_plano()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_modo text := new.game_state ->> 'mode';
  v_email text;
begin
  if v_modo is null or v_modo not in ('liga', 'carreira', 'elenco') then return new; end if;
  if tg_op = 'UPDATE' and (old.game_state ->> 'mode') is not distinct from v_modo then return new; end if;
  select lower(u.email) into v_email from auth.users u where u.id = new.host_id;
  if coalesce((public.esc_direitos_de(v_email) ->> 'salas_pagas')::boolean, false) then return new; end if;
  raise exception using
    errcode = '42501',
    message = 'Criar sala desse modo é do ⭐ Craque ou do 🖋 Batismo.',
    hint = 'Pra JOGAR não precisa pagar: entre pelo código de quem criou.';
end;
$$;

drop trigger if exists game_rooms_exige_plano_ins on public.game_rooms;
create trigger game_rooms_exige_plano_ins
  before insert on public.game_rooms
  for each row
  when ((new.game_state ->> 'mode') in ('liga', 'carreira', 'elenco'))
  execute function public.esc_sala_exige_plano();

drop trigger if exists game_rooms_exige_plano_upd on public.game_rooms;
create trigger game_rooms_exige_plano_upd
  before update of game_state on public.game_rooms
  for each row
  when ((new.game_state ->> 'mode') is distinct from (old.game_state ->> 'mode') and (new.game_state ->> 'mode') in ('liga', 'carreira', 'elenco'))
  execute function public.esc_sala_exige_plano();
