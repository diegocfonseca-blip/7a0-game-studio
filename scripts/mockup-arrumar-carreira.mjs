// 🧹 AUDITORIA VISUAL DA CARREIRA — o que eu mexeria pra organizar melhor
//
// Pedido do Diego (16/09): *"confira todas telas do modo carreira e modais e me
// sugira aonde vc faria mudanças visuais pra organizar melhor?"*
//
// ⚠️ NADA AQUI É ACHISMO. Tudo saiu de uma navegação REAL no jogo rodando
// (`DEPLOY_BASE=/ npx vite --port 5199` + Playwright num celular de 430×900):
// carreira criada do zero, leilão jogado, patrocínios assinados, 35 rodadas
// corridas — e então cada aba e cada modal foi fotografado e MEDIDO no DOM
// (altura de rolagem, y de cada bloco). Os números abaixo são esses.
//
// Rodar: node scripts/mockup-arrumar-carreira.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-arrumar-carreira.png')
const SHOTS = arg('shots', '/tmp/carreira-telas')
const VERM = '#C2452F', ROXO = '#7C3AED', AZUL = '#1F5FA8'
const foto = f => `data:image/png;base64,${readFileSync(`${SHOTS}/${f}`).toString('base64')}`

// rolagem medida por aba (px, celular de 430×900)
const ROLAGEM = [
  ['Jogos', 2609], ['Tabelas', 1799], ['Elenco', 3521], ['Rank', 2133], ['Clube', 3515],
]
const maxRol = 3600

const barra = ([nome, px]) => `
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px">
    <span style="${OSW};font-weight:700;font-size:13px;width:74px">${nome}</span>
    <span style="flex:1;height:22px;background:#E3DAC0;border-radius:6px;overflow:hidden;display:block">
      <span style="display:flex;align-items:center;justify-content:flex-end;height:100%;padding-right:8px;
        width:${px / maxRol * 100}%;background:${px > 3000 ? VERM : px > 2400 ? '#D98324' : GREEN};
        color:#fff;${OSW};font-weight:700;font-size:11.5px">${(px / 900).toFixed(1)} telas</span></span>
  </div>`

// um achado: prioridade · título · o que eu vi (medido) · o que eu faria
const achado = (n, pri, cor, titulo, vi, faria) => `
  <div style="border:4px solid ${INK};border-radius:16px;background:#fff;box-shadow:5px 5px 0 ${INK};
    overflow:hidden;margin-bottom:14px;break-inside:avoid">
    <div style="display:flex;align-items:center;gap:10px;background:${cor};padding:9px 14px">
      <span style="background:${INK};color:#fff;${OSW};font-weight:700;font-size:15px;
        width:26px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center;flex:none">${n}</span>
      <span style="${OSW};font-weight:700;font-size:17px;text-transform:uppercase;color:#fff;line-height:1.1;flex:1">${titulo}</span>
      <span style="background:rgba(255,255,255,.92);color:${INK};${OSW};font-weight:700;font-size:10px;
        letter-spacing:1.2px;padding:3px 10px;border-radius:999px;flex:none">${pri}</span>
    </div>
    <div style="padding:11px 14px">
      <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.5;margin-bottom:9px">
        <b style="color:${VERM}">O que eu vi:</b> ${vi}</div>
      <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.5;background:#F1F6F2;
        border-left:5px solid ${GREEN};padding:8px 11px;border-radius:0 8px 8px 0">
        <b style="color:${GREEN}">O que eu faria:</b> ${faria}</div>
    </div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1240px}
  .col{display:flex;gap:26px;align-items:flex-start}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  NAVEGADO E MEDIDO NO JOGO RODANDO · CELULAR DE 430px · CARREIRA T1 · VÁRZEA · RODADA 35</div>
<h1 style="${OSW};font-weight:700;font-size:42px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  Arrumando as telas da <span style="color:${ROXO}">carreira</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.45;margin:0 0 20px;max-width:1040px;opacity:.85">
  Criei uma carreira do zero, joguei o leilão, assinei os patrocínios e corri 35 rodadas — aí fotografei
  as 5 abas e os modais e medi cada bloco. <b>Nenhuma tela é feia.</b> O problema é outro: todas elas
  começam com as MESMAS três coisas antes do conteúdo da aba, e o que a pessoa foi buscar fica sempre
  uma tela pra baixo. <b>Não mexi em nada ainda</b> — isso aqui é só pra você escolher.</p>

<div class="col" style="margin-bottom:22px">
  <div style="flex:1;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};padding:13px 16px">
    <div style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:9px">
      📏 Quanto se rola hoje, por aba</div>
    ${ROLAGEM.map(barra).join('')}
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;opacity:.75;margin-top:8px">
      Uma tela = os 900px do celular. Elenco e Clube passam de <b>3,9 telas</b> cada.</div>
  </div>
  <div style="flex:1;border:4px solid ${VERM};border-radius:18px;background:#FDF1EE;padding:13px 16px">
    <div style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:9px;color:${VERM}">
      🔁 O que se repete em TODAS as 5 abas</div>
    <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.7">
      1. Caixa <b>"Criar conta grátis"</b> — sempre em <b>y=19</b>, antes de tudo<br>
      2. Faixa da temporada + <b>o placar do jogo inteiro</b><br>
      3. Faixa <b>"Acelerar e pular 🔒 Desbloquear"</b> — y=638 a 776<br>
      <span style="display:inline-block;margin-top:9px;background:${INK};color:${GOLD};padding:5px 11px;
        border-radius:8px;font-weight:700;font-size:13px">≈ 800px antes do conteúdo da aba</span></div>
  </div>
</div>

<div class="col">
  <div style="flex:1.32">
    ${achado(1, 'MAIOR GANHO', VERM, 'A caixa de "criar conta" abre TODAS as abas',
      'Ela aparece em <b>y=19</b> nas cinco abas — antes do placar, antes do elenco, antes do estádio. É o mesmo aviso cinco vezes, e ele nunca some pra quem joga sem conta.',
      'Virar <b>uma linha fina</b> (uma frase + "criar conta"), e só na aba Jogos. Nas outras quatro, nada. Quem quer conta continua achando; quem não quer para de bater nela o dia todo. <b>Devolve ~120px em 5 telas.</b>')}

    ${achado(2, 'REGRA SUA', VERM, 'O estádio NÃO é a 1ª coisa da aba Clube',
      'Sua regra é que o desenho do estádio tem que ser a primeira coisa ao abrir o Clube ("eu achava bonito"). Medido em duas passagens: o desenho começa em <b>y=740</b> e <b>y=812px</b> — quase uma tela inteira pra baixo, nas duas. Na frente dele estão a caixa de conta, a faixa da temporada, <b>o placar do jogo inteiro</b> e a faixa do Desbloquear.',
      'Na aba Clube, o placar entra <b>já encolhido</b> (a faixinha fina que você aprovou ontem) e a caixa de conta sai. Só com isso o estádio sobe pra perto de <b>y=200</b> — de cara, como você queria.')}

    ${achado(3, 'RÁPIDO', '#D98324', 'O mesmo estado dito duas vezes na aba Jogos',
      'A faixa da temporada diz <b>"Bola rolando"</b> e o cartão logo abaixo diz <b>"🟢 BOLA ROLANDO"</b> outra vez. E tem a frase "Acompanhe sua divisão e os jogos das outras séries sem sair da tela" — uma explicação que não muda nunca e ocupa 2 linhas toda rodada, pra sempre.',
      'Tirar o estado repetido da faixa (fica só no cartão do jogo) e a frase explicativa aparecer <b>só na 1ª temporada</b>. São ~90px por rodada, de graça.')}

    ${achado(4, 'CONFIANÇA', VERM, 'Botão morto com cara de botão',
      'No modal do preparador, dois dos quatro têm um retângulo grande, escuro e com borda — igual ao botão de comprar — escrito <b>"moedas insuficientes"</b>. Parece que dá pra apertar. E o preço some quando isso acontece.',
      'Botão bloqueado tem que <b>parecer bloqueado</b>: fundo apagado, sem sombra dura, e dizendo o caminho — <b>"faltam 196 🪙"</b> em vez de "moedas insuficientes". É a sua regra: toda trava explica o porquê e como sair dela.')}
  ${achado(5, 'ORGANIZAR', AZUL, 'A aba Elenco tem três andares de navegação',
    'Ao abrir o Elenco você encontra, um debaixo do outro: as abas <b>TIME / AGENCIADOS</b>, depois as pastilhas <b>Retranca / Equilíbrio / Ataque</b> da tática, e só então o conteúdo. É navegação dentro de navegação dentro de navegação, e a lista de titulares — que é o que se vem buscar — fica em <b>3,9 telas</b> de rolagem.',
    'Manter <b>TIME / AGENCIADOS</b> (são coisas diferentes mesmo) e mandar a <b>tática pra perto do botão de jogar</b>, que é quando ela importa. O Elenco fica sendo só o elenco.')}

  ${achado(6, 'ORGANIZAR', AZUL, 'A faixa do "Desbloquear" te tira do jogo',
    'A faixa <b>"Acelerar e pular 🔒 Desbloquear"</b> fica entre o placar e o resto — na primeira passagem ela apareceu nas <b>cinco</b> abas. E apertando nela o jogo <b>sai da carreira</b> e abre a página inteira dos planos: você perde onde estava e precisa voltar.',
    'Ela virar <b>modal</b> em cima da carreira (fecha e você está exatamente onde estava), e aparecer <b>uma vez por temporada</b>, não em toda aba de toda rodada. Vende igual e não atrapalha o ritmo — que é sua regra de ouro.')}

  </div>

  <div style="flex:1">
    <div style="border:4px solid ${INK};border-radius:16px;overflow:hidden;box-shadow:5px 5px 0 ${INK};background:#000;margin-bottom:8px">
      <img src="${foto('aba-Jogos-topo.png')}" style="width:100%;display:block">
    </div>
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.4;opacity:.78;margin-bottom:16px;text-align:center">
      A aba <b>Jogos</b> como ela abre hoje. A caixa creme de conta come o topo;
      o jogo de verdade começa na metade da tela.<br>
      <span style="opacity:.65">(a faixa amarela de "manutenção" é só porque a bancada roda
      sem servidor — no ar ela não aparece)</span></div>
    <div style="border:4px solid ${INK};border-radius:16px;overflow:hidden;box-shadow:5px 5px 0 ${INK};background:#000">
      <img src="${foto('modal-preparador.png')}" style="width:100%;display:block">
    </div>
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.4;opacity:.78;margin-top:6px;text-align:center">
      O modal do preparador: repare nos dois retângulos
      <b>"moedas insuficientes"</b> — têm cara de botão e não são.</div>
  </div>
</div>

<div style="margin-top:6px">
  ${achado(7, 'CONFERIR', '#6B6552', 'A virada mostra os dois passos de uma vez',
    'Você pediu a virada "passo a passo, um de cada vez". Hoje o <b>PASSO 1 DE 2</b> e o <b>PASSO 2 DE 2</b> aparecem na mesma tela, empilhados — o 2 já visível, mas travado com "Assine um contrato Master aí em cima".',
    'Pode ser de propósito (dá pra ver o que vem). Se você quiser <b>um de cada vez de verdade</b>, o passo 2 só nasce quando o 1 é assinado. <b>Me diz qual dos dois você prefere</b> — é troca de 5 linhas.')}
</div>

<div style="margin-top:12px;border:4px solid ${ROXO};border-radius:18px;background:#F6F0FF;padding:14px 18px">
  <div style="${OSW};font-weight:700;font-size:17px;text-transform:uppercase;color:${ROXO};margin-bottom:7px">
    👉 Se fosse pra mexer em UMA coisa só</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.6">
    <b>O nº 1 e o nº 2 juntos</b> — a caixa de conta virar linha fina e o placar entrar encolhido nas abas que
    não são a Jogos. É a mesma mexida (o cabeçalho que todas as abas compartilham), devolve quase
    <b>uma tela inteira</b> em cada uma das cinco, e é a que traz seu estádio de volta pro topo do Clube.
    Não muda nenhuma regra do jogo, nenhum número, nenhum save — é só onde as coisas ficam na tela.
    <b>E volta atrás com um commit.</b></div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:12px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    levantamento do dia 16/09 · nada foi alterado<br>refazer: <b>node scripts/mockup-arrumar-carreira.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1240, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
