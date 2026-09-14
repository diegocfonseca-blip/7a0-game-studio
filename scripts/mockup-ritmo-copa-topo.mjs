// Antes × depois da ORDEM da tela da Copa no online (Libertadores / Copa dos 8).
// O problema que o Diego pegou na live: a barra de manual/auto era desenhada
// DEPOIS do chaveamento e de todos os confrontos, ou seja, lá no fim da página.
// Na liga ela sempre esteve logo no começo. Aqui é a mesma peça, montada no topo.
//   node scripts/mockup-ritmo-copa-topo.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D', VERM = '#C2452F'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const bloco = (txt, alt = 30, bg = '#fff', op = 1) => `
  <div style="border:2px solid rgba(12,12,12,.35);border-radius:8px;background:${bg};height:${alt}px;
              display:flex;align-items:center;justify-content:center;font:600 10px Oswald;
              text-transform:uppercase;opacity:${op};margin-bottom:5px;color:rgba(12,12,12,.6);text-align:center;padding:0 6px">${txt}</div>`

const ritmo = `
  <div style="border:3px solid ${INK};border-radius:10px;background:${GOLD};margin-bottom:5px;
              box-shadow:2px 2px 0 ${INK};padding:6px 8px">
    <div style="font:700 10px Oswald;text-transform:uppercase;margin-bottom:4px">⏸️ Manual · 🔁 Auto · ⏩ velocidade</div>
    <div style="display:flex;gap:5px">
      <div style="flex:1.1;border:2px solid ${INK};border-radius:7px;background:${GREEN};color:#fff;font:700 10px Oswald;text-align:center;padding:5px 0">▶️ Próximo jogo</div>
      <div style="flex:1;border:2px solid ${INK};border-radius:7px;background:#fff;font:700 10px Oswald;text-align:center;padding:5px 0">⏭️ Pular</div>
    </div>
  </div>`

const tela = (ordem, titulo, cor) => `
  <div style="flex:1;min-width:0">
    <div style="font:700 12px Oswald;text-transform:uppercase;color:${cor};margin-bottom:5px">${titulo}</div>
    <div style="border:3px solid ${INK};border-radius:12px;background:${CREME};box-shadow:3px 3px 0 ${INK};padding:7px">
      <div style="background:${INK};color:${CREME};font:700 9.5px Oswald;text-transform:uppercase;border-radius:6px;padding:4px 6px;margin-bottom:5px;display:flex;justify-content:space-between">
        <span>🌎 Liberta · Oitavas</span><span>Ida</span></div>
      ${ordem.join('')}
    </div>
  </div>`

const conteudo = [
  bloco('Arte da fase<br>(Libertadores · oitavas)', 46, '#20304d', .9),
  bloco('Seu confronto · placar ao vivo', 40),
  bloco('Sua tática', 26),
  bloco('Todos os jogos da fase', 30),
  bloco('… 8 confrontos …', 30),
  bloco('Resultados das fases anteriores', 26),
]

const antes = tela([...conteudo, ritmo], '❌ Antes: no fim da página', VERM)
const depois = tela([ritmo, ...conteudo], '✅ Depois: no topo, igual à liga', GREEN)

const html = `<style>${FONTES}body{margin:0;background:#EDE4CC;color:${INK};padding:14px;width:392px}</style>
  <div style="font:700 17px Oswald;text-transform:uppercase">Ritmo da Copa no online</div>
  <div style="font:400 11.5px Oswald;opacity:.75;margin-bottom:10px;line-height:1.4">
    A barra de manual/auto é a MESMA — só mudou de lugar. Na liga ela sempre esteve no começo da tela.</div>
  <div style="display:flex;gap:10px;align-items:flex-start">${antes}${depois}</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 520 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'mockup-ritmo-copa-topo.png', fullPage: true })
await b.close()
console.log('mockup-ritmo-copa-topo.png')
