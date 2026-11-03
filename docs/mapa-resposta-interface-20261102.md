# Resposta aos comandos do mapa — 02/11/2026

Base publicada: `45fcaa3c`. Correção reversível de apresentação; acesso continua na conta de prévia existente. Sem alteração de banco, motor oficial, atributos ou eventos.

## Diagnóstico medido

Bancada de leitura com cópia local do save Neymarzetti e rodada 4. Chromium com viewport 390×844. Perfil de CPU com desenho desativado para separar JavaScript de GPU; cenário de interação com CPU limitada a 4×. Não são FPS nem latências medidos em celular físico. Cada caso usa seis cliques; números são amostras locais, não garantia de desempenho.

| Medida | Antes | Depois |
| --- | ---: | ---: |
| CPU amostrada consultando piso na preparação do dia de jogo | 10.626 ms | 154 ms |
| CPU amostrada criando o dia de jogo | 10.698 ms | 275 ms |
| Espera média do clique, partida pausada | 40,0 ms | 5,5 ms |
| Espera média do clique, apresentação em andamento | 33,6 ms | 5,5 ms |
| Diagnóstico completo dos jogadores durante cada caso | 860 / 740 chamadas | 0 chamadas |

## Correções

- Os trajetos dos ambulantes agora usam o acelerador BVH estático já existente, antes da primeira consulta. Índices, superfícies e rotas permanecem iguais.
- Comandos de navegação solicitam um desenho no próximo RAF. Não executam a atualização da cidade e o renderizador dentro do clique. Pedidos simultâneos compartilham o quadro pendente.
- A câmera, torcida e equipe de apoio leem o quadro visual leve. Relatórios extensos dos atletas só são montados em uma chamada explícita de inspeção; continuam disponíveis para QA.
- No celular, o canvas começa em até DPR 1,5 e 900 mil pixels; aparelhos com indicação de até 2 GB usam até DPR 1,25 e 600 mil pixels. Desktop preserva seu orçamento. Textos e botões HTML continuam na resolução da tela. Em um celular DPR 3 dentro do limite de área, 1,5 desenha 64% menos pixels que 2,5.
- Apresentação limitada a 30 desenhos/s no celular e 60 no desktop. O relógio decorativo usa todo o tempo decorrido entre desenhos; o relógio oficial permanece independente. Comandos de mapa pausado garantem um desenho pendente, mesmo quando chegam antes do próximo intervalo. A continuação após o fim mantém 60 como teto porque o código antigo desse trecho ainda contabiliza quadros.

## Validação

- Piso acelerado comparado ao raycast nativo em 16 pontos da cena real: erro máximo zero.
- WebGL real: zoom com passeio pausado, retorno ao campo e lateral fixa; nenhum desenho executado dentro dos handlers de clique. Id, tempo e eventos preservados.
- Limite de apresentação, clocks e retomada verificados em cadências de 30/60/120 Hz. As contagens WebGL da bancada de software verificam o teto, não uma taxa mínima de FPS.
- Rotas de entrega: 144 mil amostras, quatro peruas, isopor a pé, carga antes da montagem e desmontagem antes da saída.
- Câmeras existentes, limites de qualidade e textura preservados; 22 jogadores disponíveis.
- Fingerprint oficial: `23599bdba04b0c7c2639389e2509f4d81a34796083f78b6a5d81e97c0d22bbbd`.

Evidências locais: `test-results/performance-interface/`. A redução de resolução pode suavizar detalhes da cena; não altera geometrias, NPCs, posição dos jogadores ou física. A validação final de fluidez precisa do aparelho do usuário.
