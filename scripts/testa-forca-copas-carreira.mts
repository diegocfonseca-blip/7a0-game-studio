import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {reducer,INITIAL} from '../src/escalacao/store'
import {carregaBaralhoOficial} from '../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../src/escalacao/sport'
import {buildPyramid,fabricaTimesOficiais,mulberry} from '../src/escalacao/pyramidseason'
import {inscricoesConmebolDaTemporada} from '../src/escalacao/conmebol-temporada'
import {novoMotor2} from '../src/escalacao/motor2/carreira'
import {VERSAO_CRITERIOS_RECEPCAO_M2} from '../src/escalacao/motor2/versao'

_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
const old=Math.random;Math.random=mulberry(20261123)
const s=reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:'Gama',formation:'4-3-3',rivals:5,oficial:{clube:'Gama'}})
Math.random=old
const make=(pl=s.careerPlacements)=>buildPyramid(s.managers,0,s.seed,s.deckLeague,pl,s.cpuSquads,true)
const world=make(),gama=world.D.find(t=>t.you)!,fla=world.A.find(t=>t.name==='Flamengo')!
const cards=(t:any)=>t.xi.map(c=>[c.name,c.pos,c.lo,c.hi,c.fame])
const promoted=make({...s.careerPlacements,m0:'A'}).A.find(t=>t.you)!
assert.deepEqual(cards(promoted),cards(gama),'subir de divisão não aumenta força nem troca cartas')
assert.deepEqual(cards(fabricaTimesOficiais(world,s.seed)!('Gama')!.t),cards(gama),'copa usa o mesmo elenco, sem versão melhorada')
const cls=[...world.A.map(t=>t.name).slice(0,19),'Gama']
const reference={serieA:cls,copa:'Flamengo',copaVice:'Palmeiras',liberta:'River Plate',sula:'Lanús'}
const vagas=inscricoesConmebolDaTemporada(reference,2,1)
const lista=(v:any)=>[...(v.grupos??[]),...(v.fase2??[]),...(v.fase1??[])]
assert(!lista(vagas.liberta).includes('Gama'),'só estar na A não dá Libertadores')
const top={...reference,serieA:['Gama',...cls.filter(n=>n!=='Gama')]}
assert(lista(inscricoesConmebolDaTemporada(top,2,1).liberta).includes('Gama'),'boa campanha dá vaga pelo critério esportivo')

const avg=(cs:any[])=>cs.reduce((n,c)=>n+(c.lo+c.hi)/2,0)/cs.length
const results:any={regras:{promocaoNaoDaForca:true,copaMantemElenco:true,vagaPorCampanha:true},gama:{forca:avg(gama.xi),cartas:cards(gama)},flamengo:{forca:avg(fla.xi),cartas:cards(fla)},nativo:[],controle:[]}
function jogo(casa:any[],fora:any[],seed:number){
 const m=novoMotor2({seed,casa,fora,fCasa:'4-3-3',fFora:'4-3-3',tatica:[0,0],bots:[true,true],clima:'sol',versao:VERSAO_CRITERIOS_RECEPCAO_M2})
 for(let n=1;n<=120&&!m.fim;n++)m.avancaAte(n)
 assert(m.fim&&!m.diag.erros.length)
 return [...m.placar]
}
for(let k=0;k<40;k++){
 const seed=(6137901+Math.imul(k,7919))>>>0,home=k%2===0
 const r=jogo(home?gama.xi:fla.xi,home?fla.xi:gama.xi,seed)
 results.nativo.push({seed,gamaCasa:home,gama:r[home?0:1],flamengo:r[home?1:0]})
 // Controle de laboratório: mesmos nomes/estilos, só o nível varia. Nunca grava catálogo.
 const forte=gama.xi.map(c=>({...c,lo:85,hi:85})),fraco=gama.xi.map(c=>({...c,lo:55,hi:55}))
 const c=jogo(home?forte:fraco,home?fraco:forte,seed)
 results.controle.push({seed,forte:c[home?0:1],fraco:c[home?1:0]})
}
assert(results.controle.filter(r=>r.forte>r.fraco).length>results.controle.filter(r=>r.fraco>r.forte).length,'mesmas equipes: qualidade superior precisa pesar no conjunto')
const root='/workspace/shared/carreira-justa-20261123';mkdirSync(root,{recursive:true});writeFileSync(root+'/forca-e-vagas.json',JSON.stringify(results,null,2))
for(const key of ['nativo','controle']){
 const [a,b]=key==='nativo'?['gama','flamengo']:['forte','fraco'],rs=results[key]
 console.log('FORCA',key,JSON.stringify({v:rs.filter(r=>r[a]>r[b]).length,e:rs.filter(r=>r[a]===r[b]).length,d:rs.filter(r=>r[a]<r[b]).length,gols:rs.reduce((n,r)=>n+r[a],0),contra:rs.reduce((n,r)=>n+r[b],0)}))
}
console.log('PASS força por atleta, preservação nas copas/promoção e qualificação por campanha',JSON.stringify({gama:results.gama.forca,flamengo:results.flamengo.forca}))
