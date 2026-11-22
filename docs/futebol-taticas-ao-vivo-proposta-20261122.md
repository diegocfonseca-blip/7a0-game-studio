# Continuação solicitada: plano, escalação, tabela e chat

Após o piloto `78fa313a`, Diego esclareceu em 22/11:

- As **novas táticas do mockup** precisam estar no planejamento. As três antigas não são a novidade solicitada.
- Na aba Partida, abaixo do plano, quer o campo do **próprio XI**, mesmo quando não puder editar. Alterações somente nos modos e momentos que já permitem escalação/substituição.
- **No computador a tabela deve aparecer junto da partida**, porque streamers filmam a tela. A pergunta anterior sobre tirar a tabela se aplica à organização do celular; não esconder a classificação de quem transmite no desktop.
- **Chat deve continuar acessível.** Não foi removido do jogo pelo piloto: `ChatWidget`/`PrivateRoomChat` continuam no `index.tsx`, com o botão/menu existente. A prévia anterior não o desenhava, o que deu a impressão de remoção.

## Proposta visual (ainda não é funcionalidade publicada)

Mockup: `scripts/mockups/futebol-plano-escalacao-desktop.html`.

- Desktop largo: partida à esquerda; plano e XI embaixo dele na coluna central; classificação e chat à direita.
- Desktop compacto/tablet: partida + plano/XI na esquerda, classificação/chat na direita.
- Celular: Partida, Tabela, Números, Elenco e Chat em abas. Dentro de Partida, plano seguido do XI. Não repetir a tabela inteira abaixo do plano.
- Protótipo tem fluxo local de ordens e edição ilustrativa do XI. Mensagens não saem do navegador e não representam pessoas conectadas.

## O que existe hoje e a mudança necessária

Hoje `PLAY_ROUND` chama `simMatch`, calcula o placar completo, credita tabela/artilharia e grava `lastResults` antes de a exibição começar. `SET_TACTIC` grava o plano para a próxima simulação. Por isso, as táticas atuais **não mudam a partida em andamento**. Não basta acrescentar botões ou mexer no desenho do Campo2D.

Para as novas ordens valerem na partida atual, a proposta é aplicar **a partir do próximo lance/interrupção confirmado pelo host**, com estes requisitos:

1. Preservar todos os lances/gols já exibidos. Reprocessar somente o trecho futuro, sem trocar o minuto inicial nem remontar a partida.
2. Comando por UID/clube, partida e versão, validado pelo dono. Cada técnico comanda apenas seu clube; autorização visual não concede cadeira/host.
3. Host confirma o lance/minuto de entrada e emite o mesmo roteiro para os participantes. Identificador idempotente evita reaplicar depois de atraso ou reconexão. Não abrir outro canal nem transmitir posições a cada quadro.
4. Reconciliar o resultado, classificação, artilharia e assistências uma única vez. Os cálculos atuais adiantados não podem deixar gols apagados ou duplos. Cobrir pênaltis, agregado e transições de fase antes de estender além da liga.
5. Validar: dois usuários mandando juntos; host/participante; comando repetido; atraso; recarregar; reconectar; lance do gol já iniciado; apito final; próximo jogo. Conta sem piloto permanece no comportamento antigo.
6. Primeiro teste em uma sala de Diego + Futpoint. Não ligar o motor novo só porque um desses usuários está em uma sala pública com outros participantes.

## Comandos propostos

- Postura: Retranca, Equilíbrio, Ofensivo.
- Caminho do ataque: Variado, Pelo meio, Pontas.
- Marcação: Normal, Pressão alta. Pressão alta busca recuperação adiantada e deixa espaço nas costas; não deve ser um bônus sem desvantagem.
- Instruções extras: ritmo de ataque e atenção especial a um adversário. Ritmo tático não é a velocidade da transmissão.

Essas regras ainda precisam de implementação e calibração no motor. O piloto publicado só mudou apresentação e reaproveitou os controles existentes. Não afirmar que novas táticas já influenciam os jogos.
