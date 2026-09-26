#!/usr/bin/env node
// ─── 📸 O GOLZINHO DE VERDADE — o placar do jogo montado sozinho ──────────────
//
// Depois do mockup aprovado (26/09): aqui é o `LiveScoreCard` REAL, com um clube
// BATIZADO marcando — pra provar que a mascote do carimbo continua aparecendo
// junto com a bola entrando na rede (pergunta do Diego: *"isso não vai
// interferir nos mascotes de aparecer, né?"*).
//
// Sai: PNGs nos momentos das chances e do gol + um MP4 do jogo rolando.
// uso: node scripts/foto-golzinho.mjs [--porta 5248] [--saida /tmp/golzinho-real]
import { chromium } from 'playwright-core'
import { spawn, execSync } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync } from 'node:fs'
import path from 'node:path'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5248'), SAIDA = arg('saida', '/tmp/golzinho-real')
mkdirSync(SAIDA, { recursive: true })

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

// monta o placar real. `displayMinute` congela o relógio no minuto pedido (foto);
// sem ele, o relógio anda sozinho no ritmo de `roundMs` (vídeo).
const MONTA = (minuto, roundMs) => `
  const R = await import('/@id/react'); const React = R.default ?? R
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const P = await import('/src/escalacao/pyramidseason.tsx')
  const C = await import('/src/escalacao/chances.ts')
  const antigo = document.getElementById('root'); if (antigo) antigo.remove()
  document.body.style.cssText = 'margin:0;background:#1b3a25;padding:14px;font-family:system-ui'
  const home = 'Al Takhadao FC', away = 'The Wolf'
  const goals = [{ name: 'Arda Güler', min: 33, home: true }, { name: 'Edin Džeko', min: 58, home: false }, { name: 'Arda Güler', min: 81, home: true }]
  window.__chances = C.chancesDoJogo(C.sementeDasChances(5, home, away), goals, ${roundMs})
  const props = { homeName: home, awayName: away, homeColor: '#2E6FB0', awayColor: '#9C8B5A', youIsHome: true, goals, roundKey: 5, roundMs: ${roundMs}, enhancedOnline: true, enhancedCareer: true, homeOwner: 'Zé do Mercado', awayOwner: 'Neymarzetti' ${minuto == null ? '' : `, displayMinute: ${minuto}`} }
  const root = document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(React.createElement(P.LiveScoreCard, props))
  await new Promise(r => setTimeout(r, 500))
  document.fonts && await document.fonts.ready
  return window.__chances
`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 420, height: 420 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })

// 📸 fotos: descobre as chances desta rodada e fotografa cada final + o gol
const sonda = await ctx.newPage()
await sonda.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
const chances = await sonda.evaluate(`(async () => { ${MONTA(null, 30000)} })()`)
await sonda.close()
console.log('   chances desta rodada:', JSON.stringify(chances))
const momentos = [...chances.map(c => ({ nome: `${c.min}-${c.fim}`, min: c.min })), { nome: '33-gol-mascote', min: 33 }]
for (const m of momentos) {
  const p = await ctx.newPage()
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  // o relógio precisa PASSAR pelo minuto pra disparar o lance: monta 2' antes e avança
  await p.evaluate(`(async () => { ${MONTA(m.min - 2, 30000)} })()`)
  await p.evaluate(`(async () => {
    const R = await import('/@id/react'); const React = R.default ?? R
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  })()`)
  // avança o relógio re-renderizando com displayMinute = min (o próprio card detecta o lance)
  await p.evaluate(`(async () => {
    const R = await import('/@id/react'); const React = R.default ?? R
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const P = await import('/src/escalacao/pyramidseason.tsx')
    document.body.innerHTML = ''
    const root = document.createElement('div'); document.body.appendChild(root); const r = createRoot(root)
    const base = { homeName: 'Al Takhadao FC', awayName: 'The Wolf', homeColor: '#2E6FB0', awayColor: '#9C8B5A', youIsHome: true, goals: [{ name: 'Arda Güler', min: 33, home: true }, { name: 'Edin Džeko', min: 58, home: false }, { name: 'Arda Güler', min: 81, home: true }], roundKey: 5, roundMs: 30000, enhancedOnline: true, enhancedCareer: true, homeOwner: 'Zé do Mercado', awayOwner: 'Neymarzetti' }
    r.render(React.createElement(P.LiveScoreCard, { ...base, displayMinute: ${m.min - 2} }))
    await new Promise(x => setTimeout(x, 300))
    r.render(React.createElement(P.LiveScoreCard, { ...base, displayMinute: ${m.min} }))
    await new Promise(x => setTimeout(x, 1250))
  })()`)
  await p.screenshot({ path: path.join(SAIDA, `${m.nome}.png`), fullPage: true })
  await p.close()
  console.log('   📸', m.nome)
}
await ctx.close()

// 🎥 vídeo: o relógio anda sozinho (rodada de 30 s → ~25 s de jogo)
// 🎥 o card inteiro tem que caber no quadro (a faixa do golzinho fica embaixo do placar)
const vctx = await b.newContext({ viewport: { width: 760, height: 700 }, deviceScaleFactor: 1, locale: 'pt-BR', recordVideo: { dir: SAIDA, size: { width: 760, height: 700 } } })
await vctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const v = await vctx.newPage()
await v.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await v.evaluate(`(async () => { ${MONTA(null, 30000)} })()`)
await v.addStyleTag({ content: 'body{zoom:1.7}' })
await v.waitForTimeout(27000)
await vctx.close()
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
const webm = readdirSync(SAIDA).find(f => f.endsWith('.webm'))
if (webm) {
  try { execSync(`ffmpeg -y -loglevel error -i "${path.join(SAIDA, webm)}" -ss 0.5 -t 26 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${path.join(SAIDA, 'golzinho-real.mp4')}"`); renameSync(path.join(SAIDA, webm), path.join(SAIDA, 'golzinho-real.webm')) }
  catch (e) { console.log('⚠️ ffmpeg falhou:', e.message) }
}
console.log('✅ fotos em', SAIDA)
