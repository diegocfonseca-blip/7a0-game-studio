// 🌍 CARREIRA ONLINE — a Copa do Mundo é UMA só.   node scripts/carreira-online/testa-copa-mundo.mjs
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
const C = await vite.ssrLoadModule('/src/escalacao/co2-copa-mundo.ts')
const { simulaCopaMundo } = await vite.ssrLoadModule('/src/escalacao/copa-mundo.tsx')
const { rankingSelecoes } = await vite.ssrLoadModule('/src/escalacao/paises.ts')
let falhas = 0
const ok = (c, m) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const paises = rankingSelecoes().slice(0, 32).map(p => p.pais)
// top 32: amigo 0 em 3º, amigo 1 em 5º, amigo 2 em 20º, o resto bot
const top = Array.from({ length: 32 }, (_, i) => ({ name: `Clube ${i + 1}`, mgrId: i === 2 ? 0 : i === 4 ? 1 : i === 19 ? 2 : null }))
const S = 5
let esc = {}
ok(C.vezDaCopa(top, esc, [], S) === 0, 'o mais alto no ranking escolhe primeiro')
ok(JSON.stringify(C.convitesDaCopa(top, paises, 0, esc, S)) === JSON.stringify(paises), 'convites = TODAS as seleções (o de cima escolhe primeiro)')
const p0 = paises[4]
esc = { 0: { season: S, pais: p0, form: '4-3-3' } }
ok(C.vezDaCopa(top, esc, [], S) === 1, 'depois dele, o próximo amigo')
ok(!C.convitesDaCopa(top, paises, 1, esc, S).includes(p0), 'a seleção que o amigo levou some dos convites do outro')
esc[1] = { season: S, pais: null }
ok(C.vezDaCopa(top, esc, [], S) === 2, 'quem recusou não segura a fila')
ok(C.vezDaCopa(top, esc, [2], S) === null, 'o dono pulou quem sumiu: todo mundo decidido')
esc[2] = { season: S, pais: paises[25], form: '4-4-2' }
const porAparelho = [0, 1, 2].map(meu => C.entrantsDaCopa(top, paises, esc, S, meu))
const semYou = e => JSON.stringify(e.map(x => [x.club, x.pais, x.humano ?? false, x.xi.map(c => c.name)]))
ok(porAparelho.every(e => semYou(e) === semYou(porAparelho[0])), 'as 32 seleções saem IGUAIS em todo aparelho')
ok(new Set(porAparelho[0].map(e => e.pais)).size === 32, 'nenhuma seleção repetida')
ok(porAparelho[0][2].pais === p0 && porAparelho[0][2].humano && porAparelho[0][19].pais === paises[25], 'cada amigo com a seleção que escolheu')
ok(porAparelho[0][2].you && !porAparelho[1][2].you, '"você" só no aparelho de cada um')
const camp = e => { const w = simulaCopaMundo(e, 123456, S, true, true, true); return JSON.stringify([w.champion ?? w.campeao ?? null, (w.rounds ?? w.fases ?? []).length]) }
const r0 = JSON.stringify(simulaCopaMundo(porAparelho[0], 123456, S, true, true, true), (k, v) => k === 'you' || k === 'm2' ? undefined : v)
ok(porAparelho.every(e => JSON.stringify(simulaCopaMundo(e, 123456, S, true, true, true), (k, v) => k === 'you' || k === 'm2' ? undefined : v) === r0), 'a Copa inteira (com motor novo) sai IGUAL nos 3 aparelhos')
// ⏱️ relógio/pular na Copa
const r0b = { 0: { season: S, pais: paises[3], reserva: true } }
ok(C.vezDaCopa(top, r0b, [], S) === 0 && !C.convitesDaCopa(top, paises, 1, r0b, S).includes(paises[3]), 'reservou a seleção: ainda convocando, mas ela já saiu da lista dos outros')
const au = C.escolhaCopaAuto(S, paises[3], paises, new Set())
ok(au.pais === paises[3] && au.xiKeys.length === 11, 'convocação esgotada: a seleção reservada com 11')
const au2 = C.escolhaCopaAuto(S, null, paises, new Set([paises[31]]))
ok(au2.pais && au2.pais !== paises[31] && au2.xiKeys.length === 11, `escolha esgotada: a pior seleção livre (${au2.pais})`)
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ Copa do Mundo da carreira online ok')
await vite.close()
process.exit(falhas ? 1 : 0)
