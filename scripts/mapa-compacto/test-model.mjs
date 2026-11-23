import {createServer} from 'vite'
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false},appType:'custom'})
try{await server.ssrLoadModule('/scripts/mapa-compacto/test-model.mts')}finally{await server.close()}
