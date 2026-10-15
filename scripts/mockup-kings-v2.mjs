#!/usr/bin/env node
// 🎨 MOCKUP KINGS LEAGUE v2 (15/10) — o que o Diego cobrou depois de jogar a 1ª versão na tela de sempre:
// *"a bola qd inicia o jogo ela cai do alto no meio do campo… o jogo inicia 1x1 com goleiro e a cada minuto vai aumentando
// até 7x7… o dado é grande e tem que ser imersivo, jogado na tela, com a cara do rei e mais duas coisas… o pênalti do
// presidente cada um bate uma vez sem apertar nada, com contagem… no mesmo momento pra todos, um minuto pro time 1 e outro
// pro time 2… a carta secreta é sorteada, ninguém escolhe, cada hora é a vez de um"*.
// Regras conferidas (15/10): regulamento oficial PT de 14/10/2025 + página "Como se joga" + Arena/Portal da Kings.
// uso: node scripts/mockup-kings-v2.mjs → scripts/mockups/kings-v2.png
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => 'data:image/webp;base64,' + readFileSync(f).toString('base64')
const ESC_A = img('src/escalacao/img/fabulous-escudo.webp')
const tela = (n, titulo, corpo, nota = '') => `<div class="tl"><div class="nn">${n}</div><div class="tela">${titulo ? `<h1>${titulo}</h1>` : ''}${corpo}</div>${nota ? `<p class="nt">${nota}</p>` : ''}</div>`
const escB = `<div class="escb">NZ</div>`
const placar = (min, ga, gb, extra = '') => `<div class="pl"><div class="pt"><img src="${ESC_A}"/><b>Fabulous EC</b></div><div class="pc"><s>${ga} × ${gb}</s><i>${min}'</i></div><div class="pt d">${escB}<b>Neymarzetti</b></div>${extra}</div>`
const campo = (dentro, cls = '') => `<div class="campo ${cls}"><svg viewBox="0 0 100 60" preserveAspectRatio="none"><g fill="none" stroke="rgba(255,255,255,.8)" stroke-width=".7"><rect x="3" y="4" width="94" height="52" rx="2"/><line x1="50" y1="4" x2="50" y2="56"/><circle cx="50" cy="30" r="8"/><rect x="3" y="17" width="12" height="26"/><rect x="85" y="17" width="12" height="26"/></g></svg>${dentro}</div>`
const jog = (x, y, c, gk = false) => `<i class="jg ${gk ? 'gk' : ''}" style="left:${x}%;top:${y}%;background:${c}"></i>`
const ban = (ic, tag, tit, txt) => `<div class="ban"><div class="bi">${ic}</div><small>👑 KINGS LEAGUE · ${tag}</small><b>${tit}</b><p>${txt}</p></div>`

// 1 · a bola cai da gaiola
const t1 = tela(1, '', `${placar(0, 0, 0)}
${campo(`<div class="gaiola"><div class="grade"></div></div><div class="queda"></div><div class="bola">⚽</div>${jog(40, 50, '#C2452F')}${jog(60, 50, '#7C3AED')}${jog(7, 50, '#C2452F', true)}${jog(93, 50, '#7C3AED', true)}<div class="cont">3</div>`, 'noite')}
${ban('⚽', 'PONTAPÉ', 'A BOLA CAI DO ALTO!', 'Na Kings não tem saída no meio: a bola cai de uma <b>gaiola no teto</b>, no meio do campo, e começa <b>1 contra 1</b> (mais os goleiros). Quem chegar primeiro, leva.')}`,
'Contagem 3-2-1, a gaiola abre e a bola cai quicando no meio. Os dois correm. Mesmo momento em todos os jogos da rodada.')

// 2 · entra 1 por minuto
const pinos = n => Array.from({ length: 7 }, (_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('')
const t2 = tela(2, '', `${placar(3, 1, 0)}
${campo(`${jog(7, 50, '#C2452F', true)}${jog(93, 50, '#7C3AED', true)}${jog(30, 30, '#C2452F')}${jog(36, 66, '#C2452F')}${jog(45, 45, '#C2452F')}${jog(58, 35, '#7C3AED')}${jog(66, 62, '#7C3AED')}${jog(55, 55, '#7C3AED')}<div class="entra">➕ ENTROU MAIS UM!</div>`)}
<div class="emcampo"><b>EM CAMPO: 4 × 4</b><div class="pin">${pinos(4)}</div><small>Entra 1 de cada lado por minuto: 1×1 no 0' → <b>7×7 no 6'</b></small></div>`,
'Faixa fixa embaixo do placar, só nos 6 primeiros minutos. Cada bolinha acende quando entra mais um.')

// 3 · o dado gigante
const t3 = tela(3, '', `${placar(18, 2, 2)}
${campo('', 'escuro')}
<div class="dadobox"><div class="cubo"><div class="f f1">👑<small>CARA DO REI</small></div><div class="f f2">2×2</div><div class="f f3">3×3</div></div><div class="sombra"></div></div>
${ban('🎲', 'MINUTO 18 · O DADO', '👑 CARA DO REI!', 'Até o intervalo é <b>1 contra 1 com goleiro</b>. O dado tem 3 coisas: 👑 <b>cara do rei</b> (1×1), <b>2×2</b> e <b>3×3</b> — duas faces de cada.')}`,
'O dado GIGANTE é jogado na tela, quica e gira até parar na face. Aí sobe o banner explicando. Mesmo resultado pros dois times do jogo.')

// 4 · pênalti do presidente
const zona = (t, s = '') => `<div class="z ${s}">${t}</div>`
const t4 = tela(4, '', `<div class="duelo"><small>🎩 12' · PÊNALTI DO PRESIDENTE</small><b>O SEU PRESIDENTE BATE!</b>
<div class="relogio">⏱️ 4</div>
<div class="gol">${zona('↖')}${zona('↑')}${zona('↗', 'sel')}${zona('↙')}${zona('↓')}${zona('↘')}<div class="gk">🧤</div></div>
<p>Toque no canto. <b>Não tocou até zerar? O jogo bate sozinho.</b></p></div>
<div class="duelo2"><small>NA TELA DO NEYMARZETTI, NA MESMA HORA</small><b>🧤 DEFENDA! ⏱️ 4</b><p>Toque pra onde o goleiro pula. Bot pula sozinho.</p></div>`,
'Ninguém aperta botão pra pedir: no 12\' é a vez do presidente da CASA, no 27\' a do VISITANTE. Mesmo minuto em todos os jogos da rodada.')

// 5 · carta secreta sorteada
const mini = (ic, t) => `<div class="mc">${ic}<b>${t}</b></div>`
const t5 = tela(5, '', `${placar(15, 2, 1)}
<div class="vez">🃏 15' · VEZ DO <b>FABULOUS EC</b></div>
<div class="carta"><div class="ct">CARTA SORTEADA</div><div class="ci">✖️2</div><b>GOL EM DOBRO</b><p>Por 4 minutos, todo gol do Fabulous EC vale 2!</p><div class="tempo">⏳ 4:00</div></div>
<div class="lb">O QUE PODE SAIR (ninguém escolhe):</div>
<div class="mcs">${mini('⚽', 'Pênalti')}${mini('🏃', 'Shootout')}${mini('🟥', 'Suspensão 4\'')}${mini('✖️2', 'Gol em dobro 4\'')}${mini('⭐', 'Jogador estrela')}${mini('🔄', 'Pênalti inverso')}${mini('🃏', 'Coringa')}</div>`,
'A carta vira na tela sozinha. Pênalti e shootout de carta = batida na mão, igual o presidente (com contagem).')

// 6 · o roteiro do jogo
const lt = (m, ic, t, c = '') => `<div class="li ${c}"><i>${m}</i><span>${ic}</span><b>${t}</b></div>`
const t6 = tela(6, '🗓️ Roteiro de todo jogo', `<div class="rot">
${lt("0'", '⚽', 'A bola cai da gaiola · 1×1')}
${lt("1'–6'", '➕', 'Entra 1 por minuto até 7×7')}
${lt("12'", '🎩', 'Pênalti do presidente · CASA', 'r')}
${lt("15'", '🃏', 'Carta sorteada · CASA', 'v')}
${lt("18'", '🎲', 'O DADO: 👑 1×1 · 2×2 · 3×3')}
${lt("20'", '⏸️', 'Intervalo')}
${lt("27'", '🎩', 'Pênalti do presidente · FORA', 'r')}
${lt("31'", '🃏', 'Carta sorteada · FORA', 'v')}
${lt("38'", '🟡', 'Bola dourada / 🔴 vermelha')}
${lt("40'", '🥅', 'Empatou? SHOOTOUT (5, do meio, 5s)')}
</div>`, 'Os minutos do presidente e da carta são sorteados por RODADA (casa no 1º tempo, fora no 2º) e valem pra todos os jogos dela. Assim, no online, ninguém se atropela.')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Inter,Arial,sans-serif;color:#0C0C0C;display:grid;grid-template-columns:repeat(3,400px);gap:22px;padding:22px;width:1290px}
.tl{position:relative}.nn{position:absolute;top:-8px;left:-8px;z-index:9;width:32px;height:32px;border-radius:50%;background:#0C0C0C;color:#FFC400;font:700 17px/32px Oswald;text-align:center}
.tela{background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:14px;min-height:600px;position:relative;overflow:hidden}
.nt{font-size:11.5px;font-weight:700;color:#53534b;margin:8px 4px 0;line-height:1.4}
h1{font:700 23px/1 Oswald;text-transform:uppercase;margin:0 0 10px}.lb{font:700 11px Oswald;color:#53534b;margin:10px 0 5px;letter-spacing:.04em}
.pl{display:flex;align-items:center;background:#15191f;color:#fff;border:3px solid #0C0C0C;border-radius:16px;padding:10px 8px;gap:6px}
.pt{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}.pt img{height:46px}.pt b{font:700 13px Oswald}
.escb{width:44px;height:46px;border-radius:10px 10px 22px 22px;background:#222;border:2px solid #FFC400;color:#FFC400;font:700 16px/42px Oswald;text-align:center}
.pc{display:flex;flex-direction:column;align-items:center;background:#F4ECD6;color:#0C0C0C;border-radius:10px;padding:4px 10px}.pc s{text-decoration:none;font:700 30px/1 Oswald}.pc i{font-style:normal;font:700 12px Oswald}
.campo{position:relative;margin-top:10px;height:200px;border:3px solid #0C0C0C;border-radius:14px;overflow:hidden;background:repeating-linear-gradient(90deg,#1f8f4a 0 34px,#1a8042 34px 68px)}.campo svg{position:absolute;inset:0;width:100%;height:100%}
.campo.noite{background:repeating-linear-gradient(90deg,#16683a 0 34px,#135d33 34px 68px)}.campo.escuro{filter:brightness(.4)}
.jg{position:absolute;width:14px;height:14px;border-radius:50%;border:2px solid #fff;transform:translate(-50%,-50%);box-shadow:1px 2px 0 #000}.jg.gk{border-color:#FFC400}
.gaiola{position:absolute;left:50%;top:-6px;transform:translateX(-50%);width:54px;height:40px;border:3px solid #ccc;border-top:none;border-radius:0 0 10px 10px;background:repeating-linear-gradient(90deg,transparent 0 7px,#bbb 7px 9px);box-shadow:0 0 18px rgba(255,255,220,.6)}
.queda{position:absolute;left:50%;top:38px;width:4px;height:70px;transform:translateX(-50%);background:linear-gradient(rgba(255,255,255,0),rgba(255,255,255,.7))}
.bola{position:absolute;left:50%;top:104px;transform:translate(-50%,-50%);font-size:26px;filter:drop-shadow(0 0 8px #fff)}
.cont{position:absolute;right:12px;top:10px;font:700 46px/1 Oswald;color:#FFC400;-webkit-text-stroke:2px #000}
.entra{position:absolute;left:50%;top:10px;transform:translateX(-50%);background:#FFC400;border:3px solid #0C0C0C;border-radius:10px;font:700 14px Oswald;padding:2px 10px;box-shadow:2px 2px 0 #000}
.emcampo{margin-top:10px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:10px;text-align:center;box-shadow:3px 3px 0 #0C0C0C}.emcampo b{font:700 20px Oswald}.pin{display:flex;gap:6px;justify-content:center;margin:6px 0}.pin span{width:22px;height:22px;border-radius:50%;border:3px solid #0C0C0C;background:#ddd}.pin span.on{background:#1B7A3D}.emcampo small{font-size:11.5px;font-weight:600}
.ban{margin-top:10px;background:#FFF6DE;border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #7C3AED;padding:12px;text-align:center}.bi{font-size:34px;line-height:1}.ban small{display:block;font:700 10.5px Oswald;letter-spacing:.14em;color:#7C3AED;margin-top:2px}.ban>b{display:block;font:700 25px/1.05 Oswald;margin-top:2px}.ban p{font-size:12px;font-weight:600;margin:6px 0 0;line-height:1.45}
.dadobox{position:absolute;left:50%;top:150px;transform:translateX(-50%);z-index:4;perspective:400px}
.cubo{width:110px;height:110px;position:relative;transform-style:preserve-3d;transform:rotateX(-22deg) rotateY(-32deg)}
.f{position:absolute;width:110px;height:110px;background:#fff;border:5px solid #0C0C0C;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 40px Oswald}
.f small{font:700 11px Oswald;letter-spacing:.06em}
.f1{transform:translateZ(55px);background:#FFC400;font-size:52px}.f2{transform:rotateY(90deg) translateZ(55px)}.f3{transform:rotateX(90deg) translateZ(55px)}
.sombra{width:120px;height:18px;margin:14px auto 0;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px)}
.dadobox+.ban{margin-top:150px}
.duelo{background:#0C0C0C;color:#fff;border-radius:18px;padding:14px;text-align:center;position:relative}.duelo small{font:700 12px Oswald;color:#FFC400;letter-spacing:.1em}.duelo>b{display:block;font:700 26px Oswald;margin:2px 0}
.relogio{display:inline-block;margin-top:4px;font:700 26px Oswald;color:#0C0C0C;background:#FFC400;border:3px solid #fff;border-radius:12px;padding:0 8px}
.gol{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px;margin:10px 0;border:5px solid #fff;border-bottom:none;background:repeating-linear-gradient(45deg,rgba(255,255,255,.15) 0 6px,transparent 6px 12px)}
.z{background:rgba(255,255,255,.12);border:2px solid #fff;border-radius:9px;font:700 22px Oswald;padding:10px 0}.z.sel{background:#FFC400;color:#0C0C0C;box-shadow:0 0 14px #FFC400}
.gk{position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);font-size:30px}
.duelo p{font-size:12px;font-weight:600;margin:4px 0 0}
.duelo2{margin-top:12px;background:#fff;border:3px dashed #0C0C0C;border-radius:14px;padding:10px;text-align:center}.duelo2 small{font:700 11px Oswald;color:#53534b}.duelo2 b{display:block;font:700 22px Oswald}.duelo2 p{font-size:12px;font-weight:600;margin:2px 0 0}
.vez{margin-top:10px;background:#7C3AED;color:#fff;border:3px solid #0C0C0C;border-radius:12px;font:700 16px Oswald;text-align:center;padding:6px;box-shadow:3px 3px 0 #0C0C0C}
.carta{margin:12px auto 0;width:220px;background:linear-gradient(160deg,#C9A8FF,#7C3AED);color:#fff;border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;padding:12px;text-align:center;transform:rotate(-3deg)}
.ct{font:700 11px Oswald;letter-spacing:.16em;color:#FFC400}.carta .ci{font:700 46px Oswald;line-height:1.1}.carta b{font:700 24px Oswald;display:block}.carta p{font-size:12px;font-weight:600;margin:4px 0}.tempo{display:inline-block;background:#0C0C0C;border-radius:8px;font:700 14px Oswald;padding:2px 10px}
.mcs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.mc{background:#fff;border:2px solid #0C0C0C;border-radius:9px;text-align:center;padding:4px 2px;font-size:15px}.mc b{display:block;font:700 10px Oswald}
.rot{display:flex;flex-direction:column;gap:6px}.li{display:flex;align-items:center;gap:8px;background:#fff;border:3px solid #0C0C0C;border-radius:11px;padding:6px 9px}.li i{font-style:normal;font:700 13px Oswald;width:48px}.li span{font-size:18px}.li b{font:700 14px Oswald}.li.r{background:#FFE0D6}.li.v{background:#EDE3FF}
</style></head><body>${t1}${t2}${t3}${t4}${t5}${t6}</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1290, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `kings2-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400)
await p.screenshot({ path: 'scripts/mockups/kings-v2.png', fullPage: true }); await b.close()
console.log('🎨 scripts/mockups/kings-v2.png')
