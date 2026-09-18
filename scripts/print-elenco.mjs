// 📸 PRINT DA ABA ELENCO DE VERDADE (não é mockup): abre a bancada
// `scripts/teste-elenco/` no navegador e tira foto do componente do jogo.
//
// Por que existe: em 16/09 eu mandei pro Diego um print da bancada com nomes e
// clubes INVENTADOS — sem rosto, sem gás, sem overall — e ele comparou com o
// mockup aprovado: *"essa arte q vc mandou tá bem diferente do meu anexo"*. A
// tela estava certa; a BANCADA é que mentia. Agora a bancada monta o elenco com
// trincas reais do catálogo de rostos e este script tira as fotos sempre nos
// mesmos tamanhos, pra comparação valer.
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5199
// Rodar:  node scripts/print-elenco.mjs [--porta 5199] [--saida /tmp]
import { chromium } from 'playwright-core'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5199')
const SAIDA = arg('saida', '/tmp')

// nome · largura · query · (opcional) tocar na aba RESERVAS antes da foto
const ALVOS = [
  ['elenco-desktop', 1440, 'n=27&olheiro=ouro', false],
  ['elenco-celular', 390, 'n=27&olheiro=ouro', false],
  ['elenco-celular-reservas', 390, 'n=27&olheiro=ouro', true],
  ['elenco-celular-sem-olheiro', 390, 'n=27&olheiro=nenhum', false],
  ['elenco-celular-saf', 390, 'n=31&olheiro=ouro', 'saf'], // 🏢 a aba SAF com os 4 emprestados
  // ⚠️ o alvo `novo=0` SAIU em 18/09: a trava abriu pra todo mundo (`ELENCO27_GERAL =
  // true`), então não existe mais "a tela antiga" pra comparar — o `?novo=0` hoje
  // desenha a MESMA tela e o print só enganaria quem viesse conferir depois.
  ['elenco-celular-22', 390, 'n=22&olheiro=ouro', false], // elenco ainda por encher
]

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
// 🇧🇷 o print sai em PORTUGUÊS (ver o `bl_lang` abaixo): sem isso a bancada cai no
// inglês, porque o navegador do ambiente não é pt-BR — e aí o print não é a tela dele.
for (const [nome, w, qs, reservas] of ALVOS) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' })
  await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ } })
  await p.goto(`http://localhost:${PORTA}/scripts/teste-elenco/?${qs}`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1200) // os rostos são .webp com loading=lazy
  if (reservas) {
    const btn = p.locator('button', { hasText: reservas === 'saf' ? /SAF \(/ : /RESERVAS|SUBS/ }).first()
    if (await btn.count()) { await btn.click(); await p.waitForTimeout(400) }
  }
  const arq = `${SAIDA}/${nome}.png`
  await p.screenshot({ path: arq, fullPage: true })
  const alt = await p.evaluate(() => document.getElementById('root').scrollHeight)
  console.log(`${arq}  ·  ${w}px de largura  ·  ${alt}px de altura`)
  await p.close()
}
await b.close()
