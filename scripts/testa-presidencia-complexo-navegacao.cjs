const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadDependency, browserOptions } = require('./presidencia-runtime.cjs');

// Only the local review fixture is loaded. Real pointers/touches operate the
// map; no test-only setters position its camera and no account is contacted.
const origin = 'http://127.0.0.1:4196';
const output = path.resolve('test-results/complexo-3d');
const selectedDevice = process.argv.includes('--desktop-only') ? 'desktop' : process.argv.includes('--mobile-only') ? 'mobile' : null;
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const norm = point => Math.hypot(...point);
const minus = (a, b) => a.map((value, index) => value - b[index]);
const distance = state => norm(minus(state.camera, state.target));
const direction = state => minus(state.camera, state.target).map(value => value / distance(state));
const approximately = (actual, expected, tolerance, message) => assert(norm(minus(actual, expected)) <= tolerance, `${message}: ${JSON.stringify({ actual, expected })}`);
const inspect = page => page.evaluate(() => {
  const state = window.complexo3D.inspect(), canvas = document.querySelector('[data-complexo-3d] canvas');
  return {
    camera: state.camera, target: state.target, cameraFov: state.cameraFov, view: state.view,
    viewport: state.viewport, canvas: state.canvas, match: state.match,
    navigation: state.navigation, quality: state.quality, seatDetail: state.seatDetail,
    save: window.complexoParkingQA.snapshot(), scroll: [scrollX, scrollY],
    apiPreserved: window.navigationInitialApi === window.complexo3D,
    canvasPreserved: window.navigationInitialCanvas === canvas,
    pageScale: visualViewport?.scale ?? 1,
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    activeElement: { tag: document.activeElement?.tagName, label: document.activeElement?.getAttribute('aria-label'), text: document.activeElement?.textContent?.slice(0, 100) },
  };
});

async function unchangedGame(page, baseline, label) {
  const state = await inspect(page);
  assert(state.camera.every(Number.isFinite) && state.target.every(Number.isFinite), `${label}: câmera inválida`);
  assert(state.apiPreserved && state.canvasPreserved, `${label}: exploração remontou a cena`);
  assert.deepEqual(state.save, baseline.save, `${label}: navegação alterou compras/saldo`);
  assert.deepEqual(state.match, baseline.match, `${label}: navegação alterou relógio/bola da partida pausada`);
  assert(!state.overflow, `${label}: conteúdo transbordou horizontalmente`);
  assert.equal(state.pageScale, 1, `${label}: gesto ampliou a página em vez do mapa`);
  return state;
}

async function dragMouse(page, canvas, button = 'left', dx = 65, dy = 30) {
  const box = await canvas.boundingBox(), x = box.x + box.width * .52, y = box.y + box.height * .59;
  await page.mouse.move(x, y);
  await page.mouse.down({ button });
  try { await page.mouse.move(x + dx, y + dy, { steps: 2 }); }
  finally { await page.mouse.up({ button }); }
  await frame(page);
}

async function touchGesture(session, points) {
  const make = point => ({ id: point.id, x: point.x, y: point.y, radiusX: 7, radiusY: 7, force: 1 });
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points[0].map(make) });
  try {
    for (const step of points.slice(1)) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: step.map(make) });
  } finally { await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
}

async function panTouch(page, session, canvas) {
  const box = await canvas.boundingBox(), x = box.x + box.width * .56, y = box.y + box.height * .6;
  await touchGesture(session, [0, 1, 2].map(step => [{ id: 0, x: x - step * 25, y: y + step * 12 }]));
  await frame(page);
}

async function pinchTouch(page, session, canvas, spread, customWidths, centerY = .61) {
  const box = await canvas.boundingBox(), x = box.x + box.width * .5, y = box.y + box.height * centerY;
  const widths = customWidths ?? (spread ? [30, 45, 65] : [65, 45, 30]);
  await touchGesture(session, widths.map(half => [{ id: 0, x: x - half, y }, { id: 1, x: x + half, y }]));
  await frame(page);
}

async function seedPausedMatch(page) {
  await page.evaluate(() => {
    const team = side => ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'].map((pos, i) => ({ id: side + i, name: side + i, pos }));
    window.setComplexoMatch({
      context: { id: 'navegacao-local', home: team('h'), away: team('a'), homeBench: team('rh').slice(0, 7), awayBench: team('ra').slice(0, 7), speed: 4 },
      minute: 21, homeScore: 0, awayScore: 0, paused: true, finished: false,
      homeColor: '#1b7a3d', awayColor: '#c2452f',
      visualClock: { seconds: 17, sampledAt: performance.now(), running: false, rate: 4 },
    });
    window.navigationInitialApi = window.complexo3D;
    window.navigationInitialCanvas = document.querySelector('[data-complexo-3d] canvas');
  });
  await page.waitForFunction(() => window.complexo3D.inspect().match.players === 22);
}

async function testDevice(browser, device) {
  const { name, ...options } = device;
  const context = await browser.newContext({ ...options, locale: 'pt-BR', reducedMotion: 'reduce' });
  const page = await context.newPage(), errors = [], checkpoints = [];
  const checkpoint = message => { checkpoints.push(message); console.log(`${name}: ${message}`); };
  page.setDefaultTimeout(180000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text()); });
  await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const report = { device: name, viewport: options.viewport, checkpoints, errors };
  try {
    await page.goto(origin + '/7a0-game-studio/qa-presidencia-complexo-3d.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.complexo3D);
    await seedPausedMatch(page);
    const canvas = page.locator('[data-complexo-3d] canvas');
    await canvas.scrollIntoViewIfNeeded();
    const baseline = await inspect(page);
    assert.equal(baseline.match.time, 17); assert.equal(baseline.match.players, 22);
    assert(baseline.viewport[1] >= options.viewport.height * .62, `${name}: mapa ocupa pouca altura`);
    assert(baseline.viewport[0] >= options.viewport.width * .90, `${name}: mapa ocupa pouca largura`);
    report.initial = baseline;

    // Control selectors are matched to the public, accessible UI below.
    const shell = page.locator('.pc3-review');
    const expand = shell.getByRole('button', { name: 'Ampliar mapa', exact: true });
    const zoomIn = shell.getByRole('button', { name: 'Aproximar', exact: true });
    const zoomOut = shell.getByRole('button', { name: 'Afastar', exact: true });
    const reset = shell.getByRole('button', { name: 'Ver tudo', exact: true });
    const rotate = shell.getByRole('button', { name: 'Girar', exact: true });

    await zoomIn.click(); await frame(page);
    const closer = await unchangedGame(page, baseline, `${name}/aproximar`);
    assert(distance(closer) < distance(baseline) * .99, `${name}: botão + não aproximou`);
    await zoomOut.click(); await frame(page);
    const farther = await unchangedGame(page, baseline, `${name}/afastar`);
    assert(distance(farther) > distance(closer) * 1.01, `${name}: botão − não afastou`);
    checkpoint('botões +/− alteram a câmera sem mudar a partida');

    await expand.scrollIntoViewIfNeeded();
    const beforeExpansion = await inspect(page);
    await expand.click(); await frame(page);
    const expanded = await unchangedGame(page, baseline, `${name}/expandir`);
    approximately(expanded.camera, beforeExpansion.camera, 1e-5, `${name}: expandir reposicionou a câmera explorada`);
    approximately(expanded.target, beforeExpansion.target, 1e-5, `${name}: expandir mudou o destino`);
    assert(expanded.viewport[0] >= options.viewport.width * .96, `${name}: mapa expandido não usa a largura da tela`);
    assert(expanded.viewport[1] >= options.viewport.height * .78, `${name}: mapa expandido não usa a altura da tela`);
    assert.equal(await shell.getAttribute('data-expanded'), 'true');
    assert.equal(await shell.getAttribute('role'), 'dialog');
    assert.equal(await shell.getAttribute('aria-modal'), 'true');
    assert(await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'), `${name}: página continua rolando atrás do mapa expandido`);
    for (const button of [zoomIn, zoomOut, rotate, reset]) {
      const box = await button.boundingBox();
      assert(box.width >= 44 && box.height >= 44, `${name}: controle com área de toque pequena`);
    }
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
    assert(await shell.evaluate(el => el.contains(document.activeElement)), `${name}: foco saiu do mapa expandido`);
    checkpoint('mapa expandido usa a tela e mantém o local escolhido');

    if (name === 'mobile') {
      const session = await context.newCDPSession(page);
      const beforePan = await inspect(page);
      await panTouch(page, session, canvas);
      const afterPan = await unchangedGame(page, baseline, `${name}/arraste-um-dedo`);
      assert(norm(minus(afterPan.target, beforePan.target)) > 1, 'um dedo não deslocou o mapa');
      approximately(direction(afterPan), direction(beforePan), 1e-5, 'um dedo girou em vez de deslocar');
      approximately(afterPan.scroll, beforePan.scroll, .1, 'um dedo rolou a página');
      await pinchTouch(page, session, canvas, true);
      const afterSpread = await unchangedGame(page, baseline, `${name}/pinça-abrir`);
      assert(distance(afterSpread) < distance(afterPan) * .85, 'abrir os dedos não aproximou o mapa');
      await pinchTouch(page, session, canvas, false);
      const afterPinch = await unchangedGame(page, baseline, `${name}/pinça-fechar`);
      assert(distance(afterPinch) > distance(afterSpread) * 1.15, 'fechar os dedos não afastou o mapa');
      checkpoint('touch real: arraste com um dedo, pinça para aproximar e afastar, sem zoom da página');
      await session.detach();
    } else {
      const beforePan = await inspect(page);
      await dragMouse(page, canvas);
      const afterPan = await unchangedGame(page, baseline, `${name}/arraste-mouse`);
      assert(norm(minus(afterPan.target, beforePan.target)) > 1, 'botão esquerdo não deslocou o mapa');
      approximately(direction(afterPan), direction(beforePan), 1e-5, 'botão esquerdo girou em vez de deslocar');
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6);
      await page.mouse.wheel(0, -300); await frame(page);
      const afterWheel = await unchangedGame(page, baseline, `${name}/roda`);
      assert(distance(afterWheel) < distance(afterPan) * .99, 'roda não aproximou');
      await canvas.focus(); await page.keyboard.press('ArrowRight'); await frame(page);
      const afterKeyboard = await unchangedGame(page, baseline, `${name}/teclado`);
      assert(norm(minus(afterKeyboard.target, afterWheel.target)) > .1, 'seta do teclado não deslocou');
      checkpoint('mouse: arraste esquerdo, roda e seta do teclado');
    }

    // Explicit orbit mode keeps accidental one-finger tilting out of map mode.
    await rotate.click(); await frame(page);
    const beforeRotate = await inspect(page);
    if (name === 'mobile') {
      const session = await context.newCDPSession(page);
      await panTouch(page, session, canvas); await session.detach();
    } else await dragMouse(page, canvas, 'left', 45, 12);
    const afterRotate = await unchangedGame(page, baseline, `${name}/girar`);
    assert(norm(minus(direction(afterRotate), direction(beforeRotate))) > .02, `${name}: modo Girar não altera o ângulo`);
    approximately(afterRotate.target, beforeRotate.target, 1e-5, `${name}: Girar deslocou o destino`);
    await rotate.click(); await frame(page);
    checkpoint('giro explícito separado do deslocamento');

    if (name === 'mobile') {
      // A portrait overview is legitimately constrained when the same pose
      // would expose terrain edges in landscape. Test exact pose preservation
      // at a nearby scale that fits both orientations; the edge-limit gesture
      // is independently exercised below rather than weakening its guard.
      const session = await context.newCDPSession(page);
      await pinchTouch(page, session, canvas, true, [22, 44, 77]);
      await session.detach();
      await unchangedGame(page, baseline, `${name}/aproximar-antes-orientacao`);
    }
    const beforeResize = await inspect(page);
    await page.setViewportSize(name === 'mobile' ? { width: 844, height: 390 } : { width: 1240, height: 880 });
    await frame(page);
    const resized = await unchangedGame(page, baseline, `${name}/redimensionar`);
    approximately(resized.camera, beforeResize.camera, 1e-5, `${name}: redimensionar perdeu a câmera`);
    approximately(resized.target, beforeResize.target, 1e-5, `${name}: redimensionar perdeu o destino`);
    report.resize = { before: { camera: beforeResize.camera, target: beforeResize.target }, after: { camera: resized.camera, target: resized.target } };
    await page.setViewportSize(options.viewport); await frame(page);
    checkpoint(name === 'mobile' ? 'girar o celular preserva a região explorada' : 'redimensionar a janela preserva a região explorada');

    await shell.getByRole('button', { name: 'Locais', exact: true }).click();
    await shell.getByRole('button', { name: name === 'mobile' ? 'Estação e passarelas' : 'Vadico Veículos', exact: true }).click();
    await frame(page);
    const destination = await unchangedGame(page, baseline, `${name}/destino`);
    assert.equal(destination.view, name === 'mobile' ? 'estacao' : 'vadico');
    assert(await canvas.evaluate(el => document.activeElement === el), `${name}: selecionar destino não devolveu foco ao mapa`);
    assert.equal(await shell.locator('.pc3-places').count(), 0, `${name}: painel Locais não fechou`);
    await page.keyboard.press('Tab');
    assert(await shell.evaluate(el => el.contains(document.activeElement)), `${name}: Tab escapou após fechar Locais`);
    if (name === 'mobile') {
      const session = await context.newCDPSession(page);
      await pinchTouch(page, session, canvas, false, [65, 30, 10]);
      await pinchTouch(page, session, canvas, false, [65, 30, 10]);
      await session.detach();
    } else {
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6);
      await page.mouse.wheel(0, 10000); await frame(page);
    }
    const limit = await unchangedGame(page, baseline, `${name}/limite-do-mapa`);
    const { coverage, bounds, terrainGuard } = limit.navigation;
    assert(terrainGuard && coverage, `${name}: destino aéreo não protege a borda do terreno`);
    assert(coverage.minX >= bounds.minX - .01 && coverage.maxX <= bounds.maxX + .01 && coverage.minZ >= bounds.minZ - .01 && coverage.maxZ <= bounds.maxZ + .01, `${name}: afastar revelou margem sem mapa`);
    report.limit = { navigation: limit.navigation, camera: limit.camera, target: limit.target };
    checkpoint('Locais mantém foco e o afastamento extremo permanece dentro do mapa');

    await reset.click(); await frame(page);
    const resetState = await unchangedGame(page, baseline, `${name}/ver-tudo`);
    assert(distance(resetState) > 150, `${name}: Ver tudo não voltou à vista geral`);
    await shell.screenshot({ path: path.join(output, `${name}-navegacao-mapa-ampliado.png`) });

    await shell.getByRole('button', { name: 'Ver campo', exact: true }).click(); await frame(page);
    const field = await unchangedGame(page, baseline, `${name}/campo`);
    assert.equal(field.view, 'field');
    const goals = await page.evaluate(async state => {
      const THREE = await import('/7a0-game-studio/node_modules/three/build/three.module.js');
      // Rebuild a separate camera from the measured pose. This does not call
      // fit() or mutate the live camera and checks both complete goal mouths.
      const camera = new THREE.PerspectiveCamera(state.cameraFov, state.viewport[0] / state.viewport[1], .12, 4000);
      camera.position.fromArray(state.camera); camera.lookAt(new THREE.Vector3(...state.target)); camera.updateMatrixWorld();
      return [-54.5, 54.5].flatMap(x => [-3.66, 3.66].flatMap(z => [0, 2.44].map(y => new THREE.Vector3(x, y, z).project(camera).toArray())));
    }, field);
    assert(goals.every(([x, y, z]) => Math.abs(x) < 1 && Math.abs(y) < 1 && z >= -1 && z <= 1), `${name}: Ver campo cortou um dos gols`);
    report.goals = goals;
    assert(field.canvas[0] >= field.viewport[0] * .97 && field.canvas[1] >= field.viewport[1] * .97, `${name}: campo renderizado abaixo da resolução da tela`);
    report.field = field;
    await zoomIn.click(); await frame(page);
    let fieldZoom = await unchangedGame(page, baseline, `${name}/campo-zoom`);
    assert(distance(fieldZoom) < distance(field), `${name}: não aproximou os jogadores`);
    if (name === 'mobile') {
      const session = await context.newCDPSession(page);
      for (let attempt = 0; attempt < 3 && distance(fieldZoom) > 48; attempt++) {
        const ratio = Math.min(3.5, distance(fieldZoom) / 40);
        // Pinch around the centre of the field. A lower gesture intentionally
        // zooms toward the facade with zoomToCursor and cannot evidence turf.
        await pinchTouch(page, session, canvas, true, [22, 22 * Math.sqrt(ratio), 22 * ratio], .5);
        fieldZoom = await unchangedGame(page, baseline, `${name}/campo-pinça-close`);
      }
      await session.detach();
    } else {
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, Math.log(distance(fieldZoom) / 40) / Math.log(.95) * 100);
      await frame(page);
      fieldZoom = await unchangedGame(page, baseline, `${name}/campo-roda-close`);
    }
    assert(distance(fieldZoom) >= 30 && distance(fieldZoom) <= 48, `${name}: close do campo não chegou à escala solicitada`);
    assert(Math.abs(fieldZoom.target[0]) < 52.5 && Math.abs(fieldZoom.target[2]) < 34, `${name}: close do campo foi direcionado para fora do gramado`);
    await shell.screenshot({ path: path.join(output, `${name}-navegacao-campo-ampliado.png`) });
    report.fieldZoom = fieldZoom;
    checkpoint('campo e 22 jogadores ampliados sem alterar o relógio ou a bola');

    if (name === 'mobile') await shell.getByRole('button', { name: 'Fechar mapa ampliado', exact: true }).click();
    else await page.keyboard.press('Escape');
    await frame(page);
    const collapsed = await unchangedGame(page, baseline, `${name}/sair-ampliacao`);
    approximately(collapsed.camera, fieldZoom.camera, 1e-5, `${name}: sair da ampliação perdeu a câmera`);
    approximately(collapsed.target, fieldZoom.target, 1e-5, `${name}: sair da ampliação perdeu o destino`);
    assert(await expand.evaluate(el => document.activeElement === el), `${name}: sair não devolveu foco ao botão de ampliação`);
    approximately(collapsed.scroll, beforeExpansion.scroll, 1, `${name}: sair não restaurou a posição da página`);
    assert(await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'), `${name}: sair deixou a página travada`);
    checkpoint(`${name === 'mobile' ? 'botão Fechar' : 'Escape'} devolve foco e posição da página, sem perder o enquadramento`);
    assert.deepEqual(errors, []);
    report.final = collapsed;
    console.log(`PASS ${name}: navegação real, expansão, zoom, giro, resize, campo e save/relógio preservados.`);
    return report;
  } catch (error) {
    report.failure = error.message;
    report.state = await inspect(page).catch(() => null);
    fs.writeFileSync(path.join(output, `${name}-navegacao-failure.json`), JSON.stringify(report, null, 2));
    await page.screenshot({ path: path.join(output, `${name}-navegacao-failure.png`), fullPage: false }).catch(() => {});
    throw error;
  } finally { await context.close(); }
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await loadDependency('playwright').chromium.launch(browserOptions()), reports = [];
  try {
    for (const device of [
      { name: 'desktop', viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 },
      { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    ].filter(device => !selectedDevice || device.name === selectedDevice)) {
      reports.push(await testDevice(browser, device));
      fs.writeFileSync(path.join(output, selectedDevice ? `navegacao-${selectedDevice}-report.json` : 'navegacao-report.json'), JSON.stringify(reports, null, 2));
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
