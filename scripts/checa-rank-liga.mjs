// ⚖️ CONFERE A PONTUAÇÃO DO RANK — `npm run rank`
//
// As regras que o Diego fechou em 29/08: **liga 30 · copa 20 · rebaixamento −10 ·
// nunca negativo · artilheiro não pontua**. Antes disso o padrão se contradizia
// (por títulos a liga valia mais; por pontos a copa valia mais), então este script
// existe pra a conta não voltar a divergir do combinado sem ninguém ver.
import { createServer } from 'vite'
const srv = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { rankingDaLiga, LIGA_REGRAS_PADRAO, resumoRegra } = await srv.ssrLoadModule('/src/escalacao/ligahub.tsx')

const L = (s, camp, copa, art, mico) => ({ season_no: s, champion_name: camp, copa_champion_name: copa, top_scorer_team: art, top_scorer_name: art, top_scorer_goals: 9, mico_name: mico })
const gente = new Set(['Zé', 'Bia', 'Léo'])
const rows = [
  L(1, 'Zé', 'Bia', 'Léo', 'Léo'),   // Zé: liga | Bia: copa | Léo: artilharia + mico
  L(2, 'Zé', 'Zé', 'Bia', 'Léo'),    // Zé: liga+copa | Léo: mico de novo
  L(3, 'Bia', 'Léo', 'Zé', 'Léo'),   // Bia: liga | Léo: copa + mico (3º)
]
const rank = rankingDaLiga(rows, LIGA_REGRAS_PADRAO, gente)

const esperado = {
  Zé: 2 * 30 + 1 * 20,          // 2 ligas + 1 copa = 80
  Bia: 1 * 30 + 1 * 20,         // 1 liga + 1 copa = 50
  Léo: Math.max(0, 1 * 20 - 3 * 10), // 1 copa − 3 rebaixamentos = −10 → PARA NO ZERO
}
console.log(`⚖️ ${resumoRegra(LIGA_REGRAS_PADRAO)}\n`)
let erros = 0
for (const r of rank) {
  const ok = r.pts === esperado[r.time]
  if (!ok) erros++
  console.log(`   ${ok ? '✅' : '❌'} ${r.time.padEnd(4)} ${String(r.pts).padStart(3)} pts  (esperado ${esperado[r.time]})  🏆${r.v.liga} 🏆🇧🇷${r.v.copa} ⚽${r.v.artilheiro} 🔻${r.v.rebaixamento}`)
}
const ordem = rank.map(r => r.time).join(' > ')
const ordemOk = ordem === 'Zé > Bia > Léo'
console.log(`\n   ${ordemOk ? '✅' : '❌'} ordem: ${ordem}`)
if (LIGA_REGRAS_PADRAO.ativos.includes('artilheiro')) { console.log('   ❌ artilheiro voltou a pontuar — o Diego tirou em 29/08'); erros++ }
else console.log('   ✅ artilheiro não pontua (segue como troféu na Estante)')
await srv.close()
console.log(erros || !ordemOk ? '\n❌ a conta do rank saiu do combinado' : '\n✅ pontuação bate com o que foi fechado com o Diego')
process.exit(erros || !ordemOk ? 1 : 0)
