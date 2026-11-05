# Variação do bairro e locais de encontro

Mudança visual do mapa: cinco famílias de construção, três coberturas e cores estáveis por endereço. Detalhes de muros, portões, reboco e sacadas ficam nas primeiras 40 casas próximas; materiais continuam compartilhados e agrupados. Nenhuma nova imagem/modelo externo.

O diagnóstico inicial encontrou os 20 moradores da amostra fazendo visitas entre casas, quase todos em bairros distantes. Parte do mesmo orçamento agora usa as plataformas dos ônibus e a lateral livre dos botecos. Rotas e faixas dos acompanhantes são validadas contra piso, obstáculos e área de serviço. Mesas/cadeiras também bloqueiam a circulação. Os limites de 20/48 moradores e o modo Leve permanecem; bares usam mais assentos do conjunto já existente, e clientes das barracas ficam mais tempo no atendimento. As entradas e o roteiro de torcidas/delegações não mudam.

## Verificação

- `node scripts/teste-mapa-variacao/verify.mjs`
- Com Vite na porta 5340: `node scripts/teste-mapa-variacao/verify-browser.cjs`
- `node scripts/teste-mapa-variacao/verify-captures.mjs /tmp/leilao-mapa-variacao/validacao-pontos.json`
- Build: `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`

A bancada usa o cenário local completo, bloqueia serviços externos e não acessa o save. `MAPA_BASE`/`MAPA_OUTPUT` ajustam servidor e saída. O fallback automático de qualidade é suspenso **apenas na resposta interceptada pelo teste**, para o renderizador por software não reiniciar a cena durante a comparação. Não altera a proteção de desempenho do jogo.

Execução de 04/11: 15 amostras sem erro de navegador; 120 verificações independentes de distância do mobiliário, mínimo de 1,60 m; 20 moradores antes/depois, 14 destinados aos encontros. Passaram também os testes existentes de caminhada, destinos, atividade, visibilidade e dia de jogo.

Na mesma câmera do bairro: 374 → 447 draw calls; 572.814 → 644.572 triângulos; 660 → 663 geometrias. Mais moradores ficaram visíveis, portanto o custo de desenho aumentou mesmo sem aumentar o teto. O contador de texturas inclui dados dos esqueletos e não mede MB de memória. Nenhum FPS de celular físico foi medido. Capturas e JSON desta execução: `/workspace/shared/mapa-variacao/`.

Publicação aprovada por Diego em 04/11/2026 após revisão das capturas e do impacto de desempenho. Não houve mudança em compras, banco de dados, regras, resultados ou permissões de acesso ao mapa.

## Correção de cobertura — 05/11

Diego não enxergou diferenças nas construções mesmo em Alta. A inspeção da cena confirmou 594 construções, mas somente 17 casas com muro e 10 sacadas novas: o limite das primeiras 40 casas removia esses elementos do restante do bairro, inclusive quando se aproximava a câmera. O parâmetro `distant` também removia muros e sacadas permanentemente dos bairros externos.

Muros, portões, sacadas e cornijas agora acompanham o tipo de construção em todo o bairro. O limite de 40 continua apenas para molduras miúdas, caixas de correio e reboco gasto. Muros laterais delimitam os pátios; acessos centrais de 2,60 m permanecem livres. O acabamento superior dos muros usa a cor da própria geometria, sem caixas/texturas extras. Sacadas têm porta. Volumes/endereço/orientação das 594 casas, comércios, ruas e lotes permanecem iguais.

Comparação real no cenário local completo, circulação desativada para isolar arquitetura, qualidade Alta fixa apenas na bancada SwiftShader:

- `node scripts/teste-mapa-variacao/verify-architecture-browser.cjs antes` (versão publicada antes da correção).
- `node scripts/teste-mapa-variacao/verify-architecture-browser.cjs depois` (correção; também captura viewport 393 px).
- `node scripts/teste-mapa-variacao/verify-architecture-captures.mjs` compara geometria real, entradas livres, distribuição em quatro quadrantes, trajeto de moradores e recursos.
- Artefatos: `/workspace/shared/mapa-arquitetura-cobertura/`.

Resultado: 17 → 368 casas com muro (252 no bairro externo); 10 → 169 sacadas. Vista geral: 739 → 777 draw calls, 758.794 → 814.604 triângulos (+7,36%). Contadores de geometrias (663) e texturas (310) mantidos; esses contadores não medem MB. Orçamento de regressão da vista geral: até +8% de triângulos. Nenhuma nova imagem/modelo baixado, nenhum aumento de NPCs. FPS de celular físico não medido. Não atribuir essa constatação à versão aberta no navegador do usuário: ela ainda não foi identificada.
