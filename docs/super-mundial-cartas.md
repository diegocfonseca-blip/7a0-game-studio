# 🌍 Super Mundial — cartas só do modo (26/11)

Pedido do Diego: os clubes do Mundial de Clubes FIFA 2025 que não fechavam um time ganham cartas que valem **só pro Super
Mundial**. Elas moram em `src/escalacao/cartas-mundial-clubes.ts`, fora do `data.ts`, então nenhum leilão (salas, partida
rápida, carreira) e nenhum pacote do campeão enxerga essas cartas. Só a convocação do modo junta essas cartas às do clube
(`poolDoClube`, em copa-regional.ts, e só pros clubes deste lote).

## Fontes
- Formato e os 32 participantes: pt.wikipedia "Mundial de Clubes FIFA de 2025".
- Elencos de 2025: pt.wikipedia "Elencos do Mundial de Clubes FIFA de 2025".
- Os históricos (Keïta no Salzburg, Abdulrahman no Al Ain, Aboutrika já existia…): campanhas continentais conhecidas
  (Champions da Ásia, da África, Concacaf, MLS Cup, Mundial de Clubes). Quando não deu pra confirmar o ano/papel, a carta virou
  o jogador do elenco de 2025, com a bio "do elenco do X no Mundial de Clubes de 2025".

## Regras seguidas
- Famoso do clube primeiro; quando não há famoso, entra o elenco de 2025.
- **Baralho do clube**: Salzburg = Europa; o resto = Mundo. A pessoa não repete no mesmo baralho. Saíram: Haaland, Mané,
  Szoboszlai, Hinteregger e Hwang (Salzburg, todos já no Europa); Kim Young-gwon, Lodeiro, Ruidíaz, Manso, Andrada, Corona,
  César Delgado, Emiliano Tade, Danilo Boza e Eduardo Bauermann (já têm carta no Mundo, contando o Brasil Oficial).
- **Mamelodi Sundowns**: as 23 cartas que o Brasil Oficial já tinha (rival da Intercontinental) foram repetidas iguais, porque
  aquele baralho só baixa na carreira.
- **Al-Hilal** (só 1 zagueiro) e **Inter Miami** (nenhum zagueiro) ganharam cartas pra fechar o time.
- Força na régua de 02/11. A trava `npm run mundial-sala` confere baralho, régua e que as copas que já rodam (Liberta da sala e
  regionais) não ganharam carta.
- Escudo: os clubes sem arte no jogo aparecem com o escudo NEUTRO de sempre (letra no escudo). Não se desenha escudo de clube real.

## ⭐ Liga + Champions (26/11) — `cartas-champions-clubes.ts`
Mesma regra: cartas que valem só na convocação da Liga + Champions da sala (`poolDoClube`, só pros 13 clubes do lote). Clubes:
Atalanta, Villarreal, Athletic Bilbao, Eintracht Frankfurt, Brugge, Olympiacos, Bodø/Glimt, Qarabağ, Pafos, Union SG, Copenhagen,
Slavia Praga e Kairat — todos do baralho Europa. Fonte: pt.wikipedia (página de cada clube, elenco 2025/26; Qarabağ set/2025) e as
campanhas europeias conhecidas (Liga Europa da Atalanta 2024, Villarreal 2021, Eintracht 2022; Conference do Olympiacos 2024).
Saíram por já terem carta no Europa: Laporte, Zubizarreta, Forlán, Parejo, Doan, Delaney, Gulácsi (está no Salzburg).
Xarás que ficam: Éderson (Atalanta) × Ederson (City), Pêpê (Pafos) × Pepe (Real), Jorginho (Kairat).
