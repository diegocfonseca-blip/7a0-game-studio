import {createServer} from 'vite'
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false},appType:'custom'})
try{await server.ssrLoadModule('/scripts/interior-estadio/test-model.mts');await server.ssrLoadModule('/scripts/testa-torcida-vista-partida.mts');await server.ssrLoadModule('/scripts/testa-mapa-foco-partida.mts')}finally{await server.close()}
