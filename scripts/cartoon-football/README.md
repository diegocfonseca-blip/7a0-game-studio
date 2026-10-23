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
