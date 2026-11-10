import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { CATALOG, CATALOG_EU } from '../src/escalacao/data'
import { entradaM2, novoMotor2, resultadoM2, carregaGuardados, tiraNovos, type EntradaM2 } from '../src/escalacao/motor2/carreira'
import { VERSAO_RECEPCAO_M2, VERSAO_CRITERIOS_RECEPCAO_M2 } from '../src/escalacao/motor2/versao'
import { criteriosDaTemporada, iniciarCriteriosDaTemporada } from '../src/escalacao/criterios-carreira'
import { projetarCompromissos } from '../src/escalacao/compromissos-carreira'
import { gasDoElenco, modsDoElenco } from '../src/escalacao/condicao'

const all=Object.entries(CATALOG).flatMap(([pos,cs])=>cs.map(c=>({...c,pos}))).concat(Object.entries(CATALOG_EU).flatMap(([pos,cs])=>cs.map(c=>({...c,pos}))))
const positions=['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA']
const team=(seed:number,fames:number[])=>positions.map((pos,i)=>{const pool=all.filter(c=>c.pos===pos&&fames.includes(c.fame));return {...pool[((seed*7919+i*3571)>>>0)%pool.length]}})
const base:EntradaM2={seed:1528235552,casa:team(25,[3]),fora:team(37,[3]),tatica:[0,0],bots:[false,true],clima:'sol',versao:VERSAO_RECEPCAO_M2}
const fresh=(e:EntradaM2)=>{const m=novoMotor2(e);for(let min=1;min<=120&&!m.fim;min++)m.avancaAte(min);assert(m.fim);return [...m.placar]}
carregaGuardados(undefined,1,'cache-cartas')
for(const [k,v] of Object.entries({club:'Outro clube',year:1990,pos:'MEI',fame:1,lo:30,hi:45,fake:true,gasMod:-3})){const altered=structuredClone(base);(altered.casa[0] as any)[k]=v;const first=resultadoM2(base),r=resultadoM2(altered);assert.notEqual(first,r,`cache colidiu ao alterar ${k}`);assert.deepEqual(r.placar,fresh(altered))}
const inter=all.find(c=>c.name==='Júlio César'&&c.club==='Inter'&&c.year===2010)!,cor=all.find(c=>c.name==='Júlio César'&&c.club==='Corinthians'&&c.year===2010)!
assert(inter&&cor);const a=structuredClone(base),b=structuredClone(base);a.casa[0]=inter;b.casa[0]=cor;assert.notEqual(resultadoM2(a),resultadoM2(b));assert.deepEqual(resultadoM2(b).placar,fresh(b))
// Referência produzida pelo código publicado anterior, sem recriar sua chave no teste.
const legacyFixture=JSON.parse(readFileSync(new URL('./fixtures/m2-save-legado.json',import.meta.url),'utf8'))
carregaGuardados(legacyFixture.saved,47,'save-legado');assert.deepEqual(resultadoM2({...legacyFixture.input,preservarGuardado:true}).placar,legacyFixture.result.placar)
const sameNameNewCard=structuredClone(legacyFixture.input);sameNameNewCard.casa[0].club='Novo clube';sameNameNewCard.casa[0].lo=30;sameNameNewCard.casa[0].hi=40
assert.deepEqual(resultadoM2(sameNameNewCard).placar,fresh(sameNameNewCard))
// Uma prévia não sobe à nuvem; iniciar o mesmo jogo depois grava a fotografia oficial.
carregaGuardados(undefined,7,'fotografia');const preview={...base,partidaId:'liga:7:0',preservarGuardado:false};const pr=resultadoM2(preview);assert.equal(tiraNovos(),null)
resultadoM2({...preview,preservarGuardado:true});const saved=tiraNovos()!;assert.equal(Object.keys(saved).length,1);assert(Object.values(saved)[0][5]?.partidaId)
carregaGuardados(JSON.parse(JSON.stringify(saved)),7,'outro-aparelho');const changed=structuredClone(preview);changed.preservarGuardado=true;changed.casa[0].lo=1;changed.casa[0].hi=2;changed.tatica=[-1,1];const historical=entradaM2(changed);assert.deepEqual(historical.casa,entradaM2({...preview,preservarGuardado:true}).casa);assert.deepEqual(resultadoM2(historical).placar,pr.placar);assert.deepEqual(fresh(historical),pr.placar)
// Restaurar outra cópia do mesmo save não herda entradas ausentes nela.
carregaGuardados(saved,7,'mesmo-save');assert.equal(entradaM2(changed).casa[0].lo,base.casa[0].lo);carregaGuardados({},7,'mesmo-save');assert.equal(entradaM2(changed).casa[0].lo,1);
// Calcular chaveamento não congela o XI de uma fase ainda futura.
carregaGuardados(undefined,8,'copa-previa');const cup={...base,partidaId:'copa:8:final',preservarGuardado:true,somenteConsulta:true};resultadoM2(cup);assert.equal(tiraNovos(),null);const changedCup={...cup,casa:team(64,[4])};const futureCup=resultadoM2(changedCup);assert.deepEqual(futureCup.placar,fresh(changedCup));assert.equal(tiraNovos(),null);resultadoM2({...changedCup,somenteConsulta:false});assert(Object.values(tiraNovos()!).some(row=>row[5]?.partidaId===cup.partidaId));assert.deepEqual(resultadoM2(cup).placar,futureCup.placar);
// Intervalo legítimo: muda só a segunda etapa e sobrevive à ordem JSON do save.
carregaGuardados(undefined,9,'intervalo');const kickoff={...base,versao:VERSAO_CRITERIOS_RECEPCAO_M2,partidaId:'liga:intervalo',preservarGuardado:true};resultadoM2(kickoff);const initial=tiraNovos()!;
const half1={...kickoff,casa2:team(57,[4]),fCasa2:'4-3-3',tatica2:[1,0] as [number,number],intervaloRevisao:1,atualizarIntervalo:true};const r1=resultadoM2(half1),delta1=tiraNovos()!;assert.deepEqual(entradaM2(half1).casa2?.map(c=>[c.name,c.club,c.year,c.lo,c.hi]),half1.casa2.map(c=>[c.name,c.club,c.year,c.lo,c.hi]));
const before=novoMotor2({...kickoff,preservarGuardado:false}),after=novoMotor2(half1);for(let min=1;min<=44;min++){before.avancaAte(min);after.avancaAte(min)}assert.deepEqual(before.eventos,after.eventos,'intervalo reescreveu primeiro tempo');for(let min=45;min<=120&&!after.fim;min++)after.avancaAte(min);assert.deepEqual(after.placar,r1.placar);assert.equal(after.tatica[0]>=1,true);
const half2={...half1,casa2:team(71,[3]),tatica2:[-1,0] as [number,number],intervaloRevisao:2};const r2=resultadoM2(half2),delta2=tiraNovos()!;const allSaved={...initial,...delta1,...delta2};
carregaGuardados(Object.fromEntries(Object.entries(JSON.parse(JSON.stringify(allSaved))).reverse()) as any,9,'intervalo-outro-aparelho');const reopened=entradaM2({...kickoff,casa2:team(99,[1]),intervaloRevisao:99});assert.deepEqual(reopened.casa2?.map(c=>[c.name,c.club,c.year,c.lo,c.hi]),half2.casa2.map(c=>[c.name,c.club,c.year,c.lo,c.hi]));assert.deepEqual(JSON.parse(JSON.stringify(resultadoM2(reopened))),JSON.parse(JSON.stringify(r2)));assert.deepEqual(fresh(reopened),r2.placar);
// Voltar a uma escolha anterior ainda registra a revisão mais recente.
resultadoM2({...half1,intervaloRevisao:3});const delta3=tiraNovos()!;assert(Object.values(delta3).some(v=>v[5]?.intervaloRevisao===3));
// A próxima partida com a nova ficha não herda o resultado da anterior.
const next={...changed,partidaId:'liga:7:1',seed:base.seed+1,preservarGuardado:false};assert.deepEqual(resultadoM2(next).placar,fresh(next))
// −1 já entrou em lo/hi: a versão nova não aplica outra perda de energia na entrada.
const tired=structuredClone(base);tired.casa[1]={...tired.casa[1],lo:70,hi:76,gasMod:-1};const legacy=novoMotor2(tired),modern=novoMotor2({...tired,versao:VERSAO_CRITERIOS_RECEPCAO_M2});assert.equal(legacy.atl.find(p=>p.lado===0&&p.nome===tired.casa[1].name)!.gas,.82);assert.equal(modern.atl.find(p=>p.lado===0&&p.nome===tired.casa[1].name)!.gas,1)
const squad=[{id:'a'},{id:'b'}],rounds={0:['b'],1:['b']},gas=gasDoElenco(rounds,2,squad,0,{a:15,b:100},12);assert.equal(gas.a,39);assert.equal(modsDoElenco(rounds,2,squad,()=>['a'],null,5,0,{a:15,b:100},12)[2],undefined)
const old:any={careerOnline:true,onlineMode:'cpu',seasonNo:8,sport:'futebol'};assert(!criteriosDaTemporada(old));iniciarCriteriosDaTemporada(old);assert(criteriosDaTemporada(old));const unchanged=old.criteriosCarreiraDesde;old.seasonNo++;iniciarCriteriosDaTemporada(old);assert.equal(old.criteriosCarreiraDesde,unchanged);assert(!criteriosDaTemporada({...old,onlineMode:'online'}));assert(!criteriosDaTemporada({...old,sport:'basquete'}))
const reverted={...old,seasonNo:12};iniciarCriteriosDaTemporada(reverted,false);assert.equal(reverted.criteriosCarreiraAte,11);assert(!criteriosDaTemporada(reverted));assert(criteriosDaTemporada({...reverted,seasonNo:11}));iniciarCriteriosDaTemporada(reverted,true);assert.equal(reverted.criteriosCarreiraAte,11,'reabrir configuração não muda a história')
assert.deepEqual(projetarCompromissos({caixa:100,custo:90,folha:8,salarioNovo:9}),{compra:90,multa:0,folha:17,aposCompra:10,aposReserva:-7})
assert.equal(projetarCompromissos({caixa:100,custo:90,folha:8,salarioNovo:9,cobraFolha:false}).aposReserva,10)
assert.equal(projetarCompromissos({caixa:100,custo:30,multa:20,folha:10,salarioNovo:3,salarioSubstituido:2}).aposReserva,39)
console.log('PASS: identidade completa, reabertura e replay da fotografia oficial, prévia não congelada, condição única, recuperação do preparador e versões separadas')
const N=Number(process.argv[2]??80),report:any={n:N,cases:{}}
if(N===0)process.exit(0)
for(const [name,f1,f2] of [['bons',[3],[3]],['craques',[4],[4]],['lendas-profissionais',[5],[1]]] as const){for(const modern of [false,true]){let gf=0,ga=0,shots=0,passes=0,w=0,d=0,l=0,zeros=0;const start=performance.now();for(let i=0;i<N;i++){const e:EntradaM2={seed:810000+i*7919,casa:team(i+11,[...f1]),fora:team(i+49,[...f2]),tatica:[0,0],bots:[false,false],clima:'sol',versao:modern?VERSAO_CRITERIOS_RECEPCAO_M2:VERSAO_RECEPCAO_M2};const m=novoMotor2(e);for(let min=1;min<=120&&!m.fim;min++)m.avancaAte(min);assert(m.fim);gf+=m.placar[0];ga+=m.placar[1];shots+=m.stats.chutes[0]+m.stats.chutes[1];passes+=m.stats.passes[0]+m.stats.passes[1];if(m.placar[0]>m.placar[1])w++;else if(m.placar[0]===m.placar[1])d++;else l++;if(!m.placar[0]&&!m.placar[1])zeros++;assert(!m.diag.erros.length)}const out={gf:gf/N,ga:ga/N,goals:(gf+ga)/N,shots:shots/N,passes:passes/N,w,d,l,zeros,ms:(performance.now()-start)/N};report.cases[name+'-'+(modern?'novo':'anterior')]=out;console.log(name,modern?'novo':'anterior',JSON.stringify(out));}}
const output=process.env.CARREIRA_TEST_OUTPUT??join(tmpdir(),'leilao-criterios');mkdirSync(output,{recursive:true});writeFileSync(join(output,'comparacao-motores.json'),JSON.stringify(report,null,2))
