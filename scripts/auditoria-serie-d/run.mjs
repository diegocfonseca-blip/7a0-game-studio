import {createServer} from 'vite'
const plugins=process.env.AUDIT_FAIR_FILTER?[{name:'audit-only-counterfactual',enforce:'pre',transform(code,id){
 if(!id.endsWith('/src/escalacao/store.tsx'))return
 const old="const livresDe = (pos: Sector): Card[] => ACTIVE_CATALOG[pos].filter(c => !usados.has(idB(c)) && (!escDv || escadaAllows(escDv, c)))"
 if(!code.includes(old))throw Error('Audit counterfactual target changed')
 code=code.replace(old,"const livresDe = (pos: Sector, divClube: string): Card[] => ACTIVE_CATALOG[pos].filter(c => !usados.has(idB(c)) && (!escDv || escadaAllows(escDv, c)) && (!s.oficial || (cartaDeClubeBrasileiro(c) && categoriaOficialOk(divClube, c))))")
 const start=code.indexOf('export function completaBancoDosBots('),end=code.indexOf('function pinHumanLineups(',start)
 if(start<0||end<0)throw Error('Audit-only range changed')
 const scope=code.slice(start,end).replaceAll('livresDe(pos)','livresDe(pos, s.careerPlacements?.[chaveCaixa] ?? minhaDiv)')
 return code.slice(0,start)+scope+code.slice(end)
 }}]:[]
const server=await createServer({configFile:false,plugins,optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'})
try{await server.ssrLoadModule(process.env.AUDIT_MODE==='registrations'?'/scripts/testa-inscricoes-conmebol.mts':'/scripts/auditoria-serie-d/model.mts')}finally{await server.close()}
process.exit(0)
