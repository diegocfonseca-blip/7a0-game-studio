// ─── 🔎 "ESSE JOGADOR JÁ ESTÁ NO BARALHO?" ──────────────────────────────────
//
// Esta ferramenta existe por causa de um erro que eu cometi DUAS vezes em 22/09,
// montando lista de carta nova pro Diego:
//   1ª vez — comparei NOME INTEIRO normalizado. Disse que 82 nomes faltavam, e 5
//            já estavam: no baralho eles vivem só pelo APELIDO (Figueroa, Asprilla,
//            Tevez, Guerrero, Rincón), então "Elías Figueroa" nunca casava com
//            "Figueroa".
//   2ª vez — refiz por sobrenome, mas li a saída com `tail`, e o que passou do
//            corte ficou invisível. Assim mandei pro Diego o Chicharito e o Rafael
//            Márquez como "faltando", quando os dois estavam (o segundo escrito
//            "Rafa Márquez"). Lista truncada é lista errada.
//
// 📏 COMO ELA DECIDE (e por que não é só um grep):
//   · compara PALAVRA INTEIRA, sem acento e sem caixa — então "Márquez" acha
//     "Rafa Márquez", e "Elías Figueroa" acha "Figueroa";
//   · separa ACHADO FORTE (a carta tem nome curto, de 1-2 palavras: é apelido, e
//     apelido igual quase sempre É a mesma pessoa) de ACHADO FRACO (bateu só o
//     primeiro nome: "David" Suazo × "David" Luiz — quase sempre gente diferente);
//   · nunca esconde linha: imprime TUDO o que bateu, por candidato.
// ⚠️ A palavra final é de gente: dois xarás de verdade existem (o baralho tem 62
//    nomes repetidos em 125 cartas). A ferramenta aponta; quem confere é quem lê.
//
// uso:  npm run acha -- "Chicharito" "Rafael Márquez" "Obdulio Varela"
//       npm run acha -- --arquivo lista.txt      (um nome por linha)
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const argv = process.argv.slice(2)
let nomes = argv.filter(a => !a.startsWith('--'))
const iArq = argv.indexOf('--arquivo')
if (iArq >= 0 && argv[iArq + 1]) {
  nomes = readFileSync(argv[iArq + 1], 'utf8').split('\n').map(s => s.trim()).filter(Boolean)
}
if (!nomes.length) {
  console.error('uso: npm run acha -- "Nome do Jogador" ["Outro Nome" …]')
  console.error('     npm run acha -- --arquivo lista.txt')
  process.exit(1)
}

// o catálogo é TypeScript, então a leitura passa pelo tsx (mesmo caminho do
// `npm run paises`). O JSON volta pelo stdout.
const prog = `
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '${process.cwd()}/src/escalacao/data.ts'
const S = ['GOL','LAT','ZAG','MEI','ATA']
const out = []
for (const [b, cat] of [['BR', CATALOG], ['EU', CATALOG_EU], ['MUNDO', CATALOG_WORLD]])
  for (const p of S) for (const c of cat[p])
    out.push({ b, p, name: c.name, club: c.club, year: c.year, fame: c.fame, lo: c.lo, hi: c.hi, promessa: !!c.promessa, folk: !!c.folk })
console.log(JSON.stringify(out))
`
const r = spawnSync('npx', ['tsx', '-e', prog], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
if (r.status !== 0) { console.error(r.stderr || 'não consegui ler o catálogo'); process.exit(1) }
const cartas = JSON.parse(r.stdout.trim().split('\n').pop())

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
// palavras que não identificam ninguém sozinhas
const VAZIAS = new Set(['de', 'da', 'do', 'dos', 'la', 'del', 'al', 'el', 'van', 'von', 'obi', 'junior', 'jr', 'filho', 'neto', 'dos santos'])
const TIER = c => c.promessa ? '💎 promessa' : c.fame >= 5 ? '👑 lenda' : c.fame === 4 ? '⭐ craque' : c.fame >= 2 ? '🎯 bom' : '🪵 foi prof.'

const faltando = []
console.log('\n🔎 ESSE JOGADOR JÁ ESTÁ NO BARALHO?\n')
for (const alvo of nomes) {
  const toks = norm(alvo).split(' ').filter(t => t.length > 2 && !VAZIAS.has(t))
  const fortes = [], fracos = []
  for (const c of cartas) {
    const palavras = norm(c.name).split(' ')
    if (!toks.some(t => palavras.includes(t))) continue
    ;(palavras.length <= 2 ? fortes : fracos).push(c)
  }
  const linha = c => `[${c.b}] ${c.p} ${c.name} (${c.club} ${c.year}) · ${TIER(c)} · ${c.lo}-${c.hi}${c.folk ? ' 🃏' : ''}`
  if (fortes.length) {
    console.log(`⚠️  ${alvo}`)
    for (const c of fortes) console.log(`      PROVÁVEL O MESMO → ${linha(c)}`)
    for (const c of fracos) console.log(`      (só o 1º nome bate) ${linha(c)}`)
  } else if (fracos.length) {
    console.log(`🆕 ${alvo} — não achei; bateu só nome de batismo em ${fracos.length} carta(s):`)
    for (const c of fracos.slice(0, 4)) console.log(`      ${linha(c)}`)
    if (fracos.length > 4) console.log(`      … e mais ${fracos.length - 4}`)
    faltando.push(alvo)
  } else {
    console.log(`🆕 ${alvo} — NÃO EXISTE em baralho nenhum`)
    faltando.push(alvo)
  }
}
console.log(`\n📊 ${cartas.length} cartas no baralho · ${nomes.length} consultados · ${faltando.length} sem nada parecido de forte\n`)
console.log('   ⚠️  "PROVÁVEL O MESMO" é apelido idêntico — confira antes de criar carta nova.')
console.log('       E não leia esta saída com `tail`: lista cortada foi exatamente o erro de 22/09.\n')
