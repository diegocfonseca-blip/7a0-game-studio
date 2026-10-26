// 🛒 MOCKUP · MENSAL + PEÇAS DO CLUBE + UM VITALÍCIO CARO (26/10, Diego: "e se todo mundo tivesse que pagar dois planos mensais, e o resto é tudo coisa
// avulsa, ou kit com manto, mascote e escudo… mas ainda teria que ter plano mensal").
// Modelo: só DOIS planos, os dois mensais (⭐ Craque 9,90 · 👑 Lenda 14,90), e só eles dão acesso de jogo (Manual, 2D, salas, níveis).
// Tudo o mais é AVULSO, pago uma vez e da pessoa pra sempre: 🛡️ Kit do Clube (o Batismo de hoje, sem plano dentro) · 🖋 Kit Fundador ·
// peças soltas. Detalhe que faz fechar: kit dá 6 MESES DE LENDA DE BRINDE (senão a pessoa paga a arte e vê o Manual trancado).
// uso: node scripts/mockup-loja-mensal-pecas-vitalicio.mjs → scripts/mockups/loja-mensal-pecas-vitalicio.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')


const plano = (cls, emoji, nome, preco, linhas, fita = '') => `<div class="pl ${cls}">${fita ? `<span class="fita">${fita}</span>` : ''}
  <div class="plt"><span class="pn">${emoji} ${nome}</span><span class="pp">R$ ${preco}<small>/mês · cancela quando quiser</small></span></div>
  <ul>${linhas.map(l => `<li>${l}</li>`).join('')}</ul>
  <span class="bt ${cls === 'lenda' ? 'ouro' : 'verde'}">ASSINAR</span></div>`
const planos = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="abas"><span class="on">📅 PLANOS</span><span>🛡️ SEU CLUBE</span><span>💎 VITALÍCIO</span></div>
 <div class="h">PRA JOGAR: UM DOS DOIS MENSAIS</div>
 ${plano('craque', '⭐', 'CRAQUE', '9,90', ['🎮 Modo Manual + 📺 Campo 2D', '🔎 Nível e olheiro até Craque', '💾 2 carreiras + nuvem', '🧑‍💼 Seu presidente (boneco)', '🥈 Nome prata'])}
 ${plano('lenda', '👑', 'LENDA', '14,90', ['Tudo do Craque +', '🏟️ Salas à vontade + Minhas Ligas', '🔎 Nível e olheiro até Lenda', '💾 4 carreiras', '🥇 Nome DOURADO'], '🔥 MAIS ESCOLHIDO')}
 <div class="regra">🔁 Sobe e desce quando quiser. Parou de pagar, volta pro grátis — nada é apagado.</div>
 <div class="passe"><span class="pe">⏱️</span><div><b>SÓ QUER PROVAR? PASSE DE 24 HORAS</b><small>Tudo do Craque por um dia. Os R$ 4,99 descontam se você assinar.</small></div><span class="bt verde mini">R$ 4,99</span></div>
 <div class="dica">💎 Não quer pagar todo mês? Tem UM plano pra sempre, com tudo dentro: aba VITALÍCIO.</div>
</div></div>`

const av = (ic, nome, desc, preco, sel = '') => `<div class="av">${sel ? `<span class="sel">${sel}</span>` : ''}<span class="ai">${ic}</span><div><b>${nome}</b><small>${desc}</small></div><span class="ap">${preco}</span></div>`
const clube = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="abas"><span>📅 PLANOS</span><span class="on">🛡️ SEU CLUBE</span><span>💎 VITALÍCIO</span></div>
 <div class="h">MONTE O SEU CLUBE, PEÇA POR PEÇA <small>arte feita à mão · uma vez · seu pra sempre · segue o seu e-mail</small></div>
 ${av('🛡️', 'Escudo do seu clube', 'aparece na tabela, no placar, no gol e nas salas', 'R$ 29,90')}
 ${av('🐊', 'Mascote', 'carimba o gol, pula no pênalti, faz a festa de campeão', 'R$ 34,90')}
 ${av('👕', 'Manto', 'suas 2 cores no campinho e na Loja do Clube', 'R$ 19,90')}
 ${av('🔒', 'Nome reservado', 'ninguém mais usa o nome do seu clube (4 formas)', 'R$ 9,90')}
 ${av('🚁', 'Entrada de gala', 'chegada especial nas salas online', 'R$ 14,90')}
 ${av('📣', 'Canto da torcida', 'toca nos jogos da carreira e na gala', 'R$ 10,00')}
 ${av('🎨', 'Tema do seu clube na sala', 'pra quem já tem o escudo', 'R$ 6,90')}
 <div class="combo"><div><b>🧰 KIT COMPLETO</b><small>escudo + mascote + manto + nome + gala<br><s>R$ 109,50</s> separado</small></div><span class="ap big">R$ 79,90</span></div>
 <div class="regra">💡 Peça por peça você começa com <b>R$ 9,90</b> (o nome) e vai montando. O kit sai <b>R$ 29,60</b> mais barato.</div>
</div></div>`

const vital = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="abas"><span>📅 PLANOS</span><span>🛡️ SEU CLUBE</span><span class="on">💎 VITALÍCIO</span></div>
 <div class="h">UM SÓ. PRA SEMPRE. SEM MENSAL.</div>
 <div class="pl pres"><span class="fita novo">TUDO DENTRO</span>
  <div class="plt"><span class="pn">💎 PRESIDENTE VITALÍCIO</span><span class="pp">R$ 249,90<small>uma vez no Pix · nunca mais paga nada</small></span></div>
  <ul>
   <li>👑 <b>Lenda pra sempre</b> — Manual, 2D, salas à vontade, níveis, 4 carreiras, dourado</li>
   <li>🧰 <b>Kit completo do clube</b> — escudo, mascote, manto, nome, gala</li>
   <li>✨ Gala ÚNICA + 📣 canto + #️⃣ número de fundador</li>
   <li>🏟️ Seu clube nas salas dos outros, mesmo sem você jogar</li>
   <li>🎨 Tema do clube + 👔 TODAS as roupas do presidente</li>
   <li>🪙 500 moedas + 💾 2 fichas extras de carreira</li>
  </ul>
  <div class="brinde">Separado, isso passa de R$ 420. E o mensal, em 1 ano, dá R$ 178,80 — e não é seu.</div>
  <span class="bt verde">QUERO PRA SEMPRE</span>
 </div>
 <div class="regra">⬆️ Já assina? O que você pagou nos últimos 6 meses <b>desconta</b> do vitalício (até R$ 89,40).</div>
 <div class="dica">Quem já comprou Craque/Lenda de uma vez, Batismo ou Fundador antigos fica com tudo, pra sempre (regra de 13/10).</div>
</div></div>`

const regras = `<div class="esc">
 <div class="eh">O MODELO EM UMA FRASE</div>
 <p class="frase">Jogar é mensal. O clube você monta peça por peça. Ou paga UMA vez e leva tudo.</p>
 <div class="eh">A ESCADA</div>
 <div class="mapa">
  <div><b>⏱️ R$ 4,99</b>passe de 24 h pra provar</div>
  <div><b>📅 R$ 9,90 ou 14,90 / mês</b>Craque ou Lenda — o único jeito de jogar com Manual, 2D e salas</div>
  <div><b>🛡️ R$ 9,90 a 34,90 cada</b>as peças do clube, pra sempre; kit completo 79,90</div>
  <div><b>💎 R$ 249,90 uma vez</b>Presidente Vitalício: Lenda + clube inteiro + tudo, sem mensal</div>
 </div>
 <div class="eh" style="margin-top:12px">POR QUE FECHA</div>
 <ul class="pq">
  <li><b>Dinheiro todo mês</b> de quem joga, e venda avulsa de quem quer o clube bonito — os dois sem brigar.</li>
  <li><b>Peça por peça baixa a porta de entrada:</b> hoje o clube custa 79,90 de uma vez; agora dá pra começar com o nome a 9,90 ou o manto a 19,90.</li>
  <li><b>O vitalício é caro de propósito.</b> É pra quem não quer mensal nenhum e quer tudo. Um vitalício paga 17 meses de Lenda de uma vez.</li>
  <li><b>Sem brecha:</b> peça do clube NÃO dá Manual nem sala. Pra jogar com tudo, ou assina, ou é vitalício.</li>
  <li><b>Cobrança:</b> mensal no Pix recorrente da Vindi; avulso e vitalício no Pix normal. Só o aviso do servidor libera.</li>
 </ul>
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
.sel{position:absolute}.combo{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#FFE79A;border:3px solid #0C0C0C;border-radius:14px;padding:10px 12px;box-shadow:3px 3px 0 #000;margin:10px 0}.combo b{font:700 16px Oswald}.combo small{display:block;font-size:11.5px;font-weight:600;opacity:.8;line-height:1.3}.ap.big{font-size:18px;padding:6px 12px}.fita.novo{background:#FFC400;color:#0C0C0C}.pl.pres{background:linear-gradient(135deg,#1e1b4b,#7C3AED);color:#F4ECD6}.pl.pres .brinde{background:#F4ECD6;color:#0C0C0C;font:600 12px system-ui;line-height:1.35}
</style></head><body>

<h1>🛒 Mensal pra jogar · peças do clube · UM vitalício caro</h1>
<p class="sub">Todo mundo que quer Manual, 2D e salas paga mensal: ⭐ 9,90 ou 👑 14,90. O clube (escudo, mascote, manto, nome, gala, canto) é vendido PEÇA POR PEÇA, uma vez, pra sempre. E existe UM plano pra sempre, bem mais caro e sem mensal, com tudo dentro: 💎 Presidente Vitalício.</p>
<div class="cols">
 <div class="c"><span class="tag">1 · ABA PLANOS</span>${planos}</div>
 <div class="c"><span class="tag">2 · ABA SEU CLUBE</span>${clube}<p class="nota">Preços das peças são proposta minha: somam mais que o kit, pra quem quer tudo preferir o kit. Você ajusta.</p></div>
 <div class="c"><span class="tag">3 · ABA VITALÍCIO</span>${vital}</div>
 <div class="c"><span class="tag">4 · POR QUE FECHA</span>${regras}<p class="nota">Peças soltas gerais (salas extras, fichas, moedas, Super Chat, roupas) continuam numa aba AVULSOS, igual ao mockup anterior.</p></div>
</div></body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: 1944, height: 1000 }, deviceScaleFactor: 1.4 })
await page.setContent(html)
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/mockups/loja-mensal-pecas-vitalicio.png', fullPage: true })
await browser.close()
console.log('scripts/mockups/loja-mensal-pecas-vitalicio.png')
