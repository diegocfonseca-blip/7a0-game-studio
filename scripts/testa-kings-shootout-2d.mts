// 👑🥅 TRAVA DO SHOOTOUT DA KINGS NO CAMPINHO 2D (11/11): a cena segue a disputa JÁ decidida (o placar das bolinhas bate com o
// guardado), todo batedor sai do MEIO-CAMPO com a bola, o goleiro só sai da linha depois do apito, ninguém sai do campo e a cena acaba.
// Rodar: npx tsx scripts/testa-kings-shootout-2d.mts
import { DisputaShootoutCampo } from '../src/escalacao/campo2d-shootout'
import type { Atleta } from '../src/escalacao/campo2d-motor'
let falhas = 0
const falha = (m: string) => { falhas++; console.log('❌ ' + m) }
const elenco = (t: string) => [{ name: `${t} Goleiro`, pos: 'GOL', lo: 70, hi: 80 }, ...['ZAG', 'ZAG', 'MEI', 'MEI', 'ATA', 'ATA'].map((p, i) => ({ name: `${t} ${p}${i}`, pos: p, lo: 70, hi: 80 }))]
const atletas = (): Atleta[] => [0, 1].flatMap(l => elenco(l ? 'B' : 'A').map((c, i) => ({ lado: l as 0 | 1, nome: c.name, estilo: 'normal', golpes: [], pe: null, grupo: i === 0 ? 'GOL' : 'MEI', bx: 34, dep: .5, x: 34, y: 52, ov: null } as unknown as Atleta)))
const casos: [number, number][] = [[5, 4], [3, 2], [4, 5], [6, 5], [2, 3], [7, 8]]
for (const pens of casos) {
  const d = new DisputaShootoutCampo({ id: 't', pens, aName: 'A', bName: 'B', aSquad: elenco('A'), bSquad: elenco('B'), shootout: true })
  d.preparar(atletas(), { x: 34, y: 52 })
  let fim = d.estado
  let meioOk = 0, cobr = 0, golLinhaAntes = true
  const vistoNoMeio = new Set<number>()
  for (let t = 0; t <= d.duracaoCena + 0.5; t += 1 / 30) {
    d.avancar(1 / 30)
    const q = d.quadro(), e = d.estado
    if (!q) continue
    for (const p of q.jogadores) if (p.x < -3 || p.x > 71 || p.y < -3 || p.y > 108) falha(`jogador fora do campo ${JSON.stringify(p)} em ${pens}`)
    if (e.fase === 'preparar' && q.batedor >= 0) { const b = q.jogadores[q.batedor]; if (Math.hypot(b.x - 34, b.y - 52.5) < 1.5) vistoNoMeio.add(e.cobranca) }
    if (e.fase === "preparar" && q.goleiro >= 0 && q.jogadores[q.goleiro].y > 1.5) golLinhaAntes = false
    fim = e
  }
  cobr = d.seq.length; meioOk = vistoNoMeio.size
  if (!fim.encerrado) falha(`${pens}: a cena não acabou`)
  if (fim.placar[0] !== pens[0] || fim.placar[1] !== pens[1]) falha(`${pens}: o placar da cena (${fim.placar}) não bate`)
  if (meioOk !== cobr) falha(`${pens}: só ${meioOk}/${cobr} batedores saíram do meio-campo`)
  if (!golLinhaAntes) falha(`${pens}: o goleiro saiu da linha antes do apito`)
}
if (falhas) { console.log(`🔴 ${falhas} falha(s)`); process.exit(1) }
console.log('🟢 shootout da Kings no campinho: placar bate, todo batedor sai do meio, goleiro na linha até o apito, cena acaba')
