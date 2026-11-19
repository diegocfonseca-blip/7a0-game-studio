# 🎙️ Narração do Reels do Vice City (19/11)
Cronometrada nas 8 cenas do `video.html` (2,8 · 2,8 · 3,6 · 3,0 · 3,2 · 3,6 · 3,6 · 3,8 s = 26,4 s). Tom: locutor de trailer, animado.

| Tempo | Cena | Fala |
|---|---|---|
| 0,0–2,8 | GTA 6 chegou | "O GTA 6 chegou… e o Leilão entrou no clima." |
| 2,8–5,6 | Novo modo | "Novo modo: VICE CITY!" |
| 5,6–9,2 | Cartas de golpe | "Pregão aberto com cartas de golpe: roubo, blitz, assalto, colete…" |
| 9,2–12,2 | Blitz | "O rival vai dar lance na lenda? BLITZ nele! Dez segundos parado." |
| 12,2–15,4 | Roubo | "Arrematou o Ronaldinho? ROUBARAM! E não pagaram nada." |
| 15,4–19,0 | Estrelas / BUSTED | "Cada golpe que você leva é uma estrela. Cinco estrelas… BUSTED! Perde os três melhores." |
| 19,0–22,6 | Print do jogo | "Olha como ficou: sala online, até dez amigos." |
| 22,6–26,4 | Final | "Cria tua sala no Vice City. Leilão Legends — joga agora!" |

Áudio: o gerador de voz não alcança os servidores de voz deste ambiente (rede bloqueada em 19/11). Gravar no celular ou usar o
"Texto para fala" do CapCut/Instagram (voz masculina PT-BR) colando cada fala no tempo da cena.

## ✅ Versão narrada pronta (19/11)
Voz `pt-BR-AntonioNeural` (edge-tts, +15% de velocidade), com o host `speech.platform.bing.com` liberado no ambiente. As cenas foram
esticadas pra caber a fala (`video-narrado.html`, 34,75 s). Saídas: `scripts/posts/vice-city-reels-narrado.mp4` e `vice-city-narracao.mp3`.
Regerar: `SSL_CERT_FILE=/root/.ccr/ca-bundle.crt edge-tts --proxy "$HTTPS_PROXY" --voice pt-BR-AntonioNeural --rate=+15% …` por fala,
`node scripts/posts/video-vice/render-narrado.mjs` e juntar com ffmpeg (adelay de cada fala no começo da cena).
