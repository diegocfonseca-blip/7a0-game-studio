// ─── ⚽🅰️ TRAVA: O GOL DO JOGADOR CONTA LIGA + TODAS AS COPAS ───────────────
//
// Relato do Diego (25/09), olhando a aba Elenco de uma carreira encerrada:
// *"os gols no modo carreira não tão aparecendo gols da copa e supercopa, eu
// acredito. Assistência também não, no jogador. E quando aperta no jogador, que
// mostra o modal de infos dele, também não tá totalizando certo os gols totais e
// assistências totais"*.
//
// A régua (CLAUDE.md, 19/09): *"todos dados q tá fazendo de gols sempre serve p
// assistência tb"* e o histórico é por CARTA. O número que a pessoa vê no elenco
// (`golsTemporada`/`assTemporada`, em pyramidseason.tsx) é
// `liga + copa.goalsByCard` — então TUDO que é copa precisa estar dentro do
// `goalsByCard` da copa, senão some da tela e some do acumulado da virada
// (`guardaCansaco` recebe o MESMO mapa).
//
// O que esta trava reprova:
//  1. 🏆🔵 SUPERCOPA FORA DO MAPA POR CARTA. Ela é calculada FORA da Copa do
//     Brasil e entra na chave como uma fase a mais; os gols dela chegavam em
//     `scorersAll` (histórico e prêmio) mas NÃO em `goalsByCard` — ou seja,
//     contavam no Rank e sumiam da ficha do jogador. Mesma coisa nas
//     assistências.
//  2. 🗝️ CHAVE DO CARRY COM GRAFIA DIFERENTE. `guardaCansaco` GRAVA
//     `nome|clubCanon(clube)|ano` e a tela LIA `nome|clube|ano` — quem joga por
//     um dos clubes de grafia dupla (Bayern München → Bayern, Inter de Milão →
//     Inter, Man United…) perdia gols, assistências e jogos do "NO SEU CLUBE" a
//     cada virada. É o "não tá totalizando certo" do modal.
//
// Roda o CÓDIGO DE VERDADE (import do fonte, via vite) — nada de cópia da regra.
// uso: node scripts/testa-gols-jogador.mjs [--porta 5233]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5233')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
p.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const P = await import('/src/escalacao/pyramidseason.tsx')
  const CB = await import('/src/escalacao/copa-brasil.ts')
  const D = await import('/src/escalacao/data.ts')
  const { buildPyramid, simulatePyramid, computePromotions, seedCpuSquads } = P

  const receitas = seedCpuSquads([], 20250824, 'br', true)
  const meuElenco = receitas[Object.keys(receitas)[0]].map(c => ({ ...c }))
  const managers = [{ id: 0, name: 'Você', teamName: 'Auditor FC', isHuman: true, auctionRival: false, formation: '4-4-2', money: 100, squad: meuElenco }]

  const SEED = 987654321
  const TEMPORADAS = 12
  // 🌱 pirâmide CHEIA (alguém na Várzea) — é o que a Copa do Brasil exige
  let placements = { m0: 'V' }
  let supercopasComGol = 0, golSupercopaPerdido = 0, assSupercopaPerdida = 0
  let supercopasComAssist = 0
  const amostra = []

  for (let t = 1; t <= TEMPORADAS; t++) {
    const world = buildPyramid(managers, 0, SEED, 'br', placements, undefined)
    const seasonSeed = (SEED ^ (t * 2654435761)) >>> 0
    const liga = simulatePyramid(world, seasonSeed, 38, {}, {}, 1.12, true, true)
    const cb = CB.computeCopaBrasil(liga.tables, seasonSeed, t, 1.12, true, {})
    const sup = CB.computeSupercopa(liga.tables, cb.champion, seasonSeed, t, 1.12, true, {})
    const copa = CB.copaBrasilAsCopaResult(cb, sup)

    // o que a Supercopa produziu, por carta (é isso que tem que chegar no mapa)
    const supGols = {}, supAss = {}
    for (const s of sup?.scorers ?? []) if (s.cardId) supGols[s.cardId] = (supGols[s.cardId] ?? 0) + s.goals
    for (const a of sup?.assists ?? []) if (a.cardId) supAss[a.cardId] = (supAss[a.cardId] ?? 0) + a.assists
    const nG = Object.values(supGols).reduce((s, x) => s + x, 0)
    const nA = Object.values(supAss).reduce((s, x) => s + x, 0)
    if (nG > 0) supercopasComGol++
    if (nA > 0) supercopasComAssist++

    // ⚖️ o mapa por carta da copa TEM que conter a supercopa
    for (const id in supGols) {
      const naCopa = (copa.goalsByCard ?? {})[id] ?? 0
      const naCB = (cb.goalsByCard ?? {})[id] ?? 0
      if (naCopa < naCB + supGols[id]) golSupercopaPerdido += (naCB + supGols[id]) - naCopa
    }
    for (const id in supAss) {
      const naCopa = (copa.assistsByCard ?? {})[id] ?? 0
      const naCB = (cb.assistsByCard ?? {})[id] ?? 0
      if (naCopa < naCB + supAss[id]) assSupercopaPerdida += (naCB + supAss[id]) - naCopa
    }
    if (amostra.length < 3 && nG > 0) amostra.push({ temporada: t, supercopaGols: nG, supercopaAss: nA, campeaoCopa: cb.champion?.name ?? '-' })
    placements = computePromotions(liga.tables)
  }

  // 🗝️ A CHAVE DO CARRY VEM DE UM LUGAR SÓ (`chaveCarry`, condicao.ts): quem
  // GRAVA (store) e quem LÊ (tela) chamam a MESMA função. Aqui conferimos duas
  // coisas: (1) ela normaliza a grafia do clube; (2) ninguém voltou a montar a
  // string na mão nos dois arquivos que usam o carry.
  const C = await import('/src/escalacao/condicao.ts')
  const grafiaDupla = Object.keys(D.CLUB_GRAFIA)
  const cartasGrafia = []
  for (const cat of [D.CATALOG, D.CATALOG_EU, D.CATALOG_WORLD])
    for (const arr of Object.values(cat))
      for (const c of arr) if (grafiaDupla.includes(c.club)) cartasGrafia.push(c)
  const naoNormaliza = cartasGrafia.filter(c => C.chaveCarry(c) !== `${c.name}|${D.clubCanon(c.club)}|${c.year}`)

  // 🔎 grep no FONTE servido pelo vite: chave montada à mão volta a abrir o furo
  const fontes = ['/src/escalacao/store.tsx', '/src/escalacao/pyramidseason.tsx']
  const naMao = []
  for (const f of fontes) {
    const txt = await (await fetch(f)).text()
    // ⚠️ o alvo é ESTREITO de propósito: ler/gravar o carry com a string montada
    // na linha (`carry[`…`]`). Um grep largo pegaria as OUTRAS chaves por carta
    // que o store monta de propósito (artilharia, ficha) e viraria alarme falso.
    if (/(condicao)?[Cc]arry\[`/.test(txt)) naMao.push(f)
  }

  return {
    temporadas: TEMPORADAS, supercopasComGol, supercopasComAssist,
    golSupercopaPerdido, assSupercopaPerdida, amostra,
    cartasGrafiaDupla: cartasGrafia.length,
    cartasQueDivergem: naoNormaliza.length,
    exemploDivergente: naoNormaliza.slice(0, 3).map(c => `${c.name} · ${c.club} · ${c.year}`),
    chaveExemplo: C.chaveCarry({ name: 'Chicharito', club: 'Manchester United', year: 2011 }),
    chaveNaMao: naMao,
  }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n⚽🅰️ GOL E ASSISTÊNCIA DO JOGADOR — liga + TODAS as copas\n')
console.log(`   temporadas simuladas ........ ${r.temporadas}`)
console.log(`   supercopas com gol .......... ${r.supercopasComGol}`)
console.log(`   supercopas com assistência .. ${r.supercopasComAssist}`)
console.log(`   gols de Supercopa perdidos .. ${r.golSupercopaPerdido}`)
console.log(`   assists de Supercopa perdidas ${r.assSupercopaPerdida}`)
if (r.amostra.length) console.log('   amostra:', JSON.stringify(r.amostra))
console.log(`\n   cartas de clube com grafia dupla ... ${r.cartasGrafiaDupla}`)
console.log(`   chaves que NÃO normalizam ......... ${r.cartasQueDivergem}`)
console.log(`   chaveCarry(Chicharito · Man United) = ${r.chaveExemplo}`)
if (r.exemploDivergente.length) console.log('   exemplo:', r.exemploDivergente.join(' · '))

const erros = []
if (r.supercopasComGol === 0) erros.push('a simulação não gerou nenhum gol de Supercopa — o teste não mediu nada')
if (r.golSupercopaPerdido > 0) erros.push(`${r.golSupercopaPerdido} gol(s) de Supercopa ficaram FORA do mapa por carta (somem da ficha do jogador)`)
if (r.assSupercopaPerdida > 0) erros.push(`${r.assSupercopaPerdida} assistência(s) de Supercopa ficaram FORA do mapa por carta`)
if (r.cartasQueDivergem > 0) erros.push(`${r.cartasQueDivergem} cartas não normalizam a grafia do clube na chave do carry`)
if (r.chaveNaMao.length) erros.push(`chave do carry montada À MÃO em: ${r.chaveNaMao.join(', ')} — use chaveCarry() (condicao.ts)`)

if (erros.length) { console.log('\n❌ REPROVADO:'); for (const e of erros) console.log('   ·', e); process.exit(1) }
console.log('\n✅ passou: gol e assistência de TODAS as copas chegam na ficha do jogador.\n')
