// 👥🏢 ELENCO MAIOR + O QUE FAZER COM A SAF (Diego, 16/09)
//
// Pergunta dele: *"poder colocar mais jogadores no elenco… mais um goleiro, mais um
// meia, mais um lateral, mais um zagueiro e mais um atacante. Mas o meu problema é
// esteticamente… porque também tem a SAF, que pode pegar até quatro emprestados.
// Tô com medo de ficar muito exagerado… ou eu limitar a SAF se eu já tiver com o
// elenco cheio. Mas aí pode ser que a SAF também não tenha mais sentido ter. E já me
// fale sobre a SAF também, se tem alguma ideia nova pra reformular"*.
//
// ⚠️ OS NÚMEROS SÃO MEDIDOS, não chutados:
//   · as alturas saem da bancada `scripts/teste-elenco/` (monta o SquadTab DE VERDADE
//     com 22, 27 e 31, num celular de 454px):
//         DEPLOY_BASE=/ npx vite --port 5199  →  /scripts/teste-elenco/index.html?n=22
//   · as vagas por posição saem de `slotsCheio()` (store.tsx) = `FORMATIONS[f][pos] * 2`;
//   · as vagas de empréstimo saem da tela da SAF (`estadio.tsx`): D1 · C2 · B3 · A4 POR LADO.
//
// Rodar: node scripts/mockup-elenco-e-saf.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-elenco-e-saf.png')
const VERM = '#C2452F', ROXO = '#7C3AED', AZUL = '#1F5FA8', SLATE = '#3E4A5A'
const png = c => `data:image/png;base64,${readFileSync(c).toString('base64')}`

// medido na bancada, celular de 454px
const MEDIDO = [
  { n: 22, alt: 2152, rot: 'HOJE', sub: '2× a formação', cor: INK },
  { n: 27, alt: 2427, rot: '+1 POR POSIÇÃO', sub: 'o que você pensou', cor: ROXO },
  { n: 31, alt: 2647, rot: '+1 E MAIS A SAF', sub: 'o teto na Série A', cor: VERM },
]
const coluna = m => `
  <div style="flex:1;text-align:center">
    <div style="display:inline-block;background:${m.cor};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:3px 13px;${OSW};font-weight:700;font-size:11.5px;letter-spacing:1px;box-shadow:3px 3px 0 ${INK}">${m.rot}</div>
    <div style="${OSW};font-weight:700;font-size:24px;margin-top:6px">${m.n} jogadores</div>
    <div style="${OSW};font-weight:400;font-size:11px;opacity:.65;margin-bottom:7px">${m.sub}</div>
    <img src="${png(`/tmp/elenco-${m.n}.png`)}" style="width:100%;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};display:block">
    <div style="${OSW};font-weight:700;font-size:12.5px;margin-top:7px">${(m.alt / 900).toFixed(1)} telas de rolagem</div>
    ${m.n === 22 ? '' : `<div style="${OSW};font-weight:700;font-size:11.5px;color:${m.cor}">+${m.alt - 2152}px que hoje</div>`}
  </div>`

// vagas por posição, direto da regra do código (FORMATIONS[f][pos] × 2)
const FORM = { '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 }, '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, '4-2-4': { GOL: 1, LAT: 2, ZAG: 2, MEI: 2, ATA: 4 } }
const POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const linhaForm = f => `<tr>
  <td style="${OSW};font-weight:700;font-size:13px;padding:4px 8px">${f}</td>
  ${POS.map(p => { const v = FORM[f][p] * 2; const apertado = v <= 2
    return `<td style="text-align:center;padding:4px 6px">
      <span style="${OSW};font-weight:700;font-size:16px;color:${apertado ? VERM : INK}">${v}</span>
      ${apertado ? `<div style="font-size:8.5px;${OSW};font-weight:700;color:${VERM}">aperta</div>` : ''}</td>` }).join('')}
  <td style="text-align:center;${OSW};font-weight:700;font-size:15px;padding:4px 8px">22</td></tr>`

const caminho = (letra, cor, titulo, elenco, custo, pro, contra, rec) => `
  <div style="flex:1;border:4px solid ${cor};border-radius:16px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
    <div style="background:${cor};color:#fff;padding:8px 13px;display:flex;align-items:center;gap:9px">
      <span style="background:rgba(255,255,255,.95);color:${cor};${OSW};font-weight:700;font-size:15px;width:24px;height:24px;
        border-radius:999px;display:flex;align-items:center;justify-content:center;flex:none">${letra}</span>
      <span style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;line-height:1.1;flex:1">${titulo}</span>
    </div>
    <div style="padding:10px 13px;${OSW};font-weight:400;font-size:13px;line-height:1.5">
      <div style="display:flex;gap:10px;margin-bottom:8px">
        <span style="background:#F1EDE0;border-radius:7px;padding:4px 9px;font-weight:700;font-size:12px">${elenco}</span>
        <span style="background:#F1EDE0;border-radius:7px;padding:4px 9px;font-weight:700;font-size:12px">${custo}</span>
      </div>
      <div style="margin-bottom:5px"><b style="color:${GREEN}">A favor:</b> ${pro}</div>
      <div><b style="color:${VERM}">Contra:</b> ${contra}</div>
      ${rec ? `<div style="margin-top:8px;background:${GOLD};border:2.5px solid ${INK};border-radius:8px;padding:6px 9px;font-weight:700;font-size:12.5px">👉 ${rec}</div>` : ''}
    </div>
  </div>`

const ideia = (n, emoji, titulo, texto, tam, cor) => `
  <div style="border:4px solid ${INK};border-radius:16px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:9px;background:${cor};padding:8px 13px">
      <span style="font-size:22px;line-height:1">${emoji}</span>
      <span style="${OSW};font-weight:700;font-size:16px;text-transform:uppercase;color:#fff;flex:1;line-height:1.1">${n} · ${titulo}</span>
      <span style="background:rgba(255,255,255,.93);${OSW};font-weight:700;font-size:10px;letter-spacing:1px;padding:3px 9px;border-radius:999px">${tam}</span>
    </div>
    <div style="padding:10px 13px;${OSW};font-weight:400;font-size:13.5px;line-height:1.55">${texto}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1240px}
  table{border-collapse:collapse;width:100%}
  th{${OSW};font-weight:700;font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:.6;padding:0 6px 4px}
  tr+tr td{border-top:2px solid rgba(12,12,12,.08)}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  MEDIDO NA BANCADA · ABA ELENCO DE VERDADE · CELULAR DE 454px · NADA FOI ALTERADO</div>
<h1 style="${OSW};font-weight:700;font-size:42px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  Elenco maior <span style="color:${ROXO}">e a SAF</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.45;margin:0 0 20px;max-width:1060px;opacity:.85">
  Resposta curta: <b>cabe.</b> +5 jogadores custam menos de meia tela de rolagem. Mas medindo eu achei uma coisa
  que muda a conversa — <b>o aperto não é igual em todas as posições</b>, e o seu medo com a SAF tem fundo de verdade:
  <b>elenco maior enfraquece a SAF</b>. Está tudo aqui embaixo.</p>

<div style="${OSW};font-weight:700;font-size:19px;text-transform:uppercase;margin:0 0 10px">1 · Cabe na tela?</div>
<div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:12px">${MEDIDO.map(coluna).join('')}</div>
<div style="border:4px solid ${GREEN};border-radius:16px;background:#EFF7F1;padding:12px 16px;margin-bottom:24px;
  ${OSW};font-weight:400;font-size:13.5px;line-height:1.55">
  <b style="color:${GREEN}">Cabe, sim.</b> A lista é em <b>duas colunas</b> (titulares de um lado, reservas do outro),
  então cada jogador novo empurra só <b>meia linha</b>. +5 dá <b>+275px</b> — de 2,4 pra 2,7 telas. Mesmo no teto com a
  SAF (31) são 2,9 telas. E <b>metade da altura nem é a lista</b>: é o banner, o campinho, o 🏛️ Departamento Técnico e
  a folha salarial. <b>O aperto não é a tela.</b></div>

<div style="${OSW};font-weight:700;font-size:19px;text-transform:uppercase;margin:0 0 4px">2 · Onde aperta DE VERDADE</div>
<p style="${OSW};font-weight:400;font-size:14px;line-height:1.5;margin:0 0 12px;max-width:1060px;opacity:.85">
  A regra hoje é <b>2× a formação por posição</b>. Repare no que isso faz: o meio-campo do 4-4-2 tem <b>8</b> jogadores
  (sobra), mas o gol tem <b>2</b> — e <b>2 é o número do goleiro em TODAS as 7 formações do jogo</b>.</p>
<div style="border:4px solid ${INK};border-radius:16px;background:#fff;box-shadow:5px 5px 0 ${INK};padding:12px 16px;margin-bottom:12px">
  <table><tr><th style="text-align:left">Formação</th>${POS.map(p => `<th>${p}</th>`).join('')}<th>Total</th></tr>
  ${Object.keys(FORM).map(linhaForm).join('')}</table>
</div>
<div style="border:4px solid ${VERM};border-radius:16px;background:#FDF1EE;padding:12px 16px;margin-bottom:24px;
  ${OSW};font-weight:400;font-size:13.5px;line-height:1.55">
  <b style="color:${VERM}">O buraco do goleiro.</b> São 1 titular + 1 reserva, sempre. Se o titular se machuca
  <b>e</b> o reserva está suspenso (ou os dois cansados, agora que existe gás), acabou: <b>não dá pra botar zagueiro no
  gol</b> — a troca do jogo só aceita <b>a mesma posição</b>. Aí entra perna-de-pau, que é exatamente o que você
  não quer ver. <b>+1 no meio-campo resolve um problema que não existe; +1 no gol resolve o único que existe sempre.</b></div>

<div style="${OSW};font-weight:700;font-size:19px;text-transform:uppercase;margin:0 0 10px">3 · Três caminhos</div>
<div style="display:flex;gap:18px;align-items:stretch;margin-bottom:24px">
  ${caminho('A', ROXO, '+1 em cada posição', '27 (+4 SAF = 31)', 'mexe em 4 lugares',
    'é o que você pediu, e visualmente passa tranquilo.',
    'mexe na régua "2× a formação" que o leilão, o Monte, a base e a SAF todos usam — o leilão passa a ter que pôr <b>5 cartas a mais por técnico</b> na mesa, e a folha salarial cresce junto.', '')}
  ${caminho('B', GREEN, 'só +1 goleiro', '23 (+4 SAF = 27)', '+55px na tela',
    'resolve o aperto que existe de verdade, em todas as formações, e <b>custa quase nada</b>: uma linha a mais na lista.',
    'não atende o pedido inteiro — lateral, zagueiro, meia e atacante continuam como estão.',
    'se fosse pra mexer hoje, eu faria esta')}
  ${caminho('C', AZUL, 'não mexe: a SAF é o caminho', '22 (+4 SAF = 26)', 'zero código',
    'o elenco continua sendo a régua limpa de sempre, e passar de 22 vira <b>mérito</b>: só quem comprou a SAF e subiu de divisão consegue.',
    'o goleiro continua apertado pra quem não comprou a SAF (2.000 🪙 é caro cedo).', '')}
</div>

<div style="${OSW};font-weight:700;font-size:19px;text-transform:uppercase;margin:0 0 4px">4 · E a SAF</div>
<div style="border:4px solid ${SLATE};border-radius:16px;background:#EEF1F4;padding:12px 16px;margin-bottom:14px;
  ${OSW};font-weight:400;font-size:13.5px;line-height:1.6">
  <b>O que ela é hoje</b> (conferido no código): custa <b>2.000 🪙</b>, compra única e pra sempre · você leva
  <b>50% do lucro de campanha</b> dela (título e acesso) e paga <b>50% da multa</b> se ela cair · <b>nada</b> de
  compra e venda · ela <b>nunca</b> disputa o seu leilão · destrava a categoria <b>👑 Lenda</b> na Agência ·
  e empresta <b>por lado</b>: Série D <b>1</b> · C <b>2</b> · B <b>3</b> · A <b>4</b>. Quem você pega entra
  <b>por cima</b> do limite do elenco.<br>
  <b style="color:${VERM}">⚠️ E aqui está o seu medo, confirmado:</b> hoje quase todo mundo só <b>PEGA</b> da SAF —
  ninguém manda ninguém pra lá. Se o elenco subir pra 27, você tem mais gente sua e <b>menos motivo pra pegar
  emprestado</b>. Ou seja: <b>aumentar o elenco enfraquece a SAF de graça.</b> Não é que ela perde o sentido —
  é que o sentido dela hoje está quase todo no empréstimo.</div>

${ideia('IDEIA 1', '🌱', 'A SAF FORMA jogador (a que eu faria)', `
  Hoje o empréstimo só anda numa direção. Se um jogador passar <b>uma temporada jogando NA SAF</b>, ele volta
  <b>melhor</b> — sobe o piso dele, exatamente como já acontece com o artilheiro (+10 no piso, regra que já existe
  no jogo). Aí emprestar deixa de ser "abrir espaço" e vira <b>investimento</b>: você manda o garoto pra ele voltar
  pronto. Isso resolve o problema de raiz, porque o valor da SAF para de depender do tamanho do seu elenco.
  E dá sentido pro que já existe: ela é um clube de Série D com jogo toda semana.`, 'MÉDIA', GREEN)}

${ideia('IDEIA 2', '🎽', 'A SAF é o teto do elenco', `
  Em vez de subir o elenco pra 27 no braço, o caminho de passar de 22 <b>é</b> a SAF — e a escada dela
  (D1 · C2 · B3 · A4) já acompanha a carreira sozinha. Quem sobe de divisão ganha elenco maior como prêmio,
  sem tocar na régua do leilão. <b>É a opção C de cima, vista do lado da SAF.</b> Custo: zero.`, 'BARATA', AZUL)}

${ideia('IDEIA 3', '💰', 'Emprestar vira dinheiro', `
  Hoje o empréstimo é <b>de graça</b> nos dois lados. Se a SAF pagasse uma <b>luva por temporada</b> pra usar um
  jogador seu, emprestar viraria decisão de caixa e não só de espaço — e o time que está duro teria uma saída
  honesta pra levantar moeda sem vender ninguém.`, 'BARATA', ROXO)}

${ideia('IDEIA 4', '📰', 'A SAF aparece no jornal', `
  Ela joga a temporada inteira e você só vê o número no fim. Uma linha na página 2 do jornal — <b>"sua SAF subiu
  pra Série C"</b>, <b>"o garoto que você emprestou foi artilheiro da Série D"</b> — custa quase nada (o jornal
  já existe) e faz ela parecer um clube de verdade, não uma planilha.`, 'BARATA', SLATE)}

<div style="margin-top:14px;border:4px solid ${GOLD};border-radius:18px;background:#FFFBEE;padding:15px 18px">
  <div style="${OSW};font-weight:700;font-size:17px;text-transform:uppercase;margin-bottom:7px">👉 O que eu faria, se você me perguntasse</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.65">
    <b>Caminho B + Ideia 1.</b> Sobe <b>só o goleiro</b> (o aperto que existe de verdade, em toda formação, por +55px de
    tela) e faz a <b>SAF formar jogador</b>. Assim você resolve o buraco do gol sem mexer na régua que o leilão inteiro
    usa, e a SAF ganha um motivo que <b>não depende</b> do tamanho do seu elenco — ela para de ser depósito e vira
    categoria de base.<br>
    <b>Se você quiser mesmo o +1 em todas</b> (caminho A), dá pra fazer — mas antes eu meço quanto isso mexe no
    <b>tamanho da mesa do leilão</b> e na <b>folha salarial</b>, porque aí o efeito é no bolso, não na tela.
    <b>Nada disso foi codado</b>: é levantamento pra você escolher.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:12px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    levantamento de 16/09 · nada foi alterado<br>refazer: <b>node scripts/mockup-elenco-e-saf.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1240, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
