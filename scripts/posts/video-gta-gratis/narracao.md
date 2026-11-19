# 🎙️ Reels "GTA de graça" (19/11) — texto pra narração no ElevenLabs
Mesmo estilo do Reels do Vice City. Cenas em `video.html` (1080×1920), quadros com `node render.mjs`, juntar com
`ffmpeg -framerate 30 -i frames/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 ../gta-gratis-reels.mp4`.
Quando o Diego mandar o áudio: medir as pausas (silencedetect) e trocar o `DUR` do `video.html`, igual ao do Vice City.

| Cena | Tela | Fala |
|---|---|---|
| 1 | O GTA 6 chegou | "O GTA 6 chegou… e todo mundo só fala disso." |
| 2 | E o bolso? | "Mas e o bolso? Tá liso? Relaxa." |
| 3 | De graça | "E se existisse um jogo… de graça…" |
| 4 | Presidente e técnico | "…onde você é o presidente e o técnico do seu clube?" |
| 5 | Leilão de lendas | "Onde você monta o time num leilão de lendas do futebol, dando lance contra os seus amigos?" |
| 6 | Vice City | "E ainda com um gostinho de GTA: no modo Vice City, vale roubar, dar blitz… e até ir pra cadeia." |
| 7 | Celular | "Carreira, salas online… tudo no celular." |
| 8 | Final | "Leilão Legends. O jogo de leilão do futebol. E é cem por cento grátis. Joga agora!" |
