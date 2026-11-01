import {AnimationClip,QuaternionKeyframeTrack,Quaternion,AdditiveAnimationBlendMode} from 'three';

/** Captured torso motion only. The additive clip has NO hips, legs, feet,
 * arms, scale or position channels. It cannot replace the locomotion/contact
 * poses or change the supplied rig. Reference pose comes from the same clip. */
export function capturedBodyFeint(base,{begin=1.1,peak=1.7083,end=2.1}={}){
 if(!base||!(begin<peak&&peak<end&&end<=base.duration))throw Error('Invalid captured body-feint window');
 const count=Math.ceil((end-begin)*60)+1,times=Float32Array.from({length:count},(_,i)=>(end-begin)*i/(count-1));
 const tracks=base.tracks.filter(t=>/^mixamorigSpine[12]?\.quaternion$/.test(t.name)).map(track=>{
  const interpolate=track.createInterpolant(),reference=new Quaternion().fromArray(interpolate.evaluate(begin)).invert(),values=new Float32Array(count*4);let previous=null;
  for(let i=0;i<count;i++){
   const q=reference.clone().multiply(new Quaternion().fromArray(interpolate.evaluate(begin+times[i]))).normalize();
   if(previous&&previous.dot(q)<0)q.set(-q.x,-q.y,-q.z,-q.w);q.toArray(values,i*4);previous=q;
  }
  return new QuaternionKeyframeTrack(track.name,times,values);
 });
 if(!tracks.length)throw Error('Captured torso tracks absent');
 const clip=new AnimationClip('finta_corpo',end-begin,tracks,AdditiveAnimationBlendMode);
 clip.userData={capturedTorso:{source:base.name,begin,peak,end,peakTime:peak-begin,scope:'torso-only-additive'}};
 return clip;
}
