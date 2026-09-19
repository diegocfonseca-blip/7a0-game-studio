// ─── 🃏🚫 TRAVA: JOGADOR TAPA-BURACO NÃO ENTRA EM ESTATÍSTICA (19/09) ───────
//
// Ordem do Diego: *"tem um monte de jogador fake, Zé Ninguém, Trapalhão, ganhando
// a bola de ouro. Eles podem fazer gols ou assistência durante o jogo, não tem
// problema nenhum. Mas não podem contar pra estatística de artilharia,
// assistência e bola de ouro"*.
//
// O que esta trava protege, uma seção por risco:
//  1. 🔎 QUEM É TAPA-BURACO o código reconhece — filler de várzea (`fil-`, clube
//     Várzea/Pickup) e incógnita (`inc-`, `fake: true`).
//  2. 🛡️ E NENHUM JOGADOR DE VERDADE é confundido com um. Varre o baralho
//     INTEIRO (BR + Europa + Mundo) e exige zero falso positivo — é a parte que
//     protege o jogador real de sumir do Rank por engano.
//  3. 🥇 A BOLA DE OURO nunca vai pro tapa-buraco, nem quando ele lidera com
//     folga (é exatamente o caso que ele viu na tela).
//  4. 🧹 O PASSADO É LIMPO ao abrir o save: quem já tinha entrado no histórico de
//     todos os tempos sai — artilheiros, garçons e os anos de Bola de Ouro.
//  5. 🅰️ GOL E ASSISTÊNCIA ANDAM JUNTOS (regra permanente dele): se um dia
//     alguém peneirar só o gol, esta trava reprova.
//
// Roda o CÓDIGO DE VERDADE no navegador (não uma cópia da regra aqui).
// uso: node scripts/testa-fake-stats.mjs [--porta 5237]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5237')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const f = await import('/src/escalacao/fake.ts')
  const ps = await import('/src/escalacao/pyramidseason.tsx')
  const st = await import('/src/escalacao/store.tsx')
  const d = await import('/src/escalacao/data.ts')
  const falhas = []
  const ok = (cond, msg) => { if (!cond) falhas.push(msg) }

  // 1️⃣ reconhece os dois tipos de tapa-buraco
  const filler = { id: 'fil-7', name: 'Zé Ninguém', club: 'Várzea', year: 2000, pos: 'ATA', fame: 1, lo: 32, hi: 40 }
  const incog = d.makeIncognita('ATA', 3, false, () => 0.5, 'x')
  const cestinha = { id: 'fil-9', name: 'Trapalhão', club: 'Pickup', year: 2000, pos: 'ATA', fame: 1, lo: 30, hi: 38 }
  ok(f.ehCartaFake(filler), 'filler de várzea não foi reconhecido como tapa-buraco')
  ok(f.ehCartaFake(incog), 'incógnita não foi reconhecida como tapa-buraco')
  ok(f.ehCartaFake(cestinha), 'filler do basquete (Pickup) não foi reconhecido')
  ok(incog.fake === true && incog.id.startsWith('inc-'), 'makeIncognita mudou de forma — remedir a trava')
  ok(f.ehLinhaFake({ name: 'Zé Ninguém', club: 'Várzea' }), 'linha de histórico do filler não foi reconhecida')
  ok(f.ehLinhaFake({ name: incog.name, club: incog.club }), 'linha de histórico da incógnita não foi reconhecida')

  // 2️⃣ NENHUM jogador de verdade é confundido
  const todas = [...Object.values(d.CATALOG).flat(), ...Object.values(d.CATALOG_EU).flat(), ...Object.values(d.CATALOG_WORLD).flat()]
  const falsos = todas.filter(c => f.ehCartaFake(c) || f.ehLinhaFake({ name: c.name, club: c.club }))
  ok(falsos.length === 0, `${falsos.length} carta(s) REAIS marcadas como tapa-buraco (ex.: ${falsos.slice(0, 3).map(c => `${c.name}/${c.club}`).join(', ')})`)
  ok(todas.length > 1000, 'o baralho veio pequeno demais — a varredura não valeu')

  // 3️⃣ a Bola de Ouro nunca vai pro tapa-buraco
  const lin = (name, club, extra) => ({ name, club, year: 2000, teamName: 'Time X', teamId: 9, div: 'A', you: false, human: false, ...extra })
  const melhor = ps.melhorDoMundo(
    [lin('Zé Ninguém', 'Várzea', { goals: 99, fake: true }), lin('Romário', 'Vasco', { goals: 10 })],
    [lin('Zé Ninguém', 'Várzea', { assists: 99, fake: true }), lin('Romário', 'Vasco', { assists: 4 })],
  )
  ok(melhor && melhor.name === 'Romário', `a Bola de Ouro foi pro ${melhor ? melhor.name : 'ninguém'} — devia ser do Romário`)
  // e a peneira vale pra quem só é reconhecido pelo NOME (linha velha, sem `fake`)
  const melhor2 = ps.melhorDoMundo([lin('Trapalhão', 'Várzea', { goals: 50 }), lin('Romário', 'Vasco', { goals: 3 })], [])
  ok(melhor2 && melhor2.name === 'Romário', 'linha velha sem o campo `fake` ainda levou a Bola de Ouro')

  // 5️⃣ gol e assistência peneirados IGUAL
  ok(ps.semFake([lin('Zé Ninguém', 'Várzea', { goals: 9 }), lin('Romário', 'Vasco', { goals: 1 })]).length === 1, 'a peneira deixou passar tapa-buraco na artilharia')
  ok(ps.semFake([lin('Zé Ninguém', 'Várzea', { assists: 9 }), lin('Romário', 'Vasco', { assists: 1 })]).length === 1, 'a peneira deixou passar tapa-buraco nos garçons')

  // 4️⃣ o PASSADO é limpo quando o save abre
  const save = {
    careerOnline: true, seasonNo: 3,
    careerScorersAll: {
      'zé ninguém|várzea|2000': lin('Zé Ninguém', 'Várzea', { goals: 120 }),
      'romário|vasco|1994': lin('Romário', 'Vasco', { goals: 30 }),
    },
    careerAssistsAll: {
      'trapalhão|várzea|2000': lin('Trapalhão', 'Várzea', { assists: 80 }),
      'rivellino|corinthians|1974': lin('Rivellino', 'Corinthians', { assists: 12 }),
    },
    careerMelhorMundo: {
      1: lin('Bola Murcha', 'Várzea', { goals: 40, assists: 40, total: 80 }),
      2: lin('Romário', 'Vasco', { goals: 20, assists: 10, total: 30 }),
    },
  }
  const limpo = st.migrateTeamNames(JSON.parse(JSON.stringify(save)))
  const nomes = o => Object.values(o ?? {}).map(x => x.name).sort()
  ok(JSON.stringify(nomes(limpo.careerScorersAll)) === JSON.stringify(['Romário']), `artilheiros depois da limpeza: ${nomes(limpo.careerScorersAll).join(', ')}`)
  ok(JSON.stringify(nomes(limpo.careerAssistsAll)) === JSON.stringify(['Rivellino']), `garçons depois da limpeza: ${nomes(limpo.careerAssistsAll).join(', ')}`)
  ok(JSON.stringify(nomes(limpo.careerMelhorMundo)) === JSON.stringify(['Romário']), `Bola de Ouro depois da limpeza: ${nomes(limpo.careerMelhorMundo).join(', ')}`)
  // e o de verdade não perde nada
  ok(limpo.careerScorersAll['romário|vasco|1994']?.goals === 30, 'a limpeza mexeu nos gols de quem é de verdade')

  return { falhas, cartas: todas.length }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log(`\n🃏🚫 TAPA-BURACO FORA DA ESTATÍSTICA · ${r.cartas} cartas reais varridas\n`)
if (r.falhas.length) {
  for (const f of r.falhas) console.log(`   🔴 ${f}`)
  console.log(`\n❌ ${r.falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log('✅ tapa-buraco marca e dá assistência no jogo, mas não entra em artilharia,')
console.log('   garçons nem Bola de Ouro — e nenhum jogador de verdade foi confundido.\n')
