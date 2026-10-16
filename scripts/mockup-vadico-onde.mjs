// 🚗 ONDE A VADICO VEÍCULOS APARECE NO JOGO (16/10, Diego: "mostre a imagem do apresentado por como fica e todas imagens de
// onde aparece o patrocínio"). Gera: a faixa larga pro aviso (4 lugares lado a lado) e a versão grande, um lugar por quadro.
// Sem logo oficial ainda: a marca vai escrita (🚗 VADICO VEÍCULOS) nas cores do jogo — nada de cor inventada pra empresa.
// uso: node scripts/mockup-vadico-onde.mjs → scripts/mockups/vadico-faixa.png + scripts/mockups/vadico-onde-aparece.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${b64(`src/escalacao/img/${f}`)}`
const MARCA = `<span class="marca">🚗 VADICO VEÍCULOS</span>`
const css = `${FONTES}*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C}
.marca{display:inline-flex;align-items:center;gap:4px;background:#0C0C0C;color:#FFC400;font-weight:700;border:2px solid #FFC400;border-radius:8px;padding:1px 8px;letter-spacing:.04em;white-space:nowrap}
.q{border:4px solid #000;border-radius:18px;box-shadow:4px 4px 0 #000;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.rot{background:#FFC400;border-bottom:3px solid #000;font-weight:700;text-transform:uppercase;padding:5px 10px;font-size:15px}
.ban{position:relative;flex:1;background:url(${img('online-champions-v25.webp')}) center/cover}
.ban::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.8))}
.ban .t{position:absolute;left:12px;right:12px;bottom:12px;z-index:1;color:#fff}
.ban h2{margin:0;font-size:24px;line-height:1;text-transform:uppercase;text-shadow:2px 2px 0 #000}
.ban .ap{margin-top:6px;font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase}
.est{position:relative;flex:1;background:url(${img('online-estadio-v25.webp')}) center/cover}
.led{position:absolute;left:0;right:0;bottom:10px;height:24px;background:#0C0C0C;display:flex;align-items:center;gap:20px;padding-left:8px;white-space:nowrap;overflow:hidden}
.led span{color:#7CFF9B;font-weight:700;font-size:12px;letter-spacing:.12em;text-shadow:0 0 6px #3f3}
.plc{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-top:3px solid #000;background:#F4ECD6;font-weight:700;font-size:13px;text-transform:uppercase}
.gols{font-size:24px;border:3px solid #000;border-radius:9px;padding:0 8px;background:#fff}
.rodp{text-align:center;padding:5px;font-size:11px;font-weight:500;border-top:2px solid #000}
.jor{flex:1;background:#FBF7EC;padding:10px;font-family:Georgia,serif}
.jor .cab{text-align:center;border-bottom:3px double #000;font-family:Oswald;font-weight:700;font-size:24px;letter-spacing:.06em}
.jor .man{font-family:Oswald;font-weight:700;font-size:16px;text-transform:uppercase;margin:8px 0 4px;line-height:1.05}
.jor .fo{height:62px;background:url(${img('jornal-copa-v22.webp')}) center/cover;border:2px solid #000}
.anu{margin-top:8px;border:3px solid #000;border-radius:10px;background:#fff;padding:7px;display:flex;gap:8px;align-items:center}
.anu .lg{width:40px;height:40px;border-radius:9px;background:#0C0C0C;border:2px solid #FFC400;display:grid;place-items:center;font-size:22px;flex:none}
.anu b{font-family:Oswald;font-size:13px;text-transform:uppercase;display:block}.anu small{font-size:10.5px}
.vit{flex:1;padding:10px;background:#F4ECD6}
.vit h3{margin:0 0 6px;font-size:16px;text-transform:uppercase}
.mc{display:flex;gap:8px;background:#fff;border:3px solid #000;border-radius:12px;padding:8px;position:relative}
.mc .lg{width:44px;height:44px;border-radius:10px;background:#0C0C0C;border:2px solid #FFC400;display:grid;place-items:center;font-size:24px;flex:none}
.mc b{font-size:14px;text-transform:uppercase}.mc p{margin:2px 0 4px;font-family:Georgia,serif;font-size:10.5px;line-height:1.3;color:#333}
.ch{display:inline-block;font-weight:700;font-size:10px;border:2px solid #000;border-radius:6px;padding:0 5px;background:#F4ECD6;margin-right:3px}`
const quadros = {
  comp: `<div class="q"><div class="rot">🏆 Nome da competição</div><div class="ban"><div class="t"><h2>⭐ Champions Legends</h2><div class="ap">apresentada por ${MARCA}</div></div></div></div>`,
  led: `<div class="q"><div class="rot">🏟️ LED e placar</div><div class="est"><div class="led"><span>🚗 VADICO VEÍCULOS</span><span>LEILÃO LEGENDS</span><span>🚗 VADICO VEÍCULOS</span></div></div>
    <div class="plc"><span>Stocco FC</span><span class="gols">2 x 1</span><span>Manfré FC</span></div><div class="rodp">placar oferecido por ${MARCA}</div></div>`,
  jor: `<div class="q"><div class="rot">📰 O MARTELO</div><div class="jor"><div class="cab">O MARTELO</div><div class="man">Stocco FC levanta a taça!</div><div class="fo"></div>
    <div class="anu"><span class="lg">🚗</span><div><b>Vadico Veículos</b><small>Veículo com garantia e documento em nome da loja.</small></div></div></div></div>`,
  vit: `<div class="q"><div class="rot">🏪 Vitrine dos patrocinadores</div><div class="vit"><h3>🤝 Quem faz o jogo acontecer</h3>
    <div class="mc"><span class="lg">🚗</span><div><b>Vadico Veículos</b><p>Empresa familiar com 45 anos de mercado. Lojas em Itaguaí e na Barra da Tijuca.</p><span class="ch">📷 @vadicoveiculos</span><span class="ch">🌐 vadicoveiculos.com.br</span></div></div></div></div>`,
}
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
// 1) faixa larga pro aviso: 4 quadros lado a lado
let p = await b.newPage({ viewport: { width: 1200, height: 460 }, deviceScaleFactor: 2 })
await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}body{background:transparent}.row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:6px 10px 12px 6px;height:460px}</style></head><body><div class="row">${Object.values(quadros).join('')}</div></body></html>`)
await p.waitForTimeout(500); await p.screenshot({ path: 'scripts/mockups/vadico-faixa.png', omitBackground: true }); await p.close()
// 2) versão grande: 2×2 com título
p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}body{padding:20px}h1{margin:0;font-size:30px;text-transform:uppercase}.s{margin:2px 0 14px;font-weight:500}
.g{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}.g .ban,.g .est{min-height:270px;flex:none}.g .jor,.g .vit{flex:none}</style></head><body><h1>🚗 Onde a Vadico Veículos aparece</h1><p class="s">Novo parceiro do Leilão Legends</p><div class="g">${Object.values(quadros).join('')}</div></body></html>`)
await p.waitForTimeout(500); await p.screenshot({ path: 'scripts/mockups/vadico-onde-aparece.png', fullPage: true }); await b.close()
console.log('ok')
