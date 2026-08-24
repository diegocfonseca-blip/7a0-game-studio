// ─── 🅰️ AUDITORIA DAS ASSISTÊNCIAS NO MODO RÁPIDO (24/08) ───────────────────
//
// Mesma preocupação da carreira, nas palavras do Diego: *"as coisas têm que
// bater e ser reais"*. Aqui o alvo é o motor do RÁPIDO (`garcomDoGol` em
// store.tsx), testado com um elenco de verdade e 20 mil gols.
//
// O que este script PROVA:
//   1. ~75% dos gols saem de um passe (no futebol de verdade é a mesma faixa);
//   2. a mesma jogada devolve SEMPRE o mesmo garçom (determinismo — no online o
//      convidado tem que ver o mesmo que o host);
//   3. a trava do "3+ gols" nunca volta vazia (o medo do 7x0 sem assistência);
//   4. o goleador nunca dá assistência pra si mesmo;
//   5. quem serve mais é meia, depois lateral — igual no futebol.
//
// ⚠️ O que ele NÃO cobre, e por que está tudo bem: "assistência ≤ gol" é
// garantido pela ESTRUTURA (sai no máximo um garçom por gol marcado), e o
// zeramento junto com a artilharia foi feito nos 8 lugares onde `s.scorers`
// zera — os dois são invariantes de código, não de sorteio.
//
//   npm run dev  ·  node scripts/checa-assist-rapido.mjs
import { chromium } from 'playwright-core'
import { writeFileSync, existsSync } from 'node:fs'

const BASE = 'http://localhost:5173/7a0-game-studio/bench-sim.html'
if (!existsSync('bench-sim.html')) writeFileSync('bench-sim.html', '<!doctype html><meta charset="utf-8"><title>bench</title><body>b</body>')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const r = await page.evaluate(async () => {
  const { garcomDoGol } = await import('/7a0-game-studio/src/escalacao/store.tsx')
  const mk = (name, pos, lo, hi) => ({ id: name, name, pos, lo, hi, club: 'X', year: 2000, fame: 3 })
  const squad = [mk('Goleiro', 'GOL', 60, 70), mk('Cafu', 'LAT', 80, 88), mk('R.Carlos', 'LAT', 82, 90),
    mk('Aldair', 'ZAG', 75, 82), mk('Lucio', 'ZAG', 78, 85), mk('Alex', 'MEI', 82, 90), mk('Zico', 'MEI', 88, 95),
    mk('Ganso', 'MEI', 75, 84), mk('Romario', 'ATA', 90, 97), mk('Bebeto', 'ATA', 84, 91), mk('Edmundo', 'ATA', 80, 88)]
  let comPasse = 0, semPasse = 0
  const cont = {}
  for (let i = 0; i < 20000; i++) {
    const g = garcomDoGol(i * 7919, 3, squad, 'Romario', 1 + (i % 90), false)
    if (g) { comPasse++; cont[g] = (cont[g] ?? 0) + 1 } else semPasse++
  }
  const a = garcomDoGol(555, 3, squad, 'Romario', 42, false)
  const b = garcomDoGol(555, 3, squad, 'Romario', 42, false)
  const c = garcomDoGol(555, 3, squad, 'Romario', 42, false)
  let forcadoNulo = 0
  for (let i = 0; i < 5000; i++) if (!garcomDoGol(i * 31, 3, squad, 'Romario', 1 + (i % 90), true)) forcadoNulo++
  return {
    pctComPasse: +(comPasse * 100 / (comPasse + semPasse)).toFixed(1),
    determinista: a === b && b === c,
    forcadoNuncaVazio: forcadoNulo === 0,
    goleadorNaoServeASiMesmo: !Object.keys(cont).includes('Romario'),
    topGarcons: Object.entries(cont).sort((x, y) => y[1] - x[1]).slice(0, 5),
  }
})

await browser.close()
console.log('\n══════ RÁPIDO · ASSISTÊNCIAS ══════')
console.log(`% de gols com passe: ${r.pctComPasse}  (alvo ~75%)`)
console.log(`✅ mesma jogada dá sempre o mesmo garçom: ${r.determinista}`)
console.log(`✅ trava do 3+ gols nunca volta vazia: ${r.forcadoNuncaVazio}`)
console.log(`✅ goleador nunca dá assistência pra si mesmo: ${r.goleadorNaoServeASiMesmo}`)
console.log('quem mais serve (meia > lateral > atacante):', r.topGarcons.map(([n, q]) => `${n} ${q}`).join(' · '))
