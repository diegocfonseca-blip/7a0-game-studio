// 📸 PRINT DE O MARTELO COM O MANTO (não é mockup): abre a bancada
// `scripts/teste-jornal/` e fotografa o componente do jogo.
//
// Por que existe: a pintura do manto acontece no NAVEGADOR (canvas), então
// conferir a máscara em Python prova metade. O print daqui passa pelo caminho
// inteiro — `batismos.ts` → `jornal-manto` → canvas → `<img>` — e mostra os três
// casos que importam: batismo COM camisa (pinta), batismo SEM camisa (genérico)
// e clube de CPU (genérico).
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5202
// Rodar:  node scripts/print-jornal.mjs [--porta 5202] [--saida /tmp] [--clubes "A,B"]
import { chromium } from 'playwright-core'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5202')
const SAIDA = arg('saida', '/tmp')
const CLUBES = arg('clubes', '')

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
// 🇧🇷 em PORTUGUÊS: o navegador daqui não é pt-BR, e sem isto o print sai em
// inglês — ou seja, não é a tela dele.
const p = await b.newPage({ viewport: { width: 820, height: 1200 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ } })
const qs = CLUBES ? `?clubes=${encodeURIComponent(CLUBES)}` : ''
await p.goto(`http://localhost:${PORTA}/scripts/teste-jornal/${qs}`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(3000) // a pintura roda depois que a arte e a máscara carregam
const arq = `${SAIDA}/jornal-manto.png`
await p.screenshot({ path: arq, fullPage: true })
console.log(`${arq}  ·  ${await p.evaluate(() => document.getElementById('root').scrollHeight)}px de altura`)
await b.close()
