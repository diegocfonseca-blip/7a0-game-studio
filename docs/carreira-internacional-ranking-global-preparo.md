# Ranking global da carreira internacional — preparação local

Estado: **não aplicar em produção nesta preparação**. A proposta completa de colunas, trava privada e RPCs v2 está em `docs/sql/carreira-internacional-rank-colunas-proposta.sql`, fora de `supabase/migrations` para não ser aplicada por acidente. A liberação depende dos testes autenticados descritos em `docs/rollout-privado-carreira-internacional.md`.

## Fonte de verdade no cliente

- `PTS_TITULO` e `pontosDeTitulos` em `src/escalacao/pyramidseason.tsx`: Copa do Mundo 200, Mundial de Clubes 50, Libertadores 40, Champions 40, Copa do Brasil 30. Os pesos anteriores de ligas e Supercopa continuam.
- Títulos internacionais são derivados de `careerInternationalHistory` por carreira. `internationalTitleCounts` conta no máximo um resultado encerrado por temporada, ignora T1–39 e temporadas futuras. O snapshot da temporada N só conta até N−1; a tela local pode mostrar a campanha encerrada da própria N. Enquanto a proposta SQL não for aplicada, o ranking compartilhado usa as RPCs antigas.
- `src/escalacao/career-international-ranking.ts` calcula o ranking das 72 instituições dentro do save. Não consulta nem escreve no ranking global de usuários.

## Esquema real lido em 01/10/2026

- Projeto efetivo do jogo: `faabglpjutwursgmrpny` em `src/lib/supabase.ts`; `supabase/config.toml` traz outro ID e não deve ser usado como evidência do banco de produção.
- `esc_pyramid_rank_snap` tem PK `(user_id, career_id, season_no)`, RLS ativa, `INSERT/UPDATE` da própria linha e `SELECT` público. Não tem as três colunas novas. Sem restrição adicional, qualquer conta poderia gravar seus próprios contadores internacionais após adicioná-las.
- As três RPCs atuais leem um snapshot por carreira até `p_season` e escolhem a melhor carreira por ordem lexicográfica `world_titles, honors_a, copa_titles, supercopa_titles, ...`. Elas não somam os pontos anunciados pelo cliente; é uma divergência anterior à expansão.
- A proposta mantém as RPCs antigas intactas e cria `*_v2` que somam 200/50/40/40/30 mais os pesos antigos. Só a conta privada pode ler as RPCs v2. Um trigger impede outras contas de inserir ou alterar contadores internacionais positivos, consultando `auth.users` pelo `auth.uid()` do token.
- O cliente consulta as RPCs v2 somente após `getUser()` verificar Diego; para as demais identidades consulta somente as antigas. Se a v2 ainda não existe (`PGRST202`/`42883`), Diego recebe as antigas, sem quebrar o ranking. Erros de permissão não acionam fallback.

## Verificação local de 01/10/2026

- `node scripts/testa-ranking-privado-internacional.mjs`: gate com sessão ausente, Diego, outra identidade, logout, troca de conta e resposta antiga de `getUser`; contagem idempotente ao reabrir T87; virada T88 e limite T101; pesos 200/50/40/40/30. Tudo usa identidades fictícias em memória, sem consulta ou gravação real.
- `bash scripts/testa-sql-ranking-internacional.sh`: PostgreSQL 17 descartável via Docker; proposta SQL aplicada a uma cópia mínima do esquema; conta simulada Diego aceita, outra conta e anônimo bloqueados nas RPCs v2, outra conta impedida de criar títulos novos, posições e 360 pontos verificados, temporada futura não vaza, UPDATE repetido não soma. Nenhuma operação foi feita no projeto Supabase real.
- `node scripts/testa-fixtures-carreira-internacional.mjs` e `npm run build` passaram. Depois de permitir o servidor local, `PW_CHROME=/usr/bin/chromium npm run copamundo` também passou: 40 Copas simuladas, 2.040 jogos, 5.060 gols e 3.773 assistências. O teste agora bloqueia requisições ao Supabase real; nenhuma regra da Copa foi alterada.
- O código de interface só entrega `CareerInternationalView` quando o gate da identidade está aberto; a referência à campanha no painel agora também é nula para outra identidade. O clube principal segue sendo `state.managers[state.youIdx].teamName`; o snapshot usa esse mesmo nome, não o da instituição representada.
- As definições reais das RPCs e políticas foram consultadas apenas para leitura no conector do projeto correto. Falta executar a proposta em ambiente de ensaio com o esquema completo e fazer validação autenticada com duas contas; o teste Docker não prova isolamento em produção.

## Limites observados

- A liberação de interface e ações está ligada a `getUser()` verificado para `diego.c.fonseca@gmail.com`; esta preparação não validou isolamento em duas contas reais. O jogo é executado no navegador, portanto o gate de interface não substitui a trava do banco para pontos compartilhados.
- Saves anteriores à expansão não contêm placares ou estatísticas de bots de temporadas já encerradas; o histórico antigo deve permanecer intacto, sem inventar partidas.
- O save local e o backup da carreira na nuvem já existem. A campanha é gravada no estado após cada etapa; a integração futura do ranking não deve criar outro save paralelo.
