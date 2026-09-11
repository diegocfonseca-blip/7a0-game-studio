// 🧪 GUARDA DOS PÊNALTIS: o placar tem que existir no futebol e as bolinhas
// têm que fechar com o placar. Nasceu do erro que o Diego pegou na Copa do
// Mundo online (11/09/2026): o placar era SORTEADO, saía 5×2 (que não existe),
// e a tela desenhava outra coisa — "cobranças acabando antes da hora".
//
//   node scripts/checa-penaltis.mjs
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import assert from 'node:assert/strict'

const exports = {}
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('src/escalacao/penaltis.ts', 'utf8'),
    { compilerOptions: { module: 1, target: 9 } }).outputText, { exports })
const { disputaPenaltis, sequenciaPenaltis } = exports

// gerador simples e repetível
const mk = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }

// ── 1. todo placar que sai da disputa EXISTE no futebol ────────────────────
// (regra: a disputa para quando quem está atrás não alcança mais)
function possivel(a, b) {
  if (a === b) return false
  if (Math.max(a, b) > 5) return Math.abs(a - b) === 1 // morte súbita
  // reencena: com 5 cobranças e parada, checa se existe ordem que dá esse placar
  const vence = a > b ? 0 : 1
  const alvo = [a, b]
  const combos = (n) => { const r = []; for (let m = 0; m < 32; m++) r.push([0, 1, 2, 3, 4].map(i => !!(m & (1 << i)))); return r.filter(x => x.filter(Boolean).length === n) }
  for (const pa of combos(a)) for (const pb of combos(b)) {
    const plan = [pa, pb], gols = [0, 0], cob = [0, 0]
    let parou = false
    outer: for (let r = 0; r < 5; r++) for (const s of [0, 1]) {
      const ok = plan[s][r]; cob[s]++; if (ok) gols[s]++
      if (gols[0] + (5 - cob[0]) < gols[1] || gols[1] + (5 - cob[1]) < gols[0]) { parou = true; break outer }
    }
    if (gols[0] === alvo[0] && gols[1] === alvo[1] && (parou || (gols[0] !== gols[1]))) {
      if ((gols[vence] > gols[1 - vence])) return true
    }
  }
  return false
}

const vistos = new Map()
for (let i = 0; i < 40000; i++) {
  const [a, b] = disputaPenaltis(mk(i + 1))
  assert.notEqual(a, b, `saiu empate ${a}×${b}`)
  assert.ok(possivel(a, b), `placar impossível no futebol: ${a}×${b}`)
  vistos.set(`${a}x${b}`, (vistos.get(`${a}x${b}`) ?? 0) + 1)
}

// ── 2. as bolinhas SEMPRE fecham com o placar ──────────────────────────────
for (const chave of vistos.keys()) {
  const [a, b] = chave.split('x').map(Number)
  for (let s = 0; s < 30; s++) {
    const seq = sequenciaPenaltis([a, b], mk(s + 7))
    const soma = [0, 0]
    for (const k of seq) if (k.ok) soma[k.side]++
    assert.equal(soma[0], a, `bolinhas do A não fecham em ${a}×${b}: ${soma[0]}`)
    assert.equal(soma[1], b, `bolinhas do B não fecham em ${a}×${b}: ${soma[1]}`)
    // ninguém cobra mais de 5 (fora morte súbita) nem mais que o vencedor
    const cob = [0, 0]; for (const k of seq) cob[k.side]++
    assert.ok(cob[0] <= Math.max(5, a, b) && cob[1] <= Math.max(5, a, b), `cobranças demais em ${a}×${b}`)
  }
}
// morte súbita comprida também tem que desenhar certo
for (const [a, b] of [[6, 5], [5, 6], [7, 6], [9, 8]]) {
  const seq = sequenciaPenaltis([a, b])
  const soma = [0, 0]; for (const k of seq) if (k.ok) soma[k.side]++
  assert.equal(soma[0], a); assert.equal(soma[1], b)
}
console.log('PASS placares possíveis (%d combinações) e bolinhas fechando com o placar', vistos.size)
console.log('   distribuição:', [...vistos.entries()].sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k}:${n}`).join(' '))
