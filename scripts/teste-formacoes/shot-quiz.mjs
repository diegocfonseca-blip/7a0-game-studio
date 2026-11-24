import { chromium } from 'playwright-core'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [w,h,n] of [[390,844,'celular'],[1280,720,'pc']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto('file:///home/user/7a0-game-studio/scripts/teste-formacoes/quiz-mockup.html'); await p.waitForTimeout(1500)
  await p.screenshot({ path: `/home/user/7a0-game-studio/scripts/mockups/espera-quem-e-a-lenda-${n}.png` })
}
await b.close()
