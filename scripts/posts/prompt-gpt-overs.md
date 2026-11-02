# Prompt pro GPT — revisar os overs do Leilão Legends

> Cole este texto no GPT junto com o arquivo **baralho-completo.csv**.

---

Você vai me ajudar a revisar a força (o "over") de todas as cartas de jogadores do meu jogo de futebol, o **Leilão Legends**.
Em anexo está o arquivo `baralho-completo.csv` com as 2.475 cartas. Leia tudo abaixo antes de mexer em qualquer número.

## 1. Como funciona o over no jogo (por que é uma FAIXA e não um número)

Cada carta não tem um over fixo. Ela tem um **over mínimo** e um **over máximo** (colunas "Over mínimo" e "Over máximo").

Em cada partida, o jogo **sorteia o nível do dia** do jogador dentro dessa faixa:
- perto do **mínimo** = dia ruim (o jogador não rendeu);
- perto do **máximo** = dia de ápice (jogou tudo);
- o meio da faixa é o jogo normal.

Por isso a faixa diz duas coisas:
- **Onde ela fica** (alta ou baixa) = o quanto o jogador era bom.
- **Largura** (distância entre mínimo e máximo) = o quanto ele oscilava. Craque regular tem faixa estreita (ex.: 90–95).
  Jogador irregular, que alternava jogos geniais e jogos apagados, tem faixa larga (ex.: 70–86).

A coluna "Over médio" é só a média dos dois, pra ajudar a ordenar. **O que vale são o mínimo e o máximo.**

## 2. O que é uma carta: o jogador NO AUGE daquele clube e daquele ano

Cada carta é **um jogador num clube e num ano específicos** (colunas "Clube" e "Ano"). Ela representa aquele jogador
**naquele momento**, não a carreira inteira.
- Ex.: "Ronaldinho · Barcelona · 2005" é o Ronaldinho no auge, melhor do mundo. Uma carta "Ronaldinho · Atlético-MG · 2013"
  seria outra carta, com outra força.
- O mesmo jogador pode ter mais de uma carta (em clubes ou baralhos diferentes). Cada uma tem a força daquele momento.

Existem 3 baralhos (coluna "Baralho"):
- **Brasil**: jogadores em clubes brasileiros. O over é o de como ele jogava **no futebol brasileiro naquela época**.
- **Europa**: jogadores em clubes europeus.
- **Mundo**: clubes do resto do mundo (Argentina, Uruguai, México, MLS, Arábia, Japão…).

Importante: **o over é uma régua única pro jogo inteiro.** Um craque do Brasil e um craque da Europa estão na mesma régua,
porque se enfrentam nos mesmos campeonatos. Leve em conta o nível real que o jogador tinha naquele clube e naquele ano,
comparado com o mundo todo.

## 3. As categorias do jogo (coluna "Categoria")

São 5, da maior pra menor:

| Categoria | O que é | Fama |
|---|---|---|
| **Lenda** | Os maiores da história, no auge. Ídolo eterno, melhor do mundo ou perto disso, campeão de tudo. | 5 |
| **Craque** | Jogador de elite naquele momento: titular de seleção forte, destaque de clube grande. Não chega a lenda. | 4 |
| **Promessa** | Carta do jogador JOVEM, antes de estourar (ex.: Neymar no Santos aos 18). Hoje é bom; virou estrela depois. | — |
| **Bom jogador** | Jogador de nível, conhecido, titular, mas não estrela. | 2 ou 3 |
| **Foi profissional** | Jogador comum, folclórico ou de nível baixo. Conhecido, mas fraco. | 1 |

Faixas que existem HOJE no arquivo (só pra você ter noção; dá pra mudar):
- Lenda: mínimo 80–97 · máximo 88–99
- Craque: mínimo 60–90 · máximo 82–95
- Bom jogador: mínimo 55–82 · máximo 76–89
- Promessa: mínimo 50–87 · máximo 76–93
- Foi profissional: mínimo 35–74 · máximo 55–86

## 4. O problema que eu quero resolver

Hoje tem carta com a força **fora de ordem**. Exemplo claro:
- **Cássio · Corinthians · 2012** é **Craque** com over **88–94**;
- **Petr Čech · Chelsea · 2005** é **Lenda** com over **84–90**.

O Cássio está ACIMA do Čech, e isso está errado: o Čech no Chelsea de 2005 era um dos melhores goleiros do mundo, bem acima
do Cássio. Isso acontece em vários lugares do baralho.

## 5. O que eu quero que você faça

1. **Analise o baralho inteiro**, posição por posição (goleiro com goleiro, atacante com atacante…), e **coloque em ordem do
   melhor pro pior** pelo nível real de cada jogador naquele clube e ano.
2. **Refaça o over mínimo e máximo** de cada carta seguindo essa ordem.
3. **Confira a categoria** de cada carta. Se a carta estiver na categoria errada, mude (e mude a Fama junto: Lenda 5, Craque 4,
   Bom jogador 3, Foi profissional 1). Promessa continua Promessa: é uma regra do jogo pra carta de jogador jovem.
4. **Regra de ouro das categorias: categoria de baixo nunca passa a de cima.**
   - Nenhum Craque pode ter over médio maior que a Lenda mais fraca da mesma posição.
   - Nenhum Bom jogador maior que o Craque mais fraco. Nenhum Foi profissional maior que o Bom jogador mais fraco.
   - Promessa fica no nível que o jogador tinha QUANDO ERA JOVEM (normalmente entre Bom jogador e Craque).
5. A largura da faixa deve refletir o quanto o jogador oscilava (regular = estreita, irregular = larga). Faixa entre 4 e 16
   pontos. Over máximo nunca passa de 99.

## 6. O que NÃO pode mudar de jeito nenhum

- **Nome, Clube, Ano, Baralho, Posição e País**: não mexa. Eles são a identidade da carta e a chave dos saves dos jogadores.
- **Não crie e não apague cartas.** Devolva as mesmas 2.475 linhas.
- **Lucas Barreto · Botafogo · 2024 (goleiro): NÃO MEXA.** Ele continua Bom jogador, 74–83, exatamente como está.

## 7. Como me devolver

1. **Um arquivo CSV** com as mesmas colunas e na mesma ordem do original, com os valores novos de Categoria, Fama, Over mínimo
   e Over máximo. Acrescente uma última coluna **"Motivo"**, preenchida só nas cartas que você mudou, em uma frase curta
   (ex.: "Čech era o melhor goleiro do mundo em 2005; sobe acima dos craques").
2. **Um resumo** com: quantas cartas mudaram de categoria; as 20 mudanças mais importantes; e a faixa final de over de cada
   categoria, por posição.

Se tiver dúvida sobre algum jogador (não conhece ou não sabe o nível naquele ano), **não invente**: deixe como está e liste
essas cartas no resumo.
