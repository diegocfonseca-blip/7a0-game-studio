// ─── 🧭 MOCKUP: AS SUB-ABAS ÓRFÃS (opção 2) ─────────────────────────────────
//
// Depois de aprovar a barra de baixo, o Diego pediu pra ver a opção 2.
//
// 🔎 O PROBLEMA (medido no código, pyramidseason.tsx):
// a navegação principal desceu pro rodapé, mas DENTRO de duas abas ainda existe
// uma segunda fileira de pílulas grandes, em cima do conteúdo:
//   · 🏟️ CLUBE  → Estrutura · Finanças · Patrocínio (+ Agência nos saves antigos)
//   · 👥 ELENCO → Time · Agenciados (só na Agência 2.0)
// Resultado: navegação embaixo E navegação em cima ao mesmo tempo, com pesos
// diferentes (as de cima são pílulas com borda 2.5px e sombra dura — mais
// pesadas visualmente que a barra que MANDA na tela).
// E tem outro detalhe: as pílulas rolam junto com o conteúdo. Quem desce até o
// fim das Finanças precisa rolar tudo de volta pra ir no Patrocínio.
//
// 💡 A PROPOSTA: **em cima é ONDE EU ESTOU, embaixo é PRA ONDE EU VOU.**
// As sub-abas viram uma TIRINHA FINA que gruda logo abaixo da faixa do topo —
// texto miúdo, sem borda, sem sombra, com um sublinhado na ativa (o padrão de
// "abas de conteúdo" que todo mundo já conhece). Elas param de competir com a
// barra de baixo e param de sumir quando a pessoa rola.
//
//   node scripts/mockup-subabas.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'subabas.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:58px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

// faixa fina do topo (a que já está no ar)
const faixa = `
  <div style="background:rgba(12,12,12,.97);color:#fff;padding:7px 12px;display:flex;align-items:center;gap:8px">
    <span style="${OSW};font-size:11px;background:${PURPLE};border-radius:6px;padding:2px 7px">T11</span>
    <span style="${OSW};font-size:12px">Rodada 18/38</span>
    <span style="flex:1;font-family:system-ui;font-size:10px;font-weight:700;color:rgba(255,255,255,.6)">Série D</span>
    <span style="${OSW};font-size:11px">🏅 3º</span>
    <span style="${OSW};font-size:11px;color:${GOLD}">🪙 412</span>
  </div>`

// ── ① HOJE: pílulas grandes em cima, rolando junto ─────────────────────────
const pilulas = ativa => `
  <div style="display:flex;gap:6px;padding:11px 11px 0">
    ${[['🏗️', 'Estrutura'], ['💰', 'Finanças'], ['🤝', 'Patrocínio']].map(([i, t]) => `
      <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:${t === ativa ? PURPLE : '#fff'};color:${t === ativa ? '#fff' : INK};
        box-shadow:2px 2px 0 ${INK};padding:8px 2px;text-align:center;${OSW};font-size:10px;text-transform:uppercase">${i} ${t}</div>`).join('')}
  </div>`

// ── ② PROPOSTA: tirinha fina grudada embaixo da faixa ──────────────────────
const tirinha = ativa => `
  <div style="background:rgba(250,247,238,.98);border-bottom:1.5px solid rgba(12,12,12,.13);display:flex;padding:0 6px">
    ${[['🏗️', 'Estrutura'], ['💰', 'Finanças'], ['🤝', 'Patrocínio']].map(([i, t]) => {
      const on = t === ativa
      return `<div style="flex:1;text-align:center;padding:8px 2px 6px;position:relative;${OSW};font-size:10.5px;text-transform:uppercase;
        color:${on ? PURPLE : 'rgba(12,12,12,.45)'}">${i} ${t}
        ${on ? `<div style="position:absolute;left:14%;right:14%;bottom:0;height:3px;border-radius:3px;background:${PURPLE}"></div>` : ''}
      </div>`
    }).join('')}
  </div>`

const conteudoClube = `
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
          ${[['🌱 Várzea', 2, 4, 6], ['Série D', 4, 8, 12], ['Série C', 8, 16, 24], ['Série B', 16, 32, 48], ['Série A', 32, 64, 96]]
            .map(r => `<div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:4px;padding:4px 0;border-top:1px solid rgba(0,0,0,.08);${r[0] === 'Série D' ? 'background:#FFF6DE' : ''}"><span>${r[0]}</span><span style="text-align:center">${r[1]}</span><span style="text-align:center">${r[2]}</span><span style="text-align:center">${r[3]}</span></div>`).join('')}
        </div>
      </div>
    </div>
    <div style="border:3px solid ${INK};border-radius:15px;background:#FBF6E9;box-shadow:3px 3px 0 ${INK};padding:11px;font-family:system-ui;font-size:9.5px;font-weight:600;line-height:1.5">
      <b>Como funciona:</b> dobra a cada divisão que você sobe. Ficou aquém da meta? Não paga nada. Superou? Paga só o que você apostou.
    </div>
  </div>`

const barra = pontoClube => `
  <div style="background:rgba(250,247,238,.98);border-top:1.5px solid rgba(12,12,12,.13);display:flex;padding:7px 6px 9px">
    ${[['🗓️', 'Jogos'], ['📊', 'Tabelas'], ['👥', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([i, t]) => {
      const on = t === 'Clube'
      return `<div style="flex:1;text-align:center;position:relative;${OSW};font-size:9px;text-transform:uppercase;color:${on ? PURPLE : 'rgba(12,12,12,.45)'}">
        <div style="font-size:17px">${i}</div>${t}
        ${t === 'Clube' && pontoClube ? `<span style="position:absolute;top:0;right:50%;margin-right:-16px;width:7px;height:7px;border-radius:999px;background:${RED};border:1.5px solid #fff"></span>` : ''}
      </div>`
    }).join('')}
  </div>`

const HOJE = `${faixa}${pilulas('Patrocínio')}${conteudoClube}${barra(false)}`
const DEPOIS = `${faixa}${tirinha('Patrocínio')}${conteudoClube}${barra(false)}`

// o mesmo, rolado até o fim do conteúdo
const HOJE_ROLADO = `${faixa}
  <div style="padding:11px;font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.35);text-align:center;border-bottom:1px dashed rgba(0,0,0,.15)">⋯ rolou pra baixo ⋯</div>
  ${conteudoClube}
  <div style="padding:0 11px 11px">
    <div style="border:3px solid ${INK};border-radius:15px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:11px;font-family:system-ui;font-size:9.5px;font-weight:600;line-height:1.5">
      🎖️ <b>Fidelidade:</b> acertou a meta com uma marca e escolheu ela de novo? Ela garante o mínimo da sua divisão mesmo se você não bater.
    </div>
  </div>
  <div style="padding:0 11px 12px;text-align:center;font-family:system-ui;font-size:10px;font-weight:800;color:${RED}">☝️ pra trocar de sub-aba, role tudo de volta</div>
  ${barra(false)}`

const DEPOIS_ROLADO = `${faixa}${tirinha('Patrocínio')}
  <div style="padding:11px;font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.35);text-align:center;border-bottom:1px dashed rgba(0,0,0,.15)">⋯ rolou pra baixo ⋯</div>
  ${conteudoClube}
  <div style="padding:0 11px 11px">
    <div style="border:3px solid ${INK};border-radius:15px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:11px;font-family:system-ui;font-size:9.5px;font-weight:600;line-height:1.5">
      🎖️ <b>Fidelidade:</b> acertou a meta com uma marca e escolheu ela de novo? Ela garante o mínimo da sua divisão mesmo se você não bater.
    </div>
  </div>
  <div style="padding:0 11px 12px;text-align:center;font-family:system-ui;font-size:10px;font-weight:800;color:${GREEN}">👆 a tirinha continua ali em cima — troca na hora</div>
  ${barra(false)}`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 38px;font-family:system-ui}</style>
<body>
  <div style="${OSW};font-size:31px;text-transform:uppercase">🧭 Opção 2 — as sub-abas órfãs</div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:5px 0 26px;max-width:1080px;line-height:1.5">
    Agora que a navegação desceu pro rodapé, o <b>Clube</b> ainda abre com uma fileira de pílulas em cima
    (Estrutura · Finanças · Patrocínio) e o <b>Elenco</b> com outra (Time · Agenciados). Ficou navegação embaixo
    <b>e</b> navegação em cima — e as de cima são até mais pesadas (borda grossa + sombra dura) que a barra que
    realmente manda. A ideia: <b>em cima é ONDE EU ESTOU, embaixo é PRA ONDE EU VOU</b>.
  </div>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:30px">
    ${fone(HOJE, '① Hoje', RED, 'Duas navegações competindo: as pílulas em cima têm borda 2.5px e sombra dura — pesam mais que a barra de baixo, que é a que manda de verdade.')}
    ${fone(HOJE_ROLADO, '② Hoje, rolado', RED, 'E o pior: as pílulas <b>rolam junto</b>. Quem desceu até o fim do Patrocínio tem que rolar tudo de volta pra ir nas Finanças. Foi exatamente o problema que a barra de baixo resolveu.')}
    ${fone(DEPOIS, '③ Proposta', GREEN, 'As sub-abas viram uma <b>tirinha fina</b> grudada embaixo da faixa: texto miúdo, sem borda, sem sombra, sublinhado na ativa. Param de competir com a barra de baixo.')}
    ${fone(DEPOIS_ROLADO, '④ Proposta, rolado', GREEN, 'A tirinha <b>gruda no topo</b> junto com a faixa. Role até onde rolar, a troca de sub-aba está sempre a um toque.')}
  </div>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:1;min-width:430px">
      ${bloco('📏 A regra', '#EAF3FF', `
        <b>Embaixo</b> = mudar de <b>lugar</b> (Jogos · Tabelas · Elenco · Rank · Clube). Ícone desenhado, cor do seu tier.<br><br>
        <b>Em cima</b> = mudar de <b>assunto dentro do lugar</b> (Estrutura · Finanças · Patrocínio). Só texto,
        sublinhado na ativa. Nunca dois estilos de botão brigando pela mesma função.`)}
      ${bloco('🎯 Onde isso vale', '#FFF6D6', `
        · <b>🏟️ Clube</b> → Estrutura · Finanças · Patrocínio (e Agência nos saves antigos);<br>
        · <b>👥 Elenco</b> → Time · Agenciados (Agência 2.0);<br>
        · e serve de padrão pra <b>qualquer sub-aba nova</b> que aparecer depois — em vez de cada tela inventar a sua.`)}
    </div>
    <div style="flex:1;min-width:430px">
      ${bloco('🛡️ O que NÃO muda / dá pra voltar', '#F1EDE0', `
        <b>As sub-abas são as mesmas</b>, na mesma ordem, com o mesmo conteúdo. Ninguém perde nada de vista —
        pelo contrário, ganha, porque elas param de sumir na rolagem.<br><br>
        <b>O desenho do estádio continua sendo a primeira coisa</b> ao abrir o Clube: a tirinha é só a linha de
        navegação, o estádio vem logo abaixo dela, como sempre.<br><br>
        Nenhuma regra, nenhum número e nenhum save são tocados. Commit isolado, revertível.`)}
      ${bloco('⚖️ O contra (pra você decidir sabendo)', '#FBE7E3', `
        A tirinha é <b>mais discreta</b> que as pílulas coloridas de hoje. Quem já joga há tempo talvez ache que
        "sumiu" no primeiro dia — a ativa fica em roxo com sublinhado, mas não é aquele bloco cheio de cor.<br><br>
        Se você preferir, dá pra fazer um <b>meio-termo</b>: tirinha fina que gruda no topo, mas com a ativa em
        <b>pílula roxa cheia</b> dentro dela. Me fala qual dos dois e eu faço.`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-sub-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
