// 🏅 MOCKUP · PÓDIO DA SEMANA: medalha de 30 dias + aviso do pódio (19/10, segunda 0h09 — "Labubu, Gama e Paçoca
// foram o pódio da semana. E agora? Nenhum aviso embaixo, nada?").
// Decisões do Diego (19/10): a MEDALHA ganha no fecho fica no nome por 30 dias · moldura + fita "1º DA SEMANA" continuam
// só pra quem está no pódio AGORA · uma linha embaixo do Ranking da Semana com o pódio passado · e o pódio passa no
// telão das salas, na cor ROXA (rosa é do Super Chat, dourado é do Anúncio do dia).
// uso: node scripts/mockup-podio-30d.mjs → scripts/mockups/podio-30d.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const G = {
  bege: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)',
  roxo: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)',
  prata: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)',
  ouro: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)',
}
const MET = {
  1: { anel: 'conic-gradient(from var(--a),#fff6c4,#FFC400,#b37a00,#FFE066,#fff6c4,#FFC400,#b37a00,#fff6c4)', fita: '#FFC400', txt: '#0C0C0C', rot: '🥇 1º DA SEMANA', coroa: true },
  2: { anel: 'conic-gradient(from var(--a),#ffffff,#C9D2DC,#7d8896,#eef2f6,#ffffff,#C9D2DC,#7d8896,#ffffff)', fita: '#D6DDE5', txt: '#0C0C0C', rot: '🥈 2º DA SEMANA' },
  3: { anel: 'conic-gradient(from var(--a),#ffe0c2,#D9822B,#7a3e0e,#F0A35E,#ffe0c2,#D9822B,#7a3e0e,#ffe0c2)', fita: '#D9822B', txt: '#fff', rot: '🥉 3º DA SEMANA' },
}
// nome · tier · selo do plano · pódio AGORA (moldura) · medalhas GANHAS (30 dias)
const chip = (nome, tier, selo, pos, ganhas) => {
  const m = MET[pos]
  const base = `<div class="tec" style="background:${G[tier]}"><span class="ini">${nome[0]}</span><div class="txt"><b>${nome} ${selo}${ganhas}</b><small>${tier === 'bege' ? 'grátis' : tier}</small></div></div>`
  if (!m) return `<div class="slot">${base}</div>`
  return `<div class="slot podio">${m.coroa ? '<span class="coroa">👑</span>' : ''}<div class="anel" style="background:${m.anel}"></div>${base}<span class="fita" style="background:${m.fita};color:${m.txt}">${m.rot}</span></div>`
}
const sala = [
  chip('NEYMARJR', 'bege', '', 1, '🥉'),          // líder de AGORA (segunda) · ganhou bronze semana retrasada
  chip('LABUBU F.C', 'ouro', '👑', 0, '🥇🥇'),    // campeão das 2 últimas semanas, mas hoje ainda sem título: só as medalhas
  chip('GAMA FC', 'roxo', '💎', 2, '🥈'),
  chip('Paçoca leiloeiro', 'prata', '⭐', 0, '🥉'),
  chip('Butinas', 'bege', '', 0, ''),
].join('')
const chat = [
  ['LABUBU F.C 👑🥇🥇', 'bora pregão aberto 21h?', '#FFC400'],
  ['Butinas', 'hoje eu te pego 😤', '#DBD1B5'],
  ['GAMA FC 💎🥈', 'segunda já? tô voltando', '#C9A9FF'],
].map(([n, t, c]) => `<div class="msg"><b style="background:${c}">${n}</b><span>${t}</span></div>`).join('')
const rank = [['1º', 'NEYMARJR 🥉', 3, '🥇'], ['2º', 'Butinas', 2, '🥈'], ['3º', 'GAMA FC 💎🥈', 2, '🥉'], ['4º', 'Xebiuzao', 1, ''], ['5º', 'La Bestia Negra 👑🖋️', 1, '']]
  .map(([p, n, t, m]) => `<div class="rk"><span class="pos">${p}</span><b>${n}</b><span class="tit">${t} títulos</span></div>`).join('')
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.65}
.cols{display:flex;gap:22px;align-items:flex-start}.cols>div{width:400px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px 16px 10px}
.box h3{font:700 15px Oswald;text-transform:uppercase;margin:0 0 12px;letter-spacing:.5px}
.slot{position:relative;margin-bottom:12px}
.tec{position:relative;z-index:1;display:flex;align-items:center;gap:10px;border:2px solid #0C0C0C;border-radius:12px;padding:8px 10px}
.ini{width:34px;height:34px;border-radius:50%;border:2px solid #0C0C0C;background:#fff;display:flex;align-items:center;justify-content:center;font:700 16px Oswald}
.txt b{display:block;font:700 16px Oswald}.txt small{font-size:11px;font-weight:700;opacity:.65}
.podio{margin:18px 0 22px}
.podio .anel{position:absolute;inset:-6px;border-radius:17px;border:2px solid #0C0C0C;box-shadow:3px 3px 0 #000,0 0 14px rgba(255,196,0,.45);animation:gira 3s linear infinite}
@keyframes gira{to{--a:360deg}}
.fita{position:absolute;z-index:2;right:10px;top:-15px;font:700 12px Oswald;letter-spacing:.06em;border:2px solid #0C0C0C;border-radius:8px;padding:2px 9px;box-shadow:2px 2px 0 #000}
.coroa{position:absolute;z-index:3;left:12px;top:-24px;font-size:24px;transform:rotate(-18deg);filter:drop-shadow(2px 2px 0 #000)}
.msg{display:flex;gap:8px;align-items:center;margin:0 0 9px;font-size:14px;font-weight:600}
.msg b{font:700 13px Oswald;border:2px solid #0C0C0C;border-radius:8px;padding:2px 7px;white-space:nowrap}
.rk{display:flex;align-items:center;gap:10px;padding:7px 2px;border-bottom:1px solid #e3dcc6}.rk .pos{font:700 15px Oswald;width:28px}.rk b{flex:1;font:700 15px Oswald}.rk .tit{font:700 13px Oswald}
.passada{margin-top:12px;border:3px solid #0C0C0C;border-radius:12px;background:#F4ECD6;box-shadow:3px 3px 0 #000;padding:8px 10px}
.passada small{display:block;font:700 10px Oswald;letter-spacing:.14em;color:#7C3AED;margin-bottom:4px}
.passada b{font:700 14px Oswald;display:block;line-height:1.5}
.nota{font-size:12.5px;font-weight:700;margin:10px 0 0;line-height:1.4;color:#4a4330}
.led{position:relative;height:84px;overflow:hidden;background:#070707;background-image:radial-gradient(rgba(255,255,255,.08) 1px,transparent 1.3px);background-size:4px 4px;box-shadow:inset 0 0 22px #000;border:3px solid #0C0C0C;border-radius:14px}
.led .t{position:absolute;left:14px;top:6px;font:700 9px Oswald;letter-spacing:.16em;color:#C9A9FF}
.led .m{position:absolute;left:14px;right:14px;top:22px;font:700 17px/1.15 Oswald;letter-spacing:.04em;text-transform:uppercase;color:#C9A9FF;text-shadow:0 0 8px #8B5CF6}
.led .bar{position:absolute;left:0;bottom:0;height:3px;width:45%;background:#8B5CF6}
.led.rosa .t,.led.rosa .m{color:#FF5FA2;text-shadow:0 0 8px #FF5FA299}.led.rosa .bar{background:#FF5FA2}
.led.ouro .t{color:rgba(255,255,255,.45)}.led.ouro .m{color:#FFC400;text-shadow:0 0 8px #FFC40099}.led.ouro .bar{background:#FFC400}
.led .q{position:absolute;left:14px;top:19px;font:700 11px Oswald;letter-spacing:.08em;text-transform:uppercase;color:#F4ECD6}
.led.rosa .m{top:35px;font-size:16px}
</style></head><body>
<h1>🏅 Pódio da semana: medalha de 30 dias + aviso</h1>
<p class="sub">Segunda-feira, 0h. O ranking zerou — e agora todo mundo fica sabendo quem foi o pódio.</p>
<div class="cols">
 <div><span class="tag">1 · NA SALA</span><div class="box"><h3>👥 Técnicos na sala</h3>${sala}
  <p class="nota">🏅 <b>Medalha</b> = ganhou no fecho da semana, fica <b>30 dias</b> no nome (Labubu ganhou 2 seguidas: 🥇🥇).<br>🖼️ <b>Moldura + fita</b> = está no pódio <b>AGORA</b>; sai quando cai do top 3.</p></div>
  <span class="tag" style="margin-top:18px">3 · NO RANKING DA SEMANA</span><div class="box"><h3>📊 Ranking da semana</h3>${rank}
  <div class="passada"><small>🏆 PÓDIO DA SEMANA PASSADA</small><b>🥇 LABUBU F.C · 54 títulos<br>🥈 GAMA FC · 48 títulos<br>🥉 Paçoca leiloeiro · 38 títulos</b></div>
  <p class="nota">Fica fixo embaixo do ranking a semana toda. Na outra segunda, troca pelo pódio novo.</p></div></div>
 <div><span class="tag">2 · NO CHAT</span><div class="box"><h3>💬 Chat da sala</h3>${chat}
  <p class="nota">A medalha vai junto do nome em todo canto: chat, martelo, pódio da copa, perfil.</p></div>
  <span class="tag" style="margin-top:18px">4 · NO TELÃO DAS SALAS</span>
  <div class="led"><span class="t">🏆 PÓDIO DA SEMANA · 1/3</span><div class="m">🥇 LABUBU F.C · 🥈 GAMA FC · 🥉 PAÇOCA LEILOEIRO</div><span class="bar"></span></div>
  <p class="nota" style="margin:8px 0 10px">Roda a semana inteira, revezando com os outros do letreiro (abaixo: o Super Chat e o Anúncio do dia, pra comparar as cores):</p>
  <div class="led rosa" style="height:84px"><span class="t">💬 RECADO DE TORCEDOR · 2/3</span><span class="q">FUTPOINT</span><div class="m">BOM DIA GRUPO! HOJE TEM PREGÃO ABERTO 21H ☀️</div><span class="bar"></span></div>
  <div class="led ouro" style="margin-top:10px"><span class="t">📢 ANÚNCIO DO DIA · 3/3</span><div class="m">🚗 VADICO VEÍCULOS</div><span class="bar"></span></div>
 </div>
</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 880, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(700)
await p.screenshot({ path: 'scripts/mockups/podio-30d.png', fullPage: true }); await b.close()
console.log('scripts/mockups/podio-30d.png')
