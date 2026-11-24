# Bancada de salvamento

Somente fixtures públicas e contas fictícias. O navegador bloqueia todo acesso externo, inclusive Supabase. Nunca apontar os SQLs desta pasta para o projeto real: o teste principal trunca as tabelas da bancada. Uma trava exige a tabela `test_rights`, que só existe no laboratório.

Banco isolado PostgreSQL 17:

```sh
docker run -d --name ll-save-lab-20261124 -e POSTGRES_PASSWORD=teste-local-salvamento -p 127.0.0.1:5449:5432 postgres:17-alpine
docker exec -i ll-save-lab-20261124 psql -U postgres -v ON_ERROR_STOP=1 < scripts/teste-salvamento/bootstrap.sql
docker exec -i ll-save-lab-20261124 psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261124182353_salvamento_seguro_v2.sql
docker exec -i ll-save-lab-20261124 psql -U postgres -v ON_ERROR_STOP=1 < scripts/teste-salvamento/protocolo.sql
docker exec -i ll-save-lab-20261124 psql -U postgres -v ON_ERROR_STOP=1 < scripts/teste-salvamento/direitos-retencao.sql
python scripts/teste-salvamento/concorrencia.py
```

Navegador real, com API substituída na própria bancada:

```sh
DEPLOY_BASE=/ npm run dev -- --host 127.0.0.1 --port 5197
node scripts/teste-salvamento/verifica.mjs
```

Evidências locais em `/workspace/shared/salvamento-seguro-20261124`. Incluem capturas em 390 e 1440 pixels. Não são medição de FPS ou de desempenho físico do S25.

A imagem de PostgreSQL não contém pg_cron. O corpo da conservação é testado diretamente, incluindo a semana de carência, os vencimentos e a preservação do save ativo. O agendamento só é instalado se a extensão já existir no projeto.

A conferência da entrada compilada usa a ordem real de importação da aplicação. Ela é necessária além da bancada de componentes: detectou ciclo entre store e os avisos, ausente na ordem da bancada. Depois de compilar a raiz e servi-la localmente, execute `LL_SAVE_BASE=http://127.0.0.1:5198 node scripts/teste-salvamento/publicacao.mjs`. Todos os envios de API e WebSockets ficam bloqueados.
