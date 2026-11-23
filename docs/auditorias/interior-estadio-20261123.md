# Interior do estádio e acabamento da partida 3D — 23/11/2026

Diego pediu a análise completa do interior e da partida após aprovar o bairro compacto. Depois da análise e das capturas reais, autorizou: “Ok faça tudo q tem que ver q fazer então”. Revisão isolada em `feat/interior-estadio-revisado-20261123`. Não há migração, compra nova, alteração de elenco, placar, motor2, autoridade online ou save.

## Implementação

- Torcida em três representações (próxima, intermediária e poucos pixels), com escolha por altura projetada na tela, histerese e atualização por deslocamento da câmera. Reserva do passeador, pessoas, posições, cores e ocupação permanecem. A transmissão mantém seu limite de oito detalhados. O passeio preserva as pessoas próximas e simplifica a arquibancada distante.
- Faixas dos uniformes interpoladas na posição de repouso do próprio modelo, sem quantização das coordenadas num atlas de oito bits. A classificação de regiões usa os pesos interpolados dos ossos, em vez de estender o primeiro vértice para o triângulo inteiro. `smoothstep` passou a receber limites crescentes. O modelo, UVs, pesos, escala e movimentos importados continuam os mesmos; pele e cores dos clubes mantêm seus próprios controles.
- Gramado com menor contraste no ruído fino, conservando o campo claro pedido anteriormente. Entorno imediato compartilha acabamento e UVs métricos com o campo. Várzea e progresso parcial continuam respeitando a plantação real, sem antecipar grama ou arquibancadas.
- Interior com cadeiras creme/verde-grafite e acento terroso, cobertura verde com preenchimento discreto e ferragens foscas. Nenhuma luz ou passe de sombra adicional. A noite mantém quatro refletores de estádio e sombras dinâmicas desligadas no perfil móvel.
- Tubos das traves mais suaves e suportes posteriores discretos, fora da abertura regulamentar. Rede levemente tensionada, com opacidade por distância; mantém a reação já existente aos impactos e o repouso sem atualizar vértices continuamente.
- Bola mantém raio físico de 11 cm e ampliação visual de 1,2–2,2 vezes. Material mais fosco e sombra de contato que se espalha discretamente com a altura. A acomodação da escala visual passa a usar tempo decorrido, mantendo resposta semelhante em diferentes cadências de desenho.
- Enquadramentos verticais de TV, transmissão, lateral e acompanhamento têm margem vertical maior para os controles, sem alterar fontes, interface ou escala de jogadores/campo.
- Correção residual de sola usa somente a cadeia da perna, com orçamento de 8 cm para jogadores e 14 cm para goleiros. Não move raiz, tronco, mãos ou bola. Próximo à bola, a tentativa só é aceita se preservar o ponto de superfície em até 3 mm e a folga em até 2 mm; a pose é restaurada se falhar. Não foram inventados novos clipes de domínio, defesa ou cabeceio.

## Evidências

Bancada: componente real `PresidenciaComplexo3D`, Chromium/SwiftShader, larguras 390 e 1440, estádio completo e população derivada do público da carreira. Comparação com a auditoria anterior da mesma entrada:

| Vista | Antes: triângulos | Depois: triângulos | Antes/depois: chamadas |
|---|---:|---:|---:|
| Sentado na arquibancada | 1.025.427 | 628.201 | 88 / 100 |
| Transmissão desktop | 396.869 | 397.221 | 65 / 64 |
| Transmissão móvel | 325.082 | 325.434 | 52 / 51 |

A geometria total do passeio caiu cerca de 39%; a parcela da torcida passou de 668.672 para 278.072 triângulos, com as mesmas 6.042 pessoas visuais. Há mais chamadas no passeio devido à representação intermediária separada; a transmissão não ganhou chamadas. Esses números são geometria/desenho, não FPS medido num Samsung S25. Não certificam o desempenho físico desse aparelho.

Partida completa: 2.821 quadros a 30 Hz, com saída, passes, domínio, falta, cruzamento, lançamento, finalização, gol, tiro de meta e fim. Onze clipes distintos observados, incluindo canhotos, cabeceio e voo de goleiro. Entrada preservada, 22 atletas, nenhum número inválido ou erro JavaScript. Placar 0 × 1 e 69 eventos conferidos contra execução independente do mesmo motor oficial. Pausa durante a partida conservou posições e orientações.

As observações de piso abaixo de −1 cm nos relatórios de apoio passaram de 260 para 2. Restam observações em 18,3 s (−2,31 cm) e 21,33 s (−1,17 cm), próximas da bola, recusadas pelas restrições de contato. Não afirmar zero penetração universal nem ampliar a correção à força. A leitura é do apoio da malha nesta entrada; não comprova todos os futuros lances, contatos de mão ou capturas ainda inexistentes.

Capturas e relatórios: `/workspace/shared/auditoria-interior-estadio-20261123/`, incluindo `final/`, `revisado/`, `partida-revisada/` e `regressao-foco-final/`. As imagens `detalhe-*` usam outra câmera local para examinar objetos da cena real; não são novas câmeras publicadas nem imagens geradas por IA.

## Reprodução

Com o servidor Vite local na porta 5184:

- `node scripts/interior-estadio/test-model.mjs`: LOD, público, cores, assentos, reservas, foco, zoom, raio da bola e retorno da rede ao repouso.
- `INTERIOR_OUTPUT=test-results/interior-estadio node scripts/interior-estadio/replay-browser.cjs`: partida completa e paridade oficial.
- `FOCO_ORIGIN=http://127.0.0.1:5184 FOCO_BASE=/ node scripts/testa-mapa-foco-browser.mjs`: 22 atletas, cidade fora da cena durante o jogo, zoom, assentos e retorno ao mapa durante a semana.
- `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`: TypeScript e build completo.

A reversão é independente do bairro compacto: os arquivos desta revisão podem voltar ao estado anterior sem migrar ou apagar progresso.

## Autorização de publicação

Após receber as capturas reais e os resultados acima, Diego autorizou em 23/11/2026: “Publique então p todos já”. A entrega será publicada para todos pelo fluxo automático da `main`, sem recarga automática dos clientes. A confirmação do deploy depende do término bem-sucedido do workflow; esta autorização não substitui essa checagem.
