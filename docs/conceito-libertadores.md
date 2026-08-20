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

---

## 9. 🛣️ LIGA-PRIMEIRO × LIBERTADORES-DIRETO (dúvida do Diego, 20/08)

> *"Tô na dúvida se faço jogando liga normal e dps os 8 melhores jogam a
> libertadores e sendo baralho temático ou começa direto libertadores"*

Folha: `scripts/mockup-libertadores-caminho.mjs`.

| | Caminho A · liga primeiro | Caminho B · direto |
|---|---|---|
| Jogos | 38 liga + 6 mata-mata = **44** | 6 pré + 6 grupos + 7 mata = **19** |
| Tempo de tela | **4min30** | 4min09 |
| Motor | **já existe** | novo |
| Títulos por sala | 2 (liga + Liberta) | 1 |

**O achado que decide: o caminho A já está construído.** A Copa dos 8 do rápido
(`seedQuickCopa`, store.tsx:2232 + `resolveQuickCopaTie`) É literalmente "os 8
melhores da liga jogam mata-mata de ida e volta, com pênalti no empate". Pra
virar Libertadores falta só (1) o filtro do baralho e (2) trocar nome/cor quando
a categoria for Libertadores. Nada de motor novo.

O caminho B precisa de: sorteio de grupos por potes · 8 tabelas simultâneas ·
classificação de grupo · chave de 16 (hoje o mata-mata só sabe começar com 8) ·
os 32 clubes · tela dos grupos.

**Recomendação: A agora, B depois.** A lista de quem jogou a Libertadores — que é
o trabalho grande — **serve pros dois**, então nada se perde. E o A dá pro Diego
JOGAR a coisa e sentir se é isso, gastando pouco.

---

## 10. ✅ DECIDIDO (20/08): os DOIS caminhos, com trava de exclusão

> *"Poderíamos fazer os dois né temático ao lado da várzea e a liga… Aí o cara
> decide se joga direto a libertadores ou joga liga e libertadores.. Só N dá p
> jogar liga copa e libertadores ou copa e libertadores… E baralho é de jogadores
> q jogaram a libertadores C o clube da sua carta e ano… O time tem q ter jogado
> libertadores aquele ano"*

### Como fica a criação da sala
- **Categoria** (do lado da várzea): `Todos · 🥅 Várzea · 🌎 Libertadores`.
- **Competição** (só aparece com a categoria Libertadores ligada):
  `🏁 Liga + Libertadores` (44 jogos) **ou** `🌎 Libertadores direto` (19 jogos).
- ⛔ **Regra dura do Diego**: **nunca** Copa dos 8 junto da Libertadores. Ligou
  Libertadores, a Copa dos 8 **sai da tela** (mesmo padrão do Bafo, que já faz
  isso e escreve o porquê). Combinações proibidas, que o código tem que impedir
  (não só esconder): liga+copa+liberta e copa+liberta.

### Regra do baralho (palavra dele)
A carta entra **se o clube da carta disputou a Libertadores naquele ano**. Não é
"foi campeão" e não é "o jogador é bom". É clube + ano.

## 11. 🔍 A PESQUISA (em andamento) — e o aviso honesto

O Diego pediu: *"pesquise a fundo pra N ter erros"*. Situação real:
- **pt.wikipedia, en.wikipedia, futdados, campeoesdofutebol: BLOQUEADOS** pelo
  proxy de rede desta sessão. Só a **busca** funciona (devolve resumo + links).
- **O resumo da busca já se contradisse uma vez**: em 2005 ele afirmou que o
  Atlético Paranaense jogou a Sul-Americana "e não a Libertadores" e, duas linhas
  depois, que o Atlético Paranaense foi **vice da Libertadores 2005** (o que é o
  correto — a final de 2005 foi São Paulo × Atlético-PR). **Fonte única não
  serve**: cada ano precisa de 2 buscas e, no fim, do olho do Diego.

**São 66 anos e 343 combinações clube+ano** pra checar (mapa completo em
`scratchpad/anos-br.txt`, gerado do `data.ts`). O trabalho é esse, e é longo.

### Já checado (1ª passada)
- **1997** → Cruzeiro (atual campeão), **Vasco**, **Grêmio**. Ou seja: **São Paulo
  1997, Flamengo 1997 e América-MG 1997 FICAM DE FORA** — 4 das 11 cartas do ano.
- **2005** → Corinthians, Internacional, Goiás, Palmeiras, São Paulo (campeão) e
  **Atlético-PR** (vice). Santos 2005 **fora** (jogou a Sul-Americana).

Já dá pra ver o efeito: **o ano da carta é o AUGE do jogador, não o ano de
Libertadores do clube** — então muita carta de clube grande vai cair.


---

## 12. ✅ ESPECIFICAÇÃO FECHADA (20/08)

Palavras do Diego, encerrando o desenho:

> *"Pré N conta se desclassificou… Teria o modo temático ao lado da várzea e a
> pessoa escolheria liga + libertadores ou só libertadores.. Copa não nesse
> caso.. Da mesma forma qd a pessoa não escolher o temático libertadores ao lado
> da várzea."*

### Como fica a tela de criar sala
1. **Categoria** (o mesmo bloco da várzea): `Todos · 🥅 Várzea · 🌎 Libertadores`.
2. **Só quando a categoria for 🌎 Libertadores**, aparece a escolha da competição:
   - `🏁 Liga + Libertadores` (a liga de 38 e a Libertadores no fim) **ou**
   - `🌎 Só Libertadores` (direto no torneio).
   - ⛔ **Copa dos 8 não existe nesse caso** — o seletor "Depois da liga" **some
     da tela**, com o porquê escrito (mesmo padrão do Bafo).
3. **Se a categoria NÃO for Libertadores, nada muda**: a sala segue exatamente
   como hoje, com `🏆 Liga + Copa` / `📊 Só liga`. O futebol que está no ar não
   sente nada.

### Regra do baralho (fechada)
A carta entra se **o clube dela disputou a Libertadores naquele ano**.
**A pré-Libertadores só conta se o clube passou dela e chegou à fase de grupos**;
quem caiu na pré, não conta.

### O que falta
Só a **lista clube+ano** (`docs/libertadores-participantes.md`), hoje com 51 dos
66 anos levantados. Sem ela o baralho não existe. Nada de código antes disso.

---

## 13. ⏸️ PAUSADO o baralho temático — vale só a COPA (decisão do Diego, 20/08)

> *"Eu acho q temos q deixar isso pausado e apenas criar a copa libertadores lá
> junto com o de liga e copa.. Mais fácil sabia.. Pq é só criar o tipo de copa e
> acabou e continua tudo igual... Até pq N sei se vai ter tanta graça assim não
> c esses jogadores"*

**Ele está certo, e tem número que prova o instinto dele.** O jogo inteiro tem
**148 lendas**. O baralho temático da Libertadores teria **17**. Ou seja: o leilão
sairia com **as mesmas 17 lendas em todo jogo**, e o resto do pregão viraria nome
que quase ninguém reconhece. A graça do leilão é justamente a briga por craque
conhecido — o filtro tirava isso.

E o custo era o inverso do benefício: o baralho temático é a parte CARA (lista de
clube+ano de 66 anos, homônimos, régua da pré) e a de menor retorno.

### O que vale fazer: a Libertadores como TIPO DE COPA
Fica no seletor que já existe (`Depois da liga`), do lado de Liga+Copa e Só liga.
**Nada mais muda**: baralho normal, liga de 20, 38 rodadas.

| | Copa dos 8 (hoje) | 🌎 Libertadores (nova) |
|---|---|---|
| Quem entra | os **8** melhores | os **16** melhores |
| Fases | quartas · semi · final | oitavas · quartas · semi · final |
| Ida e volta | todas | oitavas, quartas e semi |
| Final | ida e volta | **jogo único** ← a cara dela |
| Jogos | 6 | 7 |

Assim a escolha do host tem sentido de verdade: **Copa dos 8** = curta e fechada;
**Libertadores** = mais gente classificada e a **final única**, que é a decisão
mais tensa do jogo.

### O que fica guardado (não se perde)
- `docs/libertadores-por-clube.txt` — a lista completa que o Diego mandou, todos
  os países, até 2026.
- `docs/libertadores-participantes.md` — os 66 anos do lado brasileiro conferidos.
- `scripts/liberta-conta.mjs` — conta o baralho temático a qualquer momento.
Se um dia ele quiser o modo temático, **o trabalho pesado já está feito**.

---

## 14. ✅ O DESENHO FINAL (Diego, 20/08) — liga classifica 8, Libertadores tem 32

> *"Mas a libertadores tem q ter 32 times pow! Deveria se classificar os
> primeiros 8 e dps se juntar numa tabela c outros times formando 32 c grupos..
> Se classificando 2 primeiros e etc..."*

Isso junta as duas metades que estavam separadas nas seções anteriores e resolve
o que faltava: a Libertadores fica com os **32 times de verdade** sem precisar de
sala gigante, porque **20 vêm da liga (os 8 melhores) + 24 clubes do continente**.

### Como roda, do começo ao fim
1. **Liga normal**: 20 clubes, 38 rodadas, exatamente como hoje.
2. **Classificam os 8 melhores** da tabela — humano só vai se ganhar a vaga
   jogando (é a regra de verdade, e é o que dá sentido à liga inteira).
3. **Libertadores de 32**: os 8 classificados + **24 clubes do continente**
   (inventados, no estilo dos `CLASSIC_CLUBS` — a casa não usa clube real em
   conteúdo de mentira). Lista já desenhada em `scripts/mockup-libertadores.mjs`.
4. **8 grupos de 4**, ida e volta (6 jogos), **passam os 2 primeiros**.
5. **Oitavas · quartas · semi** em ida e volta; **final em jogo único**.

### Tamanho (medido)
| Etapa | Jogos | Tela |
|---|---|---|
| Liga | 38 | 3min00 |
| Grupos | 6 | 0min54 |
| Oitavas + quartas + semi | 6 | 1min30 |
| Final única | 1 | 0min15 |
| **Total** | **51** | **5min39** |

Contra os 44 jogos / 4min30 da liga + Copa dos 8 de hoje. **É a temporada mais
longa que o jogo já teve**, e o baralho é o NORMAL (o temático segue pausado).

### O que falta construir
1. Os **24 clubes do continente** (nome + força) — já desenhados no mockup.
2. **Sorteio dos grupos** por potes, com os 8 da liga espalhados.
3. **8 tabelas** simultâneas + a classificação de cada uma.
4. **Chave de 16** — hoje `seedQuickCopa` só sabe começar com 8.
5. **Telas**: os 8 grupos numa tela só (o seu em destaque) e a chave rolando.

⚠️ Regra do Diego que vale aqui: **UI nova = mockup primeiro**. Nada de código de
tela antes de ele ver e aprovar a folha dos grupos e da chave.

### 🏷️ Os 24 clubes do continente (quase-nome) — mockup em `scripts/mockup-liberta-32.mjs`

Pedido do Diego: *"Faça times tipo river prato. Boca zudo, Penhalol coisas
assim"* — ou seja, **quase-nome**, o estilo que a casa já usa (Vasco da Grana,
Livre-pool, Cuiabagre, Paris São Geraldo). E: *"ideal que os 8 classificados
fossem cabeças de chave"*.

**Pote 2** River Pratão 78 · Bocazudo 77 · Penhalol 75 · Nassional 74 ·
Colo do Colo 73 · Atlético Cafezal 73 · Independente da Grana 72 · Serro Portenho 71
**Pote 3** Estudantes da Prata 70 · Olímpia do Tereré 70 · The Fortão 69 ·
Barcelona da Linha 69 · Rachando Club 68 · Universidade do Chilique 67 ·
Milionários FC 67 · Aliança Limão 66
**Pote 4** Liberdade FC 65 · Liga de Quitanda 65 · Defensor Suplente 63 ·
Cobra Loka 63 · América do Calil 62 · Sporting Cristaleira 61 · Bolívar 3.600 60 ·
Deportivo Tá Xiro 58

**Pote 1 = os 8 da liga** (cabeças de chave, um por grupo). Então 8 grupos × 4 =
32, com um clube de cada pote em cada grupo — e dois classificados da mesma sala
**só se cruzam no mata-mata**.

⚠️ **"River Prato" não deu.** Esse nome já existe no jogo como o nome VELHO do
**La Bestia Negra** (batismo do eltonfrossard45, em `OLD_NAME`). Se eu usasse,
quem abrisse um save antigo veria o clube virar La Bestia Negra e ainda pegaria o
escudo dele. Virou **River Pratão**. Os outros 23 foram conferidos um a um contra
`data.ts` (clubes, `OLD_NAME`) e `escudos.tsx` (chaves de escudo) — nenhum bate.
