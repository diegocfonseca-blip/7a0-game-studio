// ─── 🚫🧍 TRAVA: PERNA-DE-PAU NÃO VIRA ESTATÍSTICA (19/09) ──────────────────
//
// Ordem do Diego, com print na mão (o 🥇 Zé Ninguém, Várzea 2000, Bola de Ouro da
// T43 com 39 assistências): *"jogadores fakes não quero que tenha estatísticas pra
// eles, nem assistência e nem gols"*.
//
// ⚠️ DUAS SESSÕES ATACARAM ISTO NO MESMO DIA, e a régua ficou sendo a da outra
//    (`ehFake` em `store.tsx`, que já foi pra main): quem decide gol e assistência
//    **não sorteia carta de mentira**. Esta trava passou a apontar pra ela — ter
//    duas réguas pra mesma regra é fábrica de bug, que é justo o que ele odeia.
//
// O que esta trava segura:
//  1. 🔎 A RÉGUA reconhece os dois tipos de tapa-buraco: o filler dos times de
//     fundo (clube `Várzea`/`Pickup`, sem selo) e a incógnita (`fake: true`).
//  2. 🛡️ E NENHUM JOGADOR DE VERDADE é confundido — varre o baralho INTEIRO.
//  3. 🧹 O PASSADO é limpo ao abrir o save (artilheiros, garçons e Bola de Ouro).
//  4. 🎮 O JOGO RÁPIDO / SALA ONLINE também peneira. A régua da carreira não passa
//     por lá (`simMatch` é outro motor), e em sala grande os bots têm incógnita.
//  5. 🎯 SOBRA DE VERDADE ANTES DO PERNA-DE-PAU: o time de fundo que vendeu e não
//     repôs pega um jogador REAL que está sobrando; o filler só entra se não
//     sobrou mais ninguém da posição (*"ele poderia ganhar um atacante de sobra"*).
//
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
  const st = await import('/src/escalacao/store.tsx')
  const d = await import('/src/escalacao/data.ts')
  const falhas = []
  const ok = (cond, msg) => { if (!cond) falhas.push(msg) }
  const ehFake = st.ehFake

  // 1️⃣ a régua reconhece os dois tipos
  const filler = { id: 'fil-7', name: 'Zé Ninguém', club: 'Várzea', year: 2000, pos: 'ATA', fame: 1, lo: 32, hi: 40 }
  const cestinha = { id: 'fil-9', name: 'Trapalhão', club: 'Pickup', year: 2000, pos: 'ATA', fame: 1, lo: 30, hi: 38 }
  const incog = d.makeIncognita('ATA', 3, false, () => 0.5, 'x')
  ok(ehFake(filler), 'filler de várzea não foi reconhecido')
  ok(ehFake(cestinha), 'filler do basquete (Pickup) não foi reconhecido')
  ok(ehFake(incog), 'incógnita não foi reconhecida')
  ok(incog.fake === true, 'makeIncognita parou de marcar `fake: true` — a régua depende disso')

  // 2️⃣ nenhum jogador de verdade é confundido
  const todas = [...Object.values(d.CATALOG).flat(), ...Object.values(d.CATALOG_EU).flat(), ...Object.values(d.CATALOG_WORLD).flat()]
  const falsos = todas.filter(c => ehFake(c))
  ok(falsos.length === 0, `${falsos.length} carta(s) REAIS marcadas como perna-de-pau (ex.: ${falsos.slice(0, 3).map(c => `${c.name}/${c.club}`).join(', ')})`)
  ok(todas.length > 1000, 'o baralho veio pequeno demais — a varredura não valeu')

  // 3️⃣ o passado é limpo quando o save abre
  const lin = (name, club, extra) => ({ name, club, year: 2000, teamName: 'Time X', teamId: 9, div: 'A', you: false, human: false, ...extra })
  const save = {
    careerOnline: true, seasonNo: 3,
    careerScorersAll: { a: lin('Zé Ninguém', 'Várzea', { goals: 120 }), b: lin('Romário', 'Vasco', { goals: 30 }) },
    careerAssistsAll: { a: lin('Trapalhão', 'Várzea', { assists: 80 }), b: lin('Rivellino', 'Corinthians', { assists: 12 }) },
    careerMelhorMundo: { 1: lin('Bola Murcha', 'Várzea', { total: 80 }), 2: lin('Romário', 'Vasco', { total: 30 }) },
  }
  const limpo = st.migrateTeamNames(JSON.parse(JSON.stringify(save)))
  const nomes = o => Object.values(o ?? {}).map(x => x.name).sort()
  ok(JSON.stringify(nomes(limpo.careerScorersAll)) === JSON.stringify(['Romário']), `artilheiros depois da limpeza: ${nomes(limpo.careerScorersAll).join(', ')}`)
  ok(JSON.stringify(nomes(limpo.careerAssistsAll)) === JSON.stringify(['Rivellino']), `garçons depois da limpeza: ${nomes(limpo.careerAssistsAll).join(', ')}`)
  ok(JSON.stringify(nomes(limpo.careerMelhorMundo)) === JSON.stringify(['Romário']), `Bola de Ouro depois da limpeza: ${nomes(limpo.careerMelhorMundo).join(', ')}`)
  ok(limpo.careerScorersAll.b?.goals === 30, 'a limpeza mexeu nos gols de quem é de verdade')

  // 4️⃣ o JOGO RÁPIDO / SALA ONLINE peneira (motor próprio, `simMatch`)
  const fonte = await (await fetch('/src/escalacao/store.tsx')).text()
  ok(/fake: ehFake\(c\)/.test(fonte), 'o sorteio do gol do rápido/online marca quem é perna-de-pau')
  ok(/if \(golFake\) return|if \(!golFake\) \{/.test(fonte), 'e o gol dele NÃO entra na artilharia do rápido/online')
  ok(/if \(p\.fake\) return/.test(fonte), 'a cestinha do basquete também peneira')
  ok(/!carta \|\| !ehFake\(carta\)/.test(fonte), 'e a assistência do rápido/online segue a mesma régua')

  // 5️⃣ 🎯 sobra de verdade antes do perna-de-pau
  const onze = (sobras) => st.fillToEleven(
    [{ id: 'g', name: 'Goleiro', club: 'X', year: 2000, pos: 'GOL', fame: 2, lo: 60, hi: 70 }]
      .concat([...Array(2)].map((_, i) => ({ id: `l${i}`, name: 'Lateral', club: 'X', year: 2000, pos: 'LAT', fame: 2, lo: 60, hi: 70 })))
      .concat([...Array(2)].map((_, i) => ({ id: `z${i}`, name: 'Zagueiro', club: 'X', year: 2000, pos: 'ZAG', fame: 2, lo: 60, hi: 70 })))
      .concat([...Array(3)].map((_, i) => ({ id: `m${i}`, name: 'Meia', club: 'X', year: 2000, pos: 'MEI', fame: 2, lo: 60, hi: 70 })))
      .concat([...Array(2)].map((_, i) => ({ id: `a${i}`, name: 'Atacante', club: 'X', year: 2000, pos: 'ATA', fame: 2, lo: 60, hi: 70 }))),
    '4-3-3', () => 0.5, sobras,
  )
  const comSobra = onze({ GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [{ name: 'Atacante de Sobra', club: 'Sobra FC', year: 1999, pos: 'ATA', fame: 2, lo: 62, hi: 72 }] })
  const novo = comSobra[comSobra.length - 1]
  ok(comSobra.length === 11, `o time devia fechar em 11 e fechou em ${comSobra.length}`)
  ok(!ehFake(novo) && novo.name === 'Atacante de Sobra', `com sobra real na fila, o time pegou "${novo.name}"`)
  const semSobra = onze({ GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] })
  ok(semSobra.length === 11, 'sem sobra real, o time ficou com menos de 11 — isso não pode')
  ok(ehFake(semSobra[semSobra.length - 1]), 'sem sobra real, devia entrar o perna-de-pau (é a rede de segurança)')

  return { falhas, cartas: todas.length }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log(`\n🚫🧍 PERNA-DE-PAU FORA DA ESTATÍSTICA · ${r.cartas} cartas reais varridas\n`)
if (r.falhas.length) {
  for (const f of r.falhas) console.log(`   🔴 ${f}`)
  console.log(`\n❌ ${r.falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log('✅ perna-de-pau não entra em artilharia, garçons nem Bola de Ouro — na carreira,')
console.log('   no rápido e no online — e a sobra de verdade tem a vez antes dele.\n')
