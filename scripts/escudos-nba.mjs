// ─── 🏀🛡️ ESCUDOS OFICIAIS DAS 30 FRANQUIAS DA NBA ─────────────────────────────
//
// Diego (18/11): *"pedi escudos oficiais cara"*. Mesma decisão do futebol (28/09, `escudos-oficiais.mjs`): avisei do risco de
// marca registrada (o logo é marca da franquia/NBA) e a decisão foi dele. Se alguém reclamar, basta apagar o arquivo da franquia em
// `public/escudos-nba/` e a linha em `src/escalacao/escudos-nba.ts`: ela volta sozinha pro escudo genérico.
//
// Fonte: npm `react-nba-logos@1.1.3` (ISC) — SVG das 30 franquias. Aqui cada SVG vira `public/escudos-nba/<sigla>.webp`
// (160 px no lado maior, recortado no desenho — regra do bbox com corte de alfa ≥ 40 e 3 px por linha), FORA do bundle.
//
// uso: node scripts/escudos-nba.mjs [--fontes pasta]
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const FONTES = path.resolve(arg('--fontes', '/tmp/escudos-nba-fontes'))
const SAIDA = 'public/escudos-nba'
mkdirSync(FONTES, { recursive: true }); mkdirSync(SAIDA, { recursive: true })
const pkg = path.join(FONTES, 'package')
if (!existsSync(pkg)) { const tgz = execSync('npm pack react-nba-logos@1.1.3 --silent', { cwd: FONTES }).toString().trim().split('\n').pop(); execSync(`tar xzf "${tgz}"`, { cwd: FONTES }) }

// os ícones pedem `react`/`prop-types` de onde estão: aponta pro node_modules do jogo
{ const nm = path.join(FONTES, 'node_modules'); mkdirSync(nm, { recursive: true })
  for (const m of ['react', 'react-dom']) if (!existsSync(path.join(nm, m))) symlinkSync(path.resolve('node_modules', m), path.join(nm, m))
  // prop-types só serve pra conferir as props em desenvolvimento: um "faz nada" basta pra desenhar o SVG
  mkdirSync(path.join(nm, 'prop-types'), { recursive: true })
  writeFileSync(path.join(nm, 'prop-types', 'index.js'), 'const f = new Proxy(function () { return f }, { get: () => f }); module.exports = f\n') }

// nome da franquia no jogo (NBA_LESTE / NBA_OESTE do store) → sigla do arquivo
const TIMES = { Celtics: 'bos', Knicks: 'nyk', Sixers: 'phi', Nets: 'bkn', Raptors: 'tor', Bucks: 'mil', Cavaliers: 'cle', Pacers: 'ind', Bulls: 'chi', Pistons: 'det', Heat: 'mia', Magic: 'orl', Hawks: 'atl', Hornets: 'cha', Wizards: 'was',
  Lakers: 'lal', Warriors: 'gsw', Clippers: 'lac', Suns: 'phx', Kings: 'sac', Nuggets: 'den', Timberwolves: 'min', Thunder: 'okc', Jazz: 'uta', 'Trail Blazers': 'por', Mavericks: 'dal', Rockets: 'hou', Spurs: 'sas', Grizzlies: 'mem', Pelicans: 'nop' }

const require = createRequire(import.meta.url)
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server')
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
const indice = {}
let total = 0
for (const [nome, sig] of Object.entries(TIMES)) {
  const Comp = require(path.join(pkg, 'dist/Icons', sig + '.js')).default
  const svg = renderToStaticMarkup(React.createElement(Comp, { size: 600 }))
  const out = await page.evaluate(async svg => {
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode()
    const c = document.createElement('canvas'); c.width = c.height = 600; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 600, 600)
    const d = g.getImageData(0, 0, 600, 600).data
    // bbox com corte de alfa ≥ 40 e pelo menos 3 pixels na linha/coluna (o bbox cru mente — regra do Papão)
    const lin = new Array(600).fill(0), col = new Array(600).fill(0)
    for (let y = 0; y < 600; y++) for (let x = 0; x < 600; x++) if (d[(y * 600 + x) * 4 + 3] >= 40) { lin[y]++; col[x]++ }
    const y0 = lin.findIndex(v => v >= 3), y1 = 599 - [...lin].reverse().findIndex(v => v >= 3), x0 = col.findIndex(v => v >= 3), x1 = 599 - [...col].reverse().findIndex(v => v >= 3)
    const w = x1 - x0 + 1, h = y1 - y0 + 1, k = 160 / Math.max(w, h), W = Math.round(w * k), H = Math.round(h * k)
    const o = document.createElement('canvas'); o.width = W; o.height = H; o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, W, H)
    return { url: o.toDataURL('image/webp', 0.88), W, H }
  }, svg)
  const buf = Buffer.from(out.url.split(',')[1], 'base64')
  writeFileSync(path.join(SAIDA, sig + '.webp'), buf); total += buf.length
  indice[nome] = { src: `escudos-nba/${sig}.webp`, w: out.W, h: out.H }
}
await browser.close()
writeFileSync('src/escalacao/escudos-nba.ts', `// ⚠️ ARQUIVO GERADO por \`node scripts/escudos-nba.mjs\` — não editar na mão.
// 🏀🛡️ Escudo OFICIAL das 30 franquias da NBA (decisão do Diego, 18/11). A imagem mora em \`public/\` (fora do bundle).
// ${Object.keys(indice).length} escudos · ${Math.round(total / 1024)} KB somados.
export const ESCUDOS_NBA: Record<string, { src: string; w: number; h: number }> = ${JSON.stringify(indice, null, 2)}
`)
console.log('ok', Object.keys(indice).length, Math.round(total / 1024) + ' KB')
