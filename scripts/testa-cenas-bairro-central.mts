import assert from 'node:assert/strict'
import {cenasDoBairro,guardarCenasLidas,lerCenasLidas} from '../src/escalacao/cenas-bairro-central'
import {marcarCena,registrarVendas,pedidoCena,lerPedidoCena,cenaPodeAparecer,type DiarioBairro} from '../src/escalacao/cenas-bairro-model'
import {planoCenaCompacta,planoTrecho,centroTrecho} from '../src/escalacao/mapa-compacto/cenas'
import {caixa} from '../src/escalacao/mapa-compacto/model'
const base={chave:'carreira-1:2:8',carreiraKey:'carreira-1:0',temporada:2,rodada:8,clube:'Brasiliense',t:(p:string)=>p,imagens:{estadio:'estadio',clube:'clube',noite:'noite',carreata:'carreata',obra:'obra',festa:'festa',triste:'triste',feira:'feira'}}
assert.deepEqual(cenasDoBairro(base),[],'não inventa acontecimento sem fonte')
for(let rodada=1;rodada<=20;rodada++)for(const [gf,ga] of [[0,0],[1,0],[0,1]])assert.deepEqual(cenasDoBairro({...base,rodada,ultimo:{gf,ga},feira:true}),[],'resultado comum e sábado não obrigam vídeo')
const title=cenasDoBairro({...base,carreata:true,tituloId:'2:liga',evento:{nome:'Atleta',status:'banco'},ultimo:{gf:4,ga:0,rival:true},desfecho:{tipo:'acesso',para:'Série B'}})
assert.equal(title.length,1);assert.equal(title[0].acao,'titulo')
const seen=marcarCena(undefined,{id:title[0].chave,group:title[0].grupo,kind:title[0].acao,season:2,round:8})
assert.equal(cenasDoBairro({...base,rodada:9,carreata:true,tituloId:'2:liga',diario:seen}).length,0,'mesma taça não reaparece a cada rodada')
assert.equal(marcarCena(seen,seen.seen[0]),seen,'marcar é idempotente')
const access=cenasDoBairro({...base,desfecho:{tipo:'acesso',para:'Série B'}})[0];assert.equal(access.acao,'acesso');assert(cenaPodeAparecer(access,seen,2,8),'acesso importante ignora intervalo')
const derby=cenasDoBairro({...base,ultimo:{gf:2,ga:1,rival:true}})[0];assert.equal(derby.acao,'classico');assert.equal(cenasDoBairro({...base,ultimo:{gf:1,ga:1,rival:true}}).length,0)
assert.equal(cenasDoBairro({...base,rodada:10,diario:seen,ultimo:{gf:2,ga:1,rival:true}}).length,0,'sem sequência de vídeos')
assert.equal(cenasDoBairro({...base,rodada:11,diario:seen,ultimo:{gf:2,ga:1,rival:true}}).length,1,'intervalo não é uma cota obrigatória')
const event={nome:'Atleta',status:'banco',origemRodada:7,variante:'futevolei'}
const first=cenasDoBairro({...base,evento:event})[0],next=cenasDoBairro({...base,rodada:9,evento:event})[0];assert.equal(first.chave,next.chave,'evento mantém rodada de origem')
const noSales=cenasDoBairro({...base,vendas:{season:2,camisas:500,anterior:490}});assert.equal(noSales.length,0)
const sales=cenasDoBairro({...base,vendas:{season:2,camisas:1600,anterior:1100}})[0];assert.equal(sales.acao,'loja');assert.match(sales.texto,/1600.*1100/)
assert.equal(cenasDoBairro({...base,saida:{nome:'Atleta',destino:'Clube',valor:4}}).length,0,'negócio pequeno não força cena')
assert.equal(cenasDoBairro({...base,saida:{nome:'Atleta',destino:'Clube',valor:40}})[0].acao,'despedida')
let diario:DiarioBairro|undefined
for(let i=0;i<120;i++)diario=marcarCena(diario,{id:'id'+i,group:'g'+i,kind:'loja',season:2,round:i})
assert.equal(diario!.seen.length,100)
for(let i=1;i<20;i++)diario=registrarVendas(diario,[{season:i,camisas:i*100}])
assert.equal(diario!.sales.length,12);assert.equal(registrarVendas(diario,[{season:19,camisas:999}]),diario,'mesma temporada não altera balanço')
assert.deepEqual(JSON.parse(JSON.stringify(diario)),diario,'histórico viaja junto com o save')
const encoded=pedidoCena('loja','seed:0:a&b','loja',true,true);assert.deepEqual(lerPedidoCena(encoded),{view:'loja',key:'seed:0:a&b',kind:'loja',manual:true,replay:true})
for(const invalid of ['loja','cena:loja','cena:../x?evento=x&acao=loja','cena:loja?evento=x&acao=fake'])assert.equal(lerPedidoCena(invalid),undefined)
const storage=new Map<string,string>();Object.assign(globalThis,{localStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)}})
guardarCenasLidas(Array.from({length:120},(_,i)=>'cena-'+i));assert.equal(lerCenasLidas().length,80)
for(const a of [.55,1.3,2.8]){
 const p=planoCenaCompacta('boteco-oswaldo',a)!,b=caixa('Boteco')!;assert(p.target[2]>b.maxZ);assert(p.camera[2]>p.target[2]);assert(p.camera[1]<10)
 const close=planoTrecho('loja',a),c=centroTrecho('loja');assert.equal(close.target[0],c.x);assert(close.camera[1]<5);assert(close.target.every(Number.isFinite)&&close.camera.every(Number.isFinite))
}
assert.equal(planoCenaCompacta('region',1),undefined,'visão geral nativa preservada')
console.log('PASS cenas: 60 resultados comuns sem vídeo; fatos relevantes; prioridade; intervalo; eventos estáveis; balanço real; persistência limitada; replay; câmeras')
const actor={nome:'Romário',club:'Vasco',year:2000,id:'romario-1'}
assert.deepEqual(lerPedidoCena(pedidoCena('clube-lazer','fute','lazer',false,false,actor))?.ator,actor)
assert.equal(lerPedidoCena('cena:loja?evento=x&acao=loja&ator=quebrado')?.ator,undefined)
const {traitDe,identidadeFolclore}=await import('../src/escalacao/eventos')
assert.equal(traitDe('Romário','São Francisco-PA',2026),null)
assert.equal(traitDe('Romário','Vasco',2000),'🍾 baladeiro')
assert.equal(traitDe('Romário','Barcelona',1994),'🍾 baladeiro')
assert.equal(identidadeFolclore('Edmundo','Vasco',1997),true)
assert.equal(traitDe('Pepe','Santos',1962),null)
const {fatosDoBairro}=await import('../src/escalacao/cenas-bairro-fatos')
const m:any={id:0,teamName:'Clube',squad:[{id:'romario-1',name:'Romário',club:'Vasco',year:2000}]},s:any={seasonNo:3,round:5}
assert.deepEqual(fatosDoBairro(s,m),[])
const medical={...s,eventoTemporada:{season:3,round:4,mgrId:0,tipo:'lesao',status:'banco',volta:7,cardId:'romario-1',nome:'Romário'}}
assert.equal(fatosDoBairro(medical,m)[0].acao,'recuperacao')
assert.equal(fatosDoBairro({...medical,round:7},m)[0].acao,'retorno')
assert.equal(fatosDoBairro({...medical,round:9},m).length,0)
const deal={season:3,round:5,team:'Clube',name:'Romário',paid:40,club:'Vasco',year:2000}
assert.equal(fatosDoBairro({...s,careerTransferHistory:[deal]},m)[0].acao,'contratacao')
assert.deepEqual(fatosDoBairro({...s,careerTransferHistory:[{...deal,round:4}]},m),[],'não recria chegada antiga')
assert.deepEqual(fatosDoBairro({...s,careerColetiva:{0:{feitas:[{t:3,r:5,estilo:'pulou',frase:null}]}}},m),[],'coletiva pulada não vira vídeo')
const speech=fatosDoBairro({...s,careerColetiva:{0:{feitas:[{t:3,r:5,sit:'vitoria',estilo:'provoca',frase:['Resposta escolhida','Chosen answer']}]}}},m)[0]
assert.deepEqual(speech.texto,['Resposta escolhida','Chosen answer'])
const fute=cenasDoBairro({...base,evento:{nome:'Romário',club:'Vasco',year:2000,cardId:'romario-1',status:'banco',variante:'futevolei'}})[0]
assert.deepEqual(fute.ator,actor)
console.log('PASS fontes de cena: identidade completa; homônimos; recuperação e retorno; chegada real; resposta escolhida; sem história inventada')
