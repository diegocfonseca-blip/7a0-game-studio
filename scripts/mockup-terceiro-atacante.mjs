// ─── 🎽 ONDE O 3º ATACANTE APARECE — o desenho que responde o Diego ──────────
//
// Pergunta dele (19/09), depois que eu propus destravar a compra no 4-2-3-1:
// *"mas ele não vai aparecer no campinho dos reservas, né, esse terceiro? não sei
// como fica"*. Justa: um jogador que o jogo aceita comprar e depois não mostra em
// lugar nenhum é exatamente o "estado quebrado" que ele não admite.
//
// A resposta sai da PRÓPRIA TELA, não de texto meu: os dois lados deste desenho
// são prints da aba Elenco DE VERDADE (bancada `scripts/teste-elenco/`), o mesmo
// elenco 4-2-3-1, mudando só o número de atacantes. O campinho é idêntico nos dois
// — ele só desenha os 11 titulares — e o 3º atacante entra como MAIS UMA LINHA na
// lista de reservas, que não tem número fixo de lugares.
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5211
// Rodar:  node scripts/mockup-terceiro-atacante.mjs [--porta 5211] [--saida /tmp/3atacante.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5211')
const SAIDA = arg('saida', '/tmp/3atacante.png')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F'
const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })

// ── 1) os dois prints da tela de verdade ────────────────────────────────────
// Corta do topo do campinho até o fim da página: assim o desenho mostra o
// campinho E a lista inteira, que é o par que a pergunta compara.
const tira = async ata => {
  const p = await nav.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
  await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ } })
  await p.goto(`http://localhost:${PORTA}/scripts/teste-elenco/?n=27&form=4-2-3-1&ata=${ata}&olheiro=ouro&sel=nenhum`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1500)
  const aba = p.locator('button', { hasText: /RESERVAS \(/ }).first()
  if (await aba.count()) { await aba.click(); await p.waitForTimeout(500) }
  const y = await p.evaluate(() => {
    const campo = [...document.querySelectorAll('div')].find(d =>
      getComputedStyle(d).backgroundImage.includes('gradient') && d.clientHeight > 400 && d.clientHeight < 900 && d.clientWidth > 250)
    return Math.max(0, (campo?.getBoundingClientRect().top ?? 0) + scrollY - 10)
  })
  const alt = await p.evaluate(() => document.body.scrollHeight)
  // 🎯 onde está a LINHA do 3º atacante, em % da tira — é o anel vermelho que o
  // desenho desenha por cima. Sem ele o Diego tem que caçar a diferença na mão.
  const marca = await p.evaluate(nome => {
    const alvo = [...document.querySelectorAll('div')].find(d =>
      d.clientHeight > 20 && d.clientHeight < 60 && (d.textContent || '').includes(nome))
    if (!alvo) return null
    const r = alvo.getBoundingClientRect()
    return { t: r.top + scrollY, h: r.height }
  }, 'Garrincha')
  const png = await p.screenshot({ fullPage: true, clip: { x: 0, y, width: 390, height: alt - y } })
  await p.close()
  const H = alt - y
  return { uri: `data:image/png;base64,${png.toString('base64')}`, alt: H,
    anel: marca ? { topo: (marca.t - y - 3) / H * 100, alt: (marca.h + 6) / H * 100 } : null }
}
const [esq, dir] = [await tira(2), await tira(3)]
const ALTURA = Math.round(Math.max(esq.alt, dir.alt))

// ── 2) a moldura que explica ────────────────────────────────────────────────
const lado = (rotulo, cor, titulo, sub, img) => `
  <div style="flex:1;min-width:0">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
      <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:12px;color:#fff;background:${cor};border:2.5px solid ${INK};border-radius:7px;padding:2px 9px;box-shadow:2px 2px 0 ${INK}">${rotulo}</span>
      <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;color:${INK}">${titulo}</span>
    </div>
    <div style="font-size:12.5px;color:rgba(12,12,12,.68);line-height:1.45;margin-bottom:9px;min-height:36px">${sub}</div>
    <div style="position:relative;border:4px solid ${cor};border-radius:14px;box-shadow:5px 5px 0 ${INK};overflow:hidden;background:${CREME}">
      <img src="${img.uri}" style="display:block;width:100%">
      ${img.anel ? `<div style="position:absolute;left:1.5%;right:1.5%;top:${img.anel.topo.toFixed(2)}%;height:${img.anel.alt.toFixed(2)}%;border:3px solid ${VERM};border-radius:10px;box-shadow:0 0 0 3px rgba(255,255,255,.55)"></div>
      <div style="position:absolute;right:1.5%;top:${(img.anel.topo + img.anel.alt + 0.35).toFixed(2)}%;font-family:Oswald,sans-serif;font-weight:700;font-size:12px;color:#fff;background:${VERM};border:2px solid ${INK};border-radius:6px;padding:1px 7px">⬆ o 3º atacante</div>` : ''}
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
 *{box-sizing:border-box} body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:26px 24px 30px;width:1040px}
</style></head><body>
 <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:33px;color:${INK};line-height:1.05">E O 3º ATACANTE, APARECE ONDE?</div>
 <div style="font-size:14px;color:rgba(12,12,12,.68);margin:6px 0 20px;line-height:1.5;max-width:900px">
   Os dois lados abaixo são a <b>sua aba Elenco de verdade</b>, mesmo time, mesma formação <b>4-2-3-1</b>.
   Muda só o número de atacantes. Repare: <b>o campinho é igualzinho nos dois</b> — ele desenha
   <b>só os 11 titulares</b>, e no 4-2-3-1 é 1 atacante lá na frente, hoje e sempre.
   O 3º atacante cai na <b>lista de reservas</b>, que é <b>lista</b>, não campinho: não tem número
   fixo de lugares, ela só ganha <b>mais uma linha ATA</b>.
 </div>

 <div style="display:flex;gap:20px;align-items:flex-start">
   ${lado('HOJE', VERM, '2 atacantes', 'O seu caso: 1 em campo, 1 no banco. O leilão não deixa comprar o terceiro.', esq)}
   ${lado('COM O CONSERTO', VERDE, '3 atacantes', 'Compra liberada. Nada mudou de lugar — só entrou <b>mais uma linha</b> no fim da lista de reservas.', dir)}
 </div>

 <div style="background:#FFF6E0;border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 rgba(0,0,0,.25);padding:14px 16px;margin-top:22px">
   <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;color:${INK}">✅ O QUE NÃO MUDA</div>
   <ul style="margin:9px 0 0;padding-left:20px;font-size:13.5px;color:rgba(12,12,12,.8);line-height:1.7">
     <li><b>O campinho continua com 11.</b> Reserva nunca apareceu em campinho — reserva é lista, sempre foi.</li>
     <li><b>O teto do elenco continua 27.</b> Não estou criando vaga: no 4-2-3-1 a vaga do 3º atacante <b>já existe</b> (o seu elenco separa 3 de atacante), e é o leilão que está cego pra ela.</li>
     <li><b>Ninguém entra sozinho.</b> Vaga sem lance é vaga vazia — nenhum perna-de-pau aparece no seu banco.</li>
     <li><b>Bot não muda nada.</b> O conserto é só pro técnico humano.</li>
     <li><b>Reversível num commit.</b> É uma linha de código; se der ruim, volta atrás na hora.</li>
   </ul>
 </div>

 <div style="font-size:12.5px;color:rgba(12,12,12,.5);margin-top:14px">
   Prints tirados da bancada <b>scripts/teste-elenco</b> — o componente do jogo, não desenho meu.
 </div>
</body></html>`

const p = await nav.newPage({ viewport: { width: 1040, height: ALTURA + 400 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true })
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
