// 📱 22/11: antes e depois do quadro do jogo 3D no celular (hoje ~88% da altura da tela; proposta: mais baixo durante o jogo).
// uso: S=<pasta> [ALT="62svh"] node scripts/mapa3d/print-altura-jogo.mjs
import { chromium } from 'playwright-core'
const S = process.env.S || '.', ALT = process.env.ALT || '62svh'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: 5322, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 390, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
const p = await ctx.newPage(); p.setDefaultTimeout(30000)
p.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 200)))
await p.route('**/*', r => r.request().url().startsWith('http://localhost:5322/') || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt') })
await p.goto('http://localhost:5322/scripts/teste-partida-oficial-3d/?round=9&speed=4', { waitUntil: 'domcontentloaded', timeout: 120000 })
await p.waitForFunction(() => window.qaState, null, { timeout: 180000 })
const skipPress = async () => { const x = p.getByRole('button', { name: /Pular a coletiva/i }); if (await x.count()) await x.first().click().catch(() => {}) }
await p.getByRole('button', { name: 'Jogos + Tabela', exact: true }).last().click(); await p.waitForTimeout(36000); await skipPress()
await p.getByRole('button', { name: 'Central', exact: true }).last().click()
const choice = p.getByRole('button', { name: /Campo 3D|3D/ }).first(), skip = p.getByRole('button', { name: /Pular pro jogo|Seguir/i })
for (let i = 0; i < 40 && !await choice.count(); i++) { await skipPress(); if (await skip.count()) await skip.first().click().catch(() => {}); await p.waitForTimeout(900) }
await choice.click(); const start = p.getByRole('button', { name: '▶ Começar o jogo', exact: true })
await start.waitFor({ state: 'visible', timeout: 240000 }); await start.click()
await p.waitForFunction(() => window.qaMatch?.minute > 3, null, { timeout: 180000 })
await p.evaluate(() => document.querySelector('[data-voltar-central]')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(1200)
console.log('assistindo:', await p.evaluate(() => document.querySelector('.pc3-review')?.getAttribute('data-watching-match')), 'altura hoje:', await p.evaluate(() => document.querySelector('.pc3-stage')?.clientHeight))
await p.screenshot({ path: S + '/jogo3d-altura-antes.png' })
await p.addStyleTag({ content: `.pc3-review[data-watching-match=true]:not(.pc3-expanded) .pc3-stage{height:min(${ALT},125vw)!important;min-height:0!important}` })
await p.waitForTimeout(2500)
console.log('altura proposta:', await p.evaluate(() => document.querySelector('.pc3-stage')?.clientHeight))
await p.evaluate(() => document.querySelector('[data-voltar-central]')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(800)
await p.screenshot({ path: S + '/jogo3d-altura-depois.png' })

// 🧭 MOCKUP (só nesta bancada): fileira de atalhos logo embaixo do campo, com bolinha vermelha onde tem o que fazer
await p.evaluate(() => {
  const st = document.querySelector('.pc3-stage'); if (!st) return
  const d = document.createElement('div')
  d.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:10px 0 4px'
  const it = [['🏗️','Obras',1],['💰','Dinheiro',0],['🤝','Contratos',1],['🛍️','Loja',0],['🕴️','Agência',0]]
  d.innerHTML = it.map(([e,n,b]) => `<div style="position:relative;background:#fff;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #000;padding:7px 2px 6px;text-align:center;font-family:Oswald,sans-serif;font-weight:800;font-size:11px;text-transform:uppercase;color:#0C0C0C"><div style="font-size:19px;line-height:1.1">${e}</div>${n}${b?'<span style="position:absolute;top:-7px;right:-5px;width:15px;height:15px;border-radius:50%;background:#E8503A;border:2px solid #0C0C0C"></span>':''}</div>`).join('')
  st.after(d)
  const f = document.createElement('div')
  f.style.cssText = 'margin:8px 0 2px;background:#FFC400;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #000;padding:8px 10px;font-family:Oswald,sans-serif;font-weight:800;font-size:13px;color:#0C0C0C'
  f.textContent = '🏗️ Seu estádio está 0% pronto · toque em OBRAS pra melhorar ›'
  d.after(f)
})
await p.waitForTimeout(600)
await p.screenshot({ path: S + '/jogo3d-altura-atalhos.png' })
await b.close(); await vite.close()
