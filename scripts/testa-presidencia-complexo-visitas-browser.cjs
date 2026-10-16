const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency, browserOptions} = require('./presidencia-runtime.cjs');

// Local QA only. Serial browser job; never imports an account or writes a save.
const origin = 'http://127.0.0.1:4196';
const output = path.resolve('test-results/complexo-3d');
const selector = '[data-complexo-3d]';
const inspect = page => page.evaluate(() => window.complexo3D.inspect());
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const snapshot = state => ({
  view: state.view, following: state.following, visitRow: state.visitRow, focusedSeat: state.focusedSeat, camera: state.camera, target: state.target,
  viewport: state.viewport, canvas: state.canvas, matchTime: state.match.time,
  seconds: state.circulation?.seconds, reservations: state.crowd.reservations,
  staticCrowd: {home: state.crowd.home, away: state.crowd.away},
  visits: state.visits.map(({stages, ...visit}) => ({...visit, stages: stages.length})),
});
function coherent(state, seconds) {
  assert.equal(state.visits.length, 2, 'QA completa tem exatamente uma visita por lado');
  assert.deepEqual(state.visits.map(v => v.side).sort(), ['away', 'home']);
  assert.deepEqual(state.crowd.reservations.slice().sort(), state.visits.map(v => v.seatId).sort(), 'cada boneco usa sua cadeira reservada');
  assert.equal(state.crowd.reserved.home, 1);assert.equal(state.crowd.reserved.away, 1);
  assert.deepEqual(state.circulation.problems, []);
  for (const visit of state.visits) {
    assert.deepEqual(visit.problems, []);
    assert(visit.rigId && visit.period > 0 && visit.pose?.visible, 'visita usa um rig físico válido');
    assert(state.architecture.accessibleSeats.some(seat => seat.side === visit.side && seat.seatId === visit.seatId && seat.row === state.visitRow), 'cadeira precisa vir do contrato da arquitetura');
    assert(!state.crowd.seats.some(seat => seat.id === visit.seatId), 'torcida estática ocupou cadeira reservada para quem caminha');
    assert(!state.circulation.fans.some(fan => fan.side === visit.side), 'boneco antigo do portão duplicou a visita completa');
    if (seconds !== undefined) assert.equal(visit.seconds, seconds, 'visita perdeu o relógio decorativo compartilhado');
    for (const point of [visit.pose.hip, ...visit.pose.feet.map(foot => foot.position)]) assert(Object.values(point).every(Number.isFinite), 'pose não finita');
  }
  if (seconds !== undefined) assert.equal(state.circulation.seconds, seconds);
}
async function stableWorld(page, baseline, seconds) {
  const result = await page.evaluate(() => ({
    sameApi: window.visitsOriginalApi === window.complexo3D,
    sameCanvas: window.visitsOriginalCanvas === document.querySelector('[data-complexo-3d] canvas'),
    canvases: document.querySelectorAll('[data-complexo-3d] canvas').length,
    state: window.complexo3D.inspect(),
  }));
  assert(result.sameApi && result.sameCanvas);assert.equal(result.canvases, 1);
  for (const key of ['camera', 'target', 'view', 'focusedSeat', 'canvas']) assert.deepEqual(result.state[key], baseline[key], `${key} mudou ao atualizar o relógio/pausa`);
  assert.equal(await page.getByRole('button', {name: 'Retomar passeio', exact: true}).getAttribute('aria-pressed'), 'true');
  coherent(result.state, seconds);
  return result.state;
}

(async () => {
  fs.mkdirSync(output, {recursive: true});
  const browser = await loadDependency('playwright').chromium.launch(browserOptions());
  const report = [];
  try {
    for (const device of [
      {name: 'desktop', side: 'home', viewport: {width: 1280, height: 960}, deviceScaleFactor: 1},
      {name: 'mobile', side: 'away', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true},
    ]) {
      const {name, side, ...options} = device;
      const context = await browser.newContext({...options, locale: 'pt-BR', reducedMotion: 'reduce'});
      const page = await context.newPage(), errors = [];
      page.setDefaultTimeout(120_000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text());});
      page.on('response', response => {if (response.status() >= 400 && response.url().startsWith(origin) && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`);});
      await page.route('**/*', route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
      try {
        await page.goto(`${origin}/7a0-game-studio/qa-presidencia-complexo-3d.html`, {waitUntil: 'domcontentloaded'});
        await page.waitForFunction(() => !!window.complexo3D);
        await page.getByRole('button', {name: 'Pausar passeio', exact: true}).click();
        await page.evaluate(() => {
          const team = side => ['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos, i) => ({id: side + i, name: side + i, pos}));
          window.visitsMatch = {context: {id: 'visitas-local', home: team('h'), away: team('a'), speed: 1}, minute: 20,
            homeScore: 0, awayScore: 0, paused: true, finished: false, homeColor: '#1b7a3d', awayColor: '#c2452f',
            visualClock: {seconds: 14, sampledAt: performance.now(), running: false, rate: 1}};
          window.setComplexoMatch(window.visitsMatch);
        });
        await frames(page);
        // Disabling reduced motion proves the explicit pause still freezes visits.
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await frames(page);
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.evaluate(side => {
          window.visitsOriginalApi = window.complexo3D;
          window.visitsOriginalCanvas = document.querySelector('[data-complexo-3d] canvas');
          window.complexo3D.view(`visit-${side}`);
        }, side);
        const initial = await inspect(page);coherent(initial);
        assert(initial.seatDetail.count>0&&initial.seatDetail.count<=96,'zoom ativa detalhe limitado das cadeiras');
        assert(initial.seatDetail.selected.includes(initial.focusedSeat),'cadeira da visita recebe espessura e suporte no zoom');
        assert(initial.viewport[1] >= 500, 'área do mapa curta no aparelho');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'página excedeu largura do aparelho');
        const identities = new Map(initial.visits.map(visit => [visit.side, {id: visit.id, rigId: visit.rigId, seatId: visit.seatId}]));
        const phases = [];
        for (const actorSide of ['home', 'away']) {
          const original = initial.visits.find(visit => visit.side === actorSide);
          for (const phase of ['walking', 'climbing', 'sitting', 'seated', 'standing', 'descending']) {
            const stage = original.stages.filter(stage => stage.phase === phase).at(phase === 'climbing' ? -1 : 0);
            assert(stage, `${actorSide}: faltou fase ${phase}`);
            const seconds = stage.at + stage.duration * .5;
            await page.evaluate(seconds => window.complexo3D.seekCirculation(seconds), seconds);
            const state = await inspect(page);coherent(state, seconds);
            const current = state.visits.find(visit => visit.side === actorSide);
            assert.equal(current.pose.phase, phase);
            for (const visit of state.visits) assert.deepEqual({id: visit.id, rigId: visit.rigId, seatId: visit.seatId}, identities.get(visit.side), 'rig trocou entre entrada, escada e cadeira');
            assert.equal(state.match.time, initial.match.time, 'buscar passeio alterou o tempo da partida');
            if (phase === 'climbing') assert(current.pose.feet.some(foot => !foot.supported), 'subida não levantou o pé');
            if (phase === 'seated') {
              assert.equal(current.pose.seated, 1);
              assert(current.pose.feet.every(foot => foot.supported), 'sentado ficou sem apoio');
              assert(Math.abs(current.pose.hip.y - (current.pose.feet[0].position.y + .51)) < .03, 'quadril não encaixou na cadeira');
            }
            phases.push({side: actorSide, phase, seconds, pose: current.pose});
            if (actorSide === side && ['climbing', 'seated'].includes(phase)) {
              assert.equal(state.focusedSeat, current.seatId, 'câmera não aponta para a vaga do ator');
              await page.locator(selector).screenshot({path: path.join(output, `${name}-visita-${side}-${phase}.png`)});
              report.push({device: name, phase, state: snapshot(state)});
            }
          }
        }
        const seatedStage = initial.visits.find(visit => visit.side === side).stages.find(stage => stage.phase === 'seated');
        const seconds = seatedStage.at + seatedStage.duration * .5;
        await page.evaluate(seconds => window.complexo3D.seekCirculation(seconds), seconds);
        const paused = await inspect(page);
        await frames(page);await stableWorld(page, paused, seconds);
        await page.evaluate(() => {
          window.visitsMatch = {...window.visitsMatch, minute: 32, visualClock: {...window.visitsMatch.visualClock, seconds: 24, sampledAt: performance.now()}};
          window.setComplexoMatch(window.visitsMatch);
        });
        await frames(page);
        const clockChanged = await stableWorld(page, paused, seconds);
        assert.equal(clockChanged.match.time, 24, 'partida não leu seu relógio oficial');
        for (const visit of clockChanged.visits) assert.equal(visit.rigId, identities.get(visit.side).rigId, 'relógio da partida recriou ator decorativo');
        // Follow a real body through every available destination without creating
        // multiple visitors in the same stairway or moving the official match clock.
        const followed = [];
        for (const row of [0, 5, 10]) {
          const beforeRow = await inspect(page);
          await page.evaluate(row => window.setComplexoVisitRow(row), row);
          await frames(page);
          const rowState = await inspect(page);coherent(rowState, seconds);
          assert.equal(rowState.visitRow, row);
          assert.equal(rowState.following, null, 'trocar rota libera o acompanhamento anterior');
          assert.deepEqual(rowState.camera, beforeRow.camera, 'troca do destino não deve arrastar a câmera');
          assert.equal(await page.evaluate(() => window.visitsOriginalApi === window.complexo3D), true);
          for (const actorSide of ['home', 'away']) {
            const actor = rowState.visits.find(v => v.side === actorSide);
            const capture = row === 10 && actorSide === side;
            let prior;
            for (const phase of ['walking', 'climbing', 'seated', 'descending']) {
              const stage = actor.stages.filter(stage => stage.phase === phase).at(phase === 'climbing' ? -1 : 0);
              assert(stage);
              const at = stage.at + stage.duration * .5;
              const current = await page.evaluate(({at, actorSide, begin}) => {
                window.complexo3D.seekCirculation(at);
                if (begin) window.complexo3D.view(`follow-${actorSide}`);
                return window.complexo3D.inspect();
              }, {at, actorSide, begin: !prior});
              coherent(current, at);
              assert.equal(current.following, actorSide);
              assert.equal(current.focusedSeat, actor.seatId);
              assert.equal(current.match.time, 24);
              const person = current.visits.find(v => v.side === actorSide);
              assert.equal(person.rigId, actor.rigId);
              for (const [i, axis] of ['x', 'y', 'z'].entries()) {
                const target = person.pose.hip[axis] + (axis === 'y' ? .26 : 0);
                assert(Math.abs(current.target[i] - target) < 1e-7, 'câmera perdeu o corpo em movimento');
                if (prior) assert(Math.abs((current.camera[i] - current.target[i]) - (prior.camera[i] - prior.target[i])) < 1e-7, 'acompanhamento alterou o enquadramento');
              }
              if (capture && ['climbing', 'seated'].includes(phase)) {
                await page.locator(selector).scrollIntoViewIfNeeded();
                await page.locator(selector).screenshot({path: path.join(output, `${name}-visita-${side}-fila${row}-${phase}.png`)});
              }
              followed.push({row, side: actorSide, phase, state: snapshot(current)});
              prior = current;
            }
          }
          // The same explicit pause must still freeze the new route.
          const freeze = await inspect(page);await frames(page);
          const afterFreeze = await inspect(page);
          assert.deepEqual(afterFreeze.camera, freeze.camera);
          assert.deepEqual(afterFreeze.visits, freeze.visits);
          // Stop following before the next row; keep the paused seconds stable.
          await page.evaluate(({side, seconds}) => {window.complexo3D.view(`visit-${side}`);window.complexo3D.seekCirculation(seconds);}, {side, seconds});
        }
        await page.evaluate(side => window.complexo3D.view(`follow-${side}`), side);
        await page.locator(selector).scrollIntoViewIfNeeded();
        const rect = await page.locator(selector).boundingBox();
        await page.mouse.move(rect.x + rect.width * .5, rect.y + rect.height * .5);
        await page.mouse.down();await page.mouse.move(rect.x + rect.width * .58, rect.y + rect.height * .54, {steps: 3});await page.mouse.up();
        assert.equal((await inspect(page)).following, null, 'explorar manualmente deve liberar a câmera');
        report.push({device: name, followed});
        const lighting = await page.evaluate(() => window.complexo3D.checkLighting());
        assert.equal(lighting.invalidSamples, 0);
        await page.evaluate(() => {window.visitsPreviousApi = window.complexo3D;window.setComplexoStage('empty');});
        await page.waitForFunction(() => !!window.complexo3D && window.complexo3D !== window.visitsPreviousApi);
        const empty = await inspect(page);
        assert.equal(empty.seatDetail.count,0,'não existe cadeira detalhada na várzea');
        assert.equal(await page.getByRole('button', {name:'Acompanhar torcida da casa', exact:true}).count(), 0);
        assert.equal(await page.getByRole('button', {name:'Acompanhar visitantes', exact:true}).count(), 0);
        assert.equal(empty.following, null);
        assert.deepEqual(empty.visits, [], 'várzea recebeu visita a uma cadeira ainda não comprada');
        assert.deepEqual(empty.crowd.reservations, []);assert.equal(empty.crowd.total, 0);
        assert.deepEqual(empty.architecture.accessibleSeats, []);assert.equal(empty.architecture.roof, false);
        assert.deepEqual(errors, []);
        report.push({device: name, phases, paused: snapshot(clockChanged), lighting, empty: {visits: empty.visits, reservations: empty.crowd.reservations, seats: empty.architecture.seats}});
        console.log(`PASS ${name}: filas 0/5/10, câmera acompanha ambos os lados, mesmo rig entra/sobe/senta/sai; vaga reservada sem duplicação; câmera/canvas/pausa e relógios preservados; várzea sem acesso inventado.`);
      } finally {await context.close();}
    }
    fs.writeFileSync(path.join(output, 'visitas-report.json'), JSON.stringify(report, null, 2));
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});
