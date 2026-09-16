// 🖼️ MOCKUP — "Continuar com esse time" do jogo rápido furando a ESCADA da carreira.
//
// Diego, 15/09, com o print do Felipe (Cajuri EC): *"tem um erro bizarro no modo
// rápido. O cara joga o modo rápido e qd acaba ele pode levar o msm time pro modo
// carreira começando lá... Só que pow é injusto isso com quem inicia carreira na
// várzea q N vê lendas... Sendo q no modo rápido tem lendas já pow"*.
//
// ELE ESTÁ CERTO, e dá pra medir. Os números deste mockup saem do próprio código
// (`escadaAllows` em store.tsx + o CATALOG de data.ts), não de cabeça:
//   · baralho do JOGO RÁPIDO: 661 cartas, top-11 96,3 — é o MESMO nível da Série A;
//   · baralho da VÁRZEA (escada): 445 cartas, top-11 82,0, melhor carta 83;
//   · lendas/craques (fame ≥ 4) no rápido: 179. Na Várzea: ZERO.
// Ou seja: quem vem do rápido entra na Várzea com um elenco de Série A, enquanto
// quem começa carreira do zero não consegue NEM VER essas cartas.
//
// Rodar: node scripts/mockup-rapido-vira-carreira.mjs [saida.png]
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'

const barra = (lbl, v, max, cor, nota) => `<div class="br">
  <span class="bl">${lbl}</span>
  <span class="bt"><u style="width:${(v / max * 100).toFixed(1)}%;background:${cor}"></u><b>${v}</b></span>
  <span class="bn">${nota}</span></div>`

const OPCOES = [
  { id: 'A', cor: VERDE, t: 'A · começa na divisão que o ELENCO merece',
    p: 'O time vem inteiro, como hoje — mas a carreira <b>não nasce na Várzea</b>. O jogo mede o top-11 do elenco e põe a liga na divisão certa: elenco de 96 vira <b>Série A</b>, de 90 vira <b>Série B/C</b>, de 84 vira <b>Série D</b>, de 82 fica na <b>Várzea</b>.',
    pro: 'Ninguém perde o time que montou (que é o motivo do botão existir) e a escada continua honesta: você tem lenda porque está na divisão onde lenda é normal.',
    con: 'Time muito forte <b>pula direto pra Série A</b> — e lá o prêmio é o maior. Só chega lá quem realmente ganhou o pregão contra todo mundo.' },
  { id: 'B', cor: ROXO, t: 'B · o jogo rápido passa a respeitar a escada',
    p: 'O pregão do modo rápido só oferece o que a <b>Várzea</b> oferece: sem lenda, sem craque.',
    pro: 'Acaba com a diferença na raiz — os dois modos passam a ter o mesmo baralho.',
    con: '<b>Mata a graça do modo rápido.</b> Lenda é o que faz o pregão ser pregão. Eu sou contra.' },
  { id: 'C', cor: VERM, t: 'C · tirar o botão "Continuar com esse time"',
    p: 'O fim do jogo rápido volta a ser o que era: acabou, acabou.',
    pro: 'Resolve na hora, zero risco.',
    con: 'Volta o beco sem saída que o botão veio consertar — a pessoa monta um time, ganha, e o jogo joga tudo fora.' },
]

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:#e9e1c9;font-family:system-ui;color:${INK};width:1220px;padding:26px}
 h1{font-family:Oswald;font-size:31px;margin:0 0 4px;text-transform:uppercase}
 p.sub{font-size:16px;color:#4a4636;margin:0 0 18px;line-height:1.5;max-width:1140px}
 .card{background:#fff;border:4px solid ${INK};border-radius:15px;box-shadow:4px 4px 0 ${INK};padding:15px 18px;margin-bottom:16px}
 .card h2{font:900 17px Oswald;margin:0 0 10px;text-transform:uppercase}
 .card p{font-size:14px;line-height:1.55;margin:0 0 8px;color:#3A2C18}
 .br{display:flex;align-items:center;gap:11px;margin-bottom:7px}
 .bl{flex:none;width:250px;font:900 12.5px Oswald;text-transform:uppercase}
 .bt{flex:1;position:relative;height:26px;border:3px solid ${INK};border-radius:8px;background:#F1EBD8;overflow:hidden}
 .bt u{display:block;height:100%;text-decoration:none}
 .bt b{position:absolute;right:8px;top:0;line-height:20px;font:900 13px Oswald}
 .bn{flex:none;width:250px;font-size:11px;font-weight:700;color:#5a5647;line-height:1.3}
 .destaque{background:#FDECEA;border:3px dashed ${VERM};border-radius:12px;padding:11px 13px;font-size:14.5px;
   font-weight:700;color:#8a2318;line-height:1.5;margin-top:11px}
 .ops{display:flex;gap:14px;align-items:stretch}
 .op{flex:1;background:#fff;border:4px solid ${INK};border-radius:15px;box-shadow:4px 4px 0 ${INK};overflow:hidden;display:flex;flex-direction:column}
 .oh{font:900 14px Oswald;text-transform:uppercase;padding:9px 12px;color:#fff;line-height:1.2}
 .ob{padding:12px 14px;flex:1}
 .ob p{font-size:13px;line-height:1.5;margin:0 0 9px;color:#3A2C18}
 .tag{display:block;font:900 9.5px Oswald;letter-spacing:1px;text-transform:uppercase;margin:0 0 3px}
 .tag.s{color:${VERDE}} .tag.n{color:${VERM}}
 .nota{margin-top:18px;background:#FFF4E2;border:4px solid #B8722A;border-radius:15px;padding:16px 20px;font-size:15.5px;line-height:1.55;color:#3A2C18}
 .nota b{font-weight:800}
</style>
<h1>🪜 O jogo rápido furando a escada da carreira</h1>
<p class="sub">Você pegou certo, e dá pra medir. Os números abaixo saem do <b>próprio código</b> (a regra da escada + o baralho), não de cabeça. O <b>top-11</b> é a média de força das 11 melhores cartas que aquele baralho oferece.</p>

<div class="card">
  <h2>📏 O tamanho da diferença</h2>
  ${barra('🔨 Pregão do JOGO RÁPIDO', 96.3, 100, VERM, '661 cartas — o baralho inteiro')}
  ${barra('🏆 Série A (escada)', 96.3, 100, '#B8860B', '175 cartas · é o MESMO nível do rápido')}
  ${barra('🥈 Série B / C', 90.0, 100, '#2F6BAE', '166 cartas · promessa + craque')}
  ${barra('🥉 Série D', 84.0, 100, VERDE, '368 cartas · promessa + bom')}
  ${barra('🌱 VÁRZEA — onde a carreira começa', 82.0, 100, '#8a8266', '445 cartas · melhor carta: 83')}
  <div class="destaque">🚨 O pregão do jogo rápido tem <b>179 lendas e craques</b> (fame ≥ 4), sendo <b>50 lendas puras</b>.<br>
  A Várzea tem <b>ZERO</b>. Nenhuma. Quem começa carreira do zero não consegue nem VER essas cartas —
  e quem vem do rápido entra na Várzea com um elenco <b>de nível Série A</b>.</div>
  <p style="margin-top:11px"><b>Uma coisa que ATENUA (mas não resolve):</b> os adversários do jogo rápido vêm junto pra mesma divisão, então dentro daquela carreira o jogo continua equilibrado. O que não fica de pé é a <b>comparação com todo mundo</b>: essa pessoa sobe de divisão, ganha título, moeda e rank com um elenco que a regra da Várzea proíbe.</p>
</div>

<div class="ops">
${OPCOES.map(o => `
  <div class="op">
    <div class="oh" style="background:${o.cor}">${o.t}</div>
    <div class="ob">
      <p>${o.p}</p>
      <span class="tag s">✅ a favor</span><p>${o.pro}</p>
      <span class="tag n">⚠️ contra</span><p style="margin-bottom:0">${o.con}</p>
    </div>
  </div>`).join('')}
</div>

<div class="nota">
  <b>Minha sugestão: a A.</b> Ela é a única que mantém as duas promessas ao mesmo tempo — a pessoa <b>não perde o time que montou</b> (que é o motivo do botão existir, e você criou ele justamente porque o fim do rápido era um beco sem saída) e a <b>escada continua valendo</b>: você só joga com lenda na divisão onde lenda é normal.<br>
  E ela é barata: o botão já move a liga inteira pra uma divisão — só muda <b>qual</b> divisão, medindo o elenco em vez de chutar Várzea.<br>
  <b>Uma pergunta que é sua, não minha:</b> se o elenco for muito forte, ele cai direto na <b>Série A</b>. Você prefere assim, ou prefere um <b>teto</b> (por exemplo: no máximo Série C, por mais forte que seja o time)?<br>
  <b>Dá pra voltar atrás?</b> Sim, em qualquer uma delas — é um bloco em <code>store.tsx</code>, e carreira já começada não muda.
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1220, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2] ?? 'mockup-rapido-vira-carreira.png', fullPage: true })
await b.close()
console.log('ok')
