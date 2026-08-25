// ─── 🧮 O PLACAR DO CARD BATE COM O JOGO? (bug do Diego 25/08) ──────────────
//
// Palavras dele: *"eu percebi q o placar q tava estranho mas os gols contava
// certo"*. Ele estava certo, e a causa é de tela, não de motor: desde 24/08 a
// lista de LANCES do jogo passou a levar também a ASSISTÊNCIA, e quem monta o
// card contava CADA lance como um gol. Como ~75% dos gols têm passe, um 5x0 de
// verdade virava ~9x0 na tela — enquanto tabela e artilharia seguiam certas.
//
// Este script compara, no motor de verdade, três placares do MESMO jogo:
//   • REAL      — o que o motor devolve (hg × ag), que é o que vai pra tabela;
//   • ANTES     — contando TODO lance (o jeito quebrado);
//   • DEPOIS    — contando só lance de gol (o conserto: `kind !== 'assist'`).
//
//   npm run dev  (noutro terminal)  ·  node scripts/checa-placar-card.mjs
import { chromium } from 'playwright-core'
import { writeFileSync, existsSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '6'))
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')
if (!existsSync('bench-sim.html')) writeFileSync('bench-sim.html', '<!doctype html><meta charset="utf-8"><title>bench</title><body>b</body>')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const r = await page.evaluate(async ([TEMPS]) => {
  const S = await import('/7a0-game-studio/src/escalacao/store.tsx')
  const D = await import('/7a0-game-studio/src/escalacao/data.ts')
  const { reducer, INITIAL } = S

  const porPos = {}
  for (const p of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
    porPos[p] = D.CATALOG[p].map(c => ({ ...c, pos: p })).sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))
  }
  const XI = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
  const cursor = { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 }
  const squads = [[], [], [], []]
  for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
    for (let n = 0; n < XI[pos]; n++) for (let i = 0; i < 4; i++) {
      const c = porPos[pos][cursor[pos]++]
      if (c) squads[i].push({ ...c, id: `${c.name}-${i}-${n}` })
    }
  }
  const managers = squads.map((sq, i) => ({
    id: i, name: `Jogador ${i + 1}`, teamName: `Time ${i + 1}`, isHuman: true, auctionRival: false,
    formation: '4-3-3', money: 100, squad: sq,
  }))

  const soGol = hl => (hl.kind ? hl.kind !== 'assist' : !hl.text.startsWith('🅰️'))
  let jogos = 0, batiaAntes = 0, batiaDepois = 0, infladoTotal = 0, piorAntes = null
  // 🔁 O SINTOMA QUE O DIEGO DESCREVEU: *"apareceu do nada 8x0 e depois tava 4"*.
  // Na linha do chaveamento da Copa, enquanto o relógio corre o placar conta os
  // LANCES; no apito ele troca pelo agregado de verdade. Se os lances inflam, o
  // número SOBE e depois VOLTA. Aqui eu meço isso: o maior placar que a tela chega
  // a mostrar durante o jogo contra o placar final.
  let voltouAntes = 0, voltouDepois = 0, piorVolta = null

  for (let t = 0; t < TEMPS; t++) {
    let st = {
      ...INITIAL, seed: (777000 + t * 7919) >>> 0, sport: 'futebol', onlineMode: 'online',
      careerOnline: false, screen: 'cerimonia',
      managers: managers.map(m => ({ ...m, squad: m.squad.map(c => ({ ...c })) })),
    }
    st = reducer(st, { type: 'FINISH_CEREMONY' })
    for (let r2 = 0; r2 < st.fixtures.length; r2++) {
      st = reducer(st, { type: 'PLAY_ROUND' })
      for (const res of st.lastResults ?? []) {
        if (!res.highlights || res.highlights.length === 0) continue // só o jogo do humano guarda lances
        jogos++
        const conta = (filtro) => {
          let h = 0, a = 0
          for (const hl of res.highlights) { if (filtro && !soGol(hl)) continue; if (hl.teamId === res.homeId) h++; else a++ }
          return [h, a]
        }
        const [ah, aa] = conta(false)
        const [dh, da] = conta(true)
        if (ah === res.hg && aa === res.ag) batiaAntes++
        if (dh === res.hg && da === res.ag) batiaDepois++
        // pico do placar durante o jogo (o relógio anda 0→93 e vai contando lances)
        const pico = (filtro) => {
          let h = 0, a = 0
          for (const hl of res.highlights) { if (filtro && !soGol(hl)) continue; if (hl.teamId === res.homeId) h++; else a++ }
          return [h, a] // no fim do relógio todos os lances já entraram: este É o pico
        }
        const [ph, pa] = pico(false), [qh, qa] = pico(true)
        if (ph > res.hg || pa > res.ag) {
          voltouAntes++
          const queda = (ph + pa) - (res.hg + res.ag)
          if (!piorVolta || queda > piorVolta.queda) piorVolta = { subiu: `${ph}x${pa}`, real: `${res.hg}x${res.ag}`, queda }
        }
        if (qh > res.hg || qa > res.ag) voltouDepois++
        const inflado = (ah + aa) - (res.hg + res.ag)
        infladoTotal += inflado
        if (!piorAntes || inflado > piorAntes.inflado) piorAntes = { real: `${res.hg}x${res.ag}`, antes: `${ah}x${aa}`, depois: `${dh}x${da}`, inflado }
      }
    }
  }
  return { jogos, batiaAntes, batiaDepois, mediaInflada: +(infladoTotal / (jogos || 1)).toFixed(2), piorAntes, voltouAntes, voltouDepois, piorVolta }
}, [TEMPS])

await browser.close()
console.log('\n══════ O PLACAR DO CARD BATE COM O JOGO? ══════')
console.log(`jogos do humano conferidos: ${r.jogos}`)
console.log(`❌ ANTES  (todo lance vira gol): batia em ${(r.batiaAntes * 100 / r.jogos).toFixed(1)}% dos jogos`)
console.log(`✅ DEPOIS (só lance de gol):     batia em ${(r.batiaDepois * 100 / r.jogos).toFixed(1)}% dos jogos`)
console.log(`gols a MAIS que a tela mostrava, por jogo: ${r.mediaInflada}`)
if (r.piorAntes) console.log(`pior caso visto: jogo real ${r.piorAntes.real} · tela ANTES ${r.piorAntes.antes} · tela DEPOIS ${r.piorAntes.depois}`)
console.log('\n── o "SOBE E VOLTA" do chaveamento da Copa ──')
console.log(`❌ ANTES:  o placar subia acima do real em ${(r.voltouAntes * 100 / r.jogos).toFixed(1)}% dos jogos (e "voltava" no apito)`)
console.log(`✅ DEPOIS: ${(r.voltouDepois * 100 / r.jogos).toFixed(1)}%`)
if (r.piorVolta) console.log(`pior queda vista: subia até ${r.piorVolta.subiu} e voltava pro real ${r.piorVolta.real}`)
