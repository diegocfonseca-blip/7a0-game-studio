// ─── 🌍 COPA DO MUNDO LEGENDS (v1 · carreira SOLO) ───────────────────────────
// O endgame dos veteranos: desbloqueia na TEMPORADA 100, rola de 10 em 10.
// Vaga e ordem de escolha = TOP 16 do RANKING DE CLUBES (o mural do Rank).
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
import { LiveScoreCard, PensShootout, pensRevealDelay, type ScoreGoal } from './pyramidseason'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const OSWALD = { fontFamily: "'Oswald','Arial Narrow',system-ui,sans-serif" } as const
const box = (bg: string) => ({ border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 0 ${INK}`, background: bg }) as const

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

const FLAG: Record<string, string> = {
  'Brasil': '🇧🇷', 'Argentina': '🇦🇷', 'França': '🇫🇷', 'Espanha': '🇪🇸',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Itália': '🇮🇹', 'Alemanha': '🇩🇪', 'Holanda': '🇳🇱',
  'Portugal': '🇵🇹', 'México': '🇲🇽', 'Colômbia': '🇨🇴', 'Uruguai': '🇺🇾',
  'Chile': '🇨🇱', 'Bélgica': '🇧🇪', 'EUA': '🇺🇸', 'Coreia do Sul': '🇰🇷', 'Paraguai': '🇵🇾',
}

type Sec = 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA'
const SECS: Sec[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
type PoolCard = { name: string; club: string; year: number; fame: number; lo: number; hi: number; sec: Sec }
type Formation = '4-3-3' | '4-4-2'
const NEED: Record<Formation, Record<Sec, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}
const SEC_LABEL: Record<Sec, string> = { GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meias', ATA: 'Atacantes' }

// pool COMPLETO da seleção: TODAS as cartas do país nos 3 baralhos (regra do
// Diego: todo mundo aparece, do craque ao perna-de-pau — e sem selo na tela).
function countryPool(pais: string): Record<Sec, PoolCard[]> {
  const out: Record<Sec, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  const decks: [Record<string, { name: string; club: string; year: number; fame: number; lo: number; hi: number }[]>, Baralho][] = [
    [CATALOG as never, 'BR'], [CATALOG_EU as never, 'EU'], [CATALOG_WORLD as never, 'WORLD'],
  ]
  for (const [cat, b] of decks) for (const sec of SECS) for (const c of (cat[sec] ?? [])) {
    if (paisDe(c.name, b) === pais) out[sec].push({ name: c.name, club: c.club, year: c.year, fame: c.fame, lo: c.lo, hi: c.hi, sec })
  }
  for (const sec of SECS) out[sec].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  return out
}
const cardKey = (c: PoolCard) => `${c.name}|${c.club}|${c.year}`
const formationFits = (pool: Record<Sec, PoolCard[]>, f: Formation) =>
  SECS.every(s => new Set(pool[s].map(c => c.name)).size >= NEED[f][s])

// XI dos bots: os MELHORES 11 (nível interno; a UI nunca mostra, mas o motor usa)
function bestXI(pool: Record<Sec, PoolCard[]>, f: Formation): PoolCard[] {
  const used = new Set<string>(); const xi: PoolCard[] = []
  for (const sec of SECS) {
    const sorted = [...pool[sec]].sort((a, b) => b.fame - a.fame || b.hi - a.hi || b.lo - a.lo)
    let n = 0
    for (const c of sorted) { if (n >= NEED[f][sec]) break; if (used.has(c.name)) continue; used.add(c.name); xi.push(c); n++ }
  }
  return xi
}
const xiStrength = (xi: PoolCard[]) => xi.reduce((s, c) => s + (c.lo + c.hi) / 2, 0) / Math.max(1, xi.length)

// ── persistência própria (fora do estado do jogo!) ──
type CopaSave = { anchor: number; mural: { season: number; selecao: string; campeao: string; voce: boolean }[]; played: number[] }
const skey = (seed: number) => `llcopa:${seed}`
export function loadCopaSave(seed: number): CopaSave | null {
  try { const r = localStorage.getItem(skey(seed)); return r ? JSON.parse(r) as CopaSave : null } catch { return null }
}
function saveCopaSave(seed: number, s: CopaSave) { try { localStorage.setItem(skey(seed), JSON.stringify(s)) } catch { /* segue */ } }
// âncora do calendário: save já além da 100 quando o modo chega → primeira Copa
// 10 temporadas depois (142 → 152); senão desbloqueia na 100 → primeira na 110.
function ensureSave(seed: number, seasonNo: number): CopaSave {
  const cur = loadCopaSave(seed)
  if (cur) return cur
  const anchor = seasonNo >= 100 ? seasonNo + 10 : 110
  const fresh: CopaSave = { anchor, mural: [], played: [] }
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

// quem marca: sorteio ponderado no XI (ATA pesa 4 · MEI 2 · defesa 1 · GOL nunca)
function scorerPick(r: () => number, xi: PoolCard[]): string {
  const pool: PoolCard[] = []
  for (const c of xi) {
    const w = c.sec === 'ATA' ? 4 : c.sec === 'MEI' ? 2 : c.sec === 'GOL' ? 0 : 1
    for (let i = 0; i < w; i++) pool.push(c)
  }
  return (pool[Math.floor(r() * pool.length)] ?? xi[xi.length - 1]).name
}
// minutos + autores dos gols (seedado): alimenta o LiveScoreCard — o gol pinga
// no minuto certo do relógio, com o NOME de quem fez (as lendas convocadas!)
function goalEvents(r: () => number, gh: number, ga: number, home: Entrant, away: Entrant): ScoreGoal[] {
  const evs: ScoreGoal[] = []
  for (let i = 0; i < gh; i++) evs.push({ home: true, min: 2 + Math.floor(r() * 89), name: scorerPick(r, home.xi) })
  for (let i = 0; i < ga; i++) evs.push({ home: false, min: 2 + Math.floor(r() * 89), name: scorerPick(r, away.xi) })
  return evs.sort((a, b) => a.min - b.min)
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

// ── componente principal: o portão + o torneio inteiro num modal ──
export function CopaMundoGate({ seasonNo, seed, top16, myPos }: { seasonNo: number; seed: number; top16: { name: string; you: boolean }[]; myPos: number }) {
  const save = useMemo(() => ensureSave(seed, seasonNo), [seed, seasonNo])
  const [open, setOpen] = useState(false)
  const copaNow = isCopaSeason(save, seasonNo) && !save.played.includes(seasonNo)
  const inTop16 = myPos >= 0
  const proxima = nextCopaSeason(save, isCopaSeason(save, seasonNo) ? seasonNo + 1 : seasonNo)

  // ranking das seleções (nº de cartas — atualiza sozinho quando o baralho engorda)
  const paises16 = useMemo(() => rankingSelecoes().slice(0, 16).map(p => p.pais), [])

  if (seasonNo < 100 && save.anchor === 110) return (
    <div style={{ ...box('#CBBF9E'), padding: '10px 12px', marginBottom: 10, boxShadow: `3px 3px 0 0 ${INK}` }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: 0, color: 'rgba(0,0,0,.75)', textTransform: 'uppercase' }}>🔒 Copa do Mundo Legends</p>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '3px 0 0', lineHeight: 1.45 }}>Torneio de seleções, coisa de <b>veterano</b>: desbloqueia na <b>temporada 100</b> — e só entra quem estiver no <b>TOP 16 do ranking de clubes</b> (aba Rank). Continue jogando e subindo no mural.</p>
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
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '3px 0 0', lineHeight: 1.45 }}>É temporada de Copa, mas <b>seu clube não está no TOP 16 do ranking de clubes</b> (aba Rank). Ganhe títulos e junte dinheiro pra subir no mural — a próxima edição é na <b>{proxima}</b>.</p>
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
      {open && <CopaMundo seasonNo={seasonNo} seed={seed} top16={top16} myPos={myPos} paises16={paises16} save={save} onClose={() => setOpen(false)} />}
    </>
  )
}

function CopaMundo({ seasonNo, seed, top16, myPos, paises16, save, onClose }: { seasonNo: number; seed: number; top16: { name: string; you: boolean }[]; myPos: number; paises16: string[]; save: CopaSave; onClose: () => void }) {
  const rng = useMemo(() => mulberry((seed ^ Math.imul(seasonNo, 2654435761)) >>> 0), [seed, seasonNo])
  const [phase, setPhase] = useState<'select' | 'convoke' | 'cup'>('select')
  const [myPais, setMyPais] = useState<string | null>(null)
  const [myXI, setMyXI] = useState<PoolCard[] | null>(null)
  const [myForm, setMyForm] = useState<Formation>('4-3-3')

  // bots recebem depois de você: cada um leva a melhor seleção livre da posição
  // dele pra baixo (fallback: melhor livre) — só usuário REAL escolhe.
  const entrants = useMemo<Entrant[] | null>(() => {
    if (!myPais || !myXI) return null
    const taken = new Set<string>([myPais])
    const list: Entrant[] = []
    top16.forEach((c, i) => {
      if (c.you) { list.push({ club: c.name, you: true, pais: myPais, xi: myXI, str: xiStrength(myXI) }); return }
      let pais = paises16.slice(i).find(p => !taken.has(p)) ?? paises16.find(p => !taken.has(p))
      if (!pais) pais = paises16[i]
      taken.add(pais)
      const pool = countryPool(pais)
      const f: Formation = formationFits(pool, '4-3-3') ? '4-3-3' : '4-4-2'
      const xi = bestXI(pool, f)
      list.push({ club: c.name, you: false, pais, xi, str: xiStrength(xi) })
    })
    return list
  }, [myPais, myXI, top16, paises16])

  const Modal = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99996, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, overflowY: 'auto' }}>
      <style>{'@keyframes cmSheen{0%{background-position:180% 180%}100%{background-position:-80% -80%}}'}</style>
      <div style={{ ...box('#F4ECD6'), color: INK, width: '100%', maxWidth: wide ? 430 : 400, maxHeight: '95vh', overflowY: 'auto', padding: 14, margin: 'auto', borderRadius: 18 }}>
        {children}
      </div>
    </div>, document.body)

  if (phase === 'select') return (
    <Modal>
      <SelecaoScreen paises16={paises16} myPos={myPos} myClub={top16[myPos]?.name ?? 'Você'} onPick={p => { setMyPais(p); setPhase('convoke') }} onClose={onClose} />
    </Modal>
  )
  if (phase === 'convoke' && myPais) return (
    <Modal>
      <ConvocacaoScreen pais={myPais} onBack={() => setPhase('select')} onDone={(xi, f) => { setMyXI(xi); setMyForm(f); setPhase('cup') }} />
    </Modal>
  )
  if (phase === 'cup' && entrants) return (
    <Modal wide>
      <CupScreen entrants={entrants} rng={rng} seasonNo={seasonNo} seed={seed} save={save} myForm={myForm} onClose={onClose} />
    </Modal>
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
            <span style={{ fontSize: 21 }}>{FLAG[p] ?? '🏳️'}</span>
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
  const usedNames = new Set(Object.values(sel).map(c => c.name))
  const totalCards = SECS.reduce((n, s) => n + pool[s].length, 0)

  const toggle = (c: PoolCard) => {
    const k = cardKey(c)
    setSel(prev => {
      const nx = { ...prev }
      if (nx[k]) { delete nx[k]; return nx }
      if (bySec(c.sec).length >= need[c.sec]) return prev            // posição cheia
      if (usedNames.has(c.name)) return prev                        // outra versão da MESMA pessoa
      nx[k] = c; return nx
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
        <span style={{ fontSize: 28 }}>{FLAG[pais] ?? '🏳️'}</span>
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

      <input value={q} onChange={e => setQ(e.target.value)} placeholder={`🔎 buscar nos ${pool[tab].length} ${SEC_LABEL[tab].toLowerCase()}…`}
        style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 11, padding: '7px 11px', fontWeight: 800, fontSize: 12, background: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />

      <div style={{ ...box('#fff'), borderRadius: 12, overflow: 'hidden', marginBottom: 10, boxShadow: `3px 3px 0 0 ${INK}` }}>
        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
          {list.map(c => {
            const k = cardKey(c)
            const on = !!sel[k]
            const otherVersion = !on && usedNames.has(c.name)
            const full = !on && bySec(c.sec).length >= need[c.sec]
            const versions = pool[c.sec].filter(o => o.name === c.name).length > 1
            return (
              <button key={k} onClick={() => toggle(c)} disabled={otherVersion}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: 'none', borderBottom: '2px solid rgba(0,0,0,.07)', background: on ? '#E9F5EC' : '#fff', cursor: otherVersion ? 'not-allowed' : 'pointer', opacity: otherVersion ? 0.4 : full ? 0.65 : 1, textAlign: 'left' }}>
                <span style={{ width: 22, height: 22, border: `2.5px solid ${INK}`, borderRadius: 7, background: on ? GREEN : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{on ? '✓' : ''}</span>
                <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                {versions && <span style={{ background: '#7C3AED', color: '#fff', border: `2px solid ${INK}`, borderRadius: 999, fontSize: 7, fontWeight: 900, padding: '1px 5px', flexShrink: 0 }}>{otherVersion ? 'já convocado' : 'versões'}</span>}
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
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{FLAG[pais]} sua seleção · {total}/11 · {form}</span>
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
function CupScreen({ entrants, rng, seasonNo, seed, save, onClose }: { entrants: Entrant[]; rng: () => number; seasonNo: number; seed: number; save: CopaSave; myForm: Formation; onClose: () => void }) {
  // tudo pré-computado com a MESMA seed (placares, gols, pênaltis) — mas só é
  // MOSTRADO com o relógio rolando, na velocidade padrão da liga (9s a rodada).
  const world = useMemo(() => {
    const idx = entrants.map((_, i) => i)
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
    const groups: Group[] = [0, 1, 2, 3].map(g => {
      const teams = idx.slice(g * 4, g * 4 + 4)
      const [a, b, c, d] = teams
      const turno: GMatch[][] = [
        [{ h: a, a: b }, { h: c, a: d }],
        [{ h: a, a: c }, { h: b, a: d }],
        [{ h: a, a: d }, { h: b, a: c }],
      ]
      const returno: GMatch[][] = turno.map(rd => rd.map(m => ({ h: m.a, a: m.h })))
      const matches = [...turno, ...returno]
      for (const rd of matches) for (const m of rd) {
        const [gh, ga] = playMatch(rng, entrants[m.h], entrants[m.a])
        m.gh = gh; m.ga = ga
        m.ev = goalEvents(rng, gh, ga, entrants[m.h], entrants[m.a])
      }
      return { teams, matches }
    })
    const q8 = groups.flatMap(g => groupTable(g, 6).slice(0, 2).map(r => r.t))
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
  }, [entrants, rng])

  // step = revelações FEITAS: 1-6 rodadas de grupo · 7 sorteio · 8 QF ida ·
  // 9 QF volta · 10 SF ida · 11 SF volta · 12 final · 13 cerimônia.
  const [step, setStep] = useState(0)
  const [liveDone, setLiveDone] = useState(true)
  const [roundKey, setRoundKey] = useState(0)
  const LIVE = (s: number) => (s >= 1 && s <= 6) || (s >= 8 && s <= 12)
  const gRound = Math.min(6, step)
  const shownRounds = step <= 6 && !liveDone ? Math.max(0, gRound - 1) : gRound // tabela/resultados só DEPOIS do apito
  const done = step >= 13
  const myIdx = entrants.findIndex(isYouE)
  const nm = (i: number) => `${FLAG[entrants[i].pais]} ${entrants[i].pais}`
  const club = (i: number) => entrants[i].club
  const isYou = (i: number) => entrants[i].you

  const next = () => { const s = step + 1; setStep(s); if (LIVE(s)) { setLiveDone(false); setRoundKey(k => k + 1) } }
  // relógio da rodada: 9s (padrão da liga) + tempo dos pênaltis quando o MEU
  // confronto (ou a final) decide na marca — suspense completo antes de liberar.
  useEffect(() => {
    if (liveDone) return
    let extra = 700
    const penMs = (t: KoTie) => t.pen && (isYou(t.h) || isYou(t.a)) ? pensRevealDelay(t.pen) * 1000 : 0
    if (step === 9) extra += Math.max(0, ...world.qf.map(penMs))
    if (step === 11) extra += Math.max(0, ...world.sf.map(penMs))
    if (step === 12 && world.final.pen) extra += pensRevealDelay(world.final.pen) * 1000
    const t = setTimeout(() => setLiveDone(true), 9000 + extra)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey])

  // persiste os prêmios UMA vez, quando chega no fim (fora do render!)
  useEffect(() => {
    if (!done) return
    const cur = loadCopaSave(seed) ?? save
    if (cur.played.includes(seasonNo)) return
    const c = world.final.champion
    saveCopaSave(seed, { ...cur, played: [...cur.played, seasonNo], mural: [...cur.mural, { season: seasonNo, selecao: entrants[c].pais, campeao: entrants[c].club, voce: isYou(c) }] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const nextLabel = !liveDone ? '⏳ Deixa o jogo acabar…' : step < 6 ? `▶️ Rodada ${step + 1} de 6` : step === 6 ? '🎲 Sortear o mata-mata' : step === 7 ? '▶️ Jogar as quartas (ida)' : step === 8 ? '▶️ Quartas — jogo de volta' : step === 9 ? '▶️ Semifinais (ida)' : step === 10 ? '▶️ Semis — jogo de volta' : step === 11 ? '🏆 A GRANDE FINAL' : '🎉 Cerimônia'

  // cartão AO VIVO (o mesmo LiveScoreCard da liga/copa — relógio, GOOOL, bump)
  const live = (h: number, a: number, ev: ScoreGoal[]) => (
    <div style={{ marginBottom: 8 }}>
      <LiveScoreCard homeName={nm(h)} awayName={nm(a)} homeColor={GREEN} awayColor={RED}
        youIsHome={h === myIdx} goals={ev} roundKey={roundKey} roundMs={9000} finished={liveDone} />
    </div>
  )
  // linha compacta de confronto resolvido (ida+volta+pênaltis) — só pós-apito
  const tieRow = (t: KoTie, showVolta: boolean, showPens = true) => (
    <div style={{ borderTop: '2px solid rgba(0,0,0,.08)', padding: '5px 2px', fontSize: 11, fontWeight: isYou(t.h) || isYou(t.a) ? 900 : 700 }}>
      <span>{nm(t.h)} {t.g1![0]}×{t.g1![1]} {nm(t.a)}</span>
      {showVolta && <span style={{ display: 'block', color: 'rgba(0,0,0,.6)' }}>volta: {t.g2![0]}×{t.g2![1]}{showPens && t.pen ? ` · pênaltis ${t.pen[0]}×${t.pen[1]}` : ''} → <b style={{ color: GREEN }}>{nm(t.winner!)} avança</b></span>}
    </div>
  )
  // o MEU confronto de volta: placar ao vivo + pênaltis com o suspense OFICIAL
  const myTieVolta = (t: KoTie) => (
    <div key={`v${t.h}`}>
      {live(t.a, t.h, t.ev2!)}
      {liveDone && t.pen && (
        <div style={{ ...box('#fff'), padding: 8, marginBottom: 8, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}` }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11, margin: '0 0 4px', textAlign: 'center' }}>🥅 AGREGADO {t.g1![0] + t.g2![1]}×{t.g1![1] + t.g2![0]} — DECISÃO NOS PÊNALTIS</p>
          <PensShootout pens={t.pen} aName={entrants[t.h].pais} bName={entrants[t.a].pais} />
        </div>
      )}
    </div>
  )

  return (
    <>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 18, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>🌍 Copa do Mundo Legends · temporada {seasonNo}</p>
      <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', textAlign: 'center', margin: '3px 0 10px' }}>Você: <b>{nm(myIdx)}</b> ({club(myIdx)})</p>

      {/* GRUPOS: SEU jogo ao vivo em cima (relógio da liga); tabela e os outros
          resultados só entram DEPOIS do apito — zero spoiler. */}
      {step >= 1 && step <= 6 && (() => {
        const g = world.groups.find(gr => gr.teams.includes(myIdx))
        const m = g?.matches[gRound - 1]?.find(mm => mm.h === myIdx || mm.a === myIdx)
        return m ? live(m.h, m.a, m.ev ?? []) : null
      })()}
      {step <= 7 && (
        <>
          {world.groups.map((g, gi) => (
            <div key={gi} style={{ ...box('#fff'), padding: 10, marginBottom: 8, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}` }}>
              <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '0 0 4px' }}>GRUPO {'ABCD'[gi]}</p>
              {groupTable(g, shownRounds).map((r, i) => (
                <div key={r.t} style={{ display: 'flex', gap: 6, fontSize: 10.5, fontWeight: isYou(r.t) ? 900 : 600, background: isYou(r.t) ? '#FFE9B0' : i < 2 ? '#F0F7F1' : 'transparent', borderRadius: 6, padding: '2px 5px' }}>
                  <span style={{ width: 12, color: 'rgba(0,0,0,.45)' }}>{i + 1}</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm(r.t)} <span style={{ color: 'rgba(0,0,0,.4)', fontSize: 8.5 }}>· {club(r.t)}</span></span>
                  <span style={{ fontWeight: 900 }}>{r.pts}pt</span><span>{r.w}V</span><span>{r.sg > 0 ? '+' : ''}{r.sg}</span>
                </div>
              ))}
              {shownRounds > 0 && (
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '4px 0 0' }}>
                  rodada {shownRounds}: {g.matches[shownRounds - 1].map(m => `${FLAG[entrants[m.h].pais]} ${m.gh}×${m.ga} ${FLAG[entrants[m.a].pais]}`).join(' · ')}
                </p>
              )}
            </div>
          ))}
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.5)', textAlign: 'center', margin: '0 0 8px' }}>classificam 2 por grupo · desempate: vitórias, depois saldo</p>
        </>
      )}

      {/* MATA-MATA: seu confronto ao vivo; os demais aparecem pós-apito */}
      {step >= 8 && !done && (() => {
        const myQf = world.qf.find(t => isYou(t.h) || isYou(t.a))
        const mySf = world.sf.find(t => isYou(t.h) || isYou(t.a))
        return (
          <>
            {step === 8 && myQf && live(myQf.h, myQf.a, myQf.ev1!)}
            {step === 9 && myQf && myTieVolta(myQf)}
            {step === 10 && mySf && live(mySf.h, mySf.a, mySf.ev1!)}
            {step === 11 && mySf && myTieVolta(mySf)}
            {step === 12 && live(world.final.h, world.final.a, world.final.ev)}
            {step === 12 && liveDone && world.final.pen && (
              <div style={{ ...box('#fff'), padding: 8, marginBottom: 8, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}` }}>
                <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11, margin: '0 0 4px', textAlign: 'center' }}>🥅 FINAL DECIDIDA NOS PÊNALTIS</p>
                <PensShootout pens={world.final.pen} aName={entrants[world.final.h].pais} bName={entrants[world.final.a].pais} />
              </div>
            )}
            <div style={{ ...box('#fff'), padding: 10, marginBottom: 8, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}` }}>
              <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '0 0 4px' }}>🎲 MATA-MATA (sorteio livre — ida e volta)</p>
              {world.qf.map((t, i) => {
                const mine = isYou(t.h) || isYou(t.a)
                if (step === 8) return <div key={i}>{!mine && liveDone ? tieRow(t, false) : !mine ? <div style={{ borderTop: '2px solid rgba(0,0,0,.08)', padding: '5px 2px', fontSize: 11 }}>{nm(t.h)} × {nm(t.a)} <span style={{ color: 'rgba(0,0,0,.4)' }}>· jogando…</span></div> : null}</div>
                if (step === 9) return <div key={i}>{liveDone ? tieRow(t, true) : mine ? null : <div style={{ borderTop: '2px solid rgba(0,0,0,.08)', padding: '5px 2px', fontSize: 11 }}>{nm(t.h)} {t.g1![0]}×{t.g1![1]} {nm(t.a)} <span style={{ color: 'rgba(0,0,0,.4)' }}>· volta rolando…</span></div>}</div>
                if (step === 7) return <div key={i} style={{ borderTop: '2px solid rgba(0,0,0,.08)', padding: '5px 2px', fontSize: 11, fontWeight: mine ? 900 : 700 }}>{nm(t.h)} × {nm(t.a)}</div>
                return <div key={i}>{tieRow(t, true)}</div>
              })}
              {step >= 10 && (<>
                <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '8px 0 4px' }}>SEMIFINAIS</p>
                {world.sf.map((t, i) => {
                  const mine = isYou(t.h) || isYou(t.a)
                  if (step === 10) return <div key={i}>{!mine && liveDone ? tieRow(t, false) : !mine ? <div style={{ borderTop: '2px solid rgba(0,0,0,.08)', padding: '5px 2px', fontSize: 11 }}>{nm(t.h)} × {nm(t.a)} <span style={{ color: 'rgba(0,0,0,.4)' }}>· jogando…</span></div> : null}</div>
                  if (step === 11) return <div key={i}>{liveDone ? tieRow(t, true) : mine ? null : <div style={{ borderTop: '2px solid rgba(0,0,0,.08)', padding: '5px 2px', fontSize: 11 }}>{nm(t.h)} {t.g1![0]}×{t.g1![1]} {nm(t.a)} <span style={{ color: 'rgba(0,0,0,.4)' }}>· volta rolando…</span></div>}</div>
                  return <div key={i}>{tieRow(t, true)}</div>
                })}
              </>)}
              {step === 12 && liveDone && (
                <>
                  <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12, margin: '8px 0 4px' }}>🏆 FINAL ÚNICA</p>
                  <p style={{ fontSize: 12, fontWeight: 900, margin: 0 }}>{nm(world.final.h)} {world.final.g[0]}×{world.final.g[1]} {nm(world.final.a)}{world.final.pen ? ` · pênaltis ${world.final.pen[0]}×${world.final.pen[1]}` : ''}</p>
                </>
              )}
            </div>
          </>
        )
      })()}

      {step === 7 && (
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
          <p style={{ fontSize: 10.5, fontWeight: 800, margin: '3px 0 0', position: 'relative' }}>{isYou(world.final.champion) ? <>VOCÊ ({club(world.final.champion)}) entrou pra história: ⭐ estrela de campeão do MUNDO no mural — pra sempre. 🎉</> : <>Título de {club(world.final.champion)}. A próxima Copa é na temporada {seasonNo + 10} — treina o dedo. 😤</>}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '6px 0 0', position: 'relative' }}>final: {nm(world.final.h)} {world.final.g[0]}×{world.final.g[1]} {nm(world.final.a)}{world.final.pen ? ` (pên. ${world.final.pen[0]}×${world.final.pen[1]})` : ''}</p>
        </div>
      )}
      {done && (
        <div style={{ ...box('#0C0C0C'), padding: 10, marginBottom: 10, borderRadius: 12 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 11.5, margin: '0 0 4px', color: GOLD, textTransform: 'uppercase' }}>📜 Mural dos Campeões do Mundo</p>
          {[...save.mural, { season: seasonNo, selecao: entrants[world.final.champion].pais, campeao: entrants[world.final.champion].club, voce: isYou(world.final.champion) }]
            .filter((m, i, arr) => arr.findIndex(x => x.season === m.season) === i)
            .map(m => (
              <p key={m.season} style={{ fontSize: 10.5, fontWeight: m.voce ? 900 : 700, color: m.voce ? GOLD : 'rgba(255,255,255,.85)', margin: '2px 0 0' }}>
                temporada {m.season} · {FLAG[m.selecao]} {m.selecao} — {m.campeao}{m.voce ? ' ⭐ (VOCÊ)' : ''}
              </p>
            ))}
        </div>
      )}

      {done ? (
        <button onClick={onClose} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 14, ...OSWALD, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer' }}>▶️ VOLTAR PRA CARREIRA</button>
      ) : (
        <button disabled={!liveDone} onClick={next} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 14, ...OSWALD, background: liveDone ? GOLD : '#cfcabb', boxShadow: liveDone ? `4px 4px 0 0 ${INK}` : 'none', cursor: liveDone ? 'pointer' : 'not-allowed' }}>{nextLabel}</button>
      )}
    </>
  )
}

const isYouE = (e: Entrant) => e.you
