# Abas com partida permanente — 22/11

Pedido do Diego: manter as abas e o placar cinema ou campo 2D intactos ao navegar; o conteúdo escolhido deve aparecer abaixo do jogo.

- O componente nativo da partida permanece montado e visível em todas as abas. Seletor de transmissão e controles existentes continuam disponíveis, preservando as regras do dono da sala.
- Retirado o salto automático ao início da página. A troca de aba não reinicia relógio, rodada, velocidade ou canvas do campo.
- Tabela/jogos, estatísticas, elenco e rivalidades ocupam o conteúdo abaixo da partida. Rivalidades completas passam para esse destino também no desktop; a tabela e o chat da lateral continuam montados.
- Escopo inalterado: piloto exclusivo da conta principal do Diego, apenas futebol online. O destino novo de rivalidades não existe fora desse piloto. Sem mudanças de motor, transporte, identidade, carreira, basquete ou banco; sem novidades públicas.

## Verificação

- `node scripts/testa-football-match-pilot.mjs`: passou.
- `node scripts/teste-football-full/verifica.mjs`: 281 verificações passaram, sem erros JavaScript. Telas reais com reducer/provider isolados, rede externa bloqueada; celular e desktop, cinema e canvas 2D, copas, calendário ímpar do Bafo e exclusão das outras contas. Confirmados a mesma instância da partida/abas/canvas, geometria e rolagem preservadas e conteúdo selecionado abaixo do jogo.
- `npm run build`: passou (TypeScript e Vite).
- Evidências locais: `/workspace/shared/diego-abas-placar-permanente-20261122/`.
- A bancada não substitui teste físico no Samsung S25 ou sessões autenticadas em sala real. Nenhuma sala real foi alterada nos testes.
