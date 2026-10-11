# Partida no estádio: requisito de Diego (11/10)

Continuação de `presidencia-lote3-previa.md`. Não é uma entrega de partida
animada pronta. Nada publicado; teste futuro restrito a
`diego.c.fonseca@gmail.com`. Preservar o padrão de personagem sem novos
olhos, nariz ou boca.

## O que precisa existir

- Partida com 11 jogadores por equipe, incluindo os dois goleiros, bola e
  gols. Os atletas representam a escalação real daquela partida. Respeitar
  alterações de escalação, substituições e eventuais expulsões do motor;
  não inventar atletas para preencher dados ausentes.
- A movimentação acompanha os eventos da partida existente. O gol mostrado
  no campo, o placar e a comemoração precisam concordar em autor, lado e
  instante de confirmação. Nada de gols decorativos ou resultado calculado
  novamente pela camada visual.
- Alta qualidade também no gramado, linhas, balizas, redes, arquibancadas e
  entorno. Aproximar um jogador não pode revelar um chão borrado. Preparar
  níveis de detalhe locais para campo e arquibancadas; uma imagem de 3K do
  mapa inteiro não equivale a um campo de 3K. A câmera da partida precisa
  ser dimensionada pelo tamanho visível dos atletas, sem assumir que o
  limite atual de 4× do mapa será suficiente.
- Nenhum NPC pode atravessar ou caminhar sobre objetos de maneira irreal,
  dentro ou fora do estádio. Separar área caminhável, volume sólido e
  elementos que apenas ocultam a pessoa (copas, travessas, coberturas).
  Passarelas precisam de nível/altura e acessos próprios; não são atalhos
  no chão. Jogadores ficam na superfície do campo, nunca nas arquibancadas.

## Evidência do código atual

`pyramidseason.tsx` expõe `Goal` e `SimMatch`: placar, equipes, autor,
assistência e minuto. Isso não traz trajetórias físicas de 22 atletas ou
uma sequência de passes. Não chamar a futura coreografia de reprodução
exata de trajetórias que o motor não fornece.

`LiveScoreCard` já controla `vencidos`, `fila`, `confirmados`, `voo`, `shown`
e `fechado`. A bola entra antes de placar/comemoração, com fila para gols
próximos. O callback `onMinuteChange` transmite apenas o minuto: **não basta**
para sincronizar duas confirmações no mesmo minuto. A integração precisa
compartilhar uma sequência identificada por partida + evento e o mesmo
estado de apresentação confirmado, sem criar um segundo relógio ou segunda
fila independente. Não reutilizar uma chave baseada só em minuto e lado,
que pode colidir em dois gols da mesma equipe no mesmo minuto.

A escalação tem `myXI`, `lineupAt` e `careerHalftime[gestor][rodada].xi2`.
O adaptador deve resolver também o XI adversário no contexto correto,
além de mando/ida/volta. Sem XI válido, informar indisponibilidade da
visualização; nunca alterar o elenco ou o resultado para satisfazer a arte.

## Situação real da prévia

A continuação local implementa `presidencia-partida-model.ts` e a câmera
`presidencia-partida.tsx`, conectadas ao `LiveScoreCard` da carreira, com
restrição de conta existente. Usa os XI das equipes, substituições registradas
para o segundo tempo (índice `round - 1`) e troca de lado após o intervalo.
Sem duas escalações válidas, não inventa atletas. O estádio vem do clube mandante;
quando não existe save desse estádio, apresenta o terreno correspondente.

Placar e fase de gol vêm de `shown`/`voo`/`confirmados`. O identificador usa
partida + índice da fila, distinguindo eventos do mesmo minuto. A coreografia
não calcula resultados: deslocamento leve e chute são uma apresentação dos
lances, não uma simulação física de passes. A integração atual cobre a carreira
nessa apresentação; copas, expulsões e trajetórias físicas completas ainda
precisam de adaptação e validação. Não há comemoração corporal dedicada.

Novos sprites próprios de futebol, sem rosto, com caminhadas frente/costas,
goleiros e máscara de camisa para a cor do clube. Câmera interna detalhada
somente para estrutura completa com cobertura; as outras etapas usam a
composição do mapa, respeitando compras. Zoom da câmera até 6×, com arrasto, pinça ancorada em dois dedos, teclado
e Ctrl/⌘ + roda. Redimensionamento limita novamente a posição. Detalhes
são carregados ao ampliar, somente onde cruzam a janela de recorte.
O campo detalhado tem fonte 1536×1024 e 24 peças locais de 256 pixels; não é
um campo nativo de 3K. Todas as peças respeitam os limites de peso do projeto.

`presidencia-estadio-navegacao.ts` testa segmentos inteiros e raio contra
volumes de solo cadastrados. As rotas são recalculadas conforme as compras,
recortadas antes do primeiro obstáculo e percorridas de volta, sem teleporte.
Isso ainda não é busca de caminho alternativa nem levantamento completo de
todos os objetos da arte. A aprovação exige revisar essa cobertura e a
ocultação nas redes, especialmente durante o gol e no zoom. A câmera interna
recebeu malha transparente em primeiro plano, alinhada às balizas: testes
verificam que a bola confirmada termina dentro das duas redes. O chute sai
da posição do atleta, sem deslocá-lo instantaneamente para a área. O minuto
do próprio evento determina o lado atacado: um gol de primeiro tempo ainda
na fila não troca de baliza quando o relógio já avançou após o intervalo.

Verificações locais: `node scripts/testa-presidencia-partida.mjs --preview`
passou os testes existentes de economia/etapas/gate e os novos casos de XI,
intervalo, placar confirmado, projeção e colisões nas 47 etapas. Sintaxe dos
módulos analisada com Babel. Sem provider/autosave, login real ou teste no
navegador. O build continua bloqueado pela ausência de `tsc`/dependências;
Chromium também está bloqueado pelo ambiente. Não afirmar teste na conta.

Artefatos locais reproduzíveis:
- `scripts/empacota-presidencia-partida.cjs`: fontes preservadas, atlas e peças.
- `scripts/render-presidencia-partida.cjs`: prévia com 22 atletas demonstrativos;
  não é elenco, placar ou jogo real de Diego.
- `test-results/partida-estadio/index.html`, `revisao.png` e `zoom.png`.
- Prévia das 47 etapas atualizada com as rotas recortadas por colisão.

## Critérios para considerar pronto

1. Onze atletas reais por lado no início regular; identificação e goleiros
   corretos. Substituição e troca de lado preservam identidade e resultado.
2. Gol no campo corresponde a evento confirmado: gol contra, assistência,
   pênalti e acréscimos respeitam o que o motor efetivamente fornece.
   Dois gols no mesmo minuto não se perdem, duplicam ou antecipam o placar.
3. Pausa, intervalo, velocidade, retomada e mudança de partida não produzem
   gols fantasmas, spoilers ou reinício independente da animação.
4. Navegação testa o corpo/raio do ator e o segmento inteiro contra os
   obstáculos ativos de cada etapa. Compra de obra invalida/recalcula as
   rotas afetadas. Ocultação não substitui colisão: esconder um NPC que
   atravessa uma parede não corrige o caminho.
5. Inspecionar aproximação no campo, rede, arquibancada, loja, estação,
   estacionamento e pórticos. Verificar NPCs atrás/à frente e sob coberturas,
   com pés na superfície, escala, perspectiva e sombra coerentes.
6. Com cobertura fechada, jogadores não aparecem através do teto na vista
   aérea externa. Uma câmera interna deve permitir acompanhar a partida.
7. Testar no navegador do jogo, incluindo celular, carga progressiva,
   desempenho, redução de movimento e falha de detalhe. Os bloqueios atuais
   de build/navegador impedem declarar essa validação concluída.

Nenhum commit visual ou publicação antes da revisão de Diego, conforme
`CLAUDE.md` e a instrução vigente de não publicar.

## Continuação da circulação externa

A colisão passou a usar o círculo que contém a carroceria inteira, girando
pelo centro. Pedestres continuam ancorados pelos pés. O carro do estacionamento
retorna de ré, mantendo a orientação; seu caminho começa no acesso interno.
Carros só reaparecem quando as duas extremidades da rota estão fora da moldura.
Uma rota de rua bloqueada para no fim seguro em vez de saltar pela cena.
Caminhão e carro da mesma faixa usam a mesma velocidade, mantendo a separação.
Operários circulam pela frente da estrutura, fora do volume construído.

Os testes verificam o raio por ator nas 47 etapas, retorno de ré e parada
sem teleporte. `render-presidencia-circulacao.cjs` gera o quadro de revisão
com os mesmos caminhos e oclusores, a partir das peças nativas do mapa.
Saídas: `test-results/estadio-projeto/circulacao.png` e `circulacao-zoom.png`.
Ainda é necessário conferir entradas, árvores e canteiros não cadastrados
como obstáculos e o comportamento no navegador. Nenhuma publicação.

## Relógio, pausa e orientação dos atletas

O estado de apresentação do placar agora transmite o instante de início do
chute. Abrir ou retomar a câmera usa esse mesmo instante, sem reiniciar
a bola. A confirmação continua vindo da fila original; antes dela a bola
permanece deste lado da linha, mesmo se a renderização atingir o tempo final.
Pausa e fim congelam o tempo visual, conservando posições e poses. Pausar
depois do intervalo não volta às escalações/lados do primeiro tempo.

As poses de frente/costas e o espelhamento acompanham a direção real do
deslocamento visual. Bola redimensionada em relação aos atletas, com
profundidade pela coordenada do chão. Frames contínuos são suspensos em
pausa/fim, fora da tela e com redução de movimento; mudanças do placar
continuam atualizando a imagem. Falha da câmera interna retorna à vista geral
com o enquadramento e a projeção dos atletas correspondentes.

Testes offline adicionais: pausa/fim sem salto, pose conforme deslocamento,
chute aberto pela metade, confirmação autoritativa e pausa no segundo tempo.
A prévia demonstrativa foi atualizada; não representa validação de React no
navegador. Build continua bloqueado pelas dependências ausentes.
