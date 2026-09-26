// ─── ⚽🅰️🏃 TRAVA (26/09): A COPA DO MUNDO CONTA NA CARTA ────────────────────
// Diego: *"tem que contar todos os gols dele ali no jogo… gols totais, contando
// também a Copa do Mundo… também deve contar para o Bola de Ouro"*.
// Confere, em 40 Copas simuladas com o CÓDIGO DE VERDADE (import via vite), que
// `estatisticasDaCopa` não perde nem dobra gol, passe ou jogo; que pênalti de
// desempate não vira gol; e que o artilheiro bate com a artilharia da tela.
// E confere no fonte que a Bola de Ouro, o histórico e a ficha usam esses números.
// uso: node scripts/testa-copa-mundo-stats.mjs [--porta 5234]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5234')
let falhas = 0
const ok = (c, m) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) falhas++ }

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
p.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
const r = await p.evaluate(async () => {
  const CM = await import('/src/escalacao/copa-mundo.tsx')
  const PA = await import('/src/escalacao/paises.ts')
  const paises = PA.rankingSelecoes().slice(0, 24).map(x => x.pais)
  const entrants = paises.map((pais, i) => { const xi = CM.bestXI(CM.countryPool(pais), '4-3-3'); return { club: 'Clube ' + i, you: i === 0, pais, xi, str: 1 } })
  const erros = []
  let gols = 0, passes = 0, jogosT = 0
  for (let seed = 1; seed <= 40; seed++) {
    const w = CM.simulaCopaMundo(entrants, seed * 7919, 100, true)
    const st = CM.estatisticasDaCopa(w, entrants)
    let gEv = 0, aEv = 0, jogos = 0
    const conta = ev => { jogos++; for (const e of ev ?? []) { gEv++; if (e.assist) aEv++ } }
    for (const g of w.groups) for (const rd of g.matches) for (const m of rd) conta(m.ev)
    for (const t of [...w.r16, ...w.qf, ...w.sf]) conta(t.ev1)
    conta(w.final.ev)
    const gSt = st.reduce((n, l) => n + l.gols, 0), aSt = st.reduce((n, l) => n + l.ass, 0), jSt = st.reduce((n, l) => n + l.jogos, 0)
    if (gSt !== gEv) erros.push(`semente ${seed}: gols ${gSt} ≠ ${gEv}`)
    if (aSt !== aEv) erros.push(`semente ${seed}: passes ${aSt} ≠ ${aEv}`)
    if (jSt !== jogos * 22) erros.push(`semente ${seed}: jogos ${jSt} ≠ ${jogos * 22}`)
    const top = CM.artilhariaDaCopa(w)[0]
    if (top && top.goals !== Math.max(...st.map(l => l.gols))) erros.push(`semente ${seed}: artilheiro não bate`)
    gols += gEv; passes += aEv; jogosT += jogos
  }
  return { erros, gols, passes, jogosT }
})
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n🌍 COPA DO MUNDO NA CARTA DO JOGADOR\n')
console.log(`   40 Copas · ${r.jogosT} jogos · ${r.gols} gols · ${r.passes} assistências`)
ok(r.erros.length === 0, 'todo gol, passe e jogo chega na carta certa (nada perdido, nada dobrado)' + (r.erros.length ? ` — ${r.erros.slice(0, 3).join(' · ')}` : ''))

const py = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
const st = readFileSync('src/escalacao/store.tsx', 'utf8')
const cm = readFileSync('src/escalacao/copa-mundo.tsx', 'utf8')
ok(/onStats\?\.\(estatisticasDaCopa\(world, entrants\)\)[\s\S]{0,400}saveCopaSave\(seed, \{ \.\.\.cur, played:/.test(cm), 'a Copa entrega os números ANTES de se marcar como jogada')
ok(/case 'COPA_MUNDO_STATS'[\s\S]{0,200}copaMundoStats\?\.season === action\.season\) return s/.test(st), 'o save grava uma vez só por temporada')
ok(/melhorDoMundo\(\[\.\.\.scorersAll, \.\.\.\(copa\?\.scorersAll \?\? \[\]\), \.\.\.cmListas\.sc\]/.test(py), '🥇 a Bola de Ouro soma liga + copas + Copa do Mundo')
ok(/somaCartas\(somaCartas\(goalsByCard, copa\?\.goalsByCard\), cmPorCarta\.gl\)/.test(py) && /somaCartas\(somaCartas\(assistsByCard, copa\?\.assistsByCard\), cmPorCarta\.as\)/.test(py), '⚽🅰️ a ficha (temporada) soma a Copa do Mundo')
ok(/jogosCard: jogosExtra/.test(py) && /j: \(jogos\[c\.id\] \?\? 0\) \+ \(jogosCard\?\.\[c\.id\] \?\? 0\)/.test(st), '🏃 os jogos de copa e de Copa do Mundo vão pro "no seu clube" na virada')
ok(/if \(!copaFinished \|\| !copa \|\| !me\) return o/.test(py), '🙈 jogo de copa só conta com a Copa encerrada na tela (sem spoiler)')
console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
