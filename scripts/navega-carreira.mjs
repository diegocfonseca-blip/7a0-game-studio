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

const { b, p } = await abre()
try {
  if (FASE === 'nova') await faseNova(p)
  else if (FASE === 'modais') await faseModais(p)
  else await faseAbas(p)
  console.log(`📸 imagens em ${PASTA}`)
} finally { await b.close() }
