# 🌍 Copa do Mundo Legends — trabalho em andamento (marcação de países)

## O pedido do Diego (27/07, fazer NESTA sessão)
1. Marcar o PAÍS de todas as cartas dos baralhos atuais (BR + EU; SEM "resto do
   mundo" — só seleções reais).
2. Lista exata de buracos por seleção (16 seleções × mínimo 22 jogadores,
   formação fechando: 1 GOL, 2 LAT, 2 ZAG, 3-4 MEI, 2-3 ATA — em dobro p/ 22).
3. Sugerir os FAMOSOS que faltam (bom ou ruim, mas famoso) pra completar cada
   seleção — com bio zoeira no padrão do data.ts.
4. MOSTRAR a lista pro Diego aprovar ANTES de commitar qualquer carta nova.

## Estado do trabalho
- [x] Extraídos 978 nomes+clube+ano pra `scratchpad/cartas.txt` (3 blocos de
  posições em data.ts: BR, EU e um TERCEIRO — investigar `CATALOG_WORLD`, pode
  ser um baralho mundial já existente que muda a conta).
- [ ] Investigar CATALOG_WORLD (o que é, quantas cartas).
- [ ] Classificar país por país (por conhecimento; clube/ano ajudam).
- [ ] Contar por seleção × posição → buracos pra 22 (formação em dobro).
- [ ] Sugestões de famosos pra completar 16 seleções.
- [ ] Aprovação do Diego → só depois entrar nos dados.

## Decisões já tomadas (ver docs/pendencias.md item Copa do Mundo)
- Leilão cego é dos PAÍSES; convocação dos 11 é grátis; prêmio = status
  (carta dourada + estrela mundial permanente); a cada 10 temporadas; só
  campeões participam. 16 seleções reais, 22+ jogadores cada.
