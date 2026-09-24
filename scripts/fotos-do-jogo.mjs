#!/usr/bin/env node
// ─── 📸 FOTOS DE VERDADE DO JOGO — pro vídeo que explica como se joga ───────
//
// Diego (23/09), reprovando o 1º corte da parte 2 do Pantera: *"o segundo que
// explica o Leilão Legends ainda não tá legal… o Obina sem foto com o Pelé com
// foto… e várias artes cinematográficas apenas"*.
//
// Ele tem razão: aquele vídeo explicava o jogo com as ILUSTRAÇÕES (a sala de
// leilão, a mesa, o estádio). São bonitas, mas são cenário — não são o jogo.
// Quem nunca viu o Leilão Legends continua sem saber COMO É na tela.
//
// Então este script joga uma partida rápida de verdade e tira foto dos momentos
// que explicam o jogo sozinhos: a carta no pregão, o envelope com o lance
// escondido, o martelo, o elenco montado no campinho e a tabela.
//
// uso: node scripts/fotos-do-jogo.mjs [--porta 5311] [--saida /tmp/fotos]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5311')
const SAIDA = arg('saida', '/tmp/fotos-jogo')
mkdirSync(SAIDA, { recursive: true })

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 3 })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1500)

const clica = async (txt, ms = 600) => {
  const el = p.locator('button', { hasText: txt }).first()
  if (!(await el.count())) return false
  await el.click({ timeout: 5000, force: true }).catch(() => {})
  await p.waitForTimeout(ms)
  return true
}
const foto = async (nome) => { await p.screenshot({ path: `${SAIDA}/${nome}.png` }); console.log('   📸', nome) }

await clica('LEILÃO LEGENDS 38', 1400)
await clica('✕', 400)
await clica('BR', 700)
await clica('PARTIDA RÁPIDA', 1600)
// ⚠️ o nome do time é OBRIGATÓRIO: sem ele o "AVANÇAR 🔨" não leva pra lugar
// nenhum, e o roteiro fica preso na tela de montar sala (foi o que travou o 1º
// corte deste script).
await p.locator('input').first().fill('Bagres do Asfalto').catch(() => {})
await p.waitForTimeout(400)
await foto('01-montar-sala')
// ⚠️ E a saída do laço NÃO pode ser "achou a palavra Envelope": a própria tela de
// montar sala tem o botão "✉️ Envelope cego", então o laço saía na hora, sem nunca
// apertar o AVANÇAR (2º corte travado). Quem diz que saímos daqui é a tela de
// montar sala ter SUMIDO.
for (let i = 0; i < 10; i++) {
  if (!(await p.locator('text=MONTE SUA SALA').count())) break
  if (!(await clica('AVANÇAR', 1800)) && !(await clica('COMEÇAR', 1800)) && !(await clica('Entendi', 700)) && !(await clica('PULAR', 700))) break
}
await p.waitForTimeout(1200)
await foto('02-tutorial')          // a própria tela explicando "moedas = seu lance"

// 🧭 AVANÇA em qualquer tela: o jogo usa rótulos diferentes em cada passo, e a
// tela de tutorial fica parada se ninguém toca. Tenta todos e segue a vida.
const avanca = async (ms = 900) => {
  for (const t of ['ENTENDI', 'Entendi', 'BORA', 'VAMO', 'COMEÇAR', 'AVANÇAR', 'FECHAR', 'PULAR', 'OK']) {
    if (await clica(t, ms)) return true
  }
  return false
}
// caça os 4 momentos que explicam o jogo sozinhos
const alvos = [
  ['03-lance', 'text=SEU LANCE'],
  ['04-lacrado', 'text=ENVELOPE LACRADO'],
  ['05-martelo', 'text=VENCEDOR'],
  ['06-elenco', 'text=SUA ESCALAÇÃO'],
]
for (const [nome, marca] of alvos) {
  let achou = false
  for (let i = 0; i < 90; i++) {
    if (await p.locator(marca).count()) { achou = true; break }
    if (!(await avanca(500))) await p.waitForTimeout(900)
  }
  if (achou) {
    // no lance, escreve um valor de verdade antes da foto
    if (nome === '03-lance') {
      const mais = p.locator('button', { hasText: '+' }).first()
      for (let k = 0; k < 5 && await mais.count(); k++) await mais.click({ force: true }).catch(() => {})
      await p.waitForTimeout(500)
    }
    await foto(nome)
  } else console.log('   ⏭️  não achei:', nome)
}
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
console.log(`\n✅ fotos em ${SAIDA}`)
