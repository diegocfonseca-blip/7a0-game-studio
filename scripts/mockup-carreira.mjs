// ─── 🪜 MOCKUPS "DEPOIS" DA CARREIRA (02/09) — a proposta visual da análise em docs/ux-carreira-150-partidas.md
// ─── 🪜 MOCKUPS "DEPOIS" DA CARREIRA (celular + desktop) ────────────────────
// Estilo da casa: creme #F4ECD6 · tinta #0C0C0C · dourado #FFC400 · verde #1B7A3D ·
// vermelho #E8503A · roxo #7C3AED · bordas 3-4px · sombras duras · Oswald.
// Cada mockup vira um PNG do tamanho do aparelho (390×844 @2x · 1440×900).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
// uso: node scripts/mockup-carreira.mjs [--pasta /tmp/mock-carreira]  (gera os PNGs "depois")
const OUT = (i => i > 0 ? process.argv[i + 1] : '/tmp/mock-carreira')(process.argv.indexOf('--pasta')); mkdirSync(OUT, { recursive: true })
const REPO = process.cwd()
const b64 = p => readFileSync(p).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`${REPO}/scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', PURPLE = '#7C3AED'
const CSS = `${FONTES}
*{box-sizing:border-box} html,body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:700}
.osw{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase}
.box{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK}}
.band{background:${INK};color:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK}}
.pill{display:inline-block;border:2px solid ${INK};border-radius:999px;padding:1px 8px;font-size:10px;font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase}
.btn{display:inline-flex;align-items:center;justify-content:center;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;padding:10px 12px}
.muted{color:rgba(12,12,12,.55)}
.row{display:flex;align-items:center;gap:8px}
.tab{display:flex;flex-direction:column;align-items:center;gap:2px;font-family:Oswald,sans-serif;font-weight:700;font-size:10px;letter-spacing:.06em;color:rgba(12,12,12,.5)}
.tab.on{color:${INK}}
.tbl{width:100%;border-collapse:collapse;font-size:11px}
.tbl td,.tbl th{padding:3px 4px;border-bottom:1px solid rgba(12,12,12,.08);text-align:left;white-space:nowrap}
.tbl th{font-family:Oswald,sans-serif;font-size:9.5px;letter-spacing:.06em;color:rgba(12,12,12,.5)}
.tbl td.n{text-align:right;font-variant-numeric:tabular-nums}
.me{background:#FFF1B8}
.g4{background:#E4F4E8} .z4{background:#FBE3DF}
.chip{display:inline-flex;align-items:center;gap:4px;border:2px solid ${INK};border-radius:8px;padding:2px 6px;font-size:10.5px;background:#fff}
.sel{position:absolute;top:-11px;left:12px;background:${RED};color:#fff;border:2px solid ${INK};border-radius:999px;padding:1px 9px;font-family:Oswald,sans-serif;font-weight:700;font-size:10px;text-transform:uppercase;box-shadow:2px 2px 0 ${INK}}
`
const esc = n => `<span style="display:inline-block;width:14px;height:14px;border-radius:4px;border:1.5px solid ${INK};background:${['#1B7A3D','#7C3AED','#E8503A','#2F6BAE','#FFC400','#0C0C0C','#8a6d1f','#5C8FD6'][n % 8]};vertical-align:-3px"></span>`
const jogos = [['Chuteira Rachada FC','Juventude do Churrasco'],['Unidos da Resenha','Espeto Corrido FC'],['Galáticos do Bairro','Meia-Boca FC'],['Neymarzetti','Descampado EC'],['Real Domingueira','Perna de Pau City'],['Marolados FC','Trave Torta EC'],['Barcelona da Vila','White Thigs do GuGu'],['Ressaca United','SC Ferrari'],['Atlético Pelada','Várzea Legends']]
const tabela = [['Nightfull FC',45],['Chuteira Rachada FC',44],['Neymarzetti',41],['Marolados FC',39],['Galáticos do Bairro',36],['SC Ferrari',35],['White Thigs do GuGu',33],['Real Domingueira',31],['Unidos da Resenha',30],['Barcelona da Vila',29],['Ressaca United',28],['Atlético Pelada',27],['Meia-Boca FC',26],['Trave Torta EC',25],['Juventude do Churrasco',24],['Descampado EC',22],['Perna de Pau City',21],['Várzea Legends',20],['Espeto Corrido FC',19],['Tigres do Asfalto',18]]
const linhaTab = (t, i, compacto) => `<tr class="${t[0] === 'Tigres do Asfalto' ? 'me' : i < 4 ? 'g4' : i >= 16 ? 'z4' : ''}"><td class="n muted">${i + 1}</td><td>${esc(i)} ${t[0]}</td><td class="n">${t[1]}</td>${compacto ? '' : `<td class="n muted">${20 - Math.floor(i / 3)}</td><td class="n muted">${i % 2 ? '+' : '-'}${(20 - i) % 9}</td>`}</tr>`

// ── A) CELULAR · JOGOS durante a rodada ─────────────────────────────────────
const celJogos = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
<div class="band" style="padding:9px 12px;display:flex;align-items:center;justify-content:space-between">
  <div><div class="osw" style="font-size:10px;color:${GOLD};letter-spacing:.08em">Temporada 1 · Várzea</div><div class="osw" style="font-size:22px;line-height:1">Rodada 20<span class="muted" style="color:rgba(255,255,255,.55);font-size:14px"> / 38</span></div></div>
  <div class="row" style="gap:6px"><span class="pill" style="background:#fff;color:${INK}">🏅 19º</span><span class="pill" style="background:${GOLD};color:${INK}">🪙 42</span></div>
</div>
<div style="height:6px;border:2px solid ${INK};border-radius:999px;margin:8px 2px 10px;background:#fff;overflow:hidden"><div style="width:45%;height:100%;background:${GOLD}"></div></div>
<div class="box" style="padding:0;overflow:hidden">
  <div style="background:#5a3a22;color:#fff;padding:5px 10px;font-size:11px" class="osw">🟢 Apitou o juiz · 2'</div>
  <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:10px 8px;gap:6px">
    <div style="text-align:center"><div style="width:38px;height:38px;margin:0 auto 4px;border-radius:10px;border:3px solid ${INK};background:${GREEN}"></div><div style="font-size:12px;line-height:1.1">Tigres do Asfalto</div><div class="muted" style="font-size:9px">VOCÊ</div></div>
    <div class="osw" style="font-size:34px;background:${INK};color:#fff;border-radius:12px;padding:2px 12px">0 × 0</div>
    <div style="text-align:center"><div style="width:38px;height:38px;margin:0 auto 4px;border-radius:10px;border:3px solid ${INK};background:#2F6BAE"></div><div style="font-size:12px;line-height:1.1">Juventude do Churrasco</div><div class="muted" style="font-size:9px">RIVAL</div></div>
  </div>
</div>
<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:7px;margin:9px 0">
  <div class="btn" style="background:#2F6BAE;color:#fff;font-size:14px">⏭️ Pular a rodada</div>
  <div class="btn" style="background:#fff;font-size:11px;padding:6px 8px">🎮 Manual <span class="pill" style="background:${GREEN};color:#fff;margin-left:5px">Apoie 🔒</span></div>
</div>
<div class="band" style="padding:7px 10px;display:flex;gap:8px;align-items:center;font-size:11.5px;font-weight:600"><span class="pill" style="background:${GOLD};color:${INK}">😤 Na cola</span><span style="flex:1">O <b>Nightfull FC</b> já sente o teu bafo — 2 pontos.</span></div>
<div class="box" style="margin-top:10px;padding:8px 10px 6px">
  <div class="row" style="justify-content:space-between;margin-bottom:5px"><span class="osw" style="font-size:12px">🌱 Outros jogos da Várzea</span><span class="muted" style="font-size:10px">rodada 20 · ao vivo</span></div>
  ${jogos.map(([a, b], i) => `<div style="display:grid;grid-template-columns:1fr auto 1fr;font-size:10.5px;padding:3px 0;border-bottom:1px solid rgba(12,12,12,.07);align-items:center"><span style="text-align:right">${a}</span><span class="pill" style="background:#E4F4E8;font-size:9px;margin:0 6px">${i % 3 ? '1 × 0' : '0 × 0'}</span><span>${b}</span></div>`).join('')}
</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:9px">
  ${['A', 'B', 'C', 'D'].map(d => `<div class="box" style="padding:7px 4px;text-align:center;box-shadow:2px 2px 0 ${INK}"><div class="osw" style="font-size:11px">Série ${d}</div><div class="muted" style="font-size:9px">10 jogos ▸</div></div>`).join('')}
</div>
<div style="position:absolute;left:0;right:0;bottom:66px;padding:0 10px"><div style="background:#FFF6DE;border:2px solid ${INK};border-radius:10px;padding:5px 10px;font-size:10.5px;display:flex;justify-content:space-between;align-items:center"><span>☁️ Carreira só neste aparelho</span><b style="color:${GREEN}">criar conta ›</b></div></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:60px;background:#fff;border-top:3px solid ${INK};display:flex;justify-content:space-around;align-items:center">
  ${[['📅', 'Jogos', 1], ['📋', 'Tabelas'], ['🛡️', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([i, t, on]) => `<div class="tab ${on ? 'on' : ''}"><span style="font-size:18px">${i}</span>${t}</div>`).join('')}
</div>`

// ── B) CELULAR · PRÉ-TEMPORADA (patrocínio + começar) ──────────────────────
const celPre = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
<div class="band" style="padding:9px 12px;display:flex;align-items:center;justify-content:space-between">
  <div><div class="osw" style="font-size:10px;color:${GOLD};letter-spacing:.08em">Temporada 1 · Várzea</div><div class="osw" style="font-size:22px;line-height:1">Começando…</div></div>
  <span class="pill" style="background:${GOLD};color:${INK}">🪙 42</span>
</div>
<div class="box" style="position:relative;margin-top:18px;padding:12px 11px 11px">
  <span class="sel">🔴 Sua vez · 1 decisão</span>
  <div class="osw" style="font-size:14px;margin-bottom:8px">🤝 Patrocínio da temporada</div>
  <div class="row" style="gap:6px;margin-bottom:6px"><span class="pill" style="background:${INK};color:#fff">Passo 1</span><span style="font-size:12px">Onde você quer chegar?</span></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">
    ${[['🛡️', 'Não cair', 'fora do Z4', '+2'], ['📈', 'Acesso', 'top 4', '+4', 1], ['👑', 'Campeão', 'liga ou copa', '+6']].map(([e, t, s, v, on]) => `<div style="border:3px solid ${INK};border-radius:12px;padding:8px 4px;text-align:center;background:${on ? GOLD : '#fff'};box-shadow:${on ? `3px 3px 0 ${INK}` : 'none'}"><div style="font-size:18px">${e}</div><div class="osw" style="font-size:12px">${t}</div><div class="muted" style="font-size:9px">${s}</div><div class="osw" style="font-size:13px;color:${GREEN};margin-top:3px">${v} 🪙</div></div>`).join('')}
  </div>
  <div style="border-top:2px dashed rgba(12,12,12,.18);margin:10px -11px"></div>
  <div class="row" style="gap:6px;margin-bottom:6px"><span class="pill" style="background:${INK};color:#fff">Passo 2</span><span style="font-size:12px">Quem estampa a camisa?</span></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">${['🍗 Espetinho do Baixinho', '🎨 Rei das Tintas', '🥤 Guaraná Craque'].map((m, i) => `<div style="border:3px solid ${INK};border-radius:12px;padding:9px 4px;text-align:center;font-size:10.5px;background:${i === 1 ? '#E6F3EA' : '#fff'}">${m}</div>`).join('')}</div>
</div>
<div class="btn" style="width:100%;margin-top:12px;background:${GREEN};color:#fff;font-size:17px;padding:13px">▶️ Começar a temporada</div>
<div class="muted" style="text-align:center;font-size:10px;margin-top:5px">Depois disso a rodada anda sozinha · 38 rodadas</div>
<div class="box" style="margin-top:12px;padding:8px 10px">
  <div class="row" style="justify-content:space-between"><span class="osw" style="font-size:12px">🌱 Várzea · sua divisão</span><span class="muted" style="font-size:10px">ver os 20 ▸</span></div>
  <table class="tbl" style="margin-top:4px"><tr><th>#</th><th>Time</th><th style="text-align:right">P</th></tr>${[['Tigres do Asfalto', 0], ['Neymarzetti', 0], ['Nightfull FC', 0], ['White Thigs do GuGu', 0], ['Marolados FC', 0], ['SC Ferrari', 0]].map((t, i) => linhaTab(t, i, true)).join('')}</table>
  <div class="muted" style="font-size:9.5px;margin-top:4px">🔥 seus 5 rivais estão na sua divisão nesta temporada</div>
</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:9px">${['A', 'B', 'C', 'D'].map(d => `<div class="box" style="padding:7px 4px;text-align:center;box-shadow:2px 2px 0 ${INK}"><div class="osw" style="font-size:11px">Série ${d}</div><div class="muted" style="font-size:9px">tabela ▸</div></div>`).join('')}</div>
<div class="muted" style="text-align:center;font-size:10px;margin-top:8px">💰 Quanto paga cada divisão? <b>Clube › Patrocínio</b></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:60px;background:#fff;border-top:3px solid ${INK};display:flex;justify-content:space-around;align-items:center">
  ${[['📅', 'Jogos', 1], ['📋', 'Tabelas'], ['🛡️', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([i, t, on]) => `<div class="tab ${on ? 'on' : ''}"><span style="font-size:18px">${i}</span>${t}</div>`).join('')}
</div>`

// ── F) CELULAR · CRIAR CARREIRA (setup) ─────────────────────────────────────
const celSetup = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:14px 12px 0}</style>
<div class="muted" style="font-size:12px">🏠 Voltar ao início</div>
<div class="osw" style="font-size:28px;line-height:1.05;margin-top:4px">🪜 Carreira · Várzea</div>
<div class="muted" style="font-size:12px;margin:4px 0 12px">Da Várzea até a Série A. Salva e continua depois.</div>
<div class="box" style="padding:12px 11px">
  <div class="osw" style="font-size:11px;letter-spacing:.06em">Nome do seu time</div>
  <div style="border:3px solid ${INK};border-radius:12px;padding:10px 12px;font-size:16px;color:rgba(12,12,12,.4);margin:5px 0 12px">Ex.: Bagres do Asfalto</div>
  <div class="osw" style="font-size:11px;letter-spacing:.06em">Formação</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:7px;margin:5px 0 12px"><div class="btn" style="background:${GOLD};padding:8px">4-3-3</div><div class="btn" style="background:#fff;box-shadow:none;padding:8px">4-4-2</div></div>
  <div class="osw" style="font-size:11px;letter-spacing:.06em">Rivais na sala (CPUs)</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:5px 0 4px">${[3, 5, 7, 9].map(n => `<div class="btn" style="background:${n === 5 ? PURPLE : '#fff'};color:${n === 5 ? '#fff' : INK};box-shadow:${n === 5 ? `3px 3px 0 ${INK}` : 'none'};padding:8px">${n}</div>`).join('')}</div>
  <div class="muted" style="font-size:10px">Mais rivais = mais gente brigando no leilão.</div>
</div>
<div class="box" style="margin-top:10px;padding:10px 11px">
  <div class="row" style="justify-content:space-between"><span class="osw" style="font-size:12px">🔥 Escolha seus rivais <span class="muted">(0/5)</span></span><span class="muted" style="font-size:10px">ou usar os padrões</span></div>
  <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">${['Neymarzetti', 'Nightfull FC', 'White Thigs do GuGu', 'Marolados FC', 'SC Ferrari', 'Murriz FC', 'Tôka10', 'Skyy FC', 'Vasco da Grana', 'Xurupitas FC', 'Al Takhadao FC', '+ 11 clubes ▸'].map(t => `<span class="chip" style="font-size:10px">${t}</span>`).join('')}</div>
</div>
<div class="btn" style="width:100%;margin-top:12px;background:${GREEN};color:#fff;font-size:17px;padding:13px">Avançar 🪜</div>
<div class="box" style="margin-top:10px;padding:8px 11px;background:#FFF6DE;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px">⚡ Como funciona a Carreira</span><span class="muted" style="font-size:11px">abrir ▾</span></div>
<div class="box" style="margin-top:8px;padding:8px 11px;background:#EAF3FF;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px">🌎 Baralho: BR + Europa + Mundo (~850 nomes)</span><span class="muted" style="font-size:11px">▾</span></div>`

// ── G) CELULAR · aba ELENCO com o topo encolhido ────────────────────────────
const jog = [['GOL', 'Kepa', 'Chelsea · 2019', 6], ['LAT', 'Yoshimar Yotún', 'Vasco · 2013', 6], ['LAT', 'Pará', 'Santos · 2011', 6], ['ZAG', 'Gil', 'Corinthians · 2015', 6], ['ZAG', 'Adriano Gol Contra', 'Madureira · 2005', 6], ['MEI', 'Zina', 'Ceará · 2007', 5], ['MEI', 'Felipe Bastos', 'Vasco · 2011', 5], ['MEI', 'Djemba-Djemba', 'Man United · 2004', 6], ['ATA', 'Loco Abreu', 'Botafogo · 2010', 4], ['ATA', 'Reinaldo Aleluia', 'Ceará · 2006', 4], ['ATA', 'Bill', 'Ceará · 2016', 4]]
const celElenco = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:8px 10px 0}</style>
<div class="band" style="padding:6px 12px;display:flex;align-items:center;justify-content:space-between;font-size:11px">
  <span><b class="osw" style="color:${GOLD}">T5 · R14</b> <span style="opacity:.7">· Várzea · 20º</span></span>
  <span class="osw" style="font-size:12px">⚽ Dragão 4 × 0 Tigres <span style="opacity:.6">86'</span></span>
  <span class="pill" style="background:${GOLD};color:${INK}">🪙 128</span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:9px 0 8px">
  <div class="btn" style="background:#b9ab8a;color:#fff;font-size:12px;padding:8px">🎽 Time</div><div class="btn" style="background:#fff;box-shadow:none;font-size:12px;padding:8px">🕴️ Agenciados</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
  ${[['🧱 Retranca'], ['⚖️ Equilíbrio', 1], ['🔥 Ataque']].map(([t, on]) => `<div class="btn" style="background:${on ? '#2F6BAE' : '#fff'};color:${on ? '#fff' : INK};box-shadow:${on ? `2px 2px 0 ${INK}` : 'none'};font-size:11px;padding:7px 4px">${t}</div>`).join('')}
</div>
<div class="box" style="padding:0;overflow:hidden">
  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 11px;background:#b9ab8a;color:#fff"><span class="osw" style="font-size:13px">👥 Tigres do Asfalto</span><span class="pill" style="background:#fff;color:${INK}">12/22</span></div>
  <div style="padding:8px 10px 6px;font-size:11px;display:flex;justify-content:space-between"><span class="chip">🏷️ Elenco vale 60 💵</span><span class="chip">🎽 4-3-3 ✓</span><span class="chip">🧢 sem técnico</span></div>
  <div style="margin:4px 10px;height:150px;border:3px solid ${INK};border-radius:12px;background:repeating-linear-gradient(#2e8b4c 0 30px,#27803f 30px 60px);position:relative">
    ${[[50, 82, 'K'], [18, 58, 'Y'], [40, 58, 'G'], [62, 58, 'A'], [84, 58, 'P'], [25, 36, 'Z'], [50, 36, 'F'], [75, 36, 'D'], [22, 13, 'L'], [50, 13, 'R'], [78, 13, 'B']].map(([x, y, l]) => `<div style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;background:${CREME};border:2px solid ${INK};font-size:12px;text-align:center;line-height:22px" class="osw">${l}</div>`).join('')}
  </div>
  <div style="padding:6px 10px 4px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
    ${jog.slice(0, 8).map(([p, n, c, v]) => `<div style="border:2px solid ${INK};border-radius:8px;padding:4px 7px;font-size:10.5px;display:flex;justify-content:space-between;align-items:center;background:#fff"><span><span class="muted" style="font-size:9px">${p}</span> <b>${n}</b><br><span class="muted" style="font-size:9px">${c}</span></span><span class="pill" style="background:${GOLD};font-size:9px">🪙 ${v}</span></div>`).join('')}
  </div>
  <div class="muted" style="text-align:center;font-size:10px;padding:2px 0 8px">+ 3 titulares · 1 reserva ▾</div>
</div>
<div style="position:absolute;left:0;right:0;bottom:66px;padding:0 10px"><div style="background:#FFF6DE;border:2px solid ${INK};border-radius:10px;padding:5px 10px;font-size:10.5px;display:flex;justify-content:space-between;align-items:center"><span>☁️ Carreira só neste aparelho</span><b style="color:${GREEN}">criar conta ›</b></div></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:60px;background:#fff;border-top:3px solid ${INK};display:flex;justify-content:space-around;align-items:center">
  ${[['📅', 'Jogos'], ['📋', 'Tabelas'], ['🛡️', 'Elenco', 1], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([i, t, on]) => `<div class="tab ${on ? 'on' : ''}"><span style="font-size:18px">${i}</span>${t}</div>`).join('')}
</div>`

// ── C) DESKTOP · JOGOS em 3 colunas ─────────────────────────────────────────
const deskJogos = `<style>${CSS} body{width:1440px;height:900px;overflow:hidden;position:relative}</style>
<div style="height:58px;background:#fff;border-bottom:3px solid ${INK};display:flex;align-items:center;padding:0 28px;gap:26px">
  <span class="osw" style="font-size:20px">⚽ Leilão <span style="color:${RED}">Legends</span></span>
  <span class="muted" style="font-size:12px">🪜 Carreira · <b style="color:${INK}">Tigres do Asfalto</b></span>
  <div style="margin-left:auto;display:flex;gap:6px">${['📅 Jogos', '📋 Tabelas', '🛡️ Elenco', '🏆 Rank', '🏟️ Clube'].map((t, i) => `<span class="btn" style="padding:7px 14px;font-size:12px;background:${i === 0 ? GOLD : '#fff'};box-shadow:${i === 0 ? `3px 3px 0 ${INK}` : 'none'}">${t}</span>`).join('')}</div>
  <span class="pill" style="background:${GOLD}">🪙 42</span><span class="muted" style="font-size:11px">🚪 Sair e salvar</span>
</div>
<div style="display:grid;grid-template-columns:420px 1fr 380px;gap:18px;padding:18px 28px">
  <div>
    <div class="band" style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between"><div><div class="osw" style="font-size:10px;color:${GOLD};letter-spacing:.08em">Temporada 1 · Várzea</div><div class="osw" style="font-size:26px;line-height:1">Rodada 20 <span style="color:rgba(255,255,255,.5);font-size:15px">/ 38</span></div></div><span class="pill" style="background:#fff;color:${INK}">🏅 19º</span></div>
    <div style="height:7px;border:2px solid ${INK};border-radius:999px;margin:10px 2px 12px;background:#fff;overflow:hidden"><div style="width:45%;height:100%;background:${GOLD}"></div></div>
    <div class="box" style="padding:0;overflow:hidden">
      <div style="background:#5a3a22;color:#fff;padding:6px 12px;font-size:12px" class="osw">🟢 Apitou o juiz · 2'</div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:16px 10px;gap:8px">
        <div style="text-align:center"><div style="width:52px;height:52px;margin:0 auto 6px;border-radius:12px;border:3px solid ${INK};background:${GREEN}"></div><div style="font-size:13px">Tigres do Asfalto</div><div class="muted" style="font-size:10px">VOCÊ</div></div>
        <div class="osw" style="font-size:44px;background:${INK};color:#fff;border-radius:14px;padding:2px 16px">0 × 0</div>
        <div style="text-align:center"><div style="width:52px;height:52px;margin:0 auto 6px;border-radius:12px;border:3px solid ${INK};background:#2F6BAE"></div><div style="font-size:13px">Juventude do Churrasco</div><div class="muted" style="font-size:10px">RIVAL</div></div>
      </div>
      <div style="padding:0 12px 12px;font-size:11px" class="muted">⚽ sem gols ainda · 🅰️ —</div>
    </div>
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px;margin:12px 0"><div class="btn" style="background:#2F6BAE;color:#fff;font-size:15px">⏭️ Pular a rodada</div><div class="btn" style="background:#fff;font-size:12px">🎮 Manual <span class="pill" style="background:${GREEN};color:#fff;margin-left:6px">Apoie 🔒</span></div></div>
    <div class="band" style="padding:9px 12px;font-size:12px;font-weight:600;display:flex;gap:8px;align-items:center"><span class="pill" style="background:${GOLD};color:${INK}">😤 Na cola</span><span style="flex:1">O <b>Nightfull FC</b> já sente o teu bafo — 2 pontos.</span></div>
    <div class="box" style="margin-top:12px;padding:10px 12px;background:#fff"><div class="row" style="gap:6px"><span class="pill" style="background:${GOLD}">🎙️ Narrador</span><span style="font-size:11.5px;font-weight:600">Empatou até agora. Segura o time — e olha a Copa: na aba Tabelas tem o chaveamento.</span></div></div>
  </div>
  <div class="box" style="padding:12px 14px">
    <div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="osw" style="font-size:15px">🌱 Várzea · você</span><span style="display:flex;gap:4px">${['Marolados FC', 'SC Ferrari', 'Neymarzetti', 'White Thigs…', 'Nightfull FC'].map(r => `<span class="chip" style="font-size:9.5px;background:#FBE3DF">⚔️ ${r}</span>`).join('')}</span></div>
    <table class="tbl"><tr><th>#</th><th>Time</th><th style="text-align:right">P</th><th style="text-align:right">J</th><th style="text-align:right">SG</th></tr>${tabela.map((t, i) => linhaTab(t, i, false)).join('')}</table>
  </div>
  <div>
    <div class="box" style="padding:10px 12px">
      <div class="osw" style="font-size:12px;margin-bottom:4px">📺 Jogos da rodada · Várzea</div>
      ${jogos.map(([a, b], i) => `<div style="display:grid;grid-template-columns:1fr auto 1fr;font-size:10.5px;padding:3px 0;border-bottom:1px solid rgba(12,12,12,.07);align-items:center"><span style="text-align:right">${a}</span><span class="pill" style="background:#E4F4E8;font-size:9px;margin:0 6px">${i % 3 ? '1 × 0' : '0 × 0'}</span><span>${b}</span></div>`).join('')}
    </div>
    <div class="box" style="margin-top:12px;padding:10px 12px">
      <div class="osw" style="font-size:12px;margin-bottom:6px">🪜 Outras divisões</div>
      ${[['A', 'Murriz FC', 'La Bestia Negra'], ['B', 'Crias do Bigão', 'Alfacehh'], ['C', 'Casa de Vó', 'Zé Colmeia'], ['D', 'Metrópole FC', 'Soberano Nacional']].map(([d, a, b]) => `<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;padding:5px 0;border-bottom:1px solid rgba(12,12,12,.07)"><span><b>Série ${d}</b> <span class="muted">· líder</span> ${a}</span><span class="muted">tabela ▸</span></div>`).join('')}
    </div>
    <div class="box" style="margin-top:12px;padding:10px 12px;background:#FFF6DE">
      <div class="osw" style="font-size:12px;margin-bottom:4px">🏟️ Seu clube</div>
      <div style="font-size:11px;line-height:1.6">🪙 Caixa <b>42</b> · 😐 Torcida <b>45%</b><br>🤝 Patrocínio: <b>Rei das Tintas</b> · meta Acesso (+4)<br>👥 Elenco 11/22 · 🧢 sem técnico</div>
    </div>
    <div style="background:#FFF6DE;border:2px solid ${INK};border-radius:10px;padding:6px 10px;font-size:11px;margin-top:12px;display:flex;justify-content:space-between"><span>☁️ Carreira só neste aparelho</span><b style="color:${GREEN}">criar conta ›</b></div>
  </div>
</div>`

// ── D) DESKTOP · PREGÃO em 2 colunas ─────────────────────────────────────────
const gols = [['Sidão', 'São Paulo · 2017'], ['Diego', 'Flamengo · 2009'], ['Fernando Henrique', 'Fluminense · 2010'], ['John', 'Botafogo · 2024'], ['Kasper Schmeichel', 'Leicester · 2016'], ['David Ospina', 'Arsenal · 2015'], ['Doni', 'Corinthians · 2005'], ['Kepa', 'Chelsea · 2019']]
const deskLeilao = `<style>${CSS} body{width:1440px;height:900px;overflow:hidden;position:relative}</style>
<div style="height:58px;background:#fff;border-bottom:3px solid ${INK};display:flex;align-items:center;padding:0 28px;gap:10px">
  <span class="osw" style="font-size:20px;margin-right:16px">⚽ Leilão <span style="color:${RED}">Legends</span></span>
  ${['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].map((s, i) => `<span class="pill" style="background:${i === 0 ? GOLD : '#fff'};font-size:12px;padding:3px 12px">${s}</span>`).join('')}
  <span class="pill" style="margin-left:auto;background:#E4F4E8">1 vaga</span><span class="pill" style="background:${GOLD}">🪙 100</span>
</div>
<div style="display:grid;grid-template-columns:1fr 440px;gap:20px;padding:18px 28px">
  <div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:12px">
      <div><div class="osw" style="font-size:34px;line-height:1">🔨 Goleiros</div><div class="muted" style="font-size:13px">Lance cego: ninguém vê nada até a revelação.</div></div>
      <div class="band" style="background:${GREEN};padding:6px 16px;text-align:center"><div class="osw" style="font-size:10px">Tempo</div><div class="osw" style="font-size:26px;line-height:1">37s</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${gols.map(([n, c], i) => `<div class="box" style="padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:${i === 1 ? '#FFF6DE' : '#fff'}"><div><span class="pill" style="background:${INK};color:#fff">GOL</span> <b style="font-size:15px">${n}</b><div class="muted" style="font-size:11px">${c}</div></div><div class="row" style="gap:5px"><span class="btn" style="padding:4px 10px;background:#fff;box-shadow:none">−</span><span style="border:2px solid ${INK};border-radius:8px;padding:4px 12px;font-size:15px;min-width:44px;text-align:center">${i === 1 ? 6 : 0}</span><span class="btn" style="padding:4px 10px;background:${GOLD};box-shadow:2px 2px 0 ${INK}">+</span></div></div>`).join('')}
    </div>
    <div class="box" style="margin-top:12px;padding:10px 12px;background:#fff"><div class="row" style="gap:6px"><span class="pill" style="background:${GOLD}">🎙️ Narrador</span><span style="font-size:11.5px;font-weight:600">Escreve teu lance ESCONDIDO — ninguém vê o de ninguém. Quem der mais leva no martelo.</span><span class="muted" style="margin-left:auto;font-size:10px">✅ entendi</span></div></div>
  </div>
  <div>
    <div class="band" style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;background:#fff;color:${INK}"><div><div class="osw" style="font-size:10px;letter-spacing:.08em" class="muted">Envelope</div><div class="osw" style="font-size:24px;line-height:1">6 <span class="muted" style="font-size:14px">/ 100</span></div></div><span class="btn" style="background:${RED};color:#fff;font-size:15px">Lacrar 🔒</span></div>
    <div class="box" style="margin-top:12px;padding:0;overflow:hidden;background:#5a3a22;height:300px;position:relative">
      ${[[50, 12], [50, 34], [50, 56], [20, 56], [80, 56], [22, 34], [78, 34], [30, 12], [70, 12], [50, 80], [50, 80]].slice(0, 10).map(([x, y], i) => `<div style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:2px dashed rgba(255,255,255,.7);color:#fff;text-align:center;line-height:30px;font-size:14px">+</div>`).join('')}
      <div style="position:absolute;left:50%;top:80%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:2px dashed rgba(255,255,255,.7);color:#fff;text-align:center;line-height:30px;font-size:14px">+</div>
      <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;padding:4px;text-align:center;font-size:10px" class="muted">4-3-3 · 0/11 contratados</div>
    </div>
    <div class="box" style="margin-top:12px;padding:10px 12px">
      <div class="osw" style="font-size:12px;margin-bottom:4px">👥 A sala</div>
      ${['Neymarzetti', 'Nightfull FC', 'White Thigs do GuGu', 'Marolados FC', 'SC Ferrari'].map(t => `<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid rgba(12,12,12,.07)"><b>${t}</b><span class="muted">4-4-2 · 🪙 100 · 0/11</span></div>`).join('')}
    </div>
  </div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, html, w, h, dpr] of [['cel-jogos', celJogos, 390, 844, 2], ['cel-pre', celPre, 390, 844, 2], ['cel-setup', celSetup, 390, 844, 2], ['cel-elenco', celElenco, 390, 844, 2],['desk-jogos', deskJogos, 1440, 900, 1], ['desk-leilao', deskLeilao, 1440, 900, 1]]) {
  const p = `${OUT}/${nome}.html`; writeFileSync(p, `<!doctype html><meta charset="utf-8">${html}`)
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  await pg.goto('file://' + p); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200)
  await pg.screenshot({ path: `${OUT}/${nome}.png` }); await pg.close(); console.log(`${OUT}/${nome}.png`)
}
await b.close()
