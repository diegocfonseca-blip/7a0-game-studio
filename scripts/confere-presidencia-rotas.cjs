// Inspeção local sobre a arte real. Requer Vite na porta 4196.
// --clean captura a cena sem as linhas de diagnóstico.
const path = require('node:path');
const fs = require('node:fs');
const {chromium} = require('./presidencia-runtime.cjs').loadDependency('playwright');
const base = 'http://127.0.0.1:4196/7a0-game-studio/';
const clean = process.argv.includes('--clean');
const output = path.resolve(__dirname, '../test-results/mapa-browser');

(async () => {
 fs.mkdirSync(output, {recursive:true});
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium', headless:true, args:['--no-sandbox']});
 try {
  const page = await browser.newPage({viewport:{width:1800,height:1400}, deviceScaleFactor:2, locale:'pt-BR'});
  await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  await page.goto(base + 'qa-presidencia-mapa.html');
  await page.waitForFunction(() => !!window.renderScene);
  await page.evaluate(() => window.renderScene({
   inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},
   ext:['asfalto','hotel','loja','chopp','praca','estacao','estac','cober'],
  }));
  await page.waitForFunction(() => document.querySelector('[aria-busy="false"]'));
  await page.evaluate(() => {
   document.querySelector('main').style.maxWidth = '1536px';
   document.querySelector('.pe-map-viewport').style.height = '1024px';
  });
  await page.waitForTimeout(150);
  await page.evaluate(async clean => {
   Object.assign(document.querySelector('.pe-map-world').style, {
    width:'1536px',height:'1024px',left:'0',top:'0',transform:'none',
   });
   if (clean) return;
   const {ROTAS_ESTADIO} = await import('/7a0-game-studio/src/escalacao/presidencia-estadio-mapa-model.ts');
   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
   svg.setAttribute('viewBox', '0 0 1536 1024');
   svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:30000;pointer-events:none';
   for (const key of ['sidewalk','roadOut','roadBack','shop','food','beer','hotel','station','parking','entrance']) {
    const line = document.createElementNS(svg.namespaceURI, 'polyline');
    line.setAttribute('points', ROTAS_ESTADIO[key].points.map(p => p.x+','+p.y).join(' '));
    line.setAttribute('stroke', key.startsWith('road') ? '#00ffff' : '#ff00ff');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('fill', 'none');
    svg.append(line);
   }
   document.querySelector('.pe-territory').append(svg);
  }, clean);
  await page.waitForTimeout(800);
  const box = await page.locator('.pe-territory').boundingBox();
  for (const [name,x,y,width,height] of [
   ['calcada-leste',1210,710,120,110], ['direita',1100,350,400,440], ['frente',620,760,450,180],
   ['hotel',180,500,340,230], ['estacao',1140,240,396,200],
  ]) {
   await page.screenshot({path:path.join(output, `rotas-${name}${clean?'-cena':''}.png`), clip:{x:box.x+x,y:box.y+y,width,height}});
  }
  console.log('Capturas locais dos acessos: ' + output + '. Identidade simulada; rede externa bloqueada.');
 } finally {
  await browser.close();
 }
})().catch(error => {console.error(error);process.exitCode=1;});
