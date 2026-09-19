#!/usr/bin/env node
// 🏷️ TRAVA: CARTA QUE TROCOU DE ENDEREÇO NO CATÁLOGO ACOMPANHA NO SAVE.
//
// Diego (18/09), vendo um elenco na live: *"Zidane tá aparecendo Real Madrid… ele é
// Juventus, pow"*. E ele estava certo: em 03/09 ele mesmo mandou trocar a carta —
// saiu o Zidane do Real Madrid 2002, entrou o da Juventus 1998. O catálogo trocou,
// mas a carta é COPIADA pro save e congela, e o `sincronizaNiveis` só regravava a
// FICHA (nível, categoria, bio), nunca o clube e o ano.
//
// Isto é a regra permanente dele de 21/08 levada até o fim: *"sempre que
// atualizarmos qualquer coisa de jogador deve atualizar, seja em carreira antiga,
// atual, ou em times dos bots"*.
//
// ⚠️ O PERIGO desta trava é o contrário: trocar o endereço de quem NÃO devia. O jogo
// tem o mesmo jogador em momentos diferentes (Kaká São Paulo × Kaká Milan, Messi
// Barça × Inter Miami, CR7 Real × Al-Nassr) — mexer neles trocaria a carta de um
// momento pela do outro, que é mudar o NÍVEL do jogador nas costas do dono.
//
// uso: node scripts/testa-carta-endereco.mjs
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const S = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const D = await vite.ssrLoadModule('/src/escalacao/data.ts')
const { reducer } = S

let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

// quantas cartas existem com um dado nome, nos TRÊS baralhos de futebol
const todas = []
for (const cat of [D.CATALOG, D.CATALOG_EU, D.CATALOG_WORLD]) for (const l of Object.values(cat)) todas.push(...l)
const quantas = (nome) => todas.filter(c => c.name === nome).length
const achaUma = (nome) => todas.find(c => c.name === nome)

const save = (squad) => ({
  onlineMode: 'cpu', careerOnline: true, seasonNo: 4, youIdx: 0, screen: 'season', phase: 'idle',
  deckLeague: 'todos', seed: 7, division: 'C', titles: 0,
  managers: [{ id: 0, name: 'Eu', teamName: 'Meia na Canela', isHuman: true, formation: '4-3-3', money: 0, squad, aggression: .5, starHunger: .5 }],
  marketValues: { 'Zinedine Zidane|Real Madrid': 480 },
})
const abre = (squad) => reducer({ ...save([]), screen: 'intro' }, { type: 'RESUME_CAREER_SOLO', saved: save(squad) })
const carta = (name, club, year, extra = {}) => ({ id: `c-${name}`, name, club, year, pos: 'MEI', fame: 3, lo: 70, hi: 80, paid: 10, ...extra })

console.log('\n1) 🏷️ O ZIDANE (o caso que ele pegou)')
{
  const noCatalogo = achaUma('Zinedine Zidane')
  ok(quantas('Zinedine Zidane') === 1, `o catálogo tem UMA carta do Zidane (${noCatalogo?.club} ${noCatalogo?.year})`)
  const s = abre([carta('Zinedine Zidane', 'Real Madrid', 2002)])
  const z = s.managers[0].squad[0]
  ok(z.club === noCatalogo.club && z.year === noCatalogo.year, `o save velho virou ${z.club} · ${z.year}`)
  ok(z.fame === noCatalogo.fame && z.lo === noCatalogo.lo && z.hi === noCatalogo.hi, 'e a ficha dele veio junto (nível e categoria do catálogo)')
  ok(z.id === 'c-Zinedine Zidane', 'o id da carta no elenco NÃO muda — ninguém perde o jogador')
}

console.log('\n2) 💰 o livro de preços acompanha a carta')
{
  const s = abre([carta('Zinedine Zidane', 'Real Madrid', 2002)])
  const clubeNovo = achaUma('Zinedine Zidane').club
  ok(s.marketValues?.[`Zinedine Zidane|${clubeNovo}`] === 480, `o valor de mercado (480) foi pra chave nova (${clubeNovo})`)
  ok(!('Zinedine Zidane|Real Madrid' in (s.marketValues ?? {})), 'e a chave velha não fica sobrando')
}

console.log('\n3) 🛡️ QUEM TEM DUAS CARTAS NUNCA É TOCADO (o perigo de verdade)')
{
  // o jogo tem o mesmo jogador em momentos diferentes — trocar um pelo outro seria
  // mudar o nível do jogador nas costas do dono
  const repetidos = [...new Set(todas.map(c => c.name))].filter(n => quantas(n) > 1)
  ok(repetidos.length > 0, `o catálogo tem ${repetidos.length} nome(s) com mais de uma carta (ex.: ${repetidos.slice(0, 3).join(', ')})`)
  const alvo = todas.find(c => quantas(c.name) > 1)
  const s = abre([carta(alvo.name, 'Clube Que Nao Existe', 1900)])
  const c = s.managers[0].squad[0]
  ok(c.club === 'Clube Que Nao Existe' && c.year === 1900, `"${alvo.name}" tem mais de uma carta, então o endereço NÃO é chutado`)
}

console.log('\n4) 🛡️ carta que ainda EXISTE no catálogo fica como está')
{
  const viva = todas.find(c => quantas(c.name) === 1)
  const s = abre([carta(viva.name, viva.club, viva.year)])
  const c = s.managers[0].squad[0]
  ok(c.club === viva.club && c.year === viva.year, `"${viva.name}" continua em ${viva.club} · ${viva.year}`)
}

console.log('\n5) 🛡️ carta INVENTADA (incógnito / cria da base) nunca é mexida')
{
  const s = abre([
    carta('Zinedine Zidane', 'Real Madrid', 2002, { fake: true, id: 'f1' }),
    carta('Zinedine Zidane', 'Real Madrid', 2002, { cria: true, id: 'b1' }),
  ])
  const [f, b] = s.managers[0].squad
  ok(f.club === 'Real Madrid', 'incógnito (fake) não é tocado — o nome dele é gerado')
  ok(b.club === 'Real Madrid', 'cria da base não é tocada — ela não vem do catálogo')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
await vite.close()
process.exit(falhas === 0 ? 0 : 1)
