import assert from 'node:assert/strict'
import {cenasDoBairro} from '../src/escalacao/cenas-bairro-central'
import {fatosDoBairro} from '../src/escalacao/cenas-bairro-fatos'
import {publicarCenaCentral,quadroCentral,repetirCenaCentral} from '../src/escalacao/cena-central-playback'
import {publicarCena} from '../src/escalacao/cenas-bairro-playback'
const card={id:'real',name:'Romário',club:'Vasco',year:2000,fame:5},m:any={id:0,teamName:'Clube',squad:[card]}
const purchase={season:3,round:0,team:'Clube',name:card.name,club:card.club,year:card.year,paid:5,from:'Origem'}
const s:any={seasonNo:3,round:0,careerTransferHistory:[purchase]}
const facts=fatosDoBairro(s,m)
assert.equal(facts.length,1,'a lenda contratada por pouco também é um fato relevante')
assert.deepEqual(fatosDoBairro({...s,careerTransferHistory:[{...purchase,from:'Clube'}]},m),[],'recompra própria não inventa chegada')
const base={chave:'seed:3:0',carreiraKey:'seed:0',temporada:3,rodada:0,clube:'Clube',t:(p:string)=>p,imagens:{estadio:'e',clube:'c',noite:'n',carreata:'t',obra:'o',festa:'f',triste:'x',feira:'y'}}
const scenes=cenasDoBairro({...base,fatos:facts,mapaDisponivel:false,chegadaIlustrada:true,carreata:true,tituloId:'trophy'})
assert.equal(scenes.length,1);assert.equal(scenes[0].acao,'contratacao');assert.equal(scenes[0].apresentacaoCentral,true)
assert.deepEqual(cenasDoBairro({...base,fatos:facts,mapaDisponivel:false}),[],'sem ativação explícita não altera outros esportes/modos')
const seen={seen:[{id:scenes[0].chave,group:scenes[0].grupo,kind:scenes[0].acao,season:3,round:0}],sales:[]}
assert.equal(cenasDoBairro({...base,fatos:facts,mapaDisponivel:false,chegadaIlustrada:true,diario:seen}).length,0)
publicarCenaCentral('a','playing',2.2)
const before=quadroCentral('a');publicarCenaCentral('a','playing',2.24);assert.equal(quadroCentral('a'),before)
publicarCena({key:'mapa','phase':'playing',seconds:6,duration:7});assert.equal(quadroCentral('a'),before,'o mapa não altera o relógio ilustrado')
repetirCenaCentral('a');assert.equal(quadroCentral('a').seconds,0)
publicarCenaCentral('a','ended',12,0);assert.equal(quadroCentral('a').phase,'loading','quadro antigo não termina a repetição nova')
publicarCenaCentral('a','playing',3,1);assert.equal(quadroCentral('a').seconds,3)
publicarCenaCentral('b','playing',8);assert.equal(quadroCentral('a').seconds,3)
for(let i=0;i<15;i++)publicarCenaCentral('limit'+i,'ended',12)
assert.equal(quadroCentral('a').key,'','memória de reprodução é limitada')
console.log('PASS apresentação na Central: fato atual, compra barata de lenda, sem recompra falsa, sem mapa, isolamento, repetição, relógios independentes e cache limitado')
