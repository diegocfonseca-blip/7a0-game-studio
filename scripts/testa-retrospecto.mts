// 🆚⭐ trava do retrospecto + craque do jogo (13/10): `npm run retrospecto`
import { craqueDoJogo, fraseRetro, fraseCraque } from '../src/escalacao/retrospecto.ts'
import { readFileSync } from 'node:fs'
let f = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) f++ }
const c1 = craqueDoJogo([{ name: 'Romário', min: 23, home: true }, { name: 'Cristiano Ronaldo', min: 44, home: false, assist: 'Kaká' }, { name: 'Romário', min: 78, home: true, assist: 'Edmundo' }])
ok(c1?.name === 'Romário' && c1.gols === 2, 'quem fez 2 gols é o craque')
const c2 = craqueDoJogo([{ name: 'Zico', min: 10, home: true, assist: 'Sócrates' }, { name: 'Careca', min: 30, home: true, assist: 'Sócrates' }])
ok(c2?.name === 'Sócrates' && c2.assist === 2, 'assistência conta (2 assistências = 4 > 1 gol = 3) — o que vale pro gol vale pra assistência')
ok(craqueDoJogo([]) === null, '0 × 0 não inventa craque')
ok(craqueDoJogo([{ name: '', min: 5, home: true }]) === null, 'gol sem autor (time de mentira) não vira craque')
const c3 = craqueDoJogo([{ name: 'Zico', min: 50, home: true }, { name: 'Bebeto', min: 10, home: false }])
ok(c3?.name === 'Bebeto', 'empate total: quem marcou primeiro')
ok(/1V · 0E · 4D em 5 jogos/.test(fraseRetro({ v: 1, e: 0, d: 4 }, false, 3)), 'retrospecto mostra V · E · D e o total')
ok(/Primeiro|Nunca|Estreia/.test(fraseRetro(undefined, false, 1)), 'sem jogo ainda = primeiro duelo')
ok(/2W · 1D · 0L in 3 games/.test(fraseRetro({ v: 2, e: 1, d: 0 }, true, 0)), 'EN também')
ok(fraseCraque({ name: 'Romário', gols: 2, assist: 0 }, 'K9 FC', false) === 'Romário · K9 FC · ⚽ 2 gols', 'frase do craque')
const scr = readFileSync('src/escalacao/screens.tsx', 'utf8')
ok(/retroOn = state\.onlineMode === 'online' && !state\.careerOnline/.test(scr) && /Object\.keys\(state\.duplas\)/.test(scr), 'só sala online, nunca carreira, nunca dupla')
ok(/!state\.isHost \|\| !resultRevealed/.test(scr), 'o host só grava a rodada depois que o resultado revelou (anti-spoiler)')
console.log(f ? `\n❌ ${f} falha(s)` : '\n✅ retrospecto e craque ok')
process.exit(f ? 1 : 0)
