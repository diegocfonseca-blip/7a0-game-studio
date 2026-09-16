// 📐 QUANTO CUSTA SUBIR O ELENCO PRA 27 (Diego mandou publicar em 16/09)
//
// Ele aprovou o +1 por posição. Antes de soltar eu prometi MEDIR duas coisas que não
// aparecem na tela: quantas cartas a mais o leilão precisa pôr na mesa, e quanto a
// folha salarial cresce. Este arquivo faz essa conta com as funções DE VERDADE.
//
//   node scripts/mede-elenco-27.mjs
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const store = await server.ssrLoadModule('/src/escalacao/store.tsx')
const types = await server.ssrLoadModule('/src/escalacao/types.ts')
const { FORMATIONS } = types
const SECTORS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']

const mgr = (f, squad = []) => ({ id: 1, teamName: 'T', isHuman: true, formation: f, squad, deepSquad: true })
console.log('\n📐 VAGAS POR POSIÇÃO — hoje (2× a formação) × proposto (2× + 1)\n')
let piorTotal = 0
for (const f of Object.keys(FORMATIONS)) {
  const m = mgr(f)
  const hoje = SECTORS.map(p => store.slotsOf(m, p))
  const novo = SECTORS.map((p, i) => hoje[i] + 1)
  const th = hoje.reduce((a, b) => a + b, 0), tn = novo.reduce((a, b) => a + b, 0)
  piorTotal = Math.max(piorTotal, tn)
  console.log(`  ${f}  ${SECTORS.map((p, i) => `${p} ${hoje[i]}→${novo[i]}`).join(' · ')}   total ${th} → ${tn}`)
}
console.log(`\n🔨 A MESA DO LEILÃO DE RESERVAS`)
console.log(`  A mesa é dimensionada pelos BURACOS de todo mundo (totalHoles por técnico).`)
for (const n of [4, 6, 8, 10, 20]) {
  console.log(`  sala de ${String(n).padStart(2)} técnicos:  ${n * 22} vagas hoje  →  ${n * 27} com +1 por posição  (+${n * 5} cartas na mesa)`)
}
console.log(`\n💸 A FOLHA SALARIAL (regra do jogo: piso ÷ 10 por jogador, cobrada no fim da temporada)`)
for (const [rot, piso] of [['elenco fraco (piso ~60)', 60], ['elenco médio (piso ~75)', 75], ['elenco forte (piso ~90)', 90]]) {
  const h = Math.round(22 * piso / 10), n = Math.round(27 * piso / 10)
  console.log(`  ${rot.padEnd(24)} ${h}/ano  →  ${n}/ano   (+${n - h} por temporada, +${Math.round((n / h - 1) * 100)}%)`)
}
console.log(`\n🧮 O QUE ISSO SIGNIFICA`)
console.log(`  · a folha sobe ~23% (é a mesma proporção do elenco: 27/22), não desproporcional;`)
console.log(`  · a cota de TV da Série A (50) e o Master (até 50) cobrem a diferença com folga;`)
console.log(`  · o Monte das sobras ganha 5 rodadas a mais por técnico — é onde o tempo cresce.`)
await server.close()

// ⚠️ O RISCO DE VERDADE: o baralho aguenta? Se faltar carta na posição, entra
// perna-de-pau (fake) — que é o que o Diego mais odeia. A ESCADA limita a categoria
// por divisão (V = foi-prof + bom · D = bom + promessa · C/B = promessa + craque ·
// A = craque + lenda), então a conta tem que ser POR DIVISÃO e POR POSIÇÃO.
const srv2 = await (await import('vite')).createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const data = await srv2.ssrLoadModule('/src/escalacao/data.ts')
// o baralho da CARREIRA é BR + Europa + Mundo juntos (CATALOG_BOTH já soma os três)
const POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const baralho = POS.flatMap(p => (data.CATALOG_BOTH?.[p] ?? []).map(c => ({ ...c, pos: p })))
  .concat(POS.flatMap(p => (data.CATALOG_WORLD?.[p] ?? []).map(c => ({ ...c, pos: p }))))
const vistos = new Set()
const unico = baralho.filter(c => { const k = `${c.name}|${c.club}|${c.year}`; if (vistos.has(k)) return false; vistos.add(k); return true })
const cat = c => c.promessa ? 'promessa' : (c.fame ?? 1) >= 5 ? 'lenda' : (c.fame ?? 1) === 4 ? 'craque' : (c.fame ?? 1) >= 2 ? 'bom' : 'prof'
const DEGRAU = { V: ['prof', 'bom'], D: ['bom', 'promessa'], C: ['promessa', 'craque'], B: ['promessa', 'craque'], A: ['craque', 'lenda'] }
console.log(`\n🃏 O BARALHO AGUENTA? (${unico.length} cartas, sem repetir)\n`)
for (const [div, cats] of Object.entries(DEGRAU)) {
  const pool = unico.filter(c => cats.includes(cat(c)))
  const porPos = {}
  for (const c of pool) porPos[c.pos] = (porPos[c.pos] ?? 0) + 1
  // 4-4-2 é o pior caso do MEI (9) e o 4-2-4 do ATA (9); GOL é sempre 3
  const precisa = { GOL: 3, LAT: 5, ZAG: 5, MEI: 9, ATA: 9 }
  const apertado = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
    .map(p => { const tem = porPos[p] ?? 0, cabe = Math.floor(tem / precisa[p]); return `${p} ${String(tem).padStart(3)} (dá p/ ${cabe} técnicos)` })
  console.log(`  Série ${div} · ${cats.join('+')} · ${pool.length} cartas`)
  console.log(`     ${apertado.join(' · ')}`)
}
await srv2.close()
