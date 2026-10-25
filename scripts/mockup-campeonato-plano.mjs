#!/usr/bin/env node
// ─── 🎨 MOCKUP — Campeonato Oficial: o PLANO (25/10) ───
// Diego: *"qt tempo demoraria… quero que times caiam de divisão… como ganhar mais se mais times quiserem jogar… faça o
// planejamento em mockup"*. Três telas do jogador (pirâmide · o mês · inscrição e prêmios) + um quadro só pro Diego
// com a conta do dinheiro. HTML estático, nada do jogo é importado.
// uso: node scripts/mockup-campeonato-plano.mjs  → scripts/mockups/campeonato-plano.png
import { chromium } from 'playwright-core'

const css = `
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;padding:22px;font-family:Inter,system-ui;color:#0C0C0C}
.o{font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{font:600 13px Inter;color:#53534b;margin:0 0 18px}
.row{display:flex;gap:22px;align-items:flex-start}
.ph{width:380px;flex:none}.ph>.hd{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.n{font:700 20px Oswald;background:#FFC400;border:3px solid #000;border-radius:10px;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;box-shadow:3px 3px 0 #000}
.ph>.hd b{font:700 22px Oswald;text-transform:uppercase}.ph>p{font:600 12px Inter;color:#53534b;margin:0 0 10px;min-height:34px}
.tela{border:4px solid #000;border-radius:28px;box-shadow:6px 6px 0 #000;background:#F4ECD6;padding:12px}
.box{background:#fff;border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 #000;padding:11px;margin-bottom:10px}
.t{font:700 15px Oswald;text-transform:uppercase;letter-spacing:.04em;margin:0 0 6px}
.mini{font:600 11px Inter;color:#53534b;margin:0}
.div{display:flex;align-items:center;gap:8px;border:3px solid #000;border-radius:12px;padding:7px 9px;margin:0 auto 6px;box-shadow:3px 3px 0 #000}
.div b{font:700 16px Oswald;text-transform:uppercase}.div span{font:600 10.5px Inter}
.tag{font:700 10px Oswald;border:2px solid #000;border-radius:6px;padding:1px 6px;text-transform:uppercase;white-space:nowrap}
.seta{display:flex;justify-content:space-between;font:700 11px Oswald;margin:-2px 6px 6px}
.up{color:#1B7A3D}.dn{color:#C2452F}
.sem{display:flex;gap:8px;align-items:center;border:2px solid #000;border-radius:10px;padding:7px 8px;margin-top:6px;background:#fff}
.sem .d{font:700 13px Oswald;width:62px;text-align:center;border-right:2px dashed #0003;padding-right:6px}
.roleta{display:flex;gap:4px;margin-top:3px}.roleta i{font:700 9.5px Oswald;font-style:normal;border:2px solid #000;border-radius:6px;padding:1px 5px;text-transform:uppercase}
.tb{width:100%;border-collapse:collapse;font:600 11.5px Inter}.tb td{padding:5px 4px;border-bottom:1.5px solid #0002}.tb td:last-child{text-align:right;font-weight:800}
.btn{display:block;text-align:center;font:700 16px Oswald;text-transform:uppercase;background:#1B7A3D;color:#fff;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:9px;margin-top:8px}
.diego{width:330px;flex:none;background:#0C0C0C;color:#F4ECD6;border:4px solid #000;border-radius:18px;box-shadow:6px 6px 0 #FFC400;padding:14px;margin-top:40px}
.diego h2{font:700 20px Oswald;text-transform:uppercase;color:#FFC400;margin:0 0 4px}.diego p{font:600 12px Inter;margin:4px 0}
.diego table{width:100%;border-collapse:collapse;font:600 12px Inter;margin:6px 0}.diego td{padding:4px 2px;border-bottom:1px solid #fff3}.diego td:last-child{text-align:right;color:#FFC400;font-weight:800}
.tot{font:700 22px Oswald;color:#FFC400}
`
const div = (nome, cor, txt, info, tag) => `<div class="div" style="background:${cor};width:${info}%"><b>${nome}</b><span style="flex:1">${txt}</span>${tag ? `<span class="tag" style="background:#fff">${tag}</span>` : ''}</div>`
const seta = '<div class="seta"><span class="up">▲ 4 sobem</span><span class="dn">▼ 4 caem</span></div>'

const t1 = `
<div class="box"><p class="t">🏆 Liga Oficial · Temporada de Novembro</p><p class="mini">5 salas fixas de 20 = <b>100 vagas</b>. Cada divisão joga separada, só contra quem é dela.</p></div>
${div('Série A', 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)', '20 técnicos', 100, 'elite')}
${seta}
${div('Série B', '#E7DAFF', '20 técnicos', 100, '')}
${seta}
${div('Série C', '#CFE8D6', '20 técnicos', 100, '')}
${seta}
${div('Série D', '#FFE0D6', '20 técnicos', 100, '')}
${seta.replace('4 sobem', '4 sobem').replace('4 caem', '4 saem do Oficial')}
${div('Várzea', '#EFE6CF', '20 técnicos', 100, 'porta de entrada')}
<div class="box" style="margin-top:8px"><p class="t" style="font-size:13px">⏳ Fila de espera · 37 na fila</p><p class="mini">Lotou as 100? Quem chega entra na fila. Todo mês os <b>4 últimos da Várzea saem</b> e os 4 primeiros da fila entram. Quem não paga o mês seguinte também libera a vaga.</p><span class="btn" style="background:#7C3AED;font-size:14px">🙋 Entrar na fila</span></div>`

const sem = (d, tit, roda) => `<div class="sem"><div class="d">${d}</div><div style="flex:1"><b class="o" style="font-size:14px">${tit}</b><div class="roleta">${roda}</div></div></div>`
const r = (txt, cor) => `<i style="background:${cor}">${txt}</i>`
const t2 = `
<div class="box"><p class="t">📅 O mês = 4 noites</p><p class="mini">Uma noite por semana, todo sábado às 20h. Cada noite é uma sala online normal: leilão + campeonato da sala.</p>
${sem('SÁB 1', '🎰 Roleta: ✉️ Envelope', r('✉️ saiu', '#FFC400') + r('🐊', '#fff') + r('🔨', '#fff'))}
${sem('SÁB 2', '🎰 Roleta: 🔨 Pregão aberto', r('✉️ já foi', '#ddd') + r('🐊', '#fff') + r('🔨 saiu', '#FFC400'))}
${sem('SÁB 3', '🎰 Roleta: 🐊 Tocaia', r('🐊 saiu', '#FFC400') + r('o que faltava', '#fff'))}
${sem('SÁB 4', '🏁 Noite final · roleta livre', r('qualquer um dos 3', '#FFC400'))}
</div>
<div class="box"><p class="t">⏱️ Quanto tempo</p>
<table class="tb"><tr><td>Leilão</td><td>~20 min</td></tr><tr><td>Campeonato da sala</td><td>~25 min</td></tr><tr><td>Uma noite inteira</td><td>~45 min</td></tr><tr><td>A temporada</td><td>1 mês</td></tr></table></div>
<div class="box"><p class="t">🧮 Pontos da noite</p><p class="mini">1º 25 · 2º 20 · 3º 16 · 4º 13 … 20º 1. Faltou = 0. <b>A pior noite é descartada</b>: contam as 3 melhores das 4.</p></div>`

const t3 = `
<div class="box"><p class="t">🎟️ Inscrição do mês</p>
<table class="tb"><tr><td>🥇 Série A</td><td>R$ 30</td></tr><tr><td>Série B</td><td>R$ 20</td></tr><tr><td>Série C</td><td>R$ 15</td></tr><tr><td>Série D</td><td>R$ 10</td></tr><tr><td>Várzea</td><td>R$ 5</td></tr></table>
<span class="btn">💸 Me inscrever · Pix</span></div>
<div class="box"><p class="t">🎁 Prêmios do mês</p>
<table class="tb">
<tr><td>🏆 Campeão da A</td><td>Vitalício + clube completo<br>(escudo, mascote, manto e nome)</td></tr>
<tr><td>🥈 Vice da A</td><td>Clube completo</td></tr>
<tr><td>🥉 3º da A</td><td>6 meses Craque</td></tr>
<tr><td>🏆 Campeão da B</td><td>3 meses Craque + entrada de gala</td></tr>
<tr><td>🏆 Campeão da C</td><td>2 meses Craque + canto da torcida</td></tr>
<tr><td>🏆 Campeão da D</td><td>1 mês Craque + tema da sala</td></tr>
<tr><td>🏆 Campeão da Várzea</td><td>1 mês Craque</td></tr>
<tr><td>⬆️ Todo mundo que sobe</td><td>Inscrição do mês seguinte grátis</td></tr></table></div>
<div class="box" style="background:linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)"><p class="t">👑 Campeão do Ano</p><p class="mini" style="color:#0C0C0C">Quem somar mais pontos na Série A no ano todo vira <b>Fundador</b> + carta com o rosto dele no baralho do jogo.</p></div>`

const t4 = `
<div class="box"><p class="t">🏅 Selo no nome, em todo canto</p>
<div style="display:flex;align-items:center;gap:8px;border:2px solid #000;border-radius:10px;padding:7px;background:#F4ECD6"><b class="o" style="font-size:15px">Kelvin</b><span class="tag" style="background:#FFC400">⭐ Série A</span><span style="flex:1"></span><span class="mini">no chat e nas salas</span></div>
<div style="display:flex;align-items:center;gap:8px;border:2px solid #000;border-radius:10px;padding:7px;background:#F4ECD6;margin-top:6px"><b class="o" style="font-size:15px">Neymarzetti</b><span class="tag" style="background:#EFE6CF">Várzea</span></div></div>
<div class="box" style="background:#2A1250;color:#fff"><p class="t" style="color:#FFC400">📺 Telão de todas as salas</p><p class="mini" style="color:#E7DAFF">🏆 K9 FC é o CAMPEÃO OFICIAL de Outubro · Série A · Kelvin — o mês inteiro rodando.</p></div>
<div class="box"><p class="t">🔴 Noite final ao vivo</p><p class="mini">Transmissão na comunidade com narrador e comentarista. A rodada que decide quem sobe e quem cai.</p></div>
<div class="box"><p class="t">⬇️ Medo de cair</p><p class="mini">Quem está em cima volta todo mês pra não perder a vaga. É isso que segura gente.</p></div>`

const tDiego = `
<h2>💰 Só pra você, Diego</h2>
<p>Prêmio é coisa do jogo (custa quase zero pra você). A inscrição fica inteira.</p>
<p class="o" style="color:#FFC400;font-size:14px;margin-top:10px">Com as 100 vagas cheias</p>
<table><tr><td>A · 20 × R$ 30</td><td>R$ 600</td></tr><tr><td>B · 20 × R$ 20</td><td>R$ 400</td></tr><tr><td>C · 20 × R$ 15</td><td>R$ 300</td></tr><tr><td>D · 20 × R$ 10</td><td>R$ 200</td></tr><tr><td>Várzea · 20 × R$ 5</td><td>R$ 100</td></tr></table>
<p>Por mês: <span class="tot">R$ 1.600</span></p>
<p class="o" style="color:#FFC400;font-size:14px;margin-top:10px">Fila grande?</p>
<p>É sinal de que dá pra subir o preço ou, mais pra frente, abrir uma 2ª Várzea.</p>
<p class="o" style="color:#FFC400;font-size:14px;margin-top:10px">E os prêmios vendem plano</p>
<p>Quem ganha 1 mês de Craque experimenta tudo e, quando acaba, muita gente continua pagando.</p>`

const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@500;600;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
<h1>🏆 Campeonato Oficial · <span style="color:#C2452F">o plano</span></h1>
<p class="sub">5 salas fixas (100 vagas) + fila de espera · sobe e cai todo mês · 4 sábados com roleta · prêmios em coisa do jogo.</p>
<div class="row">
<div class="ph"><div class="hd"><span class="n">1</span><b>A pirâmide</b></div><p>Várzea, D, C, B e A: uma sala de 20 cada. Lotou, vai pra fila.</p><div class="tela">${t1}</div></div>
<div class="ph"><div class="hd"><span class="n">2</span><b>O mês</b></div><p>4 sábados, roleta escolhe o leilão, pontos somam.</p><div class="tela">${t2}</div></div>
<div class="ph"><div class="hd"><span class="n">3</span><b>Inscrição e prêmios</b></div><p>Quanto mais alto, mais caro e melhor o prêmio. Cada divisão tem o seu campeão.</p><div class="tela">${t3}</div></div>
<div class="ph"><div class="hd"><span class="n">4</span><b>Por que entrar</b></div><p>Status pra quem joga, vitrine pra quem vê.</p><div class="tela">${t4}</div></div>
<div class="diego">${tDiego}</div>
</div></body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await (await b.newContext({ viewport: { width: 2080, height: 900 }, deviceScaleFactor: 2 })).newPage()
await p.setContent(html, { waitUntil: 'networkidle' }).catch(() => {})
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'scripts/mockups/campeonato-plano.png', fullPage: true })
await b.close()
console.log('ok scripts/mockups/campeonato-plano.png')
