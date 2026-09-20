// ─── 🕵️ FOTO DO JOGADOR ENIGMA (pro Diego aprovar antes de publicar) ─────────
//
// Não é desenho: abre o JOGO DE VERDADE, liga o Enigma e fotografa a lista do
// pregão e a revelação. É exatamente o que o jogador vai ver no celular.
//
// Pedido dele lá atrás, quando a ideia nasceu: *"mande mockup da lista e como
// ele seria listado"*. E a regra da casa: mockup primeiro, publicar depois.
//
// uso: node scripts/mockup-enigma.mjs [--porta 5253]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5253')
const SAIDA = 'mockups'
mkdirSync(SAIDA, { recursive: true })

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 940 }, deviceScaleFactor: 2 })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1800)

const tira = async (nome, legenda) => {
  await p.screenshot({ path: `${SAIDA}/${nome}.png`, fullPage: true })
  console.log(`   📸 ${SAIDA}/${nome}.png — ${legenda}`)
}
const clica = async (txt, espera = 500) => {
  const el = p.locator('button', { hasText: txt }).first()
  if (!(await el.count())) return false
  await el.click({ timeout: 5000, force: true }).catch(() => {})
  await p.waitForTimeout(espera)
  return true
}

// 🧪 liga o Enigma NA PÁGINA e manda ele pra 1ª leva (é a leva que interessa
// fotografar). Não encosta em arquivo nenhum — antes isto era um remendo no
// `store.tsx` que precisava ser desfeito depois.
await p.evaluate(async () => { (await import('/src/escalacao/store.tsx')).bancadaEnigma(true, true) })

// 1) entra no jogo do leilão, fecha a faixa de versão, põe em PT
await clica('LEILÃO LEGENDS 38', 1400)
await clica('✕', 400)
await clica('BR', 800)
await clica('PARTIDA RÁPIDA', 1400)

// 2) nome do time → avança até o pregão abrir
await p.locator('input').first().fill('Neymarzetti').catch(() => {})
await p.waitForTimeout(300)
for (let i = 0; i < 6; i++) {
  if (await p.locator('text=ESCREVA SEU LANCE').count()) break
  if (!(await clica('AVANÇAR', 1500)) && !(await clica('COMEÇAR', 1500)) && !(await clica('Entendi', 700)) && !(await clica('PULAR', 700))) break
}
await p.waitForTimeout(1200)

// 3) fotografa a lista do pregão com o Enigma no meio das outras
await tira('enigma-1-lista', 'a leva listada: o Enigma no meio das outras, só posição + dica')

// 4) dá um lance em tudo e vai pra REVELAÇÃO, que é onde ele se abre no martelo
for (const b of await p.locator('button', { hasText: /^\+/ }).all().catch(() => [])) { await b.click({ force: true }).catch(() => {}) }
await p.waitForTimeout(400)
await clica('LACRAR', 2600)
for (let i = 0; i < 14; i++) {
  if (await p.locator('text=Revelação').count()) break
  await p.waitForTimeout(900)
}
await p.waitForTimeout(2600)
await tira('enigma-2-revelacao', 'no martelo: quem levou, e o nome saindo do escuro')

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
console.log(`\n✅ fotos em ${SAIDA}/\n`)
