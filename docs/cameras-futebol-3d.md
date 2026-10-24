# Câmeras da partida no mapa 3D

Pedido de Diego (24/10/2026): **Ver campo** deve abrir uma câmera de simulador de futebol, acompanhando a jogada, com outras câmeras padrão para escolher. A cidade e a navegação contínua continuam disponíveis.

## Comportamento

- Com partida presente, **Ver campo** entra em **Transmissão**. Sem partida, aproxima o campo existente; se a partida começar enquanto essa vista continua selecionada, entra na transmissão.
- O seletor **Câmera** oferece Transmissão, Lateral próxima, Ampla, Atrás do gol, Tática e Mapa livre. É um controle nativo, acessível por teclado e toque; os antigos botões excediam a largura do celular.
- Transmissão enquadra a bola e os atletas próximos; Lateral próxima favorece a leitura dos personagens; Ampla mostra a construção; Tática mostra o campo inteiro.
- Atrás do gol observa do lado +X, além da linha de gol: âncora de referência `(72, 24, 0)`. Não muda de lado conforme a posse. O enquadramento pode recuar para caber em telas estreitas.
- Cada preset tem lente própria. O mapa livre restaura a posição, o alvo e a lente anteriores; arrastar assume a câmera manual no ponto atual.
- Redimensionar a tela em câmera automática atualiza a projeção e mantém o preset. Não chama a navegação do mapa, nem reinicia a partida.
- Cobertura e juntas do teto ficam invisíveis apenas na passagem de cor das câmeras automáticas, para não tapar o campo. Continuam lançando sombras. Mapa livre restaura os materiais originais; compras/estado/geometria do estádio ficam intactos.

## Arquitetura e limites

O controlador recebe somente a câmera, a posição visual da bola e as posições visuais dos atletas. Não decide passes, chutes, gols ou resultados. Trabalha em metros e nunca aumenta jogadores, bola ou campo para compensar distância.

O enquadramento usa projeção 3D analítica, incluindo bola alta. Movimento e lente interpolam pelo tempo de apresentação; a panorâmica reage mais rápido quando a bola se aproxima da borda. A distância recua prontamente quando a jogada exige e só aproxima após uma redução sustentada da área de ação.

O campo de terra do save Neymarzetti permanece de terra: não se inventam obras ou gramado para a prévia. As animações e a qualidade física dos lances continuam com as pendências anteriores; esta entrega trata das câmeras.

## Verificação

- `node --import ./scripts/cartoon-football/node-ts-resolve.mjs scripts/cartoon-football/test-camera-presets.mjs`: projeção dos cinco presets, bolas altas, cantos, passagem em movimento, zoom, retorno da lente e acomodação em diferentes frequências de renderização. Inclui giro da tela com partida pausada e agenda de frames condicionada ao estado do controlador.
- `scripts/animation-lab/official-source/test-continuous-camera.mjs`: mesma câmera/mundo, retorno suave e escala/LOD preservados.
- `scripts/testa-presidencia-complexo-camera.mjs`: controles reais OrbitControls, navegação manual e redimensionamento.
- Bancada local com os componentes reais e o save somente para leitura: `test-results/camera-qa/`. Compara a mesma jogada, mantém o mesmo identificador/tempo/placar e verifica que a fonte não foi alterada. Autenticação não faz parte dessa bancada.
- Capturas do navegador e viewport de celular não equivalem a FPS medido em aparelho físico. Não declarar câmera perfeita para todas as partidas apenas por um enquadramento estático.

Validação concluída: build de produção passou; 300 enquadramentos, 4.496 quadros em movimento e 20 redimensionamentos pausados passaram. Componentes reais abriram os 22 atletas e as cinco câmeras em desktop e retrato; preservaram identificador, tempo e eventos. Giro retrato → paisagem → retrato conferido também por projeção independente da bola. Retorno ao mapa e teto fechado inspecionados; sem erros JS/HTTP ou alteração da fonte. A fixture de teto completo é local, separada do campo de terra real do save. Publicação segue a mesma prévia privada autorizada; o workflow de implantação precisa concluir com sucesso para confirmar o envio.
