#!/usr/bin/env node
// 🪪 TRAVA DOS TRAÇOS — xará não pode herdar fama alheia.
//
// POR QUE ISTO EXISTE (04/09). O jogador Gustavo Kowalczuk escreveu: contratou o
// **Pepe do Santos de 1962** e o cara pegou gancho por 3 cartões vermelhos. Ele
// mesmo apontou a causa: *"acredito que isso esteja relacionado ao nome do
// jogador, pois o famigerado Pepe, jogador português, é conhecido por sua grande
// quantidade de cartões vermelhos"*. Estava certo — e o erro era grave: o Pepe do
// Santos ganhou o **Prêmio Belfort Duarte em 1966**, dado justamente a quem passa
// anos SEM NUNCA ser expulso. O jogo pintava o sujeito como o oposto do que ele foi.
//
// A causa: os traços (🍾 baladeiro / 🌡️ pavio curto) casavam SÓ PELO NOME, e o
// baralho tem duas cartas "Pepe" que são duas PESSOAS diferentes.
//
// Esta trava varre o baralho e AVISA sempre que um nome com traço tiver mais de
// uma carta — pra alguém olhar e dizer se é a MESMA pessoa (Romário no Vasco e no
// Barça: tudo bem) ou PESSOAS DIFERENTES (Pepe: tem que qualificar com
// `Nome|Clube|Ano`). Reprova só quando o nome pelado está na lista E as cartas
// divergem em algo que sugere gente diferente.
//
// uso: node scripts/checa-tracos.mjs      (sai com código 1 se houver risco novo)
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const D = await vite.ssrLoadModule('/src/escalacao/data.ts')
const E = await vite.ssrLoadModule('/src/escalacao/eventos.ts')

// 👌 xarás já conferidos À MÃO e liberados: é a MESMA pessoa em clubes/anos
// diferentes, então o traço vale pras duas cartas mesmo. Ao acrescentar um nome
// aqui, confira de verdade quem é a pessoa — foi essa conferência que faltou no Pepe.
const CONFERIDOS = new Set(['Romário', 'Neymar', 'Ronaldinho Gaúcho', 'Vampeta', 'Casagrande'])

const cartas = []
for (const cat of [D.CATALOG, D.CATALOG_EU, D.CATALOG_WORLD]) {
  if (!cat) continue
  for (const pos of Object.keys(cat)) for (const c of cat[pos]) cartas.push({ ...c, pos })
}
const porNome = new Map()
for (const c of cartas) { const a = porNome.get(c.name) ?? []; a.push(c); porNome.set(c.name, a) }

console.log(`🪪 ${cartas.length} cartas · ${porNome.size} nomes distintos\n`)

let risco = 0, ok = 0
for (const [nome, lista] of porNome) {
  if (lista.length < 2) continue
  // o traço veio do NOME PELADO? (se veio da chave cheia, o xará já está protegido)
  const peloNome = E.traitDe(nome)
  if (!peloNome) continue
  if (CONFERIDOS.has(nome)) { ok++; console.log(`✅ "${nome}" ${peloNome} — ${lista.length} cartas, conferido: é a mesma pessoa`); continue }
  risco++
  console.log(`❌ "${nome}" tem o traço ${peloNome} PELO NOME e ${lista.length} cartas no baralho:`)
  for (const c of lista) console.log(`      ${c.club} ${c.year} (fama ${c.fame})${c.folk ? ' · folclórico' : ''}`)
  console.log('   👉 se forem PESSOAS DIFERENTES, troque na lista de eventos.ts pela chave cheia')
  console.log(`      '${nome}' → '${nome}|${lista[0].club}|${lista[0].year}'  (só a carta certa)`)
  console.log('   👉 se for a MESMA pessoa, acrescente o nome em CONFERIDOS aqui.')
}

// confere também que o conserto do Pepe está de pé
const pepeSantos = E.traitDe('Pepe', 'Santos', 1962)
const pepePt = E.traitDe('Pepe', 'Real Madrid', 2012)
console.log(`\n🧪 Pepe do Santos 1962 (Prêmio Belfort Duarte, nunca expulso): ${pepeSantos ?? 'sem traço'} ${pepeSantos ? '❌ ERRADO' : '✅'}`)
console.log(`🧪 Pepe do Real Madrid 2012 (o dos vermelhos): ${pepePt ?? 'sem traço'} ${pepePt ? '✅' : '❌ perdeu o traço'}`)
if (pepeSantos || !pepePt) risco++

console.log(risco ? `\n❌ ${risco} risco(s) de xará — resolver antes de commitar` : `\n✅ nenhum xará herdando fama alheia (${ok} já conferido${ok === 1 ? '' : 's'})`)
await vite.close()
process.exit(risco ? 1 : 0)
