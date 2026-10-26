// 🛒 MOCKUP · DOIS MENSAIS + TUDO AVULSO (26/10, Diego: "e se todo mundo tivesse que pagar dois planos mensais, e o resto é tudo coisa
// avulsa, ou kit com manto, mascote e escudo… mas ainda teria que ter plano mensal").
// Modelo: só DOIS planos, os dois mensais (⭐ Craque 9,90 · 👑 Lenda 14,90), e só eles dão acesso de jogo (Manual, 2D, salas, níveis).
// Tudo o mais é AVULSO, pago uma vez e da pessoa pra sempre: 🛡️ Kit do Clube (o Batismo de hoje, sem plano dentro) · 🖋 Kit Fundador ·
// peças soltas. Detalhe que faz fechar: kit dá 6 MESES DE LENDA DE BRINDE (senão a pessoa paga a arte e vê o Manual trancado).
// uso: node scripts/mockup-loja-dois-mensais.mjs → scripts/mockups/loja-dois-mensais.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const plano = (cls, emoji, nome, preco, linhas, fita = '') => `<div class="pl ${cls}">${fita ? `<span class="fita">${fita}</span>` : ''}
  <div class="plt"><span class="pn">${emoji} ${nome}</span><span class="pp">R$ ${preco}<small>/mês · cancela quando quiser</small></span></div>
  <ul>${linhas.map(l => `<li>${l}</li>`).join('')}</ul>
  <span class="bt ${cls === 'lenda' ? 'ouro' : 'verde'}">ASSINAR</span></div>`
const planos = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="abas"><span class="on">📅 PLANOS</span><span>🛡️ SEU CLUBE</span><span>🧩 AVULSOS</span></div>
 <div class="h">SÓ DOIS PLANOS. OS DOIS MENSAIS.</div>
 ${plano('craque', '⭐', 'CRAQUE', '9,90', ['🎮 Modo Manual + 📺 Campo 2D', '🔎 Nível e olheiro até Craque', '💾 2 carreiras + nuvem', '🧑‍💼 Seu presidente (boneco)', '🥈 Nome prata'])}
 ${plano('lenda', '👑', 'LENDA', '14,90', ['Tudo do Craque +', '🏟️ Salas à vontade + Minhas Ligas', '🔎 Nível e olheiro até Lenda', '💾 4 carreiras', '🥇 Nome DOURADO'], '🔥 MAIS ESCOLHIDO')}
 <div class="regra">🔁 Sobe e desce quando quiser: muda o valor no mês seguinte. Parou de pagar, volta pro grátis — nada é apagado.</div>
 <div class="passe"><span class="pe">⏱️</span><div><b>SÓ QUER PROVAR? PASSE DE 24 HORAS</b><small>Tudo do Craque por um dia. Os R$ 4,99 descontam se você assinar.</small></div><span class="bt verde mini">R$ 4,99</span></div>
 <div class="dica">🛡️ Escudo, mascote, manto e gala não são plano: são <b>seus pra sempre</b>, na aba SEU CLUBE.</div>
</div></div>`

const kit = (cls, emoji, nome, preco, linhas, brinde) => `<div class="pl ${cls}">
  <div class="plt"><span class="pn">${emoji} ${nome}</span><span class="pp">R$ ${preco}<small>uma vez · seu pra sempre</small></span></div>
  <ul>${linhas.map(l => `<li>${l}</li>`).join('')}</ul>
  <div class="brinde">🎁 ${brinde}</div>
  <span class="bt verde">QUERO O MEU CLUBE</span></div>`
const clube = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="abas"><span>📅 PLANOS</span><span class="on">🛡️ SEU CLUBE</span><span>🧩 AVULSOS</span></div>
 <div class="h">SEU CLUBE DE VERDADE <small>arte feita à mão, uma vez, pra sempre — segue o seu e-mail</small></div>
 ${kit('bat', '🛡️', 'KIT DO CLUBE', '79,90', ['🛡️ Escudo do SEU clube', '🐊 Mascote que comemora seu gol', '👕 Manto com as suas cores', '🔒 Nome reservado (4 formas)', '🚁 Entrada de gala nas salas'], '6 MESES DE 👑 LENDA DE BRINDE · depois R$ 14,90/mês, se quiser')}
 ${kit('fund', '🖋', 'KIT FUNDADOR', '99,90', ['Tudo do Kit do Clube +', '✨ Entrada de gala ÚNICA, só sua', '📣 Canto da torcida (carreira e online)', '#️⃣ Número de fundador', '🏟️ Seu clube nas salas dos outros, mesmo sem você jogar'], '6 MESES DE 👑 LENDA DE BRINDE · depois R$ 14,90/mês, se quiser')}
 <div class="regra">⬆️ Já tem o Kit do Clube? Vira Fundador por <b>R$ 29,90</b>.</div>
</div></div>`

const av = (ic, nome, desc, preco) => `<div class="av"><span class="ai">${ic}</span><div><b>${nome}</b><small>${desc}</small></div><span class="ap">${preco}</span></div>`
const avulsos = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="abas"><span>📅 PLANOS</span><span>🛡️ SEU CLUBE</span><span class="on">🧩 AVULSOS</span></div>
 <div class="h">PEÇAS SOLTAS <small>uma vez, sem plano nenhum</small></div>
 <div class="grupo">🎮 PRA JOGAR MAIS</div>
 ${av('⏱️', 'Passe de 24 horas', 'tudo do Craque por um dia', 'R$ 4,99')}
 ${av('🎟️', '3 salas extras', 'acabou a sala grátis do dia? cria mais 3', 'R$ 4,90')}
 ${av('💾', 'Ficha extra de carreira', '+1 carreira salva, pra sempre', 'R$ 9,99')}
 <div class="grupo">🏦 MOEDAS PRA CARREIRA <small>R$ 1 = 3 🪙</small></div>
 <div class="moedas"><span>R$ 10<b>30 🪙</b></span><span>R$ 50<b>150 🪙</b></span><span class="hot">R$ 100<b>300 🪙</b></span><span>R$ 500<b>1.500 🪙</b></span></div>
 <div class="grupo">🎨 PRA SUA SALA</div>
 ${av('❤️', 'Tema do time de coração', 'a sala com as cores do seu time', 'R$ 6,90')}
 ${av('🛡️', 'Tema do seu clube', 'pra quem tem o Kit · Fundador R$ 9,90', 'R$ 6,90')}
 ${av('📣', 'Canto da torcida', 'toca nos jogos da carreira e na gala', 'R$ 10,00')}
 <div class="grupo">💬 PRA APARECER NO TELÃO</div>
 ${av('💬', 'Super Chat', 'seu recado em rosa em todas as salas', '1 h R$ 2,99 · dia R$ 9,90')}
 ${av('📣', 'Anúncio da sua empresa', 'sua marca girando no telão', '1 h R$ 4,99 · dia R$ 25')}
 <div class="grupo">🧑‍💼 ROUPAS DO PRESIDENTE</div>
 ${av('👔', 'Peças avulsas', 'por nível: 1,99 · 2,99 · 3,99 · 4,99', 'a partir de R$ 1,99')}
</div></div>`

const regras = `<div class="esc">
 <div class="eh">O MODELO EM UMA FRASE</div>
 <p class="frase">Jogar é <b>mensal</b>. Ter um clube é <b>seu pra sempre</b>.</p>
 <div class="eh">POR QUE FECHA</div>
 <ul class="pq">
  <li><b>Só 2 planos, fáceis de explicar.</b> Craque pra jogar com Manual e 2D. Lenda pra criar salas à vontade. Acabou a dúvida de "qual eu compro".</li>
  <li><b>Dinheiro todo mês.</b> Hoje 21 pessoas pagaram uma vez e acabou. 200 assinantes = ~R$ 2.400 por mês, todo mês.</li>
  <li><b>O kit não briga com o mensal.</b> Quem compra o Kit do Clube ganha 6 meses de Lenda: paga a arte e já joga com tudo. Depois decide se assina.</li>
  <li><b>Quem já pagou fica como está</b> (regra de 13/10): Craque/Lenda de uma vez, Batismo e Fundador antigos continuam com tudo, pra sempre.</li>
  <li><b>Quem não gosta de assinar</b> tem o Passe 24h, as salas extras e as fichas.</li>
  <li><b>Cobrança:</b> Pix recorrente da Vindi. Só o aviso da Vindi no servidor libera o mês; vence sozinho na data.</li>
 </ul>
 <div class="eh">ONDE CADA COISA MORA</div>
 <div class="mapa">
  <div><b>📅 PLANOS (mensal)</b>Manual · Campo 2D · níveis · carreiras · salas · cor do nome · boneco</div>
  <div><b>🛡️ SEU CLUBE (uma vez)</b>escudo · mascote · manto · nome · gala · canto · nº de fundador</div>
  <div><b>🧩 AVULSOS (uma vez)</b>passe 24h · salas · fichas · moedas · temas · telão · roupas</div>
 </div>
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
</style></head><body>
<h1>🛒 Dois mensais + tudo avulso</h1>
<p class="sub">Só DOIS planos, os dois mensais: ⭐ Craque 9,90 e 👑 Lenda 14,90. Só eles dão acesso de jogo. O resto é pago UMA vez e é da pessoa pra sempre: o clube (escudo, mascote, manto, gala) e as peças soltas. Quem compra um kit ganha 6 meses de Lenda de brinde.</p>
<div class="cols">
 <div class="c"><span class="tag">1 · ABA PLANOS</span>${planos}</div>
 <div class="c"><span class="tag">2 · ABA SEU CLUBE</span>${clube}<p class="nota">É o Batismo e o Fundador de hoje, com os mesmos preços — só que sem plano dentro. O brinde de 6 meses faz a pessoa já jogar com tudo.</p></div>
 <div class="c"><span class="tag">3 · ABA AVULSOS</span>${avulsos}</div>
 <div class="c"><span class="tag">4 · POR QUE FECHA</span>${regras}</div>
</div></body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: 1944, height: 1000 }, deviceScaleFactor: 1.4 })
await page.setContent(html)
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/mockups/loja-dois-mensais.png', fullPage: true })
await browser.close()
console.log('scripts/mockups/loja-dois-mensais.png')
