import { chromium } from 'playwright-core'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1280, height: 600 }, deviceScaleFactor: 2 })
await p.goto('file:///home/user/7a0-game-studio/scripts/teste-formacoes/campeao-roteiro.html'); await p.waitForTimeout(1500)
await p.screenshot({ path: '/home/user/7a0-game-studio/scripts/mockups/campeao-roteiro.png', fullPage: true })
await b.close()
