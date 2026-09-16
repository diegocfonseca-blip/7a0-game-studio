// ─── 🌱 A VÁRZEA GANHOU ALGUMA COISA HOJE? — a conta, moeda por moeda ───────────
//
// Pergunta do Diego (16/09): *"pra quem tá na várzea, em tudo que fizemos hoje,
// não ganhou benefício nenhum?"*.
//
// A pergunta é justa porque no mockup das 6 trocas eu escrevi "a Várzea não muda
// em nada" — e aquilo valia SÓ pras 6 daquela lista (camarote, cobertura,
// refletores, bilheteria, torcida, gramado). As outras mudanças do dia (preços do
// começo mais baratos + lotação de quem está lá embaixo) foram feitas JUSTAMENTE
// pra Várzea. Este script mede tudo junto, sem chute.
//
// Rodar: node scripts/varzea-ganhou.mjs
const ANTES = {
  setores: { grama: { c: 60, inc: 4, s: 0 }, geral: { c: 60, inc: 4, s: 21500 }, cadeiras: { c: 90, inc: 6, s: 18500 } },
  extras: { refl: { c: 50, inc: 2 }, loja: { c: 80, inc: 6, req: 2 } },
  lugaresContam: false,
  occ: { 10: 0.55, 16: 0.35, 18: 0.18 },
}
const DEPOIS = {
  setores: { grama: { c: 30, inc: 4, s: 0 }, geral: { c: 40, inc: 4, s: 21500 }, cadeiras: { c: 90, inc: 6, s: 18500 } },
  extras: { refl: { c: 30, inc: 2 }, loja: { c: 60, inc: 6, req: 1 } },
  lugaresContam: true,
  occ: { 10: 0.55, 16: 0.40, 18: 0.27 },
}
const BASE = 20, POR_LUGARES = 3000

// a ordem que qualquer jogador segue: arquibancada primeiro (é o que tem lugar),
// gramado (é barato e destrava categoria), depois loja e refletor.
const ORDEM = ['geral', 'grama', 'loja', 'refl', 'cadeiras']

function constroi(R, moedas) {
  const inv = {}; let sobra = moedas, setoresProntos = 0
  for (const k of ORDEM) {
    const s = R.setores[k], e = R.extras[k]
    if (s) { const p = Math.min(sobra, s.c); inv[k] = p; sobra -= p; if (p >= s.c) setoresProntos++ }
    else if (e) { if (setoresProntos >= (e.req ?? 0) && sobra >= e.c) { inv[k] = e.c; sobra -= e.c } }
  }
  return inv
}
function renda(R, inv, pos) {
  let built = 0, lugares = 0
  for (const [k, s] of Object.entries(R.setores)) {
    const pct = Math.min(100, (inv[k] ?? 0) / s.c * 100)
    built += Math.floor(s.inc * pct / 100); lugares += Math.round(s.s * pct / 100)
  }
  for (const [k, e] of Object.entries(R.extras)) if (inv[k]) built += e.inc
  if (R.lugaresContam) built += Math.floor(lugares / POR_LUGARES)
  return { lugares, total: BASE + Math.floor(built * R.occ[pos]) }
}
// 👕 camisa: a torcida da Várzea NÃO mudou (piso 12.000 nas duas contas), mas os
// lugares construídos entram nela — e hoje a loja destrava muito mais cedo.
const torcida = lugares => 12_000 + lugares

const POSICOES = [10, 16, 18]
console.log('🌱 VÁRZEA — o que o mesmo dinheiro compra ANTES e DEPOIS de hoje\n')
for (const moedas of [40, 60, 80, 100, 140]) {
  const ia = constroi(ANTES, moedas), id = constroi(DEPOIS, moedas)
  console.log(`💰 investiu ${moedas} moedas no estádio`)
  console.log(`   antes  → ${Object.entries(ia).map(([k, v]) => `${k} ${v}`).join(' · ') || 'nada'}`)
  console.log(`   depois → ${Object.entries(id).map(([k, v]) => `${k} ${v}`).join(' · ') || 'nada'}`)
  for (const pos of POSICOES) {
    const a = renda(ANTES, ia, pos), d = renda(DEPOIS, id, pos)
    console.log(`   🎟️ ${pos}º lugar: bilheteria ${a.total} → ${d.total}  (${d.total - a.total >= 0 ? '+' : ''}${d.total - a.total})`)
  }
  const la = renda(ANTES, ia, 10).lugares, ld = renda(DEPOIS, id, 10).lugares
  console.log(`   🧍 torcida: ${torcida(la).toLocaleString('pt-BR')} → ${torcida(ld).toLocaleString('pt-BR')}`)
  console.log(`   🛍️ loja do clube: ${ia.loja ? 'aberta' : 'TRANCADA'} → ${id.loja ? 'aberta' : 'TRANCADA'}\n`)
}
