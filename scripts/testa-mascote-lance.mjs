#!/usr/bin/env node
// 🐊🔇 TRAVA: A MASCOTE NÃO ATRAVESSA A TELA DE QUEM AINDA VAI DAR LANCE.
//
// Diego (18/09), com o print do envelope na mão: *"o soltar o mascote, deixe que
// apareça aqui nessa tela… não deixe que vaze pra tela de quem tá dando lances, ok?
// Apenas os emojis que já tem"*.
//
// É a regra de ouro dele de sempre — nada pode atrapalhar quem está DECIDINDO. Quem
// já lacrou está no tempo morto, esperando os outros: ali o teatro é bem-vindo. Quem
// ainda escolhe o valor não pode ter um bicho de 2 segundos por cima do que ele lê.
//
// ⚠️ Esta trava é de FONTE, e ela sabe disso: o que importa aqui não é pixel, é a
// CONDIÇÃO — se alguém um dia mexer na camada e tirar o corte sem perceber, é ela
// que avisa. O que ela garante:
//   • a trava existe e olha os DOIS momentos de decisão (envelope e desempate);
//   • ela é LOCAL (olha o MEU assento), nunca some o emote pros outros;
//   • ela não encostou nos emojis/cantadas/chuva que já existiam.
//
// uso: node scripts/testa-mascote-lance.mjs
import { readFileSync } from 'node:fs'
const src = readFileSync('src/escalacao/screens.tsx', 'utf8')
let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

const i = src.indexOf('function MascoteAtravessa()')
const corpo = i > 0 ? src.slice(i, i + 1800) : ''

console.log('\n1) 🚫 a mascote para nos dois momentos de DECISÃO')
{
  ok(corpo.length > 0, 'achei a camada da mascote que atravessa a tela')
  ok(/phase === 'envelope'/.test(corpo) && /state\.submitted\.includes/.test(corpo),
    'no ENVELOPE: só passa depois que EU lacrei')
  ok(/resq_envelope/.test(corpo), 'o envelope do repescagem (resq) conta igual')
  ok(/phase === 'tiebreak'/.test(corpo) && /tb\.submitted\.includes/.test(corpo),
    'no DESEMPATE: só passa depois que EU mandei o lance')
  ok(/return null/.test(corpo.slice(corpo.indexOf('noEnvelope'))), 'quando é hora de decidir, a camada não desenha nada')
}

console.log('\n2) 🙋 a trava é LOCAL — ninguém perde o emote')
{
  ok(/state\.managers\[state\.youIdx\]/.test(corpo), 'ela olha o MEU assento (youIdx), não o dos outros')
  ok(/tb\.managers\.includes/.test(corpo), 'no desempate, só trava quem ESTÁ no desempate (quem assiste, vê)')
  ok(!/dispatch|emote\(/.test(corpo), 'ela não mexe no estado nem cancela emote de ninguém — é só tela')
}

console.log('\n3) 😏 o que já existia não foi tocado')
{
  ok(src.includes('<FloatingEmotes />'), 'os emojis/cantadas continuam montados')
  ok(src.includes('<MoneyRain />'), 'a chuva de dinheiro continua montada')
  ok(src.includes('<MascoteAtravessa />'), 'a mascote continua montada (o corte é por dentro, não arrancando a camada)')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
