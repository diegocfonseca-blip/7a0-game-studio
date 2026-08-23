// ─── 🌍 COPA DO MUNDO LEGENDS (v1 · carreira SOLO) ───────────────────────────
// O endgame dos veteranos: desbloqueia na TEMPORADA 100, rola de 10 em 10.
// Vaga e ordem de escolha = TOP 24 do RANKING DE CLUBES (o mural do Rank).
// Dentro da seleção NÃO tem leilão: é CONVOCAÇÃO pura — TODAS as cartas do país
// aparecem (sem categoria na tela!) e o técnico escolhe SÓ 11.
// Formato: 4 grupos ida-e-volta (desempate vitórias > saldo) → sorteio → quartas
// e semi ida-e-volta → FINAL ÚNICA. Prêmio: ⭐ eterna + mural.
// ⚠️ SEGURANÇA: tudo roda LOCAL neste arquivo. Nada entra no reducer/estado do
// jogo — persistência própria em localStorage (llcopa:<seed>). Reverter = tirar
// o <CopaMundoGate> do fim de temporada.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from './data'
import { paisDe, rankingSelecoes, type Baralho } from './paises'
// placar AO VIVO oficial (relógio 0→90', GOOOL, bump) + pênaltis com suspense —
// os MESMOS componentes da liga/copa da carreira. Import circular com
// pyramidseason é seguro: são function declarations usadas só no render.
import { LiveScoreCard, PensShootout, pensRevealDelay, type ScoreGoal, copaSideColor, _inkFor, copaCenterChip, type CopaFill } from './pyramidseason'
// controles de ritmo OFICIAIS (mesmos da liga/copa): auto por padrão, Manual
// (🐢/⚡ + pular + próxima fase) pra quem tem o tier — cadeado do APOIE pro resto.
import { SimControls, SpeedControls, useSimMode, QuickManualLock, CardCollectPrompt } from './screens'
import { useHasManual, stripEmoji } from './apoio'
import { resilientWrite } from './pending'
import { supabase } from '../lib/supabase'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const OSWALD = { fontFamily: "'Oswald','Arial Narrow',system-ui,sans-serif" } as const
const box = (bg: string) => ({ border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 0 ${INK}`, background: bg }) as const

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

const FLAG: Record<string, string> = {
  'Brasil': '🇧🇷', 'Argentina': '🇦🇷', 'França': '🇫🇷', 'Espanha': '🇪🇸',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Itália': '🇮🇹', 'Alemanha': '🇩🇪', 'Holanda': '🇳🇱',
  'Portugal': '🇵🇹', 'México': '🇲🇽', 'Colômbia': '🇨🇴', 'Uruguai': '🇺🇾',
  'Chile': '🇨🇱', 'Bélgica': '🇧🇪', 'EUA': '🇺🇸', 'Coreia do Sul': '🇰🇷', 'Paraguai': '🇵🇾',
  // 🚩 estas FALTAVAM (17/08): Japão, Camarões e Senegal entraram na Copa em
  // 02/08 e ficaram sem bandeira esse tempo todo — em 4 lugares o texto é
  // montado com crase, então saía a palavra "undefined" na tela (ex.: no placar
  // da rodada do grupo). As 4 últimas entraram na Copa de 24 (17/08).
  'Japão': '🇯🇵', 'Camarões': '🇨🇲', 'Senegal': '🇸🇳',
  'Croácia': '🇭🇷', 'Dinamarca': '🇩🇰', 'Peru': '🇵🇪', 'Equador': '🇪🇨',
}
// 🏳️ bandeira SEMPRE com rede: seleção sem bandeira cadastrada mostra a branca,
// nunca "undefined". Todo lugar que desenha bandeira passa por aqui.
const flagOf = (pais: string): string => FLAG[pais] ?? '🏳️'
// 🎨 COR REAL de cada seleção (pedido do Diego 11/08: "tipo França azul
// vermelho e branco, Japão vermelho e branco" — a cor mais icônica do manto
// de cada país, não mais um hash genérico). Usada nos jogos e nas tabelas.
const PAIS_COLORS: Record<string, string> = {
  'Brasil': '#FFDF00', 'Argentina': '#75AADB', 'França': '#002395', 'Espanha': '#C60B1E',
  'Inglaterra': '#C8102E', 'Itália': '#0066CC', 'Alemanha': '#0a0a0a', 'Holanda': '#F36C21',
  'Portugal': '#C8102E', 'México': '#006341', 'Colômbia': '#FCD116', 'Uruguai': '#6CACE4',
  'Chile': '#D52B1E', 'Bélgica': '#ED2939', 'EUA': '#002868', 'Coreia do Sul': '#C60C30', 'Paraguai': '#D52B1E',
  // 🎨 mesmas 7 que faltavam na bandeira — sem isso caíam num tom sorteado por
  // hash (copaSideColor), em vez da cor de verdade do manto.
  'Japão': '#BC002D', 'Camarões': '#007A5E', 'Senegal': '#00853F',
  'Croácia': '#E8112D', 'Dinamarca': '#C60C30', 'Peru': '#D91023', 'Equador': '#FFDD00',
}
const paisColor = (pais: string): string => PAIS_COLORS[pais] ?? copaSideColor(pais)

type Sec = 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA'
const SECS: Sec[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
type PoolCard = { name: string; club: string; year: number; fame: number; lo: number; hi: number; sec: Sec }
type Formation = '4-3-3' | '4-4-2'
const NEED: Record<Formation, Record<Sec, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}
const SEC_LABEL: Record<Sec, string> = { GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meias', ATA: 'Atacantes' }
// singular pros avisos ("já convocou 1 goleiro" — 'Laterais' não vira 'lateral' sozinho)
const SEC_UM: Record<Sec, string> = { GOL: 'goleiro', LAT: 'lateral', ZAG: 'zagueiro', MEI: 'meia', ATA: 'atacante' }

// pool COMPLETO da seleção: TODAS as cartas do país nos 3 baralhos (regra do
// Diego: todo mundo aparece, do craque ao perna-de-pau — e sem selo na tela).
function countryPool(pais: string): Record<Sec, PoolCard[]> {
  const out: Record<Sec, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  const decks: [Record<string, { name: string; club: string; year: number; fame: number; lo: number; hi: number }[]>, Baralho][] = [
    [CATALOG as never, 'BR'], [CATALOG_EU as never, 'EU'], [CATALOG_WORLD as never, 'WORLD'],
  ]
  for (const [cat, b] of decks) for (const sec of SECS) for (const c of (cat[sec] ?? [])) {
    if (paisDe(c.name, b, c.club, c.year) === pais) out[sec].push({ name: c.name, club: c.club, year: c.year, fame: c.fame, lo: c.lo, hi: c.hi, sec })
  }
  for (const sec of SECS) out[sec].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  return out
}
const cardKey = (c: PoolCard) => `${c.name}|${c.club}|${c.year}`
// ⚽ AS DUAS VERSÕES DO MESMO JOGADOR PODEM JOGAR JUNTAS (Diego 21/08).
// Palavras dele: *"na seleção do Brasil tem que ter os dois Cafu, os dois
// Neymar — são times diferentes que ele jogou, por isso mostra o clube"*.
// Então o que conta é a CARTA (nome|clube|ano), nunca o nome sozinho: o Cafu
// do São Paulo e o Cafu do Milan são duas cartas, e as duas entram em campo.
const formationFits = (pool: Record<Sec, PoolCard[]>, f: Formation) =>
  SECS.every(s => new Set(pool[s].map(cardKey)).size >= NEED[f][s])

// XI dos bots: os MELHORES 11 (nível interno; a UI nunca mostra, mas o motor usa)
function bestXI(pool: Record<Sec, PoolCard[]>, f: Formation): PoolCard[] {
  const used = new Set<string>(); const xi: PoolCard[] = []
  for (const sec of SECS) {
    const sorted = [...pool[sec]].sort((a, b) => b.fame - a.fame || b.hi - a.hi || b.lo - a.lo)
    let n = 0
    for (const c of sorted) { if (n >= NEED[f][sec]) break; const k = cardKey(c); if (used.has(k)) continue; used.add(k); xi.push(c); n++ }
  }
  return xi
}
const xiStrength = (xi: PoolCard[]) => xi.reduce((s, c) => s + (c.lo + c.hi) / 2, 0) / Math.max(1, xi.length)

// ── persistência própria (fora do estado do jogo!) ──
// 🔒 `emAndamento` (anti-hack 14/08): a escolha de seleção/convocação fica
// CARIMBADA no momento em que o torneio começa — antes, só gravávamos no FIM
// (final vista), então dava pra assistir os jogos, não gostar, dar F5 e escolher
// OUTRA seleção (relato de usuário: "quando não dá certo eu atualizo e troco").
// Com o carimbo, o F5 volta pro MESMO torneio (mesma seleção, mesmo time, mesmo
// resultado — a simulação é semeada). Limpa quando a final é gravada.
type CopaSave = { anchor: number; mural: { season: number; selecao: string; campeao: string; voce: boolean }[]; played: number[]; emAndamento?: { season: number; pais: string; xiKeys: string[]; form: Formation } | null }
const skey = (seed: number) => `llcopa:${seed}`
export function loadCopaSave(seed: number): CopaSave | null {
  try { const r = localStorage.getItem(skey(seed)); return r ? JSON.parse(r) as CopaSave : null } catch { return null }
}
function saveCopaSave(seed: number, s: CopaSave) { try { localStorage.setItem(skey(seed), JSON.stringify(s)) } catch { /* segue */ } }
// 🌍 mural "completo" pra exibição/ranking (Diego 14/08): junta o mural LOCAL
// (fonte de verdade do jogo) com o espelho que anda no save da nuvem
// (`state.copaMundoMural`) — dedup por temporada. Assim, títulos de Copa do
// Mundo continuam contando mesmo se a pessoa trocar de aparelho ou limpar o
// navegador (antes, só existiam no aparelho de origem).
export function mergedMundialMural(seed: number, cloudMural?: { season: number; selecao: string; campeao: string; voce: boolean }[]) {
  const local = loadCopaSave(seed)?.mural ?? []
  // 🏆 REGRA (15/08): TÍTULO SEU GANHA DO RESTO. Antes, quando a mesma edição
  // existia no aparelho e na nuvem, o aparelho vencia sempre — e quem tinha a
  // vitória gravada só na nuvem (trocou de celular, limpou o navegador, ou o
  // aparelho ficou com o resultado de uma re-jogada) aparecia com ZERO Copa do
  // Mundo. Agora, se QUALQUER um dos dois lados diz que VOCÊ foi campeão
  // naquela temporada, é isso que vale. Só dá pra gravar `voce:true` ganhando
  // de verdade (a re-jogada nunca grava nada), então isso não abre brecha.
  const porTemporada = new Map<number, { season: number; selecao: string; campeao: string; voce: boolean }>()
  for (const m of [...local, ...(cloudMural ?? [])]) {
    const atual = porTemporada.get(m.season)
    if (!atual || (m.voce && !atual.voce)) porTemporada.set(m.season, m)
  }
  return [...porTemporada.values()].sort((a, b) => a.season - b.season)
}
// âncora do calendário: a 1ª Copa do Mundo é na temporada 100, e depois de 10 em
// 10 (100, 110, 120…). Save que ainda NÃO jogou nenhuma Copa é realinhado pra 100
// (corrige o save antigo que tinha nascido com âncora 110). Quem já jogou uma Copa
// mantém a agenda dele (não bagunça o que já rolou).
const COPA_ANCHOR = 100
function ensureSave(seed: number): CopaSave {
  const cur = loadCopaSave(seed)
  if (cur) {
    // 🧯 blob antigo/parcial: garante os campos (sem isso, save sem played/mural
    // dava tela branca no fim de temporada inteiro — bug 10/08)
    if (!Array.isArray(cur.played)) cur.played = []
    if (!Array.isArray(cur.mural)) cur.mural = []
    if (cur.played.length === 0 && cur.anchor !== COPA_ANCHOR) { cur.anchor = COPA_ANCHOR }
    saveCopaSave(seed, cur)
    return cur
  }
  const fresh: CopaSave = { anchor: COPA_ANCHOR, mural: [], played: [] }
  saveCopaSave(seed, fresh)
  return fresh
}
export const isCopaSeason = (s: CopaSave, seasonNo: number) => seasonNo >= s.anchor && (seasonNo - s.anchor) % 10 === 0
export const nextCopaSeason = (s: CopaSave, seasonNo: number) => seasonNo <= s.anchor ? s.anchor : s.anchor + Math.ceil((seasonNo - s.anchor) / 10) * 10

// ── simulação (seedada; resultados só aparecem quando a rodada é jogada) ──
type Entrant = { club: string; you: boolean; pais: string; xi: PoolCard[]; str: number }
function poisson(r: () => number, lambda: number) { let k = 0, p = 1; const L = Math.exp(-lambda); do { k++; p *= r() } while (p > L); return Math.min(6, k - 1) }
function playMatch(r: () => number, a: Entrant, b: Entrant): [number, number] {
  const adv = a.str - b.str
  return [poisson(r, Math.max(0.25, 1.25 + adv * 0.05)), poisson(r, Math.max(0.25, 1.25 - adv * 0.05))]
}
function pens(r: () => number): [number, number] {
  let a = 2 + Math.floor(r() * 4), b = 2 + Math.floor(r() * 4)
  while (a === b) b = 2 + Math.floor(r() * 4)
  return [a, b]
}

type GMatch = { h: number; a: number; gh?: number; ga?: number; ev?: ScoreGoal[] }
type Group = { teams: number[]; matches: GMatch[][] } // matches[rodada][jogo]
type KoTie = { h: number; a: number; g1?: [number, number]; g2?: [number, number]; ev1?: ScoreGoal[]; ev2?: ScoreGoal[]; pen?: [number, number]; winner?: number }

// 🧮 PLACARES DO CONFRONTO SEMPRE NA MESMA ORDEM (bug do Gabriel, 15/08).
// `g1` nasce na ordem [mandante da IDA, visitante] e `g2` na ordem [mandante da
// VOLTA, visitante] — ou seja, g2 vem INVERTIDO em relação a g1. A tela escrevia
// os dois crus, um embaixo do outro, sob o mesmo cabeçalho "H × A": quem lia
// somava a coluna errada, chegava num agregado diferente do jogo e achava que o
// vencedor estava trocado ("fiz 10 no agregado e contou 8"). O motor SEMPRE
// esteve certo — o que mentia era a linha. Daqui pra frente todo mundo lê pelo
// mesmo lugar: ida, volta e agregado saem os três na ordem H × A.
export function placaresDoConfronto(t: KoTie): { ida: [number, number]; volta: [number, number]; agregado: [number, number] } {
  const g1 = t.g1 ?? [0, 0], g2 = t.g2 ?? [0, 0]
  return { ida: [g1[0], g1[1]], volta: [g2[1], g2[0]], agregado: [g1[0] + g2[1], g1[1] + g2[0]] }
}

// quem marca: sorteio ponderado no XI (ATA pesa 4 · MEI 2 · defesa 1 · GOL nunca)
function scorerPick(r: () => number, xi: PoolCard[]): string {
  const pool: PoolCard[] = []
  for (const c of xi) {
    const w = c.sec === 'ATA' ? 4 : c.sec === 'MEI' ? 2 : c.sec === 'GOL' ? 0 : 1
    for (let i = 0; i < w; i++) pool.push(c)
  }
  return (pool[Math.floor(r() * pool.length)] ?? xi[xi.length - 1])?.name ?? 'Craque Misterioso'
}
// minutos + autores dos gols (seedado): alimenta o LiveScoreCard — o gol pinga
// no minuto certo do relógio, com o NOME de quem fez (as lendas convocadas!)
function goalEvents(r: () => number, gh: number, ga: number, home: Entrant, away: Entrant): ScoreGoal[] {
  const evs: ScoreGoal[] = []
  for (let i = 0; i < gh; i++) evs.push({ home: true, min: 2 + Math.floor(r() * 89), name: scorerPick(r, home.xi) })
  for (let i = 0; i < ga; i++) evs.push({ home: false, min: 2 + Math.floor(r() * 89), name: scorerPick(r, away.xi) })
  return evs.sort((a, b) => a.min - b.min)
}

// 🌍 formato da Copa: 4 grupos de 6 (turno único = 5 rodadas) → top 2 de cada = 8
// → quartas/semis/final. (Era 4 grupos de 4 ida-volta = 16; depois 4 de 5 = 20;
// desde 17/08 são 4 de 6 = 24, quando Croácia/Dinamarca/Peru/Equador fecharam 22
// cartas cada.) Com 6 (par) o turno único continua dando 5 rodadas, só que sem o
// "bye" que sobrava no grupo de 5 — o mata-mata não muda em nada.
const NUM_GROUPS = 4, GROUP_SIZE = 6, GROUP_ROUNDS = 5, COPA_TEAMS = NUM_GROUPS * GROUP_SIZE // 24

// turno único (round-robin) pra N times — cada um joga contra todos UMA vez. N ímpar
// ganha um "bye" por rodada (o -1 é descartado). Determinístico (a ordem vem de fora).
function roundRobin(teams: number[]): GMatch[][] {
  const t = [...teams]; if (t.length % 2 === 1) t.push(-1)
  const n = t.length, out: GMatch[][] = []
  for (let r = 0; r < n - 1; r++) {
    const rd: GMatch[] = []
    for (let i = 0; i < n / 2; i++) { const h = t[i], a = t[n - 1 - i]; if (h >= 0 && a >= 0) rd.push({ h, a }) }
    out.push(rd)
    t.splice(1, 0, t.pop()!) // rotaciona mantendo o t[0] fixo
  }
  return out
}
// tabela do grupo: pontos → VITÓRIAS → saldo (regra do Diego)
function groupTable(g: Group, upTo: number) {
  const st: Record<number, { pts: number; w: number; sg: number; gp: number }> = {}
  for (const t of g.teams) st[t] = { pts: 0, w: 0, sg: 0, gp: 0 }
  for (let r = 0; r < upTo; r++) for (const m of (g.matches[r] ?? [])) {
    if (m.gh == null || m.ga == null) continue
    st[m.h].sg += m.gh - m.ga; st[m.a].sg += m.ga - m.gh; st[m.h].gp += m.gh; st[m.a].gp += m.ga
    if (m.gh > m.ga) { st[m.h].pts += 3; st[m.h].w++ } else if (m.ga > m.gh) { st[m.a].pts += 3; st[m.a].w++ } else { st[m.h].pts++; st[m.a].pts++ }
  }
  return [...g.teams].sort((x, y) => st[y].pts - st[x].pts || st[y].w - st[x].w || st[y].sg - st[x].sg || st[y].gp - st[x].gp)
    .map(t => ({ t, ...st[t] }))
}

// ⏱️ minuto ao vivo compartilhado (mesmo pace do LiveScoreCard: 82% do roundMs)
function useLiveMin(roundKey: number, roundMs: number, finished: boolean): number {
  const [min, setMin] = useState(finished ? 93 : 0)
  useEffect(() => {
    if (finished) { setMin(93); return }
    setMin(0)
    const t0 = Date.now()
    const dur = Math.max(400, roundMs * 0.82)
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur)
      setMin(Math.round(p * 93))
      if (p >= 1) clearInterval(iv)
    }, 250)
    return () => clearInterval(iv)
  }, [roundKey, finished, roundMs])
  return min
}
// jogo dos BOTS rolando (mesma linguagem visual da Copa Legends/Copa dos 8,
// pedido do Diego 11/08: cor real de cada seleção — nada de time apagado —
// + barra de progresso + flash quando alguém acaba de marcar). A cor de cada
// lado vem do NOME (flag+país já entra no hash, cada seleção fica única).
function MiniLive({ nmH, nmA, hPais, aPais, ev, min, bold }: { nmH: string; nmA: string; hPais: string; aPais: string; ev: ScoreGoal[]; min: number; bold?: boolean }) {
  const gh = ev.filter(e => e.home && e.min <= min).length
  const ga = ev.filter(e => !e.home && e.min <= min).length
  const done = min >= 93
  const fill = (pais: string): CopaFill => { const hex = paisColor(pais); return { bg: hex, ink: _inkFor(hex), holo: 0, mark: '' } }
  const fH = fill(hPais), fA = fill(aPais)
  // ⚡ "acabou de fazer gol": só olha pro que JÁ tá no placar (min<=min atual) —
  // é destaque visual de algo já revelado, nunca antecipa nada.
  const lastGoalMin = !done ? Math.max(-1, ...ev.filter(e => e.min <= min).map(e => e.min)) : -1
  const justScored = !done && lastGoalMin >= 0 && min - lastGoalMin <= 1
  const barPct = Math.max(0, Math.min(100, Math.round((min / 90) * 100)))
  return (
    <div style={{ position: 'relative', overflow: 'hidden', border: `2px solid ${justScored ? GOLD : '#000'}`, borderRadius: 12, boxShadow: `2px 2px 0 0 #000`, margin: '5px 0' }}>
      {/* 🎨 faixa branca no meio com o placar (Diego 11/08) — mesmo padrão das
          outras 2 copas: cor cheia só nas laterais, placar em cima do branco. */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', overflow: 'hidden', borderTopLeftRadius: 9, borderTopRightRadius: 9 }}>
        <div style={{ flex: 1, minWidth: 0, background: fH.bg, color: fH.ink, padding: '5px 8px', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: bold ? 900 : 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nmH}</div>
        <div style={{ flex: 'none', background: '#fff', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', fontWeight: 900, fontSize: 12 }}>{gh}×{ga}</div>
        <div style={{ flex: 1, minWidth: 0, background: fA.bg, color: fA.ink, padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 11, fontWeight: bold ? 900 : 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{nmA}</div>
        {justScored && (
          <>
            <style>{'@keyframes cmGoalFlash{0%{opacity:1}100%{opacity:0}}'}</style>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,255,255,.5), transparent 70%)', animation: 'cmGoalFlash 1.1s ease', pointerEvents: 'none' }} />
          </>
        )}
      </div>
      <div style={{ padding: '4px 8px 5px' }}>
        {!done && <div style={{ height: 3, borderRadius: 2, background: 'rgba(0,0,0,.15)', margin: '0 0 4px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${barPct}%`, background: GOLD }} /></div>}
        <p style={{ textAlign: 'center', margin: 0 }}>
          <span style={{ ...copaCenterChip, fontWeight: 900, fontSize: 9, color: done ? '#8ff0a8' : justScored ? '#FFD778' : '#ff9a8f' }}>
            {done ? 'FIM' : justScored ? '⚽ GOOOL agora!' : `🔴 ${Math.min(90, min)}'`}
          </span>
        </p>
      </div>
    </div>
  )
}

// ── componente principal: o portão + o torneio inteiro num modal ──
export function CopaMundoGate({ seasonNo, seed, top16, myPos, onPrize, onCard, agenciaOn, onGoRank, onMural }: { seasonNo: number; seed: number; top16: { name: string; you: boolean }[]; myPos: number; onPrize?: (coins: number) => void; onCard?: (card: { name: string; club: string; year: number; pos: string; fame: number; folk?: boolean; promessa?: boolean }, key: string) => void; agenciaOn?: boolean; onGoRank?: () => void; onMural?: (entries: { season: number; selecao: string; campeao: string; voce: boolean }[]) => void }) {
  // 🔗 "(aba Rank)" virou link de verdade (Diego 14/08): antes era só texto
  // solto, a pessoa tinha que sair da tela e procurar a aba na mão.
  const rankLink = onGoRank
    ? <button onClick={onGoRank} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 900, color: RED, textDecoration: 'underline', cursor: 'pointer' }}>→ ver aba Rank</button>
    : <>(aba Rank)</>
  // 🐛 FIX 15/08 (relato do leodiniz85: "ganhei a Copa do Mundo 2× e nenhuma
  // contou"): este `save` era memoizado SÓ pelo seed — depois que o torneio
  // terminava e gravava `played`, o memo continuava VELHO, então `copaNow`
  // seguia true e o botão "DISPUTAR A COPA DO MUNDO" CONTINUAVA NA TELA. A
  // pessoa entrava de novo, escolhia outra seleção (chaveamento novo), ganhava
  // — e a gravação era barrada por `played`, porque a edição já estava
  // decidida. Resultado: a tela cantava "VOCÊ É CAMPEÃO DO MUNDO + 100 moedas"
  // e o jogo não registrava NADA. Agora o portão relê o save quando a Copa
  // fecha: edição decidida = botão some, ninguém joga a mesma Copa 2 vezes.
  const [saveVer, setSaveVer] = useState(0)
  const save = useMemo(() => ensureSave(seed), [seed, saveVer])
  // 🌍 BACKFILL do espelho (Diego 14/08): toda vez que essa tela abre, aproveita
  // pra mandar o mural LOCAL inteiro pro save (a ação já dedupa por temporada —
  // só entra o que ainda não tinha). Sem isso, só entrariam títulos NOVOS a
  // partir de hoje; assim, o histórico de quem já tem Copa do Mundo ganha
  // registra também, sem esperar a próxima edição.
  useEffect(() => { if (save.mural.length) onMural?.(save.mural) }, [seed, save.mural.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState(false)
  const copaNow = isCopaSeason(save, seasonNo) && !save.played.includes(seasonNo)
  const inTop16 = myPos >= 0
  const proxima = nextCopaSeason(save, isCopaSeason(save, seasonNo) ? seasonNo + 1 : seasonNo)

  // ranking das seleções (nº de cartas — atualiza sozinho quando o baralho engorda)
  const paises16 = useMemo(() => rankingSelecoes().slice(0, COPA_TEAMS).map(p => p.pais), [])

  if (seasonNo < COPA_ANCHOR) return (
    <div style={{ ...box('#CBBF9E'), padding: '10px 12px', marginBottom: 10, boxShadow: `3px 3px 0 0 ${INK}` }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: 0, color: 'rgba(0,0,0,.75)', textTransform: 'uppercase' }}>🔒 Copa do Mundo Legends</p>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '3px 0 0', lineHeight: 1.45 }}>Torneio de seleções, coisa de <b>veterano</b>: desbloqueia na <b>temporada 100</b> — e só entra quem estiver no <b>TOP 24 do ranking de clubes</b> {rankLink}. Continue jogando e subindo no mural.</p>
      <div style={{ height: 13, border: `2.5px solid ${INK}`, borderRadius: 999, background: '#fff', marginTop: 7, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${Math.min(100, seasonNo)}%`, background: `linear-gradient(90deg,#FFE79A,${GOLD})`, borderRight: `2px solid ${INK}` }} />
        <b style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 8.5, fontWeight: 900, color: INK }}>temporada {seasonNo} de 100</b>
      </div>
    </div>
  )

  if (!copaNow) return (
    <div style={{ ...box('#fff'), padding: '9px 12px', marginBottom: 10, boxShadow: `3px 3px 0 0 ${INK}`, display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ fontSize: 21 }}>🌍</span>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(0,0,0,.75)', lineHeight: 1.35 }}>
        <b>Copa do Mundo Legends: faltam {proxima - seasonNo} temporada{proxima - seasonNo > 1 ? 's' : ''}</b><br />
        a próxima edição é na temporada <b>{proxima}</b>{save.mural.length > 0 ? <> · 🏅 mural: {save.mural.filter(m => m.voce).length}× você</> : null}
      </span>
    </div>
  )

  if (!inTop16) return (
    <div style={{ ...box('#CBBF9E'), padding: '10px 12px', marginBottom: 10, boxShadow: `3px 3px 0 0 ${INK}` }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: 0, color: 'rgba(0,0,0,.75)', textTransform: 'uppercase' }}>🔒 Copa do Mundo Legends — temporada {seasonNo}</p>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '3px 0 0', lineHeight: 1.45 }}>É temporada de Copa, mas <b>seu clube não está no TOP 24 do ranking de clubes</b> {rankLink}. Ganhe títulos e junte dinheiro pra subir no mural — a próxima edição é na <b>{proxima}</b>.</p>
    </div>
  )

  return (
    <>
      <style>{'@keyframes cmSheen{0%{background-position:180% 180%}100%{background-position:-80% -80%}}'}</style>
      <button onClick={() => setOpen(true)} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, ...OSWALD, background: `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', marginBottom: 9, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(115deg,transparent 32%,rgba(255,255,255,.7) 48%,transparent 60%)', backgroundSize: '250% 250%', animation: 'cmSheen 2.4s linear infinite' }} />
        <span style={{ position: 'relative' }}>🌍 DISPUTAR A COPA DO MUNDO</span>
        <span style={{ position: 'relative', display: 'block', fontSize: 9.5, fontWeight: 800, textTransform: 'none', fontFamily: 'system-ui', marginTop: 2 }}>chegou a hora — ela só volta na temporada {seasonNo + 10}!</span>
      </button>
      {open && <CopaMundo seasonNo={seasonNo} seed={seed} top16={top16} myPos={myPos} paises16={paises16} save={save} onPrize={onPrize} onCard={onCard} onMural={onMural} agenciaOn={agenciaOn} onClose={() => { setOpen(false); setSaveVer(v => v + 1) }} />}
    </>
  )
}

// 🧯 BUG 10/08 ("a Copa recomeçou sozinha / não termina"): o Modal era declarado
// DENTRO do CopaMundo — função nova a cada render → o React desmontava e
// REMONTAVA a árvore inteira (CupScreen voltava pra rodada 1, convocação sumia,
// e o prêmio re-disparava em loop). Movido pra fora: identidade estável, fim do
// reinício. NADA visual mudou.
const CMModal = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => createPortal(
  <div style={{ position: 'fixed', inset: 0, zIndex: 99996, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, overflowY: 'auto' }}>
    <style>{'@keyframes cmSheen{0%{background-position:180% 180%}100%{background-position:-80% -80%}}'}</style>
    <div style={{ ...box('#F4ECD6'), color: INK, width: '100%', maxWidth: wide ? 430 : 400, maxHeight: '95vh', overflowY: 'auto', padding: 14, margin: 'auto', borderRadius: 18 }}>
      {children}
    </div>
  </div>, document.body)

function CopaMundo({ seasonNo, seed, top16, myPos, paises16, save, onPrize, onCard, onMural, agenciaOn, onClose }: { seasonNo: number; seed: number; top16: { name: string; you: boolean }[]; myPos: number; paises16: string[]; save: CopaSave; onPrize?: (coins: number) => void; onCard?: (card: { name: string; club: string; year: number; pos: string; fame: number; folk?: boolean; promessa?: boolean }, key: string) => void; onMural?: (entries: { season: number; selecao: string; campeao: string; voce: boolean }[]) => void; agenciaOn?: boolean; onClose: () => void }) {
  // (o gerador do torneio mora DENTRO do CupScreen agora — ver comentário lá:
  // um gerador compartilhado com estado fazia o resultado mudar sozinho)
  // 🔒 ANTI-HACK DO F5 (14/08): se ESTA temporada já tem torneio carimbado
  // (emAndamento), volta DIRETO pro torneio com a MESMA seleção e o MESMO time —
  // sem passar pela escolha de novo. Recupera o XI pelo nome|clube|ano no pool
  // do país (catálogo estável); se alguma carta sumir do catálogo, o buraco é
  // preenchido pelo melhor disponível (nunca crasha).
  const carimbo = save.emAndamento && save.emAndamento.season === seasonNo ? save.emAndamento : null
  const restoreXI = (): PoolCard[] | null => {
    if (!carimbo) return null
    const pool = countryPool(carimbo.pais)
    const all: PoolCard[] = Object.values(pool).flat()
    const byKey = new Map(all.map(c => [`${c.name}|${c.club}|${c.year}`, c]))
    const xi = carimbo.xiKeys.map(k => byKey.get(k)).filter((c): c is PoolCard => !!c)
    if (xi.length === 11) return xi
    const used = new Set(xi.map(c => `${c.name}|${c.club}|${c.year}`))
    for (const c of all.sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))) {
      if (xi.length >= 11) break
      if (!used.has(`${c.name}|${c.club}|${c.year}`)) { xi.push(c); used.add(`${c.name}|${c.club}|${c.year}`) }
    }
    return xi.length === 11 ? xi : null
  }
  const restored = carimbo ? restoreXI() : null
  const [phase, setPhase] = useState<'select' | 'convoke' | 'cup'>(restored ? 'cup' : 'select')
  const [myPais, setMyPais] = useState<string | null>(carimbo && restored ? carimbo.pais : null)
  const [myXI, setMyXI] = useState<PoolCard[] | null>(restored)
  const [myForm, setMyForm] = useState<Formation>(carimbo && restored ? carimbo.form : '4-3-3')

  // bots recebem depois de você: cada um leva a melhor seleção livre da posição
  // dele pra baixo (fallback: melhor livre) — só usuário REAL escolhe.
  const entrants = useMemo<Entrant[] | null>(() => {
    if (!myPais || !myXI) return null
    const taken = new Set<string>([myPais])
    const list: Entrant[] = []
    top16.forEach((c, i) => {
      if (c.you) { list.push({ club: c.name, you: true, pais: myPais, xi: myXI, str: xiStrength(myXI) }); return }
      let pais = paises16.slice(i).find(p => !taken.has(p)) ?? paises16.find(p => !taken.has(p))
      if (!pais) pais = paises16[i] ?? paises16[0] ?? 'Brasil' // nunca deixa seleção sem país (XI vazio quebrava o gol)
      taken.add(pais)
      const pool = countryPool(pais)
      const f: Formation = formationFits(pool, '4-3-3') ? '4-3-3' : '4-4-2'
      const xi = bestXI(pool, f)
      list.push({ club: c.name, you: false, pais, xi, str: xiStrength(xi) })
    })
    return list
  }, [myPais, myXI, top16, paises16])

  if (phase === 'select') return (
    <CMModal>
      <SelecaoScreen paises16={paises16} myPos={myPos} myClub={top16[myPos]?.name ?? 'Você'} onPick={p => { setMyPais(p); setPhase('convoke') }} onClose={onClose} />
    </CMModal>
  )
  if (phase === 'convoke' && myPais) return (
    <CMModal>
      <ConvocacaoScreen pais={myPais} onBack={() => setPhase('select')} onDone={(xi, f) => {
        // 🔒 CARIMBA a escolha AGORA (antes do 1º jogo): F5 daqui pra frente
        // volta pro MESMO torneio — acabou o "atualiza e troca de seleção".
        const cur = loadCopaSave(seed) ?? save
        saveCopaSave(seed, { ...cur, emAndamento: { season: seasonNo, pais: myPais, xiKeys: xi.map(c => `${c.name}|${c.club}|${c.year}`), form: f } })
        setMyXI(xi); setMyForm(f); setPhase('cup')
      }} />
    </CMModal>
  )
  if (phase === 'cup' && entrants) return (
    <CMModal wide>
      <CupScreen entrants={entrants} seasonNo={seasonNo} seed={seed} save={save} myForm={myForm} onPrize={onPrize} onCard={onCard} onMural={onMural} agenciaOn={agenciaOn} onClose={onClose} />
    </CMModal>
  )
  return null
}

// ── tela 1: escolha da seleção (trava pela posição no ranking de clubes) ──
function SelecaoScreen({ paises16, myPos, myClub, onPick, onClose }: { paises16: string[]; myPos: number; myClub: string; onPick: (p: string) => void; onClose: () => void }) {
  return (
    <>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>🌍 Escolha sua seleção</p>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', textAlign: 'center', margin: '4px 0 10px', lineHeight: 1.4 }}>
        <b>{myClub}</b> é o <b>{myPos + 1}º do ranking de clubes</b> — você pode escolher qualquer seleção <b>da {myPos + 1}ª pra baixo</b>. Os rivais recebem as que sobrarem, na ordem do ranking.
      </p>
      {paises16.map((p, i) => {
        const locked = i < myPos
        return (
          <button key={p} disabled={locked} onClick={() => onPick(p)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 11px', marginBottom: 6, cursor: locked ? 'not-allowed' : 'pointer', background: locked ? '#CBBF9E' : '#fff', boxShadow: locked ? 'none' : `3px 3px 0 0 ${INK}`, opacity: locked ? 0.75 : 1, textAlign: 'left' }}>
            <span style={{ fontSize: 21 }}>{flagOf(p)}</span>
            <span style={{ ...OSWALD, fontWeight: 900, fontSize: 14, flex: 1, color: locked ? 'rgba(0,0,0,.5)' : INK }}>{i + 1}º · {p}</span>
            {locked
              ? <span style={{ fontSize: 8.5, fontWeight: 800, color: 'rgba(0,0,0,.55)', textAlign: 'right', lineHeight: 1.25 }}>🔒 só pra quem chegou<br />em {i + 1}º ou melhor</span>
              : <span style={{ fontSize: 15 }}>👉</span>}
          </button>
        )
      })}
      <p style={{ textAlign: 'center', marginTop: 8 }}><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 900, textDecoration: 'underline', color: 'rgba(0,0,0,.5)', cursor: 'pointer' }}>voltar (a Copa espera você tocar de novo)</button></p>
    </>
  )
}

// ── tela 2: CONVOCAÇÃO (mockup aprovado: listão A-Z sem categoria, 11 na veia) ──
function ConvocacaoScreen({ pais, onBack, onDone }: { pais: string; onBack: () => void; onDone: (xi: PoolCard[], f: Formation) => void }) {
  const pool = useMemo(() => countryPool(pais), [pais])
  const fits433 = formationFits(pool, '4-3-3'), fits442 = formationFits(pool, '4-4-2')
  const [form, setForm] = useState<Formation>(fits433 ? '4-3-3' : '4-4-2')
  const [tab, setTab] = useState<Sec>('GOL')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, PoolCard>>({}) // cardKey → carta
  const need = NEED[form]
  const total = Object.keys(sel).length
  const bySec = (s: Sec) => Object.values(sel).filter(c => c.sec === s)
  const totalCards = SECS.reduce((n, s) => n + pool[s].length, 0)

  // 🗣️ POR QUE O TOQUE NÃO FEZ NADA (Diego 23/08: "a escalação não tá alterando
  // certo"). Testado na tela: com a posição CHEIA, tocar em outro jogador não
  // fazia NADA e nada explicava — parecia tela travada. Regra do Diego: toda
  // trava diz o PORQUÊ e o CAMINHO pra destravar. Agora diz.
  const [aviso, setAviso] = useState<string | null>(null)
  const toggle = (c: PoolCard) => {
    const k = cardKey(c)
    setSel(prev => {
      const nx = { ...prev }
      if (nx[k]) { delete nx[k]; setAviso(null); return nx }
      // 🧯 10/08: as guardas liam o `sel` do RENDER (velho) — dois toques rápidos
      // passavam do limite da posição e travavam o botão sem explicação. Agora
      // contam no `prev` (o estado de verdade do momento).
      const vals = Object.values(prev)
      const naPos = vals.filter(x => x.sec === c.sec)
      if (naPos.length >= need[c.sec]) { // posição cheia
        setAviso(`Você já convocou ${need[c.sec]} ${need[c.sec] === 1 ? SEC_UM[c.sec] : SEC_LABEL[c.sec].toLowerCase()} — não cabe mais. Pra botar ${c.name}, toque primeiro em ${naPos.map(x => x.name).join(' ou ')} pra tirar.`)
        return prev
      }
      nx[k] = c; setAviso(null); return nx
    })
  }
  const missing = SECS.filter(s => bySec(s).length < need[s]).map(s => `${need[s] - bySec(s).length} ${SEC_LABEL[s].toLowerCase()}`)
  const ready = total === 11 && missing.length === 0
  const list = pool[tab].filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()))

  const switchForm = (f: Formation) => {
    if (f === form) return
    setForm(f); setSel({}) // troca de esquema zera a convocação (regras de vaga mudam)
  }

  return (
    <>
      <div style={{ ...box('#0C0C0C'), padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, borderRadius: 13 }}>
        <span style={{ fontSize: 28 }}>{flagOf(pais)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: 0, color: '#fff', textTransform: 'uppercase' }}>Convocação · {pais}</p>
          <p style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.65)', margin: '2px 0 0' }}>{totalCards} jogadores na lista — só nome, clube e ano. Convoque 11.</p>
        </div>
        <div style={{ background: GOLD, border: `2px solid ${INK}`, borderRadius: 10, padding: '4px 9px', textAlign: 'center', color: INK }}>
          <b style={{ display: 'block', fontSize: 15, lineHeight: 1, ...OSWALD }}>{total}/11</b>
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1 }}>CONVOCADOS</span>
        </div>
      </div>

      {/* formação: só esquemas que o país fecha (trava com aviso) */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['4-3-3', '4-4-2'] as Formation[]).map(f => {
          const ok = f === '4-3-3' ? fits433 : fits442
          return (
            <button key={f} disabled={!ok} onClick={() => switchForm(f)}
              style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 4px', fontWeight: 900, fontSize: 12, ...OSWALD, cursor: ok ? 'pointer' : 'not-allowed', background: !ok ? '#CBBF9E' : form === f ? GOLD : '#fff', boxShadow: form === f ? `2px 2px 0 0 ${INK}` : 'none', opacity: ok ? 1 : 0.7 }}>
              {ok ? f : `🔒 ${f}`}
              {!ok && <span style={{ display: 'block', fontSize: 7.5, fontWeight: 800, fontFamily: 'system-ui', textTransform: 'none' }}>{pais} não tem elenco pra esse esquema</span>}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {SECS.map(s => {
          const done = bySec(s).length >= need[s]
          return (
            <button key={s} onClick={() => setTab(s)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 2px', fontWeight: 900, fontSize: 10.5, ...OSWALD, cursor: 'pointer', background: done ? GREEN : tab === s ? GOLD : '#fff', color: done ? '#fff' : INK, boxShadow: tab === s ? `2px 2px 0 0 ${INK}` : 'none' }}>
              {s}<span style={{ display: 'block', fontSize: 7.5, fontWeight: 800, opacity: 0.8 }}>{bySec(s).length}/{need[s]}{done ? ' ✓' : ''}</span>
            </button>
          )
        })}
      </div>

      {/* 🗣️ o porquê do toque que "não fez nada" — fica logo em cima da lista,
          no lugar exato onde a pessoa tocou (jeito que o Diego pede). */}
      {aviso && (
        <div style={{ border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 10px', marginBottom: 8, background: '#FDE9C8', fontWeight: 800, fontSize: 10.5, lineHeight: 1.4 }}>
          ✋ {aviso}
        </div>
      )}

      <input value={q} onChange={e => setQ(e.target.value)} placeholder={`🔎 buscar nos ${pool[tab].length} ${SEC_LABEL[tab].toLowerCase()}…`}
        style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 11, padding: '7px 11px', fontWeight: 800, fontSize: 12, background: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />

      <div style={{ ...box('#fff'), borderRadius: 12, overflow: 'hidden', marginBottom: 10, boxShadow: `3px 3px 0 0 ${INK}` }}>
        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
          {list.map(c => {
            const k = cardKey(c)
            const on = !!sel[k]
            const full = !on && bySec(c.sec).length >= need[c.sec]
            const versions = pool[c.sec].filter(o => o.name === c.name).length > 1
            // 🔒 quem NÃO cabe mais aparece TRANCADO (cadeado + apagado), não só
            // clarinho: antes ele parecia normal, a pessoa tocava e não acontecia
            // nada. O botão continua clicável DE PROPÓSITO — é o toque que faz
            // aparecer a explicação em cima da lista.
            return (
              <button key={k} onClick={() => toggle(c)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: 'none', borderBottom: '2px solid rgba(0,0,0,.07)', background: on ? '#E9F5EC' : full ? '#EFE7D2' : '#fff', cursor: 'pointer', opacity: full ? 0.62 : 1, textAlign: 'left' }}>
                <span style={{ width: 22, height: 22, border: `2.5px solid ${INK}`, borderRadius: 7, background: on ? GREEN : '#fff', color: on ? '#fff' : 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{on ? '✓' : full ? '🔒' : ''}</span>
                <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                {on && <span style={{ background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 999, fontSize: 7, fontWeight: 900, padding: '1px 5px', flexShrink: 0 }}>toque pra tirar</span>}
                {versions && <span style={{ background: '#7C3AED', color: '#fff', border: `2px solid ${INK}`, borderRadius: 999, fontSize: 7, fontWeight: 900, padding: '1px 5px', flexShrink: 0 }}>versões</span>}
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.club} · {c.year}</span>
              </button>
            )
          })}
          {list.length === 0 && <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', padding: 14 }}>ninguém com esse nome aqui… 🔎</p>}
        </div>
      </div>

      {/* campinho compacto: convocados por linha (ATA/MEI/DEF/GOL, padrão do pregão) */}
      <div style={{ border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `4px 4px 0 0 ${INK}`, marginBottom: 10 }}>
        <div style={{ background: INK, color: '#fff', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{flagOf(pais)} sua seleção · {total}/11 · {form}</span>
        </div>
        <div style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)`, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {(['ATA', 'MEI', 'DEF', 'GOL'] as (Sec | 'DEF')[]).map(row => {
            const secs: Sec[] = row === 'DEF' ? ['LAT', 'ZAG'] : [row]
            let slots: { sec: Sec; c: PoolCard | null }[] = []
            for (const s of secs) { const picked = bySec(s); for (let i = 0; i < need[s]; i++) slots.push({ sec: s, c: picked[i] ?? null }) }
            if (row === 'DEF') { const lat = slots.filter(x => x.sec === 'LAT'), zag = slots.filter(x => x.sec === 'ZAG'); slots = [lat[0], ...zag, lat[1]] }
            return (
              <div key={String(row)} style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
                {slots.map((sl, i) => (
                  <div key={i} style={{ border: `2px solid ${INK}`, borderRadius: 8, textAlign: 'center', padding: '3px 7px', minWidth: 62, background: sl.c ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                    <p style={{ fontSize: 8.5, fontWeight: 900, color: sl.c ? RED : '#fff', margin: 0 }}>{sl.sec}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, margin: 0, color: sl.c ? INK : 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 74 }}>{sl.c ? sl.c.name : 'Vazio'}</p>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {ready ? (
        <button onClick={() => onDone(Object.values(sel), form)} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 14, ...OSWALD, background: `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', textTransform: 'uppercase' }}>✅ Fechar convocação (11/11) — bora pra Copa! 🌍</button>
      ) : (
        <div style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 13, ...OSWALD, background: '#CBBF9E', color: 'rgba(0,0,0,.55)', textAlign: 'center', textTransform: 'uppercase' }}>
          🔒 Fechar convocação
          <span style={{ display: 'block', fontSize: 9, fontWeight: 800, fontFamily: 'system-ui', textTransform: 'none', marginTop: 2 }}>faltam {missing.join(' · ')} — convoque na lista ⬆️</span>
        </div>
      )}
      <p style={{ textAlign: 'center', marginTop: 8 }}><button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 900, textDecoration: 'underline', color: 'rgba(0,0,0,.5)', cursor: 'pointer' }}>← trocar de seleção</button></p>
    </>
  )
}

// ── tela 3: o torneio AO VIVO (mesmo ritmo/suspense da liga: relógio, GOOOL,
// pênaltis cobrança a cobrança — nada aparece pronto) ──
// 🌍 O TORNEIO INTEIRO, calculado de uma vez (função PURA — dá pra testar).
// 🔒 SEMENTE PRÓPRIA (bug relatado pelo jogador em 04/08: "mudou o resultado da
// Copa"). Antes isto vivia num useMemo que usava o `rng` COMPARTILHADO da tela de
// cima — um gerador COM ESTADO. Como a lista de participantes nasce de um array
// recriado a cada render, o cálculo refazia o torneio de vez em quando… e, como o
// gerador já tinha avançado, saíam OUTROS placares e OUTRO campeão. Agora o
// gerador nasce AQUI de uma semente fixa: rodar 100 vezes dá SEMPRE o mesmo
// resultado (mesma regra determinística da liga).
export function simulaCopaMundo(entrants: Entrant[], seed: number, seasonNo: number) {
  {
    const rng = mulberry((seed ^ Math.imul(seasonNo, 2654435761) ^ 0xC0FA) >>> 0)
    const idx = entrants.map((_, i) => i)
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
    const groups: Group[] = Array.from({ length: NUM_GROUPS }, (_, g) => {
      const teams = idx.slice(g * GROUP_SIZE, g * GROUP_SIZE + GROUP_SIZE)
      const matches = roundRobin(teams) // 4 grupos de 5 = turno único (5 rodadas, 1 folga/rodada)
      for (const rd of matches) for (const m of rd) {
        const [gh, ga] = playMatch(rng, entrants[m.h], entrants[m.a])
        m.gh = gh; m.ga = ga
        m.ev = goalEvents(rng, gh, ga, entrants[m.h], entrants[m.a])
      }
      return { teams, matches }
    })
    const q8 = groups.flatMap(g => groupTable(g, GROUP_ROUNDS).slice(0, 2).map(r => r.t))
    const ord = [...q8]
    for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]] }
    const mkTie = (h: number, a: number): KoTie => {
      const t: KoTie = { h, a }
      t.g1 = playMatch(rng, entrants[h], entrants[a])
      t.ev1 = goalEvents(rng, t.g1[0], t.g1[1], entrants[h], entrants[a])
      t.g2 = playMatch(rng, entrants[a], entrants[h])
      t.ev2 = goalEvents(rng, t.g2[0], t.g2[1], entrants[a], entrants[h])
      const hg = t.g1[0] + t.g2[1], ag = t.g1[1] + t.g2[0]
      if (hg > ag) t.winner = h; else if (ag > hg) t.winner = a
      else { t.pen = pens(rng); t.winner = t.pen[0] > t.pen[1] ? h : a }
      return t
    }
    const qf = [mkTie(ord[0], ord[1]), mkTie(ord[2], ord[3]), mkTie(ord[4], ord[5]), mkTie(ord[6], ord[7])]
    const sf = [mkTie(qf[0].winner!, qf[1].winner!), mkTie(qf[2].winner!, qf[3].winner!)]
    const fh = sf[0].winner!, fa = sf[1].winner!
    const fg = playMatch(rng, entrants[fh], entrants[fa])
    const fev = goalEvents(rng, fg[0], fg[1], entrants[fh], entrants[fa])
    const fpen = fg[0] === fg[1] ? pens(rng) : null
    const champion = fg[0] > fg[1] ? fh : fg[1] > fg[0] ? fa : (fpen![0] > fpen![1] ? fh : fa)
    return { groups, qf, sf, final: { h: fh, a: fa, g: fg, ev: fev, pen: fpen, champion } }
  }
}

function CupScreen({ entrants, seasonNo, seed, save, onPrize, onCard, onMural, agenciaOn, onClose }: { entrants: Entrant[]; seasonNo: number; seed: number; save: CopaSave; myForm: Formation; onPrize?: (coins: number) => void; onCard?: (card: { name: string; club: string; year: number; pos: string; fame: number; folk?: boolean; promessa?: boolean }, key: string) => void; onMural?: (entries: { season: number; selecao: string; campeao: string; voce: boolean }[]) => void; agenciaOn?: boolean; onClose: () => void }) {
  // tudo pré-computado com a MESMA seed (placares, gols, pênaltis) — mas só é
  // MOSTRADO com o relógio rolando, na velocidade padrão da liga (9s a rodada).
  const world = useMemo(() => simulaCopaMundo(entrants, seed, seasonNo), [entrants, seed, seasonNo])

  // step = revelações FEITAS (GR = rodadas de grupo): 1..GR rodadas de grupo ·
  // GR+1 sorteio · GR+2 QF ida · GR+3 QF volta · GR+4 SF ida · GR+5 SF volta ·
  // GR+6 final · GR+7 cerimônia.
  const GR = GROUP_ROUNDS
  const [step, setStep] = useState(0)
  const [liveDone, setLiveDone] = useState(true)
  const [roundKey, setRoundKey] = useState(0)
  const LIVE = (s: number) => (s >= 1 && s <= GR) || (s >= GR + 2 && s <= GR + 6)
  const gRound = Math.min(GR, step)
  const shownRounds = step <= GR && !liveDone ? Math.max(0, gRound - 1) : gRound // tabela/resultados só DEPOIS do apito
  const done = step >= GR + 7
  // 🐛 (07/08, relato de jogador via Diego): "pulei a final, ganhei, mas não veio
  // carta nem troféu". Causa: prêmio/carta só gravavam em `done` (depois do
  // clique EXTRA na "🎉 Cerimônia", que vem DEPOIS da final). O "Pular" na
  // final é 2 toques (1º só corta a animação, mostra o placar; 2º avança) —
  // quem parava no 1º toque (viu que ganhou, achou que acabou) nunca chegava
  // no `done` e o prêmio ficava só "quase". Agora o prêmio conta assim que o
  // placar da FINAL aparece na tela — sem depender do clique da cerimônia.
  const finalSeen = step >= GR + 6 && liveDone
  const myIdx = entrants.findIndex(isYouE)
  const nm = (i: number) => `${flagOf(entrants[i].pais)} ${entrants[i].pais}`
  const club = (i: number) => entrants[i].club
  const isYou = (i: number) => entrants[i].you

  // 🎮 ritmo IGUAL à liga: AUTO por padrão (a Copa anda sozinha); quem tem o
  // Modo Manual usa os MESMOS controles (🐢/⚡ · pular · próxima fase); quem não
  // tem vê o cadeado do APOIE. Mesma preferência salva (useSimMode) da carreira.
  const hasManual = useHasManual()
  const [manualPref, toggleManual] = useSimMode()
  const manual = hasManual && manualPref
  const [speed, setSpeed] = useState(1)
  const roundMs = Math.round(9000 / speed) // 9s = ROUND_MS da liga

  const liveMin = useLiveMin(roundKey, roundMs, liveDone)
  // 🐛 TOQUE DUPLO (bug reportado 04/08: "apertei 2× e a partida voltou"): antes
  // estas funções liam o `step` da renderização (`const s = step + 1`). Dois
  // toques rápidos liam o MESMO número: o 2º não avançava fase nenhuma, mas
  // ainda reiniciava o relógio (roundKey) — e o jogo parecia VOLTAR do zero.
  // Agora o passo é calculado DENTRO do setState (sempre o valor mais novo) e o
  // relógio só reinicia quando a fase realmente mudou.
  const avanca = (jaResolvida: boolean) => {
    setStep(atual => {
      const s = atual + 1
      if (LIVE(s)) { setRoundKey(k => k + 1); setLiveDone(jaResolvida) }
      return s
    })
  }
  const next = () => avanca(false)
  // ⏭️ pular (só manual): corta a espera — apito na hora; de novo = próxima fase já resolvida
  const skip = () => {
    if (!liveDone) { setLiveDone(true); return } // 1º toque: só adianta o apito
    avanca(true)
  }
  // relógio da rodada: ritmo da liga (ajustado pela velocidade do manual) +
  // tempo dos pênaltis dos confrontos VISÍVEIS ao vivo — suspense completo.
  useEffect(() => {
    if (liveDone) return
    let extra = 700
    const penMs = (t: KoTie) => t.pen && (isYou(t.h) || isYou(t.a)) ? pensRevealDelay(t.pen) * 1000 : 0
    if (step === GR + 3) extra += Math.max(0, ...world.qf.map(penMs)) // QF volta
    if (step === GR + 5) extra += Math.max(0, ...world.sf.map(penMs)) // SF volta
    if (step === GR + 6 && world.final.pen) extra += pensRevealDelay(world.final.pen) * 1000 // final
    const t = setTimeout(() => setLiveDone(true), roundMs + extra)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey])
  // 🔁 MODO AUTO (padrão, igual à liga): a Copa anda sozinha fase a fase —
  // pequena pausa pós-apito pra ler o resultado, e segue o baile.
  useEffect(() => {
    if (done || manual || !liveDone) return
    const t = setTimeout(next, step === 0 ? 500 : 1600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDone, step, manual, done])

  // persiste os prêmios UMA vez — assim que o placar da FINAL aparece (não
  // precisa esperar o clique extra da cerimônia — ver comentário no `finalSeen`).
  // 🛡️ 15/08: a edição já estava GRAVADA antes desta partida? Então este
  // torneio é uma re-jogada e não vale — a tela precisa dizer isso na cara, e
  // NUNCA prometer título/prêmio (era o caso do leodiniz85).
  const [jaGravada, setJaGravada] = useState(false)
  useEffect(() => {
    if (!finalSeen) return
    const cur = loadCopaSave(seed) ?? save
    if (cur.played.includes(seasonNo)) { setJaGravada(true); return }
    const c = world.final.champion
    // 🧯 CREDITA ANTES de marcar "já joguei" (bug 10/08): se o app fechar entre os
    // dois, o prêmio não some — o reducer é idempotente por temporada, então
    // re-disparar no reload não dobra. A ordem inversa (played antes) fazia as
    // 100 moedas se perderem pra sempre.
    // 💰 prêmio POR PARTICIPAÇÃO (Diego 11/08): campeão 100 · vice 70 · semi 50 ·
    // quartas 32 · fase de grupos 10. Todo mundo que jogou leva algo (só solo — no
    // online o caixa é do host). O TÍTULO/estrela continua só do campeão (abaixo).
    const cmPrize = myIdx < 0 ? 0
      : world.final.champion === myIdx ? 100
      : (world.final.h === myIdx || world.final.a === myIdx) ? 70
      : world.sf.some(t => t.h === myIdx || t.a === myIdx) ? 50
      : world.qf.some(t => t.h === myIdx || t.a === myIdx) ? 32
      : 10
    if (cmPrize > 0) onPrize?.(cmPrize)
    const novaEntrada = { season: seasonNo, selecao: entrants[c].pais, campeao: entrants[c].club, voce: isYou(c) }
    // (emAndamento: limpa o carimbo anti-F5 — o torneio desta temporada acabou de verdade)
    saveCopaSave(seed, { ...cur, played: [...cur.played, seasonNo], mural: [...cur.mural, novaEntrada], emAndamento: null })
    onMural?.([novaEntrada]) // 🌍 espelha a conquista NOVA pro save (nuvem) na hora, sem esperar reabrir a tela
    // 🏆 REGRA DO DIEGO (04/08): campeão do MUNDO também é TÍTULO no ranking
    // Carreira — grava a linha co:solo…:copamundo (mesmo padrão da liga/Copa).
    // 🔒 09/08: só carreira NOVA (agenciaOn) conta pro ranking — mesma regra da
    // liga/Copa Legends. A carta continua garantida pra qualquer carreira.
    if (isYou(c) && agenciaOn) {
      ;(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          const displayName = stripEmoji((user.user_metadata?.display_name as string | undefined) ?? user.email?.split('@')[0] ?? 'Técnico')
          await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
            user_id: user.id, display_name: displayName,
            mode: 'cpu', season_key: `co:solo${seed}:${seasonNo}:copamundo`,
            champion: true, top_scorer: false, goals: 0,
          } })
        } catch { /* nunca trava a Copa */ }
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalSeen])

  const nextLabel = !liveDone ? '⏳ Deixa o jogo acabar…' : step < GR ? `▶️ Rodada ${step + 1} de ${GR}` : step === GR ? '🎲 Sortear o mata-mata' : step === GR + 1 ? '▶️ Jogar as quartas (ida)' : step === GR + 2 ? '▶️ Quartas — jogo de volta' : step === GR + 3 ? '▶️ Semifinais (ida)' : step === GR + 4 ? '▶️ Semis — jogo de volta' : step === GR + 5 ? '🏆 A GRANDE FINAL' : '🎉 Cerimônia'

  // cartão AO VIVO (o mesmo LiveScoreCard da liga/copa — relógio, GOOOL, bump)
  const live = (h: number, a: number, ev: ScoreGoal[]) => (
    <div style={{ marginBottom: 8 }}>
      <LiveScoreCard homeName={nm(h)} awayName={nm(a)} homeColor={GREEN} awayColor={RED}
        youIsHome={h === myIdx} goals={ev} roundKey={roundKey} roundMs={roundMs} finished={liveDone}
        footTint={{ bg: '#FFF3C2', border: '#f0d98a', holo: 0.5 }} />
    </div>
  )
  // linha compacta de confronto resolvido (ida+volta+pênaltis) — só pós-apito.
  // 🚫 winDelay > 0 (SÓ o seu confronto que foi pra pênaltis): segura o placar dos
  // pênaltis + o "avança" até a última cobrança pipocar na disputa animada de cima
  // — senão o chaveamento entregava quem passou antes de você ver a decisão.
  const tieRow = (t: KoTie, showVolta: boolean, showPens = true, winDelay = 0) => {
    const mine = isYou(t.h) || isYou(t.a)
    const fH = { bg: paisColor(entrants[t.h].pais), ink: _inkFor(paisColor(entrants[t.h].pais)), holo: 0, mark: '' } as CopaFill
    const fA = { bg: paisColor(entrants[t.a].pais), ink: _inkFor(paisColor(entrants[t.a].pais)), holo: 0, mark: '' } as CopaFill
    return (
      <div style={{ position: 'relative', overflow: 'hidden', border: `2px solid ${mine ? GOLD : '#000'}`, borderRadius: 12, boxShadow: `2px 2px 0 0 #000`, margin: '5px 0', fontSize: 11, fontWeight: mine ? 900 : 700 }}>
        {/* 🎨 faixa branca no meio com o placar (Diego 11/08) — mesmo padrão das
            outras 2 copas: cor cheia só nas laterais, placar em cima do branco. */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', overflow: 'hidden', borderTopLeftRadius: 9, borderTopRightRadius: 9 }}>
          <div style={{ flex: 1, minWidth: 0, background: fH.bg, color: fH.ink, padding: '5px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm(t.h)}</div>
          <div style={{ flex: 'none', background: '#fff', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', fontWeight: 900 }}>{t.g1![0]}×{t.g1![1]}</div>
          <div style={{ flex: 1, minWidth: 0, background: fA.bg, color: fA.ink, padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm(t.a)}</div>
        </div>
        {showVolta && (() => {
          // 🧮 os TRÊS placares na MESMA ordem do cabeçalho (mandante da ida à
          // esquerda). Antes a volta saía invertida e sem agregado nenhum: dava
          // pra somar e "provar" que quem passou foi o outro. Agora o agregado
          // aparece sempre, em negrito, pra conferência bater na hora.
          const p = placaresDoConfronto(t)
          return (
            <div style={{ padding: '3px 8px 5px', textAlign: 'center', color: INK }}>
              {winDelay > 0 && <style>{'@keyframes cmWinPop{from{opacity:0}to{opacity:1}}'}</style>}
              volta: {p.volta[0]}×{p.volta[1]} · <b>agregado {p.agregado[0]}×{p.agregado[1]}</b>
              <span style={winDelay > 0 ? { opacity: 0, animation: `cmWinPop .35s ease ${winDelay.toFixed(2)}s forwards` } : undefined}>{showPens && t.pen ? ` · pênaltis ${t.pen[0]}×${t.pen[1]}` : ''} → <b style={{ color: '#1B7A3D' }}>{nm(t.winner!)} avança</b></span>
            </div>
          )
        })()}
      </div>
    )
  }
  // o MEU confronto de volta: placar ao vivo + pênaltis com o suspense OFICIAL
  const myTieVolta = (t: KoTie) => (
    <div key={`v${t.h}`}>
      {live(t.a, t.h, t.ev2!)}
      {liveDone && t.pen && (
        <div style={{ ...box('#fff'), padding: 8, marginBottom: 8, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11, margin: '0 0 4px', textAlign: 'center' }}>🥅 AGREGADO {placaresDoConfronto(t).agregado[0]}×{placaresDoConfronto(t).agregado[1]} — DECISÃO NOS PÊNALTIS</p>
          <PensShootout pens={t.pen} aName={entrants[t.h].pais} bName={entrants[t.a].pais} colorOf={paisColor} />
        </div>
      )}
    </div>
  )

  return (
    <>
      <div style={{ position: 'relative', overflow: 'hidden', border: '3px solid #000', borderRadius: 16, boxShadow: '4px 4px 0 0 #000', padding: '16px 12px', marginBottom: 12, textAlign: 'center', background: 'linear-gradient(155deg,#1a1a1a,#0a0a0a 55%,#000)' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .5, background: 'radial-gradient(circle at 15% 20%, rgba(255,196,0,.25), transparent 22%), radial-gradient(circle at 85% 75%, rgba(255,196,0,.2), transparent 25%)' }} />
        <p style={{ position: 'relative', fontSize: 30, lineHeight: 1, margin: 0 }}>🏆</p>
        <p style={{ position: 'relative', ...OSWALD, fontWeight: 900, fontSize: 19, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: .4, background: 'linear-gradient(180deg,#FFE79A,#FFC400 55%,#B8860B)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Copa do Mundo Legends</p>
        <p style={{ position: 'relative', fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', margin: '4px 0 0' }}>temporada {seasonNo} · Você: <b style={{ color: GOLD }}>{nm(myIdx)}</b> ({club(myIdx)})</p>
        <div style={{ position: 'relative', height: 2, margin: '9px auto 0', width: '65%', background: 'linear-gradient(90deg,transparent,#FFC400,transparent)' }} />
      </div>

      {/* GRUPOS: SEU jogo ao vivo em cima (relógio da liga); tabela e os outros
          resultados só entram DEPOIS do apito — zero spoiler. */}
      {step >= 1 && step <= GR && (() => {
        const g = world.groups.find(gr => gr.teams.includes(myIdx))
        const m = g?.matches[gRound - 1]?.find(mm => mm.h === myIdx || mm.a === myIdx)
        // 🛌 grupo de 5 → cada seleção FOLGA uma rodada (bye). Sem jogo meu, mostra o aviso.
        if (m) return live(m.h, m.a, m.ev ?? [])
        return <div style={{ border: '3px solid #000', borderRadius: 14, boxShadow: '4px 4px 0 0 #000', background: '#111', padding: '8px 11px', marginBottom: 8, textAlign: 'center', fontWeight: 800, fontSize: 11, color: GOLD, ...OSWALD }}>🛌 {nm(myIdx)} folga nesta rodada — os outros jogos rolam abaixo.</div>
      })()}
      {step <= GR + 1 && (
        <>
          {world.groups.map((g, gi) => (
            <div key={gi} style={{ border: '3px solid #000', borderRadius: 14, background: '#111', boxShadow: '4px 4px 0 0 #000', padding: 10, marginBottom: 8 }}>
              <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: GOLD, textTransform: 'uppercase', letterSpacing: .5, margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: 6 }}>🏴 GRUPO {'ABCD'[gi]}<span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,196,0,.5),transparent)' }} /></p>
              {groupTable(g, shownRounds).map((r, i) => (
                <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontWeight: isYou(r.t) ? 900 : 600, background: isYou(r.t) ? 'rgba(255,196,0,.18)' : i < 2 ? 'rgba(255,255,255,.06)' : 'transparent', borderRadius: 8, padding: '4px 6px', marginBottom: 3 }}>
                  <span style={{ width: 12, color: 'rgba(255,255,255,.4)' }}>{i + 1}</span>
                  <span style={{ width: 10, height: 10, borderRadius: 3, flex: 'none', background: paisColor(entrants[r.t].pais), border: '1px solid rgba(255,255,255,.35)' }} />
                  <span style={{ flex: 1, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm(r.t)} <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 8.5 }}>· {club(r.t)}</span></span>
                  <span style={{ fontWeight: 900, color: '#fff' }}>{r.pts}pt</span><span style={{ color: 'rgba(255,255,255,.7)' }}>{r.w}V</span><span style={{ color: 'rgba(255,255,255,.7)' }}>{r.sg > 0 ? '+' : ''}{r.sg}</span>
                </div>
              ))}
              {step >= 1 && step <= GR && !liveDone && g.matches[gRound - 1]?.filter(m => m.h !== myIdx && m.a !== myIdx).map((m, k) => (
                <MiniLive key={k} nmH={nm(m.h)} nmA={nm(m.a)} hPais={entrants[m.h].pais} aPais={entrants[m.a].pais} ev={m.ev ?? []} min={liveMin} />
              ))}
              {shownRounds > 0 && liveDone && (
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)', margin: '4px 0 0' }}>
                  rodada {shownRounds}: {g.matches[shownRounds - 1].map(m => `${flagOf(entrants[m.h].pais)} ${m.gh}×${m.ga} ${flagOf(entrants[m.a].pais)}`).join(' · ')}
                </p>
              )}
            </div>
          ))}
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.5)', textAlign: 'center', margin: '0 0 8px' }}>classificam 2 por grupo · desempate: vitórias, depois saldo</p>
        </>
      )}

      {/* MATA-MATA: seu confronto ao vivo; os demais aparecem pós-apito */}
      {step >= GR + 2 && !done && (() => {
        const myQf = world.qf.find(t => isYou(t.h) || isYou(t.a))
        const mySf = world.sf.find(t => isYou(t.h) || isYou(t.a))
        return (
          <>
            {step === GR + 2 && myQf && live(myQf.h, myQf.a, myQf.ev1!)}
            {step === GR + 3 && myQf && myTieVolta(myQf)}
            {step === GR + 4 && mySf && live(mySf.h, mySf.a, mySf.ev1!)}
            {step === GR + 5 && mySf && myTieVolta(mySf)}
            {step === GR + 6 && live(world.final.h, world.final.a, world.final.ev)}
            {step === GR + 6 && liveDone && world.final.pen && (
              <div style={{ border: '3px solid #000', borderRadius: 14, background: '#111', boxShadow: '4px 4px 0 0 #000', padding: 8, marginBottom: 8 }}>
                <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11, margin: '0 0 4px', textAlign: 'center', color: GOLD }}>🥅 FINAL DECIDIDA NOS PÊNALTIS</p>
                <PensShootout pens={world.final.pen} aName={entrants[world.final.h].pais} bName={entrants[world.final.a].pais} colorOf={paisColor} />
              </div>
            )}
            <div style={{ border: '3px solid #000', borderRadius: 14, background: '#111', boxShadow: '4px 4px 0 0 #000', padding: 10, marginBottom: 8 }}>
              <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, color: GOLD, textTransform: 'uppercase', letterSpacing: .5, margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: 6 }}>⚔️ MATA-MATA <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'none' }}>(sorteio livre — ida e volta)</span><span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,196,0,.5),transparent)' }} /></p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6 }}>
                {world.qf.map((t, i) => {
                  const mine = isYou(t.h) || isYou(t.a)
                  if (step === GR + 2) return <div key={i}>{!mine && liveDone ? tieRow(t, false) : !mine ? <MiniLive nmH={nm(t.h)} nmA={nm(t.a)} hPais={entrants[t.h].pais} aPais={entrants[t.a].pais} ev={t.ev1!} min={liveMin} /> : null}</div>
                  if (step === GR + 3) return <div key={i}>{liveDone ? tieRow(t, true, true, mine && t.pen ? pensRevealDelay(t.pen) : 0) : mine ? null : <MiniLive nmH={nm(t.a)} nmA={nm(t.h)} hPais={entrants[t.a].pais} aPais={entrants[t.h].pais} ev={t.ev2!} min={liveMin} />}</div>
                  if (step === GR + 1) return <div key={i} style={{ borderTop: '2px solid rgba(255,255,255,.12)', padding: '5px 2px', fontSize: 11, fontWeight: mine ? 900 : 700, color: '#fff' }}>{nm(t.h)} × {nm(t.a)}</div>
                  return <div key={i}>{tieRow(t, true)}</div>
                })}
              </div>
              {step >= GR + 4 && (<>
                <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '8px 0 4px', color: GOLD }}>SEMIFINAIS</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6 }}>
                  {world.sf.map((t, i) => {
                    const mine = isYou(t.h) || isYou(t.a)
                    if (step === GR + 4) return <div key={i}>{!mine && liveDone ? tieRow(t, false) : !mine ? <MiniLive nmH={nm(t.h)} nmA={nm(t.a)} hPais={entrants[t.h].pais} aPais={entrants[t.a].pais} ev={t.ev1!} min={liveMin} /> : null}</div>
                    if (step === GR + 5) return <div key={i}>{liveDone ? tieRow(t, true, true, mine && t.pen ? pensRevealDelay(t.pen) : 0) : mine ? null : <MiniLive nmH={nm(t.a)} nmA={nm(t.h)} hPais={entrants[t.a].pais} aPais={entrants[t.h].pais} ev={t.ev2!} min={liveMin} />}</div>
                    return <div key={i}>{tieRow(t, true)}</div>
                  })}
                </div>
              </>)}
              {step === GR + 6 && liveDone && (
                <>
                  <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '8px 0 4px', color: GOLD }}>🏆 FINAL ÚNICA</p>
                  {world.final.pen && <style>{'@keyframes cmWinPop{from{opacity:0}to{opacity:1}}'}</style>}
                  <p style={{ fontSize: 12, fontWeight: 900, margin: 0, color: '#fff' }}>{nm(world.final.h)} {world.final.g[0]}×{world.final.g[1]} {nm(world.final.a)}{world.final.pen ? <span style={{ opacity: 0, animation: `cmWinPop .35s ease ${pensRevealDelay(world.final.pen).toFixed(2)}s forwards` }}> · pênaltis {world.final.pen[0]}×{world.final.pen[1]}</span> : ''}</p>
                </>
              )}
            </div>
          </>
        )
      })()}

      {step === GR + 1 && (
        <div style={{ ...box('#fff'), padding: 10, marginBottom: 8, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '0 0 4px' }}>🎲 O SORTEIO DAS QUARTAS (ida e volta)</p>
          {world.qf.map((t, i) => (
            <div key={i} style={{ borderTop: '2px solid rgba(0,0,0,.08)', padding: '5px 2px', fontSize: 11, fontWeight: isYou(t.h) || isYou(t.a) ? 900 : 700 }}>{nm(t.h)} × {nm(t.a)}{(isYou(t.h) || isYou(t.a)) ? ' 👈 VOCÊ' : ''}</div>
          ))}
        </div>
      )}

      {/* CERIMÔNIA */}
      {done && (
        <div style={{ ...box(isYou(world.final.champion) ? `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)` : '#fff'), padding: 14, marginBottom: 10, borderRadius: 14, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {isYou(world.final.champion) && <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(115deg,transparent 32%,rgba(255,255,255,.7) 48%,transparent 60%)', backgroundSize: '250% 250%', animation: 'cmSheen 2.4s linear infinite' }} />}
          <p style={{ fontSize: 34, margin: 0, position: 'relative' }}>🏆</p>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 17, margin: '2px 0 0', textTransform: 'uppercase', position: 'relative' }}>{nm(world.final.champion)} CAMPEÃO DO MUNDO!</p>
          <p style={{ fontSize: 10.5, fontWeight: 800, margin: '3px 0 0', position: 'relative' }}>{jaGravada ? <>⚠️ Esta edição JÁ tinha sido decidida antes — o que vale é o resultado que está no mural. Este torneio foi só um treino: <b>não conta título nem prêmio</b>.</> : isYou(world.final.champion) ? <>VOCÊ ({club(world.final.champion)}) entrou pra história: ⭐ estrela eterna no mural{onPrize ? ' + 💰 100 MOEDAS no caixa do clube' : ''}. 🎉</> : <>Título de {club(world.final.champion)}. A próxima Copa é na temporada {seasonNo + 10} — treina o dedo. 😤</>}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '6px 0 0', position: 'relative' }}>final: {nm(world.final.h)} {world.final.g[0]}×{world.final.g[1]} {nm(world.final.a)}{world.final.pen ? ` (pên. ${world.final.pen[0]}×${world.final.pen[1]})` : ''}</p>
        </div>
      )}
      {/* 🎴 CARTA DO CAMPEÃO DO MUNDO — só pra quem venceu (privada). Igual às
          outras copas: a carta é gravada na conta NA HORA (conta mesmo sem abrir). */}
      {finalSeen && isYou(world.final.champion) && !jaGravada && (
        <div style={{ marginBottom: 10 }}>
          {/* 🌍 REGRA DO DIEGO (04/08): "tudo que é campeão conta carta" — chave de
              CARREIRA (co:solo…:copamundo): a carta SOMA no ranking Carreira da
              home, e o onCard leva pro cofre do empresário, igual liga e Copa.
              🐛 (07/08) gatilho trocado de `done` pra `finalSeen`: a carta
              já grava (persist automático dentro do componente) assim que o
              placar da final aparece, sem depender do clique da cerimônia. */}
          <CardCollectPrompt seasonKey={`co:solo${seed}:${seasonNo}:copamundo`} origin="cpu" onGuaranteed={c => onCard?.(c, `co:solo${seed}:${seasonNo}:copamundo`)} />
        </div>
      )}
      {done && (() => {
        const tally: Record<string, { goals: number; team: number }> = {}
        const add = (evs: ScoreGoal[] | undefined, h: number, a: number) => { for (const e of evs ?? []) { const t = e.home ? h : a; const k = e.name + '|' + t; tally[k] = { goals: (tally[k]?.goals ?? 0) + 1, team: t } } }
        for (const g of world.groups) for (const rd of g.matches) for (const m of rd) add(m.ev, m.h, m.a)
        for (const t of [...world.qf, ...world.sf]) { add(t.ev1, t.h, t.a); add(t.ev2, t.a, t.h) }
        add(world.final.ev, world.final.h, world.final.a)
        const top = Object.entries(tally).map(([k, v]) => ({ name: k.split('|')[0], ...v })).sort((x, y) => y.goals - x.goals).slice(0, 8)
        return (
          <div style={{ ...box('#fff'), padding: 10, marginBottom: 10, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}` }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11.5, margin: '0 0 4px', textTransform: 'uppercase' }}>⚽ Artilharia da Copa</p>
            {top.map((r, i) => (
              <div key={r.name + r.team} style={{ display: 'flex', gap: 6, fontSize: 10.5, fontWeight: entrants[r.team].you ? 900 : 600, background: entrants[r.team].you ? '#FFE9B0' : 'transparent', borderRadius: 6, padding: '2px 5px' }}>
                <span style={{ width: 16 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name} <span style={{ fontSize: 9, color: 'rgba(0,0,0,.5)' }}>{flagOf(entrants[r.team].pais)}</span></span>
                <span style={{ fontWeight: 900 }}>{r.goals} gol{r.goals > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )
      })()}
      {done && (
        <div style={{ ...box('#0C0C0C'), padding: 10, marginBottom: 10, borderRadius: 12 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11.5, margin: '0 0 4px', color: GOLD, textTransform: 'uppercase' }}>📜 Mural dos Campeões do Mundo</p>
          {[...save.mural, { season: seasonNo, selecao: entrants[world.final.champion].pais, campeao: entrants[world.final.champion].club, voce: isYou(world.final.champion) }]
            .filter((m, i, arr) => arr.findIndex(x => x.season === m.season) === i)
            .map(m => (
              <p key={m.season} style={{ fontSize: 10.5, fontWeight: m.voce ? 900 : 700, color: m.voce ? GOLD : 'rgba(255,255,255,.85)', margin: '2px 0 0' }}>
                temporada {m.season} · {flagOf(m.selecao)} {m.selecao} — {m.campeao}{m.voce ? ' ⭐ (VOCÊ)' : ''}
              </p>
            ))}
        </div>
      )}

      {done ? (
        <button onClick={onClose} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 14, ...OSWALD, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer' }}>▶️ VOLTAR PRA CARREIRA</button>
      ) : hasManual ? (
        <>
          {manual && <SpeedControls speed={speed} onSet={setSpeed} />}
          <SimControls manual={manual} onToggle={toggleManual} canNext={liveDone} onNext={next} onSkip={skip} nextLabel={nextLabel} />
        </>
      ) : (
        <>
          <p style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(0,0,0,.55)', textAlign: 'center', margin: '0 0 8px' }}>{liveDone ? '⚡ A Copa anda sozinha — próxima fase já vem…' : '🟢 bola rolando…'}</p>
          <QuickManualLock />
        </>
      )}
    </>
  )
}

const isYouE = (e: Entrant) => e.you
