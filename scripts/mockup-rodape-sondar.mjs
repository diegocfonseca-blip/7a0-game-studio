// ─── 🕵️ MOCKUP: SÓ O RODAPÉ, o mais visível possível ───────────────────────
// Pedido do Diego (28/08), depois de ver o mockup das pílulas: *"e se for deixar
// só no rodapé, qual sua proposta pro mockup ficar ainda mais visível embaixo?"*
//
// 🔍 A CAUSA, achada no código (`pyramidseason.tsx`, o rodapé Vender · Sondar):
// hoje o rodapé é uma barra TRANSLÚCIDA com desfoque e um fio de 1,5px — que é a
// cara de barra de sistema do celular, NÃO a cara do Leilão Legends (borda preta
// grossa + sombra dura). O olho lê aquilo como "moldura do aparelho" e pula. E o
// ícone desligado ainda leva `grayscale(1) opacity(.5)`, o que faz o botão
// parecer DESATIVADO.
//
// Três propostas, todas SÓ no rodapé (nada em cima):
//   A — cara do jogo: creme sólido + borda preta grossa, Sondar em pílula dourada
//   B — A + o Sondar ocupando 60% da barra (a aba que importa fica maior)
//   C — A + faixa dourada de chamada em cima do rodapé (some no 1º toque)
//
//   node scripts/mockup-rodape-sondar.mjs [--saida rodape-sondar.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'rodape-sondar.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D', VERM = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// ── ANTES: exatamente o que está no ar (translúcido, fio fino, ícone cinza) ──
const rodapeAntes = `
  <div style="position:absolute;left:0;right:0;bottom:0;background:rgba(250,247,238,.97);
              border-top:1.5px solid rgba(12,12,12,.13);box-shadow:0 -2px 12px rgba(0,0,0,.05);
              display:flex;gap:2px;padding:6px 6px 10px">
    <button style="flex:1;background:transparent;border:none;padding:3px 0 1px;color:${GREEN}">
      <span style="display:block;font-size:19px;line-height:24px">📋</span>
      <span style="display:block;${OSW};font-weight:900;font-size:9.5px;text-transform:uppercase;margin-top:2px">Vender</span>
    </button>
    <button style="flex:1;background:transparent;border:none;padding:3px 0 1px;color:rgba(12,12,12,.45)">
      <span style="display:block;font-size:19px;line-height:24px;filter:grayscale(1) opacity(.5)">🕵️</span>
      <span style="display:block;${OSW};font-weight:700;font-size:9.5px;text-transform:uppercase;margin-top:2px">Sondar</span>
    </button>
  </div>`

// ── as propostas ──
// aba "Vender" (ativa, discreta) e aba "Sondar" (pílula dourada, chamando)
const abaVender = (flex) => `
  <button style="flex:${flex};min-width:0;background:#fff;border:3px solid ${INK};border-radius:12px;
                 box-shadow:2px 2px 0 ${INK};padding:5px 2px;color:${INK}">
    <span style="display:block;font-size:18px;line-height:22px">📋</span>
    <span style="display:block;${OSW};font-weight:900;font-size:10px;text-transform:uppercase;margin-top:1px">Vender</span>
  </button>`

const abaSondar = (flex, rotulo) => `
  <button style="flex:${flex};min-width:0;position:relative;background:linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200);
                 border:3px solid ${INK};border-radius:12px;box-shadow:2px 2px 0 ${INK};padding:5px 2px;color:${INK}">
    <span style="position:absolute;top:-7px;right:-4px;background:${VERM};color:#fff;font-size:8px;font-weight:900;
                 border:2px solid ${INK};border-radius:999px;padding:1px 6px;letter-spacing:.3px">NOVO</span>
    <span style="display:block;font-size:18px;line-height:22px">🕵️</span>
    <span style="display:block;${OSW};font-weight:900;font-size:10px;text-transform:uppercase;margin-top:1px">${rotulo}</span>
  </button>`

// 🎨 a barra com a CARA DO JOGO: creme sólido (sem desfoque) + borda preta grossa
const barra = (dentro, faixa) => `
  <div style="position:absolute;left:0;right:0;bottom:0">
    ${faixa ? `
      <div style="background:${GOLD};border-top:3px solid ${INK};border-bottom:3px solid ${INK};
                  padding:5px 10px;text-align:center;${OSW};font-size:10.5px;color:${INK};
                  text-transform:uppercase;letter-spacing:.3px">
        👇 tem técnico pra contratar aqui embaixo</div>` : ''}
    <div style="background:${CREME};border-top:${faixa ? 0 : '3px'} solid ${INK};
                display:flex;gap:7px;padding:8px 9px 12px">${dentro}</div>
  </div>`

const PROPOSTAS = [
  { id: 'A', titulo: 'A · cara do jogo',
    legenda: 'Creme sólido e <b>borda preta grossa</b> igual ao resto do jogo (hoje é uma barra translúcida de sistema, que o olho pula). O Sondar vira <b>pílula dourada</b> com selo NOVO — parece botão, não ícone apagado.',
    html: barra(abaVender(1) + abaSondar(1, 'Sondar técnico'), false) },
  { id: 'B', titulo: 'B · Sondar maior',
    legenda: 'Igual a A, mas o <b>Sondar ocupa mais espaço</b> que o Vender. Quem nunca contratou técnico bate o olho no maior primeiro — e o Vender continua ali do lado, do mesmo jeito.',
    html: barra(abaVender(0.62) + abaSondar(1.38, 'Sondar técnico'), false) },
  { id: 'C', titulo: 'C · com faixa de chamada',
    legenda: 'Igual a A, com uma <b>faixa dourada</b> em cima do rodapé apontando pra baixo. Ela <b>some pra sempre</b> depois do primeiro toque no Sondar — é empurrão de estreia, não enfeite fixo.',
    html: barra(abaVender(1) + abaSondar(1, 'Sondar técnico'), true) },
]

const cartaoJogador = (nome, pos, clube) => `
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};
              padding:7px 9px;margin-bottom:6px;display:flex;align-items:center;gap:8px">
    <span style="background:${INK};color:#fff;${OSW};font-size:8.5px;border-radius:6px;padding:2px 6px">${pos}</span>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-weight:900;font-size:12px;margin:0">${nome}</p>
      <p style="font-size:9px;font-weight:700;color:rgba(0,0,0,.5);margin:1px 0 0">${clube}</p>
    </div>
    <span style="background:#EFE9D6;border:2px solid ${INK};border-radius:8px;${OSW};font-size:9px;padding:2px 7px">📋 listar</span>
  </div>`

const tela = (titulo, legenda, rodape, destaque) => `
  <div style="flex:none;width:330px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;text-align:center;margin-bottom:8px;
                color:${destaque ? GREEN : INK}">${titulo}</div>
    <div style="position:relative;width:330px;height:470px;background:${CREME};
                border:${destaque ? 5 : 4}px solid ${destaque ? GREEN : INK};border-radius:20px;
                box-shadow:5px 6px 0 ${INK};overflow:hidden">
      <div style="padding:12px 11px 80px">
        <div style="background:${INK};color:#fff;border:3px solid ${INK};border-radius:12px;
                    box-shadow:3px 3px 0 ${INK};padding:8px 10px;margin-bottom:9px">
          <span style="${OSW};font-weight:900;font-size:12px">📋 LISTAR PRA LEILÃO · TEMP. 3</span>
        </div>
        ${cartaoJogador('Ronaldinho Gaúcho', 'MEI', 'Atlético-MG · 2013')}
        ${cartaoJogador('Zico', 'MEI', 'Flamengo · 1981')}
        ${cartaoJogador('Bruno Rangel', 'ATA', 'Chapecoense · 2016')}
      </div>
      ${rodape}
    </div>
    <p style="font-size:12.5px;font-weight:600;line-height:1.45;margin:10px auto 0;
              text-align:center;color:rgba(0,0,0,.72)">${legenda}</p>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE7D2;color:${INK};font-family:system-ui,-apple-system,sans-serif;
     width:1440px;padding:32px 28px 28px}
</style></head><body>
  <div style="text-align:center;margin-bottom:22px">
    <div style="display:inline-block;background:${GOLD};border:4px solid ${INK};border-radius:999px;
      box-shadow:4px 4px 0 ${INK};padding:7px 22px;${OSW};font-size:17px;text-transform:uppercase;letter-spacing:1px">
      🕵️ só no rodapé — 3 jeitos de aparecer</div>
    <p style="font-size:14.5px;font-weight:600;margin:11px auto 0;max-width:900px;line-height:1.45">
      Nada em cima. O rodapé continua onde está — muda só como ele se apresenta.
      Em todas as três o rótulo passa a ser <b>“Sondar técnico”</b>, que diz o que a aba faz.</p>
  </div>
  <div style="display:flex;gap:22px;justify-content:center;align-items:flex-start">
    ${tela('Antes (no ar hoje)', 'Barra translúcida com fio de 1,5px — <b>cara de barra do celular</b>, não do jogo. E o 🕵️ desligado fica cinza e apagado, que o cérebro lê como <b>botão desativado</b>.', rodapeAntes, false)}
    ${PROPOSTAS.map(p => tela(p.titulo, p.legenda, p.html, p.id === 'B')).join('')}
  </div>
  <p style="text-align:center;${OSW};font-size:14px;margin-top:20px;color:${GREEN}">
    ✅ minha sugestão: a <b>B</b> — mesmo peso visual da A, e o Sondar maior resolve sozinho sem faixa nenhuma na tela</p>
</body></html>`

const tmp = `/tmp/mock-rodape-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 700 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
