#!/usr/bin/env node
// 🎨 MOCKUP — ITENS NOVOS DA LOJA (14/10). Diego escolheu: 🎁 dar de presente · 🎖️ título do lado do nome ·
// 😂 figurinhas da sala · 🎨 tema da sala · 🎆 festa do título com o tema do TIME DE CORAÇÃO. Ainda NÃO é pra fazer — só ver.
// Tudo de exemplo (nomes, preços, frases). Nada usa escudo de clube real: o time de coração entra só com CORES e NOME.
// uso: node scripts/mockup-loja-itens.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', BEGE = 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'
const tag = (t, p) => `<div class="tag"><b>${t}</b><span>${p}</span></div>`

const presente = `<div class="tela"><div class="num">1</div><h1>🎁 Dar de presente</h1><p class="sub">Compra pra um amigo. Ele recebe na hora em que entrar no jogo.</p>
<div class="box"><p class="rot">O QUE VAI DAR</p>
<div class="opts"><span class="on">⭐ Craque</span><span>👑 Lenda</span><span>🎖️ Título</span><span>😂 Figurinhas</span></div>
<p class="rot" style="margin-top:12px">PRA QUEM</p><div class="inp">📧 e-mail da conta do amigo</div>
<p class="rot" style="margin-top:12px">RECADO (APARECE PRA ELE)</p><div class="inp" style="height:54px">"Agora não tem desculpa pra perder no envelope 😂"</div>
<button class="btn">🎁 PRESENTEAR · R$ 29,90</button></div>
<p class="rot c">👇 O QUE O AMIGO VÊ AO ENTRAR</p>
<div class="gift"><div class="caixa">🎁</div><b>RENATON TE DEU UM PRESENTE!</b><div class="plano" style="background:${PRATA}">⭐ CRAQUE</div><i>"Agora não tem desculpa pra perder no envelope 😂"</i><button class="btn" style="background:#FFC400;color:#0C0C0C">ABRIR 🎉</button></div>
${tag('Preço', 'o mesmo do item escolhido')}</div>`

const titulo = `<div class="tela"><div class="num">2</div><h1>🎖️ Título do lado do nome</h1><p class="sub">Aparece na sala, na tabela e no chat. Troca quando quiser.</p>
<div class="sala"><p class="rot" style="color:#F4ECD6">🌐 TÉCNICOS NA SALA</p>
<div class="lin" style="background:${OURO}"><b class="ini">L</b><div><b>LEÃO DA ESTRADINHA 👑</b><span class="tit">🐊 Rei da Tocaia</span></div></div>
<div class="lin" style="background:${PRATA}"><b class="ini">B</b><div><b>BOLACHA FC ⭐</b><span class="tit">💸 Mão Aberta</span></div></div>
<div class="lin" style="background:${BEGE}"><b class="ini">Z</b><div><b>ZÉ DA VÁRZEA</b></div></div></div>
<div class="box"><p class="rot">ESCOLHA O SEU</p><div class="grade">
${['🐊 Rei da Tocaia', '💸 Mão Aberta', '🧊 Frio no Envelope', '🔨 Martelo de Ouro', '🤡 Pagou Caro', '🦊 Raposa do Monte', '😴 Dorme no Leilão', '🎰 Vai no Feeling'].map((t, i) => `<span class="${i === 0 ? 'on' : ''}">${t}</span>`).join('')}
</div></div>
${tag('Preço', 'R$ 4,90 · pacote com todos R$ 9,90')}</div>`

const figurinhas = `<div class="tela"><div class="num">3</div><h1>😂 Figurinhas da sala</h1><p class="sub">Reações grandes pro chat, pra zoar na hora do martelo.</p>
<div class="chat">
<div class="msg"><b>Bolacha FC</b><span>levei o Pelé por 40 😎</span></div>
<div class="fig">🤡<b>PAGOU CARO!</b><small>Leão da Estradinha</small></div>
<div class="msg"><b>Zé da Várzea</b><span>kkkkkkk</span></div>
<div class="fig r">😭<b>CHOROU?</b><small>Bolacha FC</small></div>
<div class="fig">🚨<b>ROUBADO!</b><small>Leão da Estradinha</small></div></div>
<div class="box"><p class="rot">SEU PACOTE · TOQUE PRA MANDAR</p><div class="tray">
${[['🤡', 'PAGOU CARO'], ['😭', 'CHOROU?'], ['🚨', 'ROUBADO!'], ['🏷️', 'TÁ BARATO'], ['🫡', 'RESPEITA'], ['🧊', 'GELOU'], ['🔥', 'PEGOU FOGO'], ['👋', 'TCHAU, QUERIDO']].map(([e, t]) => `<div><span>${e}</span><b>${t}</b></div>`).join('')}
</div><p class="mini">⏱️ espera de 5s entre uma e outra, igual à mascote no monte — não atrapalha o leilão</p></div>
${tag('Preço', 'R$ 6,90 o pacote')}</div>`

const temas = [['🏟️', 'Templo Lotado', 'linear-gradient(180deg,#0b1d3a,#1b3f7a 55%,#1B7A3D)'], ['🟫', 'Várzea de Barro', 'linear-gradient(180deg,#5b3a1d,#8a5a2b 55%,#6a7d2a)'], ['🔥', 'Caldeirão', 'linear-gradient(180deg,#2a0b0b,#7a1b1b 55%,#E8A200)']]
const tema = `<div class="tela"><div class="num">4</div><h1>🎨 Tema da sala</h1><p class="sub">Quem cria a sala escolhe. TODO MUNDO que entra vê.</p>
<div class="espera" style="background:${temas[2][2]}"><div class="luzes">✨ 🔥 ✨ 🔥 ✨</div><b>SALA DO LEÃO</b><span>código 7XK2PA · tema 🔥 Caldeirão</span>
<div class="ppl">${['LEÃO DA ESTRADINHA 👑', 'BOLACHA FC ⭐', 'ZÉ DA VÁRZEA'].map(n => `<div>${n}</div>`).join('')}</div><small>a torcida canta enquanto a sala enche</small></div>
<div class="box"><p class="rot">ESCOLHA O TEMA (AO CRIAR A SALA)</p><div class="temas">
${temas.map(([e, t, g], i) => `<div class="${i === 2 ? 'on' : ''}"><div class="sw" style="background:${g}">${e}</div><b>${t}</b></div>`).join('')}
</div></div>
${tag('Preço', 'R$ 9,90 cada tema · seu pra sempre')}</div>`

const festa = `<div class="tela"><div class="num">5</div><h1>🎆 Festa do título</h1><p class="sub">Campeão? A festa vem com as CORES e o canto do seu TIME DE CORAÇÃO.</p>
<div class="festa" style="background:linear-gradient(180deg,#F4F4F2,#E9E6DD)">
<div class="conf">${Array.from({ length: 26 }, (_, i) => `<i style="left:${i % 2 ? (i * 7) % 18 : 82 + (i * 5) % 16}%;top:${(i * 23) % 95}%;background:${['#0C1D3A', '#C9A227', '#FFFFFF', '#0C1D3A'][i % 4]};transform:rotate(${i * 29}deg)"></i>`).join('')}</div>
<p class="cor">❤️ TIME DE CORAÇÃO: <b>REAL MADRID</b></p><div class="taca">🏆</div><b class="camp">CAMPEÃO!</b><span class="clube">SEU CLUBE FC · SÉRIE A</span>
<div class="canto">🎤 "¡HALA, HALA, HALA!" <small>— o canto da torcida tocando</small></div></div>
<div class="box"><p class="rot">COMO FUNCIONA</p><p class="tx">Você diz o seu time de coração uma vez. Toda festa de título usa as cores e o canto dele: papel picado, telão e música. <b>Sem escudo de clube de verdade</b> — só cores, nome e canto.</p></div>
${tag('Preço', 'R$ 9,90 · vale pra todo título')}</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Arial,sans-serif;color:#0C0C0C;display:flex;flex-wrap:wrap;gap:18px;padding:18px;width:2250px;align-items:flex-start}
.tela{position:relative;width:420px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:16px}
.num{position:absolute;top:-12px;left:-12px;width:34px;height:34px;border-radius:50%;background:#C2452F;color:#fff;border:3px solid #0C0C0C;font:700 18px Oswald;display:flex;align-items:center;justify-content:center}
h1{font:700 26px/1 Oswald;text-transform:uppercase;margin:0}.sub{font-size:12.5px;font-weight:700;color:#3a3a32;margin:6px 0 12px}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:12px;margin-bottom:12px}
.rot{font:700 11px Oswald;letter-spacing:.1em;color:#53534b;margin:0 0 6px}.rot.c{text-align:center;color:#C2452F;margin:6px 0 8px}
.opts{display:flex;flex-wrap:wrap;gap:6px}.opts span,.grade span{font:700 13px Oswald;border:3px solid #0C0C0C;border-radius:10px;padding:5px 9px;background:#F4ECD6}.opts .on,.grade .on{background:#FFC400;box-shadow:2px 2px 0 #0C0C0C}
.inp{border:3px solid #0C0C0C;border-radius:10px;padding:8px 10px;font-size:12px;font-weight:700;color:#7a7668;background:#fff}
.btn{width:100%;margin-top:12px;font:700 16px Oswald;text-transform:uppercase;background:#1B7A3D;color:#fff;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:9px}
.gift{background:#14251a;color:#F4ECD6;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:14px;text-align:center;margin-bottom:12px}.caixa{font-size:44px}.gift b{font:700 18px Oswald;display:block;color:#FFC400}.gift i{display:block;font-size:12px;margin:8px 0 0;opacity:.9}.plano{display:inline-block;margin-top:8px;font:700 14px Oswald;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:8px;padding:3px 10px}
.tag{display:flex;justify-content:space-between;align-items:center;background:#FFF3C4;border:3px solid #0C0C0C;border-radius:12px;padding:8px 10px}.tag b{font:700 13px Oswald;text-transform:uppercase}.tag span{font:700 13px Oswald;color:#1B7A3D}
.sala{background:#14251a;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:10px;margin-bottom:12px}
.lin{display:flex;gap:9px;align-items:center;border:3px solid #0C0C0C;border-radius:12px;padding:7px 10px;margin-top:7px}.lin .ini{width:30px;height:30px;border-radius:50%;background:#fff;border:2px solid #0C0C0C;display:flex;align-items:center;justify-content:center;font:700 14px Oswald}.lin b{font:700 15px Oswald;display:block}.tit{display:inline-block;margin-top:2px;font:700 11px Oswald;background:#0C0C0C;color:#FFC400;border-radius:6px;padding:1px 7px}
.grade{display:grid;grid-template-columns:1fr 1fr;gap:6px}.grade span{text-align:center}
.chat{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:10px;margin-bottom:12px;display:flex;flex-direction:column;gap:7px}
.msg{font-size:12.5px}.msg b{font:700 12px Oswald;margin-right:6px}.fig{align-self:flex-start;background:#FFF3C4;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:6px 12px;text-align:center;font-size:34px;line-height:1}.fig.r{align-self:flex-end;background:#E4D6FB}.fig b{display:block;font:700 15px Oswald;margin-top:3px}.fig small{display:block;font:500 10px Arial;color:#53534b;margin-top:2px}
.tray{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.tray div{border:3px solid #0C0C0C;border-radius:10px;background:#F4ECD6;text-align:center;padding:5px 2px}.tray span{font-size:24px;display:block}.tray b{font:700 9.5px Oswald}
.mini{font-size:10.5px;font-weight:700;color:#53534b;margin:8px 0 0}
.espera{border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:14px;color:#fff;text-align:center;margin-bottom:12px}.luzes{font-size:18px;letter-spacing:4px}.espera>b{font:700 26px Oswald;display:block;margin-top:4px;text-shadow:0 2px #000}.espera>span{font:700 11px Oswald;opacity:.85}.ppl{display:grid;gap:5px;margin:10px 0 6px}.ppl div{background:rgba(0,0,0,.45);border:2px solid rgba(255,255,255,.3);border-radius:8px;padding:5px;font:700 13px Oswald}.espera small{font-size:10.5px;opacity:.85}
.temas{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.temas div{border:3px solid #0C0C0C;border-radius:12px;padding:5px;text-align:center;background:#F4ECD6}.temas .on{box-shadow:0 0 0 3px #FFC400,3px 3px 0 #0C0C0C;background:#FFF3C4}.sw{height:54px;border-radius:8px;border:2px solid #0C0C0C;display:flex;align-items:center;justify-content:center;font-size:24px}.temas b{font:700 11.5px Oswald;display:block;margin-top:4px}
.festa{position:relative;overflow:hidden;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:14px;text-align:center;margin-bottom:12px;min-height:260px}.conf i{position:absolute;width:9px;height:14px;border:1px solid rgba(0,0,0,.25)}
.cor{position:relative;font:700 11px Oswald;letter-spacing:.06em;margin:0;color:#0C1D3A}.taca{position:relative;font-size:64px;margin-top:6px}.camp{position:relative;display:block;font:700 40px Oswald;color:#0C1D3A;text-shadow:2px 2px 0 #C9A227}.clube{position:relative;font:700 13px Oswald;color:#53534b}
.canto{position:relative;margin-top:12px;background:#0C1D3A;color:#fff;border:2px solid #C9A227;border-radius:10px;padding:7px;font:700 14px Oswald}.canto small{display:block;font:500 10px Arial;opacity:.8}
.tx{font-size:12.5px;line-height:1.45;margin:0}
</style></head><body>${presente}${titulo}${figurinhas}${tema}${festa}</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 2250, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `loja-itens-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/loja-itens.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/loja-itens.png')
