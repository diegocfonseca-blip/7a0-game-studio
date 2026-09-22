// ─── 🏆 CAMPEÕES DO MUNDO QUE AINDA NÃO ESTÃO NO BARALHO ────────────────────
//
// Pergunta do Diego (22/09): *"me fale campeões do mundo desde o ano de 1994 que
// ainda não estão no jogo em baralho nenhum. Me fale só campeões"*.
//
// "Campeão" aqui é quem estava na DELEGAÇÃO campeã (a lista de inscritos), não só
// quem entrou em campo na final — é assim que o futebol conta campeão do mundo.
//
// ⚠️ HONESTIDADE DA LISTA: as sete delegações abaixo foram escritas à mão, da
// memória, e podem ter furo (um reserva esquecido). Ela serve pra ACHAR os
// faltantes, não pra ser a fonte oficial de quem foi campeão. Se o Diego pedir um
// nome que não está aqui, é a lista que está incompleta — não o jogador que não foi
// campeão. Quem mexer: manter em ordem de posição, dá pra revisar mais fácil.
//
// 🔎 A comparação usa a MESMA régua do `npm run acha`: palavra inteira, sem acento
// e sem caixa, com achado FORTE (a carta tem nome de 1-2 palavras, ou seja apelido,
// e apelido igual quase sempre é a mesma pessoa) separado do FRACO (bateu só o
// primeiro nome). Foi a falta dessa régua que me fez errar duas listas em 22/09.
//
// uso:  npm run campeoes            (só os que faltam)
//       npm run campeoes -- --tudo  (mostra também os que já estão)
import { spawnSync } from 'node:child_process'

const TUDO = process.argv.includes('--tudo')

const DELEGACOES = [
  { ano: 1994, sel: '🇧🇷 Brasil', elenco: [
    'Taffarel', 'Zetti', 'Gilmar',
    'Jorginho', 'Cafu', 'Branco', 'Leonardo', 'Aldair', 'Márcio Santos', 'Ricardo Rocha', 'Ronaldão',
    'Mauro Silva', 'Dunga', 'Mazinho', 'Zinho', 'Raí', 'Paulo Sérgio', 'Müller',
    'Romário', 'Bebeto', 'Ronaldo', 'Viola',
  ] },
  { ano: 1998, sel: '🇫🇷 França', elenco: [
    'Fabien Barthez', 'Bernard Lama', 'Lionel Charbonnier',
    'Lilian Thuram', 'Laurent Blanc', 'Marcel Desailly', 'Bixente Lizarazu', 'Vincent Candela', 'Frank Leboeuf', 'Alain Boghossian',
    'Didier Deschamps', 'Youri Djorkaeff', 'Zinedine Zidane', 'Emmanuel Petit', 'Christian Karembeu', 'Robert Pires', 'Patrick Vieira', 'Bernard Diomède',
    'Thierry Henry', 'David Trezeguet', 'Stéphane Guivarc’h', 'Christophe Dugarry',
  ] },
  { ano: 2002, sel: '🇧🇷 Brasil', elenco: [
    'Marcos', 'Dida', 'Rogério Ceni',
    'Cafu', 'Roberto Carlos', 'Lúcio', 'Roque Júnior', 'Edmílson', 'Anderson Polga', 'Júnior', 'Belletti',
    'Gilberto Silva', 'Kléberson', 'Vampeta', 'Juninho Paulista', 'Ricardinho', 'Rivaldo', 'Denílson', 'Ronaldinho Gaúcho', 'Kaká',
    'Ronaldo', 'Luizão', 'Edílson',
  ] },
  { ano: 2006, sel: '🇮🇹 Itália', elenco: [
    'Gianluigi Buffon', 'Angelo Peruzzi', 'Marco Amelia',
    'Fabio Cannavaro', 'Alessandro Nesta', 'Marco Materazzi', 'Andrea Barzagli', 'Cristian Zaccardo', 'Gianluca Zambrotta', 'Fabio Grosso', 'Massimo Oddo',
    'Gennaro Gattuso', 'Andrea Pirlo', 'Daniele De Rossi', 'Simone Perrotta', 'Mauro Camoranesi', 'Simone Barone',
    'Francesco Totti', 'Alessandro Del Piero', 'Luca Toni', 'Alberto Gilardino', 'Vincenzo Iaquinta', 'Filippo Inzaghi',
  ] },
  { ano: 2010, sel: '🇪🇸 Espanha', elenco: [
    'Iker Casillas', 'Víctor Valdés', 'Pepe Reina',
    'Carles Puyol', 'Gerard Piqué', 'Sergio Ramos', 'Joan Capdevila', 'Raúl Albiol', 'Álvaro Arbeloa', 'Carlos Marchena',
    'Xavi', 'Andrés Iniesta', 'Sergio Busquets', 'Xabi Alonso', 'Javi Martínez', 'Cesc Fàbregas', 'David Silva', 'Pedro', 'Jesús Navas',
    'David Villa', 'Fernando Torres', 'Fernando Llorente', 'Juan Mata',
  ] },
  { ano: 2014, sel: '🇩🇪 Alemanha', elenco: [
    'Manuel Neuer', 'Roman Weidenfeller', 'Ron-Robert Zieler',
    'Philipp Lahm', 'Jérôme Boateng', 'Mats Hummels', 'Per Mertesacker', 'Benedikt Höwedes', 'Shkodran Mustafi', 'Erik Durm', 'Matthias Ginter',
    'Bastian Schweinsteiger', 'Sami Khedira', 'Christoph Kramer', 'Mesut Özil', 'Toni Kroos', 'André Schürrle', 'Lukas Podolski', 'Mario Götze', 'Julian Draxler', 'Kevin Großkreutz',
    'Thomas Müller', 'Miroslav Klose',
  ] },
  { ano: 2018, sel: '🇫🇷 França', elenco: [
    'Hugo Lloris', 'Alphonse Areola', 'Steve Mandanda',
    'Raphaël Varane', 'Samuel Umtiti', 'Benjamin Pavard', 'Lucas Hernández', 'Presnel Kimpembe', 'Djibril Sidibé', 'Benjamin Mendy', 'Adil Rami',
    'Paul Pogba', 'N’Golo Kanté', 'Blaise Matuidi', 'Corentin Tolisso', 'Steven N’Zonzi', 'Thomas Lemar',
    'Antoine Griezmann', 'Kylian Mbappé', 'Olivier Giroud', 'Ousmane Dembélé', 'Nabil Fekir', 'Florian Thauvin',
  ] },
  { ano: 2022, sel: '🇦🇷 Argentina', elenco: [
    'Emiliano Martínez', 'Franco Armani', 'Gerónimo Rulli',
    'Nicolás Otamendi', 'Cristian Romero', 'Lisandro Martínez', 'Germán Pezzella', 'Nahuel Molina', 'Gonzalo Montiel', 'Nicolás Tagliafico', 'Marcos Acuña', 'Juan Foyth', 'Nehuén Pérez',
    'Rodrigo De Paul', 'Alexis Mac Allister', 'Enzo Fernández', 'Leandro Paredes', 'Guido Rodríguez', 'Exequiel Palacios', 'Papu Gómez', 'Thiago Almada', 'Alejandro Gómez',
    'Lionel Messi', 'Ángel Di María', 'Julián Álvarez', 'Lautaro Martínez', 'Ángel Correa', 'Paulo Dybala',
  ] },
]

// ── lê o catálogo (é TypeScript, então passa pelo tsx, igual ao acha-carta) ──
const prog = `
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '${process.cwd()}/src/escalacao/data.ts'
const S = ['GOL','LAT','ZAG','MEI','ATA']
const out = []
for (const [b, cat] of [['BR', CATALOG], ['EU', CATALOG_EU], ['MUNDO', CATALOG_WORLD]])
  for (const p of S) for (const c of cat[p])
    out.push({ b, p, name: c.name, club: c.club, year: c.year, fame: c.fame, promessa: !!c.promessa })
console.log(JSON.stringify(out))
`
const r = spawnSync('npx', ['tsx', '-e', prog], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
if (r.status !== 0) { console.error(r.stderr || 'não consegui ler o catálogo'); process.exit(1) }
const cartas = JSON.parse(r.stdout.trim().split('\n').pop())

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const VAZIAS = new Set(['de', 'da', 'do', 'dos', 'la', 'del', 'van', 'von', 'jr', 'junior', 'filho'])
const TIER = c => c.promessa ? '💎' : c.fame >= 5 ? '👑' : c.fame === 4 ? '⭐' : c.fame >= 2 ? '🎯' : '🪵'

const palavrasDe = new Map(cartas.map(c => [c, norm(c.name).split(' ')]))
const acha = nome => {
  // ⚠️ "Júnior" é nome de gente no futebol brasileiro, não só sufixo. Se o filtro
  //    de palavras vazias comer TUDO, a busca volta a usar o nome inteiro — senão
  //    o lateral Júnior (campeão em 2002) apareceria como faltando sem ser.
  let toks = norm(nome).split(' ').filter(t => t.length > 2 && !VAZIAS.has(t))
  if (!toks.length) toks = norm(nome).split(' ').filter(Boolean)
  const fortes = [], fracos = []
  for (const c of cartas) {
    const pal = palavrasDe.get(c)
    if (!toks.some(t => pal.includes(t))) continue
    ;(pal.length <= 2 ? fortes : fracos).push(c)
  }
  return { fortes, fracos }
}

console.log('\n🏆 CAMPEÕES DO MUNDO (1994 → 2022) QUE NÃO ESTÃO EM BARALHO NENHUM\n')
let faltamTotal = 0, temTotal = 0
for (const d of DELEGACOES) {
  const faltam = [], tem = []
  for (const nome of d.elenco) {
    const { fortes } = acha(nome)
    if (fortes.length) tem.push({ nome, onde: fortes[0] })
    else faltam.push(nome)
  }
  faltamTotal += faltam.length; temTotal += tem.length
  console.log(`── ${d.ano} · ${d.sel} — ${tem.length}/${d.elenco.length} no jogo, faltam ${faltam.length} ──`)
  console.log(faltam.length ? '   ❌ ' + faltam.join(' · ') : '   ✅ delegação inteira no jogo')
  if (TUDO) for (const t of tem) console.log(`   ✅ ${t.nome.padEnd(22)} → [${t.onde.b}] ${TIER(t.onde)} ${t.onde.name} (${t.onde.club} ${t.onde.year})`)
  console.log('')
}
console.log(`📊 ${temTotal} campeões já no jogo · ${faltamTotal} faltando\n`)
console.log('   ⚠️  A lista das delegações é escrita à mão neste arquivo e pode ter furo.')
console.log('       Nome que o Diego citar e não aparecer aqui = lista incompleta, não')
console.log('       "não foi campeão". E confira cada faltante antes de criar a carta:')
console.log('       apelido igual pode ser outra pessoa (foi o erro de 22/09).\n')
