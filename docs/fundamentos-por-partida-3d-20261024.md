# Fundamentos 3D por partida — 24/10/2026

Correção autorizada do futebol visual existente. Mantidos Civis NO FACE, malha, rig de 23 ossos, uniformes, estádio, cidade, câmeras e Motor2. Não houve escrita em banco/save nem avanço de rodada.

## Causa principal

As capturas de passe/chute estavam vinculadas ao hash de uma única entrada oficial. Uma carreira com outra partida recebia a locomoção nativa, mas não recebia aqueles contatos ajustados. O movimento dos atletas, por si só, não demonstrava que estavam passando ou chutando corretamente.

Também havia uma correção residual de colisão que encontrava uma pose sem penetração e afastava o pé 5–6 cm além do necessário. O diagnóstico de domínio era calculado antes dessa correção e podia marcar um toque que deixava de existir na malha final.

## Alterações

- `official-contact-source.mjs` lê a mesma entrada/seed pelo adaptador determinístico já existente e coleta contatos, vetores, identidades completas e pequenas janelas de trajetória. Não escolhe novos resultados, posse ou lances; a passagem adicional é somente leitura para preparar a apresentação.
- `contact-bank.mjs` amostra as capturas CMU já adquiridas/retargetadas para o rig Civil: 64 combinações de clipe, pé e marcador; 170 triângulos por chuteira. Ajusta orientação, aproximação e cadência pelo vetor/velocidade oficiais. Bola aérea exige superfície inferior e pé ascendente. Ajustes impossíveis são rejeitados.
- `runtime-motion.mjs` valida contato e dez amostras de preparação/continuação. Compartilha o resultado pelos 22 atletas e mantém cache de quatro entradas, identificado por SHA da entrada e motor. A preparação cede execução entre pequenos lotes; os modelos aparecem antes de terminar e o relógio não reinicia. A troca do plano espera o gesto anterior terminar. Falhas mantêm o replay e os modelos.
- Uma captura revisada anterior pode ser preservada somente quando o carregador confirma compatibilidade de entrada **e motor**, a identidade/tempo/tipo coincidem e a validação geométrica continua passando. Isso preserva o chute de Souza aos 14,1 s, que a busca genérica ainda não ajusta com segurança. A janela da pega/reposição revisada do goleiro é reservada: não recebe um chute concorrente no evento genérico de passe.
- A recepção considera passes rasteiros, lançamentos e cruzamentos alcançáveis. O primeiro toque só confirma controle visual se a chuteira final alcançar a bola. A atração visual é limitada, retorna à posição oficial antes do impacto e não muda posse, trajetória oficial ou eventos. A rolagem acompanha o deslocamento visual.
- A IK residual procura a menor correção válida entre a pose importada e a solução de colisão, mantendo os limites de 8 cm/0,35 rad e o piso.
- Cabeça acompanha a bola próxima com rotação limitada. Durante recepção, olha a bola que chega antes de comunicar a direção do passe. A continuação volta gradualmente à direção real de deslocamento.
- Goleiros de outras partidas recebem postura de espera provisória derivada de **Quaternius Universal Animation Library — Crouch_Idle_Loop, CC0**. Não é uma defesa CMU. `prepare-keeper-ready.mjs` extrai a origem existente e reamostra em 12 Hz: 89.631 bytes, erro angular máximo 0,066°. Não cria agarradas ou rebotes por conta própria.

## Escala

| Elemento | Medida mantida |
|---|---:|
| Campo | 105 × 68 m |
| Gol | 7,32 × 2,44 m |
| Jogador estilizado em pose neutra | 1,78 m |
| Bola | 22 cm de diâmetro |

O tamanho físico não foi aumentado para compensar a câmera distante. A cabeça caricata altera a percepção das proporções; o erro principal encontrado estava na interação, não no diâmetro da bola.

## Validação e reprodução

`test-runtime-matches.cjs` verifica três entradas no navegador, 22 modelos antes da preparação, escala, contato na malha final, eventos/placar completos e ausência de avanço/reinício enquanto prepara os clipes.

| Entrada | Contatos preparados/verificados | Placar/eventos oficiais |
|---|---:|---|
| Exportação de Rei da Bola FC × Neymarzetti | 52 | 1×1 / 82 |
| Variação local de QA, seed +1 | 44 | 1×0 / 77 |
| Variação local de QA, seed +29 | 36 | 2×0 / 72 |

As duas variações são testes locais derivados do elenco exportado; **não são rodadas avançadas nem novos resultados salvos na carreira do Diego**. Preparação observada em Chromium desktop: aproximadamente 3–4 segundos em segundo plano. Isso não mede desempenho de um celular físico.

Auditorias contínuas a 30 Hz percorrem 2.821 quadros por entrada. Nos três testes de aproximação adaptativa: zero penetrações pé–bola, zero violações de piso/orçamento de raiz, zero toques falsamente confirmados e zero erros JavaScript. Permanecem aproximações conservadoras de cabelo em duas partidas e uma correção brusca de posição fora das saídas em cada entrada; os relatórios também registram afastamentos durante condução/preparação. Não são aprovação universal da naturalidade.

Paridade independente com Motor2, testes de estados de ação, recepção e apresentação da bola foram executados. O build de produção deve passar antes do commit/publicação.

Evidências locais:

- `test-results/cartoon-football/generalizacao/browser-matches.json`: contatos e eventos de cada entrada.
- `generalizacao/adaptive-*-30/whole-match.json`: partidas inteiras; `generalizacao/final-save-30/whole-match.json` inclui o chute revisado preservado.
- `generalizacao/videos/`: mesmos lances antes/depois, câmera próxima/transmissão, MP4 H.264 normal e meia velocidade. Gerador: `record-runtime-football.cjs`.

O save exportado não tem obra de estádio cadastrada (`stadiums: {}`). Por isso as capturas preservam o **campo de terra da base**. Não foi aplicado um gramado de evolução que a carreira ainda não possui.

## Limites mantidos visíveis

Não é uma biblioteca completa de futebol nem uma aprovação de qualidade final. Domínio e condução ainda adaptam marcha/corrida e IK; faltam capturas próprias de amortecimento/proteção. Há ações sem ajuste seguro, inclusive o cruzamento de 12,35 s na partida original, laterais com mãos e cabeceios. Curva real, bicicleta, voleio e gestos específicos de desarme/goleiro não foram inventados. A organização e os deslocamentos continuam vindo da fonte 2D oficial; esta correção melhora a execução visual sem criar uma IA concorrente.

Publicar apenas na prévia privada já autorizada, preservando o bloqueio por conta e a atualização manual do cliente. Confirmar o workflow do SHA publicado antes de anunciar disponibilidade.
