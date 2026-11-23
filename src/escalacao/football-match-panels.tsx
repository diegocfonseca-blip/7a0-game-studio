import type {ReactNode} from 'react'
import {useEffect,useRef,useState} from 'react'
import {OwnerSlot,useOwnerState,useOwnerFootballPilot} from './owner-online-visual'
import {useFootballMatchNavigation} from './football-match-navigation'
import {tr} from './lang'
import {PrateleiraRivalidades,type AmigoRival} from './rivalidades-sala'
import {useRetrospecto} from './retrospecto'
import {rivalryOf} from './store'
import type {Retro} from './retrospecto'
import {footballNextFixture} from './football-round-status'

export type FootballNextGame={round:number;opponentId:number;opponent:string;home:boolean;friend?:AmigoRival}
export function FootballNextOpponent({game,mapa,meuTime}:{game:FootballNextGame|null;mapa:Record<string,Retro>;meuTime:string}){
 const state=useOwnerState(),navigation=useFootballMatchNavigation(state?.roomId??'',true)
 if(!game)return null
 const record=game.friend?mapa[game.friend.uid]:undefined
 const total=record?record.v+record.e+record.d:0
 const relation=!record?tr('Sem histórico disponível','History unavailable'):!total?tr('Primeiro duelo','First meeting'):record.v>=record.d+2?tr('Rival freguês','You have the upper hand'):record.d>=record.v+2?tr('Rival leva vantagem','Opponent has the edge'):tr('Equilibrado','Evenly matched')
 const recordText=(wins:number,losses:number)=>tr(`${wins} ${wins===1?'vitória':'vitórias'} · ${losses} ${losses===1?'derrota':'derrotas'}`,`${wins} ${wins===1?'win':'wins'} · ${losses} ${losses===1?'loss':'losses'}`)
 return <section className="fp-next-opponent" data-opponent-id={game.opponentId} aria-label={tr('Próximo jogo e rivalidade','Next match and rivalry')}>
  {game.friend?<article className="ll-next-rivalry fp-next-rivalry-card">
   <header><h3>⚔️ {tr('RETROSPECTO DO PRÓXIMO JOGO','NEXT MATCH HEAD-TO-HEAD')}</h3><small>{tr('RODADA','ROUND')} {game.round} · {game.home?tr('EM CASA','HOME'):tr('FORA','AWAY')}</small></header>
   <div className="fp-next-h2h"><div><strong>{meuTime}</strong><small>{tr('VOCÊ','YOU')}</small>{record&&<span className="fp-next-own-record">{recordText(record.v,record.d)}</span>}</div>
    <div className="fp-next-history-score"><b>{record?`${record.v} × ${record.d}`:'—'}</b><small>{tr('vitórias no confronto','head-to-head wins')}</small>{record&&<span>{tr(`${record.e} ${record.e===1?'empate':'empates'}`,`${record.e} ${record.e===1?'draw':'draws'}`)}</span>}</div>
    <div><strong>{game.opponent}</strong><small>{tr('ADVERSÁRIO','OPPONENT')}</small>{record&&<span className="fp-next-away-record">{recordText(record.d,record.v)}</span>}</div>
   </div><footer><span className="fp-next-rivalry-tag">{relation}</span></footer>
  </article>:<header><small>{tr('PRÓXIMO JOGO','NEXT MATCH')} · {tr('RODADA','ROUND')} {game.round} · {game.home?tr('EM CASA','HOME'):tr('FORA','AWAY')}</small><h3>{game.home?`${meuTime} × ${game.opponent}`:`${game.opponent} × ${meuTime}`}</h3></header>}
  {game.friend&&navigation.page!=='rivals'&&<button type="button" onClick={()=>navigation.choose('rivals')}>{tr('Ver rivalidades em detalhes','View rivalry details')} →</button>}
 </section>
}

export function FootballOpponentBrowser({teams}:{teams:{id:number;name:string;pitch:ReactNode}[]}){
 const rail=useRef<HTMLDivElement>(null),chosen=useRef(teams[0]?.id)
 const [active,setActive]=useState(teams[0]?.id)
 const ids=teams.map(team=>team.id).join(',')
 const index=Math.max(0,teams.findIndex(team=>team.id===active))
 const desktop=()=>window.matchMedia('(min-width:1100px)').matches
 const move=(next:number)=>{
  const team=teams[next],node=rail.current
  if(!team||!node)return
  chosen.current=team.id;setActive(team.id)
  node.scrollTo({left:next*node.clientWidth,behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})
 }
 useEffect(()=>{
  const node=rail.current;if(!node)return
  const fit=()=>{
   if(!desktop()||!node.clientWidth)return
   const next=Math.max(0,teams.findIndex(team=>team.id===chosen.current))
   chosen.current=teams[next]?.id;setActive(chosen.current)
   node.scrollTo({left:next*node.clientWidth,behavior:'instant'})
  }
  const observer=new ResizeObserver(fit);observer.observe(node)
  return()=>observer.disconnect()
 },[ids])
 if(!teams.length)return null
 return <section className="fp-opponent-browser" aria-label={tr('Escalações dos adversários','Opponents’ lineups')}>
  <header className="fp-opponent-tools"><h3>{tr('ESCALAÇÕES DOS ADVERSÁRIOS','OPPONENTS’ LINEUPS')}</h3>
   <div><button type="button" aria-label={tr('Adversário anterior','Previous opponent')} disabled={index===0} onClick={()=>move(index-1)}>←</button>
    <label><span>{tr('Escolha o clube','Choose a club')}</span><select aria-label={tr('Escolha o clube','Choose a club')} value={teams[index].id} onChange={event=>move(teams.findIndex(team=>team.id===Number(event.target.value)))}>{teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
    <button type="button" aria-label={tr('Próximo adversário','Next opponent')} disabled={index===teams.length-1} onClick={()=>move(index+1)}>→</button>
   </div><p>{index+1} / {teams.length} · {tr('Use as setas, escolha um clube ou role para os lados.','Use the arrows, choose a club or scroll sideways.')}</p>
  </header>
  <div ref={rail} className="fp-opponent-rail" role="region" aria-label={tr('Campos dos adversários, role para os lados','Opponents’ pitches, scroll sideways')} tabIndex={0}
   onKeyDown={event=>{if(event.target!==event.currentTarget||!desktop())return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(index+(event.key==='ArrowRight'?1:-1))}}}
   onScroll={event=>{const node=event.currentTarget;if(!desktop()||!node.clientWidth)return;const next=teams[Math.round(node.scrollLeft/node.clientWidth)];if(next){chosen.current=next.id;setActive(next.id)}}}>
   {teams.map(team=><div key={team.id} className="fp-opponent-slide" role="group" aria-label={team.name}>{team.pitch}</div>)}
  </div>
 </section>
}

export function FootballTeamPanel({editable,children}:{editable:boolean;children:ReactNode}){
 return <OwnerSlot name="lineup"><section className="fp-team-panel" aria-label={tr('Sua escalação','Your lineup')}><header><small>{tr('SEU TIME','YOUR TEAM')}</small><h2>{tr('OS SEUS ONZE','YOUR STARTING ELEVEN')}</h2><p>{editable?tr('Troque titulares e formação pelas regras deste modo. Vale para o próximo jogo.','Change starters and formation under this mode’s rules. Applies to the next match.'):tr('Nesta sala os onze são fixos. Consulte os jogadores na aba Elenco.','The starting eleven is fixed in this room. View players in Squad.')}</p></header>{children}</section></OwnerSlot>
}
export function FootballSummaryPlacement({children}:{children:ReactNode}){
 return useOwnerFootballPilot()?<OwnerSlot name="summary">{children}</OwnerSlot>:<>{children}</>
}
export function FootballRoomMenu({onAdjust}:{onAdjust?:()=>void}){
 const state=useOwnerState(),dialog=useRef<HTMLDialogElement>(null)
 return <><button type="button" className="fp-room-menu" onClick={()=>dialog.current?.showModal()}>{tr('Sala','Room')}</button><dialog className="fp-room-dialog" ref={dialog} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}><header><h2>{tr('SUA SALA','YOUR ROOM')}</h2><button type="button" aria-label={tr('Fechar','Close')} onClick={()=>dialog.current?.close()}>×</button></header><p>{tr('Participantes','Participants')}</p><ul>{state?.managers.filter(m=>m.isHuman).map(m=><li key={m.id}>{m.teamName||m.name}</li>)}</ul>{onAdjust&&<button type="button" onClick={()=>{dialog.current?.close();onAdjust()}}>{tr('Ajustes da sala','Room settings')}</button>}</dialog></>
}
export function FootballRoundSummary({position,points,children}:{position:number;points:number;children?:ReactNode}){
 const state=useOwnerState(),navigation=useFootballMatchNavigation(state?.roomId??'',true)
 return <OwnerSlot name="summary"><section className="fp-room-overview"><button type="button" className="fp-position-link" onClick={()=>navigation.choose('table')}><b>{position>0?`${position}º`:'—'}</b><span>{points} {tr('pontos na liga','league points')}</span><strong>{tr('Classificação','Standings')} →</strong></button>{children}<button type="button" className="fp-all-matches" onClick={()=>navigation.choose('table')}>{tr('Todos os jogos','All matches')} →</button></section></OwnerSlot>
}

type RecordedDuel={key:string;uid:string;name:string;for:number;against:number;season:number;round:number}
const historyKey=(uid:string)=>`esc-futebol-duelos-v2:${uid}`
function readDuels(uid:string):RecordedDuel[]{
 try{const rows=JSON.parse(localStorage.getItem(historyKey(uid))??'[]');return Array.isArray(rows)?rows.filter(r=>r&&typeof r.key==='string'&&typeof r.uid==='string'&&Number.isInteger(r.for)&&Number.isInteger(r.against)).slice(-120):[]}catch{return[]}
}
export function FootballRivalHistory({youUid,duels,amigos,mapa,proximo}:{youUid:string;duels:RecordedDuel[];amigos:AmigoRival[];mapa:Record<string,Retro>;proximo?:import('./rivalidades-sala').ProximoEncontro|null}){
 const owner=useOwnerState(),navigation=useFootballMatchNavigation(owner?.roomId??'',true)
 const [history,setHistory]=useState(()=>readDuels(youUid))
 const serialized=JSON.stringify(duels)
 useEffect(()=>{
  if(!youUid)return
  const old=readDuels(youUid),merged=new Map(old.map(r=>[r.key,r]))
  for(const row of JSON.parse(serialized) as RecordedDuel[])merged.set(row.key,row)
  const next=[...merged.values()].slice(-120)
  if(JSON.stringify(old)!==JSON.stringify(next)){try{localStorage.setItem(historyKey(youUid),JSON.stringify(next))}catch{/* Match progress does not depend on this optional local history. */}}
  setHistory(next)
 },[youUid,serialized])
 const preview=proximo?.amigo??amigos[0],retro=preview?mapa[preview.uid]:undefined
 return <><OwnerSlot name="rival-preview"><section className="fp-desktop-extra"><header><h3>{tr('RIVALIDADES','RIVALRIES')}</h3><button type="button" onClick={()=>navigation.choose('rivals')}>{tr('Ver duelos','View meetings')} →</button></header>{preview?<><h4>{proximo?tr(`Próximo encontro · rodada ${proximo.rodada}`,`Next meeting · round ${proximo.rodada}`):tr('Contra seu rival','Against your rival')}</h4><p><span>{preview.time}</span><b>{retro?`${retro.v}V · ${retro.e}E · ${retro.d}D`:'—'}</b></p><small>{retro?tr('Seu retrospecto contra este técnico.','Your record against this manager.'):tr('O histórico aparece quando estiver disponível.','History appears when available.')}</small></>:<small>{tr('Os duelos entre técnicos aparecem aqui.','Meetings between managers appear here.')}</small>}</section></OwnerSlot><section className="fp-rival-history"><h2>{tr('O CLÁSSICO EM DETALHES','THE DERBY IN DETAIL')}</h2>{amigos.length===0?<p>{tr('Os duelos contra outros técnicos aparecem aqui.','Matches against other managers appear here.')}</p>:amigos.map(friend=>{
  const rows=history.filter(r=>r.uid===friend.uid),recent=rows.slice(-5).reverse(),seq=mapa[friend.uid]?.seq?.slice(-10).split('')??[]
  const largest=rows.filter(r=>r.for>r.against).sort((a,b)=>(b.for-b.against)-(a.for-a.against)||b.for-a.for)[0]
  return <article key={friend.uid}><h3>{friend.time}</h3>{seq.length>0&&<div className="fp-rival-sequence" aria-label={tr('Últimos resultados, do mais antigo ao mais recente','Recent results, oldest to newest')}>{seq.map((r,i)=><span key={i} data-result={r}>{r}</span>)}</div>}
   <h4>{tr('Últimos duelos registrados','Recent recorded meetings')}</h4>{recent.length?recent.map(row=><p key={row.key}><span>{tr('Temporada','Season')} {row.season} · {tr('Rodada','Round')} {row.round}</span><b>{row.for} × {row.against}</b></p>):<p>{tr('O próximo duelo concluído entra nesta lista.','The next completed meeting will appear here.')}</p>}
   {largest&&<p className="fp-rival-record"><span>{tr('Sua maior vitória registrada','Your biggest recorded win')}</span><b>{largest.for} × {largest.against}</b></p>}
  </article>
 })}<small>{tr('Sequência: histórico da conta. Placares detalhados: duelos registrados neste aparelho a partir deste teste.','Sequence: account history. Detailed scores: meetings recorded on this device since this trial.')}</small></section></>
}

/** Same account history as the league, with no invented historic scores. */
export function FootballCompetitionRivals({state,results,finished,round,fixtures=[]}:{state:import('./types').EscState;results:import('./types').MatchResult[];finished:boolean;round:number;fixtures?:[number,number][][]}){
 const you=state.managers[state.youIdx]
 const allowed=!(state.duplas&&Object.keys(state.duplas).length)
 const uid=(id:number)=>allowed?state.seatUids?.[id]??'':''
 const amigos=state.managers.filter(m=>m.isHuman&&m.id!==you.id&&uid(m.id)&&uid(m.id)!==uid(you.id)).map(m=>({uid:uid(m.id),nome:m.name,time:m.teamName||m.name,temporada:rivalryOf(state.rivalries,you.id,m.id),id:m.id}))
 const mapa=useRetrospecto(uid(you.id),amigos.map(a=>a.uid),`${state.seed}:${state.screen}:${round}`,state.espectador?state.roomId:null)
 const scheduled=footballNextFixture(fixtures,round,you.id),nextClub=scheduled?state.managers.find(m=>m.id===scheduled.opponentId):undefined,friend=scheduled?amigos.find(a=>a.id===scheduled.opponentId):undefined
 const nextGame=scheduled&&nextClub?{...scheduled,opponent:nextClub.teamName||nextClub.name,friend}:null
 const proximo=scheduled&&friend?{amigo:friend,rodada:scheduled.round,daqui:scheduled.round-round}:null
 const duels=finished?results.filter(r=>(r.homeId===you.id||r.awayId===you.id)&&amigos.some(a=>a.id===(r.homeId===you.id?r.awayId:r.homeId))).map(r=>({key:`${state.roomId}:${state.seed}:${state.screen}:${state.seasonNo}:${round}:${r.homeId}:${r.awayId}`,uid:uid(r.homeId===you.id?r.awayId:r.homeId),name:amigos.find(a=>a.id===(r.homeId===you.id?r.awayId:r.homeId))?.time??'',for:r.homeId===you.id?r.hg:r.ag,against:r.homeId===you.id?r.ag:r.hg,season:state.seasonNo??1,round})):[]
 return <><OwnerSlot name="next-rival"><FootballNextOpponent game={nextGame} mapa={mapa} meuTime={you.teamName}/></OwnerSlot><OwnerSlot name="rivals"><section className="ov3-rivalries"><FootballNextOpponent game={nextGame} mapa={mapa} meuTime={you.teamName}/><PrateleiraRivalidades amigos={amigos} mapa={mapa} proximo={proximo} meuTime={you.teamName} hideNext classico/><FootballRivalHistory youUid={uid(you.id)} amigos={amigos} mapa={mapa} proximo={proximo} duels={duels}/></section></OwnerSlot></>
}

export function FootballDesktopLeaders({state,finished}:{state:import('./types').EscState;finished:boolean}){
 const navigation=useFootballMatchNavigation(state.roomId??'',true)
 const source=state.quickCopa&&state.quickCopa.phase!=='done'?state.quickCopa:state.screen==='champions'?state.champions:state.screen==='liberta'?state.liberta:state
 const key=`${state.roomId}:${state.seed}:${state.screen}:${source===state?'liga':source===state.quickCopa?'copa':'continental'}`
 const snapshot=useRef<{key:string;goals:import('./types').ScorerRow[];assists:import('./types').AssistRow[]}>({key,goals:source===state?state.scorersPrev??[]:[],assists:[]})
 if(snapshot.current.key!==key)snapshot.current={key,goals:source===state?state.scorersPrev??[]:[],assists:[]}
 if(finished)snapshot.current={key,goals:source?.scorers??[],assists:source?.assists??[]}
 const rows=(kind:'goals'|'assists')=>[...snapshot.current[kind]].sort((a,b)=>Number((b as unknown as Record<string,number>)[kind])-Number((a as unknown as Record<string,number>)[kind])||a.name.localeCompare(b.name)).slice(0,3)
 return <OwnerSlot name="leaders"><section className="fp-desktop-extra"><header><h3>{tr('QUEM DECIDE','THE DECISIVE PLAYERS')}</h3><button type="button" onClick={()=>navigation.choose('stats')}>{tr('Ver estatísticas','View statistics')} →</button></header>{(['goals','assists'] as const).map(kind=><div key={kind}><h4>{kind==='goals'?tr('⚽ Artilharia','⚽ Top scorers'):tr('🅰️ Assistências','🅰️ Assists')}</h4>{rows(kind).length?rows(kind).map((row,i)=><p key={`${row.teamId}:${row.name}`}><span>{i+1}. {row.name}<small>{row.teamName}</small></span><b>{(row as unknown as Record<string,number>)[kind]}</b></p>):<small>{tr('Nenhum registro disponível ainda.','No records available yet.')}</small>}</div>)}<small>{tr('Até a última rodada encerrada.','Through the last completed round.')}</small></section></OwnerSlot>
}


export function FootballRoundNotice({status}:{status:import('./football-round-status').FootballRoundStatus}){
 return <section className="fp-round-notice" role="status" data-round-state={status.kind}>
  <h3>{status.kind==='bye'?tr('VOCÊ FOLGA NESTA RODADA','YOU HAVE A BYE THIS ROUND'):status.kind==='unavailable'?tr('SEU JOGO NÃO CARREGOU','YOUR MATCH HAS NOT LOADED'):tr('AGUARDANDO O PONTAPÉ INICIAL','WAITING FOR KICK-OFF')}</h3>
  {status.kind==='bye'&&<p>{tr(`Com ${status.clubs} clubes, um time descansa por rodada. Os outros jogos seguem normalmente.`,`With ${status.clubs} clubs, one team rests each round. The other matches continue as usual.`)}</p>}
  {status.kind==='unavailable'&&<p>{tr('Seu time tem jogo no calendário. Confira a rodada em “Tabela e jogos”; esta tela está sem o resultado da sua partida.','Your team has a scheduled match. Check “Table and matches”; this screen is missing your match result.')}</p>}
  {status.next&&<p className="fp-round-next"><strong>{tr('Próximo jogo','Next match')}:</strong> {status.next.opponent} · {tr('Rodada','Round')} {status.next.round} · {status.next.home?tr('em casa','home'):tr('fora','away')}</p>}
 </section>
}
