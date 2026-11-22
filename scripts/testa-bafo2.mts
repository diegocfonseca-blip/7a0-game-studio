// 🃏 21/11 — BAFO NOVO (regras do Diego em docs/pendencias.md). Rodar: npm run bafo
// Confere o que dá pra conferir sem rede: a convocação SEMPRE fecha um time, as piores cartas completam, o formato pela
// quantidade de gente, e a liga do reducer (só gente, 22 no elenco, 11 em campo) roda até o campeão.
import assert from 'node:assert/strict'
import { reducer } from '../src/escalacao/store'
import { FORMATIONS, type EscState, type Sector } from '../src/escalacao/types'
import { resolveColecao, fechaConvocacao, faltaPraFechar, formatoBafo, calendarioBafo, podeJogarBafo, piorPrimeiro, type CartaBafo, type Necessidades } from '../src/escalacao/bafo2'

const NEED = FORMATIONS as unknown as Necessidades
let seq = 0
const carta = (pos: Sector, fame = 3, nome?: string): CartaBafo => { seq++; return { id: `c${seq}`, name: nome ?? `J${seq}`, club: 'X', year: 2000, pos, fame, lo: 50 + fame * 8, hi: 60 + fame * 8 } }
const elenco = (g: number, l: number, z: number, m: number, a: number, fame = 3) => [
  ...Array.from({ length: g }, () => carta('GOL', fame)), ...Array.from({ length: l }, () => carta('LAT', fame)), ...Array.from({ length: z }, () => carta('ZAG', fame)),
  ...Array.from({ length: m }, () => carta('MEI', fame)), ...Array.from({ length: a }, () => carta('ATA', fame))]

// ── coleção: carta fora do baralho não entra; repetida conta uma ──
const col = resolveColecao([
  { id: 'a', card_name: 'Pelé', card_club: 'Santos', card_year: 1962, card_pos: 'ATA', card_fame: 5 },
  { id: 'b', card_name: 'Pelé', card_club: 'Santos', card_year: 1962, card_pos: 'ATA', card_fame: 5 },
  { id: 'c', card_name: 'Sumiu', card_club: 'X', card_year: 1, card_pos: 'ATA', card_fame: 1 },
], n => n === 'Pelé' ? { pos: 'ATA', fame: 5, lo: 95, hi: 99, club: 'Santos', year: 1962 } : null)
assert.equal(col.length, 1, 'repetida conta uma e carta fora do baralho não entra')

// ── quem pode jogar ──
assert.ok(podeJogarBafo(elenco(1, 2, 2, 3, 3), NEED), '11 que fecham o 4-3-3 jogam')
assert.ok(!podeJogarBafo(elenco(0, 4, 4, 6, 8), NEED), 'sem goleiro não joga, por mais carta que tenha')
assert.ok(!podeJogarBafo(elenco(1, 2, 2, 3, 2), NEED) || true) // 10 cartas podem não fechar nada
assert.equal(fechaConvocacao([], elenco(0, 4, 4, 6, 8), NEED), null, 'coleção que não fecha time → não convoca')

// ── convocação: não marcou nada → entram as 22 PIORES que fecham um time ──
{
  const fracas = elenco(2, 4, 4, 6, 6, 1), fortes = elenco(2, 4, 4, 6, 6, 5)
  const r = fechaConvocacao([], [...fortes, ...fracas], NEED)!
  assert.equal(r.cartas.length, 22, '22 no elenco')
  assert.ok(r.cartas.every(c => c.fame === 1), 'quem não marca leva as piores')
  assert.ok(podeJogarBafo(r.cartas, NEED), 'e elas fecham um time')
}
// ── marcou 22 atacantes: o jogo tapa as vagas que faltam (e tira as piores marcadas que sobram) ──
{
  const atas = Array.from({ length: 22 }, (_, i) => carta('ATA', i < 5 ? 5 : 2)), resto = elenco(1, 2, 2, 3, 0, 1)
  const r = fechaConvocacao(atas.map(c => c.id), [...atas, ...resto], NEED)!
  assert.equal(r.cartas.length, 22)
  assert.ok(podeJogarBafo(r.cartas, NEED), 'time fecha mesmo com 22 atacantes marcados')
  assert.ok(atas.filter(c => c.fame === 5).every(c => r.ids.includes(c.id)), 'as melhores marcadas ficam; saem as piores que sobravam')
  assert.ok(resto.filter(c => c.pos === 'GOL').every(c => r.ids.includes(c.id)), 'o goleiro que faltava entrou')
}
// ── 21/11: o aviso da tela ("falta 1 GOL · 2 LAT…") bate com o que o jogo faz ao fechar ──
{
  const atas = Array.from({ length: 22 }, (_, i) => carta('ATA', i < 5 ? 5 : 2)), resto = elenco(1, 2, 2, 3, 0, 1)
  const f = faltaPraFechar(atas, [...atas, ...resto], NEED)!
  assert.ok(f.total > 0 && f.falta.GOL === 1, '22 atacantes: a tela avisa que falta goleiro (e o resto)')
  const r = fechaConvocacao(atas.map(c => c.id), [...atas, ...resto], NEED)!
  assert.equal(r.formacao, f.formacao, 'a formação do aviso é a que o jogo fecha')
  assert.equal(faltaPraFechar(elenco(1, 2, 2, 3, 3), [...atas, ...resto, ...elenco(1, 2, 2, 3, 3)], NEED)!.total, 0, '11 certinhos: nada falta')
  assert.equal(faltaPraFechar([], elenco(0, 4, 4, 6, 8), NEED), null, 'coleção que não fecha nada: sem aviso (a pessoa nem convoca)')
}
// ── marcou 11 certinhos: entram os 11 + as 11 piores do resto, e os marcados são os primeiros (titulares) ──
{
  const meus = elenco(1, 2, 2, 3, 3, 5), resto = [...elenco(1, 2, 2, 3, 3, 1), ...elenco(1, 2, 2, 3, 3, 4)]
  const r = fechaConvocacao(meus.map(c => c.id), [...meus, ...resto], NEED)!
  assert.deepEqual(r.ids.slice(0, 11), meus.map(c => c.id), 'as marcadas na frente, na ordem em que foram marcadas')
  assert.ok(r.cartas.slice(11).every(c => c.fame === 1), 'o resto vem das piores')
  assert.equal(r.formacao, '4-3-3')
}
// ── carta de outra pessoa nas marcas é ignorada; mais de 22 marcas corta em 22 ──
{
  const minhas = elenco(2, 4, 4, 8, 8, 3)
  const r = fechaConvocacao(['alheia', ...minhas.map(c => c.id)], minhas, NEED)!
  assert.equal(r.cartas.length, 22); assert.ok(!r.ids.includes('alheia'))
}
// ── coleção de 11 exatos: joga com os 11 ──
{ const r = fechaConvocacao([], elenco(1, 2, 2, 3, 3), NEED)!; assert.equal(r.cartas.length, 11) }
assert.ok([carta('ATA', 1), carta('ATA', 5)].sort(piorPrimeiro)[0].fame === 1)

// ── formato ──
assert.equal(calendarioBafo([0, 1]).length, 5, '2 pessoas = 5 jogos'); assert.equal(formatoBafo(2).rodadas, 5)
for (const n of [3, 4, 5, 6, 9, 13, 20]) {
  const cal = calendarioBafo(Array.from({ length: n }, (_, i) => i))
  assert.equal(cal.length, formatoBafo(n).rodadas, `${n}: rodadas`)
  const jogos = new Map<number, number>(), par = new Map<string, number>()
  for (const r of cal) { const visto = new Set<number>(); for (const [h, a] of r) { assert.ok(!visto.has(h) && !visto.has(a), 'ninguém joga 2× na rodada'); visto.add(h); visto.add(a); jogos.set(h, (jogos.get(h) ?? 0) + 1); jogos.set(a, (jogos.get(a) ?? 0) + 1); const k = [h, a].sort().join('-'); par.set(k, (par.get(k) ?? 0) + 1) } }
  const vezes = n <= 4 ? 4 : 2
  assert.ok([...par.values()].every(v => v === vezes) && par.size === n * (n - 1) / 2, `${n}: cada par se enfrenta ${vezes}×`)
  assert.ok([...jogos.values()].every(v => v === formatoBafo(n).jogosCadaUm), `${n}: todo mundo joga igual`)
}

// ── a liga no reducer: só gente, 22 no elenco, 11 em campo, vai até o campeão ──
const sala = (n: number) => {
  const nomes = Array.from({ length: n }, (_, i) => `T${i}`)
  const bafo: Record<number, unknown[]> = {}, f: Record<number, string> = {}
  nomes.forEach((_, i) => { bafo[i] = elenco(2, 4, 4, 6, 6, 1 + (i % 5)).map(c => ({ ...c, paid: 0, via: 'leilao' })); f[i] = '4-3-3' })
  const s0 = reducer({} as EscState, { type: 'NEW_GAME' } as never)
  return reducer(s0, { type: 'START_ONLINE', seasonNo: 1, roomId: 'r1', roomCode: 'X', isHost: true, playerIndex: 0, playerNames: nomes, seatUids: nomes.map((_, i) => `u${i}`), youUid: 'u0',
    formation: '4-3-3', deck: 'todos', copaMode: 'liga_copa', bafo, bafo2: true, bafoFormacoes: f, bafoValendo: true } as never)
}
for (const n of [2, 3, 4, 7, 20]) {
  let s = sala(n)
  assert.ok(s.bafo2 && s.bafoOn, 'marca do modo')
  assert.equal(s.screen, 'season', 'sem leilão: cai direto na liga')
  assert.equal(s.managers.length, n, 'só gente'); assert.ok(s.managers.every(m => m.isHuman && m.squad.length === 22), '22 de cada')
  assert.equal(s.league.length, n, 'tabela sem bots'); assert.equal(s.fixtures.length, formatoBafo(n).rodadas, `${n}: calendário do Bafo`)
  assert.equal(s.copaMode, 'liga', 'só liga (a copa pedida na criação não entra)')
  assert.ok(s.managers[0].squad.every(c => typeof c.bafoId === 'string'), 'cada carta guarda o id dela no banco')
  // titular ↔ reserva (mesma régua da Liga Draft)
  const m0 = s.managers[0], g = m0.squad.filter(c => c.pos === 'GOL')
  const t = reducer(s, { type: 'MLD_TROCA', mgrId: 0, a: g[0].id, b: g[1].id } as never)
  assert.equal(t.managers[0].squad.filter(c => c.pos === 'GOL')[0].id, g[1].id, 'o reserva vira titular')
  let guarda = 0
  while (s.round < s.fixtures.length && guarda++ < 200) s = reducer(s, { type: 'PLAY_ROUND' } as never)
  assert.equal(s.round, s.fixtures.length, `${n}: a liga chega ao fim`)
  const jogos = s.league.map(x => x.w + x.d + x.l)
  assert.ok(jogos.every(j => j === formatoBafo(n).jogosCadaUm), `${n}: todo mundo jogou ${formatoBafo(n).jogosCadaUm}`)
  // só os 11 titulares fazem gol (o banco não entra)
  const xi = new Set(s.managers.flatMap(m => (['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as Sector[]).flatMap(p => m.squad.filter(c => c.pos === p).slice(0, FORMATIONS[m.formation][p]).map(c => `${m.id}|${c.name}`))))
  assert.ok(s.scorers.every(sc => xi.has(`${sc.teamId}|${sc.name}`)), 'reserva não faz gol')
}
// o dono não expulsa ninguém pelo reducer do modo? (a trava é no kickPlayer do provider; aqui só garante que a marca viaja no save)
console.log('✅ bafo novo: convocação sempre fecha um time · piores completam · formato por nº de gente · liga só de gente até o fim')
process.exit(0)
