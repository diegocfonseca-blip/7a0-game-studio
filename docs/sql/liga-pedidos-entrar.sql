-- 🙋 06/11 — Entrar em Liga da Turma / Liga Draft JÁ COMEÇADA. Aplicado no banco em 06/11 (migrations esc_liga_pedidos + esc_liga_times).
-- Regras do Diego: só quem tem QUALQUER plano entra numa liga que já jogou; entrar em quantas quiser (pago); o dono aceita e escolhe
-- o time (bot, ou no lugar de alguém); a pessoa entra na virada da temporada (sala de espera da liga).
-- Peças:
--   esc_liga_pedidos (tabela, RLS ligada, sem política: só pelas funções abaixo)
--   esc_pago_uid(uid) · esc_liga_ja_jogou(gs)
--   esc_liga_pedir(room, nome) → ok | plano | ja | dono | login | erro
--   esc_liga_pedidos_dono(room) · esc_liga_responder(id, aceitar, bot, uid) · esc_liga_meus_pedidos() · esc_liga_marca_entrou(room, uids)
--   esc_liga_times(room) — os times da partida gravada (id, nome, humano, uid, pts), só pro dono
--   esc_liga_formato(room, tamanho 10|20, turno_unico) — só o dono, só com a liga parada; 20→10 = 'encolhe'
--   gatilho esc_liga_comecada_so_plano_trg (room_players, before insert): liga que já jogou só recebe conta NOVA com plano
--     (o dono e quem já está gravado na partida passam sempre). Erro: LIGA_SO_PLANO.
-- O texto completo das funções está nas migrations do projeto (list_migrations: esc_liga_pedidos, esc_liga_times).

-- ⚡ 06/11 (versão que ficou valendo): o formato grava a MESMA chave da sala (`turnoUnico`) e só ida só existe com 20 times.
CREATE OR REPLACE FUNCTION public.esc_liga_formato(p_room uuid, p_tamanho integer, p_turno_unico boolean)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare eu uuid := auth.uid(); r public.game_rooms%rowtype; atual int; gs jsonb;
begin
  if eu is null then return 'erro'; end if;
  select * into r from public.game_rooms where id = p_room;
  if not found or coalesce(r.game_state->>'mode','') <> 'liga' then return 'erro'; end if;
  if coalesce(r.liga_dono, r.host_id) <> eu then return 'dono'; end if;
  if r.status <> 'waiting' then return 'rolando'; end if;
  if p_tamanho not in (10, 20) then return 'erro'; end if;
  atual := case when r.game_state->>'tamanhoLiga' = '10' then 10 else 20 end;
  if p_tamanho < atual and esc_liga_ja_jogou(r.game_state) then return 'encolhe'; end if;
  gs := r.game_state - 'ligaTurnoUnico';
  gs := case when p_tamanho = 10 then gs || jsonb_build_object('tamanhoLiga', 10) else gs - 'tamanhoLiga' end;
  gs := case when p_turno_unico and p_tamanho = 20 then gs || jsonb_build_object('turnoUnico', true) else gs - 'turnoUnico' end;
  update public.game_rooms set game_state = gs, updated_at = now() where id = p_room;
  return 'ok';
end $function$;

-- 🙋 06/11 (Diego: "não gostei do convidado entrar direto na sala sem ter sido aceito"): aplicado no banco como migration
-- `esc_liga_comecada_so_aceito`. Liga que já jogou: gente nova só entra com plano E pedido ACEITO (status 'aceito'/'entrou');
-- senão o gatilho levanta LIGA_SO_ACEITO e o aparelho transforma em pedido. E `esc_liga_reabre` devolve 'meio' (= vira pedido)
-- pra quem não é da liga nem foi aceito, e na Liga Draft com o dono jogando AGORA só o dono reabre (o "fim" vem antes do draft —
-- foi assim que a sala do Futpoint virou "esperando" no meio do draft, com o Judas entrando pelo código).

-- 🚫 06/11 (noite): migration `esc_liga_reabre_nunca_reabre_liga_comecada` — liga que já jogou NUNCA volta pra sala de
-- espera (o dono sempre usa VOLTAR; gente nova vira pedido e entra na virada de dentro do jogo).

-- 📏📅 06/11 (noite): migration `esc_liga_formato_proxima_temporada` — tabela `esc_liga_formato_prox` (formato da PRÓXIMA
-- temporada de liga começada, aplicado pelo dono na virada de dentro do jogo), `esc_liga_formato` grava nela quando a liga já
-- jogou (20→10 = 'encolhe'), `esc_liga_formato_prox_ler(room)` e `esc_liga_fui_removido(room)` (aviso de removido pelo dono).
-- E `esc_liga_pedir` devolve 'aceito' pra quem já foi aceito (migration `esc_liga_pedir_avisa_aceito`).
