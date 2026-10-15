const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadDependency, browserOptions} = require('./presidencia-runtime.cjs');

// Run against the local Vite server. This fixture never reads an account or writes a save.
const origin = 'http://127.0.0.1:4196';
const fixtureName = `qa-complexo-publico-lifecycle-${process.pid}.html`;
const fixture = path.resolve(fixtureName);
const html = `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f4ecd6}#root{max-width:1280px;margin:auto}</style></head><body><div id="root"></div><script type="module">
import React from 'react';
import {createRoot} from 'react-dom/client';
import Complexo from './src/escalacao/presidencia-complexo-3d.tsx';
import {STADIUM_SECTORS,STADIUM_EXTRAS} from './src/escalacao/estadiodata.ts';
import {PAVIMENTACAO_ESTADIO} from './src/escalacao/presidencia-estadio-projeto.ts';
import {publicoDoEstadio} from './src/escalacao/presidencia-estadio-publico.ts';
const stadium={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS,PAVIMENTACAO_ESTADIO].map(e=>e.k)};
const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:side+i,pos}));
const match={context:{id:'population-lifecycle-local',home:team('h'),away:team('a'),speed:1},minute:20,homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f',visualClock:{seconds:14,sampledAt:performance.now(),running:false,rate:1}};
window.lifecycleCallbacks=[];window.lifecycleRevision=0;
const root=createRoot(document.getElementById('root'));window.unmountLifecycle=()=>root.unmount();
function App(){
 const [population,setPopulation]=React.useState({circulation:true,qaPopulation:true});
 window.setLifecyclePopulation=patch=>setPopulation(old=>({...old,...patch}));
 React.useEffect(()=>{window.lifecycleRevision++},[population]);
 window.lifecycleExpected=()=>({home:population.day?publicoDoEstadio(stadium,population.day):undefined,away:population.day&&population.awayDay?publicoDoEstadio(stadium,population.awayDay):undefined});
 return React.createElement(Complexo,{stadium,match,awayStadium:stadium,...population,onReady:api=>{window.lifecycleApi=api;window.lifecycleCallbacks.push(api?'ready':'disposed')}});
}
root.render(React.createElement(App));
</script></body></html>`;

const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const inspect = page => page.evaluate(() => window.lifecycleApi.inspect());
async function patch(page, value) {
  const before = await page.evaluate(value => {
    const previous = window.lifecycleRevision;
    window.setLifecyclePopulation(value);
    return previous;
  }, value);
  await page.waitForFunction(previous => window.lifecycleRevision > previous, before);
  await frames(page);
  return inspect(page);
}
async function stable(page, previous, label) {
  const result = await page.evaluate(() => ({
    sameApi: window.lifecycleApi === window.lifecycleOriginalApi,
    sameCanvas: document.querySelector('[data-complexo-3d] canvas') === window.lifecycleOriginalCanvas,
    canvases: document.querySelectorAll('[data-complexo-3d] canvas').length,
    callbacks: window.lifecycleCallbacks,
    state: window.lifecycleApi.inspect(),
  }));
  assert(result.sameApi && result.sameCanvas, `${label}: público recriou o mundo/canvas/API`);
  assert.equal(result.canvases, 1, `${label}: mais de um renderer`);
  assert.deepEqual(result.callbacks, ['ready'], `${label}: lifecycle da cena foi reiniciado`);
  for (const key of ['camera', 'target', 'view', 'cameraFov', 'architecture', 'establishments']) {
    assert.deepEqual(result.state[key], previous[key], `${label}: ${key} alterado pela população`);
  }
  assert.equal(result.state.match.time, previous.match.time, `${label}: relógio da partida foi reiniciado`);
  assert.equal(result.state.crowd.instanceRebuilds, 0, `${label}: instâncias da arquibancada foram recriadas`);
  if (result.state.circulation) assert.equal(result.state.circulation.seconds, 43.75, `${label}: passeio voltou ao início`);
  for(const visitor of result.state.visits){
    assert.equal(visitor.seconds,43.75,`${label}: relógio da visita reiniciado`);
    assert(result.state.crowd.reservations.includes(visitor.seatId));
    assert(!result.state.crowd.seats.some(seat=>seat.id===visitor.seatId),`${label}: pessoa estática duplicada na cadeira reservada`);
  }
  assert.equal(result.state.crowd.reservations.length,result.state.visits.length);
  assert(result.state.crowd.total+result.state.visits.length<=result.state.crowd.sampleLimit);
  const pause = page.getByRole('button', {name: 'Retomar passeio', exact: true});
  if (await pause.count()) assert.equal(await pause.getAttribute('aria-pressed'), 'true', `${label}: pausa perdida`);
  return result.state;
}
function fans(state, side) {return [...(state.circulation?.fans??[]),...state.visits].filter(fan => fan.side === side);}

(async () => {
  // Exclusive create + finally cleanup avoid overwriting or keeping a permanent QA page.
  fs.writeFileSync(fixture, html, {flag: 'wx'});
  let browser;
  try {
    browser = await loadDependency('playwright').chromium.launch(browserOptions());
    const context = await browser.newContext({viewport: {width: 1280, height: 960}, reducedMotion: 'reduce', locale: 'pt-BR'});
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(90_000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if (message.type() === 'error' && /WebGL|THREE|shader|NaN/i.test(message.text())) errors.push(message.text());});
    await page.route('**/*', route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
    await page.goto(`${origin}/7a0-game-studio/${fixtureName}`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.lifecycleApi?.inspect().match.players === 22);
    await page.getByRole('button', {name: 'Pausar passeio', exact: true}).click();
    await page.getByRole('button', {name: 'Arquibancada', exact: true}).click();
    const stands = await inspect(page);
    const focused = stands.crowd.seats.find(seat => seat.id === stands.focusedSeat);
    assert(focused, 'aproximação deve mirar um assento real ocupado');
    const near = (a, b) => Math.abs(a - b) < 1e-7;
    assert(near(stands.target[0], focused.position.x) && near(stands.target[1], focused.position.y + 1) && near(stands.target[2], focused.position.z));
    assert(near(stands.camera[0], focused.position.x + Math.sin(focused.heading) * 8) && near(stands.camera[1], focused.position.y + 3) && near(stands.camera[2], focused.position.z + Math.cos(focused.heading) * 8), 'câmera da arquibancada segue posição/heading do assento');
    await page.evaluate(() => {
      window.lifecycleOriginalApi = window.lifecycleApi;
      window.lifecycleOriginalCanvas = document.querySelector('[data-complexo-3d] canvas');
      window.lifecycleApi.view('office');window.lifecycleApi.seekCirculation(43.75);
    });
    await frames(page);
    const baseline = await inspect(page);
    assert.equal(baseline.circulation.mode, 'qa-sample');
    assert.equal(baseline.populationRebuilds, 1);
    assert.equal(baseline.crowd.mode, 'qa-sample');
    assert(baseline.crowd.total > 0 && baseline.crowd.total <= baseline.crowd.sampleLimit);
    assert.equal(fans(baseline, 'home').length, 1);
    assert.equal(fans(baseline, 'away').length, 1);

    await patch(page, {qaPopulation: false, day: {division: 'A', support: 80, match: 'playing'}, awayDay: {division: 'A', support: 80, match: 'idle'}});
    let state = await stable(page, baseline, 'QA → carreira');
    let expected = await page.evaluate(() => window.lifecycleExpected());
    assert.equal(state.populationRebuilds, 2);
    assert.equal(state.circulation.mode, 'career');
    assert.equal(fans(state, 'home').length, 1, 'uma visita contínua por acesso construído');
    assert.equal(state.circulation.fans.length,0,'não sobrepor percurso antigo à visita contínua');
    assert.equal(fans(state, 'away').length, 0, 'visitantes não aparecem antes da partida deles');
    assert.deepEqual(state.circulation.attendance, expected.home);
    assert.equal(state.crowd.mode, 'career');
    assert(state.crowd.home > 0);
    assert.equal(state.crowd.away, 0);

    const rebuilds = state.populationRebuilds;
    await patch(page, {day: {division: 'A', support: 81, rain: true, match: 'playing'}, awayDay: {division: 'A', support: 81, match: 'idle'}});
    state = await stable(page, baseline, 'mesmas contagens, novo apoio/clima');
    expected = await page.evaluate(() => window.lifecycleExpected());
    assert.equal(state.populationRebuilds, rebuilds, 'percursos recalculados sem mudança na quantidade');
    assert.deepEqual(state.circulation.attendance, expected.home, 'inspeção deve receber os dados novos sem recriar atores');
    assert.deepEqual(state.circulation.awayAttendance, expected.away);
    assert.deepEqual(state.crowd.attendance, expected.home);
    const matrixUpdates = state.crowd.matrixUpdates;
    await patch(page, {day: {division: 'A', support: 81, rain: false, match: 'playing'}});
    state = await stable(page, baseline, 'mesma ocupação sob cobertura');
    assert.equal(state.populationRebuilds, rebuilds);
    assert.equal(state.crowd.matrixUpdates, matrixUpdates, 'sem mudança na ocupação, matrizes não devem ser reenviadas');

    await patch(page, {awayDay: {division: 'A', support: 81, match: 'playing'}});
    state = await stable(page, baseline, 'chegada dos visitantes');
    expected = await page.evaluate(() => window.lifecycleExpected());
    assert.equal(state.populationRebuilds, rebuilds + 1);
    assert.equal(fans(state, 'away').length, 1, 'uma cadeira reservada no acesso visitante');
    assert(fans(state, 'away').every(fan => fan.source === 'career'));
    assert(state.crowd.away > 0);

    await patch(page, {circulation: false});
    state = await stable(page, baseline, 'circulação desligada');
    assert.equal(state.circulation, undefined);
    assert.equal(state.visits.length,0);
    assert.equal(state.crowd.reservations.length,0);
    assert.equal(state.populationRebuilds, rebuilds + 1);
    await patch(page, {circulation: true});
    state = await stable(page, baseline, 'circulação religada');
    assert.equal(state.populationRebuilds, rebuilds + 2);
    assert.equal(state.circulation.seconds, 43.75);

    await patch(page, {awayDay: null});
    state = await stable(page, baseline, 'visitante sem dados');
    assert.equal(fans(state, 'away').length, 0, 'ausência de dados não habilita visitantes QA');
    assert.equal(state.circulation.awayAttendance, undefined);
    assert.equal(state.crowd.away, 0);

    await patch(page, {day: null});
    state = await stable(page, baseline, 'carreira sem dados');
    assert.equal(state.circulation, undefined, 'ausência de dados não pode usar população QA implícita');
    assert.equal(state.crowd.mode, 'off');
    assert.equal(state.crowd.total, 0, 'arquibancada sem dados não fabrica torcida');

    await patch(page, {qaPopulation: true});
    state = await stable(page, baseline, 'amostra QA explicitamente ligada');
    assert.equal(state.circulation.mode, 'qa-sample');
    assert.equal(state.circulation.seconds, 43.75);
    await page.evaluate(() => window.unmountLifecycle());
    await frames(page);
    assert.deepEqual(await page.evaluate(() => window.lifecycleCallbacks), ['ready', 'disposed']);
    assert.equal(await page.locator('[data-complexo-3d] canvas').count(), 0, 'canvas removido no unmount');
    assert.deepEqual(errors, []);
    console.log('PASS lifecycle da população: canvas/câmera/relógios/pausa preservados; percursos somente quando a amostra muda; QA explícito e cleanup.');
    await context.close();
  } finally {
    if (browser) await browser.close();
    fs.unlinkSync(fixture);
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
