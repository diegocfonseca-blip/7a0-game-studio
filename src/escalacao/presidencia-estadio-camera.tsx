import {lazy,Suspense,useMemo,useRef} from 'react'
import {useReplay3D,type FonteReplay3D} from './presidencia-replay-3d'
import {useT} from './lang'
import {usePartidaNoMapa} from './presidencia-partida-sincronia'
import type {StadiumSave} from './estadiodata'
import {usePresidentPreview} from './presidente-acesso'
import {adaptarCarreiraAoComplexo,type EntradaCarreiraComplexo} from './presidencia-complexo-carreira'
import {podeOperarTeto} from './presidencia-estadio-integrado'
import type {EstadoPartidaEstadio} from './presidencia-partida-model'
import type {ControleComplexo} from './presidencia-complexo-3d'
import {Btn} from './ui-primitives'
import {usePresidenteConta,presidenteContaLiberado} from './presidente-conta'
import {artesIdentidadeSala} from './presidencia-sala-identidade-assets'
import {useVistaCampo} from './presidencia-campo-observacao'
import {MapaHud} from './presidencia-mapa-hud'
const Complexo=lazy(()=>import('./presidencia-complexo-3d'))
export type CarreiraCameraEstadio=Omit<EntradaCarreiraComplexo,'enabled'|'match'> & {key:string;replayMatch?:FonteReplay3D}
/** Slot privado da aba existente: obras/compras permanecem no motor atual. */
export function PresidenciaEstadioCamera({stadium,onRoof,matchId,homeClubId,career,onReady}:{stadium?:StadiumSave;matchId?:string;homeClubId?:number;onRoof?:(closed:boolean)=>void;career?:CarreiraCameraEstadio;onReady?:(api:ControleComplexo|null)=>void}){
 const match=usePartidaNoMapa(matchId,homeClubId,!!career),t=useT()
 const account=usePresidentPreview(),last=useRef<{key:string;match:EstadoPartidaEstadio}|null>(null)
 const replay=useReplay3D(career?.replayMatch,account)
 const replayFrame=replay.frame
 const watching=useVistaCampo<HTMLElement>(account)
 const accountPresident=usePresidenteConta()
 const identityArt=useMemo(()=>artesIdentidadeSala(career?.identity),[career?.identity])
 if(last.current?.key!==career?.key)last.current=null
 if(career&&account&&match)last.current={key:career.key,match}
 if(!account)last.current=null
 // Preserve people finishing their route after the score presentation unmounts.
 // The retained snapshot is local presentation only; it never writes a result.
 const retained=match??(last.current?{...last.current.match,finished:true,paused:true}:undefined)
 // 🏟️ dia de jogo em casa antes do apito: a torcida chegando é do jogo QUE VEM — o último jogo (já guardado) não entra na conta
 const chegada=career?.journeyPhase==='arrival'&&!!career.agenda&&!match
 const adapted=career&&account?adaptarCarreiraAoComplexo({...career,enabled:true,match:chegada?undefined:retained,
  agenda:chegada?career.agenda:retained?.context.agenda??career.agenda}):null
 if(career&&!account)return null
 if(adapted)return <section ref={watching} data-presidencia-complexo-carreira>
  {/* 📺 25/10: o ritmo e o placar moram DENTRO do mapa (MapaHud); os créditos foram pro pé */}
  {career?.replayMatch&&<div data-private-match-review style={{margin:'10px 0'}}>
   <button type="button" onClick={replay.start}>{t('REVER JOGO SALVO EM 3D','REPLAY SAVED MATCH IN 3D')}</button>
   {replay.active&&<><button type="button" disabled={replayFrame?.finished} onClick={replay.pause}>{replay.paused?t('CONTINUAR','RESUME'):t('PAUSAR','PAUSE')}</button><button type="button" onClick={replay.stop}>{t('FECHAR REPLAY','CLOSE REPLAY')}</button></>}
   {replayFrame&&<p role="status">{t('Reprodução de teste no campo do mapa. Não avança a carreira.','Test replay on the map pitch. It does not advance your career.')} {replayFrame.officialTeams?.join(' × ')} · {replayFrame.homeScore} × {replayFrame.awayScore} · {Math.min(93,Math.floor(replayFrame.minute))}′</p>}
   {replay.error&&<p role="status">{t('Este jogo salvo não possui replay compatível. Seu resultado foi preservado.','This saved match has no compatible replay. Its result was preserved.')}</p>}
  </div>}
  <Suspense fallback={<p role="status">{t('Carregando seu estádio e a região…','Loading your stadium and its surroundings…')}</p>}>
   <Complexo {...adapted.complexo} match={(replayFrame??adapted.complexo.match)?{...(replayFrame??adapted.complexo.match)!,viewerClubId:career!.mgrId}:undefined} president={presidenteContaLiberado()&&accountPresident.value?accountPresident.value:adapted.sala.president} identityArt={identityArt} trophies={adapted.sala.trophies} onReady={onReady} hud={<MapaHud match={retained}/>}/>
  </Suspense>
  {onRoof&&podeOperarTeto(stadium)&&<div style={{margin:'12px 0'}}><Btn onClick={()=>onRoof(stadium?.roofClosed!==true)}>{stadium?.roofClosed?t('ABRIR TETO','OPEN ROOF'):t('FECHAR TETO','CLOSE ROOF')}</Btn></div>}
  <p style={{margin:'8px 0 0',fontSize:11}}><a href="./creditos-3d.txt" target="_blank" rel="noreferrer">{t('Créditos dos modelos e animações 3D','3D models and animation credits')}</a></p>

 </section>
 return <section ref={watching}>
  <Suspense fallback={<p role="status">{t('Carregando mapa 3D…','Loading 3D map…')}</p>}>
   <Complexo stadium={stadium} match={match??undefined} onReady={onReady} hud={<MapaHud match={match}/>}/>
  </Suspense>
  {onRoof&&podeOperarTeto(stadium)&&<div style={{margin:'12px 0'}}><Btn onClick={()=>onRoof(stadium?.roofClosed!==true)}>{stadium?.roofClosed?t('ABRIR TETO','OPEN ROOF'):t('FECHAR TETO','CLOSE ROOF')}</Btn></div>}
 </section>
}
