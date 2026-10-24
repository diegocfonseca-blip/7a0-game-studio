import{readFile,writeFile,mkdir}from'node:fs/promises';import * as T from'three';import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import{createCartoonPlayer}from'../../src/escalacao/futebol3d/cartoon/player.mjs';
import{bindCapturedMotion}from'../../src/escalacao/futebol3d/reviewed-motion.mjs';
import{buildContactBank,fitBankContact}from'../../src/escalacao/futebol3d/motion/contact-bank.mjs';
import{collectOfficialContacts}from'../../src/escalacao/futebol3d/motion/official-contact-source.mjs';
import{sampleSharedStrike,measureSharedImpact}from'../../src/escalacao/futebol3d/motion/shared-strike.mjs';
const load=async p=>JSON.parse(await readFile(p)),b=await readFile('src/escalacao/cidade3d/assets/Casual_Male.glb'),gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''),data=await load('src/escalacao/futebol3d/cartoon/clips.json'),clips=new Map(Object.entries(data.clips).map(([n,c])=>[n,T.AnimationClip.parse(c)])),templateSource=await load('src/escalacao/futebol3d/assets/template-lite.json'),actor=await createCartoonPlayer({gltf,clips},null,{offline:true,templateSource}),pack=await load('src/escalacao/futebol3d/cartoon/motion.json'),binding=bindCapturedMotion(actor,{...pack,clips}),fixture=await load('test-results/animation-library/neymarzetti-current/football-input.json');
actor.intentAxis=new T.Vector3(0,0,1).applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion()).invert());
let started=performance.now();const bank=buildContactBank(actor,pack.plans);console.log('bank',{entries:bank.length,triangles:bank[0].feet.left.length,ms:performance.now()-started});
const reports=[];
for(const seedOffset of (process.env.FIT_SEEDS??'0,1,29').split(',').map(Number)){
 const input=structuredClone(fixture.input);input.seed+=seedOffset;const roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos})),state={officialInput:input,context:{id:'readonly-fit-'+input.seed,home:roster(input.casa),away:roster(input.fora)}};
 started=performance.now();const source=await collectOfficialContacts(input,state);console.log('source',{seedOffset,contacts:source.contacts.length,score:source.official.score,ms:performance.now()-started});const plans=[],rejected=[],checks=[];started=performance.now();
 for(const c of source.contacts){const plan=fitBankContact(c,bank);if(!plan){rejected.push({time:c.time,name:c.player.name,type:c.type,required:c.requiredContact});continue;}
  const timeline={sample(t){const delta=t-c.time,p={...c.player,mx:c.player.mx+c.playerVelocity[0]*delta,mz:c.player.mz+c.playerVelocity[2]*delta};p.position={x:p.mx,y:0,z:p.mz};return{time:t,players:[p],ball:t<c.time?c.beforeBall:c.ball}}};
  const s=sampleSharedStrike(actor,timeline,plan,plan.time),impact=measureSharedImpact(actor,timeline,plan),f=actor.intentAxis.clone().applyQuaternion(actor.bones.get('spine_03').getWorldQuaternion(new T.Quaternion())),body=Math.atan2(f.x,f.z),bodyError=Math.abs(Math.atan2(Math.sin(plan.intentHeading-body),Math.cos(plan.intentHeading-body)));
  checks.push({time:c.time,type:c.type,name:c.player.name,gap:s.contactGap,otherGap:plan.foot==='left'?s.rightGap:s.leftGap,floor:s.minFloor,bodyError:bodyError*180/Math.PI,ankle:s.maxAnkleCorrection,impact});plans.push(plan);
 }
 console.log('fits',{seedOffset,plans:plans.length,rejected:rejected.length,ms:performance.now()-started,bad:checks.filter(c=>Math.abs(c.gap)>.002||c.otherGap<0||c.floor<-.003||c.impact.relativeClosing<=.15).map(c=>({name:c.name,time:c.time,gap:c.gap,impact:c.impact}))});reports.push({seedOffset,seed:input.seed,plans,rejected,checks,official:source.official});
}
await mkdir('test-results/cartoon-football/generalizacao',{recursive:true});await writeFile('test-results/cartoon-football/generalizacao/fits.json',JSON.stringify(reports,null,2));binding.surface.dispose();
