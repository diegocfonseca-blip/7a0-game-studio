# 🎙️ Reels "Pregão Aberto" (24/11) — mesmo formato do "primeiro jogo de leilão do futebol"
Pedido do Diego: mostrar que o jogo tem vários modos de leilão, puxar o Pregão Aberto e mostrar as cartas de lenda
(Neymar Santos 2011, Ronaldo Fenômeno Inter 1998…). Cartas = `CollectibleCard` de verdade (tiradas do jogo), prints REAIS
de uma Partida Rápida no Pregão Aberto (lance subindo, "dou-lhe uma, duas", carta virando lenda).

Gerar: `node render.mjs` + `ffmpeg -framerate 30 -i frames/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 ../pregao-aberto-reels.mp4`.
Quando o áudio dele chegar: medir as pausas (silencedetect) e trocar o `DUR` do `video.html`.

Versão 2 (24/11, pedido do Diego): a carta que vira é o ZIDANE (Juventus 1998) — o print real tinha o Alex; o nome da
carta coberta e a carta revelada foram trocadas por cima do print (`z-*.png`, carta revelada = `CollectibleCard` do Zidane).
Menos espera até virar a carta, e cena nova: até 36 amigos na mesma sala + carreira da várzea à Série A.

| Cena | Tempo | Tela | Fala |
|---|---|---|---|
| 1 | 5,0 s | Cartas Neymar e Ronaldo | "Neymar de 2011… Ronaldo Fenômeno… quanto você pagaria por eles?" |
| 2 | 5,5 s | Logo | "No Leilão Legends, o primeiro jogo de leilão do futebol, não tem um jeito só de dar lance." |
| 3 | 7,0 s | Os 5 modos | "Tem envelope cego, Tocaia, envelope único, leilão de clubes… e o mais quente de todos: o Pregão Aberto." |
| 4 | 5,0 s | Lance subindo | "Uma carta por vez, com o lance aberto na frente de todo mundo." |
| 5 | 3,3 s | Carta coberta | "A carta vem coberta: craque ou perna de pau?" |
| 6 | 4,6 s | Relógio + martelo | "Ninguém cobriu? Dou-lhe uma… dou-lhe duas… vendido!" |
| 7 | 3,6 s | Vira: Zidane | "E a carta vira… era lenda!" |
| 8 | 6,0 s | Galeria de lendas | "Neymar, Ronaldo, Messi, Ronaldinho, Maradona, Cristiano… todo mundo no mesmo pregão." |
| 9 | 7,0 s | 36 amigos + carreira V→A | "Joga com até 36 amigos na mesma sala online… ou na carreira, subindo da várzea até a Série A." |
| 10 | 6,0 s | Final | "Leilão Legends. É grátis e é no celular. Chama a turma e bora pro pregão!" |
