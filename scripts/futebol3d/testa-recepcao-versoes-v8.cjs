// Regressão real do motor comum: conta, save, placar rápido, Campo2D, cinema e mapa 3D.
// Somente localhost; não faz login nem acessa/grava a carreira na nuvem.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out='test-results/fundamentos-mapa/v8';fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync('test-results/animation-library/neymarzetti-current/football-input.json','utf8'));
(async()=>{
 const browser=await loadDependency('playwright').chromium.launch(browserOptions());
 async function page(port=5309){
  const p=await browser.newPage();if(p.routeWebSocket)await p.routeWebSocket('**/*',s=>s.close());
  await p.route('**/teste-versoes-v8',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Regressão local V8</title>'}));
  await p.goto('http://127.0.0.1:'+port+'/teste-versoes-v8');return p;
 }
 const report={};try{
  for(const [name,port]of [['baseline',5301],['legacy',5309]]){
   const p=await page(port);report[name]=await p.evaluate(async fixture=>{
    const {novoMotor2}=await import('/src/escalacao/motor2/carreira.ts');const runs=[];
    for(let seed=1;seed<=16;seed++){const input={...structuredClone(fixture.input),seed};delete input.versao;const g=novoMotor2(input);g.avancaAte(93);runs.push({seed,score:g.placar,events:g.eventos,finished:g.fim,stats:g.stats});}
    return runs;
   },fixture);await p.close();
  }
  assert.deepEqual(report.legacy,report.baseline,'Entradas sem versão devem reproduzir exatamente a regra anterior (eventos, placar e estatísticas)');
  console.log('PASS: 16 partidas antigas idênticas à base V6');
  const p=await page();
  report.gate=await p.evaluate(async()=>{
   const G=await import('/src/escalacao/motor2-recepcao-conta.ts'),{VERSAO_RECEPCAO_M2:version}=await import('/src/escalacao/motor2/versao.ts');
   const ok=(value,msg)=>{if(!value)throw Error(msg)},email='diego.c.fonseca@gmail.com';
   const s={careerOnline:true,onlineMode:'offline',sport:'futebol',seasonNo:3,round:12,motor2Desde:{season:1,round:0}};
   ok(G.podeAtivarRecepcaoM2(s,email),'Conta autorizada');
   for(const blocked of [null,'','outro@example.com','diego.c.fonseca@gmail.com.evil'])ok(!G.podeAtivarRecepcaoM2(s,blocked),'Outra conta não pode ativar');
   for(const patch of [{careerOnline:false},{onlineMode:'online'},{co2:{room:'x'}},{sport:'basquete'},{motor2Desde:undefined}])ok(!G.podeAtivarRecepcaoM2({...s,...patch},email),'Outro modo não pode ativar');
   const marker=G.marcoNovaRecepcaoM2(s,email);ok(marker.season===3&&marker.round===12,'Próxima rodada, sem mudar a atual');
   const saved={...s,motor2RecepcaoDesde:marker};ok(G.marcoNovaRecepcaoM2(saved,email)===undefined,'Ativação idempotente');
   ok(G.recepcaoM2Desde(saved,email)===12&&G.recepcaoM2Desde({...saved,seasonNo:4},email)===0,'Temporada seguinte');
   ok(G.recepcaoM2Desde({...saved,seasonNo:2},email)===undefined,'Temporada anterior');
   for(let round=0;round<12;round++)ok(G.versaoRecepcaoNaRodada(round,12)===undefined,'Rodada já iniciada preservada');
   ok(G.versaoRecepcaoNaRodada(12,12)===version,'Próxima partida autorizada');
   ok(!G.versaoRecepcaoNaCopa(12,5)&&G.versaoRecepcaoNaCopa(12,38)===version,'Copa iniciada preservada');
   return {authorizedOnly:true,onlineUnaffected:true,activation:marker,existingRoundsPreserved:12,existingCupPreserved:true};
  });
  console.log('PASS: restrição por conta/modo e marco de ativação');
  report.parity=await p.evaluate(async fixture=>{
   const {entradaM2,novoMotor2,resultadoM2,tiraNovos,carregaGuardados}=await import('/src/escalacao/motor2/carreira.ts');
   const {VERSAO_RECEPCAO_M2:versao}=await import('/src/escalacao/motor2/versao.ts');
   const {transcreverPartidaOficial,lerRelatoOficial,textoNarracaoOficial}=await import('/src/escalacao/partida-relato-oficial.ts');
   const {prepararReplayOficial}=await import('/src/escalacao/presidencia-replay-oficial.ts');
   const {FutebolOficial3D}=await import('/src/escalacao/presidencia-futebol-oficial.ts');
   const {RelogioCampo3D}=await import('/src/escalacao/presidencia-futebol-relogio.ts');
   const {publicarTempoCampo2D}=await import('/src/escalacao/campo2d-relogio.ts');
   const eq=(a,b,msg)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(msg)},ok=(v,msg)=>{if(!v)throw Error(msg)};
   const fixtureBefore=JSON.stringify(fixture),runs=[];
   for(let seed=1;seed<=16;seed++){
    const e=entradaM2({...structuredClone(fixture.input),seed,versao}),before=JSON.stringify(e);
    ok(e.versao===versao,'Novo jogo deve ter versão');
    const result=resultadoM2(e),relato=transcreverPartidaOficial(e),g=novoMotor2(e);
    const state={officialInput:e,minute:0,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#f00',awayColor:'#fff',context:{id:'v8-'+seed,home:e.casa.map((c,i)=>({...c,id:String(i)})),away:e.fora.map((c,i)=>({...c,id:String(i)}))}};
    const view=new FutebolOficial3D(e);let last;
    for(let minute=0;minute<=120;minute++){
     g.avancaAte(minute);last=view.sample(state,minute,{replay:false,postMatchWalk:false});
     const cinema=lerRelatoOficial(relato,minute);
     eq(last.official.events,g.eventos,'Eventos 2D e 3D diferentes, seed '+seed+' minuto '+minute);
     eq(last.official.score,g.placar,'Placar 2D e 3D diferente');eq(cinema.score,g.placar,'Placar cinema diferente');
     ok(cinema.eventCount===g.eventos.length,'Cinema deve ler os mesmos eventos');
     ok(cinema.narration===textoNarracaoOficial(g.narra),'Narração cinema/2D diferente');
    }
    ok(g.fim&&last.official.finished&&relato.frames.at(-1).finished,'Todos devem alcançar o apito final');
    eq(result.placar,g.placar,'Resultado rápido divergente');eq(relato.events,g.eventos,'Relato completo divergente');
    const goals=result.gols.map(x=>({home:x.home,name:x.nome+(x.contra?' (contra)':''),min:x.min,assist:x.assist}));
    eq(goals,relato.goals,'Autor/minuto/assistência diferente');ok(prepararReplayOficial(e,goals).valid,'Replay válido recusado');
    ok(!prepararReplayOficial(e,[...goals,{home:true,name:'Inexistente',min:1}]).valid,'Histórico divergente não pode ser aceito');
    if(goals.length)for(const change of [{name:'Autor diferente'},{min:goals[0].min===1?2:1},{assist:'Assistência diferente'}]){
     ok(!prepararReplayOficial(e,[{...goals[0],...change},...goals.slice(1)]).valid,'Mesmo placar não basta: autoria/minuto/assistência precisam coincidir');
    }
    // Voltar a câmera/leitura no tempo mantém o mesmo prefixo da partida, sem novo resultado.
    const back=view.sample(state,37.5,{replay:false,postMatchWalk:false});
    eq(back.official.events,relato.events.filter(x=>x.t<=37.5*90/93),'Seek alterou eventos');
    eq(view.sample(state,120,{replay:false,postMatchWalk:false}).official.events,relato.events,'Reabrir mapa alterou partida');
    eq(JSON.stringify(e),before,'Visualizações modificaram a entrada oficial');
    runs.push({seed,score:result.placar,goals,events:g.eventos.length,endMinute:relato.endMinute,matchFinished:g.fim});
   }
   // A mesma partida em velocidades e cadências diferentes. O relógio muda a
   // amostragem, mas os timestamps oficiais são os do mesmo motor determinístico.
   const e=entradaM2({...structuredClone(fixture.input),seed:101,versao}),relato=transcreverPartidaOficial(e),rates=[];
   const state={officialInput:e,minute:0,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#f00',awayColor:'#fff',context:{id:'v8-clock',home:e.casa.map((c,i)=>({...c,id:String(i)})),away:e.fora.map((c,i)=>({...c,id:String(i)}))}};
   for(const rate of [.5,1,2]){
    const clock=new RelogioCampo3D(),view=new FutebolOficial3D(e),g=novoMotor2(e),ms=1000/rate,step=1000/30;let last,minute=0;
    for(let frame=0;frame<=Math.ceil(120*ms/step);frame++){
     const now=frame*step,coarse=Math.floor(now/ms);
     minute=clock.sample({...state,minute:coarse,officialMinuteMs:ms,visualClock:{seconds:now/1000,sampledAt:coarse*ms,running:true}},now);
     g.avancaAte(minute);last=view.sample(state,minute,{replay:false,postMatchWalk:false});
     eq(last.official.events,g.eventos,'Velocidade alterou eventos 2D/3D');eq(lerRelatoOficial(relato,minute).score,g.placar,'Velocidade alterou cinema');
    }
    eq(last.official.events,relato.events,'Velocidade alterou sequência oficial');
    rates.push({rate,wallSecondsFor90Minutes:90/rate,score:last.official.score,events:last.official.events.length});
   }
   // Quando as duas vistas estão montadas, o mapa usa o minuto exato publicado pelo Campo2D.
   publicarTempoCampo2D(state.context.id,41.25,1000);
   ok(new RelogioCampo3D().sample({...state,minute:40,officialMinuteMs:500},1000)===41.25,'Relógios não sincronizados');
   publicarTempoCampo2D(state.context.id,null);
   // Versão persistida: reabrir um save recupera a regra, não a escolha da UI.
   const saved=tiraNovos();ok(Object.values(saved).every(v=>v[4]===versao),'Save precisa da versão');
   carregaGuardados(JSON.parse(JSON.stringify(saved)),3);
   ok(entradaM2({...fixture.input,seed:1}).versao===versao,'Save novo reaberto sem liberação não pode virar legado');
   const old=entradaM2({...structuredClone(fixture.input),seed:20001});delete old.versao;
   const oldResult=resultadoM2(old),oldSaved=tiraNovos();
   ok(Object.values(oldSaved).every(v=>v.length===4),'Formato antigo deve continuar compatível');
   carregaGuardados(JSON.parse(JSON.stringify(oldSaved)),3);
   const restored=entradaM2({...old,versao});ok(!restored.versao,'Resultado antigo não pode migrar');eq(resultadoM2(restored),oldResult,'Resultado salvo antigo alterado');
   const fresh=entradaM2({...old,seed:20002,versao});ok(fresh.versao===versao,'Nova partida deve usar correção');
   // Uma troca de conta/save na mesma aba descarta caches e gravações pendentes.
   carregaGuardados(undefined,1,'outra-conta:outro-save');
   ok(!entradaM2({...fixture.input,seed:1}).versao,'Outra conta herdou a regra privada do cache');
   ok(tiraNovos()===null,'Outra conta herdou gravações pendentes');
   carregaGuardados(JSON.parse(JSON.stringify(saved)),3,'conta-de-teste:save-original');
   ok(entradaM2({...fixture.input,seed:1}).versao===versao,'Save original perdeu sua versão ao reabrir');
   eq(JSON.stringify(fixture),fixtureBefore,'Fixture original modificada');
   return {runs,rates,historyProtected:true,versionRoundTrip:true,sharedClock:true,originalFixtureUnchanged:true};
  },fixture);await p.close();
  console.log('PASS: 16 jogos × resultado rápido/2D/cinema/3D, narração, seek, três velocidades e saves');
  fs.writeFileSync(out+'/versoes-e-paridade.json',JSON.stringify(report,null,2));
  fs.writeFileSync(out+'/resumo.json',JSON.stringify({legacyGames:report.legacy.length,versionedGames:report.parity.runs.length,rates:report.parity.rates,gate:report.gate,historyProtected:true,published:false},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
