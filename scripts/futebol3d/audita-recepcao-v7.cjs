const fs=require('node:fs'),assert=require('node:assert/strict');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const {installReceptionCutover}=require('./recepcao-experimento.cjs');
const out='test-results/fundamentos-mapa/v7';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await loadDependency('playwright').chromium.launch(browserOptions());try{
 const report={};
 for(const [name,port,start,seeds]of [['before',5301,0,16],['proposal',5309,0,16],['samePlay',5309,83,1]]){
  const p=await b.newPage();if(port===5309)await installReceptionCutover(p,start);
  await p.route('**/recepcao-scan',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Teste local de recepção</title>'}));
  await p.goto('http://127.0.0.1:'+port+'/recepcao-scan');
  report[name]=await p.evaluate(async seeds=>{
   const {novoMotor2}=await import('/src/escalacao/motor2/carreira.ts');
   const {input}=await fetch('/test-results/animation-library/neymarzetti-current/football-input.json').then(r=>r.json());
   const runs=[];
   for(let seed=1;seed<=seeds;seed++){
    const m=novoMotor2({...structuredClone(input),seed}),playersAtStart=m.atl.length,headers=[],receives=[],oldHeader=m.cabeceia,oldReceive=m.pega;
    const contact=p=>({t:m.t,name:p.nome,side:p.lado,h:m.bola.h,d:Math.hypot(p.x-m.bola.x,p.y-m.bola.y),from:m.bola.lance?.tipo,sender:m.bola.lance?.de.nome,x:m.bola.x,y:m.bola.y,nearest:Math.min(...m.atl.filter(a=>a.lado!==p.lado&&!a.expulso).map(a=>Math.hypot(p.x-a.x,p.y-a.y)))});
    m.cabeceia=function(p){headers.push(contact(p));return oldHeader.call(this,p)};
    m.pega=function(p,...args){receives.push(contact(p));return oldReceive.call(this,p,...args)};
    m.avancaAte(82.9*93/90);const checkpoint={ball:{x:m.bola.x,y:m.bola.y,h:m.bola.h},players:m.atl.map(p=>[p.nome,p.x,p.y]),events:structuredClone(m.eventos)};
    m.avancaAte(120); // inclui os acréscimos que variam entre as sementes
    runs.push({seed,finished:m.fim,time:m.t,playersAtStart,players:m.atl.length,score:m.placar,events:m.eventos,diag:m.diag,headers,receives,checkpoint,finite:m.atl.every(p=>[p.x,p.y,p.vx,p.vy].every(Number.isFinite))&&[m.bola.x,m.bola.y,m.bola.h].every(Number.isFinite)});
   }
   return runs;
  },seeds);await p.close();
 }
 fs.writeFileSync(out+'/audit.json',JSON.stringify(report,null,2));
 assert.deepEqual(report.samePlay[0].checkpoint,report.before[0].checkpoint,'The reviewed play must begin from the same state');
 const same=report.samePlay[0],received=same.receives.find(c=>c.name==='Cuadrado'&&c.t>83);
 assert(received&&received.h<=.22&&received.d<=1.2,'Cuadrado must reach and control the descending ball');
 assert(!same.headers.some(c=>c.name==='Cuadrado'&&c.t>83),'No automatic midfield header');
 for(const runs of Object.values(report))for(const r of runs){assert(r.finished&&r.playersAtStart===22&&r.finite);if(r.players<22)assert(r.events.some(e=>e.tipo==='vermelho'),'A player cannot disappear without an expulsion');assert.deepEqual(r.diag.erros,[])}
 const summary={samePlay:{before:report.before[0].headers.filter(c=>c.t>83),after:received},fullMatchChanges:report.proposal.map((r,i)=>({seed:r.seed,before:report.before[i].score,after:r.score,eventsChanged:JSON.stringify(r.events)!==JSON.stringify(report.before[i].events),headersBefore:report.before[i].headers.length,headersAfter:r.headers.length})),limits:['Proposta isolada; não aplicada ao jogo oficial.','Domínio com os pés após a descida; amortecimento no peito ainda não implementado nesta proposta.','Mudar recepção altera decisões e pode alterar resultados futuros.']};
 fs.writeFileSync(out+'/resumo.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
