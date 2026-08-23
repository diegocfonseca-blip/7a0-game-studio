// 🚩 CONFERE A NACIONALIDADE DE TODA CARTA — `npm run paises`
//
// Nasceu em 21/08, quando o Diego viu o **Pedro convocado pela ESPANHA**.
// Palavras dele: *"já disse que cada carta tem que ter sua nacionalidade pra
// não ter erro depois na Copa"*.
//
// A causa era o país sair do NOME: o "Pedro" do baralho europeu não é o
// espanhol, é o **Pedro do Flamengo** na passagem pela Fiorentina. Agora existe
// `PAIS_POR_CARTA` (nome|clube|ano) em `paises.ts`, e este script é a trava:
// ele acusa antes de virar bug na Copa.
//
// Acusa duas coisas:
//   1. carta SEM seleção ('??') — vai ficar fora de toda Copa, calada;
//   2. NOME repetido no baralho SEM entrada por carta — é exatamente o buraco
//      do Pedro: dois jogadores diferentes herdando o mesmo país.
//
// Sai com código 1 se achar algo, pra dar pra ligar em CI um dia.
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const d = await server.ssrLoadModule('/src/escalacao/data.ts')
const pa = await server.ssrLoadModule('/src/escalacao/paises.ts')

const SEC = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const decks = [[d.CATALOG, 'BR'], [d.CATALOG_EU, 'EU'], [d.CATALOG_WORLD, 'WORLD']]
const todas = []
for (const [cat, b] of decks) for (const p of SEC) for (const c of (cat[p] ?? [])) todas.push({ ...c, pos: p, baralho: b })

const pais = c => pa.paisDe(c.name, c.baralho, c.club, c.year)
const semPais = todas.filter(c => pais(c) === '??')

// nome repetido cujas cartas NÃO estão todas em PAIS_POR_CARTA
const repetidos = pa.nomesRepetidos(decks.map(([cat, b]) => [cat, b]))
const semCarta = []
for (const [nome, arr] of repetidos) {
  const faltando = arr.filter(c => !pa.PAIS_POR_CARTA[`${c.name}|${c.club}|${c.year}`])
  if (faltando.length === arr.length) {
    // todas caem no nome. Só é problema se os jogadores forem pessoas
    // diferentes — o script não adivinha isso, então só avisa quando os
    // baralhos divergem (o caso clássico: mesmo nome, BR e EU).
    if (pa.MESMO_JOGADOR.has(nome)) continue // já conferido: é a mesma pessoa
    const baralhos = new Set(arr.map(c => c.baralho))
    if (baralhos.size > 1) semCarta.push([nome, arr, 'ninguém conferiu ainda'])
  } else if (faltando.length > 0) {
    semCarta.push([nome, faltando, 'algumas de fora'])
  }
}

console.log(`🚩 ${todas.length} cartas conferidas · ${Object.keys(pa.PAIS_POR_CARTA).length} com país por carta\n`)

if (semPais.length) {
  console.log(`❌ ${semPais.length} carta(s) SEM seleção (vão ficar fora de toda Copa):`)
  for (const c of semPais) console.log(`   [${c.baralho}] ${c.name} · ${c.club} · ${c.year}`)
  console.log('   → etiquetar em PAIS (paises.ts) ou em PAIS_POR_CARTA\n')
}

if (semCarta.length) {
  console.log(`⚠️  ${semCarta.length} nome(s) repetido(s) herdando país pelo NOME:`)
  for (const [nome, arr, motivo] of semCarta) {
    console.log(`   ${nome} (${motivo}) → hoje todas viram ${pais(arr[0])}`)
    for (const c of arr) console.log(`      [${c.baralho}] ${c.club} · ${c.year}`)
  }
  console.log('   → se forem PESSOAS DIFERENTES, cada uma precisa de linha em PAIS_POR_CARTA\n')
}

if (!semPais.length && !semCarta.length) console.log('✅ nenhuma carta sem seleção, nenhum nome repetido herdando país errado.')

await server.close()
process.exit(semPais.length || semCarta.length ? 1 : 0)
