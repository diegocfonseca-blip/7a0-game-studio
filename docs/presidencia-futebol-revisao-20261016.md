# Futebol no estádio — revisão de 16/10/2026

Este documento registra a auditoria anterior à continuação de “Siga”. As
mudanças posteriores de movimento durante os lances, contato e variedade de
finalizações estão em [jogadas contínuas](presidencia-jogadas-continuas-20261016.md).
Consultar esse registro para o estado atual, preservando aqui as medições
e limitações identificadas na auditoria original.

Pedido atual de Diego: analisar a bola, jogadores, passes, lançamentos,
cruzamentos, domínio, drible, corrida, gols, finalizações perdidas e jogadas
do futebol real. A integração da sala 3D iniciada antes desse pedido foi
preservada. Trabalho local na branch `fix/presidencia-revisao-motor-20261015`,
após o deploy de `2aa90a0d`. **Esta revisão não foi publicada.** O acesso de
produção continua limitado à conta verificada `diego.c.fonseca@gmail.com`.

## Conclusão

O estádio tem jogadores e bola em geometria 3D, na mesma escala do gramado.
O motor ainda **não é uma simulação completa de futebol**: a competição
decide seus gols e autores; o campo apresenta esses eventos e mantém uma
circulação entre eles. Corrigir essa apresentação é necessário, mas não
equivale a implementar faltas, impedimento, disputas aéreas ou física completa.

Na análise foram reproduzidos defeitos reais: saltos da bola nas reposições,
apoio dos pés deslizando, chute sem o mesmo contato geométrico da bola,
calendário de chances alterado pela velocidade, narração antecipando desfechos,
defesas enviesadas pelo lado, homônimos e planejamento errado no intervalo.

## Correções desta rodada

- **Reposições:** a bola visível permanece no local onde terminou o lance.
  O cobrador busca, recolhe, transporta e coloca a bola no ponto da cobrança.
  O rebote da trave permanece em jogo. A bola alta cai antes da busca.
- **Circulação:** apoio pelos lados, cruzamento espontâneo e mudança de
  direção diante do marcador. A condução evasiva mantém a posse e não inventa
  uma estatística de drible. Separação impede novos passos através do centro
  de outro atleta ou do árbitro.
- **Corpo e bola:** o apoio da chuteira é calculado pela posição do pé; o
  tornozelo compensa as articulações. Chute e assistência usam o ponto de
  contato medido no mesmo corpo que é desenhado. As mãos usam o mesmo
  princípio nas defesas, laterais e transporte da bola.
- **Linha do gol:** planejamento, chute e confirmação usam o mesmo ponto,
  centro da bola em 52,61 m para a linha em 52,5 m e raio de 0,11 m. O gol
  confirma quando a bola inteira cruza a linha; a bola continua na rede com
  desaceleração, sem o ajuste abrupto de 0,41 m da versão anterior.
- **Velocidade:** o calendário privado de chances é fixado por partida a
  partir da duração-base. Trocar 0,25×/0,5×/1×/2×/4×/8× altera a reprodução,
  sem sortear novas chances ou apagar as anteriores.
- **Narração:** a chance começa com preparação e só anuncia seu desfecho no
  impacto do relógio compartilhado. Na prévia 3D, gol e assistência descrevem
  apenas ações presentes no plano; a rádio não anuncia cartões, faltas ou
  cabeçadas que o motor não executou. O acervo da apresentação pública foi
  preservado. Isso evita contradição; ainda não cria as ações ausentes.
- **Identidade:** os IDs já existentes de autor e assistente atravessam os
  contratos da liga e da Copa. O motor prefere o ID ao nome. Um plano existente
  também fixa os participantes até o início do lance. A Copa passa a guardar
  o ID do assistente já escolhido na origem, sem novo sorteio.
- **Troca de acesso:** perder ou recuperar o acesso à prévia cancela os
  relógios e limpa a apresentação anterior. Um gol ainda não confirmado pode
  reiniciar no modo atual; gols confirmados continuam contados. Antes, a perda
  de acesso cancelava o relógio, mas deixava o placar esperando um voo parado.
- **Intervalo:** o planejamento usa a escalação e o sentido do minuto do
  incidente, inclusive gol de 45′ ainda apresentado com o relógio em 46′.
  A reconciliação é local e não rebobina a câmera compartilhada.
- **Defesa:** a decisão entre segurar e espalmar usa o ID inteiro. Antes,
  o último dígito fazia toda chance do mandante terminar em espalmada e toda
  chance do visitante terminar em bola segurada.

Não houve escrita na conta real nem alteração de placares, RNG da competição,
moedas, compras, estatísticas ou do fluxo manual de pênaltis. Saves existentes
sem IDs continuam usando a compatibilidade por nome. Os números abaixo medem a
apresentação local, não partidas reais da conta do Diego.

## Cobertura e lacunas, lance por lance

| Pedido | Existe agora | Ainda falta |
| --- | --- | --- |
| Escala jogador/bola/campo | Campo 105 × 68 m, adulto parado ≈1,81 m, bola com diâmetro 22 cm | Variação individual de estatura e composição corporal |
| Andar e correr | Passada por distância percorrida, apoio no solo e retorno do pé | Cadência de corrida rápida, curvas e aceleração com fase contínua; não é movimento capturado |
| Domínio | Recepção amortecida por interpolação até a posse | Peito, coxa, cabeça, bola escapando por erro técnico e decisão conforme pressão |
| Drible | Condução muda de faixa para contornar marcação próxima | Caneta, pedalada, corte, disputa e resultado de cada ação |
| Passe curto | Destino em companheiro, linha de passe e interceptação por proximidade | Força/efeito e disputa física contínua do contato |
| Passe longo / lançamento | Arco aéreo e recepção pelo destinatário | Queda e quique físicos, corrida antecipada e recepções variadas |
| Cruzamento | Trajetória lateral aérea; ocorre também na circulação natural | Cabeceio/voleio e finalização ligada ao mesmo cruzamento |
| Gol / assistência | Participantes reais e tempo compartilhado com o placar | Aproximação do finalizador em movimento; hoje autor/assistente ficam parados durante o plano oficial |
| Chute para fora | Bola passa ao lado do gol, seguida de recuperação e tiro de meta | Alvos variados; atualmente usa o mesmo lado lateral do gol |
| Chute por cima | Bola elevada sai acima da baliza e é recuperada | Aerodinâmica, quique e colisões completas |
| Chute na trave | Contato/rebote apresentado no poste e bola continua em jogo | Travessão e outros pontos de contato; o desfecho ainda vem do evento |
| Defesa | Segura ou espalma, mãos correspondentes e distribuição / escanteio | Decisão física do alcance, defesa com os pés e outras técnicas |
| Lateral | Busca, preparo, mãos, soltura e destinatário | Mais variações táticas e disputa da segunda bola |
| Escanteio | Recuperação, cobrança aérea e recepção | Curto, ensaiado, disputa aérea; algumas origens ainda são heurísticas |
| Tiro de meta | Busca, posicionamento e passe aéreo | Organização tática de saída e pressão coordenada |
| Saída após gol | Mesmo resultado, bola recuperada e adversário repõe | Ajustar ritmo da competição comprimida para caber a sequência completa |
| Tabela / jogada ensaiada | Ainda não é uma ação tipada | Sequência completa de participantes, movimentos, contatos e desfecho |
| Faltas / vantagem / barreira | Ainda não implementadas como incidentes do campo | Detecção/registro, posicionamento, gesto e cobrança |
| Impedimento / cartões / expulsões | Ainda não implementados | Autoridade comum e escalações variáveis; hoje há exigência de 11 por lado |
| Árbitro / técnicos / reservas | Corpos presentes; árbitro acompanha a bola | Arbitragem e substituição física completa |
| Condições da bola / piso | Terra e grama mudam visualmente | Velocidade e rotação físicas, atrito, restituição, vento/chuva e influência do piso |

A bola ainda usa segmentos interpolados e arcos. Rotação visual não é um
estado físico que determine efeito. Colisão da rede e obstáculos não é uma
simulação completa. Alvos dos gols ainda têm pouca variedade. **Não descrever
essas limitações como concluídas porque um teste de continuidade passou.**

## Medições

- Novo teste do motor: 44.655 quadros, dez recuperações pós-incidente,
  homônimos, intervalo e 180 IDs reais de chance. Salto inicial nas dez
  reposições: **0 m**.
- Duas amostras de cinco minutos de circulação: primeiro tempo com 38 passes,
  20 lançamentos e seis cruzamentos; segundo tempo com 37, 15 e sete,
  respectivamente. Escanteios/laterais são contados separadamente. Isso é
  cobertura funcional, não uma distribuição estatística validada de futebol.
- Nessas amostras: bola até 19,504 m/s; atleta até 5,8 m/s; centros dos corpos
  separados por pelo menos 0,6402 m. Não extrapolar os limites para toda
  combinação possível de eventos ou contatos geométricos dos membros.
- Defesas: mandante 45 espalmadas / 45 seguradas; visitante 44 / 46 na amostra
  de IDs. Os resultados oficiais de cada chance permanecem “defendeu”.
- Recuperação depois de gol leva aproximadamente 20 segundos de simulação;
  em 0,25×, cerca de 80 segundos reais. Isso respeita o transporte visível,
  mas expõe a diferença entre futebol contínuo e o calendário comprimido.
  Um novo lance oficial ainda pode interromper a recuperação.

- Rig final: 47.880 amostras de apoio em avanço reto, 72 direções de contato
  da chuteira, 216 contatos das luvas e 400 poses anteriores. Ciclo espacial
  de 1,4 m preservado; a cadência rápida continua simplificada. Seis capturas
  locais em `atleta-20261016-*.png`; não são captura de movimento humano.
- Lances oficiais: 40 cenários, 8.356 quadros, incluindo 400 ms depois do
  impacto. Maior velocidade amostrada: 28,299 m/s. Testes nos dois sentidos
  comparam 1 ms antes/depois e a troca de fase no mesmo instante da confirmação.
- Navegador com o `LiveScoreCard` real: PASS nas seis velocidades e quatro
  desfechos, calendário estável, narração só no impacto, pausa da bola/corpos/
  miniatura, retomada em 4×, homônimos por IDs e assistência efetiva. Zero
  erros de página. `eventos-browser-20261016.json` e respectivo log.
- Regressão do placar real: PASS para duração por distância, pausa, miniatura,
  troca de 0,25× para 4×, gols no mesmo minuto, nova rodada e apito final.
  As fontes dos testes públicos de chances e rádio também passaram, executadas
  diretamente com Node 24; os atalhos npm dependentes de `npx tsx` não foram
  usados como evidência de sucesso neste ambiente restrito.
- Transição de acesso durante gol e chance: PASS. Perder a prévia cancela
  seus callbacks; o gol termina uma vez no modo público. Retornar antes ou
  depois do impacto preserva a contagem e permite o próximo lance.
  Relatório `gate-browser-20261016.json`, sem erros de página.
- Complemento assíncrono: PASS para gol/chance com a Promise da importação
  atrasada pela interceptação local. A perda de acesso impede iniciar o
  relógio antigo. O motor já estava carregado; isso testa o cancelamento da
  Promise, não uma conexão lenta real. `gate-browser-pending-20261016.json`.
- Copa real: 77 assistências com ID correspondente à escalação, nenhuma
  autoassistência, duas execuções idênticas e tabelas de origem preservadas,
  no mesmo relatório complementar.
- Compilação final de produção: PASS, incluindo a sala e a correção da fachada.
  Permanecem avisos de tamanho dos pacotes e importações dinâmicas que não
  dividem módulos já importados estaticamente. Log em
  `test-results/complexo-3d/revisao-20261016-build-final.log`.

Relatórios em `test-results/futebol-3d/`. Os testes de navegador usam identidade
simulada e rede externa bloqueada. Não comprovam login real, persistência em
nuvem, fluidez em celular físico ou realismo de todos os acontecimentos.

## Próximo fundamento necessário

Um registro único deve descrever cada incidente por ID, participantes,
origem, destino, fases e contatos. Bola, corpos, narração e placar precisam
consumir esse registro. Em seguida, implementar recepção e aproximação em
movimento, sequências de passes/cruzamentos/finalizações, disputas aéreas,
faltas e impedimentos. A competição continua sendo a autoridade do resultado;
a apresentação não deve decidir um segundo gol ou uma segunda cobrança manual.
