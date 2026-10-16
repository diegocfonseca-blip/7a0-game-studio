const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadDependency, browserOptions } = require('./presidencia-runtime.cjs');

// Local, deterministic review only: no account, backend or published page.
// Run with the 4196 Vite server and no other Chromium session sharing the GPU.
const origin = 'http://127.0.0.1:4196';
const output = path.resolve('test-results/complexo-3d');
const selectedDevice = process.argv.includes('--desktop-only') ? 'desktop' : process.argv.includes('--mobile-only') ? 'mobile' : null;
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const pointDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const inspect = page => page.evaluate(() => {
  const state = window.complexo3D.inspect();
  return {
    journey: state.journey, lighting: state.lighting, state: state.state,
    camera: state.camera, target: state.target, canvas: state.canvas, viewport: state.viewport,
    quality: state.quality, view: state.view, match: state.match, flow: state.flow,
    save: window.complexoParkingQA.snapshot(),
    sameApi: window.journeyInitialApi === window.complexo3D,
    sameCanvas: window.journeyInitialCanvas === document.querySelector('[data-complexo-3d] canvas'),
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    transport: state.transport && {
      seconds: state.transport.seconds, problems: state.transport.problems, allocation: state.transport.allocation,
      vehicles: state.transport.vehicles.map(({ id, rigId, kind, position, heading, speed, distance, phase, doorsOpen, carriages, markers, journeyKey, heldAtGate }) =>
        ({ id, rigId, kind, position, heading, speed, distance, phase, doorsOpen, carriages, markers, journeyKey, heldAtGate })),
      passengers: state.transport.passengers.map(({ id, rigId, transport, side, phase, pose }) => ({ id, rigId, transport, side, phase, pose })),
    },
    circulation: state.circulation && {
      seconds: state.circulation.seconds, problems: state.circulation.problems,
      pedestrians: state.circulation.pedestrians.map(({ id, pose }) => ({ id, pose })),
      fans: state.circulation.fans.map(({ id, pose }) => ({ id, pose })), cars: state.circulation.cars,
    },
    visits: state.visits.map(({ id, rigId, seatId, pose, journey, problems }) => ({ id, rigId, seatId, pose, journey, problems })),
  };
});

function motion(state) {
  return {
    vehicles: state.transport?.vehicles.map(({ id, rigId, kind, position, heading, speed, distance, phase, doorsOpen, carriages }) =>
      ({ id, rigId, kind, position, heading, speed, distance, phase, doorsOpen, carriages })),
    passengers: state.transport?.passengers,
    pedestrians: state.circulation?.pedestrians, fans: state.circulation?.fans, cars: state.circulation?.cars,
    visits: state.visits.map(({ id, rigId, seatId, pose }) => ({ id, rigId, seatId, pose })),
  };
}

function validScene(state, baseline, label) {
  assert(state.sameApi && state.sameCanvas, `${label}: atualização remontou o mapa`);
  assert.deepEqual(state.save, baseline.save, `${label}: jornada alterou o save ou o saldo`);
  assert(!state.overflow, `${label}: página transborda no dispositivo`);
  assert(state.camera.every(Number.isFinite) && state.target.every(Number.isFinite), `${label}: câmera inválida`);
  assert.deepEqual(state.transport?.problems ?? [], [], `${label}: transporte com rota inválida`);
  assert.deepEqual(state.circulation?.problems ?? [], [], `${label}: circulação com rota inválida`);
  assert(state.visits.every(visit => visit.problems.length === 0), `${label}: visita com acesso inválido`);
  const { lighting, flow } = state;
  assert(lighting.activeLocal.length <= lighting.localBudget, `${label}: luzes locais excedem o orçamento`);
  assert(lighting.activeStadium.length <= lighting.stadiumBudget, `${label}: refletores excedem o orçamento`);
  for (const side of ['home', 'away', 'cars']) {
    assert(flow.used[side] <= flow.budget[side] + flow.draining[side], `${label}: duplicação de ${side}`);
  }
}

function sameInstant(before, after, label) {
  assert.deepEqual(after.camera, before.camera, `${label}: câmera mudou sozinha`);
  assert.deepEqual(after.target, before.target, `${label}: alvo mudou sozinho`);
  assert.deepEqual(motion(after), motion(before), `${label}: ator mudou de corpo ou posição sem decorrer tempo`);
}

async function setMatch(page, phase, fixtureId, colors = { home: '#1B7A3D', away: '#C2452F' }) {
  await page.evaluate(({ phase, fixtureId, colors }) => {
    const team = side => ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']
      .map((pos, index) => ({ id: side + index, name: side + index, pos }));
    window.setComplexoMatch({
      context: { id: fixtureId, home: team('h'), away: team('a'), speed: 4 },
      minute: phase === 'interval' ? 45 : phase === 'departure' ? 90 : 21,
      homeScore: 0, awayScore: 0, paused: true, finished: phase === 'departure',
      homeColor: colors.home, awayColor: colors.away,
      visualClock: { seconds: 17, sampledAt: performance.now(), running: false, rate: 4 },
    });
  }, { phase, fixtureId, colors });
  await page.waitForFunction(expected => window.complexo3D.inspect().journey?.phase === expected, phase);
  await frame(page);
}

async function screenshot(page, device, label) {
  const file = `${device}-jornada-${label}.png`;
  await page.locator('.pc3-review').screenshot({ path: path.join(output, file) });
  return file;
}

async function runDevice(browser, device) {
  const { name, ...options } = device;
  const context = await browser.newContext({ ...options, locale: 'pt-BR', reducedMotion: 'reduce' });
  const page = await context.newPage(), errors = [], checkpoints = [];
  page.setDefaultTimeout(180000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text());
  });
  await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const report = { device: name, viewport: options.viewport, checkpoints, images: [], errors };
  try {
    await page.goto(origin + '/7a0-game-studio/qa-presidencia-complexo-3d.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.complexo3D && typeof window.setComplexoJourney === 'function');
    await page.evaluate(() => window.setComplexoJourney({ ordinal: 2, phase: 'arrival' }));
    await page.waitForFunction(() => window.complexo3D.inspect().journey?.phase === 'arrival');
    await setMatch(page, 'playing', 'qa-jornada-2');
    await page.locator('.pc3-review').getByRole('button', { name: 'Ampliar mapa', exact: true }).click();
    await page.locator('.pc3-review').getByRole('button', { name: 'Ver tudo', exact: true }).click();
    await frame(page);
    await page.evaluate(() => {
      window.journeyInitialApi = window.complexo3D;
      window.journeyInitialCanvas = document.querySelector('[data-complexo-3d] canvas');
    });
    const baseline = await inspect(page);
    validScene(baseline, baseline, 'domingo às 16h, de dia');
    assert.equal(baseline.journey.weekday, 'domingo'); assert.equal(baseline.journey.ordinal, 2);
    assert.equal(baseline.journey.kickoffTime, '16:00'); assert.equal(baseline.journey.period, 'day');
    assert.equal(baseline.lighting.period, 'day'); assert.equal(baseline.lighting.activeStadium.length, 0);
    assert.equal(baseline.lighting.activeLocal.length, 0);
    assert.equal(baseline.match.players, 22); assert.equal(baseline.match.time, 17);
    report.images.push(await screenshot(page, name, 'domingo-16h-dia-mapa'));
    checkpoints.push({ label: 'domingo-16h-dia', state: baseline });
    console.log(`${name}: mapa de domingo às 16h capturado`);

    // A paused shared clock stays exactly the same while the calendar's light
    // changes. The optional fixture id represents a rescheduled local fixture.
    await page.evaluate(() => window.setComplexoJourney({ ordinal: 1, phase: 'playing', fixtureId: 'qa-jornada-2' }));
    await page.waitForFunction(() => window.complexo3D.inspect().lighting.period === 'night'); await frame(page);
    const night = await inspect(page);
    validScene(night, baseline, 'quarta às 21h, à noite'); sameInstant(baseline, night, 'troca de iluminação');
    assert.deepEqual(night.match, baseline.match, 'troca de iluminação altera relógio/bola da partida');
    assert.equal(night.journey.weekday, 'quarta'); assert.equal(night.journey.ordinal, 1);
    assert.equal(night.journey.kickoffTime, '21:00'); assert.equal(night.journey.period, 'night');
    assert.equal(night.lighting.activeStadium.length, 4, 'estádio completo precisa dos quatro conjuntos de refletores');
    assert(night.lighting.sources > 4 && night.lighting.emissiveMaterials > 0, 'cidade sem fontes de iluminação');
    report.images.push(await screenshot(page, name, 'quarta-21h-noite-mapa'));
    checkpoints.push({ label: 'quarta-21h-noite', state: night });
    console.log(`${name}: mapa de quarta às 21h capturado; relógio, câmera e corpos preservados`);

    await page.locator('.pc3-review').getByRole('button', { name: 'Ver campo', exact: true }).click(); await frame(page);
    const field = await inspect(page);
    validScene(field, baseline, 'campo noturno');
    assert.equal(field.match.players, 22); assert.equal(field.match.time, 17);
    assert.equal(field.lighting.activeStadium.length, 4);
    report.images.push(await screenshot(page, name, 'quarta-21h-noite-campo'));
    checkpoints.push({ label: 'campo-noturno', state: field });
    console.log(`${name}: campo noturno capturado com 22 jogadores e relógio compartilhado preservado`);

    await page.evaluate(() => {
      const state = window.complexo3D.inspect(), metro = state.transport.vehicles.find(vehicle => vehicle.kind === 'metro');
      window.complexo3D.seekCirculation(metro.markers.doorsOpen + 1);
      window.complexo3D.view('metro');
    }); await frame(page);
    const metro = await inspect(page), train = metro.transport.vehicles.find(vehicle => vehicle.kind === 'metro');
    validScene(metro, baseline, 'metrô noturno');
    assert.equal(train.carriages, 5); assert.equal(train.speed, 0); assert.equal(train.doorsOpen, 1);
    assert.equal(metro.view, 'metro'); assert.equal(metro.match.time, 17);
    assert(metro.lighting.activeLocal.length > 0, 'plataforma noturna sem luz local');
    report.images.push(await screenshot(page, name, 'quarta-21h-noite-metro'));
    checkpoints.push({ label: 'metro-noturno', state: metro });
    console.log(`${name}: metrô noturno capturado com cinco vagões e porta aberta na plataforma`);

    await setMatch(page, 'interval', 'qa-jornada-2');
    const interval = await inspect(page);
    validScene(interval, baseline, 'intervalo'); sameInstant(metro, interval, 'início do intervalo');
    await setMatch(page, 'playing', 'qa-jornada-2');
    const resumed = await inspect(page);
    validScene(resumed, baseline, 'segundo tempo'); sameInstant(interval, resumed, 'retorno do intervalo');
    await setMatch(page, 'departure', 'qa-jornada-2');
    const departure = await inspect(page);
    validScene(departure, baseline, 'apito final'); sameInstant(resumed, departure, 'apito final');
    // The career adapter removes its finished live match while preserving the
    // fixture's departure journey. Supporters keep their last team uniforms
    // and physical bodies until they leave; clearing the pitch is not a reason
    // to respawn passengers or restart their walk outside the stadium.
    await page.evaluate(() => {
      window.setComplexoMatch(undefined);
      window.setComplexoJourney({ ordinal: 1, phase: 'departure', fixtureId: 'qa-jornada-2' });
    });
    await page.waitForFunction(() => {
      const state = window.complexo3D.inspect();
      return state.journey?.phase === 'departure' && state.match.players === 0;
    }); await frame(page);
    const departureWithoutMatch = await inspect(page);
    validScene(departureWithoutMatch, baseline, 'saída sem snapshot de partida');
    sameInstant(departure, departureWithoutMatch, 'remoção da partida encerrada');
    assert.equal(departureWithoutMatch.transport.seconds, departure.transport.seconds, 'remoção da partida avançou o relógio do transporte');
    assert(departureWithoutMatch.match.time === undefined || departureWithoutMatch.match.time === departure.match.time,
      'remoção da partida criou outro relógio de jogo');
    checkpoints.push({ label: 'saida-sem-partida-ativa', state: departureWithoutMatch });
    console.log(`${name}: saída sem snapshot ativo preserva corpos, posições, câmera, saldo e relógios`);
    await page.evaluate(seconds => window.complexo3D.seekCirculation(seconds + .25), departure.transport.seconds); await frame(page);
    const leaving = await inspect(page);
    validScene(leaving, baseline, 'início da saída');
    for (const vehicle of leaving.transport.vehicles) {
      const previous = departure.transport.vehicles.find(candidate => candidate.id === vehicle.id);
      if (previous) {
        assert.equal(vehicle.rigId, previous.rigId, 'saída trocou o corpo do veículo');
        assert(pointDistance(previous.position, vehicle.position) < 6, 'veículo teleportou na saída');
      }
    }
    for (const visitor of leaving.visits) {
      const previous = departure.visits.find(candidate => candidate.id === visitor.id);
      if (previous?.pose && visitor.pose) {
        assert.equal(visitor.rigId, previous.rigId, 'saída trocou o corpo do torcedor');
        assert(pointDistance(previous.pose.hip, visitor.pose.hip) < 1, 'torcedor teleportou na saída');
      }
    }
    checkpoints.push({ label: 'intervalo', state: interval }, { label: 'saida', state: leaving });

    // Another fixture has its own identity/arrival seed and different team
    // colors. Its still travelling actors must finish their path before the
    // next service/uniform takes over, without replacing physical bodies.
    await page.evaluate(() => window.setComplexoJourney({ ordinal: 3, phase: 'arrival' }));
    await setMatch(page, 'playing', 'qa-jornada-3', { home: '#2154A5', away: '#F4ECD6' });
    const next = await inspect(page);
    validScene(next, baseline, 'jogo seguinte'); sameInstant(leaving, next, 'troca para outro dia');
    assert.equal(next.journey.ordinal, 3); assert.equal(next.journey.weekday, 'quarta');
    assert.equal(next.journey.kickoffTime, '21:00'); assert.equal(next.journey.period, 'night');
    assert.notEqual(next.journey.key, departure.journey.key); assert.notEqual(next.journey.variantSeed, departure.journey.variantSeed);
    checkpoints.push({ label: 'outro-dia', state: next });
    console.log(`${name}: continuidade conferida no intervalo, apito final e jogo seguinte`);

    // One additional geometry build verifies that night does not grant stadium
    // floodlights, station, parking, or any purchase to a bare field.
    if (name === 'desktop') {
      await page.evaluate(() => {
        window.setComplexoJourney({ ordinal: 1, phase: 'playing', fixtureId: 'qa-jornada-3' });
        window.setComplexoStage('empty');
      });
      await page.waitForFunction(() => window.complexo3D && window.complexo3D !== window.journeyInitialApi && !window.complexo3D.inspect().state.floodlit);
      await frame(page);
      const empty = await inspect(page);
      assert.equal(empty.journey.weekday, 'quarta'); assert.equal(empty.journey.kickoffTime, '21:00');
      assert.equal(empty.lighting.period, 'night'); assert.equal(empty.lighting.actualFloodlightsPurchased, false);
      assert.deepEqual(empty.lighting.activeStadium, []); assert.equal(empty.state.roofBuilt, false);
      assert.equal(empty.state.extras.estacao, false); assert.equal(empty.state.extras.estac, false);
      assert.deepEqual(empty.save.save, { inv: {}, ext: [] });
      assert.equal(empty.match.players, 22); assert.equal(empty.match.time, 17);
      report.images.push(await screenshot(page, name, 'quarta-21h-noite-varzea'));
      checkpoints.push({ label: 'varzea-noturna-sem-compras', state: empty });
      console.log(`${name}: várzea noturna conferida sem refletores nem compras concedidas`);
    }
    assert.deepEqual(errors, []);
    report.passed = true;
    console.log(`PASS ${name}: dias distintos; luzes físicas limitadas; partida e atores preservados nas transições`);
    return report;
  } catch (error) {
    report.passed = false; report.failure = error.stack;
    report.lastState = await inspect(page).catch(() => null);
    await screenshot(page, name, 'falha').catch(() => undefined);
    fs.writeFileSync(path.join(output, `jornada-${name}-failure-report.json`), JSON.stringify(report, null, 2));
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
      reports.push(await runDevice(browser, device));
      fs.writeFileSync(path.join(output, selectedDevice ? `jornada-${selectedDevice}-browser-report.json` : 'jornada-browser-report.json'), JSON.stringify(reports, null, 2));
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
