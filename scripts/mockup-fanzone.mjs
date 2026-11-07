#!/usr/bin/env node
// 🎨 MOCKUP — FAN ZONE NO MAPA 3D (07/11). Diego: *"fazer uma fan zone… andar pelas ruas… entrar no estádio… ver os jogos
// escolher a cadeira… ver outros usuários"* → *"faz aí no meu usuário"*. Etapa 1 (só a conta dele): o presidente ANDA pelo mapa,
// entra pelo portão da torcida e escolhe a cadeira pra assistir o jogo da carreira. Fundos = prints DE VERDADE do mapa
// (scripts/mockups/fanzone/*.png, capturados da página de QA); por cima, só o que seria novo (controle, botões, marcações).
// uso: node scripts/mockup-fanzone.mjs → scripts/mockups/fanzone.png
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const png = f => `data:image/png;base64,${readFileSync(`scripts/mockups/fanzone/${f}.png`).toString('base64')}`
const RUA = png('m-city-street'), PORTAO = png('m-entrance'), ARQ = png('m-stands')

const joy = `<div class="joy"><i></i></div>`
const tela = (fundo, dentro) => `<div class="tela"><div class="mapa" style="background-image:url(${fundo})">${dentro}</div></div>`

const t1 = tela(RUA, `
  <div class="topo"><b>🚶 PASSEIO PELO BAIRRO</b><span>✕ sair</span></div>
  <div class="eu" style="left:150px;top:300px"><div class="boneco"></div><em>VOCÊ</em></div>
  <div class="placa" style="left:40px;top:120px">🏟️ Estádio · 120 m ➜</div>
  ${joy}
  <div class="acoes"><button>🏃 Correr</button></div>`)

const t2 = tela(PORTAO, `
  <div class="topo"><b>🚶 PASSEIO PELO BAIRRO</b><span>✕ sair</span></div>
  <div class="eu" style="left:160px;top:330px"><div class="boneco"></div><em>VOCÊ</em></div>
  <div class="cartao"><b>🎟️ PORTÃO DA TORCIDA</b><small>Hoje: Neymarzetti × Chelsão · 21h</small><button>ENTRAR NO ESTÁDIO</button></div>
  ${joy}`)

const t3 = tela(ARQ, `
  <div class="topo"><b>🏟️ ESCOLHA SUA CADEIRA</b><span>✕ sair</span></div>
  <div class="cad livre" style="left:28px;top:70px">LIVRE</div>
  <div class="cad livre" style="left:118px;top:62px">LIVRE</div>
  <div class="cad sel" style="left:205px;top:66px">✔ SUA</div>
  <div class="cad livre" style="left:290px;top:72px">LIVRE</div>
  <div class="setor">🟢 Setor da casa · fileira 12</div>
  <button class="grande">SENTAR E ASSISTIR</button>`)

const t4 = tela(ARQ, `
  <div class="topo"><b>📺 ASSISTINDO DA ARQUIBANCADA</b><span>✕ sair</span></div>
  <div class="placar"><span>NEYMARZETTI</span><b>2 × 1</b><span>CHELSÃO</span><i>67'</i></div>
  <div class="eu" style="left:170px;top:250px"><em>VOCÊ</em></div>
  <div class="acoes2"><button>📣 Gritar gol</button><button>🎥 Câmera do jogo</button><button>🚶 Levantar</button></div>`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#E9DFC3;font-family:system-ui,sans-serif;color:#0C0C0C;padding:26px;width:1640px}
h1{font-family:Oswald;font-weight:700;font-size:30px;text-transform:uppercase}
.sub{font-size:14px;opacity:.7;margin:4px 0 18px}
.wrap{display:flex;gap:22px}
.col{width:372px}.col h2{font-family:Oswald;font-weight:700;font-size:16px;text-transform:uppercase;margin-bottom:8px}
.tela{border:4px solid #000;border-radius:26px;box-shadow:4px 4px 0 #000;overflow:hidden;background:#000}
.mapa{position:relative;width:364px;height:600px;background-size:364px 655px;background-position:0 -38px}
.topo{position:absolute;left:8px;right:8px;top:8px;display:flex;align-items:center;background:#fff;border:3px solid #000;border-radius:12px;padding:6px 10px;box-shadow:3px 3px 0 #000}
.topo b{font-family:Oswald;font-weight:700;font-size:14px}.topo span{margin-left:auto;font-size:12px;font-weight:700}
.joy{position:absolute;left:18px;bottom:22px;width:104px;height:104px;border-radius:50%;background:rgba(255,255,255,.35);border:3px solid rgba(0,0,0,.6)}
.joy i{position:absolute;left:30px;top:30px;width:44px;height:44px;border-radius:50%;background:#FFC400;border:3px solid #000;box-shadow:2px 2px 0 #000}
.eu{position:absolute;text-align:center}
.boneco{width:26px;height:58px;margin:0 auto;border-radius:12px 12px 6px 6px;background:linear-gradient(#8a5a3c 0 22%,#FFC400 22% 62%,#1f2a44 62%);border:2px solid #000}
.eu em{display:inline-block;margin-top:3px;font-style:normal;font-family:Oswald;font-weight:700;font-size:11px;background:#FFC400;border:2px solid #000;border-radius:8px;padding:0 6px;box-shadow:2px 2px 0 #000}
.placa{position:absolute;background:#1B7A3D;color:#fff;border:2.5px solid #000;border-radius:10px;padding:4px 8px;font-family:Oswald;font-weight:700;font-size:13px;box-shadow:2px 2px 0 #000}
.acoes{position:absolute;right:16px;bottom:40px}
.acoes button,.acoes2 button{font-family:Oswald;font-weight:700;font-size:13px;background:#fff;border:3px solid #000;border-radius:12px;padding:8px 12px;box-shadow:3px 3px 0 #000}
.cartao{position:absolute;left:14px;right:14px;top:70px;background:#fff;border:4px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;padding:10px 12px}
.cartao b{font-family:Oswald;font-weight:700;font-size:16px;display:block}.cartao small{font-size:12px;opacity:.7;display:block;margin:2px 0 8px}
.cartao button,.grande{width:100%;font-family:Oswald;font-weight:700;font-size:15px;background:#1B7A3D;color:#fff;border:3px solid #000;border-radius:12px;padding:10px;box-shadow:3px 3px 0 #000}
.grande{position:absolute;left:14px;right:14px;bottom:20px;width:auto}
.cad{position:absolute;font-family:Oswald;font-weight:700;font-size:11px;border:2.5px solid #000;border-radius:9px;padding:3px 7px;box-shadow:2px 2px 0 #000}
.cad.livre{background:rgba(255,255,255,.9)}.cad.sel{background:#FFC400}
.setor{position:absolute;left:14px;bottom:78px;background:#fff;border:3px solid #000;border-radius:10px;padding:5px 9px;font-weight:700;font-size:12px}
.placar{position:absolute;left:50%;transform:translateX(-50%);top:58px;display:flex;gap:8px;align-items:center;background:#0C0C0C;color:#fff;border:3px solid #000;border-radius:12px;padding:6px 12px;font-family:Oswald;font-weight:700;font-size:13px;white-space:nowrap}
.placar b{color:#FFC400;font-size:20px}.placar i{font-style:normal;color:#FFC400;font-size:12px}
.acoes2{position:absolute;left:10px;right:10px;bottom:18px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.obs{margin-top:10px;font-size:12.5px;background:#fff;border:2px dashed #0005;border-radius:12px;padding:8px 10px}
</style></head><body>
<h1>🚶 Fan Zone no mapa 3D — etapa 1 (só na sua conta)</h1>
<p class="sub">Fundos = prints de verdade do mapa de hoje. Por cima, só o que é novo. O boneco é um dos bonecos 3D do mapa, com a pele e a roupa nas cores do seu presidente.</p>
<div class="wrap">
<div class="col"><h2>1 · Andar pelas ruas</h2>${t1}<p class="obs">Controle no canto (arrasta o dedo). A placa mostra pra onde fica o estádio. No PC, setas/WASD.</p></div>
<div class="col"><h2>2 · Chegar no portão</h2>${t2}<p class="obs">Chegou perto do portão da torcida: aparece o jogo do dia e o botão de entrar.</p></div>
<div class="col"><h2>3 · Escolher a cadeira</h2>${t3}<p class="obs">Toca numa cadeira livre do setor da casa e senta. Os outros torcedores são os bonecos que o mapa já tem.</p></div>
<div class="col"><h2>4 · Assistir o jogo dali</h2>${t4}<p class="obs">A câmera fica no seu lugar na arquibancada, com o placar em cima. "Câmera do jogo" volta pra câmera de sempre.</p></div>
</div></body></html>`

const dir = resolve(tmpdir(), 'mock-fanzone'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true })
writeFileSync(`${dir}/m.html`, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1640, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${dir}/m.html`); await p.waitForTimeout(400)
await p.screenshot({ path: 'scripts/mockups/fanzone.png', fullPage: true })
await b.close()
console.log('ok → scripts/mockups/fanzone.png')
