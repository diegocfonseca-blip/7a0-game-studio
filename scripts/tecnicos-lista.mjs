// ─── 🎩 A LISTA DOS TÉCNICOS · 1º LOTE (Diego 24/08) ───────────────────────
//
// Pedido: *"vamos começar devagar. Várzea tudo inventado · Série B craques ·
// Série A lendas. Depois pensamos na C e D"*.
//
// 60 técnicos: 20 Várzea (folclóricos) + 20 Série B (craques) + 20 Série A
// (lendas). C e D ficam pra depois, como ele mandou.
//
// 📋 A FICHA DE CADA UM (fechada nos mockups anteriores):
//   nome · tier · SETOR do +3 · quantas formações domina · quais
//   Lenda 5 formações · Craque 4 · Promessa 3 · Bom 2 · Profissional 1
//
// ⚠️ REGRA DO DIEGO QUE MANDA AQUI (18/08): *"não inventar como uma pessoa real
// é"*. Então cada técnico real leva um selo:
//   ✅ DOCUMENTADO — o jeito dele é fato público e conhecido (o "futebol-arte"
//      do Telê, a posse do Pep, os 3 zagueiros do Conte). Não invento nada.
//   ⚠️ ESTOU CHUTANDO — o nome é real mas eu NÃO tenho referência sólida do
//      estilo. Marquei pro Diego decidir: ou ele me diz como é, ou eu troco
//      por um folclórico.
// Os folclóricos da Várzea são invenção assumida — e é onde a zoeira mora.
//
//   node scripts/tecnicos-lista.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tecnicos-lista.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

const SET = { ATA: '⚔️ atacantes', MEI: '🎩 meias', ZAG: '🧱 zagueiros', LAT: '🏃 laterais', GOL: '🧤 goleiro' }

// ── 🌱 VÁRZEA · 20 FOLCLÓRICOS (invenção assumida) · 1 formação cada ───────
const VARZEA = [
  ['Seu Zé do Sacolão', 'ATA', '4-4-2', 'Fia o jogo no muque: bota todo mundo pra frente e reza.'],
  ['Doutor Prancheta', 'MEI', '4-5-1', 'Leva prancheta até pra pelada de domingo.'],
  ['Nego do Apito', 'ZAG', '5-3-2', 'Ex-juiz. Sabe onde a falta dói.'],
  ['Tio Baixinho', 'LAT', '4-4-2', 'Foi ponta nos anos 80 e não deixa ninguém esquecer.'],
  ['Mestre Cuíca', 'MEI', '4-3-3', 'Dá o ritmo do time como quem toca no samba.'],
  ['Careca da Kombi', 'ATA', '4-4-2', 'Leva o time inteiro na Kombi dele. Cobra a gasolina.'],
  ['Barbudo do Bar', 'ZAG', '5-3-2', 'Escala o time no guardanapo antes do jogo.'],
  ['Vovô Craque', 'MEI', '4-4-2', 'Jura que jogou com gente famosa. Ninguém confere.'],
  ['Sargento Bolinha', 'ZAG', '5-3-2', 'Treino às 5 da manhã. Quem chega tarde corre a volta.'],
  ['Zé da Vila', 'ATA', '4-3-3', 'Conhece todo moleque bom num raio de 10 quarteirões.'],
  ['Tuta Perna-de-Pau', 'LAT', '4-4-2', 'Jogador ruim, técnico decente. A vida é irônica.'],
  ['Cabeção', 'ZAG', '5-3-2', 'Só treina bola parada. Só.'],
  ['Seu Nenê da Padaria', 'ATA', '4-4-2', 'Paga pão com mortadela pra quem faz gol.'],
  ['Pelé da Oficina', 'MEI', '4-3-3', 'O apelido veio do bairro, e ele nunca desmentiu.'],
  ['Fumaça', 'LAT', '4-4-2', 'Grita o jogo inteiro. Perde a voz no primeiro tempo.'],
  ['Beiço', 'ATA', '4-3-3', 'Reclama de tudo, mas o time joga.'],
  ['Mão de Onça', 'GOL', '4-4-2', 'Foi goleiro. Só sabe treinar goleiro.'],
  ['Tico do Terrão', 'ZAG', '5-3-2', 'Aprendeu a jogar em campo de terra e cobra isso.'],
  ['Marimbondo', 'MEI', '4-5-1', 'Time dele ferroa: pressiona do início ao fim.'],
  ['Seu Vardo', 'LAT', '4-4-2', 'Tem um sobrinho no time. Todo mundo sabe.'],
]

// ── ⭐ SÉRIE B · 20 CRAQUES · 4 formações cada ─────────────────────────────
// (formações fechadas depois — aqui vale a IDENTIDADE, que é o que ele aprova)
const SERIE_B = [
  ['Renato Gaúcho', 'ATA', 1, 'Rei de mata-mata — a fama de copeiro é pública.'],
  ['Vanderlei Luxemburgo', 'MEI', 1, 'O nome dele é sinônimo de mercado e negociação.'],
  ['Fernando Diniz', 'MEI', 1, 'A "diniziana" (posse e aproximação) é estilo documentado.'],
  ['Antonio Conte', 'ZAG', 1, 'Os 3 zagueiros são a marca registrada dele.'],
  ['Roberto De Zerbi', 'MEI', 1, 'Saída de bola desenhada — estilo muito documentado.'],
  ['Unai Emery', 'ATA', 1, 'Especialista em copa europeia — é o cartão de visita dele.'],
  ['Diego Simeone', 'ZAG', 1, 'Intensidade e bloco fechado, a identidade mais clara que existe.'],
  ['Jorge Jesus', 'ATA', 0, 'Linha alta e ataque, mas eu não tenho referência FIRME.'],
  ['Abel Ferreira', 'ZAG', 0, 'Fama de organização, mas o detalhe eu estaria chutando.'],
  ['Cuca', 'ZAG', 0, 'Sem referência sólida de estilo — eu chutaria.'],
  ['Dorival Júnior', 'MEI', 0, 'Fama de acertar o vestiário, mas não tenho fonte firme.'],
  ['Mano Menezes', 'MEI', 0, 'Sem referência sólida de estilo.'],
  ['Rogério Ceni', 'GOL', 0, 'Foi goleiro — o resto eu estaria inventando.'],
  ['Marcelo Gallardo', 'ATA', 0, 'Muitos títulos, estilo eu não afirmo.'],
  ['Ricardo Gareca', 'MEI', 0, 'Sem referência sólida.'],
  ['Thomas Tuchel', 'ZAG', 0, 'Sem referência sólida do traço marcante.'],
  ['Simone Inzaghi', 'ATA', 0, 'Sem referência sólida.'],
  ['Erik ten Hag', 'MEI', 0, 'Sem referência sólida.'],
  ['Abel Braga', 'LAT', 0, 'Sem referência sólida.'],
  ['Odair Hellmann', 'ZAG', 0, 'Sem referência sólida.'],
]

// ── 👑 SÉRIE A · 20 LENDAS · 5 formações cada ──────────────────────────────
const SERIE_A = [
  ['Telê Santana', 'ATA', 1, 'O futebol-arte de 82 é história registrada.'],
  ['Pep Guardiola', 'MEI', 1, 'Posse de bola — o estilo mais documentado do futebol moderno.'],
  ['José Mourinho', 'ZAG', 1, 'Pragmatismo e bloco defensivo, assumido por ele mesmo.'],
  ['Marcelo Bielsa', 'LAT', 1, 'Marcação alta e intensidade — "El Loco" é isso.'],
  ['Jürgen Klopp', 'ATA', 1, 'A pressão pós-perda ("heavy metal") é marca dele.'],
  ['Johan Cruyff', 'MEI', 1, 'Futebol total — inventou a escola.'],
  ['Rinus Michels', 'MEI', 1, 'O pai do futebol total holandês.'],
  ['Arrigo Sacchi', 'ZAG', 1, 'Linha alta e defesa em zona — mudou o futebol italiano.'],
  ['Helenio Herrera', 'ZAG', 1, 'O catenaccio da Inter é dele.'],
  ['Carlo Ancelotti', 'MEI', 1, 'Fama pública de vestiário calmo e gestão de estrelas.'],
  ['Alex Ferguson', 'ATA', 1, 'Longevidade e times que viravam jogo no fim.'],
  ['Zagallo', 'MEI', 1, 'Tetracampeão — pragmatismo vencedor.'],
  ['Carlos Alberto Parreira', 'ZAG', 1, 'Organização e equilíbrio, o 94 é o retrato.'],
  ['Luiz Felipe Scolari', 'ZAG', 1, 'A "família Scolari" — vestiário blindado é a marca.'],
  ['Valeriy Lobanovskyi', 'LAT', 1, 'Preparação física científica — pioneiro reconhecido.'],
  ['Vicente del Bosque', 'MEI', 1, 'A posse da Espanha campeã.'],
  ['Fabio Capello', 'ZAG', 1, 'Disciplina e solidez defensiva.'],
  ['Tite', 'ZAG', 0, 'Organização defensiva é a fama, mas eu estaria detalhando demais.'],
  ['Muricy Ramalho', 'ZAG', 0, 'Fama de retranca eficiente — mas prefiro te perguntar.'],
  ['Ottmar Hitzfeld', 'MEI', 0, 'Sem referência sólida do traço marcante.'],
]

const chip = (t, bg, cor) => `<span style="${OSW};font-size:8.5px;border:2px solid ${INK};border-radius:6px;padding:1px 6px;background:${bg};color:${cor};white-space:nowrap">${t}</span>`

const linhaV = ([nome, setor, form, piada], i) => `
  <tr style="border-top:1.5px solid rgba(0,0,0,.09)">
    <td style="padding:6px 6px 6px 0;${OSW};font-size:11px;color:rgba(0,0,0,.35);width:20px">${i + 1}</td>
    <td style="padding:6px 6px 6px 0">
      <div style="${OSW};font-size:12.5px;text-transform:uppercase">${nome}</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.5);line-height:1.3">${piada}</div>
    </td>
    <td style="padding:6px 0;text-align:right;white-space:nowrap;width:112px">
      <div style="font-family:system-ui;font-size:9.5px;font-weight:800;color:${GREEN}">+3 ${SET[setor]}</div>
      <div style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.45)">${form}</div></td>
  </tr>`

const linhaR = ([nome, setor, ok, nota], i) => `
  <tr style="border-top:1.5px solid rgba(0,0,0,.09);${ok ? '' : 'background:#FFF6D6'}">
    <td style="padding:6px 6px 6px 0;${OSW};font-size:11px;color:rgba(0,0,0,.35);width:20px">${i + 1}</td>
    <td style="padding:6px 6px 6px 0">
      <div style="${OSW};font-size:12.5px;text-transform:uppercase">${nome} ${ok ? chip('✅ documentado', '#DFF3E3', GREEN) : chip('⚠️ eu chutaria', '#FFE9A8', '#8a6d00')}</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.5);line-height:1.3">${nota}</div>
    </td>
    <td style="padding:6px 0;text-align:right;white-space:nowrap;width:112px">
      <div style="font-family:system-ui;font-size:9.5px;font-weight:800;color:${GREEN}">+3 ${SET[setor]}</div></td>
  </tr>`

const coluna = (tit, sub, cor, grad, linhas, rodape) => `
  <div style="flex:0 0 470px">
    <div style="${box('#fff')};overflow:hidden">
      <div style="background:${grad};border-bottom:3px solid ${INK};padding:11px 13px">
        <p style="${OSW};font-size:16px;margin:0;text-transform:uppercase">${tit}</p>
        <p style="font-family:system-ui;font-size:10px;font-weight:800;color:rgba(0,0,0,.6);margin:1px 0 0">${sub}</p>
      </div>
      <div style="padding:0 13px"><table style="width:100%;border-collapse:collapse;table-layout:fixed">${linhas}</table></div>
      <div style="padding:10px 13px;background:#FBF6E9;border-top:2.5px solid ${INK};font-family:system-ui;font-size:10px;font-weight:700;line-height:1.4;color:rgba(0,0,0,.6)">${rodape}</div>
    </div>
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const nReais = SERIE_A.filter(t => t[2]).length + SERIE_B.filter(t => t[2]).length
const nChute = SERIE_A.filter(t => !t[2]).length + SERIE_B.filter(t => !t[2]).length

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩 1º LOTE · 60 TÉCNICOS · PRA VOCÊ APROVAR</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    VÁRZEA, SÉRIE B E <span style="color:${RED}">SÉRIE A</span></h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1250px;line-height:1.5;margin:0 0 6px">
    Do seu jeito: <b>Várzea tudo inventado · Série B craques · Série A lendas</b>. C e D ficam pra depois.
    Cada um já vem com o <b>setor do +3</b> definido — é só você aprovar, trocar ou cortar nome por nome.
  </p>
  <p style="font-size:13px;font-weight:600;max-width:1250px;line-height:1.5;margin:0 0 22px;color:${RED}">
    ⚠️ <b>O aviso importante, que é regra sua:</b> "não inventar como uma pessoa real é". Marquei
    <b>${nReais} como ✅ documentado</b> (o jeito dele é fato público) e <b>${nChute} como ⚠️ eu chutaria</b> —
    esses estão em amarelo. Nos amarelos <b>eu não vou inventar</b>: ou você me diz como é o cara, ou eu troco
    por um folclórico. Você decide.
  </p>

  <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;margin-bottom:24px">
    ${coluna('🌱 Várzea · 20', 'todos inventados · 1 formação cada', INK, 'linear-gradient(160deg,#EFE9D6,#CBBF9E)',
      VARZEA.map(linhaV).join(''),
      'Invenção assumida — é onde a zoeira mora. Nenhum risco, e o nome já conta a piada.')}
    ${coluna('⭐ Série B · 20', 'craques · 4 formações cada', INK, 'linear-gradient(160deg,#F4F7FB,#CBD4DE)',
      SERIE_B.map(linhaR).join(''),
      `${SERIE_B.filter(t => t[2]).length} documentados · ${SERIE_B.filter(t => !t[2]).length} em amarelo esperando você.`)}
    ${coluna('👑 Série A · 20', 'lendas · 5 formações cada', INK, 'linear-gradient(160deg,#FFE79A,#FFC400)',
      SERIE_A.map(linhaR).join(''),
      `${SERIE_A.filter(t => t[2]).length} documentados · ${SERIE_A.filter(t => !t[2]).length} em amarelo esperando você.`)}

    <div style="flex:1;min-width:380px">
      ${bloco('📐 A regra de divisão que você fechou', '#E6F3EA', `
        <b>Lenda só na Série A · Craque só na B · Promessa na C · Bom na D · Profissional na Várzea.</b>
        20 de cada, 100 no total.<br><br>
        <b>E as suas duas exceções, que são a alma da coisa:</b><br>
        · <b>SUBIU?</b> Você pode <b>levar o técnico junto</b> — ele fica com você fora da divisão dele.<br>
        · <b>CAIU?</b> <i>"na hora de meter o pé, ele mete"</i> — o técnico vaza e você monta de novo.`)}
      ${bloco('🤔 O caso que a sua regra levanta', '#FFF6D6', `
        Se você sobe da B pra A levando um <b>craque</b>, ele fica no meio de <b>lendas</b> — e sabe
        <b>4 formações contra 5</b> delas. Ou seja: <b>ficar com ele é escolha</b>, não upgrade automático.
        Lealdade (barato, conhecido) contra trocar por lenda (caro, mais flexível). <b>Isso é ótimo</b> e vale
        a pena deixar assim.<br><br>
        <b>Uma coisinha que eu quero te perguntar:</b> se você CAI da A pra B com um craque que subiu com
        você… a B é <b>a casa dele</b>. Faria sentido ele <b>ficar</b> nesse caso (só vaza quem está abaixo do
        nível da divisão nova). Quer assim, ou vaza todo mundo sem exceção?`)}
      ${bloco('🙋 O que eu preciso de você agora', '#fff', `
        <b>1.</b> Os <b>20 folclóricos da Várzea</b> — aprova, corta, troca? (esses são 100% meus, pode meter a
        tesoura à vontade)<br>
        <b>2.</b> Os <b>amarelos</b> (${nChute} nomes): você me diz o estilo de cada um, ou eu troco por folclórico?<br>
        <b>3.</b> Os <b>setores</b> (+3 em atacantes/meias/zagueiros/laterais/goleiro) estão bem distribuídos?<br>
        <b>4.</b> Falta alguém que você QUER ver no jogo e eu não botei?`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/tecnicos-lista-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 2080, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(`${SAIDA} · ${VARZEA.length + SERIE_B.length + SERIE_A.length} técnicos`)
