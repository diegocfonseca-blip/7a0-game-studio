import {useState,type ReactNode} from 'react'
import {useEsc} from './store'
import {OwnerMatchNavigation,FootballChatTarget,FootballMatchPlaceholder} from './owner-online-visual'
import {useFootballMatchNavigation} from './football-match-navigation'
import {CompetitionMatch} from './online-match-visual'
import {useRetrospecto} from './retrospecto'
import {PrateleiraRivalidades} from './rivalidades-sala'
import {tr} from './lang'
import type {Entrant} from './copa-mundo'
import {FORMATIONS,SECTORS} from './types'
import './football-cup-view.css'

export type CupGame={h:number;a:number;ev:{name:string;min:number;home:boolean;assist?:string}[];step:number;pen?:[number,number]|null;leg?:string}
export type CupStage={id:string;label:string;known:boolean;games:CupGame[]}
export type CupTable={title:string;rows:{t:number;pts:number;w:number;sg:number;gp?:number;group?:string}[];qualify:number;thirds?:boolean}
export type CupStat={name:string;team:number;total:number}
const noop=()=>{}

/** Presentation consumes revealed tournament data; it never simulates or advances a step. */
export function FootballCupView({title,phase,detail,entrants,uids,crest,stages,currentStage,tables,stats,step,minute,finished,broadcast,transition,controls,tactics,ceremony,onClose,tournamentKey}:{
 title:string;phase:string;detail?:string;entrants:Entrant[];uids:(string|undefined)[];crest:(index:number,size:number)=>ReactNode;
 stages:CupStage[];currentStage:string;tables:CupTable[];stats:{goals:CupStat[];assists:CupStat[]};step:number;minute:number;finished:boolean;
 broadcast:ReactNode;transition:ReactNode;controls:ReactNode;tactics:ReactNode;ceremony?:ReactNode;onClose:()=>void;tournamentKey:string
}){
 const {state}=useEsc(),navigation=useFootballMatchNavigation(state.roomId??'',true)
 const my=entrants.findIndex(t=>t.you),current=stages.find(s=>s.id===currentStage)??stages[0]
 const [selection,setSelection]=useState<string|null>(null),[team,setTeam]=useState(my>=0?my:0)
 const selected=stages.find(s=>s.id===selection)??current
 const formation=entrants[team].form??Object.entries(FORMATIONS).find(([,need])=>SECTORS.every(sec=>entrants[team].xi.filter(c=>c.sec===sec).length===need[sec]))?.[0]
 const currentGames=current?.games.filter(g=>g.step===step)??[]
 const own=currentGames.find(g=>g.h===my||g.a===my)
 const friends=entrants.flatMap((t,i)=>{
  if(!uids[i]||uids[i]===uids[my])return[]
  const temporada={w:0,d:0,l:0}
  for(const g of stages.flatMap(s=>s.games))if((g.h===my&&g.a===i||g.a===my&&g.h===i)&&(g.step<step||g.step===step&&finished)){
   const mine=g.ev.filter(e=>e.home===(g.h===my)).length,theirs=g.ev.length-mine
   if(mine>theirs)temporada.w++;else if(mine<theirs)temporada.l++;else temporada.d++
  }
  return[{uid:uids[i]!,nome:t.club,time:`${t.pais} · ${t.club}`,temporada}]
 })
 const records=useRetrospecto(uids[my],friends.map(f=>f.uid),`${tournamentKey}:${step}`,state.espectador?state.roomId:null)
 const rival=own?(own.h===my?own.a:own.h):undefined
 const rivalFriend=rival==null?undefined:friends.find(f=>f.uid===uids[rival])
 const rivalCard=<PrateleiraRivalidades amigos={friends} mapa={records} proximo={rivalFriend?{amigo:rivalFriend,rodada:step,daqui:0}:null} meuTime={entrants[my]?.pais??''} onlyNext nextTitle={tr('RETROSPECTO DO CONFRONTO','MATCH HISTORY')}/>
 const game=(g:CupGame)=>{
  const played=g.step<step||(g.step===step&&finished),visible=g.step<step?g.ev:g.step===step?g.ev.filter(e=>e.min<=minute):[]
  return <CompetitionMatch key={`${g.step}:${g.h}:${g.a}`} home={entrants[g.h].pais} away={entrants[g.a].pais} homeOwner={entrants[g.h].club} awayOwner={entrants[g.a].club} showOwners homeCrest={crest(g.h,25)} awayCrest={crest(g.a,25)} mine={g.h===my||g.a===my} homeScore={visible.filter(e=>e.home).length} awayScore={visible.filter(e=>!e.home).length} goals={visible} status={`${g.leg?g.leg+' · ':''}${played?tr('ENCERRADO','FULL TIME'):g.step===step?`${Math.min(93,minute)}′ · ${tr('AO VIVO','LIVE')}`:tr('A JOGAR','UPCOMING')}`} detail={played&&g.pen?<small>{tr('Pênaltis','Penalties')} {g.pen[0]} × {g.pen[1]}</small>:undefined}/>
 }
 const tableNodes=tables.map(table=><section className={`fp-cup-card fp-cup-table ${table.thirds?'fp-cup-thirds':''}`} key={table.title}><h3>{table.title}</h3><table><thead><tr><th>#</th><th>{tr('Time','Team')}</th><th>P</th><th>V</th><th>SG</th></tr></thead><tbody>{table.rows.map((row,i)=><tr key={row.t} className={`${row.t===my?'mine':''} ${i<table.qualify?'qualified':''}`}><td>{i+1}</td><td>{crest(row.t,23)}<span>{entrants[row.t].pais}<small>{row.group??entrants[row.t].club}</small></span></td><td>{row.pts}</td><td>{row.w}</td><td>{row.sg>0?'+':''}{row.sg}</td></tr>)}</tbody></table></section>)
 const statNodes=(limit?:number)=>(['goals','assists'] as const).map(kind=><section className="fp-cup-card" key={kind}><h3>{kind==='goals'?tr('⚽ ARTILHARIA','⚽ TOP SCORERS'):tr('🅰️ ASSISTÊNCIAS','🅰️ ASSISTS')}</h3>{stats[kind].length?stats[kind].slice(0,limit).map((row,i)=><div className="fp-cup-stat" key={`${row.team}:${row.name}`}><span>{i+1}.</span>{crest(row.team,23)}<span>{row.name}<small>{entrants[row.team].pais}</small></span><b>{row.total}</b></div>):<p>{tr('Nenhum registro nos jogos encerrados.','No records in finished matches.')}</p>}</section>)
 const hasPlayed=stages.some(s=>s.games.some(g=>(g.h===my||g.a===my)&&g.step<step))
 return <div className="fp-cup-layout" data-cup={tournamentKey}>
  <header className="fp-cup-heading"><small>{title}</small><h1>{phase}</h1>{detail&&<p>{detail}</p>}</header>
  <OwnerMatchNavigation value="jogos" onChange={noop} cup/>
  <main className="fp-cup-main">
   <div className="fp-cup-broadcast">{broadcast||<FootballMatchPlaceholder>{transition?<div className="fp-broadcast-transition" role="region" aria-label={tr('Transição da competição','Competition transition')}>{transition}</div>:<section className="fp-cup-card"><h3>{tr('PREPARANDO A PRÓXIMA PARTIDA','PREPARING THE NEXT MATCH')}</h3></section>}</FootballMatchPlaceholder>}</div>
   {controls}
   {tactics}
   <section className="fp-cup-panel" hidden={navigation.page!=='match'} aria-label={tr('Partida da Copa','Cup match')}>
    {my>=0&&!own&&step>0&&<p className="fp-cup-notice">{hasPlayed&&currentStage!==stages[0]?.id?tr('Você foi eliminado. Pode continuar acompanhando a competição.','You were eliminated. You can keep watching the competition.'):hasPlayed?tr('Seu time não joga nesta etapa. Você está acompanhando a competição.','Your team is not playing in this stage. You are watching the competition.'):tr('Seu time aguarda a próxima partida.','Your team is waiting for the next match.')}</p>}
    {rivalCard}
    {currentGames.length>1&&<section><h3>{tr('OUTROS JOGOS','OTHER MATCHES')}</h3><div className="fp-round-carousel" tabIndex={0} aria-label={tr('Jogos da Copa, role para os lados','Cup matches, scroll sideways')}>{currentGames.filter(g=>g!==own).map(game)}</div></section>}
   </section>
   <section className="fp-cup-panel" hidden={navigation.page!=='table'} aria-label={tr('Copa e jogos','Cup and matches')}>
    <nav className="fp-cup-stages" aria-label={tr('Fases da Copa','Cup stages')}>{stages.map(s=><button type="button" key={s.id} aria-pressed={selected?.id===s.id} aria-current={current?.id===s.id?'step':undefined} onClick={()=>setSelection(s.id)}>{s.label}{s.id===current?.id&&<small>{tr('FASE ATUAL','CURRENT STAGE')}</small>}</button>)}</nav>
    {selected?.id===stages[0]?.id&&<div className="fp-cup-tables">{tableNodes}</div>}
    {!selected?.known?<p className="fp-cup-notice">{tr('Os confrontos serão definidos após a classificação.','The matches will be defined after qualification.')}</p>:<div className="fp-cup-games">{selected.games.map(game)}</div>}
   </section>
   <section className="fp-cup-panel" hidden={navigation.page!=='stats'} aria-label={tr('Estatísticas da Copa','Cup stats')}><p>{tr('Somente jogos encerrados desta competição.','Only finished matches from this competition.')}</p>{statNodes()}</section>
   <section className="fp-cup-panel" hidden={navigation.page!=='squad'} aria-label={tr('Elencos da Copa','Cup squads')}><label>{tr('TIME DESTA COMPETIÇÃO','TEAM IN THIS COMPETITION')}<select value={team} onChange={e=>setTeam(Number(e.target.value))}>{entrants.map((t,i)=><option key={i} value={i}>{t.pais} · {t.club}</option>)}</select></label><section className="fp-cup-card"><h3>{crest(team,32)} {entrants[team].pais} · {formation??tr('11 inscritos','Registered XI')}</h3><p>{entrants[team].club}</p><div className="fp-cup-xi">{(['ATA','MEI','LAT','ZAG','GOL'] as const).map(sec=><div key={sec}>{entrants[team].xi.filter(c=>c.sec===sec).map(c=><span key={`${c.name}:${c.club}:${c.year}`}><b>{c.name}</b><small>{sec} · {c.club} {c.year}</small></span>)}</div>)}</div><small>{tr('Escalação inscrita nesta Copa. As regras de convocação permanecem as da competição.','The squad registered for this Cup. The competition’s selection rules still apply.')}</small></section></section>
   <section className="fp-cup-panel" hidden={navigation.page!=='rivals'} aria-label={tr('Rivalidades da Copa','Cup rivalries')}>{rivalCard}<PrateleiraRivalidades amigos={friends} mapa={records} proximo={null} meuTime={entrants[my]?.pais??''} hideNext/></section>
   {ceremony}
   <button type="button" className="ll31-back-room" onClick={onClose}>{tr('VOLTAR À SALA','BACK TO THE ROOM')}</button>
  </main>
  <aside className="fp-cup-aside">{currentStage===stages[0]?.id?<div className="fp-cup-tables">{tableNodes[tables.findIndex(t=>t.rows.some(r=>r.t===my))]??tableNodes[0]}</div>:<section className="fp-cup-card"><h3>{tr('CHAVE DA FASE','CURRENT ROUND')}</h3><div className="fp-cup-aside-round">{current?.known?currentGames.map(game):tr('Confrontos a definir.','Matches to be defined.')}</div></section>}<FootballChatTarget/>{statNodes(3)}{rivalCard}</aside>
 </div>
}
