// 🧑‍💼⚔️ MOCKUP · MEMBROS DO CLÃ COM O ROSTO DE CADA UM (02/11). Pergunta do Diego, olhando a ficha do Lulubaba: *"nessa aba
// aqui deveria ter escudos dos usuários também ou o personagem?"*. Pela régua de 14/10 (escudo = CLUBE · presidente = PESSOA),
// clã é lista de GENTE → presidente; quem não tem boneco (grátis) leva o ESCUDO do clube no mesmo lugar.
// Bonecos = as artes reais do editor (scripts/mockups/presidente-bonecos), só de EXEMPLO de como fica.
// uso: node scripts/mockup-cla-membros-presidente.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const png = f => `data:image/png;base64,${b64(f)}`, webp = f => `data:image/webp;base64,${b64(f)}`
const BON = n => png(`scripts/mockups/presidente-bonecos/${n}-busto.png`)
const INK = '#0C0C0C'
const escGen = (s, sig, c1, c2) => `<svg width="${s}" height="${s * 1.15}" viewBox="0 0 100 115"><path d="M50 3 L95 15 L92 62 Q88 95 50 112 Q12 95 8 62 L5 15 Z" fill="${c1}" stroke="${INK}" stroke-width="6"/><path d="M50 14 L84 23 L82 60 Q79 85 50 99 Q21 85 18 60 L16 23 Z" fill="none" stroke="${c2}" stroke-width="4"/><text x="50" y="68" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="34" fill="#fff">${sig}</text></svg>`
// a bolinha: boneco (busto) ou escudo dentro do mesmo círculo — mesmo tamanho, mesma borda
const boneco = n => `<img class="av" src="${BON(n)}" style="object-fit:cover;object-position:top;background:#e9dcc0">`
const escudo = (html) => `<span class="av" style="background:#fff;display:inline-flex;align-items:center;justify-content:center">${html}</span>`
const escImg = f => escudo(`<img src="${webp(f)}" style="height:34px">`)
const M = [
  ['🥇', 'Ceceloprime FC', 2, boneco('pirlo'), 'presidente'],
  ['🥈', 'EC Vitoria', 2, escudo(escGen(30, 'EV', '#C2452F', INK)), 'escudo'],
  ['🥉', 'Cativeiro FC', 1, boneco('r10'), 'presidente'],
  ['4º', 'Duarte FC', 1, escudo(escGen(30, 'DU', '#1B3A6B', '#FFC400')), 'escudo'],
  ['5º', 'São Paulo', 0, escudo(escGen(30, 'SP', '#fff', '#C2452F').replace('fill="#fff" stroke', 'fill="#E9E4D6" stroke').replace('fill="#fff">SP', 'fill="#C2452F">SP')), 'escudo'],
  ['6º', 'Grêmio Vila Unida', 0, boneco('astro'), 'presidente'],
  ['7º', 'Jackaré 30', 0, escudo(escGen(30, 'JA', '#1B7A3D', '#FFC400')), 'escudo'],
  ['8º', 'MENGÃO MALVADÃO', 0, escImg('src/escalacao/img/mengao-escudo.webp'), 'escudo do batismo'],
  ['9º', '👑 Lucas Barreto 30', 0, escImg('src/escalacao/img/lulubaba-escudo.webp'), 'escudo do batismo'],
]
const linha = ([pos, nome, t, av]) => `<div class="m"><span class="pos">${pos}</span>${av}<b>${nome}</b><span class="t">${t} 🏆</span><span class="ch">›</span></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:${INK};padding:26px;width:1040px}
h1{font:700 32px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.65;font-size:15px;line-height:1.4}
.dois{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.tag{display:inline-block;font:700 16px Oswald;letter-spacing:1px;border:3px solid ${INK};border-radius:10px;padding:3px 12px;box-shadow:3px 3px 0 ${INK};margin-bottom:10px}
.modal{background:#F4ECD6;border:4px solid ${INK};border-radius:22px;box-shadow:5px 5px 0 ${INK};padding:14px}
.head{display:flex;align-items:center;gap:12px;background:${INK};border-radius:14px;padding:10px 14px;color:#fff}
.head b{font:700 30px Oswald;color:#FFC400}.head small{display:block;font-weight:700;font-size:13px}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.stats div{background:#fff;border:3px solid ${INK};border-radius:12px;text-align:center;padding:8px;font:700 24px Oswald}.stats small{display:block;font:600 12px system-ui}
.lista{background:#fff;border:3px solid ${INK};border-radius:14px;padding:8px 12px}
.lh{font:700 15px Oswald;margin:2px 0 6px}.lh small{font-weight:500;opacity:.55}
.m{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:2px dashed rgba(12,12,12,.15)}
.pos{width:30px;text-align:center;font:700 16px Oswald;flex:none}
.av{width:42px;height:42px;border-radius:50%;border:3px solid ${INK};flex:none;overflow:hidden}
.m b{flex:1;font-weight:800;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.t{font:700 16px Oswald}.ch{opacity:.35}
.old .av{display:none !important}
.leg{margin-top:12px;font-size:13px;font-weight:700;line-height:1.5}
</style></head><body>
<h1>⚔️ Membros do clã · com o rosto de cada um</h1>
<p class="sub">Clã é lista de GENTE → vai o 🧑‍💼 presidente de quem tem (⭐ Craque pra cima). Quem não tem boneco leva o 🛡️ escudo do clube no MESMO círculo — ninguém fica em branco. (Bonecos aqui são de exemplo.)</p>
<div class="dois">
  <div><span class="tag" style="background:#e6dcbf">HOJE</span>
    <div class="modal old"><div class="head"><img src="${webp('src/escalacao/img/lulubaba-escudo.webp')}" style="height:56px"><div><b>LULUBABA 🏆</b><small>👑 Lucas Barreto 30 · 22/22 · 🔒 fechado</small></div></div>
    <div class="stats"><div>3º<small>na semana</small></div><div>6 🏆<small>títulos do clã</small></div></div>
    <div class="lista"><div class="lh">👥 MEMBROS <small>· toque pra ver o perfil</small></div>${M.map(linha).join('')}</div></div></div>
  <div><span class="tag" style="background:#FFC400">PROPOSTA</span>
    <div class="modal"><div class="head"><img src="${webp('src/escalacao/img/lulubaba-escudo.webp')}" style="height:56px"><div><b>LULUBABA 🏆</b><small>👑 Lucas Barreto 30 · 22/22 · 🔒 fechado</small></div></div>
    <div class="stats"><div>3º<small>na semana</small></div><div>6 🏆<small>títulos do clã</small></div></div>
    <div class="lista"><div class="lh">👥 MEMBROS <small>· toque pra ver o perfil</small></div>${M.map(linha).join('')}</div></div>
    <div class="leg">🧑‍💼 tem presidente → o boneco<br>🛡️ não tem → o escudo do clube dele (batismo = o escudo de verdade)</div></div>
</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ deviceScaleFactor: 2, viewport: { width: 1040, height: 900 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: 'scripts/mockups/cla-membros-presidente.png', fullPage: true }); await br.close()
console.log('scripts/mockups/cla-membros-presidente.png')
