// ─── 🔻 FOTO DO LEILÃO HOLANDÊS (pro Diego aprovar antes de commitar) ──────
//
// Não é desenho: isto abre o JOGO DE VERDADE em modo holandês, joga pela tela
// (como qualquer jogador faria) e fotografa o pregão caindo. É exatamente o que
// ele vai ver no celular.
//
// uso: node scripts/mockup-holandes.mjs [--porta 5242]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5242')
const SAIDA = 'mockups'
mkdirSync(SAIDA, { recursive: true })

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1800)

const tira = async (nome, legenda) => {
  await p.screenshot({ path: `${SAIDA}/${nome}.png`, fullPage: true })
  console.log(`   📸 ${SAIDA}/${nome}.png — ${legenda}`)
}
// clica num BOTÃO pelo texto (o jogo é todo de botão). `force` porque a faixa
// de "nova versão" às vezes cobre o topo no navegador de teste.
const clica = async (txt, espera = 500) => {
  const el = p.locator('button', { hasText: txt }).first()
  if (!(await el.count())) return false
  await el.click({ timeout: 5000, force: true }).catch(() => {})
  await p.waitForTimeout(espera)
  return true
}

// 1) escolhe o jogo do leilão, fecha a faixa de versão, põe em PT e abre o rápido
await clica('LEILÃO LEGENDS 38', 1400)
await clica('✕', 400)
await clica('BR', 800)
await clica('PARTIDA RÁPIDA', 1400)
await clica('Holandês', 500)
await tira('holandes-0-escolha', 'a escolha do modo, na tela de começar o jogo rápido')

// 2) nome do time → avança até o pregão abrir
await p.locator('input').first().fill('Neymarzetti').catch(() => {})
await p.waitForTimeout(300)
for (let i = 0; i < 6; i++) {
  if (await p.locator('text=Preço agora').count()) break
  if (!(await clica('AVANÇAR', 1600)) && !(await clica('COMEÇAR', 1600)) && !(await clica('Entendi', 700)) && !(await clica('PULAR', 700))) break
}
await p.waitForTimeout(1500)

// 3) o preço caindo: espera o número da tela bater no alvo e fotografa.
//    (a escada é rápida — foto no relógio sai sempre no 1)
const esperaPreco = async (alvo, tolerancia = 12) => {
  for (let i = 0; i < 400; i++) {
    const txt = await p.locator('p', { hasText: /^\d+ 🪙$/ }).first().innerText().catch(() => '')
    const v = Number((txt.match(/\d+/) ?? [])[0])
    if (Number.isFinite(v) && Math.abs(v - alvo) <= tolerancia) return v
    await p.waitForTimeout(60)
  }
  return null
}
await esperaPreco(80, 20)
await tira('holandes-1-preco-alto', 'o preço lá em cima, logo que a carta entra')
await esperaPreco(36, 8)
await tira('holandes-2-preco-meio', 'o preço no meio da descida — é aqui que aperta o coração')
await esperaPreco(8, 4)
await tira('holandes-3-martelo', 'mais embaixo: botão aceso e a faixa do último martelo')

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
console.log(`\n✅ fotos em ${SAIDA}/\n`)
