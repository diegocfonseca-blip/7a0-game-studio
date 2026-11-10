// Regressão do guia da carreira, somente na bancada local.
// Inicie npm run dev -- --host 127.0.0.1 --port 4192 e rode node scripts/testa-inicio-carreira.mjs.
// CAREER_QA_URL e CHROMIUM_PATH permitem outra porta/base e outro Chromium. Todas as APIs externas e WebSockets são bloqueados.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.CAREER_QA_OUT??'/tmp/leilao-inicio-carreira-qa';mkdirSync(out+'/depois',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
const base=process.env.CAREER_QA_URL??'http://127.0.0.1:4192/7a0-game-studio/scripts/teste-inicio-carreira/index.html';
const localHost=new URL(base).hostname;
try{
 for(const [device,width,height] of [['celular',390,844],['desktop',1440,1000],['compacto',320,740]]){
  const context=await browser.newContext({viewport:{width,height},locale:'pt-BR'});
  await context.route('**/*',r=>new URL(r.request().url()).hostname===localHost?r.continue():r.abort());
  await context.routeWebSocket('**/*',ws=>ws.close());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const checks=[];
  const ok=(label)=>checks.push(label);
  const open=async stage=>{await page.goto(`${base}?stage=${stage}`,{waitUntil:'networkidle',timeout:60000});await page.waitForFunction(()=>window.qaState);};
  const screen=()=>page.evaluate(()=>window.qaState.screen);
  const money=()=>page.evaluate(()=>window.qaState.managers[window.qaState.youIdx].money);
  await open('intro');assert.equal(await money(),100);assert.equal(await screen(),'streamIntro');
  await page.getByRole('button',{name:'Aprender a dar um lance →',exact:true}).click();
  if(device!=='compacto')await page.screenshot({path:`${out}/depois/${device}-treino.png`,fullPage:true,animations:'disabled'});
  const practice=page.getByRole('spinbutton',{name:'Valor do lance de treino'});
  for(const [value,expected] of [[5,'Deu empate.'],[4,'Desta vez, o rival levou.'],[7,'Seu lance foi o maior.']]){
   await practice.fill(String(value));await page.getByRole('button',{name:'Simular revelação →',exact:true}).click();
   assert.equal(await page.getByRole('heading',{name:expected,exact:true}).count(),1);
   assert.equal(await money(),100);assert.equal(await screen(),'streamIntro');
   if(value!==7)await page.getByRole('button',{name:'Testar outro valor ↗',exact:true}).click();
  }
  ok('Treino: vitória, derrota e empate sem alterar caixa, elenco ou fase do jogo');
  if(device!=='compacto')await page.screenshot({path:`${out}/depois/${device}-treino-resultado.png`,fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Entendi. Próximo passo →',exact:true}).click();
  if(device!=='compacto')await page.screenshot({path:`${out}/depois/${device}-pronto.png`,fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Começar meu pregão →',exact:true}).click();
  await page.waitForFunction(()=>window.qaState.screen==='auction');assert.equal(await money(),100);
  assert.ok(await page.evaluate(()=>window.qaState.phaseDeadline-Date.now()>25000));ok('O relógio começa na entrada no pregão real, depois do treino');
  const row=page.locator('.ll-auction-list .ll-box').first();const name=await page.evaluate(()=>window.qaState.currentCards[0].name);
  const color=await row.getByText(name,{exact:true}).evaluate(el=>getComputedStyle(el).color);assert.equal(color,'rgb(12, 12, 12)');
  for(let n=0;n<7;n++)await row.getByRole('button',{name:'+',exact:true}).click();
  assert.equal(await money(),100);assert.match(await page.locator('.csg-context').innerText(),/somam 7 moedas/);ok('Lance de 7 atualiza a dica e reserva o orçamento sem cobrar antes da revelação');
  await page.locator('.csg-context').getByRole('button',{name:'Entendi ✓'}).click();assert.equal(await page.locator('.csg-context').count(),0);
  await page.getByRole('button',{name:/LACRAR/i}).click();await page.waitForFunction(()=>window.qaState.phase==='reveal');ok('Envio do envelope chega à revelação pelo motor existente');
  await open('central');assert.equal(await page.locator('.cv2-quick-links').count(),1);assert.equal(await page.locator('.ll-c-hero .cv2-quick-links').count(),0);assert.equal(await page.locator('.ll-central-salvar').count(),1);ok('Central: um grupo de atalhos e uma faixa de salvar, fora dos escudos do confronto');
  await page.getByRole('button',{name:'Conferir meu elenco →',exact:true}).click();await page.waitForSelector('.cv2-view-elenco');ok('Atalho Elenco continua funcionando');
  await open('unlock-condition');assert.equal(await page.getByRole('heading',{name:'Condição física desbloqueada'}).count(),1);
  if(device!=='compacto')await page.screenshot({path:`${out}/depois/${device}-desbloqueio-condicao.png`,fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Ver as barras no Elenco →',exact:true}).click();
  await page.waitForSelector('.cv2-view-elenco');assert.equal(await page.locator('[data-unlock="condicao"]').count(),0);
  assert.equal(await page.evaluate(()=>window.qaState.careerSeen.condicao),true);ok('Condição física: atalho abre o Elenco e não duplica o aviso antigo');
  await page.evaluate(()=>window.qaPersist());await page.goto(`${base}?stage=central&resume=1`,{waitUntil:'networkidle',timeout:60000});await page.waitForFunction(()=>window.qaState);
  assert.equal(await page.evaluate(()=>window.qaState.careerSeen.condicao),true);assert.equal(await page.getByRole('heading',{name:'Condição física desbloqueada'}).count(),0);ok('Aviso entendido permanece fechado após serializar e retomar a carreira');
  await page.getByRole('button',{name:'? Guia da carreira +',exact:true}).click();assert.equal(await page.getByText('Condição física e reservas',{exact:true}).count(),1);ok('Explicação da condição física continua disponível na ajuda');
  await open('unlock-moral');assert.equal(await page.getByRole('heading',{name:'Sua resposta mexeu com o elenco'}).count(),1);ok('Moral explica um efeito real da coletiva, sem inventar desbloqueio por divisão');
  if(device!=='compacto')await page.screenshot({path:`${out}/depois/${device}-aviso-moral.png`,fullPage:true,animations:'disabled'});
  await open('reserves');assert.match(await page.locator('.csg-context').innerText(),/montar seu banco/);ok('Leilão de reservas tem explicação própria, sem tratar como nova carreira');
  if(device!=='compacto')await page.screenshot({path:`${out}/depois/${device}-reservas.png`,fullPage:true,animations:'disabled'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);assert.deepEqual(errors,[]);
  results.push({device,width,checks,overflow,pageErrors:errors});await context.close();
 }
 writeFileSync(`${out}/validacao-funcional.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}catch(error){console.error(error);process.exitCode=1;}finally{await browser.close();}
