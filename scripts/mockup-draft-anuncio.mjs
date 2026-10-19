// 📋🥁 MOCKUP — O ANÚNCIO DO DRAFT COM SUSPENSE (19/10). Diego: *"o suspense tem q ser grande no anúncio"*.
// A escolha não aparece de uma vez: a sala inteira vê as pistas caindo uma a uma (posição → categoria → de onde ele é) e
// só no fim a carta vira. Cada pista deixa o pessoal sofrer: quem precisava daquela posição já começa a suar.
//   node scripts/mockup-draft-anuncio.mjs  →  scripts/mockups/draft-anuncio.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const barra = (n) => `<div class="barra">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= n ? 'on' : ''}"></span>`).join('')}</div>`
const quadro = (n, tempo, titulo, miolo, rodape) => `<div class="q"><div class="tag">${n} · ${tempo}</div><div class="fone">
  <div class="top"><small>NOITE DO DRAFT · 2ª ESCOLHA</small><b>FABULOUS EC 👑</b></div>
  <div class="palco">${miolo}</div>
  <div class="tit">${titulo}</div>
  ${barra(n)}
  <div class="rod">${rodape}</div>
</div></div>`

const verso = (cls, txt) => `<div class="verso ${cls}"><div class="vin">${txt}</div></div>`
const pistas = (p) => `<div class="pistas">${['ATA', '👑 LENDA', '🇧🇷 anos 90'].map((t, i) => `<span class="${i < p ? 'on' : ''}">${i < p ? t : '?'}</span>`).join('')}</div>`

const q1 = quadro(1, '0s', '🥁 ESCOLHA FEITA!', `${verso('', '?')}${pistas(0)}`, '<span class="emo">😬 K9 FC</span><span class="emo">🙏 Tocaia SC</span>')
const q2 = quadro(2, '2s', 'É UM… <em>ATACANTE</em>', `${verso('', 'ATA')}${pistas(1)}`, '<span class="emo red">😰 K9 FC precisava de ATA</span>')
const q3 = quadro(3, '4s', '…E É <em>LENDA!</em>', `${verso('ouro', 'ATA')}${pistas(2)}`, '<span class="emo">😱 Chelsão</span><span class="emo">🔥 Fabulous</span>')
const q4 = quadro(4, '6s', 'BRILHOU NO <em>BRASIL</em> NOS ANOS 90', `${verso('ouro listra', 'ATA')}${pistas(3)}`, '<span class="emo red">🙏 "não é o Romário, não é o Romário…"</span>')
const q5 = quadro(5, '8s', 'COM A 2ª ESCOLHA… <em>ROMÁRIO!</em>', `<div class="frente"><div class="pos">ATA</div><div class="nome">ROMÁRIO</div><div class="clube">Vasco · 1993</div><div class="niv"><span>LENDA</span> 90–96</div><div class="carimbo">DRAFTADO!</div></div>`, '<span class="emo red">😭 K9 FC: "ERA O MEU!!"</span>')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:26px;width:1640px}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.65;font-size:14px}
.fila{display:flex;gap:14px;align-items:flex-start}
.q{width:306px}.tag{display:inline-block;font:700 14px Oswald;background:#0C0C0C;color:#FFC400;border-radius:9px;padding:3px 10px;margin-bottom:8px}
.fone{background:radial-gradient(circle at 50% 40%,#2a2140,#0c0c0c 70%);border:4px solid #0C0C0C;border-radius:26px;padding:12px;box-shadow:5px 5px 0 #0C0C0C;color:#fff;min-height:520px;display:flex;flex-direction:column;gap:10px}
.top{text-align:center}.top small{font:700 11px Oswald;letter-spacing:1.5px;color:#FFC400;display:block}.top b{font:700 22px Oswald}
.palco{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:280px}
.verso{width:170px;height:230px;border-radius:16px;border:4px solid #555;background:repeating-linear-gradient(45deg,#1a1a1a 0 12px,#242424 12px 24px);display:grid;place-items:center;box-shadow:0 0 0 rgba(0,0,0,0)}
.vin{font:700 54px Oswald;color:#FFC400;width:110px;height:150px;border:3px solid #FFC400;border-radius:12px;display:grid;place-items:center;background:#0C0C0C}
.verso.ouro{border-color:#FFC400;box-shadow:0 0 34px rgba(255,196,0,.85),0 0 80px rgba(255,196,0,.35)}
.verso.listra{background:repeating-linear-gradient(135deg,#111 0 18px,#f2f2f2 18px 24px,#111 24px 42px)}
.pistas{display:flex;gap:6px}.pistas span{font:700 13px Oswald;border:2px solid #555;border-radius:8px;padding:3px 8px;color:#777;background:#151515}
.pistas span.on{border-color:#0C0C0C;background:#FFC400;color:#0C0C0C}
.tit{font:700 22px Oswald;text-align:center;line-height:1.1;text-transform:uppercase}.tit em{font-style:normal;color:#FFC400}
.barra{display:flex;gap:4px}.barra span{flex:1;height:6px;border-radius:4px;background:#333}.barra span.on{background:#FFC400}
.rod{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}.emo{font:700 12px system-ui;background:#fff;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:999px;padding:3px 9px}.emo.red{background:#C2452F;color:#fff}
.frente{position:relative;width:240px;background:linear-gradient(160deg,#FFF7D6,#fff 60%);color:#0C0C0C;border:4px solid #0C0C0C;border-radius:16px;padding:16px 12px;text-align:center;box-shadow:0 0 40px rgba(255,196,0,.9),0 0 90px rgba(255,196,0,.4)}
.frente .pos{position:absolute;left:10px;top:10px;font:700 12px Oswald;background:#FFC400;border:2px solid #0C0C0C;border-radius:8px;padding:1px 7px}
.frente .nome{font:700 36px Oswald;margin-top:14px}.frente .clube{font-weight:700;opacity:.65;font-size:13px}
.frente .niv{display:inline-block;margin-top:8px;font:700 15px Oswald;background:#FFE79A;border:2px solid #0C0C0C;border-radius:9px;padding:3px 10px}.frente .niv span{color:#7C3AED;margin-right:6px}
.frente .carimbo{position:absolute;right:-14px;bottom:-16px;transform:rotate(-12deg);font:700 22px Oswald;color:#fff;background:#7C3AED;border:3px solid #0C0C0C;border-radius:10px;padding:2px 10px}
.leg{margin-top:20px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:12px 16px;box-shadow:4px 4px 0 #000;font-size:13.5px;font-weight:700;line-height:1.55}
</style></head><body>
<h1>🥁 Anúncio do draft · suspense em 5 tempos</h1>
<p class="sub">A escolha não aparece de uma vez: a sala inteira vê as pistas caindo, uma a cada 2 segundos, e só no fim a carta vira.</p>
<div class="fila">${q1}${q2}${q3}${q4}${q5}</div>
<div class="leg">① Escolha feita, carta coberta, rufar de tambor. ② Cai a 1ª pista: a <b>posição</b> — quem precisava de atacante já começa a suar. ③ A carta acende na <b>cor da categoria</b> (ouro = lenda). ④ Aparece <b>de onde ele é e a época</b>, e a carta ganha as <b>cores do clube</b>. ⑤ A carta vira: o nome, o clube, o ano. Enquanto isso, a sala manda as reações de sempre (😬 😱 🙏 😭). São ~10 segundos por escolha, só na noite do draft — o leilão não muda.</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1640, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/draft-anuncio.png', fullPage: true })
await b.close(); console.log('📸 scripts/mockups/draft-anuncio.png')
