// Conferência de ENCAIXE: quanto a Bélgica precisa crescer pra parecer do mesmo
// tamanho dos outros escudos. O arquivo dela é o mais estreito da pasta
// (65×128 = proporção 0,51), e como o jogo encaixa cada escudo num QUADRADO,
// ela só ocupa metade da largura — parece menor mesmo estando "inteira".
//   node scripts/mockup-encaixe-belgica.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const PASTA = 'src/escalacao/img/nations-v25'
const INK = '#0C0C0C'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const url = f => `data:image/webp;base64,${readFileSync(`${PASTA}/${f}.webp`).toString('base64')}`

// como o componente desenha hoje (quadrado + contain) e como ficaria com escala
const crest = (f, s, esc = 1) => `
  <span style="display:inline-flex;width:${s}px;height:${s}px;align-items:center;justify-content:center;overflow:visible;vertical-align:middle">
    <img src="${url(f)}" style="height:${Math.round(s * esc)}px;width:auto;max-width:none;object-fit:contain">
  </span>`

const vizinhos = ['paraguay', 'peru', 'ecuador', 'chile']
const fila = (s, esc, rotulo) => `
  <div style="margin:8px 0">
    <div style="font:600 11px Oswald;opacity:.55;text-transform:uppercase;margin-bottom:3px">${rotulo}</div>
    <div style="display:flex;gap:12px;align-items:center">
      ${vizinhos.map(f => crest(f, s)).join('')}
      <span style="width:2px;height:${s}px;background:rgba(0,0,0,.2)"></span>
      ${crest('belgium', s, esc)}
    </div></div>`

const html = `<style>${FONTES}body{margin:0;background:#F4ECD6;color:${INK};padding:16px;width:380px}</style>
  <div style="font:700 17px Oswald;text-transform:uppercase">Encaixe da Bélgica</div>
  <div style="font:400 12px Oswald;opacity:.7;margin-bottom:8px">A coroa e os ramos deixam o arquivo estreito; o jogo encaixa todo escudo num quadrado, então ela fica metade da largura dos vizinhos.</div>
  ${fila(58, 1, 'hoje (sem escala) — 58px')}
  ${fila(58, 1.15, 'com escala 1,15')}
  ${fila(58, 1.25, 'com escala 1,25')}
  ${fila(58, 1.35, 'com escala 1,35')}
  <div style="font:600 11px Oswald;opacity:.55;text-transform:uppercase;margin:12px 0 3px">no tamanho dos jogos (25px)</div>
  <div style="display:flex;gap:12px;align-items:center">
    ${crest('paraguay', 25)}${crest('belgium', 25)}<span style="font:400 11px Oswald;opacity:.6">hoje</span>
    ${crest('paraguay', 25)}${crest('belgium', 25, 1.25)}<span style="font:400 11px Oswald;opacity:.6">1,25</span>
  </div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 412, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'mockup-encaixe-belgica.png', fullPage: true })
await b.close()
console.log('mockup-encaixe-belgica.png')
