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

## ✅ RESULTADO da contagem (27/07 — 3 baralhos: BR + EU + WORLD dormente)
Meta por seleção: 22 = formação em dobro (2 GOL · 4 LAT · 4 ZAG · 6-8 MEI · 4-6 ATA).

### PRONTAS (4): Brasil · Argentina (~47!) · França (~41) · Espanha (~37)
### QUASE (1-4 cartas): Inglaterra (falta 1 LAT: Kyle Walker) · Itália (1 LAT: Cabrini) ·
### Alemanha (2 LAT: Brehme, Marzel/Schulz) · México (1-2 MEI/ZAG: Márquez já tem; Gio? → Torrado) ·
### Portugal (4: Rui Patrício GOL, Nélson Semedo+Guerreiro LAT, José Fonte ZAG) ·
### Holanda (4: Cillessen GOL, Krol+Blind LAT, Gullit já cobre MEI/ATA → +De Jong MEI)
### MÉDIAS (~8-12): Colômbia (James, Ospina, Yepes, Perea, S. Escobar, Rincón…) ·
### Bélgica (Alderweireld, Meunier, Witsel, Lukaku, Mertens…) · Uruguai (Muslera,
### Cáceres, Lugano, Recoba, Arévalo Ríos…) · EUA (já tem 8 no WORLD: Dempsey, Bradley…) ·
### Chile (Bravo, Isla, Medel, Valdivia, Salas…) · Coreia (já tem 5: Cha Bum-kun…)
### → 16 = as 4 prontas + 6 quase + 6 médias. ~60-70 cartas novas no total.
Listas completas por país × posição: gerar de novo com scratchpad/cartas.txt + eu-names.txt.

## Decisões já tomadas (ver docs/pendencias.md item Copa do Mundo)
- Leilão cego é dos PAÍSES; convocação dos 11 é grátis; prêmio = status
  (carta dourada + estrela mundial permanente); a cada 10 temporadas; só
  campeões participam. 16 seleções reais, 22+ jogadores cada.
