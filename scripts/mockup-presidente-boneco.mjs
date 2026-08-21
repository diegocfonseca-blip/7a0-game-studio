// ─── 🎩 O BONECO DO PRESIDENTE — a primeira vez na sala ─────────────────────
//
// Diego (21/08): *"pensei: primeiro o usuário, quando clicar pela primeira vez
// na sala do presidente, ele criar o boneco. Seria a primeira coisa, pra depois
// ele avançar pra essas telas. O que sugere? Dê ideias."*
//
// 💡 A IDEIA CENTRAL: a sala hoje fala do CLUBE. O boneco faz ela falar de VOCÊ.
// E o momento de criar vira uma POSSE — que é justamente o tipo de coisa que o
// Diego gosta (momento, não relatório).
//
// ⚖️ A DECISÃO DE PESO (e ela é diferente da regra do batismo, de propósito):
//   · Batismo é arte de UM clube → tem que ser `.webp` fora do bundle, senão
//     todo jogador baixa a arte de um clube que ele nunca vai ver.
//   · O boneco é o contrário: é UM desenho que TODO MUNDO usa, com as peças
//     trocando por cor/forma. Aí `.webp` seria pior (dezenas de arquivos e
//     combinações impossíveis). O certo aqui é **SVG paramétrico**: um punhado
//     de paths no código, reaproveitados por todos, **zero download**.
//   · Ou seja: a regra do batismo continua valendo pro batismo. Aqui o barato
//     é o inverso — e por isso está escrito.
//
// 🛡️ TRAVAS QUE EU JÁ DEIXO COMBINADAS:
//   · **Nunca bloqueia.** Dá pra pular e a sala abre igual. Criar depois é um
//     toque, e trocar o boneco também.
//   · **Nada de rolagem infinita de opções** — 3 escolhas numa tela SÓ, com
//     prontos e um "🎲 surpreenda-me". Quem tem pressa resolve em 2 segundos.
//   · **Sem julgar ninguém**: variedade de tom de pele e de cabelo, e nenhum
//     padrão "certo". O boneco é de quem está jogando.
//
//   node scripts/mockup-presidente-boneco.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'presidente-boneco.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CO1 = '#0C0C0C', CO2 = '#FFFFFF' // cores do coração (só cores)

// ── 🎨 O BONECO PARAMÉTRICO (é exatamente assim que eu faria no jogo) ───────
// peças: pele · cabelo · barba · terno · gravata · acessório. Tudo path + cor.
const PELE = ['#F1C9A5', '#DBA57A', '#B07A50', '#7A4B2A', '#4E2F1B']
const CABELO = ['#1A1310', '#4A2C1A', '#8B5A2B', '#C9A227', '#9A9A9A', 'none']
const boneco = (s, o = {}) => {
  const { pele = PELE[1], cabelo = CABELO[0], estilo = 'curto', barba = 'none', terno = INK, gravata = GOLD, oculos = false, chapeu = false } = o
  const cab = {
    curto: `<path d="M22 30 C22 16 58 16 58 30 L58 33 C58 24 22 24 22 33 Z" fill="${cabelo}"/>`,
    topete: `<path d="M22 31 C22 15 58 15 58 31 C54 22 46 20 40 22 C33 24 26 25 22 31 Z" fill="${cabelo}"/><path d="M38 20 C42 12 52 14 54 20 C48 17 42 17 38 20 Z" fill="${cabelo}"/>`,
    careca: '',
    longo: `<path d="M22 30 C22 16 58 16 58 30 L58 52 C58 44 54 40 54 33 C46 38 34 38 26 33 C26 40 22 44 22 52 Z" fill="${cabelo}"/>`,
  }[estilo] ?? ''
  const brb = {
    none: '',
    cavanhaque: `<path d="M34 52 Q40 58 46 52 Q44 60 36 60 Z" fill="${cabelo}"/>`,
    cheia: `<path d="M22 36 C22 54 30 62 40 62 C50 62 58 54 58 36 C58 48 50 52 40 52 C30 52 22 48 22 36 Z" fill="${cabelo}"/>`,
    bigode: `<path d="M32 46 Q40 43 48 46 Q40 50 32 46 Z" fill="${cabelo}"/>`,
  }[barba] ?? ''
  return `
  <svg width="${s}" height="${s}" viewBox="0 0 80 80" style="display:block">
    <circle cx="40" cy="40" r="37" fill="#EFE6CF" stroke="${INK}" stroke-width="3.5"/>
    <clipPath id="c${s}${cabelo.replace('#', '')}${estilo}${barba}"><circle cx="40" cy="40" r="35"/></clipPath>
    <g clip-path="url(#c${s}${cabelo.replace('#', '')}${estilo}${barba})">
      <path d="M40 20 C50 20 56 28 56 38 C56 50 49 58 40 58 C31 58 24 50 24 38 C24 28 30 20 40 20 Z" fill="${pele}"/>
      ${brb}
      <circle cx="33" cy="38" r="2.2" fill="${INK}"/><circle cx="47" cy="38" r="2.2" fill="${INK}"/>
      ${oculos ? `<g fill="none" stroke="${INK}" stroke-width="2"><circle cx="33" cy="38" r="6"/><circle cx="47" cy="38" r="6"/><path d="M39 38h2"/></g>` : ''}
      ${cab}
      ${chapeu ? `<g><rect x="20" y="20" width="40" height="4" rx="2" fill="${INK}"/><path d="M27 20 V9 h26 v11 Z" fill="${INK}"/><rect x="27" y="14" width="26" height="3.5" fill="${gravata}"/></g>` : ''}
      <path d="M14 80 C14 62 26 56 40 56 C54 56 66 62 66 80 Z" fill="${terno}"/>
      <path d="M40 56 L31 80 H49 Z" fill="#fff"/>
      <path d="M40 58 L36 65 L40 80 L44 65 Z" fill="${gravata}" stroke="${INK}" stroke-width="1.2"/>
    </g>
  </svg>`
}

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:60px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`
const rotu = t => `<div style="${OSW};font-size:9.5px;letter-spacing:.09em;opacity:.5;margin:0 0 7px">${t}</div>`

// ── ① A PRIMEIRA VEZ: escolha um pronto (ou personalize) ───────────────────
const PRONTOS = [
  { pele: PELE[0], cabelo: CABELO[1], estilo: 'topete', barba: 'none' },
  { pele: PELE[2], cabelo: CABELO[0], estilo: 'curto', barba: 'cavanhaque' },
  { pele: PELE[3], cabelo: CABELO[0], estilo: 'careca', barba: 'cheia' },
  { pele: PELE[1], cabelo: CABELO[3], estilo: 'longo', barba: 'none' },
  { pele: PELE[4], cabelo: CABELO[0], estilo: 'curto', barba: 'bigode' },
  { pele: PELE[0], cabelo: CABELO[4], estilo: 'curto', barba: 'cheia', oculos: true },
]
const PRIMEIRA = `
  <div style="background:${INK};padding:10px 13px;color:#fff;${OSW};font-size:13px">🎩 SALA DA PRESIDÊNCIA</div>
  <div style="padding:11px">
    <div style="${box('#fff')};overflow:hidden;margin-bottom:10px">
      <div style="height:8px;background:repeating-linear-gradient(90deg,${CO1} 0 12px,${CO2} 12px 24px);border-bottom:3px solid ${INK}"></div>
      <div style="padding:14px 13px;text-align:center;background:linear-gradient(180deg,#FBF6E9,#fff)">
        <div style="${OSW};font-size:9.5px;letter-spacing:.1em;color:rgba(0,0,0,.45)">BEM-VINDO À SUA SALA</div>
        <div style="${OSW};font-size:23px;line-height:1.05;margin-top:3px">Quem vai sentar<br>nessa cadeira?</div>
        <div style="font-family:system-ui;font-size:11px;font-weight:600;color:rgba(0,0,0,.6);margin-top:6px;line-height:1.45">
          Escolha um presidente pronto ou faça o seu. <b>Dá pra trocar quando quiser.</b></div>
      </div>
    </div>
    <div style="${box('#fff')};padding:12px;margin-bottom:10px">
      ${rotu('ESCOLHA UM — OU PERSONALIZE')}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${PRONTOS.map((p, i) => `
          <div style="border:${i === 1 ? 3 : 2.5}px solid ${INK};border-radius:12px;background:${i === 1 ? GOLD : '#fff'};box-shadow:${i === 1 ? `3px 3px 0 ${INK}` : `2px 2px 0 rgba(12,12,12,.25)`};padding:7px;display:flex;justify-content:center">
            ${boneco(62, { ...p, terno: INK, gravata: GOLD })}
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:7px;margin-top:10px">
        <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:8px;text-align:center;${OSW};font-size:11.5px">🎲 Surpreenda-me</div>
        <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:${PURPLE};color:#fff;padding:8px;text-align:center;${OSW};font-size:11.5px">✏️ Personalizar</div>
      </div>
    </div>
    <div style="${box(GREEN)};padding:11px;text-align:center;${OSW};font-size:15px;color:#fff;margin-bottom:8px">✅ É esse aí</div>
    <div style="text-align:center;font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.45)">ou <b style="text-decoration:underline">pular por enquanto</b> — a sala abre igual</div>
  </div>`

// ── ② O CRIADOR: 3 escolhas numa tela só ───────────────────────────────────
const chips = (itens, sel) => `
  <div style="display:flex;gap:6px;flex-wrap:wrap">
    ${itens.map((t, i) => `<span style="border:2.5px solid ${INK};border-radius:999px;padding:4px 11px;${OSW};font-size:10.5px;
      background:${i === sel ? INK : '#fff'};color:${i === sel ? '#fff' : INK};box-shadow:${i === sel ? 'none' : `2px 2px 0 rgba(12,12,12,.2)`}">${t}</span>`).join('')}
  </div>`
const cores = (lista, sel, r = 16) => `
  <div style="display:flex;gap:7px;flex-wrap:wrap">
    ${lista.map((c, i) => `<span style="width:${r * 2}px;height:${r * 2}px;border-radius:999px;background:${c};
      border:${i === sel ? 3.5 : 2.5}px solid ${INK};box-shadow:${i === sel ? `0 0 0 3px ${GOLD}` : 'none'};display:block"></span>`).join('')}
  </div>`

const CRIADOR = `
  <div style="background:${INK};padding:10px 13px;color:#fff;display:flex;align-items:center;justify-content:space-between">
    <span style="${OSW};font-size:13px">✏️ SEU PRESIDENTE</span>
    <span style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(255,255,255,.5)">TUDO NUMA TELA SÓ</span>
  </div>
  <div style="padding:11px">
    <div style="${box('#fff')};padding:12px;margin-bottom:10px;text-align:center">
      <div style="display:flex;justify-content:center">${boneco(112, { pele: PELE[2], cabelo: CABELO[0], estilo: 'topete', barba: 'cavanhaque', terno: '#2B2B6B', gravata: GOLD })}</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45);margin-top:6px">muda na hora, sem confirmar nada</div>
    </div>
    <div style="${box('#fff')};padding:11px 12px;margin-bottom:9px">
      ${rotu('1 · PELE')}
      ${cores(PELE, 2)}
    </div>
    <div style="${box('#fff')};padding:11px 12px;margin-bottom:9px">
      ${rotu('2 · CABELO E BARBA')}
      ${chips(['Curto', 'Topete', 'Longo', 'Careca'], 1)}
      <div style="height:7px"></div>
      ${chips(['Sem barba', 'Cavanhaque', 'Bigode', 'Cheia'], 1)}
      <div style="height:8px"></div>
      ${cores(CABELO.filter(c => c !== 'none'), 0, 13)}
    </div>
    <div style="${box('#fff')};padding:11px 12px;margin-bottom:10px">
      ${rotu('3 · O JEITÃO')}
      ${chips(['👓 Óculos', '🎩 Chapéu', '—'], 2)}
      <div style="height:8px"></div>
      <div style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.5);line-height:1.45">
        👔 O <b>terno</b> e a <b>gravata</b> vêm do seu tier, e a <b>faixa</b> das cores do seu coração — isso a gente não escolhe aqui, já é seu.</div>
    </div>
    <div style="${box(GREEN)};padding:11px;text-align:center;${OSW};font-size:15px;color:#fff">✅ Pronto, sou eu</div>
  </div>`

// ── ③ A POSSE: o momento ───────────────────────────────────────────────────
const POSSE = `
  <div style="background:linear-gradient(160deg,#2B2B6B,#12123a);padding:22px 14px 0;color:#fff;text-align:center;position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(110deg,rgba(255,255,255,.05) 0 8px,transparent 8px 30px)"></div>
    <div style="position:relative">
      <div style="${OSW};font-size:9.5px;letter-spacing:.12em;color:rgba(255,255,255,.6)">TERMO DE POSSE</div>
      <div style="${OSW};font-size:34px;line-height:1;margin-top:4px;color:${GOLD};text-shadow:3px 3px 0 rgba(0,0,0,.35)">É OFICIAL!</div>
      <div style="display:flex;justify-content:center;margin:12px 0 0">${boneco(96, { pele: PELE[2], cabelo: CABELO[0], estilo: 'topete', barba: 'cavanhaque', terno: '#2B2B6B', gravata: GOLD })}</div>
      <div style="${OSW};font-size:19px;margin-top:7px">Diego Fonseca</div>
      <div style="font-family:system-ui;font-size:11px;font-weight:700;color:rgba(255,255,255,.75);margin-top:2px">Presidente do <b>Neymarzetti</b></div>
      <div style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(255,255,255,.5);margin-top:2px;padding-bottom:16px">empossado em 21 de agosto de 2026</div>
    </div>
  </div>
  <div style="background:#101033;padding:11px 13px;border-top:3px solid ${INK}">
    <div style="font-family:system-ui;font-size:10.5px;font-weight:600;color:rgba(255,255,255,.75);text-align:center;line-height:1.5">
      A faixa é sua, a cadeira é sua, e o que vier daqui pra frente<br>entra pro <b style="color:${GOLD}">seu</b> Livro de Recordes.</div>
  </div>
  <div style="padding:11px 12px 13px;background:${CREME}">
    <div style="${box(GREEN)};padding:12px;text-align:center;${OSW};font-size:15px;color:#fff">🎩 Entrar na minha sala</div>
    <div style="text-align:center;font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.4);margin-top:7px">Isso aparece UMA vez. Depois a sala abre direto.</div>
  </div>`

// ── ④ ONDE O BONECO REAPARECE ──────────────────────────────────────────────
const DEPOIS = `
  <div style="background:${INK};padding:10px 13px;color:#fff;${OSW};font-size:13px">🎩 DEPOIS DA POSSE</div>
  <div style="padding:11px">
    <div style="${box('#fff')};overflow:hidden;margin-bottom:10px">
      <div style="height:8px;background:repeating-linear-gradient(90deg,${CO1} 0 12px,${CO2} 12px 24px);border-bottom:3px solid ${INK}"></div>
      <div style="padding:12px;display:flex;align-items:center;gap:12px;background:linear-gradient(180deg,#FBF6E9,#fff)">
        ${boneco(64, { pele: PELE[2], cabelo: CABELO[0], estilo: 'topete', barba: 'cavanhaque', terno: '#2B2B6B', gravata: GOLD })}
        <div style="flex:1;min-width:0">
          <div style="${OSW};font-size:16px;line-height:1.05">Diego Fonseca</div>
          <div style="font-family:system-ui;font-size:10.5px;font-weight:700;font-style:italic;color:${PURPLE}">"O Magnata da Várzea"</div>
          <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin-top:2px">Presidente desde 27/07/2026</div>
          <div style="margin-top:5px;border:2px solid ${INK};border-radius:8px;background:#fff;padding:3px;text-align:center;${OSW};font-size:9.5px">✏️ Trocar o boneco</div>
        </div>
      </div>
    </div>
    ${[['🏆', 'Na festa de campeão', 'ele levanta a taça junto com o mascote'],
       ['🚗', 'Na carreata', 'aparece no carro (quando a garagem entrar)'],
       ['📤', 'No cartão do mandato', 'vai junto na imagem de postar'],
       ['📰', 'No jornal', '"o presidente comemorou na arquibancada"']].map(l => `
      <div style="${box('#fff')};padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px">
        <span style="font-size:18px">${l[0]}</span>
        <div><div style="${OSW};font-size:12px;line-height:1.15">${l[1]}</div>
        <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5)">${l[2]}</div></div>
      </div>`).join('')}
    <div style="${box('#FBE7E3')};padding:10px 12px">
      <div style="${OSW};font-size:11.5px;color:${RED};margin-bottom:3px">🚫 Onde ele NÃO entra</div>
      <div style="font-family:system-ui;font-size:10px;font-weight:600;line-height:1.45">
        Nas listas de sala e nas tabelas. Ali quem manda é o <b>escudo do clube</b> — foi você que pegou esse furo nos clãs, e a regra vale aqui também.</div>
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
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩 O BONECO DO PRESIDENTE</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    A PRIMEIRA VEZ NA SALA É <span style="color:${RED}">A SUA POSSE</span></h1>
  <p style="font-size:14px;font-weight:600;max-width:1090px;line-height:1.5;margin:0 0 22px">
    Você acertou: a sala hoje fala do <b>clube</b>. O boneco faz ela falar de <b>você</b>. E a primeira entrada deixa de
    ser "mais uma aba" e vira um <b>momento</b> — você se desenha, assina o termo e a sala abre.
    <b>Tudo isso é pulável</b>: quem não quiser, entra direto e faz depois.
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:28px">
    ${fone(PRIMEIRA, '① A primeira vez', GOLD, '<b>Prontos primeiro.</b> Seis presidentes já desenhados, um "🎲 surpreenda-me" e o "personalizar" pra quem quiser. Quem tem pressa resolve em 2 segundos — e ainda dá pra <b>pular</b>.')}
    ${fone(CRIADOR, '② O criador', PURPLE, '<b>3 escolhas numa tela só</b>, nunca um assistente de 5 telas. Muda na hora, sem confirmar nada. Terno, gravata e faixa <b>não</b> se escolhem: vêm do seu tier e do seu coração.')}
    ${fone(POSSE, '③ A posse', '#2B2B6B', 'O pagamento emocional: <b>"É OFICIAL!"</b>, seu nome, seu clube e a data. Aparece <b>uma vez só</b> — depois a sala abre direto. É o mesmo espírito da tela de fim de temporada.')}
    ${fone(DEPOIS, '④ Onde ele reaparece', GREEN, 'O boneco não fica preso na sala: ele vai pra <b>festa de campeão</b>, pra <b>carreata</b>, pro <b>cartão de postar</b> e pro <b>jornal</b>. É aí que ele deixa de ser enfeite.')}
  </div>

  <div style="display:flex;gap:22px;flex-wrap:wrap">
    <div style="flex:1;min-width:430px">
      ${bloco('⚖️ Por que aqui é SVG e não .webp', '#EAF3FF', `
        Parece que bate com a regra do batismo, mas é o contrário — e por isso eu quero deixar escrito:<br><br>
        <b>Batismo</b> é arte de UM clube. Se virasse desenho no código, todo jogador baixaria a arte de um clube que
        ele nunca vai ver. Por isso <b>.webp fora do bundle</b>.<br><br>
        <b>O boneco</b> é UM desenho que <b>todo mundo</b> usa, com as peças trocando de cor e forma. Em <code>.webp</code>
        seriam dezenas de arquivos e combinações impossíveis. Em <b>SVG paramétrico</b> é um punhado de traços no
        código, reaproveitado por todos, com <b>zero download</b>.<br><br>
        O boneco deste mockup <b>é exatamente essa técnica</b> — tudo que você está vendo é path + cor.`)}
      ${bloco('🚫 Onde o boneco NÃO entra', '#FBE7E3', `
        <b>Nas listas de sala e nas tabelas.</b> Ali quem manda é o <b>escudo do clube</b>.<br><br>
        Foi você que pegou esse furo agora há pouco nos clãs — e a regra vale igual aqui: <b>nada tira o escudo da
        pessoa do lugar dele</b>. O boneco é da sala, do jornal e das festas.`)}
    </div>
    <div style="flex:1;min-width:430px">
      ${bloco('🛡️ As travas que eu já deixo combinadas', '#F1EDE0', `
        <b>1. Nunca bloqueia.</b> Dá pra pular e a sala abre igual. Criar depois é um toque, trocar também.<br><br>
        <b>2. Nada de rolagem infinita de opções.</b> São 3 escolhas numa tela só, com prontos e um "surpreenda-me".
        Ninguém precisa passar 5 minutos ali.<br><br>
        <b>3. Sem padrão "certo".</b> Cinco tons de pele, cabelos variados, com e sem barba, com e sem óculos. O
        boneco é de quem está jogando — o jogo não escolhe por ninguém.<br><br>
        <b>4. Não atrasa nada.</b> A posse aparece UMA vez, fora de partida, fora de pregão. Nenhum passo novo no
        ritmo do jogo.`)}
      ${bloco('🧱 Por onde eu começaria', '#E6F3EA', `
        <b>Passo 1:</b> o boneco + os prontos + a posse. Sozinho já entrega o "algo a mais", e é só desenho e um
        campo salvo na conta.<br><br>
        <b>Passo 2:</b> o nome e o apelido de imprensa (ideia 1 da outra lista) — encaixa no mesmo cartão.<br><br>
        <b>Passo 3:</b> o boneco começa a aparecer fora da sala (festa de campeão primeiro, que é onde dá mais
        alegria).<br><br>
        Cada passo é um commit isolado, e ligo <b>só na sua conta</b> primeiro, como sempre.`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-boneco-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1720, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
