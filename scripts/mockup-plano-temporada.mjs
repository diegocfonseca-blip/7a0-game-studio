// 🎲 MOCKUP — "e se o 🤝 PATROCINADOR PONTUAL e a 🛍️ VENDA DE CAMISAS virassem UMA
// decisão só?"
//
// Ideia do Diego (15/09): *"o cara que escolher o patrocínio pontual já decide de uma
// vez entre o valor que ele ganharia e também a venda de camisa — são duas coisas em
// uma, porque têm o mesmo sentido de aposta, ou não têm?"*.
//
// ⚠️ REFEITO depois do 1º corte: *"não gostei, não ficou claro que era patrocinador
// pontual e venda de camisas"*. O erro foi meu — desenhei a tela nova com o nome
// genérico ("O PLANO DA TEMPORADA") e metas soltas, e aí ninguém sabia qual metade era
// o patrocínio e qual era a camisa. Agora:
//   · as DUAS aparecem pelo NOME, com o ícone delas, em toda caixa onde entram;
//   · primeiro o "como é HOJE" (as 2 telas separadas, cada uma com o seu nome);
//   · depois a proposta, em COLUNAS: cada meta mostra, empilhado, o que ela fecha no
//     🤝 Pontual E o que ela fecha na 🛍️ camisa;
//   · a escolha A × B virou UMA linha destacada, em vez de duas telas quase iguais.
//
// ⚠️ Os números são os de VERDADE: régua do Pontual (`SPONSOR_BET_PAY`, Série C =
// 14/22/30) e a conta da loja (`calculaVendas` com torcida 24.300, obras +10% e
// fornecedor Pumba +30%). Mockup com número chutado vira promessa que o jogo não paga.
//
// Rodar: node scripts/mockup-plano-temporada.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { camisa, vitrine, img, LOGO_VADICO, FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-plano-temporada.png')
const VERM = '#C2452F', ROXO = '#7C3AED', AZUL = '#0E3E86'

// as 3 metas — e o que cada uma fecha nas DUAS pontas.
// 🏷️ `marcas` = as 3 PROPOSTAS daquele nível, exatamente como em `SPONSOR_BRANDS`
// (`estadiodata.ts`). Cobrança dele (15/09): *"não estão aparecendo os patrocinadores
// pra escolher — essa é a questão do mockup que você fez aí do Pontual"*. No jogo o
// Pontual são DOIS toques (a meta E a marca), e o mockup tinha comido o segundo.
// Todas as marcas do mesmo nível pagam IGUAL — a marca é identidade, não valor.
const METAS = [
  {
    emoji: '🛡️', nome: 'NÃO CAIR', sub: '5º ao 16º', pontual: 14, preco: 'POPULAR', moeda: 1, loja: 14, marcada: false,
    marcas: [{ e: '🥖', n: 'Padaria do Zé' }, { e: '🥩', n: 'Açougue Bom Corte' }, { e: '💍', n: 'Max Joias', logo: 'src/escalacao/img/patro-maxjoias.webp' }],
  },
  {
    emoji: '📈', nome: 'ACESSO', sub: '2º ao 4º', pontual: 22, preco: 'NORMAL', moeda: 2, loja: 20, marcada: false,
    marcas: [{ e: '🍗', n: 'Espetinho do Baixinho' }, { e: '🎨', n: 'Rei das Tintas', logo: 'src/escalacao/img/patro-reidastintas.webp' }, { e: '🥤', n: 'Guaraná Craque' }],
  },
  {
    emoji: '👑', nome: 'CAMPEÃO', sub: '1º lugar', pontual: 30, preco: 'CARA', moeda: 3, loja: 25, marcada: true,
    marcas: [{ e: '🚗', n: 'Vadico Veículos', logo: 'src/escalacao/img/patro-vadico-alfa.webp' }, { e: '🦷', n: 'ERO Odontologia', logo: 'src/escalacao/img/patro-ero-alfa.webp' }, { e: '💎', n: 'Diamante Joias' }],
  },
]
const META_SEL = METAS.find(m => m.marcada)

// 👕 a camisa do Final Boss (arte de batismo de verdade, com a Vadico na barriga e o
// fornecedor no peito direito) — a mesma que ele aprovou no reels.
const CAMISA = camisa({
  arte: img('public/mantos-salao/finalboss-camisa.webp'), alt: 150, escudo: '',
  fornecedor: 'Naique', fornSimbolo: '✓', master: '', masterLogo: LOGO_VADICO,
  masterW: 0.22, masterH: 0.155, masterCor: INK,
  pos: { fornX: 30, fornY: 27, masterX: 50, masterY: 58 },
})

// ── o cabeçalho PRETO que dá nome a uma das duas coisas ─────────────────────
const nomeDaCoisa = (ic, nome, cor) => `
  <div style="background:${INK};color:#fff;padding:7px 12px;display:flex;align-items:center;gap:8px">
    <span style="font-size:17px;line-height:1">${ic}</span>
    <span style="${OSW};font-weight:700;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:${cor}">${nome}</span>
  </div>`

// ── COMO É HOJE: uma das duas telas de virada ───────────────────────────────
const telaHoje = ({ ic, nome, cor, tela, pergunta, itens, extra = '', pe }) => `
  <div style="flex:1;min-width:0">
    <div style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.6px;opacity:.55;margin-bottom:5px">${tela}</div>
    <div style="border:4px solid ${INK};border-radius:16px;overflow:hidden;background:${CREME};box-shadow:4px 4px 0 ${INK}">
      ${nomeDaCoisa(ic, nome, cor)}
      <div style="padding:10px 12px 12px">
        <div style="${OSW};font-weight:700;font-size:16px;text-transform:uppercase;margin-bottom:8px">${pergunta}</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${itens.map(i => `
            <div style="display:flex;align-items:center;gap:8px;border:3px solid ${INK};border-radius:10px;
                        background:#fff;padding:6px 10px">
              <span style="font-size:16px;line-height:1;flex:none">${i.ic}</span>
              <span style="${OSW};font-weight:700;font-size:12.5px;text-transform:uppercase;flex:1;text-align:left">${i.t}</span>
              <span style="${OSW};font-weight:700;font-size:15px;color:${cor};white-space:nowrap">${i.v}</span>
            </div>`).join('')}
        </div>
        ${extra}
        <div style="${OSW};font-weight:400;font-size:10px;opacity:.7;margin-top:8px;line-height:1.3">${pe}</div>
      </div>
    </div>
  </div>`

// ── A PROPOSTA: uma coluna por meta, com as DUAS pontas empilhadas ──────────
const coluna = (m) => `
  <div style="flex:1;border:4px solid ${INK};border-radius:16px;overflow:hidden;
              background:${m.marcada ? GOLD : '#fff'};box-shadow:${m.marcada ? `4px 4px 0 ${INK}` : 'none'};
              ${m.marcada ? '' : 'opacity:.6'}">
    <div style="padding:9px 6px 8px;text-align:center;border-bottom:4px solid ${INK}">
      <div style="font-size:26px;line-height:1">${m.emoji}</div>
      <div style="${OSW};font-weight:700;font-size:14px;text-transform:uppercase;margin-top:2px;letter-spacing:-.2px">${m.nome}</div>
      <div style="${OSW};font-weight:400;font-size:10px;opacity:.72">${m.sub}</div>
    </div>
    <div style="padding:8px 8px 7px;text-align:center;background:rgba(255,255,255,.55);border-bottom:2px dashed rgba(12,12,12,.3)">
      <div style="${OSW};font-weight:700;font-size:9.5px;letter-spacing:.5px;color:${VERM};text-transform:uppercase">🤝 Patrocinador Pontual</div>
      <div style="${OSW};font-weight:700;font-size:26px;line-height:1.05;margin-top:1px">+${m.pontual} 🪙</div>
      <div style="${OSW};font-weight:400;font-size:9.5px;opacity:.7">se bater a meta</div>
    </div>
    <div style="padding:8px 8px 9px;text-align:center;background:rgba(255,255,255,.55)">
      <div style="${OSW};font-weight:700;font-size:9.5px;letter-spacing:.5px;color:${GREEN};text-transform:uppercase">🛍️ Venda de camisas</div>
      <div style="${OSW};font-weight:700;font-size:16px;line-height:1.1;margin-top:2px">${m.preco} · ${m.moeda} 🪙</div>
      <div style="${OSW};font-weight:700;font-size:20px;color:${GREEN};line-height:1.1">~${m.loja} 🪙</div>
      <div style="${OSW};font-weight:400;font-size:9.5px;opacity:.7">se bater a meta</div>
    </div>
  </div>`

// ── 🏷️ uma PROPOSTA de patrocinador (a marca) ──────────────────────────────
// No jogo a marca é só IDENTIDADE: as 3 do mesmo nível pagam igual. Por isso o cartão
// mostra logo/emoji e nome, e repete o valor da meta embaixo — pra ninguém procurar
// diferença de dinheiro entre elas.
const cartaoMarca = (m, valor, sel) => `
  <div style="flex:1;border:3px solid ${INK};border-radius:13px;padding:9px 8px 8px;text-align:center;
              background:${sel ? GOLD : '#fff'};box-shadow:${sel ? `3px 3px 0 ${INK}` : 'none'};${sel ? '' : 'opacity:.85'}">
    <div style="height:38px;display:flex;align-items:center;justify-content:center">
      ${m.logo
        ? `<img src="${img(m.logo)}" style="max-height:36px;max-width:112px;width:auto;display:block">`
        : `<span style="font-size:30px;line-height:1">${m.e}</span>`}
    </div>
    <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase;line-height:1.1;margin-top:5px">${m.n}</div>
    <div style="${OSW};font-weight:700;font-size:13px;color:${VERM};margin-top:3px">+${valor} 🪙</div>
    <div style="${OSW};font-weight:400;font-size:9px;opacity:.65;margin-top:1px">${sel ? 'proposta escolhida' : 'mesma meta, mesmo valor'}</div>
  </div>`

// ── o rótulo de PASSO (1 · 2 · 3) ──────────────────────────────────────────
const passo = (n, txt, cor = INK) => `
  <div style="display:flex;align-items:center;gap:8px;margin:0 0 8px">
    <span style="flex:none;width:26px;height:26px;border:3px solid ${INK};border-radius:8px;background:${cor};
      color:${cor === INK ? GOLD : '#fff'};display:flex;align-items:center;justify-content:center;
      ${OSW};font-weight:700;font-size:14px">${n}</span>
    <span style="${OSW};font-weight:700;font-size:13.5px;text-transform:uppercase;letter-spacing:.4px">${txt}</span>
  </div>`

const cel = (txt, o = {}) => `<td style="${OSW};font-weight:${o.b ? 700 : 400};font-size:${o.fs || 13}px;
  padding:8px 12px;border-bottom:2px solid rgba(12,12,12,.12);color:${o.c || INK};${o.al ? `text-align:${o.al}` : ''}">${txt}</td>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:32px 36px 28px;width:1000px}
</style>

<div style="${OSW};font-weight:700;font-size:12px;letter-spacing:2.4px;opacity:.6">MOCKUP · MODO CARREIRA · PROPOSTA</div>
<h1 style="${OSW};font-weight:700;font-size:36px;line-height:1.02;text-transform:uppercase;margin:4px 0 6px">
  🤝 Patrocinador Pontual <span style="color:${VERM}">+</span> 🛍️ Venda de camisas<br>viram <span style="color:${ROXO}">uma decisão só</span>?</h1>
<p style="${OSW};font-weight:400;font-size:14.5px;line-height:1.4;margin:0 0 20px;max-width:900px;opacity:.82">
  As duas perguntam a MESMA coisa antes da temporada: <b>como vai ser o seu ano?</b>
  Hoje elas pedem isso em <b>duas telas separadas</b>. Aqui está como ficaria numa só.</p>

<!-- ───────────── COMO É HOJE ───────────── -->
<div style="border:4px solid ${INK};border-radius:18px;background:rgba(12,12,12,.045);box-shadow:4px 4px 0 ${INK};padding:14px 16px 16px">
  <div style="${OSW};font-weight:700;font-size:15px;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:11px">
    ⏱️ Como é HOJE · duas telas na virada</div>
  <div style="display:flex;gap:14px;align-items:stretch">
    ${telaHoje({
      ic: '🤝', nome: 'Patrocinador Pontual', cor: '#FF9A8A', tela: 'TELA 1',
      pergunta: '1️⃣ Qual a sua meta?',
      itens: [
        { ic: '🛡️', t: 'Não cair', v: '+14' },
        { ic: '📈', t: 'Acesso', v: '+22' },
        { ic: '👑', t: 'Campeão', v: '+30' },
      ],
      // 🏷️ o SEGUNDO toque do Pontual, que o 1º mockup tinha esquecido
      extra: `
        <div style="${OSW};font-weight:700;font-size:13px;text-transform:uppercase;margin:9px 0 6px">
          2️⃣ E qual marca patrocina?</div>
        <div style="display:flex;gap:5px">
          ${META_SEL.marcas.map((m, i) => `
            <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;background:${i === 0 ? GOLD : '#fff'};
                        box-shadow:${i === 0 ? `2px 2px 0 ${INK}` : 'none'};padding:5px 3px;text-align:center;${i === 0 ? '' : 'opacity:.6'}">
              <div style="font-size:16px;line-height:1">${m.e}</div>
              <div style="${OSW};font-weight:700;font-size:8.5px;text-transform:uppercase;line-height:1.1;margin-top:2px">${m.n}</div>
            </div>`).join('')}
        </div>
        <div style="${OSW};font-weight:400;font-size:9.5px;opacity:.65;margin-top:5px">
          3 propostas por meta · todas pagam igual (a marca é identidade)</div>`,
      pe: 'Bateu a meta, leva. Não bateu, leva zero. <b>Tudo ou nada.</b>',
    })}
    <div style="${OSW};font-weight:700;font-size:44px;align-self:center;opacity:.3;flex:none">+</div>
    ${telaHoje({
      ic: '🛍️', nome: 'Venda de camisas', cor: '#8FE3AC', tela: 'TELA 2',
      pergunta: '1️⃣ Qual o preço da camisa?',
      itens: [
        { ic: '🪙', t: 'Popular · 1', v: '~14' },
        { ic: '🪙', t: 'Normal · 2', v: '~20' },
        { ic: '🪙', t: 'Cara · 3', v: '~25' },
      ],
      pe: 'Todo final paga alguma coisa — o preço só muda <b>o quanto</b>.',
    })}
  </div>
</div>

<div style="text-align:center;${OSW};font-weight:700;font-size:34px;margin:10px 0 4px;opacity:.5">⬇</div>

<!-- ───────────── A PROPOSTA ───────────── -->
<div style="border:4px solid ${INK};border-radius:18px;background:${CREME};box-shadow:5px 5px 0 ${INK};padding:15px 17px 17px">
  <div style="${OSW};font-weight:700;font-size:15px;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:3px">
    ✨ A proposta · <span style="color:${ROXO}">uma tela só</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;opacity:.75;margin-bottom:13px">
    Continua tendo a escolha da <b>marca</b>, igual hoje. O que some é a tela extra do preço da camisa.</div>

  ${passo(1, 'A meta — ela fecha o 🤝 patrocínio E a 🛍️ camisa')}
  <div style="display:flex;gap:10px;align-items:stretch">${METAS.map(coluna).join('')}</div>

  <div style="margin-top:14px">${passo(2, 'A marca que patrocina · 3 propostas do 👑 campeão', VERM)}</div>
  <div style="display:flex;gap:10px;align-items:stretch">
    ${META_SEL.marcas.map((m, i) => cartaoMarca(m, META_SEL.pontual, i === 0)).join('')}
  </div>
  <div style="${OSW};font-weight:400;font-size:10.5px;opacity:.7;margin-top:6px">
    Trocou a meta lá em cima, trocam as 3 propostas aqui — exatamente como já funciona hoje.</div>

  <div style="margin-top:14px">${passo(3, 'Só na opção B: mexer no preço da camisa', ROXO)}</div>

  <!-- a linha que separa a opção A da B -->
  <div style="display:flex;gap:12px;align-items:center;margin-top:12px;border:4px dashed ${ROXO};border-radius:14px;
              background:#F6F0FF;padding:10px 13px">
    <div style="flex:1;min-width:0">
      <div style="${OSW};font-weight:700;font-size:12.5px;text-transform:uppercase;color:${ROXO};margin-bottom:5px">
        👇 esta linha é a ÚNICA diferença entre as duas versões</div>
      <div style="${OSW};font-weight:400;font-size:11px;opacity:.8;margin-bottom:6px">
        “quer proteger a loja? troque só o preço da camisa:”</div>
      <div style="display:flex;gap:6px">
        ${['POPULAR · 1🪙', 'NORMAL · 2🪙', 'CARA · 3🪙'].map((p, i) => `
          <div style="border:2.5px solid ${INK};border-radius:9px;padding:4px 10px;${OSW};font-weight:700;font-size:10.5px;
            background:${i === 2 ? GOLD : '#fff'};box-shadow:${i === 2 ? `2px 2px 0 ${INK}` : 'none'}">${p}</div>`).join('')}
      </div>
    </div>
    <div style="flex:none;width:250px;display:flex;flex-direction:column;gap:5px">
      <div style="border:3px solid ${VERM};border-radius:10px;background:#fff;padding:5px 9px">
        <b style="${OSW};font-weight:700;font-size:11.5px;color:${VERM}">OPÇÃO A — sem a linha</b>
        <div style="${OSW};font-weight:400;font-size:10px;opacity:.8;line-height:1.25">a meta manda em tudo. 1 toque.</div>
      </div>
      <div style="border:3px solid ${ROXO};border-radius:10px;background:#fff;padding:5px 9px">
        <b style="${OSW};font-weight:700;font-size:11.5px;color:${ROXO}">OPÇÃO B — com a linha ⭐</b>
        <div style="${OSW};font-weight:400;font-size:10px;opacity:.8;line-height:1.25">dá pra trocar só a camisa. 2 toques.</div>
      </div>
    </div>
  </div>

  <div style="display:flex;gap:13px;align-items:center;margin-top:12px">
    <div style="flex:none;width:120px">${vitrine(CAMISA)}</div>
    <div style="flex:1">
      <div style="border:3px solid ${INK};border-radius:13px;background:${GOLD};box-shadow:3px 3px 0 ${INK};
                  padding:11px 0;text-align:center;${OSW};font-weight:700;font-size:17px;text-transform:uppercase">
        ✍️ Assinar o plano da temporada</div>
      <div style="${OSW};font-weight:400;font-size:10.5px;opacity:.72;margin-top:6px;line-height:1.35;text-align:center">
        🤝 o patrocínio cai no <b>fim</b> da temporada · 🛍️ a venda da loja abre a <b>temporada seguinte</b></div>
    </div>
  </div>
</div>

<!-- ───────────── a conta honesta ───────────── -->
<div style="margin-top:20px;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
  <div style="background:${INK};color:${GOLD};${OSW};font-weight:700;font-size:14.5px;letter-spacing:1.2px;
              padding:10px 14px;text-transform:uppercase">🎯 o que muda no bolso: apostei 👑 CAMPEÃO e terminei em 10º (Série C)</div>
  <table style="width:100%;border-collapse:collapse">
    <tr style="background:rgba(12,12,12,.05)">
      ${cel('', { b: 1, fs: 12 })}${cel('🤝 PONTUAL', { b: 1, fs: 12, al: 'right' })}${cel('🛍️ CAMISAS', { b: 1, fs: 12, al: 'right' })}${cel('TOTAL', { b: 1, fs: 12, al: 'right' })}${cel('', { fs: 12 })}
    </tr>
    <tr>${cel('<b style="color:' + VERM + '">Opção A</b> — a camisa cara veio junto da meta')}${cel('0', { b: 1, al: 'right', c: VERM })}${cel('6', { b: 1, al: 'right', c: VERM })}${cel('6', { b: 1, al: 'right', fs: 17, c: VERM })}${cel('errou a meta e a loja afundou junto', { fs: 11.5 })}</tr>
    <tr>${cel('<b style="color:' + ROXO + '">Opção B</b> — mesma meta, camisa trocada pra popular')}${cel('0', { b: 1, al: 'right', c: VERM })}${cel('14', { b: 1, al: 'right', c: GREEN })}${cel('14', { b: 1, al: 'right', fs: 17, c: GREEN })}${cel('a loja segurou o tombo — foi escolha dele', { fs: 11.5 })}</tr>
    <tr>${cel('<b>Hoje</b> (2 telas) — mesmo jogador, mesma jogada')}${cel('0', { b: 1, al: 'right', c: VERM })}${cel('14', { b: 1, al: 'right', c: GREEN })}${cel('14', { b: 1, al: 'right', fs: 17, c: GREEN })}${cel('igual à opção B, só que em 2 telas', { fs: 11.5 })}</tr>
  </table>
  <div style="padding:11px 14px;${OSW};font-weight:400;font-size:12.5px;line-height:1.45;opacity:.85">
    👉 A <b style="color:${ROXO}">opção B</b> é a economia de hoje em <b>uma tela só</b>: quem não quer pensar toca na meta
    e assina (1 toque, igual à A); quem quer proteger a loja troca o preço (2 toques). A <b style="color:${VERM}">opção A</b>
    é mais limpa, mas faz o ano ruim doer <b>em dobro</b> — e as 9 combinações de hoje viram 3.</div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
// 📏 janela baixa de propósito: `fullPage` usa o MAIOR entre conteúdo e janela, então
// janela alta deixaria faixa creme vazia embaixo do mockup.
const p = await b.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
