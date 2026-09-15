// 📢 STORIES — "a sua camisa agora VENDE" (Diego 15/09: *"além do mockup de
// fornecedor de material, quero mockup de venda de camisas também"*).
//
// Formato: 1080×1920 (9:16), o MESMO molde dos posts que ele já aprovou.
//
// ⚠️ REGRAS DELE QUE VALEM AQUI:
//   · o post NÃO vira planilha (ele mandou tirar as réguas de dentro do jogo por
//     confundir) — mostra a ESCOLHA e o que ela significa, não a tabela toda;
//   · a camisa é a de VERDADE, montada pelas peças do jogo (`loja-pecas.mjs`);
//   · ⏳ rodapé "chegando"; `--no-ar` troca no dia que liberar geral.
//
// Rodar: node scripts/post-loja-camisas.mjs [--saida x.png] [--no-ar]
import { chromium } from 'playwright-core'
import { camisa, escudoBase, CAMISA_TIER, LOGO_VADICO } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/stories-loja-camisas.png')
const NO_AR = process.argv.includes('--no-ar')
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERM = '#C2452F', VERDE = '#1B7A3D'

const CAMISA = camisa({
  arte: CAMISA_TIER, alt: 300,
  escudo: escudoBase({ letra: 'S', c1: '#2E9E5B', c2: '#14612F', size: Math.round(300 * 0.085) }),
  fornecedor: 'Pumba', fornSimbolo: '🐆', master: '', masterLogo: LOGO_VADICO,
  masterW: 0.20, masterH: 0.155, masterCor: '#4F462E',
  pos: { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 },
})

// 💰 os três preços, com o que cada um é BOM pra fazer — sem tabela
const preco = (nome, moeda, quem, forte, cor) => `<div class="pc" style="border-color:${cor}">
  <div class="ph"><span class="pn">${nome}</span><span class="pv" style="background:${cor}">${moeda} 🪙</span></div>
  <div class="pq">${quem}</div>
  <div class="pf" style="color:${cor}">${forte}</div>
</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};
       width:1080px;height:1920px;padding:64px 60px 56px;display:flex;flex-direction:column}
  .pill{align-self:flex-start;background:${OURO};border:5px solid ${INK};border-radius:40px;
        padding:12px 30px;font-weight:900;font-size:24px;letter-spacing:2.4px;box-shadow:7px 7px 0 ${INK}}
  h1{font-size:104px;line-height:.89;margin:22px 0 0;text-transform:uppercase;letter-spacing:-3px}
  h1 em{font-style:normal;color:${VERDE}}
  p.lead{font-family:system-ui;font-size:30px;line-height:1.4;color:#3a3527;margin:20px 0 0;font-weight:500}
  p.lead b{font-weight:800}

  .vit{margin-top:22px;border:6px solid ${INK};border-radius:26px;box-shadow:6px 6px 0 ${INK};
       overflow:hidden;display:flex;align-items:center;gap:24px;padding:20px 26px;
       background:radial-gradient(120% 80% at 50% 0%,rgba(255,213,120,.40) 0%,rgba(255,196,0,.10) 40%,transparent 68%),
                  linear-gradient(#2A1B10,#140C06)}
  .vit .cam{flex:none;filter:drop-shadow(0 10px 14px rgba(0,0,0,.55))}
  .vit .tx{color:${CREME}}
  .vit .tx h2{margin:0;font-size:46px;line-height:1.02;text-transform:uppercase;color:${OURO}}
  .vit .tx p{margin:12px 0 0;font-family:system-ui;font-size:26px;line-height:1.4;color:rgba(244,236,214,.92);font-weight:500}
  .vit .tx p b{color:#fff}

  .pcs{display:flex;gap:14px;margin-top:20px}
  .pc{flex:1;background:#fff;border:6px solid;border-radius:22px;box-shadow:5px 5px 0 ${INK};padding:16px 14px}
  .ph{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .pn{font-size:30px;font-weight:900;text-transform:uppercase}
  .pv{font-size:22px;font-weight:900;color:#fff;border:3px solid ${INK};border-radius:11px;padding:2px 9px;white-space:nowrap}
  .pq{font-family:system-ui;font-size:21px;line-height:1.3;color:#555;margin-top:9px;font-weight:600}
  .pf{font-size:25px;font-weight:900;margin-top:9px;text-transform:uppercase;line-height:1.1}

  .so{margin:20px 0 0;background:${INK};color:${CREME};border-radius:26px;padding:24px 28px;
      box-shadow:8px 8px 0 ${VERM}}
  .so h2{margin:0;font-size:42px;text-transform:uppercase;color:${OURO};line-height:1.05}
  .so p{margin:11px 0 0;font-family:system-ui;font-size:26px;line-height:1.4;color:rgba(244,236,214,.92)}
  .so p b{color:#fff}

  .c{background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:6px 6px 0 ${INK};
     padding:18px 22px;margin-top:18px}
  .c h3{margin:0 0 7px;font-size:31px;text-transform:uppercase;line-height:1.1}
  .c p{margin:0;font-family:system-ui;font-size:25px;line-height:1.4;color:#333}
  .c p b{font-weight:800;color:${INK}}

  .shh{margin-top:auto;display:flex;align-items:center;gap:22px;background:#FFF4E2;
       border:6px solid #B8722A;border-radius:24px;padding:20px 24px;box-shadow:6px 6px 0 #B8722A}
  .shh .emo{font-size:58px;line-height:1}
  .shh p{margin:0;font-family:system-ui;font-size:27px;line-height:1.38;color:#3A2C18;font-weight:700}

  .foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;
        border-top:7px solid ${INK};padding-top:18px}
  .foot .mk{font-size:46px;font-weight:900;text-transform:uppercase}
  .foot .mk span{color:${VERM}}
  .foot .rt{font-family:system-ui;font-size:23px;color:#6b6552;text-align:right;line-height:1.35}
</style>
<span class="pill">🛍️ NOVIDADE · MODO CARREIRA</span>
<h1>Agora a sua<br>torcida<br><em>compra</em><br>camisa</h1>
<p class="lead">Abriu a <b>Loja do Clube</b>: a sua camisa vira dinheiro toda temporada. E quanto entra depende de <b>você</b>.</p>

<div class="vit">
  <div class="cam">${CAMISA}</div>
  <div class="tx">
    <h2>Quanto mais<br>gente no<br>estádio,<br>mais camisa</h2>
    <p>A sua torcida <b>cresce com as arquibancadas</b> que você levanta — e cada obra do estádio leva mais gente pra loja.</p>
  </div>
</div>

<div class="pcs">
  ${preco('Popular', 1, 'Muita gente leva, sobra pouco por peça.', 'Se você só se manter', VERDE)}
  ${preco('Normal', 2, 'O meio-termo: vende bem e rende bem.', 'Se pegar o acesso', '#B8860B')}
  ${preco('Cara', 3, 'Pouca gente leva, mas cada uma vale ouro.', 'Se for campeão', VERM)}
</div>

<div class="so">
  <h2>🎲 O preço é uma aposta</h2>
  <p>Você escolhe <b>antes</b> da temporada, apostando em como o time vai indo. Ano de campeão, a camisa cara <b>rende o dobro</b>; ano de arrumar a casa, a popular é a que enche o caixa.</p>
</div>

<div class="c">
  <h3>👟 E o fornecedor soma em cima</h3>
  <p>A marca de material que veste o seu time <b>aumenta a venda</b> da loja — marca grande, porcentagem maior.</p>
</div>

<div class="shh">
  <div class="emo">📦</div>
  <p>O balanço aparece na <b>abertura da temporada seguinte</b> — e cai direto no caixa.</p>
</div>

<div class="foot">
  <div class="mk">⚽ Leilão <span>Legends</span></div>
  <div class="rt">${NO_AR ? 'já está no ar' : 'chegando'}<br>leilaolegends.com</div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await p.setContent(html, { waitUntil: 'networkidle' })
const sobra = await p.evaluate(() => document.body.scrollHeight - window.innerHeight)
if (sobra > 0) console.warn(`⚠️ o conteúdo passou ${sobra}px da altura do stories — encolher algo`)
await p.screenshot({ path: SAIDA })
await b.close()
console.log(SAIDA)
