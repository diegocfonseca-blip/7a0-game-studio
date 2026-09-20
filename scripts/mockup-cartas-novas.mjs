// 🃏 MOCKUP — CARTAS NOVAS NO BARALHO (story do Instagram, 1080×1920)
//
// Pedido do Diego (20/09): *"me mande mockup da lista d jogadores novos q entraram
// p eu por no stories do Instagram"*. O post usa a MESMA cara da carta do jogo
// (gradiente do tier, selo da categoria, estrelas) — nada de arte inventada.
//
// A lista fica logo abaixo, uma linha por carta: mudou um nome/auge/categoria,
// muda aqui e roda de novo. É por isso que o mockup mora no repo: o do Coringas
// foi feito à mão e se perdeu junto com o scratchpad.
//
// Rodar (da raiz do repo):  node scripts/mockup-cartas-novas.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

// 🎨 os tiers COPIADOS do jogo (`FAME_TIER`/`PROMESSA_TIER` em screens.tsx)
const TIER = {
  5: { label: '👑 LENDA', grad: 'linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', ink: '#0C0C0C', tierColor: '#7a4d00', crestBg: 'rgba(255,255,255,.42)', crestInk: '#7a4d00', holo: .85 },
  4: { label: '⭐ CRAQUE', grad: 'linear-gradient(150deg,#F4F7FB,#CBD4DE 45%,#9BA7B5 78%,#EAEFF4)', ink: '#0C0C0C', tierColor: '#44546a', crestBg: 'rgba(255,255,255,.5)', crestInk: '#44546a', holo: .72 },
  3: { label: '🎯 BOM JOGADOR', grad: 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)', ink: '#fff', tierColor: 'rgba(255,255,255,.92)', crestBg: 'rgba(255,255,255,.35)', crestInk: '#14532d' },
  2: { label: '🎯 BOM JOGADOR', grad: 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)', ink: '#fff', tierColor: 'rgba(255,255,255,.92)', crestBg: 'rgba(255,255,255,.35)', crestInk: '#14532d' },
  1: { label: '🪵 FOI PROFISSIONAL', grad: 'linear-gradient(150deg,#DBD1B5,#CBBF9E 60%,#B2A583)', ink: '#0C0C0C', tierColor: '#655c43', crestBg: 'rgba(255,255,255,.5)', crestInk: '#655c43' },
  prom: { label: '💎 PROMESSA', grad: 'linear-gradient(150deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)', ink: '#fff', tierColor: 'rgba(255,255,255,.9)', crestBg: 'rgba(255,255,255,.5)', crestInk: '#3d1f7a', holo: .38 },
}

// ─── A LISTA DA VEZ ─────────────────────────────────────────────────────────
const CARTAS = [
  { name: 'Dirceu Krüger', club: 'Coritiba', year: 1973, pos: 'MEI', fame: 3, deck: 'BR', nota: 'a Flecha Loira do Coritiba' },
  { name: 'Wesley', club: 'Roma', year: 2026, pos: 'LAT', fame: 4, deck: 'EU', nota: 'o lateral do Flamengo virou titular na Itália' },
  { name: 'Vitor Reis', club: 'Palmeiras', year: 2024, pos: 'ZAG', fame: 3, promessa: true, deck: 'BR', nota: 'saiu daqui pro Manchester City' },
  { name: 'Fábio Rochemback', club: 'Sporting', year: 2005, pos: 'MEI', fame: 3, deck: 'EU', nota: 'bomba de fora da área' },
  { name: 'Tuta', club: 'Fluminense', year: 2006, pos: 'ATA', fame: 3, deck: 'BR', nota: 'centroavante raçudo dos anos 2000' },
]
// 🔁 cartas que JÁ existiam e mudaram de categoria — ocupam o último quadrado
const MUDANCAS = [
  { de: '⭐ CRAQUE', para: '👑 LENDA', name: 'Paul Scholes', sub: 'Man United · 2003' },
  { de: '🎯 BOM', para: '💎 PROMESSA', name: 'Wesley', sub: 'Flamengo · 2023' },
]
const RODAPE = 'Toda semana entra gente nova no baralho'
// ────────────────────────────────────────────────────────────────────────────

const carta = c => {
  const t = c.promessa ? TIER.prom : TIER[c.fame]
  const estrelas = c.promessa ? '💎💎💎' : '⭐'.repeat(c.fame)
  return `
  <div class="carta" style="background:${t.grad};color:${t.ink}">
    ${t.holo ? `<span class="holo" style="background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,${t.holo}) 48%,transparent 62%)"></span>` : ''}
    <div class="topo">
      <span class="pos">${c.pos}</span>
      <span class="dir">
        <span class="deck">${c.deck === 'BR' ? '🇧🇷 BRASIL' : '🌍 EUROPA'}</span>
        <span class="tier" style="color:${t.tierColor}">${t.label}</span>
      </span>
    </div>
    <span class="crest" style="background:${t.crestBg};color:${t.crestInk}">${c.name.trim()[0].toUpperCase()}</span>
    <div class="pe">
      <p class="nome">${c.name}</p>
      <p class="clube">${c.club} · ${c.year}</p>
      <p class="estrelas">${estrelas}</p>
      <p class="nota">${c.nota}</p>
    </div>
  </div>`
}

const html = `<!doctype html><meta charset="utf-8"><style>
${FONTES}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui,Arial,sans-serif;color:${INK};overflow:hidden}
.pag{padding:56px 48px 44px;height:100%;display:flex;flex-direction:column}
.chip{display:inline-block;background:${INK};color:${GOLD};font-family:Oswald;font-weight:700;font-size:26px;letter-spacing:2px;padding:8px 20px;border-radius:999px}
h1{font-family:Oswald;font-weight:700;font-size:92px;line-height:.94;text-transform:uppercase;margin:18px 0 6px;letter-spacing:-1px}
h1 em{font-style:normal;display:block;color:#C2452F}
.sub{font-size:27px;font-weight:700;color:#5a5647;margin-bottom:26px}
.grade{display:grid;grid-template-columns:1fr 1fr;gap:24px;flex:1}
.carta{position:relative;overflow:hidden;border:5px solid ${INK};border-radius:26px;box-shadow:8px 9px 0 0 ${INK};padding:20px;display:flex;flex-direction:column;justify-content:space-between}
.holo{position:absolute;inset:0;pointer-events:none}
.topo{position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.pos{background:${INK};color:#fff;font-family:Oswald;font-weight:700;font-size:23px;padding:3px 13px;border-radius:10px;border:2px solid rgba(255,255,255,.25)}
.tier{font-family:Oswald;font-weight:700;font-size:20px;letter-spacing:.5px;text-align:right}
.crest{position:relative;align-self:center;width:128px;height:128px;border-radius:999px;border:5px solid rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;font-family:Oswald;font-weight:700;font-size:62px}
.pe{position:relative}
.nome{font-family:Oswald;font-weight:700;font-size:40px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.clube{font-weight:800;font-size:22px;opacity:.65;margin-top:2px}
.estrelas{font-size:21px;letter-spacing:2px;margin-top:4px}
.nota{font-size:19px;font-weight:700;font-style:italic;opacity:.8;margin-top:7px;line-height:1.2}
.dir{display:flex;flex-direction:column;align-items:flex-end;gap:7px}
.deck{background:rgba(0,0,0,.72);color:#fff;font-family:Oswald;font-weight:700;font-size:17px;letter-spacing:1px;padding:4px 12px;border-radius:999px;white-space:nowrap}
.mudou{border:5px solid ${INK};border-radius:26px;box-shadow:8px 9px 0 0 ${INK};background:${INK};color:#fff;padding:22px 20px;display:flex;flex-direction:column;justify-content:center;gap:16px}
.mt{font-family:Oswald;font-weight:700;font-size:31px;color:${GOLD};text-transform:uppercase;line-height:1}
.linha b{display:block;font-family:Oswald;font-weight:700;font-size:34px;line-height:1.05}
.linha i{display:block;font-style:normal;font-weight:800;font-size:19px;color:rgba(255,255,255,.55);margin-top:1px}
.linha span{display:block;font-weight:800;font-size:20px;color:rgba(255,255,255,.85);margin-top:5px}
.linha u{text-decoration:none;color:${GOLD};font-family:Oswald;font-weight:700;font-size:23px}
.rodape{margin-top:26px;background:${INK};border-radius:22px;padding:22px 26px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.rodape b{font-family:Oswald;font-weight:700;font-size:34px;color:${GOLD};text-transform:uppercase;letter-spacing:.5px}
.rodape span{font-size:23px;font-weight:800;color:rgba(255,255,255,.82);text-align:right}
</style>
<div class="pag">
  <div><span class="chip">⚽ LEILÃO LEGENDS</span></div>
  <h1>Cartas novas<em>no baralho</em></h1>
  <p class="sub">Entraram agora e já aparecem no leilão da sua próxima temporada 👀</p>
  <div class="grade">${CARTAS.map(carta).join('')}${MUDANCAS.length ? `
    <div class="mudou">
      <p class="mt">🔁 Subiram de categoria</p>
      ${MUDANCAS.map(m => `<div class="linha"><b>${m.name}</b><i>${m.sub}</i><span>${m.de} → <u>${m.para}</u></span></div>`).join('')}
    </div>` : ''}</div>
  <div class="rodape"><b>${RODAPE}</b><span>leilaolegends.com</span></div>
</div>`

const out = process.argv[2] ?? `${ROOT}/cartas-novas.png`
const tmp = `${ROOT}/.mockup-cartas-novas.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.goto(`file://${tmp}`, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
await p.screenshot({ path: out })
await b.close()
console.log('✅', out)
