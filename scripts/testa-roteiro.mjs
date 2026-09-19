// ─── 🎬 TRAVA DO ROTEIRO DO FIM DE TEMPORADA (19/09) ────────────────────────
//
// Ideia do Diego: *"e se fizéssemos de uma forma q tivesse q ter o passo a passo
// obrigado e c isso teria q ler.. pq hj aparece essas coisas aqui misturadas
// embaixo tb q n estão legais"*.
//
// ⚠️ O PERIGO DESTA MUDANÇA, e é por isso que esta trava existe: passo a passo é
//    um lugar ONDE DÁ PRA PRENDER O JOGADOR. Se um passo ficar sem botão — porque
//    o conteúdo dele não desenhou naquela temporada —, a pessoa fica numa tela
//    vazia sem jeito de chegar na decisão, e a carreira TRAVA. É a regra nº 1 do
//    Diego (segurança contra estado quebrado) aplicada a uma tela.
//
// O que esta trava confere:
//  1. 🚪 TODO passo tem saída (1, 2 e 3 têm botão; o 4 é a decisão).
//  2. 🕳️ O passo 2 tem SAÍDA ATÉ SEM LANÇAMENTO NENHUM no caixa.
//  3. 🔁 Temporada nova volta pro passo 1 (senão a virada seguinte abriria na
//     decisão, pulando o jornal).
//  4. 🌐 O ONLINE não foi tocado: lá o fim de temporada é uma VOTAÇÃO entre os
//     técnicos da sala, e passo a passo ali mexeria no que todos veem ao mesmo
//     tempo.
//  5. 📰 O jornal é o passo 1, e o caixa/mundo/decisão não aparecem junto dele.
//
// uso: node scripts/testa-roteiro.mjs
import { readFileSync } from 'node:fs'
const py = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

console.log('\n1) 🎬 o roteiro existe e sabe onde está')
ok(/const roteiroOn = copaFinished && state\.onlineMode !== 'online'/.test(py), 'o roteiro só liga no FIM de temporada e só no solo')
ok(/const \[fimPasso, setFimPasso\] = useState\(1\)/.test(py), 'começa no passo 1')
ok(/useEffect\(\(\) => \{ setFimPasso\(1\) \}, \[state\.seasonNo\]\)/.test(py), 'temporada nova volta pro passo 1')
ok(/function RoteiroFim/.test(py) && /FIM_PASSOS/.test(py), 'a barrinha dos 4 passos existe')
ok(/disabled=\{!feito\}/.test(py), 'só dá pra voltar em passo JÁ FEITO (não dá pra pular pra frente)')

console.log('\n2) 🚪 nenhum passo prende o jogador')
{
  // cada passo de 1 a 3 precisa de pelo menos um BotaoPasso que leve adiante
  for (const [de, para] of [[1, 2], [2, 3], [3, 4]]) {
    const re = new RegExp(`fimPasso === ${de}[\\s\\S]{0,2600}?irPasso\\(${para}\\)`)
    ok(re.test(py), `passo ${de} tem botão que leva pro ${para}`)
  }
  ok(/fimPasso === 4[\s\S]{0,900}?noVermelho/.test(py), 'o passo 4 é a decisão (leilão / mesmo time)')
  ok(/openLeilao/.test(py) && /openMesmo/.test(py), 'e os dois botões da decisão continuam existindo')
}

console.log('\n3) 🕳️ o passo 2 tem saída ATÉ sem lançamento no caixa')
{
  // este é o buraco de verdade: sem lançamentos o quadro do caixa não desenha
  const i = py.indexOf('TRAVA DE SEGURANÇA DO ROTEIRO')
  ok(i > 0, 'a trava do caixa vazio está escrita no código')
  const corpo = py.slice(i, i + 1800)
  ok(/fimPasso === 2/.test(corpo) && /irPasso\(3\)/.test(corpo), 'e ela mostra um aviso COM botão de continuar')
  ok(/Sem movimento no caixa/.test(corpo) && /No money moved/.test(corpo), 'com texto em PT e EN')
}

console.log('\n4) 🌐 o ONLINE não foi tocado')
{
  // o bloco da votação (online) não pode ter ganhado gate de passo nenhum
  const i = py.indexOf('// ONLINE com amigos: VOTAÇÃO')
  ok(i > 0, 'o bloco da votação online continua lá')
  const corpo = py.slice(i, i + 4000)
  ok(!/fimPasso/.test(corpo), 'e ele NÃO tem gate de passo (a sala continua como sempre foi)')
}

console.log('\n5) 📰 cada coisa no seu passo')
{
  ok(/\(!roteiroOn \|\| fimPasso === 1\) && \(\s*\n?\s*<SeasonJornal/.test(py.replace(/\r/g, '')) || /fimPasso === 1\) && \(/.test(py), 'o jornal é o passo 1')
  ok(/\(!roteiroOn \|\| fimPasso === 3\) && copaGate/.test(py), 'a Copa do Mundo é o passo 3 — discreta, depois do jornal')
  ok(/state\.booksSeason === state\.seasonNo && \(!roteiroOn \|\| fimPasso === 2\)/.test(py), 'o caixa é o passo 2')
  // e fora do roteiro (online) tudo continua aparecendo junto, como antes
  ok(/!roteiroOn \|\|/.test(py), 'sem roteiro (online), tudo aparece junto como antes')
  ok(/!\(roteiroOn && tab === 'jogos'\)/.test(py), 'os chips das fases saem da aba Jogos no fim (ficam em Tabelas)')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
