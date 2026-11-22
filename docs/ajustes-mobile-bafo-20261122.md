# Correções do piloto móvel — 22/11

Diego pediu compactar apenas o painel de tática no celular, manter todas as instruções abertas, permitir ver todos os outros jogos pela faixa horizontal e corrigir o resumo de estatísticas aparecendo sem estilo no corpo da página. Complemento explícito: o aviso de folga deve ocupar o lugar do próprio jogo, no alto.

## Causas e correções

- **Estatísticas soltas no celular:** os slots `leaders` e `rival-preview` dependem dos destinos da lateral do desktop. Quando essa lateral não montava, `OwnerSlot` devolvia os filhos diretamente no fluxo da página; os estilos desses resumos existiam somente no breakpoint desktop. Os slots exclusivos da lateral agora retornam vazio sem destino, e os resumos têm proteção de visibilidade própria. O desktop continua recebendo os mesmos dados na lateral; o celular acessa os detalhes nas abas correspondentes.
- **Bafo com cinco clubes:** há dez rodadas, dois jogos por rodada e uma folga. Quando não havia resultado do usuário, a área principal dizia “aguardando o pontapé”, mesmo com os outros jogos em andamento. O cartão de folga lá embaixo ainda consultava `fixtures[round]`, que é a PRÓXIMA rodada. A apresentação nova confere `fixtures[round-1]`, mostra a folga no lugar do placar e informa o próximo adversário existente. Um resultado ausente em partida prevista recebe mensagem própria, sem ser tratado como folga. O cartão antigo não se repete embaixo no piloto. Calendário, resultados e identidades não foram alterados.
- **Tática:** retirada a gaveta “Mais instruções”; ritmo do ataque e marcação especial ficam sempre visíveis. No celular, reduzidos padding, margens e tipografia apenas desse painel; botões mantêm alvo mínimo de 44 px e o select conserva 16 px para evitar zoom de formulário no iOS. A regra das ordens, o escopo das contas e a transmissão não mudam.
- **Outros jogos:** removido o corte artificial em dois resultados. A faixa contém todos os outros jogos, com rolagem horizontal, foco de teclado e indicação de deslizar quando há mais de dois. No celular preserva o tamanho dos cartões em duas colunas; um único jogo ocupa a faixa. Quando o usuário folga em liga de três, a única outra partida também aparece.

## Escopo

Mantida a allowlist exclusivamente da conta principal do Diego e os limites existentes das ordens ao vivo. Basquete, carreira, outras contas, transporte, Supabase e motor de resultados ficam fora desta alteração. Sem anúncio público de novidades.

## Verificação

- `node scripts/testa-football-round-status.mjs`: rodada atual versus próxima, folga ímpar, espera, jogo previsto sem resultado, calendário incompleto e ausência de mutação.
- `node scripts/testa-football-match-pilot.mjs`: acesso privado e troca/logout da conta.
- `node scripts/teste-football-full/verifica.mjs`: tela real, painéis abertos, compactação, rolagem até o último jogo, ausência de resumos laterais no celular, desktop preservado e calendário real do Bafo com três/cinco participantes. Larguras 360/390/430/1440. Usa o reducer real e provider isolado, bloqueando solicitações externas.
- Resultado final: **113 verificações de interface passaram, sem erros JavaScript**.
- `npm run build` e `git diff --check` passaram.
- Capturas e relatório locais: `/workspace/shared/diego-mobile-bafo-20261122/`.
- A bancada não substitui teste físico no Samsung S25 nem teste com sessões autenticadas. Não houve escrita em salas reais.
