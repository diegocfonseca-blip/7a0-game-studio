// ─── 🔁 TRAVA: O "NOVO LEILÃO" NÃO PODE PERDER AS REGRAS DA SALA ───────────
//
// Bug que o Diego pegou jogando com o pessoal (20/09): *"tava no modo holandês e
// todo mundo votou pra uma nova. Porém foi criado no modo às cegas. Sendo que
// estávamos jogando modo holandês… então tem que seguir com a mesma regra e
// modos e tudo que foi feito a sala"*.
//
// A causa é estrutural e JÁ MORDEU ANTES (08/08, o modo stream): o `START_ONLINE`
// **zera tudo que não vier na ação**, então cada escolha da sala precisa ser
// REENVIADA na revanche, uma a uma, na mão. Esquecer uma é invisível — a sala
// simplesmente volta pro padrão e ninguém entende por quê.
//
// E o segundo bug do mesmo print: o campinho do LEILÃO mostrava ⚽ e 🅰️ ANTES de
// a bola rolar, porque os artilheiros da temporada anterior não eram zerados.
//
// uso: node scripts/testa-revanche.mjs [--porta 5248]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5248')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const st = await import('/src/escalacao/store.tsx')
  const falhas = []
  const ok = (cond, msg) => { if (!cond) falhas.push(msg) }

  const salaBase = {
    type: 'START_ONLINE', roomId: 'r1', roomCode: 'ABC123', isHost: true,
    playerIndex: 0, playerNames: ['Eu', 'Amigo'], formation: '4-3-3',
  }

  // 1️⃣ 🔻 O MODO DO PREGÃO SOBREVIVE À REVANCHE
  {
    const holSim = st.reducer(st.INITIAL, { ...salaBase, holandes: true })
    ok(holSim.holandes === true, 'sala criada como holandesa não ficou holandesa')
    const holNao = st.reducer(st.INITIAL, { ...salaBase })
    ok(holNao.holandes === false, 'sala SEM escolha virou holandesa — o padrão tem que ser o pregão cego')
    // e a revanche manda a bandeira de novo: é isso que estava faltando
    const revanche = st.reducer(holSim, { ...salaBase, holandes: holSim.holandes, rematch: Date.now(), seasonNo: 2 })
    ok(revanche.holandes === true, '❗ a revanche da sala holandesa voltou pro pregão cego — é o bug do print dele')
    ok(revanche.seasonNo === 2, 'a revanche não continuou a contagem de temporada')
  }

  // 2️⃣ 🏀 E O ESPORTE TAMBÉM (mesmo buraco, pior consequência: sala de basquete
  //    virando futebol no novo leilão)
  {
    const nba = st.reducer(st.INITIAL, { ...salaBase, sport: 'basquete' })
    ok(nba.sport === 'basquete', 'sala de basquete não nasceu de basquete')
    const revanche = st.reducer(nba, { ...salaBase, sport: nba.sport === 'basquete' ? 'basquete' : undefined, rematch: Date.now() })
    ok(revanche.sport === 'basquete', 'a revanche da sala de BASQUETE virou futebol')
  }

  // 3️⃣ 🧹 ARTILHARIA E ASSISTÊNCIA DA TEMPORADA PASSADA NÃO ATRAVESSAM
  //    (o campinho do leilão mostrando ⚽/🅰️ antes de a bola rolar)
  {
    const sujo = {
      ...st.INITIAL,
      scorers: [{ name: 'Bernabei', teamId: 0, goals: 4 }],
      assists: [{ name: 'Bernabei', teamId: 0, assists: 6 }],
      lastResults: [{ home: 0, away: 1, hg: 2, ag: 1 }],
    }
    // 🅰️ o que vale pro gol vale pra assistência: os DOIS têm que zerar, sempre
    const caminhos = [
      ['sala online (o "novo leilão")', { ...salaBase, rematch: Date.now() }],
      ['partida rápida', { type: 'START', teamName: 'X', formation: '4-3-3', rivals: 5 }],
      ['carreira solo', { type: 'START_CAREER_SOLO', teamName: 'X', formation: '4-3-3', rivals: 5, league: 'both' }],
    ]
    for (const [nome, acao] of caminhos) {
      const novo = st.reducer(sujo, acao)
      ok((novo.scorers ?? []).length === 0, `${nome}: herdou ${novo.scorers.length} artilheiro(s) da temporada passada`)
      ok((novo.assists ?? []).length === 0, `${nome}: herdou ${novo.assists.length} garçom(ns) da temporada passada`)
      ok((novo.lastResults ?? []).length === 0, `${nome}: herdou resultado da temporada passada`)
    }
    // ⚠️ E o que NÃO pode zerar: o retrospecto entre amigos atravessa temporada
    const comRiv = { ...sujo, rivalries: { '0-1': { w: 2, l: 1, d: 0 } } }
    const dep = st.reducer(comRiv, { ...salaBase, rematch: Date.now() })
    ok(dep.rivalries && Object.keys(dep.rivalries).length > 0, 'a revanche apagou o retrospecto entre os amigos (Rivalidade V=2 D=1)')
  }

  // 4️⃣ 📋 E A CONFERÊNCIA ESTRUTURAL: toda escolha da sala tem que ser
  //    REENVIADA no "novo leilão". Como o `START_ONLINE` zera o que não vier,
  //    esquecer um campo aqui é um bug MUDO — a sala volta pro padrão e ninguém
  //    entende. Já aconteceu com o stream (08/08) e com o holandês (20/09).
  const fonte = await (await fetch('/src/escalacao/screens.tsx')).text()
  // ⚠️ O Vite serve o arquivo JÁ TRANSPILADO: aspas, espaços e quebras de linha
  //    mudam. Então nada de cortar por indentação ou por um número chutado de
  //    caracteres — a janela é achada CONTANDO CHAVES a partir do `type:`, que é
  //    a única marca que sobrevive à transpilação.
  const i = Math.max(fonte.indexOf(`type: 'START_ONLINE',`), fonte.indexOf('type: "START_ONLINE",'))
  let bloco = ''
  if (i >= 0) {
    let d = 1 // já estamos DENTRO do objeto do dispatch
    let j = i
    for (; j < fonte.length && d > 0; j++) {
      const c = fonte[j]
      if (c === '{') d++
      else if (c === '}') d--
    }
    bloco = fonte.slice(i, j)
  }
  ok(i >= 0, 'não achei o "novo leilão" no screens.tsx — esta trava não conferiu nada')
  ok(bloco.length > 200, 'a janela do "novo leilão" saiu vazia — esta trava não conferiu nada')
  const ESCOLHAS = [
    ['deck', 'o baralho de craques'],
    ['varzea', 'a categoria Várzea'],
    ['copaMode', 'o que vem depois da liga'],
    ['holandes', 'o tipo de pregão (cego × holandês)'],
    ['sport', 'o esporte da sala (futebol × basquete)'],
    ['stream', 'o modo stream'],
    ['manual', 'o ritmo manual do host'],
    ['chatOff', 'o chat ligado/desligado'],
    ['auctionSecs', 'o tempo do pregão'],
    ['ligaFechada', 'a liga sem bots'],
    ['liga', 'ser Minhas Ligas'],
    ['locked', 'a sala com senha'],
    ['pwHash', 'a senha da sala'],
    ['seasonNo', 'a contagem de temporada'],
    ['duplasMode', 'a sala de duplas'],
  ]
  for (const [campo, oque] of ESCOLHAS) {
    ok(new RegExp(`\\b${campo}:`).test(bloco), `o "novo leilão" não reenvia \`${campo}\` — a sala perde ${oque}`)
  }

  return { falhas, conferidas: ESCOLHAS.length }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log(`\n🔁 O "NOVO LEILÃO" MANTÉM A SALA · ${r.conferidas} escolhas conferidas\n`)
if (r.falhas.length) {
  for (const f of r.falhas) console.log(`   🔴 ${f}`)
  console.log(`\n❌ ${r.falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log('✅ a revanche continua com o MESMO pregão, o mesmo esporte e as mesmas regras ·')
console.log('   artilharia e assistência da temporada passada não atravessam ·')
console.log('   e o retrospecto entre os amigos continua de pé.\n')
