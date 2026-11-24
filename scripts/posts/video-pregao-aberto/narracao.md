# 🎙️ Reels "Pregão Aberto" (24/11) — mesmo formato do "primeiro jogo de leilão do futebol"
Pedido do Diego: mostrar que o jogo tem vários modos de leilão, puxar o Pregão Aberto e mostrar as cartas de lenda
(Neymar Santos 2011, Ronaldo Fenômeno Inter 1998…). Cartas = `CollectibleCard` de verdade (tiradas do jogo), prints REAIS
de uma Partida Rápida no Pregão Aberto (lance subindo, "dou-lhe uma, duas", carta virando lenda).

Gerar: `node render.mjs` + `ffmpeg -framerate 30 -i frames/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 ../pregao-aberto-reels.mp4`.
Quando o áudio dele chegar: medir as pausas (silencedetect) e trocar o `DUR` do `video.html`.

| Cena | Tempo | Tela | Fala |
|---|---|---|---|
| 1 | 5,0 s | Cartas Neymar e Ronaldo | "Neymar de 2011… Ronaldo Fenômeno… quanto você pagaria por eles?" |
| 2 | 5,5 s | Logo | "No Leilão Legends, o primeiro jogo de leilão do futebol, não tem um jeito só de dar lance." |
| 3 | 7,0 s | Os 5 modos | "Tem envelope cego, Tocaia, envelope único, leilão de clubes… e o mais quente de todos: o Pregão Aberto." |
| 4 | 5,0 s | Lance subindo | "Uma carta por vez, com o lance aberto na frente de todo mundo." |
| 5 | 4,8 s | Carta coberta | "E a carta vem coberta: você não sabe se é craque ou perna de pau." |
| 6 | 6,5 s | Relógio + martelo | "Cada lance zera o relógio. Ninguém cobriu? Dou-lhe uma… dou-lhe duas… vendido!" |
| 7 | 3,8 s | Vira lenda | "E aí a carta vira… era lenda!" |
| 8 | 6,5 s | Galeria de lendas | "Neymar, Ronaldo, Messi, Ronaldinho, Maradona, Cristiano… todo mundo no mesmo pregão." |
| 9 | 6,0 s | Final | "Leilão Legends. É grátis e é no celular. Chama a turma e bora pro pregão!" |
