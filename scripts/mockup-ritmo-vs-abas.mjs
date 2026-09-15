// 🖼️ MOCKUP — separar o RITMO DA PARTIDA (Manual/Auto/velocidade) das ABAS
// (Jogos+Tabela / Estatísticas / Elenco) na tela da partida.
//
// Diego, 15/09, vendo a live do canalmeianacanela: *"sabe uma coisa que tá
// confundindo? o modo AUTO junto com a mesma aba de estatística e tabela, jogos,
// tabela, elenco — ele tá com a mesma aba, cor, tamanho, sei lá, do elenco. Faz
// um mockup novo aí pra diferenciar um pouquinho, mesmo que seja o tamanho, ou
// então a cor, não sei"*.
//
// O motivo é real e está no CSS: as DUAS linhas usam a mesma `.ll25-button`, com
// o MESMO roxo #7C3AED no `aria-pressed=true` e a mesma altura de 44px
// (`online-match-visual.css`). Ou seja, a tela usa o mesmo sinal pra duas coisas
// diferentes: "como a partida roda" e "que conteúdo estou vendo".
//
// Rodar: node scripts/mockup-ritmo-vs-abas.mjs [saida.png]
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', ROXO = '#7C3AED', VERDE = '#1B7A3D'

// a barra de placar, só pra dar contexto de onde isso mora na tela
const placar = `<div class="pl">
  <div class="tm"><span class="es">A</span><b>Andreyzao</b><i>RIVAL</i></div>
  <div class="sc"><small>13'</small><strong>0 × 0</strong></div>
  <div class="tm r"><b>Meia na Canela 👑</b><i>VOCÊ</i><span class="es">M</span></div>
</div>`

const abas = (alt = 44, fs = 12) => `<nav class="abas" style="--h:${alt}px;--fs:${fs}px">
  <button class="on">JOGOS + TABELA</button><button>ESTATÍSTICAS</button><button>ELENCO</button>
</nav>`

const tela = (titulo, nota, ritmo, alturaAbas = 44) => `<div class="pan">
  <div class="ph">${titulo}</div>
  <div class="pb">
    ${placar}
    ${ritmo}
    ${abas(alturaAbas)}
    <p class="nt">${nota}</p>
  </div>
</div>`

// ── HOJE: as duas linhas idênticas ───────────────────────────────────────────
const ritmoHoje = `<div class="ritmo hoje">
  <button>MANUAL</button><button class="on">AUTO</button><select><option>Normal</option></select>
</div>`

// ── A: barra de controle escura, rótulo próprio, ativo DOURADO ───────────────
const ritmoA = `<div class="barra">
  <span class="rot">⏱️ RITMO</span>
  <div class="seg"><button>MANUAL</button><button class="onG">AUTO</button></div>
  <select class="mini"><option>Normal</option></select>
</div>`

// ── B: mesmo formato, porém MENOR e com o ativo VERDE ────────────────────────
const ritmoB = `<div class="ritmo peq">
  <button>MANUAL</button><button class="onV">AUTO</button><select><option>Normal</option></select>
</div>`

// ── C: cada linha com seu rótulo, e o ritmo em pílulas ───────────────────────
const ritmoC = `<div class="rotulado">
  <span class="cap">⏱️ Como a partida roda</span>
  <div class="pills"><button>MANUAL</button><button class="onP">AUTO</button><select class="pillsel"><option>Normal</option></select></div>
</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:${CREME};font-family:system-ui;color:${INK};width:1620px;padding:30px}
 h1{font-family:Oswald;font-size:36px;margin:0 0 4px;text-transform:uppercase}
 p.sub{font-size:17px;color:#4a4636;margin:0 0 22px;line-height:1.5;max-width:1300px}
 .grid{display:flex;gap:18px;align-items:flex-start}
 .pan{flex:1;background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};overflow:hidden}
 .ph{font-family:Oswald;font-weight:900;font-size:15px;text-transform:uppercase;padding:9px 12px;border-bottom:4px solid ${INK};background:${GOLD};letter-spacing:.4px}
 .pb{padding:14px;background:#14160f}
 .nt{font-size:12.5px;line-height:1.45;color:#d8d4c2;margin:14px 0 0;font-weight:600}
 .nt b{color:#fff}

 /* placar (só contexto) */
 .pl{display:flex;align-items:center;gap:8px;background:#1d2118;border:3px solid #59624d;border-radius:12px;padding:10px 12px;margin-bottom:12px}
 .tm{flex:1;display:flex;align-items:center;gap:7px;min-width:0}
 .tm.r{justify-content:flex-end;text-align:right}
 .tm b{font-family:Oswald;font-weight:700;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .tm i{font-style:normal;font-size:8px;color:#9aa38c;letter-spacing:1px}
 .es{flex:none;width:22px;height:22px;border-radius:999px;background:#3a4433;color:#fff;font:700 11px Oswald;display:grid;place-items:center}
 .sc{flex:none;text-align:center;background:#fff;border-radius:8px;padding:2px 10px}
 .sc small{display:block;font:700 9px Oswald;color:#5a5647}
 .sc strong{display:block;font:900 17px Oswald}

 /* o botão de HOJE — cópia fiel do .ll25-button */
 .ritmo,.abas{display:grid;gap:6px}
 .ritmo{grid-template-columns:1fr 1fr 1.5fr;margin-bottom:12px}
 .abas{grid-template-columns:1.35fr 1fr 1fr;margin:16px 0 0}
 .ritmo button,.ritmo select,.abas button{background:#fff;color:${INK};border:3px solid ${INK};border-radius:10px;
   box-shadow:2px 3px 0 ${INK};min-height:44px;padding:7px 8px;font:700 13px/1.2 Oswald,sans-serif;width:100%}
 .abas button{min-height:var(--h,44px);padding:7px 2px;font-size:var(--fs,12px)}
 .ritmo .on,.abas .on{background:${ROXO};color:#fff}
 .ritmo select{background:${GOLD}}

 /* A — barra de controle */
 .barra{display:flex;align-items:center;gap:8px;background:#000;border:3px solid #6c6350;border-radius:12px;padding:7px 9px;margin-bottom:12px}
 .barra .rot{flex:none;font:900 10.5px Oswald;letter-spacing:1.2px;color:#b9b19a;text-transform:uppercase}
 .barra .seg{flex:1;display:flex;gap:0;border:2px solid #6c6350;border-radius:8px;overflow:hidden}
 .barra .seg button{flex:1;background:transparent;color:#cfc8b4;border:0;min-height:32px;font:700 12px Oswald;cursor:pointer}
 .barra .seg .onG{background:${GOLD};color:${INK};font-weight:900}
 .barra .mini{flex:none;width:112px;min-height:32px;background:#1d2118;color:#e6e1cf;border:2px solid #6c6350;border-radius:8px;font:700 11.5px Oswald;padding:0 6px}

 /* B — mesmo formato, menor, ativo verde */
 .ritmo.peq button,.ritmo.peq select{min-height:32px;font-size:11.5px;border-width:2px;box-shadow:1.5px 2px 0 ${INK};border-radius:8px}
 .ritmo.peq .onV{background:${VERDE};color:#fff}

 /* C — rótulo + pílulas */
 .rotulado{margin-bottom:12px}
 .rotulado .cap{display:block;font:700 10px Oswald;letter-spacing:1.4px;color:#9aa38c;text-transform:uppercase;margin-bottom:5px}
 .pills{display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:6px}
 .pills button,.pills select{background:#22261c;color:#cfc8b4;border:2px solid #6c6350;border-radius:999px;min-height:34px;font:700 12px Oswald;width:100%;padding:0 8px}
 .pills .onP{background:#fff;color:${INK};border-color:#fff;font-weight:900}

 .nota{margin-top:22px;background:#FFF4E2;border:4px solid #B8722A;border-radius:16px;padding:16px 20px;font-size:16px;line-height:1.55;color:#3A2C18}
 .nota b{font-weight:800}
</style>
<h1>⏱️ Ritmo × 📑 Abas — dar cara diferente pra cada um</h1>
<p class="sub">Hoje as duas linhas usam <b>o mesmo botão, o mesmo roxo e a mesma altura</b> (é literalmente a mesma classe no CSS). Só que uma decide <b>como a partida roda</b> e a outra decide <b>que tela você está vendo</b> — e a tela não conta isso pra ninguém. Três jeitos de separar:</p>

<div class="grid">
  ${tela('Como é hoje', 'As duas linhas são <b>iguais</b>: mesmo roxo, mesma altura de 44px, mesma borda. Dá pra achar que AUTO é uma aba a mais.', ritmoHoje)}
  ${tela('A · barra de controle', 'O ritmo vira uma <b>barrinha preta</b> com rótulo ⏱️ RITMO, mais baixa que as abas. O ligado fica <b>dourado</b> — e o roxo passa a significar só uma coisa: <b>a aba em que você está</b>.', ritmoA)}
  ${tela('B · só menor e verde', 'Mesmo formato de hoje, só que <b>menor</b> (32px contra 44px) e com o ligado em <b>verde</b>. É a mudança mais barata — nada muda de lugar.', ritmoB)}
  ${tela('C · rótulo + pílulas', 'Cada bloco ganha um <b>rótulo pequeno</b> em cima e o ritmo vira <b>pílula arredondada</b>, que é outra forma. Formato diferente separa mais que cor.', ritmoC)}
</div>

<div class="nota">
  <b>Minha sugestão: a A.</b> Ela resolve pela raiz — o roxo deixa de ter dois significados e passa a querer dizer só "é aqui que você está". O rótulo <b>⏱️ RITMO</b> ainda diz em palavras pra que serve aquela linha, que é o que faltava pro pessoal da live entender.<br>
  A <b>B</b> é a mais rápida e menos arriscada (duas linhas de CSS, nada muda de lugar). A <b>C</b> separa bem pela forma, mas ocupa mais altura — e altura na tela da partida é disputada.
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1620, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2] ?? 'mockup-ritmo-vs-abas.png', fullPage: true })
await b.close()
console.log('ok')
