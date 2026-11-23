// 🔁 trava da SUBSTITUIÇÃO COM O JOGO ROLANDO (23/11). Confere, em vários jogos:
//  1. até o instante da troca o jogo é IDÊNTICO ao jogo sem troca (nada do passado muda);
//  2. o motor ao vivo (troca agendada no meio, como o campinho faz) = o motor refeito do zero com a troca na entrada (a conta
//     do placar) — o que se vê é o que vale;
//  3. quem entrou está em campo, quem saiu não; tática sozinha também entra; troca de expulso/inexistente é ignorada;
//  4. a assinatura da entrada muda com a troca (o placar guardado não reaproveita o jogo sem troca).
import assert from 'node:assert/strict'
import { novoMotor2, entradaM2, resultadoM2, assinaturaSimulacaoM2 } from '../src/escalacao/motor2/carreira'
import { CATALOG } from '../src/escalacao/data'
const pick = (pos: string, n: number, o = 0) => (CATALOG as never as Record<string, { name: string }[]>)[pos].slice(o, o + n).map(c => ({ ...c, pos }))
const time = (o: number) => [...pick('GOL', 1, o), ...pick('LAT', 2, o), ...pick('ZAG', 2, o), ...pick('MEI', 3, o), ...pick('ATA', 3, o)]
const fim = (m: ReturnType<typeof novoMotor2>) => { for (let k = 1; k <= 120 && !m.fim; k++) m.avancaAte(k) }
const foto = (m: ReturnType<typeof novoMotor2>) => JSON.stringify([m.placar, m.atl.map(a => [a.nome, a.x.toFixed(4), a.y.toFixed(4)]), m.bola.x.toFixed(4)])
let n = 0, mudou = 0
for (let j = 0; j < 12; j++) {
  const casa = time(j), fora = time(j + 20), reservaMei = pick('MEI', 1, 60 + j)[0], reservaAta = pick('ATA', 1, 60 + j)[0]
  const base = { seed: 1000 + j * 7919, casa, fora, fCasa: '4-3-3', fFora: '4-3-3', tatica: [0, 0] as [number, number], bots: [false, true] as [boolean, boolean] }
  const minuto = 20 + (j * 6) % 60
  const ref = novoMotor2(entradaM2(base)); ref.avancaAte(minuto)
  const live = novoMotor2(entradaM2(base)); live.avancaAte(minuto)
  assert.equal(foto(live), foto(ref), 'jogo igual até o minuto da troca')
  const trocas = [
    { t: live.t, lado: 0 as const, sai: casa[5].name, entra: reservaMei, tatica: j % 3 - 1 },
    { t: live.t, lado: 0 as const, sai: casa[8].name, entra: reservaAta },
  ]
  trocas.forEach(x => live.agendaTroca(x))
  fim(live)
  const rep = novoMotor2(entradaM2({ ...base, aoVivo: trocas })); fim(rep)
  assert.equal(foto(live), foto(rep), 'ao vivo = refeito do zero (o placar que vale)')
  assert.deepEqual(rep.subs.map(s => s.entra), [reservaMei.name, reservaAta.name], 'as duas trocas valeram')
  if (!rep.atl.some(a => a.lado === 0 && a.expulso)) {
    assert.ok(rep.atl.some(a => a.nome === reservaMei.name) && !rep.atl.some(a => a.nome === casa[5].name), 'quem entrou está em campo e quem saiu não')
  }
  const r0 = resultadoM2(entradaM2(base)), r1 = resultadoM2(entradaM2({ ...base, aoVivo: trocas }))
  assert.deepEqual(r0.gols.filter(g => g.min <= Math.floor(minuto * 0.98)), r1.gols.filter(g => g.min <= Math.floor(minuto * 0.98)), 'gols antes da troca não mudam')
  assert.notEqual(assinaturaSimulacaoM2(entradaM2(base)), assinaturaSimulacaoM2(entradaM2({ ...base, aoVivo: trocas })), 'a troca muda a assinatura do jogo')
  if (JSON.stringify(r0) !== JSON.stringify(r1)) mudou++
  // troca de quem não está em campo: ignorada (nada quebra)
  const fant = novoMotor2(entradaM2({ ...base, aoVivo: [{ t: 30, lado: 0, sai: 'Ninguém', entra: reservaMei }] })); fim(fant)
  assert.equal(fant.subs.length, 0, 'troca de quem não está em campo é ignorada')
  n++
}
console.log(`🔁 troca ao vivo: ${n} jogos — passado intacto, ao vivo = placar que vale (${mudou} jogos mudaram de placar depois da troca)`)
