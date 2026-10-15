// ─── 👑 KINGS LEAGUE — o MOTOR PURO das regras (etapa 1, 15/10) ─────────────────────────────────────────────
//
// Conceito inteiro decidido com o Diego: `docs/conceito-kings-league.md` (regras da Kings League BRASIL).
// Este arquivo é só matemática: sem tela, sem banco, sem canal. A tela e o dono da sala vão chamar ESTAS funções —
// regra num lugar só (lição do "botão mudo": tela e motor nunca podem ter regras próprias pra mesma coisa).
// Trava: `npx tsx scripts/testa-kings.mjs`.
import type { Sector } from './types'

// ── campeonato ───────────────────────────────────────────────────────────────────────────────────────────────
export const KINGS_TIMES = 10                  // 10 times → 9 rodadas, todos contra todos 1×
export const KINGS_RODADAS = KINGS_TIMES - 1
/** ⚽ futebol 7: goleiro + 6 */
export const KINGS_FORMACAO: Record<Sector, number> = { GOL: 1, LAT: 0, ZAG: 2, MEI: 2, ATA: 2 }

export type ResultadoKings = 'vitoria' | 'vitoria_shootout' | 'derrota_shootout' | 'derrota'
/** pontos da Kings League Brasil: 3 · 2 · 1 · 0 */
export const PONTOS_KINGS: Record<ResultadoKings, number> = { vitoria: 3, vitoria_shootout: 2, derrota_shootout: 1, derrota: 0 }

export interface LinhaKings { id: number; nome: string; pts: number; j: number; v: number; vs: number; ds: number; d: number; gp: number; gc: number }

/** 📋 ordem da tabela: pontos → vitórias no tempo → saldo → gols pró → nome (estável) */
export function ordenaKings(t: LinhaKings[]): LinhaKings[] {
  return [...t].sort((a, b) => b.pts - a.pts || b.v - a.v || (b.gp - b.gc) - (a.gp - a.gc) || b.gp - a.gp || a.nome.localeCompare(b.nome))
}

/** soma um jogo na tabela (os dois lados) */
export function anotaJogoKings(t: LinhaKings[], p: PartidaKings): void {
  const a = t.find(x => x.id === p.idA), b = t.find(x => x.id === p.idB)
  if (!a || !b) return
  const lado = (l: LinhaKings, r: ResultadoKings, gp: number, gc: number) => {
    l.j++; l.pts += PONTOS_KINGS[r]; l.gp += gp; l.gc += gc
    if (r === 'vitoria') l.v++; else if (r === 'vitoria_shootout') l.vs++; else if (r === 'derrota_shootout') l.ds++; else l.d++
  }
  lado(a, p.resultadoA, p.golsA, p.golsB)
  lado(b, p.resultadoA === 'vitoria' ? 'derrota' : p.resultadoA === 'derrota' ? 'vitoria' : p.resultadoA === 'vitoria_shootout' ? 'derrota_shootout' : 'vitoria_shootout', p.golsB, p.golsA)
}

/** 🗓️ turno único, método do círculo: 10 times → 9 rodadas de 5 jogos, cada par se cruza UMA vez */
export function calendarioKings(ids: number[]): [number, number][][] {
  const n = ids.length % 2 ? [...ids, -1] : [...ids]
  const rodadas: [number, number][][] = []
  for (let r = 0; r < n.length - 1; r++) {
    const jogos: [number, number][] = []
    for (let i = 0; i < n.length / 2; i++) {
      const a = n[i], b = n[n.length - 1 - i]
      if (a !== -1 && b !== -1) jogos.push(r % 2 ? [b, a] : [a, b])
    }
    rodadas.push(jogos)
    n.splice(1, 0, n.pop()!) // gira tudo menos o primeiro
  }
  return rodadas
}

/** 🏆 mata-mata da Kings Brasil: 1º direto na SEMI · quartas 2×7, 3×6, 4×5 · semis: 1º × (4×5) e (2×7) × (3×6) */
export function chaveKings(classif: number[]): { semiDireto: number; quartas: [number, number][] } {
  const c = classif
  return { semiDireto: c[0], quartas: [[c[1], c[6]], [c[2], c[5]], [c[3], c[4]]] }
}
export function semisKings(semiDireto: number, vencQuartas: [number, number, number]): [number, number][] {
  // vencQuartas na ordem das quartas: [2×7, 3×6, 4×5]
  return [[semiDireto, vencQuartas[2]], [vencQuartas[0], vencQuartas[1]]]
}

// ── a partida ────────────────────────────────────────────────────────────────────────────────────────────────
export const MIN_DADO = 18            // 🎲 o dado: 2 ou 3 por time até o intervalo
export const MIN_INTERVALO = 20
export const MIN_BOLA = 38            // 🟡 dourada (empate) · 🔴 vermelha (alguém na frente)
export const MIN_FIM = 40
export const JANELA_CARTA: [number, number] = [21, 36]       // 🃏 carta só no 2º tempo
export const JANELA_PRESIDENTE: [number, number] = [5, 36]   // 🎩 pênalti do presidente
export const MIN_EFEITO = 4                                   // suspensão / gol em dobro duram 4 min

// ⏱️ ritmo (Diego: "mais demorado que todos, porque é difícil entender")
export const KINGS_MS_PARTIDA = 180_000   // ~3 min reais pros 40 min de jogo
export const KINGS_MS_BANNER = 7_000      // banner explicando a regra: jogo parado 6–8s
export const KINGS_MS_INTERVALO = 15_000
export const KINGS_MS_VESTIARIO = 20_000
export const KINGS_MS_DUELO = 6_000       // pênalti do presidente / cobrança do shootout: escolha de canto

export type CartaKings = 'penalti' | 'shootout' | 'suspensao' | 'gol_dobro'
export const CARTAS_KINGS: CartaKings[] = ['penalti', 'shootout', 'suspensao', 'gol_dobro']

/** um lance decidido FORA do motor (duelo manual, ou o bot) e enfiado na partida no minuto em que aconteceu */
export interface LanceExterno { min: number; lado: 'A' | 'B'; tipo: 'presidente' | 'carta_penalti' | 'carta_shootout'; gol: boolean }
export interface UsoCarta { min: number; lado: 'A' | 'B'; carta: 'suspensao' | 'gol_dobro' }

export type EventoKings =
  | { min: number; tipo: 'gol'; lado: 'A' | 'B'; vale: 1 | 2; origem: 'jogada' | 'presidente' | 'carta_penalti' | 'carta_shootout' }
  | { min: number; tipo: 'dado'; jogadores: 2 | 3 }
  | { min: number; tipo: 'bola'; cor: 'dourada' | 'vermelha' }
  | { min: number; tipo: 'carta'; lado: 'A' | 'B'; carta: CartaKings }
  | { min: number; tipo: 'perdeu'; lado: 'A' | 'B'; origem: 'presidente' | 'carta_penalti' | 'carta_shootout' }

export interface PartidaKings {
  idA: number; idB: number
  golsA: number; golsB: number
  eventos: EventoKings[]
  /** decidido no gol de ouro (bola dourada)? */
  golDeOuro: boolean
  /** foi pro shootout? (aí `shootout` traz o placar das cobranças) */
  shootout: { a: number; b: number } | null
  resultadoA: ResultadoKings
}

/** rng determinístico (mesma semente = mesma partida em todos os aparelhos) */
export function rngKings(seed: number): () => number {
  let s = (seed >>> 0) || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}

/**
 * ⚽ simula UMA partida. `forcaA/forcaB` = força do time (média do XI, ~50–100). Os lances manuais (pênalti do
 * presidente, carta de pênalti/shootout) chegam prontos em `externos`; suspensão/gol em dobro em `usos`. O shootout
 * final, se acontecer, vem pronto em `shootoutPronto` (duelo manual) — sem ele, o motor sorteia (bot × bot).
 */
export function simulaPartidaKings(o: {
  idA: number; idB: number; forcaA: number; forcaB: number; seed: number
  externos?: LanceExterno[]; usos?: UsoCarta[]; shootoutPronto?: { a: number; b: number }
}): PartidaKings {
  const rng = rngKings(o.seed)
  const ev: EventoKings[] = []
  let ga = 0, gb = 0
  const dado: 2 | 3 = rng() < 0.5 ? 2 : 3
  const ativo = (lado: 'A' | 'B', carta: UsoCarta['carta'], m: number) => (o.usos ?? []).some(u => u.lado === lado && u.carta === carta && m >= u.min && m < u.min + MIN_EFEITO)
  let bola: 'dourada' | 'vermelha' | null = null
  let golDeOuro = false
  for (let m = 1; m <= MIN_FIM; m++) {
    if (m === MIN_DADO) ev.push({ min: m, tipo: 'dado', jogadores: dado })
    if (m === MIN_BOLA) { bola = ga === gb ? 'dourada' : 'vermelha'; ev.push({ min: m, tipo: 'bola', cor: bola }) }
    for (const u of (o.usos ?? []).filter(x => x.min === m)) ev.push({ min: m, tipo: 'carta', lado: u.lado, carta: u.carta })
    // lances manuais deste minuto
    for (const x of (o.externos ?? []).filter(e => e.min === m)) {
      if (x.tipo !== 'presidente') ev.push({ min: m, tipo: 'carta', lado: x.lado, carta: x.tipo === 'carta_penalti' ? 'penalti' : 'shootout' })
      if (x.gol) {
        const vale: 1 | 2 = bola === 'vermelha' || ativo(x.lado, 'gol_dobro', m) ? 2 : 1
        if (x.lado === 'A') ga += vale; else gb += vale
        ev.push({ min: m, tipo: 'gol', lado: x.lado, vale, origem: x.tipo })
        if (bola === 'dourada') { golDeOuro = true; break }
      } else ev.push({ min: m, tipo: 'perdeu', lado: x.lado, origem: x.tipo })
    }
    if (golDeOuro) break
    // jogada normal: chance por minuto sobe quando tem pouca gente em campo (dado) e com o rival suspenso
    const poucos = m >= MIN_DADO && m < MIN_INTERVALO ? (dado === 2 ? 1.9 : 1.5) : 1
    for (const lado of ['A', 'B'] as const) {
      const minha = lado === 'A' ? o.forcaA : o.forcaB, dele = lado === 'A' ? o.forcaB : o.forcaA
      const suspenso = ativo(lado === 'A' ? 'B' : 'A', 'suspensao', m) ? 1.6 : 1
      const p = 0.055 * poucos * suspenso * Math.pow(minha / Math.max(1, dele), 1.6)
      if (rng() < p) {
        const vale: 1 | 2 = bola === 'vermelha' || ativo(lado, 'gol_dobro', m) ? 2 : 1
        if (lado === 'A') ga += vale; else gb += vale
        ev.push({ min: m, tipo: 'gol', lado, vale, origem: 'jogada' })
        if (bola === 'dourada') { golDeOuro = true; break }
      }
    }
    if (golDeOuro) break
  }
  let shootout: { a: number; b: number } | null = null
  let resultadoA: ResultadoKings
  if (ga !== gb) resultadoA = ga > gb ? 'vitoria' : 'derrota'
  else {
    shootout = o.shootoutPronto ?? (() => { let a = 0, b = 0; for (let i = 0; i < 5 || a === b; i++) { if (rng() < 0.6) a++; if (rng() < 0.6) b++; if (i > 30) { a++; break } } return { a, b } })()
    resultadoA = shootout.a > shootout.b ? 'vitoria_shootout' : 'derrota_shootout'
  }
  return { idA: o.idA, idB: o.idB, golsA: ga, golsB: gb, eventos: ev, golDeOuro, shootout, resultadoA }
}

/** 🤖 o presidente BOT usa o pênalti dele num minuto sorteado da janela; acerta ~70% */
export function presidenteBot(seed: number, lado: 'A' | 'B'): LanceExterno {
  const r = rngKings(seed ^ (lado === 'A' ? 0x5a5a : 0xa5a5))
  const min = JANELA_PRESIDENTE[0] + Math.floor(r() * (JANELA_PRESIDENTE[1] - JANELA_PRESIDENTE[0] + 1))
  return { min, lado, tipo: 'presidente', gol: r() < 0.7 }
}

/** 🥅 duelo de canto (gente × gente ou gente × bot). Cantos = as 6 zonas do `PenaltyArt` (0 ↖ · 1 ↑ · 2 ↗ ·
 *  3 ↙ · 4 ↓ · 5 ↘). Goleiro na MESMA zona = defesa; mesma coluna, altura errada = meia chance. */
export type Canto = 0 | 1 | 2 | 3 | 4 | 5
export function dueloKings(chute: Canto, pulo: Canto, sorte: number): boolean {
  if (chute === pulo) return false
  if (chute % 3 === pulo % 3) return sorte < 0.5
  return true
}
