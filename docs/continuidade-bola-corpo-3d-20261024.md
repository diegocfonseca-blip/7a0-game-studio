# Bola e continuidade corporal — 24/10/2026

Diego mantém a arte Civis NO FACE aprovada e continua reprovando a naturalidade do futebol. Esta entrega corrige problemas comprovados; não aprova a simulação como equivalente a FIFA/PES.

## Diagnóstico e correções

- A condução oficial prende a bola 75 cm à frente do atleta. A adaptação visual existente aproxima o corpo e faz uma pequena correção na bola. Isso continua sendo uma adaptação provisória, sem captura própria de domínio/condução. Motor2 não foi alterado.
- A rolagem multiplicava duas rotações acumuladas (fonte e correção). Essa operação não equivale a integrar a trajetória visível quando o eixo muda. `VisibleBallRoll` integra cada deslocamento final no chão, preserva o incremento da rotação oficial em voo e mantém pausa/seek/reinícios explícitos.
- A aproximação da bola à chuteira mudava a velocidade da correção imediatamente ao trocar o pé mais próximo. `ContactOffset` mantém velocidade, limita aceleração a 18 m/s² e velocidade a 1,8 m/s, com teto de 32 cm. A correção desaparece suavemente antes do impacto oficial. O estado interno também é zerado no contato: não pode reaparecer após a troca do receptor.
- A continuação do passe recebia uma rotação para o deslocamento e outra pelo blending da captura. Foram removidas a dupla recuperação e as trocas de arco no meio do gesto. Aproximação e recuperação escolhem arcos contínuos; a troca ocorre no contato, quando o peso da captura é integral.
- A correção residual de intenção no tronco/cabeça saltava de um limite angular para o oposto na preparação. Agora é amortecida, preservando a orientação medida no impacto.
- A recuperação do goleiro parte da orientação corporal efetivamente exibida após a reposição. A pega/retenção/lançamento existentes continuam com as mãos medidas na malha.

Foi testada e descartada uma redução geral da velocidade de giro da corrida: aumentou passos de costas ao seguir a trajetória oficial. Também foi descartado realimentar a orientação de todas as capturas no controlador de corrida: introduzia revoluções durante algumas recuperações. Não fazem parte da entrega.

## Evidência

Base comparada: commit `9eb2b34e`. Mesmo replay exportado Rei da Bola FC × Neymarzetti, 1×1, 82 eventos. Nenhuma rodada avançada e nenhuma escrita no save/banco.

Auditoria de continuidade em 2.821 quadros a 30 Hz:

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Erro de rolagem >10° por quadro, no chão, fora da apresentação de gol | 822 | 0 |
| Saltos angulares do suporte do avatar >30 rad/s | 10 | 0 |
| Maior mudança angular do suporte por quadro | 153,30° | 48,92° |
| Amostras acima de 720°/s, incluindo mudanças rápidas da trajetória oficial | 957 | 942 |

Essas medições não certificam naturalidade. O suporte do avatar não é a orientação completa de todos os ossos. `bodyHeading` foi acrescentado à auditoria para medir também o tronco; os giros ainda rápidos permanecem pendentes.

Varredura completa final: nenhuma penetração pé–bola, pé abaixo do piso, excesso da margem de raiz, falso toque ou salto extra em jogo corrido. Permanecem os três reposicionamentos oficiais de reinício e uma proximidade conservadora entre volumes de cabelo. Indicadores de direção contrária: 32 amostras totais, mesmo total anterior; o relatório inclui reposicionamentos oficiais e não representa 32 passes de costas.

O diagnóstico de bola distante mais de 22 cm da chuteira aumentou de 211 para 228 amostras. A suavização reduz puxões, mas não resolve o domínio; não declarar aprovado por a bola chegar ao destino. Posse antecipada, preparação e recepção também entram nesse indicador.

Testes de contatos em três entradas locais: 52/44/36 contatos, mesmos placares 1×1, 1×0 e 2×0 e mesmos 82/77/72 eventos. Duas entradas são variantes locais de QA, não rodadas reais. Paridade independente: 941 quadros, 20.702 posições, erro zero. Teste de goleiro manteve contato de ambas as mãos, sem atravessar a cabeça e sem soltura antecipada. Testes de rolagem curva, pausa, voo, seek, aceleração limitada, troca de arco e liberação da correção também passaram.

Evidências locais:

- `test-results/cartoon-football/continuidade/before.json` e `release.json`.
- `test-results/cartoon-football/continuidade/release-whole/whole-match.json`.
- `test-results/cartoon-football/continuidade/video/antes-normal.mp4` e `depois-normal.mp4`.
- `test-results/cartoon-football/continuidade/video/antes-lenta.mp4` e `depois-lenta.mp4`.

Os vídeos são trechos reais nas mesmas câmeras, não uma nova partida, nem a gravação contínua dos 94 s. O campo de terra corresponde ao estágio do clube no save exportado. 30 fps é a taxa da gravação; não foi medido desempenho em celular físico.

## Pendências prioritárias

Domínio e condução com movimentos próprios, transições que respeitem apoio/inércia, mudanças de direção sem marcha incompatível e variedade de goleiro. A fonte 2D determina trajetória/posse em passos discretos; ajustar apenas a aparência não elimina todas as descontinuidades dessa representação. Manter o replay oficial como autoridade e validar sequência completa, não apenas o instante do contato. Nenhuma anatomia, uniforme, cidade, estádio, resultado, overall, categoria, descanso ou premiação foi modificada.

Alterações isoladas e reversíveis no commit desta entrega. Publicação somente na prévia privada já autorizada, após checks e workflow verde; não confundir build local com deploy confirmado.
