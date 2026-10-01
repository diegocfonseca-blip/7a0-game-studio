# Prontidão para teste privado — Libertadores, Champions e Mundial

**Situação em 01/10/2026: migração aplicada no Supabase real; código do site ainda não publicado.** Escopo inicial: somente `diego.c.fonseca@gmail.com`, sem moedas ou benefícios adicionais. A seção de bloqueios abaixo documenta o diagnóstico anterior à aplicação e não deve ser interpretada como status atual.

### Aplicação e verificação do banco em 01/10

A migração `carreira_internacional_privada` foi aplicada com sucesso ao projeto `faabglpjutwursgmrpny` pela ferramenta de migrações. A versão local exata está em `supabase/migrations/20261001173507_carreira_internacional_privada.sql`. Uma consulta independente após a aplicação confirmou três colunas novas, seis funções novas, `EXECUTE` negado a `anon` no gate e no ranking v2, `EXECUTE` permitido a `authenticated` no gate, e **zero snapshots com títulos internacionais não nulos**. Nenhum título, moeda ou benefício foi concedido. O código do cliente só deve seguir para `main` depois de conferir novamente o estado da branch remota e o build; a navegação autenticada final ainda precisa ser verificada sem afirmar resultado não observado.

## Evidências reunidas

| Item | Estado |
| --- | --- |
| Repositório remoto `main` | SHA `2be136d6641c860bb6c5c63ce15d086632f29b93`, lido via GitHub e integrado por merge local `a2c043eb`. A correção nova da mascote no placar foi preservada. |
| Trabalho local | Branch `codex/international-private-rollout-prep`; série internacional iniciada em `74743d2e`, endurecimento em `f584d2fb`, preparo desta rodada em `884aa25a`. Nenhum push, PR ou deploy. |
| Projeto Supabase correto | `faabglpjutwursgmrpny`, URL usada pelo app. `supabase/config.toml` aponta outro ID; não usar esse arquivo para escolher o destino de DDL. Uma conta com o e-mail de Diego existe; nenhuma conta foi criada ou alterada. |
| Esquema e RPCs | Leitura apenas: PK dos snapshots `(user_id,career_id,season_no)`, RLS própria para escrita, leitura pública; colunas internacionais ausentes. RPCs antigas ordenam títulos em fila, não pela soma de pontos do cliente. |
| Gate privado | O cliente espera `getUser()` verificar o mesmo ID da sessão **e** a RPC do servidor confirmar `auth.uid()`/e-mail. Logout/troca invalida respostas antigas. RPC ausente ou negada mantém tudo fechado. Outras identidades e sessão anônima não recebem painel, ações nem ranking v2 no app. Teste com identidades simuladas passou; não equivale a dois logins reais. |
| Ranking compartilhado | Proposta SQL em `docs/sql/carreira-internacional-rank-colunas-proposta.sql`: colunas com zero padrão, trigger de escrita privada e RPCs v2 privadas por identidade. Cliente usa v2 só para Diego e mantém fallback para o ranking antigo se elas não existirem. |
| Banco descartável | `bash scripts/testa-sql-ranking-internacional.sh` passou em PostgreSQL 17 local com cópia das três RPCs antigas reais: funções legadas intactas, escrita privada, bloqueio de outra conta/anônimo, 360 pontos, Top 50/posição 61, recorte temporal e idempotência. Nenhuma consulta de escrita no Supabase real. |
| Jogo | Fixtures G8/G9 e duas competições simultâneas, Mundial, save T87→T88, UI de inscrição desktop/mobile e jornal têm evidências anteriores em `docs/testes-carreira-internacional-local.md`. Após exigir autorização do servidor, fixtures, gate simulado, build e regressão da Copa do Mundo em Chromium passaram (40 Copas, rede Supabase bloqueada). Não equivalem a navegação autenticada em produção. |

Rechecagem em 01/10: `main` remoto continua em `2be136d6`; o projeto Supabase ligado ao app segue sem branch de ensaio e sem as três colunas/RPCs novas. O teste SQL descartável passou novamente. O teste de Auth simulado agora também confirma que uma resposta positiva da RPC, recebida depois do logout, não reabre a expansão. Nenhum dado de produção foi alterado.

### Ensaio adicional nesta sessão local (sem ambiente pago)

A branch preparada foi transferida para uma cópia isolada em `work/carreira-internacional-rollout-20261001`, SHA `06c6ab68040977b2bc932eb75e1e38383455f8e4`. O `main` remoto segue `2be136d6` e a comparação GitHub confirmou 16 commits à frente, zero atrás. `npm run build`, fixtures G8/G9, temporada internacional e gate simulado passaram nesta cópia.

Diego esclareceu que mantém também o repositório `diegocfonseca-blip/copa-mania`. Sua pasta `supabase/sql` tem três arquivos, não as 131 migrações do projeto efetivo; o `supabase/config.toml` desse repositório aponta para outro ID. Portanto ele não reconstrói o esquema completo de `faabglpjutwursgmrpny`.

Sem criar branch cobrada, a proposta SQL foi executada **dentro de transações com `ROLLBACK` no esquema real**, com `lock_timeout` de 1,5 s. Assertivas sob `SET ROLE authenticated` e IDs de duas contas existentes (sem expor seus IDs) passaram: a identidade de Diego recebeu autorização, ranking v2 e permissão de atualizar um contador; outra identidade não recebeu autorização/ranking v2 e teve a escrita negada. `anon` também não recebeu ranking v2. Depois do `ROLLBACK`, consulta independente confirmou **zero colunas e zero funções novas**; nenhum título ou conta foi alterado. Isto valida SQL/RLS/trigger no esquema real com identidades impersonadas, mas **não substitui duas sessões JWT reais no navegador**. Uma migração versionada equivalente foi preparada em `supabase/migrations/20261001173507_carreira_internacional_privada.sql`, ainda não aplicada.

## Diagnóstico do bloqueio de publicação

- O checkout contém **uma** migração em `supabase/migrations`, de 21/09; o projeto efetivo `faabglpjutwursgmrpny` registra **131** migrações, de 28/06 a 25/09. Portanto, `supabase start`/`db reset` com este repositório não reconstroem o esquema completo. Não há dump só de esquema no workspace, nem CLI Supabase/credencial de conexão ao Postgres remoto disponíveis aqui. O teste PostgreSQL existente reproduz os objetos relevantes, não o projeto inteiro. Um `supabase db dump` só de esquema seria possível com acesso de conexão ao banco, mas essa credencial não está disponível e não deve ser enviada em conversa.
- A API do Supabase associa o projeto efetivo à organização `diegocfonseca-blip's Org` (`igyopbnrlegbxrfowomj`), plano Pro; não há branch. A documentação de Branching 2.0 diz que a branch refaz as migrações e **não** copia dados de produção. Como há 131 migrações registradas, uma branch temporária é o caminho mais direto para ensaiar o esquema real; ainda será necessário comparar seus objetos com a produção, porque alterações fora de migrações podem não ser reproduzidas. A branch pode ter custo e não foi criada.
- Duas identidades de teste podem autenticar **somente na branch descartável** (uma com o e-mail permitido e outra diferente) para testar JWT/Auth, RPC, RLS, logout e troca de conta sem tocar usuários de produção. Isso comprovaria a trava no ambiente de ensaio; uma verificação final na conta real de Diego depois do deploy ainda será necessária para dizer que ele vê o recurso no site.
- **Próxima decisão única para destravar o ensaio:** confirmar a organização identificada pela API e autorizar consultar o custo da branch temporária. A ferramenta de custo exige essa confirmação; depois de mostrar o valor, a criação cobrada requer aceite específico. Até lá, não executar DDL nem deploy em produção.

## Bloqueios para publicar

1. **Banco de ensaio com esquema completo:** aplicar ali a proposta SQL, conferir migrações, privilégios reais, RLS, snapshots antigos com três zeros, duas carreiras da mesma conta e T100. O teste Docker cobriu os objetos relevantes, inclusive as RPCs antigas reais, mas não é um clone integral do Supabase. Não havia branch de ensaio; Diego não confirmou a organização/custo para criá-la e pediu apenas código restrito à sua conta. Não criar branch cobrada por suposição.
2. **Duas sessões autenticadas no ensaio:** duas identidades descartáveis na branch, uma com o e-mail permitido e outra diferente, em navegadores isolados. Confirmar o fluxo T40/T87 e reabertura; na outra e sem login, confirmar ausência de painel/modal/ações/RPCs v2, inclusive após troca de login. Nenhuma conta real de produção precisa ser alterada, nem receber moedas, títulos, privilégios ou acesso ao recurso.
3. **Snapshot compartilhado:** em ensaio autenticado, conferir que `esc_pyramid_rank_snap` recebe uma vez os três contadores da carreira de Diego, sem misturar saves de outra conta no mesmo dispositivo; conferir a mesma posição/pontos nas três RPCs v2 e na UI. Verificar títulos da T atual somente no snapshot da temporada seguinte.
4. **Regressão final:** build, fixtures, Copa do Mundo T100 mínima, jornal, estante, identidade principal do clube, persistência e mobile no pacote exato candidato ao deploy.
5. **Plano de publicação:** a migração proposta está fora de `supabase/migrations` de propósito. Após ensaio, transformá-la em migração versionada, fazer backup/verificação prévia e revisar a ordem DDL → app. A publicação do site por push em `main` entrega o código a todos, mas somente a conta verificada pode acessar o novo fluxo. Diego já autorizou a publicação privada quando segura; não acionar DDL/deploy até os itens anteriores passarem.

## Próximo passo exato

Para publicar com isolamento comprovado, obter um ambiente **de ensaio** com o esquema real do projeto `faabglpjutwursgmrpny` e duas sessões Auth autorizadas, sem compartilhar senhas nem alterar contas de produção. Aplicar e verificar ali a proposta SQL, registrar resultados e então preparar a migração versionada. Diego pediu que o conteúdo apareça somente na conta dele; a ausência de ensaio e sessões autenticadas impede afirmar isso para um deploy real nesta rodada.
