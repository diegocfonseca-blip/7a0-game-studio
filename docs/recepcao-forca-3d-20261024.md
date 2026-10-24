# Recepção sem atração visual e preparação do chute — 24/10/2026

Diego pediu que o jogador alcance passes imprecisos e que chutes fortes mostrem uma preparação convincente. Civis NO FACE, rig, uniformes e escala permanecem. Esta entrega é uma correção parcial de apresentação, não aprovação da naturalidade.

## Causas verificadas

1. `BallTouchPresentation` aproximava a bola da chuteira em até 32 cm, antes mesmo de confirmar contato. A camada passou a observar os contatos reais e integrar a rolagem, sem corrigir a posição da bola. Uma posse oficial antecipada não comprova domínio visual.
2. A aproximação limitada do corpo era aplicada depois da amostragem da marcha. Agora sua distância alimenta o clipe de locomoção antes da avaliação da pose, com velocidade de correção limitada a 1,8 m/s. Bola distante continua sem toque confirmado; não há teleporte para encobrir a falta de alcance.
3. Motor2 `disputas()` considera candidatos a 1,45 m em bola baixa; `pega()` concede posse e `movimenta()` passa a colocar a bola 75 cm à frente. A posição apresentada é interpolada, mas a posse já pertence ao estado corrente: a distância visível na troca pode exceder 1,45 m. Isso continua na origem. Não atribuir toda descontinuidade ao 3D nem usar a distância interpolada como raio bruto da regra.
4. A entrada longa da captura escondia parte do recuo adquirido da perna nos chutes. O banco mede recuo nativo relativo ao quadril e prioriza amplitude disponível conforme a velocidade da entrega oficial. A entrada da captura de chute é antecipada; contato/continuação são revalidados. Não são alterados ossos, pesos, força física ou instante oficial do chute. Preparação do banco é cooperativa para evitar um novo bloco síncrono longo.

## Verificação

Replay local do save exportado: Rei da Bola FC × Neymarzetti, mesmos 1×1 e 82 eventos; nenhuma escrita no banco/save e nenhuma rodada avançada. Varredura de 2.821 quadros a 30 Hz: zero penetração pé–bola/piso, zero excesso da correção de raiz, zero falso toque, zero salto adicional em jogo corrido. Três reposicionamentos oficiais de reinício; uma sobreposição conservadora dos volumes de cabelo; sete amostras de direção contrária em jogo corrido. Distância de condução >22 cm da chuteira: 228→258 amostras; retirar a atração deixa essa insuficiência mais aparente, não a resolve.

Três entradas locais mantiveram 52/44/36 contatos válidos e 1×1/82, 1×0/77, 2×0/72. As duas últimas são variações de QA, não rodadas reais da carreira. Testes de posse antecipada a 0,4/1/2,4 m confirmam deslocamento visual adicional zero da bola; aproximação do corpo limitada; passe a 4 m não força alcance. Testes de continuidade, recepção e build completo também executados.

Evidências em `test-results/cartoon-football/recepcao-forca/`: comparação `antes.json`/`depois.json`, `whole/whole-match.json`, `official-receptions.json` e `video/{antes,depois}-{normal,lenta}.mp4`. Câmera, replay e trechos iguais. Os vídeos são renderizações reais locais de trechos, não captura da conta ao vivo ou partida inteira. Campo de terra preserva o estágio do clube exportado. 30 fps é taxa de gravação, não benchmark de celular físico.

## Comparação medida

Mesmos 2.821 quadros, base `3370d5cf`: 423 quadros com correção posicional adicional da bola → zero. Amostras com posse oficial e chuteira a mais de 28 cm da superfície: 177→206. Este segundo indicador confirma que a fonte ainda fornece recepções incompatíveis; não é aprovação.

Recuo efetivamente renderizado da chuteira relativo ao quadril, projetado na direção de saída, com peso de captura >0,5:

| Chute | Antes | Depois |
| --- | ---: | ---: |
| Souza | 32,10 cm | 32,59 cm |
| Denis Law | 33,22 cm | 36,16 cm |
| Oséas | 26,72 cm | 31,54 cm |

Os três contatos mantiveram aproximadamente 1 mm de folga entre superfície da chuteira e bola no instante oficial. São ganhos modestos, não uma nova biblioteca de chutes. O caso Souza conserva o perfil anterior quando antecipar a captura falha na validação. Inspeção visual confirmou preparação mais aparente em Denis Law, mas ainda existem postura rígida, domínios sem captura própria e bola fora do alcance em parte da recepção. Não classificar a simulação como natural apenas por esses números.

## Limite e próximo passo concreto

Domínio/condução continuam provisórios: não há captura dedicada na biblioteca disponível. Não declarar que toda recepção agora é correta. Corrigir integralmente a aquisição remota exige substituir a regra compartilhada de posse por alcance físico verificável, manter a bola livre quando inalcançável e fazer o receptor perseguir/interceptar sua trajetória; depois aplicar controle gradual por contato. Isso altera disputas/interceptações e potencialmente eventos/resultados de partidas futuras. Resultados já persistidos não devem ser reescritos. A regra pertence ao motor que Diego pediu explicitamente para preservar; não foi modificada silenciosamente.

Alterações locais reversíveis, sem publicação nesta rodada. O código visual está pronto para revisão; não alegar correção completa ou qualidade FIFA/PES por sucesso nos testes numéricos.
