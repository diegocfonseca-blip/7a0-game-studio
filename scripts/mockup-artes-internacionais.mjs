import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const assets = readdirSync('dist/assets')
const font = readFileSync('dist/assets/' + assets.find(name => name.startsWith('oswald-latin-700') && name.endsWith('.woff2'))).toString('base64')
const image = name => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${name}`).toString('base64')}`
const lib = image('online-liberta-v25.webp')
const champ = image('online-champions-v25.webp')
const myCrest = image('neymarzetti-escudo.webp')
const flamengoCrest = `data:image/webp;base64,${readFileSync('public/escudos-clubes/flamengo.webp').toString('base64')}`
const madridCrest = `data:image/webp;base64,${readFileSync('public/escudos-clubes/real-madrid.webp').toString('base64')}`
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:700}
*{box-sizing:border-box}body{margin:0;background:#f4ecd6;color:#0c0c0c;font-family:Arial,sans-serif;padding:30px 34px 34px;width:1100px}
.head{font:700 17px Oswald;letter-spacing:1.2px;text-align:center;margin:0 0 16px}.list{display:grid;gap:20px}
.art{height:450px;position:relative;overflow:hidden;border:4px solid #0c0c0c;border-radius:22px;box-shadow:7px 7px 0 #0c0c0c;background-size:cover;background-position:center}
.art.lib{background-image:linear-gradient(90deg,rgba(1,15,10,.93) 0%,rgba(1,15,10,.74) 37%,rgba(1,15,10,.03) 74%),url('${lib}')}
.art.champ{background-image:linear-gradient(90deg,rgba(3,12,37,.94) 0%,rgba(4,18,52,.8) 40%,rgba(3,12,37,.03) 75%),url('${champ}')}
.art:after{content:'';position:absolute;inset:auto 0 0;height:95px;background:linear-gradient(transparent,rgba(0,0,0,.53));pointer-events:none}
.label{position:absolute;top:24px;left:30px;font:700 14px Oswald;letter-spacing:2px;color:#f5ecd4;border:2px solid currentColor;border-radius:999px;padding:5px 12px}
.content{position:absolute;left:32px;top:100px;max-width:560px;text-shadow:0 3px 8px #000}
.kicker{font:700 18px Oswald;letter-spacing:2.2px;color:#ffc400}.champ .kicker{color:#a9cbff}
h1{font:700 54px/1.02 Oswald;margin:8px 0 13px;color:#fff;text-transform:uppercase;letter-spacing:.8px}
p{font-size:19px;color:#eee;margin:0;max-width:410px;line-height:1.28}
.identity{position:absolute;bottom:16px;left:32px;right:28px;z-index:1;display:flex;gap:12px;align-items:center;color:#fff;font:700 14px Oswald;letter-spacing:.8px}
.identity img.main-crest{width:65px;height:65px;object-fit:contain}.identity img.partner-crest{width:37px;height:37px;object-fit:contain}.partner{display:flex;align-items:center;gap:8px}
.club{font-size:20px;color:#ffc400}.champ .club{color:#b7d4ff}.tiny{font-size:12px;color:#fff;opacity:.88}.bar{width:3px;height:32px;background:#fff9;align-self:center}
</style></head><body><div class="head">MODO CARREIRA · TEMPORADA 40+ · CONCEITO DAS ARTES</div><main class="list">
<section class="art lib"><div class="label">SUL-AMÉRICA · CAMPANHA DE CLUBES</div><div class="content"><div class="kicker">CONMEBOL</div><h1>LIBERTADORES</h1><p>O continente inteiro no seu caminho até a taça.</p></div><div class="identity"><img class="main-crest" src="${myCrest}"><span class="club">NEYMARZETTY FC</span><span class="bar"></span><span class="partner"><img class="partner-crest" src="${flamengoCrest}"><span>REPRESENTANDO FLAMENGO<br><span class="tiny">Seu escudo e mascote permanecem</span></span></span></div></section>
<section class="art champ"><div class="label">EUROPA · CAMPANHA DE CLUBES</div><div class="content"><div class="kicker">UEFA</div><h1>CHAMPIONS<br>LEAGUE</h1><p>O grande palco europeu recebe a sua história.</p></div><div class="identity"><img class="main-crest" src="${myCrest}"><span class="club">NEYMARZETTY FC</span><span class="bar"></span><span class="partner"><img class="partner-crest" src="${madridCrest}"><span>REPRESENTANDO REAL MADRID<br><span class="tiny">Seu escudo e mascote permanecem</span></span></span></div></section>
</main></body></html>`
mkdirSync('docs/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1020 }, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  await page.screenshot({ path: 'docs/mockups/artes-libertadores-champions.png', fullPage: true })
  console.log('docs/mockups/artes-libertadores-champions.png')
} finally { await browser.close() }
