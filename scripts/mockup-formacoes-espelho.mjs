// ─── 📋 FORMAÇÕES-ESPELHO + O SISTEMA DE 100 TÉCNICOS (Diego 24/08) ─────────
//
// Sacada DELE, e está certíssima: *"formações como 442 losango, 4231, 4321…
// são formações q iremos deixar bonita no campo. Como o usuário quer, mas na
// verdade é um espelho da 442… tipo N mudaria nada"*.
//
// ✅ CONFERIDO NO CÓDIGO: o campinho (`ElencoField`, pyramidseason.tsx ~2970)
// desenha 4 LINHAS — ATA · MEI · DEF(lat+zag+lat) · GOL — e a simulação
// (`rollForm`) só olha POSIÇÃO e NÍVEL. Ou seja: quebrar a linha do meio em duas
// é 100% VISUAL. Nenhum número muda, nenhum save antigo muda.
//
// ⚠️ UMA CORREÇÃO HONESTA na conta dele (regra do Diego: "as coisas têm que
// bater e ser reais"): 4-2-3-1 e 4-3-2-1 dão os dois no **4-5-1**, não no 5-4-1.
// O 5-4-1 tem 3 ZAGUEIROS (5 defensores), e nenhum dos dois tem. A conta está
// desenhada na tela pra ele conferir com o dedo.
//
//   node scripts/mockup-formacoes-espelho.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'formacoes-espelho.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED', BLUE = '#2F6BAE'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// uma bolinha do campinho
const jog = (ini, tag, destaque) => `
  <div style="text-align:center;width:52px;flex:none">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;
      border:3px solid ${INK};background:${destaque ? GOLD : '#DBD1B5'};color:${destaque ? INK : '#fff'};
      ${OSW};font-size:14px;text-shadow:${destaque ? 'none' : '0 1px 2px rgba(0,0,0,.5)'}">${ini}</span>
    <p style="${OSW};font-size:7.5px;color:#fff;margin:2px 0 0;text-shadow:0 1px 2px rgba(0,0,0,.8)">${tag}</p>
  </div>`

const linha = (js, mb = 9) => `<div style="display:flex;justify-content:center;gap:3px;margin-bottom:${mb}px">${js}</div>`
const campo = (conteudo, alt = 250) => `
  <div style="background:repeating-linear-gradient(180deg,${GREEN} 0 ${Math.round(alt / 6)}px,#166332 ${Math.round(alt / 6)}px ${Math.round(alt / 3)}px);
    border:3px solid ${INK};border-radius:12px;padding:11px 5px 7px;box-shadow:3px 3px 0 ${INK};min-height:${alt}px">${conteudo}</div>`

// ── os campinhos ───────────────────────────────────────────────────────────
// 4-4-2 normal: meio em LINHA
const F442 = campo(
  linha(jog('R', 'ATA') + jog('B', 'ATA')) +
  linha(jog('C', 'MEI') + jog('Z', 'MEI') + jog('A', 'MEI') + jog('G', 'MEI')) +
  linha(jog('C', 'LAT') + jog('A', 'ZAG') + jog('L', 'ZAG') + jog('R', 'LAT')) +
  linha(jog('T', 'GOL'), 0))

// 4-4-2 LOSANGO: MESMOS 4 meias, desenhados em losango
const FLOS = campo(
  linha(jog('R', 'ATA') + jog('B', 'ATA')) +
  linha(jog('Z', 'MEI', 1), 4) +
  linha(jog('A', 'MEI', 1) + '<div style="width:52px"></div>' + jog('G', 'MEI', 1), 4) +
  linha(jog('C', 'MEI', 1)) +
  linha(jog('C', 'LAT') + jog('A', 'ZAG') + jog('L', 'ZAG') + jog('R', 'LAT')) +
  linha(jog('T', 'GOL'), 0))

// 4-5-1 normal: 5 meias em linha
const F451 = campo(
  linha(jog('R', 'ATA')) +
  linha(jog('C', 'MEI') + jog('Z', 'MEI') + jog('A', 'MEI') + jog('G', 'MEI') + jog('D', 'MEI')) +
  linha(jog('C', 'LAT') + jog('A', 'ZAG') + jog('L', 'ZAG') + jog('R', 'LAT')) +
  linha(jog('T', 'GOL'), 0))

// 4-2-3-1: MESMOS 5 meias, 3 na frente + 2 atrás
const F4231 = campo(
  linha(jog('R', 'ATA')) +
  linha(jog('Z', 'MEI', 1) + jog('A', 'MEI', 1) + jog('G', 'MEI', 1), 4) +
  linha(jog('C', 'MEI', 1) + jog('D', 'MEI', 1)) +
  linha(jog('C', 'LAT') + jog('A', 'ZAG') + jog('L', 'ZAG') + jog('R', 'LAT')) +
  linha(jog('T', 'GOL'), 0))

// 4-3-2-1 (árvore de natal): MESMOS 5 meias, 2 na frente + 3 atrás
const F4321 = campo(
  linha(jog('R', 'ATA')) +
  linha(jog('Z', 'MEI', 1) + jog('A', 'MEI', 1), 4) +
  linha(jog('C', 'MEI', 1) + jog('G', 'MEI', 1) + jog('D', 'MEI', 1)) +
  linha(jog('C', 'LAT') + jog('A', 'ZAG') + jog('L', 'ZAG') + jog('R', 'LAT')) +
  linha(jog('T', 'GOL'), 0))

const par = (tit, cor, esq, dir, rotEsq, rotDir, nota) => `
  <div style="${box('#fff')};padding:12px;margin-bottom:14px">
    <p style="${OSW};font-size:15px;margin:0 0 2px;text-transform:uppercase;color:${cor}">${tit}</p>
    <p style="font-family:system-ui;font-size:11px;font-weight:700;color:rgba(0,0,0,.55);margin:0 0 10px;line-height:1.4">${nota}</p>
    <div style="display:flex;gap:10px">
      <div style="flex:1">
        <p style="${OSW};font-size:10.5px;text-transform:uppercase;margin:0 0 5px;color:rgba(0,0,0,.5);text-align:center">${rotEsq}</p>
        ${esq}</div>
      <div style="flex:none;display:flex;align-items:center;${OSW};font-size:20px;color:${cor}">=</div>
      <div style="flex:1">
        <p style="${OSW};font-size:10.5px;text-transform:uppercase;margin:0 0 5px;color:${cor};text-align:center">${rotDir}</p>
        ${dir}</div>
    </div>
  </div>`

// ── tabela das 11 formações ────────────────────────────────────────────────
const FORMS = [
  ['4-4-2', '1·2·2·4·2', 'JÁ TEM', GREEN],
  ['4-3-3', '1·2·2·3·3', 'JÁ TEM', GREEN],
  ['4-5-1', '1·2·2·5·1', 'JÁ TEM', GREEN],
  ['3-4-3', '1·2·1·4·3', 'JÁ TEM', GREEN],
  ['5-3-2', '1·2·3·3·2', 'JÁ TEM', GREEN],
  ['5-4-1', '1·2·3·4·1', 'NOVA — muda o time', BLUE],
  ['4-2-4', '1·2·2·2·4', 'NOVA — muda o time', BLUE],
  ['3-5-2', '1·2·1·5·2', 'NOVA — muda o time', BLUE],
  ['4-4-2 losango', '1·2·2·4·2', 'ESPELHO do 4-4-2', PURPLE],
  ['4-2-3-1', '1·2·2·5·1', 'ESPELHO do 4-5-1', PURPLE],
  ['4-3-2-1', '1·2·2·5·1', 'ESPELHO do 4-5-1', PURPLE],
]
const tabela = `
  <div style="${box('#fff')};padding:12px">
    <p style="${OSW};font-size:14px;margin:0 0 2px">📋 As 11 que você listou</p>
    <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 9px">
      A coluna do meio é a contagem <b>GOL·LAT·ZAG·MEI·ATA</b> — é o ÚNICO número que a simulação enxerga.
      Contagem igual = time igual.</p>
    <table style="width:100%;border-collapse:collapse;font-family:system-ui;font-size:11px;font-weight:700">
      ${FORMS.map(([n, c, s, cor]) => `
      <tr style="border-top:1.5px solid rgba(0,0,0,.1)">
        <td style="padding:5px 0;${OSW};font-size:12px">${n}</td>
        <td style="padding:5px 4px;font-family:ui-monospace,monospace;font-size:10.5px;color:rgba(0,0,0,.6)">${c}</td>
        <td style="padding:5px 0;text-align:right"><span style="${OSW};font-size:8.5px;border:2px solid ${INK};border-radius:6px;padding:1px 6px;background:${cor === GREEN ? '#DFF3E3' : cor === BLUE ? '#E3EEF9' : '#EDE7FF'};color:${cor}">${s}</span></td>
      </tr>`).join('')}
    </table>
  </div>`

// ── o sistema dos 100 técnicos ─────────────────────────────────────────────
const EIXOS = [
  ['🎯', 'Especialidade', 'O benefício dele — desconto de folha, ataque, copa, vestiário… (uns 10 tipos)', GOLD],
  ['📋', 'Formações que domina', 'Lenda 5 · Craque 4 · Bom 3 · Profissional 2 · Estreante 1', BLUE],
  ['⚠️', 'Ponto fraco', 'TODO técnico tem um. É o que impede lenda de ser só "melhor".', RED],
  ['😤', 'Temperamento', 'Como ele reage quando você muda o esquema dele — a zoeira com personalidade', PURPLE],
  ['💰', 'Salário e exigência', 'Lenda é caro e COBRA título. Craque é barato e fiel até o fim.', GREEN],
]
const eixo = ([ic, t, d, cor]) => `
  <div style="${box('#fff')};padding:10px 11px;margin-bottom:7px;display:flex;gap:9px;align-items:flex-start;border-left:7px solid ${cor}">
    <span style="font-size:19px;flex:none;line-height:1.1">${ic}</span>
    <div style="min-width:0">
      <p style="${OSW};font-size:12.5px;margin:0;text-transform:uppercase">${t}</p>
      <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.58);margin:2px 0 0;line-height:1.35">${d}</p>
    </div>
  </div>`

const exemplo = (nome, tier, cor, linhas) => `
  <div style="${box('#fff')};padding:11px;margin-bottom:9px">
    <p style="${OSW};font-size:14px;margin:0 0 1px;text-transform:uppercase">${nome}
      <span style="font-size:9px;border:2px solid ${INK};border-radius:999px;padding:1px 7px;background:${cor};margin-left:4px">${tier}</span></p>
    <table style="width:100%;border-collapse:collapse;font-family:system-ui;font-size:10.5px;font-weight:700;margin-top:6px">
      ${linhas.map(([k, v]) => `<tr style="border-top:1px solid rgba(0,0,0,.08)">
        <td style="padding:4px 6px 4px 0;color:rgba(0,0,0,.45);white-space:nowrap;vertical-align:top">${k}</td>
        <td style="padding:4px 0;line-height:1.35">${v}</td></tr>`).join('')}
    </table>
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
  <div style="display:inline-block;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">📋 FORMAÇÕES-ESPELHO · NO CAMPINHO DE VERDADE</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    SUA SACADA TÁ <span style="color:${GREEN}">CERTA</span></h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1200px;line-height:1.5;margin:0 0 6px">
    Fui no código: o campinho desenha <b>4 linhas</b> (ATA · MEI · DEF · GOL) e a simulação só olha
    <b>posição e nível</b>. Então quebrar a linha do meio em duas é <b>100% visual</b> — o jogador fica bonito no
    campo, o time é exatamente o mesmo. <b>Zero risco</b>: nenhum número muda, nenhuma carreira antiga muda.
  </p>
  <p style="font-size:13px;font-weight:600;max-width:1200px;line-height:1.5;margin:0 0 22px;color:${RED}">
    ⚠️ Só uma correção na conta: <b>4-2-3-1 e 4-3-2-1 dão os dois no 4-5-1</b>, não no 5-4-1 — porque o 5-4-1 tem
    <b>3 zagueiros</b>, e nenhum dos dois tem. Confere na tabela: a contagem manda.
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:24px">
    <div style="flex:0 0 480px">
      ${par('① 4-4-2 losango', PURPLE, F442, FLOS, 'o 4-4-2 de hoje', '4-4-2 losango (novo desenho)',
        'Os MESMOS 4 meias. Um recua, um sobe, dois abrem — vira losango. A simulação não sente nada.')}
      ${par('② 4-2-3-1', PURPLE, F451, F4231, 'o 4-5-1 de hoje', '4-2-3-1 (novo desenho)',
        'Os MESMOS 5 meias: 2 seguram atrás, 3 abrem na frente do atacante. Time idêntico ao 4-5-1.')}
    </div>
    <div style="flex:0 0 480px">
      ${par('③ 4-3-2-1 · a árvore de natal', PURPLE, F451, F4321, 'o 4-5-1 de hoje', '4-3-2-1 (novo desenho)',
        'Os MESMOS 5 meias: 3 na base, 2 pendurados atrás do centroavante. Também é o 4-5-1 por dentro.')}
      ${tabela}
    </div>
    <div style="flex:1;min-width:400px">
      ${bloco('✅ Por que isso é uma IDEIA BOA (e barata)', '#E6F3EA', `
        <b>3 formações novas de graça.</b> O jogador escolhe "4-2-3-1" porque é o esquema que ele conhece da TV,
        vê o time desenhado do jeito certo, e <b>não existe armadilha</b>: ele não fica pior nem melhor por isso.<br><br>
        E o custo é quase zero — é mudar como o campinho DESENHA a linha do meio. Não encosto na simulação,
        então <b>não tem como quebrar resultado nenhum</b>.<br><br>
        ⚠️ <b>Uma regra que eu botaria</b>: a tela precisa DIZER que é o mesmo time (tipo um "≡ 4-5-1" pequeno do
        lado). Senão alguém escolhe 4-2-3-1 achando que ficou mais ofensivo, perde, e vira reclamação —
        exatamente o "comportamento que nenhuma regra previu" que você não quer.`)}
      ${bloco('🆕 As 3 que MUDAM o time de verdade', '#E3EEF9', `
        <b>5-4-1</b> (3 zagueiros) · <b>4-2-4</b> (4 atacantes) · <b>3-5-2</b> (1 zagueiro, 5 meias).<br><br>
        Essas mudam a contagem, então mudam a força — são formações <b>de verdade</b>, não espelho.
        São fáceis de adicionar (uma linha cada em <code>FORMATIONS</code>), e aí sua lista de 11 fica completa:
        <b>8 reais + 3 espelhos</b>.`)}
    </div>
  </div>

  <h2 style="${OSW};text-transform:uppercase;font-size:32px;margin:8px 0 4px;line-height:1">
    E OS <span style="color:${RED}">100 TÉCNICOS</span>?</h2>
  <p style="font-size:14px;font-weight:600;max-width:1200px;line-height:1.5;margin:0 0 20px">
    Sua preocupação é a certa: <i>"a Lenda Telê não pode ter só 5 formações e o craque Renato 3, e essa ser a
    única diferença"</i>. Concordo — número de formação sozinho é <b>escada</b>, e escada faz todo mundo querer só
    o topo. Então o técnico precisa de <b>5 eixos</b>, e o tier mexe em uns, não em todos:
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:24px">
    <div style="flex:0 0 400px">
      <p style="${OSW};font-size:14px;text-transform:uppercase;margin:0 0 8px;color:${PURPLE}">Os 5 eixos de cada técnico</p>
      ${EIXOS.map(eixo).join('')}
    </div>
    <div style="flex:0 0 400px">
      <p style="${OSW};font-size:14px;text-transform:uppercase;margin:0 0 8px;color:${GREEN}">O mesmo caso que você levantou</p>
      ${exemplo('Telê Santana', '👑 LENDA', GOLD, [
        ['🎯 Faz', 'Ataque <b>+5</b> jogando com 3 atacantes'],
        ['📋 Domina', '4-3-3 · 4-2-4 · 3-4-3 · 4-4-2 · losango <b>(5)</b>'],
        ['⚠️ Fraco', 'Defesa <b>−2</b> sempre. O time dele leva gol.'],
        ['😤 Jeito', 'Cede sem reclamar, mas solta ironia fina'],
        ['💰 Custo', 'Salário <b>alto</b> · <b>cobra título em 2 temporadas</b> ou pede pra sair'],
      ])}
      ${exemplo('Renato Gaúcho', '⭐ CRAQUE', '#E9EDF2', [
        ['🎯 Faz', 'Nas <b>copas</b>, +4 no ataque e na defesa'],
        ['📋 Domina', '4-3-3 · 4-4-2 · 4-2-3-1 <b>(3)</b>'],
        ['⚠️ Fraco', 'Liga <b>desligado</b>: −2 no ataque nas 10 primeiras rodadas'],
        ['😤 Jeito', 'Reclama alto, dá entrevista atravessada no jornal'],
        ['💰 Custo', 'Salário <b>médio</b> · <b>fiel</b>, fica enquanto você quiser'],
      ])}
    </div>
    <div style="flex:1;min-width:400px">
      ${bloco('🔑 A ideia que resolve o seu problema', '#FFF6D6', `
        <b>Lenda NÃO é "melhor" — é mais forte E mais caro E mais chato.</b><br><br>
        · O Telê te dá +5 no ataque, mas <b>−2 na defesa pra sempre</b> e <b>te abandona</b> se você não for
        campeão em 2 temporadas;<br>
        · O Renato te dá menos, mas é <b>barato e fiel</b> — e é <b>MELHOR que o Telê</b> se o seu negócio é
        ganhar copa.<br><br>
        Assim <b>escolher técnico vira decisão</b>, não compra do mais caro. E é isso que faz 100 técnicos
        valerem a pena em vez de virarem 100 nomes iguais.`)}
      ${bloco('💡 Mais 4 ideias pra dar vida', '#EDE7FF', `
        <b>1. O técnico EVOLUI com você.</b> Cada título que ele ganha no SEU clube destrava +1 formação
        (até o teto do tier). Aí segurar um craque por 8 temporadas vira uma história — e o cara fica com
        um técnico que é <b>só dele</b>.<br><br>
        <b>2. Rival rouba seu técnico.</b> Foi bem? No fim da temporada o rival faz proposta. Você paga pra
        segurar ou perde. (Usa a rivalidade que já existe no jogo.)<br><br>
        <b>3. Dupla de aposentado.</b> Técnico que você demitiu pode voltar anos depois — com o rancor
        registrado no jornal 😄.<br><br>
        <b>4. Frase de assinatura.</b> Cada um tem o bordão dele no jornal e no campinho. É o que faz
        o jogador LEMBRAR do técnico, não do número.`)}
      ${bloco('🙋 Me responde', '#fff', `
        <b>1.</b> Fecho as 11 formações assim? (8 reais + 3 espelhos, com o "≡ 4-5-1" avisando)<br>
        <b>2.</b> Os 5 eixos do técnico servem? Quer trocar algum?<br>
        <b>3.</b> <b>20 ou 100 técnicos?</b> Minha recomendação: <b>começar com 20</b> bem feitos (4 por tier) e
        crescer depois — 100 de cara é muito nome pra revisar, e o sistema é o mesmo. Adicionar técnico
        depois é só uma linha de dado.<br>
        <b>4.</b> Nome real (Telê, Renato) ou apelido? Se for real, eu só uso o que é <b>fato público e
        conhecido</b> (Telê = futebol-arte é história documentada) — nunca invento jeito de ser.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-formesp-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
