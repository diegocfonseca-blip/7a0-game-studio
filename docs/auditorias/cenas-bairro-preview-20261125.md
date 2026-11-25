# Momentos do bairro — prévia local de 25/11/2026

> Registro da revisão inicial, com aprovação posterior para publicar em 25/11/2026: “entao publique”. As referências abaixo a aguardar aprovação descrevem o estado anterior. Complemento posterior: [cenas de jogadores e lesão em partida](cenas-jogadores-lesao-partida-20261125.md), com ações próprias, identificação do atleta e elenco de dois a quatro atores. As métricas abaixo pertencem à composição inicial.

Pedido: reduzir repetição e frequência, mostrar uma ação reconhecível do mapa e melhorar os personagens próximos sem substituir toda a multidão. O Diego pediu para fazer **para ver como fica**. Esta revisão está na branch `feat/cenas-bairro-preview-20261125`, sem commit ou publicação, aguardando a revisão visual da prévia real.

## Mudanças

- Resultado comum deixou de gerar filme de boteco. Não existe quantidade obrigatória de vídeos. A seleção exige um fato revelado: título/acesso, vitória recorde por pelo menos quatro gols, vitória em clássico, primeira chegada da torcida em casa, obra comprada, negociação de pelo menos 25 moedas, evento de noitada/lazer já decidido ou balanço oficial relevante da loja.
- Uma cena por vez. Intervalo mínimo de três rodadas entre cenas comuns já vistas; título/acesso têm prioridade. Isso não altera a frequência dos acontecimentos da carreira: só a apresentação. Todos os critérios são de exibição, sem recompensa, punição ou cobrança nova.
- Camisas: compara balanços anuais que o próprio jogo registrou. Crescimento mínimo de 25% e 100 camisas, ou primeiro balanço conhecido com pelo menos mil vendas. Não calcula vendas diárias fictícias nem reconstrói histórico ausente de saves antigos.
- Histórico por carreira/clube, no próprio save: no máximo 100 cenas vistas e 12 balanços anuais. Marcar é idempotente e não clona a carreira inteira. Não repete a mesma taça a cada rodada, nem a mesma suspensão/noitada com outra chave. Assistir até o fim registra o momento, conservando o cartão até navegar ou pular. Rever explicitamente também funciona após pular e retomar o save, sem ser bloqueado pela marca antiga de cartão fechado. O histórico acompanha a retomada do save e zera na carreira nova; não viaja no rádio de uma sala online.
- Trecho de sete segundos, com ação e câmera próprias; não depende do passeio estar pausado e não avança relógio oficial, jogo ou calendário. Reprodução e repetição explícitas; retomada de progresso durante resize/recriação por mudança de qualidade.
- `Pular` e `Ver no mapa` disponíveis desde o começo. O mapa é o mesmo canvas guardado pelo cofre, sem segunda cidade. Ao abrir o mapa, conserva o momento; ao pular ou navegar para outra área, libera os personagens adicionais. Movimento reduzido exige reprodução manual. Falha no carregamento tem mensagem e saída acessível.
- Removida a dependência de um cartão de calendário para uma cena aparecer na Central direta. Rever traz o cartão visível para a tela, inclusive no desktop após retomar o save. Decisões pendentes e a apresentação de chegada de jogo grande continuam com prioridade, evitando oferecer um vídeo sem vaga para o mapa.

## Arte e custo

São os cenários e modelos reais já existentes no jogo. Quatro civis próximos, com dois arquivos já compartilhados pelos pedestres da cidade: `Casual_Male.glb` e `Casual_Female.glb`. Usa animações autorais existentes (`Walk`, `Walk_Carry`, `Victory`, `Idle`), roupa do clube e sacolas simples na loja. Nenhuma imagem gerada, nova biblioteca ou novo arquivo de personagem.

A multidão distante mantém instâncias leves. Os quatro atores adicionais não projetam sombras e atualizam as poses no máximo 18 vezes por segundo. Ao terminar o trecho, param de recalcular a pose; ao sair, soltam os esqueletos e materiais clonados. A medição isolada registrou 25.000 triângulos adicionais (incluindo as quatro sacolas), 24 primitivas/draw calls e liberação de 20 texturas de esqueletos ao sair, mantendo a geometria compartilhada em cache. O custo só existe enquanto a cena é solicitada. A bancada usa Chromium com GPU por software: seus tempos **não demonstram FPS em um celular físico**. A aprovação estética dos avatares existentes continua com o Diego.

Os cenários da bancada usam números de exemplo claramente identificados; nenhuma conta real foi aberta ou modificada. Em produção, a seleção lê apenas os registros da carreira. As capturas e vídeos são renderizações reais desses componentes.

## Verificação e revisão

- `scripts/testa-cenas-bairro-central.mts`: 60 resultados comuns sem vídeo; prioridades, intervalo, estabilidade, origem real dos balanços, serialização limitada, protocolo de replay e câmera.
- `scripts/testa-cenas-bairro-save.mts`: registro idempotente, identidade de elencos/caixa preservada, isolamento de online/basquete, limpeza na carreira nova e sanitização para rádio.
- `scripts/mapa-compacto/cenas-runtime.cjs`: cartão nativo e mapa guardado em 390/1440 px; animação até o fim, replay, troca para mapa, pular, redução de movimento, descarte e erro de modelo.
- `scripts/teste-cenas-carreira/runtime.cjs`: tela real da carreira, registrar após assistir, conservar cartão, não repetir ao voltar, rever, pular e retomar save sem repetição. Caixa preservado.
- Regressão `scripts/testa-carreira-evolucao.mts`: 535 amostras do 3D; formações atômicas, limite de três trocas, intervalo, copas, causalidade, replay e registros. Memória limitada em 1.800 jogos/30 temporadas.
- Build completo `npm run build` requerido antes de eventual commit/publicação.

Artefatos de revisão e relatórios: `/workspace/shared/cenas-bairro-preview-20261125/`. A página `revisao.html` agrupa capturas e vídeos reais; `runtime.json` e `carreira-runtime.json` guardam os resultados da bancada. Sem alteração de OVR, mercado, economia, autoridade online, basquete ou Fórmula 1.

## Resultado final da bancada

Build completo `npm run build` concluído com código 0. Seleção/persistência, regressão da carreira, sete verificações do cartão/mapa e fluxo da carreira real passaram. As capturas finais incluem a reabertura da cena no desktop após pular e retomar o save. Relatórios finais sem erros de execução. Publicação e commit continuam pendentes da revisão visual solicitada pelo Diego.
