// ─── 🅰️ MOCKUP DAS ASSISTÊNCIAS (24/08) ─────────────────────────────────────
// Os números aqui NÃO são inventados: saem de uma temporada de verdade rodada
// no motor do jogo (scripts/checa-assistencias.mjs audita as regras).
//   node scripts/mockup-assistencias.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'assistencias.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', AZUL = '#2F6BAE'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// dados REAIS da simulação (Série A e B de uma temporada rodada no motor)
const GARCONS = {
  A: [['Djalminha', 'Coliseu United', 21], ['Diego', 'Zênite United', 15], ['Mauro Silva', 'Soberano Nacional', 15], ['Rivaldo', 'Metrópole FC', 14], ['Zico', 'Real Bets', 13]],
  B: [['Alex', 'Meu Timão', 17, true], ['Gérson', 'Kombi United', 14], ['Juninho Paulista', 'Torta de Rã', 12], ['Deco', 'Napolitano', 11], ['Ganso', 'Ponte Branca', 10]],
}
const GOLS = [['Amoroso', 7, null], ['Amoroso', 54, 'Jardel'], ['França', 92, 'Casemiro'], ['Bismarck', 93, 'Jardel']]

const linhaG = ([nome, time, n, eu], i) => `
<tr style="border-top:1px solid rgba(0,0,0,.08);font-weight:600;${eu ? 'background:#FBE9E5;' : ''}">
  <td style="padding:3px 4px 3px 0;width:16px;color:rgba(0,0,0,.5);font-weight:800">${i + 1}</td>
  <td style="padding:3px 0">${i === 0 ? '🅰️ ' : ''}${nome}</td>
  <td style="padding:3px 0;color:${eu ? '#C2452F' : 'rgba(0,0,0,.7)'};font-weight:${eu ? 800 : 600}">${eu ? '👤 ' : ''}${time}</td>
  <td style="padding:3px 0;text-align:center;font-weight:900;width:30px;color:${AZUL}">${n}</td>
</tr>`

const bloco = (tag, cor, nome, linhas) => `
<div style="margin-bottom:10px">
  <div style="display:flex;align-items:center;gap:5px;margin:2px 0 4px">
    <span style="font-size:10px;font-weight:900;color:#fff;background:${cor};border-radius:5px;padding:1px 6px">${tag}</span>
    <span style="${OSW};font-size:12px">${nome}</span>
  </div>
  <table style="width:100%;font-size:12px;border-collapse:collapse">${linhas}</table>
</div>`

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#F4ECD6;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:22px}
.f{width:430px;margin:0 auto}
.rot{${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(12,12,12,.45);margin:20px 0 8px}
.card{background:#fff;border:3.5px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px}
.abas{display:flex;gap:6px;margin-bottom:10px}
.aba{flex:1;text-align:center;border:2.5px solid ${INK};border-radius:11px;padding:7px 2px;${OSW};font-size:10.5px;text-transform:uppercase;background:#fff;box-shadow:2px 2px 0 ${INK}}
.aba.on{background:${GOLD}}
.topo{background:linear-gradient(150deg,#1c1c1e,#0C0C0C 60%,#26221a);border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:14px;color:#fff;text-align:center}
.topo h1{${OSW};font-size:27px;line-height:1.05;text-transform:uppercase;margin:8px 0 0;color:${GOLD}}
.topo p{font-weight:600;font-size:12px;line-height:1.45;color:#EDE7D3;margin:8px 0 0}
.tag{display:inline-block;background:${GOLD};color:${INK};${OSW};font-size:10px;padding:3px 10px;border-radius:999px;border:2px solid ${INK};text-transform:uppercase}
.placar{background:#fff;border:3.5px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};overflow:hidden}
.placar .p{display:flex;align-items:center;justify-content:center;gap:12px;padding:11px;background:#F7F1DD;border-bottom:2.5px solid ${INK}}
.placar .p b{${OSW};font-size:15px}
.placar .n{${OSW};font-size:24px}
.gol{display:flex;justify-content:space-between;padding:5px 11px;font-size:10.5px;font-weight:800;border-top:1px solid rgba(0,0,0,.08)}
.gol .as{opacity:.62;font-weight:700;font-size:9.5px}
.fic{display:flex;align-items:center;gap:7px;border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:7px 10px;margin-bottom:7px;box-shadow:2px 2px 0 ${INK}}
.fic .pos{font-size:9px;color:rgba(0,0,0,.45);${OSW}}
.prova{background:#EAF7EE;border:3px solid ${GREEN};border-radius:14px;padding:11px 13px;font-weight:700;font-size:11.5px;line-height:1.5;margin-top:12px}
</style>
<div class="f">
  <div class="topo">
    <span class="tag">🅰️ novo na carreira</span>
    <h1>O gol tem pai.<br>Agora tem padrinho.</h1>
    <p>Todo gol do jogo passa a ter <b>quem deu o passe</b> — e o meião que ganha campeonato sem fazer gol finalmente tem número.</p>
  </div>

  <p class="rot">① No placar: quem fez e quem serviu</p>
  <div class="placar">
    <div class="p"><b>Prestígio FC</b><span class="n">3 × 1</span><b>Aurora Suprema</b></div>
    ${GOLS.map(([n, m, a]) => `<div class="gol"><span>⚽ <b>${n}</b> <span style="opacity:.6">${m > 90 ? `90+${m - 90}` : m}'</span>${a ? ` <span class="as">🅰️ ${a}</span>` : ''}</span>${!a ? '<span class="as">jogada individual</span>' : ''}</div>`).join('')}
  </div>
  <p style="font-weight:700;font-size:10.5px;color:rgba(12,12,12,.55);margin:7px 2px 0;line-height:1.45">☝️ Gol sem passe aparece como <b>jogada individual</b> — nunca fica um espaço vazio com cara de dado faltando. (Este jogo saiu da simulação de verdade.)</p>

  <p class="rot">② Aba nova no Rank: 🅰️ Garçons</p>
  <div class="abas"><div class="aba">⚽ Gols</div><div class="aba on">🅰️ Garçons</div><div class="aba">🥇 Local</div></div>
  <div class="card">
    <p style="${OSW};font-size:13px;margin:0 0 2px">🅰️ GARÇONS · TEMPORADA</p>
    <p style="font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 8px">Assistências da temporada atual — top 5 de cada série.</p>
    ${bloco('A', '#1B7A3D', 'Série A', GARCONS.A.map(linhaG).join(''))}
    ${bloco('B', '#2F6BAE', 'Série B', GARCONS.B.map(linhaG).join(''))}
    <p style="font-size:9.5px;font-weight:700;color:rgba(0,0,0,.4);margin:4px 0 0;text-align:center">Cerca de 3 em cada 4 gols saem de um passe; o resto é jogada individual, pênalti ou rebote.</p>
  </div>

  <p class="rot">③ No seu elenco: ⚽ e 🅰️ lado a lado</p>
  <div class="fic"><span class="pos">MEI</span><b style="font-size:12.5px">Alex</b><span style="font-size:10px;color:rgba(0,0,0,.45);font-weight:700">· Palmeiras</span><span style="margin-left:auto;display:flex;gap:8px"><span style="${OSW};font-size:10px;color:${GREEN}">⚽ 4</span><span style="${OSW};font-size:10px;color:${AZUL}">🅰️ 17</span></span></div>
  <div class="fic"><span class="pos">ATA</span><b style="font-size:12.5px">Amoroso</b><span style="font-size:10px;color:rgba(0,0,0,.45);font-weight:700">· Guarani</span><span style="margin-left:auto;display:flex;gap:8px"><span style="${OSW};font-size:10px;color:${GREEN}">⚽ 22</span><span style="${OSW};font-size:10px;color:${AZUL}">🅰️ 5</span></span></div>

  <div class="prova">🔒 <b>Auditado antes de subir</b> — 250 temporadas, <b>10.175 jogos</b> e <b>20.608 gols</b> conferidos:<br>
  ✅ nenhum jogo com 3+ gols e zero assistência (o teu medo)<br>
  ✅ nunca mais assistências do que gols<br>
  ✅ <b>nenhum placar mudou</b> — a assistência tem sorteio próprio e não encosta no dos gols<br>
  ✅ 74,7% dos gols com passe (no futebol de verdade é ~75%)</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 474, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
