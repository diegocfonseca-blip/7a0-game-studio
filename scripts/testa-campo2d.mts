// 📺 trava do CAMPO 2D (20/10): o motor das jogadas tem que entregar EXATAMENTE os gols do jogo (mesmo lado, mesma
// quantidade), no minuto certo (no máx. ~5' de atraso quando dois gols vêm colados), sem travar e igual em todo aparelho.
//   npx tsx scripts/testa-campo2d.mts
import assert from 'node:assert/strict'
import { Jogo2D, eventosDoJogo, SEG_POR_MIN } from '../src/escalacao/campo2d-motor'
import { chancesDoJogo } from '../src/escalacao/chances'
import { ACERVO_NARRA } from '../src/escalacao/campo2d-narracao'
import { LENDAS_COM_ESTILO, LENDAS_COM_GOLPE } from '../src/escalacao/campo2d-estilos'
// 🎙️ o banco de frases: PT e EN com o MESMO número de versões em cada acontecimento, e pelo menos 3
for (const [k, [pt, en]] of Object.entries(ACERVO_NARRA)) { assert.equal(pt, en, `narração '${k}': ${pt} frases em PT e ${en} em EN`); assert.ok(pt >= 3, `narração '${k}' precisa de 3+ versões (tem ${pt})`) }
console.log(`🎙️ ${Object.keys(ACERVO_NARRA).length} acontecimentos narrados, ${Object.values(ACERVO_NARRA).reduce((a, [p]) => a + p, 0)} frases · 🃏 ${LENDAS_COM_ESTILO} lendas com estilo · 🎯 ${LENDAS_COM_GOLPE} com golpe assinatura`)

const casa = [
  { name: 'Taffarel', pos: 'GOL', fame: 5 }, { name: 'Cafu', pos: 'LAT', fame: 5 }, { name: 'Lúcio', pos: 'ZAG', fame: 5 }, { name: 'Aldair', pos: 'ZAG', fame: 4 }, { name: 'Roberto Carlos', pos: 'LAT', fame: 5 },
  { name: 'Dunga', pos: 'MEI', fame: 5 }, { name: 'Zico', pos: 'MEI', fame: 5 }, { name: 'Kaká', pos: 'MEI', fame: 5 }, { name: 'Neymar', pos: 'ATA', fame: 5 }, { name: 'Romário', pos: 'ATA', fame: 5 }, { name: 'Bebeto', pos: 'ATA', fame: 5 },
]
const fora = [
  { name: 'Alex Muralha', pos: 'GOL', fame: 1 }, { name: 'Cicinho', pos: 'LAT', fame: 2 }, { name: 'Índio', pos: 'ZAG', fame: 2 }, { name: 'Thiago Silva', pos: 'ZAG', fame: 4 }, { name: 'Athirson', pos: 'LAT', fame: 2 },
  { name: 'Léo Lima', pos: 'MEI', fame: 1 }, { name: 'Mineiro', pos: 'MEI', fame: 3 }, { name: 'Adryan', pos: 'MEI', fame: 1 }, { name: 'Luciano', pos: 'ATA', fame: 3 }, { name: 'Dentinho', pos: 'ATA', fame: 2 },
]
let jogos = 0, atrasoMax = 0; const atrasos: number[] = []
// 📏 as REGRAS do futebol no campinho (20/10, Diego: "bola sai pela lateral e não é cobrado lateral… escanteio e o time não
// subiu… sai na linha de fundo e não começa pelo goleiro no tiro de meta… quando sai gol tem que iniciar no meio")
let magicas = 0, foraMax = 0, saidasErradas = 0, golsVistosTot = 0, laterais = 0, tiros = 0, escTot = 0, escCheios = 0
// 🔎 varredura de erros do motor (20/10, Diego: *"analisar mais erros de motor do jogo em toda partida"*)
let foraCampo = 0, bolaParada = 0, narraRepetida = 0, sobrepostos = 0
for (let s = 1; s <= 300; s++) {
  const rnd = (k: number) => ((s * 9301 + k * 49297) % 233280) / 233280
  const n = Math.floor(rnd(1) * 6)
  const gols = Array.from({ length: n }, (_, i) => ({ min: 1 + Math.floor(rnd(i + 2) * 92), home: rnd(i + 20) < 0.55, name: rnd(i + 30) < 0.5 ? 'Romário' : 'Luciano', assist: rnd(i + 40) < 0.5 ? 'Kaká' : undefined }))
    .map(g => ({ ...g, name: g.home ? (g.name === 'Luciano' ? 'Neymar' : g.name) : (g.name === 'Romário' ? 'Dentinho' : g.name), assist: g.assist && !g.home ? 'Mineiro' : g.assist }))
  const chances = chancesDoJogo(s * 77, gols, 109_756)
  const evs = eventosDoJogo(gols, chances)
  const j = new Jogo2D(s, casa, fora, evs)
  const golsVistos: { min: number; lado: number }[] = []
  let antes = 0
  let foraDesde = -1, festaAntes = false, bolaK = '', bolaParadaDesde = 0, narraAntes = '', narraPen = ''
  for (let m = 0; m <= 99; m += 0.25) {
    j.avancaAte(m)
    // bola fora das linhas: no máximo o tempo de alguém ir cobrar (lateral/escanteio/tiro de meta)
    const b = j.bola, fora = !j.festa && !b.voo && (b.x < -0.1 || b.x > 68.1 || b.y < -0.1 || b.y > 105.1) && !(b.dono && Math.abs(b.y - 52.5) < 60)
    if (fora) { if (foraDesde < 0) foraDesde = j.t } else if (foraDesde >= 0) { foraMax = Math.max(foraMax, j.t - foraDesde); foraDesde = -1 }
    // acabou a festa do gol → a bola TEM que estar no meio
    // (depois do apito final não tem saída: a festa fecha e o jogo congela)
    if (festaAntes && !j.festa && j.t <= 93.5 * SEG_POR_MIN) { golsVistosTot++; if (Math.hypot(b.x - 34.4, b.y - 52.5) > 2.5) saidasErradas++ }
    festaAntes = !!j.festa
    // 🧍 jogador fora das linhas (mais que o pé na linha), bola parada demais com a bola rolando, narração repetida, dois no mesmo lugar
    for (const a of j.atl) if (a.x < -2 || a.x > 70 || a.y < -2.6 || a.y > 107.6) foraCampo++
    if (!j.festa && m < 93) { const k = `${b.x.toFixed(1)}|${b.y.toFixed(1)}`; if (k === bolaK) { bolaParadaDesde += 0.25; if (bolaParadaDesde > 5) { bolaParada++; bolaParadaDesde = 0 } } else bolaParadaDesde = 0; bolaK = k }
    if (j.narra !== narraAntes) { if (j.narra === narraPen) narraRepetida++; narraPen = narraAntes; narraAntes = j.narra }
    if (Math.round(m * 4) % 20 === 0) for (let i = 0; i < j.atl.length; i++) for (let k2 = i + 1; k2 < j.atl.length; k2++) if (Math.hypot(j.atl[i].x - j.atl[k2].x, j.atl[i].y - j.atl[k2].y) < 0.4) sobrepostos++
    const tot = j.placar[0] + j.placar[1]
    if (tot > antes) { golsVistos.push({ min: j.t / SEG_POR_MIN, lado: j.placar[0] > golsVistos.filter(g => g.lado === 0).length ? 0 : 1 }); antes = tot }
  }
  const esperado = [gols.filter(g => g.home).length, gols.filter(g => !g.home).length]
  assert.deepEqual(j.placar, esperado, `semente ${s}: placar do campinho ${j.placar} ≠ do jogo ${esperado} (gols ${JSON.stringify(gols.map(g => g.min + (g.home ? 'c' : 'f')))})`)
  const ord = [...gols].sort((a, b) => a.min - b.min)
  golsVistos.forEach((g, i) => { const a = g.min - ord[i].min; atrasoMax = Math.max(atrasoMax, a); atrasos.push(a) })
  // igual em dois aparelhos
  const k = new Jogo2D(s, casa, fora, evs); k.avancaAte(47.3); const k2 = new Jogo2D(s, casa, fora, evs); for (let m = 0; m <= 47.3; m += 0.7) k2.avancaAte(m); k2.avancaAte(47.3)
  assert.deepEqual(k.atl.map(a => [a.x.toFixed(3), a.y.toFixed(3)]), k2.atl.map(a => [a.x.toFixed(3), a.y.toFixed(3)]), `semente ${s}: dois aparelhos viram jogos diferentes`)
  magicas += j.diag.magicas; laterais += j.diag.laterais; tiros += j.diag.tirosDeMeta
  escTot += j.diag.escanteios.length; escCheios += j.diag.escanteios.filter(n => n >= 4).length
  jogos++
}
console.log(`🔎 erros: ${foraCampo} jogador fora das linhas · ${bolaParada} bola parada 5s+ com a bola rolando · ${narraRepetida} frases repetidas em seguida · ${sobrepostos} jogadores um em cima do outro`)
assert.equal(foraCampo, 0, 'jogador fora das linhas')
assert.ok(bolaParada < jogos * 0.1, 'bola parada demais')
assert.ok(narraRepetida < jogos * 0.5, 'narração repetida em seguida')
console.log(`📏 regras: ${laterais} laterais · ${tiros} tiros de meta · ${escTot} escanteios (${escCheios} com 4+ do ataque na área) · bola fora no máx. ${foraMax.toFixed(1)}s · ${saidasErradas}/${golsVistosTot} saídas fora do meio · ${magicas} bolas "voando" pro pé de alguém longe (${(magicas / jogos).toFixed(2)} por jogo)`)
assert.equal(saidasErradas, 0, 'depois do gol a bola tem que voltar pro meio')
assert.ok(foraMax < 6, `bola ficou ${foraMax.toFixed(1)}s fora do campo sem cobrança`)
assert.ok(laterais > jogos / 3 && tiros > jogos / 2, 'o jogo tem que ter lateral e tiro de meta')
assert.ok(escTot > 0 && escCheios / escTot > 0.9, 'no escanteio o ataque SOBE (4+ na área)')
assert.ok(magicas / jogos < 3, 'bola indo pro pé de alguém longe sem passe demais')
// 🏁 gol nos acréscimos: a festa FECHA depois do apito (Diego 20/10: "mascote travado" — o GOL do 90+2' ficava aberto pra sempre)
{
  const gols = [{ min: 92, home: true, name: 'Romário', assist: undefined as string | undefined }]
  const j = new Jogo2D(7, casa, fora, eventosDoJogo(gols, chancesDoJogo(7 * 77, gols, 109_756)))
  let viuFesta = false
  for (let m = 0; m <= 99; m += 0.25) { j.avancaAte(m); if (j.festa) viuFesta = true }
  assert.ok(viuFesta && !j.festa && j.placar[0] === 1, 'a festa do gol nos acréscimos tem que abrir e FECHAR depois do apito')
}
atrasos.sort((a, b) => a - b); console.log('atraso dos gols (min): mediana', atrasos[atrasos.length >> 1].toFixed(1), '· 90%', atrasos[Math.floor(atrasos.length * 0.9)].toFixed(1), '· >3min:', atrasos.filter(a => a > 3).length, 'de', atrasos.length)
console.log(`✅ ${jogos} jogos: o placar do campinho bate com o do jogo em todos · maior atraso de gol ${atrasoMax.toFixed(1)}'`)
assert.ok(atrasoMax <= 6.5, 'gol atrasado demais no campinho')
console.log('📺 Campo 2D: tudo certo')
process.exit(0)
