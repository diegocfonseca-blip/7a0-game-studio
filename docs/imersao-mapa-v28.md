# Imersão da cidade, câmeras e velocidade do campo — 01/11/2026

Base estável: `5705d431`. Acesso ao mapa, campo 2D e futebol 3D continua exclusivo da conta proprietária já verificada. Nenhuma tabela, compra, ingresso, bilheteria, resultado, elenco ou save foi alterado.

## Cidade e moradores

O passeio anterior era truncado em segmentos retos de até 30 m, com velocidade constante até a ponta. O novo planejador percorre trechos conectados das calçadas existentes, interrompe o percurso diante de obstáculos e arredonda curvas apenas onde o piso permite. Os percursos não inventam ruas nem entradas em prédios. A planta e os caminhos específicos de torcida, comércio, ônibus e carros permanecem intactos.

Aceleração/frenagem, faixas de ida/volta e retornos contínuos usam distância física; as mesmas animações Quaternius avançam pela distância percorrida. Modelos e proporções não mudaram. Distribuição dos moradores usa todos os percursos, evitando o salto de sete índices que podia concentrar atores quando a quantidade de rotas era múltipla de sete.

O corte fixo de visibilidade a 150 m escondia a população na vista aérea. A visibilidade agora considera o tamanho projetado na tela e o frustum. Longe, as poses ficam em 6 Hz; perto, preservam o detalhe original. A escala física e o orçamento existente de 20 moradores no perfil móvel/limitado e 48 no desktop permanecem. São representantes decorativos da população do clube, não novos torcedores contabilizados.

## Câmeras

A transmissão e a lateral próxima em retrato enquadram o lance próximo, sem abrir a lente para um apoio distante. Uma pequena centralização do grupo reduz espaço vazio. A tática continua mostrando o campo inteiro. Desktop, mapa livre e a escala do mundo preservados.

A lente espera 550 ms antes de fechar novamente, evitando pulsações quando um atleta atravessa o limite do enquadramento. Se a bola aproxima da borda, a panorâmica responde mais depressa; testes cobrem também 2×/4× e 10/60 FPS. Não se alteram os jogadores ou o movimento da bola para fazê-los caber na tela.

## Velocidade

O HUD e os controles existentes oferecem 0,25×, 0,5×, 1×, 2× e 4×. Entrar, sair, voltar ao mapa, trocar a rodada ou receber a confirmação da conta não força mais a velocidade para 0,25×. O relógio compartilhado da carreira continua sendo a fonte da partida, dos eventos e dos comentários. Não há outro motor nem outro placar.

A publicação não amplia permissões pagas ou de salas online; o provider existente permanece restrito à prévia proprietária/offline. O banco não é necessário.

## Verificação

- TypeScript/Vite: build completo passou.
- Três novas verificações: rotas/retornos/odômetro; LOD por projeção sem escala artificial; enquadramento/lente e bola acelerada em 2×/4×.
- Suite existente de câmera: 300 enquadramentos, 4.496 quadros móveis, 20 giros de tela pausados e retorno ao mapa. Navegação: OrbitControls real, pan, pinch, zoom, resize e recuperação de poses.
- Geometria da cidade existente: 48 moradores, 32 rotas, 17.280 posições verificadas por raycast e sólidos, sem sair das calçadas ou atravessar prédios. Rotas específicas de torcida/transporte também passaram nas verificações anteriores.
- Relógio real de LiveScoreCard: jogo completo sem gols, abertura tardia, dois gols confirmados uma vez, gol aos 45 antes do intervalo e retomada. O harness antigo dependia do painel inline removido anteriormente; agora registra explicitamente a observação do campo e testa o mesmo relógio de produção sem WebGL. A entrada real do mapa é validada separadamente na carreira.
- Carreira Neymarzetti, rodada 4, cópia local em viewport 390×844: 22 jogadores; HUD 2×/4×; mesmo ID e avanço sem salto; escolha 4× mantida ao voltar ao campo; 20 moradores e 17 rotas da cidade correspondente ao save; nenhum erro JS. Captura real da interface da carreira e do bairro renderizado. Backend simulado, rede externa bloqueada, sem avanço na nuvem.
- Mesma jogada em retrato, antes/depois: mesmo instante, bola e relatório oficial; só a câmera mudou.
- Conta proprietária/segunda conta/logout, 2D forçado e entrada alternativa: bloqueios preservados em desktop e celular. Nenhuma atualização automática de página (`npm run recarga`).

Fingerprint do motor oficial continua `23599bdba04b0c7c2639389e2509f4d81a34796083f78b6a5d81e97c0d22bbbd`.

## Limites e reversão

Os testes usam WebGL por software e viewport móvel; não certificam FPS em telefone físico. Os moradores ainda usam passeios decorativos de ida e volta; não ganharam IA social ou novos destinos comerciais. O trabalho refina a cidade existente, não a reconstrói.

Evidência privada em `test-results/imersao-v28/`; prévias compartilháveis em `/workspace/shared/imersao-mapa-v28/`. Reverter somente o commit desta revisão restaura câmeras, trajetos e controle anteriores, sem reverter saves ou trabalhos de outros sistemas.
