// 🌤️ CLIMA DO JOGO NO CAMPO 2D (20/10). Diego: *"chuva, sol, sombras também tem que ter — às vezes sim, às vezes não; chuva é
// mais raro"*. Sorteio PRESO na semente do jogo (a mesma das chances), então toda a sala vê o mesmo céu. Sem Math.random.
//   ☀️ sol (com a sombra da arquibancada atravessando o gramado) · ☁️ nublado (luz chapada, sem sombra) · 🌧️ chuva (rara)
// No motor v2 a chuva pesa de leve: a bola rasteira corre mais e o domínio erra mais (`Motor2.clima`). No v1 é só o visual.
export type Clima = 'sol' | 'nublado' | 'chuva'
export const CHANCE_CHUVA = 0.12, CHANCE_NUBLADO = 0.28
export function climaDoJogo(seed: number): Clima {
  let s = (seed ^ 0x5EED) | 0
  s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return r < CHANCE_CHUVA ? 'chuva' : r < CHANCE_CHUVA + CHANCE_NUBLADO ? 'nublado' : 'sol'
}

// 🌙 JOGO DE NOITE (21/10, Diego: *"jogo de noite com refletores de vez em quando, igual o clima"*). Preso na semente (outra
// pitada, pra não andar junto com a chuva): 3 em cada 10 jogos acendem os refletores. Só visual — o motor não muda.
export const CHANCE_NOITE = 0.3
export function noiteDoJogo(seed: number): boolean {
  let s = (seed ^ 0x40C7E) | 0
  s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296 < CHANCE_NOITE
}
