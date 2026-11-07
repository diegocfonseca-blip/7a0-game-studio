// ⏱️ 07/11 — ENTRAR NO MINUTO CERTO (sala online). O dono carimba a hora em que a rodada começou (`rodadaEm`); quem abre a tela
// com o jogo já rolando começa dali, em vez do 0' (e de ser cortado no meio quando a próxima rodada chega). Duas guardas:
// (1) quem está ACOMPANHANDO a sala (viu a rodada anterior começar aqui mesmo) segue o relógio dele de sempre — assim o relógio
// de um celular adiantado nunca faz a sala inteira pular minutos; (2) só vale entre 3 s e o fim do jogo.
let rodadaVistaAqui: { rk: number; em: number } | null = null
export function minutoAtrasado(rk: number, inicioEm: number | undefined, dur: number, agora = Date.now()): number {
  if (inicioEm == null) return 0 // só a liga online passa a hora — copa/carreira nem tocam neste relógio
  const acompanhando = !!rodadaVistaAqui && rodadaVistaAqui.rk === rk - 1 && agora - rodadaVistaAqui.em < dur * 3
  const mesma = !!rodadaVistaAqui && rodadaVistaAqui.rk === rk
  if (!mesma) rodadaVistaAqui = { rk, em: agora }
  if (acompanhando) return 0
  const passou = agora - inicioEm
  if (!(passou > 3000 && passou < dur)) return 0
  return Math.min(92, (passou / dur) * 93)
}
/** só pra trava: zera a memória de rodada vista */
export function _zeraRelogioSala() { rodadaVistaAqui = null }
