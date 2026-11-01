import {AnimationClip, QuaternionKeyframeTrack} from 'three';

// Reuse compatible captured arm motion on this SAME rig. Some previously
// imported UE5 clips have crossed upper arms; do not repair that by changing
// bind poses, weights, geometry, leg motion or the calibrated contact frame.
const armTrack=/^mixamorig(?:Left|Right)(?:Shoulder|Arm|ForeArm|Hand\w*)\.quaternion$/;
export function capturedArmLayer(base,donor,{contact,donorContact,rate=1}){
 if(!base||!donor||![contact,donorContact,rate].every(Number.isFinite)||rate<=0)throw Error('Invalid captured arm layer');
 const donors=new Map(donor.tracks.filter(t=>armTrack.test(t.name)).map(t=>[t.name,t]));
 const tracks=base.tracks.map(track=>{
  const source=donors.get(track.name);
  if(!armTrack.test(track.name)||!source)return track;
  const interpolant=source.createInterpolant(),times=track.times.slice(),values=new Float32Array(times.length*4);
  for(let i=0;i<times.length;i++){
   const t=Math.max(0,Math.min(donor.duration,donorContact+(times[i]-contact)*rate));
   values.set(interpolant.evaluate(t),i*4);
  }
  return new QuaternionKeyframeTrack(track.name,times,values);
 });
 const clip=new AnimationClip(base.name,base.duration,tracks,base.blendMode);
 clip.userData={...base.userData,capturedArms:{clip:donor.name,contact,donorContact,rate}};
 return clip;
}
