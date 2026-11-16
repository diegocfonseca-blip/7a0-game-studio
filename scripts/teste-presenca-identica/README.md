# Presença idêntica não provoca retransmissão da partida

Usa dois `EscProvider` reais da aplicação, por meio da bancada de identidade.
Auth, banco e canais são simulados; HTTP externo e todos os WebSockets ficam
bloqueados. O teste não usa contas, salas nem mensagens cobradas da produção.

Com Vite rodando na porta 4217:

```sh
node scripts/teste-presenca-identica/verifica.mjs
```

`QA_BASE` muda a origem; `QA_OUT` muda a pasta de evidências (padrão:
`/workspace/shared/presenca-identica-20261116`). Requer `playwright-core` e
Chromium em `/usr/bin/chromium`.

Antes de aplicar o filtro em `store.tsx`, executar com `--antes`: cinco eventos
de presença idênticos geram cinco envios de estado. Depois, os mesmos eventos
geram zero. Os dois resultados ficam em `antes.json` e `depois.json`.

Verifica também: UID diferente na mesma cadeira, saída, retorno, reordenação,
duas pessoas na mesma cadeira (dupla), ausência de UIDs versus lista vazia,
dois pedidos explícitos de recuperação sem mudança no estado, ação legítima
do convidado sincronizada com o dono, heartbeat e identidade de ambos.

O relógio é virtual. Isto demonstra o comportamento do código, não estima a
economia mensal nem substitui observação posterior do uso real.
