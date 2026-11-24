// Diagnóstico somente: compara a receita antiga com a oficial e suas fontes de cartas.
import {mkdirSync,writeFileSync} from 'node:fs'
import {CATALOG,CATALOG_EU,CATALOG_WORLD} from '../../src/escalacao/data'
import {CARTAS_REGIONAIS} from '../../src/escalacao/cartas-regionais'
import {CATALOG_OFICIAL} from '../../src/escalacao/data-oficial'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../../src/escalacao/sport'
import {reducer,INITIAL} from '../../src/escalacao/store'
import {buildPyramid,seedCpuSquads,mulberry} from '../../src/escalacao/pyramidseason'
await carregaBaralhoOficial();_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true)
const mid=(c:any)=>(c.lo+c.hi)/2,mean=(ns:number[])=>ns.length?ns.reduce((a,b)=>a+b,0)/ns.length:null
const report:any={fontes:{},mundos:[]}
for(const [fonte,cat] of Object.entries({principal:CATALOG,europa:CATALOG_EU,mundo:CATALOG_WORLD,regional:CARTAS_REGIONAIS,oficial:CATALOG_OFICIAL})){
 const cs=Object.values(cat).flat() as any[],res:any={}
 for(const tipo of ['profissional','bom','promessa','craque','lenda']){
  const xs=cs.filter(c=>(c.promessa?'promessa':c.fame>=5?'lenda':c.fame===4?'craque':c.fame>=2?'bom':'profissional')===tipo)
  const freq=new Map<string,number>();for(const c of xs){const k=c.lo+'–'+c.hi;freq.set(k,(freq.get(k)??0)+1)}
  res[tipo]={n:xs.length,media:mean(xs.map(mid)),faixasMaisFrequentes:[...freq].sort((a,b)=>b[1]-a[1]).slice(0,5)}
 }
 report.fontes[fonte]=res
}
for(const seed of [20261123,7919001,871217]){
 const save=Math.random;Math.random=mulberry(seed)
 const s=reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:'Portuguesa',formation:'4-3-3',rivals:5,oficial:{clube:'Portuguesa'}});Math.random=save
 const me={...s.managers[0],teamName:'Fixture do usuário'}
 // Controle com mesmo elenco humano, outro receituário de adversários. Não é uma carreira inteira.
 const cp=seedCpuSquads([me],s.seed,'todos',true)
 const antigo=buildPyramid([me],0,s.seed,'todos',{m0:'V'},cp,false)
 const oficial=buildPyramid(s.managers,0,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,true)
 const resumo=(w:any)=>Object.fromEntries(['A','B','C','D'].map(d=>[d,{n:w[d].length,mediaXI:mean(w[d].map(t=>mean(t.xi.map(mid)))),equipes:w[d].map(t=>({nome:t.name,media:mean(t.xi.map(mid))}))}]))
 report.mundos.push({seed,antigo:resumo(antigo),oficial:resumo(oficial),nota:'Receita antiga usa baralho todos e divide o pool por força; oficial usa clubes reais e cartas próprias. Não equivale a uma experiência causal isolada.'})
}
const root='/workspace/shared/carreira-alternativas-20261124';mkdirSync(root,{recursive:true});writeFileSync(root+'/comparacao.json',JSON.stringify(report,null,2))
// Alternativa experimental: alinhar distribuições por categoria/posição sem dar
// força por divisão. Conserva ordem e empates; grupos pequenos não são alterados.
const grupo=(c:any)=>c.promessa?'promessa':c.fame===2||c.fame===3?'bom':String(c.fame)
const maps:any={regional:{},oficial:{}}
for(const [fonte,cat] of Object.entries({regional:CARTAS_REGIONAIS,oficial:CATALOG_OFICIAL}))for(const [pos,cs] of Object.entries(cat)){
 for(const tipo of ['1','bom','4','5','promessa']){
  const origem=(cs as any[]).filter(c=>grupo(c)===tipo).sort((a,b)=>mid(a)-mid(b))
  const destino=(Object.entries({CATALOG,CATALOG_EU,CATALOG_WORLD}).flatMap(([,cat])=>(cat as any)[pos]) as any[]).filter(c=>grupo(c)===tipo).sort((a,b)=>mid(a)-mid(b))
  if(origem.length<8||destino.length<8)continue
  for(const c of origem){
   const primeiro=origem.findIndex(x=>mid(x)===mid(c)),ultimo=origem.findLastIndex(x=>mid(x)===mid(c)),q=(primeiro+ultimo)/2/(origem.length-1),idx=q*(destino.length-1),a=destino[Math.floor(idx)],b=destino[Math.ceil(idx)],fr=idx-Math.floor(idx)
   const lo=Math.round(a.lo+(b.lo-a.lo)*fr),hi=Math.max(lo+1,Math.round(a.hi+(b.hi-a.hi)*fr))
   maps[fonte][`${c.name}|${c.club}|${c.year}|${pos}`]=[lo,hi]
  }
 }
}
writeFileSync(root+'/mapa-referencia.json',JSON.stringify(maps))
const port=Object.entries(CARTAS_REGIONAIS).flatMap(([pos,cs])=>cs.filter(c=>c.club==='Portuguesa').map(c=>({...c,pos})))
const need={GOL:1,LAT:2,ZAG:2,MEI:3,ATA:3},xi=(cs:any[])=>Object.entries(need).flatMap(([pos,n])=>cs.filter(c=>c.pos===pos).sort((a,b)=>mid(b)-mid(a)).slice(0,n))
const depois=port.map(c=>{const m=maps.regional[`${c.name}|${c.club}|${c.year}|${c.pos}`];return m?{...c,lo:m[0],hi:m[1]}:c})
console.log('PROTOTIPO_ESCALA',JSON.stringify({antes:mean(xi(port).map(mid)),depois:mean(xi(depois).map(mid)),julinhoAntes:port.find(c=>c.name==='Julinho'),julinhoDepois:depois.find(c=>c.name==='Julinho'),nota:'Protótipo estatístico, não avaliação factual nem alteração do produto; categorias e nomes preservados.'}))
for(const [f,rs] of Object.entries(report.fontes) as any)console.log('FONTE',f,JSON.stringify(rs))
for(const w of report.mundos)console.log('MUNDO',w.seed,JSON.stringify(Object.fromEntries(['antigo','oficial'].map(k=>[k,Object.fromEntries(Object.entries(w[k]).map(([d,v]:any)=>[d,{n:v.n,media:v.mediaXI}]))]))))
