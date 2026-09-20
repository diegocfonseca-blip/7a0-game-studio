// ─── ⏱️ TRAVA: UM RELÓGIO SÓ PRA SALA ──────────────────────────────────────
//
// O bug que o Diego pegou em 20/09, jogando com a turma: *"os tempos de escolhas
// estão MT longos… tem que ser igual ao modo às cegas. E o monte de sobras também,
// que era 15s e tava bem mais também"*. Nos prints: 154s onde são 75s (escolher a
// seleção), 84s onde são 15s (o banner) e 129s onde são 90s (a convocação).
//
// A causa não era a Copa nem o Monte: era o RELÓGIO DO CELULAR dele, ~79s atrasado.
// Todo prazo do online nasce no aparelho do DONO e viaja como um INSTANTE; quem
// recebe fazia a conta com a hora do próprio celular. Dois lugares sem nenhuma
// ligação (a tabela da Copa no banco e o Monte que vem pelo broadcast) deram o
// MESMO erro — a assinatura de relógio torto.
//
// Esta trava confere as três coisas que não podem voltar a quebrar:
//   1. a conta do desvio (e a zona morta que impede a contagem de pular);
//   2. o DONO nunca tem desvio (o jogo dele fica exatamente como era);
//   3. quem LÊ prazo lê na hora da sala — nenhuma tela de contagem pode ter
//      voltado a usar `Date.now()` cru.
//
// uso: node scripts/testa-relogio.mjs [--porta 5251]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5251')

const falhas = []
const ok = (cond, msg) => { if (!cond) falhas.push(msg) }

// ─── 1) A FONTE: quem lê prazo tem que ler na hora da SALA ───────────────────
// (conferência de texto, porque estes são justamente os lugares onde o erro se
// esconde: um `Date.now()` cru numa contagem volta a mentir pra quem é convidado)
const store = readFileSync('src/escalacao/store.tsx', 'utf8')
const screens = readFileSync('src/escalacao/screens.tsx', 'utf8')
const copa = readFileSync('src/escalacao/copa-mundo-online.tsx', 'utf8')

// o dono carimba a hora dele nas duas mensagens que já manda
ok(/function pacoteDeEstado\([\s\S]{0,220}?t: Date\.now\(\)/.test(store), 'o estado do host não vai mais carimbado com a hora dele — o convidado fica sem referência')
ok(/event: 'host_ping', payload: \{ t: Date\.now\(\) \}/.test(store), 'o "tô vivo" do host perdeu o carimbo de hora (é a correção mais frequente, a cada 4s)')
ok(!/payload: packState\(/.test(store), 'sobrou um broadcast de estado SEM carimbo de hora (`packState` cru em vez de `pacoteDeEstado`)')
// e o convidado aprende com ele
ok(/ajustaRelogioSala\(\(payload as/.test(store), 'o convidado não acerta mais o relógio ao receber o estado do host')
ok(/event: 'host_ping'[\s\S]{0,140}?ajustaRelogioSala/.test(store), 'o convidado não acerta mais o relógio no "tô vivo" do host')
// o dono zera (e quem está offline também): a hora dele É a hora da sala
ok(/state\.isHost \|\| state\.onlineMode !== 'online'\) souODono\(\)/.test(store), 'o host deixou de zerar o desvio — a coroa mudar de mão passaria a torcer o relógio dele')
// o vigia de prazo (o que destrava sala parada) mede na hora da sala
ok(/if \(agoraSala\(\) < prazo\) return/.test(store), 'o vigia de prazo voltou a medir pelo relógio do celular')

// as quatro contagens do jogo: leilão · desempate · Monte · cerimônia
const contagens = screens.match(/setInterval\(\(\) => setNow\((agoraSala|Date\.now)\(\)\), 250\)/g) ?? []
ok(contagens.length >= 4, `achei só ${contagens.length} contagens de tela (esperava 4: leilão, desempate, Monte e cerimônia) — a trava não conferiu o que devia`)
ok(contagens.every(c => c.includes('agoraSala')), 'alguma contagem da tela voltou pro `Date.now()` — quem tem o celular atrasado volta a ver o número inflado')

// a 5ª: a janela de listar/sondar do online (carreira online e Minhas Ligas)
const piramide = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
ok(/setInterval\(\(\) => setNow\(agoraSala\(\)\), 250\)/.test(piramide), 'a contagem da janela de listar/sondar do online voltou pro relógio do celular')

// a Copa do Mundo online
ok(/new Date\(ate\)\.getTime\(\) - agoraSala\(\)/.test(copa), 'a Copa do Mundo online voltou a contar os prazos pelo relógio do celular (era o "154s" do print dele)')
ok(/const venceu = f\.ate \? agoraSala\(\)/.test(copa), 'o dono da sala decide o vencimento da fase da Copa fora do relógio da sala')

// ⚙️ e o botão que ele pediu no mesmo dia
ok(/Gerenciar técnicos', '⚙️ Manage managers'/.test(screens), 'sumiu o "⚙️ gerenciar técnicos" da tela de FIM do online (pedido dele em 20/09)')

// ─── 2) A CONTA: roda o módulo de verdade no navegador ───────────────────────
const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const R = await import('/src/escalacao/relogio.ts')
  const f = []
  const ok = (c, m) => { if (!c) f.push(m) }
  const perto = (a, b, tol = 900) => Math.abs(a - b) <= tol

  // 🧍 quem não está em sala nenhuma: a hora é a do próprio aparelho, como sempre
  R.souODono()
  ok(R.desvioSala() === 0, 'fora da sala o relógio devia ser o do aparelho (desvio 0)')
  ok(perto(R.agoraSala(), Date.now(), 5), 'sem desvio, `agoraSala()` tem que ser o `Date.now()` de sempre')

  // 🐛 O CASO DO DIEGO: celular 79s ATRASADO num convidado.
  // O dono carimba "agora" com a hora DELE, que está 79s à frente da minha.
  const ATRASO = 79_000
  R.ajustaRelogioSala(Date.now() + ATRASO)
  ok(perto(R.desvioSala(), ATRASO), `o desvio medido deu ${Math.round(R.desvioSala() / 1000)}s em vez de 79s`)

  // e agora a conta da tela: o dono armou 75s pra escolher a seleção
  const prazoDoDono = Date.now() + ATRASO + 75_000        // instante carimbado por ELE
  const comRelogioDoCelular = Math.ceil((prazoDoDono - Date.now()) / 1000)
  const comRelogioDaSala = Math.ceil((prazoDoDono - R.agoraSala()) / 1000)
  ok(comRelogioDoCelular >= 150, 'o teste não reproduziu o bug: com o relógio do celular tinha que dar ~154s')
  ok(perto(comRelogioDaSala * 1000, 75_000), `com o relógio da sala a escolha da seleção deu ${comRelogioDaSala}s — o certo é 75s`)

  // 🪣 o Monte de 15s — o outro print dele, por um caminho de código totalmente diferente
  const monteDoDono = Date.now() + ATRASO + 15_000
  ok(perto(Math.ceil((monteDoDono - R.agoraSala()) / 1000) * 1000, 15_000), 'o Monte de sobras não voltou pros 15s')
  // 🔨 e o envelope do leilão às cegas, que é a régua que ele citou
  const envelopeDoDono = Date.now() + ATRASO + 45_000
  ok(perto(Math.ceil((envelopeDoDono - R.agoraSala()) / 1000) * 1000, 45_000), 'o envelope do leilão às cegas não voltou pros 45s')

  // 🧊 ZONA MORTA: a variação da rede (uns 200ms) não pode fazer o número pular
  const antes = R.desvioSala()
  R.ajustaRelogioSala(Date.now() + ATRASO + 200)
  ok(R.desvioSala() === antes, 'um carimbo com 200ms de diferença mexeu no relógio — a contagem vai pular na tela')
  // mas relógio torto DE VERDADE (mudou 10s) tem que ser aprendido
  R.ajustaRelogioSala(Date.now() + ATRASO + 10_000)
  ok(perto(R.desvioSala(), ATRASO + 10_000), 'um desvio novo de 10s não foi aprendido')

  // 🚧 lixo não encosta no relógio
  const guardado = R.desvioSala()
  for (const lixo of [undefined, null, NaN, 'agora', {}, Date.now() + 20 * 3600 * 1000]) R.ajustaRelogioSala(lixo)
  ok(R.desvioSala() === guardado, 'um carimbo inválido/absurdo mexeu no relógio da sala')

  // 👑 virei o dono: a minha hora passa a ser a hora da sala, na hora
  R.souODono()
  ok(R.desvioSala() === 0, 'assumir a coroa não zerou o desvio — o novo dono carimbaria prazos torcidos')

  return f
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
falhas.push(...r)

console.log('\n⏱️  UM RELÓGIO SÓ PRA SALA · a hora que vale é a do DONO\n')
if (falhas.length) {
  for (const f of falhas) console.log(`   🔴 ${f}`)
  console.log(`\n❌ ${falhas.length} problema(s).\n`)
  process.exit(1)
}
console.log('✅ celular 79s atrasado volta a ver 75s na seleção, 15s no Monte e 45s no envelope ·')
console.log('   o dono nunca tem desvio (o jogo dele fica idêntico) ·')
console.log('   jitter de rede não faz a contagem pular · carimbo estranho não encosta no relógio.\n')
