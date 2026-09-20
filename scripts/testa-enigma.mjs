// ─── 🕵️ TRAVA: O JOGADOR ENIGMA NÃO PODE VAZAR ──────────────────────────────
//
// Diego (20/09): *"ele só tira o lugar de outro jogador, igual já existe com o
// jogador surpresa. É um jogador que já iria pro leilão, e aí a gente faz essa
// opção nele, dele ficar escondido com a dica. Mas não vai ter que botar um
// jogador a mais."*
//
// O que esta trava protege, em ordem de gravidade:
//
// 1. 🙈 **NÃO VAZA NO "INSPECIONAR".** Esta é a razão de a trava existir. O 🎁
//    Surpresa já teve esse bug: o nome real ia pro HTML e só era BORRADO por
//    CSS — quem abrisse o inspecionar lia o jogador e dava lance sabendo de
//    tudo. O Enigma esconde TRÊS coisas (nome, clube e ano), então são três
//    chances de vazar. Aqui o teste abre o jogo DE VERDADE e procura os três no
//    HTML da página.
// 2. 🃏 **NÃO É CARTA A MAIS.** Ele toma o lugar de uma carta que já ia pro
//    pregão — o baralho tem que ter exatamente o mesmo tamanho.
// 3. 🎲 **NÃO MEXE NO SORTEIO DO LEILÃO.** Se o Enigma puxasse um número da fila
//    do acaso, TODOS os lances dos bots mudariam e o pregão às cegas de hoje
//    fecharia diferente — é o que o `npm run ascegas` existe pra impedir.
// 4. 🎁 **NUNCA É A MESMA CARTA DO SURPRESA** (senão um dos dois some).
// 5. 🕰️ **A DICA É VERDADE** — sai do ano da própria carta.
//
// uso: node scripts/testa-enigma.mjs [--porta 5254]
//      (liga o modo pelo interruptor de bancada `bancadaEnigma`, na página que
//       já está aberta — não encosta em arquivo nenhum)
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5254')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 940 } })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

// ─── 1) O MOTOR ─────────────────────────────────────────────────────────────
const motor = await p.evaluate(async () => {
  const st = await import('/src/escalacao/store.tsx')
  // 🧪 liga o modo com o SORTEIO DE VERDADE (o `naPrimeiraLeva` fica pra depois,
  // na parte da tela): aqui a gente quer justamente ver se o sorteio varia.
  st.bancadaEnigma(true, false)
  const f = []
  const ok = (c, m) => { if (!c) f.push(m) }

  // um baralho de mentira, do formato que o jogo usa
  const SEC = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
  const deck = {}
  for (const s of SEC) deck[s] = Array.from({ length: 9 }, (_, i) => ({ id: `${s}-${i}`, name: `${s}${i}`, club: 'Clube', year: 1990 + i, pos: s, fame: 2, lo: 60, hi: 75 }))
  const total = SEC.reduce((a, s) => a + deck[s].length, 0)

  // 🃏 e 🎁: toma o lugar de uma carta que já existe, e nunca é o surpresa
  let rngN = 0
  const rng = () => { rngN++; return 0.42 }
  const s1 = { deck, seed: 12345, surpriseId: undefined, mudoId: undefined }
  st.sorteiaEspeciaisParaTeste(s1, rng)
  const ids = new Set()
  for (const s of SEC) for (const c of deck[s]) ids.add(c.id)
  ok(!!s1.mudoId, 'não saiu Enigma nenhum')
  ok(ids.has(s1.mudoId), 'o Enigma é uma carta que NÃO está no baralho — virou carta a mais, e ele pediu o contrário')
  ok(s1.mudoId !== s1.surpriseId, 'o Enigma caiu na MESMA carta do 🎁 Surpresa — um dos dois ia sumir')
  ok(total === SEC.reduce((a, s) => a + deck[s].length, 0), 'o baralho mudou de tamanho por causa do Enigma')

  // 🎲 NÃO PUXA NÚMERO DA FILA DO ACASO: o surpresa puxa 1, o Enigma tem que
  //    puxar 0 — senão todo lance de bot muda e o `ascegas` acusa.
  rngN = 0
  const s2 = { deck, seed: 999, surpriseId: undefined, mudoId: undefined }
  st.sorteiaEspeciaisParaTeste(s2, rng)
  ok(rngN === 1, `o sorteio consumiu ${rngN} número(s) do acaso — só o 🎁 Surpresa pode consumir (1). O Enigma mexeria em TODOS os lances dos bots.`)

  // 🔁 mesma sala, mesmo Enigma (e salas diferentes não caem sempre no mesmo)
  const s3 = { deck, seed: 999, surpriseId: undefined, mudoId: undefined }
  st.sorteiaEspeciaisParaTeste(s3, rng)
  ok(s3.mudoId === s2.mudoId, 'a mesma sala sorteou Enigmas diferentes — o sorteio tinha que ser preso na semente')
  const variados = new Set()
  for (let seed = 0; seed < 40; seed++) { const s = { deck, seed, surpriseId: undefined, mudoId: undefined }; st.sorteiaEspeciaisParaTeste(s, rng); variados.add(s.mudoId) }
  ok(variados.size >= 5, `em 40 salas o Enigma caiu em só ${variados.size} carta(s) — está viciado`)

  // 🕰️ a dica é VERDADE e não entrega o nome
  const dicas = [[1958, '60'], [1975, '70'], [1986, '80'], [1994, '90'], [2003, '2000'], [2015, '2010'], [2024, '2020']]
  for (const [ano, esperado] of dicas) {
    const d = st.dicaDoEnigma({ id: 'x', name: 'Fulano de Tal', club: 'Botafogo', year: ano, pos: 'GOL', fame: 2, lo: 1, hi: 2 }, false)
    ok(d.includes(esperado), `a dica de uma carta de ${ano} deu "${d}" e devia falar em ${esperado}`)
    ok(!d.includes('Fulano') && !d.includes('Botafogo') && !d.includes(String(ano)), `a dica de ${ano} entrega nome, clube ou o ano cravado: "${d}"`)
  }
  return f
})

// ─── 2) O VAZAMENTO (a parte que importa): o jogo DE VERDADE na tela ────────
const clica = async (txt, ms = 500) => {
  const el = p.locator('button', { hasText: txt }).first()
  if (!(await el.count())) return false
  await el.click({ timeout: 5000, force: true }).catch(() => {})
  await p.waitForTimeout(ms)
  return true
}
// 🧪 liga o Enigma NA PÁGINA e manda ele pra 1ª leva — assim a trava sempre
// confere a tela certa (ele é sorteado no baralho inteiro; sem isto caía num
// setor qualquer e a trava passava em branco, que é pior que trava nenhuma).
await p.evaluate(async () => { (await import('/src/escalacao/store.tsx')).bancadaEnigma(true, true) })
await p.waitForTimeout(1500)
await clica('LEILÃO LEGENDS 38', 1400)
await clica('✕', 400)
await clica('BR', 700)
await clica('PARTIDA RÁPIDA', 1400)
await p.locator('input').first().fill('Trava FC').catch(() => {})
await p.waitForTimeout(300)
for (let i = 0; i < 6; i++) {
  if (await p.locator('text=ESCREVA SEU LANCE').count()) break
  if (!(await clica('AVANÇAR', 1500)) && !(await clica('COMEÇAR', 1500)) && !(await clica('Entendi', 700)) && !(await clica('PULAR', 700))) break
}
await p.waitForTimeout(1200)

const falhas = [...motor]
const alvo = await p.evaluate(async () => {
  const st = await import('/src/escalacao/store.tsx')
  return st.ENIGMA_LIGADO
})
if (!alvo) {
  falhas.push('o Enigma está DESLIGADO — rode pelo `npm run enigma-trava`, que liga antes e desliga depois (senão esta trava não confere o que importa)')
} else {
  const temEnigma = await p.locator('text=🕵️').count()
  if (!temEnigma) falhas.push('não achei o Enigma na 1ª leva mesmo forçado pela bancada — a trava não conferiu o vazamento')
  else {
    // 🙈 A FICHA DA CARTA ESCONDIDA, lida do DOM: pego o elemento MAIS INTERNO que
    // tem o 🕵️ (o de texto mais curto) — é a fichinha dela, sem o "+ − seu lance"
    // em volta. Ela só pode conter a POSIÇÃO, o 🕵️, os "?" e a DICA. Qualquer
    // outra coisa ali é nome, clube ou ano vazando.
    // ⚠️ tem que conter o 🕵️ **e** a dica 🕰️: o elemento mais interno com só o
    // 🕵️ é a linha do NOME (sem a dica embaixo), e aí a trava reclamaria que
    // "não mostra a dica" sem ter conferido a fichinha inteira.
    const linha = await p.evaluate(() => [...document.querySelectorAll('div')]
      .filter(d => (d.textContent ?? '').includes('🕵️') && (d.textContent ?? '').includes('🕰️'))
      .map(d => (d.textContent ?? '').trim())
      .sort((a, b) => a.length - b.length)[0] ?? '')
    if (!/🕰️/.test(linha)) falhas.push(`a linha do Enigma não mostra a dica: "${linha}"`)
    // 🧨 TIRA **SÓ A DICA**, não "tudo do 🕰️ pra frente". Meu primeiro recorte
    // apagava o fim da linha inteira — e aí um clube+ano colados DEPOIS da dica
    // sumiam junto e a trava passava num vazamento de verdade (testei, ela
    // passou). Agora removo exatamente os textos que `dicaDoEnigma` sabe gerar;
    // o que sobrar tem que ser só posição + 🕵️ + "?".
    const semDica = await p.evaluate(async (txt) => {
      const st = await import('/src/escalacao/store.tsx')
      let t = txt
      for (const ano of [1955, 1975, 1985, 1995, 2005, 2015, 2025]) {
        for (const en of [false, true]) t = t.split(st.dicaDoEnigma({ id: 'x', name: '', club: '', year: ano, pos: 'GOL', fame: 2, lo: 1, hi: 2 }, en)).join('')
      }
      return t.trim()
    }, linha)
    if (!/^(GOL|LAT|ZAG|MEI|ATA|ARM|ALA|PIV)\s*🕵️[\s?]*$/.test(semDica)) {
      falhas.push(`⚠️ VAZOU alguma coisa na fichinha do Enigma. Só podia ter posição + 🕵️ + "?", e veio: "${semDica}" (linha inteira: "${linha}")`)
    }
  }
}

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n🕵️  O JOGADOR ENIGMA · nome, clube e ano escondidos até o martelo\n')
if (falhas.length) {
  for (const f of falhas) console.log(`   🔴 ${f}`)
  console.log(`\n❌ ${falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log('✅ não é carta a mais · não puxa número do acaso (o pregão cego não muda) ·')
console.log('   nunca cai na mesma carta do 🎁 Surpresa · a dica é verdade e não entrega ninguém ·')
console.log('   e nome, clube e ano NÃO estão no HTML antes do martelo.\n')
