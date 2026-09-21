// ─── 🐊 TRAVA: O "SOLTA A SUA MASCOTE" NA TOCAIA E NO MONTE ─────────────────
//
// Diego (21/09), com o print da Tocaia na mão: *"coloque o solta mascote botão
// aqui embaixo do campinho. Apenas no modo Tocaia e quando aparece o monte de
// sobras. Porque o solta o mascote já tem no modo envelope às cegas, certo, mas
// aqui como tem abas diferentes"*.
//
// Ele estava certo e o motivo é estrutural: no envelope cego a mascote mora na
// barra "😈 CUTUCA QUEM TÁ PENSANDO", que só nasce DEPOIS de você lacrar. Na
// Tocaia não se lacra nada (o preço é que cai), então essa barra não existe —
// e quem tem clube batizado ficava sem soltar o bicho justamente no modo novo.
//
// ⚠️ E EU ENTENDI ERRADO NA PRIMEIRA VEZ: espalhei o botão no PREGÃO da Tocaia
// também. Ele cortou na hora: *"como assim em cada um?? eu disse apenas no monte
// de sobras, onde fica embaixo do campinho. E só no modo Tocaia. Porque no modo
// envelope já tá ótimo onde está ele"*. É UM lugar só.
//
// O que esta trava segura:
//   1. o botão aparece no MONTE, embaixo do campinho, só em sala de Tocaia;
//   2. NÃO aparece no pregão da Tocaia (o excesso que ele reprovou);
//   3. continua sendo SÓ de quem tem clube batizado — nada de placeholder pra
//      quem não comprou (régua dele);
//   4. e o botão do envelope às cegas continua onde sempre esteve.
//
// uso: node scripts/testa-mascote-botao.mjs [--porta 5257] [--foto]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { readFileSync, mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5257')
const FOTO = process.argv.includes('--foto')
const COMPLETO = process.argv.includes('--completo') // joga o pregão INTEIRO até o Monte (~8 min)

const falhas = []
const ok = (c, m) => { if (!c) falhas.push(m) }

// ── 1) a fonte: UM lugar só, e travado no modo Tocaia ─────────────────────
const src = readFileSync('src/escalacao/screens.tsx', 'utf8')
const usos = (src.match(/<MascoteJab \/>/g) ?? []).length
// ⚠️ DOIS, não três. Eu tinha espalhado o botão em três telas e ele corrigiu:
//    *"como assim em cada um?? eu disse apenas no monte de sobras… e só no modo
//    Tocaia. Porque no modo envelope já tá ótimo onde está ele"*. Esta trava
//    existe pra eu não repetir: um no pregão do envelope cego (o de sempre) e
//    um no Monte. Mais que isso é espalhar de novo.
ok(usos === 2, `o "solta a mascote" aparece em ${usos} tela(s); tem que ser 2 — o do envelope cego (que já existia) e o do Monte`)
// e o do Monte só pode aparecer em sala de Tocaia
ok(/\{state\.holandes && <div className="flex justify-center"><MascoteJab \/><\/div>\}/.test(src),
  'o botão do Monte não está travado no modo Tocaia — em sala de envelope cego ele não pode aparecer')
// o pregão da Tocaia NÃO pode ter o botão (foi o excesso que ele reprovou)
const iTocaia = src.indexOf('O CAMPINHO, embaixo da lista')
ok(iTocaia > 0, 'não achei o campinho da Tocaia — a trava não conferiu nada')
ok(!/MascoteJab/.test(src.slice(iTocaia, iTocaia + 1500)), '⚠️ o botão da mascote voltou pro PREGÃO da Tocaia — ele pediu só no Monte')

// ── 2) o comportamento, no jogo de verdade ────────────────────────────────
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 940 }, deviceScaleFactor: 2 })
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1500)

const clica = async (txt, ms = 500) => {
  const el = p.locator('button', { hasText: txt }).first()
  if (!(await el.count())) return false
  await el.click({ timeout: 5000, force: true }).catch(() => {})
  await p.waitForTimeout(ms)
  return true
}
// entra numa partida rápida NA TOCAIA e vai até o MONTE DE SOBRAS
await clica('LEILÃO LEGENDS 38', 1400)
await clica('✕', 400)
await clica('BR', 700)
await clica('PARTIDA RÁPIDA', 1400)
await clica('Tocaia', 500)
await p.locator('input').first().fill('Trava FC').catch(() => {})
await p.waitForTimeout(300)
for (let i = 0; i < 6; i++) {
  if (await p.locator('text=Preço agora').count()) break
  if (!(await clica('AVANÇAR', 1500)) && !(await clica('COMEÇAR', 1500)) && !(await clica('Entendi', 700)) && !(await clica('PULAR', 700))) break
}
const achaBotao = () => p.locator('button', { hasText: 'SOLTA A SUA MASCOTE' }).count()

// 🐆 já liga o sócio de mentira: assim dá pra provar que no PREGÃO ele não sai
await p.evaluate(async () => { (await import('/src/escalacao/manto.ts')).bancadaSocio('pantera_negra') })
await p.waitForTimeout(700)
ok(await achaBotao() === 0, '⚠️ o botão apareceu no PREGÃO da Tocaia — ele pediu só no Monte de sobras')

// 🪣 O MONTE FICA ATRÁS DE `--completo`, e por um motivo prático: pra chegar
// nele a máquina tem que JOGAR o pregão inteiro da Tocaia — 5 setores de
// descida + repescagem, uns 8 minutos. Trava que demora 8 minutos ninguém roda,
// e trava que ninguém roda não protege nada. Então:
//   · no dia a dia (`npm run mascote-botao`): a fonte + a prova de que o botão
//     NÃO está no pregão (que é justamente o excesso que ele reprovou);
//   · quando mexer no Monte (`npm run mascote-botao -- --completo`): joga o
//     pregão até o fim e confere o botão na tela de verdade.
if (COMPLETO) {
  const NO_MONTE = 'text=As sobras do pregão'
  let chegou = false
  for (let i = 0; i < 700; i++) {
    if (await p.locator(NO_MONTE).count()) { chegou = true; break }
    await clica('Entendi', 120)
    await p.waitForTimeout(900)
  }
  ok(chegou, 'o pregão não chegou no Monte de sobras — a trava não conferiu o que importa')
  if (chegou) {
    await p.evaluate(async () => { (await import('/src/escalacao/manto.ts')).bancadaSocio('pantera_negra') })
    await p.waitForTimeout(900)
    ok(await achaBotao() > 0, 'com clube batizado e sala de Tocaia, o botão NÃO apareceu no Monte de sobras')
    // 🚫 e sem clube batizado não aparece botão nenhum (régua dele)
    await p.evaluate(async () => { (await import('/src/escalacao/manto.ts')).bancadaSocio(null) })
    await p.waitForTimeout(600)
    ok(await achaBotao() === 0, '⚠️ o botão apareceu pra quem NÃO tem clube batizado')
    await p.evaluate(async () => { (await import('/src/escalacao/manto.ts')).bancadaSocio('pantera_negra') })
    await p.waitForTimeout(500)
  }
} else {
  console.log('   ⏭️  o Monte só é jogado com `--completo` (leva ~8 min: é o pregão inteiro)')
}

if (FOTO) {
  mkdirSync('mockups', { recursive: true })
  await p.screenshot({ path: 'mockups/mascote-monte.png', fullPage: true })
  console.log('   📸 mockups/mascote-monte.png')
}

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

console.log('\n🐊 SOLTA A SUA MASCOTE · na Tocaia e no Monte de sobras\n')
if (falhas.length) {
  for (const f of falhas) console.log(`   🔴 ${f}`)
  console.log(`\n❌ ${falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log(COMPLETO
  ? '✅ o botão aparece SÓ no Monte de sobras, embaixo do campinho, e SÓ em sala de Tocaia ·'
  : '✅ um lugar só (o Monte), travado no modo Tocaia, e FORA do pregão ·')
console.log(COMPLETO ? '   não aparece no pregão · não aparece pra quem não tem clube batizado ·' : '   (rode com `-- --completo` pra jogar o pregão até o Monte e ver na tela) ·')
console.log('   e o envelope às cegas segue com o dele, onde sempre esteve.\n')
