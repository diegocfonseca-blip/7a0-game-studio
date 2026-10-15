// 👑 KINGS LEAGUE DENTRO DA TEMPORADA DE SEMPRE (15/10). Diego: *"tudo é padrão do nosso jogo… as regras são
// diferentes, mas tabela, jogos, placar"* — então a partida é a do jogo (`simMatch`: gols, autores, garçons) e
// AQUI só entra o que a Kings League Brasil muda por cima dela:
//  · ⚽ a bola cai da gaiola e começa 1×1 + goleiros, entra 1 por minuto até 7×7 (só tela)
//  · 🎩 pênalti do presidente: 1 por time, no minuto da AGENDA da rodada (igual em todos os jogos); quem é gente escolhe o
//    canto (ou pra onde pula) com contagem — não escolheu, sorteio
//  · 🃏 carta secreta SORTEADA pra cada time (ninguém escolhe), também no minuto da agenda
//  · 🎲 dado no 18' (👑 cara do rei = 1×1 · 2×2 · 3×3) — aviso na tela
//  · ⏱️ 38': empatado → 🟡 bola dourada (o próximo gol vence e acaba) · alguém na frente → 🔴 bola vermelha (gol vale 2)
//  · empate no apito → SHOOTOUT; pontos 3 (vitória) · 2 (vitória no shootout) · 1 (derrota no shootout) · 0
// A partida tem 40 min; o placar de sempre anda de 0 a 93, então os minutos são traduzidos pela proporção.
import type { AssistRow, CartaKingsInfo, CartaKingsTipo, DueloKingsInfo, KingsBase, KingsInfo, LeagueTeam, MatchHighlight, MatchResult, ScorerRow } from './types'
import { MIN_BOLA, MIN_DADO, MIN_INTERVALO, MIN_FIM, rngKings, dueloKings } from './kings'
import type { Canto } from './kings'
import { disputaPenaltisComSequencia } from './penaltis'

/** minuto da Kings (0–40) → minuto do placar de sempre (0–93) */
export const kParaPlacar = (k: number) => Math.round(k * 93 / MIN_FIM)
/** minuto do placar de sempre (0–93) → minuto da Kings (0–40) */
export const placarParaK = (m: number) => Math.max(0, Math.min(MIN_FIM, Math.round(m * MIN_FIM / 93)))
export const PLACAR_DADO = kParaPlacar(MIN_DADO)
export const PLACAR_INTERVALO = kParaPlacar(MIN_INTERVALO)
export const PLACAR_BOLA = kParaPlacar(MIN_BOLA)

const ehGol = (h: MatchHighlight) => h.kind === 'gol'
/** chance de gol numa tentativa do shootout (1×1 saindo do meio, 5 s) */
export const SHOOTOUT_CONVERSAO = 0.55

/** tira 1 de quem está na lista (e a linha some no zero) */
function desconta<T extends { name: string; teamId: number }>(lista: T[], nome: string, teamId: number, campo: 'goals' | 'assists') {
  const i = lista.findIndex(x => x.name === nome && x.teamId === teamId)
  if (i < 0) return
  const row = lista[i] as unknown as Record<string, number>
  row[campo]--
  if (row[campo] <= 0) lista.splice(i, 1)
}

// ── 🗓️ AGENDA DA RODADA (Diego 15/10): o pênalti do presidente e a carta caem no MESMO minuto em todos os jogos da
// rodada — um minuto pro time da CASA (1º tempo) e outro pro VISITANTE (2º tempo). Assim, no online, ninguém se atropela.
export interface AgendaKings { presCasa: number; cartaCasa: number; presFora: number; cartaFora: number }
const misturaSemente = (...n: number[]) => n.reduce((h, x) => Math.imul(h ^ (x | 0), 0x9E3779B1) >>> 0, 0x811C9DC5)
export function agendaKings(seed: number, rodada: number): AgendaKings {
  const r = rngKings(misturaSemente(seed, rodada, 0xA6E4DA))
  const presCasa = 5 + Math.floor(r() * 9)            // 5'–13'
  const cartaCasa = presCasa + 2 + Math.floor(r() * 3) // 2 a 4 min depois (≤ 17')
  const presFora = 23 + Math.floor(r() * 8)           // 23'–30'
  const cartaFora = presFora + 2 + Math.floor(r() * 3) // ≤ 34'
  return { presCasa, cartaCasa, presFora, cartaFora }
}
/** semente de UM jogo da Kings (mesma em todo aparelho) */
export const sementeJogoKings = (seed: number, rodada: number, homeId: number, awayId: number) => misturaSemente(seed, rodada, homeId, awayId, 0xC0DE)

// 🃏 as cartas da Kings League (página oficial "Como se joga" + regulamento PT de 14/10/2025). Sorteio puro: ninguém escolhe.
export const CARTAS_SORTEIO: CartaKingsTipo[] = ['penalti', 'shootout', 'suspensao', 'gol_dobro', 'estrela', 'penalti_inverso', 'coringa']
/** 🎲 as 6 faces do dado: duas de cada — 👑 cara do rei (1×1), 2×2, 3×3 */
export const FACES_DADO: (1 | 2 | 3)[] = [1, 1, 2, 2, 3, 3]
/** quanto duram a suspensão e o gol em dobro (min da Kings) */
const EFEITO_K = 4

export interface CtxKings {
  agenda: AgendaKings
  nomes: { h: string; a: string }
  /** ids dos times de GENTE (a escolha de canto deles vem de `base.decisoes`) */
  humanos: number[]
  /** o craque do time pra carta de jogador estrela */
  estrela: (teamId: number) => string | null
}

/**
 * 👑 Aplica a regra da Kings por cima da partida de sempre. Recomeça SEMPRE da partida crua (`base`), então pode ser
 * chamada de novo quando a pessoa escolhe o canto: mesma semente + a escolha dela = a mesma partida, só com a cobrança
 * decidida por ela. Devolve a artilharia/garçons deste jogo (já sem os gols que a bola dourada anulou).
 */
export function aplicaRegrasKings(r: MatchResult, base: KingsBase, ctx: CtxKings): { s: ScorerRow[]; a: AssistRow[] } {
  const tmpS = base.tmpS.map(x => ({ ...x })), tmpA = base.tmpA.map(x => ({ ...x }))
  r.highlights = base.highlights.map(x => ({ ...x }))
  const rng = rngKings(base.seed)
  const H = r.homeId, A = r.awayId
  const nome = (id: number) => id === H ? ctx.nomes.h : ctx.nomes.a
  const rival = (id: number) => id === H ? A : H
  // ── todos os sorteios de uma vez, sempre na mesma ordem (a escolha de alguém nunca muda o resto do jogo)
  const dado = FACES_DADO[Math.floor(rng() * 6)]
  const sorteiaCarta = () => {
    const sorteada = CARTAS_SORTEIO[Math.floor(rng() * CARTAS_SORTEIO.length)]
    const outras = CARTAS_SORTEIO.filter(c => c !== 'coringa') as Exclude<CartaKingsTipo, 'coringa'>[]
    const sub = outras[Math.floor(rng() * outras.length)]
    return { sorteada, vale: sorteada === 'coringa' ? sub : sorteada }
  }
  const cartaH = sorteiaCarta(), cartaA = sorteiaCarta()
  const dados = () => ({ chute: Math.floor(rng() * 6), pulo: Math.floor(rng() * 6), sorte: rng(), sorte2: rng() })
  const dPresH = dados(), dPresA = dados(), dCartaH = dados(), dCartaA = dados()
  const suspH = { chance: rng(), quando: rng() }, suspA = { chance: rng(), quando: rng() }
  const gols: MatchHighlight[] = []
  const duelos: DueloKingsInfo[] = []
  // ── 🥅 uma cobrança 1×1: quem é gente escolhe (batedor = canto do chute · goleiro = pra onde pula); quem não escolheu, sorteio
  const duelo = (key: string, tipo: DueloKingsInfo['tipo'], kMin: number, batedor: number, d: ReturnType<typeof dados>) => {
    const goleiro = rival(batedor)
    const dec = base.decisoes[key]
    const chute = dec != null && ctx.humanos.includes(batedor) ? dec : d.chute
    const pulo = dec != null && ctx.humanos.includes(goleiro) && !ctx.humanos.includes(batedor) ? dec : d.pulo
    let gol = dueloKings(chute as Canto, pulo as Canto, d.sorte)
    if (tipo === 'shootout') gol = gol && d.sorte2 < 0.72 // sai do meio, 5 s: entra menos que pênalti
    const golPara = tipo === 'penalti_inverso' ? (gol ? null : goleiro) : (gol ? batedor : null)
    const min = kParaPlacar(kMin)
    duelos.push({ key, tipo, min, batedor, goleiro, chute, pulo, gol, golPara })
    if (golPara != null) {
      const texto = tipo === 'presidente' ? `🎩 PÊNALTI DO PRESIDENTE! Gol do ${nome(golPara)}!`
        : tipo === 'penalti' ? `🃏 PÊNALTI DA CARTA! Gol do ${nome(golPara)}!`
        : tipo === 'shootout' ? `🃏 SHOOTOUT DA CARTA! Gol do ${nome(golPara)}!`
        : `🔄 PÊNALTI INVERSO! O ${nome(batedor)} errou — gol do ${nome(golPara)}!`
      // o gol entra no placar 1 tique DEPOIS do minuto da cobrança: o relógio para no minuto dela e o placar não pode
      // entregar o resultado antes de a bola sair (anti-spoiler)
      gols.push({ min: min + 1, text: texto, teamId: golPara, kind: 'gol' })
    }
  }
  const ag = ctx.agenda
  duelo('pres:h', 'presidente', ag.presCasa, H, dPresH)
  duelo('pres:a', 'presidente', ag.presFora, A, dPresA)
  // 🃏 as cartas
  const cartas: CartaKingsInfo[] = []
  const usaCarta = (teamId: number, kMin: number, c: ReturnType<typeof sorteiaCarta>, d: ReturnType<typeof dados>, susp: { chance: number; quando: number }, lado: 'h' | 'a') => {
    const info: CartaKingsInfo = { teamId, min: kParaPlacar(kMin), sorteada: c.sorteada, vale: c.vale }
    if (c.vale === 'penalti' || c.vale === 'shootout') duelo(`carta:${lado}`, c.vale, kMin, teamId, d)
    else if (c.vale === 'penalti_inverso') duelo(`carta:${lado}`, 'penalti_inverso', kMin, rival(teamId), d)
    else if (c.vale === 'suspensao' && susp.chance < 0.45) {
      // 🟥 um rival fica 4 min fora: com um a mais, o time aproveita (às vezes)
      gols.push({ min: kParaPlacar(kMin + 1 + Math.floor(susp.quando * (EFEITO_K - 1))), text: `🟥 Com um a mais, o ${nome(teamId)} aproveita: GOL!`, teamId, kind: 'gol' })
    } else if (c.vale === 'estrela') info.estrela = ctx.estrela(teamId) ?? undefined
    cartas.push(info)
  }
  usaCarta(H, ag.cartaCasa, cartaH, dCartaH, suspH, 'h')
  usaCarta(A, ag.cartaFora, cartaA, dCartaA, suspA, 'a')
  r.highlights.push(...gols)
  r.highlights.sort((x, y) => x.min - y.min)
  // ✖️2 / ⭐ gols que valem 2 (entra um 2º lance no mesmo minuto — o placar de sempre conta lance a lance)
  const dobrados = new Set<MatchHighlight>()
  for (const c of cartas) {
    if (c.vale === 'gol_dobro') {
      const ate = c.min + kParaPlacar(EFEITO_K)
      for (const g of r.highlights.filter(h => ehGol(h) && h.teamId === c.teamId && h.min >= c.min && h.min <= ate)) dobrados.add(g)
    } else if (c.vale === 'estrela' && c.estrela) {
      const g = r.highlights.find(h => ehGol(h) && h.teamId === c.teamId && h.min >= c.min && h.text.startsWith(`⚽ ${c.estrela} marca para`))
      if (g) dobrados.add(g)
    }
  }
  for (const g of dobrados) {
    const estrela = cartas.some(c => c.vale === 'estrela' && c.teamId === g.teamId && c.estrela && g.text.startsWith(`⚽ ${c.estrela} `))
    r.highlights.push({ min: g.min, text: estrela ? '⭐ JOGADOR ESTRELA: esse gol vale 2!' : '✖️2 GOL EM DOBRO: esse gol vale 2!', teamId: g.teamId, kind: 'gol' })
  }
  r.highlights.sort((x, y) => x.min - y.min)
  // ⏱️ minuto 38: como estava o placar?
  const antes = r.highlights.filter(h => ehGol(h) && h.min <= PLACAR_BOLA)
  const h0 = antes.filter(h => h.teamId === H).length, a0 = antes.length - h0
  const bola: KingsInfo['bola'] = h0 === a0 ? 'dourada' : 'vermelha'
  let ouro = false
  const depois = r.highlights.filter(h => ehGol(h) && h.min > PLACAR_BOLA && h.text.startsWith('⚽'))
  if (bola === 'dourada' && depois.length) {
    // 🟡 o 1º gol depois do 38' vence e o jogo ACABA — os outros não existiram (saem do placar e da artilharia)
    ouro = true
    const fim = depois[0].min
    const fica = new Set<MatchHighlight>([depois[0]])
    const passe = r.highlights.find(x => x.kind === 'assist' && x.min === fim && x.teamId === depois[0].teamId)
    if (passe) fica.add(passe)
    for (const g of [...r.highlights]) {
      if (g.min < fim || fica.has(g)) continue
      r.highlights.splice(r.highlights.indexOf(g), 1)
      const autor = /^⚽ (.+) marca para /.exec(g.text)?.[1]
      if (autor) desconta(tmpS, autor, g.teamId, 'goals')
      const garcom = /^🅰️ (.+) deu o passe/.exec(g.text)?.[1]
      if (garcom) desconta(tmpA, garcom, g.teamId, 'assists')
    }
    const g = depois[0]
    g.text = `🟡 GOL DE OURO! ${g.text.replace(/^⚽ /, '')}`
  } else if (bola === 'vermelha') {
    // 🔴 todo gol depois do 38' vale 2 (gol que já vale 2 pela carta não dobra de novo)
    for (const g of depois) if (!dobrados.has(g)) r.highlights.push({ min: g.min, text: '🔴 BOLA VERMELHA: esse gol vale 2!', teamId: g.teamId, kind: 'gol' })
    r.highlights.sort((x, y) => x.min - y.min)
  }
  r.hg = r.highlights.filter(h => ehGol(h) && h.teamId === H).length
  r.ag = r.highlights.filter(h => ehGol(h) && h.teamId === A).length
  const info: KingsInfo = { dado, bola, ouro, pres: duelos.filter(d => d.tipo === 'presidente').map(d => ({ teamId: d.batedor, min: d.min, gol: d.gol })), cartas, duelos }
  if (r.hg === r.ag) {
    // 🥅 SHOOTOUT da Kings (regra oficial): 5 por time, cada um sai do MEIO-CAMPO cara a cara com o goleiro e tem 5 s pra
    // chutar; acaba antes se um não alcança mais; empatou nas 5, morte súbita. Entra bem menos que pênalti (~55%).
    const sh = disputaPenaltisComSequencia(rngKings(base.seed ^ 0x5400700), SHOOTOUT_CONVERSAO)
    info.pens = sh.gols; info.pensSeq = sh.seq
  }
  r.kings = info
  return { s: tmpS, a: tmpA }
}

/** desfaz o que `aplicaResultadoKings` pôs na tabela (quando a partida é refeita com a escolha da pessoa) */
export function desfazResultadoKings(league: LeagueTeam[], r: MatchResult) {
  const h = league.find(t => t.id === r.homeId), a = league.find(t => t.id === r.awayId)
  if (!h || !a) return
  h.gf -= r.hg; h.ga -= r.ag; a.gf -= r.ag; a.ga -= r.hg
  if (r.hg > r.ag) { h.pts -= 3; h.w--; a.l-- }
  else if (r.hg < r.ag) { a.pts -= 3; a.w--; h.l-- }
  else {
    const [ph, pa] = r.kings?.pens ?? [1, 0]
    h.d--; a.d--
    if (ph > pa) { h.pts -= 2; a.pts -= 1 } else { a.pts -= 2; h.pts -= 1 }
  }
}
/** tira das listas da competição o que um jogo tinha posto (artilharia/garçons) */
export function tiraListas(destS: ScorerRow[], art: { s: ScorerRow[]; a: AssistRow[] }, destA: AssistRow[]) {
  for (const x of art.s) for (let i = 0; i < x.goals; i++) desconta(destS, x.name, x.teamId, 'goals')
  for (const x of art.a) for (let i = 0; i < x.assists; i++) desconta(destA, x.name, x.teamId, 'assists')
}

/** pontos da Kings: 3 · 2 (vence no shootout) · 1 (perde no shootout) · 0. Na tabela, `d` conta os jogos de shootout. */
export function aplicaResultadoKings(league: LeagueTeam[], r: MatchResult) {
  const h = league.find(t => t.id === r.homeId), a = league.find(t => t.id === r.awayId)
  if (!h || !a) return
  h.gf += r.hg; h.ga += r.ag; a.gf += r.ag; a.ga += r.hg
  if (r.hg > r.ag) { h.pts += 3; h.w++; a.l++ }
  else if (r.hg < r.ag) { a.pts += 3; a.w++; h.l++ }
  else {
    const [ph, pa] = r.kings?.pens ?? [1, 0]
    h.d++; a.d++
    if (ph > pa) { h.pts += 2; a.pts += 1 } else { a.pts += 2; h.pts += 1 }
  }
}

/** quem venceu (id), contando o shootout */
export function vencedorKings(r: { homeId: number; awayId: number; hg: number; ag: number; kings?: KingsInfo }): number {
  if (r.hg !== r.ag) return r.hg > r.ag ? r.homeId : r.awayId
  const [ph, pa] = r.kings?.pens ?? [1, 0]
  return ph > pa ? r.homeId : r.awayId
}

/** soma a artilharia/garçons de um jogo da Kings (listas à parte) na lista da competição */
export function somaListas(destS: ScorerRow[], tmpS: ScorerRow[], destA: AssistRow[], tmpA: AssistRow[]) {
  for (const x of tmpS) { const row = destS.find(y => y.name === x.name && y.teamId === x.teamId); if (row) row.goals += x.goals; else destS.push({ ...x }) }
  for (const x of tmpA) { const row = destA.find(y => y.name === x.name && y.teamId === x.teamId); if (row) row.assists += x.assists; else destA.push({ ...x }) }
}
