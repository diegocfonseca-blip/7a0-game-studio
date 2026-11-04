// 🇧🇷 Tradições do bairro (04/11): feira só sábado/domingo de manhã · pelada só de tarde · banca sem spoiler · lugares sem colisão.
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
registerHooks({
 resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=new URL(s+'.ts',c.parentURL);if(existsSync(p))return{url:p.href,shortCircuit:true}}return n(s,c)},
})
const B=await import('../../src/escalacao/presidencia-bairro-tradicoes.ts')
const V=await import('../../src/escalacao/presidencia-cidade-viva.ts')

// ── 1) dia da semana pelo calendário da carreira (nunca o relógio do aparelho) ─────────────────────
const SAB=Date.UTC(2027,1,6),DOM=Date.UTC(2027,1,7),SEG=Date.UTC(2027,1,8),QUI=Date.UTC(2027,1,4),QUA=Date.UTC(2027,1,3)
assert.equal(B.diaDaSemanaBairro({dia:SAB}),6);assert.equal(B.diaDaSemanaBairro({dia:DOM}),0)
assert.equal(B.diaDaSemanaBairro({dia:SEG}),1);assert.equal(B.diaDaSemanaBairro({dia:QUI}),4)
assert.equal(B.diaDaSemanaBairro({dia:SAB+10*3600000}),6,'qualquer hora do sábado ainda é sábado')

// ── 2) 🍅 feira: só sábado e domingo DE MANHÃ ───────────────────────────────────────────────────────
for(const dia of [SAB,DOM])for(const hora of [7,9,11]){const v=B.vidaDoBairro({dia,hora});assert.equal(v.periodo,'manha');assert.equal(v.feira,true,`feira aberta ${dia} ${hora}h`)}
for(const dia of [SAB,DOM])for(const hora of [12,15,16,21]){assert.equal(B.vidaDoBairro({dia,hora}).feira,false,`feira fechada ${hora}h do fim de semana`)}
for(const dia of [SEG,QUA,QUI,Date.UTC(2027,1,5),Date.UTC(2027,1,9)])for(const hora of [8,10,15,21])assert.equal(B.vidaDoBairro({dia,hora}).feira,false,'dia de semana nunca tem feira')
assert.equal(B.vidaDoBairro({dia:SAB,hora:9,luz:'night'}).feira,false,'noite do mapa ganha da hora')
assert.equal(B.vidaDoBairro({dia:SAB}).feira,true,'sábado sem compromisso = manhã de feira')
assert.equal(B.vidaDoBairro({dia:SAB,hora:16}).feira,false,'sábado de jogo às 16h: tarde, sem feira')

// ── 3) ⚽ pelada: só de tarde ───────────────────────────────────────────────────────────────────────
for(const hora of [12,15,16,17])assert.equal(B.vidaDoBairro({dia:QUI,hora}).pelada,true,`pelada ${hora}h`)
for(const hora of [6,9,11,18,21,23])assert.equal(B.vidaDoBairro({dia:QUI,hora}).pelada,false,`sem pelada ${hora}h`)
assert.equal(B.vidaDoBairro({dia:QUI,hora:15,luz:'night'}).pelada,false,'noite: campinho vazio')
assert.equal(B.vidaDoBairro({dia:QUI}).pelada,true,'dia de semana sem compromisso = tarde da molecada')
for(let d=0;d<14;d++)for(const hora of [undefined,8,10,14,16,21]){const v=B.vidaDoBairro({dia:SAB+d*86400000,hora});assert(!(v.feira&&v.pelada),'feira e pelada nunca no mesmo período')}

// ── 4) sem calendário: regra estável pela rodada (mesmo save = mesma cidade) ───────────────────────
for(let r=0;r<10;r++){const a=B.vidaDoBairro({temporada:3,rodada:r}),b=B.vidaDoBairro({temporada:3,rodada:r});assert.deepEqual(a,b);assert.equal(a.calendario,false);assert(a.feira!==a.pelada,'sem calendário alterna feira (sábado) e pelada (quinta)')}
assert.equal(B.vidaDoBairro({temporada:3,rodada:1}).feira,true);assert.equal(B.vidaDoBairro({temporada:3,rodada:2}).pelada,true)
assert.doesNotThrow(()=>B.vidaDoBairro());assert.doesNotThrow(()=>B.vidaDoBairro({dia:NaN,hora:Infinity,rodada:NaN}))

// ── 5) 📰 manchete: só o último jogo JÁ APITADO, nunca spoiler, nunca lixo ─────────────────────────
const neutra=B.mancheteDaBanca(null,'Tricolor FC',false)
assert.equal(neutra.titulo,'O PREGÃO ESTÁ ABERTO','sem jogo apitado: a manchete do pregão')
assert.equal(B.mancheteDaBanca(undefined,undefined,true).titulo,'THE AUCTION IS OPEN')
for(const lixo of [{gf:-1,ga:0},{gf:1.5,ga:0},{gf:NaN,ga:1},{gf:200,ga:0}])assert.equal(B.mancheteDaBanca(lixo,'X',false).titulo,'O PREGÃO ESTÁ ABERTO','placar inválido não vira manchete')
assert.match(B.mancheteDaBanca({gf:2,ga:1},'Tricolor FC',false).titulo,/^VITÓRIA! 2 × 1$/)
assert.match(B.mancheteDaBanca({gf:0,ga:3},'Tricolor FC',false).titulo,/^TROPEÇO: 0 × 3$/)
assert.match(B.mancheteDaBanca({gf:1,ga:1},'Tricolor FC',true).titulo,/^DRAW: 1 × 1$/)
assert.match(B.mancheteDaBanca({gf:2,ga:1},'Tricolor FC',false).linha,/TRICOLOR FC/)
// o dado que chega na banca é o mesmo da cidade viva: enquanto o placar não apareceu (ultimoJogo null), não há placar
const fonte={seasonNo:4,round:9,careerTitles:[],cupHistory:[]}
const antes=V.cidadeVivaDaCarreira(fonte,1,undefined,{ultimoJogo:null,dia:SAB,hora:16})
assert.equal(antes.placar,undefined,'antes do apito: nada de placar na cidade')
assert.equal(B.mancheteDaBanca(antes.placar,'X',false).titulo,'O PREGÃO ESTÁ ABERTO','antes do apito: a banca não entrega o resultado')
const depois=V.cidadeVivaDaCarreira(fonte,1,undefined,{ultimoJogo:{gf:3,ga:0},dia:SAB,hora:16})
assert.deepEqual(depois.placar,{gf:3,ga:0});assert.equal(depois.dia,SAB);assert.equal(depois.hora,16)

// ── 6) lugares: banca/feira/campinho nascem do bairro e não encostam em sólido ─────────────────────
const quadras=[];for(let x=-87;x<=87;x+=29)for(let z=200;z<=316;z+=29)quadras.push({x,z})
const ruas=[];for(const q of quadras)for(const [dx,dz] of [[29,0],[0,29]]){const a={x:q.x+dx/2-(dz?14.5:0),z:q.z+dz/2-(dx?14.5:0)};ruas.push([a,{x:a.x+(dz?29:0),z:a.z+(dx?29:0)}])}
const solidos=quadras.map(q=>({minX:q.x-7,maxX:q.x+7,minZ:q.z-7,maxZ:q.z+7}))
solidos.push({minX:-400,maxX:400,minZ:-400,maxZ:400,base:9},{minX:-200,maxX:200,minZ:-200,maxZ:200,footprint:[{x:-200,z:-200},{x:-190,z:-200},{x:-190,z:-190}]})
const L=B.lugaresDoBairro({quadras,ruas,campinho:{x:300,z:300},boteco:{x:0,z:258},solidos})
assert(L.banca,'achou banca');assert(L.feira,'achou rua de feira');assert.deepEqual(L.campinho,{x:300,z:300})
const livre=(p,m)=>!solidos.some(s=>(s.base??0)<2.6&&!s.footprint&&p.x>s.minX-m&&p.x<s.maxX+m&&p.z>s.minZ-m&&p.z<s.maxZ+m)
assert(livre(L.banca,2.2),'banca fora de qualquer prédio')
for(const t of [0,.25,.5,.75,1])assert(livre({x:L.feira.a.x+(L.feira.b.x-L.feira.a.x)*t,z:L.feira.a.z+(L.feira.b.z-L.feira.a.z)*t},.4),'rua da feira livre')
assert(Math.hypot(L.banca.x-0,L.banca.z-267)>=9,'a frente do boteco (mesas) fica livre')
assert.deepEqual(B.lugaresDoBairro({quadras:[],ruas:[],solidos:[]}),{},'bairro vazio: nada (sem erro)')
console.log('PASS test-bairro-tradicoes')
