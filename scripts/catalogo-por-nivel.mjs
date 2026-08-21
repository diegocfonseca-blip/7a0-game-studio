// ─── 🎴 LISTA DO BARALHO POR NÍVEL (pedido do Diego 21/08) ──────────────────
//
// *"Me fale todas lendas do nosso jogo com base em níveis por ordem... botando
// nome, clube e ano da carta. Não importa se tiver jogador que dá em dois
// baralhos"*.
//
// Lê o baralho DE VERDADE (`data.ts`, os dois catálogos) e escreve
// `docs/catalogo-por-nivel.md` com todo mundo separado por nível, do 5 (Lenda)
// pro 1, e dentro de cada nível por posição e ordem alfabética.
//
// Repetido NÃO é erro: quem está nos dois baralhos aparece duas vezes, com a
// etiqueta BR/EU, porque são duas cartas diferentes no jogo.
//
//   node scripts/catalogo-por-nivel.mjs
//
// O vocabulário de nível é o MESMO do jogo (o de `novidades-jogadores.mjs`):
// 5 lenda · 4 craque · 3 e 2 bom jogador · 1 foi profissional. Promessa é
// marca à parte (💎), não é nível.
import { createServer } from 'vite'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const SAIDA = join(raiz, 'docs', 'catalogo-por-nivel.md')

const NIVEL = {
  5: { nome: 'LENDA', ic: '👑', txt: 'O topo do baralho.' },
  4: { nome: 'CRAQUE', ic: '⭐', txt: 'Time grande se monta com estes.' },
  3: { nome: 'BOM JOGADOR', ic: '🔹', txt: 'O miolo do elenco.' },
  2: { nome: 'BOM JOGADOR', ic: '🔸', txt: 'Rodagem e reserva de confiança.' },
  1: { nome: 'FOI PROFISSIONAL', ic: '▫️', txt: 'Elenco de baixo, jogo de várzea.' },
}
const POS = { GOL: '🧤 Goleiros', LAT: '🏃 Laterais', ZAG: '🛡️ Zagueiros', MEI: '🎩 Meio-campo', ATA: '⚽ Ataque' }
const ORDEM_POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const data = await server.ssrLoadModule('/src/escalacao/data.ts')
await server.close()

const cartas = []
for (const [cat, baralho] of [[data.CATALOG, 'BR'], [data.CATALOG_EU, 'EU']]) {
  for (const pos of Object.keys(cat)) {
    for (const c of cat[pos]) cartas.push({ ...c, pos, baralho })
  }
}

const marca = c => `${c.promessa ? ' 💎' : ''}${c.folk ? ' 🃏' : ''}`
// 💪 força da carta = a MESMA conta que o jogo usa pra ordenar (copa-mundo.tsx):
// nível, depois o teto (hi), depois o piso (lo). Nada inventado aqui.
const forca = (a, b) => b.fame - a.fame || b.hi - a.hi || b.lo - a.lo
const media = c => ((c.lo + c.hi) / 2).toFixed(1)

const out = []
out.push('# 🎴 Baralho do Leilão Legends — todo mundo, por nível')
out.push('')
out.push('Arquivo **GERADO** por `node scripts/catalogo-por-nivel.mjs`. Não editar na mão:')
out.push('mexeu no baralho, roda de novo.')
out.push('')
out.push(`Total de cartas: **${cartas.length}** (${cartas.filter(c => c.baralho === 'BR').length} no baralho BR · ${cartas.filter(c => c.baralho === 'EU').length} no EU).`)
out.push('')
out.push('Quem está nos **dois baralhos aparece duas vezes** — são duas cartas diferentes')
out.push('dentro do jogo, com clube e ano próprios. A coluna da direita diz de qual baralho é.')
out.push('💎 = promessa · 🃏 = folclórico.')
out.push('')
out.push('**Ordem: do melhor pro pior**, com a MESMA conta que o jogo usa pra ordenar')
out.push('elenco (`copa-mundo.tsx`): primeiro o nível, depois o teto da carta, depois o')
out.push('piso. A coluna **Força** mostra `piso–teto (média)` — é a faixa em que a carta')
out.push('rende dentro do jogo.')
out.push('')
out.push('## Resumo')
out.push('')
out.push('| Nível | Quantas cartas |')
out.push('| --- | ---: |')
for (const f of [5, 4, 3, 2, 1]) {
  out.push(`| ${NIVEL[f].ic} ${f} · ${NIVEL[f].nome} | ${cartas.filter(c => c.fame === f).length} |`)
}
out.push('')

for (const f of [5, 4, 3, 2, 1]) {
  const doNivel = cartas.filter(c => c.fame === f)
  out.push('---')
  out.push('')
  out.push(`# ${NIVEL[f].ic} NÍVEL ${f} — ${NIVEL[f].nome} (${doNivel.length} cartas)`)
  out.push('')
  out.push(`_${NIVEL[f].txt}_`)
  out.push('')
  // 🥇 GERAL do nível, do melhor pro pior — é o que o Diego pediu.
  out.push(`## 🥇 Do melhor pro pior — os ${doNivel.length}`)
  out.push('')
  out.push('| # | Jogador | Clube da carta | Ano | Pos | Força | Baralho |')
  out.push('| ---: | --- | --- | ---: | :---: | :---: | :---: |')
  ;[...doNivel].sort(forca).forEach((c, i) => {
    out.push(`| ${i + 1} | ${c.name}${marca(c)} | ${c.club} | ${c.year} | ${c.pos} | ${c.lo}–${c.hi} (${media(c)}) | ${c.baralho} |`)
  })
  out.push('')

  // e o mesmo nível quebrado por posição, também do melhor pro pior
  for (const pos of ORDEM_POS) {
    const doPos = doNivel.filter(c => c.pos === pos).sort(forca)
    if (!doPos.length) continue
    out.push(`### ${POS[pos]} — ${doPos.length}`)
    out.push('')
    out.push('| # | Jogador | Clube da carta | Ano | Força | Baralho |')
    out.push('| ---: | --- | --- | ---: | :---: | :---: |')
    doPos.forEach((c, i) => {
      out.push(`| ${i + 1} | ${c.name}${marca(c)} | ${c.club} | ${c.year} | ${c.lo}–${c.hi} (${media(c)}) | ${c.baralho} |`)
    })
    out.push('')
  }
}

writeFileSync(SAIDA, out.join('\n') + '\n')
console.log(`${SAIDA} · ${cartas.length} cartas`)
