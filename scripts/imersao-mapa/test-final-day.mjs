// 🏆 Dia de FINAL no mapa 3D: é final? quem é campeão? de quem é o pódio? nada antes do apito?
import assert from 'node:assert/strict';
import {tipoFinalDaPartida,ladoDoUsuario,desfechoDaFinal,corDoPodio,faixaDaFinal,faixaDaFachada,publicoExtraDaFinal,quadroDaFesta,elencoDaFesta,FESTA_FINAL} from '../../src/escalacao/presidencia-complexo-final-regras.ts';
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
console.log(JSON.stringify({status:'PASS',finalFromCompetitionId:true,noSpoilerBeforeWhistle:true,drawNoParty:true,podiumOwner:true,populationCaps:true,partyFitsWindow:true}));
