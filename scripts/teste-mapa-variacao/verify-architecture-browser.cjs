// Capturas da arquitetura real, na mesma câmera. Sem conta, save ou serviços externos.
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright-core');
const base = process.env.MAPA_BASE || 'http://127.0.0.1:5340';
const out = process.env.MAPA_OUTPUT || '/workspace/shared/mapa-arquitetura-cobertura';
const label = process.argv[2] || 'depois';
const repo = path.resolve(__dirname, '../..');
const backend = fs.readFileSync(repo + '/scripts/teste-classificacao/verify.cjs', 'utf8').match(/const backend = `([\s\S]*?)`;/)[1];
fs.mkdirSync(out, {recursive:true});
(async () => {
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try {
  const page = await browser.newPage({viewport:{width:1280,height:950},locale:'pt-BR'}), errors = [], samples = [];
  page.setDefaultTimeout(120000);
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('pc3-qualidade-v1','alta'));
  await page.route('**/*', r => r.request().url().startsWith(base + '/') ? r.continue() : r.abort());
  await page.route('**/src/lib/supabase.ts*', r => r.fulfill({contentType:'text/javascript',body:backend}));
  await page.route('**/src/escalacao/presidencia-mapa-qualidade.ts*', async r => {
   const response = await r.fetch();
   const body = (await response.text()).replace(/(ABRIR_LENTO_MS\s*=\s*)[\de.+-]+/, '$1 1e9').replace(/(ENGASGO_MS\s*=\s*)[\de.+-]+/, '$1 1e9');
   await r.fulfill({response,body});
  });
  // Inspeciona as peças antes do agrupamento; a geometria/renderização não muda.
  await page.route('**/src/escalacao/presidencia-complexo-entorno.ts*', async r => {
   const response = await r.fetch();
   const body = (await response.text()).replace(/const parts = root.children.filter/, `root.userData.landscape.qaPieces = root.children.filter(p => p.isMesh && /^bairro-(residencia|muro|portao|sacada|cornija)/.test(p.name)).map(p => ({name:p.name,position:p.position.toArray(),size:[p.geometry.parameters?.width,p.geometry.parameters?.height,p.geometry.parameters?.depth],angle:p.rotation.y}));
   root.userData.landscape.qaSolids = solids.filter(s => /^bairro-(muro|portao)/.test(s.id));
   const parts = root.children.filter`);
   await r.fulfill({response,body});
  });
  // Isola arquitetura: nenhum NPC muda de lugar entre as duas capturas.
  await page.route('**/qa-presidencia-complexo-3d.html*', async r => {
   const response = await r.fetch();
   await r.fulfill({response,body:(await response.text()).replaceAll('qaPopulation:true','qaPopulation:false,circulation:false')});
  });
  await page.goto(base + '/7a0-game-studio/qa-presidencia-complexo-3d.html?reviewClub');
  await page.waitForFunction(() => !!window.complexo3D, undefined, {timeout:240000});
  console.log(label, 'cena pronta');
  const el = page.locator('[data-complexo-3d]');
  await el.evaluate(el => el.scrollIntoView());
  for (const [name,target,camera] of [
   ['geral',null,null],
   ['rua',[119,3,222],[140,23,258]],
   ['bairro-afastado',[-201,3,-331],[-166,30,-292]],
   ...(label==='antes'?[]:[['celular',[119,3,222],[140,23,258]]]),
  ]) {
   if(name==='celular')await page.setViewportSize({width:393,height:852});
   if (target) await page.evaluate(({target,camera}) => window.complexo3D.qaOlhar(target,camera), {target,camera});
   await page.waitForTimeout(1200);
   await el.screenshot({path:out+'/'+label+'-'+name+'.png',timeout:120000});
   const s = await page.evaluate(() => window.complexo3D.inspect());
   samples.push({name,camera:s.camera,target:s.target,landscape:s.landscape,drawCalls:s.drawCalls,triangles:s.triangles,memory:s.memory,quality:s.quality,residentRoutes:{routes:s.residents.routes,journeys:s.residents.purposefulJourneys,gatherings:s.residents.gatherings,rejections:s.residents.rejections}});
   console.log(label, name, s.drawCalls, s.triangles);
  }
  fs.writeFileSync(out+'/'+label+'.json',JSON.stringify({label,fixture:'local completo, circulação desativada',softwareRenderer:true,errors,samples},null,2));
  if(errors.length)throw Error(errors.join('\n'));
 } finally {await browser.close()}
})().catch(e => {console.error(e);process.exitCode=1});
