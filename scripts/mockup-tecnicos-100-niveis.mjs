// ─── 🎩 OS 100 TÉCNICOS: NÍVEL, RARIDADE E "EXPLICAR OU NÃO" (Diego 24/08) ──
//
// Perguntas dele, uma a uma:
//  ① *"agora tem q bolar tb em relação a NÍVEL nessa tabela de 100,
//     principalmente de lendas q ficariam na frente"*
//  ② *"de 100 técnicos quais seriam lendas e craques?"*
//  ③ *"como diferenciar o Telê Santana sendo lenda pro Pep Guardiola sendo
//     lenda?"*
//  ④ *"no football manager N explica mt né.. então eu N sei se quero explicar
//     tb p ng as coisas... oq me diz"*
//
// A resposta ③ é a espinha deste mockup: **tier diz QUANTO, identidade diz O
// QUÊ** — e as 5 formações de uma lenda são um CONJUNTO com cara própria, não um
// número maior. Telê domina 5 ofensivas; Pep domina 5 de posse. Escolher a lenda
// escolhe o SEU estilo, não "a melhor".
//
// A resposta ④ é uma recomendação com base na DNA que o jogo já tem:
//   · o leilão esconde NÍVEL até a revelação (alma do jogo) — mas as REGRAS do
//     leilão são explicadas com todas as letras;
//   · `olheiros` (pyramidseason ~2950) já mostra o overall SÓ pra prata/ouro.
//   → Logo: **regra explicada pra todo mundo, número escondido**. É o meio-termo
//     que já é a cara do Leilão Legends — e não copia o FM, que é jogo de nerd
//     de planilha, público oposto ao dele.
//
//   node scripts/mockup-tecnicos-100-niveis.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tecnicos-100.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED', BLUE = '#2F6BAE'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// ── ② A PIRÂMIDE DOS 100 ───────────────────────────────────────────────────
const TIERS = [
  ['👑', 'Lenda', 8, 5, 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200)', INK, 'Só a Série A e B contratam. Caríssimo, exigente.'],
  ['⭐', 'Craque', 17, 4, 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', INK, 'Da Série C pra cima. O ponto doce do jogo.'],
  ['🟢', 'Bom', 25, 3, 'linear-gradient(160deg,#41C07A,#2E9E5B)', '#fff', 'Qualquer divisão. O feijão com arroz que funciona.'],
  ['🔵', 'Profissional', 30, 2, 'linear-gradient(160deg,#7FB2E5,#2F6BAE)', '#fff', 'Barato. Aceita clube quebrado.'],
  ['⚪', 'Estreante', 20, 1, 'linear-gradient(160deg,#EFE9D6,#CBBF9E)', INK, 'Quase de graça — e pode virar craque com você.'],
]
const barra = ([ic, nome, qtd, forms, grad, cor, nota]) => `
  <div style="${box('#fff')};padding:10px 11px;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:9px">
      <span style="flex:none;width:38px;height:38px;border-radius:11px;border:2.5px solid ${INK};background:${grad};color:${cor};
        display:flex;align-items:center;justify-content:center;font-size:18px">${ic}</span>
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:14px;margin:0;text-transform:uppercase">${nome}
          <span style="color:${PURPLE};font-size:11px"> · ${forms} ${forms > 1 ? 'formações' : 'formação'}</span></p>
        <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.52);margin:2px 0 0;line-height:1.3">${nota}</p>
      </div>
      <span style="${OSW};font-size:20px;flex:none;color:${INK}">${qtd}</span>
    </div>
    <div style="height:9px;border:2px solid ${INK};border-radius:999px;background:#EFE9D6;margin-top:7px;overflow:hidden">
      <div style="height:100%;width:${qtd}%;background:${grad}"></div>
    </div>
  </div>`

// ── ③ TELÊ × PEP: MESMO TIER, TIMES OPOSTOS ────────────────────────────────
const ficha = (nome, sub, grad, linhas) => `
  <div style="${box('#fff')};overflow:hidden;margin-bottom:10px">
    <div style="background:${grad};border-bottom:3px solid ${INK};padding:9px 12px">
      <p style="${OSW};font-size:15px;margin:0;text-transform:uppercase">${nome}</p>
      <p style="font-family:system-ui;font-size:9.5px;font-weight:800;color:rgba(0,0,0,.55);margin:1px 0 0">${sub}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-family:system-ui;font-size:10.5px;font-weight:700">
      ${linhas.map(([k, v]) => `<tr style="border-top:1px solid rgba(0,0,0,.08)">
        <td style="padding:6px 7px 6px 11px;color:rgba(0,0,0,.45);white-space:nowrap;vertical-align:top;width:74px">${k}</td>
        <td style="padding:6px 11px 6px 0;line-height:1.4">${v}</td></tr>`).join('')}
    </table>
  </div>`

const TELE = ficha('Telê Santana', '👑 LENDA · o futebol-arte', 'linear-gradient(160deg,#FFE79A,#FFC400)', [
  ['🎯 Faz', 'Com <b>3 atacantes</b>: seu time cria muito mais.'],
  ['📋 Domina', '4-2-4 · 4-3-3 · 3-4-3 · 4-4-2 losango · 3-5-2<br><span style="color:'+RED+'">todas OFENSIVAS — ele não sabe segurar jogo</span>'],
  ['⚠️ Fraco', 'A defesa dele <b>sempre</b> leva gol.'],
  ['😤 Jeito', 'Cede sem levantar a voz — e solta uma ironia fina.'],
  ['💰 Custo', 'Salário <b>altíssimo</b> · <b>quer título em 2 temporadas</b>.'],
])
const PEP = ficha('Pep Guardiola', '👑 LENDA · a posse de bola', 'linear-gradient(160deg,#C9A9FF,#8B5CF6)', [
  ['🎯 Faz', 'Com <b>5 meias</b>: o time cria E se defende junto.'],
  ['📋 Domina', '4-2-3-1 · 4-5-1 · 4-3-2-1 · 4-3-3 · 3-5-2<br><span style="color:'+RED+'">todas de MEIO — ele não joga na raça</span>'],
  ['⚠️ Fraco', 'Precisa de <b>elenco caro</b>: com time fraco não funciona.'],
  ['😤 Jeito', 'Fica emburrado e reclama na entrevista.'],
  ['💰 Custo', 'Salário <b>altíssimo</b> · <b>exige elenco de nível alto</b>.'],
])

// ── ④ EXPLICAR OU NÃO ──────────────────────────────────────────────────────
const telaA = `
  <div style="${box('#fff')};padding:11px">
    <p style="${OSW};font-size:12px;margin:0 0 7px;text-transform:uppercase;color:${GREEN}">✅ O que eu faria</p>
    <div style="border:2.5px solid ${INK};border-radius:12px;padding:10px 11px;background:#FBF6E9">
      <p style="${OSW};font-size:13px;margin:0;text-transform:uppercase">👑 Telê Santana</p>
      <p style="font-family:system-ui;font-size:11px;font-weight:700;margin:5px 0 0;line-height:1.4">
        ⚽ Com <b>3 atacantes</b>, seu time <b>cria muito mais</b>.<br>
        ⚠️ Mas a defesa dele <b>leva gol</b>.<br>
        📋 Esquemas dele: 4-2-4 · 4-3-3 · 3-4-3 · losango · 3-5-2</p>
      <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45);margin:7px 0 0;border-top:1px solid rgba(0,0,0,.1);padding-top:6px">
        👀 <i>o QUANTO exato só quem tem olheiro vê</i></p>
    </div>
    <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);margin:8px 0 0;line-height:1.4">
      A <b>regra</b> em português claro. O <b>número</b> escondido.</p>
  </div>`
const telaB = `
  <div style="${box('#EFEADA')};padding:11px">
    <p style="${OSW};font-size:12px;margin:0 0 7px;text-transform:uppercase;color:${RED}">🚫 O jeito Football Manager</p>
    <div style="border:2.5px solid rgba(12,12,12,.35);border-radius:12px;padding:10px 11px;background:#fff;opacity:.75">
      <p style="${OSW};font-size:13px;margin:0;text-transform:uppercase">Telê Santana</p>
      <p style="font-family:ui-monospace,monospace;font-size:10px;font-weight:700;margin:6px 0 0;line-height:1.6;color:rgba(0,0,0,.6)">
        Atacante &nbsp;&nbsp;★★★★★<br>Defesa &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;★★☆☆☆<br>
        Disciplina&nbsp;&nbsp;★★★☆☆<br>Adaptab. &nbsp;&nbsp;★★★★☆</p>
    </div>
    <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);margin:8px 0 0;line-height:1.4">
      Bonito, mas <b>não diz o que ACONTECE</b> no seu time. Quem joga 6 minutos no ônibus não vai descobrir sozinho.</p>
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
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩 OS 100 · NÍVEL, RARIDADE E O QUE CONTAR</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    LENDA NÃO É <span style="color:${RED}">RANKING</span></h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1200px;line-height:1.5;margin:0 0 22px">
    Sua pergunta do Telê × Pep tem uma resposta só: <b>o tier diz QUANTO, a identidade diz O QUÊ.</b>
    As 5 formações de uma lenda não são "5 quaisquer" — são um <b>conjunto com cara própria</b>. Escolher a lenda
    é escolher o SEU estilo, não pegar "a melhor". Por isso duas lendas nunca competem entre si.
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:26px">
    <div style="flex:0 0 360px">
      <div style="${OSW};font-size:15px;text-transform:uppercase;color:${BLUE};margin-bottom:3px">② Quantos de cada, nos 100</div>
      <p style="font-family:system-ui;font-weight:600;font-size:11px;color:rgba(12,12,12,.5);margin:0 0 10px">
        Lenda tem que ser <b>raro</b> — 8 em 100. Se lenda fosse comum, ninguém olhava pro resto.</p>
      ${TIERS.map(barra).join('')}
      <div style="${box('#E3EEF9')};padding:11px 12px;font-family:system-ui;font-size:11px;font-weight:700;line-height:1.5">
        🔑 <b>O filtro que resolve o "nível" sem número:</b> técnico bom <b>não aceita qualquer clube</b>.
        Na Várzea aparecem estreantes e profissionais. Chegou na Série C, aparece craque. Só na A e B a
        <b>lenda atende o telefone</b>.<br><br>
        Assim o "nível" do técnico é sentido na PELE (subir de divisão destrava gente melhor) em vez de virar
        um número na tabela.</div>
    </div>

    <div style="flex:0 0 372px">
      <div style="${OSW};font-size:15px;text-transform:uppercase;color:${PURPLE};margin-bottom:3px">③ Duas lendas, times opostos</div>
      <p style="font-family:system-ui;font-weight:600;font-size:11px;color:rgba(12,12,12,.5);margin:0 0 10px">
        Mesmo tier, mesmo salário, mesmas 5 formações — e <b>nada em comum</b>.</p>
      ${TELE}
      ${PEP}
      <div style="${box('#FFF6D6')};padding:11px 12px;font-family:system-ui;font-size:11px;font-weight:700;line-height:1.5">
        ⚔️ <b>Quem é melhor?</b> Depende de VOCÊ. Elenco cheio de atacante caro → Telê. Elenco de meias →
        Pep. Elenco fraco → <b>nenhum dos dois</b> (o Pep nem funciona, e o Telê vai embora quando você não
        for campeão). <b>Um craque barato seria melhor</b> — e é aí que a escolha fica boa.</div>
    </div>

    <div style="flex:1;min-width:400px">
      <div style="${OSW};font-size:15px;text-transform:uppercase;color:${GREEN};margin-bottom:3px">④ Explicar ou não?</div>
      <p style="font-family:system-ui;font-weight:600;font-size:11px;color:rgba(12,12,12,.5);margin:0 0 10px">
        Sua dúvida: <i>"no FM não explica muito… não sei se quero explicar pras pessoas"</i>. Olha os dois lado a lado:</p>
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <div style="flex:1">${telaA}</div>
        <div style="flex:1">${telaB}</div>
      </div>
      ${bloco('🗣️ Minha resposta: EXPLICA A REGRA, ESCONDE O NÚMERO', '#E6F3EA', `
        E não é opinião solta — <b>é o que o seu jogo já faz</b>:<br><br>
        · no leilão, o <b>nível é escondido</b> até a revelação (a alma do jogo) — mas <b>as regras do leilão são
        explicadas com todas as letras</b>, com narrador e tudo;<br>
        · o <b>olheiro</b> já mostra o overall só pra prata/ouro. O número já é um prêmio.<br><br>
        Então o técnico segue a MESMA lei: <b>"com 3 atacantes seu time cria muito mais"</b> todo mundo lê;
        <b>"+4"</b> só quem tem olheiro vê. Você não copia o FM nem entrega tudo de bandeja.`)}
      ${bloco('⚠️ Por que NÃO dá pra fazer que nem o FM', '#FFF0EC', `
        O FM esconde porque o público dele <b>quer</b> passar 3 horas descobrindo — é gente de planilha.
        O seu público joga <b>6 minutos no ônibus</b> e dá risada com os amigos.<br><br>
        E tem a sua própria lei, que você me repetiu várias vezes: <b>"toda trava explica o porquê e o
        caminho"</b> e <b>"saber o que pode e o que não pode"</b>. Um técnico que muda o time em segredo é
        exatamente o <b>comportamento fora das regras mapeadas</b> que você chama de bug.<br><br>
        Sem contar o risco prático: cara paga/escolhe lenda, perde 3 jogos, não entende por quê, e some.`)}
      ${bloco('🙋 Me responde', '#fff', `
        <b>1.</b> Fecha a pirâmide <b>8 lenda · 17 craque · 25 bom · 30 profissional · 20 estreante</b>?<br>
        <b>2.</b> Fecha o filtro por divisão (lenda só atende Série A/B)?<br>
        <b>3.</b> Fecha <b>regra explicada + número escondido (olheiro revela)</b>?<br>
        <b>4.</b> Se sim, eu escrevo <b>os 20 primeiros técnicos</b> (com as 5 linhas de cada) num documento
        pra você aprovar nome por nome — antes de qualquer linha de código.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-tec100-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
