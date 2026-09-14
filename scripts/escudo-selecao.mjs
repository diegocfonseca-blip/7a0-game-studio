// Prepara o escudo OFICIAL de uma seleção pra pasta src/escalacao/img/nations-v25/.
// Nasceu em 14/09, quando Peru, Bélgica e Equador apareciam só como texto na
// Copa do Mundo porque os três .webp nunca tinham sido criados.
//
// O que ele faz com a arte que o dono manda:
//   1. recorta no limite REAL do desenho — com corte de alfa (≥ 40) e exigindo
//      pelo menos 3 pixels na linha/coluna, porque o bbox cru MENTE (a poeira
//      de alfa invisível faz o recorte devolver o arquivo inteiro, e aí o
//      navegador encaixa o vazio junto e a arte sai pequena — erro do Papão);
//   2. apaga essa poeira (alfa < 40 vira 0);
//   3. deixa 128px de altura, igual aos 21 escudos que já estavam na pasta;
//   4. salva .webp e avisa o peso (teto de escudo: 30 KB).
//
//   node scripts/escudo-selecao.mjs peru /caminho/fpf.png
//   node scripts/escudo-selecao.mjs peru /caminho/fpf.png belgium /caminho/rbfa.png …
//   node scripts/escudo-selecao.mjs --mockup peru /caminho/fpf.png   → + conferência
//
// O --mockup mostra os escudos novos ao lado dos que já estavam, SOBRE O CREME
// do jogo e nos tamanhos reais da Copa — nunca conferir recorte sobre branco
// (foi assim que as letras brancas do escudo do Theuzudo viraram buraco).
//
// O nome do arquivo tem que ser o mesmo que está em src/escalacao/national-crest.tsx
// ("Peru" → peru, "Bélgica" → belgium, "Equador" → ecuador).
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const ALTURA = 128        // mesma altura dos escudos oficiais que já estão na pasta
const CORTE_ALFA = 40     // abaixo disso é poeira invisível, não desenho
const MIN_PIXELS = 3      // 1 pixel solto também mente
const TETO_KB = 30
const PASTA = 'src/escalacao/img/nations-v25'

const MOCKUP = process.argv.includes('--mockup')
const args = process.argv.slice(2).filter(a => a !== '--mockup')
if (args.length < 2 || args.length % 2) {
  console.error('uso: node scripts/escudo-selecao.mjs <nome> <arquivo> [<nome> <arquivo> …]')
  process.exit(1)
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
await page.setContent('<body style="margin:0">')

for (let i = 0; i < args.length; i += 2) {
  const nome = args[i]
  const origem = args[i + 1]
  const dataUrl = `data:image/png;base64,${readFileSync(origem).toString('base64')}`

  const saida = await page.evaluate(async ({ dataUrl, ALTURA, CORTE_ALFA, MIN_PIXELS }) => {
    const img = new Image()
    img.src = dataUrl
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.naturalWidth; c.height = img.naturalHeight
    const g = c.getContext('2d')
    g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height)
    const px = d.data

    // apaga a poeira e mede o bbox de verdade (≥ MIN_PIXELS por linha/coluna)
    const colunas = new Array(c.width).fill(0), linhas = new Array(c.height).fill(0)
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const a = px[(y * c.width + x) * 4 + 3]
      if (a < CORTE_ALFA) { px[(y * c.width + x) * 4 + 3] = 0; continue }
      colunas[x]++; linhas[y]++
    }
    g.putImageData(d, 0, 0)
    const faixa = (arr) => {
      let a = 0, b = arr.length - 1
      while (a < arr.length && arr[a] < MIN_PIXELS) a++
      while (b > a && arr[b] < MIN_PIXELS) b--
      return [a, b]
    }
    const [x0, x1] = faixa(colunas), [y0, y1] = faixa(linhas)
    const lw = x1 - x0 + 1, lh = y1 - y0 + 1
    const sobrou = Math.round((1 - (lw * lh) / (c.width * c.height)) * 100)

    // recorta e reduz pra altura do padrão da pasta
    const out = document.createElement('canvas')
    out.height = ALTURA
    out.width = Math.max(1, Math.round(lw * ALTURA / lh))
    const og = out.getContext('2d')
    og.imageSmoothingQuality = 'high'
    og.drawImage(c, x0, y0, lw, lh, 0, 0, out.width, out.height)
    return {
      webp: out.toDataURL('image/webp', 0.92).split(',')[1],
      origem: [c.width, c.height], desenho: [lw, lh], sobrou,
      tamanho: [out.width, out.height],
    }
  }, { dataUrl, ALTURA, CORTE_ALFA, MIN_PIXELS })

  const bytes = Buffer.from(saida.webp, 'base64')
  writeFileSync(`${PASTA}/${nome}.webp`, bytes)
  const kb = (bytes.length / 1024).toFixed(1)
  const alerta = bytes.length > TETO_KB * 1024 ? `  ⚠️ PASSOU DO TETO (${TETO_KB} KB)` : ''
  console.log(`${nome}: arquivo ${saida.origem.join('×')} → desenho ${saida.desenho.join('×')} (${saida.sobrou}% era moldura vazia) → ${saida.tamanho.join('×')} · ${kb} KB${alerta}`)
}

if (MOCKUP) {
  const feitos = []
  for (let i = 0; i < args.length; i += 2) feitos.push(args[i])
  const jaTinha = ['paraguay', 'colombia', 'chile', 'uruguay']
  const INK = '#0C0C0C'
  const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
  const FONTES = [400, 600, 700].map(w =>
    `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
  const url = f => `data:image/webp;base64,${readFileSync(`${PASTA}/${f}.webp`).toString('base64')}`
  // mesma escala do componente (src/escalacao/national-crest.tsx) — escudo muito
  // estreito precisa passar do quadrado pra não parecer menor que os vizinhos
  const ESCALA = { belgium: 1.25 }
  const img = (f, s) => `<span style="display:inline-flex;width:${s}px;height:${s}px;align-items:center;justify-content:center;overflow:visible;vertical-align:middle">
      <img src="${url(f)}" style="height:${Math.round(s * (ESCALA[f] ?? 1))}px;width:auto;max-width:none;object-fit:contain"></span>`
  const linha = (s, rotulo) => `
    <div style="margin:10px 0"><div style="font:600 11px Oswald;opacity:.55;text-transform:uppercase;margin-bottom:4px">${rotulo}</div>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        ${jaTinha.map(f => img(f, s)).join('')}<span style="width:2px;height:${s}px;background:rgba(0,0,0,.2)"></span>${feitos.map(f => img(f, s)).join('')}
      </div></div>`
  const jogo = (a, b, s) => `
    <div style="display:flex;align-items:center;gap:8px;background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:8px 10px;margin:6px 0;font:700 13px Oswald;text-transform:uppercase">
      ${img(a[0], s)} ${a[1]} <b style="margin:0 8px;font-size:16px">2 × 1</b> ${b[1]} ${img(b[0], s)}</div>`
  const p2 = await browser.newPage({ viewport: { width: 412, height: 560 }, deviceScaleFactor: 2 })
  await p2.setContent(`<style>${FONTES}body{margin:0;background:#F4ECD6;color:${INK};padding:16px;width:380px}</style>
    <div style="font:700 18px Oswald;text-transform:uppercase">Copa do Mundo · escudos novos</div>
    <div style="font:400 12px Oswald;opacity:.7;margin-bottom:6px">Esquerda: os que já estavam no jogo · direita: os que entraram agora</div>
    ${linha(58, 'tamanho da tabela do mata-mata (58px)')}
    ${linha(25, 'tamanho dos jogos (25px)')}
    ${linha(20, 'tamanho dos pênaltis (20px)')}
    <div style="font:600 11px Oswald;opacity:.55;text-transform:uppercase;margin:12px 0 4px">como fica num jogo</div>
    ${jogo([feitos[0], feitos[0]], ['paraguay', 'Paraguai'], 25)}
    ${feitos[1] ? jogo([feitos[1], feitos[1]], [feitos[2] || 'chile', feitos[2] || 'Chile'], 25) : ''}`)
  await p2.evaluate(() => document.fonts.ready)
  await p2.screenshot({ path: 'mockup-escudos-selecao.png', fullPage: true })
  console.log('conferência: mockup-escudos-selecao.png')
}

await browser.close()
