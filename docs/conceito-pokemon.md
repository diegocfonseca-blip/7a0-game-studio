# ⚡ Modo Pokémon (salas online) — conceito FECHADO com o Diego (25/10)

> Só ideia/conceito. Nada codado. Mockups (fora do repo, scratchpad da sessão): carta "Pikachu Lenda" sem rosto e
> "Batalha Pokémon — como seria uma rodada" (escolha · batalha · tabela).
> ⚠️ Avisado ao Diego mais de uma vez: Pikachu/Pokémon são marca da Nintendo; publicar com eles de verdade num jogo que
> vende planos tem risco de pedido de remoção. A decisão de publicar é dele.

## Leilão
- **O de sempre**: 100 moedas, Envelope / Tocaia / Pregão aberto. **Sem o modo Clubes.**
- No lugar das posições entram os **TIPOS** (🔥 Fogo · 💧 Água · 🌿 Planta · ⚡ Elétrico · 🪨 Pedra · 👻 Psíquico): um de cada
  → **time de 6 pokémon**. Categorias iguais às de hoje (Lenda · Craque · Bom · Profissional).
- Arte: no padrão das lendas do jogo — **rosto liso, sem olhos, nariz e boca** (pedido dele).

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
