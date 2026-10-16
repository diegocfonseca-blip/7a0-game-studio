# Futebol — continuidade das jogadas, 16/10/2026

Continuação do pedido “Siga” depois da
[auditoria do motor](presidencia-futebol-revisao-20261016.md). Trabalho local
na branch `fix/presidencia-revisao-motor-20261015`, preservando a sala 3D e as
alterações anteriores. A prévia continua limitada à conta verificada
`diego.c.fonseca@gmail.com`. Nenhum commit, publicação ou escrita na conta real.

## Objetivo desta continuação

Substituir os lances oficiais em que o autor e o assistente ficavam parados
por uma sequência visível: preparação, recepção, passe, condução e chute.
O resultado e a autoria continuam vindo da competição. O campo não cria um
segundo placar, uma segunda estatística ou um novo sorteio.

## Organização da apresentação

- `presidencia-lance-sequencia.ts` planeja os movimentos de bola, 22 jogadores
  e árbitro juntos. Calcula em passos de 60 Hz e guarda poses compactas em
  30 Hz, além das fronteiras das fases. Identidades ficam guardadas uma vez.
- O plano é temporário, compartilhado pelas câmeras e pelo placar. Não é
  salvo na carreira nem enviado ao banco. Aproximar a câmera não recalcula
  outro passe, outro gol ou outra movimentação.
- As fases são `prepare`, `receive`, `pass`, `carry`, `shoot` e `impact`.
  `shotStartMs` marca o chute; `durationMs` marca o impacto que autoriza a
  confirmação do resultado já existente.
- A narração privada acompanha essas fases e anuncia o desfecho no impacto.
  A miniatura do placar aguarda o chute enquanto a preparação acontece no
  estádio. Pausa e velocidades continuam usando o relógio compartilhado.
- Planos anteriores sem sequência continuam compatíveis. A ocorrência de
  fallback precisa ser medida nos testes, sem descrever esses casos como
  movimento completo.

## Finalizações e contato

`presidencia-futebol-finalizacao.ts` escolhe alvos determinísticos pelo ID do
incidente: gols em posições e alturas diferentes, erros pelos dois lados,
bolas por cima, poste esquerdo/direito e travessão. O contato considera bola
de raio 11 cm, tubos de raio 6 cm e baliza de 7,32 × 2,44 m. O primeiro rebote
usa a normal da superfície; depois há queda e quiques amortecidos. O gol
continua no local correspondente da rede, sem voltar ao centro.

O rebote de poste/travessão continua depois de o placar encerrar o evento,
até alguém alcançar a bola ou ela sair. Amostras atrasadas também usam a
continuação da trajetória, evitando um salto ao retornar à tela. Escanteios
de espalmadas usam o lado por onde a bola efetivamente saiu.

Chutes para fora/por cima recebem uma cauda horizontal amortecida dentro da
área alcançável da reposição, sem clamp ou teletransporte. Isso corrige bolas
que terminavam a 68 m do centro enquanto o recuperador só alcançava 55 m.
**Essa cauda é uma simplificação de apresentação, inclusive no ar**, não uma
simulação realista de resistência do ar ou uma colisão com barreira física.
Queda e pequenos quiques continuam calculados. Barreira/gandula com colisões
e retorno físico completo ficam como trabalho posterior.

`conduzirBola3D` usa as duas chuteiras realmente desenhadas para manter a bola
no chão à frente dos pés, com a posição anterior para suavizar mudanças de
apoio. A entrada e a saída da passada têm mistura gradual, e uma correção
local trata as poses entre os quadros armazenados. Isso resolve uma
interpenetração que a trajetória antiga pelo eixo do corpo permitia. Chute
e luvas preservam os contatos existentes.

A condução natural entre os eventos também foi corrigida: o portador gira
antes de avançar, acompanha a direção do corpo e acelera/freia gradualmente.
O primeiro quadro da recepção já considera o volume das chuteiras. Isso
removeu uma deriva de até 1,13 m que a suavização permitia nas curvas.

Esses mecanismos são apresentação guiada com geometria e trajetórias
calculadas. Não equivalem a um motor completo de física livre: resultado,
posse e eventos oficiais não são decididos pelas colisões da bola.

## Bola visível nas duas câmeras

`presidencia-bola-3d.ts` substitui a esfera branca com um wireframe plano que
ficava quase todo escondido dentro dela. O mesmo modelo agora desenha 12
pentágonos pretos, 20 hexágonos brancos e costuras na superfície esférica.
Raio de 11 cm, uma geometria/material, 1.440 triângulos, sem textura externa.
É usado pelo campo integrado e pela vista 3D alternativa. O teste verifica
superfície fechada, painéis, normais, raio e descarte independente.

## Validação

O vídeo revelou que o último passe podia atravessar quadril/shorts do
recebedor. A malha real confirmou até 9,51 cm de interseção, embora os testes
de chuteira passassem. A recepção foi corrigida: o jogador freia e gira para
o passador ainda durante o voo, recebendo a bola pela frente. A nova regressão
passou em 832 medições de tronco/shorts na malha real, sem penetração. O caso
visual ficou com folga mínima de 46,46 cm até o shorts, com a bola chegando
baixa. Evidência anterior preservada em `recepcao-corpo-antes-20261016.json`;
resultado posterior em `jogada-continua-20261016.json`, seção `visualReception`.

- Finalizações puras: 11.520 planos e 1.152.000 amostras passaram nos dois
  sentidos, com velocidade máxima de 28 m/s, alvos e contato com a baliza.
- Condução isolada: 8.640 quadros e 5.768 interpolações de 30 para 240 Hz,
  sem penetração nas chuteiras na amostra; bola até 16,63 m/s. Também passaram
  64 casos com a esfera inicialmente dentro da chuteira. São testes do
  helper; a sequência integrada tem validação independente.
- Regressão do rig: 400 poses, 47.880 apoios, 72 chutes e 216 contatos das
  luvas passaram após a mistura gradual da passada.
- Jogo natural: 36.000 quadros (300 segundos em cada tempo), 4.862 domínios e
  134 primeiras recepções. Alcance máximo corpo–bola de 0,686565 m, nenhuma
  penetração medida e velocidade da bola até 25,17 m/s.
- Os limites antigos de 0,65/0,66 m mediam somente a distância ao eixo do
  corpo. A sola avançada mais o raio da bola exigem cerca de 0,688 m. O limite
  passou para 0,75 m, acompanhado do teste das caixas reais das chuteiras;
  a deriva de 1,13 m foi corrigida no produto, sem ser aceita pelo teste.
- No teste da mudança de direção, a bola atingiu 13,098 m/s, com alcance e
  chuteiras válidos. O limite antigo de 12 m/s passou para 18 m/s, coerente
  com os 16,63 m/s do helper medido. O alcance e o teste geométrico continuam
  independentes desse limite de velocidade.
- Sequência independente: 14 origens, 9.745 quadros, 4.326 verificações de
  contato, 84 verificações de relógio e duas integrações por ID. Bola até
  27,986 m/s, atletas até 5,40006 m/s; separação mínima de 0,764 m e residual
  numérico de penetração inferior a 0,001 mm. Nove casos após o evento cobrem
  rebotes/retorno atrasado e o escanteio do lado negativo.
- Dez snapshots do jogo natural produziram sequência em 10/10 casos. Isso
  não prova ausência universal de fallback. Planejamento local medido em
  47–104 ms, com 368–681 KB de payload numérico estimado por plano; não são
  medições de heap nem de desempenho em aparelho móvel.
- Regressão integrada: 51.926 quadros e dez reposições completas, entre
  3,35 e 22,87 segundos físicos, sem salto ao remover o evento. O retorno
  usa desvios sem sobreposição e mantém os adversários fora dos 9,15 m na
  saída de bola. Também passaram 40 cenários/27.102 quadros de lances,
  laterais e a integração 3D com 136 quadros, bancos, técnicos e árbitro.
- Navegador: fases, movimento de autor/assistente, narração, miniatura
  aguardando o chute e confirmação única passaram. Também passaram seis
  velocidades, os quatro desfechos, pausa e identidades homônimas por ID.
  Fila com dois gols no mesmo minuto, nova rodada e apito final também passaram.
- Build final `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`: PASS.
  Permanecem os avisos de bundle grande e imports dinâmicos que também têm
  caminhos estáticos; não são prova de fluidez no celular.
- Navegador 3D: 40 capturas em 1200/390 px após a correção da recepção,
  na várzea e no estádio completo,
  quatro desfechos, apoio, escala, contatos e raio real da bola passaram.
  Nenhum erro de página ou textura; hashes das fontes permaneceram estáveis.
  Clipe de diagnóstico amostrado a 12 fps, em tempo 1×,
  acompanha domínio, condução e chute. Essa taxa foi usada para gerar o
  arquivo; não mede a fluidez de um aparelho real.

A cena de diagnóstico usa os construtores reais de campo/estádio e omite
bairro e torcida. O solo neutro em volta não representa o mapa de produção.
Ela está em `qa-presidencia-futebol-continuo-20261016.html`, com resultados
em `test-results/futebol-continuo-20261016/visual.json` e vídeo
`jogada-assistida-1x.mp4` na mesma pasta. As imagens com a bola branca antiga
foram preservadas em `diagnostico-bola-anterior/` para comparação.
As capturas anteriores ao giro de recepção foram preservadas em
`diagnostico-recepcao-anterior/`. As duas vistas complementares do passe
usam uma câmera de teste pelo lado oposto para evitar que um defensor
oculte o contato; essa oclusão era correta no modelo 3D. Essa câmera não
altera a câmera do produto.

Evidências: `test-results/futebol-3d/jogada-continua-20261016.json`,
`motor-real-20261016.json`, `revisao-lances.json`,
`eventos-browser-20261016.json` e logs `continuidade-*.log` na mesma pasta.

## Limites que continuam

- Ainda faltam cabeceios/voleios ligados aos cruzamentos, faltas, impedimentos,
  cartões/expulsões e jogadas ensaiadas completas.
- A corrida ainda usa um ciclo simplificado de 1,4 m e a cadência rápida
  precisa de melhoria. A entrada/saída da passada foi suavizada, mas isso
  não equivale a captura de movimento humano.
- O acabamento continua estilizado: chuteiras retangulares e articulações
  segmentadas. As capturas confirmam apoio e escala, não fidelidade completa
  à arte desejada. A textura de grama e as animações precisam de refinamento.
- Defesas continuam baseadas no evento oficial; a simulação não decide o
  resultado pelo alcance físico do goleiro.
- Atrito/efeito da bola, clima e diferenças físicas de terra/grama não foram
  implementados como um sistema geral.
- O calendário da competição é comprimido. Sequências mais longas expõem a
  necessidade de acomodar a preparação e as reposições nesse calendário.
- Testes locais e toque emulado não comprovam fluidez em um celular físico.
  As capturas usam escalações de fixture e os construtores reais do jogo.
