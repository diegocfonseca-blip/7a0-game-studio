#!/usr/bin/env node
// ─── 📐 GUARDA DAS TELAS — tela nova nasce pronta pro PC e pro celular ───────
//
// Pedido do Diego (30/08): *"agora tem q fazer de uma forma q tudo q eu criar
// vai tb sendo feito se n é foda. Se n crio algo novo e não é feito"*.
//
// O QUE ACONTECEU (e não pode repetir): em 05/08 o modo desktop foi feito
// tela por tela, com uma classe que a tela precisava PEDIR (`palco`). Deu
// certo na home, no leilão e na Carreira. Só que tudo que nasceu depois —
// o ONLINE inteiro, a Dinastia, o Estádio, a conta, a Copa do Mundo — não
// pediu, então ficou de fora. Em 30/08 o online usava 384px de um monitor de
// 1440 (medido). Ninguém tinha feito nada errado: só esqueceram, porque
// esquecer era possível.
//
// A CORREÇÃO DE VERDADE foi tirar o "pedir": as regras de PC agora moram na
// RAIZ (`#root`, em `src/index.css`), então toda tela é coberta sem pedir
// nada. Este guarda existe pros DOIS casos que a raiz não consegue cobrir
// sozinha, porque estão escritos dentro do .tsx:
//
//   1. ALTURA DE TELA CHEIA — quem escreve `100vh` na mão está medindo o
//      pedaço ESCONDIDO atrás da barra do navegador do celular: a tela fica
//      mais alta que o visível, o pé some e dá aquele pulinho quando a barra
//      aparece. O certo é a classe `tela-cheia` (que já traz `100vh` de
//      reserva + `100dvh` de verdade).
//
//   2. COLUNA TRAVADA NO ESTREITO — `max-w-sm` (384px) como coluna de uma
//      tela trava a largura no PC, porque a regra de PC abre `max-w-xl`,
//      `max-w-md` e `col-tela`, não o `sm`. Coluna de tela usa `col-tela`.
//      (Dentro de MODAL o `max-w-sm` está certo e é ignorado aqui: caixinha
//      de diálogo não deve ter 900px. Parágrafo centralizado também.)
//
// Roda com `npm run telas`. Se apontar alguma coisa, o conserto é de uma
// palavra — e é melhor gastar essa palavra agora do que descobrir daqui a
// três semanas que uma tela nasceu torta no monitor.

import fs from 'node:fs'
import path from 'node:path'

const DIR = 'src/escalacao'
const arquivos = fs.readdirSync(DIR).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))

// linhas que podem usar max-w-sm sem problema nenhum
const SM_OK = [
  /max-h-\[/,            // caixa de modal (tem teto de altura)
  /mx-auto"?\s*>/,       // parágrafo centralizado dentro de uma tela
  /<p /, /<span /,       // texto, não coluna
  /max-w-sm mx-auto">/,  // idem
]

const achados = []

for (const f of arquivos) {
  const full = path.join(DIR, f)
  const linhas = fs.readFileSync(full, 'utf8').split('\n')
  linhas.forEach((l, i) => {
    const n = i + 1
    // 1) altura de tela cheia escrita na mão
    if (/100vh/.test(l) && !/tela-cheia/.test(l) && !/^\s*(\/\/|\*)/.test(l)) {
      achados.push({
        arq: `${f}:${n}`, tipo: 'altura',
        prob: 'usa 100vh na mão — no celular isso conta o pedaço escondido atrás da barra do navegador',
        fix: 'trocar por className="tela-cheia" (ela já traz 100vh de reserva + 100dvh de verdade)',
        linha: l.trim().slice(0, 110),
      })
    }
    // 2) coluna de tela travada no estreito
    if (/max-w-sm/.test(l) && !SM_OK.some(rx => rx.test(l)) && /<div/.test(l)) {
      achados.push({
        arq: `${f}:${n}`, tipo: 'largura',
        prob: 'coluna de tela em max-w-sm — trava em 384px no monitor (a regra de PC abre xl/md/col-tela)',
        fix: 'trocar por className="col-tela" (384px no celular, 900px no PC)',
        linha: l.trim().slice(0, 110),
      })
    }
  })
}

// o CSS da raiz precisa continuar existindo, senão TODO o resto vira letra morta
const css = fs.readFileSync('src/index.css', 'utf8')
const faltando = [
  ['.tela-cheia', /\.tela-cheia\s*\{[^}]*100dvh/],
  ['.col-tela', /\.col-tela\s*\{/],
  ['regra de PC na raiz (#root)', /#root \.max-w-xl/],
  ['modo PC começando em 768px', /@media \(min-width: 768px\)/],
].filter(([, rx]) => !rx.test(css)).map(([n]) => n)

if (faltando.length) {
  console.error('\n❌ src/index.css perdeu a base das telas:')
  faltando.forEach(n => console.error(`   • ${n}`))
  console.error('\n   Sem isso, TODA tela do jogo volta a ser tirinha no monitor.')
  process.exit(1)
}

if (!achados.length) {
  console.log('✅ telas ok — nenhuma tela travada no estreito, nenhuma altura medida errado.')
  console.log('   (a regra de PC mora em #root, então tela nova já nasce coberta)')
  process.exit(0)
}

console.error(`\n❌ ${achados.length} tela(s) que não vão se adaptar sozinhas:\n`)
for (const a of achados) {
  console.error(`  ${a.arq}  [${a.tipo}]`)
  console.error(`    ${a.linha}`)
  console.error(`    problema: ${a.prob}`)
  console.error(`    conserto: ${a.fix}\n`)
}
console.error('Por que isto existe: em 05/08 o modo desktop foi feito tela por tela e')
console.error('tudo que nasceu depois ficou de fora — o online inteiro usava 384px de')
console.error('um monitor de 1440. Este guarda é pra não acontecer de novo.\n')
process.exit(1)
