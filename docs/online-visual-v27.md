# Online V27 — duas contas de teste

Escopo: somente `diego.c.fonseca@gmail.com` e `diego.c.fonseca2@gmail.com`, via `useOnlinePreview`. Não altera listagem do leilão, pregão, criação de presidente ou carreira. A interface pública permanece no caminho existente.

## Entrega

- Remove os atalhos redundantes CLASSIFICAÇÃO / JOGOS DA SALA. Mantém JOGOS + TABELA, ESTATÍSTICAS e ELENCO.
- Faixa horizontal compacta com os outros jogos, minuto e placar. Lista completa continua junto da classificação. Os cards menores destacam gols por um segundo, sem aumentar sua altura.
- Libertadores identifica técnicos pelo nome nos jogos dos grupos.
- Mundial mostra gols e assistências reais apenas das partidas encerradas, sem spoilers. Correção de informação anterior: o motor JÁ gerava assistências; faltava apresentá-las.
- Relógio de apresentação do Mundial privado: host comanda, convidado lê fase/início/velocidade. Reabrir a tela retoma a fase; fechar o modal não desmonta o relógio. Resultados, sementes e premiações continuam nos fluxos existentes.
- Preserva a correção paralela `276a71a` (assistências da liga sempre visíveis) e as correções anteriores do lobby/store.

## Banco e isolamento

`docs/sql/online-copa-clock-preview.sql`: tabela isolada e RPC invoker. RLS exige e-mail assinado de uma das contas e participação na sala; somente o host real escreve. Sem service key, sem alterações de game_state. CAS de revisão impede dois comandos da mesma fase em abas do host. O servidor carimba o início e valida o término. Poll de 2 segundos somente nas duas contas; timer local só apresenta minuto. Conta comum não acessa tabela/RPC. Convidado de host público conserva o fluxo público quando não existe relógio privado.

## Verificação

- Build TypeScript/Vite.
- `node scripts/check-online-preview.mjs`: allowlist, conta comum, logout, erro e troca de sessão.
- `node scripts/check-copa-preview.mjs`: relógio/manual/auto e assistências sem antecipar fases.
- `node scripts/checa-vigias-online.mjs`.
- Navegador: liga, Copa dos 8, Libertadores/grupos e mata-mata, Mundial e encerramento em 390px/1440px; sem erros de JS nem overflow lateral.
- Dois contextos de navegador com transporte RPC simulado: host/convidado, fase/minuto, troca de aba, reload e assistências reais do simulador. Não equivale a duas sessões de jogadores autenticados em produção.
- SQL real em transação revertida: host init/next/skip/speed; convidado lê mas não escreve; conta comum bloqueada; CAS e término antecipado bloqueados. Nenhuma sala de teste persistida. Advisor de segurança sem alertas para os novos objetos.

## Reversão

Reverter apenas os hunks V27 destes componentes, preservando patches paralelos. A tabela privada pode permanecer sem uso; nenhum dado de partida público depende dela. Não apagar partidas nem saves para reverter visual.
