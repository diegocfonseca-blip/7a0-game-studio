// 📺 MOCKUP · SEU JOGO AO VIVO NO CAMPINHO (20/10). Diego: *"tá chato… começa a simulação, fica parado… preciso de uma ideia
// imersiva… mas tem outros usuários reais jogando, tem que ser tudo ao mesmo tempo"*. A proposta: cada rodada vira ~90 s de
// jogo pra ASSISTIR (campo visto de cima, os 22 com rosto das lendas), com reação ao vivo (pra cima / fecha) e a preleção no
// intervalo; o gol que aparece é o que o motor JÁ calculou, e todo mundo assiste o próprio jogo no relógio do dono da sala.
// Elencos com cartas REAIS do jogo (rosto = avatar de lenda do próprio jogo).
//   node scripts/mockup-jogo-ao-vivo.mjs  →  scripts/mockups/jogo-ao-vivo.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const AV = n => `data:image/webp;base64,${b64(`public/avatars/lendas-v1/${n}.webp`)}`
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

// x/y em % do campo (y=0 é o gol de cima, onde o MEU time ataca)
const MEU = [
  ['taffarel-internacional-1989', 'Taffarel', 50, 92], ['cafu-milan-2004', 'Cafu', 86, 66], ['roberto-carlos-real-madrid-2002', 'R. Carlos', 14, 60],
  ['carles-puyol-barcelona-2010', 'Puyol', 36, 76], ['alessandro-nesta-milan-2004', 'Nesta', 64, 76],
  ['kaka-milan-2007', 'Kaká', 56, 40], ['zico-flamengo-1981', 'Zico', 30, 46], ['rivaldo-barcelona-1999', 'Rivaldo', 74, 50],
  ['romario-vasco-2000', 'Romário', 47, 17], ['ronaldo-fenomeno-inter-1998', 'Ronaldo', 26, 24], ['bebeto-vasco-1989', 'Bebeto', 76, 26],
]
const DELES = [
  ['petr-cech-chelsea-2005', 'Cech', 50, 5], ['dani-alves-barcelona-2011', 'D. Alves', 18, 22], ['ashley-cole-chelsea-2008', 'A. Cole', 84, 20],
  ['john-terry-chelsea-2007', 'Terry', 40, 14], ['bobby-moore-west-ham-1966', 'B. Moore', 62, 13],
  ['frank-lampard-chelsea-2010', 'Lampard', 44, 32], ['steven-gerrard-liverpool-2009', 'Gerrard', 66, 36], ['eden-hazard-chelsea-2015', 'Hazard', 22, 40],
  ['thierry-henry-arsenal-2004', 'Henry', 58, 58], ['raul-real-madrid-2001', 'Raúl', 38, 62], ['careca-sao-paulo-1986', 'Careca', 72, 66],
]
const jog = ([av, nome, x, y], lado, destaque) => `<div class="j ${lado} ${destaque ? 'dest' : ''}" style="left:${x}%;top:${y}%"><span class="cara"><img src="${AV(av)}"></span><i>${nome}</i></div>`
const campo = (opts = {}) => `<div class="campo ${opts.escuro ? 'escuro' : ''}">
  <div class="linhas"><span class="meio"></span><span class="circ"></span><span class="area a1"></span><span class="area a2"></span><span class="peq p1"></span><span class="peq p2"></span><span class="gol g1"></span><span class="gol g2"></span></div>
  ${opts.passe ? `<svg class="passe" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M56 40 Q 58 28 48.5 19" stroke="#FFC400" stroke-width=".9" stroke-dasharray="2.2 1.6" fill="none"/></svg>` : ''}
  ${MEU.map(p => jog(p, 'meu', opts.passe && p[1] === 'Romário')).join('')}
  ${DELES.map(p => jog(p, 'deles', false)).join('')}
  ${opts.passe ? '<span class="bola" style="left:48.5%;top:20%"></span>' : '<span class="bola" style="left:50%;top:50%"></span>'}
</div>`

const placar = (gm, gd, min, extra = '') => `<div class="placar">
  <div class="time"><span class="esc" style="background:linear-gradient(160deg,#FFE79A,#FFC400 45%,#E8A200)">B</span><b>BUTINAS FC</b></div>
  <div class="num"><b>${gm} × ${gd}</b><small>${min}${extra}</small></div>
  <div class="time dir"><b>FABULOUS EC</b><span class="esc" style="background:linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0);color:#fff">F</span></div>
</div>`
const radio = `<div class="radio"><span class="rtag">📻 OS AMIGOS</span>
  <div class="rl gol"><b>⚽ GOL! K9 FC</b> 2 × 1 Tocaia SC <small>58'</small></div>
  <div class="rl">Chelsão 0 × 0 Raiva Cajuri <small>63'</small></div></div>`

const telaA = `<div class="q"><div class="tag">1 · O JOGO ROLANDO</div><div class="fone">
  ${placar(1, 1, "63'", ' · rodada 14')}
  ${campo({ passe: true })}
  <div class="narra">🎙️ Kaká enfia de primeira… <b>Romário recebe na área, gira em cima do Terry…</b></div>
  <div class="botoes"><span class="rot">SEU TIME ESTÁ:</span>
    <div class="bt on">🔥 PRA CIMA<small>ativo · mais chance, mais risco</small></div><div class="bt">⚖️ EQUILÍBRIO</div><div class="bt">🧱 FECHA</div></div>
  ${radio}
</div></div>`

const telaB = `<div class="q"><div class="tag">2 · O GOL QUE O JOGO JÁ TINHA CALCULADO</div><div class="fone">
  ${placar(2, 1, "64'")}
  <div class="golzao"><div class="gtxt">GOOOOL!</div><div class="gcarta"><span class="cara grande"><img src="${AV('romario-vasco-2000')}"></span><div><b>ROMÁRIO</b><small>Vasco · 2000 · 64'</small><small>🅰️ Kaká</small></div></div>
    <p>O lance que você viu é o gol de verdade: mesmo autor, mesmo minuto, mesmo placar pra sala inteira.</p></div>
  ${campo({ escuro: true })}
  ${radio}
</div></div>`

const telaC = `<div class="q"><div class="tag">3 · INTERVALO · 5 SEGUNDOS</div><div class="fone">
  ${placar(1, 1, 'INTERVALO')}
  <div class="vest"><b>🗣️ VESTIÁRIO</b><span class="rel">⏱ 5s</span>
    <div class="op on">🔥 "Vamos pra cima!"<small>mais ataque no 2º tempo</small></div>
    <div class="op">🧱 "Segura o resultado"<small>mais defesa</small></div>
    <div class="op">😤 Bronca no time<small>tudo ou nada: pode acordar ou desandar</small></div>
    <p>Não escolheu? Fica o equilíbrio. A sala não espera ninguém.</p></div>
  ${campo({ escuro: true })}
</div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:26px;width:1430px}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.65;font-size:14px}
.fila{display:flex;gap:22px;align-items:flex-start}.q{width:450px}
.tag{display:inline-block;font:700 14px Oswald;background:#0C0C0C;color:#FFC400;border-radius:9px;padding:3px 10px;margin-bottom:8px}
.fone{background:#0c0c0c;border:4px solid #0C0C0C;border-radius:30px;padding:12px;box-shadow:6px 6px 0 #0C0C0C;display:flex;flex-direction:column;gap:9px}
.placar{display:flex;align-items:center;gap:8px;background:#151515;border:2px solid #333;border-radius:14px;padding:8px 10px;color:#fff}
.time{flex:1;display:flex;align-items:center;gap:7px;min-width:0}.time.dir{justify-content:flex-end}.time b{font:700 15px Oswald;white-space:nowrap}
.esc{width:30px;height:30px;border-radius:50%;border:2px solid #000;display:grid;place-items:center;font:700 15px Oswald;color:#0C0C0C}
.num{text-align:center}.num b{display:block;font:700 30px Oswald;color:#FFC400;line-height:1}.num small{font:700 11px Oswald;letter-spacing:1px;opacity:.75}
.campo{position:relative;height:520px;border-radius:14px;border:3px solid #0C0C0C;overflow:hidden;background:repeating-linear-gradient(180deg,#2E8B47 0 52px,#27793D 52px 104px)}
.campo.escuro{height:300px;filter:brightness(.55) saturate(.8)}
.linhas span{position:absolute;border:2px solid rgba(255,255,255,.8)}
.meio{left:0;right:0;top:50%;height:0;border-width:2px 0 0 0!important}.circ{width:90px;height:90px;border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)}
.area{left:22%;right:22%;height:16%}.a1{top:-2px}.a2{bottom:-2px}.peq{left:37%;right:37%;height:6%}.p1{top:-2px}.p2{bottom:-2px}
.gol{left:43%;right:43%;height:2%;background:rgba(255,255,255,.4)}.g1{top:-2px}.g2{bottom:-2px}
.passe{position:absolute;inset:0;width:100%;height:100%}
.j{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;z-index:2}
.cara{width:34px;height:34px;border-radius:50%;overflow:hidden;border:3px solid #FFC400;background:#FFE79A;display:block}
.deles .cara{border-color:#8B5CF6;background:#E9DDFE}
.cara img{width:180%;margin-left:-40%;margin-top:-4%;display:block}
.j i{font:700 9.5px Oswald;font-style:normal;color:#fff;background:rgba(0,0,0,.55);border-radius:5px;padding:0 4px;margin-top:1px;white-space:nowrap}
.j.dest .cara{width:44px;height:44px;box-shadow:0 0 0 4px rgba(255,196,0,.45),0 0 18px #FFC400}
.bola{position:absolute;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #0C0C0C;transform:translate(-50%,-50%);z-index:3;box-shadow:0 2px 3px rgba(0,0,0,.4)}
.narra{background:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:8px 10px;font-size:13px;font-weight:600;line-height:1.35}
.botoes{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:6px;align-items:stretch}.rot{grid-column:1/-1;font:700 10px Oswald;letter-spacing:1.2px;color:#bbb}
.bt{font:700 14px Oswald;text-align:center;background:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:8px 4px;display:flex;flex-direction:column;justify-content:center}
.bt small{font:600 9.5px system-ui;opacity:.75;margin-top:2px}.bt.on{background:#E8503A;color:#fff;box-shadow:0 0 0 3px #FFC400}
.radio{background:#151515;border:2px solid #333;border-radius:12px;padding:7px 10px;color:#fff;font-size:12px}
.rtag{font:700 10px Oswald;letter-spacing:1.2px;color:#FFC400}.rl{display:flex;gap:6px;align-items:center;padding:3px 0;opacity:.8}.rl small{margin-left:auto;opacity:.7}
.rl.gol{opacity:1}.rl.gol b{color:#7CE39B}
.golzao{background:radial-gradient(circle at 50% 20%,#3a2c00,#0c0c0c 75%);border:3px solid #FFC400;border-radius:16px;padding:14px;text-align:center;color:#fff}
.gtxt{font:700 54px Oswald;color:#FFC400;line-height:1;letter-spacing:1px;text-shadow:3px 3px 0 #000}
.gcarta{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:10px}.gcarta b{display:block;font:700 26px Oswald;text-align:left}.gcarta small{display:block;font-size:12px;font-weight:700;opacity:.8;text-align:left}
.cara.grande{width:84px;height:84px;border-width:4px}
.golzao p{font-size:11.5px;font-weight:600;opacity:.75;margin:10px 0 0}
.vest{position:relative;background:#F4ECD6;border:3px solid #0C0C0C;border-radius:16px;padding:12px}
.vest>b{font:700 22px Oswald}.rel{position:absolute;right:12px;top:12px;font:700 18px Oswald;background:#E8503A;color:#fff;border:2px solid #000;border-radius:9px;padding:1px 8px}
.op{margin-top:8px;background:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:9px 11px;font:700 17px Oswald;box-shadow:3px 3px 0 #000}.op small{display:block;font:600 11px system-ui;opacity:.65}
.op.on{background:#FFC400}.vest p{margin:9px 0 0;font-size:11.5px;font-weight:700;opacity:.65}
.leg{margin-top:20px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:12px 16px;box-shadow:4px 4px 0 #000;font-size:13.5px;font-weight:700;line-height:1.55}
</style></head><body>
<h1>📺 Seu jogo ao vivo no campinho</h1>
<p class="sub">Cada rodada vira ~90 segundos de jogo pra assistir. Todo mundo assiste o PRÓPRIO jogo ao mesmo tempo, no relógio do dono da sala.</p>
<div class="fila">${telaA}${telaB}${telaC}</div>
<div class="leg">① Os 22 em campo com o rosto das cartas, a bola andando e a narração do lance. Embaixo, 🔥 Pra cima · ⚖️ Equilíbrio · 🧱 Fecha muda os próximos minutos do SEU jogo. No rodapé, a rádio com os jogos dos amigos. ② O gol que aparece é o que o jogo já calculou: mesmo autor, mesmo minuto, mesmo placar pra todos — a animação só conta COMO ele saiu. ③ No intervalo, 5 segundos pra escolher a conversa do vestiário; quem não escolhe fica no equilíbrio e ninguém espera ninguém.</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1430, height: 1000 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(700)
await p.screenshot({ path: 'scripts/mockups/jogo-ao-vivo.png', fullPage: true })
await b.close(); console.log('📸 scripts/mockups/jogo-ao-vivo.png')
