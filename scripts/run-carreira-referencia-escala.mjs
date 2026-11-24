// Ensaio estatístico virtual, nunca uma migração/curadoria factual dos jogadores.
import {createServer} from 'vite'
import {readFileSync} from 'node:fs'
const mapa=JSON.parse(readFileSync('/workspace/shared/carreira-alternativas-20261124/mapa-referencia.json','utf8'))
process.env.REPEAT_REFERENCIA_ESCALA='1'
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error',plugins:[{
 name:'ensaio-referencia-escala',enforce:'pre',transform(src,id){
  const fonte=id.endsWith('/src/escalacao/cartas-regionais.ts')?'regional':id.endsWith('/src/escalacao/data-oficial.ts')?'oficial':null
  if(!fonte)return
  const nome=fonte==='regional'?'CARTAS_REGIONAIS':'CATALOG_OFICIAL'
  return src+`\nconst __mapaReferencia=${JSON.stringify(mapa[fonte])};for(const __pos of Object.keys(${nome}))for(const __c of ${nome}[__pos]){const __v=__mapaReferencia[__c.name+'|'+__c.club+'|'+__c.year+'|'+__pos];if(__v){__c.lo=__v[0];__c.hi=__v[1]}}\n`
 }
}]})
try{await server.ssrLoadModule('/scripts/auditoria-serie-d/repeticao.mts')}finally{await server.close()}
process.exit(0)
