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
// Acusa três coisas:
//   1. carta SEM seleção ('??') — vai ficar fora de toda Copa, calada;
//   2. NOME repetido no baralho SEM entrada por carta — é exatamente o buraco
//      do Pedro: dois jogadores diferentes herdando o mesmo país.
//   3. 🆕 (28/08, caso LINGARD) carta do baralho BR SEM etiqueta cuja BIO diz
//      que o jogador é ESTRANGEIRO ("inglês", "argentino", "naturalizado"…).
//      Aqui o buraco é silencioso: quem não tem etiqueta no baralho BR vira
//      BRASILEIRO por padrão em `paisDe()`, então o Lingard foi convocado pela
//      seleção brasileira na Copa. Palavras do Diego: *"todo jogador no baralho
//      tem que ter sua nacionalidade, que é diferente do baralho"*.
//      Só olha GENTÍLICO ("é inglês"), não nome de país — "rodou por Portugal"
//      é brasileiro que jogou fora, e isso é a maioria. Pra CALAR um aviso
//      falso, basta fixar a carta em PAIS_POR_CARTA (inclusive como 'Brasil').
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

// 3. baralho BR sem etiqueta + bio com GENTÍLICO estrangeiro → vira brasileiro calado
// ⚠️ o gentílico SOZINHO mente muito: "rodou por Portugal e Alemanha" é
// brasileiro que jogou fora, "a raça inglesa" é elogio, "Portuguesa" é clube e
// "driblou quatro italianos" são os adversários. O que acusa DE VERDADE é o
// gentílico colado na POSIÇÃO do cara ("Meia chinês", "Ponta inglês") — foi
// assim que o Zizão apareceu. Por isso a janela curta de 20 caracteres.
const GENT = [
  'argentin[oa]s?', 'uruguai[oa]s?', 'paraguai[oa]s?', 'chilen[oa]s?', 'colombian[oa]s?',
  'equatorian[oa]s?', 'peruan[oa]s?', 'bolivian[oa]s?', 'venezuelan[oa]s?', 'mexican[oa]s?',
  'portugu(?:ês|esa|eses|esas)', 'espanh(?:ol|ola|óis|olas)', 'italian[oa]s?',
  'franc(?:ês|esa|eses|esas)', 'ingl(?:ês|esa|eses|esas)', 'brit[âa]nic[oa]s?',
  'alem(?:ão|ã|ães|ãs)', 'holand(?:ês|esa|eses|esas)', 'neerland(?:ês|esa)', 'belgas?',
  's[ée]rvi[oa]s?', 'croatas?', 'japon(?:ês|esa|eses|esas)', 'corean[oa]s?', 'angolan[oa]s?',
  'nigerian[oa]s?', 'ganes(?:es|a)?', 'camaron(?:ês|esa)', 'senegal(?:ês|esa)', 'marroquin[oa]s?',
  'cabo-verdian[oa]s?', 'norte-american[oa]s?', 'estadunidenses?', 'canadenses?',
  'australian[oa]s?', 'uzbeque?s?', 'georgian[oa]s?', 'russ[oa]s?', 'ucranian[oa]s?',
  'polon(?:ês|esa)', 'suec[oa]s?', 'noruegu(?:ês|esa)', 'dinamarqu(?:ês|esa)', 'su[íi][çc][oa]s?',
  'austr[íi]ac[oa]s?', 'greg[oa]s?', 'turc[oa]s?', 'romen[oa]s?', 'b[úu]lgar[oa]s?',
  'h[úu]ngar[oa]s?', 'escoc(?:ês|esa)', 'irland(?:ês|esa)', 'gal(?:ês|esa)', 'guineense?s?',
  'marfinense?s?', 'congol(?:ês|esa)', 'mo[çc]ambican[oa]s?', 'israelense?s?', 'iranian[oa]s?',
  'chin(?:ês|esa|eses|esas)', 'eg[íi]pci[oa]s?', 'tunisian[oa]s?', 'argelin[oa]s?',
  'sul-african[oa]s?', 'jamaican[oa]s?', 'cuban[oa]s?', 'haitian[oa]s?', 'armêni[oa]s?',
  'alban(?:ês|esa)', 'kosovares?', 'maced[ôo]ni[oa]s?', 'esloven[oa]s?', 'eslovac[oa]s?',
  'tchec[oa]s?', 'finland(?:ês|esa)', 'island(?:ês|esa)', 'lituan[oa]s?', 'eston[oa]s?',
  'montenegrin[oa]s?', 'b[óo]sni[oa]s?',
].join('|')
const POS = 'goleir[oa]|zagueir[oa]|lateral|volante|meia|meio-campista|atacante|ponta|centroavante|craque|jogador|astro'
const RX_GENT = new RegExp(`(?:\\b(?:${POS})\\b[^.]{0,20}?\\b(?:${GENT})\\b)|\\bnaturalizad`, 'i')
const gringoSolto = todas.filter(c => (
  c.baralho === 'BR' &&
  !pa.PAIS_POR_CARTA[`${c.name}|${c.club}|${c.year}`] &&
  !pa.PAIS[c.name] &&
  RX_GENT.test(`${c.bio ?? ''} ${d.BIOS?.[c.name] ?? ''}`)
))

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

if (gringoSolto.length) {
  console.log(`🌎 ${gringoSolto.length} carta(s) do baralho BR SEM etiqueta com cara de ESTRANGEIRO na bio:`)
  for (const c of gringoSolto) {
    const m = `${c.bio ?? ''} ${d.BIOS?.[c.name] ?? ''}`.match(RX_GENT)
    console.log(`   ${c.name} · ${c.club} · ${c.year} → hoje vira BRASIL (bio diz "${m?.[0]}")`)
  }
  console.log('   → é estrangeiro? etiquetar em PAIS_POR_CARTA. É brasileiro que só jogou fora?')
  console.log('     fixar como \'Brasil\' em PAIS_POR_CARTA que o aviso cala pra sempre.\n')
}

if (!semPais.length && !semCarta.length && !gringoSolto.length) console.log('✅ nenhuma carta sem seleção, nenhum nome repetido herdando país errado, nenhum estrangeiro solto no baralho BR.')

await server.close()
process.exit(semPais.length || semCarta.length || gringoSolto.length ? 1 : 0)
