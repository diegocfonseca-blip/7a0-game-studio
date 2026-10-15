// 💰 trava da ECONOMIA DOS BOTS (13/10): o bot ganha TV + bilheteria pela divisão, paga a folha,
// e não acumula infinito (o que passa do teto da divisão vira obra). Simula 60 temporadas.
//   npm run econ-bots
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const S = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const { balancoBot, folhaDoBot, BOT_CAIXA_TETO, TV_COTA, BOT_BILHETERIA } = S
  // TV igual à do humano, bilheteria pela divisão
  const a = balancoBot('A', 20, 250)
  assert.equal(a.tv, TV_COTA.A); assert.equal(a.bilheteria, BOT_BILHETERIA.A); assert.equal(a.saldo, 50 + 40 - 20); assert.equal(a.caixa, 320)
  // folha maior que a renda → caixa desce, nunca abaixo de zero
  assert.equal(balancoBot('V', 40, 10).caixa, 0)
  // teto: quem passa vira obra; quem já estava acima (save antigo) não perde nada
  assert.equal(balancoBot('D', 0, 290).caixa, BOT_CAIXA_TETO.D)
  assert.equal(balancoBot('D', 0, 2000).caixa, 2000, 'save antigo acima do teto não é cortado')
  assert.equal(balancoBot('D', 60, 2000).caixa, 2000 + 20 + 12 - 60, 'mas paga a folha normalmente')
  // folha: fake e Várzea não pagam; o resto paga o maior entre o pago e a tabela, ÷ 10
  const lenda = { name: 'X', club: 'Milan', fame: 5, pos: 'MEI', paid: 0 }
  const caro = { name: 'Y', club: 'Milan', fame: 3, pos: 'ATA', paid: 70 }
  const fake = { name: 'Z', club: 'Várzea', fame: 1, pos: 'ZAG', fake: true, paid: 50 }
  assert.equal(folhaDoBot([lenda, caro, fake]), 3 + 7)
  assert.equal(folhaDoBot(undefined), 0)
  // emprestado não entra na folha do bot: a regra do empréstimo (metade pra cada lado) já cobra
  assert.equal(folhaDoBot([lenda, { ...caro, emprestado: true }]), 3, 'emprestado fora da folha (senão a SAF pagava 2×)')
  // 60 temporadas: nenhuma divisão passa do teto, e a Série A chega nele em menos de 15
  for (const d of ['V', 'D', 'C', 'B', 'A']) {
    let c = 100, chegou = null
    for (let t = 1; t <= 60; t++) { c = balancoBot(d, 15, c).caixa; if (chegou === null && c >= BOT_CAIXA_TETO[d]) chegou = t; assert.ok(c <= Math.max(100, BOT_CAIXA_TETO[d])) }
    console.log(`  ${d}: caixa depois de 60 temporadas = ${c}${chegou ? ` (bateu o teto na ${chegou}ª)` : ''}`)
  }
  console.log('✅ economia dos bots: TV + bilheteria − folha, sem acumular infinito, save antigo intacto')
} finally { await vite.close() }
