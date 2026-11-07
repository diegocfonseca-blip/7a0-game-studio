// 🥅 TRAVA DA DISPUTA DE PÊNALTIS NO CAMPINHO 2D (07/11)
// Pedido do Diego: em QUALQUER modo e competição com disputa de pênaltis, com o 📺 2D ligado, a disputa é no campinho —
// times perfilados no círculo central, o batedor vai até a marca, bate e volta pra fila sem trombar com ninguém, e o placar
// da disputa sincronizado. Esta trava confere três coisas:
//   1. TODO lugar do jogo com disputa e 2D usa a cena (leitura do código);
//   2. a sequência é IDÊNTICA em dois aparelhos (só sai do resultado guardado: nada de sorteio local);
//   3. NINGUÉM SE CRUZA: jogadores, árbitro e auxiliares, quadro a quadro, em ritmo natural e acelerado (sala online).
//
//   npm run penaltis-2d
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { DisputaPenaltisCampo, TEMPO_PENALTIS_CAMPO as T, type ConfigPenaltisCampo } from '../src/escalacao/campo2d-penaltis'
import { Jogo2D } from '../src/escalacao/campo2d-motor'
import { disputaPenaltisComSequencia } from '../src/escalacao/penaltis'

const falhas: string[] = []
const ok = (c: unknown, msg: string) => { if (!c) falhas.push(msg) }

// ── 1. COBERTURA: todo lugar com disputa de pênaltis + 2D liga a cena ─────────────────────────────────────────────
const ler = (f: string) => fs.readFileSync(f, 'utf8')
const lugares: { nome: string; arquivo: string; tem: (RegExp | string)[] }[] = [
  { nome: 'Copa da carreira (Copa do Brasil/Legends, Supercopa)', arquivo: 'src/escalacao/pyramidseason.tsx', tem: ['const c2dCopa = useCampo2DLigado()', /\(c2dCopa \|\| \(presidentFieldAccount && stadiumMatch\)\) && tie\.pens/, 'disputaPenaltis={penaltisCampo.sessao}', 'campo={penaltisCampo.estado}', 'pensNoCampo'] },
  { nome: 'Carreira internacional (Liberta/Champions/Mundial)', arquivo: 'src/escalacao/career-international-view.tsx', tem: [/const campoPen = \(c2d \|\|/, 'disputaPenaltis={disputa.sessao}', 'campo={disputa.estado}'] },
  { nome: 'Salas online e Partida Rápida: Copa dos 8, Liberta, Champions/repescão, Relâmpago, copa da Liga da Turma/Draft, revanche', arquivo: 'src/escalacao/screens.tsx', tem: ['const penCampo = usePenaltisCampo(', 'disputaPenaltis={myTie === meuTiePen ? penCampo.sessao : undefined}', /orcamento: pensRevealDelay\(meuTiePen\.pens/] },
  { nome: 'Copa do Mundo / Euro (sala e carreira)', arquivo: 'src/escalacao/copa-mundo.tsx', tem: ['<Penaltis2D key={`c${t.h}`} config={cfgPen2D(t)}', '<Penaltis2D config={cfgPen2D(world.final)}', 'disputaPenaltis={pen?.sessao}', /orcamento: pensRevealDelay\(t\.pen/] },
  { nome: 'Copas regionais', arquivo: 'src/escalacao/copa-regional-online.tsx', tem: ['<Penaltis2D config={cfgPen2D(grande)}', 'disputaPenaltis={pen?.sessao}', 'orcamento: penMs(t) / 1000'] },
]
for (const l of lugares) {
  const src = ler(l.arquivo)
  for (const t of l.tem) ok(typeof t === 'string' ? src.includes(t) : t.test(src), `${l.nome}: falta ${String(t)} em ${l.arquivo}`)
}
// a lista de confrontos da sala segue o campinho nas DUAS telas da Copa (visual novo e antigo)
ok((ler('src/escalacao/screens.tsx').match(/<PensShootout campo=\{tie === meuTiePen \? penCampo\.estado : undefined\}/g) ?? []).length === 2, 'Copa da sala: as bolinhas do seu confronto não seguem o campinho nas duas telas')
// o quadro das bolinhas segue o campinho quando ele existe
ok(/if\(campo \|\| \(compactOnline/.test(ler('src/escalacao/pyramidseason.tsx')), 'PensShootout não segue o campinho quando recebe `campo`')
// o campinho desenha a disputa (árbitro autorizando, auxiliares, festa)
const campo = ler('src/escalacao/campo2d.tsx')
for (const t of ['penalti?.apito', 'penalti.auxiliares', 'penalti?.comemora', 'disputaPenaltis?.preparar(jogo.atl, jogo.bola)']) ok(campo.includes(t), `campo2d.tsx: falta ${t}`)
// nada de sorteio nem relógio do aparelho na cena (dois aparelhos têm que ver igual)
const cena = ler('src/escalacao/campo2d-penaltis.ts')
ok(!/Math\.random|Date\.now|performance\.now|localStorage/.test(cena), 'campo2d-penaltis.ts usa sorteio/relógio do aparelho')
// fora do 2D nada muda: toda ligação depende do 2D (ou da conta de teste do mapa, como antes)
ok(!/usePenaltisCampo\([^)]*\btrue\b/.test(ler('src/escalacao/screens.tsx')), 'screens.tsx liga a disputa sem olhar o 2D')
// o pênalti manual da carreira não foi tocado: nenhuma tela online ganhou pênalti manual

// ── 2 e 3. A CENA ──────────────────────────────────────────────────────────────────────────────────────────────────
const POS = ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA']
const time = (s: string) => POS.map((pos, i) => ({ name: `${s} ${i + 1}`, pos, lo: 50 + i, hi: 60 + i }))
const A = time('Casa'), B = time('Visitante')
const MIN_SEP = 2.5 // dois marcadores de ~1,25 m de raio: abaixo disso, um aparece em cima do outro
let cenas = 0, piorSep = Infinity, piorCaso = '', maxVel = 0
type Caso = { pens: [number, number]; seqReal?: string; invertido: boolean; orcamento?: number }
const casos: Caso[] = []
for (const pens of [[4, 2], [2, 4], [3, 2], [5, 4], [4, 5], [6, 5], [5, 6], [8, 7], [15, 14]] as [number, number][])
  for (const invertido of [false, true]) for (const orcamento of [undefined, 17.3, 9.8]) casos.push({ pens, invertido, orcamento })
for (let seed = 1; seed <= 40; seed++) {
  let n = seed; const rng = () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 2 ** 32 }
  const r = disputaPenaltisComSequencia(rng)
  casos.push({ pens: r.gols, seqReal: r.seq, invertido: seed % 2 === 0, orcamento: seed % 3 ? 0.7 + Math.max(r.seq.length, 10) * 1.6 + 0.6 : undefined })
}
for (const c of casos) {
  const cfg: ConfigPenaltisCampo = { id: 'trava', pens: c.pens, seqReal: c.seqReal, aName: 'Casa', bName: 'Visitante', aSquad: A, bSquad: B, invertido: c.invertido, orcamento: c.orcamento }
  const jogo = new Jogo2D(123, c.invertido ? B : A, c.invertido ? A : B, [])
  const antes = JSON.stringify({ atl: jogo.atl, placar: jogo.placar })
  const s = new DisputaPenaltisCampo(cfg), s2 = new DisputaPenaltisCampo(cfg)
  s.preparar(jogo.atl, jogo.bola); s2.preparar(jogo.atl, jogo.bola)
  const nome = `${c.pens.join('x')}${c.seqReal ? ' seq' : ''}${c.invertido ? ' inv' : ''} orc=${c.orcamento ?? '-'}`
  if (c.orcamento) ok(s.duracao <= c.orcamento + 1e-6, `${nome}: a disputa (${s.duracao.toFixed(2)} s) não cabe no tempo da sala (${c.orcamento} s)`)
  // passo de 1/60 s em tempo NATURAL (a cena acelerada é a mesma forma, só mais rápida)
  const dt = s.escala / 60
  let ant = s.quadro()!, ult = 0
  const apitosAntesDoContato = new Set<number>()
  for (let e = 0; e <= s.duracaoCena + dt; e += dt) {
    s.elapsed = Math.min(e, s.duracaoCena); s2.elapsed = s.elapsed
    const q = s.quadro()!, st = s.estado
    if (Math.round(e / dt) % 7 === 0) ok(JSON.stringify(q) === JSON.stringify(s2.quadro()) && JSON.stringify(st) === JSON.stringify(s2.estado), `${nome}: dois aparelhos viram coisas diferentes em t=${e.toFixed(2)}`)
    ok(q.jogadores.length === 22 && q.jogadores.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)), `${nome}: jogador sumiu`)
    ok(st.reveladas >= ult, `${nome}: placar andou pra trás`); ult = st.reveladas
    const tn = s.elapsed / s.escala
    q.jogadores.forEach((p, i) => { const v = Math.hypot(p.x - ant.jogadores[i].x, p.y - ant.jogadores[i].y) * 60; maxVel = Math.max(maxVel, v); if (v > (tn > T.organizar ? 13 : 30)) ok(false, `${nome}: teleporte do atleta ${i} em t=${tn.toFixed(2)} (${v.toFixed(1)} m/s)`) })
    if (q.apito) { apitosAntesDoContato.add(st.cobranca); ok(Math.hypot(q.juiz.x - 34, q.juiz.y - 11) < 6, `${nome}: o árbitro autoriza longe da marca`) }
    if (tn > T.organizar) {
      const gente = [...q.jogadores, q.juiz, ...q.auxiliares]
      for (let i = 0; i < gente.length; i++) for (let j = i + 1; j < gente.length; j++) {
        if (i >= 22 && j >= 22 && i !== 22) continue // os dois auxiliares parados um longe do outro
        const d = Math.hypot(gente[i].x - gente[j].x, gente[i].y - gente[j].y)
        if (d < piorSep) { piorSep = d; piorCaso = `${nome} t=${tn.toFixed(2)} ${i}×${j} (${st.fase} #${st.cobranca})` }
      }
      if (q.batedor >= 0 && st.fase !== 'caminhar') {
        const k = s.seq[st.cobranca], ladoCerto = c.invertido ? 1 - k.side : k.side
        ok(jogo.atl[q.batedor].lado === ladoCerto, `${nome}: batedor do time errado`)
        ok(jogo.atl[q.goleiro].lado !== jogo.atl[q.batedor].lado, `${nome}: goleiro do mesmo time do batedor`)
      }
    }
    ant = q
  }
  for (let k = 0; k < s.seq.length; k++) ok(apitosAntesDoContato.has(k), `${nome}: cobrança ${k + 1} sem a autorização do árbitro`)
  // revela só quando a bola chega: um tico antes do fim do voo, não revelou
  for (let k = 0; k < s.seq.length; k++) {
    s.elapsed = (s.contato(k) + T.voo - .01) * s.escala; ok(s.estado.reveladas === k, `${nome}: cobrança ${k + 1} revelada antes da bola chegar`)
    s.elapsed = (s.contato(k) + T.voo + .01) * s.escala; ok(s.estado.reveladas === k + 1, `${nome}: cobrança ${k + 1} não revelada na chegada`)
  }
  s.elapsed = s.duracao
  ok(s.estado.encerrado && s.estado.placar[0] === c.pens[0] && s.estado.placar[1] === c.pens[1], `${nome}: placar final ${s.estado.placar} ≠ ${c.pens}`)
  ok(JSON.stringify({ atl: jogo.atl, placar: jogo.placar }) === antes, `${nome}: a cena mexeu no jogo`)
  cenas++
}
ok(piorSep >= MIN_SEP, `alguém se cruzou: ${piorSep.toFixed(2)} m em ${piorCaso}`)
// sem campinho na tela, o relógio da disputa anda mesmo assim (nunca trava a fase)
{
  const s = new DisputaPenaltisCampo({ id: 'sem', pens: [4, 2], aName: 'A', bName: 'B', orcamento: 12 })
  s.avancar(1); assert.equal(s.elapsed, 0); s.avancar(1, 1, false, true); assert.equal(s.elapsed, 1)
  while (!s.estado.encerrado) s.avancar(.25, 1, false, true)
  assert.deepEqual(s.estado.placar, [4, 2])
}
if (falhas.length) { console.error(`❌ penaltis-2d: ${falhas.length} falha(s)\n` + [...new Set(falhas)].slice(0, 25).join('\n')); process.exit(1) }
console.log(`✅ penaltis-2d: ${lugares.length} telas ligadas · ${cenas} disputas (ritmo natural e acelerado, saves com sequência real) · menor distância entre duas pessoas ${piorSep.toFixed(2)} m (${piorCaso}) · maior velocidade ${maxVel.toFixed(1)} m/s (natural) · dois aparelhos = mesma cena`)
