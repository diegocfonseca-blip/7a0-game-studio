#!/usr/bin/env node
// 💬 MOCKUP — RECADO EM DESTAQUE (o "super chat" do letreiro, 18/10). Diego: "muita gente elogiou o painel [anúncio do dia]…
// tipo um super chat que a pessoa deixa uma msg e ele vem com cor diferente". O ANÚNCIO de empresa (R$ 25 / 24 h) continua
// igual; o RECADO é do jogador: R$ 2,99, 1 hora girando no MESMO letreiro, com outra cor e o nome do time de quem mandou.
// uso: node scripts/mockup-recado-destaque.mjs → scripts/mockups/recado-destaque.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C'

const placa = ({ tag, marca, oferta, cor, recado, quem }) => `<div class="placa ${recado ? 'rec' : ''}">
  <div class="led"><span class="tag">${tag}</span>
    ${recado ? `<div class="quem"><span class="bola" style="background:${quem.cor}"></span>${quem.time}</div>` : ''}
    <div class="m" style="color:${cor};text-shadow:0 0 8px ${cor}99">${marca}</div>
    ${oferta ? `<div class="o">${oferta}</div>` : ''}
    <div class="bar" style="background:${cor}"></div></div></div>`

const col = (titulo, cor, corpo) => `<div class="col"><div class="selo" style="background:${cor}">${titulo}</div><div class="fone">${corpo}</div></div>`

const c1 = col('1 · NO LETREIRO', '#7C3AED', `
  <p class="leg">Como já é hoje (anúncio de empresa):</p>
  ${placa({ tag: '📢 ANÚNCIO DO DIA · TOQUE PRA VER › · 2/3', marca: '▶ KELVIN OLIVEIRA', oferta: 'SIGA O NOVO CANAL DO K9 NO YOUTUBE', cor: '#FFC400' })}
  <p class="leg">O recado de um jogador, girando no MESMO letreiro:</p>
  ${placa({ tag: '💬 RECADO DE TORCEDOR · 3/3', marca: 'PARABÉNS THE WOLF, PAPOU TUDO HOJE 🐺', oferta: '', cor: '#FF5FA2', recado: true, quem: { time: 'CHELSÃO DA MASSA FC', cor: '#9BD6A5' } })}
  ${placa({ tag: '💬 RECADO DE TORCEDOR · 1/4', marca: 'BOM DIA GRUPO DA VÁRZEA ☀️ HOJE TEM PREGÃO ABERTO 21H', oferta: '', cor: '#FF5FA2', recado: true, quem: { time: 'MANFRÉ FC', cor: '#FFC400' } })}
  <ul class="notas"><li>Cor própria (rosa) e o selo <b>💬 RECADO</b> — ninguém confunde com propaganda.</li><li>Em cima vai o nome do time de quem mandou, com a bolinha na cor do plano dele.</li><li>Fica <b>1 hora ou o dia todo</b> girando junto com os anúncios, em todas as salas.</li></ul>`)

const c2 = col('2 · NA LOJA', '#1B7A3D', `
  <div class="sec">💬 SEU RECADO NO JOGO</div>
  <div class="card col2"><div class="topo"><div class="ic">💬</div><div class="tx"><b>RECADO EM DESTAQUE</b><span>Escreva um recado (até 60 letras) e ele gira no letreiro de todas as salas, na cor de recado e com o nome do seu time.</span></div></div>
    <div class="dois"><button class="rosa"><small>1 HORA</small>R$ 2,99</button><button class="rosa forte"><small>DIA TODO · 24 H</small>R$ 9,90</button></div></div>
  <div class="sec" style="margin-top:14px">💼 SUA MARCA NO JOGO <small>pra empresas</small></div>
  <div class="card col2"><div class="topo"><div class="ic">📣</div><div class="tx"><b>ANÚNCIO DO DIA</b><span>Sua marca no letreiro de todas as salas, com link (toque pra ver).</span></div></div>
    <div class="dois"><button class="g"><small>1 HORA</small>R$ 4,99</button><button class="g forte"><small>DIA TODO · 24 H</small>R$ 25,00</button></div></div>
  <ul class="notas"><li><b>Novo:</b> as duas opções ganham o <b>1 hora</b>. O dia todo do anúncio continua R$ 25.</li><li>Recado de 24 h = R$ 9,90 (sai mais barato que 24 recados de 1 hora).</li><li>Recado ofensivo: você tira do ar pelo #admin.</li></ul>`)

const c3 = col('3 · DEPOIS DO PIX', '#C2452F', `
  <div class="box"><b class="tt">💬 ESCREVA SEU RECADO</b>
    <div class="campo">PARABÉNS THE WOLF, PAPOU TUDO HOJE 🐺<span class="cont">36/60</span></div>
    <p class="leg">Assim vai aparecer:</p>
    ${placa({ tag: '💬 RECADO DE TORCEDOR', marca: 'PARABÉNS THE WOLF, PAPOU TUDO HOJE 🐺', oferta: '', cor: '#FF5FA2', recado: true, quem: { time: 'CHELSÃO DA MASSA FC', cor: '#9BD6A5' } })}
    <button class="pub">📣 SOLTAR NO LETREIRO</button>
    <p class="mini">Entra no ar na hora e fica o tempo que você comprou (1 hora ou o dia todo). Sem link e sem palavrão — recado que ofender alguém sai do ar.</p></div>`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Arial,sans-serif;color:${INK};padding:22px;width:1270px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;color:#3a3a32;font-size:14px}
.wrap{display:flex;gap:20px;align-items:flex-start}.col{width:400px}
.selo{display:inline-block;color:#fff;font:700 15px Oswald;border:3px solid ${INK};border-radius:10px;padding:3px 12px;margin-bottom:8px;box-shadow:3px 3px 0 ${INK}}
.fone{background:#F4ECD6;border:4px solid ${INK};border-radius:24px;padding:14px;box-shadow:6px 6px 0 ${INK};min-height:640px}
.leg{font-size:12px;font-weight:700;color:#4a4436;margin:8px 2px 6px}
.placa{background:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:12px}
.placa.rec{box-shadow:4px 4px 0 ${INK},0 0 0 3px #FF5FA2 inset}
.led{position:relative;height:84px;overflow:hidden;background:#070707;background-image:radial-gradient(rgba(255,255,255,.08) 1px,transparent 1.3px);background-size:4px 4px}
.rec .led{height:92px;background-color:#12060d}
.tag{position:absolute;left:14px;top:6px;font:700 9px Oswald;letter-spacing:.16em;color:rgba(255,255,255,.45)}
.rec .tag{color:#FF9CC8}
.quem{position:absolute;left:14px;top:20px;font:700 11px Oswald;letter-spacing:.08em;color:#F4ECD6;display:flex;align-items:center;gap:6px}
.bola{width:9px;height:9px;border-radius:50%;border:1.5px solid #fff}
.m{position:absolute;left:14px;right:14px;top:20px;font:700 19px/1.05 Oswald;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;overflow:hidden}
.rec .m{top:38px;font-size:17px;white-space:normal;max-height:40px;line-height:1.1}
.o{position:absolute;left:14px;right:14px;top:45px;font:500 13px/1.12 Oswald;letter-spacing:.05em;text-transform:uppercase;color:#F4ECD6}
.bar{position:absolute;left:0;bottom:0;height:3px;width:62%}
.notas{margin:12px 0 0;padding:0 0 0 18px;font-size:12.5px;font-weight:600;line-height:1.4}.notas li{margin-bottom:5px}
.sec{font:700 18px Oswald;text-transform:uppercase;margin:4px 0 8px;display:flex;justify-content:space-between;align-items:baseline}.sec small{font:600 12px Arial;color:#7a7364;text-transform:none}
.card{display:flex;gap:10px;align-items:center;background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:12px}
.card.cinza{opacity:.75}.ic{font-size:30px}.tx{flex:1}.tx b{display:block;font:700 17px Oswald}.tx span{font-size:12.5px;font-weight:600;line-height:1.35}
.card.col2{flex-direction:column;align-items:stretch}.topo{display:flex;gap:10px;align-items:center}.dois{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.dois button small{display:block;font:700 10px Oswald;letter-spacing:.08em;opacity:.9}.dois button.forte{outline:3px solid #FFC400;outline-offset:-6px}.card button.rosa{background:#FF5FA2}
.card button{font:700 17px Oswald;background:#FF5FA2;color:#fff;border:3px solid ${INK};border-radius:12px;padding:10px 12px;box-shadow:3px 3px 0 ${INK};white-space:nowrap}.card button.g{background:#1B7A3D}
.box{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:14px}
.tt{font:700 19px Oswald}.campo{position:relative;margin:10px 0;border:3px solid ${INK};border-radius:10px;padding:12px 10px 22px;font:700 15px Oswald;text-transform:uppercase}
.cont{position:absolute;right:8px;bottom:4px;font:600 10px Arial;color:#7a7364}
.pub{width:100%;font:700 18px Oswald;background:#FF5FA2;color:#fff;border:3px solid ${INK};border-radius:12px;padding:12px;box-shadow:3px 3px 0 ${INK};margin-top:4px}
.mini{font-size:11.5px;font-weight:600;color:#5a5446;margin:10px 0 0;line-height:1.4}
</style></head><body><h1>💬 Recado em destaque — o "super chat" do letreiro</h1><p class="sub">Recado de jogador e anúncio de empresa, os dois com <b>1 hora</b> ou <b>dia todo</b>.</p>
<div class="wrap">${c1}${c2}${c3}</div></body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1270, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `rd-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/recado-destaque.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/recado-destaque.png')
