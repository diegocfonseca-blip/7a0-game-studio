# Campo 3D do mapa — defesas e sincronização de contatos

Continuação autorizada da V4 (`4a8d4d82`). Recuperação local preservada em
`recovery/fundamentos-mapa-v4-4a8d4d82`. Modelo atual, malha, rig, uniformes,
cidade e estádio permanecem os mesmos. Não houve publicação nem escrita na conta.

## Causas reproduzidas

- A amostragem a 30 Hz podia pular o instante de impacto. O diagnóstico
  interpolava triângulos de duas poses, embora o movimento do esqueleto não
  fosse linear; 11 dos 64 contatos ficavam fora da tolerância na V4.
- O tempo de contato herdado dos pés era inadequado para luvas. Uma defesa
  alta tocava a fase de queda; um encaixe na altura do peito usava coleta baixa.
- Um ajuste de mão sem interseção encontrada era tratado como válido. O espaço
  vazio entre as mãos podia prender a bola, mesmo sem contato com a malha.
- A troca de mão durante o lançamento interpolava âncoras distantes e deixava
  a bola no ar. Reposições muito rápidas também soltavam da posição ideal da
  mão, sem considerar a rotação corporal que ainda estava terminando.
- A curva suavizada da bola continuava usando pontos anteriores à espalmada.
  A velocidade já tinha mudado, mas o desenho ainda atravessava o corpo por
  um ou dois quadros. Aferir apenas o quadro de contato não detectava isso.

## Correções

`map-contact-clock.mjs` subdivide somente a apresentação nos instantes de
contato que caem entre quadros. Usa a trajetória oficial previamente preparada;
não avança o motor, não atrasa o cronômetro e não cria eventos. Pausa, busca no
replay e mudança de câmera mantêm suas regras. Fases, reposicionamentos e
mergulhos entram nessa amostragem canônica.

Defesas oficiais entram na agenda do personagem. A captura existente é
selecionada e amostrada pela altura/lado do contato. O salto alto admite ajuste
vertical limitado sobre o voo capturado; não muda ossos nem proporções. Encaixe
e mudança para posse nas mãos são deduplicados. Espalmada permanece bola livre.

O encaixe exige contato da superfície deformada da luva com a esfera. A bola
segura fica na mão usada pela reposição; a mão auxiliar recebe IK residual
limitado a 10 cm e 0,35 rad. A restrição de superfície da bola vale somente
depois de um encaixe verificado. Não atrai a bola solta. A reposição alta usa a
captura de lançamento; o arco começa na posição efetiva da mão no impacto.

O adaptador `presidencia-futebol-oficial.ts` agora registra cópias de posição e
velocidade físicas ao observar um evento de defesa/rebote. É leitura do mesmo
motor; `motor2` não foi alterado. `map-keeper-flight.mjs` une amostras fixas antes
e depois desse ponto, separando as velocidades de chegada e saída exatamente no
instante oficial. A curva não procura luvas ou receptores em tempo real. O
contato corporal residual após a espalmada recebe IK limitado nos braços.

## Testes e evidências

Artefatos reais de WebGL: `/workspace/shared/fundamentos-mapa-v5-20261028/entrega`.
Vídeos normal/lento e revisão HTML autocontida com capítulos. A captura usa o
mesmo `criarPartidaComplexo` do campo do mapa e mantém 22 atletas simulados.

- Partida completa, 90 s de reprodução: 22 atletas, mesmo placar e mesmos 67
  eventos oficiais, a 60 e 30 Hz. Os 64 contatos programados passam nos dois
  ritmos, sem estimativa por interpolação de malhas.
- Sete situações de goleiro em cinco sementes locais: encaixes, defesas baixas
  e altas, espalmadas, rebotes e reposições; contato, orientação, bola segura
  e eventos verificados a 60 e 30 Hz.
- Cinco deflexões medidas contra a malha corporal completa: a pior
  sobreposição caiu de 73,0 mm para 4,9 mm. Continua sendo uma tolerância
  residual medida, não uma declaração de colisão perfeita.
- Lance original de trave/recolhimento preservado: nenhuma defesa inventada,
  nenhuma coleta antecipada; sobreposição residual máxima nas mãos de 5,6 mm
  e sola mínima 3 mm acima do chão.
- Diagnóstico ligado/desligado produz os mesmos 22 corpos, bola e eventos.
- Cidade conferida em 960×720 e 390×844, câmeras transmissão, tática e mapa
  livre; 301 geometrias e 41 texturas, sem erro JavaScript. Não entraram assets
  novos. As duas novas câmeras de goleiro existem somente na bancada.
- `npm run build` e testes de trajetória, contatos, transições e pausa.

Com o servidor de desenvolvimento local na porta 5301:

```sh
node scripts/futebol3d/testa-relogio-contato.mjs
node scripts/futebol3d/testa-trajetoria-defesa.mjs
node scripts/futebol3d/testa-defesas-v5.cjs
KEEPER_HZ=30 KEEPER_OUT=test-results/fundamentos-mapa/v5-defesas-30hz node scripts/futebol3d/testa-defesas-v5.cjs
node scripts/futebol3d/testa-corpo-defesas-v5.cjs
SURFACE_OUT=test-results/fundamentos-mapa/v5/superficie-goleiro-original.json node scripts/futebol3d/sonda-superficie-goleiro.cjs
AUDIT_OUT=test-results/fundamentos-mapa/v5-final-60hz NO_CAPTURES=1 node scripts/futebol3d/audita-mapa.cjs
AUDIT_HZ=30 AUDIT_OUT=test-results/fundamentos-mapa/v5-final-30hz NO_CAPTURES=1 node scripts/futebol3d/audita-mapa.cjs
node scripts/futebol3d/grava-goleiros-v5.cjs
node scripts/futebol3d/monta-revisao-v5.cjs
```

## Limitações

Uma sequência oficial dá apenas 0,15 s entre encaixar e repor. O contato está
sincronizado, mas o gesto permanece rápido; esta revisão não altera o tempo
oficial para disfarçar a limitação. Sete casos não cobrem todas as situações de
goleiro, nem aprovam todos os fundamentos do futebol.

O FPS exportado e a resolução mobile no Chromium não medem o desempenho de um
celular físico. Não foi obtido perfil de RAM de um aparelho real.

A entrada histórica local continua produzindo 3–0 no motor atual, contra 1–1
salvo antigamente. A trava continua bloqueando aquele replay divergente.
Paridade antes/depois não valida essa partida antiga. Sementes adicionais são
ensaios locais; nenhum resultado foi enviado à carreira. Motor de resultados,
overalls, probabilidades, descanso, competições e banco permanecem intactos.
