import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {novoMotor2} from '../../src/escalacao/motor2/carreira.ts';
import {transcreverPartidaOficial,lerRelatoOficial,textoNarracaoOficial} from '../../src/escalacao/partida-relato-oficial.ts';
import {prepararReplayOficial} from '../../src/escalacao/presidencia-replay-oficial.ts';
import {FutebolOficial3D} from '../../src/escalacao/presidencia-futebol-oficial.ts';
const results=[];
for(const dataset of ['neymarzetti-current','generic-1','generic-29']){
 const {input}=JSON.parse(await readFile(`test-results/animation-library/${dataset}/football-input.json`)),before=structuredClone(input),transcript=transcreverPartidaOficial(input),en=transcreverPartidaOficial(input,true),game=novoMotor2(input),adapter=new FutebolOficial3D(input),roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos})),state={context:{id:dataset,home:roster(input.casa),away:roster(input.fora)},officialInput:input};
 let frames=0;
 for(let i=0;i<=94*60;i++){
  const minute=(i/60)/(90/93);game.avancaAte(minute);const cinema=lerRelatoOficial(transcript,minute),field=adapter.sample(state,minute);
  assert.deepEqual(cinema.score,game.placar,`Cinema score ${dataset} ${minute}`);assert.equal(cinema.narration,textoNarracaoOficial(game.narra),`Narration ${dataset} ${minute}`);assert.equal(cinema.eventCount,game.eventos.length);assert.deepEqual(field.official.events,game.eventos);assert.deepEqual(field.official.score,cinema.score);frames++;
 }
 assert.deepEqual(transcript.events,en.events,'Language cannot change official play');assert.deepEqual(transcript.goals,en.goals);assert.deepEqual(input,before);
 const proof=prepararReplayOficial(input,transcript.goals);assert.ok(proof.valid);
 if(transcript.goals.length){for(const changed of [{name:'Wrong scorer'},{min:transcript.goals[0].min+1},{assist:'Wrong assist'}])assert.equal(prepararReplayOficial(input,transcript.goals.map((g,i)=>i?g:{...g,...changed})).valid,false,'Reject mismatching saved facts');}
 const end=lerRelatoOficial(transcript,120);for(const minute of [0,40,20,92,0,120]){const replay=novoMotor2(input);replay.avancaAte(minute);assert.deepEqual(lerRelatoOficial(transcript,minute).score,replay.placar,'Seeking reads the same source');}assert.equal(lerRelatoOficial(transcript,120),end);
 results.push({dataset,frames,score:end.score,events:transcript.events.length,goals:transcript.goals,narrationMatches2D:true,threeViewsSameEvents:true,inputUnchanged:true});
}
await mkdir('test-results/cartoon-football/tres-apresentacoes',{recursive:true});await writeFile('test-results/cartoon-football/tres-apresentacoes/paridade.json',JSON.stringify(results,null,2));console.log(results);
