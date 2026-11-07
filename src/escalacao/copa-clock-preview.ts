import {useCallback,useEffect,useRef,useState} from 'react'
import {supabase} from '../lib/supabase'
import {PASSO_COPA,passoRodaBola,respiroAntes,RESUMO_MS,passoComResumo} from './copa-passos'
import {doisDDoPasso} from './campo2d-modo'
import {usePreparaTroca2D} from './troca2d-copa'
import * as naTela from './penaltis-na-tela'

export type CopaClockRow={revision:number;step:number;running:boolean;manual:boolean;speed:number;vel2d?:number|null;started_at:string;updated_at:string;duration_ms:number;extra_ms:number}
export type CopaClockCommand='next'|'skip'|'finish'|'manual'|'auto'|'speed'|'vel2d' // ⏩📺 06/11: 'vel2d' = a marcha do 2D (coluna própria)
export type CopaClockController={row:CopaClockRow|null;now:number;isHost:boolean;busy:boolean;error:string;command:(cmd:CopaClockCommand,speed?:number)=>Promise<void>}

/** O banco carimba o início; leitura não avança a Copa nem recalcula resultados. */
export function clockMinute(row:CopaClockRow,now:number){
 return row.running?Math.max(0,Math.min(93,Math.round((now-Date.parse(row.started_at))/(row.duration_ms*.82)*93))):93
}
/** 🎬 segundos que faltam pra bola rolar no próximo passo (null = sem contagem: rodando, manual ou passo que não roda bola) */
export function aberturaSegundos(row:CopaClockRow,now:number):number|null{
 if(row.running||row.manual||row.step>=PASSO_COPA.FIM||!passoRodaBola(row.step+1))return null
 return Math.max(0,Math.ceil((Date.parse(row.updated_at)+respiroAntes(true,row.step,passoComResumo(row.step+1))-now)/1000))
}
/** ✅❌ ainda está nos 5s do RESUMO da fase que fechou (antes da abertura)? Vale no manual também: o resumo é só leitura. */
export function resumoAberto(row:CopaClockRow,now:number):boolean{
 if(row.running||row.step>=PASSO_COPA.FIM||!passoComResumo(row.step+1))return false
 return now<Date.parse(row.updated_at)+RESUMO_MS
}
/** 📺 quando o jogo FECHA: sala normal = a duração inteira; sala 2D = o apito (0,82 × duração) + 3 s — a MESMA conta do banco
 *  (`docs/sql/copa-regional-clock-campo2d.sql`), senão o jogo do campinho ficaria ~20 s parado no 93' esperando */
export const fimDoJogoMs=(duracao:number,doisD:boolean)=>doisD?Math.round(duracao*0.82)+3000:duracao
/** 🥅 07/11 (Diego: *"o jogo não pode acabar antes dos pênaltis"*): o aparelho do DONO segura o apito final do passo enquanto a
 *  disputa de pênaltis ainda roda na tela DELE (aparelho lento, aba que voltou). Com teto: passou SEGURA_PENALTIS_MS do horário
 *  normal, fecha mesmo assim — a sala nunca trava por causa de um aparelho. Nada muda no banco nem no canal. */
export const SEGURA_PENALTIS_MS=8000
export const seguraPelaDisputa=(due:number,now:number)=>now<due+SEGURA_PENALTIS_MS&&!!naTela.disputaRolandoNaTela?.()
/** 🥅 07/11: o banco guarda no máximo 60 s de `extra` (`least(60000,p_extra)`), e uma morte súbita longa com gente passa disso
 *  (37+ cobranças × 1,6 s). O aparelho do DONO sabe quanto a disputa da fase precisa (`pensRevealDelay`, a MESMA conta que ele
 *  manda no 'next') e espera por ela antes de apitar — o banco aceita o 'finish' atrasado (só recusa adiantado). Teto de 3 min.
 *  Nada muda no banco, no canal nem na coroa: só o dono espera mais pra mandar o mesmo comando de sempre. */
export const EXTRA_MAX_PENALTIS_MS=180000
export const fimDoPassoMs=(row:CopaClockRow,doisD=false,extraPrecisa=0)=>Date.parse(row.started_at)+fimDoJogoMs(row.duration_ms,doisD)+Math.max(row.extra_ms,extraPrecisa>0?700+Math.min(EXTRA_MAX_PENALTIS_MS,extraPrecisa):0)+150
export function dueClockCommand(row:CopaClockRow,now:number,doisD=false,extraPrecisa=0):'finish'|'next'|null{
 if(row.running){const due=fimDoPassoMs(row,doisD,extraPrecisa);return now>=due&&!seguraPelaDisputa(due,now)?'finish':null}
 // o último passo é a cerimônia (`PASSO_COPA.FIM`); o banco tem a mesma trava
 // 🎬 antes de passo que roda bola, 5s de abertura (copa-passos.ts)
 return !row.manual&&row.step<PASSO_COPA.FIM&&now>=Date.parse(row.updated_at)+respiroAntes(passoRodaBola(row.step+1),row.step,passoComResumo(row.step+1))?'next':null
}

export function useCopaClockPreview(enabled:boolean,roomId:string,edicao:number,seed:number,isHost:boolean,extraForStep:(step:number)=>number,doisD=false):CopaClockController|undefined{
 const [row,setRow]=useState<CopaClockRow|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now())
 const prepara2D=usePreparaTroca2D(roomId,isHost) // 📺⚡ troca 2D ↔ rápido marcada pelo dono: entra entre um passo e outro
 const current=useRef<CopaClockRow|null>(null),offset=useRef(0),inFlight=useRef(false),generation=useRef(0),extra=useRef(extraForStep)
 extra.current=extraForStep
 const rpc=useCallback(async(cmd:'read'|'init'|CopaClockCommand,speed=1)=>{
  if(!enabled||inFlight.current)return
  if(cmd!=='read'&&!isHost)return
  const gen=generation.current
  inFlight.current=true
  if(cmd!=='read')setBusy(true)
  const sent=Date.now()
  try{
   const {data,error:failure}=await supabase.rpc('esc_copa_preview_clock',{p_room:roomId,p_edicao:edicao,p_seed:seed,p_command:cmd,p_revision:current.current?.revision??-1,p_speed:speed,p_extra:cmd==='next'?extra.current((current.current?.step??0)+1):0})
   if(gen!==generation.current)return
   if(failure)throw failure
   offset.current=Number(data.server_ms)-(sent+Date.now())/2
   const incoming=data.clock as CopaClockRow|null
   if(incoming&&(!current.current||incoming.revision>=current.current.revision)){current.current=incoming;setRow(incoming)}
   setNow(Date.now()+offset.current);setLoading(false);setError('')
  }catch{if(gen===generation.current)setError('Sem conexão com o relógio da sala. Aguardando reconectar…')}
  finally{if(gen===generation.current){inFlight.current=false;setBusy(false)}}
 },[enabled,roomId,edicao,seed,isHost])
 useEffect(()=>{
  generation.current++;current.current=null;setRow(null);setLoading(true);inFlight.current=false;setError('')
  if(!enabled)return
  void rpc(isHost?'init':'read')
  const poll=setInterval(()=>{void rpc(isHost&&!current.current?'init':'read')},2000)
  const refresh=()=>{void rpc('read')}
  window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh)
  return()=>{generation.current++;clearInterval(poll);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh)}
 },[enabled,rpc,isHost])
 useEffect(()=>{
  if(!enabled)return
  const timer=setInterval(()=>{
   const stamp=Date.now()+offset.current;setNow(stamp)
   const r=current.current
   if(!isHost||!r)return
   const pronto2D=r.running?true:prepara2D() // 📺⚡ bola parada: a troca marcada pelo dono já vai sendo aplicada (auto E manual)
   const cmd=dueClockCommand(r,stamp,doisDDoPasso(r)??doisD,r.running?extra.current(r.step):0) // 📺 o 2D do passo é o que o banco carimbou nele · 🥅 a disputa inteira, mesmo acima do teto do banco
   if(cmd==='next'&&!pronto2D)return // 📺⚡ espera o banco ter o 2D novo antes de começar o próximo passo
   if(cmd)void rpc(cmd)
  },250)
  return()=>clearInterval(timer)
 },[enabled,isHost,rpc,doisD,prepara2D])
 // Convidado de host público conserva o comportamento público (não há linha privada).
 if(!enabled||(!isHost&&!loading&&!row))return undefined
 return{row,now,isHost,busy,error,command:(c,sp)=>c==='next'&&!prepara2D()?Promise.resolve():rpc(c,sp)} // 📺⚡ o 'next' do manual também espera a troca entrar
}
