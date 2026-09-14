// 🖼️ MOCKUP — A HISTORINHA DOS 300 (venda do 2º clube).
//
// Diego, 14/09: *"só q vender pelo msm valor n sei se é válido.. podia deixar
// vender mas perdendo um cadinho, pelo menos 300 moedas... com uma histórinha,
// só n sei qual"*. Então a venda virou 4.000 pagos → 3.700 de volta.
//
// 🔁 2ª RODADA: a 1ª leva (taxa da federação · despachante · acerto com quem fica)
// ele recusou com um *"outras"*. As três eram a MESMA ideia com roupa diferente
// — alguém tira um pedaço no caminho. Esta leva muda o mecanismo: desvaloriza,
// pechincha, imposto, dívida velha e zoeira pura.
// Rodar: node scripts/mockup-historinha-venda-clube.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-historinha-venda-clube.png')
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERM = '#C2452F', VERDE = '#1B7A3D', ROXO = '#7C3AED'

const OPS = [
  { n: 'D', t: '🚗 Saiu da garagem', selo: '',
    txt: 'Você recebe <b>3.700 🪙</b>. Clube é igual carro zero: <b>na hora que troca de dono já vale menos</b>.',
    pe: 'Os 300 sumiram no caminho. Ninguém sabe pra onde foram.',
    por: 'Não culpa ninguém: é o mercado. A mais simples de todas.' },
  { n: 'E', t: '🤝 O comprador pechinchou', selo: 'recomendo',
    txt: 'Você recebe <b>3.700 🪙</b>. O comprador olhou a <b>folha salarial</b>, coçou a cabeça e pediu desconto.',
    pe: '“Levo, mas por 3.700. Pensa bem, esse elenco é caro.”',
    por: 'É a única que explica a perda como CONVERSA, não como taxa. E é a cara de negociação de futebol.' },
  { n: 'F', t: '🦁 O Leão passou a mão', selo: '',
    txt: 'Você recebe <b>3.700 🪙</b>. Ninguém vende clube sem o <b>Leão ficar sabendo</b>. 300 foram direto pro imposto.',
    pe: 'Ele não joga, não treina, não torce. Mas está em toda transferência.',
    por: 'Piada que todo brasileiro pega de primeira. Cuidado só pra não soar chato.' },
  { n: 'G', t: '🚌 Apareceu uma conta velha', selo: '',
    txt: 'Você recebe <b>3.700 🪙</b>. Na hora de assinar apareceu uma <b>fatura de ônibus de excursão</b> de três anos atrás.',
    pe: 'Você pagou os 300 pra não sair sujando o nome do clube.',
    por: 'Bem várzea. Dá pra sortear contas diferentes a cada venda, se você quiser.' },
  { n: 'H', t: '🍖 O churrasco da despedida', selo: 'a mais zoeira',
    txt: 'Você recebe <b>3.700 🪙</b>. A diretoria fez <b>questão do churrasco de despedida</b>. Custou 300.',
    pe: 'Ninguém sabe quem comeu. A conta veio com duas caixas de cerveja.',
    por: 'A mais engraçada e a mais "alma do jogo". Não explica economia nenhuma — e talvez seja esse o charme.' },
]

const cards = OPS.map(o => `
  <div class="op ${o.selo === 'recomendo' ? 'rec' : ''} ${o.selo === 'a mais zoeira' ? 'zoe' : ''}">
    <p class="tag">OPÇÃO ${o.n}${o.selo ? ` · ${o.selo}` : ''}</p>
    <h3>${o.t}</h3>
    <div class="btn">💸 Vender · 3.700 🪙</div>
    <div class="ok">✅ ${o.txt}</div>
    <p class="pe">“${o.pe}”</p>
    <p class="por"><b>Por quê:</b> ${o.por}</p>
  </div>`).join('')

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};padding:26px;width:1500px}
 h1{font-size:34px;margin:0 0 2px;text-transform:uppercase}
 p.sub{margin:0 0 6px;font-size:15px;color:#4a4636;font-family:system-ui;line-height:1.45;max-width:1080px}
 .conta{display:inline-block;background:${INK};color:${OURO};border-radius:10px;padding:6px 12px;font-weight:900;font-size:15px;margin:8px 0 16px}
 .cols{display:flex;gap:13px;align-items:stretch}
 .op{flex:1;background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:13px;display:flex;flex-direction:column}
 .op.rec{border-color:${VERDE};box-shadow:5px 5px 0 ${VERDE}}
 .op.zoe{border-color:${ROXO};box-shadow:5px 5px 0 ${ROXO}}
 .tag{margin:0 0 6px;font-size:11px;letter-spacing:1.1px;text-transform:uppercase;font-weight:900;color:#6b6552}
 .op.rec .tag{color:${VERDE}} .op.zoe .tag{color:${ROXO}}
 h3{margin:0 0 10px;font-size:18px;text-transform:uppercase;line-height:1.15;min-height:42px}
 .btn{background:${VERM};color:#fff;border:3px solid ${INK};border-radius:11px;padding:8px;text-align:center;
      font-weight:900;font-size:13px;text-transform:uppercase;box-shadow:3px 3px 0 ${INK};margin-bottom:10px}
 .ok{background:#eafaef;border:2px solid ${VERDE};border-radius:10px;padding:8px 9px;font-family:system-ui;font-size:12.5px;line-height:1.45}
 .pe{margin:9px 0 0;font-family:Georgia,serif;font-style:italic;font-size:12.5px;line-height:1.45;color:#4a4636}
 .por{margin:auto 0 0;font-family:system-ui;font-size:12px;line-height:1.45;color:#333;border-top:2px solid #e3d9ba;padding-top:9px}
 .nota{margin-top:18px;font-family:system-ui;font-size:13.5px;line-height:1.55;color:#2f2c22;background:#fff7d6;
       border:3px solid ${INK};border-radius:14px;padding:12px 14px;box-shadow:3px 3px 0 ${INK};max-width:1180px}
 .velhas{margin-top:12px;font-family:system-ui;font-size:12.5px;color:#6b6552;line-height:1.5}
</style>
<h1>A historinha dos 300 · outras</h1>
<p class="sub">As três de antes eram a mesma ideia com roupa diferente: alguém tirava um pedaço no caminho. Estas cinco mudam o motivo da perda.</p>
<div class="conta">4.000 🪙 pagos &nbsp;→&nbsp; 3.700 🪙 de volta &nbsp;·&nbsp; a mordida de 300</div>
<div class="cols">${cards}</div>
<div class="nota"><b>Se nenhuma servir, me diz o RUMO</b> que eu escrevo em cima: pode ser culpa do mercado, culpa do comprador, culpa do governo, culpa de uma dívida antiga, ou pura zoeira sem explicação. Também dá pra <b>sortear</b> entre várias, pra que cada venda venha com uma desculpa diferente — aí vira colecionável.</div>
<p class="velhas">Recusadas na 1ª leva: A) taxa da federação · B) o despachante · C) acerto com quem fica.</p>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
