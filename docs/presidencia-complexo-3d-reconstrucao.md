# Reconstrução do complexo do estádio — revisão local de 12/10/2026

Diego reforçou que o estádio completo, suas etapas e seus estabelecimentos devem
ser muito fiéis à arte aprovada. A referência continua sendo
`public/estadio-mapa/projeto/complete.webp` e suas peças nativas de 3072×2048.
Esta reconstrução ainda não é uma entrega visual aprovada. Não substituir a arte
existente nem publicar a maquete como acabamento final.

## 15/10/2026 — integração da carreira e publicação de teste autorizada

Diego pediu para publicar o trabalho atual apenas no seu usuário. Esta nova
autorização substitui a pausa histórica, preservando o caráter de teste e as
pendências de acabamento. A carreira agora usa o complexo com obras, partida,
calendário e estacionamento; verificação do email mantém acesso só para Diego.
Build, CPU e navegador passaram, incluindo percursos e tela integrada em
desktop/celular emulado. Histórico, evidências e limites em
[presidencia-publicacao-20261015.md](presidencia-publicacao-20261015.md).
O sucesso do GitHub Pages deve ser confirmado antes de declarar publicado.

## 14/10/2026 — continuação: transporte até o assento e saída física de parte da torcida

Estado atual da **prévia local**; esta seção substitui as pendências de ligação
transporte/assento e metrô mandante registradas na rodada histórica abaixo.
Agenda preservada: **quarta às 21h/noite; domingo às 16h/dia**, sem usar a hora
do dispositivo nem modificar o relógio oficial, a velocidade ou o resultado do jogo.

- O passageiro do transporte agora pode percorrer a ligação até seu assento
  construído, sentar, levantar, descer e retornar ao veículo com o **mesmo corpo**.
  Não há troca por outro NPC no portão. A cadeira permanece reservada enquanto
  seu dono físico ainda faz o percurso; a próxima viagem aguarda a liberação.
  A reserva inclui destinos pendentes para não desenhar torcida estática em
  uma cadeira já atribuída. As visitas antigas encerram seu caminho na origem
  antes da transição, sem substituir a pessoa no meio da escada.
- O metrô ganhou percurso mandante até o portão frontal, além do visitante
  lateral. O serviço usa demanda/lado da jornada; estação, passarelas e acesso
  ao assento continuam subordinados às obras existentes. A geometria externa
  passou em três estágios: várzea com estação, completo sem asfalto e completo.
  Foram conferidos 20.784 apoios de sola, 1.056.202 verificações de corpo,
  23.430 amostras de rota e 2.598 poses. Log: `metro-mandantes-cpu.log`.
- Os corredores têm prioridade coordenada: quem já está fora do veículo
  termina seu percurso; novas saídas pela porta aguardam a circulação no acesso.
  A volta da coorte para uma nova jornada também reserva o corredor antes de
  novo desembarque. O acompanhamento da câmera fica preso ao corpo escolhido,
  sem saltar para outro passageiro do mesmo lado quando muda a disponibilidade.
- Uma coorte de **até seis torcedores, no máximo três por lado**, ocupa apenas
  os assentos com rotas físicas expostas pela arquitetura e livres de reservas
  de transporte/visitas. Consome a mesma quota da amostra de até 800 sentados.
  Depois do jogo, sai um por corredor, desce pelos degraus reais e permanece
  visível em pontos distintos da calçada. Na próxima jornada volta andando,
  com a mesma identidade. Não usa desaparecimento, fade ou teleporte para
  simular esvaziamento; a massa restante ainda não tem rotas próprias.
- O orçamento é reavaliado por lado ao configurar a jornada. Corpos que
  excedem a nova quota saem pelo mesmo caminho, mantêm uniforme/identidade e
  ficam fora sem voltar; uma quota restaurada permite retorno andando, inclusive
  dentro da mesma jornada. Se a cena nasceu com quota zero, esta coorte continua
  vazia durante a vida da cena; o crescimento posterior da amostra estática
  não faz personagens aparecerem de repente nas cadeiras da coorte.

CPU confirmado nesta continuação: fluxo **864 casos + 1.194 verificações**;
calendário **1.338 casos**; movimento da jornada **1.843 quadros**; adaptador
de carreira **165 visuais**; transporte/assento **9.568 verificações lógicas,
36 de corpo, 4.299 de transferência e 9.824 verificações físicas**. Coorte: **87.786 poses, 35.774 verificações
de apoio e 219.465 de separação**, com saída e retorno completos dos seis corpos.
Evidência desta última execução em `test-results/complexo-3d/torcida-saida-cpu.log`
e `torcida-saida-report.json`. Solas na arquitetura verificadas a 1 Hz; solo
externo renderizado amostrado a cada 10 segundos visuais, com broadphase/cache,
e todos os novos pontos de espera externos conferidos. A suíte física anterior
das visitas cobre as passadas dos mesmos acessos.
Correção posterior de orçamento passou em cinco cenários lógicos: novo jogo
com mandantes zero/visitantes três, restauração, redução parcial e nova
restauração na mesma jornada, e quota inicial zero sem criar corpos. Seis UUIDs
preservados; geometria/percursos inalterados. Log:
`test-results/complexo-3d/torcida-orcamento-cpu.log`.

**Build PASS, exit 0**, registrado em `test-results/complexo-3d/percurso-build.log`.
As capturas atuais de navegador ainda estão em execução; os resultados devem
ser acrescentados aqui ao terminar. Os PASS históricos abaixo se referem às
respectivas versões. A aprovação visual do acabamento continua pendente.

Pendências preservadas: esvaziamento da massa de até 800 (a coorte cobre só seis
assentos acessíveis), programação de chegada antes da partida — a caminhada
atual leva tempo humano real e não antecipa o calendário —, integração às telas
reais da carreira, personagem físico da Presidência, acabamento da sala/camarote
e fidelidade do estádio/entorno à arte original. **Sem commit, push, deploy ou
acesso à conta real**; acumular o trabalho e publicar ao final, com liberação
inicial somente para `diego.c.fonseca@gmail.com`.

## 14/10/2026 — jornadas de jogo e iluminação noturna

Registro histórico anterior à continuação transporte/assento acima.

- Correção posterior de Diego: **quarta-feira às 21h, à noite; domingo às
  16h, de dia**. `kickoffTime` registra o horário no calendário do jogo;
  `period` determina a iluminação. Não depende do relógio do dispositivo nem
  altera a velocidade/cronômetro da partida. Prévias e expectativas dos testes
  de navegador atualizadas. Calendário CPU (1.338 casos) e adaptador da carreira
  (165 visuais, mais cenários de agenda) passaram novamente. As capturas e o
  relatório de navegador descritos abaixo antecedem esta correção: seus nomes
  quarta-dia/domingo-noite são históricos, não a regra atual. A suíte de
  navegador completa não foi repetida para esta troca de horários.
  `npm run build` após a correção: **PASS, exit 0**; log em
  `test-results/complexo-3d/horarios-corrigidos-build.log`.
- `presidencia-complexo-jornada.ts` recebe identidade e ordinal explícitos da
  agenda: dias ímpares quarta às 21h/noite, pares domingo às 16h/dia. Partidas distintas
  têm chave/defasagem próprias. Não usa data do aparelho, RNG ou relógio paralelo
  de futebol; sem agenda confirmada, não inventa dia. Liga usa rodada; Copa e
  internacionais exigem contagem real de pernas e offset conhecido.
- Chegada, partida e intervalo retêm os passageiros no destino e as visitas
  sentadas. Saída libera retorno/embarque físico antes de trocar serviço. Nova
  jornada aguarda a origem do percurso anterior. Clientes e carros cotidianos
  seguem circulando. O orçamento reservado evita reaproveitar o passageiro que
  saiu como outro NPC e reiniciar os demais corpos.
- Camada de luz usa fontes na geometria: postes apoiados em calçadas, plataformas,
  passarelas, pontos de ônibus, fachadas e faróis móveis. Janelas/lentes recebem
  emissão à noite. Há orçamento de quatro luzes locais próximas e quatro
  conjuntos de refletores. Estádio aberto usa torres; cobertura usa luminárias
  sob a borda interna, sem iluminar através do teto. Compras e requisitos continuam
  valendo: várzea/sem gramado não ganham refletores. Dia restaura o ambiente.
- A primeira captura expôs ruas escuras e passageiro do metrô pouco legível.
  Acrescentado atlas procedural de luz dos postes sobre o próprio material de
  asfalto/passeio, com bloqueio por paredes, cota e normal do piso. Não cria
  plano por cima da cena nem substitui suas texturas. Solo e plataforma usam
  camadas separadas; a luz física próxima continua iluminando os corpos.
  Cabines receberam luminárias, com até duas sombras locais de 512 pixels
  dentro do mesmo orçamento de quatro luzes. Luz do vão só acende com a porta
  aberta; vidro emissivo foi reduzido para preservar a leitura do passageiro.
- Integração da prévia preserva cena, câmera, relógio, saldo e identidades ao
  mudar fase/iluminação. Cores e torcida visitante continuam disponíveis na
  saída mesmo quando o adaptador já removeu a partida finalizada da vista.
- Uma regressão de navegador detectou reinício ao receber a próxima agenda antes
  do novo snapshot. Corrigido: ausência de cor não limpa o uniforme anterior;
  cores deixaram de participar das chaves que recriavam os atores. A visita
  recebe a cor da nova jornada somente ao terminar o trajeto anterior na origem.
  Correção de cor dentro da mesma jornada muda apenas o material. Teste CPU
  específico confere pose, UUID, recursos, pendência e descarte; navegador
  exercita saída sem snapshot e próximo adversário azul/branco.
- QA principal tem seleção de dia e fase; QA carreira recebe agenda opcional.
  Isso ainda não conecta a nova cena às telas reais da carreira. Não houve login,
  commit, push ou deploy; acesso futuro continua exclusivo de Diego inicialmente.

Testes CPU: calendário 1.338 casos; movimento 1.843 quadros e 12 combinações de
estágio/seed; regressões de fluxo, transporte, circulação e visitas passaram.
Iluminação confere compras, teto, apoio dos postes, faróis móveis e restauração
diurna. Testes de atlas conferem queda de luz, oclusão e cotas; teste de cabine
confere porta, cone sobre o passageiro e inversão dos faróis. Evidências de navegador/build desta rodada ficam em
`test-results/complexo-3d/jornada-*` e `*-jornada-*.png`.

Rodada final: **build PASS; desktop 1400×1000, nove checkpoints PASS; celular
emulado 390×844, oito checkpoints PASS**, sem erros/transbordamento. Nove imagens
conferidas, incluindo mapa/campo/metrô noturnos e várzea sem refletores concedidos.
Partida parada em 17 s/22 jogadores, câmera, saldo e atores preservados; retirada
do snapshot final e novo adversário com cores diferentes também passaram.
`jornada-browser-report.json` é o relatório final; a falha intermediária de cores
foi corrigida e sua captura permanece apenas como evidência histórica.

Limites históricos desta rodada, anteriores à continuação acima: o passageiro do transporte chegava ao portão; a
visita até a cadeira ainda é outro NPC reservado, sem transferência física do
mesmo corpo. Metrô tem percurso validado dos visitantes; chegada mandante pelo
metrô precisa de ligação medida ao portão frontal. A massa de torcida sentada
ainda não se esvazia progressivamente após a saída. Desempenho/legibilidade das
luzes no celular físico e acabamento fiel à arte continuam em revisão.

Referências a logs em `/tmp` nas seções históricas registram execuções anteriores;
esses arquivos temporários não foram recuperados após o reinício do ambiente.
Os logs da validação atual ficam em `test-results/complexo-3d/qualidade-final-build.log`
e `test-results/complexo-3d/qualidade-final-browser.log`. A existência desses logs
não representa aprovação: o resultado atual está descrito abaixo.

## 14/10 — mapa amplo, navegação e qualidade de aproximação: rodada local validada

- A cena ocupa uma área maior: no celular, quase a altura útil da tela; no
  desktop, área ampla com controles sobre o mapa. **Ampliar mapa** ocupa a tela
  disponível sem remontar o canvas ou criar outra cena. O painel **Locais**
  reúne os destinos; mapa, campo, zoom e retorno ao enquadramento geral ficam
  acessíveis, com áreas de toque de pelo menos 48 px nos controles principais.
- O gesto padrão passa a **arrastar com um dedo ou botão esquerdo para mover**.
  Pinça com dois dedos aproxima/afasta e desloca; no desktop, a roda aproxima
  na direção do cursor. **Girar** ativa a rotação explicitamente. Setas e
  `+`/`−` operam apenas com foco no mapa, sem consumir atalhos da página.
  Corrigido também o `+` digitado com `Shift` no teclado principal; teste CPU
  confirma uma única renderização e mantém livres os demais atalhos modificados.
- Expandir, recolher ou girar o celular preserva o local explorado. Vistas
  predefinidas ainda não exploradas se reenquadram conforme a proporção da
  tela. Limites calculados pela projeção da câmera evitam revelar terreno
  vazio além do mapa; as vistas internas conservam a altura humana.
- A expansão prende a rolagem da página e mantém o foco no painel; `Escape`
  ou **Fechar mapa ampliado** devem devolver foco e posição da página. A
  primeira rodada encontrou uma falha nessa devolução de foco; corrigida no
  componente e **retestada com sucesso em desktop e celular emulado**.
- Resolução deixa o teto global de 1,8 MP/DPR 1,75: o orçamento normal é de
  **2,5 MP/DPR até 2,5 no celular** e **4 MP/DPR até 2 no desktop**, limitado
  também pela resolução nativa e capacidade da GPU. Aparelhos com indicação
  de memória até 2 GB mantêm o teto anterior. Anisotropia até 8 melhora a
  leitura oblíqua de gramado, calçadas e concreto; limita-se à GPU e cai a 2
  no perfil de pouca memória. Reflexos, sombras e filtros especiais preservados.
- O gramado conserva imagem, cores, faixas e UV contínuo de **105×68 m**.
  Microdetalhe procedural discreto acrescenta fibras quando próximo e
  desaparece antes de ficar menor que um pixel, evitando cintilação distante.
  Não há novas imagens, geometria ou relógio. Jogadores, bola, NPCs, vias,
  colisões, compras e etapas permanecem nos mesmos contratos físicos.

Evidências da rodada:

- Build final da fonte atual, após integração da sombra e correção de teclado,
  **PASS, exit 0**, com os avisos preexistentes de tamanho/importação do bundle.
  Log recuperável: `test-results/complexo-3d/qualidade-final-build.log`.
- Helpers de câmera e qualidade **PASS**: pan/pinça/rotação, teclado, limites
  pela perspectiva, 200 ações de zoom, preservação após resize, orçamento de
  pixels/GPU, UV/cor e ciclo de texturas compartilhadas. Scripts
  `testa-presidencia-complexo-camera.mjs` e
  `testa-presidencia-complexo-qualidade.mjs`.
- Após o reinício do ambiente, câmera, qualidade, material do gramado e suas
  **301 etapas de plantio PASS** em CPU; câmera inclui agora `Shift +`.
- Material do gramado **PASS** no teste de shader/envelope antialias; regressão
  da partida **PASS em 136 quadros**, com 22 atletas, árbitro, técnicos,
  reservas, pausa, gols, substituições e estado/descarte preservados. Scripts
  `testa-presidencia-gramado-material-3d.mjs` e
  `testa-presidencia-complexo-partida.mjs`.
- Browser `testa-presidencia-complexo-navegacao.cjs`: desktop **1400×1000** e
  celular emulado **390×844 PASS**, oito checkpoints por dispositivo, sem
  erros JS/WebGL/transbordamento. Pinça real, arraste, roda, teclado, giro
  explícito, orientação/resize, limites, Locais, expansão/foco e retorno da
  rolagem passaram. Canvas mobile expandido **780×1688/DPR 2**; compras, bola
  e relógio em **17 s/22 jogadores** preservados. Os dois gols são enquadrados
  antes do zoom. Aproximações a **40 m** conferidas visualmente em ambos:
  gramado, linhas e personagens sem rosto com apoio/sombras coerentes.
  Relatório consolidado
  `test-results/complexo-3d/navegacao-report.json`; quatro capturas principais
  `*-navegacao-mapa-ampliado.png` e `*-navegacao-campo-ampliado.png`.
  A fixture também foi corrigida para não exigir câmera idêntica quando a proteção
  das bordas precisa reduzir uma vista muito afastada ao girar o aparelho;
  aproximar por gesto antes da rotação verifica a preservação do local escolhido.
- A inspeção encontrou e corrigiu um **bug real de zoom de toque com a página
  rolada**: OrbitControls 0.180 passa `pageX/pageY` a um cálculo baseado em
  `getBoundingClientRect()`. O helper passa a ancorar o ponto 3D sob os dedos
  com coordenadas client, sem editar dependência/APIs privadas; a roda conserva
  seu comportamento. CPU cobre scroll 0/249, centro/fora do centro, cancelamento
  e descarte. Nova execução mobile manteve **scrollY=249**, alvo próximo de
  **[0, 0.4, 0]** e distância **40 m**; a imagem antiga da fachada foi substituída.
- A ampliação revelou faixas curvas indevidas na praça e no teto da Vadico.
  O diagnóstico A/B inicial, por interceptação local do módulo,
  confirmou **autossombra do PCF**: desaparecem com sombra do sol desligada e
  também com bias proporcional ao texel/raio de filtragem, conservando as
  sombras dos prédios. Geometria do teto sem duplicação em nove raios CPU.
  Evidências `sombras-diagnostico-report.json` e
  `desktop-sombras-diagnostico-{baseline,off,scaled}.png` na mesma pasta.
  Variante verificada: `texel = (right-left)/mapSize.x`,
  `bias = -texel*max(1,radius)*0.8/(far-near)` e
  `normalBias = clamp(texel*0.5, 0.008, 0.16)` no mapa de sombra do sol.
  **Correção integrada em `updateShadows` de `presidencia-complexo-3d.tsx`**:
  bias e normalBias acompanham a escala do mapa de sombra em cada enquadramento.
  Build e recaptura final da fonte atual **PASS**. As imagens finais foram
  conferidas: sem as faixas curvas na praça/teto e com sombras dos prédios,
  gramado e contato dos atletas preservados nas aproximações.
- Captura final `captura-presidencia-complexo-qualidade.cjs`: desktop
  **1400×1000** e celular emulado **390×844**, canvas móvel **780×1688**, ambos
  **PASS**, sem erros JS/WebGL/transbordamento. Campo a **40 m ± 0,1 m**,
  22 atletas, bola, relógio em 17 s e save preservados. Relatório consolidado
  `test-results/complexo-3d/qualidade-final-report.json`; capturas finais
  `*-qualidade-final-mapa.png` e `*-qualidade-final-campo.png` na mesma pasta.
  A primeira tentativa do script usava roda no contexto móvel e falhou na
  distância esperada; o script passou a usar pinça real via CDP no celular.
  A tolerância de 40 m ± 0,1 m foi preservada. O log `qualidade-final-browser.log`
  conserva a tentativa falha e a execução móvel corrigida, além do desktop.
  Suspeita de textos ausentes nos botões da captura móvel foi descartada pela
  leitura direta do PNG, contagem dos pixels dos glifos e OCR: textos/ícone
  estão presentes. Nenhuma alteração adicional de interface foi necessária.

Tudo permanece local, sem commit/push/deploy nem acesso à conta real. Nitidez
de renderização e microtextura não encerram a fidelidade à arte aprovada;
acabamento, personagem físico, integração visual à carreira e aprovação de
Diego continuam pendentes. A futura liberação inicial continua restrita a
`diego.c.fonseca@gmail.com`.

## 14/10 — ruas e caminhos de pedestres: revisão validada localmente

- Trechos de rua duplicados/sobrepostos foram consolidados sem preencher
  intervalos vazios de asfalto. As redes antes divididas em quatro/cinco grupos
  passam a uma rede conectada, com **oito ligações na várzea e nove no completo
  asfaltado**. Extremidades das avenidas recebem conexões físicas; calçadas e
  guias são recortadas nas interseções para não bloquear a passagem.
- A rua interna leste passa por fora do estacionamento e chega à via leste.
  Na oeste foram retirados três vértices que atravessavam o hotel; a chegada
  termina em retorno de **5,5 m de raio**, cercado por passeio de **1,5 m**.
  Um ramal ao norte da Vadico conecta essa região à via pública.
- Removido o passeio decorativo `passeio-anel-arena`, que cortava hotel, fonte,
  canteiros, praça e choperia. Os percursos dos NPCs são preservados. **Dez
  conexões físicas de pedestres** fecham intervalos nos acessos de loja, estação,
  praça, segunda parada de ônibus, hotel e estacionamentos, respeitando as
  compras de cada local; a ligação pública da segunda parada não depende delas.
  Rampas acompanham as alturas dos pisos. Cercas vivas deixam vãos nas duas
  portas e parques só recebem entradas ligadas a uma calçada válida.
- No cenário completo há **uma travessia elevada ao norte**, com piso de
  **16 cm e rampas de 2,2 m**. A ligação sul foi redesenhada para evitar a
  rodovia; não recebeu travessia elevada.
- A calçada do canto externo noroeste tem piso contínuo até a avenida. Na
  entrada lateral do estacionamento noroeste, guias e passeios são recortados
  pelo lote comprado, deixando a ligação com a rua interna oeste aberta.
  As duas correções foram verificadas na geometria e nas recapturas aproximadas.

Validação final da fonte atual, após corrigir os acessos noroeste:

- `scripts/testa-presidencia-complexo-ruas-fisico.mjs`: **PASS em sete cenários,
  com 221.848 amostras de piso**, cobrindo três faixas das vias, conectores,
  rampas e cantos. Inclui **2.709 verificações da esquina noroeste** e **2.535
  do acesso e das vagas do estacionamento**. Planejador puro também passou.
- Pedestres: **17 cenários/4.590 verificações** no teste puro e **7.344 pontos
  de piso/594 raios de corpo** na geometria, todos PASS.
- Entorno: **nove estados PASS**, máximo de **46 malhas/292.613 triângulos**;
  várzea com **40 malhas/244.060 triângulos**.
- Circulação: **cinco minutos simulados a 20 Hz, 1.464 quinas de solas**, com
  loja/hotel/choperia, contatos, pausa, orçamento de atores, compras e descarte
  PASS. Build final também passou.
- Transporte: **1.293 envelopes, 55.457 quadros temporais, 199 portas, 441
  pontos nas pontes, 218 nos acessos, 5.032 apoios de pés, 259.601 verificações
  de corpo e 3.320 contatos de rodas**, todos PASS na fonte atual.
- Browser desktop **1280×960** e celular emulado **390×844**: **12 capturas
  gerais/aproximadas PASS**, mais **seis recapturas finais** de mapa, hotel e
  acesso noroeste, sem transbordamento nem erros JS/WebGL. A inspeção visual
  confirmou calçada contínua e entrada lateral aberta; o hotel permanece na
  cena. Relatórios `test-results/complexo-3d/ruas-browser-report.json` e
  `test-results/complexo-3d/ruas-parking-browser-report.json`; imagens
  `*-ruas-complete-*.png` e `*-ruas-empty-mapa.png`. As vistas gerais e do hotel
  foram substituídas pelas recapturas da fonte atual.
- Manobra noroeste com carro de **1,9×4,6 m**, raio de **3,5 m**: **7.928 poses
  geométricas PASS**, com folgas mínimas de **11,50 cm das vagas/11,47 cm da
  borda do asfalto** e limite conservador contínuo acima de **11,03 cm**.
  O piso renderizado passou em **794 poses/11.910 sondagens**, incluindo o
  perímetro do carro, sem falhas. Evidências locais:
  `test-results/complexo-3d/ruas-nw-carro-raio35.json` e
  `test-results/complexo-3d/ruas-nw-carro-piso-result.json`.
  **Limite:** a passagem é apertada e valida um trajeto geométrico específico;
  não adiciona animação de estacionamento nem garante qualquer manobra.

Tudo local, sem commit, publicação ou acesso à conta real. Permanecem abertas
as pendências gerais de personagem físico, integração visual à carreira e
acabamento fiel à referência, sujeito à aprovação visual de Diego.

## 13/10 — revisão do metrô após comparação com a arte nativa

Diego rejeitou a estação como estava: viaduto parecendo rua sem saída,
falta de duas passarelas diretas ao estádio e trem pouco visível. A inspeção
dos tiles nativos, principalmente `complete-1792-256.webp` e
`complete-2304-256.webp`/`complete-2304-512.webp`, confirmou duas passarelas
cobertas e uma composição azul comprida. A contagem exata de carros na arte
sintetizada não é inequívoca; o modelo adota cinco de 22,5 m, com engates de
0,6 m, totalizando 114,9 m, sem tratar essa contagem como medida da referência.

- Duas passarelas cobertas ligam a plataforma a praças/passeios internos.
  A ida do mesmo passageiro usa a oeste; a volta usa a leste. Não se cria
  público adicional para preencher o cenário. Escadas e corrimãos são físicos.
- A avenida norte era desenhada atrás da estação em parte do trecho. A mesma
  avenida passa agora entre metrô e estádio, sob os acessos, com uma só linha
  para piso, passeios, sinalização e reserva de espaço. A posição é inferida:
  copiar literalmente os pontos da imagem projetada invade o lote existente
  da choperia; o corredor escolhido preserva os lotes e a circulação. A
  fidelidade fina das curvas continua dependente de revisão visual.
- Trilhos prosseguem nos dois sentidos por um corredor de 3.200 m, sem
  batentes na região visível. O tabuleiro ferroviário tem 7,6 m fora das
  plataformas, deixando de parecer uma larga via rodoviária sem saída.
- A cobertura próxima da câmera era uma das causas da oclusão do trem.
  Foi estreitada, mantendo cobertura na espera. A composição tem teto azul,
  faixa clara, janelas âmbar, engates, portas e bogies em cada vagão.
- Ao abrir a cena, o relógio decorativo começa com o trem na plataforma.
  Isso não altera o relógio oficial da partida. A vista Estação enquadra
  metrô e acessos; a vista da plataforma continua à altura do passageiro.

Validação concluída em **14/10/2026** para este incremento local:

- `node --experimental-strip-types scripts/testa-presidencia-complexo-transporte.mjs`
  passou completo: **1.293 envelopes, 55.457 quadros temporais, 199 cruzamentos
  de portas, 441 apoios nas duas passarelas, 218 pontos de passeio, 5.032 apoios
  de solas, 244.199 verificações de corpo e 3.320 contatos de rodas**. Ida e volta
  incluem obstáculos, outros atores, acessos físicos e desembarque fora do asfalto.
  A falta de apoio na cabeceira oblíqua da ponte leste foi corrigida ampliando o
  piso físico em 0,5 m nas extremidades; as tolerâncias do teste foram mantidas.
- Build passou. `captura-presidencia-complexo-transporte.cjs --views-only`
  passou em desktop **1280×960** e celulares emulados **390×844 e 320×844**,
  sem erros JS/WebGL. A abertura mostra os **cinco carros do metrô na estação**;
  a mudança do relógio decorativo preserva a partida oficial em **14 segundos,
  com 22 jogadores**. Relatório `test-results/complexo-3d/transporte-enquadramento-report.json`;
  capturas incluem `*-metro-passarelas.png` e `*-transporte-metro-plataforma.png`.

Esses resultados verificam o funcionamento e o enquadramento; o acabamento e
a fidelidade à arte continuam sujeitos à revisão de Diego. Não publicado, sem
acesso à conta real, sem ativar a flag de compras por etapas na carreira.

## 14/10 — Vadico Veículos: implementação e validação locais concluídas

- Concessionária no bairro oeste, centro **x −154,5 / z 29,5 m**, com fachada
  voltada para **+Z**. O texto exato **“Vadico Veículos”**, em vermelho, é gerado
  em Canvas de **4096×300**; a placa preserva essa proporção na geometria.
- Seis carros de exposição com volume físico de **4,4×2,16 m**, 24 rodas com
  16 segmentos e contato com o piso. Prédio, pátio e veículos pertencem ao
  cenário do patrocinador; não há nova economia, compra ou alteração do save.
- Acesso à via pública independente da compra de asfalto, com entrada de
  pedestres separada. Lotes e reservas de futuras obras e percursos dos NPCs
  preservados. O atalho **Vadico Veículos** aproxima a câmera e adapta o
  enquadramento à largura da tela.
- O módulo final tem **12 malhas e 4.350 triângulos**. Após a correção física,
  os nove estados do teste de entorno passaram, com máximo de
  **46 malhas e 288.349 triângulos** no entorno completo.
- O teste físico dedicado detectou uma guia de **0,17 m** no início do acesso
  de veículos. Corrigida com um trecho inicial plano de **1 m em y=0** e recorte
  de **0,08 m**, preservando o asfalto e as rotas. A nova execução passou na
  várzea e no estádio completo, sem relaxar tolerâncias: **38 rotas e 17 reservas
  de futuras obras** preservadas, folga mínima de **9,87 m**. Por estado foram
  conferidos **24 pneus, 132 raios nas faixas das rodas do tráfego, 531 pontos de
  piso e 63 raios de passagem do corpo**. Save imutável e descarte idempotente
  também passaram em `testa-presidencia-complexo-concessionaria.mjs`.
- Build da integração física passou (`/tmp/presidencia-vadico-final-build.log`).
  O navegador desktop passou nos cenários completo/várzea; imagens da loja,
  letreiro e seis carros conferidas. A primeira rodada no celular passou nas
  asserções de enquadramento, mas **foi reprovada na inspeção visual**: o hotel
  ocultava dois carros e parte do azul. Caber na tela não garantia visibilidade.
- Corrigida somente a câmera Vadico em retrato, conservando o hotel e a
  geometria física. O QA ganhou **sete raios reais de visibilidade**, dirigidos
  ao letreiro e aos seis carros (`checkDealershipView`), para detectar a
  obstrução que o teste anterior não cobria. Os testes físicos acima continuam
  aplicáveis, pois nenhuma superfície, rota ou carro foi alterado nessa correção.
- Build após o ajuste da câmera passou
  (`/tmp/presidencia-vadico-camera-build.log`). A recaptura final passou em
  **desktop 1280×960 e celular emulado 390×844**, no estádio completo e na
  várzea, com **sete raios livres em cada cenário**, sem transbordamento da
  página nem erros JS/WebGL. Na imagem corrigida do celular, seis carros,
  letreiro e entrada ficam visíveis; o hotel permanece na borda do cenário.
  Relatório: `test-results/complexo-3d/vadico-browser-report.json`.
  Capturas finais: `*-vadico-complete.png`, `*-vadico-empty.png` e
  `*-vadico-mapa.png`, nessa mesma pasta.

Validação local feita pela equipe, sem aprovação visual de Diego, commit,
publicação ou acesso à conta real. As pendências gerais de acabamento fiel,
personagem físico e integração visual à carreira continuam abertas.

## 13/10 — metrô preservado nas prévias do estacionamento

A captura `desktop-estacionamento-etapa4.png` enviada por Diego não mostrava
metrô porque o botão de revisão da página isolada retirava `estac` **e**
`estacao`. Corrigido para reiniciar somente o estacionamento e conservar
as demais compras. As transações de estacionamento já preservavam a estação;
a falha estava na preparação da amostra, não na planta do metrô.

A estação permanece acima e à direita do estádio, junto à avenida norte,
na posição registrada da arte original. Não reposicionar pelo centro do
polígono inteiro, pois ele inclui a escadaria. A captura de estacionamento
agora usa o momento de parada do trem na plataforma para mostrar o acesso.
A verificação das compras passou de 0/4 a 4/4 tanto em desktop como em celular
emulado, incluindo saldo, vagas e preservação de todos os outros extras.
Relatório `test-results/complexo-3d/transporte-camera-report.json`.

A conferência visual também encontrou um segundo problema: no retrato, a
extremidade da estação ultrapassava a lateral da câmera. O enquadramento da
vista geral agora considera os vértices das plataformas, cobertura e escadas
compradas. Só recentra/afasta se esses pontos não couberem; não tenta incluir
os 620 m de trilho regional. Estádio sem estação e desktop que já comportava
os pontos conservam o enquadramento anterior. A planta/posição não foi movida.

Compilação passou em `/tmp/presidencia-metro-enquadramento-build.log`, com os
avisos existentes. A recaptura `captura-presidencia-complexo-transporte.cjs
--views-only` verifica o enquadramento, sem repetir compras já validadas;
relatório separado `transporte-enquadramento-report.json`. Passou em desktop
1280×960 e celulares emulados de 390×844 e 320×844: vértices de cobertura,
plataformas e escadaria dentro da tela, sem erros JS/WebGL. Capturas finais
`desktop-estacionamento-etapa4.png`, `mobile-estacionamento-etapa4.png` e
`mobile-320px-estacionamento-etapa4.png` substituem as versões sem estação ou
com corte lateral. A unidade de estacionamento também passou (quatro compras,
46 recusas atômicas, legado preservado). Sem repetição dos testes de física,
pois a planta e o transporte não foram alterados nesta correção.
Tudo local, sem commit, publicação ou alteração de conta real.

## Continuação — transporte e estacionamento por etapas

Incremento local em revisão, sem commit, push, deploy ou acesso à conta real.
O pedido seguinte acrescenta metrô em movimento, desembarque, pontos de ônibus
no bairro e estacionamento ampliado por compras. O acabamento continua sujeito
à referência original; a geometria funcional não equivale à aprovação da arte.

- O estacionamento tem quatro compras de **20 + 20 + 20 + 10 moedas**,
  conservando o total anterior de 70. Abrem os lotes sudeste, sudoeste, leste
  e noroeste, com **9, 16, 46 e 79 vagas acumuladas**, contadas na planta física.
  Cada lote adquirido tem ligação própria à rua; os futuros permanecem livres
  de construções/árvores e não recebem vagas antes da compra. Asfalto continua
  sendo uma melhoria separada; sem ele o piso do estacionamento é de terra.
- O campo opcional `estacionamentoInvestido` guarda 0/20/40/60/70.
  Compra antiga com `ext.estac` e sem esse campo continua integral, sem
  migração ou cobrança. Etapas intermediárias ainda não ganham `ext.estac`:
  renda de +4 e requisito da estação só chegam ao completar 4/4.
  A transação rejeita estado inválido, saldo insuficiente e clique de etapa
  já ultrapassada; devolve saldo/estádio juntos, sem alterar o objeto recebido.
- Metrô usa trilho físico e piso da composição alinhado à plataforma de
  8,38 m. A escadaria tem 36 espelhos de aproximadamente 22,83 cm, pisos de
  50 cm, largura de 3,6 m e patamar central de 1,8 m. O passageiro desce e
  segue pelo passeio até o portão lateral dos visitantes.
- Ônibus percorre uma via dedicada entre dois pontos do bairro, chega à
  parada frontal e abre a porta. O passageiro segue até o portão mandante.
  Metrô e ônibus partem depois de liberar o desembarque e retornam para
  embarcar o mesmo corpo; não ficam esperando todo o passeio com porta aberta.
- Uma van de teto alto entra pela portaria do primeiro lote, estaciona e
  recebe o passageiro de volta antes de sair. Portas, rodas e corpo são
  volumétricos; o NPC mantém a mesma identidade dentro e fora do veículo.
  **Limite:** a van ainda não é um dos carros da rodovia que muda de faixa
  para entrar. A ligação viária é física, mas essa conversão com prioridade
  sobre o tráfego geral continua pendente.
- Transporte, pedestres dos estabelecimentos e visitas às arquibancadas
  dividem uma única amostra de público exterior. Dados ausentes não criam
  torcidas; sem adversário real informado, o metrô não inventa visitantes.
  A amostra de revisão é explícita. Quando a demanda cai, quem já desembarcou
  conclui o trajeto; a inspeção registra essa saída pendente e não reutiliza sua
  vaga antes do retorno. `configure` conserva corpo, veículo e calendário;
  mudanças de passageiros só se aplicam na origem segura. O relógio do passeio
  e sua pausa não mudam o relógio oficial da partida ou seus 22 jogadores.
- A página isolada `qa-presidencia-complexo-3d.html` permite revisar as
  quatro compras e aproximar a câmera do metrô, ônibus e estacionamento.
  A ligação das novas compras ao reducer/UI foi preparada com a flag
  `PRESIDENCY_PARKING_STAGES_RELEASED=false`: a tela antiga não representa os lotes intermediários.
  Não ligar as etapas na carreira antes da integração visual correspondente.
  O handler novo aplica saldo, estádio e extrato juntos, respeitando a chave
  de acesso existente e o próprio gestor. Patrimônio considera o investimento
  parcial; o handler antigo recusa cobrar 70 novamente sobre uma obra parcial.
  Teste dos cases reais e da função de extrato passou, incluindo 18 recusas,
  outras contas, legado, patrimônio sem duplicação e round-trip JSON. Este
  teste não executa o Provider ou confirma autosave de uma conta real.

Compilação aprovada (`/tmp/presidencia-transporte-build.log`), com os avisos já
existentes de chunks/importações dinâmicas. Entorno aprovado nos nove cenários,
33 lotes de desenho e 290.561 triângulos no completo (teto de 300 mil somente
para o entorno; arquitetura/atores são contados separadamente). Os giros usam
arcos de raio 6 m no ônibus e 3,5 m na van; a orientação realmente renderizada
foi medida, com erro inferior a 1,2 cm pela discretização. Rodas conservam a
rotação entre movimento, parada e troca de calendário.

Teste de lifecycle aprovado: 466 quadros, incluindo idle→playing aos 180 s,
mesmo UUID/posição, retirada/reativação na origem, espera da vaga e descarte
único. Distribuição de público: 864 combinações e quedas de demanda com
saídas pendentes. Auditoria física final aprovada: 640 provas de separação,
44.946 quadros, 198 travessias de portas abertas com veículo parado, 4.544
quinas de sola, 75.800 verificações de corpo/carroceria e 1.048 rodas apoiadas.
A manobra da van não invade as demais vagas vendidas. Registro completo em
`/tmp/presidencia-transporte-final.log`; o contador das rodas foi reconferido
após a última correção.

`testa-presidencia-complexo-transporte-browser.cjs` passou em desktop e celular
emulado: três serviços nas fases desembarque/caminhada/portão/embarque, mesma
identidade, pausa, dados ausentes e mudança idle→playing sem salto. Canvas,
câmera e partida preservados; 22 jogadores, relógio oficial parado em 14 s
mesmo ao buscar outro instante do passeio. Compras 1–4 testadas no desktop e
primeira compra no celular; saldo, capacidade, estação não concedida e clique
antigo recusado. Nenhum erro JS/WebGL. Relatório:
`test-results/complexo-3d/transporte-browser-report.json`; imagens
`*-transporte-*-desembarque.png` e `*-estacionamento-etapa*.png`.

A inspeção das imagens encontrou cobertura escondendo parte do passageiro no
metrô. A vista foi corrigida para altura humana dentro da plataforma; ônibus
e van já mostravam corpo inteiro/porta/pés. A compilação após essa correção
passou (`/tmp/presidencia-transporte-final-build.log`). A captura direcionada
`captura-presidencia-complexo-transporte.cjs` passou no desktop e celular emulado,
sem erros JS/WebGL; corpo inteiro, porta e pés ficaram visíveis. Imagens finais
`*-transporte-metro-plataforma.png`, relatório `transporte-camera-report.json`.
Essas duas capturas substituem as primeiras do metrô para julgar a câmera.

As imagens continuam com acabamento simples de maquete; materiais, interior dos
veículos e iluminação sob a estação ainda precisam de refino para a fidelidade
à arte original. Não são aprovação final de arte ou medição num aparelho físico.
Toda esta continuação permanece local, HEAD `205f27a1`, sem commit/push/deploy;
nenhuma conta, autenticação real ou gravação em nuvem foi exercitada. A compra
por etapas permanece fechada na carreira até a troca visual correspondente.
Scripts novos: `testa-presidencia-estacionamento.mjs`,
`testa-presidencia-complexo-estacionamento.mjs`,
`testa-presidencia-complexo-fluxo.mjs`, `testa-presidencia-complexo-passeio.mjs`,
`testa-presidencia-complexo-transporte.mjs` e
`testa-presidencia-complexo-transporte-browser.cjs`,
`testa-presidencia-complexo-transporte-lifecycle.mjs` e
`testa-presidencia-estacionamento-carreira.mjs`.

## Continuação — acesso superior e destinos do bairro

Incremento local seguinte, sem commit/push/deploy ou acesso à conta:

- O primeiro andar conserva os seis percursos. Duas escadas internas, com
  patamar e corrimãos, ligam sua galeria à **primeira fila do segundo andar**.
  São 15 espelhos de 22,47 cm, pisos de 45 cm e largura livre de 1,6 m.
  Lajes, vigas, guarda-corpos e cadeiras recebem aberturas físicas; o camarote
  não é atravessado nem modificado. As duas caixas retiram 98 cadeiras, mantendo
  os IDs/posições das restantes. Arquitetura: 14.106 cadeiras, 22 malhas,
  185.732 triângulos distantes e máximo de 190.532 com detalhe próximo.
- A página QA oferece somente destinos construídos, incluindo `upper:0`.
  As outras filas superiores **ainda não têm percurso liberado**. Cada lado
  continua com uma visita ativa e uma reserva de assento. `supporterSide`
  separa a torcida superior por localização, mesmo compartilhando o setor de
  investimento `camarote`; reservas e lotes de cor descontam o lado correto.
- Loja, hotel e choperia comprados recebem até um pedestre cada. O teto total
  é três, limitado ao público exterior real quando há dados da carreira.
  Entrada, espera e retorno usam o mesmo corpo, os pisos e os vãos reais;
  a oclusão é feita pela geometria, sem sumir por opacidade. A choperia usa
  o ramal norte existente para não cruzar as faixas da torcida visitante.
- Terreno residual com asfalto ganhou variação suave e ampla de verdes,
  sem alterar ruas, objetos, alturas ou percursos. Textura de 512² cobre
  1024 m e conserva o relevo fino separado; custo adicional aproximado de
  1,33 MiB com mipmaps e um lote/material. Várzea preservada.

Verificações puras aprovadas: arquitetura em 11 estados, LOD nos oito acessos,
235.936 cantos de sola nas rotas reais (84.912 superiores), 14.764 verificações
de alcance das pernas, 101.964 sondas sintéticas e 921 externas. Circulação:
cinco minutos a 20 Hz, 1.464 quinas de sola, separação geométrica entre os três
destinos, carros e faixas das torcidas, compras isoladas/bloqueios/demanda/pausa.
Torcida sentada/reservas e adaptador da carreira passaram; entorno em nove
cenários e paisagismo em quatro também passaram.

`testa-presidencia-complexo-superior-browser.cjs` passou no desktop e no celular
emulado: subida/patamar/assento/descida por ambos os acessos, mesma reserva/rig,
três destinos nas fases entrada/interior/saída, câmera/canvas/pausa preservados,
22 jogadores e relógio oficial parado em 14 s durante as buscas do passeio.
Voltar ao primeiro andar remove a opção superior; várzea não inventa cadeiras,
edifícios ou visitas. Relatório: `test-results/complexo-3d/superior-destinos-report.json`.
Capturas inspecionadas: `*-superior-*-{climbing,seated}.png`,
`*-hotel-entrada.png`, `*-chopp-entrada.png`. Zero erros JS/WebGL na rodada.

Auditoria adicional de 752 posições de câmera não encontrou ocultação do
tronco/cabeça. Alguns pés ficam naturalmente atrás de cadeiras/corrimãos.
Nessas primeiras capturas o concreto apareceu granulado; a iluminação sob a
cobertura também é simples. São revisão funcional, **não acabamento aprovado**. A cena
continua isolada da interface real da carreira; teste emulado não mede o
desempenho do celular de Diego. Gate de acesso preservado para futura revisão
somente por `diego.c.fonseca@gmail.com`.

Refino seguinte do concreto (após as capturas funcionais acima): grão de
aproximadamente 0,98 mm, contraste reduzido e UVs métricas por face, inclusive
nas superfícies oblíquas. Textura adicional de cerca de 0,33 MiB com mipmaps,
sem nova malha. Snapshot de 11 estados confirmou identidade de posições,
normais, índices, instâncias, assentos e acessos; madeira, pedra e luzes
conservadas. `testa-presidencia-complexo-concreto.mjs` passou, medindo 87.498
triângulos (55.421 oblíquos), albedo, filtros, contraste e descarte.

Compilação após o refino aprovada (`/tmp/presidencia-superior-final-build.log`,
avisos de chunks/importações dinâmicas já existentes). Captura curta final
`captura-presidencia-complexo-superior.cjs` passou em desktop/celular emulado,
sem erros JS/WebGL nem amostras inválidas de luz; mesmos personagens e apoios.
Imagens `*-acabamento-superior-{original,climbing,seated}.png`, relatório
`acabamento-superior-report.json`. Inspeção confirmou remoção do grão grosso
e preenchimento do enquadramento pelo bairro; materiais, iluminação e vegetação
ainda têm aparência de maquete diante da arte aprovada. Não declarar fidelidade
visual concluída. `git diff --check` passou; HEAD permanece `205f27a1`.

## Continuação anterior — filas intermediárias, acompanhamento e dados da carreira

Incremento local seguinte, ainda sem commit/push/deploy:

- Cada entrada agora oferece destinos nas filas **0, 5 e 10 do primeiro andar**.
  São seis opções físicas, com apenas **um NPC ativo por lado**, para não colocar
  três pessoas no mesmo corredor. A amostra continua reservando somente as duas
  cadeiras efetivamente usadas e descontando-as da torcida estática.
- As rotas reaproveitam a escadaria existente, com espelhos de 24 cm e patamares
  de 45 cm. Os polígonos de apoio vêm das faces realmente desenhadas. Isso corrige
  frestas nos metadados e evita declarar chão onde o pé não tem apoio.
- A passada ocupa cada patamar; margem considera a largura da sola, afastamento
  dos pés e curvatura da escada. O quadril se ajusta sem alongar coxa/canela.
  Giro junto à cadeira usa o espaço real disponível na fila, não uma posição
  frontal fixa que deixava um canto do pé sem piso.
- Botões de acompanhamento deslocam câmera e alvo junto com o corpo ao entrar,
  subir, sentar e sair. Arrastar a cena libera o acompanhamento. Trocar o destino
  conserva a câmera e cancela o acompanhamento antigo. A página QA permite
  escolher as três filas; padrão na fila intermediária. O relógio do passeio
  segue separado do relógio oficial da partida.
- `presidencia-complexo-carreira.ts` prepara dados de leitura para a nova cena:
  estádio e carteira do próprio gestor, dia/torcida fornecidos pelo chamador,
  partida vinculada ao estádio e adversário identificado explicitamente pelo
  ID da mesma partida. Sem dados válidos, não inventa público nem patrimônio.
  O objeto de partida mantém a referência e o relógio originais.
- O adaptador preserva `careerPresidentBase` v5, suas 33 roupas, tons, acessórios,
  mandato, identidade e conquistas. Usa as mesmas camadas/poses existentes.
  A fixture `qa-presidencia-complexo-carreira.html` exercita compras, troca,
  revenda e vestuário sobre uma carreira fictícia, pelas transações reais do
  modelo. Não importa autenticação, não salva a conta, não modifica o gate e
  não põe um presidente genérico no camarote. O retrato continua separado da
  cena física até haver um corpo 3D fiel e aprovado.

Verificações puras aprovadas: arquitetura em dez estados com vizinhos ocupados;
LOD nas seis opções; 151.024 verificações de solas nas rotas reais, 45.320 em
escadaria sintética de 22 espelhos e 921 raycasts externos. Nenhuma geometria
adicional no estádio: máximo permanece 189.868 triângulos/22 malhas. Nas filas
altas, o detalhe seleciona apenas cadeiras no enquadramento (29 mandantes/44
visitantes no teste), respeitando o limite de 96 e incluindo a cadeira desejada.
Adaptador aprovado com 165 visuais (33 roupas × 5 tons), aparência antiga,
compras/trocas/revendas, ausência de dados e preservação do gestor/relógio.
Torcida sentada/reservas e compilação também passaram; log da compilação em
`/tmp/presidencia-filas-carreira-build.log`, com os avisos de chunks já existentes.

`testa-presidencia-complexo-visitas-browser.cjs` passou no desktop e no celular
emulado: 24 quadros de acompanhamento por aparelho (3 filas × 2 lados × 4 fases),
mais entrada/subida/sentar/levantar/saída, pausa, gesto que libera câmera, relógios
independentes e ausência de cadeiras/visitas inventadas na várzea. Inspeção visual
feita nas capturas de subida e sentado da fila 10 e na subida intermediária:
`*-visita-*-fila10-*.png` e `*-visita-*-climbing.png`. Viewport 1248×710 no desktop
e 370×641 no celular, sem cortar o corpo durante a subida. Zero erros JS/WebGL.

A revisão adicional encontrou e corrigiu uma interrupção: chegada/saída dos
visitantes recriava também o torcedor da casa. Agora cada rig é reconciliado por
rota/cor e apenas o ator substituído perde seu acompanhamento. O teste integrado
`testa-presidencia-complexo-carreira-browser.cjs` passou depois dessa correção,
no desktop e no celular emulado. Cobriu compra/troca, poses e camadas carregadas,
relógio oficial de 14→27 s, preservação do torcedor/câmera da casa ao adicionar e
remover visitantes, 22 jogadores também na várzea, ausência de dados e descarte.

A primeira tentativa de carregar a fixture revelou timeout do retrato durante a
inicialização pesada do Three. IDs, arquivos e dimensões estavam corretos, sem
404 ou erro JS. A fixture agora aguarda a primeira prontidão do retrato antes de
montar o cenário; trocas posteriores de roupa/pose conservam o mundo. O componente
original, as artes e seu prazo de carga não foram alterados. A rodada final
carregou ambos os retratos de primeira, sem precisar retentar.

Capturas finais inspecionadas: `*-carreira-personagem-{em-pe,sentado}.png` e
`*-carreira-camarote-compras.png`; relatório `carreira-browser-report.json`.
Compilação após a reconciliação dos atores aprovada em
`/tmp/presidencia-filas-carreira-final-build.log`; `git diff --check` aprovado.
Gate e telas reais da carreira permanecem intactos nesta rodada. Nenhum commit,
push, deploy, login real ou gravação na conta. Os testes de celular são emulação,
não medição de desempenho do aparelho de Diego.

Ainda faltam acessos ao segundo andar e aos demais estabelecimentos, personagem
físico, acabamento fiel à arte original e substituição controlada na carreira.
O adaptador não equivale a integração na tela real ou teste da conta de Diego.

## Continuação — acesso até a cadeira e mobília no camarote

Incremento local de 12/10, acumulado sem commit/push/deploy:

- Escadas agora seguem ângulos fixos entre as filas. Dois corredores térreos
  recortam realmente cadeiras, concreto e vigas: frontal para mandantes e lateral
  para visitantes. Cada acesso habilitado fornece uma cadeira da primeira fila,
  os pontos do percurso e superfícies de apoio, a partir da arquitetura construída.
- `presidencia-complexo-visita.ts` liga as vias externas ao portão, aos dois
  degraus de 14,5 cm e à cadeira. O mesmo personagem sem rosto anda, sobe, vira,
  senta, permanece, levanta e retorna. Cada sola alterna apoio real; o ciclo fecha
  na origem, sem teleporte. O tempo vem do passeio existente, não de outro timer.
- Há **uma visita completa por lado habilitado**, dentro da amostra proporcional
  já existente. Sua cadeira é reservada e descontada do público estático; não há
  ocupante duplicado. Máximo combinado: 798 estáticos + 2 visitas = 800.
  QA completo atual: 527 estáticos + 2 visitas = 529. Os pedestres antigos desse
  lado deixam de usar o mesmo corredor. Sem dados ou sem acesso construído, não
  se cria visita a uma cadeira inexistente. Demais trajetos/andares ainda pendem.
- As primeiras aproximações mostraram cadeiras planas demais. O detalhe por
  distância agora substitui até 96 delas por assento sólido, encosto curvo fechado
  com cantos superiores chanfrados e dois suportes no piso. IDs, cores, alturas e
  orientações são os mesmos. A cadeira simples é retirada enquanto a detalhada
  aparece e volta ao afastar a câmera, sem duas representações sobrepostas.
  Duas malhas compartilhadas, 56 triângulos por cadeira próxima; estádio completo
  fechado: 185.068 triângulos ao longe e 189.868 no máximo do detalhe, 22 malhas.
  Câmera parada não refaz seleção/matrizes. Testes de 20 órbitas/zoom/restauração,
  descarte e solas/passagens contra as cadeiras detalhadas passaram.
- Atualizar torcida preserva câmera, API, canvas, pausa e os segundos do passeio.
  Mudança apenas em carros/fonte mantém o rig quando os acessos/cores são os mesmos.
  O relógio da partida continua separado do passeio e recebido do motor existente.
- `presidencia-complexo-mobilia.ts` lê a carteira validada, sem comprar nem conceder
  bens: 13 IDs de mobília, respeitando substituição/revenda e um item por slot.
  Carteira ausente/inválida não monta objetos. Sem camarote construído, bens seguem
  guardados. Veículos continuam na garagem. Não foram inventados troféus,
  identidade de clube nem um personagem substituto para o presidente.
- A nova vista Sala da Presidência fica a 2 m do piso. Mesa/cadeira/tapete,
  estantes, sofá e demais móveis têm apoio físico; corredor, porta e janela ficam
  livres. O conjunto máximo tem 10 móveis, 34 malhas e 11.012 triângulos.
- A primeira captura revelou móveis escuros. Duas luminárias fixas embutidas no
  forro iluminam a sala com cones limitados e sombras atualizadas ao trocar móveis;
  exposição/sol/campo externos foram preservados. Não correspondem aos itens
  compráveis luminária/lustre. O enquadramento de visita no celular foi afastado
  após a primeira captura cortar os pés durante a subida.

Verificação concluída nesta etapa: arquitetura em 10 estados; circulação anterior
em cinco estados; torcida sentada/reservas; 7.140 amostras de animação, 45.368
verificações de sola nos acessos e 921 raycasts nas vias externas; 29 casos de
mobília com transações reais do modelo. Os testes de navegador
`testa-presidencia-complexo-mobilia-browser.cjs`,
`testa-presidencia-complexo-visitas-browser.cjs` e
`testa-presidencia-complexo-publico-lifecycle.cjs` passaram depois das correções.
São fixtures locais e celular emulado, não a conta nem o aparelho físico de Diego.
Capturas em `test-results/complexo-3d/*-mobilia-sala-*.png` e `*-visita-*.png`;
relatórios `mobilia-browser-report.json` e `visitas-report.json`.
A rodada final de visitas foi repetida após integrar o detalhe das cadeiras e
passou novamente: mesmo rig, cadeira próxima detalhada, apoio, pausa, relógios,
várzea e ausência de erros JS/WebGL. Capturas finais inspecionadas visualmente:
viewport 1248×710 no desktop e 370×641 no celular, sem cortar os pés na subida.
Compilação final aprovada em `/tmp/presidencia-visitas-final-build.log`, com avisos
já existentes de chunks/imports mistos; checagem TypeScript e `git diff --check`
aprovadas. Uma desconexão transitória do executor foi recuperada; o teste terminou
com sucesso, não ficou bloqueado. Nenhum commit, push, deploy ou acesso à conta real.

**Limites preservados:** não há rota completa para todas as cadeiras/andares nem
para todos os estabelecimentos. O presidente continua no fluxo existente, ainda
sem integração física ao camarote. O acabamento de bonecos, cadeiras, materiais,
vegetação e edifícios continua mais simples que a referência; testes não equivalem
à aprovação visual. A reconstrução inteira permanece na página QA e não foi
substituída na carreira, publicada ou testada com login real. Gate de Diego intacto.

## Continuação — acabamento próximo e torcida nas cadeiras

Incremento local posterior ao paisagismo, sem commit ou publicação:

- Corrigidos troncos sem contato com o terreno e acessos das casas ao norte que
  atravessavam as próprias casas. Essas fachadas agora olham para a rua correta.
  Árvores usam quatro silhuetas com normais suaves e variação de cor; telhados
  alternam duas/quatro águas, e 40 fachadas próximas ganharam relevos e soleiras.
- Texturas de superfície de 512 px, UVs em metros e relevo discreto para o zoom.
  A primeira captura revelou faixas na terra/grama: removida a variação larga
  que se repetia a cada quatro metros, mantendo o detalhe fino. A última rodada
  `*-paisagismo-*.png` já inclui essa correção.
- A várzea recebeu mistura de vegetação rasteira e solo exposto no terreno físico,
  com cores por vértice em coordenadas do mundo, sem repetir uma imagem de fundo.
  São 1.530 triângulos adicionais somente antes do asfalto; nenhum obstáculo,
  estabelecimento, gramado de jogo ou compra foi adiantado. Lotes futuros livres.
- Vitrinas do anexo fechadas nas laterais, perfis e iluminação nas entradas,
  madeira e caixilhos no camarote, com vidro mais neutro para olhar o campo.
  São acabamentos fixos; não foram concedidos móveis de compra ao usuário.
- A arquitetura exporta cada cadeira construída em `architecture.seats`:
  ID estável, setor, andar, fila, posição do piso, orientação e altura do assento.
  A torcida usa esse contrato, sem recalcular a oval ou criar cadeiras nas obras.
- `presidencia-complexo-torcida.ts` acrescenta figuras sentadas sem olhos, nariz
  ou boca, com quadril no assento e solas no degrau. Mandantes ocupam setores da
  casa; visitantes exigem dados próprios e ficam no setor visitante existente.
  A carreira reutiliza `publicoDoEstadio`, inclusive chuva, lotação e intervalo.
  Sem dados ou sem arquibancadas, não aparece público sentado implícito.
- Limite visual de 800 pessoas, 243.200 triângulos e 12 grupos de instâncias no
  estádio completo. QA explícito em 70%/50% gera 528 pessoas e 160.512 triângulos.
  Trata-se de amostra visual, não do total de ingressos ou torcedores da carreira.
- Dados de público atualizam atores/instâncias sem reconstruir o mundo. Câmera,
  canvas, pausa, segundos do passeio e relógio oficial da partida são preservados.
  Percursos só são refeitos quando suas contagens/fonte mudam. O fallback QA
  implícito foi retirado; a página local usa `qaPopulation: true` explicitamente.
- Botão Arquibancada aproxima uma cadeira física ocupada; desaparece nas etapas
  sem cadeiras. O campo, a sala e os portões usam a mesma estrutura e profundidade.

Conferência: testes puros da arquitetura (9 estados), entorno (9), paisagismo
(4), torcidas nos portões (5) e torcida sentada (8 estados + updates/dados/apoio)
passaram. Máximo atual: arquitetura 186.720 triângulos/20 malhas; entorno
289.673/34. O novo teste `testa-presidencia-complexo-publico-lifecycle.cjs` passou
no Chromium preservando câmera/API/canvas/relógios/pausa e sem recriar instâncias.
`testa-presidencia-complexo-acabamento.cjs` passou no desktop e celular emulado,
com 16 capturas de mapa, região, portões, camarote, torcida, loja e várzea.
Após corrigir a textura, `testa-presidencia-complexo-paisagismo-browser.cjs`
passou novamente nos dois formatos. Vistas próximas em `*-acabamento-*.png`;
mapas gerais mais recentes em `*-paisagismo-*.png`, no diretório de test-results.
Build final aprovado após o terreno natural (`/tmp/presidencia-acabamento-build.log`),
com os avisos existentes de imports mistos; `git diff --check` limpo. Nenhum commit,
push, deploy, gravação em conta real ou alteração do gate de Diego.

Limites registrados naquele incremento: torcida sentada ainda estática e
interior sem mobília. A continuação acima resolve duas visitas e a leitura de
móveis; rotas completas de todos os estabelecimentos, personagem no camarote,
integração à carreira e medição em celular físico continuam pendentes. A comparação ainda mostra materiais, vegetação e edifícios mais simples
que a arte original; teste técnico não constitui aprovação de fidelidade visual.

## Continuação — vazios de terra entre bairros e região ampliada

Pedido seguinte de Diego: preencher as grandes áreas bege com ruas, árvores,
parques e contexto urbano. Implementado na mesma revisão local, mantendo o
estádio oval e todas as etapas/obras anteriores:

- Praças públicas nos intervalos entre as duas malhas de bairro, com vegetação,
  bancos, passeios e ruas nas bordas. Cinturões de árvores tratam os espaços
  irregulares e o terreno atrás da arena. Não são compras concedidas ao clube.
- O terreno físico passou de 1040×1160 para 1800×2600 m. Um parque regional com
  passeios e árvores continua além dos bairros, cobrindo a vista afastada em
  retrato; o limite antigo do terreno aparecia no topo dessa câmera.
- Os passeios regionais norte/sul ligam às calçadas por acessos com inclinação
  suave de 0,16 para 0,03 m, sem degrau. A proteção das árvores inclui essas
  ligações. Ruas são verificadas também nas extremidades para não terminarem
  dentro de uma reserva de construção junto à estação.
- A névoa agora considera a distância da câmera ao mapa. Antes, afastar para
  enquadrar o celular tornava o próprio estádio esbranquiçado.
- Vegetação/regiões distantes usam copas mais leves e quatro grupos espaciais.
  Assim os testes de chão/corpo perto do estádio descartam o bosque distante
  pelas caixas dos grupos, sem percorrer cada triângulo. Limites de regressão:
  300 mil triângulos e menos de 50 malhas no entorno, incluindo o parque.
  Isso não comprova FPS ou fluidez em um celular físico.
- A revisão encontrou um problema anterior: seleção pelo centro das casas e
  árvores permitia invadir bordas da estação, estacionamentos e caminho futuro
  da estação. Agora a seleção considera margem para o volume, todos os quatro
  estacionamentos e os corredores, inclusive antes das compras. Os jardins,
  fonte, praça de acesso e lotes futuros ficam reservados permanentemente.
- Os lotes ainda não construídos dentro do clube conservam terreno natural nas
  etapas iniciais. O paisagismo público não concede asfalto, gramado, edifícios
  ou obras. A continuação acima acrescentou variação de solo/vegetação rasteira.

Regressões: `testa-presidencia-complexo-paisagismo.mjs` verifica superfícies reais,
volumes dos personagens/carros, portas, campo/bancos/redes e áreas completas das
reservas futuras; inclui obstrução negativa sem colisor lógico. Estacionamentos
admitem copas altas do paisagismo comprado, mas não troncos no volume dos carros.
Capturas em `test-results/complexo-3d/{desktop,mobile}-paisagismo-*.png`;
`testa-presidencia-complexo-paisagismo-browser.cjs` confere vistas original/região,
várzea sem bens concedidos, iluminação e viewport. Não confundir capturas da
reconstrução com mudanças já publicadas na conta de Diego.

Conferência final do paisagismo: PASS no teste espacial dos quatro estados
(vazio/asfalto/estacionamento/completo), nos nove estados do entorno, na circulação
e nas cinco etapas das torcidas. As 72 praças e os seis percursos regionais estão
conectados na auditoria geométrica; os dois trechos isolados junto à estação foram
retirados. O teste espacial inclui agora as duas rampas e suas extremidades.
Máximo final do entorno: 286.793 triângulos em 34 malhas. Preservadas as palmeiras
do jardim comprado; só o cipreste que ocupava vagas foi excluído.

Navegador final: PASS desktop e celular emulado, seis capturas atualizadas e
`paisagismo-report.json`, sem erros de página/iluminação e sem compras concedidas
na várzea. `npm run build` PASS, mantendo os avisos já existentes de chunks e
importações; log `/tmp/presidencia-paisagismo-build.log`. `git diff --check` limpo.
Sem commit, push, deploy, gravação em conta real ou alteração do gate de Diego.

## Correção solicitada depois da primeira reconstrução — formato oval e torcidas

Diego rejeitou o contorno retangular. A decisão atual substitui as orientações
anteriores sobre rampa/carro diante do escritório: estádio mais oval, sala como
**grande camarote dentro do estádio**, sem rua subindo até ela nem carro na frente.
A casa do presidente é uma ideia futura, não faz parte desta entrega.

- Fachada, arquibancadas e cobertura agora seguem contornos elípticos. A abertura
  interna foi ampliada para preservar o campo de 105×68 m, redes e bancos norte;
  não se limitou a arredondar a cobertura. As folhas do retrátil fecham o vão oval.
- Camarote integrado à frente/sul, 42×14 m, piso em 9,1 m, vidro voltado para o
  gramado. Substitui parte da arquibancada superior. Surge com investimento em
  Camarote após o primeiro anel, sem conceder obras. A câmera entra nesse volume.
  A mobília e o personagem da sala antiga ainda não foram migrados para ele.
- Mandantes: portão frontal/sul em (0,82). Visitantes: portão lateral/leste em
  (105,6). Vãos, paredes laterais, teto do túnel e piso existem na geometria.
  `PLANTA_COMPLEXO.gates` é o contrato compartilhado com caminhos e câmeras.
- As rotas contornam canteiros/fonte e percorrem corredores exclusivos. Chegada
  e saída usam faixas paralelas, inclusive nas curvas, com o mesmo cálculo no
  piso e na rota. Não há teleporte nem sumiço por opacidade dentro do portão.
- Preparação dos caminhos confere chão, colisores e a geometria real de arquitetura
  e entorno na largura/altura do corpo. A exceção ao bloqueio antigo da arena só
  vale dentro dos dois corredores físicos; não libera atravessar arquibancadas.
- A circulação aceita dados existentes de torcida/dia por leitura. Máximo visual
  atual: três mandantes e dois visitantes; visitante real só com dados do adversário.
  A página local continua **amostra QA**, com um torcedor de cada lado, além da
  visita à loja e trânsito. Ainda falta distribuir e acomodar o público nas cadeiras
  e conectar essa reconstrução à carreira real. Não confundir amostra com lotação.
- `SalaMontagem` deixa de sobrepor os carros à janela. Veículos, propriedade,
  seletores, garagem e economia permanecem. Textos da garagem foram ajustados.
  As artes raster aprovadas continuam guardadas, inclusive as rampas nelas pintadas;
  a retirada da subida é física na reconstrução nova, ainda não publicada.

Teste novo: `node scripts/testa-presidencia-complexo-torcidas.mjs`: cinco estados
(várzea, parcial, primeiro anel, camarote parcial e completo), cinco minutos por
estado, cinco torcedores, chegada/permanência/saída, distância entre pessoas, 300
conferências de solas, contorno real da fachada e vista do camarote. Uma parede
inserida no portão bloqueia sua torcida sem bloquear a outra. Também confere que
não é inventada torcida real visitante quando só há dados do mandante.

Capturas específicas: `test-results/complexo-3d/{desktop,mobile}-oval-*.png`.
Teste de navegador: `scripts/testa-presidencia-complexo-acessos.cjs`; verifica
câmera dentro do camarote, portões no enquadramento, dois trajetos, shaders e
várzea sem obras concedidas. Os testes não constituem aprovação visual de Diego.

### Conferência final desta correção

- Modelo, arquitetura, entorno, circulação anterior e partida continuam aprovados.
  Arquitetura oval com teto fechado: 163.188 triângulos / 17 malhas, sem contar
  entorno/atores. Esses números não são uma medição de desempenho no celular real.
- `testa-presidencia-complexo-acessos.cjs`: PASS desktop e celular, incluindo
  enquadramento dos portões, câmera dentro do camarote, dois torcedores e várzea.
- `testa-presidencia-complexo-enquadramento.cjs`: PASS, ambos os gols no modo
  aberto, câmera sob a cobertura fechada, circulação e iluminação sem NaN.
- `testa-presidencia-complexo-browser.cjs`: PASS nos dois formatos, 21→22 atletas,
  velocidades 0,25×/0,5×/4×, pausa, câmera preservada, pinça, gol e requisitos do teto.
- Sala existente: `testa-presidencia-clube-v69.cjs` passou, sem mutar os dados ao
  abrir a sala e ir ao estádio; autenticação apenas simulada na fixture.
- A inspeção visual detectou depois uma superfície de terra aparecendo sobre o
  gramado na câmera baixa com teto fechado. A face superior escondida da base do
  campo foi removida; laterais de terra, área externa, altura do gramado e jogadores
  foram mantidos. Não há piso duplicado a 22 mm do gramado. Partida passou novamente
  em 136 quadros; `testa-presidencia-complexo-gramado.cjs` passou no desktop/celular,
  conferindo pixels do gramado projetados da cena. `npm run build` e
  `git diff --check` também passaram após a correção. Capturas atuais desse caso:
  `desktop-gramado-teto-fechado.png` e `mobile-gramado-teto-fechado.png`.
- As capturas anteriores `*-refino-dentro-teto.png` documentam a falha antiga;
  usar as capturas `*-gramado-teto-fechado.png` para avaliar a correção final.

Executar build e edições fora da bateria de navegador: recarregamento do Vite pode
invalidar o contexto durante uma captura. Uma execução foi interrompida por esse
recarregamento; a repetição com fontes congeladas passou. Sem commit/push/deploy.

## Estado e acesso

- Workspace `/workspace/presidencia-publicacao`, branch `deploy/presidencia-20261012`,
  HEAD `205f27a1`. Trabalho anterior preservado, sem commit, push ou deploy neste lote.
- Página de revisão: `qa-presidencia-complexo-3d.html`, no Vite local em 4196.
  Compras e partidas dessa página são fixtures. Não alteram saldo, conta ou save.
- O renderer novo não está importado pela tela do jogo. O gate existente de Diego
  continua preservado; isso não significa que o novo complexo foi testado na conta dele.
- Primeira rua 3D continua disponível separadamente; agora há uma reconstrução do
  complexo inteiro para corrigir e comparar, não apenas aquele trecho.

## O que está implementado

- `presidencia-complexo-model.ts`: catálogo das 16 obras existentes, mesmas chaves
  e progresso financeiro. Mantém posse legada; renderiza a cobertura somente após
  primeiro e segundo andares e gramado concluídos. Não cria economia paralela.
- Campo oficial 105×68 m. Homografia entre a planta original e o chão em metros;
  portas e rotas conservadas. Dimensões arquitetônicas inferidas ficam explicitamente
  separadas dos bloqueios conservadores de navegação. As máscaras da imagem não são
  tratadas como pegadas de edifícios.
- `presidencia-complexo-arquitetura.ts`: arquibancadas em módulos proporcionais às
  compras, segundo anel, pilares/vitrinas, camarote e entradas térreas, cobertura,
  trilhos/folhas retráteis, refletores e telão. Bancos e campo livres de estruturas.
- `presidencia-complexo-entorno.ts`: terrenos, ruas, passeios, estacionamento,
  loja, choperia, praça, hotel e estação dependentes das compras; vãos e interiores
  geométricos. Bairros de fundo, jardins e palmeiras. Colisores físicos próprios.
- `presidencia-complexo-partida.ts`: reutiliza o campo e os personagens originais,
  quadro e relógio compartilhados. Sem partida válida, não inventa 22 atletas.
  Com partida, conserva jogadores, bola, árbitro, técnicos e reservas reais recebidos;
  bancos na lateral norte. Não cria gols, placares ou estatísticas.
- `presidencia-complexo-circulacao.ts`: amostra local pequena de torcedores, pedestre e carros,
  com validação de piso, segmentos, portas e obstáculos físicos. Não representa ainda
  a distribuição completa da torcida do usuário pelo novo mundo 3D.
- `presidencia-complexo-3d.tsx`: um renderer, uma cena, profundidade/sombras, zoom,
  órbita e deslocamento, viewport grande e entrada de estado somente de leitura.
  Pausar passeio não altera o relógio da partida. Reflexo estático exclui atores.
- Janela original: `presidencia-estadio-camadas.ts` passou a mostrar também setores
  completos comprados fora da sequência da imagem-base. Clipes e artes aprovadas
  conservados, sem duplicar o estádio já completo.

## Comparação visual e correções

A primeira captura mostrava cobertura uniforme larga demais, escondendo o campo,
ruas claras por sobreposição com passeios, poucos quarteirões e terreno muito vazio.
A cobertura foi reaberta no eixo norte/sul, as testeiras rebaixadas, mantendo abas
laterais altas. Ruas e calçadas passaram a ocupar faixas separadas; o batching passou
a conservar quais objetos projetam sombras. Foram ampliados os quarteirões e o
paisagismo frontal. Isso não equivale a acabamento fotográfico igual ao original.

Na última passagem, o anexo recebeu piso e interiores recuados, vidro mais claro,
jardins em camadas e espessura na cobertura. Os bairros norte/sul receberam quatro
tipos de edifícios. O enquadramento móvel foi elevado para ocupar a tela com o mapa;
“Ver campo” passou a enquadrar ambos os gols no retrato e entrar sob o teto fechado.
O buffer de profundidade logarítmico removeu as faixas indevidas que apareciam no
gramado distante por sobreposição dos pisos. Postes dos refletores agora aparecem
com Geral concluída mesmo sem gramado; a regra de iluminação foi preservada.

As capturas finais `desktop-refino-*` e `mobile-refino-*` mostram esses ajustes.
O visual ainda é uma maquete mais simples que a arte original: fachadas, vegetação,
densidade/variedade urbana, iluminação e materiais continuam abaixo da referência.
Não interpretar a conferência técnica como aceitação do acabamento.

Capturas e resultados locais em `test-results/complexo-3d/`. Conferir imagens, não
usar somente contagem de polígonos ou testes de regras como aprovação de fidelidade.

## Verificações da primeira passagem e limites

- Modelo: 131.072 combinações de obras/teto e 5.184 conversões de coordenadas.
- Arquitetura: nove estados, módulos parciais, andares, campo/bancos e portal livres,
  piso do anexo, refletores antes do gramado, geometria finita e descarte de recursos.
  Teto fechado: 188.786 triângulos e 17 malhas.
- Entorno: nove estados, compras isoladas, portas físicas, pisos, sombras e descarte.
  Completo: 168.739 triângulos e 23 malhas.
- Circulação: cinco minutos a 20 Hz, pedestre ativo entrando/esperando/saindo da
  loja, dois carros em faixas próprias, 122 conferências de solas por raycast,
  quatro rodas apoiadas, sem colisões e pausa estável. Inclui loja antes do asfalto.
- Partida: 136 quadros com matrizes/poses dos 22 atletas e instâncias, árbitro/bola,
  pausa, gols dos dois lados, substituições, reservas, isolamento e descarte.
- Janela: 2.048 combinações parciais/completas, fora da ordem e legadas.
- Browser desktop/celular: várzea/completo, 21→22 atletas, mesma partida/relógio
  em 0,25×/0,5×/4×, pausa, câmera/canvas preservados, zoom/pinça, gol, teto e
  ausência de overflow/erros. Resultado em `browser-report.json`.
- Conferência final após os ajustes visuais: ambos os gols enquadrados, câmera
  dentro do teto fechado, NPC/carro ativos, reflexos sem NaN, zero erros; mapa
  1368×740 no desktop e 370×641 no celular. `enquadramento-report.json`.
- `npm run build`, TypeScript e `git diff --check` aprovados. O build conserva
  avisos existentes de tamanho de chunks/imports mistos. Não confundir Chromium
  de teste com desempenho medido no celular físico de Diego.

## Pendências que continuam reais

1. Acabamento visual: densidade urbana, vegetação, volumes dos estabelecimentos,
   materiais, luz e detalhes próximos ainda precisam se aproximar da arte aprovada.
   Não declarar fidelidade concluída enquanto a comparação visual mostrar diferenças.
2. Integrar a população proporcional à tela real da carreira e ampliar as rotas
   completas: há uma visita por lado até a primeira fila e reserva sem duplicação.
   Demais cadeiras/andares e estabelecimentos ainda precisam de percursos físicos.
   A revisão local não equivale a integração ou teste na conta real.
3. Integrar o personagem e os dados reais da sala da Presidência ao camarote.
   Mobília já lê a carteira validada na revisão local; não há presidente físico
   substituto. Camarote parcial na janela raster ainda não tem recorte específico
   aprovado e não foi inventado neste lote.
4. Rever todas as compras por clique em tela e todas as vistas móvel/desktop,
   incluindo qualidade de perto e dispositivos reais.
5. Só integrar a substituição visual após atingir a referência, mantendo a liberação
   inicial exclusiva de Diego e a publicação acumulada para o final, conforme pedido.

Não perder requisitos anteriores: personagens sem olhos/nariz/boca; partidas e
velocidades compartilhadas; ruas coerentes; nenhum NPC por cima de estabelecimentos;
mapa grande sem margens verdes vazias; estádio evolui até o mesmo projeto completo.
