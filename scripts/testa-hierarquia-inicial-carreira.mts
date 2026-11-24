import {HIERARQUIA_INICIAL_CARREIRA} from '../src/escalacao/hierarquia-inicial-carreira'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {hierarquiaInicialBrasil,calibrarCartaCarreira} from '../src/escalacao/hierarquia-inicial-carreira'
import {reducer,INITIAL,catalogTodos,__sincronizaNiveis,salaryOfCard,clubesNacionaisDoMercado} from '../src/escalacao/store'
import {carregaBaralhoOficial} from '../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../src/escalacao/sport'
import {rankingGeralCarreira} from '../src/escalacao/ranking-clubes-carreira'
import {mulberry,buildPyramid,vinculaPlanosOficiais,fabricaTimesOficiais} from '../src/escalacao/pyramidseason'
import {FORMATIONS,SECTORS} from '../src/escalacao/types'
import {referenciaAtleta} from '../src/escalacao/carreira-economia'
import {faixaDeJogo,nivelDeJogo,aposContratacao,confereClubeDaLargada} from '../src/escalacao/forca-largada'
import {rollForm} from '../src/escalacao/pyramidseason'
import {perfilDoDia} from '../src/escalacao/motor2/motor'
import {entradaM2,resultadoM2,assinaturaEntradaM2,carregaGuardados,tiraNovos} from '../src/escalacao/motor2/carreira'

if(!HIERARQUIA_INICIAL_CARREIRA){console.log('SKIP experimento rejeitado por Diego; valide com testa-carreira-sem-ajuste-inicial.mts')}else{
_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
const raw=JSON.stringify(catalogTodos()),hierarquia=hierarquiaInicialBrasil()
assert.equal(hierarquia.length,228);assert.equal(new Set(hierarquia.map(c=>c.clube)).size,228)
assert.equal(hierarquia[0].clube,'Flamengo');assert.equal(hierarquia[1].clube,'Palmeiras')
assert(hierarquia.find(c=>c.clube==='Portuguesa')!.posicao>60,'Portuguesa não herda o ranking das cartas')
const make=(nome:string,seed:number)=>{const r=Math.random;Math.random=mulberry(seed);try{return reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:nome,formation:'4-3-3',rivals:5,oficial:{clube:nome}})}finally{Math.random=r}}
const times=(s:any)=>[...s.managers.map(m=>({nome:m.teamName,squad:m.squad})),...Object.entries(s.cpuSquads??{}).map(([nome,squad])=>({nome,squad}))]
const media=(sq:any[],f:'4-3-3'|'4-4-2')=>{const xi=SECTORS.flatMap(p=>sq.filter(c=>c.pos===p&&!c.fake).sort((a,b)=>nivelDeJogo(b)-nivelDeJogo(a)).slice(0,FORMATIONS[f][p]));return xi.length===11?xi.reduce((n,c)=>n+nivelDeJogo(c),0)/11:-Infinity}
let s=make('Portuguesa',20261123)
const snap=s.oficial!.forcaInicial!
assert(snap&&Object.keys(snap.clubes).length===228)
const mercado=clubesNacionaisDoMercado(s)
assert.equal(mercado.length,155,'mercado humano contempla todos os adversários A/B/C/D, igual aos bots')
assert.equal(new Set(mercado.map(c=>c.teamName)).size,155)
assert(mercado.some(c=>c.teamName==='Flamengo'),'humano da D vê a mesma oferta nacional')
for(const t of times(s)){
 const ref=snap.clubes[t.nome],forca=Math.max(media(t.squad,'4-3-3'),media(t.squad,'4-4-2'))
 assert(Math.abs(forca-ref.alvo)<.1,`${t.nome}: ${forca} versus ${ref.alvo}`)
 for(const c of t.squad){assert.equal(c.calibracaoCarreira?.versao,2);assert(c.lo>=25&&c.hi<=99&&c.lo<=c.hi);assert.equal(c.valorBaseCarreira,referenciaAtleta(c));assert.equal(salaryOfCard(c),Math.max(1,Math.round(referenciaAtleta(c)/10)))}
}
const julinho=s.managers[0].squad.find(c=>c.name==='Julinho')!
assert(julinho);assert.equal(julinho.lo,81);assert.equal(julinho.hi,92)
assert(nivelDeJogo(julinho)<70,'desempenho da largada ajustado sem mexer na carta')
const normal=aposContratacao(julinho)
assert.equal(normal.lo,81);assert.equal(normal.hi,92);assert.equal(nivelDeJogo(normal),86.5)
assert.equal(referenciaAtleta(julinho),referenciaAtleta(normal),'ajuste não altera preço ou salário')
assert.equal(aposContratacao(julinho,true),julinho,'recuperar o próprio anúncio não simula uma venda')
assert.equal(confereClubeDaLargada(normal,'Portuguesa'),normal,'retorno após negócio real não religa ajuste')
assert.equal(nivelDeJogo(confereClubeDaLargada(julinho,'Flamengo')),86.5,'rede de troca de dono encerra ajuste')
assert.deepEqual(julinho,s.managers[0].squad.find(c=>c.name==='Julinho'),'projeções não modificam o elenco')
const explicita={...julinho,...faixaDeJogo(julinho),calibracaoCarreira:undefined}
assert.deepEqual(rollForm([julinho],'equilibrio','equilibrio',()=>.6),rollForm([explicita],'equilibrio','equilibrio',()=>.6),'motor estatístico lê desempenho separado')
assert.deepEqual(perfilDoDia(julinho,'ATA',0,{seed:43}),perfilDoDia(explicita,'ATA',0,{seed:43}),'motor físico usa ajuste uma vez, inclusive forma do dia')
assert(perfilDoDia(normal,'ATA',0,{seed:43}).perfil.nivel>perfilDoDia(julinho,'ATA',0,{seed:43}).perfil.nivel,'contratação libera força no motor físico')
const estrangeiro={...julinho,club:'Barcelona',calibracaoCarreira:undefined}
assert.equal(calibrarCartaCarreira(estrangeiro,snap),estrangeiro,'calibração brasileira não atinge acervo estrangeiro')
const xi=SECTORS.flatMap(p=>s.managers[0].squad.filter(c=>c.pos===p).slice(0,FORMATIONS['4-3-3'][p]))
const adversario=s.managers[1].squad
const entrada=entradaM2({seed:456,casa:xi,fora:SECTORS.flatMap(p=>adversario.filter(c=>c.pos===p).slice(0,FORMATIONS['4-3-3'][p])),tatica:[0,0],bots:[false,true],partidaId:'teste-largada',preservarGuardado:true,versao:undefined})
const assinAntes=assinaturaEntradaM2(entrada),entradaLivre={...entrada,casa:entrada.casa.map(c=>aposContratacao({...c,lo:c.lo!,hi:c.hi!}))}
assert.notEqual(assinaturaEntradaM2(entradaLivre),assinAntes,'cache distingue jogador ajustado e contratado')
carregaGuardados(undefined,1,'teste-largada');const placarCongelado=resultadoM2(entrada),guardados=tiraNovos()!
assert(Object.keys(guardados).length)
const congelado=Object.values(guardados)[0][5]!
assert(congelado.casa[0].calibracaoCarreira,'fotografia do jogo guarda ajuste para reabrir estável')
carregaGuardados(guardados,1,'teste-largada')
assert.deepEqual(resultadoM2({...entradaLivre,preservarGuardado:true}),placarCongelado,'venda posterior não reescreve partida oficial')
const legadoV1=structuredClone(s),jAntigo=legadoV1.managers[0].squad.find(c=>c.name==='Julinho')!
legadoV1.oficial!.forcaInicial!.versao=1
jAntigo.lo=62.8;jAntigo.hi=73.8;jAntigo.calibracaoCarreira={versao:1,ciclo:'teste-antigo',origem:'Portuguesa',loCatalogo:81,hiCatalogo:92}
const corrigido=__sincronizaNiveis(legadoV1).managers[0].squad.find(c=>c.name==='Julinho')!
assert.equal(corrigido.lo,81);assert.equal(corrigido.hi,92);assert.equal(corrigido.calibracaoCarreira?.versao,2,'restaura bancada v1 local')
const before=JSON.stringify(times(s)),reload=__sincronizaNiveis(structuredClone(s))
assert.equal(JSON.stringify(times(reload)),before,'F5/sincronização não restaura over do catálogo')
assert.equal(calibrarCartaCarreira(julinho,snap),julinho,'não acumula ajuste de largada')
assert.equal(calibrarCartaCarreira(normal,snap),normal,'contratação nunca ganha ajuste novamente')
const promoted=structuredClone(s);promoted.seasonNo=8;promoted.careerPlacements!.m0='A'
assert.deepEqual(promoted.managers[0].squad,s.managers[0].squad,'subir e passar temporadas não dá over')
assert.equal(JSON.stringify(hierarquiaInicialBrasil()),JSON.stringify(hierarquia),'ranking inicial independente das mudanças no elenco')
const world=vinculaPlanosOficiais(buildPyramid(s.managers,0,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,true),s)
const fabrica=fabricaTimesOficiais(world,s.seed)!
const semSerie=hierarquia.find(c=>c.divisao==='E')!.clube
assert.deepEqual(fabrica(semSerie)!.t.squad,s.cpuSquads![semSerie],'estadual usa a ficha guardada, na mesma régua')
const lotes=SECTORS.flatMap(p=>s.deck[p]);assert(lotes.length)
for(const c of lotes){assert(!c.calibracaoCarreira,'sobras do pregão sem ajuste para qualquer comprador');assert.equal(nivelDeJogo(c),(c.lo+c.hi)/2)}
const legado=structuredClone(s);delete legado.oficial!.forcaInicial
for(const t of times(legado))for(const c of t.squad){delete c.calibracaoCarreira}
assert(!__sincronizaNiveis(legado).oficial!.forcaInicial,'carreira antiga não adere sem começar de novo')
assert.equal(JSON.stringify(catalogTodos()),raw,'coleção, baralhos e catálogo canônico intactos')
for(const nome of ['Gama','Flamengo']){
 const outro=make(nome,20261123)
 for(const [cl,c] of Object.entries(outro.oficial!.forcaInicial!.clubes))assert.deepEqual(c,snap.clubes[cl],'mesma regra sem distinguir clube humano/bot: '+cl)
}
const root='/workspace/shared/largada-oculta-20261124';mkdirSync(root,{recursive:true})
const resultado={hierarquia:hierarquia.map(c=>({posicao:c.posicao,clube:c.clube,divisao:c.divisao,alvo:c.alvo,rnc:c.rnc,campanha2025:c.campanha2025})),atual:rankingGeralCarreira(s),exemplos:['Flamengo','Palmeiras','Portuguesa','Gama'].map(nome=>({nome,...snap.clubes[nome]})),julinho:{lo:julinho.lo,hi:julinho.hi,desempenhoInicial:faixaDeJogo(julinho),aposContratacao:faixaDeJogo(normal)}}
writeFileSync(root+'/verificacao.json',JSON.stringify(resultado,null,2))
writeFileSync(root+'/hierarquia-inicial.csv','\uFEFF'+['posição;clube;divisão;força inicial alvo;posição RNC;fonte RNC',...hierarquia.map(c=>`${c.posicao};${c.clube};${c.divisao};${c.alvo.toFixed(1).replace('.',',')};${c.rnc?.posicao??''};${c.rnc?'CBF2026':'não listado'}`)].join('\n')+'\n')
console.log('PASS228clubes: hierarquia prévia, calibração, nomes, economia, pregão, reload, mercado, promoção, coleção e paridade humano/bot')
console.log('EXEMPLOS',JSON.stringify(resultado.exemplos),'JULINHO',JSON.stringify(resultado.julinho))

}
