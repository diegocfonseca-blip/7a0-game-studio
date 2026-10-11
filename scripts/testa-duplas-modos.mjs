// ─── 🤝 TRAVA: DUPLAS NA TOCAIA E NO LEILÃO DE CLUBES (12/10, OK do Diego) ──────
//
// A dupla divide as posições 3 e 3 (GOL/LAT/ZAG/MEI/ATA + Monte). Essa divisão já valia no
// envelope cego; agora vale igual na 🐊 Tocaia (quem manda na posição aperta PEGAR) e na
// 🧱 convocação dos Clubes (cada um convoca as posições DELE; o host junta as duas metades).
//
// O que esta trava segura:
//   · o PEGAR da Tocaia acende SÓ pra quem manda — e a TELA e o MOTOR dizem a mesma coisa
//     (regra contra botão mudo: foi assim que a Tocaia em dupla quebrou, o toque ia sem crachá);
//   · o parceiro NÃO pega carta da posição do outro, nem sem crachá;
//   · na convocação cada um só mexe nos SEUS setores, e o time só fecha com os dois;
//   · fora de dupla, nada muda.
//
// uso: node scripts/testa-duplas-modos.mjs [--porta 5241]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5241')
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
  const DIV = { GOL: 'A', LAT: 'A', ZAG: 'A', MEI: 'B', ATA: 'B', MONTE: 'B' }
  const comDupla = (s, id) => ({ ...s, duplas: { [id]: { ownerUid: 'A', ownerName: 'Ana', partnerUid: 'B', partnerName: 'Beto', cats: { ...DIV } } } })

  // 1️⃣ 🐊 TOCAIA: anda o relógio até abrir a leva dos GOLEIROS
  let s = st.reducer(st.INITIAL, { type: 'START', teamName: 'Dupla FC', formation: '4-3-3', rivals: 5, holandes: true })
  const eu = s.managers[s.youIdx].id
  s = comDupla(s, eu)
  for (let g = 0; g < 50 && s.phase !== 'holandes'; g++) s = st.reducer(s, { type: 'ADVANCE_REVEAL' })
  ok(s.phase === 'holandes', `a Tocaia não abriu (fase ${s.phase})`)
  if (s.phase === 'holandes') {
    const pos = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'][s.sectorIdx]
    const dono = DIV[pos], outro = dono === 'A' ? 'B' : 'A'
    const c = s.currentCards[0]
    ok(st.holPodeAgora(s, eu, c.id, dono), `quem manda em ${pos} (${dono}) devia poder PEGAR`)
    ok(!st.holPodeAgora(s, eu, c.id, outro), `o parceiro (${outro}) acendeu o PEGAR na posição do outro`)
    ok(!st.holPodeAgora(s, eu, c.id, undefined), 'sem crachá o PEGAR acendeu numa dupla')
    const preco = s.hol.preco
    const naoMexeu = (x) => JSON.stringify(x.hol) === JSON.stringify(s.hol)
    ok(naoMexeu(st.reducer(s, { type: 'HOLANDES_PEGAR', mgrId: eu, cardId: c.id, preco, by: outro })), 'o motor aceitou o PEGAR do parceiro na posição do outro')
    ok(naoMexeu(st.reducer(s, { type: 'HOLANDES_PEGAR', mgrId: eu, cardId: c.id, preco })), 'o motor aceitou PEGAR sem crachá numa dupla')
    const s2 = st.reducer(s, { type: 'HOLANDES_PEGAR', mgrId: eu, cardId: c.id, preco, by: dono })
    ok(!naoMexeu(s2), 'quem manda apertou PEGAR e o motor ignorou (botão mudo)')
    // parceiro caiu → quem ficou manda em tudo
    const solo = st.reducer(s, { type: 'DUPLA_SOLO', mgrId: eu, ficouUid: outro })
    ok(st.holPodeAgora(solo, eu, c.id, outro), 'depois de assumir o time, quem ficou não conseguiu PEGAR')
    // sem dupla: o de sempre
    const semDupla = { ...s, duplas: undefined }
    ok(st.holPodeAgora(semDupla, eu, c.id, undefined), 'fora de dupla o PEGAR apagou')
  }

  // 2️⃣ 🧱 CONVOCAÇÃO DOS CLUBES: cada um convoca as posições dele
  const base = st.reducer(st.INITIAL, { type: 'START', teamName: 'Dupla FC', formation: '4-3-3', rivals: 5 })
  const me = base.managers[base.youIdx]
  const pac = (pos, ids) => ({ id: `p-${pos}`, name: pos, club: 'Clube', year: 2000, pos, fame: 3, paid: 1, pacote: { clube: 'Clube', cartas: ids.map(id => ({ id, name: id, club: 'Clube', year: 2000, pos, fame: 3 })) } })
  const outroHumano = { ...base.managers[1], isHuman: true, modoClubes: true } // segura a sala aberta (não fecha a convocação)
  const montaConv = (duplas) => ({
    ...base, duplas, screen: 'convocacao', leilaoClubes: true, convocacaoFeitos: [], convocacaoEscolhas: {}, convocacaoDuplaFeitos: [],
    managers: base.managers.map(m => m.id === me.id ? { ...m, modoClubes: true, squad: [pac('GOL', ['g1', 'g2']), pac('MEI', ['m1', 'm2'])] } : m.id === outroHumano.id ? outroHumano : m),
  })
  const duplas = comDupla(base, me.id).duplas
  let c1 = montaConv(duplas)
  c1 = st.reducer(c1, { type: 'CONVOCAR_CLUBES', mgrId: me.id, cartas: ['g1', 'm1'], by: 'B' }) // Beto manda no MEI
  ok(JSON.stringify(c1.convocacaoEscolhas[me.id]) === '["m1"]', `o Beto (MEI) mexeu fora dos setores dele: ${JSON.stringify(c1.convocacaoEscolhas[me.id])}`)
  ok(!c1.convocacaoFeitos.includes(me.id), 'o time fechou com só metade da dupla')
  c1 = st.reducer(c1, { type: 'CONVOCAR_CLUBES', mgrId: me.id, cartas: ['g2', 'm2'], by: 'A' }) // Ana manda no GOL
  ok(JSON.stringify([...c1.convocacaoEscolhas[me.id]].sort()) === '["g2","m1"]', `a junção das duas metades saiu errada: ${JSON.stringify(c1.convocacaoEscolhas[me.id])}`)
  ok(c1.convocacaoFeitos.includes(me.id), 'os dois mandaram e o time não fechou')
  const intruso = st.reducer(montaConv(duplas), { type: 'CONVOCAR_CLUBES', mgrId: me.id, cartas: ['g1'], by: 'Z' })
  ok(!(intruso.convocacaoDuplaFeitos ?? []).length && !intruso.convocacaoEscolhas[me.id], 'alguém de FORA da dupla convocou pelo time')
  const semCracha = st.reducer(montaConv(duplas), { type: 'CONVOCAR_CLUBES', mgrId: me.id, cartas: ['g1'] })
  ok(!semCracha.convocacaoEscolhas[me.id], 'convocação sem crachá passou numa dupla')
  // fora de dupla: igual a sempre
  const normal = st.reducer(montaConv(undefined), { type: 'CONVOCAR_CLUBES', mgrId: me.id, cartas: ['g1', 'm1'] })
  ok(JSON.stringify(normal.convocacaoEscolhas[me.id]) === '["g1","m1"]' && normal.convocacaoFeitos.includes(me.id), 'fora de dupla a convocação mudou')
  return { falhas }
})

await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }
console.log('\n🤝 DUPLAS NA TOCAIA E NOS CLUBES\n')
if (r.falhas.length) { for (const f of r.falhas) console.log(`   🔴 ${f}`); console.log(`\n❌ ${r.falhas.length} problema(s).\n`); process.exit(1) }
console.log('✅ Tocaia: só quem manda na posição pega (tela = motor) · parceiro e sem-crachá barrados · assumir o time funciona')
console.log('✅ Clubes: cada um convoca só os seus setores · o time fecha com os dois · fora de dupla nada mudou\n')
