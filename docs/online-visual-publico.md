# Online público — liberação aprovada em 08/09/2026

Diego aprovou liberar para todos exatamente a apresentação V28 das duas contas.
Somente futebol online (Rápido e Minhas Ligas). Carreira NÃO está liberada;
a allowlist original continua nos componentes de carreira e no onboarding.
Leilão e pregão, resultados, RNG, recompensas, identidades e eleição do host
não foram alterados nesta liberação.

## Escopo e isolamento

- Chave separada em online-release.ts: online, não carreira, não basquete.
- Liga, Copa dos 8, Libertadores e Mundial: banners, fases, jogos + tabela,
  outros placares com autores/minutos, assistências e pênaltis compactos.
- Salas, jornal, pacote e votação já públicos permanecem como aprovados.
- Componentes compartilhados só liberam o placar novo com opt-in online.
- Copa do Mundo usa o relógio compartilhado para todas as contas.
  RLS: membros/host leem somente sua sala; só o host pode inserir/atualizar.
  RPC SECURITY INVOKER, revisão CAS e prazo do servidor mantidos.
- A mudança recente da linha do grupo no lobby foi preservada.

## Verificação

- Build de produção passou.
- QA com conta comum simulada: Liga, Copa dos 8 (abertura/volta),
  Libertadores (grupos/oitavas), Mundial (grupos/semis), transição pós-liga.
  390px e 1440px: sem erros JavaScript e sem overflow horizontal.
- Desktop conferido também por screenshots das páginas reais.
- Placar compartilhado de carreira mantém apresentação antiga para conta comum.
- Gate privado: allowlist, logout, erro de auth e troca concorrente de sessão.
- 100 partidas entre bots: mesmos placares, artilheiros, assistências,
  estado e RNG; 242 eventos de gol preservados.
- Pênaltis: todos os 20 totais atingíveis, decisão sem chutes extras,
  fallback para totais históricos impossíveis; componente de 118px.
- SQL em transação revertida: host e membro com e-mails comuns,
  convidado impedido de escrever, externo/anon impedidos, CAS e prazo válidos.
- Advisor: nenhum apontamento específico do relógio desta liberação.

Os testes de navegador usam fixtures e transporte simulado, não logins reais
dos usuários. A autorização foi testada separadamente no banco.
Rodadas antigas sem eventos individuais não podem ser reconstruídas.
Host e convidados devem atualizar a página; novos eventos completos passam
a vir das próximas rodadas processadas pelo host atualizado.

## Reversão

Reverter somente o commit de liberação do frontend ou desligar
ONLINE_VISUAL_RELEASED preserva a prévia anterior das duas contas.
Para restaurar também a restrição do relógio, reaplicar os predicados
de e-mail das políticas/RPC de docs/sql/online-copa-clock-preview.sql,
SEM recriar/apagar a tabela. Não apagar jogos/saves nem outras entregas.
