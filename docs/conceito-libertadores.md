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
