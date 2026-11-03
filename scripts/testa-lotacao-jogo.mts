// 🎟️ Trava da LOTAÇÃO DO JOGO no mapa (03/11): o público sai da mesma régua da bilheteria, vazio quando o time vai mal,
// lotado em clássico e decisão, e NUNCA acima dos lugares construídos.  Rodar: npm run lotacao
import assert from 'node:assert/strict'
import { lotacaoDoJogo } from '../src/escalacao/presidencia-lotacao-jogo.ts'
import { publicoDoEstadio } from '../src/escalacao/presidencia-estadio-publico.ts'
import { stadiumSeats, stadiumOccupancy } from '../src/escalacao/estadiodata.ts'

const vazio = { inv: {}, ext: [] }
const meio = { inv: { grama: 30, geral: 40, cadeiras: 45 }, ext: [] }
const cheio = { inv: { grama: 30, geral: 40, cadeiras: 90, visitante: 120, camarote: 150 }, ext: ['estacao', 'cober'] }

// 1) a base é a MESMA ocupação que paga a bilheteria
for (const st of [vazio, meio, cheio]) for (let pos = 1; pos <= 20; pos++) {
  const l = lotacaoDoJogo({ stadium: st, pos, support: 50 })
  assert.equal(l.lotacao, Math.max(.06, stadiumOccupancy(pos, st)), `pos ${pos}: mesma régua da renda`)
}

// 2) time mal = estádio vazio; time bem = cheio
const mal = lotacaoDoJogo({ stadium: meio, pos: 19, support: 20 }), bem = lotacaoDoJogo({ stadium: meio, pos: 2, support: 80 })
assert.ok(mal.lotacao <= .3, 'Z4 com torcida baixa: estádio às moscas (' + mal.lotacao + ')')
assert.ok(bem.lotacao >= .95, 'G4: lotado')
assert.ok(mal.torcedores < bem.torcedores / 3)
const chuva = lotacaoDoJogo({ stadium: meio, pos: 10, support: 50, rain: true }), seco = lotacaoDoJogo({ stadium: meio, pos: 10, support: 50 })
assert.ok(chuva.lotacao < seco.lotacao, 'chuva sem cobertura esvazia')
assert.equal(lotacaoDoJogo({ stadium: cheio, pos: 10, support: 50, rain: true }).lotacao, lotacaoDoJogo({ stadium: cheio, pos: 10, support: 50 }).lotacao, 'com cobertura a chuva não muda nada')

// 3) clássico e decisão enchem — mesmo com o time mal
const classico = lotacaoDoJogo({ stadium: meio, pos: 19, support: 20, classico: true })
assert.ok(classico.lotacao >= .9 && classico.motivo === 'classico', 'clássico lota mesmo no Z4')
assert.ok(lotacaoDoJogo({ stadium: meio, pos: 18, support: 10, decisao: 'semi' }).lotacao >= .95, 'semifinal enche')
assert.ok(lotacaoDoJogo({ stadium: meio, pos: 5, support: 50, decisao: 'reta' }).lotacao >= .88, 'reta final brigando lá em cima enche')
for (const d of [{ decisao: 'final' as const }, { decisao: 'reta' as const, classico: true }]) {
  const l = lotacaoDoJogo({ stadium: meio, pos: 20, support: 0, rain: true, ...d })
  assert.equal(l.lotacao, 1, 'final (ou clássico decisivo) = lotado'); assert.equal(l.torcedores, stadiumSeats(meio).now)
}

// 4) NUNCA passa da capacidade construída (todas as combinações)
for (const st of [vazio, meio, cheio]) for (const pos of [undefined, 1, 4, 8, 15, 17, 20]) for (const support of [0, 50, 100, NaN])
  for (const rain of [false, true]) for (const classico of [false, true]) for (const decisao of [undefined, 'reta', 'semi', 'final'] as const) {
    const l = lotacaoDoJogo({ stadium: st, pos, support, rain, classico, decisao })
    assert.ok(l.lotacao >= 0 && l.lotacao <= 1)
    assert.ok(Number.isInteger(l.torcedores) && l.torcedores >= 0 && l.torcedores <= stadiumSeats(st).now, 'nunca acima dos lugares')
    assert.equal(l.capacidade, stadiumSeats(st).now)
  }
assert.equal(lotacaoDoJogo({ stadium: vazio, pos: 1, classico: true, decisao: 'final' }).torcedores, 0, 'sem arquibancada, ninguém sentado')

// 5) o mapa usa a MESMA conta: arquibancada (attendance) e o número do placar (só durante o jogo)
const dia = { division: 'B', support: 60, pos: 3, classico: true, match: 'playing' as const }
const p = publicoDoEstadio(cheio, dia), l = lotacaoDoJogo({ stadium: cheio, pos: 3, support: 60, classico: true })
assert.equal(p.attendance, Math.round(l.lotacao * 100)); assert.equal(p.torcedores, l.torcedores)
assert.equal(publicoDoEstadio(cheio, { ...dia, match: 'idle' }).torcedores, 0, 'fora do jogo o placar não mostra público')
assert.ok(publicoDoEstadio(cheio, { division: 'B', support: 60, pos: 19, match: 'playing' }).attendance < publicoDoEstadio(cheio, { division: 'B', support: 60, pos: 2, match: 'playing' }).attendance)
// sem colocação (estádio do dono da casa num jogo fora) segue a regra antiga, igualzinha
assert.equal(publicoDoEstadio(vazio, { support: 80, rain: true }).attendance, 48)
assert.equal(publicoDoEstadio(cheio, { support: 80, rain: true }).attendance, 88)

console.log('PASS lotação do jogo: mesma régua da bilheteria · vazio quando vai mal · lotado em clássico/decisão/final · nunca acima da capacidade · mapa e placar com o mesmo número')
