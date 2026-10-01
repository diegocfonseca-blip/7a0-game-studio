# Ranking global da carreira internacional — preparação local

Estado: **não aplicar em produção durante o teste fechado**. A proposta aditiva de colunas está em `docs/sql/carreira-internacional-rank-colunas-proposta.sql`, fora de `supabase/migrations` para não ser aplicada por acidente. Não é suficiente para liberar o ranking global.

## Fonte de verdade no cliente

- `PTS_TITULO` e `pontosDeTitulos` em `src/escalacao/pyramidseason.tsx`: Copa do Mundo 200, Mundial de Clubes 50, Libertadores 40, Champions 40, Copa do Brasil 30. Os pesos anteriores de ligas e Supercopa continuam.
- Títulos internacionais são derivados de `careerInternationalHistory` por carreira. `internationalTitleCounts` conta no máximo um resultado encerrado por temporada, ignora T1–39 e temporadas futuras. O snapshot da temporada N só conta até N−1; a tela local pode mostrar a campanha encerrada da própria N. A posição recebida das RPCs do Supabase ainda usa o esquema antigo.
- `src/escalacao/career-international-ranking.ts` calcula o ranking das 72 instituições dentro do save. Não consulta nem escreve no ranking global de usuários.

## Integração compartilhada futura

1. Inspecionar o esquema e as definições vigentes de `esc_pyramid_rank_snap`, `esc_pyramid_rank`, `esc_pyramid_career_rank` e `esc_pyramid_my_rank` no ambiente de destino. Elas não constam integralmente deste repositório; não presumir ordem de classificação ou permissões atuais.
2. Preparar migração aditiva para os contadores `mundial_titles`, `libertadores_titles`, `champions_titles` com padrão zero. Preservar todas as linhas, temporadas e colunas existentes. A chave da linha continua identificando usuário, carreira e temporada, como hoje.
3. O cliente já preserva o UPSERT antigo e, somente quando ele tem sucesso e `getUser()` retorna o e-mail de teste, tenta UPDATE dos três contadores na mesma linha `(user_id, career_id, season_no)`. Sem as colunas, o UPDATE falha e o snapshot antigo continua íntegro. O código não concede título apenas por e-mail: deriva do histórico da carreira carregada. Ainda é necessário validar que a carreira carregada pertence à conta autenticada e que a política RLS bloqueia atualização de linha alheia; um gate JavaScript não é controle de segurança do banco.
4. Atualizar as três RPCs para calcular pontos pela mesma fórmula do cliente, incluindo o desempate por moedas e o limite de temporada. A posição deve ser calculada no servidor para todo o conjunto elegível; reordenar só os 50 recebidos no cliente não produz uma posição global confiável.
5. Validar em banco de teste com snapshots antigos (campos novos zero), carreira T87 com histórico anterior ao recurso, uma carreira com cada título novo, duas carreiras do mesmo usuário e conta sem acesso ao teste. Comparar pontos e posições cliente/servidor, conferir RLS e idempotência das atualizações.
6. Só depois de aprovação explícita de Diego para publicação, aplicar a migração e a atualização das RPCs de maneira reversível. Não recalcular títulos de saves antigos sem evidência no histórico.

## Verificação local de 01/10/2026

- `node scripts/testa-ranking-privado-internacional.mjs`: gate com sessão ausente, Diego, outra identidade, logout, troca de conta e resposta antiga de `getUser`; contagem idempotente ao reabrir T87; virada T88 e limite T101; pesos 200/50/40/40/30. Tudo usa identidades fictícias em memória, sem consulta ou gravação real.
- `node scripts/testa-fixtures-carreira-internacional.mjs` e `npm run build` passaram. `PW_CHROME=/usr/bin/chromium npm run copamundo` não conseguiu subir o servidor neste ambiente; não houve nova validação de navegador da Copa do Mundo nesta rodada. Nenhum arquivo dela foi alterado.
- O código de interface só entrega `CareerInternationalView` quando o gate da identidade está aberto; a referência à campanha no painel agora também é nula para outra identidade. O clube principal segue sendo `state.managers[state.youIdx].teamName`; o snapshot usa esse mesmo nome, não o da instituição representada.
- Nenhuma definição das três RPCs ou das políticas de `esc_pyramid_rank_snap` consta neste checkout. A proposta SQL só adiciona colunas e **não** calcula posições. Assim, ainda não há comprovação de pontuação global compartilhada, selos globais, isolamento RLS ou equivalência cliente/servidor.
- Validação futura: banco de teste com esquema/RPCs reais, depois duas sessões autenticadas distintas (Diego e outra conta), conferindo leitura, escrita negada a terceiro, idempotência, Top 50, posição fora do Top 50, multicarreira e T100. Não usar contas reais ou produção nesta etapa local.

## Limites observados

- A liberação de interface e ações está ligada à sessão autenticada por `diego.c.fonseca@gmail.com`; esta preparação não validou isolamento em duas contas reais.
- Saves anteriores à expansão não contêm placares ou estatísticas de bots de temporadas já encerradas; o histórico antigo deve permanecer intacto, sem inventar partidas.
- O save local e o backup da carreira na nuvem já existem. A campanha é gravada no estado após cada etapa; a integração futura do ranking não deve criar outro save paralelo.
