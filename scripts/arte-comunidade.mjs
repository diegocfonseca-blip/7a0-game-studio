// ─── 💬 ARTES PADRÃO DA COMUNIDADE DO WHATSAPP (Diego 13/10) ─────────────────
// Pedido: *"quero arte padrão pra comunidade do zap"*. Uma foto pra cada grupo da comunidade
// (Avisos · Geral - Carreira | Online · Bugs | Sugestões · Grupo VIP) + a da comunidade, todas no
// visual do jogo (creme, borda preta grossa, sombra dura, Oswald). O WhatsApp corta a foto em
// CÍRCULO, então tudo que importa fica dentro do círculo central (margem de ~12%).
//   node scripts/arte-comunidade.mjs   →  scripts/comunidade/*.png (640×640)
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTE = `@font-face{font-family:Osw;font-weight:700;src:url(data:font/woff2;base64,${b64(700)})}`
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ZAP = '#25D366'

const ARTES = [
  { arq: 'comunidade', fundo: CREME, emoji: '⚽', topo: 'leilão', grande: 'LEGENDS', sub: 'comunidade', cor: RED, tinta: INK },
  { arq: 'avisos', fundo: ZAP, emoji: '📢', topo: 'leilão legends', grande: 'AVISOS', sub: 'novidades · batismos', cor: INK, tinta: INK },
  { arq: 'geral', fundo: GREEN, emoji: '🌐', topo: 'carreira | online', grande: 'GERAL', sub: 'bora jogar junto', cor: '#fff', tinta: '#fff' },
  { arq: 'bugs', fundo: '#FFE1DA', emoji: '🐞', emoji2: '💡', topo: 'achou? teve ideia?', grande: 'BUGS', sub: '| sugestões', cor: RED, tinta: INK },
  { arq: 'vip', fundo: INK, emoji: '👑', topo: 'leilão legends', grande: 'VIP', sub: 'craque · lenda · batismo', cor: GOLD, tinta: '#fff', ouro: true },
]
const pagina = a => `<!doctype html><meta charset="utf-8"><style>${FONTE}
*{box-sizing:border-box;margin:0}body{width:640px;height:640px;background:${a.fundo};display:flex;align-items:center;justify-content:center;overflow:hidden;font-family:Osw}
.anel{position:absolute;inset:26px;border-radius:50%;border:10px solid ${INK};box-shadow:10px 10px 0 ${INK}${a.ouro ? `,inset 0 0 0 8px ${GOLD}` : ''}}
${a.ouro ? `body{background:radial-gradient(circle at 50% 40%,#2a2a2a,${INK} 70%)}.anel{border-color:${GOLD};box-shadow:10px 10px 0 #000}` : ''}
.c{position:relative;text-align:center;color:${a.tinta};text-transform:uppercase}
.e{font-size:128px;line-height:1.08;margin-bottom:14px;filter:drop-shadow(6px 6px 0 rgba(0,0,0,.35))}
.t{font-size:34px;letter-spacing:.14em;opacity:.8;margin-top:6px}
.g{font-size:${a.grande.length > 6 ? 104 : 132}px;line-height:.92;color:${a.cor};${a.ouro ? `background:linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70);-webkit-background-clip:text;-webkit-text-fill-color:transparent;` : `-webkit-text-stroke:0;text-shadow:5px 5px 0 ${a.tinta === '#fff' ? INK : 'rgba(0,0,0,.18)'};`}}
.s{font-size:30px;letter-spacing:.06em;margin-top:8px;opacity:.85}
</style><body><div class="anel"></div><div class="c">
<div class="e">${a.emoji}${a.emoji2 ? `<span style="font-size:96px;margin-left:-14px">${a.emoji2}</span>` : ''}</div>
<div class="t">${a.topo}</div><div class="g">${a.grande}</div><div class="s">${a.sub}</div></div></body>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 640, height: 640 } })
for (const a of ARTES) {
  const tmp = resolve(tmpdir(), `arte-${a.arq}.html`); writeFileSync(tmp, pagina(a))
  await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
  await p.screenshot({ path: `scripts/comunidade/${a.arq}.png` }); rmSync(tmp)
}
await b.close()
console.log('💬', ARTES.map(a => `scripts/comunidade/${a.arq}.png`).join(' '))
