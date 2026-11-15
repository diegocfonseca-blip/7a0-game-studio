import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {existsSync} from 'node:fs'
import * as THREE from 'three'
// Mesmo carregamento Node das verificações de geometria; sem navegador nem rede.
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const r=n(u,c);return r.source&&u.includes('/src/escalacao/')?{...r,source:Buffer.from(r.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")}:r}})
const {complexoDoEstadio,PLANTA_COMPLEXO}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {criarEntornoComplexo}=await import('../src/escalacao/presidencia-complexo-entorno.ts')
const {gerarPlantaTransporte}=await import('../src/escalacao/presidencia-complexo-transporte-model.ts')
const {segmentoLivre}=await import('../src/escalacao/presidencia-estadio-navegacao.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const {PRESIDENCY_STADIUM_RELEASED}=await import('../src/escalacao/presidencia-lotes.ts')
const {LOTE_MUSEU_CLUBE,interfereLoteMuseu}=await import('../src/escalacao/museu-clube-predio.ts')
const {investirEstacionamento}=await import('../src/escalacao/presidencia-estacionamento.ts')
const {criarEntregasVeiculos}=await import('../src/escalacao/veiculos-entrega-3d.ts')
const {TERRENO_USUARIO:HOME}=await import('../src/escalacao/residencia-planta.ts')
const {teamCoachAccess}=await import('../src/escalacao/cidade3d/coach-access.mjs')
assert.equal(PRESIDENCY_STADIUM_RELEASED,false,'Mapa continua oculto')
assert.deepEqual(PLANTA_COMPLEXO.arena.structure,{minX:-105,maxX:105,minZ:-70,maxZ:82,centerZ:6,shape:'ellipse',roofY:24})
const full={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(s=>s.k),'asfalto']}
const before=JSON.stringify(full),state=complexoDoEstadio(full),scene=new THREE.Scene()
const entorno=criarEntornoComplexo(scene,state,undefined,{name:'Amostra',residence:true,arena:true,museum:true})
assert.equal(JSON.stringify(full),before,'Implantação não altera save')
assert.ok(entorno.casaLuca&&entorno.casaLucaSul,'Casa Luca e quadra preservadas')
assert.equal(entorno.solids.filter(o=>o.id!=='museu-clube'&&interfereLoteMuseu(o)).length,0,'Museu sem edifício ou colisor invadindo seu lote')
const failures=[]
const p2=p=>({x:p.x,y:p.z})
function check(name,points,radius,height,ignore=[]){
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],feet=Math.min(a.y??.16,b.y??.16),top=Math.max(a.y??.16,b.y??.16)+height
  // Degraus e tabuleiros são superfícies de apoio, validados pelo teste de transporte no navegador.
  const relevant=entorno.solids.filter(s=>!ignore.includes(s.id)&&!/^estacao-(escada|passarela)/.test(s.id)&&s.base<top&&s.top>feet+.03)
  for(const s of relevant)if(!segmentoLivre(p2(a),p2(b),[{id:s.id,polygon:s.footprint.map(p2)}],radius)){
   failures.push({name,segment:i,solid:s.id,a,b});break
  }
 }
}
const transport=gerarPlantaTransporte(state)
for(const service of transport.services){
 if(service.kind!=='metro'){check(service.id+'-entrada',service.inbound,service.width/2,2);check(service.id+'-saida',service.outbound,service.width/2,2)}
 check(service.id+'-pedestre',service.passengerRoute,.3,1.7)
 if(service.passengerReturnRoute)check(service.id+'-volta-pedestre',service.passengerReturnRoute,.3,1.7)
}
check('onibus-times-entrada',teamCoachAccess().inbound,1.3,3.8)
check('onibus-times-saida',teamCoachAccess().outbound,1.3,3.8)
let parkingSave={...full,ext:full.ext.filter(k=>k!=='estac'),estacionamentoInvestido:0},cash=70
for(const stage of [0,1,2,3,4]){
 const s=complexoDoEstadio(parkingSave),t=gerarPlantaTransporte(s)
 assert.equal(s.parking.stage,stage)
 assert.equal(t.parkingPlants.filter(p=>p.stage<=stage).reduce((n,p)=>n+p.slots.length,0),s.parking.capacity)
 assert.equal(t.parkingPlants.filter(p=>p.stage<=stage).length,stage)
 for(const l of t.parkingPlants){const xs=l.polygon.map(p=>p.x),zs=l.polygon.map(p=>p.z);for(const slot of l.slots)assert.ok(slot.polygon.every(p=>p.x>=Math.min(...xs)&&p.x<=Math.max(...xs)&&p.z>=Math.min(...zs)&&p.z<=Math.max(...zs)))}
 assert.equal(t.services.filter(s=>s.kind==='car').length,stage?1:0)
 if(stage<4){const buy=investirEstacionamento({stadium:parkingSave,cash,expectedStage:stage});assert.ok(buy.ok);parkingSave=buy.value.stadium;cash=buy.value.cash}
}
assert.equal(cash,0)
const delivery=criarEntregasVeiculos(scene,entorno.root,entorno.solids,true)
delivery.sync({cash:0,revision:0,owned:[]});delivery.sync({cash:0,revision:1,owned:[{id:'fusca',paid:30}]})
assert.deepEqual(delivery.inspect().issues,[],'Entrega da Vadico visível deve chegar à garagem sem cruzar prédios')
assert.equal(delivery.inspect().active,1)
const duration=delivery.inspect().vehicles[0].duration
for(let i=0;i<=Math.ceil(duration*10)+2;i++)delivery.update(i/10)
const arrived=delivery.inspect().vehicles[0];assert.equal(arrived.phase,'parked');assert.ok(Math.hypot(arrived.position[0]-(HOME.garage.x-2.1),arrived.position[2]-HOME.garage.z)<.01,'Fusca chegou à vaga da garagem')
delivery.dispose()
console.log(JSON.stringify({museum:LOTE_MUSEU_CLUBE.id,casaLuca:entorno.casaLuca,roadDiagnostics:entorno.root.userData.roadNetwork.diagnostics,routeFailures:failures},null,2))
entorno.dispose()
assert.equal(failures.length,0,'Caminhos não devem cruzar paredes: veja os segmentos no relatório')
console.log('Implantação urbana: estádio, privacidade, Casa Luca, museu, 5 estados do estacionamento e trajetos conferidos.')
