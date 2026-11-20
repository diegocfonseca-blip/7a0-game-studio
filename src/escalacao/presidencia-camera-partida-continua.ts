import {MathUtils,Vector3,type PerspectiveCamera} from 'three'
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {enquadramentoFutebol,type AlvoCameraFutebol,type CameraFutebolPreset} from './presidencia-enquadramento-futebol'
export type CameraPartidaContinua='free'|CameraFutebolPreset
/** One camera in one world. This controller never receives the match engine. */
export function criarCameraPartidaContinua(camera:PerspectiveCamera,controls:OrbitControls,onMode:(mode:CameraPartidaContinua)=>void){
 let mode:CameraPartidaContinua='free',returning=false,last:number|undefined,moving=false
 let distance:number|undefined,zoomInSince:number|undefined,zoomPending=false
 let lens:number|undefined,lensMode:CameraPartidaContinua|undefined,lensCloseSince:number|undefined
 let saved:{position:Vector3;target:Vector3;fov:number}|undefined,framing:{x:number;y:number;visible:boolean}|undefined
 let forcado:CameraPartidaContinua|undefined,distGuardada:number|undefined,corte=false
 let fixedZoom=1,controlsBeforeFixed:boolean|undefined,pitchOnly=false
 // 🏟️ 19/11 (Diego: *"uma visualização de giro no estádio até chegar o momento de enquadrar o campo"*): ABERTURA de transmissão.
 // A câmera nasce alta, longe, girando em volta do estádio, e desce em espiral até a câmera de TV. Só mexe na câmera (nunca no jogo).
 let abertura:{ini:number;dur:number}|undefined
 const ABERTURA_MS=7000
 const restoreControls=()=>{if(controlsBeforeFixed!==undefined){controls.enabled=controlsBeforeFixed;controlsBeforeFixed=undefined}}
 const enterFree=(restore=true)=>{restoreControls();mode='free';returning=restore&&!!saved;moving=returning;last=undefined;distance=undefined;zoomInSince=undefined;zoomPending=false;onMode(mode)}
 return {
  setMode(next:CameraPartidaContinua){if(next===mode)return;restoreControls();if(next!=='free'){if(mode==='free'&&!returning)saved={position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};mode=next;if((next==='fixed'||next==='field2d')){controlsBeforeFixed=controls.enabled??true;controls.enabled=false}returning=false;moving=true;last=undefined;distance=undefined;zoomInSince=undefined;onMode(mode)}else enterFree()},
  setPitchOnly(value:boolean){if(value&&!pitchOnly){corte=true;abertura=undefined;moving=true}pitchOnly=value;if(value)fixedZoom=Math.min(1,fixedZoom)},
  zoomFixed(factor:number){if((mode!=='fixed'&&mode!=='field2d'&&(!pitchOnly||mode==='free'))||!Number.isFinite(factor)||factor<=0)return false;fixedZoom=MathUtils.clamp(fixedZoom*factor,mode==='field2d'?.48:.7,pitchOnly?1:1.6);moving=true;return true},
  explore(){abertura=undefined;enterFree(false)},
  abrir(now:number,dur=ABERTURA_MS){abertura={ini:now,dur};moving=true},
  get abrindo(){return !!abertura},
  update(ball:{x:number;y:number;z:number;presentation?:{x:number;y:number;z:number}},now:number,subjects:readonly AlvoCameraFutebol[]=[],foco?:{x:number;y:number;z:number},forcar?:CameraPartidaContinua,ataque:1|-1=1){
   ball=foco??ball.presentation??ball // (🤝 `foco`: depois do apito a TV segue os jogadores indo pro meio, não a bola parada)
   // Slow devices must consume real elapsed camera time instead of needing
   // dozens of rendered frames for a transition. This clock never drives play.
   const dt=last===undefined?1/60:MathUtils.clamp((now-last)/1000,0,.5);last=now
   zoomPending=false
   if(mode==='free'&&!returning){moving=false;return}
   // The fixed view must remain fixed even while a goal replay is playing.
   // This affects only its camera; replay events and timing stay untouched.
   if((mode==='fixed'||mode==='field2d'))forcar=undefined
   // 🔁 replay do gol: o preset forçado ('Atrás do gol') entra e sai em CORTE seco; a distância do preset do usuário fica guardada
   if(forcar!==forcado){if(forcar){distGuardada=distance;distance=undefined}else distance=distGuardada;forcado=forcar;corte=true}
   const modo=forcado??mode
   const fit=modo!=='free'?enquadramentoFutebol(camera,ball,subjects,modo,ataque):null
   if(fit){
    if(distance===undefined||fit.preset==='goal'||fit.preset==='broadcast'||fit.preset==='tv'||fit.preset==='follow'||(fit.preset==='fixed'||fit.preset==='field2d'))distance=fit.distance*((fit.preset==='fixed'||fit.preset==='field2d')?fixedZoom:1) // (📺 a TV fica parada na arquibancada: o zoom é a lente, não a distância)
    // Expand promptly for a receiver/high ball; close in only after a sustained
    // smaller play area. Crossing a neighbour-selection boundary cannot make
    // the lens pump in and out on every stride.
    if((fit.preset==='fixed'||fit.preset==='field2d'))zoomInSince=undefined
    else if(fit.distance>distance+.02){distance=MathUtils.lerp(distance,fit.distance,1-Math.exp(-dt/.15));zoomInSince=undefined;zoomPending=fit.distance-distance>.02;if(!zoomPending)distance=fit.distance}
    else if(fit.distance>distance){distance=fit.distance;zoomInSince=undefined}
    else if(fit.distance<distance*.86){zoomInSince??=now;if(now-zoomInSince>550)distance=MathUtils.lerp(distance,fit.distance,1-Math.exp(-dt/1.1));zoomPending=fit.distance<distance*.86}
    else zoomInSince=undefined
   }
   let fov=(fit?.fov??saved!.fov)*(pitchOnly&&mode!=='fixed'&&mode!=='field2d'?fixedZoom:1)
   if(fit&&(modo==='broadcast'||modo==='tele'||modo==='tv')){
    if(lens===undefined||lensMode!==modo||corte){lens=fov;lensCloseSince=undefined}
    else if(fov>lens+.01){lens=fov;lensCloseSince=undefined}
    else if(fov<lens-1.5){
     lensCloseSince??=now
     if(now-lensCloseSince>=550){lens=fov;lensCloseSince=undefined}
     else zoomPending=true
    }else lensCloseSince=undefined
    fov=lens
   }else{lens=undefined;lensCloseSince=undefined}
   lensMode=modo
   const target=fit?.target.clone()??saved!.target
   if(fit?.preset==='field2d'&&fixedZoom<1){
    // Whole-pitch view stays centred. Manual zoom progressively follows play
    // by translation, retaining the approved angle, lens and chosen zoom.
    const follow=MathUtils.clamp((1-fixedZoom)/.5,0,1)
    const maxX=Math.max(0,52.5-56*fixedZoom),maxZ=Math.max(0,34-37*fixedZoom)
    target.x=MathUtils.clamp(ball.x*follow,-maxX,maxX);target.z=MathUtils.clamp(ball.z*follow,-maxZ,maxZ)
   }
   const position=fit?target.clone().addScaledVector(fit.direction,distance!):saved!.position
   camera.updateMatrixWorld(true)
   const before=new Vector3(ball.x,ball.y,ball.z).project(camera)
   const edge=fit&&!fit.tactical?MathUtils.smoothstep(Math.max(Math.abs(before.x),Math.abs(before.y)),.45,.9):0
   // A fast pass near the edge gets a quicker pan, rather than leaving the
   // screen while a fixed-duration cinematic easing catches up behind it.
   // 🥅 'Atrás do gol' trocou de lado (a bola cruzou o meio): CORTE seco, como na TV — nada de a câmera voar 140 m por cima do campo
   if(fit?.preset==='goal'&&Math.abs(camera.position.x)>30&&Math.sign(position.x)!==Math.sign(camera.position.x)){camera.position.copy(position);controls.target.copy(target)}
   // 🎥 'Acompanhar o lance' virou de lado (a bola trocou de dono e o ataque é pro outro gol): CORTE seco pra trás da jogada nova
   if(fit?.preset==='follow'&&Math.abs(camera.position.x-target.x)>4&&Math.sign(position.x-target.x)!==Math.sign(camera.position.x-target.x)){camera.position.copy(position);controls.target.copy(target)}
   if(corte&&fit){camera.position.copy(position);controls.target.copy(target);camera.fov=fov;camera.updateProjectionMatrix();corte=false}
   if(abertura&&fit&&mode!=='free'){
    // espiral: começa a 210 m do centro, 95 m de altura, do lado oposto à TV, e gira ~200° até cair na posição da câmera de TV
    const k=MathUtils.clamp((now-abertura.ini)/abertura.dur,0,1),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2
    const fim=Math.atan2(position.z,position.x),raioFim=Math.hypot(position.x,position.z),ang=fim+(1-e)*Math.PI*1.12
    const raio=MathUtils.lerp(210,raioFim,e),alt=MathUtils.lerp(95,position.y,e)
    camera.position.set(Math.cos(ang)*raio,alt,Math.sin(ang)*raio);controls.target.lerpVectors(new Vector3(0,4,0),target,e)
    if(camera.fov!==MathUtils.lerp(52,fov,e)){camera.fov=MathUtils.lerp(52,fov,e);camera.updateProjectionMatrix()}
    camera.lookAt(controls.target);camera.updateMatrixWorld(true);moving=true
    if(k>=1){abertura=undefined;corte=false}
    return
   }
   const amount=1-Math.exp(-dt/MathUtils.lerp(.24,.03,edge));camera.position.lerp(position,amount);controls.target.lerp(target,amount)
   const nextFov=MathUtils.lerp(camera.fov,fov,1-Math.exp(-dt/.22))
   if(Math.abs(nextFov-camera.fov)>1e-7){camera.fov=nextFov;camera.updateProjectionMatrix()}
   // A resize can request a new fit in the same millisecond. Keep rendering
   // while distance is still expanding, or waiting to contract, even when the
   // camera has already reached that frame's intermediate position.
   moving=zoomPending||camera.position.distanceToSquared(position)>.0004||controls.target.distanceToSquared(target)>.0004||Math.abs(camera.fov-fov)>.02
   if(!moving){camera.position.copy(position);controls.target.copy(target);if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix()}if(returning)returning=false}
   camera.lookAt(controls.target);camera.updateMatrixWorld(true)
   const point=new Vector3(ball.x,ball.y,ball.z).project(camera);framing={x:point.x,y:point.y,visible:point.z>-1&&point.z<1&&Math.abs(point.x)<.96&&Math.abs(point.y)<.94}
  },
  get transitioning(){return returning||moving},
  inspect:()=>({mode,returning,moving,zoomPending,framing,distance,fixedZoom,fov:camera.fov,savedFreePosition:saved?.position.toArray(),savedFreeFov:saved?.fov,sameCamera:true,worldScaleUnchanged:true}),
 }
}
