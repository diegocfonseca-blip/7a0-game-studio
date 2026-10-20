# 🌐 Carreira Online v2 — desenho (19/10)

Pedido do Diego: *"tudo que existe no modo carreira offline… tem que funcionar no modo carreira online… até 20 amigos"*.
Regra dele (permanente): **é um modo INDEPENDENTE** — caminho próprio, nunca mexe no envio/canal/coroa das salas rápidas e das
Minhas Ligas. Decisões fechadas com ele estão em `docs/pendencias.md` (19/10).

## Como funciona (o combinado com o Diego)
- **O dono da sala manda no tempo**: começa a rodada, automático/manual, velocidade, pausa. Antes de cada rodada cada um mexe no
  PRÓPRIO clube e aperta PRONTO (ou acaba o tempo). A partida roda igual pra todos, ao mesmo tempo.
- **Salva sozinho, na hora, na nuvem do JOGO** (não no celular nem na nuvem do dono). Cada clube tem a sua **gaveta** ligada à CONTA
  de quem joga. Sem botão de salvar — só "Sair". Entra de qualquer aparelho com a mesma conta.
- **Só o dono abre** a sala no dia seguinte (regra da coroa). Todo mundo entra na sala de espera; o dono aperta "▶️ Continuar".
  Quem faltou joga com a última escalação.

## Por que dá certo (prova de 19/10: `node scripts/carreira-online/prova-sincronia.mjs`)
O motor da carreira solo já é DETERMINÍSTICO: `buildPyramid(managers, you, seed, deck, placements, cpuSquads)` +
`simulatePyramid(world, seed, rodada, táticas, escalações, …)` dão sempre o mesmo resultado com as mesmas entradas.
Com 20 clubes de gente nas 4 divisões, dois aparelhos que só receberam os PEDAÇOS chegaram na mesma tabela, artilharia e placar
de todas as 38 rodadas. Tamanhos medidos:

| pedaço | tamanho | quando viaja |
|---|---|---|
| o que é de todos (semente, divisões, rodada, fase) | 0,3 KB | a cada rodada |
| gaveta de 1 clube (elenco + formação) | 4,4 KB | quando o dono do clube mexe |
| as 20 gavetas | 88 KB | quem entra na sala lê uma vez |
| fichas dos bots | 115 KB | 1 vez por temporada (mercado da virada) |
| escalação de uma rodada (PRONTO) | 0,1 KB | 1 vez por rodada por pessoa |

Compare: hoje a sala manda o estado INTEIRO comprimido (~250–450 KB numa carreira de 20) a cada mudança, até 2,5×/s, pra todos.

## Desenho técnico (proposta, a construir por etapas)
- **Tabelas próprias** (nada em `game_rooms`/`room_players`): `esc_co_sala` (dono, semente, temporada, rodada, fase, prazo do PRONTO,
  automático/velocidade/pausa, versão do jogo) · `esc_co_clube` (sala, assento, conta, gaveta pública: nome/escudo/elenco/formação/
  escalação/tática; gaveta privada: dinheiro, Agência, SAF, técnicos, presidência… só o dono lê) · `esc_co_mundo` (fichas dos bots,
  colocações, histórico da temporada; 1 escrita por temporada).
- **Quem escreve o quê** (RLS + funções): cada conta só escreve a PRÓPRIA gaveta; só o dono da sala avança fase/rodada; dinheiro e
  lance de leilão passam por função do servidor (anti-trapaça: ninguém se dá dinheiro mexendo no celular).
- **Fluxo da rodada**: fase PREPARO (prazo) → cada um grava escalação + PRONTO → dono aperta (ou prazo vence) → fase JOGANDO com o
  número da rodada e a hora de início → todo aparelho calcula a rodada com o mesmo motor e mostra o mesmo relógio → apito → efeitos
  do PRÓPRIO clube (gás, gols, dinheiro) gravados na gaveta de cada um.
- **Mesma versão obrigatória**: a sala guarda a versão do jogo; aparelho com versão diferente recarrega antes de entrar (senão o
  cálculo pode sair diferente).
- **Avisos ao vivo**: um canal próprio só da carreira (`carreira:<sala>`), com mensagens curtas ("rodada 12 começou", "fulano pronto").
  Nada periódico (regra das mensagens, `npm run canal`).

## Etapas
1. Base: tabelas + regras de quem escreve + fluxo da rodada (PREPARO/PRONTO/JOGANDO) + teste com 20 robôs. Só na conta do Diego.
2. Trazer tudo que é de CADA clube (Central, roteiro, técnicos, gás, Agência, SAF, Presidência, estádio, Master…), cada ação
   gravando na gaveta do próprio clube (nunca `managers[youIdx]` do dono).
3. O que é de todos: leilão da virada no servidor, copas, internacional, Copa do Mundo, ranking global, coletiva.
4. Teste fechado com amigos → liberar.

⚠️ Visual novo (sala de espera da carreira, barra de PRONTO) = mockup pro Diego ANTES de codar.
