# 🏀 BidLegends — conceito (basquete NBA no motor do Leilão Legends)

> Decidido com o Diego em 26/07/2026. Este doc é a fonte de verdade pra quando
> formos construir. O jogo de FUTEBOL não muda em NADA.

## Idioma (BR/EN) — decidido 26/07/2026
- O BidLegends é INTERNACIONAL (NBA). Tem **botão BR/EN no canto direito do
  header** — troca o idioma do BidLegends inteiro. TODO texto novo do basquete
  nasce nas DUAS línguas (helper `useT()` em `src/escalacao/lang.ts`).
- Padrão: navegador em PT abre em BR; senão, EN. A escolha manual fica gravada
  no aparelho.
- ⚠️ ~~Vale SÓ pro basquete. O futebol (Leilão Legends) continua 100% em PT.~~
  **REVOGADO em 11/09/2026 pelo Diego**: *"preciso q vc faça tradução do jogo p
  english de todo o jogo e tenha esse botão de traduzir, igual fizemos pro
  bidlegends"*. O FUTEBOL TAMBÉM É BILÍNGUE. A escolha de idioma é ÚNICA pro site
  (mesma chave `bl_lang`) e o botão BR/EN vive também no header da home do futebol.
  Todo texto novo, dos dois esportes, nasce em PT e EN. (NUNCA traduzir: nome de
  jogador, clube, mascote e país; texto que o código compara ou guarda no save —
  GOL/LAT/ZAG/MEI/ATA, letra de divisão, chave de formação; e nome de clube batizado.)

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
- 🏷️ **Regra do "conhecido" — RECONFIRMADA E ENDURECIDA PELO DIEGO (14/09/2026).** Palavras
  dele: *"pode encher mais, porém lembrando que TAMBÉM tem que ter jogador RUIM. Mas sempre
  FAMOSOS. Sendo bom ou ruim, teve polêmica ou fama ou qualquer coisa nesse tipo — igual
  Carlos Kaiser e Mauro Shampoo"*. Traduzindo pro basquete:
  - **O crivo é FAMA, não qualidade.** Entra quem o torcedor RECONHECE: craque, lenda,
    mico de draft, meme, encrenqueiro, personagem. Não entra jogador anônimo, por melhor
    que a estatística seja.
  - **Encher o baralho é encher os DOIS lados.** Cada lote novo tem que trazer 🪵 "foi
    profissional" e 🎯 "bom jogador" junto com os craques — senão o baralho vira só
    seleção de all-stars e perde a graça do pregão.
  - **As 5 categorias, nas palavras dele:** 🪵 foi profissional · 🎯 bom jogador ·
    💎 promessa · ⭐ craque · 👑 lenda.
  - 👑 **QUEM É LENDA — régua ampliada pelo Diego (14/09).** Palavras dele: *"o Luka
    Dončić, que está nos Lakers agora, é considerado uma lenda. O Jayson Tatum também. E
    aquele do Milwaukee, moreno, forte [Giannis] — esses jogadores top famosos também são
    considerados lenda"*. Ou seja: **lenda NÃO é só o veterano aposentado**; o astro de
    HOJE que todo mundo conhece também é. Pra isso não virar gosto de quem está mexendo
    no baralho, o critério ficou **factual**:
    > 👑 LENDA = ganhou **MVP da temporada** ou **MVP das finais**, OU é um nome de topo
    > absoluto que o Diego apontar.
    Aplicando isso o baralho saiu de 30 pra **51 lendas** (e é justamente o que faltava:
    bate com os ~12% do futebol). Subiram Luka e Tatum (apontados por ele) e os MVPs que
    estavam como craque — Barkley, Karl Malone, Garnett, Iverson, Nash, Derrick Rose,
    David Robinson, Harden, Westbrook, Embiid, Shai, Walton, Cowens, Unseld, McAdoo e
    Willis Reed — mais Ewing, Pippen e Kawhi (MVP das finais / topo absoluto).
    ⚠️ Eu tinha escrito aqui que "lenda não cresce". **Estava errado, e a régua dele é que
    está certa**: o que não pode é INVENTAR lenda; ampliar com quem tem título de MVP na
    mão é fato, não invenção.
  - 🌍 **DE FORA DOS EUA CONTA, desde que tenha jogado NBA (reforçado 14/09).** Palavras
    dele: *"jogadores que vieram da Europa… mas jogaram NBA também, de alguma forma
    jogaram NBA"*. Vale o craque europeu que virou astro aqui (Dončić, Jokić, Dirk,
    Giannis, Porziņģis) e também o **rei da Europa que passou de raspão pela NBA** —
    Jasikevičius, Teodosić, Navarro, Micić. Esses últimos são ótimos como 🎯/🪵: são
    famosos de verdade, mas o auge deles não foi aqui. Continua valendo a trava de 26/07:
    quem NUNCA vestiu uma franquia NBA fica de fora (Oscar Schmidt segue fora).
  - ⚠️ **E vale a regra de ouro do Diego (18/08): não inventar como a pessoa REAL é.** Bio
    de gente de verdade só com fato público e conhecido (posição de draft, apelido, lance
    famoso, título). Nada de zoeira em cima de doença, vício, tragédia ou crime — a piada é
    com o BASQUETE, nunca com a desgraça de ninguém. Sem referência? Não faz a carta.
  - Herança da regra antiga: craque, ruim ou zuado (busts, memes) valem igual. **Apelido no NOME da carta só pra quem é REALMENTE chamado pelo apelido** (ex.: Swaggy P, White Chocolate, AK-47, Big Shot Bob, The Iceman, Dr. J, Agent Zero, The Glove). Os demais: nome normal, apelido/graça mora na BIO. (Referência do futebol: Romarinho, Adriano Gol Contra.)
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
- **NBA Cup** = a Copa Legends do basquete (torneio no meio da temporada).

### 🏆 NBA CUP — regra fechada (14/09/2026, na construção)
O conceito só dizia "torneio no meio da temporada; detalhar na construção". Detalhado
assim, e o porquê de cada escolha:

- **QUANDO**: no MEIO da temporada, na parada que o jogo JÁ tem (a virada de metade de
  temporada). Regra de ouro do Diego: *"nada pode atrasar o ritmo do jogo"* — a Cup
  entra num tempo morto que já existe, **não cria passo nem espera nova**.
- **QUEM**: **8 times** — os **4 primeiros de cada conferência** na tabela daquele
  momento. É o retrato de meia temporada, igual à Cup de verdade premiar quem começou
  bem. Liga sem conferência fechada cai no top 8 geral.
- **FORMATO**: **mata-mata de JOGO ÚNICO** — quartas → semis → final. De propósito
  DIFERENTE dos playoffs (que são melhor de 3): copa é relâmpago, e assim ninguém
  confunde as duas competições. Empatou? **Prorrogação**, nunca pênalti.
- **NÃO MEXE NA TABELA**: os jogos da Cup não entram no V-D da temporada regular nem na
  lista de cestinhas da liga (a Cup tem a dela). Na NBA de verdade a final também não
  conta. Isso mantém a temporada honesta: ninguém sobe na tabela por causa da copa.
- **PRÊMIO**: carta pro álbum + moedas, do mesmo jeito que a Copa dos 8 do futebol paga
  o campeão dela. Quem ganha a Cup e depois o anel leva as duas.
- **ONDE MORA NO CÓDIGO**: campo PRÓPRIO no estado (`nbaCup`), **nunca** o `quickCopa`.
  Motivo de segurança: `quickCopa` é o slot ÚNICO do mata-mata de fim de temporada (Copa
  dos 8, Libertadores e os playoffs). Se a Cup ocupasse esse slot no meio da temporada e
  sobrasse qualquer coisa lá, **os playoffs não seriam semeados** no fim (o código só
  semeia se o slot estiver vazio) — a temporada acabaria sem anel. Slot separado = zero
  risco pro futebol e zero risco pros playoffs.

## Táticas (pedra-papel-tesoura igual ao futebol)
- 🛡️ Defesa ferrenha · ⚖️ Equilíbrio · 🏃 Run-and-gun (mesma lógica retranca/equilíbrio/ataque).
- Placar por pontos (ex.: 112×98), cestinha em vez de artilheiro, "saldo de cestas" no lugar do SG.

## Ordem de construção sugerida
1. Fundação: modo basquete no repo (switch por hostname + home com os 2 esportes) + tipos/posições.
2. Baralho NBA (dados + bios) — dá pra ir em lotes.
3. Street League (reusa o motor de 20 do rápido/carreira).
4. Conferências + playoffs + finals (G League e NBA usam o mesmo bloco).
5. Economia/carreira completa + online.
