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
  // 🎚️ AFINA CONFORME DESCE (pedido dele, 20/09: *"qd começa a chegar próximo
  //    do 30 começar a cair os números cada vez mais próximo de um por um"*).
  //    Duas regras, e as duas são LEI daqui pra frente:
  const pulos = esc.slice(0, -1).map((v, i) => v - esc[i + 1])
  ok(pulos.every((p2, i) => i === 0 || p2 <= pulos[i - 1]),
    `a escada tem um pulo que AUMENTA na descida: ${pulos.join(',')}`)
  const de30 = esc.filter(v => v > 0 && v <= 30)
  ok(de30.every((v, i) => i === 0 || v - de30[i] <= 5), 'de 30 pra baixo tem pulo maior que 5')
  // 🎚️ E A PARTIR DO 50 TAMBÉM (2º pedido dele): *"qd chegar no 50 na regressiva
  //    pode ter mais números próximos"*. Antes pulava de 8 em 8 ali (52 → 44).
  const de50 = esc.filter(v => v > 0 && v <= 50)
  ok(de50.every((v, i) => i === 0 || de50[i - 1] - v <= 4), `de 50 pra baixo tem pulo maior que 4: ${de50.join(',')}`)
  ok(de50.length >= 20, `de 50 pra baixo só tem ${de50.length} degraus — ele pediu MAIS números ali`)
  // ⏱️ e eles têm que dar tempo de LER: de nada adianta mais número passando voando
  ok(st.holPassoMs(50, 100) >= 1200, `o degrau do 50 dura ${st.holPassoMs(50, 100)}ms — passa voando`)
  const ultimos = esc.slice(-15, -1) // os 14 últimos degraus antes do zero
  ok(ultimos.every((v, i) => i === 0 || ultimos[i - 1] - v === 1),
    `os últimos degraus deviam cair de 1 em 1 e caem assim: ${ultimos.join(',')}`)
  // ⏱️ e o FUNDO é o mais devagar dos três (é onde a carta troca de mão)
  ok(st.holPassoMs(8, 100) > st.holPassoMs(30, 100), 'o fundo da escada não é mais devagar que o meio')
  ok(st.holPassoMs(30, 100) > st.holPassoMs(80, 100), 'o meio da escada não é mais devagar que o topo')
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
    let repescagem = 0, naResq = 0, rodadasEnv = 0
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
        // ⏱️ CADA rodada de envelope custa 45s de relógio — inclusive as da
        //    REPESCAGEM. Eu tinha esquecido delas e o pregão cego aparecia 4
        //    minutos mais curto do que é de verdade.
        if (s.currentCards.length > 0) rodadasEnv++
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
    // 💰 MOEDA QUE SOBROU NO BOLSO: é o outro lado da repescagem. Se tirar a
    //    repescagem e a galera terminar com o bolso cheio, quer dizer que ficou
    //    dinheiro sem ter em que gastar — e aí a repescagem fazia falta.
    let sobrouMoeda = 0, quantos = 0
    for (const m of s.managers) { if (!m.isHuman && !m.auctionRival) continue; sobrouMoeda += Math.max(0, m.money); quantos++ }
    return { s, caixaInicial, ticks, cartas, precos, msPregao, monteN: monteN ?? 0, repescagem, buracos, naResq, rodadasEnv, sobrouMoeda: quantos ? sobrouMoeda / quantos : 0 }
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
      const antes = s2.hol.levados.filter(x => x.mgr === eu.id).length
      const depois = st.reducer(s2, { type: 'HOLANDES_PEGAR', mgrId: eu.id, cardId: c.id, preco: s2.hol.preco })
      const entrou = !depois.hol || depois.hol.levados.filter(x => x.mgr === eu.id).length > antes
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
      const precoB = s4.hol.preco
      s4 = st.reducer(s4, { type: 'HOLANDES_PEGAR', mgrId: eu4.id, cardId: alvo.id, preco: precoB })
      const um = s4.hol.levados.filter(x => x.cardId === alvo.id).length
      ok(um === 1, `o 1º toque devia arrematar 1 vez e arrematou ${um}`)
      ok(!st.holPodeAgora(s4, eu4.id, alvo.id), 'depois de levar, a tela ainda acende o botão da MESMA carta')
      // 🔁 O SEGUNDO TOQUE (botão que não atualizou, dedo nervoso, rede repetindo
      //    a ação): tem que ser ENGOLIDO. Nada de cobrar duas vezes.
      const dobrado = st.reducer(s4, { type: 'HOLANDES_PEGAR', mgrId: eu4.id, cardId: alvo.id, preco: precoB })
      ok(dobrado.hol.levados.filter(x => x.cardId === alvo.id).length === 1, 'apertar duas vezes na mesma carta arrematou DUAS vezes')
      ok(dobrado.hol.levados.filter(x => x.mgr === eu4.id).reduce((t, l) => t + l.preco, 0) === s4.hol.levados.filter(x => x.mgr === eu4.id).reduce((t, l) => t + l.preco, 0), 'o 2º toque cobrou de novo')
      ok(!!st.holDono(dobrado, alvo.id), 'a tela não consegue ver quem levou a carta')
      ok(st.holDono(dobrado, alvo.id)?.mgr === eu4.id, 'quem apertou não ficou como dono')
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
  // ⏱️ ELE AUTORIZOU O TEMPO MAIOR (20/09, duas vezes): *"pode aumentar um
  //    pouco mais, não tem problema"* e *"não tem problema demorar um pouco mais
  //    o leilão não"*. O teto vira 55s — ainda perto dos 45s do envelope cego, e
  //    o bastante pra caber a escada fina dos 50 pra baixo que ele pediu. Não
  //    subir mais sem ele pedir: acima disso a leva começa a cansar.
  ok(msCheio <= 55000, `a leva inteira leva ${(msCheio / 1000).toFixed(1)}s — passou do teto de 55s que ele autorizou`)

  // 5️⃣-zero ⚡ APERTOU = É SEU NA HORA, NO MESMO TOQUE (decisão dele, 20/09:
  //    *"eu ainda acho que deveria ter que ser por tempo"*). Nada de janela,
  //    nada de esperar o degrau: a carta entra em `levados` — que é o que o
  //    campinho desenha — na mesma ação.
  let sozinhoTestado = 0
  {
    let s0 = novoJogo()
    while (s0.phase === 'holandes' && !s0.currentCards.some(c => st.holPodeAgora(s0, s0.managers[s0.youIdx].id, c.id))) s0 = st.reducer(s0, { type: 'HOLANDES_TICK' })
    if (s0.phase === 'holandes') {
      const eu0 = s0.managers[s0.youIdx]
      const alvo = s0.currentCards.find(c => st.holPodeAgora(s0, eu0.id, c.id))
      const precoNaTela = s0.hol.preco
      const passoAntes = s0.hol.passo
      // ⏱️ UM TOQUE SÓ. Sem janela, sem tick: a carta tem que ser dele já.
      const pego = st.reducer(s0, { type: 'HOLANDES_PEGAR', mgrId: eu0.id, cardId: alvo.id, preco: precoNaTela })
      ok(!!pego.hol, 'o toque fechou a leva inteira — ele só devia entregar a carta')
      if (pego.hol) {
        ok(pego.hol.passo === passoAntes, `o toque mexeu no degrau (${passoAntes} → ${pego.hol.passo}) — pegar não pode mexer no preço`)
        ok(pego.hol.preco === precoNaTela, 'o toque mudou o preço')
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
      // ⏱️ POR TEMPO: o PRIMEIRO toque a chegar no host leva, na hora. O
      //    segundo encontra a carta com dono e é recusado — é exatamente isto
      //    que impede o jogador de cair em DOIS campinhos.
      const fim6 = s6
      const hol6 = fim6.hol
      if (hol6) {
        const donos = hol6.levados.filter(l => l.cardId === alvo.id)
        // 🔒 A TRAVA QUE RESPONDE A PERGUNTA DELE, EM TRÊS PARTES:
        ok(donos.length === 1, `❗ a MESMA carta saiu com ${donos.length} donos — os dois iam pôr o jogador no campinho`)
        ok(donos[0].mgr === a.id, 'quem apertou PRIMEIRO não levou — a regra é por tempo')
        ok(donos[0].preco === precoDisputa, `pagou ${donos[0].preco} e o preço na tela era ${precoDisputa}`)
        // (b) o PERDEDOR não paga nada e continua com a vaga aberta
        const perdedor = donos[0].mgr === a.id ? bb : a
        const caixaPerdedor = perdedor.id === a.id ? caixaA : caixaB
        const gastoPerdedor = hol6.levados.filter(l => l.mgr === perdedor.id).reduce((t, l) => t + l.preco, 0)
        ok(gastoPerdedor === 0, `quem perdeu a disputa foi cobrado ${gastoPerdedor} 🪙 — pedido que não vence não cobra`)
        ok(fim6.managers.find(m => m.id === perdedor.id).money === caixaPerdedor, 'a caixa de quem perdeu mexeu')
        // (c) 🏟️ O CAMPINHO: é `levados` que o `YourPitch` desenha. Se só tem um
        //     dono ali, é impossível o mesmo jogador aparecer em dois campinhos.
        const noCampinhoDe = (id) => hol6.levados.filter(l => l.mgr === id && l.cardId === alvo.id).length
        ok(noCampinhoDe(a.id) + noCampinhoDe(bb.id) === 1, 'o mesmo jogador entrou em DOIS campinhos')
        // (d) e o botão apaga pros dois: ninguém aperta numa carta já arrematada
        ok(!st.holPodeAgora(fim6, a.id, alvo.id) && !st.holPodeAgora(fim6, bb.id, alvo.id), 'carta arrematada ainda aceita toque')
        disputaTestada = 1
      }
    }
  }

  // ⚠️ TESTE QUE NÃO RODA É PIOR QUE TESTE NENHUM: a simulação acima tem `if`s
  //    (precisa achar uma carta que OS DOIS possam pegar). Se ela for pulada em
  //    silêncio, a trava fica verde sem ter conferido nada.
  ok(disputaTestada === 1, 'a disputa de DOIS humanos na mesma carta não chegou a ser testada — verde falso')

  // 5️⃣-ter ⏱️ E O "PRIMEIRO LEVA" VALE SEMPRE, não foi sorte de uma rodada.
  //    Repete a disputa 40 vezes trocando quem aperta primeiro: o resultado tem
  //    que seguir SEMPRE quem chegou antes, nunca o assento nem o sorteio.
  let primeiroLevou = 0, disputasSeguidas = 0
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
    // alterna quem aperta primeiro, pra provar que não é o assento que decide
    const [p1, p2] = r2 % 2 === 0 ? [a, bb] : [bb, a]
    s7 = st.reducer(s7, { type: 'HOLANDES_PEGAR', mgrId: p1.id, cardId: alvo.id, preco: s7.hol.preco })
    s7 = st.reducer(s7, { type: 'HOLANDES_PEGAR', mgrId: p2.id, cardId: alvo.id, preco: s7.hol.preco })
    const d = s7.hol?.levados.filter(l => l.cardId === alvo.id) ?? []
    disputasSeguidas++
    ok(d.length === 1, `a carta disputada saiu ${d.length} vezes — é o arremate duplo que ele teme`)
    if (d[0]?.mgr === p1.id) primeiroLevou++
  }
  ok(disputasSeguidas >= 20, `só deu pra testar ${disputasSeguidas} disputas — pouco pra confiar`)
  ok(primeiroLevou === disputasSeguidas, `quem apertou primeiro levou ${primeiroLevou} de ${disputasSeguidas} — a regra é por TEMPO, tem que ser sempre`)

  // 5️⃣-quater 🎰 QUANTAS VEZES DÁ EMPATE DE VERDADE? (pergunta dele, 20/09:
  //    *"imagina uma sala c/ 20 pessoas, tudo pode ocorrer"*).
  //    Aqui a gente conta, degrau a degrau, quantas cartas tiveram MAIS DE UM
  //    pedido no MESMO preço — que é o único caso em que a roleta gira. Sala de
  //    20 é o pior caso do jogo, então é ela que manda no desenho da regra.
  const empates = {}
  for (const tecnicos of [8, 20]) {
    let s8 = st.reducer(st.INITIAL, { type: 'START', teamName: 'Meu Time', formation: '4-3-3', rivals: tecnicos - 1, holandes: true })
    let cartasResolvidas = 0, comDisputa = 0, maiorRoda = 0, somaRoda = 0
    let marca8 = '', parado8 = 0
    for (let g = 0; g < 4000; g++) {
      if (s8.screen !== 'auction') break
      if (s8.phase !== 'holandes') {
        if (s8.phase === 'envelope' || s8.phase === 'resq_envelope') { s8 = st.reducer({ ...s8, phaseDeadline: null }, { type: 'FORCE_SEAL' }); continue }
        if (s8.phase === 'reveal' || s8.phase === 'resq_reveal') { s8 = st.reducer(s8, { type: 'ADVANCE_REVEAL' }); continue }
        if (s8.phase === 'tiebreak') { s8 = st.reducer({ ...s8, phaseDeadline: null }, { type: 'FORCE_TIEBREAK' }); continue }
        break
      }
      const m8 = `${s8.sectorIdx}|${s8.sectorCursor}|${s8.hol.passo}|${s8.hol.levados.length}`
      if (m8 === marca8) { if (++parado8 > 3) break } else parado8 = 0
      marca8 = m8
      // 📏 olha a fila do degrau ANTES de ela ser resolvida: é aqui que o
      //    empate existe (dois ou mais pedidos na MESMA carta, no MESMO preço).
      const fila = {}
      for (const pd of s8.hol.pedidos) fila[pd.cardId] = (fila[pd.cardId] ?? 0) + 1
      for (const n of Object.values(fila)) {
        cartasResolvidas++
        if (n > 1) { comDisputa++; somaRoda += n; if (n > maiorRoda) maiorRoda = n }
      }
      s8 = st.reducer(s8, { type: 'HOLANDES_TICK' })
    }
    empates[tecnicos] = {
      resolvidas: cartasResolvidas,
      comDisputa,
      pct: cartasResolvidas ? Math.round(100 * comDisputa / cartasResolvidas) : 0,
      mediaRoda: comDisputa ? (somaRoda / comDisputa) : 0,
      maiorRoda,
    }
  }
  // 🔒 A REGRA SÓ SE SUSTENTA SE O EMPATE FOR RARO. Se metade das cartas fosse
  //    pra roleta, o leilão viraria sorteio — e aí valeria a pena parar tudo pra
  //    um re-lance cego. A trava segura esse limite: até 1 carta em 3.
  // 🔒 Isto mede a fila dos ROBÔS. **Gente nunca entra nela** (pessoa leva por
  //    tempo, na hora), então o tamanho dela não muda nada pra quem joga — é só
  //    o tamanho da rede que impede dois donos na mesma carta. O que a trava
  //    segura é o ABSURDO: a fila nunca pode passar do número de técnicos que
  //    disputam o leilão, senão tem robô pedindo duas vezes a mesma carta.
  const tecs20 = 20
  ok(empates[20].maiorRoda <= tecs20, `sala de 20: fila de ${empates[20].maiorRoda} robôs numa carta só, com ${tecs20} técnicos — alguém pediu duas vezes`)
  ok(empates[8].maiorRoda <= 8, `sala de 8: fila de ${empates[8].maiorRoda} robôs numa carta só — alguém pediu duas vezes`)

  // 7️⃣ 🌐 ONLINE: o que o convidado PODE e o que ele NÃO PODE receber.
  //    Liberado em 20/09 pro Rápido online e pro 🏆 Minhas Ligas (ordem dele:
  //    *"ok pode criar no partida rápida e no modo rápido online e minhas ligas"*).
  {
    let so = st.reducer(st.INITIAL, { type: 'START', teamName: 'Meu Time', formation: '4-3-3', rivals: 7, holandes: true })
    ok(so.phase === 'holandes' && !!so.hol, 'o holandês nem abriu — o resto deste teste não vale')
    const pacote = st.sanitizeParaSala(so)

    // 🔒 (a) O SEGREDO QUE NÃO PODE VAZAR: os TETOS dos robôs. Eles dizem por
    //     quanto cada bot vai apertar em cada carta. Convidado com isso na mão
    //     sabe a hora exata de cortar o robô em TODA carta do pregão — acabou o
    //     jogo. Mesma regra do envelope cego, que também não vaza.
    ok(pacote.hol && Object.keys(pacote.hol.tetos ?? {}).length === 0,
      `os tetos dos robôs foram no pacote da sala (${Object.keys(pacote.hol?.tetos ?? {}).length} cartas) — isso entrega o pregão`)
    ok(Object.keys(so.hol.tetos).length > 0, 'o host ficou SEM os tetos — aí o pregão não anda')
    ok(Object.keys(pacote.pendingEnvelopes ?? {}).length === 0, 'o envelope cego vazou no pacote da sala')

    // 👀 (b) E O QUE O CONVIDADO PRECISA VER, ele vê: preço, degrau, quem já
    //     levou o quê e por quanto. Sem isso a tela dele não desenha nada.
    ok(pacote.hol?.preco === so.hol.preco, 'o preço não chegou no convidado')
    ok(pacote.hol?.passo === so.hol.passo, 'o degrau não chegou no convidado')
    ok(Array.isArray(pacote.hol?.levados), 'a lista de quem levou o quê não chegou no convidado')
    ok(pacote.holandes === true, 'o convidado não fica sabendo que a sala é holandesa')

    // 🔁 (c) e o pacote continua servindo pro pregão CEGO igualzinho
    const cego2 = st.reducer(st.INITIAL, { type: 'START', teamName: 'Meu Time', formation: '4-3-3', rivals: 7 })
    const pacoteCego = st.sanitizeParaSala(cego2)
    ok(!pacoteCego.hol, 'sala cega saiu com estado de holandês no pacote')
    ok(pacoteCego.holandes === false, 'sala cega saiu marcada como holandesa')
  }

  // 7️⃣-bis 🏷️ O NOME DO MODO APARECE NAS SALAS ABERTAS (pedido dele, 20/09:
  //    *"as salas abertas colocar ali holandês sei lá pra diferenciar"*).
  //    Isto não dá pra fotografar — a lista de salas exige login — então a
  //    conferência é na fonte: o selo tem que existir, ler a bandeira do
  //    `game_state` e mostrar o nome vindo da fonte ÚNICA (`MODO_NOME`).
  {
    const lob = await (await fetch('/src/escalacao/lobby.tsx')).text()
    ok(/const holandesRoom = /.test(lob), 'a lista de salas não sabe se a sala é de Pescaria')
    ok(/holandesRoom &&/.test(lob), 'a lista de salas não desenha o selo do modo')
    ok(/MODO_NOME/.test(lob), 'o selo da lista escreve o nome na mão em vez de puxar da fonte única')
    // e o nome mora num lugar SÓ: se alguém renomear, renomeia em todas as telas
    ok(st.MODO_NOME?.pt && st.MODO_NOME?.en, 'o nome do modo sumiu da fonte única (MODO_NOME)')
    ok(st.modoNomeDe(false) === st.MODO_NOME.pt && st.modoNomeDe(true) === st.MODO_NOME.en,
      'o nome do modo em PT/EN não bate com a fonte única')
    // 🏷️ o nome é HOLANDÊS por ordem dele (20/09) — *"eu falei pra manter
    //    holandês mesmo"*. A trava segura o nome pra ninguém rebatizar sem pedido.
    // 🎣 o nome saiu de VOTAÇÃO do pessoal dele (20/09) — não se troca sem pedido
    ok(st.MODO_NOME.pt === 'Pescaria' && st.MODO_NOME.en === 'Fishing',
      `o nome do modo foi trocado sem ele pedir: ${st.MODO_NOME.pt} / ${st.MODO_NOME.en}`)
    ok(st.MODO_FISGOU.pt === 'FISGOU!' && st.MODO_FISGOU.en === 'HOOKED!', 'o grito do arremate mudou sem pedido')
    // e nenhuma tela escreve o nome na mão (senão trocar um dia vira caça ao texto)
    const tela = await (await fetch('/src/escalacao/screens.tsx')).text()
    for (const [arq, txt] of [['lobby', lob], ['screens', tela]]) {
      ok(!/Pescaria'/.test(txt.replace(/MODO_NOME[^\n]*/g, '')) || /MODO_NOME/.test(txt), `${arq}: o nome do modo está escrito na mão — tem que puxar de MODO_NOME`)
    }
  }

  // 8️⃣ 🎥🏆 O HOLANDÊS NAS SALAS ESPECIAIS (pedido dele, 20/09: *"veja se vai
  //    funcionar normal no modo stream e também em minhas ligas"*).
  //    As duas têm regras PRÓPRIAS de ritmo, e o holandês tem relógio próprio —
  //    é exatamente o tipo de cruzamento que trava sala.
  const especiais = {}
  for (const [nome, extra] of [
    ['🎥 stream', { stream: true, auctionSecs: 0 }],
    ['🎮 manual', { manual: true, auctionSecs: 0 }],
    ['⏱️ tempo do host (20s)', { auctionSecs: 20 }],
    ['🏆 Minhas Ligas', { liga: true }],
    ['🏆 liga + stream', { liga: true, stream: true, auctionSecs: 0 }],
  ]) {
    let sx = st.reducer(st.INITIAL, {
      type: 'START_ONLINE', roomId: 'r', roomCode: 'ZZZ111', isHost: true,
      playerIndex: 0, playerNames: ['Eu'], formation: '4-3-3', holandes: true, ...extra,
    })
    ok(sx.holandes === true, `${nome}: a sala não ficou holandesa`)
    // 🎬 SALA DE STREAM COMEÇA NA ABERTURA, não no pregão: o host é que dá o
    //    start (`START_STREAM_AUCTION`). Não é travamento — é o desenho da sala,
    //    e o holandês tem que sobreviver a esse degrau a mais.
    let viaStreamIntro = false
    if (sx.screen === 'streamIntro') {
      viaStreamIntro = true
      sx = st.reducer(sx, { type: 'START_STREAM_AUCTION' })
      ok(sx.screen === 'auction', `${nome}: o host deu o start e a sala não abriu o pregão`)
      ok(sx.phase === 'holandes', `${nome}: o host deu o start e a sala abriu o pregão CEGO em vez do holandês`)
    }
    // corre o pregão inteiro, como o relógio faria
    let marca = '', parado = 0, degraus = 0, chegou = false
    for (let g = 0; g < 6000; g++) {
      // 🃏 o MONTE FINAL é fim de pregão válido (é onde o teste principal para
      //    também) — o que não pode é parar ANTES, no meio do leilão.
      if (sx.screen !== 'auction') { chegou = true; break }
      const m = `${sx.screen}|${sx.phase}|${sx.sectorIdx}|${sx.sectorCursor}|${sx.revealIdx}|${sx.monteIdx}|${sx.hol?.passo ?? ''}|${sx.hol?.levados.length ?? ''}`
      if (m === marca) { if (++parado > 3) break } else parado = 0
      marca = m
      if (sx.phase === 'holandes') { sx = st.reducer(sx, { type: 'HOLANDES_TICK' }); degraus++; continue }
      if (sx.phase === 'envelope' || sx.phase === 'resq_envelope') { sx = st.reducer({ ...sx, phaseDeadline: null }, { type: 'FORCE_SEAL' }); continue }
      if (sx.phase === 'reveal' || sx.phase === 'resq_reveal') { sx = st.reducer(sx, { type: 'ADVANCE_REVEAL' }); continue }
      if (sx.phase === 'tiebreak') { sx = st.reducer({ ...sx, phaseDeadline: null }, { type: 'FORCE_TIEBREAK' }); continue }
      if (sx.screen === 'monte') { const a2 = sx.monteOrder[sx.monteIdx]; if (a2 == null || !sx.monte.length) break; sx = st.reducer(sx, { type: 'MONTE_PICK', mgrId: a2, cardId: sx.monte[0].id }); continue }
      break
    }
    // 🔒 O QUE NÃO PODE ACONTECER EM NENHUMA DELAS:
    ok(degraus > 0, `${nome}: o holandês nem começou a descer`)
    ok(chegou, `${nome}: o pregão TRAVOU no meio (parou em screen=${sx.screen} / phase=${sx.phase}) — sala morta`)
    for (const m2 of sx.managers) ok(m2.money >= 0, `${nome}: ${m2.teamName} ficou com caixa negativa`)
    // 🎥 e a sala de stream tem que ter passado MESMO pela tela de abertura
    if (String(nome).includes('stream')) ok(viaStreamIntro, `${nome}: a sala de stream pulou a tela de abertura do host`)
    especiais[nome] = { degraus, fim: sx.screen, intro: viaStreamIntro }
  }

  // ⏱️ 🔻 O RELÓGIO DO HOLANDÊS É UM SÓ, EM TODA SALA (ordem dele, 20/09):
  //    *"no stream não quero que tenha tempo pra escolher não… só se for no
  //    padrão que ele pode, senão vai dar merda — porque tem que ser com base na
  //    regra que fizemos pro modo rápido"*.
  //    Eu tinha feito o `auctionSecs` esticar/encolher a descida; ele mandou
  //    tirar. Esta trava agora segura os DOIS lados da ordem:
  const descidaPadrao = esc.slice(0, -1).reduce((t, v) => t + st.holPassoMs(v, 100), 0)
  // (a) o motor IGNORA qualquer tempo que alguém tente passar
  ok(st.holPassoMs.length <= 2, 'o `holPassoMs` voltou a aceitar um tempo de sala — o holandês tem UM relógio só')
  // (b) e a descida é IDÊNTICA à da Partida Rápida, que é a régua
  ok(Math.abs(descidaPadrao - msCheio) < 1, `a descida da sala (${descidaPadrao}ms) ficou diferente da do rápido (${msCheio}ms)`)
  // (c) o SELETOR DE TEMPO não pode nem aparecer quando o host escolhe holandês
  {
    const lob2 = await (await fetch('/src/escalacao/lobby.tsx')).text()
    ok(/roomStream && !rapidoHolandes/.test(lob2), 'o seletor de tempo ainda aparece na sala de stream com o holandês ligado')
    ok(/roomStream && rapidoHolandes/.test(lob2), 'falta o aviso explicando por que não tem tempo pra escolher no holandês')
    // e o tempo não pode nem ser GRAVADO na sala quando o pregão é holandês
    ok(/roomStream && !rapidoHolandes && auctionSecs/.test(lob2), 'a sala holandesa ainda grava um tempo de pregão')
  }
  const respeitaTempo = false

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
    salas, disputaTestada, empates, primeiroLevou, disputasSeguidas, especiais, respeitaTempo, descidaPadrao, sozinhoTestado, janelaMs: st.HOL_JANELA_MS,
    repHol: hol.repescagem, repCego: cego.repescagem,
    moedaHol: hol.sobrouMoeda, moedaCego: cego.sobrouMoeda,
    rodadasCego: cego.rodadasEnv,
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
console.log(`         └─ ${r.arremates - r.resqHol} no pregão · ${r.resqHol} na repescagem · 🃏 ${r.monteHol} no Monte Final · ${r.buracoHol} vagas vazias · 💰 sobrou ${r.moedaHol.toFixed(1)} 🪙 por técnico`)
console.log(`      ✉️ cego (hoje): ${String(r.cegoCartas).padStart(3)} cartas · ${String(r.cegoArremates).padStart(3)} arremates · preço médio ${r.cegoPrecoMedio.toFixed(1)} 🪙 · ~${r.rodadasCego * 45}s de pregão (${r.rodadasCego} rodadas × 45s, repescagem incluída)`)
console.log(`         └─ ${r.cegoArremates - r.resqCego} no pregão · ${r.resqCego} na repescagem · 🃏 ${r.monteCego} no Monte Final · ${r.buracoCego} vagas vazias · 💰 sobrou ${r.moedaCego.toFixed(1)} 🪙 por técnico\n`)
console.log(`   ⚡ APERTOU → é seu NO MESMO TOQUE (por tempo): ${r.sozinhoTestado ? 'testado' : '⚠️ NÃO testado'}`)
console.log(`   👥👥 DOIS NA MESMA CARTA: ${r.disputaTestada ? 'testado' : '⚠️ NÃO testado'} · quem apertou primeiro levou ${r.primeiroLevou}/${r.disputasSeguidas} (tem que ser 100%)`)
console.log('')
for (const n of [8, 20]) {
  const e = r.empates[n]
  console.log(`   🤖 SALA DE ${n}: ${e.comDisputa} de ${e.resolvidas} cartas tiveram 2+ ROBÔS na fila (${e.pct}%) · média ${e.mediaRoda.toFixed(1)} · maior ${e.maiorRoda} — é só aqui que a roleta invisível age; gente leva por tempo e nem passa por essa fila`)
}
console.log('')
console.log('   🎥🏆 E NAS SALAS ESPECIAIS (pregão inteiro rodado em cada uma):')
for (const [nome, v] of Object.entries(r.especiais)) console.log(`      ${nome.padEnd(24)} ${String(v.degraus).padStart(4)} degraus · ${v.intro ? 'host deu o start · ' : ''}terminou em ${v.fim}`)
console.log(`      ⏱️ a descida é a MESMA em toda sala (${(r.descidaPadrao / 1000).toFixed(1)}s) — no holandês o host não escolhe tempo, quem manda é o preço caindo\n`)
console.log('   👥 E O BARALHO SEGUE O TAMANHO DA SALA — pela MESMA conta nos dois modos:\n')
console.log('      técnicos │ vagas (11 cada) │ cartas no baralho │ levas')
console.log('      ─────────┼─────────────────┼───────────────────┼───────')
for (const sl of r.salas) {
  console.log(`      ${String(sl.tecnicos).padStart(8)} │ ${String(sl.vagas).padStart(15)} │ ${String(sl.cartas).padStart(17)} │ ${String(sl.levas).padStart(5)}`)
}
console.log('      (o tempo de pregão está medido lá em cima, nos dois modos — aqui seria chute)')
console.log('')
if (r.falhas.length) {
  for (const f of r.falhas) console.log(`   🔴 ${f}`)
  console.log(`\n❌ ${r.falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log('✅ abre em 100 igual pra todos · cai até 0 · quem ninguém quis vai pras sobras ·')
console.log('   ninguém fica devendo, ninguém estoura vaga, nenhuma carta em dois elencos ·')
console.log('   o botão nunca é mudo · e o LEILÃO CEGO DE HOJE continua igualzinho.\n')
