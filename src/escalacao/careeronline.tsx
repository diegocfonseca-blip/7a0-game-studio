// ─── CARREIRA ONLINE · 4 DIVISÕES (em construção — só testers) ────────
// Modo grande, montado em fases. Isolado (igual o Manager) e travado no login
// dos testers via useCanCareerOnline. Nada aqui afeta o resto do jogo.
//
// FASE 2: entrada gated + escolha de baralho.
// FASE 3: motor das 4 ligas (mundo + simulação de temporada).
// FASE 4: artilharia geral ligada ao baralho.
// FASE 5 (esta): motor de RODADAS — joga rodada a rodada, com a "rodada ao
//   vivo" (jogos das 4 divisões) e a tabela/artilharia atualizando ao longo da
//   temporada. Ainda LOCAL; a sincronia online multiplayer é a próxima fase.

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { stripEmoji } from './apoio'
import { resilientWrite } from './pending'
import { useCanCareerOnline } from './admin'
import { CollectibleCard } from './screens'
import { DIVISION_TEAMS, CATALOG, CATALOG_EU, CATALOG_BOTH } from './data'

const CARD_PICK_SECONDS = 45

const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const BLUE = '#2563EB'
const RED = '#E8503A'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

export type DeckChoice = 'br' | 'eu' | 'both'

type Div = 'A' | 'B' | 'C' | 'D'
const DIVS: Div[] = ['A', 'B', 'C', 'D']
const DIV_LABEL: Record<Div, string> = { A: '🏆 Série A', B: '🥈 Série B', C: '🥉 Série C', D: 'Série D' }
const DIV_NAME: Record<Div, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }
const DIV_BASE: Record<Div, number> = { A: 80, B: 71, C: 63, D: 55 }
const DIV_TAG: Record<Div, { l: string; bg: string }> = { A: { l: 'A', bg: '#B8892B' }, B: { l: 'B', bg: '#3E8E4E' }, C: { l: 'C', bg: '#9A7B33' }, D: { l: 'D', bg: '#7A7460' } }

interface Team { name: string; str: number; you?: boolean; hum?: boolean; hidx?: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }
interface Match { h: string; a: string; gh: number; ga: number; you?: boolean; hum?: boolean }
interface Scorer { name: string; team: string; div: Div; goals: number; you?: boolean; hum?: boolean }
interface Career { seed: number; deck: DeckChoice; world: Record<Div, Team[]>; fix: Record<Div, number[][][]>; round: number; last: Record<Div, Match[]> | null; season: number }

// mundo de início de temporada compactado pra sincronizar na sala (o `you` é
// derivado no aparelho por hidx — cada um se destaca sem alterar a simulação)
type PackTeam = { n: string; s: number; h?: 1; hi?: number }
function packWorld(w: Record<Div, Team[]>): Record<Div, PackTeam[]> {
  const out = {} as Record<Div, PackTeam[]>
  for (const d of DIVS) out[d] = w[d].map(t => ({ n: t.name, s: t.str, ...(t.hum ? { h: 1 as const } : {}), ...(t.hidx != null ? { hi: t.hidx } : {}) }))
  return out
}
function unpackWorld(pk: Record<Div, PackTeam[]>, myIdx: number): Record<Div, Team[]> {
  const out = {} as Record<Div, Team[]>
  for (const d of DIVS) out[d] = (pk[d] ?? []).map(t => ({ name: t.n, str: t.s, hum: !!t.h, hidx: t.hi, you: t.hi != null && t.hi === myIdx, ...blankStats() }))
  return out
}
// (re)marca quem sou eu no mundo já montado (por hidx)
function markYou(w: Record<Div, Team[]>, myIdx: number) { for (const d of DIVS) for (const t of w[d]) t.you = t.hidx != null && t.hidx === myIdx }

// amigos humanos (simulação): você na Série D + outros espalhados pela pirâmide
const FRIEND_NAMES = ['vfranca', 'Serginho zava', 'Don Julio', 'Pavanelli', 'Bruno FC', 'Marcelo', 'Zé da Bola']

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function poisson(lambda: number, rng: () => number) { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }

function blankStats() { return { w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 } }
// monta as 4 divisões e coloca os humanos: você (Meu Time) na Série D e os
// `friends` amigos espalhados pelas divisões (A/B/C/D em rodízio).
function buildWorld(seed: number, friends: number): Record<Div, Team[]> {
  const rng = mulberry(seed)
  const world = {} as Record<Div, Team[]>
  for (const d of DIVS) {
    const pool = DIVISION_TEAMS[d].slice(0, 20)
    world[d] = pool.map(t => ({ name: t.team, str: DIV_BASE[d] + Math.round((rng() - 0.5) * 14), ...blankStats() }))
  }
  // você sempre começa na Série D (último slot)
  world.D[19] = { name: 'Meu Time', str: DIV_BASE.D + 2, you: true, hum: true, hidx: 0, ...blankStats() }
  // amigos espalhados: A, B, C, D, A... (usa slot 0,1,2... de cada divisão)
  const slotUsed: Record<Div, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (let i = 0; i < friends; i++) {
    const d = DIVS[i % 4]
    const slot = slotUsed[d]++
    if (d === 'D' && slot >= 19) continue // não pisa no seu slot
    world[d][slot] = { name: FRIEND_NAMES[i % FRIEND_NAMES.length], str: DIV_BASE[d] + Math.round((rng() - 0.3) * 12), hum: true, ...blankStats() }
  }
  return world
}

// tabela de rodadas (returno duplo) pelo método do círculo — 20 times = 38 rodadas
function roundRobin(n: number): number[][][] {
  const idx = [...Array(n).keys()]
  const turno: number[][][] = []
  for (let r = 0; r < n - 1; r++) {
    const pairs: number[][] = []
    for (let i = 0; i < n / 2; i++) { const h = idx[i], a = idx[n - 1 - i]; pairs.push(r % 2 ? [a, h] : [h, a]) }
    turno.push(pairs)
    idx.splice(1, 0, idx.pop() as number)
  }
  const returno = turno.map(rd => rd.map(([h, a]) => [a, h]))
  return [...turno, ...returno]
}
function buildFix(): Record<Div, number[][][]> {
  const f = {} as Record<Div, number[][][]>
  for (const d of DIVS) f[d] = roundRobin(20)
  return f
}

// ── lançamento a partir de uma SALA online (multiplayer) ──
// A sala manda o código (vira semente determinística: TODOS os aparelhos
// montam o MESMO mundo e a mesma temporada) + os nomes reais dos técnicos e
// qual deles sou eu. Cada aparelho só destaca a si próprio (you) — isso não
// muda a simulação, que é idêntica em todos.
export interface CareerLaunch { roomId: string; roomCode: string; deck: DeckChoice; players: string[]; myIndex: number; isHost: boolean; base: Record<string, unknown> }
let pendingLaunch: CareerLaunch | null = null
export function launchCareerOnline(cfg: CareerLaunch) {
  pendingLaunch = cfg
  if (window.location.hash !== '#carreiraonline') window.location.hash = 'carreiraonline'
  else window.dispatchEvent(new HashChangeEvent('hashchange'))
}
// semente estável a partir do código da sala (FNV-1a) — mesmo código, mesmo mundo
function codeSeed(code: string): number { let h = 2166136261; for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

// mundo com os técnicos REAIS espalhados pela pirâmide (A,B,C,D em rodízio).
// `myIdx` = minha posição na lista → só eu fico marcado como `you`.
function buildWorldMulti(seed: number, players: string[], myIdx: number): Record<Div, Team[]> {
  const rng = mulberry(seed)
  const world = {} as Record<Div, Team[]>
  for (const d of DIVS) {
    const pool = DIVISION_TEAMS[d].slice(0, 20)
    world[d] = pool.map(t => ({ name: t.team, str: DIV_BASE[d] + Math.round((rng() - 0.5) * 14), ...blankStats() }))
  }
  const slotUsed: Record<Div, number> = { A: 0, B: 0, C: 0, D: 0 }
  players.forEach((name, i) => {
    const d = DIVS[i % 4]
    const slot = slotUsed[d]++
    if (slot > 19) return
    world[d][slot] = { name, str: DIV_BASE[d] + Math.round((rng() - 0.3) * 12), you: i === myIdx, hum: true, hidx: i, ...blankStats() }
  })
  return world
}

// reconstrói a temporada a partir de um mundo de início (já com o `you`
// marcado) até uma rodada alvo — replay determinístico das rodadas.
function careerFrom(startWorld: Record<Div, Team[]>, seed: number, deck: DeckChoice, fix: Record<Div, number[][][]>, round: number, season: number): Career {
  let world = startWorld
  let last: Record<Div, Match[]> | null = null
  for (let r = 0; r < round; r++) {
    const res = playRound({ seed, deck, world, fix, round: r, last, season })
    world = res.world; last = res.last
  }
  return { seed, deck, world, fix, round, last, season }
}

// nova temporada: aplica acessos e quedas (top4 sobe, últimos 4 caem por
// divisão) e zera as estatísticas, preservando nome/força/humano/hidx.
function nextSeasonWorld(final: Record<Div, Team[]>): Record<Div, Team[]> {
  const order = {} as Record<Div, Team[]>
  for (const d of DIVS) order[d] = sortDiv(final[d])
  const up = (d: Div) => order[d].slice(0, 4)          // acessos (top 4)
  const down = (d: Div) => order[d].slice(-4)          // rebaixados (últimos 4)
  const mid = (d: Div, a: number, b: number) => order[d].slice(a, b)
  const arranged: Record<Div, Team[]> = {
    A: [...mid('A', 0, 16), ...up('B')],
    B: [...mid('B', 4, 16), ...down('A'), ...up('C')],
    C: [...mid('C', 4, 16), ...down('B'), ...up('D')],
    D: [...mid('D', 4, 20), ...down('C')],
  }
  const out = {} as Record<Div, Team[]>
  for (const d of DIVS) out[d] = arranged[d].map(t => ({ name: t.name, str: t.str, hum: t.hum, hidx: t.hidx, ...blankStats() }))
  return out
}

// joga UMA rodada em todas as divisões — PURO: clona as tabelas e devolve o
// novo mundo + os placares (não muta o estado anterior, seguro no StrictMode).
function playRound(c: Career): { world: Record<Div, Team[]>; last: Record<Div, Match[]> } {
  const rng = mulberry((c.seed ^ (c.round * 2654435761)) >>> 0)
  const world = {} as Record<Div, Team[]>
  const res = {} as Record<Div, Match[]>
  for (const d of DIVS) {
    const teams = c.world[d].map(t => ({ ...t }))
    const pairs = c.fix[d][c.round] ?? []
    const ms: Match[] = []
    for (const [hi, ai] of pairs) {
      const H = teams[hi], A = teams[ai]
      const diff = (H.str - A.str) / 22
      const gh = poisson(Math.max(0.15, 1.45 + diff + 0.25), rng)
      const ga = poisson(Math.max(0.15, 1.15 - diff), rng)
      H.gf += gh; H.ga += ga; A.gf += ga; A.ga += gh
      if (gh > ga) { H.w++; H.pts += 3; A.l++ } else if (gh < ga) { A.w++; A.pts += 3; H.l++ } else { H.d++; A.d++; H.pts++; A.pts++ }
      ms.push({ h: H.name, a: A.name, gh, ga, you: H.you || A.you, hum: H.hum || A.hum })
    }
    world[d] = teams
    res[d] = ms
  }
  return { world, last: res }
}
function sortDiv(ts: Team[]) { return [...ts].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf) }

function pickScorers(world: Record<Div, Team[]>, deck: DeckChoice, seed: number): Scorer[] {
  const cat = deck === 'eu' ? CATALOG_EU : deck === 'both' ? CATALOG_BOTH : CATALOG
  const pool = [...cat.ATA, ...cat.MEI].map(c => c.name)
  const rng = mulberry((seed ^ 0x51ED2C) >>> 0)
  const sh = pool.slice()
  for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[sh[i], sh[j]] = [sh[j], sh[i]] }
  let pi = 0
  const rows: Scorer[] = []
  for (const d of DIVS) for (const t of world[d]) {
    const s1 = sh[pi++ % sh.length], s2 = sh[pi++ % sh.length]
    const g1 = Math.round(t.gf * (0.26 + rng() * 0.12))
    const g2 = Math.round(t.gf * (0.15 + rng() * 0.08))
    if (g1 > 0) rows.push({ name: s1, team: t.name, div: d, goals: g1, you: t.you, hum: t.hum })
    if (g2 > 0) rows.push({ name: s2, team: t.name, div: d, goals: g2, you: t.you, hum: t.hum })
  }
  rows.sort((a, b) => b.goals - a.goals)
  return rows.slice(0, 20)
}

interface CardOpt { name: string; club: string; year: number; pos: string; fame: number; folk?: boolean; promessa?: boolean }
// onde EU terminei: divisão, posição, se fui campeão, e o nome do meu time
function myOutcome(world: Record<Div, Team[]>): { div: Div; pos: number; champ: boolean; team: string } | null {
  for (const d of DIVS) {
    const sorted = sortDiv(world[d])
    const i = sorted.findIndex(t => t.you)
    if (i >= 0) return { div: d, pos: i + 1, champ: i === 0, team: sorted[i].name }
  }
  return null
}
function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
// ELENCO do time do campeão: cartas por posição tiradas do baralho, estável
// por time — é entre esses jogadores que o campeão escolhe (igual ao modo
// offline, onde você escolhe uma carta do seu próprio time). Traz de lendas
// douradas a bons jogadores, conforme o sorteio do elenco.
function teamSquad(deck: DeckChoice, seed: number, teamName: string): CardOpt[] {
  const cat = deck === 'eu' ? CATALOG_EU : deck === 'both' ? CATALOG_BOTH : CATALOG
  const rng = mulberry((seed ^ hashStr(teamName)) >>> 0)
  const toOpt = (c: { name: string; club: string; year: number; fame: number; folk?: boolean; promessa?: boolean }, pos: string): CardOpt => ({ name: c.name, club: c.club, year: c.year, pos, fame: c.fame, folk: c.folk, promessa: c.promessa })
  const drawN = (arr: { name: string; club: string; year: number; fame: number; folk?: boolean; promessa?: boolean }[], pos: string, n: number): CardOpt[] => {
    const sh = arr.slice()
    for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[sh[i], sh[j]] = [sh[j], sh[i]] }
    return sh.slice(0, n).map(c => toOpt(c, pos))
  }
  // elenco espalhado pelas posições (11 titulares + reservas ~ 15)
  const squad = [...drawN(cat.GOL, 'GOL', 2), ...drawN(cat.ZAG, 'ZAG', 3), ...drawN(cat.LAT, 'LAT', 3), ...drawN(cat.MEI, 'MEI', 4), ...drawN(cat.ATA, 'ATA', 3)]
  const seen = new Set<string>(); const out: CardOpt[] = []
  for (const c of squad) { if (seen.has(c.name)) continue; seen.add(c.name); out.push(c) }
  return out
}

export function CareerOnlineButton() {
  const can = useCanCareerOnline()
  if (!can) return (
    <div style={{ width: '100%', boxSizing: 'border-box', background: '#e7e3d7', color: '#8a8577', border: '2px solid #bdb7a6', borderRadius: 99, padding: '9px 16px', fontWeight: 800, fontSize: 14, textAlign: 'center', marginTop: 2, ...OSWALD, cursor: 'default' }}>
      🌐 Carreira Online · 4 divisões <span style={{ opacity: 0.85 }}>(em breve)</span>
    </div>
  )
  return (
    <button onClick={() => { window.location.hash = 'carreiraonline' }} style={{ width: '100%', boxSizing: 'border-box', background: BLUE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '9px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 2, ...OSWALD }}>
      🌐 Carreira Online · 4 divisões <span style={{ color: GOLD }}>(teste)</span>
    </button>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: CREAM, color: INK, zIndex: 9000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 64px' }}>{children}</div>
    </div>
  )
}
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })

// ── rodada ao vivo: os jogos das 4 divisões da rodada atual ──
function RoundView({ c, onNext, onTable, onExit, paused, onTogglePause, canControl = true }: { c: Career; onNext: () => void; onTable: () => void; onExit: () => void; paused: boolean; onTogglePause: () => void; canControl?: boolean }) {
  const done = c.round >= 38
  return (
    <div>
      <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>🗓️ {done ? 'Temporada encerrada' : `Rodada ${c.round}/38`}</span>
        {!done && (paused ? <span style={{ fontSize: 10.5, fontWeight: 700, color: '#bbb' }}>⏸️ pausado</span> : <span style={{ fontSize: 10.5, fontWeight: 700, color: '#ff5b4d', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: '#ff5b4d', display: 'inline-block' }} /> AO VIVO</span>)}
      </div>

      {c.last ? DIVS.map(d => (
        <div key={d} style={{ ...box('#fff'), padding: 9, marginBottom: 10 }}>
          <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, marginBottom: 5 }}>{DIV_LABEL[d]}</p>
          {c.last![d].map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 5, padding: '2.5px 2px', borderTop: i ? '1px solid rgba(0,0,0,0.07)' : 'none', background: m.you ? GOLD : m.hum ? '#FFE0D6' : undefined, borderRadius: (m.you || m.hum) ? 5 : 0 }}>
              <span style={{ textAlign: 'right', fontWeight: (m.you || m.hum) ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.h}</span>
              <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD, background: (m.you || m.hum) ? INK : '#eee', color: (m.you || m.hum) ? '#fff' : INK, borderRadius: 5, padding: '0 7px' }}>{m.gh}×{m.ga}</span>
              <span style={{ textAlign: 'left', fontWeight: (m.you || m.hum) ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#5a5647' }}>{m.a}</span>
            </div>
          ))}
        </div>
      )) : (
        <div style={{ ...box('#FFF6DE'), padding: 14, textAlign: 'center', marginBottom: 12 }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: '#666', margin: 0 }}>As rodadas vão rolando sozinhas nas 4 divisões — pause quando quiser.</p>
        </div>
      )}

      {done
        ? <div style={{ ...box(GOLD), padding: 13, textAlign: 'center', marginBottom: 9 }}><p style={{ fontWeight: 900, fontSize: 15, ...OSWALD, margin: 0 }}>🏁 Temporada encerrada! Veja a classificação final.</p></div>
        : canControl ? <>
            <button onClick={onTogglePause} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: paused ? GREEN : '#fff', color: paused ? '#fff' : INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>{paused ? '▶️ Retomar (automático)' : '⏸️ Pausar'}</button>
            {paused && <button onClick={onNext} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 14, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>⏭️ Próxima rodada (manual)</button>}
          </> : <div style={{ ...box('#EAF3FF'), padding: 11, textAlign: 'center', marginBottom: 9 }}><p style={{ fontWeight: 800, fontSize: 12.5, color: '#3a5a8a', margin: 0 }}>⏱️ O host controla o ritmo das rodadas.</p></div>}
      <button onClick={onTable} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 14, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 12 }}>📊 Tabela + artilharia</button>
      <button onClick={onExit} className="text-black/40 text-xs font-semibold underline" style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', cursor: 'pointer', ...OSWALD }}>sair do jogo</button>
    </div>
  )
}

// legenda de zonas no padrão do modo offline (chips coloridos)
function ZoneLegend() {
  const chip = (bg: string, label: string, border = false) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <i style={{ width: 10, height: 10, borderRadius: 3, display: 'inline-block', background: bg, border: border ? '1px solid rgba(0,0,0,0.2)' : 'none' }} />{label}
    </span>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>
      {chip('#D6E9FA', 'G4')}{chip('#fff', 'Meio', true)}{chip('#F9D8D3', 'Z4')}
    </div>
  )
}

// ── as 4 tabelas de divisão — mesmo visual da TABELA do modo offline ──
function DivTables({ c }: { c: Career }) {
  const zone = (rank: number, n: number) => rank <= 4 ? '#D6E9FA' : rank > n - 4 ? '#F9D8D3' : undefined
  const th: React.CSSProperties = { color: 'rgba(0,0,0,0.7)', fontWeight: 900, fontSize: 10.5 }
  return (
    <>
      {DIVS.map(d => {
        const sorted = sortDiv(c.world[d])
        return (
          <div key={d} style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>{DIV_LABEL[d]}</p>
              <ZoneLegend />
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>P</th><th style={{ ...th, textAlign: 'center' }}>V</th><th style={{ ...th, textAlign: 'center' }}>E</th><th style={{ ...th, textAlign: 'center' }}>D</th><th style={{ ...th, textAlign: 'center' }}>SG</th></tr></thead>
              <tbody>
                {sorted.map((t, i) => {
                  const rank = i + 1
                  const other = t.hum && !t.you
                  return (
                    <tr key={t.name + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', background: t.you ? GOLD : other ? '#FFE0D6' : zone(rank, sorted.length), fontWeight: (t.you || t.hum) ? 800 : 500 }}>
                      <td style={{ paddingRight: 4 }}>{rank}</td>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{t.you ? '👤 ' : other ? '🔥 ' : ''}{t.name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.pts}</td>
                      <td style={{ textAlign: 'center' }}>{t.w}</td>
                      <td style={{ textAlign: 'center' }}>{t.d}</td>
                      <td style={{ textAlign: 'center' }}>{t.l}</td>
                      <td style={{ textAlign: 'center' }}>{t.gf - t.ga}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </>
  )
}

// ── artilharia geral — mesmo visual da ARTILHARIA do modo offline ──
function ScorersBox({ c }: { c: Career }) {
  const scorers = pickScorers(c.world, c.deck, c.seed)
  const th: React.CSSProperties = { color: 'rgba(0,0,0,0.6)', fontWeight: 900, fontSize: 10.5 }
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, marginBottom: 8 }}>⚽ ARTILHARIA · TEMPO REAL</p>
      {scorers.length === 0 ? <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>Sem gols ainda. Bola rolando…</p> : (
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Jogador</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Gols</th></tr></thead>
          <tbody>
            {scorers.map((s, i) => (
              <tr key={s.name + s.team + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', fontWeight: 600, background: s.you ? GOLD : s.hum ? '#FFE0D6' : undefined }}>
                <td style={{ paddingRight: 4 }}>{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}><span style={{ display: 'inline-block', fontSize: 8, fontWeight: 800, color: '#fff', background: DIV_TAG[s.div].bg, borderRadius: 4, padding: '0 4px', marginRight: 4, verticalAlign: 'middle' }}>{DIV_TAG[s.div].l}</span>{s.name}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110, color: 'rgba(0,0,0,0.7)' }}>{s.you ? '👤 ' : s.hum ? '🔥 ' : ''}{s.team}</td>
                <td style={{ textAlign: 'center', fontWeight: 900 }}>{s.goals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── classificação das 4 divisões + artilharia geral ──
function Standings({ c, onBack, onExit }: { c: Career; onBack: () => void; onExit: () => void }) {
  return (
    <div>
      <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 16, ...OSWALD, margin: 0 }}>📊 Classificação · rodada {c.round}/38</p>
        <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>🟡 Você · 🔥 Rivais · 🔵 Acesso (G4) · 🔴 Queda (Z4)</p>
      </div>
      <DivTables c={c} />
      <ScorersBox c={c} />
      <button onClick={onBack} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 15, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 12 }}>← Voltar pra rodada</button>
      <button onClick={onExit} className="text-black/40 text-xs font-semibold underline" style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', cursor: 'pointer', ...OSWALD }}>sair do jogo</button>
    </div>
  )
}

// ── carta-lembrança do campeão (visual padrão, grava no álbum) ──
function ChampionCard({ deck, seed, team, seasonKey }: { deck: DeckChoice; seed: number; team: string; seasonKey: string }) {
  const [status, setStatus] = useState<'checking' | 'noauth' | 'picking' | 'revealed'>('checking')
  const [claimed, setClaimed] = useState<CardOpt | null>(null)
  const [deadline] = useState(() => Date.now() + CARD_PICK_SECONDS * 1000)
  const [now, setNow] = useState(() => Date.now())
  const claimingRef = useRef(false)
  const opts = useRef<CardOpt[]>(teamSquad(deck, seed, team)).current

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('noauth'); return }
      const { data } = await supabase.from('user_cards').select('*').eq('user_id', user.id).eq('season_key', seasonKey).maybeSingle()
      if (data) { setClaimed({ name: data.card_name, club: data.card_club, year: data.card_year, pos: data.card_pos, fame: data.card_fame }); setStatus('revealed') }
      else setStatus('picking')
    })()
  }, [seasonKey])

  useEffect(() => { if (status !== 'picking') return; const iv = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(iv) }, [status])
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))

  async function claim(card: CardOpt) {
    if (claimingRef.current) return
    claimingRef.current = true
    let user
    try { user = (await supabase.auth.getUser()).data.user } catch { user = null }
    if (!user) { setStatus('noauth'); claimingRef.current = false; return }
    // gravação RESILIENTE: se o backend cair, guarda no aparelho e re-tenta ao
    // reabrir — a carta do campeão da carreira online não se perde numa queda.
    await resilientWrite({ table: 'user_cards', row: { user_id: user.id, season_key: seasonKey, origin: 'online', card_name: card.name, card_club: card.club, card_year: card.year, card_pos: card.pos, card_fame: card.fame } })
    setClaimed(card); setStatus('revealed')
  }
  useEffect(() => {
    if (status !== 'picking' || remaining > 0) return
    const pick = opts[Math.floor(Math.random() * opts.length)]
    if (pick) claim(pick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, status])

  if (status === 'checking') return null
  if (status === 'noauth') return (
    <div style={{ ...box(GOLD), padding: 16, textAlign: 'center', marginBottom: 12 }}>
      <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD, margin: 0 }}>🎴 Você foi campeão!</p>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(0,0,0,0.7)', marginTop: 4 }}>As cartas-lembrança são só pra quem tem conta. No online você já está logado — se caiu aqui sem conta, faça login pra guardar seus craques.</p>
    </div>
  )
  if (status === 'revealed' && claimed) return (
    <div style={{ ...box(CREAM), padding: 16, textAlign: 'center', marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(0,0,0,0.6)', marginBottom: 10 }}>🎴 Foi pro seu álbum!</p>
      <div style={{ maxWidth: 200, margin: '0 auto' }}>
        <CollectibleCard name={claimed.name} club={claimed.club} year={claimed.year} pos={claimed.pos} fame={claimed.fame} folk={claimed.folk} promessa={claimed.promessa} big />
      </div>
    </div>
  )
  return (
    <div style={{ ...box(GOLD), padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD, margin: 0 }}>🎴 Escolha sua carta!</p>
        <span style={{ border: `2px solid ${INK}`, borderRadius: 8, padding: '2px 8px', fontWeight: 900, fontSize: 12, background: '#fff' }}>{remaining}s</span>
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.7)', marginBottom: 10 }}>Campeão leva uma carta do <b>seu time</b> pro álbum. Se o tempo acabar, o jogo escolhe uma pra você.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {opts.map(c => (
          <button key={c.name} onClick={() => claim(c)} style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <CollectibleCard name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame} folk={c.folk} promessa={c.promessa} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── FIM DE TEMPORADA: celebração do campeão + classificação + carta + volta ──
function SeasonEnd({ c, roomId, canControl, onNextSeason, onEnd, onTable }: { c: Career; roomId: string | null; canControl: boolean; onNextSeason: () => void; onEnd: () => void; onTable: () => void }) {
  const out = myOutcome(c.world)
  const champ = !!out?.champ
  // RANKING: um título aqui (carreira online antiga) também conta no ranking.
  // Antes este modo só gravava a CARTA no álbum e nunca escrevia em esc_results —
  // por isso o total de cartas passava dos títulos do ranking. A season_key é a
  // MESMA da carta (`careeronline:sala:temporada`), então cada título = uma carta.
  const wroteRank = useRef(false)
  useEffect(() => {
    if (!champ || !roomId || wroteRank.current) return
    wroteRank.current = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const me = sortDiv(c.world[out!.div]).find(t => t.you)
        const displayName = stripEmoji(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? out!.team)
        await resilientWrite({ table: 'esc_results', onConflict: 'user_id,season_key', row: {
          user_id: user.id, display_name: displayName,
          mode: 'online', season_key: `careeronline:${roomId}:${c.season}`.slice(0, 48),
          champion: true, top_scorer: false, goals: me?.gf ?? 0,
        } })
      } catch { /* nunca trava o jogo */ }
    })()
  }, [champ, roomId]) // eslint-disable-line react-hooks/exhaustive-deps
  const btn = (bg: string, fg: string): React.CSSProperties => ({ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: bg, color: fg, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 })
  return (
    <div>
      {champ ? (
        <div style={{ ...box(GOLD), padding: 18, textAlign: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 40, margin: 0, lineHeight: 1 }}>🏆</p>
          <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD, margin: '6px 0 0' }}>CAMPEÃO DA {DIV_NAME[out!.div].toUpperCase()}!</p>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(0,0,0,0.7)', marginTop: 4 }}>Parabéns, {out!.team}! Você levantou a taça{c.season > 0 ? ` na temporada ${c.season + 1}` : ''}.</p>
        </div>
      ) : (
        <div style={{ ...box(INK), padding: 16, color: '#fff', textAlign: 'center', marginBottom: 12 }}>
          <p style={{ fontWeight: 900, fontSize: 18, ...OSWALD, margin: 0 }}>🏁 Fim da temporada {c.season + 1}</p>
          {out && <p style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>{out.team} terminou em <b>{out.pos}º</b> da {DIV_NAME[out.div]}.</p>}
        </div>
      )}

      {champ && roomId && <ChampionCard deck={c.deck} seed={c.seed} team={out!.team} seasonKey={`careeronline:${roomId}:${c.season}`} />}

      <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 16, ...OSWALD, margin: 0 }}>📊 Classificação final</p>
        <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>🟡 Você · 🔥 Rivais · 🔵 Acesso (G4) · 🔴 Queda (Z4)</p>
      </div>
      <DivTables c={c} />
      <ScorersBox c={c} />

      {canControl ? (
        <div style={{ ...box('#EAF3FF'), padding: 13, marginBottom: 12 }}>
          <p style={{ fontWeight: 900, fontSize: 13.5, ...OSWALD, margin: '0 0 3px' }}>👑 Você é o host — e agora?</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', marginBottom: 10 }}>Siga com o mesmo mundo (acessos e quedas aplicados) ou encerre e volte pra sala pra refazer o leilão / trocar a galera.</p>
          <button onClick={onNextSeason} style={btn(GREEN, '#fff')}>▶️ Nova temporada (mesmo mundo)</button>
          <button onClick={onEnd} style={{ ...btn(RED, '#fff'), marginBottom: 0 }}>🚪 Encerrar — voltar pra sala</button>
        </div>
      ) : (
        <div style={{ ...box('#EAF3FF'), padding: 13, marginBottom: 12, textAlign: 'center' }}>
          <p style={{ fontWeight: 800, fontSize: 12, color: '#3a5a8a', margin: 0 }}>⏱️ Aguardando o host decidir — nova temporada ou voltar pra sala.</p>
        </div>
      )}
      <button onClick={onTable} className="text-black/40 text-xs font-semibold underline" style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', cursor: 'pointer', ...OSWALD }}>ver tabela detalhada</button>
    </div>
  )
}

export function CareerOnlineGame() {
  const can = useCanCareerOnline()
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.location.hash === '#carreiraonline')
  useEffect(() => {
    const f = () => setOpen(window.location.hash === '#carreiraonline')
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const [deck, setDeck] = useState<DeckChoice>('both') // carreira: sempre BR + Europa juntos
  const [friends, setFriends] = useState(3) // amigos humanos (além de você) na simulação
  const [career, setCareer] = useState<Career | null>(null)
  const [view, setView] = useState<'menu' | 'round' | 'table'>('menu')
  const [paused, setPaused] = useState(false)
  const [fromRoom, setFromRoom] = useState(false) // veio de uma sala online (não do menu solo)
  const launchRef = useRef<CareerLaunch | null>(null) // config da sala (roomId, host, técnicos)
  const baseRef = useRef<Record<string, unknown> | null>(null) // game_state da sala (host preserva ao sincronizar)
  const startPackedRef = useRef<Record<Div, PackTeam[]> | null>(null) // mundo de início da temporada (host publica)

  const myIdx = () => launchRef.current?.myIndex ?? 0

  // host publica o estado da temporada (temporada, semente, rodada, mundo de
  // início) — todos os clientes seguem. Preserva o resto do game_state e bate o
  // heartbeat (updated_at).
  const publish = (season: number, seed: number, round: number, pausedFlag: boolean) => {
    const L = launchRef.current
    if (!L || !L.isHost || !startPackedRef.current) return
    supabase.from('game_rooms').update({
      game_state: { ...(baseRef.current ?? {}), career: { season, seed, round, paused: pausedFlag, world: startPackedRef.current, ts: Date.now() } },
      updated_at: new Date().toISOString(),
    }).eq('id', L.roomId)
  }

  // veio de uma SALA online (host apertou começar)? monta o mundo com os
  // técnicos reais, semeado pelo código da sala — todos veem a mesma temporada.
  useEffect(() => {
    if (!open || !can || career || !pendingLaunch) return
    const L = pendingLaunch; pendingLaunch = null
    launchRef.current = L
    const seed = codeSeed(L.roomCode)
    const world = buildWorldMulti(seed, L.players, L.myIndex)
    setDeck(L.deck); setFromRoom(true)
    setCareer({ seed, deck: L.deck, world, fix: buildFix(), round: 0, last: null, season: 0 })
    setPaused(false); setView('round')
    if (L.isHost) {
      // base já vem da sala (síncrono) pra não sobrescrever nome/senha/deck ao
      // sincronizar; publica a temporada 0 como início oficial.
      baseRef.current = { ...(L.base ?? {}) }; delete (baseRef.current as { career?: unknown }).career
      startPackedRef.current = packWorld(world)
      publish(0, seed, 0, false)
    }
  }, [open, can, career])

  // CLIENTE (não-host) numa sala: segue o estado que o host publica no banco.
  useEffect(() => {
    const L = launchRef.current
    if (!fromRoom || !L || L.isHost || !open || !can) return
    const fix = buildFix()
    const apply = (gs: unknown) => {
      const cr = (gs as { career?: { season?: number; seed?: number; round?: number; paused?: boolean; world?: Record<Div, PackTeam[]>; ended?: boolean } } | null)?.career
      if (!cr) return
      if (cr.ended) { setCareer(null); setFromRoom(false); launchRef.current = null; window.location.hash = ''; return }
      if (typeof cr.round !== 'number' || typeof cr.seed !== 'number' || !cr.world) return
      setPaused(!!cr.paused)
      const startWorld = unpackWorld(cr.world, L.myIndex)
      setCareer(careerFrom(startWorld, cr.seed, L.deck, fix, cr.round, cr.season ?? 0))
    }
    supabase.from('game_rooms').select('game_state').eq('id', L.roomId).maybeSingle().then(({ data }) => apply(data?.game_state))
    const ch = supabase.channel('careerroom:' + L.roomId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: 'id=eq.' + L.roomId }, ({ new: r }: { new: { game_state?: unknown } }) => apply(r.game_state))
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [fromRoom, open, can])

  // rodadas rolam sozinhas (~1,3s). SÓ o condutor avança: solo, ou o host numa
  // sala. O cliente não avança sozinho — segue o banco (efeito acima).
  useEffect(() => {
    const L = launchRef.current
    const iAmDriver = !fromRoom || !!L?.isHost
    if (!(open && can && career && view === 'round' && !paused && career.round < 38 && iAmDriver)) return
    const t = setTimeout(() => {
      if (!career || career.round >= 38) return
      const r = playRound(career)
      const nc = { ...career, world: r.world, round: career.round + 1, last: r.last }
      setCareer(nc)
      if (fromRoom && L?.isHost) publish(nc.season, nc.seed, nc.round, false)
    }, 1300)
    return () => clearTimeout(t)
  }, [open, can, career, view, paused, fromRoom])

  if (!open || !can) return null
  const canControl = !fromRoom || !!launchRef.current?.isHost
  const close = () => {
    // veio de sala: limpa a temporada pra um próximo "começar" montar do zero
    if (fromRoom) { setCareer(null); setFromRoom(false); setView('menu'); launchRef.current = null; baseRef.current = null; startPackedRef.current = null }
    window.location.hash = ''
  }

  const start = () => {
    const seed = Math.floor(Math.random() * 1e9)
    setCareer({ seed, deck, world: buildWorld(seed, friends), fix: buildFix(), round: 0, last: null, season: 0 })
    setPaused(false)
    setView('round')
  }
  const next = () => {
    if (!canControl || !career || career.round >= 38) return
    const r = playRound(career)
    const nc = { ...career, world: r.world, round: career.round + 1, last: r.last }
    setCareer(nc)
    if (fromRoom && launchRef.current?.isHost) publish(nc.season, nc.seed, nc.round, paused)
  }
  const togglePause = () => {
    if (!canControl || !career) return
    const np = !paused
    setPaused(np)
    if (fromRoom && launchRef.current?.isHost) publish(career.season, career.seed, career.round, np)
  }
  // host (ou solo): nova temporada com acessos e quedas aplicados
  const nextSeason = () => {
    if (!canControl || !career) return
    const nw = nextSeasonWorld(career.world)
    markYou(nw, myIdx())
    const seed = Math.floor(Math.random() * 1e9)
    const nc: Career = { seed, deck: career.deck, world: nw, fix: buildFix(), round: 0, last: null, season: career.season + 1 }
    setCareer(nc); setPaused(false); setView('round')
    if (fromRoom && launchRef.current?.isHost) { startPackedRef.current = packWorld(nw); publish(nc.season, seed, 0, false) }
  }
  // host: encerra a carreira e devolve todo mundo pra sala de espera
  const endCareer = async () => {
    const L = launchRef.current
    if (L?.isHost) {
      await supabase.from('game_rooms').update({
        game_state: { ...(baseRef.current ?? {}), career: { ended: true, ts: Date.now() } },
        status: 'waiting', updated_at: new Date().toISOString(),
      }).eq('id', L.roomId)
    }
    close()
  }

  // temporada acabou: celebração do campeão + classificação final + carta
  if (career && career.round >= 38 && view !== 'table') return <Overlay><SeasonEnd c={career} roomId={launchRef.current?.roomId ?? null} canControl={canControl} onNextSeason={nextSeason} onEnd={endCareer} onTable={() => setView('table')} /></Overlay>
  if (career && view === 'round') return <Overlay><RoundView c={career} onNext={next} onTable={() => setView('table')} onExit={close} paused={paused} onTogglePause={togglePause} canControl={canControl} /></Overlay>
  if (career && view === 'table') return <Overlay><Standings c={career} onBack={() => setView('round')} onExit={close} /></Overlay>

  return (
    <Overlay>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 900, ...OSWALD }}>🌐 CARREIRA ONLINE</span>
        <button onClick={close} className="text-black/60 font-black text-sm active:opacity-60" style={OSWALD}>Fechar ✕</button>
      </div>

      <div style={{ ...box(INK), padding: 16, color: '#fff', marginBottom: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD, margin: 0 }}>4 divisões, a galera junta</p>
        <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 600, marginTop: 4 }}>Os amigos ficam espalhados pela pirâmide (Série A à D). Cada técnico disputa a SUA divisão e sobe ou cai por conta própria — o que junta vocês é o mesmo mundo e a mesma rodada.</p>
      </div>

      <div style={{ ...box('#EAF3FF'), padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 900, ...OSWALD }}>🌎 Baralho fixo: Brasileirão + Europa juntos</p>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#5a5647', marginTop: 3 }}>Na Carreira o baralho é sempre os <b>auges do Brasileirão + os auges da Europa juntos</b> (~700 nomes) — precisa dos dois pra preencher bem os <b>80 times das 4 divisões</b>. Sem baralho só BR nem só Europa.</p>
      </div>

      <div style={{ ...box('#EAF3FF'), padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700 }}>👥 Amigos na sala <span style={{ color: '#888' }}>(simulação — você + estes espalhados pelas divisões)</span>:</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[1, 3, 5, 7].map(n => (
            <button key={n} onClick={() => setFriends(n)} style={{ flex: 1, border: `3px solid ${INK}`, borderRadius: 10, padding: '8px 0', fontWeight: 900, fontSize: 14, background: friends === n ? GOLD : '#fff', boxShadow: friends === n ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer', ...OSWALD }}>{n}</button>
          ))}
        </div>
      </div>

      <div style={{ ...box('#FFF6DE'), padding: 12, marginBottom: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>🧪 Prévia do motor (solo)</p>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#666', marginTop: 3 }}>Aqui é a prévia local. Pra jogar com a galera de verdade, crie uma sala em <b>Jogar Online → Criar sala → Carreira</b>: o mundo é semeado pelo código da sala, então todos veem a mesma temporada com os técnicos reais espalhados pela pirâmide.</p>
      </div>

      <button onClick={start} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>▶️ Começar temporada (rodada a rodada)</button>
      <button onClick={close} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 13, background: RED, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>← Sair</button>
    </Overlay>
  )
}
