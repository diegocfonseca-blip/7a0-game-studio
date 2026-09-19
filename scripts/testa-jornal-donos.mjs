#!/usr/bin/env node
// 📰 TRAVA: A TELA E A IMAGEM DO JORNAL TÊM QUE LISTAR OS MESMOS TÍTULOS.
//
// Diego (18/09), com a foto do fim de temporada compartilhado na mão:
// *"o jornal normal da temporada, e também quando se compartilha, não apareceu
// Supercopa… também não apareceu Copa do Mundo, acho"*.
//
// O QUE ERA: O MARTELO é desenhado DUAS VEZES, por dois caminhos diferentes —
//   • na TELA, em HTML/React;
//   • na IMAGEM que a pessoa compartilha, em CANVAS (`buildJornalBlob`).
// A Supercopa tinha sido ligada só na TELA. Quem compartilhava o fim de temporada
// perdia justamente o ÚLTIMO título do ano. (A Copa do Mundo estava nos dois — ela
// só não aparece em temporada que não tem Mundial, que é o certo.)
//
// ⚠️ Esta trava é de FONTE, e ela sabe disso: ela não desenha o jornal, ela confere
// que as duas listas citam as MESMAS competições. É de propósito — o defeito aqui
// nunca foi de pixel, foi de ESQUECER um caminho. Quando entrar competição nova,
// é esta trava que vai lembrar do segundo lugar.
//
// uso: node scripts/testa-jornal-donos.mjs
import { readFileSync } from 'node:fs'

const src = readFileSync('src/escalacao/jornal.tsx', 'utf8')
let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

// o trecho do CANVAS: da montagem da lista até o desenho das notas
const iCanvas = src.indexOf('const donos:')
const fimCanvas = src.indexOf('const cGap', iCanvas)
const canvas = iCanvas > 0 && fimCanvas > iCanvas ? src.slice(iCanvas, fimCanvas) : ''
// o trecho da TELA: do cabeçalho "Os donos da temporada" em diante
const iTela = src.indexOf('Os donos da temporada</div>')
const tela = iTela > 0 ? src.slice(iTela, iTela + 6000) : ''

console.log('\n1) 📄 os dois caminhos do jornal existem')
{
  ok(canvas.length > 0, 'achei a lista dos donos do CANVAS (a imagem compartilhada)')
  ok(tela.length > 0, 'achei a lista dos donos da TELA (o jornal em HTML)')
}

console.log('\n2) 🏆 toda competição está nos DOIS')
{
  const COMPETICOES = [
    ['as divisões', 'J_DIVS', 'J_DIVS'],
    ['a Copa (Brasil/Legends)', 'copa?.champion', 'copa?.champion'],
    ['a 👑 SUPERCOPA', 'superChamp', 'superChamp'],
    ['a 🌍 Copa do Mundo', 'mundial', 'mundial'],
  ]
  for (const [nome, noCanvas, naTela] of COMPETICOES) {
    ok(canvas.includes(noCanvas), `${nome}: está na IMAGEM compartilhada`)
    ok(tela.includes(naTela), `${nome}: está na TELA`)
  }
}

console.log('\n3) 🧾 a linha de baixo não mente')
{
  // Supercopa e Mundial não têm artilheiro — sair "Artilheiro: <seleção>" na imagem
  // seria informação errada, e foi o que acontecia com o Mundial.
  ok(canvas.includes('sub:'), 'a imagem tem linha CRUA (`sub`) pra quem não tem artilheiro')
  const linhaDoPush = (quem) => canvas.split('\n').find(l => l.includes(`if (${quem}) donos.push(`)) ?? ''
  ok(linhaDoPush('superChamp').includes('sub:'), 'a Supercopa usa a linha crua (o adversário), não "Artilheiro:"')
  ok(linhaDoPush('mundial').includes('sub:'), 'o Mundial usa a linha crua (a seleção), não "Artilheiro:"')
}

console.log('\n4) 📏 a imagem tem altura pra lista inteira')
{
  const m = src.match(/const W = 1080, MAXH = (\d+)/)
  const maxh = m ? Number(m[1]) : 0
  // 5 divisões + Copa + Supercopa + Mundial = 8 notas = 4 filas de 106px.
  // O corte é silencioso (`min(MAXH, conteúdo)`), então a margem tem que sobrar.
  ok(maxh >= 2520, `MAXH = ${maxh} — cabe a fila extra que a Supercopa pode empurrar`)
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
