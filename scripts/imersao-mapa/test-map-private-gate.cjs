const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const transpile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const account={},gate={},map={},requests=[];let event,unsubscribe;
vm.runInNewContext(transpile('src/escalacao/presidencia-lotes.ts'),{exports:map});
vm.runInNewContext(transpile('src/escalacao/conta-vez.ts'),{exports:account,Date,Map});
vm.runInNewContext(transpile('src/escalacao/presidente-acesso.ts'),{exports:gate,queueMicrotask,require:id=>{
 if(id==='react')return{useSyncExternalStore:subscribe=>{unsubscribe=subscribe(()=>{})}};
 if(id==='./conta-vez')return account;
 if(id==='../lib/supabase')return{ supabase:{auth:{getUser:()=>new Promise(resolve=>requests.push(resolve)),onAuthStateChange:cb=>{event=cb}}}};
 throw Error(id);
}});
const tick=()=>new Promise(r=>setImmediate(r)),owner='diego.c.fonseca@gmail.com',response=email=>({data:{user:email?{email}:null},error:null});
(async()=>{
 assert.equal(map.PRESIDENCY_STADIUM_RELEASED,false,'Mapa não é liberado para todos');
 assert.equal(map.PRESIDENCY_STADIUM_PREVIEW_RELEASED,true,'Publicação privada autorizada');
 assert.equal(map.mapaEstadioDisponivel(false),false,'Sem conta verificada, a prévia fica oculta');
 assert(gate.presidentPreviewEmail(owner));for(const email of [null,'','visitor@example.com',owner+'x'])assert(!gate.presidentPreviewEmail(email));
 gate.usePresidentPreview();assert.equal(gate.presidentPreviewEnabled(),false);assert.equal(map.mapaEstadioDisponivel(gate.presidentPreviewEnabled()),false);
 event('SIGNED_IN',{user:{id:'visitor',email:'visitor@example.com'}});await tick();requests[1](response('visitor@example.com'));await tick();requests[0](response(owner));await tick();assert.equal(gate.presidentPreviewEnabled(),false,'stale verification cannot reopen the private map');
 event('SIGNED_IN',{user:{id:'owner',email:owner}});await tick();requests[2](response(owner));await tick();assert.equal(gate.presidentPreviewEnabled(),true);
 assert.equal(map.mapaEstadioDisponivel(gate.presidentPreviewEnabled()),true,'Só a conta confirmada abre o mapa');
 event('TOKEN_REFRESHED',{user:{id:'owner',email:owner}});await tick();assert.equal(requests.length,3);assert.equal(gate.presidentPreviewEnabled(),true);
 event('SIGNED_OUT',null);assert.equal(gate.presidentPreviewEnabled(),false);assert.equal(gate.presidentWritesEnabled(),false);await tick();requests[3](response(null));await tick();
 assert.equal(map.mapaEstadioDisponivel(gate.presidentPreviewEnabled()),false,'Sair da conta fecha o mapa');
 unsubscribe();console.log('PASS: private map remains owner-only, stale responses ignored, same-account renewal retained, logout revokes; simulated auth, no backend calls');
})().catch(e=>{console.error(e);process.exitCode=1});
