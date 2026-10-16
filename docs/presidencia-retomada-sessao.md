# Retomada da Presidência, estádio evolutivo e NPCs

Prioridade mais recente de **16/10/2026 — jogadores e NPCs sem rosto**:
ler [acabamento dos humanos](presidencia-humanos-acabamento-20261016.md).
Corpos, roupas, cabelo e calçados foram refinados no campo, ruas, visitas,
passageiros e torcida. Sem olhos, nariz ou boca. A mesma branch preserva o
trabalho anterior da sala e do motor; alterações locais, sem novo deploy.
Capturas em `test-results/humanos-20261016/`.

Continuação anterior de **16/10/2026 — personagem original na sala**:
Diego rejeitou o boneco geométrico. Ler
[a correção com as artes do criador](presidencia-personagem-original-20261016.md).
Sala e janela permanecem 3D; o personagem reutiliza os mesmos WebP, poses e
camadas da criação, com profundidade na cena. Não é uma nova interpretação
volumétrica da aparência. Trabalho local, sem novo deploy; futebol preservado.

Continuação de **16/10/2026 — jogadas oficiais em movimento**:
ler primeiro [jogadas contínuas](presidencia-jogadas-continuas-20261016.md).
O plano agora inclui domínio, passe, condução e chute com participantes em
movimento, alvos variados e narração por fase. Build, contato geométrico,
dez reposições, relógio/navegador e 40 capturas 3D passaram. A bola tem painéis
esféricos legíveis; condução e retorno após o lance foram corrigidos. O vídeo
revelou um passe atravessando o quadril: corrigido com giro do recebedor,
832 medições na malha real sem penetração e novas capturas. Ainda
faltam tipos de incidentes, acabamento e física completa, conforme o registro.
Não há novo commit/deploy. Os registros abaixo preservam o histórico e os
limites de cada entrega.

Atualização de **16/10/2026 — prioridade: futebol dentro do estádio**:
ler [a revisão por tipo de lance](presidencia-futebol-revisao-20261016.md)
e [a integração da sala 3D](presidencia-sala-unificada-20261016.md).
Há alterações locais preservadas na mesma branch, sem novo deploy. Reposições,
contatos, cruzamentos, identidade, intervalo e sincronização foram corrigidos;
calendário e narração privada passaram nos testes de seis velocidades. A sala
3D com personagem/coleção passou na integração e no navegador em 1200/390 px,
com gestos, etapas e alternativa WebGL; acabamento visual ainda pendente. Não confundir
“testes passaram” com “motor completo”: faltas, impedimentos, disputas aéreas,
jogadas ensaiadas, condições do piso e física completa continuam pendentes.
Os registros de 15/10 e anteriores abaixo são históricos.

Atualização de **15/10/2026 — revisão após a publicação**:
o deploy de `2aa90a0d` foi confirmado no GitHub Pages, run `38810648788`.
As correções seguintes estão locais na branch
`fix/presidencia-revisao-motor-20261015`, sem novo deploy: tempo físico dos
lances, pausa/velocidade compartilhadas, último gol antes do apito, janela
com a geometria real do estádio e iluminação sob teto fechado durante o dia.
Os testes passaram nos cenários registrados, mas faltas, impedimentos,
cartões, expulsões e narração com a mesma jogada ainda não estão completos.
Consultar a análise atual em
[presidencia-revisao-motor-etapas-janela-20261015.md](presidencia-revisao-motor-etapas-janela-20261015.md)
antes de continuar. Os registros abaixo são históricos.

Atualização de **15/10/2026 — publicação privada autorizada por Diego**:
o pedido “Publique tudo no meu usuário q fez até agora” substitui a pausa
histórica abaixo. A tela 3D está ligada à carreira, com email verificado,
obras, estacionamento gradual e partida/agenda reais. Main preservada até
`3dc79cc3`. Build, CPU e navegador em desktop/celular emulado passaram;
outras contas e logout também foram conferidos. Ainda é versão de teste,
com acabamento e demais limites registrados em
[presidencia-publicacao-20261015.md](presidencia-publicacao-20261015.md).
A publicação deve ser confirmada pelo resultado do GitHub Pages; registros
abaixo descrevem etapas anteriores, inclusive a antiga pausa de deploy.

Atualização de **14/10/2026 — continuação: mesmo passageiro até o assento e saída física**:
o transporte passou a conectar o passageiro ao assento construído, preservando
o corpo durante desembarque, caminhada, escadas, permanência e retorno ao veículo.
Reservas e propriedade da cadeira impedem dois ocupantes no mesmo lugar; a
troca aguarda a volta do dono anterior. Visitas antigas terminam na origem.
O metrô agora também dispõe de percurso mandante para o portão frontal, além
do visitante lateral, respeitando obras e demanda por lado.

Corredores coordenam passageiros e uma coorte de **até seis torcedores, três
por lado**, debitada da mesma quota da torcida sentada. Cada corredor libera
um corpo de cada vez; os seis saem por degraus existentes, esperam em pontos
distintos da calçada e podem voltar andando na jornada seguinte. Nenhum deles
desaparece ou troca de identidade. A câmera acompanha o corpo escolhido,
sem alternar automaticamente para outro passageiro do mesmo time.
**A massa de até 800 ainda não tem rotas próprias: seis corpos não representam
esvaziamento completo da arquibancada.**

CPU confirmado nesta continuação: fluxo 864 casos + 1.194 verificações,
calendário 1.338, movimento 1.843 quadros, carreira 165 visuais; transporte/assento
9.568 verificações lógicas, 36 de corpo e 4.299 de transferência; coorte
87.786 poses, 35.774 verificações de apoio e 219.465 de separação.
Transporte/assento também passou em **9.824 verificações físicas**. Correção
de quota da coorte passou em cinco cenários lógicos: lado com zero público sai
fisicamente e permanece fora, restauração permite voltar andando, sem trocar
uniforme antigo nem UUID durante a saída. Se nasceu com quota zero, a coorte
continua vazia nesta vida da cena; crescimento posterior não cria corpos nas
cadeiras. Registro em `test-results/complexo-3d/torcida-orcamento-cpu.log`.
Coorte registrada em `test-results/complexo-3d/torcida-saida-cpu.log` e
`torcida-saida-report.json`. Metrô mandante passou em três estágios: 20.784
apoios de sola, 1.056.202 verificações de corpo, 23.430 amostras de rota e
2.598 poses (`metro-mandantes-cpu.log`). **Build PASS, exit 0**, em
`test-results/complexo-3d/percurso-build.log`. Navegador desta continuação
ainda em execução neste registro; não atribuir PASS atual aos resultados
históricos abaixo. Aprovação visual do acabamento continua pendente.

Calendário permanece **quarta às 21h/noite e domingo às 16h/dia**, sem alterar
relógio/velocidade da partida. Chegada leva tempo de caminhada humana; antecipar
o transporte ao calendário da partida ainda exige integração própria.
Continuam pendentes integração às telas reais da carreira, rotas para a massa
sentada, personagem da Presidência e acabamento fiel do estádio, entorno e
sala/camarote. **Tudo local; sem commit/push/deploy/login real.** Publicação
acumulada ao final, com acesso inicial somente para `diego.c.fonseca@gmail.com`.
Detalhes e validações correntes no primeiro tópico de
`docs/presidencia-complexo-3d-reconstrucao.md`.

Registro histórico anterior à continuação acima:

Atualização de **14/10/2026 — jornadas e noite validadas na prévia local**:
regra corrigida por Diego: agenda explícita alterna **quarta às 21h/noite e
domingo às 16h/dia** pelo ordinal da partida. `kickoffTime` registra o horário
do jogo e `period` aciona a iluminação; prévias e expectativas dos testes de
navegador atualizadas. Calendário CPU (1.338 casos) e adaptador da carreira
(165 visuais, mais cenários de agenda) passaram novamente após a correção.
Build após a correção também passou (exit 0), registrado em
`test-results/complexo-3d/horarios-corrigidos-build.log`.
Sem agenda comprovada, não inventa data. Liga usa rodada; Copa/internacionais
exigem contagem real de pernas e offset conhecido, sem relógio do aparelho.
Chegada, partida e intervalo retêm passageiros no destino e visitas sentadas;
saída libera retorno/embarque antes de trocar o serviço. Orçamento reservado
impede reiniciar outros NPCs quando um passageiro termina a viagem. Cor da
jornada seguinte entra na visita somente na origem; ausência temporária do
snapshot não limpa uniformes nem recria corpos.

Iluminação respeita compras e cobertura: torres/cobertura, até 120 postes
públicos apoiados em passeios, passarelas, fachadas, faróis e cabines. Atlas de
luz no próprio asfalto/passeio preserva detalhe do piso e separa cotas de solo
(.16 m) e estação (8.38 m), com oclusão por paredes. Quatro luzes locais reais,
até duas sombras de cabine de 512² e quatro conjuntos de refletores. Porta
iluminada só quando aberta; dia restaura materiais/ambiente.

**Build PASS, exit 0. Navegador final PASS em desktop 1400×1000 (9 checkpoints)
e celular emulado 390×844 (8 checkpoints)**, sem erros/transbordamento. Nove
imagens conferidas: dia, noite, campo, metrô e várzea sem compras. Essa rodada
de navegador antecede a correção dos horários; os nomes quarta-dia/domingo-noite
das imagens são históricos. Não foi repetida a suíte completa de navegador
para a correção; novas capturas usarão domingo-16h-dia e quarta-21h-noite.
Mesmo mapa/câmera/partida em 17 s e 22 jogadores, saldo e corpos preservados ao
mudar luz/fase, retirar partida encerrada e receber novo jogo azul/branco.
A rodada intermediária detectou reinício por chaves contendo cores; corrigido
e repetido com uniformes diferentes. CPU calendário (1.338), movimento (1.843
quadros/12 cenários), cores, iluminação, atlas e veículos passaram, assim como
regressões de fluxo/transporte/circulação/visitas. Evidências finais:
`test-results/complexo-3d/jornada-browser-report.json`, `jornada-browser.log`,
`jornada-build.log`, `jornada-iluminacao.log`, `jornada-movimento.log` e
`*-jornada-*.png`. Primeira captura anterior ao refino da luz preservada em
`jornada-primeira-passagem/`; relatório de falha intermediária é histórico,
foi superado pela rodada final com PASS nos dois aparelhos.

**Ainda era prévia local, não integração nas telas reais da carreira.** Naquela rodada faltavam
transferência do mesmo passageiro até a cadeira e acesso mandante pelo metrô,
implementados na continuação acima; permaneciam também pendentes
esvaziamento progressivo da massa sentada, personagem físico e acabamento
fiel à arte. Detalhes em `docs/presidencia-complexo-3d-reconstrucao.md`.
**Sem commit/push/deploy/login real.** Eventual acesso inicial só Diego.

Atualização de **14/10/2026 — mapa amplo e zoom: rodada local validada**: área maior
em desktop/celular, expansão na tela sem remontar a cena, destinos no menu
Locais, arraste com um dedo/botão esquerdo, pinça, roda, rotação explícita e
teclado com foco no mapa. Resize/expansão preservam o local explorado; limites
pela perspectiva evitam afastar para fora do terreno. Resolução por orçamento
de GPU (até 2,5 MP/DPR 2,5 celular e 4 MP/DPR 2 desktop), anisotropia e fibras
discretas do gramado preservam UV/cores/faixas, sem mudar geometria ou relógio.
Build e testes CPU de câmera/qualidade/material passaram; partida passou em
136 quadros. **Desktop 1400×1000 e celular emulado 390×844 PASS**, oito
checkpoints por aparelho, sem erros/transbordamento. Corrigido bug real de
pinça com página rolada no OrbitControls por ancoragem client do ponto sob os
dedos, sem editar dependência; roda preservada. CPU e nova rodada mobile
mantiveram scrollY de 249, alvo no centro do gramado e distância de 40 m.
Imagens próximas conferidas em ambos. Canvas expandido celular 780×1688/DPR 2;
foco/rolagem/save e partida em 17 s/22 jogadores preservados. Build final após
correção de toque passou na execução anterior. Após o reinício, testes CPU de
câmera/qualidade/material e 301 etapas de plantio passaram novamente. Corrigido
o `+` digitado com `Shift`, com um render por ação e demais atalhos preservados.
A ampliação revelou autossombra indevida na praça
e no teto Vadico: diagnóstico A/B confirmou que bias proporcional ao texel remove
as faixas conservando sombras. **Ajuste integrado em `updateShadows`**;
build final **PASS, exit 0**, e recaptura final **PASS em desktop 1400×1000 e
celular emulado 390×844/canvas 780×1688**. Imagens finais conferidas sem faixas,
com gramado, sombras e atletas próximos preservados. Relatório consolidado
`test-results/complexo-3d/qualidade-final-report.json`; imagens
`*-qualidade-final-mapa.png` e `*-qualidade-final-campo.png` na mesma pasta.
O script de captura inicialmente falhou ao usar roda no contexto móvel;
corrigido para pinça via CDP, mantendo a tolerância **40 m ± 0,1 m**. Textos e
ícone dos botões móveis confirmados no PNG por pixels/OCR; sem bug de interface
nem mudança adicional. Os oito checkpoints de navegação por aparelho continuam
registrados no relatório próprio. Logs atuais:
`test-results/complexo-3d/qualidade-final-build.log` e
`test-results/complexo-3d/qualidade-final-browser.log`.
Referências a logs `/tmp` ao longo deste histórico são de execuções anteriores;
esses arquivos temporários não foram recuperados após o reinício do ambiente.
Detalhes/evidências no primeiro tópico de `presidencia-complexo-3d-reconstrucao.md`.
Sem publicação/login real; fidelidade, personagem físico e integração à carreira
continuam pendentes, com eventual acesso inicial apenas ao e-mail de Diego.

Revisão de **14/10/2026 — ruas e pedestres validada localmente**: rede unificada
com oito ligações na várzea/nove no completo, sem preencher vãos entre trechos.
Rua leste fora do estacionamento, oeste fora do hotel com retorno e ramal
público. Anel decorativo que cortava estabelecimentos removido; dez conexões
físicas de pedestres respeitam compras e preservam percursos. Cercas vivas e
parques têm entradas ligadas a passeios. Só a travessia norte é elevada no
completo (16 cm/rampas de 2,2 m); ligação sul evita a rodovia.

Calçada e entrada do estacionamento noroeste corrigidas e recapturadas. A fonte
final passou em build, física de ruas (**sete cenários/221.848 sondagens**),
pedestres (**17 cenários/4.590 verificações; geometria 7.344 pisos/594 raios de
corpo**), circulação e transporte. Entorno: nove estados, máximo **46 malhas/
292.613 triângulos**. Browser desktop/celular passou em 12 capturas e seis
recapturas finais, sem erros/transbordamento. A manobra com carro **1,9×4,6 m**
e curva de **3,5 m** passou em 7.928 poses geométricas e 11.910 sondagens de
piso. A passagem é apertada: limite de folga contínua acima de 11,03 cm;
valida um trajeto específico, sem adicionar animação de estacionamento.
Evidências e limites na primeira seção de `presidencia-complexo-3d-reconstrucao.md`.
Nada publicado; personagem físico, integração à carreira, acabamento fiel e
aprovação visual de Diego continuam pendentes.

Atualização de **14/10/2026**: a revisão do metrô de 13/10 passou na suíte física
completa, incluindo ida pela passarela oeste e volta pela leste, pisos/solas,
carrocerias, portas e rodas. Build e recaptura `--views-only` passaram em
1280×960, 390×844 e 320×844: cinco carros na estação, relógio oficial preservado
em 14 segundos e 22 jogadores. Contagens e evidências na seção do metrô em
`presidencia-complexo-3d-reconstrucao.md`.

**Vadico Veículos implementada e validada localmente**: loja no bairro
oeste (−154,5 / 29,5 m), letreiro vermelho com texto exato e seis carros físicos.
Acesso público e pedestres separados, atalho de câmera responsivo e nenhuma
nova economia/save. Build final, nove estados do entorno e teste físico na
várzea/completo passaram após corrigir a guia de 0,17 m no acesso: 38 rotas,
17 reservas de obras e tráfego preservados, sem relaxar tolerâncias. Navegador
desktop completo/várzea passou. No celular, a inspeção visual encontrou o hotel
ocultando carros apesar de o enquadramento passar. Câmera de retrato corrigida
com geometria preservada; novo build e recaptura final passaram em desktop
1280×960 e celular 390×844, completo/várzea, com sete raios de visibilidade
livres por cenário, sem transbordamento nem erros JS/WebGL. Evidências em
`test-results/complexo-3d/vadico-browser-report.json` e `*-vadico-{complete,empty,mapa}.png`.
Validação da equipe não substitui aprovação visual de Diego. Pendências gerais
de acabamento/fidelidade, personagem físico e integração à carreira preservadas;
tudo local, sem commit/push/deploy ou acesso à conta real.

Atualização de 12/10/2026: o workspace ativo é
`/workspace/presidencia-publicacao`, branch `deploy/presidencia-20261012`,
base publicada `205f27a1`. O arquivo abaixo conserva o histórico de 11/10;
seus caminhos/HEAD antigos não substituem este estado atual. Há um lote
extenso acumulado, sem novo commit/deploy; preservar todos os arquivos.

Correção de 13/10: o metrô ausente na foto do estacionamento era causado pelo
reset da página QA, que retirava também `estacao`. O reset agora preserva
estação e demais compras. Planta original mantida: metrô acima/à direita do
estádio, junto à avenida norte. Compras 0..4 verificadas em desktop/celular.
A câmera geral também passou a incluir os limites físicos da estação quando
ela ficaria cortada no retrato. Build passou; recaptura local pelo script
`captura-presidencia-complexo-transporte.cjs --views-only`, com relatório
`transporte-enquadramento-report.json` separado das compras. Não confundir
esses cenários isolados com publicação ou acesso à conta de Diego. Recaptura
e projeção passaram em desktop e celulares de 390/320 px, sem erros JS/WebGL.

Continuação atual em revisão: metrô/ônibus/van em movimento, desembarque e
retorno pelo mesmo NPC; dois pontos de ônibus e acesso físico aos quatro lotes.
Estacionamento por compras de 20+20+20+10 (total 70), com 9/16/46/79 vagas.
Compra antiga integral preservada. Domínio e geometria compartilham a contagem;
consumo de público é dividido entre transportes, destinos e visitas.
A integração da compra ao reducer/UI usa nova flag
`PRESIDENCY_PARKING_STAGES_RELEASED=false`: não ativar no mapa antigo que não
mostra lotes parciais. Build final e testes de domínio, reducer/extrato, geometria, lifecycle e browser
passaram. Desktop percorreu quatro compras; celular emulado, primeira compra
mais três serviços completos. Corrigida a câmera do metrô para dentro da
plataforma; capturas `*-transporte-metro-plataforma.png` substituem as primeiras
com teto na frente do corpo. Relatórios `transporte-browser-report.json` e
`transporte-camera-report.json`; detalhes no primeiro tópico de
`presidencia-complexo-3d-reconstrucao.md`. Van ainda parte da portaria, sem
conversão coordenada a partir de `roadOut`. Acabamento, outras rotas e ligação
visual à carreira continuam pendentes; tudo local, sem publicação.

Continuação anterior: **oito acessos**, incluindo primeira fila superior por lado,
com duas escadas internas/patamar/corrimãos e recortes físicos na estrutura.
Demais filas superiores continuam pendentes. Loja/hotel/choperia têm entrada,
espera e retorno, até três pedestres limitados à demanda, sem cruzar torcidas
ou carros. Torcida superior separada por lado, inclusive reservas/cores.
Terreno residual asfaltado recebe variação ampla sem mudar geometrias/rotas.
Testes puros e browser `testa-presidencia-complexo-superior-browser.cjs` passaram
desktop/celular emulado, com relógio oficial/canvas/pausa e várzea preservados.
Capturas `*-superior-*.png`, `*-hotel-entrada.png`, `*-chopp-entrada.png`;
relatório `superior-destinos-report.json`. Acabamento ainda simples perante
a referência; não declarar fidelidade pronta ou conta real testada.
Refino posterior do concreto removeu o grão grosso e corrigiu escala em faces
oblíquas, preservando geometria/IDs nos 11 estados. Teste de textura, build final
e capturas `*-acabamento-superior-*.png` passaram desktop/celular emulado.
Tudo permanece local, sem commit/push/deploy. Ver registro inicial de
`presidencia-complexo-3d-reconstrucao.md` para números e limites atuais.

Continuação anterior: seis opções de percurso (filas 0/5/10 por entrada), uma visita
ativa por lado e câmera que acompanha o corpo. Adaptador de leitura da carreira
preserva carteira, estádio, partida, identidade e personagem modular existente;
fixture nova `qa-presidencia-complexo-carreira.html`, sem login/gravação. Apoio de
pés/alcance de pernas, vizinhos sentados, LOD e 165 visuais passaram nos testes
puros; compilação e browser de visitas/carreira passaram desktop/celular emulado.
Corrigidos o reinício do torcedor da casa ao mudar visitantes e o timeout inicial
do retrato na fixture, carregando as artes antes do cenário pesado. Capturas
`*-visita-*-fila10-*.png`, `*-carreira-personagem-*.png` e
`*-carreira-camarote-compras.png`; detalhes/testes/limites na primeira seção de
`presidencia-complexo-3d-reconstrucao.md`. Tudo segue sem commit/push/deploy.
Não confundir adaptador local com instalação da cena na conta real.

Continuação anterior: corredores reais e escadas alinhadas ligam os portões a
uma cadeira inferior por lado. Mesmo NPC sem rosto entra/sobe/senta/sai, com solas
apoiadas e reserva que exclui ocupante estático (máximo combinado 800; QA 529).
Mobília do camarote lê os 13 IDs da carteira validada, sem conceder compras, veículos,
troféus ou presidente. Vista interna em altura humana, luz fixa do forro e
camada de móveis independente do mundo/partida. Testes puros e browser de mobília,
visitas e lifecycle passaram; imagens `*-mobilia-sala-*.png` e `*-visita-*.png`.
A câmera móvel foi corrigida para não cortar os pés na subida. Até 96 cadeiras
próximas ganham espessura, encosto curvo e suportes; as simples saem/voltam sem
duplicação. Geometria máxima de 189.868 triângulos / 22 malhas; testes puros e nova rodada
visual desktop/celular passaram após integrar o detalhe. Compilação final aprovada
(`/tmp/presidencia-visitas-final-build.log`). Mais detalhes e
limites em `presidencia-complexo-3d-reconstrucao.md`. Ainda faltam rotas completas
para outros assentos/andares/estabelecimentos, acabamento fiel, personagem físico
e integração à carreira. Não declarar entrega inteira concluída nem conta testada.

Continuação anterior preservada: árvores/casas/texturas e solo natural da várzea,
com terreno físico e lotes futuros protegidos. `*-paisagismo-*.png` mostra os mapas
após corrigir repetição da textura; `*-acabamento-*.png` são aproximações anteriores
à nova circulação até as cadeiras.

Pedido mais recente: preencher os vazios bege entre bairros. A revisão local
agora tem praças, passeios e arborização nas lacunas, além de parque regional que
continua além do bairro. Terreno 1800×2600 m; névoa acompanha a distância da câmera
para não apagar o mapa no celular. Seleção dos volumes protege estacionamentos,
estação e seus caminhos antes das compras. Ver a seção de paisagismo em
`presidencia-complexo-3d-reconstrucao.md` e capturas `*-paisagismo-*.png`.
O renderer ainda está na página QA; não afirmar que foi instalado na conta real.

Decisão anterior preservada: a reconstrução estava retangular demais. Agora
fachada/arquibancadas/cobertura usam planta oval. Sala = grande camarote dentro do
estádio; não quer mais rua/rampa subindo até ela nem carro na frente. Não apagar
os bens da garagem. Mandantes entram pelo portão frontal/sul e visitantes pelo
lateral/leste. Essas mudanças e os trajetos físicos foram implementados localmente;
`testa-presidencia-complexo-torcidas.mjs` e `testa-presidencia-complexo-acessos.cjs`
registram a conferência inicial. Mobília e dois percursos completos foram
acrescentados na continuação mais recente acima; demais acessos seguem pendentes.
As instruções antigas de manter rampa/carro foram revogadas por esse pedido.
Conferência final: build e navegador desktop/celular passaram. Corrigida também
terra sobreposta ao gramado na vista baixa com teto fechado, sem mudar altura
ou motor do jogo. Capturas `*-gramado-teto-fechado.png` substituem as imagens
anteriores desse caso. Nenhum commit/push/deploy nesta correção.

Continuação do mesmo dia: o foco voltou ao estádio inteiro e às 16 obras, com uma
reconstrução física em `qa-presidencia-complexo-3d.html`. Estado técnico, comparação
com a arte aprovada e pendências reais estão em
`presidencia-complexo-3d-reconstrucao.md`. O acabamento ainda não foi aprovado e o
novo renderer permanece fora da tela do jogo. Não confundir geometria/testes prontos
com fidelidade concluída. A janela original recebeu correção para setores completos
comprados fora de ordem; campo/relógio existentes foram reaproveitados.

Diego autorizou começar a reconstrução como mundo 3D por um trecho com rua,
estabelecimento, pedestre e carro. Esse primeiro trecho funcional e seus
testes estão em `presidencia-bairro-3d-primeiro-trecho.md`. A página de revisão
é `qa-presidencia-bairro-3d.html`, separada da produção. Não afirmar que o
estádio inteiro já foi convertido ou que o acabamento visual final foi aprovado.
Diego reforçou a fidelidade ao acabamento original; o trecho recebeu fachada
cinza/clara, vitrines e palmeiras comparadas aos recortes originais. Isso ainda
é aproximação isolada, sem registro da planta completa. A referência continua
sendo a arte aprovada, não a primeira maquete. Ver o registro do trecho acima.
O mapa/partida anteriores, refinamentos de artes, torcida, portais e velocidades
lentas continuam preservados. Demais registros atuais: `presidencia-publico-continuacao.md`,
`presidencia-refino-etapas-20261012.md`, `presidencia-mapa-zoom-20261012.md`
e `presidencia-velocidades-lentas.md`.

Atualizado em 11/10/2026. Este documento é o ponto de retomada da conversa longa
com Diego. Preserva requisitos, decisões, estado real e próximos passos; não é
uma transcrição literal do chat nem uma declaração de entrega concluída.

## Leia primeiro e preserve o trabalho

- Repositório: `/workspace/7a0-game-studio`. Branch: `work`.
- HEAD atual: `2496b73b` (incremento publicado antes da pausa de publicações).
  Base reconciliada anteriormente por fast-forward: `7b6443cb`.
  A base dos backups anteriores era `e432f0ceebcd9f4aacd614de63ec88a127902cc2`.
- Há muitas alterações locais rastreadas e arquivos novos. Não usar reset/clean,
  não substituir por uma main limpa, não descartar assets ou sobrescrever o lote.
- Commit `2496b73b` enviado à main após autorização explícita; deploy concluído com sucesso (workflow 38136640210). Nenhum teste na
  conta real. INSTRUÇÃO MAIS RECENTE: acumular as próximas melhorias localmente;
  NÃO PUBLICAR novos incrementos. Avisar quando o escopo completo estiver
  concluído para então combinar a publicação. A autorização anterior foi
  usada apenas para o commit 2496b73b, já publicado.
- Revisão automática bloqueou `git push origin HEAD:main`: considera que
  enviar 323 arquivos à main dispara deploy compartilhado além da autorização
  de prévia privada. Pergunta enviada para autorizar explicitamente o deploy
  compartilhado mantendo o gate de Diego. Diego respondeu explicitamente
  “Autorizar deploy com acesso só para Diego”. Nova tentativa aprovada; push
  concluído. Workflow: https://github.com/diegocfonseca-blip/7a0-game-studio/actions/runs/38136640210
- Somente `diego.c.fonseca@gmail.com` pode receber a futura prévia privada.
  Manter a verificação existente de identidade, rejeição das outras contas,
  revogação na troca de conta e rejeição em erro/resposta atrasada.
- Pedido original: continuar a partir da main. A reconciliação foi feita
  preservando todo o trabalho local: fetch e fast-forward para `7b6443cb` concluídos sem conflitos; alterações locais
  preservadas e copiadas antes em `/workspace/presidencia-antes-main-20261011.zip`.
- Ler `AGENTS.md`, `CLAUDE.md`, `docs/presidencia-lote1-entrega.md`,
  `docs/presidencia-lote2-entrega.md`, `docs/presidencia-lote3-previa.md` e
  `docs/presidencia-partida-no-estadio.md`.
- CLAUDE.md exige screenshot/mockup e OK de Diego antes de novo commit VISUAL.
  A revisão ainda não ocorreu. Edições e testes locais estão autorizados.
- Não criar subagentes sem instrução explícita que os autorize.

## O que Diego pediu e corrigiu

1. Todas as artes/etapas, desde o terreno sem obras, cada clique de melhoria,
   cada estabelecimento, até chegar ao mesmo estádio completo de referência.
   Posições, volumes e arquitetura precisam permanecer coerentes entre etapas.
2. Cobertura somente depois dos dois andares concluídos. Ruas, asfalto,
   estacionamento e acessos devem fazer sentido com os estabelecimentos.
3. Mapa ampliado com zoom, arrasto/pinça e qualidade no cenário inteiro:
   gramado, arquibancadas, prédios, chão e NPCs. NPC nítido sobre chão borrado
   não satisfaz o pedido.
4. NPCs e carros integrados à perspectiva, sombras, solo e profundidade.
   Não atravessar objetos nem caminhar sobre telhados. Ocultação não substitui
   colisão. Fluxos de pedestres/carros precisam ser plausíveis.
5. Partida com 11 atletas por equipe incluindo goleiro, ligada aos eventos e
   gols do motor já existente. Preservar resultado/economia/competição.
6. Sala do presidente: janela reflete a evolução do estádio. Personagem deve
   seguir o padrão SEM olhos, nariz ou boca. Diego rejeitou feições adicionadas.
   Finalização do personagem continua no escopo, mas o foco atual é estádio/NPCs.
7. Diego pede continuidade e não quer interromper a cada microdecisão. Não
   repetir pedidos de autorização já atendidos. Não alegar publicação ou teste
   real quando foi só fixture local.
8. Links locais e mensagens/imagens falharam no celular em vários momentos.
   Mostrar imagens diretamente na conversa quando possível. Não afirmar que o
   aplicativo dele exibiu algo apenas porque enviamos a imagem.

## Trabalho local existente

### Evolução, obras e janela

- Módulos `presidencia-estadio-projeto`, `camadas`, `mundo`, `tiles`, `territorio`,
  `mapa`, `circulacao`, `navegacao` e integrações em `estadio.tsx`, `store.tsx`.
- Primeiro andar: Geral 40 + Cadeiras 90 + Visitante 120 integralmente pagos.
  Camarote 150 inclui segundo andar, preservando chave/preço/renda/lugares.
  Cobertura requer estrutura inteira e grama 30; retrátil também requer cobertura.
  Compras legadas preservadas; novas restrições limitadas à prévia privada.
- Proposta privada de pavimentação `asfalto`, custo 80, renda 0; requer Loja ou
  Geral concluída. Catálogo público preservado. Reducer cobra uma vez e protege
  saldo, gestor e conta. Não conceder bens ou moedas.
- Janela mantém artes aprovadas e camadas de obras. Não usar artes rejeitadas
  v254/v255/v256/v259. Consultar documentos de arte para os originais aprovados.
- Mapa mantém transform único e proporção; zoom 1–4, pinça/arrasto/teclado.
- Fontes do mapa completo em 3072×2048; intermediárias 1536×1024. Não afirmar
  que todas são 3K. Seis estados-base e peças 256 px carregadas por visibilidade.
  Imagem geral <=60 KB e detalhes <=25 KB; originais preservados.
- 47 fixtures: 23 cliques de investimento, compras individuais, acumuladas,
  teto aberto/fechado e terreno inicial. São revisão local, não aprovação visual.

### Circulação externa

- Segmentos inteiros e raio do corpo são verificados contra obstáculos de solo
  cadastrados. Caminho é recortado antes do bloqueio; não é busca alternativa
  de rotas nem cadastro completo de todo objeto da arte.
- Carros colidem com círculo contendo a carroceria inteira e giram pelo centro.
  Pedestres usam os pés. Retorno do estacionamento de ré, sem giro no lugar.
- Reaparecimento de tráfego somente com as duas pontas fora da moldura; rota
  bloqueada para no fim seguro. Caminhão/carro da mesma faixa têm mesma velocidade.
- Operários reposicionados fora do volume da estrutura. Pórticos e algumas
  copas têm oclusores registrados. Ainda revisar árvores, canteiros e entradas.
- Movimento suspende fora da tela, aba oculta, pausa e redução de movimento.

### Campo e 22 atletas

- `presidencia-partida-model.ts`, `.tsx`, `.css`, `-geometria`, `-redes`, `-tiles`;
  sprites próprios de futebol sem rosto, frente/costas, goleiro e máscara de camisa.
- Integração em `pyramidseason.tsx`: LiveScoreCard → contexto da carreira, usando
  XI das equipes, `lineupAt` e `careerHalftime[teamId][round-1].xi2`.
  Estádio do mandante. Se não existe save desse estádio, cenário correspondente
  à ausência de investimento; não inventar estádio completo do adversário.
- Somente duas escalações válidas de 11 jogadores, IDs únicos, um GOL cada,
  sem atletas fake. Falta de XI mostra indisponibilidade, não preenche com fictícios.
- Gol/placar usam fila, voo e confirmados existentes. Identificador partida+índice,
  minuto do próprio evento para lado atacado, `startedAt: performance.now()` no
  voo para abrir a câmera durante o chute sem reiniciá-lo.
- Bola só cruza a linha quando a fase é confirmada. Não recalcular gols/resultado.
- Pausa/fim congelam o tempo visual sem reposicionar atletas. Pausa no segundo
  tempo não reverte escalação/lados. Frente/costas e espelhamento seguem derivada
  do movimento. Bola reduzida para proporção física e profundidade pelo solo.
- Câmera interna detalhada apenas com estrutura completa+cobertura; outras
  etapas usam mapa com projeção correspondente. Zoom 1–6, pinça/arrasto/teclado,
  Ctrl/⌘+roda. Malha transparente de rede em primeiro plano na câmera interna.
- Detalhes carregados ao ampliar, por visibilidade. Falha da câmera interna
  volta à vista geral e reseta enquadramento/projeção. Redução de movimento
  mantém atualizações do placar sem frames contínuos.
- Fonte do campo é 1536×1024, não 3K. Não declarar todos os detalhes finais.
- Movimento atual é coreografia visual: o motor não fornece trajetórias físicas
  dos 22 atletas nem passes completos. Copas, expulsões e comemoração corporal
  dedicada ainda pendentes. Não vender isso como reprodução física completa.

## Validação — atualização importante sobre bloqueios antigos

Os documentos anteriores dizem que dependências/build/navegador estavam bloqueados.
O estado mudou no final desta sessão:

1. A conexão HTTP com registry.npmjs.org passou com acesso adicional de rede.
2. `npm ci --cache /tmp/presidencia-npm-cache --no-audit --no-fund
   --fetch-retries=1 --fetch-timeout=20000 --loglevel=error` instalou 202 pacotes.
   Cache padrão /home/agent/.npm falhava; usar /tmp. Lockfile não modificado.
3. **BUILD COMPLETO PASSOU**: `npm run build` (TypeScript + Vite), exit 0.
   Encontrou e foi corrigido um erro em `requisitoExtraNoProjeto`: referência
   inexistente a `st` e retorno booleano em função textual. Teste de regressão
   adicionado. Há avisos preexistentes de chunk grande/import dinâmico/config.
4. Chromium `/usr/bin/chromium` abriu uma página local e leu seu título com
   Playwright, acesso adicional de rede e `--no-sandbox`. Sem esse acesso,
   falha `setsockopt: Operation not permitted`.
5. **Ainda NÃO foram concluídos os testes das telas reais no navegador.** A
   tentativa da suíte lote1 foi interrompida pelo usuário/tool; não há PASS dela.
   O Chromium abrir não comprova mapa, compra, pinça ou partida funcionando.
6. PASS anteriores e locais: `node scripts/testa-presidencia-partida.mjs --preview`
   (inclui evolução: 2048 + 4096 combinações, cases reais extraídos do reducer,
   47 rotas, gate simulado, XI, relógio, pausa, redes, carroceria/retorno).
   Atenção: cases extraídos não substituem provider/autosave no navegador.
7. `node scripts/testa-presidencia-economia.cjs` e
   `node scripts/testa-presidente-acesso-v68.cjs` passaram após instalação.
   Autenticação simulada, não login real.
8. Sintaxe Babel e `git diff --check` passaram em etapas anteriores.
   Rodar o teste de regressão textual recém-adicionado antes de fechar entrega.

## Como retomar o navegador (próxima ação concreta)

Servidor Vite foi iniciado em 127.0.0.1:4196, base `/7a0-game-studio/`.
Pode ser preciso iniciá-lo novamente na próxima sessão. Isso é servidor local,
não deploy. Execução com acesso adicional de rede foi necessária no ambiente.

`npm run dev -- --host 127.0.0.1 --port 4196 --strictPort`

Playwright disponível em `/opt/codex/cua_node/lib/node_modules/playwright`.
Sharp no mesmo diretório. Scripts existentes carregam dependências por
`scripts/presidencia-runtime.cjs`; usar
`PRESIDENCIA_NODE_MODULES=/opt/codex/cua_node/lib/node_modules` se necessário.
Scripts antigos pedem `channel:'msedge'`; neste Linux usar Chromium instalado.
Foi criado `/tmp/presidencia-browser.cjs`, um preload somente para testes:

```js
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=options=>launch({...options,channel:undefined,
 executablePath:'/usr/bin/chromium',args:[...(options?.args??[]),'--no-sandbox']});
```

Executar, com acesso adicional quando necessário:
`PRESIDENCIA_NODE_MODULES=/opt/codex/cua_node/lib/node_modules node
 --require /tmp/presidencia-browser.cjs scripts/testa-presidencia-lote1.cjs`

Depois lote2, entrada e autosave-v80 conforme arquivos em scripts. Fixtures:
`qa-presidencia-clube.html`, `qa-presidencia-entrada.html`,
`qa-estadio-privado.html`, `qa-setup-integrado.html`. Interceptar/bloquear rede
externa nos testes e usar dados locais. Testes existentes já fazem esse bloqueio.

Preparar suíte nova que monte componentes reais de mapa/partida, percorra as
47 etapas e teste 320/390/900 px, zoom/pinça/arrasto, 22 atletas, gol confirmado,
pausa, redução de movimento, troca de partida e falhas de imagens. Não mascarar
falhas da aplicação alterando as expectativas dos testes. Revisar screenshots.

## Arquivos e prévias

- `test-results/presidencia-campo-previa.zip`: pacote interativo demonstrativo.
- `test-results/estadio-projeto/index.html`: 47 etapas com circulação.
- `test-results/estadio-projeto/revisao.png`: resumo de seis etapas.
- `test-results/estadio-projeto/circulacao.png`, `circulacao-zoom.png`.
- `test-results/partida-estadio/index.html`, `revisao.png`, `zoom.png`,
  `gol-direita.png`, `gol-esquerda.png`. Elencos demonstrativos, não conta Diego.
- Scripts render/empacota/testa correspondentes estão no backup.
- Fontes originais `/workspace/generated_images` (cerca de 60 MB) e
  `/workspace/scratch/estadio-master` (cerca de 29 MB). Preservadas no backup.
- Fontes relevantes: atlas futebol `exec-85c33265-af24-422d-9af1-5a5e0e61e1d3.png`,
  campo `exec-4ba39064-2a3c-4265-aba1-c6c3187467b4.png`, mapas empty
  `exec-75646143-119b-4278-83c2-c24989066f54.png`, lower
  `exec-2f65bcd9-915d-4375-980c-768c8857df16.png`, upper
  `exec-c2ed2f5d-c00a-4add-be7b-89008b1ff3ac.png`, closed
  `exec-ee2bfdad-172c-4a6c-b8ee-8b4d98efbf9a.png`, plots
  `exec-0e2897b0-2380-417e-9ce2-4f5a6d658bfd.png`.

## Backup e transferência

### Continuação local após o backup em 11 de outubro

- Retomada a revisão do estádio e dos NPCs a pedido de Diego. Publicação
  continua suspensa.
- Pedestres agora aguardam dois segundos nas pontas das rotas antes de
  retornar, com animação dos pés parada e orientação de chegada preservada.
  Tráfego e manobra de ré mantidos. Testes de continuidade nas viradas e espera
  adicionados a `scripts/testa-presidencia-partida.mjs`; suíte passou.
- `npm run build` passou novamente após a mudança (TypeScript + Vite), com
  os avisos existentes de tamanho de bundle e imports dinâmicos.
- Nova tentativa de servidor local falhou com `listen EPERM` em
  `127.0.0.1:4196`. A tentativa com acesso adicional foi interrompida.
  Não houve teste das telas no navegador nesta retomada.
- Os ZIPs e a página privada foram preparados ANTES desta alteração; não
  incluem esta continuação. Preservar também os arquivos locais mais recentes.

### Navegador desbloqueado com revisão automática

- Diego ativou revisão automática no app. Execução aprovada com
  `require_escalated`; servidor Vite já ativo na porta 4196 foi verificado.
- O preload `/tmp/presidencia-browser.cjs` agora carrega Playwright pelo próprio
  `scripts/presidencia-runtime.cjs`, garantindo a mesma instalação dos testes.
  A instalação absoluta anterior não interceptava o módulo local encontrado.
- PASS no Chromium: `testa-presidencia-lote1.cjs` e
  `testa-presidencia-lote2.cjs`. Incluem reducer privado, compras, rejeição de
  transações inválidas, móveis, veículos, requisito do teto e larguras móveis.
  Fixtures offline com rede externa bloqueada; nenhum login real ou deploy.
- Isso resolve o bloqueio do navegador, mas não conclui a revisão visual das
  47 etapas, zoom e integração completa da partida.

### Revisão do mapa e partida no Chromium

- Mapa ampliado para 72svh, mundo 3:2 com dimensões próprias, limites de arrasto
  relativos ao cenário e Ver tudo ajustando a escala mínima. PASS em três
  larguras e testes geométricos de enquadramento. Captura inicial do celular:
  `test-results/mapa-browser/mapa-grande-inicial.png`.
- Após fast-forward da main, build completo, lote2, autosave v80, economia e
  gate de identidade passaram. Commit local pronto: `2496b73b`.

- Adicionados `qa-presidencia-mapa.html` e
  `scripts/testa-presidencia-mapa-browser.cjs`, montando componentes reais com
  dados demonstrativos, estilos globais e rede externa bloqueada.
- PASS: 47 etapas em 320/390/900 px, aproximação com carregamento de detalhes,
  ausência de overflow horizontal, pausa da circulação e 22 atletas na câmera
  interna. Testes não usam a conta real nem o provider da carreira.
- PASS adicional (`--partida`): zoom 6×, deslocamento por teclado, pausa dos
  22 atletas, gol confirmado com movimento reduzido, falha de `field.webp`
  retornando à vista geral com 22 atletas e zoom reiniciado. Para simular a
  falha, usar contexto novo do navegador; imagem em memória pode evitar a rede.
- Capturas em `test-results/mapa-browser/`. Inspecionadas `mapa-320.png`,
  `partida.png` e `partida-zoom.png`: o gramado/linhas ainda perdem nitidez em
  6×, enquanto os sprites preservam mais definição. Essa diferença permanece
  uma pendência visual real, não resolvida pelo teste de carregamento.
- Ainda faltam pinça/arrasto com toque real, revisão de obstáculos contra
  todos os objetos da arte e a integração de eventos na tela completa da
  carreira. Nenhuma publicação nesta etapa. Backups anteriores não incluem
  estes novos arquivos de teste.

`/workspace/presidencia-retomada-20261011.zip` contém as versões completas dos
arquivos modificados/novos, fixtures auxiliares, patch rastreado, inventário com
SHA-256, fontes originais e prévias. NÃO contém credenciais, node_modules ou .git.
É um complemento à base Git indicada acima, não clone completo do repositório.
Se a nova sessão não tiver este workspace, baixar/anexar o ZIP e restaurar os
arquivos sobre uma cópia da base, reconciliando mudanças concorrentes. Não aplicar
simultaneamente o patch e as versões completas dos mesmos arquivos.

Apenas abrir outro chat não transfere automaticamente arquivos não commitados
ou o histórico inteiro. Cole o pedido de retomada e forneça este documento e,
se o workspace não for compartilhado, o backup. Não apagar a sessão antiga
antes de a nova confirmar que leu o documento e encontrou os arquivos.

## Publicação confirmada

GitHub Pages concluiu com success o workflow 38136640210 para
`2496b73b13fef5d04d21ffbf6f34e8f9efa1fab5`. Restrição funcional ao e-mail
de Diego preservada. Não houve login real na conta. A leitura direta do
domínio pelo executor retornou HTTP 403, portanto a confirmação é pelo
workflow, não inspeção do bundle servido nem cache do celular.

## Continuação local após a pausa de publicações

- Extraída `PresidenciaAtletas`: mapa e câmera usam a mesma renderização,
  projeção por câmera e evento de gol. `presidencia-partida-sincronia.ts`
  publica estado transitório do placar em memória (sem rede/save); o mapa
  assina somente o ID esperado. Desmontagem limpa a publicação do proprietário.
- Relógio visual compartilhado continua mesmo com câmera fechada. Abrir a
  câmera não reinicia os atletas. Pausa/fim congelam o relógio.
- Aba Estádio recebe partida quando o clube é mandante; também na visão aérea
  em diálogo. Partida de outro ID não aparece no mapa. Teto retrátil realmente
  desenhado fechado oculta atletas, sem desenhá-los por cima da cobertura.
- Escala comum de referência: campo 105 m, atleta em pé 1,80 m, bola 22 cm;
  usa largura projetada do gramado na profundidade correspondente. Corrigidas
  margens alfa do atlas (pé 190/192, corpo em pé 180 px) e bola (124 px em
  128, apoio em 125/128). Goleiro preserva pose agachada.
- Teste `scripts/testa-presidencia-sincronia-browser.cjs`: componentes reais
  montados em fixture, duas vistas dos 22 atletas, reabertura, pausa, gol,
  visão aérea, teto, troca de ID e limpeza. Não é teste de toda a carreira.
- Movimentação segue coreografia, ainda não passes/disputas físicas completas.
  Falta validar a ponte com LiveScoreCard na tela integral, copas, visitante,
  eventos diversos e qualidade de todas as artes/obstáculos. Não declarar
  conclusão do projeto nem publicar estas alterações locais.

Validação final desta continuação: build completo PASS; testes puros PASS;
teste de sincronização no Chromium PASS; regressão da partida no Chromium
PASS após ajuste dos pontos de apoio. Alterações permanecem locais.

## Continuação: placar real e lance atravessando o intervalo

- Acrescentado cenário sob demanda `renderScoreFixture` à página local de QA.
  Importa `screens` antes de `pyramidseason` para respeitar a dependência circular
  existente; não altera o carregamento de produção.
- Novo `scripts/testa-presidencia-placar-real.cjs` usa o `LiveScoreCard` real e o
  mapa. PASS: chute sem antecipar placar, fila de dois gols no mesmo minuto,
  intervalo/retomada, troca de rodada sem evento antigo e gol nos acréscimos
  antes do apito final. Identidade simulada só por interceptação no teste;
  toda rede externa bloqueada, sem autenticação real ou alterações de conta.
- Corrigido o elenco/lado de lance atrasado do primeiro tempo: enquanto o gol
  de 45 ainda está sendo apresentado, mantém quem participou dele, mesmo com
  relógio em 46. Antes o autor substituído desaparecia e a bola começava no
  centro. Ao encerrar o evento, assume a escalação do segundo tempo.
- Regressões puras e teste das duas câmeras PASS. Obstáculos continuam com
  cobertura dos volumes cadastrados; falta revisão visual completa de árvores,
  acessos e interação entre atores. Não declarar todas as colisões resolvidas.
- Nenhum commit, push ou deploy nesta continuação. Preservar a ordem atual:
  acumular o trabalho e publicar somente ao final, após revisão com Diego.

Build após a correção do intervalo: `npm run build` PASS (log local
`/tmp/presidencia-placar-build.log`). `git diff --check` PASS.

## Continuação: chegada dos visitantes aos estabelecimentos

Auditoria encontrou rotas seguras porém incompletas: com todos os negócios,
loja chegava só a 72% do caminho (praça bloqueava), hotel a 70% (destino dentro
do prédio), chopp a 98%. Ajustados contorno da praça e pontos de espera externos
ao hotel/chopp. Os cinco destinos agora chegam ao ponto definido em todas as
128 combinações de negócios/asfalto/estacionamento, com teste do raio do corpo
em cada segmento. Isso valida os obstáculos cadastrados, não equivale à revisão
de cada árvore/objeto da arte. Alterações locais, sem commit/deploy.

A conferência sobre a arte identificou também o jardim externo do hotel, que
faltava no cadastro de colisão. Adicionado `jardim-acesso-hotel` quando há
asfalto e desviado o acesso por fora dele. Captura diagnóstica com rotas em
magenta: `test-results/mapa-browser/rotas-revisao.png` (sobreposição só no
navegador de revisão, não faz parte do produto). Conferência fina de árvores,
profundidade/oclusão e os demais acessos continua pendente.

Validação após rotas/jardim: testes puros PASS, navegador nas 47 etapas em
320/390/900 PASS, build PASS (`/tmp/presidencia-rotas-build.log`) e
`git diff --check` PASS. Não houve publicação.

## Continuação: câmera grande, gestos e eventos do placar

- Câmera interna também usa área de 72svh (mínimo útil no celular), mundo 3:2
  sem distorção, arrasto/pinça ancorada e enquadramento total no VER CAMPO.
- Recuperação da imagem interna com teto fechado abre somente a representação
  alternativa do teto: atletas não são desenhados sobre a cobertura. Save e
  vista exterior mantêm a posição real do teto.
- Novo teste de toque usa Input.dispatchTouchEvent do Chromium: pinça real no
  mapa e no campo, arrasto, orientação, cancelamento e controles. PASS.
- Faixa pequena privada agora assina o mesmo estado confirmado do placar e do
  campo em componente separado, evitando antecipar gol ou anunciar FIM antes
  da última bola. Sem assinatura no componente publicador (evita ciclo React).
- Chances sem gol vêm do mesmo `lance` do LiveScoreCard, com timestamp e minuto
  originais: defesa, trave, fora e isolou. Campo não faz outro sorteio. Gol tem
  prioridade. Chance não registra autor inventado nem altera placar/estatística.
  Trajetória da bola é apresentação do desfecho; motor ainda não fornece passes
  físicos dos 22 atletas. Isso permanece uma pendência, não uma entrega completa.
- Comparação local das etapas: `test-results/mapa-browser/etapas-estrutura.png`
  e `etapas-entorno.png`, produzidas pelos componentes reais.
- Tentativa de restauração da arte do campo preservada em
  `/workspace/generated_images/exec-54ae2b65-c714-4916-84bb-4e6d1347593c.png`.
  Continua 1536×1024: NÃO integrada, pois não resolve a resolução nativa de 3K.
  Não afirmar conclusão da qualidade de zoom por causa desta geração.

- Oclusores registrados agora têm profundidade no solo (árvores e travessas).
  Circulação compartilha esse contexto, removendo o wrapper que prendia todos
  os NPCs atrás. Novo teste `testa-presidencia-profundidade-browser.cjs` compara
  pixels de uma silhueta diagnóstica atrás/frente/atrás da travessa real: PASS.
- Detalhes do terreno/campo passam a carregar quando tamanho exibido × densidade
  de pixels supera a prévia de 600 px, inclusive antes do primeiro gesto no
  celular. Os recortes continuam carregando apenas na área visível. Isso usa
  melhor os detalhes existentes, sem fingir que aumentou a resolução das fontes.

- Segurança saiu da própria linha de entrada e ocupa posto lateral validado.
- Torcedores/trabalhadores nas rotas compartilhadas usam faixas de sentidos
  opostos. Retorno em arco com espera, sem salto lateral; corredor validado com
  raio do corpo + largura da faixa. Ajustado acesso junto à fonte para manter
  folga. Regressão amostra dez minutos com/sem asfalto, distância entre corpos
  na mesma rota, continuidade e obstáculos. Ainda não é solução geral de
  conflitos em todos os cruzamentos entre rotas diferentes.

## Superfície detalhada do campo — continuação local

- `presidencia-campo-superficie.tsx` usa textura de grama gerada e linhas vetoriais
  na mesma projeção bilinear dos atletas: campo 105×68, áreas/círculo/marcas nas
  medidas correspondentes. Linhas continuam nítidas ao ampliar; não é uma
  alegação de que toda a fotografia original virou 3K.
- Arte sem as antigas balizas: fonte `exec-1400c142-be6e-4153-b84c-c199d28b5a50.png`.
  Textura fonte: `exec-1ae88adc-c8a2-4845-a40d-abd7c888428b.png`, ambas em
  `/workspace/generated_images/`. Empacotadas por
  `scripts/empacota-presidencia-superficie.cjs` em arquivos NOVOS; anteriores
  preservados. Prévia ≤60 KB, cada recorte ≤25 KB; cenário/textura somam ~1 MB,
  carregados na câmera interna privada, não no início geral do jogo.
- Balizas agora renderizadas na escala comum: boca 7,32 m, altura 2,44 m, rede
  com 2 m de profundidade. Teste mantém a bola confirmada dentro das faces.
- Comparação do detalhe superior esquerdo gerado (`exec-5a323fde-bc72-4025-9565-ce71686ac71f.png`)
  encontrou boa correspondência na arquitetura, mas deslocamento nas marcações
  do gramado; não integrado como substituição da imagem inteira. Análise usa
  OpenCV em venv temporário `/tmp/presidencia-art-analysis`, sem dependência nova
  no projeto. Arte inteira restaurada anterior também permanece só como fonte.

- Gramado usa uma prévia de material de ~22 KB no enquadramento normal;
  os 24 recortes nativos entram apenas quando a resolução exibida exige.
- Arquibancadas: detalhes ampliados esquerdo/direito registrados por pontos da
  arquitetura, excluindo o campo. Registro salvo em
  `docs/presidencia-arquibancadas-registro.json`: 266/609 correspondências aceitas,
  erro mediano 0,63/0,50 px nas coordenadas originais. O registro não valida cada
  pixel artístico; bordas recebem transição para o fundo preservado.
  Fonte direita: `exec-f7ec810b-b573-417f-9fce-9739fbe26acf.png`.
  `empacota-presidencia-arquibancadas.cjs` gera 36 recortes ≤25 KB. O componente
  só existe quando o zoom/densidade demanda e carrega recortes visíveis.
- Nova superfície/arquibancadas são LOCAIS, ainda sem aprovação visual final de
  Diego, commit ou deploy. `CLAUDE.md` pede screenshot/OK antes de commit visual.

## Revisão dos acessos e checkpoint local — 11/10, continuação

- Revisão sobre a imagem mostrou que as rotas antigas podiam passar no teste
  geométrico e ainda cortar jardins/vagas. Corrigido o traçado da avenida dos
  dois lados, com saída pela rua do cruzamento à direita. A calçada acompanha
  a largura da via e termina antes do cruzamento. Não há alteração de compras,
  saldo, salvamento ou resultados da partida.
- Loja/praça circulam nos respectivos passeios; hotel usa a área interna de
  acesso; estação usa a calçada junto ao prédio. Retirados os atalhos longos
  pelos canteiros/estacionamento. Os NPCs desses negócios são circulação local,
  não uma simulação de viagem completa desde fora do bairro.
- `scripts/confere-presidencia-rotas.cjs` reproduz capturas com as rotas em
  magenta/ciano. `--clean` produz a cena sem diagnóstico. Requer Vite 4196;
  bloqueia rede externa e usa a fixture existente, não a conta real.
- Teste de circulação: 128 combinações de estabelecimentos/asfalto/estacionamento,
  dez minutos de trajetos em dois sentidos, corpo contra obstáculos, separação
  de carros/calçada e regressão da avenida atravessando o estacionamento direito.
  PASS após a última alteração de rotas.
- Atenção: polígonos de RECORTE DA ARTE não equivalem automaticamente a volumes
  físicos. `parkingLeft`, por exemplo, inclui calçada. O teste da via direita
  usa o lote pertinente; não transforma esse recorte esquerdo inteiro em parede.
- PASS no navegador: 47 etapas em 320/390/900, zoom/pausa, 22 jogadores,
  imagem alternativa; placar real/gols em fila/intervalo/apito/chance sem gol;
  sincronização entre câmeras; pinça real/arrasto/rotação/cancelamento; teste de
  pixels da oclusão no portão. As últimas correções de rotas receberam a suíte
  pura e capturas específicas depois dessa rodada geral de navegador.
- `npm run build`: PASS também após as últimas correções de coordenadas;
  log em `/tmp/presidencia-rotas-build.log`. `git diff --check`: PASS.
- Limites permanecem: revisão completa de todos os objetos pequenos/copas e
  encontros entre rotas diferentes; movimentos contínuos dos 22 jogadores ainda
  são apresentação visual, pois o motor legado não fornece trajetórias físicas;
  adaptação de outros contextos de competição; revisão final da sala/personagem.
  Não declarar o escopo inteiro terminado nem publicado.
- HEAD permanece `2496b73b`. Sem novo commit/push/deploy. Gate exclusivo de Diego
  preservado; fixtures não demonstram login real nem persistência em nuvem.

- Checkpoint essencial atualizado: `/workspace/presidencia-continuidade-20261011.zip`.
  Contém arquivos locais alterados/novos, patch, documentação e capturas de revisão;
  restauração sobre `2496b73b`, sem substituir trabalho posterior. Fontes PNG
  originais permanecem em `/workspace/generated_images` e no acervo anterior.

### Encontros entre NPCs e veículos — continuação do mesmo checkpoint

- `scripts/testa-presidencia-encontros.mjs` verifica carrocerias orientadas e
  apoio dos pés, incluindo pares de rotas diferentes. Encontrou sobreposição
  na junção entrada/calçada, na travessia pedestre/obra antes do asfalto e na
  curva dos veículos em sentidos opostos. Corrigidos os limites dos passeios e
  o afastamento das faixas, mantendo os percursos na rua/passeio.
- PASS: 600 segundos por cenário, amostras a cada 100 ms, com/sem obras e
  com/sem asfalto, todos os negócios presentes. Suíte pura de partida/rotas
  também passou depois. É evidência dos quatro cenários, não um resolvedor
  físico genérico para qualquer NPC/rota nova nem prova de todos os instantes.
- O restante da revisão de objetos pequenos/copas continua pendente. Os testes
  de encontros não substituem conferir o chão e os obstáculos na arte.

### Recortes ocultos no mapa detalhado

- `PresidenciaEstadioTerritorio` limita a criação dos recortes ao retângulo
  que cruza o polígono da camada e a parte já construída. Aplica também aos
  oclusores. Mantém posição/escala originais e margem de 1 px junto ao clip.
- Na cena completa de referência a 900×600, os recortes montados passaram de
  1.800 para 314. As imagens de detalhe efetivamente carregadas continuaram
  307: a economia comprovada é de DOM/observadores, não de tráfego de rede.
- Capturas antes/depois em `/tmp/presidencia-detail-antes.png` e
  `/tmp/presidencia-detail-depois.png`: comparação inicial com 49 pixels
  diferentes em 540.000, diferença máxima 8/255. Não afirmar igualdade exata
  nem ganho de FPS sem medir. A fixture agora oferece `renderDetailReview`.

### Bola apoiada nos jogadores entre os eventos

- Removida a trajetória circular independente da bola. A apresentação agora
  alterna domínio, passe pelo chão e recepção nos pés de jogadores do XI real,
  com continuidade entre os ciclos e o mesmo relógio das duas câmeras.
- Gols, assistências e chances continuam prioritários e recebidos do placar.
  Essa circulação NÃO é dado de posse/passe produzido pelo motor legado e
  não gera estatística ou resultado. O motor ainda não fornece trajetórias
  físicas de todos os atletas; não apresentar isso como simulação física completa.
- PASS na suíte pura: apoio exato durante domínio/recepção, continuidade de
  posição no próximo passe, bola no centro antes do início e placar intacto.

### Validação final deste avanço local

- Build final após circulação da bola: PASS (`/tmp/presidencia-bola-build.log`).
- Após a otimização dos recortes: PASS nas 47 etapas em três larguras e na
  comparação de pixels da profundidade. Após a nova circulação da bola: PASS
  na sincronia das câmeras, no LiveScoreCard real e na câmera interna/zoom/falha
  de imagem. Autenticação de fixture, rede externa bloqueada.
- Suítes puras de partida/rotas e encontros entre atores: PASS. Diff sem erros
  de whitespace. O checkpoint essencial foi atualizado novamente com este
  estado, incluindo os dois scripts novos de revisão/teste.
- Nada foi commitado ou publicado neste avanço. Não afirmar conclusão global:
  permanecem os limites explicitados acima e a revisão visual final do usuário.

## Feedback de Diego sobre escala/apoio/direção — 11/10, print 1001254142

Diego questionou o tamanho dos jogadores, enquadramento, direção sem intenção e
sensação de flutuação, esperando algo em 3D. Esclarecido: implementação atual é
2,5D (imagens em perspectiva e sprites), NÃO uma cena com jogadores em 3D real.
Não chamar estas correções de conversão para 3D ou de movimentação tática pronta.

- Escala vertical agora inclui inclinação ESTIMADA pelos eixos projetados do
  campo 105×68. Referências: atleta 1,80 m, bola esférica 22 cm. Altura projetada
  das balizas usa a mesma escala. É aproximação sobre a imagem, não calibração
  de uma câmera 3D real. Câmeras interna/mapa compartilham a regra.
- Removido drop-shadow fixo/deslocado do corpo e da bola. Jogadores têm sombra
  de contato no ponto do pé medido por alfa em cada quadro. Atlas continua
  original, sem olhos/nariz/boca. Um wrapper interno recorta os quadros sem
  cortar a sombra. Bola no chão tem contato; lance elevado não carrega essa
  sombra junto no ar.
- Passada passou a depender da distância aproximada percorrida, em vez de
  rodar sempre a 7 quadros/s apesar de deslocamento lento. Goleiros não ciclam
  passada parados. Poses ainda só frente/costas: orientação completa e
  movimentos com intenção tática continuam pendentes.
- Testes de navegador medem pés no plano e centro vertical da sombra no zoom;
  conferem também apoio horizontal com os pixels reais do alfa de cada pose.
  Não confundir esses testes com aprovação visual final ou prova de 3D real.
- Suíte pura de partida e encontros: PASS. Sincronia de câmeras e pinça/arrasto/
  rotação no celular: PASS. Última captura: test-results/mapa-browser/partida.png
  e partida-zoom.png. Tudo local; nenhum commit/push/deploy.
- Fechamento desta correção: build final PASS
  (`/tmp/presidencia-perspectiva-final-build.log`), teste do apoio pelo alfa PASS,
  câmera interna/zoom/falha PASS e `git diff --check` PASS. Checkpoint essencial
  atualizado com os arquivos e capturas desta revisão.

## Partida 3D — avanço local de 11/10 após o pedido de Diego

**O trabalho completo NÃO está concluído nem publicado.** Diego pediu jogo
integrado ao gramado em 3D, passes/chutes/reposições, juiz, técnicos/bancos e
velocidade igual à simulação. Preservado HEAD `2496b73b`, sem commit/push/deploy.
A ordem vigente é acumular localmente e publicar somente ao final. A chave de
acesso verificada do Diego permanece a mesma; nenhuma conta real foi alterada.

### Implementado nesta continuação

- `presidencia-futebol-3d.tsx/css`: cena Three.js carregada somente ao abrir a
  câmera, campo 105×68m, bola de 22cm, jogadores articulados de ~1,80m, sem olhos,
  nariz ou boca. Gramado, linhas, traves 7,32×2,44m, redes e participantes usam
  coordenadas e profundidade 3D, com sombras no chão. O plantio segue o gramado
  comprado. As peças dos personagens são uma primeira modelagem procedural,
  **não uma arte final aprovada**. Não substituir o acervo aprovado por elas.
- Juiz seguindo a bola, dois técnicos nas áreas técnicas e dois bancos fora
  da linha lateral. Até sete reservas reais por equipe, fornecidos pelo elenco,
  excluindo o XI vigente; não cria jogador fake para preencher banco vazio.
- Câmera ampla, pinça/arrasto/giro, enquadramento que considera os gols e bancos,
  orientação inicial adaptada ao celular em pé. Limite DPR 2 e junção das
  geometrias estáticas para reduzir chamadas de desenho. WebGL e controles são
  descartados ao fechar. Falha de WebGL mostra aviso; vista anterior preservada.
- `presidencia-futebol-motor.ts`: apresentação determinística em passos de 1/60s,
  movimento em metros, domínio, escolha de passe, apoio/marcação, interceptação,
  separação e rejeição de passos que atravessariam outro jogador ou o juiz.
  Laterais, cruzamento de escanteio após defesa desviada, tiro de meta, rebote na
  trave e saída no centro. O autor/assistente vêm do evento real quando fornecidos.
- Placar, mapa e campo compartilham relógio/posições. O mapa ilustrado continua
  usando sprites, agora nas posições do mesmo motor; há acesso à câmera 3D na
  aba do estádio. **O mapa exterior inteiro ainda não virou uma cena 3D.**
- `context.speed` alimenta o relógio visual; pausa não avança. Na prévia privada,
  os timers do gol/chance, sua animação no placar e o campo usam a velocidade
  capturada no início do lance. Em 4× o gol confirma em 225ms em vez de 900ms.
  Alterar velocidade na mesma rodada preserva o minuto alcançado. O instante de
  gol continua pertencendo ao `LiveScoreCard`; a apresentação não decide placar.
- Three.js 0.180 e tipos adicionados ao package/lock. Código 3D em chunk lazy.
  Sem mudanças de banco, regras econômicas, autoridade online ou persistência.

### Evidências locais

- `scripts/testa-presidencia-futebol-motor.mjs`: 22 atletas, limites de velocidade,
  domínio próximo dos pés, trajetória igual com atualização por frame ou tardia,
  4×/pausa, gols oficiais, lateral com lançamento alto, defesa→escanteio→cruzamento,
  tiro de meta, trave, chute alto, XI do segundo tempo e gol de 45' ainda na fila.
  Cinco minutos simulados verificam separação entre todos os jogadores. O teste
  encontrou sobreposição antes da trava de colisão; a falha foi corrigida.
- `scripts/testa-presidencia-3d-browser.cjs`: Chromium/WebGL local, 22 jogadores,
  pausa, 4×, gol confirmado, zoom, pinça real via CDP e viewport 390px.
- `scripts/testa-presidencia-placar-real.cjs`: placar de produção com identidade
  simulada, fila de gols, intervalo/fim/rodada nova, chances sem gol, confirmação
  em 4×, alteração de velocidade sem retroceder minuto e revogação da prévia.
- `scripts/testa-presidencia-sincronia-browser.cjs`: duas câmeras do estádio com
  o mesmo motor, reabertura/pausa/gol, teto fechado, outro matchId e limpeza.
- Testes de toque e câmera antiga continuam passando, selecionando explicitamente
  “VISTA DO ESTÁDIO”. Acervo de etapas e fallback da imagem preservados.
- Build passou; persistem avisos de tamanho de chunks/importação já conhecidos.
  Capturas: `test-results/futebol-3d/campo.png`, `zoom.png`, `celular.png`.
  Testes não equivalem a login real do Diego nem a teste de GPU em seu celular.

### Pendências reais — não declarar perfeição/conclusão

- O estádio/arquibancadas e entorno aprovados continuam na vista ilustrada.
  A câmera nova é do campo e áreas técnicas; falta reconstruir e calibrar a
  arquitetura completa, etapas de construção e transição contínua mapa→campo
  em 3D, preservando os encaixes da imagem final. Ruas/carros/NPCs externos
  continuam com as melhorias anteriores e sua navegação em 2,5D.
- Acabamento final dos corpos, uniformes, gramado de perto, defesas/mergulhos,
  disputas e animações mais naturais ainda precisa de trabalho e revisão visual.
  Os modelos atuais são simples e articulados; não são atletas finais realistas.
- Este é um motor de **apresentação**, não uma substituição do simulador de
  resultados. Passes e reposições visuais não viram estatísticas oficiais.
  Ainda não há arbitragem completa de faltas/impedimento/cartões, disputa aérea
  física ou toda a variedade tática de um simulador completo de futebol.
- Reposições reposicionam a bola após a interrupção; não há busca física da bola
  por gandula. O lance oficial faz uma transição curta para seus participantes,
  não uma cadeia de posse já planejada pelo simulador antes do evento.
- Velocidade de um lance em andamento fica fixada ao início dele; trocar 1×→4×
  durante esse chute afeta os próximos lances e o relógio, não retima o chute já
  iniciado. A troca de aba que desmonta o próprio placar precisa de auditoria
  maior; copas/partidas fora de casa ainda não têm todos os adaptadores.
- Sem benchmark em aparelho físico ou aprovação visual de Diego. Nenhum deploy
  realizado. Antes de publicar: revisão das imagens e regras locais de commit,
  conciliar main, repetir verificações pertinentes e confirmar escopo final.

Revisão final desta continuação: a bola da trave impacta antes do poste em vez
 de atravessar sua posição; velocidade inválida cai em 1×; abrir diretamente o
segundo tempo começa em 45'. O encaixe de substituto reutiliza a posição do
atleta substituído quando possível, evitando nascer sobre outro corpo.

## Correção de orientação dos bancos — pedido seguinte de Diego

Diego reforçou que o campo pertence ao estádio da vista geral: a barreira da
lateral próxima encobre a área técnica quando o estádio está completo. Os dois
bancos, reservas e técnicos devem ocupar a lateral oposta, ao fundo da imagem,
voltados para o gramado. Esta é a referência para toda a integração futura.

Correção local em `presidencia-futebol-3d.tsx`: áreas técnicas movidas em conjunto
para z negativo (bancos z=-40, técnicos z=-37, lateral do campo z=-34), encostos
para fora e corpos olhando para +z, em direção ao jogo. A câmera inicial conserva
os mesmos lados no computador e celular; removida a rotação automática de 90°
em telas verticais. O botão VER CAMPO inclui os bancos na nova lateral.

A referência é a borda superior de CAMPO_INTERNO/CAMPO_MAPA. A arquitetura
completa ainda não está reconstruída na cena 3D: esta correção não comprova a
oclusão final de todas as arquibancadas/coberturas. Não apresentar o campo isolado
como conclusão da integração com o estádio. Acervo e vista geral preservados;
sem commit, push ou deploy.

## Campo integrado à vista do estádio — continuação local de 11/10

A partida agora usa o mesmo enquadramento do estádio, incluindo arquibancadas,
com bancos/reservas/técnicos na lateral oposta. `Campo` recebe a cena Three.js
transparente; a câmera registrada mapeia os quatro cantos do campo físico
105×68 m para CAMPO_INTERNO ou CAMPO_MAPA. Zoom e arrasto transformam o conjunto
inteiro. A primeira abertura enquadra a imagem completa, inclusive no celular.
A resolução do canvas acompanha zoom/DPR, limitada a 4096 px.

A arquitetura continua ilustrada: não é um estádio inteiramente reconstruído
em 3D. O chão tem registro exato dos quatro cantos; a escala vertical dos corpos
é estimada pela perspectiva da arte. Não habilitar órbita livre nesta composição.
Uma máscara da arte original na frente encobre a camada 3D na região da cobertura
próxima; não equivale a colisão/oclusão volumétrica de toda a arquitetura.
Estágios incompletos usam a vista progressiva, sem inserir a cobertura completa.
Falha da imagem interna recupera a vista geral; indisponibilidade WebGL usa a
representação anterior. O botão 3D da câmera do estádio também usa `Campo`.

Corrigido carregamento tardio da textura: mesmo com jogo pausado, a conclusão
do carregamento do gramado solicita novo desenho (antes podia ficar escuro).
Mantidos padrão sem feições, acesso restrito existente e simulador oficial.
Nenhum commit/push/deploy, nenhuma alteração de conta real.

Validação local Chromium: teste novo `testa-presidencia-estadio-integrado.cjs`
cobre enquadramento, oclusão por comparação de pixels, etapas incompletas e
falha de imagem. `testa-presidencia-camera-registrada.mjs` confere quatro cantos,
altura/profundidade e posição dos bancos/técnicos. Testes de navegador 3D,
partida anterior, gestos móveis e sincronização mapa/placar passaram.
Captura: `test-results/futebol-3d/estadio-integrado.png`.
O teste de pinça compara ampliação relativa ao enquadramento inicial, pois a
abertura passou a ajustar o estádio inteiro em vez de começar em zoom 1.

Pendências gerais anteriores continuam: acabamento dos modelos/animações,
variedade e regras completas de futebol, adaptadores de partidas fora/copas,
validação em aparelho físico, revisão visual de Diego e arquitetura 3D completa.
Esta integração visual em perspectiva fixa não encerra essas pendências.

Fechamento desta rodada: `npm run build` (TypeScript + Vite) e
`git diff --check` passaram. Regressão por pixel do gramado verde em partida
pausada também passou. Build registra aviso existente de importação dinâmica
ineficaz em `screens.tsx`; não bloqueia compilação.

## NPCs, mapa 3D e progresso do gramado — continuação seguinte

A vista geral `PresidenciaEstadioMapa` passa a usar o mesmo renderer 3D e motor
compartilhado da câmera da partida. Antes, o mapa ainda desenhava sprites.
Mantém 22 atletas reais e a bola, juiz e áreas técnicas. Teto fechado esconde a
partida na vista externa. WebGL indisponível recupera a representação anterior;
carregamento sob demanda usa essa representação temporariamente. Não altera
resultados, salva obras, compra bens nem publica para contas reais.

- Gramado 3D cresce continuamente pela fração investida, incluindo o pedaço
  parcial de uma faixa. Antes arredondava a vinte faixas. UVs agora percorrem
  o campo inteiro sem repetir a textura completa em cada faixa estreita.
- Terra recebe variação procedural de cor em coordenadas do campo, com redução
  de grão subpixel para evitar cintilação. Não é uma nova arte raster aprovada
  nem substitui o acervo das etapas. Falha da textura de grama conserva material
  verde e solicita novo desenho mesmo com partida pausada.
- Modelo articulado extraído para `presidencia-atleta-3d.ts`. Apoio no chão usa
  os oito cantos de cada chuteira, evitando que ponta/calcanhar atravessem o
  piso quando o pé gira. Retorno do chute e dos braços após lateral é gradual.
  Figuras continuam simples e sem olhos, nariz ou boca; não são modelos finais.
- Zoom do mapa durante uma partida chega a 12× (sem partida continua 4×).
  Renderer recorta o frustum à porção visível do mundo: mantém a posição da
  arte e usa pixels para a área na tela, em vez de rasterizar o mapa inteiro e
  ampliar um recorte. Buffer limitado a 4096 por dimensão; não estica o campo.
  A arquitetura ilustrada continua limitada pela resolução do acervo. Esse
  recorte não converte o entorno em geometria 3D nem cria detalhe inexistente.

As regras anteriores continuam: cobertura após dois andares, lotes fixos,
estabelecimentos só adquiridos, tráfego/NPCs externos nas rotas existentes,
portões/copas como oclusores e obstáculos de solo cadastrados. Não houve nova
revisão de TODOS os objetos pequenos do entorno; essa pendência permanece.
A janela da sala conserva a integração das etapas já existente.

Novas verificações: `testa-presidencia-atleta-3d.mjs` (400 poses e apoio real),
`testa-presidencia-gramado-3d.mjs` (301 frações sem lacunas/sobreposição),
`testa-presidencia-janela-3d.mjs` (registro após zoom/arrasto/crop),
`testa-presidencia-mapa-3d-etapas.cjs` (jogo em movimento na várzea, gramado
parcial, primeiro andar, completo, recuperação sem WebGL e viewport móvel).
Teste de sincronia atualizado para duas cenas 3D do mesmo jogo, incluindo
reabertura, pausa, gol, troca de partida, teto e limpeza da publicação local.
Capturas em `test-results/futebol-3d/mapa-*.png`. Testes são fixtures locais,
não uma confirmação de desempenho em celular físico ou de login na conta real.

Sem commit, push ou deploy. Não declarar todas as artes/NPCs/motor concluídos:
continuam pendentes acabamento visual, variedade de movimentos/regras,
adaptação completa de copas/fora de casa e revisão final de Diego.

Validação final desta rodada: build TypeScript/Vite PASS em
`/tmp/presidencia-zoom-final-build.log`; `git diff --check` PASS. Testes locais de
etapas 3D, integração/oclusão, sincronização das duas vistas e WebGL/4×/390 px
passaram após estabilizar os arquivos. Durante uma execução concorrente com
build/edições, a página de QA recarregou e perdeu a fixture; essa execução NÃO
conta como aprovação. Reexecutado com arquivos estáveis e todos passaram.
A captura de 12× (`mapa-completo-12x.png`) e a de várzea com zoom foram inspecionadas.
Teste de 12× confirma buffer limitado a 4096 sem reduzir abaixo de um pixel
renderizado por pixel CSS no viewport testado. Nenhum benchmark físico.
Também passaram as verificações offline de 2048 combinações de camadas,
4096 combinações de mundo e requisitos/custos privados existentes.

## Articulação e contato da bola; acesso do hotel — rodada seguinte

Personagens 3D mantêm altura e referência física, agora com torso ajustado,
segmentos arredondados, pescoço, mãos e cotovelos articulados. Nenhuma feição
facial adicionada. Goleiros usam luvas e pose de recepção, dirigida pelo evento
oficial de defesa; não é arbitragem nem resultado novo. Bola defendida chega
entre as mãos no enquadramento físico (testado nos dois lados). A apresentação
ainda não possui mergulho completo com queda/levantada do goleiro.

Corrigido um desencontro real: em gol com assistência, o autor podia iniciar o
chute visual antes de receber a bola. Agora o movimento começa na passagem
exata do passe para o chute, incluindo velocidade 4×. A saída fica 0,38 m à
frente do corpo, não no seu centro. O assistente também orienta o corpo para o
autor e recebe o gesto de passe no trecho correspondente. Nenhum placar/save
ou estatística oficial alterado; continua motor de apresentação.

Técnicos acompanham a direção da bola sem sair da área técnica e fazem gesto
leve dependente do mesmo relógio. Bancos continuam na lateral distante: altura
do assento corrigida para a pose dos reservas, com pés no solo. Reservas reais
continuam filtradas por escalação/flag fake; nenhum jogador foi inventado.

Inspeção da arte do hotel identificou passagem próxima ao canteiro elevado da
palmeira (solo próximo de x464/y580). Cadastrado obstáculo com a pavimentação,
rota desviada pelo passeio à direita e destino original preservado. A copa
recebe oclusão por profundidade junto aos demais recortes da arte aprovada.
Não interpretar isso como revisão completa de TODOS os objetos do mapa.

Novos testes `testa-presidencia-contato-bola.mjs` e
`testa-presidencia-acessos.mjs`: contato passe/chute 1×/4×, bola entre as mãos,
liberação da pose, circulação de dez minutos em cinco etapas e desvio do hotel.
Teste de profundidade ampliado para copa do hotel; modelo sentado acrescentado
à verificação física de apoio. Validação final da rodada registrada abaixo.
Sem commit/push/deploy. Arquitetura ilustrada, regras completas de futebol,
adaptadores de competições e avaliação em celular físico continuam pendentes.

Revisão visual da área técnica encontrou outra diferença: o banco na coordenada
antiga z=-40 sobrepunha a faixa de parede da arte interna. Agora banco z=-36,8,
técnico z=-35,2 e fundo do piso z=-37,5 respeitam a faixa útil atrás da linha
z=-34. As coordenadas estão em `presidencia-area-tecnica.ts`; a faixa de solo
sob bancos/técnicos também é uma superfície 3D, acompanhando cada fração do
gramado. Isso substitui a posição anterior, preservando o lado distante e a
orientação para o jogo. Arquibancadas continuam ilustradas.

Passes naturais conservam a orientação do jogador durante o gesto. Lateral
não dispara um chute simultâneo à reposição com as mãos. Coberto por teste de
cinco minutos; continua sem alterar as estatísticas oficiais.

Refletores: a iluminação da cena 3D agora acompanha a mesma condição da arte
(extras `refl` + Geral concluída). Antes, a camada 3D anulava visualmente a
mudança de luminosidade do gramado ilustrado. Gramado 3D também passa a ler a
fração do catálogo oficial, removendo o custo 30 duplicado no renderer.

Fechamento verificado desta rodada: build TypeScript/Vite PASS em
`/tmp/presidencia-refletores-build.log`; `git diff --check` PASS. Passaram os
novos testes de contato/gestos, poses sentadas, acessos e iluminação por pixels,
mais o motor (cinco minutos), registro da câmera, personagens no navegador,
profundidade, etapas do mapa 3D, composição do estádio e sincronização.
A última mudança de refletores foi seguida por teste específico e repetição da
composição/recuperação de imagem. Capturas inspecionadas: `goleiro-defesa.png`,
`bancos-personagens.png` e `rotas-hotel.png`. Novo banco fica efetivamente sobre
o piso; caminho do hotel contorna o canteiro. Um pedido de execução expirou na
revisão automática; a repetição permitida foi aceita e os testes foram concluídos.
Nenhuma publicação. Não são testes em conta real nem benchmark em celular físico.

Continuam abertos: auditoria visual exaustiva das copas/objetos pequenos fora dos
acessos verificados, modelos/animações mais complexos (incluindo mergulho do
 goleiro), adaptação completa de partidas fora/copas, representação volumétrica
 da arquitetura e aprovação visual final. Não afirmar que 'tudo' foi concluído.

### Continuação — profundidade no acesso da estação (12/10)
- Revisadas na captura ampliada as duas palmeiras junto à circulação da estação. Adicionados recortes registrados na mesma arte, ordenados pela posição do tronco no solo (302 e 311), para esconder pedestres atrás e mantê-los visíveis à frente.
- A seleção dos oclusores agora acompanha a compra que desenha cada objeto: palmeiras da estação dependem de `estacao`, demais recortes existentes continuam dependendo de `asfalto`. Evita reintroduzir árvores sobre o lote vazio ou perder profundidade quando a estação existe sem asfalto.
- Teste real de pixels no Chromium passou para portão, hotel e ambas as palmeiras; conferiu estação ausente e estação comprada sem asfalto. Teste de circulação de dez minutos em cinco estágios e verificações de 4096 combinações passaram, sem acesso a contas reais.
- Nenhum commit, push ou deploy. Continuam pendentes as limitações documentadas acima, especialmente movimentos completos de mergulho/recuperação do goleiro, regras adicionais e auditoria dos demais objetos pequenos do entorno.
- Compilação TypeScript/Vite aprovada; apenas avisos existentes de importações dinâmicas. Captura local ampliada atualizada em `test-results/mapa-browser/rotas-estacao-cena.png`.

### Continuação — defesa lateral e relógio dos lances (12/10)
- Goleiros agora têm queda lateral nas defesas espalmadas e recuperação gradual, inclusive quando o evento oficial desaparece durante a queda. Posição no campo é conservada durante a defesa/recuperação. Personagens continuam sem feições.
- `pose` reseta orientação completa por quadro e verifica os volumes de todas as partes do corpo durante a queda, evitando ombro/cabeça/luvas abaixo do solo. Animação procedural lateral; ainda não é um acervo de movimentos atléticos capturados nem um sistema completo de física corporal.
- A posição da bola na defesa é medida nas luvas do mesmo esqueleto articulado usado pelo renderer. Um único esqueleto auxiliar CPU é reutilizado; não cria canvas/WebGL nem geometria a cada quadro. O alvo do rebote fica fixo no contato, sem seguir as mãos durante a recuperação.
- Encontrada e corrigida a progressão de lances por tempo real durante pausa: quando disponível, o motor usa o relógio visual compartilhado também para chute/defesa/rebote. Mudança de velocidade afeta o lance em andamento. Confirmação oficial de gol continua prevalecendo; nenhuma estatística foi criada/alterada.
- Renderer deixa de manter animação contínua enquanto o relógio compartilhado está parado; zoom, mudanças de estado e carregamento de textura continuam repintando a cena.
- Testes offline: defesa em ambos os lados a 1x/4x, contato exato das luvas, limites do corpo no solo, pausa e recuperação, pausa de cinco segundos no meio do lance seguida de mudança a 4x. Também passaram contato passe/chute, motor de cinco minutos, poses articuladas, encontros/acessos de dez minutos e combinações de obras/gate privado.
- Captura `test-results/futebol-3d/goleiro-defesa-lateral.png` e cenas de goleiro/bancos atualizadas. Teste de duas câmeras passou antes da otimização de pausa; regressão final registrada a seguir.
- Escopo segue local, sem commit/push/deploy e sem conta real. Restam adaptação das outras competições, variedade de regras/movimentos, auditoria dos demais pequenos objetos e avaliação em aparelho físico. Arquibancadas/entorno seguem arte registrada; não declarar mundo inteiro volumétrico nem motor autoritativo completo.
- Regressão final revelou um estado antigo da câmera do mapa reaplicando/limpando o lance recém-publicado. Corrigido em `quadroFutebol3D`: a publicação mais recente do relógio prevalece sobre uma prop antiga da outra câmera. Teste offline reproduz a ordem novo → antigo → novo; comparação real de pixels/dados das duas cenas confirma bola idêntica e congelada no lance pausado.
- Rodada final aprovada no Chromium: duas câmeras/pausa no lance/placar/reabertura/teto; campo 3D desde terreno vazio e grama parcial até estádio completo; obras não compradas ausentes; fallback WebGL; 22 jogadores, 4x, gol confirmado, viewport de 390 px e gesto de pinça. Sem login real nem gravação remota.
- Compilação final TypeScript/Vite aprovada após a correção de estado antigo; apenas avisos já existentes de importações dinâmicas. `git diff --check` limpo. Checkpoint local atualizado com os arquivos e capturas deste lote.

### Continuação — copas, recepção e revisão das rotas (12/10)
- Novo adaptador puro `presidencia-partida-competicao.ts`: usa XI e banco fornecidos pela competição, valida 11 reais com goleiro, não completa elenco fictício, não muda resultado nem save. Mandante define o estádio, e instituições sem estádio cadastrado não herdam as obras do usuário.
- Copa Legends/Brasil/Supercopa pelo componente existente `MyCopaMatch`: campo recebe o elenco da ida/volta, velocidade e identidade separada por temporada/fase/perna/mandantes. Contexto é fornecido somente quando o gate privado da tela autoriza. Teste do componente REAL no navegador confirmou gol a 4x, troca dos XI/estádio entre ida e volta, limpeza e bloqueio da prévia.
- `JogoGrande` internacional (Libertadores/Champions/Mundial) ligado ao mesmo adaptador com os XI congelados da campanha. Acesso 3D segue `usePresidentPreview`. Instituições bot com `teamId=-1` permanecem sem vínculo com o estádio particular; nenhum banco de reservas foi inventado para a campanha que só fornece XI. Adaptador testado offline; fluxo internacional completo com conta/campanha reais ainda não foi percorrido.
- Contexto da partida informa `homeClubId`; aba do estádio acompanha a publicação ativa do seu mandante, inclusive copas. Jogo fora de casa e partida finalizada não aparecem no mapa do clube. Consultas por ID exato anteriores continuam compatíveis.
- Recepção com o pé: gesto de amortecimento, breve apoio parado, orientação mantida e bola ao alcance antes de continuar. Interceptação rasteira exige bola abaixo de 55 cm; não captura cruzamento alto apenas por proximidade no chão.
- Testes da nova trajetória revelaram congestionamento em reposição. Afastamento dos demais jogadores libera cobrador; passos finais continuam limitados às linhas do campo, com separação entre corpos. Passaram simulação de cinco minutos (lateral, escanteio, travessão, tiro de meta, intervalo), contatos, defesas/recuperação, 400 poses e teste específico de domínio/interceptação aérea/rasteira.
- Revisadas capturas dos acessos da frente, direita, hotel e estação; diagnóstico agora inclui choperia, entrada e estacionamento. Dois recortes adicionais de palmeiras na calçada direita, com profundidade do tronco conferida na captura aproximada (`rotas-calcada-leste.png`, bases em y=740 e y=755).
- Todas as rotas dos cenários de circulação agora têm teste de chegada ao destino original, além da amostragem de dez minutos contra obstáculos/corpos. Testes passaram sem NPC ficar com rota truncada. Isso cobre as rotas atuais; não equivale a navegação livre em qualquer ponto do cenário ilustrado.
- Capturas permanecem locais, bem como todos os arquivos. Sem commit, push, deploy, login de usuário real ou escrita remota. Não declarar futebol autoritativo/física completa, cenário externo volumétrico ou validação em aparelho físico.
- Último gol da copa: para uma partida privada acompanhada ao vivo, `MyCopaMatch` agora deixa o placar drenar a fila de gols ao chegar ao fim e só então mostra o resumo final. Abrir um resultado já encerrado continua mostrando o resultado sem reproduzir toda a partida. Teste real inclui gol aos 90' da volta antes da remoção do campo. A publicação 3D da liga é suspensa enquanto `copaPlaying`, evitando duas fontes concorrendo pelo mapa.

#### Desenho dos personagens e limite de desempenho observado
- Novo `presidencia-personagens-instancias.ts`: partes iguais dos atletas, árbitro, técnicos e reservas são desenhadas em lotes de instâncias, usando as matrizes e cores dos mesmos esqueletos originais. Mantém geometria, contato, sombras e alterações de uniforme; não reduz a resolução do zoom.
- Comparação real no WebGL com 22 personagens: 485 chamadas de desenho → 15; 484 partes em 14 lotes. Apenas 2 pixels de 512×512 tiveram diferença acima de 3 níveis de cor; teste de movimento/troca de uniforme também preservou o resultado (3 canais divergentes). Testes de goleiro/bancos/zoom e duas câmeras passaram após a otimização.
- O teste de relógio expôs a limitação do Chromium com renderização por software neste ambiente: o gol de 4x é agendado em 225 ms, mas a fila do navegador executou o callback após cerca de 669–675 ms e publicou a tela em cerca de 1.04–1.05 s. A redução de chamadas de desenho NÃO eliminou esse atraso local; não declarar fluidez em 4x validada em aparelho real.
- O teste do placar agora captura estados na publicação (evita ler outro lance depois de uma espera do driver) e valida separadamente o prazo agendado de 225 ms, ausência de confirmação antecipada, execução do temporizador antes da publicação, ordem dos gols, mini-placar, intervalo, velocidade e limpeza. Latência de renderização é registrada explicitamente, não escondida como erro no resultado do jogo.
- Rodada final aprovada: TypeScript/Vite (`/tmp/presidencia-validacao-final-build.log`), copa real com gol final/ida/volta/gate, placar real, profundidade por pixels, sincronia entre câmeras, goleiro/bancos com instâncias e zoom/pinça em viewport de 390 px. O build mantém somente avisos existentes de importações dinâmicas.
- Pendências de validação: aparelho físico (especialmente fluidez em 4x) e campanha internacional real. Permanecem os limites do motor de apresentação e do entorno ilustrado descritos acima. Nenhuma publicação realizada.

### Continuação — renderização agrupada e partidas internacionais completas (12/10)
- `Futebol3D` agora agenda os pedidos de repintura por estado, textura, redimensionamento e controles no próximo `requestAnimationFrame`, aproveitando um quadro já agendado. Antes, esses pedidos podiam executar WebGL sincronicamente durante os efeitos da interface, atrasando a publicação do placar. Geometria, resolução, sombras, relógio e duração oficial dos lances foram preservados.
- Comparação local do mesmo teste de placar: antes, temporizador de 225 ms executou em 694,5 ms e a publicação chegou em 1067,3 ms; depois, 526,9 ms e 592,1 ms, respectivamente. São duas medições no Chromium por software, não uma garantia de FPS nem de latência em aparelhos reais. O atraso ainda supera os 225 ms; não declarar desempenho em 4x resolvido.
- Novo `scripts/testa-presidencia-internacional-browser.cjs` usa `makeInternationalCampaign` com o catálogo real e o componente real `JogoGrande`, dentro do `EscProvider`. A fixture está somente em `qa-presidencia-mapa.html`; identidade privada simulada no navegador, rede externa bloqueada e nenhuma conta real acessada.
- Cinco partidas completas aprovadas em 4x: Flamengo × Cerro Porteño (1×0), Olimpia × Flamengo (3×1), Real Madrid × Galatasaray (2×2), Atlético de Madrid × Real Madrid (1×2) e Corinthians × Real Madrid (3×2). Conferidos XI por ID, mandante, troca de partida, chute de cada gol oficial, placar final, callback de encerramento único e gate privado. Segunda execução manteve o campo aberto e verificou WebGL com 22 jogadores nas cinco partidas.
- Isso valida partidas geradas localmente de Libertadores/Champions/Mundial, não o percurso completo de uma carreira autenticada, persistência remota ou uso no telefone físico.
- Regressões aprovadas após o agrupamento: placar real e mini-placar (fila de gols, pausa/intervalo, velocidade, rodada nova e último gol); duas câmeras 3D (relógio compartilhado, pausa de lance, reabertura, troca de partida, teto e limpeza); WebGL/22 atletas/gol/zoom/pinça e viewport de 390 px.
- Trabalho preservado na branch `work`, HEAD `2496b73b`. Sem commit, push ou deploy. A orientação vigente continua acumular localmente e publicar apenas ao final; eventual acesso à funcionalidade permanece restrito a Diego pelo gate existente.
- Compilação TypeScript/Vite aprovada (`/tmp/presidencia-validacao-render-build.log`); avisos de tamanho de chunk/importações dinâmicas permanecem. Captura móvel atual conferida: o enquadramento inicial de toda a arte mantém grandes faixas verdes acima/abaixo no retrato. Zoom funciona, mas aproveitar melhor essa área é uma pendência visual; não confundir viewport grande com campo ocupando toda a tela.

### Continuação — abertura do campo em telas verticais (12/10)
- `Campo` abre em zoom de cobertura quando a área disponível é vertical. Isso remove as faixas verdes vazias na abertura do celular sem esticar a arte ou alterar escala relativa dos atletas, gramado e arquitetura. Em área horizontal, mantém o enquadramento geral anterior.
- A aproximação inicial recorta as laterais do cenário; arrastar permite acompanhar essas regiões. O botão `VER CAMPO` continua encaixando toda a imagem, e nessa visão geral as faixas de proporção são esperadas. Nenhuma câmera independente ou escala artificial dos jogadores foi introduzida.
- Teste WebGL atualizado monta uma nova partida em 390×844, verifica 22 jogadores e cobertura dos quatro limites da área pela cena, depois confere visão geral, gesto de pinça e relógio pausado. Captura conferida visualmente: `test-results/futebol-3d/celular-abertura.png`.
- Regressões aprovadas: composição do estádio completo/oclusão da barreira/recuperação de imagem; mapa 3D desde várzea, grama parcial e primeiro andar até completo; ausência de cobertura e estabelecimentos não comprados, zoom 12x, viewport móvel e fallback sem WebGL. Não equivale a validação em aparelho físico.
- Alteração local, sem commit, push ou deploy. Continua pendente a avaliação de fluidez em 4x em aparelho real e os limites de apresentação/regras descritos nos lotes anteriores.
- Compilação TypeScript/Vite aprovada (`/tmp/presidencia-enquadramento-build.log`), com avisos existentes de tamanho/importações; `git diff --check` limpo. Checkpoint atualizado incluindo a captura da nova abertura móvel.

### Continuação — rotação sem perder o local observado (12/10)
- Campo e mapa agora recalculam o deslocamento ao mudar o tamanho da área: preservam a coordenada do cenário que estava no centro, respeitando os limites de navegação. Antes, preservavam pixels de deslocamento enquanto a escala-base do cenário mudava, desviando o ponto observado.
- A visão geral escolhida por `VER CAMPO`/`VER TUDO` permanece ajustada ao novo formato. A mesma transformação continua sendo aplicada à arte e aos personagens; rotação não altera posição física dos NPCs, bola ou relógio da partida.
- `testa-presidencia-redimensionamento.mjs` aprovado: vertical/horizontal/desktop, ida e volta sem desvio, visão geral e limites do zoom. A infraestrutura offline também conferiu combinações de evolução, pré-requisitos e gate privado.
- `testa-presidencia-rotacao-browser.cjs` aprovado: arrasta e aproxima tanto o campo 3D quanto o mapa, alterna 390×844 → 844×390 → 1100×950 → 390×844 e mede a coordenada observada no DOM; verifica bola pausada sem movimento e enquadramento geral depois da rotação.
- Teste em navegador local; não em telefone físico. Nenhum commit, push, deploy, login real ou alteração remota. A restrição de acesso futuro a Diego permanece intacta.
- Compilação TypeScript/Vite aprovada (`/tmp/presidencia-rotacao-build.log`); permanecem os avisos existentes. `git diff --check` limpo e checkpoint local atualizado.

### Continuação — calçada direita e canteiro (12/10)
- Revisão da captura ampliada identificou a rota junto ao canteiro florido da calçada leste. Deslocada a linha de passagem para o piso e registrado o canteiro em `obstaculosDoEstadio`, condicionado à compra do asfalto, usando coordenadas da mesma arte.
- Primeiro deslocamento ainda interrompia a rota ao considerar o corpo e a faixa de retorno; corrigida a folga sem remover a proteção. A nova extensão da rota também revelou um encontro diagonal dos pés aos 480,8 s; ampliado o afastamento das faixas opostas da calçada de 2,5 para 2,75 unidades. Demais percursos mantidos.
- Testes de acesso aprovados em cinco etapas por dez minutos: nenhum ponto amostrado invade obstáculos e todos os destinos originais continuam alcançáveis. Testes de encontros aprovados em quatro cenários por dez minutos, com amostragem de 100 ms, sem sobreposição dos retângulos de pés/carros. Canteiro é bloqueado com asfalto e não aparece como obstáculo em terreno sem essa compra.
- Teste por pixels aprovado: oclusão atrás e reaparecimento à frente da travessa e palmeiras do hotel, estação e calçada, respeitando as compras. Capturas diagnósticas e limpas atualizadas em `test-results/mapa-browser/rotas-*.png`; a linha roxa é somente diagnóstico local.
- As verificações cobrem as rotas atuais e os cenários amostrados; não constituem navegação livre nem garantia de todas as combinações futuras. Entorno permanece ilustrado, com recortes de profundidade. Sem commit, push, deploy ou alteração na conta real.
- Compilação TypeScript/Vite aprovada (`/tmp/presidencia-calcada-build.log`), mantendo avisos existentes. `git diff --check` limpo; checkpoint local atualizado com código, verificações e capturas.

### Continuação — posicionamento para saída de bola (12/10)
- O motor de apresentação agora mantém os não cobradores no alvo do próprio campo durante `saida` e só libera a cobrança quando eles efetivamente retornaram e os adversários estão a pelo menos 9,15 m da bola. Antes, bastava o cobrador chegar ao centro e passar o prazo mínimo, mesmo com outros atletas fora de posição.
- Preservados deslocamento gradual, separação entre corpos, bola no centro durante a espera e cobrança pela equipe que sofreu o gol. Nenhum novo gol, placar, evento estatístico ou regra financeira foi criado. Eventos oficiais da simulação continuam sendo a fonte de verdade.
- Novo `testa-presidencia-saida.mjs`: após jogo em andamento, confirma gol e acompanha o retorno/cobrança em ambos os lados e tempos; verifica posições na cobrança, bola aguardando no centro, ausência de bloqueio permanente e placar original intacto.
- Testes aprovados: motor de cinco minutos (velocidades, separação, reposições, intervalo), contato passe/chute, domínio/interceptação, defesas/recuperação e relógio compartilhado. Regressão WebGL aprovada com 22 atletas, pausa, 4x, gol, zoom/pinça e tela de 390 px.
- Trabalho local, sem commit, push, deploy ou escrita remota. Não equivale a um motor completo de arbitragem, impedimentos/cartões ou validação de desempenho em aparelho físico.
- Corrigida também a reposição após defesa segura: quando `defendeu` não é espalmar, o goleiro mantém a posse em jogo, acomoda a bola aos pés e distribui para um companheiro. Antes, o encerramento desse lance preparava indevidamente um tiro de meta. Defesa espalmada mantém o caminho já existente para escanteio.
- Teste adicionado ao motor para ambos os goleiros verifica posse, bola próxima aos pés, passe posterior e ausência de tiro de meta. Motor, contato, mergulho/recuperação e nova saída de bola passaram novamente após essa mudança. A acomodação aos pés continua procedural; não foi adicionada uma biblioteca de movimentos de lançamento com as mãos.
- Compilação final TypeScript/Vite aprovada (`/tmp/presidencia-reposicoes-build.log`), com avisos existentes; `git diff --check` limpo. Checkpoint atualizado, mantendo todo o trabalho acumulado sem publicação.

### Continuação — emulação móvel e sombras no zoom pausado (12/10)
- Novo `testa-presidencia-dispositivos.cjs`: contextos móveis com toque, meta viewport e DPR real de emulação. Aprovados 320×568/DPR2, 390×844/DPR3, 844×390/DPR3 e 768×1024/DPR2. Verificou 22 jogadores, ausência de transbordamento horizontal, execução em 4x, toque no zoom, bola congelada na pausa, cobertura do buffer e passagem do estádio completo para várzea sem cobertura indevida.
- Amostra de 12 atualizações por formato no Chromium/SwiftShader: 5,9; 3,3; 2,8; 3,8 FPS observados, respectivamente. Razão entre avanço do relógio e tempo real: 4,02; 4,00; 4,00; 4,00. Resultado funcional aprovado NÃO é aprovação de fluidez: renderização por software neste ambiente é lenta, e não há acesso a um aparelho físico. Dados locais em `test-results/futebol-3d/dispositivos.json`; script permite reproduzir a amostra.
- `Futebol3D` reutiliza o mapa de sombras quando apenas a câmera muda numa cena pausada. Mudança de estado, tempo de simulação ou pose de velocidade do árbitro invalida a sombra antes de desenhar. Não reduz resolução, geometria, materiais nem precisão do zoom. Durante jogo em movimento, sombras continuam atualizando.
- Novo `testa-presidencia-sombras-browser.cjs` compara com atualização automática anterior via interceptação local do módulo: três aproximações na pausa passaram de 208 para 106 chamadas WebGL, com zero canais de imagem divergindo mais de 3 níveis. Isso comprova economia de desenho nessa situação, não ganho de FPS durante a partida em movimento.
- Regressão final WebGL aprovada: 22 atletas, relógio 4x, pausa, gol, zoom e pinça em 390 px. Nenhuma conta real acessada, rede externa bloqueada nos testes, sem commit/push/deploy.
- Compilação TypeScript/Vite aprovada (`/tmp/presidencia-dispositivos-build.log`), com avisos existentes; `git diff --check` limpo. Checkpoint atualizado incluindo o relatório JSON de dispositivos.

### Revisão integrada — sala, personagem, janela e prévia visual (12/10)
- Corrigida a dependência indevida da janela completa em relação aos negócios externos. `estadioCompletoNaJanela` exige todos os setores, refletores, telão, cobertura e retrátil; loja, hotel, praça, choperia, estação e estacionamento não são exigidos porque não aparecem nessa câmera. A vista aérea conserva sua regra própria; nenhuma compra ou obra é concedida. Saves desconhecidos e setores a 99,99% continuam sem receber imagem completa.
- Janela aberta e fechada agora usam a arte completa aprovada quando os itens visíveis estão prontos, sem sobreposição de recortes parciais da mesma cobertura. Verificados pixels/capturas locais e ausência de negócios não comprados na aérea. Testes: `testa-presidencia-janela-completa.mjs` e `testa-presidencia-janela-browser.cjs`.
- Testes antigos da sala passaram a usar o navegador instalado pelo helper `browserOptions`, incluindo Linux/Chromium e caminho configurável `PRESIDENCIA_BROWSER_PATH`, sem baixar dependências. Removido caminho absoluto do computador Windows do teste de primeiro acesso. Não muda o aplicativo nem suas permissões.
- Reexecutados com sucesso: lotes 1 e 2, clube v69, autosave v80 e primeiro acesso. Conferidos criação/edição do nome e roupa, falha de gravação sem perda de dados, entrada/reabertura da sala, 13 móveis, compras/cancelamentos/preços, pose sentada, veículos, reload/arquivo e nova carreira sem herança indevida. Arte base sentada conferida visualmente: sem olhos, nariz ou boca. Não foram produzidas novas roupas/cabelos.
- Gate privado testado com respostas de autenticação simuladas: somente Diego verificado, rejeição de outra conta, descarte de resposta antiga e falha fechada. Isso não comprova acesso ou gravação na conta real.
- Revisão conjunta aprovada: combinações de evolução, circulação e encontros, motor/reinícios/defesas, duas câmeras, copas ida/volta, cinco partidas internacionais do catálogo e placar real. Última amostra de gol 4x: prazo de 225 ms, callback em 482,1 ms e publicação em 828,3 ms no renderer por software. Atraso permanece; não declarar fluidez aprovada.
- Prévia reunida em `qa-presidencia-revisao.html`: 16 capturas de etapas, campo, NPCs/técnicos/reservas, sala/personagem, janelas e celular/entorno. Imagens verificadas e galeria testada em 390 px sem transbordamento. Arquivo local de revisão, fora do build publicado; não representa compras da conta real. A recarga inicial do Vite interrompeu a primeira conferência da galeria; nova execução estável passou.
- Compilação TypeScript/Vite aprovada (`/tmp/presidencia-revisao-final-build.log`), com avisos existentes. `git diff --check` limpo. Prévia antiga de evolução também atualizada para usar o critério correto da janela.

#### Estado real da entrega após esta revisão
- Implementação/revisão local disponível: evolução por compras e pré-requisitos; ruas/lotes fixos e rotas protegidas; campo, 22 atletas, bola, árbitro, técnicos e reservas em 3D; relógio/gols vinculados à simulação; controles móveis; criação/perfil/sala e janela. Tudo preservado sem commit, push ou deploy.
- Ainda sem comprovação: desempenho em celular físico, percurso autenticado completo e persistência na conta real. O teste emulado não substitui esses pontos.
- Limites de produto permanecem explícitos: arquibancadas e entorno são arte registrada, não um mundo inteiro volumétrico; o campo usa um motor de apresentação dos eventos da simulação, não uma implementação completa de arbitragem, impedimentos, cartões e física do futebol. Movimentos são procedurais. Não declarar o pedido inteiro perfeito ou concluído.
- O backup de continuidade inclui agora a galeria e todas as imagens por ela referenciadas, além do código, patch e manifesto com hashes verificados. Publicação continua aguardando a etapa final combinada com Diego, com acesso funcional restrito ao email autorizado.

### Continuação — continuidade do primeiro toque (12/10)
- Recepção de passe e interceptação agora preservam a posição de chegada da bola e a acomodam aos pés durante 0,32 s do relógio compartilhado. O atleta se volta para a bola, mantém os pés plantados e não mistura chute/arremesso com o domínio. Antes, a bola podia saltar para o lado indicado pela direção de corrida.
- A transição usa passo fixo e interpolação suave, incluindo a altura das bolas baixas. Pausa congela o domínio; aceleração usa o mesmo tempo da partida. Lançamento, reposição e novo evento oficial descartam uma transição antiga. Não altera placar, resultados nem estatísticas.
- `testa-presidencia-recepcao.mjs` ampliado: ambos os times, bola no chão e a 0,5 m, continuidade por quadro, posição preservada ao assumir posse, pés firmes e pausa durante o toque. Aprovado junto com motor de cinco minutos, contato passe/chute, saída legal após gol e mergulho/recuperação.
- Teste de navegador de sincronia aprovado: mapa/campo com os mesmos 22 atletas, reabertura sem reinício, pausa, gol, troca de partida, cobertura fechada e limpeza. São fixtures locais, sem autenticação ou escrita na conta real.
- Mantidos todos os limites registrados acima: ainda falta validar fluidez em aparelho físico e o percurso na conta real; animações procedurais e motor de apresentação não equivalem a arbitragem/física completas. Nenhuma publicação, commit ou push nesta continuação.
- Compilação TypeScript/Vite aprovada (`/tmp/presidencia-primeiro-toque-build.log`), mantendo os avisos existentes; `git diff --check` limpo. Backup de continuidade atualizado após a validação.

### Continuação extensa — reposições, árbitro, custo das poses e todas as etapas (12/10)
- Pedido atual: continuar sem encerrar a cada ajuste pequeno. Conduzida revisão integrada; estado consolidado em `docs/presidencia-validacao-final-local.md`.
- Lateral agora tem coleta da bola no chão com flexão de pernas/tronco, preparo nas mãos, soltura e recuperação. Primeiro teste de captura expôs o movimento separado de mãos/bola; corrigido, com teste de contato em toda a subida. Preparo de 0,95 s no relógio compartilhado. Substituição de cobrador/receptor retoma com o XI real, sem bola órfã. Mantido afastamento de 2 m antes da cobrança.
- Defesa segura mantém contato ao encerrar o evento oficial: goleiro baixa as mãos, deixa a bola cair à frente, domina e distribui. Não há salto instantâneo para os pés nem tiro de meta indevido. Substituições preservam pose/orientação dos atletas que permanecem; troca do goleiro preserva a continuidade local. Testes `testa-presidencia-distribuicao.mjs` e `testa-presidencia-lateral.mjs` cobrem ambos os lados, pausa/4× e mudanças de XI.
- Árbitro agora recebe direção, passada e velocidade do motor de passo fixo, em vez de reconstruí-las por câmera. Teste de dois minutos verifica direção de corrida, velocidade, separação, pausa e igualdade em 20/60 FPS.
- Poses usam matrizes do corpo já calculadas para verificar os cantos dos pés. 400 poses com transformações idênticas à versão que recalcula ancestrais; 64 chamadas redundantes → 0 no exemplo. Última mediana de 1.600 poses: 20,52 → 8,45 ms. Não é afirmação de FPS nem redução de qualidade. Teste por pixels das instâncias preservou a imagem: 485 → 15 draw calls; cache de sombras pausadas 208 → 106, sem canais divergentes acima da tolerância.
- Criada `qa-presidencia-etapas.html`, com os 47 cenários compactos em `docs/presidencia-etapas-revisao.json`. Seleção por etapa, anterior/próxima e mapa/janela usando as obras da mesma fixture. Aprovados 47 × 2 câmeras × 390/900 px: carga das artes, cobertura, negócios, navegação e largura. A galeria principal passou de 16 para 24 imagens, incluindo quatro momentos do lateral e quatro da distribuição.
- Capturas das reposições vêm de quadros fixados do motor real no renderer WebGL registrado. A primeira fixture importou duas instâncias de módulo do Vite, e ficou no quadro inicial; corrigida a instrumentação para usar a classe realmente carregada pelo renderer. Não foi contornado um erro do aplicativo.
- Regressões aprovadas: motor/recepção/saída/contato/mergulho, campo WebGL e controles móveis, duas câmeras sincronizadas, 47 cenários, 2.048 combinações de camadas, 4.096 do mapa, rotas/encontros, campo da várzea ao estádio completo, galeria, placar real, copa ida/volta e cinco jogos internacionais do catálogo.
- Emulação móvel: 6,3 / 3,3 / 3,0 / 3,9 FPS em SwiftShader, relógio ~4×. Último gol 4×: programado 225 ms, callback 452,3 ms, publicação 791,1 ms. Fluidez/latência seguem sem aprovação em aparelho físico. Fixtures não comprovam login ou gravação real; mundo exterior continua ilustrado e motor continua de apresentação, sem regras completas de arbitragem/física.
- Sem commit, push, deploy ou escrita remota. Mantido o gate de Diego e a ordem de publicar somente ao final.
- Compilação final TypeScript/Vite aprovada (`/tmp/presidencia-reposicoes-integradas-build.log`), com avisos de importações/chunks e tempos de plugins; `git diff --check` limpo. Backup atualizado com os novos scripts, relatório, seletor de etapas e capturas.
