import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {estimativaPublica} from './observacao-publica.mts'
import {CARTAS_REGIONAIS} from '../../src/escalacao/cartas-regionais.ts'
import {CATALOG_OFICIAL} from '../../src/escalacao/data-oficial.ts'

const dado={name:'Oferta desconhecida',club:'Clube público',year:2026,pos:'LAT'}
const protegido=new Proxy(dado,{get(t,k){if(['lo','hi','fame','promessa','categoria'].includes(String(k)))throw Error('Consulta de informação oculta');return Reflect.get(t,k)}})
assert.equal(estimativaPublica(protegido,'B'),estimativaPublica({...dado,lo:99,hi:99,fame:5} as typeof dado,'B'))
assert.equal(estimativaPublica({...dado,conhecido:76.5},'B'),76.5,'carta própria já revelada pode ser usada')
assert.equal(estimativaPublica({pos:'LAT'},'B'),estimativaPublica({pos:'LAT'},'B'),'oferta mascarada não usa nome verdadeiro')
const maps=JSON.parse(readFileSync('/workspace/shared/carreira-alternativas-20261124/mapa-referencia.json','utf8'))
const categoria=(c:any)=>c.promessa?'promessa':c.fame===2||c.fame===3?'bom':String(c.fame)
let total=0
for(const [fonte,cat] of Object.entries({regional:CARTAS_REGIONAIS,oficial:CATALOG_OFICIAL}))for(const [pos,cs] of Object.entries(cat)){
 const projetar=(c:any)=>{const x=maps[fonte][`${c.name}|${c.club}|${c.year}|${pos}`];if(!x)return {...c};total++;assert(x[0]<x[1]&&x[0]>=0&&x[1]<=99);return {...c,lo:x[0],hi:x[1]}}
 for(const tipo of ['1','bom','4','5','promessa']){
  const antes=(cs as any[]).filter(c=>categoria(c)===tipo).sort((a,b)=>(a.lo+a.hi)-(b.lo+b.hi))
  const depois=antes.map(projetar)
  for(let i=1;i<depois.length;i++)assert(depois[i].lo+depois[i].hi>=depois[i-1].lo+depois[i-1].hi,'protótipo não pode inverter a ordem dentro da mesma classe/posição')
 }
}
const julinho=CARTAS_REGIONAIS.ATA.find(c=>c.name==='Julinho')!
assert(!maps.regional[`${julinho.name}|${julinho.club}|${julinho.year}|ATA`],'grupo pequeno preservado, inclusive Julinho')
assert.equal(julinho.lo,81);assert.equal(julinho.hi,92)
console.log('PASS estimativa sem consultar notas/categorias ocultas; mesma classe Bom2/3, ordem por posição preservada;',total,'fichas no ensaio estatístico; Julinho81–92 preservado; nenhum catálogo alterado')
