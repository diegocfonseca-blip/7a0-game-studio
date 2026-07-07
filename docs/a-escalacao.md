# A ESCALAÇÃO — Documento de Design

> Leilão cego por setor + campeonato de 38 rodadas. Protótipo jogável em `src/escalacao/`.

## Conceito

Cada técnico monta um time de **exatamente 11 jogadores** (sem banco, sem lesão) num
**leilão 100% cego** — ninguém vê o lance de ninguém até o martelo bater — e depois
prova o time num **campeonato de pontos corridos com 38 rodadas** (liga de 20 times:
os técnicos da sala + clubes clássicos controlados pelo jogo).

## As regras fechadas

### O Pregão (leilão em 5 rodadas por setor)
1. Formação travada antes do pregão (4-3-3, 4-4-2, 3-5-2, 4-5-1). Orçamento: 100 moedas.
2. O baralho nasce da demanda da sala: **cada posição entra com ~30% a mais** do que a
   sala precisa — garantia matemática de que ninguém fica sem posição.
3. Setores em ordem de escalação: **GOL → LAT → ZAG → MEI → ATA** (a guerra pelas
   estrelas do ataque é a grande final; administrar orçamento entre setores é o jogo).
4. Todas as cartas do setor abrem de uma vez. Cada técnico distribui lances em segredo
   (soma ≤ saldo). **Revelação em pote crescente**: lances solitários primeiro
   (o Bebeto de 1 moeda), barril de pólvora por último (o Pelé disputado por 7).
5. Maior lance leva e paga o que deu. Empate: menor elenco, depois sorteio.
6. Encheu as vagas do setor no meio da revelação? Lances restantes **anulados** (não paga).
7. Carta sem lance → Monte Final.

### Níveis ocultos ("o Obina tem dias")
- A carta mostra só **nome, clube, ano e posição**. Você dá lance na memória, não no número.
- Todo jogador tem uma **faixa de nível** (até 99). Lendas: faixa estreita e alta
  (Pelé 97–99 — você paga por certeza). Quase lendas: faixa larga (Obina 55–82 —
  barato e imprevisível). O nível de cada rodada é sorteado dentro da faixa.
- Faixas só aparecem na **Cerimônia da Revelação**, depois do último martelo —
  com prêmios de Achado do Pregão e Mico do Pregão.
- O terço final de cada setor traz **incógnitas**: nomes desconhecidos, algumas
  escondendo joias (faixa alta). Conhecimento e coragem valem dinheiro.

### Redes de segurança (ninguém termina sem 11)
1. **Repescagem relâmpago**: sobras do setor voltam pra uma rodada rápida, só pra quem
   ficou com buraco. Perdeu a guerra do Dida? Ainda compra o plano B, barato.
2. **Monte Final**: fim do pregão, sobras de graça, **quem tem mais buracos escolhe
   primeiro, em serpente**, só podendo pegar carta que encaixa nos buracos.
3. Auto-preenchimento se o jogador não escolher (nunca trava a sala).

### Dinheiro
- O que sobrar no fim do leilão **evapora** — sem desempate, sem conversão.
  Gastar tudo é o comportamento certo e o jogo premia isso.

### A temporada
- 38 rodadas, turno e returno, liga de 20 (técnicos + clubes clássicos).
- Única decisão por rodada: **tática** — retranca segura ataque · ataque atropela
  equilíbrio · equilíbrio fura retranca.
- **Time é corrente, não soma**: cada setor vale pela média puxada pro elo mais fraco
  (35% de peso no pior jogador). O galático com 3 rebarbas sofre; o time redondo rende.
- **Dias inspirados**: jogador de faixa larga que rola perto do teto vira manchete e
  bônus de ataque na rodada — a esperança do time de bagres é real.

## Arquétipos que as regras sustentam
| Arquétipo | Estratégia |
|---|---|
| Galático | 3–4 lances altíssimos, completa com sobras |
| Operário | 11 lances médios, sem elo fraco |
| Sniper | Lances de 1–3 moedas em cartas que ninguém olha |
| Garimpeiro | Guarda saldo pras incógnitas e pro ataque |

## Roadmap (fora do protótipo)
- Multiplayer online (salas Supabase, como o modo Draft)
- Timer real de envelope (20s, fecha quando todos enviarem)
- Narração por IA nas partidas grandes (engine já existe no estúdio)
- Sinergias de clube/era como bônus de química
- Modo assíncrono de temporada (X rodadas por dia)
