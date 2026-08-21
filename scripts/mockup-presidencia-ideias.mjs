// ─── 🎩 SALA DA PRESIDÊNCIA · O "ALGO A MAIS" ──────────────────────────────
//
// Diego (21/08): *"e esse mockup aí mesmo, porém, além disso eu queria mais
// coisas pessoais… como se ele fosse presidente de um clube mesmo… acho que
// falta aquele algo a mais. Me dê ideias"*.
//
// 🔎 O QUE EU FUI CONFERIR NO SAVE ANTES DE INVENTAR (types.ts):
//   ✅ `careerScorersAll` — artilharia de TODOS OS TEMPOS por jogador. De graça.
//   ✅ `careerLedger` — extrato com `player`, `pos` e `buyPrice`: dá pra saber a
//      contratação MAIS CARA e a venda MAIS LUCRATIVA da história do clube.
//   ✅ `careerRivals` — o rival fixo da carreira já existe e tem vida própria.
//   ✅ `careerHonors` / `careerPlacements` — títulos e divisão por temporada.
//   ⚠️ NÃO existe histórico de placar jogo a jogo: "maior goleada", "maior
//      sequência de vitórias" e o retrospecto contra o rival precisariam guardar
//      um punhado de números novos por carreira (pouca coisa, mas é trabalho).
//
// Por isso cada ideia abaixo vem MARCADA: 🟢 sai do save de hoje · 🟡 precisa
// guardar coisa nova.
//
// 🚫 Não entra nada da lista de descartados do Diego (08/08): recado do
// presidente · faixa da torcida · placas · aniversário · pacote coração.
//
//   node scripts/mockup-presidencia-ideias.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'presidencia-ideias.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// cartão de IDEIA: número, título, o selo de custo, o desenho e o porquê
const ideia = (n, tit, custo, fonte, visual, porque) => {
  const c = custo === 'ja' ? GREEN : '#B8860B'
  const txt = custo === 'ja' ? '🟢 SAI DO SAVE DE HOJE' : '🟡 PRECISA GUARDAR COISA NOVA'
  return `
  <div style="flex:0 0 400px;${box('#fff')};overflow:hidden">
    <div style="background:${INK};padding:9px 12px;display:flex;align-items:center;gap:8px">
      <span style="${OSW};font-size:12px;background:${GOLD};color:${INK};border-radius:6px;padding:1px 8px">${n}</span>
      <span style="${OSW};font-size:15px;color:#fff;flex:1">${tit}</span>
    </div>
    <div style="padding:11px 12px 12px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:9px;flex-wrap:wrap">
        <span style="${OSW};font-size:8.5px;letter-spacing:.05em;border:2px solid ${c};color:${c};border-radius:6px;padding:1px 6px">${txt}</span>
        <span style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.42)">${fonte}</span>
      </div>
      ${visual}
      <p style="font-family:system-ui;font-size:11.5px;font-weight:600;color:rgba(0,0,0,.62);line-height:1.45;margin:10px 0 0">${porque}</p>
    </div>
  </div>`
}

const mini = inner => `<div style="border:2.5px solid ${INK};border-radius:12px;background:#FBF6E9;padding:10px 11px">${inner}</div>`
const rotmini = t => `<div style="${OSW};font-size:9px;letter-spacing:.08em;opacity:.5;margin:0 0 6px">${t}</div>`
const linhaRec = (ic, o_que, quem, val) => `
  <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1.5px solid rgba(12,12,12,.10)">
    <span style="font-size:14px">${ic}</span>
    <div style="flex:1;min-width:0">
      <div style="font-family:system-ui;font-size:8.5px;font-weight:800;color:rgba(0,0,0,.42);text-transform:uppercase">${o_que}</div>
      <div style="${OSW};font-size:12px;line-height:1.1">${quem}</div>
    </div>
    <span style="${OSW};font-size:12px;white-space:nowrap">${val}</span>
  </div>`

// ── as ideias ──────────────────────────────────────────────────────────────
const I1 = ideia(1, '🙋 Você, o presidente', 'ja', 'um campo na conta',
  mini(`${rotmini('COMO FICA NO TOPO DA SALA')}
    <div style="${OSW};font-size:17px;line-height:1.1">Diego Fonseca</div>
    <div style="font-family:system-ui;font-size:11px;font-weight:700;font-style:italic;color:${PURPLE};margin-top:2px">"O Magnata da Várzea"</div>
    <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin-top:3px">Presidente do Neymarzetti desde 27/07/2026</div>`),
  'Hoje a pessoa <b>é o nome do time</b>. Aqui ela vira gente: o próprio nome e um <b>apelido de imprensa</b> que ela escolhe. Custa um campo de texto e muda tudo na hora de se ver na tela.')

const I2 = ideia(2, '📖 O Livro de Recordes do clube', 'misto', 'artilharia de todos os tempos + extrato',
  mini(`${rotmini('OS RECORDES DO NEYMARZETTI')}
    ${linhaRec('👑', 'Artilheiro de todos os tempos', 'Gabigol', '84 gols')}
    ${linhaRec('💸', 'Contratação mais cara', 'Zico · MEI', '47 🪙')}
    ${linhaRec('📈', 'Venda mais lucrativa', 'Rayan · ATA', '+38 🪙')}
    ${linhaRec('🥅', 'Maior goleada', 'vs Manfré FC · T7', '6 × 0')}
    ${linhaRec('🔥', 'Maior sequência', 'T7 · rodadas 12 a 20', '9 vitórias')}`),
  'É a <b>memória do clube dele</b>, e ninguém tem a mesma. Os 3 primeiros <b>já dá pra fazer hoje</b> (a artilharia histórica e o extrato de compra/venda já são guardados). Goleada e sequência precisam guardar dois numerinhos por temporada.')

const I3 = ideia(3, '⚔️ O seu rival', 'novo', 'careerRivals + retrospecto novo',
  mini(`${rotmini('O CLÁSSICO')}
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:4px 0">
      <div style="text-align:center"><div style="${OSW};font-size:13px;color:${PURPLE}">Neymarzetti</div>
      <div style="${OSW};font-size:24px;line-height:1">7</div></div>
      <div style="text-align:center"><div style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(0,0,0,.4)">EMPATES</div>
      <div style="${OSW};font-size:17px;line-height:1;color:rgba(0,0,0,.45)">4</div></div>
      <div style="text-align:center"><div style="${OSW};font-size:13px">Skyy FC</div>
      <div style="${OSW};font-size:24px;line-height:1">5</div></div>
    </div>
    <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);text-align:center;border-top:1.5px solid rgba(12,12,12,.1);padding-top:6px">
      16 jogos em 12 temporadas · última: <b>2 × 1 pra você</b></div>`),
  'O rival fixo <b>já existe</b> na carreira e tem vida própria na pirâmide. Só falta o jogo <b>lembrar do retrospecto</b>. É a coisa mais "clube de verdade" que dá pra ter — e vira assunto sozinho.')

const I4 = ideia(4, '🏟️ Batizar o estádio', 'ja', 'um campo + o nome já usado no jornal',
  mini(`${rotmini('O NOME É SEU')}
    <div style="display:flex;align-items:center;gap:9px">
      <span style="font-size:26px">🏟️</span>
      <div><div style="${OSW};font-size:15px;line-height:1.1">Arena do Zé</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5)">18.400 lugares · casa do Neymarzetti</div></div>
    </div>
    <div style="font-family:system-ui;font-size:10px;font-weight:600;color:rgba(0,0,0,.55);margin-top:8px;border-top:1.5px solid rgba(12,12,12,.1);padding-top:6px;line-height:1.4">
      No jornal: <i>"O Neymarzetti recebeu o Skyy FC na <b>Arena do Zé</b> e venceu por 2 × 1."</i></div>`),
  'É <b>a decisão mais de presidente que existe</b> — e é de graça. O nome entra no jornal, na bilheteria e no fim de temporada. Cada carreira passa a ter uma casa com nome próprio.')

const I5 = ideia(5, '🪑 A sala que cresce', 'ja', 'patrimônio, que já é calculado',
  mini(`${rotmini('A SALA MUDA COM O CLUBE')}
    <div style="display:flex;gap:7px">
      ${[['🪑', 'Várzea', 'banquinho', 0], ['🛋️', 'Série C', 'poltrona', 1], ['👑', 'Série A', 'trono', 0]].map(e => `
        <div style="flex:1;border:2.5px solid ${INK};border-radius:10px;background:${e[3] ? GOLD : '#fff'};padding:8px 4px;text-align:center;${e[3] ? '' : 'opacity:.55'}">
          <div style="font-size:22px;line-height:1">${e[0]}</div>
          <div style="${OSW};font-size:9.5px;margin-top:3px">${e[1]}</div>
          <div style="font-family:system-ui;font-size:8px;font-weight:700;color:rgba(0,0,0,.5)">${e[2]}</div></div>`).join('')}
    </div>`),
  'A mesma ideia do <b>carro</b> que você já aprovou, mas <b>dentro da sala</b>: a cadeira, a mesa e o quadro da parede mudam conforme o patrimônio. É <b>0 KB</b> (emoji + CSS) e dá aquela sensação de estar subindo na vida.')

const I6 = ideia(6, '👑 A galeria de ídolos', 'ja', 'artilharia de todos os tempos',
  mini(`${rotmini('QUEM FEZ HISTÓRIA AQUI')}
    ${[['Gabigol', 'ATA', '84 gols · 6 temporadas'], ['Zico', 'MEI', '51 gols · 4 temporadas'], ['Alex Muralha', 'GOL', '112 jogos · 5 temporadas']].map((p, i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:5px 0;${i > 0 ? 'border-top:1.5px solid rgba(12,12,12,.10)' : ''}">
        <span style="${OSW};font-size:11px;width:16px;color:rgba(0,0,0,.35)">${i + 1}º</span>
        <span style="${OSW};font-size:8.5px;border:2px solid ${INK};border-radius:5px;padding:0 5px;background:#EDE6D4">${p[1]}</span>
        <span style="${OSW};font-size:12.5px;flex:1">${p[0]}</span>
        <span style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.5);white-space:nowrap">${p[2]}</span>
      </div>`).join('')}`),
  'Os jogadores que <b>mais fizeram pelo SEU clube</b> ao longo das temporadas. Sai da artilharia histórica que o jogo <b>já guarda</b>. Depois dá pra ir além: <b>aposentar a camisa</b> de um ídolo.')

const I7 = ideia(7, '📤 O cartão do mandato', 'ja', 'tudo que já está na sala',
  mini(`${rotmini('PRA POSTAR')}
    <div style="border:2.5px solid ${INK};border-radius:10px;background:linear-gradient(160deg,#1F8C4A,#0d3f21);color:#fff;padding:10px;text-align:center">
      <div style="${OSW};font-size:8.5px;letter-spacing:.1em;color:rgba(255,255,255,.6)">12 TEMPORADAS COMO PRESIDENTE</div>
      <div style="${OSW};font-size:19px;color:${GOLD};margin-top:2px">NEYMARZETTI</div>
      <div style="font-family:system-ui;font-size:10px;font-weight:700;margin-top:3px">🏆 5 títulos · 🪙 8.866 de patrimônio · Série C</div>
      <div style="font-family:system-ui;font-size:8.5px;font-weight:700;color:rgba(255,255,255,.55);margin-top:5px">leilaolegends.com</div>
    </div>`),
  'Um botão que gera a <b>imagem do seu mandato</b> pra postar. Não é só vaidade: <b>é o seu marketing</b> — cada presidente vira um cartaz do jogo, de graça, com o link. O gerador de story <b>já existe</b> no repo.')

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩 SALA DA PRESIDÊNCIA · O ALGO A MAIS</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    7 IDEIAS PRA SALA VIRAR <span style="color:${RED}">A HISTÓRIA DELE</span></h1>
  <p style="font-size:14px;font-weight:600;max-width:1080px;line-height:1.5;margin:0 0 6px">
    Fui no save antes de inventar. Achei três coisas guardadas que eu não sabia que existiam e que destravam quase tudo:
    a <b>artilharia de todos os tempos</b>, o <b>extrato com quem você comprou, por quanto e o lucro da venda</b>, e o
    <b>rival fixo</b> da carreira.
  </p>
  <p style="font-size:14px;font-weight:600;max-width:1080px;line-height:1.5;margin:0 0 22px">
    Cada ideia vem marcada: <b style="color:${GREEN}">🟢 sai do save de hoje</b> ou
    <b style="color:#B8860B">🟡 precisa guardar coisa nova</b>. Nada aqui muda regra de jogo — é tudo a sala <b>contando</b>
    o que você fez.
  </p>

  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:24px">
    ${I1}${I2}${I3}${I4}
  </div>
  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:26px">
    ${I5}${I6}${I7}
    <div style="flex:1;min-width:400px">
      ${bloco('⭐ Se eu tivesse que escolher 3', '#E6F3EA', `
        <b>1. 📖 O Livro de Recordes</b> — é o "algo a mais" que você está procurando. Ninguém tem os mesmos recordes,
        e é o que faz a pessoa dizer "esse clube é meu".<br><br>
        <b>2. 🏟️ Batizar o estádio</b> — a decisão mais de presidente que existe, custa quase nada, e o nome passa a
        aparecer no jornal toda temporada.<br><br>
        <b>3. 🙋 Você, o presidente</b> — o nome e o apelido de imprensa. É um campo de texto que transforma "o time"
        em "uma pessoa".`)}
    </div>
  </div>

  <div style="display:flex;gap:22px;flex-wrap:wrap">
    <div style="flex:1;min-width:430px">
      ${bloco('🛡️ O que nenhuma delas faz', '#F1EDE0', `
        <b>Nenhuma muda regra, número, prêmio ou save.</b> Tudo é a sala <b>contando</b> o que já aconteceu — do jeito
        que a gente combinou pra tela de fim de temporada.<br><br>
        <b>Nada atrasa o jogo</b>: não tem passo novo no pregão, nem espera. E <b>nada é arte pesada</b>: cadeira,
        trono e carro são emoji + CSS, 0 KB no bundle.<br><br>
        <b>Nome de clube real continua fora</b> — batizar o estádio é o nome que a PESSOA escreve, não o de um clube
        de verdade.`)}
    </div>
    <div style="flex:1;min-width:430px">
      ${bloco('⚠️ O que eu preciso te avisar', '#FFF6D6', `
        <b>A goleada, a sequência e o retrospecto do rival não existem hoje.</b> O jogo monta a tabela e joga fora os
        placares — não guarda jogo a jogo. Pra ter esses três, ele passa a guardar <b>um punhado de números por
        carreira</b> (o maior placar, a maior sequência, e o placar contra o rival).<br><br>
        É pouca coisa e não pesa no save, mas <b>só começa a valer da temporada em que entrar pra frente</b> —
        carreira antiga não tem como recuperar o que já passou. Prefiro te falar isso agora do que você descobrir
        depois achando que sumiu.`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-presid-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1780, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
