// 📸 PRINT DA ARTE DE COMPARTILHAR O ELENCO (a imagem que o jogador posta).
// Sobe a bancada `scripts/teste-share/` e salva a arte desenhada. É canvas: o
// build não enxerga erro nenhum aqui, então a única prova é desenhar.
// Antes: DEPLOY_BASE=/ npx vite --port 5199
// Rodar:  node scripts/print-share.mjs [--porta 5199] [--saida /tmp]
import { chromium } from 'playwright-core'
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5199'), SAIDA = arg('saida', '/tmp')
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 620, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ } })
const erros = []
p.on('pageerror', e => erros.push(String(e)))
await p.goto(`http://localhost:${PORTA}/scripts/teste-share/`, { waitUntil: 'domcontentloaded' })
await p.waitForSelector('#arte, pre', { timeout: 30000 })
await p.waitForTimeout(600)
const falhou = await p.$('pre')
if (falhou) { console.error('❌ a arte QUEBROU:\n' + (await falhou.innerText())); await b.close(); process.exit(1) }
const arte = await p.$('#arte')
await arte.screenshot({ path: `${SAIDA}/share-elenco.png` })
console.log(`${SAIDA}/share-elenco.png`, erros.length ? `⚠️ erros: ${erros.join(' | ')}` : '· sem erro no console')
await b.close()
