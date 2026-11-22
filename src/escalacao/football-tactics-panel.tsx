import {useEffect,useState} from 'react'
import {useEscTalvez} from './store'
import {FOOTBALL_LOCAL_ORDER,DEFAULT_FOOTBALL_PLAN,footballTestRoom,planFor,useFootballClock,type FootballPlan} from './football-live-tactics'
import {tr} from './lang'
import type {Tactic} from './types'

const same=(a:FootballPlan,b:FootballPlan)=>JSON.stringify(a)===JSON.stringify(b)
export function FootballTacticsPanel({value,onChange,disabled,note}:{value:Tactic;onChange:(t:Tactic)=>void;disabled:boolean;note?:string}){
 const ctx=useEscTalvez(),clock=useFootballClock()
 const state=ctx?.state,manager=state?.managers[state.youIdx]
 const actual=state&&manager?planFor(state,manager.id):{...DEFAULT_FOOTBALL_PLAN,posture:value}
 const key=state?`${state.roomId}:${state.seed}:${state.round}`:'fixture'
 const [draftState,setDraft]=useState<{key:string;plan:FootballPlan}|null>(null),[pending,setPending]=useState<string|null>(null),[error,setError]=useState('')
 const draft={...(draftState?.key===key?draftState.plan:actual),mark:null}
 const match=state&&manager?state.lastResults.find(r=>r.homeId===manager.id||r.awayId===manager.id):undefined
 const order=match?.footballLive?.orders.at(-1)
 const eligible=!!state&&footballTestRoom(state)&&state.screen==='season'&&!state.quickCopa&&!match?.kings&&state.champion==null
 const minute=clock?.room===state?.roomId&&clock?.round===state?.round?clock?.minute:undefined
 const live=eligible&&!!match&&minute!=null&&minute<88&&!!clock&&Date.now()-clock.at<7000
 const changed=!same(draft,actual)
 useEffect(()=>{
  if(!pending)return
  if(order?.id===pending){setPending(null);setError('');return}
  const timer=setTimeout(()=>{setPending(null);setError(tr('A ordem não entrou. Confira se a partida ainda está rolando e tente novamente.','The order was not applied. Check that the match is still running and try again.'))},1800)
  return()=>clearTimeout(timer)
 },[pending,order?.id])
 const change=<K extends keyof FootballPlan>(field:K,next:FootballPlan[K])=>{
  const plan={...draft,[field]:next};setDraft({key,plan});setError('')
  if(field==='posture'&&!eligible)onChange(next as Tactic)
 }
 const group=<K extends 'posture'|'attack'|'pressure'|'pace'>(field:K,label:string,options:{value:FootballPlan[K];label:string}[])=><div className="fp-order-group"><span>{label}</span><div role="group" aria-label={label}>{options.map(option=><button type="button" key={option.value} aria-pressed={draft[field]===option.value} disabled={disabled||!!pending} onClick={()=>change(field,option.value)}>{option.label}</button>)}</div></div>
 const tradeoff=draft.pressure==='high'?tr('Pressão alta: busca recuperar a bola adiantada e deixa mais espaço nas costas.','High press: tries to win the ball higher and leaves more space behind.'):draft.pace==='fast'?tr('Ritmo rápido: mais iniciativa, com mais espaço para o contra-ataque.','Fast tempo: more initiative, with more space for counterattacks.'):draft.pace==='slow'?tr('Cadenciado: menos iniciativa no ataque e mais proteção.','Slow tempo: less attacking initiative and more protection.'):draft.attack==='middle'?tr('Pelo meio: aproveita a qualidade dos seus meias.','Through the middle: uses your midfielders’ quality.'):draft.attack==='wings'?tr('Pelas pontas: aproveita laterais e atacantes, expondo um pouco a defesa.','Down the wings: uses wide players and forwards, leaving the defence more exposed.'):tr('Equilibre as escolhas conforme o time que você montou.','Balance your choices around the team you built.')
 return <section className="ov3-tactics fp-match-tactics fp-advanced-tactics" aria-label={tr('Plano do seu time','Your team plan')}><header><small>{tr('SEU TIME','YOUR TEAM')}</small><h3>{tr('MUDE O PLANO','CHANGE THE PLAN')}</h3>{order&&<b>{minute!=null&&minute>=order.from?tr('EM VIGOR','IN EFFECT'):tr(`ENTRA AOS ${order.from}′`,`FROM ${order.from}′`)}</b>}</header>
  {group('posture',tr('POSTURA','MENTALITY'),[{value:'retranca',label:tr('Retranca','Defensive')},{value:'equilibrio',label:tr('Equilíbrio','Balanced')},{value:'ataque',label:tr('Ofensivo','Attacking')}])}
  {group('attack',tr('CAMINHO DO ATAQUE','ATTACKING ROUTE'),[{value:'mixed',label:tr('Variado','Mixed')},{value:'middle',label:tr('Pelo meio','Middle')},{value:'wings',label:tr('Pontas','Wings')}])}
  {group('pressure',tr('MARCAÇÃO','PRESSING'),[{value:'normal',label:tr('Normal','Normal')},{value:'high',label:tr('Pressão alta','High press')}])}
  <p className="fp-plan-tradeoff">{tradeoff}</p>
  <div className="fp-extra-orders">{group('pace',tr('RITMO DO ATAQUE','ATTACKING TEMPO'),[{value:'slow',label:tr('Cadenciado','Slow')},{value:'normal',label:tr('Normal','Normal')},{value:'fast',label:tr('Rápido','Fast')}])}<small>{tr('Não altera a velocidade da transmissão.','Does not change playback speed.')}</small></div>
  {ctx&&<button type="button" className="fp-send-order" disabled={!changed||!live||disabled||!!pending} onClick={()=>{
   if(!state||!manager||!live)return
   const requestId=crypto.randomUUID();setPending(requestId);setError('')
   ctx.dispatch({type:'FOOTBALL_LIVE_PLAN',mgrId:manager.id,by:state.youUid!,round:state.round,plan:draft,requestId,localProof:FOOTBALL_LOCAL_ORDER})
  }}>{pending?tr('Enviando ordem…','Sending order…'):changed?tr('Enviar ordens','Send orders'):tr('Plano atual aplicado','Current plan applied')}</button>}
  <p className="fp-plan-status" role="status">{error||(order&&eligible?tr(`Ordem recebida: vale a partir dos ${order.from}′. Os lances anteriores ficam iguais.`,`Order received: applies from ${order.from}′. Earlier play is unchanged.`):!ctx?tr('Sua escolha vale para o próximo jogo.','Your choice applies to the next match.'):!eligible?tr('As novas ordens ao vivo estão em teste nas ligas criadas por você, com suas contas ou Futpoint. Nas outras salas, a postura vale para o próximo jogo.','Live orders are being tested in leagues hosted by you with your accounts or Futpoint. In other rooms, mentality applies to the next match.'):!live?tr('As ordens entram com a partida rolando, até os 87′.','Orders can be sent while the match is running, until 87′.'):tr('Enviar muda o restante desta partida, sem apagar gols ou reiniciar o relógio.','Sending changes the rest of this match without removing goals or restarting the clock.'))}</p>{note&&<small>{note}</small>}
 </section>
}
