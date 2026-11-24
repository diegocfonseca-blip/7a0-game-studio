# Salvamento seguro da carreira — 24/11/2026

Diego autorizou executar o planejamento e reforçou: **sem conta é necessário cadastrar/entrar antes de salvar**. Depois, Diego determinou que as regras de salvamento da carreira tradicional sejam iguais às do Brasil Oficial. Não muda preços nem direitos dos planos. A implementação do fluxo v2 está na branch `feat/salvamento-seguro-20261124`. Após as capturas reais e a unificação das regras, Diego autorizou: “Pode publicar então já”. Aprovação visual e publicação autorizadas em 24/11/2026.

## Regras preservadas

- Sem conta: nenhuma carreira de futebol é gravada no aparelho ou na nuvem. A tela pede a conta grátis. É permitido jogar na sessão e criar a conta sem abandonar a partida.
- Conta grátis / Brasil Oficial e carreira tradicional: salvar só no aparelho, sem teste de 5 dias e sem bloquear novos avanços por um teste antigo vencido. Não há upload grátis de carreira à nuvem.
- Inatividade: mesma regra de cinco dias sem jogar nos dois modos, distinta do antigo teste de salvamento. A primeira abertura do novo fluxo dá carência de cinco dias aos saves existentes; falta de espaço para confirmar essa marca não autoriza exclusão. Exclusão automática verifica novamente o plano e o servidor protege pagantes. Saves antigos da nuvem continuam legíveis; os registros do teste antigo não são apagados nem consultados na regra nova.
- Planos elegíveis (incluindo os direitos existentes de Craque, Lenda, Batismo e Fundador): nuvem. Mesma confiabilidade para todos; mais fichas e versões conforme os direitos. Não se usa `user_metadata` para autorizar.
- Fichas: mesma régua de `esc_direitos_de`/`fichasDoPlano`, extras compradas e carreiras antigas já existentes na nuvem preservadas. Nenhum arquivo local é truncado em oito durante a migração.
- Basquete, partida rápida, carreira online e identidade/autoridade das salas mantêm seus mecanismos próprios.

## Problemas corrigidos no código

O cliente anterior juntava todos os saves e comparava temporada, desempantando pelo relógio do aparelho. Uma rodada 1 podia substituir a 30 na mesma temporada. Também havia retorno `undefined` tratado como sucesso, escrita local sem confirmação, troca de conta que limpava a origem mesmo se o cofre falhasse, abertura direta de resume antigo e saída sem salvar dependente exclusivamente da nuvem.

Agora há uma revisão por carreira no servidor. O envio informa a revisão que o jogador abriu, um UUID reaproveitado nas tentativas e o UID esperado. Se outra cópia mudou, não sobrescreve: preserva os avanços e pede escolha. O UID esperado também é validado no banco, cobrindo troca de login enquanto o cliente prepara o pedido. O estado em memória acompanha o dono entre ações do reducer; login trocado não reassocia uma carreira aberta da conta anterior.

## Aparelho

IndexedDB por UID/seed, blobs gzip e serialização/hash em Worker. O localStorage fica para preferências, autenticação e pequenos recibos. Migra as chaves antigas/cofres sem remover a origem até a transação confirmar; erro de espaço deixa o original. Resume antigo de futebol não abre antes da autenticação/conferência; partida rápida e basquete continuam independentes.

Draft automático e checkpoint manual são distintos. A recuperação é coalescida em 1,5 segundo, inclusive com transições contínuas, sem enviar o estado da carreira à nuvem. Pagehide/visibilidade pedem flush, sem garantia de executar se o sistema encerrar o navegador abruptamente. Ao salvar manualmente, confirma o destino; sair sem salvar restaura o checkpoint e suspende novos drafts daquela carreira até reabri-la. Duas abas usam comparação atômica no IndexedDB: a tentativa divergente é preservada, não substitui a cópia da outra aba.

Os nomes, divisão, caixa e temporada usados na lista são resumos. Eles **nunca** são despachados ao motor: abrir baixa/decodifica a carreira selecionada e só então executa as atualizações existentes do jogo. A home acompanha a hidratação e trocas de login. Não se baixa o conjunto completo para mostrar a lista.

## Nuvem

Migração `20261124182353_salvamento_seguro_v2.sql`, validada em PostgreSQL 17 isolado e aplicada no projeto real em 24/11 às 18:23 UTC. Privilégios, RLS e rejeição sem conta conferidos; nenhuma conta real foi migrada apenas para teste. Schema privado com tabelas protegidas por RLS e sem acesso bruto de anon/authenticated. RPCs públicos mínimos usam invoker; núcleo privado valida `auth.uid()`, direitos e revisão sob lock. O guard da tabela legada também recusa upload de conta grátis por versões antigas do cliente. As contas são importadas sob demanda, mantendo a linha legada durante a transição. Seeds barradas administrativamente continuam barradas.

O manifesto lê `details` pequenos, calculados na gravação, sem descompactar o payload gigante para extrair os mesmos campos em cada abertura da home. Só a carreira escolhida é lida/enviada. Não há autosave de carreira para a nuvem. Upload é JSON da carreira selecionada; **a compressão em Worker é do armazenamento local, não um endpoint gzip de upload**. Não foram projetados ganhos de fatura sem medição de uso.

Uma gravação idêntica não cria revisão/snapshot extra. Um anterior é mantido como recuperação básica; tiers superiores têm três. Direitos de histórico já acumulados até três não são cortados no downgrade. Pedidos idempotentes limitados aos 64 mais recentes por conta, com prazo adicional de 30 dias. Um corpo novo tem proteção de 32 MiB; save existente maior pode crescer 8 MiB além de seu tamanho atual. A recusa não apaga o save anterior.

Exclusão usa revisão e tombstone. Apagar a linha antiga ou abrir uma aba velha não ressuscita a carreira. Clientes antigos não podem sobrescrever uma conta já migrada: recebem erro para atualizar manualmente a página; não se força recarga.

## Conservação e segurança em produção

**Aplicado e conferido:** migração `protege_limpeza_obsoleta_saves` revogou EXECUTE de PUBLIC/anon/authenticated na rotina antiga `esc_nuvem_gratis_limpa()`, cujo prazo de um dia havia sido revogado em 08/11. A rotina não foi executada e nenhum save foi alterado. `has_function_privilege` retornou false para os dois papéis. Advisors consultados após a implantação. O schema privado registra INFO de RLS sem políticas de acesso direto, intencional: clientes não têm grants nas tabelas e usam apenas RPCs com dono validado. [Referência do advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Há também achados preexistentes do projeto.

A conservação v2, quando implantada, começa após sete dias. Só elimina lixeira que já ultrapassou seu prazo antigo por mais sete dias (100 registros por execução). Payloads de carreiras explicitamente excluídas permanecem 30 dias, depois o marcador fica. Linhas legadas de contas migradas só saem após 30 dias, se todas as seeds estiverem representadas no v2 e a linha não tiver recebido correção administrativa posterior. Contas não migradas e carreiras ativas não são apagadas. Cron é privado, sem EXECUTE para clientes.

## Testes e limites

- PostgreSQL real isolado: importação íntegra e origem preservada; resumo sem payload; CAS na mesma temporada; idempotência; restauração com backup; exclusão e antirressurreição; proprietário do pedido; isolamento entre contas; grátis Oficial e tradicional; teste antigo vencido ignorado, grátis sem upload e save antigo legível; vagas; histórico dos tiers e downgrade; bloqueios administrativos; carência e limpeza sem atingir o vigente. Dois pedidos simultâneos obtiveram um `saved` e um `conflict`.
- Chromium com acesso externo bloqueado: save real produzido pelo reducer comprime, descomprime e reabre; sem conta não grava; resposta perdida repete o mesmo pedido; drafts não enviam nuvem; checkpoint manual independe do draft; conflito nuvem/aparelho preserva ambas as cópias; duas abas preservam a tentativa rejeitada; quota e rede não geram sucesso falso; nuvem confirmada pode salvar mesmo com aparelho cheio; migração não remove o original em falta de espaço.
- Fixture real de carreira nova no motor, em torno de 57 KB de JSON: cerca de 16 KB gzip no aparelho. Outra amostra sintética de 649 KB ficou em 14 KB; não generalizar essa proporção para saves reais antigos. O tamanho varia com a carreira.
- 49 verificações no navegador passaram na regra unificada; salvamento/checkpoint/recuperação local dos dois modos foram conferidos, incluindo teste antigo vencido e ausência de upload grátis.
- Entrada compilada da raiz conferida em390/1440. A revisão detectou uma dependência circular ao importar avisos no store; os avisos globais foram movidos para dentro do provedor na entrada da aplicação. Abertura real sem exceções em ambos os tamanhos; regressão em `scripts/teste-salvamento/publicacao.mjs`.
- Capturas reais dos avisos/histórico em celular390 e desktop1440; PT e EN previstos. Build completo e whitespace conferidos ao final.
- Não se alterou save de usuário para testar. Não há teste físico no Samsung S25. Não se promete eliminar falhas de aparelho, navegação privada ou indisponibilidade da rede; o fluxo não anuncia confirmação nesses casos.

## Publicação e retorno

Publicação autorizada por Diego em 24/11. Aplicar a migração v2, verificar privilégios/RLS/RPCs e agendamento sem migrar conta real só para testar; publicar o cliente e acompanhar o deploy. Nenhuma recarga automática. Manter os bundles anteriores conforme a rotina do site.

Não fazer `git revert` isolado após contas começarem a migrar: antes de voltar ao cliente antigo, exportar os saves canônicos atuais por conta para o formato legado e validar as seeds/revisões sob lock; só então liberar a escrita antiga. O formato antigo preservado é uma base de transição, não deve substituir avanços v2 posteriores. Enquanto isso, os guards falham com aviso e preservam os dados. A volta exige procedimento do banco, não apenas trocar o visual.
