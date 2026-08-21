// ─── 🧭 SUB-ABAS · RODADA 2 (a v1 foi reprovada) ────────────────────────────
//
// O que aconteceu: em 21/08 eu troquei as pílulas do Clube/Elenco por uma
// TIRINHA FINA (só texto + sublinhado). O Diego reprovou: *"esse 2 n gostei"* e
// depois explicou o porquê — *"ficou meio apagada… não ficou muito clara onde
// tá a sub aba. Principalmente p quem nunca jogou ainda"*. Reverti tudo.
//
// 🎯 A LIÇÃO: o problema que eu quis resolver é REAL (as pílulas rolam junto com
// o conteúdo e somem — quem desce até o fim das Finanças precisa rolar tudo de
// volta), mas o remédio não pode ser TIRAR PESO. Pra quem nunca jogou, peso é o
// que diz "isto aqui é um botão e você está NESTE".
//
// 💡 Então as 3 ideias novas NÃO apagam nada. Duas delas deixam a sub-aba MAIS
// visível que hoje, não menos:
//   1. AS MESMAS PÍLULAS, GRUDADAS  — zero mudança de visual; elas só param de
//      sumir. A pílula roxa cheia fica SEMPRE na tela dizendo onde você está.
//   2. O SELETOR COM NOME GRANDE    — um botão só, com o nome da seção escrito
//      grande ("🤝 Patrocínio ▾"). Impossível não saber onde está.
//   3. A BARRA DE BAIXO ENTRA NO CLUBE — uma navegação só, nunca duas.
//
//   node scripts/mockup-subabas-v2.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'subabas-v2.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:74px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const faixa = `
  <div style="background:rgba(12,12,12,.97);color:#fff;padding:7px 12px;display:flex;align-items:center;gap:8px">
    <span style="${OSW};font-size:11px;background:${PURPLE};border-radius:6px;padding:2px 7px">T11</span>
    <span style="${OSW};font-size:12px">Rodada 18/38</span>
    <span style="flex:1;font-family:system-ui;font-size:10px;font-weight:700;color:rgba(255,255,255,.6)">Série D</span>
    <span style="${OSW};font-size:11px">🏅 3º</span>
    <span style="${OSW};font-size:11px;color:${GOLD}">🪙 412</span>
  </div>`

// as PÍLULAS de hoje — mesmo tamanho, mesma cor, mesma sombra dura
const pilulas = (ativa, grudada) => `
  <div style="display:flex;gap:6px;padding:${grudada ? '9px 11px' : '11px 11px 0'};${grudada ? `background:rgba(250,247,238,.98);border-bottom:2.5px solid ${INK}` : ''}">
    ${[['🏗️', 'Estrutura'], ['💰', 'Finanças'], ['🤝', 'Patrocínio']].map(([i, t]) => `
      <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:${t === ativa ? PURPLE : '#fff'};color:${t === ativa ? '#fff' : INK};
        box-shadow:2px 2px 0 ${INK};padding:8px 2px;text-align:center;${OSW};font-size:10px;text-transform:uppercase">${i} ${t}</div>`).join('')}
  </div>`

const conteudo = (curto) => `
  <div style="padding:11px">
    <div style="border:3px solid ${INK};border-radius:15px;background:#fff;box-shadow:3px 3px 0 ${INK};overflow:hidden;margin-bottom:10px">
      <div style="background:#E6F3EA;padding:9px 11px;display:flex;align-items:center;gap:8px;border-bottom:2.5px solid ${INK}">
        <span style="font-size:17px">🛡️</span>
        <div style="flex:1"><div style="${OSW};font-size:11.5px;line-height:1.1">Patrocínio desta temporada</div>
        <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55)">Max Joias · não cair de divisão</div></div>
        <span style="${OSW};font-size:12px;background:${GREEN};color:#fff;border:2px solid ${INK};border-radius:8px;padding:3px 8px">+4 🪙</span>
      </div>
      <div style="padding:10px 11px">
        <div style="${OSW};font-size:10px;color:rgba(0,0,0,.5);letter-spacing:.05em;margin-bottom:6px">QUANTO PAGA EM CADA DIVISÃO</div>
        <div style="font-family:system-ui;font-size:10px;font-weight:700">
          <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:4px;color:rgba(0,0,0,.45);font-size:8.5px;text-transform:uppercase"><span>Divisão</span><span style="text-align:center">🛡️</span><span style="text-align:center">📈</span><span style="text-align:center">👑</span></div>
          ${[['🌱 Várzea', 2, 4, 6], ['Série D', 4, 8, 12], ['Série C', 8, 16, 24], ['Série B', 16, 32, 48], ['Série A', 32, 64, 96]].slice(0, curto ? 3 : 5)
            .map(r => `<div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:4px;padding:4px 0;border-top:1px solid rgba(0,0,0,.08);${r[0] === 'Série D' ? 'background:#FFF6DE' : ''}"><span>${r[0]}</span><span style="text-align:center">${r[1]}</span><span style="text-align:center">${r[2]}</span><span style="text-align:center">${r[3]}</span></div>`).join('')}
        </div>
      </div>
    </div>
    ${curto ? '' : `<div style="border:3px solid ${INK};border-radius:15px;background:#FBF6E9;box-shadow:3px 3px 0 ${INK};padding:11px;font-family:system-ui;font-size:9.5px;font-weight:600;line-height:1.5">
      <b>Como funciona:</b> dobra a cada divisão que você sobe. Ficou aquém da meta? Não paga nada. Superou? Paga só o que apostou.</div>`}
  </div>`

const barra = (clube) => `
  <div style="background:rgba(250,247,238,.98);border-top:1.5px solid rgba(12,12,12,.13);display:flex;padding:7px 6px 9px">
    ${[['🗓️', 'Jogos'], ['📊', 'Tabelas'], ['👥', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([i, t]) => {
      const on = t === 'Clube' && clube
      return `<div style="flex:1;text-align:center;${OSW};font-size:9px;text-transform:uppercase;color:${on ? PURPLE : 'rgba(12,12,12,.45)'}">
        <div style="font-size:17px">${i}</div>${t}</div>`
    }).join('')}
  </div>`

// ── ① HOJE, ROLADO (o problema que sobrou) ─────────────────────────────────
const HOJE = `${faixa}
  <div style="padding:9px 11px 0;font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.32);text-align:center">⋯ rolou pra baixo ⋯</div>
  ${conteudo(false)}
  <div style="padding:0 11px 12px;text-align:center;font-family:system-ui;font-size:10px;font-weight:800;color:${RED}">☝️ as pílulas ficaram lá em cima — pra trocar, role tudo de volta</div>
  ${barra(true)}`

// ── ② IDEIA 1 · AS MESMAS PÍLULAS, GRUDADAS ────────────────────────────────
const IDEIA1 = `${faixa}${pilulas('Patrocínio', true)}
  <div style="padding:9px 11px 0;font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.32);text-align:center">⋯ rolou pra baixo ⋯</div>
  ${conteudo(false)}
  <div style="padding:0 11px 12px;text-align:center;font-family:system-ui;font-size:10px;font-weight:800;color:${GREEN}">👆 a pílula roxa está SEMPRE na tela — troca na hora</div>
  ${barra(true)}`

// ── ③ IDEIA 2 · SELETOR COM NOME GRANDE ────────────────────────────────────
const IDEIA2 = `${faixa}
  <div style="background:rgba(250,247,238,.98);border-bottom:2.5px solid ${INK};padding:9px 11px">
    <div style="border:3px solid ${INK};border-radius:13px;background:${PURPLE};box-shadow:3px 3px 0 ${INK};padding:9px 13px;display:flex;align-items:center;gap:9px;color:#fff">
      <span style="font-size:19px">🤝</span>
      <div style="flex:1;min-width:0">
        <div style="font-family:system-ui;font-size:8.5px;font-weight:800;letter-spacing:.08em;color:rgba(255,255,255,.6)">VOCÊ ESTÁ EM</div>
        <div style="${OSW};font-size:17px;line-height:1.05">Patrocínio</div>
      </div>
      <span style="${OSW};font-size:16px">▾</span>
    </div>
    <div style="font-family:system-ui;font-size:8.5px;font-weight:700;color:rgba(0,0,0,.4);text-align:center;margin-top:5px">toque pra trocar de seção</div>
  </div>
  ${conteudo(true)}
  <div style="padding:0 11px 10px">
    <div style="border:3px dashed rgba(12,12,12,.3);border-radius:14px;background:#fff;padding:8px">
      <div style="font-family:system-ui;font-size:8.5px;font-weight:800;color:rgba(0,0,0,.4);text-align:center;margin-bottom:6px">↓ COMO FICA QUANDO ABRE ↓</div>
      ${[['🏗️', 'Estrutura', 'o estádio, a SAF e as obras', 0], ['💰', 'Finanças', 'extrato de tudo que entra e sai', 0], ['🤝', 'Patrocínio', 'sua aposta e quanto paga cada divisão', 1]].map(([i, t, s, on]) => `
        <div style="display:flex;align-items:center;gap:9px;border:2.5px solid ${INK};border-radius:11px;background:${on ? PURPLE : '#fff'};color:${on ? '#fff' : INK};padding:7px 10px;margin-bottom:5px;box-shadow:2px 2px 0 ${INK}">
          <span style="font-size:16px">${i}</span>
          <div style="flex:1"><div style="${OSW};font-size:12px;line-height:1.1">${t}</div>
          <div style="font-family:system-ui;font-size:8.5px;font-weight:700;color:${on ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.45)'}">${s}</div></div>
          ${on ? '<span style="${OSW};font-size:13px">✓</span>' : ''}
        </div>`).join('')}
    </div>
  </div>
  ${barra(true)}`

// ── ④ IDEIA 3 · A BARRA DE BAIXO ENTRA NO CLUBE ────────────────────────────
const IDEIA3 = `${faixa}
  <div style="padding:9px 11px 0;font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.32);text-align:center">⋯ rolou pra baixo ⋯</div>
  ${conteudo(false)}
  <div style="padding:0 11px 12px;text-align:center;font-family:system-ui;font-size:10px;font-weight:800;color:${GREEN}">👇 a barra de baixo virou o menu DO CLUBE</div>
  <div style="background:rgba(250,247,238,.98);border-top:2.5px solid ${INK};display:flex;align-items:center;padding:7px 6px 9px;gap:2px">
    <div style="flex:0 0 52px;text-align:center;${OSW};font-size:9px;text-transform:uppercase;color:rgba(12,12,12,.55);border-right:1.5px solid rgba(12,12,12,.15)">
      <div style="font-size:17px">←</div>Voltar</div>
    ${[['🏗️', 'Estrutura', 0], ['💰', 'Finanças', 0], ['🤝', 'Patrocínio', 1]].map(([i, t, on]) => `
      <div style="flex:1;text-align:center;${OSW};font-size:9.5px;text-transform:uppercase;color:${on ? '#fff' : 'rgba(12,12,12,.45)'};
        ${on ? `background:${PURPLE};border:2.5px solid ${INK};border-radius:11px;box-shadow:2px 2px 0 ${INK};padding:4px 0` : 'padding:6px 0'}">
        <div style="font-size:17px">${i}</div>${t}</div>`).join('')}
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
  <div style="${OSW};font-size:31px;text-transform:uppercase">🧭 Sub-abas — 3 ideias novas</div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:5px 0 8px;max-width:1120px;line-height:1.5">
    Você matou a charada: <b>o remédio não podia ser tirar peso</b>. Pra quem nunca jogou, é justamente o peso — a borda
    grossa, a sombra dura, a pílula roxa cheia — que diz "isto é um botão, e você está NESTE".
  </div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:0 0 24px;max-width:1120px;line-height:1.5">
    Então nenhuma das 3 apaga nada. <b>Duas deixam a sub-aba MAIS visível que hoje</b>, não menos. O problema que continua
    de pé é só um: hoje as pílulas <b>rolam junto com o conteúdo e somem</b>.
  </div>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:30px">
    ${fone(HOJE, '① O problema que sobrou', RED, 'As pílulas de hoje estão ótimas de clareza — o problema é só que elas <b>somem</b> quando você rola. Quem desce até o fim das Finanças tem que rolar tudo de volta pra ir no Patrocínio.')}
    ${fone(IDEIA1, '② Ideia 1 · pílulas grudadas ⭐', GREEN, '<b>Zero mudança de visual.</b> Mesmas pílulas, mesmo tamanho, mesma cor, mesma sombra dura. A única diferença: elas <b>grudam no topo</b> e nunca somem. A pílula roxa cheia fica sempre na tela dizendo onde você está.')}
    ${fone(IDEIA2, '③ Ideia 2 · nome grande', PURPLE, 'Um botão só, com o nome da seção <b>escrito grande</b> e um "VOCÊ ESTÁ EM" em cima. Impossível não saber onde está. Toca e abre a lista, com uma linha explicando o que tem em cada uma — <b>a mais clara pra quem nunca jogou</b>.')}
    ${fone(IDEIA3, '④ Ideia 3 · a barra entra no Clube', '#2E6FB0', 'Uma navegação <b>só</b>: quando você entra no Clube, a barra de baixo vira o menu DO Clube, com um ← pra voltar. Some a briga entre duas navegações — mas você perde o atalho direto pras outras abas.')}
  </div>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:1;min-width:430px">
      ${bloco('⭐ Minha recomendação: a Ideia 1', '#E6F3EA', `
        É a que <b>não muda nada do que você já aprovou</b>. As pílulas continuam idênticas — mesmo tamanho, mesma cor,
        mesma borda, mesma sombra. Elas só <b>param de sumir</b>.<br><br>
        Pra quem nunca jogou fica <b>melhor que hoje</b>, não pior: a pílula roxa cheia passa a estar
        <b>sempre</b> na tela, em vez de desaparecer no primeiro deslize do dedo.<br><br>
        E é a de menor risco: se não gostar, é desligar e volta ao de hoje.`)}
      ${bloco('🥈 Se quiser o máximo de clareza: a Ideia 2', '#F3EBFF', `
        Essa é a mais explícita de todas — o nome da seção fica <b>escrito grande</b>, com "VOCÊ ESTÁ EM" em cima,
        e quando abre cada opção vem com <b>uma linha dizendo o que tem lá dentro</b> ("Finanças — extrato de tudo que
        entra e sai").<br><br>
        <b>O contra:</b> vira um toque a mais pra trocar de seção (abre a lista, escolhe). Hoje é um toque direto.
        Pra quem já joga, isso incomoda.`)}
    </div>
    <div style="flex:1;min-width:430px">
      ${bloco('🛡️ O que NÃO muda em nenhuma das três', '#F1EDE0', `
        As sub-abas são <b>as mesmas</b>, na mesma ordem, com o mesmo conteúdo.<br><br>
        <b>O desenho do estádio continua sendo a primeira coisa</b> ao abrir o Clube — a faixa das pílulas é
        navegação, não conteúdo; o estádio vem logo abaixo dela, como sempre.<br><br>
        Nenhuma regra, nenhum número e nenhum save são tocados. Ligo <b>só na sua conta</b> primeiro, e reverter é
        uma linha.`)}
      ${bloco('⚖️ A Ideia 3 e por que eu não recomendo AGORA', '#FFF6D6', `
        Ela é a mais "app moderno" e resolve de vez a briga de duas navegações. Mas tem um preço que eu acho alto:
        <b>estando no Clube, você perde o atalho pras outras abas</b> — pra ver os Jogos tem que voltar primeiro.<br><br>
        Hoje a barra de baixo te leva pra qualquer lugar em <b>um</b> toque, e isso foi exatamente o que você
        elogiou nela. Eu não trocaria isso.`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-sub2-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
