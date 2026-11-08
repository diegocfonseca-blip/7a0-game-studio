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
.rod{position:relative;padding:22px 16px 96px;text-align:center;font:500 12px system-ui;color:#a5a394}.rod .soc{display:flex;gap:8px;justify-content:center;margin-bottom:12px}.rod .soc span{font:700 12px Oswald;color:#fff;border:2px solid #444;border-radius:999px;padding:5px 12px}
.selo{position:absolute;left:12px;top:12px;font:700 10px Oswald;letter-spacing:1px;background:#C2452F;color:#fff;border-radius:6px;padding:3px 7px;z-index:5}.varzea{position:relative;height:96px;margin-top:12px;border:3px solid #000;border-radius:12px;overflow:hidden;background:repeating-linear-gradient(90deg,#9a7444 0 22px,#a17b49 22px 44px)}
.varzea:before{content:'';position:absolute;inset:8px 12px;border:2px solid #f4ecd6a0;border-radius:2px}.varzea .meio{position:absolute;left:50%;top:8px;bottom:8px;border-left:2px solid #f4ecd6a0}.varzea .meio:after{content:'';position:absolute;left:-15px;top:50%;width:26px;height:26px;margin-top:-13px;border:2px solid #f4ecd6a0;border-radius:50%}
.varzea .trave{position:absolute;top:30px;width:10px;height:36px;border:3px solid #fff;background:#fff3}.varzea .trave.l{left:4px;border-left:0}.varzea .trave.r{right:4px;border-right:0}
.varzea .bola{position:absolute;left:62%;top:44px;font-size:16px}.varzea .seta{position:absolute;left:8px;bottom:6px;font:700 11px Oswald;background:#0c0c0cd0;border-radius:6px;padding:2px 7px;letter-spacing:.5px}.varzea .seta b{color:#FFC400}
.sala{margin-top:12px;background:#0c0c0c66;border:2px solid #0006;border-radius:12px;padding:8px 10px}.sala .lb{font:700 11px Oswald;letter-spacing:.6px}.chips{display:flex;gap:5px;margin-top:6px}.chips i{font:700 11px Oswald;font-style:normal;color:#fff;border:2px solid #000;border-radius:8px;padding:4px 6px}.chips .mais{background:#0c0c0c}
.coracao{display:flex;flex-direction:column;gap:10px}.cl{display:flex;gap:10px;align-items:flex-start;background:#F4ECD6;color:#0c0c0c;border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:12px}
.cl .n{flex:none;width:26px;height:26px;border-radius:50%;background:#1B7A3D;color:#fff;font:700 15px/26px Oswald;text-align:center}.cl .e{font-size:26px;line-height:1}.cl b{display:block;font:700 18px/1.05 Oswald;text-transform:uppercase}.cl small{display:block;font:500 12.5px/1.3 system-ui;margin-top:3px;opacity:.8}
.modos{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.modos span{font:700 11.5px Oswald;background:#fff;border:2px solid #000;border-radius:8px;padding:2px 7px}
.nav{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-around;background:#0c0c0c;border-top:3px solid #FFC400;padding:8px 4px 12px}.nav span{position:relative;display:flex;flex-direction:column;align-items:center;font:700 11px Oswald;color:#cfc8b4;letter-spacing:.4px}.nav i{font-style:normal;font-size:22px;margin-bottom:2px}.nav .on1{color:#FFC400}.nav .lj{color:#FFC400}.nav em{position:absolute;top:-4px;right:-6px;font:700 10px/16px Arial;font-style:normal;background:#C2452F;color:#fff;border-radius:50%;width:16px;height:16px;text-align:center}
`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="pg"><div class="art"></div>
<div class="top"><div class="brand"><small>O LEILÃO DAS LENDAS</small>LEILÃO LEGENDS</div><div class="acts"><span class="pill">🇧🇷 BR</span><span class="pill">🔇</span><span class="conta">👤 Conta</span></div></div>
<div class="hero"><h1>O PREGÃO<br>ESTÁ ABERTO.</h1>
<p>Dispute as <b>lendas do futebol no leilão</b>, monte seu time e prove no campeonato que você entende de bola.</p>
<div class="cta"><div class="b1">▶ JOGAR AGORA<small>partida rápida contra a máquina</small></div><div class="b2">🔑 Entrar numa sala com código</div></div>
<div class="vivo"><span><i></i>SALAS ROLANDO AGORA</span><span>·</span><span>2.400+ CARTAS DE LENDAS</span></div></div>
<div class="sec"><p class="eye">ESCOLHA COMO JOGAR</p>
<div class="card r"><h3>⚡ Partida rápida</h3><p>Você contra os bots. Leilão, revelação e campeonato numa sentada.</p>
<div class="faces">${rosto}<span>Romário, Ronaldinho e +2.400</span></div><div class="row"><span class="bt">JOGAR</span></div></div>
<div class="card on"><span class="tag">AO VIVO</span><h3>🌐 Jogar online</h3><p>A galera toda no mesmo pregão. Quem lê melhor o leilão leva a taça.</p>
<div class="sala"><span class="lb">🔨 SALA DO PEDRÃO · 8/20</span><div class="chips"><i style="background:#FFC400">FAB</i><i style="background:#2B6CFF">CHE</i><i style="background:#C2452F">ARR</i><i style="background:#1B7A3D">K9</i><i style="background:#fff;color:#000">MON</i><i class="mais">+3</i></div></div>
<div class="row"><span class="bt">CRIAR SALA</span><span class="bt o">SALAS ABERTAS</span></div></div>
<div class="card ca"><h3>⭐ Modo carreira</h3><p>Comece no campinho de terra da Várzea e suba até a Série A: estádio, patrocínio, copas e Mundial.</p>
<div class="varzea"><div class="trave l"></div><div class="trave r"></div><div class="meio"></div><span class="bola">⚽</span><span class="seta">VÁRZEA → D → C → B → <b>A</b> 🏆</span></div>
<div class="row"><span class="bt">CONTINUAR CARREIRA</span></div></div></div>
<div class="sec"><p class="eye">O CORAÇÃO DO JOGO: O LEILÃO</p><div class="coracao">
<div class="cl"><span class="n">1</span><span class="e">💰</span><div><b>Todo mundo começa com 100 moedas</b><small>o mesmo dinheiro pra cada técnico</small></div></div>
<div class="cl"><span class="n">2</span><span class="e">🔨</span><div><b>Dispute as lendas no lance</b><small>escolha o jeito da sala:</small><div class="modos"><span>✉️ Envelope</span><span>🐊 Tocaia</span><span>🔨 Pregão aberto</span><span>⚡ Envelope único</span></div></div></div>
<div class="cl"><span class="n">3</span><span class="e">🏆</span><div><b>Monte o time e jogue</b><small>no fim, o campeonato mostra quem gastou melhor</small></div></div></div></div>
<div class="rod"><div class="soc"><span>💬 Comunidade</span><span>📸 Instagram</span><span>💛 Planos</span></div>leilaolegends.com · Seu clube. Sua história.</div>
<nav class="nav"><span class="on1"><i>🏠</i>Início</span><span class="lj"><i>🛒</i>Loja</span><span><i>👥</i>Amigos<em>2</em></span><span><i>🏛️</i>Salão</span><span><i>📜</i>Regras</span></nav>
</div></body></html>`
writeFileSync('/tmp/claude-0/home/proposta2.html', html)
const { chromium } = createRequire(import.meta.url)('playwright')
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })
await p.goto('file:///tmp/claude-0/home/proposta2.html'); await p.waitForTimeout(500)
await p.locator('.pg').screenshot({ path: '/tmp/claude-0/home/proposta2-cel.png' }); await b.close()
