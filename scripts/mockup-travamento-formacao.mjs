// ─── 🔒 POR QUE O 4-2-3-1 TRAVA — o desenho que explica ─────────────────────
//
// O Diego relatou (19/09) e não fechou na cabeça em texto: *"não consigo comprar
// porque quando vou no leilão não deixa, já tô com campinho do titular cheio e
// campinho de reserva cheio no 4-2-3-1… ainda não entendi"*.
//
// A confusão é justa, e o desenho resolve: o elenco de 27 NÃO é um saco de 27
// vagas livres. Cada vaga tem ENDEREÇO — a conta é `2× o que a formação pede na
// posição, +1`. Então num 4-2-3-1 (que roda como 4-5-1) o jogo já separou
// **11 vagas de meia e só 3 de atacante**. Os dois campinhos aparecem cheios
// porque TODAS as posições estão cheias; o que falta não é espaço, é espaço
// NO LUGAR CERTO.
//
// Rodar: node scripts/mockup-travamento-formacao.mjs [--saida /tmp/trava.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/trava-formacao.png')

const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', VERM = '#C2452F', VERDE = '#1B7A3D'
const POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
// 2× a formação + 1 (o teto de hoje, por posição)
const TETO = {
  '4-2-3-1': { GOL: 3, LAT: 5, ZAG: 5, MEI: 11, ATA: 3 },
  '4-4-2':   { GOL: 3, LAT: 5, ZAG: 5, MEI: 9,  ATA: 5 },
}
const XI = { '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 } }

const bolinhas = (n, cor) => Array.from({ length: n },
  () => `<span style="width:15px;height:15px;border-radius:50%;background:${cor};border:2px solid ${INK};display:inline-block"></span>`).join('')

const linha = (pos, teto, destaque) => `
  <div style="display:flex;align-items:center;gap:9px;padding:5px 0${destaque ? `;background:rgba(194,69,47,.10);border-radius:8px;padding-left:7px;padding-right:7px` : ''}">
    <span style="flex:none;width:34px;font-family:Oswald,sans-serif;font-weight:700;font-size:13px;color:${destaque ? VERM : INK}">${pos}</span>
    <span style="display:flex;gap:4px;flex-wrap:wrap;flex:1">${bolinhas(teto, destaque ? VERM : INK)}</span>
    <span style="flex:none;font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:${destaque ? VERM : 'rgba(12,12,12,.45)'}">${teto}</span>
  </div>`

const quadro = (titulo, sub, teto, destaque, borda) => `
  <div style="flex:1;background:#FFFDF5;border:4px solid ${borda};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:13px 15px 15px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:21px;color:${INK}">${titulo}</div>
    <div style="font-size:11.5px;color:rgba(12,12,12,.6);margin:2px 0 9px;line-height:1.4">${sub}</div>
    ${POS.map(p => linha(p, teto[p], destaque === p)).join('')}
    <div style="border-top:2px dashed rgba(12,12,12,.2);margin-top:8px;padding-top:7px;display:flex;justify-content:space-between;font-family:Oswald,sans-serif;font-weight:700;font-size:14px">
      <span>ELENCO</span><span>${POS.reduce((s, p) => s + teto[p], 0)}</span>
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
 *{box-sizing:border-box} body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:26px 24px 30px;width:980px}
</style></head><body>
 <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:34px;color:${INK};line-height:1.04">POR QUE O 4-2-3-1 TRAVA</div>
 <div style="font-size:14px;color:rgba(12,12,12,.65);margin:5px 0 20px;line-height:1.5">
   O elenco de <b>27</b> não é um saco de 27 vagas livres. <b>Cada vaga tem endereço</b> — o jogo separa
   <b>2× o que a sua formação pede em cada posição, +1</b>. Por isso os dois campinhos aparecem cheios:
   não falta espaço, falta espaço <b>no lugar certo</b>.
 </div>

 <div style="display:flex;gap:18px;align-items:stretch">
   ${quadro('4-2-3-1', 'como o jogo separa as suas 27 vagas', TETO['4-2-3-1'], 'ATA', VERM)}
   ${quadro('4-4-2', 'a mesma conta, com 2 homens de frente', TETO['4-4-2'], null, INK)}
 </div>

 <div style="background:#FFF6E0;border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 rgba(0,0,0,.25);padding:14px 16px;margin-top:20px">
   <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;color:${INK}">🔒 O QUE ACONTECE COM VOCÊ, PASSO A PASSO</div>
   <ol style="margin:9px 0 0;padding-left:20px;font-size:13.5px;color:rgba(12,12,12,.8);line-height:1.65">
     <li>Você joga <b>4-2-3-1</b>: 1 atacante em campo. O jogo te dá <b>3 vagas de atacante</b> (1 titular + 1 reserva + 1 extra) e <b>11 de meia</b>.</li>
     <li>O elenco enche: <b>27 de 27</b>. Titular cheio, reserva cheio. <b>Mas 11 desses são meias e só 3 são atacantes.</b></li>
     <li>Você quer <b>4-3-3</b>, que pede <b>3 atacantes em campo</b>. Você tem exatamente 3 no elenco inteiro — <b>zero folga</b>.</li>
     <li>Se <b>um</b> desses 3 for <b>emprestado da SAF</b> (ou carta fake), sobram 2 seus. Aí trava dos dois lados:
       <b>o leilão não deixa comprar</b> (ele vê 3 de 3 ocupadas) e <b>a troca de formação não deixa</b> (ela só conta os 2 que são seus).</li>
   </ol>
 </div>

 <div style="display:flex;gap:18px;margin-top:18px">
   <div style="flex:1;background:#FFFDF5;border:4px solid ${VERDE};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:13px 15px">
     <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:17px;color:${VERDE}">✅ CONSERTO 1 — o emprestado para de ocupar vaga</div>
     <div style="font-size:13px;color:rgba(12,12,12,.78);margin-top:6px;line-height:1.55">
       Essa <b>já é a sua regra</b> ("o empréstimo não gasta vaga"), só que a conta não cumpre.
       Passando a contar <b>só jogador seu e de verdade</b>, aquele caso do passo 4 desaparece.
       <b>Não cria vaga nenhuma</b> — só para de contar quem não devia.
     </div>
   </div>
   <div style="flex:1;background:#FFFDF5;border:4px solid ${GOLD};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:13px 15px">
     <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:17px;color:${INK}">🔁 CONSERTO 2 — mudar vaga de endereço</div>
     <div style="font-size:13px;color:rgba(12,12,12,.78);margin-top:6px;line-height:1.55">
       Ninguém usa <b>11 meias</b>. Então: abre mão de <b>1 meia</b> e ganha <b>1 atacante</b>.
       O elenco <b>continua 27</b> — você só escolhe onde gastar. É isso que destrava o
       <b>4-2-4</b>, que hoje é impossível de alcançar partindo do 4-2-3-1.
     </div>
   </div>
 </div>

 <div style="font-size:12.5px;color:rgba(12,12,12,.55);margin-top:15px;line-height:1.5">
   O 4-3-3 pede ${POS.map(p => `${p} ${XI['4-3-3'][p]}`).join(' · ')} em campo. Nenhum dos dois consertos aumenta o elenco.
 </div>
</body></html>`

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await nav.newPage({ viewport: { width: 980, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: SAIDA, fullPage: true })
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
