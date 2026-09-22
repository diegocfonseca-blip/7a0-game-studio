// ─── 📲 MOCKUP DE STORIES: AS CARTAS NOVAS DO BARALHO ───────────────────────
//
// Pedido do Diego (22/09): *"me mande mockup agora com a lista de todos jogadores
// novos que fizemos de ontem pra hoje. SEM FALAR NÍVEL OU CATEGORIA. Pra eu postar
// no Instagram stories só"*.
//
// 🚫 REGRA DESTE POST: **nada de nível nem de categoria**. Sem lenda, sem craque,
//    sem promessa, sem estrelinha, sem número de 0 a 100. Só NOME + CLUBE + ANO —
//    que é o que identifica a carta. Quem for mexer aqui: não "melhore" o post
//    colocando o tier de volta; foi ordem explícita dele.
//
// 📐 FORMATO: 1080×1920 (9:16), o do Instagram Stories. Gera em 2× por padrão
//    (2160×3840) pra ficar nítido no celular.
//
// 🎨 A cara é a do jogo, como toda arte daqui: creme #F4ECD6, tinta #0C0C0C,
//    dourado #FFC400, bordas pretas grossas, sombra dura deslocada e Oswald
//    condensada. A fonte vem de `scripts/fonts/` (fora do bundle do jogo).
//
// 🤖 A LISTA NÃO É ESCRITA À MÃO: ela é lida do `data.ts`, dos lotes que a gente
//    marcar em `LOTES` abaixo. Assim o post nunca discorda do baralho — se a carta
//    não está no jogo, ela não aparece no story, e vice-versa.
//
// uso:  node scripts/mockup-cartas-novas.mjs
//       node scripts/mockup-cartas-novas.mjs --lotes L32,L33,L34 --saida /tmp/x.png
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const LOTES = arg('lotes', 'L32,L33,L34').split(',').map(s => s.trim()).filter(Boolean)
const SAIDA = arg('saida', 'mockups/cartas-novas-stories.png')
const ESCALA = Number(arg('escala', '2'))
const TITULO = arg('titulo', 'CHEGARAM NO LEILÃO')
const SUB = arg('sub', '47 jogadores novos no baralho')

const src = fs.readFileSync('src/escalacao/data.ts', 'utf8')

// ── lê as cartas dos lotes pedidos, direto do data.ts ──────────────────────
const SETORES = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const porSetor = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
const re = new RegExp(`const ((?:${LOTES.join('|')})_[A-Z]+(?:_[A-Z]+)?): C\\[\\] = \\[([\\s\\S]*?)\\n\\]`, 'g')
let m
while ((m = re.exec(src))) {
  const setor = m[1].split('_').pop()
  if (!SETORES.includes(setor)) continue
  const cartas = [...m[2].matchAll(/\{\s*name:\s*["']([^"']+)["']\s*,\s*club:\s*["']([^"']+)["']\s*,\s*year:\s*(\d+)/g)]
  for (const c of cartas) porSetor[setor].push({ nome: c[1], clube: c[2], ano: c[3] })
}
// 🧤 CARTAS SOLTAS: quem não nasceu num lote L3x precisa ser apontado aqui na mão.
// Hoje é só o Koeman Jr, que entrou no `L31_EU_GOL` (o lote dos goleiros da leva 31)
// porque ali era o lugar certo dele no arquivo. Sem esta linha ele sumiria do post.
const AVULSOS = [{ setor: 'GOL', nome: 'Ronald Koeman Jr', clube: 'Oostende', ano: '2019' }]
for (const a of AVULSOS) {
  if (!src.includes(`name: "${a.nome}"`) && !src.includes(`name: '${a.nome}'`)) continue
  if (!porSetor[a.setor].some(c => c.nome === a.nome)) porSetor[a.setor].push({ nome: a.nome, clube: a.clube, ano: a.ano })
}

// 🏷️ no POST o nome sai limpo: "Maicon (Grêmio)" vira "Maicon", porque o clube já
//    aparece do lado. O parêntese existe no código só pra separar de um xará.
const limpo = n => n.replace(/\s*\([^)]*\)\s*$/, '').trim()
const total = SETORES.reduce((s, p) => s + porSetor[p].length, 0)

const NOME_SETOR = { GOL: 'GOLEIROS', LAT: 'LATERAIS', ZAG: 'ZAGUEIROS', MEI: 'MEIO-CAMPO', ATA: 'ATAQUE' }
const EMOJI = { GOL: '🧤', LAT: '↔️', ZAG: '🛡️', MEI: '🎩', ATA: '⚡' }

const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const bloco = pos => {
  const lista = porSetor[pos]
  if (!lista.length) return ''
  // 📏 UMA LINHA POR JOGADOR, de propósito: com nome e clube empilhados, 47 cartas
  //    estouravam o rodapé do story em 15. Em linha única cabe tudo sem encolher a
  //    letra a ponto de não dar pra ler no celular.
  const itens = lista.map(c => `
    <div class="j"><span class="n">${limpo(c.nome)}</span><span class="c">${c.clube} ${c.ano}</span></div>`).join('')
  return `
  <section class="bl">
    <div class="cab">${EMOJI[pos]} ${NOME_SETOR[pos]} <b>${lista.length}</b></div>
    <div class="gr">${itens}</div>
  </section>`
}

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @font-face { font-family: Osw; src: url('${fonte(700)}') format('woff2'); font-weight: 700 }
  @font-face { font-family: Osw; src: url('${fonte(600)}') format('woff2'); font-weight: 600 }
  * { margin: 0; padding: 0; box-sizing: border-box }
  body { width: 1080px; height: 1920px; background: #F4ECD6; color: #0C0C0C;
         font-family: Osw, system-ui, sans-serif; padding: 52px 50px 40px;
         display: flex; flex-direction: column; overflow: hidden }
  .pill { align-self: flex-start; background: #FFC400; border: 5px solid #0C0C0C;
          border-radius: 999px; padding: 10px 30px 12px; font-weight: 700;
          font-size: 30px; letter-spacing: 2px; text-transform: uppercase;
          box-shadow: 7px 7px 0 #0C0C0C }
  h1 { font-weight: 700; font-size: 86px; line-height: .92; text-transform: uppercase;
       margin: 16px 0 6px; letter-spacing: -1px }
  h1 em { font-style: normal; color: #C2452F }
  .sub { font-weight: 600; font-size: 32px; opacity: .72; margin-bottom: 20px }
  .cols { flex: 1; column-count: 2; column-gap: 28px }
  /* 📏 O BLOCO PODE QUEBRAR ENTRE AS COLUNAS, o JOGADOR nao. Com break-inside
     avoid no bloco inteiro, o meio-campo (18 cartas) nao cabia numa coluna so e
     empurrava tudo pra fora do story. Quebrando o bloco, as duas colunas enchem
     parelhas; o avoid fica na fichinha, que e o que nao pode ser cortado ao meio.
     (Sem crase neste comentario: ele vive dentro de um template literal.) */
  .bl { margin-bottom: 14px }
  .cab { break-after: avoid }
  .j { break-inside: avoid }
  .cab { background: #0C0C0C; color: #F4ECD6; border-radius: 10px;
         padding: 7px 16px 9px; font-weight: 700; font-size: 27px;
         letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 11px }
  .cab b { color: #FFC400; margin-left: 5px }
  .gr { display: flex; flex-direction: column; gap: 6px }
  .j { background: #fff; border: 3px solid #0C0C0C; border-radius: 10px;
       padding: 5px 13px 7px; box-shadow: 4px 4px 0 #0C0C0C;
       display: flex; align-items: baseline; gap: 8px; line-height: 1.06;
       white-space: nowrap; overflow: hidden }
  .n { font-weight: 700; font-size: 29px; flex: none }
  .c { font-weight: 600; font-size: 20px; opacity: .55; overflow: hidden; text-overflow: ellipsis }
  footer { display: flex; align-items: center; justify-content: space-between;
           border-top: 5px solid #0C0C0C; padding-top: 20px; margin-top: 8px }
  .marca { font-weight: 700; font-size: 42px; text-transform: uppercase }
  .marca em { font-style: normal; color: #C2452F }
  .site { font-weight: 600; font-size: 28px; opacity: .55 }
</style></head><body>
  <div class="pill">⚽ Baralho novo</div>
  <h1>${TITULO.replace(/^(\S+)/, '<em>$1</em>')}</h1>
  <div class="sub">${SUB.replace('47', String(total))}</div>
  <div class="cols">${SETORES.map(bloco).join('')}</div>
  <footer>
    <div class="marca">Leilão <em>Legends</em></div>
    <div class="site">leilaolegends.com</div>
  </footer>
</body></html>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: ESCALA })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(350)
fs.mkdirSync(path.dirname(SAIDA), { recursive: true })
await p.screenshot({ path: SAIDA })
// 📏 CONFERE SE VAZOU — e confere o RODAPÉ junto. A 1ª versão desta trava olhava
// só as fichinhas de jogador, disse "tudo certo" e o "LEILÃO LEGENDS" estava
// cortado ao meio na imagem. Se o post tem rodapé, o rodapé faz parte do post.
const vazou = await p.evaluate(() => {
  const h = document.body.clientHeight
  const fora = e => e.getBoundingClientRect().bottom > h - 6
  const cartas = [...document.querySelectorAll('.j')].filter(fora).length
  const pe = fora(document.querySelector('footer')) ? 1 : 0
  return { cartas, pe }
})
await b.close()
console.log(`${SAIDA} · ${Math.round(fs.statSync(SAIDA).size / 1024)} KB · ${total} jogadores`)
if (vazou.cartas) console.log(`⚠️  ${vazou.cartas} carta(s) passaram do rodapé — diminua a fonte ou parta em dois stories.`)
else if (vazou.pe) console.log('⚠️  as cartas couberam, mas o RODAPÉ ficou cortado — diminua um pouco mais.')
if (!vazou.cartas && !vazou.pe) console.log('✅ tudo dentro da tela do story · sem nível e sem categoria, como ele pediu.')
