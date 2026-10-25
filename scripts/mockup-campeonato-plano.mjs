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
<div class="box"><p class="t">🏆 Liga Oficial · as 5 divisões</p><p class="mini">Uma sala de 20 por divisão = <b>100 vagas</b>. Cada divisão joga separada, só contra quem é dela. Pra jogar precisa do <b>⭐ Plano Craque (R$ 9,90/mês)</b>.</p></div>
${div('Série A', 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)', 'sexta · 20h', 100, 'elite')}
${seta}
${div('Série B', '#E7DAFF', 'quinta · 20h', 100, '')}
${seta}
${div('Série C', '#CFE8D6', 'quarta · 20h', 100, '')}
${seta}
${div('Série D', '#FFE0D6', 'terça · 20h', 100, '')}
${seta.replace('4 caem', '4 saem do Oficial')}
${div('Várzea', '#EFE6CF', 'segunda · 20h', 100, 'porta de entrada')}
<div class="box" style="margin-top:8px"><p class="t" style="font-size:13px">⏳ Fila de espera · 37 na fila</p><p class="mini">Lotou as 100? Quem chega entra na fila. Toda semana os <b>4 últimos da Várzea saem</b> e os 4 primeiros da fila entram. Quem não se inscreve na semana também libera a vaga.</p><span class="btn" style="background:#7C3AED;font-size:14px">🙋 Entrar na fila</span></div>`

const sem = (d, tit, sub, cor) => `<div class="sem" style="background:${cor}"><div class="d">${d}</div><div style="flex:1"><b class="o" style="font-size:14px">${tit}</b><div class="mini" style="color:#0C0C0C">${sub}</div></div></div>`
const t2 = `
<div class="box"><p class="t">📅 A semana · cada noite é uma divisão</p><p class="mini">A temporada começa e acaba na MESMA noite. Toda semana é uma temporada nova.</p>
${sem('SEG', 'Várzea', 'porta de entrada', '#EFE6CF')}
${sem('TER', 'Série D', '', '#FFE0D6')}
${sem('QUA', 'Série C', '', '#CFE8D6')}
${sem('QUI', 'Série B', '', '#E7DAFF')}
${sem('SEX', '⭐ Série A · ao vivo', 'transmissão com narrador e comentarista', 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)')}
</div>
<div class="box"><p class="t">🌙 Uma noite</p>
<table class="tb"><tr><td>🎰 Roleta sorteia o leilão</td><td>✉️ · 🐊 · 🔨</td></tr><tr><td>🔨 Leilão</td><td>~20 min</td></tr><tr><td>⚽ Liga de 38 rodadas (sem bot)</td><td>~25-40 min</td></tr><tr><td>🏆 Campeão + sobe e cai na hora</td><td>no fim</td></tr></table>
<p class="mini" style="margin-top:6px">⏱️ Tempo é estimativa: medir numa sala de verdade antes de lançar.</p></div>
<div class="box"><p class="t">⬆️⬇️ Sobe e cai</p><p class="mini">Os <b>4 primeiros sobem</b> e os <b>4 últimos caem</b>, já pra semana seguinte. Faltou? Não paga, mas a vaga vai pra quem está na fila.</p></div>`

const pr = (pos, item, extra) => `<tr><td>${pos}</td><td>${item}${extra ? `<br><span style="color:#1B7A3D">${extra}</span>` : ''}</td></tr>`
const bloco = (nome, cor, insc, gasto, linhas) => `<div class="box" style="padding:9px"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="tag" style="background:${cor};font-size:12px">${nome}</span><span class="mini" style="flex:1">inscrição <b>R$ ${insc}</b> · gastou R$ ${gasto}</span></div><table class="tb">${linhas}</table></div>`
const t3 = `
${bloco('⭐ Série A', '#FFC400', '30', '39,90', pr('🥇 1º', 'Batismo completo', 'ou R$ 79,90 no Pix') + pr('🥈 2º', 'Escudo ou mascote', 'ou R$ 40 no Pix') + pr('🥉 3º', 'Próxima inscrição grátis'))}
${bloco('Série B', '#E7DAFF', '20', '29,90', pr('🥇 1º', 'Escudo ou mascote') + pr('🥈 2º', 'Manto') + pr('🥉 3º', 'Próxima inscrição grátis'))}
${bloco('Série C', '#CFE8D6', '15', '24,90', pr('🥇 1º', 'Escudo ou mascote') + pr('🥈 2º', 'Entrada de gala') + pr('🥉 3º', 'Próxima inscrição grátis'))}
${bloco('Série D', '#FFE0D6', '10', '19,90', pr('🥇 1º', 'Manto + canto da torcida') + pr('🥈 2º', 'Canto da torcida') + pr('🥉 3º', 'Próxima inscrição grátis'))}
${bloco('Várzea', '#EFE6CF', '5', '14,90', pr('🥇 1º', 'Entrada de gala + próxima grátis') + pr('🥈 2º', 'Tema da sala') + pr('🥉 3º', 'Próxima inscrição grátis'))}
<span class="btn">💸 Me inscrever · Pix</span>`

const t4 = `
<div class="box"><p class="t">🏅 Selo da divisão no nome</p>
<div style="display:flex;align-items:center;gap:8px;border:2px solid #000;border-radius:10px;padding:7px;background:#F4ECD6"><b class="o" style="font-size:15px">Kelvin</b><span class="tag" style="background:#FFC400">⭐ Série A</span><span style="flex:1"></span><span class="mini">no chat e nas salas</span></div>
<div style="display:flex;align-items:center;gap:8px;border:2px solid #000;border-radius:10px;padding:7px;background:#F4ECD6;margin-top:6px"><b class="o" style="font-size:15px">Neymarzetti</b><span class="tag" style="background:#EFE6CF">Várzea</span></div></div>
<div class="box" style="background:linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)"><p class="t">👑 Moldura de campeão</p><p class="mini" style="color:#0C0C0C">O campeão de cada divisão fica 1 semana com moldura dourada no nome e na carta. Ninguém consegue comprar.</p></div>
<div class="box" style="background:#2A1250;color:#fff"><p class="t" style="color:#FFC400">📺 Telão de todas as salas</p><p class="mini" style="color:#E7DAFF">🏆 K9 FC é o CAMPEÃO OFICIAL da Série A · Kelvin, rodando a semana inteira.</p></div>
<div class="box"><p class="t">🏆 Taça no perfil pra sempre</p><p class="mini">Com a contagem: "3× campeão da Série A · 1× da B".</p></div>
<div class="box"><p class="t">🔴 Sexta ao vivo</p><p class="mini">A noite da Série A é transmitida na comunidade com narrador e comentarista.</p></div>
<div class="box"><p class="t">⬇️ Medo de cair</p><p class="mini">Quem está em cima volta toda semana pra não perder a vaga.</p></div>`

const tDiego = `
<h2>💰 Só pra você, Diego</h2>
<p class="o" style="color:#FFC400;font-size:14px;margin-top:6px">Inscrição por semana (100 vagas)</p>
<table><tr><td>A · 20 × R$ 30</td><td>R$ 600</td></tr><tr><td>B · 20 × R$ 20</td><td>R$ 400</td></tr><tr><td>C · 20 × R$ 15</td><td>R$ 300</td></tr><tr><td>D · 20 × R$ 10</td><td>R$ 200</td></tr><tr><td>Várzea · 20 × R$ 5</td><td>R$ 100</td></tr></table>
<p>Por semana: <span class="tot">R$ 1.600</span></p>
<p>Por mês: <span class="tot">~R$ 6.400</span></p>
<p class="o" style="color:#FFC400;font-size:14px;margin-top:10px">O que sai em dinheiro</p>
<p>Só o 1º e o 2º da Série A, e só se escolherem Pix: no máximo <b>~R$ 120 por semana</b>. O resto é coisa do jogo.</p>
<p class="o" style="color:#FFC400;font-size:14px;margin-top:10px">E o plano por fora</p>
<p>Todo mundo precisa do Craque: 100 × R$ 9,90 = <b>~R$ 990 por mês</b> a mais.</p>
<p class="o" style="color:#FFC400;font-size:14px;margin-top:10px">⚠️ Antes de lançar</p>
<p>Inscrição paga com prêmio em dinheiro: conversar com contador ou advogado.</p>`

const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@500;600;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
<h1>🏆 Campeonato Oficial · <span style="color:#C2452F">o plano</span></h1>
<p class="sub">Uma divisão por noite · a temporada começa e acaba na mesma noite · sobe e cai toda semana · 100 vagas + fila · prêmio até o 3º.</p>
<div class="row">
<div class="ph"><div class="hd"><span class="n">1</span><b>A pirâmide</b></div><p>Várzea, D, C, B e A: uma sala de 20 cada, cada uma no seu dia.</p><div class="tela">${t1}</div></div>
<div class="ph"><div class="hd"><span class="n">2</span><b>A semana</b></div><p>Segunda a sexta, uma divisão por noite. Campeão sai na hora.</p><div class="tela">${t2}</div></div>
<div class="ph"><div class="hd"><span class="n">3</span><b>Prêmios até o 3º</b></div><p>Por temporada (noite). Quem ganha leva ~o dobro do que gastou.</p><div class="tela">${t3}</div></div>
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
