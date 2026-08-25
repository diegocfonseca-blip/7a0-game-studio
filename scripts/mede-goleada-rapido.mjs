// ─── ⚽📈 SAI GOL DEMAIS NO RÁPIDO ONLINE? (relato do Diego 25/08) ───────────
//
// Palavras dele: *"me parece q tá saindo gol demais.. mts goleadas toda hr...
// 9x0 e etc"*, com a dúvida se foi por causa da assistência de 24/08.
//
// Este script NÃO opina: roda o MOTOR DE VERDADE (o `reducer` de store.tsx, o
// mesmo que o jogo usa) numa temporada online completa e conta gol por gol.
//
// O que ele mede:
//   1. média de gols por partida (o número que diz se "sai gol demais");
//   2. maior placar que apareceu (o "9x0" é possível?);
//   3. quantas goleadas (diferença de 4+) por temporada;
//   4. a mesma conta SEPARADA por tipo de confronto — humano×humano,
//      humano×clube de fundo e fundo×fundo. É aí que a causa aparece: se a
//      goleada só existe quando o humano pega clube de fundo, o problema é o
//      DEGRAU de força, não o sorteio de gols.
//
//   npm run dev  (noutro terminal)  ·  node scripts/mede-goleada-rapido.mjs
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMPS = Number(arg('--temporadas', '30'))
const HUMANOS = Number(arg('--humanos', '4'))
const BASE = arg('--base', 'http://localhost:5173/7a0-game-studio/bench-sim.html')
const CORRIGE = process.argv.includes('--corrige')
const COMPRIME = Number(arg('--comprime', '0')) // 0 = como está hoje; 0.5 = aperta a faixa pela metade

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
page.on('console', m => { const t = m.text(); if (t.startsWith('SIM')) console.log(t) })
page.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

const r = await page.evaluate(async ([TEMPS, HUMANOS, CORRIGE, COMPRIME]) => {
  const S = await import('/7a0-game-studio/src/escalacao/store.tsx')
  const D = await import('/7a0-game-studio/src/escalacao/data.ts')
  const { reducer, INITIAL } = S

  // ── monta elencos como o LEILÃO monta: 11 titulares tirados do catálogo, do
  // mais forte pro mais fraco, alternando entre os jogadores (quem escolhe
  // primeiro leva o melhor). É exatamente o formato que sai do pregão.
  // CATALOG já vem separado por setor (GOL/LAT/ZAG/MEI/ATA)
  const porPos = {}
  for (const p of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
    porPos[p] = D.CATALOG[p].map(c => ({ ...c, pos: p })).sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))
  }
  const XI = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
  const cursor = { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 }
  const squads = []
  for (let i = 0; i < HUMANOS; i++) squads.push([])
  for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
    for (let n = 0; n < XI[pos]; n++) {
      for (let i = 0; i < HUMANOS; i++) {
        const c = porPos[pos][cursor[pos]++]
        if (c) squads[i].push({ ...c, id: `${c.name}-${i}-${n}` })
      }
    }
  }

  const managers = squads.map((sq, i) => ({
    id: i, name: `Jogador ${i + 1}`, teamName: `Time ${i + 1}`, isHuman: true, auctionRival: false,
    formation: '4-3-3', money: 100, squad: sq,
  }))

  const linha = { todos: [], hh: [], hc: [], cc: [], fracos: [], fortes: [] } // placares por tipo de confronto
  let humVit4 = 0, humJogos = 0 // jogos do humano contra clube de fundo, e quantos ele ganhou por 4+
  let maiorPlacar = { hg: 0, ag: 0, dif: -1 }
  let cpuAdj = null

  for (let t = 0; t < TEMPS; t++) {
    let st = {
      ...INITIAL,
      seed: (1234567 + t * 7919) >>> 0,
      sport: 'futebol',
      onlineMode: 'online',
      careerOnline: false,
      screen: 'cerimonia',
      managers: managers.map(m => ({ ...m, squad: m.squad.map(c => ({ ...c })) })),
    }
    st = reducer(st, { type: 'FINISH_CEREMONY' })
    // 🧪 SIMULA O CONSERTO: puxa os clubes de fundo pro nível-base do online (74),
    // que é o que o código já QUERIA fazer e não faz (a balança mede técnico-robô,
    // e no online não existe nenhum). Serve pra ver se a goleada cai.
    if (CORRIGE) {
      const fundo = st.league.filter(t => !t.isManager)
      const nat = fundo.reduce((s, t) => s + (t.baseAtk + t.baseDef) / 2, 0) / (fundo.length || 1)
      st.cpuAtkAdj = 74 - nat; st.cpuDefAdj = 74 - nat
    }
    // 🧪 SIMULA O OUTRO CONSERTO: APERTA a faixa dos clubes de fundo em volta de 74
    // (o Íbis 55 sobe, o Bigão 78 desce). Diferente do de cima: aquele DESLOCA a
    // faixa toda e a distância entre o mais forte e o mais fraco continua igual —
    // e é a DISTÂNCIA que faz a goleada, não a média.
    if (COMPRIME > 0) {
      for (const t of st.league) if (!t.isManager) {
        t.baseAtk = 74 + (t.baseAtk - 74) * (1 - COMPRIME)
        t.baseDef = 74 + (t.baseDef - 74) * (1 - COMPRIME)
      }
    }
    if (cpuAdj === null) {
      const fundo = st.league.filter(t => !t.isManager)
      const setor = (sq, pos) => {
        const s2 = sq.filter(c => c.pos === pos).map(c => (c.lo + c.hi) / 2)
        if (!s2.length) return 40
        const avg = s2.reduce((x, y) => x + y, 0) / s2.length
        return avg - (avg - Math.min(...s2)) * 0.35
      }
      const forca = sq => ({
        atk: setor(sq, 'ATA') * 0.45 + setor(sq, 'MEI') * 0.35 + setor(sq, 'LAT') * 0.20,
        def: setor(sq, 'GOL') * 0.30 + setor(sq, 'ZAG') * 0.40 + setor(sq, 'LAT') * 0.15 + setor(sq, 'MEI') * 0.15,
      })
      const hs = st.managers.filter(m => m.isHuman).map(m => forca(m.squad))
      cpuAdj = {
        atk: st.cpuAtkAdj, def: st.cpuDefAdj, times: st.league.length,
        humanoAtk: hs.reduce((s2, f) => s2 + f.atk, 0) / hs.length + st.cpuAtkAdj * 0,
        humanoDef: hs.reduce((s2, f) => s2 + f.def, 0) / hs.length,
        fundoMin: Math.min(...fundo.map(t => t.baseDef)) + st.cpuDefAdj,
        fundoMax: Math.max(...fundo.map(t => t.baseAtk)) + st.cpuAtkAdj,
      }
    }
    const humano = new Set(st.managers.filter(m => m.isHuman).map(m => m.id))
    const rodadas = st.fixtures.length
    for (let r = 0; r < rodadas; r++) {
      st = reducer(st, { type: 'PLAY_ROUND' })
      for (const res of st.lastResults ?? []) {
        const h = humano.has(res.homeId), a = humano.has(res.awayId)
        const tipo = h && a ? 'hh' : (h || a) ? 'hc' : 'cc'
        linha.todos.push(res.hg + res.ag)
        linha[tipo].push(res.hg + res.ag)
        if (tipo === 'hc') {
          humJogos++
          const golsHum = h ? res.hg : res.ag, golsCpu = h ? res.ag : res.hg
          if (golsHum - golsCpu >= 4) humVit4++
          const opp = st.league.find(t => t.id === (h ? res.awayId : res.homeId))
          const nivel = opp ? (opp.baseAtk + opp.baseDef) / 2 : 70
          linha[nivel < 66 ? 'fracos' : 'fortes'].push(res.hg + res.ag)
        }
        const dif = Math.abs(res.hg - res.ag)
        if (dif > maiorPlacar.dif || (dif === maiorPlacar.dif && res.hg + res.ag > maiorPlacar.hg + maiorPlacar.ag)) {
          maiorPlacar = { hg: res.hg, ag: res.ag, dif }
        }
      }
    }
  }

  const resumo = arr => {
    if (!arr.length) return null
    const media = arr.reduce((s, x) => s + x, 0) / arr.length
    return {
      jogos: arr.length,
      mediaGols: +media.toFixed(2),
      pct5mais: +(arr.filter(x => x >= 5).length * 100 / arr.length).toFixed(1),
      pct7mais: +(arr.filter(x => x >= 7).length * 100 / arr.length).toFixed(1),
    }
  }
  return {
    cpuAdj,
    todos: resumo(linha.todos),
    humanoXhumano: resumo(linha.hh),
    humanoXfundo: resumo(linha.hc),
    fundoXfundo: resumo(linha.cc),
    contraFracos: resumo(linha.fracos),
    contraFortes: resumo(linha.fortes),
    pctHumanoGanhaPor4: +(humVit4 * 100 / (humJogos || 1)).toFixed(1),
    maiorPlacar,
  }
}, [TEMPS, HUMANOS, CORRIGE, COMPRIME])

await browser.close()
console.log('\n══════ RÁPIDO ONLINE · SAI GOL DEMAIS? ══════')
console.log(`ajuste dos clubes de fundo: atk ${r.cpuAdj.atk.toFixed(2)} · def ${r.cpuAdj.def.toFixed(2)} · ${r.cpuAdj.times} times na tabela`)
console.log(`força: humano atk ${r.cpuAdj.humanoAtk.toFixed(1)} / def ${r.cpuAdj.humanoDef.toFixed(1)}  ·  clubes de fundo de ${r.cpuAdj.fundoMin.toFixed(1)} a ${r.cpuAdj.fundoMax.toFixed(1)}`)
const linha = (rot, x) => x && console.log(`${rot.padEnd(20)} ${String(x.jogos).padStart(6)} jogos · ${String(x.mediaGols).padStart(5)} gols/jogo · ${String(x.pct5mais).padStart(5)}% com 5+ · ${String(x.pct7mais).padStart(4)}% com 7+`)
linha('TODOS os jogos', r.todos)
linha('humano × humano', r.humanoXhumano)
linha('humano × fundo', r.humanoXfundo)
linha('fundo × fundo', r.fundoXfundo)
linha('  ↳ contra os FRACOS', r.contraFracos)
linha('  ↳ contra os FORTES', r.contraFortes)
console.log(`humano ganha do clube de fundo por 4+ de diferença em ${r.pctHumanoGanhaPor4}% dos jogos`)
console.log(`maior massacre visto: ${r.maiorPlacar.hg} x ${r.maiorPlacar.ag}`)
