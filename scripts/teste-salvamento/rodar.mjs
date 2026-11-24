import {spawn} from 'node:child_process'
import {setTimeout} from 'node:timers/promises'
const base='http://127.0.0.1:5197'
let vite
try {
 let ready=await fetch(base+'/scripts/teste-salvamento/index.html',{signal:AbortSignal.timeout(1000)}).then(r=>r.ok,()=>false)
 if(!ready){
  vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5197','--strictPort'],{env:{...process.env,DEPLOY_BASE:'/'},stdio:'ignore'})
  for(let i=0;i<100&&!ready;i++){if(vite.exitCode!==null)throw Error('Não foi possível abrir a bancada');await setTimeout(200);ready=await fetch(base+'/scripts/teste-salvamento/index.html',{signal:AbortSignal.timeout(1000)}).then(r=>r.ok,()=>false)}
 }
 if(!ready)throw Error('Bancada não iniciou')
 const test=spawn(process.execPath,['scripts/teste-salvamento/verifica.mjs'],{stdio:'inherit'})
 process.exitCode=await new Promise(ok=>test.once('exit',code=>ok(code??1)))
}finally{vite?.kill('SIGTERM')}
