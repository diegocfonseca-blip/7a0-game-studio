# Realtime: evitar retransmissão por presença idêntica

Diego autorizou somente a primeira medida da auditoria de custos: filtrar
repetições idênticas de presença, preservando recuperação e proteção das salas.

## Mudança

O reducer devolve o estado original para `SET_PRESENCE` somente quando as
cadeiras e os UIDs efetivos forem exatamente iguais aos atuais, na mesma ordem.
O retorno acontece antes da cópia profunda. Assim, os efeitos que dependem de
mudança no estado não retransmitem a partida à toa.

UID omitido continua preservando os UIDs anteriores, como antes. Lista vazia
explícita difere de UID desconhecido. Não ordenar nem deduplicar as listas:
duplas podem compartilhar uma cadeira e mudanças de ordem continuam passando.

Não altera protocolo, assinatura dos canais, autoridade, despacho de jogadas,
timers, retries ou receptores de `request_state`. Uma resposta de recuperação
continua saindo mesmo que o conteúdo da partida seja idêntico. Agrupar pedidos
simultâneos e corrigir o despertar automático de salas ociosas ficam separados.

## Validação

Bancada: `scripts/teste-presenca-identica/`, dois EscProvider reais com contas,
canais e banco locais simulados; nenhuma sala real alterada.

- Antes: cinco eventos de presença idênticos → cinco envios de estado.
- Depois: os mesmos cinco eventos → zero envios de estado.
- Entradas, saídas, retorno, troca de UID na mesma cadeira, reordenação e duplas
  continuam provocando envio; ação legítima continua sincronizando.
- Dois pedidos explícitos de recuperação → duas respostas completas.
- Heartbeat continua ativo; crachá, cadeira e coroa continuam locais.
- Build completo (`npm run build`), regressão de reentrada/identidade, trava do
  canal, espectadores e sala ociosa passaram. Simulador com rádio em pedaços:
  16 cenários, uma semente por cenário, nenhuma falha (110 segundos).

Evidências: `/workspace/shared/presenca-identica-20261116/antes.json` e
`depois.json`. Comparação sobre a base de produção `9205fdf0`.

## Limites e entrega

Risco residual baixo: o filtro só aceita igualdade exata, mas testes locais não
garantem ausência de todo bug em redes reais. A economia mensal deste filtro
ainda não foi medida. Não anunciar redução percentual da fatura com base nos
cinco eventos sintéticos.

Correção preparada e testada em branch isolado (PR #500). Após a entrega dos
resultados, Diego autorizou publicar: “Ok siga p publicar”. A publicação usa o
fluxo normal da main, preservando as versões anteriores para quem já está
jogando. Não altera dados ou configuração do Supabase.
