import {createServer} from 'vite'
process.env.REPEAT_SEM_TRANSFERENCIAS='1'
const server=await createServer({configFile:false,plugins:[{name:'controle-sem-transferencias',enforce:'pre',transform(code,id){if(id.endsWith('/src/escalacao/mercado-bots-oficial.ts')){if(!code.includes('export const TRANSFERENCIAS_OFICIAIS = true'))throw Error('Flag de controle não encontrada');return code.replace('export const TRANSFERENCIAS_OFICIAIS = true','export const TRANSFERENCIAS_OFICIAIS = false')}}}],optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'})
try{await server.ssrLoadModule('/scripts/auditoria-serie-d/repeticao.mts')}finally{await server.close()}
process.exit(0)
