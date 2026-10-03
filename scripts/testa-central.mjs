// 📺 trava da CENTRAL LEGENDS (03/10) — a redação de O MARTELO do meio da temporada.
// Confere que toda notícia nasce em PT e EN, que nenhuma frase sai com "undefined"/NaN,
// que a redação é determinística e que as regras de spoiler/"nada inventado" seguem:
// sem rodada (round 0) não há manchete nem notícia.
//   npm run central
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const { redacaoDaCentral, sequencia } = await vite.ssrLoadModule('/src/escalacao/central-noticias.ts')
  assert.equal(sequencia('VVEVV', 'V'), 2); assert.equal(sequencia('DDD', 'D'), 3); assert.equal(sequencia(undefined, 'V'), 0)
  const linha = (name, pts, you = false) => ({ name, pts, w: 0, d: 0, l: 0, gf: 0, ga: 0, you, human: you })
  const base = {
    round: 22, divName: 'Série A', divNameEn: 'Serie A',
    tabela: [linha('Fabulous EC', 52), linha('Real Madruga', 48), linha('Neymarzetti', 47, true), linha('Guimarães SCI', 44), linha('Julia Barranquila', 41), linha('Fala D10', 38), linha('Vidraceiro FC', 36), linha('Marcão', 35), linha('Tôka10', 30), linha('Bicho da Seda', 22)],
    formas: { 'Fabulous EC': 'VVVVV', 'Real Madruga': 'VEVDV', 'Neymarzetti': 'VVEVD', 'Guimarães SCI': 'VDDDD', 'Tôka10': 'DVVVV', 'Bicho da Seda': 'DDDDD' },
    artilheiros: [{ name: 'Zico', teamName: 'Fabulous EC', goals: 21, you: false }, { name: 'Romário', teamName: 'Neymarzetti', goals: 19, you: true }],
    garcons: [{ name: 'Zico', teamName: 'Fabulous EC', assists: 11, you: false }, { name: 'Rivaldo', teamName: 'Neymarzetti', assists: 6, you: true }],
    maisCaro: { name: 'Ronaldo', teamName: 'Bicho da Seda', paid: 260, you: false },
    compras: [{ name: 'Rivaldo', paid: 142 }, { name: 'Cafu', paid: 60 }],
    intl: { aberta: true, serieA: true, g8: true, faltam: 0 },
    outraDiv: { divName: 'Série B', divNameEn: 'Serie B', lider: 'Murriz FC', pts: 50 },
  }
  const j = redacaoDaCentral(base)
  const todas = [j.manchete.pt, j.manchete.en, ...j.manchete.sub, ...j.noticias.flatMap(n => [n.pt, n.en, ...n.tag])]
  for (const s of todas) assert.ok(!/undefined|NaN|\[object/.test(s), `texto quebrado: ${s}`)
  assert.match(j.manchete.pt, /Fabulous EC dispara: 5 vitórias seguidas e 4 pontos na frente/)
  assert.match(j.manchete.en, /pull away/)
  assert.match(j.manchete.sub[0], /3º.*5 pontos do líder/)
  const tags = j.noticias.map(n => n.tag[0])
  assert.ok(tags.includes('artilharia') && tags.includes('garçons') && tags.includes('mercado') && tags.includes('crise') && tags.includes('seu clube') && tags.includes('série b'), `faltou assunto: ${tags}`)
  assert.ok(j.noticias.some(n => /Romário chega a 19 gols e encosta/.test(n.pt)), 'o seu artilheiro encostando vira notícia')
  assert.ok(j.noticias.some(n => /Bicho da Seda perde a 5ª seguida/.test(n.pt)), 'a pior sequência vira a crise')
  assert.ok(j.noticias.some(n => /Ronaldo é o jogador mais caro.*10º/.test(n.pt)), 'carta cara em clube mal colocado leva a provocação')
  assert.ok(j.noticias.some(n => /G8 na mão/.test(n.pt)), 'G8 garantido aparece no seu clube')
  assert.ok(j.noticias.length <= 7, 'no máximo 7 notícias')
  assert.ok(j.noticias.every(n => n.pt && n.en && n.emoji && n.tag[0] && n.tag[1]), 'toda notícia tem PT, EN, emoji e etiqueta')
  assert.deepEqual(redacaoDaCentral(base), j, 'determinística')
  // 🙈 pré-temporada: nada a dizer ainda
  const zero = redacaoDaCentral({ ...base, round: 0 })
  assert.equal(zero.manchete, null); assert.equal(zero.noticias.length, 0)
  // sem forma (1ª rodada): manchete simples, sem sequência inventada
  const r1 = redacaoDaCentral({ ...base, round: 1, formas: {}, tabela: [linha('Fabulous EC', 3), linha('Neymarzetti', 3, true), linha('Real Madruga', 1)] })
  assert.match(r1.manchete.pt, /Briga no topo/)
  assert.ok(!r1.noticias.some(n => /seguida/.test(n.pt)), 'sem forma, sem "seguida"')
  // 🏠 G8 em jogo quando está fora
  const fora = redacaoDaCentral({ ...base, intl: { aberta: true, serieA: true, g8: false, faltam: 4 } })
  assert.ok(fora.noticias.some(n => /G8 em jogo: faltam 4 pontos/.test(n.pt)))
  console.log(`✅ O MARTELO da Central: ${j.noticias.length} notícias em PT/EN, manchete "${j.manchete.pt}"`)
} finally { await vite.close() }
