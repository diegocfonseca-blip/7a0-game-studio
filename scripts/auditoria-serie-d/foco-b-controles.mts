// Experimentos locais sobre fotografias da primeira Série B. Não altera regras nem contas.
import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import assert from 'node:assert/strict'
import * as P from '../../src/escalacao/pyramidseason'
import {carregaGuardados,tiraNovos} from '../../src/escalacao/motor2/carreira'
import {recepcaoM2Desde} from '../../src/escalacao/motor2-recepcao-conta'
import {criteriosDaTemporada} from '../../src/escalacao/criterios-carreira'
import {expectativaBotsCarreira} from '../../src/escalacao/calibracao-bots-carreira'
import {VERSAO_CRITERIOS_RECEPCAO_M2} from '../../src/escalacao/motor2/versao'

const root=process.env.B_FOCUS_ROOT??'/workspace/shared/carreira-foco-b-20261123'
const output=process.env.B_CONTROL_OUT??root+'/controles'
mkdirSync(output,{recursive:true})
const seeds=(process.env.B_CONTROL_SEEDS??'20261123,7919001,871217,20332403,31892031,42771721,54183913,68218117,77323109,89117321').split(',').map(Number)
const samples=Number(process.env.B_CONTROL_SAMPLES??0),report:any={metodo:'Mesmos elencos, escalações, condição e técnicos da fotografia; semente alternativa só nas partidas. Não são novas carreiras nem temporadas consecutivas.',runs:[]}
if(process.env.B_CONTROL_RESUME&&existsSync(output+'/controles.json')){
 const prev=JSON.parse(readFileSync(output+'/controles.json','utf8'))
 assert(prev.metodo===report.metodo)
 report.runs=prev.runs
}
let contexto=0
const avg=(cs:any[])=>cs.reduce((n,c)=>n+(c.lo+c.hi)/2,0)/cs.length
function pontosEsperados(h:number,a:number,home:boolean){
 const poi=(l:number)=>{const ps=[Math.exp(-l)];for(let k=1;k<=30;k++)ps.push(ps[k-1]*l/k);return ps}
 const ph=poi(h),pa=poi(a);let pts=0
 for(let i=0;i<ph.length;i++)for(let j=0;j<pa.length;j++)pts+=ph[i]*pa[j]*(i===j?1:((i>j)===home?3:0))
 return pts
}
function simulate(d:any,mode:string,seed=d.i.seasonSeed){
 const {s}=d,i=structuredClone(d.i),me=s.managers[s.youIdx],id=me.id
 carregaGuardados(undefined,s.seasonNo,'b-controle:'+contexto++)
 if(mode==='sem-tecnico')delete i.tecs[me.teamName]
 if(mode==='sem-desgaste'){
  i.mods={};for(const plan of Object.values(i.botPlans) as any[])plan.mods={}
 }
 const physical=mode!=='motor-leve'
 const res=P.simulatePyramid({A:[],B:i.world.B,C:[],D:[],V:[]},seed,38,s.careerTactics??{},i.lines,1.12,true,8,{},s.careerHalftime??{},s.careerPenalty??{},i.tecs,mode==='sem-desgaste'?{}:{[id]:i.mods},i.botPlans,physical?0:undefined,recepcaoM2Desde(s,'diego.c.fonseca@gmail.com'),{criterios:criteriosDaTemporada(s),disputadas:38,intervaloAberto:true})
 const novos=tiraNovos(),tb=res.tables.B,row=tb.find(t=>t.you)!,pos=tb.indexOf(row)+1
 let playoff:any=null,sobe=pos<=2
 if(pos>=3&&pos<=6){
  playoff=P.computePlayoffB(tb,s.seed,s.seasonNo,1.12,true,i.lines,physical,VERSAO_CRITERIOS_RECEPCAO_M2)
  sobe=!!playoff?.ties.some(t=>(t.win==='a'?t.a:t.b).name===me.teamName)
 }
 const entradas=Object.values(novos??{}).filter((v:any)=>v[5]?.partidaId?.startsWith('liga:')).map((v:any)=>{
  const e=v[5],home=!e.bots[0],rates=expectativaBotsCarreira(e)
  return {seed:e.seed,home,gols:[v[0],v[1]],esperados:rates,pontos:home?(v[0]>v[1]?3:v[0]===v[1]?1:0):(v[1]>v[0]?3:v[1]===v[0]?1:0),pontosEsperados:pontosEsperados(rates[0],rates[1],home),gasMods:[e.casa,e.fora].map(cs=>cs.filter(c=>c.gasMod).length)}
 })
 return {pos,pts:row.pts,w:row.w,d:row.d,l:row.l,gf:row.gf,ga:row.ga,sobe,playoff:playoff?.ties.map(t=>({a:t.a.name,b:t.b.name,aggA:t.aggA,aggB:t.aggB,vencedor:(t.win==='a'?t.a:t.b).name})),tabela:tb.map(t=>({name:t.name,pts:t.pts,w:t.w,d:t.d,l:t.l,gf:t.gf,ga:t.ga})),entradas}
}
for(const seed of seeds){
 if(report.runs.some(r=>r.seed===seed))continue
 const files=readdirSync(root).filter(f=>f.startsWith('b-'+seed+'-t')&&f.endsWith('.json.gz')).sort((a,b)=>Number(a.match(/-t(\d+)/)![1])-Number(b.match(/-t(\d+)/)![1]))
 assert(files.length,'Fotografia ausente para '+seed)
 const data=JSON.parse(gunzipSync(readFileSync(root+'/'+files[0])).toString())
 const baseline=simulate(data,'real'),expected=data.tabela.map(t=>({name:t.clube,pts:t.pts,w:t.w,d:t.d,l:t.l,gf:t.gf,ga:t.ga}))
 assert.deepEqual(baseline.tabela,expected,'Reprodução da Série B divergiu')
 assert.equal(baseline.entradas.length,38)
 assert.equal(baseline.entradas.reduce((n,e)=>n+e.pontos,0),baseline.pts)
 const leves=simulate(data,'motor-leve'),semTecnico=simulate(data,'sem-tecnico'),semDesgaste=simulate(data,'sem-desgaste')
 const variants=[]
 for(let k=0;k<samples;k++)variants.push({semente:(data.i.seasonSeed^Math.imul(k+1,7919))>>>0,...simulate(data,'real',(data.i.seasonSeed^Math.imul(k+1,7919))>>>0)})
 const row={seed,season:data.s.seasonNo,forca:avg(data.i.world.B.find(t=>t.you).xi),baseline,motorLeve:leves,semTecnico,semDesgaste,variacoes:variants}
 report.runs.push(row);writeFileSync(output+'/controles.json',JSON.stringify(report,null,2))
 console.log('CONTROLE_B',JSON.stringify({seed,temporada:row.season,pos:baseline.pos,pontos:baseline.pts,esperados:baseline.entradas.reduce((n,e)=>n+e.pontosEsperados,0),leve:leves.pts,semTecnico:semTecnico.pts,semDesgaste:semDesgaste.pts,variacoes:variants.map(v=>({pos:v.pos,pts:v.pts,sobe:v.sobe}))}))
}
report.completo=true;writeFileSync(output+'/controles.json',JSON.stringify(report,null,2))
