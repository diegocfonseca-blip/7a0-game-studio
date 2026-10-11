# Atualização do incremento privado em 11 de outubro de 2026

Diego autorizou publicar avanços testados somente para
`diego.c.fonseca@gmail.com`. Base reconciliada com main `7b6443cb`, preservando
as mudanças locais. A autorização não libera a funcionalidade para todos.

Mapa com área de 72svh em celular/desktop, proporção 3:2 preservada, arrasto
lateral e botão Ver tudo. Pedestres aguardam nas pontas das rotas. Estádio,
ruas, lotes e estabelecimentos seguem as camadas do projeto existente.

PASS: build completo na main reconciliada; 47 etapas no Chromium em
320/390/900; zoom, pausa, 22 atletas, gol confirmado com movimento reduzido e
recuperação de imagem; autosave v80; lote2; testes de economia, identidade e
regras de evolução. Identidades simuladas, sem login real ou gravação em nuvem.

Ainda pendentes: partida visível dentro do mapa da aba Estádio, relógio visual
compartilhado entre vistas, jogadas contínuas em vez de coreografia, escala
final dos atletas/bola, qualidade do gramado no zoom máximo, revisão de todos
os obstáculos da arte e gestos de toque. Não apresentar esses itens como
concluídos. O campo atual fica na expansão do placar e acompanha sua fila de gols.

Os registros abaixo são históricos; bloqueios antigos de build e navegador
foram resolvidos. Confirmar push e execução do deploy antes de dizer publicado.

# Revisão atual — mapa ampliado e ordem das obras (11/10)

**Requisito adicional:** [11 × 11, sincronização da partida, detalhe do campo e colisão de NPCs](presidencia-partida-no-estadio.md). A prévia atual ainda não implementa essa partida.

**Local e não publicado.** O acesso continua no gate existente de
`diego.c.fonseca@gmail.com`. Não houve login nessa conta, gravação remota,
commit, push ou deploy. O restante deste documento registra também a prévia
anterior, substituída no mapa aéreo por esta revisão.

- Camarotes passam a representar também o segundo andar, mantendo chave,
  preço e capacidade existentes. Novos investimentos nessa etapa exigem
  Geral, Cadeiras e Visitante concluídos. Compras legadas são preservadas.
- Cobertura exige os dois andares e gramado **integralmente pagos**, sem
  arredondamento; retrátil exige também a cobertura. Trava na apresentação
  e na compra da prévia privada. Catálogo público original preservado.
- Melhoria privada proposta: **ruas internas e calçadas, 80 moedas, sem renda**,
  disponível após Loja ou Geral. Usa a lista `ext` existente; não altera o
  esquema do save. O reducer usa o gate real mais identidade da carreira;
  outra conta não encontra a nova compra no catálogo global.
- Mapa ampliado para coordenadas 1536×1024. Arte final em 3072×2048 com
  detalhes gerados por região; etapas intermediárias nativas em 1536×1024.
  Não declarar que todas as etapas são 3K. Ruas municipais permanecem
  existentes; os lotes internos começam sem pavimentação.
- Edificações recortadas da mesma planta final, em posições fixas. Primeiro
  andar, anel superior, cobertura e fechamento usam fontes registradas.
  Gramado e iluminação continuam independentes. O efeito atual dos
  refletores é a iluminação do gramado, não novos postes desenhados.
- Novas rotas acompanham o mapa ampliado. Fachadas não são destinos
  atravessáveis: trajetos terminam nos acessos. A circulação usa os mesmos
  sprites de caminhada frontal/traseira e a mesma transformação do mapa.
- Detalhes WebP de até 25 KB carregam ao aproximar e entrar na área visível;
  visão geral até 60 KB. Falha num detalhe mantém a visão geral. Os originais
  PNG permanecem em `/workspace/generated_images` e no diretório scratch.
- Personagem permanece sem novos olhos, nariz ou boca.

## Revisão e testes desta versão

```sh
node scripts/testa-presidencia-evolucao.mjs --preview
PRESIDENCIA_NODE_MODULES=/opt/codex/cua_node/lib/node_modules node scripts/render-estadio-projeto.cjs
```

Saída atual: `test-results/estadio-projeto/index.html`, 47 estados com zoom,
movimento e pausa; `revisao.png` e imagens individuais no mesmo diretório.
É uma prévia offline do modelo, **não uma captura do aplicativo em produção**.
Não usar as prévias antigas `estadio-mapa-interativo.html` para aprovar esta versão.

Passaram 4.096 combinações do novo mapa e os testes anteriores de 2.048 combinações, além de limites
de cobertura/segundo andar, pavimentação, destinos, arquivos, gate de conta
simulado e análise sintática TS/TSX. Também executamos os dois cases reais
de compra/investimento extraídos do store: saldo, pré-requisito, cobrança
única e bloqueio da pavimentação para outras contas/gestores passaram.
Isso **não executa o reducer inteiro, provider ou autosave no servidor**. Build, navegador,
fluxo de compra/reload e revisão visual continuam necessários antes de
qualquer publicação. As dependências e o Chromium seguem bloqueados neste
ambiente, conforme limitações documentadas abaixo.

A geometria de recortes e a circulação precisam de aprovação visual real,
incluindo zoom sobre chão, contorno de cada lote, oclusão por vegetação e
passarelas. A revisão das regras sozinha não prova qualidade visual.
A janela conserva as artes próprias dos lotes 1/2 e recebe a trava de
cobertura; não afirmar que o mapa ampliado foi convertido numa nova janela.

A main remota foi verificada em `4eeed907fcb6d1be51c94db05b5ff27f68dafeb6`,
sete commits após a base local, em arquivos distintos. Reconciliar antes
até de preparar publicação; nenhuma alteração remota foi sobrescrita.

---

## Registro da prévia anterior (substituída no mapa aéreo)

# Presidência — continuação visual local (11/10)

Base: `e432f0ceebcd9f4aacd614de63ec88a127902cc2`, confirmada como `main`
durante a retomada. Alterações no checkout `work`, sem commit, push ou deploy.
Lotes 1 e 2, artes originais e rampas preservados.

Main reconsultada no GitHub em 11/10: `4eeed907fcb6d1be51c94db05b5ff27f68dafeb6`,
sete commits à frente desta base. A comparação mostra oito arquivos alterados,
todos fora dos arquivos desta continuação (cartas/regional, lobby, sport,
novidades, documentação e vídeo). Não copiamos esses arquivos sobre o checkout;
a integração Git com essa main continua necessária antes de publicar. Nenhuma
alteração nova de terceiros foi sobrescrita.

## Escopo e publicação

Diego pediu o mesmo mapa desde o terreno sem investimentos, mudando a cada
clique de melhoria, com estabelecimentos individuais, circulação integrada
de NPCs/carros e zoom/navegação sem deformação. O personagem fica para depois;
a proposta de olhos, nariz e boca foi removida e a base original restaurada.
As miniaturas/enquadramento preparados anteriormente permanecem locais.

**Publicação suspensa por instrução explícita de Diego.** O gate anterior
continua exclusivo para `diego.c.fonseca@gmail.com`, verificado com
`auth.getUser()`. Nenhuma conta real foi alterada; não houve login real nesta
sessão. Artes estáticas têm URL pública quando publicadas, como já explicado
nos lotes anteriores; o gate restringe a funcionalidade, não o arquivo.

## Implementação local

- O mapa usa terreno/ruas fixos. A compra de todas as obras não troca o
  entorno inteiro pela foto final com comércios em posições diferentes.
- Cada setor usa a fração real paga; 99,99% não vira obra concluída.
  Setores comprados fora de ordem aparecem individualmente: o reducer
  existente permite investir em qualquer setor. Não mudamos essa regra.
- Gramado, Geral, Cadeiras, Visitante e Camarote reutilizam as artes existentes.
  Canteiros de obras recebem andaimes/barreiras somente enquanto há progresso
  parcial. A correção aprovada do canto direito permanece no mapa quando
  Cadeiras e Visitante estão completos.
- Refletores, telão, loja, estacionamento, praça de alimentação, choperia,
  estação e hotel têm apresentação individual por propriedade. Estacionamento
  fica dentro do terreno, separado da via pública. A cobertura e o retrátil
  usam recortes/encaixes dos rasters anteriores; nenhuma nova cobertura ou
  arte rejeitada v254/v255/v256/v259 foi introduzida.
- Teto fechado só aparece com estrutura completa, cobertura e retrátil.
  Não exige loja/hotel. Ajuste local do encaixe cobre o campo na câmera aérea.
- A janela conserva seu enquadramento e as obras/posição do teto da carreira.
  Negócios fora do enquadramento aparecem somente no mapa. Os pequenos grupos
  estáticos da janela não equivalem à circulação implementada no mapa.
- Zoom 1×–4×, arraste, pinça com dois dedos, botões, teclado e retorno à vista
  completa. Uma transformação move terreno, construções e atores juntos.
  Os limites impedem arrastar o mapa inteiro para fora da moldura.
- NPCs/veículos novos usam vista aérea e escala do cenário. Trabalhadores e
  visitantes têm quatro poses de caminhada, nas vistas de frente e de costas;
  a direção da rota escolhe a vista. Segurança fica no acesso, sem deslizar. Pessoas percorrem
  acessos e caminhos; duas rotas distintas representam o tráfego da rua pública.
  Destinos adicionais só aparecem quando o estabelecimento está comprado.
  O estacionamento adquirido recebe um desvio de veículo; não é uma compra
  ou concessão de carro para o usuário.
- A profundidade usa a posição no solo. Prédios/teto e recortes da vegetação
  original podem ocultar atores, em vez de todos serem pintados por cima.
  Pausa/retomada preserva o tempo; redução de movimento, aba oculta e cenário
  fora da tela interrompem a animação. Controles de pausa ficam fora do zoom.
- Na prévia anterior, sem alterações de economia, reducer, saldo, aquisições, save, autenticação,
  competições ou mensagens online. Sem migração ou concessão de bens.

## Evidência reproduzível

```sh
node scripts/testa-presidencia-evolucao.mjs --preview
node scripts/render-estadio-mapa.cjs
```

O primeiro usa os módulos reais; substitui somente fronteiras de idioma,
React e autenticação. PASS: 2.048 combinações de extras/teto, investimentos
fracionados/fora de ordem, arquivos existentes, destinos por propriedade,
quadros de circulação sobre segmentos reais das rotas, zoom/limites, saves
intactos, catálogo de peças original e gate positivo/negativo/troca/falha/
resposta atrasada. Não comprova login real nem save na nuvem.

O segundo usa Sharp local. Produz 46 cenas: terreno inicial, todos os
23 cliques de investimento de 20 moedas (último limitado ao custo), dez
compras individuais, teto fechado sem comércios e sequência acumulada dos
estabelecimentos/teto. Saídas:

- `test-results/estadio-mapa-interativo.html`: prévia autocontida com zoom,
  arraste/pinça, seleção de etapas, circulação e pausa; não grava contas.
- `test-results/estadio-todas-etapas.png`: inventário de todas as cenas.
- `test-results/estadio-revisao.png`: seis cenas para revisão do encaixe.
- `test-results/estadio-etapas/`: imagem individual de cada cena.
- `test-results/estadio-mapa-model.json`: estados e planos reais usados.

As imagens são renders locais do modelo, não screenshots do aplicativo.
Fontes geradas preservadas em `/workspace/generated_images/`.
Peças individuais abaixo de 25 KB; terreno novo 57.928 bytes, abaixo de 60 KB.

PASS adicional: análise/transpilação sintática dos TS/TSX alterados com Babel
local e `git diff --check`. Isso não substitui o TypeScript/build completo.

## Limitações e verificações restantes

**Build e navegador continuam não validados.** Dependências ausentes;
`npm run build` falha com `tsc: not found`. A tentativa de `npm ci` com rede
adicional ficou aguardando e foi interrompida; o proxy recusou a conexão.
Chromium local falhou com `setsockopt: Operation not permitted` mesmo para
abrir a prévia local. Nenhum lockfile foi alterado.

A implementação de caminhos/profundidade existe, mas a revisão no navegador
real ainda deve conferir cada trajeto sobre o terreno, entradas dos prédios,
ocultação por árvores/teto, curva dos veículos e aparência durante movimento.
As imagens de cada clique servem para revisão; não declarar o encaixe ou
integração visual aprovados só porque a matemática da rota passou.

Antes de publicar: revisão visual de Diego conforme `CLAUDE.md`, build,
suítes dos lotes 1/2/entrada/economia/autosave/estádio, larguras 320/390/900,
pinça/arraste/teclado, redução de movimento/pausa/aba oculta, falhas de imagem,
reload e troca de conta. Reconciliar main e validar deploy/bundle somente após
nova autorização de publicação. Não desligar os lotes anteriores nem apagar
saves para recolher esta continuação.

## Continuação da câmera de partida — local

Adaptador da carreira e câmera com 22 atletas implementados localmente,
com cores dos clubes, goleiros, troca no intervalo e gol ligado à confirmação
do placar existente. Navegação externa verifica segmentos e raio contra
obstáculos cadastrados. Ver `presidencia-partida-no-estadio.md` para escopo,
evidências e pendências; não representa publicação nem teste na conta real.
