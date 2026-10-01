// ─── 🌎 CARREIRA INTERNACIONAL — a tela, PASSO A PASSO (01/10, pedido do Diego) ────
//
// Palavras dele no 1º teste: *"primeiro deveria aparecer só o banner da competição
// que quero jogar, como passo a passo… se for Libertadores mostrar só os blocos
// dos times da Libertadores… depois convocar igual já temos… se tô na Liberta não
// vejo da Champions e vice-versa… a simulação deve ser bonita, padrão das Copas,
// rolando o tempo… depois que acabar vem o banner do Mundial, jogo único… quem não
// se classificou pode pular ou assistir"*.
//
// O MOTOR não mudou (`makeInternationalCampaign` + as 3 ações do reducer): a
// campanha continua congelada no save com 14 "noites" e o contador `reveal`. O
// que mudou é SÓ como a pessoa anda por ela:
//   1. escolhe a COMPETIÇÃO (dois banners) → 2. escolhe o CLUBE (só os blocos
//   daquela competição) → 3. CONVOCA os 11 (mesma tela da Copa do Mundo) →
//   4. joga SÓ a competição dela, partida a partida, no `LiveScoreCard` da liga
//   (tempo rolando, lance do gol, mascote) → 5. o 🌐 MUNDIAL só aparece no fim,
//   jogo único contra o campeão da outra → quem não tem vaga PULA ou ASSISTE.
// Noite em que a competição dela não joga é pulada sozinha (o `reveal` anda sem
// mostrar nada) — por isso "não vejo a outra".
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Card, WonCard } from './types'
import { INTERNATIONAL_BLOCKS, INTERNATIONAL_CLUBS, internationalCardKey, isRealInternationalCard, validInternationalXI, type InternationalClub, type InternationalCompetition } from './career-international'
import { makeInternationalCampaign, tableFor, type InternationalCampaign, type InternationalHistoryEntry, type InternationalMatch, type InternationalPhase, type InternationalTableRow, type InternationalTie } from './career-international-season'
import { summarizeInternationalCampaign } from './career-international-summary'
import { CompetitionMatch, CompetitionStage } from './online-match-visual'
import { Escudo } from './escudos'
import { SeloClube } from './selo-clube'
import { mascoteKeyDoTime, FestaoMascote } from './mascotes'
import { tr } from './lang'
import { JogadorNoCampo, VagaNoCampo } from './jogadorcampo'
import { useLegendPresentation } from './presentation-release'
import { internationalCareerRanking } from './career-international-ranking'
import { LiveScoreCard, COPA_LEG_MS, copaSideColor, useApitoDeLargada, type ScoreGoal } from './pyramidseason'
import { useSimMode } from './screens'
import libertaImg from './img/online-liberta-v25.webp'
import championsImg from './img/online-champions-v25.webp'
import mundialImg from './img/carreira-mundial-clubes-v1.webp'

type Props = {
  season: number; seed: number; userTeam: string; userId: number; squad: WonCard[]
  choices: InternationalClub[]; priority: number | null
  campaign: InternationalCampaign | null; history: InternationalHistoryEntry[]
  onStart: (campaign: InternationalCampaign) => void; onAdvance: () => void; onFinish: (entry: InternationalHistoryEntry) => void
}

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const OSWALD: CSSProperties = { fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }
const frame: CSSProperties = { background: CREME, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 14, marginBottom: 18 }
const card: CSSProperties = { background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12, marginBottom: 12 }
const btn = (bg = GOLD, color = INK): CSSProperties => ({ display: 'block', width: '100%', border: `3px solid ${INK}`, borderRadius: 13, padding: '11px 10px', fontWeight: 700, fontSize: 15, ...OSWALD, textAlign: 'center', boxShadow: `3px 3px 0 ${INK}`, background: bg, color, cursor: 'pointer' })
const btnOff: CSSProperties = { ...btn('#CBBF9E', '#555'), boxShadow: 'none', cursor: 'not-allowed' }
const hint: CSSProperties = { fontSize: 10.5, fontWeight: 700, color: '#555', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.35 }
const kicker: CSSProperties = { fontSize: 9.5, fontWeight: 900, letterSpacing: 1.4, color: '#6b6b6b', textTransform: 'uppercase', textAlign: 'center', display: 'block' }
const sections = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const
type Section = typeof sections[number]
type Shape = '4-3-3' | '4-4-2'
const needs: Record<Shape, Record<Section, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}
const SEC_LABEL: Record<Section, [string, string]> = { GOL: ['goleiros', 'keepers'], LAT: ['laterais', 'full-backs'], ZAG: ['zagueiros', 'centre-backs'], MEI: ['meias', 'midfielders'], ATA: ['atacantes', 'forwards'] }
const nomeComp = (c: InternationalCompetition | 'mundial') => c === 'libertadores' ? 'Libertadores' : c === 'champions' ? 'Champions League' : tr('Mundial de Clubes', 'Club World Cup')
const emojiComp = (c: InternationalCompetition | 'mundial') => c === 'libertadores' ? '🌎' : c === 'champions' ? '🌍' : '🌐'
const artComp = (c: InternationalCompetition | 'mundial') => c === 'libertadores' ? libertaImg : c === 'champions' ? championsImg : mundialImg
const orgComp = (c: InternationalCompetition | 'mundial') => c === 'libertadores' ? 'CONMEBOL' : c === 'champions' ? 'UEFA' : 'FIFA'
// 🎨 cor/brilho da barra de goleadores por competição (mesma ideia das Copas da liga)
const tintComp = (c: InternationalCompetition | 'mundial') => c === 'libertadores' ? { bg: '#e6f0e8', border: GREEN } : c === 'champions' ? { bg: '#e3e8f5', border: '#0D4FCC' } : { bg: '#fff3c4', border: GOLD, holo: 0.5 }

function clubLeaders(rows: InternationalHistoryEntry[]) {
  const merged = new Map<string, { name: string; goals: number; assists: number }>()
  for (const entry of rows) for (const player of entry.playerStats ?? []) {
    const current = merged.get(player.key) ?? { name: player.name, goals: 0, assists: 0 }
    current.goals += player.goals; current.assists += player.assists
    merged.set(player.key, current)
  }
  const all = [...merged.values()]
  return { scorer: all.sort((a, b) => b.goals - a.goals)[0], assistant: [...all].sort((a, b) => b.assists - a.assists)[0] }
}

// 🎞️ a faixa de cima: arte da competição + título + subtítulo (fase/noite)
function Faixa({ comp, titulo, sub }: { comp: InternationalCompetition | 'mundial'; titulo: string; sub?: string }) {
  return <div style={{ position: 'relative', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', minHeight: 74, boxShadow: `3px 3px 0 ${INK}`, marginBottom: 10, backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.86),rgba(0,0,0,.45)),url(${artComp(comp)})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}>
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 74 }}>
      <span style={{ color: CREME, fontWeight: 700, fontSize: 17, lineHeight: 1, ...OSWALD }}>{emojiComp(comp)} {titulo}</span>
      {sub && <span style={{ color: GOLD, fontWeight: 600, fontSize: 11, letterSpacing: 1, marginTop: 3, ...OSWALD }}>{sub}</span>}
    </div>
  </div>
}

// 📋 lista compacta de jogos de uma fase (sem o(s) meu(s), que já têm o placar grande)
function ListaDaNoite({ phase, campaign, excluir }: { phase: InternationalPhase; campaign: InternationalCampaign; excluir?: string | null }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  const lista = phase.matches.filter(m => !excluir || (m.home !== excluir && m.away !== excluir))
  if (!lista.length) return null
  return <div className="ll29-match-grid">{lista.map((match, i) => {
    const home = teams.get(match.home)!, away = teams.get(match.away)!
    return <CompetitionMatch key={`${match.home}-${match.away}-${i}`} home={home.name} away={away.name}
      homeCrest={home.you ? <Escudo nome={campaign.userTeam} size={28} /> : <SeloClube clube={home.institution} size={28} />}
      awayCrest={away.you ? <Escudo nome={campaign.userTeam} size={28} /> : <SeloClube clube={away.institution} size={28} />}
      homeScore={match.hg} awayScore={match.ag} mine={home.you || away.you} status={tr('ENCERRADO', 'FULL TIME')}
      goals={match.goals.map(g => ({ name: g.name, min: g.min, home: g.home }))} />
  })}</div>
}

// 📊 classificação PARCIAL (só noites já reveladas — a tabela nunca entrega resultado antes do apito)
function Tabela({ rows, me, cortes, titulo, campaign }: { rows: InternationalTableRow[]; me: string | null; cortes: (i: number) => string | null; titulo: string; campaign: InternationalCampaign }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  return <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `3px 3px 0 ${INK}`, marginBottom: 12, fontSize: 12 }}>
    <div style={{ background: INK, color: '#fff', fontWeight: 700, fontSize: 12, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', ...OSWALD }}><span>{titulo}</span><span>J · PTS · SG</span></div>
    {rows.map((r, i) => {
      const t = teams.get(r.team); const cor = cortes(i)
      return <div key={r.team} style={{ display: 'grid', gridTemplateColumns: '22px 26px 1fr 24px 30px 30px', gap: 6, alignItems: 'center', padding: '5px 10px', borderBottom: '2px solid #00000010', fontWeight: 700, borderLeft: cor ? `5px solid ${cor}` : '5px solid transparent', background: r.team === me ? '#FFF3C4' : '#fff', outline: r.team === me ? `2px solid ${GOLD}` : 'none', outlineOffset: -2 }}>
        <span>{i + 1}º</span>{t?.you ? <Escudo nome={campaign.userTeam} size={22} /> : <SeloClube clube={r.team} size={22} />}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.name ?? r.team}{t?.you && <small style={{ color: '#777' }}> · {tr('VOCÊ', 'YOU')}</small>}</span><span style={{ color: '#777' }}>{r.played}</span><span>{r.points}</span><span style={{ color: '#777' }}>{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</span>
      </div>
    })}
  </div>
}

// 🧢 PASSO 3 — a convocação, IGUAL à da Copa do Mundo (`ConvocacaoScreen`), só que o
// pool é o SEU elenco (cartas reais do baralho) e o escudo é o do clube escolhido.
function InscricaoClube({ userTeam, clube, comp, real, onBack, onConfirm }: { userTeam: string; clube: string; comp: InternationalCompetition; real: WonCard[]; onBack: () => void; onConfirm: (xi: WonCard[]) => void }) {
  const faces = useLegendPresentation()
  const shapeAvailable = (form: Shape) => sections.every(pos => new Set(real.filter(c => c.pos === pos).map(internationalCardKey)).size >= needs[form][pos])
  const [shape, setShape] = useState<Shape>(shapeAvailable('4-3-3') ? '4-3-3' : '4-4-2')
  const [tab, setTab] = useState<Section>('GOL')
  const [q, setQ] = useState('')
  const [xi, setXi] = useState<string[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const need = needs[shape]
  const selected = xi.map(id => real.find(c => c.id === id)).filter((c): c is WonCard => !!c)
  const bySec = (s: Section) => selected.filter(c => c.pos === s)
  const registered = validInternationalXI(selected) && sections.every(s => bySec(s).length === need[s])
  const toggle = (c: WonCard) => {
    if (xi.includes(c.id)) { setXi(ids => ids.filter(id => id !== c.id)); setAviso(null); return }
    if (selected.some(o => internationalCardKey(o) === internationalCardKey(c))) { setAviso(tr(`${c.name} (${c.club} ${c.year}) já está convocado.`, `${c.name} (${c.club} ${c.year}) is already called up.`)); return }
    if (bySec(c.pos as Section).length >= need[c.pos as Section]) { setAviso(tr(`${c.pos} já está completo no ${shape} — tire um pra convocar ${c.name}.`, `${c.pos} is already full in the ${shape} — remove one to call up ${c.name}.`)); return }
    setXi(ids => [...ids, c.id]); setAviso(null)
  }
  const list = real.filter(c => c.pos === tab && c.name.toLowerCase().includes(q.toLowerCase()))
  const linha = (slots: { sec: Section; c: WonCard | null }[]) => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4 }}>
    {slots.map((sl, i) => sl.c ? <JogadorNoCampo key={i} nome={sl.c.name} clube={sl.c.club} ano={sl.c.year} tag={sl.sec} alt={52} fonteNome={10} rosto={faces} /> : <VagaNoCampo key={i} tag={sl.sec} alt={52} />)}
  </div>
  const slotsDe = (s: Section) => { const picked = bySec(s); return Array.from({ length: need[s] }, (_, i) => ({ sec: s, c: picked[i] ?? null })) }
  const lat = slotsDe('LAT'), zag = slotsDe('ZAG')
  return <>
    <div style={{ background: INK, border: `3px solid ${INK}`, borderRadius: 13, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, color: '#fff' }}>
      <SeloClube clube={clube} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: 0 }}>{tr('Convocação', 'Call-up')} · {clube}</p>
        <p style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.65)', margin: '2px 0 0' }}>{real.length} {tr('jogadores no seu elenco — só carta real do baralho conta. Convoque 11.', 'players in your squad — only real deck cards count. Call up 11.')}</p>
      </div>
      <div style={{ background: GOLD, border: `2px solid ${INK}`, borderRadius: 10, padding: '4px 9px', textAlign: 'center', color: INK }}>
        <b style={{ display: 'block', fontSize: 15, lineHeight: 1, ...OSWALD }}>{selected.length}/11</b>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1 }}>{tr('CONVOCADOS', 'CALLED UP')}</span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      {(['4-3-3', '4-4-2'] as Shape[]).map(f => { const ok = shapeAvailable(f); return <button key={f} type="button" disabled={!ok} onClick={() => { setShape(f); setXi([]); setAviso(null) }}
        style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 4px', fontWeight: 900, fontSize: 12, ...OSWALD, cursor: ok ? 'pointer' : 'not-allowed', background: !ok ? '#CBBF9E' : shape === f ? GOLD : '#fff', boxShadow: shape === f ? `2px 2px 0 0 ${INK}` : 'none', opacity: ok ? 1 : .7 }}>{ok ? f : `🔒 ${f}`}</button> })}
    </div>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      {sections.map(s => { const done = bySec(s).length >= need[s]; return <button key={s} type="button" onClick={() => setTab(s)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 2px', fontWeight: 900, fontSize: 10.5, ...OSWALD, cursor: 'pointer', background: done ? GREEN : tab === s ? GOLD : '#fff', color: done ? '#fff' : INK, boxShadow: tab === s ? `2px 2px 0 0 ${INK}` : 'none' }}>
        {s}<span style={{ display: 'block', fontSize: 7.5, fontWeight: 800, opacity: .8, fontFamily: 'Inter, system-ui, sans-serif' }}>{bySec(s).length}/{need[s]}{done ? ' ✓' : ''}</span></button> })}
    </div>
    {aviso && <div role="status" style={{ border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 10px', marginBottom: 8, background: '#FDE9C8', fontWeight: 800, fontSize: 10.5, lineHeight: 1.4 }}>✋ {aviso}</div>}
    <input value={q} onChange={e => setQ(e.target.value)} placeholder={`${tr('🔎 buscar nos', '🔎 search the')} ${real.filter(c => c.pos === tab).length} ${tr(...SEC_LABEL[tab])}…`}
      style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 11, padding: '7px 11px', fontWeight: 800, fontSize: 12, background: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
    <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10, boxShadow: `3px 3px 0 0 ${INK}` }}>
      <div style={{ maxHeight: 250, overflowY: 'auto' }}>
        {list.map(c => { const on = xi.includes(c.id); const full = !on && bySec(c.pos as Section).length >= need[c.pos as Section]; return <button key={c.id} type="button" onClick={() => toggle(c)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: 'none', borderBottom: '2px solid rgba(0,0,0,.07)', background: on ? '#E9F5EC' : full ? '#EFE7D2' : '#fff', cursor: 'pointer', opacity: full ? .62 : 1, textAlign: 'left' }}>
          <span style={{ width: 22, height: 22, border: `2.5px solid ${INK}`, borderRadius: 7, background: on ? GREEN : '#fff', color: on ? '#fff' : 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{on ? '✓' : full ? '🔒' : ''}</span>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
          {on && <span style={{ background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 999, fontSize: 7, fontWeight: 900, padding: '1px 5px', flexShrink: 0 }}>{tr('toque pra tirar', 'tap to remove')}</span>}
          <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.club} · {c.year}</span>
        </button> })}
        {list.length === 0 && <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', padding: 14 }}>{tr('ninguém com esse nome aqui… 🔎', 'nobody with that name here… 🔎')}</p>}
      </div>
    </div>
    <div style={{ border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `4px 4px 0 0 ${INK}`, marginBottom: 10 }}>
      <div style={{ background: INK, color: '#fff', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ ...OSWALD, fontWeight: 900, fontSize: 11, letterSpacing: .5 }}>{clube} · {selected.length}/11 · {shape}</span>
      </div>
      <div style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)`, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {linha(slotsDe('ATA'))}{linha(slotsDe('MEI'))}{linha([lat[0], ...zag, lat[1]])}{linha(slotsDe('GOL'))}
      </div>
    </div>
    <button type="button" disabled={!registered} onClick={() => registered && onConfirm(selected)} style={registered ? btn(GREEN, '#fff') : btnOff}>
      {registered ? `✓ ${tr('Confirmar os 11 e começar a', 'Confirm the 11 and start the')} ${nomeComp(comp)}` : `${tr('Faltam', 'Missing')} ${11 - selected.length} ${tr('pra fechar os 11', 'to complete the 11')}`}
    </button>
    <button type="button" onClick={onBack} style={{ ...btn('#fff'), marginTop: 8, fontSize: 12, padding: 8 }}>‹ {tr('Trocar de clube', 'Change club')}</button>
    <p style={hint}>{tr('A inscrição fica congelada durante a campanha. ', 'The squad is frozen for the whole campaign. ')}{userTeam} {tr('mantém escudo, mascote e elenco.', 'keeps its crest, mascot and squad.')}</p>
  </>
}

// ⚽ UMA PARTIDA MINHA no placar padrão da liga (tempo rolando, lance do gol, mascote).
function MeuJogo({ match, campaign, comp, roundKey, onFim }: { match: InternationalMatch; campaign: InternationalCampaign; comp: InternationalCompetition | 'mundial'; roundKey: number; onFim: () => void }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  const home = teams.get(match.home)!, away = teams.get(match.away)!
  const goals: ScoreGoal[] = match.goals.map(g => ({ name: g.name, min: g.min, home: g.home, assist: g.assist }))
  const [fim, setFim] = useState(false)
  useEffect(() => { setFim(false) }, [roundKey])
  useApitoDeLargada('intl-carreira', roundKey, true)
  return <LiveScoreCard enhancedCareer homeName={home.name} awayName={away.name}
    homeColor={copaSideColor(home.institution)} awayColor={copaSideColor(away.institution)}
    homeEmblem={home.you ? undefined : <SeloClube clube={home.institution} size={58} />} awayEmblem={away.you ? undefined : <SeloClube clube={away.institution} size={58} />}
    youIsHome={home.you} goals={goals} roundKey={roundKey} roundMs={COPA_LEG_MS / 0.82} footTint={tintComp(comp)}
    onMinuteChange={m => { if (m >= 93 && !fim) { setFim(true); onFim() } }} />
}

export function CareerInternationalView(p: Props) {
  const [manual] = useSimMode()
  const [comp, setComp] = useState<InternationalCompetition | null>(null)
  const [club, setClub] = useState<string | null>(null)
  const [modo, setModo] = useState<'pular' | 'assistir' | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const real = useMemo(() => p.squad.filter(isRealInternationalCard), [p.squad])
  const podeInscrever = (['4-3-3', '4-4-2'] as Shape[]).some(form => sections.every(pos => new Set(real.filter(c => c.pos === pos).map(internationalCardKey)).size >= needs[form][pos]))
  const current = p.campaign?.season === p.season ? p.campaign : null
  const finished = p.history.some(entry => entry.season === p.season)
  const rep = current?.representedClub ?? null
  const myComp: InternationalCompetition | null = rep ? (INTERNATIONAL_CLUBS.find(c => c.name === rep)?.competition ?? null) : null
  const begin = (representedClub: string | null, xi: WonCard[]) => {
    p.onStart(makeInternationalCampaign({ season: p.season, seed: p.seed, representedClub, userTeam: p.userTeam, userId: p.userId, priority: representedClub ? p.priority : null, userXI: representedClub ? xi as Card[] : [] }))
  }
  // ── a noite atual ──────────────────────────────────────────────────────────
  const reveal = current?.reveal ?? 0
  const step = current && reveal < current.steps.length ? current.steps[reveal] : null
  const faseMinha: InternationalPhase | undefined = step ? (step.mundial ?? (myComp ? step[myComp] : undefined)) : undefined
  const compDaFase: InternationalCompetition | 'mundial' | null = faseMinha ? faseMinha.competition : null
  const meusJogos = useMemo(() => faseMinha && rep ? faseMinha.matches.filter(m => m.home === rep || m.away === rep) : [], [faseMinha, rep])
  const minhaTie: InternationalTie | undefined = faseMinha?.ties?.find(t => rep && (t.home === rep || t.away === rep))
  const [jogo, setJogo] = useState(0)
  const [fimJogo, setFimJogo] = useState(false)
  useEffect(() => { setJogo(0); setFimJogo(false) }, [reveal])
  const avancar = () => {
    if (!current) return
    if (rep && (faseMinha?.title === 'Final' && (current.libertadoresChampion === rep || current.championsChampion === rep) || faseMinha?.competition === 'mundial' && current.mundialChampion === rep) && mascoteKeyDoTime(p.userTeam)) setCelebrate(true)
    p.onAdvance()
  }
  // 🤫 noite em que a MINHA competição não joga: passa sozinha (é assim que "não vejo a outra")
  const noiteVazia = !!current && !!step && !!rep && !faseMinha
  useEffect(() => { if (noiteVazia) p.onAdvance() }, [noiteVazia, reveal]) // eslint-disable-line react-hooks/exhaustive-deps
  // ⏭️ PULAR (sem vaga): a campanha roda inteira sem mostrar nada e já encerra
  const pulando = !!current && !rep && modo === 'pular' && !finished
  useEffect(() => {
    if (!pulando || !current) return
    if (current.reveal < current.steps.length) p.onAdvance()
    else p.onFinish(summarizeInternationalCampaign(current))
  }, [pulando, current?.reveal]) // eslint-disable-line react-hooks/exhaustive-deps
  // ⏩ ritmo AUTO: depois do apito o jogo de volta / a próxima noite vêm sozinhos
  const ultimoJogo = jogo >= meusJogos.length - 1
  useEffect(() => {
    if (manual || !current || !fimJogo) return
    const t = setTimeout(() => { if (!ultimoJogo) { setJogo(j => j + 1); setFimJogo(false) } else avancar() }, ultimoJogo ? 2600 : 1400)
    return () => clearTimeout(t)
  }, [manual, fimJogo, ultimoJogo]) // eslint-disable-line react-hooks/exhaustive-deps
  const semJogoMeu = !!current && !!faseMinha && rep && meusJogos.length === 0
  useEffect(() => {
    if (manual || !semJogoMeu) return
    const t = setTimeout(avancar, 3200)
    return () => clearTimeout(t)
  }, [manual, semJogoMeu, reveal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── classificação parcial (só o que já foi revelado) ───────────────────────
  const tabelaParcial = useMemo(() => {
    if (!current || !myComp || reveal > 8) return null
    const reveladas = current.steps.slice(0, reveal)
    if (myComp === 'libertadores') {
      const grupo = current.libertadoresGroups.find(g => g.some(r => r.team === rep))
      if (!grupo) return null
      const ids = grupo.map(r => r.team)
      const jogos = reveladas.flatMap(s => s.libertadores?.title.startsWith('Grupos') ? s.libertadores.matches : []).filter(m => ids.includes(m.home) && ids.includes(m.away))
      const letra = String.fromCharCode(65 + current.libertadoresGroups.indexOf(grupo))
      return { titulo: `${tr('Grupo', 'Group')} ${letra}`, rows: tableFor(ids, jogos), cortes: (i: number) => i < 2 ? GREEN : i === 2 ? GOLD : null }
    }
    const ids = current.championsTable.map(r => r.team)
    const jogos = reveladas.flatMap(s => s.champions?.title.startsWith('Tabela') ? s.champions.matches : [])
    return { titulo: tr('Tabela · 36 clubes', 'Table · 36 clubs'), rows: tableFor(ids, jogos), cortes: (i: number) => i < 8 ? GREEN : i < 24 ? '#0D4FCC' : null }
  }, [current, myComp, reveal, rep])
  // 🔵 progresso: quantas noites da MINHA competição já passaram, de quantas
  const progresso = useMemo(() => {
    if (!current || !myComp) return null
    const noites = current.steps.filter(s => s[myComp] || s.mundial)
    const feitas = current.steps.slice(0, reveal).filter(s => s[myComp] || s.mundial).length
    return { total: noites.length, feitas }
  }, [current, myComp, reveal])

  // ── ESTANTE / RANKING (fica embaixo de tudo, dobrado) ──────────────────────
  const rodape = <>
    {p.history.filter(e => e.representedClub).length > 0 && <details style={{ marginTop: 15 }}><summary><b>{tr('ESTANTE · CLUBES REPRESENTADOS', 'SHELF · CLUBS REPRESENTED')}</b></summary>{INTERNATIONAL_CLUBS.filter(c => p.history.some(e => e.representedClub === c.name)).map(c => { const rows = p.history.filter(e => e.representedClub === c.name); const total = (key: 'games' | 'wins' | 'draws' | 'losses' | 'goalsFor' | 'goalsAgainst' | 'libertadores' | 'champions' | 'mundial' | 'runnerUp') => rows.reduce((n, e) => n + e[key], 0); const leaders = clubLeaders(rows); return <p key={c.name} style={{ fontSize: 12 }}><SeloClube clube={c.name} size={20} /> <b>{c.name}</b> · {rows.length} {tr('participações', 'entries')} ({rows.map(e => e.season).join(', ')}) · {total('games')} J · {total('wins')} V · {total('draws')} E · {total('losses')} D · {total('goalsFor')} GP · {total('goalsAgainst')} GC · {total('libertadores')} Libertadores · {total('champions')} Champions · {total('mundial')} {tr('Mundiais', 'Club World Cups')} · {total('runnerUp')} {tr('vices', 'runner-ups')} · {tr('artilheiro', 'top scorer')}: {leaders.scorer?.name ?? '—'} ({leaders.scorer?.goals ?? 0}) · {tr('garçom', 'top assists')}: {leaders.assistant?.name ?? '—'} ({leaders.assistant?.assists ?? 0})</p> })}</details>}
    {p.history.length > 0 && <details style={{ marginTop: 15 }}><summary><b>🌐 {tr('RANKING INTERNACIONAL DE CLUBES', 'INTERNATIONAL CLUB RANKING')}</b></summary><p style={{ fontSize: 11 }}>{tr('Títulos: Mundial 60 · Libertadores 50 · Champions 50. Vitórias, saldo e nome desempatam.', 'Titles: Club World Cup 60 · Libertadores 50 · Champions 50. Wins, goal difference and name break ties.')}</p><ol style={{ paddingLeft: 24, fontSize: 12 }}>{internationalCareerRanking(p.history).map(row => <li key={row.club} style={{ marginBottom: 4 }}><SeloClube clube={row.club} size={19} /> <b>{row.club}</b> · {row.points} pts · {row.mundial} Mundial · {row.libertadores} Libertadores · {row.champions} Champions · {row.games} J · {row.wins} V · {row.draws} E · {row.losses} D · {row.goalsFor}–{row.goalsAgainst}</li>)}</ol></details>}
  </>

  // ══════════════════════════════════════════════════════════════════════════
  // 1) CAMPANHA ENCERRADA nesta temporada: só o resumo
  if (finished && current) {
    const mine = p.history.find(e => e.season === p.season)
    return <section style={frame} aria-label="Futebol internacional de clubes">
      <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
      <div style={{ ...card, textAlign: 'center', marginTop: 8 }}>
        <p style={{ margin: 0, fontWeight: 800 }}>🏆 Libertadores: <b>{current.libertadoresChampion}</b> · Champions: <b>{current.championsChampion}</b><br />🌐 {tr('Mundial', 'Club World Cup')}: <b>{current.mundialChampion}</b></p>
        {mine?.representedClub && <p style={{ margin: '8px 0 0', fontSize: 12 }}>{p.userTeam} ({mine.representedClub}): <b>{mine.bestCampaign}</b> · {mine.wins}V {mine.draws}E {mine.losses}D · {mine.goalsFor}–{mine.goalsAgainst}{mine.prizeCoins > 0 && <> · 🪙 +{mine.prizeCoins}</>}</p>}
      </div>
      {rodape}
    </section>
  }

  // 2) AINDA NÃO COMEÇOU: passo 1 (competição) → 2 (clube) → 3 (convocação) · ou sem vaga
  if (!current) {
    const temVaga = p.choices.length > 0 && podeInscrever
    const passos = <div style={{ display: 'flex', gap: 5, justifyContent: 'center', margin: '8px 0 2px', flexWrap: 'wrap' }}>
      {([tr('competição', 'competition'), tr('clube', 'club'), tr('convocação', 'call-up')]).map((n, k) => { const i = club ? 2 : comp ? 1 : 0; return <span key={n} style={{ border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 900, background: k < i ? GREEN : k === i ? GOLD : '#fff', color: k < i ? '#fff' : INK }}>{k < i ? '✓ ' : `${k + 1}· `}{n}</span> })}
    </div>
    return <section style={frame} aria-label="Futebol internacional de clubes">
      {!temVaga ? <>
        {/* ── SEM VAGA (ou sem 11 cartas reais): pula ou assiste ── */}
        <div style={card}>
          <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
          <h2 style={{ ...OSWALD, fontWeight: 700, fontSize: 22, margin: '4px 0 2px', textAlign: 'center', lineHeight: 1.05 }}>{p.choices.length ? tr('Elenco sem 11 cartas reais', 'Squad without 11 real cards') : tr('Sem vaga este ano', 'No spot this year')}</h2>
          <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, textAlign: 'center', margin: '6px 0 0' }}>
            {p.choices.length
              ? tr('Pra se inscrever precisa de 1 goleiro, 2 laterais, 2 zagueiros e meias/atacantes de verdade pra fechar um 4-3-3 ou 4-4-2. Reforce o elenco e volte na próxima.', 'To enrol you need 1 keeper, 2 full-backs, 2 centre-backs and enough real midfielders/forwards for a 4-3-3 or 4-4-2. Strengthen the squad and come back next season.')
              : tr('A vaga é dos 8 primeiros da Série A ou do campeão da Copa. Ano que vem tem mais.', 'Spots go to the top 8 of Série A or the Cup winner. There is always next season.')}
          </p>
          <button type="button" style={{ ...btn('#fff'), marginTop: 12 }} onClick={() => { setModo('pular'); begin(null, []) }}>⏭️ {tr('Pular', 'Skip')}</button>
          <button type="button" style={{ ...btn(), marginTop: 10 }} onClick={() => { setModo('assistir'); begin(null, []) }}>📺 {tr('Assistir as competições', 'Watch the competitions')}</button>
          <p style={hint}>{tr('Assistir = Libertadores, Champions e Mundial com os clubes dos bots, no seu ritmo (auto ou manual).', 'Watch = Libertadores, Champions and Club World Cup with the bot clubs, at your pace (auto or manual).')}</p>
        </div>
        <div className="ll37-intl-heroes">
          <CompetitionStage kind="liberta" title="CONMEBOL" phase="LIBERTADORES" detail="" />
          <CompetitionStage kind="champions" title="UEFA" phase="CHAMPIONS LEAGUE" detail="" />
        </div>
      </> : !comp ? <>
        {/* ── PASSO 1: a competição ── */}
        <div style={card}>
          <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
          {passos}
          <h2 style={{ ...OSWALD, fontWeight: 700, fontSize: 22, margin: '4px 0 2px', textAlign: 'center', lineHeight: 1.05 }}>🏆 {tr('Você tem vaga!', 'You have a spot!')}</h2>
          <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, textAlign: 'center', margin: '6px 0 0' }}>{p.priority === 1 ? tr('Campeão da Série A', 'Série A champion') : tr(`Prioridade ${p.priority} na Série A`, `Priority ${p.priority} in Série A`)}: {tr('escolha', 'pick')} <b>{tr('UMA', 'ONE')}</b> {tr('competição pra esta temporada.', 'competition for this season.')} {p.userTeam} {tr('leva escudo, mascote e elenco.', 'brings its crest, mascot and squad.')}</p>
        </div>
        <div className="ll37-intl-heroes">
          <CompetitionStage kind="liberta" title="CONMEBOL" phase="LIBERTADORES" detail={tr('A campanha sul-americana rumo à final.', 'The South American road to the final.')}>
            <div style={{ padding: '0 12px 12px' }}><button type="button" style={{ ...btn(), fontSize: 12, padding: 8 }} onClick={() => setComp('libertadores')}>{tr('Jogar a Libertadores', 'Play the Libertadores')} ›</button></div>
          </CompetitionStage>
          <CompetitionStage kind="champions" title="UEFA" phase="CHAMPIONS LEAGUE" detail={tr('A campanha europeia rumo à final.', 'The European road to the final.')}>
            <div style={{ padding: '0 12px 12px' }}><button type="button" style={{ ...btn('#fff'), fontSize: 12, padding: 8 }} onClick={() => setComp('champions')}>{tr('Jogar a Champions', 'Play the Champions')} ›</button></div>
          </CompetitionStage>
        </div>
        <p style={hint}>🌐 {tr('O Mundial de Clubes vem só no fim: o campeão da sua competição pega o campeão da outra, em jogo único.', 'The Club World Cup comes only at the end: your champion faces the other champion in a single match.')}</p>
      </> : !club ? <>
        {/* ── PASSO 2: o clube (só os blocos DESTA competição) ── */}
        <Faixa comp={comp} titulo={`${nomeComp(comp)} · ${tr('escolha seu clube', 'choose your club')}`} sub={`${tr('Passo 2 de 3', 'Step 2 of 3')} · ${tr('só clubes da', 'only clubs from')} ${orgComp(comp)}`} />
        {passos}
        <div style={{ ...card, padding: '10px 12px', marginTop: 8 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{tr('Sua prioridade é', 'Your priority is')} <b>{p.priority}</b>{p.priority === 1 ? ` (${tr('campeão da A', 'Série A champion')})` : ''}: {tr('blocos', 'blocks')} {p.priority}–9 {tr('liberados', 'available')}. {p.userTeam} {tr('só veste a camisa do clube: escudo, mascote e elenco continuam os seus.', 'only wears the club shirt: crest, mascot and squad stay yours.')}</p></div>
        {INTERNATIONAL_BLOCKS.map((block, index) => {
          const nomes = block[comp].filter(name => p.choices.some(c => c.name === name))
          if (!nomes.length) return null
          return <div key={index} style={{ marginBottom: 4 }}>
            <p style={{ ...OSWALD, fontWeight: 700, fontSize: 13, margin: '10px 0 5px' }}>{tr('Bloco', 'Block')} {index + 1}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {nomes.map(name => <button key={name} type="button" onClick={() => setClub(name)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `2.5px solid ${INK}`, borderRadius: 12, padding: '5px 10px 5px 6px', background: '#fff', ...OSWALD, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}><SeloClube clube={name} size={24} />{name}</button>)}
            </div>
          </div>
        })}
        <button type="button" onClick={() => setComp(null)} style={{ ...btn('#fff'), marginTop: 12, fontSize: 12, padding: 8 }}>‹ {tr('Trocar de competição', 'Change competition')}</button>
        <p style={hint}>{comp === 'libertadores' ? tr('Nenhum clube da Champions aparece aqui. Quem joga a Libertadores só vê a Conmebol.', 'No Champions club appears here. Libertadores players only see Conmebol.') : tr('Nenhum clube da Libertadores aparece aqui. Quem joga a Champions só vê a UEFA.', 'No Libertadores club appears here. Champions players only see UEFA.')}</p>
      </> : <>
        {/* ── PASSO 3: a convocação ── */}
        {passos}
        <InscricaoClube userTeam={p.userTeam} clube={club} comp={comp} real={real} onBack={() => setClub(null)} onConfirm={xi => begin(club, xi)} />
      </>}
      {rodape}
    </section>
  }

  // 3) CAMPANHA RODANDO
  const acabou = reveal >= current.steps.length
  const compBanner: InternationalCompetition | 'mundial' = compDaFase ?? myComp ?? 'libertadores'
  const teams = new Map(current.teams.map(t => [t.id, t]))
  const nomeDe = (id: string) => teams.get(id)?.name ?? id
  const fimDaTie = minhaTie && fimJogo && ultimoJogo
  return <section style={frame} aria-label="Futebol internacional de clubes">
    {celebrate && mascoteKeyDoTime(p.userTeam) && <FestaoMascote nome={p.userTeam} mascote={mascoteKeyDoTime(p.userTeam)!} onDone={() => setCelebrate(false)} />}
    {!rep ? <>
      {/* ── 📺 ASSISTINDO (sem vaga): as duas competições, noite a noite, em lista ── */}
      <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
      {pulando ? <p style={{ textAlign: 'center', fontWeight: 800, padding: 12 }}>⏭️ {tr('Pulando as competições…', 'Skipping the competitions…')}</p> : acabou ? <>
        <div style={{ ...card, textAlign: 'center', marginTop: 8 }}><p style={{ margin: 0, fontWeight: 800 }}>🏆 Libertadores: <b>{current.libertadoresChampion}</b> · Champions: <b>{current.championsChampion}</b><br />🌐 {tr('Mundial', 'Club World Cup')}: <b>{current.mundialChampion}</b></p></div>
        <button type="button" style={btn()} onClick={() => p.onFinish(summarizeInternationalCampaign(current))}>{tr('Encerrar e ver o jornal', 'Finish and read the paper')} ›</button>
      </> : step && <>
        <p style={{ textAlign: 'center', fontWeight: 800, fontSize: 12, margin: '6px 0 10px' }}>{step.label} · {reveal + 1}/{current.steps.length}</p>
        {step.mundial && <><Faixa comp="mundial" titulo={tr('Mundial de Clubes · final', 'Club World Cup · final')} sub={tr('jogo único', 'single match')} /><ListaDaNoite phase={step.mundial} campaign={current} /></>}
        {step.libertadores && <><Faixa comp="libertadores" titulo="Libertadores" sub={step.libertadores.title} /><ListaDaNoite phase={step.libertadores} campaign={current} /></>}
        {step.champions && <><Faixa comp="champions" titulo="Champions League" sub={step.champions.title} /><ListaDaNoite phase={step.champions} campaign={current} /></>}
        <button type="button" style={{ ...btn(), marginTop: 10 }} onClick={avancar}>{tr('Próxima noite', 'Next night')} ›</button>
      </>}
    </> : acabou ? <>
      {/* ── FIM: campeões + encerrar ── */}
      <Faixa comp={myComp === 'libertadores' ? 'libertadores' : 'champions'} titulo={tr('Campanha encerrada', 'Campaign over')} sub={`${p.userTeam} · ${rep}`} />
      <div style={{ ...card, textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 800 }}>🏆 {nomeComp(myComp!)}: <b>{nomeDe(myComp === 'libertadores' ? current.libertadoresChampion : current.championsChampion)}</b><br />🌐 {tr('Mundial', 'Club World Cup')}: <b>{nomeDe(current.mundialChampion)}</b></p>
        <p style={{ margin: '8px 0 0', fontSize: 12 }}>{summarizeInternationalCampaign(current).bestCampaign}{summarizeInternationalCampaign(current).prizeCoins > 0 && <> · 🪙 +{summarizeInternationalCampaign(current).prizeCoins}</>}</p>
      </div>
      <button type="button" style={btn()} onClick={() => p.onFinish(summarizeInternationalCampaign(current))}>{tr('Encerrar campanha e ver o jornal', 'Finish the campaign and read the paper')} ›</button>
    </> : noiteVazia || !faseMinha ? <p style={{ textAlign: 'center', fontWeight: 800, padding: 12 }}>⏳</p> : <>
      {/* ── A NOITE DA MINHA COMPETIÇÃO ── */}
      <Faixa comp={compBanner} titulo={compDaFase === 'mundial' ? tr('Mundial de Clubes · final', 'Club World Cup · final') : `${nomeComp(compBanner)} · ${faseMinha.title}`}
        sub={compDaFase === 'mundial' ? `${tr('jogo único', 'single match')} · ${nomeDe(current.libertadoresChampion)} × ${nomeDe(current.championsChampion)}` : `${p.userTeam} · ${tr('representando', 'representing')} ${rep}${minhaTie && minhaTie.matches.length === 2 ? ` · ${jogo === 0 ? tr('jogo de ida', '1st leg') : tr('jogo de volta', '2nd leg')}` : ''}`} />
      {progresso && <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '0 0 10px', flexWrap: 'wrap' }}>{Array.from({ length: progresso.total }, (_, i) => <i key={i} style={{ width: 18, height: 6, borderRadius: 3, background: i < progresso.feitas ? GREEN : i === progresso.feitas ? GOLD : '#0003', outline: i === progresso.feitas ? `2px solid ${INK}` : 'none' }} />)}</div>}
      {meusJogos.length ? <>
        <MeuJogo match={meusJogos[jogo] ?? meusJogos[0]} campaign={current} comp={compBanner} roundKey={reveal * 10 + jogo} onFim={() => setFimJogo(true)} />
        {fimDaTie && minhaTie && <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 10px', marginTop: -4, marginBottom: 10, textAlign: 'center' }}>
          {minhaTie.matches.length === 2 && <p style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(0,0,0,.55)', margin: '0 0 3px' }}>{tr('ida', '1st leg')} {minhaTie.matches[0].hg}×{minhaTie.matches[0].ag} · {tr('volta', '2nd leg')} {minhaTie.matches[1].hg}×{minhaTie.matches[1].ag} · <b>{tr('agregado', 'aggregate')} {minhaTie.matches[0].hg + minhaTie.matches[1].ag}×{minhaTie.matches[0].ag + minhaTie.matches[1].hg}</b> ({nomeDe(minhaTie.home)} × {nomeDe(minhaTie.away)})</p>}
          {minhaTie.penalties && <p style={{ margin: '2px 0', fontWeight: 900, ...OSWALD, fontSize: 13 }}>🥅 {tr('Pênaltis', 'Penalties')} {minhaTie.penalties[0]} × {minhaTie.penalties[1]}</p>}
          <p style={{ margin: '3px 0 0', fontWeight: 900, fontSize: 11, ...OSWALD, color: minhaTie.winner === rep ? GREEN : '#C2452F' }}>{minhaTie.winner === rep ? `✅ ${p.userTeam} ${compDaFase === 'mundial' || faseMinha.title === 'Final' ? tr('é campeão!', 'is champion!') : tr('avança', 'advances')}` : `❌ ${nomeDe(minhaTie.winner)} ${compDaFase === 'mundial' || faseMinha.title === 'Final' ? tr('é campeão', 'is champion') : tr('avança', 'advances')}`}</p>
        </div>}
        {fimJogo && !ultimoJogo && manual && <button type="button" style={btn()} onClick={() => { setJogo(j => j + 1); setFimJogo(false) }}>{tr('Jogo de volta', '2nd leg')} ›</button>}
        {fimJogo && ultimoJogo && (manual ? <button type="button" style={btn()} onClick={avancar}>{tr('Próximo', 'Next')} ›</button> : <p style={hint}>⏩ {tr('próxima noite em instantes…', 'next night in a moment…')}</p>)}
      </> : <>
        <div style={{ ...card, textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 800, fontSize: 12 }}>{compDaFase === 'mundial' ? tr('Você ficou pelo caminho. Esta é a final do Mundial entre os dois campeões.', 'You fell short. This is the Club World Cup final between the two champions.') : tr('Você já está fora desta fase. Os outros jogos da noite:', 'You are out of this stage. Tonight\'s other matches:')}</p></div>
        <ListaDaNoite phase={faseMinha} campaign={current} />
        {manual ? <button type="button" style={{ ...btn(), marginTop: 10 }} onClick={avancar}>{tr('Próximo', 'Next')} ›</button> : <p style={hint}>⏩ {tr('próxima noite em instantes…', 'next night in a moment…')}</p>}
      </>}
      {fimJogo && meusJogos.length > 0 && <details style={{ marginTop: 10 }}><summary style={{ fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>📋 {tr('Outros jogos da noite', 'Other matches tonight')}</summary><div style={{ marginTop: 8 }}><ListaDaNoite phase={faseMinha} campaign={current} excluir={rep} /></div></details>}
      {tabelaParcial && tabelaParcial.rows.some(r => r.played > 0) && <details style={{ marginTop: 10 }} open={fimJogo}><summary style={{ fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>📊 {tr('Classificação', 'Standings')}</summary><div style={{ marginTop: 8 }}><Tabela rows={tabelaParcial.rows} me={rep} cortes={tabelaParcial.cortes} titulo={tabelaParcial.titulo} campaign={current} /></div></details>}
    </>}
    {rodape}
  </section>
}
