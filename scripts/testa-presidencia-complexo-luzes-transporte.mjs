import assert from 'node:assert/strict'
import fs from 'node:fs'
import {registerHooks} from 'node:module'
import {fileURLToPath,pathToFileURL} from 'node:url'
import * as THREE from 'three'
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){const candidate=fileURLToPath(new URL(specifier,context.parentURL));if(fs.existsSync(candidate+'.ts'))return{url:pathToFileURL(candidate+'.ts').href,shortCircuit:true}}return next(specifier,context)},load(url,context,next){if(url.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const result=next(url,context);if(url.includes('/src/escalacao/')&&result.source!=null)return{...result,source:Buffer.from(result.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")};return result}})
const {criarTransporteComplexo}=await import('../src/escalacao/presidencia-complexo-transporte.ts')
const {criarIluminacaoComplexo}=await import('../src/escalacao/presidencia-complexo-iluminacao.ts')
const {complexoDoEstadio}=await import('../src/escalacao/presidencia-complexo-model.ts')
const {STADIUM_SECTORS,STADIUM_EXTRAS}=await import('../src/escalacao/estadiodata.ts')
const save={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:STADIUM_EXTRAS.map(s=>s.k)}
const scene=new THREE.Scene(),sun=new THREE.DirectionalLight(),hemisphere=new THREE.HemisphereLight();scene.add(sun,hemisphere)
const state=complexoDoEstadio(save),transport=criarTransporteComplexo(scene,state,{transit:true,metroPassengers:1,busPassengers:1,cars:1,parkingPassengers:1,source:'qa-sample'})
const lighting=criarIluminacaoComplexo({scene,state,sun,hemisphere}),camera=new THREE.PerspectiveCamera()
const train=transport.inspect().vehicles.find(v=>v.kind==='metro'),rig=scene.getObjectByName(`transporte-${train.id}`)
const doorLamps=rig.userData.complexoLights.filter(lamp=>lamp.doorOnly),headlamps=rig.userData.complexoLights.filter(lamp=>lamp.kind==='headlight')
assert.equal(doorLamps.length,5);assert(doorLamps.every(lamp=>lamp.enabled===false))
transport.update(train.markers.doorsOpen+.1)
const frame=transport.inspect(),passenger=frame.passengers.find(p=>p.transport==='metro'),before=structuredClone(frame)
assert(doorLamps.every(lamp=>lamp.enabled===true));assert(headlamps.filter(lamp=>lamp.enabled).every(lamp=>lamp.direction===1))
const hip=passenger.pose.hip,focus=new THREE.Vector3(hip.x,hip.y+.5,hip.z);camera.position.copy(focus).add(new THREE.Vector3(3,1,3))
lighting.setPeriod('night');lighting.update(camera,focus)
assert(lighting.inspect().activeLocal.some(id=>id.includes('cabine')||id.includes('porta')),'observed passenger receives a real local cabin light')
assert(lighting.inspect().dynamicCabinShadows>0&&lighting.inspect().dynamicCabinShadows<=2)
assert.deepEqual(transport.inspect(),before,'lighting cannot move actors or their clock')
const departure=train.stages.find(stage=>stage.phase==='departing');assert(departure)
transport.update(departure.at+1);lighting.update(camera,focus)
assert(doorLamps.every(lamp=>lamp.enabled===false));assert(headlamps.filter(lamp=>lamp.enabled).every(lamp=>lamp.direction===-1))
const cab=rig.userData.complexoCabLamps
assert.equal(cab[0].emissive.getHexString(),new THREE.Color('#fff0cf').getHexString(),'return cab becomes white without refreshing sources')
assert.equal(cab[1].emissive.getHexString(),new THREE.Color('#ef3325').getHexString(),'opposite cab becomes red in same frame')
lighting.setPeriod('day');assert.equal(lighting.inspect().dynamicCabinShadows,0)
lighting.dispose();transport.dispose()
console.log('PASS moving lights: actual five-car train, portal lamps follow doors, lit cabin selected at passenger, max2 shadows, front/rear reverse live, pose/clock preserved')
