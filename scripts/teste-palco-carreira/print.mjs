import { chromium } from 'playwright-core'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 412, height: 620 }, deviceScaleFactor: 2 })
const out = '/tmp/claude-0/-home-user-7a0-game-studio/eff68882-b963-5eee-b2bb-3ea2ad04e5b9/scratchpad'
for (const copa of ['0', '1']) {
  await p.goto(`http://localhost:5261/scripts/teste-palco-carreira/index.html?copa=${copa}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${out}/palco-${copa === '1' ? 'copa' : 'liga'}.png` })
}
await b.close(); console.log('ok')
