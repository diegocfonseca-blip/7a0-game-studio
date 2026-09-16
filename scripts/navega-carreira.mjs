#!/usr/bin/env node
// 🕹️ NAVEGA A CARREIRA DE VERDADE — fotografa e MEDE todas as telas do modo carreira
//
// Pedido do Diego (16/09): *"confira todas telas do modo carreira e modais e me
// sugira aonde vc faria mudanças visuais pra organizar melhor?"*. Pra responder isso
// sem achismo é preciso ABRIR o jogo, jogar, e medir — foi o que este arquivo faz.
// Ele mora no repo porque o levantamento à mão se perde (mesmo motivo do
// `mockup-batismo.mjs`), e porque a próxima pergunta de tela vai precisar dele.
//
// Como usar:
//   1. num terminal:  DEPLOY_BASE=/ npx vite --port 5199
//   2. noutro:        node scripts/navega-carreira.mjs --fase nova     (cria a carreira do zero)
//                     node scripts/navega-carreira.mjs --fase abas     (fotografa as 5 abas)
//                     node scripts/navega-carreira.mjs --fase modais   (fotografa os modais)
//                     node scripts/navega-carreira.mjs --fase crise    (prova que a crise TRAVA a rodada)
//
// A fase `nova` é a cara: cria carreira, joga o leilão (lance ZERO — o elenco vem do
// Monte das sobras, que serve pra olhar tela), assina os patrocínios e corre ~35
// rodadas. No fim ela GRAVA o localStorage em `--pasta`/save.json, e as outras fases
// recarregam esse save em 10 segundos em vez de refazer tudo.
//
// ⚠️ O jogo é offline-first: sem Supabase alcançável ele mostra a faixa "Manutenção
// rápida no servidor". Isso é esperado aqui e não atrapalha a medida.
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const FASE = arg('fase', 'abas')
const PASTA = arg('pasta', '/tmp/carreira-telas')
const URL = arg('url', 'http://localhost:5199/')
const CEL = { width: 430, height: 900 }
mkdirSync(PASTA, { recursive: true })

const abre = async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
  const p = await b.newPage({ viewport: CEL, deviceScaleFactor: 2, locale: 'pt-BR' })
  p.on('pageerror', e => console.log('⚠️ erro na página:', e.message.slice(0, 140)))
  return { b, p }
}
// rótulo de todo clicável, com o índice — é assim que o roteiro acha o botão da vez
const botoes = p => p.evaluate(() => [...document.querySelectorAll('button,[role=button],a')]
  .map((e, i) => i + ':' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 46))
  .filter(s => s.split(':').slice(1).join(':')))
const texto = p => p.evaluate(() => document.body.innerText)
const clica = async (p, re, ms = 6000) => {
  const alvo = (await botoes(p)).find(s => re.test(s.split(':').slice(1).join(':')))
  if (!alvo) return false
  await p.locator('button,[role=button],a').nth(Number(alvo.split(':')[0])).click({ timeout: ms }).catch(() => {})
  return true
}
// a home do estúdio vem antes do jogo; depois dela, o botão de retomar a carreira
const entra = async (p, retomando) => {
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000)
  await p.getByText('LEILÃO LEGENDS 38').first().click(); await p.waitForTimeout(2400)
  await p.getByText('BR', { exact: false }).first().click().catch(() => {}); await p.waitForTimeout(600)
  if (retomando) { await p.getByText(/CONTINUAR · /i).first().click({ timeout: 8000 }).catch(() => {}); await p.waitForTimeout(4000) }
}
const carrega = async p => {
  const save = JSON.parse(readFileSync(`${PASTA}/save.json`, 'utf8'))
  await p.goto(URL, { waitUntil: 'domcontentloaded' })
  await p.evaluate(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, save)
  await entra(p, true)
}
const guarda = async p => writeFileSync(`${PASTA}/save.json`,
  await p.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage)))))

// ── FASE 1: cria uma carreira jogável do zero ───────────────────────────────
async function faseNova(p) {
  await entra(p, false)
  await p.getByText(/MODO CARREIRA/i).first().click(); await p.waitForTimeout(2000)
  await p.locator('input').first().fill('Nova Eclipse')
  await p.getByText('Não escolher').first().click(); await p.waitForTimeout(400)
  await p.getByText(/AVANÇAR/i).first().click(); await p.waitForTimeout(2500)
  await p.getByText(/COMEÇAR O LEILÃO/i).first().click(); await p.waitForTimeout(3000)
  for (const t of ['pular todas as dicas', 'Entendi, bora dar lance']) {
    await p.getByText(t).first().click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(500)
  }
  // lance ZERO em tudo: o elenco vem das sobras do Monte. Serve pra olhar tela.
  const SEGUE = /LACRAR|CONTINUAR|PRÓXIM|AVANÇAR|COMEÇAR|VAMOS|^OK$|FECHAR|ENTENDI|PULAR|SEGUIR|MONTE|TEMPORADA|RODADA|LEVAR|PEGAR|ESCOLH/i
  const t0 = Date.now()
  while (Date.now() - t0 < 420000) {
    if (/Próxima rodada|Tática do próximo/i.test(await texto(p))) break
    if (await clica(p, SEGUE)) await p.waitForTimeout(900)
    else await p.waitForTimeout(2000) // a Cerimônia passa sozinha: só esperar
  }
  // a virada: assina o Master e o Pontual, começa a temporada
  await clica(p, /CONTRATO MASTERMax Joias/); await p.waitForTimeout(1200)
  await clica(p, /ASSINAR · MAX JOIAS|✍️ ASSINAR/); await p.waitForTimeout(1200)
  await clica(p, /Não cair de divisão/); await p.waitForTimeout(1200)
  await clica(p, /PROPOSTA 1/); await p.waitForTimeout(1200)
  await clica(p, /ASSINAR CONTRATO/); await p.waitForTimeout(1200)
  await clica(p, /Começar a temporada/); await p.waitForTimeout(3000)
  for (let r = 0; r < 4; r++) {  // ~35 rodadas: chega no fim da 1ª temporada
    if (!await clica(p, /PULAR|Próxima rodada/i)) break
    await p.waitForTimeout(3500)
    for (let k = 0; k < 8; k++) { if (await clica(p, /PULAR/i)) await p.waitForTimeout(2500); else break }
  }
  await guarda(p)
  console.log(`✅ carreira pronta em ${PASTA}/save.json —`, (await texto(p)).match(/RODADA \d+ ?\/ ?38|Rodada \d+ ?\/ ?38/)?.[0] ?? '?')
}

// ── FASE 2: as 5 abas, fotografadas e medidas ───────────────────────────────
async function faseAbas(p) {
  await carrega(p)
  await clica(p, /^fechar$|^✕$/); await p.waitForTimeout(700)
  for (const aba of ['Jogos', 'Tabelas', 'Elenco', 'Rank', 'Clube']) {
    await p.getByRole('button', { name: new RegExp(`^${aba}$`) }).first().click({ timeout: 6000 }).catch(() => {})
    await p.waitForTimeout(1600)
    // ⚠️ voltar ao topo ANTES de fotografar: trocar de aba não rebobina a rolagem,
    // e sem isto o "topo" sai do meio da tela anterior (erro pego em 16/09).
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500)
    await p.screenshot({ path: `${PASTA}/aba-${aba}-topo.png` })
    await p.screenshot({ path: `${PASTA}/aba-${aba}-tudo.png`, fullPage: true })
    const m = await p.evaluate(() => {
      // onde começa cada coisa? (y absoluto — é o que diz o que vem ANTES do conteúdo)
      const y = frase => { let e = [...document.querySelectorAll('*')]
        .filter(x => (x.textContent || '').includes(frase)).sort((a, c) => a.textContent.length - c.textContent.length)[0]
        return e ? Math.round(e.getBoundingClientRect().top + window.scrollY) : null }
      const svg = [...document.querySelectorAll('svg')].map(s => s.getBoundingClientRect())
        .filter(r => r.height > 120).sort((a, b) => a.top - b.top)[0]
      return { total: document.documentElement.scrollHeight,
        conta: y('Sua carreira só existe neste aparelho'), paywall: y('Acelerar e pular'),
        desenhoGrande: svg ? Math.round(svg.top + window.scrollY) : null }
    })
    console.log(`${aba.padEnd(8)} rolagem ${String(m.total).padStart(4)}px (${(m.total / CEL.height).toFixed(1)} telas)` +
      ` · caixa de conta y=${m.conta} · faixa do Desbloquear y=${m.paywall}` +
      (m.desenhoGrande ? ` · 1º desenho grande y=${m.desenhoGrande}` : ''))
  }
}

// ── FASE 3: os modais ───────────────────────────────────────────────────────
async function faseModais(p) {
  await carrega(p)
  await clica(p, /^fechar$|^✕$/); await p.waitForTimeout(700)
  // é modal quando existe um `position:fixed` alto por cima da tela
  const modalAberto = () => p.evaluate(() => {
    const o = [...document.querySelectorAll('div')].find(e => { const s = getComputedStyle(e)
      return s.position === 'fixed' && parseInt(s.zIndex || '0') > 30 && e.getBoundingClientRect().height > 250 })
    return o ? (o.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 110) : null
  })
  const ALVOS = [
    ['Elenco', /Contratar preparador/i, 'preparador'],
    ['Elenco', /SUBIR DA BASE/i, 'base'],
    ['Elenco', /COMPARTILHAR/i, 'compartilhar'],
    ['Clube', /Banco Legends/i, 'banco'],
    ['Clube', /VIRAR LENDA|Comprar uma SAF/i, 'saf'],
    ['Jogos', /Desbloquear/i, 'apoio'],
    ['Jogos', /Sair e salvar/i, 'sair'],
  ]
  for (const [aba, rot, nome] of ALVOS) {
    await p.getByRole('button', { name: new RegExp(`^${aba}$`) }).first().click({ timeout: 6000 }).catch(() => {})
    await p.waitForTimeout(1300)
    if (!await clica(p, rot)) { console.log(`✗ ${nome}: não achei o botão`); continue }
    await p.waitForTimeout(1600)
    const m = await modalAberto()
    console.log(`${m ? '✓' : '·'} ${nome}: ${m ?? '(abriu como TELA, não como modal)'}`)
    await p.screenshot({ path: `${PASTA}/modal-${nome}.png` })
    await clica(p, /^✕$|^fechar$|FECHAR|VOLTAR|CANCELAR/); await p.waitForTimeout(800)
  }
}

// ── FASE 4: 🚨 a crise financeira TRAVA a rodada? ───────────────────────────
// Por que isto existe: durante um mês o código DIZIA, em comentário, que a crise
// "trava até o técnico escolher" — e não travava. `decisoesOk` só olhava
// patrocínio e o `canNext` do controle só olhava intervalo e pênalti. O dono do
// Divizeiro passou 240 temporadas com o aviso pendurado, jogando e faturando.
// Comentário não é trava: esta fase ABRE o jogo e confere que a rodada PARA.
// Confere as duas pontas:
//   · caixa NEGATIVO + crise pendente → a rodada não anda (é a cobrança do Diego:
//     "ele é obrigado a resolver na hora e seguir");
//   · caixa POSITIVO + crise pendente (o save preso do Divizeiro) → o aviso expira
//     sozinho e o jogo segue. Sem isto, ligar a trava prenderia esses saves PRA
//     SEMPRE numa tela sem saída — o oposto do que o Diego pede.
async function faseCrise(p) {
  const save = JSON.parse(readFileSync(`${PASTA}/save.json`, 'utf8'))
  const rodada = () => p.evaluate(() => (document.body.innerText.match(/RODADA (\d+)\/38/i) || [])[1] ?? '?')
  const temBanner = () => p.evaluate(() => /NÃO JOGO EM TIME DURO|not playing for a club this broke/i.test(document.body.innerText))
  let falhas = 0
  for (const caixa of [-900, 3870]) {
    const s = { ...save }
    for (const k of ['esc-solo-inprogress-v1', 'esc-solo-career']) {
      if (!s[k]) continue
      const st = JSON.parse(s[k]), m = st.managers[st.youIdx]
      const alvo = [...m.squad].sort((a, c) => (c.fame - a.fame) || (c.hi - a.hi))[0]
      st.careerCoins = { ...(st.careerCoins || {}), [m.id]: caixa }
      st.careerDebtBarrier = { ...(st.careerDebtBarrier || {}), [m.id]: -500 }
      st.careerCrise = { [m.id]: { playerId: alvo.id, playerName: alvo.name, pos: alvo.pos } }
      s[k] = JSON.stringify(st)
    }
    await p.goto(URL, { waitUntil: 'domcontentloaded' })
    await p.evaluate(x => { for (const [k, v] of Object.entries(x)) localStorage.setItem(k, v) }, s)
    await entra(p, true)
    const r0 = await rodada(), b0 = await temBanner()
    await p.waitForTimeout(22000) // o modo automático anda sozinho a cada poucos segundos
    const r1 = await rodada(), b1 = await temBanner()
    if (caixa < 0) {
      const ok = b0 && b1 && r0 === r1
      console.log(`${ok ? '✅' : '❌'} caixa ${caixa}: rodada ${r0} → ${r1}, aviso ${b1 ? 'na tela' : 'sumiu'} ` +
        `(esperado: PARADA na ${r0} com o aviso na tela)`)
      if (!ok) falhas++
    } else {
      const ok = !b1 && r1 !== r0
      console.log(`${ok ? '✅' : '❌'} caixa +${caixa}: o aviso ${b1 ? 'FICOU' : 'expirou sozinho'} e a rodada foi ${r0} → ${r1} ` +
        `(esperado: aviso some e o jogo segue)`)
      if (!ok) falhas++
    }
  }
  if (falhas) { console.log(`💥 ${falhas} falha(s)`); process.exitCode = 1 } else console.log('🎉 a trava da crise está de pé')
}

const { b, p } = await abre()
try {
  if (FASE === 'nova') await faseNova(p)
  else if (FASE === 'modais') await faseModais(p)
  else if (FASE === 'crise') await faseCrise(p)
  else await faseAbas(p)
  if (FASE !== 'crise') console.log(`📸 imagens em ${PASTA}`)
} finally { await b.close() }
