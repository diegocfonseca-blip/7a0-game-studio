import { chromium } from 'playwright-core'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [w,h,n] of [[390,760,'celular'],[1280,760,'pc']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto('file:///home/user/7a0-game-studio/scripts/teste-formacoes/campeao-mockup.html'); await p.waitForTimeout(1500)
  await p.screenshot({ path: `/home/user/7a0-game-studio/scripts/mockups/campeao-novo-${n}.png` })
}
await b.close()
