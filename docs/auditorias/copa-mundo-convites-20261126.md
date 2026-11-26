# Copa do Mundo por convite — 26/11/2026

Pedido de Diego: tradicional com Copa de quatro em quatro temporadas, sem esperar T100, entrando pelo ranking e escolhendo uma seleção. Brasil Oficial mantém o convite do país ligado ao ranking.

## Comportamento

- Carreira nova: edições T1, T5, T9 e assim por diante. O ranking de clubes continua definindo a elegibilidade (top32) e as seleções permitidas; não há convite automático para qualquer clube.
- Tradicional: a posição permite aceitar uma seleção daquela posição para baixo. A lista existente mantém aparência e regras; permite recusar a edição sem prêmio e sem reapresentá-la após recarregar.
- Oficial: convite individual e aceitar/recusar existentes preservados.
- A contagem de títulos para o ranking aceita Copas confirmadas desde T1, mantendo a proteção contra edição futura.
- Agenda antiga: preserva temporadas encerradas, mural e prêmios. A cadência futura passa a quatro desde a última edição registrada; Copa ativa prevalece como referência e mantém seleção, XI, chaveamento e fase congelados.
- O mural confirmado no save também é considerado ao reconstruir agenda local: uma edição registrada não volta a oferecer premiação por faltar o registro local da Copa.
- Chamadas legadas explícitas 100/10 continuam compatíveis; os dois chamadores de carreira usam explicitamente 1/4.

## Limites

Não muda T40 dos internacionais de clubes da tradicional, Libertadores/Champions, formatos das copas, motor, OVR, mercado, economia, salas online, basquete ou F1. Não altera o mecanismo existente de armazenamento da fase em andamento; não promete sincronização em nuvem de um torneio ativo. Sem SQL e sem recarga automática.

## Verificação

- `node scripts/run-carreira-test.mjs /scripts/testa-copa-mundo-convites.mts`: calendário, ranking, chamadas antigas, migração idempotente e sem mutar entrada, save parcial, fase ativa fora do calendário, mural e prevenção de reedição.
- `node scripts/teste-copa-convites/runtime.mjs`: componente real em Chromium, tradicional/Oficial em 390 e 1440px; convite na T1, seleção elegível, convocação, recusa e recarga sem repetir. Casos fora do ranking, entre edições, legado T114 e retomada T110 com mesma fase/cartas.
- Capturas e relatórios locais: `/workspace/shared/copa-mundo-convites-20261126/`. Fixtures isoladas, sem acessar conta real; rede externa bloqueada na bancada de convites.
- Regressão `scripts/testa-copa-mundo-stats.mjs`: 40 Copas, 2040 jogos, 5060 gols e 3812 assistências sem perdas/duplicações; inclui registro único, soma das fichas e aceitação de títulos desde T1. Duas verificações antigas de texto foram atualizadas para a integração existente por fases já encerradas (nenhuma mudança produtiva no motor/contagem).
- Build completo e verificação de recarga obrigatórios antes do commit; publicação confirmada pelo workflow do SHA entregue.

## Reversão

Commit isolado. Reverter o código sem apagar mural, edições jogadas ou carimbo ativo. A nova versão da agenda só acrescenta campo opcional; save anterior continua legível.
