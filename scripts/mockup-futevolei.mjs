// 🏐 MOCKUP — FUTEVÔLEI DEPRESSÃO no Leilão Legends (proposta pro patrocinador)
//
// Nasceu em 21/08. O Diego trouxe a página @futevoleidepressao (266 mil
// seguidores, o Pedrinho) como patrocinador e pediu pra VER as quatro coisas
// que a gente combinou, num board só, pra mandar pro cara:
//   1. 🏖️ Torneio de praia no fim da temporada (quem não se classificou pra nada)
//   2. 🏐 A quadra de areia com a marca (e o "bico" busca-bola)
//   3. 🕴️ Bico de Folga — a marca vira o 5º bico, igual o Rei das Tintas
//   4. 😂 A zoeira dos folclóricos (Renato Gaúcho, Romário, Edmundo)
//
// Mora no repo (e não no scratchpad) pela mesma razão dos outros mockups:
// feito à mão SE PERDE. Se o Diego pedir ajuste, é aqui que se mexe.
//
// ⚠️ O LOGO é o REAL da página, recortado do print que o Diego mandou. Não
// inventar arte da marca deles — se precisar de versão melhor, pedir o arquivo.
//
//   node scripts/mockup-futevolei.mjs --logo caminho/fd_logo.png --saida x.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64f = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64f(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'futevolei.png')
const LOGO = arg('--logo', null)
const logoSrc = LOGO ? `data:image/png;base64,${readFileSync(LOGO).toString('base64')}` : null

// identidade da casa
const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
// identidade DELES (medida no logo real, não chutada)
const MARINHO = '#0C2C66', BOLA = '#F2C230'
const AREIA = '#E4C79B', AREIA2 = '#D3B27F'

const OSW = 'font-family:Oswald,sans-serif'
const box = (bg = '#fff', r = 18) => `background:${bg};border:4px solid ${INK};border-radius:${r}px;box-shadow:5px 5px 0 ${INK}`
const chip = (bg, cor = '#fff') => `display:inline-block;background:${bg};color:${cor};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};padding:6px 16px;${OSW};font-weight:700;font-size:17px;letter-spacing:1.2px;text-transform:uppercase`
const marca = (tam = 54) => logoSrc
  ? `<img src="${logoSrc}" style="width:${tam}px;height:${tam}px;border-radius:50%;border:3px solid ${INK};flex-shrink:0" />`
  : `<span style="width:${tam}px;height:${tam}px;border-radius:50%;border:3px solid ${INK};background:${MARINHO};color:#fff;display:flex;align-items:center;justify-content:center;${OSW};font-weight:700;font-size:${tam * .3}px;flex-shrink:0">FD</span>`

// mini-carta verde (a mesma do jogo, reduzida)
const mini = (nome, pos, clube) => `
  <div style="width:118px;border:3px solid ${INK};border-radius:12px;background:linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45);
              box-shadow:4px 4px 0 ${INK};aspect-ratio:3/4.2;padding:8px;display:flex;flex-direction:column;justify-content:space-between">
    <span style="${OSW};font-weight:700;background:${INK};color:#fff;border-radius:6px;font-size:9px;padding:1px 6px;align-self:flex-start">${pos}</span>
    <span style="align-self:center;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.35);color:#14532d;border:2px solid rgba(0,0,0,.28);
                 display:flex;align-items:center;justify-content:center;${OSW};font-weight:700;font-size:18px">${nome[0]}</span>
    <span style="text-align:center">
      <b style="display:block;${OSW};font-weight:700;color:#fff;font-size:12px;line-height:1.1">${nome}</b>
      <b style="display:block;color:#fff;opacity:.7;font-size:8px;font-weight:800;margin-top:2px">${clube}</b></span>
  </div>`

const titulo = (n, emoji, texto, sub) => `
  <div style="margin:0 0 14px">
    <p style="${OSW};font-weight:700;font-size:34px;margin:0;text-transform:uppercase;line-height:1.05">
      <span style="color:${RED}">${n}.</span> ${emoji} ${texto}</p>
    <p style="font-size:19px;font-weight:600;margin:6px 0 0;line-height:1.35;opacity:.78">${sub}</p>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,sans-serif;width:1080px;padding:52px 46px 46px}
</style></head><body>

<!-- ═══ CAPA ═══ -->
<div style="display:flex;align-items:center;gap:20px;margin-bottom:10px">
  ${marca(96)}
  <div>
    <div style="${chip(MARINHO)}">🏐 Proposta de parceria</div>
    <h1 style="${OSW};font-weight:700;font-size:58px;line-height:1.2;margin:10px 0 0;text-transform:uppercase">
      Futevôlei Depressão<br><span style="color:${GREEN}">dentro do Leilão Legends</span></h1>
  </div>
</div>
<p style="font-size:21px;font-weight:600;line-height:1.45;margin:14px 0 34px;max-width:930px">
  Quatro lugares onde a marca entra — <b>sem virar banner</b>. Em todos eles a piada é a mesma da página:
  quem não tem mais nada pra fazer no futebol vai parar na areia.
</p>

<!-- ═══ 1 · O TORNEIO ═══ -->
${titulo(1, '🏖️', 'Não se classificou pra nada? Vai pra praia', 'No Modo Carreira, no fim da temporada. Enquanto os outros jogam a final, o seu time joga futevôlei — porque não tem mais jogo.')}
<div style="display:flex;gap:18px;margin-bottom:38px">
  <div style="${box('#FBF6E9')};flex:1;padding:20px 22px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      ${marca(46)}
      <div><p style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.4px;margin:0;opacity:.55;text-transform:uppercase">Apresenta</p>
      <p style="${OSW};font-weight:700;font-size:24px;margin:0;line-height:1">Copa da Depressão</p></div>
    </div>
    <div style="background:#fff;border:3px solid ${INK};border-radius:14px;padding:16px 18px">
      <p style="${OSW};font-weight:700;font-size:22px;margin:0 0 6px">🏖️ Fim de linha, campeão.</p>
      <p style="font-size:17px;font-weight:600;line-height:1.4;margin:0 0 14px">
        Você terminou em <b>9º</b>. Sem título, sem acesso, sem copa, sem rebaixamento.<br>
        <b>Não sobrou jogo nenhum</b> — só a areia.</p>
      <div style="display:flex;gap:10px">
        <span style="flex:1;text-align:center;background:${MARINHO};color:#fff;border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};padding:11px;${OSW};font-weight:700;font-size:18px">🏐 BORA PRA PRAIA</span>
        <span style="text-align:center;background:#EDE6D2;border:3px solid ${INK};border-radius:11px;padding:11px 18px;${OSW};font-weight:700;font-size:18px;opacity:.6">Pular</span>
      </div>
      <p style="font-size:14px;font-weight:700;opacity:.6;margin:10px 0 0;text-align:center">Um toque. Dura 30 segundos. Quem não quiser, pula e segue a vida.</p>
    </div>
  </div>
  <div style="${box('#fff')};width:330px;padding:18px 20px">
    <p style="${OSW};font-weight:700;font-size:19px;margin:0 0 10px;text-transform:uppercase">Quem vai pra areia</p>
    ${[['🥇 Campeão', 'fica', false], ['🟨 G4 / acesso', 'fica', false], ['🏆 Foi pra copa', 'fica', false], ['😐 Meio de tabela', 'PRAIA', true], ['🟥 Rebaixado', 'PRAIA', true]]
      .map(([q, r, on]) => `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px dashed rgba(0,0,0,.14);padding:9px 0">
        <span style="font-size:16px;font-weight:700">${q}</span>
        <span style="${OSW};font-weight:700;font-size:14px;padding:3px 10px;border-radius:999px;border:2px solid ${INK};background:${on ? MARINHO : '#EDE6D2'};color:${on ? '#fff' : 'rgba(0,0,0,.45)'}">${r}</span></div>`).join('')}
    <p style="font-size:14.5px;font-weight:700;line-height:1.35;margin:12px 0 0;opacity:.7">Junta o meio de tabela de <b>todas as divisões</b>. O 9º da Série A cai na areia contra o 11º da Série D — e é essa a graça.</p>
  </div>
</div>

<!-- ═══ 2 · A QUADRA ═══ -->
${titulo(2, '🏐', 'A quadra é de vocês', 'A marca na rede, na areia e no troféu. Aparece em toda partida de praia — não é banner de canto, é o cenário.')}
<div style="${box('#fff')};overflow:hidden;margin-bottom:38px">
  <div style="background:linear-gradient(180deg,#BFE3F5 0%,#BFE3F5 26%,${AREIA} 26%,${AREIA2} 100%);padding:22px 26px 26px;position:relative;min-height:310px">
    <!-- faixa da rede com a marca -->
    <div style="position:absolute;left:0;right:0;top:78px;height:52px;background:${MARINHO};border-top:4px solid ${INK};border-bottom:4px solid ${INK};
                display:flex;align-items:center;justify-content:center;gap:14px;color:#fff;${OSW};font-weight:700;font-size:22px;letter-spacing:2px">
      ${marca(38)} FUTEVÔLEI DEPRESSÃO ${marca(38)}
    </div>
    <!-- postes -->
    <div style="position:absolute;left:34px;top:44px;width:12px;height:150px;background:${INK};border-radius:4px"></div>
    <div style="position:absolute;right:34px;top:44px;width:12px;height:150px;background:${INK};border-radius:4px"></div>
    <!-- dupla na areia -->
    <div style="position:absolute;left:26px;bottom:22px;display:flex;gap:12px;align-items:flex-end">
      ${mini('Edmundo', 'ATA', 'Vasco · 1997')}
      ${mini('Renato Gaúcho', 'ATA', 'Grêmio · 1983')}
      <div style="padding-bottom:6px">
        <p style="${OSW};font-weight:700;font-size:16px;margin:0;text-transform:uppercase">Sua dupla</p>
        <p style="font-size:13.5px;font-weight:700;opacity:.65;margin:2px 0 0;line-height:1.3;max-width:150px">Só 2 do elenco.<br>Craque de verdade "viajou".</p>
      </div>
    </div>
    <!-- o bico busca-bola -->
    <div style="position:absolute;right:26px;bottom:22px;width:300px;background:rgba(255,255,255,.94);border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:12px 14px">
      <div style="display:flex;align-items:center;gap:10px">
        ${marca(40)}
        <div><p style="${OSW};font-weight:700;font-size:15px;margin:0;line-height:1.1">🎾 O busca-bola</p>
        <p style="font-size:12.5px;font-weight:700;opacity:.65;margin:2px 0 0;line-height:1.25">Quem é bico na areia não joga:<br>vai catar bola pro Depressão.</p></div>
      </div>
    </div>
  </div>
  <div style="padding:16px 22px;display:flex;gap:22px;align-items:center;border-top:4px solid ${INK}">
    <span style="font-size:17px;font-weight:700;flex:1;line-height:1.35">🩴 <b>Na areia a lógica vira:</b> zagueirão brucutu é perna-de-pau, folclórico e driblador viram monstro, e goleiro nem entra. Nenhuma carta nova — o mesmo baralho pontua por outra conta.</span>
    <span style="text-align:center;background:${GOLD};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:10px 14px;flex-shrink:0">
      <b style="display:block;font-size:30px;line-height:1">🩴</b>
      <b style="display:block;${OSW};font-weight:700;font-size:13px;text-transform:uppercase">Chinelo de Ouro</b>
      <b style="display:block;font-size:11px;font-weight:800;opacity:.6">vale 0 ponto no ranking</b></span>
  </div>
</div>

<!-- ═══ 3 · O BICO ═══ -->
${titulo(3, '🕴️', 'Bico de Folga — igual o Rei das Tintas', 'Esse lugar JÁ EXISTE no jogo: quando o clube é pequeno, o jogador arruma um bico num patrocinador pra ajudar no caixa. A marca vira o 5º.')}
<div style="display:flex;gap:18px;margin-bottom:38px">
  <div style="${box('#fff')};flex:1;padding:18px 20px">
    ${[['🚗', '#FDE68A', 'Vadico Veículos', 'vendedor nas folgas', false],
       ['💍', '#F5D0E8', 'Max Jóias', 'atendente na loja', false],
       ['🦷', '#CFE8FB', 'Ero Dentista', 'recepcionista', false],
       ['🎨', '#FBD0C6', 'Rei das Tintas', 'pintor de parede nas folgas', false],
       [null, null, 'Futevôlei Depressão', 'busca-bola na quadra de areia', true]]
      .map(([ic, bg, nome, cargo, novo]) => `
      <div style="display:flex;align-items:center;gap:12px;border:3px solid ${novo ? MARINHO : INK};border-radius:12px;padding:10px 12px;margin-bottom:9px;background:${novo ? '#EAF0FB' : '#FBF6E9'}">
        ${ic ? `<span style="width:44px;height:44px;border-radius:10px;border:3px solid ${INK};background:${bg};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${ic}</span>` : marca(44)}
        <span style="flex:1"><b style="display:block;${OSW};font-weight:700;font-size:18px">${nome}</b>
        <b style="display:block;font-size:14px;font-weight:700;opacity:.6">${cargo}</b></span>
        ${novo ? `<span style="${OSW};font-weight:700;font-size:13px;background:${MARINHO};color:#fff;border:2px solid ${INK};border-radius:999px;padding:4px 12px">NOVO</span>` : ''}
      </div>`).join('')}
  </div>
  <div style="${box(MARINHO)};width:330px;padding:20px;color:#fff">
    <p style="${OSW};font-weight:700;font-size:20px;margin:0 0 10px;text-transform:uppercase">Por que encaixa</p>
    <p style="font-size:16px;font-weight:600;line-height:1.45;margin:0 0 12px">O bico é pra quem está na <b>Várzea</b> ou na <b>Série D</b> — ou seja, exatamente quem não ganhou nada ainda.</p>
    <p style="font-size:16px;font-weight:600;line-height:1.45;margin:0">A piada se escreve sozinha: <b>o cara não vive de futebol, então cata bola na quadra de areia pra fechar o mês.</b></p>
  </div>
</div>

<!-- ═══ 4 · A ZOEIRA ═══ -->
${titulo(4, '😂', 'A zoeira dos folclóricos', 'Alguns nomes do baralho já são folclóricos no jogo. Quando eles caem na areia, a marca entra na piada.')}
<div style="display:flex;gap:14px;margin-bottom:34px">
  ${[['Renato Gaúcho', 'Grêmio · 1983', '"Faltou no treino. Estava na rede da praia — e ganhou lá também."'],
     ['Romário', 'Vasco · 2000', '"Chegou 10 minutos antes do jogo. Na areia, chegou 3 horas antes."'],
     ['Edmundo', 'Vasco · 1997', '"Perdeu a cabeça no futebol. Na areia perdeu a cabeça também, mas com o sol."']]
    .map(([n, c, f]) => `
    <div style="${box('#fff')};flex:1;padding:16px 18px">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px">
        <span style="width:36px;height:36px;border-radius:50%;background:linear-gradient(150deg,#41C07A,#1E7A45);border:2.5px solid ${INK};color:#fff;${OSW};font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center">${n[0]}</span>
        <span><b style="display:block;${OSW};font-weight:700;font-size:16px;line-height:1.1">${n}</b>
        <b style="display:block;font-size:11.5px;font-weight:800;opacity:.55">${c}</b></span>
        <span style="margin-left:auto;font-size:10px;${OSW};font-weight:700;background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:2px 8px">🃏 FOLK</span>
      </div>
      <p style="font-size:15px;font-weight:600;font-style:italic;line-height:1.4;margin:0 0 10px;min-height:84px">${f}</p>
      <div style="display:flex;align-items:center;gap:7px;border-top:2px dashed rgba(0,0,0,.15);padding-top:9px">
        ${marca(24)}<b style="font-size:11.5px;font-weight:800;opacity:.6">Futevôlei Depressão</b>
      </div>
    </div>`).join('')}
</div>

<!-- ═══ RODAPÉ ═══ -->
<div style="${box('#fff')};padding:20px 24px;display:flex;gap:20px;align-items:center">
  ${marca(64)}
  <div style="flex:1">
    <p style="${OSW};font-weight:700;font-size:22px;margin:0;text-transform:uppercase">Nada disso atrasa o jogo</p>
    <p style="font-size:16px;font-weight:600;line-height:1.4;margin:5px 0 0">Tudo entra em <b>tempo morto</b>: o torneio é no fim da temporada, quando quem está no meio da tabela já não tem mais jogo. Um toque pra jogar, um toque pra pular.</p>
  </div>
</div>
<p style="margin:22px 0 0;${OSW};font-weight:700;font-size:24px;display:flex;justify-content:space-between;align-items:baseline">
  <span>⚽ Leilão <span style="color:${RED}">Legends</span></span>
  <span style="font-size:17px;opacity:.5">leilaolegends.com · mockup, ainda não está no ar</span></p>

</body></html>`

const tmp = `/tmp/mockup-futevolei-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA + (logoSrc ? ' · com logo real' : ' · SEM logo (passe --logo)'))
