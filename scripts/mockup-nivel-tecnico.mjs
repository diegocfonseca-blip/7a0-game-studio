// 🎖️ MOCKUP · NÍVEL DE TÉCNICO (03/11). Diego: *"ainda tem muita gente que não paga… o que fazer pro cara se identificar mais
// com o perfil dele pra ele não querer ficar fazendo conta nova"*. Proposta: a CONTA ganha nível com o que já joga (salas,
// títulos, medalhas); o nível aparece do lado do nome pra todo mundo; conta nova = Nv 1 🐣 NOVATO. Quem tem plano sobe +20%.
// O selo do nível é PRETO (neutro) de propósito: as cores bege/prata/ouro são do PLANO e não se emprestam.
// uso: node scripts/mockup-nivel-tecnico.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C'
const TIER = {
  bege: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)',
  prata: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)',
  ouro: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)',
}
const nv = (n, nov) => nov ? `<span class="nv nov">🐣 NOVATO</span>` : `<span class="nv">NV <b>${n}</b></span>`
const linha = (nome, tier, n, sel = '', nov = false) => `<div class="tec"><span class="pill" style="background:${TIER[tier]}">${nome}${sel}</span>${nv(n, nov)}</div>`

const sala = `<div class="box"><span class="tag" style="background:#FFC400">1 · SALA DE ESPERA</span>
  <p class="cap">Do lado do nome de cada técnico, o nível — todo mundo vê quem é veterano.</p>
  ${linha('Futpoint', 'ouro', 47, ' 👑')}${linha('Lucas Barreto 30', 'prata', 31, ' ⭐')}${linha('Cativeiro FC', 'bege', 18)}${linha('Jackaré 30', 'bege', 9)}${linha('Neymar FC2', 'bege', 1, '', true)}
</div>`

const chat = `<div class="box"><span class="tag" style="background:#e6dcbf">2 · CHAT DA SALA</span>
  <p class="cap">O mesmo selinho, miúdo, na frente da mensagem.</p>
  <div class="msg"><span class="nv sm">NV <b>47</b></span><b>Futpoint 👑</b> esse Romário é meu 😤</div>
  <div class="msg"><span class="nv sm">NV <b>18</b></span><b>Cativeiro FC</b> vai pagar 300 nele? kkk</div>
  <div class="msg"><span class="nv sm nov">🐣</span><b>Neymar FC2</b> como dá lance?</div>
</div>`

const perfil = `<div class="box"><span class="tag" style="background:#1B7A3D;color:#fff">3 · PERFIL</span>
  <div class="perf"><div class="esc">CF</div><div style="flex:1"><b class="pn">Cativeiro FC</b><small>técnico desde ago/2026</small></div><span class="big">NV<b>18</b></span></div>
  <div class="barra"><i style="width:62%"></i></div><p class="mini">620 / 1.000 pontos pro nível 19</p>
  <div class="st"><div><b>214</b><small>salas jogadas</small></div><div><b>11 🏆</b><small>títulos</small></div><div><b>3 🥇</b><small>medalhas da semana</small></div></div>
</div>`

const sobe = `<div class="box"><span class="tag" style="background:#7C3AED;color:#fff">4 · SUBIU DE NÍVEL</span>
  <p class="cap">Aparece no FIM da partida (tempo morto), some sozinho em 3s — não segura ninguém.</p>
  <div class="toast"><span style="font-size:30px">🎖️</span><div><b>SUBIU PRO NÍVEL 19!</b><small>+60 pontos nesta sala · campeão da liga</small></div></div>
  <div class="toast" style="background:#fff;color:${INK}"><span style="font-size:24px">⭐</span><div><b style="color:${INK}">COM PLANO VOCÊ SOBE 20% MAIS RÁPIDO</b><small style="color:#555">aparece só pra quem não tem plano, 1x por dia</small></div></div>
</div>`

const regra = `<div class="box wide"><span class="tag" style="background:#C2452F;color:#fff">COMO GANHA PONTO (só com o que já existe)</span>
  <div class="reg">
    <div><b>+10</b><small>jogou uma sala até o fim</small></div><div><b>+50</b><small>campeão da liga / copa na sala</small></div>
    <div><b>+5</b><small>temporada fechada na carreira</small></div><div><b>+100</b><small>pódio da semana (🥇🥈🥉)</small></div>
    <div><b>+20%</b><small>em tudo, pra quem tem plano</small></div><div><b>0</b><small>conta nova começa do zero: 🐣 NOVATO até o nível 2</small></div>
  </div>
  <p class="cap" style="margin:8px 0 0">Nível nunca cai e nunca some. Sair da sala no meio não conta ponto (evita farmar).</p>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:${INK};padding:26px;width:1180px}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.7;font-size:15px;line-height:1.5}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.wide{grid-column:1/-1}
.box{background:#fff;border:4px solid ${INK};border-radius:20px;box-shadow:5px 5px 0 ${INK};padding:16px}
.tag{display:inline-block;font:700 16px Oswald;letter-spacing:1px;border:3px solid ${INK};border-radius:10px;padding:3px 12px;box-shadow:3px 3px 0 ${INK};margin-bottom:6px}
.cap{font-size:13px;font-weight:700;color:#555;margin:4px 0 10px}
.tec{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:2px dashed rgba(12,12,12,.12)}
.pill{border:3px solid ${INK};border-radius:99px;padding:4px 12px;font-weight:900;font-size:15px;box-shadow:2px 2px 0 ${INK}}
.nv{background:${INK};color:#fff;font:700 13px Oswald;letter-spacing:1px;border-radius:7px;padding:3px 8px;white-space:nowrap}.nv b{font-size:17px;margin-left:2px}
.nv.nov{background:#fff;color:${INK};border:2px solid ${INK}}.nv.sm{font-size:10px;padding:1px 5px;margin-right:6px}.nv.sm b{font-size:12px}
.msg{font-size:14px;padding:6px 0;border-bottom:1px dashed #ddd}.msg b{margin-right:4px}
.perf{display:flex;align-items:center;gap:12px}.esc{width:54px;height:54px;border-radius:50%;border:3px solid ${INK};background:#C2452F;color:#fff;font:700 20px Oswald;display:flex;align-items:center;justify-content:center}
.pn{font:700 22px Oswald;display:block}.perf small{font-weight:700;color:#666}
.big{background:${INK};color:#fff;font:700 14px Oswald;border-radius:12px;padding:6px 12px;text-align:center;line-height:1}.big b{display:block;font-size:34px}
.barra{height:14px;border:3px solid ${INK};border-radius:99px;margin:12px 0 2px;overflow:hidden;background:#eee}.barra i{display:block;height:100%;background:#1B7A3D}
.mini{font-size:12px;font-weight:800;color:#555;margin:0 0 8px}
.st{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.st div{border:3px solid ${INK};border-radius:12px;text-align:center;padding:6px}.st b{font:700 22px Oswald;display:block}.st small{font-size:11px;font-weight:700}
.toast{display:flex;align-items:center;gap:10px;background:${INK};color:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 #FFC400;padding:10px 14px;margin-bottom:12px}
.toast b{font:700 18px Oswald;color:#FFC400;display:block}.toast small{font-size:12px;font-weight:700;color:#ddd}
.reg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.reg div{border:3px solid ${INK};border-radius:12px;padding:8px 10px;display:flex;gap:10px;align-items:center}.reg b{font:700 24px Oswald;color:#1B7A3D;min-width:58px}.reg small{font-size:13px;font-weight:700}
</style></head><body>
<h1>🎖️ Nível de técnico · a conta vai valendo mais</h1>
<p class="sub">Cada sala, título e medalha soma ponto pra CONTA. O nível aparece do lado do nome pra todo mundo. Conta nova = 🐣 NOVATO.<br>
O selo é PRETO de propósito: bege/prata/dourado continuam sendo só do plano.</p>
<div class="grid">${sala}${chat}${perfil}${sobe}${regra}</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ deviceScaleFactor: 2, viewport: { width: 1180, height: 900 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: 'scripts/mockups/nivel-tecnico.png', fullPage: true }); await br.close()
console.log('scripts/mockups/nivel-tecnico.png')
