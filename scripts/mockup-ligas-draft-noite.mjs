// 📋🔨 MOCKUP (01/11): MINHAS LIGAS + DRAFT — o fluxo FECHADO com o Diego.
// T1 = leilão normal de 11. Fim da temporada: moedas pela colocação + draft em segredo (24 h, cada um no seu horário).
// Noite da T2: 🎬 Show do Draft (revelação ao vivo, suspense da Liga Draft) → 🔨 leilão → ⚽ temporada.
// Faltou: draft = pior livre; leilão = só as sobras que ninguém quis. Ninguém é tirado da liga por faltar.
//   node scripts/mockup-ligas-draft-noite.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? 'mockup-ligas-draft-noite.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const cel = (n, titulo, sub, corpo) => `<div><div class="leg">${n}</div><div class="cel"><div class="cab"><b>${titulo}</b><small>${sub}</small></div>${corpo}</div></div>`
const branco = h => `<div style="background:#fff;border:3px solid ${INK};border-radius:12px;overflow:hidden;color:${INK}">${h}</div>`
const faixa = (t, cor = INK, ink = GOLD) => `<div style="background:${cor};color:${ink};font:700 13px Oswald;padding:6px 10px;letter-spacing:.06em;text-transform:uppercase">${t}</div>`
const lin = (a, c = '', fundo = '') => `<div style="display:flex;gap:8px;align-items:center;padding:6px 10px;font:600 14px Oswald;border-top:1px solid #eee;${fundo}"><span style="flex:1">${a}</span>${c}</div>`
const btn = (t, cor = GOLD, ink = INK) => `<div style="margin-top:10px;background:${cor};color:${ink};border:3px solid ${INK};border-radius:12px;padding:11px;text-align:center;font:700 17px Oswald;text-transform:uppercase;box-shadow:3px 3px 0 #000">${t}</div>`
const nota = t => `<p style="color:#ddd;font:400 12.5px/1.4 system-ui;margin:10px 2px 0">${t}</p>`

const t1 = cel('1 · Temporada 1', '🔨 Começo da liga', 'igual a hoje', `
  ${branco(faixa('Noite 1 · Liga da Firma') + lin('🔨 Leilão normal de 11') + lin('⚽ Temporada 1 rola') + lin('🏁 Termina com a tabela'))}
  ${nota('Nada muda na primeira temporada: é a liga que já existe.')}`)

const fim = cel('2 · Fim da temporada', '💰 Prêmio + 📋 draft em segredo', 'cada um no seu horário · 24 h', `
  ${branco(faixa('💰 Moedas pela colocação') + lin('🥇 Butinas FC', '<b>+40 🪙</b>') + lin('🥈 Fabulous EC', '<b>+32 🪙</b>') + lin('🥉 K9 FC (você)', '<b>+26 🪙</b>', 'background:#FFF3C4') + lin('… até o último', '<b>+6 🪙</b>'))}
  <div style="height:10px"></div>
  ${branco(faixa('📋 Draft · sua escolha fica em segredo') + lin('1º Butinas FC', '<span style="color:' + GREEN + '">✓ já escolheu 🔒</span>') + lin('2º Fabulous EC', '<span style="color:' + GREEN + '">✓ já escolheu 🔒</span>') + lin('3º K9 FC (você)', '<span style="color:' + RED + '">⏱ falta você · 18 h</span>', 'background:#FFF3C4') + lin('4º Tocaia SC', '<span style="color:#888">depois de você</span>'))}
  ${btn('🔎 Escolher meu jogador')}
  ${nota('Ninguém vê a escolha do outro até a próxima noite. Quem não escolher em 24 h fica com o PIOR jogador livre.')}`)

const show = cel('3 · Noite da temporada 2', '🎬 Show do Draft · ao vivo', 'abertura da noite, todo mundo junto', `
  <div style="background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:12px;padding:12px;text-align:center;font:700 19px Oswald;text-transform:uppercase">Com a 1ª escolha do draft… Butinas FC escolheu</div>
  <div style="margin-top:10px;border:3px solid ${GOLD};border-radius:12px;padding:12px;background:#111;color:#fff;text-align:center">
    <div style="font:600 13px Oswald;color:${GOLD};letter-spacing:.08em">AS PISTAS, DE 2 EM 2 SEGUNDOS</div>
    <div style="display:flex;justify-content:center;gap:6px;margin-top:8px;flex-wrap:wrap">${['⚽ ATACANTE', '👑 LENDA', '🇧🇷 BRASIL · ANOS 2010', '🃏 A CARTA VIRA…'].map((p, i) => `<span style="font:700 13px Oswald;background:${i < 3 ? GOLD : '#333'};color:${i < 3 ? INK : GOLD};border-radius:7px;padding:3px 8px">${p}</span>`).join('')}</div>
    <div style="font:700 30px Oswald;margin-top:10px">NEYMAR</div><div style="font:500 13px system-ui;opacity:.8">Barcelona · 2015</div></div>
  ${nota('Mesmo suspense da Liga Draft. Revela um por um, na ordem da tabela. Quem não estiver na noite assiste depois.')}`)

const leilao = cel('4 · Depois do show', '🔨 Leilão de sempre', 'o jogador do draft já está no time', `
  ${branco(faixa('K9 FC · antes do leilão') + lin('📋 Romário', '<span style="color:' + PURPLE + '">veio do draft</span>') + lin('💰 Dinheiro', '<b>300 + 26 🪙</b>') + lin('🔨 Vagas pro leilão', '<b>10</b>'))}
  <div style="height:10px"></div>
  ${branco(faixa('Faltou ao leilão?', RED, '#fff') + `<div style="padding:8px 10px;font:500 13px/1.45 system-ui">Não dá lance e não leva carta disputada: completa o time só com <b>as sobras que ninguém quis</b>. Continua na liga, com time em campo.</div>`)}
  ${btn('⚽ Começa a temporada 2', GREEN, '#fff')}`)

const linha = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;font:700 18px Oswald;text-transform:uppercase;flex-wrap:wrap">
  ${['🔨 Leilão (T1)', '⚽ Temporada 1', '💰 Moedas + 📋 draft secreto (24 h)', '🎬 Show do Draft', '🔨 Leilão', '⚽ Temporada 2', '🔁 …'].map(x => `<span style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:8px 12px;box-shadow:3px 3px 0 ${INK}">${x}</span>`).join('<span>➜</span>')}</div>`

const html = `<html><head><style>${F}body{margin:0;background:${CREME};color:${INK};padding:26px;width:1560px;font-family:Oswald}
.cel{background:#141210;border:3px solid ${INK};border-radius:22px;padding:14px;width:360px;box-sizing:border-box;box-shadow:5px 5px 0 #000}
.leg{font:700 18px Oswald;text-transform:uppercase;margin-bottom:8px}
.cab{border:2px solid #333;border-radius:12px;padding:8px 12px;margin-bottom:10px;color:#fff}.cab b{display:block;font:700 16px Oswald;text-transform:uppercase}.cab small{font:400 12px system-ui;opacity:.75}</style></head><body>
<div style="font:700 34px Oswald;text-transform:uppercase">📋 Minhas Ligas + Draft · como fica a liga</div>
<div style="font:400 16px Oswald;color:#444;margin:4px 0 18px">A 1ª temporada é a de sempre. Da 2ª em diante: prêmio, draft secreto, show ao vivo e o leilão.</div>
<div style="display:flex;gap:18px;align-items:flex-start">${t1}${fim}${show}${leilao}</div>
${linha}</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1612, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
