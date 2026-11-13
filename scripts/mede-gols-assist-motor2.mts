// 📊 13/11 (reclamação de jogador: "meio-campo quase não dá assistência na carreira"). Mede, no MOTOR NOVO (jogos do seu time na
// carreira), quem faz os gols e quem dá as assistências por posição. Uso: npx tsx scripts/mede-gols-assist-motor2.mts 300 4-3-3 [bots]
// Depois do ajuste de 13/11 (300 jogos): 4-3-3 assist. MEI 44% · ATA 49% · gols MEI 9% — 4-4-2 assist. MEI 45% · gols MEI 7%. Antes: MEI 33% / 39%, gols 5% / 4%.
import { Motor2 } from '../src/escalacao/motor2/motor'
import { CATALOG, CATALOG_EU } from '../src/escalacao/data'
type C = { name: string; club: string; year: number; pos: string; fame: number; lo: number; hi: number }
const todas: C[] = [...Object.entries(CATALOG), ...Object.entries(CATALOG_EU)].flatMap(([pos, cs]) => (cs as C[]).map(c => ({ ...c, pos })))
function sorte(seed: number) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff } }
function time(seed: number, fames: number[], forma = '4-3-3'): C[] {
  const need: Record<string, Record<string, number>> = { '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 } }
  const r = sorte(seed), out: C[] = []
  for (const [pos, n] of Object.entries(need[forma])) { const pool = todas.filter(c => c.pos === pos && fames.includes(c.fame)); for (let i = 0; i < n; i++) out.push(pool[Math.floor(r() * pool.length)]) }
  return out
}
const N = +(process.argv[2] ?? 300), forma = process.argv[3] ?? '4-3-3', bots = process.argv[4] === 'bots'
const gol: Record<string, number> = {}, ast: Record<string, number> = {}; let semAst = 0, gols = 0
const porJog = new Map<string, { pos: string; g: number; a: number }>()
for (let s = 1; s <= N; s++) {
  const a = time(s * 7, [3, 4], forma), b = time(s * 13 + 1, [3, 4], forma)
  const m = new Motor2(s, a, b, false, [forma, forma], [0, 0], 'sol', [bots, bots], { criteriosCarreira: true } as never)
  m.avancaAte(96)
  const evs = (m as unknown as { eventos: { tipo: string; lado: number; a?: string; b?: string }[] }).eventos.filter(e => e.tipo === 'gol')
  for (const e of evs) {
    const t = e.lado === 0 ? a : b
    const g = t.find(c => c.name === e.a); if (!g) continue
    gols++; gol[g.pos] = (gol[g.pos] ?? 0) + 1
    const k = `${s}|${g.name}`
    if (e.b) { const as = t.find(c => c.name === e.b); if (as) ast[as.pos] = (ast[as.pos] ?? 0) + 1 } else semAst++
  }
}
const pct = (o: Record<string, number>, tot: number) => ['ATA', 'MEI', 'LAT', 'ZAG', 'GOL'].map(p => `${p} ${(100 * (o[p] ?? 0) / tot).toFixed(0)}%`).join(' · ')
const totA = Object.values(ast).reduce((x, y) => x + y, 0)
console.log(`${N} jogos ${forma}${bots ? ' (bots)' : ''} · ${gols} gols · ${(gols / N).toFixed(2)}/jogo · com assistência ${(100 * totA / gols).toFixed(0)}%`)
console.log('GOLS   ', pct(gol, gols))
console.log('ASSIST ', pct(ast, totA))
process.exit(0)
