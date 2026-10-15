# 🔍 Análise da carreira de ponta a ponta + SAF e 2º clube (13/10)

Pedido do Diego: *"analise o modo carreira de ponta a ponta e me diga o que temos que alterar…
pra deixar o jogo mais real. Além disso o modo SAF e segundo clube precisamos reformular talvez"*.
Nada foi mexido no jogo — isto é diagnóstico. Respeita o que ele já recusou (ver CLAUDE.md:
Dep. Médico, patrocinador pontual, renovação com bônus, pular roteiro, prêmio que sobe piso,
teto do bot por índice/tabela, direções novas da Agência).

## O que mais pesa (ordem de impacto)

1. **Os bots não têm dinheiro de verdade.** Começam com A230…V60 e só ganham prêmio de título
   (`store.tsx:834-840`, `pyramidseason.tsx:504-517`): sem TV, sem bilheteria, sem patrocínio e
   **sem salário**. Por isso, da metade da carreira em diante, quem é rico compra tudo — o bot
   não pode dar lance acima do que tem (`perfis-bot.ts:19`). É a mesma raiz do "Scholes lenda
   sem lance" (21/09) e do "teto preso em 450" (20/09).
   → Bot ganha TV e bilheteria pela divisão (as mesmas tabelas do humano) e paga salário.
2. **O dinheiro perde o sentido.** Depois do estádio completo não há onde gastar; tem save com
   +3870 (`store.tsx:8543`). → Gasto que se repete: manutenção do estádio e folha que cresce
   com a divisão. (Nunca subindo piso de jogador.)
3. **Jogador é congelado pra sempre.** Sem idade, forma ou evolução (`sincronizaNiveis`
   regrava lo/hi do catálogo, `store.tsx:10828`); o cria da base nunca cresce
   (`store.tsx:1461`). Envelhecer briga com "lenda no auge". → **Fase da temporada**: ±3 no
   nível por carta e temporada, sorteado pela semente (não muda temporada já jogada). Dá
   "jogador em alta / em baixa" sem aposentar ninguém. O cria pode crescer até um teto.
4. **Bot não cansa, não roda e não se machuca** (`pyramidseason.tsx:717, 843`). O gás vira só
   desvantagem do humano. → Mesma regra de cansaço e lesão pros rivais.
5. **A tática está "resolvida".** Equilíbrio (+1/+1) sempre ganha de retranca e ataque no saldo,
   e a tática do adversário é ignorada (`pyramidseason.tsx:187-193`). → Pedra-papel-tesoura
   (ataque × retranca × equilíbrio), equilíbrio neutro.
6. **Bônus escondido.** Bot ganha +2…+5 (`pyramidseason.tsx:160, 867`) e time da Série A ganha
   +10 nas copas só por ser da A (`pyramidseason.tsx:1081`, `copa-brasil.ts:83`). Explica
   "simulação com resultado pronto" (02/10). → Tirar, ou mostrar como "torcida/tradição".
7. **Calendário espremido.** Copa do Brasil/Legends e Supercopa só depois da rodada 38
   (`copa-brasil.ts:16-18`), e jogo de copa não cansa (`store.tsx:1320`). → Copa intercalada
   na liga (a cada 4–5 rodadas) e contando no gás; aí elenco fundo faz diferença.
8. **Furo de salário na SAF.** Emprestar logo antes do fechamento da temporada pula a folha
   (`store.tsx:215, 301, 7872`); empréstimo vai e volta na hora (`7949`). → Travar empréstimo
   no fechamento ou cobrar salário proporcional.

Menores: técnico só existe nos clubes da SUA divisão (`store.tsx:9013`); sem janela de
transferência no meio da temporada; o pênalti decisivo só soma gol pro humano
(`pyramidseason.tsx:933-942`); a sorte do jogo (×0,85–1,15, `:875`) pesa mais que tática e
técnico (1/12 da força, `:859`).

## SAF e 2º clube

**Hoje:**
- **SAF** (2.000, estádio 100%): clube bot da Série D. Você leva 50% dos prêmios dele e
  paga 50% da multa de rebaixamento, e usa como depósito de empréstimo sem salário. Paga
  em ≥ 40 temporadas.
- **2º clube** (4.000, Lenda): clube jogável que dorme. Recebe TV, patrocínio, Agência e
  cartinha sem decidir nada, nunca compra reforço e vai definhando. Vender apaga o caixa
  dele.

**Confusões e furos:**
- **Dois conceitos de "clube que é meu",** os dois na Série D, com regras opostas. Ninguém entende por que um dorme e o outro não.
- **Texto que mente:**
  - A SAF diz "não vende" (`estadio.tsx:912`), mas tem botão de vender (`:1054`).
  - O 2º clube diz "troca entre temporadas" (`pyramidseason.tsx:1303`), mas troca no meio.
  - A trava fala "Craque completo", mas o código pede ouro (`:1313` × `:10776`).
- **Extrato errado:** a compra e a venda do 2º clube aparecem como "Compra/Venda da SAF" (`store.tsx:7666, 7774`).
- **Furo de dinheiro:** dá pra trocar de clube antes do fim da temporada e mandar a comissão da SAF pro clube que você quiser (`store.tsx:2645`).

**Direções (a recomendada primeiro):**
- **B) Juntar os dois num degrau só (recomendada):** compra a SAF (2.000) → depois "assume o
  comando" (+2.000) e ela vira o 2º clube jogável, guardando títulos. Um conceito, uma
  escada, um clube da Série D. Custo: migrar quem tem os dois.
- **A) SAF = clube parceiro (estilo City Group):** empréstimo valoriza o jogador, a base
  revela promessa, preferência no leilão; sai a comissão de 50%. É a proposta de 07/10 ainda
  sem decisão.
- **C) Manter os dois e só consertar:** troca só na virada, 2º clube dormindo contrata
  reposição sozinho, vender devolve o caixa, textos certos.

Decisões que continuam em aberto (de antes): caldeirão (07/10), mostrar o perfil dos bots
(07/10), Conquistas + Missão diária (27/09), "puxar da divisão de baixo" pro tapa-buraco (19/09).
