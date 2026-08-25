// ─── 📐 "SÓ FORMAÇÃO É POUCO?" — quanto vale poder escolher o esquema ────────
//
// Dúvida do Diego (25/08): *"o mais certo pra mim é por formação de acordo com a
// categoria do técnico ter mais ou menos formações... mas é mt pouco eu acho"*.
//
// A pergunta tem resposta MEDÍVEL: se o técnico só libera esquema, então o valor
// dele é a diferença entre jogar no esquema CERTO pro seu elenco e ficar preso
// num esquema que não combina. Se essa diferença for grande, "só formação" já é
// um técnico de verdade. Se for zero, o Diego tem razão e precisa de outra coisa.
//
// ⚙️ Por que isso pode valer muito: a formação decide QUEM ENTRA EM CAMPO. O
// `rollForm` calcula ataque e defesa por SETOR, com quem está escalado — então
// 4-3-3 (3 atacantes) e 4-5-1 (1 atacante) usam elencos diferentes do MESMO time.
// Quem tem 4 feras no ataque e nada no meio é outro time em cada esquema.
//
// O teste roda o MOTOR DE VERDADE da carreira (buildPyramid + simulatePyramid),
// com elencos de PERFIS diferentes, cada um em cada esquema, por N temporadas.
//
//   npm run dev  (noutro terminal)
//   node scripts/mede-formacao-vale-quanto.mjs [--temporadas 30]
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '30'))
const SAIDA = arg('--saida', 'formacao-vale-quanto.json')
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
  const { buildPyramid, simulatePyramid, computePromotions, seedCpuSquads } = P

  const receitas = seedCpuSquads([], 20250825, 'br', false)
  const nomes = Object.keys(receitas)
  const SEED = 987654321
  const ESQUEMAS = ['4-3-3', '4-4-2', '4-5-1', '3-4-3', '5-3-2']

  // 🎭 PERFIS DE ELENCO: o mesmo número de jogadores, mas a força concentrada em
  // lugares diferentes. É aqui que a formação deveria pesar — um elenco de
  // artilheiros não pode jogar 4-5-1, e um de zagueiros não rende no 3-4-3.
  const perfil = (base, reforca, quanto) => base.map(c => (
    reforca.includes(c.pos) ? { ...c, lo: Math.min(99, c.lo + quanto), hi: Math.min(99, c.hi + quanto) } : { ...c }
  ))
  // ⚠️ ARMADILHA QUE ME PEGOU NA 1ª RODADA: os elencos de receita vêm no formato
  // 4-3-3 com 11 cartas (1 GOL · 2 LAT · 2 ZAG · 3 MEI · 3 ATA). Com isso, 5-3-2
  // (quer 3 ZAG) e 4-4-2 (quer 4 MEI) NÃO CONSEGUEM se formar: o `bestXI` corta no
  // que existe e os dois acabam escalando os MESMOS 11. Resultado: as duas linhas
  // saíram idênticas e a formação parecia não valer nada. Pra medir de verdade o
  // elenco precisa ser FUNDO o bastante pra cada esquema ser possível.
  const fundo = (base) => {
    const out = []
    const porPos = { GOL: 2, LAT: 4, ZAG: 4, MEI: 6, ATA: 5 } // dá pra montar qualquer um dos 5
    for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
      const doPos = base.filter(c => c.pos === pos)
      for (let i = 0; i < porPos[pos]; i++) {
        const molde = doPos[i % Math.max(1, doPos.length)] ?? base[0]
        // reservas um pouco piores que os titulares — é assim num elenco de verdade,
        // e é justamente o que faz "escalar 1 atacante" render diferente de "3".
        const queda = i < 2 ? 0 : 4 + (i - 2) * 3
        out.push({ ...molde, pos, id: `${pos}-${i}`, name: `${pos}${i + 1}`,
          lo: Math.max(40, molde.lo - queda), hi: Math.max(45, molde.hi - queda) })
      }
    }
    return out
  }
  const baseSquad = fundo(receitas[nomes[0]])
  const PERFIS = [
    { nome: 'equilibrado', squad: perfil(baseSquad, [], 0) },
    { nome: 'cheio de ATACANTE', squad: perfil(baseSquad, ['ATA'], 10) },
    { nome: 'cheio de MEIA', squad: perfil(baseSquad, ['MEI'], 10) },
    { nome: 'cheio de ZAGUEIRO', squad: perfil(baseSquad, ['ZAG', 'GOL'], 10) },
  ]

  const roda = (squad, formacao) => {
    const managers = [{ id: 0, name: 'Você', teamName: 'Meu Timão', isHuman: true, auctionRival: false,
      formation: formacao, money: 100, squad: squad.map(c => ({ ...c })) }]
    let placements = null
    let pontos = 0, gols = 0, sofridos = 0, titulos = 0, subidas = 0
    for (let t = 1; t <= TEMPS; t++) {
      const world = buildPyramid(managers, 0, SEED, 'br', placements, undefined)
      const seasonSeed = (SEED ^ (t * 2654435761)) >>> 0
      const live = simulatePyramid(world, seasonSeed, 38, {}, {}, 1.12, true, true)
      let minhaPos = null, meu = null
      for (const d of ['A', 'B', 'C', 'D', 'V']) {
        const i = (live.tables[d] ?? []).findIndex(x => x.teamId === 0)
        if (i >= 0) { minhaPos = i + 1; meu = live.tables[d][i] }
      }
      if (!meu) break
      pontos += meu.pts ?? 0; gols += meu.gf ?? 0; sofridos += meu.ga ?? 0
      if (minhaPos === 1) titulos++
      if (minhaPos <= 3) subidas++
      placements = computePromotions(live.tables)
    }
    return { formacao, pts: +(pontos / TEMPS).toFixed(1), gols: +(gols / TEMPS).toFixed(1),
      sofridos: +(sofridos / TEMPS).toFixed(1), titulos, subidas }
  }

  const out = []
  for (const p of PERFIS) {
    const linhas = ESQUEMAS.map(f => roda(p.squad, f))
    const ord = [...linhas].sort((a, b) => b.pts - a.pts)
    out.push({ perfil: p.nome, linhas, melhor: ord[0], pior: ord[ord.length - 1] })
  }
  console.log('SIM formacoes ok')
  return { temporadas: TEMPS, perfis: out }
}, [TEMPS])

await browser.close()
writeFileSync(SAIDA, JSON.stringify(rel, null, 2))

console.log(`\n══════ 📐 QUANTO VALE ESCOLHER O ESQUEMA · ${rel.temporadas} temporadas por linha ══════`)
for (const p of rel.perfis) {
  console.log(`\n▸ elenco ${p.perfil}`)
  console.log('  esquema | pts/temp | gols | sofridos | títulos | top3')
  for (const l of p.linhas) {
    const marca = l.formacao === p.melhor.formacao ? ' ⬅ melhor' : l.formacao === p.pior.formacao ? ' ⬅ pior' : ''
    console.log(`  ${l.formacao.padEnd(7)} |  ${String(l.pts).padStart(5)}   | ${String(l.gols).padStart(4)} |   ${String(l.sofridos).padStart(4)}   |   ${String(l.titulos).padStart(2)}    |  ${String(l.subidas).padStart(2)}${marca}`)
  }
  console.log(`  → do PIOR esquema pro MELHOR: ${(p.melhor.pts - p.pior.pts).toFixed(1)} pontos/temporada e ${p.melhor.titulos - p.pior.titulos} títulos em ${rel.temporadas}`)
}
console.log(`\n📄 ${SAIDA}`)
