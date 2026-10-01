# Prontidão para teste privado — Libertadores, Champions e Mundial

**Situação em 01/10/2026: preparado localmente; não publicado.** Escopo inicial: somente `diego.c.fonseca@gmail.com`, sem moedas ou benefícios adicionais.

## Evidências reunidas

| Item | Estado |
| --- | --- |
| Repositório remoto `main` | SHA `2be136d6641c860bb6c5c63ce15d086632f29b93`, lido via GitHub e integrado por merge local `a2c043eb`. A correção nova da mascote no placar foi preservada. |
| Trabalho local | Branch `codex/international-private-rollout-prep`; série internacional iniciada em `74743d2e`, endurecimento em `f584d2fb`, preparo desta rodada em `884aa25a`. Nenhum push, PR ou deploy. |
| Projeto Supabase correto | `faabglpjutwursgmrpny`, URL usada pelo app. `supabase/config.toml` aponta outro ID; não usar esse arquivo para escolher o destino de DDL. Uma conta com o e-mail de Diego existe; nenhuma conta foi criada ou alterada. |
| Esquema e RPCs | Leitura apenas: PK dos snapshots `(user_id,career_id,season_no)`, RLS própria para escrita, leitura pública; colunas internacionais ausentes. RPCs antigas ordenam títulos em fila, não pela soma de pontos do cliente. |
| Gate privado | O cliente espera `getUser()` verificar o mesmo ID da sessão; logout/troca invalida respostas antigas. Outras identidades e sessão anônima não recebem painel, ações nem RPCs v2. Teste com identidades simuladas passou; não equivale a dois logins reais. |
| Ranking compartilhado | Proposta SQL em `docs/sql/carreira-internacional-rank-colunas-proposta.sql`: colunas com zero padrão, trigger de escrita privada e RPCs v2 privadas por identidade. Cliente usa v2 só para Diego e mantém fallback para o ranking antigo se elas não existirem. |
| Banco descartável | `bash scripts/testa-sql-ranking-internacional.sh` passou em PostgreSQL 17 local com cópia das três RPCs antigas reais: funções legadas intactas, escrita privada, bloqueio de outra conta/anônimo, 360 pontos, Top 50/posição 61, recorte temporal e idempotência. Nenhuma consulta de escrita no Supabase real. |
| Jogo | Fixtures G8/G9 e duas competições simultâneas, Mundial, save T87→T88, UI de inscrição desktop/mobile e jornal têm evidências anteriores em `docs/testes-carreira-internacional-local.md`. Nesta rodada, fixtures, build e regressão da Copa do Mundo em Chromium passaram (40 Copas, rede Supabase bloqueada). Não equivalem a navegação autenticada em produção. |

## Bloqueios para publicar

1. **Banco de ensaio com esquema completo:** aplicar ali a proposta SQL, conferir migrações, privilégios reais, RLS, snapshots antigos com três zeros, duas carreiras da mesma conta e T100. O teste Docker cobriu os objetos relevantes, inclusive as RPCs antigas reais, mas não é um clone integral do Supabase. Não havia branch de ensaio; Diego não confirmou a organização/custo para criá-la e pediu apenas código restrito à sua conta. Não criar branch cobrada por suposição.
2. **Duas sessões autenticadas:** Diego e uma segunda conta já autorizada para teste, em navegadores isolados. Confirmar o fluxo T40/T87 e reabertura na conta Diego; na outra e sem login, confirmar ausência de painel/modal/ações/RPCs v2, inclusive após troca de login. A segunda conta não precisa receber moedas, títulos, privilégios ou acesso ao recurso.
3. **Snapshot compartilhado:** em ensaio autenticado, conferir que `esc_pyramid_rank_snap` recebe uma vez os três contadores da carreira de Diego, sem misturar saves de outra conta no mesmo dispositivo; conferir a mesma posição/pontos nas três RPCs v2 e na UI. Verificar títulos da T atual somente no snapshot da temporada seguinte.
4. **Regressão final:** build, fixtures, Copa do Mundo T100 mínima, jornal, estante, identidade principal do clube, persistência e mobile no pacote exato candidato ao deploy.
5. **Plano de publicação:** a migração proposta está fora de `supabase/migrations` de propósito. Após ensaio, transformá-la em migração versionada, fazer backup/verificação prévia e revisar a ordem DDL → app. A publicação do site por push em `main` entrega o código a todos, mas somente a conta verificada pode acessar o novo fluxo. Não acionar DDL/deploy até os itens anteriores passarem e Diego aprovar o candidato final.

## Próximo passo exato

Para publicar com isolamento comprovado, obter um ambiente **de ensaio** com o esquema real do projeto `faabglpjutwursgmrpny` e duas sessões Auth autorizadas, sem compartilhar senhas nem alterar contas de produção. Aplicar e verificar ali a proposta SQL, registrar resultados e então preparar a migração versionada. Diego pediu que o conteúdo apareça somente na conta dele; a ausência de ensaio e sessões autenticadas impede afirmar isso para um deploy real nesta rodada.
