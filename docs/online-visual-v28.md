# Online V28 — gols e pênaltis compactos

Pedido aprovado: placares menores mostram autores/minutos, sem BOT ou técnico repetido sob o clube; preserva identificação do usuário sob a seleção no Mundial. Pênaltis com duas linhas, escudos, marcação acessível ✓/×, cobrança atual amarela, contagem separada e CAMPEÃO/CLASSIFICADO após o suspense. Altura aproximada de 118px no teste mobile.

## Dados e limites

O motor já calculava os minutos entre bots, mas descartava os eventos. O host de uma das duas contas de prévia passa a guardar `presentationGoals`, separado dos `highlights` públicos; `lastPresentationGoals` leva esses eventos para as Copas. O accessor lê somente a prévia já validada pelo Auth; nenhuma mudança de autenticação, banco, autoridade ou youIdx. Público e carreira mantêm o comportamento existente. Não adiciona chamadas ao RNG nem muda placares, autores ou assistências. Sem inventar nomes quando o motor só tem gol genérico de clube.

Rodadas antigas já calculadas sem eventos continuam com fallback: não reconstruir nem inventar minutos. O host precisa atualizar o site; os eventos completos são guardados a partir das próximas partidas. Um convidado privado com host público continua dependendo dos dados do host.

Na representação dos pênaltis, conserva a ordem anterior quando sua soma bate com o resultado oficial; se a antiga sequência parava antes de representar todos os gols oficiais, reordena apenas as marcas visuais respeitando cinco cobranças e parada ao decidir. Totais legados que não cabem nessa regra (por exemplo 5×2) recebem resumo do resultado oficial após suspense, sem inventar cobranças. Não muda placar oficial, vencedor, premiação nem adiciona espera ao fluxo. Público conserva seu componente antigo.

## Verificação e reversão

Build TypeScript/Vite; allowlist/logout; testes de 100 jogos bot-bot comparando todos os resultados, estado, estatísticas e próximo valor RNG; gols guardados conferidos contra placares. Teste de todos os 20 totais alcançáveis em cinco cobranças, parada correta, contagem e fallback histórico. QA mobile/desktop com gols, nomes, ordem da volta, ausência de rótulos, pênaltis e anti-spoiler. Não substitui uma partida real com as duas contas logadas.

Reversível pelos hunks V28: novos campos opcionais podem permanecer nos estados antigos sem afetar o motor. Não apagar saves, salas ou dados para reverter. Leilão, pregão e presidente não foram alterados.
