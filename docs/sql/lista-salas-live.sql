-- ─── 🔴 O LINK DA LIVE NA LISTA DE SALAS ABERTAS (05/10/2026) ──────────────
--
-- Diego: *"nessa área da sala, pra quem é streamer, com link… tem que ser streamer
-- que tá rolando ao vivo mesmo, e com link do ao vivo"*. O dono cola o link na
-- criação (só com o Modo Stream ligado); a sala aparece em destaque na lista com o
-- botão "Assistir live". O link MORA na sala: acabou/sumiu a sala, some junto.
-- Mesmo caminho do selo 🧱 (`lista-salas-clubes.sql`): coluna magra preenchida pelo
-- gatilho, porque a lista não baixa o `game_state`.
--
-- ⚠️ ANTES DE RODAR: conferir que o corpo da função no banco é igual ao de baixo
-- MENOS a linha do `ls_live` (outra sessão pode ter acrescentado coluna):
--   select pg_get_functiondef(p.oid) from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'game_rooms_colunas_magras';
--
-- 🛡️ Seguro com gente jogando (coluna nula = instantâneo; sem a coluna, a lista cai
-- pro formato com 🧱 e segue de pé, só sem o destaque).
-- ↩️ Desfazer: tirar a linha `ls_live` da função e `drop column ls_live`.

alter table public.game_rooms add column if not exists ls_live text;

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
  new.ls_holandes := new.game_state->>'holandes';
  new.ls_clubes   := coalesce(new.game_state->>'clubes', new.game_state->>'leilaoClubes');
  new.ls_live     := new.game_state->>'liveUrl';   -- 🔴 05/10
  return new;
end $function$;

notify pgrst, 'reload schema';

-- ✅ RODADO EM 05/10/2026 pela sessão do Claude (apply_migration `lista_salas_live`).
