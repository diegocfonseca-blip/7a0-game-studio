// ─── 📏 "SÓ FORMAÇÃO + OVERALL" — MEDIDO NO MOTOR (Diego 24/08) ────────────
//
// Pergunta dele: *"E se botarmos apenas formação q libera e overall tb?? Mas
// isso implicaria em deixar o time mais forte e etc?? Oq diz??"*
//
// NÃO respondi de cabeça: rodei `scripts/mede-overall-tecnico.mjs`, que usa o
// MOTOR REAL (buildPyramid + simulatePyramid) e joga 40 temporadas com o mesmo
// mundo e a mesma semente, mudando só o overall do elenco. Os números desta
// tela são a saída literal daquele script.
//
// 🚨 O ACHADO QUE DECIDE TUDO: com **+8**, o elenco forte ganhou **40 títulos em
// 40 temporadas** — 100%. O campeonato deixa de existir. Já **+1/+2** dá pra
// sentir sem quebrar. É a diferença entre tempero e cheat.
//
// 💡 A SAÍDA que mantém a simplificação DELE e mata a escada: **todo técnico dá
// o MESMO bônus; o tier muda só QUANTAS formações ele domina.** Aí lenda não é
// mais forte — é mais FLEXÍVEL. E um estreante cuja única formação combina com
// o seu elenco vale tanto quanto uma lenda.
//
//   node scripts/mockup-overall-tecnico.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'overall-tecnico.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED', BLUE = '#2F6BAE'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// saída LITERAL de scripts/mede-overall-tecnico.mjs (40 temporadas cada linha)
const FORTE = [
  [0, 69.4, 0, 19], [1, 72.1, 2.7, 24], [2, 75.0, 5.6, 24],
  [3, 76.1, 6.7, 27], [5, 78.6, 9.2, 31], [8, 82.6, 13.2, 40],
]
const FRACO = [
  [0, 18.8, 0, 5], [1, 20.9, 2.1, 8], [2, 21.1, 2.3, 6],
  [3, 24.8, 6.0, 4], [5, 29.6, 10.8, 7], [8, 38.0, 19.2, 3],
]

const tabela = (tit, dados, cor, nota) => `
  <div style="${box('#fff')};padding:12px;margin-bottom:11px">
    <p style="${OSW};font-size:14px;margin:0 0 1px;text-transform:uppercase;color:${cor}">${tit}</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 8px">${nota}</p>
    <table style="width:100%;border-collapse:collapse;font-family:system-ui;font-size:11px;font-weight:700">
      <tr style="color:rgba(0,0,0,.45);font-size:9px;text-transform:uppercase">
        <td style="padding:0 0 4px">bônus</td><td style="padding:0 0 4px">pts/temp</td>
        <td style="padding:0 0 4px">a mais</td><td style="padding:0 0 4px;text-align:right">títulos em 40</td></tr>
      ${dados.map(([b, p, d, t]) => {
        const perigo = t >= 38
        return `<tr style="border-top:1.5px solid rgba(0,0,0,.1);${perigo ? `background:#FFE9E4` : ''}">
        <td style="padding:5px 0;${OSW};font-size:12.5px">+${b}</td>
        <td style="padding:5px 0">${p.toFixed(1)}</td>
        <td style="padding:5px 0;color:${d > 0 ? GREEN : 'rgba(0,0,0,.4)'}">${d > 0 ? '+' : ''}${d.toFixed(1)}</td>
        <td style="padding:5px 0;text-align:right;${OSW};font-size:13px;color:${perigo ? RED : INK}">${t}${perigo ? ' 🚨' : ''}</td></tr>`
      }).join('')}
    </table>
  </div>`

// barra visual dos títulos
const barraTit = (b, t, cor) => `
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
    <span style="${OSW};font-size:11px;width:26px;flex:none;color:rgba(0,0,0,.5)">+${b}</span>
    <div style="flex:1;height:15px;border:2px solid ${INK};border-radius:999px;background:#EFE9D6;overflow:hidden">
      <div style="height:100%;width:${(t / 40 * 100).toFixed(0)}%;background:${cor}"></div></div>
    <span style="${OSW};font-size:11px;width:52px;flex:none;text-align:right">${(t / 40 * 100).toFixed(0)}%</span>
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

// a proposta: mesmo bônus pra todos, tier muda só a flexibilidade
const TIERS = [
  ['👑', 'Lenda', 5, 'linear-gradient(160deg,#FFE79A,#FFC400)', INK],
  ['⭐', 'Craque', 4, 'linear-gradient(160deg,#F4F7FB,#CBD4DE)', INK],
  ['🟢', 'Bom', 3, 'linear-gradient(160deg,#41C07A,#2E9E5B)', '#fff'],
  ['🔵', 'Profissional', 2, 'linear-gradient(160deg,#7FB2E5,#2F6BAE)', '#fff'],
  ['⚪', 'Estreante', 1, 'linear-gradient(160deg,#EFE9D6,#CBBF9E)', INK],
]
const tierLinha = ([ic, nome, n, grad, cor]) => `
  <div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-top:1.5px solid rgba(0,0,0,.1)">
    <span style="flex:none;width:30px;height:30px;border-radius:9px;border:2.5px solid ${INK};background:${grad};color:${cor};
      display:flex;align-items:center;justify-content:center;font-size:15px">${ic}</span>
    <span style="flex:1;${OSW};font-size:13px;text-transform:uppercase">${nome}</span>
    <span style="font-family:system-ui;font-size:11px;font-weight:800;color:${PURPLE}">${n} ${n > 1 ? 'formações' : 'formação'}</span>
    <span style="${OSW};font-size:13px;color:${GREEN};width:34px;text-align:right">+2</span>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${RED};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">📏 MEDIDO NO MOTOR · 40 TEMPORADAS POR LINHA</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    SIM, DEIXA MAIS FORTE — <span style="color:${RED}">E EU MEDI QUANTO</span></h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1200px;line-height:1.5;margin:0 0 22px">
    Não respondi de cabeça: rodei o <b>motor de verdade</b> (o mesmo do celular do jogador) por 40 temporadas em cada
    linha, com o mesmo mundo e a mesma semente — mudando <b>só o overall</b>. Os números abaixo são a saída literal.
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:26px">
    <div style="flex:0 0 350px">
      ${tabela('Elenco FORTE', FORTE, GOLD, 'Um time que já era candidato a título.')}
      ${tabela('Elenco FRACO', FRACO, '#8a7d59', 'Um time de baixo, brigando pra não cair.')}
    </div>

    <div style="flex:0 0 350px">
      <div style="${box('#FFF0EC')};padding:13px;margin-bottom:12px">
        <p style="${OSW};font-size:15px;margin:0 0 3px;text-transform:uppercase;color:${RED}">🚨 O achado que decide tudo</p>
        <p style="font-family:system-ui;font-size:11.5px;font-weight:700;margin:0 0 10px;line-height:1.45">
          Quantas vezes o <b>elenco forte foi campeão</b>, em 40 temporadas:</p>
        ${FORTE.map(([b, , , t]) => barraTit(b, t, t >= 38 ? RED : t >= 30 ? '#E8A200' : GREEN)).join('')}
        <p style="font-family:system-ui;font-size:11.5px;font-weight:700;margin:9px 0 0;line-height:1.5;
          border-top:2px solid ${INK};padding-top:8px">
          Com <b style="color:${RED}">+8 o time ganhou TODAS as 40</b>. O campeonato deixa de existir — não tem
          mais o que jogar. <b>+1 e +2</b> dá pra sentir (19 → 24 títulos) sem matar a graça.</p>
      </div>
      <div style="${box('#E3EEF9')};padding:12px;font-family:system-ui;font-size:11.5px;font-weight:700;line-height:1.5">
        📉 <b>E olha a virada de mesa:</b> no elenco FRACO o mesmo +8 quase <b>dobrou</b> os pontos (18,8 → 38).
        Ou seja: um bônus grande <b>não é grande igual pra todo mundo</b> — ele salva o fraco e trivializa o forte.
        É por isso que o número tem que ser pequeno.</div>
    </div>

    <div style="flex:1;min-width:400px">
      ${bloco('✅ SUA SIMPLIFICAÇÃO FUNCIONA — com 2 travas', '#E6F3EA', `
        <b>Sim, dá pra deixar só formação + overall.</b> Fica bem mais simples de entender e de fazer.
        Mas precisa de duas travas, senão vira aquilo que você mesmo já rejeitou (escada onde todo mundo quer
        só o topo):<br><br>
        <b>1. O bônus é PEQUENO: +2.</b> Medido: dá pra sentir, e o campeonato continua de pé. De +5 pra cima
        começa a estragar; +8 mata.<br><br>
        <b>2. O bônus SÓ VALE dentro das formações dele.</b> Jogou no esquema do técnico, ganha o +2. Jogou
        fora, joga sem — e a tela avisa. É a sua zoeira virando regra: <i>"quem manda é você… mas tem preço"</i>.`)}
      ${bloco('🔑 A sacada que MATA a escada de vez', '#FFF6D6', `
        <b>Todo técnico dá o MESMO +2. O tier muda só QUANTAS formações ele domina.</b>
        <div style="${box('#fff')};padding:9px 11px;margin:10px 0 0">
          ${TIERS.map(tierLinha).join('')}
        </div><br>
        Assim <b>lenda não é mais FORTE — é mais FLEXÍVEL</b>. Ela te dá 5 caminhos pro +2; o estreante te dá 1.<br><br>
        E olha que bonito: <b>um estreante cuja única formação combina com o seu elenco vale TANTO quanto uma
        lenda</b> — e custa uma fração do salário. Aí escolher técnico vira decisão de verdade, que era
        exatamente o seu medo (Telê 5 × Renato 3 não podia ser a única diferença).`)}
      ${bloco('🤔 O que você PERDE simplificando (pra decidir sabendo)', '#EDE7FF', `
        Cortando os 5 eixos pra 2, somem: o <b>ponto fraco</b> de cada técnico, o <b>temperamento</b>, e a
        <b>exigência</b> (lenda que vai embora se não for campeã).<br><br>
        Minha opinião honesta: <b>tudo bem cortar agora.</b> Começa simples (formação + overall), vê se a galera
        gosta, e os outros eixos entram depois <b>sem refazer nada</b> — são campos novos na mesma ficha.
        Fazer os 5 de cara é onde a coisa fica "difícil", que foi a palavra que você usou.`)}
      ${bloco('🙋 Me responde', '#fff', `
        <b>1.</b> Fecha <b>formação + overall +2</b>, e o resto fica pra depois?<br>
        <b>2.</b> Fecha <b>mesmo bônus pra todos, tier = quantas formações</b>?<br>
        <b>3.</b> Fecha o <b>+2 só dentro das formações dele</b>?<br><br>
        Fechando isso, o técnico vira uma ficha <b>de 3 linhas</b> (nome · tier · formações) — e aí sim eu escrevo
        os 100 rapidinho, porque é dado, não regra nova.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">medido com scripts/mede-overall-tecnico.mjs</span></p>
</body></html>`

const tmp = `/tmp/mockup-ovtec-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
