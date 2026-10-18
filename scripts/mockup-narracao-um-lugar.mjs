#!/usr/bin/env node
// 🎙️ MOCKUP — NARRAÇÃO NUM LUGAR SÓ (16/10). Diego: "não tá tendo muito sentido o rádio com as legendas no topo do
// painel… em cima tem narração e no rádio também. Tem que juntar todo tipo de frase num lugar só. Ou no rádio ou na
// parte superior… faz um mockup. E mais variedade, falar mais o nome dos jogadores: vai chutar, chutou pra fora,
// fez o gol". Mostra HOJE (dois lugares) × OPÇÃO A (tudo no topo) × OPÇÃO B (tudo no rádio, embaixo).
// uso: node scripts/mockup-narracao-um-lugar.mjs → scripts/mockups/narracao-um-lugar.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const placar = (min, h, a) => `<div class="duelo"><div class="tm"><div class="esc" style="background:#1a1a1a">N</div><b>Neymarzetti</b><small>VOCÊ</small></div>
<div class="num"><small>${min}′</small><strong>${h} <span>×</span> ${a}</strong></div>
<div class="tm"><div class="esc" style="background:#7a1010">F</div><b>Fabulous EC</b><small>RIVAL</small></div></div>`
const golzinho = (vered = '') => `<div class="palco"><span>🥅</span><div class="pista"><i></i><em>⚽</em></div><span>🥅</span>${vered ? `<b class="ve">${vered}</b>` : ''}</div>`
const autores = `<div class="aut"><p>⚽ Kleberson <b>3′</b></p><p>Sem gols</p></div>`
const linha = (tipo, min, txt) => `<div class="ln ${tipo}"><span class="tg">${{ gol: '⚽ GOL', chance: '🥅 LANCE', jogo: '📻 JOGO' }[tipo]}</span><b>${min}′</b><span class="tx">${txt}</span></div>`

const hoje = `<div class="col"><div class="rot vermelho">HOJE · duas narrações</div><div class="fone"><div class="card">
<div class="narr">Neymarzetti arrisca de longe… bateu na TRAVE e voltou! Que azar.</div><div class="mark m1">1</div>
${placar(14, 1, 0)}${golzinho('TRAVE!')}
<div class="radio"><span class="rt">📻 RÁDIO</span><b>14′</b><span>Minha nossa: jogo começa com o Neymarzetti rodando a bola atrás.</span></div><div class="mark m2">2</div>
${autores}</div></div>
<p class="obs">① em cima fala do lance · ② embaixo fala de OUTRA coisa, ao mesmo tempo. O olho não sabe qual ler.</p></div>`

const opA = `<div class="col"><div class="rot verde">OPÇÃO A · tudo no TOPO <em>⭐ recomendo</em></div><div class="fone"><div class="card">
<div class="feed">
${linha('chance', 14, '<u>Kleberson</u> arrisca de longe… bateu na TRAVE e voltou!')}
<div class="velho">${linha('jogo', 12, '<u>Victor</u> sai jogando curto, o Fabulous gira a bola sem pressa.')}</div>
</div>
${placar(14, 1, 0)}${golzinho('TRAVE!')}
${autores}</div></div>
<p class="obs">Uma faixa só, em cima do placar: a frase nova entra grande e a anterior fica apagadinha embaixo. A faixa do rádio <b>sai</b> e o cartão fica menor.</p></div>`

const opB = `<div class="col"><div class="rot roxo">OPÇÃO B · tudo no RÁDIO, embaixo</div><div class="fone"><div class="card">
${placar(14, 1, 0)}${golzinho('TRAVE!')}
<div class="radio grande"><span class="rt">📻 RÁDIO LEGENDS</span>
${linha('chance', 14, '<u>Kleberson</u> arrisca de longe… bateu na TRAVE e voltou!')}
<div class="velho">${linha('jogo', 12, '<u>Victor</u> sai jogando curto, o Fabulous gira a bola sem pressa.')}</div></div>
${autores}</div></div>
<p class="obs">A faixa de cima <b>sai</b> e tudo vira rádio, embaixo do golzinho. Fica mais longe do placar: o olho desce pra ler.</p></div>`

const exemplo = `<div class="ex"><h2>🎙️ E MAIS VARIEDADE, COM NOME DE JOGADOR <small>um jogo de exemplo, do começo ao fim</small></h2><div class="exg">
${linha('jogo', 2, '<u>Lincoln</u> puxa o contra-ataque pela esquerda e é derrubado. Falta!')}
${linha('gol', 3, 'GOLAÇO! <u>Kleberson</u> bate de canhota, colocado, sem chance pro <u>Victor</u>!')}
${linha('chance', 9, '<u>Romário</u> recebe na área, gira e… chuta pra fora, raspando a trave!')}
${linha('jogo', 11, '<u>Zé Roberto</u> desarma no meio e já sai jogando.')}
${linha('chance', 14, '<u>Kleberson</u> arrisca de longe… bateu na TRAVE e voltou!')}
${linha('chance', 18, '<u>Lincoln</u> cruza, <u>Romário</u> cabeceia firme — <u>Victor</u> espalma pra escanteio!')}
${linha('jogo', 22, 'Cartão amarelo pro <u>Lúcio</u>: chegou atrasado no <u>Kleberson</u>.')}
${linha('chance', 27, '<u>Ronaldinho</u> tenta o chapéu no goleiro… a bola sobe demais.')}
${linha('gol', 31, 'GOL! <u>Romário</u> aparece livre e só empurra pro fundo da rede!')}
${linha('jogo', 35, '<u>Victor</u> pede calma, segura a bola e esfria o jogo.')}
</div><p class="obs">Hoje a rádio <b>não pode</b> falar de chute nem de gol (essas frases ficavam só em cima). Juntando num lugar, ela narra TUDO: chutou, foi pra fora, trave, defesa, gol — sempre com o nome de quem fez. 🚫 Pênalti continua fora (tem tela própria) e nada entrega o placar antes da hora.</p></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Arial,sans-serif;color:#0C0C0C;padding:24px;width:1320px}
h1{font:700 32px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;color:#3a3a32}
.cols{display:flex;gap:22px;align-items:flex-start}.col{width:410px}
.rot{font:700 17px Oswald;text-transform:uppercase;color:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:7px 12px;box-shadow:3px 3px 0 #0C0C0C;margin-bottom:10px;display:flex;justify-content:space-between}
.rot em{font-style:normal;background:#FFC400;color:#0C0C0C;border-radius:7px;padding:0 6px;font-size:13px}
.vermelho{background:#C2452F}.verde{background:#1B7A3D}.roxo{background:#7C3AED}
.fone{background:#0C0C0C;border-radius:24px;padding:10px}
.card{position:relative;background:#1d2419;border-radius:16px;overflow:hidden;color:#F4ECD6}
.narr{padding:12px 14px 12px 40px;text-align:center;font:700 15px/1.25 Oswald;color:#d9d3bf;background:#232b1f;border-bottom:1px solid #3a4434}
.mark{position:absolute;width:26px;height:26px;border-radius:999px;background:#E8503A;color:#fff;font:700 15px Oswald;display:grid;place-items:center;border:2px solid #fff}.m1{left:6px;top:8px}.m2{left:6px;top:268px}
.duelo{display:flex;align-items:center;justify-content:space-around;padding:14px 8px}
.tm{text-align:center;width:120px}.esc{width:56px;height:56px;border-radius:12px;margin:0 auto 6px;display:grid;place-items:center;font:700 26px Oswald;color:#fff;border:2px solid #444}.tm b{font:700 17px Oswald;display:block}.tm small{font:700 10px Oswald;opacity:.6;letter-spacing:1px}
.num{background:#F4ECD6;color:#0C0C0C;border-radius:12px;padding:6px 12px;text-align:center}.num small{font:700 12px Oswald;display:block}.num strong{font:700 36px Oswald}.num span{font-size:18px}
.palco{position:relative;display:flex;align-items:center;gap:6px;padding:6px 12px 10px}.pista{flex:1;height:22px;border-top:2px dashed #59624d;position:relative}.pista em{position:absolute;right:20%;top:-11px;font-style:normal}
.ve{position:absolute;left:50%;top:-4px;transform:translateX(-50%);background:#FFC400;color:#0C0C0C;font:700 12px Oswald;border-radius:7px;padding:1px 8px}
.radio{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:9px 12px;border-top:1px solid #59624d;background:rgba(255,196,0,.08);font:600 12.5px/1.3 Arial}.radio .rt{font:700 9px Oswald;letter-spacing:.12em;color:#0c0c0c;background:#ffc400;border-radius:5px;padding:2px 5px}.radio>b{font:700 13px Oswald;color:#ffc400}.radio>span:last-child{flex:1}
.radio.grande{display:block}.radio.grande .rt{display:inline-block;margin-bottom:6px}
.aut{display:flex;justify-content:space-around;padding:10px;border-top:1px solid #3a4434;font:600 13px Arial}.aut b{color:#FFC400}
.feed{background:#232b1f;border-bottom:1px solid #3a4434;padding:8px 10px}
.ln{display:flex;align-items:flex-start;gap:7px;padding:5px 2px;font:700 13.5px/1.3 Arial}.ln .tg{flex:none;font:700 9px Oswald;letter-spacing:.08em;border-radius:5px;padding:2px 5px;margin-top:2px}
.ln b{flex:none;font:700 13px Oswald;color:#FFC400;margin-top:1px}.ln .tx{flex:1}.ln u{text-decoration:none;color:#FFE79A}
.ln.gol .tg{background:#FFC400;color:#0C0C0C}.ln.chance .tg{background:#F4ECD6;color:#0C0C0C}.ln.jogo .tg{background:#59624d;color:#F4ECD6}
.ln.gol .tx{color:#FFC400}
.velho{opacity:.45}.velho .ln{font-size:12px}
.obs{font-size:12.5px;font-weight:700;color:#3a3a32;line-height:1.4;margin:10px 2px 0}
.ex{margin-top:22px;background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px 16px}
.ex h2{font:700 20px Oswald;margin:0 0 10px;display:flex;justify-content:space-between;align-items:baseline}.ex h2 small{font:700 12px Arial;color:#53534b}
.exg{background:#1d2419;color:#F4ECD6;border-radius:12px;padding:8px 12px;display:grid;grid-template-columns:1fr 1fr;column-gap:20px}
</style></head><body>
<h1>🎙️ Narração num lugar só</h1><p class="sub">Hoje são duas falas ao mesmo tempo (topo + rádio). A proposta junta tudo numa faixa só.</p>
<div class="cols">${hoje}${opA}${opB}</div>${exemplo}</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `narr-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/narracao-um-lugar.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/narracao-um-lugar.png')
