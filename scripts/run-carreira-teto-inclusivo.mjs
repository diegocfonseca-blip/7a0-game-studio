// Protótipo isolado: categoria define máximo negociável, sem excluir as inferiores.
import {createServer} from 'vite'
process.env.REPEAT_TETO_INCLUSIVO='1'
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error',plugins:[{
 name:'prototipo-teto-inclusivo',enforce:'pre',transform(src,id){
  if(!id.endsWith('/src/escalacao/store.tsx'))return
  const from="  if (div === 'A') return !c.promessa && f >= 4\n  if (div === 'B') return !!c.promessa || f === 4\n  if (div === 'C') return !!c.promessa || (f >= 2 && f <= 3)\n  return !c.promessa && f <= 3 // D"
  if(!src.includes(from))throw Error('Não encontrou filtro original exato')
  return src.replace(from,"  if (div === 'A') return true\n  if (div === 'B') return !!c.promessa || f <= 4\n  if (div === 'C') return !!c.promessa || f <= 3\n  return !c.promessa && f <= 3 // D")
 }
}]})
try{await server.ssrLoadModule('/scripts/auditoria-serie-d/repeticao.mts')}finally{await server.close()}
process.exit(0)
