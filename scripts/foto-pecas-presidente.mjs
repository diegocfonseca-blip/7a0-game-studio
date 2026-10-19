// 📸 PEÇAS AVULSAS DO PRESIDENTE (19/10): o editor da Loja visto por (1) grátis sem nada, (2) grátis que já comprou a 1ª
// roupa (boneco careca) e (3) Craque olhando uma roupa de Lenda. O banco não responde aqui: finge plano e peças compradas.
//   node scripts/foto-pecas-presidente.mjs [--out pasta]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const OUT = arg('out', 'scripts/mockups'), PORTA = '5261'
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const casos = [
  { nome: 'gratis-sem-nada', tier: null, pecas: [], clica: null },
  { nome: 'gratis-com-roupa', tier: null, pecas: ['r-polo'], clica: 'CABELO' },
  { nome: 'craque-roupa-lenda', tier: 'prata', pecas: [], clica: 'Jaqueta de couro' },
]
for (const c of casos) {
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  await p.route('**/rpc/esc_meus_direitos**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await p.route('**/rpc/esc_minhas_pecas**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(c.pecas) }))
  await p.route('**/esc_presidente?**', r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{
    const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const A = await import('/src/escalacao/apoio.tsx')
    A._bancadaApoio('foto@teste.com', ${JSON.stringify(c.tier ?? 'bege')}); A.recarregaDireitos()
    const C = await import('/src/escalacao/presidente-conta.ts'); await C.recarregarMinhasPecas()
    await new Promise(r=>setTimeout(r,600))
    const L = await import('/src/escalacao/presidente-loja.tsx')
    document.getElementById('root')?.remove()
    const root=document.createElement('div'); root.style.cssText='padding:12px;background:#F4ECD6;min-height:100vh'; document.body.appendChild(root)
    createRoot(root).render(h(L.MeuPresidenteLoja,{}))
    await new Promise(r=>setTimeout(r,900))
  })()`)
  await p.screenshot({ path: `${OUT}/pecas-${c.nome}-cartao.png` })
  await p.getByRole('button', { name: /MONTAR|CRIAR|EDITAR/ }).first().click(); await p.waitForTimeout(1500)
  if (c.clica) { await p.getByRole('button', { name: new RegExp(c.clica, 'i') }).first().click().catch(e => console.log('não achei', c.clica, e.message.slice(0, 80))); await p.waitForTimeout(600) }
  if (c.nome === 'gratis-com-roupa') { await p.locator('.pb-options button').nth(1).click().catch(() => {}); await p.waitForTimeout(600) }
  await p.screenshot({ path: `${OUT}/pecas-${c.nome}.png`, fullPage: true })
  const caixa = p.getByText(/Ainda não é seu|Compre sua primeira roupa/).first()
  if (await caixa.count()) { await caixa.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -200)); await p.waitForTimeout(300) }
  const comprar = p.getByRole('button', { name: /COMPRAR ·/ }).first()
  if (await comprar.count()) { await comprar.click(); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/pecas-${c.nome}-pix.png` }) }
  console.log('📸', c.nome); await ctx.close()
}
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
