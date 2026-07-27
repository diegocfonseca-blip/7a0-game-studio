# 📌 Pendências combinadas com o Diego (atualizado 26/07/2026)

## ⚽ Leilão Legends
1. **Painel "PRÓXIMO" do modo rápido (online + offline) — APROVADO em mockup, falta implementar:**
   - Botões de tática ~40% menores (pílulas de uma linha; a escolhida ganha ✓).
   - Micro-legenda EMBAIXO de cada botão: retranca "segura o ataque" · equilíbrio "fura a retranca" · ataque "atropela o equilíbrio".
   - REMOVER a linha "⏱️ Temporada rolando sozinha — sente e assista".
   - NOVO: scout do adversário (posição · pontos · últimos 5 jogos V/E/D).
   - NOVO: chip 🔥 CLÁSSICO com retrospecto do confronto quando o próximo rival é humano.
   - Barrinha de progresso continua (fina, embaixo).
   - Mockup de referência: artifact "Mockup — Painel PRÓXIMO (rápido)" (sessão de 26/07).
2. (Opcional, oferecido) Brilho ANIMADO (sheen) na faixa do tier nas tabelas — hoje é só o degradê parado.
3. (Opcional, oferecido) CPU/rivais escolherem a própria formação (4-3-3/4-4-2) na carreira — hoje só humano troca.

## 🏀 BidLegends
- Conceito completo: `docs/conceito-basquete.md` (pirâmide, 82 jogos, conferências, elenco 15, domínio bidlegendsarena.com).
- **Fase 1 — ✅ NO AR (fundida na main 26/07, aprovada pelo Diego):**
  - `src/escalacao/sport.ts` — detecção de esporte (hostname + override `?sport=` de teste) e **trava por conta**: basquete SÓ aparece pra `diego.c.fonseca@gmail.com` (regra do Diego 26/07: nada de basquete visível pra ninguém ainda). Pra todo o resto o app é idêntico ao futebol de hoje.
  - Seletor ⚽/🏀 no topo da home (só pro Diego) + home do BidLegends "chegando" (mesma cara, conteúdo de basquete) em `screens.tsx` (`SportTabs`, `BidLegendsHome`). Título da aba vira "BidLegends" só pra ele.
  - 🌐 **Bilíngue BR/EN**: `src/escalacao/lang.ts` (`useT()`) + botão `LangToggle` no canto direito do header do BidLegends. TODO texto novo do basquete daqui pra frente NASCE em PT+EN. Futebol NÃO se traduz.
- **Baralho NBA — ✅ FECHADO em 162 cartas (`src/escalacao/data-basquete.ts`):** 5 posições (PG/SG/SF/PF/C), ~32 por posição, bio bilíngue PT+EN. Mistura de tiers + folclóricos/busts/brasileiros. Regras: SÓ quem jogou NBA; apelido no nome só nos marcantes. Formato espelha o `data.ts` do futebol (motor pluga direto). Prévia gerável por `scratchpad/gen-deck-preview.mjs`.
  - Ainda NÃO ligado a nenhuma tela do app (é só dados/fundação). Dá pra ir engordando por posição depois se quiser (meta era 30-40/posição, batida).
  - **Próximo passo real:** leilão do basquete REUSANDO O MESMO MOTOR do futebol.
- **🚨 DIREÇÃO (decisão firme do Diego 27/07): basquete = MESMO MOTOR do futebol, IDÊNTICO.** Nada de módulo/tela separada. Mesmas telas, botões, cores, fluxo (envelope→lacrar→martelo→cerimônia→temporada). Quem sai do futebol tem que entender o basquete NA HORA. Só muda o CONTEÚDO: cartas NBA, rótulo das posições (armador no lugar de goleiro), cesta no lugar de gol. Futebol fica EXATAMENTE igual (mesmo código, valores do futebol intactos; testar antes/depois; commit isolado revertível).
  - ✅ Baralho no formato do motor: `basquete-deck.ts` (`buildNbaDeck`/`buildNbaCatalog`), mapeando PG→GOL·SG→LAT·SF→ZAG·PF→MEI·C→ATA. `sportcfg.ts` = rótulos por esporte + vagas por modo.
  - ✅ **Motor sport-aware** (`store.tsx`, guardado por `ACTIVE_SPORT`, futebol byte-idêntico): `setActiveSport`, `slotsOf`/`makeBotSquad` via `baseSlots`, ação `START_NBA` (jogo rápido = 1 vaga/posição = quinteto 5, rivais = franquias NBA), `EscState.sport`.
  - ✅ **Pregão do basquete JOGÁVEL** (mesmo motor/telas do futebol): botão "Partida Rápida" na home do BidLegends → pregão cego → martelo → cerimônia. Rótulos PG/SG/SF/PF/C (`posTag`/`secLabel`), sem campinho de futebol, sem formação.
  - ✅ **QUADRA** (`NbaCourt`, aprovada pelo Diego: madeira, garrafão laranja, logo BidLegends no centro) no lugar do campinho — só no basquete, anti-spoiler reusado.
  - ✅ **Bilíngue**: textos do pregão em PT+EN (helper `L` no Envelope/RivalsStrip; futebol sempre PT).
  - ✅ **Fim coerente**: cerimônia do basquete → "Quinteto fechado! Temporada chegando" → home (NÃO cai na temporada de futebol).
  - **FALTA:** (a) modo CARREIRA do basquete (2/posição=10 → escolher quinteto → reservas +5 → 15); (b) **TEMPORADA de verdade** (jogos por pontos, tabela, playoffs — o bloco grande); (c) i18n dos textos do MARTELO/cerimônia (o pregão já está); (d) online.
- **DNS do bidlegendsarena.com**: registrado na **Hostinger**, falta configurar. Host = GitHub Pages, que serve 1 domínio custom só (hoje leilaolegends.com via CNAME) → 2º domínio direto no Pages redireciona pro principal. Caminho limpo p/ dividir por hostname = Cloudflare grátis na frente (Fase 2+). Pra Fase 1 NÃO precisa do domínio: a trava é por conta, o Diego testa logado no leilaolegends.com.
