#!/usr/bin/env node
// ─── 🎨 MOCKUP — 3 IDEIAS PRA SIMULAÇÃO DOS JOGOS (13/10) ────────────────────
// Diego: *"o que mais poderíamos implementar nas simulações dos jogos… coisas pra engajar"* → *"quero dos 3 mockup"*.
// O placar grande é o `LiveScoreCard` REAL; as peças novas são desenhadas por cima (ainda não existem no jogo):
//   1. 📻 Rádio Legends — narração correndo o jogo inteiro (não só no gol) · 2. ⭐ Craque do jogo no apito ·
//   3. 🌡️ Termômetro de pressão embaixo do placar.
// uso: node scripts/mockup-simulacao-3.mjs [--porta 5253] [--saida scripts/mockups]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5253'), SAIDA = arg('saida', 'scripts/mockups')
mkdirSync(SAIDA, { recursive: true })
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const MONTA = `
  const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
  const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
  const E = await import('/src/escalacao/escudos.tsx')
  const P = await import('/src/escalacao/pyramidseason.tsx')
  const antigo = document.getElementById('root'); if (antigo) antigo.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6;padding:16px;font-family:Inter,system-ui;color:#0C0C0C'
  const esc = (n, s) => h(E.Escudo, { nome: n, size: s })
  const OSW = { fontFamily: 'Oswald, sans-serif' }
  const goals = [{ name: 'Romário', min: 23, home: true }, { name: 'Cristiano Ronaldo', min: 44, home: false }, { name: 'Edmundo', min: 78, home: true }]
  const placar = (min, fin) => h(P.LiveScoreCard, { homeName: 'K9 FC', awayName: 'Fabulous EC', homeColor: '#1B3A6B', awayColor: '#C2452F', youIsHome: true, goals: goals.filter(g => g.min <= min), roundKey: 7, roundMs: 30000, enhancedOnline: true, enhancedCareer: true, homeOwner: 'Kelvin', awayOwner: 'Fabulous', displayMinute: min, finished: !!fin })
  const box = (bg, extra) => ({ background: bg, border: '3px solid #0C0C0C', borderRadius: 14, boxShadow: '4px 4px 0 #0C0C0C', padding: '10px 12px', marginTop: 10, ...extra })
  const tag = (txt, bg) => h('span', { style: { ...OSW, fontWeight: 700, fontSize: 10, letterSpacing: '.14em', background: bg ?? '#FFC400', color: '#0C0C0C', border: '2px solid #0C0C0C', borderRadius: 7, padding: '1px 7px' } }, txt)

  // 1 · RÁDIO LEGENDS — narração correndo o jogo (sem gol: o gol continua sendo o lance de sempre, no placar)
  const linhas = [
    ['61′', '🧤', 'Defesaça! O goleiro do Fabulous voa no ângulo e a torcida do K9 já comemorava.', true],
    ['57′', '🟨', 'Carrinho que arranca grama no meio-campo. Amarelo e reclamação até do gandula.', false],
    ['52′', '🪵', 'NA TRAVE! Edmundo bate de fora e o poste do Fabulous treme até agora.', false],
    ['48′', '💨', 'Drible da vaca no lateral do Fabulous. O cara até hoje procura a bola.', false],
    ['46′', '🔁', 'Bola rolando pro segundo tempo. Kelvin gritando da beira do campo.', false],
    ['44′', '⚽', 'Gol do Fabulous · Cristiano Ronaldo', false],
  ]
  const radio = h('div', { style: box('#0C0C0C', { color: '#fff', padding: 0, overflow: 'hidden' }) },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,.15)' } },
      h('span', { style: { fontSize: 16 } }, '📻'), h('b', { style: { ...OSW, fontSize: 13, letterSpacing: '.12em' } }, 'RÁDIO LEGENDS'), h('span', { style: { flex: 1 } }),
      h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5, ...OSW, fontSize: 10, letterSpacing: '.12em', color: '#5fd68a' } }, h('i', { style: { width: 8, height: 8, borderRadius: 99, background: '#5fd68a', boxShadow: '0 0 0 3px rgba(95,214,138,.25)' } }), 'AO VIVO')),
    h('div', { style: { padding: '6px 12px 8px' } }, ...linhas.map(([m, ic, t, nova], i) => h('p', { key: i, style: { display: 'flex', gap: 8, alignItems: 'flex-start', margin: 0, padding: '6px 0', borderBottom: i < linhas.length - 1 ? '1px dashed rgba(255,255,255,.12)' : 0, opacity: nova ? 1 : Math.max(.35, 1 - i * .14), fontSize: nova ? 13 : 12, fontWeight: nova ? 700 : 500, lineHeight: 1.3 } },
      h('b', { style: { ...OSW, color: '#FFC400', minWidth: 28 } }, m), h('span', { style: { fontSize: 14, lineHeight: 1 } }, ic), h('span', null, t)))),
    h('p', { style: { margin: 0, padding: '6px 12px', background: 'rgba(255,255,255,.06)', font: '600 10px Inter', color: 'rgba(255,255,255,.55)' } }, 'Narração só de lance que NÃO é gol. O gol segue com o lance grande no placar. Nunca narra pênalti.'))

  // 2 · CRAQUE DO JOGO — no apito
  const craque = h('div', { style: box('#fff') },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } }, h('b', { style: { ...OSW, fontSize: 12, letterSpacing: '.16em', color: '#92600A' } }, '⭐ CRAQUE DO JOGO'), h('span', { style: { flex: 1 } }), tag('APITO FINAL', '#F4ECD6')),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)', border: '3px solid #0C0C0C', borderRadius: 12, padding: '10px 12px' } },
      h('div', { style: { width: 50, display: 'flex', justifyContent: 'center' } }, esc('K9 FC', 48)),
      h('div', { style: { flex: 1, minWidth: 0 } }, h('b', { style: { ...OSW, fontSize: 24, lineHeight: 1, display: 'block' } }, 'Romário'), h('span', { style: { font: '600 11px Inter', color: 'rgba(0,0,0,.65)', display: 'block', marginTop: 3 } }, 'K9 FC · Vasco 1997 · ATA'), h('span', { style: { ...OSW, fontSize: 12, display: 'block', marginTop: 4 } }, '⚽ 1 gol · 🅰️ 1 assistência')),
      h('div', { style: { textAlign: 'center', background: '#0C0C0C', color: '#FFC400', borderRadius: 10, padding: '6px 10px', border: '2px solid #0C0C0C' } }, h('b', { style: { ...OSW, fontSize: 30, lineHeight: .9, display: 'block' } }, '8,7'), h('span', { style: { ...OSW, fontSize: 9, letterSpacing: '.14em' } }, 'NOTA'))),
    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 } },
      ...[['Cristiano Ronaldo', 'Fabulous EC', '⚽ 1 gol', '7,9'], ['Edmundo', 'K9 FC', '⚽ 1 gol', '7,6']].map(([n, c, s, nt], i) => h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 6, border: '2px solid #0C0C0C', borderRadius: 10, padding: '5px 8px', background: '#F4ECD6' } }, esc(c, 20), h('div', { style: { flex: 1, minWidth: 0 } }, h('b', { style: { ...OSW, fontSize: 12, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, n), h('span', { style: { font: '600 10px Inter', color: '#53534b' } }, s)), h('b', { style: { ...OSW, fontSize: 15 } }, nt)))),
    h('p', { style: { margin: '8px 0 0', font: '600 10px Inter', color: '#53534b' } }, 'Sai de gol + assistência (e defesa, pro goleiro). Na carreira soma na ficha do jogador: "craque do jogo 3×".'))

  // 3 · TERMÔMETRO DE PRESSÃO — embaixo do placar, só visual
  const termo = (pctCasa, min, quase) => h('div', { style: box('#fff', { padding: '8px 12px 10px' }) },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } }, h('b', { style: { ...OSW, fontSize: 11, letterSpacing: '.16em', color: '#53534b' } }, '🌡️ PRESSÃO'), h('span', { style: { flex: 1 } }), h('b', { style: { ...OSW, fontSize: 11, color: pctCasa >= 50 ? '#1B3A6B' : '#C2452F' } }, pctCasa >= 50 ? 'K9 FC EM CIMA' : 'FABULOUS EM CIMA'), h('span', { style: { ...OSW, fontSize: 11, color: '#53534b' } }, min + '′')),
    h('div', { style: { position: 'relative', height: 16, border: '2px solid #0C0C0C', borderRadius: 10, overflow: 'hidden', background: '#C2452F' } },
      h('div', { style: { position: 'absolute', inset: 0, width: pctCasa + '%', background: '#1B3A6B', transition: 'width .4s' } }),
      h('div', { style: { position: 'absolute', top: 0, bottom: 0, left: 'calc(50% - 1px)', width: 2, background: 'rgba(255,255,255,.7)' } }),
      quase && h('div', { style: { position: 'absolute', top: -2, left: (pctCasa - 6) + '%', ...OSW, fontSize: 9, fontWeight: 700, background: '#FFC400', border: '2px solid #0C0C0C', borderRadius: 6, padding: '0 5px', color: '#0C0C0C', transform: 'translateY(-55%)' } }, 'QUASE!')),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 4, ...OSW, fontSize: 10, color: '#53534b' } }, h('span', null, 'K9 FC ' + pctCasa + '%'), h('span', null, (100 - pctCasa) + '% Fabulous EC')),
    h('p', { style: { margin: '6px 0 0', font: '600 10px Inter', color: '#53534b' } }, 'Pende pro lado de quem está em cima e pula no "QUASE!". Só visual: não sabe do gol antes da bola entrar.'))

  const phone = (n, rotulo, sub, kids) => h('div', { style: { width: 390, flex: 'none' } },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 } }, h('span', { style: { ...OSW, fontWeight: 700, fontSize: 20, background: '#FFC400', border: '3px solid #0C0C0C', borderRadius: 10, width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 0 #0C0C0C' } }, n), h('b', { style: { ...OSW, fontSize: 22, textTransform: 'uppercase' } }, rotulo)),
    h('p', { style: { font: '600 12px Inter', color: '#53534b', margin: '0 0 10px', minHeight: 34 } }, sub),
    h('div', { style: { border: '4px solid #000', borderRadius: 28, boxShadow: '6px 6px 0 #000', background: '#F4ECD6', padding: 10, overflow: 'hidden' } }, kids))
  const root = document.createElement('div'); document.body.appendChild(root)
  createRoot(root).render(h('div', null,
    h('h1', { style: { ...OSW, fontWeight: 700, fontSize: 34, textTransform: 'uppercase', margin: '0 0 4px' } }, '⚽ Simulação dos jogos: ', h('span', { style: { color: '#C2452F' } }, '3 ideias')),
    h('p', { style: { font: '600 14px Inter', color: '#53534b', margin: '0 0 16px' } }, 'Placar grande é o de verdade. As peças novas entram embaixo dele, sem passo novo e sem mexer em resultado. Valem pra liga, copas, online e carreira.'),
    h('div', { style: { display: 'flex', gap: 22, alignItems: 'flex-start' } },
      phone('1', 'Rádio Legends', 'Narração correndo o jogo INTEIRO: falta, trave, defesaça, drible. Acaba o silêncio entre um gol e outro. Banco grande de frases BR/EN.', h('div', null, placar(61), radio)),
      phone('2', 'Craque do jogo', 'No apito: o melhor em campo com nota, escudo e carta, e os outros dois destaques. Assunto pro chat e número pra ficha na carreira.', h('div', null, placar(93, true), craque)),
      phone('3', 'Termômetro de pressão', 'Barra embaixo do placar que pende pra quem está em cima e pula nos "QUASE!" que já existem. Tensão de transmissão, só visual.', h('div', null, placar(74), termo(68, 74, true))))))
  await new Promise(r => setTimeout(r, 9000)) // deixa o teatro do gol do placar real passar antes da foto
  document.fonts && await document.fonts.ready
`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1290, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
const p = await ctx.newPage()
p.on('pageerror', e => console.error('💥', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.evaluate(`(async () => { ${MONTA} })()`)
await p.screenshot({ path: `${SAIDA}/simulacao-3-ideias.png`, fullPage: true })
console.log(`📸 ${SAIDA}/simulacao-3-ideias.png`)
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
