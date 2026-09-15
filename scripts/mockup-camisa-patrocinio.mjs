// 👕🤝 A CAMISA MUDA COM OS CONTRATOS — regra que o Diego fechou em 15/09:
//
//   *"lembrando que todo clube sem batismo só terá no peito esquerdo, enquadrado
//   corretamente, o escudo dele. O patrocínio irá alterar com base no fechamento do
//   patrocínio Master e também do fornecedor de material esportivo. Isso vale também
//   pros times de batismo."*
//
// Ou seja, três lugares FIXOS na camisa, e o que aparece em cada um depende do que
// está fechado naquele momento:
//   · peito ESQUERDO (lado direito de quem olha) → o escudo do clube. Sem batismo é o
//     escudo base (a letra do nome + as 2 cores do dono), sempre enquadrado igual.
//     Com batismo, o escudo já vem desenhado na arte do dono — o jogo não carimba
//     outro por cima.
//   · peito DIREITO → o fornecedor de material, se tiver contrato.
//   · BARRIGA → o patrocínio Master, se tiver contrato.
// Fechou contrato, aparece. Acabou o contrato, some. Vale IGUAL pros dois tipos de
// clube — é a mesma regra, só muda de onde vem a arte da camisa.
//
// Exemplo pedido por ele: Master = 🎨 Rei das Tintas (marca REAL, entra o logo de
// verdade em cores) · fornecedor = 🐆 Pumba (marca cômica, entra o nome).
//
//   node scripts/mockup-camisa-patrocinio.mjs
import { chromium } from 'playwright-core'
import { INK, CREME, GOLD, GREEN, FONTES, OSW, img, escudoBase, camisa, vitrine, CAMISA_TIER, LOGO_REIDASTINTAS } from './loja-pecas.mjs'

const CAMISA_LEITE = img('public/mantos-salao/leitedeverdade-camisa.webp')

// 📐 medido em cada arte (as duas têm enquadramento diferente, então cada uma traz
// as SUAS medidas — chutar pela altura da imagem foi o erro que ele pegou em 15/09).
//   Leite de Verdade (588×760): escudo do batismo já está em x68%/y28%; a coroa do
//   clube em x34%/y26%; o nome escrito de 37% a 51%; o celeiro a partir de 55%.
const POS_LEITE = { fornX: 33, fornY: 34, masterX: 50, masterY: 65 }
//   Molde do tier (542×620): gola até 12%, faixa de cima 32→38%, corpo de 21% a 79%.
const POS_TIER = { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 }

const ESCUDO_MORTO = (size) => escudoBase({ letra: 'M', c1: '#D4553C', c2: '#7A1E14', size })

// ── a camisa em 1 dos 3 estados de contrato ────────────────────────────────
const camisaEstado = ({ batismo, alt, forn, master }) => camisa({
  arte: batismo ? CAMISA_LEITE : CAMISA_TIER, alt,
  // 🛡️ o escudo só é CARIMBADO em quem não tem batismo — no batismo ele já está na arte
  escudo: batismo ? '' : ESCUDO_MORTO(Math.round(alt * 0.085)),
  fornecedor: forn ? 'Pumba' : '', fornSimbolo: forn ? '🐆' : '',
  master: '', masterLogo: master ? LOGO_REIDASTINTAS : undefined,
  masterW: 0.20, masterH: 0.155, masterCor: batismo ? '#1A1A1A' : '#4F462E',
  pos: batismo ? POS_LEITE : POS_TIER,
})

const cartao = (titulo, corpo, rodape, bg = '#fff') => `
  <div style="border:3px solid ${INK};border-radius:13px;background:${bg};box-shadow:3px 3px 0 ${INK};padding:9px 10px;margin-bottom:9px">
    <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase;margin-bottom:5px">${titulo}</div>
    ${corpo}${rodape ? `<div style="${OSW};font-weight:400;font-size:10px;opacity:.65;margin-top:6px;line-height:1.4">${rodape}</div>` : ''}
  </div>`

// ── a tirinha "o que muda quando fecha contrato" ───────────────────────────
const tirinha = (batismo) => `
  <div style="display:flex;gap:6px">
    ${[
      { forn: false, master: false, t: 'Sem nada fechado', s: batismo ? 'só a arte do batismo' : 'só o escudo dele' },
      { forn: true, master: false, t: 'Fechou o fornecedor', s: 'entra no peito direito' },
      { forn: true, master: true, t: 'Fechou o Master', s: 'entra na barriga' },
    ].map((e, i) => `
      <div style="flex:1;min-width:0;border:2.5px solid ${INK};border-radius:11px;background:${i === 2 ? GOLD : '#fff'};
                  box-shadow:${i === 2 ? `2px 2px 0 ${INK}` : 'none'};padding:6px 4px 5px;text-align:center">
        <div style="display:flex;justify-content:center;margin-bottom:4px">${camisaEstado({ batismo, alt: 108, ...e })}</div>
        <div style="${OSW};font-weight:700;font-size:9px;text-transform:uppercase;line-height:1.15">${e.t}</div>
        <div style="${OSW};font-weight:400;font-size:8.5px;opacity:.7;line-height:1.2;margin-top:1px">${e.s}</div>
      </div>`).join('')}
  </div>`

const painel = ({ titulo, sub, batismo, escudoTxt, camisaTxt }) => `
  <div style="width:392px;flex:none;background:${CREME};border:3px solid ${INK};border-radius:16px;
              box-shadow:4px 4px 0 ${INK};padding:12px;color:${INK}">
    <div style="${OSW};font-weight:700;font-size:16px;text-transform:uppercase;line-height:1.05">${titulo}</div>
    <div style="${OSW};font-weight:400;font-size:11px;opacity:.7;margin-bottom:8px">${sub}</div>
    ${vitrine(camisaEstado({ batismo, alt: 290, forn: true, master: true }))}
    ${cartao('🛡️ Peito esquerdo · o escudo', `<div style="display:flex;align-items:center;gap:9px">
        ${batismo
          // 🔍 recorte do escudo dentro da própria arte do batismo (ele está em x68%/y28%
          // da camisa). Assim o cartão mostra o escudo DE VERDADE do dono, não um desenho novo.
          ? `<div style="width:42px;height:42px;flex:none;border:2.5px solid ${INK};border-radius:9px;background:#EBE0CD;
               background-image:url('${CAMISA_LEITE}');background-size:590% auto;background-position:68% 28%"></div>`
          : ESCUDO_MORTO(40)}
        <div style="flex:1;min-width:0">${escudoTxt}</div></div>`)}
    ${cartao('🤝 O que está fechado hoje', `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="width:34px;height:34px;flex:none;border:2.5px solid ${INK};border-radius:9px;background:#B5651D;color:#fff;
                    display:flex;align-items:center;justify-content:center;font-size:16px">🐆</div>
        <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:12.5px">👟 Pumba · fornecedor</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.72">3 temporadas · +30% nas vendas · peito direito</div></div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <img src="${LOGO_REIDASTINTAS}" style="width:34px;height:34px;object-fit:contain;flex:none;
             border:2.5px solid ${INK};border-radius:9px;background:#fff;padding:1px">
        <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:12.5px">🎨 Rei das Tintas · Master</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.72">marca real → <b>logo de verdade, em cores</b> · barriga</div></div></div>`,
      'Acabou o contrato, a estampa <b>some da camisa</b> até fechar outro. É a mesma regra pros dois tipos de clube.')}
    ${cartao('🔁 Como a camisa muda', tirinha(batismo), camisaTxt)}
  </div>`

const html = `<style>${FONTES}body{margin:0;background:#E8DFC6;padding:16px;width:860px}</style>
  <div style="${OSW};font-weight:700;font-size:20px;text-transform:uppercase;color:${INK}">A camisa muda com os contratos</div>
  <div style="${OSW};font-weight:400;font-size:12px;color:${INK};opacity:.78;margin-bottom:12px;line-height:1.45">
    Três lugares fixos: <b>escudo</b> no peito esquerdo · <b>fornecedor</b> no peito direito · <b>Master</b> na barriga.
    O que aparece depende do que está fechado — e a regra é a MESMA pra quem tem batismo e pra quem não tem.
    Aqui: Master 🎨 <b>Rei das Tintas</b> e fornecedor 🐆 <b>Pumba</b> nos dois.</div>
  <div style="display:flex;gap:14px;align-items:flex-start">
    ${painel({
      titulo: 'Leite de Verdade FC', sub: 'COM batismo · Série A',
      batismo: true,
      escudoTxt: `<div style="${OSW};font-weight:700;font-size:12.5px">Escudo do batismo</div>
        <div style="${OSW};font-weight:400;font-size:10px;opacity:.72;line-height:1.35">
          já vem desenhado na arte que o dono mandou — o jogo <b>não carimba outro por cima</b>.</div>`,
      camisaTxt: 'A arte é a do dono e não muda nunca. O que entra e sai são só as duas estampas de patrocínio.',
    })}
    ${painel({
      titulo: 'Morto FC', sub: 'SEM batismo · tier 🪵 Foi Profissional · Série C',
      batismo: false,
      escudoTxt: `<div style="${OSW};font-weight:700;font-size:12.5px">Escudo base · letra M</div>
        <div style="${OSW};font-weight:400;font-size:10px;opacity:.72;line-height:1.35">
          a <b>única</b> coisa que ele tem no peito esquerdo, e sempre <b>enquadrado igual</b>. Nasce da letra do nome + as 2 cores que ele escolher.</div>`,
      camisaTxt: 'A camisa é o molde do jogo na cor do tier. O escudo é sempre dele; as estampas entram e saem com os contratos.',
    })}
  </div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 892, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'mockup-camisa-patrocinio.png', fullPage: true })
await b.close()
console.log('mockup-camisa-patrocinio.png')
