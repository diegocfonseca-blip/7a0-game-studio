// 👟🛍️ FORNECEDOR DE MATERIAL + BALANÇO DA LOJA — mockup da proposta (Diego, 15/09).
//
// O que ele pediu, palavra por palavra:
//   · *"o fornecedor de material esportivo deve ser parecido com o estilo do
//     patrocinador Master, em relação a temporadas que se escolhe 1, 2, 3 e 5. Só que
//     moedas menos que o Master. E também tem aumento em relação à divisão que vai
//     participar quando começar a temporada e tiver sem contrato, com base na divisão…
//     igual do Master, e não quebra contrato também mas que tenha subido ou caído"*
//   · *"o tamanho da torcida deve ser com base no estádio, de coisas que é construído.
//     E também as vendas com base na temporada, como foi. E o resultado das vendas
//     aparece somente no início da nova temporada. Aparece o resultado e depois mostra
//     a continuação do contrato ou se inicia um novo, na qual ele precisa decidir"*
//   · *"me faça tudo e faça mockup parecido com o que já existe, com arte
//     cinematográfica igual do Master e pontual"*
//
// 🎬 A ARTE É A QUE JÁ EXISTE: a mesma mesa de presidente com o estádio na janela
// (`src/escalacao/img/career-sponsor-office-v36.webp`, usada hoje pelo Master e pelo
// Pontual). Zero KB novo, e a tela nova já nasce com cara do jogo. O papel é
// posicionado igual ao CSS de verdade (`career-sponsor-office.css`: inset 49%/24%,
// 51% × 36%).
//
//   node scripts/mockup-fornecedor.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const OSW = 'font-family:Oswald,sans-serif'
const img = p => `data:image/webp;base64,${readFileSync(p).toString('base64')}`
const CENA = img('src/escalacao/img/career-sponsor-office-v36.webp')
const LOGO_ADIBAS = null // marca cômica não tem logo real — entra o nome, como no Pontual

// ══════════════════════════════════════════════════════════════════════════
// 👟 FORNECEDOR — a régua, copiada da mecânica do Master (estadiodata.ts)
// ══════════════════════════════════════════════════════════════════════════
// Master:     base V2 D4 C8 B16 A32,  valor = base × (1,25 + (anos−1)/2)
// Fornecedor: base V1 D2 C5 B10 A20 (≈62% do Master) — MESMA fórmula, MENOS moeda,
// porque o fornecedor ainda paga a segunda perna: o bônus nas vendas da loja.
const FORN_BASE = { V: 1, D: 2, C: 5, B: 10, A: 20 }
const fornPorTemporada = (div, anos) => Math.round((FORN_BASE[div] ?? 0) * (1.25 + (anos - 1) / 2))

// 4 marcas, prazo FIXO em cada uma (igual MASTER_PRAZOS). A marca grande só bate na
// porta de quem subiu — é o degrau de ambição, e a trava explica o porquê e a saída.
const FORNECEDORES = [
  { id: 'penalti', nome: 'Pênalti do Bairro', simb: '⚡', anos: 1, loja: 0.10, desde: 'V', cor: '#8A1E1E' },
  { id: 'adibas',  nome: 'Adibas',            simb: '◣', anos: 2, loja: 0.20, desde: 'V', cor: '#0E3E86' },
  { id: 'pumba',   nome: 'Pumba',             simb: '🐆', anos: 3, loja: 0.30, desde: 'D', cor: '#B5651D' },
  { id: 'naique',  nome: 'Naique',            simb: '✓', anos: 5, loja: 0.45, desde: 'B', cor: GREEN },
]
const ORDEM_DIV = ['V', 'D', 'C', 'B', 'A']
const fornLiberado = (f, div) => ORDEM_DIV.indexOf(div) >= ORDEM_DIV.indexOf(f.desde)
const nomeDiv = d => (d === 'V' ? 'Várzea' : `Série ${d}`)

// ══════════════════════════════════════════════════════════════════════════
// 🛍️ VENDA DE CAMISAS — a conta, em cima do que o jogo JÁ mede
// ══════════════════════════════════════════════════════════════════════════
// 👥 TORCIDA sai do ESTÁDIO CONSTRUÍDO (pedido dele). Assentos do jogo hoje:
//    Geral 21.500 · Cadeiras 18.500 · Visitante 22.838 · Camarote 16.000 = 78.838.
//    Mais um piso de 12.000: clube nenhum tem torcida zero.
const TORCIDA_PISO = 12_000
// 📣 CAMPANHA — como a temporada foi. Mesma ideia da ocupação do estádio (occByPos),
//    só que menos cruel: torcida chateada compra menos, não para de comprar.
const CAMPANHA = [
  { ate: 1,  f: 1.35, txt: 'CAMPEÃO' },
  { ate: 4,  f: 1.15, txt: 'ACESSO (2º–4º)' },
  { ate: 7,  f: 0.90, txt: '5º–7º' },
  { ate: 14, f: 0.60, txt: '8º–14º' },
  { ate: 16, f: 0.45, txt: '15º–16º' },
  { ate: 20, f: 0.30, txt: 'REBAIXADO' },
]
const fatorCampanha = pos => CAMPANHA.find(c => pos <= c.ate).f
// 🏬 OBRAS do estádio que levam gente pra loja (as que já existem em STADIUM_EXTRAS).
//    A 🛍️ Loja do Clube não está na lista porque ela é a PORTA: sem ela não há loja.
const OBRAS_LOJA = { telao: .04, estac: .06, praca: .10, chopp: .06, estacao: .08, hotel: .10, retratil: .06 }
// 🛒 QUEM COMPRA (de cada 100 torcedores) e 💰 MARGEM (moedas por 100 camisas).
//    Barata: muita gente compra, sobra pouco. Cara: pouca gente, sobra mais.
const PRECOS = {
  popular: { nome: 'Popular', moeda: 1, compram: 8.0, margem: 0.5 },
  normal:  { nome: 'Normal',  moeda: 2, compram: 4.5, margem: 1.0 },
  cara:    { nome: 'Cara',    moeda: 3, compram: 2.4, margem: 1.5 },
}
function vendas({ assentos, pos, obras = [], fornLoja = 0, preco = 'normal' }) {
  const torcida = TORCIDA_PISO + assentos
  const camp = fatorCampanha(pos)
  const bObras = obras.reduce((s, k) => s + (OBRAS_LOJA[k] ?? 0), 0)
  const p = PRECOS[preco]
  const camisas = Math.round(torcida * (p.compram / 100) * camp * (1 + bObras) * (1 + fornLoja))
  return { torcida, camp, bObras, camisas, moedas: Math.round(camisas / 100 * p.margem), p }
}

// ── tabelas pro console (é o que o Diego lê pra aprovar os valores) ─────────
const fmt = n => n.toLocaleString('pt-BR')
console.log('\n👟 FORNECEDOR — moedas POR TEMPORADA (o valor congela na divisão em que assinou)')
console.log('divisão │ 1 temp │ 2 temp │ 3 temp │ 5 temp │ total do contrato de 5')
for (const d of ORDEM_DIV) {
  const v = [1, 2, 3, 5].map(a => fornPorTemporada(d, a))
  console.log(`${nomeDiv(d).padEnd(8)}│${String(v[0]).padStart(6)}  │${String(v[1]).padStart(6)}  │${String(v[2]).padStart(6)}  │${String(v[3]).padStart(6)}  │ ${v[3] * 5}`)
}
console.log('(Master, pra comparar: V 3/4/5/7 · D 5/7/9/13 · C 10/14/18/26 · B 20/28/36/52 · A 40/56/72/104)')

console.log('\n🛍️ LOJA — quanto entra numa temporada, preço NORMAL')
const CASOS = [
  { nome: 'Várzea, estádio cru, meio de tabela', assentos: 0, pos: 10, obras: [], fornLoja: .10 },
  { nome: 'Série D, só Geral, escapou do Z4',    assentos: 21500, pos: 15, obras: [], fornLoja: .20 },
  { nome: 'Série C, 2 setores, meio de tabela',  assentos: 40000, pos: 10, obras: ['estac'], fornLoja: .20 },
  { nome: 'Série C, 2 setores, ACESSO',          assentos: 40000, pos: 3, obras: ['estac'], fornLoja: .20 },
  { nome: 'Série B, 3 setores, 5º–7º',           assentos: 62838, pos: 6, obras: ['estac', 'praca', 'telao'], fornLoja: .30 },
  { nome: 'Série A, estádio COMPLETO, CAMPEÃO',  assentos: 78838, pos: 1, obras: Object.keys(OBRAS_LOJA), fornLoja: .45 },
]
for (const c of CASOS) {
  const r = vendas(c)
  console.log(`  ${c.nome.padEnd(42)} torcida ${fmt(r.torcida).padStart(6)} · ${fmt(r.camisas).padStart(6)} camisas · +${r.moedas} 🪙`)
}
console.log('\n   e o MESMO caso (Série A campeão) nos 3 preços:')
for (const k of ['popular', 'normal', 'cara']) {
  const r = vendas({ ...CASOS[5], preco: k })
  console.log(`     ${r.p.nome.padEnd(8)} ${fmt(r.camisas).padStart(6)} camisas × ${r.p.moeda} 🪙 → +${r.moedas} 🪙`)
}

// ══════════════════════════════════════════════════════════════════════════
// 🎬 O MOCKUP
// ══════════════════════════════════════════════════════════════════════════
// a cena + o papel, nas medidas do CSS de verdade (career-sponsor-office.css)
const cena = (papel) => `
  <div style="position:relative;aspect-ratio:1;background:url('${CENA}') center/100% 100% no-repeat;border-radius:0">
    <div style="position:absolute;inset:47% auto auto 24%;width:51%;height:39%;display:flex;flex-direction:column;
                align-items:center;justify-content:center;gap:5px;color:#0C0C0C;text-align:center">${papel}</div>
  </div>`

const selo = (txt, cor) => `<small style="${OSW};font-weight:600;font-size:8px;letter-spacing:.09em;color:#62573F">${txt}</small>`
const assinatura = (txt) => `<span style="align-self:stretch;border-top:1px solid #897B5D;margin:4px 6px 0;padding-top:3px;
  font:500 9px/1.2 Arial,sans-serif;color:#62573F">${txt}</span>`

const painel = ({ topo, titulo, sub, papel, rodape }) => `
  <div style="width:392px;flex:none;background:#160E08;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};overflow:hidden">
    <div style="background:linear-gradient(#07120DE8,#07120DC9);padding:9px 12px 10px">
      <small style="${OSW};font-weight:600;font-size:9.5px;letter-spacing:.09em;color:#C9B98E">${topo}</small>
      <div style="${OSW};font-weight:700;font-size:17px;color:#fff;text-transform:uppercase;line-height:1.05">${titulo}</div>
      <div style="${OSW};font-weight:400;font-size:10.5px;color:#D8CEB4;opacity:.85;margin-top:2px;line-height:1.3">${sub}</div>
    </div>
    ${cena(papel)}
    <div style="background:linear-gradient(#231409,#100B07);padding:9px 12px 11px;color:#E8DFC6">${rodape}</div>
  </div>`

const botao = (txt, on = true) => `<button style="${OSW};font-weight:700;font-size:12.5px;text-transform:uppercase;width:100%;
  border:2.5px solid ${INK};border-radius:11px;padding:8px;background:${on ? GOLD : '#6B6250'};color:${INK};
  box-shadow:2px 2px 0 ${INK};margin-top:7px">${txt}</button>`
const nota = t => `<p style="${OSW};font-weight:400;font-size:10px;line-height:1.4;margin:0 0 4px;opacity:.85">${t}</p>`

// ── 1) 📦 BALANÇO DA LOJA — a primeira coisa da temporada nova ──────────────
const caso = CASOS[3] // Série C, 2 setores, acesso
const r = vendas(caso)
const balanco = painel({
  topo: 'INÍCIO DA TEMPORADA 7 · SÉRIE C',
  titulo: '📦 Balanço da Loja',
  sub: 'Como foi a temporada 6, que acabou agora.',
  papel: `
    ${selo('BALANÇO DA LOJA DO CLUBE · TEMPORADA 6')}
    <div style="${OSW};font-weight:700;font-size:26px;line-height:1">${fmt(r.camisas)}</div>
    <div style="${OSW};font-weight:700;font-size:11px;line-height:1;margin-top:-3px">CAMISAS VENDIDAS</div>
    <strong style="${OSW};font-weight:700;font-size:27px;line-height:1;color:#1B5E2A">+${r.moedas} 🪙</strong>
    <div style="${OSW};font-weight:500;font-size:8.5px;line-height:1.35;color:#5A5040">
      ${fmt(r.torcida)} torcedores · 3º lugar (acesso) · preço Normal · Adibas +20%</div>
    ${assinatura('Diretoria de marketing · Fulanos FC')}`,
  rodape: `${nota('<b>Entrou direto no caixa.</b> O balanço aparece uma vez só, na abertura da temporada nova — durante a temporada a loja trabalha calada, sem mais um passo pra você apertar.')}
    ${botao('VER O FORNECEDOR')}`,
})

// ── 2) 👟 CONTRATO EM ANDAMENTO — não há nada pra decidir ───────────────────
const emAndamento = painel({
  topo: 'FORNECEDOR DE MATERIAL · SÉRIE C',
  titulo: '👟 Contrato em dia',
  sub: 'Nada pra decidir: o contrato segue e a temporada começa.',
  papel: `
    ${selo('CONTRATO DE MATERIAL ESPORTIVO')}
    <div style="${OSW};font-weight:700;font-size:23px;line-height:1">Adibas</div>
    <div style="${OSW};font-weight:700;font-size:10.5px;line-height:1.2">ANO 2 DE 2 · assinado na Série D</div>
    <strong style="${OSW};font-weight:700;font-size:25px;line-height:1">+4 🪙<span style="font-size:11px;font-weight:600"> / temporada</span></strong>
    <div style="${OSW};font-weight:500;font-size:8.5px;line-height:1.35;color:#5A5040">+20% nas vendas da loja</div>
    <span style="display:block;font:italic 17px/1 cursive;color:#223353;transform:rotate(-5deg);margin:1px 0 -3px">Assinado</span>
    ${assinatura('Contrato confirmado')}`,
  rodape: `${nota('Você <b>subiu da Série D pra Série C</b> e o contrato <b>não quebrou</b>: continua valendo os 4 🪙 que você fechou lá embaixo, até o último ano. Igual ao Master.')}
    ${nota('Quando ele acabar, as propostas novas chegam <b>com os valores da divisão em que você estiver</b>.')}`,
})

// ── 3) 👟 CONTRATO ACABOU — as 4 propostas ─────────────────────────────────
const DIV_NOVA = 'C'
const proposta = (f) => {
  const liberado = fornLiberado(f, DIV_NOVA)
  const v = fornPorTemporada(DIV_NOVA, f.anos)
  return `<div style="display:flex;align-items:center;gap:8px;border:2.5px solid ${INK};border-radius:11px;padding:6px 8px;margin-bottom:5px;
      background:${liberado ? '#F4ECD6' : '#6B6250'};opacity:${liberado ? 1 : .8};box-shadow:${liberado ? `2px 2px 0 ${INK}` : 'none'};color:${INK}">
    <div style="width:30px;height:30px;flex:none;border:2.5px solid ${INK};border-radius:8px;background:${liberado ? f.cor : '#4A4436'};
                color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px">${f.simb}</div>
    <div style="flex:1;min-width:0">
      <div style="${OSW};font-weight:700;font-size:12.5px;line-height:1.1">${f.nome}</div>
      <div style="${OSW};font-weight:400;font-size:9.5px;line-height:1.25;opacity:.75">
        ${liberado ? `${f.anos} temporada${f.anos > 1 ? 's' : ''} · +${Math.round(f.loja * 100)}% na loja`
                   : `só fecha com clube da ${nomeDiv(f.desde)} pra cima`}</div>
    </div>
    <div style="text-align:right;flex:none">
      <div style="${OSW};font-weight:700;font-size:15px;line-height:1;color:${f.anos === 5 ? ROXO : INK}">${liberado ? `${v} 🪙` : '🔒'}</div>
      <div style="${OSW};font-weight:400;font-size:8.5px;opacity:.7">${liberado ? `${v * f.anos} no total` : 'suba 1 série'}</div>
    </div>
  </div>`
}
const novas = painel({
  topo: 'FORNECEDOR DE MATERIAL · SÉRIE C',
  titulo: '👟 Chegaram propostas',
  sub: 'O contrato acabou. Escolha o prazo — o valor congela aqui.',
  papel: `
    ${selo('PROPOSTA DE MATERIAL ESPORTIVO')}
    <div style="${OSW};font-weight:700;font-size:23px;line-height:1">Pumba</div>
    <div style="${OSW};font-weight:700;font-size:10.5px;line-height:1.2">3 TEMPORADAS · SÉRIE C</div>
    <strong style="${OSW};font-weight:700;font-size:25px;line-height:1">+${fornPorTemporada('C', 3)} 🪙<span style="font-size:11px;font-weight:600"> / temporada</span></strong>
    <div style="${OSW};font-weight:500;font-size:8.5px;line-height:1.35;color:#5A5040">+30% nas vendas da loja · ${fornPorTemporada('C', 3) * 3} 🪙 no contrato inteiro</div>
    ${assinatura('Assinatura do presidente')}`,
  rodape: `${FORNECEDORES.map(proposta).join('')}
    ${botao('ASSINAR CONTRATO')}`,
})

const html = `<style>${FONTES}body{margin:0;background:#E8DFC6;padding:16px;width:1290px}</style>
  <div style="${OSW};font-weight:700;font-size:20px;text-transform:uppercase;color:${INK}">Fornecedor de material + Balanço da Loja · proposta</div>
  <div style="${OSW};font-weight:400;font-size:12px;color:${INK};opacity:.78;margin-bottom:12px;line-height:1.45">
    Mesma cena do Master e do Pontual (arte que já existe, 0 KB novo). A ordem na virada da temporada é sempre esta:
    <b>1)</b> o balanço da loja do ano que acabou · <b>2)</b> o fornecedor — se o contrato segue, é só um aviso;
    se acabou, aí sim você decide.</div>
  <div style="display:flex;gap:14px;align-items:flex-start">${balanco}${emAndamento}${novas}</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1322, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'mockup-fornecedor.png', fullPage: true })
await b.close()
console.log('\nmockup-fornecedor.png')
