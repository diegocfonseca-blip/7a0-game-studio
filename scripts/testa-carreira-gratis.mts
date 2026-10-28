// 🔒 trava da CARREIRA GRÁTIS ATÉ A TEMPORADA 50 (27/10). Confere a régua pura e que a tela e o motor leem a MESMA função
// (regra de ouro contra botão mudo). Uso: npm run carreira-gratis
import { readFileSync } from 'node:fs'
import { travaCarreiraGratis, CARREIRA_GRATIS_ATE, marcaGratis, limiteGratis } from '../src/escalacao/carreira-gratis.ts'
let falhas = 0
const ok = (c: boolean, m: string) => { if (!c) { falhas++; console.log('❌', m) } else console.log('✅', m) }
ok(CARREIRA_GRATIS_ATE === 50, 'o limite é a temporada 50')
ok(travaCarreiraGratis(50, false), 'sem plano na temporada 50: trava')
ok(!travaCarreiraGratis(50, true), 'com plano na temporada 50: segue')
ok(!travaCarreiraGratis(49, false), 'sem plano antes da 50: segue')
ok(!travaCarreiraGratis(1, false), 'sem plano no começo: segue')
ok(!travaCarreiraGratis(51, false), 'quem já passou da 50, sem marca ainda, segue (a 1ª virada grava a marca)')
ok(marcaGratis(120, false, undefined) === 130, 'T120 sem plano: a 1ª virada grava "grátis até a 130" (+10)')
ok(marcaGratis(120, true, undefined) === undefined, 'com plano não grava marca nenhuma')
ok(marcaGratis(30, false, undefined) === undefined, 'abaixo da 50 não precisa de marca (o limite é a 50)')
ok(marcaGratis(125, false, 130) === 130, 'a marca não anda: grava uma vez só')
ok(!travaCarreiraGratis(129, false, 130) && travaCarreiraGratis(130, false, 130), 'com a marca 130: joga até o fim da 130 e trava ali')
ok(!travaCarreiraGratis(130, true, 130), 'assinou: destrava mesmo com a marca')
ok(limiteGratis(40) === 50 && limiteGratis(130, 130) === 130, 'o banner diz até qual temporada vai')
const store = readFileSync('src/escalacao/store.tsx', 'utf8'), telas = readFileSync('src/escalacao/screens.tsx', 'utf8')
const adv = store.slice(store.indexOf("case 'CAREER_ADVANCE': {"), store.indexOf("case 'CAREER_ADVANCE': {") + 1500)
ok(/travaCarreiraGratis\(s\.seasonNo, !!action\.pago, s\.careerGratisAte\)\) return s/.test(adv), 'o motor (CAREER_ADVANCE) recusa a virada com a mesma régua')
ok(/s\.careerGratisAte = marcaGratis\(/.test(adv), 'o motor grava a marca dos +10 na virada')
ok(/'careerGratisAte'\] as const/.test(store), 'carreira nova nasce sem a marca de outra (MARCAS_DE_MODO)')
const despachos = [...telas.matchAll(/type: 'CAREER_ADVANCE'[^}]*\}/g)].map(m => m[0])
ok(despachos.length > 0 && despachos.every(d => /pago: pagante/.test(d)), 'todo botão que vira a temporada manda se a conta tem plano')
ok(/travaCarreiraGratis\(state\.seasonNo, pagante, state\.careerGratisAte\)/.test(telas), 'a tela da decisão lê a mesma régua')
if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1) }
console.log('\nCarreira grátis até a 50: tudo certo.')
