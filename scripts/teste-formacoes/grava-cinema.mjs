import { chromium } from 'playwright-core'
import fs from 'node:fs'
const out = '/tmp/claude-0/video'; fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, qs] of [['com', ''], ['sem', '?sem=1']]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, recordVideo: { dir: out, size: { width: 390, height: 760 } } })
  const p = await ctx.newPage()
  await p.goto('file:///home/user/7a0-game-studio/scripts/teste-formacoes/campeao-cinema.html' + qs)
  await p.waitForTimeout(9400)
  const v = p.video(); await ctx.close()
  fs.renameSync(await v.path(), `${out}/cine-${nome}.webm`)
}
await b.close()
