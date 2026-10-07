// ─── 🏴 MOCKUP: CLÃS DOS BATISMOS EMBAIXO DA LISTA DE SALAS (Diego 07/10) ──────
// Pedido (áudio): *"os batismos ficam ali embaixo e as pessoas meio que entram…
// embaixo das salas"*. Vitrine dos clãs (1 por batismo) logo depois da lista de salas;
// cada pessoa entra em um. Cargo vem do PRÓPRIO plano; cor/escudo/mascote não se emprestam.
// ⚠️ SÓ DESENHO — nada disto está no jogo.   node scripts/mockup-clas-lobby.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'clas-lobby.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CLAS = [
  ['neymarzetti-escudo.webp', 'Neymarzetti', 38, 4120, 1, true],
  ['murriz-escudo.webp', 'Murriz FC', 31, 3870, 2],
  ['internacional-madrid-escudo.webp', 'Internacional de Madrid', 27, 3410, 3],
  ['jurubeba-escudo.webp', 'Meia na Canela', 22, 2980, 4],
  ['fabulous-escudo.webp', 'Fabulous EC', 19, 2550, 5],
  ['al-takahdao-escudo.webp', 'Al Takhadao FC', 14, 1990, 6],
]
const sala = (nome, info) => `<div style="background:${CREME};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:12px 13px;display:flex;align-items:center;gap:10px;margin-bottom:12px">
  <div style="flex:1"><p style="margin:0;${OSW};font-size:17px"><span style="color:#E8503A">●</span> ${nome}</p><p style="margin:3px 0 0;font-size:11px;font-weight:700;color:#555">${info}</p></div>
  <span style="${OSW};font-size:13px;border:3px solid ${INK};border-radius:10px;padding:7px 10px;background:#ddd">EM JOGO</span></div>`
const cla = ([esc, nome, membros, pts, pos, meu]) => `<div style="display:flex;align-items:center;gap:10px;background:${meu ? 'linear-gradient(100deg,#FFF3C4,#FFE07A)' : '#fff'};border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 ${INK};padding:8px 10px;margin-bottom:9px">
  <span style="${OSW};font-size:15px;width:20px;text-align:center">${pos}º</span>
  <img src="${img(esc)}" style="width:40px;height:40px;object-fit:contain">
  <div style="flex:1;min-width:0"><p style="margin:0;${OSW};font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Clã ${nome}</p>
  <p style="margin:1px 0 0;font-size:10.5px;font-weight:700;color:#666">👥 ${membros} membros · ⚽ ${pts.toLocaleString('pt-BR')} pts no mês</p></div>
  ${meu ? `<span style="${OSW};font-size:11px;background:${INK};color:${GOLD};border-radius:8px;padding:6px 9px">SEU CLÃ</span>` : `<span style="${OSW};font-size:12px;background:${GREEN};color:#fff;border:2.5px solid ${INK};border-radius:9px;padding:6px 10px">ENTRAR</span>`}
</div>`
const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}*{box-sizing:border-box}body{margin:0;background:#cfc8b4;font-family:system-ui,sans-serif;color:${INK};padding:20px 0}
.fone{width:430px;margin:0 auto;background:#1a120c;border:3px solid ${INK};border-radius:20px;overflow:hidden;padding:16px 14px 20px}</style><body><div class="fone">
${sala('Sala do Banheiristas', '👥 3/20 · Clubes às Cegas · 🔴 jogo rolando')}
${sala('Sala do Missao', '👥 4/20 · liga+liberta · 🔴 jogo rolando')}
<div style="background:#fff;border:3px solid ${INK};border-radius:13px;padding:11px;text-align:center;${OSW};font-size:15px;margin-bottom:18px">🔄 ATUALIZAR LISTA</div>
<div style="background:${CREME};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:13px 12px">
  <p style="margin:0;${OSW};font-size:20px;text-transform:uppercase">🏴 Clãs dos Batismos</p>
  <p style="margin:3px 0 11px;font-size:11.5px;font-weight:700;color:#555;line-height:1.4">Entre no clã de um clube. Cada vitória sua em sala online soma pro clã. No fim do mês, o campeão leva taça no escudo.</p>
  ${CLAS.map(cla).join('')}
  <div style="background:#fff;border:2.5px dashed ${INK};border-radius:12px;padding:9px 10px;margin-top:4px">
    <p style="margin:0;${OSW};font-size:12.5px">🎖️ SEU CARGO NO CLÃ VEM DO SEU PLANO</p>
    <p style="margin:4px 0 0;font-size:11px;font-weight:700;line-height:1.55;color:#444">🤎 Torcedor (grátis) · ⭐ Titular (Craque) · 👑 Capitão (Lenda) · 🛡️ Conselheiro (Batismo) · 🏛️ Presidente (dono do clube)</p>
  </div>
  <div style="${OSW};font-size:13px;text-align:center;margin-top:10px;background:${INK};color:${GOLD};border-radius:11px;padding:10px">✍️ TEM BATISMO? FUNDE O SEU CLÃ</div>
</div>
</div></body>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 470, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
await p.screenshot({ path: SAIDA, fullPage: true }); await b.close(); console.log(SAIDA)
