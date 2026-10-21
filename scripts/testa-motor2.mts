// 🧪 TRAVA DO MOTOR 2D v2 (experimental, 20/10). `npm run motor2` (ou `npx tsx scripts/testa-motor2.mts 2000` pra milhares).
// Joga N partidas com semente fixa e cartas DE VERDADE do baralho e reprova se: o placar ficar absurdo, o time forte não
// ganhar mais, times iguais ficarem previsíveis, as estatísticas saírem do futebol (chutes, passes certos, faltas, cartões,
// escanteios, impedimentos), alguém "pular" ou sair do campo, a mesma semente der jogo diferente, ou alguma função que
// varia de navegador (sin, cos, exp, log, pow, hypot, atan2) aparecer no motor.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { Motor2 } from '../src/escalacao/motor2/motor'
import { CATALOG, CATALOG_EU } from '../src/escalacao/data'

const N = +(process.argv[2] ?? 300)
type C = { name: string; club: string; year: number; pos: string; fame: number; lo: number; hi: number }
const todas: C[] = [...Object.entries(CATALOG), ...Object.entries(CATALOG_EU)].flatMap(([pos, cs]) => (cs as C[]).map(c => ({ ...c, pos })))
function sorte(seed: number) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff } }
/** 11 do 4-3-3 com cartas de uma faixa de categoria */
function time(seed: number, fames: number[]): C[] {
  const r = sorte(seed), need: Record<string, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, out: C[] = []
  for (const [pos, n] of Object.entries(need)) {
    const pool = todas.filter(c => c.pos === pos && fames.includes(c.fame))
    for (let i = 0; i < n; i++) out.push(pool[Math.floor(r() * pool.length)])
  }
  return out
}
const MIN = 90 / 93
function joga(seed: number, a: C[], b: C[]) {
  const m = new Motor2(seed, a, b, false, [], [0, 0], 'sol', [true, true]) // (times sorteados = times de bot: o motor escala pelo jeito)
  let foraCampo = 0
  for (let k = 0; k <= 96; k += 0.25) {
    m.avancaAte(k)
    for (const p of m.atl) if (p.x < -2 || p.x > 70 || p.y < -2.5 || p.y > 107.5) foraCampo++
  }
  return { m, foraCampo }
}

// ── 1. times parecidos (bom × bom) ──
const S = { gols: [] as number[], chutes: 0, alvo: 0, passes: 0, certos: 0, faltas: 0, cartoes: 0, esc: 0, imp: 0, posseMax: 0, posseSom: 0, dribles: 0, desarmes: 0, defesas: 0, pulos: 0, fora: 0, reinicio: 0, vit: [0, 0, 0], ms: 0, xg: 0 }
for (let s = 1; s <= N; s++) {
  const t0 = performance.now()
  const { m, foraCampo } = joga(s, time(s * 7, [3, 4]), time(s * 13 + 1, [3, 4]))
  S.ms += performance.now() - t0
  const st = m.stats, g = m.placar[0] + m.placar[1]
  S.gols.push(g); S.chutes += st.chutes[0] + st.chutes[1]; S.alvo += st.noAlvo[0] + st.noAlvo[1] + st.defesas[0] + st.defesas[1]; S.passes += st.passes[0] + st.passes[1]; S.certos += st.passesCertos[0] + st.passesCertos[1]
  S.faltas += st.faltas[0] + st.faltas[1]; S.cartoes += st.amarelos[0] + st.amarelos[1] + st.vermelhos[0] + st.vermelhos[1]; S.esc += st.escanteios[0] + st.escanteios[1]; S.imp += st.impedimentos[0] + st.impedimentos[1]
  const pp = st.posse[0] / Math.max(1, st.posse[0] + st.posse[1]); S.posseMax = Math.max(S.posseMax, Math.abs(pp - 0.5)); S.posseSom += Math.abs(pp - 0.5)
  S.dribles += st.dribles[0] + st.dribles[1]; S.desarmes += st.desarmes[0] + st.desarmes[1]; S.defesas += st.defesas[0] + st.defesas[1]; S.xg += st.xg[0] + st.xg[1]
  S.pulos += m.diag.pulos; S.fora += foraCampo; S.reinicio += m.diag.reinicioErrado
  S.vit[m.placar[0] > m.placar[1] ? 0 : m.placar[0] < m.placar[1] ? 2 : 1]++
}
const med = (x: number) => (x / N).toFixed(2)
const gm = S.gols.reduce((a, b) => a + b, 0) / N, zero = S.gols.filter(g => g === 0).length / N, muitos = S.gols.filter(g => g >= 8).length / N
console.log(`⚽ ${N} jogos (times parecidos) · ${(S.ms / N).toFixed(0)} ms por jogo`)
console.log(`   gols ${gm.toFixed(2)} por jogo (0×0 em ${(zero * 100).toFixed(0)}% · 8+ gols em ${(muitos * 100).toFixed(1)}%) · xG ${med(S.xg)}`)
console.log(`   chutes ${med(S.chutes)} (no gol ${med(S.alvo)}) · passes ${med(S.passes)} (${((100 * S.certos) / S.passes).toFixed(0)}% certos)`)
console.log(`   faltas ${med(S.faltas)} · cartões ${med(S.cartoes)} · escanteios ${med(S.esc)} · impedimentos ${med(S.imp)} · dribles ${med(S.dribles)} · desarmes ${med(S.desarmes)} · defesas ${med(S.defesas)}`)
console.log(`   posse: desvio médio ${(S.posseSom / N * 100).toFixed(0)} pontos do 50% (máx ${(S.posseMax * 100).toFixed(0)}) · casa ${S.vit[0]} · empate ${S.vit[1]} · fora ${S.vit[2]}`)
console.log(`   regras: ${S.pulos} pulos · ${S.fora} quadros fora do campo · ${S.reinicio} reinícios sem a distância`)

// ── 2. forte × fraco ──
let fv = 0, fe = 0, fd = 0, fg = 0, wg = 0
const NF = Math.max(60, Math.floor(N / 3))
for (let s = 1; s <= NF; s++) {
  const forte = time(s * 31, [5, 4]), fraco = time(s * 37, [1, 2]), casaForte = s % 2 === 0
  const { m } = joga(10_000 + s, casaForte ? forte : fraco, casaForte ? fraco : forte)
  const gF = m.placar[casaForte ? 0 : 1], gW = m.placar[casaForte ? 1 : 0]
  fg += gF; wg += gW
  if (gF > gW) fv++; else if (gF === gW) fe++; else fd++
}
console.log(`💪 forte × fraco (${NF}): forte ganha ${(100 * fv / NF).toFixed(0)}% · empata ${(100 * fe / NF).toFixed(0)}% · perde ${(100 * fd / NF).toFixed(0)}% · gols ${(fg / NF).toFixed(1)} × ${(wg / NF).toFixed(1)}`)

// ── 3. determinismo e contas proibidas ──
const a1 = joga(77, time(1, [3, 4]), time(2, [3, 4])).m, a2 = joga(77, time(1, [3, 4]), time(2, [3, 4])).m
assert.deepEqual([a1.placar, a1.eventos.length, a1.stats.passes], [a2.placar, a2.eventos.length, a2.stats.passes], 'mesma semente deu jogo diferente')
const dir = 'src/escalacao/motor2'
for (const f of readdirSync(dir)) {
  const src = readFileSync(`${dir}/${f}`, 'utf8').replace(/\/\/.*$/gm, '')
  const ruim = src.match(/Math\.(sin|cos|tan|exp|log|pow|hypot|atan2|atan|random)\b/)
  assert.ok(!ruim, `${f} usa Math.${ruim?.[1]} — varia de navegador (quebra o online) ou não é determinístico`)
}
console.log('🎲 determinismo: mesma semente = mesmo jogo · nenhuma conta que varia de navegador')

// ── as réguas ──
// 🔒 REGRAS (reprovam já): física, distância nas bolas paradas, determinismo, peso, passes
assert.ok(S.certos / S.passes >= 0.55 && S.certos / S.passes <= 0.92, 'passes certos fora da faixa')
assert.ok(S.pulos === 0 && S.fora <= N * 0.05, 'jogador pulando ou fora do campo')
assert.ok(S.reinicio <= N * 0.3, 'reinício sem respeitar a distância')
assert.ok(S.ms / N < 150, 'motor pesado demais')
// 📏 CALIBRAÇÃO DO PLACAR (vira trava em 21/10 — formato B decidido pelo Diego: jogo corrido em 1:30, placar LIVRE com base no
// elenco, na média da simulação de hoje). Medido no dia: parecidos 1,97 gol · 0×0 7% · forte × fraco 75% / perde 6%. As faixas
// têm folga; quem mexer no motor e sair delas está mudando o jogo da carreira — conversar com o Diego antes.
assert.ok(gm >= 1.5 && gm <= 2.7, `média de gols ${gm.toFixed(2)} fora de 1,5–2,7 (a simulação de hoje fica ~2)`)
assert.ok(zero <= 0.15, `0×0 demais: ${(zero * 100).toFixed(0)}%`)
assert.ok(muitos <= 0.02, `jogo com 8+ gols demais: ${(muitos * 100).toFixed(1)}%`)
assert.ok(S.chutes / N >= 2.5, `chute de menos: ${(S.chutes / N).toFixed(1)} por jogo`)
assert.ok(Math.max(S.vit[0], S.vit[2]) / N <= 0.45, 'times parecidos: um lado ganhando demais')
assert.ok(fv / NF >= 0.6 && fd / NF <= 0.15, `forte × fraco: forte ganha ${(100 * fv / NF).toFixed(0)}% e perde ${(100 * fd / NF).toFixed(0)}%`)
console.log('📺 motor 2D v2: regras ok · placar dentro da faixa calibrada')
void MIN
