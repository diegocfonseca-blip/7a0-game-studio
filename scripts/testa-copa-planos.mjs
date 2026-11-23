import {createServer} from 'vite'
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'})
try{await vite.ssrLoadModule(process.argv[2]??'/scripts/testa-copa-planos.mts')}finally{await vite.close()}
