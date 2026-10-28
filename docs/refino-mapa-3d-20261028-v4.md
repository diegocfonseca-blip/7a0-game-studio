# Campo 3D do mapa — goleiro e bola solta, 28/10

Pedido: corrigir o goleiro que aparece de costas no chute/recolhimento e
continuar refinando os fundamentos com bola. Continuação da revisão V3,
sem trocar o modelo atual, uniforme, rig, cidade ou estádio.

## Diagnóstico reproduzido

A sequência oficial desta entrada é chute do Higuaín (33,4 s), trave (34,4 s),
saída/recolhimento do Velloso (34,6 s) e lançamento para Athirson (35,25 s).
Não há um evento de defesa nessa sequência. Inventar uma defesa para explicar
a imagem mudaria o significado do lance.

O preparo da coleta usava a direção contrária à velocidade do **rebote futuro**.
Assim, antes de o chute chegar, o corpo já virava para a própria baliza.
Além disso, a existência de uma coleta próxima suprimia a reação ao chute e
antecipava demais o gesto de abaixar. O replay/seek podia ainda reiniciar um
mergulho enquanto a bola já estava nas mãos.

Outro erro aparece no domínio do Higuaín em 69,65 s. A trajetória visual da bola
solta já estava corrigida, mas o corpo seguia o alvo tático original e tocava a
animação de condução só porque o motor ainda lhe atribuía a posse. O atacante
ultrapassava a bola, que depois era recuperada por Athirson.

## Correções

- `map-keeper-intent.mjs`: orientação da coleta após chute vem da direção de
  chegada do chute adversário. O rebote não vira o goleiro antes do impacto.
  Teste espelhado para as duas balizas; agenda oficial permanece imutável.
- Reação de alcance em pé usa `gk_pega`/`gk_pega_baixo` já importados. Não cria
  uma defesa, não prende a bola, não troca o evento de trave. A coleta baixa
  começa perto da chegada ao chão, com o contato medido em 34,6167 s.
- Braços recebem IK residual de no máximo 10 cm/0,35 rad para evitar que o
  rebote atravesse as mãos antes da coleta e que a mão auxiliar atravesse a bola
  durante a transição. A mão direita continua sendo a âncora da bola segura.
  A bola solta não é deslocada por essa correção.
- Pés do goleiro em coleta/reposição usam a superfície deformada completa para
  medir o chão. Esse cálculo fica restrito às ações do goleiro; os 22 atletas
  não pagam esse custo a cada passada. A correção da altura é limitada a 16 cm.
  Não se aplica o foot locking de corrida sobre a pose de coleta/lançamento.
- Sem ação fixada, goleiros acompanham a bola apresentada no campo. Os demais
  atletas também usam essa bola para orientar o corpo e verificar proximidade.
  Posse lógica distante/alta não basta para selecionar a condução.
- No domínio que escapa, o corpo segue um caminho previamente fixado atrás da
  bola solta até a perda de posse. A volta ao movimento tático é gradual. Não
  há novo toque, atração da bola, mudança de receptor ou alteração da disputa.
- Na saída dessa disputa, dois quadros tinham interseção entre o braço/corpo
  do atacante e o adversário. A recuperação reserva gradualmente espaço para
  o balanço dos braços, dentro do limite de deslocamento já existente. O teste
  usa BVHs das duas malhas deformadas, e não só a distância entre os centros:
  34 quadros de 70,75 a 71,3 s sem interseção; distância mínima de 10,6 cm.
  Esse cálculo pesado existe apenas na bancada, não na partida do usuário.
- A intenção corporal presa após recepção/passe termina mais cedo. Reiniciar
  o tempo limpa marcadores de mergulho/eventos; retomar durante a coleta
  restaura a bola nas mãos sem iniciar outra defesa.

## Verificação e evidências

Artefatos: `/workspace/shared/fundamentos-mapa-v4-20261028/entrega`.
`revisao.html` é autocontido, com vídeo real e seleção de lances/velocidade.
`fundamentos-normal.mp4` e `fundamentos-lento.mp4` são capturas de WebGL do
mesmo módulo do campo do mapa, com 22 atores. O ângulo lateral do goleiro é
uma câmera da bancada, específica para inspecionar essa sequência. Não
substitui as câmeras existentes do produto.

Auditoria percorre os 90 segundos a 60 e 30 Hz; vídeo mostra recortes.
`diagnostico.json` registra paridade de eventos e contatos, limites e medidas.
O teste de superfície verifica a ausência de contato corporal antes da trave,
o contato das mãos durante toda a coleta/reposição, apoio no chão e ausência
de captura prematura. O teste de trajetória compara a bola solta com V3:
coordenadas idênticas entre 69,65 e 71,05 s, apesar do novo caminho do atacante.

Na aproximação do chute, o desvio máximo do goleiro em relação à bola é 16°.
Em 70,6 s, a distância do centro do atacante à bola caiu de 1,546 m para
aproximadamente 0,733 m. Isso é aproximação de uma bola solta, não confirmação
de posse ou de um novo toque. Cidade também conferida em 960×720 e 390×844,
nas câmeras transmissão, tática e mapa livre: 22 atletas, sem erros JavaScript.

Testes reproduzíveis:

```sh
node scripts/futebol3d/testa-intencao-goleiro.mjs
node scripts/futebol3d/testa-transicoes-mapa.mjs
node scripts/futebol3d/testa-fundamentos-mapa.mjs
node scripts/futebol3d/testa-contato-mapa.mjs
node scripts/futebol3d/sonda-superficie-goleiro.cjs
node scripts/futebol3d/testa-goleiro-v4.cjs
node scripts/futebol3d/testa-disputa-solta.cjs
node scripts/futebol3d/testa-diagnostico-opcional.cjs
AUDIT_OUT=test-results/fundamentos-mapa/v4-final-60hz NO_CAPTURES=1 node scripts/futebol3d/audita-mapa.cjs
AUDIT_HZ=30 AUDIT_OUT=test-results/fundamentos-mapa/v4-final-30hz NO_CAPTURES=1 node scripts/futebol3d/audita-mapa.cjs
node scripts/futebol3d/resume-refinamento-v4.cjs
npm run build
```

## Limites preservados na entrega

Esta entrada só tem uma sequência de trave/recolhimento. Ela não valida todas
as defesas, espalmadas, voos e recuperações de goleiros. A sobreposição residual
das mãos ainda chega a cerca de 13,5 mm. A 30 Hz, impactos entre quadros continuam
sendo estimados, com desvios registrados no relatório. Sprint, transições muito
rápidas e outras sementes continuam precisando de cobertura.

Não foi medido FPS em celular físico. Resolução mobile no navegador e FPS do
vídeo exportado não são um perfil de desempenho de aparelho real.

O motor atual reproduz 3–0 desta entrada local histórica, cujo resultado salvo
era 1–1. A trava continua bloqueando o replay divergente. A paridade antes/depois
verifica que esta revisão não mudou o motor, não valida a partida antiga.
Nenhum save, banco, rodada, resultado, over, descanso ou publicação foi alterado.

Recuperação: o commit anterior `11346852` contém a V3; reverter apenas o commit
desta revisão preserva os demais sistemas e o trabalho simultâneo do projeto.
