# 👑 KINGS LEAGUE — sala online (conceito decidido com o Diego, 15/10/2026)

Tudo aqui foi decidido no chat de 15/10. Mockups: `scripts/mockups/kings-league.png` (8 telas) e
`scripts/mockups/campinho-reis.png` (campinho). **Ler antes de mexer no modo.**

## Nome e base
- O nome na tela é **"Kings League"** (Diego: *"não quero Modo Reis, quero escrito Kings League mesmo"*). Avisei que é
  marca registrada; a decisão é dele.
- Regras = **Kings League BRASIL** (2025), só ela (*"faça a regra com base na Kings do Brasil apenas"*).
- Arte NOSSA (creme/borda/Oswald), nada da arte/logo deles.

## Campeonato
- **10 times** (gente + bots), todos contra todos 1× = **9 rodadas**.
- Pontos: vitória no tempo **3** · vitória no shootout **2** · derrota no shootout **1** · derrota no tempo **0**.
- Mata-mata: **1º direto na semi**, **2º–7º quartas**, 8º–10º fora. Semi e final.

## Leilão
- 🔨 **É O LEILÃO DE SEMPRE DO JOGO** (Diego 15/10: *"o leilão é sempre igual ao de sempre nosso"*) — envelope, revelação,
  monte e cerimônia normais; só muda a formação (`'kings'`) e o campinho. Nunca inventar outro pregão.
- 🔀 **E TODAS as escolhas do leilão continuam valendo** (Diego 15/10: *"se é envelope, Tocaia, baralho BR, EU ou mundo, clubes
  ou jogador… é tudo igual"*). Na partida rápida a Kings é um INTERRUPTOR por cima da tela de sempre: liga e escolhe o resto
  normal. Fixos só: 10 times, formação `'kings'` e sem "depois da liga". Trava: `npm run kings` roda as 6 combinações.
- **Futebol 7**: goleiro + 6 → **1 GOL · 2 ZAG · 2 MEI · 2 ATA**. Mesmas cartas e níveis de sempre.
- Campinho próprio no leilão (como a quadra do basquete): gramado sintético de arena, placas pretas com letra dourada,
  selo "KINGS LEAGUE 👑" no meio.

## 📺 A TELA É A DE SEMPRE (Diego 15/10: *"tudo é padrão do nosso jogo… as regras são diferentes, mas tabela, jogos, placar"*)
- Depois do leilão, a temporada roda na `EscSeason` normal: placar, rádio, tabela, giro, controles, mata-mata no motor da
  Copa. A 1ª versão (`kings-rapida.tsx`, tela própria com placar próprio) foi APAGADA — ele achou o placar "deformado".
- Por cima da partida de sempre (`simMatch`), `kings-liga.ts` aplica a regra: presidente, dado, bola dourada/vermelha,
  shootout, pontos 3/2/1/0. O relógio mostra 0–40' (por dentro anda 0–93 como todo jogo) e PARA nos banners.
- Tabela: coluna SH (jogos no shootout) no lugar do E; 1º = SEMI, 2º–7º = QF, sem rebaixamento.
- Mata-mata: `quickCopa` com `kingsDireto` (o 1º), tudo jogo único, empate = shootout da própria partida.
- ⏳ Ainda NÃO entram (vêm depois, se ele quiser): carta secreta e o presidente BATENDO na mão (hoje é sorteado).

## A partida (2 tempos de 20 min, NÃO tem empate)
- 🎲 **Minuto 18 — o dado**: cada time fica com **2 ou 3** até o fim do 1º tempo. Mesmo minuto em TODOS os jogos da sala.
- 🃏 **Carta secreta** (escolhida no vestiário, usada no **2º tempo**, num botão, 1×): pênalti · shootout (sai do meio,
  5s contra o goleiro) · suspensão de um rival por 4 min · gol em dobro por 4 min. (Jogador estrela/coringa ficaram de
  fora: as fontes brasileiras não batem.)
- 🎩 **Pênalti do presidente**: **1 por time por jogo** (todo jogo tem 2). O usuário BATE (batida manual da carreira).
  Gente × gente: um bate e o outro DEFENDE ao mesmo tempo (~5–6s). Contra bot: goleiro do bot pula sozinho; o
  presidente bot usa o dele num minuto sorteado. O relógio NÃO para: a cobrança é uma janelinha por cima.
- ⏱️ **Minuto 38**: empatado → 🟡 **bola dourada** (gol de ouro, quem marcar vence); alguém na frente → 🔴 **bola
  vermelha** (todo gol vale 2 até o apito). Empate persistiu → **shootout** (batida manual; gente × gente = duelo).
- ⚠️ O "começa 1 contra 1" NÃO entra: nenhuma fonte brasileira confirma.

## Ritmo (Diego: *"tem que ser mais demorado por partida… mais que todos, porque é difícil entender"*)
- **~3 min reais por partida** (40 min de jogo).
- **Banners explicando cada regra** na hora que ela acontece: o jogo PARA **6–8s**, explica, volta sozinho. Caem no
  mesmo minuto em todos os jogos da sala.
- **Intervalo de 15s** com o resumo do 2º tempo ("agora vale a carta secreta").
- **Vestiário de 20s** antes de cada rodada, todo mundo junto.
- Rodada ≈ 4 min · campeonato inteiro ≈ 50 min–1 h.
- Todos os jogos da rodada rolam JUNTOS no mesmo relógio (ninguém espera o jogo de ninguém).

## Fora
- **Duplas**: esquecidas por enquanto (*"esquece dupla agora"*).

## Ordem de construção (cada etapa só na conta do Diego até ele aprovar)
1. Motor PURO das regras (`src/escalacao/kings.ts`) + trava (`scripts/testa-kings.mjs`) — não toca no jogo ao vivo.
2. Tipo de sala "Kings League" (só na conta do Diego) + leilão de 7 com o campinho próprio.
3. Liga de 10 com a pontuação 3/2/1/0 e a partida com dado, bolas dourada/vermelha e shootout automático.
4. Vestiário + carta secreta + pênalti do presidente com os botões (online: dono da sala decide, convidado pede).
5. Duelo manual gente × gente (pênalti do presidente e shootout) + banners explicativos + mata-mata.
