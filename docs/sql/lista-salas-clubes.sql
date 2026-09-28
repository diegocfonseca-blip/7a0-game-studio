-- ─── 🧱 O SELO "CLUBES" NA LISTA DE SALAS ABERTAS (28/09/2026) ─────────────
--
-- Diego: *"tem selo pra quem joga escolher a sala? tipo jogador ou clubes?"*.
-- Mesmo caminho do selo da Tocaia (`lista-salas-modo-pregao.sql`): a lista NÃO
-- baixa o `game_state`, então o dado precisa de coluna magra própria, preenchida
-- pelo gatilho.
--
-- ⚠️ ANTES DE RODAR: leia o corpo da função NO BANCO e confira que ele é igual ao
-- de baixo MENOS a linha do `ls_clubes`. Se outra sessão acrescentou coluna depois
-- de 20/09, edite em cima do que está lá (senão apaga a coluna dela):
--   select pg_get_functiondef(p.oid) from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'game_rooms_colunas_magras';
--
-- 🛡️ Seguro com gente jogando (coluna nula = instantâneo; o código tem rede: sem a
-- coluna, a lista cai pra consulta com a Tocaia e segue de pé, só sem o 🧱).
-- ↩️ Desfazer: tirar a linha `ls_clubes` da função e `drop column ls_clubes`.

alter table public.game_rooms add column if not exists ls_clubes text;

create or replace function public.game_rooms_colunas_magras()
 returns trigger
 language plpgsql
as $function$
begin
  if tg_op = 'UPDATE' and new.game_state is not distinct from old.game_state then
    return new;
  end if;
  new.ls_tag    := new.game_state->>'__game';
  new.ls_name   := new.game_state->>'roomName';
  new.ls_deck   := new.game_state->>'deck';
  new.ls_varzea := new.game_state->>'varzea';
  new.ls_mode   := new.game_state->>'mode';
  new.ls_at     := new.game_state->>'ligaAt';
  new.ls_career := new.game_state->>'careerOnline';
  new.ls_manual := new.game_state->>'manual';
  new.ls_copa   := new.game_state->>'copaMode';
  new.ls_liga   := new.game_state->>'ligaFechada';
  new.ls_locked := new.game_state->>'locked';
  new.ls_stream := new.game_state->>'stream';
  new.ls_pw     := new.game_state->>'pwHash';
  new.ls_chat   := new.game_state->>'chatOff';
  new.ls_duplas := new.game_state->>'duplasMode';
  new.ls_holandes := new.game_state->>'holandes';   -- 🐊 20/09
  new.ls_clubes   := coalesce(new.game_state->>'clubes', new.game_state->>'leilaoClubes'); -- 🧱 28/09 (o 2º nome pega dono com versão velha, que apagava o 'clubes' no save)
  return new;
end $function$;

update public.game_rooms
   set ls_clubes = coalesce(game_state->>'clubes', game_state->>'leilaoClubes')
 where created_at > now() - interval '12 hours'
   and ls_clubes is distinct from coalesce(game_state->>'clubes', game_state->>'leilaoClubes');

notify pgrst, 'reload schema';

select count(*) as salas, count(*) filter (where ls_clubes = 'true') as clubes
  from public.game_rooms where created_at > now() - interval '6 hours';

-- ✅ RODADO EM 28/09/2026 (~22h40). Na 1ª versão só lia 'clubes'; 4 salas de dono com versão velha
--    ficaram sem selo, aí entrou o `leilaoClubes` de reserva. Resultado: 17 salas de Clubes nas últimas 12h.
