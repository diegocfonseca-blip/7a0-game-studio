// ─── 📣 ARTES DE LANÇAMENTO: 📋 LIGA DRAFT + 📺 CAMPO 2D (05/11) ──────────────────────────────────────────────────────
// Pedido do Diego (05/11): *"me mande mais artes pro feed e artes também pros stories e arte também pra comunidade do zap"*.
// Mesma identidade dos posts de sempre (creme, borda preta, sombra dura, Oswald). Imagens REAIS do jogo em scripts/posts/img/.
// Gera 4 PNGs (feed 1080×1350 + stories 1080×1920, de cada um). As da comunidade do zap saem do `aviso-comunidade.mjs`
// (scripts/avisos/2026-11-05-liga-draft.json e 2026-11-05-campo2d.json).
// ⛔ Postar só quando liberar pra todos (hoje os dois são só da conta do Diego/testadores).
//   node scripts/post-lancamento-draft-2d.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(f).toString('base64')
const img = f => `data:image/png;base64,${b64(`scripts/posts/img/${f}`)}`
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', ROXO = '#7C3AED'

const base = (w, h, corpo) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;overflow:hidden;font-family:system-ui,sans-serif;color:${INK};
 background:radial-gradient(circle at 50% 28%,#FFF6DD 0,#F4ECD6 55%,#E9DDB9 100%)}
.wrap{position:relative;width:${w}px;height:${h}px;padding:60px 64px;display:flex;flex-direction:column}
.topo{display:flex;justify-content:space-between;align-items:center}
.marca{font:700 40px Oswald}.marca b{color:${RED}}
.selo{font:700 30px Oswald;color:#fff;border:4px solid ${INK};border-radius:16px;padding:8px 22px;box-shadow:5px 5px 0 ${INK};text-transform:uppercase}
.chega{font:700 40px Oswald;text-transform:uppercase;opacity:.55;margin-top:30px}
h1{font:700 150px/0.88 Oswald;text-transform:uppercase;letter-spacing:-1px}
.it{display:flex;align-items:center;gap:20px;background:#fff;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};padding:16px 22px;font-size:32px;font-weight:800;line-height:1.2}
.it .ic{flex:none;width:68px;height:68px;border:4px solid ${INK};border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:36px}
.it b{font-weight:900}
.cta{margin-top:auto;display:flex;align-items:center;justify-content:space-between;background:${INK};color:#fff;border-radius:26px;padding:24px 30px;box-shadow:8px 8px 0 ${GOLD}}
.cta p{font:700 40px Oswald;text-transform:uppercase}.cta small{display:block;font:500 24px system-ui;opacity:.75;margin-top:4px;text-transform:none}
.url{font:700 30px Oswald;color:${GOLD}}
.foto{border:6px solid ${INK};border-radius:28px;box-shadow:10px 10px 0 ${INK};overflow:hidden;background:#123}
.foto img{display:block;width:100%}
</style></head><body><div class="wrap">${corpo}</div></body></html>`
const item = (ic, cor, txt) => `<div class="it"><span class="ic" style="background:${cor}">${ic}</span><span>${txt}</span></div>`
const topo = (selo, cor) => `<div class="topo"><p class="marca">⚽ Leilão <b>Legends</b></p><span class="selo" style="background:${cor}">${selo}</span></div>`

// ── 📋 LIGA DRAFT ──
const DRAFT_ITENS = [
  item('🏆', GOLD, 'A liga da sua <b>turma</b>, que <b>não acaba</b>'),
  item('📋', '#E9D9FF', 'Noite do draft: o <b>campeão escolhe primeiro</b>, 1 jogador de <b>todo o jogo</b>'),
  item('☝️', '#FFE0D6', 'Um <b>Neymar só</b> pra liga inteira'),
  item('🕵️', '#DDF3E4', 'Ou <b>sonda o amigo</b>: o jogador dele vai pro <b>leilão</b>'),
]
const draftFeed = base(1080, 1350, `${topo('🆕 chegou', ROXO)}
  <p class="chega">chegou finalmente</p><h1 style="color:${ROXO}">Liga Draft</h1>
  <div style="display:flex;gap:30px;margin-top:30px;align-items:flex-start">
    <div style="flex:1;display:flex;flex-direction:column;gap:16px">${DRAFT_ITENS.join('')}</div>
    <div class="foto" style="width:330px;flex:none;transform:rotate(3deg);background:#000"><img src="${img('draft-romario.png')}"></div>
  </div>
  <div class="cta"><p>🌐 Salas online → 📋 Liga Draft<small>criar é do ⭐ plano · entrar na liga do amigo é de graça</small></p><span class="url">leilaolegends.com</span></div>`)
const draftStory = base(1080, 1920, `${topo('🆕 chegou', ROXO)}
  <p class="chega" style="margin-top:60px">chegou finalmente</p><h1 style="color:${ROXO};font-size:190px">Liga<br>Draft</h1>
  <div class="foto" style="width:520px;margin:46px auto 0;transform:rotate(-3deg);background:#000"><img src="${img('draft-romario.png')}"></div>
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:50px">${DRAFT_ITENS.slice(0, 3).join('')}</div>
  <div class="cta"><p>🌐 Salas online → 📋 Liga Draft<small>chama a turma e monta a sua</small></p><span class="url">leilaolegends.com</span></div>`)

// ── 📺 CAMPO 2D ──
const C2D_ITENS = [
  item('⚽', GOLD, 'O <b>jogo inteiro</b> rolando no campinho'),
  item('🎙️', '#FFE0D6', '<b>Narração</b> de cada lance e o <b>GOOOL</b>'),
  item('🎽', '#E9D9FF', 'A <b>sua formação</b> manda: cada um na vaga que você escalou'),
  item('🌍', '#DDF3E4', 'Liga, copas, Liberta, Champions, <b>Copa do Mundo</b>'),
]
const c2dFeed = base(1080, 1350, `${topo('🆕 chegou', GREEN)}
  <p class="chega">chegou finalmente</p><h1 style="color:${GREEN}">Campo 2D</h1>
  <div style="display:flex;gap:30px;margin-top:30px;align-items:flex-start">
    <div style="flex:1;display:flex;flex-direction:column;gap:16px">${C2D_ITENS.join('')}</div>
    <div class="foto" style="width:360px;flex:none;transform:rotate(2deg)"><img src="${img('campo2d-a.png')}"></div>
  </div>
  <div class="cta"><p>📺 Na sala, quem cria escolhe<small>quem entra assiste de graça</small></p><span class="url">leilaolegends.com</span></div>`)
const c2dStory = base(1080, 1920, `${topo('🆕 chegou', GREEN)}
  <p class="chega" style="margin-top:60px">chegou finalmente</p><h1 style="color:${GREEN};font-size:180px">Campo 2D</h1>
  <div class="foto" style="width:620px;margin:40px auto 0;transform:rotate(-2deg)"><img src="${img('campo2d-a.png')}"></div>
  <div style="display:flex;flex-direction:column;gap:18px;margin-top:46px">${C2D_ITENS.slice(0, 3).join('')}</div>
  <div class="cta"><p>📺 Campo 2D<small>o jogo rolando na sua frente</small></p><span class="url">leilaolegends.com</span></div>`)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [html, w, h, out] of [
  [draftFeed, 1080, 1350, 'scripts/posts/liga-draft-feed.png'], [draftStory, 1080, 1920, 'scripts/posts/liga-draft-stories.png'],
  [c2dFeed, 1080, 1350, 'scripts/posts/campo2d-feed.png'], [c2dStory, 1080, 1920, 'scripts/posts/campo2d-stories.png'],
]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.setContent(html, { waitUntil: 'load' })
  await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: out })
  await p.close()
  console.log('🖼️', out)
}
await b.close()
