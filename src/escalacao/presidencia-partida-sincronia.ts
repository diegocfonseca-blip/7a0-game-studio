import {useEffect,useRef,useSyncExternalStore} from 'react'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'

type Publicacao={owner:symbol;state:EstadoPartidaEstadio}
let active:Publicacao|null=null
const listeners=new Set<()=>void>()
const notify=()=>listeners.forEach(fn=>fn())
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}}
let engine:typeof import('./presidencia-futebol-motor')|undefined
/** A restart is physical play too; the match clock waits while the ball is
 * retrieved and the teams take their legal positions. */
export function reinicioPartidaPendente(id:string){return engine?.aguardandoReinicioFutebol(id)??false}
/** Somente a apresentação privada usa esta leitura ao preparar um lance.
 * O id impede reaproveitar posições de outra partida. */
export function partidaPublicada(id:string){return active?.state.context.id===id?active.state:null}
/** Só a apresentação privada do placar publica. Sem storage, rede, RNG ou gols novos. */
export function usePublicarPartida(state:EstadoPartidaEstadio){
 const owner=useRef(Symbol('placar')),clock=useRef({id:state.context.id,seconds:0,sampledAt:performance.now(),running:false,rate:1})
 const rate=Number.isFinite(state.context.speed)?Math.max(.25,Math.min(8,state.context.speed!)):1
 const running=!state.paused&&!state.finished&&(!!state.officialInput||state.minute>0)
 // ⚡ 27/10: o placar redesenha ~25×/s (a narração anda de 40 em 40 ms) e cada redesenho criava um quadro NOVO e avisava o mapa,
 // a câmera e o HUD — que redesenhavam junto, à toa. Agora só vira "outro quadro" quando muda o que o jogo É (minuto, placar,
 // pausa, lance, gol, escalação, narração); entre um e outro o relógio continua contando sozinho a partir do mesmo instante
 // (tempoVisualPartida soma o tempo corrido), então o minuto mostrado é o mesmo de antes.
 const chave=[state.context.id,state.minute,state.period,state.homeScore,state.awayScore,state.paused,state.finished,running,rate,state.chance?.id,state.goal?.id,state.goal?.phase,state.homeColor,state.awayColor,state.officialMinuteMs].join('|')
 const memo=useRef<{chave:string;input:unknown;narr:unknown;frame:EstadoPartidaEstadio}|null>(null)
 let frame:EstadoPartidaEstadio
 if(memo.current&&memo.current.chave===chave&&memo.current.input===state.officialInput&&memo.current.narr===state.officialNarration)frame=memo.current.frame
 else{
  const now=performance.now(),old=clock.current
  const seconds=old.id!==state.context.id?0:old.seconds+(old.running?Math.max(0,now-old.sampledAt)/1000*old.rate:0)
  clock.current={id:state.context.id,seconds,sampledAt:now,running,rate}
  frame={...state,visualClock:{seconds,sampledAt:now,running,rate}}
  memo.current={chave,input:state.officialInput,narr:state.officialNarration,frame}}
 // Apenas mudanças do placar/modelo notificam assinantes; câmera/zoom não cria outro motor.
 // (com o relógio rodando, o laço abaixo já pede o quadro a cada quadro de tela: aqui só publica)
 useEffect(()=>{active={owner:owner.current,state:frame};if(!frame.visualClock?.running)engine?.quadroFutebol3D(frame,performance.now());notify()},[frame])
 // One CPU simulation belongs to the scoreboard, not to a visible camera.
 // It must cross half-time and process incidents even with the details closed.
 useEffect(()=>{
  let cancelled=false,raf=0
  import('./presidencia-futebol-motor').then(module=>{
   if(cancelled)return
   engine=module
   const draw=(now:number)=>{
    if(cancelled||active?.owner!==owner.current)return
    const frame=module.quadroFutebol3D(active.state,now)
    // Like Campo2D, finish a pending celebration/restart after the clock closes.
    const closing=!!active.state.officialInput&&active.state.finished&&!frame.official?.finished
    if(active.state.visualClock?.running||closing)raf=requestAnimationFrame(draw)
   }
   draw(performance.now())
  })
  return()=>{cancelled=true;cancelAnimationFrame(raf)}
 },[state.context.id,running,state.finished])
 useEffect(()=>{const token=owner.current;return()=>{if(active?.owner===token){active=null;notify()}}},[])
 return frame
}
export function usePartidaNoMapa(matchId?:string,homeClubId?:number,includeFinished=false){
 return useSyncExternalStore(subscribe,()=>{const s=active?.state;if(!s)return null;return matchId?s.context.id===matchId?s:null:homeClubId!==undefined&&(s.context.homeClubId===homeClubId||s.context.awayClubId===homeClubId)&&(includeFinished||!s.finished)?s:null},()=>null)
}
