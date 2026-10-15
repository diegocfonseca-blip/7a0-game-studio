// 👑 KINGS LEAGUE DENTRO DA TEMPORADA DE SEMPRE (15/10). Diego: *"tudo é padrão do nosso jogo… as regras são
// diferentes, mas tabela, jogos, placar"* — então a partida é a do jogo (`simMatch`: gols, autores, garçons) e
// AQUI só entra o que a Kings League Brasil muda por cima dela:
//  · 🎩 pênalti do presidente: 1 por time, num minuto da janela (5'–36'), ~70% de gol
//  · 🎲 dado no 18' (2 ou 3 por time até o intervalo) — aviso na tela
//  · ⏱️ 38': empatado → 🟡 bola dourada (o próximo gol vence e acaba) · alguém na frente → 🔴 bola vermelha (gol vale 2)
//  · empate no apito → SHOOTOUT; pontos 3 (vitória) · 2 (vitória no shootout) · 1 (derrota no shootout) · 0
// A partida tem 40 min; o placar de sempre anda de 0 a 93, então os minutos são traduzidos pela proporção.
import type { AssistRow, KingsInfo, LeagueTeam, MatchHighlight, MatchResult, ScorerRow } from './types'
import { MIN_BOLA, MIN_DADO, MIN_INTERVALO, MIN_FIM, JANELA_PRESIDENTE } from './kings'
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

/**
 * Aplica a regra da Kings num jogo que o `simMatch` acabou de simular (com lances de TODOS os jogos e a artilharia
 * numa lista à parte, `tmpS`/`tmpA`, pra o gol que a bola dourada anula sair também da artilharia).
 * Muda `r` no lugar (lances, placar e `r.kings`). Determinístico: só usa o `rng` recebido.
 */
export function aplicaRegrasKings(r: MatchResult, rng: () => number, nomes: { h: string; a: string }, tmpS: ScorerRow[], tmpA: AssistRow[]): void {
  const dado: 2 | 3 = rng() < 0.5 ? 2 : 3
  // 🎩 pênalti do presidente
  const pres: KingsInfo['pres'] = []
  for (const [teamId, nome] of [[r.homeId, nomes.h], [r.awayId, nomes.a]] as [number, string][]) {
    const k = JANELA_PRESIDENTE[0] + Math.floor(rng() * (JANELA_PRESIDENTE[1] - JANELA_PRESIDENTE[0] + 1))
    const min = kParaPlacar(k)
    const gol = rng() < 0.7
    pres.push({ teamId, min, gol })
    if (gol) r.highlights.push({ min, text: `🎩 PÊNALTI DO PRESIDENTE! Gol do ${nome}!`, teamId, kind: 'gol' })
  }
  r.highlights.sort((a, b) => a.min - b.min)
  // ⏱️ minuto 38: como estava o placar?
  const antes = r.highlights.filter(h => ehGol(h) && h.min <= PLACAR_BOLA)
  const h0 = antes.filter(h => h.teamId === r.homeId).length, a0 = antes.length - h0
  const bola: KingsInfo['bola'] = h0 === a0 ? 'dourada' : 'vermelha'
  let ouro = false
  const depois = r.highlights.filter(h => ehGol(h) && h.min > PLACAR_BOLA)
  if (bola === 'dourada' && depois.length) {
    // 🟡 o 1º gol depois do 38' vence e o jogo ACABA — os outros não existiram (saem do placar e da artilharia)
    ouro = true
    for (const g of depois.slice(1)) {
      r.highlights.splice(r.highlights.indexOf(g), 1)
      const autor = /^⚽ (.+) marca para /.exec(g.text)?.[1]
      if (autor) desconta(tmpS, autor, g.teamId, 'goals')
      const passe = r.highlights.find(x => x.kind === 'assist' && x.min === g.min && x.teamId === g.teamId)
      if (passe) {
        r.highlights.splice(r.highlights.indexOf(passe), 1)
        const garcom = /^🅰️ (.+) deu o passe/.exec(passe.text)?.[1]
        if (garcom) desconta(tmpA, garcom, passe.teamId, 'assists')
      }
    }
    const g = depois[0]
    g.text = `🟡 GOL DE OURO! ${g.text.replace(/^⚽ /, '')}`
  } else if (bola === 'vermelha') {
    // 🔴 todo gol depois do 38' vale 2 (o placar de sempre conta lance a lance, então entra um 2º lance no mesmo minuto)
    for (const g of depois) r.highlights.push({ min: g.min, text: '🔴 BOLA VERMELHA: esse gol vale 2!', teamId: g.teamId, kind: 'gol' })
    r.highlights.sort((a, b) => a.min - b.min)
  }
  r.hg = r.highlights.filter(h => ehGol(h) && h.teamId === r.homeId).length
  r.ag = r.highlights.filter(h => ehGol(h) && h.teamId === r.awayId).length
  const info: KingsInfo = { dado, bola, ouro, pres }
  if (r.hg === r.ag) {
    // 🥅 SHOOTOUT da Kings (regra oficial): 5 por time, cada um sai do MEIO-CAMPO cara a cara com o goleiro e tem 5 s pra
    // chutar; acaba antes se um não alcança mais; empatou nas 5, morte súbita. Entra bem menos que pênalti (~55%).
    const sh = disputaPenaltisComSequencia(rng, SHOOTOUT_CONVERSAO)
    info.pens = sh.gols; info.pensSeq = sh.seq
  }
  r.kings = info
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
