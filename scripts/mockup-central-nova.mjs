// 🧭 22/11 — MOCKUP da Central nova (proposta, NADA no jogo ainda). Diego: *"sinto que essa central toda não está legal… não tá fluindo"*.
// Ideia: sem dias pra passar. A Central abre no PRÓXIMO JOGO; o que aconteceu na semana vira BANNER (com a animação do bairro),
// um de cada vez — só de assistir ou com decisão. Semana sem nada = direto pro jogo.
// Rodar: node scripts/mockup-central-nova.mjs → scripts/mockups/central-nova-cel.png e central-nova-pc.png
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const im = (f, t = 'png') => `data:image/${t};base64,${readFileSync(`scripts/mockups/img-central/${f}`).toString('base64')}`
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const esc = f => `data:image/webp;base64,${readFileSync(`public/escudos-clubes/${f}.webp`).toString('base64')}`
const SAM = esc('sampaio-correa'), BOT = esc('botafogo-sp')
const BRA = im('brasiliense.png'), ITU = im('ituano.png'), BAIRRO = im('bairro.jpg', 'jpeg')
const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D', ROXO = '#7C3AED', RED = '#E8503A'
const CSS = `${FONTES}*{box-sizing:border-box}body{margin:0;background:#0b0a08;font-family:system-ui,sans-serif;color:#F4ECD6}
.o{font-family:Oswald;text-transform:uppercase;font-weight:700}
.tela{background:#14110d;border-radius:26px;border:2px solid #2a241b;padding:16px 14px 0;position:relative;overflow:hidden}
.cab{font:600 11px Oswald;letter-spacing:.14em;color:${GOLD};text-transform:uppercase}.tit{font:700 26px Oswald;text-transform:uppercase;margin:2px 0 12px}
.card{background:#1d1812;border:2px solid #000;border-radius:18px;box-shadow:4px 4px 0 #000;padding:14px}
.rot{font:700 12px Oswald;letter-spacing:.14em;color:${GOLD};text-transform:uppercase;display:flex;justify-content:space-between}
.conf{display:flex;align-items:center;justify-content:space-between;margin:10px 0 4px}.conf img{width:74px;height:74px;object-fit:contain}
.conf .mid{text-align:center;font:700 22px/1 Oswald;color:${GOLD};text-transform:uppercase}.conf .mid small{display:block;font:600 12px Oswald;color:#cfc6ad;margin-top:5px}
.nomes{display:flex;justify-content:space-between;font:700 16px Oswald;text-transform:uppercase}
.q{font:700 15px Oswald;color:${GOLD};text-transform:uppercase;text-align:center;margin:14px 0 8px}
.bt{border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:13px 8px;font:700 17px Oswald;text-transform:uppercase;text-align:center;color:#fff}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.tri{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.bp{border:2px solid #000;border-radius:10px;box-shadow:2px 2px 0 #000;padding:8px 4px;font:700 13px Oswald;text-transform:uppercase;text-align:center;color:#fff}
.agc{background:#F4ECD6;color:${INK};border:2px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;margin-top:12px;overflow:hidden}
.agt{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:3px solid ${INK};font:700 15px Oswald;letter-spacing:.08em;text-transform:uppercase}.agt a{font:700 12px Oswald;color:#C9A000;text-transform:none;letter-spacing:0}
.lj{display:flex;align-items:center;gap:9px;padding:8px 10px;border-top:2px solid #ddd3bc}.lj:nth-child(2){border-top:0}
.dt{width:44px;flex:none;text-align:center;border:2px solid ${INK};border-radius:8px;background:#fff;line-height:1.05;padding:3px 0;font-family:Oswald;text-transform:uppercase}.dt small{display:block;font-size:9px;font-weight:700}.dt b{display:block;font-size:17px}
.lj img{width:30px;height:30px;object-fit:contain}.tx2{flex:1;min-width:0;line-height:1.2}.tx2 b{display:block;font:700 14px Oswald;text-transform:uppercase}.tx2 small{display:block;font:700 10.5px system-ui;color:#555}.tx2 em{display:block;font:800 10.5px system-ui;font-style:normal;color:#7a5a1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pill{border:2px solid ${INK};border-radius:99px;background:#fff;padding:3px 9px;font:700 11px Oswald;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.ag{margin-top:14px}.ag h4{margin:0 0 6px;font:700 12px Oswald;letter-spacing:.14em;color:${GOLD};text-transform:uppercase}
.ln{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px dashed #3a3226;font:600 14px system-ui}.ln:first-of-type{border-top:0}
.dia{background:${GREEN};border-radius:8px;padding:3px 8px;font:700 12px Oswald;color:#fff;text-transform:uppercase;min-width:54px;text-align:center}
.ln img{width:30px;height:30px;object-fit:contain}.ln b{font:700 15px Oswald;text-transform:uppercase}.onde{margin-left:auto;font:700 11px Oswald;text-transform:uppercase;color:#bdb39a;white-space:nowrap}.onde.casa{color:#7CE08E}
.h{margin-left:8px;background:#2a241b;border-radius:7px;padding:2px 7px;font:700 12px Oswald}
.ban{background:#fff;color:${INK};border:3px solid #000;border-radius:18px;box-shadow:4px 4px 0 #000;overflow:hidden}
.ban .arte{height:170px;background:url(${BAIRRO}) center/cover;position:relative}
.selo{position:absolute;left:10px;top:10px;background:${INK};color:${GOLD};border-radius:9px;padding:4px 10px;font:700 12px Oswald;letter-spacing:.1em;text-transform:uppercase}
.ban .tx{padding:12px 14px 14px}.ban .k{font:700 12px Oswald;letter-spacing:.12em;color:${RED};text-transform:uppercase}
.ban h3{margin:2px 0 4px;font:700 22px/1.05 Oswald;text-transform:uppercase}.ban p{margin:0;font:600 14px/1.35 system-ui;color:#3b352b}
.efe{display:inline-block;margin-top:8px;background:#E6F4EA;border:2px solid ${INK};border-radius:9px;padding:3px 9px;font:700 13px Oswald;text-transform:uppercase}
.pont{display:flex;gap:6px;justify-content:center;margin:10px 0 2px}.pont i{width:8px;height:8px;border-radius:9px;background:#4a4132}.pont i.on{background:${GOLD}}
.mini{display:flex;align-items:center;gap:10px;background:#1d1812;border:2px solid #000;border-radius:14px;padding:8px 12px;margin-top:12px;font:700 14px Oswald;text-transform:uppercase}
.mini img{width:30px;height:30px;object-fit:contain}.mini span{margin-left:auto;color:${GOLD}}
.abas{display:flex;justify-content:space-between;margin:14px -14px 0;padding:10px 14px 12px;border-top:2px solid #2a241b;font:700 9.5px Oswald;text-transform:uppercase;color:#bdb39a}
.abas b{background:${GOLD};color:${INK};border-radius:10px;padding:8px 9px}
.leg{font:700 15px Oswald;text-transform:uppercase;color:${GOLD};margin:0 0 8px}.leg small{display:block;font:600 12px system-ui;text-transform:none;color:#cfc6ad;margin-top:2px}`
const abas = `<div class="abas"><b>Central</b><span>Jogos + Tabela</span><span>Elenco</span><span>Mercado</span><span>Rank</span><span>Clube</span></div>`
const topo = `<div class="cab">Brasiliense · Temporada 2 · Série C</div><div class="tit">Central da carreira</div>`
const confronto = `<div class="rot"><span>⚽ Próximo jogo</span><span>Rodada 15</span></div>
<div class="conf"><img src="${BRA}"><div class="mid">Dom 9 · 16h<small>☀️ Liga · em casa</small></div><img src="${ITU}"></div>
<div class="nomes"><span>Brasiliense</span><span>Ituano</span></div>`
// 🔁 22/11 (Diego: *"tá muito exagerado os botões de decisão de placar, campo 2D ou 3D"*): uma fileira de 3 botões pequenos
const botoes = `<div class="q">Ver o jogo em</div><div class="tri"><div class="bp" style="background:${GREEN}">📺 2D</div><div class="bp" style="background:${ROXO}">🏟️ 3D</div><div class="bp" style="background:${GOLD};color:${INK}">⚡ Placar</div></div>`
// 🔁 22/11 (Diego: *"a forma como tá essa agenda aqui tá mais bonita"*): é a agenda "Próximos jogos" que JÁ existe na Central (central.tsx, CentralAgenda)
const jogo = (dow, d, mes, img, nome, onde, casa) => `<div class="lj"><span class="dt"><small>${dow}</small><b>${d}</b><small>${mes}</small></span><img src="${img}"><span class="tx2"><b>${nome}</b><small>Brasileirão Série C</small><em>📍 ${casa ? 'no seu estádio · ' : ''}${onde}</em></span><span class="pill">${casa ? '🏟️ Casa' : '🚌 Fora'}</span></div>`
const agenda = `<div class="agc"><div class="agt"><span>🗓️ Próximos jogos</span><a>jogos ›</a></div>${jogo('Dom', 16, 'Mai', SAM, 'Sampaio Corrêa', 'Castelão (MA)', false)}${jogo('Dom', 30, 'Mai', BOT, 'Botafogo-SP', 'Boca do Jacaré', true)}</div>`
const mini = `<div class="mini"><img src="${BRA}">× <img src="${ITU}">Ituano · dom 9<span>a seguir ›</span></div>`
const banAssistir = `<div class="ban"><div class="arte"><span class="selo">🎥 Na semana · no bairro</span></div><div class="tx">
<div class="k">🚌 Sexta-feira</div><h3>O ônibus do Ituano chegou</h3><p>A torcida foi receber na porta do estádio. Clima de jogo grande no domingo.</p>
<span class="efe">🎟️ Bilheteria +8% neste jogo</span></div></div>
<div class="pont"><i class="on"></i><i></i></div>
<div class="bt" style="background:${GOLD};color:${INK};margin-top:8px">Seguir ›</div>`
const banDecisao = `<div class="ban"><div class="arte" style="background-position:30% 60%"><span class="selo">🎥 Na semana · no bairro</span></div><div class="tx">
<div class="k">🍻 Quinta-feira · pede decisão</div><h3>Seu atacante fugiu do treino</h3><p>Foi visto na balada na véspera do coletivo. O grupo está de olho no que você vai fazer.</p></div></div>
<div class="pont"><i></i><i class="on"></i></div>
<div class="duo" style="margin-top:8px;margin-bottom:0"><div class="bt" style="background:${RED}">Multar<br><small style="font:600 11px system-ui;text-transform:none">+15 🪙 · ele joga chateado</small></div>
<div class="bt" style="background:${GREEN}">Passar pano<br><small style="font:600 11px system-ui;text-transform:none">grupo perde respeito</small></div></div>`
const telaJogo = `<div class="tela">${topo}<div class="card">${confronto}${botoes}</div>${agenda}${abas}</div>`
const telaBan = b => `<div class="tela">${topo}${b}${mini}${abas}</div>`
const cel = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
body{width:1290px;padding:26px}.g{display:grid;grid-template-columns:repeat(3,390px);gap:30px;align-items:start}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px;color:#fff}.sub{font:600 15px system-ui;color:#cfc6ad;margin:0 0 20px}</style></head><body>
<h1>Central nova · sem dias pra passar</h1><p class="sub">Voltou do jogo → a semana aparece em banners, um de cada vez → o próximo jogo já está pronto.</p>
<div class="g">
<div><p class="leg">1 · Banner só de assistir<small>a animação do bairro continua; um toque e segue</small></p>${telaBan(banAssistir)}</div>
<div><p class="leg">2 · Banner com decisão<small>só quando acontece; a escolha muda algo de verdade</small></p>${telaBan(banDecisao)}</div>
<div><p class="leg">3 · O jogo<small>semana sem nada cai direto aqui</small></p>${telaJogo}</div>
</div></body></html>`
const pc = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
body{width:1280px;padding:26px}.tela{padding:22px 24px 22px}.cols{display:grid;grid-template-columns:1.15fr 1fr;gap:22px;align-items:start}
.ban .arte{height:300px}.tit{font-size:32px}h1{font:700 26px Oswald;text-transform:uppercase;margin:0 0 14px;color:#fff}
.dim{opacity:.55}</style></head><body><h1>Computador · banner da semana à esquerda, o jogo esperando à direita</h1>
<div class="tela">${topo}<div class="cols"><div>${banAssistir}</div><div class="card dim">${confronto}${botoes}${agenda}</div></div></div></body></html>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
for (const [html, w, f] of [[cel, 1290, 'central-nova-cel.png'], [pc, 1280, 'central-nova-pc.png']]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 }); await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500)
  await p.screenshot({ path: `scripts/mockups/${f}`, fullPage: true }); await p.close(); console.log(f)
}
await b.close()
