// ─── 🎩 "SE TELÊ = PEP, TANTO FAZ?" + COMO SE CONTRATA (Diego 24/08) ───────
//
// Ele achou o buraco da minha proposta: *"Mas eu daria p todos técnicos do
// jogo? Como seria a compra deles? Enfim... Se o Telê é a msm coisa q Pep
// Guardiola então tanto faz??"*. Tinha razão: se todo técnico dá +2 no time
// inteiro e só muda QUANTAS formações domina, duas lendas viram a mesma coisa.
//
// 🔧 A CORREÇÃO: o bônus cai num **SETOR**, não no time todo.
//    Telê = +3 nos ATACANTES · Pep = +3 nos MEIAS · Muralha = +3 nos ZAGUEIROS.
//    Continua UM número (a simplificação dele sobrevive), mas nunca mais é
//    "tanto faz": quem decide o melhor técnico é o SEU elenco.
//    ✅ Barato no código: `rollForm()` já soma por setor (`by('ATA')` etc.).
//
// 📏 MEDIDO em `scripts/mede-overall-setor.mjs` (40 temporadas por linha, motor
//    real). Os números desta tela são a saída literal — inclusive os que
//    CONTRARIARAM o que eu tinha suposto (está escrito na tela).
//
//   node scripts/mockup-tecnico-setor-compra.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tecnico-setor.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED', BLUE = '#2F6BAE'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// saída literal de mede-overall-setor.mjs (elenco forte · 4-4-2 · 40 temporadas)
const SETORES = [
  ['sem técnico', 0, 69.4, 19, 1],
  ['TIME TODO', 2, 75.0, 24, 1],
  ['⚔️ atacantes', 2, 71.7, 21, 0],
  ['🎩 meias', 2, 72.5, 23, 0],
  ['🧱 zagueiros', 2, 72.3, 24, 0],
  ['🏃 laterais', 2, 71.7, 25, 0],
  ['🧤 goleiro', 2, 73.0, 25, 0],
]

const tabSetor = `
  <div style="${box('#fff')};padding:12px">
    <p style="${OSW};font-size:14px;margin:0 0 1px">📏 O que medi: +2 num setor só</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 8px">
      Elenco forte · 4-4-2 · 40 temporadas por linha · motor real.</p>
    <table style="width:100%;border-collapse:collapse;font-family:system-ui;font-size:11px;font-weight:700">
      <tr style="color:rgba(0,0,0,.45);font-size:9px;text-transform:uppercase">
        <td style="padding:0 0 4px">onde cai o +2</td><td style="padding:0 0 4px;text-align:right">pts/temp</td>
        <td style="padding:0 0 4px;text-align:right">títulos em 40</td></tr>
      ${SETORES.map(([n, b, p, t, destaque]) => `
      <tr style="border-top:1.5px solid rgba(0,0,0,.1);${destaque ? 'background:#FBF6E9' : ''}">
        <td style="padding:5px 0;${destaque ? OSW : ''};font-size:${destaque ? 12 : 11}px">${n}</td>
        <td style="padding:5px 0;text-align:right">${p.toFixed(1)}</td>
        <td style="padding:5px 0;text-align:right;${OSW};font-size:12.5px">${t}</td></tr>`).join('')}
    </table>
    <p style="font-family:system-ui;font-size:10.5px;font-weight:700;margin:9px 0 0;line-height:1.45;
      border-top:2px solid ${INK};padding-top:8px">
      👉 <b>Setor vale mais ou menos METADE</b> do time todo (+2,5 pts contra +5,6). Ou seja:
      <b>é a faixa segura</b> — dá pra sentir e não trivializa.<br><br>
      🤔 <b>E o mais importante:</b> nenhum setor é o "melhor" — todos ficaram entre 21 e 25 títulos, que é
      empate técnico em 40 temporadas. <b>Isso é ÓTIMO</b>: significa que nenhum técnico nasce
      automaticamente melhor que outro. Quem desempata é o SEU elenco.</p>
  </div>`

// as duas fichas, agora DIFERENTES
const ficha = (nome, sub, grad, setor, forms, quando) => `
  <div style="${box('#fff')};overflow:hidden;margin-bottom:9px">
    <div style="background:${grad};border-bottom:3px solid ${INK};padding:8px 11px">
      <p style="${OSW};font-size:14.5px;margin:0;text-transform:uppercase">${nome}</p>
      <p style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(0,0,0,.55);margin:1px 0 0">${sub}</p>
    </div>
    <div style="padding:9px 11px">
      <p style="${OSW};font-size:15px;margin:0;color:${GREEN}">${setor}</p>
      <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);margin:4px 0 0;line-height:1.4">
        📋 ${forms}</p>
      <p style="font-family:system-ui;font-size:10.5px;font-weight:700;margin:6px 0 0;line-height:1.4;
        background:#FBF6E9;border-radius:8px;padding:6px 8px">${quando}</p>
    </div>
  </div>`

// ── a tela de contratar ────────────────────────────────────────────────────
const candidato = (ic, nome, tier, cor, setor, forms, luvas, salario, sel) => `
  <div style="${box(sel ? '#E9F5EC' : '#fff')};padding:9px 10px;margin-bottom:7px;border-color:${sel ? GREEN : INK}">
    <div style="display:flex;gap:8px;align-items:center">
      <span style="flex:none;width:32px;height:32px;border-radius:9px;border:2.5px solid ${INK};background:${cor};
        display:flex;align-items:center;justify-content:center;font-size:15px">${ic}</span>
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:12.5px;margin:0;text-transform:uppercase">${nome}
          <span style="font-size:8px;border:2px solid ${INK};border-radius:999px;padding:0 6px;background:${cor};margin-left:3px">${tier}</span></p>
        <p style="font-family:system-ui;font-size:10px;font-weight:800;color:${GREEN};margin:2px 0 0">${setor}</p>
      </div>
      <span style="flex:none;width:20px;height:20px;border-radius:6px;border:2.5px solid ${INK};
        background:${sel ? GREEN : '#fff'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px">${sel ? '✓' : ''}</span>
    </div>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:5px 0 0">📋 ${forms}</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;margin:3px 0 0">
      <span style="color:#B8860B">🪙 ${luvas} pra fechar</span> · <span style="color:${RED}">💸 ${salario}/mês</span></p>
  </div>`

const telaCompra = `
  <div style="border:5px solid ${INK};border-radius:22px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden;width:340px">
    <div style="background:${INK};padding:9px 12px;color:#fff;display:flex;justify-content:space-between;align-items:center">
      <span style="${OSW};font-size:12px">🎩 MESA DE TÉCNICOS</span>
      <span style="font-family:system-ui;font-size:8.5px;font-weight:800;color:rgba(255,255,255,.5)">PRÉ-TEMPORADA · T7</span>
    </div>
    <div style="padding:11px">
      <p style="font-family:system-ui;font-size:11px;font-weight:700;margin:0 0 9px;line-height:1.45">
        Três treinadores toparam dirigir o <b>Neymarzetti</b> na Série C. Escolha um — ou siga sem técnico.</p>
      ${candidato('🎩', 'O Artilheiro', '⭐', 'linear-gradient(160deg,#F4F7FB,#CBD4DE)', '+3 nos ATACANTES', '4-3-3 · 3-4-3 · 4-4-2 · losango', 60, 8, 1)}
      ${candidato('🧱', 'O Muralha', '🟢', 'linear-gradient(160deg,#41C07A,#2E9E5B)', '+3 nos ZAGUEIROS', '5-3-2 · 4-5-1 · 4-4-2', 25, 4, 0)}
      ${candidato('🌱', 'O Estreante', '⚪', 'linear-gradient(160deg,#EFE9D6,#CBBF9E)', '+3 nos MEIAS', '4-2-3-1', 5, 1, 0)}
      <div style="${box('#FFF6D6')};padding:9px 10px;margin-top:9px;font-family:system-ui;font-size:10px;font-weight:700;line-height:1.45">
        💡 Você tem <b>4 atacantes bons</b> no elenco — o Artilheiro rende mais no seu time.</div>
      <div style="display:flex;gap:6px;margin-top:9px">
        <div style="flex:1;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};
          padding:9px 0;text-align:center;${OSW};font-size:12px">✅ CONTRATAR</div>
        <div style="flex:none;background:#fff;border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};
          padding:9px 12px;${OSW};font-size:12px">sigo sem</div>
      </div>
      <p style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.45);margin:7px 0 0;text-align:center">
        contrato de 2 temporadas · o salário entra na folha do mês</p>
    </div>
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩 VOCÊ ACHOU O BURACO — E TEM CONSERTO</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    O BÔNUS CAI NUM <span style="color:${GREEN}">SETOR</span>, NÃO NO TIME</h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1200px;line-height:1.5;margin:0 0 22px">
    Você tinha razão: se todo técnico dá "+2 no time" e só muda quantas formações domina, <b>Telê e Pep viram a
    mesma coisa</b>. O conserto é de uma palavra: <b>Telê dá +3 nos ATACANTES, Pep dá +3 nos MEIAS.</b>
    Continua UM número só (a sua simplificação sobrevive) — mas agora <b>quem decide o melhor técnico é o SEU
    elenco</b>, e nunca mais é tanto faz.
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:26px">
    <div style="flex:0 0 340px">
      <div style="${OSW};font-size:15px;text-transform:uppercase;color:${PURPLE};margin-bottom:8px">Agora eles são diferentes</div>
      ${ficha('Telê Santana', '👑 LENDA · futebol-arte', 'linear-gradient(160deg,#FFE79A,#FFC400)',
        '+3 nos ATACANTES', '4-2-4 · 4-3-3 · 3-4-3 · losango · 3-5-2',
        '⚡ Vale a pena se o seu <b>ataque</b> é o forte do elenco.')}
      ${ficha('Pep Guardiola', '👑 LENDA · posse de bola', 'linear-gradient(160deg,#C9A9FF,#8B5CF6)',
        '+3 nos MEIAS', '4-2-3-1 · 4-5-1 · 4-3-2-1 · 4-3-3 · 3-5-2',
        '⚡ Vale a pena se o seu <b>meio-campo</b> é o forte do elenco.')}
      <div style="${box('#E6F3EA')};padding:11px 12px;font-family:system-ui;font-size:11px;font-weight:700;line-height:1.5">
        ✅ <b>Nunca mais "tanto faz":</b> com 4 atacantes craques e meias fracos, o Telê é MUITO melhor pra
        você — e o Pep é dinheiro jogado fora. Com o elenco invertido, troca. <b>O mesmo técnico é ótimo pra
        um e ruim pro outro</b>, que é o que você queria.</div>
    </div>

    <div style="flex:0 0 340px">
      ${tabSetor}
    </div>

    <div style="flex:0 0 340px">
      <div style="${OSW};font-size:15px;text-transform:uppercase;color:${BLUE};margin-bottom:8px">Como se contrata</div>
      ${telaCompra}
    </div>

    <div style="flex:1;min-width:390px">
      ${bloco('🛒 A compra, em 5 regras', '#E3EEF9', `
        <b>1. QUANDO:</b> na virada da temporada (pré-temporada), dentro da Sala da Presidência.
        <b>Nunca no meio do pregão</b> — sua regra de ouro é não atrasar o ritmo do leilão.<br>
        <b>2. QUEM APARECE:</b> 3 candidatos sorteados <b>que aceitam a sua divisão</b> (na Várzea não aparece
        lenda — ela nem atende).<br>
        <b>3. QUANTO CUSTA:</b> 🪙 luvas uma vez pra fechar + 💸 salário todo mês na folha (usa o
        <code>squadPayroll</code> que já existe).<br>
        <b>4. CONTRATO:</b> 2 temporadas. Demitir antes paga multa.<br>
        <b>5. DÁ PRA NÃO TER:</b> "sigo sem técnico" é sempre um botão — e aí o jogo é <b>igualzinho ao de
        hoje</b>. Nenhuma carreira antiga muda.`)}
      ${bloco('🤥 ONDE EU ESTAVA ERRADO (o dado desmentiu)', '#FFF0EC', `
        Eu te disse que <b>"o esquema do técnico amplia o bônus dele"</b> — tipo, o Telê jogando 4-2-4 com 4
        atacantes renderia mais que num 4-4-2 com 2.<br><br>
        <b>Medi e é MENTIRA.</b> Com o mesmo +3 nos atacantes: 4-4-2 (2 atacantes) deu <b>26 títulos</b>,
        e 4-3-3 (3 atacantes) deu <b>16</b>. O motivo é que <b>trocar de formação mexe MUITO mais no time
        do que o técnico</b> — o 3-4-3, por exemplo, tira um zagueiro e a defesa despenca.<br><br>
        Prefiro te falar isso do que deixar a promessa de pé. E é uma boa notícia: significa que
        <b>a formação já é uma decisão forte sozinha</b> — o técnico é tempero, não motor.`)}
      ${bloco('🙋 Me responde', '#fff', `
        <b>1.</b> Fecha <b>bônus por SETOR</b> (+3), cada técnico no seu?<br>
        <b>2.</b> Fecha a <b>mesa de 3 candidatos</b> na pré-temporada, com luvas + salário?<br>
        <b>3.</b> Fecha o botão <b>"sigo sem técnico"</b> sempre disponível?<br><br>
        Com isso o técnico vira uma ficha de <b>4 linhas</b>: nome · tier · <b>setor do bônus</b> · formações.
        Aí eu escrevo os 100 e te mando pra aprovar nome por nome.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">medido com scripts/mede-overall-setor.mjs</span></p>
</body></html>`

const tmp = `/tmp/mockup-tecset-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
