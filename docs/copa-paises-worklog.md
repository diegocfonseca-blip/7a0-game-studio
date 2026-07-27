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

## 📏 REGRAS DAS CARTAS (Diego, 27/07 — valem pra TODA carta nova da Copa)
1. Carta pertence ao baralho de ONDE foi o auge (BR = clube brasileiro; EU =
   clube europeu). Mesma pessoa pode ter carta nos dois (Kaká SP 💎 + Kaká Milan 👑).
2. NÍVEL HONESTO POR CLUBE/ÉPOCA, nunca pela fama da carreira: Valderrama no
   Montpellier vale o que ele foi LÁ (craque, não lenda). Toda sugestão nova de
   carta precisa dizer clube + ano + nível honesto daquele contexto.
3. Na Copa pode ter VERSÕES repetidas do mesmo jogador no pool da seleção — o
   técnico escolhe QUAL versão convoca (mesma pessoa só 1× no XI).
- PENDENTE decidir (Diego): usar o baralho WORLD dormente como fonte extra da
  Copa (recomendado; ídolos prontos) ou linha dura só BR+EU (aí Valderrama vira
  carta EU/Montpellier e Blanco/Bochini etc. ficam de fora).

## ✅ PASSO 1 FEITO (27/07): país etiquetado nas 1032 cartas
- `src/escalacao/paises.ts` — mapa `PAIS` (nome → seleção), `paisDe(nome, baralho)`
  e `rankingSelecoes()`. Baralho BR sem etiqueta = Brasil por padrão; EU/MUNDO
  100% etiquetados. Exceções por baralho (`PAIS_POR_BARALHO`): Pepe (Santos=BR ·
  Real=Portugal) e Pedro (Fla=BR · Barça/Chelsea=Espanha).
- Regra aplicada: país = seleção que DEFENDEU (Deco/Liedson→Portugal, Diego
  Costa/Laporte→Espanha, Amauri→Itália, Zague→México).
- ⚠️ O arquivo ainda NÃO é importado pelo jogo — zero risco. Verificação:
  `scratchpad/checa-paises.mjs` + `paises-pos.mjs` (rodar após toda carta nova).

## 🌍 RANKING OFICIAL (27/07, decisão do Diego: nº de cartas = posição)
1 Brasil 510 · 2 Argentina 63 · 3 França 43 · 4 Espanha 41 · 5 Inglaterra 37 ·
6 Itália 31 · 7 Alemanha 30 · 8 Holanda 29 · 9 Portugal 27 · 10 México 23 ·
11 Colômbia 22 · 12 Uruguai 20 · 13 Chile 16 · 14 Bélgica 15 · 15 EUA 13 ·
16 Coreia do Sul 12 · (17 Paraguai 8, primeiro da fila)

## 🕳️ BURACOS pra fechar formação em dobro (2G·4L·4Z·6M·4A) — próximas cartas
- México 1 ZAG · Colômbia 1 LAT · Uruguai 1 LAT + 1 MEI · Chile 2 LAT + 2 MEI ·
- Bélgica 2 LAT + 1 ZAG + 2 ATA · EUA 1 LAT + 2 ZAG + 5 MEI ·
- Coreia 2 GOL (nem goleiro tem! Lee Woon-jae…) + 2 LAT + 1 ZAG + 3 MEI
- ≈ 29 cartas pra formação + chegar TODAS a 22 no total ≈ 36 cartas novas.
- Fluxo aprovado: botão dourado "🌍 DISPUTAR A COPA" na tela novo leilão/mesmo
  time a cada 10 temporadas + notícia-hype 1 temporada antes + trava "só campeões".

## Decisões já tomadas (ver docs/pendencias.md item Copa do Mundo)
- Leilão cego é dos PAÍSES; convocação dos 11 é grátis; prêmio = status
  (carta dourada + estrela mundial permanente); a cada 10 temporadas; só
  campeões participam. 16 seleções reais, 22+ jogadores cada.
