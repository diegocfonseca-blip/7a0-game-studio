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

## Football Action Controller — 23/10

A auditoria do vídeo `11x11-consolidado/passes-e-chutes-camera-lenta.mp4` e do runtime encontrou estas causas:

| Camada | Causa / correção |
| --- | --- |
| Autoridade | Motor2 decide posse, trajetória, resultado e eventos antes da animação. O visual não aplica impulso. O controlador deve antecipar o timestamp oficial; nunca atrasar bola para esperar uma pose. |
| Seleção de captura | Ajuste antigo priorizava distância do pé/normal de saída e aceitava tronco ~120° oposto ao passe. Busca agora considera orientação, apoio no piso, aproximação relativa do pé e margem de deslocamento. Reutiliza os mesmos clipes existentes. |
| Root motion | Retarget preservava somente a translação vertical. Translação horizontal adquirida agora é extraída no espaço mundial, escalada pela proporção medida das pernas e usada para casar a velocidade da raiz no contato. Curva Hermite une aproximação/recuperação à trajetória oficial com limite total de 0,60 m. Não é translação livre da física oficial. |
| Transições | Seleção considera o contato mais próximo, em vez do primeiro intervalo da lista. Preparação e recuperação têm estados explícitos e orientação antecipada. Gait acompanha distância percorrida na navegação visual. |
| Orientação | Pose importada continua principal; ajustes mundiais pequenos de tronco/ombros (até 0,35 rad) e cabeça (0,52 rad), sem editar anatomia, bind ou pesos. Giro de raiz em corrida é limitado para não transformar preparação em corrida de costas. |
| Contato e apoio | O pé de contato mantém ajuste à superfície real da chuteira; pé de apoio recebe IK de até 8 cm/0,35 rad, com âncora extraída da própria pose adquirida. Guarda recusa penetração/piso negativo; correções não se acumulam entre quadros. |
| Colisão | Predição local de cruzamentos por 0,45 s, desvios opostos e projeção de volumes de tronco/cabeça. Cabeça/cabelo são medidos no modelo existente. Ajuste da navegação até 0,38 m, orçamento total do avatar 0,60 m; contato programado é protegido. Se restrições forem incompatíveis, o diagnóstico registra o conflito. Não muda decisões táticas, posse ou probabilidades. |
| Recepção | `officialAction` expõe autor/receptor/tipo do mesmo lance Motor2. Receptor orienta corpo antes da chegada; alinhamento/IK só para bola baixa e alcançável. Domínio é provisório sem captura própria. Erros de controle continuam pertencendo ao motor e seus atributos. |

`FootballActionController` organiza **decision → approach → preparation → contact → continuation → recovery**. O horário oficial é fixo; `contactReady` é uma verificação de pose, sem autoridade para emitir impulso ou mudar resultado. A agenda revisada continua limitada ao input/hash da fixture aprovada: ainda não existe ajuste automático validado de todos os clipes para qualquer save. Onze ações originais seguem sem captura aprovada. Não afirmar que o catálogo ou todas as transições estão prontos.

Pipeline de revisão com o mesmo material adquirido:

```
node scripts/cartoon-football/refit-priority-actions.mjs --all
node scripts/cartoon-football/extract-root-motion.mjs
node scripts/cartoon-football/extract-support-anchors.mjs
node scripts/cartoon-football/test-action-controller.mjs
node scripts/cartoon-football/audit-actions.cjs
node scripts/cartoon-football/browser-match.cjs
```

A busca é uma nova calibração, que exige revisão dos resultados antes de aprovação; não promover o perfil automaticamente. O corpo, rig de 23 ossos, skinning e 17 clipes permanecem os mesmos. Passes adaptados de capturas de chute continuam identificados como adaptações.

Bancada: `action-lab.html`, nove casos do mesmo replay oficial, sem jogo inventado. Primeira entrega visual: disputa Denis Law/Júnior Baiano, passe curto de Denis Law e finalização de Souza. `record-action-bench.cjs` gera normal (6 s) e lenta (12 s) a 60 fps. `record-action-matrix.cjs` registra os outros seis casos, com status provisório/lacunas; `audit-action-matrix.cjs` acrescenta métricas. `check-action-videos.cjs` valida reprodução dos quatro MP4.

Evidências em `test-results/cartoon-football/action-controller/` (fora do Git). Nos três trechos a 60 Hz: nenhum conflito entre volumes, contatos na ordem de 1 mm e orientação revisada; velocidades do apoio, **somente quando a âncora estava efetivamente plantada e não limitada**, ~0,0024 m/s no passe e ~0,097 m/s no chute. Velocidade bruta de um vértice/chuteira perto do chão pode ser alta em giro, saída de apoio ou no pé que chuta: isso não prova apoio estático nem deve ser ocultado. Os relatórios preservam também essa medida bruta. Há transições fora da janela de plantio que continuam em revisão.

Partida inteira: 950 amostras, 48 contatos programados, 3.803 amostras de janelas; sem penetração pé/bola, piso negativo, excesso do orçamento ou interseção dos volumes de cabeça nas amostras. Isso não é prova contínua de todas as malhas/roupas em todos os frames. O indicador antigo de alinhamento à direção oficial ainda registra diferenças durante antecipação/desvios: não declarar toda a locomoção aprovada por causa dos contatos. Mesmo 1×1/82 eventos. Nenhuma publicação ou escrita de banco.

## Saída do pé — revisão temporal de 24/10

O contato de 1 mm em um quadro escondia uma falha de ritmo: no passe de Denis Law (0,90 s), a chuteira chegava a apenas 1,42 m/s; no chute de Souza (14,10 s), chegava a 2,32 m/s e perdia avanço na direção da bola. O timestamp oficial já estava alinhado à saída: atrasar a bola não corrigiria essa causa.

`motion/strike-clock.mjs` agora permite retemporizar a captura existente em torno do marcador fixo. A curva é monotônica e tem velocidade contínua no contato e nas extremidades da janela; não gera poses novas. O ajuste de velocidade da raiz usa a mesma taxa da captura. As duas ações foram recalibradas em trechos melhores dos mesmos arquivos CMU, preservando contato, direção, apoio e limite de 0,60 m. Nenhuma anatomia, clip novo, impulso ou posição oficial foi alterada.

Nos dois trechos a 120 Hz, a velocidade da chuteira no último intervalo anterior ao contato passou a 4,58 m/s no passe e 13,42 m/s no chute; no intervalo seguinte, 4,41 e 16,09 m/s. O componente na direção de saída permanece positivo antes e depois. Distância no contato: ~1 mm. São medições do centro da chuteira renderizada, não equivalência física entre velocidade do pé e da bola nem aprovação de todos os movimentos.

**Escopo:** o relógio pode servir a outras ações, mas somente estes dois lances receberam calibração temporal e inspeção próxima nesta revisão. Os outros 46 planos continuam com o relógio anterior; onze ações permanecem sem captura aprovada. Não aplicar a mesma taxa a todas as animações sem medir direção, contato e continuação.

Validação: `test-strike-clock.mjs` verifica monotonicidade e continuidade; `audit-release.cjs` mede os dois intervalos no runtime real, incluindo a continuação, orientação, piso e deslocamento. `RELEASE_BASELINE=1 RELEASE_AUDIT_OUT=...` registra uma versão anterior sem exigir os novos limiares. Antes/depois preservaram exatamente as mesmas 170 posições amostradas da bola. `browser-match.cjs`: 48 contatos, 3.803 amostras de janelas e 950 da partida, sem novas penetrações ou excesso de deslocamento; o indicador antigo ainda aponta 84 diferenças de direção fora das capturas, sem aprovação geral da locomoção. Paridade oficial: 941 instantes, 20.702 posições, erro zero, mesmo 1×1 e 82 eventos.

```
node scripts/cartoon-football/test-strike-clock.mjs
node scripts/cartoon-football/audit-release.cjs
RELEASE_BENCH=1 ACTION_RECORD_OUT=test-results/cartoon-football/release-sync node scripts/cartoon-football/record-action-bench.cjs
RELEASE_BENCH=1 ACTION_RECORD_OUT=test-results/cartoon-football/release-sync node scripts/cartoon-football/check-action-videos.cjs
```

Evidências reais em `test-results/cartoon-football/release-sync/`: MP4 normal de 4 s e lento de 8 s (60 fps, H.264 baseline), comparação numérica `before/release.json` × `release.json`, sequência de quadros, página `assistir.html`. Reprodução verificada no Chromium; não equivale a teste em celular físico. Nada publicado ou escrito no banco. Reversão isolada pelo commit desta revisão.

## Apoio e flexibilidade — 24/10/2026

Referência local: `release-sync/fundamentos-normal.mp4`, enviada na revisão anterior. O arquivo com sufixo `(1)` não foi anexado nesta mensagem. O diagnóstico confirmou cadência média durante toda a passada, mudanças binárias de gait e ausência de foot locking na locomoção. O apoio curto de chute não cobria corrida, frenagem ou giro.

`locomotion-sampling.mjs` usa as velocidades dos vértices de apoio já medidas nos clipes para integrar uma curva de distância e amostrar o AnimationMixer. Transições Idle/Walk/Run/Sprint têm pesos contínuos, conforme a velocidade. As distâncias calibradas por ciclo são ~1,111 m na caminhada e ~2,921 m na corrida. Sprint continua usando a corrida nativa em outra cadência: não foi criada ou aprovada captura de sprint nova.

`LocomotionGrounding` preserva uma âncora mundial enquanto a sola está próxima do piso, suficientemente plana e sem giro/velocidade vertical incompatíveis. IK residual até 8 cm / 0,28 rad; orientação do tornozelo até 0,20 rad. Ao exceder alcance, sair do apoio ou aproximar da bola, o ajuste cede. Nunca estica ossos, prolonga apoio impossível, muda a trajetória oficial ou tenta esconder falhas movendo a bola. Foot locking não fica ativo durante todas as fases da passada.

Inclinação limitada pela aceleração/frenagem e mudança de direção, filtrada por 0,14–0,16 s, chega a até 0,09 rad. Pelvis recebe 22% e tronco 78%; joelhos/tornozelos recebem pequena compensação IK para manter os pés. Ombros e braços seguem o movimento adquirido e o blending, sem nova oscilação inventada. Essa camada desaparece nos contatos revisados com a bola. Não foram alterados rest pose, hierarquia, proporções, pesos ou malhas.

Sombras suaves das solas: uma malha instanciada para os 44 pés, textura de 32×32, sem física de tecido ou novas luzes. Intensidade reduz com a altura, desaparece para jogadores ocultos; piso, dia/noite, estádio e mapa preservados. Na bancada: 136→137 chamadas, +88 triângulos, +1 geometria e +1 textura. Esses números não são FPS de um celular físico.

Escala medida: todos os 22 modelos em pose neutra com 1,78 m; gramado 105×68 m, vão do gol 7,32000017×2,44000006 m, raio da bola 0,110000006 m. Nenhum redimensionamento necessário. Zoom não muda tamanho físico.

Comparação em cinco trechos a 120 Hz, mesmos instantes e bola oficial:

| Trecho | Velocidade horizontal média dos pés baixos, antes → depois, nos mesmos quadros | Apoio efetivamente travado: amostras / velocidade média |
| --- | --- | --- |
| Corrida de Abedi Pelé | 5,072 → 3,789 m/s | 10 / 0,0051 m/s |
| Frenagem de Athirson | 2,737 → 2,071 m/s | 27 / 0,0098 m/s |
| Giro de Júnior Baiano | 3,687 → 2,821 m/s | 17 / 0,0019 m/s |

Pé baixo pode estar em pivô, saída de apoio ou balanço: a primeira coluna é diagnóstico bruto, não prova de deslizamento de uma sola plantada. Amostras travadas exigem peso >0,95, erro <1 cm, sem limitação, em dois quadros consecutivos. A cobertura ainda é curta; não declarar locomoção sem deslizamento. O trecho chamado `PARADA` no vídeo é frenagem com microajustes oficiais (mínimo 0,276 m/s), sem forçar velocidade zero no motor; o passe inicial também mostra pose parada.

Passe e chute mantêm contato ~1 mm e a calibração temporal anterior. Bola oficial idêntica em todas as posições amostradas antes/depois. `browser-match.cjs`: 48 contatos, 3.803 amostras das janelas, 950 amostras da partida; zero penetrações de bola/pés, piso inválido, excesso de orçamento ou conflito entre os volumes de cabeça nas amostras. Permanecem 84 divergências do indicador antigo de direção durante antecipação/desvio. Paridade independente: 941 instantes, 20.702 posições, erro zero, mesmo 1×1 e 82 eventos. Nenhuma aprovação geral de domínio/goleiros/cruzamentos.

Pausa e câmeras: repetir o mesmo timestamp agora preserva velocidade filtrada, inclinação e âncoras de apoio. Trocar close/tática/transmissão/pés em 2,1 s manteve posições e quaternions dos 22 rigs exatamente iguais. Retorno de LOD distante reinicia o histórico local para evitar inclinação causada por deslocamento acumulado enquanto oculto.

```
node scripts/cartoon-football/test-locomotion-sampling.mjs
node scripts/cartoon-football/audit-grounding.cjs
node scripts/cartoon-football/test-pose-continuity.cjs
node scripts/cartoon-football/record-refinements.cjs
node scripts/cartoon-football/check-refinements.cjs
```

Bancada opcional `mechanics-audit.html?refinement=before` desliga somente essas três camadas novas para comparação; produção mantém o refinamento ligado por padrão no estilo Civil. Não há controle disso na experiência normal do usuário. Antes e depois usam o mesmo replay, uniformes, campo, luz e posições de câmera.

Evidências locais em `test-results/cartoon-football/fundamentos-refinados/`: comparações normal (12 s) e lenta (24 s), versão ajustada separada, seis cenas por vídeo (corrida, frenagem, direção, passe, chute e câmera baixa dos pés), escala, apoio, continuidade de pausa e reprodução. MP4 H.264 baseline/faststart, reprodução testada no Chromium. Vídeos gravados antes da proteção de repetição do mesmo timestamp; o fluxo progressivo desses vídeos não muda com essa proteção. Não houve teste em aparelho físico. Recuperação prévia: branch `recovery/antes-refino-apoio-20261024`, commit `613dec46`. Nada publicado ou escrito no banco.

## Partida inteira, quadro a quadro — 24/10/2026

A nova auditoria usa o mesmo replay oficial **Rei da Bola FC 1×1 Neymarzetti**, 82 eventos, 22 atletas. `audit-whole-match.cjs` percorre 94 s a 60 Hz (5.641 quadros, 124.080 intervalos de atleta), incluindo quem está sem bola. Outra execução a 30 Hz (2.821 quadros) corresponde à taxa da nova gravação. Nenhum save, rodada ou banco foi alterado.

Problemas reproduzidos e corrigidos:

| Problema | Causa | Correção |
| --- | --- | --- |
| Trancos nas disputas | Projeções finais de até 60 cm voltavam para um cache de navegação limitado a 38 cm; o clamp seguinte e as projeções preditivas podiam virar o deslocamento bruscamente. | O alvo continua em 38 cm, mas a projeção histórica até 60 cm retorna suavemente. Correção preditiva limitada a 4 m/s fora dos contatos programados; volumes reais de cabeça/corpo ainda têm a palavra final sobre a separação. |
| Colisão após gol | O motor coloca temporariamente três atletas na mesma coordenada; resolver todos sobre uma linha não cabe no orçamento do modelo caricato. | Distribuição determinística em duas dimensões para âncoras coincidentes. Mesma formação/decisões oficiais, apenas separação residual. Teste de três e quatro cabeças de raio 38 cm mantém distância mínima >=75 cm dentro de 60 cm de ajuste por avatar. |
| Pé dentro da bola em 81,3667 s | Ajuste do corpo vinha depois da checagem da chuteira. | Nova checagem da superfície dos pés após grounding e até três projeções combinadas de corpo/bola quando necessárias. |
| Condução anulando desvio | O alinhamento para a bola podia puxar a raiz de volta contra o desvio do defensor. | Remove gradualmente do alvo de alinhamento o componente oposto à navegação. O gap continua registrado quando a captura/alcance não permite tocar. |
| Corrida brevemente oposta ao deslocamento | Rotação muito lenta em reversões e derivações do ajuste visual. | Taxa de orientação de 8–14 rad/s conforme o ângulo, sem mudar o caminho ou criar um ciclo de ossos. As observações em jogo corrido caíram de 69 para 17; não são 17 jogadas automaticamente inválidas. |
| Bola atravessando o campo no reinício | Interpolação entre estados descontínuos do mesmo motor após gol/intervalo. | `placementReset` e posições de apresentação usam o estado corrente oficial nesses instantes. Coordenadas interpoladas brutas continuam intactas para paridade. Não é uma trajetória nova nem correção de chute por teleporte. |
| Câmera mirando ponto diferente da bola visível | A bola já podia ter continuação de gol/apresentação, mas a câmera usava apenas XYZ bruto. | Enquadramento considera a mesma posição apresentada pelo mesh; modo livre e câmera única permanecem. |
| Pose se mexendo ao pausar disputa | Mesmo timestamp reexecutava a resolução e realimentava ajustes. | Reutiliza a pose final quando fonte e LOD não mudaram; sem avanço de gait em dt=0. Antes, repetição em 67,8 s deslocava até 33 cm; agora zero nos quatro casos testados, também em quaternions. |
| Vídeo cortado | Gravação completa anterior era 12 fps. | Nova gravação a 30 fps, 800×450, H.264 baseline/faststart; isso não é FPS medido em celular. Codificação usa o número exato de quadros do recibo para não consumir sobras de outra gravação. |

Validação final em 60 e 30 Hz: **zero conflitos dos volumes testados, penetrações pé–bola, piso negativo, excesso do orçamento de raiz ou passos extras bruscos fora do reposicionamento oficial**. Os sete indicadores de passo extra a 60 Hz e quatro a 30 Hz remanescentes coincidem com `placementReset`, sem ser deslocamentos de jogo corrido. Os três reposicionamentos oficiais continuam instantâneos (dois gols e intervalo); não foram transformados em uma nova simulação de transporte da bola.

A paridade independente continua com erro zero em 20.702 posições/941 instantes; teste novo verifica 11.281 estados e os três intervalos de reposicionamento, com rotação estável na bola parada e enquadramento do ponto visível. Os 48 contatos programados passaram. Redes: dois gols, 606 amostras de contato, sem reação antecipada/oposta; rotação: mesma orientação em 12/30/60/120 Hz e ao rebobinar. Malha, rig de 23 ossos, bind, skinning e 17 clipes preservados.

Limitações que a auditoria não aprova por tabela:

- 17 observações breves de orientação em jogo corrido, ainda sujeitas a revisão visual de transição/pivô.
- 535 observações de bola baixa com posse oficial e distância da chuteira >22 cm. Isso inclui posse antes da chegada interpolada, preparação e toques espaçados; não são 535 erros confirmados. Gap máximo ~2,04 m. Domínio e condução continuam provisórios, sem captura dedicada.
- Uma defesa/encaixe oficial em 59,10 s (Ever Almeida), sem captura específica de goleiro validada.
- Os dois titulares têm muito branco e pouco contraste à distância; ambos têm `away:null` no catálogo local. Não foi inventada reserva oficial.
- A fixture tem duas faltas, um cruzamento, quatro dribles e uma defesa, mas não possui cabeceio/carrinho. Esses movimentos não podem ser aprovados por esta partida.
- Foram verificados volumes de cabeça/corpo e superfície das chuteiras, não todos os triângulos de roupa. Sem benchmark em aparelho físico.

Reprodução:

```
WHOLE_AUDIT_OUT=test-results/cartoon-football/partida-minuciosa/validated node scripts/cartoon-football/audit-whole-match.cjs
MATCH_AUDIT_HZ=30 WHOLE_AUDIT_OUT=test-results/cartoon-football/partida-minuciosa/video-rate node scripts/cartoon-football/audit-whole-match.cjs
node scripts/cartoon-football/test-collision-clusters.mjs
node scripts/cartoon-football/test-paused-disputes.cjs
node --import ./scripts/cartoon-football/node-ts-resolve.mjs scripts/cartoon-football/test-restart-presentation.mjs
MATCH_RECORDING_OUT=test-results/cartoon-football/partida-minuciosa/video MATCH_RECORDING_WIDTH=800 node scripts/cartoon-football/record-match.cjs
MATCH_RECORDING_OUT=test-results/cartoon-football/partida-minuciosa/video node scripts/cartoon-football/encode-match.mjs
MATCH_RECORDING_OUT=test-results/cartoon-football/partida-minuciosa/video MATCH_RECORDING_WIDTH=800 node scripts/cartoon-football/check-videos.cjs
node scripts/cartoon-football/report-whole-match.mjs
```

`report-whole-match.mjs` compara a auditoria inicial preservada em `whole-match.json` com `validated/whole-match.json`; exige os invariantes finais e gera `summary.json`/`analise.html`. Evidências fora do Git em `test-results/cartoon-football/partida-minuciosa/`: partida completa de 94,033 s a 30 fps, sete trechos próximos em lenta (21 s), métricas, reprodução e pausas. Gravação usa o campo existente em bancada isolada; não retrata o estádio da cidade. A reutilização de pose pausada foi acrescentada depois da filmagem, sem mudar os quadros progressivos da partida. Recuperação: `recovery/antes-auditoria-11x11-20261024` em `b4b5d1c4`. Nada publicado; motor oficial, equilíbrio competitivo e banco preservados.

## Posse próxima e recepção do goleiro — 24/10, local

Diego reprovou a distância bola/pés e a naturalidade do chute/goleiro, apesar dos contatos pontuais anteriores. Causa: o Motor2 mantém a bola 75 cm à frente do dono, inclusive após `encaixa`, e a apresentação anterior só aproximava a raiz até 18 cm. Não mudar esse motor para corrigir uma limitação visual.

- Corpo acompanha a bola com avanço visual suave até 46 cm, dentro do orçamento total de 60 cm. Não persegue o pé oscilante da passada. IK residual e prevenção pé–bola continuam limitados; colisão não zera de repente o avanço quando a própria pose original já cruzava a bola. Liberação do avanço em 60 ms evita acumular um deslocamento inválido após o passe.
- Camada de chute recebe o avanço inicial e o mistura à raiz capturada; três finalizações recuperam em 460 ms, com saída de 240 ms. Marcadores oficiais e capturas existentes preservados. `previousRecovery` mantém o comparativo anterior na bancada.
- Recepção alta de Ever Almeida (59,1 s) usa CMU **34_01**, recorte 4,4–6,2 s, adaptado ao rig Civil. Fonte é recepção/lançamento de **futebol americano**, não captura específica de goleiro. Combina membros superiores adquiridos com Jump nativo e postura Crouch da UAL, ambos Quaternius CC0. Pequeno ajuste de braços por IK e ajuste vertical da curva adquirida, sem editar rig, anatomia ou pesos.
- Entre `encaixa` e a reposição, apenas a apresentação da bola acompanha as mãos; após sair, retorna continuamente à trajetória/receptor oficiais. Antes do contato e depois da recepção seguinte usa a bola canônica. Motor, posse, XYZ brutos e eventos não são reescritos. `presentFrame` é consumido pelo campo isolado e pelo renderizador do mapa.
- `cartoon/keeper.json` contém somente dois clipes adicionais (cerca de 618 KB), origem, intervalo, hash BVH e revisão do espelho. Carrega apenas se a partida já corresponde à entrada/versão de motor revisada; não habilita essa coreografia em outro save. Licenças em `cartoon/LICENSE-CMU-keeper.txt` e `public/creditos-3d.txt`.

Bancada real, normal/lenta, em `test-results/cartoon-football/posse-visual/index.html`: mesma fixture 1×1/82 eventos/22 atletas, sem publicação/DB. A mediana de distância diminuiu nos dois trechos, mas continua havendo afastamento residual. Na partida inteira, amostras de condução com distância acima de 22 cm caíram de 268 para 188 a 30 Hz (535 para 372 a 60 Hz). Não equivalem a segundos de contato ou aprovação de todos os domínios. Continuam faltando captura específica de primeiro toque/condução, defesas rasteiras/mergulhos, calibração de outros saves e desempenho em celular físico. Flags de deslocamento para trás permanecem diagnóstico, não foram ocultadas. Os dois uniformes claros seguem pendentes de variante/contraste aprovado.

Regeração com os arquivos gratuitos de origem já disponíveis localmente (o diretório legado `scripts/animation-lab/assets` é externo ao checkout de publicação):

```sh
node scripts/cartoon-football/prepare-keeper-candidates.mjs /tmp/cmu-34_01.bvh
node --import ./scripts/cartoon-football/node-ts-resolve.mjs scripts/cartoon-football/build-keeper-trial.mjs
```

O BVH esperado tem SHA-256 `0f6054784bb483a0e17b42c79fbe4f717c9b779688bc687ea30f06950f2d89e0`; espelho `una-dinosauria/cmu-mocap`, revisão `09a07f54f3bbb58797325f009282d0b2048a2871`. Fonte UAL original: SHA-256 `69591853d817488edaa8fd9bf8fc1d821eaeaf789f8627b3cd23b41c4ed67997`. Regerar não promove automaticamente o arquivo de teste nem publica. O JSON compacto versionado é suficiente para execução; fontes maiores só são necessárias para reconstruí-lo.

```sh
node scripts/cartoon-football/test-keeper-reception.cjs
REVIEW_VARIANT=depois node scripts/cartoon-football/record-possession-review.cjs
MATCH_AUDIT_HZ=30 WHOLE_AUDIT_OUT=test-results/cartoon-football/posse-visual/validated-30hz node scripts/cartoon-football/audit-whole-match.cjs
MATCH_AUDIT_HZ=60 WHOLE_AUDIT_OUT=test-results/cartoon-football/posse-visual/validated-60hz node scripts/cartoon-football/audit-whole-match.cjs
node scripts/cartoon-football/report-possession.mjs
```

A varredura final passou em 2.821/5.641 quadros: zero conflitos de cabeças, penetração pé–bola, piso inválido, raiz fora do orçamento ou trancos extras fora dos reinícios oficiais. 48 contatos revisados continuam válidos. Recepção: diferença entre bola e ponto de pega desenhado 4,4 mm; reposição a 1,41 m, pausa estável. Não chamar essas métricas de futebol perfeito. Recuperação anterior `recovery/antes-posse-visual-20261024` em `bf10f711`.

## Passe de costas e pega pelas mãos — correção após revisão do Diego

O passe Abedi Pelé→Danny McGrain (23,7 s) estava na lista `rejected`: o corpo continuava correndo e ficava 155,1° contrário à saída; não havia clipe nem controlador nesse lance. O antigo relatório de 48 contatos o excluía, portanto não comprovava a correção de todos os passes. Agora esse passe reutiliza o clipe adquirido `soccer`, ajustado ao contato/orientação reais, sem alterar bola, evento, esqueleto ou resultado. Corpo antecipa a intenção, mantém orientação no impacto e recupera na direção corrente do deslocamento. Removido o limite que recolocava o alvo só 18° à frente da direção de corrida a cada quadro e impedia acumular a rotação necessária.

Os demais lances rejeitados continuam no diagnóstico/controlador de intenção, explicitamente `supported:false`, sem animação/contato aprovados ou liberdade de emitir impulso. A pega/reposição especial do goleiro usa sua própria camada; não fingir chute para esse evento. `audit-action-coverage.cjs` cruza TODOS os 59 eventos oficiais de passe/enfiada/cruzamento/chute com os planos, incluindo ausências. Isso não transforma os nove lances ainda sem captura de pé em movimentos aprovados.

O goleiro anterior pegava visualmente junto ao peito: um centro entre punhos não era validação suficiente. Pega substituída pela recepção alta CMU **33_02**, 2,25–2,95 s, com mãos mais altas; CMU **34_01** fica só no lançamento 5,15–6,2 s. Mesma licença comercial. Bola tangencia as superfícies reais das mãos; passagem para a mão de lançamento contorna o punho e a mão livre se afasta por IK limitado, em vez de a bola atravessá-la. Salto extra cai de ~37,6 para ~10,5 cm. Mantém duas mãos por 80 ms até iniciar a reposição; isso respeita `encaixa`→`passe` já existentes, sem inventar rebote. Não comprova outras defesas.

O teste de goleiro agora exige contato/folga das superfícies de ambas as mãos, separação da cabeça e verificação durante todo o intervalo de retenção. Testes do passe incluem orientação, contato e cobertura, além de revisar a sequência renderizada. **Ainda há deslizamento do apoio no passe em velocidade alta**: a busca de 990 combinações não encontrou uma captura com orçamento menor e corpo/apoio corretos; tentativas de root motion/foot locking pioraram a transição e foram descartadas. Não apresentar o novo passe como apoio perfeitamente plantado. Novo clipe não foi criado do zero.

Evidências locais em `test-results/cartoon-football/passe-pega/`: passe e pega normal/lenta, imagens reais, auditoria de cobertura e partida completa. Recuperação `recovery/antes-passe-e-pega-20261024` em `2cedd6ce`. Fontes de reconstrução (arquivos locais gratuitos) agora:

```sh
node scripts/cartoon-football/prepare-keeper-candidates.mjs /tmp/cmu-34_01.bvh /tmp/cmu-33_02.bvh
node --import ./scripts/cartoon-football/node-ts-resolve.mjs scripts/cartoon-football/build-keeper-trial.mjs
node --import ./scripts/cartoon-football/node-ts-resolve.mjs scripts/cartoon-football/fit-abedi-pass.mjs
node scripts/cartoon-football/audit-action-coverage.cjs
node scripts/cartoon-football/test-keeper-reception.cjs
node scripts/cartoon-football/record-pass-catch.cjs
```

Hash CMU 33_02: `a8ee7cfa4c676248cf4b59d3be52b78d42842fe89f2c5784b53b658b2ea0aa83`, mesmo espelho/revisão registrados na seção anterior. Não comprar, usar conta externa, alterar save/rodada nem publicar nesta correção.
