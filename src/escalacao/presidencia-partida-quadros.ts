// 🎞️ QUADROS POR SEGUNDO DO JOGO 3D (21/11, Diego: *"o jogo está muito travado… não flui"*, comparando com um jogo que roda a 61).
// Antes o jogo 3D ficava preso ao teto do NÍVEL do mapa: Leve = 30 (todo celular), Padrão = 45 (PC). 30 já parece arrastado, e 45
// numa tela de 60 anda em passo torto (um quadro dura 16 ms, o outro 33) — treme mesmo em máquina boa. Agora, com a cidade fora da
// cena durante a partida, o jogo TENTA 60. Se o aparelho não segura (média acima de ~21 ms por quadro depois de 2 s de bola
// rolando), trava em 30 até o fim daquela partida: 30 firme é melhor que 60 engasgando, e não fica trocando no meio do jogo.
// Só mexe em QUANTOS quadros são desenhados — o relógio e o resultado da partida não passam por aqui.
export const QUADROS_ALTO = 60, QUADROS_FIRME = 30
/** quantos quadros de amostra antes de decidir, e a média de intervalo (ms) a partir da qual 60 não está segurando */
export const RITMO_AMOSTRAS = 120, RITMO_LIMITE_MS = 21

export function criaRitmoPartida() {
  let alvo = QUADROS_ALTO, n = 0, media = 0, ult = 0, chave = ''
  return {
    /** o teto de quadros pra esta partida, agora */
    alvo: (teto = QUADROS_ALTO) => Math.min(alvo, teto),
    /** chame a cada quadro DESENHADO da partida (now = performance.now()); `id` = a partida — trocou de jogo, começa do zero */
    observa(now: number, id: string) {
      if (id !== chave) { chave = id; alvo = QUADROS_ALTO; n = 0; media = 0; ult = 0 }
      const gap = ult ? now - ult : 0
      ult = now
      if (gap <= 0 || gap > 1000) return // 1º quadro, aba escondida, pausa: não é ritmo de jogo
      n++
      media = n === 1 ? gap : media * 0.95 + gap * 0.05
      if (alvo === QUADROS_ALTO && n >= RITMO_AMOSTRAS && media > RITMO_LIMITE_MS) alvo = QUADROS_FIRME
    },
    inspect: () => ({ alvo, amostras: n, media }),
  }
}
