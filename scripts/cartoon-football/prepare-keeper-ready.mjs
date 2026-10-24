import {readFile,writeFile} from 'node:fs/promises';
import * as T from 'three';
// Reuse the already-retargeted Quaternius CC0 crouch idle. It is a
// provisional ready stance, not a newly acquired goalkeeper save capture.
const source=JSON.parse(await readFile('src/escalacao/futebol3d/cartoon/keeper.json')),clip=T.AnimationClip.parse(source.clips.KeeperReady_Loop),hz=12;
const tracks=clip.tracks.map(track=>{const sampler=track.createInterpolant(),size=track.getValueSize(),times=[],values=[];for(let i=0;i<=Math.ceil(clip.duration*hz);i++){const t=Math.min(i/hz,clip.duration);times.push(t);values.push(...Array.from(sampler.evaluate(t)).slice(0,size));}const out=track.clone();out.times=new Float32Array(times);out.values=new Float32Array(values);return out;});
const compact=new T.AnimationClip('KeeperReady_Loop',clip.duration,tracks);let maxAngle=0;
for(let i=0;i<tracks.length;i++)if(tracks[i].getValueSize()===4){const a=clip.tracks[i].createInterpolant(),b=tracks[i].createInterpolant();for(let t=0;t<clip.duration;t+=1/120)maxAngle=Math.max(maxAngle,new T.Quaternion().fromArray(a.evaluate(t)).normalize().angleTo(new T.Quaternion().fromArray(b.evaluate(t)).normalize()));}
const data={source:source.source.ready,sourceSHA256:source.source.readySourceSHA256,license:'CC0-1.0, Quaternius Universal Animation Library; see ../LICENSES.md',provisionalGoalkeeperStance:true,resampling:{hz,duration:clip.duration,maximumQuaternionErrorDegrees:maxAngle*180/Math.PI},clip:T.AnimationClip.toJSON(compact)};
await writeFile('src/escalacao/futebol3d/cartoon/keeper-ready.json',JSON.stringify(data));console.log({bytes:JSON.stringify(data).length,maxErrorDegrees:data.resampling.maximumQuaternionErrorDegrees});
