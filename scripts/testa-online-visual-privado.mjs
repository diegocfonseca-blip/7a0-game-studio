import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'

// Regressão importante: autenticação local verificada, troca de conta e respostas atrasadas.
let authChanged, pending=[]
const seen=new Map()
const exports={}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/online-preview.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{
 exports,queueMicrotask,Set,Promise,
 require(name){
  if(name==='react')return {useSyncExternalStore(subscribe,snapshot){subscribe(()=>{});return snapshot()}}
  if(name.endsWith('/supabase'))return {supabase:{auth:{onAuthStateChange(cb){authChanged=cb},getUser(){return new Promise(resolve=>pending.push(resolve))}}}}
  if(name==='./conta-vez')return {releConta(key,id){if(seen.has(key)&&seen.get(key)===id)return false;seen.set(key,id);return true}}
  throw Error(name)
 }
})
const owner='diego.c.fonseca@gmail.com',second='diego.c.fonseca2@gmail.com'
assert.equal(exports.ownerPresentationEmail(` ${owner.toUpperCase()} `),true)
for(const email of [null,undefined,'',second,'outro@example.com',`${owner}.evil`])assert.equal(exports.ownerPresentationEmail(email),false)
assert.equal(exports.onlinePreviewEmail(second),true,'a prévia antiga da segunda conta continua intacta')
assert.equal(exports.useOwnerPresentation(),false,'começa fechado antes da resposta autenticada')
assert.equal(pending.length,1)
pending.shift()({data:{user:{id:'d',email:owner}},error:null});await new Promise(setImmediate)
assert.equal(exports.ownerPresentationEnabled(),true)
authChanged('SIGNED_IN',{user:{id:'other',email:'outro@example.com',user_metadata:{email:owner}}})
assert.equal(exports.ownerPresentationEnabled(),false,'a troca fecha antes da nova verificação')
await new Promise(resolve=>queueMicrotask(resolve))
const stale=pending.shift()
authChanged('SIGNED_IN',{user:{id:'second',email:second}})
await new Promise(resolve=>queueMicrotask(resolve))
pending.shift()({data:{user:{id:'second',email:second}},error:null});await new Promise(setImmediate)
assert.equal(exports.ownerPresentationEnabled(),false)
assert.equal(exports.onlinePreviewEnabled(),true)
stale({data:{user:{id:'other',email:owner}},error:null});await new Promise(setImmediate)
assert.equal(exports.ownerPresentationEnabled(),false,'resposta antiga não reabre a nova apresentação')
authChanged('SIGNED_IN',{user:{id:'owner-again',email:owner}});await new Promise(resolve=>queueMicrotask(resolve))
pending.shift()({data:{user:{email:owner}},error:{message:'verification failed'}});await new Promise(setImmediate)
assert.equal(exports.ownerPresentationEnabled(),false,'falha de Auth mantém a aparência anterior')

const source=ts.createSourceFile('owner.tsx',fs.readFileSync('src/escalacao/owner-online-visual.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
const node=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ownerOnlineScope')
const scopeExports={};vm.runInNewContext(ts.transpileModule(node.getText(source),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:scopeExports})
const scope=scopeExports.ownerOnlineScope
for(const screen of ['auction','monte','cerimonia','season','liberta','champions','draft','end'])assert.equal(scope({screen}),true)
for(const s of [{screen:'season',careerOnline:true},{screen:'season',sport:'basquete'},{screen:'intro'},{screen:'season',co2:{}},{screen:'setup',careerIntent:true}])assert.equal(scope(s),false)
console.log('PASS: somente a conta principal verificada; público, segunda conta, carreira e basquete isolados; respostas atrasadas não liberam a prévia.')
