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
- **Baralho NBA — Lote 1 (`src/escalacao/data-basquete.ts`):** 54 cartas, 5 posições (PG/SG/SF/PF/C), bio bilíngue PT+EN, mistura de tiers + folclóricos (Jeremy Lin, JR Smith, Rodman, Mutombo, Boban…). Formato espelha o `data.ts` do futebol (motor pluga direto). Prévia: artifact "Prévia — Baralho NBA (Lote 1)".
  - **Falta (próximos lotes):** chegar em ~150-200 cartas (30-40 por posição) — hoje ~10-11 por posição. Ainda NÃO ligado a nenhuma tela do app (é só dados/fundação).
- **DNS do bidlegendsarena.com**: registrado na **Hostinger**, falta configurar. Host = GitHub Pages, que serve 1 domínio custom só (hoje leilaolegends.com via CNAME) → 2º domínio direto no Pages redireciona pro principal. Caminho limpo p/ dividir por hostname = Cloudflare grátis na frente (Fase 2+). Pra Fase 1 NÃO precisa do domínio: a trava é por conta, o Diego testa logado no leilaolegends.com.
