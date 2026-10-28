// Mockup (27/10): 🔒 NOME RESERVADO pra quem tem plano + a cópia do grátis marcada como 🎭 fake.
// Pedido do Diego: "quem tem plano reserva o nome p sempre… quem não tem alguém pode fazer igual…
// o que tava grátis irá aparecer joaquim fc fake". Rodar: node scripts/mockup-nome-reservado.mjs
import { chromium } from 'playwright-core'
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;800&family=Inter:wght@500;700&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#F4ECD6;font-family:Inter,sans-serif;color:#0C0C0C;width:760px;padding:26px;box-sizing:border-box}
h1{font:800 34px Oswald;text-transform:uppercase;margin:0 0 4px}
.sub{font-size:15px;margin:0 0 18px}
.box{background:#fff;border:4px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #000;padding:16px 18px;margin-bottom:20px}
.tit{font:800 15px Oswald;letter-spacing:1px;text-transform:uppercase;background:#0C0C0C;color:#FFC400;display:inline-block;padding:3px 10px;border-radius:8px;margin-bottom:10px}
.ok{font-size:15px;margin:6px 0}.ok b{font-weight:700}
.novo{background:#FFF4C2;border:3px solid #0C0C0C;border-radius:10px;padding:6px 10px;box-shadow:3px 3px 0 #000}
.tag{font:800 11px Oswald;background:#1B7A3D;color:#fff;border-radius:6px;padding:1px 6px;margin-left:6px;vertical-align:2px}
.linha{display:flex;align-items:center;gap:10px;border:3px solid #0C0C0C;border-radius:12px;padding:8px 12px;margin:8px 0;font:800 20px Oswald;text-transform:uppercase}
.prata{background:linear-gradient(90deg,#E9EEF2,#B9C4CC,#F6F8FA)}
.bege{background:#EFE3C6}
.fake{font:800 12px Oswald;background:#C2452F;color:#fff;border-radius:6px;padding:2px 7px;letter-spacing:.5px}
.cad{font:800 12px Oswald;background:#0C0C0C;color:#fff;border-radius:6px;padding:2px 7px}
.nota{font-size:13px;color:#444;margin:6px 0 0}
.campo{border:3px solid #0C0C0C;border-radius:10px;padding:8px 12px;font:700 17px Inter;background:#fff;margin:6px 0}
.aviso{border:3px solid #0C0C0C;border-radius:10px;padding:10px 12px;font-size:14px;margin:6px 0;box-shadow:3px 3px 0 #000}
.verde{background:#DDF2E3}.verm{background:#FBE1DB}
.n{color:#0C0C0C;font:800 16px Oswald;background:#FFC400;border:3px solid #0C0C0C;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;margin-right:6px}
</style></head><body>
<h1>🔒 Nome reservado</h1>
<p class="sub">Quem tem plano trava o nome do time. Quem é grátis pode repetir, mas aparece como cópia.</p>

<div class="box"><div class="tit"><span class="n">1</span>Na loja, em todo plano (do ⭐ Craque Salas pra cima)</div>
<div class="ok">✅ <b>🧑‍💼 Crie o seu presidente</b> (o seu personagem)</div>
<div class="ok">✅ <b>⚔️ Crie o seu clã</b></div>
<div class="ok novo">✅ <b>🔒 Seu nome reservado no jogo</b><span class="tag">NOVO</span><br><span style="font-size:13px">ninguém mais usa o nome do seu time · quem já usava aparece como 🎭 fake</span></div>
<div class="ok">✅ <b>🥈 Nome prata brilhando</b> nas salas, na tabela e no chat</div>
</div>

<div class="box"><div class="tit"><span class="n">2</span>Na sala: o dono de verdade × a cópia</div>
<div class="linha prata">🛡️ Joaquim FC <span class="cad">🔒</span></div>
<div class="linha bege">🛡️ Joaquim FC <span class="fake">🎭 FAKE</span></div>
<p class="nota">O 🔒 é de quem pagou. A cópia grátis continua jogando normal, só ganha o selo. Vale na sala, na tabela, no chat e no ranking.</p>
</div>

<div class="box"><div class="tit"><span class="n">3</span>Na hora de escolher o nome</div>
<div class="campo">Joaquim FC</div>
<div class="aviso verde"><b>Grátis:</b> ✅ pode usar — mas esse nome é de quem tem plano, então você aparece como <b>🎭 fake</b>. Quer o seu nome só seu? Qualquer plano trava ele.</div>
<div class="aviso verm"><b>Quem tem plano:</b> 🔒 esse nome já é de outro clube com plano. Tenta uma variação: acrescenta FC, um número ou o teu apelido.</div>
</div>
</body></html>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' }); const p = await b.newPage({ deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(1200)
const out = process.argv[2] || 'scripts/mockups/nome-reservado.png'
await p.locator('body').screenshot({ path: out }); await b.close(); console.log(out)
