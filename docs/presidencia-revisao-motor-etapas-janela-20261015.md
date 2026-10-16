# Revisão do motor, etapas e janela — 15/10/2026

Revisão solicitada por Diego após a publicação de `2aa90a0d`. Trabalho local
na branch `fix/presidencia-revisao-motor-20261015`, preservando os lotes 1/2,
o estádio, a sala e o personagem existentes. **As correções desta revisão ainda
não foram publicadas.** A restrição à conta verificada
`diego.c.fonseca@gmail.com` permanece.

## Conclusão da análise

O campo já apresenta 22 atletas, circulação de bola e os resultados do placar,
mas **ainda não representa todos os acontecimentos de uma partida de futebol**.
O resultado vem da simulação existente; o motor 3D apresenta esse resultado e
acrescenta circulação. A narração, a circulação e o tipo de finalização ainda
não partem de um roteiro completo comum. Não declarar o motor concluído nem
fisicamente perfeito.

As compras do estádio já têm correspondência no modelo 3D e respeitam a ordem
dos andares. A janela da sala ainda usava a composição ilustrada anterior e
podia deixar de mostrar uma melhoria. Foi conectada ao mesmo construtor 3D do
mapa, com câmera fixa do camarote. Isso corrige a correspondência estrutural;
não conclui o acabamento fiel à arte original.

## Correções feitas nesta revisão

### Bola, relógio e placar

- O prazo fixo de 900 ms para um gol podia comprimir uma assistência de dezenas
  de metros em uma fração desse tempo. Um diagnóstico inicial mediu cerca de
  **422 m/s**. A duração agora considera as distâncias entre a bola visível,
  assistente, finalizador e gol, na escala em metros do campo.
- Campo, confirmação no placar e animação pequena do placar leem o mesmo
  relógio de lance. Pausar e mudar entre 0,25×, 0,5×, 1× e 4× conservam o
  trecho já percorrido. A velocidade não é reaplicada ao tempo passado.
- O gol continua sendo decidido pela simulação existente. O placar confirma
  uma vez quando o lance chega ao impacto. Dois gols do mesmo lado no mesmo
  minuto continuam eventos distintos. A rodada seguinte cancela os relógios
  anteriores, e o apito final aguarda a apresentação do último lance.
- Um novo lance oficial parte da bola que apareceu na tela; não mantém um
  passe invisível por baixo do chute. Corrigido também o salto vertical que
  acontecia antes da finalização do tipo “isolou”.
- Passes longos ganham trajetória aérea. Há cruzamento quando existe posse
  pelo lado do ataque e companheiro por dentro, além da ultrapassagem de apoio
  do lateral. Os dois sentidos foram testados com domínio do destinatário.

Essas alterações de tempo são exclusivas do caminho privado da carreira.
Não alteram resultados, autores, moedas, compras, RNG ou estatísticas salvas.

### Janela e iluminação

- `PresidenciaJanelaViva` coloca o mesmo complexo 3D no vão transparente da arte
  da sala, sem controles sobre os móveis. Cada compra muda a geometria vista
  pela câmera do camarote; teto aberto/fechado também muda a vista.
- A janela usa a partida publicada do estádio mandante e seu relógio. A câmera
  fica no ponto da Presidência também na várzea, sem construir arquibancadas
  ou conceder o camarote ao save.
- A sala ilustrada, móveis comprados e presidente sem olhos, nariz e boca
  continuam preservados. Em falha de WebGL/carregamento, permanece a composição
  ilustrada anterior, com suas limitações.
- Com teto fechado durante o dia, o campo ficava escuro. Os refletores passam
  a iluminar o estádio nessa situação **somente quando comprados e liberados
  pela estrutura**. Postes e iluminação da cidade continuam seguindo dia/noite.

## Cobertura real do motor e pendências

| Acontecimento | Situação após a revisão | O que falta |
| --- | --- | --- |
| Passe, domínio e condução | Bola acompanha posse, receptor e trajetória; há interceptação rasteira e separação básica dos corpos | Mais decisões táticas, disputa física e contato de pé em todos os movimentos |
| Lançamento | Trajetória aérea para passes longos | Variedade de efeito, recepção de peito/cabeça e ligação com a narração |
| Cruzamento | Trajetória lateral para companheiro por dentro, validada nos dois sentidos | Cabeceio/voleio e conclusão do mesmo lance; frequência natural ainda precisa ser calibrada |
| Gol e assistência | Autor da escalação, passe e chute com tempo calculado; placar confirma no impacto | Roteiro completo da jogada; nomes repetidos exigem IDs de atleta no evento de origem |
| Defesa, trave, fora e por cima | Quatro desfechos existentes apresentados; defesa pode segurar ou espalmar | Desfechos ainda são comandados pelo evento, não por uma colisão física completa |
| Lateral | Busca do cobrador, preparação com mãos, lançamento e receptor | Continuidade física completa desde todas as saídas de bola |
| Escanteio e tiro de meta | Reposição, espera do cobrador e bola aérea | Variações ensaiadas, disputa aérea e integração com eventos oficiais da partida |
| Saída após gol | Time correto e regra de retorno dos atletas ao próprio campo | A bola ainda é reposicionada da rede ao centro de forma abrupta, cerca de 53 m; falta a sequência de recuperação/transporte |
| Intervalo e substituição | Troca de lado e escalação real do segundo tempo | Entrada/saída física de todas as substituições como acontecimento completo |
| Árbitro, técnicos e bancos | Árbitro em campo; técnicos, bancos e reservas no lado norte | Gestos, cartões, assistência e movimentação associados aos incidentes |
| Faltas, vantagem e barreira | Não há eventos completos no motor atual | Detecção/autoridade do lance, posicionamento, cobrança e consequências |
| Impedimento, cartões e expulsão | Não implementados como incidentes 3D | Fonte de eventos comum e formação com menos de 11; hoje o motor exige 22 atletas |
| Pênalti | Fluxo manual existente preservado | Integração autorizada desse mesmo resultado ao estádio, sem uma segunda cobrança independente |
| Tabelas, jogadas ensaiadas, cabeçadas e bicicletas | Podem aparecer no texto da narração sem execução correspondente no campo | Um roteiro tipado compartilhado entre narração, atletas, bola e placar |

Na circulação livre de cinco minutos usada no teste, apareceram saída,
domínio, passe, lançamento, lateral e escanteio. **Não apareceu cruzamento
espontâneo nessa amostra**: a validação dos cruzamentos usa duas situações
de posse lateral preparadas. Isso comprova a trajetória e recepção, não uma
distribuição realista de todas as jogadas durante 90 minutos.

O relógio da competição continua comprimindo uma partida em uma apresentação
curta. Lances com distância real podem prolongar a fila visual. Não existe
ainda uma simulação física contínua de 90 minutos com todos os incidentes
sincronizados por um registro único. A marcação do gol ainda tem um pequeno
ajuste de posição ao cruzar a linha; as reposições precisam de trabalho próprio.

## Etapas e melhorias do estádio

Conferidos o catálogo de **16 obras** (cinco setores, dez extras e pavimentação),
o modelo de compras e a arquitetura existente. Não foi necessário reescrever
a economia nem apagar propriedades antigas.

| Compra/etapa | Correspondência e regra conferidas |
| --- | --- |
| Várzea e gramado | Terreno inicial e progresso do plantio; campo mantém a mesma escala física e posição |
| Geral, cadeiras e visitante | Módulos do primeiro andar proporcionais ao investimento |
| Camarote / segundo andar | Só recebe investimento após o primeiro andar completo; incorpora anel superior e Presidência |
| Cobertura | Só se forma com primeiro e segundo andares e gramado concluídos |
| Retrátil | Exige cobertura e estrutura; abrir/fechar não depende de comprar hotel ou todas as lojas |
| Refletores e telão | Aparecem conforme propriedade e pré-requisitos; iluminação não cria refletores não comprados |
| Loja, praça de alimentação, choperia e hotel | Estabelecimentos nos lotes definidos, sem conceder bens ausentes |
| Estacionamento | Quatro etapas existentes; propriedade completa antiga preservada |
| Estação | Estação, acessos e transporte existentes preservados |
| Asfalto e calçadas | Compra própria; mantém a ligação com estabelecimentos e acessos |

Os testes lógicos passaram por **131.072 combinações** de setores, extras e
teto. Isso **não** significa 131.072 imagens conferidas: a arquitetura real
foi testada em 11 cenários representativos, e a janela foi capturada nos seis
estágios abaixo. A revisão de evolução também passou por 2.048 combinações
e 4.096 combinações do mapa, incluindo as regras privadas e saves antigos.

Continuam pendentes o refinamento de materiais, formas e acabamento para
aproximar o estádio oval completo e o entorno da arte aprovada, especialmente
no zoom. A revisão não criou uma nova coleção de artes. As limitações de
torcida/transporte registradas na publicação anterior continuam válidas:
as rotas físicas não cobrem toda a amostra de até 800 torcedores, e a chegada
antecipada ainda precisa de integração adicional com o calendário.

## Sala e vidro: o que está comprovado

Capturas locais da sala em 1100 px: várzea, gramado parcial, primeiro andar,
segundo andar parcial, cobertura e estádio completo com teto fechado. Em
390 px: várzea e completo fechado. Cada estágio usa o mesmo save que alimenta
o mapa; a mudança de compra altera a vista.

O que foi ligado é a **vista através do vidro transparente**. Não foi criado
um espelho com reflexão dinâmica completa de jogadores e cidade. A sala
continua sendo uma composição ilustrada; o presidente ainda não é um corpo
3D que percorre o camarote. O acabamento entre a ilustração da sala e o mundo
3D ainda exige avaliação visual. A população completa das arquibancadas do
mapa também não é transmitida à janela por este adaptador.

## Evidências desta rodada

- `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`: PASS, incluindo
  TypeScript. Avisos existentes de importação dinâmica/tempo de plugins não
  impediram o build. Log: `test-results/complexo-3d/revisao-build-final.log`.
- `node scripts/testa-presidencia-lances-revisao.mjs`: PASS em **40 cenários e
  7.404 quadros**, mais dois cruzamentos preparados. Maior velocidade da bola
  na amostra de aproximação/passe/chute: **28,341 m/s na escala 1×**. O teste
  não inclui todos os rebotes/reposições no limite de velocidade. Relatório:
  `test-results/futebol-3d/revisao-lances.json`.
- Motor existente, laterais, complexo/partida (136 quadros), arquitetura,
  mobília (13 compras) e iluminação: PASS. Logs `revisao-*.log` em
  `test-results/complexo-3d/` e saídas de execução local.
- Navegador com `LiveScoreCard` real: distância, pausa, miniatura, mudança
  0,25× → 4×, dois gols do mesmo lado/minuto, limpeza entre rodadas e último
  gol antes do apito final passaram. Primeira rodada completa em
  `test-results/futebol-3d/revisao-browser.json`.
- As oito vistas da sala passaram na primeira rodada completa. O último
  ajuste de iluminação sob o teto fechado foi separado para repetição em
  desktop e celular. A repetição integral encontrou primeiro uma espera
  incorreta do teste ao redimensionar a mesma cena; corrigida para conservar
  o canvas. Outra execução foi interrompida por desconexão do ambiente,
  depois de passar os casos do placar. Não contar execução interrompida
  como suíte completa aprovada. A repetição isolada da janela com a iluminação
  final **passou em 1100 e 390 px, exit 0**, sem erros de página:
  `revisao-janela-final.log` e `revisao-browser-final.json` em
  `test-results/futebol-3d/`. As capturas `janela-1100-completo-fechado.png`
  e `janela-390-completo-fechado.png` correspondem à versão final iluminada.

Os testes de navegador usam identidade local simulada e largura de celular;
não comprovam login real, persistência em nuvem ou desempenho em aparelho
físico. Não houve escrita administrativa no banco nem deploy desta revisão.
A publicação anterior foi confirmada pelo GitHub Pages no workflow
[38810648788](https://github.com/diegocfonseca-blip/7a0-game-studio/actions/runs/38810648788),
commit `2aa90a0de7c1768a307ffc1fbb53f6bcfcf545c8`.

## Próxima implementação necessária

1. Criar um registro tipado de incidentes, com ID do atleta e roteiro do lance,
   compartilhado pela simulação, narração, placar e motor 3D. Preservar o
   resultado autorizado e o fluxo manual de pênaltis.
2. Implementar nesse registro faltas, cobranças, barreiras, impedimentos,
   cartões e expulsões, com formações variáveis e posicionamento dos atores.
3. Completar contato/recepção, disputas aéreas, jogadas ensaiadas e recuperação
   da bola para as reposições, removendo os saltos restantes.
4. Refinar materiais/iluminação e a transição visual sala–estádio, com novas
   capturas de cada etapa no zoom e medição em celular físico.
