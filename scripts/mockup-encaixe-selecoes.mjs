// Conferência de ENCAIXE de TODOS os escudos de seleção, lado a lado, sobre o
// creme do jogo. Serve pra achar quem "aparece pequeno" — o jogo encaixa cada
// escudo num QUADRADO, então escudo estreito (ou de traço fino) fica com menos
// presença que os redondos, mesmo estando inteiro.
//   node scripts/mockup-encaixe-selecoes.mjs            → como está hoje
//   node scripts/mockup-encaixe-selecoes.mjs --proposta → hoje × com escala
import { readFileSync, readdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const PROPOSTA = process.argv.includes('--proposta')
const PASTA = 'src/escalacao/img/nations-v25'
const INK = '#0C0C0C'

// escalas do componente (src/escalacao/national-crest.tsx) + as candidatas
const ATUAL = { belgium: 1.25 }
// Só os ESTREITOS/miúdos. França e Alemanha ficam de fora de propósito: elas
// não são pequenas, são de traço CLARO (galo branco, águia cinza) — crescer não
// resolveria e a arte é oficial.
const CANDIDATA = { belgium: 1.25, argentina: 1.22, brazil: 1.15, spain: 1.12, 'south-korea': 1.12 }

const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const nomes = readdirSync(PASTA).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5))
  .filter(n => readFileSync(`${PASTA}/${n}.webp`).length > 1000)  // pula os 3 arquivos quebrados de 08/09
const url = f => `data:image/webp;base64,${readFileSync(`${PASTA}/${f}.webp`).toString('base64')}`
const crest = (f, s, tab) => `
  <span style="display:inline-flex;width:${s}px;height:${s}px;align-items:center;justify-content:center;overflow:visible">
    <img src="${url(f)}" style="height:${Math.round(s * (tab[f] ?? 1))}px;width:auto;max-width:none;object-fit:contain"></span>`
const celula = (f, tab, marca) => `
  <div style="display:flex;flex-direction:column;align-items:center;gap:2px;width:74px">
    <div style="height:76px;display:flex;align-items:center;justify-content:center">${crest(f, 58, tab)}</div>
    <span style="font:600 9px Oswald;text-transform:uppercase;opacity:${marca ? 1 : .5};color:${marca ? '#C2452F' : INK}">${f}</span>
  </div>`
const grade = (tab, marcados = []) => `<div style="display:flex;flex-wrap:wrap;gap:4px 0">${nomes.map(f => celula(f, tab, marcados.includes(f))).join('')}</div>`

const html = `<style>${FONTES}body{margin:0;background:#F4ECD6;color:${INK};padding:14px;width:392px}</style>
  <div style="font:700 17px Oswald;text-transform:uppercase">Encaixe dos escudos · 58px</div>
  <div style="font:400 12px Oswald;opacity:.7;margin-bottom:8px">${PROPOSTA
    ? 'Em cima como está no ar. Embaixo, com os estreitos crescidos (nomes em vermelho).'
    : 'Como está no ar agora, no tamanho da tabela do mata-mata.'}</div>
  ${grade(ATUAL)}
  ${PROPOSTA ? `<div style="font:600 11px Oswald;opacity:.55;text-transform:uppercase;margin:14px 0 4px">com a escala proposta</div>${grade(CANDIDATA, Object.keys(CANDIDATA))}` : ''}`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 700 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: PROPOSTA ? 'mockup-encaixe-proposta.png' : 'mockup-encaixe-selecoes.png', fullPage: true })
await b.close()
console.log(PROPOSTA ? 'mockup-encaixe-proposta.png' : 'mockup-encaixe-selecoes.png')
