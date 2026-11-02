// 🏆 MOCKUP v2 (01/11): MINHAS LIGAS EM PIRÂMIDE, CADA UM NO SEU HORÁRIO.
// Diego: *"reservas, 22… o leilão todos participariam juntos… escolheriam se teria leilão ou seguir só com draft…
// todos estarem prontos… cada um tem sua vida… o cara escolhe e dá o ok… cada um vai ver como foi a rodada quando entrar
// novamente… o suspense da convocação do draft igual ao da Liga Draft"*.
//   node scripts/mockup-ligas-piramide-v2.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? 'mockup-ligas-piramide-v2.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const cel = (n, titulo, sub, corpo) => `<div><div class="leg">${n}</div><div class="cel"><div class="cab"><b>${titulo}</b><small>${sub}</small></div>${corpo}</div></div>`
const btn = (t, cor = GOLD, ink = INK) => `<div style="margin-top:10px;background:${cor};color:${ink};border:3px solid ${INK};border-radius:12px;padding:11px;text-align:center;font:700 17px Oswald;text-transform:uppercase;box-shadow:3px 3px 0 #000">${t}</div>`
const branco = (h) => `<div style="background:#fff;border:3px solid ${INK};border-radius:12px;overflow:hidden;color:${INK}">${h}</div>`
const faixa = (t, cor = INK, ink = GOLD) => `<div style="background:${cor};color:${ink};font:700 13px Oswald;padding:6px 10px;letter-spacing:.06em;text-transform:uppercase">${t}</div>`
const lin = (a, b, c = '', fundo = '') => `<div style="display:flex;gap:8px;align-items:center;padding:6px 10px;font:600 14px Oswald;border-top:1px solid #eee;${fundo}"><span style="flex:1">${a}</span><span style="color:#777;font-weight:400">${b}</span>${c}</div>`

// 1 — a casa da liga: cada um dá o OK no seu horário
const casa = cel('1 · A casa da liga', '🏆 Liga da Firma · Série B', 'Rodada 7 · cada um no seu horário', `
  ${branco(faixa('⏳ Esperando o OK de todo mundo · 5 de 8') +
    [['Chelsão', '✅ pronto'], ['Corneta', '✅ pronto'], ['Rubão FC', '✅ pronto'], ['Gui', '✅ pronto'], ['K9 FC (você)', '⏳ falta escalar', true], ['Noronha FC', '⏳ falta escalar'], ['Spfcb', '⏳ falta escalar'], ['Zoides FC', '✅ pronto']]
      .map(([t, s, eu]) => lin(t, '', `<span style="color:${s.startsWith('✅') ? GREEN : RED}">${s}</span>`, eu ? 'background:#FFF3C4' : '')).join(''))}
  ${btn('👕 Escalar e dar OK')}
  <p class="nota">Quando o último der OK, a rodada roda sozinha. Ninguém precisa estar online junto. Prazo da rodada: 24 h — quem não der OK joga com o time da rodada passada.</p>`)

// 2 — elenco de 22
const nomes = ['Rogério Ceni', 'Cafu', 'Lúcio', 'Juan', 'Roberto Carlos', 'Kaká', 'Zé Roberto', 'Juninho P.', 'Romário', 'Adriano', 'Robinho']
const res = ['Marcos', 'Belletti', 'Edmílson', 'Gilberto Silva', 'Denílson', 'Edmundo', 'Luís Fabiano', 'Elano', 'Fred', 'Dida', 'Felipe Melo']
const elenco = cel('2 · Elenco de 22', '👕 K9 FC · Rodada 7', '11 titulares + 11 reservas', `
  ${branco(faixa('Titulares (11)') + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 8px;padding:6px 10px;font:600 13px Oswald">${nomes.map(n => `<span style="padding:2px 0">${n}</span>`).join('')}</div>`)}
  <div style="height:8px"></div>
  ${branco(faixa('Reservas (11)', '#2a2622', CREME) + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 8px;padding:6px 10px;font:600 13px Oswald;color:#555">${res.map(n => `<span style="padding:2px 0">${n}</span>`).join('')}</div>`)}
  ${btn('✅ Dar OK pra rodada 7', GREEN, '#fff')}
  <p class="nota">Com 22 dá pra rodar o time: cansaço, suspensão e lesão têm quem entrar.</p>`)

// 3 — voltou: a rodada rolou enquanto você não estava
const voltou = cel('3 · Quando você volta', '📺 Rodada 7 rolou enquanto você estava fora', 'nada de spoiler: você assiste do jeito de sempre', `
  <div style="background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:12px;padding:14px;text-align:center">
    <div style="font:700 22px Oswald;text-transform:uppercase">A rodada 7 já foi jogada</div>
    <div style="font:400 13px system-ui;opacity:.9;margin-top:4px">O placar ainda está escondido pra você.</div></div>
  ${btn('▶ Assistir a rodada 7')}
  ${btn('⏭ Só ver o resultado', '#fff')}
  <div style="height:10px"></div>
  ${branco(faixa('🔔 Enquanto você estava fora') + lin('📋 Draft: Butinas FC pegou…', '', '<span style="color:' + PURPLE + '">ver com suspense ›</span>') + lin('💬 3 mensagens no chat da liga', '') + lin('⏳ Rodada 8 já está aberta', '', '<span style="color:' + RED + '">dar OK</span>'))}`)

// 4 — fim de temporada: a turma decide leilão ou só draft
const decide = cel('4 · Fim de temporada', '🗳️ Como vai ser a próxima temporada?', 'cada um vota quando entrar · a maioria decide', `
  ${branco(faixa('💰 Prêmio já caiu no caixa') + lin('Você ficou em 3º na Série B', '', '<b>+18 🪙</b>') + lin('⬆️ Sobem pra A', 'Chelsão · Corneta') + lin('⬇️ Caem pra C', 'Spfcb · Zoides FC'))}
  <div style="height:10px"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div style="background:${GOLD};border:3px solid ${INK};border-radius:12px;padding:10px;text-align:center;box-shadow:3px 3px 0 #000"><div style="font:700 16px Oswald;text-transform:uppercase">🔨 Leilão + 📋 Draft</div><div style="font:400 11.5px system-ui;margin-top:4px">leilão com a liga inteira junta, num dia marcado</div><div style="font:700 15px Oswald;margin-top:6px">5 votos</div></div>
    <div style="background:${CREME};border:3px solid ${INK};border-radius:12px;padding:10px;text-align:center"><div style="font:700 16px Oswald;text-transform:uppercase">📋 Só Draft</div><div style="font:400 11.5px system-ui;margin-top:4px">cada um escolhe no seu horário, sem leilão</div><div style="font:700 15px Oswald;margin-top:6px">3 votos</div></div>
  </div>
  <div style="margin-top:10px;background:#fff;border:3px solid ${INK};border-radius:12px;padding:9px 11px;font:500 13px/1.4 system-ui;color:${INK}"><b style="font:700 14px Oswald;text-transform:uppercase">🔨 Leilão marcado: sábado, 21h</b><br>Todas as séries no MESMO leilão (o dono da liga marca o dia). Quem não puder ir, o robô dá os lances por ele.</div>`)

// 5 — o draft no seu horário, com o suspense da Liga Draft
const draft = cel('5 · O draft no seu horário', '📋 Sua vez · 3ª escolha', 'o mesmo suspense da Liga Draft', `
  ${branco(faixa('Ordem do draft · a tabela manda') + [['1º', 'Butinas FC', '✓ Neymar'], ['2º', 'Fabulous EC', '✓ Romário'], ['3º', 'K9 FC (você)', '⏱ NA VEZ', true], ['4º', 'Tocaia SC', '…']].map(([p, t, s, eu]) => lin(`${p} ${t}`, '', `<span style="color:${s.startsWith('✓') ? GREEN : RED}">${s}</span>`, eu ? 'background:#FFF3C4' : '')).join(''))}
  <div style="margin-top:10px;background:${GOLD};border:3px solid ${INK};border-radius:12px;padding:9px 11px;font:500 13px system-ui;color:${INK}">⏱ <b>Você tem até amanhã, 18h.</b> Passou do prazo, o jogo pega o melhor livre pra você.</div>
  ${btn('🔎 Escolher meu jogador')}
  <div style="margin-top:10px;border:3px dashed ${GOLD};border-radius:12px;padding:12px;text-align:center;background:#111;color:${GOLD};font:700 14px Oswald">Quem escolhe depois de você vê a SUA carta virar com suspense quando entrar: posição → categoria → país → a carta.</div>`)

const linha = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;font:700 18px Oswald;text-transform:uppercase;flex-wrap:wrap">
  ${['👕 Escala e dá OK', '⚽ Rodada roda sozinha', '📺 Cada um assiste quando entrar', '🏁 Fim: prêmio + sobe/cai', '🗳️ Vota: leilão+draft ou só draft'].map(x => `<span style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:8px 12px;box-shadow:3px 3px 0 ${INK}">${x}</span>`).join('<span>➜</span>')}</div>`

const html = `<html><head><style>${F}body{margin:0;background:${CREME};color:${INK};padding:26px;width:1940px;font-family:Oswald}
.cel{background:#141210;border:3px solid ${INK};border-radius:22px;padding:14px;width:360px;box-sizing:border-box;box-shadow:5px 5px 0 #000}
.leg{font:700 18px Oswald;text-transform:uppercase;margin-bottom:8px}
.cab{border:2px solid #333;border-radius:12px;padding:8px 12px;margin-bottom:10px;color:#fff}.cab b{display:block;font:700 16px Oswald;text-transform:uppercase}.cab small{font:400 12px system-ui;opacity:.75}
.nota{color:#ddd;font:400 12.5px/1.4 system-ui;margin:10px 2px 0}</style></head><body>
<div style="font:700 34px Oswald;text-transform:uppercase">🏆 Minhas Ligas em pirâmide · cada um no seu horário</div>
<div style="font:400 16px Oswald;color:#444;margin:4px 0 18px">Ninguém precisa estar online junto: cada um escala e dá OK; a rodada roda quando todos deram OK; quem volta assiste a rodada com suspense.</div>
<div style="display:flex;gap:16px;align-items:flex-start">${casa}${elenco}${voltou}${decide}${draft}</div>
${linha}</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1992, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
