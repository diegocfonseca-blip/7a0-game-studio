# 🎙️ Anúncio "Pregão Aberto" — versão LIMPA pro Gerenciador de Anúncios do Meta (25/11)
O Reels do Pregão Aberto (com Neymar, Ronaldo, Zidane…) foi recusado pelo Meta. O Meta barra anúncio que mostra nome ou rosto de
jogador famoso sem autorização (parece que ele está fazendo propaganda). Esta versão é a MESMA estrutura, sem nenhum nome, rosto, escudo
ou competição registrada:
- cartas de abertura e galeria = cartas-mistério nas cores das categorias (Lenda, Craque, Promessa, Bom, Profissional), com "? ? ? ?";
- os prints reais do Pregão Aberto tiveram o nome da carta coberto ("? ? ? ? ?") e a carta revelada virou "👑 LENDA REVELADA!" sem rosto
  (`compoe.mjs` gera os `a-pa*.png` a partir dos `z-pa*.png`);
- no fim: "🪙 MOEDAS SÓ DO JOGO · SEM APOSTA" (o robô do Meta às vezes confunde leilão com aposta).

Gerar: `node compoe.mjs` (se mudar os prints) → `node render.mjs` →
`ffmpeg -framerate 30 -i frames/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 ../pregao-anuncio-limpo.mp4`.
Quando a narração nova chegar: medir as pausas (`ffmpeg -af silencedetect=noise=-30dB:d=0.12`), trocar o `DUR` do `video.html`,
renderizar de novo e juntar o áudio (`-i narracao.mp3 -c:a aac -shortest`).

| Cena | Tempo | Tela | Fala |
|---|---|---|---|
| 1 | 4,6 s | Duas cartas de lenda cobertas | "Qual lenda do futebol você quer no seu time?" |
| 2 | 5,3 s | Logo | "No Leilão Legends, o primeiro jogo de leilão do futebol, não tem um jeito só de dar lance." |
| 3 | 7,6 s | Os 5 modos | "Tem envelope cego, Tocaia, envelope único, leilão de clubes… e o mais quente de todos: o Pregão Aberto." |
| 4 | 4,4 s | Lance subindo | "Uma carta por vez, com o lance aberto na frente de todo mundo." |
| 5 | 3,3 s | Carta coberta | "A carta vem coberta: craque ou perna de pau?" |
| 6 | 4,2 s | Relógio + martelo | "Ninguém cobriu? Dou-lhe uma… dou-lhe duas… vendido!" |
| 7 | 2,4 s | Vira: lenda | "E a carta vira… era lenda!" |
| 8 | 4,6 s | Galeria colorida | "Tem lenda, craque, promessa… e muita resenha no mesmo pregão." |
| 9 | 5,6 s | 36 amigos + carreira V→A | "Joga com até 36 amigos na mesma sala online… ou na carreira, subindo da várzea até a Série A." |
| 10 | 8,0 s | Final | "Leilão Legends. É grátis, é no celular e as moedas são só do jogo. Chama a turma e bora pro pregão!" |

## ✍️ Texto do anúncio (sem nome de jogador, clube ou competição)
**Texto principal (3 versões):**
1. Qual lenda do futebol você quer no seu time? 🔨 No Leilão Legends você monta seu time num leilão contra os amigos — com moedas do jogo, sem aposta nenhuma. Grátis e no celular! ⚽
2. O primeiro jogo de leilão do futebol! 🔨 Envelope cego, Tocaia ou Pregão Aberto: a carta vem coberta e só vira no martelo. Joga com a galera na mesma sala ou encara a carreira da várzea até a Série A. Grátis! 🏆
3. Dou-lhe uma… dou-lhe duas… VENDIDO! 🔨 Monte seu time no leilão e prove pros amigos quem entende de bola. Leilão Legends: grátis, direto no celular. 📱

**Títulos:** O primeiro jogo de leilão do futebol · Monte seu time no leilão 🔨 · Chama a turma pro pregão
**Descrição:** Grátis · Moedas só do jogo · leilaolegends.com
**Botão:** Jogar (ou Saiba mais) · **Link:** https://leilaolegends.com

Cuidados que valem pra qualquer anúncio nosso: não escrever nome de jogador real, de clube nem "Copa do Mundo/Champions/Libertadores"
no texto; não usar "aposta", "ganhe dinheiro", "prêmio em dinheiro"; deixar claro que as moedas são do jogo.
