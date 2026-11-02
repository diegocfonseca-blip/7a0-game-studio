import * as THREE from 'three'
export type FootballPresentationActor={holder:THREE.Group;root:THREE.Object3D;mesh:THREE.SkinnedMesh;mixer:THREE.AnimationMixer;acao:(name:string)=>THREE.AnimationAction|null;dispose:()=>void;updateFrustumBounds:()=>void}
/** Hold an actual double-support frame from the model's native walking capture.
 * The source labelled idle is an offensive football move (3.44m displacement),
 * so looping it while waiting makes the pregame line hop and spread its arms.
 * This local, static fallback does not edit the shared rig or football clips. */
export function capturedStandingPose(actor:FootballPresentationActor){
 const action=actor.acao('caminhada')!;action.play();action.timeScale=0;action.setEffectiveWeight(1)
 const left=actor.root.getObjectByName('mixamorigLeftFoot')!,right=actor.root.getObjectByName('mixamorigRightFoot')!,lh=actor.root.getObjectByName('mixamorigLeftHand')!,rh=actor.root.getObjectByName('mixamorigRightHand')!,hip=actor.root.getObjectByName('mixamorigHips')!
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),d=new THREE.Vector3(),h=new THREE.Vector3()
 let best=Infinity,bestTime=0;const clip=action.getClip()
 for(let i=0;i<40;i++){const t=clip.duration*i/40;action.time=t;actor.mixer.update(0);actor.holder.updateMatrixWorld(true);left.getWorldPosition(a);right.getWorldPosition(b);lh.getWorldPosition(c);rh.getWorldPosition(d);hip.getWorldPosition(h)
  const score=Math.abs(a.y-b.y)*4+Math.abs(a.z-b.z)*.8+Math.max(0,c.y-h.y-.25)+Math.max(0,d.y-h.y-.25)
  if(score<best){best=score;bestTime=t}
 }
 action.stop()
 const tracks=clip.tracks.map(track=>{const count=track.getValueSize(),interpolant=track.ValueTypeName==='quaternion'?new THREE.QuaternionLinearInterpolant(track.times,track.values,count):new THREE.LinearInterpolant(track.times,track.values,count),sample=interpolant.evaluate(bestTime),values=new Float32Array(count*2);values.set(sample);values.set(sample,count);const copy=track.clone();copy.times=new Float32Array([0,1]);copy.values=values;return copy})
 return new THREE.AnimationClip('arrival-standing-captured',1,tracks)
}
