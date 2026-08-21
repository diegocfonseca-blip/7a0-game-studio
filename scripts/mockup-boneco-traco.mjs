// ─── 🧍 BONECO DO PRESIDENTE · PROVA DE TRAÇO (2ª versão) ──────────────────
//
// A 1ª versão levou um "tá mt horrível o boneco pqp, quero mais perfeito" do
// Diego (21/08) — e com razão: eu tinha desenhado um rostinho magrelo, sem peso,
// num jogo cuja mascote (`img/sapek-mascote.webp`) é ilustração cheia de traço
// grosso, sombra e brilho.
//
// O que mudou aqui: parei de desenhar um ROSTO e passei a desenhar um MEDALHÃO
// no idioma do jogo — contorno preto GROSSO (4.2 no viewBox de 100), cor chapada,
// sombra do lado, ombros largos, terno com lapela, gola e nó de gravata.
// Peças combináveis: 5 tons de pele · 6 cabelos (curto/topete/longo/coque/boné/
// chapéu/careca) · 4 barbas · óculos de grau ou escuros · cor do terno e da
// gravata (que no jogo vêm do TIER).
//
// ⚖️ ESTE É O TETO DO DESENHO EM CÓDIGO. Se o Diego quiser o nível da mascote do
// Sapekeiros mesmo, aí é arte GERADA em .webp (presets prontos, sem montar), com
// o custo de peso e a perda da combinação livre. A escolha é dele.
//
//   node scripts/mockup-boneco-traco.mjs saida.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const S = 4.2 // espessura do traço — o jogo usa borda GROSSA

const PELE = { c: '#F2C9A0', s: '#D9A87C' }
const PELES = [
  { c: '#F6D3B0', s: '#DDB088' }, { c: '#E8B98C', s: '#C99668' },
  { c: '#C68B5E', s: '#A66C43' }, { c: '#8A5533', s: '#6E4126' }, { c: '#5A3520', s: '#432616' },
]

// bust: ombros + terno + gola + gravata
const corpo = (terno, grav) => `
  <path d="M6 100 C6 78 24 68 50 68 C76 68 94 78 94 100 Z" fill="${terno}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
  <path d="M38 69 L50 92 L62 69 C58 67 42 67 38 69 Z" fill="#F7F3E8" stroke="${INK}" stroke-width="${S * .8}" stroke-linejoin="round"/>
  <path d="M38 69 L50 92 L44 100 L30 100 C30 86 32 74 38 69 Z" fill="${terno}" stroke="${INK}" stroke-width="${S * .8}" stroke-linejoin="round"/>
  <path d="M62 69 L50 92 L56 100 L70 100 C70 86 68 74 62 69 Z" fill="${terno}" stroke="${INK}" stroke-width="${S * .8}" stroke-linejoin="round"/>
  <path d="M45 71 L55 71 L57 79 L50 83 L43 79 Z" fill="${grav}" stroke="${INK}" stroke-width="${S * .7}" stroke-linejoin="round"/>
  <path d="M46 83 L54 83 L53 100 L47 100 Z" fill="${grav}" stroke="${INK}" stroke-width="${S * .7}" stroke-linejoin="round"/>`

const cabecaBase = p => `
  <path d="M50 60 C46 60 44 62 44 66 L56 66 C56 62 54 60 50 60 Z" fill="${p.s}" stroke="${INK}" stroke-width="${S * .8}"/>
  <ellipse cx="27" cy="40" rx="5" ry="6.5" fill="${p.c}" stroke="${INK}" stroke-width="${S * .8}"/>
  <ellipse cx="73" cy="40" rx="5" ry="6.5" fill="${p.c}" stroke="${INK}" stroke-width="${S * .8}"/>
  <path d="M50 12 C66 12 74 24 74 38 C74 54 64 64 50 64 C36 64 26 54 26 38 C26 24 34 12 50 12 Z" fill="${p.c}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
  <path d="M50 12 C66 12 74 24 74 38 C74 54 64 64 50 64 C58 58 62 48 62 38 C62 26 58 16 50 12 Z" fill="${p.s}" opacity=".55"/>`

const olhos = (oculos) => oculos === 'escuros'
  ? `<path d="M30 36 L70 36" stroke="${INK}" stroke-width="${S * .9}"/>
     <path d="M31 34 h16 a2 2 0 0 1 2 2 v4 a5 5 0 0 1-5 5 h-9 a5 5 0 0 1-5-5 v-4 a2 2 0 0 1 1-2 Z" fill="${INK}"/>
     <path d="M53 34 h16 a2 2 0 0 1 1 2 v4 a5 5 0 0 1-5 5 h-9 a5 5 0 0 1-5-5 v-4 a2 2 0 0 1 2-2 Z" fill="${INK}"/>`
  : `<ellipse cx="40" cy="40" rx="3.1" ry="3.6" fill="${INK}"/><ellipse cx="60" cy="40" rx="3.1" ry="3.6" fill="${INK}"/>
     ${oculos === 'grau' ? `<g fill="none" stroke="${INK}" stroke-width="${S * .75}"><rect x="31" y="34" width="18" height="13" rx="4"/><rect x="51" y="34" width="18" height="13" rx="4"/><path d="M49 40h2"/></g>` : ''}`

const sobr = c => `<path d="M33 31 q7-3.5 13 0" stroke="${c}" stroke-width="${S * .95}" fill="none" stroke-linecap="round"/>
  <path d="M54 31 q6-3.5 13 0" stroke="${c}" stroke-width="${S * .95}" fill="none" stroke-linecap="round"/>`
const boca = t => t === 'sorriso'
  ? `<path d="M42 51 q8 7 16 0" stroke="${INK}" stroke-width="${S * .8}" fill="none" stroke-linecap="round"/>`
  : `<path d="M43 52 h14" stroke="${INK}" stroke-width="${S * .8}" fill="none" stroke-linecap="round"/>`
const nariz = p => `<path d="M50 39 v7 q-3 2-5 1" stroke="${p.s}" stroke-width="${S * .8}" fill="none" stroke-linecap="round"/>`

const CAB = {
  none: () => '',
  curto: c => `<path d="M26 38 C24 20 36 10 50 10 C64 10 76 20 74 38 C72 30 66 26 50 26 C34 26 28 30 26 38 Z" fill="${c}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`,
  topete: c => `<path d="M26 40 C24 22 34 10 50 10 C66 10 76 20 74 36 C70 28 62 24 50 24 C40 24 32 30 26 40 Z" fill="${c}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
    <path d="M44 12 C50 0 66 4 68 14 C60 8 50 8 44 12 Z" fill="${c}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`,
  longo: c => `<path d="M26 38 C24 18 36 10 50 10 C64 10 76 18 74 38 L74 62 C74 54 70 48 68 40 C60 46 40 46 32 40 C30 48 26 54 26 62 Z" fill="${c}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`,
  coque: c => `<circle cx="50" cy="8" r="9" fill="${c}" stroke="${INK}" stroke-width="${S}"/>
    <path d="M26 38 C24 18 36 10 50 10 C64 10 76 18 74 38 C70 28 64 25 50 25 C36 25 30 28 26 38 Z" fill="${c}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`,
  bone: (c, g) => `<path d="M22 34 C22 16 36 8 50 8 C64 8 78 16 78 34 Z" fill="${c}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
    <path d="M22 34 C10 34 4 40 4 44 L46 44 C46 38 36 34 22 34 Z" fill="${g}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`,
  chapeu: (c, g) => `<rect x="16" y="26" width="68" height="7" rx="3.5" fill="${c}" stroke="${INK}" stroke-width="${S}"/>
    <path d="M30 26 V6 h40 v20 Z" fill="${c}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
    <rect x="30" y="17" width="40" height="6" fill="${g}" stroke="${INK}" stroke-width="${S * .6}"/>`,
}
const BAR = {
  none: () => '',
  bigode: c => `<path d="M38 47 q12-5 24 0 q-12 6-24 0 Z" fill="${c}" stroke="${INK}" stroke-width="${S * .7}" stroke-linejoin="round"/>`,
  cavanhaque: c => `<path d="M38 47 q12-5 24 0 q-12 6-24 0 Z" fill="${c}" stroke="${INK}" stroke-width="${S * .7}"/>
    <path d="M43 55 q7 4 14 0 q-2 9-7 9 q-5 0-7-9 Z" fill="${c}" stroke="${INK}" stroke-width="${S * .7}" stroke-linejoin="round"/>`,
  cheia: c => `<path d="M27 36 C27 56 36 66 50 66 C64 66 73 56 73 36 C73 50 66 54 50 54 C34 54 27 50 27 36 Z" fill="${c}" stroke="${INK}" stroke-width="${S * .8}" stroke-linejoin="round"/>
    <path d="M38 47 q12-5 24 0 q-12 6-24 0 Z" fill="${c}"/>`,
}

const boneco = (s, o) => {
  const { pele = PELES[1], cabelo = '#1A1310', estilo = 'curto', barba = 'none', terno = '#20263A', grav = GOLD, oculos = '', boca: bk = 'sorriso', anel = INK } = o
  const semCabeloNaTesta = estilo === 'bone' || estilo === 'chapeu'
  return `<svg width="${s}" height="${s}" viewBox="-4 -4 108 108" style="display:block">
    <circle cx="50" cy="50" r="52" fill="#EFE6CF" stroke="${anel}" stroke-width="${S + 1}"/>
    <clipPath id="k${s}${estilo}${barba}${oculos}${cabelo.replace('#', '')}"><circle cx="50" cy="50" r="50"/></clipPath>
    <g clip-path="url(#k${s}${estilo}${barba}${oculos}${cabelo.replace('#', '')})">
      ${corpo(terno, grav)}
      ${cabecaBase(pele)}
      ${BAR[barba](cabelo)}
      ${nariz(pele)}
      ${boca(bk)}
      ${!semCabeloNaTesta ? sobr(cabelo) : ''}
      ${olhos(oculos)}
      ${estilo === 'bone' ? CAB.bone(terno, grav) : estilo === 'chapeu' ? CAB.chapeu(INK, grav) : CAB[estilo](cabelo)}
    </g>
  </svg>`
}

const P = [
  { pele: PELES[0], cabelo: '#4A2C1A', estilo: 'topete', barba: 'none', terno: '#20263A' },
  { pele: PELES[2], cabelo: '#1A1310', estilo: 'curto', barba: 'cavanhaque', terno: '#3B2350' },
  { pele: PELES[3], cabelo: '#1A1310', estilo: 'none', barba: 'cheia', terno: '#14402A' },
  { pele: PELES[1], cabelo: '#C9A227', estilo: 'longo', barba: 'none', terno: '#5A1E1E' },
  { pele: PELES[4], cabelo: '#1A1310', estilo: 'curto', barba: 'bigode', terno: '#20263A' },
  { pele: PELES[0], cabelo: '#9A9A9A', estilo: 'curto', barba: 'cheia', terno: '#2B2B2B', oculos: 'grau' },
  { pele: PELES[2], cabelo: '#1A1310', estilo: 'coque', barba: 'none', terno: '#7C3AED' },
  { pele: PELES[1], cabelo: '#4A2C1A', estilo: 'bone', barba: 'none', terno: '#1B7A3D', grav: '#fff' },
  { pele: PELES[3], cabelo: '#1A1310', estilo: 'chapeu', barba: 'bigode', terno: '#0C0C0C' },
  { pele: PELES[0], cabelo: '#8B5A2B', estilo: 'curto', barba: 'none', terno: '#2E6FB0', oculos: 'escuros' },
  { pele: PELES[4], cabelo: '#1A1310', estilo: 'longo', barba: 'none', terno: '#8B1A3A' },
  { pele: PELES[1], cabelo: '#1A1310', estilo: 'topete', barba: 'cheia', terno: '#20263A', oculos: 'grau' },
]

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}*{box-sizing:border-box;margin:0}
 body{background:${CREME};padding:26px;font-family:Oswald,sans-serif}</style><body>
 <div style="font-weight:700;font-size:24px;text-transform:uppercase;margin-bottom:14px">Prova de traço · medalhão</div>
 <div style="display:flex;gap:14px;flex-wrap:wrap;max-width:1000px">
   ${P.map(p => `<div style="border:4px solid ${INK};border-radius:16px;background:#fff;box-shadow:4px 4px 0 ${INK};padding:8px">${boneco(104, p)}</div>`).join('')}
 </div>
 <div style="font-weight:700;font-size:16px;margin:22px 0 10px">no tamanho que aparece na sala (64px) e no cabeçalho (40px)</div>
 <div style="display:flex;gap:12px;align-items:center">
   ${P.slice(0, 6).map(p => boneco(64, p)).join('')}
   ${P.slice(0, 6).map(p => boneco(40, p)).join('')}
 </div>
</body>`
const tmp = `/tmp/bon-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500)
await p.screenshot({ path: process.argv[2], fullPage: true })
await b.close(); console.log('ok')
