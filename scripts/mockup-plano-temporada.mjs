// 🎲 MOCKUP — "e se a aposta do Pontual e o preço da camisa virassem UMA decisão só?"
//
// Ideia do Diego (15/09): *"o cara que escolher o patrocínio pontual já decide de uma
// vez entre o valor que ele ganharia e também a venda de camisa — são duas coisas em
// uma, porque têm o mesmo sentido de aposta, ou não têm?"*.
//
// A resposta curta é: TÊM o mesmo sentido, mas NÃO têm o mesmo formato de risco — e é
// por isso que este mockup mostra DUAS versões lado a lado, pra ele escolher vendo:
//   · OPÇÃO A (grudado): um toque só. O objetivo escolhe o patrocínio E o preço.
//   · OPÇÃO B (junto, mas dá pra separar): mesma tela e mesmo toque, só que o preço
//     entra JÁ MARCADO pelo objetivo e pode ser trocado por quem quiser proteger.
//
// ⚠️ Os números da tela são os de VERDADE: régua do Pontual (`SPONSOR_BET_PAY`, Série
// C = 14/22/30) e a conta da loja (`calculaVendas` com torcida de 24.300, obras +10%
// e Pumba +30%). Mockup com número chutado vira promessa que o jogo não paga.
//
// Rodar: node scripts/mockup-plano-temporada.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { camisa, escudoBase, vitrine, CAMISA_TIER, LOGO_REIDASTINTAS, FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-plano-temporada.png')
const VERM = '#C2452F', ROXO = '#7C3AED'

// ── os 3 objetivos, com o que cada um puxa junto ────────────────────────────
// pontual = régua real da Série C · loja = moedas reais daquele preço em cada faixa
const METAS = [
  { k: 'manteve', emoji: '🛡️', nome: 'NÃO CAIR',  sub: '5º ao 16º', cor: GREEN, pontual: 14, preco: 'POPULAR', moeda: 1, loja: 14, se: 'seguro: a camisa barata vende igual em ano morno' },
  { k: 'acesso',  emoji: '📈', nome: 'ACESSO',    sub: '2º ao 4º',  cor: '#B8860B', pontual: 22, preco: 'NORMAL', moeda: 2, loja: 20, se: 'meio-termo: vende bem e rende bem' },
  { k: 'campeao', emoji: '👑', nome: 'CAMPEÃO',   sub: '1º lugar',  cor: VERM, pontual: 30, preco: 'CARA',    moeda: 3, loja: 25, se: 'ousado: camisa cara só vende se o time for bem' },
]

const CAMISA = camisa({
  arte: CAMISA_TIER, alt: 132,
  escudo: escudoBase({ letra: 'F', c1: '#2E9E5B', c2: '#14612F', size: 15 }),
  fornecedor: 'Pumba', fornSimbolo: '🐆', master: '', masterLogo: LOGO_REIDASTINTAS,
  masterW: 0.17, masterH: 0.13, masterCor: '#4F462E',
  pos: { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 },
})

// uma pílula de objetivo (a espinha das duas opções)
const metaBtn = (m, ativo) => `
  <button style="flex:1;border:3px solid ${INK};border-radius:12px;padding:7px 4px 6px;cursor:pointer;
    background:${ativo ? GOLD : '#fff'};box-shadow:${ativo ? `3px 3px 0 ${INK}` : 'none'};
    display:flex;flex-direction:column;align-items:center;gap:1px;${ativo ? '' : 'opacity:.62'}">
    <span style="font-size:19px;line-height:1">${m.emoji}</span>
    <span style="${OSW};font-weight:700;font-size:11px;letter-spacing:-.2px">${m.nome}</span>
    <span style="${OSW};font-weight:400;font-size:8.5px;opacity:.7">${m.sub}</span>
  </button>`

// a linha de um ganho (patrocínio / camisa) dentro do papel
const linha = (ic, titulo, corpo, valor, cor) => `
  <div style="display:flex;gap:8px;align-items:flex-start;padding:7px 0">
    <span style="font-size:17px;line-height:1.05;flex:none">${ic}</span>
    <div style="flex:1;min-width:0">
      <div style="${OSW};font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:.3px">${titulo}</div>
      <div style="${OSW};font-weight:400;font-size:9.5px;line-height:1.3;opacity:.75;margin-top:1px">${corpo}</div>
    </div>
    <div style="${OSW};font-weight:700;font-size:15px;color:${cor};white-space:nowrap;flex:none;line-height:1.1">${valor}</div>
  </div>`

// o mini-seletor de preço que SÓ a opção B tem
const trocaPreco = (sel) => `
  <div style="border-top:2px dashed rgba(12,12,12,.22);margin-top:4px;padding-top:7px">
    <div style="${OSW};font-weight:400;font-size:9px;opacity:.7;margin-bottom:5px">
      quer proteger a loja? troque só o preço:</div>
    <div style="display:flex;gap:5px">
      ${['POPULAR', 'NORMAL', 'CARA'].map((p, i) => `
        <button style="flex:1;border:2.5px solid ${INK};border-radius:9px;padding:4px 2px;cursor:pointer;
          background:${p === sel ? GOLD : CREME};box-shadow:${p === sel ? `2px 2px 0 ${INK}` : 'none'};
          ${OSW};font-weight:700;font-size:9.5px">${p} · ${i + 1}🪙</button>`).join('')}
    </div>
  </div>`

// ── um "celular" com a tela proposta ────────────────────────────────────────
const tela = ({ etiqueta, etiquetaCor, titulo, lead, opcaoB }) => {
  const m = METAS[2] // 👑 campeão marcado, que é o caso que mostra melhor a diferença
  return `
  <div style="flex:none;width:430px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
      <span style="background:${etiquetaCor};color:#fff;border:3px solid ${INK};border-radius:999px;
        padding:5px 14px;${OSW};font-weight:700;font-size:13px;letter-spacing:1.2px;box-shadow:3px 3px 0 ${INK}">${etiqueta}</span>
      <span style="${OSW};font-weight:400;font-size:13px;opacity:.78">${titulo}</span>
    </div>
    <div style="border:4px solid ${INK};border-radius:20px;background:${CREME};box-shadow:5px 5px 0 ${INK};
                padding:13px 13px 15px">

      <div style="${OSW};font-weight:400;font-size:9.5px;letter-spacing:2px;opacity:.65">SÉRIE C · TEMPORADA 7</div>
      <div style="${OSW};font-weight:700;font-size:23px;line-height:1;text-transform:uppercase;margin:2px 0 3px">
        O plano da temporada</div>
      <div style="${OSW};font-weight:400;font-size:10.5px;line-height:1.35;opacity:.75;margin-bottom:9px">${lead}</div>

      <div style="display:flex;gap:6px;margin-bottom:10px">${METAS.map(x => metaBtn(x, x.k === m.k)).join('')}</div>

      <div style="display:flex;gap:10px;align-items:flex-start">
        <div style="flex:none;width:126px">${vitrine(CAMISA)}</div>
        <div style="flex:1;min-width:0;border:3px solid ${INK};border-radius:13px;background:#fff;
                    box-shadow:3px 3px 0 ${INK};padding:3px 10px 9px">
          ${linha('🤝', 'Patrocinador Pontual', 'Vadico Veículos — só se for campeão', '+30', VERM)}
          <div style="height:2px;background:rgba(12,12,12,.12)"></div>
          ${linha('👕', `Camisa ${m.preco} · ${m.moeda}🪙`, m.se, '~25', GREEN)}
          ${opcaoB ? trocaPreco('CARA') : `
          <div style="border-top:2px dashed rgba(12,12,12,.22);margin-top:4px;padding-top:7px;
                      ${OSW};font-weight:400;font-size:9px;line-height:1.35;opacity:.7">
            o preço da camisa vem junto do objetivo — não tem o que escolher aqui.</div>`}
        </div>
      </div>

      <button style="width:100%;margin-top:11px;border:3px solid ${INK};border-radius:13px;background:${GOLD};
        box-shadow:4px 4px 0 ${INK};padding:11px 0;${OSW};font-weight:700;font-size:15px;
        text-transform:uppercase;letter-spacing:.6px;cursor:pointer">✍️ Assinar o plano</button>
      <div style="${OSW};font-weight:400;font-size:9px;opacity:.6;text-align:center;margin-top:5px">
        o patrocínio cai no fim da temporada · a venda da loja abre a temporada seguinte</div>
    </div>
  </div>`
}

// ── a tabelinha honesta do fim (o custo de cada opção) ──────────────────────
const cel = (txt, o = {}) => `<td style="${OSW};font-weight:${o.b ? 700 : 400};font-size:${o.fs || 13}px;
  padding:8px 12px;border-bottom:2px solid rgba(12,12,12,.12);color:${o.c || INK};${o.al ? `text-align:${o.al}` : ''}">${txt}</td>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 36px 30px;width:1000px}
</style>
<div style="${OSW};font-weight:700;font-size:13px;letter-spacing:2.4px;opacity:.6">MOCKUP · MODO CARREIRA</div>
<h1 style="${OSW};font-weight:700;font-size:40px;line-height:1;text-transform:uppercase;margin:4px 0 6px">
  Uma aposta só: patrocínio + camisa</h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.4;margin:0 0 22px;max-width:900px;opacity:.8">
  Hoje são <b>duas telas</b> na virada (o Pontual e o preço da camisa) perguntando a mesma coisa:
  <b>como vai ser a sua temporada?</b> As duas viram <b>uma tela só</b>. A diferença entre as opções
  é se o preço da camisa ainda pode ser mexido depois de escolher o objetivo.</p>

<div style="display:flex;gap:26px;align-items:flex-start">
  ${tela({
    etiqueta: 'OPÇÃO A', etiquetaCor: VERM, titulo: 'tudo grudado — 1 toque',
    lead: 'Escolha o objetivo. O patrocínio e o preço da camisa vão atrás dele.',
    opcaoB: false,
  })}
  ${tela({
    etiqueta: 'OPÇÃO B', etiquetaCor: ROXO, titulo: 'junto, mas dá pra separar',
    lead: 'Escolha o objetivo. O preço da camisa já vem marcado — e dá pra trocar.',
    opcaoB: true,
  })}
</div>

<div style="margin-top:26px;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
  <div style="background:${INK};color:${GOLD};${OSW};font-weight:700;font-size:15px;letter-spacing:1.4px;
              padding:10px 14px;text-transform:uppercase">🎯 apostei em CAMPEÃO e terminei em 10º — quanto entra (Série C)</div>
  <table style="width:100%;border-collapse:collapse">
    <tr style="background:rgba(12,12,12,.05)">
      ${cel('', { b: 1, fs: 12 })}${cel('🤝 PATROCÍNIO', { b: 1, fs: 12, al: 'right' })}${cel('👕 CAMISA', { b: 1, fs: 12, al: 'right' })}${cel('TOTAL', { b: 1, fs: 12, al: 'right' })}${cel('', { fs: 12 })}
    </tr>
    <tr>${cel('<b>Opção A</b> — camisa cara obrigada pelo objetivo')}${cel('0', { b: 1, al: 'right', c: VERM })}${cel('6', { b: 1, al: 'right', c: VERM })}${cel('6', { b: 1, al: 'right', fs: 17, c: VERM })}${cel('errou a aposta e a loja afundou junto', { fs: 11.5 })}</tr>
    <tr>${cel('<b>Opção B</b> — mesmo objetivo, camisa trocada pra popular')}${cel('0', { b: 1, al: 'right', c: VERM })}${cel('14', { b: 1, al: 'right', c: GREEN })}${cel('14', { b: 1, al: 'right', fs: 17, c: GREEN })}${cel('a loja segurou o tombo — foi escolha dele', { fs: 11.5 })}</tr>
    <tr>${cel('<b>Hoje</b> (2 telas) — mesmo jogador, mesma jogada')}${cel('0', { b: 1, al: 'right', c: VERM })}${cel('14', { b: 1, al: 'right', c: GREEN })}${cel('14', { b: 1, al: 'right', fs: 17, c: GREEN })}${cel('igual à opção B, só que em 2 telas', { fs: 11.5 })}</tr>
  </table>
  <div style="padding:11px 14px;${OSW};font-weight:400;font-size:12.5px;line-height:1.45;opacity:.82">
    👉 A <b>opção B</b> é a mesma economia de hoje em <b>uma tela só</b>: quem não quiser pensar toca no objetivo
    e assina (1 toque, igual à A); quem quiser proteger a loja troca o preço (2 toques). A <b>opção A</b> é mais
    limpa, mas transforma um ano ruim em <b>castigo dobrado</b> — e tira as 9 combinações do jogo, deixando 3.</div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
// 📏 altura pequena de propósito: `fullPage` usa o MAIOR entre o conteúdo e a janela,
// então janela alta deixa faixa creme vazia embaixo do mockup.
const p = await b.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
