// ─── 📢 MOCKUP: o aviso de VERSÃO NOVA na home ───────────────────────────────
// Pedido do Diego (11/09): *"coloque um banner com a atualização que fizemos.
// Quando a pessoa fechar não deve aparecer mais — pra todos isso. Além disso
// pede pra atualizar pra versão nova que tem muitas novidades. Talvez alguma
// imagem, você escolhe. Lembrando que depois de fechar não aparece mais pra
// ele também"*.
//
// São DUAS opções pra ele escolher ANTES de virar código (regra da casa:
// nada visual entra sem OK):
//   A) FAIXA FIXA no topo — aparece na hora que abre, sem rolar a tela
//   B) CARTÃO na home, logo acima dos botões de modo — maior, com os escudos
//
// O fundo é o print REAL da home (o pregão ilustrado), pra ver como fica de
// verdade. Os escudos são os .webp que já estão no jogo.
//
//   node scripts/mockup-banner-atualizar.mjs [--saida banner-atualizar.png]
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'banner-atualizar.png')
const HOME = arg('--home', '')

const b64 = p => readFileSync(p).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const webp = p => `data:image/webp;base64,${b64(p)}`
const png = p => `data:image/png;base64,${b64(p)}`

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const ESC = ['leitedeverdade', 'bagreswallst', 'sodeussabe'].map(n => `src/escalacao/img/${n}-escudo.webp`).filter(existsSync).map(webp)

const fundo = HOME && existsSync(HOME) ? png(HOME) : ''
const tela = (rotulo, conteudo, topo) => `
  <div style="text-align:center">
    <p style="${OSW};font-size:20px;text-transform:uppercase;margin:0 0 10px;letter-spacing:.06em">${rotulo}</p>
    <div style="position:relative;width:430px;height:900px;border:4px solid ${INK};border-radius:26px;overflow:hidden;box-shadow:6px 6px 0 ${INK};background:#12131a">
      ${fundo ? `<img src="${fundo}" style="position:absolute;top:0;left:0;width:430px;display:block">` : ''}
      <div style="position:absolute;left:0;right:0;${topo}">${conteudo}</div>
    </div>
  </div>`

// ── A) faixa fixa no topo ──────────────────────────────────────────────────
const faixa = `
  <div style="background:${GOLD};border-bottom:4px solid ${INK};padding:9px 12px;display:flex;align-items:center;gap:10px">
    <span style="font-size:22px;line-height:1">🔨</span>
    <div style="flex:1;min-width:0;text-align:left">
      <p style="${OSW};font-size:13.5px;text-transform:uppercase;margin:0;line-height:1.1">Tem versão nova do jogo</p>
      <p style="font-size:11px;font-weight:700;color:rgba(12,12,12,.62);margin:1px 0 0;line-height:1.2">um monte de coisa nova esperando você</p>
    </div>
    <span style="${OSW};font-size:12px;background:${GREEN};color:#fff;border:2px solid ${INK};border-radius:999px;padding:6px 12px;white-space:nowrap">ATUALIZAR</span>
    <span style="${OSW};font-size:18px;color:rgba(12,12,12,.55);padding:0 2px">✕</span>
  </div>`

// ── B) cartão na home, acima dos botões de modo ────────────────────────────
const cartao = `
  <div style="margin:0 14px;background:${CREME};border:4px solid ${INK};border-radius:20px;box-shadow:4px 4px 0 ${INK};padding:14px 14px 12px;position:relative">
    <span style="position:absolute;top:8px;right:12px;${OSW};font-size:20px;color:rgba(12,12,12,.45)">✕</span>
    <div style="display:flex;align-items:center;gap:10px">
      <span style="${OSW};font-size:11px;text-transform:uppercase;background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:3px 10px;letter-spacing:.06em">novidades</span>
    </div>
    <p style="${OSW};font-size:22px;text-transform:uppercase;margin:8px 0 0;line-height:1.05">Tem versão nova<br>do jogo 🔨</p>
    <p style="font-size:13px;font-weight:700;color:rgba(12,12,12,.65);margin:7px 0 0;line-height:1.35">
      Clubes novos no baralho, o online de cara nova, o Olheiro pra sondar jogador e mais.
      Toque em atualizar pra pegar tudo.</p>
    <div style="display:flex;gap:8px;margin:12px 0 0;align-items:center">
      ${ESC.map(e => `<img src="${e}" style="height:44px;display:block">`).join('')}
      <span style="font-size:11px;font-weight:700;color:rgba(12,12,12,.5);line-height:1.2">clubes que<br>entraram agora</span>
    </div>
    <div style="margin-top:12px;background:${GREEN};border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:11px;text-align:center">
      <span style="${OSW};font-size:16px;color:#fff;text-transform:uppercase">🔄 Atualizar agora</span>
    </div>
    <p style="font-size:11px;font-weight:700;color:rgba(12,12,12,.5);margin:8px 0 0;text-align:center">
      fechou no ✕, não aparece mais pra você</p>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  html,body{margin:0;background:${CREME};font-family:Oswald,sans-serif;color:${INK}}
  .folha{padding:34px 36px 30px;display:inline-block}
</style><body><div class="folha">
  <p style="${OSW};font-size:34px;text-transform:uppercase;margin:0 0 4px">Aviso de versão nova — escolha o formato</p>
  <p style="font-size:15px;font-weight:700;color:rgba(12,12,12,.6);margin:0 0 24px">
    Nos dois: aparece pra TODO mundo, o ✕ fecha e <b>não volta mais naquele aparelho</b>,
    e o botão recarrega o jogo já na versão nova.</p>
  <div style="display:flex;gap:40px;align-items:flex-start">
    ${tela('A · faixa fixa no topo', faixa, 'top:0')}
    ${tela('B · cartão na home', cartao, 'top:556px')}
  </div>
  <p style="font-size:14px;font-weight:700;color:rgba(12,12,12,.6);margin:22px 0 0;max-width:900px;line-height:1.5">
    <b>A</b> — vê na hora que abre, sem rolar a tela; ocupa pouco e some com um toque.<br>
    <b>B</b> — maior, cabe explicar o que mudou e mostrar os escudos dos clubes novos; fica logo acima
    dos botões de jogar, então quem rola pra escolher o modo passa por ele.
  </p>
</div></body>`

const arquivo = '/tmp/mockup-banner.html'
writeFileSync(arquivo, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1060, height: 1120 }, deviceScaleFactor: 2 })
await p.goto('file://' + arquivo)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(300)
const el = await p.$('.folha')
await el.screenshot({ path: SAIDA })
await b.close()
console.log('mockup:', SAIDA)
