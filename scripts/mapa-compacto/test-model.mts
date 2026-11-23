import assert from 'node:assert/strict'
import {populationPlan,fadePortal,routeAt,planta} from '../../src/escalacao/mapa-compacto/model'
import {STADIUM_SERVICE_GATE} from '../../src/escalacao/cidade3d/stadium-entrances.mjs'
import {acessoDelegacoesCompacto} from '../../src/escalacao/mapa-compacto/team-access'
import type {JornadaComplexo} from '../../src/escalacao/presidencia-complexo-jornada'
const journey:JornadaComplexo={key:'club-a-real-fixture',variantSeed:4,calendarKnown:true,hosting:true,phase:'arrival'}
const audience={supporters:120000,attendance:90,capacity:40000,outside:5,inside:4,cars:3,playing:true,wet:false,torcedores:36000}
const input={enabled:true,mobile:false,journey,home:audience,away:{...audience,supporters:30000}}
const original=JSON.stringify(input),arrival=populationPlan(input)
assert(arrival.homeFans>0&&arrival.awayFans>0)
assert(arrival.homeFans+arrival.awayFans<=120)
assert.equal(populationPlan({...input,away:undefined}).awayFans,0)
const playing=populationPlan({...input,journey:{...journey,phase:'playing'}})
assert(playing.homeFans+playing.awayFans<arrival.homeFans+arrival.awayFans)
assert(playing.vendors<arrival.vendors)
for(const quiet of [{journey:{...journey,phase:'idle' as const}},{awayMatch:true},{journey:{...journey,hosting:false}}]){const p=populationPlan({...input,...quiet});assert.equal(p.homeFans+p.awayFans,0);assert.equal(p.vendors,0)}
const small=populationPlan({...input,home:{...audience,supporters:5000}}),big=populationPlan({...input,home:{...audience,supporters:300000}})
assert(small.homeFans+small.awayFans<big.homeFans+big.awayFans)
assert(populationPlan({...input,mobile:true}).homeFans+populationPlan({...input,mobile:true}).awayFans<=42)
assert(populationPlan({...input,night:true}).residents<arrival.residents)
assert(populationPlan({...input,rain:true}).homeFans<arrival.homeFans)
assert.equal(JSON.stringify(input),original,'visual sampling must not mutate club/attendance')
assert.equal(fadePortal(30+288),0);assert.equal(fadePortal(30-288),0);assert.equal(fadePortal(30),1)
const p=routeAt([[0,0],[10,0]],5,false);assert.equal(p.x,35);assert.equal(p.z,10);assert.equal(p.done,false);assert.equal(routeAt([[0,0],[10,0]],20,false).done,true)
for(const path of Object.values(planta.vehiclePaths))for(const d of [0,10,100,1000])assert(Object.values(routeAt(path,d)).every(v=>typeof v!=='number'||Number.isFinite(v)))
const coach=acessoDelegacoesCompacto();assert(coach.inbound.length>2&&coach.outbound.length>2);assert(coach.minimumWallClearance>0);assert.equal(coach.bay.x,-94);assert.equal(coach.passenger.at(-1)?.x,STADIUM_SERVICE_GATE.inside.x)
console.log('Modelo: fases, dois clubes, torcida desconhecida, chuva/noite, limites móveis, portais, caminhos e acesso das delegações conferidos; nenhuma escrita no estado.')
