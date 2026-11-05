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
 }finally{w.dispose()}
 const noClub=criarEntornoComplexo(new T.Scene(),complexoDoEstadio(own),undefined,{name:'Neymarzetti'});assert.equal(noClub.casaLuca,false,'fora do mapa do clube o bairro fica como era');noClub.dispose()
}
console.log(JSON.stringify({status:'PASS',casaLuca:true,ownCityPreservedAway:true,noFreeStore:true,agencyClearOfExistingBuildings:true,roadsConnected:true,noStateOrMatchMutation:true}))
