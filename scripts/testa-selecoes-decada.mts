// 🏳️📅 trava do LEILÃO DE SELEÇÕES e do POR DÉCADA (31/10, Diego: "publica tudo"). Roda a largada da sala online de
// verdade (reducer, START_ONLINE) com 2 a 36 técnicos, nos dois formatos da sala (4-3-3 e 4-4-2), e confere:
//   · tem pacote pra TODO MUNDO em cada setor (ninguém fica sem — sala de 36 inclusa)
//   · todo pacote tem jogador suficiente pra fechar o setor da formação
//   · Seleções: todas as cartas do pacote são do MESMO país · Década: todas da MESMA década
//   · o Clubes de sempre continua igual (sem selecao/decada no pacote)
//   npx tsx scripts/testa-selecoes-decada.mts
import assert from 'node:assert/strict'
import { reducer, INITIAL } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { SECTORS, FORMATIONS } from '../src/escalacao/types'
import { paisDaCarta } from '../src/escalacao/liga-draft'

const modos = [
  { nome: 'Clubes de sempre', selecao: false, decada: false },
  { nome: 'Seleções (todas as épocas)', selecao: true, decada: false },
  { nome: 'Clubes por década', selecao: false, decada: true },
  { nome: 'Seleções por década', selecao: true, decada: true },
]
let falhas = 0
for (const m of modos) {
  for (const formation of ['4-3-3', '4-4-2'] as const) {
    for (const n of [2, 8, 20, 36]) {
      for (let rodada = 0; rodada < 3; rodada++) {
        const nomes = Array.from({ length: n }, (_, i) => `T${i}`)
        const s = reducer(structuredClone(INITIAL) as EscState, { type: 'START_ONLINE', roomId: 't', roomCode: 'T1', isHost: true, playerIndex: 0, playerNames: nomes, formation, deck: 'todos', copaMode: 'liga_copa', clubes: true, selecao: m.selecao, decada: m.decada } as never)
        assert.equal(s.leilaoClubes, true)
        assert.equal(!!s.leilaoSelecao, m.selecao); assert.equal(!!s.leilaoDecada, m.decada)
        const pessoas = s.managers.filter(x => x.isHuman || x.auctionRival).length
        for (const pos of SECTORS) {
          const pacs = s.deck[pos]
          const vagas = FORMATIONS[formation][pos]
          if (pacs.length < pessoas) { falhas++; console.log(`❌ ${m.nome} ${formation} ${n}p: ${pos} só ${pacs.length} pacotes pra ${pessoas}`) }
          for (const p of pacs) {
            const c = p.pacote!.cartas
            assert.ok(c.length >= vagas, `${m.nome}: pacote ${p.name} ${pos} tem ${c.length} < ${vagas}`)
            assert.equal(!!p.pacote!.selecao, m.selecao)
            assert.equal(!!p.pacote!.decada, m.decada)
            if (m.selecao) assert.equal(new Set(c.map(paisDaCarta)).size, 1, `pacote ${p.name} mistura países`)
            if (m.decada) assert.ok(c.every(x => Math.floor(x.year / 10) * 10 === p.pacote!.decada), `pacote ${p.name} mistura décadas`)
            assert.ok(!p.name.includes('|') && !p.pacote!.clube.includes('|'), 'nome sem a chave crua')
          }
        }
      }
    }
  }
  console.log(`✅ ${m.nome}`)
}
if (falhas) { console.log(`❌ ${falhas} falha(s)`); process.exit(1) }
console.log('✅ Seleções e Por década: pacote pra todo mundo de 2 a 36, sem misturar país nem década')
process.exit(0) // o cliente do banco fica ouvindo em segundo plano; o teste já acabou
