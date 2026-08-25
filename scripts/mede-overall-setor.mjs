// ─── 📏 BÔNUS POR SETOR: "+2 nos ATACANTES" vale quanto? (Diego 24/08) ──────
//
// Ele achou o buraco: *"se o Telê é a msm coisa q Pep Guardiola então tanto
// faz??"*. Tinha razão — se todo técnico dá +2 no time inteiro e só muda quantas
// formações domina, duas lendas viram a mesma coisa.
//
// A saída proposta: o +N do técnico cai num SETOR, não no time todo.
// Telê = +N nos ATACANTES · Pep = +N nos MEIAS · Muralha = +N nos ZAGUEIROS.
// Continua sendo UM número (a simplificação dele sobrevive), mas dois técnicos
// nunca mais são iguais — e o bônus conversa sozinho com a formação (o esquema
// do Telê tem 3-4 atacantes, então o +N dele pega mais gente).
//
// ✅ POR QUE ISSO É BARATO NO CÓDIGO: `rollForm()` (pyramidseason ~136) JÁ pensa
// por setor — `by('GOL')`, `by('LAT')`, `by('ZAG')`, `by('MEI')`, `by('ATA')`.
// Somar num setor é mexer onde o motor já separa.
//
// Este script mede QUANTO cada setor vale, pra escolher o número com base em
// dado e não em achismo.
//
//   npm run dev  (noutro terminal)
//   node scripts/mede-overall-setor.mjs [--temporadas 40]
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '40'))
const SAIDA = arg('--saida', 'overall-setor.json')
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('console', m => { const t = m.text(); if (t.startsWith('SIM')) console.log(t) })
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const rel = await page.evaluate(async ([TEMPS]) => {
  await import('/7a0-game-studio/src/escalacao/screens.tsx') // ordem do ciclo de import
  const P = await import('/7a0-game-studio/src/escalacao/pyramidseason.tsx')
  const { buildPyramid, simulatePyramid, computePromotions, seedCpuSquads, DIVS } = P

  const receitas = seedCpuSquads([], 20250824, 'br', false)
  const nomes = Object.keys(receitas)
  const SEED = 987654321

  // bonus só nas cartas do setor `setor` (null = time inteiro, pra comparar)
  const roda = (bonus, setor, elencoIdx, formacao) => {
    const meuElenco = receitas[nomes[elencoIdx]].map(c => {
      const pega = setor === null || c.pos === setor
      return pega ? { ...c, lo: Math.min(99, c.lo + bonus), hi: Math.min(99, c.hi + bonus) } : { ...c }
    })
    const managers = [{ id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false,
      formation: formacao, money: 100, squad: meuElenco }]
    let placements = null
    let pontos = 0, gols = 0, sofridos = 0, titulos = 0
    for (let t = 1; t <= TEMPS; t++) {
      const world = buildPyramid(managers, 0, SEED, 'br', placements, undefined)
      const seasonSeed = (SEED ^ (t * 2654435761)) >>> 0
      const live = simulatePyramid(world, seasonSeed, 38, {}, {}, 1.12, true, true)
      let minhaDiv = null, minhaPos = null, meu = null
      for (const d of DIVS) {
        const i = (live.tables[d] ?? []).findIndex(x => x.teamId === 0)
        if (i >= 0) { minhaDiv = d; minhaPos = i + 1; meu = live.tables[d][i] }
      }
      if (!meu) break
      pontos += meu.pts ?? 0; gols += meu.gf ?? 0; sofridos += meu.ga ?? 0
      if (minhaPos === 1) titulos++
      placements = computePromotions(live.tables)
    }
    return { bonus, setor: setor ?? 'TIME TODO', formacao,
      pts: +(pontos / TEMPS).toFixed(1), gols: +(gols / TEMPS).toFixed(1),
      sofridos: +(sofridos / TEMPS).toFixed(1), titulos }
  }

  const IDX = 0 // elenco forte (é onde o risco de trivializar mora)
  const out = { porSetor: [], porFormacao: [] }
  // ① quanto vale +2/+3/+5 em cada setor (formação fixa 4-4-2)
  for (const s of [null, 'ATA', 'MEI', 'ZAG', 'LAT', 'GOL']) {
    for (const b of (s === null ? [0, 2] : [2, 3, 5])) out.porSetor.push(roda(b, s, IDX, '4-4-2'))
  }
  console.log('SIM setores ok')
  // ② o MESMO +3 nos atacantes, mudando a formação: prova que o esquema muda o
  //    tamanho do bônus sozinho (4-2-4 tem 4 ATA, 4-5-1 tem 1)
  // (4-2-4 ainda não existe em FORMATIONS — é uma das novas propostas. Uso as
  //  que já existem: 3-4-3 e 4-3-3 têm 3 ATA, 4-4-2 tem 2, 4-5-1 tem 1.)
  for (const f of ['3-4-3', '4-3-3', '4-4-2', '4-5-1']) out.porFormacao.push(roda(3, 'ATA', IDX, f))
  console.log('SIM formacoes ok')
  return { temporadas: TEMPS, ...out }
}, [TEMPS])

await browser.close()
writeFileSync(SAIDA, JSON.stringify(rel, null, 2))

console.log(`\n══════ ① +X NUM SETOR SÓ · elenco forte · 4-4-2 · ${rel.temporadas} temporadas ══════`)
console.log('setor      | bônus | pts/temp | gols | sofridos | títulos em ' + rel.temporadas)
for (const l of rel.porSetor) {
  console.log(`${String(l.setor).padEnd(10)} |  +${l.bonus}   |  ${String(l.pts).padStart(5)}   | ${String(l.gols).padStart(4)} |   ${String(l.sofridos).padStart(4)}   |   ${l.titulos}`)
}
console.log(`\n══════ ② MESMO +3 NOS ATACANTES, MUDANDO A FORMAÇÃO ══════`)
console.log('formação | pts/temp | gols | títulos')
for (const l of rel.porFormacao) {
  console.log(`${l.formacao.padEnd(8)} |  ${String(l.pts).padStart(5)}   | ${String(l.gols).padStart(4)} |   ${l.titulos}`)
}
console.log(`\n📄 ${SAIDA}`)
