// 🧪 SUBIR DA BASE (13/09) — confere a trava de VAGA e o que muda no rodízio.
// Rodar: npx tsx scripts/testa-cria-base.mjs
import { sugerirRodizio } from '../src/escalacao/condicao.ts'
import { openSlots, vagaCheio, totalHoles, previewCriaNomes } from '../src/escalacao/store.tsx'

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }

console.log('1) vagas por posição (o botão só aparece quando há vaga)')
const sq = []
for (const pos of ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']) sq.push({ id: `t${sq.length}`, pos, lo: 80, hi: 90 })
const m = { id: 1, isHuman: true, formation: '4-3-3', deepSquad: true, squad: sq }
ok(totalHoles(m) === 11, `elenco de 11 numa carreira com banco fundo: ${totalHoles(m)} vagas (mira 22)`)
ok(openSlots(m, 'GOL') === 1 && openSlots(m, 'MEI') === 3, `GOL ${openSlots(m, 'GOL')} vaga · MEI ${openSlots(m, 'MEI')} vagas`)
m.squad.push({ id: 'c1', pos: 'GOL', lo: 48, hi: 58, cria: true })
ok(openSlots(m, 'GOL') === 0, 'subiu um cria de GOL → GOL sem vaga (o cria ocupa a vaga, não fura o teto)')

console.log('3) 🌱 a caixa da Base vale O ANO INTEIRO (conserto de 14/09)')
// Diego (14/09): "não achei o botão no elenco". Motivo: fora do leilão de reservas
// o alvo do elenco volta pra 11 (deepSquad=false), então `openSlots` dava ZERO e a
// caixa sumia justamente NA TEMPORADA — que é quando ele quer usar. A régua da
// caixa passou a ser o ELENCO CHEIO (`vagaCheio`), que não depende do deepSquad.
const meio = { id: 2, isHuman: true, formation: '4-3-3', deepSquad: false, squad: sq.slice(0, 15) }
ok(openSlots(meio, 'MEI') === 0, 'regra velha no meio da temporada: MEI sem vaga (mira 11) — era isto que escondia o botão')
ok(vagaCheio(meio, 'MEI') > 0, `regra nova: MEI com ${vagaCheio(meio, 'MEI')} vaga(s) pro elenco cheio, com o leilão fechado`)
const cheio = { id: 3, isHuman: true, formation: '4-3-3', deepSquad: false, squad: [] }
for (const pos of ['GOL','GOL','LAT','LAT','LAT','LAT','ZAG','ZAG','ZAG','ZAG','MEI','MEI','MEI','MEI','MEI','MEI','ATA','ATA','ATA','ATA','ATA','ATA'])
  cheio.squad.push({ id: `f${cheio.squad.length}`, pos, lo: 80, hi: 90 })
ok(['GOL','LAT','ZAG','MEI','ATA'].every(p => vagaCheio(cheio, p) === 0), 'elenco 22/22: nenhuma vaga — a caixa some, que é o certo')

console.log('2) nomes: nunca repete o que já subiu')
const rng = (() => { let x = 7; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648 } })()
const a = previewCriaNomes(['Miudinho', 'Ratinho'], rng, 3)
ok(a.length === 3 && new Set(a).size === 3 && !a.includes('Miudinho') && !a.includes('Ratinho'), `3 nomes novos, sem repetir: ${a.join(' · ')}`)

console.log('3) o preparador NÃO usa cria no rodízio (nem no automático)')
const squad = sq.map(c => ({ ...c })).concat([{ id: 'c2', pos: 'ATA', lo: 48, hi: 58, cria: true }, { id: 'r1', pos: 'ATA', lo: 70, hi: 80 }])
const gas = Object.fromEntries(squad.map(c => [c.id, 100])); gas.t8 = 10; gas.t9 = 10
const sug = sugerirRodizio(sq.map(c => c.id), squad, gas)
ok(sug && sug.trocas.length === 1 && sug.trocas[0].entra.id === 'r1', 'dois atacantes cansados, um reserva real e um cria: só o real entra')
ok(!sug.ids.includes('c2'), 'o cria nunca é puxado pelo rodízio — quem quiser ele em campo escala na mão')

console.log(falhas ? `\n❌ ${falhas} trava(s) quebrada(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
