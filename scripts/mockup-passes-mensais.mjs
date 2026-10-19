// 🎟️ MOCKUP · PASSES (19/10, Diego, print da caixa "Hoje você já criou a sua sala"): *"pensei em criar um novo embaixo do de
// 4,90… um de 9,90 mensal liberado quantas salas quisesse. Da mesma forma no botão manual do modo carreira também devesse ter
// três botões assim após o cara apertar em manual. Faça os mockups"*.
// uso: node scripts/mockup-passes-mensais.mjs → scripts/mockups/passes-mensais.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#16130f;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px}
h1{font:700 26px Oswald;text-transform:uppercase;margin:0 0 4px;color:#F4ECD6}.sub{margin:0 0 18px;font-weight:700;color:rgba(244,236,214,.65)}
.cols{display:flex;gap:26px;align-items:flex-start}.col{width:400px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:12px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.caixa{background:#FBF0C9;border-radius:18px;padding:16px 16px 14px;border:3px solid #0C0C0C;box-shadow:4px 4px 0 #000}
.caixa h3{font:700 21px Oswald;text-transform:uppercase;margin:0 0 6px}
.caixa p{margin:0 0 12px;font-size:15px;line-height:1.35}
.bt{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;font:700 17px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:14px;padding:12px 10px;box-shadow:3px 3px 0 #000;margin-bottom:10px;position:relative}
.ouro{background:linear-gradient(90deg,#FFD84D,#F2B705 60%,#FFE27A)}
.branco{background:#fff}
.roxo{background:linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0);color:#fff;overflow:hidden}.roxo:after{content:'';position:absolute;top:0;bottom:0;left:-40%;width:30%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);left:58%}
.novo{position:absolute;top:-11px;right:12px;font:700 10px Oswald;letter-spacing:.08em;background:#E8503A;color:#fff;border:2px solid #0C0C0C;border-radius:7px;padding:1px 7px}
.peq{display:block;font:500 11px system-ui;text-transform:none;font-weight:700;opacity:.8;margin-top:1px}
.nota{font-size:12.5px;font-weight:700;line-height:1.4;color:rgba(244,236,214,.8);margin-top:12px}
.ctrl{background:#0C0C0C;border:3px solid #FFC400;border-radius:16px;padding:12px;margin-bottom:14px}
.ctrl b{font:700 13px Oswald;color:#FFC400;letter-spacing:.06em}
.seg{display:flex;margin-top:8px;border:3px solid #0C0C0C;border-radius:12px;overflow:hidden}
.seg span{flex:1;text-align:center;font:700 15px Oswald;padding:9px}
</style></head><body>
<h1>🎟️ Passe mensal — salas e Modo Manual</h1>
<p class="sub">Os três botões: o plano (pra sempre) · o avulso de hoje · e o NOVO mensal de R$ 9,90.</p>
<div class="cols">
 <div class="col"><span class="tag">1 · CRIAR SALA (ONLINE)</span>
  <div class="caixa">
   <h3>🏟️ Hoje você já criou a sua sala</h3>
   <p>Dá pra criar 1 sala por dia — amanhã libera outra. Mas <b>entrar em qualquer sala aberta é sempre de graça</b>: é só escolher uma em "Salas abertas".</p>
   <div class="bt ouro">👑 Criar quantas quiser · ver os planos</div>
   <div class="bt branco">🎟️ Ou 3 salas extras · R$ 4,90</div>
   <div style="position:relative"><span class="novo" style="z-index:2">NOVO</span><div class="bt roxo"><span style="text-align:center">🗓️ Salas à vontade · R$ 9,90/mês<span class="peq">cria quantas quiser por 30 dias · + 💎 cor roxa Promessa</span></span></div></div>
  </div>
  <p class="nota">O roxo é o novo. Quem joga todo dia sai mais barato que ficar comprando 3 salas toda hora.<br>💎 Enquanto o passe vale, o nome fica <b>roxo brilhante</b> (o tier Promessa) em todo canto: sala, chat, lista de técnicos.</p>
  <div style="margin-top:12px;display:flex;gap:10px;align-items:center"><span style="font:700 15px Oswald;border:2px solid #0C0C0C;border-radius:10px;padding:6px 12px;color:#fff;background:linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0);box-shadow:0 0 12px rgba(139,92,246,.8),2px 2px 0 #000">💎 BUTINAS FC</span><span style="font-size:12px;font-weight:700;color:rgba(244,236,214,.8)">← como o nome aparece com o passe</span></div>
 </div>
 <div class="col"><span class="tag">2 · MODO MANUAL (CARREIRA)</span>
  <div class="ctrl"><b>🎮 CONTROLE DA PARTIDA</b>
   <div class="seg"><span style="background:#FFC400">⚡ Auto</span><span style="background:#fff;border-left:3px solid #0C0C0C">🔒 Manual</span></div>
  </div>
  <div class="caixa">
   <h3>🎮 Modo Manual</h3>
   <p>No manual você <b>acelera, pula e assiste</b> os jogos no seu ritmo. Escolha como quer liberar:</p>
   <div class="bt ouro">⭐ Manual pra sempre · ver os planos</div>
   <div class="bt branco">⚡ Manual por 1 dia · R$ 4,90</div>
   <div style="position:relative"><span class="novo" style="z-index:2">NOVO</span><div class="bt roxo"><span style="text-align:center">🗓️ Manual o mês todo · R$ 9,90/mês<span class="peq">30 dias, em todas as carreiras · + 💎 cor roxa Promessa</span></span></div></div>
  </div>
  <p class="nota">Aparece quando a pessoa aperta o 🔒 Manual. A temporada continua rodando no Auto, nada trava.<br>💎 O passe do manual também deixa o nome <b>roxo brilhante</b> enquanto vale.</p>
 </div>
</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 880, height: 700 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/passes-mensais.png', fullPage: true }); await b.close()
console.log('scripts/mockups/passes-mensais.png')
