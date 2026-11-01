// 🕵️📋 MOCKUPS (01/11): MINHAS LIGAS + DRAFT + SONDAR — as regras fechadas com o Diego.
//  · elenco até 22; passou disso, manda um pras sobras;
//  · fim da temporada: OU usa a vez no draft OU sonda 1 jogador de um amigo (quem sonda PERDE a vez no draft);
//  · o sondado vai pro leilão com lance inicial = o que o dono pagou (piso, igual à carreira); o dono também dá lance;
//    vendeu → o dinheiro vai pro dono; ninguém deu lance → volta pro dono sem custo;
//  · jogador do draft chega valendo 10 🪙.
//   node scripts/mockup-ligas-sondar.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? 'mockup-ligas-sondar.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const cel = (n, titulo, sub, corpo) => `<div><div class="leg">${n}</div><div class="cel"><div class="cab"><b>${titulo}</b><small>${sub}</small></div>${corpo}</div></div>`
const branco = h => `<div style="background:#fff;border:3px solid ${INK};border-radius:12px;overflow:hidden;color:${INK}">${h}</div>`
const faixa = (t, cor = INK, ink = GOLD) => `<div style="background:${cor};color:${ink};font:700 13px Oswald;padding:6px 10px;letter-spacing:.06em;text-transform:uppercase">${t}</div>`
const lin = (a, c = '', fundo = '') => `<div style="display:flex;gap:8px;align-items:center;padding:6px 10px;font:600 14px Oswald;border-top:1px solid #eee;${fundo}"><span style="flex:1">${a}</span>${c}</div>`
const btn = (t, cor = GOLD, ink = INK) => `<div style="margin-top:10px;background:${cor};color:${ink};border:3px solid ${INK};border-radius:12px;padding:11px;text-align:center;font:700 16px Oswald;text-transform:uppercase;box-shadow:3px 3px 0 #000">${t}</div>`
const nota = t => `<p style="color:#ddd;font:400 12.5px/1.4 system-ui;margin:10px 2px 0">${t}</p>`
const tag = (t, bg, ink = '#fff') => `<span style="font:700 11px Oswald;background:${bg};color:${ink};border-radius:6px;padding:2px 6px;text-transform:uppercase">${t}</span>`

// 1 — a escolha do fim de temporada
const escolha = cel('1 · Fim da temporada', '🏁 Sua jogada da temporada', 'você é o 3º da tabela · escolha UMA', `
  <div style="background:${GOLD};border:3px solid ${INK};border-radius:12px;padding:12px;color:${INK};box-shadow:3px 3px 0 #000">
    <div style="font:700 18px Oswald;text-transform:uppercase">📋 Usar minha vez no draft</div>
    <div style="font:400 13px/1.4 system-ui;margin-top:4px">Pega 1 jogador LIVRE de todo o jogo, em segredo. Ele chega valendo 10 🪙.</div></div>
  <div style="text-align:center;font:700 16px Oswald;color:#fff;margin:8px 0">ou</div>
  <div style="background:${CREME};border:3px solid ${INK};border-radius:12px;padding:12px;color:${INK}">
    <div style="font:700 18px Oswald;text-transform:uppercase">🕵️ Sondar o jogador de um amigo</div>
    <div style="font:400 13px/1.4 system-ui;margin-top:4px">Ele vai pro próximo leilão e todo mundo disputa — o dono também.</div>
    <div style="margin-top:8px;font:700 13px Oswald;color:${RED};text-transform:uppercase">⚠️ Quem sonda perde a vez no draft</div></div>
  ${nota('Uma jogada por temporada: draft OU sondar. Prazo: 24 h.')}`)

// 2 — escolhendo quem sondar
const sondar = cel('2 · Sondar', '🕵️ De quem você quer?', 'os elencos dos amigos', `
  ${branco(faixa('Fabulous EC · 22 jogadores') +
    [['Romário', 'Vasco 2000', '👑', 38, true], ['Juninho Pernambucano', 'Vasco 1997', '⭐', 22], ['Edmundo', 'Vasco 1997', '⭐', 19], ['Zé Roberto', 'Bayern 2006', '📋', 10]]
      .map(([n, c, k, v, sel]) => lin(`${k} ${n} <span style="color:#888;font-weight:400">${c}</span>`, `<b>${v} 🪙</b>`, sel ? 'background:#FFF3C4;outline:3px solid ' + GOLD + ';outline-offset:-3px' : '')).join(''))}
  <div style="margin-top:10px;background:#fff;border:3px solid ${INK};border-radius:12px;padding:9px 11px;font:500 13px/1.45 system-ui;color:${INK}">
    <b style="font:700 15px Oswald;text-transform:uppercase">Romário vai pro leilão</b><br>Lance inicial: <b>38 🪙</b> (o que o Fabulous pagou).<br>Você <b>perde a sua vez no draft</b> desta temporada.</div>
  ${btn('🕵️ Confirmar a sondagem')}
  ${nota('📋 = veio do draft (vale 10 🪙). O valor é sempre o que foi pago, igual na carreira.')}`)

// 3 — o aviso pro amigo
const aviso = cel('3 · O amigo fica sabendo', '🔔 Aviso pro Fabulous EC', 'na hora, com zoeira', `
  <div style="background:${RED};color:#fff;border:3px solid ${INK};border-radius:12px;padding:14px;text-align:center;box-shadow:3px 3px 0 #000">
    <div style="font-size:38px">🕵️</div>
    <div style="font:700 22px Oswald;text-transform:uppercase;margin-top:4px">Sondaram o seu Romário!</div>
    <div style="font:400 14px/1.4 system-ui;margin-top:6px">O <b>K9 FC</b> quer o seu craque. Ele vai pro leilão da próxima noite.</div></div>
  ${branco(faixa('O que pode acontecer') + lin('💰 Alguém leva', '<span style="color:' + GREEN + '">o dinheiro vem pra você</span>') + lin('🛡️ Você dá o maior lance', '<span style="color:' + GREEN + '">ele fica</span>') + lin('🤷 Ninguém dá lance', '<span style="color:' + GREEN + '">volta pra você de graça</span>'))}
  ${nota('"Vai deixar levarem o Baixinho?" — a zoeira sai sozinha no chat da liga.')}`)

// 4 — no leilão
const leilao = cel('4 · No leilão', '🔨 Lote especial: sondado', 'abre o leilão da noite', `
  <div style="background:linear-gradient(160deg,#1a1508,#0C0C0C);border:3px solid ${GOLD};border-radius:12px;padding:12px;color:#fff">
    <div style="display:flex;gap:6px">${tag('🕵️ Sondado', RED)}${tag('dono: Fabulous EC', '#333', GOLD)}</div>
    <div style="font:700 28px Oswald;margin-top:8px">ROMÁRIO</div><div style="font:500 13px system-ui;opacity:.8">Vasco · 2000 · 👑 Lenda</div>
    <div style="display:flex;justify-content:space-between;margin-top:10px;font:700 15px Oswald"><span>Lance inicial</span><span style="color:${GOLD}">38 🪙</span></div></div>
  <div style="height:10px"></div>
  ${branco(faixa('Envelopes da sala') + lin('K9 FC (quem sondou)', '<b>45 🪙</b>') + lin('Fabulous EC (o dono)', '<b>52 🪙</b>', 'background:#EAF5EE') + lin('Corneta', '<b>40 🪙</b>'))}
  <div style="margin-top:10px;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:12px;padding:10px;text-align:center;font:700 17px Oswald;text-transform:uppercase">🛡️ Fabulous EC segurou o Romário por 52</div>
  ${nota('Mesmo envelope cego de sempre. Se outro ganhasse, os 52 iriam pro caixa do Fabulous.')}`)

// 5 — o draft com a vez pulada
const draft = cel('5 · O draft', '📋 Quem sondou não escolhe', 'a fila anda sem ele', `
  ${branco(faixa('Ordem do draft · a tabela manda') + lin('1º Butinas FC', `<span style="color:${GREEN}">✓ escolheu 🔒</span>`) + lin('2º Fabulous EC', `<span style="color:${GREEN}">✓ escolheu 🔒</span>`) + lin('3º K9 FC', `<span style="color:${PURPLE}">🕵️ sondou · sem draft</span>`, 'background:#F1ECFF') + lin('4º Tocaia SC', `<span style="color:${RED}">⏱ na vez</span>`, 'background:#FFF3C4'))}
  ${nota('As escolhas ficam em segredo e viram ao vivo no 🎬 Show do Draft, na abertura da próxima noite.')}`)

// 6 — o elenco de 22
const elenco = cel('6 · Elenco de até 22', '👕 K9 FC · 22/22', 'cheio: pra trazer, alguém sai', `
  ${branco(faixa('Seu elenco está cheio (22/22)', RED, '#fff') + `<div style="padding:8px 10px;font:500 13px/1.45 system-ui">Pra entrar no leilão ou no draft você precisa de uma vaga. Escolha quem vai <b>pras sobras</b>:</div>` +
    [['Léo Lima', 'MEI', 6], ['Adryan', 'MEI', 4], ['Perdigão', 'ZAG', 3]].map(([n, p, v]) => lin(`${n} <span style="color:#888;font-weight:400">${p}</span>`, `<span style="font:700 12px Oswald;border:2px solid ${INK};border-radius:7px;padding:2px 7px">mandar pras sobras</span>`)).join(''))}
  ${nota('Quem vai pras sobras fica livre: pode voltar no leilão ou no draft de qualquer um.')}`)

const linha = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;font:700 17px Oswald;text-transform:uppercase;flex-wrap:wrap">
  ${['🏁 Fim da temporada', '📋 Draft OU 🕵️ Sondar', '🎬 Show do Draft', '🔨 Leilão (sondados primeiro)', '⚽ Temporada nova'].map(x => `<span style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:8px 12px;box-shadow:3px 3px 0 ${INK}">${x}</span>`).join('<span>➜</span>')}</div>`

const html = `<html><head><style>${F}body{margin:0;background:${CREME};color:${INK};padding:26px;width:1180px;font-family:Oswald}
.grade{display:grid;grid-template-columns:repeat(3,360px);gap:22px 20px}
.cel{background:#141210;border:3px solid ${INK};border-radius:22px;padding:14px;width:360px;box-sizing:border-box;box-shadow:5px 5px 0 #000}
.leg{font:700 18px Oswald;text-transform:uppercase;margin-bottom:8px}
.cab{border:2px solid #333;border-radius:12px;padding:8px 12px;margin-bottom:10px;color:#fff}.cab b{display:block;font:700 16px Oswald;text-transform:uppercase}.cab small{font:400 12px system-ui;opacity:.75}</style></head><body>
<div style="font:700 32px Oswald;text-transform:uppercase">📋🕵️ Minhas Ligas · draft, sondar e elenco de 22</div>
<div style="font:400 16px Oswald;color:#444;margin:4px 0 18px">No fim de cada temporada, cada um faz UMA jogada: pega um livre no draft OU sonda o jogador de um amigo.</div>
<div class="grade">${escolha}${sondar}${aviso}${leilao}${draft}${elenco}</div>
${linha}</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1232, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
