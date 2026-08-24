# 🔬 250 temporadas simuladas — o que a máquina achou (24/08/2026)

Pedido do Diego: *"o jogo tá meio monótono. Preciso que você faça uma simulação
por 250 temporadas em busca de ideias novas pro jogo. Seja jogabilidade, seja
resenha, seja criatividade, seja qualquer coisa além do que eu penso."*

**Como foi feito:** `scripts/sim-250-temporadas.mjs` roda o MOTOR REAL da carreira
(as mesmas `buildPyramid`, `simulatePyramid`, `computePromotions`,
`seasonRewards`, `scorerRewards` que rodam no celular do jogador) por 250
temporadas seguidas, três vezes — com elenco **forte**, **médio** e **fraco** —
e mede o que se repete.

⚠️ **O que a simulação NÃO cobre** (pra ninguém tomar o número por verdade
absoluta): o leilão entre temporadas, as copas, os eventos de jogador, o estádio
e o mercado. O elenco fica congelado. Ou seja: os números medem **o esqueleto de
regras** da carreira, não a carreira inteira. Mesmo assim, o esqueleto é onde a
monotonia mora — e é ele que aparece aqui.

---

## 📊 O ACHADO PRINCIPAL: a carreira inteira é decidida na largada

| | 💪 elenco forte | 😐 elenco médio | 😟 elenco fraco |
|---|---|---|---|
| Títulos em 250 temporadas | **109** | 17 | 19 |
| Temporadas na Série A | **247** | 5 | **0** |
| Quedas | **0** | 58 | 110 |
| Acessos | 3 | 60 | 110 |
| Posição média | 2,4º | 10,5º | 9,5º |
| Caixa no fim | **15.870** 🪙 | 1.475 | 1.310 |

Lendo isso em voz alta:

1. **Com elenco forte, o jogo acaba na 3ª temporada.** Sobe pra Série A e **nunca
   mais cai** — 247 temporadas seguidas, ZERO quedas, campeão em 43,6% delas,
   nunca pior que 11º. Não existe mais risco: dá pra jogar 200 temporadas no
   piloto automático.
2. **Com elenco médio ou fraco, vira ELEVADOR.** Sobe e cai **110 vezes**. Em 250
   temporadas o time fraco **nunca pisou na Série A**. A briga é sempre a mesma,
   pra sempre.
3. **Não existe caminho do meio.** O jogo não puxa o fraco pra cima nem o forte
   pra baixo. Quem montou um bom elenco UMA vez, está feito pra sempre.

## 📊 Os outros números

- **Dinheiro nunca cai** (medido: `caixaSempreSubindo = true` nas 250). O forte
  junta 63,5 🪙 por temporada e termina com 15.870 sem ter o que fazer com eles.
- **A Série A é um duopólio**: só 15 clubes distintos foram campeões em 250 anos.
  Meu Timão (107) + Metrópole FC (80) = **75% de todos os títulos**.
- **A partida é boa, a temporada é chata**: **55,2%** dos jogos são decididos por
  1 gol ou empate (isso é ÓTIMO, o motor de jogo tem emoção) — mas o campeonato
  termina com folga média de **6 pontos**, e 6 placares (1x0, 2x0, 1x1, 2x1,
  3x0, 0x0) somam **52%** de todos os jogos.
- **Goleada é sempre a favor**: 808 a favor × 106 contra (8 pra 1).
- **Artilheiros**: 161 nomes diferentes, mas Pelé (47×), Túlio (44×) e Leônidas
  (42×) dominam a lista.
- **A Várzea não existe na carreira normal**: 0 campeões em 250 temporadas (a
  escada só nasce em carreira nova).

---

## 💡 AS IDEIAS (cada uma ataca um número acima)

### 🥇 As três que eu faria primeiro

**1. 👴 O tempo passa: jogador envelhece e se aposenta.**
Hoje nada muda — nem seu elenco, nem o dos rivais. É por isso que o forte é forte
pra sempre. Se cada carta tiver idade, perder nível depois de certo ponto e um dia
**pendurar as chuteiras**, o técnico é obrigado a se reinventar. E ganha história:
despedida no jornal, camisa aposentada no museu do clube, o garoto que vira
titular no lugar do ídolo. *Cura o achado nº 1 e nº 3 de uma vez.*

**2. 🪑 A pressão da diretoria (você pode ser DEMITIDO).**
A meta já existe no patrocínio. Faltou a consequência: **não bateu a meta duas
temporadas seguidas → a diretoria te manda embora**, e você recebe propostas de
outros clubes (às vezes de uma divisão abaixo). Não apaga nada, não é game over —
é recomeço com história, do jeito mais futebol que existe. *Devolve o risco pro
elenco forte, que hoje não tem nenhum.*

**3. 😈 O RIVAL (a resenha que falta).**
O Metrópole FC ganhou 80 títulos e é só um nome numa tabela. O jogo devia
**eleger sozinho** o clube que mais te tirou título como seu **rival eterno**:
clássico marcado no calendário, provocação na véspera, zoeira do vencedor no
jornal, e um troféu particular só entre vocês dois ("quem manda na cidade").
Estatística vira personagem. *Ataca o duopólio e é 100% a alma do jogo.*

### 🥈 As outras sete

**4. 📈 Rivais que crescem e encolhem.** Quem sobe reinveste e fica mais forte;
quem cai enfraquece. Com uma pitada de equilíbrio: se você atropela 3 temporadas
seguidas, os grandes se armam pra te parar. *Mata o elevador do elenco médio e o
passeio do elenco forte.*

**5. 💸 Dinheiro com destino e com risco.** Hoje a caixa só sobe. Folha salarial
que cresce junto com o sucesso, manutenção do estádio, e sonhos caros pra
perseguir (centro de treinamento, museu do clube, ônibus/avião do time). Dinheiro
sem escolha difícil não é dinheiro, é placar.

**6. 📰 Jornal com memória.** O jornal conta a temporada, mas esquece o passado.
Manchetes que lembram: *"3º título seguido"*, *"10 anos sem perder pro Zorra
FC"*, *"acabou o jejum de 12 temporadas"*. Custo baixo, sensação de saga.

**7. 🎯 Desafios de temporada.** Pra quem já ganhou tudo: *"seja campeão sem
contratar nenhum atacante"*, *"ganhe do rival fora de casa"*, *"termine a
temporada invicto em casa"*. Objetivo novo sem regra nova.

**8. 🌱 A várzea pra todo mundo.** Ela existe e não aparece em carreira normal.
Começar do campinho de terra é a melhor história do jogo — e hoje só quem começa
carreira nova vê.

**9. 🎲 A zebra tem que morder.** Goleada é 8× mais provável a favor do que
contra. Faltam a virada histórica, o dia infeliz, o pesadelo que vira causo —
que é justamente o que o pessoal comenta no grupo.

**10. 🏟️ O clássico do interior / a taça regional.** Um torneio curto no meio da
temporada entre os clubes da mesma "região" da pirâmide, com taça própria. Mais
um momento de resenha sem alongar o calendário.

---

## 🔁 Como reproduzir

```
npm run dev                      # noutro terminal
node scripts/sim-250-temporadas.mjs --temporadas 250 --elenco forte --saida sim.json
node scripts/sim-250-temporadas.mjs --temporadas 250 --elenco medio --saida sim-medio.json
node scripts/sim-250-temporadas.mjs --temporadas 250 --elenco fraco --saida sim-fraco.json
```
Leva ~1 minuto cada. O script cria uma página vazia (`bench-sim.html`) só pra
carregar o motor sem subir o app inteiro — ela é apagada no fim.

**Status:** nada disso foi implementado. É pesquisa pro Diego escolher.
