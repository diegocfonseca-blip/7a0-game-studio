// 🧪 PATROCINADOR MASTER — confere a régua e as travas fechadas com o Diego (13/09)
// contra `src/escalacao/estadiodata.ts`. Rodar: npx tsx scripts/testa-master.mjs
// (sai com código 1 se algo quebrar — rodar antes de commitar).
import { MASTER_PRAZOS, MASTER_BASE, masterPorTemporada, masterAtivo, masterAnoAtual, masterValor, SPONSOR_BET_PAY, sponsorBrandOf } from '../src/escalacao/estadiodata.ts'

let falhas = 0
const ok = (cond, msg) => { if (cond) console.log('  ✅', msg); else { falhas++; console.log('  ❌', msg) } }

console.log('1) as 5 marcas reais, cada uma com o seu prazo (Vadico = mais grana, mais temporadas)')
// 🅾️ 23/09: virou CINCO. Diego: *"coloque a Uomo Concetto também como Master,
// sendo agora 5 marcas. Sendo a Vadico a mais cara ainda mesmo"*.
ok(MASTER_PRAZOS.length === 5, 'são exatamente 5 contratos')
ok(MASTER_PRAZOS.every(p => sponsorBrandOf(p.brandId)?.logo), 'todas são marcas REAIS do jogo (têm logo): ' + MASTER_PRAZOS.map(p => sponsorBrandOf(p.brandId).name).join(' · '))
ok(MASTER_PRAZOS.map(p => p.anos).join(',') === '1,2,3,4,5', 'prazos 1 · 2 · 3 · 4 · 5 temporadas')
// 🔒 A CONDIÇÃO QUE ELE PÔS, escrita como trava: a Vadico tem que pagar MAIS que
// qualquer outra em TODA divisão. Como a régua é só divisão × prazo, isso é o
// mesmo que a Vadico ter o maior prazo — mas a trava confere pelo DINHEIRO, que é
// o que ele falou, pra valer mesmo se um dia a régua mudar de forma.
for (const d of ['V', 'D', 'C', 'B', 'A']) {
  const pagam = MASTER_PRAZOS.map(p => ({ n: sponsorBrandOf(p.brandId)?.name ?? p.brandId, v: masterPorTemporada(d, p.anos) }))
  const maior = pagam.reduce((a, b) => (b.v > a.v ? b : a))
  ok(maior.n.startsWith('Vadico') && pagam.filter(x => x.v === maior.v).length === 1,
    `Série ${d}: a Vadico é a que mais paga, sozinha (${pagam.map(x => x.v).join(' · ')})`)
}
const vad = MASTER_PRAZOS.find(p => p.brandId === 'vadico')
ok(vad && vad.anos === Math.max(...MASTER_PRAZOS.map(p => p.anos)), 'Vadico Veículos é o contrato mais longo')
for (const d of ['V', 'D', 'C', 'B', 'A']) {
  const vals = MASTER_PRAZOS.map(p => masterPorTemporada(d, p.anos))
  const tots = MASTER_PRAZOS.map(p => masterPorTemporada(d, p.anos) * p.anos)
  ok(vals.every((v, i) => i === 0 || v > vals[i - 1]) && tots.every((v, i) => i === 0 || v > tots[i - 1]), `${d}: por temporada ${vals.join('/')} · total ${tots.join('/')} — Vadico é o maior nos dois`)
}

console.log('2) a régua (13/09, 2ª versão — "aumente um pouco, quase nada"): base × (1,25 + (anos−1)/2)')
for (const d of ['V', 'D', 'C', 'B', 'A']) {
  // 13/09: o Pontual subiu (+2/+4/+6/+8/+10 por divisão) SEM mexer no Master — a régua do
  // Master agora nasce de MASTER_BASE (congelada), não mais da tabela do Pontual.
  const naoCair = MASTER_BASE[d], campeao = naoCair * 3
  ok(masterPorTemporada(d, 1) > naoCair && masterPorTemporada(d, 1) <= naoCair * 1.5, `${d}: 1 temporada = ${masterPorTemporada(d, 1)} (um pouco acima da base ${naoCair})`)
  ok(masterPorTemporada(d, 5) > campeao && masterPorTemporada(d, 5) <= campeao * 1.17, `${d}: 5 temporadas = ${masterPorTemporada(d, 5)} por temporada (um pouco acima de 3× a base, ${campeao})`)
  // 🚫 A linha que conferia o "Pontual 🛡️" SAIU em 23/09: o patrocinador pontual
  //    NÃO EXISTE MAIS desde 19/09 (ordem dele), então amarrar a régua do Master
  //    à dele era travar o Master num número que ninguém mais usa.
  ok([1, 2, 3, 5].every(a => Number.isInteger(masterPorTemporada(d, a))), `${d}: tudo inteiro (${[1, 2, 3, 5].map(a => masterPorTemporada(d, a)).join('/')})`)
}
// 🔢 ATUALIZADA EM 23/09. Os números aqui eram os de ANTES do aumento que ele
//    pediu em 15/09 (*"suba só da Várzea até a Série C, quase nada"*: V2→3, D4→5,
//    C8→10). A trava ficou vermelha 8 dias sem ninguém ver, porque trava vermelha
//    que ninguém roda não protege nada. Agora ela guarda a régua de VERDADE.
ok(['V', 'D', 'C', 'B', 'A'].map(d => [1, 2, 3, 4, 5].map(a => masterPorTemporada(d, a)).join('/')).join(' · ') === '4/5/7/8/10 · 6/9/11/14/16 · 13/18/23/28/33 · 20/28/36/44/52 · 40/56/72/88/104', 'a tabela inteira (1·2·3·4·5): V 4/5/7/8/10 · D 6/9/11/14/16 · C 13/18/23/28/33 · B 20/28/36/44/52 · A 40/56/72/88/104')
ok(masterPorTemporada('C', 5) * 5 === 165 && masterPorTemporada('C', 5) === 33, 'Série C: Vadico 5 temporadas = 165 no total = 33 por temporada')
// 📈 NÃO "dobra" mais exatamente: o aumento de 15/09 mexeu só em V/D/C de
//    propósito (*"até pra não atrapalhar o que ganha da Série B"*), então o degrau
//    ficou irregular embaixo e dobrado em cima. O que TEM que valer, e é o que
//    interessa pro jogo, é que subir de divisão SEMPRE pague mais.
ok(['D', 'C', 'B', 'A'].every((d, i) => masterPorTemporada(d, 3) > masterPorTemporada(['V', 'D', 'C', 'B'][i], 3)), 'subir de divisão sempre paga mais (V<D<C<B<A no contrato de 3)')
ok(masterPorTemporada('A', 3) === 2 * masterPorTemporada('B', 3), 'e de B pra A continua dobrando (essas duas não foram mexidas em 15/09)')
// quem assinou ANTES do ajuste recebe o valor novo (a conta é refeita na divisão congelada)
ok(masterValor({ brandId: 'vadico', anos: 5, div: 'C', desde: 1, porTemporada: 24 }) === 33, 'contrato assinado com 24 gravado passa a pagar 33 (régua nova, mesma divisão)')
ok(masterValor({ brandId: 'vadico', anos: 5, div: 'V', desde: 1, porTemporada: 6 }) === 10, 'e o da Várzea: 6 → 10 — a divisão congelada continua mandando')

console.log('3) o contrato: congela na divisão da assinatura e cobre desde…desde+anos−1')
const c = { brandId: 'vadico', anos: 5, div: 'V', desde: 1, porTemporada: masterPorTemporada('V', 5) }
ok(!masterAtivo(undefined, 1), 'sem contrato = não ativo (a proposta aparece)')
ok([1, 2, 3, 4, 5].every(t => masterAtivo(c, t)), 'assinou na T1 por 5: cobre T1, T2, T3, T4 e T5')
ok(!masterAtivo(c, 6) && !masterAtivo(c, 0), 'na T6 acabou (proposta nova) · antes da assinatura não vale')
ok([1, 2, 3, 4, 5].map(t => masterAnoAtual(c, t)).join(',') === '1,2,3,4,5', 'temporada N de 5, pra tela')
ok(masterValor(c) === 10 && c.div === 'V', 'subiu pra D na T2? o valor continua o da Várzea, onde assinou (10) — a divisão de hoje não entra na conta')
// e o contrato novo, depois do vencimento, sai da divisão DE ENTÃO
const c2 = { brandId: 'ero', anos: 3, div: 'C', desde: 6, porTemporada: masterPorTemporada('C', 3) }
ok(masterValor(c2) === 23 && [6, 7, 8].every(t => masterAtivo(c2, t)) && !masterAtivo(c2, 9), 'T6 na Série C, assinou ERO 3 temps: 23 por temporada, cobre T6–T8, acaba na T9')
ok(masterAtivo(c, 5) && !masterAtivo(c2, 5), 'na T5 só o contrato velho conta; na T6 só o novo — nunca os dois')

console.log(falhas ? `\n❌ ${falhas} trava(s) quebrada(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
