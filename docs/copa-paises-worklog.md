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
### MÉDIAS (corrigido 27/07 — o baralho BR tem MUITOS estrangeiros já contáveis):
### Colômbia falta ~5 (tem Higuita, Córdoba, Valderrama, James, Rincón, J.Arias,
###   R.Ríos, Cuadrado, Armero, Asprilla, Borja, Falcao, Aristizábal, Escobar →
###   faltam: 2 LAT [S.Arias, Mojica], 3 ZAG [Yepes, Perea, Mina]) ·
### Uruguai falta ~8 (tem Rochet, Lugano, Godín, Giménez, Piquerez, Arrascaeta,
###   Francescoli, Suárez, Cavani, Forlán, Loco Abreu → faltam Muslera, Cáceres,
###   M.Pereira, Coates, Recoba, Arévalo, Pérez…) ·
### Chile ~10 (tem Vidal, A.Sánchez, Zamorano, Caszely, Isla, Valdivia, Aránguiz) ·
### Bélgica ~10 (Courtois, Kompany, Vertonghen, KDB, Fellaini, Tielemans, Hazard) ·
### EUA ~6 (8 no WORLD + Howard EU) · Coreia ~10 (Son, Park, Hong, Choi, Lee, Honda é JAP) ·
### Paraguai ~10 candidata extra (Chilavert, Gatito, Gamarra, G.Gómez, J.Alonso, Arce, Cabañas)
### → 16 = 4 prontas + 6 quase + 6 médias ≈ **~50-55 cartas novas** no total.
### ⚠️ LIÇÃO: sempre varrer o baralho BR por estrangeiros antes de listar buracos.
Listas completas por país × posição: gerar de novo com scratchpad/cartas.txt + eu-names.txt.

## Decisões já tomadas (ver docs/pendencias.md item Copa do Mundo)
- Leilão cego é dos PAÍSES; convocação dos 11 é grátis; prêmio = status
  (carta dourada + estrela mundial permanente); a cada 10 temporadas; só
  campeões participam. 16 seleções reais, 22+ jogadores cada.
