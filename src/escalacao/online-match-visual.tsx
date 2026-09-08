import type { ReactNode } from 'react'
import './online-match-visual.css'

type Goal = { name: string; min: number; home: boolean }
export function OnlineScorePresentation(p: {
  homeName: string; awayName: string; homeCrest: ReactNode; awayCrest: ReactNode;
  homeColor: string; awayColor: string; youIsHome: boolean;
  homeOwner?: string; awayOwner?: string; clock: string; homeScore: number; awayScore: number;
  goals: Goal[]; goalSide: 'h' | 'a' | null; mascot: ReactNode; stamp: string;
  narration: string; eventKey: number;
}) {
  const team = (home: boolean) => {
    const scoring = p.goalSide === (home ? 'h' : 'a')
    const name = home ? p.homeName : p.awayName
    return <div className="ll25-team" style={{ borderColor: home ? p.homeColor : p.awayColor }}>
      <div className="ll25-crest-slot">
        {scoring && p.mascot
          ? <div key={p.eventKey} className="ll25-mascot" aria-hidden="true">{p.mascot}</div>
          : home ? p.homeCrest : p.awayCrest}
      </div>
      <strong>{name}</strong>
      <small>{(home ? p.homeOwner : p.awayOwner) ?? ((home === p.youIsHome) ? 'VOCÊ' : 'RIVAL')}</small>
    </div>
  }
  return <section className="ll25-score" aria-label="Placar da partida">
    <div className={`ll25-narration ${p.goalSide ? 'll25-goal' : ''}`} title={p.goalSide ? p.stamp : p.narration}>
      {p.goalSide ? p.stamp : p.narration}
    </div>
    <div className="ll25-duel">
      {team(true)}
      <div className="ll25-numbers"><small>{p.clock}</small><strong>{p.homeScore} <span>×</span> {p.awayScore}</strong></div>
      {team(false)}
    </div>
    <div className="ll25-scorers">{[true, false].map(home => <div key={String(home)}>
      {p.goals.filter(g => g.home === home).map((g, i) => <p key={`${g.name}-${g.min}-${i}`}>{g.name} <b>{g.min > 90 ? `90+${g.min - 90}` : g.min}′</b></p>)}
      {!p.goals.some(g => g.home === home) && <p>Sem gols</p>}
    </div>)}</div>
  </section>
}

export function OnlineRhythm(p: { manual: boolean; onToggle: () => void; speed: number; onSpeed: (v: number) => void }) {
  return <div className="ll25-rhythm" aria-label="Ritmo da sala">
    <button className="ll25-button" aria-pressed={p.manual} onClick={() => { if (!p.manual) p.onToggle() }}>MANUAL</button>
    <button className="ll25-button" aria-pressed={!p.manual} onClick={() => { if (p.manual) p.onToggle() }}>AUTO</button>
    <label><span className="ll25-sr">Velocidade da partida</span><select className="ll25-button" disabled={!p.manual} value={p.speed > 0 ? p.speed : 1} onChange={e => p.onSpeed(Number(e.target.value))}>
      <option value={0.25}>4× mais lento</option><option value={0.5}>2× mais lento</option><option value={1}>Normal</option><option value={2}>2× mais rápido</option><option value={4}>4× mais rápido</option>
    </select></label>
  </div>
}
export type OnlineMatchTab = 'jogos' | 'tabela' | 'estatisticas' | 'elenco'
export function OnlineMatchTabs({ value, onChange }: { value: OnlineMatchTab; onChange: (tab: OnlineMatchTab) => void }) {
  return <nav className="ll25-tabs" aria-label="Conteúdo da partida">{([['jogos', 'JOGOS'], ['tabela', 'TABELA'], ['estatisticas', 'ESTATÍSTICAS'], ['elenco', 'ELENCO']] as const).map(([tab, label]) =>
    <button key={tab} className="ll25-button" aria-pressed={value === tab} onClick={() => onChange(tab)}>{label}</button>)}</nav>
}
