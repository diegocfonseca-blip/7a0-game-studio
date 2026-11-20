-- 🌴 19/11: sala Vice City grava ls_pregao = 'vice' (selo VICE CITY na lista de salas, no lugar do 🔨 PREGÃO ABERTO).
-- Aparelho velho lê 'vice' como "nem pregão nem envelope único" → fica sem selo de lance (não quebra nada).
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
  new.ls_pregao   := case when 'true' in (new.game_state->>'vice', new.game_state->>'viceCity') then 'vice' -- 🌴 19/11 Vice City (sala de espera grava 'vice'; partida rolando grava 'viceCity')
                          when new.game_state->>'envUnico' = 'true' then 'unico' else new.game_state->>'pregaoAberto' end; -- 🔨 17/10 pregão aberto · ⚡ 28/10 envelope único
  new.ls_clubes   := case when coalesce(new.game_state->>'clubes', new.game_state->>'leilaoClubes') = 'true' then
                       case when new.game_state->>'pacSelecao' = 'true' and new.game_state->>'pacDecada' = 'true' then 'selecao_decada'
                            when new.game_state->>'pacSelecao' = 'true' then 'selecao'
                            when new.game_state->>'pacDecada' = 'true' then 'decada'
                            else 'true' end
                     else coalesce(new.game_state->>'clubes', new.game_state->>'leilaoClubes') end; -- 🏳️🕰️ 01/11 Seleções / Por década
  new.ls_live     := new.game_state->>'liveUrl';
  new.ls_copa2    := coalesce(new.game_state->>'regionalNaLiga', case
                       when new.game_state->>'mundoNaLiga' = 'true' and new.game_state->>'euroNaLiga' = '16' then 'america' -- 🌎 19/11 Copa América
                       when new.game_state->>'mundoNaLiga' = 'true' and coalesce(new.game_state->>'euroNaLiga', '') not in ('', 'null') then 'euro'
                       when new.game_state->>'mundoNaLiga' = 'true' then 'mundo' end); -- 🇪🇺 01/11 Eurocopa
  new.ls_draft    := new.game_state->>'ligaDraft'; -- 📋 19/10: Liga Draft some da lista de salas
  return new;
end $function$;
