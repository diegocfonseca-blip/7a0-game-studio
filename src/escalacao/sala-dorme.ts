// 💤 SALA DORME NA TELA DE FIM (10/11, Diego: *"ok pode ser mas deixe com 20 min"*).
// Achado do vigia do servidor: sala que acabou e ficou aberta na tela de fim (BHZBJB ficou 14 h; KKXFY2) continua perguntando ao
// banco a cada 3 s (quem está na sala, quem é o dono) e o dono continua gravando o batimento a cada 3 s — a noite inteira, à toa.
// Regra: na tela de FIM, 20 min sem NADA acontecer (nenhum toque, nenhuma tecla, nenhuma mudança na partida) = o aparelho para de
// perguntar/gravar. Qualquer toque, tecla, voltar pra aba ou mudança na partida acorda na hora (e quem acorda pede o estado).
// Fora da tela de fim NUNCA dorme — leilão, jogo e Copa seguem como sempre.
export const DORME_MS = 20 * 60_000

let ultimoMovimento = Date.now()
let telaFim = false
const ouvintes = new Set<() => void>()

/** a sala está dormindo agora? (só na tela de fim, depois de 20 min parada) */
export function salaDormindo(): boolean {
  return telaFim && Date.now() - ultimoMovimento > DORME_MS
}
/** algo aconteceu: zera o relógio e, se estava dormindo, acorda quem estava esperando */
export function marcaMovimento(): void {
  const dormia = salaDormindo()
  ultimoMovimento = Date.now()
  if (dormia) ouvintes.forEach(fn => { try { fn() } catch { /* ignora */ } })
}
export function marcaTela(screen: string | undefined): void {
  const fim = screen === 'end'
  if (fim !== telaFim) ultimoMovimento = Date.now() // trocou de tela = movimento
  telaFim = fim
}
export function aoAcordar(fn: () => void): () => void {
  ouvintes.add(fn)
  return () => { ouvintes.delete(fn) }
}

if (typeof window !== 'undefined') {
  const mexeu = () => marcaMovimento()
  try {
    window.addEventListener('pointerdown', mexeu, { passive: true })
    window.addEventListener('keydown', mexeu)
    window.addEventListener('wheel', mexeu, { passive: true })
    document.addEventListener('visibilitychange', () => { if (!document.hidden) marcaMovimento() })
  } catch { /* sem janela (teste/servidor): não dorme nunca */ }
}
