import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
import * as T from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const r=n(u,c);return r.source&&u.includes('/src/escalacao/')?{...r,source:Buffer.from(r.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")}:r}})
const {adaptarCarreiraAoComplexo:adapt}=await import('../../src/escalacao/presidencia-complexo-carreira.ts')
const {complexoDoEstadio}=await import('../../src/escalacao/presidencia-complexo-model.ts')
const {criarLugaresClube}=await import('../../src/escalacao/presidencia-clube-lugares.ts')
const {criarEntornoComplexo}=await import('../../src/escalacao/presidencia-complexo-entorno.ts')
const {LOTE_AGENCIA_CLUBE:a,lugarDoPainelClube,nomeAgenciaClube}=await import('../../src/escalacao/clube-mapa-destinos.ts')
const own={inv:{geral:40},ext:['loja']},host={inv:{},ext:['hotel']}
const state={careerOnline:true,onlineMode:'cpu',sport:'futebol',youIdx:0,managers:[{id:17,isHuman:true,teamName:'Neymarzetti'},{id:42,isHuman:true,teamName:'Visitante'}],stadiums:{17:own,42:host},careerCoins:{17:200}}
const original=JSON.stringify(state),match={context:{id:'away-read-only',homeClubId:42,awayClubId:17},minute:20,paused:false,finished:false,homeScore:0,awayScore:0},input={enabled:true,state,mgrId:17,day:{division:'V',support:60},match}
const result=adapt(input)
assert(result);assert.deepEqual(result.complexo.stadium,host);assert.deepEqual(result.complexo.cityStadium,own)
assert.strictEqual(result.complexo.match,match,'Never create another match/clock for navigation')
assert.equal(result.complexo.clubName,'Neymarzetti');assert.equal(JSON.stringify(state),original)
result.complexo.cityStadium.ext.push('chopp');assert.equal(JSON.stringify(state),original,'Own city is a read-only snapshot')
const noOwn=adapt({...input,state:{...state,stadiums:{42:host}}})
assert.deepEqual(noOwn.complexo.cityStadium,{inv:{},ext:[]},'An absent own stadium cannot inherit host purchases')
assert.equal(adapt({...input,enabled:false}),null)
assert.equal(lugarDoPainelClube('financas'),'casa-usuario');assert.equal(lugarDoPainelClube('patrocinio'),'agencia-clube')
assert.equal(lugarDoPainelClube('loja'),'loja');assert.equal(nomeAgenciaClube('Neymarzetti'),'Agência Neymarzetti')
for(const built of[false,true]){
 const scene=new T.Scene(),places=criarLugaresClube(scene,complexoDoEstadio({inv:{},ext:built?['loja']:[]}),'Neymarzetti')
 assert.equal(places.root.userData.clubPlaces.store,built,'Store only appears when already purchased')
 assert.equal(places.root.userData.clubPlaces.agency,true);assert(places.root.children.length<20,'Bound the static address geometry')
 places.dispose();places.dispose();assert.equal(scene.children.length,0)
}
const scene=new T.Scene(),world=criarEntornoComplexo(scene,complexoDoEstadio(own),undefined,{name:'Neymarzetti'})
try{
 assert.equal(world.root.userData.roadNetwork.diagnostics.afterComponents,1)
 assert.deepEqual(world.root.userData.roadNetwork.diagnostics.unresolved,[])
 const lot={minX:Math.min(...a.footprint.map(p=>p.x)),maxX:Math.max(...a.footprint.map(p=>p.x)),minZ:Math.min(...a.footprint.map(p=>p.z)),maxZ:Math.max(...a.footprint.map(p=>p.z))}
 for(const s of world.solids){if(s.id.startsWith(a.id)||s.id==='estacao-viaduto')continue;assert(!(s.minX<lot.maxX&&s.maxX>lot.minX&&s.minZ<lot.maxZ&&s.maxZ>lot.minZ),`${s.id} crosses the club agency`)}
 // 🏢🛍️ 05/11: loja e agência no lado da torcida da casa (sul), longe do portão do visitante (x 105, z 6)
 const {LOJA_CLUBE_3D:shop}=await import('../../src/escalacao/presidencia-loja-planta.ts')
 const {STADIUM_AWAY_GATE:away,STADIUM_HOME_GATE:home}=await import('../../src/escalacao/cidade3d/stadium-entrances.mjs')
 for(const p of[{x:a.x,z:a.z},{x:shop.x,z:shop.z}]){
  assert(p.z>home.threshold.z&&p.x<0,'loja/agência ficam ao sul e a oeste do eixo, do lado da casa')
  assert(Math.hypot(p.x-away.threshold.x,p.z-away.threshold.z)>Math.hypot(p.x-home.approach.x,p.z-home.approach.z)*2.5,'mais perto do visitante que da casa')
 }
 const shopBox={minX:Math.min(...shop.footprint.map(p=>p.x)),maxX:Math.max(...shop.footprint.map(p=>p.x)),minZ:Math.min(...shop.footprint.map(p=>p.z)),maxZ:Math.max(...shop.footprint.map(p=>p.z))}
 assert(shopBox.minX>lot.maxX||shopBox.maxX<lot.minX||shopBox.minZ>lot.maxZ||shopBox.maxZ<lot.minZ,'loja e agência não se encostam')
 const {teamCoachAccess}=await import('../../src/escalacao/cidade3d/coach-access.mjs'),coach=teamCoachAccess()
 for(const box of[lot,shopBox])for(const p of[...coach.inbound,...coach.outbound])assert(!(p.x>box.minX-3&&p.x<box.maxX+3&&p.z>box.minZ-3&&p.z<box.maxZ+3),'rota do ônibus dos times passa pela loja/agência')
 for(const s of world.solids)if(s.id.startsWith('loja-')||s.id.startsWith(a.id))assert(s.top>.5)
 assert.deepEqual(world.root.userData.clubPlaces,{clubName:'Neymarzetti',store:true,agency:true})
}finally{world.dispose();assert.equal(scene.children.length,0)}
// 💙 05/11: Casa Luca — quarteirão inteiro do bairro (sem as duas casas), fora do complexo do estádio, longe da rota dos ônibus
{const {CASA_LUCA:c,LIMITES_CASA_LUCA:b,AGRADECIMENTOS_CASA_LUCA:mural}=await import('../../src/escalacao/presidencia-casa-luca-planta.ts')
 assert.deepEqual(mural,[],'mural começa vazio (escondido)')
 assert(Math.hypot(c.x,c.z)>150,'Casa Luca fica no bairro, fora do complexo do estádio')
 assert(c.x>-190&&c.x<214&&c.z>-140&&c.z<175,'Casa Luca aparece no Ver tudo')
 const sc=new T.Scene(),w=criarEntornoComplexo(sc,complexoDoEstadio(own),undefined,{name:'Neymarzetti',residence:true})
 try{
  assert.equal(w.casaLuca,true,'o quarteirão da Casa Luca existe na grade do bairro')
  assert(!w.bairro.quadras.some(q=>q.x===c.x&&q.z===c.z),'tradições do bairro não usam o quarteirão')
  assert(!w.bairro.casas.some(h=>h.x>b.minX&&h.x<b.maxX&&h.z>b.minZ&&h.z<b.maxZ),'as casas do quarteirão saíram')
  for(const s of w.solids)if(!s.id.startsWith("poste-"))assert(!(s.minX<b.maxX&&s.maxX>b.minX&&s.minZ<b.maxZ&&s.maxZ>b.minZ),`${s.id} invade a Casa Luca`) // o poste da esquina fica no canto, entre a cerca e o prédio
  const {teamCoachAccess}=await import('../../src/escalacao/cidade3d/coach-access.mjs'),coach=teamCoachAccess()
  for(const p of[...coach.inbound,...coach.outbound])assert(!(p.x>b.minX-3&&p.x<b.maxX+3&&p.z>b.minZ-3&&p.z<b.maxZ+3),'rota do ônibus dos times passa na Casa Luca')
  assert.equal(w.root.userData.roadNetwork.diagnostics.afterComponents,1)
  // 💙 06/11: o complexo cresceu — jardim (diagonal), piquenique (praça) e quadra (quarteirão das 2 casas), ruas no lugar
  assert.equal(w.casaLucaSul,true,'o quarteirão das 2 casas ao sul virou parte da Casa Luca')
  const {AREAS_CASA_LUCA:areas,QUADRA_CASA_LUCA_SUL:q,PRACA_CASA_LUCA:pr,JARDIM_CASA_LUCA:jd}=await import('../../src/escalacao/presidencia-casa-luca-planta.ts')
  assert(!w.bairro.quadras.some(k=>k.x===q.x&&k.z===q.z),'tradições do bairro não usam o quarteirão da quadra')
  assert(w.bairro.praca&&!(w.bairro.praca.x===pr.x&&w.bairro.praca.z===pr.z)&&!(w.bairro.campinho?.x===pr.x&&w.bairro.campinho?.z===pr.z),'a praça do piquenique não é a do dominó nem o campinho')
  for(const a of areas){
   assert(!w.bairro.casas.some(h=>h.x>a.minX&&h.x<a.maxX&&h.z>a.minZ&&h.z<a.maxZ),`casa sobrou na área ${a.id}`)
   for(const s of w.solids)if(!s.id.startsWith('poste-'))assert(!(s.minX<a.maxX&&s.maxX>a.minX&&s.minZ<a.maxZ&&s.maxZ>a.minZ),`${s.id} invade a área ${a.id}`)
   for(const p of[...coach.inbound,...coach.outbound])assert(!(p.x>a.minX-3&&p.x<a.maxX+3&&p.z>a.minZ-3&&p.z<a.maxZ+3),`rota do ônibus dos times passa na área ${a.id}`)
  }
  // 🔁 07/11: terreno ÚNICO — nenhuma rua/rota de veículo cruza o terreno, e as ruas que sobraram terminam em cruzamento (sem ponta solta)
  const {TERRENO_CASA_LUCA:ter}=await import('../../src/escalacao/presidencia-casa-luca-planta.ts')
  const ruas=w.root.userData.roadNetwork.streets
  const dentro=(p)=>{let i2=false;for(let i=0,j=ter.length-1;i<ter.length;j=i++){const A=ter[j],B=ter[i];if((A.z>p.z)!==(B.z>p.z)&&p.x<(B.x-A.x)*(p.z-A.z)/(B.z-A.z)+A.x)i2=!i2}return i2}
  const dSegP=(p,A,B)=>{const dx=B.x-A.x,dz=B.z-A.z,t=Math.max(0,Math.min(1,((p.x-A.x)*dx+(p.z-A.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-A.x-t*dx,p.z-A.z-t*dz)}
  const bordaD=(p)=>Math.min(...ter.map((A,i)=>dSegP(p,A,ter[(i+1)%ter.length])))
  for(const r of ruas)for(let i=1;i<r.points.length;i++){const A=r.points[i-1],B=r.points[i],n=Math.ceil(Math.hypot(B.x-A.x,B.z-A.z)/.5)
   for(let k=0;k<=n;k++){const p={x:A.x+(B.x-A.x)*k/n,z:A.z+(B.z-A.z)*k/n};assert(!dentro(p)&&bordaD(p)>=r.width/2-.05,`a rua ${r.id} entra no terreno da Casa Luca`)}}
  for(const p of[...coach.inbound,...coach.outbound])assert(!dentro(p)&&bordaD(p)>4,'rota do ônibus dos times cruza o terreno')
  const perto=(p)=>bordaD(p)<45||dentro(p)
  for(const r of ruas)for(const e of[r.points[0],r.points.at(-1)])if(perto(e)){
   const junta=ruas.some(o=>o!==r&&o.points.some((B,i)=>i&&dSegP(e,o.points[i-1],B)<1))
   assert(junta,`ponta solta da rua ${r.id} em ${e.x},${e.z}`)}
  for(const s2 of w.solids)if(!s2.id.startsWith('poste-'))assert(!dentro({x:(s2.minX+s2.maxX)/2,z:(s2.minZ+s2.maxZ)/2}),`${s2.id} dentro do terreno`)
  // o jardim fica fora da avenida (≥ 9,5 m do eixo) e das calçadas
  const av=ruas.find(r=>r.id==='via-publica'),dSeg=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)}
  for(const p of jd.poligono)assert(av.points.slice(1).every((b,i)=>dSeg(p,av.points[i],b)>9.4),'o jardim encosta na avenida')
 }finally{w.dispose()}
 const noClub=criarEntornoComplexo(new T.Scene(),complexoDoEstadio(own),undefined,{name:'Neymarzetti'});assert.equal(noClub.casaLuca,false,'fora do mapa do clube o bairro fica como era');noClub.dispose()
}
console.log(JSON.stringify({status:'PASS',casaLuca:true,ownCityPreservedAway:true,noFreeStore:true,agencyClearOfExistingBuildings:true,roadsConnected:true,noStateOrMatchMutation:true}))
