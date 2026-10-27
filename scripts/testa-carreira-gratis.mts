// 🔒 trava da CARREIRA GRÁTIS ATÉ A TEMPORADA 50 (27/10). Confere a régua pura e que a tela e o motor leem a MESMA função
// (regra de ouro contra botão mudo). Uso: npm run carreira-gratis
import { readFileSync } from 'node:fs'
import { travaCarreiraGratis, CARREIRA_GRATIS_ATE } from '../src/escalacao/carreira-gratis.ts'
let falhas = 0
const ok = (c: boolean, m: string) => { if (!c) { falhas++; console.log('❌', m) } else console.log('✅', m) }
ok(CARREIRA_GRATIS_ATE === 50, 'o limite é a temporada 50')
ok(travaCarreiraGratis(50, false), 'sem plano na temporada 50: trava')
ok(!travaCarreiraGratis(50, true), 'com plano na temporada 50: segue')
ok(!travaCarreiraGratis(49, false), 'sem plano antes da 50: segue')
ok(!travaCarreiraGratis(1, false), 'sem plano no começo: segue')
ok(!travaCarreiraGratis(51, false), 'quem já passou da 50 segue livre (sem plano)')
ok(!travaCarreiraGratis(120, false), 'carreira antiga bem acima da 50 segue livre')
const store = readFileSync('src/escalacao/store.tsx', 'utf8'), telas = readFileSync('src/escalacao/screens.tsx', 'utf8')
const adv = store.slice(store.indexOf("case 'CAREER_ADVANCE': {"), store.indexOf("case 'CAREER_ADVANCE': {") + 1500)
ok(/travaCarreiraGratis\(s\.seasonNo, !!action\.pago\)\) return s/.test(adv), 'o motor (CAREER_ADVANCE) recusa a virada com a mesma régua')
const despachos = [...telas.matchAll(/type: 'CAREER_ADVANCE'[^}]*\}/g)].map(m => m[0])
ok(despachos.length > 0 && despachos.every(d => /pago: pagante/.test(d)), 'todo botão que vira a temporada manda se a conta tem plano')
ok(/travaCarreiraGratis\(state\.seasonNo, pagante\)/.test(telas), 'a tela da decisão lê a mesma régua')
if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1) }
console.log('\nCarreira grátis até a 50: tudo certo.')
