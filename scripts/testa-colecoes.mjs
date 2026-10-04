// 📚 trava das COLEÇÕES DE CLUBES (04/10, regras do Diego): só clube com 11+ cartas vira coleção;
// fechar pede TODAS as cartas do clube; prêmio = soma do valor de todas, arredondada pra cima
// (Lenda 5 · Craque 3 · Promessa 2 · Bom 1 · Foi profissional 0,5); carta usada ou presa numa troca
// não conta; repetida não conta duas vezes.   npm run colecoes
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const m = await vite.ssrLoadModule('/src/escalacao/colecoes.ts')
  const { COLECOES, progressoDas, escolheCopias, chaveCarta, VALOR_CATEGORIA, MIN_CARTAS_CLUBE } = m
  assert.deepEqual(VALOR_CATEGORIA, { lenda: 5, craque: 3, promessa: 2, bom: 1, prof: 0.5 })
  assert.ok(COLECOES.every(c => c.cartas.length >= MIN_CARTAS_CLUBE), 'só clube com 11+ cartas')
  const real = COLECOES.find(c => c.clube === 'Real Madrid'), fla = COLECOES.find(c => c.clube === 'Flamengo')
  assert.ok(real && fla)
  for (const c of COLECOES) {
    const soma = c.cartas.reduce((s, x) => s + VALOR_CATEGORIA[m.categoriaDe(x)], 0)
    assert.equal(c.premio, Math.max(1, Math.ceil(soma)), `${c.clube}: prêmio = soma arredondada pra cima`)
  }
  assert.ok(!COLECOES.some(c => c.clube === 'Inter Miami'), 'Inter Miami (4 cartas) não é coleção')
  // fechar = TODAS as cartas
  const pen = COLECOES.find(c => c.clube === 'Peñarol')
  let id = 0
  const copia = (c, extra = {}) => ({ id: `x${id++}`, name: c.name, club: c.club, year: c.year, ...extra })
  const quase = pen.cartas.slice(0, pen.cartas.length - 1).map(c => copia(c))
  assert.equal(escolheCopias(quase, pen), null, 'faltando uma, não fecha')
  const cheio = [...quase, copia(pen.cartas.at(-1)), copia(pen.cartas[0])] // + a que faltava + 1 repetida
  const ids = escolheCopias(cheio, pen)
  assert.equal(ids.length, pen.cartas.length, 'usa UMA cópia de cada carta')
  const p = progressoDas(cheio).find(x => x.colecao.clube === 'Peñarol')
  assert.ok(p.pronta && p.livres === p.total && p.total === pen.cartas.length)
  // usada e presa não contam
  const usadas = cheio.map(c => ids.includes(c.id) ? { ...c, usadaEm: 'sim' } : c)
  const p2 = progressoDas(usadas).find(x => x.colecao.clube === 'Peñarol')
  assert.ok(!p2.pronta && p2.livres === 1 && p2.recebidas === 1, 'depois de receber: sobra só a repetida, recebida 1x')
  const presa = cheio.map((c, i) => i === 0 ? { ...c, presa: true } : c)
  assert.equal(escolheCopias(presa.filter(c => chaveCarta(c) !== chaveCarta(pen.cartas[0]) || c.presa), pen), null, 'carta presa numa troca não fecha')
  const total = COLECOES.reduce((s, c) => s + c.premio, 0)
  console.log(`✅ coleções: ${COLECOES.length} clubes · Real Madrid ${real.premio} · Flamengo ${fla.premio} · tudo ${total} moedas`)
} finally { await vite.close() }
