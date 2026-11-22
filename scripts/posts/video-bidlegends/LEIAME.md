# 🏀 Reels de lançamento do BidLegends (19/11)
Dois vídeos (1080×1920, ~28 s, sem som — a música entra no Instagram): PT e EN. Cenas em `video.html` (`?l=pt|en`).
`node scripts/posts/video-bidlegends/render.mjs pt` (e `en`) → `frames-pt/`, depois:
`ffmpeg -framerate 30 -i scripts/posts/video-bidlegends/frames-pt/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 bidlegends-lancamento-pt.mp4`
⚠️ Sem logo da NBA nem de franquia (só nome de jogador · time · ano, que é o que a carta do jogo mostra). `leilao.png` = print do leilão de verdade.
`home.png` é a arte da home e TEM logo da NBA nos banners — não usar em post.
