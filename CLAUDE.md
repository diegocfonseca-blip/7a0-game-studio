# Leilão Legends (⚽ leilaolegends.com) + BidLegends (🏀 bidlegendsarena.com)

Jogo de leilão às cegas de lendas do futebol, em produção com jogadores REAIS
(deploy automático: push na main → site ao vivo em ~2 min). O basquete
(BidLegends) vai morar NESTE mesmo repo/site. Dono: Diego (fala PT-BR,
responde melhor a explicações simples, sem jargão).

## ⚠️ Regras de trabalho (o Diego exige isso)
1. **Nunca quebrar o futebol.** Ele está AO VIVO. Mudança arriscada = commit
   isolado e revertível. Na dúvida, perguntar antes.
2. **Mostrar screenshot/mockup e esperar OK do Diego ANTES de commitar
   qualquer coisa VISUAL nova.** Ele decide o visual.
3. **Segurança contra estados quebrados é prioridade #1 do Diego**: nada de
   jogador fake ("perna-de-pau") entrando em elenco por regra nova; travas
   sempre com aviso claro do porquê e do caminho pra destravar.
4. Commits com mensagem descritiva em PT; sem model ID em commits/PRs.
5. Online é **host-autoritativo** (guest roteia ações pro host). Identidade
   (youIdx) é LOCAL — nunca sincronizar. Cuidado extremo com índices de
   assento (histórico de bugs: "virei bot", "dei lance por outro").

## 🎨 Identidade visual (OBRIGATÓRIA — não inventar arte nova)
- Fundo creme `#F4ECD6` · tinta `#0C0C0C` · dourado `#FFC400` · verde `#1B7A3D`
  · vermelho `#C2452F` / `#E8503A` · roxo `#7C3AED`.
- Bordas pretas grossas (3-4px), cantos arredondados grandes, **sombras duras
  deslocadas** (`3px 3px 0 #000` / `4px 4px 0 #000`).
- Fonte display: **Oswald** condensada, pesos 800-900, uppercase em títulos.
- Componentes prontos em `src/escalacao/screens.tsx`: `Box`, `Btn`,
  `CollectibleCard`, `Shell` — REUSAR, não recriar.
- Tiers de apoio (cores por usuário): `src/escalacao/apoio.tsx`
  (`APOIO_PERKS`: bege grátis · verde · roxo 💎 · prata ⭐ · ouro 👑, cada um
  com degradê `grad` + brilho `holo`). REGRA: cada usuário leva a cor do
  PRÓPRIO tier pra todo canto; gratuito = bege; NUNCA dourado fixo pra todos.
- Cartas do basquete = MESMO visual das cartas do futebol (só muda o conteúdo).

## 📁 Mapa do código
- `src/escalacao/` — o jogo todo: `store.tsx` (estado/reducer/online),
  `screens.tsx` (leilão/home/jogo rápido), `pyramidseason.tsx` (carreira
  pirâmide), `lobby.tsx` (salas online), `data.ts` (baralhos BR/EU + bios),
  `apoio.tsx` (tiers), `dinastia.tsx`, `estadio.tsx` (SAF/estádio).
- Backend: Supabase (auth, game_rooms, room_players, user_colors, user_cards).
- Build: `npm run build` (Vite + tsc). SEMPRE buildar antes de commitar.

## 🏀 BidLegends (basquete)
- Conceito COMPLETO e decidido: **`docs/conceito-basquete.md`** (ler antes de
  qualquer trabalho de basquete). Pendências combinadas: **`docs/pendencias.md`**.
- Mesmo site, dois domínios: hostname `bidlegendsarena.com` → modo basquete;
  `leilaolegends.com` → futebol. Marca visível: "BidLegends".
- Home com seletor ⚽/🏀 no topo (mockup aprovado pelo Diego); o resto da cara
  é IDÊNTICO ao jogo atual (creme/bordas/Oswald) — só troca o conteúdo.

## 🗣️ Como falar com o Diego
- PT-BR, direto, sem tecniquês; explicar o "porquê" em linguagem de jogo.
- Ele manda áudio transcrito com erros — interpretar com boa vontade e
  confirmar o entendimento quando for ambíguo.
- Sempre dizer o que foi feito, o que falta e como reverter se der ruim.
