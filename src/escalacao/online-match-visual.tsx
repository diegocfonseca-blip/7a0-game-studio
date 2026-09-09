import type { ReactNode, CSSProperties } from 'react'
import { useEffect, useState, useRef } from 'react'
import './online-match-visual.css'

type Goal = { name: string; min: number; home: boolean }
export function OnlineScorePresentation(p: {
  homeName: string; awayName: string; homeCrest: ReactNode; awayCrest: ReactNode;
  homeColor: string; awayColor: string; youIsHome: boolean;
  homeOwner?: string; awayOwner?: string; clock: string; homeScore: number; awayScore: number;
  goals: Goal[]; goalSide: 'h' | 'a' | null; mascot: ReactNode; stamp: string;
  narration: string; eventKey: number; enhanced?: boolean;
}) {
  const team = (home: boolean) => {
    const name = home ? p.homeName : p.awayName
    return <div className="ll25-team" style={{ borderColor: home ? p.homeColor : p.awayColor }}>
      <div className="ll25-crest-slot">
        {!p.enhanced && p.goalSide === (home ? 'h' : 'a') ? <div className="ll25-mascot">{p.mascot}</div> : home ? p.homeCrest : p.awayCrest}
      </div>
      <strong>{name}</strong>
      <small>{(home ? p.homeOwner : p.awayOwner) ?? ((home === p.youIsHome) ? 'VOCÊ' : 'RIVAL')}</small>
    </div>
  }
  return <section className={`ll25-score ${p.enhanced ? 'll26-score' : ''} ${p.enhanced && p.goalSide ? 'll26-scoring' : ''}`} aria-label="Placar da partida">
    <div className={`ll25-narration ${p.goalSide ? 'll25-goal' : ''}`} title={p.goalSide ? p.stamp : p.narration}>
      {p.goalSide ? p.stamp : p.narration}
    </div>
    <div className="ll25-duel">
      {team(true)}
      <div className="ll25-numbers"><small>{p.clock}</small><strong>{p.homeScore} <span>×</span> {p.awayScore}</strong></div>
      {team(false)}
    </div>
    {p.enhanced && p.goalSide && <div key={p.eventKey} className={`ll26-goal-scene ll26-goal-${p.goalSide}`} aria-hidden="true">
      <div className="ll26-goal-rays" />
      <div className="ll26-goal-mascot">{p.mascot}</div>
      <strong>GOOOL!</strong>
      {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}
    </div>}
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
  return <nav className="ll25-tabs" aria-label="Conteúdo da partida">{([['jogos', 'JOGOS + TABELA'], ['estatisticas', 'ESTATÍSTICAS'], ['elenco', 'ELENCO']] as const).map(([tab, label]) =>
    <button key={tab} className="ll25-button" aria-pressed={value === tab} onClick={() => onChange(tab)}>{label}</button>)}</nav>
}

export function CompetitionStage({ kind, title, phase, detail, status, children }: {
  kind: 'copa8' | 'liberta' | 'world' | 'league'; title: string; phase: string;
  detail: string; status?: string; children?: ReactNode
}) {
  return <section className={`ll26-competition ll25-${kind === 'league' ? 'league' : kind}-art`}>
    <div className="ll26-competition-copy"><small>{title}</small><h2>{phase}</h2><p>{detail}</p></div>
    {status && <div className="ll26-competition-status"><span />{status}</div>}
    {children}
  </section>
}

export function CompetitionMatch({ home, away, homeCrest, awayCrest, homeOwner, awayOwner, homeScore, awayScore, status, detail, mine = false, showOwners=false, goals=[] }: {
  home: string; away: string; homeCrest?: ReactNode; awayCrest?: ReactNode; homeOwner?: string; awayOwner?: string;
  homeScore: number | string; awayScore: number | string; status: string; detail?: ReactNode; mine?: boolean
  showOwners?: boolean; goals?: Goal[]
}) {
  const previous = useRef({home,away,homeScore,awayScore})
  const [goalFlash,setGoalFlash] = useState(false)
  useEffect(() => {
    const old=previous.current
    previous.current={home,away,homeScore,awayScore}
    const scored=old.home===home&&old.away===away&&typeof homeScore==='number'&&typeof awayScore==='number'&&typeof old.homeScore==='number'&&typeof old.awayScore==='number'&&(homeScore>old.homeScore||awayScore>old.awayScore)
    if(!scored){setGoalFlash(false);return}
    setGoalFlash(true)
    const timer=setTimeout(()=>setGoalFlash(false),1000)
    return ()=>clearTimeout(timer)
  },[home,away,homeScore,awayScore])
  return <article className={`ll26-fixture ${mine ? 'll26-fixture-mine' : ''} ${goalFlash?'ll27-fixture-goal':''}`}>
    <header><span>{goalFlash?'⚽ GOL!':mine ? 'SEU JOGO' : 'JOGO DA RODADA'}</span><b>{status}</b></header>
    <div className="ll26-fixture-duel"><div>{homeCrest}<span>{home}{showOwners&&homeOwner&&homeOwner!=='BOT'&&<small>{homeOwner}</small>}</span></div><strong>{homeScore}<i>×</i>{awayScore}</strong><div>{awayCrest}<span>{away}{showOwners&&awayOwner&&awayOwner!=='BOT'&&<small>{awayOwner}</small>}</span></div></div>
    {goals.length>0&&<div className="ll28-scorers">{[true,false].map(side=><div key={String(side)}>{goals.filter(g=>g.home===side).map((g,i)=><p key={i}>{goalPlayer(g.name)} <b>{g.min>90?`90+${g.min-90}`:g.min}′</b></p>)}</div>)}</div>}
    {detail && <footer>{detail}</footer>}
  </article>
}

/** Relógio apenas de apresentação. Não avança a sala nem produz resultados. */
export function useRoundPresentationStart(key: number) {
  const ref = useRef({key,at:Date.now()})
  if(ref.current.key !== key) ref.current = {key,at:Date.now()}
  return ref.current.at
}
export function RoundMatchPresentation({ goals, finished, roundKey, roundMs, score, startedAt, ...p }: Omit<Parameters<typeof CompetitionMatch>[0], 'status' | 'homeScore' | 'awayScore'> & {
  goals: Goal[]; finished: boolean; roundKey: number; roundMs: number; score: [number, number]; startedAt: number
}) {
  const [minute, setMinute] = useState(0)
  useEffect(() => {
    const tick = () => setMinute(Math.min(93, Math.round((Date.now() - startedAt) / Math.max(400, roundMs * .82) * 93)))
    tick()
    const timer = setInterval(tick, 250)
    return () => clearInterval(timer)
  }, [roundKey, roundMs, startedAt])
  const known = goals.length > 0 || score.every(n => n === 0)
  const homeScore = finished ? score[0] : known ? goals.filter(g => g.home && g.min <= minute).length : '–'
  const awayScore = finished ? score[1] : known ? goals.filter(g => !g.home && g.min <= minute).length : '–'
  return <CompetitionMatch {...p} goals={goals.filter(g=>finished||g.min<=minute)} homeScore={homeScore} awayScore={awayScore} status={finished ? 'ENCERRADO' : `${Math.min(90,minute)}′ · AO VIVO`} detail={!finished && !known ? 'Placar revelado no apito final' : p.detail} />
}

export function goalPlayer(text:string){return text.match(/⚽\s+(.+?)\s+marca para/)?.[1] ?? text.replace(/^⚽\s*/, '').replace(/\.$/,'')}

export function CompactPenalties({rows,totalDelay,nSlots,aName,bName,aCrest,bCrest,official,final=false}:{rows:{ok:boolean;at:number}[][];totalDelay:number;nSlots:number;aName:string;bName:string;aCrest?:ReactNode;bCrest?:ReactNode;official:[number,number];final?:boolean}){
 const [elapsed,setElapsed]=useState(0)
 const signature=JSON.stringify(rows)
 useEffect(()=>{const start=Date.now();setElapsed(0);const id=setInterval(()=>{const t=(Date.now()-start)/1000;setElapsed(t);if(t>=totalDelay)clearInterval(id)},80);return()=>clearInterval(id)},[signature,aName,bName,totalDelay])
 const done=elapsed>=totalDelay
 const valid=rows.every((r,i)=>r.filter(k=>k.ok).length===official[i])
 if(!valid)return <section className="ll28-pens" aria-label="Resultado dos pênaltis"><header><b>PÊNALTIS</b><strong>{done?`${official[0]} × ${official[1]}`:'– × –'}</strong></header><p>{aName} × {bName}</p><p className="ll28-pen-winner">{done?`${official[0]>official[1]?aName:bName} · ${final?'CAMPEÃO':'CLASSIFICADO'}`:'Decisão em andamento…'}</p></section>
 const visible=rows.map(r=>r.filter(k=>elapsed>=.7+k.at*.85))
 const scores=visible.map(r=>r.filter(k=>k.ok).length)
 const next=rows.flatMap((r,side)=>r.map((k,i)=>({...k,side,i}))).filter(k=>elapsed<.7+k.at*.85).sort((a,b)=>a.at-b.at)[0]
 // 🎯 COBRANÇA QUE NÃO PRECISOU ACONTECER NÃO GANHA BOLINHA (Diego 09/09, final
 // da Copa do Mundo da sala do Futpoint: *"os pênaltis não terminou todos e já deu
 // campeão"*). A disputa PARA quando está decidida — regra real, e é o que o motor
 // faz. Mas esta tela desenhava um círculo vazio pra cada cobrança que sobrou nas
 // 5 rodadas, e vazio parece "falta cobrar". A disputa antiga (`PensShootout`) já
 // tinha essa lição gravada: só desenha as cobranças que aconteceram. Aqui é a
 // mesma coisa agora — `rows` só tem as cobranças reais, então slot sem cobrança
 // some, e o "CAMPEÃO" só sai quando a ÚLTIMA delas pipocou.
 return <section className="ll28-pens" aria-label="Disputa de pênaltis">
  <header><b>{nSlots>5?'MORTE SÚBITA':'PÊNALTIS'}</b><strong>{scores[0]} × {scores[1]}</strong><span>{done?'ENCERRADO':'COBRANÇAS'}</span></header>
  {rows.map((r,side)=><div className="ll28-pens-row" key={side}><div>{side===0?aCrest:bCrest}<span>{side===0?aName:bName}</span></div><div className="ll28-kicks">{Array.from({length:nSlots},(_,i)=>{const k=r[i];if(!k)return null;const shown=elapsed>=.7+k.at*.85;return <span key={i} className={shown?(k.ok?'made':'missed'):!done&&next?.side===side&&next.i===i?'current':'pending'} aria-label={shown?(k.ok?'Gol':'Errou'):'Pendente'}>{shown?(k.ok?'✓':'×'):''}</span>})}</div></div>)}
  <p className="ll28-pen-winner">{done?`${scores[0]>scores[1]?aName:bName} · ${final?'CAMPEÃO':'CLASSIFICADO'}`:'Uma cobrança de cada vez…'}</p>
 </section>
}
