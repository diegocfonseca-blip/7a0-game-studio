// ─── 👟 TRAVA: SÓ QUEM ESTÁ EM CAMPO BATE O PÊNALTI ─────────────────────────
//
// Relato do Diego (25/09), com print da tela de pênalti: *"Zico e Garrincha
// estavam no banco de reserva e mesmo assim apareceram pra bater pênalti. Tá
// errado"*.
//
// Estava mesmo: a lista de cobradores saía do elenco INTEIRO (22 cartas)
// ordenado por nível, então os melhores do grupo apareciam mesmo sentados no
// banco — jogador entrando em campo sem ter sido escalado, que é o tipo de
// comportamento fora das regras que ele não aceita.
//
// Esta trava roda a função de verdade (`cobradoresDoJogo`) e exige:
//   1. 🪑 ninguém do banco na lista;
//   2. 🔁 se o técnico mexeu no INTERVALO, quem vale é o time do 2º tempo;
//   3. 🩹 suspenso/lesionado fora;
//   4. 🧤 o goleiro fora (ele está no outro gol);
//   5. 🛟 a lista NUNCA volta vazia (sem escalação, cai no elenco) — pênalti sem
//      ninguém pra bater seria pior que a lista errada.
//
// uso: node scripts/testa-cobrador.mjs [--porta 5245]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5245')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
p.on('pageerror', e => console.log('ERRO NA PÁGINA:', e.message))
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const P = await import('/src/escalacao/pyramidseason.tsx')
  const { cobradoresDoJogo, seedCpuSquads } = P
  // 🧍 elenco de 22 (11 titulares + 11 reservas), como o do jogo — dois elencos
  // de bot colados, com ids únicos. Com só 11 cartas o teste do BANCO não mediria
  // nada, que é justamente o que o Diego pegou.
  const receitas = seedCpuSquads([], 20250824, 'br', true)
  const chaves = Object.keys(receitas)
  const squad = [...receitas[chaves[0]], ...receitas[chaves[1]]].map((c, i) => ({ ...c, id: `c${i}` }))

  // escalação: 1 GOL, 2 LAT, 2 ZAG, 4 MEI, 2 ATA — os 11 primeiros de cada posição
  const pega = (pos, n) => squad.filter(c => c.pos === pos).slice(0, n)
  const xi = [...pega('GOL', 1), ...pega('LAT', 2), ...pega('ZAG', 2), ...pega('MEI', 4), ...pega('ATA', 2)]
  const xiIds = xi.map(c => c.id)
  const banco = squad.filter(c => !xiIds.includes(c.id))

  const lista = cobradoresDoJogo(squad, xiIds)
  const nomes = lista.map(c => c.name)

  // 🔁 troca do intervalo: um reserva ENTRA e um titular SAI
  const entrou = banco.find(c => c.pos === 'ATA')
  const saiu = xi.find(c => c.pos === 'ATA')
  const xi2 = xiIds.filter(id => id !== saiu.id).concat(entrou.id)
  const listaXi2 = cobradoresDoJogo(squad, xi2)

  // 🩹 suspenso
  const alvo = lista[0]
  const listaSemSuspenso = cobradoresDoJogo(squad, xiIds, alvo.id)

  return {
    total: lista.length,
    doBanco: lista.filter(c => !xiIds.includes(c.id)).map(c => c.name),
    goleiros: lista.filter(c => c.pos === 'GOL').map(c => c.name),
    ordenada: nomes.length > 1 && lista.every((c, i) => i === 0 || (lista[i - 1].lo + lista[i - 1].hi) >= (c.lo + c.hi)),
    primeiros: nomes.slice(0, 4),
    // intervalo
    entrouAparece: listaXi2.some(c => c.id === entrou.id),
    saiuSumiu: !listaXi2.some(c => c.id === saiu.id),
    // suspenso
    suspensoSumiu: !listaSemSuspenso.some(c => c.id === alvo.id),
    suspensoNome: alvo.name,
    // 🛟 sem escalação nenhuma
    semEscalacao: cobradoresDoJogo(squad, undefined).length,
    listaVazia: cobradoresDoJogo([], xiIds).length,
  }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n👟 QUEM BATE O PÊNALTI — só quem está em campo\n')
console.log(`   cobradores na lista ......... ${r.total} (de um elenco de 22)`)
console.log(`   gente do BANCO na lista ..... ${r.doBanco.length ? r.doBanco.join(', ') : 'nenhum ✅'}`)
console.log(`   goleiro na lista ............ ${r.goleiros.length ? r.goleiros.join(', ') : 'nenhum ✅'}`)
console.log(`   ordem por nível ............. ${r.ordenada ? 'ok ✅' : 'FORA DE ORDEM'}`)
console.log(`   os 4 primeiros .............. ${r.primeiros.join(' · ')}`)
console.log(`   quem entrou no intervalo .... ${r.entrouAparece ? 'aparece ✅' : 'NÃO aparece'}`)
console.log(`   quem saiu no intervalo ...... ${r.saiuSumiu ? 'sumiu ✅' : 'CONTINUA na lista'}`)
console.log(`   suspenso (${r.suspensoNome}) ..... ${r.suspensoSumiu ? 'fora ✅' : 'AINDA na lista'}`)
console.log(`   sem escalação (cai no elenco) ${r.semEscalacao} cobradores`)

const erros = []
if (r.total < 8) erros.push(`a lista ficou com ${r.total} cobradores — a tela mostra até 8`)
if (r.doBanco.length) erros.push(`gente do BANCO na lista: ${r.doBanco.join(', ')}`)
if (r.goleiros.length) erros.push(`goleiro na lista: ${r.goleiros.join(', ')}`)
if (!r.ordenada) erros.push('a lista não está ordenada pelo nível')
if (!r.entrouAparece) erros.push('quem entrou no intervalo não pode ir pra bola')
if (!r.saiuSumiu) erros.push('quem saiu no intervalo continua podendo bater')
if (!r.suspensoSumiu) erros.push('o suspenso/lesionado continua na lista')
if (r.semEscalacao === 0) erros.push('sem escalação a lista ficou VAZIA — pênalti sem ninguém pra bater')

if (erros.length) { console.log('\n❌ REPROVADO:'); for (const e of erros) console.log('   ·', e); process.exit(1) }
console.log('\n✅ passou: só quem está em campo vai pra bola.\n')
