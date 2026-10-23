# Jogador cartoon NO FACE — bancada real

Referência visual: conceito de jogador no estilo dos civis aprovado por Diego em 23/10/2026. A imagem de IA não é captura nem modelo do jogo. Esta bancada usa geometria, esqueleto, materiais e animações reais.

O estilo continua optativo em `loadPlayers(...,{style:'civil-cartoon'})`; o padrão `athlete` preserva a versão publicada até a avaliação da nova base. Não há alteração de banco, carreira ou motor oficial.

## Fontes e preservação

- Corpo/cabelo/roupa-base: Quaternius Ultimate Animated Characters, CC0; `cidade3d/assets/Casual_Male.glb`. Hierarquia original de 23 ossos preservada, inclusive controles de pés separados das canelas.
- Idle/Walk/Run/Jump: capturas autorais do mesmo personagem, fonte completa já vendorizada em `scripts/city-life/assets/source/Casual_Male.glb`. Sprint varia a cadência do Run nativo; não representa um arquivo independente.
- Capturas de futebol CMU já existentes: retargeting de rotações mundiais a partir do Idle original de cada rig. Translação vertical convertida pelo eixo mundial. Referência dos controles ancestrais explicitada nos clipes para não herdar o balanço de outra corrida.
- Créditos/licenças: `public/creditos-3d.txt` e manifests existentes. Não usar golpes de luta como futebol.
- Corpo e cabeça sem edição de vértices, pesos ou articulações. Apenas a camisa recebe recorte localizado em V na geometria de roupa clonada. A barra do short permanece original: o corpo de origem termina sob ela, e encurtá-la expõe uma abertura sem superfície de coxa. Transformações do ajuste são convertidas de volta ao espaço de bind. Meiões e detalhes de chuteira usam materiais; chuteiras reutilizam a malha autoral existente, rígida em cada controle de pé.
- Camisa Neymarzetti usa a arte/escudo e o atlas existentes, com frente, costas e mangas separadas; numeração traseira. Short preto, meia branca e chuteira preta continuam escolhas de teste, sem cadastro oficial.

## Reproduzir

Com dependências instaladas:

```
node scripts/cartoon-football/prepare.mjs
node scripts/cartoon-football/refit.mjs CAMINHO_DA_LINHA_DO_TEMPO_OFICIAL.json
npm run dev -- --host 127.0.0.1 --port 4197
```

Abrir `/7a0-game-studio/scripts/cartoon-football/review.html`. `browser-review.cjs` captura sete vistas/poses. `export-review.cjs` exporta GLB e 120 quadros reais; codificar em H.264 baseline/yuv420p com faststart para compatibilidade. A exportação GLB não preserva integralmente os shaders customizados do runtime.

`browser-match.cjs` usa a fixture local `test-results/animation-library/neymarzetti-current`, obtida do save autorizado. Arquivos de save/evidências não entram no Git. A bancada de mecânica fica em `scripts/cartoon-football/mechanics-audit.html?dataset=neymarzetti-current&style=civil-cartoon`.

## Contatos e limites

O retargeting respeita a bola e os eventos oficiais. Um clipe só entra no perfil se houver contato até 2 mm, pés acima do piso, aproximação relativa positiva e alinhamento da normal de contato com a direção de saída >= 0,5. Passes adaptados de chute continuam provisórios.

O personagem compacto precisa de ajuste visual de aproximação: orçamento total de 0,60 m no personagem, sem mover a posição oficial. Correção residual de âncora até 0,18 m, dentro do orçamento total; IK de perna até 0,08 m e 0,35 rad. Esses limites são diferentes dos do atleta anterior (âncora 0,03 m). Os relatórios explicitam essa diferença; não equivalem a prova de ausência de escorregamento ou de todas as interseções de roupa.

Continuam pendentes: avaliação visual de fluidez em vídeo próximo, equivalência de acabamento ao conceito, desempenho em telefone físico, variedade de cabelos/corpos, capturas específicas de domínio, goleiro, falta e drible. Não marcar um movimento como aprovado apenas porque passou nos testes numéricos.

## Assistir ao replay 11×11

`watch-match.html` apresenta a reprodução local com este modelo, controles de pausa e câmeras de acompanhamento/campo completo. Não muda o estilo padrão publicado nem a câmera livre da cidade. `record-match.cjs` grava o replay completo, verifica a bola dentro do enquadramento e captura três trechos próximos; `encode-match.mjs` gera os MP4 H.264 baseline e uma página local com controles de vídeo. Evidências ficam em `test-results/cartoon-football/11x11/`. A gravação usa o campo existente isolado: não confundir com captura do estádio da conta. O humanoide anterior continua disponível por `style:'athlete'`, sem remoção dos seus clipes.

## Correções de fundamentos e comparação

- `audit-fundamentals.cjs` mede o replay a 10 Hz; `FUNDAMENTALS_OUT` escolhe a pasta de evidências. Compara o deslocamento visual com o deslocamento oficial e registra a distância real entre as chuteiras e a bola durante a posse. Distância pequena não prova impulso ou amortecimento físico: a bola continua sendo a oficial.
- `check-control.cjs` percorre o 11×11 inteiro a 30 Hz, verificando penetração, piso, limites de apresentação e resultado. O controle visual é provisório: usa a corrida original mais alinhamento amortecido de até 18 cm e IK de até 8 cm/0,35 rad; não cria movimentos articulares principais nem muda posse ou trajetória. Só tenta alinhar uma bola baixa e alcançável; recusa ajustes que causem colisão ou piso negativo.
- Correção de tentativas de clearance: restaura posições e rotações dos controles de pé em cada candidato, impedindo acumulação nos pés independentes do rig cartoon.
- Clipes adquiridos são limitados ao seu intervalo válido. A última pose é mantida durante a saída; não retornar à pose de bind ao ultrapassar o arquivo. O tempo de saída considera o tamanho do alinhamento visual. Tronco importado é misturado à postura nativa em 70% no passe e 85% no chute para adaptar o movimento às proporções do cartoon.
- Para preservar a primeira gravação e gerar outra: `MATCH_RECORDING_OUT=test-results/cartoon-football/11x11-melhorado node scripts/cartoon-football/record-match.cjs`, seguido dos scripts `encode-match.mjs` e `check-videos.cjs` com a mesma variável. Inclui um trecho real de controle e a continuação do passe de Cuadrado.

Continuam sem captura específica adquirida e validada: cabeceio, carrinho/desarme, fintas de drible, defesas de goleiro e quedas de falta. Não substituir essas lacunas por animações de luta nem declarar que o catálogo está completo.

## Consolidação do estilo aprovado — 23/10

A direção cartoon foi aprovada explicitamente por Diego. O carregador local agora usa `civil-cartoon` por padrão, inclusive no mapa; a opção `athlete` e seus arquivos permanecem disponíveis. Não houve publicação. Corpo, cabeça, pesos, bind e barra original do short continuam preservados.

O catálogo runtime `club-kit.mjs` contém receitas UV revisadas de Neymarzetti e Rei da Bola FC, com as artes já cadastradas. Rei usa a camisa clara com faixas vermelha/preta e gola redonda original; Neymarzetti mantém a gola em V da roupa. Costas inferidas e short/meias/chuteiras de teste não viram cadastro oficial. Ambos têm camisa clara: não existe variante reserva validada nesta fonte, portanto o contraste de equipes ainda exige atenção na vista distante. Outros clubes não recebem uma receita inventada.

`presidencia-enquadramento-futebol.ts` calcula a câmera a partir do FOV, aspecto, bola e atletas próximos. Transmissão e tática são modos separados; a câmera livre continua sendo a entrada do mapa. A mesma câmera percorre o mesmo mundo e não modifica escala, relógio ou motor. A vista tática pode recuar mais em retrato para caber todo o campo. A câmera de transmissão pausada também termina sua transição.

A pequena silhueta na vista geral decorre de escala real (1,78 m em 105 × 68 m). No lance a 23,4 s, sobreposição de silhuetas por perspectiva não comprova colisão: o par mais próximo está a cerca de 0,73 m nos centros oficiais. Não houve afastamento artificial dos atletas nem mudança de IA para disfarçar a projeção. A legenda de minuto do gravador estava invertida e foi corrigida; o relógio oficial do produto não mudou.

Verificação: `node --import ./scripts/cartoon-football/node-resolver.mjs scripts/cartoon-football/test-camera.mjs` cobre 36 combinações de aspecto/FOV/bola/tática, além do retorno à posição manual. `compare-city.cjs` captura a mesma finalização no estádio QA existente nas três câmeras em desktop, retrato e paisagem, testa a sequência passe/domínio/chute e a continuidade do relógio ao observar a cidade. A fixture fica local, fora do Git. Esses testes em SwiftShader e emulação de viewport não certificam desempenho em telefone físico. O estádio QA completo não representa as compras da conta.

Para a gravação consolidada, usar `MATCH_RECORDING_OUT=test-results/cartoon-football/11x11-consolidado` nos scripts de gravação, codificação e reprodução. Este vídeo é o replay real no campo isolado existente; as capturas `consolidado-cameras/` mostram a integração no estádio/cidade.

`test-official-parity.mjs`, com o mesmo preload de resolução Node, compara uma execução independente do Motor2 com o adaptador em 941 instantes: 20.702 posições, funções táticas, goleiros, visibilidade e todos os eventos. Campos opcionais `undefined` são normalizados apenas na comparação com o JSON salvo. Não existe nova decisão aleatória de movimentação no visualizador.

O replay com minuto estático e sem `visualClock` é uma pose de inspeção, mesmo com `paused:false`. O teste de continuidade fornece ticks oficiais e âncora temporal, como o placar do produto. `CONTINUITY_ONLY=1 node scripts/cartoon-football/compare-city.cjs` conserva as nove capturas já registradas e repete só essa parte. A regressão `scripts/animation-lab/official-source/test-shared-clock.mjs` compara 30.383 amostras com a fórmula e a publicação de tempo do Campo2D.

## Rotação da bola

O gravador antigo não aplicava rotação: bola congelada, apesar da trajetória mudar. O runtime agora usa `posicionarBolaFutebol3D` nos três consumidores. `FutebolOficial3D` anexa quaternion visual à bola, integrado a 120 Hz na mesma instância oficial; posição/eventos não são alterados. Rolamento no chão obedece distância/raio, com eixo mundial correto e quaternions compostos. Repouso, bola carregada e reposicionamentos são tratados sem giro artificial. No ar, a rotação é uma estimativa de apresentação, sem influência física ou alegação de spin medido.

`test-ball-rotation.mjs` cobre circunferência, repouso, voo, reinícios, FPS e busca de instantes. `test-official-parity.mjs` também verifica XYZ da bola. `record-ball.cjs` grava uma evidência focada em 60 fps no mesmo replay 11×11 (22 jogadores no total), verificando cada quaternion realmente renderizado contra o quadro do adaptador. Os trechos de detalhe do passe/chute ficam a 0,5×; condução em velocidade normal. Não usar a gravação antiga de 12 fps como prova do giro novo.

## Auditoria da partida e redes — 23/10

A partida testada contém 49 passes, seis enfiadas, quatro interceptações, quatro dribles, três laterais, dois lances de falta, três chutes (dois gols e uma defesa). Ela não contém todos os tipos possíveis de finalização, bola parada ou falta. Não certificar casos ausentes com base neste save.

| Achado real | Tratamento / limite |
| --- | --- |
| Rede inteiramente rígida e malha lateral incompleta | Grade em fundo, teto e laterais, deformação local amortecida no contato, suportes fixos. Não é solver completo de tecido. |
| Bola após gol ultrapassava o fundo ou parava no alto | Continuação visual pós-confirmação: encaixe no vão real, impacto, rebote, queda e pequeno quique. XYZ e eventos originais continuam no quadro; `presentation` é separado. |
| Fonte 2D pode confirmar gol antes da esfera interpolada atravessar o vão e com altura que não encaixa na trave real | Ajuste visual só após confirmação oficial; bola alta desacelera brevemente antes do vão e entra abaixo da travessa. Não reclassifica gol nem altera motor/placar/assistência. É adaptação de apresentação, não validação da física original em 3D. |
| Marca do pênalti em forma de anel e ausência de ponto central/arcos dos cantos | Pontos preenchidos e quatro arcos de 1 m adicionados às marcações existentes, reutilizando material/lote estático. |
| Defesa do goleiro sem captura específica | A defesa oficial existe, mas falta gesto de mãos/queda validado. A captura de bola ainda pode parecer brusca. Não substituir por Punch/Death/Roll. |
| Laterais e faltas sem gesto específico | Eventos preservados; captura própria pendente, sem afirmar cobrança correta só por haver movimento. |
| Contato corporal compacto | Distância mínima de centros ~0,33 m em um duelo deste save; a cabeça cartoon pode intersectar. Não afastar atletas arbitrariamente nem alterar a marcação oficial. Falta pose de contato compatível. |
| Retorno da formação após comemoração | O motor 2D usa corte/reposicionamento. Isso permanece perceptível no mapa contínuo; falta transição visual compatível, sem mudar coordenadas ou tempo oficial. |
| Duas camisas claras | Não há reserva cadastrada/validada nesta fonte. Falta variante real para contraste distante. |

`GolApresentacao3D` só atua depois de um gol oficial e durante a comemoração. Rolamento visual usa a posição apresentada nesse trecho. O quadro preserva XYZ originais, assim como eventos, autores e assistências. O sinal temporal `netImpact` aciona apenas a rede atingida, no instante de contato, e funciona ao buscar o replay. Redes inativas não atualizam buffers.

`test-goal-net.mjs` verifica os dois gols, limites do gol, rebote/piso, silêncio antes do impacto/rede oposta, retorno ao repouso e seek. `record-goals.cjs` grava os dois gols reais em câmera próxima, 60 fps/0,5×, conferindo malha e posição realmente renderizadas. Evidência local em `test-results/cartoon-football/redes-corrigidas/`. Não confundir este teste visual com uma aprovação de toda a mecânica do futebol.

No campo já gramado, o recuo do gol agora acompanha a grama da extremidade (faixa de 4 m); na evolução inicial continua terra. O modo registrado não recebe essa extensão sobre sua arte. Geometria/material entram no lote estático existente.

As marcações do campo agora são faixas planas, em vez dos tubos que chegavam a ~8,5 cm do piso. Postes, travessões e mastros mantêm geometria volumétrica. As medidas e a espessura de 12 cm das linhas permanecem, sem novos draw calls para as faixas agrupadas.
