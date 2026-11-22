# Continuação solicitada: plano, escalação, tabela e chat

Após o piloto `78fa313a`, Diego esclareceu em 22/11:

- As **novas táticas do mockup** precisam estar no planejamento. As três antigas não são a novidade solicitada.
- Na aba Partida, abaixo do plano, quer o campo do **próprio XI**, mesmo quando não puder editar. Alterações somente nos modos e momentos que já permitem escalação/substituição.
- **No computador a tabela deve aparecer junto da partida**, porque streamers filmam a tela. A pergunta anterior sobre tirar a tabela se aplica à organização do celular; não esconder a classificação de quem transmite no desktop.
- **Chat deve continuar acessível.** Não foi removido do jogo pelo piloto: `ChatWidget`/`PrivateRoomChat` continuam no `index.tsx`, com o botão/menu existente. A prévia anterior não o desenhava, o que deu a impressão de remoção.

## Proposta visual (ainda não é funcionalidade publicada)

Mockup: `scripts/mockups/futebol-plano-escalacao-desktop.html`.

- **Revisão após rejeição do Diego:** o desenho de três colunas apertou o jogo e a tabela. Agora são **duas colunas**, aproveitando até 1680 px: partida ampla à esquerda; classificação com 380–420 px e chat à direita. Plano horizontal abaixo do jogo e XI depois dele. Cinema e Campo2D recebem a largura principal, sem uma coluna estreita para o jogo.
- **Fotos reais enviadas depois:** Diego gostou das abas **no alto** (Partida, Tabela, Estatísticas, Elenco, Rivalidades), pedindo mais contraste. Mantidas nessa posição, com ativa dourada e inativas em creme sobre verde.
- Celular: dentro de Partida, plano seguido do XI. Não repetir tabela e retrospectos no fim da página; esses conteúdos vão para as respectivas abas. Manter o mini-placar ao navegar/rolar.
- O código confirma a duplicação: Números/Elenco da barra inferior em `ligahub.tsx` chamam `abasJogo.escolher`, os mesmos destinos de Estatísticas/Elenco no topo. Proposta: barra inferior resumida a Sala, Troféus e Chat; esses atalhos não duplicam as cinco abas superiores. **Isso ainda é proposta, sem alterar o menu publicado.**
- Diego reforçou a separação por conteúdo: mexer no XI em Partida; classificação e confrontos em **Tabela e jogos**; retrospectos em Rivalidades. Para não esconder a sala de quem nunca toca nas abas, a proposta mantém na Partida **posição/pontos + resumo dos outros placares**, com atalhos Ver tabela/Ver rodada. O desktop mostra a tabela completa ao lado.
- Rivalidades é conteúdo valorizado: preservar próximo encontro, retrospecto geral, últimos duelos, maiores goleadas e sequências contra os amigos. O mockup usa números ilustrativos. Na implementação só mostrar métricas calculáveis no histórico existente; sem histórico, indicar ausência, sem inventar resultados.
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
