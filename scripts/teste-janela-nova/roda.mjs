// 🔬 roteiro da bancada da janela nova (21/11): Mercado → pôr à venda → virada → tela de Contratos / leilão direto.
// uso: S=<pasta das fotos> node scripts/teste-janela-nova/roda.mjs
import { chromium } from 'playwright-core'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const PORTA = 5325, S = process.env.S || '.'
const vite = await createServer({ server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] })
let falhas = 0
const ok = (c, m) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) falhas++ }
const abre = async (qs, w = 390, h = 820) => {
  const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: w, height: h }, hasTouch: w < 600, isMobile: w < 600 })
  const p = await ctx.newPage(); p.setDefaultTimeout(30000)
  p.on('pageerror', e => { falhas++; console.log('PAGEERR', e.message.slice(0, 300)) })
  await p.route('**/*', r => r.request().url().startsWith(`http://localhost:${PORTA}/`) || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:') ? r.continue() : r.abort())
  await p.addInitScript(() => { localStorage.setItem('bl_lang', 'pt') })
  await p.goto(`http://localhost:${PORTA}/scripts/teste-janela-nova/?${qs}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await p.waitForFunction(() => window.qaState, null, { timeout: 180000 })
  await p.waitForTimeout(2500)
  return p
}
const st = (p, f) => p.evaluate(f)
const vira = p => p.evaluate(() => window.qaDispatch({ type: 'OPEN_RESERVE_LIST', placements: window.qaState.careerPlacements, janelaNova: true }))
const semRolagem = p => st(p, () => document.documentElement.scrollWidth <= window.innerWidth + 1)

console.log('A) Mercado: pôr à venda (celular)')
{
  const p = await abre('janela=1&sn=3&venc=1')
  await p.getByRole('button', { name: /Mercado/ }).last().click(); await p.waitForTimeout(1500)
  const cx = p.locator('[data-mercado-venda]')
  ok(await cx.count() === 1, 'a caixa "📋 Pôr à venda" aparece no Mercado')
  await cx.getByRole('button', { name: /escolher no elenco/ }).click(); await p.waitForTimeout(400)
  await p.screenshot({ path: `${S}/jn-mercado-390.png`, fullPage: true })
  ok(await cx.getByText(/🔒/).count() > 0, 'quem está travado diz o porquê')
  await cx.getByRole('button', { name: /Vender/ }).first().click(); await p.waitForTimeout(400)
  ok((await st(p, () => window.qaState.aVendaMercado ?? [])).length === 1, 'tocar em Vender guarda a marca no save')
  ok(await semRolagem(p), 'sem rolagem de lado em 390 px')
  const olho = p.getByRole('button', { name: /👀 De olho/ }).first()
  if (await olho.count()) { await olho.click().catch(() => {}); await p.waitForTimeout(300) }
  console.log('   de olho:', JSON.stringify(await st(p, () => window.qaState.deOlho ?? null)))
  console.log('B) virada com contrato vencendo → tela de Contratos')
  await vira(p); await p.waitForTimeout(2500)
  ok(await st(p, () => window.qaState.screen) === 'reserveList', 'a temporada virou (tela reserveList)')
  ok(await p.locator('[data-janela-contratos]').count() === 1, 'abre a tela GRANDE de 📝 Contratos')
  ok(await p.getByText(/Sondar pro leilão|LISTAR PRA LEILÃO/i).count() === 0, 'sem Sondar e sem Listar nesta tela')
  const s1 = await st(p, () => ({ listados: window.qaState.reserveListed, marca: window.qaState.aVendaMercado ?? null, olho: window.qaState.deOlho ?? null, tec: window.qaState.aliciarTecnicos ?? [], jog: window.qaState.aliciarJogadores ?? [] }))
  console.log('   estado:', JSON.stringify(s1))
  ok(Object.values(s1.listados ?? {}).flat().length === 1, 'o marcado chegou listado pro leilão')
  ok(s1.marca === null && s1.olho === null, 'as marcas do Mercado foram consumidas')
  ok(await semRolagem(p), 'sem rolagem de lado em 390 px')
  await p.screenshot({ path: `${S}/jn-contratos-390.png`, fullPage: true })
  await p.locator('[data-contratos-ok]').click(); await p.waitForTimeout(2500)
  const tela = await st(p, () => window.qaState.screen)
  ok(tela !== 'reserveList', `o botão leva pro leilão (tela: ${tela})`)
  await p.context().close()
}
console.log('C) virada com contrato vencendo (computador, caixa no vermelho) + link pra janela de sempre')
{
  const p = await abre('janela=1&sn=3&venc=1&caixa=-50', 1280, 800)
  await vira(p); await p.waitForTimeout(2500)
  ok(await p.locator('[data-janela-contratos]').count() === 1, 'tela de Contratos no computador')
  console.log('   caixa na janela:', await st(p, () => window.qaState.careerCoins?.[window.qaState.managers[window.qaState.youIdx].id]))
  await p.screenshot({ path: `${S}/jn-contratos-1280.png`, fullPage: true })
  await p.locator('[data-abre-classico]').click(); await p.waitForTimeout(1500)
  ok(await p.locator('[data-janela-contratos]').count() === 0 && await p.getByText(/Começar o leilão/).count() >= 1, 'o link abre a janela de sempre (Sondar · Vender)')
  await p.context().close()
}
console.log('D) virada SEM contrato pra decidir → leilão direto')
{
  const p = await abre('janela=1&sn=3&venc=0')
  await vira(p); await p.waitForTimeout(3500)
  const tela = await st(p, () => window.qaState.screen)
  ok(tela !== 'reserveList' && tela !== 'season', `o leilão abriu sozinho (tela: ${tela})`)
  await p.context().close()
}
console.log('E) chave DESLIGADA → a janela de sempre')
{
  const p = await abre('sn=3&venc=1')
  await p.getByRole('button', { name: /Mercado/ }).last().click(); await p.waitForTimeout(1200)
  ok(await p.locator('[data-mercado-venda]').count() === 0, 'sem a caixa de venda no Mercado')
  await p.evaluate(() => window.qaDispatch({ type: 'OPEN_RESERVE_LIST', placements: window.qaState.careerPlacements })); await p.waitForTimeout(2500)
  ok(await p.locator('[data-janela-contratos]').count() === 0 && await p.locator('[data-janela-direto]').count() === 0, 'nenhuma tela nova')
  ok(await st(p, () => window.qaState.screen) === 'reserveList' && await p.getByText(/Começar o leilão/).count() >= 1, 'a janela de sempre, esperando o botão')
  await p.context().close()
}
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ bancada da janela nova: tudo certo')
await b.close(); await vite.close(); process.exit(falhas ? 1 : 0)
