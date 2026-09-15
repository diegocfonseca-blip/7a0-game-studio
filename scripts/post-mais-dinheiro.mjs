// 📢 STORIES — "o clube ganha muito mais agora" (Diego, 15/09)
//
// Pedido dele: *"quero um mockup com todos os aumentos que fizemos e inclusões, e como
// era até ontem e tudo de novo que fiz hoje… bico que aumentei, TV que aumentei,
// patrocínios que aumentei se eu aumentei, camisa que é novo e pode render, patrocínio
// de fornecedor que é novo também… quero um mockup pra stories disso, pras pessoas
// entenderem o que fizemos de novo pra ganhar mais dinheiro"*.
//
// ⚠️ TODOS OS NÚMEROS SÃO MEDIDOS, não escritos à mão:
//   · o ANTES saiu do próprio git (commits `2f151197^` e `b4857483^`): Master
//     V2·D4·C8·B16·A32 · bico V2·D4 (não existia na C) · TV 1/5/10/15/20;
//   · o AGORA sai das funções de verdade (`masterPorTemporada`, `fornPorTemporada`,
//     `calculaVendas`) — o mesmo código que paga no fim da temporada.
//   · a linha de exemplo usa contrato de 3 temporadas e um estádio médio com a Loja
//     construída. Refazer a conta: `node scripts/_tmp-antesdepois.mjs` (ver commit).
//
// 🚫 Sem tabela de valor por valor na tela: a régua completa confunde (ele mandou tirar
// as réguas de dentro do jogo em 15/09). O post mostra a ESCADA e o total.
//
// Rodar: node scripts/post-mais-dinheiro.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/stories-mais-dinheiro.png')
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERM = '#C2452F', VERDE = '#1B7A3D', ROXO = '#7C3AED'

// uma linha do "o que mudou": ícone · nome · antes → agora
const linha = (ic, nome, antes, agora, novo) => `
  <div class="ln">
    <span class="ic">${ic}</span>
    <span class="nm">${nome}</span>
    ${novo
      ? `<span class="novo">NOVO</span>`
      : `<span class="de">${antes}</span><span class="seta">→</span><span class="pra">${agora}</span>`}
  </div>`

// a barra do antes/depois por divisão
const barra = (div, antes, agora, max) => `
  <div class="bg">
    <span class="bdiv">${div}</span>
    <span class="bwrap">
      <span class="bA" style="width:${Math.max(6, antes / max * 100)}%">${antes}</span>
      <span class="bB" style="width:${Math.max(10, agora / max * 100)}%">${agora}</span>
    </span>
  </div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};
       width:1080px;height:1920px;padding:60px 58px 50px;display:flex;flex-direction:column}
  .pill{align-self:flex-start;background:${OURO};border:5px solid ${INK};border-radius:40px;
        padding:11px 28px;font-weight:900;font-size:23px;letter-spacing:2.4px;box-shadow:7px 7px 0 ${INK}}
  h1{font-size:96px;line-height:.9;margin:22px 0 0;text-transform:uppercase;letter-spacing:-3px}
  h1 em{font-style:normal;color:${VERDE}}
  p.lead{font-family:system-ui;font-size:29px;line-height:1.35;color:#3a3527;margin:18px 0 0;font-weight:500}
  p.lead b{font-weight:800}

  .c{background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};
     padding:18px 22px;margin-top:20px}
  .c h3{margin:0 0 12px;font-size:31px;text-transform:uppercase;line-height:1.1}

  .ln{display:flex;align-items:center;gap:13px;padding:9px 0;border-bottom:3px solid rgba(12,12,12,.09)}
  .ln:last-child{border-bottom:0}
  .ic{font-size:35px;line-height:1;flex:none;width:44px;text-align:center}
  .nm{flex:1;font-size:30px;font-weight:900;text-transform:uppercase;letter-spacing:-.5px;line-height:1.05}
  .de{font-family:system-ui;font-size:24px;font-weight:700;color:#9a927c;text-decoration:line-through;white-space:nowrap}
  .seta{font-size:26px;font-weight:900;color:#9a927c}
  .pra{font-size:31px;font-weight:900;color:${VERDE};white-space:nowrap;min-width:150px;text-align:right}
  .novo{font-size:24px;font-weight:900;color:#fff;background:${ROXO};border:4px solid ${INK};
        border-radius:999px;padding:3px 18px;letter-spacing:1.6px;box-shadow:3px 3px 0 ${INK}}

  .so{margin-top:22px;background:${INK};color:${CREME};border-radius:26px;padding:22px 26px;
      box-shadow:9px 9px 0 ${VERDE}}
  .so h2{margin:0;font-size:40px;text-transform:uppercase;color:${OURO};line-height:1.05}
  .so .sub{font-family:system-ui;font-size:24px;color:rgba(244,236,214,.82);margin:7px 0 16px;font-weight:600}
  .bg{display:flex;align-items:center;gap:14px;margin-bottom:11px}
  .bdiv{flex:none;width:112px;font-size:25px;font-weight:900;text-transform:uppercase;color:#fff}
  .bwrap{flex:1;display:flex;flex-direction:column;gap:5px}
  .bA,.bB{display:flex;align-items:center;justify-content:flex-end;padding-right:12px;
          height:32px;border-radius:8px;font-size:21px;font-weight:900;color:#fff}
  .bA{background:#5b5346}
  .bB{background:${VERDE};color:#fff}

  .punch{margin-top:22px;display:flex;align-items:center;gap:22px;background:${OURO};
         border:6px solid ${INK};border-radius:24px;box-shadow:7px 7px 0 ${INK};padding:16px 24px}
  .punch .big{font-size:86px;font-weight:900;line-height:1;letter-spacing:-4px;flex:none}
  .punch .txt{font-family:system-ui;font-size:27px;line-height:1.3;font-weight:600;color:#2e2a1c}
  .punch .txt b{font-weight:900;color:${INK}}

  .shh{margin-top:auto;display:flex;align-items:center;gap:20px;background:#FFF4E2;
       border:6px solid #B8722A;border-radius:24px;padding:18px 22px;box-shadow:6px 6px 0 #B8722A}
  .shh .emo{font-size:52px;line-height:1}
  .shh p{margin:0;font-family:system-ui;font-size:25px;line-height:1.35;color:#3A2C18;font-weight:700}

  .foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;
        border-top:7px solid ${INK};padding-top:16px}
  .foot .mk{font-size:44px;font-weight:900;text-transform:uppercase}
  .foot .mk span{color:${VERM}}
  .foot .rt{font-family:system-ui;font-size:22px;color:#6b6552;text-align:right;line-height:1.35}
</style>
<span class="pill">🤑 MODO CARREIRA · O QUE MUDOU</span>
<h1>O clube<br>ganha<br><em>muito mais</em></h1>
<p class="lead">Mexemos em <b>tudo que pinga no caixa</b> — e abrimos <b>duas fontes novas</b> de dinheiro.</p>

<div class="c">
  <h3>💰 O que mudou</h3>
  ${linha('📺', 'Cota de TV', 'até 20', 'até 50 🪙')}
  ${linha('🕴️', 'Bico de folga', '2 a 4', '5 a 10 🪙')}
  ${linha('🏆', 'Patrocínio Master', 'menor', 'subiu até a C')}
  ${linha('👟', 'Fornecedor de material', '', '', true)}
  ${linha('🛍️', 'Venda de camisas', '', '', true)}
</div>

<div class="so">
  <h2>📈 Por temporada, no seu caixa</h2>
  <div class="sub">o que entrava até ontem × o que entra agora</div>
  ${barra('Várzea', 8, 43, 192)}
  ${barra('Série D', 18, 61, 192)}
  ${barra('Série C', 28, 93, 192)}
  ${barra('Série B', 51, 119, 192)}
  ${barra('Série A', 92, 192, 192)}
</div>

<div class="punch">
  <span class="big">5×</span>
  <span class="txt">mais dinheiro na <b>Várzea</b> que ontem —<br>e mais que o <b>dobro</b> em todas as outras</span>
</div>

<div class="shh">
  <div class="emo">🏟️</div>
  <p>As duas fontes novas pedem a <b>Loja do Clube</b> construída no estádio — e o bico começa na <b>3ª temporada</b>. O resto vale pra todo mundo, sozinho.</p>
</div>

<div class="foot">
  <div class="mk">⚽ Leilão <span>Legends</span></div>
  <div class="rt">já está no ar<br>leilaolegends.com</div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await p.setContent(html, { waitUntil: 'networkidle' })
const sobra = await p.evaluate(() => document.body.scrollHeight - window.innerHeight)
if (sobra > 0) console.warn(`⚠️ o conteúdo passou ${sobra}px da altura do stories — encolher algo`)
await p.screenshot({ path: SAIDA })
await b.close()
console.log(SAIDA)
