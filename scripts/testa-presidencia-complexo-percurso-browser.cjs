const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadDependency, browserOptions } = require('./presidencia-runtime.cjs');

// Local QA only. Run after CPU geometry checks, with one Vite on 4196 and no
// other Chromium sharing the renderer. Devices intentionally run serially.
const origin = 'http://127.0.0.1:4196';
const output = path.resolve('test-results/complexo-3d');
const selectedDevice = process.argv.includes('--desktop-only') ? 'desktop' : process.argv.includes('--mobile-only') ? 'mobile' : null;
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const close = (a, b, label, epsilon = 1e-5) => assert(Math.abs(a - b) <= epsilon, `${label}: ${a} / ${b}`);

const inspect = page => page.evaluate(() => {
  const state = window.complexo3D.inspect();
  return {
    journey: state.journey, lighting: state.lighting, match: state.match, flow: state.flow,
    camera: state.camera, target: state.target, canvas: state.canvas, viewport: state.viewport,
    view: state.view, following: state.following, focusedSeat: state.focusedSeat,
    save: window.complexoParkingQA.snapshot(),
    sameApi: window.percursoInitialApi === window.complexo3D,
    sameCanvas: window.percursoInitialCanvas === document.querySelector('[data-complexo-3d] canvas'),
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    transport: state.transport && {
      seconds: state.transport.seconds, problems: state.transport.problems, allocation: state.transport.allocation,
      vehicles: state.transport.vehicles.map(({ id, rigId, kind, position, heading, speed, distance, phase, doorsOpen, carriages, markers, journeyKey, heldAtGate, heldAtAccess, waitingForSeat }) =>
        ({ id, rigId, kind, position, heading, speed, distance, phase, doorsOpen, carriages, markers, journeyKey, heldAtGate, heldAtAccess, waitingForSeat })),
      passengers: state.transport.passengers.map(({ id, rigId, vehicleId, transport, side, seatId, ownsSeat, color, phase, pose, markers }) =>
        ({ id, rigId, vehicleId, transport, side, seatId, ownsSeat, color, phase, pose, markers })),
    },
    visits: state.visits.map(({ id, rigId, side, seatId, pose, problems, journey, period, seconds }) => ({ id, rigId, side, seatId, pose, problems, journey, period, seconds })),
    crowd: { total: state.crowd.total, reservations: state.crowd.reservations, reserved: state.crowd.reserved,
      seats: state.crowd.seats.map(({ id, side }) => ({ id, side })) },
    crowdDeparture: state.crowdDeparture,
    circulationProblems: state.circulation?.problems ?? [],
  };
});

function physical(state) {
  return {
    vehicles: state.transport.vehicles.map(({ id, rigId, position, heading, speed, distance, phase, doorsOpen }) =>
      ({ id, rigId, position, heading, speed, distance, phase, doorsOpen })),
    passengers: state.transport.passengers.map(({ id, rigId, side, seatId, color, phase, pose }) =>
      ({ id, rigId, side, seatId, color, phase, pose })),
    visits: state.visits.map(({ id, rigId, side, seatId, pose }) => ({ id, rigId, side, seatId, pose })),
    cohort: state.crowdDeparture?.actors.map(({ id, rigId, side, seatId, state, color, pose }) =>
      ({ id, rigId, side, seatId, state, color, pose })),
  };
}

function validScene(state, baseline, label) {
  assert(state.sameApi && state.sameCanvas, `${label}: remontou mapa/canvas`);
  assert.deepEqual(state.save, baseline.save, `${label}: mudou save ou saldo`);
  assert(!state.overflow, `${label}: overflow horizontal`);
  assert(state.camera.every(Number.isFinite) && state.target.every(Number.isFinite), `${label}: câmera inválida`);
  assert.deepEqual(state.transport.problems, [], `${label}: transporte inválido`);
  assert.deepEqual(state.circulationProblems, [], `${label}: circulação inválida`);
  assert(state.visits.every(visit => !visit.problems.length), `${label}: visita inválida`);
  assert.equal(state.match.players, 22, `${label}: preserva os 22 jogadores`);
  assert.equal(state.match.time, 17, `${label}: percurso não altera o relógio compartilhado`);
  for (const side of ['home', 'away', 'cars']) {
    assert(state.flow.used[side] <= state.flow.budget[side] + state.flow.draining[side], `${label}: duplicou orçamento ${side}`);
  }
  const passengers = state.transport.passengers.filter(passenger => passenger.seatId);
  const visits = state.visits.filter(visit => visit.seatId);
  const cohort = state.crowdDeparture?.actors ?? [];
  const animatedSeats = [...passengers, ...visits, ...cohort].map(actor => actor.seatId);
  const actualSeats = [...passengers.filter(passenger => passenger.phase !== 'riding'), ...visits, ...cohort].map(actor => actor.seatId);
  assert.equal(new Set(actualSeats).size, actualSeats.length, `${label}: dois corpos ocupam o mesmo acesso/cadeira`);
  const transportOwners = passengers.filter(passenger => passenger.ownsSeat).map(passenger => passenger.seatId);
  assert.equal(new Set(transportOwners).size, transportOwners.length, `${label}: dois serviços são donos da mesma cadeira`);
  for (const passenger of passengers) {
    if (passenger.phase !== 'riding') assert(passenger.ownsSeat, `${label}: passageiro desembarcou sem posse da cadeira`);
    const competitors = [...passengers.filter(other => other.rigId !== passenger.rigId), ...visits, ...cohort].filter(actor => actor.seatId === passenger.seatId);
    // The previous owner may already be on board with its door still closing.
    // Only a future claimant must wait for that owner's completed journey.
    if (competitors.length && passenger.phase === 'riding' && !passenger.ownsSeat) {
      const vehicle = state.transport.vehicles.find(candidate => candidate.id === passenger.vehicleId);
      assert.equal(vehicle.doorsOpen, 0, `${label}: reserva futura abriu porta antes da cadeira ser liberada`);
      if (vehicle.speed === 0 && vehicle.phase !== 'origin') assert(vehicle.heldAtAccess, `${label}: reserva futura deve esperar dentro do veículo`);
      if (!passenger.ownsSeat) assert.equal(vehicle.waitingForSeat, passenger.seatId, `${label}: disputa entre serviços precisa de dono explícito`);
    }
  }
  const occupied = new Set(state.crowd.seats.map(seat => seat.id));
  for (const seatId of animatedSeats) {
    assert(state.crowd.reservations.includes(seatId), `${label}: cadeira animada sem reserva ${seatId}`);
    assert(!occupied.has(seatId), `${label}: torcida estática duplica corpo na cadeira ${seatId}`);
  }
  for (const passenger of state.transport.passengers) {
    assert(passenger.pose.visible && passenger.pose.feet.some(foot => foot.supported), `${label}: passageiro sem apoio visível`);
  }
}

function sameInstant(before, after, label) {
  assert.deepEqual(after.camera, before.camera, `${label}: câmera se moveu sem tempo decorrido`);
  assert.deepEqual(after.target, before.target, `${label}: alvo se moveu sem tempo decorrido`);
  assert.equal(after.transport.seconds, before.transport.seconds, `${label}: reiniciou relógio decorativo`);
  assert.deepEqual(physical(after), physical(before), `${label}: mudou corpo, posição, cadeira ou uniforme antes de completar a jornada`);
}

async function configureMatch(page, { phase = 'playing', ordinal, fixtureId, colors = { home: '#1B7A3D', away: '#C2452F' } }) {
  await page.evaluate(({ phase, ordinal, fixtureId, colors }) => {
    const team = side => ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']
      .map((pos, index) => ({ id: side + index, name: side + index, pos }));
    if (ordinal !== undefined) window.setComplexoJourney({ ordinal, phase, fixtureId });
    window.setComplexoMatch({ context: { id: fixtureId, home: team('h'), away: team('a'), speed: 4 },
      minute: phase === 'interval' ? 45 : phase === 'departure' ? 90 : 21,
      homeScore: 0, awayScore: 0, paused: true, finished: phase === 'departure', homeColor: colors.home, awayColor: colors.away,
      visualClock: { seconds: 17, sampledAt: performance.now(), running: false, rate: 4 } });
  }, { phase, ordinal, fixtureId, colors });
  await page.waitForFunction(({ phase, fixtureId }) => {
    const state = window.complexo3D.inspect();
    return state.journey?.fixtureId === fixtureId && state.journey.phase === phase;
  }, { phase, fixtureId });
  await frame(page);
}

async function seek(page, seconds) {
  assert(Number.isFinite(seconds) && seconds >= 0, 'tempo decorativo de QA inválido');
  const visits = await page.evaluate(time => {
    const before = window.complexo3D.inspect();
    window.complexo3D.seekCirculation(time);
    const after = window.complexo3D.inspect();
    return { beforeSeconds: before.transport.seconds, afterSeconds: after.transport.seconds,
      before: before.visits.map(({ rigId, period, journey }) => ({ rigId, period, journey })),
      after: after.visits.map(({ rigId }) => rigId) };
  }, seconds);
  if (visits.afterSeconds >= visits.beforeSeconds) for (const visit of visits.before) {
    if (visits.after.includes(visit.rigId) || visit.journey.completed) continue;
    const remaining = Math.max(0, visit.period - visit.journey.localSeconds) + visit.journey.departureDelay;
    assert(visits.afterSeconds - visits.beforeSeconds >= remaining - 1e-5, 'visita que está saindo desapareceu antes de ter tempo para alcançar a origem');
  }
  await frame(page);
}

async function capture(page, report, label) {
  assert(report.images.length < 3, 'máximo de três capturas por dispositivo');
  const file = `${report.device}-percurso-${label}.png`;
  await page.locator('.pc3-review').screenshot({ path: path.join(output, file) });
  report.images.push(file);
}

async function runDevice(browser, device) {
  const { name, ...options } = device;
  const context = await browser.newContext({ ...options, locale: 'pt-BR', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const report = { device: name, viewport: options.viewport, images: [], checkpoints: [], errors: [], httpErrors: [], blockedExternal: [] };
  page.setDefaultTimeout(180000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) report.errors.push(message.text());
  });
  page.on('response', response => {
    if (response.url().startsWith(origin + '/') && response.status() >= 400) report.httpErrors.push({ status: response.status(), url: response.url() });
  });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/')) return route.continue();
    report.blockedExternal.push(url); return route.abort();
  });
  try {
    await page.goto(origin + '/7a0-game-studio/qa-presidencia-complexo-3d.html?jornada=1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.complexo3D && typeof window.setComplexoJourney === 'function');
    await configureMatch(page, { ordinal: 1, fixtureId: 'qa-jornada-1' });
    const review = page.locator('.pc3-review');
    await review.getByRole('button', { name: 'Ampliar mapa', exact: true }).click();
    await review.getByRole('button', { name: /^Locais/ }).click();
    await review.getByRole('button', { name: 'Pausar passeio', exact: true }).click();
    await review.getByRole('button', { name: 'Metrô', exact: true }).click();
    // Explicit backwards QA seek activates the newly requested calendar entry
    // before any continuity assertion. No live transition below may reset it.
    await seek(page, 0);
    await page.evaluate(() => {
      window.percursoInitialApi = window.complexo3D;
      window.percursoInitialCanvas = document.querySelector('[data-complexo-3d] canvas');
    });
    const baseline = await inspect(page);
    validScene(baseline, baseline, 'origem de quarta');
    assert.equal(baseline.journey.weekday, 'quarta'); assert.equal(baseline.journey.kickoffTime, '21:00');
    assert.equal(baseline.journey.period, 'night'); assert.equal(baseline.lighting.period, 'night');
    const initialPassenger = baseline.transport.passengers.find(passenger => passenger.transport === 'metro' && passenger.seatId);
    assert(initialPassenger, 'metrô deve ter um passageiro com assento físico reservado');
    const initialVehicle = baseline.transport.vehicles.find(vehicle => vehicle.id === initialPassenger.vehicleId);
    assert(initialVehicle && initialVehicle.carriages === 5);
    assert(Number.isFinite(initialPassenger.markers.seated) && initialPassenger.markers.seated > initialPassenger.markers.exitClear);
    report.checkpoints.push({ label: 'origem-quarta-21h', state: baseline });

    const alightingTime = initialPassenger.markers.doorsOpen + Math.min(1, (initialPassenger.markers.exitClear - initialPassenger.markers.doorsOpen) / 2);
    await seek(page, alightingTime);
    const alighting = await inspect(page);
    validScene(alighting, baseline, 'desembarque');
    const passenger = alighting.transport.passengers.find(actor => actor.id === initialPassenger.id);
    const train = alighting.transport.vehicles.find(vehicle => vehicle.id === passenger.vehicleId);
    assert.equal(passenger.rigId, initialPassenger.rigId); assert.equal(passenger.seatId, initialPassenger.seatId);
    assert.equal(passenger.phase, 'alighting'); assert.equal(train.doorsOpen, 1); assert.equal(train.speed, 0);
    assert.equal(train.rigId, initialVehicle.rigId);
    await capture(page, report, 'quarta-21h-metro-desembarque');
    report.checkpoints.push({ label: 'mesmo-passageiro-desembarca', state: alighting });
    console.log(`${name}: desembarque no metrô com corpo e assento reservados`);

    // Use the same follow control exposed on mobile. Following must resolve
    // the transported body, not a second independent seat visitor.
    await review.getByRole('button', { name: /^Locais/ }).click();
    await review.getByRole('button', { name: passenger.side === 'home' ? 'Acompanhar torcida da casa' : 'Acompanhar visitantes', exact: true }).click();
    await frame(page);
    const following = await inspect(page);
    assert.equal(following.following, passenger.side); assert.equal(following.focusedSeat, passenger.seatId);
    await seek(page, following.transport.seconds + .5);
    const followed = await inspect(page), moved = followed.transport.passengers.find(actor => actor.id === passenger.id);
    validScene(followed, baseline, 'câmera acompanha o mesmo passageiro');
    assert.equal(moved.rigId, passenger.rigId);
    const hipBefore = following.transport.passengers.find(actor => actor.id === passenger.id).pose.hip;
    const delta = [moved.pose.hip.x - hipBefore.x, moved.pose.hip.y - hipBefore.y, moved.pose.hip.z - hipBefore.z];
    assert(Math.hypot(...delta) > .001, 'amostra de acompanhamento deve realmente andar');
    for (let index = 0; index < 3; index++) {
      close(followed.camera[index] - following.camera[index], delta[index], 'câmera acompanha deslocamento do passageiro');
      close(followed.target[index] - following.target[index], delta[index], 'alvo acompanha deslocamento do passageiro');
    }

    await seek(page, moved.markers.seated + .1);
    const seated = await inspect(page), seatedPassenger = seated.transport.passengers.find(actor => actor.id === passenger.id);
    validScene(seated, baseline, 'passageiro no assento');
    assert.equal(seatedPassenger.rigId, passenger.rigId); assert.equal(seatedPassenger.seatId, passenger.seatId);
    assert.equal(seatedPassenger.phase, 'seated'); close(seatedPassenger.pose.seated, 1, 'corpo sentado');
    assert.equal(seated.following, passenger.side);
    await capture(page, report, 'quarta-21h-mesmo-passageiro-assento');
    report.checkpoints.push({ label: 'mesmo-passageiro-sentado', state: seated });
    console.log(`${name}: câmera seguiu o mesmo corpo até sua cadeira sem duplicar torcida`);

    await configureMatch(page, { phase: 'interval', fixtureId: 'qa-jornada-1' });
    const interval = await inspect(page); validScene(interval, baseline, 'intervalo'); sameInstant(seated, interval, 'intervalo');
    await configureMatch(page, { phase: 'playing', fixtureId: 'qa-jornada-1' });
    const resumed = await inspect(page); sameInstant(interval, resumed, 'segundo tempo');
    await configureMatch(page, { phase: 'departure', fixtureId: 'qa-jornada-1' });
    const departure = await inspect(page); validScene(departure, baseline, 'apito final'); sameInstant(resumed, departure, 'apito final');
    await seek(page, departure.transport.seconds + .25);
    const leaving = await inspect(page); validScene(leaving, baseline, 'começo da saída');
    for (const actor of leaving.transport.passengers) {
      const old = departure.transport.passengers.find(candidate => candidate.id === actor.id);
      if (!old) continue;
      assert.equal(actor.rigId, old.rigId);
      assert(distance(actor.pose.hip, old.pose.hip) < (actor.phase === 'riding' ? 2.6 : .7), 'apito final teleporta passageiro');
    }
    report.checkpoints.push({ label: 'saida-sem-reiniciar', state: leaving });

    // Change fixture while the original passengers are still present. Their
    // return journey and uniforms must survive even though the light changes.
    await configureMatch(page, { ordinal: 2, fixtureId: 'qa-jornada-2', colors: { home: '#2154A5', away: '#F4ECD6' } });
    const sunday = await inspect(page); validScene(sunday, baseline, 'domingo seguinte'); sameInstant(leaving, sunday, 'novo jogo com outra camisa');
    assert.notEqual(sunday.journey.key, baseline.journey.key);
    assert.equal(sunday.journey.weekday, 'domingo'); assert.equal(sunday.journey.kickoffTime, '16:00');
    assert.equal(sunday.journey.period, 'day'); assert.equal(sunday.lighting.period, 'day');
    assert.equal(sunday.lighting.activeStadium.length, 0);
    report.checkpoints.push({ label: 'domingo-16h-sem-reiniciar-percurso', state: sunday });

    // A physical cohort is optional in older previews. When present, inspect
    // its actual old-fixture body leaving before the next arrival. The shared
    // lane opens after transported supporters board, never by hiding them.
    if (sunday.crowdDeparture?.actors?.length) {
      const returnBoarded = Math.max(sunday.transport.seconds, ...sunday.transport.passengers.map(actor => actor.markers.boarded));
      await seek(page, returnBoarded + .5);
      await seek(page, returnBoarded + 1);
      let cohortState = await inspect(page);
      for (let step = 0; step < 12 && !cohortState.crowdDeparture.actors.some(actor => actor.state === 'leaving'); step++) {
        await seek(page, cohortState.transport.seconds + 2);
        cohortState = await inspect(page);
      }
      validScene(cohortState, baseline, 'coorte saindo');
      const cohortActor = cohortState.crowdDeparture.actors.find(actor => actor.state === 'leaving');
      assert(cohortActor, 'coorte existente deve iniciar saída física após liberar o corredor');
      const original = departure.crowdDeparture.actors.find(actor => actor.id === cohortActor.id);
      assert.equal(cohortActor.rigId, original.rigId); assert.equal(cohortActor.seatId, original.seatId);
      await page.evaluate(side => window.complexo3D.view(side === 'home' ? 'visit-home' : 'visit-away'), cohortActor.side);
      await frame(page);
      await capture(page, report, 'domingo-16h-torcida-anterior-saindo');
      report.checkpoints.push({ label: 'coorte-saida-fisica', state: await inspect(page) });
    }
    assert.deepEqual(report.errors, [], 'erros de execução/renderização');
    assert.deepEqual(report.httpErrors, [], 'recursos locais ausentes, inclusive 404');
    report.passed = true;
    console.log(`PASS ${name}: metrô→cadeira, reservas, acompanhamento, saída e novo jogo com horários corretos`);
    return report;
  } catch (error) {
    report.passed = false; report.failure = error.stack;
    report.lastState = await inspect(page).catch(() => null);
    fs.writeFileSync(path.join(output, `percurso-${name}-failure-report.json`), JSON.stringify(report, null, 2));
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
    ].filter(device => !selectedDevice || selectedDevice === device.name)) {
      reports.push(await runDevice(browser, device));
      fs.writeFileSync(path.join(output, selectedDevice ? `percurso-${selectedDevice}-browser-report.json` : 'percurso-browser-report.json'), JSON.stringify(reports, null, 2));
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
