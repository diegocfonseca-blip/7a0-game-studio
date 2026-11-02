import * as T from 'three';
import {criarJogadorNovo} from './jogador-novo.mjs';
import {createMapRigSurface} from './motion/map-rig-surface.mjs';
import {MapFootPlant} from './motion/map-foot-plant.mjs';
import {solveLimbContact} from './motion/contact-ik.mjs';
import {gaitTime} from './motion/map-gait.mjs';
import {prepareRefereeCues,refereeCue,refereeWhistles} from './motion/map-referee-cues.mjs';

export function createMapReferee(scene,asset,gaits,agenda,timeline,{onWhistle}={}){
 const actor=criarJogadorNovo(asset,{tipo:'liso',corpo:'#00b9c7',detalhe:'#151515',gola:'#151515',calcao:'#151515',meiao:'#151515'});
 actor.holder.name='match-referee-avatar';scene.add(actor.holder);actor.bones=new Map();actor.root.traverse(o=>{if(o.isBone)actor.bones.set(o.name,o)});
 actor.surface=createMapRigSurface(actor);actor.grounding=new MapFootPlant();
 const cues=prepareRefereeCues(agenda),idle=actor.acao('idle'),run=actor.acao('trote');for(const a of [idle,run]){a.play();a.timeScale=0}
 const whistle=new T.Mesh(new T.BoxGeometry(.018,.014,.035),new T.MeshStandardMaterial({color:'#171717',roughness:.7}));whistle.name='referee-whistle';scene.add(whistle);
 let last=null,previous=null,phase=0,heading=0,inspection=null,source=null;
 function update(frame){
  const t=frame.time;if(t===last)return;const from=last;const dt=last!==null&&t>last&&t-last<.3?t-last:0,reset=!dt;last=t;
  for(const at of refereeWhistles(cues,from,t,frame.replay))onWhistle?.();
  const r=timeline.sample(t).referee??frame.referee;source=r;if(!r){actor.holder.visible=false;whistle.visible=false;return}
  actor.holder.visible=true;const cue=refereeCue(cues,t),distance=previous?Math.hypot(r.x-previous.x,r.z-previous.z):0;
  const speed=dt?Math.min(7,distance/dt):Math.min(7,r.speed??0),moving=T.MathUtils.smoothstep(speed,.2,1.1);const aim=speed>1.1&&previous&&distance>.001?Math.atan2(r.x-previous.x,r.z-previous.z):r.heading;heading+=dt?T.MathUtils.clamp(Math.atan2(Math.sin(aim-heading),Math.cos(aim-heading))*(1-Math.exp(-dt/.12)),-6*dt,6*dt):Math.atan2(Math.sin(aim-heading),Math.cos(aim-heading));previous={x:r.x,z:r.z};
  phase=(phase+(dt?speed/gaits.trote.distance*dt:0))%2;
  idle.time=t%idle.getClip().duration;idle.setEffectiveWeight(1-moving);run.time=gaitTime(gaits.trote,phase);run.setEffectiveWeight(moving);actor.mixer.update(0);
  actor.holder.position.set(r.x,0,r.z);actor.holder.rotation.set(0,heading,0);actor.holder.updateMatrixWorld(true);
  actor.holder.position.y=Math.max(0,Math.min(.08,.003-actor.surface.floor()));
  // Existing captures drive idle/run. Referee-specific captures are absent:
  // bounded arm IK supplies ONLY the whistle/point overlay on the original rig.
  if(cue){
   const head=actor.bones.get('mixamorigHead').getWorldPosition(new T.Vector3());
   if(cue.whistle>0){const target=head.clone().add(new T.Vector3(Math.sin(heading)*.15,-.03,Math.cos(heading)*.15));solveLimbContact(actor,['mixamorigRightArm','mixamorigRightForeArm','mixamorigRightHand'],target,{weight:cue.whistle,maxCorrection:.8,maxAngle:1.6})}
   if(cue.pointing>0){const target=new T.Vector3(r.x+Math.sin(cue.direction)*.65,1.12,r.z+Math.cos(cue.direction)*.65);solveLimbContact(actor,['mixamorigLeftArm','mixamorigLeftForeArm','mixamorigLeftHand'],target,{weight:cue.pointing,maxCorrection:.8,maxAngle:1.6})}
  }
  actor.plants=actor.grounding.apply(actor,t,{reset});actor.holder.updateMatrixWorld(true);
  const hand=actor.bones.get('mixamorigRightHand');whistle.visible=!!cue?.whistle;whistle.position.copy(hand.getWorldPosition(new T.Vector3()));whistle.quaternion.copy(hand.getWorldQuaternion(new T.Quaternion()));
  inspection={visible:true,position:actor.holder.position.toArray(),heading,cue,gestureSource:'imported-locomotion-with-provisional-arm-IK'};
 }
 return{actor,update,frame:original=>({...original,...source}),cueAt:t=>refereeCue(cues,t),inspect:()=>inspection,dispose(){actor.dispose();whistle.removeFromParent();whistle.geometry.dispose();whistle.material.dispose()}};
}
