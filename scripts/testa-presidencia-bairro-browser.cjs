const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency, browserOptions} = require('./presidencia-runtime.cjs');

const ORIGIN = 'http://127.0.0.1:4196';
const URL = `${ORIGIN}/7a0-game-studio/qa-presidencia-bairro-3d.html`;
const output = path.resolve('test-results/bairro-3d');
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
const inspect = page => page.evaluate(() => window.bairro3D.inspect());
const pose = (page, seconds, view) => page.evaluate(({seconds, view}) => {
  window.bairro3D.seek(seconds);
  if (view) window.bairro3D.view(view);
  return window.bairro3D.inspect();
}, {seconds, view});

async function touchGesture(session, start, end) {
  const points = positions => positions.map(([x, y], id) => ({x, y, id, radiusX: 5, radiusY: 5, force: .7}));
  await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: points(start)});
  for (let step = 1; step <= 10; step++) {
    const amount = step / 10;
    const positions = start.map(([x, y], index) => [x + (end[index][0] - x) * amount, y + (end[index][1] - y) * amount]);
    await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: points(positions)});
  }
  await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
}

(async () => {
  fs.mkdirSync(output, {recursive: true});
  const browser = await loadDependency('playwright').chromium.launch(browserOptions());
  const reports = [];
  try {
    for (const device of [
      {name: 'desktop', viewport: {width: 1280, height: 900}, deviceScaleFactor: 1},
      {name: 'mobile', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true},
    ]) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      const errors = [];
      page.setDefaultTimeout(45_000);
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => route.request().url().startsWith(`${ORIGIN}/`) ? route.continue() : route.abort());
      try {
        await page.goto(URL, {waitUntil: 'domcontentloaded'});
        await page.waitForSelector('[data-bairro-3d][aria-busy="false"] canvas');
        await page.waitForFunction(() => window.bairro3D && document.querySelector('[data-bairro-3d]').dataset.time);
        await page.getByRole('button', {name: 'Pausar movimento', exact: true}).click();
        await page.getByRole('button', {name: 'Retomar movimento', exact: true}).waitFor();
        const viewport = page.locator('[data-bairro-3d]');
        await viewport.scrollIntoViewIfNeeded();
        const layout = await viewport.evaluate(node => ({
          width: node.clientWidth, height: node.clientHeight,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }));
        assert(layout.height >= 460, `${device.name}: mapa pequeno (${layout.height}px)`);
        assert(layout.width > 300, `${device.name}: mapa sem largura útil`);
        assert(layout.documentWidth <= layout.viewportWidth + 1, `${device.name}: overflow horizontal`);
        const first = await pose(page, 6, 'general');
        // Shader NaNs can silently turn PBR materials black without a pageerror.
        const lighting = await page.evaluate(() => window.bairro3D.checkLighting());
        assert.equal(lighting.invalidSamples, 0, `${device.name}: reflexos contêm NaN/Infinity`);
        assert(lighting.litSamples > 0, `${device.name}: captura de iluminação vazia`);
        assert(first.canvas.every(value => value > 0), `${device.name}: canvas vazio`);
        assert(first.drawCalls > 0 && first.triangles > 0 && first.meshes > 0, 'cenário precisa ter geometria desenhada');
        assert.equal(first.shadowMap, true, 'sombras reais ativadas');
        await page.waitForTimeout(350);
        const paused = await inspect(page);
        assert.deepEqual(paused.frame, first.frame, `${device.name}: pausa não congelou o relógio`);

        const samples = [];
        for (const seconds of [2, 6, 20, 24, 27, 30, 38, 45, 52]) {
          const current = await pose(page, seconds, 'pedestrian');
          const floor = current.frame.pedestre.y;
          assert.equal(current.feet.length, 2, 'dois pés para aferir contato');
          assert(current.feet.every(foot => foot.min >= floor - .0001), `${device.name}/${seconds}s: pé atravessa o piso: ${JSON.stringify(current.feet)}`);
          assert(current.feet.some(foot => Math.abs(foot.min - floor) <= .01), `${device.name}/${seconds}s: dois pés no ar: ${JSON.stringify(current.feet)}`);
          samples.push({seconds, phase: current.frame.pedestre.phase, feet: current.feet});
        }

        const behind = await pose(page, 30, 'back');
        assert.equal(behind.frame.pedestre.phase, 'inside');
        assert(behind.occluded && behind.blockers.length, `${device.name}: parede de trás não esconde o pedestre dentro da loja`);
        const doorway = await pose(page, 24, 'entrance');
        assert.equal(doorway.frame.pedestre.phase, 'entering');
        assert.equal(doorway.occluded, false, `${device.name}: entrada bloqueada: ${doorway.blockers.join(', ')}`);

        await pose(page, 6, 'general');
        const beforeZoom = await inspect(page);
        const bounds = await viewport.boundingBox();
        await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .5);
        await page.mouse.wheel(0, -400);
        await page.waitForFunction(before => {
          const current = window.bairro3D.inspect();
          const length = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]));
          return length(current.camera, current.target) < length(before.camera, before.target) - .1;
        }, beforeZoom);
        const beforeOrbit = await inspect(page);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width * .68, bounds.y + bounds.height * .56, {steps: 8});
        await page.mouse.up();
        const afterOrbit = await inspect(page);
        assert(distance(beforeOrbit.camera, afterOrbit.camera) > .1, `${device.name}: arrastar não orbitou a câmera`);
        assert.deepEqual(afterOrbit.frame, beforeOrbit.frame, 'explorar câmera não avança o passeio pausado');

        let touch = null;
        if (device.hasTouch) {
          // Eventos nativos do navegador, não mouse nem chamadas diretas ao controle.
          const session = await context.newCDPSession(page);
          try {
            await pose(page, 6, 'general');
            await viewport.scrollIntoViewIfNeeded();
            const touchBounds = await viewport.boundingBox();
            const x = touchBounds.x + touchBounds.width / 2;
            const y = touchBounds.y + touchBounds.height / 2;
            const inner = touchBounds.width * .1;
            const outer = touchBounds.width * .24;
            const closed = [[x - inner, y], [x + inner, y]];
            const open = [[x - outer, y], [x + outer, y]];
            const beforePinch = await inspect(page);
            await touchGesture(session, closed, open);
            const afterOpen = await inspect(page);
            const beforeDistance = distance(beforePinch.camera, beforePinch.target);
            const nearDistance = distance(afterOpen.camera, afterOpen.target);
            assert(nearDistance < beforeDistance - .1, 'mobile: abrir dois dedos não aproximou a câmera');
            await touchGesture(session, open, closed);
            const afterClose = await inspect(page);
            const farDistance = distance(afterClose.camera, afterClose.target);
            assert(farDistance > nearDistance + .1, 'mobile: fechar dois dedos não afastou a câmera');
            await touchGesture(session, [[x, y]], [[x + touchBounds.width * .17, y + 24]]);
            const afterFinger = await inspect(page);
            assert(distance(afterClose.camera, afterFinger.camera) > .1, 'mobile: arrastar um dedo não orbitou a câmera');
            assert.deepEqual(afterFinger.frame, beforePinch.frame, 'mobile: toque avançou o relógio pausado');
            const afterTouchLayout = await viewport.evaluate(() => ({width: document.documentElement.scrollWidth, viewport: window.innerWidth}));
            assert(afterTouchLayout.width <= afterTouchLayout.viewport + 1, 'mobile: gesto provocou overflow da página');
            touch = {beforeDistance, nearDistance, farDistance, orbitDistance: distance(afterClose.camera, afterFinger.camera)};
          } finally {
            await session.detach();
          }
        }

        // Confere os dois sentidos do botão, com avanço real do relógio da cena.
        const beforeResume = await inspect(page);
        await page.getByRole('button', {name: 'Retomar movimento', exact: true}).click();
        await page.waitForFunction(seconds => window.bairro3D.inspect().frame.seconds > seconds + .05, beforeResume.frame.seconds);
        await page.getByRole('button', {name: 'Pausar movimento', exact: true}).click();
        await page.getByRole('button', {name: 'Retomar movimento', exact: true}).waitFor();
        const stoppedAgain = await inspect(page);
        assert(stoppedAgain.frame.seconds > beforeResume.frame.seconds, `${device.name}: retomar não avançou o passeio`);
        await page.waitForTimeout(250);
        assert.deepEqual((await inspect(page)).frame, stoppedAgain.frame, `${device.name}: segunda pausa não congelou o passeio`);

        const captures = device.name === 'desktop'
          ? [['general', 6, 'general'], ['entrance', 24, 'entrance'], ['pedestrian', 6, 'pedestrian'], ['interior', 30, 'back'], ['car', 4, 'car']]
          : [['mobile-general', 6, 'general'], ['mobile-pedestrian', 6, 'pedestrian'], ['mobile-entrance', 24, 'entrance']];
        for (const [name, seconds, view] of captures) {
          await pose(page, seconds, view);
          await viewport.screenshot({path: path.join(output, `${name}.png`)});
        }
        assert.deepEqual(errors, [], `${device.name}: erros do navegador`);
        reports.push({device: device.name, layout, lighting, canvas: first.canvas, drawCalls: first.drawCalls, triangles: first.triangles, meshes: first.meshes, samples, doorway: {occluded: doorway.occluded}, back: {occluded: behind.occluded, blockers: behind.blockers}, touch, resumedSeconds: stoppedAgain.frame.seconds - beforeResume.frame.seconds});
        console.log(`PASS ${device.name}: canvas ${first.canvas.join('×')}; mapa ${layout.width}×${layout.height}; chão/porta/oclusão/pausa/retomada/zoom/órbita${touch ? '/pinch/um dedo' : ''}.`);
      } catch (error) {
        const state = await inspect(page).catch(() => null);
        fs.writeFileSync(path.join(output, `${device.name}-failure.json`), JSON.stringify({error: error.message, state, errors}, null, 2));
        await page.screenshot({path: path.join(output, `${device.name}-failure.png`), fullPage: true}).catch(() => {});
        throw error;
      } finally {
        await context.close();
      }
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(reports, null, 2));
    console.log('PASS bairro 3D no navegador: desktop e celular; capturas em test-results/bairro-3d.');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
