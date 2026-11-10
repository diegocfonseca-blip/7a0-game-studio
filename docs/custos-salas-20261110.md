# Custos e criação de salas — 10/11/2026

Autorização do Diego: implementar as quatro recomendações, preservando salas em andamento. Não foram criadas, reiniciadas ou modificadas salas reais para testes.

## Entrega

- Índice `live_beats_user_beat_idx(user_id,beat_at DESC)` criado CONCURRENTLY em produção: atende à procura da presença por usuário, evitando filtrar todas as presenças recentes. Índice válido, pronto, aproximadamente 11 MB.
- Cache privado da lista global de nomes que copiaram Batismo, com atualização a cada minuto e invalidação imediata quando nome/e-mail/Batismo muda. Cache vencido ou inválido usa o cálculo anterior. Resultado comparado com o original: os mesmos 23 nomes. Chamadas simultâneas no navegador compartilham uma solicitação.
- Limite dos clãs calculado uma única vez por clã, preservando valores, benefícios e frequência de 15 minutos.
- Criação com prazo total de 30 segundos e botão liberado em qualquer falha. UUID persistido por conta/jogo, recuperado após atualizar. RPC autenticada grava sala e dono na mesma transação; repetir a tentativa não cria outra sala nem cobra novamente sua cota. Partida já iniciada não é reiniciada.

Migração aplicada: `20261110220342_custos_presenca_nomes_clas_criacao`. O índice foi criado separadamente antes dela para evitar bloqueio de escrita. As funções existentes conservaram suas permissões; a RPC nova exige autenticação e respeita RLS e gatilhos existentes. Nenhum novo apontamento no comparativo de segurança do Supabase. Cron do cache confirmado com execuções bem-sucedidas às 22:17 e 22:18 UTC.

## Evidências e limites

Na amostra anterior de aproximadamente um minuto, `esc_nomes_sem_escudo` teve 3 chamadas, média 455,5 ms. Depois, uma leitura da API com cache levou 1,703 ms. São amostras de uma consulta, não uma medição de economia mensal ou da velocidade de todas as salas. A consulta de presença com usuário sintético passou a usar diretamente o novo índice (0,127 ms na execução medida); não representa o tempo total do sininho.

O total histórico de chamadas não era tráfego de hoje. Os registros disponíveis não permitem afirmar a saturação exata de CPU/RAM no incidente do K9. Small e Medium têm dois núcleos compartilhados; o número de jogadores sozinho não determina o trabalho do banco.

As alterações reduzem consultas repetidas e trabalho desnecessário. Não reduzem o preço fixo do Medium, não mudam os pacotes de Realtime nem permitem prometer um percentual da fatura. Há um custo pequeno de armazenamento/escrita do índice e uma atualização de cache por minuto. Se houver erro de cache, a consulta original continua protegendo os nomes, podendo voltar a consumir mais processamento.

## Validação

- Build completo e TypeScript aprovados.
- `node scripts/teste-custos-salas/criacao.mjs`: 73 verificações no código real extraído do lobby, com respostas simuladas; inclui falhas, cota, clique duplo, resposta perdida, troca de conta com requisição pendente, recuperação e configurações dos modos/competições.
- `node scripts/teste-custos-salas/nomes.mjs`: 3 verificações de agrupamento e recuperação após erro.
- `PGLITE_MODULE=<caminho do módulo PGlite> node scripts/teste-custos-salas/banco.mjs`: 24 verificações PostgreSQL isoladas de equivalência, invalidação, permissões, RLS, atomicidade e preservação de cotas.
- `node scripts/teste-custos-salas/browser.mjs`: tela real em 390 e 1440 px; prazo com aviso, botão destravado, atualização recupera o mesmo UUID, uma sala/um dono, sem erro de página ou rolagem horizontal. Todas as conexões externas bloqueadas no teste.
- `npm run liga-volta`: aprovado, preserva retorno ao mesmo time e remoção somente pelo dono.
- `npm run sala` continua com dois checks de texto falhando; `node scripts/testa-conta.mjs` continua falhando no check de texto de senha. As mesmas falhas foram reproduzidas no commit anterior `2426d2d7`, sem nenhuma alteração desta entrega. Não foram alterados esses testes nem as telas fora do escopo para mascarar as falhas.

Artefatos locais: `/workspace/shared/custos-salas-20261110/`. Não foi executado leilão/campeonato ao vivo. A redução anterior de 37–44% de compactação permanece fora desta entrega e sem validação ao vivo.

## Reversão

1. Reverter o commit do site e publicar pelo fluxo normal; manter a RPC no banco enquanto houver navegadores com o código novo carregado. Não apagar salas nem forçar atualização de quem joga.
2. Para reverter somente nomes/clãs, executar `docs/sql/custos-salas-20261110-rollback-funcoes.sql` primeiro: restaura os cálculos anteriores sem remover a RPC de criação.
3. Depois da restauração, desagendar apenas `esc-nomes-escudos-cache`, remover os triggers `esc_cache_nomes_contas` em `auth.users` e `esc_cache_nomes_batismos` em `public.esc_nomes_batismo`. Só então remover as três funções privadas e a tabela privada, sem CASCADE. Não remover o schema `private`, que pode conter outros objetos.
4. O índice pode permanecer; se for necessário retirá-lo, usar `DROP INDEX CONCURRENTLY public.live_beats_user_beat_idx` isoladamente, fora de transação.
5. A RPC só deve ser removida após confirmar que não há mais clientes novos em uso. Reverter o cache não exige removê-la.
