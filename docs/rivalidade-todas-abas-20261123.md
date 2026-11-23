# Retrospecto do próximo confronto em todas as abas

Pedido do Diego em 23/11: o cartão marrom com os números da rivalidade deve
permanecer no visual novo ao abrir Partida, Tabela e jogos, Estatísticas,
Elenco ou Rivalidades, tanto no celular quanto no desktop.

## Alteração

- O destino `next-rival` da transmissão deixa de ser ocultado fora de Partida.
  Cartão, confronto, estatísticas e estilo existentes foram reaproveitados.
- Removida a segunda cópia do próximo confronto dentro do conteúdo de
  Rivalidades, na liga e nos grupos continentais. Os detalhes dessa aba ficam
  abaixo do cartão comum.
- Nas copas independentes, o retrospecto sai do painel exclusivo de Partida e
  passa ao mesmo destino permanente da transmissão. Removida a cópia dentro
  da aba Rivalidades. A lateral do desktop mantém sua composição existente.
- Continua vazio quando não existe confronto conhecido. Adversário bot não
  ganha números ou cartão marrom de rivalidade inventados.

Nada de novos pedidos ao servidor, canais, cálculos de histórico, alteração de
calendário, resultados, relógio ou identidade. O visual anterior não muda.

## Verificação

731 verificações da interface das ligas, 38 específicas da copa pública e 271
de regressão das copas passaram, sem exceções JavaScript. Build TypeScript/Vite
e `git diff --check` também passaram.

Integrada a main `f4f2f15e`, preservando os detalhes extras apenas na aba
Rivalidades e a retirada da faixa do termômetro sob o placar. Após a integração,
build passou novamente, assim como 83 checagens focadas nas cinco abas em
cinema/2D, 390/1440 px, conta principal/pública, e 38 da copa pública.

Os testes conferem visibilidade e o mesmo elemento do cartão nas cinco abas,
ausência de cópia duplicada no conteúdo e transmissão mantida. Liga com próximo
adversário humano e bot em 390/1440 px; copa pública com rival humano e histórico
simulado, em bancada isolada sem acessar salas reais.

Evidências: `/workspace/shared/rivalidade-todas-abas-20261123/`.
Roteiros: `scripts/teste-football-full/verifica.mjs` e
`scripts/teste-copas-piloto/publicacao.mjs`.

Mudança isolada e reversível, sem migração de banco/saves. Acompanhar publicação
no GitHub Actions; confirmação em `publicacao.json` na pasta de evidências.
