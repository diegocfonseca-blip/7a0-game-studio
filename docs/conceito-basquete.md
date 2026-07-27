# 🏀 BidLegends — conceito (basquete NBA no motor do Leilão Legends)

> Decidido com o Diego em 26/07/2026. Este doc é a fonte de verdade pra quando
> formos construir. O jogo de FUTEBOL não muda em NADA.

## Idioma (BR/EN) — decidido 26/07/2026
- O BidLegends é INTERNACIONAL (NBA). Tem **botão BR/EN no canto direito do
  header** — troca o idioma do BidLegends inteiro. TODO texto novo do basquete
  nasce nas DUAS línguas (helper `useT()` em `src/escalacao/lang.ts`).
- Padrão: navegador em PT abre em BR; senão, EN. A escolha manual fica gravada
  no aparelho.
- ⚠️ Vale SÓ pro basquete. O futebol (Leilão Legends) continua 100% em PT.

## Domínio / hospedagem
- Domínio REGISTRADO (26/07/2026): **bidlegendsarena.com** — aponta pro MESMO site/deploy do leilaolegends.com.
- Marca visível: **BidLegends** (o "arena" mora só no endereço).
- O app olha o hostname: `bidlegendsarena.com` → abre no modo basquete; `leilaolegends.com` → futebol.
- Home tem o seletor dos dois esportes (mockup já feito: abas ⚽ Futebol · 🏀 Basquete).
- Mesma conta/login/álbum (Supabase atual). Um repo só.

## Posições e elenco
- **5 posições** (mapeiam 1:1 nos 5 setores do motor): PG armador · SG ala-armador · SF ala · PF ala-pivô · C pivô.
- **Quinteto titular = 5** (o "XI"): 1 por posição, ESCOLHIDO pelo jogador entre os que ele arrematou.
- **Elenco completo = 15 (3 por posição)** — limite real da NBA; 82 jogos pedem banco fundo.
  (Futebol usa 2×=22; basquete usa 3×=15.)
- 🗳️ **Quantas vagas por posição (decidido 27/07) — cada posição usa a regra de um slot que o motor JÁ tem:**
  - **Modo RÁPIDO (offline + online): 1 por posição → 5** (o quinteto titular).
    Cada posição se comporta como o **goleiro** do futebol (1 vaga). Você leiloa
    o time que entra em quadra — igual o rápido do futebol leiloa o XI.
  - **Modo CARREIRA: 2 por posição → 10** (a "rotação"). Cada posição se comporta
    como o **lateral** (2 vagas). Depois, o **leilão de RESERVAS** (parada da
    rodada 41) põe +1 por posição → **3 por posição = elenco 15**.
  - Espelho do futebol: rápido = o time em campo (11 ⚽ / 5 🏀); carreira cresce
    até o elenco cheio (22 ⚽ / 15 🏀). No código: `NBA_SLOTS_PER_POS` em `sportcfg.ts`.
- Pisos de venda/empréstimo/listar: nunca deixar a posição abaixo do quinteto (regra igual à do futebol).
- Pisos de venda/empréstimo/listar: nunca deixar a posição abaixo do quinteto (regra igual à do futebol).

## Cartas
- Mesmas categorias: 👑 lenda · ⭐ craque · 💎 promessa · 🎯 bom jogador · 🪵 foi profissional, com 🃏 folclórico MISTURADO (vibe, não categoria).
- Carta = nome · franquia · ano do auge (Jordan · Bulls 1996 👑; Wade · Heat 2006 ⭐) + bio zoeira em PT.
- Baralho inicial ~150-200 cartas (30-40 por posição). Folclóricos: JR Smith 2018, JaVale, Boban, Nick Young…
- Nível = auge NAQUELE ano/franquia (igual à regra do futebol: Kaká 2003 promessa vs 2007 lenda).
- 🇺🇸 **SÓ QUEM JOGOU NA NBA (decisão do Diego).** O baralho é NBA de verdade (franquias reais). Quem nunca vestiu uma franquia NBA NÃO entra — ex.: Oscar Schmidt (recusou o draft) ficou de fora. Brasileiros valem SE jogaram NBA (Nenê, Leandrinho, Varejão, Splitter, Bruno Caboclo, Marcelinho Huertas). Lendas FIBA/mundiais (Oscar, Dražen, Sabonis…) só num baralho À PARTE, se um dia o Diego quiser.
- 🏷️ **Regra do "conhecido":** o jogador só precisa ser CONHECIDO — craque, ruim ou zuado (busts, memes) valem igual. **Apelido no NOME da carta só pra quem é REALMENTE chamado pelo apelido** (ex.: Swaggy P, White Chocolate, AK-47, Big Shot Bob, The Iceman, Dr. J, Agent Zero, The Glove). Os demais: nome normal, apelido/graça mora na BIO. (Referência do futebol: Romarinho, Adriano Gol Contra.)
- Baralho do BidLegends em `src/escalacao/data-basquete.ts` (bio já bilíngue PT+EN). Prévia gerável pelo script `scratchpad/gen-deck-preview.mjs`.

## A pirâmide (modo carreira)
1. **🛝 STREET LEAGUE** — 20 times, pontos corridos ida e volta (motor atual como está), **sobem 4**, ninguém desce (base).
2. **🔷 G LEAGUE** — 30 times, Leste (15) × Oeste (15). Sobem 4 · descem 4 (2 por conferência).
3. **💍 NBA** — 30 times, Leste × Oeste. Descem 4 (2 por conferência). Topo da pirâmide.
   (G League real também é Leste×Oeste — a estrutura espelha a vida real.)

> 🔧 **Ordem de construção (confirmada pelo Diego 27/07):** a **Street League usa o
> MOTOR DO FUTEBOL como está** — pontos corridos, 20 times, sobem 4/ninguém cai —
> que é justamente a temporada que JÁ roda no rápido offline do basquete. Só a
> Street League é "parecida com o futebol". **G League e NBA têm regras PRÓPRIAS**
> (conferências Leste×Oeste, 82 jogos, playoffs top-8, finais → Finals) — bloco à
> parte, construído depois. Então a carreira começa reusando a Street League.

## Formato da temporada (G League e NBA — mesmo motor)
- **82 jogos** (calendário real: ~52 na conferência + 30 contra o outro lado; só a tabela da SUA conferência classifica).
- **Parada na rodada 41**: votação MESMO TIME × NOVO LEILÃO (o "vira-temporada" do futebol; tematicamente é a trade deadline).
- Sem empate (prorrogação) → tabela por **V-D e % de aproveitamento** (ex.: .780); desempate: confronto direto → saldo de cestas.
- **Top 8 de cada conferência** vai aos playoffs DIRETO (sem play-in). Chaveamento 1×8 · 2×7 · 3×6 · 4×5.
- Playoffs: séries comprimidas (melhor-de-3 simulada ou agregado estilizado — decidir na construção).
- **Final do Leste e Final do Oeste** → vencedores se cruzam nas **FINALS** (anel 💍).

## Subida / queda / cartas de campeão
- **SOBE quem chega à final de conferência** (2 do Leste + 2 do Oeste = 4). Subida se conquista no mata-mata; a temporada regular é o ingresso (top 8) e o chaveamento.
- **DESCE** os 2 piores de cada conferência na temporada regular (4 no total).
- **Cartas**: campeão do Leste 🎴 · campeão do Oeste 🎴 · campeão das FINALS 🎴 (o campeão do anel leva 2, como liga+copa no futebol).
- **NBA Cup** = a Copa Legends do basquete (torneio no meio da temporada; detalhar na construção).

## Táticas (pedra-papel-tesoura igual ao futebol)
- 🛡️ Defesa ferrenha · ⚖️ Equilíbrio · 🏃 Run-and-gun (mesma lógica retranca/equilíbrio/ataque).
- Placar por pontos (ex.: 112×98), cestinha em vez de artilheiro, "saldo de cestas" no lugar do SG.

## Ordem de construção sugerida
1. Fundação: modo basquete no repo (switch por hostname + home com os 2 esportes) + tipos/posições.
2. Baralho NBA (dados + bios) — dá pra ir em lotes.
3. Street League (reusa o motor de 20 do rápido/carreira).
4. Conferências + playoffs + finals (G League e NBA usam o mesmo bloco).
5. Economia/carreira completa + online.
