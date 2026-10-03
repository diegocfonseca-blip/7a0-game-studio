const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const e={},requests=[];let event,unsubscribe;
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/presidente-acesso.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:e,queueMicrotask,require:id=>{
 if(id==='react')return {useSyncExternalStore:subscribe=>{unsubscribe=subscribe(()=>{})}};
 if(id==='../lib/supabase')return {supabase:{auth:{getUser:()=>new Promise(resolve=>requests.push(resolve)),onAuthStateChange:cb=>{event=cb}}}};
 throw Error(id);
}});
const tick=()=>new Promise(r=>setImmediate(r)),user=email=>({data:{user:{email}},error:null});
(async()=>{
 assert.equal(e.presidentPreviewEmail('diego.c.fonseca@gmail.com'),true);
 for(const email of [null,'','diego.c.fonseca2@gmail.com','other@gmail.com'])assert.equal(e.presidentPreviewEmail(email),false);
 assert.equal(e.presidentPreviewEnabled(),false);e.usePresidentPreview();
 event();await tick();assert.equal(requests.length,2);
 requests[1](user('other@gmail.com'));await tick();requests[0](user('diego.c.fonseca@gmail.com'));await tick();
 assert.equal(e.presidentPreviewEnabled(),false,'stale account response must not reopen access');
 event();await tick();requests[2](user('diego.c.fonseca@gmail.com'));await tick();assert.equal(e.presidentPreviewEnabled(),true);
 assert.equal(e.presidentWritesEnabled(),true,'approved batch requires verified Diego account');
 event();assert.equal(e.presidentPreviewEnabled(),false,'account event revokes immediately');
 assert.equal(e.presidentWritesEnabled(),false,'account change immediately blocks writes');
 await tick();requests[3]({data:{user:null},error:Error('offline')});await tick();assert.equal(e.presidentPreviewEnabled(),false);
 assert.equal(e.presidentWritesEnabled(),false,'failed verification blocks writes');
 unsubscribe();console.log('PASS: approved batch only for verified Diego; second email denied, stale response ignored, account change revokes, failure closed. Auth responses simulated.');
})().catch(err=>{console.error(err);process.exitCode=1});
