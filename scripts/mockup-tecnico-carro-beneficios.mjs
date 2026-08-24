// ─── 🎩🚗 TÉCNICO E CARRO: OS BENEFÍCIOS, NA MARRA DO CÓDIGO (Diego 24/08) ───
//
// Pedido: *"Sobre o técnico e o carro precisamos definir... Benefício e coisas
// práticas.."*, e antes disso: *"tem q ser coisa óbvia tipo ganhar desconto em
// negociação ou salário e renovação... coisas que realmente sejam claras"*.
//
// ⚖️ REGRA QUE MANDOU NESTE DESENHO (dele, 24/08): *"só quero q faça se tiver
// sentido e funcionar... N ser fake"*. Então CADA benefício aqui está amarrado
// a uma alavanca que JÁ EXISTE no motor, com o nome do arquivo do lado:
//   · `rollForm()` (pyramidseason) devolve atk/def — a tática já soma ±4/∓3 ali;
//   · `FORMATIONS` (types.ts) = 4-3-3 · 4-4-2 · 4-5-1 · 3-4-3 · 5-3-2;
//   · `renewCost()` e `squadPayroll()` (store.tsx) = renovação e folha;
//   · `marketValues` = preço de venda;
//   · `sorteiaEvento()` (eventos.ts) = lesão/noitada/expulsão — o Departamento
//     Médico JÁ tira lesão do sorteio (`temMedico`), então mexer aqui é rotina;
//   · `COPA_DIV_STRENGTH` soma força no mata-mata exatamente nesse formato;
//   · bilheteria (`gate`) e patrocínio/bico entram no `careerLedger`.
//
// 🚫 O QUE EU **NÃO** PROPUS, E POR QUÊ (honestidade antes de vender ideia):
//   · "Professor: promessa evolui mais rápido" — **jogador NÃO sobe de nível no
//     jogo hoje**. Não existe essa alavanca; seria construir um sistema inteiro.
//   · "Ônibus/avião cansam menos" — **cansaço não existe**. Era a amarração da
//     ideia velha de carros; sem ela, viagem é enfeite.
//
//   node scripts/mockup-tecnico-carro-beneficios.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tecnico-carro.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED', BLUE = '#2F6BAE'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// ── OS 6 TÉCNICOS ───────────────────────────────────────────────────────────
// Cada um: 1 benefício ÓBVIO (número na cara) + a formação preferida + a
// alavanca real que ele puxa.
const TECNICOS = [
  { ini: 'N', cor: '#2E6C9E', nome: 'O Negociador', form: '4-4-2',
    perk: 'Renovar contrato custa <b>−25%</b> e a folha do mês cai <b>−15%</b>.',
    lev: 'renewCost() · squadPayroll()', quando: 'Todo mês e toda renovação.' },
  { ini: 'A', cor: RED, nome: 'O Artilheiro', form: '4-3-3',
    perk: 'Jogando com <b>3 atacantes</b>, seu ataque sobe <b>+4</b>.',
    lev: 'rollForm().atk · FORMATIONS', quando: 'Todo jogo em que você usar 4-3-3 ou 3-4-3.' },
  { ini: 'M', cor: '#334155', nome: 'O Muralha', form: '5-3-2',
    perk: 'Jogando com <b>3 zagueiros</b>, sua defesa sobe <b>+5</b>.',
    lev: 'rollForm().def · FORMATIONS', quando: 'Todo jogo em que você usar 5-3-2.' },
  { ini: 'C', cor: GOLD, nome: 'O Copeiro', form: '4-4-2',
    perk: 'Nas <b>copas</b> (mata-mata), o time todo joga <b>+4</b> no ataque e na defesa.',
    lev: 'COPA_DIV_STRENGTH', quando: 'Copa Legends, Copa do Brasil, Supercopa.' },
  { ini: 'P', cor: GREEN, nome: 'O Paizão', form: '4-5-1',
    perk: 'Vestiário blindado: <b>metade</b> dos perrengues (noitada, expulsão, lesão).',
    lev: 'sorteiaEvento()', quando: 'Durante a temporada inteira.' },
  { ini: 'O', cor: PURPLE, nome: 'O Olheiro', form: '4-3-3',
    perk: 'Quem você vende sai <b>+20%</b> mais caro.',
    lev: 'marketValues', quando: 'Toda venda de jogador.' },
]

const cartaTec = t => `
  <div style="${box('#fff')};padding:10px 11px;margin-bottom:8px">
    <div style="display:flex;gap:10px;align-items:center">
      <span style="width:38px;height:38px;flex:none;border-radius:11px;border:2.5px solid ${INK};background:${t.cor};
        display:flex;align-items:center;justify-content:center;${OSW};font-size:18px;color:#fff">${t.ini}</span>
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:14.5px;margin:0;text-transform:uppercase;line-height:1.1">${t.nome}</p>
        <p style="font-family:system-ui;font-size:9.5px;font-weight:800;color:rgba(0,0,0,.45);margin:2px 0 0">
          esquema preferido dele: <b style="color:${INK}">${t.form}</b></p>
      </div>
    </div>
    <p style="font-family:system-ui;font-size:11.5px;font-weight:700;margin:8px 0 0;line-height:1.4;
      background:#FBF6E9;border-radius:9px;padding:7px 9px">${t.perk}</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45);margin:5px 0 0">
      ⏱️ ${t.quando} · <span style="font-family:ui-monospace,monospace;font-size:9px">${t.lev}</span></p>
  </div>`

// ── OS CARROS ───────────────────────────────────────────────────────────────
const CARROS = [
  { ic: '🚲', nome: 'A pé mesmo', preco: '—', perk: 'Como é hoje. Sem carro, sem nada.', tipo: 'nada' },
  { ic: '🚗', nome: 'Fusca 76', preco: '40 🪙', perk: 'Aparece no seu retrato e na carreata do título.', tipo: 'status' },
  { ic: '🛻', nome: 'Picape', preco: '120 🪙', perk: 'O bico do patrocinador rende <b>+10%</b>.', tipo: 'grana', lev: 'aposta do patrocínio' },
  { ic: '🏎️', nome: 'Esportivo', preco: '300 🪙', perk: 'Chegada filmada no clássico — <b>vira manchete</b> no jornal.', tipo: 'status' },
  { ic: '🚌', nome: 'Ônibus da delegação', preco: '600 🪙', perk: 'Bilheteria <b>+10%</b> (a torcida acompanha a caravana).', tipo: 'grana', lev: 'gate no careerLedger' },
  { ic: '✈️', nome: 'Avião do clube', preco: '1.500 🪙', perk: 'Bilheteria <b>+10%</b> e bico <b>+10%</b>, somados. O topo.', tipo: 'grana', lev: 'gate + patrocínio' },
]

const linhaCarro = c => `
  <div style="${box(c.tipo === 'nada' ? '#EFEADA' : '#fff')};padding:9px 11px;margin-bottom:7px;display:flex;gap:10px;align-items:center">
    <span style="font-size:26px;flex:none;line-height:1">${c.ic}</span>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-size:13px;margin:0;text-transform:uppercase">${c.nome}
        <span style="color:${c.tipo === 'nada' ? 'rgba(0,0,0,.4)' : GREEN};font-size:11px"> · ${c.preco}</span></p>
      <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.6);margin:2px 0 0;line-height:1.35">${c.perk}</p>
    </div>
    <span style="${OSW};font-size:8px;flex:none;border:2px solid ${INK};border-radius:6px;padding:1px 6px;
      background:${c.tipo === 'grana' ? '#DFF3E3' : c.tipo === 'status' ? '#EDE7FF' : '#fff'};color:${c.tipo === 'grana' ? GREEN : c.tipo === 'status' ? PURPLE : 'rgba(0,0,0,.4)'}">
      ${c.tipo === 'grana' ? '💰 GRANA' : c.tipo === 'status' ? '✨ STATUS' : '—'}</span>
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const col = (tit, cor, sub, inner) => `
  <div style="flex:0 0 348px">
    <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.05em;color:${cor}">${tit}</div>
    <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 10px;min-height:52px">${sub}</div>
    ${inner}
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩🚗 BENEFÍCIOS · O QUE CADA UM FAZ DE VERDADE</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    NADA AQUI É <span style="color:${RED}">ENFEITE</span></h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1180px;line-height:1.5;margin:0 0 6px">
    Sua regra: <i>"só faça se tiver sentido e funcionar, não ser fake"</i>. Então cada benefício abaixo está preso numa
    alavanca que <b>já existe no motor</b> — eu escrevi o nome dela em cinza embaixo de cada um, pra você poder cobrar.
  </p>
  <p style="font-size:13px;font-weight:600;max-width:1180px;line-height:1.5;margin:0 0 24px;color:${RED}">
    ⚠️ E já corto duas ideias antigas que <b>não dão</b>: "promessa evolui mais rápido" (jogador não sobe de nível no jogo
    hoje) e "ônibus cansa menos" (cansaço não existe). Prometer isso seria exatamente o fake que você não quer.
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:26px">
    ${col('🎩 Os 6 técnicos', PURPLE,
      'Um benefício ÓBVIO cada, com o número na cara. Você contrata UM por vez, ele custa salário na folha e tem contrato de 2 temporadas.',
      TECNICOS.map(cartaTec).join(''))}

    ${col('🚗 A garagem', BLUE,
      'Comprados com MOEDAS (nunca dinheiro de verdade). A regra que dá coerência: <b>o carro é do presidente, então ele mexe em GRANA e IMAGEM — nunca na bola.</b>',
      CARROS.map(linhaCarro).join('') + `
      <div style="${box('#FFF6D6')};padding:11px 12px;margin-top:9px;font-family:system-ui;font-size:11px;font-weight:700;line-height:1.5">
        🧠 <b>Por que carro NÃO pode dar força em campo:</b> ele se compra com moeda. Se moeda virasse gol, quem junta
        moeda ganharia jogo — e aí o leilão, que é a alma do jogo, perde o sentido. Mantendo em grana/imagem,
        o carro vira <b>troféu de mandato</b> e não atalho.</div>`)}

    <div style="flex:1;min-width:390px">
      ${bloco('😂 O PULO DO GATO: a zoeira VIRA a mecânica', '#E6F3EA', `
        Cada técnico tem o <b>esquema preferido</b> dele. Jogando nele, o bônus vale. <b>Você pode mudar quando
        quiser</b> — só perde o bônus daquele jogo, e a tela diz isso na cara, sem travar nada:<br><br>
        <span style="font-size:11.5px">🎩 <i>"Presidente, o 4-3-3 é o MEU esquema."</i><br>
        🧑‍💼 <i>"Bonito. Vai de 5-3-2."</i><br>
        🎩 <i>"5-3-2 é o meu esquema, presidente. Sempre foi."</i> 😅<br>
        <span style="color:${RED};font-weight:800">⚠️ fora do esquema dele: sem o +4 neste jogo</span></span><br><br>
        É a sua regra viva: <b>quem manda é você</b> — e agora essa frase tem preço, o que faz dela uma DECISÃO
        de verdade em vez de piada solta.`)}
      ${bloco('💸 O que segura a força (pra não desbalancear)', '#EAF3FF', `
        · <b>Salário na folha</b>: técnico bom pesa no mês, igual jogador caro (usa o <code>squadPayroll</code> que já existe);<br>
        · <b>Contrato de 2 temporadas</b>: trocar toda hora custa;<br>
        · <b>Um por vez</b>: nada de empilhar 3 benefícios;<br>
        · <b>Sem técnico o jogo é IGUAL a hoje</b> — camada 100% opcional, nenhuma carreira antiga muda.<br><br>
        Comparação honesta: o +4 do técnico é <b>o mesmo tamanho</b> do que a tática já dá hoje (retranca/ataque
        somam ±4). Ou seja: é sentido, não é bomba.`)}
      ${bloco('🙋 O que eu preciso que você decida', '#FFF6D6', `
        <b>1. Os 6 técnicos estão bons?</b> Quer trocar algum benefício, ou acrescentar um 7º?<br><br>
        <b>2. Nome real ou apelido?</b> Eu recomendo <b>apelido</b> ("O Negociador", "O Paizão") em vez de
        Felipão/Tite — porque a sua regra é não inventar como pessoa real é, e "o Tite dá desconto de folha" é
        inventar. Com apelido, a zoeira fica livre e o risco é zero.<br><br>
        <b>3. Como o técnico chega?</b> Recomendo <b>3 candidatos na virada da temporada</b> (escolhe 1) — não
        alonga o pregão em nada. A outra rota era virar 7º setor do leilão, mas isso ADICIONA tempo ao pregão,
        e sua regra de ouro é não atrasar o ritmo.<br><br>
        <b>4. Preço dos carros</b> tá na régua certa pra sua economia? (40 → 1.500 moedas)`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-teccarro-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
