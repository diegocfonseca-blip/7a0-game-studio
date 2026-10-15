// 🏆 MOCKUP · PÓDIO DA SEMANA na lista de técnicos (15/10)
// Pedido do Diego: o 1º/2º/3º do ranking da semana ganham algo MAIS FORTE que a medalha no nome,
// mas SEM mexer no fundo (fundo é a cor do TIER — quem é ouro continua ouro, regra sagrada).
// Ideia: MOLDURA DO PÓDIO (borda de metal girando por FORA do cartão) + FITA pendurada "1º DA SEMANA".
// uso: node scripts/mockup-podio-semana.mjs → scripts/mockups/podio-semana.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const G = {
  bege: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)',
  roxo: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)',
  prata: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)',
  ouro: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)',
}
const MET = {
  1: { anel: 'conic-gradient(from var(--a),#fff6c4,#FFC400,#b37a00,#FFE066,#fff6c4,#FFC400,#b37a00,#fff6c4)', fita: '#FFC400', txt: '#0C0C0C', rot: '🥇 1º DA SEMANA', coroa: true },
  2: { anel: 'conic-gradient(from var(--a),#ffffff,#C9D2DC,#7d8896,#eef2f6,#ffffff,#C9D2DC,#7d8896,#ffffff)', fita: '#D6DDE5', txt: '#0C0C0C', rot: '🥈 2º DA SEMANA' },
  3: { anel: 'conic-gradient(from var(--a),#ffe0c2,#D9822B,#7a3e0e,#F0A35E,#ffe0c2,#D9822B,#7a3e0e,#ffe0c2)', fita: '#D9822B', txt: '#fff', rot: '🥉 3º DA SEMANA' },
}
const chip = (nome, tier, selo, pos, depois) => {
  const m = MET[pos]
  const base = `<div class="tec" style="background:${G[tier]}"><span class="ini">${nome[0]}</span><div class="txt"><b>${nome} ${selo}${pos && !depois ? ['', '🥇', '🥈', '🥉'][pos] : ''}</b><small>${tier === 'bege' ? 'grátis' : tier}</small></div></div>`
  if (!depois || !m) return `<div class="slot">${base}</div>`
  return `<div class="slot podio">
    ${m.coroa ? '<span class="coroa">👑</span>' : ''}
    <div class="anel" style="background:${m.anel}"></div>${base}
    <span class="fita" style="background:${m.fita};color:${m.txt}">${m.rot}</span></div>`
}
const lista = depois => [
  chip('LABUBU F.C', 'ouro', '👑', 1, depois), chip('NEYMARJR', 'bege', '', 2, depois), chip('GAMA FC', 'roxo', '💎', 3, depois),
  chip('Butinas', 'bege', '', 0, depois), chip('Paçoca leiloeiro', 'prata', '⭐', 0, depois),
].join('')
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.65}
.cols{display:flex;gap:22px}.col{width:400px}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px 16px 6px}
.box h3{font:700 15px Oswald;text-transform:uppercase;margin:0 0 12px;letter-spacing:.5px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000}
.slot{position:relative;margin-bottom:12px}
.tec{position:relative;z-index:1;display:flex;align-items:center;gap:10px;border:2px solid #0C0C0C;border-radius:12px;padding:8px 10px}
.ini{width:34px;height:34px;border-radius:50%;border:2px solid #0C0C0C;background:#fff;display:flex;align-items:center;justify-content:center;font:700 16px Oswald}
.txt b{display:block;font:700 16px Oswald}.txt small{font-size:11px;font-weight:700;opacity:.65}
.podio{margin:18px 0 22px}
.podio .anel{position:absolute;inset:-6px;border-radius:17px;border:2px solid #0C0C0C;box-shadow:3px 3px 0 #000,0 0 14px rgba(255,196,0,.45);animation:gira 3s linear infinite}
@keyframes gira{to{--a:360deg}}
.fita{position:absolute;z-index:2;right:10px;top:-15px;font:700 12px Oswald;letter-spacing:.06em;border:2px solid #0C0C0C;border-radius:8px;padding:2px 9px;box-shadow:2px 2px 0 #000}
.coroa{position:absolute;z-index:3;left:12px;top:-24px;font-size:24px;transform:rotate(-18deg);filter:drop-shadow(2px 2px 0 #000)}
.nota{margin-top:14px;font-weight:700;font-size:14px;max-width:822px;line-height:1.4}
</style></head><body>
<h1>🏆 Pódio da semana na sala</h1><p class="sub">O fundo continua sendo a cor do PLANO de cada um. O pódio vem POR FORA.</p>
<div class="cols">
 <div class="col"><span class="tag" style="background:#eee">HOJE</span><div class="box"><h3>👥 Técnicos na sala</h3>${lista(false)}</div></div>
 <div class="col"><span class="tag" style="background:#FFC400">COMO FICARIA</span><div class="box"><h3>👥 Técnicos na sala</h3>${lista(true)}</div></div>
</div>
<p class="nota">🥇 1º: moldura de OURO girando + coroinha + fita "1º DA SEMANA" · 🥈 2º: moldura de PRATA + fita · 🥉 3º: moldura de BRONZE + fita.<br>
Vale até pro grátis (o NEYMARJR é bege e ganha a moldura de prata). Saiu do top 3 na semana, perde.</p>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 880, height: 760 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(700)
await p.screenshot({ path: 'scripts/mockups/podio-semana.png', fullPage: true }); await b.close()
console.log('scripts/mockups/podio-semana.png')
