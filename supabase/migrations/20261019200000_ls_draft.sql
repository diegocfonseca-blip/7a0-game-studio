-- 📋 LIGA DRAFT (19/10, só a conta do Diego): a sala NÃO aparece na lista de salas abertas (ordem dele: "ninguém pode ver").
-- A lista lê só as colunas magras `ls_*` (nunca o game_state), então ganha mais uma: `ls_draft`, preenchida pelo MESMO
-- gatilho. O resto da função é idêntico ao que já estava valendo.
alter table public.game_rooms add column if not exists ls_draft text;

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
  new.ls_pregao   := new.game_state->>'pregaoAberto'; -- 🔨 17/10: selo do pregão aberto na lista de salas
  new.ls_clubes   := coalesce(new.game_state->>'clubes', new.game_state->>'leilaoClubes');
  new.ls_live     := new.game_state->>'liveUrl';
  new.ls_copa2    := coalesce(new.game_state->>'regionalNaLiga', case when new.game_state->>'mundoNaLiga' = 'true' then 'mundo' end);
  new.ls_draft    := new.game_state->>'ligaDraft'; -- 📋 19/10: Liga Draft some da lista de salas
  return new;
end $function$;
