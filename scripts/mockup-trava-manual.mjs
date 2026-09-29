// ─── ⏭ MOCKUP: A TELA DA TRAVA DO MODO MANUAL (Diego 29/09) ─────────────────
//
// Contexto (registros de 30 dias): 1.422 pessoas bateram na trava do ⏭/velocidade
// da carreira e só 49 copiaram o Pix do Craque. É a porta por onde quase todo mundo
// chega — e a tela de hoje é texto + preço. Diego: *"curtinha: a prévia dos
// controles funcionando, a nota aparecendo, o preço e um botão só"*.
//
// Regras dele que valem aqui: NÍVEL (não "nota"/"overall"); olheiro = "achar jogador
// fora do leilão, de nível até Craque"; sem contagem de vagas.
// ⚠️ SÓ DESENHO — nada disto está no jogo.
//   node scripts/mockup-trava-manual.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'trava-manual.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'
const G_BEGE = 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'
const HOLO = `background-image:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.7) 48%,transparent 62%);background-size:250% 250%;background-position:40% 40%`

const carta = (nome, nivel) => `
<div style="position:relative;overflow:hidden;width:86px;background:${G_PRATA};border:2.5px solid ${INK};border-radius:10px;box-shadow:3px 3px 0 ${INK};padding:6px;text-align:left">
  <div style="position:absolute;inset:0;${HOLO};pointer-events:none"></div>
  <span style="${OSW};background:${INK};color:#fff;border-radius:4px;font-size:8px;padding:1px 5px;position:relative">MEI</span>
  <div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.5);border:2px solid rgba(0,0,0,.28);margin:6px auto;display:flex;align-items:center;justify-content:center;${OSW};font-size:14px;position:relative">${nome[0]}</div>
  <p style="margin:0;${OSW};font-size:10.5px;line-height:1.1;position:relative">${nome}</p>
  <p style="margin:3px 0 0;position:relative;display:flex;align-items:center;gap:4px"><span style="${OSW};font-size:15px;background:#fff;border:2px solid ${INK};border-radius:6px;padding:0 5px">${nivel}</span><span style="font-size:7.5px;font-weight:800;opacity:.7;line-height:1">NÍVEL</span></p>
</div>`
const cartaCega = nome => `
<div style="width:86px;background:${G_BEGE};border:2.5px solid ${INK};border-radius:10px;box-shadow:3px 3px 0 ${INK};padding:6px;text-align:left;opacity:.85">
  <span style="${OSW};background:${INK};color:#fff;border-radius:4px;font-size:8px;padding:1px 5px">MEI</span>
  <div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.5);border:2px solid rgba(0,0,0,.28);margin:6px auto;display:flex;align-items:center;justify-content:center;${OSW};font-size:14px">${nome[0]}</div>
  <p style="margin:0;${OSW};font-size:10.5px;line-height:1.1">${nome}</p>
  <p style="margin:3px 0 0;display:flex;align-items:center;gap:4px"><span style="${OSW};font-size:15px;background:#fff;border:2px solid ${INK};border-radius:6px;padding:0 5px;color:rgba(0,0,0,.35)">??</span><span style="font-size:7.5px;font-weight:800;opacity:.7;line-height:1">NÍVEL</span></p>
</div>`
const botao = (t, on = false) => `<span style="${OSW};font-size:12px;border:2.5px solid ${INK};border-radius:8px;padding:5px 9px;background:${on ? INK : '#fff'};color:${on ? '#fff' : INK};box-shadow:${on ? 'none' : `2px 2px 0 ${INK}`}">${t}</span>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#cfc8b4;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:20px 0}
.fone{width:430px;margin:0 auto;background:${CREME};border:3px solid ${INK};border-radius:20px;overflow:hidden}
.topo{background:${INK};color:#fff;padding:12px 15px;display:flex;align-items:center;gap:10px}
.topo .t{${OSW};font-size:17px;text-transform:uppercase;color:${GOLD}} .topo .x{margin-left:auto;border:2px solid rgba(255,255,255,.35);border-radius:9px;padding:2px 9px;${OSW};font-size:13px}
.corpo{padding:16px 15px 18px}
h1{${OSW};font-size:30px;line-height:.95;text-transform:uppercase;margin:0 0 6px} h1 b{color:${GREEN}}
.sub{margin:0;font-weight:700;font-size:12.5px;line-height:1.4;color:rgba(12,12,12,.7)}
.vit{background:#fff;border:3px solid ${INK};border-radius:15px;box-shadow:4px 4px 0 ${INK};padding:11px 12px;margin-top:13px}
.vit .rot{margin:0 0 8px;${OSW};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(12,12,12,.55)}
.preco{display:flex;align-items:center;gap:10px;background:${G_PRATA};border:3px solid ${INK};border-radius:15px;box-shadow:4px 4px 0 ${INK};padding:11px 13px;margin-top:14px;position:relative;overflow:hidden}
.preco:before{content:'';position:absolute;inset:0;${HOLO}}
.preco .n{${OSW};font-size:20px;text-transform:uppercase;position:relative} .preco .p{margin-left:auto;text-align:right;position:relative}
.preco .p b{display:block;${OSW};font-size:24px;line-height:1} .preco .p small{display:block;font-weight:800;font-size:9px;text-transform:uppercase;letter-spacing:.06em;opacity:.8}
.cta{display:block;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:13px;box-shadow:4px 4px 0 ${INK};${OSW};font-size:17px;text-align:center;text-transform:uppercase;padding:14px 10px;margin-top:13px}
.passos{display:flex;gap:6px;margin-top:9px}
.passos div{flex:1;background:#fff;border:2px solid ${INK};border-radius:10px;padding:6px 6px;font-weight:800;font-size:9.5px;line-height:1.3;text-align:center}
.passos b{display:block;${OSW};font-size:13px}
.nota{text-align:center;font-weight:700;font-size:10px;color:rgba(12,12,12,.5);margin:12px 0 0;line-height:1.5}
.link{text-align:center;margin-top:10px;font-weight:800;font-size:11px;text-decoration:underline}
</style><body><div class="fone">
<div class="topo"><span class="t">⏭ Pular rodada</span><span class="x">✕</span></div>
<div class="corpo">
  <h1>Quer acelerar?<br><b>Isso é do Craque.</b></h1>
  <p class="sub">Pause, acelere, pule a rodada — <b>a carreira no seu ritmo</b>. E ainda vê o nível dos seus jogadores.</p>

  <div class="vit">
    <p class="rot">🎮 os controles que ficam seus</p>
    <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
      ${botao('¼×')}${botao('½×')}${botao('Normal')}${botao('2×', true)}${botao('4×')}
    </div>
    <div style="display:flex;gap:5px;margin-top:7px">${botao('⏸ PAUSAR')}${botao('⏭ PULAR RODADA')}${botao('▶ PRÓXIMA')}</div>
    <p style="margin:8px 0 0;font-size:10.5px;font-weight:700;color:rgba(12,12,12,.6)">👆 no 2× a rodada inteira passa em segundos. No ⏭ ela pula.</p>
  </div>

  <div class="vit">
    <p class="rot">🔎 o nível do jogador aparece — até Craque</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:10px">
      <div style="text-align:center">${cartaCega('Zé Craque')}<p style="margin:5px 0 0;font-weight:800;font-size:9px;color:rgba(12,12,12,.5)">hoje</p></div>
      <span style="${OSW};font-size:22px">→</span>
      <div style="text-align:center">${carta('Zé Craque', 82)}<p style="margin:5px 0 0;font-weight:800;font-size:9px;color:${GREEN}">com o Craque</p></div>
    </div>
  </div>

  <div class="vit" style="padding:9px 12px 10px">
    <p class="rot">⭐ e vem junto</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${['⭐ nome prata brilhando na sala', '🕵️ Olheiro: acha jogador fora do leilão (até Craque)', '💾 4 carreiras salvas', '📲 grupo VIP com o Diego'].map(t => `<span style="font-weight:800;font-size:10.5px;border:2px solid ${INK};border-radius:999px;padding:4px 9px;background:${CREME}">${t}</span>`).join('')}
    </div>
  </div>

  <div class="preco"><span class="n">⭐ Craque</span><span class="p"><b>R$ 19,90</b><small>paga uma vez · é seu pra sempre</small></span></div>
  <a class="cta">Liberar o Craque · copiar Pix</a>
  <div class="passos">
    <div><b>1</b>paga o Pix no app do banco</div>
    <div><b>2</b>manda o comprovante no @leilaolegendscom</div>
    <div><b>3</b>libera em até 24h · nome prata ⭐ na sala</div>
  </div>
  <p class="nota">Não muda a força de ninguém — só o ritmo e o que você enxerga. No online o tempo é igual pra todos.</p>
  <p style="margin:12px 0 6px;text-align:center;${OSW};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(12,12,12,.55)">quer mais que isso?</p>
  <div style="display:flex;gap:8px">
    <span style="flex:1;background:linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70);border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};${OSW};font-size:13px;text-align:center;text-transform:uppercase;padding:10px 6px">👑 Ver o Lenda<br><span style="font-size:9px;font-weight:800;opacity:.75">R$ 39,90 · vê até Lenda</span></span>
    <span style="flex:1;background:${INK};color:${GOLD};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};${OSW};font-size:13px;text-align:center;text-transform:uppercase;padding:10px 6px">🖋 Ver o Batismo<br><span style="font-size:9px;font-weight:800;opacity:.75">seu clube no jogo</span></span>
  </div>
</div></div></body>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 470, height: 900 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(300)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
