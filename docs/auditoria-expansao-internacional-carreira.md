# Auditoria da expansão internacional do Modo Carreira

Auditoria do código existente antes de qualquer alteração funcional. Escopo: carreira da pirâmide (`careerOnline`), principalmente solo. As modalidades rápidas/salas têm Libertadores e Champions próprias, mas seus participantes e estado não representam a carreira pedida.

## Liberação inicial

O primeiro acesso à expansão da **carreira** fica restrito à sessão autenticada de `diego.c.fonseca@gmail.com`, conforme instrução posterior. A trava é independente das Libertadores/Champions de partida rápida e salas, que já têm regras de acesso próprias. Sem sessão ou com outra conta, o estado inicial é fechado; troca de conta atualiza a trava. No período de teste, o novo conteúdo, inclusive comunicação de desbloqueio, deve ser exibido somente para essa conta.

## Mapa do fluxo atual

| Tema | Funcionamento atual | Fonte principal |
| --- | --- | --- |
| 1. Brasileirão/Liga | A pirâmide simula cinco divisões quando há Várzea; a Série A é ordenada por pontos e critérios da simulação. O calendário é por rodadas e a tabela é recalculada de forma determinística. | `pyramidseason.tsx`: `simulatePyramid`, `computePromotions` |
| 2. Copa do Brasil | Ao fim da liga, `computeCopaBrasil` usa os clubes da pirâmide. Tem peneira elástica, rodadas de 64/32, oitavas, quartas, semifinal e final; `copaBrasilAsCopaResult` adapta o resultado para a UI de Copa já existente. A liberação ainda depende de `useCopaBrasilLiberada`; sem chave válida, ocorre a Copa Legends. | `copa-brasil.ts`, `pyramidseason.tsx` |
| 3. Copa do Mundo | Torneio separado de 24 seleções, seis grupos e mata-mata. A seleção representa o clube do técnico; sorteio e simulação usam seed. | `copa-mundo.tsx` |
| 4. Classificação | Copa Legends usa G4 de cada divisão; Copa do Mundo usa Top 24 do ranking acumulado do clube. Não há classificação internacional de clubes na carreira. | `pyramidseason.tsx`: `computeCopa`, `cmVaga` |
| 5. Modal de convocação | Copa do Mundo: escolher seleção → convocar XI → campeonato. `CMModal` usa portal; a convocação tem filtro por posição, busca, 4-3-3/4-4-2, campinho e bloqueios explicados. Escolha e XI são carimbados para recuperação após F5. | `copa-mundo.tsx`: `CopaMundo`, `SelecaoScreen`, `ConvocacaoScreen` |
| 6. Seleção de jogadores | Copa do Mundo lê cartas reais dos três catálogos por país e identifica versões por `nome|clube|ano`; bots escolhem XI forte. O XI da carreira vem do elenco real comprado, com escalação salva por rodada. | `copa-mundo.tsx`: `countryPool`, `bestXI`; `pyramidseason.tsx`: `lineupAt` |
| 7. Montagem de elenco | O usuário preserva suas cartas; bots da pirâmide têm elencos materializados uma vez em `cpuSquads` e a Copa congela o XI humano quando a liga termina. | `pyramidseason.tsx`: `seedCpuSquads`, `lineupsCopa`; `store.tsx`: `SEED_CPU_SQUADS`, `FREEZE_COPA_XI` |
| 8. Bots | A pirâmide distribui cartas do catálogo aos clubes. Na Copa do Mundo, os bots recebem seleções **depois** da escolha do usuário. As atuais competições rápidas possuem outros bots e convidados. | `pyramidseason.tsx`: `buildCpuSquads`; `copa-mundo.tsx`: `entrants`; `store.tsx` |
| 9. Simulação de partidas | Liga usa `rollForm`, Poisson, tática, formação, elenco e seed. Copa do Brasil reutiliza essas funções. Copa do Mundo usa seu motor de seleções, placares e eventos. | `pyramidseason.tsx`, `copa-brasil.ts`, `copa-mundo.tsx` |
| 10. Sorteios, chaves e grupos | Copa do Brasil mantém sorteio livre nas fases iniciais e chave fixa depois; Copa do Mundo tem potes, seis grupos e mata-mata. Champions rápida já tem tabela de 36, oito rodadas e repescagem, mas com clubes da pirâmide/sala. | `copa-brasil.ts`, `copa-mundo.tsx`, `champions.ts`, `store.tsx` |
| 11–14. Estatísticas, jogos, gols e assistências | Liga e Copa guardam listas completas e mapas por ID de carta. O acumulado usa identidade `nome|clube|ano`, inclui bot, e registra a temporada uma vez. A Copa do Mundo guarda gols, assistências e jogos por carta; o elenco do usuário os incorpora. | `pyramidseason.tsx`: `simulatePyramid`, `cmPorCarta`, `cmListas`; `store.tsx`: `RECORD_SEASON_STATS` |
| 15. Condição física | Gás entra na carreira nova ao alcançar Série C; conta jogos por escalação e preserva desgaste entre temporadas. Uma competição adicional precisa entrar no calendário/contagem de jogos, sem resetar o estado. | `condicao.ts`, `pyramidseason.tsx`, `store.tsx` |
| 16. Bola de Ouro | `melhorDoMundo` soma gols e assistências da liga, todas as copas e Copa do Mundo, por carta, com desempates determinísticos. O registro espera a Copa do Mundo quando ela precede o jornal. | `pyramidseason.tsx`: `melhorDoMundo`, `melhorDoAno`, `RECORD_SEASON_STATS` |
| 17. Ranking global | Pontos atuais: Mundo 200, Copa 30, Série A 20, Supercopa 15, B 10, C 5, D 3, V 1. A mesma função alimenta o ranking do save, o Top 24 da Copa e a ordenação global. O banco guarda contadores de títulos por categoria. | `pyramidseason.tsx`: `PTS_TITULO`, `pontosDeTitulos`, `pontosDaLinha`, `rankWriteRef` |
| 18. Estante | `RankingTab` monta o Hall do clube a partir de `careerHonors`, `careerCopaHonors`, `careerSupercopaHonors` e mural da Copa do Mundo. | `pyramidseason.tsx`: `RankingTab` |
| 19. Histórico de temporadas | `careerCronica` armazena resumo recente por clube; temporadas da Copa/Supercopa têm arrays; o jornal usa memória da carreira. Não há histórico de representações. | `types.ts`, `pyramidseason.tsx`, `store.tsx` |
| 20. Premiações financeiras | Liga, Copa e Supercopa têm funções de recompensa; Copa do Mundo paga 100 moedas ao campeão, com trava contra repetição. Créditos financeiros e prêmios de jogador não são o mesmo dado. | `pyramidseason.tsx`, `copa-brasil.ts`, `copa-mundo.tsx`, `store.tsx` |
| 21. Banners | `UnlockBanner` grava dispensas em `careerSeen`. O marco da Copa do Mundo é outro card, dentro de `CopaMundoGate`, com barra de progresso até 100. | `unlockbanner.tsx`, `copa-mundo.tsx` |
| 22. Transições | Liga → Copa → roteiro de fim (jornal, caixa, Copa do Mundo, decisão). Quando há vaga na Copa do Mundo, a ordem muda para Mundo → jornal → caixa → decisão; a Bola de Ouro espera o torneio. | `pyramidseason.tsx`: `copaRound`, `fimOrdem`, `mundoPendente`, `RoteiroFim` |
| 23. Persistência | Carreira solo salva o estado no `localStorage` e espelha em `esc_pyramid_saves` com arquivo de múltiplas carreiras e lacre; stats têm `statsSeason` para idempotência. Copa do Mundo ainda tem save local próprio (`llcopa:<seed>`) e mural espelhado no estado. Campos novos opcionais preservam saves antigos. | `store.tsx`: autosave, `savePyramidCloud`, reducer; `copa-mundo.tsx`: `CopaSave` |
| 24. Copa do Mundo a partir da T100 | Primeiro marco é T100, depois a cada 10 temporadas. Save sem Copa jogada é realinhado para 100; save que já disputou mantém sua âncora. Só o Top 24 participa e o usuário escolhe primeiro a seleção. | `copa-mundo.tsx`: `ensureSave`, `isCopaSeason`, `CopaMundoGate` |

## Pontos de integração e riscos

1. A Libertadores/Champions existentes em `store.tsx` e `champions.ts` são de sala/partida rápida. Reusar componentes e algoritmos de sorteio, mas não inserir sua lógica de participantes diretamente na carreira: ali os clubes convidados não são os 72 pedidos e `state.liberta`/`state.champions` têm outro ciclo de vida.
2. A Copa do Brasil pode não estar disponível para todas as contas. A classificação internacional deve tratar a ausência de campeão brasileiro de forma explícita, mantendo o G8, sem criar campeão fictício.
3. O clube principal do usuário é a chave esportiva (`m<id>`), enquanto nome, escudo e mascote continuam vindo do clube criado. A instituição escolhida deve ser um campo separado por temporada.
4. O XI de uma competição não pode mudar resultados já revelados. A Copa atual congela escalação; a Copa do Mundo carimba escolha e XI. A nova campanha precisa de carimbo próprio e recuperação após F5.
5. `statsSeason` sela a temporada após o fim da Copa do Mundo. As duas competições continentais e o Mundial precisam terminar antes desse selo e antes do jornal/Bola de Ouro. Partidas de bot devem alimentar as mesmas listas completas, não apenas artilheiros Top 20.
6. O ranking precisa ser alterado de ponta a ponta: contadores no save, escrita/leitura global, `pontosDeTitulos`, ranking local, Top 24 e Estante. Adicionar pontos apenas ao texto ou só ao banco produz divergência.
   O ranking global lê as RPCs `esc_pyramid_rank`, `esc_pyramid_career_rank` e `esc_pyramid_my_rank`; seus resultados são calculados no banco, enquanto o cliente grava `esc_pyramid_rank_snap`. A definição SQL dessas RPCs não está neste checkout, mas foi consultada de modo somente leitura no projeto conectado. **Divergência pré-existente:** as três RPCs ainda ordenam títulos lexicograficamente (`world_titles`, `honors_a`, `copa_titles`...), enquanto o cliente anuncia e calcula a soma de pontos. A expansão deve corrigir as três RPCs junto com as colunas novas; mudar apenas `PTS_TITULO` manteria o ranking global inconsistente.
7. O autosave solo usa uma assinatura de transições e a nuvem limita gravação a uma vez por minuto. Uma escolha internacional exige transição de estado que acione persistência e gravação idempotente.
8. Os catálogos têm cartas reais com clube/ano, mas alguns dos 72 clubes têm poucas ou nenhuma carta em posições necessárias. Antes de montar bots é necessário medir cobertura por clube e definir seleção de cartas existentes sem jogadores fictícios nem versões simultâneas conflitantes.
   Medição inicial por nome **exato** no `CATALOG_BOTH`: 18 instituições têm zero cartas; outras 19 têm entre 1 e 10. Parte é alias (`Bayern`/`Bayern de Munique`, `Dortmund`/`Borussia Dortmund`, `Man City`/`Manchester City`, `Inter`/`Inter de Milão`, `LDU Quito`/`LDU`). Ainda assim, as demais têm elenco insuficiente. O montador precisa priorizar cartas do clube/alias e completar apenas com cartas reais já existentes, de modo determinístico e sem repetir a mesma carta em dois bots.
9. A instrução visual do repositório exige mostrar mockup e obter aprovação antes de **commitar** qualquer visual novo. Os banners, identidade das competições e modal devem ser prototipados para revisão antes do commit visual.

## Ordem segura de implementação

1. Regras puras: catálogo central de 72 clubes, classificação G8/Copa, prioridades, blocos e testes de duplicação/elegibilidade.
2. Modelo de campanha e migração opcional: escolha do usuário antes dos bots, instituição secundária, histórico, retomada e idempotência.
3. Cobertura real de cartas, inscrições, calendário e simulação simultânea das duas competições, usando os motores existentes.
4. Mundial após as duas finais; integração de jogos, gols, assistências, Bola de Ouro e prêmios.
5. Ranking global, Estante, jornal/narrativa e regressão dos saves antigos.
6. Mockups aprovados, aplicação visual e testes de interface.
