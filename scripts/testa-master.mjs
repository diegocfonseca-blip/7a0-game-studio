// 🧪 PATROCINADOR MASTER — confere a régua e as travas fechadas com o Diego (13/09)
// contra `src/escalacao/estadiodata.ts`. Rodar: npx tsx scripts/testa-master.mjs
// (sai com código 1 se algo quebrar — rodar antes de commitar).
import { MASTER_PRAZOS, masterPorTemporada, masterAtivo, masterAnoAtual, SPONSOR_BET_PAY, sponsorBrandOf } from '../src/escalacao/estadiodata.ts'

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }

console.log('1) as 4 marcas reais, cada uma com o seu prazo (Vadico = mais grana, mais temporadas)')
ok(MASTER_PRAZOS.length === 4, 'são exatamente 4 contratos')
ok(MASTER_PRAZOS.every(p => sponsorBrandOf(p.brandId)?.logo), 'todas são marcas REAIS do jogo (têm logo): ' + MASTER_PRAZOS.map(p => sponsorBrandOf(p.brandId).name).join(' · '))
ok(MASTER_PRAZOS.map(p => p.anos).join(',') === '1,2,3,5', 'prazos 1 · 2 · 3 · 5 temporadas')
const vad = MASTER_PRAZOS.find(p => p.brandId === 'vadico')
ok(vad && vad.anos === Math.max(...MASTER_PRAZOS.map(p => p.anos)), 'Vadico Veículos é o contrato mais longo')
for (const d of ['V', 'D', 'C', 'B', 'A']) {
  const vals = MASTER_PRAZOS.map(p => masterPorTemporada(d, p.anos))
  const tots = MASTER_PRAZOS.map(p => masterPorTemporada(d, p.anos) * p.anos)
  ok(vals.every((v, i) => i === 0 || v > vals[i - 1]) && tots.every((v, i) => i === 0 || v > tots[i - 1]), `${d}: por temporada ${vals.join('/')} · total ${tots.join('/')} — Vadico é o maior nos dois`)
}

console.log('2) a régua: 1 temp = aposta "não cair" · +metade por temporada a mais · 5 temps = valor de campeão')
for (const d of ['V', 'D', 'C', 'B', 'A']) {
  const [naoCair, , campeao] = SPONSOR_BET_PAY[d]
  ok(masterPorTemporada(d, 1) === naoCair, `${d}: 1 temporada = ${naoCair} (a aposta 🛡️ não cair)`)
  ok(masterPorTemporada(d, 5) === campeao, `${d}: 5 temporadas = ${campeao} por temporada (o que 👑 campeão pagaria)`)
  ok([1, 2, 3, 5].every(a => Number.isInteger(masterPorTemporada(d, a))), `${d}: tudo inteiro (${[1, 2, 3, 5].map(a => masterPorTemporada(d, a)).join('/')})`)
}
ok(masterPorTemporada('C', 5) * 5 === 120 && masterPorTemporada('C', 5) === 24, 'exemplo do Diego na Série C: Vadico 5 temporadas = 120 no total = 24 por temporada')
ok(masterPorTemporada('V', 5) * 5 === 30, 'Várzea: Vadico = 30 no total (6 por temporada)')
ok(['D', 'C', 'B', 'A'].every((d, i) => masterPorTemporada(d, 3) === 2 * masterPorTemporada(['V', 'D', 'C', 'B'][i], 3)), 'dobra a cada divisão')

console.log('3) o contrato: congela na divisão da assinatura e cobre desde…desde+anos−1')
const c = { brandId: 'vadico', anos: 5, div: 'V', desde: 1, porTemporada: masterPorTemporada('V', 5) }
ok(!masterAtivo(undefined, 1), 'sem contrato = não ativo (a proposta aparece)')
ok([1, 2, 3, 4, 5].every(t => masterAtivo(c, t)), 'assinou na T1 por 5: cobre T1, T2, T3, T4 e T5')
ok(!masterAtivo(c, 6) && !masterAtivo(c, 0), 'na T6 acabou (proposta nova) · antes da assinatura não vale')
ok([1, 2, 3, 4, 5].map(t => masterAnoAtual(c, t)).join(',') === '1,2,3,4,5', 'temporada N de 5, pra tela')
ok(c.porTemporada === 6 && c.div === 'V', 'subiu pra D na T2? o valor continua 6 (o da Várzea, onde assinou) — a divisão de hoje não entra na conta')
// e o contrato novo, depois do vencimento, sai da divisão DE ENTÃO
const c2 = { brandId: 'ero', anos: 3, div: 'C', desde: 6, porTemporada: masterPorTemporada('C', 3) }
ok(c2.porTemporada === 16 && [6, 7, 8].every(t => masterAtivo(c2, t)) && !masterAtivo(c2, 9), 'T6 na Série C, assinou ERO 3 temps: 16 por temporada, cobre T6–T8, acaba na T9')
ok(masterAtivo(c, 5) && !masterAtivo(c2, 5), 'na T5 só o contrato velho conta; na T6 só o novo — nunca os dois')

console.log(falhas ? `\n❌ ${falhas} trava(s) quebrada(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
