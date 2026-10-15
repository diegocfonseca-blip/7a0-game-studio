#!/usr/bin/env node
// 🎨 MOCKUP — SALA ONLINE "KINGS LEAGUE" (15/10) — regras da Kings League BRASIL (ordem do Diego: só a Brasil)
// Diego: *"faça mockups de tudo… muita gente não sabe como é o jogo, tem que ser muito explicativo, talvez com banners
// entrando no meio do jogo, parando e explicando o que vai ocorrer e já reiniciando"* e *"não quero Modo Reis, quero
// escrito Kings League mesmo"*.
// Regras usadas (fontes no chat de 15/10): 10 times · 9 rodadas · 3/2/1/0 pontos (vitória normal/vitória no shootout/
// derrota no shootout/derrota) · 1º direto na semi, 2º–7º quartas · fut 7, 2×20 min, sem empate · dado no min 18
// (2 ou 3 por time até o intervalo) · carta secreta no 2º tempo (pênalti, shootout, suspensão 4 min, gol em dobro 4 min)
// · pênalti do presidente (1 por time) · min 38: bola dourada (empate = gol de ouro) ou vermelha (gols valem 2) ·
// empate persistiu = shootout.
// 8 telas: criar sala · leilão (campinho de 7) · vestiário · banner do dado · partida com botões · duelo do presidente
// · banner do minuto 38 · tabela com a pontuação e o mata-mata.
// uso: node scripts/mockup-kings-league.mjs → scripts/mockups/kings-league.png
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const ROXO = 'linear-gradient(160deg,#C9A8FF,#7C3AED)'
const VERDE = 'linear-gradient(160deg,#9BE0B0,#2E9E58)'
const KL = '👑 KINGS LEAGUE'
const tela = (n, titulo, corpo, nota = '') => `<div class="tl"><div class="nn">${n}</div><div class="tela">${titulo ? `<h1>${titulo}</h1>` : ''}${corpo}</div>${nota ? `<p class="nt">${nota}</p>` : ''}</div>`
const vaga = (x, y, pos, nome = '', grad = '', em = '') => `<div class="vg" style="left:${x}%;top:${y}%"><div class="vc ${nome ? '' : 'vz'}" style="${nome ? `background:${grad}` : ''}"><span>${pos}</span>${nome ? `<b>${nome}</b><i>${em}</i>` : '<em>Vazio</em>'}</div></div>`
const placar = (min, a, ga, gb, b, extra = '') => `<div class="pl"><div class="pt"><b>${a}</b><s>${ga}</s></div><div class="pm">${min}'${extra}</div><div class="pt d"><s>${gb}</s><b>${b}</b></div></div>`
const banner = (ic, tag, tit, txt, seg) => `<div class="ban"><div class="bi">${ic}</div><small>${tag}</small><b>${tit}</b><p>${txt}</p><div class="bar"><i style="width:60%"></i></div><em>⏸️ jogo parado · volta em ${seg}s</em></div>`

// 1 · criar sala
const t1 = tela(1, '🌐 Criar sala', `
<div class="lb">TIPO DE SALA</div>
<div class="g2"><div class="op">⚡ Partida rápida</div><div class="op">📋 Minhas Ligas</div><div class="op sel">${KL}<small>NOVO</small></div><div class="op">🌐 Copa do Mundo</div></div>
<div class="exp"><b>${KL} — como funciona</b>
<ul><li>⚽ <b>Futebol 7</b>: leilão de <b>goleiro + 6</b></li><li>🏆 <b>10 times</b>, 9 rodadas, depois mata-mata</li><li>🎲 Dado, 🃏 carta secreta, 🎩 pênalti do presidente</li><li>🚫 <b>Não tem empate</b>: vai pro shootout</li></ul>
<span>Calma: o jogo explica cada regra na hora que ela acontece. 😉</span></div>
<div class="bt g">CRIAR SALA KINGS LEAGUE</div>`, 'Aparece junto dos outros tipos. A caixa de baixo é o resumo pra quem nunca viu.')

// 2 · leilão
const t2 = tela(2, '', `<div class="lb">🔨 SEU TIME NO LEILÃO · 4/7</div>
<div class="campo"><div class="placas top">KINGS LEAGUE · 👑 · KINGS LEAGUE · 👑 · KINGS LEAGUE</div><div class="placas bot">LEILÃO LEGENDS · 🔨 · LEILÃO LEGENDS · 🔨</div>
<svg viewBox="0 0 100 130" preserveAspectRatio="none"><g fill="none" stroke="rgba(255,255,255,.85)" stroke-width="0.9"><rect x="6" y="8" width="88" height="114" rx="2"/><line x1="6" y1="65" x2="94" y2="65"/><circle cx="50" cy="65" r="11"/><rect x="28" y="8" width="44" height="17"/><rect x="28" y="105" width="44" height="17"/></g></svg>
<div class="selo"><b>KINGS<br>LEAGUE</b><span>👑</span></div>
${vaga(32, 22, 'ATA', 'Romário', OURO, '👑')}${vaga(68, 22, 'ATA')}${vaga(24, 45, 'MEI', 'Djalminha', ROXO, '⭐')}${vaga(76, 45, 'MEI')}${vaga(30, 68, 'ZAG', 'Aldair', VERDE, '🎯')}${vaga(70, 68, 'ZAG')}${vaga(50, 85, 'GOL', 'Marcos', ROXO, '⭐')}</div>`, 'O campinho de 7 no lugar do de 11. Cartas, níveis e lances: tudo igual.')

// 3 · vestiário
const carta = (ic, t, d, sel = false) => `<div class="ca ${sel ? 'sel' : ''}"><div class="ci">${ic}</div><b>${t}</b><small>${d}</small></div>`
const t3 = tela(3, '🚪 Vestiário · rodada 4', `<div class="rel">⏱️ 12s pra todo mundo escolher</div>
<div class="lb">🃏 ESCOLHA SUA CARTA SECRETA</div>
<div class="g2">${carta('⚽', 'Pênalti', 'uma cobrança a seu favor')}${carta('🏃', 'Shootout', 'sai do meio, 5s contra o goleiro', true)}${carta('🟥', 'Suspensão', 'um rival fica 4 min fora')}${carta('✖️2', 'Gol em dobro', 'seus gols valem 2 por 4 min')}</div>
<div class="dica">🤫 O rival não vê qual você pegou. Você usa no <b>2º tempo</b>, quando quiser, num botão.</div>`, 'Todos os jogos da rodada abrem o vestiário AO MESMO TEMPO. Não escolheu? Fica sem carta.')

// 4 · banner do dado
const t4 = tela(4, '', `${placar(18, 'SEU TIME', 2, 1, 'Rival FC')}
<div class="campinho escuro"></div>
${banner('🎲', 'MINUTO 18 · O DADO', 'Quantos ficam em campo?', 'O dado decide: até o fim do 1º tempo, cada time joga com <b>2 ou 3</b> jogadores. Menos gente = mais espaço = mais gol!', 4)}
<div class="dado">3</div>`, 'Banner GRANDE, jogo parado uns 5s, explica e volta sozinho. Cai no mesmo minuto em todos os jogos da sala.')

// 5 · partida com botões
const t5 = tela(5, '', `${placar(27, 'SEU TIME', 3, 3, 'Rival FC')}
<div class="campinho"><div class="ev">⚽ 26' Romário · gol de cabeça</div><div class="ev">⚽ 24' Rival FC · chute de fora</div></div>
<div class="g2"><div class="bk v">🃏 USAR CARTA<small>Shootout · até o min 36</small></div><div class="bk r">🎩 PÊNALTI DO PRESIDENTE<small>você bate! · 1 por jogo</small></div></div>
<div class="dica">Dois botões, os dois só valem <b>uma vez</b>. O jogo não para: a jogada entra no minuto em que você apertar.</div>`, 'Na 1ª vez que cada botão acende, um balãozinho explica o que ele faz.')

// 6 · duelo do presidente
const gol = (c, sel = '') => `<div class="cg ${sel}">${c}</div>`
const t6 = tela(6, '', `<div class="duelo"><small>🎩 PÊNALTI DO PRESIDENTE</small><b>VOCÊ BATE!</b><p>Escolha o canto. O <b>Rival FC</b> (gente!) está escolhendo pra onde pular, agora.</p>
<div class="gl">${gol('↖️')}${gol('⬆️')}${gol('↗️', 'sel')}${gol('↙️')}${gol('⬇️')}${gol('↘️')}</div><div class="rel">⏱️ 5s</div></div>
<div class="duelo2"><small>NA TELA DO RIVAL</small><b>🧤 DEFENDA!</b><p>Fulano vai bater. Pra onde você pula?</p></div>`, 'Gente × gente: um bate, o outro defende, ao mesmo tempo. Contra bot, o goleiro pula sozinho.')

// 7 · minuto 38
const t7 = tela(7, '', `${placar(38, 'SEU TIME', 4, 4, 'Rival FC')}
${banner('🟡', 'MINUTO 38 · TÁ EMPATADO', 'BOLA DOURADA!', 'Agora é <b>gol de ouro</b>: quem marcar primeiro <b>vence na hora</b>. Se ninguém marcar até o fim, vai pro <b>shootout</b>.', 4)}
<div class="alt">🔴 Se um time estivesse na frente, seria a <b>BOLA VERMELHA</b>: todo gol vale <b>2</b> até o apito.</div>`, 'Cada regra nova = um banner desses, parando o jogo uns segundos e explicando.')

// 8 · tabela
const lin = (p, n, pts, c = '') => `<div class="tr ${c}"><i>${p}</i><b>${n}</b><span>${pts}</span></div>`
const t8 = tela(8, '🏆 Tabela · Kings League', `<div class="pts"><b>PONTOS</b><span>✅ vitória <b>3</b></span><span>🎯 vitória no shootout <b>2</b></span><span>😬 derrota no shootout <b>1</b></span><span>❌ derrota <b>0</b></span></div>
<div class="tab">${lin(1, 'SEU TIME', 19, 'semi')}${lin(2, 'Rival FC', 17, 'q')}${lin(3, 'Labubu F.C', 15, 'q')}${lin(4, 'Futpoint FC', 14, 'q')}${lin(5, 'Guimarães SCI', 12, 'q')}${lin(6, 'Bot Ventania', 11, 'q')}${lin(7, 'K9 FC', 10, 'q')}${lin(8, 'Bot Trovão', 7, 'fora')}${lin(9, 'Bot Granizo', 5, 'fora')}${lin(10, 'Bot Brisa', 2, 'fora')}</div>
<div class="leg"><span class="semi">1º direto na SEMI</span><span class="q">2º–7º QUARTAS</span><span class="fora">8º–10º fora</span></div>`, '10 times, 9 rodadas. Igual à Kings League Brasil.')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Inter,Arial,sans-serif;color:#0C0C0C;display:grid;grid-template-columns:repeat(4,400px);gap:20px;padding:20px;width:1700px}
.tl{position:relative}.nn{position:absolute;top:-8px;left:-8px;z-index:9;width:32px;height:32px;border-radius:50%;background:#0C0C0C;color:#FFC400;font:700 17px/32px Oswald;text-align:center}
.tela{background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:14px;min-height:560px;position:relative;overflow:hidden}
.nt{font-size:11.5px;font-weight:700;color:#53534b;margin:8px 4px 0;line-height:1.4}
h1{font:700 23px/1 Oswald;text-transform:uppercase;margin:0 0 10px}.lb{font:700 12px Oswald;color:#53534b;margin:6px 0 6px;letter-spacing:.04em}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.op{border:3px solid #0C0C0C;border-radius:12px;background:#fff;font:700 14px Oswald;text-align:center;padding:10px 4px;position:relative}.op.sel{background:#0C0C0C;color:#FFC400;box-shadow:3px 3px 0 #C2452F}.op small{position:absolute;top:-9px;right:-6px;background:#C2452F;color:#fff;border:2px solid #0C0C0C;border-radius:6px;font-size:9px;padding:0 4px}
.exp{margin-top:12px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:10px 12px}.exp b{font:700 15px Oswald}.exp ul{margin:6px 0;padding-left:4px;list-style:none;font-size:12.5px;font-weight:600;line-height:1.6}.exp span{font-size:11.5px;font-weight:700;color:#1B7A3D}
.bt{margin-top:12px;font:700 17px Oswald;text-align:center;border:3px solid #0C0C0C;border-radius:13px;box-shadow:3px 3px 0 #0C0C0C;padding:11px}.bt.g{background:#1B7A3D;color:#fff}
.campo{position:relative;border:3px solid #0C0C0C;border-radius:14px;overflow:hidden;aspect-ratio:1/1.3;background:repeating-linear-gradient(180deg,#1f8f4a 0 9%,#1a8042 9% 18%)}
svg{position:absolute;inset:0;width:100%;height:100%}.placas{position:absolute;left:0;right:0;height:5.5%;background:#111;color:#FFC400;font:700 9px/1 Oswald;letter-spacing:.15em;display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden;z-index:2}.placas.top{top:0}.placas.bot{bottom:0}
.selo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:84px;height:84px;border-radius:50%;border:3px solid rgba(255,255,255,.55);background:rgba(0,0,0,.18);display:flex;flex-direction:column;align-items:center;justify-content:center;color:rgba(255,255,255,.9)}.selo b{font:700 12px/.95 Oswald;text-align:center}.selo span{font-size:16px}
.vg{position:absolute;transform:translate(-50%,-50%);width:76px;text-align:center;z-index:3}.vc{border:3px solid #0C0C0C;border-radius:10px;box-shadow:2px 3px 0 #0C0C0C;padding:3px 3px 4px;background:#fff}.vc.vz{background:rgba(255,255,255,.4);border-style:dashed;box-shadow:none}.vc span{display:inline-block;font:700 9.5px Oswald;background:#0C0C0C;color:#fff;border-radius:6px;padding:1px 6px}.vc.vz span{background:rgba(0,0,0,.55)}.vc b{display:block;font:700 12px/1 Oswald}.vc i{font-style:normal;font-size:10px}.vc em{display:block;font-style:normal;font:700 10.5px Oswald;color:rgba(12,12,12,.7)}
.rel{color:#0C0C0C;font:700 14px Oswald;background:#FFF3C4;border:2px solid #0C0C0C;border-radius:10px;padding:6px;text-align:center;margin-bottom:8px}
.ca{border:3px solid #0C0C0C;border-radius:13px;background:#fff;padding:10px 6px;text-align:center;box-shadow:3px 3px 0 #0C0C0C}.ca.sel{background:#7C3AED;color:#fff;box-shadow:0 0 0 3px #FFC400,3px 3px 0 #0C0C0C}.ci{font-size:28px}.ca b{font:700 15px Oswald;display:block;text-transform:uppercase}.ca small{font-size:10.5px;font-weight:600}
.dica{margin-top:10px;font-size:12px;font-weight:600;background:#fff;border:2px dashed #7C3AED;border-radius:10px;padding:8px 10px;line-height:1.4}
.pl{display:flex;align-items:center;background:#0C0C0C;color:#fff;border-radius:14px;padding:10px;gap:6px}.pt{flex:1;display:flex;align-items:center;gap:8px;justify-content:flex-start}.pt.d{justify-content:flex-end}.pt b{font:700 14px Oswald}.pt s{text-decoration:none;font:700 32px Oswald;color:#FFC400}.pm{font:700 16px Oswald;background:#C2452F;border-radius:8px;padding:3px 8px}
.campinho{height:250px;margin-top:10px;border:3px solid #0C0C0C;border-radius:14px;background:repeating-linear-gradient(90deg,#1f8f4a 0 30px,#1a8042 30px 60px);padding:8px;display:flex;flex-direction:column;gap:6px;justify-content:flex-end}.campinho.escuro{filter:brightness(.45)}
.ev{background:rgba(255,255,255,.92);border:2px solid #0C0C0C;border-radius:9px;font:700 12px Oswald;padding:4px 8px}
.ban{position:absolute;left:14px;right:14px;top:120px;background:${OURO};border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;padding:14px;text-align:center;z-index:5}.bi{font-size:44px;line-height:1}.ban small{display:block;font:700 12px Oswald;letter-spacing:.16em;margin-top:4px}.ban>b{display:block;font:700 26px/1.05 Oswald;text-transform:uppercase;margin-top:2px}.ban p{font-size:12.5px;font-weight:600;margin:6px 0 8px;line-height:1.4}.bar{height:9px;background:rgba(0,0,0,.2);border:2px solid #0C0C0C;border-radius:6px;overflow:hidden}.bar i{display:block;height:100%;background:#0C0C0C}.ban em{display:block;font-style:normal;font:700 11px Oswald;margin-top:5px}
.dado{position:absolute;right:30px;top:96px;z-index:6;width:58px;height:58px;background:#fff;border:4px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;font:700 34px/50px Oswald;text-align:center;transform:rotate(12deg)}
.bk{border:3px solid #0C0C0C;border-radius:13px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 6px;text-align:center;font:700 14px Oswald;margin-top:10px}.bk small{display:block;font:600 10.5px Arial}.bk.v{background:#7C3AED;color:#fff}.bk.r{background:#C2452F;color:#fff}
.duelo{background:#0C0C0C;color:#fff;border-radius:16px;padding:14px;text-align:center}.duelo small{font:700 12px Oswald;color:#FFC400;letter-spacing:.12em}.duelo>b{display:block;font:700 30px Oswald}.duelo p{font-size:12px;font-weight:600;opacity:.9;margin:4px 0 10px}
.gl{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:repeating-linear-gradient(45deg,#fff 0 6px,#ddd 6px 12px);border:4px solid #fff;border-bottom:none;padding:8px;margin-bottom:8px}.cg{background:rgba(12,12,12,.75);border:2px solid #fff;border-radius:9px;font-size:22px;padding:8px 0}.cg.sel{background:#FFC400;box-shadow:0 0 12px #FFC400}
.duelo2{margin-top:12px;background:#fff;border:3px dashed #0C0C0C;border-radius:14px;padding:10px;text-align:center}.duelo2 small{font:700 11px Oswald;color:#53534b}.duelo2 b{display:block;font:700 22px Oswald}.duelo2 p{font-size:12px;font-weight:600;margin:2px 0 0}
.alt{position:absolute;left:14px;right:14px;bottom:16px;font-size:12px;font-weight:700;background:#fff;border:3px solid #C2452F;border-radius:12px;padding:8px 10px}
.pts{display:flex;flex-wrap:wrap;gap:5px;background:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:8px}.pts>b{width:100%;font:700 12px Oswald}.pts span{font-size:11px;font-weight:700;background:#F4ECD6;border:2px solid #0C0C0C;border-radius:8px;padding:2px 6px}
.tab{margin-top:8px;background:#fff;border:3px solid #0C0C0C;border-radius:12px;overflow:hidden}.tr{display:flex;align-items:center;gap:8px;padding:5px 9px;border-top:1px solid #eee;font-size:13px}.tr i{font-style:normal;font:700 13px Oswald;width:18px}.tr b{flex:1;font:700 14px Oswald}.tr span{font:700 15px Oswald}
.tr.semi{background:#FFE79A}.tr.q{background:#e6f4ea}.tr.fora{color:#8a8577}
.leg{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}.leg span{font:700 10.5px Oswald;border:2px solid #0C0C0C;border-radius:7px;padding:2px 6px}.leg .semi{background:#FFE79A}.leg .q{background:#e6f4ea}.leg .fora{background:#eee}
</style></head><body>${t1}${t2}${t3}${t4}${t5}${t6}${t7}${t8}</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1700, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `kings-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/kings-league.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/kings-league.png')
