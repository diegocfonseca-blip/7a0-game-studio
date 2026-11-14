// 🇧🇷 Tradições do bairro (04/11): feira só sábado/domingo de manhã · pelada só de tarde · banca sem spoiler · lugares sem colisão.
// + o dia inteiro: padaria/Kombi/bicicleta só de manhã · varal/praça só de tarde · espetinho/podrão/cadeiras/TV só de noite ·
//   camelô/gato/flanelinha só no dia de jogo EM CASA · ninguém encosta em casa, rua da feira, barraca oficial, fila ou perua.
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

// ── 7) 🌅☀️🌙 o dia inteiro: cada coisa no seu período (pelo calendário, nunca pelo relógio do aparelho) ───────────────
for(let d=0;d<7;d++)for(const hora of [6,8,11,12,14,17,18,21,23]){
 const v=B.vidaDoBairro({dia:SEG+d*86400000,hora}),manha=hora<12,tarde=hora>=12&&hora<18,noite=hora>=18
 assert.equal(v.padaria,manha);assert.equal(v.entregas,manha,'bicicleta do pão e Kombi do gás: só de manhã')
 assert.equal(v.varal,tarde);assert.equal(v.praca,tarde,'varal, carrinhos e dominó: só de tarde')
 assert.equal(v.espetinho,noite);assert.equal(v.cadeiras,noite);assert.equal(v.tv,noite,'espetinho, podrão, cadeira e TV: só de noite')
 assert.equal([v.padaria,v.varal,v.espetinho].filter(Boolean).length,1,'um período por vez')
 assert.equal(v.jogoEmCasa,false,'sem jogo em casa, sem camelô')
}
assert.equal(B.vidaDoBairro({dia:QUA,hora:9,luz:'night'}).espetinho,true,'a noite do mapa (refletor) ganha da hora')
assert.equal(B.vidaDoBairro({dia:DOM,hora:16,jogoEmCasa:true}).jogoEmCasa,true)
assert.equal(B.vidaDoBairro({dia:DOM,hora:16,jogoEmCasa:'sim'}).jogoEmCasa,false,'só true liga o dia de jogo')
assert.equal(B.vidaDoBairro({dia:QUA,hora:21,jogoEmCasa:true}).jogoEmCasa,true,'dia de jogo vale de noite também')

// ── 8) lugares do dia inteiro num bairro de verdade: casas (x ± 5,6, frente +z), praça e ruas em volta de cada quadra ─────
{
 const Q=[];for(let x=-87;x<=87;x+=29)for(let z=200;z<=316;z+=29)Q.push({x,z})
 const R=[],chave=new Set();for(const q of Q)for(const [a,b] of [[[-14.5,-14.5],[14.5,-14.5]],[[14.5,-14.5],[14.5,14.5]],[[-14.5,14.5],[14.5,14.5]],[[-14.5,-14.5],[-14.5,14.5]]]){const A={x:q.x+a[0],z:q.z+a[1]},Bp={x:q.x+b[0],z:q.z+b[1]},k=[A.x,A.z,Bp.x,Bp.z].join();if(!chave.has(k)){chave.add(k);R.push([A,Bp])}}
 const boteco={x:-23.4,z:256}
 const casas=Q.flatMap(q=>[-1,1].map(s=>({x:q.x+s*5.6,z:q.z-2,w:9.6,d:10.1,andares:s>0&&q.x===29?4:1}))).filter(c=>Math.hypot(c.x-boteco.x,c.z-boteco.z)>1)
 const S=casas.map(c=>({minX:c.x-c.w/2,maxX:c.x+c.w/2,minZ:c.z-c.d/2,maxZ:c.z+c.d/2}))
 S.push({minX:boteco.x-4.5,maxX:boteco.x+4.5,minZ:boteco.z-4.9,maxZ:boteco.z+4.9})
 const praca={x:-116,z:229}
 const L=B.lugaresDoBairro({quadras:Q,ruas:R,boteco,solidos:S,casas,praca,campinho:{x:300,z:300}})
 for(const k of ['padaria','varais','cadeiras','praca','espetinho','podrao','kombi','bicicleta','feira','banca'])assert(L[k],'achou '+k)
 const fora=(p,m)=>!S.some(s=>p.x>s.minX-m&&p.x<s.maxX+m&&p.z>s.minZ-m&&p.z<s.maxZ+m)
 // padaria: na frente de uma casa baixa, e o balcão/fregueses fora de qualquer casa
 const cp=casas.find(c=>Math.abs(c.x-L.padaria.x)<.01&&Math.abs(c.z+c.d/2-L.padaria.frente)<.01);assert(cp&&cp.andares<=2,'padaria numa casa baixa')
 for(const dx of [-1.5,0,1.5])assert(fora({x:L.padaria.x+dx,z:L.padaria.frente+2},.3),'balcão e fregueses na calçada, fora das casas')
 // varal e cadeiras: casas diferentes, fora de qualquer casa, longe da árvore do meio da frente da quadra
 assert(L.varais.length>=3&&L.varais.length<=5,'3 a 5 varais');assert(L.cadeiras.length>=2&&L.cadeiras.length<=4,'2 a 4 portas com cadeira')
 for(const v of L.varais){for(const t of [-.5,0,.5])assert(fora({x:v.x+v.len*t,z:v.z},.3),'varal fora das casas');const q=Q.find(q=>Math.abs(q.x-v.x)<12&&Math.abs(q.z-v.z)<12);assert(Math.abs(v.x-q.x)-v.len/2>1.5||Math.abs(v.z-(q.z+8.6))>2,'varal longe da árvore');assert(v.z<q.z+11.5,'varal dentro do quintal')}
 for(const c of L.cadeiras)for(const s of [-.75,.75])assert(fora({x:c.x+s,z:c.z+1.35},.3),'cadeira na calçada')
 const pontosOcupados=[...L.varais.map(v=>({x:v.x,z:v.z})),...L.cadeiras.map(c=>({x:c.x,z:c.z+1.3})),{x:L.padaria.x,z:L.padaria.frente+1.5},L.espetinho,L.podrao,L.banca]
 for(let i=0;i<pontosOcupados.length;i++)for(let j=i+1;j<pontosOcupados.length;j++)assert(Math.hypot(pontosOcupados[i].x-pontosOcupados[j].x,pontosOcupados[i].z-pontosOcupados[j].z)>3,'nada se amontoa')
 // espetinho e podrão: um de frente pro outro na mesma travessa, nas esquinas (dentro da calçada da quadra)
 assert.equal(L.espetinho.z>L.podrao.z-1&&L.espetinho.z<L.podrao.z+1,true);assert(Math.abs(L.podrao.x-L.espetinho.x)<12,'os dois na mesma travessa')
 for(const p of [L.espetinho,L.podrao]){assert(fora(p,1.2),'esquina livre');const q=Q.reduce((m,q)=>Math.hypot(q.x-p.x,q.z-p.z)<Math.hypot(m.x-p.x,m.z-p.z)?q:m);assert(Math.abs(p.x-q.x)<=11.5-1.3&&Math.abs(p.z-q.z)<=11.5-1.5,'trailer/churrasqueira dentro da calçada, fora da rua')}
 // praça: mesa e carrinhos dentro da praça, longe das árvores (−,−) (−,+) (+,+) e do banco (+4, +2,5)
 for(const p of [L.praca.domino,L.praca.sorvete,L.praca.pipoca]){assert(Math.abs(p.x-praca.x)<10.5&&Math.abs(p.z-praca.z)<10.5,'dentro da praça');for(const [tx,tz] of [[-6.7,-6.7],[-6.7,6.7],[6.7,6.7],[4,2.5]])assert(Math.hypot(p.x-praca.x-tx,p.z-praca.z-tz)>2.4,'longe de árvore e banco')}
 // Kombi e bicicleta: a volta inteira em rua de verdade (cada trecho existe), nunca na rua da feira, cada uma na sua mão
 const naRua=p=>R.some(([a,b])=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l));return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t)<2.9}) // o centro do veículo sempre no asfalto (5,8 m de rua)
 const naFeira=p=>{const {a,b}=L.feira,dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l));return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t)<4}
 for(const v of [L.kombi,L.bicicleta]){const per=B.pontoDaVolta(v.centro,v.meia,0,v.raio).perimetro;let ant=B.poseNaVolta(v,0)
  for(let m=.5;m<=per+.5;m+=.5){const p=B.poseNaVolta(v,m);assert(naRua(p),'a volta só passa em rua');assert(!naFeira(p),'nunca na rua da feira');assert(Math.hypot(p.x-ant.x,p.z-ant.z)<.6,'sem pulo (curva contínua)');assert(fora(p,.9),'nunca dentro de casa');ant=p}}
 assert.notEqual(L.kombi.sentido,L.bicicleta.sentido,'mãos contrárias');assert(Math.abs(L.kombi.meia-L.bicicleta.meia)>=3,'faixas separadas')
 // a Kombi e a bicicleta passam na porta da padaria (a rua da frente é a de cima da quadra delas)
 {const qz=L.padaria.frente-5.05+2,k=L.kombi.centro;assert([qz,qz+29].some(z=>Math.abs(k.z-z)<.5)&&[-5.6,5.6].some(d=>Math.abs(k.x-(L.padaria.x+d))<.5),'a volta é na rua da padaria')}
 // sem casas/praça: nada novo e nenhum erro
 const vazio=B.lugaresDoBairro({quadras:Q,ruas:R,boteco,solidos:S});assert(!vazio.padaria&&!vazio.varais&&!vazio.praca,'sem casas não inventa padaria')
 assert.doesNotThrow(()=>B.lugaresDoBairro({quadras:Q,ruas:R,boteco,solidos:S,casas:[{x:NaN,z:NaN,w:1,d:1}],praca:{x:NaN,z:NaN}}))
}

// ── 9) 🏟️ dia de jogo: camelô, gato e flanelinha longe das barracas oficiais, da fila, do portão e das peruas ─────────────
{
 const MP=await import('../../src/escalacao/cidade3d/matchday-plan.mjs')
 const VD=await import('../../src/escalacao/cidade3d/vendor-delivery.mjs')
 const SE=await import('../../src/escalacao/cidade3d/stadium-entrances.mjs')
 const J=B.LUGARES_DIA_DE_JOGO
 for(const p of [J.pirata,J.gato]){
  for(const s of MP.MATCHDAY_STALLS)assert(Math.hypot(p.x-s.x,p.z-s.z)>6,'longe da barraca oficial '+s.id)
  for(const side of ['home','away'])for(let i=0;i<4;i++)for(const f of MP.matchdayFanPoints(side,i))assert(Math.hypot(p.x-f.x,p.z-f.z)>3.2,'longe da fila da torcida')
  const g=SE.STADIUM_HOME_GATE;assert(Math.abs(p.x-g.threshold.x)>g.width/2+1.5,'fora do vão do portão');assert(p.z>g.threshold.z+8,'na frente do portão, do lado de fora')
  MP.MATCHDAY_STALLS.forEach((s,i)=>{const d=VD.vendorDelivery(s,i);if(!d)return;for(const r of [d.incoming,d.outgoing,d.backing,d.cargo])for(const q of r.points)assert(Math.hypot(p.x-q.x,p.z-q.z)>3,'longe da rota da perua '+s.id)})
 }
 assert(Math.hypot(J.pirata.x-J.gato.x,J.pirata.z-J.gato.z)>3.5,'camelô e gato separados')
 // flanelinha: dentro do 1º estacionamento e fora da entrada dos carros
 const T=await import('../../src/escalacao/presidencia-complexo-transporte-model.ts')
 const lote=T.PLANTAS_ESTACIONAMENTO_COMPLEXO[0]
 assert(lote,'estacionamento existe')
 const fl=J.flanelinha;let dentro=false;const poly=lote.polygon;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>fl.z)!==(b.z>fl.z)&&fl.x<(b.x-a.x)*(fl.z-a.z)/(b.z-a.z)+a.x)dentro=!dentro}
 assert(dentro,'flanelinha no estacionamento')
}
console.log('PASS test-bairro-tradicoes')
