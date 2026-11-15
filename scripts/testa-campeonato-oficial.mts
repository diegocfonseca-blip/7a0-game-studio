// 🇧🇷 trava do motor dos campeonatos reais do Brasil Oficial (campeonato-oficial.ts): formato, contas e determinismo.
import { serieA, serieB, serieC2026, serieC2028, serieD2026, turnoUnico, turnoEReturno, rngDe, ordena, tamanhoDaSerie, caemDaSerie, type Joga, type Penaltis } from '../src/escalacao/campeonato-oficial.ts'
import { clubesDaDivisao } from '../src/escalacao/brasil-oficial.ts'
let erros = 0
const falha = (m: string) => { erros++; console.log('❌', m) }
const jogaDe = (seed: number): Joga => { const r = rngDe(seed); return () => ({ gc: Math.floor(r() * 4), gf: Math.floor(r() * 3) }) }
const penDe = (seed: number): Penaltis => { const r = rngDe(seed); return (a, b) => (r() < 0.5 ? a : b) }
// calendários: todo mundo pega todo mundo, ninguém joga duas vezes na rodada
for (const n of [4, 6, 19, 20, 24]) {
  const tu = turnoUnico(n), tr = turnoEReturno(n)
  const pares = new Set(tu.flat().map(([a, b]) => [Math.min(a, b), Math.max(a, b)].join('-')))
  if (pares.size !== n * (n - 1) / 2) falha(`turno único de ${n}: ${pares.size} confrontos`)
  for (const r of tu) { const v = r.flat(); if (new Set(v).size !== v.length) falha(`turno único de ${n}: time 2x na rodada`) }
  if (tr.flat().length !== n * (n - 1)) falha(`turno e returno de ${n}: ${tr.flat().length} jogos`)
  const mando = new Map<number, number>(); for (const [a] of tr.flat()) mando.set(a, (mando.get(a) ?? 0) + 1)
  if ([...mando.values()].some(x => x !== n - 1)) falha(`turno e returno de ${n}: mando desigual`)
}
const nomes = (d: 'A' | 'B' | 'C') => clubesDaDivisao(d).map(c => c.nome)
const A = serieA(nomes('A'), 7, jogaDe(1))
if (A.jogos.length !== 380 || A.caem.length !== 4) falha(`Série A: ${A.jogos.length} jogos, ${A.caem.length} caem`)
const B = serieB(nomes('B'), 7, jogaDe(2), penDe(2))
if (B.jogos.length !== 384 || B.sobem.length !== 4 || new Set(B.sobem).size !== 4 || B.caem.length !== 4) falha(`Série B: ${B.jogos.length} jogos, sobem ${B.sobem}`)
if (B.mataMata[0].confrontos.some(c => c.penaltis)) falha('Série B: playoff não tem pênalti (empate = melhor campanha)')
const C = serieC2026(nomes('C'), 7, jogaDe(3), penDe(3))
if (C.jogos.length !== 190 + 24 + 2 || C.sobem.length !== 4 || C.caem.length !== 2 || !C.sobem.includes(C.campeao)) falha(`Série C: ${C.jogos.length} jogos, sobem ${C.sobem}, caem ${C.caem}, campeão ${C.campeao}`)
// C 2027: 24 clubes, turno único de 23 rodadas + 2ª fase + final
const vinte4 = Array.from({ length: 24 }, (_, i) => `Clube ${i + 1}`)
const C27 = serieC2026(vinte4, 9, jogaDe(5), penDe(5))
if (C27.jogos.length !== 276 + 24 + 2 || C27.caem.length !== 2) falha(`Série C 2027: ${C27.jogos.length} jogos`)
// C 2028: 28 em 2 grupos de 14 (turno e returno), 6 caem, 4 sobem
const vinte8 = Array.from({ length: 28 }, (_, i) => `Clube ${i + 1}`)
const C28 = serieC2028(vinte8, 9, jogaDe(6), penDe(6))
if (C28.jogos.length !== 2 * 182 + 24 + 2 || C28.caem.length !== 6 || C28.sobem.length !== 4 || C28.sobem.some(t => C28.caem.includes(t))) falha(`Série C 2028: ${C28.jogos.length} jogos, sobem ${C28.sobem}, caem ${C28.caem}`)
// as contas fecham ano a ano: C 2027 = 20 − 4 sobem − 2 caem + 4 da B + 6 da D = 24; 2028 = 24 − 4 − 2 + 4 + 6 = 28; depois 28 − 4 − 6 + 4 + 6
if (tamanhoDaSerie('C', 2026) - 4 - caemDaSerie('C', 2026) + 4 + 6 !== tamanhoDaSerie('C', 2027)) falha('contas da C 2026→2027')
if (tamanhoDaSerie('C', 2027) - 4 - caemDaSerie('C', 2027) + 4 + 6 !== tamanhoDaSerie('C', 2028)) falha('contas da C 2027→2028')
if (tamanhoDaSerie('C', 2028) - 4 - caemDaSerie('C', 2028) + 4 + 6 !== tamanhoDaSerie('C', 2029)) falha('contas da C 2028→2029')
// confronto direto desempata DOIS iguais em pontos/vitórias/saldo/gols
{ const L = (time: string) => ({ time, j: 2, v: 1, e: 0, d: 1, gp: 2, gc: 2, pts: 3 })
  const t = ordena([L('X'), L('Y')], [{ casa: 'X', fora: 'Y', gc: 0, gf: 1, ctx: { serie: 'T', fase: 'f', rodada: 1 } }, { casa: 'Y', fora: 'Z', gc: 1, gf: 2, ctx: { serie: 'T', fase: 'f', rodada: 2 } }])
  if (t[0].time !== 'Y') falha('confronto direto: quem ganhou o jogo entre os dois tem que ficar na frente') }
const grupos = Array.from({ length: 16 }, (_, i) => ({ nome: `A${i + 1}`, times: clubesDaDivisao('D').filter(c => c.grupoD === `A${i + 1}`).map(c => c.nome) }))
const D = serieD2026(grupos, 7, jogaDe(4), penDe(4))
if (D.jogos.length !== 480 + (32 + 16 + 8 + 4 + 2 + 1 + 2) * 2) falha(`Série D: ${D.jogos.length} jogos`)
if (D.sobem.length !== 6 || new Set(D.sobem).size !== 6 || !D.sobem.includes(D.campeao)) falha(`Série D: sobem ${D.sobem}`)
const D2 = serieD2026(grupos, 7, jogaDe(4), penDe(4))
if (JSON.stringify(D2) !== JSON.stringify(D)) falha('Série D: mesma semente deu campeonato diferente')
if (erros) { console.log(`❌ campeonato-oficial: ${erros} erro(s)`); process.exit(1) }
console.log(`✅ campeonato-oficial: A ${A.jogos.length} jogos · B ${B.jogos.length} (sobem ${B.sobem.join(', ')}) · C ${C.jogos.length} (campeão ${C.campeao}) · D ${D.jogos.length} (campeão ${D.campeao}; sobem ${D.sobem.join(', ')})`)
