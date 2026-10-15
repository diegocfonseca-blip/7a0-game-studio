const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { loadDependency, browserOptions } = require('./presidencia-runtime.cjs');
const origin = 'http://127.0.0.1:4196', out = path.resolve('test-results/complexo-3d');
const hotelTopOnly = process.argv.includes('--hotel-top-only');
const parkingReview = process.argv.includes('--parking-review');
const selectedDevice = hotelTopOnly ? 'desktop' : process.argv.includes('--mobile-only') ? 'mobile' : process.argv.includes('--desktop-only') ? 'desktop' : null;

// Use the real OrbitControls (right-drag and zoom), without adding camera setters
// to the application or hiding geometry just to obtain a clean screenshot.
async function focusGround(page, destination, visibleWidth = 145) {
  await page.evaluate(() => window.complexo3D.view('original'));
  const canvas = page.locator('[data-complexo-3d] canvas');
  await canvas.scrollIntoViewIfNeeded();
  for (let i = 0; i < 24; i++) {
    const state = await page.evaluate(() => window.complexo3D.inspect()), box = await canvas.boundingBox();
    const [cx, cy, cz] = state.camera, [tx, ty, tz] = state.target;
    const dx = destination.x - tx, dz = destination.z - tz;
    if (Math.hypot(dx, dz) < .35) break;
    const horizontal = Math.hypot(cx - tx, cz - tz), rx = (cz - tz) / horizontal, rz = -(cx - tx) / horizontal;
    const gx = rz, gz = -rx, distance = Math.hypot(cx - tx, cy - ty, cz - tz);
    const metresPerPixel = 2 * distance * Math.tan(state.cameraFov * Math.PI / 360) / box.height;
    const deltaX = Math.max(-box.width * .3, Math.min(box.width * .3, -(dx * rx + dz * rz) / metresPerPixel));
    const deltaY = Math.max(-box.height * .3, Math.min(box.height * .3, (dx * gx + dz * gz) / metresPerPixel));
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 3 });
    await page.mouse.up({ button: 'right' });
  }
  let state = await page.evaluate(() => window.complexo3D.inspect());
  assert(Math.hypot(state.target[0] - destination.x, state.target[2] - destination.z) < .6, 'arraste não enquadrou a conexão pretendida');
  const desiredDistance = visibleWidth / (2 * Math.tan(state.cameraFov * Math.PI / 360) * state.viewport[0] / state.viewport[1]);
  for (let i = 0; i < 8; i++) {
    state = await page.evaluate(() => window.complexo3D.inspect());
    const distance = Math.hypot(...state.camera.map((value, index) => value - state.target[index]));
    if (Math.abs(Math.log(distance / desiredDistance)) < .08) break;
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // OrbitControls scales distance by 0.95 per 100 wheel pixels. One real
    // wheel gesture reaches the requested scale instead of dozens of frames.
    const delta = Math.log(distance / desiredDistance) / Math.log(.95) * 100;
    await page.mouse.wheel(0, Math.max(-3000, Math.min(3000, delta)));
    await page.waitForTimeout(35);
  }
  const last = await page.evaluate(() => window.complexo3D.inspect());
  const distance = Math.hypot(...last.camera.map((value, index) => value - last.target[index]));
  assert(Math.abs(Math.log(distance / desiredDistance)) < .15, 'zoom não alcançou escala da conexão');
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await loadDependency('playwright').chromium.launch(browserOptions()), report = [];
  try {
    const devices = [
      { name: 'desktop', viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1 },
      { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    ];
    for (const device of devices.filter(item => !selectedDevice || item.name === selectedDevice)) {
      const { name, ...options } = device, context = await browser.newContext({ ...options, locale: 'pt-BR', reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [], frames = [];
      page.setDefaultTimeout(120000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text()); });
      await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      const capture = async (stage, view) => {
        await page.locator('[data-complexo-3d]').scrollIntoViewIfNeeded();
        const state = await page.evaluate(() => window.complexo3D.inspect());
        assert(state.camera.every(Number.isFinite) && state.target.every(Number.isFinite), 'câmera inválida');
        assert.equal(state.roads.afterComponents, 1, 'rede viária desconectada');
        assert.deepEqual(state.roads.unresolved, [], 'pontas de vias sem destino');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: overflow horizontal`);
        const filename = `${name}-ruas-${stage}-${view}.png`;
        await page.locator('[data-complexo-3d]').screenshot({ path: path.join(out, filename) });
        console.log(`Captura ${name}: ${stage}/${view}`);
        frames.push({ stage, view, filename, camera: state.camera, target: state.target, viewport: state.viewport, roads: state.roads, pedestrianNetwork: state.pedestrianNetwork });
      };
      try {
        await page.goto(origin + '/7a0-game-studio/qa-presidencia-complexo-3d.html', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.complexo3D);
        await page.evaluate(() => window.complexo3D.view('original'));
        if (!hotelTopOnly) await capture('complete', 'mapa');
        const points = hotelTopOnly ? [{ id: 'hotel-retorno-superior', x: -120.8802960054321, z: 55.16268633733637, top: true }] : parkingReview ? [
          { id: 'hotel-retorno', x: -127, z: 38 },
          { id: 'parking-acesso-noroeste', x: -122, z: -52, top: true },
        ] : [
          { id: 'norte-oeste', x: -344, z: -223 },
          { id: 'leste-norte', x: 178, z: -28 },
          { id: 'leste-estacionamento', x: 187, z: 77 },
          { id: 'hotel-retorno', x: -127, z: 38 },
        ];
        for (const point of points) {
          await focusGround(page, point, point.top ? 80 : 145);
          if (point.top) {
            // The hotel roof naturally hides its rear approach from the main
            // view. Orbit upward with the real control to inspect the return.
            const state = await page.evaluate(() => window.complexo3D.inspect());
            const box = await page.locator('[data-complexo-3d] canvas').boundingBox();
            const delta = state.camera.map((v, i) => v - state.target[i]);
            const polar = Math.atan2(Math.hypot(delta[0], delta[2]), delta[1]);
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down({ button: 'left' });
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + (polar - 25 * Math.PI / 180) * box.height / (2 * Math.PI));
            await page.mouse.up({ button: 'left' });
          }
          await capture('complete', point.id);
        }
        if (!hotelTopOnly && !parkingReview) {
          await page.evaluate(() => { window.previousRoadApi = window.complexo3D; window.setComplexoStage('empty'); });
          await page.waitForFunction(() => window.complexo3D && window.complexo3D !== window.previousRoadApi);
          await page.evaluate(() => window.complexo3D.view('original'));
          await capture('empty', 'mapa');
        }
        assert.deepEqual(errors, []);
        report.push({ device: name, frames, errors });
        fs.writeFileSync(path.join(out, hotelTopOnly ? 'ruas-hotel-browser-report.json' : parkingReview ? 'ruas-parking-browser-report.json' : 'ruas-browser-report.json'), JSON.stringify(report, null, 2));
        console.log(hotelTopOnly ? 'PASS captura do retorno do hotel com inclinação elevada.' : parkingReview ? `PASS recapturas ${name}: mapa, hotel e acesso lateral do estacionamento.` : `PASS capturas ${name}: mapa completo/várzea e quatro conexões aproximadas com controles reais.`);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
