# Ranking global da carreira internacional — preparação local

Estado: **não aplicar em produção durante o teste fechado**. Este documento não é uma migração.

## Fonte de verdade no cliente

- `PTS_TITULO` e `pontosDeTitulos` em `src/escalacao/pyramidseason.tsx`: Copa do Mundo 200, Mundial de Clubes 50, Libertadores 40, Champions 40, Copa do Brasil 30. Os pesos anteriores de ligas e Supercopa continuam.
- Títulos internacionais são derivados de `careerInternationalHistory` por carreira. A prévia de pontos da carreira atual já os soma; a posição recebida das RPCs do Supabase ainda usa o esquema antigo.
- `src/escalacao/career-international-ranking.ts` calcula o ranking das 72 instituições dentro do save. Não consulta nem escreve no ranking global de usuários.

## Integração compartilhada futura

1. Inspecionar o esquema e as definições vigentes de `esc_pyramid_rank_snap`, `esc_pyramid_rank`, `esc_pyramid_career_rank` e `esc_pyramid_my_rank` no ambiente de destino. Elas não constam integralmente deste repositório; não presumir ordem de classificação ou permissões atuais.
2. Preparar migração aditiva para os contadores `mundial_titles`, `libertadores_titles`, `champions_titles` com padrão zero. Preservar todas as linhas, temporadas e colunas existentes. A chave da linha continua identificando usuário, carreira e temporada, como hoje.
3. Atualizar a gravação do snapshot no cliente com os três contadores derivados **somente da carreira autenticada**. Usar a mesma política de propriedade e os mesmos critérios de elegibilidade do snapshot atual. Não atribuir títulos ao usuário por e-mail isoladamente.
4. Atualizar as três RPCs para calcular pontos pela mesma fórmula do cliente, incluindo o desempate por moedas e o limite de temporada. A posição deve ser calculada no servidor para todo o conjunto elegível; reordenar só os 50 recebidos no cliente não produz uma posição global confiável.
5. Validar em banco de teste com snapshots antigos (campos novos zero), carreira T87 com histórico anterior ao recurso, uma carreira com cada título novo, duas carreiras do mesmo usuário e conta sem acesso ao teste. Comparar pontos e posições cliente/servidor, conferir RLS e idempotência das atualizações.
6. Só depois de aprovação explícita de Diego para publicação, aplicar a migração e a atualização das RPCs de maneira reversível. Não recalcular títulos de saves antigos sem evidência no histórico.

## Limites observados

- A liberação de interface e ações está ligada à sessão autenticada por `diego.c.fonseca@gmail.com`; esta preparação não validou isolamento em duas contas reais.
- Saves anteriores à expansão não contêm placares ou estatísticas de bots de temporadas já encerradas; o histórico antigo deve permanecer intacto, sem inventar partidas.
- O save local e o backup da carreira na nuvem já existem. A campanha é gravada no estado após cada etapa; a integração futura do ranking não deve criar outro save paralelo.
