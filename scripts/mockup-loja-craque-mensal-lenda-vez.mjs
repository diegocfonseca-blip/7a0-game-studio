// 🛒 MOCKUP · COMO HOJE, SEM O 29,90: dois Craques mensais, Lenda 59,90 uma vez, Batismo/Fundador iguais, oferta na hora da sala extra (26/10, Diego: "e se todo mundo tivesse que pagar dois planos mensais, e o resto é tudo coisa
// avulsa, ou kit com manto, mascote e escudo… mas ainda teria que ter plano mensal").
// Modelo: só DOIS planos, os dois mensais (⭐ Craque 9,90 · 👑 Lenda 14,90), e só eles dão acesso de jogo (Manual, 2D, salas, níveis).
// Tudo o mais é AVULSO, pago uma vez e da pessoa pra sempre: 🛡️ Kit do Clube (o Batismo de hoje, sem plano dentro) · 🖋 Kit Fundador ·
// peças soltas. Detalhe que faz fechar: kit dá 6 MESES DE LENDA DE BRINDE (senão a pessoa paga a arte e vê o Manual trancado).
// uso: node scripts/mockup-loja-craque-mensal-lenda-vez.mjs → scripts/mockups/loja-craque-mensal-lenda-vez.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')


const pl = (cls, emoji, nome, preco, sub, linhas, bt, fita = '') => `<div class="pl ${cls}">${fita ? `<span class="fita">${fita}</span>` : ''}
  <div class="plt"><span class="pn">${emoji} ${nome}</span><span class="pp">R$ ${preco}<small>${sub}</small></span></div>
  <ul>${linhas.map(l => `<li>${l}</li>`).join('')}</ul>
  <span class="bt ${cls === 'lenda' ? 'ouro' : 'verde'}">${bt}</span></div>`
const loja = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="h">🪜 PLANOS</div>
 ${pl('craque', '⭐', 'CRAQUE SALAS', '9,90', '/mês · cancela quando quiser', ['🏟️ Crie salas à vontade (acabou o limite de 1 por dia)', '🏆 Minhas Ligas', '🧑‍💼 Crie seu presidente (personagem)', '⚔️ Crie seu clã', '🥈 Nome prata'], 'ASSINAR')}
 ${pl('craque', '⭐', 'CRAQUE COMPLETO', '14,90', '/mês · cancela quando quiser', ['Tudo do Craque Salas +', '🎮 Modo Manual nos seus jogos', '📺 Campo 2D <i>(em breve)</i>', '🔎 Nível e olheiro até Craque', '💾 2 carreiras + nuvem'], 'ASSINAR', '🔥 MAIS ESCOLHIDO')}
 ${pl('lenda', '👑', 'LENDA', '59,90', 'uma vez · pra sempre · sem mensal', ['Tudo dos dois Craques, pra sempre +', '🔎 Nível e olheiro até Lenda', '💾 4 carreiras', '🥇 Nome DOURADO em todo canto'], 'QUERO PRA SEMPRE')}
 <div class="dupla">
  ${pl('bat', '🖋', 'BATISMO', '79,90', 'uma vez', ['Tudo do Lenda +', '🛡️ Escudo, mascote e manto do SEU clube', '🚁 Entrada de gala'], 'QUERO')}
  ${pl('fund', '🖋', 'FUNDADOR', '99,90', 'uma vez', ['Tudo do Batismo +', '✨ Gala ÚNICA + 📣 canto', '#️⃣ Nº de fundador'], 'QUERO')}
 </div>
 <div class="regra">⬆️ Já tem Lenda? Batismo e Fundador: paga só a diferença (+ R$ 5). Quem comprou o Craque de 29,90 fica com ele pra sempre.</div>
</div></div>`

const popSala = `<div class="cel baixa"><div class="top">🏟️ CRIANDO SALA</div><div class="pad sombra">
 <div class="pop"><div class="pi">🎟️</div><b class="pt">ACABOU SUA SALA GRÁTIS DE HOJE</b><p>Amanhã volta sozinha. Quer criar agora?</p>
  <div class="opc"><span class="bt verde">🎟️ 3 SALAS EXTRAS · R$ 4,90</span><span class="bt ouro">📅 SALAS À VONTADE · R$ 9,90/MÊS</span><span class="bt branco">VER TODOS OS PLANOS ›</span></div>
  <small class="agora">agora não</small></div>
</div></div>`
const popManual = `<div class="cel baixa"><div class="top">⚽ NO JOGO · 🎮 MANUAL TRANCADO</div><div class="pad sombra">
 <div class="pop"><div class="pi">🔒</div><b class="pt">MANUAL + CAMPO 2D SÃO DO CRAQUE COMPLETO</b><p>Bater o pênalti e mexer no time ao vivo.</p>
  <div class="opc"><span class="bt verde">⏱️ 24 HORAS · R$ 9,90</span><span class="bt ouro">⭐ CRAQUE COMPLETO · R$ 14,90/MÊS</span><span class="bt branco">VER TODOS OS PLANOS ›</span></div>
  <small class="agora">agora não</small></div>
</div></div>`

const regras = `<div class="esc">
 <div class="eh">O QUE MUDA EM RELAÇÃO A HOJE</div>
 <ul class="pq">
  <li><b>Sai</b> o ⭐ Craque de R$ 29,90 (quem comprou fica com ele pra sempre).</li>
  <li><b>Entram dois Craques mensais:</b> Salas (9,90) e Completo (14,90, com Manual e 2D em breve).</li>
  <li><b>👑 Lenda vira R$ 59,90 uma vez</b>, com tudo dos Craques e do Lenda, sem mensal.</li>
  <li><b>🖋 Batismo 79,90 e Fundador 99,90</b> ficam iguaizinhos.</li>
  <li><b>Oferta na hora:</b> só quando a pessoa tenta criar sala e não pode (4,90 · 9,90/mês · ver planos) e quando toca no Manual trancado (24 h 9,90 · 14,90/mês · ver planos).</li>
 </ul>
 <div class="eh">A ESCADA</div>
 <div class="mapa">
  <div><b>🎟️ R$ 4,90</b>3 salas extras, avulso</div>
  <div><b>⭐ R$ 9,90/mês</b>Craque Salas — salas à vontade, personagem e clã</div>
  <div><b>⭐ R$ 14,90/mês</b>Craque Completo — tudo do Salas + Manual + 2D</div>
  <div><b>👑 R$ 59,90 uma vez</b>Lenda — tudo isso pra sempre, sem mensal</div>
  <div><b>🖋 R$ 79,90 · R$ 99,90</b>Batismo · Fundador — como hoje</div>
 </div>
 <div class="eh" style="margin-top:12px">UMA CONTA QUE VALE OLHAR</div>
 <p class="pq2">Craque Completo em 4 meses = R$ 59,60, o mesmo que o Lenda pra sempre. Então quem fica mais de 4 meses faz melhor negócio no Lenda — e isso é bom: empurra pro 59,90. Cobrança mensal no Pix recorrente da Vindi; só o aviso do servidor libera.</p>
</div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:1900px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.7;font-size:15px;max-width:1800px}
.cols{display:flex;gap:22px;align-items:flex-start}.c{width:440px}.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.cel{width:440px;border:4px solid #0C0C0C;border-radius:26px;overflow:hidden;background:#F4ECD6;box-shadow:5px 5px 0 #000}
.top{background:#0C0C0C;color:#FFC400;font:700 18px Oswald;padding:12px 16px;position:relative}.xx{position:absolute;right:12px;top:8px;color:#fff;border:2px solid #fff;border-radius:8px;padding:0 8px}
.pad{padding:14px}.h{font:700 17px Oswald;text-transform:uppercase;margin:4px 0 10px}.h small{display:block;font:600 12px system-ui;text-transform:none;opacity:.6}
.abas{display:flex;border:3px solid #0C0C0C;border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 #000;margin-bottom:12px;background:#fff}.abas span{flex:1;text-align:center;font:700 12.5px Oswald;padding:8px 2px;letter-spacing:.3px}.abas .on{background:#FFC400}
.regra{font-weight:600;font-size:12.5px;background:#fff;border:2px dashed #0C0C0C;border-radius:10px;padding:7px 10px;margin:0 0 12px;line-height:1.4}
.pl{position:relative;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px;margin-bottom:14px;background:#fff}
.pl.craque{background:linear-gradient(160deg,#F4F7FB,#DDE3EA)}.pl.lenda{background:linear-gradient(160deg,#FFE79A,#FFC400 50%,#F0B000)}
.pl.bat{background:#0C0C0C;color:#F4ECD6}.pl.fund{background:linear-gradient(135deg,#14251a,#1B7A3D);color:#F4ECD6}
.fita{position:absolute;right:10px;top:-14px;font:700 12px Oswald;background:#C2452F;color:#fff;border:2px solid #0C0C0C;border-radius:8px;padding:2px 9px;box-shadow:2px 2px 0 #000}
.plt{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.pn{font:700 19px Oswald}.pp{font:700 22px Oswald;text-align:right;white-space:nowrap}.pp small{display:block;font:600 10.5px system-ui;opacity:.75;white-space:normal;max-width:150px}
ul{margin:6px 0 8px;padding:0;list-style:none;font-size:13px;font-weight:600;line-height:1.5}
.brinde{font:700 12.5px Oswald;letter-spacing:.3px;background:#FFC400;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:9px;padding:6px 9px;margin-bottom:9px;box-shadow:2px 2px 0 #000}
.bt{display:block;text-align:center;font:700 15px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:11px;padding:8px;box-shadow:3px 3px 0 #000}
.bt.verde{background:#1B7A3D;color:#fff}.bt.ouro{background:#0C0C0C;color:#FFC400}.bt.mini{font-size:13px;padding:7px 8px;white-space:nowrap}
.dica{font-size:12.5px;font-weight:600;opacity:.85;margin:12px 2px 0;line-height:1.4}
.passe{display:flex;align-items:center;gap:10px;background:#fff;border:3px dashed #0C0C0C;border-radius:14px;padding:10px}.pe{font-size:30px}.passe b{font:700 14px Oswald}.passe small{display:block;font-size:12px;font-weight:600;line-height:1.35}
.grupo{font:700 13px Oswald;letter-spacing:.8px;margin:12px 2px 6px;color:#7C3AED}.grupo small{font:700 11px system-ui;color:#0C0C0C;opacity:.55;letter-spacing:0}
.av{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #0C0C0C;border-radius:12px;padding:8px 10px;margin-bottom:7px}.ai{font-size:24px}.av div{flex:1}.av b{font:700 14px Oswald}.av small{display:block;font-size:11.5px;font-weight:600;opacity:.7}
.ap{font:700 13px Oswald;background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:9px;padding:4px 8px;white-space:nowrap;box-shadow:2px 2px 0 #000}
.moedas{display:flex;gap:6px}.moedas span{flex:1;text-align:center;background:#fff;border:2px solid #0C0C0C;border-radius:10px;padding:6px 2px;font:700 12px Oswald}.moedas b{display:block;font-size:15px}.moedas .hot{background:#FFE79A}
.esc{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:14px 16px;width:440px}
.eh{font:700 15px Oswald;letter-spacing:.5px;margin:0 0 8px;color:#7C3AED}.frase{font:700 22px Oswald;margin:0 0 16px;line-height:1.2}
.pq{font-size:12.5px;line-height:1.5;padding-left:16px;list-style:disc;margin:0 0 14px}.pq li{margin-bottom:6px}
.mapa div{background:#FFF8E6;border-left:4px solid #FFC400;border-radius:0 8px 8px 0;padding:6px 10px;margin-bottom:6px;font-size:12px;font-weight:600;line-height:1.4}.mapa b{display:block;font:700 13px Oswald}
.nota{font-weight:700;font-size:13.5px;margin:10px 2px 0;line-height:1.4}
.dupla{display:flex;gap:10px}.dupla .pl{flex:1;padding:9px}.dupla .pn{font-size:15px}.dupla .pp{font-size:16px}.dupla ul{font-size:11.5px}.dupla .bt{font-size:12px;padding:6px}.pl i{font-style:normal;opacity:.7;font-size:11px}.cel.baixa .pad{min-height:300px;display:flex;align-items:center;justify-content:center}.sombra{background:rgba(12,12,12,.55)}.pop{background:#FFF8E6;border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #000;padding:12px 14px;text-align:center;width:100%}.pi{font-size:34px}.pt{display:block;font:700 18px Oswald;text-transform:uppercase}.pop p{margin:4px 0 10px;font-weight:600;font-size:13.5px}.opc{display:flex;flex-direction:column;gap:8px}.bt.branco{background:#fff;color:#0C0C0C}.agora{display:block;margin-top:8px;font-weight:700;font-size:12px;opacity:.55;text-decoration:underline}.pq2{font-size:12.5px;line-height:1.5;margin:0}body{width:1460px}
</style></head><body>

<h1>🛒 Como hoje, sem o 29,90</h1>
<p class="sub">Dois Craques mensais (⭐ Salas 9,90 · ⭐ Completo 14,90 com Manual e 2D), 👑 Lenda R$ 59,90 uma vez com tudo dos dois, 🖋 Batismo 79,90 e Fundador 99,90 como já são. A oferta aparece na hora em que a pessoa tenta criar sala e não pode.</p>
<div class="cols">
 <div class="c"><span class="tag">1 · A LOJA</span>${loja}</div>
 <div class="c"><span class="tag">2 · NA HORA DA SALA EXTRA</span>${popSala}<p class="nota">Só aqui aparecem os três juntos: avulso 4,90, mensal 9,90 e ver planos.</p><span class="tag" style="margin-top:14px">2b · NO MANUAL TRANCADO</span>${popManual}</div>
 <div class="c"><span class="tag">3 · RESUMO</span>${regras}</div>
</div></body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: 1460, height: 1000 }, deviceScaleFactor: 1.5 })
await page.setContent(html)
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/mockups/loja-craque-mensal-lenda-vez.png', fullPage: true })
await browser.close()
console.log('scripts/mockups/loja-craque-mensal-lenda-vez.png')
