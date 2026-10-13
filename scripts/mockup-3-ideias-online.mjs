#!/usr/bin/env node
// ─── 🎨 MOCKUP — retrospecto entre amigos · craque do jogo · copa dos campeões do dia (13/10) ───
// Diego: *"manda o mockup dos 3"*. Placar REAL (`LiveScoreCard`) com as linhas novas encaixadas no mesmo
// formato da Rádio (sem caixa nova). A 3ª é um cartão na lista de salas, junto de "Campeões de hoje".
// uso: node scripts/mockup-3-ideias-online.mjs [--porta 5256]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5256')
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) }

const MONTA = `
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const P = await import('/src/escalacao/pyramidseason.tsx')
  const E = await import('/src/escalacao/escudos.tsx')
  document.getElementById('root')?.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6;padding:16px;font-family:Inter,system-ui;color:#0C0C0C'
  const OSW = { fontFamily: 'Oswald, sans-serif' }
  const esc = (n, s) => h(E.Escudo, { nome: n, size: s })
  const goals = [{ name: 'Romário', min: 23, home: true }, { name: 'Cristiano Ronaldo', min: 44, home: false }, { name: 'Romário', min: 78, home: true }]
  const placar = (min, fin, g) => h(P.LiveScoreCard, { homeName: 'K9 FC', awayName: 'Neymarzetti FC', homeColor: '#1B3A6B', awayColor: '#C2452F', youIsHome: true, goals: g ?? goals.filter(x => x.min <= min), roundKey: 9, roundMs: 16000, enhancedOnline: true, enhancedCareer: true, homeOwner: 'Kelvin', awayOwner: 'Neymarzetti', displayMinute: min, finished: !!fin })
  const phone = (n, rot, sub, kids, id) => h('div', { style: { width: 390, flex: 'none' } },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 } }, h('span', { style: { ...OSW, fontWeight: 700, fontSize: 20, background: '#FFC400', border: '3px solid #0C0C0C', borderRadius: 10, width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 0 #0C0C0C' } }, n), h('b', { style: { ...OSW, fontSize: 22, textTransform: 'uppercase' } }, rot)),
    h('p', { style: { font: '600 12px Inter', color: '#53534b', margin: '0 0 10px', minHeight: 48 } }, sub),
    h('div', { id, style: { border: '4px solid #000', borderRadius: 28, boxShadow: '6px 6px 0 #000', background: '#F4ECD6', padding: 10 } }, kids))
  // 3 · cartão da lista de salas
  const linhaCopa = (pos, clube, dono, extra, ouro) => h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 10, border: '2px solid #0C0C0C', background: ouro ? 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)' : '#fff', marginTop: 6 } },
    h('b', { style: { ...OSW, fontSize: 14, width: 22 } }, pos), esc(clube, 26), h('div', { style: { flex: 1, minWidth: 0 } }, h('b', { style: { ...OSW, fontSize: 14, display: 'block' } }, clube), h('span', { style: { font: '600 10px Inter', color: '#53534b' } }, dono)), h('span', { style: { ...OSW, fontSize: 12 } }, extra))
  const copa = h('div', null,
    h('div', { style: { background: '#fff', border: '3px solid #0C0C0C', borderRadius: 14, boxShadow: '4px 4px 0 #0C0C0C', padding: 12 } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } }, h('b', { style: { ...OSW, fontSize: 15, letterSpacing: '.06em' } }, '👑 COPA DOS CAMPEÕES · ONTEM'), h('span', { style: { flex: 1 } }), h('span', { style: { ...OSW, fontSize: 10, background: '#7C3AED', color: '#fff', border: '2px solid #0C0C0C', borderRadius: 6, padding: '1px 6px' } }, 'AUTOMÁTICA')),
      h('p', { style: { font: '600 11px Inter', color: '#53534b', margin: '4px 0 6px' } }, 'Os 8 campeões de sala de ontem, com o time que montaram. Rodou sozinha à meia-noite.'),
      linhaCopa('🏆', 'K9 FC', 'Kelvin · campeão', '🎴 carta', true),
      linhaCopa('2º', 'Neymarzetti FC', 'Neymarzetti · vice', 'final 1×1 (pên. 4×3)', false),
      linhaCopa('', 'Al Takhadao FC', 'semi', '', false),
      linhaCopa('', 'Fabulous EC', 'semi', '', false),
      h('p', { style: { ...OSW, fontSize: 12, margin: '8px 0 0', color: '#1B7A3D' } }, '⏳ Hoje: 5 campeões até agora · a copa roda à meia-noite')),
    h('div', { style: { marginTop: 10, background: '#fff', border: '3px solid #0C0C0C', borderRadius: 14, boxShadow: '4px 4px 0 #0C0C0C', padding: 12, opacity: .6 } }, h('b', { style: { ...OSW, fontSize: 14 } }, '🏆 CAMPEÕES DE HOJE'), h('p', { style: { font: '600 11px Inter', margin: '4px 0 0' } }, '(o que já existe, logo abaixo)')))
  const root = document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(h('div', null,
    h('h1', { style: { ...OSW, fontWeight: 700, fontSize: 32, textTransform: 'uppercase', margin: '0 0 4px' } }, '🎮 Online: ', h('span', { style: { color: '#C2452F' } }, '3 ideias')),
    h('p', { style: { font: '600 13px Inter', color: '#53534b', margin: '0 0 16px' } }, 'Nenhuma cria caixa nova no jogo nem atrasa nada. As duas primeiras são uma LINHA no placar, igual a Rádio.'),
    h('div', { style: { display: 'flex', gap: 22, alignItems: 'flex-start' } },
      phone('1', 'Retrospecto entre amigos', 'Antes da bola rolar, no lugar da Rádio: o histórico de VOCÊ contra o DONO do outro clube, de todas as salas. Só quando os dois são gente.', placar(0, false, []), 't1'),
      phone('2', 'Craque do jogo', 'No apito final, a linha mostra o melhor em campo: nome, carta e o que fez. Gol e assistência contam juntos.', placar(93, true), 't2'),
      phone('3', 'Copa dos campeões do dia', 'Na lista de salas, em cima de "Campeões de hoje". Ninguém precisa estar online: roda sozinha e o campeão ganha carta.', copa, 't3'))))
  await new Promise(r => setTimeout(r, 9000))
  document.fonts && await document.fonts.ready
  const linha = (id, tag, cor, mk, html) => {
    const el = document.getElementById(id); const radio = el.querySelector('.ll42-radio'); if (!radio) return
    radio.style.background = cor; radio.innerHTML = '<span class="ll42-radio-tag" style="background:' + mk + '">' + tag + '</span><span class="ll42-radio-txt">' + html + '</span>'
  }
  linha('t1', '🆚 VOCÊ × NEYMARZETTI', 'rgba(124,58,237,.18)', '#C9B3FF', '<b style="color:#FFC400">1V · 0E · 4D</b> em 5 jogos. Freguesia declarada, hein? 😏')
  linha('t2', '⭐ CRAQUE DO JOGO', 'rgba(255,196,0,.16)', '#FFC400', '<b style="color:#FFC400">Romário</b> · Vasco 1997 · ⚽⚽ 2 gols')
`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1290, height: 900 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async () => { ${MONTA} })()`)
await p.screenshot({ path: 'scripts/mockups/online-3-ideias.png', fullPage: true })
console.log('📸 scripts/mockups/online-3-ideias.png')
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
