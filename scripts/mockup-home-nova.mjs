import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const R = '/home/user/7a0-game-studio/'
const b64 = f => readFileSync(R + f).toString('base64')
const F = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const ART = `data:image/webp;base64,${b64('src/escalacao/img/home-leilao-v07.webp')}`
const av = n => `data:image/webp;base64,${b64('public/avatars/lendas-v1/' + n + '.webp')}`
const FACES = ['romario-vasco-2000', 'ronaldinho-gaucho-barcelona-2005', 'kaka-milan-2007', 'neymar-santos-2011', 'cafu-milan-2004'].map(av)
const rosto = FACES.map((f, i) => `<img src="${f}" style="z-index:${9 - i}">`).join('')
const css = `${F}*{box-sizing:border-box;margin:0}body{background:#0c0c0c;font-family:system-ui,Arial,sans-serif;color:#fff}
.pg{width:390px;position:relative;overflow:hidden;background:#0c0c0c}
.art{position:absolute;left:0;right:0;top:0;height:640px;background:url(${ART}) center 18%/cover}
.art:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#000a 0,#0000 22%,#0000 48%,#0c0c0c 100%)}
.top{position:relative;display:flex;justify-content:space-between;align-items:center;padding:16px 16px 0}
.brand{font:700 22px/1 Oswald;letter-spacing:.3px;text-shadow:0 2px #000}.brand small{display:block;font:700 9px Arial;letter-spacing:2px;color:#F4ECD6;margin-bottom:4px}.brand:after{content:'';display:block;width:60px;height:3px;background:#FFC400;margin-top:6px;border-radius:2px}
.acts{display:flex;gap:6px;align-items:center}.pill{font:700 12px Oswald;background:#0c0c0cc0;border:2px solid #F4ECD6;border-radius:999px;padding:5px 10px}.conta{font:700 13px Oswald;background:#F4ECD6;color:#0c0c0c;border:2px solid #000;border-radius:10px;box-shadow:2px 2px 0 #000;padding:6px 10px}
.hero{position:relative;padding:150px 18px 0;text-align:center}
.hero h1{font:700 40px/1.02 Oswald;text-shadow:0 3px 10px #000,0 2px #000}
.hero p{margin:12px auto 0;max-width:330px;font:600 15px/1.35 system-ui;color:#F4ECD6;text-shadow:0 2px 6px #000}
.hero p b{color:#FFC400}
.cta{display:flex;flex-direction:column;gap:10px;margin:22px 0 0}
.b1{font:700 26px Oswald;background:#FFC400;color:#0c0c0c;border:4px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;padding:12px}
.b1 small{display:block;font:600 12px system-ui;margin-top:2px}
.b2{font:700 17px Oswald;background:#0c0c0cd0;color:#fff;border:3px solid #F4ECD6;border-radius:14px;padding:10px}
.vivo{position:relative;margin:16px auto 0;display:flex;justify-content:center;gap:8px;font:700 12px Oswald;letter-spacing:.5px;color:#F4ECD6}
.vivo i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#2fd36b;box-shadow:0 0 8px #2fd36b;margin-right:5px}
.sec{position:relative;padding:26px 16px 0}.eye{font:700 13px Oswald;letter-spacing:2px;color:#FFC400;margin-bottom:12px}
.card{border:3px solid #000;border-radius:18px;box-shadow:4px 4px 0 #000;padding:16px;margin-bottom:14px;color:#fff;position:relative}
.card h3{font:700 27px/1 Oswald;display:flex;gap:9px;align-items:center}.card p{font:500 14px/1.35 system-ui;margin-top:6px;opacity:.92}
.faces{display:flex;align-items:center;margin-top:12px}.faces img{width:38px;height:38px;border-radius:50%;border:2px solid #fff;background:#F4ECD6;margin-left:-9px;object-fit:cover;object-position:top}.faces img:first-child{margin-left:0}.faces span{font:600 12.5px system-ui;margin-left:10px;opacity:.9}
.row{display:flex;gap:8px;margin-top:14px}.bt{flex:1;text-align:center;font:700 16px Oswald;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:9px 6px;background:#fff;color:#0c0c0c}.bt.o{background:transparent;color:#fff;border-color:#fff;box-shadow:none}
.r{background:linear-gradient(135deg,#232323,#121212)}.r .bt{background:#FFC400}
.on{background:linear-gradient(135deg,#8B4DF5,#5B21B6)}
.ca{background:linear-gradient(135deg,#22914A,#135C2C)}
.tag{position:absolute;right:12px;top:12px;font:700 11px Oswald;background:#FFC400;color:#000;border:2px solid #000;border-radius:999px;padding:2px 8px}
.passos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ps{background:#F4ECD6;color:#0c0c0c;border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 8px;text-align:center}
.ps .e{font-size:28px}.ps b{display:block;font:700 15px/1.05 Oswald;text-transform:uppercase;margin-top:4px}.ps small{display:block;font:500 11px/1.3 system-ui;margin-top:4px;opacity:.8}
.ps .n{display:inline-block;width:20px;height:20px;border-radius:50%;background:#1B7A3D;color:#fff;font:700 12px/20px Oswald;margin-bottom:2px}
.mini{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.mi{background:#1a1a1a;border:2px solid #3a3a3a;border-radius:12px;padding:10px 4px;text-align:center;font:700 12px Oswald;letter-spacing:.3px}.mi .e{font-size:22px;display:block;margin-bottom:3px}.mi.g{background:#FFC400;color:#000;border-color:#000}
.rod{position:relative;padding:22px 16px 26px;text-align:center;font:500 12px system-ui;color:#a5a394}.rod .soc{display:flex;gap:8px;justify-content:center;margin-bottom:12px}.rod .soc span{font:700 12px Oswald;color:#fff;border:2px solid #444;border-radius:999px;padding:5px 12px}
.selo{position:absolute;left:12px;top:12px;font:700 10px Oswald;letter-spacing:1px;background:#C2452F;color:#fff;border-radius:6px;padding:3px 7px;z-index:5}`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="pg"><div class="art"></div>
<div class="top"><div class="brand"><small>LEILÃO ÀS CEGAS</small>LEILÃO LEGENDS</div><div class="acts"><span class="pill">🇧🇷 BR</span><span class="pill">🔇</span><span class="conta">Minha conta</span></div></div>
<div class="hero"><h1>O PREGÃO<br>ESTÁ ABERTO.</h1>
<p>Dê <b>lance às cegas</b> nas lendas do futebol, monte seu time e prove no campeonato que você entende de bola.</p>
<div class="cta"><div class="b1">▶ JOGAR AGORA<small>partida rápida contra a máquina</small></div><div class="b2">🔑 Entrar numa sala com código</div></div>
<div class="vivo"><span><i></i>SALAS ROLANDO AGORA</span><span>·</span><span>2.400+ CARTAS DE LENDAS</span></div></div>
<div class="sec"><p class="eye">ESCOLHA COMO JOGAR</p>
<div class="card r"><h3>⚡ Partida rápida</h3><p>Você contra os bots. Leilão, revelação e campeonato numa sentada.</p>
<div class="faces">${rosto}<span>Romário, Ronaldinho e +2.400</span></div><div class="row"><span class="bt">JOGAR</span></div></div>
<div class="card on"><span class="tag">AO VIVO</span><h3>🌐 Jogar online</h3><p>A galera toda no mesmo pregão. Quem lê melhor o leilão leva a taça.</p>
<div class="row"><span class="bt">CRIAR SALA</span><span class="bt o">SALAS ABERTAS</span></div></div>
<div class="card ca"><h3>⭐ Modo carreira</h3><p>Comece na Várzea e suba até a Série A: estádio, patrocínio, copas e Mundial.</p>
<div class="row"><span class="bt">CONTINUAR CARREIRA</span></div></div></div>
<div class="sec"><p class="eye">COMO FUNCIONA</p><div class="passos">
<div class="ps"><span class="n">1</span><div class="e">🤫</div><b>Lance às cegas</b><small>ninguém vê quanto você deu</small></div>
<div class="ps"><span class="n">2</span><div class="e">🃏</div><b>Revelação</b><small>o nível da carta só aparece no fim</small></div>
<div class="ps"><span class="n">3</span><div class="e">🏆</div><b>Campeonato</b><small>38 rodadas pra provar quem montou melhor</small></div></div></div>
<div class="sec"><div class="mini"><div class="mi g"><span class="e">🛒</span>LOJA</div><div class="mi"><span class="e">👥</span>AMIGOS</div><div class="mi"><span class="e">🏛️</span>SALÃO</div><div class="mi"><span class="e">📜</span>REGRAS</div></div></div>
<div class="rod"><div class="soc"><span>💬 Comunidade</span><span>📸 Instagram</span><span>💛 Planos</span></div>leilaolegends.com · Seu clube. Sua história.</div>
</div></body></html>`
writeFileSync('/tmp/claude-0/home/proposta.html', html)
const { chromium } = createRequire(import.meta.url)('playwright')
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })
await p.goto('file:///tmp/claude-0/home/proposta.html'); await p.waitForTimeout(500)
await p.locator('.pg').screenshot({ path: '/tmp/claude-0/home/proposta-cel.png' }); await b.close()
