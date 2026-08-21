// ─── 🎩 SALA DA PRESIDÊNCIA · O MOCKUP QUE O DIEGO APROVOU (recuperado) ─────
//
// 21/08 — ele: *"eu tinha feito outro mockup da sala de presidente contigo q
// tinha gostado"*. E tinha mesmo, em 16/08.
//
// 🕳️ A IMAGEM SE PERDEU: aquele mockup foi feito no chat e nunca virou script no
// repo — o MESMO acidente do mockup do Coringas, que é a razão da regra do
// `mockup-batismo.mjs` existir ("mockup mora no repo"). Lição reforçada: TODO
// mockup vira arquivo aqui, sempre.
//
// ✅ MAS O DESENHO NÃO SE PERDEU. O começo do código nasceu daquele mockup e
// está guardado na branch `claude/presidencia-em-breve` (commit 02d2d5c). Este
// arquivo reconstrói a tela **fiel ao código guardado**, linha por linha — nada
// aqui é invenção nova:
//   · título "🎩 SALA DA PRESIDÊNCIA" + a frase que fechou a conversa do técnico:
//     "Você não é o técnico. Você é o DONO do <clube>.";
//   · 🎩 Técnico e 🚗 Garagem em cinza com o selo EM BREVE (sem botão, pra
//     ninguém clicar no vazio);
//   · 💰 Patrimônio do clube (caixa + estádio investido + elenco a preço de
//     mercado + SAF) — só leitura;
//   · 🏆 Hall de Troféus — a MESMA estante da aba Rank (fonte única `meusTrofeus`,
//     pra não virarem duas verdades).
//
//   node scripts/mockup-presidencia-v1.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'presidencia-v1.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CO1 = '#0C0C0C', CO2 = '#FFFFFF' // cores do coração (SÓ cores, sem nome)

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 376px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:62px">${nota}</div>
  <div style="width:376px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// as 4 sub-abas do jeito que o código guardado deixou
const subabas = `
  <div style="background:${INK};padding:10px 13px;color:#fff;display:flex;align-items:center;justify-content:space-between">
    <span style="${OSW};font-size:13px">🏟️ CLUBE</span>
    <span style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(255,255,255,.5)">NEYMARZETTI · SÉRIE C</span>
  </div>
  <div style="display:flex;gap:5px;padding:9px 10px 11px;background:${CREME};border-bottom:2.5px solid rgba(12,12,12,.16)">
    ${[['🏗️', 'Estrutura', 0], ['💰', 'Finanças', 0], ['🤝', 'Patroc.', 0], ['🎩', 'Presid.', 1]].map(([i, t, on]) => `
      <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:${on ? PURPLE : '#fff'};color:${on ? '#fff' : INK};
        box-shadow:2px 2px 0 ${INK};padding:7px 1px;text-align:center;${OSW};font-size:9px;text-transform:uppercase">${i} ${t}</div>`).join('')}
  </div>`

// ── as peças EXATAS do código guardado ─────────────────────────────────────
const cabecalho = nome => `
  <div style="${box('#fff')};padding:12px;margin-bottom:10px">
    <p style="${OSW};font-size:16px;margin:0;text-transform:uppercase">🎩 Sala da Presidência</p>
    <p style="font-family:system-ui;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:2px 0 0">
      Você não é o técnico. <b style="color:${INK}">Você é o dono do ${nome}.</b></p>
  </div>`

const emBreve = (ic, titulo, texto) => `
  <div style="${box('#EFEADA')};padding:12px;margin-bottom:10px;display:flex;gap:11px;align-items:flex-start">
    <span style="font-size:30px;line-height:1;flex:none;filter:grayscale(.35)">${ic}</span>
    <div style="min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <p style="${OSW};font-size:14.5px;margin:0;text-transform:uppercase">${titulo}</p>
        <span style="font-size:9px;${OSW};text-transform:uppercase;border:2px solid ${INK};border-radius:6px;padding:1px 6px;background:#EDE7FF;color:${PURPLE}">em breve</span>
      </div>
      <p style="font-family:system-ui;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:3px 0 0;line-height:1.4">${texto}</p>
    </div>
  </div>`

const linhaPat = (ic, nome, valor, obs) => `
  <div style="display:flex;align-items:center;gap:8px;border-top:1px solid rgba(0,0,0,.1);padding:7px 0">
    <span style="font-size:15px;flex:none">${ic}</span>
    <span style="flex:1;min-width:0;font-family:system-ui;font-weight:800;font-size:12.5px">${nome}${obs ? `<span style="font-weight:700;font-size:10px;color:rgba(0,0,0,.45)"> · ${obs}</span>` : ''}</span>
    <span style="${OSW};font-size:13.5px;white-space:nowrap">${valor}</span>
  </div>`

const patrimonio = `
  <div style="${box('#fff')};padding:12px;margin-bottom:10px">
    <p style="${OSW};font-size:14px;margin:0 0 1px">💰 Patrimônio do clube</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 4px">Tudo que é seu hoje, somado. Só leitura — nada aqui gasta nem rende.</p>
    ${linhaPat('🪙', 'Caixa', '626')}
    ${linhaPat('🏟️', 'Estádio', '4.100', 'o que você já investiu')}
    ${linhaPat('👥', 'Elenco', '2.940', '22 jogadores')}
    ${linhaPat('🏢', 'SAF', '1.200', 'Skyy FC')}
    <div style="display:flex;align-items:center;gap:8px;border-top:2.5px solid ${INK};margin-top:4px;padding-top:7px">
      <span style="flex:1;${OSW};font-size:13.5px;text-transform:uppercase">Patrimônio</span>
      <span style="${OSW};font-size:18px;color:${GREEN}">8.866 🪙</span>
    </div>
  </div>`

const trofeu = (label, n, bg, c) => `
  <div style="width:82px;border:2.5px solid ${INK};border-radius:12px;background:${bg};color:${c};box-shadow:3px 3px 0 ${INK};padding:10px 6px 8px;text-align:center">
    <div style="font-size:30px;line-height:1">🏆</div>
    <div style="${OSW};font-size:15px;margin-top:2px">×${n}</div>
    <div style="${OSW};font-size:9px;text-transform:uppercase;letter-spacing:.02em;margin-top:1px;opacity:.92">${label}</div>
  </div>`

const estante = `
  <div style="${box('linear-gradient(160deg,#FFF7E0,#FFEBB0)')};padding:12px;margin-bottom:10px">
    <p style="${OSW};font-size:14px;margin:0 0 2px">🏆 Hall de Troféus</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55);margin:0 0 10px">A estante do Neymarzetti — guardada pra sempre · temporada 12.</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${trofeu('Copa do Brasil', 1, '#0EA658', '#fff')}
      ${trofeu('Supercopa', 1, '#0D4FCC', '#fff')}
      ${trofeu('Série D', 2, '#CFE8FB', INK)}
      ${trofeu('Várzea', 1, '#DFF3E3', INK)}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;align-items:center">
      <span style="${OSW};font-size:11px;background:${INK};color:#fff;border-radius:8px;padding:3px 8px">Total: 5 🏆</span>
      <span style="${OSW};font-size:11px;background:#fff;color:${INK};border:2px solid ${INK};border-radius:8px;padding:3px 8px">Hoje na Série C</span>
    </div>
  </div>`

// ── ① O QUE VOCÊ APROVOU (reconstruído do código guardado) ─────────────────
const APROVADO = `${subabas}
  <div style="padding:11px">
    ${cabecalho('Neymarzetti')}
    ${emBreve('🎩', 'Técnico', 'Contrate um treinador de verdade pro clube. Cada um tem um jeito que muda alguma coisa em campo — e você vai VER ele agindo, no jornal, toda vez que valer.')}
    ${emBreve('🚗', 'Garagem do presidente', 'O carro do presidente. Clube maior, carreata melhor — e todo mundo vê o seu na hora do título.')}
    ${patrimonio}
    ${estante}
  </div>`

// ── ② COM AS PEÇAS PESSOAIS ENCAIXADAS (nada do aprovado sai) ──────────────
const presidenteSvg = (s, tier = GOLD) => `
  <svg width="${s}" height="${s}" viewBox="0 0 80 80" style="display:block">
    <circle cx="40" cy="40" r="37" fill="#EFE6CF" stroke="${INK}" stroke-width="4"/>
    <circle cx="40" cy="30" r="13" fill="#D9C9A6" stroke="${INK}" stroke-width="3.5"/>
    <path d="M18 74 C18 58 28 50 40 50 C52 50 62 58 62 74 Z" fill="${INK}"/>
    <path d="M40 50 L33 74 H47 Z" fill="#fff"/>
    <path d="M40 52 L36 60 L40 74 L44 60 Z" fill="${tier}" stroke="${INK}" stroke-width="1.5"/>
  </svg>`

const NOVO = `${subabas}
  <div style="padding:11px">
    <!-- 🆕 retrato de posse -->
    <div style="${box('#fff')};overflow:hidden;margin-bottom:10px">
      <div style="height:8px;background:repeating-linear-gradient(90deg,${CO1} 0 12px,${CO2} 12px 24px);border-bottom:3px solid ${INK}"></div>
      <div style="padding:12px 12px 11px;display:flex;align-items:center;gap:12px;background:linear-gradient(180deg,#FBF6E9,#fff)">
        ${presidenteSvg(62)}
        <div style="min-width:0;flex:1">
          <p style="${OSW};font-size:16px;margin:0;text-transform:uppercase">🎩 Sala da Presidência</p>
          <p style="font-family:system-ui;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:2px 0 0;line-height:1.35">
            Você não é o técnico. <b style="color:${INK}">Você é o dono do Neymarzetti.</b></p>
          <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.45);margin:4px 0 0">Presidente desde <b>27/07/2026</b></p>
          <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
            <span style="${OSW};font-size:8.5px;border:2px solid ${INK};border-radius:999px;padding:1px 7px;background:${GOLD}">👑 LENDA</span>
            <span style="${OSW};font-size:8.5px;border:2px solid ${INK};border-radius:999px;padding:1px 7px;background:#fff">FUNDADOR Nº 1</span>
          </div>
        </div>
      </div>
      <!-- 🆕 números do mandato, na mesma peça -->
      <div style="display:flex;border-top:2.5px solid ${INK}">
        ${[['12', 'temporadas'], ['5', 'títulos'], ['146', 'contratados']].map((n, i) => `
          <div style="flex:1;text-align:center;padding:8px 2px;${i < 2 ? 'border-right:1.5px solid rgba(12,12,12,.12)' : ''}">
            <div style="${OSW};font-size:17px;line-height:1">${n[0]}</div>
            <div style="font-family:system-ui;font-size:8.5px;font-weight:700;color:rgba(0,0,0,.5);margin-top:1px">${n[1]}</div>
          </div>`).join('')}
      </div>
    </div>

    ${emBreve('🎩', 'Técnico', 'Contrate um treinador de verdade pro clube. Cada um tem um jeito que muda alguma coisa em campo — e você vai VER ele agindo, no jornal, toda vez que valer.')}
    ${emBreve('🚗', 'Garagem do presidente', 'O carro do presidente. Clube maior, carreata melhor — e todo mundo vê o seu na hora do título.')}
    ${patrimonio}
    ${estante}

    <!-- 🆕 a linha do mandato, no fim (não empurra nada do aprovado) -->
    <div style="${box('#fff')};padding:12px">
      <p style="${OSW};font-size:14px;margin:0 0 1px">📜 A linha do mandato</p>
      <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 8px">Sai do seu save — cada presidente tem uma história diferente.</p>
      <div style="position:relative;padding-left:14px">
        <div style="position:absolute;left:4px;top:4px;bottom:4px;width:3px;background:rgba(12,12,12,.15);border-radius:2px"></div>
        ${[['T1', 'Assumiu na Várzea', '#8a7d59'], ['T3', 'Subiu pra Série D', GREEN], ['T7', 'CAMPEÃO da Série D', GOLD], ['T9', 'Caiu pra Série D', RED], ['T12', 'Subiu pra Série C', GREEN]].map(l => `
          <div style="display:flex;align-items:center;gap:9px;padding:4px 0;position:relative">
            <span style="position:absolute;left:-13px;width:9px;height:9px;border-radius:999px;background:${l[2]};border:2px solid ${INK}"></span>
            <span style="${OSW};font-size:11px;width:26px;color:rgba(0,0,0,.45)">${l[0]}</span>
            <span style="${OSW};font-size:12px">${l[1]}</span>
          </div>`).join('')}
      </div>
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
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩 SALA DA PRESIDÊNCIA · RECUPERADO</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    ACHEI O QUE VOCÊ <span style="color:${RED}">TINHA APROVADO</span></h1>
  <p style="font-size:14px;font-weight:600;max-width:1080px;line-height:1.5;margin:0 0 6px">
    <b>A imagem do mockup se perdeu</b> — aquele foi feito no chat e nunca virou arquivo no repo. É o mesmo acidente do
    mockup do Coringas, que é justamente por que existe a regra "mockup mora no repo". Lição reforçada, e este aqui já
    nasce salvo.
  </p>
  <p style="font-size:14px;font-weight:600;max-width:1080px;line-height:1.5;margin:0 0 24px">
    <b>Mas o desenho não se perdeu:</b> o começo do código nasceu dele e está guardado na branch
    <code>claude/presidencia-em-breve</code>. O celular ① abaixo é <b>reconstruído linha por linha desse código</b> —
    nada ali é invenção nova.
  </p>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;margin-bottom:28px">
    ${fone(APROVADO, '① O que você aprovou (16/08)', GREEN, 'A frase que fechou a conversa do técnico — <b>"Você não é o técnico. Você é o dono do Neymarzetti."</b> — o técnico e a garagem em cinza com EM BREVE, o patrimônio somado e o Hall de Troféus (a MESMA estante da aba Rank).')}
    ${fone(NOVO, '② Com as peças pessoais encaixadas', PURPLE, '<b>Nada do aprovado sai.</b> O retrato de posse e os números do mandato entram <b>no cabeçalho que já existia</b>, e a linha do mandato entra <b>no fim</b>. A ordem do que você aprovou continua igualzinha no meio.')}
    <div style="flex:1;min-width:400px">
      ${bloco('🎯 O que eu proponho agora', '#E6F3EA', `
        <b>Ficar com a sua versão</b> — ela é melhor que a que eu desenhei hoje de manhã em duas coisas:<br><br>
        · a frase <b>"você é o dono do clube"</b> é a alma da tela, e eu tinha deixado ela de fora;<br>
        · o <b>Hall de Troféus</b> com ×N por competição é mais bonito que a grade que eu fiz, e usa a
        <b>mesma fonte</b> da aba Rank (o código já garante que não viram duas verdades).<br><br>
        E aí eu encaixo só <b>3 peças novas</b>, sem tirar nada: o <b>retrato de posse</b> (dentro do cabeçalho que já
        existe), os <b>números do mandato</b> (uma tira de 3 no mesmo cartão) e a <b>linha do mandato</b> (no fim).`)}
      ${bloco('❤️ E o time de coração', '#EAF3FF', `
        Fica como eu falei: <b>só a faixa de cores</b> no topo do cartão (sem nome, sem escudo real) e o convite pra
        quem não disse. Hoje são <b>56 de 7.564</b> — o convite é o que faz esse número crescer.<br><br>
        <b>Tabela e jogo ao vivo do time real continuam fora</b>, pelos 3 motivos que eu já te falei.`)}
      ${bloco('🙋 A decisão que falta (a mesma de 16/08)', '#FFF6D6', `
        <b>3 ou 4 sub-abas no Clube?</b> O código guardado fez com <b>4</b> (Estrutura · Finanças · Patrocínio ·
        Presidência) — foi assim que eu desenhei o celular ① aqui, pra ser fiel.<br><br>
        <b>Minha recomendação continua sendo 3</b>, com a Presidência engolindo o Patrocínio: 4 pílulas ficam
        apertadas no celular, e fechar patrocínio é trabalho de presidente. Mas quem decide é você — e o código
        guardado já está pronto pros dois jeitos.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-presv1-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
