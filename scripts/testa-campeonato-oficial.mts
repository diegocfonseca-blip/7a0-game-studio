// 🇧🇷 trava do motor dos campeonatos reais do Brasil Oficial (campeonato-oficial.ts): formato, contas e determinismo.
import { serieA, serieB, serieC2026, serieD2026, turnoUnico, turnoEReturno, rngDe, type Joga, type Penaltis } from '../src/escalacao/campeonato-oficial.ts'
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
const grupos = Array.from({ length: 16 }, (_, i) => ({ nome: `A${i + 1}`, times: clubesDaDivisao('D').filter(c => c.grupoD === `A${i + 1}`).map(c => c.nome) }))
const D = serieD2026(grupos, 7, jogaDe(4), penDe(4))
if (D.jogos.length !== 480 + (32 + 16 + 8 + 4 + 2 + 1 + 2) * 2) falha(`Série D: ${D.jogos.length} jogos`)
if (D.sobem.length !== 6 || new Set(D.sobem).size !== 6 || !D.sobem.includes(D.campeao)) falha(`Série D: sobem ${D.sobem}`)
const D2 = serieD2026(grupos, 7, jogaDe(4), penDe(4))
if (JSON.stringify(D2) !== JSON.stringify(D)) falha('Série D: mesma semente deu campeonato diferente')
if (erros) { console.log(`❌ campeonato-oficial: ${erros} erro(s)`); process.exit(1) }
console.log(`✅ campeonato-oficial: A ${A.jogos.length} jogos · B ${B.jogos.length} (sobem ${B.sobem.join(', ')}) · C ${C.jogos.length} (campeão ${C.campeao}) · D ${D.jogos.length} (campeão ${D.campeao}; sobem ${D.sobem.join(', ')})`)
