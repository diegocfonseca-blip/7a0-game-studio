import assert from 'node:assert/strict'
import {cenasDoBairro,guardarCenasLidas,lerCenasLidas} from '../src/escalacao/cenas-bairro-central'
import {planoCenaCompacta} from '../src/escalacao/mapa-compacto/cenas'
import {caixa} from '../src/escalacao/mapa-compacto/model'
const base={chave:'carreira-1:2:8',temporada:2,rodada:8,clube:'Brasiliense',t:(p:string)=>p,imagens:{estadio:'estadio',clube:'clube',noite:'noite',carreata:'carreata',obra:'obra',festa:'festa',triste:'triste',feira:'feira'}}
assert.deepEqual(cenasDoBairro(base),[],'não inventa acontecimento sem fonte')
const cenas=cenasDoBairro({...base,carreata:true,evento:{nome:'Atleta',status:'banco'},obras:[{obra:'loja'}],ultimo:{gf:4,ga:0,rival:true},desfecho:{tipo:'acesso',para:'Série B'}})
assert.equal(cenas.length,5);assert.equal(cenas[0].vista,'city-street');assert.match(cenas[1].titulo,/Acesso confirmado/);assert.match(cenas.at(-1)!.titulo,/clássico/)
assert.equal(new Set(cenas.map(c=>c.chave)).size,cenas.length)
const empate=cenasDoBairro({...base,ultimo:{gf:1,ga:1}})[0];assert.match(empate.titulo,/Empate/)
const outras=cenasDoBairro({...base,rodada:9,ultimo:{gf:1,ga:0}})[0],mesma=cenasDoBairro({...base,rodada:10,ultimo:{gf:1,ga:0}})[0];assert.notEqual(outras.titulo,mesma.titulo,'resenha varia sem mexer no placar')
assert.equal(cenasDoBairro({...base,evento:{nome:'Atleta',variante:'futevolei',status:'campo'}})[0].vista,'clube-lazer')
const storage=new Map<string,string>();Object.assign(globalThis,{localStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)}})
guardarCenasLidas(Array.from({length:120},(_,i)=>'cena-'+i));assert.equal(lerCenasLidas().length,80);assert.equal(lerCenasLidas()[0],'cena-40')
for(const a of [.55,1.3,2.8]){
 const p=planoCenaCompacta('boteco-oswaldo',a)!,b=caixa('Boteco')!;assert(p.target[2]>b.maxZ,'olha a calçada, não o centro do telhado');assert(p.camera[2]>p.target[2]);assert(p.camera[1]<10,'plano baixo da ação');assert(p.target.every(Number.isFinite)&&p.camera.every(Number.isFinite))
}
assert.equal(planoCenaCompacta('region',1),undefined,'visão geral nativa preservada')
console.log('PASS cenas reais: prioridade, acesso, título, clássico, empate, variação, fila limitada e câmera da ação')
