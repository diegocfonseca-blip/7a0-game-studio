// ─── ⚔️ TRAVA: A LINHA DO PRÓXIMO JOGO (Diego 19/09) ────────────────────────
//
// Palavras dele, olhando a tela da sala em live: *"tá mt exagerado esse negócio de
// próximo jogo e equilíbrio retranca e ataque. Não precisa escrever o que é
// retranca, equilíbrio e ataque, só bote. E de forma mais sutil também o próximo
// jogo. Além disso, no próximo jogo, se tiver alguma rivalidade mostre se já teve
// jogo entre usuários APENAS. Se for usuário e bot não mostre nada. Mas se for
// entre dois usuários que já jogaram entre si, mostra quantidade de vitórias tipo
// Rivalidade V=2 D=1. Mas só vale entre usuários"*.
//
// Três coisas que esta trava segura, porque as três já foram e voltaram antes:
//  1. 🧹 A EXPLICAÇÃO DAS TÁTICAS NÃO VOLTA. "Retranca segura ataque · ataque
//     atropela equilíbrio…" aparecia toda rodada, nos dois blocos (liga e Copa).
//  2. 👥 A RIVALIDADE É SÓ ENTRE GENTE. O corte é `isHuman` — rival-bot da carreira
//     é "clássico" pro resto da tela, mas NÃO mostra retrospecto.
//  3. 🆕 E SÓ DEPOIS DO PRIMEIRO DUELO. Sem jogo entre os dois, não há retrospecto
//     pra mostrar; "0 × 0" seria ruído.
//
// uso: node scripts/testa-proximo-jogo.mjs
import { readFileSync } from 'node:fs'
const tela = readFileSync('src/escalacao/screens.tsx', 'utf8')
let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

console.log('\n1) 🧹 a explicação das táticas não voltou')
{
  // ⚠️ olha o CÓDIGO, não o comentário: a explicação virou comentário explicando
  // por que ela saiu, e a 1ª versão desta trava reprovou por causa do próprio texto.
  const marcas = [/LS\('Retranca segura ataque/, /LS\('Defesa segura o run-and-gun/, /'Park the bus holds attack/]
  for (const re of marcas) ok(!re.test(tela), `nenhuma chamada de tela com "${re.source.slice(4, 34)}…"`)
  ok(!/className="text-\[11px\] font-semibold text-black\/70">\{state\.sport === 'basquete'/.test(tela), 'o parágrafo da explicação não existe mais em nenhum dos dois blocos')
}

console.log('\n2) 👥 a rivalidade do próximo jogo é SÓ entre usuários')
{
  const m = tela.match(/const oppEhGente = ([^\n]+)/)
  ok(!!m, 'existe o corte `oppEhGente`')
  ok(!!m && /isHuman/.test(m[1]), `o corte usa isHuman — hoje: ${m ? m[1].trim() : '(sumiu)'}`)
  const chip = tela.match(/const rivChip = ([^\n]+)/)
  ok(!!chip, 'existe o `rivChip` (a pílula)')
  ok(!!chip && /oppEhGente|rivUser/.test(chip[1]), 'a pílula sai do corte de usuário, não do `isClassico`')
  ok(!!chip && /> 0/.test(chip[1]), 'e exige pelo menos um jogo entre os dois')
  // o `rivalry` velho (que misturava usuário e rival-bot) não pode voltar pra cá
  ok(!/\{rivalry && \(/.test(tela), 'o retrospecto velho, que valia pra rival-bot, não voltou')
}

console.log('\n3) 🔇 o título do próximo jogo ficou miúdo')
{
  ok(!/PRÓXIMO', 'NEXT'\)\}: /.test(tela), 'o "PRÓXIMO:" grudado no nome do jogo saiu')
  ok(/Próximo jogo', 'Next match'\)/.test(tela), 'virou etiqueta ("Próximo jogo"), em PT e EN')
  ok(/text-\[15px\] leading-tight/.test(tela), 'o nome do jogo está em 15px (era 18px)')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
