// 📲 STORIES do lançamento do ⚡ MATA-MATA RELÂMPAGO (28/10, Diego: *"me mande um post pra postar nos stories também, uma arte da
// copa"*). 1080×1920, na cara da competição (paleta e taça de `competicoes-visual.tsx`, chave `relampago`).
// Rodar: node scripts/stories-relampago.mjs  → scripts/posts/stories-relampago.png
import { chromium } from 'playwright-core'
const INK = '#0C0C0C'
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`
const taca = `<svg viewBox="0 0 120 170" width="300" height="425" style="filter:drop-shadow(10px 10px 0 rgba(0,0,0,.55))">
<defs><linearGradient id="o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".35" stop-color="#FFC400"/><stop offset=".7" stop-color="#C98A00"/><stop offset="1" stop-color="#FFE08A"/></linearGradient>
<linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="#D5DCE4"/><stop offset=".75" stop-color="#8E9AA8"/><stop offset="1" stop-color="#F1F4F7"/></linearGradient></defs>
<rect x="34" y="140" width="52" height="20" rx="4" fill="#3b1f8f" ${S}/><path d="M52 140 L56 114 H64 L68 140 Z" fill="url(#o)" ${S}/><path d="M28 34 H92 C92 80,80 106,60 114 C40 106,28 80,28 34 Z" fill="url(#p)" ${S}/><path d="M28 46 C12 46,12 74,32 78 M92 46 C108 46,108 74,88 78" fill="none" ${S}/><path d="M66 38 L46 76 H60 L52 106 L78 62 H63 L72 38 Z" fill="url(#o)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M20 20 L14 32 H20 L16 42" fill="none" stroke="#FFE14D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 16 L94 28 H100 L96 38" fill="none" stroke="#FFE14D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const raios = ['M8 0 L3 14 H7 L1 30', 'M93 2 L98 16 H94 L99 30', 'M14 70 L9 84 H13 L7 100', 'M88 68 L94 82 H90 L96 100', 'M50 0 L47 6 H50 L46 13']
  .map(d => `<path d="${d}" fill="none" stroke="#FFE14D" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".55"/>`).join('')
const passo = (n, ic, t, s) => `<div class="passo"><span class="num">${n}</span><span class="ic">${ic}</span><div><b>${t}</b><small>${s}</small></div></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700;900&family=Inter:wght@600;700;800&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box}body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;
background:radial-gradient(ellipse at 50% 30%,#6a43e8 0%,#3a1c9e 38%,#140838 78%);position:relative}
.raios{position:absolute;inset:0;width:100%;height:100%}
.wrap{position:relative;padding:56px 70px 0;display:flex;flex-direction:column;align-items:center;text-align:center}
.pill{display:flex;gap:14px;align-items:center;font:900 30px Oswald;letter-spacing:.06em;text-transform:uppercase}
.pill span{border:4px solid ${INK};border-radius:999px;padding:8px 26px;box-shadow:5px 5px 0 #000}
.novo{background:#FFE14D;color:${INK}}.testes{background:#1B7A3D;color:#fff}
h1{font:900 156px/1.06 Oswald;text-transform:uppercase;margin:30px 0 0;color:#fff;text-shadow:8px 8px 0 #000}
h1 em{display:block;font-style:normal;color:#FFE14D}
.frase{font:700 34px Inter;color:#E9E3FF;margin:18px 0 0}
.taca{margin:10px 0 -14px}
.box{width:100%;background:#F4ECD6;color:${INK};border:5px solid ${INK};border-radius:30px;box-shadow:10px 10px 0 #000;padding:26px 30px;text-align:left}
.passo{display:flex;align-items:center;gap:20px;padding:10px 0}.passo+.passo{border-top:3px dashed rgba(12,12,12,.2)}
.num{flex:none;width:58px;height:58px;border-radius:99px;background:${INK};color:#FFE14D;font:900 32px Oswald;display:flex;align-items:center;justify-content:center}
.ic{font-size:48px;flex:none}.passo b{display:block;font:900 40px Oswald;text-transform:uppercase;line-height:1}.passo small{display:block;font:700 26px Inter;color:rgba(12,12,12,.65);margin-top:4px}
.chave{margin-top:24px;display:flex;gap:18px;width:100%}
.chave div{flex:1;background:#FFE14D;color:${INK};border:5px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 #000;padding:18px 10px;font:900 46px Oswald;text-transform:uppercase;line-height:1}
.chave small{display:block;font:800 22px Inter;text-transform:none;margin-top:6px}
.cta{margin-top:24px;font:900 46px Oswald;text-transform:uppercase;color:#fff;text-shadow:5px 5px 0 #000}
.site{margin-top:18px;background:#fff;color:${INK};border:5px solid ${INK};border-radius:20px;box-shadow:7px 7px 0 #000;padding:14px 40px;font:900 44px Oswald}
.site b{color:#C2452F}
</style></head><body>
<svg class="raios" viewBox="0 0 100 100" preserveAspectRatio="none">${raios}</svg>
<div class="wrap">
  <div class="pill"><span class="novo">⚡ Novo nas salas online</span><span class="testes">Em testes</span></div>
  <h1>Mata-mata<em>Relâmpago</em></h1>
  <p class="frase">Sem liga. O leilão de sempre e direto pro mata-mata.</p>
  <div class="taca">${taca}</div>
  <div class="box">
    ${passo(1, '🔨', 'O leilão de sempre', 'envelope, Tocaia ou pregão aberto')}
    ${passo(2, '🎲', 'Sorteio da chave', 'com suspense, confronto por confronto')}
    ${passo(3, '⚔️', 'Ida e volta', 'empatou no placar somado? pênaltis')}
    ${passo(4, '🏆', 'Final em jogo único', 'túnel da final e festa do campeão')}
  </div>
  <div class="chave"><div>16 times<small>começa nas oitavas</small></div><div>32 times<small>começa na rodada de 32</small></div></div>
  <p class="cta">Cria a sala e chama a resenha ⚡</p>
  <div class="site">⚽ Leilão <b>Legends</b> · leilaolegends.com</div>
</div></body></html>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); await p.setContent(html); await p.waitForTimeout(1500)
await p.screenshot({ path: 'scripts/posts/stories-relampago.png' }); await b.close(); console.log('scripts/posts/stories-relampago.png')
