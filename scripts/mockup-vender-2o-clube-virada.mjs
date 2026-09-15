// 🖼️ MOCKUP — o botão de VENDER O 2º CLUBE também na tela da VIRADA.
//
// Diego, 15/09, com o print do Futpoint FC: *"aqui por exemplo o Futpoint tá usando
// o time principal dele e N tá aparecendo p deixar vender o segundo clube"*.
//
// Ele estava certo, e não era nenhuma das travas da regra (ele ESTAVA no clube
// principal, que é a condição). O buraco é outro: a caixa "🏛️ MULTICLUBES — quem
// você comanda?" existe em DOIS lugares —
//   · na tela da VIRADA (📅 Próxima temporada), que é a do print;
//   · na aba CLUBE › Estádio.
// …e o botão de vender (14/09) só tinha sido posto na aba Clube. Quem estava na
// virada — justamente onde se decide o time da próxima temporada — não via jeito
// nenhum de vender.
//
// Rodar: node scripts/mockup-vender-2o-clube-virada.mjs [saida.png]
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const caixa = (comVenda) => `<div class="mc">
  <p class="tt">🏛️ MULTICLUBES — quem você comanda?</p>
  <div class="dois">
    <div class="on">🟡 Futpoint FC<span>no comando ✓</span></div>
    <div class="off">⚪ Leão da Estradinha<span>dormindo 💤</span></div>
  </div>
  <button class="trocar">🔄 Passar o comando pro Leão da Estradinha</button>
  ${comVenda ? '<button class="vender">💸 Vender o Leão da Estradinha · 3.000 🪙</button>' : ''}
  <p class="pe">Trocar = na próxima você comanda o outro; este dorme (mesmo time).</p>
</div>`

const tela = (comVenda) => `
  <p class="selo">👉 SUA VEZ <i>decida como monta o time da próxima</i></p>
  <p class="h">📅 Próxima temporada</p>
  ${caixa(comVenda)}
  <p class="txt">Acessos e quedas (por nome exato) já entram. Abra o leilão de transferências (1 carta nova por posição + os jogadores que cada técnico listar), ou siga com o mesmo elenco.</p>
  <div class="aviso"><b>🏛️ Você tem 2 clubes — o leilão é de UM só</b><p>Se abrir o leilão, ele vale só pro <b>Futpoint FC</b> (o que você comanda).</p></div>
  <button class="acao ouro">🔨 Leilão de transferências</button>
  <button class="acao verde">▶️ Mesmo time (sem leilão)</button>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:#e9e1c9;font-family:system-ui;color:${INK};width:1000px;padding:26px}
 h1{font-family:Oswald;font-size:30px;margin:0 0 4px;text-transform:uppercase}
 p.sub{font-size:16px;color:#4a4636;margin:0 0 20px;line-height:1.5}
 .grid{display:flex;gap:22px;align-items:flex-start}
 .col{width:450px}
 .ct{font-family:Oswald;font-weight:900;font-size:15px;text-transform:uppercase;padding:8px 12px;border:4px solid ${INK};border-radius:14px 14px 0 0;border-bottom:0}
 .ct.a{background:#E8E2CE} .ct.b{background:${VERDE};color:#fff}
 .tela{background:${CREME};border:4px solid ${INK};border-radius:0 0 14px 14px;padding:12px;box-shadow:5px 5px 0 ${INK}}

 .selo{margin:0 0 8px;font:900 11px Oswald;text-transform:uppercase;display:flex;align-items:center;gap:8px}
 .selo i{font-style:normal;font:700 10.5px system-ui;color:#5a5647;text-transform:none}
 p.selo::first-line{}
 .selo{color:#fff}
 .selo::before{content:'';}
 .h{font:900 14px Oswald;margin:0 0 5px}
 .mc{background:#0C0C0C;border:3px solid ${INK};border-radius:12px;padding:11px;color:#fff;margin-bottom:10px;box-shadow:3px 3px 0 ${INK}}
 .tt{font:900 12.5px Oswald;color:${GOLD};margin:0}
 .dois{display:flex;gap:6px;margin-top:7px}
 .dois div{flex:1;border:2px solid #000;border-radius:9px;padding:6px 8px;font:900 11px Oswald;text-align:center}
 .dois .on{background:${GOLD};color:#000} .dois .off{background:#3a3a3a;color:rgba(255,255,255,.7)}
 .dois span{display:block;font-size:8px;font-weight:800}
 .trocar{width:100%;margin-top:8px;border:2.5px solid #000;border-radius:10px;padding:9px;font:900 12px Oswald;background:#fff;color:#000}
 .vender{width:100%;margin-top:7px;border:2.5px solid #000;border-radius:10px;padding:9px;font:900 12px Oswald;background:${VERM};color:#fff}
 .pe{font-size:8.5px;color:rgba(255,255,255,.45);margin:6px 0 0;text-align:center;font-weight:600}
 .txt{font-size:11px;font-weight:600;color:#3a3527;line-height:1.45;margin:0 0 9px}
 .aviso{background:#FFF7E2;border:3px solid ${INK};border-radius:11px;padding:9px 11px;margin-bottom:10px;box-shadow:2px 3px 0 ${INK}}
 .aviso b{font:900 12px Oswald} .aviso p{font-size:10.5px;font-weight:700;color:#5a5647;margin:4px 0 0;line-height:1.4}
 .acao{width:100%;border:3px solid ${INK};border-radius:12px;padding:12px;font:900 15px Oswald;box-shadow:3px 4px 0 ${INK};margin-bottom:9px;display:block}
 .acao.ouro{background:${GOLD}} .acao.verde{background:${VERDE};color:#fff}

 .mark{margin-top:6px;border-radius:10px;padding:9px 11px;font-size:12px;font-weight:800;text-align:center;line-height:1.4}
 .mark.a{background:#FDECEA;border:3px dashed ${VERM};color:#8a2318}
 .mark.b{background:#E9F6EC;border:3px dashed ${VERDE};color:#1B5E30}
 .nota{margin-top:20px;background:#FFF4E2;border:4px solid #B8722A;border-radius:14px;padding:15px 18px;font-size:15.5px;line-height:1.55;color:#3A2C18}
 .nota b{font-weight:800}
</style>
<h1>💸 Vender o 2º clube — faltava na tela da virada</h1>
<p class="sub">Você pegou no print do Futpoint: ele <b>estava</b> no clube principal (que é a condição pra vender) e mesmo assim não tinha o botão. O motivo: a caixa do MULTICLUBES existe em <b>dois lugares</b> — na <b>virada</b> (a do print) e na aba <b>Clube</b> — e o botão de vender só tinha sido posto na aba Clube.</p>
<div class="grid">
  <div class="col"><div class="ct a">Como está (a tela do print)</div><div class="tela" style="background:#eef2f7">${tela(false)}</div>
    <div class="mark a">⚠️ só "passar o comando" — não tem como vender daqui</div></div>
  <div class="col"><div class="ct b">Proposta</div><div class="tela" style="background:#eef2f7">${tela(true)}</div>
    <div class="mark b">✅ o MESMO botão da aba Clube, com a MESMA trava</div></div>
</div>
<div class="nota">
  <b>O que muda:</b><br>
  · A caixa da <b>virada</b> ganha o mesmo botão vermelho <b>💸 Vender o [clube] · 3.000 🪙</b> que já existe na aba Clube — e a virada é o momento mais natural pra isso, porque é ali que você decide o time da próxima temporada.<br>
  · A trava continua a mesma: <b>só o 2º clube se vende</b>, nunca o oficial do rank global. Se você estiver comandando o 2º, o botão não aparece e a caixa diz pra passar o comando primeiro. O motor também tem essa trava, então nem um clique torto venderia o clube errado.<br>
  · A janelinha de confirmar (com o churrasco de despedida 🍖) saiu de dentro da aba Clube e passou a morar na raiz da tela — senão o clique na virada não abriria nada.<br>
  <b>Dá pra voltar atrás?</b> Sim — é um bloco num arquivo só. Nada de save, nada de banco, e nada muda pra quem não tem 2º clube.
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2] ?? 'mockup-vender-2o-clube-virada.png', fullPage: true })
await b.close()
console.log('ok')
