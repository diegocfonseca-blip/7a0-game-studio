// ─── 🌎 CARREIRA INTERNACIONAL — a tela, PASSO A PASSO (01/10, pedido do Diego) ────
//
// Palavras dele no 1º teste: *"primeiro deveria aparecer só o banner da competição
// que quero jogar, como passo a passo… se for Libertadores mostrar só os blocos
// dos times da Libertadores… depois convocar igual já temos… se tô na Liberta não
// vejo da Champions e vice-versa… a simulação deve ser bonita, padrão das Copas,
// rolando o tempo… depois que acabar vem o banner do Mundial, jogo único… quem não
// se classificou pode pular ou assistir"*.
//
// 🔁 2ª rodada (02/10), depois de ele jogar a 1ª versão: *"tá estranho… cadê o botão de
// manual que é padrão?… tem que ser com base no que já existe… a tabela aparece de
// cara… na final deveria aparecer as duas finais ao mesmo tempo… se eu quiser
// assistir, eu assisto qual?"*. Então a campanha agora é montada com as MESMAS peças da
// Copa da carreira e da Liberta do online, nesta ordem: faixa da competição → o SEU jogo
// no placar grande → 🎮 Controle da partida (velocidade · Próxima rodada · Pular · Modo
// auto, ou o cadeado de quem não tem Modo Manual) → a TABELA sempre à vista (grupo /
// tabela de 36 / chaves do mata-mata) → os outros jogos da noite. Nada de "Próximo".
//
// O MOTOR não mudou (`makeInternationalCampaign` + as 3 ações do reducer): a campanha
// continua congelada no save com 14 "noites" e o contador `reveal`. Noite em que a
// competição em foco não joga é pulada sozinha — por isso "não vejo a outra". As duas
// FINAIS caem na mesma noite (13ª): a sua no placar grande, a outra num cartão.
// 🔓 A Champions só abre depois de ganhar a Libertadores (`championsLiberada`).
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Card, WonCard } from './types'
import { INTERNATIONAL_BLOCKS, INTERNATIONAL_CLUBS, championsLiberada, internationalCardKey, internationalClubCards, validInternationalXI, type InternationalClub, type InternationalCompetition } from './career-international'
import { makeInternationalCampaign, tableFor, type InternationalCampaign, type InternationalHistoryEntry, type InternationalMatch, type InternationalPhase, type InternationalTableRow, type InternationalTie } from './career-international-season'
import { summarizeInternationalCampaign } from './career-international-summary'
import { CompetitionMatch, CompetitionStage } from './online-match-visual'
import { Escudo } from './escudos'
import { SeloClube } from './selo-clube'
import { mascoteKeyDoTime, FestaoMascote } from './mascotes'
import { tr } from './lang'
import { JogadorNoCampo, VagaNoCampo } from './jogadorcampo'
import { useLegendPresentation } from './presentation-release'
import { LiveScoreCard, COPA_LEG_MS, copaSideColor, useApitoDeLargada, type ScoreGoal } from './pyramidseason'
import { useSimMode, SimControls, SpeedControls, QuickManualLock } from './screens'
import { useEsc } from './store'
import { useHasManual } from './apoio'
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
type Comp = InternationalCompetition | 'mundial'
const nomeComp = (c: Comp) => c === 'libertadores' ? 'Libertadores' : c === 'champions' ? 'Champions League' : tr('Mundial de Clubes', 'Club World Cup')
const emojiComp = (c: Comp) => c === 'libertadores' ? '🌎' : c === 'champions' ? '🌍' : '🌐'
const artComp = (c: Comp) => c === 'libertadores' ? libertaImg : c === 'champions' ? championsImg : mundialImg
const orgComp = (c: Comp) => c === 'libertadores' ? 'CONMEBOL' : c === 'champions' ? 'UEFA' : 'FIFA'
// 🎨 cor/brilho da barra de goleadores por competição (mesma ideia das Copas da liga)
const tintComp = (c: Comp) => c === 'libertadores' ? { bg: '#e6f0e8', border: GREEN } : c === 'champions' ? { bg: '#e3e8f5', border: '#0D4FCC' } : { bg: '#fff3c4', border: GOLD, holo: 0.5 }
const outra = (c: InternationalCompetition): InternationalCompetition => c === 'libertadores' ? 'champions' : 'libertadores'
const tituloFase = (t: string) => t.startsWith('Grupos') ? tr(t.replace('Grupos', 'Grupos'), t.replace('Grupos · rodada', 'Groups · round')) : t.startsWith('Tabela') ? tr(t, t.replace('Tabela · rodada', 'Table · round')) : t === 'Oitavas' ? tr('Oitavas', 'Round of 16') : t === 'Quartas' ? tr('Quartas', 'Quarter-finals') : t === 'Semifinal' ? tr('Semifinal', 'Semi-final') : t === 'Repescagem' ? tr('Repescagem', 'Play-off') : t
// 💾 o que a pessoa escolheu quando ficou SEM VAGA (pular / qual acompanhar), por temporada,
// pra não perguntar de novo se a tela recarregar no meio.
const MODO_KEY = 'esc-intl-modo-v1'
type ModoSemVaga = 'pular' | InternationalCompetition
const leModo = (season: number): ModoSemVaga | null => { try { const v = JSON.parse(localStorage.getItem(MODO_KEY) ?? 'null'); return v && v.season === season ? v.modo : null } catch { return null } }
const gravaModo = (season: number, modo: ModoSemVaga) => { try { localStorage.setItem(MODO_KEY, JSON.stringify({ season, modo })) } catch { /* sem espaço */ } }

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
function Faixa({ comp, titulo, sub }: { comp: Comp; titulo: string; sub?: string }) {
  return <div style={{ position: 'relative', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', minHeight: 74, boxShadow: `3px 3px 0 ${INK}`, marginBottom: 10, backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.86),rgba(0,0,0,.45)),url(${artComp(comp)})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}>
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 74 }}>
      <span style={{ color: CREME, fontWeight: 700, fontSize: 17, lineHeight: 1, ...OSWALD }}>{emojiComp(comp)} {titulo}</span>
      {sub && <span style={{ color: GOLD, fontWeight: 600, fontSize: 11, letterSpacing: 1, marginTop: 3, ...OSWALD }}>{sub}</span>}
    </div>
  </div>
}

const crestOf = (campaign: InternationalCampaign, id: string, size: number) => {
  const t = campaign.teams.find(x => x.id === id)
  return t?.you ? <Escudo nome={campaign.userTeam} size={size} /> : <SeloClube clube={t?.institution ?? id} size={size} />
}

// 📋 lista compacta de jogos de uma fase (sem o(s) meu(s), que já têm o placar grande)
function ListaDaNoite({ phase, campaign, excluir, titulo }: { phase: InternationalPhase; campaign: InternationalCampaign; excluir?: string | null; titulo?: string }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  const lista = phase.matches.filter(m => !excluir || (m.home !== excluir && m.away !== excluir))
  if (!lista.length) return null
  return <div style={{ marginBottom: 12 }}>
    {titulo && <p style={{ ...OSWALD, fontWeight: 700, fontSize: 12, margin: '0 0 6px 2px' }}>{titulo}</p>}
    <div className="ll29-match-grid">{lista.map((match, i) => {
      const home = teams.get(match.home)!, away = teams.get(match.away)!
      return <CompetitionMatch key={`${match.home}-${match.away}-${i}`} home={home.name} away={away.name}
        homeCrest={crestOf(campaign, match.home, 28)} awayCrest={crestOf(campaign, match.away, 28)}
        homeScore={match.hg} awayScore={match.ag} mine={home.you || away.you} status={tr('ENCERRADO', 'FULL TIME')}
        goals={match.goals.map(g => ({ name: g.name, min: g.min, home: g.home }))} />
    })}</div>
  </div>
}

// 🥅 a MESMA pílula compacta da Liberta do online ("Peñarol 1×1 Olimpia") pras noites de
// grupos/tabela, que têm 17–18 jogos — cartão grande pra cada um viraria um paredão.
function PilulasDaNoite({ phase, campaign, excluir, titulo }: { phase: InternationalPhase; campaign: InternationalCampaign; excluir?: string | null; titulo: string }) {
  const nome = (id: string) => campaign.teams.find(t => t.id === id)?.name ?? id
  const lista = phase.matches.filter(m => !excluir || (m.home !== excluir && m.away !== excluir))
  if (!lista.length) return null
  return <div style={{ ...card, padding: '9px 10px' }}>
    <p style={{ ...OSWALD, fontWeight: 700, fontSize: 11, margin: '0 0 6px', color: INK }}>{titulo}</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 5 }}>
      {lista.map((m, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, borderRadius: 9, padding: '4px 6px', background: CREME, border: '2px solid rgba(0,0,0,.18)', color: INK }}>
        <span style={{ flex: 1, minWidth: 0, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome(m.home)}</span>
        {crestOf(campaign, m.home, 16)}<b style={{ ...OSWALD, fontSize: 12, flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{m.hg}×{m.ag}</b>{crestOf(campaign, m.away, 16)}
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome(m.away)}</span>
      </div>)}
    </div>
  </div>
}

// 🏆 A OUTRA FINAL, na mesma noite (cartão com a arte da outra competição + o placar fechado)
function OutraFinal({ phase, campaign }: { phase: InternationalPhase; campaign: InternationalCampaign }) {
  const tie = phase.ties?.[0]; const m = phase.matches[0]
  if (!tie || !m) return null
  const nome = (id: string) => campaign.teams.find(t => t.id === id)?.name ?? id
  const comp = phase.competition as InternationalCompetition
  // 🪙 escudo escuro (Juventus, Newcastle…) sumia no fundo escuro: vai num disco creme
  const disco: CSSProperties = { display: 'inline-grid', placeItems: 'center', width: 52, height: 52, borderRadius: '50%', background: CREME, border: `2px solid ${INK}` }
  return <div style={{ position: 'relative', border: `3px solid ${INK}`, borderRadius: 16, overflow: 'hidden', boxShadow: `4px 4px 0 ${INK}`, marginBottom: 12, backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.87),rgba(0,0,0,.6)),url(${artComp(comp)})`, backgroundSize: 'cover', backgroundPosition: 'center 30%', padding: '10px 12px' }}>
    <span style={{ color: GOLD, ...OSWALD, fontWeight: 700, fontSize: 11, letterSpacing: 1.5 }}>{emojiComp(comp)} {tr('A outra final', 'The other final')} · {nomeComp(comp)} · {tr('mesma noite', 'same night')}</span>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <div style={{ textAlign: 'center', color: CREME }}><span style={disco}>{crestOf(campaign, m.home, 40)}</span><b style={{ display: 'block', ...OSWALD, fontWeight: 700, fontSize: 14, marginTop: 3 }}>{nome(m.home)}</b></div>
      <div style={{ background: CREME, color: INK, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '5px 10px', textAlign: 'center', ...OSWALD, fontWeight: 700, fontSize: 24, lineHeight: 1 }}>
        <small style={{ display: 'block', fontSize: 8, fontWeight: 900, letterSpacing: 1, fontFamily: 'Inter, system-ui, sans-serif' }}>{tr('ENCERRADO', 'FULL TIME')}</small>{m.hg} × {m.ag}
        {tie.penalties && <small style={{ display: 'block', fontSize: 9, fontWeight: 900, fontFamily: 'Inter, system-ui, sans-serif' }}>🥅 {tie.penalties[0]}×{tie.penalties[1]}</small>}
      </div>
      <div style={{ textAlign: 'center', color: CREME }}><span style={disco}>{crestOf(campaign, m.away, 40)}</span><b style={{ display: 'block', ...OSWALD, fontWeight: 700, fontSize: 14, marginTop: 3 }}>{nome(m.away)}</b></div>
    </div>
    <p style={{ color: 'rgba(244,236,214,.8)', fontSize: 10, fontWeight: 700, margin: '6px 0 0', textAlign: 'center' }}>🏆 {nome(tie.winner)} {tr('é campeão da', 'wins the')} {nomeComp(comp)} {tr('e vai pro 🌐 Mundial — jogo único, na próxima noite.', 'and goes to the 🌐 Club World Cup — single match, next night.')}</p>
  </div>
}

// 📊 classificação (só noites já reveladas — a tabela nunca entrega resultado antes do apito)
function Tabela({ rows, me, cortes, titulo, campaign, legenda, apagaDepoisDe }: { rows: InternationalTableRow[]; me: string | null; cortes: (i: number) => string | null; titulo: string; campaign: InternationalCampaign; legenda?: { cor: string; txt: string }[]; apagaDepoisDe?: number }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  return <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `3px 3px 0 ${INK}`, marginBottom: 12, fontSize: 12 }}>
    <div style={{ background: INK, color: '#fff', fontWeight: 700, fontSize: 12, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', ...OSWALD }}><span>{titulo}</span><span>J · PTS · SG</span></div>
    {rows.map((r, i) => {
      const t = teams.get(r.team); const cor = cortes(i)
      return <div key={r.team} style={{ display: 'grid', gridTemplateColumns: '22px 26px 1fr 24px 30px 30px', gap: 6, alignItems: 'center', padding: '5px 10px', borderBottom: '2px solid #00000010', fontWeight: 700, color: INK, borderLeft: cor ? `5px solid ${cor}` : '5px solid transparent', background: r.team === me ? '#FFF3C4' : '#fff', outline: r.team === me ? `2px solid ${GOLD}` : 'none', outlineOffset: -2, opacity: apagaDepoisDe !== undefined && i >= apagaDepoisDe ? .5 : 1 }}>
        <span>{i + 1}º</span>{t?.you ? <Escudo nome={campaign.userTeam} size={22} /> : <SeloClube clube={r.team} size={22} />}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.name ?? r.team}{t?.you && <small style={{ color: '#777' }}> · {tr('VOCÊ', 'YOU')}</small>}</span><span style={{ color: '#777' }}>{r.played}</span><span>{r.points}</span><span style={{ color: '#777' }}>{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</span>
      </div>
    })}
    {legenda && <div style={{ display: 'flex', gap: 10, padding: '6px 10px', fontSize: 9, fontWeight: 800, color: 'rgba(0,0,0,.6)', background: CREME, flexWrap: 'wrap' }}>{legenda.map(l => <span key={l.txt}><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: l.cor, verticalAlign: -1, marginRight: 3 }} />{l.txt}</span>)}</div>}
  </div>
}

// 🧢 PASSO 3 — a convocação, IGUAL à da Copa do Mundo (`ConvocacaoScreen`): escolheu o
// Flamengo, convoca entre TODOS os jogadores do Flamengo que existem no baralho
// (Diego 01/10: *"eu não levo meu elenco… é todo jogador do Flamengo no baralho, todo
// jogador do Real Madrid, do River Plate"*). O elenco do usuário NÃO entra. Clube sem
// carta pra fechar um 4-3-3/4-4-2 nem chega aqui: fica trancado no passo 2.
type PoolCard = Card
const fechaForm = (cards: { pos: string; name: string; club: string; year: number }[], form: Shape) => sections.every(pos => new Set(cards.filter(c => c.pos === pos).map(internationalCardKey)).size >= needs[form][pos])
/** o clube tem jogadores no baralho pra fechar um time? (72 dos 72 desde o Lote 40) */
export const clubeFechaTime = (clube: string) => { const cs = internationalClubCards(clube); return fechaForm(cs, '4-3-3') || fechaForm(cs, '4-4-2') }
function InscricaoClube({ userTeam, clube, comp, onBack, onConfirm }: { userTeam: string; clube: string; comp: InternationalCompetition; onBack: () => void; onConfirm: (xi: Card[]) => void }) {
  const faces = useLegendPresentation()
  const doClube = useMemo<PoolCard[]>(() => internationalClubCards(clube).map(c => c as unknown as Card), [clube])
  const real = doClube
  const shapeAvailable = (form: Shape) => fechaForm(real, form)
  const [shape, setShape] = useState<Shape>(shapeAvailable('4-3-3') ? '4-3-3' : '4-4-2')
  const [tab, setTab] = useState<Section>('GOL')
  const [q, setQ] = useState('')
  const [xi, setXi] = useState<string[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const need = needs[shape]
  const selected = xi.map(id => real.find(c => c.id === id)).filter((c): c is PoolCard => !!c)
  const bySec = (s: Section) => selected.filter(c => c.pos === s)
  const registered = validInternationalXI(selected) && sections.every(s => bySec(s).length === need[s])
  const toggle = (c: PoolCard) => {
    if (xi.includes(c.id)) { setXi(ids => ids.filter(id => id !== c.id)); setAviso(null); return }
    if (selected.some(o => internationalCardKey(o) === internationalCardKey(c))) { setAviso(tr(`${c.name} (${c.club} ${c.year}) já está convocado.`, `${c.name} (${c.club} ${c.year}) is already called up.`)); return }
    if (bySec(c.pos as Section).length >= need[c.pos as Section]) { setAviso(tr(`${c.pos} já está completo no ${shape} — tire um pra convocar ${c.name}.`, `${c.pos} is already full in the ${shape} — remove one to call up ${c.name}.`)); return }
    setXi(ids => [...ids, c.id]); setAviso(null)
  }
  const list = real.filter(c => c.pos === tab && c.name.toLowerCase().includes(q.toLowerCase()))
  const linha = (slots: { sec: Section; c: PoolCard | null }[]) => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4 }}>
    {slots.map((sl, i) => sl.c ? <JogadorNoCampo key={i} nome={sl.c.name} clube={sl.c.club} ano={sl.c.year} tag={sl.sec} alt={52} fonteNome={10} rosto={faces} /> : <VagaNoCampo key={i} tag={sl.sec} alt={52} />)}
  </div>
  const slotsDe = (s: Section) => { const picked = bySec(s); return Array.from({ length: need[s] }, (_, i) => ({ sec: s, c: picked[i] ?? null })) }
  const lat = slotsDe('LAT'), zag = slotsDe('ZAG')
  return <>
    <div style={{ background: INK, border: `3px solid ${INK}`, borderRadius: 13, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, color: '#fff' }}>
      <SeloClube clube={clube} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: 0 }}>{tr('Convocação', 'Call-up')} · {clube}</p>
        <p style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.65)', margin: '2px 0 0' }}>{doClube.length} {tr('jogadores do', 'players of')} {clube} {tr('no baralho — só nome, clube e ano. Convoque 11.', 'in the deck — just name, club and year. Call up 11.')}</p>
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
    {aviso &&<div role="status" style={{ border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 10px', marginBottom: 8, background: '#FDE9C8', fontWeight: 800, fontSize: 10.5, lineHeight: 1.4 }}>✋ {aviso}</div>}
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
    <p style={hint}>{tr('Igual à Copa do Mundo: os jogadores do', 'Like the World Cup: the players of')} {clube} {tr('jogam pelo clube deles. A convocação fica congelada durante a campanha. ', 'play for their club. The call-up is frozen for the whole campaign. ')}{userTeam} {tr('mantém escudo e mascote.', 'keeps its crest and mascot.')}</p>
  </>
}

// ⚽ UMA PARTIDA no placar padrão da liga (tempo rolando, lance do gol, mascote). É o SEU
// jogo — ou, pra quem só assiste, a final do Mundial (um jogo só, merece o placar grande).
function JogoGrande({ match, campaign, comp, roundKey, speed, onFim }: { match: InternationalMatch; campaign: InternationalCampaign; comp: Comp; roundKey: number; speed: number; onFim: () => void }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  const home = teams.get(match.home)!, away = teams.get(match.away)!
  const goals: ScoreGoal[] = match.goals.map(g => ({ name: g.name, min: g.min, home: g.home, assist: g.assist }))
  const [fim, setFim] = useState(false)
  useEffect(() => { setFim(false) }, [roundKey])
  useApitoDeLargada('intl-carreira', roundKey, true)
  return <LiveScoreCard enhancedCareer homeName={home.name} awayName={away.name}
    homeColor={copaSideColor(home.institution)} awayColor={copaSideColor(away.institution)}
    homeEmblem={home.you ? undefined : <SeloClube clube={home.institution} size={58} />} awayEmblem={away.you ? undefined : <SeloClube clube={away.institution} size={58} />}
    youIsHome={home.you} goals={goals} roundKey={roundKey} roundMs={Math.round(COPA_LEG_MS / 0.82 / speed)} footTint={tintComp(comp)}
    onMinuteChange={m => { if (m >= 93 && !fim) { setFim(true); onFim() } }} />
}

export function CareerInternationalView(p: Props) {
  const { state, dispatch } = useEsc()
  // 🎮 RITMO — a MESMA régua da Copa da carreira: manual só pra quem tem Modo Manual (ou
  // carreira antiga, sem `careerEra`); a preferência fica no aparelho (`useSimMode`).
  const [manualPref, toggleSim] = useSimMode()
  const hasManual = useHasManual()
  const manualAllowed = !state.careerEra || hasManual
  const manual = manualPref && manualAllowed
  const speed = state.simSpeed && state.simSpeed > 0 ? state.simSpeed : 1
  const toggleManual = () => { const goingManual = !manual; toggleSim(); if (!goingManual && speed !== 1) dispatch({ type: 'SET_SIM_SPEED', speed: 1 }) }
  const [comp, setComp] = useState<InternationalCompetition | null>(null)
  const [club, setClub] = useState<string | null>(null)
  const [modo, setModo] = useState<ModoSemVaga | null>(() => leModo(p.season))
  const [celebrate, setCelebrate] = useState(false)
  const champsOk = championsLiberada(p.history)
  // 🧢 tem vaga E algum clube liberado (e aberto: Champions só depois da Liberta) fecha um time
  const podeInscrever = p.choices.some(c => clubeFechaTime(c.name) && (c.competition === 'libertadores' || champsOk))
  const current = p.campaign?.season === p.season ? p.campaign : null
  const finished = p.history.some(entry => entry.season === p.season)
  const rep = current?.representedClub ?? null
  const myComp: InternationalCompetition | null = rep ? (INTERNATIONAL_CLUBS.find(c => c.name === rep)?.competition ?? null) : null
  // 👀 a competição EM FOCO: a minha, ou a que escolhi acompanhar (sem vaga)
  const foco: InternationalCompetition | null = myComp ?? (modo && modo !== 'pular' ? modo : null)
  const begin = (representedClub: string | null, xi: Card[]) => {
    p.onStart(makeInternationalCampaign({ season: p.season, seed: p.seed, representedClub, userTeam: p.userTeam, userId: p.userId, priority: representedClub ? p.priority : null, userXI: representedClub ? xi : [] }))
  }
  const escolheModo = (m: ModoSemVaga) => { gravaModo(p.season, m); setModo(m); if (!current) begin(null, []) }
  // ── a noite atual ──────────────────────────────────────────────────────────
  const reveal = current?.reveal ?? 0
  const step = current && reveal < current.steps.length ? current.steps[reveal] : null
  const faseFoco: InternationalPhase | undefined = step ? (step.mundial ?? (foco ? step[foco] : undefined)) : undefined
  const compDaFase: Comp | null = faseFoco ? faseFoco.competition : null
  const meusJogos = useMemo(() => faseFoco && rep ? faseFoco.matches.filter(m => m.home === rep || m.away === rep) : [], [faseFoco, rep])
  const minhaTie: InternationalTie | undefined = faseFoco?.ties?.find(t => rep && (t.home === rep || t.away === rep))
  const [jogo, setJogo] = useState(0)
  const [fimJogo, setFimJogo] = useState(false)
  // 📊 grupos da Liberta: MEU GRUPO / TODOS OS GRUPOS — o mesmo seletor da Liberta do online
  const [grupoView, setGrupoView] = useState<'meu' | 'todos'>('meu')
  useEffect(() => { setJogo(0); setFimJogo(false) }, [reveal])
  // 🎬 o jogo do placar grande: o meu — ou a final do Mundial pra quem só assiste
  const jogoGrande: InternationalMatch | undefined = meusJogos[jogo] ?? (compDaFase === 'mundial' && !meusJogos.length ? faseFoco?.matches[0] : undefined)
  const ultimoJogo = jogo >= meusJogos.length - 1
  const pronto = jogoGrande ? fimJogo : true // noite sem placar grande: a lista já vem pronta
  const avancar = () => {
    if (!current) return
    if (rep && (faseFoco?.title === 'Final' && (current.libertadoresChampion === rep || current.championsChampion === rep) || faseFoco?.competition === 'mundial' && current.mundialChampion === rep) && mascoteKeyDoTime(p.userTeam)) setCelebrate(true)
    p.onAdvance()
  }
  const proximo = () => { if (jogoGrande && meusJogos.length && !ultimoJogo) { setJogo(j => j + 1); setFimJogo(false) } else avancar() }
  // 🤫 noite em que a competição EM FOCO não joga: passa sozinha (é assim que "não vejo a outra")
  const noiteVazia = !!current && !!step && !!foco && !faseFoco
  useEffect(() => { if (noiteVazia) p.onAdvance() }, [noiteVazia, reveal]) // eslint-disable-line react-hooks/exhaustive-deps
  // ⏭️ PULAR (sem vaga): a campanha roda inteira sem mostrar nada e já encerra
  const pulando = !!current && !rep && modo === 'pular' && !finished
  useEffect(() => {
    if (!pulando || !current) return
    if (current.reveal < current.steps.length) p.onAdvance()
    else p.onFinish(summarizeInternationalCampaign(current))
  }, [pulando, current?.reveal]) // eslint-disable-line react-hooks/exhaustive-deps
  // ⏩ ritmo AUTO: depois do apito o jogo de volta / a próxima noite vêm sozinhos
  useEffect(() => {
    if (manual || !current || !jogoGrande || !fimJogo) return
    const t = setTimeout(proximo, meusJogos.length && !ultimoJogo ? 1400 : 2600)
    return () => clearTimeout(t)
  }, [manual, fimJogo, ultimoJogo, !!jogoGrande]) // eslint-disable-line react-hooks/exhaustive-deps
  const soLista = !!current && !!faseFoco && !jogoGrande
  useEffect(() => {
    if (manual || !soLista || noiteVazia) return
    const t = setTimeout(avancar, Math.round(3600 / speed))
    return () => clearTimeout(t)
  }, [manual, soLista, reveal, speed]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── classificação (anti-spoiler: a noite de hoje só entra depois do apito) ──
  const tabelas = useMemo(() => {
    if (!current || !foco || !faseFoco || faseFoco.competition === 'mundial') return null
    const emGrupos = faseFoco.title.startsWith('Grupos') || faseFoco.title.startsWith('Tabela')
    if (!emGrupos) return null
    const reveladas = current.steps.slice(0, reveal + (pronto ? 1 : 0))
    if (foco === 'libertadores') {
      const jogos = reveladas.flatMap(s => s.libertadores?.title.startsWith('Grupos') ? s.libertadores.matches : [])
      const grupos = current.libertadoresGroups.map((g, gi) => ({ letra: String.fromCharCode(65 + gi), ids: g.map(r => r.team) }))
      const meu = grupos.findIndex(g => rep && g.ids.includes(rep))
      const ordem = meu >= 0 ? [grupos[meu], ...grupos.filter((_, i) => i !== meu)] : grupos
      return ordem.map(g => ({ titulo: `${tr('Grupo', 'Group')} ${g.letra}${rep && g.ids.includes(rep) ? tr(' · o seu', ' · yours') : ''}`, rows: tableFor(g.ids, jogos.filter(m => g.ids.includes(m.home) && g.ids.includes(m.away))), cortes: (i: number) => i < 2 ? GREEN : i === 2 ? GOLD : null, legenda: [{ cor: GREEN, txt: tr('2 primeiros passam', 'top 2 go through') }, { cor: GOLD, txt: tr('3º entre os 4 melhores', '3rd among the best 4') }], apaga: undefined as number | undefined }))
    }
    const ids = current.championsTable.map(r => r.team)
    const jogos = reveladas.flatMap(s => s.champions?.title.startsWith('Tabela') ? s.champions.matches : [])
    return [{ titulo: tr('Tabela · 36 clubes', 'Table · 36 clubs'), rows: tableFor(ids, jogos), cortes: (i: number) => i < 8 ? GREEN : i < 24 ? GOLD : '#9A9384', legenda: [{ cor: GREEN, txt: tr('1º–8º direto pras oitavas', '1st–8th straight to the last 16') }, { cor: GOLD, txt: tr('9º–24º repescão', '9th–24th play-off') }, { cor: '#9A9384', txt: tr('25º–36º fora', '25th–36th out') }], apaga: 24 as number | undefined }]
  }, [current, foco, faseFoco, reveal, pronto, rep])
  // 🔵 progresso: quantas noites da competição em foco já passaram, de quantas
  const progresso = useMemo(() => {
    if (!current || !foco) return null
    const noites = current.steps.filter(s => s[foco] || s.mundial)
    const feitas = current.steps.slice(0, reveal).filter(s => s[foco] || s.mundial).length
    return { total: noites.length, feitas }
  }, [current, foco, reveal])

  // ── ESTANTE (fica embaixo de tudo, dobrada) ────────────────────────────────
  const rodape = <>
    {p.history.filter(e => e.representedClub).length > 0 && <details style={{ marginTop: 15 }}><summary><b>{tr('ESTANTE · CLUBES REPRESENTADOS', 'SHELF · CLUBS REPRESENTED')}</b></summary>{INTERNATIONAL_CLUBS.filter(c => p.history.some(e => e.representedClub === c.name)).map(c => { const rows = p.history.filter(e => e.representedClub === c.name); const total = (key: 'games' | 'wins' | 'draws' | 'losses' | 'goalsFor' | 'goalsAgainst' | 'libertadores' | 'champions' | 'mundial' | 'runnerUp') => rows.reduce((n, e) => n + e[key], 0); const leaders = clubLeaders(rows); return <p key={c.name} style={{ fontSize: 12 }}><SeloClube clube={c.name} size={20} /> <b>{c.name}</b> · {rows.length} {tr('participações', 'entries')} ({rows.map(e => e.season).join(', ')}) · {total('games')} J · {total('wins')} V · {total('draws')} E · {total('losses')} D · {total('goalsFor')} GP · {total('goalsAgainst')} GC · {total('libertadores')} Libertadores · {total('champions')} Champions · {total('mundial')} {tr('Mundiais', 'Club World Cups')} · {total('runnerUp')} {tr('vices', 'runner-ups')} · {tr('artilheiro', 'top scorer')}: {leaders.scorer?.name ?? '—'} ({leaders.scorer?.goals ?? 0}) · {tr('garçom', 'top assists')}: {leaders.assistant?.name ?? '—'} ({leaders.assistant?.assists ?? 0})</p> })}</details>}
    {/* 🚫 01/10 (Diego): o "ranking internacional de clubes" saiu da tela — *"não serve pra nada"*. O que conta pro usuário é o ranking GLOBAL (aba Rank). */}
  </>

  // 🎮 o cartão de controle — a MESMA peça da Copa da carreira (velocidade + Próxima/Pular/Auto;
  // no auto só o botão de pausar; sem Modo Manual, o cadeado que leva pro Apoie)
  const controle = (label: string, canNext: boolean) => manualAllowed ? (
    <div className="ll-cx-controle" style={{ ...card, padding: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 9.5, letterSpacing: 1, color: 'rgba(0,0,0,.45)', margin: '0 0 7px 2px' }}>{tr('🎮 Controle da partida', '🎮 Match controls')}</p>
      {manual && <SpeedControls speed={speed} onSet={v => dispatch({ type: 'SET_SIM_SPEED', speed: v })} />}
      <SimControls manual={manual} onToggle={toggleManual} canNext={canNext} onNext={proximo} onSkip={proximo} nextLabel={label} />
    </div>
  ) : <QuickManualLock />

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
        {/* ── SEM VAGA: pula, ou escolhe QUAL acompanhar (Diego 02/10: *"eu assisto qual?"*) ── */}
        <div style={card}>
          <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
          <h2 style={{ ...OSWALD, fontWeight: 700, fontSize: 22, margin: '4px 0 2px', textAlign: 'center', lineHeight: 1.05, color: INK }}>{p.choices.length ? tr('Sem clube pra convocar', 'No club to call up') : tr('Sem vaga este ano', 'No spot this year')}</h2>
          <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, textAlign: 'center', margin: '6px 0 0', color: INK }}>
            {p.choices.length
              ? champsOk
                ? tr(`Você tem vaga (prioridade ${p.priority}), mas nenhum clube dos blocos ${p.priority}–9 tem jogadores suficientes no baralho pra fechar um time. Suba na tabela pra abrir blocos melhores.`, `You have a spot (priority ${p.priority}), but no club in blocks ${p.priority}–9 has enough players in the deck to field a team. Finish higher to unlock better blocks.`)
                : tr(`Você tem vaga (prioridade ${p.priority}), mas nenhum clube da Libertadores dos blocos ${p.priority}–9 fecha um time — e a Champions só abre depois de ganhar a Libertadores.`, `You have a spot (priority ${p.priority}), but no Libertadores club in blocks ${p.priority}–9 can field a team — and the Champions only opens after you win the Libertadores.`)
              : tr('A vaga é dos 8 primeiros da Série A ou do campeão da Copa. Ano que vem tem mais.', 'Spots go to the top 8 of Série A or the Cup winner. There is always next season.')}
          </p>
          <button type="button" style={{ ...btn('#fff'), marginTop: 12 }} onClick={() => escolheModo('pular')}>⏭️ {tr('Pular as competições', 'Skip the competitions')}</button>
        </div>
        <div style={card}>
          <span style={kicker}>📺 {tr('ou assistir — qual você quer acompanhar?', 'or watch — which one do you want to follow?')}</span>
          <div className="ll37-intl-heroes" style={{ marginTop: 8 }}>
            <CompetitionStage kind="liberta" title="CONMEBOL" phase="LIBERTADORES" detail="">
              <div style={{ padding: '0 12px 12px' }}><button type="button" style={{ ...btn(), fontSize: 12, padding: 8 }} onClick={() => escolheModo('libertadores')}>{tr('Acompanhar a Libertadores', 'Follow the Libertadores')} ›</button></div>
            </CompetitionStage>
            <CompetitionStage kind="champions" title="UEFA" phase="CHAMPIONS LEAGUE" detail="">
              <div style={{ padding: '0 12px 12px' }}><button type="button" style={{ ...btn('#fff'), fontSize: 12, padding: 8 }} onClick={() => escolheModo('champions')}>{tr('Acompanhar a Champions', 'Follow the Champions')} ›</button></div>
            </CompetitionStage>
          </div>
          <p style={hint}>{tr('Você segue UMA, na mesma tela de quem joga (tabela + jogos da noite, mesmo controle auto/manual). No fim, o Mundial aparece pros dois lados.', 'You follow ONE, on the same screen as the players (table + matches of the night, same auto/manual controls). At the end, the Club World Cup shows up for both sides.')}</p>
        </div>
        <p style={hint}>⏭️ {tr('Pulou? A temporada fecha os campeões por trás e segue pro jornal. Nada trava.', 'Skipped? The season settles the champions behind the scenes and moves on to the paper. Nothing gets stuck.')}</p>
      </> : !comp ? <>
        {/* ── PASSO 1: a competição (Champions trancada até ganhar a Libertadores) ── */}
        <div style={card}>
          <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
          {passos}
          <h2 style={{ ...OSWALD, fontWeight: 700, fontSize: 22, margin: '4px 0 2px', textAlign: 'center', lineHeight: 1.05, color: INK }}>🏆 {tr('Você tem vaga!', 'You have a spot!')}</h2>
          <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, textAlign: 'center', margin: '6px 0 0', color: INK }}>{p.priority === 1 ? tr('Campeão da Série A', 'Série A champion') : tr(`Prioridade ${p.priority} na Série A`, `Priority ${p.priority} in Série A`)}: {champsOk ? <>{tr('escolha', 'pick')} <b>{tr('UMA', 'ONE')}</b> {tr('competição pra esta temporada.', 'competition for this season.')}</> : tr('a Libertadores te espera.', 'the Libertadores awaits.')} {p.userTeam} {tr('leva escudo e mascote.', 'brings its crest and mascot.')}</p>
        </div>
        <div className="ll37-intl-heroes">
          <CompetitionStage kind="liberta" title="CONMEBOL" phase="LIBERTADORES" detail={tr('A campanha sul-americana rumo à final.', 'The South American road to the final.')}>
            <div style={{ padding: '0 12px 12px' }}><button type="button" style={{ ...btn(), fontSize: 12, padding: 8 }} onClick={() => setComp('libertadores')}>{tr('Jogar a Libertadores', 'Play the Libertadores')} ›</button></div>
          </CompetitionStage>
          <CompetitionStage kind="champions" title="UEFA" phase="CHAMPIONS LEAGUE" detail={champsOk ? tr('A campanha europeia rumo à final.', 'The European road to the final.') : tr('Abre depois que você levantar a Libertadores.', 'Opens after you lift the Libertadores.')}>
            <div style={{ padding: '0 12px 12px' }}>{champsOk
              ? <button type="button" style={{ ...btn('#fff'), fontSize: 12, padding: 8 }} onClick={() => setComp('champions')}>{tr('Jogar a Champions', 'Play the Champions')} ›</button>
              : <button type="button" disabled style={{ ...btnOff, fontSize: 12, padding: 8 }}>🔒 {tr('Ganhe a Libertadores pra liberar', 'Win the Libertadores to unlock')}</button>}</div>
          </CompetitionStage>
        </div>
        <p style={hint}>🌐 {tr('O Mundial de Clubes vem só no fim: o campeão da sua competição pega o campeão da outra, em jogo único.', 'The Club World Cup comes only at the end: your champion faces the other champion in a single match.')}{!champsOk && <> 🔓 {tr('Ganhou a Libertadores uma vez? A Champions fica aberta pra sempre nesta carreira.', 'Won the Libertadores once? The Champions stays open for good in this career.')}</>}</p>
      </> : !club ? <>
        {/* ── PASSO 2: o clube (só os blocos DESTA competição) ── */}
        <Faixa comp={comp} titulo={`${nomeComp(comp)} · ${tr('escolha seu clube', 'choose your club')}`} sub={`${tr('Passo 2 de 3', 'Step 2 of 3')} · ${tr('só clubes da', 'only clubs from')} ${orgComp(comp)}`} />
        {passos}
        <div style={{ ...card, padding: '10px 12px', marginTop: 8 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{tr('Sua prioridade é', 'Your priority is')} <b>{p.priority}</b>{p.priority === 1 ? ` (${tr('campeão da A', 'Série A champion')})` : ''}: {tr('blocos', 'blocks')} {p.priority}–9 {tr('liberados', 'available')}. {tr('Você convoca os jogadores do clube que existem no baralho, igual à seleção na Copa do Mundo.', 'You call up the club\'s players that exist in the deck, like a national team at the World Cup.')}</p></div>
        {INTERNATIONAL_BLOCKS.map((block, index) => {
          const nomes = block[comp].filter(name => p.choices.some(c => c.name === name))
          if (!nomes.length) return null
          return <div key={index} style={{ marginBottom: 4 }}>
            <p style={{ ...OSWALD, fontWeight: 700, fontSize: 13, margin: '10px 0 5px' }}>{tr('Bloco', 'Block')} {index + 1}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {nomes.map(name => { const n = internationalClubCards(name).length; const ok = clubeFechaTime(name); return <button key={name} type="button" disabled={!ok} onClick={() => ok && setClub(name)} title={ok ? undefined : tr(`${name} tem ${n} jogador${n === 1 ? '' : 'es'} no baralho — não fecha um time`, `${name} has ${n} player${n === 1 ? '' : 's'} in the deck — not enough for a team`)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, border: `2.5px solid ${INK}`, borderRadius: 12, padding: '5px 10px 5px 6px', background: ok ? '#fff' : '#CBBF9E', ...OSWALD, fontWeight: 700, fontSize: 14, cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : .7 }}>
                <SeloClube clube={name} size={24} />{ok ? name : `🔒 ${name}`}<small style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 800, fontSize: 9, color: '#555', textTransform: 'none' }}>{n} {tr('no baralho', 'in deck')}</small></button> })}
            </div>
          </div>
        })}
        <p style={hint}>🔒 {tr('Clube trancado = ainda não tem jogadores suficientes no baralho pra fechar um 4-3-3 ou 4-4-2.', 'Locked club = not enough players in the deck yet to field a 4-3-3 or 4-4-2.')}</p>
        <button type="button" onClick={() => setComp(null)} style={{ ...btn('#fff'), marginTop: 12, fontSize: 12, padding: 8 }}>‹ {tr('Trocar de competição', 'Change competition')}</button>
        <p style={hint}>{comp === 'libertadores' ? tr('Nenhum clube da Champions aparece aqui. Quem joga a Libertadores só vê a Conmebol.', 'No Champions club appears here. Libertadores players only see Conmebol.') : tr('Nenhum clube da Libertadores aparece aqui. Quem joga a Champions só vê a UEFA.', 'No Libertadores club appears here. Champions players only see UEFA.')}</p>
      </> : <>
        {/* ── PASSO 3: a convocação ── */}
        {passos}
        <InscricaoClube userTeam={p.userTeam} clube={club} comp={comp} onBack={() => setClub(null)} onConfirm={xi => begin(club, xi)} />
      </>}
      {rodape}
    </section>
  }

  // 3) CAMPANHA RODANDO
  const acabou = reveal >= current.steps.length
  const teams = new Map(current.teams.map(t => [t.id, t]))
  const nomeDe = (id: string) => teams.get(id)?.name ?? id
  const fimDaTie = minhaTie && fimJogo && ultimoJogo
  const compBanner: Comp = compDaFase ?? foco ?? 'libertadores'
  // 🏆 noite das finais: a outra final aparece num cartão (depois do apito da minha)
  const outraFinal = step && foco && faseFoco?.title === 'Final' ? step[outra(foco)] : undefined
  const finalDaOutraTambem = outraFinal?.title === 'Final' ? outraFinal : undefined
  const rotuloProximo = !pronto ? tr('⏳ Deixa o jogo acabar…', '⏳ Let the match finish…')
    : jogoGrande && meusJogos.length > 1 && !ultimoJogo ? tr('▶️ Jogo de volta', '▶️ 2nd leg')
    : compDaFase === 'mundial' ? tr('🏆 Ver o campeão', '🏆 See the champion')
    : faseFoco?.title === 'Final' ? tr('▶️ Ir pro Mundial', '▶️ On to the Club World Cup')
    : tr('▶️ Próxima rodada', '▶️ Next round')
  // 🚶 "pulando" (sem vaga, modo pular) ou sem foco (recarregou no meio e a escolha se perdeu)
  if (!rep && (pulando || !foco)) {
    return <section style={frame} aria-label="Futebol internacional de clubes">
      <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
      {pulando ? <p style={{ textAlign: 'center', fontWeight: 800, padding: 12 }}>⏭️ {tr('Pulando as competições…', 'Skipping the competitions…')}</p> : <div style={{ ...card, marginTop: 8 }}>
        <span style={kicker}>📺 {tr('qual você quer acompanhar?', 'which one do you want to follow?')}</span>
        <button type="button" style={{ ...btn(), marginTop: 10 }} onClick={() => escolheModo('libertadores')}>🌎 Libertadores ›</button>
        <button type="button" style={{ ...btn('#fff'), marginTop: 8 }} onClick={() => escolheModo('champions')}>🌍 Champions League ›</button>
        <button type="button" style={{ ...btn('#fff'), marginTop: 8, fontSize: 12, padding: 8 }} onClick={() => escolheModo('pular')}>⏭️ {tr('Pular as competições', 'Skip the competitions')}</button>
      </div>}
      {rodape}
    </section>
  }
  return <section style={frame} aria-label="Futebol internacional de clubes">
    {celebrate && mascoteKeyDoTime(p.userTeam) && <FestaoMascote nome={p.userTeam} mascote={mascoteKeyDoTime(p.userTeam)!} onDone={() => setCelebrate(false)} />}
    {acabou ? <>
      {/* ── FIM: campeões + encerrar ── */}
      <Faixa comp={foco ?? 'libertadores'} titulo={tr('Campanha encerrada', 'Campaign over')} sub={rep ? `${p.userTeam} · ${rep}` : tr('você acompanhou a', 'you followed the') + ' ' + nomeComp(foco!)} />
      <div style={{ ...card, textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 800 }}>🏆 Libertadores: <b>{nomeDe(current.libertadoresChampion)}</b> · Champions: <b>{nomeDe(current.championsChampion)}</b><br />🌐 {tr('Mundial', 'Club World Cup')}: <b>{nomeDe(current.mundialChampion)}</b></p>
        {rep && <p style={{ margin: '8px 0 0', fontSize: 12 }}>{summarizeInternationalCampaign(current).bestCampaign}{summarizeInternationalCampaign(current).prizeCoins > 0 && <> · 🪙 +{summarizeInternationalCampaign(current).prizeCoins}</>}</p>}
      </div>
      <button type="button" style={btn()} onClick={() => p.onFinish(summarizeInternationalCampaign(current))}>{tr('Encerrar e ver o jornal', 'Finish and read the paper')} ›</button>
    </> : noiteVazia || !faseFoco || !step ? <p style={{ textAlign: 'center', fontWeight: 800, padding: 12 }}>⏳</p> : <>
      {/* ── A NOITE DA COMPETIÇÃO EM FOCO ── */}
      <Faixa comp={compBanner} titulo={compDaFase === 'mundial' ? tr('Mundial de Clubes · final', 'Club World Cup · final') : `${nomeComp(compBanner)} · ${tituloFase(faseFoco.title)}`}
        sub={compDaFase === 'mundial' ? `${tr('jogo único', 'single match')} · ${nomeDe(current.libertadoresChampion)} × ${nomeDe(current.championsChampion)}`
          : faseFoco.title === 'Final' ? `${tr('jogo único', 'single match')} · ${tr('noite das finais', 'night of the finals')}`
          : rep ? `${p.userTeam} · ${tr('representando', 'representing')} ${rep}${minhaTie && minhaTie.matches.length === 2 ? ` · ${jogo === 0 ? tr('jogo de ida', '1st leg') : tr('jogo de volta', '2nd leg')}` : ''}`
          : `📺 ${tr('você acompanha', 'you are following')} · ${orgComp(compBanner)}`} />
      {progresso && <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '0 0 10px', flexWrap: 'wrap' }}>{Array.from({ length: progresso.total }, (_, i) => <i key={i} style={{ width: 18, height: 6, borderRadius: 3, background: i < progresso.feitas ? GREEN : i === progresso.feitas ? GOLD : '#0003', outline: i === progresso.feitas ? `2px solid ${INK}` : 'none' }} />)}</div>}
      {/* 📺 o placar grande */}
      {jogoGrande && <JogoGrande match={jogoGrande} campaign={current} comp={compBanner} roundKey={reveal * 10 + jogo} speed={speed} onFim={() => setFimJogo(true)} />}
      {!jogoGrande && rep && <div style={{ ...card, textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 800, fontSize: 12 }}>{tr('Você já está fora desta fase. Os jogos da noite:', 'You are out of this stage. Tonight\'s matches:')}</p></div>}
      {fimDaTie && minhaTie && <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 10px', marginTop: -4, marginBottom: 10, textAlign: 'center' }}>
        {minhaTie.matches.length === 2 && <p style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(0,0,0,.55)', margin: '0 0 3px' }}>{tr('ida', '1st leg')} {minhaTie.matches[0].hg}×{minhaTie.matches[0].ag} · {tr('volta', '2nd leg')} {minhaTie.matches[1].hg}×{minhaTie.matches[1].ag} · <b>{tr('agregado', 'aggregate')} {minhaTie.matches[0].hg + minhaTie.matches[1].ag}×{minhaTie.matches[0].ag + minhaTie.matches[1].hg}</b> ({nomeDe(minhaTie.home)} × {nomeDe(minhaTie.away)})</p>}
        {minhaTie.penalties && <p style={{ margin: '2px 0', fontWeight: 900, ...OSWALD, fontSize: 13 }}>🥅 {tr('Pênaltis', 'Penalties')} {minhaTie.penalties[0]} × {minhaTie.penalties[1]}</p>}
        <p style={{ margin: '3px 0 0', fontWeight: 900, fontSize: 11, ...OSWALD, color: minhaTie.winner === rep ? GREEN : '#C2452F' }}>{minhaTie.winner === rep ? `✅ ${p.userTeam} ${compDaFase === 'mundial' || faseFoco.title === 'Final' ? tr('é campeão!', 'is champion!') : tr('avança', 'advances')}` : `❌ ${nomeDe(minhaTie.winner)} ${compDaFase === 'mundial' || faseFoco.title === 'Final' ? tr('é campeão', 'is champion') : tr('avança', 'advances')}`}</p>
      </div>}
      {/* 🎮 o controle, logo abaixo do placar — igual à Copa */}
      {controle(rotuloProximo, pronto)}
      {/* 🏆 noite das finais: a outra final, depois do apito da minha */}
      {pronto && finalDaOutraTambem && <OutraFinal phase={finalDaOutraTambem} campaign={current} />}
      {/* 📊 a tabela SEMPRE à vista (grupos / tabela de 36); no mata-mata, as chaves da noite */}
      {tabelas && tabelas.length > 1 && rep && <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['meu', 'todos'] as const).map(v => <button key={v} type="button" onClick={() => setGrupoView(v)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 4px', fontWeight: 900, fontSize: 11.5, ...OSWALD, background: grupoView === v ? GOLD : '#fff', color: INK, boxShadow: grupoView === v ? `2px 2px 0 ${INK}` : 'none', cursor: 'pointer' }}>{v === 'meu' ? tr('Meu grupo', 'My group') : tr('Todos os grupos', 'All groups')}</button>)}
      </div>}
      {tabelas?.filter((_, i) => i === 0 || !rep || grupoView === 'todos').map(t => <Tabela key={t.titulo} rows={t.rows} me={rep} cortes={t.cortes} titulo={t.titulo} campaign={current} legenda={t.legenda} apagaDepoisDe={t.apaga} />)}
      {/* 🥅 os outros jogos da noite — só depois do apito, senão o placar grande é entregue aqui embaixo.
          Noite de grupos/tabela (17–18 jogos) vai em pílulas compactas; mata-mata (≤ 8) em cartão. */}
      {pronto && (tabelas ? PilulasDaNoite : ListaDaNoite)({ phase: faseFoco, campaign: current, excluir: jogoGrande && rep ? rep : (jogoGrande ? `${jogoGrande.home}` : null), titulo: jogoGrande ? tr('🥅 Os outros jogos da noite', '🥅 The other matches tonight') : tr('🥅 Os jogos da noite', '🥅 Tonight\'s matches') })}
      {!pronto && !tabelas && <p style={hint}>{tr('Os outros jogos aparecem depois do apito.', 'The other matches show up after the whistle.')}</p>}
    </>}
    {rodape}
  </section>
}
