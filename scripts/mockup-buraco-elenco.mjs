// 🕳️ O BURACO NA ESQUERDA — duas saídas, na tela de verdade (Diego 16/09)
//
// Ele, olhando o elenco de 27: *"não sei se gostei porque ficou um buraco na esquerda"*.
// Está certo: as duas colunas são FIXAS (titulares | reservas), então os titulares
// param em 11 e os reservas seguem até 16 — a esquerda acaba antes e sobra vazio.
//
// ⚠️ As três telas são o `SquadTab` DE VERDADE (bancada `scripts/teste-elenco/`,
// celular 454px, em PT), com cada layout ligado por `?layout=`:
//   …?n=27&layout=hoje | &layout=transbordo | &layout=empilhado
//
// Rodar: node scripts/mockup-buraco-elenco.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-buraco-elenco.png')
const VERM = '#C2452F', ROXO = '#7C3AED', AZUL = '#1F5FA8'
const png = c => `data:image/png;base64,${readFileSync(c).toString('base64')}`

const COLS = [
  { k: 'hoje', alt: 2427, rot: 'COMO ESTÁ AGORA', cor: VERM, tag: 'O BURACO',
    nota: 'Duas colunas <b>fixas</b>. Os titulares param em 11, os reservas vão até 16 — e sobra aquele vazio verde na esquerda.' },
  { k: 'transbordo', alt: 2339, rot: 'SAÍDA 1 · TRANSBORDO', cor: GREEN, tag: 'A QUE EU FARIA',
    nota: 'O reserva que não cabe <b>continua na esquerda</b>, embaixo dos titulares, com um risquinho <b>🔁 RESERVAS (CONTINUA)</b>. As duas colunas terminam juntas.' },
  { k: 'empilhado', alt: 2350, rot: 'SAÍDA 2 · EMPILHADO', cor: AZUL, tag: 'OUTRA OPÇÃO',
    nota: 'Cada lista ocupa a largura toda em 2 colunas próprias: titulares em cima, reservas embaixo. Título maior e mais fácil de ler.' },
]
const coluna = c => `
  <div style="flex:1;text-align:center">
    <div style="display:inline-block;background:${c.cor};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;box-shadow:3px 3px 0 ${INK}">${c.rot}</div>
    <div style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.5px;color:${c.cor};margin:5px 0 7px">${c.tag}</div>
    <img src="${png(`/tmp/lay-27-${c.k}.png`)}" style="width:100%;display:block;border:3px solid ${INK};
      border-radius:13px;box-shadow:4px 4px 0 ${INK}">
    <div style="${OSW};font-weight:700;font-size:13px;margin-top:8px">${c.alt}px · ${(c.alt / 900).toFixed(1)} telas</div>
    ${c.k === 'hoje' ? '' : `<div style="${OSW};font-weight:700;font-size:11.5px;color:${GREEN}">−${2427 - c.alt}px que a de agora</div>`}
    <div style="${OSW};font-weight:400;font-size:12.5px;line-height:1.5;margin-top:7px;text-align:left;opacity:.85">${c.nota}</div>
  </div>`

const lupa = (arq, deTopo, altura, larg) => `
  <div style="width:${larg}px;height:${altura}px;overflow:hidden;border:4px solid ${INK};border-radius:14px;
    box-shadow:5px 5px 0 ${INK};background:#000;flex:none">
    <img src="${png(arq)}" style="width:${larg}px;display:block;margin-top:-${deTopo}px"></div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1280px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  A TELA DE VERDADE · MESMO SquadTab DO JOGO · ELENCO DE 27 · CELULAR DE 454px · NADA NO AR</div>
<h1 style="${OSW};font-weight:700;font-size:42px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  O buraco <span style="color:${VERM}">na esquerda</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.45;margin:0 0 22px;max-width:1080px;opacity:.85">
  Você pegou certo, e a causa é simples: as duas colunas são <b>fixas</b> — titulares de um lado, reservas do
  outro. Com 27, os titulares continuam <b>11</b> e os reservas viram <b>16</b>, então a esquerda acaba antes.
  Fiz as duas saídas e renderizei as três telas pra você comparar olhando.</p>

<div style="display:flex;gap:22px;align-items:flex-start;margin-bottom:26px">${COLS.map(coluna).join('')}</div>

<div style="${OSW};font-weight:700;font-size:22px;text-transform:uppercase;margin:0 0 12px">🔍 De perto: o buraco e o conserto</div>
<div style="display:flex;gap:20px;align-items:center;margin-bottom:24px">
  ${lupa('/tmp/lay-27-hoje.png', 1575, 270, 350)}
  <div style="${OSW};font-weight:700;font-size:30px;color:${GREEN};flex:none">→</div>
  ${lupa('/tmp/lay-27-transbordo.png', 1510, 270, 350)}
  <div style="flex:1;${OSW};font-weight:400;font-size:14px;line-height:1.65">
    À esquerda, o que te incomodou: <b>vazio verde</b> embaixo dos titulares enquanto a outra coluna segue.<br><br>
    À direita, o transbordo: os reservas que sobram <b>descem pra esquerda</b>, com um risquinho pequeno
    <b>🔁 RESERVAS (CONTINUA)</b> pra ninguém se perder. <b>Nada some, nada muda de lugar</b> — o que estava
    na direita continua na direita.</div>
</div>

<div style="border:4px solid ${GREEN};border-radius:18px;background:#EFF7F1;padding:15px 18px;margin-bottom:20px">
  <div style="${OSW};font-weight:700;font-size:18px;text-transform:uppercase;color:${GREEN};margin-bottom:9px">
    ✅ E o que me fez escolher o TRANSBORDO</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    Medi os três <b>no elenco de hoje (22)</b>, que é o que está no ar pra todo mundo:<br>
    <span style="display:inline-block;margin:8px 0 8px 0;background:#fff;border:3px solid ${INK};border-radius:10px;padding:8px 13px">
      como está agora: <b>2152px</b> &nbsp;·&nbsp;
      <span style="color:${GREEN}">transbordo: <b>2152px</b> — <b>IDÊNTICO</b></span> &nbsp;·&nbsp;
      <span style="color:${AZUL}">empilhado: <b>2240px</b> (+88px)</span></span><br>
    O <b>transbordo não muda NADA</b> pra quem tem elenco de 22: com 11 e 11 as colunas já batem, então o
    risquinho <b>nem aparece</b>. Ele só entra em ação quando o elenco cresce — que é exatamente quando o
    buraco existiria.<br>
    O <b>empilhado</b> é bonito e tem título mais legível, <b>mas mexe na tela de todo mundo</b>, inclusive
    de quem nunca vai querer elenco maior. Por isso ele é a segunda opção, não a primeira.</div>
</div>

<div style="border:4px solid ${GOLD};border-radius:18px;background:#FFFBEE;padding:15px 18px">
  <div style="${OSW};font-weight:700;font-size:17px;text-transform:uppercase;margin-bottom:7px">👉 Onde isso deixa a gente</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.65">
    Com o transbordo, o elenco de 27 fica <b>mais curto</b> que o de hoje com 27 (2339 contra 2427) e <b>sem
    buraco nenhum</b>. O buraco deixa de ser motivo pra não fazer o +1 por posição.<br>
    <b>Mas o que eu falei antes continua de pé:</b> o que me faria pensar duas vezes no +1 em TODAS as posições
    não é mais a tela — é o meio-campo virar <b>9</b> (já sobrava com 8) e as <b>5 cartas a mais por técnico</b>
    na mesa do leilão. <b>Isso eu meço antes, se você mandar seguir.</b><br>
    <b>Nada está no ar.</b> Me diz qual dos dois layouts você quer e eu ligo.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:12px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    rascunho de 16/09 · NÃO está no ar<br>refazer: <b>node scripts/mockup-buraco-elenco.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
