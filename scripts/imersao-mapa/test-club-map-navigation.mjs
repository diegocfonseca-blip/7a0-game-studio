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
 for(const s of world.solids){if(s.id===a.id)continue;assert(!(s.minX<a.x+13&&s.maxX>a.x-13&&s.minZ<a.z+10&&s.maxZ>a.z-10),`${s.id} crosses the club agency`)}
 assert.deepEqual(world.root.userData.clubPlaces,{clubName:'Neymarzetti',store:true,agency:true})
}finally{world.dispose();assert.equal(scene.children.length,0)}
console.log(JSON.stringify({status:'PASS',ownCityPreservedAway:true,noFreeStore:true,agencyClearOfExistingBuildings:true,roadsConnected:true,noStateOrMatchMutation:true}))
