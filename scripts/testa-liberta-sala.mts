// 🏆 Trava da LIGA + LIBERTADORES das salas (Diego 19/11) — `npm run liberta-sala`
// Confere o motor puro (`src/escalacao/liberta-sala.ts`): 32 clubes reais diferentes, cada um fecha 11 com as
// PRÓPRIAS cartas, 8 grupos de 4 em turno e returno, 2 primeiros passam, oitavas nunca repetem grupo, ida e volta
// até a semi, final em jogo único, mesma semente = mesma copa, campeão definido.
import {
  LIBERTA_CLUBES, LIBERTA_VAGAS, LIB, clubesLiberta, simulaLibertaSala, tabelaDoGrupo, montaFichaLiberta, entrantesLiberta,
  jogosDoPasso, libRodaBola, artilhariaLiberta, type LugarLiberta, type PickLiberta,
} from '../src/escalacao/liberta-sala'
import { clubeFechaTime, poolDoClube, xiDaMaquinaClube } from '../src/escalacao/copa-regional'

let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('❌', msg) } }

// 1) a lista do Diego: 36 clubes, todos fecham 11 com os baralhos normais
ok(LIBERTA_CLUBES.length === 36, `lista tem ${LIBERTA_CLUBES.length} clubes (esperado 36)`)
for (const { clube } of LIBERTA_CLUBES) ok(clubeFechaTime(clube), `${clube} não fecha um time de 11`)
ok(clubesLiberta().length >= LIBERTA_VAGAS, 'menos de 32 clubes jogáveis')

// 2) uma liga de 20 (6 de gente, 14 bots) monta a ficha de 32
const classif: LugarLiberta[] = Array.from({ length: 20 }, (_, i) => ({ id: i, nome: `Time ${i + 1}`, humano: i % 3 === 0 }))
const uidDe = new Map(classif.filter(c => c.humano).map(c => [c.id, `u${c.id}`]))
const picks = new Map<string, PickLiberta>([
  ['u0', { pais: 'Peñarol', form: '4-3-3', xiKeys: [] }],
  ['u3', { pais: 'Universitario', form: '4-4-2', xiKeys: [] }],
  ['u6', { pais: 'Peñarol', form: '4-3-3', xiKeys: [] }], // pegou o mesmo (não pode) → leva o pior que sobrou
])
for (let seed = 1; seed <= 300; seed++) {
  const ficha = montaFichaLiberta(classif, uidDe, picks, seed * 7919, 1)
  ok(ficha.times.length === 32, `seed ${seed}: ficha com ${ficha.times.length} times`)
  ok(new Set(ficha.times.map(t => t.pais)).size === 32, `seed ${seed}: clube repetido na ficha`)
  ok(ficha.times[0].pais === 'Peñarol' && ficha.times[3].pais === 'Universitario', `seed ${seed}: a escolha de gente não foi respeitada`)
  ok(ficha.times[6].pais !== 'Peñarol', `seed ${seed}: dois times com o Peñarol`)
  const ents = entrantesLiberta(ficha, 'u0')
  for (const e of ents) {
    ok(e.xi.length === 11, `${e.pais}: XI com ${e.xi.length}`)
    const minhas = new Set(Object.values(poolDoClube(e.pais)).flat().map(c => `${c.name}|${c.club}|${c.year}`))
    ok(e.xi.every(c => minhas.has(`${c.name}|${c.club}|${c.year}`)), `${e.pais}: carta de fora do clube no XI`)
  }
  const m = simulaLibertaSala(ents, ficha.seed)
  // 3) grupos: 8 × 4, todos diferentes
  ok(m.grupos.length === 8 && m.grupos.every(g => g.length === 4), `seed ${seed}: grupos fora de 8×4`)
  ok(new Set(m.grupos.flat()).size === 32, `seed ${seed}: clube em dois grupos`)
  // 4) 6 rodadas, todo par se enfrenta 2× (uma em cada casa)
  ok(m.rodadas.length === 6 && m.rodadas.every(r => r.length === 16), `seed ${seed}: rodadas fora de 6×16`)
  m.grupos.forEach((g, gi) => {
    for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) if (i !== k) {
      const n = m.rodadas.flat().filter(j => j.h === g[i] && j.a === g[k]).length
      ok(n === 1, `seed ${seed}: grupo ${gi} ${g[i]}×${g[k]} em casa ${n}×`)
    }
    for (const t of g) ok(m.rodadas.every(r => r.filter(j => j.h === t || j.a === t).length === 1), `seed ${seed}: ${t} não joga 1× por rodada`)
    const tab = tabelaDoGrupo(m, gi, 6)
    ok(m.classificados[gi][0] === tab[0].t && m.classificados[gi][1] === tab[1].t, `seed ${seed}: grupo ${gi} classificou fora do top 2`)
    ok(tab.every(l => l.j === 6), `seed ${seed}: grupo ${gi} com time sem 6 jogos`)
  })
  // 5) oitavas: 1º × 2º de OUTRO grupo; volta na casa do 1º
  const grupoDe = new Map<number, number>(); m.grupos.forEach((g, gi) => g.forEach(t => grupoDe.set(t, gi)))
  const prim = new Set(m.classificados.map(c => c[0])), seg = new Set(m.classificados.map(c => c[1]))
  ok(m.ko.map(f => f.tipo).join() === 'oitavas,quartas,semi', `seed ${seed}: fases ${m.ko.map(f => f.tipo)}`)
  ok(m.ko[0].ties.length === 8 && m.ko[1].ties.length === 4 && m.ko[2].ties.length === 2, `seed ${seed}: tamanho das fases`)
  for (const t of m.ko[0].ties) {
    ok(grupoDe.get(t.h) !== grupoDe.get(t.a), `seed ${seed}: oitavas com dois do mesmo grupo`)
    ok(prim.has(t.a) && seg.has(t.h), `seed ${seed}: oitavas sem 1º × 2º (ou volta fora da casa do 1º)`)
  }
  // 6) ida e volta: mandos trocados, agregado certo, pênaltis só com agregado igual
  for (const f of m.ko) for (const t of f.ties) {
    ok(t.ida.h === t.h && t.ida.a === t.a && t.volta.h === t.a && t.volta.a === t.h, `seed ${seed}: mando da ida/volta`)
    ok(t.agg[0] === t.ida.gh + t.volta.ga && t.agg[1] === t.ida.ga + t.volta.gh, `seed ${seed}: agregado errado`)
    ok((t.agg[0] === t.agg[1]) === !!t.pen, `seed ${seed}: pênaltis sem empate no agregado (ou empate sem pênaltis)`)
    if (t.pen) ok(t.pen[0] !== t.pen[1], `seed ${seed}: pênaltis empatados`)
    const venc = t.agg[0] > t.agg[1] ? t.h : t.agg[1] > t.agg[0] ? t.a : t.pen![0] > t.pen![1] ? t.a : t.h
    ok(t.winner === venc, `seed ${seed}: vencedor do confronto errado`)
    ok(t.ida.ev.filter(g => g.home).length === t.ida.gh && t.volta.ev.filter(g => !g.home).length === t.volta.ga, `seed ${seed}: gols da súmula ≠ placar`)
  }
  // a chave anda: quem joga a fase seguinte venceu a anterior
  for (let fi = 1; fi < m.ko.length; fi++) {
    const venc = new Set(m.ko[fi - 1].ties.map(t => t.winner))
    ok(m.ko[fi].ties.every(t => venc.has(t.h) && venc.has(t.a)), `seed ${seed}: ${m.ko[fi].tipo} com quem não passou`)
  }
  // 7) final em jogo único, campeão definido
  const sv = new Set(m.ko[2].ties.map(t => t.winner))
  ok(sv.has(m.final.h) && sv.has(m.final.a) && m.final.h !== m.final.a, `seed ${seed}: final com quem não passou da semi`)
  ok((m.final.g[0] === m.final.g[1]) === !!m.final.pen, `seed ${seed}: pênaltis da final`)
  ok(m.campeao === m.final.winner && (m.campeao === m.final.h || m.campeao === m.final.a), `seed ${seed}: campeão indefinido`)
  ok(jogosDoPasso(m, LIB.FINAL).length === 1 && jogosDoPasso(m, LIB.OIT_VOLTA).length === 8 && jogosDoPasso(m, LIB.PAUSA).length === 0, `seed ${seed}: jogos por passo`)
  // 8) mesma semente = mesma copa
  const m2 = simulaLibertaSala(entrantesLiberta(ficha, 'u0'), ficha.seed)
  ok(JSON.stringify(m2) === JSON.stringify(m), `seed ${seed}: mesma semente deu outra copa`)
}
// 9) os passos casam com o relógio do banco (`esc_regional_clock`, p_rodadas 12, p_ko 1 → fim = 15)
ok(LIB.P_RODADAS + 2 + LIB.P_KO === LIB.FIM, 'FIM não bate com o banco')
for (let s = 1; s <= LIB.FIM; s++) {
  const banco = (s >= 1 && s <= LIB.P_RODADAS) || (s >= LIB.P_RODADAS + 2 && s <= LIB.P_RODADAS + 1 + LIB.P_KO)
  ok(libRodaBola(s) === banco, `passo ${s}: roda bola diferente do banco`)
}
// força: a máquina leva os 11 melhores
ok(xiDaMaquinaClube('Flamengo').xi.length === 11, 'XI da máquina do Flamengo')

// 🔎 um retrato pra olhar
{
  const ficha = montaFichaLiberta(classif, uidDe, picks, 4242, 1)
  const ents = entrantesLiberta(ficha)
  const m = simulaLibertaSala(ents, 4242)
  const tit = new Map<string, number>()
  for (let s = 1; s <= 400; s++) { const mm = simulaLibertaSala(ents, s * 101); const c = ents[mm.campeao].pais; tit.set(c, (tit.get(c) ?? 0) + 1) }
  console.log('Campeão (seed 4242):', ents[m.campeao].pais, '· artilheiro:', artilhariaLiberta(m)[0]?.name)
  console.log('Títulos em 400 copas:', [...tit].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, n]) => `${c} ${n}`).join(' · '))
}
if (falhas) { console.log(`\n❌ ${falhas} falha(s)`); process.exit(1) }
console.log('✅ Libertadores da sala: 32 clubes reais, 8 grupos em turno e returno, ida e volta até a semi, final única — tudo certo')
