// ─── 🚪 O PORTÃO DA COPA DO MUNDO — o desenho pro Diego aprovar ─────────────
//
// Pedido (19/09): *"esse quadrinho da Copa do Mundo pra escolher o país está
// MUITO pequeno. Às vezes a pessoa, quando acaba a liga, nem tá percebendo que
// vai começar a Copa. Tem que ser parecido com o modelo da Copa dos 8 e da
// Libertadores: acabou a liga, já aparece grande o banner da Copa, a tabela da
// liga vai pra baixo, e embaixo, maior, a escolha dos países; depois segue pra
// convocação"*.
//
// Os quadros abaixo são o `PortaoDaCopa` DE VERDADE (bancada
// `scripts/teste-copa-portao`), fase a fase, no celular.
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5216
// Rodar:  node scripts/mockup-portao-copa.mjs [--porta 5216] [--saida /tmp/portao.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5216')
const SAIDA = arg('saida', '/tmp/portao-copa.png')

const INK = '#0C0C0C', CREME = '#F4ECD6', VERDE = '#1B7A3D', GOLD = '#FFC400'
const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })

const CENAS = [
  ['inicio', '1 · ACABOU A LIGA', 'O banner da Copa já aparece <b>grande, no topo</b> — a tabela da liga recolhe embaixo, num "LIGA ENCERRADA" que abre se quiser. O dono vê o botão de começar.'],
  ['bandeira', '2 · A SUA VEZ', 'A escolha do país é a <b>própria tela</b>: escudo grande, nome legível, 2 colunas no celular (3 no monitor). O CONFIRMAR gruda no pé enquanto você rola.'],
  ['espera', '3 · A VEZ DO OUTRO', 'Quem não é a vez vê a <b>mesma grade</b>, travada — já sabe quem levou o quê e quem está escolhendo agora.'],
  ['convocacao', '4 · CONVOCAÇÃO', 'Todas as seleções escolhidas: o portão vira o relógio da convocação, e a tela dos 11 abre sozinha por cima (a mesma de sempre).'],
]

const tira = async fase => {
  const p = await nav.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
  await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ } })
  await p.goto(`http://localhost:${PORTA}/scripts/teste-copa-portao/?fase=${fase}`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2200) // arte do mundial + escudos (.webp/.svg)
  const alt = await p.evaluate(() => Math.ceil(document.querySelector('.max-w-xl').getBoundingClientRect().height))
  const png = await p.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(alt, 2600) } })
  await p.close()
  return `data:image/png;base64,${png.toString('base64')}`
}
const imagens = []
for (const [fase] of CENAS) imagens.push(await tira(fase))

const quadro = (i) => `
  <div style="flex:1;min-width:0;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:12px;color:#fff;background:${i === 1 ? VERDE : INK};border:2.5px solid ${INK};border-radius:7px;padding:2px 9px;box-shadow:2px 2px 0 ${INK}">${CENAS[i][1]}</span>
    </div>
    <div style="font-size:12px;color:rgba(12,12,12,.7);line-height:1.45;margin-bottom:9px;min-height:70px">${CENAS[i][2]}</div>
    <div style="border:4px solid ${i === 1 ? VERDE : INK};border-radius:14px;box-shadow:5px 5px 0 ${INK};overflow:hidden;background:${CREME}">
      <img src="${imagens[i]}" style="display:block;width:100%">
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
 *{box-sizing:border-box} body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:26px 24px 30px;width:1500px}
</style></head><body>
 <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:34px;color:${INK};line-height:1.05">O PORTÃO DA COPA DO MUNDO NO FIM DA LIGA</div>
 <div style="font-size:14px;color:rgba(12,12,12,.68);margin:6px 0 20px;line-height:1.5;max-width:1100px">
   O mesmo formato da <b>Copa dos 8</b> e da <b>Libertadores</b>: acabou a liga, o <b>banner da Copa</b> toma o topo da tela
   e a tabela da liga desce pra um "LIGA ENCERRADA" recolhido. Embaixo do banner vem o passo da vez —
   fila → <b>escolha do país (grande)</b> → convocação → Copa. Nada de modal por cima; a tela rola sozinha até a grade quando é a sua vez.
 </div>
 <div style="display:flex;gap:18px;align-items:flex-start">${CENAS.map((_, i) => quadro(i)).join('')}</div>
 <div style="background:#FFF6E0;border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 rgba(0,0,0,.25);padding:14px 16px;margin-top:22px;max-width:1100px">
   <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;color:${INK}">✅ O QUE MUDA E O QUE NÃO MUDA</div>
   <ul style="margin:9px 0 0;padding-left:20px;font-size:13.5px;color:rgba(12,12,12,.8);line-height:1.7">
     <li><b>Só o desenho.</b> Quem manda na fase, no relógio e no banco continua igual — e só o dono escreve.</li>
     <li><b>Os quadrinhos cresceram:</b> escudo de 36 → 56px, nome maior, e acabou a caixinha de 320px com rolagem — a lista é a tela.</li>
     <li><b>A tabela da liga não some:</b> vai pra baixo, recolhida, igual à Copa dos 8.</li>
     <li><b>Os relógios novos já valem:</b> 75s pra escolher o país, 90s pra convocar (<span style="color:${VERDE};font-weight:700">já no ar</span>).</li>
     <li><b>Reversível num commit.</b></li>
   </ul>
 </div>
</body></html>`

const p = await nav.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
