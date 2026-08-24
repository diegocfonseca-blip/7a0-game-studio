// ─── 🅰️🏆 AUDITORIA DAS ASSISTÊNCIAS NAS COPAS (24/08) ──────────────────────
//
// Pergunta do Diego: *"a assistência na carreira também vai funcionar pra
// qualquer copa né"*. Não funcionava — as copas têm motor de gol PRÓPRIO. Este
// script audita o conserto no motor DE VERDADE (Copa Legends + Copa do Brasil +
// Supercopa), com uma pirâmide inteira montada, temporada após temporada.
//
// O que ele PROVA:
//   0. 🔒 NADA MUDOU no que já existia: placar de cada jogo, campeão, vice e
//      artilheiro de cada copa saem IDÊNTICOS ao arquivo `copa-antes.json`
//      (gerado com o código anterior). Esta é a checagem mais importante —
//      copa já jogada e guardada não pode virar outra.
//   1. ~75% dos gols saem de um passe;
//   2. time que fez 3+ gols num jogo NUNCA fica sem nenhum garçom;
//   3. o goleador nunca dá assistência pra si mesmo;
//   4. rodar duas vezes dá exatamente o mesmo garçom (determinismo).
//
//   npm run dev
//   node scripts/checa-assist-copa.mjs --grava   (gera a foto do código ATUAL)
//   node scripts/checa-assist-copa.mjs           (compara com a foto)
import { chromium } from 'playwright-core'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'

const GRAVA = process.argv.includes('--grava')
const FOTO = 'scripts/copa-antes.json'
const BASE = 'http://localhost:5173/7a0-game-studio/bench-sim.html'
if (!existsSync('bench-sim.html')) writeFileSync('bench-sim.html', '<!doctype html><meta charset="utf-8"><title>bench</title><body>b</body>')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const r = await page.evaluate(async () => {
  const P = await import('/7a0-game-studio/src/escalacao/pyramidseason.tsx')
  const CB = await import('/7a0-game-studio/src/escalacao/copa-brasil.ts')
  const { buildPyramid, simulatePyramid, computePromotions, computeCopa, seedCpuSquads } = P

  const receitas = seedCpuSquads([], 20250824, 'br', true)
  const meuElenco = receitas[Object.keys(receitas)[0]].map(c => ({ ...c }))
  const managers = [{ id: 0, name: 'Você', teamName: 'Auditor FC', isHuman: true, auctionRival: false, formation: '4-4-2', money: 100, squad: meuElenco }]

  const SEED = 987654321
  const TEMPORADAS = 25
  const impressao = []          // 🔒 assinatura do que JÁ EXISTIA (placares, campeão, artilheiro)
  let comPasse = 0, semPasse = 0
  let auto = 0                  // goleador que serviu a si mesmo (tem que ser 0)
  let semGarcomCom3plus = 0     // time com 3+ gols num jogo e nenhum garçom (tem que ser 0)

  const auditaTie = (tie) => {
    const legs = tie.legGoals && tie.legGoals.length ? tie.legGoals : [tie.goals]
    for (const g of legs) {
      for (const lado of [true, false]) {
        const gols = g.filter(e => e.home === lado)
        if (!gols.length) continue
        let com = 0
        for (const e of gols) {
          if (e.assist) { comPasse++; com++; if (e.assist === e.name) auto++ } else semPasse++
        }
        if (gols.length >= 3 && com === 0) semGarcomCom3plus++
      }
    }
  }
  const assina = (tag, copa) => {
    impressao.push(`${tag}|camp=${copa.champion?.name ?? '-'}|vice=${copa.vice?.name ?? '-'}|art=${copa.topScorer?.name ?? '-'}:${copa.topScorer?.goals ?? 0}`)
    for (const rd of copa.rounds) for (const tie of rd.ties) {
      impressao.push(`${tag}|${rd.name}|${tie.a.name}x${tie.b.name}|${tie.aggA}-${tie.aggB}|${(tie.pens ?? []).join(':')}|${tie.goals.map(g => `${g.name}${g.min}${g.home ? 'C' : 'F'}`).join(',')}`)
      auditaTie(tie)
    }
  }

  // 🌱 placements com alguém na VÁRZEA = pirâmide CHEIA (100 clubes, A–V) — é o
  // que a Copa do Brasil exige pra montar a chave (N ≥ 68).
  let placements = { m0: 'V' }
  for (let t = 1; t <= TEMPORADAS; t++) {
    const world = buildPyramid(managers, 0, SEED, 'br', placements, undefined)
    const seasonSeed = (SEED ^ (t * 2654435761)) >>> 0
    const live = simulatePyramid(world, seasonSeed, 38, {}, {}, 1.12, true, true)
    assina(`L${t}`, computeCopa(live.tables, seasonSeed, t, 1.12, true, {}))
    const cb = CB.computeCopaBrasil(live.tables, seasonSeed, t, 1.12, true, {})
    const sup = CB.computeSupercopa(live.tables, cb.champion, seasonSeed, t, 1.12, true, {})
    assina(`B${t}`, CB.copaBrasilAsCopaResult(cb, sup))
    placements = computePromotions(live.tables)
  }

  // determinismo: MESMO mundo, duas chamadas → mesmo garçom em cada gol
  const w0 = buildPyramid(managers, 0, SEED, 'br', { m0: 'V' }, undefined)
  const s0 = simulatePyramid(w0, SEED, 38, {}, {}, 1.12, true, true)
  const chave = c => c.rounds.flatMap(r => r.ties.flatMap(t => t.goals.map(g => `${g.name}|${g.min}|${g.assist ?? ''}`))).join(';')
  const determinista = chave(computeCopa(s0.tables, SEED, 1, 1.12, true, {})) === chave(computeCopa(s0.tables, SEED, 1, 1.12, true, {}))

  // ── 🌍 COPA DO MUNDO (seleções, motor próprio em copa-mundo.tsx) ──
  const CM = await import('/7a0-game-studio/src/escalacao/copa-mundo.tsx')
  const SECS = ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']
  const selecao = (i) => ({
    club: `Sel${i}`, you: i === 0, pais: `P${i}`, str: 50 + (i % 12) * 2,
    xi: SECS.map((sec, k) => ({ name: `J${i}-${k}`, club: `C${i}`, year: 2000, fame: 3, lo: 60 + ((i + k) % 25), hi: 70 + ((i + k) % 25), sec })),
  })
  const selecoes = Array.from({ length: 24 }, (_, i) => selecao(i))
  let cmCom = 0, cmSem = 0, cmAuto = 0, cmSemGarcom3 = 0
  const cmAudita = (ev) => {
    for (const lado of [true, false]) {
      const gols = (ev ?? []).filter(e => e.home === lado)
      if (!gols.length) continue
      let com = 0
      for (const e of gols) { if (e.assist) { cmCom++; com++; if (e.assist === e.name) cmAuto++ } else cmSem++ }
      if (gols.length >= 3 && com === 0) cmSemGarcom3++
    }
  }
  const cmAssinatura = []
  for (let t = 0; t < 30; t++) {
    const r = CM.simulaCopaMundo(selecoes, 4242 + t * 991, t)
    for (const g of r.groups) for (const rd of g.matches) for (const m of rd) { cmAudita(m.ev); cmAssinatura.push(`${m.h}x${m.a}:${m.gh}-${m.ga}:${(m.ev ?? []).map(e => e.name + e.min).join(',')}`) }
    for (const tie of [...r.qf, ...r.sf]) { cmAudita(tie.ev1); cmAudita(tie.ev2); cmAssinatura.push(`ko${tie.h}x${tie.a}:${(tie.g1 ?? []).join('-')}/${(tie.g2 ?? []).join('-')}:${tie.winner}`) }
    cmAudita(r.final.ev)
    cmAssinatura.push(`fin:${r.final.g.join('-')}:${r.final.champion}`)
  }

  return {
    impressao, cmAssinatura,
    cmPct: +(cmCom * 100 / Math.max(1, cmCom + cmSem)).toFixed(1),
    cmGols: cmCom + cmSem, cmAuto, cmSemGarcom3,
    pctComPasse: +(comPasse * 100 / Math.max(1, comPasse + semPasse)).toFixed(1),
    gols: comPasse + semPasse,
    auto, semGarcomCom3plus, determinista,
  }
})

await browser.close()

if (GRAVA) {
  writeFileSync(FOTO, JSON.stringify({ copas: r.impressao, mundo: r.cmAssinatura }))
  console.log(`📸 foto gravada: ${FOTO} (${r.impressao.length} linhas)`)
} else if (existsSync(FOTO)) {
  const foto = JSON.parse(readFileSync(FOTO, 'utf8'))
  const cmp = (antes, agora, nome) => {
    const iguais = antes.length === agora.length && antes.every((x, i) => x === agora[i])
    const dif = antes.filter((x, i) => x !== agora[i]).length
    console.log(`🔒 ${nome}: NADA MUDOU? ${iguais ? 'SIM ✅' : `NÃO ❌ (${dif} de ${antes.length} linhas diferentes)`}`)
    if (!iguais) { const i = antes.findIndex((x, k) => x !== agora[k]); console.log('   ex.:', antes[i], '→', agora[i]) }
  }
  console.log('')
  cmp(foto.copas, r.impressao, 'Copa Legends + Copa do Brasil + Supercopa')
  cmp(foto.mundo, r.cmAssinatura, 'Copa do Mundo')
} else {
  console.log(`(sem ${FOTO} — rode com --grava no código ANTIGO pra ter com o que comparar)`)
}

console.log('\n══════ COPAS · ASSISTÊNCIAS ══════')
console.log(`gols auditados: ${r.gols}`)
console.log(`% de gols com passe: ${r.pctComPasse}  (alvo ~75%)`)
console.log(`✅ goleador nunca serve a si mesmo: ${r.auto === 0}  (casos: ${r.auto})`)
console.log(`✅ time com 3+ gols nunca fica sem garçom: ${r.semGarcomCom3plus === 0}  (casos: ${r.semGarcomCom3plus})`)
console.log(`✅ mesma copa dá sempre o mesmo garçom: ${r.determinista}`)
console.log('\n══════ 🌍 COPA DO MUNDO · ASSISTÊNCIAS ══════')
console.log(`gols auditados: ${r.cmGols}`)
console.log(`% de gols com passe: ${r.cmPct}  (alvo ~75%)`)
console.log(`✅ goleador nunca serve a si mesmo: ${r.cmAuto === 0}  (casos: ${r.cmAuto})`)
console.log(`✅ seleção com 3+ gols nunca fica sem garçom: ${r.cmSemGarcom3 === 0}  (casos: ${r.cmSemGarcom3})`)
