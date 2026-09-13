// 🧪 TRAVA: o gás tem que olhar a divisão DE VERDADE (careerPlacements), não o
// `careerDivision`, que fica congelado em "V" em carreira nascida na Várzea.
// Medido no banco em 13/09: 155 carreiras com Agência estavam com o campo "V" e
// a divisão real em A/B/C — e por isso o gás nunca ligava (pergunta do Diego:
// "por que não foi ainda?"). Rodar da RAIZ:  node scripts/testa-gas-divisao.mjs
import { createServer } from 'vite'
const s = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { condicaoAtiva, divisaoDaCarreira } = await s.ssrLoadModule('/src/escalacao/condicao.ts')

const base = {
  careerOnline: true, onlineMode: 'cpu', agenciaOn: true,
  seasonNo: 10, youIdx: 0, managers: [{ id: 0 }],
}
const casos = [
  // o caso REAL do rzinho07oli: campo diz V, colocação diz A
  { rot: 'campo V · colocação A', careerDivision: 'V', careerPlacements: { m0: 'A' }, esperado: 'A' },
  { rot: 'campo V · colocação C', careerDivision: 'V', careerPlacements: { m0: 'C' }, esperado: 'C' },
  { rot: 'campo V · colocação V', careerDivision: 'V', careerPlacements: { m0: 'V' }, esperado: 'V' },
  { rot: 'save antigo (tudo vazio)', careerDivision: null, careerPlacements: null, esperado: 'D' },
]
let ok = true
for (const c of casos) {
  const d = divisaoDaCarreira({ ...base, ...c })
  const bom = d === c.esperado
  ok = ok && bom
  console.log(`${c.rot.padEnd(28)} → divisão lida: ${d}  ${bom ? '✅' : '❌ esperava ' + c.esperado}`)
}

// 🔓 DESBLOQUEIO: uma vez ligado, CAIR não desliga (regra do Diego 13/09)
const caiu = condicaoAtiva({ ...base, careerDivision: 'V', careerPlacements: { m0: 'V' }, condicaoDesde: 8, seasonNo: 12 })
console.log(`\ndesceu pra Várzea depois de ligar → gás ${caiu ? 'CONTINUA ✅' : 'sumiu ❌'}`)
ok = ok && caiu

// 🧹 a "cura" não pode apagar o gás de quem está DE VERDADE na Série A
const naoApaga = condicaoAtiva({ ...base, careerDivision: 'V', careerPlacements: { m0: 'A' }, condicaoDesde: 10, condicaoDesdeR: 3, seasonNo: 10 })
console.log(`cura NÃO apaga quem está na Série A de verdade → ${naoApaga ? 'preservado ✅' : 'APAGOU ❌'}`)
ok = ok && naoApaga

// e continua apagando quem ligou por engano estando mesmo na Várzea
const apaga = condicaoAtiva({ ...base, careerDivision: 'V', careerPlacements: { m0: 'V' }, condicaoDesde: 10, condicaoDesdeR: 3, seasonNo: 10 })
console.log(`cura ainda apaga quem ligou por engano na Várzea    → ${!apaga ? 'apagou ✅' : 'ficou ❌'}`)
ok = ok && !apaga

console.log(ok ? '\n✅ PASSOU' : '\n❌ FALHOU')
await s.close(); process.exit(ok ? 0 : 1)
