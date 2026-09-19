// 📱🖥️ COMO A TELA DA SALA ESTÁ ORGANIZADA NOS DOIS TAMANHOS (18/09, fim do dia).
//
// Diego: *"mande me o mockup… estamos falando só do visual dos móveis, né, porque
// desktop tava ótimo já. Já as frases da zoeira e etc pode também ter no desktop.
// O que tô falando é organizar apenas — que lá é diferente do móvel. Enfim, não sei
// o que acha… depois mande mockup dos dois, como que é"*.
//
// ⚠️ Isto NÃO é proposta: é o retrato do que JÁ ESTÁ NO AR. As posições vieram da
// bancada com a CSS do build (scripts/… bancada), não de chute.
// Rodar: node scripts/mockup-sala-dois.mjs [saida.png]
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/sala-dois.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D'

const bl = (emoji, nome, alt, cor, tinta = '#fff') => `
  <div style="background:${cor};color:${tinta};border:2.5px solid ${INK};border-radius:9px;height:${alt}px;
       display:flex;align-items:center;gap:7px;padding:0 9px;font-weight:900;font-size:12px">
    <span style="font-size:15px">${emoji}</span><span>${nome}</span></div>`

// 📱 o celular: UMA FILA. a ordem decide o que você vê primeiro
const CELULAR = `
<div style="display:flex;flex-direction:column;gap:7px">
  ${bl('🟢', 'Placar ao vivo (mascote no gol)', 74, '#22352a')}
  ${bl('⚔️', 'Próximo jogo · 🧱 ⚖️ 🔥 lado a lado', 46, GOLD, INK)}
  ${bl('📣', 'Zoeira: o giro da rodada', 40, '#7C3AED')}
  ${bl('🏆', 'A TABELA', 118, VERDE)}
  ${bl('📺', 'Outros jogos da rodada', 58, '#8a6d00')}
  ${bl('🧭', 'barra: jogos · números · elenco · 📚 · ⚙️', 30, '#fff', INK)}
</div>`

// 🖥️ o monitor: DUAS COLUNAS. nada espera a vez
const DESKTOP = `
<div style="display:flex;flex-direction:column;gap:7px">
  ${bl('🟢', 'Placar ao vivo — faixa larga, mascote MAIOR', 74, '#22352a')}
  ${bl('🔖', 'abas: jogos · estatísticas · elenco', 26, '#fff', INK)}
  ${bl('📺', 'Outros jogos da rodada (faixa cheia)', 52, '#8a6d00')}
  <div style="display:flex;gap:7px;align-items:flex-start">
    <div style="flex:1.9">${bl('🏆', 'A TABELA', 172, VERDE)}</div>
    <div style="flex:1;display:flex;flex-direction:column;gap:7px">
      ${bl('⚔️', 'Próximo + tática', 78, GOLD, INK)}
      ${bl('📣', 'Zoeira', 60, '#7C3AED')}
    </div>
  </div>
</div>`

const col = (rot, sub, dentro, nota, larg) => `
  <div style="flex:${larg}">
    <div style="display:inline-block;background:${INK};color:${GOLD};font-weight:900;font-size:12px;letter-spacing:1px;
         text-transform:uppercase;padding:5px 12px;border-radius:8px;margin-bottom:3px">${rot}</div>
    <p style="font-size:12px;font-weight:700;color:#8a8266;margin:0 2px 9px">${sub}</p>
    <div style="background:${CREME};border:3px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:11px">${dentro}</div>
    <p style="font-size:13px;font-weight:700;margin:10px 2px 0;line-height:1.5;color:#5f5848">${nota}</p>
  </div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{font-family:Oswald,system-ui;color:${INK};background:${CREME};width:1180px;padding:30px}
  h1{font-size:44px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .g{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:14px 18px;font-size:16px;font-weight:700;margin:13px 0 22px;line-height:1.45}
  .par{display:flex;gap:26px;align-items:flex-start}
  .cx{border:3px solid ${INK};background:#fff;border-radius:14px;box-shadow:4px 4px 0 ${INK};
      padding:16px 19px;margin-top:22px;font-size:15px;font-weight:700;line-height:1.6}
  .cx b{color:${VERDE}}
  .seg{border:3px solid ${VERDE};background:#EAF5EE;border-radius:14px;padding:15px 19px;margin-top:14px;
       font-size:15px;font-weight:700;line-height:1.55}
  .seg b{color:${VERDE}}
</style>

<h1>A SALA ONLINE, <span class="g">NOS DOIS TAMANHOS</span></h1>
<div class="lead">Isto não é proposta — é o <b>retrato do que já está no ar</b>, com as posições medidas na
bancada. E respondendo a sua pergunta: <b>sim, os dois são diferentes de propósito</b>, e eu acho que tem que
ser mesmo. O porquê está embaixo.</div>

<div class="par">
  ${col('📱 celular', 'uma fila só — você rola', CELULAR,
    'No celular tudo <b>espera a vez</b>. Então a ordem é tudo: o que muda agora vem primeiro, e os outros jogos — que crescem de altura conforme sai gol — ficam por último, onde não empurram mais nada.', 1)}
  ${col('🖥️ monitor', 'duas colunas — nada espera', DESKTOP,
    'No monitor a tabela e o próximo jogo aparecem <b>ao mesmo tempo</b>, lado a lado. Aqui não existe "primeiro" e "depois" — então a ordem quase não importa, e a faixa dos outros jogos pode ficar em cima sem atrapalhar ninguém.', 1.45)}
</div>

<div class="cx">
  🤔 <b>"Não sei o que acha" — acho que diferente está certo, e é por isso:</b><br>
  📱 O celular é uma <b>fila</b>. Só cabe uma coisa por vez, então quem vem antes rouba a atenção — e o que
  tem altura variável (os outros jogos, que crescem com a lista de gols) desalinha tudo que vem depois. Foi
  exatamente o que você pegou hoje.<br>
  🖥️ O monitor é uma <b>mesa</b>. A tabela e o próximo jogo cabem lado a lado, então nada precisa esperar a
  vez — e sobra largura pra faixa dos outros jogos ficar em cima, onde ela é vista antes.<br>
  ⚠️ <b>Forçar os dois iguais só teria dois finais:</b> ou o monitor passa a desperdiçar metade da tela pra
  imitar a fila do celular, ou o celular tenta imitar a mesa e espreme tudo. <b>Os dois perdem.</b>
</div>

<div class="seg">
  🎤 <b>E a zoeira vale nos DOIS, você está certo.</b> Ela não é layout, é <b>conteúdo</b> — o mesmo giro roda
  no celular e no monitor. Hoje ele já tem <b>10 assuntos</b> em vez de 4: 🧤 o que não toma gol · 🕳️ a zaga
  que virou peneira · ⏱️ o gol no último suspiro · 🪑 o lanterna que acordou · 📉 o tombo na tabela ·
  💤 a rodada sem gol nenhum — além dos 4 de sempre (líder, artilheiro, zebra, goleada).<br>
  👉 E dá pra ir mais longe, nos dois tamanhos do mesmo jeito: <b>várias frases por assunto</b> (hoje cada um
  tem uma só, então repete) e <b>citar os amigos pelo nome</b>. Essa segunda é cutucar gente de verdade —
  só faço com o seu OK.
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
