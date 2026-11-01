// 📋✋ MOCKUP (01/11): MINHAS LIGAS + DRAFT — a sequência inteira, com as regras fechadas com o Diego.
//  T1 = leilão normal de 11. Da T2: ✋ pronto → 📋 draft (45 s por vez, escolher OU sondar) → 🔨 leilão (sondados + à venda,
//  quem sondou pode IGUALAR) → 👕 escalação 45 s → ⚽ liga. O dono SEMPRE decide; ausente/sem pronto = perde a vez.
//   node scripts/mockup-ligas-draft-fluxo.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? 'mockup-ligas-draft-fluxo.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const cel = (n, titulo, sub, corpo) => `<div><div class="leg">${n}</div><div class="cel"><div class="cab"><b>${titulo}</b><small>${sub}</small></div>${corpo}</div></div>`
const branco = h => `<div style="background:#fff;border:3px solid ${INK};border-radius:12px;overflow:hidden;color:${INK}">${h}</div>`
const faixa = (t, cor = INK, ink = GOLD) => `<div style="background:${cor};color:${ink};font:700 13px Oswald;padding:6px 10px;letter-spacing:.06em;text-transform:uppercase">${t}</div>`
const lin = (a, c = '', fundo = '') => `<div style="display:flex;gap:8px;align-items:center;padding:6px 10px;font:600 14px Oswald;border-top:1px solid #eee;${fundo}"><span style="flex:1">${a}</span>${c}</div>`
const btn = (t, cor = GOLD, ink = INK) => `<div style="margin-top:10px;background:${cor};color:${ink};border:3px solid ${INK};border-radius:12px;padding:11px;text-align:center;font:700 16px Oswald;text-transform:uppercase;box-shadow:3px 3px 0 #000">${t}</div>`
const btn2 = (a, b) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${a}${b}</div>`
const nota = t => `<p style="color:#ddd;font:400 12.5px/1.4 system-ui;margin:10px 2px 0">${t}</p>`
const tag = (t, bg, ink = '#fff') => `<span style="font:700 11px Oswald;background:${bg};color:${ink};border-radius:6px;padding:2px 6px;text-transform:uppercase">${t}</span>`
const ok = `<span style="color:${GREEN}">✅ pronto</span>`, esp = `<span style="color:${RED}">⏳ ainda não</span>`
const relogio = (s, cor = GOLD) => `<div style="display:flex;align-items:center;justify-content:center;gap:10px;background:#111;border:3px solid ${cor};border-radius:12px;padding:8px;color:${cor};font:700 30px Oswald">⏱ ${s}<span style="font:600 13px Oswald;color:#ddd">SEGUNDOS</span></div>`

// 1 — fim de temporada: a liga para sozinha
const fim = cel('1 · Fim da temporada', '🏁 Temporada 1 encerrada', 'a liga para aqui · lugar certo pra sair', `
  ${branco(faixa('Tabela final · moedas pela colocação') + lin('🥇 Butinas FC', '<b>+40 🪙</b>') + lin('🥈 Fabulous EC', '<b>+32 🪙</b>') + lin('🥉 K9 FC', '<b>+26 🪙</b>') + lin('4º Tocaia SC', '<b>+20 🪙</b>'))}
  <div style="margin-top:10px;background:#fff;border:3px solid ${INK};border-radius:12px;padding:9px 11px;font:500 13px/1.45 system-ui;color:${INK}">💾 Tudo salvo. Pode sair e voltar outro dia — a liga espera aqui.</div>
  ${btn('▶ Chamar a galera pro draft')}
  ${nota('Só o dono vê esse botão.')}`)

// 2 — estou pronto (dono vê)
const pronto = cel('2 · Estou pronto', '✋ Quem está pronto pro draft?', 'o dono vê a lista e decide', `
  ${branco(faixa('3 de 4 prontos') + lin('👑 Butinas FC (você, dono)', ok) + lin('Fabulous EC', ok) + lin('K9 FC', ok) + lin('Tocaia SC', esp, 'background:#FFF3C4'))}
  ${btn('✋ Estou pronto', GREEN, '#fff')}
  ${btn('▶ Começar o draft', GOLD)}
  ${nota('O dono pode começar mesmo com gente faltando. O mesmo ✋ aparece antes do leilão e antes da liga.')}`)

// 3 — a vez de alguém
const vez = cel('3 · A vez no draft', '📋 Vez do K9 FC · 3ª escolha', 'só corre o relógio depois do pronto', `
  ${branco(faixa('Ordem · o campeão escolhe primeiro') + lin('1º Butinas FC', `<span style="color:${GREEN}">✓ escolheu</span>`) + lin('2º Fabulous EC', `<span style="color:${GREEN}">✓ escolheu</span>`) + lin('3º K9 FC', `<span style="color:${RED}">⏳ na vez</span>`, 'background:#FFF3C4') + lin('4º Tocaia SC', '<span style="color:#888">depois</span>'))}
  <div style="margin-top:10px;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:12px;padding:10px;text-align:center;font:700 16px Oswald;text-transform:uppercase">K9 FC, é a sua vez!</div>
  ${btn('✋ Pronto, quero escolher', GREEN, '#fff')}
  <div style="margin-top:12px;border-top:2px dashed #444;padding-top:10px;color:#ddd;font:600 12px Oswald;text-transform:uppercase;letter-spacing:.05em">O que o dono vê se ele não der pronto:</div>
  ${btn2(btn('⏳ Esperar', '#fff'), btn('⏭ Pular a vez', RED, '#fff'))}`)

// 4 — escolhendo: lista com pesquisa
const lista = cel('4 · Escolhendo', '🔎 Todos os jogadores livres', 'os 3 baralhos · 45 s', `
  ${relogio(38)}
  <div style="margin-top:10px;background:#fff;border:3px solid ${INK};border-radius:12px;padding:8px 10px;font:500 14px system-ui;color:#888">🔎 Pesquisar jogador…</div>
  <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">${['Todas', 'GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].map((p, i) => tag(p, i === 5 ? GOLD : '#333', i === 5 ? INK : '#fff')).join('')}<span style="width:6px"></span>${['👑', '⭐', '🌱'].map(p => tag(p, '#333')).join('')}</div>
  <div style="height:8px"></div>
  ${branco([['👑 Ronaldo', 'Real Madrid 2003'], ['👑 Batistuta', 'Fiorentina 1996'], ['⭐ Jardel', 'Grêmio 1996'], ['⭐ Ademir', 'Vasco 1949']].map(([n, c], i) => lin(`${n} <span style="color:#888;font-weight:400">${c}</span>`, `<span style="font:700 12px Oswald;border:2px solid ${INK};border-radius:7px;padding:2px 8px;background:${i === 0 ? GOLD : '#fff'}">pegar</span>`)).join(''))}
  ${btn('🕵️ Prefiro sondar um amigo', CREME)}
  ${nota('Quem já está em algum time da liga não aparece. Acabou o tempo = perde a vez.')}`)

// 5 — o suspense
const show = cel('5 · Todo mundo vê', '🎬 K9 FC escolheu…', 'o suspense da Liga Draft · ~8 s', `
  <div style="border:3px solid ${GOLD};border-radius:12px;padding:14px;background:#111;color:#fff;text-align:center">
    <div style="font:600 13px Oswald;color:${GOLD};letter-spacing:.08em">AS PISTAS, DE 2 EM 2 SEGUNDOS</div>
    <div style="display:flex;justify-content:center;gap:6px;margin-top:10px;flex-wrap:wrap">${['⚽ ATACANTE', '👑 LENDA', '🇧🇷 BRASIL · ANOS 2000', '🃏 VIROU!'].map(p => `<span style="font:700 13px Oswald;background:${GOLD};color:${INK};border-radius:7px;padding:3px 8px">${p}</span>`).join('')}</div>
    <div style="font:700 36px Oswald;margin-top:12px">RONALDO</div><div style="font:500 13px system-ui;opacity:.8">Real Madrid · 2003 · chega valendo 10 🪙</div></div>
  ${nota('Logo depois já começa a vez do próximo. Draft de 4 pessoas: uns 3 minutos e meio no máximo.')}`)

// 6 — leilão dos sondados + à venda
const leilao = cel('6 · Leilão', '🔨 Sondados + à venda', 'depois do draft · só se tiver lote', `
  <div style="background:linear-gradient(160deg,#1a1508,#0C0C0C);border:3px solid ${GOLD};border-radius:12px;padding:12px;color:#fff">
    <div style="display:flex;gap:6px">${tag('🕵️ Sondado pelo Tocaia', RED)}${tag('dono: Fabulous', '#333', GOLD)}</div>
    <div style="font:700 26px Oswald;margin-top:8px">ROMÁRIO</div><div style="font:500 13px system-ui;opacity:.8">Vasco · 2000 · lance inicial 38 🪙</div></div>
  <div style="height:10px"></div>
  ${branco(faixa('Martelo') + lin('Butinas FC', '<b>52 🪙</b> maior lance') + lin('Tocaia SC (sondou)', '<b>45 🪙</b>'))}
  <div style="margin-top:10px;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:12px;padding:10px;text-align:center"><div style="font:700 15px Oswald;text-transform:uppercase">⚡ Tocaia: igualar 52 e levar?</div><div style="font:400 12px system-ui;margin-top:3px">quem sondou tem esse direito</div></div>
  ${btn2(btn('✅ Igualar', GREEN, '#fff'), btn('Deixar', '#fff'))}
  ${nota('Vendeu → o dinheiro vai pro Fabulous. Se o maior lance fosse do dono, ele segurava. Ninguém lançou → volta pro dono.')}`)

// 7 — elenco cheio
const cheio = cel('7 · Elenco cheio', '👕 22/22 · chegou o Ronaldo', 'quem sai?', `
  ${relogio(30, RED)}
  <div style="height:10px"></div>
  ${branco(faixa('Escolha quem vai embora', RED, '#fff') + [['Léo Lima', 'MEI · reserva', 6], ['Adryan', 'MEI · reserva', 4], ['Perdigão', 'ZAG · reserva', 3]].map(([n, p, v]) => lin(`${n} <span style="color:#888;font-weight:400">${p} · ${v} 🪙</span>`, `<span style="font:700 12px Oswald;border:2px solid ${INK};border-radius:7px;padding:2px 7px">sai</span>`)).join(''))}
  ${nota('Quem sai fica LIVRE e pode ir pro draft de qualquer um. Não escolheu em 30 s = sai o reserva de menor valor (titular nunca).')}`)

// 8 — escalação e liga
const escala = cel('8 · Escalação → liga', '⚽ Temporada 2', 'último passo antes da bola rolar', `
  ${branco(faixa('✋ Prontos pra escalar · 4 de 4') + lin('👕 Escalação', '<b>45 s</b>') + lin('Ausente', '<span style="color:#666">joga com a última escalação</span>'))}
  <div style="height:10px"></div>
  ${relogio(45)}
  ${btn('⚽ Começar a temporada 2', GREEN, '#fff')}
  <div style="margin-top:12px;background:${CREME};border:3px solid ${INK};border-radius:12px;padding:9px 11px;font:500 12.5px/1.45 system-ui;color:${INK}"><b style="font:700 14px Oswald;text-transform:uppercase">⏸ O dono saiu no meio?</b><br>Tudo congela onde estava. Quando ele volta, nada recomeça sozinho: ele aperta ▶ Continuar.</div>`)

const linha = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;font:700 17px Oswald;text-transform:uppercase;flex-wrap:wrap">
  ${['🏁 Fim da temporada', '✋ Prontos', '📋 Draft (45 s)', '🔨 Leilão', '👕 Escalação (45 s)', '⚽ Liga'].map(x => `<span style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:8px 12px;box-shadow:3px 3px 0 ${INK}">${x}</span>`).join('<span>➜</span>')}</div>`

const html = `<html><head><style>${F}body{margin:0;background:${CREME};color:${INK};padding:26px;width:1560px;font-family:Oswald}
.grade{display:grid;grid-template-columns:repeat(4,360px);gap:22px 20px}
.cel{background:#141210;border:3px solid ${INK};border-radius:22px;padding:14px;width:360px;box-sizing:border-box;box-shadow:5px 5px 0 #000}
.leg{font:700 18px Oswald;text-transform:uppercase;margin-bottom:8px}
.cab{border:2px solid #333;border-radius:12px;padding:8px 12px;margin-bottom:10px;color:#fff}.cab b{display:block;font:700 16px Oswald;text-transform:uppercase}.cab small{font:400 12px system-ui;opacity:.75}</style></head><body>
<div style="font:700 32px Oswald;text-transform:uppercase">📋 Minhas Ligas + Draft · a sequência inteira</div>
<div style="font:400 16px Oswald;color:#444;margin:4px 0 18px">A 1ª temporada é o leilão de sempre. Da 2ª em diante: prontos → draft → leilão → escalação → liga. O dono sempre decide.</div>
<div class="grade">${fim}${pronto}${vez}${lista}${show}${leilao}${cheio}${escala}</div>
${linha}</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1612, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
