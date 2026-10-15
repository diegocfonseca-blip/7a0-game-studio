const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency, browserOptions} = require('./presidencia-runtime.cjs');

const origin = 'http://127.0.0.1:4196';
const url = `${origin}/7a0-game-studio/qa-presidencia-complexo-3d.html`;
const output = path.resolve('test-results/complexo-3d');
const viewportSelector = '[data-complexo-3d]';
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
const inspect = page => page.evaluate(() => window.complexo3D.inspect());
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const capture = (page, name) => page.locator(viewportSelector).screenshot({path: path.join(output, `${name}.png`)});

async function stage(page, name) {
  await page.evaluate(name => {window.complexoQAStageApi = window.complexo3D; window.setComplexoStage(name);}, name);
  await frames(page);
  await page.waitForFunction(() => Boolean(window.complexo3D && window.complexo3D !== window.complexoQAStageApi && document.querySelector('[data-complexo-3d][aria-busy="false"] canvas')));
  await page.locator(viewportSelector).scrollIntoViewIfNeeded();
  return inspect(page);
}

async function touchGesture(session, start, end) {
  const points = positions => positions.map(([x, y], id) => ({x, y, id, radiusX: 4, radiusY: 4, force: .7}));
  await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: points(start)});
  for (let step = 1; step <= 8; step++) {
    const amount = step / 8;
    await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: points(start.map(([x, y], i) => [x + (end[i][0] - x) * amount, y + (end[i][1] - y) * amount]))});
  }
  await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
}

async function clock(page, rate, running, minute = 22) {
  const result = await page.evaluate(({rate, running, minute}) => {
    const old = window.complexoQAState, previous = old.visualClock, now = performance.now();
    const seconds = previous.seconds + (previous.running ? Math.max(0, now - previous.sampledAt) / 1000 * (previous.rate ?? 1) : 0);
    const next = {...old, minute, context: {...old.context, speed: rate}, paused: !running, visualClock: {seconds, sampledAt: now, rate, running}};
    window.complexoQAState = next;
    window.setComplexoMatch(next);
    return {seconds, sampledAt: now, rate, running};
  }, {rate, running, minute});
  await frames(page);
  return result;
}

async function assertClockFrame(page, label) {
  const result = await page.evaluate(() => {
    const state = window.complexoQAState, clock = state.visualClock;
    const at = now => clock.seconds + (clock.running ? Math.max(0, now - clock.sampledAt) / 1000 * (clock.rate ?? 1) : 0);
    const before = at(performance.now());
    window.complexo3D.view('field');
    const actual = window.complexo3D.inspect();
    const after = at(performance.now());
    return {before, after, running: clock.running, actual, sameCanvas: window.complexoQACanvas === document.querySelector('[data-complexo-3d] canvas'), sameApi: window.complexoQAApi === window.complexo3D};
  });
  assert.equal(result.actual.match.players, 22, `${label}: 22 atletas reais`);
  // A queued frame can finish before React commits the pause. The shared motor
  // keeps that last frame instead of rewinding; paused equality is checked below.
  assert(result.actual.match.time >= result.before - 1 / 60 - 1e-7 && (!result.running || result.actual.match.time <= result.after + 1e-7), `${label}: relógio ${result.actual.match.time} fora de [${result.before}, ${result.after}]`);
  assert(result.sameCanvas && result.sameApi, `${label}: atualizar relógio recriou renderer/câmera`);
  return result;
}

(async () => {
  fs.mkdirSync(output, {recursive: true});
  const browser = await loadDependency('playwright').chromium.launch(browserOptions());
  const reports = [];
  try {
    for (const device of [
      {name: 'desktop', viewport: {width: 1280, height: 960}, deviceScaleFactor: 1},
      {name: 'mobile', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true},
    ]) {
      const {name, ...options} = device;
      const context = await browser.newContext({...options, locale: 'pt-BR', reducedMotion: 'reduce'});
      const page = await context.newPage(), errors = [], resourceErrors = [];
      page.setDefaultTimeout(60_000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text());});
      page.on('response', response => {if (response.status() >= 400 && response.url().startsWith(origin) && !response.url().endsWith('/favicon.ico')) resourceErrors.push({url: response.url(), status: response.status()});});
      await page.route('**/*', route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
      try {
        await page.goto(url, {waitUntil: 'domcontentloaded'});
        await page.waitForFunction(() => Boolean(window.complexo3D && window.setComplexoMatch && window.setComplexoStage));
        const pauseWalk = page.getByRole('button', {name: 'Pausar passeio', exact: true});
        if (await pauseWalk.count()) await pauseWalk.click();
        await page.locator(viewportSelector).scrollIntoViewIfNeeded();
        const layout = await page.locator(viewportSelector).evaluate(node => {
          const canvas = node.querySelector('canvas'), box = node.getBoundingClientRect(), drawn = canvas.getBoundingClientRect();
          return {width: node.clientWidth, height: node.clientHeight, pageWidth: document.documentElement.scrollWidth, screenWidth: innerWidth, canvasWidth: drawn.width, canvasHeight: drawn.height, canvasLeft: drawn.left - box.left, canvasTop: drawn.top - box.top};
        });
        assert(layout.width > 300 && layout.height >= (device.isMobile ? 600 : 460), `${name}: canvas sem área útil: ${JSON.stringify(layout)}`);
        assert(layout.pageWidth <= layout.screenWidth + 1, `${name}: overflow horizontal`);
        assert(Math.abs(layout.canvasWidth - layout.width) <= 1 && Math.abs(layout.canvasHeight - layout.height) <= 1 && Math.abs(layout.canvasLeft) <= 1 && Math.abs(layout.canvasTop) <= 1, `${name}: canvas não ocupa o viewport`);
        assert.equal(await page.locator(`${viewportSelector} canvas`).count(), 1, 'uma única superfície WebGL integrada');

        const empty = await stage(page, 'empty');
        assert(Object.values(empty.state.progress).every(value => value === 0));
        assert(Object.values(empty.state.extras).every(value => value === false));
        assert.equal(empty.match.players, 0, 'várzea sem partida não fabrica elenco');
        for (const key of ['lowerComplete', 'upperComplete', 'roofBuilt', 'roofClosed', 'floodlit', 'screenVisible']) assert.equal(empty.state[key], false, key);
        for (const key of ['lowerRows', 'upperRows', 'seats']) assert.equal(empty.architecture[key], 0, key);
        assert.equal(empty.architecture.roof, false);
        assert(empty.drawCalls > 0 && empty.triangles > 0 && empty.canvas.every(value => value > 0), 'várzea desenha geometria real');
        await capture(page, `${name}-varzea`);

        const complete = await stage(page, 'complete');
        assert(Object.values(complete.state.progress).every(value => value === 1));
        assert(Object.values(complete.state.extras).every(value => value === true));
        for (const key of ['lowerComplete', 'upperComplete', 'roofBuilt', 'floodlit', 'screenVisible']) assert.equal(complete.state[key], true, key);
        assert.equal(complete.state.roofClosed, false);
        assert(complete.architecture.lowerRows > 0 && complete.architecture.upperRows > 0 && complete.architecture.seats > 0);
        assert.equal(complete.architecture.roof, true);
        assert.equal(complete.architecture.retractable, false, 'compra do retrátil não fecha teto automaticamente');
        assert.equal(complete.shadowMap, true, 'sombras reais ativadas');
        const lighting = await page.evaluate(() => window.complexo3D.checkLighting());
        assert.equal(lighting.invalidSamples, 0, `${name}: iluminação tem NaN/Infinity`);
        assert(lighting.litSamples > 0, `${name}: probe de iluminação vazio`);
        await capture(page, `${name}-completo`);

        await page.evaluate(async () => {
          const motor = await import('/7a0-game-studio/src/escalacao/presidencia-futebol-motor.ts');
          window.complexoQAMotor = motor.quadroFutebol3D;
          const team = side => ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'].map((pos, i) => ({id: side + i, name: side + i, pos}));
          window.complexoQAState = {context: {id: 'complexo-browser-local', home: team('h'), away: team('a'), homeBench: team('rh').slice(0, 7), awayBench: team('ra').slice(0, 7), speed: 1}, minute: 21, homeScore: 0, awayScore: 0, paused: true, finished: false, homeColor: '#1b7a3d', awayColor: '#c2452f', visualClock: {seconds: 2, sampledAt: performance.now(), running: false, rate: 1}};
          window.complexoQACanvas = document.querySelector('[data-complexo-3d] canvas');
          window.complexoQAApi = window.complexo3D;
          window.complexo3D.view('field');
          const state = window.complexoQAState;
          window.setComplexoMatch({...state, context: {...state.context, away: state.context.away.slice(1)}});
        });
        await frames(page);
        assert.equal((await inspect(page)).match.players, 0, '21 jogadores não são completados com personagem fake');
        await page.evaluate(() => window.setComplexoMatch(window.complexoQAState));
        await page.waitForFunction(() => window.complexo3D.inspect().match.players === 22);
        const initial = await assertClockFrame(page, `${name}/22 jogadores`);
        const rates = [];
        for (const rate of [.25, .5, 4]) {
          const beforeCamera = await inspect(page);
          const anchor = await clock(page, rate, true);
          const afterClock = await inspect(page);
          assert.deepEqual(afterClock.camera, beforeCamera.camera, `${name}/${rate}x: velocidade reposicionou câmera`);
          assert.deepEqual(afterClock.target, beforeCamera.target, `${name}/${rate}x: velocidade mudou alvo`);
          const first = await assertClockFrame(page, `${name}/${rate}x inicial`);
          await page.waitForFunction(time => window.complexo3D.inspect().match.time > time + .08, first.actual.match.time);
          const last = await assertClockFrame(page, `${name}/${rate}x avanço`);
          assert(last.actual.match.time > first.actual.match.time, `${name}/${rate}x: relógio não avançou`);
          await clock(page, rate, false);
          const paused = await assertClockFrame(page, `${name}/${rate}x pausa`);
          const expected = await page.evaluate(() => window.complexoQAMotor(window.complexoQAState, performance.now()));
          assert.deepEqual(paused.actual.match.ball, expected.ball, `${name}/${rate}x: bola difere do motor compartilhado`);
          assert.equal(paused.actual.match.time, expected.time);
          await page.waitForTimeout(180);
          assert.deepEqual((await inspect(page)).match, paused.actual.match, `${name}/${rate}x: pausa não congelou partida`);
          rates.push({rate, anchor: anchor.seconds, first: first.actual.match.time, last: last.actual.match.time, paused: paused.actual.match.time});
        }
        assert((await inspect(page)).match.time >= initial.actual.match.time, 'trocar ritmo não reinicia partida');

        const beforeZoom = await inspect(page), bounds = await page.locator(viewportSelector).boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.wheel(0, -350);
        await page.waitForFunction(before => {const current = window.complexo3D.inspect();const d = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));return d(current.camera, current.target) < d(before.camera, before.target) - .1;}, beforeZoom);
        const zoomed = await inspect(page);
        assert.deepEqual(zoomed.match, beforeZoom.match, 'zoom não avança partida pausada');
        let touch;
        if (device.hasTouch) {
          const session = await context.newCDPSession(page);
          try {
            await page.evaluate(() => window.complexo3D.view('field'));
            const box = await page.locator(viewportSelector).boundingBox(), x = box.x + box.width / 2, y = box.y + Math.min(box.height / 2, 350);
            const before = await inspect(page), closed = [[x - 30, y], [x + 30, y]], open = [[x - 75, y], [x + 75, y]];
            await touchGesture(session, closed, open);
            const near = await inspect(page);
            await touchGesture(session, open, closed);
            const far = await inspect(page);
            assert(distance(near.camera, near.target) < distance(before.camera, before.target) - .1, 'pinch aberto aproxima campo');
            assert(distance(far.camera, far.target) > distance(near.camera, near.target) + .1, 'pinch fechado afasta campo');
            assert.deepEqual(far.match, before.match, 'pinch não altera partida pausada');
            touch = {before: distance(before.camera, before.target), near: distance(near.camera, near.target), far: distance(far.camera, far.target)};
          } finally {await session.detach();}
        }
        await page.evaluate(() => window.complexo3D.view('field'));
        await capture(page, `${name}-partida`);
        const scored = await page.evaluate(() => {
          const state = window.complexoQAState;
          window.complexoQAState = {...state, homeScore: 1, goal: {id: 'complexo-browser-gol', home: true, name: 'h10', minute: 22, startedAt: performance.now(), phase: 'confirmed'}};
          window.setComplexoMatch(window.complexoQAState);
          return state.context.id;
        });
        await page.waitForFunction(() => window.complexo3D.inspect().match.phase === 'gol');
        const goal = (await inspect(page)).match;
        assert.equal(goal.matchId, scored);
        assert(goal.ball.x > 52.5 && Math.abs(goal.ball.z) < 3.66, 'gol confirmado vai à rede da mesma partida');
        await page.evaluate(() => window.setComplexoMatch(undefined));
        await page.waitForFunction(() => window.complexo3D.inspect().match.players === 0);
        assert(await page.evaluate(() => window.complexoQACanvas === document.querySelector('[data-complexo-3d] canvas') && window.complexoQAApi === window.complexo3D), 'retirar partida preserva canvas e cena');

        const closed = await stage(page, 'closed');
        assert.equal(closed.state.roofClosed, true);
        assert.equal(closed.architecture.retractable, true);
        await capture(page, `${name}-teto-fechado`);
        await page.evaluate(() => {window.complexoQAStageApi = window.complexo3D; window.setComplexoSave({inv: {grama: 30}, ext: ['cober', 'retratil'], roofClosed: true});});
        await frames(page);
        await page.waitForFunction(() => Boolean(window.complexo3D && window.complexo3D !== window.complexoQAStageApi));
        const missingPrerequisite = await inspect(page);
        assert.equal(missingPrerequisite.state.extras.cober, true, 'posse de compra legada é preservada');
        assert.equal(missingPrerequisite.state.roofBuilt, false);
        assert.equal(missingPrerequisite.state.roofClosed, false);
        assert.equal(missingPrerequisite.architecture.roof, false, 'geometria respeita requisito da cobertura');
        assert.equal(missingPrerequisite.architecture.retractable, false);
        const finalLayout = await page.evaluate(() => ({page: document.documentElement.scrollWidth, viewport: innerWidth}));
        assert(finalLayout.page <= finalLayout.viewport + 1, `${name}: gestos/estágios provocaram overflow`);
        assert.deepEqual(errors, [], `${name}: erros de execução/WebGL`);
        assert.deepEqual(resourceErrors, [], `${name}: arquivos locais não carregaram`);
        reports.push({device: name, layout, lighting, varzea: empty.state, completo: complete.state, canvas: complete.canvas, drawCalls: complete.drawCalls, triangles: complete.triangles, rates, touch, goal, roofPrerequisite: missingPrerequisite.state});
        for (const extension of ['json', 'png']) fs.rmSync(path.join(output, `${name}-failure.${extension}`), {force: true});
        console.log(`PASS ${name}: várzea/completo, 21→22 atletas, relógio .25/.5/4×, pausa, câmera preservada, zoom${touch ? '/pinch' : ''}, gol e teto.`);
      } catch (error) {
        const state = await inspect(page).catch(() => null);
        fs.writeFileSync(path.join(output, `${name}-failure.json`), JSON.stringify({error: error.message, state, errors, resourceErrors}, null, 2));
        await page.screenshot({path: path.join(output, `${name}-failure.png`), fullPage: true}).catch(() => {});
        throw error;
      } finally {await context.close();}
    }
    fs.writeFileSync(path.join(output, 'browser-report.json'), JSON.stringify(reports, null, 2));
    console.log('PASS funcional local: capturas em test-results/complexo-3d. Fidelidade à arte requer avaliação visual separada.');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
