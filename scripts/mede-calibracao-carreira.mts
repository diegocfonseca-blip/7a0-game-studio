import {mkdirSync,writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {CATALOG,CATALOG_EU} from '../src/escalacao/data'
import {novoMotor2,type EntradaM2} from '../src/escalacao/motor2/carreira'
import {VERSAO_CRITERIOS_RECEPCAO_M2} from '../src/escalacao/motor2/versao'
import {variaveisGols} from '../src/escalacao/calibracao-bots-carreira'
const all=Object.entries(CATALOG).flatMap(([pos,cs])=>cs.map(c=>({...c,pos}))).concat(Object.entries(CATALOG_EU).flatMap(([pos,cs])=>cs.map(c=>({...c,pos}))))
const fs=[['4-3-3',[1,2,2,3,3]],['4-4-2',[1,2,2,4,2]],['4-5-1',[1,2,2,5,1]],['3-4-3',[1,2,1,4,3]],['5-3-2',[1,2,3,3,2]]] as const
const bands=[[1],[1,2],[2],[2,3],[3],[3,4],[4],[4,5],[5]]
const rng=(seed:number)=>()=>{seed|=0;seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
const team=(r:()=>number,f:number[],need:readonly number[])=>['GOL','LAT','ZAG','MEI','ATA'].flatMap((pos,k)=>{const pool=all.filter(c=>c.pos===pos&&f.includes(c.fame));return Array.from({length:need[k]},()=>({...pool[Math.floor(r()*pool.length)]}))})
const N=Number(process.argv[2]??600),rows:any[]=[]
for(let i=0;i<N;i++){const r=rng(6137901+i*7919),fa=fs[Math.floor(r()*fs.length)],fb=fs[Math.floor(r()*fs.length)],bandsA=bands[Math.floor(r()*9)],bandsB=i%3===0?bandsA:bands[Math.floor(r()*9)];const e:EntradaM2={seed:Math.floor(r()*0xffffffff),casa:team(r,bandsA,fa[1]),fora:team(r,bandsB,fb[1]),fCasa:fa[0],fFora:fb[0],tatica:[Math.floor(r()*3)-1,Math.floor(r()*3)-1],bots:[true,true],clima:r()<.12?'chuva':'sol',versao:VERSAO_CRITERIOS_RECEPCAO_M2};const m=novoMotor2(e);for(let n=1;n<=120&&!m.fim;n++)m.avancaAte(n);if(!m.fim||m.diag.erros.length)throw Error('Partida inválida');rows.push({i,training:i%5!==0,seed:e.seed,x:[variaveisGols(e,0),variaveisGols(e,1)],goals:[...m.placar],shots:[...m.stats.chutes]});if(i%100===99)console.log(i+1,'jogos')}
const output=process.env.CARREIRA_TEST_OUTPUT??join(tmpdir(),'leilao-criterios');mkdirSync(output,{recursive:true});writeFileSync(join(output,'amostra-calibracao.json'),JSON.stringify(rows));console.log('Final:',N)
