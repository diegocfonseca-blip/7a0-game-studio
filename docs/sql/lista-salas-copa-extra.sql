-- ─── 🏟️ A COPA EXTRA DA SALA NA LISTA (12/10/2026) ───────────────────────────
--
-- Diego: *"criei uma sala do Rio SP e apareceu só Liga… era pra dar Liga + Rio SP ou liga + Copa do
-- Nordeste ou liga + Copa Sul Minas"*. A lista de salas não baixa o `game_state` — lê colunas magras
-- preenchidas pelo gatilho. Estadual (`regionalNaLiga`) e Copa do Mundo depois da liga (`mundoNaLiga`)
-- não tinham coluna, então a sala aparecia como "só liga" (copaMode = 'liga').
-- `ls_copa2` = id do estadual ('riosp' · 'sulminas' · 'nordeste') ou 'mundo'.
--
-- 🛡️ Seguro com gente jogando (coluna nula = instantâneo; sem a coluna, a lista cai pro degrau de baixo).
-- ↩️ Desfazer: tirar a linha `ls_copa2` da função e `drop column ls_copa2`.
alter table public.game_rooms add column if not exists ls_copa2 text;

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
  new.ls_live     := new.game_state->>'liveUrl';
  new.ls_copa2    := coalesce(new.game_state->>'regionalNaLiga', case when new.game_state->>'mundoNaLiga' = 'true' then 'mundo' end); -- 🏟️ 12/10
  return new;
end $function$;

notify pgrst, 'reload schema';

-- ✅ RODADO EM 12/10/2026 pela sessão do Claude (em 2 pedaços: coluna, depois a função). Conferido: salas
-- com estadual e com Copa do Mundo já gravam ls_copa2 ('riosp' / 'mundo').
