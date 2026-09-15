// 📢 STORIES — "seu time agora tem fornecedor de material" (Diego 15/09).
//
// Formato: 1080×1920 (9:16), o MESMO layout aprovado por ele (pill · título ·
// lead · caixa preta · fichas brancas · caixa 🤫 · rodapé da marca). Não inventar
// layout novo — este molde vem do post da venda do 2º clube e do preparador.
//
// ⚠️ REGRAS DELE QUE VALEM AQUI:
//   · 🤫 **não conta a tabela de valores**. Ele acabou de mandar tirar as réguas
//     de dentro do jogo (*"só bota confusão e ninguém olha e lê"*) — então o post
//     também não vira planilha. Diz que sobe com a divisão e pronto.
//   · 🏷️ as marcas do fornecedor são **paródia com símbolo NEUTRO**: o jogo não
//     imita o desenho da Nike/Adidas/Puma, só o nome é brincadeira.
//   · ⏳ o rodapé diz **"chegando"** por padrão; `--no-ar` troca por "já está no
//     ar" no dia que liberar geral (hoje está travado na conta do Diego).
//
// Rodar: node scripts/post-fornecedor.mjs [--saida /tmp/x.png] [--no-ar]
import { chromium } from 'playwright-core'
// 👕 a camisa MONTADA vem das mesmas peças dos mockups da Loja — assim o post
// mostra exatamente o que o jogo desenha, e não uma ilustração à parte.
import { camisa, escudoBase, CAMISA_TIER, LOGO_VADICO } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/stories-fornecedor.png')
const NO_AR = process.argv.includes('--no-ar')
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERM = '#C2452F', VERDE = '#1B7A3D'
// a camisa JÁ COM AS TRÊS ESTAMPAS — é a prova visual do que a novidade faz
const CAMISA = camisa({
  arte: CAMISA_TIER, alt: 286,
  escudo: escudoBase({ letra: 'S', c1: '#2E9E5B', c2: '#14612F', size: Math.round(286 * 0.085) }),
  fornecedor: 'Pumba', fornSimbolo: '🐆', master: '', masterLogo: LOGO_VADICO,
  masterW: 0.20, masterH: 0.155, masterCor: '#4F462E',
  pos: { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 },
})

// uma marca de material: símbolo neutro + nome + prazo
const marca = (simb, cor, nome, prazo, bonus) => `<div class="mc">
  <span class="mi" style="background:${cor}">${simb}</span>
  <span class="mn">${nome}</span>
  <span class="mp">${prazo}</span>
  <span class="mb">+${bonus}%</span>
</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};
       width:1080px;height:1920px;padding:66px 62px 58px;display:flex;flex-direction:column}
  .pill{align-self:flex-start;background:${OURO};border:5px solid ${INK};border-radius:40px;
        padding:12px 30px;font-weight:900;font-size:24px;letter-spacing:2.4px;box-shadow:7px 7px 0 ${INK}}
  h1{font-size:104px;line-height:.89;margin:24px 0 0;text-transform:uppercase;letter-spacing:-3px}
  h1 em{font-style:normal;color:${VERDE}}
  p.lead{font-family:system-ui;font-size:30px;line-height:1.4;color:#3a3527;margin:22px 0 0;font-weight:500}
  p.lead b{font-weight:800}

  /* 👕 a camisa como PROVA: o que entra em cada lugar dela */
  .kit{display:flex;gap:26px;align-items:center;margin-top:24px;background:#fff;border:6px solid ${INK};
       border-radius:24px;box-shadow:6px 6px 0 ${INK};padding:20px 24px}
  .kit .cam{flex:none;filter:drop-shadow(0 8px 10px rgba(0,0,0,.25))}
  .kit ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
  .kit li{font-family:system-ui;font-size:26px;line-height:1.3;font-weight:600;color:#333;
          display:flex;gap:12px;align-items:flex-start}
  .kit li b{font-family:Oswald;font-weight:900;font-size:29px;text-transform:uppercase;display:block;color:${INK}}
  .kit li .e{font-size:34px;line-height:1;flex:none}

  .so{margin:20px 0 0;background:${INK};color:${CREME};border-radius:26px;padding:24px 28px;
      box-shadow:8px 8px 0 ${VERDE}}
  .so h2{margin:0;font-size:42px;text-transform:uppercase;color:${OURO};line-height:1.05}
  .so p{margin:11px 0 0;font-family:system-ui;font-size:26px;line-height:1.4;color:rgba(244,236,214,.92)}
  .so p b{color:#fff}

  .c{background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:6px 6px 0 ${INK};
     padding:18px 22px;margin-top:18px}
  .c h3{margin:0 0 9px;font-size:31px;text-transform:uppercase;line-height:1.1}

  .mcs{display:flex;flex-direction:column;gap:10px}
  .mc{display:flex;align-items:center;gap:14px}
  .mi{flex:none;width:58px;height:58px;border:4px solid ${INK};border-radius:14px;color:#fff;
      display:flex;align-items:center;justify-content:center;font-size:27px;box-shadow:3px 3px 0 ${INK}}
  .mn{font-size:33px;font-weight:900;text-transform:uppercase;letter-spacing:-.5px;flex:1}
  .mp{font-family:system-ui;font-size:23px;font-weight:700;color:#6b6552;white-space:nowrap}
  .mb{font-size:29px;font-weight:900;color:${VERDE};white-space:nowrap;min-width:118px;text-align:right}

  .shh{margin-top:auto;display:flex;align-items:center;gap:22px;background:#FFF4E2;
       border:6px solid #B8722A;border-radius:24px;padding:20px 24px;box-shadow:6px 6px 0 #B8722A}
  .shh .emo{font-size:58px;line-height:1}
  .shh p{margin:0;font-family:system-ui;font-size:27px;line-height:1.38;color:#3A2C18;font-weight:700}

  .foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px;
        border-top:7px solid ${INK};padding-top:18px}
  .foot .mk{font-size:46px;font-weight:900;text-transform:uppercase}
  .foot .mk span{color:${VERM}}
  .foot .rt{font-family:system-ui;font-size:23px;color:#6b6552;text-align:right;line-height:1.35}
</style>
<span class="pill">👟 NOVIDADE · MODO CARREIRA</span>
<h1>Seu time<br>agora tem<br><em>fornecedor</em><br>de material</h1>
<p class="lead">Uma marca veste o seu clube — e <b>aparece na camisa</b>. Contrato de <b>1, 2, 3 ou 5 temporadas</b>, igual ao Master.</p>

<div class="kit">
  <div class="cam">${CAMISA}</div>
  <ul>
    <li><span class="e">🛡️</span><span><b>Peito esquerdo</b>o escudo do seu clube</span></li>
    <li><span class="e">👟</span><span><b>Peito direito</b>o fornecedor de material</span></li>
    <li><span class="e">🤝</span><span><b>Barriga</b>o seu patrocínio Master</span></li>
  </ul>
</div>

<div class="so">
  <h2>🔒 O valor trava na sua divisão</h2>
  <p>Assinou na Série D? É o valor da Série D <b>até o fim do contrato</b> — subiu ou caiu, ele <b>não quebra</b>. Quando acabar, chega proposta nova com os valores de onde você estiver.</p>
</div>

<div class="c">
  <h3>👟 Quatro marcas na mesa</h3>
  <div class="mcs">
    ${marca('⚡', '#8A1E1E', 'Pênalti do Bairro', '1 temporada', 10)}
    ${marca('◣', '#0E3E86', 'Adibas', '2 temporadas', 20)}
    ${marca('🐆', '#B5651D', 'Pumba', '3 temporadas', 30)}
    ${marca('✓', VERDE, 'Naique', '5 temporadas', 45)}
  </div>
  <p style="margin:12px 0 0;font-family:system-ui;font-size:24px;line-height:1.35;color:#6b6552;font-weight:600">
    A porcentagem é o que ela <b>soma nas vendas da sua loja</b>. Marca grande só bate na porta de quem subiu de divisão.</p>
</div>

<div class="shh">
  <div class="emo">🛍️</div>
  <p>Precisa ter a <b>Loja do Clube</b> construída no estádio: marca de material patrocina quem vende camisa.</p>
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
