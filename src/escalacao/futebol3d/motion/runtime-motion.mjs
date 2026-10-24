import * as T from 'three';
import {createCartoonPlayer} from '../cartoon/player.mjs';
import {bindCapturedMotion} from '../reviewed-motion.mjs';
import {sampleSharedStrike} from './shared-strike.mjs';
import {buildContactBank,fitBankContactAsync} from './contact-bank.mjs';
import {collectOfficialContacts} from './official-contact-source.mjs';

const pending=new Map(),banks=new WeakMap(),canonical=o=>Array.isArray(o)?o.map(canonical):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().map(k=>[k,canonical(o[k])])):o;
let yieldChannel;const yieldQueue=[];
const yieldTask=()=>{
 if(globalThis.scheduler?.yield)return globalThis.scheduler.yield();
 if(typeof MessageChannel==='undefined')return new Promise(r=>setTimeout(r,0));
 if(!yieldChannel){yieldChannel=new MessageChannel();yieldChannel.port1.onmessage=()=>yieldQueue.shift()?.();}
 return new Promise(r=>{yieldQueue.push(r);yieldChannel.port2.postMessage(0)});
};
function reset(actor,p){actor.mixer.stopAllAction();for(const r of actor.reference){r.node.position.copy(r.p);r.node.quaternion.copy(r.q);r.node.scale.copy(r.s)}actor.actions.get('Idle_Loop').reset().play();actor.mixer.update(0);actor.holder.position.set(p?.mx??0,0,p?.mz??0);actor.holder.rotation.y=p?.heading??0;actor.holder.updateMatrixWorld(true);if(p){const hip=actor.pelvis.getWorldPosition(new T.Vector3());actor.holder.position.x+=p.mx-hip.x;actor.holder.position.z+=p.mz-hip.z;actor.holder.updateMatrixWorld(true);}actor.ground();}
export function contactTimeline(contact){return{sample(time){
 const rows=contact.window;let index=rows.findIndex(f=>f.time>=time-1e-8);if(index<0)index=rows.length-1;
 const b=rows[index],a=rows[Math.max(0,index-1)],u=b.time>a.time?T.MathUtils.clamp((time-a.time)/(b.time-a.time),0,1):0,pa=a.players.find(p=>p.key===contact.key)??contact.player,pb=b.players.find(p=>p.key===contact.key)??pa,mix=(a,b)=>a+(b-a)*u;
 const p={...(u>1-1e-6?pb:pa),mx:mix(pa.mx,pb.mx),mz:mix(pa.mz,pb.mz)};p.position={x:p.mx,y:0,z:p.mz};
 return{time,players:[p],ball:{x:mix(a.ball.x,b.ball.x),y:mix(a.ball.y,b.ball.y),z:mix(a.ball.z,b.ball.z)}};
}};}

/** Validate contact AND approach/follow-through against the canonical local
 * trajectory. A contact point alone is insufficient to approve a capture. */
function* validateContactSteps(actor,contact,plan){
 const timeline=contactTimeline(contact),samples=[plan.start,plan.poseStart??plan.start,plan.time-.24,plan.time-.16,plan.time-.08,plan.time,plan.time+.04,plan.time+.12,plan.time+.24,plan.end];let contactGap;
 for(const time of samples){reset(actor,timeline.sample(time).players[0]);const s=sampleSharedStrike(actor,timeline,plan,time);if(Math.min(s.leftGap,s.rightGap)<-.003||s.minFloor<-.003||s.pelvisError>.60001)return{valid:false,reason:'transition-clearance',time,gap:Math.min(s.leftGap,s.rightGap),floor:s.minFloor};if(time===plan.time)contactGap=s.contactGap;yield;}
 if(Math.abs(contactGap)>.002)return{valid:false,reason:'contact-gap',gap:contactGap};
 return{valid:true,contactGap,sampledTransitions:samples.length};
}
export function validateContactPlan(actor,contact,plan){const steps=validateContactSteps(actor,contact,plan);let result;do{result=steps.next()}while(!result.done);return result.value;}
async function validateContactAsync(actor,contact,plan,yieldTask){const steps=validateContactSteps(actor,contact,plan);let result,start=performance.now();do{result=steps.next();if(!result.done&&performance.now()-start>8){await yieldTask();start=performance.now();}}while(!result.done);return result.value;}

/** Per-input preparation using the existing official engine, acquired clips
 * and original rig. Shared once by all 22 players, cached for four replays.
 * It emits presentation plans only; never a score, possession or trajectory. */
export async function prepareRuntimeMotion(civil,library,input,state,{offline=false,templateSource=null,yieldPreparation=yieldTask,reviewedCompatible=false,reservedActions=[]}={}){
 if(!Number.isFinite(input?.seed))throw Error('Replay sem semente oficial');
 const bytes=new TextEncoder().encode(JSON.stringify(canonical(input))),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join(''),engine=typeof __LEILAO_3D_ENGINE_SHA256__==='string'?__LEILAO_3D_ENGINE_SHA256__:'node-offline',key=engine+':'+hash;
 if(pending.has(key))return pending.get(key);
 const task=(async()=>{
  const started=performance.now(),actor=await createCartoonPlayer(civil,null,{offline,templateSource,number:0}),clips=new Map([...civil.clips].filter(([n])=>!n.endsWith('_Loop'))),binding=bindCapturedMotion(actor,{clips});
  actor.intentAxis=new T.Vector3(0,0,1).applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion()).invert());
  try{
   let bank=banks.get(civil.gltf);if(!bank){bank=buildContactBank(actor,library.plans);banks.set(civil.gltf,bank);}
   await yieldPreparation();const source=await collectOfficialContacts(input,state,{yieldTask:yieldPreparation}),plans=[],rejected=[];
   for(const contact of source.contacts){
    // A validated catch/throw owns its whole window. An official generic
    // "pass" event during it must not add a second, competing foot strike.
    if(reservedActions.some(p=>p.key===contact.key&&contact.time>=p.start&&contact.time<=p.end)){const direction=new T.Vector3().fromArray(contact.delivery?.velocity??[Math.sin(contact.player.heading),0,Math.cos(contact.player.heading)]).setY(0).normalize();rejected.push({id:contact.id,key:contact.key,name:contact.player.name,type:contact.type,time:contact.time,start:contact.time-.3,end:contact.time+.3,requiredContact:'hands',direction:direction.toArray(),intentHeading:Math.atan2(direction.x,direction.z),delivery:contact.delivery,reason:'handled-by-reviewed-keeper-capture'});continue;}
    const candidates=await fitBankContactAsync(contact,bank,{maxCandidates:4},yieldPreparation)??[];let accepted;
    for(const candidate of candidates){const check=await validateContactAsync(actor,contact,candidate,yieldPreparation);if(check.valid){accepted={...candidate,transitionCheck:check};break;}}
    // Retain a previously measured capture for this exact input when the
    // generic bank cannot fit it. Never regress a reviewed shot to running,
    // and never reuse its marker for a different player, replay or event.
    if(!accepted&&reviewedCompatible&&library.inputSHA256===hash){const reviewed=library.plans.find(p=>p.key===contact.key&&p.type===contact.type&&Math.abs(p.time-contact.time)<1e-6);if(reviewed){const check=await validateContactAsync(actor,contact,reviewed,yieldPreparation);if(check.valid)accepted={...reviewed,transitionCheck:check,preservedReviewedCapture:true};}}
    if(accepted)plans.push(accepted);else{const velocity=contact.delivery?.velocity??[Math.sin(contact.player.heading),0,Math.cos(contact.player.heading)],horizontal=new T.Vector3().fromArray(velocity).setY(0).normalize();rejected.push({id:contact.id,key:contact.key,name:contact.player.name,type:contact.type,time:contact.time,start:contact.time-.65,end:contact.time+.38,requiredContact:contact.requiredContact,direction:horizontal.toArray(),intentHeading:Math.atan2(horizontal.x,horizontal.z),delivery:contact.delivery,reason:contact.requiredContact==='foot'?'no-safe-capture-fit':'capture-for-'+contact.requiredContact+'-unavailable'});}
    await yieldPreparation();
   }
   return{schema:'leilao-legends-runtime-contact-plans/v1',inputSHA256:hash,engineSHA256:engine,plans,rejected,releaseTimes:source.releaseTimes,gait:library.gait,clips,preparedFromOfficialSource:true,sourceOfficial:source.official,preparationMs:performance.now()-started,bankEntries:bank.length,provisional:true};
  }finally{binding.surface.dispose();actor.kit.dispose();actor.mixer.stopAllAction();actor.mixer.uncacheRoot(actor.root);for(const mesh of actor.meshes)mesh.skeleton.dispose();}
 })();pending.set(key,task);while(pending.size>4)pending.delete(pending.keys().next().value);
 try{return await task}catch(error){pending.delete(key);throw error;}
}
