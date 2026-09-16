// 👥 O ELENCO NO ESTILO DA REFERÊNCIA QUE O DIEGO MANDOU (16/09)
//
// Ele mandou o print de um jogo de futebol (tela "MEU TIME · ESCALAÇÃO E ELENCO", escura,
// campinho à esquerda com só os 11 e a tabela de reservas à direita) e disse:
// *"algo inspirado nisso aqui, claro que no nosso padrão de arte. Os reservas de um lado
// e no campinho só os titulares e etc"*.
//
// ⚠️ DESENHO, nada codado. E o "nosso padrão" foi respeitado ao pé da letra: creme
// #F4ECD6, borda preta grossa, sombra dura deslocada, Oswald condensada. A referência é
// escura e cromada; a nossa é de papel e carimbo — copiei o LAYOUT, não a pele.
//
// 🔎 UMA COISA DA REFERÊNCIA QUE **NÃO DÁ** PRA COPIAR: a coluna "GER" (o overall de cada
// jogador). No nosso jogo isso é PERK PAGO — `olheiros` + tier (Craque vê até craque,
// Lenda vê tudo, ver `ElencoField`). Pôr o número pra todo mundo entregaria de graça o que
// a loja vende. Aqui a coluna mostra o NÍVEL (🪵🎯💎⭐👑), que todo mundo já vê hoje, e o
// número só aparece pra quem tem olheiro.
//
// Rodar: node scripts/mockup-elenco-referencia.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-elenco-referencia.png')
const VERM = '#C2452F', ROXO = '#7C3AED', SLATE = '#3E4A5A', BEGE = '#B2A583'
const SYS = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"

// 👕 a camisa do campinho, no nosso desenho (listra + borda preta + sombra dura)
const camisaCampo = (num, tag, nome, cor = BEGE, tam = 1) => `
  <div style="text-align:center;width:${Math.round(58 * tam)}px;flex:none">
    <div style="position:relative;width:${Math.round(34 * tam)}px;height:${Math.round(38 * tam)}px;margin:0 auto;
      background:repeating-linear-gradient(90deg, ${cor} 0 5px, #0C0C0C 5px 10px);
      border:${Math.round(2.5 * tam)}px solid ${INK};border-radius:4px 4px 12px 12px;box-shadow:${Math.round(2 * tam)}px ${Math.round(2 * tam)}px 0 ${INK};
      display:flex;align-items:center;justify-content:center">
      <span style="${OSW};font-weight:700;font-size:${Math.round(15 * tam)}px;color:#fff;text-shadow:0 0 4px #000,1px 1px 0 #000">${num}</span></div>
    <div style="${OSW};font-weight:700;font-size:${Math.round(7.5 * tam)}px;background:${INK};color:${GOLD};border-radius:3px;
      padding:0 4px;display:inline-block;margin-top:${Math.round(3 * tam)}px;letter-spacing:.5px">${tag}</div>
    <div style="${OSW};font-weight:700;font-size:${Math.round(8 * tam)}px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}</div>
  </div>`

// 🟩 o campinho: listras do nosso verde + linhas brancas, com SÓ os 11
const campinho = (tam = 1) => `
  <div style="background:repeating-linear-gradient(180deg,#2d7a41 0 22px,#286e3a 22px 44px);
    border:${Math.round(3 * tam)}px solid ${INK};border-radius:${Math.round(11 * tam)}px;padding:${Math.round(12 * tam)}px ${Math.round(6 * tam)}px ${Math.round(10 * tam)}px;
    box-shadow:${Math.round(3 * tam)}px ${Math.round(3 * tam)}px 0 ${INK};position:relative;overflow:hidden">
    <div style="position:absolute;left:8%;right:8%;top:6%;bottom:6%;border:2px solid rgba(255,255,255,.22);border-radius:4px"></div>
    <div style="position:absolute;left:50%;top:6%;bottom:6%;width:2px;background:rgba(255,255,255,.18)"></div>
    <div style="position:absolute;left:50%;top:50%;width:${Math.round(52 * tam)}px;height:${Math.round(52 * tam)}px;transform:translate(-50%,-50%);
      border:2px solid rgba(255,255,255,.2);border-radius:999px"></div>
    <div style="position:relative;display:flex;flex-direction:column;gap:${Math.round(10 * tam)}px">
      <div style="display:flex;justify-content:center;gap:${Math.round(4 * tam)}px">
        ${camisaCampo(11, 'ATA', 'Adriano', BEGE, tam)}${camisaCampo(9, 'ATA', 'Juninho', BEGE, tam)}</div>
      <div style="display:flex;justify-content:center;gap:${Math.round(4 * tam)}px">
        ${camisaCampo(8, 'MEI', 'Mozer', BEGE, tam)}${camisaCampo(10, 'MEI', 'Raí', BEGE, tam)}${camisaCampo(7, 'MEI', 'Djalminha', BEGE, tam)}${camisaCampo(5, 'MEI', 'Edmundo', BEGE, tam)}</div>
      <div style="display:flex;justify-content:center;gap:${Math.round(4 * tam)}px">
        ${camisaCampo(6, 'LAT', 'Lúcio', BEGE, tam)}${camisaCampo(4, 'ZAG', 'Romário', BEGE, tam)}${camisaCampo(3, 'ZAG', 'Careca', BEGE, tam)}${camisaCampo(2, 'LAT', 'R. Carlos', BEGE, tam)}</div>
      <div style="display:flex;justify-content:center">
        ${camisaCampo(1, 'GOL', 'R. Ceni', '#FFC400', tam)}</div>
    </div>
  </div>`

// 📋 uma linha da tabela de reservas
const NIVEL = { lenda: ['👑', GOLD], craque: ['⭐', '#CBD4DE'], promessa: ['💎', '#C9A9FF'], bom: ['🎯', '#41C07A'], prof: ['🪵', BEGE] }
const linhaRes = (n, nome, ficha, pos, nivel, gas, selo, sel) => `
  <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:${sel ? '#FFF3CE' : '#fff'};
    border:2px solid ${sel ? INK : 'rgba(12,12,12,.14)'};border-radius:7px;margin-bottom:3px;
    ${sel ? `box-shadow:2px 2px 0 ${INK}` : ''}">
    <span style="${OSW};font-weight:700;font-size:9.5px;color:rgba(12,12,12,.4);width:14px;flex:none;text-align:right">${n}</span>
    <span style="width:12px;height:14px;flex:none;background:repeating-linear-gradient(90deg,${BEGE} 0 2px,#0C0C0C 2px 4px);
      border:1.5px solid ${INK};border-radius:2px 2px 4px 4px"></span>
    <span style="flex:1;min-width:0">
      <span style="display:block;${OSW};font-weight:700;font-size:11px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}${selo ? ` <span style="font-size:9px">${selo}</span>` : ''}</span>
      <span style="display:block;${SYS};font-size:8px;font-weight:600;color:rgba(12,12,12,.42)">${ficha}</span></span>
    <span style="${OSW};font-weight:700;font-size:8.5px;background:${INK};color:${GOLD};border-radius:3px;padding:1px 4px;flex:none">${pos}</span>
    <span style="font-size:11px;flex:none" title="${nivel}">${NIVEL[nivel][0]}</span>
    <span style="width:22px;height:4px;background:rgba(12,12,12,.12);border-radius:2px;flex:none;overflow:hidden">
      <span style="display:block;height:100%;width:${gas}%;background:${gas > 55 ? GREEN : gas > 30 ? '#D98324' : VERM}"></span></span>
  </div>`

const RESERVAS = [
  [12, 'Taffarel', 'Santos · 2001', 'GOL', 'bom', 96, ''],
  [13, 'Cafu', 'Milan · 1991', 'LAT', 'craque', 92, ''],
  [14, 'Júnior', 'São Paulo · 2002', 'LAT', 'bom', 88, ''],
  [15, 'Aldair', 'Roma · 1992', 'ZAG', 'craque', 22, '🚑'],
  [16, 'Bebeto', 'Botafogo · 2000', 'ZAG', 'lenda', 95, ''],
  [17, 'Kaká', 'Flamengo · 2009', 'MEI', 'lenda', 90, ''],
  [18, 'Marcelo', 'Corinthians · 2008', 'MEI', 'craque', 93, ''],
  [19, 'Túlio', 'Internacional · 2007', 'MEI', 'promessa', 41, '😓'],
  [20, 'Ronaldinho', 'Palmeiras · 2011', 'MEI', 'lenda', 97, ''],
  [21, 'Denílson', 'São Paulo · 2014', 'ATA', 'bom', 89, ''],
  [22, 'Vampeta', 'Roma · 2016', 'ATA', 'prof', 94, ''],
]

const abaPill = (t, on) => `
  <span style="flex:1;text-align:center;${OSW};font-weight:700;font-size:11px;padding:6px 0;border:2.5px solid ${INK};
    border-radius:9px;background:${on ? INK : '#fff'};color:${on ? GOLD : INK};${on ? `box-shadow:2px 2px 0 ${INK}` : ''}">${t}</span>`

// ── A TELA DE CELULAR (retrato) ────────────────────────────────────────────
const telaCel = `
<div style="width:372px;background:${CREME};border:5px solid ${INK};border-radius:24px;overflow:hidden;box-shadow:7px 7px 0 ${INK}">
  <div style="background:${INK};color:#fff;padding:9px 12px 8px">
    <div style="display:flex;align-items:baseline;gap:8px">
      <span style="${OSW};font-weight:700;font-size:17px;letter-spacing:.3px">MEU TIME</span>
      <span style="${SYS};font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.45);flex:1">ESCALAÇÃO E ELENCO</span>
      <span style="${OSW};font-weight:700;font-size:13px;color:${GOLD}">675</span></div>
  </div>
  <div style="display:flex;gap:5px;padding:8px 11px 7px">
    ${abaPill('ELENCO', true)}${abaPill('TÁTICA', false)}${abaPill('COMISSÃO', false)}</div>

  <div style="padding:0 11px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <span style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:1px">⭐ TITULARES (11)</span>
      <span style="flex:1"></span>
      <span style="${OSW};font-weight:700;font-size:10.5px;border:2px solid ${INK};border-radius:7px;padding:2px 8px;background:#fff">4-4-2 ▾</span></div>
    ${campinho(1)}
    <div style="${SYS};font-size:9px;font-weight:700;color:rgba(12,12,12,.5);text-align:center;padding:6px 0 7px;line-height:1.4">
      toque num titular e depois num reserva <b>da mesma posição</b> pra trocar</div>
  </div>

  <div style="padding:0 11px 11px">
    <div style="display:flex;gap:5px;margin-bottom:6px">
      ${abaPill('TITULARES (11)', false)}${abaPill('RESERVAS (11)', true)}</div>
    <div style="display:flex;align-items:center;gap:6px;padding:0 6px 4px;${OSW};font-weight:700;font-size:8px;
      letter-spacing:1px;color:rgba(12,12,12,.38)">
      <span style="width:14px;text-align:right">Nº</span><span style="width:12px"></span>
      <span style="flex:1">NOME</span><span>POS</span><span>NÍVEL</span><span style="width:22px">GÁS</span></div>
    ${RESERVAS.map(r => linhaRes(...r, r[0] === 15)).join('')}
  </div>

  <div style="display:flex;gap:6px;padding:0 11px 12px">
    ${[['🏛️', 'Comissão', 'técnico · preparador'], ['🌱', 'Base', '11 vagas'], ['🕴️', 'Agenciados', '4 na ativa']].map(([e, t, s]) => `
      <span style="flex:1;background:#fff;border:2.5px solid ${INK};border-radius:11px;padding:7px 5px;text-align:center;box-shadow:2px 2px 0 ${INK}">
        <span style="display:block;font-size:15px;line-height:1">${e}</span>
        <span style="display:block;${OSW};font-weight:700;font-size:10px;margin-top:2px">${t}</span>
        <span style="display:block;${SYS};font-size:7.5px;font-weight:600;color:rgba(12,12,12,.45)">${s}</span></span>`).join('')}
  </div>
</div>`

// ── A TELA DE PC (deitado — como a referência) ─────────────────────────────
const telaPC = `
<div style="width:700px;background:${CREME};border:5px solid ${INK};border-radius:22px;overflow:hidden;box-shadow:7px 7px 0 ${INK}">
  <div style="background:${INK};color:#fff;padding:10px 15px;display:flex;align-items:center;gap:10px">
    <span style="${OSW};font-weight:700;font-size:19px">MEU TIME</span>
    <span style="${SYS};font-size:9.5px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.45)">ESCALAÇÃO E ELENCO</span>
    <span style="flex:1"></span>
    <span style="display:flex;gap:5px">${['ELENCO', 'TÁTICA', 'COMISSÃO', 'NÚMEROS'].map((t, i) => `
      <span style="${OSW};font-weight:700;font-size:10.5px;padding:4px 11px;border-radius:7px;
        background:${i === 0 ? GOLD : 'rgba(255,255,255,.1)'};color:${i === 0 ? INK : 'rgba(255,255,255,.7)'}">${t}</span>`).join('')}</span>
  </div>
  <div style="display:flex;gap:12px;padding:12px 14px 14px">
    <div style="flex:1.08;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <span style="${OSW};font-weight:700;font-size:12px;letter-spacing:1px">⭐ TITULARES (11)</span><span style="flex:1"></span>
        <span style="${OSW};font-weight:700;font-size:10.5px;border:2px solid ${INK};border-radius:7px;padding:2px 8px;background:#fff">4-4-2 ▾</span></div>
      ${campinho(1.05)}
      <div style="display:flex;gap:6px;margin-top:9px">
        ${[['🏛️', 'Comissão'], ['🌱', 'Base'], ['🕴️', 'Agenciados']].map(([e, t]) => `
          <span style="flex:1;background:#fff;border:2.5px solid ${INK};border-radius:10px;padding:6px 4px;text-align:center;
            box-shadow:2px 2px 0 ${INK};${OSW};font-weight:700;font-size:10px">${e} ${t}</span>`).join('')}</div>
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;gap:5px;margin-bottom:6px">${abaPill('TITULARES (11)', false)}${abaPill('RESERVAS (11)', true)}</div>
      <div style="display:flex;align-items:center;gap:6px;padding:0 6px 4px;${OSW};font-weight:700;font-size:8px;
        letter-spacing:1px;color:rgba(12,12,12,.38)">
        <span style="width:14px;text-align:right">Nº</span><span style="width:12px"></span>
        <span style="flex:1">NOME</span><span>POS</span><span>NÍVEL</span><span style="width:22px">GÁS</span></div>
      ${RESERVAS.map(r => linhaRes(...r, r[0] === 15)).join('')}
      <div style="margin-top:8px;background:${INK};border-radius:11px;padding:9px 11px;display:flex;align-items:center;gap:10px;
        box-shadow:3px 3px 0 rgba(0,0,0,.3)">
        <span style="width:34px;height:38px;flex:none;background:repeating-linear-gradient(90deg,${BEGE} 0 5px,#0C0C0C 5px 10px);
          border:2.5px solid #000;border-radius:4px 4px 12px 12px"></span>
        <span style="flex:1;color:#fff">
          <span style="display:block;${OSW};font-weight:700;font-size:14px;line-height:1.1">Aldair 🚑</span>
          <span style="display:block;${SYS};font-size:9px;font-weight:600;color:rgba(255,255,255,.55)">Roma · 1992 · ZAG</span>
          <span style="display:block;${SYS};font-size:9px;font-weight:700;color:#FF9C8A;margin-top:3px">Lesionado · volta em 2 rodadas</span></span>
        <span style="${OSW};font-weight:700;font-size:10px;background:${GOLD};color:${INK};border-radius:6px;padding:4px 9px;flex:none">⭐ CRAQUE</span>
      </div>
    </div>
  </div>
</div>`

const nota = (emoji, titulo, txt, cor) => `
  <div style="border:4px solid ${INK};border-radius:15px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:11px">
    <div style="display:flex;align-items:center;gap:8px;background:${cor};padding:7px 12px">
      <span style="font-size:17px;line-height:1">${emoji}</span>
      <span style="${OSW};font-weight:700;font-size:14.5px;text-transform:uppercase;color:#fff;line-height:1.1">${titulo}</span></div>
    <div style="padding:9px 12px;${OSW};font-weight:400;font-size:12.5px;line-height:1.55">${txt}</div></div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1380px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  INSPIRADO NA SUA REFERÊNCIA · NO NOSSO PADRÃO DE ARTE · DESENHO, NADA CODADO</div>
<h1 style="${OSW};font-weight:700;font-size:44px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  Campinho de um lado, <span style="color:${ROXO}">lista do outro</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 20px;max-width:1180px;opacity:.88">
  Peguei o <b>layout</b> da sua referência e joguei fora a <b>pele</b> dela: em vez do preto cromado, o nosso
  creme com borda preta, sombra dura e Oswald. A camisa do campinho virou a <b>nossa</b> camisa listrada, e o
  amarelo do goleiro é o nosso dourado.</p>

<div style="display:flex;gap:26px;align-items:flex-start;margin-bottom:24px">
  <div style="flex:none;text-align:center">
    <div style="display:inline-block;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;margin-bottom:9px;box-shadow:3px 3px 0 ${INK}">📱 CELULAR · O QUE IMPORTA</div>
    ${telaCel}
  </div>
  <div style="flex:1">
    ${nota('✅', 'O que eu peguei da sua referência', `
      · <b>No campinho, só os 11.</b> Já é assim hoje — a referência confirma que está certo.<br>
      · <b>A lista vira TABELA</b>, densa: Nº · camisa · nome · POS · nível · gás. Cabe muito mais gente na
      mesma altura que a lista de hoje.<br>
      · <b>O botão TITULARES / RESERVAS</b> em cima da tabela: você escolhe o que está vendo, em vez de ter
      as duas listas brigando por espaço.<br>
      · <b>A comissão técnica no pé</b>, como lá.`, GREEN)}
    ${nota('🔄', 'O que eu mudei — e por quê', `
      · <b>As setas "PARA RESERVAS / PARA TITULARES" não vêm.</b> O nosso jogo troca por
      <b>toque-toque</b>, que é mais rápido no celular e você já aprovou. As setas existem lá porque aquele
      jogo é de mouse.<br>
      · <b>No celular, um em cima do outro</b>, não lado a lado: a nossa tela tem 430px e o campinho
      espremido em metade disso viraria confete. Lado a lado eu faria <b>no PC</b> (abaixo).<br>
      · <b>O jogador selecionado mostra a CARTA dele</b>, não uma ficha genérica de atributos — a carta
      colecionável já existe no jogo e é mais nossa.`, ROXO)}
    ${nota('⛔', 'O que eu NÃO copiaria de jeito nenhum', `
      A coluna <b>"GER"</b> (o overall de cada jogador). No nosso jogo isso é <b>perk pago</b>: o olheiro do
      ⭐ Craque vê até craque, o do 👑 Lenda vê tudo. Pôr o número na tabela pra todo mundo
      <b>entrega de graça o que a loja vende</b>.<br>
      Na minha versão a coluna mostra o <b>NÍVEL</b> (🪵 🎯 💎 ⭐ 👑), que todo mundo já enxerga hoje — e o
      número aparece <b>no lugar do selo</b> só pra quem tem olheiro. Mesma tabela, sem furar a loja.`, VERM)}
  </div>
</div>

<div style="${OSW};font-weight:700;font-size:22px;text-transform:uppercase;margin:0 0 12px">🖥️ E no PC, aí sim lado a lado</div>
<div style="display:flex;gap:26px;align-items:flex-start;margin-bottom:22px">
  ${telaPC}
  <div style="flex:1;${OSW};font-weight:400;font-size:13.5px;line-height:1.65">
    No monitor sobra largura — <b>hoje o jogo desperdiça mais da metade da tela</b> (a coluna fica com ~620px
    de 1440). É exatamente onde o layout da sua referência brilha: <b>campinho à esquerda, tabela à direita,
    tudo numa tela só, sem rolar nada</b>.<br><br>
    Repare no <b>cartão preto embaixo da tabela</b>: é o jogador que você tocou. Ali eu mostraria a
    <b>carta dele</b> e o que está acontecendo — <i>"Aldair · lesionado · volta em 2 rodadas"</i>.
    No celular esse cartão só aparece quando você toca em alguém.<br><br>
    <b>E o buraco?</b> Ele <b>não existe neste layout</b>. Campinho de um lado e lista do outro não são duas
    listas de tamanhos diferentes — são duas coisas diferentes. O elenco pode ir pra 27 e a tabela só ganha
    linha, sem sobrar vazio em canto nenhum.</div>
</div>

<div style="border:4px solid ${GOLD};border-radius:18px;background:#FFFBEE;padding:16px 20px">
  <div style="${OSW};font-weight:700;font-size:18px;text-transform:uppercase;margin-bottom:9px">🎯 Por que eu gostei da sua referência mais que das minhas duas saídas</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    As minhas duas (transbordo e empilhado) tentavam <b>consertar</b> o problema de ter duas listas de
    tamanhos diferentes na mesma linha. A sua referência <b>não tem esse problema</b>: ela troca o par
    "titulares | reservas" pelo par <b>"campo | lista"</b> — e aí nunca sobra buraco, porque não são duas
    listas competindo.<br><br>
    <b>É desenho e não foi codado.</b> Se você curtir, o próximo passo é o de sempre: eu monto essa tela
    <b>de verdade</b>, com o seu elenco real rodando, pra você ver no celular antes de qualquer commit.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:13px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    desenho de 16/09 · nada codado<br>refazer: <b>node scripts/mockup-elenco-referencia.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1380, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
