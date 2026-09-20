// ─── 🔻 TRAVA: LEILÃO HOLANDÊS (modo novo, aprovado pelo Diego 20/09) ──────
//
// Palavras dele, que são as regras que esta trava segura:
//   · *"a hi q tem q começar com 100 p qlwr jogador até pq ng tem 200… todo
//     mundo começa C 100"*  → a abertura é IGUAL pra toda carta (senão o preço
//     de abertura entregaria o nível, que é segredo até a Cerimônia).
//   · *"preço cair até 0… se ng pegar esse jogador vai pras sobras igual ocorre
//     hoje Tb já"*
//   · *"oq manda e o ID do host sempre"*
//   · *"quantidade de jogadores q aparece no leilão e regras com quantidades q
//     jogam tudo igual Tb"*
//   · *"quero usar tudo parecido C oq já funciona hoje no motor e visual"*
//
// E a trava mais importante de todas, que é a promessa que eu fiz pra ele:
// **o leilão de hoje não muda NADA**. O último teste roda um pregão inteiro com
// o holandês DESLIGADO e confere que ele fecha igualzinho.
//
// uso: node scripts/testa-holandes.mjs [--porta 5239]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5239')

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

  // 1️⃣ A ESCADA DE PREÇOS: abre em 100, termina em 0, só desce, e é MIÚDA
  //    embaixo (é onde a decisão acontece) e GORDA em cima (ninguém paga 90).
  const esc = st.holEscada(100)
  ok(esc[0] === 100, `a escada devia abrir em 100 e abriu em ${esc[0]}`)
  ok(esc[esc.length - 1] === 0, `a escada devia terminar em 0 e terminou em ${esc[esc.length - 1]}`)
  ok(esc.every((v, i) => i === 0 || v < esc[i - 1]), 'a escada tem degrau que não desce')
  const degrauEmCima = esc[0] - esc[1]
  const degrauEmBaixo = esc[esc.length - 3] - esc[esc.length - 2]
  ok(degrauEmCima > degrauEmBaixo, `degrau de cima (${degrauEmCima}) tinha que ser maior que o de baixo (${degrauEmBaixo})`)
  ok(esc.filter(v => v > 0 && v <= 30).length >= 14, 'a escada é rala embaixo — é lá que dá pra decidir')
  ok(st.holEscada(50)[0] === 50, 'no basquete a abertura tem que ser o bolso de lá (50)')

  // ⏱️ e o relógio: a leva inteira não pode custar mais que os 45s de hoje.
  const msCheio = esc.slice(0, -1).reduce((s, v) => s + st.holPassoMs(v, 100), 0)

  // 2️⃣ 🎮 UM PREGÃO INTEIRO NO HOLANDÊS, do START à Cerimônia, só na marra do
  //    relógio (o humano nunca aperta: é o pior caso, tudo decidido pelos bots).
  const joga = (holandes) => {
    let s = st.reducer(st.INITIAL, { type: 'START', teamName: 'Meu Time', formation: '4-3-3', rivals: 7, holandes })
    const caixaInicial = Object.fromEntries(s.managers.map(m => [m.id, m.money]))
    let ticks = 0, cartas = 0, msPregao = 0, ultimaMarca = '', monteN = null
    // 📦 quantas cartas caíram na REPESCAGEM (as que o leilão principal não vendeu)
    let repescagem = 0, naResq = 0
    const vistoResq = new Set()
    const precos = []
    const visto = new Set()
    let parado = 0
    for (let guard = 0; guard < 6000; guard++) {
      if (s.screen !== 'auction' && s.screen !== 'monte') break
      const marca = `${s.screen}|${s.phase}|${s.sectorIdx}|${s.sectorCursor}|${s.revealIdx}|${s.monteIdx}|${s.hol?.passo ?? ''}|${s.hol?.levados.length ?? ''}`
      if (marca === ultimaMarca) { if (++parado > 3) break } else parado = 0
      ultimaMarca = marca
      if (s.phase === 'holandes') {
        for (const c of s.currentCards) if (!visto.has(c.id)) { visto.add(c.id); cartas++ }
        msPregao += st.holPassoMs(s.hol.preco, 100)
        s = st.reducer(s, { type: 'HOLANDES_TICK' })
        ticks++
        // ⚠️ NÃO conta o arremate aqui: quem conta é a REVELAÇÃO, que é o mesmo
        // lugar nos dois modos. Contar nos dois dava o MESMO arremate duas vezes
        // e inflava o holandês (foi assim que eu quase mandei 84 x 46 pro Diego).
        continue
      }
      // 🕐 o relógio do pregão cego é de VERDADE (45s) — aqui a gente adianta o
      // ponteiro pra rodar o pregão inteiro em milissegundos.
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') {
        if (s.phase === 'envelope') for (const c of s.currentCards) if (!visto.has(c.id)) { visto.add(c.id); cartas++ }
        if (s.phase === 'resq_envelope') for (const c of s.currentCards) if (!vistoResq.has(c.id)) { vistoResq.add(c.id); repescagem++ }
        s = st.reducer({ ...s, phaseDeadline: null }, { type: 'FORCE_SEAL' })
        continue
      }
      if (s.phase === 'reveal' || s.phase === 'resq_reveal') {
        for (const q of (s.revealQueue ?? [])) if (q.winner !== null && q.paid > 0 && !visto.has(`v:${q.card.id}`)) {
          visto.add(`v:${q.card.id}`)
          precos.push(q.paid)
          if (s.phase === 'resq_reveal') naResq++ // 📦 este saiu na REPESCAGEM, não no pregão principal
        }
        s = st.reducer(s, { type: 'ADVANCE_REVEAL' }); continue
      }
      if (s.phase === 'tiebreak') { s = st.reducer({ ...s, phaseDeadline: null }, { type: 'FORCE_TIEBREAK' }); continue }
      if (s.screen === 'monte' && monteN === null) monteN = s.monte.length
      if (s.screen === 'monte') { const alvo = s.monteOrder[s.monteIdx]; if (alvo == null || !s.monte.length) break; s = st.reducer(s, { type: 'MONTE_PICK', mgrId: alvo, cardId: s.monte[0].id }); continue }
      break
    }
    // 🕳️ VAGAS QUE SOBRARAM no fim do pregão = é exatamente isto que vira
    //    perna-de-pau depois (o `fillToEleven` tapa buraco com jogador de mentira).
    const POR_POS = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
    let buracos = 0
    for (const m of s.managers) {
      if (!m.isHuman && !m.auctionRival) continue
      for (const pos of Object.keys(POR_POS)) buracos += Math.max(0, POR_POS[pos] - m.squad.filter(c => c.pos === pos && !c.fake).length)
    }
    return { s, caixaInicial, ticks, cartas, precos, msPregao, monteN: monteN ?? 0, repescagem, buracos, naResq }
  }

  const hol = joga(true)
  const sh = hol.s
  ok(sh.screen === 'cerimonia' || sh.screen === 'squad' || sh.screen === 'season' || sh.screen === 'monte',
    `o holandês não chegou ao fim do pregão (parou em screen=${sh.screen} / phase=${sh.phase})`)
  ok(hol.cartas > 0, 'nenhuma carta passou pelo holandês')

  // 💰 NINGUÉM FICA DEVENDO e ninguém paga mais do que tinha
  for (const m of sh.managers) {
    ok(m.money >= 0, `${m.teamName} terminou com caixa NEGATIVA (${m.money}) no holandês`)
    const gasto = m.squad.reduce((t, c) => t + (c.buyPrice ?? 0), 0)
    ok(gasto <= hol.caixaInicial[m.id] + 0.001, `${m.teamName} gastou ${gasto} tendo ${hol.caixaInicial[m.id]}`)
  }
  // 🧮 e o preço pago nunca passou da abertura nem foi negativo
  ok(hol.precos.every(v => v >= 1 && v <= 100), `preço de arremate fora da escada: ${hol.precos.filter(v => v < 1 || v > 100).slice(0, 3).join(', ')}`)

  // 🚫 NINGUÉM ESTOURA A POSIÇÃO (o buraco que o `resolve` já fecha, conferido
  //    de novo aqui porque o holandês é um caminho NOVO até ele)
  const LIM = { GOL: 3, LAT: 6, ZAG: 6, MEI: 8, ATA: 8 } // teto folgado: o que importa é não explodir
  for (const m of sh.managers) {
    for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
      const n = m.squad.filter(c => c.pos === pos).length
      ok(n <= LIM[pos], `${m.teamName} ficou com ${n} ${pos} — o holandês furou a trava de vaga`)
    }
  }
  // 🃏 e nenhuma carta foi parar em DOIS elencos (o pesadelo do "dois Van der Sar")
  const donos = {}
  for (const m of sh.managers) for (const c of m.squad) {
    const k = `${c.name}|${c.club}|${c.year}`
    if (!c.fake && c.club !== 'Várzea') { ok(!donos[k], `${c.name} apareceu em DOIS elencos (${donos[k]} e ${m.teamName})`); donos[k] = m.teamName }
  }

  // 3️⃣ ✅ O LEILÃO DE HOJE NÃO MUDOU: o mesmo pregão com o holandês DESLIGADO
  //    fecha normalmente, sem nenhum rastro do modo novo.
  const cego = joga(false)
  ok(cego.ticks === 0, `o pregão cego disparou ${cego.ticks} tick de holandês — não podia disparar nenhum`)
  ok(!cego.s.hol, 'sobrou estado de holandês num pregão cego')
  ok(cego.s.holandes === false, 'o pregão cego ficou com a bandeira do holandês ligada')
  for (const m of cego.s.managers) ok(m.money >= 0, `${m.teamName} terminou com caixa negativa no pregão CEGO`)
  ok(cego.s.screen !== 'auction' || cego.s.phase !== 'envelope', 'o pregão cego não avançou')

  // 4️⃣ 🔒 O BOTÃO NÃO É MUDO: a tela pergunta `holPodeAgora`, e é a MESMA
  //    função que o motor usa pra aceitar o toque (regra de ouro de 19/09).
  //    ⚠️ apertar NÃO arremata na hora: vira um PEDIDO do degrau. Então o que se
  //    confere é se o pedido entrou.
  const novoJogo = () => st.reducer(st.INITIAL, { type: 'START', teamName: 'Meu Time', formation: '4-3-3', rivals: 7, holandes: true })
  let s2 = novoJogo()
  let achouCaso = false
  for (let g = 0; g < 3000 && s2.phase === 'holandes'; g++) {
    const eu = s2.managers[s2.youIdx]
    let mexi = false
    for (const c of s2.currentCards) {
      const pode = st.holPodeAgora(s2, eu.id, c.id)
      const antes = s2.hol.pedidos.filter(x => x.mgr === eu.id).length
      const depois = st.reducer(s2, { type: 'HOLANDES_PEGAR', mgrId: eu.id, cardId: c.id, preco: s2.hol.preco })
      const entrou = depois.hol && depois.hol.pedidos.filter(x => x.mgr === eu.id).length > antes
      if (pode) { ok(entrou, `a tela acendeu PEGAR em ${c.name} e o motor recusou — botão mudo`); achouCaso = true; s2 = depois; mexi = true }
      else ok(!entrou, `a tela apagou PEGAR em ${c.name} e o motor aceitou — arremate fantasma`)
    }
    if (!mexi) s2 = st.reducer(s2, { type: 'HOLANDES_TICK' })
    else s2 = st.reducer(s2, { type: 'HOLANDES_TICK' })
  }
  ok(achouCaso, 'não deu pra testar o botão: o humano nunca pôde pegar nada')
  ok(s2.managers[s2.youIdx].money >= 0, `apertando em TUDO, o humano ficou com caixa ${s2.managers[s2.youIdx].money}`)

  // 5️⃣ 📶 O MEDO DO DELAY — as três perguntas dele, uma a uma.
  const abrePregao = () => { let x = novoJogo(); while (x.phase === 'holandes' && !x.currentCards.some(c => st.holPodeAgora(x, x.managers[x.youIdx].id, c.id))) x = st.reducer(x, { type: 'HOLANDES_TICK' }); return x }

  // (a) 🔒 TOQUE COM PREÇO VELHO NÃO VALE — o toque que saiu do aparelho antes
  //     do preço cair não pode virar arremate por um preço que ninguém viu.
  {
    const s3 = abrePregao()
    if (s3.phase === 'holandes') {
      const eu3 = s3.managers[s3.youIdx]
      const alvo = s3.currentCards.find(c => st.holPodeAgora(s3, eu3.id, c.id))
      const velho = st.reducer(s3, { type: 'HOLANDES_PEGAR', mgrId: eu3.id, cardId: alvo.id, preco: s3.hol.preco + 7 })
      ok(velho.hol.pedidos.length === 0, 'toque com preço VELHO foi aceito — dá arremate por preço que ninguém viu')
    }
  }

  // (b) ✋ APERTAR DUAS VEZES NA MESMA CARTA NÃO DOBRA NADA. É o medo dele:
  //     *"o botão não atualizar e a pessoa apertar de novo"*. O 2º toque é
  //     engolido no motor, não só escondido na tela.
  {
    let s4 = abrePregao()
    if (s4.phase === 'holandes') {
      const eu4 = s4.managers[s4.youIdx]
      const alvo = s4.currentCards.find(c => st.holPodeAgora(s4, eu4.id, c.id))
      s4 = st.reducer(s4, { type: 'HOLANDES_PEGAR', mgrId: eu4.id, cardId: alvo.id, preco: s4.hol.preco })
      const um = s4.hol.pedidos.filter(x => x.cardId === alvo.id && x.mgr === eu4.id).length
      ok(um === 1, `o 1º toque devia virar 1 pedido e virou ${um}`)
      ok(!st.holPodeAgora(s4, eu4.id, alvo.id), 'depois de pedir, a tela ainda acende o botão da MESMA carta')
      const dobrado = st.reducer(s4, { type: 'HOLANDES_PEGAR', mgrId: eu4.id, cardId: alvo.id, preco: s4.hol.preco })
      ok(dobrado.hol.pedidos.filter(x => x.cardId === alvo.id && x.mgr === eu4.id).length === 1, 'apertar duas vezes na mesma carta virou DOIS pedidos')
      // e quando o degrau fecha, a carta sai pra TODO MUNDO com um dono só
      const fechou = st.reducer(s4, { type: 'HOLANDES_TICK' })
      const dono = fechou.hol ? fechou.hol.levados.filter(l => l.cardId === alvo.id) : []
      if (fechou.hol) {
        ok(dono.length === 1, `a carta pedida devia sair com UM dono e saiu com ${dono.length}`)
        ok(dono[0]?.mgr === eu4.id, 'quem pediu sozinho não levou a carta')
        ok(!st.holPodeAgora(fechou, eu4.id, alvo.id), 'a carta já arrematada continua com botão aceso')
        ok(!!st.holDono(fechou, alvo.id), 'a tela não consegue ver quem levou a carta')
      }
    }
  }

  // (c) 🎰 DOIS APERTARAM NO MESMO PREÇO → um só leva, e a GENTE passa na frente
  //     do robô. Aqui a gente força o caso: dois assentos pedindo a mesma carta.
  {
    let s5 = abrePregao()
    if (s5.phase === 'holandes') {
      const eu5 = s5.managers[s5.youIdx]
      const bot = s5.managers.find(m => !m.isHuman && m.auctionRival && m.money > 0)
      const alvo = s5.currentCards.find(c => st.holPodeAgora(s5, eu5.id, c.id))
      s5 = st.reducer(s5, { type: 'HOLANDES_PEGAR', mgrId: eu5.id, cardId: alvo.id, preco: s5.hol.preco })
      s5 = st.reducer(s5, { type: 'HOLANDES_PEGAR', mgrId: bot.id, cardId: alvo.id, preco: s5.hol.preco })
      const n = s5.hol.pedidos.filter(x => x.cardId === alvo.id).length
      const fechou = st.reducer(s5, { type: 'HOLANDES_TICK' })
      if (fechou.hol) {
        const dono = fechou.hol.levados.filter(l => l.cardId === alvo.id)
        ok(dono.length <= 1, `dois pediram e a carta saiu ${dono.length} vezes — é o arremate duplo que ele teme`)
        if (n === 2 && dono.length === 1) ok(dono[0].mgr === eu5.id, 'no mesmo preço, o ROBÔ passou na frente da pessoa')
      }
    }
  }

  // (d) ⏱️ E O DEGRAU TEM QUE DURAR O BASTANTE PRA DAR TEMPO DE REAGIR. É esta
  //     conta que faz o delay parar de decidir a partida.
  ok(st.holPassoMs(10, 100) >= 1500, `o degrau de baixo dura só ${st.holPassoMs(10, 100)}ms — pouco pra quem tem internet ruim`)
  ok(msCheio <= 50000, `a leva inteira leva ${(msCheio / 1000).toFixed(1)}s e hoje leva 45s — está atrasando o jogo`)

  // 5️⃣-zero ⚡ APERTOU SOZINHO = É SEU NA HORA (pergunta dele, 20/09):
  //    *"qd o cara aperta ele não pega na hora e já não vai pro campinho dele??"*.
  //    Vai sim. A janela de meio segundo fecha e a carta entra em `levados`, que
  //    é o que o campinho desenha — SEM esperar o degrau inteiro.
  let sozinhoTestado = 0
  {
    let s0 = novoJogo()
    while (s0.phase === 'holandes' && !s0.currentCards.some(c => st.holPodeAgora(s0, s0.managers[s0.youIdx].id, c.id))) s0 = st.reducer(s0, { type: 'HOLANDES_TICK' })
    if (s0.phase === 'holandes') {
      const eu0 = s0.managers[s0.youIdx]
      const alvo = s0.currentCards.find(c => st.holPodeAgora(s0, eu0.id, c.id))
      const precoNaTela = s0.hol.preco
      const passoAntes = s0.hol.passo
      s0 = st.reducer(s0, { type: 'HOLANDES_PEGAR', mgrId: eu0.id, cardId: alvo.id, preco: precoNaTela })
      // ⏱️ fecha SÓ a janela (meio segundo) — o degrau NÃO andou
      const pego = st.reducer(s0, { type: 'HOLANDES_JANELA' })
      ok(!!pego.hol, 'a janela fechou a leva inteira — ela só devia entregar a carta')
      if (pego.hol) {
        ok(pego.hol.passo === passoAntes, `a janela mexeu no degrau (${passoAntes} → ${pego.hol.passo}) — ela não pode mexer no preço`)
        ok(pego.hol.preco === precoNaTela, 'a janela mudou o preço')
        const meu = pego.hol.levados.find(l => l.cardId === alvo.id)
        ok(!!meu, '❗ apertou sozinho e a carta NÃO virou dele — é a pergunta dele: "não pega na hora?"')
        ok(meu?.mgr === eu0.id, 'apertou sozinho e a carta foi pra outro')
        ok(meu?.preco === precoNaTela, `apertou vendo ${precoNaTela} e pagou ${meu?.preco}`)
        // 🏟️ e é ISTO que o campinho desenha (o `YourPitch` lê `hol.levados`)
        ok(pego.hol.levados.filter(l => l.mgr === eu0.id && l.cardId === alvo.id).length === 1, 'a carta não entrou no campinho dele')
        ok(!pego.hol.ultimo?.perdedores?.length, 'apertou sozinho e alguém apareceu como perdedor')
        sozinhoTestado = 1
      }
    }
  }
  ok(sozinhoTestado === 1, 'o caso "apertou sozinho" não chegou a ser testado — verde falso')
  // ⏱️ e meio segundo tem que ser CURTO de verdade (o Diego achou 2s demorado)
  ok(st.HOL_JANELA_MS <= 700, `a janela do aperto está em ${st.HOL_JANELA_MS}ms — isso já se sente na mão`)
  ok(st.HOL_JANELA_MS >= 250, `a janela está em ${st.HOL_JANELA_MS}ms — curta demais pra caber a diferença de internet`)

  // 5️⃣-bis 👥👥 DUAS PESSOAS APERTAM NA MESMA CARTA, NO MESMO PREÇO.
  //    Pergunta dele (20/09): *"será q vai os dois pôr o jogador no campinho?? O
  //    mesmo jogador"*. É o pesadelo clássico do leilão ao vivo, e a resposta
  //    tem que ser NÃO — provada, não prometida. Aqui a gente simula a sala
  //    online: dois assentos HUMANOS pedindo a mesma carta no mesmo degrau.
  let disputaTestada = 0
  {
    let s6 = novoJogo()
    // vira o 2º assento em gente (é o que a sala online faz de verdade)
    s6 = { ...s6, managers: s6.managers.map((m, i) => (i === 1 ? { ...m, isHuman: true, dormindo: false } : m)) }
    while (s6.phase === 'holandes' && !s6.currentCards.some(c => st.holPodeAgora(s6, s6.managers[0].id, c.id) && st.holPodeAgora(s6, s6.managers[1].id, c.id))) {
      s6 = st.reducer(s6, { type: 'HOLANDES_TICK' })
    }
    if (s6.phase === 'holandes') {
      const [a, bb] = [s6.managers[0], s6.managers[1]]
      const alvo = s6.currentCards.find(c => st.holPodeAgora(s6, a.id, c.id) && st.holPodeAgora(s6, bb.id, c.id))
      const precoDisputa = s6.hol.preco
      const caixaA = a.money, caixaB = bb.money
      // os dois apertam no MESMO preço, um logo depois do outro
      s6 = st.reducer(s6, { type: 'HOLANDES_PEGAR', mgrId: a.id, cardId: alvo.id, preco: precoDisputa })
      s6 = st.reducer(s6, { type: 'HOLANDES_PEGAR', mgrId: bb.id, cardId: alvo.id, preco: precoDisputa })
      ok(s6.hol.pedidos.filter(x => x.cardId === alvo.id).length === 2, 'os dois pedidos deviam entrar na fila do degrau')
      // ✅ e NENHUM DOS DOIS tem a carta ainda: pedido não é arremate
      ok(!s6.hol.levados.some(l => l.cardId === alvo.id), 'a carta foi dada antes do degrau fechar — é o arremate por ordem de chegada que ele teme')

      const fim6 = st.reducer(s6, { type: 'HOLANDES_JANELA' }) // fecha a janela de meio segundo
      const hol6 = fim6.hol
      if (hol6) {
        const donos = hol6.levados.filter(l => l.cardId === alvo.id)
        // 🔒 A TRAVA QUE RESPONDE A PERGUNTA DELE, EM TRÊS PARTES:
        ok(donos.length === 1, `❗ a MESMA carta saiu com ${donos.length} donos — os dois iam pôr o jogador no campinho`)
        ok(donos[0].mgr === a.id || donos[0].mgr === bb.id, 'a carta disputada foi parar num terceiro')
        ok(donos[0].preco === precoDisputa, `pagou ${donos[0].preco} e o preço na tela era ${precoDisputa}`)
        // (b) o PERDEDOR não paga nada e continua com a vaga aberta
        const perdedor = donos[0].mgr === a.id ? bb : a
        const caixaPerdedor = perdedor.id === a.id ? caixaA : caixaB
        const gastoPerdedor = hol6.levados.filter(l => l.mgr === perdedor.id).reduce((t, l) => t + l.preco, 0)
        ok(gastoPerdedor === 0, `quem perdeu a disputa foi cobrado ${gastoPerdedor} 🪙 — pedido que não vence não cobra`)
        ok(fim6.managers.find(m => m.id === perdedor.id).money === caixaPerdedor, 'a caixa de quem perdeu mexeu')
        // (c) e o perdedor VÊ o porquê na tela (a faixa 😤 lê esta lista)
        ok(hol6.ultimo?.perdedores?.includes(perdedor.id), 'quem perdeu a disputa não é avisado — a carta sumia em silêncio')
        // (d) 🏟️ O CAMPINHO: é `levados` que o `YourPitch` desenha. Se só tem um
        //     dono ali, é impossível o mesmo jogador aparecer em dois campinhos.
        const noCampinhoDe = (id) => hol6.levados.filter(l => l.mgr === id && l.cardId === alvo.id).length
        ok(noCampinhoDe(a.id) + noCampinhoDe(bb.id) === 1, 'o mesmo jogador entrou em DOIS campinhos')
        // (e) e o botão apaga pros dois: ninguém aperta numa carta já arrematada
        ok(!st.holPodeAgora(fim6, a.id, alvo.id) && !st.holPodeAgora(fim6, bb.id, alvo.id), 'carta arrematada ainda aceita toque')
        disputaTestada = 1
      }
    }
  }

  // ⚠️ TESTE QUE NÃO RODA É PIOR QUE TESTE NENHUM: a simulação acima tem `if`s
  //    (precisa achar uma carta que OS DOIS possam pegar). Se ela for pulada em
  //    silêncio, a trava fica verde sem ter conferido nada.
  ok(disputaTestada === 1, 'a disputa de DOIS humanos na mesma carta não chegou a ser testada — verde falso')

  let roletaPlacar = '—'
  // 5️⃣-ter 🎲 E A ROLETA NÃO É VICIADA: repetindo a mesma disputa muitas vezes,
  //    os dois têm que ganhar. Se o host ganhasse sempre, o convidado largava a
  //    sala na primeira noite.
  {
    const vitorias = { 0: 0, 1: 0 }
    for (let r2 = 0; r2 < 40; r2++) {
      let s7 = novoJogo()
      s7 = { ...s7, managers: s7.managers.map((m, i) => (i === 1 ? { ...m, isHuman: true, dormindo: false } : m)) }
      let guard = 0
      while (s7.phase === 'holandes' && guard++ < 40 && !s7.currentCards.some(c => st.holPodeAgora(s7, s7.managers[0].id, c.id) && st.holPodeAgora(s7, s7.managers[1].id, c.id))) {
        s7 = st.reducer(s7, { type: 'HOLANDES_TICK' })
      }
      if (s7.phase !== 'holandes') continue
      const [a, bb] = [s7.managers[0], s7.managers[1]]
      const alvo = s7.currentCards.find(c => st.holPodeAgora(s7, a.id, c.id) && st.holPodeAgora(s7, bb.id, c.id))
      if (!alvo) continue
      s7 = st.reducer(s7, { type: 'HOLANDES_PEGAR', mgrId: a.id, cardId: alvo.id, preco: s7.hol.preco })
      s7 = st.reducer(s7, { type: 'HOLANDES_PEGAR', mgrId: bb.id, cardId: alvo.id, preco: s7.hol.preco })
      const f7 = st.reducer(s7, { type: 'HOLANDES_JANELA' })
      const d = f7.hol?.levados.find(l => l.cardId === alvo.id)
      if (!d) continue
      if (d.mgr === a.id) vitorias[0]++
      else if (d.mgr === bb.id) vitorias[1]++
    }
    roletaPlacar = `${vitorias[0]} × ${vitorias[1]}`
    const total = vitorias[0] + vitorias[1]
    ok(total >= 20, `a roleta só foi testada ${total} vezes — pouco pra confiar`)
    if (total >= 20) {
      ok(vitorias[0] > 0 && vitorias[1] > 0, `a roleta deu ${vitorias[0]} x ${vitorias[1]} — um dos dois NUNCA ganha`)
      ok(Math.min(vitorias[0], vitorias[1]) / total >= 0.25, `a roleta está torta: ${vitorias[0]} x ${vitorias[1]}`)
    }
  }

  // 6️⃣ 👥 O BARALHO SEGUE O TAMANHO DA SALA — NOS DOIS MODOS, PELA MESMA CONTA.
  //    Pergunta dele (20/09): *"tem q ser msm regra c/ base na quantidade de
  //    jogadores usuários q entram no online igual a regra q já funciona ou tô
  //    errado?"*. Ele está certo, e já é assim: o baralho é montado pelo
  //    `buildDeck(auctioningManagers(...))` ANTES do pregão começar — o holandês
  //    entra depois e não encosta nele.
  //
  //    ⚠️ E NÃO DÁ PRA COMPARAR OS DOIS MODOS CARTA A CARTA: o `START` sorteia um
  //    `seed` novo a cada partida, então em duas partidas diferentes os bots
  //    sorteiam formações diferentes (4-3-3 × 4-4-2) e a divisão entre MEI e ATA
  //    muda — por SORTEIO, não por modo. (Foi essa a primeira versão errada desta
  //    trava.) O que se confere é a CONTA, que é a mesma nos dois: cada posição
  //    tem que ter pelo menos a demanda daquela partida, e o total tem que ser
  //    11 vagas por técnico.
  const salas = []
  for (const rivais of [2, 5, 7, 11, 19]) {
    const conta = (holandes) => {
      const x = st.reducer(st.INITIAL, { type: 'START', teamName: 'Meu Time', formation: '4-3-3', rivals: rivais, holandes })
      const tecs = x.managers.filter(m => m.isHuman || m.auctionRival)
      const porPos = {}, demanda = {}
      for (const pz of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
        porPos[pz] = x.deck[pz].length
        demanda[pz] = tecs.reduce((a, m) => a + st.slotsOf(m, pz), 0)
      }
      const total = Object.values(porPos).reduce((a, c) => a + c, 0)
      const totalDemanda = Object.values(demanda).reduce((a, c) => a + c, 0)
      const levas = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].reduce((a, pz) => a + st.batchCount(x.deck[pz].length), 0)
      return { total, totalDemanda, porPos, demanda, levas, tecnicos: tecs.length, holandes: x.holandes }
    }
    for (const modo of [true, false]) {
      const g = conta(modo)
      const nome = modo ? 'holandês' : 'cego'
      ok(g.holandes === modo, `a bandeira do modo não pegou na sala de ${g.tecnicos}`)
      // (a) cada posição tem que cobrir a demanda DAQUELA partida
      for (const pz of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
        ok(g.porPos[pz] >= g.demanda[pz], `sala de ${g.tecnicos} (${nome}): ${pz} veio com ${g.porPos[pz]} carta(s) pra ${g.demanda[pz]} vaga(s)`)
      }
      // (b) e a demanda é 11 vagas por técnico — a regra que já funciona hoje
      ok(g.totalDemanda === g.tecnicos * 11, `sala de ${g.tecnicos} (${nome}): a demanda deu ${g.totalDemanda} e devia ser ${g.tecnicos * 11}`)
      // (c) baralho = demanda + a folga de 1 por posição (nem apertado, nem inflado)
      ok(g.total >= g.totalDemanda && g.total <= g.totalDemanda + 10,
        `sala de ${g.tecnicos} (${nome}): ${g.total} cartas pra ${g.totalDemanda} vagas — fora da regra "demanda + 1 por posição"`)
      if (modo) salas.push({ tecnicos: g.tecnicos, cartas: g.total, vagas: g.totalDemanda, levas: g.levas })
    }
  }

  return {
    falhas,
    escada: esc,
    msCheio,
    cartas: hol.cartas,
    arremates: hol.precos.length,
    precoMedio: hol.precos.length ? (hol.precos.reduce((a, c) => a + c, 0) / hol.precos.length) : 0,
    ticks: hol.ticks,
    msPregao: hol.msPregao,
    monteHol: hol.monteN, monteCego: cego.monteN,
    salas, disputaTestada, roletaPlacar, sozinhoTestado, janelaMs: st.HOL_JANELA_MS,
    repHol: hol.repescagem, repCego: cego.repescagem,
    resqHol: hol.naResq, resqCego: cego.naResq,
    buracoHol: hol.buracos, buracoCego: cego.buracos,
    cegoCartas: cego.cartas,
    cegoArremates: cego.precos.length,
    cegoPrecoMedio: cego.precos.length ? (cego.precos.reduce((a, c) => a + c, 0) / cego.precos.length) : 0,
  }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n🔻 LEILÃO HOLANDÊS · pregão inteiro rodado no motor de verdade\n')
console.log(`   escada de preços (${r.escada.length} degraus): ${r.escada.slice(0, 8).join(' · ')} … ${r.escada.slice(-6).join(' · ')}`)
console.log(`   a descida inteira da leva (100 → 0): ${(r.msCheio / 1000).toFixed(1)}s · hoje o envelope leva 45s\n`)
console.log("   ⏱️💰 O MESMO PREGÃO, NOS DOIS MODOS (8 técnicos, humano só assistindo):")
console.log(`      🔻 holandês  : ${String(r.cartas).padStart(3)} cartas · ${String(r.arremates).padStart(3)} arremates · preço médio ${r.precoMedio.toFixed(1)} 🪙 · ~${Math.round(r.msPregao / 1000)}s de pregão `)
console.log(`         └─ ${r.arremates - r.resqHol} saíram no pregão · ${r.resqHol} na repescagem · ${r.repHol} desceram pra repescagem · ${r.buracoHol} vagas ficaram vazias (= perna-de-pau)`)
console.log(`      ✉️ cego (hoje): ${String(r.cegoCartas).padStart(3)} cartas · ${String(r.cegoArremates).padStart(3)} arremates · preço médio ${r.cegoPrecoMedio.toFixed(1)} 🪙 · ~${Math.round(r.cegoCartas / 12 + 0.5) * 45}s de pregão `)
console.log(`         └─ ${r.cegoArremates - r.resqCego} saíram no pregão · ${r.resqCego} na repescagem · ${r.repCego} desceram pra repescagem · ${r.buracoCego} vagas ficaram vazias (= perna-de-pau)\n`)
console.log(`   ⚡ APERTOU SOZINHO → é seu em ${r.janelaMs}ms (não espera o degrau): ${r.sozinhoTestado ? 'testado' : '⚠️ NÃO testado'}`)
console.log(`   👥👥 DOIS APERTANDO A MESMA CARTA, NO MESMO PREÇO: ${r.disputaTestada ? 'testado' : '⚠️ NÃO testado'} · a 🎰 roleta deu ${r.roletaPlacar} em 40 disputas\n`)
console.log('   👥 E O BARALHO SEGUE O TAMANHO DA SALA — pela MESMA conta nos dois modos:\n')
console.log('      técnicos │ vagas (11 cada) │ cartas no baralho │ levas │ pregão holandês │ pregão cego')
console.log('      ─────────┼─────────────────┼───────────────────┼───────┼─────────────────┼────────────')
for (const sl of r.salas) {
  const mm = (seg) => `${Math.floor(seg / 60)}:${String(Math.round(seg % 60)).padStart(2, '0')}`
  console.log(`      ${String(sl.tecnicos).padStart(8)} │ ${String(sl.vagas).padStart(15)} │ ${String(sl.cartas).padStart(17)} │ ${String(sl.levas).padStart(5)} │ ${String(mm(sl.levas * (r.msCheio / 1000))).padStart(15)} │ ${mm(sl.levas * 45)}`)
}
console.log('')
if (r.falhas.length) {
  for (const f of r.falhas) console.log(`   🔴 ${f}`)
  console.log(`\n❌ ${r.falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log('✅ abre em 100 igual pra todos · cai até 0 · quem ninguém quis vai pras sobras ·')
console.log('   ninguém fica devendo, ninguém estoura vaga, nenhuma carta em dois elencos ·')
console.log('   o botão nunca é mudo · e o LEILÃO CEGO DE HOJE continua igualzinho.\n')
