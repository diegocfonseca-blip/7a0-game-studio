// ─── 💸 O ELENCO CHEIO CABE NO BOLSO? (por divisão) ──────────────────────────
//
// Terceiro script da investigação de caixa (os outros dois são
// `sim-caixa-120.mjs` e `sim-caixa-divisoes.mjs`).
//
// 🔁 POR QUE ELE EXISTE: na primeira leitura eu disse pro Diego que o problema
// era a pessoa "completar o elenco com jogador bom cedo demais" — e comparei com
// **22 craques**, que NINGUÉM monta. Ele corrigiu na hora: *"mas não é bem assim…
// todo mundo quer ter elenco completo pô"*. Ele está certo: ter elenco completo é
// o comportamento NORMAL depois da condição física, não é erro de quem joga.
//
// Este script mede o elenco que as pessoas montam DE VERDADE: 11 titulares no
// nível que a divisão negocia + 11 reservas mais em conta. E o veredito muda:
// **elenco cheio dá positivo em TODAS as divisões** — ninguém quebra.
//
// O que ele revela de verdade é outra coisa: a margem ENCOLHE conforme se sobe
// (Várzea +43 · D +56 · C +34 · B +24 · **A +7**). Na Série A, um time de meio de
// tabela com elenco completo sobra SETE moedas por temporada — e um ano ruim
// (zona de rebaixamento) joga isso pra −80.
//
// E a causa fica clara na conta da Série A: folha 132 · renovações 128.
// 👉 **A RENOVAÇÃO É UM SEGUNDO SALÁRIO ESCONDIDO.** A pessoa lê "salário 8" na
// ficha, mas renovar 5 anos custa metade do preço da carta — outros ~8 por
// temporada. Cada jogador custa o DOBRO do que está escrito, e isso não aparece
// em lugar nenhum da tela.
//
// Roda com o vite de pé:  node scripts/custo-elenco-cheio.mjs
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173/7a0-game-studio/bench-sim.html'
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)

const r = await page.evaluate(async () => {
  const B = '/7a0-game-studio/src/escalacao/'
  await import(B + 'screens.tsx')   // 🔁 quebra o ciclo de import (ver sim-caixa-120)
  const { renewCost } = await import(B + 'store.tsx')

  const sal = p => Math.round(p / 10)                      // salário REAL do jogo: preço ÷ 10
  /** custo de UMA temporada: folha + renovações (≈1/5 do elenco vence por ano,
   *  porque os contratos são de ~5 temporadas). `descontoReserva` é a simulação
   *  da ideia "reserva paga menos" — 1 = como é hoje. */
  const custo = (tit, res, nTit, nRes, descontoReserva = 1, fatorRenov = 0.5) => {
    const folha = nTit * sal(tit) + nRes * Math.round(sal(res) * descontoReserva)
    // o renewCost REAL usa metade do preço nos 5 anos; `fatorRenov` deixa testar
    // baratear isso sem mexer no jogo
    const rc = p => (fatorRenov === 0.5 ? renewCost(p, 5) : Math.max(1, Math.ceil(p * fatorRenov)))
    const renov = Math.round((nTit / 5) * rc(tit) + (nRes / 5) * rc(res))
    return { folha, renov, total: folha + renov }
  }

  // preço típico da carta que cada divisão negocia (degrau da escada) e do reserva
  const TIT = { V: 8, D: 14, C: 30, B: 45, A: 80 }
  const RES = { V: 5, D: 8, C: 15, B: 22, A: 35 }
  const out = {}
  for (const d of ['V', 'D', 'C', 'B', 'A']) {
    out[d] = {
      precoTit: TIT[d], precoRes: RES[d],
      so11: custo(TIT[d], 0, 11, 0),
      cheio18: custo(TIT[d], RES[d], 11, 7),
      cheio22: custo(TIT[d], RES[d], 11, 11),
      // ── as saídas medidas (nenhuma implementada; é decisão do Diego)
      cheio22_reservaMeioSalario: custo(TIT[d], RES[d], 11, 11, 0.5),
      cheio22_renovacaoUmTerco: custo(TIT[d], RES[d], 11, 11, 1, 1 / 3),
      cheio22_asDuas: custo(TIT[d], RES[d], 11, 11, 0.5, 1 / 3),
      // o cenário que eu usei ERRADO na 1ª leitura, guardado só como referência
      tudoCraque22: custo(TIT[d], TIT[d], 11, 11),
    }
  }
  return out
})

const NOME = { V: 'Várzea', D: 'Série D', C: 'Série C', B: 'Série B', A: 'Série A' }
// receita de um time no MEIO da tabela com o estádio meio construído
// (medida por `sim-caixa-divisoes.mjs` — repetida aqui pra o script falar sozinho)
const RECEITA = { V: 80, D: 102, C: 140, B: 176, A: 267 }
console.log('\nSOBRA POR TEMPORADA (receita − folha − renovações) · negativo = afundando\n')
console.log('divisão    receita |   só 11  18 cheio  22 CHEIO | reserva½  renov⅓  as duas')
for (const d of ['V', 'D', 'C', 'B', 'A']) {
  const x = r[d], rec = RECEITA[d]
  const s = k => String(rec - x[k].total).padStart(7)
  console.log(`${NOME[d].padEnd(10)} ${String(rec).padStart(7)} | ${s('so11')} ${s('cheio18').padStart(8)} ${s('cheio22').padStart(9)} |${s('cheio22_reservaMeioSalario').padStart(9)}${s('cheio22_renovacaoUmTerco').padStart(8)}${s('cheio22_asDuas').padStart(9)}`)
}
console.log('\nA conta de cada divisão com 22 jogadores:')
for (const d of ['V', 'D', 'C', 'B', 'A']) {
  const x = r[d]
  console.log(`  ${NOME[d]}: titular ${x.precoTit} · reserva ${x.precoRes} → folha ${x.cheio22.folha} + renovações ${x.cheio22.renov} = ${x.cheio22.total}`)
}
await browser.close()
