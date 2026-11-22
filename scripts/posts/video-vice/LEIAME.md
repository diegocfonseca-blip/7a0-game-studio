# 🌴 Reels do Vice City (19/11)
Cenas em `video.html` (1080×1920, ~26 s, sem som — a música entra no Instagram). Gera os quadros com `node scripts/posts/video-vice/render.mjs` (sai em `frames/`) e junta com:
`ffmpeg -framerate 30 -i scripts/posts/video-vice/frames/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 vice-city-reels.mp4`
