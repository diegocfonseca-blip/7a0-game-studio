import { useState } from 'react'
import type { Card, WonCard } from './types'
import { INTERNATIONAL_BLOCKS, INTERNATIONAL_CLUBS, internationalCardKey, isRealInternationalCard, validInternationalXI, type InternationalClub } from './career-international'
import { makeInternationalCampaign, type InternationalCampaign, type InternationalHistoryEntry, type InternationalPhase } from './career-international-season'
import { summarizeInternationalCampaign } from './career-international-summary'
import { CompetitionMatch, CompetitionStage } from './online-match-visual'
import { Escudo } from './escudos'
import { SeloClube } from './selo-clube'
import { carimboDoTime, mascoteKeyDoTime, FestaoMascote } from './mascotes'
import { tr } from './lang'
import { CMModal } from './copa-mundo'
import { JogadorNoCampo, VagaNoCampo } from './jogadorcampo'
import { useLegendPresentation } from './presentation-release'
import { internationalCareerRanking } from './career-international-ranking'

type Props = {
  season: number; seed: number; userTeam: string; userId: number; squad: WonCard[]
  choices: InternationalClub[]; priority: number | null
  campaign: InternationalCampaign | null; history: InternationalHistoryEntry[]
  onStart: (campaign: InternationalCampaign) => void; onAdvance: () => void; onFinish: (entry: InternationalHistoryEntry) => void
}

const frame: React.CSSProperties = { background: '#F4ECD6', border: '3px solid #0C0C0C', borderRadius: 16, boxShadow: '4px 4px 0 #0C0C0C', padding: 16, marginBottom: 18 }
const button: React.CSSProperties = { border: '2px solid #0C0C0C', borderRadius: 10, background: '#FFC400', color: '#0C0C0C', fontWeight: 900, padding: '10px 14px', cursor: 'pointer' }
const sections = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const
type Section = typeof sections[number]
type Shape = '4-3-3' | '4-4-2'
const needs: Record<Shape, Record<Section, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}
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

function Phase({ phase, campaign }: { phase: InternationalPhase; campaign: InternationalCampaign }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  return <section style={{ marginTop: 14 }}><h4 style={{ margin: '0 0 8px' }}>{phase.competition === 'mundial' ? '🌐' : phase.competition === 'libertadores' ? '🌎' : '🌍'} {phase.title}</h4>
    <div className="ll29-match-grid">{phase.matches.map((match, i) => {
      const home = teams.get(match.home)!, away = teams.get(match.away)!
      return <CompetitionMatch key={`${match.home}-${match.away}-${i}`} home={home.name} away={away.name}
        homeCrest={home.you ? <Escudo nome={campaign.userTeam} size={28} /> : <SeloClube clube={home.institution} size={28} />}
        awayCrest={away.you ? <Escudo nome={campaign.userTeam} size={28} /> : <SeloClube clube={away.institution} size={28} />}
        homeScore={match.hg} awayScore={match.ag} mine={home.you || away.you} status="ENCERRADO"
        goals={match.goals.map(g => ({ name: g.name, min: g.min, home: g.home }))}
        detail={home.you || away.you ? <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {match.goals.some(g => (home.you && g.home) || (away.you && !g.home)) && <span style={{ width: 34, height: 34, overflow: 'hidden' }}>{carimboDoTime(campaign.userTeam)}</span>}
          <small>{campaign.userTeam} · {tr('representando', 'representing')} {campaign.representedClub}</small>
        </div> : undefined} />
    })}</div>
  </section>
}

function CampaignIdentity({ userTeam, institution }: { userTeam: string; institution: string }) {
  return <div className="ll37-intl-identity">
    <Escudo nome={userTeam} size={36} /><b>{userTeam}</b><i />
    <SeloClube clube={institution} size={25} /><span><small>REPRESENTANDO</small><br />{institution}</span>
  </div>
}

export function CareerInternationalView(p: Props) {
  const [club, setClub] = useState<string | null>(null)
  const [xi, setXi] = useState<string[]>([])
  const [celebrate, setCelebrate] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [shape, setShape] = useState<Shape>('4-3-3')
  const [section, setSection] = useState<Section>('GOL')
  const [query, setQuery] = useState('')
  const [enrollNotice, setEnrollNotice] = useState('')
  const faces = useLegendPresentation()
  const valid = p.choices.find(c => c.name === club)
  const real = p.squad.filter(isRealInternationalCard)
  const selected = xi.map(id => real.find(c => c.id === id)).filter((c): c is WonCard => !!c)
  const registered = validInternationalXI(selected)
  const count = (pos: Section) => selected.filter(card => card.pos === pos).length
  const chooseCard = (card: WonCard) => {
    if (xi.includes(card.id)) { setXi(ids => ids.filter(id => id !== card.id)); setEnrollNotice(''); return }
    if (selected.some(other => internationalCardKey(other) === internationalCardKey(card))) {
      setEnrollNotice(`${card.name} · ${card.club} ${card.year} já está inscrito nesta formação.`)
      return
    }
    if (count(card.pos) >= needs[shape][card.pos]) {
      setEnrollNotice(`${card.pos} já está completo. Tire um jogador dessa posição para inscrever ${card.name}.`)
      return
    }
    setXi(ids => [...ids, card.id]); setEnrollNotice('')
  }
  const shapeAvailable = (form: Shape) => sections.every(pos =>
    new Set(real.filter(card => card.pos === pos).map(internationalCardKey)).size >= needs[form][pos])
  const current = p.campaign?.season === p.season ? p.campaign : null
  const represented = current?.representedClub ?? valid?.name ?? null
  const representedCompetition = represented ? INTERNATIONAL_CLUBS.find(c => c.name === represented)?.competition : null
  const finished = p.history.some(entry => entry.season === p.season)
  const begin = (representedClub: string | null) => {
    if (representedClub && (!valid || !registered)) return
    p.onStart(makeInternationalCampaign({ season: p.season, seed: p.seed, representedClub, userTeam: p.userTeam,
      userId: p.userId, priority: representedClub ? p.priority : null, userXI: representedClub ? selected as Card[] : [] }))
  }
  const last = p.history.filter(e => e.representedClub).at(-1)
  const first = club && !p.history.some(e => e.representedClub === club)
  const returnGap = club && p.history.filter(e => e.representedClub === club).at(-1)
  const changedContinent = last && valid && last.competition !== valid.competition
  const advance = () => {
    if (!current) return
    const step = current.steps[current.reveal]
    const club = current.representedClub
    if (club && (step?.libertadores?.title === 'Final' && current.libertadoresChampion === club || step?.champions?.title === 'Final' && current.championsChampion === club || step?.mundial && current.mundialChampion === club) && mascoteKeyDoTime(p.userTeam)) setCelebrate(true)
    p.onAdvance()
  }
  return <section style={frame} aria-label="Futebol internacional de clubes">
    {enrolling && valid && <CMModal><div style={{ background: '#F4ECD6', padding: 15, borderRadius: 15, maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}><Escudo nome={p.userTeam} size={42} /><div style={{ flex: 1 }}><b style={{ fontFamily: 'Oswald, sans-serif', fontSize: 18 }}>INSCRIÇÃO INTERNACIONAL</b><br /><small>{p.userTeam} · representando {valid.name}</small></div><b>{selected.length}/11</b></div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>{(['4-3-3', '4-4-2'] as Shape[]).map(form => <button type="button" key={form} disabled={!shapeAvailable(form)} style={{ ...button, flex: 1, background: shape === form ? '#FFC400' : '#fff', opacity: shapeAvailable(form) ? 1 : .5 }} onClick={() => { setShape(form); setXi([]); setEnrollNotice('') }}>{shapeAvailable(form) ? form : `🔒 ${form}`}</button>)}</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>{sections.map(pos => <button type="button" key={pos} style={{ ...button, flex: 1, padding: '5px 2px', fontSize: 10, background: count(pos) === needs[shape][pos] ? '#1B7A3D' : section === pos ? '#FFC400' : '#fff', color: count(pos) === needs[shape][pos] ? '#fff' : '#0C0C0C' }} onClick={() => setSection(pos)}>{pos}<small style={{ display: 'block' }}>{count(pos)}/{needs[shape][pos]}</small></button>)}</div>
      {enrollNotice && <p role="status" style={{ padding: 8, background: '#FDE9C8', border: '2px solid #0C0C0C', borderRadius: 9, fontWeight: 800 }}>{enrollNotice}</p>}
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`🔎 Buscar ${section} no seu elenco`} style={{ width: '100%', boxSizing: 'border-box', padding: 9, marginBottom: 8, border: '3px solid #0C0C0C', borderRadius: 9 }} />
      <div style={{ maxHeight: 185, overflowY: 'auto', background: '#fff', border: '3px solid #0C0C0C', borderRadius: 10 }}>{real.filter(card => card.pos === section && card.name.toLowerCase().includes(query.toLowerCase())).map(card => <button type="button" key={card.id} onClick={() => chooseCard(card)} style={{ width: '100%', border: 0, borderBottom: '1px solid #ddd', background: xi.includes(card.id) ? '#E9F5EC' : '#fff', padding: 8, textAlign: 'left', display: 'flex', gap: 7, alignItems: 'center' }}><b>{xi.includes(card.id) ? '✓' : count(section) >= needs[shape][section] ? '🔒' : '□'}</b><strong style={{ flex: 1 }}>{card.name}</strong><small>{card.club} · {card.year}</small></button>)}{!real.some(card => card.pos === section) && <p style={{ padding: 9 }}>Seu elenco não tem jogadores desta posição.</p>}</div>
      <div style={{ border: '3px solid #0C0C0C', borderRadius: 12, overflow: 'hidden', marginTop: 10 }}><div style={{ background: '#0C0C0C', color: '#fff', textAlign: 'center', padding: 4, fontWeight: 900 }}>{p.userTeam.toUpperCase()} · {selected.length}/11 · {shape}</div><div style={{ background: 'repeating-linear-gradient(180deg,#1B7A3D 0 34px,#166332 34px 68px)', padding: 9 }}>{(['ATA', 'MEI', 'ZAG', 'GOL'] as Section[]).map(row => { const positions = row === 'ZAG' ? ['LAT', 'ZAG', 'ZAG', 'LAT'] as Section[] : Array.from({ length: needs[shape][row] }, () => row); const slots = positions.map((pos, index) => ({ pos, card: selected.filter(c => c.pos === pos)[pos === 'LAT' ? (index === 0 ? 0 : 1) : pos === 'ZAG' ? index - 1 : index] })); return <div key={row} style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>{slots.map((slot, index) => slot.card ? <JogadorNoCampo key={index} nome={slot.card.name} clube={slot.card.club} ano={slot.card.year} tag={slot.pos} alt={52} fonteNome={10} rosto={faces} /> : <VagaNoCampo key={index} tag={slot.pos} alt={52} />)}</div> })}</div></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button type="button" style={{ ...button, background: '#fff' }} onClick={() => setEnrolling(false)}>VOLTAR</button><button type="button" style={{ ...button, flex: 1, opacity: registered ? 1 : .5 }} disabled={!registered} onClick={() => { setEnrolling(false); begin(valid.name) }}>CONFIRMAR 11 E COMEÇAR</button></div>
    </div></CMModal>}
    {celebrate && mascoteKeyDoTime(p.userTeam) && <FestaoMascote nome={p.userTeam} mascote={mascoteKeyDoTime(p.userTeam)!} onDone={() => setCelebrate(false)} />}
    <header style={{ textAlign: 'center', borderBottom: '2px solid #0C0C0C', paddingBottom: 10 }}>
      <strong style={{ display: 'block', letterSpacing: 1, fontSize: 12 }}>TEMPORADA {p.season} · FUTEBOL INTERNACIONAL DE CLUBES</strong>
      <h2 style={{ margin: '5px 0', fontFamily: 'Oswald, sans-serif', fontWeight: 900 }}>🌎 LIBERTADORES · 🌍 CHAMPIONS · 🌐 MUNDIAL</h2>
      <small>As duas competições continentais avançam juntas. Os campeões disputam o Mundial.</small>
    </header>
    <div className="ll37-intl-heroes">
      {current && current.reveal >= 13
        ? <CompetitionStage kind="club-world" title="FIFA · FINAL INTERCONTINENTAL" phase="MUNDIAL DE CLUBES" detail={`${current.libertadoresChampion} × ${current.championsChampion}`} status={current.reveal >= current.steps.length ? `Campeão: ${current.mundialChampion}` : 'Campeões continentais definidos · jogo único'}>
            {represented && (current.libertadoresChampion === represented || current.championsChampion === represented) && <CampaignIdentity userTeam={p.userTeam} institution={represented} />}
          </CompetitionStage>
        : <>
            <CompetitionStage kind="liberta" title="CONMEBOL" phase="LIBERTADORES" detail="A campanha sul-americana rumo à final.">
              {representedCompetition === 'libertadores' && represented && <CampaignIdentity userTeam={p.userTeam} institution={represented} />}
            </CompetitionStage>
            <CompetitionStage kind="champions" title="UEFA" phase="CHAMPIONS LEAGUE" detail="A campanha europeia avança ao mesmo tempo.">
              {representedCompetition === 'champions' && represented && <CampaignIdentity userTeam={p.userTeam} institution={represented} />}
            </CompetitionStage>
          </>}
    </div>
    {finished && current ? <div style={{ textAlign: 'center', padding: 12 }}>
      <strong>🏆 {current.libertadoresChampion} · {current.championsChampion} · Mundial: {current.mundialChampion}</strong>
      <p>{p.history.find(e => e.season === p.season)?.bestCampaign}</p>
      {current.representedClub && (current.libertadoresChampion === current.representedClub || current.championsChampion === current.representedClub) && p.history.filter(e => e.representedClub === current.representedClub).length > 1 && !p.history.some(e => e.representedClub === current.representedClub && e.season < p.season && (e.libertadores || e.champions)) && <p><b>A ESPERA ACABOU</b> · Após {p.history.filter(e => e.representedClub === current.representedClub).length} campanhas, {p.userTeam} conquistou o título continental representando {current.representedClub}.</p>}
    </div> : !current ? p.choices.length ? <>
      <p><b>{p.userTeam}</b> mantém seu escudo, mascote e elenco. Escolha a instituição que representará nesta campanha. Sua prioridade é <b>{p.priority}</b>; blocos {p.priority}–9 disponíveis.</p>
      {INTERNATIONAL_BLOCKS.map((block, index) => {
        if (index + 1 < (p.priority ?? 10)) return null
        return <div key={index} style={{ marginBottom: 12 }}><b>BLOCO {index + 1}</b>{(['libertadores', 'champions'] as const).map(competition => <div key={competition} style={{ marginTop: 6 }}><small style={{ fontWeight: 900 }}>{competition === 'libertadores' ? '🌎 CONMEBOL LIBERTADORES' : '🌍 UEFA CHAMPIONS LEAGUE'}</small><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {block[competition].map(name => <button key={name} type="button" style={{ ...button, background: club === name ? '#FFC400' : '#fff', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setClub(name)}><SeloClube clube={name} size={24} />{name}</button>)}
        </div></div>)}</div>
      })}
      {valid && <div style={{ borderTop: '2px solid #0C0C0C', marginTop: 14, paddingTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Escudo nome={p.userTeam} size={54} /><div><b>{p.userTeam}</b><br /><small>Representando {valid.name} · {valid.competition === 'libertadores' ? 'CONMEBOL LIBERTADORES' : 'UEFA CHAMPIONS LEAGUE'}</small></div><SeloClube clube={valid.name} size={30} /></div>
        <p><b>{first ? 'NOVO CAPÍTULO' : changedContinent ? 'NOVO DESAFIO' : returnGap ? 'REENCONTRO' : 'NOVA CAMPANHA'}</b> · {first ? `${p.userTeam} representará ${valid.name} pela primeira vez.` : changedContinent ? `${p.userTeam} parte para uma nova experiência continental.` : returnGap ? `${p.userTeam} volta a representar ${valid.name} após ${p.season - returnGap.season} temporadas.` : `${p.userTeam} representará ${valid.name}.`}</p>
        <p><b>INSCRIÇÃO DO ELENCO · {selected.length}/11</b><br /><small>Escolha 11 jogadores reais do seu elenco: 1 goleiro, ao menos 3 defensores, 2 meias e 1 atacante. A inscrição fica congelada durante a campanha.</small></p>
        {shapeAvailable('4-3-3') || shapeAvailable('4-4-2')
          ? <button type="button" style={{ ...button, marginTop: 12 }} onClick={() => setEnrolling(true)}>ABRIR INSCRIÇÃO DOS 11 ›</button>
          : <div role="status" style={{ background: '#FDE9C8', border: '2px solid #0C0C0C', borderRadius: 10, padding: 10 }}><b>ELENCO SEM 11 CARTAS REAIS PARA INSCRIÇÃO</b><p>É preciso ter 1 goleiro, 2 laterais, 2 zagueiros e meias/atacantes suficientes para 4-3-3 ou 4-4-2. Nesta temporada, você pode acompanhar os bots; reforce o elenco para disputar a próxima.</p><button type="button" style={button} onClick={() => begin(null)}>ACOMPANHAR COMPETIÇÕES SEM INSCRIÇÃO ›</button></div>}
      </div>}
    </> : <div style={{ textAlign: 'center', padding: 15 }}><b>SEM VAGA INTERNACIONAL NESTA TEMPORADA</b><p>G8 da Série A ou campeão da Copa do Brasil. As duas competições serão simuladas para registrar os campeões e o Mundial.</p><button type="button" style={button} onClick={() => begin(null)}>ACOMPANHAR COMPETIÇÕES</button></div> : <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}><Escudo nome={p.userTeam} size={52} /><b>{p.userTeam}</b>{current.representedClub && <><span>representando</span><SeloClube clube={current.representedClub} size={28} /><b>{current.representedClub}</b></>}</div>
      <p>Noite {Math.min(current.reveal + 1, current.steps.length)} de {current.steps.length}. Resultados e estatísticas são salvos a cada etapa.</p>
      {current.steps.slice(0, current.reveal).map((step, i) => <details key={i} open={i === current.reveal - 1}><summary><b>{step.label}</b></summary>{step.libertadores && <Phase phase={step.libertadores} campaign={current} />}{step.champions && <Phase phase={step.champions} campaign={current} />}{step.mundial && <Phase phase={step.mundial} campaign={current} />}</details>)}
      {current.reveal >= 8 && <details style={{ marginTop: 12 }}><summary><b>🌎 CLASSIFICAÇÃO · GRUPOS DA LIBERTADORES</b></summary>{current.libertadoresGroups.map((group, index) => <div key={index} style={{ marginTop: 9 }}><b>GRUPO {String.fromCharCode(65 + index)}</b><ol style={{ margin: '4px 0', paddingLeft: 23 }}>{group.map(row => <li key={row.team}><b>{row.team}</b> · {row.points} pts · {row.w}V {row.d}E {row.l}D · {row.gf}–{row.ga}</li>)}</ol></div>)}</details>}
      {current.reveal >= 8 && <details style={{ marginTop: 12 }}><summary><b>🌍 TABELA DA CHAMPIONS LEAGUE</b></summary><ol style={{ paddingLeft: 23 }}>{current.championsTable.map((row, index) => <li key={row.team} style={{ color: index < 8 ? '#1B7A3D' : index < 24 ? '#0D4FCC' : '#666' }}><b>{row.team}</b> · {row.points} pts · {row.w}V {row.d}E {row.l}D · {row.gf}–{row.ga}</li>)}</ol><small>1º–8º às oitavas · 9º–24º à repescagem</small></details>}
      {current.reveal < current.steps.length ? <button type="button" style={{ ...button, marginTop: 12 }} onClick={advance}>JOGAR PRÓXIMA ETAPA ›</button> : <div style={{ marginTop: 12 }}><p>🏆 Libertadores: <b>{current.libertadoresChampion}</b> · Champions: <b>{current.championsChampion}</b> · Mundial: <b>{current.mundialChampion}</b></p><button type="button" style={button} onClick={() => p.onFinish(summarizeInternationalCampaign(current))}>ENCERRAR CAMPANHA E VER JORNAL ›</button></div>}
    </>}
    {p.history.filter(e => e.representedClub).length > 0 && <details style={{ marginTop: 15 }}><summary><b>ESTANTE · CLUBES REPRESENTADOS</b></summary>{INTERNATIONAL_CLUBS.filter(c => p.history.some(e => e.representedClub === c.name)).map(c => { const rows = p.history.filter(e => e.representedClub === c.name); const total = (key: 'games' | 'wins' | 'draws' | 'losses' | 'goalsFor' | 'goalsAgainst' | 'libertadores' | 'champions' | 'mundial' | 'runnerUp') => rows.reduce((n, e) => n + e[key], 0); const leaders = clubLeaders(rows); return <p key={c.name}><SeloClube clube={c.name} size={20} /> <b>{c.name}</b> · {rows.length} participações ({rows.map(e => e.season).join(', ')}) · {total('games')} J · {total('wins')} V · {total('draws')} E · {total('losses')} D · {total('goalsFor')} GP · {total('goalsAgainst')} GC · {total('libertadores')} Libertadores · {total('champions')} Champions · {total('mundial')} Mundiais · {total('runnerUp')} vices · melhor: {rows.find(e => e.bestCampaign.includes('Campeão'))?.bestCampaign ?? rows.at(-1)?.bestCampaign} · artilheiro: {leaders.scorer?.name ?? '—'} ({leaders.scorer?.goals ?? 0}) · assistente: {leaders.assistant?.name ?? '—'} ({leaders.assistant?.assists ?? 0}) · última T{rows.at(-1)?.season}</p> })}</details>}
    {p.history.length > 0 && <details style={{ marginTop: 15 }}><summary><b>🌐 RANKING INTERNACIONAL DE CLUBES</b></summary><p style={{ fontSize: 11 }}>Títulos: Mundial 50 · Libertadores 40 · Champions 40. Vitórias, saldo e nome desempatarão. Temporadas antigas sem placares guardados seguem com seus títulos.</p><ol style={{ paddingLeft: 24 }}>{internationalCareerRanking(p.history).map(row => <li key={row.club} style={{ marginBottom: 4 }}><SeloClube clube={row.club} size={19} /> <b>{row.club}</b> · {row.points} pts · {row.mundial} Mundial · {row.libertadores} Libertadores · {row.champions} Champions · {row.games} J · {row.wins} V · {row.draws} E · {row.losses} D · {row.goalsFor}–{row.goalsAgainst}</li>)}</ol></details>}
  </section>
}
