# Layout desktop aprovado em 03/11/2026

Referência: PDF de 27 telas reenviado pelo Diego e pacote revisado aprovado. A alteração final pede que “Meu envelope” e “Jogadores disponíveis” comecem na mesma linha, com títulos, números e espaçamentos consistentes.

## Implementação

- Cabeçalho comum do Online e cabeçalho da carreira em uma linha.
- Salas abertas com filtros e atalhos; código de sala separado da entrada de Carreira Online.
- Rápido, Minhas Ligas, Liga Draft e Carreira com cartões do mesmo tamanho. Selos de Draft 2K, Carreira 7K e Campo 2D 2K preservados, assim como Novo e Em teste.
- Sala de espera com participantes e ações em colunas. O botão de mascote continua exigindo a propriedade existente e usa o mesmo handler e a recarga original de 5 segundos.
- Jogadores dos leilões em lista. Painéis com títulos na mesma linha e mesma altura; orçamento preto/dourado à direita. Tocaia com faixa verde ocupando as duas colunas.
- `AuctionSlot` move uma única instância dos controles existentes. Não cria uma cópia de lance, timer ou carta. O celular mantém os controles originais; os valores permanecem no componente original ao redimensionar.
- Pregão usa `CartaCoberta`/`CollectibleCard` originais com 210 px na mesa individual; a revelação e a mesa dupla continuam existentes.
- Liga, Copa, Libertadores e Champions aproveitam os painéis atuais. A apresentação de Quartas de final é preservada.
- Central, Jogos + Tabela, Elenco e Ranking têm largura e colunas próprias. O resumo do Ranking descreve a seleção; não calcula novas posições.
- Casa, finanças, agência, patrocínios, loja e Arena permanecem sobre a cidade existente. Casa mostra somente os bens/troféus já registrados. Filtros financeiros consultam o extrato sem alterar o caixa.
- Cidade, estádio e permissões de acesso aos modos experimentais permanecem nos módulos existentes.

## Limites e proteção

Não foram alterados store, tipos do motor, módulo de permissões, motor de futebol, renderer da cidade, Supabase, regras, preços ou relógios oficiais. Nenhuma nova consulta de backend foi introduzida por estes layouts. A Arena continua somente consulta. O novo botão Criar sala mantém a trava original de login. Voltar pelo cabeçalho usa `GO_LOBBY_ONLINE`, preservando a sala ativa.

A publicação não faz parte desta alteração. Não houve push/deploy nem acesso a salas ou saves de produção.

## Validação local

- Build TypeScript/Vite aprovado.
- 27 telas capturadas a partir dos componentes reais, usando backend simulado e bloqueio de requisições externas.
- Topo, altura e fonte dos dois títulos conferidos nos quatro leilões: diferença vertical inferior a 0,5 px.
- Lance preservado desktop → celular → desktop; modo stream oculta lance e disponível; espectador sem lance/lacre.
- Carta Lenda revelada com o componente original e 210 px.
- Mascote sem propriedade oculto; com propriedade, um único controle visível e recarga de 5 segundos. No celular permanece o controle original.
- Navegação mantém o identificador da sala. Visitante é direcionado ao login ao tentar criar sala.
- Filtros financeiros não alteram o saldo. Camisa e informações da loja começam na mesma altura.
- Sem transbordamento horizontal nas larguras 393, 768, 1100, 1366 e 1920. Abas da carreira também conferidas em 1100 e 1366.

Os scripts antigos `testa-sala-online.mjs` e `testa-ritmo.mjs` já falhavam na base: uma comparação do recorte público da barra inferior e duas comparações do prazo da Copa do Mundo. As mensagens anteriores e atuais foram comparadas e são iguais. Não se modificaram relógios/regras para satisfazer verificações antigas nesta tarefa visual.

Capturas e relatório: `/workspace/shared/desktop-aprovado-implementacao/`. As capturas são de fixtures locais, não da conta em produção. O teste local não substitui observação em uma sala real após uma futura publicação autorizada.

## Reversão

A implementação fica em commit local isolado. Reverter esse commit recupera os componentes anteriores sem tocar no motor ou no banco. O ponto inicial também está registrado em `base.txt` e no arquivo `recuperacao-antes-alinhamento.tar.gz` da pasta de entrega.

## Publicação visual autorizada

Diego autorizou publicar as apresentações aprovadas para todos em 03/11, reiterando que Campo 2D, Campo 3D e mapa são exclusivos da conta dele. A liberação de apresentação usa `SALAS_VISUAL_GERAL=true`. `CAMPO2D_GERAL` permanece falso; a lista de testes foi reduzida à conta do Diego conforme essa orientação mais recente. A verificação de conta do mapa/3D (`presidente-acesso.ts`) permanece intacta. Nenhuma conta ou plano foi alterado.

As alterações foram integradas sobre a versão atual de produção, preservando traduções da casa, melhorias da cidade e alterações de outros fluxos feitas em paralelo. Nenhuma migração ou alteração de banco faz parte desta publicação. Testes locais com proprietário, contas comuns e sessão sem login verificam separadamente apresentação pública e acesso aos campos/mapa.
