# Pós-jogo da liga direto na Central — 26/11/2026

Diego pediu que a partida da liga termine na Central com um resumo de classificação no mesmo padrão visual da agenda, a agenda abaixo e um avanço explícito para o cartão existente de placar/2D/3D. Esclareceu que Jogos + Tabela permanece no mesmo lugar, com todos os detalhes.

## Implementação

- Revisão da rodada só para futebol solo no fluxo novo da Central, Brasil Oficial e tradicional. A escolha de transmissão e a aba original continuam existentes.
- Apito/revelação confirmados geram apresentação pendente, usando a marca de apito já existente. Intervalo e pênalti pendentes impedem essa revisão. A navegação automática respeita a coletiva e ocorre uma vez por rodada, para quem estava assistindo em Jogos ou no estádio.
- Resumo mostra líderes e vizinhos do próprio clube, posição real e pontos. Link abre a tabela original. Caixas e cabeçalho reutilizam os componentes da agenda; agenda aparece abaixo, nos dois tamanhos.
- C usa a tabela da fase/grupo do jogo encerrado, sem antecipar grupo futuro já calculado; D usa o grupo do clube. Pontos são os mesmos objetos já revelados; não re-simula para mostrar o resumo.
- Revisão pausa os avanços automáticos do calendário e da rodada. Avançar só confirma a leitura e libera o fluxo existente até o próximo confronto: não dispara PLAY_ROUND. A transmissão continua sendo escolhida antes do apito.
- A marca de leitura é apresentação local da sessão; voltar manualmente a Jogos + Tabela não força um novo retorno. Não cria dado novo no save, nuvem ou economia.

## Limites preservados

Não troca de aba de quem estava administrando outra área. Não modifica formatos, resultados, gols, tabelas, coletivo de jogadores, mercado, salvamento, salas online, CO2 ou basquete. Copas/intermissões e encerramento da última rodada da temporada preservam seus fluxos próprios; a nova revisão é entre partidas da liga.

## Verificação

- `scripts/teste-central-pos-jogo/verifica.mjs`: tela/reducer reais em Chromium, Oficial/tradicional, 390/1440px, placar e2D, navegação do3D, ausência de avanço automático, tabela seguida de agenda, acesso à aba original, confirmação antes da escolha e retorno direto após novo apito. O primeiro cenário também aguarda o apito real da partida seguinte no placar rápido; os demais usam o sinal de fim injetado pela bancada para conferir a navegação. WebGL desligado: testa o caminho de navegação do3D, não qualidade/renderização3D.
- Cinco cenários principais, retorno3D versus Finanças e quatro cenários da regressão de botões passaram, com capturas de celular/desktop e nenhuma exceção de página.
- Cenário de intervalo: não apresenta revisão com decisão pendente; confirma os mesmos XI do primeiro tempo pela ação real e libera o retorno.
- `scripts/testa-central-pos-jogo-tabela.mts`: fase correta, pontos zerados no novo grupo, sem mostrar fase futura ou grupo de outro clube, SérieD, tradicional e ausência de mutação.
- Regressão `scripts/teste-central-botoes/verifica.mjs` atualizada para confirmar a revisão antes da escolha. Mantém casos de Copa pendente, fases sem participação e troca de transmissão.
- Relatórios e capturas reais da bancada em `/workspace/shared/central-pos-jogo-20261126/`. Sem contas reais ou pedidos externos; build completo e recarga obrigatórios antes do commit.

Publicar em commit isolado e reversível após as verificações. Nenhuma migração/SQL ou recarga automática.
