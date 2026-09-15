// 🖼️ MOCKUP — o aviso da DEVOLUÇÃO das moedas do 🏥 Departamento Médico.
//
// Diego, 15/09: *"pode doar de volta p todos esses.. consegue? É quero mockup
// explicando q como tiramos pra fazer preparador físico e condição física removemos
// mas doamos de volta a grana deles"*.
//
// Contexto: em 12/09 a obra 🏥 saiu do jogo pra virar 😓 condição física + 🏋️ preparador,
// e naquele dia ficou SEM reembolso — ordem dele mesmo (*"quem comprou esquece, vai ser
// igual p todos"*). Em 15/09, depois de eu medir no banco que são **167 pessoas / 180
// carreiras**, ele voltou atrás e mandou devolver.
//
// O aviso é um RECIBO, não um botão de resgate: quando ele aparece, o dinheiro JÁ está
// no caixa (`devolveMedicoUmaVez` em store.tsx paga ao abrir o save).
//
// Rodar: node scripts/mockup-devolve-medico.mjs [saida.png]
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const banner = `
<div class="bn">
  <span class="pill">💸 Devolvemos pra você</span>
  <p class="h">Suas <b>1.000 🪙</b> do Departamento Médico voltaram</p>
  <p class="tx">O 🏥 <b>Departamento Médico</b> saiu do jogo pra dar lugar a uma coisa melhor: a
    <b>😓 condição física</b> e o <b>🏋️ preparador</b>. A obra antiga só ajudava quem tinha pago
    por ela — agora a regra é <b>igual pra todo mundo</b>: quem rodizia o elenco se machuca menos.<br>
    Como a obra não existe mais, as moedas que você gastou nela <b>voltaram pro seu caixa</b>.
    Nada mais no seu clube foi mexido.</p>
  <div class="cx">+1.000 🪙 já no caixa do clube <i>· está lançado no Extrato</i></div>
  <div class="bts"><button class="ouro">🏋️ Ver o preparador</button><button class="ghost">Entendi</button></div>
</div>`

const telaTopo = `
  <div class="banner"><b>TEMPORADA 25 · LIGA LEGENDS</b><h3>Rodada 1 <small>/ 38</small></h3><i>Série C</i></div>
  ${banner}
  <div class="resto">👉 e a rodada segue normal, logo abaixo</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:#e9e1c9;font-family:system-ui;color:${INK};width:1180px;padding:26px}
 h1{font-family:Oswald;font-size:31px;margin:0 0 4px;text-transform:uppercase}
 p.sub{font-size:16px;color:#4a4636;margin:0 0 20px;line-height:1.5;max-width:1080px}
 .row{display:flex;gap:22px;align-items:flex-start}
 .col-tela{width:430px;flex:none}
 .ct{font-family:Oswald;font-weight:900;font-size:15px;text-transform:uppercase;padding:8px 12px;
   border:4px solid ${INK};border-radius:14px 14px 0 0;border-bottom:0;background:${VERDE};color:#fff}
 .tela{background:${CREME};border:4px solid ${INK};border-radius:0 0 14px 14px;padding:12px;box-shadow:5px 5px 0 ${INK}}

 .banner{background:linear-gradient(160deg,#1d2118,#0e1109);border:3px solid ${INK};border-radius:12px;padding:10px 12px;color:#fff;margin-bottom:10px}
 .banner b{font:900 9.5px Oswald;color:${GOLD};letter-spacing:.8px}
 .banner h3{font:900 21px Oswald;margin:2px 0 0} .banner h3 small{font-size:12px;opacity:.6}
 .banner i{font-style:normal;font-size:10.5px;opacity:.7}

 .bn{background:linear-gradient(150deg,#123b25,#0a1f13);border:4px solid ${INK};border-radius:16px;
   box-shadow:4px 4px 0 ${INK};padding:14px;color:#fff;margin-bottom:12px}
 .pill{display:inline-block;background:${GOLD};color:${INK};font:900 10.5px Oswald;padding:3px 9px;
   border-radius:999px;border:2px solid ${INK};text-transform:uppercase}
 .bn .h{font:900 19px Oswald;margin:8px 0 0;text-transform:uppercase;line-height:1.05}
 .bn .h b{color:${GOLD}}
 .bn .tx{font-size:12.5px;font-weight:600;line-height:1.45;margin:8px 0 0;color:#E3EDE3}
 .cx{display:flex;align-items:center;gap:8px;background:${VERDE};border:3px solid ${INK};border-radius:12px;
   box-shadow:3px 3px 0 ${INK};padding:9px 12px;margin:10px 0 0;font:900 13px Oswald;line-height:1.3}
 .cx i{font-style:normal;opacity:.85;font-weight:700;font-size:10.5px}
 .bts{display:flex;gap:8px;margin-top:10px}
 .bts button{border-radius:12px;font:900 13px Oswald;padding:10px 0;text-transform:uppercase}
 .ouro{flex:1;background:${GOLD};color:${INK};border:3px solid ${INK};box-shadow:3px 3px 0 ${INK}}
 .ghost{flex:none;background:transparent;color:#E3EDE3;border:3px solid rgba(255,255,255,.35);padding:10px 14px}
 .resto{font-size:11px;font-weight:800;color:#8a8266;text-align:center;padding:10px 0}

 .lado{flex:1}
 .card{background:#fff;border:4px solid ${INK};border-radius:15px;box-shadow:4px 4px 0 ${INK};padding:15px 18px;margin-bottom:14px}
 .card h2{font:900 16px Oswald;margin:0 0 8px;text-transform:uppercase}
 .card p,.card li{font-size:14px;line-height:1.55;margin:0 0 6px;color:#3A2C18}
 .card ul{margin:6px 0 0;padding-left:20px}
 .num{display:flex;gap:10px;margin:10px 0 0}
 .num div{flex:1;border:3px solid ${INK};border-radius:11px;padding:9px;text-align:center;background:#FFF7E2}
 .num b{display:block;font:900 24px Oswald;line-height:1}
 .num span{font-size:10.5px;font-weight:800;color:#5a5647}
 .seg{background:#EAFAEF;border:3px solid ${VERDE};border-radius:12px;padding:11px 13px;font-size:13.5px;line-height:1.5;color:#1c3d28}
 .seg b{font-weight:800}
</style>
<h1>🏥💸 Devolvendo as moedas do Departamento Médico</h1>
<p class="sub">A obra saiu do jogo em 12/09 pra virar a <b>😓 condição física</b> e o <b>🏋️ preparador</b> — e naquele dia ficou sem reembolso, por ordem sua. Você voltou atrás: <i>"pode doar de volta p todos esses"</i>. Aqui está o aviso que a pessoa vai ver ao abrir a carreira, e como a devolução é feita.</p>
<div class="row">
  <div class="col-tela">
    <div class="ct">o que a pessoa vê (uma vez só)</div>
    <div class="tela">${telaTopo}</div>
  </div>
  <div class="lado">
    <div class="card">
      <h2>📏 Quem recebe</h2>
      <p>Contei no banco, não de cabeça — quem tem a obra guardada numa carreira:</p>
      <div class="num">
        <div><b>167</b><span>pessoas</span></div>
        <div><b>180</b><span>carreiras</span></div>
        <div><b>1.000</b><span>🪙 cada</span></div>
      </div>
      <p style="margin-top:9px"><b>É o mínimo:</b> quem só joga com save no aparelho não aparece nessa conta — mas recebe igual, porque a devolução acontece <b>no aparelho da pessoa</b>, ao abrir a carreira. Não depende de estar na nuvem.</p>
    </div>
    <div class="card">
      <h2>🔒 Por que não tem como pagar duas vezes</h2>
      <ul>
        <li>A carreira ganha um <b>carimbo</b> na primeira vez que abre — e o carimbo é gravado <b>mesmo em quem nunca teve a obra</b>. Reabrir o jogo mil vezes não paga de novo.</li>
        <li>A obra <b>sai do save junto com o pagamento</b>. Não sobra caminho pra cobrar de novo.</li>
        <li>Só conta <b>clube seu</b> (o principal e o 2º clube comprado). Time da máquina nunca entra.</li>
        <li>Quem tem <b>dois clubes com a obra</b> recebe pelos dois — porque pagou duas vezes.</li>
      </ul>
    </div>
    <div class="card" style="margin-bottom:0">
      <h2>✅ O que NÃO é tocado</h2>
      <div class="seg">Elenco, títulos, colocação, o resto do estádio e a condição física ficam <b>exatamente</b> como estavam. A única coisa que muda no save é: <b>+1.000 🪙 no caixa</b>, a obra some da lista e entra <b>uma linha no Extrato</b>.<br>
      <b>Dá pra voltar atrás?</b> O código sim, é um bloco só. O dinheiro já entregue fica com a pessoa — e é isso que a gente quer mesmo.</div>
    </div>
  </div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2] ?? 'mockup-devolve-medico.png', fullPage: true })
await b.close()
console.log('ok')
