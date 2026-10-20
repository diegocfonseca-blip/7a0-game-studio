// 🎥 TRAVA DO QUE A TELA MOSTRA (20/10, Diego: *"a bola às vezes para do nada… dá uma congelada… jogador fazendo coisas
// que não têm sentido… não parece que tá tendo futebol"*). Roda o motor do jeito que o campinho roda (60 quadros/s, relógio
// igual ao do placar) e reprova: bola parada no meio do jogo, todo mundo congelado, jogador plantado, jogador tremendo.
//   npx tsx scripts/testa-campo2d-tela.mts   (vem junto no `npm run campo2d`)
import assert from 'node:assert/strict'
import { Jogo2D, eventosDoJogo, SEG_POR_MIN, DUR_2D_MS } from '../src/escalacao/campo2d-motor'
import { chancesDoJogo } from '../src/escalacao/chances'
const casa = [{ name: 'Taffarel', pos: 'GOL', fame: 5 }, { name: 'Cafu', pos: 'LAT', fame: 5 }, { name: 'Lúcio', pos: 'ZAG', fame: 5 }, { name: 'Aldair', pos: 'ZAG', fame: 4 }, { name: 'Roberto Carlos', pos: 'LAT', fame: 5 }, { name: 'Dunga', pos: 'MEI', fame: 5 }, { name: 'Zico', pos: 'MEI', fame: 5 }, { name: 'Kaká', pos: 'MEI', fame: 5 }, { name: 'Neymar', pos: 'ATA', fame: 5 }, { name: 'Romário', pos: 'ATA', fame: 5 }, { name: 'Bebeto', pos: 'ATA', fame: 5 }]
const fora = [{ name: 'Alex Muralha', pos: 'GOL', fame: 1 }, { name: 'Cicinho', pos: 'LAT', fame: 2 }, { name: 'Índio', pos: 'ZAG', fame: 2 }, { name: 'Thiago Silva', pos: 'ZAG', fame: 4 }, { name: 'Athirson', pos: 'LAT', fame: 2 }, { name: 'Léo Lima', pos: 'MEI', fame: 1 }, { name: 'Mineiro', pos: 'MEI', fame: 3 }, { name: 'Adryan', pos: 'MEI', fame: 1 }, { name: 'Luciano', pos: 'ATA', fame: 3 }, { name: 'Dentinho', pos: 'ATA', fame: 2 }, { name: 'Kléber', pos: 'MEI', fame: 1 }]
const W = 68, L = 105
const N = +(process.argv[2] ?? 40), SO = process.argv[3] ? +process.argv[3] : 0
const R: Record<string, number> = {}; const add = (k: string, v = 1) => { R[k] = (R[k] ?? 0) + v }
const ex: Record<string, string[]> = {}; const nota = (k: string, s: string) => { (ex[k] ??= []); if (ex[k].length < 12) ex[k].push(s) }
for (let s = SO || 1; s <= (SO || N); s++) {
  const rnd = (k: number) => ((s * 9301 + k * 49297) % 233280) / 233280
  const n = Math.floor(rnd(1) * 6)
  const gols = Array.from({ length: n }, (_, i) => ({ min: 1 + Math.floor(rnd(i + 2) * 92), home: rnd(i + 20) < 0.55, name: rnd(i + 30) < 0.5 ? 'Romário' : 'Luciano', assist: rnd(i + 40) < 0.5 ? 'Kaká' : undefined }))
    .map(g => ({ ...g, name: g.home ? (g.name === 'Luciano' ? 'Neymar' : g.name) : (g.name === 'Romário' ? 'Dentinho' : g.name), assist: g.assist && !g.home ? 'Mineiro' : g.assist }))
  const j: any = new Jogo2D(s, casa, fora, eventosDoJogo(gols, chancesDoJogo(s * 77, gols, 109_756)))
  // relógio do placar (LiveScoreCard): minuto = round(93 · t / dur), checado a cada 40 ms; campinho a cada 16,7 ms
  const dur = DUR_2D_MS * 0.82, msPorMin = dur / 93
  // 🐌 metade dos jogos com o relógio de cima 3,5% mais LENTO que o campinho espera (a Copa da carreira conta 90' no tempo de 93';
  // o online chega pela rede) — foi isso que deu a "câmera lenta do nada" (Diego 20/10). O campinho tem que medir o ritmo e andar liso.
  const durRel = s % 2 ? dur * 1.035 : dur
  let msR = msPorMin, janela = 0, janelaSim = 0
  let peLento = 0, peJan = 0, peB = { x: 34, y: 52.5 }
  let simMin = 0, rMin = 0, rEm = 0, ult: number[] | null = null, bAnt = { x: 34, y: 52.5 }
  let parado = 0, bolaParada = 0, vaiVolta: number[][] = j.atl.map(() => []), dirAnt: number[] = j.atl.map(() => 99), amostraAnt: number[] | null = null
  for (let ms = 0; ms <= dur + 4000; ms += 1000 / 60) {
    const placar = Math.min(93, Math.round(93 * Math.floor(ms / 40) * 40 / durRel))
    if (placar !== rMin) { const passo = placar - rMin; if (passo >= 1 && passo <= 3) { const med = (ms - rEm) / passo; if (med > 40 && med < msR * 3) msR = msR * 0.6 + med * 0.4 } rMin = placar; rEm = ms }
    // (a MESMA conta do `campo2d.tsx`: mede o ritmo do relógio e acerta a diferença mudando um pouco a velocidade)
    const dt = 1000 / 60, teto = rMin + 1.25, alvo = Math.min(teto, rMin + (ms - rEm) / msR)
    let m = simMin + dt / msR
    if (placar >= 93) m = Math.max(93.5, simMin + dt / msR)
    else if (Math.abs(alvo - m) > 2.5) m = alvo
    else m = Math.min(teto, simMin + (dt / msR) * Math.max(0.8, Math.min(1.4, 1 + (alvo - m) * 0.9)))
    const tela0 = simMin
    simMin = Math.max(simMin, m)
    // 🐌 câmera lenta: em cada meio segundo com o relógio correndo, o campinho tem que andar ≥ 70% do ritmo do relógio
    if (placar >= 2 && placar < 92) { janela += dt; janelaSim += simMin - tela0; if (janela >= 500) { add('janelas'); if (janelaSim < 0.7 * janela / (durRel / 93)) { add('camera_lenta'); nota('camera_lenta', `s${s} ${placar}' andou ${(100 * janelaSim / (janela / (durRel / 93))).toFixed(0)}% do relógio`) } janela = 0; janelaSim = 0 } }
    j.avancaAte(simMin)
    if (j.t > 93 * SEG_POR_MIN) break
    const sec = dt / 1000
    if (simMin === tela0) add('quadros_relogio_parado')
    const pos = j.atl.flatMap((a: any) => [a.x, a.y])
    if (ult) {
      let vmax = 0
      for (let i = 0; i < pos.length; i += 2) {
        const vx = (pos[i] - ult[i]) / sec, vy = (pos[i + 1] - ult[i + 1]) / sec, v = Math.hypot(vx, vy)
        vmax = Math.max(vmax, v)
        

      }
      const vb = Math.hypot(j.bola.x - bAnt.x, j.bola.y - bAnt.y) / sec
      // 🐌 bola no pé andando em passo de caminhada (< 3,5 m/s, medido em janelas de 0,25 s — a 60 quadros/s nem todo quadro tem
      // passo do motor) com o jogo rolando: o "câmera lenta" que o Diego via (20/10)
      peJan += sec
      if (peJan >= 0.25) {
        const vp = Math.hypot(j.bola.x - peB.x, j.bola.y - peB.y) / peJan
        if (j.bola.dono && j.parada == null && !j.festa && !j.bola.voo && j.bola.dono.grupo !== 'GOL') { add('pe_q'); if (vp < 3.5) { add('pe_lento'); peLento += peJan } else { if (peLento > 1.5) { add('pe_lento_trecho'); nota('pe_lento', `s${s} ${(j.t / SEG_POR_MIN).toFixed(1)}' ${peLento.toFixed(1)}s ${j.bola.dono.nome}`) } peLento = 0 } }
        peJan = 0; peB = { x: j.bola.x, y: j.bola.y }
      }
      // ❄️ "congelou": ninguém se mexe (todos < 0,6 m/s) e a bola parada
      if (vmax < 0.6 && vb < 0.3 && !j.festa) { parado += sec } else { if (parado >= 0.5) { add('congela_n'); add('congela_s', parado); nota('congela', `s${s} ${(j.t / SEG_POR_MIN).toFixed(1)}' ${parado.toFixed(1)}s par=${j.parada} dono=${j.bola.dono?.nome ?? '-'} "${(j.narra || '').replace(/<\/?b>/g, '').slice(0, 40)}"`) } parado = 0 }
      // ⚽ bola parada no meio do jogo (sem cobrança, sem festa) por mais de 0,8 s
      if (vb < 0.2 && j.parada == null && !j.festa && !j.bola.voo) { bolaParada += sec } else { if (bolaParada >= 0.8) { add('bola_para_n'); nota('bola_para', `s${s} ${(j.t / SEG_POR_MIN).toFixed(1)}' ${bolaParada.toFixed(1)}s dono=${j.bola.dono ? j.bola.dono.nome + '(' + Math.hypot(j.bola.dono.x - j.bola.x, j.bola.dono.y - j.bola.y).toFixed(1) + 'm)' : '-'} "${(j.narra || '').replace(/<\/?b>/g, '').slice(0, 40)}"`) } bolaParada = 0 }
      // 🧤 goleiro longe do gol (fora festa), ou goleiro com a bola longe da área
      for (const gk of j.atl.filter((a: any) => a.grupo === 'GOL')) { const dg = gk.lado === 0 ? L - gk.y : gk.y; if (dg > 20 && !j.festa) { add('goleiro_longe_q'); nota('goleiro_longe', `s${s} ${(j.t / SEG_POR_MIN).toFixed(1)}' ${gk.nome} a ${dg.toFixed(0)}m do gol ov=${gk.ov ? 'v' + gk.ov.v : '-'} "${(j.narra || '').replace(/<\/?b>/g, '').slice(0, 30)}"`) } }
    }
    ult = pos; bAnt = { x: j.bola.x, y: j.bola.y }
    // 🔁 vai-e-volta de VERDADE: a cada 0,25 s, deslocamento > 0,4 m numa direção e depois > 0,4 m na contrária
    if (Math.round(ms) % 250 < 17) {
      if (amostraAnt) for (let k = 0; k < j.atl.length; k++) {
        const dx = pos[2 * k] - amostraAnt[2 * k], dy = pos[2 * k + 1] - amostraAnt[2 * k + 1], d = Math.hypot(dx, dy)
        if (k === 0 && j.parada == null && !j.festa) { add('amostras'); for (const a of j.atl) { if (Math.hypot(a.x - j.bola.x, a.y - j.bola.y) < 15) continue; const viz = j.atl.filter((b: any) => b !== a && Math.hypot(a.x - b.x, a.y - b.y) < 4).length; if (viz >= 2) { add('amontoado'); nota('amontoado', `s${s} ${(j.t / SEG_POR_MIN).toFixed(1)}' perto de ${a.nome} (${a.x.toFixed(0)},${a.y.toFixed(0)})`); break } } }
        if (j.parada == null && !j.festa) { add('jog_quadros'); if (d < 0.1) { add('jog_plantado'); const at = j.atl[k]; add('pl_' + (at === j.bola.dono ? 'dono' : at.ov ? 'ov' + (at.ov.v >= 8 ? 'Rapida' : 'Lenta') : 'forma') + '_' + at.grupo) } }
        if (d > 0.4) { const ang = Math.atan2(dy, dx); if (dirAnt[k] !== 99) { const dd = Math.abs(((ang - dirAnt[k] + 3 * Math.PI) % (2 * Math.PI)) - Math.PI); if (dd > 2.3) vaiVolta[k].push(ms) } dirAnt[k] = ang }
      }
      amostraAnt = pos
    }
  }
  // vai-e-volta: 3+ inversões em 1,5 s = tremendo
  vaiVolta.forEach((arr, k) => { for (let i = 2; i < arr.length; i++) if (arr[i] - arr[i - 2] < 1500) { add('treme'); nota('treme', `s${s} ${j.atl[k].nome} ~${(arr[i] / (DUR_2D_MS * 0.82) * 93).toFixed(0)}'`); i += 2 } })
}
console.log(`${SO ? 'semente ' + SO : N + ' jogos'}:`); console.log('  % jogadores PLANTADOS com a bola rolando:', (100 * (R.jog_plantado ?? 0) / (R.jog_quadros ?? 1)).toFixed(1), '· % do tempo com amontoado longe da bola:', (100 * (R.amontoado ?? 0) / (R.amostras ?? 1)).toFixed(1))
for (const [k, v] of Object.entries(R).sort()) console.log(' ', k, typeof v === 'number' ? +v.toFixed(1) : v)
for (const [k, v] of Object.entries(ex)) console.log(k + ':\n   ' + v.join('\n   '))

if (!SO) {
  const plant = 100 * (R.jog_plantado ?? 0) / (R.jog_quadros ?? 1)
  assert.ok((R.bola_para_n ?? 0) <= N * 1, 'bola parando no meio do jogo (mais de 0,8 s sem cobrança)')
  assert.ok((R.congela_n ?? 0) <= N * 0.1, 'campinho congelado (ninguém se mexe e a bola parada)')
  assert.ok(plant <= 8, 'jogador plantado com a bola rolando')
  assert.ok((R.treme ?? 0) <= N * 1.5, 'jogador tremendo (vai e volta)')
  assert.ok((R.pe_lento ?? 0) <= (R.pe_q ?? 1) * 0.1 && (R.pe_lento_trecho ?? 0) <= N, 'bola no pé andando em câmera lenta')
  assert.ok((R.camera_lenta ?? 0) <= (R.janelas ?? 0) * 0.005, 'campinho em câmera lenta (andando bem mais devagar que o relógio)')
  console.log('📺 tela: tudo certo')
}
