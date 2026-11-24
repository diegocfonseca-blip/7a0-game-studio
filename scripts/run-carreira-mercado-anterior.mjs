// Controle de bancada: desliga apenas a nova rotina no módulo virtual do Vite.
// Nenhum arquivo de produto é reescrito; não serve para publicar.
import {createServer} from 'vite'
process.env.REPEAT_MERCADO_ANTERIOR='1'
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error',plugins:[{
 name:'controle-mercado-anterior',transform(src,id){
  if(!id.endsWith('/src/escalacao/mercado-bots-oficial.ts'))return
  const from='export const MERCADO_BOTS_OFICIAL_GLOBAL = true'
  if(!src.includes(from))throw Error('Não encontrou flag exata do controle anterior')
  return src.replace(from,'export const MERCADO_BOTS_OFICIAL_GLOBAL = false')
 }
}]})
try{await server.ssrLoadModule('/scripts/auditoria-serie-d/repeticao.mts')}finally{await server.close()}
process.exit(0)
