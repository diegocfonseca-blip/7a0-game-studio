// 📺⚡ TROCA 2D ↔ PLACAR RÁPIDO NAS COPAS COM RELÓGIO NO BANCO (05/11, Diego: *"quando eu falo todas as competições são TODAS"*).
// Copa do Mundo, Eurocopa e copas regionais da sala andam no relógio do BANCO (`esc_copa_preview_clock`/`esc_regional_clock`),
// que lê `game_rooms.game_state->>'campo2d'` no `next` (carimba a duração do passo: 1:30 no 2D) e no `finish`. Nenhum PLAY_* roda
// lá dentro, então a troca marcada pelo dono (`campo2dProximo`) não entraria nunca. Sem mexer no banco:
//  1. só o DONO, só com a bola PARADA (o relógio vai pedir o próximo passo), aplica a troca no estado (`VIRA_CAMPO2D`);
//  2. o save de sempre do dono (3 s) leva o `campo2d` novo pro `game_state`;
//  3. só quando o banco CONFIRMA o valor novo (leitura miúda de um campo só) o relógio chama o `next` — então o passo seguinte
//     já nasce com a duração certa, e o `finish` dele lê o mesmo valor. Nada muda no meio de um jogo.
//  4. Se o banco não confirmar em 12 s, segue assim mesmo: todo aparelho desenha o passo pela LINHA do relógio
//     (`doisDDoPasso`), então a sala continua igual pra todo mundo (no pior caso a troca entra num passo depois).
import { useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useEscTalvez } from './store'

const ESPERA_MAX_MS = 12_000
const LEITURA_A_CADA_MS = 900

/** devolve `pronto()`: true = pode chamar o `next` agora; false = ainda aplicando a troca (tenta de novo na próxima batida) */
export function usePreparaTroca2D(roomId: string, isHost: boolean): () => boolean {
  const ctx = useEscTalvez()
  const stRef = useRef(ctx?.state); stRef.current = ctx?.state
  const dispRef = useRef(ctx?.dispatch); dispRef.current = ctx?.dispatch
  const alvo = useRef<boolean | null>(null), desde = useRef(0), confirmado = useRef(false), lendo = useRef(false), ultimaLeitura = useRef(0)
  return useCallback(() => {
    const st = stRef.current
    if (!isHost || !st || st.onlineMode !== 'online' || !st.isHost) return true
    if (alvo.current === null) {
      const p = st.campo2dProximo
      if (p === undefined || p === !!st.campo2d) return true // nada marcado
      dispRef.current?.({ type: 'VIRA_CAMPO2D', by: st.youUid })
      alvo.current = p; desde.current = Date.now(); confirmado.current = false
      return false
    }
    if (confirmado.current || Date.now() - desde.current > ESPERA_MAX_MS) { alvo.current = null; confirmado.current = false; return true }
    if (!lendo.current && Date.now() - ultimaLeitura.current > LEITURA_A_CADA_MS) {
      lendo.current = true; ultimaLeitura.current = Date.now()
      const quer = alvo.current
      Promise.resolve(supabase.from('game_rooms').select('c2:game_state->campo2d').eq('id', roomId).maybeSingle())
        .then(({ data }) => { if (!!(data as { c2?: unknown } | null)?.c2 === quer) confirmado.current = true }, () => {})
        .finally(() => { lendo.current = false })
    }
    return false
  }, [roomId, isHost])
}
