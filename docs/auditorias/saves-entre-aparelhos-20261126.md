# Saves entre PC e celular — 26/11/2026

Diego mostrou listas com 6/6 e 3/4 fichas, conflito com temporada2/rodada9 e carreira aberta no celular na rodada23. A análise da conta foi somente leitura, com resultados individuais preservados fora do repositório. Nenhum payload de usuário foi restaurado, alterado ou enviado para teste.

## Diagnóstico

- Recuperação automática do aparelho e envio manual à nuvem são operações diferentes, como decidido na implantação de24/11. Rodada avançada no celular não confirma upload. A cópia mais avançada deve ser preservada até haver confirmação do servidor.
- A lista mistura registros locais com o manifesto remoto, deduplicados por seed. Cópias locais ainda não enviadas e o limite local preservado podem explicar contagens diferentes. Não é possível identificar todas as fichas do PC apenas pela fotografia parcial. Não equiparar 6/6 a seis uploads confirmados.
- A Central nova retirou a faixa do topo por pedido expresso anterior; no rodapé permaneceu só Sair e salvar. Reutilizar a faixa aprovada no fim da página oferece Salvar sem sair e o estado da nuvem junto dos controles existentes.
- Rodada idêntica não significa payload idêntico: escolhas e estado podem divergir. O conflito continua exigindo escolha explícita, com cancelamento e preservação.
- Resumo local usava apenas careerDivision, enquanto a lista/servidor priorizam careerPlacements do clube. Após promoção, isso podia voltar a mostrar SérieD ao reabrir a lista. O resumo passa a usar a mesma precedência; metadados antigos são corrigidos na próxima gravação local normal, sem baixar/regravar todas as carreiras.

## Ajustes

- Lista informa rodada, cópia da nuvem com data/hora, avanço local divergente ou ausência de cópia confirmada na nuvem; distingue consulta ainda não realizada. Contraste explícito do modal e nome.
- Informa as fichas de nuvem do plano confirmado separadamente das cópias locais preservadas. Não concede vagas nem altera planos/limpeza.
- Abertura explícita da lista força atualização do manifesto pequeno, sem esperar o cache de15s. Só a carreira escolhida baixa o payload.
- Conflito mostra o registro local disponível e explica divergência com mesma rodada. Não recomenda automaticamente a cópia com maior rodada ou data.
- Salvar sem sair/estado da nuvem no rodapé novo, usando a faixa já existente; topo continua sem duplicação. Mesma rotina de gravação manual, três tentativas idempotentes, revisão e confirmação do servidor.

Não altera protocolo/RPC/SQL, direitos, formato dos payloads, autosave da nuvem, lógica de conflito, restauração ou exclusão. Não sobrescreve progresso aberto com atualização de outro aparelho. Sem recarga automática e sem alteração de contas reais.

## Verificação

Bancada atual de salvamento em Chromium com acesso externo bloqueado; 49 verificações de conta, drafts/checkpoints, conflito, quota, rede e recuperação repetidas na versão final. Teste com dois contextos separados reproduziu telefone23/nuvem9/PC9 e verificou envio confirmado, consulta fresca, divergência, cancelamento, cópia de recuperação e continuidade nos dois sentidos. Relatórios e capturas em `/workspace/shared/saves-aparelhos-20261126/`.

Build completo e `npm run recarga` obrigatórios. Reversão deste pacote é do cliente: não há migração de dados nova. Não reverter a implantação do protocolo v2 de24/11 com este pacote.

Teste acompanhado: Diego acionou Sair e salvar no celular; consulta somente leitura confirmou revisão nova na rodada23 e a fotografia posterior do PC mostrou a mesma edição da nuvem. O envio funciona ao salvar. Não se conclui, retrospectivamente, se houve falta de toque ou falha anterior ao envio.

Regressão de dois aparelhos: `SAVE_QA_BASE=http://127.0.0.1:5439 node scripts/teste-salvamento/aparelhos.mjs`, com15 verificações, incluindo resumo atualizado após promoção/reabertura e Salvar acessível sem sair. Capturas são de componentes reais na bancada, não de contas reais.
