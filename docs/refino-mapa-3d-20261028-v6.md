# Campo 3D do mapa — variedade de passes e finalizações

Continuação da V5 (`1bea8e33`), preservada também em
`recovery/fundamentos-mapa-v5-1bea8e33`. Esta revisão é local, sem publicação,
alteração de save, banco ou motor oficial. Modelo, rig, uniformes, campo e
cidade permanecem os mesmos.

## Problemas encontrados

O motor já decide altura, força, efeito e técnicas de finalização. O adaptador
3D descartava parte dessas informações: declarava técnica não especificada e
curva não simulada mesmo quando existiam na fonte. Também faltava entregar o
efeito ao cálculo da rotação visual da bola.

No personagem, qualquer inversão, lançamento, cruzamento ou passe acima de
26 metros selecionava cavadinha. Isso incluía passes longos inteiramente
rasteiros. As finalizações usavam apenas chute forte ou chute em corrida.

O arquivo chamado `passe_curto` no pacote é `Low Kick To Idle Transition`.
A revisão das imagens mostrou uma preparação pouco legível. Ele foi
descartado do novo seletor; o passe curto usa a captura de futebol
`Soccer Pass From Idle Pose`, já disponível.

## Implementação

- `presidencia-entrega-oficial.ts` recebe cópias de `lance.golpe` e `bola.giro`.
  Continua sendo metadado de apresentação, sem sorteios ou alterações físicas.
- `presidencia-futebol-oficial.ts` expõe o efeito real no quadro. A linha do
  tempo e os subquadros de contato conservam esse valor no instante correto.
- `map-kick-selection.mjs` escolhe entre capturas existentes, considerando
  técnica, distância, altura, força e velocidade corporal. Passe longo pelo
  chão usa chapa; lançamento alto usa a captura de chip; cruzamento forte
  pode usar uma captura de chute adaptada. Um chute alto não implica cobertura.
- Chutes rápidos em corrida preservam a captura de chute em movimento.
  Batidas fortes com preparação disponível usam o gesto de força. Colocada
  e cobertura dependem da técnica explícita da fonte, sem inventar lances.
- `RotacaoBola3D` recebe o efeito real e limpa o giro lateral anterior quando
  a fonte volta a zero. Não modifica o caminho físico da bola.

Nenhum modelo, textura ou arquivo de animação novo. A trilha compacta de
efeito acrescenta 28.804 bytes por partida preparada. Sem mudança de malha,
pesos, proporções ou estrutura dos ossos.

## Evidências

Artefatos: `/workspace/shared/fundamentos-mapa-v6-20261028/entrega`.
Vídeos WebGL normal/lento, página HTML autocontida com capítulos e
`diagnostico.json`. O campo isolado usa `criarPartidaComplexo`, o mesmo módulo
do mapa, com 22 atletas; não é uma nova partida gravada na carreira.

Auditoria da fonte: 16 sementes locais, 695 ações; todos os placares e eventos
permaneceram idênticos antes/depois. Foram observadas 473 ações de passe, 87
enfiadas, 16 lançamentos, 7 inversões, 22 cruzamentos, 45 chutes e outras ações.
Houve 29 entregas com efeito oficial diferente de zero.

Seis situações reais conferidas a 60 e 30 Hz:

| Situação | Captura selecionada | Medida observada |
| --- | --- | --- |
| Passe curto | Soccer Pass From Idle Pose | 14,57 m, pelo chão |
| Passe longo rasteiro | Side Foot Kick | 31,80 m, sem virar lançamento |
| Lançamento alto | Soccer Chip Shot While Jogging | 36,88 m; altura máxima de 5,97 m |
| Chute baixo | Jogging And Kicking A Soccerball Forward | Altura abaixo de 0,50 m; gol oficial |
| Chute alto para fora | Jogging And Kicking A Soccerball Forward | Altura acima de 3 m; saída oficial |
| Cruzamento com curva | Male Soccer Penalty Kick, adaptada | Efeito real de 0,427 rad/s; giro visual conectado |

Nas seis situações, contato medido e direção corporal passaram nas verificações,
sem erros JavaScript ou mudança de eventos. Isso não é uma aprovação automática
da naturalidade de todas as poses.

A partida completa da entrada local foi executada a 60 e 30 Hz: 22 atletas,
90 segundos de reprodução, mesmos 67 eventos, mesmo placar atual 3–0 e
64 contatos programados dentro da tolerância nos dois testes. Pausa preservada.
Não foi necessário estimar contatos por interpolação de malhas.

Cidade conferida em 960×720 e 390×844, câmeras transmissão, tática e mapa
livre, sem erros JavaScript: 301 geometrias e 41 texturas. Testes específicos
de contato, trajetória, transições, relógio e seleção de capturas passam.
`npm run build` passa.

## Reprodução dos testes

Com Vite local na porta 5301:

```sh
node scripts/futebol3d/testa-variedade-v6.mjs
node scripts/futebol3d/testa-relogio-contato.mjs
node scripts/futebol3d/testa-contato-mapa.mjs
node scripts/futebol3d/testa-fundamentos-mapa.mjs
node scripts/futebol3d/testa-transicoes-mapa.mjs
node scripts/futebol3d/audita-variedade-v6.cjs
node scripts/futebol3d/confere-variedade-v6.cjs
VARIETY_HZ=30 VARIETY_OUT=test-results/fundamentos-mapa/v6-variantes-30hz node scripts/futebol3d/confere-variedade-v6.cjs
AUDIT_OUT=test-results/fundamentos-mapa/v6-final-60hz NO_CAPTURES=1 node scripts/futebol3d/audita-mapa.cjs
AUDIT_HZ=30 AUDIT_OUT=test-results/fundamentos-mapa/v6-final-30hz NO_CAPTURES=1 node scripts/futebol3d/audita-mapa.cjs
CITY_OUT=test-results/fundamentos-mapa/v6-cidade node scripts/futebol3d/confere-cidade.cjs
node scripts/futebol3d/grava-variedade-v6.cjs
node scripts/futebol3d/monta-revisao-v6.cjs
```

O gerador da revisão também usa os registros anteriores da V5 e
`v6/catalogo-antes.json` para verificar paridade; não os substitui por resultados
novos. Arquivos brutos de diagnóstico ficam fora do Git.

## Limitações explícitas

Colocada e cobertura foram conectadas e testadas no seletor, mas não ocorreram
nas 16 partidas deste elenco. A validação visual dessas técnicas segue pendente.
Cruzamento reutiliza captura de chute adaptada; não se declara uma captura
específica de cruzamento. Bicicleta, voleio e outras ações especiais não foram
adicionados nem aprovados nesta revisão.

O vídeo exporta 20 quadros por segundo de uma simulação amostrada a 60 Hz.
Isso e a resolução de celular no Chromium não são medição de FPS ou RAM em
aparelho físico. A análise do contato não prova ausência de todo deslizamento,
problema de condução ou transição rápida no jogo.

Permanece a divergência histórica já identificada: o resultado antigo salvo
é 1–1, enquanto a versão atual do motor gera 3–0 com aquela entrada. A trava
continua bloqueando o replay histórico divergente. A paridade desta revisão
com a V5 não libera nem valida aquele save. Nenhum resultado foi enviado à conta.

As mudanças ficam em commit local isolado, reversível com `git revert` do
commit desta revisão. Não houve push ou deploy.
