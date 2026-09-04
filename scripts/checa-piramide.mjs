#!/usr/bin/env node
// 🪜 TRAVA DA PIRÂMIDE — nenhuma divisão pode fechar com menos de 20 times.
//
// POR QUE ISTO EXISTE (04/09). O Gabriel Pena escreveu: *"no modo carreira a
// série A está bugada pra mim, só tem 11 times. E em várias das 38 rodadas por
// não ter 20 times, fica parada como se tivesse simulando o jogo, mas não tem
// jogo"*. A conta batia exata: numa carreira solo os 19 bots da sua liga usam os
// nomes dos clubes da ELITE, então a Série A de verdade tem que se completar com
// RESERVAS (`EXTRA_D_TEAMS`) — e a lista tinha só 10. 1 clube da elite que sobrou
// + 10 reservas = 11. Ninguém percebeu porque NADA conferia isso.
//
// Esta trava monta a pirâmide DE VERDADE (buildPyramid, o mesmo do jogo) nos
// piores casos e reprova se alguma divisão não fechar 20.
//
// uso: node scripts/checa-piramide.mjs     (sai com código 1 se reprovar)
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const P = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
const D = await vite.ssrLoadModule('/src/escalacao/data.ts')
const { buildPyramid, seedCpuSquads } = P
const DIVS = ['A', 'B', 'C', 'D', 'V']
const SEED = 20260904, DECK = 'both'

const tec = (id, teamName, extra = {}) => ({
  id, name: `Tec${id}`, teamName, isHuman: id === 0, auctionRival: true,
  formation: '4-3-3', money: 0, squad: [], aggression: .5, starHunger: .5, ...extra,
})

let reprovou = 0
function checa(rotulo, managers, placements) {
  const comV = Object.values(placements).includes('V')
  const w = buildPyramid(managers, 0, SEED, DECK, placements, seedCpuSquads(managers, SEED, DECK, comV))
  const usadas = comV ? DIVS : DIVS.filter(d => d !== 'V')
  const ruins = usadas.filter(d => w[d].length !== 20)
  const tam = usadas.map(d => `${d}=${w[d].length}`).join(' ')
  if (ruins.length) { reprovou++; console.log(`❌ ${rotulo}\n     ${tam}  ← ${ruins.join(', ')} fora de 20`) }
  else console.log(`✅ ${rotulo}  ·  ${tam}`)
}

const elite = D.TIMES_ELITE.map(t => t.team)
// a liga solo: você + 19 bots com nome de clube da ELITE (é assim que o jogo monta)
const ligaSolo = (meuTime, extras = []) => [
  tec(0, meuTime),
  ...elite.slice(0, 19).map((t, i) => tec(i + 1, t, { isHuman: false })),
  ...extras.map((t, i) => tec(100 + i, t, { isHuman: false, auctionOnly: true })),
]
const naVarzea = (ms) => { const pl = {}; for (const m of ms.slice(0, 20)) pl[`m${m.id}`] = 'V'; return pl }
const naSerieD = (ms) => { const pl = {}; for (const m of ms.slice(0, 20)) pl[`m${m.id}`] = 'D'; return pl }

console.log('🪜 conferindo se toda divisão fecha com 20 times\n')

// 1) carreira solo padrão (o caso do Gabriel)
{ const m = ligaSolo('Meu Time FC'); checa('carreira solo com escada (Várzea)', m, naVarzea(m)) }
{ const m = ligaSolo('Meu Time FC'); checa('carreira antiga, sem Várzea', m, naSerieD(m)) }

// 2) o time do jogador com o nome de um clube que já existe (o caso do "Deportivo
//    Montreal": batismo que roubou o nome de um clube da pirâmide)
for (const alvo of [elite[0], D.DIVISION_TEAMS.B[0].team, D.DIVISION_TEAMS.C[0].team, D.DIVISION_TEAMS.D[0].team, D.EXTRA_D_TEAMS[0].team]) {
  const m = ligaSolo(alvo); checa(`time do jogador xará de "${alvo}"`, m, naVarzea(m))
}

// 3) rivais de OUTRA divisão que ficaram no save (técnicos além do 20º)
const fora = [...D.DIVISION_TEAMS.B, ...D.DIVISION_TEAMS.C, ...D.DIVISION_TEAMS.D].map(t => t.team)
for (const n of [3, 9, 15]) { const m = ligaSolo('Meu Time FC', fora.slice(0, n)); checa(`${n} técnicos ALÉM dos 20 no save`, m, naVarzea(m)) }

// 4) muitos xarás de uma vez (sala cheia de batismo com nome já existente)
{
  const xaras = [...D.DIVISION_TEAMS.A.slice(0, 4), ...D.DIVISION_TEAMS.B.slice(0, 4), ...D.DIVISION_TEAMS.C.slice(0, 4), ...D.DIVISION_TEAMS.D.slice(0, 4)].map(t => t.team)
  const m = [tec(0, xaras[0]), ...xaras.slice(1).map((t, i) => tec(i + 1, t, { isHuman: false })), ...elite.slice(0, 5).map((t, i) => tec(50 + i, t, { isHuman: false }))]
  checa(`${xaras.length} times de jogador com nome de clube da pirâmide`, m, naVarzea(m))
}

// 5) folga da lista de reservas — quanto sobra pro pior caso
const usadosNaLiga = new Set(elite.slice(0, 19))
const reservasLivres = D.EXTRA_D_TEAMS.filter(t => !usadosNaLiga.has(t.team)).length
console.log(`\n📏 reservas (EXTRA_D_TEAMS): ${D.EXTRA_D_TEAMS.length} · a Série A precisa de ~20 · folga: ${reservasLivres - 20}`)
if (reservasLivres < 20) { reprovou++; console.log('❌ reservas de MENOS: a Série A não tem como fechar 20') }

console.log(reprovou ? `\n❌ ${reprovou} caso(s) reprovados — NÃO commitar assim` : '\n✅ toda divisão fecha com 20 em todos os casos')
await vite.close()
process.exit(reprovou ? 1 : 0)
