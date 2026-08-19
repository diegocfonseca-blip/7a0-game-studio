#!/usr/bin/env node
// tira o print da carta. Precisa do vite rodando: npx vite --port 5199
//   node scripts/carta/print.mjs --nome "Quincy Promes" --saida /tmp/carta.png
import { chromium } from 'playwright-core'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const nome = arg('nome', 'Quincy Promes')
const saida = arg('saida', 'carta.png')
const porta = arg('porta', '5199')
const br = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] })
const pg = await (await br.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 3 })).newPage()
await pg.goto(`http://localhost:${porta}/7a0-game-studio/scripts/carta/?nome=${encodeURIComponent(nome)}`, { waitUntil: 'networkidle' })
await pg.waitForTimeout(2500)
await pg.locator('#r > div').screenshot({ path: saida })
await br.close()
console.log(`${saida} · carta de ${nome}`)
