#!/usr/bin/env node
// ─── 📸 A PÁGINA DE REGRAS, DE VERDADE, NOS DOIS PREGÕES ────────────────────
//
// Relato do Diego (25/09): a página que ensina o jogo (a dos dois Kakás) aparece
// no Modo Stream e na Partida Rápida — mas no 🐊 Tocaia ela ensinava as regras do
// ✉️ envelope cego, que não é o que acontece lá.
//
// Este script abre o jogo DE VERDADE e fotografa a página nos dois modos, lado a
// lado, pra conferir que o envelope continua igualzinho e só a Tocaia mudou.
//
// uso: node scripts/foto-intro-tocaia.mjs [--porta 5312] [--saida /tmp/intro]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5312')
const SAIDA = arg('saida', '/tmp/intro-tocaia')
mkdirSync(SAIDA, { recursive: true })

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })

// um passeio por modo: home → partida rápida → escolhe o pregão → AVANÇAR
async function tira(modo) {
  const p = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1500)
  const clica = async (txt, ms = 600) => {
    const el = p.locator('button', { hasText: txt }).first()
    if (!(await el.count())) return false
    await el.click({ timeout: 5000, force: true }).catch(() => {})
    await p.waitForTimeout(ms)
    return true
  }
  await clica('LEILÃO LEGENDS 38', 1400)
  await clica('✕', 400)
  await clica('BR', 700)
  await clica('PARTIDA RÁPIDA', 1600)
  // ⚠️ nome do time é OBRIGATÓRIO — sem ele o AVANÇAR não leva a lugar nenhum
  await p.locator('input').first().fill('Bagres do Asfalto').catch(() => {})
  await p.waitForTimeout(300)
  // o pregão: ✉️ Envelope cego (padrão) ou 🐊 Tocaia
  if (modo === 'tocaia') await clica('Tocaia', 700)
  else await clica('Envelope cego', 700)
  // sai da tela de montar sala (a saída é ela SUMIR — o texto "Envelope" existe aqui)
  for (let i = 0; i < 10; i++) {
    if (!(await p.locator('text=MONTE SUA SALA').count())) break
    if (!(await clica('AVANÇAR', 1600)) && !(await clica('COMEÇAR', 1600))) break
  }
  await p.waitForTimeout(1200)
  await p.screenshot({ path: `${SAIDA}/intro-${modo}.png`, fullPage: true })
  console.log('   📸', `intro-${modo}`)
  await p.close()
}

await tira('envelope')
await tira('tocaia')
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
console.log(`\n✅ fotos em ${SAIDA}`)
