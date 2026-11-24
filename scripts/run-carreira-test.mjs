import {createServer} from 'vite'
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'})
try{await server.ssrLoadModule(process.argv[2]??'/scripts/testa-carreira-revisao.mts')}finally{await server.close()}
process.exit(0)
