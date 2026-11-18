# Regressão: menu e retomada não pertencem ao dono

Incidente GGWNX6, 16/11/2026, aproximadamente 02:55 UTC (23:55 de Brasília em 15/11). Base investigada: `1dbffc9f`.

A bancada monta dois **EscProvider reais**, com contas e canais locais simulados. O Playwright impede HTTP externo e WebSockets. Não acessa, modifica ou autentica contas reais. O estado usa técnicos fictícios e IDs não consecutivos para distinguir cadeira de ID.

Com Vite em `4216`:

```
node scripts/teste-reentrada-identidade/verifica.mjs
```

`QA_BASE` permite outra origem local. Requer `playwright-core` e Chromium em `/usr/bin/chromium`. Resultados: `/workspace/shared/lavras-reentrada-20261116/depois.json`.

Antes da correção, executar os mesmos arquivos sobre a base com `--antes` comprova que o menu do convidado muda a tela do dono e que a retomada troca o UID, a cadeira e a coroa do dono. Essa reprodução foi registrada em `antes.json` antes de alterar a produção local.

Depois da correção, verifica menu local, retorno na própria cadeira, bloqueio de ações locais vindas de abas antigas pelas duas entradas (rádio da sala e caixa do dono) e passagem de ação legítima pelo mesmo canal. O reducer, o dispatch e os receptores usados são os da aplicação; não há cópia da lógica de roteamento no teste.
