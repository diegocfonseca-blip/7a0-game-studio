import assert from 'node:assert/strict'
import {DisputaPenaltisCampo, sequenciaVisualPenaltis, TEMPO_PENALTIS_CAMPO as T, PASSO_PENALTIS_CAMPO as PASSO} from '../../src/escalacao/campo2d-penaltis'
import {Jogo2D} from '../../src/escalacao/campo2d-motor'
import {disputaPenaltisComSequencia} from '../../src/escalacao/penaltis'
const pos=['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA']
const time=(s:string)=>pos.map((pos,i)=>({name:`${s} ${i+1}`,pos,lo:50+i,hi:60+i}))
const a=time('Casa'),b=time('Visitante')
let cenarios=0, maxPasso=0, minSeparacao=Infinity, pior:any=null
for(const pens of [[4,2],[2,4],[6,5],[5,6],[15,14]] as [number,number][]){
 for(const invertido of [false,true]){
  const jogo=new Jogo2D(123,invertido?b:a,invertido?a:b,[])
  const original=JSON.stringify({atl:jogo.atl,placar:jogo.placar,bola:jogo.bola})
  const s=new DisputaPenaltisCampo({id:'teste',pens,aName:'Casa',bName:'Visitante',aSquad:a,bSquad:b,invertido})
  s.preparar(jogo.atl,jogo.bola)
  let anterior=s.quadro()!, ultimo=0
  for(let t=0;t<=s.duracao+1/60;t+=1/60){
   s.elapsed=Math.min(t,s.duracao)
   const q=s.quadro()!, e=s.estado
   assert.equal(q.jogadores.length,22)
   assert(e.reveladas>=ultimo);ultimo=e.reveladas
   assert(q.jogadores.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))
   q.jogadores.forEach((p,i)=>{const d=Math.hypot(p.x-anterior.jogadores[i].x,p.y-anterior.jogadores[i].y);maxPasso=Math.max(maxPasso,d);assert(d<.4,`teleporte ${pens} ${invertido} t=${t} atleta=${i} d=${d}`)})
   if(e.fase==='preparar'||e.fase==='correr'){
    assert.equal(q.bola.x,34);assert.equal(q.bola.y,11)
    assert(Math.abs(q.jogadores[q.goleiro].y-.6)<.01,'goleiro deve esperar na linha')
   }
   if(t>T.organizar&&q.batedor>=0){
    const k=s.seq[e.cobranca]
    assert.equal(jogo.atl[q.batedor].lado,invertido?1-k.side:k.side,'cobrador do time correto na volta')
    assert.notEqual(jogo.atl[q.goleiro].lado,jogo.atl[q.batedor].lado)
    q.jogadores.forEach((p,i)=>q.jogadores.forEach((r,j)=>{if(i<j){const d=Math.hypot(p.x-r.x,p.y-r.y);if(d<minSeparacao){minSeparacao=d;pior={pens,invertido,t,i,j,p,r,fase:e.fase,cobranca:e.cobranca}}}}))
   }
   anterior=q
  }
  assert.deepEqual(s.estado.placar,pens);assert(s.estado.encerrado)
  assert.equal(JSON.stringify({atl:jogo.atl,placar:jogo.placar,bola:jogo.bola}),original,'apresentação não muda o jogo')
  cenarios++
 }
}
// Saves com sequência real, inclusive rodadas de ambos errarem, não podem ser reconstruídos.
for(let seed=1;seed<=50;seed++){
 let n=seed;const rng=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/2**32}
 const r=disputaPenaltisComSequencia(rng)
 const seq=sequenciaVisualPenaltis(r.gols,'A','B',r.seq)
 assert.equal(seq.map(k=>k.ok?'1':'0').join(''),r.seq)
}
const s=new DisputaPenaltisCampo({id:'tempo',pens:[4,2],aName:'A',bName:'B',aSquad:a,bSquad:b})
const j=new Jogo2D(1,a,b,[]);s.avancar(1);assert.equal(s.elapsed,0,'espera o campo existir')
s.preparar(j.atl,j.bola);s.avancar(1,2);assert.equal(s.elapsed,2);s.avancar(4,4,true);assert.equal(s.elapsed,2)
for(let i=0;i<s.seq.length;i++){
 const contato=T.organizar+i*PASSO+T.caminhar+T.preparar+T.correr
 s.elapsed=contato-.001;assert.deepEqual(s.quadro()!.bola,{x:34,y:11,h:0});assert.equal(s.estado.reveladas,i)
 s.elapsed=contato;const q=s.quadro()!;assert(Math.hypot(q.jogadores[q.batedor].x-q.bola.x,q.jogadores[q.batedor].y-q.bola.y)<=2.01)
 s.elapsed=contato+T.voo+.001;assert.equal(s.estado.reveladas,i+1,'placar só revela no resultado')
}
assert(minSeparacao>=2.5,'os marcadores não devem se atravessar durante as cobranças')
console.log(JSON.stringify({cenarios,sequenciasSalvas:50,maxDeslocamentoPorQuadro:maxPasso,minSeparacao,pior,resultado:'PASS'},null,2))
