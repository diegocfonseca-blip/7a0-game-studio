// ─── 📢 AVISO DA COMUNIDADE DO WHATSAPP (Diego 12/10) ─────────────────────────
// Pedido dele: *"preciso fazer avisos novos igual o jogo Brasileirinho FC faz, porém
// com as nossas artes padrões"*. O formato copiado é o do aviso deles (data em cima,
// título grande e uma lista de linhas com etiqueta colorida na frente), mas com a CARA
// do Leilão Legends: fundo creme, borda preta grossa, sombra dura, Oswald.
// Mora no repo pra não se perder (lição do mockup do Coringas, que sumiu com o scratchpad).
//
// uso: node scripts/aviso-comunidade.mjs scripts/avisos/<arquivo>.json
//   (rodar da RAIZ do repo — o playwright-core é resolvido daqui)
//
// O JSON:
// {
//   "data": "12 de outubro de 2026",
//   "titulo": "Novo batismo: Inter Vale FC",
//   "destaque": { "escudo": "src/...webp", "mascote": "src/...webp", "camisa": "scripts/kits/...webp",
//                 "passos": [ { "emoji": "🏢", "titulo": "…", "sub": "…" } ]  ← escada no lugar da arte (novidade sem escudo)
//                 "nome": "Inter Vale FC", "linha": "Série C · preto e branco" },   ← opcional
//   "itens": [ { "tag": "batismo|novidade|melhoria|mascote|manto|lenda|emprestimo|venda|saf|meta5|meta7|meta10", "texto": "…" } ],
//   "rodape": "Entre na comunidade…",                                          ← opcional
//   "saida": "scripts/posts/aviso-xxx.png"
// }
// 🚫 Regras que valem aqui também: BUG NUNCA VIRA AVISO (regra de 16/08 — só o que é novo pra
// quem joga) e o post de batismo NÃO diz de quem era a vaga (regra de 05/09).
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const url = p => 'file://' + resolve(p)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
const TAGS = {
  batismo: ['🔨 BATISMO', '#FFC400', '#0C0C0C'],
  novidade: ['🔨 NOVIDADE', '#7C3AED', '#fff'],
  melhoria: ['🔨 MELHORIA', '#1B7A3D', '#fff'],
  apoio: ['🔨 APOIO', '#FFC400', '#0C0C0C'],
  regra: ['🔨 REGRA', '#C2452F', '#fff'],
  mascote: ['🔨 MASCOTE', '#C2452F', '#fff'],
  manto: ['🔨 MANTO', '#0C0C0C', '#FFC400'],
  emprestimo: ['🔨 EMPRÉSTIMO', '#1B7A3D', '#fff'],
  venda: ['🔨 VENDA', '#C2452F', '#fff'],
  saf: ['🔨 SAF', '#7C3AED', '#fff'],
  lenda: ['🔨 LENDA', '#FFC400', '#0C0C0C'],
  loja: ['🔨 LOJA', '#FFC400', '#0C0C0C'],
  plano: ['🔨 PLANOS', '#1B7A3D', '#fff'],
  presente: ['🔨 PRESENTE', '#7C3AED', '#fff'],
  meta5: ['🔨 5 MIL', '#1B7A3D', '#fff'],
  meta7: ['🔨 7 MIL', '#7C3AED', '#fff'],
  meta10: ['🔨 10 MIL', '#FFC400', '#0C0C0C'],
}
const d = spec.destaque
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${url('scripts/fonts/oswald-latin-700-normal.woff2')})}
@font-face{font-family:Oswald5;src:url(${url('scripts/fonts/oswald-latin-500-normal.woff2')})}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Inter,Arial,sans-serif;color:#0C0C0C;width:1080px}
.wrap{padding:56px 54px 46px}
.top{display:flex;align-items:center;justify-content:space-between}
.marca{font:700 30px Oswald;letter-spacing:.02em}.marca span{color:#C2452F}
.pill{border:4px solid #C2452F;color:#C2452F;border-radius:10px;background:#fff;font:700 24px Oswald;letter-spacing:.1em;padding:4px 14px;box-shadow:3px 3px 0 #000}
.card{position:relative;overflow:hidden}
.marca-dagua{position:absolute;right:-40px;bottom:-60px;font-size:330px;opacity:.06;transform:rotate(-25deg);pointer-events:none}
.card{margin-top:30px;background:#fff;border:5px solid #000;border-radius:34px;box-shadow:10px 10px 0 #000;padding:40px 42px 36px}
.data{font:700 22px Oswald;letter-spacing:.16em;color:rgba(0,0,0,.5);text-transform:uppercase}
h1{margin:8px 0 0;font:700 64px/1.02 Oswald;text-transform:uppercase}
.hero{margin-top:30px;border:4px solid #000;border-radius:26px;box-shadow:5px 5px 0 #000;background:linear-gradient(135deg,#FFC400,#FFE27A);display:flex;align-items:flex-end;justify-content:space-around;padding:26px 18px 18px;gap:10px}
.hero img{display:block;object-fit:contain}
.nm{text-align:center;margin-top:10px;font:700 34px Oswald;text-transform:uppercase;line-height:1}
.ln{text-align:center;font:500 20px Oswald5;color:rgba(0,0,0,.7);margin-top:4px}
.it{display:flex;gap:20px;align-items:flex-start;margin-top:26px}
.tag{flex:none;width:186px;margin-top:2px;display:flex;align-items:center;justify-content:center;gap:7px;border:3px solid #000;border-radius:12px;
  font:700 19px Oswald;letter-spacing:.08em;padding:6px 0;box-shadow:4px 4px 0 #000}
.it{padding-bottom:22px;border-bottom:2px dashed rgba(0,0,0,.18)}.it:last-of-type{border-bottom:0;padding-bottom:0}
.tx{font-size:28px;line-height:1.38;font-weight:500}.tx b{font-weight:800}
.rod{margin-top:34px;border:4px solid #000;border-radius:24px;background:#1B7A3D;color:#fff;box-shadow:6px 6px 0 #000;padding:20px 26px;font:700 30px/1.2 Oswald;display:flex;align-items:center;gap:16px}
.rod small{display:block;font:500 21px Oswald5;color:rgba(255,255,255,.85);margin-top:4px}
.passo{flex:1;align-self:stretch;display:flex;flex-direction:column;justify-content:center;background:#fff;border:4px solid #000;border-radius:20px;box-shadow:5px 5px 0 #000;padding:16px 10px;text-align:center}
.passo .pe{font-size:62px;line-height:1}.passo b{display:block;font:700 30px Oswald;text-transform:uppercase;margin-top:6px;line-height:1.05}
.passo span{display:block;font:500 21px Oswald5;color:rgba(0,0,0,.65);margin-top:4px}
.seta{font:700 44px Oswald;align-self:center}
.meta{margin-top:30px;border:4px solid #000;border-radius:26px;box-shadow:5px 5px 0 #000;background:linear-gradient(135deg,#FFC400,#FFE27A);padding:24px 28px 26px}
.meta-top{display:flex;justify-content:space-between;align-items:baseline}.meta-top b{font:700 40px Oswald;text-transform:uppercase}.meta-top em{font:700 84px/1 Oswald;font-style:normal;color:#1B7A3D}
.meta-sub{font:500 24px Oswald5;color:rgba(0,0,0,.7);margin-top:2px}
.meta-bar{position:relative;height:56px;border:5px solid #000;border-radius:20px;background:#fff;margin:62px 0 6px}
.meta-bar>i{position:absolute;inset:0 auto 0 0;border-radius:14px;background:repeating-linear-gradient(135deg,#1B7A3D 0 22px,#239a4e 22px 44px)}
.meta-bar .mk{position:absolute;top:-58px;bottom:-5px;width:5px;margin-left:-2.5px;background:linear-gradient(#0000 0 44px,#000 44px)}
.meta-bar .mk b{position:absolute;top:0;left:50%;transform:translateX(-50%);white-space:nowrap;font:700 22px Oswald;background:#fff;border:3px solid #000;border-radius:10px;padding:2px 10px}
.meta-bar .mk.fim{left:100%}.meta-bar .mk.fim b{left:auto;right:-4px;transform:none}
.meta-cta{margin-top:22px;background:#0C0C0C;color:#FFC400;border:4px solid #000;border-radius:16px;padding:14px 18px;font:700 32px/1.2 Oswald;text-align:center;box-shadow:4px 4px 0 #7C3AED}
.site{text-align:center;margin-top:26px;font:700 24px Oswald;color:rgba(0,0,0,.45);letter-spacing:.06em}
</style></head><body><div class="wrap">
<div class="top"><div class="marca">⚽ LEILÃO <span>LEGENDS</span></div><div class="pill">🔨 BATEU O MARTELO</div></div>
<div class="card"><div class="marca-dagua">🔨</div>
<div class="data">${esc(spec.data)}</div>
<h1>${esc(spec.titulo)}</h1>
${d && d.barra ? (() => { const B = d.barra, sus = B.sustentavel ?? 150, L = v => Math.min(100, v / sus * 100); return `<div class="meta">
  <div class="meta-top"><b>📊 ${esc(B.titulo)}</b><em>${B.pct}%</em></div>
  <div class="meta-sub">${esc(B.sub ?? '')}</div>
  <div class="meta-bar"><i style="width:${L(B.pct)}%"></i><span class="mk" style="left:${L(100)}%"><b>🧾 100% · o jogo se paga</b></span><span class="mk fim"><b>🚀 ${sus}%</b></span></div>
  ${B.cta ? `<div class="meta-cta">${esc(B.cta)}</div>` : ''}
</div>` })() : ''}
${d && !d.barra ? `<div class="hero">
  ${d.escudo ? `<div><img src="${url(d.escudo)}" style="height:230px"></div>` : ''}
  ${d.mascote ? `<div><img src="${url(d.mascote)}" style="height:330px"></div>` : ''}
  ${d.camisa ? `<div><img src="${url(d.camisa)}" style="height:250px"></div>` : ''}
  ${(d.passos ?? []).map((ps, i) => `${i ? '<div class="seta">➜</div>' : ''}<div class="passo"><div class="pe">${ps.emoji}</div><b>${esc(ps.titulo)}</b><span>${esc(ps.sub ?? '')}</span></div>`).join('')}
</div>${d.nome ? `<div class="hero-tx"><div class="nm" style="margin-top:18px">${esc(d.nome)}</div>${d.linha ? `<div class="ln">${esc(d.linha)}</div>` : ''}</div>` : ''}` : ''}
${spec.itens.map(i => { const [t, bg, fg] = TAGS[i.tag] ?? TAGS.novidade; return `<div class="it"><span class="tag" style="background:${bg};color:${fg}">${t}</span><div class="tx">${esc(i.texto)}</div></div>` }).join('')}
</div>
${spec.rodape ? `<div class="rod"><span style="font-size:46px">💬</span><div>${esc(spec.rodape)}${spec.rodapeSub ? `<small>${esc(spec.rodapeSub)}</small>` : ''}</div></div>` : ''}
<div class="site">leilaolegends.com</div>
</div></body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
// a página vai pra um ARQUIVO: aberta em branco (setContent) o navegador bloqueia as imagens e a fonte locais
const tmp = resolve(tmpdir(), `aviso-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.waitForTimeout(600); rmSync(tmp)
await p.screenshot({ path: spec.saida, fullPage: true }); await b.close()
console.log('📢', spec.saida)
