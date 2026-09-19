// ─── 🥇 TRAVA DO MELHOR DO MUNDO (gol + assistência, 19/09) ─────────────────
//
// Ideia do Diego, com as palavras dele: *"quero q tenha do jogador q teve mais
// gols C assistência junto.. Esse jogdor será considerado o melhor do mundo no
// ano. Será o Prêmio da Fifa de melhor do mundo. Lembrando q N é o artilheiro e
// Tb N é o garçom. E o cara q conseguiu unir os dois juntos"*.
//
// O que esta trava protege:
//  1. 🥇 NÃO É O ARTILHEIRO NEM O GARÇOM. É o caso central dele, e o mais fácil
//     de quebrar sem querer: quem faz 23 (12 gols + 11 passes) tem que ganhar de
//     quem faz 20 gols e de quem dá 20 assistências.
//  2. ⚖️ O DESEMPATE É FIXO E DETERMINÍSTICO. No online cada aparelho calcula o
//     prêmio no próprio celular — se desempatasse por sorte, dois amigos veriam
//     "melhores do mundo" diferentes na mesma sala.
//  3. 🃏 É POR CARTA, nunca por nome (regra dele de hoje): senão os dois Cafus
//     juntariam os números e um deles levaria um prêmio que não fez.
//  4. 🏆 CONTA AS COPAS junto com a liga (mesma régua do histórico).
//  5. 🈳 Mundo sem gol nenhum não premia ninguém (em vez de cravar um qualquer).
//
// Roda o CÓDIGO DE VERDADE no navegador, não uma cópia da regra aqui.
// uso: node scripts/testa-melhor-mundo.mjs [--porta 5232]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5232')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const { melhorDoMundo } = await import('/src/escalacao/pyramidseason.tsx')
  const G = (name, club, year, goals, div = 'A', teamName = 'Time') => ({ name, club, year, teamName, teamId: 1, div, goals, you: false, human: false })
  const A = (name, club, year, assists, div = 'A', teamName = 'Time') => ({ name, club, year, teamName, teamId: 1, div, assists, you: false, human: false })

  // 1) o caso DELE: o que une os dois ganha do artilheiro e do garçom
  const caso1 = melhorDoMundo(
    [G('Artilheiro', 'Santos', 1970, 20), G('Completo', 'Milan', 2004, 12)],
    [A('Garcom', 'Vasco', 2000, 20), A('Completo', 'Milan', 2004, 11)],
  )
  // 2) empate no total → mais GOLS leva
  const caso2 = melhorDoMundo(
    [G('MaisGol', 'Milan', 2004, 15), G('MenosGol', 'Inter', 2010, 5)],
    [A('MaisGol', 'Milan', 2004, 5), A('MenosGol', 'Inter', 2010, 15)],
  )
  // 3) empate total E gols → divisão mais alta
  const caso3 = melhorDoMundo(
    [G('DaVarzea', 'Bahia', 2012, 10, 'V'), G('DaSerieA', 'Milan', 2004, 10, 'A')],
    [A('DaVarzea', 'Bahia', 2012, 10, 'V'), A('DaSerieA', 'Milan', 2004, 10, 'A')],
  )
  // 4) empate em tudo → alfabético (nunca no sorteio)
  const caso4 = melhorDoMundo(
    [G('Zico', 'Flamengo', 1981, 10), G('Ademir', 'Vasco', 1950, 10)],
    [A('Zico', 'Flamengo', 1981, 10), A('Ademir', 'Vasco', 1950, 10)],
  )
  // 5) por CARTA: dois xarás não juntam números
  const caso5 = melhorDoMundo(
    [G('Cafu', 'Milan', 2004, 10), G('Cafu', 'São Paulo', 1993, 10), G('Outro', 'Inter', 2010, 15)],
    [A('Cafu', 'Milan', 2004, 5), A('Cafu', 'São Paulo', 1993, 5), A('Outro', 'Inter', 2010, 6)],
  )
  // 6) a COPA soma junto com a liga (duas listas, mesma carta)
  const caso6 = melhorDoMundo(
    [G('SoLiga', 'Inter', 2010, 18), G('LigaMaisCopa', 'Milan', 2004, 10), G('LigaMaisCopa', 'Milan', 2004, 6)],
    [A('LigaMaisCopa', 'Milan', 2004, 4)],
  )
  // 7) mundo sem gol nenhum
  const caso7 = melhorDoMundo([], [])
  const caso8 = melhorDoMundo([G('Zerado', 'Inter', 2010, 0)], [])
  return {
    caso1, caso2: caso2?.name, caso3: caso3?.name, caso4: caso4?.name,
    caso5: caso5 && { name: caso5.name, total: caso5.total },
    caso6: caso6 && { name: caso6.name, goals: caso6.goals, total: caso6.total },
    caso7, caso8,
  }
})
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

console.log('\n1) 🥇 não é o artilheiro nem o garçom — é quem une os dois')
ok(r.caso1?.name === 'Completo', `ganhou o "${r.caso1?.name}" (${r.caso1?.goals} gols + ${r.caso1?.assists} ass = ${r.caso1?.total})`)
ok(r.caso1?.total === 23, 'com 23, na frente dos 20 do artilheiro e dos 20 do garçom')
ok(r.caso1?.club === 'Milan' && r.caso1?.year === 2004, 'e o prêmio sai com a CARTA dele (clube e ano), não só o nome')

console.log('\n2) ⚖️ o desempate é fixo, e nunca no sorteio')
ok(r.caso2 === 'MaisGol', 'empate no total → quem fez mais GOLS leva')
ok(r.caso3 === 'DaSerieA', 'empate no total e nos gols → divisão mais alta leva')
ok(r.caso4 === 'Ademir', 'empate em tudo → ordem alfabética (determinístico em qualquer aparelho)')

console.log('\n3) 🃏 por CARTA, nunca por nome')
ok(r.caso5?.name === 'Outro' && r.caso5?.total === 21, `os dois Cafus (15 cada) NÃO viraram um de 30 — ganhou o Outro com ${r.caso5?.total}`)

console.log('\n4) 🏆 a COPA soma junto com a liga')
ok(r.caso6?.name === 'LigaMaisCopa', 'quem fez 10 na liga + 6 na copa + 4 passes passa quem fez 18 só de liga')
ok(r.caso6?.goals === 16 && r.caso6?.total === 20, `e a conta bate: ${r.caso6?.goals} gols · total ${r.caso6?.total}`)

console.log('\n5) 🈳 mundo sem gol não premia ninguém')
ok(r.caso7 === null, 'temporada vazia não crava um "melhor do mundo" do nada')
ok(r.caso8 === null, 'e quem tem 0 + 0 também não leva taça')

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
