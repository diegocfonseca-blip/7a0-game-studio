import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
import * as T from 'three'
registerHooks({resolve(s,c,n){if(s.startsWith('.')){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return{url:u.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};const r=n(u,c);return r.source&&u.includes('/src/escalacao/')?{...r,source:Buffer.from(r.source).toString().replaceAll('import.meta.env.BASE_URL',"'/'")}:r}})
const {criarEntornoComplexo}=await import('../../src/escalacao/presidencia-complexo-entorno.ts')
const {complexoDoEstadio}=await import('../../src/escalacao/presidencia-complexo-model.ts')
const {createResidents}=await import('../../src/escalacao/cidade3d/residents.mjs');
const scene=new T.Scene(),world=criarEntornoComplexo(scene,complexoDoEstadio({inv:{},ext:[]}));const residents=createResidents(scene,world.root,world.solids);const info=residents.inspect();assert.equal(info.count,0);assert(info.purposefulJourneys>=40);assert(info.purposefulJourneys<=80);assert(info.network.nodes>1000);assert(info.buildMs<10000);console.log({status:'PASS',network:info.network,journeys:info.purposefulJourneys,buildMs:info.buildMs,noPopulationWithoutConfiguration:true});residents.dispose();world.dispose();
