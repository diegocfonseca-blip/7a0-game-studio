// ─── 🖼️ MOCKUP: rosto de lenda nos AGENCIADOS (pergunta do Diego, 13/09) ───────
// *"Os agenciados estão sem avatar? Claro os q tem fotos apenas."*
//
// Desenha DUAS coisas pra ele decidir, lado a lado (creme/bordas/Oswald de sempre):
//   ① a GRADEZINHA de "Seus agenciados": hoje (letra) × proposta (rosto de quem tem)
//   ② a CARTA GRANDE do Zidane: hoje (letra) × com o apelido de carta velha
//
// Não muda nada no jogo — só gera o PNG pro Diego ver e aprovar.
//   node scripts/mockup-agenciados-rosto.mjs [--saida agenciados-rosto.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'agenciados-rosto.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const rosto = f => `data:image/webp;base64,${readFileSync(`public/avatars/lendas-v1/${f}`).toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:900'
const GRAD5 = 'linear-gradient(150deg,#FFE79A,#FFC400,#E8A200)'
const GRAD4 = 'linear-gradient(150deg,#F4F7FB,#CBD4DE,#9BA7B5)'

// os agenciados do print do Diego (os que têm rosto desenhado hoje)
const GRADE = [
  { nome: 'Kenny Dalglish', arte: 'kenny-dalglish-liverpool-1983.webp', grad: GRAD5 },
  { nome: 'Luís Figo', arte: 'luis-figo-real-madrid-2001.webp', grad: GRAD5 },
  { nome: 'Lothar Matthäus', arte: 'lothar-matthaus-inter-1990.webp', grad: GRAD5 },
  { nome: 'Ronaldo Fenômeno', arte: 'ronaldo-fenomeno-inter-1998.webp', grad: GRAD5 },
  { nome: 'Marcos', arte: 'marcos-palmeiras-2002.webp', grad: GRAD4 },
  { nome: 'Zico', arte: 'zico-flamengo-1981.webp', grad: GRAD5 },
  { nome: 'Garrincha', arte: 'garrincha-botafogo-1958.webp', grad: GRAD5 },
  { nome: 'Romário', arte: 'romario-vasco-2000.webp', grad: GRAD5 },
]

const tile = (c, comRosto) => `
  <button style="border:2.5px solid ${INK};border-radius:11px;aspect-ratio:3/4;padding:5px 4px;display:flex;flex-direction:column;
    align-items:center;justify-content:space-between;box-shadow:2px 2px 0 0 ${INK};position:relative;overflow:hidden;background:${c.grad}">
    <span style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.6) 48%,transparent 62%)"></span>
    ${comRosto
      ? `<img src="${rosto(c.arte)}" style="width:100%;aspect-ratio:1.5;object-fit:contain;display:block;position:relative">`
      : `<span style="width:26px;height:26px;border-radius:999px;border:2px solid rgba(0,0,0,.28);display:grid;place-items:center;${OSW};font-size:13px;background:rgba(255,255,255,.85);color:${INK};position:relative">${c.nome.trim()[0].toUpperCase()}</span>`}
    <span style="${OSW};font-size:8.5px;text-transform:uppercase;text-align:center;line-height:1.1;color:${INK};position:relative">${c.nome}</span>
    <span style="font-size:6.5px;letter-spacing:.5px;position:relative">⭐⭐⭐⭐⭐</span>
  </button>`

const grade = comRosto => `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;width:300px">
    ${GRADE.map(c => tile(c, comRosto)).join('')}
  </div>`

// carta grande do Zidane (o print dele): hoje letra · depois rosto
const carta = comRosto => `
  <div style="position:relative;overflow:hidden;border:3px solid ${INK};border-radius:16px;display:flex;flex-direction:column;
    justify-content:space-between;background:${GRAD5};aspect-ratio:3/4.2;box-shadow:5px 6px 0 0 ${INK};padding:16px;width:230px">
    <span style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.6) 48%,transparent 62%)"></span>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start">
      <span style="${OSW};background:${INK};color:#fff;border:2px solid rgba(255,255,255,.25);border-radius:8px;font-size:13px;padding:2px 7px">MEI</span>
      <span style="${OSW};color:${INK};font-size:11px;letter-spacing:.5px">👑 LENDA</span>
    </div>
    ${comRosto
      ? `<div style="width:100%;margin:10px auto;position:relative"><img src="${rosto('zinedine-zidane-juventus-1998.webp')}" style="width:100%;aspect-ratio:1.5;object-fit:contain;display:block"></div>`
      : `<div style="position:relative;align-self:center;width:100px;height:100px;border-radius:999px;display:flex;align-items:center;justify-content:center;
           background:#FFF3C4;color:#8A6A00;border:3px solid rgba(0,0,0,.28);${OSW};font-size:42px;box-shadow:inset 0 0 14px rgba(255,255,255,.7)">Z</div>`}
    <div style="position:relative">
      <p style="${OSW};color:${INK};font-size:26px;line-height:1.2;margin:0;padding-bottom:2px">Zinedine Zidane</p>
      <p style="font-family:Oswald,sans-serif;font-weight:800;color:${INK};opacity:.62;font-size:12px;margin:0">${comRosto ? 'Juventus · 1998' : 'Real Madrid · 2002'}</p>
      <p style="font-size:13px;letter-spacing:1px;margin:3px 0 0">⭐⭐⭐⭐⭐</p>
      <p style="font-weight:600;font-style:italic;color:${INK};opacity:.78;font-size:12px;line-height:1.28;margin:8px 0 0;
        display:-webkit-box;-webkit-line-clamp:${comRosto ? 3 : 5};-webkit-box-orient:vertical;overflow:hidden">“Elegância pura. O giro da Marselha, dois gols de cabeça na final da Copa de 98 e a Bola de Ouro no mesmo ano.”</p>
    </div>
  </div>`

const selo = (txt, bg, cor = '#fff') =>
  `<span style="${OSW};display:inline-block;background:${bg};color:${cor};border:2.5px solid ${INK};border-radius:999px;
    box-shadow:3px 3px 0 ${INK};padding:5px 14px;font-size:14px;text-transform:uppercase">${txt}</span>`

const html = `<style>${FONTES}
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};color:${INK};font-family:Oswald,sans-serif;padding:32px 30px 36px;width:1000px}
  h1{${OSW};font-size:34px;margin:0;text-transform:uppercase;letter-spacing:.5px}
  h2{${OSW};font-size:19px;margin:0 0 10px;text-transform:uppercase}
  .sub{font-weight:700;font-size:14px;color:rgba(12,12,12,.65);margin:6px 0 24px;line-height:1.45}
  .cx{border:3px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};background:#FBF6E9;padding:18px 18px 20px}
  .row{display:flex;gap:18px;align-items:flex-start}
  .nota{font-weight:700;font-size:12.5px;color:rgba(12,12,12,.7);line-height:1.4;margin:10px 0 0}
</style>
<body>
  <h1>🕴️ Rosto de lenda nos agenciados</h1>
  <p class="sub">Pergunta do Diego: <b>“os agenciados estão sem avatar?”</b> — só pra quem já tem rosto desenhado, claro.<br>
  Nada disso é arte nova: é o mesmo rosto que já aparece no campinho e no álbum.</p>

  <div class="row" style="margin-bottom:22px">
    <div class="cx" style="flex:1">
      <h2>① A gradezinha “seus agenciados”</h2>
      <div class="row">
        <div>
          <div style="margin-bottom:9px">${selo('hoje', RED)}</div>
          ${grade(false)}
          <p class="nota">só a letra — mesmo pra quem<br>já tem rosto pronto</p>
        </div>
        <div>
          <div style="margin-bottom:9px">${selo('proposta', GREEN)}</div>
          ${grade(true)}
          <p class="nota">rosto pra quem tem; quem não tem<br>continua na letra, igual hoje</p>
        </div>
      </div>
    </div>
  </div>

  <div class="cx">
    <h2>② A carta grande (a que você abriu no print)</h2>
    <p style="font-weight:700;font-size:13px;color:rgba(12,12,12,.7);margin:0 0 14px;line-height:1.45">
      Esta já mostra rosto desde sempre. O Zidane caiu na letra por outro motivo:
      em <b>03/09</b> você trocou a carta dele — saiu <b>Real Madrid 2002</b>, entrou <b>Juventus 1998</b>.
      O rosto foi desenhado pra carta NOVA, e o álbum guarda a carta VELHA. Aí não casa.
    </p>
    <div class="row" style="align-items:flex-start">
      <div>
        <div style="margin-bottom:9px">${selo('hoje (carta velha)', RED)}</div>
        ${carta(false)}
      </div>
      <div>
        <div style="margin-bottom:9px">${selo('com o conserto', GREEN)}</div>
        ${carta(true)}
      </div>
      <div style="flex:1;padding-left:6px">
        <div style="border:2.5px solid ${INK};border-radius:14px;background:#FFF7DB;box-shadow:3px 3px 0 ${INK};padding:14px 16px">
          <p style="${OSW};font-size:15px;margin:0 0 8px;text-transform:uppercase">🗄️ quantas cartas velhas assim existem</p>
          <table style="width:100%;border-collapse:collapse;font-weight:700;font-size:12.5px">
            <tr style="color:rgba(12,12,12,.55);text-align:left"><th style="padding:3px 0">carta no álbum</th><th>carta de hoje</th><th style="text-align:right">donos</th></tr>
            ${[['Zidane · Real Madrid 2002', 'Juventus 1998', 86],
               ['Zizinho · Flamengo 1950', 'Flamengo 1943', 50],
               ['Marcos · Palmeiras 1999', 'Palmeiras 2002', 39],
               ['Ibrahimović · Milan 2013', 'Milan 2012', 35],
               ['Ronaldinho · Grêmio 1999', 'Barcelona 2005', 1]]
              .map(([a, b, n]) => `<tr style="border-top:1.5px solid rgba(0,0,0,.1)"><td style="padding:4px 0">${a}</td><td>${b}</td><td style="text-align:right;${OSW};color:${GREEN}">${n}</td></tr>`).join('')}
          </table>
          <p class="nota" style="margin-top:10px">São as 5 cartas que a gente mesmo renomeou. Mesma pessoa,
          mesmo rosto — só o par clube+ano mudou.</p>
        </div>
        <div style="border:2.5px solid ${INK};border-radius:14px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:14px 16px;margin-top:14px">
          <p style="${OSW};font-size:15px;margin:0 0 6px;text-transform:uppercase">🚫 o que eu NÃO vou fazer</p>
          <p class="nota" style="margin:0">Emprestar rosto por NOME. Tem gente diferente com o mesmo nome no baralho —
          <b>Pepe</b> (Santos 1962 × Real Madrid 2012), <b>Alex</b>, <b>Reinaldo</b>, <b>Gérson</b>.
          Ia sair a cara de outra pessoa, e isso você já disse que não pode.</p>
        </div>
      </div>
    </div>
  </div>
</body>`

const tmp = '/tmp/mockup-agenciados-rosto.html'
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(300)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
