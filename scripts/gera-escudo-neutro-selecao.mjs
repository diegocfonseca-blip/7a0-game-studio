// Escudo NEUTRO de seleção — peça-tampão pra quando a gente NÃO tem o escudo
// oficial da federação (regra do Diego: não inventar como uma coisa real é;
// usar peça neutra e avisar). Nasceu em 14/09 pra Peru, Bélgica e Equador,
// que estavam sem arquivo em src/escalacao/img/nations-v25/ e apareciam só
// como texto na Copa do Mundo (prévia V25).
//
// O que sai: um escudo com as cores da bandeira + a sigla do país, no mesmo
// tamanho dos escudos oficiais da pasta (128px de altura, RGBA, ~5 KB).
// Quando o escudo oficial chegar, é só trocar o .webp — o código não muda.
//
//   node scripts/gera-escudo-neutro-selecao.mjs            # gera os 3 .webp
//   node scripts/gera-escudo-neutro-selecao.mjs --mockup   # + mockup.png pro Diego
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright-core'

const MOCKUP = process.argv.includes('--mockup')
const PASTA = 'src/escalacao/img/nations-v25'
const INK = '#0C0C0C'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

// cores medidas da bandeira de cada país (não chutadas)
const SELECOES = {
  peru:    { sigla: 'PER', faixas: [['#D91023', '#FFFFFF', '#D91023'], 'v'] },
  belgium: { sigla: 'BEL', faixas: [['#000000', '#FDDA24', '#EF3340'], 'v'] },
  ecuador: { sigla: 'ECU', faixas: [['#FFDD00', '#FFDD00', '#034EA2', '#ED1C24'], 'h'] },
}

// escudo 100×128 (mesma altura dos oficiais). Contorno preto grosso e sombra
// dura, igual ao resto do jogo; faixa preta embaixo com a sigla.
function svg({ sigla, faixas: [cores, dir] }) {
  const W = 100, H = 128
  const shield = `M8 6 H92 Q96 6 96 10 V70 Q96 104 50 124 Q4 104 4 70 V10 Q4 6 8 6 Z`
  const n = cores.length
  const bands = cores.map((c, i) => dir === 'v'
    ? `<rect x="${(W / n) * i}" y="0" width="${W / n + 0.5}" height="${H}" fill="${c}"/>`
    : `<rect x="0" y="${(H / n) * i}" width="${W}" height="${H / n + 0.5}" fill="${c}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><clipPath id="c"><path d="${shield}"/></clipPath></defs>
    <g clip-path="url(#c)">${bands}
      <rect x="0" y="82" width="${W}" height="22" fill="${INK}"/>
      <text x="50" y="99.5" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="17" letter-spacing="1.5" fill="#fff">${sigla}</text>
    </g>
    <path d="${shield}" fill="none" stroke="${INK}" stroke-width="5"/>
  </svg>`
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 100, height: 128 }, deviceScaleFactor: 1 })
mkdirSync('/tmp/escudos-neutros', { recursive: true })
for (const [nome, sel] of Object.entries(SELECOES)) {
  await page.setContent(`<style>${FONTES}html,body{margin:0;background:transparent}</style>${svg(sel)}`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `/tmp/escudos-neutros/${nome}.png`, omitBackground: true })
}

// PNG → webp (alpha, recorte no bbox real do desenho, teto de peso)
execFileSync('python3', ['-c', `
from PIL import Image
import sys
for nome in ${JSON.stringify(Object.keys(SELECOES))}:
    im = Image.open(f'/tmp/escudos-neutros/{nome}.png').convert('RGBA')
    a = im.getchannel('A').point(lambda v: 255 if v >= 40 else 0)
    im = im.crop(a.getbbox())
    # mesma altura dos oficiais (128) — encaixa no width/height do <img>
    if im.height != 128:
        im = im.resize((round(im.width * 128 / im.height), 128), Image.LANCZOS)
    out = f'${PASTA}/{nome}.webp'
    im.save(out, 'WEBP', quality=90, method=6)
    import os; print(nome, im.size, os.path.getsize(out), 'bytes')
`], { stdio: 'inherit' })

if (MOCKUP) {
  // lado a lado com escudos OFICIAIS da pasta, sobre o creme do jogo e nos
  // tamanhos reais da Copa (58 · 25 · 20) — pra ver se a peça neutra convive.
  const url = f => `data:image/webp;base64,${readFileSync(`${PASTA}/${f}.webp`).toString('base64')}`
  const ofic = ['paraguay', 'colombia', 'chile', 'uruguay']
  const novos = Object.keys(SELECOES)
  const img = (f, s) => `<img src="${url(f)}" height="${s}" style="object-fit:contain;vertical-align:middle">`
  const linha = (s, rotulo) => `
    <div style="margin:10px 0"><div style="font:600 11px Oswald;opacity:.55;text-transform:uppercase;margin-bottom:4px">${rotulo}</div>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        ${ofic.map(f => img(f, s)).join('')}<span style="width:2px;height:${s}px;background:rgba(0,0,0,.2)"></span>${novos.map(f => img(f, s)).join('')}
      </div></div>`
  const jogo = (a, b, s) => `
    <div style="display:flex;align-items:center;gap:8px;background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:8px 10px;margin:6px 0;font:700 13px Oswald;text-transform:uppercase">
      ${img(a[0], s)} ${a[1]} <b style="margin:0 8px;font-size:16px">2 × 1</b> ${b[1]} ${img(b[0], s)}</div>`
  const html = `<style>${FONTES}body{margin:0;background:#F4ECD6;color:${INK};padding:16px;width:380px}</style>
    <div style="font:700 18px Oswald;text-transform:uppercase">Copa do Mundo · escudos neutros</div>
    <div style="font:400 12px Oswald;opacity:.7;margin-bottom:6px">Esquerda: oficiais que já estão no jogo · direita: PER / BEL / ECU (peça neutra, até chegar o oficial)</div>
    ${linha(58, 'tamanho da tabela do mata-mata (58px)')}
    ${linha(25, 'tamanho dos jogos (25px)')}
    ${linha(20, 'tamanho dos pênaltis (20px)')}
    <div style="font:600 11px Oswald;opacity:.55;text-transform:uppercase;margin:12px 0 4px">como fica num jogo</div>
    ${jogo(['peru', 'Peru'], ['paraguay', 'Paraguai'], 25)}
    ${jogo(['belgium', 'Bélgica'], ['ecuador', 'Equador'], 25)}`
  const p2 = await browser.newPage({ viewport: { width: 412, height: 560 }, deviceScaleFactor: 2 })
  await p2.setContent(html)
  await p2.evaluate(() => document.fonts.ready)
  await p2.screenshot({ path: 'mockup-escudos-neutros.png', fullPage: true })
  console.log('mockup: mockup-escudos-neutros.png')
}
await browser.close()
