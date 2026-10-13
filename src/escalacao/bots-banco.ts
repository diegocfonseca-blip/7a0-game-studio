// ─── 🔁 RIVAL COM BANCO: cansa, se machuca, roda o time — e ganha mais dinheiro (13/10) ───
// Pedido do Diego (mockup `scripts/mockups/rival-banco.png`, "pode fazer"): *"rival também cansa e
// machuca e também pode comprar 22 jogadores"* + *"bots têm que ganhar mais dinheiro também"*.
// Módulo PURO (sem React, sem estado): a trava `npm run bots-banco` testa tudo daqui.
//
// 🧮 O CANSAÇO DO BOT É DERIVADO, igual ao do humano (`condicao.ts`): nada vai pro save rodada a
// rodada. O plano da temporada inteira sai de (elenco, gás de partida, semente) — rodada r só
// depende das rodadas < r, então placar já jogado nunca muda. O que ATRAVESSA a virada é só o gás
// final de cada carta (`botCarry`, por identidade da carta), exatamente como o `condicaoCarry`.
// 🛡️ Nunca inventa jogador: sem reserva inteiro na posição, o titular joga cansado (−1/−2/−3),
// e lesionado sem substituto real continua em campo como 🚑 (−3) em vez de abrir buraco.
import {
  GAS_JOGO, GAS_BANCO, MOD_VOLTA, LESAO_LIMITE_PCT, LESAO_ESGOTADO_PCT,
  estadoGas, modGas, sugerirRodizio,
} from './condicao'

type Sec = 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA'
const SECS: Sec[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
export type CartaBot = { id: string; pos: string; lo: number; hi: number; fake?: boolean; cria?: boolean }
export type PlanoBot = {
  /** os 11 de cada rodada (índice = rodada 0-based) */
  xi: string[][]
  /** modificador de nível por carta, só nas rodadas em que alguém joga abaixo de 100% */
  mods: Record<number, Record<string, number>>
  /** gás de cada carta DEPOIS da última rodada do plano — é o que atravessa a virada */
  gasFim: Record<string, number>
  /** lesões: rodada em que machucou, quem, quantas rodadas fora */
  lesoes: { r: number; id: string; rodadas: number }[]
  /** quantos titulares o bot poupou em cada rodada (rodízio) */
  poupados: Record<number, number>
}

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hashNome(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const nivel = (c: CartaBot) => c.lo + c.hi

/** melhor XI por nível, respeitando a formação. Ordem de quem entra numa vaga: real inteiro → real
 *  LESIONADO (joga como 🚑, −3 — ver o plano) → só então incógnito, se o elenco nem tiver real na posição.
 *  Assim regra nova nunca põe perna-de-pau em campo no lugar de jogador de verdade. */
function melhorXI(squad: CartaBot[], need: Record<Sec, number>, fora: Set<string>): string[] {
  const out: string[] = []
  const porNivel = (a: CartaBot, b: CartaBot) => nivel(b) - nivel(a)
  for (const p of SECS) {
    const daPos = squad.filter(c => c.pos === p)
    const fila = [
      ...daPos.filter(c => !c.fake && !fora.has(c.id)).sort(porNivel),
      ...daPos.filter(c => !c.fake && fora.has(c.id)).sort(porNivel),
      ...daPos.filter(c => c.fake).sort(porNivel),
    ]
    for (let i = 0; i < need[p] && i < fila.length; i++) out.push(fila[i].id)
  }
  return out
}

/** o plano de uma temporada (ou de `rodadas` rodadas) de UM clube bot */
export function planoCansacoBot(args: {
  squad: CartaBot[]; need: Record<Sec, number>; inicio?: Record<string, number>
  seed: number; seasonNo: number; nome: string; rodadas: number
}): PlanoBot {
  const { squad, need, inicio, seed, seasonNo, nome, rodadas } = args
  const gas: Record<string, number> = {}
  for (const c of squad) gas[c.id] = Math.max(0, Math.min(100, inicio?.[c.id] ?? 100))
  const xi: string[][] = []
  const mods: PlanoBot['mods'] = {}
  const lesoes: PlanoBot['lesoes'] = []
  const poupados: PlanoBot['poupados'] = {}
  const foraAte: Record<string, number> = {} // id → 1ª rodada em que volta
  const volta: Record<string, number> = {}   // id → rodada da volta (pra −2/−1)
  const byId = new Map(squad.map(c => [c.id, c]))
  const h = hashNome(nome)
  for (let r = 0; r < rodadas; r++) {
    const fora = new Set(Object.keys(foraAte).filter(id => foraAte[id] > r))
    let ids = melhorXI(squad, need, fora) // sem reserva pro lesionado, ele joga (como 🚑, abaixo)
    const rot = sugerirRodizio(ids, squad.filter(c => !c.fake), gas, fora)
    if (rot) { ids = rot.ids; poupados[r] = rot.trocas.length }
    xi.push(ids)
    const m: Record<string, number> = {}
    for (const id of ids) {
      let v = fora.has(id) ? -3 : modGas(gas[id] ?? 100)
      const d = volta[id] != null ? r - volta[id] : -1
      if (!fora.has(id) && d >= 0 && d < MOD_VOLTA.length) v += MOD_VOLTA[d]
      if (v) m[id] = v
    }
    if (Object.keys(m).length) mods[r] = m
    // 🩹 lesão por desgaste: UM dado por rodada, no mais acabado do XI (mesma régua do humano),
    // com rng ISOLADO por clube — o rng da partida não é tocado.
    const rng = mulberry((seed ^ Math.imul(seasonNo, 2654435761) ^ Math.imul(r + 1, 0x9E3779B1) ^ h ^ 0xB07CA5) >>> 0)
    const cands = ids.map(id => byId.get(id)!).filter(c => c && !c.fake && !fora.has(c.id) && (estadoGas(gas[c.id] ?? 100) === 'limite' || estadoGas(gas[c.id] ?? 100) === 'esgotado'))
      .sort((a, b) => (gas[a.id] ?? 100) - (gas[b.id] ?? 100))
    const pior = cands[0]
    if (pior) {
      const p = estadoGas(gas[pior.id] ?? 100) === 'esgotado' ? LESAO_ESGOTADO_PCT : LESAO_LIMITE_PCT
      if (rng() < p) {
        const rodadasFora = 1 + Math.floor(rng() * 3)
        foraAte[pior.id] = r + 1 + rodadasFora
        volta[pior.id] = r + 1 + rodadasFora
        lesoes.push({ r, id: pior.id, rodadas: rodadasFora })
      }
    }
    const emCampo = new Set(ids)
    for (const c of squad) gas[c.id] = Math.round((emCampo.has(c.id) ? Math.max(0, gas[c.id] - GAS_JOGO) : Math.min(100, gas[c.id] + GAS_BANCO)) * 10) / 10
  }
  return { xi, mods, gasFim: gas, lesoes, poupados }
}

// ─── 💰 AS DUAS RECEITAS NOVAS DO BOT ────────────────────────────────────────
// 🤝 PATROCÍNIO: a mesma régua do Master do humano num contrato de 2 temporadas
// (`masterPorTemporada(div, 2)` = MASTER_BASE × 1,75). Escrito aqui como tabela pra a trava
// conferir que bate com a do humano (A 56 · B 28 · C 18 · D 9 · V 5).
export const PATROCINIO_BOT: Record<string, number> = { A: 56, B: 28, C: 18, D: 9, V: 5 }
// 🏅 PRÊMIO PELA COLOCAÇÃO na tabela final (por cima do prêmio de título/acesso que já existia).
// Série A cheia; as outras divisões ganham uma fração.
const PREMIO_A = (pos: number): number => pos === 1 ? 40 : pos <= 4 ? 30 : pos <= 8 ? 24 : pos <= 16 ? 15 : 8
const FATOR_DIV: Record<string, number> = { A: 1, B: 0.75, C: 0.5, D: 0.3, V: 0.15 }
export function premioColocacaoBot(div: string, pos: number): number {
  return Math.round(PREMIO_A(Math.max(1, pos)) * (FATOR_DIV[div] ?? 0.15))
}

// ─── 🪑 O BANCO: quantos por posição o bot quer (2× a formação) ────────────
export const bancoAlvo = (need: Record<Sec, number>, pos: Sec): number => need[pos] * 2
