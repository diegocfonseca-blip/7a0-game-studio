// Mockup (28/10): ⚡ MATA-MATA RELÂMPAGO — competição nova das salas online. Pedido do Diego: *"mata mata relâmpago quero ver
// como é"*. Ideia: o leilão de SEMPRE e depois só o mata-mata (jogo único, pênalti manual no empate), sem liga — a mesma peça
// que já existe no "⭐ Só Champions" (sem liga) e no mata-mata da Copa das salas (quickCopa). Rodar: node scripts/mockup-mata-relampago.mjs
import { chromium } from 'playwright-core'
const css = `*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Inter,Arial,sans-serif;color:#0C0C0C;width:1180px;padding:26px}
.osw{font-family:Oswald,sans-serif}.h1{font:900 34px Oswald;text-transform:uppercase;margin:0}.sub{font:600 15px Inter;margin:4px 0 18px;color:rgba(12,12,12,.7)}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #000;padding:16px 18px;margin-bottom:20px}
.tit{font:900 15px Oswald;letter-spacing:.06em;text-transform:uppercase;background:#0C0C0C;color:#FFC400;display:inline-block;padding:3px 11px;border-radius:8px;margin-bottom:12px}
.n{display:inline-flex;width:24px;height:24px;border-radius:99px;background:#FFC400;color:#0C0C0C;align-items:center;justify-content:center;margin-right:7px;font-size:13px}
.op{border:3px solid #0C0C0C;border-radius:12px;padding:9px 10px;font:800 15px Oswald;text-transform:uppercase;background:#fff;box-shadow:3px 3px 0 #000;text-align:center}
.op small{display:block;font:600 11px Inter;text-transform:none;color:rgba(12,12,12,.6);margin-top:2px}
.op.on{background:#0C0C0C;color:#FFC400;box-shadow:3px 3px 0 #C2452F}.op.on small{color:rgba(255,255,255,.75)}
.novo{font:800 10px Oswald;background:#1B7A3D;color:#fff;border-radius:5px;padding:0 5px;margin-left:5px;vertical-align:2px}
.passo{flex:1;border:3px solid #0C0C0C;border-radius:14px;padding:10px;text-align:center;background:#FFFDF6;box-shadow:3px 3px 0 #000}
.passo b{display:block;font:900 17px Oswald;text-transform:uppercase}.passo span{font:600 12px Inter;color:rgba(12,12,12,.65)}
.seta{font:900 22px Oswald;align-self:center}
.jogo{border:2.5px solid #0C0C0C;border-radius:9px;background:#fff;font:700 12.5px Inter;margin:5px 0;overflow:hidden}
.jogo div{display:flex;justify-content:space-between;padding:4px 8px}.jogo div+div{border-top:1.5px solid rgba(12,12,12,.12)}
.jogo .w{background:#E8F5EC;font-weight:800}.jogo .eu{background:#FFF4C2}.pen{font:800 10px Oswald;color:#C2452F;margin-left:4px}
.col{flex:1;display:flex;flex-direction:column;justify-content:space-around}.colt{font:900 13px Oswald;text-transform:uppercase;text-align:center;letter-spacing:.06em;margin-bottom:4px}
`
const j = (a, b, pa, pb, win, eu = '', pen = '') => `<div class="jogo"><div class="${win === 'a' ? 'w' : ''} ${eu === 'a' ? 'eu' : ''}"><span>${a}</span><span>${pa}${pen && win === 'a' ? `<span class="pen">${pen}</span>` : ''}</span></div><div class="${win === 'b' ? 'w' : ''} ${eu === 'b' ? 'eu' : ''}"><span>${b}</span><span>${pb}${pen && win === 'b' ? `<span class="pen">${pen}</span>` : ''}</span></div></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;800;900&family=Inter:wght@500;600;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
<p class="h1">⚡ Mata-mata Relâmpago</p>
<p class="sub">O leilão de sempre e depois só mata-mata: jogo único, empate vai pro pênalti que você bate. Sem liga. Uma noite inteira em ~20 minutos.</p>

<div class="box"><div class="tit"><span class="n">1</span>Na hora de criar a sala · bloco "O campeonato"</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
  <div class="op">🏆 Só a liga<small>38 rodadas</small></div>
  <div class="op">🏆 Liga + Copa<small>liga e depois mata-mata</small></div>
  <div class="op">⭐ Só Champions<small>tabela de 36 + mata-mata</small></div>
  <div class="op on">⚡ Mata-mata Relâmpago<span class="novo">NOVO</span><small>sem liga · só mata-mata</small></div>
</div>
<p style="font:600 12.5px Inter;margin:10px 2px 0;color:rgba(12,12,12,.7)">👇 explicação embaixo da opção: "Leilão e direto pra chave. Perdeu, tá fora. Até 8 pessoas a chave é de 8; de 9 a 16, chave de 16. Vaga que sobra vira bot."</p>
</div>

<div class="box"><div class="tit"><span class="n">2</span>A noite, passo a passo</div>
<div style="display:flex;gap:10px">
  <div class="passo"><b>🔨 Leilão</b><span>o de sempre<br>(envelope, Tocaia ou aberto)</span></div><div class="seta">›</div>
  <div class="passo"><b>🎲 Sorteio</b><span>a chave sai na tela,<br>com suspense</span></div><div class="seta">›</div>
  <div class="passo"><b>Oitavas</b><span>jogo único<br>(só na chave de 16)</span></div><div class="seta">›</div>
  <div class="passo"><b>Quartas</b><span>jogo único</span></div><div class="seta">›</div>
  <div class="passo"><b>Semi</b><span>jogo único</span></div><div class="seta">›</div>
  <div class="passo" style="background:#FFF4C2"><b>🏆 Final</b><span>campeão da noite<br>+ O MARTELO</span></div>
</div>
<p style="font:600 12.5px Inter;margin:10px 2px 0;color:rgba(12,12,12,.7)">Placar, Controle da partida, 2D e pênalti manual = as MESMAS peças da Copa de hoje. Nada de tela nova.<br>Quem cai continua na sala assistindo e zoando no chat até a final.</p>
</div>

<div class="box"><div class="tit"><span class="n">3</span>A chave (exemplo com 8 pessoas)</div>
<div style="display:flex;gap:18px">
  <div class="col"><div class="colt">Quartas</div>
    ${j('Nova Eclipse', 'K9 FC', 2, 1, 'a', 'a')}${j('Futpoint FC', 'Fabulous EC', 1, 1, 'b', '', '4×3 pên')}
    ${j('Gaviões SCCP', 'Ressaca United 🤖', 3, 0, 'a')}${j('Seven City', 'Vila Esporte Clube', 0, 2, 'b')}</div>
  <div class="col"><div class="colt">Semi</div>
    ${j('Nova Eclipse', 'Fabulous EC', 1, 0, 'a', 'a')}${j('Gaviões SCCP', 'Vila Esporte Clube', 2, 2, 'a', '', '5×4 pên')}</div>
  <div class="col"><div class="colt">Final</div>
    ${j('Nova Eclipse', 'Gaviões SCCP', '–', '–', '', 'a')}
    <p style="font:700 12px Inter;text-align:center;margin:6px 0 0;color:rgba(12,12,12,.6)">🟡 o seu time em amarelo · 🤖 = bot que completou a chave</p></div>
</div>
</div>
</body></html>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ deviceScaleFactor: 2 }); await p.setContent(html); await p.waitForTimeout(1300)
await p.locator('body').screenshot({ path: 'scripts/mockups/mata-relampago.png' }); await b.close(); console.log('ok')
