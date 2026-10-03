const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const mod={exports:{}};
const source=fs.readFileSync(path.resolve(__dirname,'../src/escalacao/presidencia-economia.ts'),'utf8');
new Function('exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports);
const m=mod.exports;
const empty=m.carteiraPresidenciaVazia;
const quote=(s,kind,id,replaceId)=>{const r=m.orcarPresidencia(s,{kind,id,...(replaceId?{replaceId}:{})});assert.equal(r.ok,true,JSON.stringify(r));return r.value};
const transact=(s,kind,id,replaceId)=>{const r=m.confirmarPresidencia(s,quote(s,kind,id,replaceId),true);assert.equal(r.ok,true);return r.value};
assert.equal(m.valorRevenda(100),70);assert.equal(m.valorRevenda(1000),700);
assert.equal(m.valorRevenda(90),63);assert.equal(m.valorRevenda(5),3);
assert.throws(()=>m.valorRevenda(-1));assert.throws(()=>empty(NaN));
let s=empty(2000);assert.deepEqual(s.owned,[]);
for(const id of ['cadeira-simples','mesa-simples','estante-simples','m3-gtr','bicicleta'])s=transact(s,'buy',id);
assert.equal(s.cash,950);assert.equal(s.owned.length,5);
const secondBike=transact(s,'buy','cg-titan');assert.equal(secondBike.owned.length,6);assert.equal(secondBike.cash,870);
assert.equal(m.orcarPresidencia(secondBike,{kind:'buy',id:'fat-boy'}).error,'slot-full');
const twoCars=transact(secondBike,'buy','fusca');assert.equal(twoCars.owned.length,7);
assert.equal(m.orcarPresidencia(twoCars,{kind:'buy',id:'chevette'}).error,'slot-full');
const explicitTrade=transact(twoCars,'buy','chevette','fusca');
assert.ok(explicitTrade.owned.some(b=>b.id==='m3-gtr'));assert.ok(!explicitTrade.owned.some(b=>b.id==='fusca'));
assert.equal(m.orcarPresidencia(twoCars,{kind:'buy',id:'chevette',replaceId:'bicicleta'}).error,'invalid-replacement');
assert.equal(m.orcarPresidencia(twoCars,{kind:'buy',id:'chevette',replaceId:'g63'}).error,'invalid-replacement');
const before=JSON.stringify(s),q=quote(s,'buy','cg-titan','bicicleta');
assert.equal(q.sale.id,'bicicleta');assert.equal(q.credit,14);assert.equal(q.finalCash,884);
assert.equal(m.confirmarPresidencia(s,q,false).error,'confirmation-required');assert.equal(JSON.stringify(s),before);
const next=m.confirmarPresidencia(s,q,true).value;
assert.ok(next.owned.some(b=>b.id==='m3-gtr'));
assert.ok(next.owned.some(b=>b.id==='cg-titan'));
assert.ok(!next.owned.some(b=>b.id==='bicicleta'));assert.equal(next.owned.length,5);
assert.equal(m.confirmarPresidencia(next,q,true).error,'stale-quote'); // duplo clique
assert.equal(m.confirmarPresidencia({...s,cash:s.cash-1},q,true).error,'stale-quote');
assert.equal(m.confirmarPresidencia(s,{...q,credit:9000},true).error,'stale-quote');
assert.equal(m.orcarPresidencia({...s,cash:0},{kind:'buy',id:'cg-titan'}).error,'insufficient-cash');
assert.equal(JSON.stringify(s),before); // falha não vende o veículo
assert.equal(m.orcarPresidencia(next,{kind:'buy',id:'cg-titan'}).error,'already-owned');
assert.equal(m.orcarPresidencia(next,{kind:'sell',id:'bicicleta'}).error,'not-owned');
assert.equal(m.carteiraPresidenciaValida({...next,owned:[...next.owned,{id:'bicicleta',paid:20}]}),true);
assert.equal(m.carteiraPresidenciaValida({...next,owned:[...next.owned,{id:'carro-popular',paid:150}]}),true);
assert.equal(m.carteiraPresidenciaValida({...next,owned:[...next.owned,{id:'cg-titan',paid:80}]}),false);
assert.equal(m.carteiraPresidenciaValida({...twoCars,owned:[...twoCars.owned,{id:'chevette',paid:50}]}),false);
const sold=transact(next,'sell','m3-gtr');assert.equal(sold.cash,1584);
assert.ok(sold.owned.some(b=>b.id==='cg-titan'));assert.equal(sold.owned.length,4);
// Preço histórico pago, não preço atual de catálogo.
const discount={cash:0,revision:0,owned:[{id:'carro-esportivo',paid:100}]};
assert.equal(transact(discount,'sell','carro-esportivo').cash,70);
for(const id of ['cadeira-simples','mesa-simples','estante-simples'])assert.ok(m.PRESIDENCIA_CATALOGO.find(p=>p.id===id).price>0);
for(let paid=0;paid<2000;paid++)assert.equal(m.valorRevenda(paid),Math.floor(paid*7/10));
console.log('PASS: 2 carros + 2 motos/bikes, troca explícita, sem venda automática, móveis pagos, revenda 70%, cancelamento, saldo insuficiente, preço histórico e confirmação obsoleta.');
const expected={"fusca":30,"chevette":50,"brasilia":70,"kombi":90,"uno-escada":100,"celta":120,"gol-gti":150,"saveiro":190,"opala-ss":250,"golf-gti":320,"veloster":350,"civic":400,"lancer-evo":550,"song-plus":600,"skyline-r34":700,"supra-mk4":850,"z4":900,"m3-gtr":1000,"escalade":1100,"challenger":1200,"g63":1400,"f40":1500,"911-gt3":1750,"720s":1800,"aventador":2000,"bike-usada":5,"bicicleta":20,"mobilete":30,"bmx":40,"pop100":50,"biz":65,"cg-titan":80,"rd135":120,"twister":160,"xt660":200,"hornet":280,"xj6":300,"fat-boy":350,"f800gs":400,"r1250gs":550,"s1000rr":800,"ninja-h2":900};
assert.equal(m.PRESIDENCIA_CATALOGO.filter(p=>p.slot==='carro').length,25);
assert.equal(m.PRESIDENCIA_CATALOGO.filter(p=>p.slot==='duas-rodas').length,17);
assert.equal(new Set(m.PRESIDENCIA_CATALOGO.map(p=>p.id)).size,m.PRESIDENCIA_CATALOGO.length);
for(const [id,price] of Object.entries(expected))assert.equal(m.itemPresidencia(id).price,price);
for(const first of m.PRESIDENCIA_CATALOGO){
 const owned=transact(empty(10000),'buy',first.id);
 assert.equal(transact(owned,'sell',first.id).cash,10000-first.price+m.valorRevenda(first.price));
 for(const second of m.PRESIDENCIA_CATALOGO.filter(p=>p.id!==first.id)){
  const replacement=first.slot===second.slot&&m.capacidadePresidencia(first.slot)===1?first.id:undefined;
  if(replacement)assert.equal(m.orcarPresidencia(owned,{kind:'buy',id:second.id}).error,'slot-full');
  const swapped=transact(owned,'buy',second.id,replacement);
  assert.equal(swapped.owned.length,replacement?1:2);
  assert.equal(swapped.cash,10000-first.price-second.price+(replacement?m.valorRevenda(first.price):0));
  assert.ok(m.carteiraPresidenciaValida(swapped));
 }
}
assert.equal(m.orcarPresidencia(empty(2000),{kind:'buy',id:'carro-esportivo'}).error,'unknown-item');
console.log('PASS: catálogo ampliado, preços de veículos preservados, todas as combinações de compra/troca e legado somente para revenda.');
