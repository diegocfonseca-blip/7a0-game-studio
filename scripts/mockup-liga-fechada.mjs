// ─── 🏆 MOCKUP: LIGA FECHADA (sala marcada com os amigos) ────────────────────
//
// Desenho pedido pelo Diego em 19/08, com as regras ditadas por ele:
//   1. É SEMPRE A MESMA SALA — é isso que faz o troféu acumular temporada após
//      temporada. Sala nova a cada encontro perderia o histórico.
//   2. Só entra quem é 👑 LENDA ou dono de clube batizado. Quem não é NEM VÊ a
//      sala — fica bloqueada. (Como todo batismo já nasce ouro pela regra de
//      17/08, a conta é uma só: tier = ouro.)
//   3. Quem decide começar é o HOST, igual às salas de hoje: com 2 já dá pra
//      abrir; ninguém fica travado esperando quem não veio.
//   4. Liga fechada é SEM BOT por natureza, mas na hora de ligar ela o host
//      escolhe se aquela sala tem bot ou não — e pode trocar depois, na mesma
//      sala, junto do horário.
//
// ⚠️ NADA do que existe hoje é tocado: o motor, o leilão, a temporada e o fim de
// jogo são os mesmos. Tudo aqui é UM CAMPO A MAIS na sala + telas novas.
//
//   node scripts/mockup-liga-fechada.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'liga-fechada.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'

// peças da casa
const btn = (txt, bg = '#fff', cor = INK, extra = '') =>
  `<div style="border:3px solid ${INK};border-radius:12px;background:${bg};color:${cor};box-shadow:3px 3px 0 ${INK};
     font-family:Oswald,sans-serif;font-weight:700;font-size:15px;text-align:center;padding:10px 12px;${extra}">${txt}</div>`
const seg = (opts, sel) => `<div style="display:flex;gap:0;border:3px solid ${INK};border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 ${INK}">
  ${opts.map((o, i) => `<div style="flex:1;padding:9px 6px;text-align:center;font-family:Oswald,sans-serif;font-weight:700;font-size:13.5px;
    background:${i === sel ? GOLD : '#fff'};color:${INK};${i ? `border-left:3px solid ${INK}` : ''}">${o}</div>`).join('')}</div>`
const caixa = (inner, bg = '#fff', pad = '14px 16px') =>
  `<div style="background:${bg};border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:${pad}">${inner}</div>`
const rot = t => `<div style="font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.09em;opacity:.55;margin:0 0 7px">${t}</div>`
const h2 = (n, t, s = '') => `<h2 style="font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:23px;margin:34px 0 12px;display:flex;align-items:baseline;gap:10px">
  <span style="background:${INK};color:#fff;border-radius:8px;padding:2px 10px;font-size:17px">${n}</span>${t}
  ${s ? `<small style="font-family:system-ui;font-weight:600;font-size:13px;text-transform:none;opacity:.55">${s}</small>` : ''}</h2>`
const NOVO = `<span style="background:${GREEN};color:#fff;font-family:Oswald,sans-serif;font-weight:700;font-size:10px;border-radius:6px;padding:2px 7px;letter-spacing:.06em">NOVO</span>`
const JA = `<span style="background:rgba(12,12,12,.12);color:rgba(12,12,12,.6);font-family:Oswald,sans-serif;font-weight:700;font-size:10px;border-radius:6px;padding:2px 7px;letter-spacing:.06em">JÁ EXISTE</span>`

// ── 1 · criar a sala ──────────────────────────────────────────────────────────
const painel1 = `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
  ${caixa(`
    ${rot(`Escolha da sala ${JA}`)}
    ${seg(['🌍 Aberta', '🏆 Liga Fechada'], 1)}
    <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.62);line-height:1.4;margin:9px 0 0">
      Isto <b>já está no jogo hoje</b> e já é benefício de quem é 👑 Lenda — quem não é, nem vê a opção.</p>
  `, '#F8F4E8')}
  ${caixa(`
    ${rot(`O que abre ao ligar a Liga Fechada ${NOVO}`)}
    <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;margin:0 0 6px">📅 Quando vocês jogam</p>
    <div style="display:flex;gap:8px">
      <div style="flex:1.4">${btn('Sábado, 23 de agosto', '#fff')}</div>
      <div style="flex:.8">${btn('21:00', '#fff')}</div>
    </div>
    <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;margin:14px 0 6px">🤖 Bots na tabela</p>
    ${seg(['Sem bots — só vocês', 'Com bots até 20'], 0)}
    <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.62);line-height:1.4;margin:9px 0 0">
      Sem bots, a liga tem o tamanho de vocês (ida e volta). <b>Dá pra trocar depois</b>, na mesma sala.</p>
  `)}
</div>`

// ── 2 · como aparece na lista ─────────────────────────────────────────────────
const painel2 = `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
  ${caixa(`
    ${rot('Pra quem é 👑 Lenda / dono de clube')}
    <div style="display:flex;align-items:center;gap:10px">
      <div style="flex:1;min-width:0">
        <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;margin:0">🏆 Resenha dos Cria</p>
        <p style="font-size:12.5px;font-weight:700;color:rgba(12,12,12,.6);margin:3px 0 0">👥 5 técnicos · KX7M2A · liga fechada · sem bots</p>
        <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:13px;color:${GREEN};margin:5px 0 0">
          📅 SÁBADO, 21:00 · faltam 2 dias</p>
      </div>
      <div style="width:112px">${btn('Entrar', GREEN, '#fff')}</div>
    </div>
  `)}
  ${caixa(`
    ${rot('Pra quem NÃO é')}
    <div style="display:flex;align-items:center;gap:10px;opacity:.9">
      <div style="flex:1;min-width:0">
        <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;margin:0;color:rgba(12,12,12,.45)">🔒 Liga Fechada</p>
        <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.55);line-height:1.4;margin:5px 0 0">
          Esta sala é de uma liga fechada. Só entra quem é <b>👑 Lenda</b> ou <b>dono de clube batizado</b>.</p>
      </div>
      <div style="width:112px">${btn('Como virar', '#fff', PURPLE)}</div>
    </div>
    <p style="font-size:11.5px;font-weight:600;color:rgba(12,12,12,.45);line-height:1.4;margin:10px 0 0">
      Ela nem aparece na lista normal — só quem tem o código ou é convidado chega aqui.</p>
  `, '#F1EDE0')}
</div>`

// ── 3 · dentro da sala (o coração) ────────────────────────────────────────────
const linhaTrofeu = (t, campeao, artilheiro, mico) => `
  <tr>
    <td style="padding:7px 6px;font-family:Oswald,sans-serif;font-weight:700;font-size:13px;opacity:.5">T${t}</td>
    <td style="padding:7px 6px;font-family:Oswald,sans-serif;font-weight:700;font-size:14px">🏆 ${campeao}</td>
    <td style="padding:7px 6px;font-size:12.5px;font-weight:600">⚽ ${artilheiro}</td>
    <td style="padding:7px 6px;font-size:12.5px;font-weight:600;opacity:.6">🤡 ${mico}</td>
  </tr>`

const painel3 = `
${caixa(`
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
    <div>
      <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:24px;margin:0">🏆 Resenha dos Cria</p>
      <p style="font-size:13px;font-weight:700;color:rgba(12,12,12,.6);margin:3px 0 0">código KX7M2A · sem bots · liga fechada</p>
    </div>
    <div style="background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:7px 13px;text-align:center">
      <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:11px;margin:0;opacity:.85">PRÓXIMO JOGO</p>
      <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:17px;margin:1px 0 0">SÁB · 21:00</p>
    </div>
  </div>

  <div style="height:3px;background:rgba(12,12,12,.1);margin:15px 0"></div>

  <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:16px;margin:0 0 4px">🏆 Sala de troféus da liga ${NOVO}</p>
  <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.55);margin:0 0 8px">
    Hoje isto só aparece no fim do jogo. Aqui ele fica <b>na espera</b> — a galera chega e já vê quem é o dono da liga.</p>
  ${caixa(`<table style="width:100%;border-collapse:collapse">
      ${linhaTrofeu(1, 'Nata de SP', 'Gabigol · 24', 'Tôka10')}
      ${linhaTrofeu(2, 'Skyy FC', 'Romário · 31', 'Nata de SP')}
      ${linhaTrofeu(3, 'Nata de SP', 'Zico · 27', 'Marreco FC')}
    </table>`, '#FFF9E6', '6px 10px')}

  <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:16px;margin-top:16px">
    <div>
      <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:15px;margin:0 0 7px">👥 Quem já chegou · 3 de 5</p>
      ${['Nata de SP 👑', 'Skyy FC 👑', 'Tôka10 👑'].map(n => `
        <div style="display:flex;align-items:center;gap:8px;border:3px solid ${INK};border-radius:12px;background:#fff;padding:7px 11px;margin-bottom:7px;box-shadow:2px 2px 0 ${INK}">
          <span style="width:9px;height:9px;border-radius:50%;background:${GREEN}"></span>
          <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:14.5px">${n}</span></div>`).join('')}
      ${['Marreco FC', 'Murriz FC'].map(n => `
        <div style="display:flex;align-items:center;gap:8px;border:3px dashed rgba(12,12,12,.3);border-radius:12px;padding:7px 11px;margin-bottom:7px">
          <span style="width:9px;height:9px;border-radius:50%;background:rgba(12,12,12,.2)"></span>
          <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:14.5px;opacity:.45">${n} · ainda não chegou</span></div>`).join('')}
    </div>
    <div>
      <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:15px;margin:0 0 7px">🎛️ Só o dono da liga vê ${NOVO}</p>
      <div style="display:grid;gap:9px">
        ${btn('📅 Mudar o dia e a hora', '#fff')}
        ${btn('🤖 Trocar: com bots / sem bots', '#fff')}
        ${btn('🗑️ Excluir a liga', '#fff', RED)}
      </div>
      <div style="height:12px"></div>
      ${btn('🔨 ABRIR O PREGÃO', GREEN, '#fff', 'font-size:17px')}
      <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.6);line-height:1.4;margin:8px 0 0">
        O host começa <b>quando quiser</b>, igual às salas de hoje — com 2 já dá. Ninguém fica travado esperando quem não veio.</p>
    </div>
  </div>
`)}`

// ── 4 · o que muda e o que não muda ───────────────────────────────────────────
const painel4 = caixa(`
  <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:16px;margin:0 0 10px;text-transform:uppercase">O que muda — e o que NÃO muda</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;font-size:13.5px;font-weight:600;line-height:1.45">
    <p style="margin:0">✅ <b>Metade já existe.</b> A Liga Fechada e a trava do 👑 Lenda já estão no jogo, e a sala de troféus já guarda campeão, artilheiro e mico temporada a temporada.</p>
    <p style="margin:0">🆕 <b>O que entra:</b> marcar dia e hora, a lista "Minhas Ligas", os troféus na espera, e os botões de editar/excluir.</p>
    <p style="margin:0">🔒 <b>O motor não é tocado.</b> Mesmo leilão, mesma temporada, mesmo fim de jogo. A liga é uma sala normal com <b>um campo a mais</b>.</p>
    <p style="margin:0">🌍 <b>Sala comum não sente nada.</b> Ela não lê nenhum campo novo — continua exatamente como está hoje.</p>
    <p style="margin:0">🗓️ <b>É sempre a MESMA sala.</b> É isso que faz o troféu acumular. Sala nova a cada semana zeraria o histórico.</p>
    <p style="margin:0">↩️ <b>Dá pra voltar atrás</b> por pedaço: cada peça é um commit isolado, e nenhuma sala existente é afetada.</p>
  </div>
  <p style="font-size:12.5px;font-weight:700;color:${RED};margin:12px 0 0">
    ⚠️ Uma coisa que o jogo NÃO tem hoje: aviso/notificação. Quando der a hora, ninguém é avisado no celular — cada um entra por conta. Se você quiser aviso, é obra à parte.</p>
`, '#fff')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
body{margin:0;background:#F4ECD6;color:${INK};font-family:system-ui,-apple-system,sans-serif;width:1180px;padding:34px 32px 30px}
h1{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:56px;line-height:.98;margin:14px 0 6px}
</style></head><body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};padding:6px 16px;
              font-family:Oswald,sans-serif;font-weight:700;font-size:14px;letter-spacing:1.2px;text-transform:uppercase">🏆 Mockup · liga fechada</div>
  <h1>Marque o jogo <span style="color:${RED}">com a sua turma</span></h1>
  <p style="font-size:16px;font-weight:600;max-width:850px;margin:0 0 6px;line-height:1.45">
    Uma sala que <b>fica de pé</b>: você marca o dia e a hora, só a sua turma entra, e os troféus vão se
    empilhando ali dentro temporada após temporada. O jogo é o mesmo de sempre — muda só a porta de entrada.</p>

  ${h2(1, 'Criar a liga', 'quem é 👑 Lenda ou dono de clube batizado')}
  ${painel1}
  ${h2(2, 'Como ela aparece', 'quem não é da turma nem vê')}
  ${painel2}
  ${h2(3, 'Dentro da sala', 'os troféus e os botões do dono')}
  ${painel3}
  <div style="height:26px"></div>
  ${painel4}
  <p style="margin-top:18px;font-family:Oswald,sans-serif;font-weight:700;font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-liga-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
