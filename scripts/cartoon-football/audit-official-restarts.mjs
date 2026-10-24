// Inspect the already selected local career input. No new seed, round, save,
// event or result is generated or persisted. Rendering is not a rules engine.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {novoMotor2} from '../../src/escalacao/motor2/carreira.ts';
import {FutebolOficial3D} from '../../src/escalacao/presidencia-futebol-oficial.ts';

const input=JSON.parse(await readFile('test-results/animation-library/neymarzetti-current/football-input.json')).input;
const roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos}));
const state={officialInput:input,context:{id:'read-only-restart-audit',home:roster(input.casa),away:roster(input.fora)}};
const source=novoMotor2(structuredClone(input)),adapter=new FutebolOficial3D(input),clock=90/93,hz=60;
const last=new Map(),stops=[],reportedSpeedWithoutTravel=[],refereeAway=[];
let active=null,frame;
for(let i=0;i<=94*hz;i++){
 const time=i/hz;source.avancaAte(time/clock);frame=adapter.sample(state,time/clock);
 assert.deepEqual(frame.official.score,source.placar);assert.deepEqual(frame.official.events,source.eventos);
 const pa=source.parada,signature=pa?pa.tipo+':'+pa.desde:null;
 if(signature!==active?.signature){
  if(active){const release=source.bola.lance;active.end=time;active.release=release?.de.nome===active.taker?{time:release.t0,type:release.tipo,actor:release.de.nome}:null;stops.push(active);}
  active=pa?{signature,type:pa.tipo,side:pa.lado,start:time,sourceStartedAt:pa.desde,taker:pa.cobrador.nome,point:[pa.y-52.5,pa.x-34],frames:0,adapterPhase:frame.phase,takerRole:frame.players.find(p=>p.name===pa.cobrador.nome)?.tacticalRole}:null;
 }
 if(active){
  active.frames++;
  const visibleBall=frame.restart?.point??frame.ball.presentation??frame.ball,dx=visibleBall.x-frame.referee.x,dz=visibleBall.z-frame.referee.z,desired=Math.atan2(dx,dz);
  const error=Math.abs(Math.atan2(Math.sin(desired-frame.referee.heading),Math.cos(desired-frame.referee.heading)));
  if(error>Math.PI/2)refereeAway.push({time,type:pa.tipo,errorDegrees:error*180/Math.PI,distance:Math.hypot(dx,dz),refereeSpeed:frame.referee.speed});
 }
 for(let j=0;j<frame.players.length;j++){
  const p=frame.players[j],raw=source.atl[j],mix=(a,b)=>a===undefined?b:a+(b-a)*source.entre;
  assert.ok(Math.hypot(p.mx-(mix(raw.ay,raw.y)-52.5),p.mz-(mix(raw.ax,raw.x)-34))<1e-8,'Adapter must keep source coordinates');
  const before=last.get(p.key);
  if(before){const actualSpeed=Math.hypot(p.mx-before.mx,p.mz-before.mz)*hz;if(pa&&p.speed>1.2&&actualSpeed<.05)reportedSpeedWithoutTravel.push({time,type:pa.tipo,name:p.name,reportedSpeed:p.speed,actualSpeed,presentationSpeed:p.presentationSpeed??null});}
  last.set(p.key,p);
 }
}
if(active){active.end=94;stops.push(active);}
assert.deepEqual(frame.official.score,[1,1]);assert.equal(frame.official.events.length,82);
const events=frame.official.events;
const result={hz,stops,reportedSpeedWithoutTravel,refereeAway,eventCounts:Object.fromEntries([...new Set(events.map(e=>e.tipo))].map(type=>[type,events.filter(e=>e.tipo===type).length])),foulsAndAdvantages:events.filter(e=>e.tipo==='falta'||e.tipo==='vantagem'),final:{score:frame.official.score,events:events.length},sameOfficialInput:true,published:false,databaseWritten:false,interpretation:'Reported speed without movement is not proof of a running cycle: the renderer advances gait phase from distance. It can still select a frozen running pose/lean from the raw speed. Referee angle uses the actual restart/rendered ball point, not the raw interpolant at a reset. Restart distance/wall validity is NOT evaluated where no such restart occurred.'};
await mkdir('test-results/cartoon-football/futebol-completo',{recursive:true});
await writeFile('test-results/cartoon-football/futebol-completo/restart-audit.json',JSON.stringify(result,null,2));
console.log({stoppages:stops.length,types:stops.reduce((r,s)=>(r[s.type]=(r[s.type]??0)+1,r),{}),reportedSpeedWithoutTravel:reportedSpeedWithoutTravel.length,refereeAway:refereeAway.length,final:result.final});
