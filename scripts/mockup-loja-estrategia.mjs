// 🛒 MOCKUP · LOJA PRA VENDER MAIS (26/10, Diego: "faça o mockup que você disse que faria… já bote os preços avulsos e as coisas").
// Base: vendas reais dos últimos 30 dias no Pix (21 compradores · ~1 em 100 dos que jogam · metade do dinheiro dos planos caros veio
// de quem SUBIU de degrau). Decisão: manter a escada e os preços de hoje, pôr o Lenda em destaque, criar o Passe 24h e a oferta de
// boas-vindas, e oferecer na HORA DA VONTADE (Manual trancado, sala do dia acabou, fichas cheias).
// uso: node scripts/mockup-loja-estrategia.mjs → scripts/mockups/loja-estrategia.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const plano = (cls, emoji, nome, preco, linhas, extra = '') => `<div class="pl ${cls}">${extra}
  <div class="plt"><span class="pn">${emoji} ${nome}</span><span class="pp">R$ ${preco}<small>pra sempre</small></span></div>
  <ul>${linhas.map(l => `<li>${l}</li>`).join('')}</ul>
  <span class="bt ${cls === 'lenda' ? 'ouro' : 'verde'}">${cls === 'lenda' ? 'QUERO O LENDA' : 'QUERO ESSE'}</span></div>`

const loja = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="boas"><b>🎁 BEM-VINDO, TÉCNICO!</b><span>Sua 1ª compra: <s>R$ 29,90</s> <b class="g">⭐ Craque por R$ 19,90</b></span><small>⏳ só nas suas primeiras 48 h · acaba em 41:12:09</small><span class="bt verde mini">PEGAR O CRAQUE POR 19,90</span></div>
 <div class="h">🪜 ESCOLHA SEU PLANO <small>paga uma vez, é seu pra sempre</small></div>
 ${plano('craque', '⭐', 'CRAQUE', '29,90', ['🎮 Modo Manual nos seus jogos', '🔎 Nível e olheiro até Craque', '💾 2 carreiras salvas + nuvem', '🧑‍💼 Seu presidente (boneco)', '🥈 Nome prata em todo canto'])}
 ${plano('lenda', '👑', 'LENDA', '44,90', ['Tudo do Craque +', '🏟️ Crie salas à vontade + Minhas Ligas', '🔎 Nível e olheiro até Lenda', '💾 4 carreiras salvas', '🥇 Nome DOURADO brilhando'], '<span class="fita">🔥 MAIS ESCOLHIDO</span>')}
 <div class="dupla">
  ${plano('bat', '🖋', 'BATISMO', '79,90', ['Tudo do Lenda +', '🛡️ Escudo, mascote e manto do SEU clube', '🚁 Entrada de gala'])}
  ${plano('fund', '🖋', 'FUNDADOR', '99,90', ['Tudo do Batismo +', '✨ Gala ÚNICA + 📣 canto', '#️⃣ Número de fundador'])}
 </div>
 <div class="sobe">⬆️ Já tem plano? Você paga só a DIFERENÇA pra subir (+ R$ 5).</div>
 <div class="passe"><span class="pe">⏱️</span><div><b>NÃO SABE AINDA? PASSE DE 24 HORAS</b><small>Tudo do Craque por um dia. Gostou? Vira Craque pagando só <b>R$ 24,90</b> (os 4,99 descontam).</small></div><span class="bt verde mini">R$ 4,99</span></div>
</div></div>`

const av = (ic, nome, desc, preco) => `<div class="av"><span class="ai">${ic}</span><div><b>${nome}</b><small>${desc}</small></div><span class="ap">${preco}</span></div>`
const avulsos = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="h">🧩 AVULSOS <small>sem plano nenhum, compra só o que quer</small></div>
 <div class="grupo">🎮 PRA JOGAR MAIS</div>
 ${av('🎟️', '3 salas extras', 'acabou a sala grátis do dia? cria mais 3', 'R$ 4,90')}
 ${av('💾', 'Ficha extra de carreira', '+1 carreira salva, sua pra sempre', 'R$ 9,99')}
 ${av('⏱️', 'Passe de 24 horas', 'tudo do Craque por um dia', 'R$ 4,99')}
 <div class="grupo">🏦 MOEDAS PRA CARREIRA <small>R$ 1 = 3 🪙</small></div>
 <div class="moedas"><span>R$ 10<b>30 🪙</b></span><span>R$ 50<b>150 🪙</b></span><span class="hot">R$ 100<b>300 🪙</b></span><span>R$ 500<b>1.500 🪙</b></span></div>
 <div class="grupo">🎨 PRA SUA SALA</div>
 ${av('❤️', 'Tema do time de coração', 'a sala com as cores do seu time', 'R$ 6,90')}
 ${av('🛡️', 'Tema do seu clube', 'pra quem tem Batismo · Fundador R$ 9,90', 'R$ 6,90')}
 ${av('📣', 'Canto da torcida', 'toca nos jogos da carreira e na entrada de gala', 'R$ 10,00')}
 <div class="grupo">💬 PRA APARECER NO TELÃO</div>
 ${av('💬', 'Super Chat', 'seu recado em rosa no telão de todas as salas', '1 h R$ 2,99 · dia R$ 9,90')}
 ${av('📣', 'Anúncio da sua empresa', 'sua marca girando no telão', '1 h R$ 4,99 · dia R$ 25')}
 <div class="grupo">🧑‍💼 ROUPAS DO PRESIDENTE</div>
 ${av('👔', 'Peças avulsas', 'Craque 1,99 · Lenda 2,99 · Batismo 3,99 · Fundador 4,99', 'a partir de R$ 1,99')}
</div></div>`

const pop = (titulo, desc, b1, b2, ic) => `<div class="pop"><div class="pi">${ic}</div><b class="pt">${titulo}</b><p>${desc}</p><div class="pb"><span class="bt verde mini">${b1}</span><span class="bt ouro mini">${b2}</span></div><small class="agora">agora não</small></div>`
const vontade = `<div class="col3"><div class="cel baixa"><div class="top">⚽ NO MEIO DO JOGO</div><div class="pad sombra">
 ${pop('🎮 MODO MANUAL É DO CRAQUE', 'Bater o pênalti e mexer no time ao vivo. Libera agora:', '24 H · R$ 4,99', '⭐ CRAQUE · R$ 29,90', '🔒')}
 </div></div>
 <div class="cel baixa"><div class="top">🏟️ CRIANDO SALA</div><div class="pad sombra">
 ${pop('ACABOU SUA SALA GRÁTIS DE HOJE', 'Amanhã volta sozinha. Quer jogar agora?', '3 SALAS · R$ 4,90', '👑 LENDA · À VONTADE', '🎟️')}
 </div></div>
 <div class="cel baixa"><div class="top">🪜 NOVA CARREIRA</div><div class="pad sombra">
 ${pop('SUAS FICHAS ESTÃO CHEIAS', 'Pra começar outra sem apagar nenhuma:', '+1 FICHA · R$ 9,99', '👑 LENDA · 4 FICHAS', '💾')}
 </div></div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:1460px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.7;font-size:15px;max-width:1380px}
.cols{display:flex;gap:24px;align-items:flex-start}.c{width:440px}.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.cel{width:440px;border:4px solid #0C0C0C;border-radius:26px;overflow:hidden;background:#F4ECD6;box-shadow:5px 5px 0 #000}
.top{background:#0C0C0C;color:#FFC400;font:700 18px Oswald;padding:12px 16px;position:relative}.xx{position:absolute;right:12px;top:8px;color:#fff;border:2px solid #fff;border-radius:8px;padding:0 8px}
.pad{padding:14px}.h{font:700 18px Oswald;text-transform:uppercase;margin:6px 0 10px}.h small{display:block;font:600 12px system-ui;text-transform:none;opacity:.6}
.boas{background:#14251a;color:#F4ECD6;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px;margin-bottom:12px;display:flex;flex-direction:column;gap:3px}
.boas>b{font:700 15px Oswald;color:#FFC400;letter-spacing:.5px}.boas span{font-weight:700;font-size:14px}.boas .g{color:#5CFF8A}.boas small{font-weight:700;font-size:11.5px;opacity:.8;margin-bottom:6px}
.pl{position:relative;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px;margin-bottom:12px;background:#fff}
.pl.craque{background:linear-gradient(160deg,#F4F7FB,#DDE3EA)}.pl.lenda{background:linear-gradient(160deg,#FFE79A,#FFC400 50%,#F0B000);border-width:4px;box-shadow:5px 5px 0 #000;transform:scale(1.02)}
.pl.bat{background:#0C0C0C;color:#F4ECD6}.pl.fund{background:linear-gradient(135deg,#14251a,#1B7A3D);color:#F4ECD6}
.fita{position:absolute;right:10px;top:-14px;font:700 12px Oswald;background:#C2452F;color:#fff;border:2px solid #0C0C0C;border-radius:8px;padding:2px 9px;box-shadow:2px 2px 0 #000}
.plt{display:flex;justify-content:space-between;align-items:baseline}.pn{font:700 19px Oswald}.pp{font:700 22px Oswald;text-align:right}.pp small{display:block;font:600 10.5px system-ui;opacity:.65}
ul{margin:6px 0 8px;padding:0;list-style:none;font-size:13px;font-weight:600;line-height:1.55}
.dupla{display:flex;gap:10px}.dupla .pl{flex:1;padding:9px}.dupla .pn{font-size:16px}.dupla .pp{font-size:17px}.dupla ul{font-size:11.5px}
.bt{display:block;text-align:center;font:700 15px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:11px;padding:8px;box-shadow:3px 3px 0 #000}
.bt.verde{background:#1B7A3D;color:#fff}.bt.ouro{background:#0C0C0C;color:#FFC400}.pl.lenda .bt.ouro{background:#0C0C0C}.bt.mini{font-size:13px;padding:7px 6px}
.dupla .bt{font-size:12px;padding:6px}
.sobe{font-weight:700;font-size:12.5px;color:#1B7A3D;margin:-2px 2px 12px}
.passe{display:flex;align-items:center;gap:10px;background:#fff;border:3px dashed #0C0C0C;border-radius:14px;padding:10px}.pe{font-size:30px}.passe b{font:700 14px Oswald}.passe small{display:block;font-size:12px;font-weight:600;line-height:1.35}.passe .bt{white-space:nowrap}
.grupo{font:700 13px Oswald;letter-spacing:.8px;margin:12px 2px 6px;color:#7C3AED}.grupo small{font:700 11px system-ui;color:#0C0C0C;opacity:.55;letter-spacing:0}
.av{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #0C0C0C;border-radius:12px;padding:8px 10px;margin-bottom:7px}.ai{font-size:24px}.av div{flex:1}.av b{font:700 14px Oswald}.av small{display:block;font-size:11.5px;font-weight:600;opacity:.7}
.ap{font:700 13px Oswald;background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:9px;padding:4px 8px;white-space:nowrap;box-shadow:2px 2px 0 #000}
.moedas{display:flex;gap:6px}.moedas span{flex:1;text-align:center;background:#fff;border:2px solid #0C0C0C;border-radius:10px;padding:6px 2px;font:700 12px Oswald}.moedas b{display:block;font-size:15px}.moedas .hot{background:#FFE79A}
.col3{display:flex;flex-direction:column;gap:16px}.cel.baixa .pad{height:270px;display:flex;align-items:center;justify-content:center}.sombra{background:rgba(12,12,12,.55)}
.pop{background:#FFF8E6;border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #000;padding:12px 14px;text-align:center;width:100%}.pi{font-size:34px}.pt{display:block;font:700 18px Oswald;text-transform:uppercase}.pop p{margin:4px 0 10px;font-weight:600;font-size:13.5px}
.pb{display:flex;gap:8px}.pb .bt{flex:1}.agora{display:block;margin-top:8px;font-weight:700;font-size:12px;opacity:.55;text-decoration:underline}
.nota{font-weight:700;font-size:13.5px;margin:10px 2px 0;line-height:1.4}
</style></head><body>
<h1>🛒 Loja pra vender mais — o que eu faria</h1>
<p class="sub">Mesma escada e mesmos preços de hoje (é o que vende: metade do dinheiro dos planos caros veio de quem SUBIU de degrau). Muda: o 👑 Lenda em destaque, a 🎁 oferta de boas-vindas pra conta nova, o ⏱️ Passe 24h e a venda na HORA DA VONTADE. Nada de mensalidade.</p>
<div class="cols">
 <div class="c"><span class="tag">1 · A LOJA</span>${loja}<p class="nota">A faixa de boas-vindas só aparece pra conta nova (48 h, 1ª compra). O Lenda fica maior, com a fita, entre o Craque e o Fundador.</p></div>
 <div class="c"><span class="tag">2 · AVULSOS (preços de hoje)</span>${avulsos}</div>
 <div class="c"><span class="tag">3 · NA HORA DA VONTADE</span>${vontade}<p class="nota">Aparece onde a pessoa tropeça na trava, com a saída barata (24 h, salas, ficha) e a do plano. "Agora não" fecha e não insiste no mesmo dia.</p></div>
</div></body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: 1504, height: 1000 }, deviceScaleFactor: 1.5 })
await page.setContent(html)
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/mockups/loja-estrategia.png', fullPage: true })
await browser.close()
console.log('scripts/mockups/loja-estrategia.png')
