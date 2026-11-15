// 🇧🇷 trava do Brasil Oficial (base pura): clubes, escudos e o sorteio dos 22.
import { CATALOG } from '../src/escalacao/data.ts'
import { ESCUDOS_OFICIAIS } from '../src/escalacao/escudos-oficiais.ts'
import { CLUBES_BR, cartasDoClube, sorteiaElenco, fechaTime, clubesDaDivisao } from '../src/escalacao/brasil-oficial.ts'
let erros = 0
const falha = (m: string) => { erros++; console.log('❌', m) }
if (clubesDaDivisao('A').length !== 20) falha('Série A precisa de 20')
if (clubesDaDivisao('B').length !== 20) falha('Série B precisa de 20')
if (new Set(CLUBES_BR.map(c => c.nome)).size !== CLUBES_BR.length) falha('clube repetido')
for (const c of CLUBES_BR) if (!(ESCUDOS_OFICIAIS as Record<string, unknown>)[c.nome]) falha(`sem escudo oficial: ${c.nome}`)
// sorteio: mesma semente = mesmo elenco; 22 sem repetir; sobra + elenco = todas
const fla = CLUBES_BR.find(c => c.nome === 'Flamengo')!
const todas = cartasDoClube(fla, CATALOG)
const a = sorteiaElenco(todas, 42), b = sorteiaElenco(todas, 42), d = sorteiaElenco(todas, 43)
if (a.elenco.length !== 22) falha('Flamengo: elenco ≠ 22')
if (a.elenco.length + a.sobra.length !== todas.length) falha('Flamengo: carta sumiu no sorteio')
if (new Set(a.elenco).size !== 22) falha('Flamengo: carta repetida no elenco')
if (a.elenco.map(x => x.carta.name).join() !== b.elenco.map(x => x.carta.name).join()) falha('mesma semente deu elenco diferente')
if (a.elenco.map(x => x.carta.name).join() === d.elenco.map(x => x.carta.name).join()) falha('semente diferente deu o mesmo elenco')
if (!fechaTime(a.elenco)) falha('Flamengo: os 22 sorteados não fecham um 11')
// quantos clubes já fecham um 11 com as cartas de hoje (informativo)
const prontos = CLUBES_BR.filter(c => fechaTime(cartasDoClube(c, CATALOG)))
console.log(`ℹ️ ${prontos.length}/${CLUBES_BR.length} clubes já fecham um 11 com as cartas de hoje`)
if (erros) { console.log(`❌ brasil-oficial: ${erros} erro(s)`); process.exit(1) }
console.log('✅ brasil-oficial: 40 clubes com escudo, sorteio dos 22 estável e sem perder carta')
