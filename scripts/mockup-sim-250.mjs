// ─── 📊 CARTAZ DO ACHADO: 250 temporadas simuladas (24/08) ───────────────────
// Resumo visual do relatório `docs/ideias-250-temporadas.md` pro Diego bater o
// olho no celular. Os números vêm da simulação com o motor real do jogo.
//   node scripts/mockup-sim-250.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'sim-250.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const linha = (rot, a, b, c, destaque) => `
<tr style="background:${destaque ? '#FFF6DE' : '#fff'}">
  <td style="padding:7px 9px;font-weight:800;font-size:11px;border-top:1px solid rgba(0,0,0,.1)">${rot}</td>
  <td style="padding:7px 4px;text-align:center;${OSW};font-size:13px;border-top:1px solid rgba(0,0,0,.1);color:${GREEN}">${a}</td>
  <td style="padding:7px 4px;text-align:center;${OSW};font-size:13px;border-top:1px solid rgba(0,0,0,.1)">${b}</td>
  <td style="padding:7px 4px;text-align:center;${OSW};font-size:13px;border-top:1px solid rgba(0,0,0,.1);color:${RED}">${c}</td>
</tr>`

const ideia = (n, emoji, tit, txt, cor) => `
<div style="background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:11px 12px;margin-bottom:10px;border-left:9px solid ${cor}">
  <div style="display:flex;gap:8px;align-items:baseline">
    <span style="${OSW};font-size:15px;color:${cor}">${n}</span>
    <span style="${OSW};font-size:14.5px;text-transform:uppercase;line-height:1.15">${emoji} ${tit}</span>
  </div>
  <p style="margin:4px 0 0;font-weight:700;font-size:11.5px;line-height:1.45;color:rgba(12,12,12,.78)">${txt}</p>
</div>`

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#F4ECD6;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:22px}
.f{width:440px;margin:0 auto}
.topo{background:linear-gradient(150deg,#1c1c1e,#0C0C0C 60%,#26221a);border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:15px;color:#fff;text-align:center}
.topo .tag{display:inline-block;background:${GOLD};color:${INK};${OSW};font-size:10px;padding:3px 10px;border-radius:999px;border:2px solid ${INK};text-transform:uppercase}
.topo h1{${OSW};font-size:30px;line-height:1.02;text-transform:uppercase;margin:9px 0 0;color:${GOLD}}
.topo p{font-weight:600;font-size:12px;line-height:1.45;color:#EDE7D3;margin:8px 0 0}
.rot{${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(12,12,12,.45);margin:20px 0 8px}
.card{background:#fff;border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};overflow:hidden}
.card .cab{background:${INK};color:#fff;${OSW};font-size:12.5px;text-transform:uppercase;padding:8px 12px}
table{width:100%;border-collapse:collapse}
th{padding:6px 4px;font-size:9.5px;${OSW};text-transform:uppercase;background:#F4ECD6;border-bottom:2.5px solid ${INK}}
.frase{background:#FDECEA;border:3px solid ${RED};border-radius:14px;padding:11px 13px;font-weight:800;font-size:12px;line-height:1.45;margin-top:12px}
.mini{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.mini div{flex:1;min-width:120px;background:#fff;border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 ${INK};padding:9px 10px}
.mini b{display:block;${OSW};font-size:19px}
.mini span{font-weight:700;font-size:10px;line-height:1.3;color:rgba(12,12,12,.65)}
</style>
<div class="f">
  <div class="topo">
    <span class="tag">🔬 250 temporadas no motor real</span>
    <h1>O jogo acaba<br>na 3ª temporada</h1>
    <p>Rodei a carreira 250 temporadas, três vezes (elenco forte, médio e fraco). O que a monotonia é, em número:</p>
  </div>

  <p class="rot">① O mesmo jogo, três elencos, 250 anos cada</p>
  <div class="card">
    <div class="cab">📊 O que muda conforme o elenco que você monta</div>
    <table>
      <thead><tr><th style="text-align:left;padding-left:9px">&nbsp;</th><th>💪 forte</th><th>😐 médio</th><th>😟 fraco</th></tr></thead>
      <tbody>
        ${linha('Títulos', '109', '17', '19', true)}
        ${linha('Temporadas na Série A', '247', '5', '0', true)}
        ${linha('Quedas', '0', '58', '110', true)}
        ${linha('Posição média', '2,4º', '10,5º', '9,5º', false)}
        ${linha('Caixa no fim', '15.870', '1.475', '1.310', false)}
      </tbody>
    </table>
  </div>

  <div class="frase">🎯 <b>O diagnóstico:</b> com elenco forte você sobe pra Série A e <b>nunca mais cai</b> — 247 temporadas seguidas, zero quedas. Com elenco médio ou fraco vira <b>elevador</b>: sobe e cai 110 vezes e <b>nunca</b> pisa na Série A. Não existe caminho do meio: quem montou um bom time UMA vez está feito pra sempre.</div>

  <div class="mini">
    <div><b>75%</b><span>dos títulos da Série A ficaram com só 2 clubes em 250 anos</span></div>
    <div><b>55%</b><span>dos jogos decididos por 1 gol — a PARTIDA tem emoção, a temporada é que não</span></div>
  </div>
  <div class="mini">
    <div><b>8 × 1</b><span>goleada é 8 vezes mais provável a favor do que contra</span></div>
    <div><b>+63 🪙</b><span>por temporada, e a caixa <b>nunca</b> cai — dinheiro sem risco</span></div>
  </div>

  <p class="rot">② As três ideias que eu faria primeiro</p>
  ${ideia('1', '👴', 'O tempo passa', 'Jogador ganha idade, cai de nível e um dia <b>pendura as chuteiras</b> — com despedida no jornal e camisa no museu do clube. Ninguém fica forte pra sempre, e o elenco vira história.', ROXO)}
  ${ideia('2', '🪑', 'A diretoria te demite', 'A meta já existe no patrocínio; falta a consequência. Não bateu <b>duas temporadas seguidas</b> → você é mandado embora e recebe propostas de outros clubes. Recomeço com história, não game over.', RED)}
  ${ideia('3', '😈', 'O Rival', 'O jogo elege sozinho quem mais te tirou título como <b>rival eterno</b>: clássico no calendário, provocação na véspera, zoeira no jornal e um troféu só entre vocês. Estatística vira personagem.', GREEN)}

  <p class="rot">③ E mais sete no relatório</p>
  <div class="card" style="padding:11px 13px;background:#fff">
    <p style="margin:0;font-weight:700;font-size:11.5px;line-height:1.6">
      <b>4.</b> Rivais que crescem e encolhem (mata o elevador) · <b>5.</b> Dinheiro com destino e risco · <b>6.</b> Jornal com memória ("10 anos sem perder pro Zorra FC") · <b>7.</b> Desafios de temporada · <b>8.</b> A várzea pra todo mundo · <b>9.</b> A zebra tem que morder · <b>10.</b> Taça regional no meio do ano.
    </p>
  </div>
  <p style="text-align:center;font-weight:800;font-size:10.5px;color:rgba(12,12,12,.5);margin-top:14px;line-height:1.5">Relatório inteiro: <b>docs/ideias-250-temporadas.md</b><br>Nada foi implementado — é pesquisa pra você escolher. ⚽🔨</p>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 484, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
