// 🎬 grava as galas únicas em ALTA (1080×1920) pro vídeo do sorteio do Fundador (07/11).
// Usa o screencast do Chrome com a tela de celular em 2,77× — a gravação comum do Playwright sai borrada.
// uso: node scripts/video-sorteio-grava-galas.mjs → /tmp/claude-0/sorteio/<gala>.mp4
import { chromium } from 'playwright-core'
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
const GALAS = [
  ['arruda', 'gala-arruda.tsx', 'GalaArruda', { clube: 'Tricolor do Arruda FC', chave: 'v', mostra: 'Tricolor do Arruda FC', grito: 'ARRUDA' }],
  ['k9', 'gala-k9.tsx', 'GalaK9', { clube: 'K9 FC', chave: 'v', mostra: 'K9 FC', grito: 'K9' }],
  ['neymarfc', 'gala-neymarfc.tsx', 'GalaNeymarFC', { clube: 'Neymar_FC', chave: 'v', mostra: 'Neymar_FC', grito: 'NEYMAR' }],
  ['seven', 'gala-seven.tsx', 'GalaSeven', { clube: 'Seven City', chave: 'v', mostra: 'Seven City', grito: 'SEVEN' }],
  ['monarca', 'gala-monarca.tsx', 'GalaMonarca', { clube: 'Monarca Tricolor', chave: 'v', mostra: 'Monarca Tricolor', grito: 'MONARCA' }],
  ['piranhao', 'gala-piranhao.tsx', 'GalaPiranhao', { clube: 'Piranhão FC', chave: 'v', mostra: 'Piranhão FC', grito: 'PIRANHAO' }],
  ['intervale', 'gala-intervale.tsx', 'GalaInterVale', { clube: 'Inter Vale FC', chave: 'v', mostra: 'Inter Vale FC', grito: 'INTER VALE' }],
]
const PORTA = '5288', OUT = '/tmp/claude-0/sorteio'
mkdirSync(OUT, { recursive: true })
const vite = spawn('npx', ['vite', '--port', PORTA, '--config', '/tmp/claude-0/vite.nowatch.mjs'], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 90; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const BASE = `http://localhost:${PORTA}`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, arq, comp, props] of (process.argv[2] ? GALAS.filter(g => g[0] === process.argv[2]) : GALAS)) {
  { const p = await b.newPage(); await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }); await p.evaluate(`import('/src/escalacao/${arq}')`); await p.waitForTimeout(4000); await p.close() }
  const ctx = await b.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: 1080 / 390 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async()=>{ window.__R = await import('/@id/react'); window.__RD = await import('/@id/react-dom/client'); window.__G = await import('/src/escalacao/${arq}');
    document.getElementById('root')?.remove(); document.body.style.background='#F4ECD6'; document.body.style.margin='0' })()`)
  await p.waitForTimeout(1500)
  const cdp = await ctx.newCDPSession(p), quadros = []
  cdp.on('Page.screencastFrame', async f => { quadros.push({ t: f.metadata.timestamp, d: f.data }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }) } catch {} })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 })
  await p.waitForTimeout(400)
  await p.evaluate(`(()=>{ const R=window.__R, h=(R.default??R).createElement, RD=window.__RD, cr=RD.createRoot??RD.default?.createRoot; const root=document.createElement('div'); document.body.appendChild(root); cr(root).render(h(window.__G.${comp}, ${JSON.stringify(props)})) })()`)
  await p.waitForTimeout(11500)
  await cdp.send('Page.stopScreencast'); await ctx.close()
  const dir = `${OUT}/q-${nome}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir)
  let lista = ''
  quadros.forEach((q, i) => { const f = `${dir}/${String(i).padStart(5, '0')}.jpg`; writeFileSync(f, Buffer.from(q.d, 'base64')); const dur = i + 1 < quadros.length ? quadros[i + 1].t - q.t : 0.04; lista += `file '${f}'\nduration ${dur.toFixed(4)}\n` })
  writeFileSync(`${dir}/lista.txt`, lista)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${dir}/lista.txt`, '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '18', `${OUT}/${nome}.mp4`])
  console.log('🎬', nome, quadros.length, 'quadros')
}
await b.close(); try { process.kill(-vite.pid) } catch {}
