import {useEffect,useRef,useState} from 'react'
import {cupPlanAt,type CupPlanRow} from './copa-planos'
import {DEFAULT_FOOTBALL_PLAN,type FootballPlan} from './football-live-tactics'
import type {TaticaCopa} from './copa-taticas'
import {tr} from './lang'

export type CupPlanController={key:string;uid:string;step:number;minute:number;running:boolean;duration:number;hasMatch:boolean;enabled:boolean;rows:CupPlanRow[];legacy:TaticaCopa;activePosture?:TaticaCopa;send:(plan:FootballPlan,live:boolean,id:string)=>Promise<number>}
const equal=(a:FootballPlan,b:FootballPlan)=>JSON.stringify(a)===JSON.stringify(b)
export function CupPlanPanel({control}:{control:CupPlanController}){
 const {uid,step,minute,running,duration,hasMatch,enabled,rows,legacy,send}=control
 const own=rows.filter(r=>r.uid===uid).sort((a,b)=>a.seq-b.seq),last=own.at(-1)
 const preferred=last?.plan??{...DEFAULT_FOOTBALL_PLAN,posture:legacy}
 const sent=own.filter(r=>r.step===step&&r.from>0).at(-1)
 const actual=sent?.plan??cupPlanAt(rows,uid,step,control.activePosture??legacy)
 const [draft,setDraft]=useState<FootballPlan|null>(null),[saving,setSaving]=useState(0),[sending,setSending]=useState(false),[error,setError]=useState('')
 const queue=useRef(Promise.resolve()),alive=useRef(true)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
 useEffect(()=>{if(draft&&equal(draft,preferred))setDraft(null)},[draft,preferred])
 const selected=draft??preferred
 const canSend=enabled&&running&&hasMatch&&Math.ceil(minute+4500/(duration*.82)*93)<88
 const change=<K extends keyof FootballPlan>(field:K,value:FootballPlan[K])=>{
  const plan={...selected,[field]:value,mark:null};setDraft(plan);setError('');setSaving(n=>n+1)
  queue.current=queue.current.catch(()=>{}).then(async()=>{
   try{await send(plan,false,crypto.randomUUID())}catch(e){if(alive.current){setError((e as Error).message);setDraft(null)}}finally{if(alive.current)setSaving(n=>Math.max(0,n-1))}
  })
 }
 const group=<K extends 'posture'|'attack'|'pressure'|'pace'>(key:K,label:string,options:[FootballPlan[K],string][])=><div className="fp-order-group"><span>{label}</span><div role="group" aria-label={label}>{options.map(([value,text])=><button key={value} type="button" aria-pressed={selected[key]===value} disabled={!enabled||sending} onClick={()=>change(key,value)}>{text}</button>)}</div></div>
 return <section className="ov3-tactics fp-match-tactics fp-advanced-tactics fp-cup-plan" aria-label={tr('Plano do seu time na Copa','Your Cup game plan')}>
  <header><small>{tr('SEU TIME NESTA COPA','YOUR TEAM IN THIS CUP')}</small><h3>{tr('MUDE O PLANO','CHANGE THE PLAN')}</h3>{sent&&<b>{minute>=sent.from?tr('EM VIGOR','IN EFFECT'):tr(`ENTRA AOS ${sent.from}′`,`FROM ${sent.from}′`)}</b>}</header>
  {group('posture',tr('POSTURA','MENTALITY'),[['retranca',tr('Retranca','Defensive')],['equilibrio',tr('Equilíbrio','Balanced')],['ataque',tr('Ofensivo','Attacking')]])}
  {group('attack',tr('CAMINHO DO ATAQUE','ATTACKING ROUTE'),[['mixed',tr('Variado','Mixed')],['middle',tr('Pelo meio','Middle')],['wings',tr('Pontas','Wings')]])}
  {group('pressure',tr('MARCAÇÃO','PRESSING'),[['normal',tr('Normal','Normal')],['high',tr('Pressão alta','High press')]])}
  <p className="fp-plan-tradeoff">{selected.pressure==='high'?tr('Pressão alta adianta a marcação e abre espaço nas costas.','High press moves defending forward and leaves space behind.'):tr('O plano continua nas próximas partidas desta Copa, até você mudar.','The plan stays in the next matches of this Cup until you change it.')}</p>
  {group('pace',tr('RITMO DO ATAQUE','ATTACKING TEMPO'),[['slow',tr('Cadenciado','Slow')],['normal',tr('Normal','Normal')],['fast',tr('Rápido','Fast')]])}
  <small>{tr('Não altera a velocidade da transmissão.','Does not change playback speed.')}</small>
  <button type="button" className="fp-send-order" disabled={!canSend||!!saving||sending||equal(selected,actual)} onClick={async()=>{setSending(true);setError('');try{await send(selected,true,crypto.randomUUID())}catch(e){setError((e as Error).message)}finally{if(alive.current)setSending(false)}}}>{!enabled?tr('Aguardando participantes','Waiting for participants'):saving?tr('Salvando plano…','Saving plan…'):sending?tr('Enviando ordem…','Sending order…'):canSend&&!equal(selected,actual)?tr('Enviar ordens','Send orders'):tr('Plano salvo para os próximos jogos','Plan saved for the next matches')}</button>
  <p className="fp-plan-status" role="status">{error||(!enabled?tr('Aguardando a versão atualizada de todos os participantes para liberar o plano completo.','Waiting for every participant’s updated version to unlock the full plan.'):saving?tr('Confirmando sua escolha na sala…','Confirming your choice in the room…'):sent?tr(`Ordem confirmada para os ${sent.from}′. As escolhas continuam nas próximas partidas.`,`Order confirmed for ${sent.from}′. Choices stay for the next matches.`):canSend?tr('As escolhas ficam salvas. Enviar ordens aplica também nesta partida, com alguns segundos para todos receberem.','Choices stay saved. Send orders also applies them to this match, allowing a few seconds for everyone to receive them.'):tr('Plano preparado para o próximo jogo. Nesta etapa, a janela de ordens ao vivo está fechada.','Plan prepared for the next match. The live order window is closed in this stage.'))}</p>
 </section>
}
