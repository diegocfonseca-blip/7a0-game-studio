# Chelsão: nova sala pulava posições após Envelope Único

## Evidência e causa

Sala VPSMF8, criada em 16/11 às 02:52 UTC (23:52 de Brasília em 15/11).
O salvo confirma o goleiro do Peñarol e os mesmos dez jogadores grátis dos
prints, com IDs `pc-sobra-*`: a convocação recebeu apenas o pacote de GOL.
Os baralhos das outras quatro posições existiam, com quatro pacotes em cada.

Pouco antes, o mesmo dono havia criado JTUXBJ, de Envelope Único, ainda
aberta no último salvo (`euAberto=true`, primeira lista). A reprodução local
com o reducer real confirmou o mecanismo ao abrir uma sala normal a partir
de uma sala de Envelope Único inacabada.

Em `START_ONLINE`, os comandos para zerar `euAberto`, `euRevelando`,
`euRodada` e `euSobras` estavam depois de `//`, na mesma linha do comentário
sobre a Kings. Portanto não executavam. `envUnico` desligava, mas `euAberto`
continuava verdadeiro. Ao fechar os goleiros, `sealAndResolve` usava o
caminho de Envelope Único e encerrava o leilão inteiro. A convocação depois
preenchia as posições sem pacote com cartas fortes gratuitas do catálogo.

## Correção

Restaurar os quatro comandos na inicialização de `START_ONLINE`, fora do
comentário. O novo modo continua sendo escolhido pela ação. Quando ele é
Envelope Único, sua abertura inicializa novamente as flags normalmente.

Não altera regras de preço, cartas, complemento, fases, relógios, protocolo,
identidade, coroa, recuperação ou dados das salas já criadas. Não reinicia
nem repara automaticamente uma partida antiga já afetada.

## Validação

`scripts/testa-troca-leilao-online.mts` usa o reducer real e salas fictícias,
sem montar o Provider ou abrir canais. Com `--antes`, sobre a base sem o
conserto, comprova GOL como único pacote e dez complementos grátis por humano.
Depois do conserto, percorre GOL/LAT/ZAG/MEI/ATA e os três humanos convocam
seus onze jogadores dos pacotes comprados, sem complementos grátis.

Também verifica 24 transições: sair do envelope aberto, da primeira revelação
ou da segunda lista, abrindo leilão normal, Clubes, Seleções, Décadas,
Liga + Copa, Tocaia, Pregão Aberto e outro Envelope Único. Crachá, assento,
lista de pessoas e autoridade permanecem os da nova sala.

Build completo (`npm run build`) e os testes existentes do Envelope Único
passaram. Simulador com rádio em pedaços: 16 cenários online, uma semente por
cenário, nenhuma falha (144 segundos). A reprodução de navegador com rede
externa bloqueada e a cópia do salvo da sala real foram preservadas na análise.

Execução: `npx tsx scripts/testa-troca-leilao-online.mts`. `QA_OUT` muda a
pasta de resultados; padrão `/workspace/shared/chelsao-leilao-20261116`.
Evidências completas do incidente ficam nessa pasta, fora do repositório.

Diego autorizou seguir com a correção depois do diagnóstico. Esta entrega
fica em branch/PR separado; a publicação ainda depende de ordem explícita.
