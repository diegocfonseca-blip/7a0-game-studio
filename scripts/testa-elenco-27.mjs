// 🎽 TRAVAS DO BANCO DE 16 (elenco 27) — a regra do Diego, virada em teste.
//
// A correção dele, em 16/09, depois que eu errei o lugar:
//   *"o leilão de reserva são 11 jogadores sempre. Poder comprar mais cinco não tem
//    nada a ver com o leilão de reserva. O leilão de reserva mantém-se igual, que
//    são 11."*  +  *"ele contrata quando ele quiser, quando aparecer leilão ou mesmo
//    time… não tem exigência nenhuma."*
//
// Traduzindo em duas regras que não podem brigar:
//   1) o PREGÃO é montado igual ao de sempre — a mira dele (`slotsOf`) é 22;
//   2) mas o técnico HUMANO nunca é BARRADO no 22º: se ele quiser gastar, vai até 27
//      (`openSlots` com o pregão aberto usa o teto do elenco, `slotsCheio`).
// E o resto do mundo não muda: bot, rival e o online seguem em 22.
//
// Rodar: npx tsx scripts/testa-elenco-27.mjs
import { slotsOf, slotsCheio, openSlots, elencoCheio, marcaModoOnline } from '../src/escalacao/store'
import { _bancadaElencoNovo } from '../src/escalacao/sport'
import { SECTORS } from '../src/escalacao/types'

let falhas = 0
const ok = (cond, txt) => { console.log(`  ${cond ? '✅' : '❌'} ${txt}`); if (!cond) falhas++ }
const soma = (m, f) => SECTORS.reduce((s, p) => s + f(m, p), 0)
const time = (extra = {}) => ({ id: 1, formation: '4-4-2', squad: [], ...extra })
const encher = (m, n) => {
  // enche na proporção do 4-4-2 dobrado (GOL 2 · LAT 4 · ZAG 4 · MEI 8 · ATA 4)
  const ordem = ['GOL', 'GOL', 'LAT', 'LAT', 'LAT', 'LAT', 'ZAG', 'ZAG', 'ZAG', 'ZAG',
    'MEI', 'MEI', 'MEI', 'MEI', 'MEI', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA', 'ATA',
    'GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] // os 5 últimos são as vagas novas
  m.squad = ordem.slice(0, n).map((pos, i) => ({ id: `c${i}`, pos, lo: 70, hi: 80 }))
  return m
}

console.log('1) 🔒 TRAVA FECHADA (todo mundo, hoje): nada muda')
_bancadaElencoNovo(false)
marcaModoOnline(false)
{
  const eu = time({ isHuman: true, deepSquad: true })
  ok(elencoCheio(eu) === 22, `teto do elenco = ${elencoCheio(eu)} (tem que ser 22)`)
  ok(soma(eu, slotsOf) === 22, `mira do pregão = ${soma(eu, slotsOf)} (22)`)
  encher(eu, 22)
  ok(soma(eu, openSlots) === 0, 'elenco 22/22 no pregão: nenhuma vaga — é barrado, como sempre foi')
}

console.log('2) 🔓 TRAVA ABERTA, offline: o pregão continua 22, mas ele chega a 27')
_bancadaElencoNovo(true)
{
  const eu = time({ isHuman: true, deepSquad: true })
  ok(elencoCheio(eu) === 27, `teto do elenco = ${elencoCheio(eu)} (27 = 11 + 16 de banco)`)
  ok(soma(eu, slotsOf) === 22, `mira do PREGÃO segue ${soma(eu, slotsOf)} — "o leilão de reserva mantém-se igual, que são 11"`)
  encher(eu, 22)
  ok(soma(eu, openSlots) === 5, `elenco 22 com o pregão aberto: ainda cabem ${soma(eu, openSlots)} — o lance dele NÃO é anulado`)
  ok(SECTORS.every(p => openSlots(eu, p) === 1), 'e é 1 por posição: um goleiro, um lateral, um zagueiro, um meia e um atacante')
  encher(eu, 27)
  ok(soma(eu, openSlots) === 0, 'elenco 27/27: aí sim fecha — ninguém passa do teto')
}

console.log('3) 🤖 bot e rival não mudam (a demanda do baralho cresce 5 no total, não 5 por time)')
{
  const bot = encher(time({ isHuman: false, deepSquad: true }), 22)
  ok(soma(bot, slotsCheio) === 22, `teto do bot = ${soma(bot, slotsCheio)} (22)`)
  ok(soma(bot, openSlots) === 0, 'bot cheio em 22: sem vaga, igual a antes')
  const rival = encher(time({ isHuman: false, rival: true, deepSquad: true }), 22)
  ok(soma(rival, openSlots) === 0, 'rival cheio em 22: sem vaga, igual a antes')
}

console.log('4) 🌐 online não muda (o que está no ar não mexe sozinho)')
marcaModoOnline(true)
{
  const eu = encher(time({ isHuman: true, deepSquad: true }), 22)
  ok(elencoCheio(eu) === 22, `teto na sala online = ${elencoCheio(eu)} (22)`)
  ok(soma(eu, openSlots) === 0, 'humano cheio em 22 no online: sem vaga, igual a antes')
}
marcaModoOnline(false)

console.log('5) 📅 fora do pregão o número de vagas não muda (senão a tela mente)')
{
  // Durante a temporada o alvo volta pra 11. Este número alimenta o "−N 🕳️" do
  // gerenciar e a vez do monte — se ele crescesse o ano todo, a tela ia dizer que
  // falta gente sem faltar. Quem cuida do teto na temporada é `slotsCheio`/`vagaCheio`
  // (a caixa da Base), não este.
  const eu = time({ isHuman: true, deepSquad: false })
  // o XI do 4-4-2 exato (o `encher` acima enche na ordem do elenco, não da escalação)
  eu.squad = ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA']
    .map((pos, i) => ({ id: `x${i}`, pos, lo: 70, hi: 80 }))
  ok(soma(eu, openSlots) === 0, 'XI completo no meio da temporada: zero vaga (o alvo é o XI)')
  ok(soma(eu, slotsCheio) === 27, `mas o teto do elenco segue ${soma(eu, slotsCheio)} — é ele que libera a Base`)
}

_bancadaElencoNovo(false)
console.log(falhas ? `\n❌ ${falhas} trava(s) quebrada(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
