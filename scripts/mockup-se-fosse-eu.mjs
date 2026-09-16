// 🎨 "SE FOSSE VOCÊ, COMO REFORMULARIA O VISUAL?" (Diego 16/09)
//
// Pergunta dele: *"e se fosse reformular na sua cabeça todo visual, sem ser
// influenciado por mim, como você faria?"*
//
// ⚠️ ISTO É OPINIÃO, e está marcado como opinião. Nada aqui foi codado, e várias
// coisas aqui CONTRARIAM escolhas que ele já fez de propósito (a caixa grande de
// criar conta, por exemplo, ficou grande porque ELE pediu em 21/08). Onde eu
// discordo, está escrito que eu discordo — e por quê.
//
// O diagnóstico não é chute: sai do levantamento de 16/09 (`navega-carreira.mjs`),
// que abriu o jogo e mediu: ~800px de cabeçalho repetido antes do conteúdo de cada
// aba · Elenco 3,8 telas · Clube 3,8 telas com o estádio começando em y=740.
//
// Rodar: node scripts/mockup-se-fosse-eu.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-se-fosse-eu.png')
const VERM = '#C2452F', ROXO = '#7C3AED', SLATE = '#3E4A5A'
const png = c => `data:image/png;base64,${readFileSync(c).toString('base64')}`
const SYS = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"

// ── a tela redesenhada (celular) ────────────────────────────────────────────
const linhaJogo = (casa, fora, pl, ao) => `
  <div style="display:flex;align-items:center;gap:8px;padding:7px 2px;border-bottom:1px solid rgba(12,12,12,.09)">
    <span style="flex:1;${SYS};font-size:12px;font-weight:600;text-align:right;color:#3a3527">${casa}</span>
    <span style="${OSW};font-weight:700;font-size:12.5px;background:${ao ? GREEN : 'rgba(12,12,12,.07)'};
      color:${ao ? '#fff' : '#3a3527'};border-radius:5px;padding:2px 7px;min-width:38px;text-align:center">${pl}</span>
    <span style="flex:1;${SYS};font-size:12px;font-weight:600;color:#3a3527">${fora}</span>
  </div>`

const telaNova = `
<div style="width:352px;background:${CREME};border:5px solid ${INK};border-radius:24px;overflow:hidden;
  box-shadow:7px 7px 0 ${INK};position:relative">

  <!-- 1. FAIXA ÚNICA: tudo que é "quem sou eu e como estou" cabe aqui -->
  <div style="background:${INK};color:#fff;display:flex;align-items:center;gap:8px;padding:8px 11px">
    <span style="width:22px;height:25px;background:linear-gradient(160deg,#DBD1B5,#B2A583);border:2px solid #000;
      border-radius:3px 3px 7px 7px;flex:none"></span>
    <span style="${OSW};font-weight:700;font-size:13.5px;flex:1;letter-spacing:.2px">Nova Eclipse</span>
    <span style="${SYS};font-size:10.5px;font-weight:700;color:rgba(255,255,255,.62)">Série B · 6º</span>
    <span style="${OSW};font-weight:700;font-size:13px;color:${GOLD}">3.822</span>
  </div>

  <!-- 2. O HERÓI: o jogo. Sem moldura, sangra na tela. É a única coisa "alta" -->
  <div style="background:linear-gradient(170deg,#16371f,#0a1b10);padding:16px 14px 14px;color:#fff;position:relative">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:11px">
      <span style="${SYS};font-size:10px;font-weight:800;letter-spacing:1.5px;color:rgba(255,255,255,.5)">RODADA 19 / 38</span>
      <span style="${OSW};font-weight:700;font-size:11px;background:${GREEN};border-radius:999px;padding:2px 9px">73'</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <div style="flex:1;text-align:center">
        <div style="width:34px;height:39px;margin:0 auto 6px;background:linear-gradient(160deg,#DBD1B5,#B2A583);
          border:2.5px solid #000;border-radius:4px 4px 11px 11px"></div>
        <div style="${OSW};font-weight:700;font-size:12.5px;line-height:1.1">Nova Eclipse</div></div>
      <div style="${OSW};font-weight:700;font-size:46px;letter-spacing:-2px;line-height:1">2<span style="opacity:.35;font-size:26px;margin:0 5px">×</span>1</div>
      <div style="flex:1;text-align:center">
        <div style="width:34px;height:39px;margin:0 auto 6px;background:linear-gradient(160deg,#7fa6d8,#31599b);
          border:2.5px solid #000;border-radius:4px 4px 11px 11px"></div>
        <div style="${OSW};font-weight:700;font-size:12.5px;line-height:1.1">Fridão FC</div></div>
    </div>
    <div style="${SYS};font-size:10.5px;font-weight:600;color:rgba(255,255,255,.62);text-align:center;margin-top:11px;line-height:1.5">
      Zico 12' · Sócrates 61' &nbsp;|&nbsp; Kaká 44'</div>
  </div>

  <!-- 3. UMA linha de contexto. Sem caixa, sem borda, sem sombra -->
  <div style="display:flex;align-items:center;gap:9px;padding:9px 13px;background:rgba(12,12,12,.045)">
    <span style="${SYS};font-size:11px;font-weight:700;color:#3a3527">😐 Torcida</span>
    <span style="flex:1;height:5px;background:rgba(12,12,12,.12);border-radius:3px;overflow:hidden">
      <span style="display:block;width:45%;height:100%;background:${GREEN}"></span></span>
    <span style="${OSW};font-weight:700;font-size:12px">45%</span>
  </div>

  <!-- 4. o resto da rodada: lista fina, densa, sem molduras -->
  <div style="padding:11px 13px 13px">
    <div style="${SYS};font-size:9.5px;font-weight:800;letter-spacing:1.5px;color:rgba(12,12,12,.42);margin-bottom:3px">OUTROS JOGOS DA SÉRIE B</div>
    ${linhaJogo('Freezo FC', 'Imsttazx', '1 × 1', true)}
    ${linhaJogo('KKLhas FC', 'Pipo EC', '0 × 2', true)}
    ${linhaJogo('Barreto', 'Fiotefc', '3 × 0', false)}
    <div style="${SYS};font-size:11px;font-weight:700;color:${GREEN};padding:8px 2px 0">ver a tabela inteira →</div>
  </div>

  <!-- 5. A AÇÃO. Fixa, sempre no mesmo lugar, muda só o rótulo -->
  <div style="background:${CREME};border-top:3px solid ${INK};padding:9px 11px;display:flex;gap:8px;align-items:center">
    <button style="flex:1;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:13px;
      ${OSW};font-weight:700;font-size:16px;padding:11px 0;box-shadow:3px 3px 0 ${INK}">▶︎ PRÓXIMA RODADA</button>
    <span style="${OSW};font-weight:700;font-size:12px;border:2.5px solid ${INK};border-radius:10px;padding:9px 10px">4×</span>
  </div>
  <div style="display:flex;background:#EDE5CE;border-top:2px solid rgba(12,12,12,.12)">
    ${[['🗓️', 'Jogos', true], ['📊', 'Tabelas', false], ['👥', 'Elenco', false], ['🏆', 'Rank', false], ['🏟️', 'Clube', false]]
      .map(([e, n, on]) => `<span style="flex:1;text-align:center;padding:7px 0 8px;opacity:${on ? 1 : .42}">
        <span style="display:block;font-size:15px;line-height:1">${e}</span>
        <span style="display:block;${OSW};font-weight:700;font-size:8.5px;letter-spacing:.6px;margin-top:2px">${n.toUpperCase()}</span></span>`).join('')}
  </div>
</div>`

// ── o elenco redesenhado: agrupado por POSIÇÃO ──────────────────────────────
const jog = (pos, nome, clube, titular, gas) => `
  <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(12,12,12,.08)">
    <span style="width:7px;height:7px;border-radius:999px;flex:none;
      background:${titular ? GREEN : 'transparent'};border:2px solid ${titular ? GREEN : 'rgba(12,12,12,.3)'}"></span>
    <span style="flex:1;min-width:0">
      <span style="display:block;${OSW};font-weight:700;font-size:12.5px;line-height:1.15">${nome}</span>
      <span style="display:block;${SYS};font-size:9.5px;font-weight:600;color:rgba(12,12,12,.45)">${clube}</span></span>
    <span style="width:34px;height:4px;background:rgba(12,12,12,.12);border-radius:2px;flex:none;overflow:hidden">
      <span style="display:block;height:100%;width:${gas}%;background:${gas > 55 ? GREEN : gas > 30 ? '#D98324' : VERM}"></span></span>
  </div>`
const setor = (t, n, alerta, linhas) => `
  <div style="margin-bottom:9px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:1px">
      <span style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.2px;color:rgba(12,12,12,.5)">${t}</span>
      <span style="flex:1;height:2px;background:rgba(12,12,12,.1)"></span>
      <span style="${OSW};font-weight:700;font-size:11px;color:${alerta ? VERM : 'rgba(12,12,12,.5)'}">${n}</span>
    </div>${linhas}</div>`

const telaElenco = `
<div style="width:352px;background:${CREME};border:5px solid ${INK};border-radius:24px;overflow:hidden;
  box-shadow:7px 7px 0 ${INK}">
  <div style="background:${INK};color:#fff;display:flex;align-items:center;gap:8px;padding:8px 11px">
    <span style="${OSW};font-weight:700;font-size:13.5px;flex:1">Elenco</span>
    <span style="${SYS};font-size:10.5px;font-weight:700;color:rgba(255,255,255,.62)">22 · folha 50/ano</span></div>
  <div style="padding:12px 13px">
    ${setor('GOLEIROS', '2', true, jog('GOL', 'Rogério Ceni', 'São Paulo · 1990', true, 78) + jog('GOL', 'Taffarel', 'Santos · 2001', false, 96))}
    <div style="${SYS};font-size:10.5px;font-weight:700;color:${VERM};background:#FDF1EE;border-left:3px solid ${VERM};
      border-radius:0 7px 7px 0;padding:6px 9px;margin:-3px 0 10px;line-height:1.4">
      Só 2 goleiros. Se os dois faltarem, entra perna-de-pau.</div>
    ${setor('LATERAIS', '4', false, jog('LAT', 'Cafu', 'Milan · 1991', true, 62) + jog('LAT', 'Roberto Carlos', 'Real Madrid · 1994', true, 71) + jog('LAT', 'Júnior', 'São Paulo · 2002', false, 90))}
    ${setor('ZAGUEIROS', '4', false, jog('ZAG', 'Aldair', 'Roma · 1992', true, 44) + jog('ZAG', 'Lúcio', 'Inter · 1993', true, 88))}
  </div>
</div>`

const principio = (n, titulo, hoje, eu, cor) => `
  <div style="border:4px solid ${INK};border-radius:16px;background:#fff;box-shadow:4px 4px 0 ${INK};
    overflow:hidden;margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:9px;background:${cor};padding:8px 13px">
      <span style="background:rgba(255,255,255,.95);color:${cor};${OSW};font-weight:700;font-size:14px;width:23px;height:23px;
        border-radius:999px;display:flex;align-items:center;justify-content:center;flex:none">${n}</span>
      <span style="${OSW};font-weight:700;font-size:15.5px;text-transform:uppercase;color:#fff;flex:1;line-height:1.1">${titulo}</span>
    </div>
    <div style="padding:10px 13px;${OSW};font-weight:400;font-size:13px;line-height:1.55">
      <div style="margin-bottom:5px"><b style="color:${VERM}">Hoje:</b> ${hoje}</div>
      <div><b style="color:${GREEN}">Eu faria:</b> ${eu}</div></div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1340px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  ISTO É OPINIÃO MINHA · VOCÊ PEDIU SEM FILTRO · NADA FOI CODADO</div>
<h1 style="${OSW};font-weight:700;font-size:44px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  Se o visual fosse <span style="color:${ROXO}">meu</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 8px;max-width:1160px;opacity:.88">
  Antes de tudo, o que eu <b>NÃO</b> mexeria: a identidade. Creme, borda preta grossa, sombra dura deslocada,
  Oswald condensada. Isso é <b>raro</b> — quase todo jogo de celular parece o mesmo app cinza, e o seu parece
  <b>álbum de figurinha e cartaz de boteco</b>. Isso é patrimônio, não se toca.</p>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 22px;max-width:1160px;opacity:.88">
  O que eu mexeria é <b>outra coisa</b>: hoje a identidade está aplicada em <b>tudo igual</b> — a faixa de
  "Torcida 45%" tem a mesma borda, a mesma sombra e o mesmo peso do <b>seu jogo ao vivo</b>. Quando tudo grita,
  nada é ouvido. <b>Eu não trocaria o estilo. Eu trocaria a HIERARQUIA.</b></p>

<div style="display:flex;gap:26px;align-items:flex-start;margin-bottom:26px">
  <div style="flex:none;text-align:center">
    <div style="display:inline-block;background:#8a8069;color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;margin-bottom:9px;box-shadow:3px 3px 0 ${INK}">COMO ESTÁ HOJE</div>
    <img src="${png('/tmp/carreira-telas/aba-Jogos-topo.png')}" style="width:352px;display:block;border:5px solid ${INK};
      border-radius:24px;box-shadow:7px 7px 0 ${INK}">
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;margin-top:9px;width:352px;text-align:left;opacity:.82">
      Medido: <b>~800px</b> antes do conteúdo. O jogo ao vivo começa na <b>metade</b> da tela, e disputa
      atenção com 4 caixas do mesmo tamanho.</div>
  </div>
  <div style="flex:none;text-align:center">
    <div style="display:inline-block;background:${ROXO};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;margin-bottom:9px;box-shadow:3px 3px 0 ${INK}">COMO EU FARIA</div>
    ${telaNova}
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;margin-top:9px;width:352px;text-align:left;opacity:.82">
      Mesma paleta, mesma fonte, mesmas sombras — <b>só que só onde importa</b>. O jogo ocupa o topo inteiro e
      o botão mora num lugar fixo.</div>
  </div>
  <div style="flex:1">
    ${principio(1, 'Três pesos de superfície, não um', 'Tudo é cartão: borda 3-4px, sombra dura, fundo branco. O aviso de torcida pesa igual ao placar.', 'Só o <b>herói</b> (seu jogo, seu estádio) leva moldura e sombra. Contexto vira <b>linha lisa</b>. Ajuste vira <b>texto</b>. A borda grossa volta a significar "isso é importante".', VERM)}
    ${principio(2, 'Uma tela, um assunto', 'A aba Jogos tem seu jogo + narrador + outros jogos + tabela + promoção. Elenco tem 3,8 telas.', 'A primeira tela de cada aba responde <b>uma</b> pergunta. O resto é um toque abaixo, não um rolar. "Ver a tabela inteira →" é link, não 100 linhas empilhadas.', GREEN)}
    ${principio(3, 'O botão mora sempre no mesmo lugar', 'O ▶️ Próxima rodada fica no meio de uma página de 2.600px, e muda de altura conforme o que apareceu em cima.', 'Uma <b>barra de ação fixa</b> no pé, acima das abas. Só o rótulo muda: Começar a temporada · Próxima rodada · Decida quem fica. O dedo aprende um lugar só.', GREEN)}
  </div>
</div>

<div style="display:flex;gap:26px;align-items:flex-start;margin-bottom:26px">
  <div style="flex:1">
    ${principio(4, 'O dourado só pode querer dizer UMA coisa', 'Dourado é o tier 👑 Lenda, <b>e</b> é botão, <b>e</b> é destaque, <b>e</b> é moeda. Quatro significados.', 'Dourado = <b>identidade de quem você é</b> (o seu tier, o seu dinheiro) e mais nada. Botão fica verde. Aí o dourado volta a dar orgulho em vez de virar decoração — e a sua regra de "cor é sagrada" fica mais forte, não mais fraca.', GOLD)}
    ${principio(5, 'Oswald é para número e título', 'Oswald 900 maiúscula em quase todo texto, inclusive em parágrafo explicativo.', 'Oswald nos <b>números</b> (placar, moeda, minuto) e nos <b>títulos</b>. Parágrafo em fonte de sistema, caixa normal. Maiúscula só em rótulo curto. Lê-se mais rápido e o título passa a se destacar.', ROXO)}
    ${principio(6, 'O vazio é de graça e trabalha', 'Cada pixel está preenchido. Cartões colados, molduras dentro de molduras.', 'Deixar o creme respirar entre os blocos. Borda 2px e sombra 2px no que é secundário. Só isso encolheria <b>~20% de toda tela</b>, sem tirar nada.', SLATE)}
  </div>
  <div style="flex:none;text-align:center">
    <div style="display:inline-block;background:${ROXO};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;margin-bottom:9px;box-shadow:3px 3px 0 ${INK}">E O ELENCO, POR POSIÇÃO</div>
    ${telaElenco}
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;margin-top:9px;width:352px;text-align:left;opacity:.82">
      <b>A mudança que eu mais defenderia.</b> Hoje são duas colunas (titulares | reservas) e você
      <b>filtra por posição com o olho</b>. Mas técnico não pensa "quem é reserva" — pensa
      <b>"quem substitui meu goleiro?"</b>.<br><br>
      Agrupado por setor, a bolinha cheia é titular e a vazia é reserva. E aí o problema dos
      <b>2 goleiros</b> — que a gente descobriu medindo — <b>aparece sozinho na tela</b>, sem eu
      precisar te explicar em texto.</div>
  </div>
</div>

<div style="border:4px solid ${GOLD};border-radius:18px;background:#FFFBEE;padding:16px 20px;margin-bottom:16px">
  <div style="${OSW};font-weight:700;font-size:18px;text-transform:uppercase;margin-bottom:9px">
    ⚖️ Onde eu discordaria de você — dito na cara</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    <b>1. A caixa grande de "criar conta".</b> Você pediu ela chamativa em 21/08, e eu entendo o motivo
    (conta = jogador que volta). Mas ela é hoje a <b>primeira coisa</b> de todas as cinco abas, e some só
    pra quem já fez conta — ou seja, <b>quem mais joga sem conta é quem mais apanha dela</b>. Eu faria o
    contrário: <b>discreta no dia a dia, e GRANDE uma vez</b>, no momento em que dói — quando você acabou de
    ser campeão e a carta só existe com conta. Vende mais, incomoda menos.<br><br>
    <b>2. A faixa "Acelerar e pular 🔒 Desbloquear".</b> Ela aparece em toda aba de toda rodada e <b>tira a
    pessoa do jogo</b> quando é tocada. Eu mostraria <b>uma vez por temporada</b>, como modal, e deixaria o
    jogo onde estava. Sua regra de ouro é "nada atrasa o ritmo" — essa faixa atrasa.<br><br>
    <b>3. O estádio "sagrado".</b> Aqui eu concordo com a regra e discordo da execução: ele <b>já não é</b> a
    primeira coisa (mede y=740). A regra está certa; o que falta é ela valer na prática.</div>
</div>

<div style="border:4px solid ${GREEN};border-radius:18px;background:#EFF7F1;padding:16px 20px">
  <div style="${OSW};font-weight:700;font-size:18px;text-transform:uppercase;color:${GREEN};margin-bottom:9px">
    🎯 Se eu pudesse fazer só UMA coisa</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    <b>Os três pesos de superfície (nº 1).</b> Não é redesenho, é <b>régua</b>: decidir que borda grossa +
    sombra dura significa "isto é o principal", e tirar isso de todo o resto. Uma tarde de trabalho, nenhuma
    regra de jogo tocada, e <b>toda tela do jogo melhora junto</b> — inclusive as que ainda nem existem.<br><br>
    <b>E o que eu jamais tocaria, mesmo com carta branca:</b> a paleta, a Oswald, a sombra dura, o campinho,
    o desenho do estádio e a zoeira dos textos. O jogo tem <b>cara própria</b> — é a coisa mais difícil de
    conseguir e você já conseguiu. Meu trabalho seria <b>fazer essa cara aparecer mais</b>, usando ela menos.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;border-top:5px solid ${INK};padding-top:13px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    opinião de 16/09 · nada foi codado<br>refazer: <b>node scripts/mockup-se-fosse-eu.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1340, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
