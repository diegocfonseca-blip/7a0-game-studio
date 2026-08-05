// ─── CARREIRA ONLINE · TEMPORADA SIMULADA (as 4 divisões) ────────────────
// Depois do LEILÃO REAL, a temporada roda SIMULADA a partir dos elencos de
// verdade (mesmo motor da Dinastia, aqui auto-contido). Tudo é DETERMINÍSTICO
// pela semente da sala + a rodada atual (state.round, que já sincroniza pelo
// host), então todos os aparelhos veem a MESMA tabela sem mandar resultado por
// resultado. A Série D tem os humanos com os times montados no pregão; A/B/C são
// preenchidas pelo resto do baralho, distribuído por força (A a mais forte).

import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG, CATALOG_EU, CATALOG_BOTH, DIVISION_TEAMS, EXTRA_D_TEAMS, oldChain } from './data'
import type { Card, Manager, Sector, WonCard, LedgerEntry, EmpCard, FormationKey, AgCard, AgEvento, EventoAtivo } from './types'
import { SECTORS, FORMATIONS } from './types'
import { sorteiaEvento, mancheteSemReserva, eventoTituloBanner, eventoEmoji, traitDe } from './eventos'
import type { EventoCard } from './eventos'
import { useEsc, savePyramidCloud, salaryOfCard, squadPayroll, filialSlots, filialSaleValue, ownedRealCount, isFillerClub, valorOficial, catalogTodos, agenciaEstadio } from './store'
import { empresarioIncome, empCat, EMP_ORDER, EMP_META, empCatUnlocked, agenciaRenda, AG_VALUES, AG_FOLK_BONUS, sectorsDone, sectorPct, hasExtra, STADIUM_SECTORS, STADIUM_EXTRAS } from './estadiodata'
import type { EmpCat, StadiumSave } from './estadiodata'
import { CardCollectPrompt, ApoieButton, useSimMode, SimControls, SpeedControls, CollectibleCard } from './screens'
import { SeasonJornal, shareElenco } from './jornal'
import type { ElencoPlayerRow } from './jornal'
import { StadiumTab, StadiumSvg, SponsorCard } from './estadio'
import { Escudo } from './escudos' // 🛡️ brasão do clube (desenhado por código, do NOME)
import { CopaMundoGate, loadCopaSave } from './copa-mundo'
import { supabase } from '../lib/supabase'
import { useAgenciaLiberada, useEscadaLiberada } from './sport'
import { resilientWrite } from './pending'
import { myApoioPerk, apoioSelo, apoioName, apoioText, ApoioSheen, ApoioPreviewMark, APOIO_PERKS, stripEmoji, useHasManual, setCareerColorCtx } from './apoio'
import type { ApoioPerk } from './apoio'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const SLATE = '#3E4A5A' // 🔄 marca de EMPRÉSTIMO (cinza-ardósia): NEUTRA de propósito — cor é sagrada dos tiers, então o emprestado não empresta cor de tier nenhum
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

// 🔄 chip "EMP" do jogador emprestado (pego DA SAF). Fica do lado do nome, pequeno,
// sem poluir. `mini` = versão selo do campinho (canto da mini-carta).
function EmpTag({ mini = false }: { mini?: boolean }) {
  if (mini) return (
    <span style={{ position: 'absolute', top: -8, right: -6, ...OSWALD, fontWeight: 900, fontSize: 7.5, letterSpacing: .4, color: '#fff', background: SLATE, border: `1.5px solid ${INK}`, borderRadius: 5, padding: '0 4px', lineHeight: '15px', textTransform: 'uppercase', boxShadow: `1.5px 1.5px 0 ${INK}` }}>EMP</span>
  )
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, ...OSWALD, fontWeight: 900, fontSize: 8, letterSpacing: .6, color: '#fff', background: SLATE, border: `1.5px solid ${INK}`, borderRadius: 5, padding: '1px 5px', marginLeft: 6, flexShrink: 0, textTransform: 'uppercase', verticalAlign: 'middle' }}>🔄 EMP</span>
  )
}

// 🔒 no lugar dos controles de manual, quando a carreira NOVA ainda não tem o
// Modo Manual: um convite que abre o Apoie direto na explicação do manual. A
// temporada segue rodando no AUTO normalmente — nada trava o jogo.
function ManualLockButton() {
  return (
    <div style={{ marginBottom: 10 }}>
      <ApoieButton startScreen="manual" trigger={open => (
        <button onClick={open} style={{ width: '100%', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '10px 12px', fontWeight: 900, fontSize: 12, background: '#fff', color: INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, ...OSWALD }}>
          <span>🎮 Modo Manual</span>
          <span style={{ fontSize: 10, fontWeight: 800, background: GREEN, color: '#fff', borderRadius: 999, padding: '2px 8px' }}>Apoie 🔒</span>
        </button>
      )} />
      <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', margin: '4px 2px 0', ...OSWALD }}>Controle o ritmo da temporada — pause, acelere, pule. Toque pra desbloquear.</p>
    </div>
  )
}

// 🌱 'V' = VÁRZEA (5ª divisão, embaixo da D) — SÓ existe em carreira nova com a
// escada ligada (teste do Diego). Nas carreiras normais a tabela V fica vazia e
// tudo se comporta como as 4 séries de sempre (loops pulam divisão vazia).
export type Div = 'A' | 'B' | 'C' | 'D' | 'V'
export const DIVS: Div[] = ['A', 'B', 'C', 'D', 'V']
const DIV_LABEL: Record<Div, string> = { A: '🏆 Série A', B: '🥈 Série B', C: '🥉 Série C', D: 'Série D', V: '🌱 Várzea' }
const DIV_TAG: Record<Div, { l: string; bg: string }> = { A: { l: 'A', bg: '#B8892B' }, B: { l: 'B', bg: '#3E8E4E' }, C: { l: 'C', bg: '#9A7B33' }, D: { l: 'D', bg: '#7A7460' }, V: { l: 'V', bg: '#8B5E3C' } }
// força-base por divisão dos times de CPU NATIVOS (não humano, não rival). Só um
// EMPURRÃO leve (não paridade!) pra os nativos das séries de baixo não serem
// atropelados de goleada — o NÍVEL/lenda continua mandando (time forte lidera). A
// zebra/variação fica por conta do "dia" (MATCH_LUCK). Tunável.
const CPU_DIV_BOOST: Record<Div, number> = { A: 6, B: 9, C: 12, D: 2, V: 0 }
// ⚖️ ESCADA JUSTA (simV>=4): o bônus escondido dos bots era tão alto que só time de
// LENDA competia nas séries de cima — time bom/médio fazia ioiô (subia e caía todo
// ano, "campeão num dia, rebaixado no outro"). Reduzido pra o NÍVEL REAL do time
// mandar: o desafio passa a vir de adversário forte de verdade, não de um handicap
// invisível. Só vale pra temporada NOVA (trava simV) — temporada em andamento
// termina na regra em que começou (nada muda no meio do jogo).
const CPU_DIV_BOOST_FAIR: Record<Div, number> = { A: 2, B: 4, C: 5, D: 3, V: 4 } // 04/08 (pedido do Diego: 'tá fácil'): B/C/D/V subiram +1-2; A fica em 2 — subir mais no topo ressuscitava o ioiô (simulado). Chegada na A: T13-T23
// ⚽ REALISMO DE GOL (v3, travado por simV): menos gol e menos goleada — a Série A
// sai de ~4,2 pra ~3,0 gols/jogo e a lanterna deixa de ser freguês (goleada
// comprimida, sem mudar QUEM ganha — o melhor time segue na frente). v2 = fórmula
// antiga; temporada EM ANDAMENTO (simV<3) termina no modelo antigo e a próxima já
// nasce no novo. NÃO mexe em leilão, divisões nem dificuldade.
const GOAL_TUNE = { v2: { base: 1.35, home: 0.25, coef: 0.055 }, v3: { base: 1.15, home: 0.16, coef: 0.038 } }

// ── motor de simulação por elenco (espelha o da Dinastia) ──
const NEED: Record<Sector, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
type PoolCard = Card
const mid = (c: PoolCard) => (c.lo + c.hi) / 2
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function poisson(l: number, rng: () => number): number { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng() } while (p > L && k < 12); return Math.min(k - 1, 7) } // teto de 7 gols: num jogo muito desigual evita goleada irreal (8×0, 9×0)
function sectorPow(rolls: number[]): number { if (rolls.length === 0) return 40; const avg = rolls.reduce((a, b) => a + b, 0) / rolls.length; const min = Math.min(...rolls); return avg - (avg - min) * 0.35 }
function shuffle<T>(arr: T[], rng: () => number): T[] { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
let filCounter = 0
const FIL_NAMES = ['Perna-de-pau', 'Ferro Velho', 'Pé de Anjo', 'Canela Seca', 'Zé Ninguém', 'Trapalhão', 'Bola Murcha', 'Meia-Boca']
// fillers de várzea: nível bem baixo (abaixo de semi-pro) — perna-de-pau mesmo,
// pra não brigarem na artilharia com os craques de verdade.
function filler(pos: Sector, rng: () => number): PoolCard { const lo = 30 + Math.floor(rng() * 6); return { id: `fil-${filCounter++}`, name: FIL_NAMES[Math.floor(rng() * FIL_NAMES.length)], club: 'Várzea', year: 2000, pos, fame: 1, lo, hi: lo + 6 + Math.floor(rng() * 4) } }
type Tac = 'retranca' | 'equilibrio' | 'ataque'
const TACS: Tac[] = ['retranca', 'equilibrio', 'ataque']
function rollForm(squad: PoolCard[], tac: Tac, _opp: Tac, rng: () => number) {
  const rolls = squad.map(c => ({ c, lvl: c.lo + rng() * (c.hi - c.lo) }))
  const by = (p: Sector) => sectorPow(rolls.filter(r => r.c.pos === p).map(r => r.lvl))
  const gol = by('GOL'), lat = by('LAT'), zag = by('ZAG'), mei = by('MEI'), ata = by('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  if (tac === 'retranca') { def += 4; atk -= 3 } if (tac === 'ataque') { atk += 4; def -= 3 } if (tac === 'equilibrio') { atk += 1; def += 1 }
  return { atk, def }
}
// XI automático RESPEITANDO a formação do time (4-3-3, 4-4-2, 4-5-1). Sem a
// formação (times de CPU, que são montados no padrão 4-3-3) cai no NEED base.
// BUG antigo: usava NEED fixo (4-3-3) pra todo mundo — quem jogava 4-4-2 tinha o
// 4º meia jogado pro banco e entrava em campo com 10 (faltava 1 meia).
function bestXI(squad: PoolCard[], formation?: FormationKey): PoolCard[] {
  const need = formation ? FORMATIONS[formation] : NEED
  const out: PoolCard[] = []
  for (const p of SECTORS) { const cands = squad.filter(c => c.pos === p).sort((a, b) => mid(b) - mid(a)); for (let i = 0; i < need[p] && i < cands.length; i++) out.push(cands[i]) }
  return out
}
function dealSquads(bucket: PoolCard[], nTeams: number, rng: () => number): PoolCard[][] {
  const squads: PoolCard[][] = Array.from({ length: nTeams }, () => [])
  const byPos: Record<Sector, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  for (const c of bucket) byPos[c.pos].push(c)
  for (const p of SECTORS) { const list = shuffle(byPos[p], rng); for (let slot = 0; slot < NEED[p]; slot++) for (let t = 0; t < nTeams; t++) squads[t].push(list.shift() ?? filler(p, rng)) }
  return squads
}
function roundRobin(n: number): [number, number][][] {
  const ids = Array.from({ length: n }, (_, i) => i), rounds: [number, number][][] = [], rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)], right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) round.push(r % 2 === 0 ? [left[i], right[i]] : [right[i], left[i]])
    rounds.push(round); rot.unshift(rot.pop()!)
  }
  return [...rounds, ...rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))]
}

export interface SimTeam { name: string; you: boolean; human: boolean; rival?: boolean; dorm?: boolean; backstop?: boolean; teamId: number; squad: PoolCard[]; xi: PoolCard[]; formation?: FormationKey; pts: number; w: number; d: number; l: number; gf: number; ga: number }
export interface SeasonScorer { name: string; teamName: string; teamId: number; div: Div; goals: number; you: boolean; human: boolean; rival?: boolean; dorm?: boolean; cardId?: string }

function pickCatalog(deck: 'br' | 'eu' | 'both' | 'todos') { return deck === 'eu' ? CATALOG_EU : deck === 'both' ? CATALOG_BOTH : deck === 'todos' ? catalogTodos() : CATALOG }

// elencos determinísticos dos 60 times de CPU (A/B/C), por NOME — estável entre
// temporadas: quando um time sobe/desce, leva o mesmo elenco (chave = nome).
function buildCpuSquads(managers: Manager[], seed: number, deck: 'br' | 'eu' | 'both' | 'todos', comVarzea = false): Map<string, PoolCard[]> {
  const rng = mulberry((seed ^ 0x9E3779B1) >>> 0)
  // dedup por AUGE (nome+clube+ano): auges diferentes do mesmo nome (Vini Flamengo
  // x Real) são jogadores distintos — cabem os dois, mais cartas pra encher os times.
  const idOf = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
  const used = new Set<string>()
  for (const m of managers) for (const c of m.squad) used.add(idOf(c))
  const cat = pickCatalog(deck)
  const pool: PoolCard[] = (Object.keys(cat) as Sector[]).flatMap(pos => cat[pos].map((c, i) => ({ ...c, pos, id: `${pos}-${i}` })))
  const rest = shuffle(pool.filter(c => !used.has(idOf(c))), rng).sort((a, b) => mid(b) - mid(a))
  // 🌱 escada com VÁRZEA (comVarzea): a sala do usuário vira a divisão V, então a
  // Série D também precisa de 20 times de fundo — o pool é fatiado em 4 (a fatia
  // mais fraca vira a D, que na régua da escada é terra de bom jogador).
  const nDivs = comVarzea ? 4 : 3
  const q = Math.ceil(rest.length / nDivs)
  const bucket: Record<'A' | 'B' | 'C' | 'D', PoolCard[]> = comVarzea
    ? { A: rest.slice(0, q), B: rest.slice(q, q * 2), C: rest.slice(q * 2, q * 3), D: rest.slice(q * 3) }
    : { A: rest.slice(0, q), B: rest.slice(q, q * 2), C: rest.slice(q * 2), D: [] }
  const map = new Map<string, PoolCard[]>()
  // 🏛️ um time que virou MANAGER (ex.: 2º clube do Multiclubes comprado de outra
  // divisão) NÃO pode também nascer como time de fundo — senão apareceria DUPLICADO
  // na pirâmide. Normalmente nenhum time A/B/C é manager, então isto é no-op.
  const mgrNames = new Set(managers.map(m => m.teamName))
  for (const d of (comVarzea ? ['A', 'B', 'C', 'D'] as const : ['A', 'B', 'C'] as const)) {
    // na D (escada), rivais escolhidos "ocupam" nomes da lista — completa com os extras
    const names = d === 'D'
      ? [...DIVISION_TEAMS.D.map(t => t.team), ...EXTRA_D_TEAMS.map(t => t.team)].filter(nm => !mgrNames.has(nm)).slice(0, 20)
      : DIVISION_TEAMS[d].map(t => t.team).slice(0, 20)
    const dealt = dealSquads(bucket[d], 20, rng)
    names.forEach((nm, i) => { if (!mgrNames.has(nm)) map.set(nm, dealt[i]) })
  }
  return map
}
// divisão de origem de um time de CPU (temporada 1) — usada como fallback
const cpuOrigDiv = (name: string): Div => DIVISION_TEAMS.A.some(t => t.team === name) ? 'A' : DIVISION_TEAMS.B.some(t => t.team === name) ? 'B' : DIVISION_TEAMS.C.some(t => t.team === name) ? 'C' : DIVISION_TEAMS.D.some(t => t.team === name) || EXTRA_D_TEAMS.some(t => t.team === name) ? 'D' : 'C'
// chave estável de um time: técnico = m<id>; CPU = nome
export const teamKey = (t: { teamId: number; name: string }) => t.teamId >= 0 ? `m${t.teamId}` : t.name

// monta as 4 divisões pela COLOCAÇÃO guardada (placements): D começa com os
// técnicos reais; a cada temporada os times sobem/descem por nome exato.
export function buildPyramid(managers: Manager[], youId: number, seed: number, deck: 'br' | 'eu' | 'both' | 'todos', placements?: Record<string, string> | null, cpuSquads?: Record<string, Card[]>): Record<Div, SimTeam[]> {
  const mk = (name: string, squad: PoolCard[], human: boolean, you: boolean, teamId: number, backstop = false, rival = false, dorm = false, formation?: FormationKey): SimTeam => ({ name, you, human, rival, dorm, backstop, teamId, squad, formation, xi: bestXI(squad, formation), pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })
  const world: Record<Div, SimTeam[]> = { A: [], B: [], C: [], D: [], V: [] }
  const divOf = (key: string, fallback: Div): Div => { const d = placements?.[key]; return (d === 'A' || d === 'B' || d === 'C' || d === 'D' || d === 'V') ? d : fallback }
  // 🌱 mundo COM VÁRZEA: detectado pelas colocações (alguém em 'V') — só carreira
  // nova com a escada. Managers caem na V por padrão; a Série D vira fundo de CPU.
  const hasV = Object.values(placements ?? {}).includes('V')
  // os 20 da liga + o 2º clube do Multiclubes (assento `mine`), que pode vir além dos
  // 20 e joga a divisão dele (não é excluído por causa do corte dos 20).
  for (const m of managers.filter((mm, i) => i < 20 || mm.mine)) {
    const t = mk(m.teamName, (m.squad as WonCard[]).map(c => ({ ...c })), m.isHuman, m.id === youId, m.id, !!m.backstop, !!m.rival, !!m.dormindo, m.formation)
    world[divOf(`m${m.id}`, hasV ? 'V' : 'D')].push(t)
  }
  const cpu = buildCpuSquads(managers, seed, deck, hasV)
  // usa a FICHA salva do time de fundo se existir (memória de mercado); senão, a
  // receita determinística (base). Assim vender/comprar cola entre temporadas.
  // Times RENOMEADOS: se o save antigo guardou colocação/ficha no nome VELHO,
  // lê por ele — o time mantém a divisão que conquistou e o elenco que tinha.
  for (const [name, base] of cpu) {
    const olds = oldChain(name)
    const plKey = placements?.[name] != null ? name : (olds.find(o => placements?.[o] != null) ?? name)
    const squad = cpuSquads?.[name] ?? olds.map(o => cpuSquads?.[o]).find(Boolean) ?? base
    world[divOf(plKey, cpuOrigDiv(name))].push(mk(name, squad as PoolCard[], false, false, -1))
  }
  // REDE DE SEGURANÇA: cada série precisa de EXATAMENTE 20 times. Save fora do
  // padrão (qualquer causa) desequilibrava (19/21) e derrubava a simulação
  // inteira. Sobras saem do fim da série cheia (nunca humano) e completam a
  // série vazia — determinístico, então online continua sincronizado.
  const over: SimTeam[] = []
  const balanceDivs = hasV ? DIVS : DIVS.filter(d => d !== 'V') // sem escada, a V fica vazia (não puxa time)
  for (const d of balanceDivs) {
    while (world[d].length > 20) {
      let i = world[d].length - 1
      while (i > 0 && world[d][i].human) i--
      over.push(world[d].splice(i, 1)[0])
    }
  }
  for (const d of balanceDivs) while (world[d].length < 20 && over.length) world[d].push(over.pop()!)
  return world
}
// semeia a ficha dos 60 times de fundo a partir da receita (base determinística)
// — materializa 1x os elencos que antes eram só calculados na hora.
export function seedCpuSquads(managers: Manager[], seed: number, deck: 'br' | 'eu' | 'both' | 'todos', comVarzea = false): Record<string, Card[]> {
  const out: Record<string, Card[]> = {}
  for (const [name, squad] of buildCpuSquads(managers, seed, deck, comVarzea)) out[name] = squad
  return out
}

// acessos/quedas por NOME EXATO: top 4 sobe, últimos 4 caem, entre divisões
// vizinhas. Devolve a nova colocação (chave do time → divisão).
export function computePromotions(tables: Record<Div, SimTeam[]>): Record<string, string> {
  const pl: Record<string, string> = {}
  for (const d of DIVS) for (const t of (tables[d] ?? [])) pl[teamKey(t)] = d
  // 🌱 a Várzea (V) só entra na dança quando EXISTE (carreira nova com escada) —
  // nas carreiras normais a tabela V é vazia e o acesso/queda fica A↔B↔C↔D como sempre.
  const pares = (tables.V?.length ?? 0) > 0 ? 4 : 3
  for (let i = 0; i < pares; i++) {
    const U = DIVS[i], L = DIVS[i + 1] // U = de cima, L = de baixo
    for (const t of (tables[U] ?? []).slice(-4)) pl[teamKey(t)] = L // caem
    for (const t of (tables[L] ?? []).slice(0, 4)) pl[teamKey(t)] = U // sobem
  }
  return pl
}

// moedas da temporada por técnico — SEM base recorrente (o técnico já começou
// com 100). Só desempenho, com valores DIFERENTES por série (reforçados por causa
// do salário — o campeão/artilheiro precisa bancar a folha):
//   campeão: A 65 · B 50 · C 35 · D 20
//   top 4 (zona/acesso): A 30 · B 25 · C 20 · D 0 — nas de baixo é acesso (sobe);
//     na A é "manter entre os 4". Sair da D é de graça (0). Campeão da A = 65 + 30 = 95.
//   queda (caiu, pela série de onde caiu): mesmo valor da zona — A 30 · B 25 · C 20
const DIV_RANK: Record<Div, number> = { A: 4, B: 3, C: 2, D: 1, V: 0 }
const CAMPEAO: Record<Div, number> = { A: 65, B: 50, C: 35, D: 20, V: 12 }
const ZONA: Record<Div, number> = { A: 30, B: 25, C: 20, D: 0, V: 0 }
const QUEDA: Record<Div, number> = { A: 30, B: 25, C: 20, D: 0, V: 0 }
export function seasonRewards(tables: Record<Div, SimTeam[]>): Record<number, number> {
  const newPl = computePromotions(tables)
  const out: Record<number, number> = {}
  for (const d of DIVS) tables[d].forEach((t, i) => {
    if (!t.human || t.teamId < 0) return // só humanos têm careerCoins; os bots ficam no clubCash
    let delta = 0
    if (i === 0) delta += CAMPEAO[d] // campeão da divisão
    if (i < 4) delta += ZONA[d] // top 4: acesso nas de baixo, "manter entre os 4" na A
    const nd = newPl[teamKey(t)] as Div | undefined
    if (nd && DIV_RANK[nd] < DIV_RANK[d]) delta -= QUEDA[d] // queda (caiu da série d)
    out[t.teamId] = delta
  })
  return out
}
// caixa-base por divisão (clubes de cima mais ricos) + os lucros das vendas do
// mercado + prêmios. Também usado pra "curar" salas sem caixa.
export const DIV_BASE_CASH: Record<Div, number> = { A: 250, B: 200, C: 150, D: 100, V: 60 }
// prêmios da temporada pros OUTROS times (CPUs + reservas de fundo, tudo que não
// é humano nem bot fiador) — mesmo cálculo do seasonRewards, mas por teamKey (o
// CPU não tem id numérico). Alimenta o caixa deles pra aparecer real no ranking.
export function clubRewards(tables: Record<Div, SimTeam[]>): Record<string, number> {
  const newPl = computePromotions(tables)
  const out: Record<string, number> = {}
  for (const d of DIVS) tables[d].forEach((t, i) => {
    if (t.human) return // humano tem caixa em careerCoins; todo bot fica no clubCash
    let delta = 0
    if (i === 0) delta += CAMPEAO[d]
    if (i < 4) delta += ZONA[d]
    const nd = newPl[teamKey(t)] as Div | undefined
    if (nd && DIV_RANK[nd] < DIV_RANK[d]) delta -= QUEDA[d]
    out[teamKey(t)] = delta
  })
  return out
}
// campeão de cada divisão nesta temporada (chave do time → divisão) — pro ranking
export function seasonChampions(tables: Record<Div, SimTeam[]>): Record<string, Div> {
  const out: Record<string, Div> = {}
  for (const d of DIVS) if (tables[d][0]) out[teamKey(tables[d][0])] = d
  return out
}

export interface Goal { name: string; min: number; home: boolean }
export interface SimMatch { h: string; a: string; hg: number; ag: number; hId: number; aId: number; you: boolean; hum: boolean; goals: Goal[] }

// joga UMA divisão até a rodada `round` (determinístico), acumulando artilharia.
// `lastMatches` recebe os jogos da ÚLTIMA rodada jogada (placar + quem fez os
// gols e em que minuto) pra exibir com a simulação.
// tática de um humano é POR JOGO: `tactics[teamId]` é um mapa rodada→tática; numa
// rodada r vale a última tática escolhida numa rodada <= r (senão equilíbrio).
export type RoundTactics = Record<number, Record<number, Tac>>
function tacAt(tactics: RoundTactics, teamId: number, r: number): Tac {
  const byRound = tactics[teamId]; if (!byRound) return 'equilibrio'
  let best: Tac = 'equilibrio', bestK = -1
  for (const k in byRound) { const kn = +k; if (kn <= r && kn > bestK) { bestK = kn; best = byRound[kn] } }
  return best
}
// 🧹 RESPIRO: banner de ENSINO que fica INTEIRO nas primeiras N temporadas em que
// aparece e depois vira uma pílula pequena — a informação NUNCA some (abre no
// toque). Conta 1 "vista" por temporada (não por render). Regra do Diego: ensinar
// BASTANTE antes de encolher (N=6, 1 número pra calibrar). Aviso de REGRA DA
// JOGADA (vagas, piso, saldo, transfer ban, venda séria) NUNCA passa por aqui.
const ENSINO_VEZES = 6
function EnsinoPilula({ k, pill, seasonNo, children }: { k: string; pill: string; seasonNo: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const full = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(`esc-ensino-${k}`) ?? '{"n":0,"last":0}') as { n: number; last: number }
      if (raw.last !== seasonNo) { raw.n += 1; raw.last = seasonNo; localStorage.setItem(`esc-ensino-${k}`, JSON.stringify(raw)) }
      return raw.n <= ENSINO_VEZES
    } catch { return true }
  }, [k, seasonNo])
  if (full || open) return <>{children}</>
  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={() => setOpen(true)} style={{ border: `2px solid ${INK}`, borderRadius: 999, background: '#fff', fontWeight: 800, fontSize: 10.5, padding: '3px 11px', cursor: 'pointer', color: 'rgba(0,0,0,.65)' }}>{pill}</button>
    </div>
  )
}

// escalação (XI) de um humano é POR JOGO, igual à tática: `lineups[teamId]` é um
// mapa rodada→ids; na rodada r vale a última escolha numa rodada <= r. Se não há
// escolha (ou a escalação não tem 11 válidos), cai pro bestXI automático.
export type RoundLineups = Record<number, Record<number, string[]>>
function lineupAt(lineups: RoundLineups, teamId: number, r: number, squad: PoolCard[], formation?: FormationKey): PoolCard[] {
  const need4 = formation ? FORMATIONS[formation] : NEED
  const byRound = lineups[teamId]
  let bestK = -1, ids: string[] | null = null
  if (byRound) for (const k in byRound) { const kn = +k; if (kn <= r && kn > bestK) { bestK = kn; ids = byRound[kn] } }
  if (!ids) return bestXI(squad, formation)
  const map = new Map(squad.map(c => [c.id, c]))
  const xi = ids.map(id => map.get(id)).filter((c): c is PoolCard => !!c)
  if (xi.length === 11) return xi
  // PARCIAL: se um titular saiu (vendido), mantém os que ficaram e completa SÓ
  // aquela vaga com o melhor do banco na posição — não remonta o time inteiro
  // (evita o auto-mudar titular que o usuário não pediu). Respeita a formação.
  const used = new Set(xi.map(c => c.id))
  for (const p of SECTORS) {
    let need = need4[p] - xi.filter(c => c.pos === p).length
    if (need <= 0) continue
    const bench = squad.filter(c => c.pos === p && !used.has(c.id)).sort((a, b) => mid(b) - mid(a))
    for (const c of bench) { if (need <= 0) break; xi.push(c); used.add(c.id); need-- }
  }
  return xi.length === 11 ? xi : bestXI(squad, formation)
}
// 🎭 EVENTOS: ajuste de força POR RODADA (teamId → rodada → delta). Usado no
// "escalar assim mesmo" da noitada (-2 SÓ naquele jogo). Tem que ser por rodada:
// mexer na carta re-simularia o passado (a temporada inteira nasce da semente).
export type RoundMods = Record<number, Record<number, number>>
function simDivTo(teams: SimTeam[], div: Div, seed: number, round: number, scorers: Map<string, SeasonScorer>, tactics: RoundTactics, lineups: RoundLineups, lastMatches?: SimMatch[], capElite = 1.2, realGoals = false, fairBoost = false, mods: RoundMods = {}) {
  const rng = mulberry((seed ^ 0x51ED2C) >>> 0)
  const fix = roundRobin(20)
  // RODÍZIO DE CALENDÁRIO por temporada: o esqueleto do round-robin é fixo, mas
  // embaralhamos QUAL time ocupa cada vaga (0..19) usando a semente da temporada.
  // Assim o adversário da rodada 1 (e a ordem toda) muda a cada ano — acaba o
  // "toda temporada começa contra o mesmo time". Determinístico (semente sincronizada
  // = mesmo calendário em todos os aparelhos no online). Relabelar vagas preserva o
  // round-robin completo (todo mundo joga com todo mundo, ida e volta).
  const slot = shuffle(Array.from({ length: 20 }, (_, i) => i), mulberry((seed ^ 0x1B873593) >>> 0))
  // credita os gols na artilharia da temporada e devolve os eventos (nome + minuto)
  // peso de artilharia por NÍVEL: um filler (nível ~40) quase não marca; um craque
  // (nível ~85) leva a maioria. Antes era só por posição — por isso Bola Murcha e
  // Trapalhão viravam artilheiros. n²: acentua a diferença entre perna-de-pau e craque.
  const goalW = (c: PoolCard) => { const n = Math.max(0, (mid(c) - 40) / 42); return 0.12 + n * n * 1.8 }
  const scoreGoals = (t: SimTeam, xi: PoolCard[], goals: number): { name: string; min: number }[] => {
    const evs: { name: string; min: number }[] = []
    // "DIA" do jogador (por partida): 0,4×–2,6× no peso do gol — o folclórico
    // iluminado rouba a cena hoje; na média da temporada o nível manda.
    const day = new Map<string, number>()
    for (const c of xi) day.set(c.id, 0.4 + rng() * 2.2)
    for (let g = 0; g < goals; g++) {
      const pool = xi.map(c => ({ c, w: (c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : (/chilavert|ceni/i.test(c.name) ? 0.05 : 0)) * goalW(c) * (day.get(c.id) ?? 1) }))
      const total = pool.reduce((s, p) => s + p.w, 0)
      let r = rng() * total, pick = pool[0]?.c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      // 🛟 XI vazio (save torto / time sem elenco) → não crasha a tela: só não credita
      // artilheiro nesse gol (o placar já foi somado à parte). Mesma guarda da Copa.
      if (!pick) continue
      const key = `${t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { name: pick.name, teamName: t.name, teamId: t.teamId, div, goals: 1, you: t.you, human: t.human, rival: t.rival, dorm: t.dorm, cardId: pick.id })
      const min = rng() < 0.08 ? 90 + 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 90) // acréscimos SÓ até 90+3 (o relógio do card vai até 93)
      evs.push({ name: pick.name, min })
    }
    return evs
  }
  const nr = Math.min(round, 38)
  for (let r = 0; r < nr; r++) for (const [hi, ai] of fix[r]) {
    const H = teams[slot[hi]], A = teams[slot[ai]]
    if (!H || !A) continue // série fora do padrão (save antigo) — nunca derruba o jogo
    // humano usa a tática que ELE escolheu (sincronizada); CPU sorteia
    const th: Tac = H.human ? tacAt(tactics, H.teamId, r) : TACS[Math.floor(rng() * 3)]
    const ta: Tac = A.human ? tacAt(tactics, A.teamId, r) : TACS[Math.floor(rng() * 3)]
    // XI daquele jogo: humano usa a escalação que ELE montou (por rodada); CPU o fixo
    const hxi = H.human ? lineupAt(lineups, H.teamId, r, H.squad, H.formation) : H.xi
    const axi = A.human ? lineupAt(lineups, A.teamId, r, A.squad, A.formation) : A.xi
    const fh = rollForm(hxi, th, ta, rng), fa = rollForm(axi, ta, th, rng)
    // times de CPU NATIVOS ganham a força-base da divisão (pra as séries serem
    // disputadas de verdade). Humano e rivais escolhidos NÃO ganham (jogam com o
    // elenco real que montaram).
    const BM = fairBoost ? CPU_DIV_BOOST_FAIR : CPU_DIV_BOOST
    const bh = (!H.human && !H.rival) ? BM[div] : 0, ba = (!A.human && !A.rival) ? BM[div] : 0
    fh.atk += bh; fh.def += bh; fa.atk += ba; fa.def += ba
    // 🎭 evento "escalar assim mesmo": queda pequena SÓ na rodada do causo (humano)
    const mh = H.human ? (mods[H.teamId]?.[r] ?? 0) : 0, ma = A.human ? (mods[A.teamId]?.[r] ?? 0) : 0
    fh.atk += mh; fh.def += mh; fa.atk += ma; fa.def += ma
    // SORTE: cada time tem um "dia" (bom/ruim) por jogo — o forte às vezes tropeça,
    // o fraco às vezes surpreende. NÍVEL segue mandando (na média o melhor ganha),
    // mas evita goleada de campeonato (líder com 104 pts) e dá zebra de vez em quando.
    const lkH = 0.85 + rng() * 0.30, lkA = 0.85 + rng() * 0.30
    fh.atk *= lkH; fh.def *= lkH; fa.atk *= lkA; fa.def *= lkA
    // qualidade ABSOLUTA do ataque escala os gols: time fraco (cheio de filler)
    // marca menos no geral — não só a diferença atk-def conta. Assim as divisões
    // de baixo (várzea) não inflam a artilharia com nomes de brincadeira.
    const qual = (atk: number) => Math.max(0.5, Math.min(capElite, atk / 66))
    const G = realGoals ? GOAL_TUNE.v3 : GOAL_TUNE.v2
    const lh = Math.max(0.08, (G.base + (fh.atk - fa.def) * G.coef + G.home) * qual(fh.atk)), la = Math.max(0.08, (G.base + (fa.atk - fh.def) * G.coef) * qual(fa.atk))
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    const hev = scoreGoals(H, hxi, hg), aev = scoreGoals(A, axi, ag)
    H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg
    if (hg > ag) { H.pts += 3; H.w++; A.l++ } else if (ag > hg) { A.pts += 3; A.w++; H.l++ } else { H.pts++; A.pts++; H.d++; A.d++ }
    if (lastMatches && r === nr - 1) {
      const goals: Goal[] = [...hev.map(e => ({ ...e, home: true })), ...aev.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
      lastMatches.push({ h: H.name, a: A.name, hg, ag, hId: H.teamId, aId: A.teamId, you: !!(H.you || A.you), hum: !!(H.human || A.human), goals })
    }
  }
}
export function sortDiv(teams: SimTeam[]) { return teams.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf) }

// simula as 4 divisões até a rodada atual — resultado idêntico em todos os aparelhos
export function simulatePyramid(world: Record<Div, SimTeam[]>, seed: number, round: number, tactics: RoundTactics = {}, lineups: RoundLineups = {}, capElite = 1.2, realGoals = false, fairBoost = false, mods: RoundMods = {}): { tables: Record<Div, SimTeam[]>; scorers: SeasonScorer[]; scorersAll: SeasonScorer[]; matches: Record<Div, SimMatch[]>; goalsByCard: Record<string, number>; divTop: Record<Div, SeasonScorer | undefined> } {
  const scorers = new Map<string, SeasonScorer>()
  const tables = {} as Record<Div, SimTeam[]>
  const matches = {} as Record<Div, SimMatch[]>
  for (const d of DIVS) {
    const teams = world[d].map(t => ({ ...t, xi: t.xi, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }))
    const lm: SimMatch[] = []
    simDivTo(teams, d, (seed ^ (d.charCodeAt(0) * 2654435761)) >>> 0, round, scorers, tactics, lineups, lm, capElite, realGoals, fairBoost, mods)
    tables[d] = sortDiv(teams)
    matches[d] = lm
  }
  // gols por carta (todos os jogadores) — pra mostrar gols no Elenco
  const goalsByCard: Record<string, number> = {}
  for (const s of scorers.values()) if (s.cardId) goalsByCard[s.cardId] = s.goals
  // ARTILHEIRO de cada divisão (o #1 em gols) — pra premiar time + subir piso
  const divTop = {} as Record<Div, SeasonScorer | undefined>
  for (const s of scorers.values()) if (s.goals > 0 && (!divTop[s.div] || s.goals > divTop[s.div]!.goals)) divTop[s.div] = s
  const sorted = [...scorers.values()].sort((a, b) => b.goals - a.goals)
  return { tables, scorers: sorted.slice(0, 20), scorersAll: sorted, matches, goalsByCard, divTop }
}
// prêmio do artilheiro: CAIXA do time por divisão (A 30 · B 20 · C 15 · D 10) +
// PISO do jogador sobe SEMPRE +10 (fixo, qualquer divisão e Copa). O piso é fixo
// baixo de propósito por causa do salário (salário = piso ÷ 10): se subisse muito,
// a folha do artilheiro explodia. Vale offline/online, rival/bot/humano.
const DIV_SCORER_BONUS: Record<Div, number> = { A: 30, B: 20, C: 15, D: 10, V: 6 } // caixa do TIME
const SCORER_PISO_BONUS = 10 // 🔒 piso do artilheiro: +10 fixo (qualquer divisão / Copa)
export function scorerRewards(divTop: Record<Div, SeasonScorer | undefined>): { rewards: Record<number, number>; clubRewards: Record<string, number>; values: Record<string, number> } {
  const rewards: Record<number, number> = {}, clubRewards: Record<string, number> = {}, values: Record<string, number> = {}
  for (const d of DIVS) {
    const s = divTop[d]; if (!s) continue
    const b = DIV_SCORER_BONUS[d]
    values[s.name] = (values[s.name] ?? 0) + SCORER_PISO_BONUS // piso do jogador: +10 fixo
    if (s.human) rewards[s.teamId] = (rewards[s.teamId] ?? 0) + b // caixa do humano (por divisão)
    else { const key = s.teamId >= 0 ? `m${s.teamId}` : s.teamName; clubRewards[key] = (clubRewards[key] ?? 0) + b } // caixa do bot/rival
  }
  return { rewards, clubRewards, values }
}

// ── COPA LEGENDS: mata-mata dos 16 (top-4 de cada divisão), sorteio aleatório,
// ida e volta, final única, pênaltis no empate. Determinística (semente +
// temporada + classificação), então bate igual offline e em todos os clientes
// online. Reaproveita a MESMA simulação de jogo da liga (rollForm/poisson). ──
export interface CopaTie { a: SimTeam; b: SimTeam; aDiv: Div; bDiv: Div; aggA: number; aggB: number; pens?: [number, number]; win: 'a' | 'b'; goals: Goal[]; legs: [number, number][]; legGoals: Goal[][] }
export interface CopaRound { name: string; ties: CopaTie[] }
export interface CopaResult { rounds: CopaRound[]; champion: SimTeam | null; championDiv: Div | null; vice: SimTeam | null; viceDiv: Div | null; scorers: SeasonScorer[]; topScorer?: SeasonScorer }
const COPA_CHAMP_COINS = 25 // caixa do campeão da Copa
const COPA_VICE_COINS = 15 // vice-campeão (10 a menos que o campeão)
const COPA_SCORER_BONUS = 16 // caixa do time pelo artilheiro da Copa (o PISO dele sobe +10 fixo, ver copaRewards)
// prestígio por divisão na Copa: A favorita, D azarão (soma no ataque e defesa).
const COPA_DIV_STRENGTH: Record<Div, number> = { A: 10, B: 6, C: 3, D: 0, V: 0 } // Várzea não joga a Copa (só A-D)

export function computeCopa(tables: Record<Div, SimTeam[]>, seed: number, seasonNo: number, capElite = 1.2, realGoals = false): CopaResult {
  const rng = mulberry((seed ^ (seasonNo * 0x9E3779B1) ^ 0xC0FA5EED) >>> 0)
  let field: { t: SimTeam; div: Div }[] = []
  // 🌱 a VÁRZEA fica FORA da Copa (peladeiro não joga mata-mata nacional 🍺) — o
  // campo segue sendo o top-4 das séries A-D, 16 times como sempre.
  for (const d of DIVS) { if (d === 'V') continue; for (const t of (tables[d] ?? []).slice(0, 4)) field.push({ t, div: d }) }
  if (field.length < 2) return { rounds: [], champion: null, championDiv: null, vice: null, viceDiv: null, scorers: [] }
  field = shuffle(field, rng)
  const scorers = new Map<string, SeasonScorer>()
  const goalW = (c: PoolCard) => { const n = Math.max(0, (mid(c) - 40) / 42); return 0.12 + n * n * 1.8 }
  const credit = (e: { t: SimTeam; div: Div }, xi: PoolCard[], goals: number): { name: string; min: number }[] => {
    const evs: { name: string; min: number }[] = []
    // "dia" do jogador também na Copa (por jogo)
    const day = new Map<string, number>()
    for (const c of xi) day.set(c.id, 0.4 + rng() * 2.2)
    for (let g = 0; g < goals; g++) {
      const pool = xi.map(c => ({ c, w: (c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : (/chilavert|ceni/i.test(c.name) ? 0.05 : 0)) * goalW(c) * (day.get(c.id) ?? 1) }))
      const total = pool.reduce((s, p) => s + p.w, 0); let r = rng() * total, pick = pool[0]?.c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      if (!pick) continue
      const key = `${e.t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { name: pick.name, teamName: e.t.name, teamId: e.t.teamId, div: e.div, goals: 1, you: e.t.you, human: e.t.human, rival: e.t.rival, cardId: pick.id })
      evs.push({ name: pick.name, min: 1 + Math.floor(rng() * 90) })
    }
    return evs
  }
  const leg = (H: { t: SimTeam; div: Div }, A: { t: SimTeam; div: Div }, homeAdv: boolean) => {
    const th = TACS[Math.floor(rng() * 3)], ta = TACS[Math.floor(rng() * 3)]
    const fh = rollForm(H.t.xi, th, ta, rng), fa = rollForm(A.t.xi, ta, th, rng)
    // na Copa (cruzando divisões) a força vem do ELENCO + um gradiente de prestígio
    // por divisão (A mais forte, D o azarão) — NÃO o boost da liga (que é
    // compensação de filler dentro da série e até favorece a C). Assim a Série A é
    // favorita e o time de baixo é o Davi: dá zebra na sorte, mas não é moeda.
    const bh = COPA_DIV_STRENGTH[H.div], ba = COPA_DIV_STRENGTH[A.div]
    fh.atk += bh; fh.def += bh; fa.atk += ba; fa.def += ba
    const lkH = 0.85 + rng() * 0.30, lkA = 0.85 + rng() * 0.30
    fh.atk *= lkH; fh.def *= lkH; fa.atk *= lkA; fa.def *= lkA
    const qual = (atk: number) => Math.max(0.5, Math.min(capElite, atk / 66))
    const G = realGoals ? GOAL_TUNE.v3 : GOAL_TUNE.v2
    const lh = Math.max(0.08, (G.base + (fh.atk - fa.def) * G.coef + (homeAdv ? G.home : 0)) * qual(fh.atk))
    const la = Math.max(0.08, (G.base + (fa.atk - fh.def) * G.coef) * qual(fa.atk))
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    return { hg, ag, hEvs: credit(H, H.t.xi, hg), aEvs: credit(A, A.t.xi, ag) }
  }
  const playTie = (a: { t: SimTeam; div: Div }, b: { t: SimTeam; div: Div }, single: boolean): CopaTie => {
    let aggA = 0, aggB = 0
    const goals: Goal[] = []
    const legs: [number, number][] = [] // placar de cada jogo (ida, volta) — [gols A, gols B]
    const legGoals: Goal[][] = [] // gols de cada jogo separados (home = A marcou), pra animar ida e depois volta
    const l1 = leg(a, b, true); aggA += l1.hg; aggB += l1.ag // ida: a joga em casa
    const g1: Goal[] = [...l1.hEvs.map(e => ({ ...e, home: true })), ...l1.aEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
    g1.forEach(e => goals.push(e)); legs.push([l1.hg, l1.ag]); legGoals.push(g1)
    if (!single) {
      const l2 = leg(b, a, true); aggB += l2.hg; aggA += l2.ag // volta: b em casa
      const g2: Goal[] = [...l2.aEvs.map(e => ({ ...e, home: true })), ...l2.hEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
      g2.forEach(e => goals.push(e)); legs.push([l2.ag, l2.hg]); legGoals.push(g2)
    }
    goals.sort((x, y) => x.min - y.min)
    let pens: [number, number] | undefined, win: 'a' | 'b'
    if (aggA === aggB) { let x = 2 + Math.floor(rng() * 4), y = 2 + Math.floor(rng() * 4); if (x === y) (rng() < 0.5 ? x++ : y++); pens = [x, y]; win = x > y ? 'a' : 'b' }
    else win = aggA > aggB ? 'a' : 'b'
    return { a: a.t, b: b.t, aDiv: a.div, bDiv: b.div, aggA, aggB, pens, win, goals, legs, legGoals }
  }
  const roundNames = ['Oitavas', 'Quartas', 'Semifinal', 'Final']
  const rounds: CopaRound[] = []
  let cur = field
  let ri = Math.max(0, roundNames.length - Math.ceil(Math.log2(cur.length)))
  while (cur.length > 1) {
    const single = cur.length === 2 // final = jogo único
    const ties: CopaTie[] = [], next: { t: SimTeam; div: Div }[] = []
    for (let i = 0; i + 1 < cur.length; i += 2) {
      const tie = playTie(cur[i], cur[i + 1], single)
      ties.push(tie); next.push(tie.win === 'a' ? cur[i] : cur[i + 1])
    }
    rounds.push({ name: roundNames[ri] ?? `Fase ${ri + 1}`, ties }); cur = next; ri++
  }
  const champ = cur[0] ?? null
  // vice = quem perdeu a final (última fase, jogo único)
  const fin = rounds[rounds.length - 1]
  const ft = fin && fin.ties.length === 1 ? fin.ties[0] : null
  const vice = ft ? (ft.win === 'a' ? ft.b : ft.a) : null
  const viceDiv = ft ? (ft.win === 'a' ? ft.bDiv : ft.aDiv) : null
  const list = [...scorers.values()].sort((a, b) => b.goals - a.goals)
  return { rounds, champion: champ?.t ?? null, championDiv: champ?.div ?? null, vice, viceDiv, scorers: list.slice(0, 20), topScorer: list[0] }
}

// prêmios da Copa: campeão leva moedas (igual Série A) + o artilheiro rende ao
// time e sobe o piso do jogador. Mesmo formato do seasonRewards/scorerRewards
// pra fundir nos args da virada de temporada.
export function copaRewards(copa: CopaResult): { rewards: Record<number, number>; clubRewards: Record<string, number>; values: Record<string, number>; championKey: string | null } {
  const rewards: Record<number, number> = {}, clubRewards: Record<string, number> = {}, values: Record<string, number> = {}
  let championKey: string | null = null
  const ch = copa.champion
  if (ch) {
    championKey = teamKey(ch)
    if (ch.human && ch.teamId >= 0) rewards[ch.teamId] = (rewards[ch.teamId] ?? 0) + COPA_CHAMP_COINS
    else clubRewards[championKey] = (clubRewards[championKey] ?? 0) + COPA_CHAMP_COINS
  }
  const vc = copa.vice
  if (vc) {
    const vk = teamKey(vc)
    if (vc.human && vc.teamId >= 0) rewards[vc.teamId] = (rewards[vc.teamId] ?? 0) + COPA_VICE_COINS
    else clubRewards[vk] = (clubRewards[vk] ?? 0) + COPA_VICE_COINS
  }
  const ts = copa.topScorer
  if (ts) {
    values[ts.name] = (values[ts.name] ?? 0) + SCORER_PISO_BONUS // piso do artilheiro da Copa: +10 fixo (igual à liga)
    if (ts.human) rewards[ts.teamId] = (rewards[ts.teamId] ?? 0) + COPA_SCORER_BONUS // caixa do time (Copa) — inalterado
    else { const k = ts.teamId >= 0 ? `m${ts.teamId}` : ts.teamName; clubRewards[k] = (clubRewards[k] ?? 0) + COPA_SCORER_BONUS }
  }
  return { rewards, clubRewards, values, championKey }
}

// ── VISÃO das 4 divisões (mesmo visual das outras tabelas do jogo) ──
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })
// 🎨 COR SÓLIDA de cada lado do placar da Copa (estilo Brasfoot). A cor DIZ quem é
// o time: VOCÊ e sua SAF = cor do seu TIER (com brilho); RIVAL = cor fixa do jogo
// (paleta FORA dos tiers); BOT = mesma paleta porém APAGADA (dois bots se distinguem
// pelo matiz); outro humano (online) = a cor de login dele. `mark` = selo do lado.
const COPA_SIDE_COLORS = ['#C2452F', '#2E6FC2', '#123A63', '#B5541F', '#9C1F2E', '#0E7C86', '#3A5A8A', '#7A3E2A', '#8A3560', '#B0491F', '#155E73', '#963D2E']
const copaSideColor = (name: string): string => { let h = 0; for (let i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) >>> 0; return COPA_SIDE_COLORS[h % COPA_SIDE_COLORS.length] }
type CopaFill = { bg: string; ink: string; holo: number; mark: string }
const _lum = (r: number, g: number, b: number) => 0.3 * r + 0.59 * g + 0.11 * b
const _inkFor = (hex: string) => { const n = parseInt(hex.slice(1), 16); return _lum((n >> 16) & 255, (n >> 8) & 255, n & 255) > 150 ? '#0c0c0c' : '#ffffff' }
const TIER_INK: Record<string, string> = { bege: '#0c0c0c', verde: '#ffffff', roxo: '#ffffff', prata: '#0c0c0c', ouro: '#0c0c0c' }
type TeamKind = 'you' | 'saf' | 'human' | 'rival' | 'bot'
function fillFor(kind: TeamKind, name: string, humanColor?: string): CopaFill {
  if (kind === 'you' || kind === 'saf') { const p = myApoioPerk() ?? APOIO_PERKS.bege; return { bg: p.grad, ink: TIER_INK[p.tier], holo: p.holo, mark: kind === 'you' ? '👤' : '💼' } }
  if (kind === 'human') { const solid = humanColor ?? '#3A7CA5'; return { bg: solid, ink: _inkFor(solid), holo: 0, mark: '🔥' } }
  const hex = copaSideColor(name), n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  if (kind === 'rival') return { bg: hex, ink: _inkFor(hex), holo: 0, mark: '⚔️' }
  const mx = (v: number) => Math.round(v * 0.4 + 170 * 0.6), mr = mx(r), mg = mx(g), mb = mx(b) // bot: dessaturado
  return { bg: `rgb(${mr},${mg},${mb})`, ink: _lum(mr, mg, mb) > 150 ? '#0c0c0c' : '#ffffff', holo: 0, mark: '' }
}
function copaSideFill(t: SimTeam, colors: Record<number, FCol>, safName?: string): CopaFill {
  const kind: TeamKind = t.you ? 'you' : (safName && t.name === safName) ? 'saf' : t.human ? 'human' : t.rival ? 'rival' : 'bot'
  return fillFor(kind, t.name, colors[t.teamId]?.solid)
}
// os DOIS lados coloridos como fundo do card (com o brilho do tier quando houver)
const CopaHalves = ({ fL, fR }: { fL: CopaFill; fR: CopaFill }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 0 }}>
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: fL.bg }}>{fL.holo > 0 && <ApoioSheen holo={fL.holo} />}</div>
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: fR.bg }}>{fR.holo > 0 && <ApoioSheen holo={fR.holo} />}</div>
  </div>
)
// pílula translúcida escura pra textos centrais (relógio/artilheiro/ida-volta) ficarem legíveis sobre qualquer cor
const copaCenterChip: React.CSSProperties = { background: 'rgba(8,8,10,.55)', borderRadius: 7, padding: '1px 7px', color: '#fff' }

// ── 💰 FINANÇAS (aba Clube › Finanças): Extrato (tudo que entra/sai) +
//    Transferências (compras/vendas com lucro). Lê o livro-caixa (careerLedger),
//    que é só um registro — nunca mexe no dinheiro de verdade. ──
const FIN_RED = '#C2452F'

// 🏛️ MULTICLUBES — liberado pra TODOS na carreira SOLO (offline). Não-Lenda vê a área
// com o botão APOIE; Lenda com 4.000 moedas compra. NUNCA aparece no online (o motor é
// solo-only: reducer ignora BUY/SWITCH em modo online, e o estado guarda 1 clube só).

// 🏛️ MULTICLUBES · Fase 1 (a COMPRA): painel pra comprar um 2º clube da Série D por
// 4.000 moedas (só Lenda). O seletor + "clube dormindo" vêm nas próximas fases.
function MultiClubeBuy({ jaTem, opcoes, coins, preco, isLenda, onBuy }: {
  jaTem?: string; opcoes: string[]; coins: number; preco: number; isLenda: boolean; onBuy: (team: string) => void
}) {
  const [pick, setPick] = useState<string | null>(null)
  const lock: React.CSSProperties = { fontFamily: 'system-ui', fontSize: 10.5, fontWeight: 800, background: '#CBBF9E', color: 'rgba(0,0,0,.65)', border: '2px solid #000', borderRadius: 9, padding: '7px 10px', marginTop: 8 }
  if (jaTem) return (
    <div style={{ ...box('#0C0C0C'), padding: 13, color: '#fff', marginTop: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 14, color: GOLD, ...OSWALD, margin: 0 }}>🏛️ MULTICLUBES</p>
      <p style={{ fontFamily: 'system-ui', fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>Você já comanda um 2º clube: <b style={{ color: GOLD }}>{jaTem}</b>. <span style={{ opacity: .6 }}>Entre as temporadas você passa o comando pro outro (o que sai dorme e joga sozinho).</span></p>
    </div>
  )
  const faltam = preco - coins
  return (
    <div style={{ ...box('#0C0C0C'), padding: 13, color: '#fff', marginTop: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 15, color: GOLD, ...OSWALD, margin: 0 }}>🏛️ Compre um SEGUNDO CLUBE</p>
      <p style={{ fontFamily: 'system-ui', fontSize: 10.5, color: 'rgba(255,255,255,.82)', margin: '5px 0 0', lineHeight: 1.45 }}>Escolha um clube que <b>hoje joga a Série D</b> — ele veste a <b>sua cor</b>, <b>dorme</b> e você assume o comando <b>entre as temporadas</b>. Custa <b>4.000 🪙</b> · regalia do tier <b>Lenda 👑</b>.</p>
      {!isLenda && (
        <>
          <div style={lock}>🔒 Regalia de <b>Lenda 👑</b> — vire Lenda pra comandar 2 clubes.</div>
          <ApoieButton startScreen="choice" trigger={(open) => (
            <button onClick={open} style={{ width: '100%', marginTop: 9, border: '3px solid #000', borderRadius: 12, padding: 11, fontWeight: 900, fontSize: 14, background: 'linear-gradient(135deg,#FFE79A,#FFC400,#E8A200)', color: '#000', cursor: 'pointer', ...OSWALD }}>👑 VIRAR LENDA NO APOIE</button>
          )} />
        </>
      )}
      {isLenda && faltam > 0 && <div style={lock}>🔒 Faltam <b>{faltam.toLocaleString('pt-BR')}</b> 🪙 — custa {preco.toLocaleString('pt-BR')}, você tem {coins.toLocaleString('pt-BR')}.</div>}
      {isLenda && faltam <= 0 && (
        <>
          <div style={{ marginTop: 8, maxHeight: 160, overflowY: 'auto' }}>
            {opcoes.length === 0 && <p style={{ fontFamily: 'system-ui', fontSize: 10.5, opacity: .6 }}>Nenhum clube da Série D disponível agora.</p>}
            {opcoes.map(t => (
              <button key={t} onClick={() => setPick(t)} style={{ display: 'block', width: '100%', textAlign: 'left', border: '2px solid #000', borderRadius: 9, padding: '7px 10px', marginTop: 5, fontWeight: 900, fontSize: 12, background: pick === t ? GOLD : '#fff', color: '#000', cursor: 'pointer', ...OSWALD }}>🏟️ {t}{pick === t ? '  ✓' : ''}</button>
            ))}
          </div>
          <button disabled={!pick} onClick={() => pick && onBuy(pick)} style={{ width: '100%', marginTop: 9, border: '3px solid #000', borderRadius: 12, padding: 11, fontWeight: 900, fontSize: 13, background: pick ? GOLD : '#555', color: pick ? '#000' : 'rgba(255,255,255,.5)', cursor: pick ? 'pointer' : 'default', ...OSWALD }}>💰 COMPRAR {pick ? pick.toUpperCase() : 'POR'} · {preco.toLocaleString('pt-BR')} 🪙</button>
        </>
      )}
    </div>
  )
}

// ── 💼 AGÊNCIA / ESCRITÓRIO DO EMPRESÁRIO (aba Clube › Agência) ──────────────
// Mostra as cartas ganhas NESTA carreira por raridade e a renda por temporada.
// Cada categoria só rende quando desbloqueada (estádio/SAF). Tocar numa carta
// abre a carta cheia com a bio (mesmo card do álbum).
function EscritorioTab({ cards, st, hasFilial }: { cards: EmpCard[]; st: StadiumSave | undefined; hasFilial: boolean }) {
  const [open, setOpen] = useState<EmpCard | null>(null)
  const { total, by } = empresarioIncome(cards, st, hasFilial)
  const catCards = (k: EmpCat) => cards.filter(c => empCat(c) === k)
  return (
    <>
      {/* RESUMO: renda por temporada */}
      <div style={{ ...box(), background: `linear-gradient(160deg, ${GREEN}, #14401f)`, color: '#fff', padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 800 }}>💼 Renda do Empresário</div>
        <div style={{ ...OSWALD, fontSize: 27, fontWeight: 900, lineHeight: 1, marginTop: 2 }}>+{total} 🪙 <span style={{ fontSize: 13, fontWeight: 700, opacity: .75 }}>/ temporada</span></div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginTop: 6, lineHeight: 1.4 }}>Cai no caixa toda virada. Vale só pelas cartas de categorias <b>desbloqueadas</b> — puxe o estádio e a SAF pra liberar as raras.</div>
      </div>

      {/* CATEGORIAS: quanto tem, o que rende, o que falta destravar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {EMP_ORDER.map(k => {
          const b = by[k], m = EMP_META[k], list = catCards(k)
          return (
            <div key={k} style={{ ...box(b.unlocked ? '#fff' : '#F1EBD9'), padding: '10px 12px', opacity: b.unlocked ? 1 : .72 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...OSWALD, fontWeight: 900, fontSize: 14 }}>{m.label} <span style={{ fontWeight: 700, fontSize: 11, color: '#8a8069' }}>+{m.value}/carta</span></div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8a8069' }}>{list.length} {list.length === 1 ? 'carta' : 'cartas'}{b.unlocked ? '' : ` · 🔒 destrava: ${m.req}`}</div>
                </div>
                <div style={{ ...OSWALD, fontWeight: 900, fontSize: 15, color: b.unlocked ? GREEN : '#b3a688', whiteSpace: 'nowrap' }}>{b.unlocked ? `+${b.income}` : '🔒'}</div>
              </div>
              {list.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 9 }}>
                  {list.map((c, i) => (
                    <button key={i} onClick={() => setOpen(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FBF6E9', border: `2px solid ${INK}`, borderRadius: 9, boxShadow: `2px 2px 0 0 ${INK}`, padding: '7px 9px', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ ...OSWALD, fontWeight: 800, fontSize: 9.5, background: INK, color: '#fff', borderRadius: 6, padding: '1px 6px' }}>{c.pos}</span>
                      <span style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: INK, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#8a8069', whiteSpace: 'nowrap' }}>{c.club} · {c.year}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {cards.length === 0 && (
        <div style={{ ...box('#FBF6E9'), padding: 16, textAlign: 'center', fontWeight: 700, color: '#8a7d59', fontSize: 12.5, marginTop: 10 }}>Sua agência está vazia. Seja <b>campeão</b> pra ganhar cartas no pacote — elas entram aqui e rendem por temporada.</div>
      )}

      {/* modal: carta cheia com bio */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 300 }}>
            <CollectibleCard name={open.name} club={open.club} year={open.year} pos={open.pos} fame={open.fame} folk={open.folk} promessa={open.promessa} big showBio />
            <button onClick={() => setOpen(null)} style={{ width: '100%', marginTop: 10, background: GOLD, color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: 11, fontWeight: 900, fontSize: 14, ...OSWALD, boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer' }}>Fechar</button>
          </div>
        </div>
      )}
    </>
  )
}
// ── 🕴️ AGÊNCIA 2.0 (aba Elenco › Agenciados) — SÓ carreira solo NOVA ────────
// O técnico convoca até 22 cartas do ÁLBUM dele pra "ativa": só elas rendem
// mensalidade por categoria (👑5 ⭐4 💎3 🎯2 🪵1 · folclórico +1) e comissão por
// acontecimento (artilheiro/campeão/negociação no leilão). A renda cai SEMPRE
// no caixa do 1º clube. Convocação no estilo da Copa (filtro por posição+busca).
const agKeyOf = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
const agTier = (c: { fame?: number; promessa?: boolean }): { grad: string; ink: string; holo?: boolean } =>
  c.promessa ? { grad: 'linear-gradient(150deg,#C9A9FF,#8B5CF6,#5B2FB0)', ink: '#fff', holo: true }
    : (c.fame ?? 1) >= 5 ? { grad: 'linear-gradient(150deg,#FFE79A,#FFC400,#E8A200)', ink: INK, holo: true }
    : (c.fame ?? 1) === 4 ? { grad: 'linear-gradient(150deg,#F4F7FB,#CBD4DE,#9BA7B5)', ink: INK, holo: true }
    : (c.fame ?? 1) >= 2 ? { grad: 'linear-gradient(150deg,#41C07A,#2E9E5B,#1E7A45)', ink: '#fff' }
    : { grad: 'linear-gradient(150deg,#DBD1B5,#CBBF9E,#B2A583)', ink: INK }
const agChip = (c: { fame?: number; promessa?: boolean }) =>
  c.promessa ? { t: '💎 PROMESSA', bg: '#8B5CF6', ink: '#fff' }
    : (c.fame ?? 1) >= 5 ? { t: '👑 LENDA', bg: GOLD, ink: INK }
    : (c.fame ?? 1) === 4 ? { t: '⭐ CRAQUE', bg: '#E4E9F0', ink: INK }
    : (c.fame ?? 1) >= 2 ? { t: '🎯 BOM', bg: '#2E9E5B', ink: '#fff' }
    : { t: '🪵 FOI PROF.', bg: '#CBBF9E', ink: INK }

function AgenciadosTab({ cards, pool, hist, fatura, st, hasFilial, primeiroClube, onSet, clubes, destinoId, dividir, onSetDestino }: {
  cards: AgCard[]; pool: AgCard[]; hist: Record<string, number> | undefined
  fatura: { season: number; mensal: number; rows: AgEvento[]; total: number } | undefined
  st: StadiumSave | undefined; hasFilial: boolean; primeiroClube: string
  onSet: (cards: AgCard[]) => void
  // 🏛️ MULTICLUBES (Diego 04/08): com 2 clubes, toggle de destino da renda
  clubes?: { id: number; nome: string; dorme: boolean }[]
  destinoId?: number
  dividir?: boolean
  onSetDestino?: (id: number, dividir?: boolean) => void
}) {
  const [open, setOpen] = useState<AgCard | null>(null)
  const [convocando, setConvocando] = useState(false)
  const renda = agenciaRenda(cards, st, hasFilial)
  const locked = EMP_ORDER.filter(k => !renda.by[k].unlocked && renda.by[k].count > 0)
  return (
    <>
      {/* CABEÇALHO: quantos na ativa */}
      <div style={{ ...box(INK), color: '#fff', padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, borderRadius: 14 }}>
        <span style={{ fontSize: 26 }}>🕴️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...OSWALD, fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Sua Agência</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>Convoque até 22 cartas de título DESTA carreira pra "ativa" — só elas rendem. {dividir ? <>A grana cai <b>meio a meio nos dois clubes</b>.</> : <>A grana cai no <b>{primeiroClube}</b>{clubes && clubes.length === 2 ? '' : ' (1º clube)'}.</>}</div>
        </div>
        <div style={{ background: GOLD, border: '2px solid rgba(255,255,255,.25)', borderRadius: 10, padding: '4px 10px', textAlign: 'center', color: INK }}>
          <b style={{ display: 'block', ...OSWALD, fontSize: 16, lineHeight: 1 }}>{cards.length}/22</b>
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1 }}>NA ATIVA</span>
        </div>
      </div>

      {/* 🏛️ MULTICLUBES: escolhe pra qual dos SEUS clubes vai a renda da agência
          (inteira — mensalidades + comissões; nada de dividir). Só com 2 clubes. */}
      {clubes && clubes.length === 2 && onSetDestino && (
        <div style={{ ...box('#fff'), padding: '9px 11px', marginBottom: 10 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11.5, margin: '0 0 6px', textTransform: 'uppercase' as const }}>💰 A renda da agência cai no caixa de:</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              ...clubes.map(c => ({ key: `c${c.id}`, label: `${c.dorme ? '💤' : '🟡'} ${c.nome}`, on: !dividir && destinoId === c.id, click: () => onSetDestino(c.id) })),
              { key: 'div', label: '🤝 Dividir os dois', on: !!dividir, click: () => onSetDestino(destinoId ?? clubes[0].id, true) },
            ].map(b => (
              <button key={b.key} onClick={b.click} style={{ flex: 1, minWidth: 0, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '7px 4px', fontWeight: 900, fontSize: 10, ...OSWALD, textTransform: 'uppercase' as const, background: b.on ? GOLD : '#fff', color: INK, boxShadow: b.on ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.label}{b.on ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#8a8069', margin: '5px 0 0', lineHeight: 1.35 }}>{dividir
            ? <>🤝 <b>Meio a meio</b>: mensalidades e comissões dividem entre os dois (moeda ímpar fica com o clube no comando). Os destraves usam o <b>estádio que rende mais</b> dos dois.</>
            : <>Mensalidades e comissões vão INTEIRAS pro clube marcado (os destraves passam a olhar o estádio dele). Troque quando quiser.</>}</p>
        </div>
      )}

      {/* RENDA GARANTIDA por temporada */}
      <div style={{ ...box(), background: `linear-gradient(160deg, ${GREEN}, #14401f)`, color: '#fff', padding: '11px 13px', marginBottom: 10 }}>
        <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 800 }}>💰 Renda garantida por temporada</div>
        <div style={{ ...OSWALD, fontSize: 26, fontWeight: 900, lineHeight: 1.1, marginTop: 2 }}>+{renda.total} 🪙</div>
        <div style={{ marginTop: 6 }}>
          {EMP_ORDER.map(k => {
            const b = renda.by[k]; if (b.count === 0) return null
            const m = EMP_META[k]
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, padding: '3px 0', borderTop: '1px solid rgba(255,255,255,.14)' }}>
                <span>{m.emoji} {m.label}</span>
                <span style={{ opacity: .85 }}>{b.count} × {b.value}</span>
                <span style={{ marginLeft: 'auto' }}>{b.unlocked ? `= ${b.income} 🪙` : `🔒 destrava: ${m.req}`}</span>
              </div>
            )
          })}
          {renda.folkCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, padding: '3px 0', borderTop: '1px solid rgba(255,255,255,.14)' }}>
              <span>🃏 Folclórico</span><span style={{ opacity: .85 }}>{renda.folkCount} na ativa, +{AG_FOLK_BONUS} cada</span>
              <span style={{ marginLeft: 'auto' }}>= +{renda.folkIncome} 🪙</span>
            </div>
          )}
        </div>
      </div>

      {/* COMISSÕES / fatura da temporada */}
      <div style={{ ...box(), padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', marginBottom: 5 }}>📈 Comissões da agência</div>
        {(!fatura || (fatura.rows.length === 0 && fatura.mensal === 0)) ? (
          <p style={{ fontSize: 10.5, fontWeight: 700, color: '#8a8069', margin: 0, lineHeight: 1.4 }}>Ainda nada por aqui. Seus agenciados pagam comissão quando <b>viram artilheiro</b> 🥇, <b>são campeões</b> 🏆 (em qualquer time!) ou <b>são negociados no leilão</b> 💸 — tudo aparece aqui e na Cerimônia.</p>
        ) : (
          <>
            {fatura.mensal > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, padding: '4px 0' }}>
                💰 <span>Mensalidades pagas na última virada</span>
                <span style={{ marginLeft: 'auto', ...OSWALD, fontWeight: 900, color: GREEN, fontSize: 12.5 }}>+{fatura.mensal} 🪙</span>
              </div>
            )}
            {fatura.rows.slice(-8).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, padding: '4px 0', borderTop: '2px solid rgba(0,0,0,.06)' }}>
                {r.emoji} <span style={{ flex: 1, minWidth: 0 }}>{r.texto}</span>
                <span style={{ ...OSWALD, fontWeight: 900, color: GREEN, fontSize: 12.5, whiteSpace: 'nowrap' }}>+{r.coins} 🪙</span>
              </div>
            ))}
            <div style={{ marginTop: 6, background: '#FFF7DB', border: `2px solid ${INK}`, borderRadius: 10, padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, fontSize: 11 }}>
              <span>🕴️ Total no caixa do {primeiroClube}</span><span style={{ ...OSWALD, color: GREEN, fontSize: 14 }}>+{fatura.total} 🪙</span>
            </div>
          </>
        )}
      </div>

      {/* GRADE dos agenciados (toque abre a carta igual álbum) */}
      {cards.length > 0 && (
        <>
          <div style={{ ...OSWALD, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', margin: '2px 2px 6px' }}>🃏 Seus agenciados (toque pra abrir a carta)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginBottom: 10 }}>
            {cards.map(c => {
              const t = agTier(c)
              return (
                <button key={agKeyOf(c)} onClick={() => setOpen(c)} style={{ border: `2.5px solid ${INK}`, borderRadius: 11, aspectRatio: '3/4', padding: '5px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', boxShadow: `2px 2px 0 0 ${INK}`, position: 'relative', overflow: 'hidden', background: t.grad, cursor: 'pointer' }}>
                  {t.holo && <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,transparent 32%,rgba(255,255,255,.6) 48%,transparent 62%)', pointerEvents: 'none' }} />}
                  {c.folk && <span style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,.75)', color: '#fff', borderRadius: 999, fontSize: 6.5, fontWeight: 900, padding: '1px 5px' }}>🃏 +1</span>}
                  <span style={{ width: 26, height: 26, borderRadius: 999, border: '2px solid rgba(0,0,0,.28)', display: 'grid', placeItems: 'center', ...OSWALD, fontWeight: 900, fontSize: 13, background: 'rgba(255,255,255,.85)', color: INK }}>{c.name.trim()[0]?.toUpperCase() ?? '?'}</span>
                  <span style={{ ...OSWALD, fontWeight: 900, fontSize: 8.5, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, color: t.ink }}>{c.name}</span>
                  <span style={{ fontSize: 6.5, letterSpacing: .5 }}>{c.promessa ? '💎💎💎' : '⭐'.repeat(Math.max(1, Math.min(5, c.fame)))}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
      {cards.length === 0 && (
        <div style={{ ...box('#FBF6E9'), padding: 16, textAlign: 'center', fontWeight: 700, color: '#8a7d59', fontSize: 12.5, marginBottom: 10 }}>
          Ninguém na ativa ainda. As cartas da agência você ganha sendo <b>campeão NESTA carreira</b> (o pacote do título) — aí é só convocar até 22 pra ativa.
        </div>
      )}

      {/* CONVOCAR + trava explicada */}
      <button onClick={() => setConvocando(true)} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 14, ...OSWALD, background: `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', textTransform: 'uppercase', marginBottom: 8 }}>
        🧢 Convocar agenciados — {cards.length > 0 ? 'trocar os 22' : 'escolher do cofre da carreira'}
      </button>
      {locked.length > 0 && (
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', background: '#FFF7DB', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 9px' }}>
          🔒 {locked.map(k => `${EMP_META[k].label} destrava: ${EMP_META[k].req}`).join(' · ')} — os desbloqueios ficam em <b>Clube › 🏗️ Estrutura</b> (a obra do estádio destrava).
        </div>
      )}

      {/* modal: carta cheia (igual álbum) + fatura do jogador */}
      {open && (() => {
        const cat = empCat(open)
        const b = renda.by[cat]
        const rende = b.unlocked ? b.value + (open.folk ? AG_FOLK_BONUS : 0) : 0
        const ja = hist?.[agKeyOf(open)] ?? 0
        return (
          <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 300 }}>
              <CollectibleCard name={open.name} club={open.club} year={open.year} pos={open.pos} fame={open.fame} folk={open.folk} promessa={open.promessa} big showBio />
              <div style={{ ...box(), padding: '9px 11px', marginTop: 10 }}>
                <div style={{ ...OSWALD, fontWeight: 900, fontSize: 11.5, textTransform: 'uppercase', marginBottom: 3 }}>💼 Na sua agência</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, padding: '2px 0' }}>
                  <span>💰 Rende por temporada{open.folk ? ' (com 🃏 +1)' : ''}</span>
                  <span style={{ ...OSWALD, color: rende > 0 ? GREEN : '#b3a688' }}>{rende > 0 ? `+${rende} 🪙` : `🔒 ${EMP_META[cat].req}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, padding: '2px 0', borderTop: '2px solid rgba(0,0,0,.06)' }}>
                  <span>🏦 Já te rendeu nesta carreira</span>
                  <span style={{ ...OSWALD, color: GREEN }}>{ja} 🪙</span>
                </div>
              </div>
              <button onClick={() => setOpen(null)} style={{ width: '100%', marginTop: 10, background: GOLD, color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: 11, fontWeight: 900, fontSize: 14, ...OSWALD, boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        )
      })()}

      {convocando && <ConvocacaoAgencia current={cards} pool={pool} onClose={() => setConvocando(false)} onSave={list => { onSet(list); setConvocando(false) }} />}
    </>
  )
}

// 🧢 CONVOCAÇÃO da agência: escolhe até 22 do ÁLBUM (igual convocação da Copa —
// filtro por posição + busca). Mesma PESSOA só uma vez (auges diferentes = 1 vaga).
// ⚠️ CORREÇÃO (relato do Diego 04/08): a agência usa SÓ as cartas ganhas NESTA
// carreira (pacotes de título daqui) — nada de puxar o álbum global da conta.
function ConvocacaoAgencia({ current, pool, onClose, onSave }: { current: AgCard[]; pool: AgCard[]; onClose: () => void; onSave: (cards: AgCard[]) => void }) {
  const [tab, setTab] = useState<Sector>('GOL')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, AgCard>>(() => Object.fromEntries(current.map(c => [agKeyOf(c), c])))
  const total = Object.keys(sel).length
  const usedNames = new Set(Object.values(sel).map(c => c.name))
  const toggle = (c: AgCard) => {
    const k = agKeyOf(c)
    setSel(prev => {
      const nx = { ...prev }
      if (nx[k]) { delete nx[k]; return nx }
      if (Object.keys(nx).length >= 22) return prev            // agência cheia
      if (usedNames.has(c.name)) return prev                   // outra versão da MESMA pessoa
      nx[k] = c; return nx
    })
  }
  const list = pool.filter(c => c.pos === tab).filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()))
  const countPos = (p: Sector) => Object.values(sel).filter(c => c.pos === p).length
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.78)', overflowY: 'auto', padding: '18px 12px 30px' }}>
      <div style={{ maxWidth: 430, margin: '0 auto' }}>
        <div style={{ ...box(INK), color: '#fff', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, borderRadius: 14 }}>
          <span style={{ fontSize: 26 }}>🧢</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...OSWALD, fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Convocação da Agência</div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>{pool.length} cartas de título DESTA carreira — convoque até 22 pra ativa. Troque quando quiser.</div>
          </div>
          <div style={{ background: GOLD, border: '2px solid rgba(255,255,255,.25)', borderRadius: 10, padding: '4px 9px', textAlign: 'center', color: INK }}>
            <b style={{ display: 'block', ...OSWALD, fontSize: 15, lineHeight: 1 }}>{total}/22</b>
            <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1 }}>CONVOCADOS</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {SECTORS.map(p => (
            <button key={p} onClick={() => setTab(p)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 2px', fontWeight: 900, fontSize: 10.5, ...OSWALD, cursor: 'pointer', background: tab === p ? GOLD : '#fff', color: INK, boxShadow: tab === p ? `2px 2px 0 0 ${INK}` : 'none' }}>
              {p}<span style={{ display: 'block', fontSize: 7.5, fontWeight: 800, opacity: .75, fontFamily: 'system-ui' }}>{countPos(p)}</span>
            </button>
          ))}
        </div>

        <input value={q} onChange={e => setQ(e.target.value)} placeholder={`🔎 buscar nos ${pool.filter(c => c.pos === tab).length} da posição…`}
          style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 11, padding: '7px 11px', fontWeight: 800, fontSize: 12, background: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />

        <div style={{ ...box('#fff'), borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {list.map(c => {
              const k = agKeyOf(c)
              const on = !!sel[k]
              const otherVersion = !on && usedNames.has(c.name)
              const full = !on && total >= 22
              const chip = agChip(c)
              return (
                <button key={k} onClick={() => toggle(c)} disabled={otherVersion}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: 'none', borderBottom: '2px solid rgba(0,0,0,.07)', background: on ? '#E9F5EC' : '#fff', cursor: otherVersion ? 'not-allowed' : 'pointer', opacity: otherVersion ? .4 : full ? .65 : 1, textAlign: 'left' }}>
                  <span style={{ width: 22, height: 22, border: `2.5px solid ${INK}`, borderRadius: 7, background: on ? GREEN : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{on ? '✓' : ''}</span>
                  <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  {c.folk && <span style={{ background: INK, color: '#fff', borderRadius: 999, fontSize: 7, fontWeight: 900, padding: '1px 6px', flexShrink: 0 }}>🃏 +1</span>}
                  <span style={{ background: chip.bg, color: chip.ink, border: `2px solid ${INK}`, borderRadius: 999, fontSize: 7, fontWeight: 900, padding: '1px 6px', flexShrink: 0 }}>{otherVersion ? 'já convocado' : chip.t}</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.club} · {c.year}</span>
                </button>
              )
            })}
            {list.length === 0 && (
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', padding: 14 }}>
                {pool.length === 0 ? 'O cofre desta carreira ainda está vazio — seja CAMPEÃO aqui pra ganhar cartas! 🏆' : 'ninguém com esse nome aqui… 🔎'}
              </p>
            )}
          </div>
        </div>

        <div style={{ ...box('#FFF7DB'), padding: '9px 11px', marginBottom: 10 }}>
          <div style={{ ...OSWALD, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', marginBottom: 3 }}>💡 Quem tá na ativa rende</div>
          <p style={{ fontSize: 10, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>💰 Fixo por temporada: 👑 5 · ⭐ 4 · 💎 3 · 🎯 2 · 🪵 1 · 🃏 folclórico +1 por cima<br />🥇 Artilheiro na sua carreira <b>+1</b> · 🏆 Campeão em qualquer time <b>+1</b> · 💸 Negociado no leilão <b>+1</b></p>
        </div>

        <button onClick={() => onSave(Object.values(sel))} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 14, ...OSWALD, background: `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', textTransform: 'uppercase' }}>
          ✅ Fechar convocação ({total}/22)
        </button>
        {total < 22 && <p style={{ fontSize: 9.5, fontWeight: 800, color: '#F4ECD6', textAlign: 'center', margin: '6px 0 0' }}>ainda dá pra convocar mais {22 - total} — ou feche assim mesmo, você troca quando quiser</p>}
        <p style={{ textAlign: 'center', marginTop: 8 }}><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 900, textDecoration: 'underline', color: 'rgba(255,255,255,.75)', cursor: 'pointer' }}>← voltar sem salvar</button></p>
      </div>
    </div>
  )
}

// 🕴️ AGÊNCIA na área do estádio (Clube › Estrutura) — mockup aprovado pelo Diego
// (03/08): a escada de desbloqueios mora ABAIXO do estádio/patrocínio, em caixa
// escura pra não confundir com a obra. A agência em si (os 22 na ativa) segue em
// Elenco › Agenciados — o botão no fim leva pra lá.
const AG_EMOJI: Record<EmpCat, string> = { prof: '🪵', bom: '🎯', promessa: '💎', craque: '⭐', lenda: '👑' }
function AgenciaDesbloqueios({ st, hasFilial, onVerAgenciados }: { st: StadiumSave | undefined; hasFilial: boolean; onVerAgenciados?: () => void }) {
  const done = sectorsDone(st)
  const faltam: string[] = []
  for (const s of STADIUM_SECTORS) if (sectorPct(st, s.k) < 100) faltam.push(s.n)
  for (const e of STADIUM_EXTRAS) if (!hasExtra(st, e.k)) faltam.push(e.n)
  const obras = STADIUM_SECTORS.length + STADIUM_EXTRAS.length - faltam.length
  const totObras = STADIUM_SECTORS.length + STADIUM_EXTRAS.length
  // texto da exigência com o PROGRESSO real (regra do Diego: trava diz o que falta)
  const req: Record<EmpCat, string> = {
    prof: 'Liberada desde o 1º dia — aprende a mexer sem custo.',
    bom: done >= 1 ? `1 setor do estádio pronto — você já tem ${done}. ✓` : '1 setor do estádio pronto — termine a primeira obra.',
    promessa: done >= 3 ? `3 setores prontos — você já tem ${done}. ✓` : `3 setores prontos — você tem ${done}.`,
    craque: faltam.length === 0 ? 'Estádio 100% completo. ✓' : `Estádio 100% (${totObras} obras). Falta: ${faltam.slice(0, 3).join(', ')}${faltam.length > 3 ? '…' : ''}.`,
    lenda: hasFilial ? 'SAF comprada — chegou no ápice. ✓' : 'Compre a SAF (2.000 🪙 + estádio completo) — o ápice do clube.',
  }
  const chip: Record<EmpCat, string> = { prof: '', bom: `🔒 ${Math.min(done, 1)}/1 SETOR`, promessa: `🔒 ${Math.min(done, 3)}/3 SETORES`, craque: `🔒 ${obras}/${totObras} OBRAS`, lenda: '🔒 SAF' }
  const ordem = [...EMP_ORDER].reverse() // escada de baixo pra cima: 🪵 primeiro (aberta), 👑 por último (ápice)
  const firstLocked = ordem.find(k => !empCatUnlocked(k, st, hasFilial))
  return (
    <div style={{ ...box(), background: 'linear-gradient(160deg,#241E33,#0C0C0C 70%)', color: '#fff', padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', fontWeight: 800, ...OSWALD }}>A obra destrava o escritório</div>
      <div style={{ ...OSWALD, fontWeight: 900, fontSize: 19, textTransform: 'uppercase', color: GOLD, lineHeight: 1.1, margin: '2px 0 3px' }}>🕴️ Agência de Jogadores</div>
      <p style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,.82)', lineHeight: 1.5, margin: '0 0 10px' }}>Cada categoria que você libera aqui passa a <b>render moedas por temporada</b> quando está na ativa (Elenco › Agenciados). Clube maior = agência maior.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {ordem.map(k => {
          const ok = empCatUnlocked(k, st, hasFilial)
          const next = k === firstLocked
          const bg = ok ? '#EAF6EE' : next ? '#FFF7DB' : '#EDE8DA'
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9, border: `2.5px solid ${INK}`, borderRadius: 13, padding: '8px 10px', background: bg, color: INK, boxShadow: '2px 2px 0 rgba(0,0,0,.55)', opacity: ok || next ? 1 : .92 }}>
              <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{AG_EMOJI[k]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', lineHeight: 1.1 }}>{EMP_META[k].label}</div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: '#5a5647', lineHeight: 1.35 }}>{req[k]}</div>
              </div>
              <div style={{ ...OSWALD, fontWeight: 900, fontSize: 11, whiteSpace: 'nowrap', textAlign: 'right', lineHeight: 1.2 }}>
                +{AG_VALUES[k]} 🪙/carta
                <span style={{ display: 'block', fontSize: 8.5, fontWeight: 800, letterSpacing: .5, borderRadius: 6, padding: '1px 6px', marginTop: 3, background: ok ? GREEN : next ? GOLD : '#8a8064', color: ok ? '#fff' : next ? INK : '#fff', ...OSWALD }}>{ok ? '✓ ABERTA' : chip[k]}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,.75)', marginTop: 9, lineHeight: 1.45 }}>🃏 Carta <b>folclórica</b> rende <b>+{AG_FOLK_BONUS} 🪙</b> por cima — junto com a categoria dela liberada · comissões: 🥇 artilheiro +1 · 🏆 campeão +1 · 💸 negociado no leilão +1.</div>
      {onVerAgenciados && (
        <button onClick={onVerAgenciados} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 13, padding: 10, fontWeight: 900, fontSize: 13, ...OSWALD, textTransform: 'uppercase', background: `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, boxShadow: '3px 3px 0 rgba(0,0,0,.55)', marginTop: 10, cursor: 'pointer' }}>🧢 Ver meus agenciados — Elenco › Agenciados</button>
      )}
    </div>
  )
}


// ── 🏦 BANCO LEGENDS (Clube › Finanças) — compra manual de moedas via Pix ────
// Fluxo do Diego: jogador manda Pix → comprovante no zap → Diego gera a FICHA no
// admin → jogador resgata aqui. A validação/queima é ATÔMICA no Supabase (RPC
// bl_redeem); o reducer só credita. SÓ carreira SOLO. Liberado GERAL (04/08).
const BL_PIX = 'diego.c.fonseca@gmail.com' // chave Pix REAL do Diego (04/08) — Banco liberado geral
// 💱 REGRA DO DIEGO (04/08): cada R$ 1 vira 3 🪙 — sempre o TRIPLO do Pix.
// A lista guarda o valor em REAIS; a tela e o admin mostram/geram reais × 3.
export const BL_TRIPLO = 3
const BL_PACOTES: [number, string][] = [[10, 'CAFEZINHO'], [50, 'REFORÇO PONTUAL'], [100, 'FÔLEGO DE TEMPORADA'], [500, 'PROJETO SAF'], [1000, 'INVESTIDOR VISIONÁRIO 👑']]
function BancoLegends() {
  const { state, dispatch } = useEsc()
  const [aberto, setAberto] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [fails, setFails] = useState(0)
  const [coolAte, setCoolAte] = useState(0)
  const [msg, setMsg] = useState<{ ok: boolean; coins?: number; tx: string } | null>(null)
  if (state.onlineMode === 'online' || !state.careerOnline) return null
  const emCooldown = Date.now() < coolAte
  const resgatar = async () => {
    if (busy || emCooldown || !code.trim()) return
    setBusy(true); setMsg(null)
    try {
      const { data, error } = await supabase.rpc('bl_redeem', { p_code: code.trim() })
      if (error) throw error
      if (data === -1) setMsg({ ok: false, tx: 'Entre na sua conta pra resgatar a ficha.' })
      else if (!data) {
        const f = fails + 1; setFails(f)
        if (f >= 3) { setCoolAte(Date.now() + 60000); setFails(0); setMsg({ ok: false, tx: 'Ficha inválida ou já usada. Muitas tentativas — espera 1 minutinho. ⏳' }) }
        else setMsg({ ok: false, tx: 'Ficha inválida ou já usada. Confere o código no zap do gerente. 🤵' })
      } else {
        dispatch({ type: 'BANCO_CREDIT', coins: data as number, code: code.trim().toUpperCase() })
        setMsg({ ok: true, coins: data as number, tx: 'Vai lá e faz história, doutor. O banco tá de olho. 👀' })
        setCode(''); setFails(0)
      }
    } catch { setMsg({ ok: false, tx: 'Sem conexão com o banco agora — tenta de novo em instantes.' }) }
    setBusy(false)
  }
  return (
    <div style={{ marginTop: 12 }}>
      {!aberto ? (
        <button onClick={() => setAberto(true)} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: '11px 12px', background: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
          <span style={{ fontSize: 24 }}>🏦</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', ...OSWALD, fontWeight: 900, fontSize: 14, textTransform: 'uppercase' }}>Banco Legends</span>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#8a8069' }}>Precisa de um capital pro clube? O gerente aprova na hora. 🤵</span>
          </span>
          <span style={{ fontWeight: 900, fontSize: 18 }}>›</span>
        </button>
      ) : (
        <div style={{ ...box('#FBF6E9'), padding: 12 }}>
          <div style={{ ...box(), background: `linear-gradient(160deg, ${GREEN}, #14401f)`, color: '#fff', padding: '11px 12px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, borderRadius: 14 }}>
            <span style={{ flex: 'none', width: 46, height: 46, borderRadius: 999, background: '#F4ECD6', border: `3px solid ${INK}`, display: 'grid', placeItems: 'center', fontSize: 24 }}>🤵</span>
            <div>
              <div style={{ ...OSWALD, fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>Seu Creuzebek · Gerente do Banco Legends</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, fontStyle: 'italic', lineHeight: 1.4, color: 'rgba(255,255,255,.9)', marginTop: 2 }}>"Precisa de um capital pro clube, doutor? O banco APROVA na hora — sem juros, sem fiador, sem choro."</div>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontWeight: 900, fontSize: 10.5, letterSpacing: .5, margin: '0 0 7px', color: '#1B7A3D' }}>💱 Aqui cada R$ 1 vira <b>3 moedas</b> — sempre o TRIPLO!</p>
          {BL_PACOTES.map(([v, tag]) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `2.5px solid ${INK}`, borderRadius: 12, background: v === 100 ? '#FFF7DB' : '#fff', boxShadow: `2px 2px 0 0 ${INK}`, padding: '7px 10px', marginBottom: 6 }}>
              <span style={{ ...OSWALD, fontWeight: 900, fontSize: 16, minWidth: 78 }}>{(v * BL_TRIPLO).toLocaleString('pt-BR')} 🪙</span>
              <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: .5, color: '#8a8069' }}>{tag}</span>
              <span style={{ marginLeft: 'auto', ...OSWALD, fontWeight: 900, fontSize: 13, background: GOLD, border: `2px solid ${INK}`, borderRadius: 9, padding: '3px 10px', whiteSpace: 'nowrap' }}>R$ {v}</span>
            </div>
          ))}
          <div style={{ ...box(), padding: '9px 11px', margin: '10px 0' }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', margin: '0 0 4px' }}>Como funciona</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.5, margin: 0 }}>1️⃣ Escolha o pacote e mande o Pix pra chave:<br /></p>
            <p style={{ background: '#EAF6EE', border: `2.5px dashed ${INK}`, borderRadius: 10, padding: '6px 8px', fontWeight: 900, fontSize: 11.5, textAlign: 'center', margin: '5px 0' }}>📲 PIX: {BL_PIX}</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.5, margin: 0 }}>2️⃣ Manda o <b>comprovante</b> no Instagram <b>@leilaolegendscom</b> (ou no e-mail acima) — o gerente responde com sua <b>FICHA DO BANCO</b> (um código).<br />3️⃣ Digita a ficha abaixo — as moedas caem <b>na hora</b> no caixa do clube. 💸</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="BL-XXXX-XX" maxLength={14}
              style={{ flex: 1, border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 10px', ...OSWALD, fontWeight: 700, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', background: '#fff' }} />
            <button onClick={resgatar} disabled={busy || emCooldown} style={{ border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 14px', ...OSWALD, fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', background: busy || emCooldown ? '#CBBF9E' : `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, boxShadow: `2px 2px 0 0 ${INK}`, cursor: busy || emCooldown ? 'not-allowed' : 'pointer' }}>{busy ? '…' : 'Resgatar'}</button>
          </div>
          {msg && (msg.ok ? (
            <div style={{ ...box(), background: `linear-gradient(160deg, ${GREEN}, #14401f)`, color: '#fff', padding: 12, textAlign: 'center', marginTop: 10 }}>
              <span style={{ display: 'inline-block', border: `3px solid ${GOLD}`, color: GOLD, ...OSWALD, fontWeight: 900, fontSize: 13, letterSpacing: 2, padding: '2px 12px', borderRadius: 8, transform: 'rotate(-5deg)', textTransform: 'uppercase' }}>Empréstimo aprovado</span>
              <div style={{ ...OSWALD, fontWeight: 900, fontSize: 26, marginTop: 6 }}>+{msg.coins} 🪙</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>no caixa do clube · assinado: Seu Creuzebek 🖋️<br />"{msg.tx}"</div>
            </div>
          ) : (
            <p style={{ fontSize: 10.5, fontWeight: 800, color: '#c0392b', margin: '8px 0 0', textAlign: 'center' }}>{msg.tx}</p>
          ))}
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.5)', textAlign: 'center', margin: '8px 0 0' }}>Cada ficha vale UMA vez, só na sua conta · só na carreira solo.</p>
          <button onClick={() => { setAberto(false); setMsg(null) }} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', fontSize: 10.5, fontWeight: 900, textDecoration: 'underline', color: 'rgba(0,0,0,.5)', cursor: 'pointer' }}>fechar o banco</button>
        </div>
      )}
    </div>
  )
}

function FinLine({ label, sub, amount }: { label: string; sub?: string; amount: number }) {
  const pos = amount >= 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: `2px solid ${INK}`, borderRadius: 11, boxShadow: `2px 2px 0 0 ${INK}`, padding: '8px 10px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        {sub && <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8a8069' }}>{sub}</div>}
      </div>
      <div style={{ ...OSWALD, fontWeight: 900, fontSize: 14.5, color: pos ? GREEN : FIN_RED, whiteSpace: 'nowrap' }}>{pos ? '+' : '−'}{Math.abs(amount)} 🪙</div>
    </div>
  )
}
function FinancasTab({ ledger, caixa, seasonNo, squad, marketValues }: {
  ledger: LedgerEntry[]; caixa: number; seasonNo: number
  squad: WonCard[]; marketValues: Record<string, number>
}) {
  const [sub, setSub] = useState<'extrato' | 'transf'>('extrato')
  // extrato: do mais novo pro mais antigo, agrupado por temporada
  const rev = [...ledger].reverse()
  const seasons = [...new Set(rev.map(e => e.season))]
  // 💰 RESUMO = temporada da movimentação MAIS RECENTE (a que encabeça o extrato).
  // Bilheteria/folha/prêmios de uma temporada só são lançados na VIRADA do ano (já
  // com o número da temporada que fechou), e aí o seasonNo já pulou pra próxima —
  // então filtrar pelo seasonNo atual dava 0/0/0 mesmo tendo dados logo abaixo.
  // Usar a temporada do topo do extrato mantém o resumo sempre casado com a lista.
  const summarySeason = seasons[0] ?? seasonNo
  const thisSeason = ledger.filter(e => e.season === summarySeason)
  const entrou = thisSeason.filter(e => e.amount > 0).reduce((a, e) => a + e.amount, 0)
  const saiu = thisSeason.filter(e => e.amount < 0).reduce((a, e) => a - e.amount, 0)
  // transferências
  const vendidos = rev.filter(e => e.kind === 'sell')
  const noElenco = squad.filter(c => !c.fake && !isFillerClub(c.club) && !c.emprestado && (c.buyPrice != null || c.paid != null))
  const lbl = (k: LedgerEntry['kind']) => k === 'reward' ? '🏆 Prêmios da temporada' : k === 'gate' ? '🎟️ Bilheteria' : k === 'salary' ? '💸 Folha salarial' : k === 'saf' ? '🏢 Prêmios da SAF' : k === 'stadium' ? '🏟️ Obra no estádio' : k === 'safbuy' ? '🏢 Compra da SAF' : k === 'safsell' ? '🏢 Venda da SAF' : k === 'empresario' ? '💼 Renda do Empresário' : k === 'opening' ? '🏁 Saldo inicial' : ''
  return (
    <>
      {/* RESUMO fixo: caixa atual + saldo da temporada */}
      <div style={{ ...box(), background: caixa < 0 ? `linear-gradient(160deg, ${FIN_RED}, #7a1b10)` : `linear-gradient(160deg, ${GREEN}, #14401f)`, color: '#fff', padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 800 }}>Caixa atual{caixa < 0 ? ' · no vermelho' : ''}</div>
            <div style={{ ...OSWALD, fontSize: 27, fontWeight: 900, lineHeight: 1, marginTop: 2 }}>🪙 {caixa < 0 ? `−${Math.abs(caixa)}` : caixa}</div>
            {caixa < 0 && <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>Folha maior que a caixa — contratar e investir travam até sair do vermelho.</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 700 }}>Temporada {summarySeason}</div>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
          {([['Entrou', entrou, '#8ff0a8'], ['Saiu', saiu, '#ffb3a6'], ['Saldo', entrou - saiu, GOLD]] as [string, number, string][]).map(([t, v, c], i) => (
            <div key={t} style={{ flex: 1, background: 'rgba(0,0,0,.22)', borderRadius: 9, padding: '6px 8px' }}>
              <div style={{ fontSize: 8.5, letterSpacing: .5, textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', fontWeight: 800 }}>{t}</div>
              <div style={{ ...OSWALD, fontSize: 15, fontWeight: 900, color: c }}>{i === 2 && v >= 0 ? '+' : i === 1 ? '−' : i === 0 ? '+' : v < 0 ? '−' : '+'}{Math.abs(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* sub-abas: 🧾 Extrato | 🔁 Transferências */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {([['extrato', '🧾', 'Extrato'], ['transf', '🔁', 'Transferências']] as [typeof sub, string, string][]).map(([s, ic, label]) => (
          <button key={s} onClick={() => setSub(s)} style={{ flex: 1, border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 2px', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', background: sub === s ? INK : '#fff', color: sub === s ? '#fff' : INK, boxShadow: sub === s ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, ...OSWALD }}><span style={{ fontSize: 13 }}>{ic}</span>{label}</button>
        ))}
      </div>

      {sub === 'extrato' ? (
        ledger.length === 0
          ? <div style={{ ...box('#FBF6E9'), padding: 20, textAlign: 'center', fontWeight: 700, color: '#8a7d59' }}>Ainda não há lançamentos. Prêmios, bilheteria, salários, compras e vendas aparecem aqui conforme a carreira anda.</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {seasons.map(sn => (
                <div key={sn} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: .6, textTransform: 'uppercase', color: '#9a8f78', margin: '2px 2px 0' }}>Temporada {sn}</div>
                  {rev.filter(e => e.season === sn).map(e => (
                    <FinLine key={e.id} label={e.label || lbl(e.kind)} amount={e.amount} />
                  ))}
                </div>
              ))}
            </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* NO ELENCO: comprados, ainda no time — pago vs valor atual */}
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: .6, textTransform: 'uppercase', color: '#9a8f78', margin: '2px 2px 0' }}>No elenco ({noElenco.length})</div>
          {noElenco.length === 0
            ? <div style={{ ...box('#FBF6E9'), padding: 14, textAlign: 'center', fontWeight: 700, color: '#8a7d59', fontSize: 12.5 }}>Nenhum jogador comprado ainda.</div>
            : noElenco.map(c => {
                const pago = c.buyPrice ?? c.paid ?? 0
                const atual = marketValues[c.name] ?? c.paid ?? pago
                const dif = atual - pago
                return (
                  <div key={c.id} style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 11, boxShadow: `2px 2px 0 0 ${INK}`, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: INK }}>{c.name}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#8a8069', textTransform: 'uppercase' }}>{POS_LABEL[c.pos]}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 8, color: '#9a8f78', fontWeight: 900, textTransform: 'uppercase' }}>Pago</div><div style={{ ...OSWALD, fontWeight: 900, fontSize: 14 }}>{pago}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 8, color: '#9a8f78', fontWeight: 900, textTransform: 'uppercase' }}>Hoje</div><div style={{ ...OSWALD, fontWeight: 900, fontSize: 14 }}>{atual}</div></div>
                        <div style={{ textAlign: 'center', minWidth: 44 }}><div style={{ fontSize: 8, color: '#9a8f78', fontWeight: 900, textTransform: 'uppercase' }}>{dif >= 0 ? 'Valoriz.' : 'Caiu'}</div><div style={{ ...OSWALD, fontWeight: 900, fontSize: 14, color: dif >= 0 ? GREEN : FIN_RED }}>{dif >= 0 ? '+' : '−'}{Math.abs(dif)}</div></div>
                      </div>
                    </div>
                  </div>
                )
              })}
          {/* VENDIDOS: com o lucro/prejuízo real */}
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: .6, textTransform: 'uppercase', color: '#9a8f78', margin: '8px 2px 0' }}>Vendidos ({vendidos.length})</div>
          {vendidos.length === 0
            ? <div style={{ ...box('#FBF6E9'), padding: 14, textAlign: 'center', fontWeight: 700, color: '#8a7d59', fontSize: 12.5 }}>Você ainda não vendeu ninguém.</div>
            : vendidos.map(e => {
                const bought = e.buyPrice ?? 0
                const lucro = e.amount - bought
                return (
                  <div key={e.id} style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 11, boxShadow: `2px 2px 0 0 ${INK}`, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: INK }}>{e.player ?? e.label}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#8a8069', textTransform: 'uppercase' }}>{e.pos ? POS_LABEL[e.pos] : 'Vendido'} · T{e.season}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 8, color: '#9a8f78', fontWeight: 900, textTransform: 'uppercase' }}>Pagou</div><div style={{ ...OSWALD, fontWeight: 900, fontSize: 14 }}>{bought}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 8, color: '#9a8f78', fontWeight: 900, textTransform: 'uppercase' }}>Vendeu</div><div style={{ ...OSWALD, fontWeight: 900, fontSize: 14 }}>{e.amount}</div></div>
                        <div style={{ textAlign: 'center', minWidth: 44 }}><div style={{ fontSize: 8, color: '#9a8f78', fontWeight: 900, textTransform: 'uppercase' }}>{lucro >= 0 ? 'Lucro' : 'Prejuízo'}</div><div style={{ ...OSWALD, fontWeight: 900, fontSize: 14, color: lucro >= 0 ? GREEN : FIN_RED }}>{lucro >= 0 ? '+' : '−'}{Math.abs(lucro)}</div></div>
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>
      )}
    </>
  )
}
const zone = (rank: number) => rank <= 4 ? '#D6E9FA' : rank >= 17 ? '#F9D8D3' : undefined
const th: React.CSSProperties = { color: 'rgba(0,0,0,0.7)', fontWeight: 900, fontSize: 10.5 }
function ZoneLegend() {
  const chip = (bg: string, label: string, border = false) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><i style={{ width: 10, height: 10, borderRadius: 3, display: 'inline-block', background: bg, border: border ? '1px solid rgba(0,0,0,0.2)' : 'none' }} />{label}</span>
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>{chip('#D6E9FA', 'G4')}{chip('#fff', 'Meio', true)}{chip('#F9D8D3', 'Z4')}</div>
}
const UP_OF: Partial<Record<Div, Div>> = { B: 'A', C: 'B', D: 'C' }
const DOWN_OF: Partial<Record<Div, Div>> = { A: 'B', B: 'C', C: 'D' }
function DivTable({ div, teams, colors, mine, final, safTeam, safCol }: { div: Div; teams: SimTeam[]; colors: Record<number, FCol>; mine?: boolean; final?: boolean; safTeam?: string; safCol?: FCol }) {
  const humans = teams.filter(t => t.human || t.rival).map(t => ({ name: t.name, teamId: t.teamId, you: t.you, rival: !!t.rival, dorm: !!t.dorm }))
  // temporada FECHADA: setinhas animadas de acesso (▲ verde) e queda (▼ vermelha)
  // pra TODOS os times, e um banner quando é VOCÊ que sobe/cai/é campeão.
  const youPos = final && mine ? teams.findIndex(t => t.you) + 1 : 0
  const banner = !final || !mine || youPos === 0 ? null
    : div === 'A' && youPos === 1 ? { bg: GOLD, fg: INK, txt: '🏆 CAMPEÃO DA SÉRIE A! O topo é seu.' }
    : youPos <= 4 && UP_OF[div] ? { bg: '#1B7A3D', fg: '#fff', txt: `🚀 ACESSO! Você sobe pra Série ${UP_OF[div]}!` }
    : youPos <= 4 && div === 'A' ? { bg: '#1B7A3D', fg: '#fff', txt: '🛡️ Fechou no G4 da Série A — elite mantida!' }
    : youPos >= teams.length - 3 && DOWN_OF[div] ? { bg: '#B23B2E', fg: '#fff', txt: `📉 Queda pra Série ${DOWN_OF[div]}… ano que vem tem volta.` }
    : null
  return (
    <div style={{ ...box(mine ? '#FFFBEB' : '#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>{DIV_LABEL[div]}{mine ? ' · você' : ''}</p><ZoneLegend />
      </div>
      {final && <style>{'@keyframes divUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes divDown{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}'}</style>}
      {banner && (
        <div style={{ background: banner.bg, color: banner.fg, border: `2.5px solid ${INK}`, borderRadius: 10, boxShadow: `2px 2px 0 0 ${INK}`, padding: '7px 10px', margin: '2px 0 8px', fontWeight: 900, fontSize: 13, textAlign: 'center', ...OSWALD }}>{banner.txt}</div>
      )}
      <DivChips humans={humans} colors={colors} />
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 6 }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>P</th><th style={{ ...th, textAlign: 'center' }}>V</th><th style={{ ...th, textAlign: 'center' }}>E</th><th style={{ ...th, textAlign: 'center' }}>D</th><th style={{ ...th, textAlign: 'center' }}>SG</th></tr></thead>
        <tbody>
          {teams.map((t, i) => {
            const fc = colors[t.teamId]
            const youPerk = t.you ? myApoioPerk() : null
            const colored = t.human || t.rival
            // 🏢 a SUA SAF (clube-satélite) veste a sua cor + selo 💼 pra você reconhecer
            const isSaf = !colored && !!safCol && !!safTeam && t.name === safTeam
            const bg = colored ? (fc?.light ?? '#eee') : isSaf ? safCol!.light : zone(i + 1)
            const nameColor = colored ? (fc?.solid ?? INK) : isSaf ? safCol!.solid : INK
            return (
              <tr key={t.name + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', background: bg, fontWeight: colored || isSaf ? 800 : 500 }}>
                <td style={{ paddingRight: 4, whiteSpace: 'nowrap' }}>{i + 1}{final && i < 4 && UP_OF[div] && <span style={{ display: 'inline-block', color: '#1B7A3D', fontWeight: 900, marginLeft: 2, animation: 'divUp 1.4s ease-in-out infinite' }}>▲</span>}{final && i === 0 && div === 'A' && <span style={{ marginLeft: 2 }}>🏆</span>}{final && i >= teams.length - 4 && DOWN_OF[div] && <span style={{ display: 'inline-block', color: '#B23B2E', fontWeight: 900, marginLeft: 2, animation: 'divDown 1.4s ease-in-out infinite' }}>▼</span>}</td>
                <td style={{ maxWidth: 150, color: nameColor }}>
                  {/* 🛡️ escudo do clube (gerado do nome) + o selo de quem é quem */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <Escudo nome={t.name} size={19} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.you ? '👤 ' : t.dorm ? '🏛️ ' : t.rival ? '⚔️ ' : isSaf ? '💼 ' : ''}{t.you && youPerk ? <span style={apoioText(youPerk)}>{apoioName(t.name)}</span> : t.name}</span>
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.pts}</td>
                <td style={{ textAlign: 'center' }}>{t.w}</td><td style={{ textAlign: 'center' }}>{t.d}</td><td style={{ textAlign: 'center' }}>{t.l}</td>
                <td style={{ textAlign: 'center' }}>{t.gf - t.ga}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
export function PyramidTables({ tables, order, colors, myDiv, final, safTeam, safCol }: { tables: Record<Div, SimTeam[]>; order?: Div[]; colors?: Record<number, FCol>; myDiv?: Div | null; final?: boolean; safTeam?: string; safCol?: FCol }) {
  const cols = colors ?? {}
  // a artilharia saiu daqui (foi pra aba Rank) — a aba Tabelas fica só com as 4 tabelas.
  return <>{(order ?? DIVS).map(d => <DivTable key={d} div={d} teams={tables[d]} colors={cols} mine={d === myDiv} final={final} safTeam={safTeam} safCol={safCol} />)}</>
}
// caixa de artilharia reutilizável (temporada e todos os tempos) — top N já pronto.
function ArtilhariaBox({ scorers, colors, title, sub, foot, safTeam, safCol }: { scorers: SeasonScorer[]; colors?: Record<number, FCol>; title: string; sub?: string; foot?: string; safTeam?: string; safCol?: FCol }) {
  const cols = colors ?? {}
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 2px' }}>{title}</p>
      {sub && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: '0 0 8px' }}>{sub}</p>}
      {scorers.length === 0 ? <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>Sem gols ainda. Bola rolando…</p> : (
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Jogador</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Gols</th></tr></thead>
          <tbody>
            {scorers.map((s, i) => {
              const isSaf = !s.you && !!safTeam && s.teamName === safTeam
              const fc = isSaf ? safCol : ((s.human || s.rival) ? cols[s.teamId] : undefined)
              return (
              <tr key={s.name + s.teamName + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', fontWeight: 600, background: fc?.light }}>
                <td style={{ paddingRight: 4 }}>{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}><span style={{ display: 'inline-block', fontSize: 8, fontWeight: 800, color: '#fff', background: DIV_TAG[s.div].bg, borderRadius: 4, padding: '0 4px', marginRight: 4, verticalAlign: 'middle' }}>{DIV_TAG[s.div].l}</span>{s.name}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110, color: fc?.solid ?? 'rgba(0,0,0,0.7)', fontWeight: fc ? 800 : 600 }}>{s.you ? '👤 ' : isSaf ? '💼 ' : s.rival ? '⚔️ ' : s.dorm ? '🏛️ ' : s.human ? '🔥 ' : ''}{(() => { const pk = s.you ? myApoioPerk() : null; return pk ? <span style={apoioText(pk)}>{apoioName(s.teamName)}</span> : s.teamName })()}</td>
                <td style={{ textAlign: 'center', fontWeight: 900 }}>{s.goals}</td>
              </tr>
            )})}
          </tbody>
        </table>
      )}
      {foot && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: '8px 0 0', textAlign: 'center' }}>{foot}</p>}
    </div>
  )
}

// Artilharia da TEMPORADA separada por SÉRIE (A › B › C › D), top 5 de cada —
// em vez de uma lista única misturando todas as divisões. Deixa claro quem é o
// goleador de cada série (é ele que vira artilheiro/piso da divisão).
function ArtilhariaByDiv({ scorers, colors, title, sub, foot, safTeam, safCol }: { scorers: SeasonScorer[]; colors?: Record<number, FCol>; title: string; sub?: string; foot?: string; safTeam?: string; safCol?: FCol }) {
  const cols = colors ?? {}
  const total = scorers.length
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 2px' }}>{title}</p>
      {sub && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: '0 0 8px' }}>{sub}</p>}
      {total === 0 ? <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>Sem gols ainda. Bola rolando…</p> : DIVS.map(d => {
        const top = scorers.filter(s => s.div === d).slice(0, 5) // já vêm ordenados por gols
        return (
          <div key={d} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '2px 0 4px' }}>
              <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 900, color: '#fff', background: DIV_TAG[d].bg, borderRadius: 5, padding: '1px 6px' }}>{DIV_TAG[d].l}</span>
              <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD }}>{DIV_NAME[d]}</span>
            </div>
            {top.length === 0 ? <p style={{ fontSize: 10.5, color: 'rgba(0,0,0,0.45)', fontWeight: 700, margin: '0 0 2px 4px' }}>Sem gols nesta série ainda.</p> : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <tbody>
                  {top.map((s, i) => {
                    const isSaf = !s.you && !!safTeam && s.teamName === safTeam
                    const fc = isSaf ? safCol : ((s.human || s.rival) ? cols[s.teamId] : undefined)
                    return (
                    <tr key={s.name + s.teamName + i} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', fontWeight: 600, background: fc?.light }}>
                      <td style={{ paddingRight: 4, width: 16, color: 'rgba(0,0,0,0.5)', fontWeight: 800 }}>{i + 1}</td>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{i === 0 ? '👑 ' : ''}{s.name}</td>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120, color: fc?.solid ?? 'rgba(0,0,0,0.7)', fontWeight: fc ? 800 : 600 }}>{s.you ? '👤 ' : isSaf ? '💼 ' : s.rival ? '⚔️ ' : s.dorm ? '🏛️ ' : s.human ? '🔥 ' : ''}{(() => { const pk = s.you ? myApoioPerk() : null; return pk ? <span style={apoioText(pk)}>{apoioName(s.teamName)}</span> : s.teamName })()}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900, width: 30 }}>{s.goals}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
      {foot && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.4)', margin: '4px 0 0', textAlign: 'center' }}>{foot}</p>}
    </div>
  )
}

// onde EU terminei/estou: divisão, posição, campeão
export function myStanding(tables: Record<Div, SimTeam[]>): { div: Div; pos: number; champ: boolean; team: string } | null {
  for (const d of DIVS) {
    const i = tables[d].findIndex(t => t.you)
    if (i >= 0) return { div: d, pos: i + 1, champ: i === 0, team: tables[d][i].name }
  }
  return null
}
const DIV_NAME: Record<Div, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D', V: 'Várzea' }
// ritmo da carreira online: +1s por jogo em relação aos outros modos, pra dar
// tempo de decidir tática/Time A-B durante a partida: 8s por rodada (fixo). Só aqui.
const ROUND_MS = 9000
export const COPA_LEG_MS = 9000 // cada JOGO da Copa rola ~9s (como uma partida da liga: 90'+acréscimos). Fase de ida-e-volta = 2×; final (jogo único) = 1×.

// COR DO TIME: todo mundo começa na cor BEGE do "Foi Profissional" — a cor
// de todo mundo. Cor diferente (verde/roxo/prata/OURO com brilho) é benefício
// de quem APOIA o projeto (escada do modal APOIE). A paleta sorteada antiga
// foi aposentada quando a escada de cores virou o padrão.
export interface FCol { solid: string; light: string }
// 🟤 cor dos RIVAIS escolhidos na carreira: um marrom próprio, SEMPRE distinto
// do bege/tier do técnico. A cor de apoio é EXCLUSIVA do seu clube (e da sua
// SAF) — rival nenhum pode aparecer com a mesma cor que você.
export const RIVAL_COL: FCol = { solid: '#9B4D2E', light: '#EBD5C6' }
// tier de apoio lido pelo SELO que viaja no nome do técnico (👑 ouro · ⭐ prata ·
// 💎 roxo) — é o que TODOS já veem, então serve pra cruzar a cor de cada humano
// entre os aparelhos, sem depender de lookup extra. Sem selo → sem tier (bege).
export function perkFromSelo(name: string): ApoioPerk | null {
  return name.includes('👑') ? APOIO_PERKS.ouro : name.includes('⭐') ? APOIO_PERKS.prata : name.includes('💎') ? APOIO_PERKS.roxo : null
}
// perkById: tier de CADA humano (por id), pra colorir amigos com a cor do login
// deles — não só você. Sem entrada = bege (sem fallback: dois sem tier ficam bege).
export function playerColors(humanIds: number[], youId: number, seed: number, rivalIds: number[] = [], perkById: Record<number, ApoioPerk | null> = {}): Record<number, FCol> {
  void seed // a semente era da paleta sorteada; fica na assinatura pra não mexer nos chamadores
  const bege = APOIO_PERKS.bege
  const map: Record<number, FCol> = {}
  // cada humano com a cor do tier DELE (login), lido do selo no nome. Sem tier = bege.
  for (const id of humanIds) { const p = perkById[id]; map[id] = p ? { solid: p.solid, light: p.light } : { solid: bege.solid, light: bege.light } }
  // rivais escolhidos ganham o marrom próprio (nunca a cor do usuário)
  for (const id of rivalIds) map[id] = { solid: RIVAL_COL.solid, light: RIVAL_COL.light }
  // VOCÊ: usa o seu tier autoritativo (myApoioPerk, cobre founders/verde sem selo);
  // sem ele, cai no selo do próprio nome e por fim no bege.
  const perk = myApoioPerk() ?? perkById[youId]
  if (map[youId] !== undefined) map[youId] = perk ? { solid: perk.solid, light: perk.light } : { solid: bege.solid, light: bege.light }
  return map
}
// fundo leve da linha do jogo QUANDO envolve um time colorido (você/SAF/amigo/rival)
const matchBg = (m: { hId: number; aId: number }, colors: Record<number, FCol>) => colors[m.hId]?.light ?? colors[m.aId]?.light ?? undefined
// ordem das divisões: a SUA primeiro, depois a pirâmide de cima pra baixo
function orderedDivs(myDiv: Div | null): Div[] { return myDiv ? [myDiv, ...DIVS.filter(d => d !== myDiv)] : DIVS }

// chips com os times dos AMIGOS (e você) que estão numa divisão — pra bater o
// olho quem está em qual série. Cada um com a SUA cor (inclusive você).
function DivChips({ humans, colors }: { humans: { name: string; teamId: number; you: boolean; rival?: boolean; dorm?: boolean }[]; colors: Record<number, FCol> }) {
  if (humans.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
      {humans.map((h, i) => {
        const perk = h.you ? myApoioPerk() : null
        return (
          <span key={i} style={{ fontSize: 9.5, fontWeight: 900, ...OSWALD, color: '#fff', background: perk ? perk.grad : colors[h.teamId]?.solid ?? '#888', borderRadius: 6, padding: '1px 7px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...(perk ? { position: 'relative' } : {}) }}>{h.you ? '👤 ' : h.dorm ? '🏛️ ' : h.rival ? '⚔️ ' : ''}{h.you ? apoioName(h.name) : h.name}{perk && <ApoioSheen holo={perk.holo} dur={3} />}</span>
        )
      })}
    </div>
  )
}

// ── SEU JOGO em destaque: card grande com o minuto correndo + os gols (nome do
// artilheiro), igual à simulação do modo off-line. ──
// TICKER de frases: mostra UMA linha por vez, trocando sozinha a cada ~4,5s.
// Cada item tem cor de faixa (por tipo) + ícone + texto.
type Flavor = { c: string; ic: string; tag: string; node: React.ReactNode }
function RivalryTicker({ items }: { items: Flavor[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (items.length <= 1) return
    const iv = setInterval(() => setI(x => x + 1), 4500)
    return () => clearInterval(iv)
  }, [items.length])
  if (!items.length) return null
  const idx = i % items.length
  const it = items[idx]
  return (
    // ticker estilo "lower-third" de TV: trilho colorido por tipo + etiqueta de
    // categoria (preta) + a frase que troca sozinha + pontinhos de progresso.
    <div style={{ display: 'flex', alignItems: 'stretch', border: `2.5px solid ${INK}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: `3px 3px 0 0 ${INK}`, marginBottom: 10, minHeight: 46 }}>
      <style>{'@keyframes coFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'}</style>
      <div style={{ width: 7, background: it.c, flexShrink: 0 }} />
      <div key={'tag' + idx} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 11px', background: INK, color: '#fff', flexShrink: 0, animation: 'coFade .45s ease' }}>
        <span style={{ fontSize: 15 }}>{it.ic}</span>
        <span style={{ ...OSWALD, fontWeight: 800, fontSize: 11, letterSpacing: 0.4 }}>{it.tag}</span>
      </div>
      <div key={idx} style={{ flex: 1, minWidth: 0, padding: '8px 11px', display: 'flex', alignItems: 'center', animation: 'coFade .45s ease' }}>
        {/* o texto num único <span> pra o nome colorido fluir INLINE (senão o flex
            separa em itens e come os espaços — "seguraNeymarzetti13") */}
        <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25 }}>{it.node}</span>
      </div>
      {items.length > 1 && <div style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '0 9px', flexShrink: 0 }}>{items.map((_, k) => <span key={k} style={{ width: 5, height: 5, borderRadius: 999, background: k === idx ? INK : 'rgba(0,0,0,0.2)' }} />)}</div>}
    </div>
  )
}
// ── PLACAR AO VIVO (reutilizável): relógio animado, selo GOOOL, flash e bump.
// Usado na carreira (pirâmide) E no jogo rápido (offline/online) — mesmo visual.
export interface ScoreGoal { name: string; min: number; home: boolean }
export function LiveScoreCard({ homeName, awayName, homeColor, awayColor, youIsHome, goals, roundKey, roundMs, finished, classico, basket }:
  { homeName: string; awayName: string; homeColor: string; awayColor: string; youIsHome: boolean; goals: ScoreGoal[]; roundKey: number; roundMs: number; finished?: boolean; classico?: boolean; basket?: { h: number; a: number } }) {
  // 🏀 basquete: `basket` traz os PONTOS finais (ex.: 112/98). O placar então SOBE
  // até esse total conforme o relógio (não conta lances). SÓ o basquete passa isto
  // — no futebol `basket` é undefined e TUDO fica exatamente como hoje.
  const [min, setMin] = useState(finished ? 93 : 0)
  // 🚫 ANTI-SPOILER: quando entra uma rodada nova (roundKey muda) o relógio ainda
  // está no 93' da rodada anterior por 1 frame — o que mostraria TODOS os gols (o
  // placar FINAL) do jogo novo antes do apito. Zera JÁ na renderização, sem flash.
  const rkRef = useRef(roundKey)
  if (rkRef.current !== roundKey) { rkRef.current = roundKey; setMin(finished ? 93 : 0) }
  useEffect(() => {
    // o relógio só zera/anima quando MUDA A RODADA (roundKey). Trocar a tática na
    // mesma rodada não reinicia o jogo que está na tela — ele não re-simula.
    if (finished) { setMin(93); return }
    setMin(0)
    // relógio por TEMPO (não por passo fixo): sobe 0→93' ao longo de `dur`. Assim
    // cada velocidade é REALMENTE diferente — o passo fixo batia num piso (30ms) e
    // 2× e 4× ficavam iguais. E termina EXATO no fim do jogo (nada de liberar o
    // "próxima" antes do apito). Piso de 400ms pra nunca ficar instantâneo.
    const dur = Math.max(400, roundMs * 0.82)
    const t0 = Date.now()
    const iv = setInterval(() => {
      const m = Math.min(93, Math.round(((Date.now() - t0) / dur) * 93))
      setMin(m)
      if (m >= 93) clearInterval(iv)
    }, 40)
    return () => clearInterval(iv)
  }, [roundKey, finished, roundMs])
  const done = min >= 93
  // 🛟 no FIM mostra TODOS os gols — o placar do card TEM que bater com o da
  // tabela (antes, gol nos acréscimos além do relógio sumia da tela e o
  // resultado exibido divergia da pontuação: vitória virava empate etc.).
  const shown = done ? goals : goals.filter(g => g.min <= min)
  // futebol: placar = nº de gols mostrados. 🏀 basquete: pontos interpolados 0→total.
  const hg = basket ? Math.round(basket.h * (done ? 1 : min / 93)) : shown.filter(g => g.home).length
  const ag = basket ? Math.round(basket.a * (done ? 1 : min / 93)) : shown.filter(g => !g.home).length
  // eventos (lances) mostrados — no futebol batem com os gols; no basquete são os
  // ~6 lances de destaque. O SELO (gol/cesta) dispara por evento, não por ponto.
  const evH = shown.filter(g => g.home).length, evA = shown.filter(g => !g.home).length
  // ── RITUAIS DO JOGO: apito inicial e apito final (frases fixas de narração —
  // lances aleatórios no meio soavam robóticos e foram removidos). O texto fica
  // uns segundos REAIS na faixinha de baixo e some.
  // 🕐 narração amarrada ao RELÓGIO (não a timers fixos), pra BATER com o minuto que
  // aparece na tela: o apito inicial só no comecinho do 1º tempo; o "segundo tempo" SÓ
  // depois dos 45'; e o apito final no FIM. Antes usava timers de 2,8s soltos e o
  // "segundo tempo" acabava aparecendo enquanto o 1º tempo ainda rolava. Como agora
  // escala com o relógio, fica sincronizado em qualquer velocidade.
  const ritual: 'start' | 'half' | 'end' | null =
    finished ? null
      : done ? 'end'
        : min <= 18 ? 'start'
          : (min >= 45 && min <= 63) ? 'half'
            : null
  // 🎙️ NARRAÇÃO variada: cada rodada sorteia (determinístico pelo roundKey → a sala
  // toda vê o mesmo no online) uma frase do banco pra apito inicial, volta do
  // intervalo e apito final. Bem mais vida que a mesma frase toda partida — sem
  // re-introduzir a narração robótica do meio do jogo (que foi tirada de propósito).
  const rk = Math.abs(roundKey)
  const START = basket
    ? ['🟢 Bola ao alto — começa o jogo!', '🟢 Pulou a bola — tá valendo!', '🟢 Começa o duelo na quadra!']
    : ['🟢 Aaaaaauutoriza o árbitro — começa o primeiro tempo!', '🟢 Rolou a bola — começa o jogo!', '🟢 Apitou o juiz: é dado o pontapé inicial!', '🟢 Começa a peleja de gente grande!', '🟢 Bola rolando — que comece a batalha!', '🟢 De saída! O árbitro liberou o duelo!']
  const HALF = basket
    ? ['🟢 Volta pra quadra — segundo tempo!', '🟢 Recomeça o jogo na quadra!', '🟢 Segunda metade — agora vale!']
    : ['🟢 Aaaaaauutoriza o árbitro — rola o segundo tempo!', '🟢 Volta do intervalo — bola rolando de novo!', '🟢 Recomeça o jogo pra etapa final!', '🟢 Segundo tempo na área — agora decide!', '🟢 Voltaram os times: 45 minutos pra história!']
  const END = basket
    ? ['📢 Buzina final — acabou o jogo!', '📢 Fim de jogo na quadra!', '📢 Soou a buzina: fim de papo!', '📢 Acabou o duelo na quadra!']
    : ['📢 Apito final — termina o jogo!', '📢 Apitou o árbitro: acabou!', '📢 Fim de jogo — pode tirar o uniforme!', '📢 Acabou! O juiz encerrou a peleja!', '📢 Fim de papo — placar fechado!', '📢 Soou o apito final — é isso aí!']
  const ritualTxt = ritual === 'start' ? START[rk % START.length]
    : ritual === 'half' ? HALF[rk % HALF.length]
      : ritual === 'end' ? END[rk % END.length]
        : null
  // ⏱️ relógio: futebol conta 0→90'; 🏀 basquete = 4 quartos de 12min contando
  // pra baixo (Q1 12:00 → Q4 0:00). O `min` (0→93) só dirige a animação — aqui
  // vira o rótulo certo por esporte.
  const basketClock = () => {
    const prog = Math.min(1, min / 93) // 0..1 do jogo
    if (prog >= 1) return 'FINAL'
    const q = Math.min(4, Math.floor(prog * 4) + 1) // quarto 1..4
    const within = (prog * 4) % 1 // 0..1 dentro do quarto
    const secLeft = Math.max(0, Math.round((1 - within) * 12 * 60)) // conta regressiva de 12min
    const mm = Math.floor(secLeft / 60), ss = secLeft % 60
    return `Q${q} ${mm}:${ss.toString().padStart(2, '0')}`
  }
  const minLabel = basket ? basketClock() : (min >= 93 ? 'FIM' : min > 90 ? `90+${min - 90}'` : `${min}'`)
  const iAmHome = youIsHome
  const last = shown.length ? [...shown].sort((a, b) => a.min - b.min)[shown.length - 1] : null
  const homeCol = homeColor, awayCol = awayColor
  const ini = (n: string) => n.trim()[0]?.toUpperCase() ?? '?'

  // ── SAIU GOL! detecta quando hg/ag sobem (só ao vivo) e dispara o selo GOOOL,
  //    o flash no lado de quem marcou e o "bump" no número. ──
  const prev = useRef({ h: evH, a: evA, key: roundKey })
  const [goal, setGoal] = useState<'h' | 'a' | null>(null)
  const [lateGoal, setLateGoal] = useState(false) // gol/cesta depois dos 85' → selo especial
  useEffect(() => {
    const p = prev.current
    if (p.key !== roundKey) { p.key = roundKey; p.h = evH; p.a = evA; return } // trocou a rodada: rebaseia sem animar
    let side: 'h' | 'a' | null = null
    if (evH > p.h) side = 'h'; else if (evA > p.a) side = 'a'
    p.h = evH; p.a = evA
    if (side && !finished) {
      setGoal(side)
      setLateGoal(min >= 86)
      const t = setTimeout(() => setGoal(null), 1700)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evH, evA, roundKey, finished])
  void iAmHome

  const Team = ({ name, color, you, flash }: { name: string; color: string; you: boolean; flash?: boolean }) => {
    const perk = you ? myApoioPerk() : null
    // lado SÓLIDO na cor do time: você = tier (com brilho); rival/amigo = a cor
    // que o jogo deu (rival = marrom único · amigo = tier dele). Texto em contraste.
    const bg = perk ? perk.grad : color
    const ink = perk ? TIER_INK[perk.tier] : _inkFor(color)
    return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: '22px 8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', background: bg, minWidth: 0 }}>
      {flash && <div style={{ position: 'absolute', inset: 0, background: '#fff', animation: 'coGoalFlash 1.6s ease', pointerEvents: 'none' }} />}
      {perk && <ApoioSheen holo={perk.holo} dur={4.2} />}
      {/* 🛡️ escudo do clube no placar (o basquete segue com a inicial — visual dele
          ainda não foi aprovado) */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: flash ? 'coBump .6s ease' : undefined, ...(basket ? { width: 28, height: 28, borderRadius: 8, border: `2px solid ${INK}`, background: '#fff', color: INK, fontWeight: 900, fontSize: 13, ...OSWALD } : null) }}>{basket ? ini(name) : <Escudo nome={name} size={34} />}</div>
      <div style={{ position: 'relative', fontSize: 12, fontWeight: 900, ...OSWALD, color: ink, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{perk ? apoioName(name) : name}</div>
      <div style={{ position: 'relative', fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: ink, opacity: 0.72 }}>{you ? 'você' : 'rival'}</div>
    </div>
    )
  }
  // 🎙️ selo de GOL variado (determinístico pelo minuto do gol → mesmo selo no online)
  const goalSeed = Math.abs(last?.min ?? min)
  const GOAL_FUT = ['⚽ GOOOL!', '⚽ É GOOOL!', '⚽ PINGOU!', '⚽ NA REDE!', '⚽ SACUDIU!', '⚽ ESTUFOU!', '⚽ GOLAÇO!']
  const GOAL_FUT_LATE = ['🔥 GOL NO FIM!', '🔥 NO ÚLTIMO SUSPIRO!', '🔥 NOS ACRÉSCIMOS!', '🔥 SALVOU NO FIM!']
  const goalStamp = basket
    ? (lateGoal ? '🔥 CESTA NO FIM!' : '🏀 CESTA!')
    : (lateGoal ? GOAL_FUT_LATE[goalSeed % GOAL_FUT_LATE.length] : GOAL_FUT[goalSeed % GOAL_FUT.length])
  return (
    <div style={{ ...box(classico ? '#FFF4D6' : '#fff'), overflow: 'hidden', marginBottom: 10, position: 'relative' }}>
      <style>{'@keyframes coPulse{0%{box-shadow:0 0 0 0 rgba(255,91,77,.6)}70%{box-shadow:0 0 0 7px rgba(255,91,77,0)}100%{box-shadow:0 0 0 0 rgba(255,91,77,0)}}@keyframes coGoalFlash{0%{opacity:0}14%{opacity:.32}100%{opacity:0}}@keyframes coBump{0%{transform:scale(1)}28%{transform:scale(1.4)}60%{transform:scale(.9)}100%{transform:scale(1)}}@keyframes coStamp{0%{transform:translateX(-50%) scale(0) rotate(-14deg);opacity:0}45%{transform:translateX(-50%) scale(1.18) rotate(-7deg);opacity:1}70%{transform:translateX(-50%) scale(.94) rotate(-7deg)}100%{transform:translateX(-50%) scale(1) rotate(-7deg);opacity:1}}'}</style>
      {classico && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 3, background: INK, color: GOLD, fontSize: 9.5, fontWeight: 900, ...OSWALD, padding: '2px 7px', borderRadius: 6, letterSpacing: 0.5 }}>🥊 CLÁSSICO</div>}
      {/* selo GOOOL! — surge sobre o lado de quem marcou */}
      {goal && <div style={{ position: 'absolute', top: 4, left: goal === 'h' ? '25%' : '75%', transform: 'translateX(-50%) rotate(-7deg)', zIndex: 4, background: GOLD, color: INK, border: `2.5px solid ${INK}`, borderRadius: 9, padding: '3px 12px', ...OSWALD, fontWeight: 900, fontSize: 17, letterSpacing: 0.5, boxShadow: `2px 2px 0 0 ${INK}`, animation: 'coStamp .5s cubic-bezier(.2,1.4,.5,1) both', whiteSpace: 'nowrap', ...(lateGoal ? { background: '#FF5B4D', color: '#fff' } : {}) }}>{goalStamp}</div>}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: INK, color: '#fff', fontSize: 11, fontWeight: 900, ...OSWALD, padding: '3px 11px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6, zIndex: 2, whiteSpace: 'nowrap' }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: done ? GREEN : '#ff5b4d', animation: done ? 'none' : 'coPulse 1.4s infinite' }} /> {done ? (basket ? 'FINAL' : 'FIM') : minLabel}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch' }}>
        <Team name={homeName} color={homeCol} you={youIsHome} flash={goal === 'h'} />
        {/* placar central limpo (sem tarja preta) — número grande no creme; cada
            número dá um "bump" quando MUDA (key = valor → remonta e reanima) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px 6px 8px', minWidth: 88, ...OSWALD, fontWeight: 900, fontSize: 34, color: INK, lineHeight: 1 }}>
          <span key={'h' + hg} style={{ padding: '0 8px', display: 'inline-block', animation: 'coBump .55s ease' }}>{hg}</span><span style={{ color: '#b8b0a0', fontSize: 16 }}>×</span><span key={'a' + ag} style={{ padding: '0 8px', display: 'inline-block', animation: 'coBump .55s ease' }}>{ag}</span>
        </div>
        <Team name={awayName} color={awayCol} you={!youIsHome} flash={goal === 'a'} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '7px 12px', borderTop: '2px solid #e6dcbf', background: '#efe4c8' }}>
        <span key={ritualTxt ?? 'g'} style={{ fontSize: 11, fontWeight: ritualTxt ? 900 : 700, ...OSWALD, color: ritualTxt ? INK : 'rgba(0,0,0,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%', animation: ritualTxt ? 'coFade .4s ease' : undefined }}>
          {ritualTxt ?? (last ? <>{basket ? '🏀' : '⚽'} {last.name}{!basket && <> <span style={{ opacity: 0.6 }}>{last.min > 90 ? `90+${last.min - 90}'` : `${last.min}'`}</span></>}</> : (done ? (basket ? 'sem cestas' : 'sem gols') : (basket ? '🟢 bola quicando…' : '🟢 bola rolando…')))}
        </span>
      </div>
    </div>
  )
}

// wrapper da CARREIRA: resolve cores por técnico e passa pro placar compartilhado.
function MyMatchCard({ m, youName, finished, col, colors, roundKey, roundMs = ROUND_MS }: { m: SimMatch; youName: string; finished?: boolean; col: FCol; colors?: Record<number, FCol>; roundKey: number; roundMs?: number }) {
  const iAmHome = m.h === youName
  const oppId = iAmHome ? m.aId : m.hId
  const oppCol = colors?.[oppId]?.solid ?? '#3A7CA5'
  return <LiveScoreCard homeName={m.h} awayName={m.a} homeColor={iAmHome ? col.solid : oppCol} awayColor={iAmHome ? oppCol : col.solid}
    youIsHome={iAmHome} goals={m.goals} roundKey={roundKey} roundMs={roundMs} finished={finished} />
}

// ── os JOGOS de uma divisão (placar + quem fez os gols), cores por amigo ──
function DivMatches({ div, matches, colors, humans, hideId, reveal = true }: { div: Div; matches: SimMatch[]; colors: Record<number, FCol>; humans: { name: string; teamId: number; you: boolean; rival?: boolean; dorm?: boolean }[]; hideId?: number; reveal?: boolean }) {
  // cor SÓ pra quem interessa: você/SAF/2º clube (seu tier) e rivais (marrom) vêm
  // do `colors`; bots ficam PRETO NEUTRO (igual à tabela de classificação) — antes
  // ficavam num tom quente que parecia DOURADO e confundia com a sua cor de tier.
  const nameCol = (id: number) => colors[id]?.solid ?? INK
  return (
    <div style={{ ...box('#fff'), padding: 9, marginBottom: 8 }}>
      <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, margin: 0 }}>{DIV_LABEL[div]}</p>
      <DivChips humans={humans} colors={colors} />
      <div style={{ marginTop: 6 }}>
        {matches.map((m, i) => {
          if (hideId != null && (m.hId === hideId || m.aId === hideId)) return null
          const bg = matchBg(m, colors)
          const last = m.goals.length ? m.goals[m.goals.length - 1] : null
          return (
            <div key={i} style={{ padding: '3px 4px', borderTop: i ? '1px solid rgba(0,0,0,0.07)' : 'none', background: bg, borderRadius: bg ? 5 : 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 5 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, minWidth: 0, fontWeight: bg ? 900 : 600, fontSize: 11.5, ...OSWALD, color: nameCol(m.hId) }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.h}</span><Escudo nome={m.h} size={16} />
                </span>
                {/* 🙈 ANTI-SPOILER: enquanto o SEU jogo anima, os outros jogos ficam "em jogo"
                    (placar e gol escondidos). Todos revelam juntos quando o seu apito soa. */}
                {reveal
                  ? <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD, background: bg ? INK : '#eee', color: bg ? '#fff' : INK, borderRadius: 5, padding: '0 7px' }}>{m.hg}×{m.ag}</span>
                  : <span style={{ fontWeight: 900, fontSize: 10, ...OSWALD, background: '#efe4c8', color: 'rgba(0,0,0,.55)', borderRadius: 5, padding: '0 7px', whiteSpace: 'nowrap' }}>🟢 em jogo</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontWeight: bg ? 900 : 600, fontSize: 11.5, ...OSWALD, color: nameCol(m.aId) }}>
                  <Escudo nome={m.a} size={16} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.a}</span>
                </span>
              </div>
              {reveal && last && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.55)', margin: '1px 0 0', textAlign: 'center' }}>⚽ {last.name} <span style={{ opacity: 0.7 }}>{last.min > 90 ? `90+${last.min - 90}'` : `${last.min}'`}</span></p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ELENCO: seu time por posição, com o VALOR (piso) de cada jogador. Os
// melhores de cada posição (pela formação) são os titulares (fundo creme); as
// reservas aparecem AO LADO, na mesma linha de posição. Sem estrela/badge. ──
const POS_LABEL: Record<Sector, string> = { GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meias', ATA: 'Atacantes' }
type ListCfg = { listed: boolean; listable: boolean; onList: () => void }
function PlayerRow({ c, titular, col, onSwap, list }: { c: WonCard; titular: boolean; col: FCol; onSwap?: () => void; list?: ListCfg }) {
  const listed = !!list?.listed
  const dim = !!list && !list.listable && !listed // modo listagem: sem poder listar (último da posição / bloqueado)
  const onClick = onSwap ?? (list && (list.listable || listed) ? list.onList : undefined)
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '4px 7px', borderRadius: 6, background: listed ? '#FDE7E4' : titular ? '#fff' : 'rgba(255,255,255,0.5)', borderLeft: `3px solid ${listed ? '#C2452F' : titular ? col.solid : 'transparent'}`, marginBottom: 3, opacity: dim ? 0.45 : 1, cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ fontWeight: titular ? 800 : 600, fontSize: 12, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: listed ? '#a23325' : titular ? INK : '#6a6658' }}>
        {c.name}
        {c.emprestado && <EmpTag />}
        {onSwap && <span style={{ fontWeight: 900, marginLeft: 4, color: titular ? '#c0392b' : GREEN }}>{titular ? '▼' : '▲'}</span>}
        {list && <span style={{ fontWeight: 900, marginLeft: 4, fontSize: 10, color: listed ? '#C2452F' : dim ? 'rgba(0,0,0,0.35)' : GREEN }}>{listed ? '🔴 À VENDA (tirar)' : dim ? '🔒' : '+ listar'}</span>}
      </span>
      <span style={{ fontWeight: 900, fontSize: 11, ...OSWALD, whiteSpace: 'nowrap', color: '#5a5647', flexShrink: 0 }}>💰 {c.paid ?? 0}</span>
    </div>
  )
}
// ELENCO com CAMPINHO: os titulares (XI escolhido) aparecem num campinho; as
// reservas numa lista embaixo. Pra trocar: toca num jogador (fica MARCADO) e os
// da MESMA posição do outro lado ACENDEM — toca em qual quer trocar. Vale pros
// dois sentidos (titular↔reserva). Aplica no próximo jogo, como a tática.
function ElencoField({ mgr, col, xiIds, xi, goals, selId, onTap, seasonNo, contratosOn }: { mgr: Manager; col: FCol; xiIds: Set<string>; xi?: WonCard[]; goals?: Record<string, number>; selId: string | null; onTap?: (id: string) => void; seasonNo?: number; contratosOn?: boolean }) {
  // 📝 CONTRATO SUTIL (pedido do Diego 04/08): vive na coluna da DIREITA,
  // embaixo do 💰 piso e 💸 salário — ali nunca corta em tela estreita, e a
  // linha "clube · ano" da esquerda fica inteira. Cinza quando está tudo certo
  // (quase invisível); ⏳ âmbar no último ano; ❗ vermelho vencido.
  // Emprestado/incógnito não mostram nada.
  const ctInfo = (c: WonCard): { txt: string; color: string } | null => {
    if (c.cria) return { txt: '🌱 sem contrato', color: 'rgba(0,0,0,0.45)' }
    if (!contratosOn || c.fake || c.emprestado || c.contratoAte == null) return null
    const sn = seasonNo ?? 1
    if (c.contratoAte < sn) return { txt: '❗ vencido', color: '#C2452F' }
    if (c.contratoAte === sn) return { txt: '⏳ último ano', color: '#B8860B' }
    const anos = c.contratoAte - sn + 1
    return { txt: `📝 ${anos} anos`, color: 'rgba(0,0,0,0.45)' }
  }
  const goalsOf = (c: WonCard) => goals?.[c.id] ?? 0
  const salaryOn = (seasonNo ?? 1) >= 4 // 🔓 salário/folha só aparecem a partir da 4ª temporada
  const sel = selId ? mgr.squad.find(c => c.id === selId) ?? null : null
  const isTarget = (c: WonCard) => !!sel && sel.id !== c.id && sel.pos === c.pos && (xiIds.has(sel.id) !== xiIds.has(c.id))
  const stateOf = (c: WonCard) => (c.id === selId ? 'sel' : isTarget(c) ? 'target' : sel ? 'dim' : 'idle')
  const borderOf = (st: string) => (st === 'sel' ? GOLD : st === 'target' ? GREEN : INK)
  // o campinho segue a ORDEM da escalação (vaga fixa) — quando entra um reserva,
  // ele fica no mesmo lugar do que saiu. Fallback: ordena por rating.
  const xiOf = (pos: Sector) => xi ? xi.filter(c => c.pos === pos) : mgr.squad.filter(c => c.pos === pos && xiIds.has(c.id)).sort((a, b) => mid(b) - mid(a))
  const lats = xiOf('LAT')
  const defense = [...(lats[0] ? [lats[0]] : []), ...xiOf('ZAG'), ...(lats[1] ? [lats[1]] : [])]
  const rows: { key: string; cards: WonCard[] }[] = [
    { key: 'ATA', cards: xiOf('ATA') },
    { key: 'MEI', cards: xiOf('MEI') },
    { key: 'DEF', cards: defense },
    { key: 'GOL', cards: xiOf('GOL') },
  ]
  const reserves = mgr.squad.filter(c => !xiIds.has(c.id)).sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos) || mid(b) - mid(a))
  const titulares = SECTORS.flatMap(pos => xiOf(pos)) // mesma ordem da lista de reservas (GOL→ATA)
  // linha compartilhada titular/reserva: no campinho o nome já mal cabe, então o
  // clube · ano (que diferencia o Kaká do SP do Kaká do Milan) vive AQUI nas
  // listas — e a troca funciona igual: toca num, acende os da mesma posição.
  // linha COMPACTA (meia largura): nome em cima, clube · ano embaixo — assim as
  // duas listas cabem lado a lado no celular sem cortar nada importante.
  // altura FIXA (48px) → as duas listas (Titulares | Reservas) batem linha a linha,
  // não importa o tamanho do nome do clube. Na direita: 💰 piso e 💸 salário (piso÷10,
  // em vermelho = custo) lado a lado; o gol fica em cima, como já era; o
  // contrato (📝/⏳/❗/🌱) fica embaixo dos dois.
  const rowOf = (c: WonCard, titular: boolean) => { const st = stateOf(c); return (
    <div key={c.id} onClick={() => onTap?.(c.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, height: 48, padding: '0 6px', borderRadius: 6, background: st === 'sel' ? '#FFF6D6' : titular ? '#fff' : 'rgba(255,255,255,0.88)', border: `2px solid ${st === 'idle' ? 'transparent' : borderOf(st)}`, marginBottom: 3, opacity: st === 'dim' ? 0.5 : 1, cursor: onTap ? 'pointer' : 'default' }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: titular ? 800 : 700, fontSize: 11.5, ...OSWALD, color: titular ? INK : '#4a4740', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ fontWeight: 900, fontSize: 8.5, color: col.solid, marginRight: 4 }}>{c.pos}</span>{c.name}{c.emprestado && <EmpTag />}
        </span>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 9, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.club} · {c.year}</span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, lineHeight: 1.25, gap: 1 }}>
        {goalsOf(c) > 0 && <span style={{ fontWeight: 900, fontSize: 10, ...OSWALD, color: GREEN }}>⚽ {goalsOf(c)}</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontWeight: 900, fontSize: 10, ...OSWALD, color: '#5a5647' }}>💰 {c.paid ?? 0}</span>
          {salaryOn && <span title="Salário por ano (piso ÷ 10)" style={{ fontWeight: 900, fontSize: 9.5, ...OSWALD, color: '#C2452F', background: 'rgba(194,69,47,.10)', border: '1px solid rgba(194,69,47,.30)', borderRadius: 5, padding: '0 3px' }}>💸 {salaryOfCard(c)}</span>}
        </span>
        {(() => { const k = ctInfo(c); return k ? <span style={{ fontWeight: 800, fontSize: 8.5, color: k.color, whiteSpace: 'nowrap' }}>{k.txt}</span> : null })()}
      </span>
    </div>
  ) }
  return (
    <div>
      {onTap && (
        <div style={{ border: `3px solid ${sel ? GREEN : INK}`, background: sel ? '#E9F9EF' : '#FFF6D6', borderRadius: 11, padding: '9px 12px', margin: '0 0 10px', boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p style={{ fontSize: 13.5, fontWeight: 900, ...OSWALD, color: sel ? GREEN : INK, margin: 0, lineHeight: 1.2 }}>
            {sel ? <>🔁 Trocar <b>{sel.name}</b> por qual {POS_LABEL[sel.pos].toLowerCase()}? Toque um aceso 👇</> : <>🔁 Faça suas trocas aqui: toque num jogador e depois no outro.</>}
          </p>
          {!sel && <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', margin: '3px 0 0' }}>Vale do próximo jogo em diante.</p>}
        </div>
      )}
      <div style={{ border: `3px solid ${INK}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ padding: '8px 5px', display: 'flex', flexDirection: 'column', gap: 5, background: `repeating-linear-gradient(180deg, ${GREEN} 0 30px, #166332 30px 60px)` }}>
          {rows.map(r => (
            // 🥅 linha ÚNICA por setor (nunca quebra): a defesa tem 4 cartas (LAT-ZAG-
            // ZAG-LAT) e no celular a 4ª "pulava" pra baixo, parecendo formação errada
            // (um lateral em cima do goleiro). Com nowrap + flex, as cartas ENCOLHEM
            // pra caber lado a lado — a linha de trás fica reta, como um 4-3-3 de verdade.
            <div key={r.key} style={{ display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'nowrap' }}>
              {r.cards.map(c => { const st = stateOf(c); return (
                <button key={c.id} onClick={() => onTap?.(c.id)} disabled={!onTap} style={{ position: 'relative', flex: '1 1 0', minWidth: 0, border: `2px solid ${borderOf(st)}`, borderRadius: 8, background: st === 'sel' ? '#FFF6D6' : '#fff', padding: '3px 6px', maxWidth: 96, textAlign: 'center', cursor: onTap ? 'pointer' : 'default', opacity: st === 'dim' ? 0.5 : 1, boxShadow: st === 'target' ? `0 0 0 2px ${GREEN}` : 'none', ...OSWALD }}>
                  {c.emprestado && <EmpTag mini />}
                  <span style={{ display: 'block', fontSize: 8, fontWeight: 900, color: col.solid }}>{c.pos}</span>
                  <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                  {goalsOf(c) > 0 && <span style={{ display: 'block', fontSize: 8.5, fontWeight: 900, color: GREEN }}>⚽ {goalsOf(c)}</span>}
                </button>
              ) })}
            </div>
          ))}
        </div>
      </div>
      {/* 💸 FOLHA total do time — soma dos salários (piso ÷ 10). Cobrada no fim da
          temporada. Fica aqui em cima das listas pra você ver o custo de relance. */}
      {salaryOn && (() => { const folha = squadPayroll(mgr.squad as WonCard[]); return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(150deg,#2A241A,#17130A)', border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 11px', margin: '0 0 10px', boxShadow: `2px 2px 0 0 ${INK}` }}>
          <span style={{ fontSize: 17 }}>💸</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 900, fontSize: 11.5, ...OSWALD, color: '#fff', letterSpacing: 0.3 }}>FOLHA DO TIME</span>
            <span style={{ display: 'block', fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>cobrada no fim da temporada · piso ÷ 10 por jogador</span>
          </span>
          <span style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ display: 'block', fontWeight: 900, fontSize: 17, ...OSWALD, color: '#E7503A', lineHeight: 1 }}>{folha}</span>
            <span style={{ display: 'block', fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>🪙 / ano</span>
          </span>
        </div>
      ) })()}
      {/* TITULARES e RESERVAS lado a lado: no campinho não cabe o clube · ano,
          então as listas mostram — e a troca funciona nos dois lugares (toca num
          jogador de qualquer lista OU do campinho e completa no outro). */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, color: '#fff', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: 0.3, textShadow: '1px 1px 0 rgba(0,0,0,.35)' }}>⭐ Titulares ({titulares.length})</p>
          {titulares.map(c => rowOf(c, true))}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, color: '#fff', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: 0.3, textShadow: '1px 1px 0 rgba(0,0,0,.35)' }}>🔁 Reservas ({reserves.length})</p>
          {reserves.length === 0
            ? (seasonNo === 1
                ? <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.4 }}>🔒 Na Temporada 1 você joga com os 11. <b>No próximo leilão</b> (no fim desta temporada) você enche o banco — até 22! 🔨</p>
                : <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Sem reservas no banco.</p>)
            : reserves.map(c => rowOf(c, false))}
        </div>
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', lineHeight: 1.4, textShadow: '1px 1px 0 rgba(0,0,0,.25)' }}>
        💡 O nível de cada carta é o <b>auge do jogador naquele clube e ano</b>: Kaká · São Paulo 2003 é promessa, Kaká · Milan 2007 é lenda.
      </p>
    </div>
  )
}
// 📤 Compartilhar elenco: gera a arte aprovada (header na cor do time + campinho
// + listas com gols/valor + rodapé) e abre o compartilhar nativo do celular.
function ShareElencoBtn({ mgr, col, xi, xiIds, goals, divName, tablePos, seasonNo, coins, titles }: {
  mgr: Manager; col: FCol; xi: WonCard[]; xiIds: Set<string>; goals: Record<string, number>
  divName: string; tablePos: number; seasonNo: number; coins: number; titles: number
}) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    if (busy) return
    setBusy(true)
    try {
      const g = (c: WonCard) => goals[c.id] ?? 0
      const of = (pos: Sector) => xi.filter(c => c.pos === pos)
      const lats = of('LAT')
      const def = [...(lats[0] ? [lats[0]] : []), ...of('ZAG'), ...(lats[1] ? [lats[1]] : [])]
      const fieldRows = [of('ATA'), of('MEI'), def, of('GOL')].map(cards =>
        cards.map(c => ({ pos: c.pos, name: c.name, goals: g(c) })))
      const toRow = (c: WonCard): ElencoPlayerRow => ({ pos: c.pos, name: c.name, goals: g(c), paid: c.paid ?? 0 })
      const titulares = SECTORS.flatMap(pos => of(pos)).map(toRow)
      const reservas = mgr.squad.filter(c => !xiIds.has(c.id))
        .sort((a, b) => SECTORS.indexOf(a.pos) - SECTORS.indexOf(b.pos)).map(toRow)
      // 🎨 fidelidade de tier na arte: quem tem tier leva o manto (degradê +
      // brilho) pra imagem compartilhada também — igual à aba Elenco.
      const perk = myApoioPerk()
      await shareElenco({
        teamName: mgr.teamName + apoioSelo(), divName, tablePos, seasonNo, formation: mgr.formation,
        titles, squadValue: mgr.squad.reduce((s2, c) => s2 + (c.paid ?? 0), 0), coins,
        color: col.solid, tierGrad: perk?.grad, tierHolo: perk?.holo ?? 0, fieldRows, titulares, reservas,
      })
    } finally { setBusy(false) }
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={go} disabled={busy}
        style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 12, padding: '12px 8px', fontWeight: 900, fontSize: 15, ...OSWALD, background: 'linear-gradient(180deg,#FFE07A,#F5B301)', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', color: INK }}>
        {busy ? '🎨 Gerando a arte…' : '📤 COMPARTILHAR MEU ELENCO'}
      </button>
      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.5)', textAlign: 'center', marginTop: 5 }}>
        gera a imagem do teu time — mostra teu elenco e marca a gente! 📲 @leilaolegendscom
      </p>
    </div>
  )
}

// ── PRÉVIA DOURADA: acordeão fechado no fim das abas Elenco e Estádio — o
// "gostinho" do tier Lenda com o PRÓPRIO time da pessoa, marcado como modelo
// de teste, com o botão do APOIE logo abaixo. Quem já é ouro não vê.
function GoldTeaser({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  if (myApoioPerk()?.tier === 'ouro') return null
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 12, padding: '10px 12px', fontWeight: 900, fontSize: 12.5, ...OSWALD, background: 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)', color: INK, boxShadow: `3px 3px 0 0 ${INK}`, cursor: 'pointer', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <ApoioSheen holo={0.75} dur={2.6} />
        <span style={{ position: 'relative' }}>{open ? '▾' : '✨'} {label}</span>
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <div style={{ position: 'relative' }}>
            {children}
            <ApoioPreviewMark />
          </div>
          <p style={{ fontSize: 10.5, fontWeight: 800, textAlign: 'center', color: '#5a5647', margin: '6px 0 8px' }}>☝️ prévia de teste — assim fica o SEU no tier Lenda 👑 (ouro ou qualquer cor com brilho)</p>
          <ApoieButton big />
        </div>
      )}
    </div>
  )
}

const POS_SHORT: Record<Sector, string> = { GOL: 'goleiro', LAT: 'lateral', ZAG: 'zagueiro', MEI: 'meia', ATA: 'atacante' }
function SquadTab({ mgr, col, coins, xiIds, xi, goals, onSwap, list, selId = null, seasonNo, perkOverride, onSetFormation, contratosOn }: { mgr: Manager; col: FCol; coins: number; xiIds?: Set<string>; xi?: WonCard[]; goals?: Record<string, number>; onSwap?: (id: string) => void; list?: { listed: Set<string>; canList: (c: WonCard) => boolean; onList: (id: string) => void }; selId?: string | null; seasonNo?: number; perkOverride?: ApoioPerk; onSetFormation?: (f: FormationKey) => void; contratosOn?: boolean }) {
  const need = FORMATIONS[mgr.formation]
  const total = mgr.squad.reduce((s, c) => s + (c.paid ?? 0), 0)
  const hasReserves = SECTORS.some(pos => mgr.squad.filter(c => c.pos === pos).length > need[pos])
  const elenco = !!xiIds && !list // aba Elenco: campinho + reservas (troca por seleção)
  // na aba Elenco a explicação fica no banner grande abaixo — aqui não repete.
  const caption = elenco ? '' : list ? '· toque pra pôr no leilão / tirar' : '· moedas pra reforços'
  const listOf = (c: WonCard): ListCfg | undefined => list ? { listed: list.listed.has(c.id), listable: list.canList(c), onList: () => list.onList(c.id) } : undefined
  // o elenco herda a COR do jogador (a mesma sorteada pra ele no jogo todo).
  // Quem tem tier de apoio ganha o degradê DA CARTA da categoria + varredura
  // de brilho (holo), igual à carta — só na aba Elenco, que é o "manto" dele.
  const perk = perkOverride ?? myApoioPerk()
  const shine = elenco && perk && perk.holo > 0
  return (
    <div style={{ ...box(elenco ? col.solid : col.light), ...(shine ? { background: perk.grad, position: 'relative', overflow: 'hidden' } : {}), padding: 12, marginBottom: 12 }}>
      {shine && <ApoioSheen holo={perk.holo} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, margin: 0, color: elenco ? '#fff' : col.solid, textShadow: elenco ? '1px 1px 0 rgba(0,0,0,.35)' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👥 {mgr.teamName}{elenco && perk?.selo ? ` ${perk.selo}` : elenco ? apoioSelo() : ''}</p>
        {/* 22 é o normal, mas com empréstimo DA SAF o elenco passa de 22 por um
            jogador — o selo se estica sozinho pra não parecer erro (23/23). */}
        <span style={{ fontWeight: 900, fontSize: 11.5, ...OSWALD, background: elenco ? '#fff' : col.solid, color: elenco ? INK : '#fff', border: `2px solid ${INK}`, borderRadius: 8, padding: '2px 8px', whiteSpace: 'nowrap' }}>{mgr.squad.length}/{Math.max(22, mgr.squad.length)}{elenco ? '' : ` · 💰 ${total}`}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, background: elenco ? '#fff' : 'rgba(255,255,255,0.6)', border: `2px solid ${elenco ? INK : col.solid}`, borderRadius: 8, padding: '4px 8px', flexWrap: 'wrap' }}>
        <span title="Soma do valor de mercado dos 22 jogadores (não é a sua caixa de moedas)" style={{ fontWeight: 900, fontSize: 12, ...OSWALD, color: INK }}>{elenco ? `🏷️ Elenco vale ${total} 💵` : `🪙 Caixa: ${coins}`}</span>
        {caption && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#5a5647' }}>{caption}</span>}
      </div>
      {elenco && onSetFormation && (() => {
        // 🎽 troca de formação: libera pra QUALQUER formação que você consiga preencher
        // por posição com jogadores REAIS e SEUS (emprestado não conta — é extra que
        // volta na virada; nunca entra perna-de-pau). Sem exigir 22 e sem teto: o
        // excedente vira banco.
        const real = mgr.squad.filter(c => !c.fake)
        const availByPos = (pos: Sector) => real.filter(c => c.pos === pos && !c.emprestado).length
        const missFor = (f: FormationKey) => SECTORS.filter(pos => availByPos(pos) < FORMATIONS[f][pos]).map(pos => `${FORMATIONS[f][pos] - availByPos(pos)} ${POS_SHORT[pos]}${FORMATIONS[f][pos] - availByPos(pos) > 1 ? 's' : ''}`)
        // dica: as formações pra onde AINDA falta gente (pra ele saber o que buscar)
        const blocked = (['4-3-3', '4-4-2', '4-5-1'] as FormationKey[]).filter(f => f !== mgr.formation && missFor(f).length > 0)
        return (
          <div style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 8, padding: '7px 9px', marginBottom: 10 }}>
            <p style={{ fontWeight: 900, fontSize: 11.5, ...OSWALD, margin: '0 0 6px', color: INK }}>🎽 Formação</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['4-3-3', '4-4-2', '4-5-1'] as FormationKey[]).map(f => {
                const cur = mgr.formation === f
                const can = cur || missFor(f).length === 0
                return (
                  <button key={f} disabled={!can} onClick={() => { if (can && !cur) onSetFormation(f) }}
                    style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 9, padding: '8px 4px', fontWeight: 900, fontSize: 12.5, ...OSWALD, cursor: can && !cur ? 'pointer' : 'default', background: cur ? col.solid : '#fff', color: cur ? '#fff' : (can ? INK : '#b8b2a4'), opacity: can ? 1 : 0.7, boxShadow: cur ? `2px 2px 0 0 ${INK}` : 'none' }}>
                    {f}{cur ? ' ✓' : ''}
                  </button>
                )
              })}
            </div>
            {blocked.length
              ? <p style={{ fontSize: 9.5, fontWeight: 700, color: '#b23b2e', margin: '6px 0 0', lineHeight: 1.35 }}>⚠️ Pra jogar <b>{blocked[0]}</b> faltam <b>{missFor(blocked[0]).join(', ')}</b>. Contrate no leilão ou traga da SAF.</p>
              : <p style={{ fontSize: 9.5, fontWeight: 700, color: '#2E7D46', margin: '6px 0 0', lineHeight: 1.35 }}>✅ Você pode trocar de formação quando quiser — vale do próximo jogo.</p>}
          </div>
        )
      })()}
      {elenco ? (
        <ElencoField mgr={mgr} col={col} xiIds={xiIds!} xi={xi} goals={goals} selId={selId} onTap={onSwap} seasonNo={seasonNo} contratosOn={contratosOn} />
      ) : (<>
      {hasReserves && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
          <p style={{ flex: 1, fontWeight: 900, fontSize: 9.5, ...OSWALD, color: col.solid, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Titulares</p>
          <p style={{ flex: 1, fontWeight: 900, fontSize: 9.5, ...OSWALD, color: 'rgba(0,0,0,0.45)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Reservas</p>
        </div>
      )}
      {SECTORS.map(pos => {
        const players = mgr.squad.filter(c => c.pos === pos).sort((a, b) => mid(b) - mid(a))
        const titulars = xiIds ? players.filter(c => xiIds.has(c.id)) : players.slice(0, need[pos])
        const reserves = xiIds ? players.filter(c => !xiIds.has(c.id)) : players.slice(need[pos])
        return (
          <div key={pos} style={{ marginBottom: 8 }}>
            <p style={{ fontWeight: 900, fontSize: 10, ...OSWALD, color: col.solid, opacity: 0.85, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.3 }}>{POS_LABEL[pos]}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>{titulars.map(c => <PlayerRow key={c.id} c={c} titular col={col} onSwap={onSwap ? () => onSwap(c.id) : undefined} list={listOf(c)} />)}</div>
              {reserves.length > 0 && <div style={{ flex: 1, minWidth: 0 }}>{reserves.map(c => <PlayerRow key={c.id} c={c} titular={false} col={col} onSwap={onSwap ? () => onSwap(c.id) : undefined} list={listOf(c)} />)}</div>}
            </div>
          </div>
        )
      })}
      </>)}
    </div>
  )
}

// ── RANKING GERAL: TODOS os times do jogo (amigos + CPUs), ordenados por
// TÍTULOS (Série A → B → C → D) e depois DINHEIRO, com desempate em cascata. ──
type Honors = { A: number; B: number; C: number; D: number; V?: number }
const EMPTY_HONORS: Honors = { A: 0, B: 0, C: 0, D: 0, V: 0 }
function RankingTab({ tables, honors, copaHonors, coins, clubCash, colors, youId, seasonNo, myDiv, safTeam, seed }: { tables: Record<Div, SimTeam[]>; honors: Record<string, Honors>; copaHonors: Record<string, number>; coins: Record<number, number>; clubCash: Record<string, number>; colors: Record<number, FCol>; youId: number; seasonNo?: number; myDiv?: Div | null; safTeam?: string; seed?: number }) {
  // 🌍 títulos da COPA DO MUNDO LEGENDS (mural local por save): entram no rank e
  // no Hall de Troféus. Ordem do ranking (pedido do Diego): Série A → Copa do
  // Mundo → Copa Legends → Série B → Série C → Série D → Dinheiro.
  const cmMural = seed != null ? (loadCopaSave(seed)?.mural ?? []) : []
  const cmTitles: Record<string, number> = {}
  for (const m of cmMural) cmTitles[m.campeao] = (cmTitles[m.campeao] ?? 0) + 1
  const rows = DIVS.flatMap(d => tables[d]).map(t => {
    const key = teamKey(t)
    const olds = oldChain(key) // save antigo pode ter caixa/títulos em QUALQUER nome velho da corrente
    const pick = <V,>(rec: Record<string, V>): V | undefined => rec[key] ?? olds.map(o => rec[o]).find(v => v !== undefined)
    const money = t.human ? (coins[t.teamId] ?? 0) : Math.round(pick(clubCash) ?? 0)
    return { t, key, h: pick(honors) ?? EMPTY_HONORS, copas: pick(copaHonors) ?? 0, money, wc: cmTitles[t.name] ?? 0 }
  })
  // ordem: Série A · Copa do Mundo · Copa Legends · Série B · Série C · Série D · Dinheiro
  rows.sort((a, b) => b.h.A - a.h.A || b.wc - a.wc || b.copas - a.copas || b.h.B - a.h.B || b.h.C - a.h.C || b.h.D - a.h.D || b.money - a.money || a.t.name.localeCompare(b.t.name))
  const top = rows.slice(0, 20)
  // 🏆 SEUS troféus (chave do humano = m<id>) — base do Hall de Troféus embaixo.
  const myH = honors[`m${youId}`] ?? EMPTY_HONORS
  const myCopas = copaHonors[`m${youId}`] ?? 0
  const myWorld = cmMural.filter(m => m.voce).length
  const totalT = myH.A + myH.B + myH.C + myH.D + myCopas + myWorld
  const trofeus = [
    ...(myWorld > 0 ? [{ key: 'mundo', label: 'Copa do Mundo', n: myWorld, bg: INK, c: GOLD }] : []),
    ...(myCopas > 0 ? [{ key: 'copa', label: 'Copa Legends', n: myCopas, bg: GOLD, c: INK }] : []),
    ...(['A', 'B', 'C', 'D', 'V'] as Div[]).filter(d => (myH[d] ?? 0) > 0).map(d => ({ key: d, label: DIV_NAME[d], n: myH[d] ?? 0, bg: CDTAG[d].bg, c: CDTAG[d].c })),
  ]
  return (
    <>
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 2px' }}>🏆 RANKING GERAL</p>
      <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: '0 0 8px' }}>Títulos (Série A › B › C › D) e depois dinheiro — top 20.</p>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Títulos</th><th style={{ ...th, textAlign: 'right' }}>💰</th></tr></thead>
        <tbody>
          {top.map((r, i) => {
            const you = r.t.teamId === youId && r.t.teamId >= 0
            // 🏢 a SUA SAF veste a sua cor no rank também (💼) — ela está no mapa
            // de cores com a sua cor, então basta ler colors[teamId] direto.
            const isSaf = !you && !!safTeam && r.t.name === safTeam
            const colored = r.t.human || r.t.rival || isSaf
            // 🎨 cor SÓ pra você/2º clube/rival (id real no mapa) e pra SUA SAF (por
            // NOME → a sua cor). CPU comum (id -1) NÃO herda cor — senão o baralho
            // inteiro ficava dourado por causa do id -1 compartilhado por todo bot.
            const fc = isSaf ? colors[youId] : ((r.t.human || r.t.rival) ? colors[r.t.teamId] : undefined)
            return (
              <tr key={r.key} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: fc?.light, fontWeight: colored ? 800 : 500 }}>
                <td style={{ paddingRight: 4, color: 'rgba(0,0,0,0.5)' }}>{i + 1}</td>
                <td style={{ maxWidth: 150, color: fc?.solid ?? INK }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <Escudo nome={r.t.name} size={19} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{you ? '👤 ' : isSaf ? '💼 ' : r.t.rival ? '⚔️ ' : r.t.dorm ? '🏛️ ' : r.t.human ? '🔥 ' : ''}{(() => { const pk = you ? myApoioPerk() : null; return pk ? <span style={apoioText(pk)}>{apoioName(r.t.name)}</span> : r.t.name })()}</span>
                  </span>
                </td>
                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {(r.h.A + r.h.B + r.h.C + r.h.D + r.copas + r.wc) === 0 ? <span style={{ opacity: 0.3 }}>—</span> : <>
                    {r.wc > 0 && <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 900, color: GOLD, background: INK, borderRadius: 4, padding: '0 4px', marginLeft: 2 }}>🌍Mundo{r.wc > 1 ? r.wc : ''}</span>}
                    {r.copas > 0 && <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 900, color: INK, background: GOLD, borderRadius: 4, padding: '0 4px', marginLeft: 2 }}>🏆Copa{r.copas > 1 ? r.copas : ''}</span>}
                    {(['A', 'B', 'C', 'D', 'V'] as Div[]).map(d => (r.h[d] ?? 0) > 0 ? (
                      <span key={d} style={{ display: 'inline-block', fontSize: 9, fontWeight: 900, color: '#fff', background: DIV_TAG[d].bg, borderRadius: 4, padding: '0 4px', marginLeft: 2 }}>🏆{DIV_TAG[d].l}{r.h[d]}</span>
                    ) : null)}
                  </>}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, whiteSpace: 'nowrap', color: '#5a5647' }}>{r.money}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    {/* 🏆 HALL DE TROFÉUS: a estante PESSOAL do seu clube (só os SEUS títulos) —
        conquistas ganhas nesta carreira, guardadas pra sempre. */}
    <div style={{ ...box('linear-gradient(160deg,#FFF7E0,#FFEBB0)'), padding: 12, marginBottom: 12 }}>
      <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, margin: '0 0 2px' }}>🏆 Hall de Troféus</p>
      <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.55)', margin: '0 0 10px' }}>A estante do seu clube — o que você conquistou nesta carreira{seasonNo ? ` · temporada ${seasonNo}` : ''}.</p>
      {totalT === 0 ? (
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.5)', textAlign: 'center', padding: '10px 0' }}>Estante vazia por enquanto… 🏆 Ganhe um título e ele fica guardado aqui pra sempre.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {trofeus.map(t => (
            <div key={t.key} style={{ width: 82, border: `2.5px solid ${INK}`, borderRadius: 12, background: t.bg, color: t.c, boxShadow: `3px 3px 0 0 ${INK}`, padding: '10px 6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, lineHeight: 1 }}>🏆</div>
              <div style={{ fontWeight: 900, fontSize: 15, ...OSWALD, marginTop: 2 }}>×{t.n}</div>
              <div style={{ fontWeight: 800, fontSize: 9, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.2, marginTop: 1, opacity: 0.92 }}>{t.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
        <span style={{ fontWeight: 900, fontSize: 11, ...OSWALD, background: INK, color: '#fff', borderRadius: 8, padding: '3px 8px' }}>Total: {totalT} 🏆</span>
        {myH.A > 0 && <span style={{ fontWeight: 900, fontSize: 11, ...OSWALD, background: '#FFC400', color: INK, border: `2px solid ${INK}`, borderRadius: 8, padding: '3px 8px' }}>{'⭐'.repeat(Math.min(myH.A, 5))}{myH.A > 5 ? ` ×${myH.A}` : ''} Série A</span>}
        {myDiv && <span style={{ fontWeight: 900, fontSize: 11, ...OSWALD, background: '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 8, padding: '3px 8px' }}>Hoje na {DIV_NAME[myDiv]}</span>}
      </div>
    </div>
    </>
  )
}

// ── TELA da temporada simulada da carreira online (toma o lugar da temporada
// ao vivo). O host conduz o ritmo (PLAY_ROUND avança a rodada, já sincronizado);
// os clientes seguem a rodada do estado. Tudo determinístico → mesma tabela. ──
// rodapé informativo da aba Tabelas: prêmios da temporada (moedas) por divisão —
// campeão, top-4 (acesso), queda e artilheiro. Valores vindos das constantes reais.
function PrizesBox() {
  const th: React.CSSProperties = { fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)', padding: '3px 4px', ...OSWALD }
  const td: React.CSSProperties = { fontSize: 12.5, fontWeight: 900, textAlign: 'center', padding: '4px 4px', ...OSWALD }
  return (
    <div style={{ ...box('#FFF6DE'), padding: 12, marginTop: 12 }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 6px' }}>🏆 Prêmios da temporada <span style={{ fontWeight: 700, fontSize: 10.5, color: 'rgba(0,0,0,0.55)' }}>(em 🪙 moedas)</span></p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ ...th, textAlign: 'left' }}>Série</th>
            <th style={th}>🏆 Campeão</th>
            <th style={th}>🔼 Top-4</th>
            <th style={th}>🔽 Queda</th>
            <th style={th}>⚽ Artilheiro</th>
          </tr></thead>
          <tbody>
            {DIVS.map(d => (
              <tr key={d} style={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                <td style={{ ...td, textAlign: 'left' }}>{DIV_NAME[d]}</td>
                <td style={{ ...td, color: '#1B7A3D' }}>+{CAMPEAO[d]}</td>
                <td style={{ ...td, color: ZONA[d] > 0 ? '#1B7A3D' : 'rgba(0,0,0,0.35)' }}>{ZONA[d] > 0 ? `+${ZONA[d]}` : '—'}</td>
                <td style={{ ...td, color: d === 'D' ? 'rgba(0,0,0,0.35)' : '#E8503A' }}>{d === 'D' ? '—' : `−${QUEDA[d]}`}</td>
                <td style={{ ...td, color: '#8a6d1f' }}>+{DIV_SCORER_BONUS[d]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,0.7)', lineHeight: 1.5 }}>
        <li><b>Top-4</b>: nas séries de baixo é <b>acesso</b> (sobe de divisão); na A é "manter entre os 4". Campeão da A leva os dois: <b>65 + 30 = 95</b>. <b>Sair da Série D é de graça</b> (sem bônus de acesso).</li>
        <li><b>Queda</b>: perde moedas ao cair (mesmo valor do acesso). <b>Da Série D ninguém cai</b> (é a última).</li>
        <li><b>⚽ Artilheiro</b> de cada divisão (e da Copa): o valor vai pro <b>caixa do clube</b>; e o <b>piso (valor)</b> do jogador sobe <b>+10 fixo</b> pro próximo leilão.</li>
      </ul>
    </div>
  )
}

// chaveamento da Copa na aba Tabelas (fim de temporada). Toggle pra ver a
// classificação final das divisões. Confronto seu em destaque, tag de divisão
// em cada time e aviso de zebra quando um time de baixo elimina um de cima.
const CDTAG: Record<Div, { bg: string; c: string }> = { A: { bg: '#FFC400', c: '#0C0C0C' }, B: { bg: '#C3CCD8', c: '#0C0C0C' }, C: { bg: '#CD7F4A', c: '#fff' }, D: { bg: '#EDE6D0', c: '#0C0C0C' }, V: { bg: '#8B5E3C', c: '#fff' } }
const DIV_RANKN: Record<Div, number> = { A: 4, B: 3, C: 2, D: 1, V: 0 }
const copaName = (t: SimTeam) => t.you ? `${t.name} (você)` : t.name
// ── DISPUTA DE PÊNALTIS animada: as cobranças aparecem uma a uma, alternando
// os times (verde = gol, vermelho = perdeu), e o total fecha no fim. A ordem
// das cobranças é sorteada de forma determinística a partir do próprio placar.
// tempo (s) até a disputa de pênaltis terminar de animar — usado pra SEGURAR a
// revelação do vencedor (riscado/zebra) até a última cobrança pipocar na tela.
export function pensRevealDelay(pens: [number, number]): number {
  if (Math.max(pens[0], pens[1]) > 5) return 0.7 + 12 * 0.85 + 0.6
  // pior caso do para-quando-decide: até 10 cobranças
  const kicks = Math.min(10, pens[0] + pens[1] + (5 - Math.min(pens[0], pens[1])) * 2 + 2)
  return 0.7 + kicks * 0.85 + 0.6
}
export function PensShootout({ pens, aName, bName }: { pens: [number, number]; aName: string; bName: string }) {
  // REGRA REAL: 5 cobranças alternadas; PARA na hora que decide (quem não
  // alcança mais nem batendo todas, acabou — as bolinhas restantes ficam
  // vazias). 6×5 = foi perfeito até o fim e decidiu na morte súbita.
  type Kick = { side: 0 | 1; ok: boolean }
  let salt = 0; for (const ch of aName + '|' + bName) salt = (salt * 31 + ch.charCodeAt(0)) >>> 0
  const rng = mulberry(((pens[0] * 31 + pens[1] * 7) ^ salt ^ 0xA1B2) >>> 0)
  const win = pens[0] > pens[1] ? 0 : 1
  const seq: Kick[] = []
  const taken: [number, number] = [0, 0]
  const score: [number, number] = [0, 0]
  if (Math.max(pens[0], pens[1]) > 5) {
    // morte súbita (só existe como 6×5): 5 rodadas perfeitas + a 6ª que decide
    for (let r = 0; r < 5; r++) { seq.push({ side: 0, ok: true }, { side: 1, ok: true }) }
    seq.push({ side: win as 0 | 1, ok: true }, { side: (1 - win) as 0 | 1, ok: false })
    score[0] = pens[0]; score[1] = pens[1]; taken[0] = 6; taken[1] = 6
  } else {
    // espalha os gols de cada time nas 5 cobranças (ordem sorteada, mas SEMPRE
    // a mesma pra este placar) e anda cobrança a cobrança até decidir.
    const mk = (made: number) => {
      const idxs = [0, 1, 2, 3, 4]
      for (let i = 4; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idxs[i], idxs[j]] = [idxs[j], idxs[i]] }
      const arr = [false, false, false, false, false]
      idxs.slice(0, made).forEach(i => { arr[i] = true })
      return arr
    }
    const plan: [boolean[], boolean[]] = [mk(pens[0]), mk(pens[1])]
    outer: for (let r = 0; r < 5; r++) {
      for (const side of [0, 1] as const) {
        const ok = plan[side][r]
        seq.push({ side, ok }); taken[side]++; if (ok) score[side]++
        const rest = (t: 0 | 1) => 5 - taken[t]
        if (score[0] + rest(0) < score[1] || score[1] + rest(1) < score[0]) break outer
      }
    }
  }
  const nSlots = Math.max(pens[0], pens[1]) > 5 ? 6 : 5
  const step = 0.85, lead = 0.7
  // resultado de cada time na ORDEM das cobranças dele + índice global (delay)
  const rows: { ok: boolean; at: number }[][] = [[], []]
  seq.forEach((k, gi) => rows[k.side].push({ ok: k.ok, at: gi }))
  const totalDelay = lead + seq.length * step + 0.25
  const row = (name: string, r: { ok: boolean; at: number }[]) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3.5, justifyContent: 'center' }}>
      <span style={{ fontSize: 9, fontWeight: 900, ...OSWALD, maxWidth: 74, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }}>{name}</span>
      {Array.from({ length: nSlots }, (_, i) => {
        const k = r[i]
        // 🎯 cobrança NÃO batida (a disputa já tinha decidido): NÃO desenha bolinha
        // nenhuma — antes ficava um círculo tracejado/transparente que parecia bug e
        // dava a entender que faltou cobrar. Mostra só as cobranças que aconteceram.
        if (!k) return null
        return <span key={i} style={{ width: 13, height: 13, borderRadius: 999, border: `1.5px solid ${INK}`, background: k.ok ? '#37D067' : '#F87168', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 900, lineHeight: 1, opacity: 0, animation: `pensPop .45s cubic-bezier(.2,1.5,.5,1) ${(lead + k.at * step).toFixed(2)}s forwards`, flexShrink: 0 }}>{k.ok ? '' : '✕'}</span>
      })}
    </div>
  )
  return (
    <div style={{ margin: '4px 0 0' }}>
      <style>{'@keyframes pensPop{0%{opacity:0;transform:scale(0)}70%{opacity:1;transform:scale(1.35)}100%{opacity:1;transform:scale(1)}}'}</style>
      <p style={{ fontSize: 9, fontWeight: 900, ...OSWALD, textAlign: 'center', color: '#B23B2E', margin: '0 0 3px', letterSpacing: 0.5 }}>🎯 DISPUTA DE PÊNALTIS{nSlots === 6 ? ' · MORTE SÚBITA' : ''}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {row(aName, rows[0])}
        {row(bName, rows[1])}
      </div>
      <p style={{ fontSize: 9.5, fontWeight: 900, ...OSWALD, textAlign: 'center', color: INK, margin: '3px 0 0', opacity: 0, animation: `pensPop .35s ease ${totalDelay.toFixed(2)}s forwards` }}>{score[0]} × {score[1]} {win === 0 ? 'pro ' + aName : 'pro ' + bName}</p>
    </div>
  )
}

// linha de um confronto JÁ DECIDIDO (agregado, pênaltis, zebra) — reusada no
// chaveamento e na lista "outros jogos da fase" ao vivo.
function CopaTieRow({ tie, colors = {}, safName }: { tie: CopaTie; colors?: Record<number, FCol>; safName?: string }) {
  const you = tie.a.you || tie.b.you, aWin = tie.win === 'a'
  // 🚫 ANTI-SPOILER DOS PÊNALTIS: o perdedor riscado + zebra só aparecem DEPOIS
  // que a última cobrança pipoca na tela (antes, o card entregava quem passou
  // desde o primeiro segundo da disputa).
  const pensDelay = tie.pens ? pensRevealDelay(tie.pens) : 0
  const winDiv = aWin ? tie.aDiv : tie.bDiv, loseDiv = aWin ? tie.bDiv : tie.aDiv
  const zebra = DIV_RANKN[winDiv] < DIV_RANKN[loseDiv]
  const fA = copaSideFill(tie.a, colors, safName), fB = copaSideFill(tie.b, colors, safName)
  const side = (t: SimTeam, win: boolean, away: boolean, f: CopaFill) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, justifyContent: away ? 'flex-end' : 'flex-start' }}>
      {!away && <span style={{ fontSize: 10 }}>{f.mark}</span>}
      <span style={{ fontWeight: 800, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: f.ink, ...(win ? {} : pensDelay > 0 ? { animation: `copaLoserFade .4s ease ${pensDelay.toFixed(2)}s forwards` } : { opacity: 0.62, textDecoration: 'line-through' }) }}>{copaName(t)}</span>
      {away && <span style={{ fontSize: 10 }}>{f.mark}</span>}
    </span>
  )
  return (
    <div style={{ ...box('transparent'), position: 'relative', overflow: 'hidden', border: `2.5px solid ${you ? '#B23B2E' : INK}`, boxShadow: `3px 3px 0 0 ${INK}`, padding: '7px 9px', marginBottom: 7 }}>
      <CopaHalves fL={fA} fR={fB} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6 }}>
          {side(tie.a, aWin, false, fA)}
          <span style={{ fontWeight: 900, fontSize: 13, ...OSWALD, background: INK, color: '#fff', borderRadius: 7, padding: '2px 8px', whiteSpace: 'nowrap' }}>{tie.aggA} × {tie.aggB}</span>
          {side(tie.b, !aWin, true, fB)}
        </div>
        <p style={{ fontSize: 9, fontWeight: 800, textAlign: 'center', margin: '4px 0 0' }}><span style={copaCenterChip}>{tie.legs.length === 2 ? `ida ${tie.legs[0][0]}×${tie.legs[0][1]} · volta ${tie.legs[1][0]}×${tie.legs[1][1]}` : 'jogo único'}</span></p>
        {tie.pens && <style>{'@keyframes copaLoserFade{to{opacity:.62;text-decoration:line-through}}'}</style>}
        {tie.pens && <PensShootout pens={tie.pens} aName={tie.a.name} bName={tie.b.name} />}
        {zebra && <p style={{ fontSize: 9.5, fontWeight: 800, textAlign: 'center', margin: '3px 0 0', ...(pensDelay > 0 ? { opacity: 0, animation: `pensPop .35s ease ${pensDelay.toFixed(2)}s forwards` } : {}) }}><span style={{ ...copaCenterChip, color: '#ffb4a6' }}>💥 zebra — Série {winDiv} eliminou Série {loseDiv}</span></p>}
      </div>
    </div>
  )
}

// Um jogo da fase TOCANDO AO VIVO na posição `pos` do relógio da fase
// (0..nLegs*90). Mostra o placar do jogo ATUAL subindo minuto a minuto; no fim,
// o agregado, ida/volta e quem avançou. `big` = é o SEU jogo (destaque).
function CopaLiveMatch({ tie, pos, big, colors = {}, safName }: { tie: CopaTie; pos: number; big?: boolean; colors?: Record<number, FCol>; safName?: string }) {
  const legG = tie.legGoals.length ? tie.legGoals : [tie.goals]
  const nLegs = legG.length
  const total = nLegs * 90
  const done = pos >= total
  const legIdx = Math.min(nLegs - 1, Math.floor(pos / 90))
  const legMin = Math.min(90, Math.round(pos - legIdx * 90))
  const g = legG[legIdx] ?? []
  const curA = g.filter(x => x.home && x.min <= legMin).length
  const curB = g.filter(x => !x.home && x.min <= legMin).length
  const showA = done ? tie.aggA : curA
  const showB = done ? tie.aggB : curB
  const you = tie.a.you || tie.b.you
  const aWin = tie.win === 'a'
  const lastG = [...g].filter(x => x.min <= legMin).sort((x, y) => x.min - y.min).pop()
  const phaseLbl = nLegs === 1 ? '' : legIdx === 0 ? 'IDA' : 'VOLTA'
  const winName = aWin ? copaName(tie.a) : copaName(tie.b)
  // 🚫 ANTI-SPOILER DOS PÊNALTIS: com decisão nos pênaltis, o riscado do perdedor E
  // o "✅ avança" só entram DEPOIS que a última cobrança pipoca (senão o card
  // entregava quem passou já no 1º chute). Mesmo atraso que a Copa dos 8 já usa.
  const pensDelay = done && tie.pens ? pensRevealDelay(tie.pens) : 0
  // no jogo de VOLTA (ao vivo), o mandante é o B — e mandante joga na ESQUERDA,
  // igual na vida real. Então inverte os lados (e o placar) só nesse leg.
  const swap = !done && legIdx === 1
  const teamL = swap ? tie.b : tie.a, teamR = swap ? tie.a : tie.b
  const L = { name: copaName(teamL), win: swap ? !aWin : aWin, score: swap ? showB : showA, f: copaSideFill(teamL, colors, safName) }
  const R = { name: copaName(teamR), win: swap ? aWin : !aWin, score: swap ? showA : showB, f: copaSideFill(teamR, colors, safName) }
  const nameStyle = (s: typeof L): React.CSSProperties => {
    const base: React.CSSProperties = { fontWeight: big ? 900 : 800, fontSize: big ? 13.5 : 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: s.f.ink }
    if (!done || s.win) return { ...base, opacity: 1, textDecoration: 'none' }
    if (pensDelay > 0) return { ...base, animation: `copaLoserFade .4s ease ${pensDelay.toFixed(2)}s forwards` } // perdedor por pênaltis: espera a disputa
    return { ...base, opacity: 0.6, textDecoration: 'line-through' }
  }
  return (
    <div style={{ ...box('transparent'), position: 'relative', overflow: 'hidden', border: `${big ? 3 : 2}px solid ${you ? '#B23B2E' : INK}`, boxShadow: `${big ? 4 : 2}px ${big ? 4 : 2}px 0 0 ${INK}`, padding: big ? '9px 12px' : '6px 9px', marginBottom: big ? 9 : 6 }}>
      <CopaHalves fL={L.f} fR={R.f} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {!done && <p style={{ textAlign: 'center', margin: '0 0 4px' }}><span style={{ ...copaCenterChip, fontSize: big ? 10 : 9, fontWeight: 900, color: '#ff9a8f', ...OSWALD }}>🔴 {phaseLbl ? phaseLbl + ' · ' : ''}{legMin}'</span></p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}><span style={{ fontSize: 10 }}>{L.f.mark}</span><span style={nameStyle(L)}>{L.name}</span></span>
          <span style={{ fontWeight: 900, fontSize: big ? 18 : 13, ...OSWALD, background: INK, color: '#fff', borderRadius: 7, padding: big ? '3px 11px' : '2px 8px', whiteSpace: 'nowrap' }}>{L.score} × {R.score}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, justifyContent: 'flex-end' }}><span style={nameStyle(R)}>{R.name}</span><span style={{ fontSize: 10 }}>{R.f.mark}</span></span>
        </div>
        {!done
          ? (lastG ? <p style={{ textAlign: 'center', margin: '4px 0 0' }}><span style={{ ...copaCenterChip, fontSize: big ? 10 : 9, fontWeight: 800, ...OSWALD }}>⚽ {lastG.name}</span></p> : null)
          : <>
              {nLegs === 2 && <p style={{ textAlign: 'center', margin: '4px 0 0' }}><span style={{ ...copaCenterChip, fontSize: 9, fontWeight: 800 }}>ida {tie.legs[0][0]}×{tie.legs[0][1]} · volta {tie.legs[1][1]}×{tie.legs[1][0]}</span></p>}
              {tie.pens && <style>{'@keyframes copaLoserFade{to{opacity:.6;text-decoration:line-through}}'}</style>}
              {tie.pens && <PensShootout pens={tie.pens} aName={tie.a.name} bName={tie.b.name} />}
              <p style={{ textAlign: 'center', margin: '3px 0 0', ...(pensDelay > 0 ? { opacity: 0, animation: `pensPop .35s ease ${pensDelay.toFixed(2)}s forwards` } : {}) }}><span style={{ ...copaCenterChip, fontSize: 9.5, fontWeight: 900, color: '#8ff0a8', ...OSWALD }}>✅ {winName} avança</span></p>
            </>}
      </div>
    </div>
  )
}

// painel "Campeões da temporada": campeão + artilheiro (com o time do artilheiro)
// da Copa e de cada série A/B/C/D. Reutilizado na aba Tabelas e na tela de fim.
function ChampionsPanel({ copa, tables, scorers, seasonNo }: { copa: CopaResult; tables: Record<Div, SimTeam[]>; scorers?: SeasonScorer[]; seasonNo?: number }) {
  const champ = copa.champion
  const divs: Div[] = (tables.V?.length ?? 0) > 0 ? ['A', 'B', 'C', 'D', 'V'] : ['A', 'B', 'C', 'D']
  const topOf = (d: Div) => (scorers ?? []).filter(s => s.div === d).sort((a, b) => b.goals - a.goals)[0]
  const line = (icon: string, title: string, champName: string | undefined, champYou: boolean, top: { name: string; teamName: string; goals: number } | undefined) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'start', padding: '6px 0', borderTop: `1px solid ${INK}14` }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 9, fontWeight: 800, ...OSWALD, color: 'rgba(0,0,0,.45)', textTransform: 'uppercase' }}>{icon} {title}</span>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 900, ...OSWALD, color: champYou ? GREEN : INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏆 {champName ?? '—'}</span>
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 9, fontWeight: 800, ...OSWALD, color: 'rgba(0,0,0,.45)', textTransform: 'uppercase' }}>⚽ Artilheiro</span>
        {top
          ? <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#4a4740', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><b>{top.name}</b> ({top.goals}) · <span style={{ color: 'rgba(0,0,0,.5)' }}>{top.teamName}</span></span>
          : <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,.4)' }}>—</span>}
      </span>
    </div>
  )
  return (
    <div style={{ ...box('linear-gradient(150deg,#FFF3CF,#FFE79A)'), padding: '10px 12px 12px', marginBottom: 12 }}>
      <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 0 4px', textAlign: 'center' }}>🥇 Campeões da temporada{seasonNo ? ` ${seasonNo}` : ''}</p>
      {champ && line('🏆', 'Copa Legends', copaName(champ), !!champ.you, copa.topScorer ?? undefined)}
      {divs.map(d => line('🥇', DIV_NAME[d], tables[d]?.[0]?.name, !!tables[d]?.[0]?.you, topOf(d)))}
    </div>
  )
}
function CopaBracket({ copa, colors, youId, tables, ord, myDiv, reveal, scorers, seasonNo, safTeam, safCol }: { copa: CopaResult; colors: Record<number, FCol>; youId: number; tables: Record<Div, SimTeam[]>; ord: Div[]; myDiv: Div | null; reveal: number; scorers?: SeasonScorer[]; seasonNo?: number; safTeam?: string; safCol?: FCol }) {
  const champ = copa.champion
  const finished = reveal >= copa.rounds.length
  const shown = copa.rounds.slice(0, reveal) // fases já decididas
  const rounds = [...shown].reverse() // Final primeiro
  // A Copa aparece EM CIMA; logo abaixo, a classificação das divisões (a sua
  // em destaque). Sem toggle — as duas ficam empilhadas na mesma aba.
  return (
    <div>
      <div style={{ ...box('linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)'), padding: '11px 12px', marginBottom: 10, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD, margin: 0 }}>🏆 COPA LEGENDS</p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.62)', margin: '2px 0 0' }}>Mata-mata dos 16 · top-4 de cada divisão · sorteio aleatório</p>
      </div>
      {finished && champ && (
        <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 30, lineHeight: 1, margin: 0 }}>🏆</p>
          <p style={{ fontWeight: 900, fontSize: 16, ...OSWALD, margin: '2px 0 0', color: champ.you ? (colors[youId]?.solid ?? INK) : INK }}>{copaName(champ)}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, marginTop: 1 }}>CAMPEÃO DA COPA{copa.championDiv && copa.championDiv !== 'A' ? ` — e da Série ${copa.championDiv}! 🐣🔥` : '!'} <span style={{ color: '#8a6d1f' }}>+25 🪙</span></p>
          {copa.vice && <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', marginTop: 2 }}>🥈 Vice: {copaName(copa.vice)} <span style={{ color: '#8a6d1f' }}>+15 🪙</span></p>}
        </div>
      )}
      {/* CAMPEÕES DA TEMPORADA: campeão + artilheiro (com o time do artilheiro). */}
      {finished && <ChampionsPanel copa={copa} tables={tables} scorers={scorers} seasonNo={seasonNo} />}
      {shown.length === 0 && <p style={{ fontSize: 11.5, fontWeight: 700, color: '#5a5647', textAlign: 'center' }}>A Copa está começando… 🔴</p>}
      {rounds.map(r => (
        <div key={r.name} style={{ marginBottom: 10 }}>
          <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(0,0,0,.5)', margin: '0 0 5px' }}>{r.name === 'Final' ? '🏁 Final' : r.name}</p>
          {r.ties.map((t, i) => <CopaTieRow key={i} tie={t} colors={colors} safName={safTeam} />)}
        </div>
      ))}
      {/* CLASSIFICAÇÃO das divisões logo abaixo da Copa — a sua em destaque */}
      <div style={{ borderTop: `2px dashed ${INK}22`, margin: '14px 0 10px' }} />
      <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(0,0,0,.5)', margin: '0 0 8px' }}>📊 Classificação das divisões{myDiv ? ' · a sua primeiro' : ''}</p>
      <PyramidTables tables={tables} order={myDiv ? [myDiv, ...ord.filter(d => d !== myDiv)] : ord} colors={colors} myDiv={myDiv} final safTeam={safTeam} safCol={safCol} />
      <PrizesBox />
    </div>
  )
}

// ─── 🎭 EVENTO DE JOGADOR: banner de decisão (visual aprovado no mockup) ────
// Trava o avanço da rodada até o técnico decidir. Noitada (roxo) tem escolha:
// banco 1 jogo OU "escalar assim mesmo" (queda pequena só naquele jogo).
// Expulsão/lesão (vermelho) obrigam a troca — só escolhe QUEM assume a vaga.
function EventoBanner({ ev, reservas, onDecide }: {
  ev: EventoAtivo
  reservas: WonCard[]
  onDecide: (escolha: 'troca' | 'campo', subId?: string) => void
}) {
  const [subId, setSubId] = useState(reservas[0]?.id ?? '')
  const noit = ev.tipo === 'noitada'
  const headGrad = noit ? 'linear-gradient(150deg,#7C3AED,#4C1D95)' : 'linear-gradient(150deg,#C2452F,#7a2418)'
  const trait = traitDe(ev.nome)
  return (
    <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, overflow: 'hidden', boxShadow: `4px 4px 0 0 ${INK}`, marginBottom: 12 }}>
      <div style={{ padding: '9px 13px', fontWeight: 900, fontSize: 13, color: '#fff', borderBottom: `3px solid ${INK}`, background: headGrad, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.5 }}>{eventoTituloBanner(ev.tipo, ev.rodadas)}</div>
      <div style={{ padding: '12px 13px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#3a3527', lineHeight: 1.5, margin: 0 }}>{ev.historia}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, border: `2.5px solid ${INK}`, borderRadius: 12, background: 'linear-gradient(160deg,#FFE79A,#FFC400 55%,#E8A200)', padding: '8px 10px', margin: '10px 0', boxShadow: '2px 2px 0 #000' }}>
          <span style={{ fontSize: 30 }}>{eventoEmoji(ev.tipo)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 16, ...OSWALD }}>{ev.nome}</div>
            <div style={{ fontWeight: 800, fontSize: 9, color: 'rgba(0,0,0,.55)', ...OSWALD, textTransform: 'uppercase' }}>{ev.pos}{trait ? ` · ${trait}` : ''}</div>
          </div>
        </div>
        {/* quem assume a vaga (mesma posição = formação NUNCA quebra) */}
        <div style={{ border: `2.5px solid ${INK}`, borderRadius: 11, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ background: INK, color: GOLD, fontFamily: OSWALD.fontFamily, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, padding: '5px 10px' }}>quem assume a vaga de {ev.pos}?</div>
          {reservas.map(c => (
            <button key={c.id} onClick={() => setSubId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderTop: `1.5px solid rgba(0,0,0,.12)`, borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: subId === c.id ? '#EAF6EE' : '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
              ⚽ {c.name}
              {subId === c.id && <span style={{ marginLeft: 'auto', fontFamily: OSWALD.fontFamily, fontWeight: 900, fontSize: 9.5, background: GREEN, color: '#fff', borderRadius: 6, padding: '2px 8px' }}>ENTRAR ✓</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => subId && onDecide('troca', subId)} disabled={!subId}
            style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '9px 6px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', textAlign: 'center', boxShadow: `2px 2px 0 ${INK}`, lineHeight: 1.25, background: '#EAF6EE', cursor: 'pointer', ...OSWALD }}>
            {noit ? `😤 Banco por 1 jogo` : '✅ Confirmar a troca'}
            <small style={{ display: 'block', fontFamily: 'Arial, sans-serif', fontSize: 9.5, fontWeight: 700, textTransform: 'none', marginTop: 2, color: 'rgba(0,0,0,.6)' }}>{noit ? 'volta descansado na próxima' : `volta em ${ev.rodadas} ${ev.rodadas === 1 ? 'rodada' : 'rodadas'}`}</small>
          </button>
          {noit && (
            <button onClick={() => onDecide('campo')}
              style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '9px 6px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', textAlign: 'center', boxShadow: `2px 2px 0 ${INK}`, lineHeight: 1.25, background: GOLD, cursor: 'pointer', ...OSWALD }}>
              🙏 Escalar assim mesmo
              <small style={{ display: 'block', fontFamily: 'Arial, sans-serif', fontSize: 9.5, fontWeight: 700, textTransform: 'none', marginTop: 2, color: 'rgba(0,0,0,.6)' }}>joga hoje, mas pode render menos</small>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// caixa do header com animação: quando o valor muda, sobe/desce um "+N" verde
// (ganhou: título, prêmio, artilharia, venda) ou "-N" vermelho (gastou no leilão).
// Como o header tem overflow:hidden, o número flutua PRA BAIXO (não corta em cima).
let coinKfInjected = false
function ensureCoinKeyframes() {
  if (coinKfInjected || typeof document === 'undefined') return
  coinKfInjected = true
  const s = document.createElement('style')
  s.textContent = '@keyframes coinPop{0%{opacity:0;transform:translate(-50%,-4px) scale(.7)}18%{opacity:1;transform:translate(-50%,3px) scale(1.15)}100%{opacity:0;transform:translate(-50%,20px) scale(1)}}@keyframes coinBump{0%,100%{transform:scale(1)}30%{transform:scale(1.18)}}'
  document.head.appendChild(s)
}
function CoinsBadge({ coins }: { coins: number }) {
  const prev = useRef(coins)
  const [pops, setPops] = useState<{ id: number; delta: number }[]>([])
  const [bump, setBump] = useState(0)
  useEffect(() => {
    const d = coins - prev.current
    prev.current = coins
    if (d !== 0 && Number.isFinite(d)) {
      ensureCoinKeyframes()
      const id = Date.now() + Math.random()
      setPops(p => [...p.slice(-3), { id, delta: d }]); setBump(b => b + 1)
      const t = setTimeout(() => setPops(p => p.filter(x => x.id !== id)), 1200)
      return () => clearTimeout(t)
    }
  }, [coins])
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <span key={bump} title="Sua caixa de moedas (pra o leilão/mercado)" style={{ fontWeight: 900, fontSize: 13, ...OSWALD, background: GOLD, color: INK, border: `2px solid ${INK}`, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap', animation: bump ? 'coinBump .45s ease-out' : undefined }}>💰 {coins}</span>
      {pops.map(p => (
        <span key={p.id} style={{ position: 'absolute', left: '50%', top: '100%', fontWeight: 900, fontSize: 13.5, ...OSWALD, color: p.delta > 0 ? '#2ECC71' : '#FF5A4D', whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,.55)', animation: 'coinPop 1.2s ease-out forwards' }}>
          {p.delta > 0 ? `+${p.delta}` : p.delta} 🪙
        </span>
      ))}
    </span>
  )
}
export function PyramidSeasonScreen() {
  const { state, dispatch } = useEsc()
  // 🟢 liga o "contexto verde" da carreira OFFLINE (feehcamp etc. veem verde SÓ aqui;
  // ouro em todo o resto). Inline (roda antes dos filhos, sem flash) + limpa ao sair.
  setCareerColorCtx(state.careerOnline && state.onlineMode !== 'online' ? 'offline' : null)
  useEffect(() => () => setCareerColorCtx(null), [])
  const round = state.round
  const speedFactor = state.simSpeed && state.simSpeed > 0 ? state.simSpeed : 1
  // 🏁 ÚLTIMA RODADA: `seasonOver` = a 38ª foi jogada; mas o fim (campeão/tabela final)
  // só entra DEPOIS que a partida animou na tela. Sem isto, ao chegar na 38ª o card do
  // jogo sumia na hora e pulava pro resultado — a última rodada não aparecia rolando.
  const seasonOver = round >= 38
  // init = já estava encerrada ao ABRIR a tela (save retomado): mostra o fim direto,
  // sem re-animar. Só anima quando a 38ª é jogada COM a tela aberta (endShown vira
  // false→true depois do tempo do jogo).
  const [endShown, setEndShown] = useState(() => round >= 38)
  useEffect(() => {
    if (!seasonOver) { setEndShown(false); return }
    const t = setTimeout(() => setEndShown(true), Math.round((ROUND_MS / speedFactor) * 0.95))
    return () => clearTimeout(t)
  }, [seasonOver, speedFactor])
  const done = seasonOver && endShown
  const [tab, setTab] = useState<'jogos' | 'tabelas' | 'elenco' | 'ranking' | 'estadio'>('jogos')
  const [rankSub, setRankSub] = useState<'clubes' | 'arti'>('arti')
  const [clubeSub, setClubeSub] = useState<'estadio' | 'financas' | 'escritorio'>('estadio') // 🏟️/💰/💼 sub-abas da aba Clube
  const [elencoSub, setElencoSub] = useState<'elenco' | 'agencia'>('elenco') // 👥/🕴️ sub-abas do Elenco (Agenciados só na Agência 2.0 — carreira nova)
  const agLib = useAgenciaLiberada() // 🔒 Agência 2.0 por enquanto SÓ a conta do Diego — pros outros o jogo fica 100% igual
  const agenciaOk = !!state.agenciaOn && agLib // 🏗️ Clube vira "Estrutura" (estádio→patrocínio→agência) SÓ na Agência 2.0
  // 🏛️ MULTICLUBES (Opção B): seletor livre. `multiAsk` = modal de confirmar a troca;
  // `multiPending` = você apertou no meio de uma rodada (auto) → troca no fim dela.
  const [multiAsk, setMultiAsk] = useState(false)
  const [multiPending, setMultiPending] = useState(false)
  const world = useMemo(() => buildPyramid(state.managers, state.managers[state.youIdx]?.id ?? 0, state.seed, state.deckLeague, state.careerPlacements, state.cpuSquads), [state.seed, state.managers.length, state.deckLeague, state.careerPlacements, state.seasonNo, state.cpuSquads])
  const careerTactics = (state.careerTactics ?? {}) as RoundTactics
  const careerLineup = (state.careerLineup ?? {}) as RoundLineups
  // teto de qualidade + gol realista por versão da fórmula (simV): v3 (>=3) = gol
  // realista/menos goleada; v2 = 1.28; save antigo = 1.2. Temporada em andamento
  // termina na versão em que começou (não muda no meio).
  const realGoals = (state.simV ?? 1) >= 3
  const capElite = realGoals ? 1.12 : (state.simV ?? 1) >= 2 ? 1.28 : 1.2
  // ⚖️ escada justa (bônus dos bots reduzido) só a partir do simV 4 — temporada
  // em andamento (simV<4) termina na escada antiga; a próxima já entra na nova.
  const fairBoost = (state.simV ?? 1) >= 4
  // 🎲 seed da simulação MUDA a cada temporada (mistura seed + seasonNo). Sem isto,
  // no online "mesmo time" a seed ficava fixa e TODA temporada refazia os MESMOS
  // sorteios — a mesma goleada, o mesmo placar, temporada após temporada. É
  // determinístico (seed e seasonNo são sincronizados), então todos os clientes
  // online chegam no mesmo resultado. Cada temporada roda como se fosse uma nova.
  const seasonSeed = (state.seed ^ ((state.seasonNo ?? 1) * 2654435761)) >>> 0
  // 🎭 EVENTOS: "escalar assim mesmo" (noitada) = -2 de força SÓ na rodada do causo.
  // Vai pra simulação como mod POR RODADA (nunca mexe na carta — o passado não muda).
  const eventoMods = useMemo<RoundMods>(() => {
    const ev = state.eventoTemporada
    if (!state.agenciaOn || !ev || ev.season !== state.seasonNo || ev.status !== 'campo') return {}
    return { [ev.mgrId]: { [ev.round]: -2 } }
  }, [state.eventoTemporada, state.seasonNo, state.agenciaOn])
  const live = useMemo(() => simulatePyramid(world, seasonSeed, round, careerTactics, careerLineup, capElite, realGoals, fairBoost, eventoMods), [world, seasonSeed, round, careerTactics, careerLineup, capElite, realGoals, fairBoost, eventoMods])
  const matches = live.matches // os jogos da RODADA ATUAL — são eles que animam na tela
  // a TABELA de classificação (pontos) fica no estado de ANTES da partida que
  // está animando na sua tela — os pontos só entram quando o relógio dela acaba.
  // `revealed` = rodada cuja pontuação já pode aparecer (a atual só depois da anim).
  const [revealed, setRevealed] = useState(round)
  useEffect(() => {
    if (done || round <= 0) { setRevealed(round); return }
    setRevealed(round - 1) // segura a rodada atual enquanto a partida anima
    // 🙈 ANTI-SPOILER: o segurador tem que acompanhar a VELOCIDADE (🐢/⚡), igual ao
    // card do jogo (dur = roundMs*0.82) e ao fim de temporada (endShown). Antes usava
    // ROUND_MS FIXO: na marcha lenta o jogo animava 15-30s mas a tabela/artilharia
    // soltavam aos ~7,7s — entregava a rodada com a partida ainda rolando.
    const t = setTimeout(() => setRevealed(round), Math.round((ROUND_MS / speedFactor) * 0.86))
    return () => clearTimeout(t)
  }, [round, done, speedFactor])
  // 🙈 ANTI-SPOILER: a artilharia, os gols por jogador (ex.: "Romário 3") e os
  // líderes de artilharia saem da rodada JÁ REVELADA — não da atual. Sem isto,
  // os gols da partida apareciam ANTES dela animar (a tabela já segurava, mas a
  // artilharia entregava). Quando a rodada termina de animar (revealed = round),
  // tudo passa a vir da simulação completa (live), sem recomputar à toa.
  const shown = useMemo(() => revealed >= round ? live : simulatePyramid(world, seasonSeed, revealed, careerTactics, careerLineup, capElite, realGoals, fairBoost, eventoMods), [live, revealed, round, world, seasonSeed, careerTactics, careerLineup, capElite, realGoals, fairBoost, eventoMods])
  const { scorers, scorersAll, goalsByCard, divTop } = shown
  const tables = shown.tables
  const me = myStanding(tables)
  const hasMatches = round >= 1 && matches.D.length > 0
  const youId = state.managers[state.youIdx]?.id ?? 0
  // 🎽 destrava PERMANENTE da troca de formação na 1ª vez que o elenco chega a 22
  // reais (fica destravado mesmo se depois cair de 22). Só marca o selo — a trava
  // por-posição segue valendo em cada troca.
  const meMgr = state.managers[state.youIdx]
  // conta o que é DELE: elenco real + os dele emprestados na SAF (ownedRealCount)
  const realCount = meMgr ? ownedRealCount(state, meMgr) : 0
  useEffect(() => {
    if (state.careerOnline && meMgr && !meMgr.formUnlocked && realCount >= 22) dispatch({ type: 'FORMATION_UNLOCK', mgrId: youId })
  }, [state.careerOnline, meMgr?.formUnlocked, realCount, youId, dispatch])
  // 🏢 SAF do técnico: online = careerFilials[youId] (por-técnico) · offline = careerFilial (single)
  const myFilial = state.onlineMode === 'online' ? state.careerFilials?.[youId] : state.careerFilial
  const myTactic = tacAt(careerTactics, youId, round) // tática que vale do PRÓXIMO jogo em diante
  // coloridos = humanos (você/amigos) em bege/tier; rivais escolhidos em MARROM
  // próprio — nunca a sua cor. A SUA cor é EXCLUSIVA dos clubes ATUAIS: no ONLINE,
  // cada humano da sala; no SOLO, só o clube que você comanda AGORA (+ o 2º clube
  // ATUAL do multiclube). Clube que você comprou e não comanda mais (o `isHuman`
  // fica preso no save) NÃO leva mais a sua cor — some do dourado no rank/jogos. A
  // SAF ATUAL entra à parte logo abaixo (também só a de agora, não a que já vendeu).
  const myHumans = state.onlineMode === 'online'
    ? state.managers.filter(m => m.isHuman)
    : state.managers.filter(m => m.isHuman && (m.id === youId || m.id === state.multiClube?.id))
  const humanKey = myHumans.map(m => m.id).join(',')
  const rivalKey = state.managers.filter(m => m.rival && !m.isHuman).map(m => m.id).join(',')
  // nomes dos humanos (com selo) — muda a cor cruzada quando alguém entra/troca de tier
  const nameKey = myHumans.map(m => `${m.id}:${m.teamName}`).join('|')
  const baseColors = useMemo(() => {
    const perkById: Record<number, ApoioPerk | null> = {}
    for (const m of state.managers) if (m.isHuman) perkById[m.id] = perkFromSelo(m.teamName)
    return playerColors(
      humanKey ? humanKey.split(',').map(Number) : [], youId, state.seed,
      rivalKey ? rivalKey.split(',').map(Number) : [], perkById,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [humanKey, rivalKey, youId, state.seed, nameKey])
  const myCol = baseColors[youId] ?? { solid: APOIO_PERKS.bege.solid, light: APOIO_PERKS.bege.light }
  // 🏢 a SUA SAF veste a MESMA cor do seu clube (mesma "marca"): acha o teamId
  // dela na tabela e injeta a sua cor no mapa — assim ela pinta igual em jogos,
  // artilharia e classificação. O ícone 💼 (vs 👤) é quem diferencia vocês.
  const safTeamName = state.careerFilial?.team
  // 🏛️ o 2º clube (Multiclubes) — mesmo DORMINDO — veste a MESMA cor do seu tier,
  // igual à SAF. É teu clube, então carrega tua marca em toda tabela/artilharia.
  const multiTeamName = state.multiClube?.team
  const colors = useMemo(() => {
    const idOf = (teamName?: string) => {
      if (!teamName) return undefined
      for (const d of DIVS) { const t = tables[d]?.find(x => x.name === teamName); if (t) return t.teamId }
      return undefined
    }
    // 🎨 injeta a SUA cor SÓ em id de time REAL (assento seu, id >= 0). NÃO colore a
    // SAF por aqui: a SAF é time de CPU e TODO CPU compartilha o id -1 — pintar por -1
    // pintava o BARALHO INTEIRO com a sua cor de tier. A SAF é colorida por NOME
    // (isSaf) no rank e na artilharia. Só o 2º clube do Multiclubes (assento próprio,
    // id real) entra aqui.
    const multiId = idOf(multiTeamName)
    if (multiId == null || multiId < 0) return baseColors
    return { ...baseColors, [multiId]: myCol }
  }, [baseColors, multiTeamName, tables, myCol])
  // COPA LEGENDS: no fim da temporada, o mata-mata dos 16 (determinístico da
  // classificação final + semente + temporada). Alimenta a aba Tabelas (chave),
  // a aba Rank (artilharia da Copa) e os prêmios da virada.
  const copa = useMemo(() => done ? computeCopa(tables, state.seed, state.seasonNo, capElite, realGoals) : null, [done, tables, state.seed, state.seasonNo, capElite, realGoals])
  // a Copa TOCA fase por fase (oitavas → quartas → semi → final), como a liga.
  // copaRound = fase ao vivo agora (0=oitavas). Zera a cada temporada nova.
  // se o save já assistiu a Copa desta temporada, começa JÁ finalizada (999 >= nº de
  // fases) — não re-anima do zero ao retomar; mostra direto os campeões/decisão.
  const [copaRound, setCopaRound] = useState(() => state.copaDoneSeason === state.seasonNo ? 999 : 0)
  const [copaPos, setCopaPos] = useState(0) // relógio da fase (0..nLegs*90) no nível da TELA (o placar fica em cima das abas)
  const [copaReady, setCopaReady] = useState(false) // 🎮 no manual, libera a "Próxima fase" quando a fase acaba de animar
  // ⏸️ passo é seu (SOLO + manual): usado tanto na liga quanto na Copa. Declarado
  // aqui em cima porque o efeito da Copa (logo abaixo) precisa saber se é manual.
  const [manualPref, toggleSim] = useSimMode()
  // 🎮 MODO MANUAL (carreira solo): liberado se (a) a carreira é ANTIGA — sem
  // careerEra, começou antes da cobrança → grandfather, nunca mexe em save antigo;
  // ou (b) a pessoa tem o Modo Manual/Lenda. Online segue de graça (outra tela).
  const hasManual = useHasManual()
  const manualAllowed = state.onlineMode === 'online' || !state.careerEra || hasManual
  // 🎮 ONLINE: o ritmo é do HOST (state.manualRoom, escolhido na criação e trocável
  // no meio) — sincroniza pra todos. OFFLINE/solo: preferência local do aparelho.
  const manual = state.onlineMode === 'online' ? !!state.manualRoom : (manualPref && manualAllowed)
  // 🚫 ANTI-SPOILER: ao VIRAR de fase da Copa (copaRound muda), o relógio ainda está
  // no fim da fase anterior por 1 frame — o que piscaria o placar/vencedor da fase
  // NOVA antes do apito. Zera JÁ na renderização (o efeito abaixo religa a animação).
  const copaRoundRef = useRef(copaRound)
  if (copaRoundRef.current !== copaRound) { copaRoundRef.current = copaRound; setCopaPos(0) }
  useEffect(() => { setCopaRound(state.copaDoneSeason === state.seasonNo ? 999 : 0); setCopaPos(0) }, [state.seasonNo, state.copaDoneSeason])
  const nCopaRounds = copa?.rounds.length ?? 0
  const copaPlaying = done && !!copa && nCopaRounds > 0 && copaRound < nCopaRounds
  const copaFinished = done && (!copa || nCopaRounds === 0 || copaRound >= nCopaRounds)
  // 🚫 ANTI-SPOILER na ARTILHARIA da Copa: o torneio inteiro é pré-calculado, mas
  // a artilharia mostrada conta SÓ as fases JÁ APITADAS (reveladas). Enquanto as
  // oitavas rolam (copaRound=0), a artilharia da Copa fica vazia — cai na do
  // campeonato. A cada fase que fecha, entram os gols daquela fase. No fim
  // (copaFinished) mostra tudo. Assim ninguém lê o artilheiro antes dos jogos.
  const copaScorersShown = useMemo<SeasonScorer[]>(() => {
    if (!copa) return []
    const upto = copaFinished ? copa.rounds.length : copaRound // fases apitadas
    const m = new Map<string, SeasonScorer>()
    for (let r = 0; r < upto; r++) for (const tie of copa.rounds[r].ties) for (const g of tie.goals) {
      const t = g.home ? tie.a : tie.b, div = g.home ? tie.aDiv : tie.bDiv
      const key = t.teamId + '|' + g.name, row = m.get(key)
      if (row) row.goals++
      else m.set(key, { name: g.name, teamName: t.name, teamId: t.teamId, div, goals: 1, you: t.you, human: t.human, rival: t.rival, dorm: t.dorm })
    }
    return [...m.values()].sort((a, b) => b.goals - a.goals).slice(0, 20)
  }, [copa, copaRound, copaFinished])
  // ao TERMINAR de animar a Copa, marca no save (pra não re-animar ao retomar)
  useEffect(() => {
    if (copaFinished && state.careerOnline && state.copaDoneSeason !== state.seasonNo) dispatch({ type: 'MARK_COPA_DONE' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copaFinished])
  // 💰 FECHAMENTO DAS CONTAS (carreira SOLO): assim que a liga E as copas acabam,
  // o caixa recebe TUDO da temporada de uma vez — prêmios, bilheteria, patrocínio,
  // renda do empresário, menos a folha salarial. Antes isso só entrava quando você
  // abria o leilão, e a moeda "aparecia do nada" no meio do pregão. No ONLINE
  // continua como era (quem manda é o host, no dispatch da sala).
  useEffect(() => {
    if (!copaFinished || !state.careerOnline || state.onlineMode === 'online') return
    if (state.booksSeason === state.seasonNo) return
    const sb = scorerRewards(divTop)
    const cr = copaRewards(copa ?? { rounds: [], champion: null, championDiv: null, vice: null, viceDiv: null, scorers: [] })
    const mrg = (a: Record<number, number>, b: Record<number, number>) => { const o = { ...a }; for (const k in b) o[+k] = (o[+k] ?? 0) + b[+k]; return o }
    dispatch({ type: 'CLOSE_SEASON_BOOKS', rewards: mrg(mrg(seasonRewards(tables), sb.rewards), cr.rewards) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copaFinished, state.booksSeason, state.seasonNo])
  // 🏛️ MULTICLUBES: momento SEGURO pra trocar = nenhuma rodada nem Copa animando na
  // tela (fora do leilão já é garantido — o leilão é outra tela). Se apertou o seletor
  // no meio de uma rodada (auto), a troca ESPERA e abre o confirmar no fim dela.
  const multiTravada = (!done && revealed < round) || copaPlaying
  useEffect(() => {
    if (multiPending && !multiTravada) { setMultiPending(false); setMultiAsk(true) }
  }, [multiPending, multiTravada])
  // fase da Copa tocando agora (pra mostrar DISCRETO no cabeçalho, no lugar da divisão)
  const copaFase = copaPlaying && copa ? copa.rounds[copaRound] : null
  const copaFaseName = copaFase ? (copaFase.name === 'Final' ? 'Final' : copaFase.name) : ''
  const copaNLegs = copaFase ? (copaFase.name === 'Final' ? 1 : 2) : 1
  const copaFaseTotal = copaNLegs * 90
  const myCopaTie = copaFase?.ties.find(t => t.a.you || t.b.you) ?? null
  const otherCopaTies = copaFase ? copaFase.ties.filter(t => t !== myCopaTie) : []
  // cada JOGO rola ~COPA_LEG_MS (como uma partida da liga): toca a IDA inteira e
  // depois a VOLTA, todos os jogos juntos. Avança de fase quando termina + folga.
  useEffect(() => {
    if (!copaPlaying) return
    setCopaPos(0); setCopaReady(false)
    const sf = state.simSpeed && state.simSpeed > 0 ? state.simSpeed : 1 // ⏩ marcha escolhida
    const dur = Math.round((copaNLegs * COPA_LEG_MS) / sf)
    const t0 = Date.now()
    const iv = setInterval(() => setCopaPos(Math.min(copaFaseTotal, ((Date.now() - t0) / dur) * copaFaseTotal)), 90)
    // 🎮 MANUAL: NÃO avança sozinho — libera a "Próxima fase" quando a fase termina de
    // animar e espera o toque. AUTO: avança sozinho depois da folga, como sempre.
    const rdy = setTimeout(() => setCopaReady(true), Math.round(dur * 0.9) + 250)
    const adv = manual ? null : setTimeout(() => setCopaRound(r => r + 1), dur + 2200)
    return () => { clearInterval(iv); clearTimeout(rdy); if (adv) clearTimeout(adv) }
  }, [copaPlaying, copaRound, copaNLegs, copaFaseTotal, state.simSpeed, manual])
  // quando a Copa COMEÇA (temporada da liga encerrou), joga todo mundo pra aba
  // Jogos — é lá que a Copa toca ao vivo, em cima dos jogos. (Uma vez por temporada.)
  useEffect(() => { if (copaPlaying) setTab('jogos') }, [copaPlaying])
  // escalação (XI) do SEU time pro próximo jogo — pra aba Elenco (substituição)
  const mgrMe = state.managers[state.youIdx]
  const myXI = useMemo(() => (mgrMe ? lineupAt(careerLineup, youId, round, mgrMe.squad, mgrMe.formation) : []), [careerLineup, youId, round, mgrMe])
  const myXIids = useMemo(() => new Set(myXI.map(c => c.id)), [myXI])

  // ─── 🎭 EVENTOS DE JOGADOR (só carreira SOLO — online segue 100% igual) ───
  const soloCareer = state.onlineMode !== 'online'
  // 🔒 SÓ carreiras com o novo modo empresário (agenciaOn) — ordem do Diego
  // (04/08): carreira ANTIGA nunca vê banner, médico, nada. Zero mudança nela.
  const eventosOn = soloCareer && !!state.agenciaOn
  const evAtual = eventosOn ? state.eventoTemporada : null
  // banner pendente = trava o avanço da rodada até o técnico decidir
  const eventoPendente = evAtual && evAtual.season === state.seasonNo && evAtual.status === 'pendente' ? evAtual : null
  // jogador fora (banco/gancho/lesão): não entra na escalação até a rodada da volta
  const suspenso = evAtual && evAtual.season === state.seasonNo && evAtual.status === 'banco' && (evAtual.volta ?? 0) > round && evAtual.mgrId === youId ? evAtual : null
  // sorteia o causo da temporada ANTES de avançar a rodada (true = sorteou e trava;
  // o "1 por temporada" e a janela de rodadas moram no sorteio + na trava do store)
  const maybeEvento = (): boolean => {
    if (!eventosOn || (state.seasonNo ?? 1) < 2 || !mgrMe || seasonOver || copaPlaying) return false
    if (evAtual && evAtual.season === state.seasonNo) return false
    const d = sorteiaEvento({ seed: seasonSeed, seasonNo: state.seasonNo ?? 1, round, xi: myXI as EventoCard[], squad: mgrMe.squad as EventoCard[], temMedico: hasExtra(state.stadiums?.[youId], 'medico') })
    if (!d) return false
    const base: EventoAtivo = { season: state.seasonNo ?? 1, round, mgrId: youId, tipo: d.tipo, cardId: d.card.id, nome: d.card.name, pos: d.card.pos, rodadas: d.rodadas, historia: d.historia, status: 'pendente' }
    if (!d.reservas.length) {
      // sem reserva na posição: NADA trava (regra do Diego) — vira só manchete de zoeira
      const m = mancheteSemReserva(d.tipo, d.card.name)
      dispatch({ type: 'EVENTO_SET', evento: { ...base, status: 'manchete' }, manchete: { season: base.season, round, ...m } })
      return false
    }
    dispatch({ type: 'EVENTO_SET', evento: base })
    return true
  }

  // artilheiros de TODOS OS TEMPOS (acumulado entre temporadas) — top 20
  const allTimeScorers = useMemo(() => Object.values((state.careerScorersAll ?? {}) as Record<string, SeasonScorer>).sort((a, b) => b.goals - a.goals).slice(0, 20), [state.careerScorersAll])
  // ao FIM da temporada, soma os artilheiros dela no acumulado (uma vez por
  // temporada; o reducer é idempotente por statsSeason). Cada cliente pode
  // disparar — guests roteiam pro host, que grava e sincroniza.
  useEffect(() => {
    if (!done || !state.careerOnline) return
    if ((state.statsSeason ?? 0) >= state.seasonNo) return
    // 🐛 BUG "meu jogador fez gol e não contou": antes gravava só o TOP 60 da
    // temporada (scorersAll.slice(0,60)) — quem ficava abaixo do 60º tinha os gols
    // DESCARTADOS do acumulado. Agora conta o gol de TODO time (usuário, bot,
    // rival), de todas as 4 divisões — nenhum gol é jogado fora. O ranking mostra
    // o top 20; o reducer guarda bem mais (top 300) pra ninguém perto de entrar
    // ficar de fora, sem o save crescer sem limite.
    dispatch({ type: 'RECORD_SEASON_STATS', scorers: scorersAll })
  }, [done, state.careerOnline, state.seasonNo, state.statsSeason]) // eslint-disable-line react-hooks/exhaustive-deps

  // MATERIALIZA a ficha dos 60 times de fundo (1x): antes eram recalculados na
  // hora; agora ganham elenco guardado, pra negociarem de verdade no mercado.
  // Idempotente (só semeia se ainda não existe).
  useEffect(() => {
    if (!state.careerOnline || state.cpuSquads) return
    dispatch({ type: 'SEED_CPU_SQUADS', squads: seedCpuSquads(state.managers, state.seed, state.deckLeague, !!state.escadaOn) })
  }, [state.careerOnline, state.cpuSquads, state.seed, state.deckLeague]) // eslint-disable-line react-hooks/exhaustive-deps

  // RANKING da carreira online: cada cliente grava o SEU resultado do fim da
  // temporada (título da sua divisão + artilharia geral) no esc_results — a
  // pirâmide não usa state.league, então o RankResultWriter do modo rápido não
  // pegava isso (por isso título/artilharia da carreira online não contavam).
  const rankWriteRef = useRef('')
  useEffect(() => {
    if (!done || !me || !state.careerOnline) return
    // chave da temporada: online usa o id da sala; offline (solo) usa a semente da
    // carreira (única por save), pra cada temporada contar sem colidir entre carreiras.
    // 🔑 online: sala + SEED (impressão digital do jogo) — o "novo leilão" reseta a
    // temporada pra 1, então sem o seed o título novo grava por cima do antigo.
    const room = state.roomId ? `${state.roomId}:${state.seed}` : `solo${state.seed}`
    const key = `co:${room}:${state.seasonNo}`
    if (rankWriteRef.current === key) return
    rankWriteRef.current = key
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return // só técnico com cadastro entra no ranking
        const myTeam = tables[me.div]?.find(t => t.teamId === youId)
        const topScorer = scorers[0] // artilheiro geral da pirâmide (todas as divisões)
        const displayName = stripEmoji(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? me.team)
        await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
          user_id: user.id, display_name: displayName,
          mode: state.roomId ? 'online' : 'cpu', season_key: key,
          champion: me.champ, top_scorer: topScorer?.teamId === youId,
          goals: myTeam?.gf ?? 0,
        } })
      } catch { /* nunca trava o jogo */ }
    })()
  }, [done, state.careerOnline, state.roomId, state.seasonNo, state.seed]) // eslint-disable-line react-hooks/exhaustive-deps
  // 🏆 COPA LEGENDS: campeão do mata-mata das 4 divisões TAMBÉM leva um título no
  // ranking (agora que a Copa também dá carta). Linha à parte (season_key com
  // sufixo ":copa"), igual a Copa dos 8 do rápido — dá pra somar título de liga +
  // Copa na mesma temporada. Grava quando a Copa termina de animar e você venceu.
  const copaRankRef = useRef('')
  useEffect(() => {
    if (!copaFinished || !copa?.champion?.you || !state.careerOnline) return
    const room = state.roomId ? `${state.roomId}:${state.seed}` : `solo${state.seed}`
    const key = `co:${room}:${state.seasonNo}:copa`
    if (copaRankRef.current === key) return
    copaRankRef.current = key
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return // só técnico com cadastro entra no ranking
        const displayName = stripEmoji(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? me?.team ?? 'Técnico')
        await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
          user_id: user.id, display_name: displayName,
          mode: state.roomId ? 'online' : 'cpu', season_key: key,
          champion: true, top_scorer: false, goals: 0,
        } })
      } catch { /* nunca trava o jogo */ }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copaFinished, copa?.champion?.you, state.careerOnline, state.roomId, state.seasonNo, state.seed])
  // 🕴️ AGÊNCIA 2.0: quando a COPA termina (fim real da temporada), computa os
  // acontecimentos dos agenciados — artilheiro de cada série + da Copa, e campeão
  // em QUALQUER time (liga das 4 divisões + Copa Legends). Manda pro motor como
  // eventos PENDENTES (pagos na virada, aparecem na Cerimônia — zero spoiler,
  // aqui tudo já passou do apito). Idempotente: o reducer grava 1x por temporada.
  const agEvRef = useRef('')
  useEffect(() => {
    if (!copaFinished || !state.agenciaOn || !agLib || !copa) return
    const key = `${state.seed}:${state.seasonNo}`
    if (agEvRef.current === key) return
    agEvRef.current = key
    const nomes = new Set((state.agenciados ?? []).map(a => a.name))
    const rows: AgEvento[] = []
    if (nomes.size > 0) {
      for (const d of DIVS) {
        const top = scorersAll.filter(x => x.div === d).sort((a, b) => b.goals - a.goals)[0]
        if (top && top.goals > 0 && nomes.has(top.name)) rows.push({ emoji: '🥇', texto: `${top.name} foi o artilheiro da ${DIV_NAME[d]} (${top.goals} gols)`, coins: 1, nome: top.name })
        const champ = tables[d]?.[0]
        if (champ) for (const p of champ.squad) if (nomes.has(p.name)) rows.push({ emoji: '🏆', texto: `${p.name} foi campeão da ${DIV_NAME[d]} pelo ${champ.name}`, coins: 1, nome: p.name })
      }
      if (copa.champion) for (const p of copa.champion.squad) if (nomes.has(p.name)) rows.push({ emoji: '🏆', texto: `${p.name} levou a Copa Legends pelo ${copa.champion.name}`, coins: 1, nome: p.name })
      if (copa.topScorer && nomes.has(copa.topScorer.name)) rows.push({ emoji: '🥇', texto: `${copa.topScorer.name} foi o artilheiro da Copa Legends`, coins: 1, nome: copa.topScorer.name })
    }
    dispatch({ type: 'AGENCIA_SEASON_EVENTS', season: state.seasonNo ?? 1, rows })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copaFinished, state.agenciaOn, agLib, state.seasonNo, state.seed])
  // substituição libera na 2ª temporada — INCLUSIVE no fim de temporada, pra você
  // já montar o time da próxima (a troca no fim não muda o campeonato que acabou;
  // o SET_LINEUP grava além da rodada 38 e só carrega pra próxima temporada).
  const canSub = state.seasonNo >= 2
  const [selId, setSelId] = useState<string | null>(null)
  // troca por SELEÇÃO: 1º toque marca o jogador; 2º toque num da MESMA posição do
  // outro lado (titular↔reserva) troca os dois. Toque em outro qualquer só remarca.
  const onTapPlayer = (cardId: string) => {
    if (!mgrMe) return
    // 🎭 suspenso (banco/gancho/lesão) não entra em troca até a rodada da volta —
    // o aviso do porquê fica em cima do elenco (regra: trava sempre explica).
    if (suspenso && cardId === suspenso.cardId) return
    const card = mgrMe.squad.find(c => c.id === cardId); if (!card) return
    if (selId === null || selId === cardId) { setSelId(selId === cardId ? null : cardId); return }
    const sel = mgrMe.squad.find(c => c.id === selId)
    const valid = sel && sel.pos === card.pos && (myXIids.has(sel.id) !== myXIids.has(card.id))
    if (!valid) { setSelId(cardId); return } // remarca
    const titularId = myXIids.has(sel.id) ? sel.id : card.id
    const reserveId = myXIids.has(sel.id) ? card.id : sel.id
    // o reserva entra EXATAMENTE na vaga do titular que saiu (mesmo índice do
    // array) — assim ele fica no mesmo lugar no campinho, sem embaralhar a linha.
    const ids = myXI.map(c => c.id)
    const idx = ids.indexOf(titularId)
    if (idx >= 0) ids[idx] = reserveId; else ids.push(reserveId)
    dispatch({ type: 'SET_LINEUP', mgrId: youId, ids })
    setSelId(null)
  }
  const myDiv = me?.div ?? null
  const ord = orderedDivs(myDiv).filter(d => d !== 'V' || (tables.V?.length ?? 0) > 0) // 🌱 Várzea só aparece quando existe
  const myMatch = myDiv ? matches[myDiv]?.find(x => x.you) : undefined
  const humansOf = (d: Div) => tables[d].filter(t => t.human || t.rival).map(t => ({ name: t.name, teamId: t.teamId, you: t.you, rival: !!t.rival, dorm: !!t.dorm }))

  // host conduz: avança a rodada (isso sincroniza pra todos). Nos modos SOLO
  // dá pra pausar entre rodadas (manual) e o jogo roda +5s mais calmo.
  // (manualPref/manual são declarados lá em cima — a Copa também precisa deles.)
  // ⏩ AUTO é sempre o ritmo padrão: ao voltar pro auto, zera a velocidade (Normal).
  const toggleManualCareer = () => {
    const goingManual = !manual
    // 🎮 ONLINE: quem troca o ritmo é o HOST, e a mudança sincroniza pra todos
    // (SET_MANUAL_ROOM) — nada de preferência local aqui.
    if (state.onlineMode === 'online') {
      if (!state.isHost) return
      dispatch({ type: 'SET_MANUAL_ROOM', on: goingManual })
      if (!goingManual && (state.simSpeed ?? 1) !== 1) dispatch({ type: 'SET_SIM_SPEED', speed: 1 })
      return
    }
    // 🔒 carreira NOVA sem o Modo Manual: não liga o manual — o botão vira convite
    // pro Apoie (tratado no render, este toggle nem é chamado quando travado).
    if (goingManual && !manualAllowed) return
    toggleSim()
    if (!goingManual && (state.simSpeed ?? 1) !== 1) dispatch({ type: 'SET_SIM_SPEED', speed: 1 })
  }
  // ⏩ velocidade da simulação (marcha do jogador): divide o tempo da rodada. 1 = normal.
  // O Normal do manual é IGUAL ao do auto (ROUND_MS); quem quiser mais calmo usa o 🐢.
  const roundMs = Math.round(ROUND_MS / speedFactor)
  useEffect(() => {
    // para de avançar quando a 38ª foi jogada (seasonOver), mesmo antes do fim
    // "revelar" (endShown) — senão dispararia PLAY_ROUND à toa durante a última anim.
    // 🎭 evento pendente PAUSA o auto: o banner pede a decisão do técnico primeiro.
    if (!state.isHost || seasonOver || manual || eventoPendente) return
    const t = setTimeout(() => { if (!maybeEvento()) dispatch({ type: 'PLAY_ROUND' }) }, roundMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, state.isHost, seasonOver, dispatch, manual, roundMs, eventoPendente])
  // 🚫 no MANUAL, "Próxima rodada" só libera DEPOIS que o jogo termina de animar —
  // igual ao stream/rápido. Sem isto dava pra clicar sem parar e pular os jogos.
  const [roundReady, setRoundReady] = useState(false)
  useEffect(() => {
    setRoundReady(false)
    const t = setTimeout(() => setRoundReady(true), roundMs * 0.85 + 250)
    return () => clearTimeout(t)
  }, [round, roundMs])

  return (
    <div className="palco" style={{ minHeight: '100vh', background: '#F4ECD6', color: INK }}>
      <div className="max-w-xl mx-auto" style={{ padding: '16px 14px 48px' }}>
        <div style={{ ...box(INK), position: 'relative', overflow: 'hidden', color: '#fff', marginBottom: 8 }}>
          <div style={{ padding: '12px 14px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: GOLD }}>{copaPlaying ? `Temporada ${state.seasonNo} · 🏆 Copa Legends` : <>Temporada {state.seasonNo}{me ? ` · ${DIV_NAME[me.div]}` : ''}</>}</div>
              <div style={{ ...OSWALD, fontWeight: 800, fontSize: 18, marginTop: 2, lineHeight: 1 }}>{copaPlaying ? copaFaseName : done ? 'Encerrada' : round === 0 ? 'Começando…' : <>Rodada <b style={{ fontSize: 21 }}>{round}</b><span style={{ fontSize: 12, opacity: 0.5, fontWeight: 700 }}> / 38</span></>}</div>
              {copaPlaying && <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginTop: 4, lineHeight: 1.3 }}>Os 4 melhores de cada série (A·B·C·D) no mata-mata</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              {!done && me && <span style={{ fontWeight: 800, fontSize: 12, ...OSWALD, border: '2px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>{me.pos === 1 ? '🥇' : '🏅'} {me.pos}º</span>}
              <CoinsBadge coins={state.careerCoins?.[youId] ?? 0} />
            </div>
          </div>
          {/* progresso da temporada: trilho ESCURO visível de ponta a ponta (não
              é mais um risquinho solto — lê como barra que está começando) */}
          {!done && <div style={{ position: 'absolute', left: 0, bottom: 0, height: 6, width: '100%', background: '#2b2721' }}><div style={{ height: '100%', minWidth: 3, width: `${Math.min(100, Math.round(round / 38 * 100))}%`, background: `linear-gradient(90deg, ${GOLD}, #ffde5c)` }} /></div>}
        </div>

        {/* FIM da temporada: banner de campeão/colocação. AO VIVO: placar FIXO da
            sua partida — fica no topo em TODAS as abas, então dá pra trocar de aba
            e continuar vendo o resultado ao vivo. */}
        {done && me && (
          <div style={{ ...box(me.champ ? GOLD : '#fff'), padding: 12, marginBottom: 12, textAlign: 'center' }}>
            {me.champ
              ? <p style={{ fontWeight: 900, fontSize: 17, ...OSWALD, margin: 0 }}>🏆 CAMPEÃO DA {DIV_NAME[me.div].toUpperCase()}!</p>
              : <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD, margin: 0 }}>🏁 {me.team} — {me.pos}º na {DIV_NAME[me.div]}</p>}
            {copaPlaying && <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '5px 0 0' }}>Fim da temporada da liga. Agora começa a <b>Copa Legends</b> — outro campeonato 👇</p>}
          </div>
        )}
        {/* A Copa ao vivo agora toca DENTRO da aba Jogos (em cima dos jogos). No
            FIM, o painel de campeões da temporada (Copa + séries + artilheiros)
            aparece expandido aqui; os botões de leilão/mesmo time ficam logo abaixo. */}
        {/* 📰 O MARTELO: jornal da temporada JÁ ABERTO — manchete única pra cada
            uma das 80 posições + os donos da temporada (campeões e artilheiros).
            O painel antigo de campeões saiu: o jornal cobre tudo aquilo. */}
        {copaFinished && me && (
          <SeasonJornal me={me} tables={tables} copa={copa} divTop={divTop} seasonNo={state.seasonNo}
            /* 🎭 EVENTOS: manchetes do "Aconteceu na temporada" (página própria do jornal) */
            eventos={eventosOn ? (state.eventoManchetes ?? []).filter(m => m.season === state.seasonNo).map(m => ({ ic: m.emoji, titulo: m.titulo, sub: m.sub })) : undefined}
            /* 🕴️ AGÊNCIA 2.0: notícias dos agenciados pra página 2 do jornal —
               SÓ emoção, sem moeda (decisão do Diego). Artilheiro/campeão desta
               temporada + negociações do último mercado. Sem notícia = sem pág. 2. */
            agenciaNews={(() => {
              if (!state.agenciaOn || !agLib) return undefined
              const nomes = new Set((state.agenciados ?? []).map(a => a.name))
              if (!nomes.size) return undefined
              const nn: { ic: string; titulo: string; sub: string }[] = []
              for (const d of DIVS) {
                const top = scorersAll.filter(x => x.div === d).sort((a, b) => b.goals - a.goals)[0]
                if (top && top.goals > 0 && nomes.has(top.name)) nn.push({ ic: '🥇', titulo: `${top.name} é o artilheiro da ${DIV_NAME[d]}`, sub: `${top.goals} gols pelo ${top.teamName}. A torcida cantou o nome dele — e o telefone da sua agência não parou de tocar.` })
                const champ = tables[d]?.[0]
                if (champ) for (const p of champ.squad) if (nomes.has(p.name)) nn.push({ ic: '🏆', titulo: `${p.name} levanta a taça pelo ${champ.name}`, sub: `Campeão da ${DIV_NAME[d]}! Ergueu o troféu e apontou pra tribuna: "esse aí é do meu agente!" 😎` })
              }
              if (copa?.champion) for (const p of copa.champion.squad) if (nomes.has(p.name)) nn.push({ ic: '🏆', titulo: `${p.name} campeão da Copa Legends`, sub: `Taça pelo ${copa.champion.name} — cria da sua agência dando show no mata-mata.` })
              if (copa?.topScorer && nomes.has(copa.topScorer.name)) nn.push({ ic: '🥇', titulo: `${copa.topScorer.name} é o artilheiro da Copa`, sub: `${copa.topScorer.goals} gols no mata-mata — o país inteiro quer saber quem agencia esse craque.` })
              for (const r of (state.agenciaFatura?.rows ?? []).filter(x => x.emoji === '💸').slice(0, 3)) if (r.nome) nn.push({ ic: '✍️', titulo: `${r.nome} de casa nova`, sub: 'Negociação fechada no mercado — com a bênção da sua agência.' })
              return nn.length ? nn.slice(0, 6) : undefined
            })()} />
        )}
        {copaFinished && copa?.champion && (
          <button onClick={() => setTab('tabelas')} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,.5)', fontWeight: 800, fontSize: 11, ...OSWALD, margin: '-4px 0 12px', textDecoration: 'underline' }}>👉 ver o chaveamento da Copa na aba Tabelas</button>
        )}
        {!done && myMatch && me && <MyMatchCard m={myMatch} youName={me.team} col={myCol} colors={colors} roundKey={round} roundMs={roundMs} />}
        {/* 🎭 EVENTO DE JOGADOR: banner de decisão — a rodada SÓ anda depois da escolha.
            Elenco/XI vêm do clube DO EVENTO (ev.mgrId): se o técnico trocar de clube
            (multiclube) com o banner aberto, a decisão segue no clube certo. */}
        {eventoPendente && (() => {
          const evMgr = state.managers.find(m => m.id === eventoPendente.mgrId)
          if (!evMgr) return null
          const evXI = lineupAt(careerLineup, eventoPendente.mgrId, round, evMgr.squad, evMgr.formation)
          const evXIids = new Set(evXI.map(c => c.id))
          return <EventoBanner ev={eventoPendente}
            reservas={evMgr.squad.filter(c => c.pos === eventoPendente.pos && !evXIids.has(c.id))}
            onDecide={(escolha, subId) => dispatch({ type: 'EVENTO_DECIDE', escolha, subId, xi: evXI.map(c => c.id) })} />
        })()}
        {/* 🎭 aviso do suspenso (o porquê + quando volta) — a trava explica sempre */}
        {!done && suspenso && (
          <div style={{ border: `2.5px solid ${INK}`, borderRadius: 12, padding: '8px 11px', marginBottom: 10, background: '#FDE9C8', fontWeight: 800, fontSize: 11, lineHeight: 1.4 }}>
            {eventoEmoji(suspenso.tipo)} <b>{suspenso.nome}</b> está fora ({suspenso.tipo === 'noitada' ? 'foi pro banco depois da noitada' : suspenso.tipo === 'expulsao' ? 'cumprindo gancho' : 'se recuperando da lesão'}) — volta na <b>rodada {(suspenso.volta ?? 0) + 1}</b>.{suspenso.subNome ? <> {suspenso.subNome} segura a vaga.</> : null}
          </div>
        )}
        {state.isHost && !seasonOver && !copaPlaying && (state.onlineMode !== 'online' || hasManual) && (
          manualAllowed ? (
          <>
            {manual && <SpeedControls speed={state.simSpeed ?? 1} onSet={v => dispatch({ type: 'SET_SIM_SPEED', speed: v })} />}
            <SimControls manual={manual} onToggle={toggleManualCareer} canNext={round === 0 || roundReady}
              onNext={() => { if (!maybeEvento()) dispatch({ type: 'PLAY_ROUND' }) }}
              onSkip={() => { if (!maybeEvento()) dispatch({ type: 'PLAY_ROUND' }) }}
              nextLabel={!(round === 0 || roundReady) ? '⏳ Deixa a rodada acabar…' : round === 0 ? '▶️ Começar a temporada' : '▶️ Próxima rodada'} />
          </>
          ) : <ManualLockButton />
        )}
        {/* 🎮 CONVIDADO (online): NÃO controla o ritmo (só o host), mas VÊ o estado —
            e a mudança reflete na hora quando o host troca manual↔auto (manualRoom
            sincroniza). Assim ele entende por que a temporada pausou ou seguiu. */}
        {state.onlineMode === 'online' && !state.isHost && !seasonOver && !copaPlaying && (
          <div style={{ border: `2.5px solid ${INK}`, borderRadius: 12, padding: '9px 11px', marginBottom: 10, textAlign: 'center', background: manual ? '#EAF3FF' : '#F1EFE6' }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, margin: 0, color: INK }}>{manual ? '🎮 Modo Manual — o host controla o ritmo' : '⚡ Auto — a temporada anda sozinha'}</p>
            <p style={{ fontWeight: 700, fontSize: 10, margin: '2px 0 0', color: 'rgba(0,0,0,.55)' }}>{manual ? 'A próxima rodada anda quando o host avançar.' : 'O host pode pausar (Manual) a qualquer hora.'}</p>
          </div>
        )}
        {/* COPA ao vivo: SEU jogo fica no MESMO lugar do placar da liga (em cima
            das abas) — suave, quase não muda o layout. Só quando você está na fase. */}
        {copaPlaying && myCopaTie && <div style={{ marginBottom: 12 }}><CopaLiveMatch tie={myCopaTie} pos={copaPos} big colors={colors} safName={safTeamName} /></div>}
        {/* 🎮 mesmos controles da liga valem na COPA quando o manual está ligado:
            velocidade + Próxima fase / Pular / Modo auto. No AUTO a Copa segue
            sozinha (só aparece o botão de ativar o manual). */}
        {copaPlaying && state.isHost && (state.onlineMode !== 'online' || hasManual) && (
          manualAllowed ? (
          <>
            {manual && <SpeedControls speed={state.simSpeed ?? 1} onSet={v => dispatch({ type: 'SET_SIM_SPEED', speed: v })} />}
            <SimControls manual={manual} onToggle={toggleManualCareer} canNext={copaReady}
              onNext={() => setCopaRound(r => r + 1)}
              onSkip={() => setCopaRound(r => r + 1)}
              nextLabel={!copaReady ? '⏳ Deixa o jogo acabar…' : copaRound + 1 >= nCopaRounds ? '🏆 Ver o campeão' : '▶️ Próxima fase'} />
          </>
          ) : <ManualLockButton />
        )}
        {/* 🎮 CONVIDADO (online) na Copa: vê o ritmo do host (read-only), reflete a troca */}
        {state.onlineMode === 'online' && !state.isHost && copaPlaying && (
          <div style={{ border: `2.5px solid ${INK}`, borderRadius: 12, padding: '9px 11px', marginBottom: 10, textAlign: 'center', background: manual ? '#EAF3FF' : '#F1EFE6' }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, margin: 0, color: INK }}>{manual ? '🎮 Modo Manual — o host controla o ritmo' : '⚡ Auto — a Copa anda sozinha'}</p>
            <p style={{ fontWeight: 700, fontSize: 10, margin: '2px 0 0', color: 'rgba(0,0,0,.55)' }}>{manual ? 'A próxima fase anda quando o host avançar.' : 'O host pode pausar (Manual) a qualquer hora.'}</p>
          </div>
        )}

        {copaFinished && me?.champ && state.careerOnline && (
          <div style={{ marginBottom: 12 }}>
            <CardCollectPrompt you={state.managers[state.youIdx]} seasonKey={`co:${state.roomCode || `solo${state.seed}`}:${state.seasonNo}`} origin={state.roomId ? 'online' : 'cpu'} saveCards={state.roomId ? (state.careerEmpresario?.[youId] ?? []) : (state.empresarioCards ?? [])} onClaimed={c => dispatch({ type: 'ADD_EMPRESARIO_CARD', mgrId: youId, key: `co:${state.roomCode || `solo${state.seed}`}:${state.seasonNo}`, card: { name: c.name, club: c.club, year: c.year, pos: c.pos, fame: c.fame, folk: c.folk, promessa: c.promessa } })} />
          </div>
        )}
        {/* 🏆 Campeão da COPA LEGENDS (mata-mata dos 16) ganha carta À PARTE do
            título de divisão — pode ser um time diferente, ou o mesmo ganhando as
            duas. seasonKey própria (sufixo ":copa") pra não colidir com a de cima. */}
        {copaFinished && copa?.champion?.you && state.careerOnline && (
          <div style={{ marginBottom: 12 }}>
            <CardCollectPrompt you={state.managers[state.youIdx]} seasonKey={`co:${state.roomCode || `solo${state.seed}`}:${state.seasonNo}:copa`} origin={state.roomId ? 'online' : 'cpu'} saveCards={state.roomId ? (state.careerEmpresario?.[youId] ?? []) : (state.empresarioCards ?? [])} onClaimed={c => dispatch({ type: 'ADD_EMPRESARIO_CARD', mgrId: youId, key: `co:${state.roomCode || `solo${state.seed}`}:${state.seasonNo}:copa`, card: { name: c.name, club: c.club, year: c.year, pos: c.pos, fame: c.fame, folk: c.folk, promessa: c.promessa } })} />
          </div>
        )}
        {copaFinished && (() => {
          // 🏛️ MULTICLUBES: o 2º clube dormindo é `isHuman` (assento meu), mas NÃO conta
          // como técnico na votação — senão o SOLO cairia no fluxo online. Fica de fora aqui.
          const humans = state.managers.filter(m => m.isHuman && !m.dormindo)
          const votes = state.seasonVotes ?? {}
          const myVote = votes[youId]
          const leilaoLabel = state.seasonNo === 1 ? 'Leilão de reservas' : 'Leilão de transferências'
          // prêmio do artilheiro de cada divisão: soma no caixa do time + sobe o piso
          const sb = scorerRewards(divTop)
          const cr = copaRewards(copa ?? { rounds: [], champion: null, championDiv: null, vice: null, viceDiv: null, scorers: [] }) // campeão +25 · vice +15 · artilheiro +16 (caixa+piso)
          const mrg = (a: Record<string | number, number>, b: Record<string | number, number>) => { const o = { ...a }; for (const k in b) o[k] = (o[k] ?? 0) + b[k]; return o }
          const args = () => ({ placements: computePromotions(tables), rewards: mrg(mrg(seasonRewards(tables), sb.rewards), cr.rewards), clubRewards: mrg(mrg(clubRewards(tables), sb.clubRewards), cr.clubRewards), champions: seasonChampions(tables), scorerValues: mrg(sb.values, cr.values), copaChampion: cr.championKey })
          const openLeilao = () => dispatch({ type: 'OPEN_RESERVE_LIST', ...args() })
          const openMesmo = () => dispatch({ type: 'NEXT_SEASON_ONLINE', ...args() })
          // JOGO SOLO (host sozinho): sem votação, começa direto como antes.
          const noVermelho = (state.careerCoins?.[youId] ?? 0) < 0
          // 🌍 COPA DO MUNDO LEGENDS: trava/contagem/botão dourado no fim da
          // temporada (SOLO e ONLINE). Vaga e ordem = TOP 20 do ranking de clubes
          // (mural). No ONLINE cada técnico disputa a SUA Copa no próprio aparelho
          // (os demais clubes do top 20 entram como CPU) — nada é sincronizado,
          // então zero risco pro estado da sala; a Copa em sala (votação) é fase futura.
          const copaGate = (() => {
            const hn = (state.careerHonors ?? {}) as Record<string, Honors>
            const ch = state.careerCopaHonors ?? {}
            const cc = state.clubCash ?? {}
            const rws = DIVS.flatMap(d => tables[d]).map(t => {
              const key = teamKey(t)
              const olds = oldChain(key)
              const pick = <V,>(rec: Record<string, V>): V | undefined => rec[key] ?? olds.map(o => rec[o]).find(v => v !== undefined)
              const money = t.human ? (state.careerCoins?.[t.teamId] ?? 0) : Math.round(pick(cc) ?? 0)
              return { t, h: pick(hn) ?? EMPTY_HONORS, copas: pick(ch) ?? 0, money }
            })
            rws.sort((a, b) => b.h.A - a.h.A || b.h.B - a.h.B || b.h.C - a.h.C || b.h.D - a.h.D || b.money - a.money || a.t.name.localeCompare(b.t.name))
            // 🏛️ MULTICLUBES (regra do Diego 04/08): os DOIS clubes seus contam —
            // qualquer um deles no top-20 marca "você", e o prêmio vai pra CADA
            // clube seu classificado (independentes até na Copa do Mundo).
            const dormeId = state.multiClube?.id
            const meu = (id: number) => id >= 0 && (id === youId || id === dormeId)
            const top16 = rws.slice(0, 20).map(r => ({ name: r.t.name, you: meu(r.t.teamId) })) // 🌍 Copa de 20 seleções (era 16)
            const meusNoTop = rws.slice(0, 20).filter(r => meu(r.t.teamId)).map(r => r.t.teamId)
            // 💰 prêmio da Copa (+100): dispatch normal — no SOLO aplica direto; no
            // ONLINE o convidado roteia AUTOMATICAMENTE pro host (mesmo cano do
            // lance de leilão), o host anota no caixa oficial e sincroniza pra sala.
            // Ninguém aperta nada: é conversa entre os celulares.
            return <CopaMundoGate seasonNo={state.seasonNo} seed={state.seed} top16={top16} myPos={top16.findIndex(r => r.you)}
              onPrize={() => { for (const id of (meusNoTop.length ? meusNoTop : [youId])) dispatch({ type: 'COPA_MUNDO_PRIZE', mgrId: id }) }}
              onCard={(c, key) => dispatch({ type: 'ADD_EMPRESARIO_CARD', mgrId: youId, key, card: { name: c.name, club: c.club, year: c.year, pos: c.pos as Sector, fame: c.fame, folk: c.folk, promessa: c.promessa } })} />
          })()
          // 🗳️ a VOTAÇÃO é só do ONLINE (vários técnicos na sala decidem juntos).
          // No SOLO/carreira offline NUNCA vota — mesmo com 2º clube (multiclube),
          // quem decide é você e o leilão é de UM clube só. Guarda por onlineMode
          // pra um save torto (2 humanos ativos) não cair na votação sem sentido.
          if (state.onlineMode !== 'online' || humans.length <= 1) return (
            <div style={{ ...box('#EAF3FF'), padding: 13, marginBottom: 12 }}>
              {copaGate}
              {noVermelho && (
                <div style={{ background: '#C2452F', color: '#fff', border: `2.5px solid ${INK}`, borderRadius: 11, boxShadow: `2px 2px 0 0 ${INK}`, padding: '9px 11px', marginBottom: 10, ...OSWALD }}>
                  <p style={{ fontWeight: 900, fontSize: 12.5, margin: 0 }}>🚫 Transfer ban — clube no vermelho ({state.careerCoins?.[youId] ?? 0} 🪙)</p>
                  <p style={{ fontWeight: 700, fontSize: 10.5, margin: '3px 0 0', lineHeight: 1.35, color: 'rgba(255,255,255,.9)' }}>Você ainda entra no leilão, mas <b>sem grana pra comprar</b>: dá pra <b>vender pra recuperar</b> e tentar a sorte pegando <b>jogador de graça no monte</b>. Ganhando prêmios e bilheteria você sai do vermelho.</p>
                </div>
              )}
              <p style={{ fontWeight: 900, fontSize: 13.5, ...OSWALD, margin: '0 0 3px' }}>📅 Próxima temporada</p>
              {/* 🏛️ MULTICLUBES · seletor (só entre temporadas, só testers) */}
              {state.onlineMode !== 'online' && state.multiClube && (() => {
                const ativo = state.managers[state.youIdx]?.teamName ?? '—'
                const dormindo = state.multiClube.team
                return (
                  <div style={{ ...box('#0C0C0C'), padding: 11, color: '#fff', margin: '0 0 10px' }}>
                    <p style={{ fontWeight: 900, fontSize: 12.5, color: GOLD, ...OSWALD, margin: 0 }}>🏛️ MULTICLUBES — quem você comanda?</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                      <div style={{ flex: 1, border: '2px solid #000', borderRadius: 9, padding: '6px 8px', background: GOLD, color: '#000', fontWeight: 900, fontSize: 11, textAlign: 'center', ...OSWALD }}>🟡 {ativo}<div style={{ fontSize: 8, fontWeight: 800 }}>no comando ✓</div></div>
                      <div style={{ flex: 1, border: '2px solid #000', borderRadius: 9, padding: '6px 8px', background: '#3a3a3a', color: 'rgba(255,255,255,.7)', fontWeight: 900, fontSize: 11, textAlign: 'center', ...OSWALD }}>⚪ {dormindo}<div style={{ fontSize: 8, fontWeight: 800 }}>dormindo 💤</div></div>
                    </div>
                    <button onClick={() => dispatch({ type: 'SWITCH_MULTICLUBE' })} style={{ width: '100%', marginTop: 8, border: '2.5px solid #000', borderRadius: 10, padding: 9, fontWeight: 900, fontSize: 12, background: '#fff', color: '#000', cursor: 'pointer', ...OSWALD }}>🔄 Passar o comando pro {dormindo}</button>
                    <p style={{ fontFamily: 'system-ui', fontSize: 8.5, color: 'rgba(255,255,255,.45)', margin: '6px 0 0', textAlign: 'center' }}>Trocar = na próxima você comanda o outro; este dorme (mesmo time).</p>
                  </div>
                )
              })()}
              {/* 🏛️ MULTICLUBES · cartas GUARDADAS: quando o clube que estava dormindo foi
                  campeão, o pacote fica esperando e aparece aqui pra VOCÊ abrir assim que
                  passa o comando pra ele. Uma por título (divisão e/ou Copa Legends). */}
              {state.onlineMode !== 'online' && (state.multiClubePendingCards?.[youId] ?? []).length > 0 && (
                <div style={{ margin: '0 0 12px' }}>
                  <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, color: INK, margin: '0 0 7px', textAlign: 'center' }}>🎁 Enquanto dormia, o <b>{state.managers[state.youIdx]?.teamName}</b> foi campeão! Abra {(state.multiClubePendingCards?.[youId] ?? []).length > 1 ? 'os pacotes guardados' : 'o pacote guardado'} 👇</p>
                  {(state.multiClubePendingCards?.[youId] ?? []).map(p => {
                    const key = `co:solo${state.seed}:${p.season}:mc${youId}${p.copa ? ':copa' : ''}`
                    return (
                      <div key={key} style={{ marginBottom: 10 }}>
                        <CardCollectPrompt you={state.managers[state.youIdx]} seasonKey={key} origin="cpu" saveCards={state.empresarioCards ?? []}
                          onClaimed={c => {
                            dispatch({ type: 'ADD_EMPRESARIO_CARD', mgrId: youId, key, card: { name: c.name, club: c.club, year: c.year, pos: c.pos, fame: c.fame, folk: c.folk, promessa: c.promessa } })
                            dispatch({ type: 'CLEAR_MULTICLUBE_PENDING', mgrId: youId, season: p.season, copa: p.copa })
                          }} />
                      </div>
                    )
                  })}
                </div>
              )}
              <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', marginBottom: 10 }}>Acessos e quedas (por nome exato) já entram. {state.seasonNo === 1
                ? <>Abra o <b>leilão de reservas</b> (todos com a sua caixa, compram pra encher o banco até 22), ou siga com o mesmo elenco.</>
                : <>Abra o <b>leilão de transferências</b> (1 carta nova por posição + os jogadores que cada técnico listar), ou siga com o mesmo elenco.</>}</p>
              {/* 🏛️ MULTICLUBES: deixa claro que o leilão é SÓ do clube ativo; o outro
                  segue mesmo time (sem leilão). Pra leiloar o outro, troca no seletor antes. */}
              {state.multiClube && (() => {
                const ativo = state.managers[state.youIdx]?.teamName ?? '—'
                const dormindo = state.multiClube.team
                return (
                  <div style={{ ...box('#FFF3CF'), padding: 10, marginBottom: 10, border: `2.5px solid ${INK}` }}>
                    <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11.5, color: INK, margin: 0 }}>🏛️ Você tem 2 clubes — o leilão é de UM só</p>
                    <p style={{ fontFamily: 'system-ui', fontSize: 10.5, fontWeight: 600, color: '#5a4a1a', margin: '4px 0 0', lineHeight: 1.4 }}>Se abrir o leilão, ele vale <b>só pro {ativo}</b> (o que você comanda). O <b>{dormindo}</b> segue <b>mesmo time</b>, sem leilão. Quer leiloar o {dormindo}? <b>Troque no seletor</b> aqui em cima <b>antes</b> de abrir.</p>
                  </div>
                )
              })()}
              <button onClick={openLeilao} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GOLD, color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>🔨 {leilaoLabel}</button>
              <button onClick={openMesmo} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>▶️ Mesmo time (sem leilão)</button>
            </div>
          )
          // ONLINE com amigos: VOTAÇÃO. O host só inicia quando todos votam;
          // maioria vence, empate → o voto do host decide.
          const nLeilao = humans.filter(m => votes[m.id] === 'leilao').length
          const nMesmo = humans.filter(m => votes[m.id] === 'mesmo').length
          const nVoted = nLeilao + nMesmo
          const allVoted = nVoted === humans.length
          const pendentes = humans.filter(m => !votes[m.id])
          const pendNomes = pendentes.map(m => m.id === youId ? 'você' : m.name).join(', ')
          const start = () => { (nLeilao > nMesmo ? openLeilao : nMesmo > nLeilao ? openMesmo : (votes[youId] === 'leilao' ? openLeilao : openMesmo))() }
          const voteBtn = (v: 'leilao' | 'mesmo', label: string, bg: string, fg: string) => (
            <button onClick={() => dispatch({ type: 'CAST_SEASON_VOTE', mgrId: youId, vote: v })}
              style={{ flex: 1, border: `3px solid ${INK}`, borderRadius: 12, padding: '11px 6px', fontWeight: 900, fontSize: 13, ...OSWALD, cursor: 'pointer', position: 'relative', background: myVote === v ? bg : '#fff', color: myVote === v ? fg : INK, boxShadow: myVote === v ? `3px 3px 0 0 ${INK}` : 'none' }}>
              {myVote === v && <span style={{ position: 'absolute', top: 3, right: 6, fontSize: 11 }}>✓</span>}{label}
            </button>
          )
          return (
            <div style={{ ...box('#EAF3FF'), padding: 13, marginBottom: 12 }}>
              {/* 🌍 no ONLINE a Copa é individual (cada técnico no seu aparelho) —
                  jogar não trava a votação: dá pra disputar e voltar pra votar. */}
              {copaGate}
              <p style={{ fontWeight: 900, fontSize: 13.5, ...OSWALD, margin: '0 0 3px' }}>🗳️ Votação — próxima temporada</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', marginBottom: 10 }}>Acessos e quedas já entram. Todos votam: abrir o <b>{leilaoLabel.toLowerCase()}</b> {state.seasonNo === 1 ? '(encher o banco até 22)' : '(1 carta nova por posição + os listados)'} ou seguir com o <b>mesmo time</b>. Empate → o host decide.</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {voteBtn('leilao', `🔨 ${leilaoLabel}`, GOLD, INK)}
                {voteBtn('mesmo', '▶️ Mesmo time', GREEN, '#fff')}
              </div>
              <style>{'@keyframes coReady{0%,100%{transform:translateY(0);box-shadow:4px 4px 0 0 ' + INK + '}50%{transform:translateY(-2px);box-shadow:4px 6px 0 0 ' + INK + '}}'}</style>
              {/* chips: quem votou já está PRONTO (✓); quem falta pisca com ⏳ */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {humans.map(m => { const v = votes[m.id]; return (
                  <span key={m.id} style={{ fontSize: 10, fontWeight: 800, ...OSWALD, border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 8px', background: v ? (v === 'leilao' ? GOLD : GREEN) : '#fff', color: v === 'mesmo' ? '#fff' : INK, opacity: v ? 1 : 0.55 }}>
                    {v ? `${v === 'leilao' ? '🔨' : '▶️'} ${m.id === youId ? 'Você' : m.name} ✓` : `⏳ ${m.id === youId ? 'Você' : m.name}`}
                  </span>
                )})}
              </div>
              {state.isHost ? (
                <>
                  {allVoted
                    ? <p style={{ fontSize: 11.5, fontWeight: 800, color: GREEN, margin: '0 0 7px', textAlign: 'center' }}>🔔 Todos votaram e estão prontos! Bora começar 👇</p>
                    : <p style={{ fontSize: 11, fontWeight: 700, color: '#8a6a2a', margin: '0 0 7px', textAlign: 'center' }}>⏳ Falta votar: <b>{pendNomes}</b></p>}
                  <button disabled={!allVoted} onClick={start}
                    style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, ...OSWALD, background: allVoted ? GREEN : '#cfcabb', color: '#fff', boxShadow: allVoted ? `4px 4px 0 0 ${INK}` : 'none', cursor: allVoted ? 'pointer' : 'not-allowed', animation: allVoted ? 'coReady 1.1s ease-in-out infinite' : undefined }}>
                    {allVoted ? '▶️ Começar próxima temporada' : `Aguardando votos… (${nVoted}/${humans.length})`}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {!myVote
                    ? <p style={{ fontSize: 12, fontWeight: 900, ...OSWALD, color: '#b23b2e', margin: '2px 0 0' }}>👆 Toque no seu voto — assim o host sabe que você tá pronto!</p>
                    : allVoted
                      ? <p style={{ fontSize: 11.5, fontWeight: 800, color: GREEN, margin: '2px 0 0' }}>✅ Todos prontos! Cutuca o host pra apertar <b>Começar</b> 👊</p>
                      : <p style={{ fontSize: 11.5, fontWeight: 800, color: '#3a5a8a', margin: '2px 0 0' }}>✅ Pronto! Voto computado. Falta: <b>{pendNomes}</b>. O host começa logo depois.</p>}
                </div>
              )}
            </div>
          )
        })()}

        {/* abas em pílulas — a ativa fica na SUA cor. 🏟️ Clube (Estádio) agora vale
            também no ONLINE (Passo 1): construir + renda já sincronizam por-técnico.
            SAF · Patrocínio · Finanças · Agência ainda são só SOLO (Passo 2). */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {([['jogos', '🗓️', 'Jogos'], ['tabelas', '📊', 'Tabelas'], ['elenco', '👥', 'Elenco'], ['ranking', '🏆', 'Rank'], ['estadio', '💰', 'Clube']] as [typeof tab, string, string][]).map(([t, ic, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 2px', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', background: tab === t ? myCol.solid : '#fff', color: tab === t ? '#fff' : INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, ...OSWALD }}><span style={{ fontSize: 14 }}>{ic}</span>{label}</button>
          ))}
        </div>

        {tab === 'estadio' ? (
          <>
            {/* sub-abas do Clube: 🏟️ Estádio | 💰 Finanças | 💼 Agência.
                Agora tudo (Estádio · Finanças · Agência) vale online também,
                por-técnico (Passo 2c completa a paridade com o offline). */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(([['estadio', agenciaOk ? '🏗️' : '🏟️', agenciaOk ? 'Estrutura' : 'Estádio'], ['financas', '💰', 'Finanças'], ['escritorio', '💼', 'Agência']]) as [typeof clubeSub, string, string][])
                // 🕴️ Agência 2.0 ligada: a agência mora em Elenco › Agenciados e os
                // desbloqueios DENTRO da Estrutura — some a sub-aba daqui (pedido do Diego)
                .filter(([sb]) => !(sb === 'escritorio' && agenciaOk)).map(([s, ic, label]) => (
                <button key={s} onClick={() => setClubeSub(s)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '8px 2px', fontWeight: 900, fontSize: 10.5, textTransform: 'uppercase', background: clubeSub === s ? myCol.solid : '#fff', color: clubeSub === s ? '#fff' : INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, ...OSWALD }}><span style={{ fontSize: 14 }}>{ic}</span>{label}</button>
              ))}
            </div>
            {clubeSub === 'escritorio' && !agenciaOk ? (
              // 💼 escritório CLÁSSICO (saves antigos). Na Agência 2.0 a sub-aba não
              // existe (um clubeSub 'escritorio' herdado cai na Estrutura, logo abaixo).
              <EscritorioTab cards={(state.onlineMode === 'online' ? state.careerEmpresario?.[youId] : state.empresarioCards) ?? []} st={state.stadiums?.[youId]} hasFilial={state.onlineMode === 'online' ? !!state.careerFilials?.[youId] : !!state.careerFilial} />
            ) : clubeSub === 'financas' ? (
              <>
              <FinancasTab ledger={(state.onlineMode === 'online' ? state.careerLedgers?.[youId] : state.careerLedger) ?? []} caixa={state.careerCoins?.[youId] ?? 0} seasonNo={state.seasonNo ?? 1}
                squad={(state.managers[state.youIdx]?.squad ?? []) as WonCard[]} marketValues={state.marketValues ?? {}} />
              <BancoLegends />
              </>
            ) : (
          <>
            {/* 👕 Patrocínio: escolhe a marca (por divisão); rende no vira-temporada.
                Online: por técnico (careerSponsors[youId]). Offline: careerSponsor.
                🏗️ ESTRUTURA (Agência 2.0, ordem aprovada pelo Diego): o DESENHO do
                estádio continua a primeira coisa visível (sagrado) → patrocínio →
                agência. Então aqui o patrocínio só aparece ANTES no jogo clássico. */}
            {!agenciaOk && me && <SponsorCard div={me.div} chosen={state.onlineMode === 'online' ? state.careerSponsors?.[youId] : state.careerSponsor} onChoose={id => dispatch({ type: 'SET_SPONSOR', id, mgrId: youId })} />}
            <StadiumTab st={state.stadiums?.[youId]} coins={state.careerCoins?.[youId] ?? 0} medicoOn={!!state.agenciaOn}
              onInvest={sec => dispatch({ type: 'STADIUM_INVEST', mgrId: youId, sector: sec })}
              onBuild={e => dispatch({ type: 'STADIUM_BUILD', mgrId: youId, ext: e })}
              filial={myFilial}
              filialOptions={(() => {
                // 🏢 só dá pra comprar clube que VAI FICAR na Série D: tira os 4
                // primeiros (zona de acesso — estão subindo pra Série C). Sem isso,
                // dava pra comprar um time prestes a subir e ganhar divisão de graça.
                // No online, tira também os clubes que OUTRO humano já tem de SAF.
                const fica = sortDiv(tables.D).slice(4)
                const taken = state.onlineMode === 'online' ? new Set(Object.values(state.careerFilials ?? {}).map(f => f?.team)) : new Set<string | undefined>()
                return fica.filter(t => !t.you && !t.human && !t.rival).map(t => t.name).filter(t => !state.careerRivals.some(r => r.team === t) && !taken.has(t))
              })()}
              filialInfo={(() => {
                const fn = myFilial?.team
                if (!fn) return null
                for (const d of DIVS) { const i = tables[d].findIndex(t => t.name === fn); if (i >= 0) return { div: d, pos: i + 1 } }
                return null
              })()}
              onBuyFilial={team => dispatch({ type: 'BUY_FILIAL', team, mgrId: youId })}
              onSellFilial={() => dispatch({ type: 'SELL_FILIAL', mgrId: youId })}
              filialSale={myFilial ? filialSaleValue(state, myFilial) : undefined}
              mySquad={state.managers[state.youIdx]?.squad}
              filialSquad={myFilial ? (state.cpuSquads?.[myFilial.team] as WonCard[] | undefined) : undefined}
              loanableOutIds={(() => {
                const sq = state.managers[state.youIdx]?.squad ?? []
                const fm = FORMATIONS[state.managers[state.youIdx]?.formation ?? '4-3-3']
                return new Set(sq.filter(c => !c.emprestado && sq.filter(x => x.pos === c.pos && !x.fake).length - 1 >= fm[c.pos]).map(c => c.id))
              })()}
              loanableInIds={(() => {
                const safSq = (myFilial ? (state.cpuSquads?.[myFilial.team] as WonCard[] | undefined) : undefined) ?? []
                const fm = FORMATIONS['4-3-3']
                return new Set(safSq.filter(c => !c.emprestado && safSq.filter(x => x.pos === c.pos && !x.fake).length - 1 >= fm[c.pos]).map(c => c.id))
              })()}
              onLoanTo={cardId => dispatch({ type: 'LOAN_TO_FILIAL', cardId, mgrId: youId })}
              onLoanFrom={cardId => dispatch({ type: 'LOAN_FROM_FILIAL', cardId, mgrId: youId })}
              onReturnLoan={cardId => dispatch({ type: 'RETURN_FILIAL_LOAN', cardId, mgrId: youId })}
              trimNotice={state.filialTrimNotice}
              onDismissTrimNotice={() => dispatch({ type: 'CLEAR_FILIAL_TRIM_NOTICE' })}
              loanSlots={/* mesma fonte de divisão da REGRA (colocação gravada; tabela ao vivo
                como reserva) — se divergirem, o botão prometia 2 e o clique não fazia nada */
                filialSlots(state.careerPlacements?.[`m${youId}`] ?? me?.div ?? 'D')} />
            {/* 🏗️ ESTRUTURA (Agência 2.0): patrocínio DEPOIS do estádio, e a escada
                da agência fecha a página (caixa escura — não confunde com a obra) */}
            {agenciaOk && me && <SponsorCard div={me.div} chosen={state.onlineMode === 'online' ? state.careerSponsors?.[youId] : state.careerSponsor} onChoose={id => dispatch({ type: 'SET_SPONSOR', id, mgrId: youId })} />}
            {agenciaOk && <AgenciaDesbloqueios st={agenciaEstadio(state)} hasFilial={!!state.careerFilial}
              onVerAgenciados={() => { setTab('elenco'); setElencoSub('agencia') }} />}
            {/* 🏛️ MULTICLUBES · SELETOR LIVRE (Opção B): troca de clube a qualquer hora,
                fora do leilão (outra tela) e de jogo/Copa rolando. Só testers, só solo. */}
            {state.onlineMode !== 'online' && state.multiClube && (() => {
              const ativo = state.managers[state.youIdx]?.teamName ?? '—'
              const dormindo = state.multiClube.team
              return (
                <div style={{ ...box('#0C0C0C'), padding: 12, color: '#fff', marginBottom: 10 }}>
                  <p style={{ fontWeight: 900, fontSize: 12.5, color: GOLD, ...OSWALD, margin: '0 0 7px' }}>🏛️ MULTICLUBES — quem você comanda?</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, border: '2px solid #000', borderRadius: 9, padding: '6px 8px', background: GOLD, color: '#000', fontWeight: 900, fontSize: 11, textAlign: 'center', ...OSWALD }}>🟡 {ativo}<div style={{ fontSize: 8, fontWeight: 800 }}>no comando ✓</div></div>
                    <div style={{ flex: 1, border: '2px solid #000', borderRadius: 9, padding: '6px 8px', background: '#3a3a3a', color: 'rgba(255,255,255,.7)', fontWeight: 900, fontSize: 11, textAlign: 'center', ...OSWALD }}>⚪ {dormindo}<div style={{ fontSize: 8, fontWeight: 800 }}>dormindo 💤</div></div>
                  </div>
                  {multiTravada
                    ? <div style={{ marginTop: 8, border: '2.5px solid #000', borderRadius: 10, padding: 9, fontWeight: 900, fontSize: 11, background: '#4a4740', color: 'rgba(255,255,255,.9)', textAlign: 'center', ...OSWALD }}>
                        {multiPending ? '🔄 Vou parar no fim desta rodada pra você trocar…' : `🔒 ${copaPlaying ? 'Deixe a Copa acabar' : 'Deixe a rodada acabar'} pra trocar de clube`}
                        {!multiPending && !manual && !copaPlaying && <button onClick={() => setMultiPending(true)} style={{ display: 'block', width: '100%', marginTop: 6, border: '2px solid #000', borderRadius: 8, padding: 6, fontWeight: 900, fontSize: 10.5, background: GOLD, color: '#000', cursor: 'pointer', ...OSWALD }}>🔄 Trocar no fim desta rodada</button>}
                      </div>
                    : <button onClick={() => setMultiAsk(true)} style={{ width: '100%', marginTop: 8, border: '2.5px solid #000', borderRadius: 10, padding: 10, fontWeight: 900, fontSize: 12.5, background: '#fff', color: '#000', cursor: 'pointer', ...OSWALD }}>🔄 Passar o comando pro {dormindo}</button>}
                  <p style={{ fontFamily: 'system-ui', fontSize: 9, color: 'rgba(255,255,255,.5)', margin: '7px 0 0', textAlign: 'center', lineHeight: 1.4 }}>Cada clube tem o <b>seu</b> caixa, elenco, títulos e estádio — nada se mistura. O que dorme segue a temporada no automático, com o time como está.</p>
                </div>
              )
            })()}
            {/* modal de CONFIRMAR a troca (explicação completa) */}
            {multiAsk && state.multiClube && (() => {
              const dormindo = state.multiClube.team
              const ativo = state.managers[state.youIdx]?.teamName ?? '—'
              return (
                <div onClick={() => setMultiAsk(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(8,6,3,.66)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                  <div onClick={e => e.stopPropagation()} style={{ ...box('#F4ECD6'), maxWidth: 340, width: '100%', padding: 16, textAlign: 'center' }}>
                    <p style={{ ...OSWALD, fontWeight: 900, fontSize: 17, margin: 0 }}>🔄 Trocar de clube</p>
                    <p style={{ fontFamily: 'system-ui', fontSize: 12.5, fontWeight: 600, color: '#3a3222', margin: '8px 0 0', lineHeight: 1.5 }}>Você vai comandar o <b>{dormindo}</b> agora. O <b>{ativo}</b> passa a <b>dormir</b>: segue a temporada no automático, com o time como está.</p>
                    <p style={{ fontFamily: 'system-ui', fontSize: 11.5, fontWeight: 600, color: '#5a5647', margin: '8px 0 0', lineHeight: 1.45 }}>💤 Na <b>virada da temporada</b>, empréstimo que acaba volta pro dono e o titular do próprio clube entra no lugar — nunca joga com 10. Dá pra voltar pro comando dele quando quiser.</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button onClick={() => setMultiAsk(false)} style={{ flex: 1, border: '3px solid #000', borderRadius: 12, padding: 11, fontWeight: 900, fontSize: 13, background: '#fff', color: '#000', cursor: 'pointer', ...OSWALD }}>Voltar</button>
                      <button onClick={() => { setMultiAsk(false); dispatch({ type: 'SWITCH_MULTICLUBE' }) }} style={{ flex: 1, border: '3px solid #000', borderRadius: 12, padding: 11, fontWeight: 900, fontSize: 13, background: '#1B7A3D', color: '#fff', cursor: 'pointer', ...OSWALD }}>🔄 Trocar</button>
                    </div>
                  </div>
                </div>
              )
            })()}
            {/* 🏛️ MULTICLUBES (Fase 1 — a compra) · em construção, só testers veem · só solo */}
            {state.onlineMode !== 'online' && (() => {
              const opcoes = (() => {
                const safName = myFilial?.team
                // 🏛️ IGUAL À SAF: a lista vem de `tables.D` (a Série D DE VERDADE, exista
                // você na divisão que existir) — por isso dá pra comprar de qualquer
                // divisão, não só quando você está na D. Tira os 4 que estão subindo
                // (pega quem FICA/joga a Série D), você/humanos/rivais, a SAF e o que já
                // é seu 2º clube. O motor da compra aceita exatamente esses.
                const fica = sortDiv(tables.D).slice(4)
                return fica
                  .filter(t => !t.you && !t.human && !t.rival)
                  .map(t => t.name)
                  .filter(t => t !== safName && t !== state.multiClube?.team && !state.careerRivals.some(r => r.team === t))
              })()
              return <MultiClubeBuy jaTem={state.multiClube?.team} opcoes={opcoes}
                coins={state.careerCoins?.[youId] ?? 0} preco={4000} isLenda={myApoioPerk()?.tier === 'ouro'}
                onBuy={team => dispatch({ type: 'BUY_MULTICLUBE', team })} />
            })()}
            <GoldTeaser label="Ver o estádio DOURADO completo (prévia)">
              <div style={{ ...box('#FBF6E9'), padding: 12, position: 'relative' }}>
                <StadiumSvg st={{ inv: { geral: 60, cadeiras: 90, visitante: 120, camarote: 150 }, ext: ['refl', 'telao', 'loja', 'estac', 'grama', 'cober'] }} perkOverride={APOIO_PERKS.ouro} />
              </div>
            </GoldTeaser>
            {/* 🏦 BANCO LEGENDS fechando a Estrutura (ideia do Diego 04/08): é AQUI
                que o técnico acabou de ver o preço das obras/SAF e pensa "queria
                moedas" — o banco aparece na hora certa. Também segue em Finanças.
                (O componente já se esconde sozinho no online.) */}
            <BancoLegends />
          </>
            )}
          </>
        ) : tab === 'ranking' ? (
          <>
            {/* sub-abas do Rank: Clubes | Artilheiros (temporada + todos os tempos) */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {([['arti', '⚽', 'Artilheiros'], ['clubes', '🥇', 'Clubes']] as [typeof rankSub, string, string][]).map(([s, ic, label]) => (
                <button key={s} onClick={() => setRankSub(s)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '8px 2px', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', background: rankSub === s ? GOLD : '#fff', color: INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, ...OSWALD }}><span style={{ fontSize: 14 }}>{ic}</span>{label}</button>
              ))}
            </div>
            {rankSub === 'clubes' ? (
              <RankingTab tables={tables} honors={(state.careerHonors ?? {}) as Record<string, Honors>} copaHonors={state.careerCopaHonors ?? {}} coins={state.careerCoins ?? {}} clubCash={state.clubCash ?? {}} colors={colors} youId={youId} seasonNo={state.seasonNo} myDiv={myDiv} safTeam={safTeamName} seed={state.seed} />
            ) : (
              <>
                {/* durante a Copa (fim de temporada), a artilharia da COPA entra no
                    lugar da artilharia das divisões; o "todos os tempos" fica embaixo. */}
                {done && copa && copaScorersShown.length > 0
                  ? <ArtilhariaBox scorers={copaScorersShown} colors={colors} safTeam={safTeamName} safCol={safTeamName ? myCol : undefined} title="🏆 ARTILHARIA · COPA LEGENDS" sub={copaFinished ? 'Gols do mata-mata da Copa — top 20.' : `Gols até ${copaRound === 0 ? 'agora' : copa.rounds[copaRound - 1].name} — atualiza a cada fase.`} foot="🏅 O artilheiro da Copa rende +16 ao clube e sobe +16 no piso do jogador." />
                  : <ArtilhariaByDiv scorers={scorersAll} colors={colors} safTeam={safTeamName} safCol={safTeamName ? myCol : undefined} title="⚽ ARTILHARIA · TEMPORADA" sub="Gols da temporada atual — top 5 de cada série." foot="🏅 O artilheiro de cada série rende ao clube e vira piso do jogador: Série D +4 · C +8 · B +12 · A +16." />}
                <ArtilhariaBox scorers={allTimeScorers} colors={colors} safTeam={safTeamName} title="🏆 ARTILHARIA · TODOS OS TEMPOS" sub="Gols somados de todas as temporadas da sala — top 20." foot={allTimeScorers.length === 0 ? 'Começa a contar a partir de agora.' : undefined} />
              </>
            )}
          </>
        ) : tab === 'elenco' ? (
          <>
            {/* 🕴️ AGÊNCIA 2.0: sub-abas Elenco | Agenciados (só carreira nova) */}
            {state.agenciaOn && agLib && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {(([['elenco', '👥', 'Elenco'], ['agencia', '🕴️', 'Agenciados']]) as [typeof elencoSub, string, string][]).map(([sb, ic, label]) => (
                  <button key={sb} onClick={() => setElencoSub(sb)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '8px 2px', fontWeight: 900, fontSize: 10.5, textTransform: 'uppercase', background: elencoSub === sb ? myCol.solid : '#fff', color: elencoSub === sb ? '#fff' : INK, boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, ...OSWALD }}><span style={{ fontSize: 14 }}>{ic}</span>{label}</button>
                ))}
              </div>
            )}
            {state.agenciaOn && agLib && elencoSub === 'agencia' ? (
              <AgenciadosTab cards={state.agenciados ?? []}
                pool={(() => {
                  const seen = new Set<string>(); const out: AgCard[] = []
                  for (const c of [...(state.empresarioCards ?? []), ...(state.multiClube?.empresario ?? [])]) {
                    const k = `${c.name}|${c.club}|${c.year}`
                    if (seen.has(k)) continue
                    seen.add(k)
                    out.push({ name: c.name, club: c.club, year: c.year, pos: c.pos, fame: c.fame, folk: c.folk || undefined, promessa: c.promessa || undefined })
                  }
                  return out.sort((a, b) => (b.fame - a.fame) || a.name.localeCompare(b.name))
                })()}
                hist={state.agenciaHist} fatura={state.agenciaFatura}
                st={agenciaEstadio(state)} hasFilial={!!state.careerFilial}
                primeiroClube={state.managers.find(m => m.id === (state.agenciaClubeId ?? youId))?.teamName ?? 'seu 1º clube'}
                clubes={state.multiClube ? [
                  { id: youId, nome: state.managers[state.youIdx]?.teamName ?? '', dorme: false },
                  { id: state.multiClube.id, nome: state.multiClube.team, dorme: true },
                ] : undefined}
                destinoId={state.agenciaClubeId ?? youId} dividir={!!state.agenciaDividir}
                onSetDestino={(id, dividir) => dispatch({ type: 'SET_AGENCIA_CLUBE', mgrId: id, dividir })}
                onSet={cards => dispatch({ type: 'SET_AGENCIA', cards })} />
            ) : (
            <>
            {/* tática do SEU time — POR JOGO, vale do PRÓXIMO jogo em diante. Agora
                fica AQUI no topo do elenco (era na aba Jogos). */}
            {!done && (
              <>
                {/* botões de tática MENORES que as abas do menu (pra não confundir) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 6 }}>
                  {([['retranca', '🧱 Retranca'], ['equilibrio', '⚖️ Equilíbrio'], ['ataque', '🔥 Ataque']] as [Tac, string][]).map(([t, label]) => (
                    <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', mgrId: youId, tactic: t })}
                      style={{ border: `2px solid ${INK}`, borderRadius: 9, padding: '5px 0', fontWeight: 800, fontSize: 10.5, ...OSWALD, background: myTactic === t ? GOLD : '#fff', color: INK, boxShadow: myTactic === t ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: '#5a5647', textAlign: 'center', marginBottom: 10 }}><b>Tática e substituições</b> valem do <b>próximo jogo</b> em diante — o jogo que está rolando não muda. Ataque faz e toma mais · retranca segura mais · equilíbrio no meio.</p>
              </>
            )}
            <SquadTab mgr={state.managers[state.youIdx]} col={myCol} coins={state.careerCoins?.[youId] ?? 0} xiIds={myXIids} xi={myXI as WonCard[]} goals={goalsByCard} onSwap={canSub ? onTapPlayer : undefined} selId={selId} seasonNo={state.seasonNo} contratosOn={!!state.contratosOn} onSetFormation={f => dispatch({ type: 'CHANGE_FORMATION', formation: f, mgrId: youId })} />
            {me && (
              <ShareElencoBtn mgr={state.managers[state.youIdx]} col={myCol} xi={myXI as WonCard[]} xiIds={myXIids}
                goals={goalsByCard} divName={DIV_NAME[me.div]} tablePos={me.pos} seasonNo={state.seasonNo}
                coins={state.careerCoins?.[youId] ?? 0}
                titles={(() => { const h = state.careerHonors?.['m' + youId]; return h ? h.A + h.B + h.C + h.D : 0 })()} />
            )}
            <GoldTeaser label="Ver MEU elenco DOURADO (prévia)">
              <div style={{ maxHeight: 400, overflow: 'hidden', borderRadius: 16, position: 'relative' }}>
                <SquadTab mgr={state.managers[state.youIdx]} col={{ solid: '#C9A227', light: '#F6E9C0' }} coins={state.careerCoins?.[youId] ?? 0} xiIds={myXIids} xi={myXI as WonCard[]} goals={goalsByCard} seasonNo={state.seasonNo} contratosOn={!!state.contratosOn} perkOverride={APOIO_PERKS.ouro} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, background: 'linear-gradient(180deg,transparent,#F4ECD6)', pointerEvents: 'none', zIndex: 2 }} />
              </div>
            </GoldTeaser>
            </>
            )}
          </>
        ) : tab === 'jogos' && hasMatches ? (
          copaPlaying && copaFase ? (
            /* Durante a COPA: SEU jogo já está no placar em cima das abas. Aqui na
               aba Jogos ficam os OUTROS jogos da fase, rolando junto (mesmo relógio),
               como os jogos das outras divisões apareciam na liga. */
            <>
              <p style={{ fontWeight: 900, fontSize: 11, ...OSWALD, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(0,0,0,.5)', margin: '2px 0 7px' }}>🏆 Copa · {copaFaseName} · {copaNLegs === 1 ? 'jogo único' : 'ida e volta'}</p>
              {otherCopaTies.map((t, i) => <CopaLiveMatch key={i} tie={t} pos={copaPos} colors={colors} safName={safTeamName} />)}
            </>
          ) : (
          <>
            {done && myMatch && me && <MyMatchCard m={myMatch} youName={me.team} finished col={myCol} colors={colors} roundKey={round} />}
            {(() => { // FRASES COM EMOÇÃO (uma linha rotativa): clássico, artilheiro, zuação, queda, liderança
              if (!me) return null
              const RED = '#E8503A', PURPLE = '#6C43C0'
              const flavors: Flavor[] = []
              const nm = (id: number, name: string) => <span style={{ color: colors[id]?.solid ?? INK, fontWeight: 900 }}>{name}</span>
              const table = tables[me.div] ?? []
              const myIdx = table.findIndex(x => x.you)
              const myRank = DIVS.indexOf(me.div) // 0=A (topo) … 3=D
              // VARIA a redação pela rodada — mesma situação, frases diferentes,
              // pra ninguém ler a mesma linha 38 rodadas seguidas.
              const vary = <T,>(...opts: T[]): T => opts[round % opts.length]
              // 1) CLÁSSICO: sua partida é contra outro humano
              if (myMatch) {
                const oppName = myMatch.h === me.team ? myMatch.a : myMatch.h
                const opp = table.find(x => x.name === oppName)
                if (opp?.human) flavors.push({ c: RED, ic: '⚔️', tag: 'CLÁSSICO', node: <>Você x {nm(opp.teamId, oppName)} nesta rodada — não pode perder!</> })
              }
              // 2) ARTILHEIRO do seu time (arrebentando) — usa a lista COMPLETA
              //    (scorersAll), não o top-20 geral, senão os gols "somem" do corte.
              const mineTop = scorersAll.filter(s => s.teamId === youId).sort((a, b) => b.goals - a.goals)[0]
              if (mineTop && mineTop.goals >= 3) {
                const leagueTop = scorersAll.filter(s => s.div === me.div).sort((a, b) => b.goals - a.goals)[0]
                flavors.push(leagueTop?.name === mineTop.name
                  ? { c: GREEN, ic: '👑', tag: 'ARTILHEIRO', node: vary(
                      <><b>{mineTop.name}</b> é o artilheiro da {DIV_NAME[me.div]} — {mineTop.goals} gols!</>,
                      <>Ninguém segura: <b>{mineTop.name}</b> lidera a artilharia da {DIV_NAME[me.div]} com {mineTop.goals}!</>,
                      <>{mineTop.goals} gols do <b>{mineTop.name}</b> — a artilharia da {DIV_NAME[me.div]} tem dono!</>) }
                  : { c: GREEN, ic: '⚽', tag: 'EM ALTA', node: vary(
                      <><b>{mineTop.name}</b> tá voando: {mineTop.goals} gols pelo seu time!</>,
                      <>Fase iluminada do <b>{mineTop.name}</b> — já são {mineTop.goals} na temporada!</>,
                      <>Pode confiar: <b>{mineTop.name}</b> soma {mineTop.goals} gols e segue faminto!</>) })
              }
              // 2b) REFORÇOS: como vão suas contratações (leilão de reservas/mercado).
              //     Gols EXATOS por carta (goalsByCard) — nada de cobrar quem tá
              //     marcando. Elogia quem rende; a cobrança só pra MEI/ATA sem gol
              //     (zagueiro não é obrigado a marcar), só de vez em quando.
              const signings = (mgrMe?.squad ?? []).filter(c => (c as WonCard).reforco && !c.fake)
              if (signings.length) {
                const goalsOf = (c: PoolCard) => goalsByCard[c.id] ?? 0
                const best = signings.map(c => ({ c, g: goalsOf(c) })).sort((a, b) => b.g - a.g)[0]
                if (best && best.g >= 2) flavors.push({ c: GREEN, ic: '💸', tag: 'REFORÇO', node: vary(
                  <>Contratação <b>{best.c.name}</b> já fez {best.g} gols — dinheiro bem gasto!</>,
                  <><b>{best.c.name}</b> caiu como uma luva: {best.g} gols desde que chegou!</>,
                  <>O reforço <b>{best.c.name}</b> tá pagando o investimento — {best.g} gols!</>) })
                else if (round >= 10 && round % 3 === 0) {
                  const flop = signings.filter(c => goalsOf(c) === 0 && (c.pos === 'ATA' || c.pos === 'MEI')).sort((a, b) => ((b as WonCard).paid ?? 0) - ((a as WonCard).paid ?? 0))[0]
                  if (flop) flavors.push({ c: GOLD, ic: '👀', tag: 'REFORÇO', node: vary(
                    <>Contratação <b>{flop.name}</b> custou 💰{(flop as WonCard).paid} e ainda não desencantou…</>,
                    <>A torcida cobra: <b>{flop.name}</b> (💰{(flop as WonCard).paid}) segue sem marcar…</>,
                    <>Cadê o <b>{flop.name}</b>? 💰{(flop as WonCard).paid} investidos e o gol não sai…</>) })
                }
              }
              // 3) ZUAÇÃO de divisão: amigo numa série mais baixa (ou mais alta)
              const friends = state.managers.filter(m => m.isHuman && m.id !== youId)
                .map(m => { for (const d of DIVS) { const idx = tables[d].findIndex(x => x.teamId === m.id); if (idx >= 0) return { name: tables[d][idx].name, div: d, id: m.id, pos: idx + 1 } } return null })
                .filter((x): x is { name: string; div: Div; id: number; pos: number } => !!x)
              const below = friends.filter(f => DIVS.indexOf(f.div) > myRank).sort((a, b) => DIVS.indexOf(b.div) - DIVS.indexOf(a.div))[0]
              const above = friends.filter(f => DIVS.indexOf(f.div) < myRank).sort((a, b) => DIVS.indexOf(a.div) - DIVS.indexOf(b.div))[0]
              if (below) flavors.push({ c: PURPLE, ic: '😎', tag: 'ZUAÇÃO', node: <>Você na <b>{DIV_NAME[me.div]}</b> e o {nm(below.id, below.name)} lá na {DIV_NAME[below.div]} 👇</> })
              else if (above) flavors.push({ c: PURPLE, ic: '👀', tag: 'ZUAÇÃO', node: <>O {nm(above.id, above.name)} tá na <b>{DIV_NAME[above.div]}</b> — bora subir e alcançar!</> })
              // 3b) ZUAÇÃO: amigo afundando na zona de queda (últimos 4) da divisão dele
              const falling = friends.find(f => f.pos >= 17 && f.div !== 'D')
              if (falling) flavors.push({ c: PURPLE, ic: '📉', tag: 'ZUAÇÃO', node: <>O {nm(falling.id, falling.name)} tá afundando na zona de queda da {DIV_NAME[falling.div]}… 👋</> })
              // 4) QUEDA: você na zona de rebaixamento (últimos 4)
              if (myIdx >= 16 && me.div !== 'D') flavors.push({ c: RED, ic: '🚨', tag: 'PERIGO', node: vary(
                <>Você tá na zona de queda da {DIV_NAME[me.div]} — reage!</>,
                <>Alerta vermelho: Z4 da {DIV_NAME[me.div]}. Bora sair dessa!</>,
                <>A corda apertou na {DIV_NAME[me.div]} — cada ponto agora vale ouro!</>) })
              // 5) VIZINHO na tabela (liderança / perseguição) — sempre tem
              if (myIdx >= 0) {
                const rival = myIdx > 0 ? table[myIdx - 1] : table[myIdx + 1]
                if (rival) {
                  const gap = Math.abs(table[myIdx].pts - rival.pts); const pts = gap === 1 ? 'ponto' : 'pontos'
                  const tied = gap === 0 // mesmo nº de pontos — quem está acima leva no saldo
                  flavors.push(
                    myIdx === 0
                      // LÍDER: o rival (table[1]) está logo ABAIXO de você
                      ? (tied
                          ? { c: GOLD, ic: '🔥', tag: 'LÍDER', node: vary(
                              <>Você lidera no saldo! {nm(rival.teamId, rival.name)} empatou em pontos — não vacila.</>,
                              <>Liderança por um fio: {nm(rival.teamId, rival.name)} igualou os pontos, o saldo te segura!</>) }
                          : { c: GOLD, ic: '🔥', tag: 'LÍDER', node: vary(
                              <>Você é o líder! {nm(rival.teamId, rival.name)} cola {gap} {pts} atrás.</>,
                              <>Ponteiro! Mas {nm(rival.teamId, rival.name)} vem a {gap} {pts} — segura a coroa.</>,
                              <>Topo da tabela é seu — {nm(rival.teamId, rival.name)} sonha a {gap} {pts}.</>) })
                      // você NÃO é líder: o rival (table[myIdx-1]) está logo ACIMA, na sua frente
                      : tied
                        ? { c: GOLD, ic: '😤', tag: 'NA COLA', node: vary(
                            <>Você e {nm(rival.teamId, rival.name)} empatados em pontos — o saldo decide!</>,
                            <>Mesmos pontos que {nm(rival.teamId, rival.name)} — agora é no detalhe!</>) }
                        : gap <= 2
                          ? { c: GOLD, ic: '😤', tag: 'NA COLA', node: vary(
                              <>{nm(rival.teamId, rival.name)} tá só {gap} {pts} na sua frente. Vai deixar?</>,
                              <>Falta pouco: {gap} {pts} pra passar o {nm(rival.teamId, rival.name)}!</>,
                              <>O {nm(rival.teamId, rival.name)} já sente o teu bafo — {gap} {pts} de diferença.</>) }
                          : { c: GOLD, ic: '💪', tag: 'TABELA', node: vary(
                              <>{nm(rival.teamId, rival.name)} tá {gap} {pts} na sua frente — corre atrás!</>,
                              <>Meta da rodada: encostar no {nm(rival.teamId, rival.name)} ({gap} {pts}).</>,
                              <>Distância pro {nm(rival.teamId, rival.name)}: {gap} {pts}. Nada que uma boa sequência não resolva.</>) })
                }
              }
              return <RivalryTicker items={flavors} />
            })()}
            {ord.map(d => <DivMatches key={d} div={d} matches={matches[d]} colors={colors} humans={humansOf(d)} hideId={d === myDiv ? youId : undefined} reveal={revealed >= round} />)}
          </>
          )
        ) : done && copa && copa.rounds.length > 0 ? (
          <CopaBracket copa={copa} colors={colors} youId={youId} tables={tables} ord={ord} myDiv={myDiv} reveal={copaFinished ? nCopaRounds : copaRound} scorers={scorers} seasonNo={state.seasonNo} safTeam={safTeamName} safCol={safTeamName ? myCol : undefined} />
        ) : (
          <>
            <PyramidTables tables={tables} order={ord} colors={colors} myDiv={myDiv} final={done} safTeam={safTeamName} safCol={safTeamName ? myCol : undefined} />
            <PrizesBox />
          </>
        )}

        {state.onlineMode === 'online' ? (
          <button onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="text-black/40 text-xs font-semibold underline" style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', cursor: 'pointer', ...OSWALD }}>sair do jogo</button>
        ) : (
          <button
            onClick={() => { try { localStorage.setItem('esc-solo-career', JSON.stringify(state)); localStorage.setItem('esc-solo-career-at', String(Date.now())) } catch { /* cota cheia — ignora */ } savePyramidCloud(state, true); dispatch({ type: 'GO_LOBBY' }) }}
            style={{ width: '100%', marginTop: 16, border: `3px solid ${INK}`, borderRadius: 14, padding: '11px 13px', fontWeight: 900, fontSize: 14, background: '#fff', color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>
            🚪 Sair e salvar carreira
            <span style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: '#5a5647', marginTop: 2 }}>Fica guardada nos seus saves — é só voltar e continuar de onde parou.</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── TELA DE VENDA ("Listar pra leilão", 45s): antes da compra, cada um escolhe
// quem manda pro leilão. Nunca deixa a posição abaixo do XI (formação). Quem só
// tem 11 não lista nada — só aguarda. O host começa o leilão (ou vai sozinho no 0). ──
export function ReserveListScreen() {
  const { state, dispatch } = useEsc()
  const escLib = useEscadaLiberada() // 🪜 escada de categorias: por enquanto só a conta do Diego
  const mgr = state.managers[state.youIdx]
  const youId = mgr?.id ?? 0
  const listed = useMemo(() => new Set(state.reserveListed?.[youId] ?? []), [state.reserveListed, youId])
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(iv) }, [])
  const remaining = Math.max(0, Math.ceil(((state.phaseDeadline ?? 0) - now) / 1000))
  const humanIds = state.managers.filter(m => m.isHuman).map(m => m.id)
  const nameKey = state.managers.filter(m => m.isHuman).map(m => `${m.id}:${m.teamName}`).join('|')
  const colors = useMemo(() => {
    const perkById: Record<number, ApoioPerk | null> = {}
    for (const m of state.managers) if (m.isHuman) perkById[m.id] = perkFromSelo(m.teamName)
    return playerColors(humanIds, youId, state.seed, [], perkById)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [humanIds.join(','), youId, state.seed, nameKey])
  const col = colors[youId] ?? { solid: APOIO_PERKS.bege.solid, light: APOIO_PERKS.bege.light }
  const need = FORMATIONS[mgr?.formation ?? '4-3-3']
  // titulares/reservas = a SUA escalação REAL (com as trocas da temporada), não o
  // melhor-11 automático — o elenco tem que refletir o time em tempo real.
  const myXI = useMemo(() => lineupAt(state.careerLineup ?? {}, youId, state.round, mgr?.squad ?? [], mgr?.formation), [state.careerLineup, youId, state.round, mgr])
  const myXIids = useMemo(() => new Set(myXI.map(c => c.id)), [myXI])
  const marketUnlocked = state.seasonNo >= 3 // vender/negociar só libera na 3ª temporada
  const canList = (c: WonCard) => {
    if (!marketUnlocked || c.emprestado) return false // 🏢 jogador de empréstimo nunca é vendido — não é seu
    const listedInPos = [...listed].filter(id => mgr.squad.find(x => x.id === id)?.pos === c.pos).length
    // 🏢 conta SÓ os SEUS (emprestado volta na virada — não pode virar muleta pra vender demais)
    const filledPos = mgr.squad.filter(x => x.pos === c.pos && !x.emprestado).length
    return filledPos - listedInPos - 1 >= need[c.pos]
  }
  // host conduz: quando zera o tempo, abre o leilão (compra) sozinho
  useEffect(() => {
    if (state.isHost && remaining <= 0) dispatch({ type: 'RESERVE_AUCTION_ONLINE' })
  }, [remaining, state.isHost, dispatch])
  // 🛟 estado incompleto (sem "meu time" por um instante — troca de fase / sync):
  // mostra uma tela de espera em vez de renderizar EM BRANCO (mesma proteção do
  // leilão). O host já avança sozinho pro leilão quando o tempo zera (efeito
  // acima), então ninguém fica preso aqui.
  if (!mgr) return (
    <div className="palco" style={{ minHeight: '100vh', background: '#F4ECD6', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 40 }}>📋</p>
        <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD }}>Preparando o leilão de reservas…</p>
        <p style={{ fontWeight: 700, fontSize: 13, color: '#5a5647', marginTop: 4 }}>Só um instante.</p>
      </div>
    </div>
  )
  const nListed = state.reserveListed?.[youId]?.length ?? 0
  return (
    <div className="palco" style={{ minHeight: '100vh', background: '#F4ECD6', color: INK }}>
      <div className="max-w-xl mx-auto" style={{ padding: '16px 14px 48px' }}>
        <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>📋 LISTAR PRA LEILÃO · TEMP. {state.seasonNo}</span>
          <span style={{ fontWeight: 900, fontSize: 13, ...OSWALD, background: remaining <= 10 ? '#e8503a' : '#fff', color: remaining <= 10 ? '#fff' : INK, borderRadius: 8, padding: '2px 9px' }}>{remaining}s</span>
        </div>
        {/* 🚫 TRANSFER BAN: no vermelho, não dá pra comprar — só vender e pegar de graça */}
        {(state.careerCoins?.[youId] ?? 0) < 0 && (
          <div style={{ ...box('#C2452F'), padding: 11, marginBottom: 10, color: '#fff' }}>
            <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, margin: '0 0 2px' }}>🚫 Transfer ban — caixa no vermelho ({state.careerCoins?.[youId] ?? 0} 🪙)</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, margin: 0, lineHeight: 1.4, color: 'rgba(255,255,255,.92)' }}>Você não pode <b>comprar pagando</b> nesta janela — mas pode <b>vender pra fazer caixa</b> e, no <b>monte</b> (as sobras do leilão), <b>tentar a sorte pegando jogador de graça</b>. Prêmios e bilheteria vão te tirando do vermelho.</p>
          </div>
        )}
        {/* 📝 CONTRATOS — encerrados esperando decisão + aviso de último ano */}
        {(() => {
          // 🏛️ MULTICLUBES (Diego 04/08, mockup lado a lado aprovado): o clube
          // DORMINDO decide JUNTO aqui, em coluna própria 💤 — a renovação dele
          // sai da caixa DELE. Sem 2º clube, a janela fica exatamente como era.
          const dormM = state.multiClube ? state.managers.find(mm => mm.id === state.multiClube!.id) : undefined
          const expOf = (mm?: Manager) => mm ? (mm.squad as WonCard[]).filter(c => !c.fake && !c.emprestado && c.contratoAte != null && c.contratoAte < state.seasonNo) : []
          const sq = mgr.squad as WonCard[]
          const expirados = expOf(mgr)
          const expDorm = expOf(dormM)
          const ultimoAno = sq.filter(c => !c.fake && c.contratoAte === state.seasonNo)
          const uaDorm = dormM ? (dormM.squad as WonCard[]).filter(c => !c.fake && c.contratoAte === state.seasonNo) : []
          if (expirados.length + expDorm.length + ultimoAno.length + uaDorm.length === 0) return null
          const saldoDorm = dormM ? (state.careerCoins?.[dormM.id] ?? 0) : 0
          const coins = state.careerCoins?.[youId] ?? 0
          const primeira = state.seasonNo <= 6 // estreia do recurso: explica com mais calma
          const btn = (bg: string, fg: string, dis: boolean): React.CSSProperties => ({ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 4px', fontWeight: 900, fontSize: 10.5, ...OSWALD, background: dis ? '#d8cfb5' : bg, color: dis ? 'rgba(0,0,0,.4)' : fg, boxShadow: dis ? 'none' : `2px 2px 0 0 ${INK}`, cursor: dis ? 'not-allowed' : 'pointer', textTransform: 'uppercase' as const, lineHeight: 1.15 })
          return (
            <div style={{ ...box('#fff'), padding: '11px 12px', marginBottom: 10 }}>
              <p style={{ fontWeight: 900, fontSize: 13.5, ...OSWALD, margin: '0 0 3px' }}>{primeira ? '📝 CONTRATOS CHEGARAM!' : '⏳ CONTRATOS ENCERRANDO'}{expDorm.length > 0 ? ' — decida clube por clube' : ''}</p>
              {primeira && <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: '0 0 7px', lineHeight: 1.4 }}>Seu clube é profissional: <b>todo jogador tem contrato</b> (5 a 10 anos, sorteado na chegada). Quando encerra, você decide: <b>renovar ou deixar ir</b>.</p>}
              {(() => {
                // card de decisão de UM jogador; `empilha` = botões em pilha (modo 2 colunas)
                const decisao = (c: WonCard, dono: Manager, saldo: number, empilha: boolean) => {
                  const oficial = valorOficial(state, c)
                  const c10 = Math.max(1, Math.ceil(oficial * 0.9)) // 💰 10 anos = 90% (decisão do Diego)
                  const c5 = Math.max(1, Math.ceil(oficial / 2))
                  const solto = (state.contratoRelease ?? []).includes(c.id)
                  return (
                    <div key={c.id} style={{ border: `2.5px solid ${INK}`, borderRadius: 12, padding: '8px 9px', marginBottom: 8, background: '#FCFBF4', boxShadow: `2px 2px 0 0 ${INK}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                        <span style={{ fontWeight: 900, fontSize: 9.5, ...OSWALD, background: INK, color: '#fff', borderRadius: 5, padding: '1px 6px' }}>{c.pos}</span>
                        <span style={{ fontWeight: 900, fontSize: empilha ? 12.5 : 14, ...OSWALD, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        <span style={{ fontWeight: 900, fontSize: 10.5, ...OSWALD, color: '#5a5647', flex: 'none' }}>{empilha ? '' : 'valor '}{oficial} 🪙</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: empilha ? 'column' : 'row', gap: 6 }}>
                        <button onClick={() => dispatch({ type: 'RENEW_CONTRACT', mgrId: dono.id, cardId: c.id, anos: 10 })} disabled={solto} style={btn(GOLD, INK, solto)}>Renovar 10 anos{empilha ? ' · ' : <br />}{c10} 🪙 (-10%){saldo < c10 ? ' 💳' : ''}</button>
                        <button onClick={() => dispatch({ type: 'RENEW_CONTRACT', mgrId: dono.id, cardId: c.id, anos: 5 })} disabled={solto} style={btn('#EAF6EE', INK, solto)}>Renovar 5 anos{empilha ? ' · ' : <br />}{c5} 🪙{saldo < c5 ? ' 💳' : ''}</button>
                        <button onClick={() => dispatch({ type: 'RELEASE_CONTRACT', mgrId: dono.id, cardId: c.id })} style={btn(solto ? '#C2452F' : '#FDECEA', solto ? '#fff' : '#a23325', false)}>{solto ? '🌱 vai embora\u2028(desfazer)' : '😢 Deixar ir'}{empilha ? ' · ' : <br />}{solto ? 'cria assume se faltar' : 'vai pro leilão'}</button>
                      </div>
                    </div>
                  )
                }
                if (expDorm.length === 0 || !dormM) return <>{expirados.map(c => decisao(c, mgr, coins, false))}</>
                // 🏛️ modo 2 colunas (mockup lado a lado aprovado): ativo 🟡 × dormindo 💤
                const clubHead = (nome: string, dorme: boolean) => (
                  <div style={{ border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 8px', margin: '2px 0 7px', fontWeight: 900, fontSize: 11, ...OSWALD, background: dorme ? INK : GOLD, color: dorme ? '#fff' : INK, textTransform: 'uppercase' as const, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dorme ? '💤 ' : '🟡 '}{nome}</div>
                )
                return (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {clubHead(mgr.teamName, false)}
                      {expirados.length === 0
                        ? <p style={{ fontSize: 10, fontWeight: 700, color: '#5a5647', margin: 0, lineHeight: 1.4 }}>Nenhum contrato vencido aqui ✓</p>
                        : expirados.map(c => decisao(c, mgr, coins, true))}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {clubHead(dormM.teamName, true)}
                      {expDorm.map(c => decisao(c, dormM, saldoDorm, true))}
                      <p style={{ fontSize: 9.5, fontWeight: 700, color: '#5a5647', margin: 0, lineHeight: 1.4 }}>💰 Renovação sai da caixa <b>do {dormM.teamName}</b> ({saldoDorm} 🪙) — não da sua.</p>
                    </div>
                  </div>
                )
              })()}
              {(expirados.length > 0 || expDorm.length > 0) && (
                <p style={{ fontSize: 10, fontWeight: 700, color: '#5a5647', margin: '2px 0 0', lineHeight: 1.45 }}>
                  <b>😢 Deixar ir</b>: ele vai pro leilão (você recebe a venda <b>até o valor dele</b> — o que passar fica com a <b>família gananciosa</b> 😏) e, se faltar gente pro XI, um <b>🌱 Cria da Base</b> assume de graça (fraquinho, sem contrato, some quando chegar reforço). 💳 Sem caixa dá pra renovar MESMO ASSIM — entra no <b>cheque especial</b> (caixa negativa, transfer ban até sair do vermelho). ⚠️ <b>Avançou sem escolher?</b> Renova <b>AUTOMÁTICO por 5 anos (metade)</b>, com ou sem caixa — jogador só vai embora se VOCÊ mandar.{dormM ? <> 😤 <b>Vale pros DOIS clubes:</b> jogador que você soltar fica <b>magoado</b> — não joga por NENHUM clube seu até outro clube contratá-lo.</> : null}
                </p>
              )}
              {(ultimoAno.length > 0 || uaDorm.length > 0) && (
                <p style={{ fontSize: 10.5, fontWeight: 700, color: '#8a6d00', margin: (expirados.length + expDorm.length) ? '7px 0 0' : 0, lineHeight: 1.4 }}>⏳ <b>Último ano de contrato:</b> {[...ultimoAno.map(c => c.name), ...uaDorm.map(c => `${c.name} 💤`)].join(', ')} — encerra{(ultimoAno.length + uaDorm.length) > 1 ? 'm' : ''} no fim desta temporada. Quer garantir a grana cheia? <b>Venda antes de vencer.</b></p>
              )}
            </div>
          )
        })()}
        {/* 🪜 ESCADA DE CATEGORIAS (carreira nova, teste): a régua da SUA divisão */}
        {state.escadaOn && escLib && !state.escadaLivre && (() => {
          const d = (state.careerPlacements?.[`m${youId}`] ?? 'V') as 'A' | 'B' | 'C' | 'D' | 'V'
          const CATS: Record<string, string> = { V: '🪵 Foi Profissional + 🎯 Bom Jogador', D: '🎯 Bom Jogador + 💎 Promessa', C: '💎 Promessa + ⭐ Craque', B: '💎 Promessa + ⭐ Craque', A: '⭐ Craque + 👑 Lenda' }
          return (
            <div style={{ ...box('#FFF7DB'), padding: 11, marginBottom: 10 }}>
              <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, margin: '0 0 2px' }}>🪜 Mercado da {d === 'V' ? '🌱 Várzea' : `Série ${d}`}</p>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: 0, lineHeight: 1.45 }}>Nesta divisão o leilão só negocia <b>{CATS[d]}</b>. Subiu de série? O mercado sobe junto — categoria melhor entra no pregão.</p>
              {!state.escadaSubiu && <p style={{ fontSize: 10.5, fontWeight: 700, color: '#8a6d00', margin: '5px 0 0', lineHeight: 1.4 }}>🌱 Na Várzea o banco enche com essas categorias — <b>suba pra Série D</b> (vire profissional) e jogador melhor entra no pregão.</p>}
              {d === 'A' && <p style={{ fontSize: 10.5, fontWeight: 700, color: '#8a6d00', margin: '5px 0 0', lineHeight: 1.4 }}>👑 Elite! Complete <b>2 temporadas na Série A</b> ({state.escadaTempA ?? 0}/2) e o mercado <b>libera TODAS as categorias</b> de vez.</p>}
            </div>
          )
        })()}
        {/* aviso de desbloqueio da temporada */}
        {state.seasonNo === 2 && (
          <div style={{ ...box('#EAF3FF'), padding: 11, marginBottom: 10 }}>
            <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, margin: '0 0 2px', color: '#2563EB' }}>🔓 Desbloqueado: Reservas!</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: 0 }}>Agora você compra reservas pra encher o banco. A <b>venda/negociação de jogadores libera na 3ª temporada</b>.</p>
          </div>
        )}
        {state.seasonNo === 3 && (
          <div style={{ ...box('#EAF3FF'), padding: 11, marginBottom: 10 }}>
            <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, margin: '0 0 2px', color: GREEN }}>🔓 Desbloqueado: Leilão de transferências!</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: 0 }}>Agora você pode <b>listar jogadores pra leilão</b> (e disputá-los de volta).</p>
          </div>
        )}
        {marketUnlocked
          ? <p style={{ fontSize: 11.5, fontWeight: 700, color: '#5a5647', margin: '0 0 12px' }}>Toque nos jogadores que você quer <b>pôr no leilão</b>. Você pode disputá-los de volta. Nunca dá pra ficar com menos de 11 (o XI completo).</p>
          : <div style={{ ...box('#FDECEA'), padding: 11, marginBottom: 12 }}>
              <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, margin: '0 0 2px', color: '#c0392b' }}>🔒 Vender ainda não liberou</p>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: 0 }}>Nesta temporada você só <b>compra</b> reservas (a venda libera na 3ª). E, de todo jeito, pra vender você precisa de <b>reservas no banco</b> — nunca dá pra ficar com menos de 11. Como você tem 11, não teria quem listar mesmo. É só aguardar o host começar o leilão. 👇</p>
            </div>}
        {marketUnlocked && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 900, fontSize: 11.5, ...OSWALD, background: nListed ? '#C2452F' : 'rgba(0,0,0,0.06)', color: nListed ? '#fff' : INK, border: `2px solid ${INK}`, borderRadius: 8, padding: '3px 10px' }}>{nListed ? '🔴' : '📋'} {nListed} à venda</span>
          </div>
        )}
        {/* ⚠️ AVISO GRITANTE: listar = pôr à venda. Nunca some jogador calado. */}
        {marketUnlocked && nListed > 0 && (
          <div style={{ ...box('#C2452F'), padding: '10px 12px', marginBottom: 10, color: '#fff' }}>
            <p style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD, margin: '0 0 2px' }}>⚠️ {nListed} {nListed > 1 ? 'jogadores à VENDA' : 'jogador à VENDA'}</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, margin: 0, lineHeight: 1.4, color: 'rgba(255,255,255,.92)' }}>Se outro técnico cobrir o lance e você <b>não recomprar</b> no leilão, esse jogador <b>SAI do seu time de vez</b> (vira moedas). Só liste quem você topa <b>perder</b> — toque de novo pra tirar da lista.</p>
          </div>
        )}
        {/* 🔒 explica por que alguns jogadores aparecem travados (cinza): vendê-los
            deixaria o XI incompleto pra formação atual. Só aparece quando há algum. */}
        {marketUnlocked && mgr.squad.some(c => !c.fake && !c.emprestado && !listed.has(c.id) && !canList(c)) && (
          <EnsinoPilula k="travados" pill="🔒 tem jogador travado (por quê?)" seasonNo={state.seasonNo}>
            <div style={{ ...box('#FDECEA'), padding: '9px 11px', marginBottom: 10 }}>
              <p style={{ fontWeight: 900, fontSize: 11.5, ...OSWALD, margin: '0 0 2px', color: '#c0392b' }}>🔒 Não dá pra vender esses</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#5a5647', margin: 0, lineHeight: 1.4 }}>Seu time ficaria <b>sem jogador suficiente na posição</b>. Pra liberar: traga um substituto, ou <b>troque de formação</b> antes (aba Elenco).</p>
            </div>
          </EnsinoPilula>
        )}
        {/* mesmo layout da aba Elenco (Titulares/Reservas), mas em modo listagem */}
        <SquadTab mgr={mgr} col={col} coins={state.careerCoins?.[youId] ?? 0} xiIds={myXIids} xi={myXI as WonCard[]}
          list={{ listed, canList, onList: (id) => dispatch({ type: 'TOGGLE_RESERVE_LIST', mgrId: youId, cardId: id }) }} />
        {marketUnlocked && (
          <EnsinoPilula k="listar" pill="ℹ️ como funciona a venda" seasonNo={state.seasonNo}>
            <div style={{ ...box('#FFF3CF'), padding: '11px 13px', margin: '10px 0' }}>
              <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 4px', color: INK }}>💡 O que acontece ao listar</p>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#4a4740', margin: 0, lineHeight: 1.4 }}>
                Listar = pôr <b>à venda</b>. Vai a leilão e <b>você pode recomprar</b>. Se <b>não recomprar</b> e outro técnico levar, o jogador <b>SAI do seu time</b> — você fica só com as <b>moedas</b>. Se ninguém comprar, ele vai pro <b>monte valendo metade</b>.
              </p>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.45)', margin: '5px 0 0' }}>Obs.: a metade arredonda pra baixo — então só quem vale <b>1</b> (metade = 0,5) cai pra <b>0</b>.</p>
            </div>
          </EnsinoPilula>
        )}
        {state.isHost ? (
          <button onClick={() => dispatch({ type: 'RESERVE_AUCTION_ONLINE' })}
            style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>
            ▶️ Começar o leilão ({remaining}s)
          </button>
        ) : (
          <div style={{ ...box('#EAF3FF'), padding: 11, textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 12, color: '#3a5a8a', margin: 0 }}>⏱️ Liste quem quiser. O host começa o leilão em {remaining}s.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export { DIV_LABEL, GREEN, INK, GOLD, OSWALD, box }
