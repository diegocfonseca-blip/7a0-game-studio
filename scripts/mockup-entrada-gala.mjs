// ─── 👑 MOCKUP · ENTRADA DE GALA DO BATISMO (sala online) ─────────────────────
//
// Ideia levada ao Diego em 28/09, pra dar "água na boca" em quem ainda não tem
// batismo: quando o DONO de um clube batizado entra numa sala online, a sala
// inteira vê a entrada dele (holofote, escudo no telão, mascote atravessando,
// torcida gritando) — e na lista de técnicos ele fica com moldura dourada e a
// mascote do lado. Acontece no lobby, enquanto a sala enche (tempo morto).
//
// Não é o jogo: é desenho com as artes REAIS do batismo (Al Takhadao FC) e a
// identidade da casa (creme, borda preta, sombra dura, Oswald).
//
// uso: node scripts/mockup-entrada-gala.mjs [--saida pasta]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'mockups/entrada-gala')
mkdirSync(SAIDA, { recursive: true })
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const ESC = `data:image/webp;base64,${b64('src/escalacao/img/al-takahdao-escudo.webp')}`
const MAS = `data:image/webp;base64,${b64('src/escalacao/img/al-takahdao-mascote.webp')}`
const ESC2 = `data:image/webp;base64,${b64('src/escalacao/img/fabulous-escudo.webp')}`
const MAS2 = `data:image/webp;base64,${b64('src/escalacao/img/fabulous-mascote.webp')}`

const linha = (nome, clube, tipo) => {
  if (tipo === 'gala') return `
    <div class="tec gala">
      <img class="esc" src="${tipo === 'gala' ? ESC : ''}">
      <div class="txt"><b>${clube}</b><small>${nome} · 👑 BATISMO · sócio nº 12</small></div>
      <img class="mini" src="${MAS}">
    </div>`
  if (tipo === 'gala2') return `
    <div class="tec gala">
      <img class="esc" src="${ESC2}">
      <div class="txt"><b>${clube}</b><small>${nome} · 👑 BATISMO · sócio nº 57</small></div>
      <img class="mini" src="${MAS2}">
    </div>`
  return `<div class="tec"><span class="ini">${clube[0]}</span><div class="txt"><b>${clube}</b><small>${nome}</small></div></div>`
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:#1a1a1a;font-family:system-ui,sans-serif}
.cel{position:relative;width:420px;height:880px;margin:0 auto;background:#F4ECD6;overflow:hidden;color:#0C0C0C}
.top{padding:16px 16px 8px}
.pill{display:inline-block;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;box-shadow:3px 3px 0 #0C0C0C;padding:4px 12px;font:700 12px Oswald;letter-spacing:1px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:10px 0 2px}
.sub{font-size:13px;font-weight:700;opacity:.6;margin:0}
.box{margin:12px 16px;background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:10px}
.box h3{font:700 13px Oswald;text-transform:uppercase;margin:0 0 8px;letter-spacing:.5px}
.tec{display:flex;align-items:center;gap:10px;border:2px solid #0C0C0C;border-radius:12px;padding:7px 9px;margin-bottom:7px;background:#F4ECD6;position:relative;overflow:hidden}
.tec .ini{width:34px;height:34px;border-radius:50%;border:2px solid #0C0C0C;background:#fff;display:flex;align-items:center;justify-content:center;font:700 16px Oswald}
.tec .txt{flex:1;min-width:0}.tec b{display:block;font:700 15px Oswald}.tec small{font-size:11px;font-weight:700;opacity:.6}
.tec.gala{border:3px solid #0C0C0C;background:linear-gradient(120deg,#FFE79A,#FFC400 45%,#E8A200 75%,#FFDD70);box-shadow:3px 3px 0 #0C0C0C;padding:6px 8px}
.tec.gala:after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.8) 48%,transparent 62%);background-size:250% 100%;animation:brilho 2.6s linear infinite}
.tec.gala small{opacity:.8}
.tec .esc{width:38px;height:38px;object-fit:contain}
.tec .mini{height:46px;margin:-6px -2px -8px 0;animation:pula 1.2s ease-in-out infinite;position:relative;z-index:1}
@keyframes brilho{from{background-position:120% 0}to{background-position:-120% 0}}
@keyframes pula{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-4px) rotate(4deg)}}
.btn{margin:12px 16px;background:#1B7A3D;color:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:4px 4px 0 #0C0C0C;padding:12px;text-align:center;font:700 17px Oswald;text-transform:uppercase}
.esperando{text-align:center;font-size:12px;font-weight:700;opacity:.55}

/* ── a entrada ── */
.show{position:absolute;inset:0;z-index:10;pointer-events:none;opacity:0}
.show.on{animation:showIn 5.6s ease forwards}
@keyframes showIn{0%{opacity:0}6%{opacity:1}88%{opacity:1}100%{opacity:0}}
.escuro{position:absolute;inset:0;background:radial-gradient(ellipse 60% 45% at 50% 42%,rgba(40,30,5,.72),rgba(0,0,0,.96) 70%)}
.feixe{position:absolute;left:50%;top:-40px;width:340px;height:620px;transform:translateX(-50%);background:linear-gradient(180deg,rgba(255,240,190,.55),rgba(255,240,190,0));clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);opacity:0}
.on .feixe{animation:feixe 5.6s ease forwards}
@keyframes feixe{0%,6%{opacity:0}14%{opacity:1}85%{opacity:1}100%{opacity:0}}
.telao{position:absolute;left:50%;top:170px;transform:translateX(-50%) scale(.3);opacity:0;text-align:center;width:360px}
.on .telao{animation:telao 5.6s cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes telao{0%,12%{opacity:0;transform:translateX(-50%) scale(.3)}22%{opacity:1;transform:translateX(-50%) scale(1.08)}28%{transform:translateX(-50%) scale(1)}86%{opacity:1}100%{opacity:0}}
.telao img{width:230px;filter:drop-shadow(0 0 22px rgba(255,196,0,.8)) drop-shadow(4px 5px 0 #000)}
.telao .chega{font:700 16px Oswald;letter-spacing:3px;color:#FFC400;margin:6px 0 0}
.telao .nome{font:700 40px Oswald;color:#fff;text-transform:uppercase;line-height:1;margin:4px 0;text-shadow:3px 3px 0 #000}
.telao .dono{font:700 18px Oswald;color:#FFE79A;letter-spacing:1px}
.masc{position:absolute;bottom:70px;left:-230px;height:230px;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.5))}
.on .masc{animation:masc 5.6s ease-in-out forwards}
@keyframes masc{0%,24%{left:-230px}34%{left:40px}40%{left:95px;transform:rotate(-6deg)}46%{transform:rotate(6deg)}52%{transform:rotate(0)}70%{left:95px}90%{left:460px}100%{left:460px}}
.grito{position:absolute;bottom:325px;left:0;right:0;text-align:center;font:700 26px Oswald;color:#FFC400;text-shadow:2px 2px 0 #000;opacity:0}
.on .grito{animation:grito 5.6s ease forwards}
@keyframes grito{0%,30%{opacity:0;transform:scale(.6)}36%{opacity:1;transform:scale(1.15)}40%{transform:scale(1)}80%{opacity:1}88%{opacity:0}}
.flash{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 12px 6px #fff;opacity:0}
.on .flash{animation:flash 5.6s linear forwards}
@keyframes flash{0%,22%{opacity:0}23%{opacity:1}25%{opacity:0}40%{opacity:0}41%{opacity:1}43%{opacity:0}60%{opacity:0}61%{opacity:1}63%{opacity:0}}
.toque{position:absolute;left:16px;right:16px;bottom:18px;z-index:12;background:#0C0C0C;color:#fff;border:3px solid #FFC400;border-radius:14px;padding:10px 12px;font-size:13px;font-weight:700;display:none}
.toque b{color:#FFC400}.toque .cta{display:block;margin-top:8px;background:#FFC400;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:10px;text-align:center;padding:8px;font:700 15px Oswald;text-transform:uppercase}
</style></head><body>
<div class="cel" id="cel">
  <div class="top">
    <span class="pill">🌐 SALA ONLINE · KX7P2A</span>
    <h1>Esperando a galera</h1>
    <p class="sub">6 de 10 técnicos · o leilão começa quando o dono apertar</p>
  </div>
  <div class="box"><h3>⚽ Técnicos na sala</h3>
    <div id="lista">
      ${linha('Diego', 'Fabulous EC', 'gala2')}
      ${linha('Neymarzetti', 'Neymarzetti FC')}
      ${linha('Cauly', 'Cajuri Raiva')}
      ${linha('Felipe', 'Rei da Bola')}
      ${linha('Braguinha', 'Bragantino do Bairro')}
      <div id="novo"></div>
    </div>
  </div>
  <div class="btn">▶ Começar o leilão</div>
  <p class="esperando">Faltam 4 técnicos…</p>

  <div class="show" id="show">
    <div class="escuro"></div><div class="feixe"></div>
    <span class="flash" style="left:60px;top:120px"></span><span class="flash" style="left:350px;top:150px"></span><span class="flash" style="left:300px;top:520px"></span>
    <div class="telao"><img src="${ESC}"><p class="chega">👑 CHEGOU NA SALA</p><p class="nome">Al Takhadao FC</p><p class="dono">do Zé do Mercado · sócio nº 12</p></div>
    <p class="grito">🔊 Ô Ô Ô, AL TAKHADAO! 🔊</p>
    <img class="masc" src="${MAS}">
  </div>
  <div class="toque" id="toque">Você tocou no escudo do <b>Al Takhadao FC</b>.<br>Ele tem escudo, mascote e manto próprios — e entra assim em toda sala.<span class="cta">👑 Quero entrar assim também</span></div>
</div>
<script>
window.entra=()=>{document.getElementById('show').classList.add('on');setTimeout(()=>{document.getElementById('novo').innerHTML=${JSON.stringify(linha('Zé do Mercado', 'Al Takhadao FC', 'gala'))}},4700)}
window.toque=()=>{document.getElementById('toque').style.display='block'}
</script></body></html>`

const tmp = path.resolve(SAIDA, 'entrada-gala.html')
writeFileSync(tmp, html)
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
// 📸 fotos em momentos-chave
const foto = async (nome, ms, extra) => {
  const p = await br.newPage({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 2 })
  await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready)
  if (ms != null) { await p.evaluate(() => window.entra()); await p.waitForTimeout(ms) }
  if (extra) await p.evaluate(extra)
  await p.waitForTimeout(150)
  await p.screenshot({ path: path.join(SAIDA, nome + '.png') }); await p.close()
  console.log('   📸', nome)
}
await foto('1-sala-antes', null)
await foto('2-holofote-escudo', 1700)
await foto('3-mascote-e-torcida', 2600)
await foto('4-na-lista-dourado', 6200)
await foto('5-toque-no-escudo', 6200, () => window.toque())
// 🎥 vídeo da entrada inteira
const ctx = await br.newContext({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 1, recordVideo: { dir: SAIDA, size: { width: 420, height: 880 } } })
const v = await ctx.newPage()
await v.goto('file://' + tmp); await v.evaluate(() => document.fonts.ready); await v.waitForTimeout(1200)
await v.evaluate(() => window.entra()); await v.waitForTimeout(7200)
await v.evaluate(() => window.toque()); await v.waitForTimeout(2200)
await ctx.close(); await br.close()
const webm = readdirSync(SAIDA).find(f => f.endsWith('.webm'))
if (webm) {
  try { execSync(`ffmpeg -y -loglevel error -i "${path.join(SAIDA, webm)}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${path.join(SAIDA, 'entrada-gala.mp4')}"`); renameSync(path.join(SAIDA, webm), path.join(SAIDA, 'entrada-gala.webm')) } catch (e) { console.log('⚠️ ffmpeg:', e.message) }
}
console.log('✅', SAIDA)
