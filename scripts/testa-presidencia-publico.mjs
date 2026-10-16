import assert from 'node:assert/strict'
await import('./testa-presidencia-evolucao.mjs')
const {publicoDoEstadio}=await import('../src/escalacao/presidencia-estadio-publico.ts')
const {torcidaDoEstadio}=await import('../src/escalacao/loja.ts')
const {atoresDoMapa,quadroAtor,raioCorpoAtor}=await import('../src/escalacao/presidencia-estadio-mapa-model.ts')
const {obstaculosDoEstadio,segmentoLivre}=await import('../src/escalacao/presidencia-estadio-navegacao.ts')
const empty={inv:{},ext:[]},full={inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['asfalto','hotel','loja','chopp','praca','estacao','estac']}
for(const st of [empty,full])for(const division of ['V','D','C','B','A'])for(const support of [0,50,100]){
 const before=JSON.stringify(st),quiet=publicoDoEstadio(st,{division,support}),game=publicoDoEstadio(st,{division,support,match:'playing'})
 assert.equal(game.supporters,torcidaDoEstadio(st,division))
 assert.ok(game.outside>=quiet.outside&&game.cars>=quiet.cars)
 assert.equal(quiet.inside,0)
 assert.ok(game.outside<=6&&game.inside<=6&&game.cars<=4)
 if(st===empty)assert.equal(game.inside,0)
 assert.equal(JSON.stringify(st),before)
 const actors=atoresDoMapa(st,{division,support,match:'playing'}),obstacles=obstaculosDoEstadio(st)
 for(const actor of actors)for(let t=0;t<600;t+=.5){const p=quadroAtor(actor,t);const permitted=actor.portal&&p.visit!=='walking'?obstacles.filter(o=>o.id!==actor.portal.id):obstacles;assert.ok(segmentoLivre(p,p,permitted,raioCorpoAtor(actor)),actor.id+' crossed obstacle')}
}
assert.equal(publicoDoEstadio(empty,{support:80,rain:true}).attendance,48)
assert.equal(publicoDoEstadio(full,{support:80,rain:true}).attendance,88)
assert.equal(publicoDoEstadio(full,{division:'A',support:NaN}).attendance,58)
console.log('PASS: existing fanbase, weather/attendance, match vs idle, bounded sample, no save changes, all actor paths remain outside obstacles.')

const {PORTA_LOJA,PORTA_HOTEL,PORTA_BAR,portaAcessivel,visitaNaPorta}=await import('../src/escalacao/presidencia-estadio-portas.ts')
for(const portal of [PORTA_LOJA,PORTA_HOTEL,PORTA_BAR]){
 const obstacles=obstaculosDoEstadio(full)
 assert.equal(portaAcessivel(portal,portal.approach,obstacles,2.5),true)
 assert.equal(portaAcessivel(portal,{x:portal.approach.x-5,y:portal.approach.y},obstacles,2.5),false,'A route stopped short cannot teleport to the entrance')
 const {x,y}=portal.threshold,block={id:'temporary-work',polygon:[{x:x-1,y:y-1},{x:x+1,y:y-1},{x:x+1,y:y+1},{x:x-1,y:y+1}]}
 assert.equal(portaAcessivel(portal,portal.approach,[...obstacles,block],2.5),false,'The destination wall exception cannot bypass another obstacle')
}
const speed=4.55,total=visitaNaPorta(PORTA_LOJA,0,speed).total
assert.deepEqual([visitaNaPorta(PORTA_LOJA,0,speed).x,visitaNaPorta(PORTA_LOJA,0,speed).y],[1222,448])
assert.equal(visitaNaPorta(PORTA_LOJA,total/2,speed).hiddenFraction,1)
assert.equal(visitaNaPorta(PORTA_LOJA,total/2,speed).walking,false)
assert.equal(visitaNaPorta(PORTA_LOJA,total,speed).hiddenFraction,0)
const visitor=atoresDoMapa(full,{division:'A'}).find(a=>a.id==='visitor-loja')
let previous=quadroAtor(visitor,0),sawInside=false,sawExit=false
for(let t=.05;t<120;t+=.05){const p=quadroAtor(visitor,t);assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<.3,'No teleport at door or return');sawInside||=p.visit==='inside';sawExit||=p.visit==='leaving';previous=p}
assert.ok(sawInside&&sawExit)
assert.ok(!atoresDoMapa(empty,{division:'A'}).some(a=>a.portal),'No shop portal before purchase')
console.log('PASS: registered shop portal, interior dwell, occlusion and continuous return; no portal before shop purchase.')

for(const id of ['visitor-loja','visitor-hotel','visitor-chopp']){
 const actor=atoresDoMapa(full,{division:'A',match:'playing'}).find(a=>a.id===id)
 let last=quadroAtor(actor,0),inside=false,leaving=false
 for(let t=.05;t<180;t+=.05){
  const p=quadroAtor(actor,t)
  assert.ok(Math.hypot(p.x-last.x,p.y-last.y)<.3,id+' cannot teleport at the portal')
  inside||=p.visit==='inside';leaving||=p.visit==='leaving'
  if(p.visit==='inside')assert.equal(p.hiddenFraction,1)
  last=p
 }
 assert.ok(inside&&leaving,id+' must finish the visit and leave')
 const without={...full,ext:full.ext.filter(k=>k!==actor.portal.id)}
 assert.ok(!atoresDoMapa(without,{division:'A'}).some(a=>a.id===id),'No visitor before purchase')
}
console.log('PASS: shop, hotel and bar have continuous arrival, occluded interior and return; absent before purchase.')

// Entrances must remain reachable through independent purchases and partial works.
const businesses=['hotel','loja','chopp','praca','estacao','estac','asfalto']
const stages=[{}, {grama:10,geral:20}, {grama:30,geral:40,cadeiras:90,visitante:120}, {...full.inv,camarote:50}, full.inv]
let combinations=0
for(const inv of stages)for(let mask=0;mask<1<<businesses.length;mask++){
 const stadium={inv,ext:businesses.filter((_,i)=>mask&(1<<i))},obstacles=obstaculosDoEstadio(stadium)
 const actors=atoresDoMapa(stadium,{division:'A',support:100,match:'playing'})
 for(const id of ['hotel','loja','chopp']){
  const a=actors.find(a=>a.id==='visitor-'+id)
  if(!stadium.ext.includes(id)){assert.equal(a,undefined);continue}
  assert.ok(a?.portal,`${id} entrance inaccessible in construction/purchase combination ${combinations}`)
  assert.deepEqual(a.path.points.at(-1),a.portal.approach)
  assert.ok(portaAcessivel(a.portal,a.path.points.at(-1),obstacles,raioCorpoAtor(a)))
 }
 combinations++
}
console.log(`PASS: registered business doors remain accessible in ${combinations} construction/purchase combinations.`)
