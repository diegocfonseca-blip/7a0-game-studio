# Consulta de adversários e faixa de rivalidade — 22/11

Diego pediu facilitar a consulta dos times adversários no desktop e manter a faixa marrom junto do próximo jogo na aba Partida, em celular e desktop. A aba Rivalidades conserva o retrospecto completo.

## Comportamento

- Na aba Elenco do piloto, o desktop mostra um campo adversário por vez. Há setas, seleção pelo nome do clube, contador, barra de rolagem lateral e navegação pelo teclado. Voltar à aba ou redimensionar a tela preserva o clube escolhido. O campo próprio e a partida nativa permanecem montados.
- No celular permanece a consulta original dos campos; a alteração do navegador de adversários é somente no desktop. O Bafo conserva a apresentação específica dos seus elencos de 22 cartas.
- A aba Partida recebe o próximo jogo do calendário (rodada, mando e adversário); logo abaixo vem a faixa marrom quando o adversário é outro usuário identificado. A aba Rivalidades mostra o mesmo próximo jogo/faixa, os retrospectos contra os amigos e os detalhes registrados.
- O seletor do próximo jogo pula apenas folgas, sem pular adversários controlados pelo jogo para procurar um encontro humano distante. Não inventa partida quando acaba o calendário. Contra bot, mostra o próximo jogo sem fabricar rivalidade entre pessoas.
- A faixa reaproveita os dados e o componente existentes. Sem consulta nova, canal, alteração de resultados, calendário, host, assentos, permissões ou banco. O escopo permanece exclusivamente na conta principal do Diego; futebol online. As opções novas do componente compartilhado têm padrão que preserva o restante do jogo.

“Resumo da rodada”, mencionado na conversa, é a faixa **Outros jogos**, com os placares das demais partidas. A lista completa fica em **Tabela e jogos**. Não foi criada outra seção com esse nome.

## Verificação

- 315 verificações de interface aprovadas, sem erros JavaScript: setas, seletor, último clube, teclado, rolagem, retorno à aba, mesma instância do placar/canvas, próximo adversário humano versus bot, cartão nas duas abas, celular/desktop, copas e Bafo. Executadas na tela real com reducer/provider isolados e rede externa bloqueada.
- `node scripts/testa-football-round-status.mjs` e `node scripts/testa-football-match-pilot.mjs`: passaram.
- `npm run build` (TypeScript e Vite) e `git diff --check`: passaram.
- Capturas e relatório: `/workspace/shared/adversarios-rivalidades-20261122/`.
- A bancada não substitui teste físico no Samsung S25 ou duas sessões autenticadas. Nenhuma sala real foi alterada nos testes.
