#!/usr/bin/env node
// 🎁 TRAVAS DOS MIMOS DE BATISMO (escudo · mascote de gol · manto seguem o E-MAIL).
//
// Regra do Diego (04/09, reafirmada 08/09): *"ele tem mesmo e-mail, então deveria ter
// escudo e mascote e manto em QUALQUER time que ele fizer novo, se tiver mesmo e-mail
// do batismo"*.
//
// Por que esta trava nasceu (18/09): *"o usuário do time Leite de Verdade, que tem
// batismo, disse que quando ele joga online o gol do mascote dele não tá aparecendo"*.
// No online o nome do clube é o que a pessoa DIGITA — e o jogo gruda o selo do
// apoiador nele ("Loopesmiranda FC 👑🖋️" é o que estava gravado no banco). A TELA
// limpava o selo antes de procurar, mas o REGISTRO de "qual é o meu clube" guardava o
// nome COM o selo. As duas chaves nunca batiam, então o dono perdia mascote E escudo
// em qualquer clube que não fosse o nome exato do batismo.
//
// O que esta trava protege, em ordem de perigo:
//  1. a chave é a MESMA dos dois lados (registro e busca) — selo, acento e FC/EC/SC
//  2. o clube de OUTRA pessoa nunca herda mimo meu (isso seria roubo de identidade)
//  3. sem batismo / deslogado, nada aparece — o clube volta ao automático
//
// uso: node scripts/testa-mimos.mjs     (sai com código 1 se reprovar)
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const M = await vite.ssrLoadModule('/src/escalacao/mimos.ts')
const E = await vite.ssrLoadModule('/src/escalacao/escudos.tsx')
const { chaveEscudo, registraMeusNomes, registraMeuBatismo, ehMeuClube, meuMascoteBatismo, meuEscudoBatismo, registraMimosDaSala, limpaMimosDaSala, mascoteDaSala, escudoDaSala } = M
const MA = await vite.ssrLoadModule('/src/escalacao/mascotes.tsx')
const { carimboDoTime, CARIMBO_GOL } = MA
const { nomeLimpo } = E

let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

console.log('\n1) 🏅 O SELO DO APOIADOR NÃO PODE SEPARAR O DONO DO CLUBE DELE')
{
  // o caso real: Leite de Verdade FC (brunolopesmiranda15) jogando online
  const comoEleJoga = 'Loopesmiranda FC 👑🖋️'
  registraMeusNomes([comoEleJoga])
  registraMeuBatismo('Leite de Verdade FC', 'leiteverdade_vaca')
  ok(chaveEscudo(comoEleJoga) === chaveEscudo(nomeLimpo(comoEleJoga)),
    `registro e busca dão a MESMA chave ("${chaveEscudo(comoEleJoga)}")`)
  ok(ehMeuClube(nomeLimpo(comoEleJoga)), 'a tela reconhece o clube como sendo dele')
  ok(meuMascoteBatismo() === 'leiteverdade_vaca', 'a mascote do gol é a do batismo dele (a Mimosa)')
  ok(meuEscudoBatismo() === 'Leite de Verdade FC', 'o escudo também — o mesmo conserto vale pros dois')
}

console.log('\n2) 🧹 a chave ignora o que é ENFEITE, e só isso')
{
  const casos = [
    ['Bigão FC', 'Bigao', 'acento não muda o dono'],
    ['Meia na Canela EC', 'Meia na Canela', 'EC no fim não muda o dono'],
    ['Stocco FC 👑', 'stocco', 'selo de ouro colado no nome'],
    ['Xurupitas 🔥', 'XURUPITAS', 'selo de amigo + caixa alta'],
    ['Time do Zé (você)', 'time do zé', 'o "(você)" que algumas telas grudam'],
    ['Nightfull FC 💎🖋️', 'Nightfull', 'dois selos seguidos'],
  ]
  for (const [a, b, porque] of casos) ok(chaveEscudo(a) === chaveEscudo(b), `${porque}: "${a}" = "${b}"`)
}

console.log('\n3) 🛡️ MIMO MEU NUNCA VAI PRO CLUBE DE OUTRO')
{
  registraMeusNomes(['Loopesmiranda FC 👑🖋️'])
  ok(!ehMeuClube('Neymarzetti'), 'o clube de outro humano não é "meu"')
  ok(!ehMeuClube('Bagres 1993'), 'o clube de um bot não é "meu"')
  ok(!ehMeuClube('Loopesmiranda Junior'), 'nome PARECIDO não conta — a chave é igualdade, não pedaço')
  ok(!ehMeuClube(''), 'nome vazio nunca casa')
}

console.log('\n4) 🚪 deslogado / sem batismo: nada aparece, e nada quebra')
{
  registraMeusNomes([])
  ok(!ehMeuClube('Loopesmiranda FC'), 'sem clube registrado, ninguém é "meu"')
  registraMeusNomes(['Loopesmiranda FC 👑'])
  registraMeuBatismo(null, null)
  ok(meuMascoteBatismo() === null && meuEscudoBatismo() === null, 'sem batismo ativo, o clube volta ao automático')
  registraMeuBatismo('   ', '   ')
  ok(meuMascoteBatismo() === null, 'campo do banco em branco conta como SEM batismo (não vira chave vazia)')
}

console.log('\n5) 🏟️ O BATISMO APARECE PRA TODO MUNDO NA SALA (18/09)')
{
  // Diego: *"o mascote, seja no modo carreira ou online, ele deve aparecer nos times
  // de batismo pra todo mundo"*. Quem diz de quem e cada assento e o SERVIDOR
  // (RPC esc_mimos_sala); aqui so testamos o que o aparelho faz com a resposta.
  limpaMimosDaSala()
  registraMeusNomes(['Meu Clube'])   // eu sou OUTRA pessoa nesta sala
  registraMeuBatismo(null, null)     // e eu NAO tenho batismo nenhum
  registraMimosDaSala([{ clube: 'Loopesmiranda FC 👑🖋️', mascote: 'leiteverdade_vaca', escudo: 'Leite de Verdade FC' }])
  ok(mascoteDaSala('Loopesmiranda FC') === 'leiteverdade_vaca', 'eu vejo a mascote do batismo DELE, mesmo ele jogando com outro nome')
  ok(escudoDaSala('loopesmiranda') === 'Leite de Verdade FC', 'o escudo dele tambem — e a chave ignora caixa e selo')
  ok(carimboDoTime('Loopesmiranda FC 👑🖋️') !== null, 'o carimbo de gol dele desenha na MINHA tela')
  ok(mascoteDaSala('Meu Clube') === null, 'o meu clube, que nao tem batismo, continua sem mascote')
  ok(mascoteDaSala('Bagres 1993') === null, 'um bot da sala nao ganha mascote de ninguem')
}

console.log('\n6) 🛡️ NINGUEM ROUBA A ARTE DE UM CLUBE BATIZADO DIGITANDO O NOME DELE')
{
  // o perigo real de abrir isto: alguem digita "Neymarzetti" como nome do proprio
  // clube. A lista FIXA tem que ganhar do que vem da sala, sempre.
  const batizado = Object.keys(CARIMBO_GOL)[0]
  limpaMimosDaSala()
  registraMimosDaSala([{ clube: batizado, mascote: 'leiteverdade_vaca', escudo: 'Leite de Verdade FC' }])
  ok(carimboDoTime(batizado) !== null, `"${batizado}" continua desenhando`)
  // e desenha a arte DELE, nao a que veio da sala
  ok(mascoteDaSala(batizado) === 'leiteverdade_vaca' && CARIMBO_GOL[batizado] !== 'leiteverdade_vaca',
    'a lista fixa e consultada ANTES da sala — a arte do clube batizado e a dele')
}

console.log('\n7) 🧹 MIMO DE SALA NAO SOBRA PRO JOGO SEGUINTE')
{
  registraMimosDaSala([{ clube: 'Loopesmiranda FC', mascote: 'leiteverdade_vaca' }])
  ok(mascoteDaSala('Loopesmiranda FC') === 'leiteverdade_vaca', 'dentro da sala, aparece')
  limpaMimosDaSala()
  ok(mascoteDaSala('Loopesmiranda FC') === null, 'saiu da sala, some — senao seria arte de outra pessoa num bot do solo')
}

console.log('\n8) 🚪 linha torta do servidor nao quebra nada')
{
  limpaMimosDaSala()
  registraMimosDaSala([
    { clube: '', mascote: 'x' },                    // sem clube
    { clube: '  ', mascote: 'x' },                  // clube em branco
    { clube: 'Time A', mascote: null, escudo: null }, // socio sem mimo nenhum
    { clube: 'Time B', mascote: '   ' },            // campo em branco no banco
  ])
  ok(mascoteDaSala('Time A') === null && mascoteDaSala('Time B') === null, 'socio sem mimo nao vira chave vazia')
  ok(mascoteDaSala('') === null, 'nome vazio nunca casa')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
await vite.close()
process.exit(falhas === 0 ? 0 : 1)
