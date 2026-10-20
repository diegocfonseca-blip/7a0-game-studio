// ⚙️ MOTOR 2D v2 — (D) física simplificada e contas EXATAS.
// 🎲 DETERMINISMO (online): só + − × ÷ √, min/max/floor e o sorteio próprio. NADA de Math.sin/cos/exp/log/pow/hypot/atan2
// aqui nem nas decisões — esses variam de navegador pra navegador, e dois aparelhos da mesma sala veriam jogos diferentes.
// A trava `npm run motor2` procura essas funções nos arquivos do motor e reprova se achar.
export const W = 68, L = 105
export const DT = 1 / 20 // passo fixo da simulação (o desenho interpola a 60 quadros/s)
export const DECISAO = 0.25 // cada jogador reavalia a cada 0,25 s de jogo (referência: FM21)
export const SEG_POR_MIN = 90 / 93 // igual ao v1: 93' em 90 s de tela
export const G = 9.8
export const GOL_MEIO = 3.66, TRAVESSAO = 2.44, AREA_PROF = 16.5, AREA_LARG = 20.16

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const len = (x: number, y: number) => Math.sqrt(x * x + y * y)
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => len(a.x - b.x, a.y - b.y)

/** sorteio próprio (mulberry32) — igual em todo aparelho */
export function sorteio(seed: number) {
  let s = seed | 0
  const r = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  /** ~normal(0,1) sem log/sin: soma de 4 uniformes */
  const n = () => (r() + r() + r() + r() - 2) * 1.732
  return { r, n }
}

/** distância de p até o segmento a→b, e onde (0–1) cai a projeção */
export function aoSegmento(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): { q: number; s: number } {
  const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy
  const s = d2 > 1e-6 ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / d2, 0, 1) : 0
  return { q: len(p.x - (a.x + dx * s), p.y - (a.y + dy * s)), s }
}

// ── a bola no chão freia; no ar quase não ────────────────────────────────────────────────────────────────────────────
export const ATRITO_CHAO = 2.3 // m/s² (grama + "compressão" do jogo em 90 s)
export const ATRITO_AR = 0.12 // por segundo, proporcional
/** velocidade inicial pra uma bola rasteira percorrer `d` m e chegar com `vFim` m/s */
export const vRasteira = (d: number, vFim: number) => Math.sqrt(vFim * vFim + 2 * ATRITO_CHAO * d)
/** onde a bola rasteira para (sem ninguém no caminho) */
export function pontoParada(b: { x: number; y: number; vx: number; vy: number }) {
  const v = len(b.vx, b.vy)
  if (v < 0.05) return { x: b.x, y: b.y }
  const d = (v * v) / (2 * ATRITO_CHAO)
  return { x: b.x + (b.vx / v) * d, y: b.y + (b.vy / v) * d }
}

/** frente: distância até a linha de fundo que `lado` ATACA (o mandante, 0, ataca y = 0) */
export const frente = (lado: 0 | 1, y: number) => (lado === 0 ? y : L - y)
/** fundo: distância até o PRÓPRIO gol */
export const fundo = (lado: 0 | 1, y: number) => (lado === 0 ? L - y : y)
/** y absoluto a partir da distância do PRÓPRIO gol */
export const yDe = (lado: 0 | 1, prof: number) => (lado === 0 ? L - prof : prof)
/** a linha de fundo que `lado` ataca */
export const linhaAtaque = (lado: 0 | 1) => (lado === 0 ? 0 : L)

/** quanto vale ter a bola em (x,y) pra quem ataca `lado` (0–0,34): perto do gol e pelo meio vale mais (ideia do xT) */
export function valor(lado: 0 | 1, x: number, y: number): number {
  const f = clamp(frente(lado, y), 0, L) / L, c = 1 - clamp((x < 34 ? 34 - x : x - 34) / 34, 0, 1)
  const perto = 1 - f
  // (mesma régua do xG: ~chance de a posse virar gol dali — perto do gol e pelo meio ~0,3; no próprio campo quase 0)
  let v = 0.3 * perto * perto * (0.55 + 0.45 * c)
  if (f * L < AREA_PROF && (x < 34 ? 34 - x : x - 34) < AREA_LARG) v += 0.04
  return v
}

/** chance de gol de um chute de (x,y) — distância e ângulo; pressão tira */
export function xgDe(lado: 0 | 1, x: number, y: number, pressao: number, cabeca = false): number {
  const f = frente(lado, y), dx = x - 34, d = len(dx, f)
  if (f <= 0.2) return 0.02
  const base = 0.62 / (1 + (d * d) / 70)
  const ang = clamp(f / d, 0.12, 1)
  return clamp(base * ang * (1 - 0.45 * pressao) * (cabeca ? 0.7 : 1), 0.005, 0.8)
}
