#!/usr/bin/env node
// ─── 📸 O LETREIRO DE VERDADE — monta o componente do jogo e fotografa/filma ───
//
// Depois do mockup aprovado (26/09), a prova: aqui é o `GiroDaRodada` REAL, com
// manchetes reais (inclusive as da galera), montado sozinho via vite. Sai um PNG
// (dois estados) e um MP4 curto do LED correndo.
//
// uso: node scripts/foto-giro-letreiro.mjs [--porta 5247] [--saida /tmp/giro-real]
import { chromium } from 'playwright-core'
import { spawn, execSync } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync } from 'node:fs'
import path from 'node:path'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5247'), SAIDA = arg('saida', '/tmp/giro-real')
mkdirSync(SAIDA, { recursive: true })

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const MONTA = `
  // 🧩 dentro da página, import "solto" (react) não resolve — o vite resolve pelo /@id/
  // (o módulo chega como interop CommonJS: o que interessa pode estar no default)
  const R = await import('/@id/react'); const React = R.default ?? R
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const S = await import('/src/escalacao/screens.tsx')
  const G = await import('/src/escalacao/giro-galera.ts')
  const galera = G.narraGalera({ seed: 7, max: 2,
    jogos: [{ homeId: 1, awayId: 2, hg: 2, ag: 1 }, { homeId: 3, awayId: 10, hg: 0, ag: 3 }],
    nomeDe: id => ({ 1: 'Neymarzetti 👑', 2: 'Cr7 Leilão ⭐', 3: 'Rei da Bola', 10: 'Bagres 1993' })[id] ?? '?',
    ehHumano: id => id < 10, h2h: a => a === 1 ? { w: 3, l: 1, d: 0 } : { w: 1, l: 3, d: 0 } })
  const normal = ['R5 · ' + galera[0], 'R5 · ' + galera[1], '⚽ Champions QUARTAS · volta: Al Takhadao FC 1 × 0 Bagres 1993', '🎯 Manfré FC passou nos PÊNALTIS e eliminou Leite de Verdade FC!', '🏆 Al Takhadao FC avançou na Champions — adeus, Bagres 1993!'].filter(Boolean)
  const campeao = ['👑 Futpoint FC É CAMPEÃO DA CHAMPIONS!', '⚽ Champions FINAL: Futpoint FC 2 × 1 Al Takhadao FC', ...normal.slice(0, 2)]
  // 🇧🇷 o navegador da foto é em inglês → força PT (a mesma chave do botão BR/EN) e
  // tira a home que o app montou no #root, senão ela aparece em cima do letreiro
  const antigo = document.getElementById('root'); if (antigo) antigo.remove()
  document.body.style.cssText = 'margin:0;background:#1b3a25;padding:14px;font-family:system-ui'
  const el = (lista, isCopa) => React.createElement('div', { style: { marginBottom: 14 } }, React.createElement(S.GiroDaRodada, { news: lista, isCopa }))
  const root = document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(React.createElement(React.Fragment, null, el(normal, true), el(campeao, true)))
  await new Promise(r => setTimeout(r, 400))
  document.fonts && await document.fonts.ready
`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
// 📸 PNG (corrida congelada no meio pra manchete inteira aparecer)
// 🇧🇷 o idioma é lido UMA vez quando o app carrega (lang.ts) — então o PT tem que
// estar no aparelho ANTES da página abrir: locale pt-BR + a chave bl_lang gravada.
const ctxPng = await b.newContext({ viewport: { width: 420, height: 320 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await ctxPng.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctxPng.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async () => { ${MONTA} })()`)
// 📸 na foto a corrida fica parada com a 1ª manchete inteira à vista
await p.addStyleTag({ content: '.giro-corre{animation:none!important;padding-left:12px!important}' })
await p.waitForTimeout(600)
await p.screenshot({ path: path.join(SAIDA, 'giro-real.png'), fullPage: true })
await ctxPng.close()
// 🎥 MP4
const ctx = await b.newContext({ viewport: { width: 840, height: 330 }, deviceScaleFactor: 1, locale: 'pt-BR', recordVideo: { dir: SAIDA, size: { width: 840, height: 330 } } })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const v = await ctx.newPage()
await v.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await v.evaluate(`(async () => { ${MONTA} })()`)
await v.addStyleTag({ content: 'body{zoom:2}' })
await v.waitForTimeout(9000)
await ctx.close()
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
const webm = readdirSync(SAIDA).find(f => f.endsWith('.webm'))
if (webm) {
  try { execSync(`ffmpeg -y -loglevel error -i "${path.join(SAIDA, webm)}" -ss 1 -t 7 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${path.join(SAIDA, 'giro-real.mp4')}"`); renameSync(path.join(SAIDA, webm), path.join(SAIDA, 'giro-real.webm')) }
  catch (e) { console.log('⚠️ ffmpeg falhou:', e.message) }
}
console.log('✅ fotos em', SAIDA)
