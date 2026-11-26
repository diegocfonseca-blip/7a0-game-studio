# Liga + Champions convocando — revisão de apresentação (26/11/2026)

Pedido de Diego: conferir desktop e celular, táticas ausentes, chat duplicado, cortes completos da classificação e comemoração interrompida. Sem mudança de motor, sorteio, resultado, regras de acesso ou banco.

## Causas e correções

- Reproduzido com a liga ainda montada atrás do modal: `OwnerSlot` enviava tática, navegação e controles para o primeiro `OwnerPrimary` da liga. `CMModal` agora delimita os próprios destinos de apresentação herdando permissões e preferências; nenhum relógio/simulador extra.
- `ChampionsSalaGate` montava outro `ChatWidget` além do global. Removida a cópia. O destino do chat é registrado e restaurado ao fechar a copa, conservando chat flutuante no celular e lateral no desktop.
- `FootballCupView` só coloria `qualify:8`. Zonas opcionais na tabela compartilhada: 1–8 direto às oitavas, 9–24 playoff/repescagem, 25–36 zona de eliminação (eliminados depois da fase de liga). Legenda textual, cores e cortes 8/24, com todas as 36 posições abertas. Outras copas preservam seus próprios cortes.
- Passo zero da Champions passa a dizer preparação, sem anunciar rodada 1 antes da largada. Continua mostrando abertura e os controles reais do host.
- A festa antiga tinha timer de 5,6 s e desmontava o cinema de 9,6 s. No futebol com apresentação nova, `FestaCampeao` agora acompanha a conclusão real do cinema (ou Pular). O banner permanente continua na competição. Basquete e festa anterior mantêm o próprio fluxo. A aba escolhida e a tabela permanecem disponíveis após a festa.

## Validação reproduzível

Bancada real de componentes em `scripts/teste-copas-piloto/main.tsx`; comandos em `champions-verifica.mjs`. Vite na porta 5187, Chromium local, respostas do relógio/táticas interceptadas e nenhum envio a sala real. `QA_EXTRA=1` executa regressões das outras copas, visual anterior e fases KO; execução normal cobre a matriz principal, preparação e encerramento. Importa App primeiro para conservar a ordem real de inicialização dos módulos.

- Celular 390 px e desktop 1440 px; dono, convidado e espectador.
- Destinos dentro da copa com uma partida da liga montada atrás; cinco abas preservam a transmissão; tática para participantes, ritmo/transmissão apenas para host.
- Um chat; abrir/fechar no celular; fechar/reabrir copa e restaurar destino da liga no desktop.
- Táticas 2×2 no desktop; escolha persistida e ordens ao vivo confirmadas usando o transporte existente.
- Tabela com 8/16/12 linhas por faixa e dois cortes; sem excesso horizontal.
- Preparação e início pelo host em placar e campo 2D real; playoff, volta, semi e final.
- Comemoração natural além de 6 s e Pular; tabela selecionada antes do fim permanece depois; banner do campeão presente.
- Motor `testa-champions-sala.mts` e 535 verificações de `testa-copa-planos.mjs`.
- 154 verificações da matriz principal + 46 regressões passaram sem erro JavaScript. Capturas e JSONs em `/workspace/shared/champions-layout-20261126/`.
- `npm run build` completo (TypeScript + Vite) e `npm run recarga` passaram antes do commit.

Limite: testes de interface em bancada com dados simulados; não foi operada uma sala de usuários. Não há SQL/migração nem alteração de payloads, identidade local ou autoridade do host. Nenhuma recarga automática.

Reversão: commit isolado desta revisão. Não trocar as flags públicas da Champions nem a prévia privada do Super Mundial.
