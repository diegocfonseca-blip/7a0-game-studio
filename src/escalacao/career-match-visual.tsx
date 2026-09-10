import type { ReactNode } from 'react'
import type { CopaTie, SimMatch } from './pyramidseason'
import { CompetitionStage, CompetitionMatch } from './online-match-visual'
import { careerTieView } from './career-match-model'
import { Escudo } from './escudos'
import './career-match-visual.css'

export function CareerCompetitionStage(p: { kind: 'league'|'copa'|'brasil'|'super'; title: string; phase: string; detail: string; status: string; children?: ReactNode }) {
  return <div className={`ll29-stage ll29-stage-${p.kind}`}><CompetitionStage kind="league" title={p.title} phase={p.phase} detail={p.detail} status={p.status}>{p.children}</CompetitionStage></div>
}

export function CareerLeagueGames({ matches, minute, title, hideId }: { matches: SimMatch[]; minute: number; title: string; hideId?: number }) {
  return <section className="ll29-games"><h3>{title}</h3><div className="ll29-match-grid">{matches.filter(m => hideId == null || (m.hId !== hideId && m.aId !== hideId)).map((m,i) => {
    const done = minute >= 93, goals = m.goals.filter(g => done || g.min <= minute)
    const completeEvents = m.goals.length === m.hg + m.ag
    return <CompetitionMatch key={`${m.hId}-${m.aId}-${i}`} home={m.h} away={m.a}
      homeCrest={<Escudo nome={m.h} size={28}/>} awayCrest={<Escudo nome={m.a} size={28}/>} mine={m.you}
      homeScore={done ? m.hg : completeEvents ? goals.filter(g=>g.home).length : '—'}
      awayScore={done ? m.ag : completeEvents ? goals.filter(g=>!g.home).length : '—'} goals={goals}
      status={done ? 'ENCERRADO' : `${minute}′ · AO VIVO`} />
  })}</div>{!matches.length && <p>A rodada ainda não começou.</p>}</section>
}

export function CareerCupGames({ ties, pos, title, renderPens }: { ties: CopaTie[]; pos: number; title: string; renderPens: (tie: CopaTie) => ReactNode }) {
  return <section className="ll29-games"><h3>{title}</h3><div className="ll29-match-grid">{ties.map((tie,i) => {
    const v = careerTieView(tie,pos)
    return <CompetitionMatch key={`${tie.a.teamId}-${tie.b.teamId}-${i}`} home={v.home.name} away={v.away.name}
      homeCrest={<Escudo nome={v.home.name} size={28}/>} awayCrest={<Escudo nome={v.away.name} size={28}/>}
      homeScore={v.hg} awayScore={v.ag} mine={tie.a.you || tie.b.you} goals={v.goals}
      status={`${v.leg} · ${v.done ? 'ENCERRADO' : `${v.minute}′ · AO VIVO`}`}
      detail={<>{v.n===2 && <p>{tie.a.name} × {tie.b.name}<br/>{v.index>0 && <>Ida: {tie.legs[0][0]} × {tie.legs[0][1]} · </>}<b>Agregado: {v.aggregate[0]} × {v.aggregate[1]}</b></p>}
        {v.done && (tie.pens ? renderPens(tie) : <p><b>{tie.win==='a' ? tie.a.name : tie.b.name} venceu o confronto</b></p>)}</>} />
  })}</div>{!ties.length && <p>Não há outros jogos nesta fase.</p>}</section>
}
