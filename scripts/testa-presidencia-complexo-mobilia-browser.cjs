const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency, browserOptions} = require('./presidencia-runtime.cjs');

// Local fixtures only. The wallet is read by the scene; this script never
// authenticates, writes a career or changes the public game.
const origin = 'http://127.0.0.1:4196';
const output = path.resolve('test-results/complexo-3d');
const selector = '[data-complexo-3d]';
const inspect = page => page.evaluate(() => window.complexo3D.inspect());
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const capture = (page, name) => page.locator(selector).screenshot({path: path.join(output, name + '.png')});

async function wallet(page, value, status, ids) {
  await page.evaluate(value => window.setComplexoWallet(value), value);
  await page.waitForFunction(({status, ids}) => {
    const current = window.complexo3D?.inspect().furniture;
    return current?.walletStatus === status && JSON.stringify(current.renderedFurniture) === JSON.stringify(ids);
  }, {status, ids});
  await frames(page);
  return inspect(page);
}

async function stable(page, baseline, label) {
  const current = await page.evaluate(() => ({
    sameApi: window.complexo3D === window.mobiliaOriginalApi,
    sameCanvas: document.querySelector('[data-complexo-3d] canvas') === window.mobiliaOriginalCanvas,
    canvases: document.querySelectorAll('[data-complexo-3d] canvas').length,
    state: window.complexo3D.inspect(),
  }));
  assert(current.sameApi && current.sameCanvas, label + ': compra de móvel recriou mundo/API/canvas');
  assert.equal(current.canvases, 1, label + ': mais de um renderer');
  for (const key of ['camera', 'target', 'view', 'cameraFov', 'state', 'architecture', 'establishments', 'populationRebuilds'])
    assert.deepEqual(current.state[key], baseline[key], label + ': alterou ' + key);
  assert.deepEqual(current.state.match, baseline.match, label + ': reiniciou ou alterou partida pausada');
  if (current.state.circulation) {
    assert.equal(current.state.circulation.seconds, baseline.circulation.seconds, label + ': reiniciou passeio');
    assert.deepEqual(current.state.circulation.problems, [], label + ': passagem inválida');
  }
  return current.state;
}

async function stage(page, key) {
  await page.evaluate(key => {window.mobiliaPreviousApi = window.complexo3D; window.setComplexoStage(key);}, key);
  await page.waitForFunction(() => window.complexo3D && window.complexo3D !== window.mobiliaPreviousApi && document.querySelector('[data-complexo-3d][aria-busy="false"] canvas'));
  await frames(page);
  return inspect(page);
}

(async () => {
  fs.mkdirSync(output, {recursive: true});
  const browser = await loadDependency('playwright').chromium.launch(browserOptions()), reports = [];
  try {
    for (const device of [
      {name: 'desktop', viewport: {width: 1400, height: 1000}, deviceScaleFactor: 1},
      {name: 'mobile', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true},
    ]) {
      const {name, ...options} = device;
      const context = await browser.newContext({...options, locale: 'pt-BR', reducedMotion: 'reduce'});
      const page = await context.newPage(), errors = [], resourceErrors = [];
      page.setDefaultTimeout(120000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text());});
      page.on('response', response => {if (response.status() >= 400 && response.url().startsWith(origin + '/') && !response.url().endsWith('/favicon.ico')) resourceErrors.push({url: response.url(), status: response.status()});});
      await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      try {
        await page.goto(origin + '/7a0-game-studio/qa-presidencia-complexo-3d.html', {waitUntil: 'domcontentloaded'});
        await page.waitForFunction(() => window.complexo3D && typeof window.setComplexoWallet === 'function');
        const initial = await inspect(page);
        assert.equal(initial.furniture.walletStatus, 'missing', name + ': QA não começa com bens concedidos');
        assert.deepEqual(initial.furniture.renderedFurniture, []);
        assert.equal(initial.furniture.available, true);
        assert.equal(initial.furniture.ceilingLights,2);
        const pause = page.getByRole('button', {name: 'Pausar passeio', exact: true});
        if (await pause.count()) await pause.click();
        const fixtures = await page.evaluate(async () => {
          const {PRESIDENCIA_CATALOGO} = await import('/7a0-game-studio/src/escalacao/presidencia-economia.ts');
          const furniture = PRESIDENCIA_CATALOGO.filter(item => item.slot !== 'carro' && item.slot !== 'duas-rodas');
          const make = ids => ({cash: 1000, revision: 3, owned: ids.map(id => ({id, paid: PRESIDENCIA_CATALOGO.find(item => item.id === id).price}))});
          const common = furniture.filter(item => !['cadeira-simples', 'mesa-simples', 'estante-simples'].includes(item.id)).map(item => item.id);
          const team = side => ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'].map((pos, i) => ({id: side + i, name: side + i, pos}));
          const match = {context: {id: 'mobilia-browser-local', home: team('h'), away: team('a'), speed: 1}, minute: 20, homeScore: 0, awayScore: 0, paused: true, finished: false, homeColor: '#1b7a3d', awayColor: '#c2452f', visualClock: {seconds: 14, sampledAt: performance.now(), running: false, rate: 1}};
          window.setComplexoMatch(match);
          return {basic: make(['mesa-simples', 'cadeira-simples']), furnished: make([...common, 'fusca']), furnishedIds: [...common].sort(), duplicateSlot: make(['mesa-simples', 'mesa-madeira'])};
        });
        await page.waitForFunction(() => window.complexo3D.inspect().match.players === 22);
        await page.evaluate(() => {
          window.complexo3D.view('room'); window.complexo3D.seekCirculation(31.25);
          window.mobiliaOriginalApi = window.complexo3D;
          window.mobiliaOriginalCanvas = document.querySelector('[data-complexo-3d] canvas');
        });
        await frames(page);
        await page.locator(selector).scrollIntoViewIfNeeded();
        const baseline = await inspect(page);
        assert.equal(baseline.view, 'room');
        const eyeHeight = baseline.camera[1] - baseline.architecture.box.floor;
        assert(eyeHeight >= 1.4 && eyeHeight <= 2.1, name + ': vista interna não está em altura humana: ' + eyeHeight);
        assert(baseline.viewport[1] >= 500, name + ': sala em viewport pequeno');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ': overflow horizontal');
        await capture(page, name + '-mobilia-sala-vazia');

        await wallet(page, fixtures.basic, 'valid', ['cadeira-simples', 'mesa-simples']);
        let current = await stable(page, baseline, 'duas compras básicas');
        assert.equal(current.furniture.renderedFurniture.length, 2);
        assert.equal(current.furniture.president, false); assert.equal(current.furniture.trophies, 0); assert.equal(current.furniture.identity, false);

        await wallet(page, fixtures.furnished, 'valid', fixtures.furnishedIds);
        const furnished = await stable(page, baseline, 'móveis comprados e carro na garagem');
        assert.deepEqual(furnished.furniture.ownedFurniture, fixtures.furnishedIds);
        assert(!furnished.furniture.renderedFurniture.includes('fusca'), 'carro não entra na sala');
        assert(!furnished.furniture.renderedFurniture.includes('mesa-simples'), 'mesa substituída não continua aparecendo');
        assert.equal(furnished.furniture.renderedFurniture.length, 10);
        await capture(page, name + '-mobilia-sala-mobiliada');

        await wallet(page, {...fixtures.furnished, cash: 1010, revision: 4}, 'valid', fixtures.furnishedIds);
        current = await stable(page, baseline, 'mudança de saldo sem trocar móveis');
        assert.equal(current.furniture.rebuilds, furnished.furniture.rebuilds, 'saldo/revisão não devem refazer as malhas');

        await wallet(page, fixtures.duplicateSlot, 'invalid', []);
        current = await stable(page, baseline, 'carteira inválida com duas mesas');
        assert.equal(current.furniture.meshes, 0);
        await wallet(page, undefined, 'missing', []);
        await stable(page, baseline, 'carteira retirada');
        await wallet(page, fixtures.furnished, 'valid', fixtures.furnishedIds);

        const bare = await stage(page, 'empty');
        assert.equal(bare.architecture.presidentBox, false);
        assert.equal(bare.furniture.available, false);
        assert.equal(bare.furniture.ceilingLights,0);
        assert.equal(bare.furniture.walletStatus, 'valid');
        assert.deepEqual(bare.furniture.ownedFurniture, fixtures.furnishedIds, 'bens permanecem guardados sem camarote');
        assert.deepEqual(bare.furniture.renderedFurniture, []);
        assert.equal(bare.furniture.meshes, 0);
        assert.equal(bare.match.matchId, baseline.match.matchId);
        assert.equal(bare.match.time, baseline.match.time);

        const restored = await stage(page, 'complete');
        assert.equal(restored.furniture.available, true);
        assert.deepEqual(restored.furniture.renderedFurniture, fixtures.furnishedIds);
        assert.equal(restored.match.matchId, baseline.match.matchId);
        assert.equal(restored.match.time, baseline.match.time);
        assert.deepEqual(errors, [], name + ': erro JS/WebGL');
        assert.deepEqual(resourceErrors, [], name + ': arquivo local ausente');
        reports.push({device: name, baseline, furnished, bare, restored});
        console.log(`PASS ${name}: sala vazia/compras reais, câmera humana, carteira atualiza sem reiniciar canvas/partida, bens preservados na várzea e restauração do camarote.`);
      } finally { await context.close(); }
    }
    fs.writeFileSync(path.join(output, 'mobilia-browser-report.json'), JSON.stringify(reports, null, 2));
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
