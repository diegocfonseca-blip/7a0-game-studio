// ─── 💙 CASA LUCA — MOCKUP (PROPOSTA, nada disso existe no jogo) ──────────────
// 8 telas de celular (390×844, escala 2) pro Diego aprovar o projeto solidário.
// Tudo marcado PROPOSTA; nome "CASA LUCA" é PROVISÓRIO; a instituição é um ESPAÇO
// RESERVADO (nenhum nome/logo/foto de instituição real); nada é dito sobre o filho
// do Diego — só "o jogo nasceu por um motivo especial", marcado TEXTO PROVISÓRIO.
// Nomes de clube nas telas são de EXEMPLO (inventados).
//
// uso (da RAIZ do repo): node scripts/mockups/casa-luca/gera.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '../../..')
const req = createRequire(resolve(RAIZ, 'package.json'))
let chromium
try { ({ chromium } = req('playwright-core')) } catch { ({ chromium } = createRequire('/home/user/7a0-game-studio/package.json')('playwright-core')) }
const font = w => 'file://' + resolve(RAIZ, `scripts/fonts/oswald-latin-${w}-normal.woff2`)

const AZUL = '#2F6FD6', AZUL2 = '#1C4FA6', AZULC = '#DCE8FB'

const CSS = `
@font-face{font-family:Oswald;font-weight:700;src:url(${font(700)})}
@font-face{font-family:Oswald;font-weight:600;src:url(${font(600)})}
@font-face{font-family:Oswald;font-weight:500;src:url(${font(500)})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:390px;height:844px;overflow:hidden}
body{background:#F4ECD6;color:#0C0C0C;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.3;position:relative}
.osw{font-family:Oswald,'Noto Color Emoji';font-weight:700;text-transform:uppercase;letter-spacing:.01em}
.hdr{height:52px;display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:3px solid #0C0C0C;background:#F4ECD6}
.back{width:34px;height:34px;border:3px solid #0C0C0C;border-radius:10px;background:#fff;box-shadow:2px 2px 0 #000;display:grid;place-items:center;font-weight:900;font-size:16px}
.marca{font-family:Oswald;font-weight:700;font-size:19px;text-transform:uppercase}.marca em{font-style:normal;color:#C2452F}
.lang{margin-left:auto;font-family:Oswald;font-weight:700;font-size:12px;border:2px solid #0C0C0C;border-radius:8px;padding:2px 7px;background:#fff}
.proposta{height:24px;display:flex;align-items:center;justify-content:center;gap:8px;background:#7C3AED;color:#fff;border-bottom:3px solid #0C0C0C;font-family:Oswald;font-weight:700;font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}.proposta i{font-style:normal;font-family:Inter;font-weight:600;font-size:10.5px;letter-spacing:0;text-transform:none;opacity:.85}
.pg{padding:14px 16px 0}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;height:54px;border:3px solid #0C0C0C;border-radius:14px;box-shadow:4px 4px 0 #000;background:#FFC400;font-family:Oswald;font-weight:700;font-size:20px;text-transform:uppercase}
.btn.azul{background:${AZUL};color:#fff}.btn.verde{background:#1B7A3D;color:#fff}.btn.verm{background:#C2452F;color:#fff}.btn.br{background:#fff}
.prov{display:inline-block;border:2px dashed #7C3AED;color:#7C3AED;background:#F3EDFF;border-radius:7px;font-family:Oswald;font-weight:600;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;padding:1px 6px;vertical-align:middle;white-space:nowrap}
.res{display:inline-block;border:2px dashed #0C0C0C;background:#FFF6D1;border-radius:7px;padding:0 6px;font-weight:700;white-space:nowrap}
h2.sec{font-family:Oswald;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.04em;margin:14px 0 7px;display:flex;align-items:center;gap:6px}
.en{font-size:10.5px;opacity:.5;font-style:italic}
.chip{color:#0C0C0C;display:inline-flex;align-items:center;gap:5px;border:2px solid #0C0C0C;border-radius:10px;padding:4px 9px;background:#fff;font-weight:700;font-size:12.5px;box-shadow:2px 2px 0 #000}
.selo{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:6px;background:${AZULC};border:1.5px solid ${AZUL2};font-size:11px;line-height:1}
`

const shell = (corpo, { hdr = true, titulo = '' } = {}) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
${hdr ? `<div class="hdr"><div class="back">‹</div><div class="marca">${titulo || 'Leilão <em>Legends</em>'}</div><div class="lang">BR | EN</div></div>` : ''}
<div class="proposta">Proposta <i>· mockup pro Diego aprovar · ainda não existe no jogo</i></div>
${corpo}</body></html>`

// ── 1. PLANO CORAÇÃO ─────────────────────────────────────────────────────────
const t1 = shell(`<div class="pg">
<div style="margin:0 0 8px;font-size:11.5px;font-weight:700">💙 <span class="osw" style="font-size:13px">Casa Luca</span> <span class="prov">nome provisório</span></div>
<div class="box" style="background:linear-gradient(160deg,${AZUL},${AZUL2});color:#fff;padding:16px 16px 14px;text-align:center;position:relative;overflow:hidden">
  <div style="position:absolute;right:-14px;top:-18px;font-size:92px;opacity:.16">💙</div>
  <div style="font-size:46px;line-height:1">💙</div>
  <div class="osw" style="font-size:34px;line-height:1.05;margin-top:6px">Plano Coração</div>
  <div style="display:flex;gap:6px;justify-content:center;margin-top:9px;flex-wrap:wrap">
    <span class="chip" style="background:#FFC400;font-size:12px">🎁 PRESENTE</span>
    <span class="chip" style="background:#fff;font-size:12px">R$ 0,00</span>
    <span class="chip" style="background:#fff;font-size:12px">♾️ PRA SEMPRE</span>
  </div>
  <div style="margin-top:9px;font-size:12.5px;font-weight:600;opacity:.95">Um plano de presente do Leilão Legends.<br><span style="opacity:.75;font-size:10.5px;font-style:italic">A gift plan — free, forever.</span></div>
</div>

<h2 class="sec">👥 Pra quem é</h2>
<div style="display:grid;gap:7px">
  <div class="box" style="padding:9px 12px;display:flex;gap:10px;align-items:center;box-shadow:3px 3px 0 #000"><span style="font-size:24px">♿</span><div><b>Pessoa com deficiência (PcD)</b><div class="en">Person with a disability</div></div></div>
  <div class="box" style="padding:9px 12px;display:flex;gap:10px;align-items:center;box-shadow:3px 3px 0 #000"><span style="font-size:24px">🧑‍🧒</span><div><b>Pai, mãe ou responsável de criança especial</b><div class="en">Parent or caregiver of a child with special needs</div></div></div>
</div>

<h2 class="sec">⭐ O que você ganha <span style="font-family:Inter;font-weight:600;font-size:11px;text-transform:none;letter-spacing:0;opacity:.6">— igual ao ⭐ Craque</span></h2>
<div class="box" style="padding:10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:7px 10px;font-weight:700;font-size:12.5px;box-shadow:3px 3px 0 #000">
  <div>💾 Salvar a carreira</div><div>🎮 Modo Manual</div>
  <div>📺 Campo 2D</div><div>🗂️ 2 fichas de carreira</div>
  <div>🔒 Nome do clube reservado</div><div>🧑‍💼 Seu presidente</div>
</div>
<div style="margin-top:9px;font-size:11.5px;font-weight:600;display:flex;gap:6px;align-items:flex-start"><span>🤫</span><span>Discreto: ninguém vê que é o Plano Coração. Só você sabe.</span></div>

<div class="btn azul" style="margin-top:14px">💙 Pedir o Plano Coração</div>
<div style="text-align:center;margin-top:8px;font-size:11.5px;font-weight:600">Sem pagar nada · aprovação em até <span class="res">X dias</span></div>
</div>`)

// ── 2. PEDIDO ────────────────────────────────────────────────────────────────
const t2 = shell(`<div class="pg">
<div class="osw" style="font-size:24px;line-height:1.05">💙 Pedir o Plano Coração</div>
<div style="font-size:12px;font-weight:600;opacity:.7;margin-top:3px">2 passos rápidos. Ninguém além do Diego vê.</div>

<h2 class="sec"><span class="chip" style="padding:0 7px;box-shadow:none;background:#FFC400">1</span> Quem é você?</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
  <div class="box" style="padding:10px 9px;text-align:center;box-shadow:3px 3px 0 #000"><div style="font-size:26px">♿</div><div class="osw" style="font-size:15px;margin-top:2px">Sou PcD</div><div class="en">I have a disability</div></div>
  <div class="box" style="padding:10px 9px;text-align:center;background:${AZULC};border-color:${AZUL2};box-shadow:3px 3px 0 ${AZUL2};position:relative"><div style="position:absolute;top:-9px;right:-8px;background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:50%;width:24px;height:24px;display:grid;place-items:center;font-weight:900;font-size:13px">✓</div><div style="font-size:26px">🧑‍🧒</div><div class="osw" style="font-size:15px;margin-top:2px;line-height:1.1">Sou pai/mãe/<br>responsável</div></div>
</div>

<h2 class="sec"><span class="chip" style="padding:0 7px;box-shadow:none;background:#FFC400">2</span> Mande UM documento</h2>
<div style="display:flex;border:3px solid #0C0C0C;border-radius:12px;overflow:hidden;font-family:Oswald;font-weight:700;font-size:13px;text-transform:uppercase">
  <div style="flex:1;text-align:center;padding:7px 4px;background:#0C0C0C;color:#FFC400">🪪 Carteirinha</div>
  <div style="flex:1;text-align:center;padding:7px 4px;background:#fff">📄 Laudo</div>
</div>
<div style="font-size:11px;font-weight:600;opacity:.7;margin:5px 2px 7px">CIPTEA, carteira PcD ou carteirinha do seu estado/cidade.</div>
<div class="box" style="padding:10px;display:flex;gap:10px;align-items:center;border-style:dashed;box-shadow:none">
  <div style="width:74px;height:50px;border-radius:8px;border:2px solid #0C0C0C;background:repeating-linear-gradient(135deg,#d9d2bf 0 6px,#cfc7b2 6px 12px);display:grid;place-items:center;font-size:20px;filter:blur(.3px)">🪪</div>
  <div style="flex:1;min-width:0"><b style="font-size:12.5px">foto_carteirinha.jpg</b><div style="font-size:11px;color:#1B7A3D;font-weight:700">✓ pronta pra enviar</div><div style="font-size:11px;opacity:.6;font-weight:600">trocar foto</div></div>
</div>

<div class="box" style="margin-top:14px;padding:11px 12px;background:#FFF6D1;border-color:#C2452F;box-shadow:4px 4px 0 #C2452F">
  <div class="osw" style="font-size:16px;color:#C2452F">🔒 Sua privacidade</div>
  <div style="font-size:13px;font-weight:700;margin-top:4px;line-height:1.35">Sua foto só é vista pelo Diego pra aprovar e é <span style="background:#C2452F;color:#fff;padding:0 4px;border-radius:4px">APAGADA</span> logo depois.</div>
  <div style="font-size:12.5px;font-weight:600;margin-top:4px">Fica guardado só: <span class="chip" style="padding:1px 7px;box-shadow:none;font-size:11.5px">✅ aprovado</span></div>
  <div class="en" style="margin-top:4px">Only Diego sees your photo; it's deleted right after. We keep only "approved".</div>
</div>
<div style="text-align:center;margin:10px 0 0;font-weight:700;font-size:12.5px">⏳ Aprovação em até <span class="res">X dias</span></div>
<div class="btn azul" style="margin-top:10px">Enviar pedido</div>
</div>`)

// ── 3. ADMIN ─────────────────────────────────────────────────────────────────
const foto = () => `<div style="width:116px;height:78px;flex:none;border-radius:9px;border:2px solid #0C0C0C;background:repeating-linear-gradient(135deg,#d9d2bf 0 7px,#cdc5af 7px 14px);position:relative;overflow:hidden">
  <div style="position:absolute;left:8px;top:9px;width:26px;height:32px;border-radius:5px;background:#b8af98"></div>
  <div style="position:absolute;left:42px;top:12px;right:8px;height:6px;border-radius:3px;background:#b8af98"></div>
  <div style="position:absolute;left:42px;top:24px;right:20px;height:6px;border-radius:3px;background:#b8af98"></div>
  <div style="position:absolute;left:42px;top:36px;right:30px;height:6px;border-radius:3px;background:#b8af98"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;background:#0C0C0Ccc;color:#fff;font-size:9.5px;font-weight:700;text-align:center;padding:2px">🔍 tocar = ampliar</div></div>`
const pedido = (n, conta, tipo, quando, doc) => `<div class="box" style="padding:10px;margin-bottom:10px;box-shadow:3px 3px 0 #000">
  <div style="display:flex;gap:10px">
    ${foto()}
    <div style="min-width:0;flex:1">
      <div class="osw" style="font-size:14px">Pedido #${n}</div>
      <div style="font-size:11.5px;font-weight:700;margin-top:1px">${conta}</div>
      <div style="font-size:11.5px;margin-top:3px"><span class="chip" style="padding:0 6px;font-size:11px;box-shadow:none">${tipo}</span></div>
      <div style="font-size:11px;opacity:.65;font-weight:600;margin-top:4px">${doc} · ${quando}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px">
    <div class="btn verde" style="height:40px;font-size:15px;box-shadow:3px 3px 0 #000">✅ Aprovar</div>
    <div class="btn verm" style="height:40px;font-size:15px;box-shadow:3px 3px 0 #000">❌ Recusar</div>
  </div></div>`
const t3 = shell(`<div class="pg">
<div style="display:flex;align-items:center;gap:8px"><span class="chip" style="background:#0C0C0C;color:#FFC400;box-shadow:none">#admin</span><span style="font-size:11px;font-weight:700;opacity:.6">só a conta do Diego</span></div>
<div class="osw" style="font-size:22px;margin-top:6px">💙 Pedidos do Plano Coração</div>
<div style="display:flex;gap:6px;margin-top:6px"><span class="chip" style="background:#FFC400">⏳ 2 esperando</span><span class="chip">✅ 41 aprovados</span></div>

<div class="box" style="margin:12px 0 12px;padding:9px 11px;background:#FFF6D1;border-color:#C2452F;box-shadow:3px 3px 0 #C2452F;font-size:12.5px;font-weight:700;line-height:1.35">
  🗑️ Ao apertar Aprovar ou Recusar, a <u>foto é APAGADA na hora</u>. Fica só: conta · aprovado/recusado · data.
</div>
${pedido(1, 'jo•••@gmail.com · Leões da Vila EC', '🧑‍🧒 pai/mãe/responsável', 'há 2 h', '🪪 carteirinha')}
${pedido(2, 'ma•••@hotmail.com · Real Quintal FC', '♿ PcD', 'há 5 h', '📄 laudo')}
<div class="box" style="padding:9px 11px;box-shadow:3px 3px 0 #000;opacity:.95">
  <div class="osw" style="font-size:13px;opacity:.7">Já decididos</div>
  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-top:5px"><span>✅ re•••@gmail.com</span><span style="opacity:.6">03/11 · 🗑️ foto apagada</span></div>
  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-top:4px"><span>❌ an•••@gmail.com</span><span style="opacity:.6">02/11 · 🗑️ foto apagada</span></div>
</div>
<div style="font-size:10.5px;opacity:.55;font-weight:600;margin-top:8px">Contas e clubes acima são EXEMPLOS.</div>
</div>`, { titulo: 'Painel do <em>Criador</em>' })

// ── 4. MAPA ──────────────────────────────────────────────────────────────────
const T = 18, OX = 195, OY = 52
let DX = 0
const P = (x0, y, z = 0) => { const x = x0 + DX; return [OX + (x - y) * T, OY + (x + y) * T / 2 - z * T] }
const pts = a => a.map(p => P(...p).map(v => v.toFixed(1)).join(',')).join(' ')
const poly = (a, fill, extra = '') => `<polygon points="${pts(a)}" fill="${fill}" stroke="#0C0C0C" stroke-width="1.6" stroke-linejoin="round" ${extra}/>`
const caixa = (x, y, w, d, h, top, l, r) => poly([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]], top)
  + poly([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]], l)
  + poly([[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, y, h]], r)
const telhado = (x, y, w, d, h, rh, c1, c2) => {
  const ap = [x + w / 2, y + d / 2, h + rh]
  return poly([[x, y + d, h], [x + w, y + d, h], ap], c1) + poly([[x + w, y, h], [x + w, y + d, h], ap], c2)
}
const casa = (x, y, cor, telh) => caixa(x, y, 1.6, 1.6, 1.1, cor, cor, shade(cor)) + telhado(x, y, 1.6, 1.6, 1.1, 0.9, telh, shade(telh))
  + janelaL(x + 0.5, y + 1.6, 0.4)
function shade(hex) { const n = parseInt(hex.slice(1), 16); const f = v => Math.round(v * 0.78); return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('') }
const janelaL = (x, y, z) => poly([[x, y, z], [x + 0.5, y, z], [x + 0.5, y, z + 0.4], [x, y, z + 0.4]], '#9CD3F5')
const janelaR = (x, y, z) => poly([[x, y, z], [x, y + 0.5, z], [x, y + 0.5, z + 0.4], [x, y, z + 0.4]], '#9CD3F5')
const arvore = (x, y) => { const [a, b] = P(x, y); return `<rect x="${a - 2}" y="${b - 14}" width="4" height="14" fill="#7A4B22" stroke="#0C0C0C" stroke-width="1.2"/><circle cx="${a}" cy="${b - 20}" r="9" fill="#3E9B4F" stroke="#0C0C0C" stroke-width="1.6"/>` }
const crianca = (x, y, cor, pele = '#E8B48A', bracos = false) => { const [a, b] = P(x, y); return `<g>
  <ellipse cx="${a}" cy="${b}" rx="5" ry="2" fill="#0003"/>
  <rect x="${a - 3.2}" y="${b - 12}" width="6.4" height="9" rx="2.5" fill="${cor}" stroke="#0C0C0C" stroke-width="1.2"/>
  <line x1="${a - 1.5}" y1="${b - 3}" x2="${a - 1.5}" y2="${b}" stroke="#0C0C0C" stroke-width="1.6"/><line x1="${a + 1.5}" y1="${b - 3}" x2="${a + 1.5}" y2="${b}" stroke="#0C0C0C" stroke-width="1.6"/>
  ${bracos ? `<line x1="${a - 3}" y1="${b - 10}" x2="${a - 7}" y2="${b - 15}" stroke="#0C0C0C" stroke-width="1.6"/><line x1="${a + 3}" y1="${b - 10}" x2="${a + 7}" y2="${b - 15}" stroke="#0C0C0C" stroke-width="1.6"/>` : ''}
  <circle cx="${a}" cy="${b - 15.5}" r="3.8" fill="${pele}" stroke="#0C0C0C" stroke-width="1.2"/></g>` }
const cadeira = (x, y) => { const [a, b] = P(x, y); return `<g><ellipse cx="${a}" cy="${b}" rx="7" ry="2.4" fill="#0003"/>
  <circle cx="${a - 2}" cy="${b - 4}" r="4.5" fill="none" stroke="#0C0C0C" stroke-width="1.8"/>
  <rect x="${a - 3.5}" y="${b - 15}" width="7" height="8" rx="2.5" fill="#FFC400" stroke="#0C0C0C" stroke-width="1.2"/>
  <circle cx="${a}" cy="${b - 18.5}" r="3.8" fill="#8D5A3B" stroke="#0C0C0C" stroke-width="1.2"/></g>` }

function mapaSvg() {
  let s = ''
  // chão
  s += poly([[0, 0], [14, 0], [14, 14], [0, 14]], '#8CC46A')
  // ruas
  s += poly([[0, 6], [14, 6], [14, 7.4], [0, 7.4]], '#5B5B5B') + poly([[6.6, 0], [8, 0], [8, 14], [6.6, 14]], '#5B5B5B')
  for (let i = 0.4; i < 14; i += 1.4) { if (i > 6.2 && i < 8.2) continue; s += `<line x1="${P(i, 6.7)[0]}" y1="${P(i, 6.7)[1]}" x2="${P(i + 0.6, 6.7)[0]}" y2="${P(i + 0.6, 6.7)[1]}" stroke="#F4ECD6" stroke-width="1.5"/>` }
  // praça (lado direito de baixo: x 8..14, y 8..14 → praça em x8.6..12.6 y0.6..5.4)
  s += poly([[8.6, 0.6], [13.4, 0.6], [13.4, 5.4], [8.6, 5.4]], '#E7D9B2')
  s += poly([[10.2, 2.2], [11.8, 2.2], [11.8, 3.8], [10.2, 3.8]], '#7FC4EE')
  s += caixa(10.8, 2.8, 0.4, 0.4, 0.7, '#fff', '#ddd', '#bbb')
  s += arvore(9.1, 1.1) + arvore(13, 1.2) + arvore(9.2, 5) + arvore(13, 4.9)
  // bairro residencial (topo esquerdo: x0..6.6 y0..6)
  s += casa(0.8, 0.8, '#F2C9A0', '#C2452F') + casa(3.4, 0.8, '#FFF3C4', '#1B7A3D') + casa(0.8, 3.4, '#D7E9F7', '#C2452F') + casa(3.6, 3.6, '#F7D6E0', '#7C3AED')
  s += arvore(2.8, 2.9) + arvore(5.8, 2.6)
  // casas lá embaixo à direita
  s += casa(1.4, 9.0, '#FFF3C4', '#C2452F') + casa(3.8, 11.4, '#F2C9A0', '#1B7A3D')
  s += arvore(5.2, 8.8) + arvore(1.6, 12.4)
  DX = 7.6 // a Casa Luca fica no quarteirão da FRENTE (embaixo), perto da praça e do bairro
  // ── CASA LUCA (x0.6..5.6, y8.2..13.2): pátio + parquinho + prédio ──
  s += poly([[0.4, 8.0], [6.2, 8.0], [6.2, 13.6], [0.4, 13.6]], '#FBE7A1')
  // borracha colorida do parquinho
  s += poly([[3.8, 11.2], [6.0, 11.2], [6.0, 13.4], [3.8, 13.4]], '#F28C6B')
  // prédio
  const bx = 0.8, by = 8.3, bw = 3.0, bd = 2.6, bh = 2.6
  s += caixa(bx, by, bw, bd, bh, '#FFE07A', '#FFD34D', '#F2B632')
  s += poly([[bx - 0.15, by - 0.15, bh], [bx + bw + 0.15, by - 0.15, bh], [bx + bw + 0.15, by + bd + 0.15, bh], [bx - 0.15, by + bd + 0.15, bh]], AZUL)
  s += poly([[bx - 0.15, by + bd + 0.15, bh - 0.25], [bx + bw + 0.15, by + bd + 0.15, bh - 0.25], [bx + bw + 0.15, by + bd + 0.15, bh], [bx - 0.15, by + bd + 0.15, bh]], AZUL2)
  s += poly([[bx + bw + 0.15, by - 0.15, bh - 0.25], [bx + bw + 0.15, by + bd + 0.15, bh - 0.25], [bx + bw + 0.15, by + bd + 0.15, bh], [bx + bw + 0.15, by - 0.15, bh]], AZUL2)
  // janelas coloridas no lado direito
  s += janelaR(bx + bw, by + 0.4, 1.2) + janelaR(bx + bw, by + 1.6, 1.2) + janelaR(bx + bw, by + 0.4, 0.3)
  // porta (frente esquerda) + coração na fachada
  s += poly([[bx + 1.9, by + bd, 0], [bx + 2.6, by + bd, 0], [bx + 2.6, by + bd, 1.0], [bx + 1.9, by + bd, 1.0]], '#C2452F')
  const [hx, hy] = P(bx + 0.35, by + bd, 2.15)
  s += `<g transform="matrix(${T},${T / 2},0,${T},${hx},${hy})"><path d="M0.7 1.3 C0.1 0.9 -0.05 0.55 0.05 0.32 C0.17 0.05 0.55 0.02 0.7 0.3 C0.85 0.02 1.23 0.05 1.35 0.32 C1.45 0.55 1.3 0.9 0.7 1.3Z" fill="${AZUL}" stroke="#fff" stroke-width="0.09"/></g>`
  s += janelaL(bx + 0.4, by + bd, 0.25)
  // rampa (sobe até a porta, em +y)
  const rx = bx + 1.9, rw = 0.7
  s += poly([[rx, by + bd, 0.35], [rx + rw, by + bd, 0.35], [rx + rw, by + bd + 2.2, 0], [rx, by + bd + 2.2, 0]], '#C9C2AE')
  s += poly([[rx + rw, by + bd, 0], [rx + rw, by + bd + 2.2, 0], [rx + rw, by + bd, 0.35]], '#A9A18B')
  const c1 = P(rx + rw, by + bd, 0.95), c2 = P(rx + rw, by + bd + 2.2, 0.6)
  s += `<line x1="${c1[0]}" y1="${c1[1]}" x2="${c2[0]}" y2="${c2[1]}" stroke="#1B7A3D" stroke-width="2.2"/>`
  // escorregador
  s += caixa(4.2, 11.5, 0.6, 0.6, 1.3, '#7C3AED', '#8E52F0', '#6A2DD0')
  s += poly([[4.2, 12.1, 1.3], [4.8, 12.1, 1.3], [4.8, 13.2, 0.05], [4.2, 13.2, 0.05]], '#FFC400')
  // balanço
  const a1 = P(5.0, 11.4, 0), a2 = P(5.0, 11.4, 1.5), b1 = P(5.9, 11.4, 0), b2 = P(5.9, 11.4, 1.5)
  s += `<g stroke="#0C0C0C" stroke-width="2.2"><line x1="${a1[0]}" y1="${a1[1]}" x2="${a2[0]}" y2="${a2[1]}"/><line x1="${b1[0]}" y1="${b1[1]}" x2="${b2[0]}" y2="${b2[1]}"/><line x1="${a2[0]}" y1="${a2[1]}" x2="${b2[0]}" y2="${b2[1]}" stroke="#C2452F" stroke-width="3"/></g>`
  const sw = P(5.45, 11.4, 0.55), sw0 = P(5.45, 11.4, 1.5)
  s += `<line x1="${sw0[0]}" y1="${sw0[1]}" x2="${sw[0] + 4}" y2="${sw[1]}" stroke="#0C0C0C" stroke-width="1.2"/><rect x="${sw[0]}" y="${sw[1] - 2}" width="9" height="3" fill="#C2452F" stroke="#0C0C0C" stroke-width="1"/>`
  // crianças
  s += crianca(4.5, 13.5, '#C2452F', '#E8B48A', true) + crianca(5.4, 12.6, '#1B7A3D', '#8D5A3B') + crianca(3.2, 12.4, AZUL, '#F1C9A5', true)
  s += cadeira(2.4, 12.2) + crianca(1.4, 12.9, '#FFC400', '#C98D63')
  s += arvore(0.7, 13.2) + arvore(5.9, 8.4)
  DX = 0
  return s
}
const pin = (x, y, txt, cor, fg = '#0C0C0C') => { const [a, b] = P(x, y); return `<div style="position:absolute;left:${a}px;top:${b}px;transform:translate(-50%,-100%);background:${cor};color:${fg};border:2.5px solid #0C0C0C;border-radius:9px;box-shadow:2px 2px 0 #000;font-family:Oswald;font-weight:700;font-size:11.5px;text-transform:uppercase;padding:1px 7px 2px;white-space:nowrap">${txt}</div>` }
const t4 = shell(`
<div style="position:relative;height:400px;background:#BFE3F5;border-bottom:3px solid #0C0C0C;overflow:hidden">
  <svg width="390" height="400" viewBox="0 0 390 400" style="position:absolute;inset:0">${mapaSvg()}</svg>
  <div style="position:absolute;left:12px;top:10px" class="chip">🏙️ Sua cidade</div>
  ${pin(3.3, 3.3, '🏡 Bairro', '#fff')}
  ${pin(9.6, 1.2, '⛲ Praça', '#fff')}
  ${(() => { DX = 7.6; const [a, b] = P(2.3, 9.6, 3.3); DX = 0; return `<div style="position:absolute;left:${a}px;top:${b - 6}px;transform:translate(-50%,-100%);background:${AZUL};color:#fff;border:3px solid #0C0C0C;border-radius:11px;box-shadow:3px 3px 0 #000;font-family:Oswald;font-weight:700;font-size:15px;text-transform:uppercase;padding:2px 10px 3px;white-space:nowrap">💙 Casa Luca</div><div style="position:absolute;left:${a + 44}px;top:${b - 28}px;font-size:24px;transform:rotate(-15deg)">👆</div>` })()}
</div>
<div class="box" style="position:absolute;left:12px;right:12px;top:418px;padding:12px 14px 14px;border-radius:20px">
  <div style="width:44px;height:5px;border-radius:3px;background:#0C0C0C33;margin:-4px auto 8px"></div>
  <div style="display:flex;align-items:center;gap:8px"><span style="font-size:30px">💙</span><div><div class="osw" style="font-size:24px;line-height:1">Casa Luca</div><span class="prov">nome provisório</span></div></div>
  <div style="margin-top:9px;padding:9px 10px;border:2px dashed #7C3AED;border-radius:12px;background:#F8F4FF">
    <span class="prov" style="background:#fff">✏️ Texto provisório — o Diego escreve</span>
    <div style="font-size:13px;font-weight:600;margin-top:5px;line-height:1.4">O jogo nasceu por um motivo especial. Aqui, cada doação vira cuidado de verdade pra crianças e famílias.</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
    <div style="border:3px solid #0C0C0C;border-radius:12px;padding:6px 9px;background:${AZULC}"><div style="font-size:10.5px;font-weight:800;opacity:.7">💙 TOTAL DOADO</div><div class="osw" style="font-size:22px;color:${AZUL2}">R$ 2.340</div><div style="font-size:9.5px;opacity:.55;font-weight:600">valor de exemplo</div></div>
    <div style="border:3px solid #0C0C0C;border-radius:12px;padding:6px 9px;background:#fff"><div style="font-size:10.5px;font-weight:800;opacity:.7">🤝 VAI PRA</div><div style="font-size:11.5px;font-weight:800;margin-top:3px;line-height:1.2"><span class="res" style="white-space:normal">[instituição parceira — a confirmar]</span></div></div>
  </div>
  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:9px;margin-top:12px">
    <div class="btn azul" style="height:48px">💙 Doar</div>
    <div class="btn br" style="height:48px;font-size:16px">🧱 Mural</div>
  </div>
</div>`)

// ── 5. DOAR ──────────────────────────────────────────────────────────────────
const val = (v, sel) => `<div class="box" style="height:62px;display:grid;place-items:center;box-shadow:3px 3px 0 ${sel ? AZUL2 : '#000'};${sel ? `background:${AZUL};color:#fff;border-color:#0C0C0C` : ''}"><div class="osw" style="font-size:${v.length > 6 ? 17 : 24}px">${v}</div></div>`
const t5 = shell(`<div class="pg">
<div class="osw" style="font-size:24px">💙 Doar pra Casa Luca</div>
<div style="font-size:11.5px;font-weight:600;opacity:.7;margin-top:1px">Pix na hora. Qualquer valor ajuda. <span class="prov">nome provisório</span></div>

<div class="box" style="margin-top:12px;padding:10px 12px;background:${AZULC};border-color:${AZUL2};box-shadow:3px 3px 0 ${AZUL2};display:flex;gap:9px;align-items:center">
  <span style="font-size:26px">🤝</span><div style="font-weight:800;font-size:13.5px;line-height:1.3"><span class="osw" style="font-size:20px;color:${AZUL2}">100%</span> vai pra <span class="res" style="white-space:normal">[instituição parceira — a confirmar]</span></div>
</div>

<h2 class="sec">💰 Quanto?</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${val('R$ 5')}${val('R$ 10', true)}${val('R$ 20')}${val('Outro valor')}</div>

<h2 class="sec">🎁 O que você ganha</h2>
<div class="box" style="padding:10px 12px;box-shadow:3px 3px 0 #000">
  <div style="display:flex;gap:9px;align-items:center"><span style="font-size:20px">💙</span><div style="flex:1"><b>Selo de apoiador no nome</b><div style="margin-top:4px"><span class="chip" style="box-shadow:none;font-size:12px">🛡️ Leões da Vila EC <span class="selo">💙</span></span></div></div></div>
  <div style="height:2px;background:#0C0C0C1a;margin:9px 0"></div>
  <div style="display:flex;gap:9px;align-items:center"><span style="font-size:20px">🧱</span><div><b>Seu nome no Mural de Apoiadores</b><div style="font-size:11.5px;opacity:.65;font-weight:600">sem valor e sem posição — todo mundo igual</div></div></div>
</div>
<div style="font-size:11.5px;font-weight:700;margin-top:9px;display:flex;gap:6px"><span>⚖️</span><span>Doação <u>não compra vantagem</u> no jogo. É só carinho.</span></div>

<div class="btn azul" style="margin-top:14px">Gerar Pix de R$ 10</div>
<div class="en" style="text-align:center;margin-top:7px">100% goes to the partner charity. Donors get a 💙 badge and a spot on the Wall.</div>
</div>`)

// ── 6. MURAL ─────────────────────────────────────────────────────────────────
const apoio = (nome, data, novo) => `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:2px solid #0C0C0C14">
  <span class="selo" style="width:22px;height:22px;font-size:13px">💙</span><b style="flex:1;font-size:13px">${nome}</b>${novo ? `<span class="chip" style="padding:0 6px;font-size:10px;box-shadow:none;background:#FFC400">NOVO</span>` : ''}<span style="font-size:11.5px;font-weight:700;opacity:.55">${data}</span></div>`
const t6 = shell(`<div class="pg">
<div class="osw" style="font-size:24px">🧱 Mural de Apoiadores</div>
<div style="font-size:11.5px;font-weight:600;opacity:.7">Casa Luca <span class="prov">nome provisório</span></div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px">
  <div class="box" style="padding:8px 10px;background:${AZUL};color:#fff;box-shadow:3px 3px 0 #000"><div style="font-size:10.5px;font-weight:800;opacity:.85">💙 NOVEMBRO</div><div class="osw" style="font-size:26px">R$ 640</div><div style="font-size:10.5px;font-weight:700;opacity:.85">38 apoiadores</div></div>
  <div class="box" style="padding:8px 10px;box-shadow:3px 3px 0 #000"><div style="font-size:10.5px;font-weight:800;opacity:.7">💙 DESDE O COMEÇO</div><div class="osw" style="font-size:26px;color:${AZUL2}">R$ 2.340</div><div style="font-size:10.5px;font-weight:700;opacity:.6">171 apoiadores</div></div>
</div>
<div style="font-size:10px;opacity:.55;font-weight:600;margin-top:4px">valores e nomes de EXEMPLO</div>

<div style="margin-top:8px;padding:7px 10px;border:2px solid #0C0C0C;border-radius:11px;background:#FFF6D1;font-size:11.5px;font-weight:700;line-height:1.35">🤝 Não é ranking: sem posição e sem valor por pessoa. Quem chegou por último aparece primeiro.</div>

<div class="box" style="margin-top:10px;overflow:hidden;box-shadow:3px 3px 0 #000">
  <div class="osw" style="font-size:13px;padding:6px 10px;background:#0C0C0C;color:#fff">Chegaram agora</div>
  ${apoio('Real Quintal FC', 'hoje', true)}${apoio('Leões da Vila EC', 'hoje', true)}${apoio('Pé de Pano FC', 'ontem')}${apoio('Unidos do Bairro', '03/11')}${apoio('Esporte Clube Varal', '03/11')}${apoio('Fúria Laranja FC', '01/11')}
  <div style="text-align:center;font-size:11.5px;font-weight:800;padding:6px;opacity:.7">ver todos ↓</div>
</div>

<h2 class="sec">📄 Prestação de contas</h2>
<div class="box" style="padding:10px 12px;border-style:dashed;box-shadow:none;display:flex;gap:10px;align-items:center">
  <div style="width:46px;height:56px;flex:none;border:2px dashed #0C0C0C;border-radius:6px;display:grid;place-items:center;font-size:20px;background:#fff">🧾</div>
  <div style="font-size:12px;font-weight:700;line-height:1.35">Recibo de outubro de <span class="res" style="white-space:normal">[instituição parceira]</span><div style="font-size:11px;opacity:.6;margin-top:2px">espaço reservado · o recibo entra aqui todo mês</div></div>
</div>
</div>`)

// ── 7. COPA LUCA + CALENDÁRIO ────────────────────────────────────────────────
const data = (d, m, txt, sub) => `<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:2px solid #0C0C0C14">
  <div style="width:50px;flex:none;border:3px solid #0C0C0C;border-radius:10px;background:${AZUL};color:#fff;text-align:center;box-shadow:2px 2px 0 #000"><div class="osw" style="font-size:20px;line-height:1.1">${d}</div><div class="osw" style="font-size:10px;background:#0C0C0C;color:#fff;border-radius:0 0 6px 6px">${m}</div></div>
  <div style="min-width:0"><b style="font-size:12.5px">${txt}</b><div style="font-size:11px;opacity:.65;font-weight:600">${sub}</div></div></div>`
const t7 = shell(`<div class="pg">
<div class="box" style="padding:12px 14px;background:linear-gradient(160deg,${AZUL},${AZUL2});color:#fff;position:relative;overflow:hidden">
  <div style="position:absolute;right:8px;top:4px;font-size:70px;filter:drop-shadow(3px 3px 0 #000)">🏆</div>
  <div style="position:absolute;right:30px;top:30px;font-size:24px">💙</div>
  <span class="chip" style="background:#FFC400;font-size:11px;padding:2px 8px">🌐 SALA ONLINE ESPECIAL</span>
  <div class="osw" style="font-size:30px;line-height:1.05;margin-top:7px">Copa Luca</div>
  <div style="font-size:12px;font-weight:700;opacity:.9">Beneficente · 1 vez por mês <span class="prov" style="background:#fff">nome provisório</span></div>
  <div style="display:flex;gap:6px;margin-top:9px;flex-wrap:wrap"><span class="chip" style="font-size:11.5px">📅 sáb 06/12 · 20h</span><span class="chip" style="font-size:11.5px">👥 até 20 clubes</span></div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px">
  <div class="box" style="padding:9px 10px;box-shadow:3px 3px 0 #000"><div style="font-size:20px">🎟️</div><b style="font-size:12.5px">Inscrição vira doação</b><div style="font-size:11px;font-weight:600;opacity:.65;margin-top:2px">100% pra <span class="res" style="white-space:normal;font-size:10px">[instituição parceira]</span></div></div>
  <div class="box" style="padding:9px 10px;box-shadow:3px 3px 0 #000"><div style="font-size:20px">🏛️</div><b style="font-size:12.5px">Taça única 💙</b><div style="font-size:11px;font-weight:600;opacity:.65;margin-top:2px">só existe na Copa Luca, vai pra Sala de Troféus</div></div>
</div>
<div class="btn azul" style="margin-top:12px;height:50px">🎟️ Inscrever meu clube · R$ <span class="res" style="color:#0C0C0C">X</span></div>

<h2 class="sec">📅 Datas azuis do ano <span style="font-family:Inter;font-weight:600;font-size:11px;text-transform:none;letter-spacing:0;opacity:.6">— o jogo fica azul</span></h2>
<div class="box" style="padding:3px 12px 4px;box-shadow:3px 3px 0 #000">
  ${data('2', 'ABR', 'Conscientização do Autismo', 'Dia Mundial · tema azul + Copa Luca especial')}
  ${data('21', 'SET', 'Luta da Pessoa com Deficiência', 'Dia Nacional · tema azul + Copa Luca especial')}
  ${data('3', 'DEZ', 'Pessoa com Deficiência', 'Dia Internacional · tema azul + Copa Luca especial').replace('border-bottom:2px solid #0C0C0C14', 'border-bottom:none')}
</div>
<div style="margin-top:9px;display:flex;gap:8px;align-items:center;font-size:11.5px;font-weight:700"><span style="display:inline-flex;gap:3px"><span style="width:18px;height:18px;border:2px solid #0C0C0C;border-radius:5px;background:${AZUL}"></span><span style="width:18px;height:18px;border:2px solid #0C0C0C;border-radius:5px;background:${AZULC}"></span><span style="width:18px;height:18px;border:2px solid #0C0C0C;border-radius:5px;background:#F4ECD6"></span></span>Tema azul: só a cor muda, o jogo é o mesmo.</div>
</div>`)

// ── 8. SELO ──────────────────────────────────────────────────────────────────
const linha = (p, nome, pts, selo, eu) => `<div style="display:flex;align-items:center;gap:7px;padding:6px 9px;border-bottom:2px solid #0C0C0C14;${eu ? 'background:#FFF6D1' : ''}"><b style="width:18px;opacity:.6">${p}</b><span style="width:20px;height:20px;border-radius:50%;border:2px solid #0C0C0C;background:${eu ? '#1B7A3D' : '#ddd'}"></span><b style="flex:1;font-size:13px">${nome} ${selo ? '<span class="selo">💙</span>' : ''}</b><b class="osw" style="font-size:14px">${pts}</b></div>`
const t8 = shell(`<div class="pg">
<div class="osw" style="font-size:22px">💙 Como fica o selo</div>
<div style="font-size:11.5px;font-weight:600;opacity:.7">Pequeno, do lado do nome. Nada de brilho, nada de destaque.</div>

<h2 class="sec">📋 Na tabela</h2>
<div class="box" style="overflow:hidden;box-shadow:3px 3px 0 #000">
  ${linha(1, 'Real Quintal FC', 31, false)}${linha(2, 'Leões da Vila EC', 29, true, true)}${linha(3, 'Pé de Pano FC', 27, true)}
</div>

<h2 class="sec">💬 No chat da sala</h2>
<div class="box" style="padding:9px 10px;box-shadow:3px 3px 0 #000;display:grid;gap:7px">
  <div style="font-size:12.5px"><b>Leões da Vila EC <span class="selo">💙</span></b> <span style="font-weight:600">esse Romário é meu, nem tenta 😤</span></div>
  <div style="font-size:12.5px"><b>Real Quintal FC</b> <span style="font-weight:600">vou cobrir com 40 💸</span></div>
</div>

<h2 class="sec">👤 No perfil</h2>
<div class="box" style="padding:10px 12px;box-shadow:3px 3px 0 #000">
  <div style="display:flex;gap:10px;align-items:center"><div style="width:44px;height:44px;border-radius:12px;border:3px solid #0C0C0C;background:#1B7A3D;display:grid;place-items:center;font-size:22px">🦁</div><div><div class="osw" style="font-size:17px">Leões da Vila EC <span class="selo" style="vertical-align:2px">💙</span></div><div style="font-size:11.5px;font-weight:700;opacity:.65">💙 Apoiador da Casa Luca desde 11/2026</div></div></div>
  <div style="height:2px;background:#0C0C0C1a;margin:10px 0"></div>
  <div style="display:flex;align-items:center;gap:10px"><div style="flex:1"><b style="font-size:13px">Mostrar meu selo 💙</b><div style="font-size:11px;font-weight:600;opacity:.65">Desligou? Some de todo lugar. Você continua no Mural.</div></div>
    <div style="width:52px;height:30px;flex:none;border:3px solid #0C0C0C;border-radius:16px;background:#1B7A3D;position:relative"><div style="position:absolute;right:2px;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid #0C0C0C"></div></div></div>
  <div style="display:flex;align-items:center;gap:10px;margin-top:9px;opacity:.75"><div style="flex:1;font-size:12px;font-weight:700">Desligado fica assim: <span class="chip" style="box-shadow:none;font-size:11.5px;padding:1px 7px">Leões da Vila EC</span></div>
    <div style="width:52px;height:30px;flex:none;border:3px solid #0C0C0C;border-radius:16px;background:#ccc;position:relative"><div style="position:absolute;left:2px;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid #0C0C0C"></div></div></div>
</div>
<div style="font-size:10.5px;opacity:.55;font-weight:600;margin-top:8px">Clubes e conversa acima são EXEMPLOS.</div>
</div>`)

const TELAS = [
  ['casa-luca-1-plano-coracao', t1], ['casa-luca-2-pedido', t2], ['casa-luca-3-admin', t3], ['casa-luca-4-mapa', t4],
  ['casa-luca-5-doar', t5], ['casa-luca-6-mural', t6], ['casa-luca-7-copa', t7], ['casa-luca-8-selo', t8],
]
const exe = process.env.PW_CHROME || '/opt/pw-browsers/chromium'
const b = await chromium.launch({ executablePath: exe })
const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
mkdirSync(AQUI, { recursive: true })
let ruim = 0
for (const [nome, html] of TELAS) {
  writeFileSync(resolve(AQUI, nome + '.html'), html)
  await pg.goto('file://' + resolve(AQUI, nome + '.html'))
  await pg.evaluate(() => document.fonts.ready)
  await pg.waitForTimeout(250)
  // 📏 confere: nada passando do fundo da tela nem estourando pro lado
  const r = await pg.evaluate(() => {
    const fora = []
    for (const e of document.querySelectorAll('body *')) {
      const q = e.getBoundingClientRect()
      if (!q.width || !q.height || e.closest('svg')) continue
      if (q.bottom > 844 + 0.5 || q.right > 390 + 0.5 || q.left < -0.5) fora.push(`${e.tagName}.${e.className} b=${q.bottom | 0} r=${q.right | 0} :: ${(e.textContent || '').slice(0, 30)}`)
      if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === 'visible' && e.children.length === 0) fora.push('estoura ' + (e.textContent || '').slice(0, 30))
    }
    return fora.filter(t => !/^DIV\.\s.*Sua cidade/.test(t))
  })
  if (r.length) { ruim++; console.log('⚠️', nome, r.slice(0, 8)) }
  await pg.screenshot({ path: resolve(AQUI, nome + '.png') })
  console.log('✓', nome)
}
await b.close()
console.log(ruim ? `⚠️ ${ruim} tela(s) com coisa fora` : '✅ nada fora da tela')
