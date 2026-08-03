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
- 🌐 **BILÍNGUE (BR/EN) OBRIGATÓRIO**: o basquete é internacional (NBA). TODO
  texto novo do BidLegends NASCE em PT **e** EN — usar `useT()` de
  `src/escalacao/lang.ts` (`const t = useT(); t('Português','English')`). Botão
  BR/EN fica no **canto direito do header** do BidLegends (`LangToggle`). Padrão:
  navegador PT → BR, senão EN; escolha manual grava no aparelho. ⚠️ Isto é SÓ do
  basquete — o FUTEBOL segue 100% em PT, não traduzir.
- 🔒 Enquanto está em construção, o basquete é **invisível pra todo mundo**: só
  aparece pra `diego.c.fonseca@gmail.com` logado (trava por conta em
  `src/escalacao/sport.ts`, `BASQUETE_TESTERS`). Não fundir na main sem OK visual.

## 🔄 Protocolo de memória compartilhada (OBRIGATÓRIO em toda sessão)
As sessões não se veem — o repo é a memória comum. Então TODA sessão deve:
1. **Ao começar**: `git pull` e ler `git log --oneline -15` (o que as outras
   sessões fizeram), + `docs/pendencias.md`. Se for trabalho de basquete, ler
   também `docs/conceito-basquete.md`.
2. **Ao terminar cada entrega**: atualizar `docs/pendencias.md` (riscar o que
   fez, adicionar o que ficou combinado e ainda não foi feito) e commitar
   junto. Pendência que só existe no chat SE PERDE — anotar sempre.
3. **Quando o Diego revelar um gosto/decisão novos**: gravar na hora na seção
   "Gostos do Diego" deste arquivo (ou no doc do assunto) e commitar.
4. Commits sempre descritivos em PT — eles são o diário que as outras sessões
   leem.

## 💛 Gostos do Diego (aprendidos na prática — respeitar)
- **Segurança acima de feature**: prefere bloquear com aviso claro a deixar
  acontecer algo estranho. Toda trava explica O PORQUÊ e O CAMINHO ("faltam 2
  meias — contrate no leilão ou traga da SAF").
- **Odeia spoiler**: tabela, giro, artilharia — NADA revela resultado antes da
  animação/apito na tela.
- **Nada pode atrasar o ritmo do jogo**: zoeira/interação nova entra nos tempos
  mortos, nunca adiciona passo nem espera extra (regra de ouro do leilão).
- **Zoeira é a alma do jogo**: textos com humor BR, emojis, provocação entre
  amigos (cantadas de blefe, chuva de dinheiro 💸, "QUASE!" no martelo com
  frases BEM variadas). Folclóricos > nomes reais em conteúdo inventado.
- **Fidelidade de tier é sagrada**: quem paga ouro vê ouro brilhante em TODO
  lugar; gratuito vê bege em todo lugar. Nenhuma cor emprestada, nunca.
- **UI nova = mockup primeiro**: ele quer VER (artifact/screenshot) e aprovar
  antes de codar. Textos de UI: simples, diretos, sem tecniquês.
- **Sempre quer saber se dá pra reverter** ("qualquer bug eu posso voltar
  atrás né?") — responder isso proativamente a cada entrega.
- Sons: martelo só pra QUEM ganha (ou vende) — nada de som genérico pra todos.
- **O desenho do estádio (StadiumSvg) é sagrado**: tem que ser a PRIMEIRA coisa
  visível ao abrir a área do clube ("via o estádio de cara, eu achava bonito").
  Qualquer coisa nova naquela área entra ABAIXO dele, nunca antes.
- Explicações embaixo do botão/do lugar exato, não parágrafos soltos.

## 🗣️ Como falar com o Diego
- PT-BR, direto, sem tecniquês; explicar o "porquê" em linguagem de jogo.
- Ele manda áudio transcrito com erros — interpretar com boa vontade e
  confirmar o entendimento quando for ambíguo.
- Sempre dizer o que foi feito, o que falta e como reverter se der ruim.
