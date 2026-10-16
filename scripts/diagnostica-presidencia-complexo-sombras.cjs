const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadDependency, browserOptions } = require('./presidencia-runtime.cjs');

// Diagnostic only: instrument the module response, never the production file.
// One renderer/camera/scene is reused for all A/B samples; all network stays local.
const origin = 'http://127.0.0.1:4196';
const modulePath = '/7a0-game-studio/src/escalacao/presidencia-complexo-3d.tsx';
const output = path.resolve('test-results/complexo-3d');
function instrument(source) {
  const marker = /sun\.shadow\.camera\.far\s*=\s*1300;\s*scene\.add\(sun,\s*sun\.target\);/;
  assert(marker.test(source), 'sun setup marker missing in transformed module');
  return source.replace(marker, match => match + `
window.complexoShadowDiagnostic = {
 set(mode) {
  const texel = (sun.shadow.camera.right - sun.shadow.camera.left) / sun.shadow.mapSize.x;
  const depth = sun.shadow.camera.far - sun.shadow.camera.near;
  sun.castShadow = mode !== 'off';
  sun.shadow.bias = mode === 'scaled' ? -texel * Math.max(1, sun.shadow.radius) * .8 / depth : -.00012;
  sun.shadow.normalBias = mode === 'scaled' ? Math.max(.008, Math.min(.16, texel * .5)) : .055;
  sun.shadow.needsUpdate = true; renderer.shadowMap.needsUpdate = true;
  scene.traverse(node => { const m = node.material; if (m) for (const material of Array.isArray(m) ? m : [m]) material.needsUpdate = true; });
  render();
  return {mode,texel,bias:sun.shadow.bias,normalBias:sun.shadow.normalBias,shadow:sun.castShadow,camera:camera.position.toArray(),target:controls.target.toArray()};
 }
};`);
}

(async () => {
  if (process.argv.includes('--check-module')) {
    const response = await fetch(origin + modulePath);
    assert(response.ok); const source = await response.text(); instrument(source);
    console.log('PASS module interception marker; production source untouched; browser not launched');
    return;
  }
  fs.mkdirSync(output, { recursive: true });
  const browser = await loadDependency('playwright').chromium.launch(browserOptions());
  try {
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'pt-BR' });
    const page = await context.newPage(), errors = [], samples = []; let intercepted = 0;
    page.setDefaultTimeout(180000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text()); });
    await page.route('**/*', async route => {
      const url = route.request().url();
      if (!url.startsWith(origin + '/')) return route.abort();
      if (new URL(url).pathname === modulePath) {
        const response = await route.fetch();
        intercepted++; return route.fulfill({ response, body: instrument(await response.text()) });
      }
      return route.continue();
    });
    await page.goto(origin + '/7a0-game-studio/qa-presidencia-complexo-3d.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.complexo3D && window.complexoShadowDiagnostic);
    assert.equal(intercepted, 1);
    await page.evaluate(() => {
      const team = side => ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'].map((pos, i) => ({ id: side + i, name: side + i, pos }));
      window.setComplexoMatch({ context: { id: 'sombras-local', home: team('h'), away: team('a') }, minute: 21,
        homeScore: 0, awayScore: 0, paused: true, finished: false, homeColor: '#1b7a3d', awayColor: '#c2452f',
        visualClock: { seconds: 17, sampledAt: performance.now(), running: false, rate: 4 } });
    });
    await page.waitForFunction(() => window.complexo3D.inspect().match.players === 22);
    await page.evaluate(() => window.complexo3D.view('original'));
    const shell = page.locator('.pc3-review');
    await shell.getByRole('button', { name: 'Ampliar mapa', exact: true }).click();
    await page.evaluate(() => window.complexo3D.view('original'));
    const baseline = await page.evaluate(() => ({ save: window.complexoParkingQA.snapshot(), state: window.complexo3D.inspect() }));
    for (const mode of ['baseline', 'off', 'scaled']) {
      const result = await page.evaluate(mode => window.complexoShadowDiagnostic.set(mode), mode);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const filename = `desktop-sombras-diagnostico-${mode}.png`;
      await shell.screenshot({ path: path.join(output, filename) });
      assert.deepEqual(await page.evaluate(() => window.complexoParkingQA.snapshot()), baseline.save);
      assert.deepEqual(await page.evaluate(() => window.complexo3D.inspect().match), baseline.state.match);
      samples.push({ ...result, filename });
      fs.writeFileSync(path.join(output, 'sombras-diagnostico-report.json'), JSON.stringify({ samples, errors }, null, 2));
      console.log('captured', mode, result);
    }
    assert.deepEqual(errors, []);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
