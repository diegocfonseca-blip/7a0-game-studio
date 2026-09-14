// 📢 STORIES — "seu time agora tem preparador físico" (Diego 14/09).
//
// Formato: 1080×1920 (9:16), o MESMO layout aprovado por ele no post da venda do
// 2º clube (`post-venda-2o-clube.mjs`) — pill, título, lead, caixa preta, três
// fichas brancas, a caixa 🤫 e o rodapé da marca. Não inventar layout novo.
//
// ⚠️ DUAS REGRAS DELE QUE VALEM AQUI:
//   · 🤫 **não conta o preço** — *"não conta por quanto vai valer… não quero
//     spoiler"* (regra dada no post da venda do 2º clube, 14/09). Quanto custa
//     cada preparador, o jogador descobre na loja.
//   · ⏳ o rodapé diz **"chegando"**, não "já está no ar": a feature ainda não
//     subiu pra main. Trocar por "já está no ar" no dia do deploy.
//
// Rodar: node scripts/post-preparador.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/stories-preparador.png')
const NO_AR = process.argv.includes('--no-ar') // 🚀 liga no dia do deploy
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERM = '#C2452F', VERDE = '#1B7A3D'
// os degradês dos tiers (apoio.tsx) — cor de tier é sagrada
const G_VERDE = 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)'
const G_ROXO = 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)'
const G_PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

// 🎨 a categoria vira uma PASTILHA no degradê do tier (o verde não tem selo em
// apoio.tsx, e 🟢 em cima de verde some — então quem identifica é a palavra)
const nome = (grad, selo, cat, cor, n, pais) => `<div class="nm">
  <span class="sl" style="background:${grad};color:${cor}">${selo ? `<i>${selo}</i>` : ''}${cat}</span><span class="nn">${n}</span><span class="pz">${pais}</span></div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};
       width:1080px;height:1920px;padding:74px 66px 66px;display:flex;flex-direction:column}
  .pill{align-self:flex-start;background:${OURO};border:5px solid ${INK};border-radius:40px;
        padding:12px 30px;font-weight:900;font-size:24px;letter-spacing:2.4px;box-shadow:7px 7px 0 ${INK}}
  h1{font-size:112px;line-height:.89;margin:28px 0 0;text-transform:uppercase;letter-spacing:-3px}
  h1 em{font-style:normal;color:${VERDE}}
  p.lead{font-family:system-ui;font-size:31px;line-height:1.4;color:#3a3527;margin:26px 0 0;font-weight:500}
  p.lead b{font-weight:800}

  .so{margin:28px 0 0;background:${INK};color:${CREME};border-radius:26px;padding:26px 30px;
      box-shadow:8px 8px 0 ${VERDE}}
  .so h2{margin:0;font-size:44px;text-transform:uppercase;color:${OURO};line-height:1.05}
  .so p{margin:12px 0 0;font-family:system-ui;font-size:27px;line-height:1.4;color:rgba(244,236,214,.92)}
  .so p b{color:#fff}

  .c{background:#fff;border:6px solid ${INK};border-radius:24px;box-shadow:6px 6px 0 ${INK};
     padding:20px 24px;margin-top:20px}
  .c h3{margin:0 0 7px;font-size:33px;text-transform:uppercase;line-height:1.1}
  .c p{margin:0;font-family:system-ui;font-size:25px;line-height:1.4;color:#333}

  .nms{display:flex;flex-direction:column;gap:11px;margin-top:12px}
  .nm{display:flex;align-items:center;gap:13px}
  .sl{flex:none;width:238px;height:50px;border:4px solid ${INK};border-radius:13px;
      display:flex;align-items:center;justify-content:center;gap:7px;font-size:22px;font-weight:900;
      letter-spacing:1px;text-transform:uppercase;box-shadow:3px 3px 0 ${INK};white-space:nowrap}
  .sl i{font-style:normal;font-size:26px;line-height:1}
  .nn{font-size:35px;font-weight:900;text-transform:uppercase;letter-spacing:-.5px}
  .pz{font-size:28px}

  .shh{margin-top:auto;display:flex;align-items:center;gap:22px;background:#FFF4E2;
       border:6px solid #B8722A;border-radius:24px;padding:22px 26px;box-shadow:6px 6px 0 #B8722A}
  .shh .emo{font-size:62px;line-height:1}
  .shh p{margin:0;font-family:system-ui;font-size:28px;line-height:1.38;color:#3A2C18;font-weight:700}

  .foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;
        border-top:7px solid ${INK};padding-top:20px}
  .foot .mk{font-size:46px;font-weight:900;text-transform:uppercase}
  .foot .mk span{color:${VERM}}
  .foot .rt{font-family:system-ui;font-size:23px;color:#6b6552;text-align:right;line-height:1.35}
</style>
<span class="pill">🏋️ NOVIDADE · MODO CARREIRA</span>
<h1>Seu time<br>agora tem<br><em>preparador</em><br>físico</h1>
<p class="lead">É ele quem cuida do gás do elenco. Quanto melhor o preparador, <b>mais rodadas seguidas</b> o seu craque joga sem cansar.</p>

<div class="so">
  <h2>🏛️ Departamento Técnico</h2>
  <p>O <b>técnico</b> e o <b>preparador</b> saem do meio dos jogadores e ganham a área deles, ali na <b>aba Elenco</b>.</p>
</div>

<div class="c">
  <h3>🌎 Quatro nomes de verdade</h3>
  <div class="nms">
    ${nome(G_VERDE, '', 'bom', '#fff', 'Rui Faria', '🇵🇹')}
    ${nome(G_ROXO, '💎', 'promessa', '#fff', 'Antonio Pintus', '🇮🇹')}
    ${nome(G_PRATA, '⭐', 'craque', INK, 'Paulo Paixão', '🇧🇷')}
    ${nome(G_OURO, '👑', 'lenda', INK, 'Paco Seirulo', '🇪🇸')}
  </div>
</div>
<div class="c">
  <h3>🔁 O botão RODIZIAR é dele</h3>
  <p>Contratou, aparece o botão que troca o cansado pelo reserva — e o modo automático. Sem preparador você troca na mão, como sempre.</p>
</div>
<div class="c">
  <h3>📝 Tem salário e contrato</h3>
  <p>Igual ao técnico: pesa na folha toda temporada, e quando o contrato vence você renova ou deixa ir.</p>
</div>

<div class="shh">
  <div class="emo">🤫</div>
  <p>Quanto custa cada um? Isso você vê na hora de contratar.</p>
</div>

<div class="foot">
  <div class="mk">⚽ Leilão <span>Legends</span></div>
  <div class="rt">${NO_AR ? 'já está no ar' : 'chegando'}<br>leilaolegends.com</div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await p.setContent(html, { waitUntil: 'networkidle' })
const sobra = await p.evaluate(() => document.body.scrollHeight - window.innerHeight)
if (sobra > 0) console.warn(`⚠️ o conteúdo passou ${sobra}px da altura do stories — encolher algo`)
await p.screenshot({ path: SAIDA })
await b.close()
console.log(SAIDA)
