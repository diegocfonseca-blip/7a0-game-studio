# Auditoria do estádio e das substituições — 27/11/2026

Diego pediu verificar os problemas levantados pela leitura do código, corrigir o que fosse confirmado e, depois, retirar do futebol a escolha entre Dinâmico e Só no intervalo. Elenco define os titulares futuros; substituições em jogo são temporárias; uma reposição clínica já escolhida deve valer durante o afastamento.

## O que foi confirmado

- A versão atual já verifica preparação antes do giro, conserva o 3D ao iniciar copa de quarta/pênalti decisivo e guarda o retorno do intervalo. Nos testes de navegação esses caminhos funcionaram. O teste anterior à alteração também confirmou que ligar Só no intervalo entre dois jogos já valia apenas para o próximo e que confirmar o intervalo retornava ao estádio. Não tratar uma suspeita de leitura como bug reproduzido.
- Depois de resolver causo, lesão ou crise, o usuário consegue escolher 3D novamente e iniciar. Uma cena da Central pode vir antes da escolha: seu botão Pular libera o próximo passo. Avisos globais bloqueiam cliques no jogo enquanto uma decisão está pendente; os testes respeitam esse bloqueio.
- Havia uma decisão duplicada após lesão durante a partida: mesmo com reserva já escolhido, o encerramento gerava nova preparação pendente. Esse comportamento foi corrigido.

## Mudanças

- Futebol solo, Brasil Oficial e tradicional: o seletor antigo deixa de aparecer e seu valor em saves antigos deixa de armar pausa obrigatória aos 45 minutos. A ação antiga SET_SUBMODE normaliza para Dinâmico. O formato dos dados de halftime permanece: xi2 e comandos já gravados continuam necessários para preservar partidas antigas e as três trocas. O basquete mantém seu fluxo existente; online não é alterado.
- Troca comum em partida continua apenas no registro daquele jogo. SET_LINEUP continua definindo o XI futuro e não altera a partida iniciada.
- FINISH_MATCH_INJURY reaproveita EVENTO_DECIDE para validar a reposição já escolhida, programar sua entrada no próximo XI e manter o prazo/retorno médico existente. Uma escalação já organizada pelo usuário é respeitada. Somente o substituto clínico persiste, mesmo quando houve outras trocas comuns na partida. Sem reserva válido, a preparação continua pendente com o caminho existente de organizar o elenco/base. Nenhum jogador é inventado ou promovido automaticamente por essa alteração.
- Sem mudanças de sorteio, frequência/duração de lesão, resultado, salário, mercado, velocidade, banco ou protocolo de salvamento. Sem novas artes, dependências, renderização contínua ou recarga automática.

## Mapa e ideias

`publicoDoEstadio` e `lotacaoDoJogo` já usam capacidade construída, torcida, colocação, chuva/cobertura, clássico e decisão. Não há um parâmetro separado novo para sequência de vitórias/crise; não foi inventada outra lotação financeira.

`presidencia-cidade-equipes.ts` já aplica nome, cores e escudo aos ônibus dos dois clubes, pelas texturas de `presidencia-identidade-dia-jogo.ts`, com fallback de nome/cor quando falta imagem. O museu já possui sala de taças agrupadas e abre sua cena somente ao entrar. Recomendação: manter ali a coleção completa; uma eventual faixa da última conquista na fachada seria só um destaque futuro. Nenhuma alteração artística de fachada foi incluída.

## Evidência e limites

`scripts/teste-fluxo-estadio/runtime.mjs` exercita a tela e o reducer reais em 390/1440 px nas duas carreiras; copas usam a primeira semana em que o clube realmente participa. Pênalti é induzido apenas na bancada para verificar o efeito de navegação. O término do giro é sinalizado pela bancada, com WebGL desativado: estas verificações NÃO medem animação, renderização ou FPS.

`scripts/testa-lesao-partida.mts` confere as três trocas, retirada, goleiro de emergência, dez em campo, replay, reposição clínica, trocas mistas, preservação do passado e de XI já escolhido. `scripts/teste-lesao-partida/runtime.mjs` verifica lesão, substituição, fim, salvar/retomar e ausência da decisão duplicada nas duas carreiras. A regressão de timeline confere 1.075 quadros e 253 posses contra o motor.

Não foi possível medir um Samsung S25 físico nesta execução. A auditoria de fluidez de 21/11 já documentava essa pendência. Não confundir viewport de celular, amostragem de posições 3D ou SwiftShader com medição no aparelho real.

Validação concluída antes da publicação: 26 verificações de navegação sem erros JavaScript; lesão com substituição e retomada no 2D nas duas carreiras; testes do reducer/motor e timeline de substituições passaram. Build completo e recarga registrados na entrega.
