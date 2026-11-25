// Local longevity diagnostic. Reuses native season/market simulation without touching accounts or balance rules.
import {createServer} from 'vite'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {gzipSync,gunzipSync} from 'node:zlib'
import assert from 'node:assert/strict'
const out=process.env.AUDIT_OUT??'/workspace/shared/carreira-evolucao-20261125/longevidade';mkdirSync(out,{recursive:true})
Object.assign(process.env,{AUDIT_OUT:out,REPEAT_CLUB:'Portuguesa',REPEAT_SEEDS:'7919001',REPEAT_YEARS:'25'})
const metrics=[]
const server=await createServer({configFile:false,plugins:[{name:'long-career-diagnostic',enforce:'pre',transform(code,id){
 if(!id.endsWith('/scripts/auditoria-serie-d/repeticao.mts'))return
 return code.replace('for(let ano=1;ano<=limite+(run.primeiroAcessoA!=null?2:0);ano++)','for(let ano=1;ano<=limite;ano++)').replace('if(run.primeiroAcessoA!=null&&x.summary.season>=run.primeiroAcessoA+2)break','/* Continue through season 25, regardless of promotion. */').replace("   console.log('TEMPORADA',",`   writeFileSync(OUT+'/save-final.json.gz',gzipSync(JSON.stringify(s)));globalThis.__longevityMetrics.push({season:x.summary.season,bytes:Buffer.byteLength(JSON.stringify(s)),players:mine(s).squad.length,deals:(s.careerTransferHistory??[]).length});\n   console.log('TEMPORADA',`)
 }}],optimizeDeps:{noDiscovery:true,entries:[]},ssr:{optimizeDeps:{noDiscovery:true,include:[]}},server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'})
globalThis.__longevityMetrics=metrics
try{
 await server.ssrLoadModule('/scripts/auditoria-serie-d/repeticao.mts')
 const saved=JSON.parse(gunzipSync(readFileSync(out+'/save-final.json.gz')).toString()),{reducer,INITIAL}=await server.ssrLoadModule('/src/escalacao/store.tsx')
 const restored=reducer(structuredClone(INITIAL),{type:'RESUME_CAREER_SOLO',saved})
 assert.equal(metrics.length,25);assert.deepEqual(restored.careerCoins,saved.careerCoins);assert.equal(restored.seasonNo,saved.seasonNo);assert.deepEqual(restored.careerTransferHistory,saved.careerTransferHistory);assert(metrics.every(m=>m.deals<=500))
 const result={seasons:25,nextSeason:restored.seasonNo,restore:true,metrics,limits:['One automated management policy and one seed; this is a longevity check, not difficulty calibration.','Match history growth has a separate 1800-match test.']};writeFileSync(out+'/longevity.json',JSON.stringify(result,null,2));console.log('LONGEVITY_PASS',JSON.stringify({seasons:25,restore:true,last:metrics.at(-1)}))
}finally{await server.close()}
