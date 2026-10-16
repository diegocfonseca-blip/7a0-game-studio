const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency, browserOptions} = require('./presidencia-runtime.cjs');

// Review the actual production bodies in their actual streets and stands. These
// existing local fixtures never sign in, fetch a saved club or publish changes.
const origin = process.env.PRESIDENCIA_QA_ORIGIN || 'http://127.0.0.1:4196';
const output = path.resolve(process.env.PRESIDENCIA_HUMANOS_OUTPUT || 'test-results/humanos-20261016');
const sceneFilter = (process.env.PRESIDENCIA_HUMANOS_SCENES || 'bairro,arquibancada').split(',');
const deviceFilter = (process.env.PRESIDENCIA_HUMANOS_DEVICES || 'desktop,mobile').split(',');
const phaseFilter = (process.env.PRESIDENCIA_HUMANOS_PHASES || 'climbing,seated,stands').split(',');
const devices = [
  {name:'desktop', viewport:{width:1200,height:900}, deviceScaleFactor:1},
  {name:'mobile', viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true},
].filter(device => deviceFilter.includes(device.name));
const reports = [];

function finite(values, label) {
  assert(values.length > 0 && values.every(Number.isFinite), `${label}: transformação não finita`);
}
function checkPose(pose, label) {
  assert(pose?.visible, `${label}: corpo invisível`);
  finite(Object.values(pose.hip), `${label}/quadril`);
  finite([pose.heading, pose.seated], label);
  assert.equal(pose.feet.length, 2);
  for (const foot of pose.feet) finite([...Object.values(foot.position), foot.heading], `${label}/pé`);
}
function dimensions(file) {
  const bytes = fs.readFileSync(file);
  assert(bytes.length > 25_000, `${file}: captura vazia ou sem detalhe`);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};
}
async function capture(page, selector, name, state) {
  const locator = page.locator(selector);
  await locator.scrollIntoViewIfNeeded();
  const layout = await locator.evaluate(node => ({
    width:node.clientWidth,height:node.clientHeight,
    documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
  }));
  assert(layout.width >= 300 && layout.height >= 460, `${name}: mapa pequeno`);
  assert(layout.documentWidth <= layout.viewportWidth + 1, `${name}: overflow horizontal`);
  const file = path.join(output, `${name}.png`);
  await locator.screenshot({path:file});
  const image = dimensions(file);
  assert(image.width >= layout.width && image.height >= layout.height, `${name}: captura truncada`);
  reports.push({capture:name,layout,image,state});
}
async function twoFrames(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function bairro(page, name) {
  await page.goto(`${origin}/7a0-game-studio/qa-presidencia-bairro-3d.html`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => !!window.bairro3D);
  await page.getByRole('button', {name:'Pausar movimento',exact:true}).click();
  await page.getByRole('button', {name:'Retomar movimento',exact:true}).waitFor();
  const selector = '[data-bairro-3d]';
  for (const [label,seconds,view,zoom] of [
    ['pedestre-na-calcada',6,'pedestrian',true],
    ['pedestre-entrada',24,'entrance',false],
  ]) {
    await page.evaluate(({seconds,view}) => {window.bairro3D.seek(seconds);window.bairro3D.view(view);}, {seconds,view});
    await page.locator(selector).scrollIntoViewIfNeeded();
    if (zoom) {
      const rect = await page.locator(selector).boundingBox();
      await page.mouse.move(rect.x + rect.width * .5, rect.y + rect.height * .5);
      await page.mouse.wheel(0,-650);
      await twoFrames(page);
    }
    const state = await page.evaluate(() => window.bairro3D.inspect());
    finite([...state.camera,...state.target,...state.canvas], name);
    assert(state.drawCalls > 0 && state.triangles > 0 && state.shadowMap);
    assert.equal(state.feet.length, 2);
    assert(state.feet.every(foot => Number.isFinite(foot.min) && Number.isFinite(foot.max) && foot.min >= state.frame.pedestre.y - .0001), 'pé atravessou o piso');
    assert(state.feet.some(foot => Math.abs(foot.min - state.frame.pedestre.y) <= .01), 'dois pés flutuam acima do piso');
    const lighting = await page.evaluate(() => window.bairro3D.checkLighting());
    assert.equal(lighting.invalidSamples,0);
    assert(lighting.litSamples > 0);
    await capture(page,selector,`${name}-${label}`,{...state,lighting});
  }
}

async function complexo(page, name) {
  await page.goto(`${origin}/7a0-game-studio/qa-presidencia-complexo-3d.html`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => !!window.complexo3D);
  await page.getByRole('button', {name:'Pausar passeio',exact:true}).click();
  await page.getByRole('button', {name:'Retomar passeio',exact:true}).waitFor();
  const initial = await page.evaluate(() => window.complexo3D.inspect());
  assert.equal(initial.visits.length,2,'fixture deve preservar uma visita de cada torcida');
  assert(initial.crowd.total > 0, 'fixture sem torcida sentada');
  const side = name === 'mobile' ? 'away' : 'home';
  const visit = initial.visits.find(value => value.side === side);
  assert(visit, 'visita real indisponível');
  const selector = '[data-complexo-3d]';
  for (const phase of ['walking','climbing','seated']) {
    const stage = visit.stages.filter(value => value.phase === phase).at(phase === 'climbing' ? -1 : 0);
    assert(stage, `faltou fase ${phase}`);
    const seconds = stage.at + stage.duration * .5;
    const state = await page.evaluate(({seconds,side}) => {
      window.complexo3D.seekCirculation(seconds);
      window.complexo3D.view(`follow-${side}`);
      // Real map navigation: zoom via its own controls, never alter the body.
      window.complexo3D.zoom(1);
      if (innerWidth < 600) window.complexo3D.zoom(1);
      return window.complexo3D.inspect();
    },{seconds,side});
    const actor = state.visits.find(value => value.side === side);
    assert.equal(actor.rigId,visit.rigId,'ator trocado entre trajeto e cadeira');
    assert.equal(actor.pose.phase,phase);
    checkPose(actor.pose,`${name}/${phase}`);
    finite([...state.camera,...state.target,...state.canvas],`${name}/${phase}`);
    assert.deepEqual(actor.problems,[]);
    assert(state.crowd.reservations.includes(actor.seatId),'cadeira não reservada');
    assert(!state.crowd.seats.some(seat => seat.id === actor.seatId),'torcida estática duplicou o corpo na cadeira');
    if (phase === 'seated') {
      assert.equal(actor.pose.seated,1);
      assert(actor.pose.feet.every(foot => foot.supported));
      assert(Math.abs(actor.pose.hip.y - (actor.pose.feet[0].position.y + .51)) < .03,'quadril fora da cadeira');
    }
    const lighting = await page.evaluate(() => window.complexo3D.checkLighting());
    assert.equal(lighting.invalidSamples,0);
    await capture(page,selector,`${name}-torcedor-${phase}`,{
      camera:state.camera,target:state.target,drawCalls:state.drawCalls,triangles:state.triangles,
      canvas:state.canvas,seatDetail:state.seatDetail,visit:actor,crowd:state.crowd.total,lighting,
    });
  }
  const stands = await page.evaluate(() => {
    window.complexo3D.view('stands');
    window.complexo3D.zoom(1);
    if (innerWidth < 600) window.complexo3D.zoom(1);
    return window.complexo3D.inspect();
  });
  assert(stands.seatDetail.count > 0,'cadeiras sem detalhe no zoom');
  await capture(page,selector,`${name}-torcida-arquibancada`,{
    camera:stands.camera,target:stands.target,drawCalls:stands.drawCalls,triangles:stands.triangles,
    canvas:stands.canvas,seatDetail:stands.seatDetail,crowd:stands.crowd.total,
  });
}

async function arquibancada(page, name) {
  await page.goto(`${origin}/7a0-game-studio/qa-presidencia-humanos-20261016.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => window.qaHumans?.ready());
  const side = name === 'mobile' ? 'away' : 'home';
  let rigId;
  for (const phase of ['climbing','seated','stands'].filter(phase => phaseFilter.includes(phase))) {
    const state = await page.evaluate(options => window.qaHumans.show(options),{side,phase});
    const visit = state.visits.find(value => value.side === side);
    rigId ??= visit.rigId;
    assert.equal(visit.rigId,rigId,'mesmo corpo deve caminhar e sentar');
    assert.equal(visit.pose.phase,phase === 'stands' ? 'seated' : phase);
    checkPose(visit.pose,`${name}/${phase}`);
    finite([...state.camera,...state.target,...state.canvas],`${name}/${phase}`);
    assert.equal(state.invalidTransforms,0);
    assert.equal(state.facialParts,0,'corpo não deve conter olhos, nariz ou boca');
    assert(state.meshes > 0 && state.drawCalls > 0 && state.triangles > 0 && state.shadowMap);
    assert.deepEqual(visit.problems,[]);
    assert(state.crowd.reservations.includes(visit.seatId));
    assert(!state.crowd.seats.some(seat => seat.id === visit.seatId),'duplicou torcida na cadeira da visita');
    if (phase !== 'climbing') {
      assert.equal(visit.pose.seated,1);
      assert(visit.pose.feet.every(foot => foot.supported));
      assert(Math.abs(visit.pose.hip.y - (visit.pose.feet[0].position.y + .51)) < .03);
    }
    assert(state.seatDetail.count > 0,'cadeiras sem detalhe no zoom');
    await capture(page,'[data-humanos-stage]',`${name}-recorte-${phase}`,state);
  }
}

(async () => {
  fs.mkdirSync(output,{recursive:true});
  const browser = await loadDependency('playwright').chromium.launch(browserOptions());
  try {
    for (const device of devices) for (const [scene,run] of [['bairro',bairro],['arquibancada',arquibancada],['complexo',complexo]]) {
      if (!sceneFilter.includes(scene)) continue;
      const {name,...options} = device;
      const context = await browser.newContext({...options,locale:'pt-BR',reducedMotion:'reduce'});
      const page = await context.newPage(), errors = [];
      page.setDefaultTimeout(180_000);
      page.on('pageerror',error => errors.push(error.message));
      page.on('console',message => {if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text());});
      page.on('response',response => {if (response.status() >= 400 && response.url().startsWith(origin) && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`);});
      await page.route('**/*',route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
      try {
        await run(page,name);
        assert.deepEqual(errors,[],`${name}/${scene}: erros no navegador`);
        console.log(`PASS ${name}/${scene}: corpos de produção, chão/assentos reais, transformações finitas, sem erros de shader.`);
      } catch (error) {
        fs.writeFileSync(path.join(output,`${name}-${scene}-failure.json`),JSON.stringify({error:error.message,errors},null,2));
        await page.screenshot({path:path.join(output,`${name}-${scene}-failure.png`)}).catch(() => {});
        throw error;
      } finally {
        await context.close();
        fs.writeFileSync(path.join(output,`mapa-report-${sceneFilter.join('-')}-${deviceFilter.join('-')}.json`),JSON.stringify(reports,null,2));
      }
    }
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
