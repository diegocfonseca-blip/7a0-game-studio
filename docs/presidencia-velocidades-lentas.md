# Velocidades lentas no estádio — 12/10/2026

> Atualização de 18/10/2026: a regra de restaurar velocidade ao sair descrita
> abaixo foi substituída. Abrir campo, mapa ou sala seleciona 0,25× uma vez;
> a escolha manual seguinte permanece, inclusive ao sair. As três vistas
> oferecem 0,25×, 0,5× e Normal, sem exigir plano. Ver
> [correção do relógio e distribuição](presidencia-sincronia-campo-20261018.md).

Implementadas 0,5× (Lento) e 0,25× (Bem lento) na aba do estádio da carreira
solo. Sem dependência de tier ou Modo Manual: disponíveis para gratuito e
pagante quando a funcionalidade de estádio estiver acessível. O gate privado
continua exclusivo de Diego; não houve liberação para outras contas.

Os botões atualizam SET_SIM_SPEED, a fonte já usada pela simulação, campo,
bola, placar e competições. Não há relógio visual independente. Ao sair da
aba, restauram o ritmo anterior; há também botão para restaurá-lo dentro da
aba. Não adicionam acesso às velocidades rápidas pagas. Não aparecem no
online compartilhado, preservando a autoridade de ritmo da sala.

O ritmo anterior é atualizado a cada nova sessão de câmera lenta: se o
usuário restaurar 4×, escolher 2× e voltar a 0,25×, sair do estádio retorna
a 2×. Esse percurso também está coberto no teste de navegador.

Corrigido o relógio da Copa que zerava sua posição ao trocar simSpeed: agora
conserva tempo simulado acumulado na mesma fase. Fase/temporada nova reinicia
o relógio; timers de conclusão usam o tempo restante.

Verificação: npm run build aprovado; teste dos controles (troca/restauração/
desmontagem sem dependências de tier/manual), LiveScoreCard real (incluindo
0,5× e 0,25×, sem retroceder minuto) e integração da Copa aprovados. Fixtures
locais com rede externa bloqueada; nenhum save real alterado. Não comprova
fluidez em aparelho físico. Git diff --check limpo.

Lote local acumulado com mapa e circulação, ainda sem commit/deploy.
