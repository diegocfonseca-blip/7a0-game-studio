import {MathUtils,Vector3,type PerspectiveCamera} from 'three'
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js'

export type CameraPartidaContinua='free'|'broadcast'
/** One camera in one world. This controller never receives the match engine. */
export function criarCameraPartidaContinua(camera:PerspectiveCamera,controls:OrbitControls,onMode:(mode:CameraPartidaContinua)=>void){
 let mode:CameraPartidaContinua='free',returning=false,last:number|undefined,moving=false
 let saved:{position:Vector3;target:Vector3}|undefined
 const enterFree=(restore=true)=>{
  mode='free';returning=restore&&!!saved;moving=returning;last=undefined;onMode(mode)
 }
 return {
  setMode(next:CameraPartidaContinua){
   if(next===mode)return
   if(next==='broadcast'){saved={position:camera.position.clone(),target:controls.target.clone()};mode=next;returning=false;moving=true;last=undefined;onMode(mode)}
   else enterFree()
  },
  explore(){enterFree(false)},
  update(ball:{x:number;y:number;z:number},now:number){
   const dt=last===undefined?1/60:MathUtils.clamp((now-last)/1000,0,.1);last=now
   if(mode==='free'&&!returning){moving=false;return}
   const target=mode==='broadcast'?new Vector3(MathUtils.clamp(ball.x,-45,45),.6,MathUtils.clamp(ball.z,-27,27)):saved!.target
   const distance=Math.max(29,19/Math.max(.35,camera.aspect))
   const position=mode==='broadcast'?target.clone().add(new Vector3(0,distance*.8,distance)):saved!.position
   moving=camera.position.distanceToSquared(position)>.0001||controls.target.distanceToSquared(target)>.0001
   const amount=1-Math.exp(-dt/.25)
   camera.position.lerp(position,amount);controls.target.lerp(target,amount)
   camera.lookAt(controls.target);camera.updateMatrixWorld(true)
   if(returning&&camera.position.distanceToSquared(position)<.0001&&controls.target.distanceToSquared(target)<.0001){camera.position.copy(position);controls.target.copy(target);returning=false;moving=false}
  },
  get transitioning(){return returning||moving},
  inspect:()=>({mode,returning,savedFreePosition:saved?.position.toArray(),sameCamera:true,worldScaleUnchanged:true}),
 }
}
