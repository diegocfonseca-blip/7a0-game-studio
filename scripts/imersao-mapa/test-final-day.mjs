// 🏆 Dia de FINAL no mapa 3D: é final? quem é campeão? de quem é o pódio? nada antes do apito?
import assert from 'node:assert/strict';
import {tipoFinalDaPartida,ladoDoUsuario,desfechoDaFinal,corDoPodio,faixaDaFinal,faixaDaFachada,publicoExtraDaFinal,quadroDaFesta,elencoDaFesta,FESTA_FINAL,idPartidaInternacional,caraDaTaca,placaDoPodio,temaDaFesta,coreografiaDaFesta,quemLevantaATaca,fotografosDaFesta,flashAceso,ELENCO_FESTA,tituloDaDivisao,divisaoDaFesta,rodadaDaLiga,ULTIMA_RODADA_LIGA,ehDivisaoFesta} from '../../src/escalacao/presidencia-complexo-final-regras.ts';
import {cityPopulation} from '../../src/escalacao/cidade3d/population.mjs';

// 1) A final é a que a competição já identifica no id (pyramidseason → MyCopaMatch).
assert.equal(tipoFinalDaPartida('123:copa:5:Final:leg:0:4:9'),'final');
assert.equal(tipoFinalDaPartida('123:copa:7:Supercopa:leg:0:4:9'),'supercopa');
assert.equal(tipoFinalDaPartida('123:copa:4:Semifinal:leg:1:4:9'),null,'semifinal não é final');
assert.equal(tipoFinalDaPartida('123:copa:3:Quartas:leg:0:4:9'),null);
assert.equal(tipoFinalDaPartida('123:12:4:9'),null,'rodada de liga não é final');
assert.equal(tipoFinalDaPartida('Final'),null,'nome solto não basta');
assert.equal(tipoFinalDaPartida(undefined),null);

const base={context:{id:'9:copa:5:Final:leg:0:3:8',homeClubId:3,awayClubId:8},viewerClubId:3,minute:93,homeScore:2,awayScore:1,finished:true};
// 2) Campeão em casa / vice em casa / campeão fora.
assert.deepEqual(desfechoDaFinal(base),{vencedor:'home',usuario:'home',campeao:true,tipo:'final'});
assert.deepEqual(desfechoDaFinal({...base,homeScore:0,awayScore:1}),{vencedor:'away',usuario:'home',campeao:false,tipo:'final'});
assert.deepEqual(desfechoDaFinal({...base,viewerClubId:8,homeScore:0,awayScore:3}),{vencedor:'away',usuario:'away',campeao:true,tipo:'final'});
assert.equal(ladoDoUsuario({...base,viewerClubId:8}),'away');
assert.equal(ladoDoUsuario({...base,viewerClubId:99}),null);
// 3) Nada de spoiler: sem apito (ou "encerrado" no meio do jogo) não existe desfecho.
assert.equal(desfechoDaFinal({...base,finished:false}),null,'jogo rolando não tem campeão');
assert.equal(desfechoDaFinal({...base,minute:61}),null,'placar guardado no meio do jogo não é apito');
// 4) Empate = pênaltis (o mapa não mostra): sem festa nenhuma.
assert.equal(desfechoDaFinal({...base,homeScore:1,awayScore:1}),null);
// 5) Final que não é do usuário / jogo que não é final: nada.
assert.equal(desfechoDaFinal({...base,viewerClubId:44}),null);
assert.equal(desfechoDaFinal({...base,viewerClubId:undefined}),null);
assert.equal(desfechoDaFinal({...base,context:{...base.context,id:'9:copa:4:Semifinal:leg:1:3:8'}}),null);
// 6) O pódio é de quem ganhou: o seu se for campeão, o do rival se perdeu.
const cores={home:'#1B7A3D',away:'#C2452F'};
assert.equal(corDoPodio(desfechoDaFinal(base),cores),'#1B7A3D');
assert.equal(corDoPodio(desfechoDaFinal({...base,homeScore:0,awayScore:2}),cores),'#C2452F');
assert.equal(corDoPodio(desfechoDaFinal(base),{}),'#FFC400','sem cor: dourado');
// 7) Faixas (PT e EN) — nunca com placar.
assert.equal(faixaDaFinal([{name:'Leão FC'},{name:'Tubarão EC'}]),'FINAL · Leão FC × Tubarão EC');
assert.equal(faixaDaFinal([{name:'Leão FC'},{name:'Tubarão EC'}],true),'FINAL · Leão FC × Tubarão EC');
assert.equal(faixaDaFinal([]),'FINAL');
assert.equal(faixaDaFachada('final').grande,'FINAL');
assert.equal(faixaDaFachada('supercopa',true).topo,'SUPER CUP');
// 8) Mais gente: o dobro, sem furar o teto de population.mjs.
for(const mobile of [true,false]){
 const teto=cityPopulation({enabled:true,supporters:1e12,mobile});
 assert.equal(teto,mobile?20:48);
 for(const b of [0,4,10,15,20,30,48]){const extra=publicoExtraDaFinal({base:b,mobile});assert(extra<=b,'no máximo o dobro');assert(b+extra<=Math.max(teto,b),'teto respeitado')}
}
assert.equal(publicoExtraDaFinal({base:8,mobile:true}),8);
assert.equal(publicoExtraDaFinal({base:14,mobile:true}),6);
assert.equal(publicoExtraDaFinal({base:20,mobile:true}),0);
// 9) Festa: cabe nos 45 s em que o mapa ainda desenha depois do apito; fogos só pro campeão.
assert(FESTA_FINAL.fim<45);
for(const [,v] of Object.entries(FESTA_FINAL))if(Array.isArray(v))assert(v[1]<45);
assert.equal(quadroDaFesta(10,false).fogos,false,'perdeu: sem fogos');
assert.equal(quadroDaFesta(10,true).fogos,true);
assert.equal(quadroDaFesta(0,true).fogos,false);
assert.equal(quadroDaFesta(30,true).taca,1);
assert.equal(quadroDaFesta(1,true).podio,0);
assert.deepEqual(elencoDaFesta(true,true),{podio:5,saindo:0});
assert.deepEqual(elencoDaFesta(false,false),{podio:7,saindo:5});
// 10) 🌎 Finais internacionais (04/11): Libertadores, Champions e Mundial — só a FINAL, pelo id que a tela monta.
const idI=(comp,final)=>idPartidaInternacional({seed:77,season:41,comp,roundKey:120,home:'Flamengo',away:'River Plate',final});
assert.equal(idI('libertadores',false),'77:intl:41:libertadores:120:Flamengo:River Plate','id de sempre fora da final');
assert.equal(tipoFinalDaPartida(idI('libertadores',true)),'libertadores');
assert.equal(tipoFinalDaPartida(idI('champions',true)),'champions');
assert.equal(tipoFinalDaPartida(idI('mundial',true)),'mundial');
assert.equal(tipoFinalDaPartida(idI('libertadores',false)),null,'semifinal/grupos da Liberta não é final');
assert.equal(faixaDaFachada('libertadores').topo,'LIBERTADORES');
assert.equal(faixaDaFachada('mundial',true).topo,'CLUB WORLD CUP');
assert.equal(caraDaTaca('champions').forma,'orelhuda');
assert.equal(caraDaTaca('libertadores').forma,'liberta');
assert.equal(caraDaTaca('mundial').forma,'mundial');
assert.equal(caraDaTaca('final').forma,'copa');
const intl={...base,context:{id:idI('libertadores',true),homeClubId:3}};
assert.deepEqual(desfechoDaFinal(intl),{vencedor:'home',usuario:'home',campeao:true,tipo:'libertadores'});
// 11) 🥅 Final nos pênaltis: sem o vencedor no contexto, nada (a tela ainda está mostrando a disputa); com ele, festa igual.
const emp={...base,homeScore:1,awayScore:1};
assert.equal(desfechoDaFinal(emp),null,'pênaltis ainda não mostrados: sem festa');
assert.deepEqual(desfechoDaFinal({...emp,context:{...emp.context,penaltis:{vencedor:'home'}}}),{vencedor:'home',usuario:'home',campeao:true,tipo:'final',penaltis:true});
assert.deepEqual(desfechoDaFinal({...emp,context:{...emp.context,penaltis:{vencedor:'away'}}}),{vencedor:'away',usuario:'home',campeao:false,tipo:'final',penaltis:true});
assert.equal(desfechoDaFinal({...emp,finished:false,context:{...emp.context,penaltis:{vencedor:'home'}}}),null,'nunca antes do apito');
assert.equal(desfechoDaFinal({...emp,context:{...emp.context,penaltis:{vencedor:'x'}}}),null);
assert.equal(placaDoPodio({tipo:'final',penaltis:true}).linha,'NOS PÊNALTIS!');
assert.equal(placaDoPodio({tipo:'final',penaltis:true},true).linha,'ON PENALTIES!');
assert.equal(placaDoPodio({tipo:'libertadores',penaltis:true}).linha,'LIBERTADORES · NOS PÊNALTIS!');
assert.equal(placaDoPodio({tipo:'final'}).linha,'');
// 12) 🎉 Festa do elenco inteiro (04/11): 11 jogadores, 7 no pódio, cada um comemorando; óculos, faixas e bandeiras; fotógrafos.
const vagas=coreografiaDaFesta();
assert.equal(vagas.length,ELENCO_FESTA);assert.equal(ELENCO_FESTA,11);
assert.equal(vagas.filter(v=>v.podio).length,7);
for(const k of ['oculos','faixa','bandeira'])assert(vagas.filter(v=>v[k]).length>=2,'acessório '+k);
assert.deepEqual(new Set(vagas.map(v=>v.anim)),new Set(['taca','bracos','pula','abraco','danca']));
for(const v of vagas)if(v.parceiro!==undefined)assert.equal(vagas[v.parceiro].parceiro,vagas.indexOf(v),'abraço é de dois');
assert.equal(new Set(vagas.map(v=>v.x+':'+v.z+':'+v.h)).size,11,'ninguém em cima do outro');
assert.deepEqual(quemLevantaATaca(0,0),{de:0,para:1,passando:0});
assert.equal(quemLevantaATaca(3.2*4+.1,0).de,1,'a taça passa de mão em mão');
assert(quemLevantaATaca(3.1,0).passando>0);
assert.equal(fotografosDaFesta(true).length,3);assert.equal(fotografosDaFesta(false).length,4);
for(const f of fotografosDaFesta(false))assert(f.z>3,'fotógrafo na frente do pódio');
{let acesos=0;for(let t=0;t<20;t+=.01)acesos+=flashAceso(t,.8,.2)?1:0;assert(acesos>0&&acesos<400,'flash rápido: pisca e apaga')}
// 13) 🎨 Cada competição com tema próprio (cores do pódio/fundo/luz, enfeite) — nunca a mesma cara
const temas=['final','supercopa','libertadores','champions','mundial','carA','carB','carC','carD','carV'].map(temaDaFesta);
assert.equal(new Set(temas.map(t=>t.podio+t.fundo.join()+t.luz.join())).size,temas.length,'cada uma com sua cara');
assert.equal(temaDaFesta('champions').enfeite,'estrelas');assert.equal(temaDaFesta('libertadores').enfeite,'fumaca');assert.equal(temaDaFesta('mundial').enfeite,'globo');
for(const t of temas){for(const c of [t.podio,t.tampo,t.placaBg,t.placaInk,t.faixa,...t.fundo,...t.confete,...t.fogos,...t.luz])assert.match(c,/^#[0-9a-f]{6}$/i,t.id);assert(t.nome[0]&&t.nome[1]&&t.frase[0]&&t.frase[1])}
assert.equal(placaDoPodio({tipo:'supercopa'},true).linha,'SUPER CUP');
// 14) 🏆📋 CAMPEÃO DA DIVISÃO (04/11): só na última rodada, encerrada, com a prova do título que a tela da carreira põe
const div={context:{id:'555:38:3:8',homeClubId:3,awayClubId:8,tituloDivisao:'carA'},viewerClubId:3,minute:93,homeScore:0,awayScore:2,finished:true};
assert.equal(ULTIMA_RODADA_LIGA,38);
assert.equal(rodadaDaLiga('555:38:3:8'),38);assert.equal(rodadaDaLiga('-12:5:3:8'),5);assert.equal(rodadaDaLiga('9:copa:5:Final:leg:0:3:8'),null);
assert.equal(tipoFinalDaPartida(div.context.id),null,'rodada de liga não vira final');
assert.deepEqual(tituloDaDivisao(div),{vencedor:'home',usuario:'home',campeao:true,tipo:'carA'},'campeão mesmo perdendo o último jogo');
assert.deepEqual(tituloDaDivisao({...div,viewerClubId:8,context:{...div.context,tituloDivisao:'carV'}}),{vencedor:'away',usuario:'away',campeao:true,tipo:'carV'},'campeão jogando fora');
assert.equal(tituloDaDivisao({...div,finished:false}),null,'nunca antes do apito da última rodada');
assert.equal(tituloDaDivisao({...div,minute:70}),null,'placar guardado no meio do jogo não é apito');
assert.equal(tituloDaDivisao({...div,context:{...div.context,id:'555:37:3:8'}}),null,'só a última rodada');
assert.equal(tituloDaDivisao({...div,context:{...div.context,tituloDivisao:undefined}}),null,'sem a prova do título (vice/acesso): nada');
assert.equal(tituloDaDivisao({...div,context:{...div.context,tituloDivisao:'final'}}),null,'só tema de divisão');
assert.equal(tituloDaDivisao({...div,viewerClubId:44}),null,'jogo de outro clube: nada');
assert.equal(desfechoDaFinal(div),null,'a festa de FINAL não liga em rodada de liga');
for(const [d,t] of [['A','carA'],['B','carB'],['C','carC'],['D','carD'],['V','carV']])assert.equal(divisaoDaFesta(d),t);
assert.equal(divisaoDaFesta('X'),null);assert(ehDivisaoFesta('carB'));assert(!ehDivisaoFesta('champions'));
assert.equal(temaDaFesta('carA').frase[0],'O BRASIL É SEU');assert.equal(temaDaFesta('carV').frase[0],'REI DO TERRÃO');
assert.equal(placaDoPodio({tipo:'carA'}).linha,'SÉRIE A');assert.equal(placaDoPodio({tipo:'carV'},true).linha,'VÁRZEA');
console.log(JSON.stringify({status:'PASS',divisionTitle:true,wholeSquadParty:true,photographers:true,themes:true,internationalFinals:true,penaltyFinals:true,finalFromCompetitionId:true,noSpoilerBeforeWhistle:true,drawNoParty:true,podiumOwner:true,populationCaps:true,partyFitsWindow:true}));
