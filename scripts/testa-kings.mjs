// 🧪 trava do motor da Kings League (`src/escalacao/kings.ts`) — regras da Kings League Brasil (docs/conceito-kings-league.md)
// uso: npx tsx scripts/testa-kings.mjs
import { KINGS_TIMES, KINGS_RODADAS, KINGS_FORMACAO, PONTOS_KINGS, calendarioKings, chaveKings, semisKings, simulaPartidaKings, anotaJogoKings, ordenaKings, presidenteBot, dueloKings, MIN_BOLA } from '../src/escalacao/kings.ts'
let falhas = 0
const ok = (c, msg) => { if (!c) { falhas++; console.log('❌', msg) } else console.log('✅', msg) }

ok(KINGS_TIMES === 10 && KINGS_RODADAS === 9, '10 times, 9 rodadas')
ok(Object.values(KINGS_FORMACAO).reduce((a, b) => a + b, 0) === 7 && KINGS_FORMACAO.GOL === 1, 'futebol 7: goleiro + 6')
ok(PONTOS_KINGS.vitoria === 3 && PONTOS_KINGS.vitoria_shootout === 2 && PONTOS_KINGS.derrota_shootout === 1 && PONTOS_KINGS.derrota === 0, 'pontos 3/2/1/0')

const ids = [...Array(10).keys()]
const cal = calendarioKings(ids)
const pares = new Set(); let jogosOk = true
for (const r of cal) { const vistos = new Set(); for (const [a, b] of r) { if (vistos.has(a) || vistos.has(b)) jogosOk = false; vistos.add(a); vistos.add(b); pares.add([a, b].sort((x, y) => x - y).join('-')) } if (r.length !== 5) jogosOk = false }
ok(cal.length === 9 && jogosOk && pares.size === 45, 'calendário: 9 rodadas de 5 jogos, cada par 1× (45 jogos)')

const ch = chaveKings([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
ok(ch.semiDireto === 10 && JSON.stringify(ch.quartas) === JSON.stringify([[20, 70], [30, 60], [40, 50]]), '1º direto na semi · quartas 2×7, 3×6, 4×5')
ok(JSON.stringify(semisKings(10, [20, 30, 40])) === JSON.stringify([[10, 40], [20, 30]]), 'semis: 1º × (4×5) e (2×7) × (3×6)')

// partidas: nunca empata, mesma semente = mesma partida, dado no 18, bola no 38
let empate = false, determin = true, dadoOk = true, bolaOk = true, vermelhaDobra = true, ouroPara = true
const tab = ids.map(i => ({ id: i, nome: 'T' + i, pts: 0, j: 0, v: 0, vs: 0, ds: 0, d: 0, gp: 0, gc: 0 }))
for (let s = 1; s <= 400; s++) {
  const p = simulaPartidaKings({ idA: s % 10, idB: (s + 3) % 10, forcaA: 60 + (s % 30), forcaB: 70, seed: s, externos: [presidenteBot(s, 'A'), presidenteBot(s, 'B')] })
  const q = simulaPartidaKings({ idA: s % 10, idB: (s + 3) % 10, forcaA: 60 + (s % 30), forcaB: 70, seed: s, externos: [presidenteBot(s, 'A'), presidenteBot(s, 'B')] })
  if (JSON.stringify(p) !== JSON.stringify(q)) determin = false
  if (p.resultadoA === undefined || (p.golsA === p.golsB && !p.shootout)) empate = true
  if (!p.eventos.some(e => e.tipo === 'dado' && e.min === 18) && !p.golDeOuro) dadoOk = false
  const bola = p.eventos.find(e => e.tipo === 'bola')
  if (!p.golDeOuro && (!bola || bola.min !== MIN_BOLA)) bolaOk = false
  if (bola?.cor === 'vermelha' && p.eventos.some(e => e.tipo === 'gol' && e.min >= MIN_BOLA && e.vale !== 2)) vermelhaDobra = false
  if (p.golDeOuro && p.eventos.some(e => e.tipo === 'gol' && e.min > p.eventos.filter(x => x.tipo === 'gol').at(-1).min)) ouroPara = false
  anotaJogoKings(tab, p)
}
ok(!empate, 'nunca termina empatado (vai pro shootout)')
ok(determin, 'mesma semente = mesma partida em todo aparelho')
ok(dadoOk, 'o dado cai no minuto 18')
ok(bolaOk, 'bola dourada/vermelha no minuto 38')
ok(vermelhaDobra, 'bola vermelha: todo gol depois do 38 vale 2')
ok(ouroPara, 'gol de ouro encerra o jogo')
const totalPts = tab.reduce((a, l) => a + l.pts, 0), jogos = tab.reduce((a, l) => a + l.j, 0) / 2
ok(totalPts >= jogos * 3 && totalPts <= jogos * 3, 'todo jogo distribui exatamente 3 pontos (3+0 ou 2+1)')
const ord = ordenaKings(tab)
ok(ord.every((l, i) => i === 0 || ord[i - 1].pts >= l.pts), 'tabela ordenada por pontos')
ok(dueloKings(2, 2, 0) === false && dueloKings(0, 5, 0.9) === true && dueloKings(0, 3, 0.9) === false, 'duelo: goleiro no canto certo defende')

// gol de carta/presidente com gol em dobro ativo vale 2
const d = simulaPartidaKings({ idA: 0, idB: 1, forcaA: 1, forcaB: 1, seed: 7, usos: [{ min: 25, lado: 'A', carta: 'gol_dobro' }], externos: [{ min: 26, lado: 'A', tipo: 'presidente', gol: true }] })
ok(d.eventos.some(e => e.tipo === 'gol' && e.min === 26 && e.vale === 2 && e.origem === 'presidente'), 'gol em dobro: pênalti do presidente no período vale 2')

console.log(falhas ? `\n💥 ${falhas} falha(s)` : '\n🟢 Kings League: tudo certo')
process.exit(falhas ? 1 : 0)
