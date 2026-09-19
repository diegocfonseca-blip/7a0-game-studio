#!/usr/bin/env node
// ─── 🏛️ MOCKUP: A IDENTIDADE DO CLUBE NO SALÃO DOS BATISMOS ─────────────────
//
// Pergunta do Diego em 19/09, quando trocamos a mascote do Pesadelo Verde:
// *"cadê a arte dele cortada já no salão de batismo tb, como ficou?"*
// Arte nova não se confere só no arquivo — o que vale é como ela cai NA MOLDURA
// do jogo (a folha de papel do salão, com a caixa de 330px e `object-fit:
// contain`). Arte com moldura vazia sobrando, por exemplo, aparece pequena ali e
// em lugar nenhum mais.
//
// ⚠️ Este mockup usa o CSS DE VERDADE (`src/escalacao/salao.css`) e os ARQUIVOS
//    DE VERDADE do clube. O que muda pro jogo é só o React em volta — a folha, a
//    caixa da arte e as proporções são as mesmas. Se um dia os dois brigarem,
//    quem manda é a tela (`salao.tsx`).
//
//   node scripts/mockup-salao-clube.mjs --clube "Pesadelo Verde FC" --saida /tmp/x.png
//
// Ele acha as três peças sozinho: o escudo e a mascote por `src/escalacao/img/`
// (com `--escudo`/`--mascote` pra quem tem nome de arquivo diferente do slug) e a
// camisa pelo `salao-camisas.ts`.
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const clube = arg('clube')
const saida = arg('saida', 'mockup-salao-clube.png')
if (!clube) { console.error('faltou --clube'); process.exit(1) }

const b64 = f => fs.readFileSync(f).toString('base64')
const dataImg = f => `data:image/${f.endsWith('.png') ? 'png' : 'webp'};base64,${b64(f)}`
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const slug = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s*(fc|ec|sc|as)$/, '').trim().replace(/[^a-z0-9]+/g, '-')

const s = slug(clube)
const escudo = arg('escudo', `src/escalacao/img/${s}-escudo.webp`)
const mascote = arg('mascote', `src/escalacao/img/${s}-mascote.webp`)
// a camisa sai da lista de verdade do jogo, pra não errar a versão do arquivo
const lista = fs.readFileSync('src/escalacao/salao-camisas.ts', 'utf8')
const achou = lista.match(new RegExp(`"${clube.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"\\s*:\\s*"([^"]+)"`))
const camisa = achou ? `public/mantos-salao/${achou[1]}` : ''
for (const [nome, f] of [['escudo', escudo], ['mascote', mascote]]) {
  if (!fs.existsSync(f)) { console.error(`não achei o ${nome}: ${f} (passe --${nome})`); process.exit(1) }
}
if (!camisa || !fs.existsSync(camisa)) { console.error(`não achei a camisa de ${clube} no salao-camisas.ts`); process.exit(1) }
console.log(`escudo: ${escudo}\nmascote: ${mascote}\ncamisa: ${camisa}`)

const css = fs.readFileSync('src/escalacao/salao.css', 'utf8')
  .replace(/url\('\.\/img\/home-leilao-v07\.webp'\)/g, `url('${dataImg('src/escalacao/img/home-leilao-v07.webp')}')`)
  .replace(/url\('\.\/img\/career-sponsor-desk-v29\.webp'\)/g, `url('${dataImg('src/escalacao/img/career-sponsor-desk-v29.webp')}')`)

const folha = (titulo, src, alt, rodape) => `<div class="sb-paper"><h2>${titulo}</h2>
  <div class="sb-art"><img src="${src}" alt="${alt}"></div><p>${rodape}</p></div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;font-weight:500;src:url(${fonte(500)}) format('woff2')}
@font-face{font-family:Oswald;font-weight:700;src:url(${fonte(700)}) format('woff2')}
body{margin:0;background:#0e1511}
${css}
</style>
<div class="sb-root">
  <header class="sb-header">
    <button class="sb-back">← Voltar ao salão</button>
    <small>IDENTIDADE DO CLUBE</small>
    <h1>${clube}</h1>
    <p>Escudo, mascote e camisa. Uma história com a sua marca.</p>
  </header>
  <div class="sb-tabs"><button aria-pressed="false">Escudo</button><button aria-pressed="true">Mascote</button><button aria-pressed="false">Manto</button></div>
  <section class="sb-desk"><div class="sb-sheets">
    ${folha('Escudo', dataImg(escudo), 'Escudo', 'A MARCA DO SEU CLUBE.')}
    ${folha('Mascote', dataImg(mascote), 'Mascote', 'PERSONALIDADE PARA COMEMORAR.')}
    ${folha('Manto', dataImg(camisa), 'Manto', 'A CAMISA QUE CONTA SUA HISTÓRIA.')}
  </div></section>
  <p class="sb-note sb-owner">Identidade exclusiva deste clube. Visitar não libera o uso das artes de outro dono.</p>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.waitForTimeout(400)
await p.locator('.sb-root').screenshot({ path: saida })
await b.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024) | 0} KB`)
