# 🏆 LIBERTADORES LEGENDS — conceito (conversado com o Diego 16/08)

> ⛔ **NÃO CODAR AINDA.** O Diego viu o mockup, gostou (*"gostei bastante"*), mas
> parou pra pensar no lado do negócio: *"não vamos fazer agora"*. Este doc existe
> pra a conversa não se perder — a próxima sessão começa daqui, não do zero.

Mockup: `scratchpad/liberta.png` (some quando a máquina é trocada; o HTML que o
gerou está descrito no fim deste doc).

---

## 1. O formato (fechado com o Diego)

- **32 clubes** · **8 grupos de 4** · passam 2 de cada → 16 no mata-mata.
- Mata-mata **ida e volta**, como a Copa do Brasil.
- Jogos simulados **AO VIVO, minuto a minuto** — não resultado pronto, não só
  tabela. Pedido explícito do Diego desde 05/08: os jogos que você NÃO está
  jogando também precisam ser bonitos de acompanhar.
- **Baralho só de quem jogou a Libertadores de verdade**, com clube e ano certos.
  ✅ Já auditado em 05/08 (7 cartas com claim errado foram corrigidas).

## 2. Como enche os 32 (regra do Diego, 16/08)

**É a mesma lógica da sala de leilão:** a tabela tem um tamanho fixo e o que
falta de gente vira bot.

> *"São, tem que ter vinte times. Mas se entrar dez pessoas usuários online,
> ficam dez online e só dez bots. Mesma coisa vai acontecer na Libertadores, mas
> só que são trinta e dois. Porém, o limite de usuários online que pode entrar é
> vinte também."*

Ou seja:
- **Teto de humanos: 20** (o mesmo `MAX_PLAYERS` de hoje — não muda).
- **A tabela da Liberta tem 32**: humanos + clubes do jogo completando.
- Sala com 10 pessoas → 10 humanos + 22 clubes do jogo.
- Sala cheia (20) → 20 humanos + 12 clubes do jogo.

## 3. Quem são os clubes que completam — RECOMENDAÇÃO (Diego ainda não decidiu)

O Diego levantou a dúvida: *"esses doze times seriam times o quê? Com nomes
parecidos com o nome da Libertadores, ou eu colocaria mais times do jogo, de
usuários que criaram?"*

**Contagem real dos clubes de BATISMO no baralho hoje (16/08):**

| Divisão | Clubes de batismo |
|---|---|
| Série D (a que aparece no rápido online) | **17** |
| Série C | 8 |
| Série A | 6 |
| Série B | 0 |

**Série A + C = 14 clubes de batismo** — e a Liberta precisa de **12** vagas
quando a sala está cheia.

**Recomendação desta sessão: usar os batismos de A/B/C. Não inventar nome e NÃO
vender vaga nova.**

Por quê — e aqui está o pulo do gato pro negócio do Diego:

Hoje o batismo de **Série D custa R$ 69,90** e o de **A/B/C custa R$ 59,90**. A
diferença existe porque a Série D é a que aparece no rápido online. **Quem pagou
59,90 praticamente nunca vê o clube dele** — pagou e o clube ficou na gaveta.
A Liberta conserta isso sem custo nenhum:

> **Série D · R$ 69,90** — seu clube aparece no jogo rápido online, o mais jogado.
> **Série A/B/C · R$ 59,90** — seu clube disputa a **Libertadores Legends**.

Cada faixa ganha o seu palco, e o cara passa a escolher por **gosto**, não por
preço.

**Por que NÃO vender 12 vagas "internacionais" agora:**
1. Seria vender lugar num modo que **ainda não existe** — se demorar ou for pouco
   jogado, o cara pagou por um clube que ninguém vê (o mesmo problema do 59,90 de
   hoje, só que dessa vez prometido por escrito).
2. **Enfraquece a Série D**, que hoje vale 10 reais a mais por ser a exclusiva.
3. **Não precisa**: já existem 14 clubes esperando palco. Vender vaga nova fica
   pra DEPOIS, quando der pra mostrar o clube do cara em campo.

## 4. O visual (mockup, aprovado de olho)

Reusa tudo que já foi feito e aprovado, sem arte nova:

- **Barra de baixo do placar na cor da competição** (`footTint` do
  `LiveScoreCard`) — a família fica: 🟢 Copa do Brasil · 🔵 Supercopa ·
  🟣 Copa dos 8 · **🌑 azul-noite = Liberta**.
- **Escudos nos dois lados** de cada confronto (já existe desde 05/08).
- **8 grupos numa tela só**: o SEU em destaque, os outros pequenininhos — pra não
  virar paredão de tabela.
- Chave do mata-mata **rolando pro lado**.

## 5. ⏳ O que falta o Diego decidir

1. **O NOME.** O mockup usa "Libertadores Legends" pra seguir a família (Copa do
   Brasil Legends, Copa do Mundo Legends, Supercopa Legends). **Mas
   *Libertadores* é marca registrada** — a casa já tem a regra de nunca usar nome
   de clube real, e isso pede o mesmo cuidado. Alternativas levantadas: "Copa
   Libertados", "Taça do Continente".
2. **A COR.** Azul-noite fica perto do azul da Supercopa. Alternativas: vermelho-
   terra, verde-escuro.
3. **Quem completa os 32** (§3 — recomendação acima, sem decisão dele).
4. **Onde mora**: rápido online (foi o que ele descreveu) ou também na carreira,
   como a Copa do Brasil.

---

## 6. 🥅 O MODO TEMÁTICO — o que o Diego quis dizer (20/08)

Correção de rota. Nesta data eu voltei ao assunto e desenhei a **competição**
(32 clubes, grupos, mata-mata). Não era isso. Palavras dele:

> *"Mas eu tava falando de modo temático. Igual na várzea.. Q lá são apenas
> jogadores da várzea... Na Libertadores só apenas jogadores q jogaram a
> libertadores no clube dele. Tipo neymar 2011 santos"*

Ou seja: **é um FILTRO DE BARALHO**, exatamente na forma da várzea. A várzea é
uma linha em `filterVarzea` (`store.tsx:32`): `c.fame <= 3 && !c.promessa`. A
Libertadores é a mesma forma — muda só o critério.

### A diferença que dá trabalho
A várzea lê um número **que já está na carta** (`fame`). A Libertadores precisa
de um **fato que o jogo não guarda em lugar nenhum**: aquele clube jogou a
Libertadores naquele ano? Hoje isso só existe em texto solto de bio. Então o
modo precisa de uma **lista clube+ano** escrita à mão — e vale a regra do Diego
(18/08): *onde eu não tiver certeza, a carta FICA DE FORA*. Libertadores menor e
certa é melhor que grande com jogador que nunca pisou lá.

### Tamanho MEDIDO do baralho (20/08, contado no `data.ts`)
Baralho BR inteiro: **595 cartas** — GOL 70 · LAT 74 · ZAG 80 · MEI 159 · ATA 212.
Referência da várzea (o modo que já funciona): **421** — GOL 52.

| Nível | Critério | Cartas | GOL | LAT | ZAG | MEI | ATA |
|---|---|---|---|---|---|---|---|
| **1 · Campeão** | o clube foi CAMPEÃO da Liberta naquele ano | **91** | 11 | 12 | 13 | 25 | 30 |
| **2 · Jogou** | o clube DISPUTOU a Liberta naquele ano | 91–560* | ? | ? | ? | ? | ? |

\* teto medido (clube que já jogou Liberta, ano ≥ 1960) = 560 cartas. O número
real depende da lista clube+ano; deve cair entre 250 e 350.

### ⚠️ A TRAVA que o nível 1 exige (medida, não achismo)
`buildDeck` (`store.tsx:1018`) pede `demand` = soma das vagas de todos os
técnicos. **GOL é 1 por técnico em toda formação** (`FORMATIONS`, `types.ts:176`).
Quando `demand > cartas reais`, o motor **completa com incógnito/perna-de-pau** —
justamente o que o Diego proíbe. Logo:
- **Nível 1 (11 goleiros) → sala de no máximo 11 técnicos.** Acima disso entra
  fake. Se for esse o nível escolhido, a sala precisa **travar em 11 com aviso
  claro** ("a Libertadores só tem 11 goleiros campeões — abra outra sala ou use
  o baralho completo"), nunca deixar o fake entrar calado.
- **Nível 2** provavelmente cabe nos 20 de hoje, mas **só depois de contar** a
  lista clube+ano de verdade.

### As 21 temporadas campeãs que o baralho já tem (nível 1)
Santos 1962 (5: Gilmar, Zito, **Pelé**, Coutinho, Pepe) · Cruzeiro 1976 (1) ·
Flamengo 1981 (5: Júnior, **Zico**, Adílio, Andrade, Nunes) · Grêmio 1983 (1) ·
São Paulo 1992 (1: Raí) · São Paulo 1993 (3: Zetti, Cafu, Leonardo) ·
Grêmio 1995 (0 cartas) · Cruzeiro 1997 (1) · Vasco 1998 (3) · Palmeiras 1999 (3) ·
São Paulo 2005 (7: Rogério Ceni…) · Internacional 2006 (6) · Internacional 2010 (3) ·
**Santos 2011 (6: Neymar, Ganso não, Aranha, Rafael Cabral, Pará, Edu Dracena, Borges)** ·
Corinthians 2012 (8: Cássio, Paulinho…) · Atlético-MG 2013 (5: Victor, Ronaldinho…) ·
Grêmio 2017 (4) · Flamengo 2019 (**13** — a maior) · Palmeiras 2021 (5) ·
Flamengo 2022 (4) · Fluminense 2023 (3) · Botafogo 2024 (4).
⚠️ **2025 ficou de fora de propósito**: não tenho certeza do campeão daquele ano
e a regra é não chutar. O Diego confirma e eu incluo.

### ⏳ O que falta o Diego decidir
1. **Nível 1 (só campeão, 91 cartas, sala até 11) ou nível 2 (jogou, sala de 20)?**
2. Segue valendo o resto do §5: nome (marca registrada), cor, e se mora só no
   rápido online ou também na carreira.

---

## 7. 🏆 A MISTURA (Libertadores + Champions) — números medidos 20/08

O Diego travou na decisão: *"N sei oq fazer pq são poucos jogos né… N sei se
misturamos libertadores C liga dos campeões… Mas aí Tb teriam mts times no jogo…
E demoraria MT"*. Duas coisas estavam emboladas, e vale deixar escrito:

> **Baralho temático ≠ formato de copa.** O filtro de cartas NÃO cria clube e NÃO
> alonga o jogo — a sala continua com 20 times e as mesmas rodadas, igual à
> várzea. O medo do "muitos times / demora muito" vem do FORMATO (§1-4), que é
> outro projeto e que o modo temático não precisa.

Folha da decisão: `scripts/mockup-campeoes.mjs`.

### Tamanho dos três baralhos (contado no `data.ts`)
| Categoria 🏆 Só campeões | Cartas | GOL | LAT | ZAG | MEI | ATA | Cabe até |
|---|---|---|---|---|---|---|---|
| 🇧🇷 Brasil → campeões da Libertadores | 91 | 11 | 12 | 13 | 25 | 30 | **6** |
| 🌍 Europa → campeões da Champions | 116 | 13 | 18 | 21 | 29 | 35 | **7** |
| 🌎 Todos → **a mistura** | **207** | 24 | 30 | 34 | 54 | 65 | **13** |

⚠️ **Correção de um número que eu tinha passado errado**: falei "sala até 11" pro
baralho só da Libertadores olhando só o goleiro. Está errado — **lateral e
zagueiro são 2 por técnico**, então o gargalo é 12 laterais ÷ 2 = **6 técnicos**.
"Cabe até" = `min(cartas[pos] ÷ vagas[pos])` em cima de `FORMATIONS`; o 4-4-2
aperta ainda mais o meio (4 MEI por técnico), e o número da tabela já é o pior
caso dos dois.

### O achado que destrava a decisão: as salas são PEQUENAS
`select count(*) from room_players group by room_id` — **465 salas na história**:
1 pessoa: 210 · 2: 132 · 3: 73 · 4: 28 · 5: 10 · 6: 8 · 7: 3 · **9: 1 (a maior)**.
Só **4 salas em 465** passaram de 6 pessoas. Ou seja: até o baralho MENOR (só
Libertadores, teto 6) atenderia 99% das salas — e a mistura (teto 13) atende 100%
com folga. **O "são poucos jogadores" era um problema muito menor do que parecia.**

### Desenho recomendado
A categoria vira **`Todos · 🥅 Várzea · 🏆 Só campeões`** e **segue o baralho que o
host escolheu** (BR = Libertadores · Europa = Champions · Todos = os dois). Assim
o Diego não precisa escolher um: os três existem de graça, com uma regra só.
Trava por tamanho de sala junto, com o porquê escrito.

---

## 8. ✅ FECHADO com o Diego (20/08): é o PACOTE inteiro

Palavras dele, encerrando a dúvida das seções 6 e 7:

> *"Primeiro q N seria só campeão... E segundo q seria categoria libertadores e
> partida N seria liga e nem copa. Seria libertadores Tb... Porém acho q seriam
> poucos jogos né"*

Ou seja, **as duas coisas juntas** (e não é só campeão):
1. **Categoria 🏆 Libertadores** = baralho só de quem **JOGOU** a Libertadores
   pelo clube daquele ano (não só campeão — campeão é um subconjunto).
2. **A partida também é a Libertadores**: grupos + mata-mata. Sem liga e sem
   copa, e o seletor "Depois da liga" some da tela.

### O "poucos jogos" — respondido com relógio (medido no código)
`SEASON_TOTAL_MS = 180_000` e `ROUND_MS = SEASON_TOTAL_MS/38` (`screens.tsx:3901`)
→ **1 rodada de liga = 4,7s**. `QUICK_COPA_LEG_MS = COPA_LEG_MS + 6000`
(`screens.tsx:3905`) → **1 jogo de mata-mata = 15s**: o motor JÁ dá 3× mais tempo
pro jogo que vale. Então, em tempo de TELA:

| | Jogos | Tempo de tela |
|---|---|---|
| Hoje · só liga | 38 | **3min00** |
| Hoje · liga + Copa dos 8 | 44 | **4min30** |
| Libertadores curta (grupos + mata-mata) | 13 | 2min39 |
| **Libertadores com pré-Liberta** | **19** | **4min09** |

**A Libertadores de 19 jogos empata com a temporada completa de hoje** — e todo
jogo dela vale alguma coisa, enquanto na liga a maioria das 38 rodadas é rotina.
"Poucos jogos" não vira "acaba rápido": vira "nenhum jogo à toa".

### E "muitos times" não custa nada
Os clubes-bot da tabela **não têm elenco** — só `atk`/`def` (`CLASSIC_CLUBS` em
`data.ts`, usados em `buildLeague`). Passar de 20 pra 32 clubes **não pesa e não
alonga**: o que dá tempo de tela é RODADA, não clube.

### ⏳ Próximo passo (o único bloqueio)
Escrever a **lista clube+ano de quem DISPUTOU a Libertadores**, com o nível de
certeza marcado linha a linha, e o Diego conferir. Onde nenhum dos dois tiver
certeza, a carta fica de fora (regra dele de 18/08). Sem essa lista o baralho não
existe. Tamanho esperado: entre 91 (só campeões, já contado) e 560 (teto medido).
