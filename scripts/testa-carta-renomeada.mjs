// 🏷️ trava da CARTA RENOMEADA (13/10, Marcelo do Renaton): quem tinha a carta com o nome VELHO
// ("Marcelo Vieira") passa pro nome novo ("Marcelo") quando o save abre, e a cópia que um bot tinha
// (listada no leilão, no elenco, na ficha de fundo ou no monte) sai. O elenco de gente nunca perde carta.
//   npm run renomeada
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const S = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const carta = (name, extra = {}) => ({ id: name + Math.random(), name, club: 'Real Madrid', year: 2017, pos: 'LAT', fame: 5, lo: 85, hi: 91, ...extra })
  const save = {
    careerOnline: true, seasonNo: 30, youIdx: 0, screen: 'auction',
    managers: [
      { id: 0, isHuman: true, teamName: 'Renaton', formation: '4-3-3', squad: [carta('Marcelo Vieira', { paid: 120 })] },
      { id: 1, isHuman: false, teamName: 'Leite de Verdade FC', formation: '4-3-3', squad: [carta('Marcelo')] },
      { id: 2, isHuman: false, teamName: 'Outro Bot', formation: '4-3-3', squad: [carta('Roberto Carlos', { club: 'Real Madrid', year: 2002 })] },
    ],
    cpuSquads: { 'Time de Fundo': [carta('Marcelo')] },
    deck: { GOL: [], LAT: [carta('Marcelo', { seller: 1, paid: 194 })], ZAG: [], MEI: [], ATA: [] },
    currentCards: [carta('Marcelo', { seller: 1, paid: 194 }), carta('Lahm', { club: 'Bayern', year: 2013 })],
    monte: [carta('Marcelo')],
    marketValues: { 'Marcelo Vieira|Real Madrid': 150, 'Marcelo|Real Madrid': 194 },
    condicaoCarry: { 'Marcelo Vieira|Real Madrid|2017': { g: 60, j: 40, gl: 3, as: 9 } },
  }
  const out = S.__sincronizaNiveis(save)
  assert.equal(out.managers[0].squad[0].name, 'Marcelo', 'a carta do Renaton passa pro nome novo')
  assert.equal(out.managers[0].squad[0].paid, 120, 'e continua sendo a MESMA carta dele (o que ele pagou não muda)')
  assert.equal(out.managers[1].squad.length, 0, 'o bot perde a cópia')
  assert.equal(out.managers[2].squad.length, 1, 'outro bot sem cópia não é tocado')
  assert.equal(out.cpuSquads['Time de Fundo'].length, 0, 'ficha de fundo perde a cópia')
  assert.equal(out.deck.LAT.length, 0, 'baralho do leilão perde a cópia')
  assert.deepEqual(out.currentCards.map(c => c.name), ['Lahm'], 'a mesa do pregão perde a cópia; o resto fica')
  assert.equal(out.monte.length, 0, 'monte perde a cópia')
  assert.equal(out.marketValues['Marcelo|Real Madrid'], 194, 'livro de preços junta na chave nova (fica o maior)')
  assert.equal(out.marketValues['Marcelo Vieira|Real Madrid'], undefined)
  assert.equal(out.condicaoCarry['Marcelo|Real Madrid|2017']?.as, 9, '"no seu clube" segue a carta (assistências não somem)')
  // save sem nada disso: nada muda
  const limpo = { careerOnline: true, managers: [{ id: 0, isHuman: true, squad: [carta('Lahm', { club: 'Bayern', year: 2013 })] }] }
  assert.equal(S.__sincronizaNiveis(limpo), limpo, 'save sem carta renomeada nem repetida volta o MESMO objeto')
  console.log('✅ carta renomeada: nome novo no save de quem tinha, cópia do bot sai do elenco, fundo, leilão e monte')
} finally { await vite.close() }
