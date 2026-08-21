// ─── 🧹 MOCKUP: O TOPO DA TEMPORADA (carreira) ──────────────────────────────
//
// Pergunta do Diego (21/08), depois de aprovar a barra de baixo: *"tem mais
// coisas no modo carreira ou outro modo q vc gostaria de mudar pela sua
// percepção? E oq seria?"* — e depois: *"mostre o 1 como é hoje e como vc
// sugere em um mockup"*.
//
// 🔎 MEDIDO NO CÓDIGO (pyramidseason.tsx, tudo que renderiza ANTES das abas):
//   AvisoContaCarreira · SocioBaraoBanner · cabeçalho preto · banner de campeão
//   · avisos da Copa (4 variações) · O Martelo (jornal) · campeão da Copa ·
//   MyMatchCard · fila de avisos · banner do intervalo · banner do pênalti ·
//   aviso do suspenso · contrato do patrocínio · botão de começar · controles
//   de ritmo · cartas ganhas · FECHAMENTO DA TEMPORADA · votação.
// Na VIRADA DE TEMPORADA (rodada 0) dá pra ter 7 quadros grandes empilhados
// antes do botão verde. Todos com a MESMA borda preta e a MESMA sombra dura —
// nada diz "é AQUI que você decide".
//
// 💡 A REGRA QUE EU PROPONHO, em uma frase:
//   **decisão em cima · recibo em linha · resto na aba.**
//   1. DECISÃO (só pode ter uma por vez): fica no topo, no tamanho grande.
//   2. RECIBO (aconteceu, não precisa de você): vira UMA linha clicável.
//   3. CONTEÚDO (jornal, finanças, cartas): mora na aba dele, e a barra de
//      baixo ganha um 🔴 pra pessoa saber que tem coisa nova lá.
// O padrão da FILA DE AVISOS com bolinhas (que já existe no jogo) vira a regra
// pra tudo, em vez de ser exceção de um bloco só.
//
//   node scripts/mockup-topo-temporada.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'topo-temporada.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:44px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const quadro = (bg, inner, mb = 10) =>
  `<div style="border:3px solid ${INK};border-radius:15px;background:${bg};box-shadow:3px 3px 0 ${INK};margin:0 0 ${mb}px;overflow:hidden">${inner}</div>`

// cabeçalho preto da carreira (o mesmo nos dois lados — ele não muda)
const cab = `
  <div style="background:${INK};padding:11px 13px 14px;color:#fff;position:relative">
    <div style="${OSW};font-size:9.5px;letter-spacing:.1em;color:${GOLD}">TEMPORADA 11 · ⚽ LIGA LEGENDS</div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:2px">
      <div><div style="${OSW};font-size:19px;line-height:1">Começando…</div>
      <div style="font-family:system-ui;font-size:10px;font-weight:700;opacity:.65;margin-top:3px">Série D</div></div>
      <div style="display:flex;gap:6px">
        <span style="${OSW};font-size:11px;border:2px solid rgba(255,255,255,.25);border-radius:999px;padding:2px 8px">🏅 3º</span>
        <span style="${OSW};font-size:11px;background:${GOLD};color:${INK};border-radius:7px;padding:2px 8px">🪙 412</span>
      </div>
    </div>
    <div style="padding:9px 0 0;display:flex;align-items:center;gap:7px">
      <span style="font-size:15px">😊</span>
      <div style="flex:1"><div style="font-size:7.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.5)">Torcida</div>
      <div style="height:5px;border-radius:3px;background:rgba(255,255,255,.15);margin-top:2px;overflow:hidden"><div style="height:100%;width:69%;background:${GREEN}"></div></div></div>
      <span style="${OSW};font-size:11px">69%</span>
    </div>
  </div>`

// ── ① COMO ESTÁ HOJE ───────────────────────────────────────────────────────
const HOJE = `${cab}
  <div style="padding:11px">
    ${quadro('#EAF3FF', `<div style="padding:11px 12px">
      <div style="${OSW};font-size:12px">🎴 Colecione craques — faça seu cadastro</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.55);margin-top:3px;line-height:1.4">Com conta: sendo campeão você ganha um craque colecionável limitado pro seu álbum.</div>
      <div style="margin-top:7px;border:2.5px solid ${INK};border-radius:9px;background:#fff;padding:6px;text-align:center;${OSW};font-size:10.5px">👉 Criar minha conta</div>
    </div>`)}
    ${quadro('#fff', `<div style="padding:11px 12px">
      <div style="${OSW};font-size:9px;letter-spacing:.08em;color:rgba(0,0,0,.45)">📰 O MARTELO · EDIÇÃO DA TEMPORADA 10</div>
      <div style="${OSW};font-size:14px;margin-top:2px;line-height:1.1">Skyy FC leva a Série D no sufoco</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.55);margin-top:4px;line-height:1.4">Artilheiro: Gabigol (21 gols) · Neymarzetti fecha em 3º e escapa do rebaixamento na última rodada.</div>
      <div style="margin-top:7px;border:2.5px solid ${INK};border-radius:9px;background:#FFF6DE;padding:6px;text-align:center;${OSW};font-size:10.5px">📰 Ler o jornal inteiro</div>
    </div>`)}
    ${quadro('#fff', `<div style="padding:11px 12px">
      <div style="${OSW};font-size:12.5px;margin-bottom:6px">💰 FECHAMENTO DA TEMPORADA 10</div>
      <div style="font-family:system-ui;font-size:10px;font-weight:700">
        ${[['🎟️ Bilheteria', '+148'], ['🤝 Patrocínio', '+4'], ['🏅 Premiação', '+90'], ['💸 Salários', '−28']]
          .map(r => `<div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid rgba(0,0,0,.08)"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding:5px 0 0;border-top:2.5px solid ${INK};margin-top:4px;${OSW};font-size:12px"><span>SALDO DA TEMPORADA</span><span style="color:${GREEN}">+214 🪙</span></div>
      </div>
    </div>`)}
    ${quadro('#E6F3EA', `<div style="padding:8px 10px;display:flex;align-items:center;gap:8px">
      <span style="font-size:17px">🛡️</span>
      <div style="flex:1"><div style="${OSW};font-size:11.5px;line-height:1.1">Temporada passada: aposta certeira</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5)">Max Joias · não cair de divisão</div></div>
      <span style="${OSW};font-size:12px;background:${GREEN};color:#fff;border:2px solid ${INK};border-radius:8px;padding:3px 8px">+4 🪙</span>
    </div>`)}
    ${quadro('#fff', `
      <div style="background:linear-gradient(150deg,#2B2B2B,${INK});padding:9px 12px;${OSW};font-size:13px;color:${GOLD}">🤝 PATROCÍNIO DA TEMPORADA</div>
      <div style="padding:11px">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:7px"><span style="${OSW};font-size:9px;background:${INK};color:#fff;border-radius:999px;padding:2px 7px">PASSO 1</span><span style="${OSW};font-size:11.5px">Onde você quer chegar?</span></div>
        <div style="display:flex;gap:6px">
          ${[['🛡️', 'Não cair', '+4'], ['📈', 'Acesso', '+8'], ['👑', 'Campeão', '+12']].map(m => `
            <div style="flex:1;border:2.5px solid ${INK};border-radius:12px;background:#fff;padding:8px 4px;text-align:center;opacity:.75">
              <div style="font-size:19px">${m[0]}</div><div style="${OSW};font-size:10px;margin-top:2px">${m[1]}</div>
              <div style="${OSW};font-size:14px;margin-top:3px">${m[2]} 🪙</div></div>`).join('')}
        </div>
      </div>`)}
    <div style="border:3px solid ${INK};border-radius:13px;background:#cfc6ae;padding:11px;text-align:center;${OSW};font-size:14px;color:rgba(0,0,0,.45)">🤝 Escolha o patrocínio aí em cima</div>
    <div style="display:flex;gap:5px;margin-top:13px;border-top:1.5px solid rgba(12,12,12,.13);padding-top:9px">
      ${['🗓️ Jogos', '📊 Tabelas', '👥 Elenco', '🏆 Rank', '🏟️ Clube'].map((t, i) => `
        <div style="flex:1;text-align:center;${OSW};font-size:8px;color:${i === 0 ? PURPLE : 'rgba(12,12,12,.45)'}">
          <div style="font-size:15px">${t.split(' ')[0]}</div>${t.split(' ')[1]}</div>`).join('')}
    </div>
  </div>`

// ── ② COMO EU SUGIRO ───────────────────────────────────────────────────────
const recibo = (ic, tit, sub, valor, cor) => `
  <div style="display:flex;align-items:center;gap:9px;padding:9px 11px;border-bottom:1.5px solid rgba(12,12,12,.10)">
    <span style="font-size:15px">${ic}</span>
    <div style="flex:1;min-width:0">
      <div style="${OSW};font-size:11px;line-height:1.15">${tit}</div>
      <div style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.48);margin-top:1px">${sub}</div>
    </div>
    ${valor ? `<span style="${OSW};font-size:11px;color:${cor};white-space:nowrap">${valor}</span>` : ''}
    <span style="${OSW};font-size:14px;color:rgba(0,0,0,.32)">›</span>
  </div>`

const DEPOIS = `${cab}
  <div style="padding:11px">
    <!-- 1) A DECISÃO DA VEZ, no topo, sozinha e grande -->
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px">
      <span style="${OSW};font-size:9px;letter-spacing:.08em;background:${RED};color:#fff;border-radius:999px;padding:2px 9px">👉 SUA VEZ</span>
      <span style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45)">1 decisão pra começar a T11</span>
    </div>
    ${quadro('#fff', `
      <div style="background:linear-gradient(150deg,#2B2B2B,${INK});padding:9px 12px;${OSW};font-size:13px;color:${GOLD}">🤝 PATROCÍNIO DA TEMPORADA</div>
      <div style="padding:11px">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:7px"><span style="${OSW};font-size:9px;background:${INK};color:#fff;border-radius:999px;padding:2px 7px">PASSO 1</span><span style="${OSW};font-size:11.5px">Onde você quer chegar?</span></div>
        <div style="display:flex;gap:6px">
          ${[['🛡️', 'Não cair', '+4'], ['📈', 'Acesso', '+8'], ['👑', 'Campeão', '+12']].map(m => `
            <div style="flex:1;border:2.5px solid ${INK};border-radius:12px;background:#fff;padding:8px 4px;text-align:center;opacity:.75">
              <div style="font-size:19px">${m[0]}</div><div style="${OSW};font-size:10px;margin-top:2px">${m[1]}</div>
              <div style="${OSW};font-size:14px;margin-top:3px">${m[2]} 🪙</div></div>`).join('')}
        </div>
      </div>`, 11)}
    <div style="border:3px solid ${INK};border-radius:13px;background:#cfc6ae;padding:11px;text-align:center;${OSW};font-size:14px;color:rgba(0,0,0,.45);margin-bottom:14px">🤝 Escolha o patrocínio aí em cima</div>

    <!-- 2) OS RECIBOS: aconteceu, não precisa de você → UMA linha cada -->
    <div style="${OSW};font-size:9.5px;letter-spacing:.06em;color:rgba(0,0,0,.42);margin:0 2px 6px">ENQUANTO ISSO, NA TEMPORADA 10</div>
    ${quadro('#fff', `
      ${recibo('💰', 'Fechamento da temporada 10', 'bilheteria, premiação e salários', '+214 🪙', GREEN)}
      ${recibo('🛡️', 'O patrocínio pagou', 'Max Joias · não cair de divisão', '+4 🪙', GREEN)}
      ${recibo('📰', 'O Martelo já saiu', 'Skyy FC campeão · Gabigol artilheiro', '', '')}
      <div style="display:flex;align-items:center;gap:9px;padding:9px 11px">
        <span style="font-size:15px">🎴</span>
        <div style="flex:1;min-width:0">
          <div style="${OSW};font-size:11px;line-height:1.15">Criar conta pra ganhar cartas</div>
          <div style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.48);margin-top:1px">campeão com conta leva craque pro álbum</div>
        </div>
        <span style="${OSW};font-size:14px;color:rgba(0,0,0,.32)">›</span>
      </div>`, 0)}
    <div style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.4);text-align:center;margin:8px 4px 0;line-height:1.4">Toque em qualquer linha pra abrir. Nada some: o fechamento continua em Clube › Finanças, o jornal continua inteiro.</div>

    <!-- 3) a barra de baixo avisa onde tem coisa nova -->
    <div style="display:flex;gap:5px;margin-top:13px;border-top:1.5px solid rgba(12,12,12,.13);padding-top:9px">
      ${['🗓️ Jogos', '📊 Tabelas', '👥 Elenco', '🏆 Rank', '🏟️ Clube'].map((t, i) => `
        <div style="flex:1;position:relative;text-align:center;${OSW};font-size:8px;color:${i === 0 ? PURPLE : 'rgba(12,12,12,.45)'}">
          <div style="font-size:15px">${t.split(' ')[0]}</div>${t.split(' ')[1]}
          ${i === 4 ? `<span style="position:absolute;top:0;right:50%;margin-right:-15px;width:7px;height:7px;border-radius:999px;background:${RED};border:1.5px solid #fff"></span>` : ''}
        </div>`).join('')}
    </div>
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 38px;font-family:system-ui}</style>
<body>
  <div style="${OSW};font-size:31px;text-transform:uppercase">🧹 O topo da temporada — como está × como eu faria</div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:5px 0 26px;max-width:1060px;line-height:1.5">
    Nesta virada de temporada são <b>5 quadros grandes</b> antes do botão verde — e ainda podem entrar festa de campeão, carta ganha e votação (no online) — e todos com a mesma borda preta e a mesma
    sombra dura. Nada diz "é AQUI que você decide". A regra que eu proponho cabe numa frase:
    <b>decisão em cima · recibo em linha · resto na aba</b>.
  </div>

  <div style="display:flex;gap:30px;align-items:flex-start;flex-wrap:wrap;margin-bottom:30px">
    ${fone(HOJE, '① Como está hoje', RED, 'Cadastro · jornal · fechamento · patrocínio pago · contrato · botão. Cinco quadros do mesmo tamanho, e a decisão de verdade (o contrato) é o último — quem tem pressa rola tudo sem ler nada. A barra de baixo já é a nova.')}
    ${fone(DEPOIS, '② Como eu faria', GREEN, 'A decisão sobe pro topo com o selo <b>👉 SUA VEZ</b>. O que já aconteceu vira <b>4 linhas clicáveis</b> numa caixa só. A barra de baixo ganha um 🔴 avisando que tem novidade no Clube.')}
    <div style="flex:1;min-width:400px;max-width:600px">
      ${bloco('📏 A regra, em 3 linhas', '#EAF3FF', `
        <b>1. DECISÃO</b> — o que TRAVA o jogo até você escolher. Fica em cima, grande, e <b>só pode ter uma por vez</b>
        (se cair duas, entram em fila com bolinhas ⚫⚪, igual já acontece com lesão/gancho hoje).<br><br>
        <b>2. RECIBO</b> — já aconteceu, não depende de você. Vira <b>uma linha</b> com ícone, valor e a setinha ›.<br><br>
        <b>3. CONTEÚDO</b> — jornal, finanças, cartas. Mora na aba dele, e a barra de baixo ganha um <b>🔴</b> pra
        você saber que tem coisa nova lá.`)}
      ${bloco('📉 O que isso corta', '#FFF6D6', `
        Nesta virada: de <b>5 quadros grandes</b> pra <b>1 quadro + 1 caixa de 4 linhas</b>.<br>
        Em rodada normal, o mesmo vale pro placar ao vivo: seu jogo em cima, o resto vira linha.<br><br>
        E o mais importante: quem abre o jogo <b>sabe na hora o que tem que fazer</b> — é a única coisa em vermelho na tela.`)}
      ${bloco('🛡️ O que NÃO muda / dá pra voltar', '#F1EDE0', `
        <b>Nada some.</b> O fechamento da temporada continua inteiro em <b>Clube › Finanças</b>, o jornal continua
        inteiro em <b>O Martelo</b>, as cartas continuam caindo no álbum. O que muda é <b>onde</b> a coisa aparece
        na hora da virada.<br><br>
        <b>Nenhum número, nenhuma regra e nenhum save são tocados</b> — é arrumação de tela, igual foi o patrocínio.
        E daria pra fazer <b>em passos</b>: primeiro só os recibos, depois o selo "sua vez", depois o 🔴 na barra.
        Cada passo é um commit isolado, revertível sozinho.`)}
      ${bloco('⚠️ O cuidado que eu tomaria', '#FBE7E3', `
        <b>Momento de emoção não vira linha.</b> Ser campeão, subir de divisão, ganhar carta — isso continua
        grande e com festa. Recibo é pra <b>rotina</b> (fechamento, patrocínio pago, manchete), nunca pra conquista.<br><br>
        E <b>nada de spoiler</b>: os recibos só aparecem depois do apito, nunca antes da animação terminar.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-topo-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
