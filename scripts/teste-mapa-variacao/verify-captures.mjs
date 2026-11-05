import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(process.argv[2]??'/tmp/leilao-mapa-variacao/validacao-pontos.json','utf8'));
assert.deepEqual(data.errors,[]);
const pubs=data.samples[0].botecos.pubs;let checks=0,clearance=Infinity;
for(const sample of data.samples){
 assert.equal(sample.residents.count,20);
 for(const actor of sample.residents.actors){
  assert.ok(actor.position.every(Number.isFinite));assert.notEqual(actor.supported,false);
  if(actor.purpose!=='encontro')continue;
  const [x,,z]=actor.position;
  // Conferência independente das mesas/cadeiras desenhadas por criarBotecoBairro.
  for(const pub of pubs)for(const row of [7.2,9.8,12.4])for(const col of [-2.4,2.4]){
   const d=Math.hypot(Math.max(Math.abs(x-pub.position[0]-col)-1.3,0),Math.max(Math.abs(z-pub.position[2]-row)-.5,0));
   assert.ok(d>=.679,`${sample.name}: ${actor.id} atravessa o mobiliário`);clearance=Math.min(clearance,d);
  }
  checks++;
 }
}
assert.equal(data.samples.find(s=>s.name==='depois-dia-de-jogo').matchday.active,true);
console.log(JSON.stringify({ok:true,samples:data.samples.length,furnitureChecks:checks,minClearance:clearance}));
