// 👥🏢 A TELA DE VERDADE: +1 por posição e a SAF em bloco à parte (Diego 16/09)
//
// Pedido dele: *"e como ficaria real com um jogador a mais por posição a imagem do
// elenco… e a SAF com bloco à parte?"*.
//
// ⚠️ Estas NÃO são telas desenhadas: são o `SquadTab` DE VERDADE, o mesmo componente
// do jogo, rodando com as duas mudanças aplicadas num rascunho local. Renderizadas
// pela bancada `scripts/teste-elenco/` num celular de 454px, em PT.
//   DEPLOY_BASE=/ npx vite --port 5199
//   → /scripts/teste-elenco/index.html?n=22   (hoje)
//   → …?n=27  (+1 por posição)   ·   …?n=31  (27 + os 4 da SAF em bloco)
//
// O rascunho NÃO está commitado — mora em docs/rascunhos/.
//
// Rodar: node scripts/mockup-elenco-real.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-elenco-real.png')
const VERM = '#C2452F', ROXO = '#7C3AED', SLATE = '#3E4A5A'
const png = c => `data:image/png;base64,${readFileSync(c).toString('base64')}`

const COLS = [
  { n: 22, alt: 2152, rot: 'HOJE', sub: 'no ar agora · 2× a formação', cor: INK,
    nota: 'Titulares 11 · Reservas 11. O emprestado da SAF, quando existe, <b>se mistura</b> na lista com um chipzinho cinza.' },
  { n: 27, alt: 2427, rot: '+1 POR POSIÇÃO', sub: 'o caminho A, sem SAF', cor: ROXO,
    nota: 'Titulares 11 · Reservas <b>16</b>. A coluna da direita cresce 5 linhas — e <b>só ela</b>. O campinho não muda.' },
  { n: 31, alt: 2630, rot: '+1 E A SAF EM BLOCO', sub: 'o teto real na Série A', cor: VERM,
    nota: 'Os 4 da SAF <b>saem da lista</b> e viram bloco próprio no pé da tela, com o contador <b>4/4</b> de vagas da divisão.' },
]

const coluna = c => `
  <div style="flex:1;text-align:center">
    <div style="display:inline-block;background:${c.cor};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 15px;${OSW};font-weight:700;font-size:12.5px;letter-spacing:1px;box-shadow:3px 3px 0 ${INK}">${c.rot}</div>
    <div style="${OSW};font-weight:700;font-size:26px;margin-top:7px;line-height:1">${c.n}<span style="font-size:15px;opacity:.6"> na tela</span></div>
    <div style="${OSW};font-weight:400;font-size:11.5px;opacity:.65;margin-bottom:9px">${c.sub}</div>
    <img src="${png(`/tmp/novo-elenco-${c.n}.png`)}" style="width:100%;display:block;border:3px solid ${INK};
      border-radius:13px;box-shadow:4px 4px 0 ${INK}">
    <div style="${OSW};font-weight:700;font-size:12.5px;margin-top:8px">${(c.alt / 900).toFixed(1)} telas de rolagem</div>
    ${c.n === 22 ? '' : `<div style="${OSW};font-weight:700;font-size:11.5px;color:${c.cor}">+${c.alt - 2152}px que hoje</div>`}
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;margin-top:7px;text-align:left;opacity:.85">${c.nota}</div>
  </div>`

// 🔍 lupa no pé da tela de 31 (onde mora o bloco da SAF)
const lupa = (arq, deTopo, altura, larguraImg) => `
  <div style="width:${larguraImg}px;height:${altura}px;overflow:hidden;border:4px solid ${INK};border-radius:14px;
    box-shadow:5px 5px 0 ${INK};background:#000">
    <img src="${png(arq)}" style="width:${larguraImg}px;display:block;margin-top:-${deTopo}px">
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1280px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  A TELA DE VERDADE · O MESMO SquadTab DO JOGO · CELULAR DE 454px · RASCUNHO, NÃO ESTÁ NO AR</div>
<h1 style="${OSW};font-weight:700;font-size:42px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  +1 por posição <span style="color:${ROXO}">e a SAF em bloco</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.45;margin:0 0 20px;max-width:1080px;opacity:.85">
  Não é desenho: liguei as duas mudanças num rascunho e mandei renderizar a <b>aba Elenco de verdade</b>,
  com 22, 27 e 31. É exatamente assim que ficaria no seu celular.</p>

<div style="display:flex;gap:22px;align-items:flex-start;margin-bottom:26px">${COLS.map(coluna).join('')}</div>

<div style="${OSW};font-weight:700;font-size:22px;text-transform:uppercase;margin:0 0 12px">🔍 O bloco da SAF de perto</div>
<div style="display:flex;gap:24px;align-items:center;margin-bottom:24px">
  ${lupa('/tmp/novo-elenco-31.png', 2205, 195, 430)}
  <div style="flex:1;${OSW};font-weight:400;font-size:14px;line-height:1.65">
    <b>Cinza-ardósia de propósito.</b> Cor é sagrada dos tiers no seu jogo, então o emprestado
    <b>não empresta cor de ninguém</b> — ele tem a cor neutra que a marca 🔄 EMP já usa hoje.<br><br>
    <b>O contador 4/4</b> é a vaga da sua divisão (Série D 1 · C 2 · B 3 · A 4). Você bate o olho e sabe
    quantas ainda tem.<br><br>
    <b>E a frase embaixo resolve a dúvida que sempre vem:</b> <i>"eles jogam por você, mas são da sua SAF —
    não ocupam vaga do seu elenco, e você devolve quando quiser"</i>.<br><br>
    <b>Duas colunas</b>, igual ao resto da tela: 4 emprestados custam <b>2 linhas</b>, não 4.</div>
</div>

<div style="display:flex;gap:20px;align-items:stretch;margin-bottom:22px">
  <div style="flex:1;border:4px solid ${GREEN};border-radius:16px;background:#EFF7F1;padding:13px 16px">
    <div style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;color:${GREEN};margin-bottom:8px">✅ O que a tela mostra</div>
    <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.6">
      · <b>O campinho não muda em nada</b> — são sempre os 11 da formação. Todo o crescimento é na lista.<br>
      · <b>Só a coluna da direita cresce</b>: os reservas vão de 11 pra 16. Os titulares ficam 11.<br>
      · <b>+275px</b> no caminho A e <b>+478px</b> com a SAF junto — de 2,4 pra 2,7 e 2,9 telas.<br>
      · Tirar os emprestados da lista e pôr no bloco deixa a coluna de reservas <b>mais curta</b> do que
      se eles ficassem misturados.</div>
  </div>
  <div style="flex:1;border:4px solid ${VERM};border-radius:16px;background:#FDF1EE;padding:13px 16px">
    <div style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;color:${VERM};margin-bottom:8px">⚠️ O que a tela NÃO mostra</div>
    <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.6">
      O caminho A mexe na régua <b>"2× a formação"</b>, e ela não é só do elenco: o <b>leilão</b> usa pra saber
      quantas cartas pôr na mesa, o <b>Monte</b> pra ordenar quem escolhe, a <b>base</b> pra saber se cabe guri.<br><br>
      Na tela custa 5 linhas. <b>No jogo custa 5 cartas a mais por técnico na mesa do leilão</b> e uma folha
      salarial maior. Isso eu <b>meço antes</b> se você mandar seguir — não chuto.</div>
  </div>
</div>

<div style="border:4px solid ${GOLD};border-radius:18px;background:#FFFBEE;padding:15px 18px">
  <div style="${OSW};font-weight:700;font-size:17px;text-transform:uppercase;margin-bottom:7px">👉 Olhando as três lado a lado</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.65">
    <b>O bloco da SAF eu faria já</b> — ele melhora a tela <b>mesmo sem mexer no tamanho do elenco</b>, porque
    hoje o emprestado se perde no meio dos reservas. É leitura de tela, não muda regra nenhuma.<br>
    <b>O +1 por posição</b> também cabe, como dá pra ver. A pergunta que sobra não é a tela — é se você quer
    o meio-campo com <b>9</b> (já sobrava com 8) só pra ganhar o terceiro goleiro junto.
    <b>Nada está no ar</b>: reverter é não aplicar o rascunho.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:12px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    rascunho de 16/09 · NÃO está no ar<br>refazer: <b>node scripts/mockup-elenco-real.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
