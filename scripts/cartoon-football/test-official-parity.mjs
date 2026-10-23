import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {novoMotor2} from '../../src/escalacao/motor2/carreira.ts';
import {FutebolOficial3D} from '../../src/escalacao/presidencia-futebol-oficial.ts';
const timeline=JSON.parse(await readFile('test-results/animation-library/neymarzetti-current/football-timeline.json')),input=timeline.input,game=novoMotor2(structuredClone(input)),adapter=new FutebolOficial3D(input),roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos})),state={context:{id:'parity',home:roster(input.casa),away:roster(input.fora)},officialInput:input};
let positions=0,offBall=0,maxError=0;const phases=new Set(),roles=new Set();let frame;
for(let i=0;i<=940;i++){
 const seconds=i/10,minute=seconds/(90/93);game.avancaAte(minute);frame=adapter.sample(state,minute);assert.equal(frame.players.length,22);assert.deepEqual(frame.official.score,game.placar);assert.deepEqual(frame.official.events,game.eventos);phases.add(frame.phase);
 for(let j=0;j<22;j++){
  const p=game.atl[j],q=frame.players[j],mix=(a,b)=>a===undefined?b:a+(b-a)*game.entre,x=mix(p.ay,p.y)-52.5,z=mix(p.ax,p.x)-34;
  maxError=Math.max(maxError,Math.hypot(q.mx-x,q.mz-z));assert.equal(q.keeper,p.grupo==='GOL');assert.equal(q.tacticalRole,p.papel);assert.equal(q.visible,!p.expulso);roles.add(q.tacticalRole);positions++;if(p!==game.bola.dono)offBall++;
 }
}
assert.ok(maxError<1e-9);assert.deepEqual(JSON.parse(JSON.stringify(frame.official.events)),timeline.events);assert.deepEqual(frame.official.score,timeline.finalScore);
const result={frames:941,positions,offBall,maxError,phases:[...phases],roles:[...roles],score:frame.official.score,events:frame.official.events.length,goals:frame.official.events.filter(e=>e.tipo==='gol'),source:'Independent Motor2 run compared to 3D adapter; positions, roles and events, not a visual quality approval',databaseWritten:false};await mkdir('test-results/cartoon-football',{recursive:true});await writeFile('test-results/cartoon-football/official-parity.json',JSON.stringify(result,null,2));console.log(result);
