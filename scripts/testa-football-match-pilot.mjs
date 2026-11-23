import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'

const policy={}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/football-match-pilot-policy.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:policy,Set})
const diego='diego.c.fonseca@gmail.com',futpoint='gfpicolo13@gmail.com'
for(const email of [diego,futpoint,` ${diego.toUpperCase()} `,null,undefined,'','diego.c.fonseca2@gmail.com','outro@example.com'])assert.equal(policy.footballMatchPilotEmail(email),true,'public presentation does not depend on an account allowlist')
const rollback={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/football-match-pilot-policy.ts','utf8').replace('FOOTBALL_MATCH_PILOT_ENABLED = true','FOOTBALL_MATCH_PILOT_ENABLED = false'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:rollback,Set});assert.equal(rollback.footballMatchPilotEmail('outro@example.com'),false,'global visual rollback stays available')
for(const screen of ['season','liberta','champions','end'])assert.equal(policy.footballMatchPilotScope({screen,onlineMode:'online'}),true)
for(const key of ['viceCity','bafo2','bafoOn','ligaMode','pregaoAberto','holandes','leilaoClubes'])for(const screen of ['season','end'])assert.equal(policy.footballMatchPilotScope({screen,onlineMode:'online',[key]:true}),true,`${key}: apresentação disponível nas competições online`)
for(const screen of ['season','liberta','champions','end'])assert.equal(policy.footballMatchAdScope({screen,onlineMode:'online'}),true)
for(const state of [{screen:'season'},...['setup','lobby','auction','convocacao'].map(screen=>({screen,onlineMode:'online'})),...['careerOnline','careerIntent','co2','pokeLiga'].map(key=>({screen:'end',onlineMode:'online',[key]:true})),{screen:'end',onlineMode:'online',sport:'basquete'}])assert.equal(policy.footballMatchAdScope(state),false,JSON.stringify(state))
for(const key of ['ligaDraft','minhaLigaDraft'])assert.equal(policy.footballMatchPilotScope({screen:'season',onlineMode:'online',[key]:true}),false,'Liga Draft mantém seu fluxo específico')
for(const state of [{screen:'season'},{screen:'season',onlineMode:'solo'},...['setup','lobby','auction','convocacao'].map(screen=>({screen,onlineMode:'online'})),...['careerOnline','careerIntent','co2','pokeLiga'].map(key=>({screen:'season',onlineMode:'online',[key]:true})),{screen:'season',onlineMode:'online',sport:'basquete'}])assert.equal(policy.footballMatchPilotScope(state),false,JSON.stringify(state))

let authChanged,pending=[]
const seen=new Map(),auth={}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/online-preview.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{
 exports:auth,queueMicrotask,Set,Promise,
 require(name){
  if(name==='react')return{useSyncExternalStore(subscribe,snapshot){subscribe(()=>{});return snapshot()}}
  if(name.endsWith('/supabase'))return{supabase:{auth:{onAuthStateChange(cb){authChanged=cb},getUser(){return new Promise(resolve=>pending.push(resolve))}}}}
  if(name==='./conta-vez')return{releConta(key,id){if(seen.has(key)&&seen.get(key)===id)return false;seen.set(key,id);return true}}
  throw Error(name)
 }
})
const tick=()=>new Promise(setImmediate)
assert.equal(auth.useVerifiedPresentationEmail(),'')
assert.equal(pending.length,1)
pending.shift()({data:{user:{email:futpoint}},error:null});await tick()
assert.equal(auth.useVerifiedPresentationEmail(),futpoint)
assert.equal(auth.onlinePreviewEnabled(),false,'Futpoint não herda outras prévias privadas')
assert.equal(auth.ownerPresentationEnabled(),false)
authChanged('SIGNED_IN',{user:{id:'other',email:'outro@example.com',user_metadata:{email:diego}}})
assert.equal(auth.useVerifiedPresentationEmail(),'','fecha antes de verificar a conta nova')
await tick();const stale=pending.shift()
authChanged('SIGNED_IN',{user:{id:'diego',email:diego}});await tick()
pending.shift()({data:{user:{email:diego}},error:null});await tick()
assert.equal(auth.ownerPresentationEnabled(),true)
assert.equal(auth.useVerifiedPresentationEmail(),diego)
stale({data:{user:{email:futpoint}},error:null});await tick()
assert.equal(auth.useVerifiedPresentationEmail(),diego,'resposta antiga não altera o teste da conta atual')
authChanged('SIGNED_OUT',null)
assert.equal(auth.useVerifiedPresentationEmail(),'')
await tick();pending.shift()({data:{user:null},error:null});await tick()
assert.equal(auth.useVerifiedPresentationEmail(),'')
authChanged('SIGNED_IN',{user:{id:'error',email:diego}});await tick()
pending.shift()({data:{user:{email:diego}},error:{message:'invalid'}});await tick()
assert.equal(auth.useVerifiedPresentationEmail(),'','erro autenticado mantém o piloto fechado')
console.log('PASS: visual público no futebol online compatível; reversão global; logout/erro/troca/resposta atrasada preservam as demais prévias privadas.')
