// 👥⚡ O ELENCO DE 31 NO LAYOUT NOVO + "COMO SE VÊ O GÁS DOS TITULARES?" (Diego 16/09)
//
// Ele: *"eu teria q ver a foto de +1 por posição q dá 5 e +4 da SAF pra ver como fica…
// E como q vê a energia dos titulares? No campo? N sei…"*
//
// ⚠️ DESENHO, nada codado.
//
// 📐 A conta do elenco de 27 (+1 por posição, no 4-4-2):
//    GOL 3 · LAT 5 · ZAG 5 · MEI 9 · ATA 5 = 27 · titulares 11 → reservas 16
//    + 4 emprestados da SAF (Série A) = 31 na tela.
//
// ⚡ E a pergunta do gás tem uma ORDEM DELE no meio, de 12/09, que está no código:
//    *"não quero que apareça no campinho, só onde tem a listagem"* (pyramidseason.tsx).
//    Então as opções aqui respeitam isso — e a que NÃO respeita está marcada como
//    "isto exige você mudar de ideia", porque não sou eu que mudo regra dele.
//
// Rodar: node scripts/mockup-elenco-31-e-gas.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-elenco-31-e-gas.png')
const VERM = '#C2452F', ROXO = '#7C3AED', SLATE = '#3E4A5A', BEGE = '#B2A583', AMB = '#D98324'
const SYS = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"
const corGas = g => g > 55 ? GREEN : g > 30 ? AMB : VERM

const camisaCampo = (num, tag, nome, cor = BEGE, anel) => `
  <div style="text-align:center;width:56px;flex:none">
    <div style="position:relative;width:32px;height:36px;margin:0 auto;
      background:repeating-linear-gradient(90deg, ${cor} 0 5px, #0C0C0C 5px 10px);
      border:2.5px solid ${INK};border-radius:4px 4px 12px 12px;box-shadow:2px 2px 0 ${INK};
      display:flex;align-items:center;justify-content:center">
      <span style="${OSW};font-weight:700;font-size:14px;color:#fff;text-shadow:0 0 4px #000,1px 1px 0 #000">${num}</span>
      ${anel != null ? `<span style="position:absolute;left:-4px;right:-4px;bottom:-5px;height:4px;background:rgba(0,0,0,.45);
        border-radius:3px;overflow:hidden"><span style="display:block;height:100%;width:${anel}%;background:${corGas(anel)}"></span></span>` : ''}
    </div>
    <div style="${OSW};font-weight:700;font-size:7.5px;background:${INK};color:${GOLD};border-radius:3px;
      padding:0 4px;display:inline-block;margin-top:${anel != null ? 5 : 3}px;letter-spacing:.5px">${tag}</div>
    <div style="${OSW};font-weight:700;font-size:8px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}</div>
  </div>`

const XI = [
  [[11, 'ATA', 'Adriano', 67], [9, 'ATA', 'Juninho', 72]],
  [[8, 'MEI', 'Mozer', 74], [10, 'MEI', 'Raí', 69], [7, 'MEI', 'Djalminha', 58], [5, 'MEI', 'Edmundo', 26]],
  [[6, 'LAT', 'Lúcio', 71], [4, 'ZAG', 'Romário', 59], [3, 'ZAG', 'Careca', 66], [2, 'LAT', 'R. Carlos', 64]],
  [[1, 'GOL', 'R. Ceni', 78]],
]
const campinho = comGas => `
  <div style="background:repeating-linear-gradient(180deg,#2d7a41 0 22px,#286e3a 22px 44px);
    border:3px solid ${INK};border-radius:11px;padding:11px 6px 9px;box-shadow:3px 3px 0 ${INK};position:relative;overflow:hidden">
    <div style="position:absolute;left:8%;right:8%;top:6%;bottom:6%;border:2px solid rgba(255,255,255,.22);border-radius:4px"></div>
    <div style="position:absolute;left:50%;top:50%;width:52px;height:52px;transform:translate(-50%,-50%);
      border:2px solid rgba(255,255,255,.2);border-radius:999px"></div>
    <div style="position:relative;display:flex;flex-direction:column;gap:${comGas ? 11 : 9}px">
      ${XI.map(l => `<div style="display:flex;justify-content:center;gap:3px">${l.map(([n, t, nm, g]) => camisaCampo(n, t, nm, t === 'GOL' ? GOLD : BEGE, comGas ? g : null)).join('')}</div>`).join('')}
    </div>
  </div>`

const NIVEL = { lenda: '👑', craque: '⭐', promessa: '💎', bom: '🎯', prof: '🪵' }
const linha = (n, nome, ficha, pos, nivel, gas, selo, destaque) => `
  <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:${destaque ? '#FFF3CE' : '#fff'};
    border:2px solid ${destaque ? INK : 'rgba(12,12,12,.14)'};border-radius:7px;margin-bottom:3px">
    <span style="${OSW};font-weight:700;font-size:9.5px;color:rgba(12,12,12,.4);width:14px;flex:none;text-align:right">${n}</span>
    <span style="width:12px;height:14px;flex:none;background:repeating-linear-gradient(90deg,${BEGE} 0 2px,#0C0C0C 2px 4px);
      border:1.5px solid ${INK};border-radius:2px 2px 4px 4px"></span>
    <span style="flex:1;min-width:0">
      <span style="display:block;${OSW};font-weight:700;font-size:10.5px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}${selo ? ` <span style="font-size:8.5px">${selo}</span>` : ''}</span>
      <span style="display:block;${SYS};font-size:7.5px;font-weight:600;color:rgba(12,12,12,.42)">${ficha}</span></span>
    <span style="${OSW};font-weight:700;font-size:8px;background:${INK};color:${GOLD};border-radius:3px;padding:1px 4px;flex:none">${pos}</span>
    <span style="font-size:10px;flex:none">${NIVEL[nivel]}</span>
    <span style="width:22px;height:4px;background:rgba(12,12,12,.12);border-radius:2px;flex:none;overflow:hidden">
      <span style="display:block;height:100%;width:${gas}%;background:${corGas(gas)}"></span></span>
  </div>`

const TIT = [
  [1, 'Rogério Ceni', 'São Paulo · 1990', 'GOL', 'lenda', 78, ''], [2, 'R. Carlos', 'Real Madrid · 1994', 'LAT', 'lenda', 64, ''],
  [3, 'Careca', 'Palmeiras · 1999', 'ZAG', 'craque', 66, ''], [4, 'Romário', 'Vasco · 1998', 'ZAG', 'lenda', 59, ''],
  [5, 'Edmundo', 'Real Madrid · 2006', 'MEI', 'craque', 26, '🥵'], [6, 'Lúcio', 'Inter · 1993', 'LAT', 'craque', 71, ''],
  [7, 'Djalminha', 'Inter · 2005', 'MEI', 'craque', 58, ''], [8, 'Mozer', 'Milan · 2003', 'MEI', 'bom', 74, ''],
  [9, 'Juninho', 'Santos · 2013', 'ATA', 'bom', 72, ''], [10, 'Raí', 'Roma · 2004', 'MEI', 'lenda', 69, ''],
  [11, 'Adriano', 'Botafogo · 2012', 'ATA', 'craque', 67, ''],
]
const RES = [
  [12, 'Taffarel', 'Santos · 2001', 'GOL', 'bom', 96, ''], [13, 'Dida', 'Milan · 2003', 'GOL', 'craque', 99, ''],
  [14, 'Cafu', 'Milan · 1991', 'LAT', 'craque', 92, ''], [15, 'Júnior', 'São Paulo · 2002', 'LAT', 'bom', 88, ''],
  [16, 'Zé Maria', 'Corinthians · 2005', 'LAT', 'prof', 94, ''], [17, 'Aldair', 'Roma · 1992', 'ZAG', 'craque', 22, '🚑'],
  [18, 'Bebeto', 'Botafogo · 2000', 'ZAG', 'lenda', 95, ''], [19, 'Mauro Galvão', 'Botafogo · 1989', 'ZAG', 'bom', 91, ''],
  [20, 'Kaká', 'Flamengo · 2009', 'MEI', 'lenda', 90, ''], [21, 'Marcelo', 'Corinthians · 2008', 'MEI', 'craque', 93, ''],
  [22, 'Túlio', 'Internacional · 2007', 'MEI', 'promessa', 41, '😓'], [23, 'Ronaldinho', 'Palmeiras · 2011', 'MEI', 'lenda', 97, ''],
  [24, 'Rivaldo', 'Vasco · 2010', 'MEI', 'lenda', 89, ''], [25, 'Denílson', 'São Paulo · 2014', 'ATA', 'bom', 89, ''],
  [26, 'Vampeta', 'Roma · 2016', 'ATA', 'prof', 94, ''], [27, 'Emerson', 'Milan · 2015', 'ATA', 'bom', 92, ''],
]
const SAF = [
  [28, 'Paulo Isidoro', 'Grêmio · 1981', 'LAT', 'bom', 85, '🔄'], [29, 'Oscar', 'Ponte Preta · 1978', 'ZAG', 'craque', 90, '🔄'],
  [30, 'Gérson', 'Botafogo · 1970', 'MEI', 'lenda', 88, '🔄'], [31, 'Reinaldo', 'Atlético-MG · 1977', 'ATA', 'craque', 93, '🔄'],
]

const aba = (t, on, cor = INK) => `
  <span style="flex:1;text-align:center;${OSW};font-weight:700;font-size:9.5px;padding:6px 0;border:2.5px solid ${INK};
    border-radius:9px;background:${on ? cor : '#fff'};color:${on ? (cor === INK ? GOLD : '#fff') : INK};${on ? `box-shadow:2px 2px 0 ${INK}` : ''}">${t}</span>`

const tela = (abaAtiva, linhas, comGas, faixaGas) => `
<div style="width:352px;background:${CREME};border:5px solid ${INK};border-radius:22px;overflow:hidden;box-shadow:6px 6px 0 ${INK}">
  <div style="background:${INK};color:#fff;padding:8px 12px;display:flex;align-items:baseline;gap:7px">
    <span style="${OSW};font-weight:700;font-size:15px;flex:1">MEU TIME</span>
    <span style="${OSW};font-weight:700;font-size:12px">31</span>
    <span style="${SYS};font-size:8.5px;font-weight:700;color:rgba(255,255,255,.45)">27 seus + 4 da SAF</span></div>
  ${faixaGas ? `<div style="background:#FFF6E2;border-bottom:2px solid rgba(217,131,36,.4);padding:6px 11px;display:flex;align-items:center;gap:7px">
    <span style="font-size:13px">⚡</span>
    <span style="${SYS};font-size:10px;font-weight:700;color:#6b4410;flex:1;line-height:1.35">
      Gás dos titulares: <b>1 no vermelho</b> (Edmundo 🥵) · 3 no amarelo</span>
    <span style="${OSW};font-weight:700;font-size:9px;background:${INK};color:${GOLD};border-radius:6px;padding:3px 8px">VER</span></div>` : ''}
  <div style="padding:8px 11px 0">${campinho(comGas)}</div>
  <div style="padding:8px 11px 11px">
    <div style="display:flex;gap:4px;margin-bottom:6px">
      ${aba('⭐ TITULARES (11)', abaAtiva === 'tit')}${aba('🔁 RESERVAS (16)', abaAtiva === 'res')}${aba('🏢 SAF (4)', abaAtiva === 'saf', SLATE)}</div>
    <div style="display:flex;align-items:center;gap:6px;padding:0 6px 4px;${OSW};font-weight:700;font-size:7.5px;
      letter-spacing:1px;color:rgba(12,12,12,.38)">
      <span style="width:14px;text-align:right">Nº</span><span style="width:12px"></span>
      <span style="flex:1">NOME</span><span>POS</span><span>NÍVEL</span><span style="width:22px">GÁS</span></div>
    ${linhas}
    ${abaAtiva === 'saf' ? `<div style="${SYS};font-size:9px;font-weight:700;color:rgba(12,12,12,.55);line-height:1.45;padding:5px 4px 0">
      Eles jogam por você, mas são da sua SAF — <b>não ocupam vaga do seu elenco</b>, e você devolve quando quiser.</div>` : ''}
  </div>
</div>`

const opc = (n, titulo, tag, cor, txt) => `
  <div style="border:4px solid ${INK};border-radius:15px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:11px">
    <div style="display:flex;align-items:center;gap:8px;background:${cor};padding:7px 12px">
      <span style="background:rgba(255,255,255,.95);color:${cor};${OSW};font-weight:700;font-size:13px;width:21px;height:21px;
        border-radius:999px;display:flex;align-items:center;justify-content:center;flex:none">${n}</span>
      <span style="${OSW};font-weight:700;font-size:14px;text-transform:uppercase;color:#fff;flex:1;line-height:1.1">${titulo}</span>
      <span style="background:rgba(255,255,255,.93);${OSW};font-weight:700;font-size:8.5px;letter-spacing:1px;padding:2px 8px;border-radius:999px;flex:none">${tag}</span></div>
    <div style="padding:9px 12px;${OSW};font-weight:400;font-size:12.5px;line-height:1.55">${txt}</div></div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1420px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  ELENCO DE 31 NO LAYOUT NOVO · DESENHO, NADA CODADO</div>
<h1 style="${OSW};font-weight:700;font-size:44px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  27 seus <span style="color:${SLATE}">+ 4 da SAF</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 8px;max-width:1200px;opacity:.88">
  Com +1 por posição no 4-4-2: <b>GOL 3 · LAT 5 · ZAG 5 · MEI 9 · ATA 5 = 27</b>. Tira os 11 do campo e sobram
  <b>16 reservas</b>. Mais os <b>4 da SAF</b>, dá <b>31</b> na tela. No layout novo isso vira <b>três abas</b>
  em cima de uma tabela — e <b>a altura não muda</b>, porque só uma lista aparece por vez.</p>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 22px;max-width:1200px;opacity:.88">
  <b>E a sua pergunta do gás é a melhor coisa que você perguntou nesta conversa</b>, porque ela achou o
  <b>furo do layout</b>: se só uma lista aparece por vez, quem está vendo os reservas <b>não vê o gás dos
  titulares</b>. Está respondida aqui embaixo.</p>

<div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:26px">
  ${['tit', 'res', 'saf'].map((k, i) => `
    <div style="flex:none;text-align:center">
      <div style="display:inline-block;background:${k === 'saf' ? SLATE : k === 'res' ? ROXO : GREEN};color:#fff;border:3px solid ${INK};
        border-radius:999px;padding:4px 14px;${OSW};font-weight:700;font-size:11px;letter-spacing:1px;margin-bottom:8px;
        box-shadow:3px 3px 0 ${INK}">${['⭐ ABA TITULARES', '🔁 ABA RESERVAS', '🏢 ABA SAF'][i]}</div>
      ${tela(k, (k === 'tit' ? TIT : k === 'res' ? RES : SAF).map(r => linha(...r, r[0] === 5 || r[0] === 17)).join(''), false, k === 'tit')}
    </div>`).join('')}
  <div style="flex:1">
    ${opc(1, 'A aba TITULARES mostra o gás', 'JÁ RESOLVE', GREEN, `
      <b>É a resposta mais simples, e ela já está no desenho da esquerda.</b> Um toque em
      <b>⭐ TITULARES (11)</b> e você tem os onze com a barrinha — <b>na lista</b>, que é exatamente onde
      você mandou o gás morar em 12/09: <i>"não quero que apareça no campinho, só onde tem a listagem"</i>.<br><br>
      Repare que hoje é <b>pior</b> que isso: os titulares e os reservas dividem a tela, então a lista dos
      titulares é a coluna estreita da esquerda. Aqui ela ocupa a largura toda.`)}
    ${opc(2, 'Uma faixa de aviso em cima do campinho', 'EU FARIA JUNTO', GOLD, `
      A faixa amarela <b>⚡ "Gás dos titulares: 1 no vermelho (Edmundo 🥵) · 3 no amarelo · VER"</b> que está
      na primeira tela.<br><br>
      Ela <b>não põe gás no campinho</b> — respeita a sua regra — mas te diz <b>que existe problema</b> sem
      você precisar abrir nada. E o <b>VER</b> pula direto pra lista já filtrada em quem está ruim.<br><br>
      <b>É a que eu acrescentaria</b>, porque resolve o caso real: você não quer olhar o gás de 11 jogadores,
      você quer saber <b>se tem alguém ruim</b>.`)}
    ${opc(3, 'Gás no campinho, embaixo da camisa', 'PRECISA VOCÊ MUDAR DE IDEIA', VERM, `
      Uma barrinha fina embaixo de cada camisa, como na tela da direita.<br><br>
      <b>Isto contraria uma ordem sua</b>, de 12/09, que está escrita no código com as suas palavras:
      <i>"não quero que apareça no campinho, só onde tem a listagem"</i>. Eu não mudo regra sua sozinho —
      então desenhei pra você ver e decidir.<br><br>
      <b>Minha opinião honesta:</b> você tinha razão. Com 11 barrinhas o campinho vira painel de controle e
      perde o que ele tem de bonito. A <b>opção 2</b> te dá a mesma informação sem esse custo.`)}
  </div>
</div>

<div style="${OSW};font-weight:700;font-size:22px;text-transform:uppercase;margin:0 0 12px">
  ⚡ E se fosse pra pôr no campinho mesmo assim, ficaria assim</div>
<div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:22px">
  <div style="flex:none;width:352px">
    <div style="background:${CREME};border:5px solid ${VERM};border-radius:22px;padding:11px;box-shadow:6px 6px 0 ${INK}">
      ${campinho(true)}
      <div style="${SYS};font-size:9.5px;font-weight:700;color:${VERM};text-align:center;padding:8px 4px 2px;line-height:1.4">
        ⚠️ contraria a sua ordem de 12/09 — está aqui só pra você comparar</div></div>
  </div>
  <div style="flex:1;${OSW};font-weight:400;font-size:14px;line-height:1.7">
    Olha o <b>Edmundo (5)</b>: a barrinha dele está vermelha, e dá pra ver de longe. Funciona.<br><br>
    <b>Mas olha o conjunto.</b> Onze barrinhas coloridas embaixo de onze camisas — o campinho deixa de ser
    "o meu time em campo" e vira <b>painel de indicadores</b>. E ele é a coisa mais bonita da aba.<br><br>
    <b>Por isso eu recomendo a 1 + a 2 juntas:</b> a faixa em cima te avisa que tem gente ruim <b>sem sujar o
    campo</b>, e a aba TITULARES mostra o detalhe quando você quiser. Você fica sabendo de tudo e o campinho
    continua o campinho.<br><br>
    <b>Nada disso foi codado.</b> Se você curtir o layout, o próximo passo é eu montar de verdade, com o seu
    elenco, pra ver rodando.</div>
</div>

<div style="border:4px solid ${SLATE};border-radius:18px;background:#EEF1F4;padding:15px 18px">
  <div style="${OSW};font-weight:700;font-size:17px;text-transform:uppercase;color:${SLATE};margin-bottom:8px">
    📐 A conta de altura, com 31 na tela</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    A lista mais comprida das três é a de <b>reservas: 16 linhas</b>. As outras duas (11 e 4) são menores, e
    <b>só uma aparece por vez</b> — então a tela tem <b>sempre</b> a altura da maior, não a soma.<br>
    Resultado: <b>31 jogadores cabem na mesma altura que os 16 reservas de hoje</b>. E se um dia o elenco
    crescer de novo, a tela <b>não cresce junto</b> — só a rolagem de dentro da tabela.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:13px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    desenho de 16/09 · nada codado<br>refazer: <b>node scripts/mockup-elenco-31-e-gas.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1420, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
