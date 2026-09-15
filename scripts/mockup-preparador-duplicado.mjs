// 🖼️ MOCKUP — tirar o PREPARADOR FÍSICO repetido na aba Elenco.
//
// Diego, 15/09, com dois prints da aba Elenco: *"aqui será q N tá confuso Tb não?
// Mostrando falando de preparador em cima e dps preparador em baixo"*.
//
// Ele está certo, e o motivo é o mesmo de sempre: DOIS BLOCOS COM O MESMO TÍTULO.
//   · em CIMA do campinho: uma caixa chamada "🧑‍⚕️ Preparador físico" — mas o trabalho
//     dela é outro: listar QUEM ESTÁ CANSADO e trazer o botão 🔁 RODIZIAR;
//   · embaixo do campinho: o "🏛️ Departamento Técnico", que é onde se CONTRATA.
// Como a de cima usa o nome da de baixo, ela ainda precisa de um botão "VER O
// DEPARTAMENTO TÉCNICO" pra mandar a pessoa pro outro bloco — ou seja, a tela diz
// "você não tem preparador" DUAS vezes, com dois botões dourados diferentes.
//
// Conserto (nada muda de lugar, nada some):
//   1. a caixa de cima passa a se chamar pelo que ela FAZ: "😓 QUEM ESTÁ CANSADO";
//   2. o aviso de bloqueio dela encolhe pra UMA linha, sem botão — contratar passa a
//      existir num lugar só, o Departamento Técnico.
//
// Rodar: node scripts/mockup-preparador-duplicado.mjs [saida.png]
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const cansados = `<p class="lista">
  <span>🚑 <b style="color:#7A1B1B">Pedro Gallese, Santiago Arias, Bernabei, Durval, Ricardo Rocha</b></span>
  <span>😓 <b style="color:#B8860B">Petit, Borges</b></span></p>`

const campinho = `<div class="campo"><span class="cl">campinho (igualzinho)</span><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`

// ── HOJE ─────────────────────────────────────────────────────────────────────
const hoje = `
<div class="cx">
  <p class="tt">🧑‍⚕️ PREPARADOR FÍSICO <span class="q">?</span></p>
  ${cansados}
  <div class="lock">
    <b>🔒 Você não tem preparador físico</b>
    <p>Dá pra rodiziar <b>na mão</b> do mesmo jeito: toque no cansado e depois no reserva — substituição normal. Pra ter o botão <b>🔁 RODIZIAR</b>, contrate um preparador no <b>Departamento Técnico</b>, logo abaixo do campinho.</p>
    <button class="ouro">🏋️ VER O DEPARTAMENTO TÉCNICO</button>
  </div>
</div>
${campinho}
<div class="dep">
  <p class="dt">🏛️ DEPARTAMENTO TÉCNICO<small>comissão — não entram em campo</small></p>
  <div class="depb">
    <p class="sub">🧢 TÉCNICO</p>
    <div class="vaga"><b>Você ainda não tem técnico</b><p>Sem técnico você joga só no 4-3-3 e no 4-4-2…</p></div>
    <p class="sub">🏋️ PREPARADOR FÍSICO</p>
    <div class="vaga"><b>Vaga aberta</b><p>Ele libera o botão 🔁 RODIZIAR e faz cada rodada no banco devolver mais gás.</p>
      <button class="ouro">CONTRATAR PREPARADOR</button></div>
  </div>
</div>
<div class="mark a">⚠️ "preparador físico" DUAS vezes · dois avisos de bloqueio · dois botões dourados</div>`

// ── PROPOSTA ─────────────────────────────────────────────────────────────────
const prop = `
<div class="cx">
  <p class="tt">😓 QUEM ESTÁ CANSADO <span class="q">?</span></p>
  ${cansados}
  <p class="linha">Troque <b>na mão</b>: toque no cansado, depois no reserva. O botão <b>🔁 RODIZIAR</b> vem com o preparador — <u>contrate no Departamento Técnico ↓</u></p>
</div>
${campinho}
<div class="dep">
  <p class="dt">🏛️ DEPARTAMENTO TÉCNICO<small>comissão — não entram em campo</small></p>
  <div class="depb">
    <p class="sub">🧢 TÉCNICO</p>
    <div class="vaga"><b>Você ainda não tem técnico</b><p>Sem técnico você joga só no 4-3-3 e no 4-4-2…</p></div>
    <p class="sub">🏋️ PREPARADOR FÍSICO</p>
    <div class="vaga"><b>Vaga aberta</b><p>Ele libera o botão 🔁 RODIZIAR e faz cada rodada no banco devolver mais gás.</p>
      <button class="ouro">CONTRATAR PREPARADOR</button></div>
  </div>
</div>
<div class="mark b">✅ cada caixa com o nome do que ela FAZ · contratar existe num lugar só</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:#e9e1c9;font-family:system-ui;color:${INK};width:1020px;padding:26px}
 h1{font-family:Oswald;font-size:30px;margin:0 0 4px;text-transform:uppercase}
 p.sub0{font-size:16px;color:#4a4636;margin:0 0 20px;line-height:1.5}
 .grid{display:flex;gap:20px;align-items:flex-start}
 .col{width:460px}
 .ct{font-family:Oswald;font-weight:900;font-size:15px;text-transform:uppercase;padding:8px 12px;border:4px solid ${INK};border-radius:14px 14px 0 0;border-bottom:0}
 .ct.a{background:#E8E2CE} .ct.b{background:${VERDE};color:#fff}
 .tela{background:${GOLD};border:4px solid ${INK};border-radius:0 0 14px 14px;padding:11px;box-shadow:5px 5px 0 ${INK}}

 .cx{border:3px solid ${INK};background:#FFF6D6;border-radius:11px;padding:9px 12px;margin-bottom:10px;box-shadow:3px 3px 0 ${INK}}
 .tt{font:900 11px Oswald;letter-spacing:.6px;color:#5a5647;margin:0;text-transform:uppercase;display:flex;align-items:center}
 .tt .q{margin-left:auto;width:20px;height:20px;border-radius:999px;border:2px solid ${INK};background:#fff;font:900 11px/16px Oswald;text-align:center}
 .lista{font-size:12px;font-weight:700;line-height:1.6;margin:4px 0 0;display:flex;flex-direction:column}
 .lock{margin-top:8px;border:2.5px dashed #8a6d00;border-radius:9px;background:#FFFBEC;padding:8px 10px}
 .lock b{font:900 12.5px Oswald;color:#8a6d00;display:block}
 .lock p{font-size:10.5px;font-weight:700;color:#6b5a1f;margin:3px 0 0;line-height:1.45}
 .linha{font-size:10.5px;font-weight:700;color:#6b5a1f;margin:7px 0 0;line-height:1.45}
 .linha u{color:#8a6d00}
 button.ouro{margin-top:7px;width:100%;border:2.5px solid ${INK};border-radius:9px;padding:7px 9px;font:900 12px Oswald;background:${GOLD};box-shadow:2px 2px 0 ${INK}}

 .campo{background:repeating-linear-gradient(180deg,${VERDE} 0 15px,#166332 15px 30px);border:3px solid ${INK};border-radius:11px;padding:9px 7px;display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:10px;position:relative}
 .campo .cl{position:absolute;top:5px;left:0;right:0;text-align:center;font:700 9px Oswald;color:rgba(255,255,255,.75)}
 .campo i{display:block;width:15px;height:21px;border-radius:4px;background:linear-gradient(180deg,#fff 0 58%,#0A0A0A 58%);border:1.5px solid ${INK};margin-top:11px}

 .dep{border:3px solid ${INK};border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 ${INK}}
 .dt{background:#14160f;color:#fff;font:900 13px Oswald;margin:0;padding:8px 11px;text-transform:uppercase}
 .dt small{display:block;font:700 9px system-ui;opacity:.6;text-transform:none;margin-top:1px}
 .depb{background:#fff;padding:9px 10px}
 .sub{font:900 9.5px Oswald;letter-spacing:.7px;color:#8a8266;margin:0 0 6px;text-transform:uppercase}
 .vaga{border:2.5px dashed rgba(12,12,12,.45);border-radius:9px;padding:8px 10px;margin-bottom:9px}
 .vaga b{font:900 13px Oswald;display:block}
 .vaga p{font-size:10.5px;font-weight:700;color:#5a5647;margin:3px 0 0;line-height:1.45}

 .mark{margin-top:11px;border-radius:10px;padding:9px 11px;font-size:12px;font-weight:800;text-align:center;line-height:1.4}
 .mark.a{background:#FDECEA;border:3px dashed ${VERM};color:#8a2318}
 .mark.b{background:#E9F6EC;border:3px dashed ${VERDE};color:#1B5E30}

 .nota{margin-top:20px;background:#FFF4E2;border:4px solid #B8722A;border-radius:14px;padding:15px 18px;font-size:15.5px;line-height:1.55;color:#3A2C18}
 .nota b{font-weight:800}
</style>
<h1>🧑‍⚕️ O preparador aparecendo duas vezes</h1>
<p class="sub0">Você pegou: a caixa de <b>cima</b> se chama "Preparador físico", mas o trabalho dela é outro — ela mostra <b>quem está cansado</b> e traz o 🔁 RODIZIAR. Contratar é lá <b>embaixo</b>, no Departamento Técnico. Como as duas têm o mesmo nome, a tela avisa "você não tem preparador" <b>duas vezes</b>, com dois botões dourados.</p>
<div class="grid">
  <div class="col"><div class="ct a">Como está agora</div><div class="tela">${hoje}</div></div>
  <div class="col"><div class="ct b">Proposta</div><div class="tela">${prop}</div></div>
</div>
<div class="nota">
  <b>O que muda (nada sai do lugar, nada some):</b><br>
  · A caixa de cima passa a se chamar <b>😓 QUEM ESTÁ CANSADO</b> — que é o que ela faz. A lista dos cansados e o botão 🔁 RODIZIAR continuam iguais, no mesmo lugar.<br>
  · O aviso de bloqueio dela vira <b>uma linha só</b>, sem botão: "troque na mão… o 🔁 RODIZIAR vem com o preparador — contrate no Departamento Técnico ↓".<br>
  · <b>Contratar passa a existir num lugar só</b>: o Departamento Técnico, embaixo do campinho, que já tem o técnico e o preparador juntos.<br>
  <b>Dá pra voltar atrás?</b> Sim — é um título e um parágrafo, num arquivo só. Nada de save, nada de banco.
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1020, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2] ?? 'mockup-preparador-duplicado.png', fullPage: true })
await b.close()
console.log('ok')
