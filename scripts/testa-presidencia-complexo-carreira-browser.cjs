const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency, browserOptions} = require('./presidencia-runtime.cjs');

// Read-only integration fixture. All transactions use a fictitious local career.
const origin = 'http://127.0.0.1:4196', output = path.resolve('test-results/complexo-3d');
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const inspect = page => page.evaluate(() => ({...window.carreiraComplexoSnapshot(), scene: window.carreiraComplexo3D?.inspect()}));
const readyPortrait = async page => {
  await page.waitForFunction(() => document.querySelector('.qa-president .pc-frame[aria-busy="false"]') || document.querySelector('.qa-president .pc-error'));
  const error = await page.locator('.qa-president .pc-error').allTextContents();
  assert.deepEqual(error, [], 'o personagem existente precisa carregar suas artes');
};
async function stable(page, baseline) {
  const current = await inspect(page);
  assert.equal(await page.evaluate(() => window.carreiraOriginalApi === window.carreiraComplexo3D && window.carreiraOriginalCanvas === document.querySelector('[data-complexo-3d] canvas')), true);
  for (const key of ['camera', 'target', 'view', 'architecture', 'state']) assert.deepEqual(current.scene[key], baseline.scene[key], key + ' mudou ao atualizar dados de apresentação');
  assert.equal(current.scene.match.time, baseline.scene.match.time);
  if (current.scene.circulation) assert.equal(current.scene.circulation.seconds, 31.5);
  assert.equal(current.input.state.careerCoins[42], 11, 'transação tocou o adversário');
  return current;
}
async function trade(page, request) {
  const result = await page.evaluate(request => window.negociarCarreiraComplexo(request), request);
  assert.equal(result.ok, true, JSON.stringify(result));await frame(page);await readyPortrait(page);
}
(async () => {
  fs.mkdirSync(output, {recursive: true});
  const browser = await loadDependency('playwright').chromium.launch(browserOptions()), reports = [];
  try {
    for (const device of [
      {name: 'desktop', viewport: {width: 1280, height: 960}, deviceScaleFactor: 1},
      {name: 'mobile', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true},
    ]) {
      const {name, ...options} = device, context = await browser.newContext({...options, locale: 'pt-BR', reducedMotion: 'reduce'});
      const page = await context.newPage(), errors = [];page.setDefaultTimeout(120000);
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', message => {if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text());});
      page.on('response', response => {if (response.status() >= 400 && response.url().startsWith(origin) && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`);});
      await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      try {
        await page.goto(origin + '/7a0-game-studio/qa-presidencia-complexo-carreira.html', {waitUntil: 'domcontentloaded'});
        await page.waitForFunction(() => !!window.carreiraComplexo3D);await readyPortrait(page);
        const initial = await inspect(page);
        assert.equal(initial.adapted.complexo.qaPopulation, false);
        assert.equal(initial.adapted.sala.pose, 'standing');assert.equal(initial.adapted.sala.physicalPresident, false);
        assert.deepEqual(initial.scene.furniture.renderedFurniture, []);
        assert.equal(initial.scene.crowd.mode, 'career');assert.equal(initial.scene.crowd.away, 0);
        assert.deepEqual(initial.adapted.sala.president, initial.input.state.careerPresidentBase);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.locator('.qa-president').screenshot({path:path.join(output, `${name}-carreira-personagem-em-pe.png`)});
        await page.getByRole('button', {name:'Partida local pausada · 20′', exact:true}).click();
        await frame(page);
        await page.evaluate(() => {
          window.carreiraOriginalApi = window.carreiraComplexo3D;
          window.carreiraOriginalCanvas = document.querySelector('[data-complexo-3d] canvas');
          window.carreiraComplexo3D.view('room');window.carreiraComplexo3D.seekCirculation(31.5);
        });
        const baseline = await inspect(page);assert.equal(baseline.scene.match.time,14);assert.equal(baseline.scene.match.players,22);
        assert.equal(baseline.scene.crowd.away,0);assert.equal(baseline.scene.visits.length,1);
        for (const id of ['mesa-simples','cadeira-simples','estante-madeira','quadro']) await trade(page,{kind:'buy',id});
        let state = await stable(page,baseline);
        assert.equal(state.adapted.sala.pose,'seated');assert.equal(state.adapted.sala.hasShelf,true);
        assert.deepEqual(state.scene.furniture.renderedFurniture.slice().sort(),state.adapted.complexo.presidency.owned.map(i=>i.id).sort());
        assert.deepEqual(state.adapted.sala.president, initial.adapted.sala.president);
        assert(state.adapted.complexo.presidency.cash < initial.adapted.complexo.presidency.cash);
        assert.equal(await page.getByRole('img',{name:'Presidente sentado',exact:true}).count(),1);
        await trade(page,{kind:'buy',id:'mesa-madeira',replaceId:'mesa-simples'});
        state = await stable(page,baseline);
        assert(!state.scene.furniture.renderedFurniture.includes('mesa-simples'));
        assert(state.scene.furniture.renderedFurniture.includes('mesa-madeira'));
        const dressed = await page.evaluate(() => {
          const president=window.carreiraComplexoSnapshot().input.state.careerPresidentBase;
          const outfit=window.carreiraComplexoFixtures.outfits.at(-1).id;
          const skinTone=window.carreiraComplexoFixtures.skinTones.at(-1).id;
          return {outfit,skinTone,result:window.vestirCarreiraComplexo(outfit,{...president.appearance,skinTone})};
        });
        assert(dressed.result.ok);await frame(page);await readyPortrait(page);
        state=await stable(page,baseline);
        assert.equal(state.adapted.sala.president.outfit,dressed.outfit);
        assert.equal(state.adapted.sala.president.appearance.skinTone,dressed.skinTone);
        assert.equal(state.adapted.sala.president.sinceSeason,1);
        const layers=await page.locator('.qa-president [data-layer]').evaluateAll(elements=>elements.map(el=>el.dataset.layer));
        assert.deepEqual(layers.slice().sort(),state.adapted.sala.layerIds.slice().sort());
        await page.locator('.qa-president').screenshot({path:path.join(output,`${name}-carreira-personagem-sentado.png`)});
        await page.locator('[data-complexo-3d]').screenshot({path:path.join(output,`${name}-carreira-camarote-compras.png`)});
        await page.evaluate(()=>window.carreiraComplexo3D.view('follow-home'));
        const followBaseline=await inspect(page), homeRig=followBaseline.scene.visits.find(v=>v.side==='home').rigId;
        assert.equal(followBaseline.scene.following,'home');
        await page.getByRole('button',{name:'Informar adversário desta partida',exact:true}).click();await frame(page);
        state=await stable(page,followBaseline);assert(state.scene.crowd.away>0);assert.equal(state.scene.visits.length,2);
        assert.equal(state.scene.visits.find(v=>v.side==='home').rigId,homeRig,'chegada visitante recriou o torcedor acompanhado');
        assert.equal(state.scene.following,'home','chegada visitante soltou a câmera da casa');
        assert(state.scene.visits.every(v=>v.source==='career'));
        await page.evaluate(() => {
          const input=window.carreiraComplexoSnapshot().input;
          window.setCarreiraComplexo({away:{...input.away,matchId:'outra-partida'}});
        });await frame(page);
        state=await stable(page,followBaseline);assert.equal(state.scene.crowd.away,0);assert.equal(state.scene.visits.length,1);
        assert.equal(state.scene.visits[0].rigId,homeRig,'saída visitante recriou o torcedor da casa');
        assert.equal(state.scene.following,'home');
        await page.evaluate(()=>window.carreiraComplexo3D.view('room'));
        await page.evaluate(() => {
          const {match}=window.carreiraComplexoSnapshot().input;
          window.setCarreiraComplexo({match:{...match,minute:32,visualClock:{...match.visualClock,seconds:27,sampledAt:performance.now()}}});
        });await frame(page);
        state=await inspect(page);assert.equal(state.scene.match.time,27);
        assert.deepEqual(state.scene.camera,baseline.scene.camera);assert.equal(state.scene.circulation.seconds,31.5);
        const purchased=state.input.state.careerPresidency, president=state.input.state.careerPresidentBase;
        await page.evaluate(() => {window.carreiraBeforeEmpty=window.carreiraComplexo3D;window.setCarreiraComplexoStage('empty');});
        await page.waitForFunction(() => window.carreiraComplexo3D && window.carreiraComplexo3D!==window.carreiraBeforeEmpty);
        state=await inspect(page);
        assert.deepEqual(state.scene.furniture.renderedFurniture,[]);
        assert.deepEqual(state.input.state.careerPresidency,purchased);assert.deepEqual(state.input.state.careerPresidentBase,president);
        assert.equal(state.scene.match.players,22,'partida deve existir também na várzea');assert.equal(state.scene.match.time,27);
        assert.deepEqual(state.scene.visits,[]);assert.equal(state.scene.architecture.roof,false);
        await page.evaluate(()=>window.setCarreiraComplexo({day:undefined}));await frame(page);
        state=await inspect(page);assert.equal(state.scene.crowd.mode,'off');assert.equal(state.scene.crowd.total,0);assert.equal(state.scene.circulation,undefined);
        await page.evaluate(()=>window.setCarreiraComplexo({enabled:false}));await frame(page);
        assert.equal(await page.locator('[data-complexo-3d] canvas').count(),0);
        assert.equal(await page.evaluate(()=>window.carreiraComplexo3D),null);
        assert.deepEqual(errors,[]);
        reports.push({device:name,initial:{president:initial.adapted.sala.president,furniture:initial.scene.furniture},dressed,final:state,errors});
        console.log(`PASS ${name}: carreira local, compras/troca, personagem e artes preservados, relógio único, adversário explícito, várzea com22jogadores, ausência de dados sem público inventado e cleanup.`);
      } catch (error) {
        console.error('Diagnostics', JSON.stringify({device:name,errors,portrait:await page.locator('.qa-president').innerHTML().catch(()=>''),state:await inspect(page).catch(()=>null)}));
        await page.screenshot({path:path.join(output,`${name}-carreira-failure.png`),fullPage:false}).catch(()=>{});
        throw error;
      } finally {await context.close();}
    }
    fs.writeFileSync(path.join(output,'carreira-browser-report.json'),JSON.stringify(reports,null,2));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
