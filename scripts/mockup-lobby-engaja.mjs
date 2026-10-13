// ─── 🧪 MOCKUP: o rodapé da lista de salas que ENGAJA (13/10) ────────────────
// Pedido do Diego (print da lista de salas): *"ao final, após o botão de atualizar lista,
// quais ideias p engajar"* → ele escolheu: 🏆 Campeões de hoje · 📊 Ranking da semana ·
// 🖋️ só o ÚLTIMO batismo. Dados reais de 13/10 (game_champions.human_results + esc_socios).
// ⚠️ SÓ DESENHO — nada disto está no jogo.
//   node scripts/mockup-lobby-engaja.mjs [--saida lobby-engaja.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'lobby-engaja.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(f).toString('base64')}`
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const CAMPEOES = [
  ['Vemd4', '🏆 Liga', 'agora há pouco'], ['SOCA FOFO FC', '🏆 Liga', 'há 2 min'], ['Jota67resenha', '🏆🇧🇷 Copa', 'há 4 min'],
  ['Farinhoso fc', '🏆 Liga', 'há 6 min'], ['Atacadao fc.', '🌍 Mundial', 'há 9 min'],
]
const SEMANA = [['Só no peloFC', 15], ['Gouvêa fc', 13], ['GAMA FC', 12], ['Tchubiruba FC', 11], ['BarSemLonã', 11]]
const caixa = (titulo, sub, corpo, bg = CREME) => `<div style="background:${bg};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px 12px 10px;margin-top:14px">
  <p style="margin:0;${OSW};font-size:17px;text-transform:uppercase">${titulo}</p>
  <p style="margin:2px 0 8px;font-size:11px;font-weight:700;color:#5a5240">${sub}</p>${corpo}</div>`
const medalha = i => ['🥇', '🥈', '🥉', '4º', '5º'][i]

const campeoes = CAMPEOES.map(([n, t, q]) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 2px;border-top:1.5px solid #0001">
  <span style="font-size:18px">🏆</span><b style="flex:1;${OSW};font-size:14px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</b>
  <span style="${OSW};font-size:11px;background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:1px 8px;white-space:nowrap">${t}</span>
  <span style="font-size:10px;font-weight:700;color:#7a705a;width:62px;text-align:right">${q}</span></div>`).join('')

const semana = SEMANA.map(([n, t], i) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 6px;border-radius:9px;${i === 0 ? `background:linear-gradient(90deg,#FFE79A,${GOLD});border:2px solid ${INK};` : 'border-top:1.5px solid #0001;'}">
  <span style="${OSW};font-size:15px;width:24px;text-align:center">${medalha(i)}</span><b style="flex:1;${OSW};font-size:14px">${n}</b>
  <span style="${OSW};font-size:15px">${t} <span style="font-size:10px;font-weight:600">títulos</span></span></div>`).join('')
  + `<div style="display:flex;align-items:center;gap:8px;padding:7px 6px;margin-top:6px;border:2px dashed ${INK};border-radius:9px;background:#fff">
  <span style="${OSW};font-size:13px;width:24px;text-align:center">87º</span><b style="flex:1;${OSW};font-size:13px">Você · Dupla FC</b><span style="${OSW};font-size:13px">1 título</span></div>
  <p style="margin:7px 0 0;font-size:10.5px;font-weight:700;color:#5a5240">⏳ Zera toda segunda às 0h. Conta Liga, Copa, Liberta, Champions, Mundial e Copas regionais das salas online.</p>`

const batismo = `<div style="display:flex;align-items:center;gap:12px">
  <img src="${img('src/escalacao/img/intervale-escudo.webp')}" style="height:74px">
  <div style="flex:1;min-width:0"><p style="margin:0;${OSW};font-size:20px;text-transform:uppercase;color:#fff">Inter Vale FC</p>
    <p style="margin:2px 0 0;font-size:11.5px;font-weight:700;color:#ddd">chegou na <b style="color:${GOLD}">Série C</b> · mascote O Lutador 🥊</p></div>
  <img src="${img('src/escalacao/img/intervale-mascote.webp')}" style="height:92px;margin:-10px -4px -6px 0"></div>
  <div style="margin-top:10px;${OSW};font-size:14px;text-align:center;background:${GOLD};color:${INK};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:9px">🖋️ QUERO BATIZAR O MEU CLUBE →</div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}*{box-sizing:border-box}body{margin:0;width:420px;background:#120f0c;font-family:system-ui;padding:16px}</style>
<div style="background:#efe6cc;border:3px solid ${INK};border-radius:16px;padding:14px 14px;opacity:.55"><b style="${OSW};font-size:18px">● enzo noob</b><p style="margin:4px 0 0;font-size:12px;font-weight:700">4/20 · 5B6KCE · auto · liga+copa · jogo rolando</p></div>
<div style="margin-top:12px;background:#fff;border:3px solid ${INK};border-radius:14px;padding:12px;text-align:center;${OSW};font-size:16px">🔄 ATUALIZAR LISTA</div>
<p style="margin:16px 0 0;${OSW};font-size:12px;color:${GOLD};letter-spacing:.12em;text-align:center">⬇️ NOVO · ABAIXO DA LISTA</p>
${caixa('🏆 Campeões de hoje', 'Quem levantou taça nas salas online hoje — só gente, nunca bot.', campeoes)}
${caixa('📊 Ranking da semana', 'Os técnicos com mais títulos online nesta semana.', semana)}
${caixa('🖋️ Último batismo', 'O clube mais novo do jogo — de um jogador de verdade.', batismo, `linear-gradient(150deg,#1f1a14,#0c0c0c)`).replace('color:#5a5240">O clube', 'color:#bbb">O clube').replace(`text-transform:uppercase">🖋️`, `text-transform:uppercase;color:${GOLD}">🖋️`)}
<div style="margin-top:16px;text-align:center;${OSW};font-size:14px;color:${GOLD};border:2px solid ${GOLD};border-radius:14px;padding:10px">📊 Painel do Criador</div>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 420, height: 800 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
await p.screenshot({ path: SAIDA, fullPage: true }); await b.close(); console.log(SAIDA)
