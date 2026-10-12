import assert from 'node:assert/strict'
// Reuse the offline TS/auth hooks; also verifies all construction combinations.
await import('./testa-presidencia-evolucao.mjs')
const {atoresDoMapa,ROTAS_ESTADIO,quadroAtor,raioCorpoAtor}=await import('../src/escalacao/presidencia-estadio-mapa-model.ts')
const {obstaculosDoEstadio,segmentoLivre}=await import('../src/escalacao/presidencia-estadio-navegacao.ts')
const full={grama:30,geral:40,cadeiras:90,visitante:120,camarote:150}
const stages=[{inv:{},ext:[]},{inv:{grama:10},ext:[]},{inv:full,ext:['hotel']},{inv:full,ext:['hotel','asfalto']},{inv:full,ext:['asfalto','hotel','loja','chopp','praca','estacao','estac']}]
for(const stage of stages){
 const obstacles=obstaculosDoEstadio(stage),actors=atoresDoMapa(stage)
 for(const actor of actors)for(let t=0;t<=600;t+=.2){
  const p=quadroAtor(actor,t)
  assert.ok(segmentoLivre(p,p,obstacles,raioCorpoAtor(actor)),`${actor.id} intersects a registered obstacle at ${t}`)
 }
 for(const actor of actors)if(actor.path)assert.deepEqual(actor.path.points.at(-1),ROTAS_ESTADIO[actor.route].points.at(-1),`${actor.id} must reach its destination instead of stopping at an obstacle`)
 const hotel=actors.find(a=>a.id==='visitor-hotel')
 if(hotel)assert.deepEqual(hotel.path.points.at(-1),ROTAS_ESTADIO.hotel.points.at(-1),'The detour reaches the hotel rather than stopping at the planter')
}
const obstacles=obstaculosDoEstadio(stages.at(-1))
assert.equal(segmentoLivre({x:468,y:588},{x:460,y:557},obstacles,2),false,'Regression: the previous route crossed the raised palm planter')
assert.equal(segmentoLivre({x:1240,y:766},{x:1240,y:766},obstacles,2),false,'East sidewalk flower border is not walkable')
assert.equal(obstaculosDoEstadio({inv:{},ext:[]}).some(o=>o.id==='canteiro-calcada-leste'),false,'Unpaved land does not inherit the paved flower border')
console.log('PASS: exterior circulation over ten minutes in five stages, new palm obstacle, safe hotel detour and destination preserved.')
