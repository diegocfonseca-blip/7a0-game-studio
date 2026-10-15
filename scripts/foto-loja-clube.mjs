// 📸 Loja do Clube REAL (14/10): botão na home + loja vista por Craque e por Batismo. node scripts/foto-loja-clube.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const PORTA = '5259'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
// 1) a home no celular, com o botão
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  await p.getByText('LEILÃO LEGENDS 38').first().click().catch(() => {}); await p.waitForTimeout(2500)
  await p.screenshot({ path: 'scripts/mockups/loja-home-real.png', fullPage: true }); await ctx.close()
}
// 2) a loja por plano (o banco não responde aqui: finge os direitos)
for (const [nome, direitos] of [['craque', null], ['batismo', { batismo_plano: 'antigo', tier: 'ouro' }]]) {
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  await p.route('**/rpc/esc_meus_direitos**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(direitos ?? {}) }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const A = await import('/src/escalacao/apoio.tsx')
    A._bancadaApoio('foto@teste.com', ${JSON.stringify(nome === 'craque' ? 'prata' : 'ouro')}); A.recarregaDireitos(); await new Promise(r=>setTimeout(r,800))
    const L = await import('/src/escalacao/loja-clube.tsx')
    document.getElementById('root')?.remove()
    const root=document.createElement('div'); document.body.appendChild(root)
    createRoot(root).render(h(L.LojaButton,{}))
    await new Promise(r=>setTimeout(r,800)); document.querySelector('button')?.click()
    await new Promise(r=>setTimeout(r,2500))
  })()`)
  await p.screenshot({ path: `scripts/mockups/loja-real-${nome}.png`, fullPage: true })
  console.log('📸', nome); await ctx.close()
}
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
