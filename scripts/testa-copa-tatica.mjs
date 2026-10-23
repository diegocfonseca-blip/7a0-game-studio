// ⚔️ TRAVA DA TÁTICA NA COPA DO MUNDO E NOS REGIONAIS DO ONLINE (23/10) — `npm run copa-tatica`
// A sala inteira tem que ver a MESMA copa. Então, com tática:
//   1. sem tática (ou todo mundo em ⚖️ equilíbrio) a copa é IDÊNTICA à de sempre, jogo a jogo;
//   2. a tática escolhida durante o jogo do passo p só muda jogos do passo p+1 em diante — NENHUM jogo já mostrado muda;
//   3. jogo sem gente com tática nunca muda (o dado do torneio anda igual);
//   4. mesma ficha + mesmas linhas = mesma copa, sempre (dois aparelhos);
//   5. o efeito existe: 🔥 ataque faz mais gol que 🧱 retranca, na média.
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
let falhas = 0
const ok = (c, m) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) falhas++ }
try {
  const M = await vite.ssrLoadModule('/src/escalacao/copa-mundo-online.tsx')
  const C = await vite.ssrLoadModule('/src/escalacao/copa-mundo.tsx')
  const R = await vite.ssrLoadModule('/src/escalacao/copa-regional.ts')
  const T = await vite.ssrLoadModule('/src/escalacao/copa-taticas.ts')
  const paises = M.paisesDaCopa().slice(0, 32)
  const ents = paises.map((p, i) => { const pool = C.countryPool(p); const f = C.formationFits(pool, '4-3-3') ? '4-3-3' : '4-4-2'; const xi = C.bestXI(pool, f); return { club: `Clube ${i}`, you: false, pais: p, xi, str: C.xiStrength(xi), form: f } })
  const uids = ents.map((_, i) => (i < 6 ? `u${i}` : undefined)) // 6 seleções de gente
  const PASSOS = [1, 2, 3, 5, 6, 7, 8]
  // jogos de um passo da Copa do Mundo, em ordem estável
  const jogosDoPasso = (w, p) => p <= 3 ? w.groups.map(g => g.matches[p - 1]) : p === 5 ? w.r16 : p === 6 ? w.qf : p === 7 ? w.sf : p === 8 ? [w.final] : []
  const ate = (w, p) => JSON.stringify(PASSOS.filter(x => x < p).map(x => jogosDoPasso(w, x)))
  const tudo = w => JSON.stringify([w.groups.map(g => g.matches), w.r16, w.qf, w.sf, w.final])

  console.log('— Copa do Mundo')
  let i1 = 0, i2 = 0, i4 = 0, mudou = 0
  for (let s = 1; s <= 30; s++) {
    const seed = s * 7919
    const base = C.simulaCopaMundo(ents, seed, 1, true, true)
    const eqs = T.montaQualTatica(uids.filter(Boolean).map(u => ({ uid: u, passo: 1, tatica: 'equilibrio' })), uids)
    if (tudo(C.simulaCopaMundo(ents, seed, 1, true, true, false, eqs)) === tudo(base)) i1++
    // escolhe numa rodada qualquer: tudo ANTES do passo seguinte tem que ficar igual
    for (const p of [1, 2, 3, 5, 6, 7]) {
      const linhas = uids.filter(Boolean).map((u, k) => ({ uid: u, passo: p, tatica: k % 2 ? 'ataque' : 'retranca' }))
      const w = C.simulaCopaMundo(ents, seed, 1, true, true, false, T.montaQualTatica(linhas, uids))
      const prox = PASSOS.find(x => x > p)
      if (ate(w, prox) === ate(base, prox)) i2++
      if (tudo(w) !== tudo(base)) mudou++
      const w2 = C.simulaCopaMundo(ents, seed, 1, true, true, false, T.montaQualTatica(JSON.parse(JSON.stringify(linhas)), uids))
      if (tudo(w2) === tudo(w)) i4++
    }
  }
  ok(i1 === 30, `todo mundo em equilíbrio = Copa idêntica (${i1}/30)`)
  ok(i2 === 180, `tática escolhida no passo p não muda nenhum jogo até o passo p (${i2}/180)`)
  ok(i4 === 180, `mesmas linhas = mesma Copa em dois aparelhos (${i4}/180)`)
  ok(mudou > 120, `a tática muda a Copa de verdade daí pra frente (${mudou}/180)`)
  // 3. jogo de máquina × máquina nunca muda
  {
    let mm = 0, tot = 0
    for (let s = 1; s <= 20; s++) {
      const base = C.simulaCopaMundo(ents, s * 31, 1, true, true)
      const w = C.simulaCopaMundo(ents, s * 31, 1, true, true, false, T.montaQualTatica(uids.filter(Boolean).map(u => ({ uid: u, passo: 0, tatica: 'ataque' })), uids))
      for (let g = 0; g < base.groups.length; g++) for (let r = 0; r < 3; r++) base.groups[g].matches[r].forEach((m, k) => {
        if (uids[m.h] || uids[m.a]) return
        tot++; if (JSON.stringify(m) === JSON.stringify(w.groups[g].matches[r][k])) mm++
      })
    }
    ok(mm === tot, `jogo de grupo sem gente nunca muda (${mm}/${tot})`)
  }

  console.log('— regionais')
  const rents = Array.from({ length: 16 }, (_, i) => ({ club: `C${i}`, you: false, pais: `C${i}`, xi: R.xiDaMaquinaClube('Flamengo').xi, str: 70 + (i % 5) }))
  const ruids = rents.map((_, i) => (i % 3 === 0 ? `r${i}` : undefined))
  const n = 8, P = R.passosRegional(n)
  const rPassos = [...Array.from({ length: n }, (_, i) => i + 1), ...Array.from({ length: P.KO }, (_, i) => P.PRIMEIRO_KO + i)]
  const rJogos = (m, p) => p <= n ? m.rodadas[p - 1] : m.ko[p - P.PRIMEIRO_KO]?.ties
  const rAte = (m, p) => JSON.stringify(rPassos.filter(x => x < p).map(x => rJogos(m, x)))
  let r1 = 0, r2 = 0, rt = 0
  for (let s = 1; s <= 30; s++) {
    const base = R.simulaRegional(rents, s * 101)
    if (JSON.stringify(R.simulaRegional(rents, s * 101, T.montaQualTatica(ruids.filter(Boolean).map(u => ({ uid: u, passo: 1, tatica: 'equilibrio' })), ruids))) === JSON.stringify(base)) r1++
    for (const p of rPassos.slice(0, -1)) {
      rt++
      const w = R.simulaRegional(rents, s * 101, T.montaQualTatica(ruids.filter(Boolean).map((u, k) => ({ uid: u, passo: p, tatica: k % 2 ? 'ataque' : 'retranca' })), ruids))
      if (rAte(w, rPassos.find(x => x > p)) === rAte(base, rPassos.find(x => x > p))) r2++
    }
  }
  ok(r1 === 30, `todo mundo em equilíbrio = regional idêntico (${r1}/30)`)
  ok(r2 === rt, `tática do passo p não muda nada até o passo p (${r2}/${rt})`)

  console.log('— efeito')
  {
    const g = { ataque: 0, retranca: 0 }
    for (const t of ['ataque', 'retranca']) for (let s = 1; s <= 400; s++) {
      const w = R.simulaRegional(rents, s, T.montaQualTatica([{ uid: 'r0', passo: 0, tatica: t }], ruids))
      for (const rod of w.rodadas) for (const j of rod) { if (j.h === 0) g[t] += j.gh; if (j.a === 0) g[t] += j.ga }
    }
    ok(g.ataque > g.retranca * 1.2, `🔥 ataque faz mais gol que 🧱 retranca (${g.ataque} × ${g.retranca})`)
  }
  ok(T.taticaNoPasso([{ uid: 'a', passo: 3, tatica: 'ataque' }], 'a', 3) === 'equilibrio', 'escolha feita no jogo do passo 3 NÃO vale no próprio passo 3')
  ok(T.taticaNoPasso([{ uid: 'a', passo: 3, tatica: 'ataque' }], 'a', 4) === 'ataque', '…e vale no seguinte')
  ok(T.taticaNoPasso([{ uid: 'a', passo: 1, tatica: 'ataque' }, { uid: 'a', passo: 2, tatica: 'retranca' }], 'a', 5) === 'retranca', 'vale a mais recente')
} finally { await vite.close() }
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tática da copa segura')
process.exit(falhas ? 1 : 0)
