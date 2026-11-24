# 🎙️ Reels "O primeiro jogo de leilão do futebol" (24/11) — pra quem ainda não conhece o jogo
Mesmo estilo do Reels "GTA de graça" (celulares subindo, transições com pulo e flash), mas nas cores do jogo
(noite de estádio, dourado e verde). Prints REAIS do jogo: leilão cego da Partida Rápida, revelação, campo 2D,
estádio 3D, Central da carreira. O Diego vai narrar.

Gerar: `node render.mjs` e depois
`ffmpeg -framerate 30 -i frames/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 ../primeiro-leilao-reels.mp4`.
Quando o áudio dele chegar: medir as pausas (silencedetect) e trocar o `DUR` do `video.html`.

| Cena | Tempo | Tela | Fala |
|---|---|---|---|
| 1 | 4,2 s | Já imaginou? + 4 cartas de lenda | "Já imaginou montar o seu time dando lance em lendas do futebol?" |
| 2 | 4,3 s | Logo + selo 1º | "Esse é o Leilão Legends: o primeiro jogo de leilão do futebol." |
| 3 | 4,2 s | 💰 100 + time vazio | "Funciona assim: você começa com cem moedas e um time vazio." |
| 4 | 5,0 s | GOL LAT ZAG MEI ATA | "Em cada posição, um pregão: goleiro, lateral, zagueiro, meia e atacante." |
| 5 | 5,5 s | Lance às cegas 🔒 | "E o lance é às cegas: você decide quanto paga, e ninguém vê o lance de ninguém." |
| 6 | 6,0 s | A revelação | "Aí vem a revelação: quem deu mais, leva. E às vezes a lenda escapa por uma moeda!" |
| 7 | 7,5 s | Campo 2D + estádio 3D | "Time montado, a bola rola: no campo 2D ou no estádio 3D, com liga, copas, Libertadores e até Copa do Mundo." |
| 8 | 6,0 s | Salas online + carreira V→A | "Joga com os amigos nas salas online, ou na carreira, subindo da várzea até a Série A." |
| 9 | 6,0 s | Final | "Leilão Legends. É grátis e é no celular. Chama a turma e dá o seu lance!" |
