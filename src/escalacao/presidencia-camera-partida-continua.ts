import {MathUtils,Vector3,type PerspectiveCamera} from 'three'
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {enquadramentoFutebol,type AlvoCameraFutebol,type CameraFutebolPreset} from './presidencia-enquadramento-futebol'
export type CameraPartidaContinua='free'|CameraFutebolPreset
/** One camera in one world. This controller never receives the match engine. */
export function criarCameraPartidaContinua(camera:PerspectiveCamera,controls:OrbitControls,onMode:(mode:CameraPartidaContinua)=>void){
 let mode:CameraPartidaContinua='free',returning=false,last:number|undefined,moving=false
 let distance:number|undefined,zoomInSince:number|undefined,zoomPending=false
 let saved:{position:Vector3;target:Vector3;fov:number}|undefined,framing:{x:number;y:number;visible:boolean}|undefined
 let forcado:CameraPartidaContinua|undefined,distGuardada:number|undefined,corte=false
 const enterFree=(restore=true)=>{mode='free';returning=restore&&!!saved;moving=returning;last=undefined;distance=undefined;zoomInSince=undefined;zoomPending=false;onMode(mode)}
 return {
  setMode(next:CameraPartidaContinua){if(next===mode)return;if(next!=='free'){if(mode==='free'&&!returning)saved={position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};mode=next;returning=false;moving=true;last=undefined;distance=undefined;zoomInSince=undefined;onMode(mode)}else enterFree()},
  explore(){enterFree(false)},
  update(ball:{x:number;y:number;z:number;presentation?:{x:number;y:number;z:number}},now:number,subjects:readonly AlvoCameraFutebol[]=[],foco?:{x:number;y:number;z:number},forcar?:CameraPartidaContinua){
   ball=foco??ball.presentation??ball // (🤝 `foco`: depois do apito a TV segue os jogadores indo pro meio, não a bola parada)
   // Slow devices must consume real elapsed camera time instead of needing
   // dozens of rendered frames for a transition. This clock never drives play.
   const dt=last===undefined?1/60:MathUtils.clamp((now-last)/1000,0,.5);last=now
   zoomPending=false
   if(mode==='free'&&!returning){moving=false;return}
   // 🔁 replay do gol: o preset forçado ('Atrás do gol') entra e sai em CORTE seco; a distância do preset do usuário fica guardada
   if(forcar!==forcado){if(forcar){distGuardada=distance;distance=undefined}else distance=distGuardada;forcado=forcar;corte=true}
   const modo=forcado??mode
   const fit=modo!=='free'?enquadramentoFutebol(camera,ball,subjects,modo):null
   if(fit){
    if(distance===undefined||fit.preset==='goal'||fit.preset==='broadcast')distance=fit.distance // (📺 a TV fica parada na arquibancada: o zoom é a lente, não a distância)
    // Expand promptly for a receiver/high ball; close in only after a sustained
    // smaller play area. Crossing a neighbour-selection boundary cannot make
    // the lens pump in and out on every stride.
    if(fit.distance>distance+.02){distance=MathUtils.lerp(distance,fit.distance,1-Math.exp(-dt/.15));zoomInSince=undefined;zoomPending=fit.distance-distance>.02;if(!zoomPending)distance=fit.distance}
    else if(fit.distance>distance){distance=fit.distance;zoomInSince=undefined}
    else if(fit.distance<distance*.86){zoomInSince??=now;if(now-zoomInSince>550)distance=MathUtils.lerp(distance,fit.distance,1-Math.exp(-dt/1.1));zoomPending=fit.distance<distance*.86}
    else zoomInSince=undefined
   }
   const target=fit?.target??saved!.target,position=fit?target.clone().addScaledVector(fit.direction,distance!):saved!.position,fov=fit?.fov??saved!.fov
   camera.updateMatrixWorld(true)
   const before=new Vector3(ball.x,ball.y,ball.z).project(camera)
   const edge=fit&&!fit.tactical?MathUtils.smoothstep(Math.max(Math.abs(before.x),Math.abs(before.y)),.45,.9):0
   // A fast pass near the edge gets a quicker pan, rather than leaving the
   // screen while a fixed-duration cinematic easing catches up behind it.
   // 🥅 'Atrás do gol' trocou de lado (a bola cruzou o meio): CORTE seco, como na TV — nada de a câmera voar 140 m por cima do campo
   if(fit?.preset==='goal'&&Math.abs(camera.position.x)>30&&Math.sign(position.x)!==Math.sign(camera.position.x)){camera.position.copy(position);controls.target.copy(target)}
   if(corte&&fit){camera.position.copy(position);controls.target.copy(target);camera.fov=fov;camera.updateProjectionMatrix();corte=false}
   const amount=1-Math.exp(-dt/MathUtils.lerp(.24,.1,edge));camera.position.lerp(position,amount);controls.target.lerp(target,amount)
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
  inspect:()=>({mode,returning,moving,zoomPending,framing,distance,fov:camera.fov,savedFreePosition:saved?.position.toArray(),savedFreeFov:saved?.fov,sameCamera:true,worldScaleUnchanged:true}),
 }
}
