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
  assert.ok(COLECOES.every(c => c.especial || c.cartas.length >= MIN_CARTAS_CLUBE), 'só clube com 11+ cartas (fora a especial)')
  let id = 0
  const copia = (c, extra = {}) => ({ id: `x${id++}`, name: c.name, club: c.club, year: c.year, ...extra })
  const real = COLECOES.find(c => c.clube === 'Real Madrid'), fla = COLECOES.find(c => c.clube === 'Flamengo')
  assert.ok(real && fla)
  for (const c of COLECOES) {
    const soma = c.cartas.reduce((s, x) => s + VALOR_CATEGORIA[m.categoriaDe(x)], 0)
    assert.equal(c.premio, Math.max(1, Math.ceil(soma)), `${c.clube}: prêmio = soma arredondada pra cima`)
  }
  // clube com menos de 11 cartas fica no Diversos; com 11+ vira coleção sozinho (Inter Miami virou no Lote 42)
  const porClube = new Map(); for (const c of m.BARALHO_TODO) { const k = m.clubeColecao(c.club); porClube.set(k, (porClube.get(k) ?? 0) + 1) }
  for (const [clube, n] of porClube) assert.equal(COLECOES.some(c => !c.especial && c.clube === clube), n >= MIN_CARTAS_CLUBE, `${clube} (${n} cartas)`)
  // 🌟 Lendas Avulsas: só lenda de clube que NÃO é coleção, 5 por lenda, todas juntas
  const esp = COLECOES.find(c => c.especial)
  const clubesCol = new Set(COLECOES.filter(c => !c.especial).map(c => c.clube))
  const esperadas = m.BARALHO_TODO.filter(c => !clubesCol.has(m.clubeColecao(c.club)) && m.categoriaDe(c) === 'lenda')
  assert.ok(esp && esp.cartas.length === esperadas.length && esp.premio === 5 * esperadas.length, 'Lendas Avulsas = lendas sem coleção, 5 cada')
  assert.ok(esp.cartas.every(c => m.categoriaDe(c) === 'lenda'))
  const doEsp = esp.cartas.map(c => copia(c)); const idsEsp = escolheCopias(doEsp, esp)
  assert.equal(idsEsp?.length, esp.cartas.length, 'fecha as Lendas Avulsas com uma de cada')
  assert.equal(escolheCopias(doEsp.slice(1), esp), null, 'faltando uma lenda, não fecha')
  assert.ok(COLECOES.some(c => c.clube === 'Inter Miami'), 'Inter Miami virou coleção com o Lote 42')
  assert.ok(COLECOES.find(c => c.clube === 'Leicester')?.cartas.some(c => c.club === 'Leicester City'), 'Leicester City (Mahrez) conta no Leicester')
  // fechar = TODAS as cartas
  const pen = COLECOES.find(c => c.clube === 'Peñarol')
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
  // 🎲 sorteio: lenda mais rara (antes ~9%), soma das chances = 100, pode repetir
  const { sorteiaCarta, CHANCE_CATEGORIA, BARALHO_TODO, categoriaDe } = m
  assert.equal(Object.values(CHANCE_CATEGORIA).reduce((a, b) => a + b, 0), 100)
  let semente = 7; const rng = () => (semente = (semente * 16807) % 2147483647) / 2147483647
  const conta = {}; for (let i = 0; i < 20000; i++) { const k = categoriaDe(sorteiaCarta(BARALHO_TODO, rng)); conta[k] = (conta[k] ?? 0) + 1 }
  const pct = k => 100 * (conta[k] ?? 0) / 20000
  assert.ok(pct('lenda') > 3 && pct('lenda') < 5, `lenda ~4% (deu ${pct('lenda').toFixed(1)}%)`)
  assert.ok(pct('bom') > 55 && pct('bom') < 61, `bom jogador ~58% (deu ${pct('bom').toFixed(1)}%)`)
  const total = COLECOES.reduce((s, c) => s + c.premio, 0)
  console.log(`✅ coleções: ${COLECOES.length} clubes · Real Madrid ${real.premio} · Flamengo ${fla.premio} · tudo ${total} moedas · sorteio: lenda ${pct('lenda').toFixed(1)}%`)
} finally { await vite.close() }
