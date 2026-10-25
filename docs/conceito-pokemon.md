# ⚡ Modo Pokémon (salas online) — conceito FECHADO com o Diego (25/10)

> Só ideia/conceito. Nada codado. Mockups (fora do repo, scratchpad da sessão): carta "Pikachu Lenda" sem rosto e
> "Batalha Pokémon — como seria uma rodada" (escolha · batalha · tabela).
> ⚠️ Avisado ao Diego mais de uma vez: Pikachu/Pokémon são marca da Nintendo; publicar com eles de verdade num jogo que
> vende planos tem risco de pedido de remoção. A decisão de publicar é dele.

## Leilão
- **O de sempre**: 100 moedas, Envelope / Tocaia / Pregão aberto. **Sem o modo Clubes.**
- 🔁 **TIPOS DE VERDADE, LEILÃO EM LOTES (fechado 25/10, *"fechamos perfeito assim"*).** Motivo dele: *"não quero fãs de pokémon
  me perturbando que tá errado"*. Então:
  - cada carta mostra o **tipo OFICIAL atual** (os 18: Normal, Voador, Elétrico, Fogo, Água, Planta, Inseto, Veneno, Terra, Pedra,
    Lutador, Psíquico, Fantasma, Gelo, Dragão, Aço, Sombrio, Fada — ex.: Pidgey = Normal·Voador, Clefairy = Fada, Magnemite =
    Elétrico·Aço);
  - a batalha usa a **tabela de vantagens oficial**;
  - **time de 6 de QUALQUER tipo** (como no jogo de verdade). O leilão NÃO separa por tipo: **6 rodadas, cada uma com um lote
    misturado**; você leva 1 por rodada.
  - ❌ As "6 famílias" que eu inventei (Pidgey junto do Pikachu) estão REVOGADAS — fã ia apontar erro.
- Categorias iguais às de hoje (Lenda · Craque · Bom · Profissional), pela **força oficial** (atributos base dos jogos); os
  **folclóricos** (Pikachu, Magikarp…) o Diego decide, igual ao Vozinha.
- Arte: no padrão das lendas do jogo — **rosto liso, sem olhos, nariz e boca** (pedido dele).
  - 👑 **Só as LENDAS têm o desenho do próprio pokémon.** Todo o RESTO usa o **desenho do TIPO** (o 1º tipo dele), na cor da
    categoria (25/10: *"todos que não são lendas ganham desenho do tipo dele"*). Os 18 desenhos de tipo são NOSSOS (traço do jogo).
  - Arte das Lendas: o Diego manda a imagem de cada uma e a gente tira olhos/nariz/boca (feito no Pikachu). Até lá, peça NEUTRA
    marcada como neutra. Mockup das cartas: scratchpad da sessão (não versionado — tem arte da Nintendo).

## Sala
- **ATÉ 10 treinadores** (25/10, *"deixa com 10"*): no mínimo 2 pessoas (regra das salas), o resto **completa com bot**.
- Catálogo: **toda a 1ª geração + os mais famosos das outras** — lista proposta em `docs/pokemon-lista.md` (espera OK).
- **Liga só de ida**: com 10 treinadores = 9 rodadas (todo mundo contra todo mundo uma vez), 5 batalhas ao mesmo tempo por
  rodada (~19 min de batalha; com 8 eram 7 rodadas e ~16 min).
- **Semifinal e final em jogo único** (os 4 primeiros).
- Vitória = 3 pts · desempate pelo **saldo de nocautes** (o "saldo de gols").
- Tempo: ~12s de escolha + ~1:30 de batalha por rodada ≈ **16 min depois do leilão**, com 2 ou com 8 pessoas.

## A diferença pro futebol: DECISÃO A CADA BATALHA (escolha dele: *"melhor decidindo mesmo"*)
- Antes de **cada** batalha: **quais 3 dos 6 lutam, em que ORDEM entram, e a tática** (🔥 Agressivo · ⚖️ Equilíbrio · 🛡️ Defensivo).
- Relógio curto (12s). Quem não escolher entra com a escalação da batalha anterior — ninguém espera o mais lento.
- **Na CERIMÔNIA** (depois do leilão) aparecem os times de TODO MUNDO.
- **Na hora de escolher** (antes de cada batalha): rival **BOT** → aparecem os **tipos** dos pokémon dele; rival **PESSOA** →
  não aparece nada, o usuário tem que ter **gravado da cerimônia** (confirmado 25/10: *"nas batalhas só daria pra ver os tipos
  de pokémon dos bots. Dos rivais o usuário teria que ter gravado da cerimônia"*). Os 3 escolhidos e a ordem de qualquer rival
  só aparecem quando a batalha começa.

## A batalha (simulação, roda sozinha)
- 3 contra 3, golpe a golpe, **barra de vida** + **narração** (no lugar do rádio). Ganha quem derrubar os 3 do outro.
- **"QUEM GANHA FICA"** (fechado 25/10): 1º contra 1º; quem perde sai e entra o próximo DAQUELE lado; quem ganha continua na
  arena **com a vida que sobrou** (não cura entre lutas). Acaba quando um lado perde os 3.
- Quem bate primeiro = velocidade · dano = ataque × defesa do outro × **tipo** (forte 2× "SUPER EFETIVO", fraco ½×) ×
  **dia bom/ruim** (faixa de força igual à dos jogadores).
