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
  // 💰 o maior lance do pregão (de qualquer clube) vira notícia, e não repete o "mais caro"
  const lance = redacaoDaCentral({ ...base, maiorLance: { name: 'Ronaldo', teamName: 'Bicho da Seda', paid: 260, you: false } })
  assert.ok(lance.noticias.some(n => /Maior lance da temporada: Bicho da Seda levou Ronaldo por 🪙 260 — e está em 10º/.test(n.pt)))
  assert.equal(lance.noticias.filter(n => /Ronaldo/.test(n.pt)).length, 1, 'mesma carta não vira duas notícias')
  const meuLance = redacaoDaCentral({ ...base, maiorLance: { name: 'Rivaldo', teamName: 'Neymarzetti', paid: 142, you: true } })
  assert.ok(meuLance.noticias.some(n => /Maior lance da temporada: você levou Rivaldo por 🪙 142\./.test(n.pt)))
  // 🏆🚨 matemática da tabela (03/10): título à vista, Z4 na cola, rebaixado
  const titulo = redacaoDaCentral({ ...base, round: 35, tabela: [linha('Neymarzetti', 80, true), linha('Fabulous EC', 72), ...base.tabela.slice(2)], intl: null })
  assert.ok(titulo.noticias.some(n => /Título à vista: faltam 2 pontos pra garantir a Série A, com 3 rodadas/.test(n.pt)), titulo.noticias.map(n => n.pt).join(' | '))
  const campeao = redacaoDaCentral({ ...base, round: 35, tabela: [linha('Neymarzetti', 90, true), linha('Fabulous EC', 72), ...base.tabela.slice(2)], intl: null })
  assert.ok(campeao.noticias.some(n => /TÍTULO MATEMÁTICO/.test(n.pt)))
  const z4 = redacaoDaCentral({ ...base, tabela: [...base.tabela.slice(0, 6).map(x => ({ ...x, you: false })), linha('Marcão', 35), linha('Vidraceiro FC', 34), linha('Tôka10', 30), linha('Neymarzetti', 28, true)], formas: {}, intl: null })
  assert.ok(z4.noticias.some(n => /Você está no Z4, a 10 pontos do 6º — 16 rodadas pra escapar/.test(n.pt)), z4.noticias.map(n => n.pt).join(' | '))
  const caiu = redacaoDaCentral({ ...base, round: 36, tabela: [...base.tabela.slice(0, 6).map(x => ({ ...x, you: false })), linha('Marcão', 35), linha('Vidraceiro FC', 34), linha('Tôka10', 30), linha('Neymarzetti', 20, true)], formas: {}, intl: null })
  assert.ok(caiu.noticias.some(n => /Rebaixamento confirmado/.test(n.pt)))
  const varzea = redacaoDaCentral({ ...base, temRebaixamento: false, tabela: [...base.tabela.slice(0, 6).map(x => ({ ...x, you: false })), linha('Marcão', 35), linha('Vidraceiro FC', 34), linha('Tôka10', 30), linha('Neymarzetti', 28, true)], formas: {}, intl: null })
  assert.ok(!varzea.noticias.some(n => /Z4/.test(n.pt)), 'Várzea não rebaixa')
  // 🩹🌱🏆 seu elenco e copa chegando
  const casa = redacaoDaCentral({ ...base, round: 35, lesao: { nome: 'Cafu', jogosFora: 2, motivo: ['lesão', 'injury'] }, criaTitular: 'Zé da Base', copaChegando: [{ nome: ['Copa do Brasil', 'Copa do Brasil'], rodadasFaltam: 3 }, { nome: ['Copa do Mundo', 'World Cup'], proximaTemporada: true }] })
  const txt = casa.noticias.map(n => n.pt).join(' | ')
  assert.match(txt, /Cafu está fora \(lesão\): volta em 2 jogos/)
  assert.match(txt, /Cria da base Zé da Base vai de titular/)
  assert.match(txt, /Copa do Brasil chegando: faltam 3 rodadas/)
  // 🏠 G8 em jogo quando está fora
  const fora = redacaoDaCentral({ ...base, intl: { aberta: true, serieA: true, g8: false, faltam: 4 } })
  assert.ok(fora.noticias.some(n => /G8 em jogo: faltam 4 pontos/.test(n.pt)))
  console.log(`✅ O MARTELO da Central: ${j.noticias.length} notícias em PT/EN, manchete "${j.manchete.pt}"`)
} finally { await vite.close() }
