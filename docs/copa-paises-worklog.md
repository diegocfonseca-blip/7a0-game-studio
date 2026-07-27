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

## ✅ CORREÇÃO DE ESCOPO (Diego, 27/07 — vale sobre tudo acima)
- **NÃO tem meta de 22, nem meta por categoria, nem "36/100 cartas".** A
  convocação usa o baralho COMO ESTÁ: todo jogador já etiquetado com o país
  aparece no listão da seleção (qualquer nível). Cartas novas só se o Diego
  pedir — o baralho cresce no ritmo normal do jogo e a Copa acompanha sozinha.
- Única exigência: a seleção precisa FECHAR UM 11 em alguma formação
  (senão quebra — regra nº1). Estado de hoje: só 2 travadas →
  **Coreia (0 goleiros)** e **EUA (1 meia só)**. Bélgica fecha só no 4-4-2
  (a trava de formação resolve). PROPOSTA enviada pro Diego (aguardando OK):
  3 cartas — Lee Woon-jae (GOL·Coreia), Michael Bradley + Kyle Beckerman (MEI·EUA).
- Fluxo aprovado: botão dourado "🌍 DISPUTAR A COPA" na tela novo leilão/mesmo
  time a cada 10 temporadas + notícia-hype 1 temporada antes + trava "só campeões".

## 📣 CONVOCAÇÃO (Diego, 27/07 — MUDANÇA de conceito, decisão firme)
- Dentro da seleção **NÃO tem leilão nenhum**: é CONVOCAÇÃO pura.
- Aparecem TODOS os jogadores do país e o técnico escolhe **SÓ 11 titulares**
  (não 22, sem banco, sem moedas).
- Jogador com versões repetidas (Kaká SP/Milan): convocou uma, a outra apaga
  (1 pessoa por time). Formação 4-3-3/4-4-2, a mesma da carreira.
- Botão de fechar só libera com 11/11; trancado explica o que falta (estilo Diego).
- Mockup aguardando OK: artifact a73c7ec1 (busca + abas por posição + campinho
  enchendo + 2 estados do botão).

## 🏆 FORMATO DO TORNEIO (Diego, 27/07 — decisão firme)
- **Grupos**: 4 grupos de 4, todos contra todos em IDA E VOLTA (6 jogos por
  seleção). Classificam os 2 primeiros. Desempate: nº de VITÓRIAS, depois
  SALDO DE GOLS.
- **Mata-mata**: os 8 classificados entram em SORTEIO ALEATÓRIO (estilo Copa
  real — pontos da fase de grupos não valem mais). 16→8 = começa nas QUARTAS
  (4 confrontos) → semi → final. Quartas e semi em IDA E VOLTA; FINAL ÚNICA.
- **Bots/CPU**: cada seleção rival convoca automaticamente os MELHORES 11 dela
  (pelo nível interno das cartas; a UI não mostra categoria, mas o motor usa).
- **Formação do usuário**: escolhe 4-3-3 ou 4-4-2, MAS só se o país fecha o
  esquema com jogadores reais; senão o esquema indisponível aparece TRANCADO
  com aviso ("a Coreia não tem meias pra 4-4-2 — jogue no 4-3-3").
- ✅ Mockup da CONVOCAÇÃO **APROVADO pelo Diego** (campinho = cópia FIEL do
  Field do pregão com o logo OFICIAL da Vadico; SEM categorias — só
  nome+clube+ano —, listão A-Z rolável por posição + busca, contador 11/11,
  botão trancado explicando o que falta).
- 📜 **Regra do listão (Diego, 27/07)**: aparecem TODAS as cartas do país, de
  TODOS os níveis (lenda, craque E perna-de-pau, tudo junto) — vale pra todas
  as seleções. Nenhuma indicação de categoria na tela: convocar mal é risco do
  técnico (a zoeira é essa). Bots continuam convocando os melhores 11 por dentro.

## 🎯 REGRA DA ESCOLHA DE SELEÇÃO (Diego, 27/07 — decisão firme)
- Os 16 participantes entram RANQUEADOS (posição 1-16 na classificação pra Copa).
- **Quem ficou em N só pode escolher seleção da posição N pra BAIXO no ranking
  de seleções** (1º escolhe qualquer uma; 7º escolhe da 7ª à 16ª). O Brasil (1º)
  é PRÊMIO de quem fez a melhor campanha.
- **Só usuário REAL escolhe.** Bot não escolhe: recebe automático.
- Detalhes propostos (aguardando confirmação do Diego): escolha em ordem de
  ranking (1º primeiro → nunca há conflito, escolhe entre as LIVRES ≤ seu nº);
  bots recebem depois dos humanos a melhor seleção livre ≤ posição deles;
  seleção acima do teu número aparece TRANCADA com aviso ("🔒 Só pra quem
  chegou em 4º ou melhor — faça campanha melhor na próxima!").

## Decisões já tomadas (ver docs/pendencias.md item Copa do Mundo)
- Leilão cego é dos PAÍSES; convocação dos 11 é grátis; prêmio = status
  (carta dourada + estrela mundial permanente); a cada 10 temporadas; só
  campeões participam. 16 seleções reais, 22+ jogadores cada.
