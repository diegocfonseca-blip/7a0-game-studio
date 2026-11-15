# Vídeo de lançamento do mapa (15/11)
- Resultado: `scripts/posts/mapa-lancamento.mp4` (1080×1920, 32 s, sem música — pôr a música no próprio Instagram).
- Fotos REAIS do mapa: `shots4.mjs` (vite em 127.0.0.1:4199, página `qa-presidencia-complexo-3d.html`, esconde os botões antes de fotografar).
- Montagem: `video.html` (cenas, textos, animação) + `render.mjs` (quadro a quadro) + `ffmpeg -framerate 30 -i frames/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 19`.
- Não promete carro (negociação de veículos está "em breve").
