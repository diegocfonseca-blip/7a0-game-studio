// 🛒 MOCKUP · LOJA COM MENSAL E PRA SEMPRE (26/10, Diego: "quero plano de valores baixos mensal e vitalício e etc e alto também").
// A MESMA escada (Craque · Lenda · Batismo · Fundador) com dois jeitos de pagar: MENSAL (Pix recorrente da Vindi, renova sozinho,
// cancela quando quiser) ou PRA SEMPRE (uma vez, como hoje). Regra que amarra os dois sem briga: 3 meses pagos = o plano vira pra
// sempre (9,90×3 ≈ 29,90 · 14,90×3 ≈ 44,90). Batismo e Fundador são só pra sempre (arte feita à mão pro clube). No topo, um degrau
// novo, 💎 Presidente, pra quem quer tudo. Embaixo, o Passe 24h e os avulsos continuam.
// uso: node scripts/mockup-loja-mensal-vitalicio.mjs → scripts/mockups/loja-mensal-vitalicio.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const PLANOS = [
  { cls: 'craque', emoji: '⭐', nome: 'CRAQUE', mes: '9,90', sempre: '29,90', linhas: ['🎮 Modo Manual + 📺 Campo 2D', '🔎 Nível e olheiro até Craque', '💾 2 carreiras + nuvem', '🧑‍💼 Seu presidente (boneco)', '🥈 Nome prata'] },
  { cls: 'lenda', emoji: '👑', nome: 'LENDA', mes: '14,90', sempre: '44,90', fita: '🔥 MAIS ESCOLHIDO', linhas: ['Tudo do Craque +', '🏟️ Salas à vontade + Minhas Ligas', '🔎 Nível e olheiro até Lenda', '💾 4 carreiras', '🥇 Nome DOURADO'] },
  { cls: 'bat', emoji: '🖋', nome: 'BATISMO', sempre: '79,90', so: true, linhas: ['Tudo do Lenda +', '🛡️ Escudo, mascote e manto do SEU clube', '🚁 Entrada de gala'] },
  { cls: 'fund', emoji: '🖋', nome: 'FUNDADOR', sempre: '99,90', so: true, linhas: ['Tudo do Batismo +', '✨ Gala ÚNICA + 📣 canto', '#️⃣ Número de fundador'] },
  { cls: 'pres', emoji: '💎', nome: 'PRESIDENTE', sempre: '199,90', so: true, novo: true, linhas: ['Tudo do Fundador +', '🎨 Tema do seu clube na sala', '👔 TODAS as roupas do presidente', '🪙 500 moedas + 💾 2 fichas extras', '📺 1 dia de anúncio seu no telão por mês'] },
]
const card = (p, modo) => {
  const mensal = modo === 'mes' && !p.so
  const preco = mensal ? `R$ ${p.mes}<small>/mês · cancela quando quiser</small>` : `R$ ${p.sempre}<small>${p.so ? 'só pra sempre · uma vez' : 'uma vez · pra sempre'}</small>`
  const outro = mensal ? `<div class="outro">ou R$ ${p.sempre} uma vez, pra sempre</div>` : (!p.so ? `<div class="outro">ou R$ ${p.mes}/mês</div>` : '')
  return `<div class="pl ${p.cls}">${p.fita ? `<span class="fita">${p.fita}</span>` : ''}${p.novo ? '<span class="fita novo">NOVO</span>' : ''}
   <div class="plt"><span class="pn">${p.emoji} ${p.nome}</span><span class="pp">${preco}</span></div>
   <ul>${p.linhas.map(l => `<li>${l}</li>`).join('')}</ul>${outro}
   <span class="bt ${p.cls === 'lenda' ? 'ouro' : 'verde'}">${mensal ? 'ASSINAR' : 'QUERO ESSE'}</span></div>`
}
const toggle = modo => `<div class="tg"><span class="${modo === 'mes' ? 'on' : ''}">📅 MENSAL</span><span class="${modo === 'sempre' ? 'on' : ''}">♾️ PRA SEMPRE</span></div>`
const telaMes = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="h">🪜 ESCOLHA SEU PLANO</div>${toggle('mes')}
 <div class="regra">💡 <b>3 meses pagos = seu pra sempre.</b> Sem pagar mais nada.</div>
 ${PLANOS.filter(p => !p.so).map(p => card(p, 'mes')).join('')}
 <div class="dica">🖋 Batismo, Fundador e 💎 Presidente são só pra sempre: a arte do seu clube é feita à mão. Veja em <b>♾️ PRA SEMPRE</b>.</div>
 <div class="passe"><span class="pe">⏱️</span><div><b>SÓ QUER PROVAR? PASSE DE 24 HORAS</b><small>Manual + Campo 2D por um dia. Os R$ 4,99 descontam se você assinar.</small></div><span class="bt verde mini">R$ 4,99</span></div>
</div></div>`
const telaSempre = `<div class="cel"><div class="top">🛒 LOJA DO CLUBE <span class="xx">✕</span></div><div class="pad">
 <div class="h">🪜 ESCOLHA SEU PLANO</div>${toggle('sempre')}
 <div class="regra">⬆️ Já tem plano? Paga só a <b>diferença</b> pra subir (+ R$ 5).</div>
 ${PLANOS.map(p => card(p, 'sempre')).join('')}
</div></div>`
const escada = `<div class="esc">
 <div class="eh">A ESCADA INTEIRA, DO BARATO AO CARO</div>
 ${[['⏱️ Passe 24h', 'R$ 4,99', 'um dia', 'provar o Manual e o 2D'], ['🎟️ Avulsos', 'R$ 4,90 a 9,99', 'cada', 'salas, ficha, temas, telão'], ['⭐ Craque', 'R$ 9,90/mês', 'ou R$ 29,90', 'Manual + 2D pra jogar'], ['👑 Lenda', 'R$ 14,90/mês', 'ou R$ 44,90', 'salas à vontade, dourado'], ['🖋 Batismo', 'R$ 79,90', 'pra sempre', 'seu clube com arte própria'], ['🖋 Fundador', 'R$ 99,90', 'pra sempre', 'gala única, canto, número'], ['💎 Presidente', 'R$ 199,90', 'pra sempre · NOVO', 'tudo + tema, roupas, moedas, telão']]
  .map(([n, p, q, d], i) => `<div class="deg" style="margin-left:${i * 14}px"><b>${n}</b><span class="dp">${p}</span><small>${q}</small><em>${d}</em></div>`).join('')}
 <div class="eh" style="margin-top:18px">COMO O MENSAL NÃO BRIGA COM O PRA SEMPRE</div>
 <ul class="pq">
  <li><b>Mesmo plano, dois jeitos de pagar.</b> Quem assina Craque tem o MESMO Craque de quem pagou 29,90 — enquanto paga.</li>
  <li><b>3 meses pagos viram pra sempre.</b> 9,90 × 3 = 29,70. Ninguém paga mais pelo mensal do que pelo plano. O mensal é um parcelamento sem juros.</li>
  <li><b>Parou de pagar antes dos 3 meses?</b> Volta pro grátis. O que foi pago fica de crédito se voltar.</li>
  <li><b>Subir de degrau vale nos dois.</b> Craque mensal → Lenda mensal: paga 14,90 no mês seguinte. Craque pra sempre → Lenda: só a diferença + 5.</li>
  <li><b>Batismo pra cima é só pra sempre.</b> É arte feita à mão pro clube: não tem como "devolver" no fim do mês.</li>
  <li><b>Cobrança:</b> Pix recorrente da Vindi. Só o aviso da Vindi no servidor libera o mês. Vence sozinho na data (a camada de assinatura já existe no jogo desde 08/10).</li>
 </ul>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:1460px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.7;font-size:15px;max-width:1380px}
.cols{display:flex;gap:24px;align-items:flex-start}.c{width:440px}.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.cel{width:440px;border:4px solid #0C0C0C;border-radius:26px;overflow:hidden;background:#F4ECD6;box-shadow:5px 5px 0 #000}
.top{background:#0C0C0C;color:#FFC400;font:700 18px Oswald;padding:12px 16px;position:relative}.xx{position:absolute;right:12px;top:8px;color:#fff;border:2px solid #fff;border-radius:8px;padding:0 8px}
.pad{padding:14px}.h{font:700 18px Oswald;text-transform:uppercase;margin:4px 0 8px}
.tg{display:flex;border:3px solid #0C0C0C;border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 #000;margin-bottom:10px;background:#fff}.tg span{flex:1;text-align:center;font:700 14px Oswald;padding:8px;letter-spacing:.5px}.tg .on{background:#FFC400}
.regra{font-weight:600;font-size:13px;background:#fff;border:2px dashed #0C0C0C;border-radius:10px;padding:7px 10px;margin-bottom:12px}
.pl{position:relative;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px;margin-bottom:14px;background:#fff}
.pl.craque{background:linear-gradient(160deg,#F4F7FB,#DDE3EA)}.pl.lenda{background:linear-gradient(160deg,#FFE79A,#FFC400 50%,#F0B000)}
.pl.bat{background:#0C0C0C;color:#F4ECD6}.pl.fund{background:linear-gradient(135deg,#14251a,#1B7A3D);color:#F4ECD6}.pl.pres{background:linear-gradient(135deg,#1e1b4b,#7C3AED);color:#F4ECD6}
.fita{position:absolute;right:10px;top:-14px;font:700 12px Oswald;background:#C2452F;color:#fff;border:2px solid #0C0C0C;border-radius:8px;padding:2px 9px;box-shadow:2px 2px 0 #000}.fita.novo{background:#FFC400;color:#0C0C0C}
.plt{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.pn{font:700 19px Oswald}.pp{font:700 22px Oswald;text-align:right;white-space:nowrap}.pp small{display:block;font:600 10.5px system-ui;opacity:.75;white-space:normal;max-width:150px}
ul{margin:6px 0 6px;padding:0;list-style:none;font-size:13px;font-weight:600;line-height:1.5}
.outro{font-size:12px;font-weight:700;opacity:.8;margin-bottom:8px}
.bt{display:block;text-align:center;font:700 15px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:11px;padding:8px;box-shadow:3px 3px 0 #000}
.bt.verde{background:#1B7A3D;color:#fff}.bt.ouro{background:#0C0C0C;color:#FFC400}.bt.mini{font-size:13px;padding:7px 8px;white-space:nowrap}
.dica{font-size:12.5px;font-weight:600;opacity:.8;margin:0 2px 12px;line-height:1.4}
.passe{display:flex;align-items:center;gap:10px;background:#fff;border:3px dashed #0C0C0C;border-radius:14px;padding:10px}.pe{font-size:30px}.passe b{font:700 14px Oswald}.passe small{display:block;font-size:12px;font-weight:600;line-height:1.35}
.esc{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:14px 16px;width:440px}
.eh{font:700 15px Oswald;letter-spacing:.5px;margin-bottom:10px;color:#7C3AED}
.deg{display:grid;grid-template-columns:118px 92px 1fr;gap:2px 8px;align-items:baseline;border-left:4px solid #FFC400;padding:4px 8px;margin-bottom:5px;background:#FFF8E6;border-radius:0 8px 8px 0}
.deg b{font:700 14px Oswald}.dp{font:700 14px Oswald;color:#1B7A3D}.deg small{font-size:10.5px;font-weight:700;opacity:.6}.deg em{grid-column:1/4;font-style:normal;font-size:11.5px;font-weight:600;opacity:.75}
.pq{font-size:12.5px;line-height:1.5;padding-left:16px;list-style:disc}.pq li{margin-bottom:6px}
.nota{font-weight:700;font-size:13.5px;margin:10px 2px 0;line-height:1.4}
</style></head><body>
<h1>🛒 Loja com MENSAL e PRA SEMPRE — do barato ao caro</h1>
<p class="sub">A mesma escada de hoje, com um botão em cima: 📅 MENSAL (Pix recorrente, renova sozinho, cancela quando quiser) ou ♾️ PRA SEMPRE (uma vez, como já é). O que amarra os dois: <b>3 meses pagos = o plano vira pra sempre</b>. Em cima da escada, um degrau novo pra quem quer tudo: 💎 Presidente.</p>
<div class="cols">
 <div class="c"><span class="tag">1 · BOTÃO EM MENSAL</span>${telaMes}<p class="nota">Só Craque e Lenda têm mensal. O texto embaixo manda quem quer Batismo pra cima pro botão PRA SEMPRE.</p></div>
 <div class="c"><span class="tag">2 · BOTÃO EM PRA SEMPRE</span>${telaSempre}<p class="nota">É a Loja de hoje, com o 💎 Presidente no topo (proposta: o que vai dentro dele você decide).</p></div>
 <div class="c"><span class="tag">3 · A ESCADA E AS REGRAS</span>${escada}</div>
</div></body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: 1504, height: 1000 }, deviceScaleFactor: 1.5 })
await page.setContent(html)
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/mockups/loja-mensal-vitalicio.png', fullPage: true })
await browser.close()
console.log('scripts/mockups/loja-mensal-vitalicio.png')
