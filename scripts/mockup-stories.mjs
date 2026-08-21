// ─── 📱 MOCKUP DE STORY (1080×1920) — pro Diego postar ──────────────────────
//
// Formato: vertical, Instagram/WhatsApp story. Um assunto por arte, texto GRANDE
// (o povo lê de relance, na rua), a cara do jogo (creme · borda preta · sombra
// dura · Oswald) e o endereço embaixo.
//
// Este arquivo mora no repo de propósito: o mockup do Coringas foi feito à mão
// e SE PERDEU com o scratchpad. Story novo = novo `--tema` aqui dentro.
//
//   node scripts/mockup-stories.mjs --tema carreira-barra [--saida story.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const TEMA = arg('--tema', 'carreira-barra')
const SAIDA = arg('--saida', `story-${TEMA}.png`)
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// ── ícones desenhados da barra (os MESMOS do jogo) ─────────────────────────
const ico = (nome, cor, tam = 46) => {
  const fill = cor === PURPLE ? 'rgba(124,58,237,.22)' : 'rgba(12,12,12,.10)'
  const p = `fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`
  const d = {
    jogos: `<rect x="3.5" y="5" width="17" height="15.5" rx="2.4" ${p} fill="${fill}"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" ${p}/><circle cx="12" cy="15" r="2.4" ${p}/>`,
    tabelas: `<rect x="3.5" y="4" width="17" height="16" rx="2.4" ${p} fill="${fill}"/><path d="M3.5 9h17M3.5 14.5h17M9 4v16" ${p}/>`,
    elenco: `<path d="M12 3.5l7 2.6v5.3c0 4.3-3 7.6-7 9.1-4-1.5-7-4.8-7-9.1V6.1z" ${p} fill="${fill}"/><path d="M9.2 12.3l1.9 1.9 3.7-3.9" ${p}/>`,
    rank: `<path d="M7 3.5h10v5.2a5 5 0 0 1-10 0z" ${p} fill="${fill}"/><path d="M7 5.2H4.3v1.6A3.2 3.2 0 0 0 7 9.9M17 5.2h2.7v1.6A3.2 3.2 0 0 1 17 9.9M12 13.7v3.1M8.6 20.5h6.8" ${p}/>`,
    clube: `<path d="M4 20.5V10l8-5.5 8 5.5v10.5z" ${p} fill="${fill}"/><path d="M8.5 20.5v-4.6h7v4.6M8.5 12.4h7" ${p}/>`,
  }[nome]
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" style="display:block;margin:0 auto">${d}</svg>`
}

// ── o celular que aparece na arte ──────────────────────────────────────────
const fone = inner => `
  <div style="width:640px;border:9px solid ${INK};border-radius:52px;background:${CREME};
    box-shadow:14px 14px 0 ${INK};overflow:hidden;position:relative">${inner}</div>`

// cabeçalho preto da carreira (encolhido pro story)
const cabCarreira = `
  <div style="background:${INK};padding:26px 30px 32px;color:#fff;position:relative">
    <div style="${OSW};font-size:19px;letter-spacing:.1em;color:${GOLD}">TEMPORADA 11 · ⚽ LIGA LEGENDS</div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:6px">
      <div>
        <div style="${OSW};font-size:44px;line-height:1">Rodada <b style="font-size:52px">18</b><span style="font-size:26px;opacity:.5"> / 38</span></div>
        <div style="font-family:system-ui;font-size:20px;font-weight:700;opacity:.65;margin-top:8px">Série D</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-shrink:0">
        <span style="${OSW};font-size:23px;border:3px solid rgba(255,255,255,.25);border-radius:999px;padding:5px 16px;white-space:nowrap">🏅 3º</span>
        <span style="${OSW};font-size:23px;background:${GOLD};color:${INK};border-radius:10px;padding:5px 14px;white-space:nowrap">🪙 412</span>
      </div>
    </div>
    <div style="position:absolute;left:0;bottom:0;height:11px;width:100%;background:#2b2721"><div style="height:100%;width:47%;background:linear-gradient(90deg,${GOLD},#ffde5c)"></div></div>
  </div>`

const linhaJogo = (a, b, pa, pb, destaque) => `
  <div style="display:flex;align-items:center;gap:14px;border:5px solid ${INK};border-radius:22px;
    background:${destaque ? '#FFF6DE' : '#fff'};box-shadow:6px 6px 0 ${INK};padding:16px 20px;margin-bottom:16px">
    <span style="flex:1;${OSW};font-size:26px;text-align:right">${a}</span>
    <span style="${OSW};font-size:30px;background:${INK};color:#fff;border-radius:12px;padding:5px 16px">${pa} × ${pb}</span>
    <span style="flex:1;${OSW};font-size:26px">${b}</span>
  </div>`

// a BARRA (a estrela do story)
const barra = ativa => `
  <div style="background:rgba(250,247,238,.98);border-top:4px solid rgba(12,12,12,.16);
    display:flex;padding:16px 12px 22px;box-shadow:0 -6px 26px rgba(0,0,0,.08)">
    ${[['jogos', 'Jogos'], ['tabelas', 'Tabelas'], ['elenco', 'Elenco'], ['rank', 'Rank'], ['clube', 'Clube']]
      .map(([k, t]) => {
        const on = k === ativa
        const cor = on ? PURPLE : 'rgba(12,12,12,.45)'
        return `<div style="flex:1;text-align:center;position:relative">
          ${ico(k, cor)}
          <div style="${OSW};font-weight:${on ? 700 : 600};font-size:19px;text-transform:uppercase;color:${cor};margin-top:5px">${t}</div>
          ${k === 'jogos' && !on ? `<span style="position:absolute;top:2px;right:50%;margin-right:-30px;width:14px;height:14px;border-radius:999px;background:${RED};border:3px solid #fff"></span>` : ''}
        </div>`
      }).join('')}
  </div>`

const TELA_CARREIRA = `
  ${cabCarreira}
  <div style="padding:24px 24px 6px">
    ${linhaJogo('Neymarzetti', 'Sapekeiros FC', 2, 1, true)}
    ${linhaJogo('Nata de SP', 'Bicho da Seda', 0, 0, false)}
    ${linhaJogo('Alfacehh', 'Manfré FC', 3, 2, false)}
    ${linhaJogo('Barcenite FC', 'Skyy FC', 1, 4, false)}
    ${linhaJogo('Coringas do Diniz', 'Toka 10', 2, 2, false)}
    ${linhaJogo('Bigão FC', 'Arruda FC', 1, 0, false)}
  </div>
  ${barra('jogos')}`

// ── temas ──────────────────────────────────────────────────────────────────
const TEMAS = {
  'carreira-barra': {
    tag: '🆕 NOVIDADE NO MODO CARREIRA',
    titulo: 'AGORA O MENU<br>FICA EMBAIXO',
    sub: 'Jogos · Tabelas · Elenco · Rank · Clube sempre na mão — role até onde rolar, você troca de aba no polegar.',
    tela: TELA_CARREIRA,
    selo: '🪜',
    cor: PURPLE,
  },
}

const t = TEMAS[TEMA]
if (!t) { console.error('tema desconhecido:', TEMA, '· disponíveis:', Object.keys(TEMAS).join(', ')); process.exit(1) }

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1080px;height:1920px;background:${CREME};overflow:hidden;position:relative;
    font-family:system-ui;display:flex;flex-direction:column;align-items:center;
    padding:74px 60px 64px}
  /* textura de fundo discreta: listras finas, mesma linguagem do manto */
  body:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(12,12,12,.035) 0 3px,transparent 3px 26px);pointer-events:none}
</style>
<body>
  <div style="position:relative;z-index:2;text-align:center;width:100%">
    <div style="display:inline-block;${OSW};font-size:25px;letter-spacing:.12em;background:${t.cor};color:#fff;
      border:5px solid ${INK};border-radius:999px;padding:10px 30px;box-shadow:7px 7px 0 ${INK}">${t.tag}</div>
    <div style="${OSW};font-size:86px;line-height:.98;margin-top:30px;text-transform:uppercase">${t.titulo}</div>
    <div style="font-size:29px;font-weight:600;line-height:1.4;color:rgba(12,12,12,.66);margin:22px auto 0;max-width:850px">${t.sub}</div>
  </div>

  <div style="position:relative;z-index:2;margin-top:40px">
    ${fone(t.tela)}
    <!-- setinha apontando pra barra -->
    <div style="position:absolute;right:-38px;bottom:50px;font-size:64px;transform:rotate(8deg)">👈</div>
  </div>

  <div style="position:relative;z-index:2;margin-top:auto;text-align:center;width:100%">
    <div style="${OSW};font-size:52px;text-transform:uppercase">⚽ Leilão <span style="color:${RED}">Legends</span></div>
    <div style="display:inline-block;margin-top:14px;${OSW};font-size:31px;background:${GREEN};color:#fff;
      border:5px solid ${INK};border-radius:16px;padding:12px 34px;box-shadow:7px 7px 0 ${INK}">leilaolegends.com</div>
    <div style="font-size:23px;font-weight:700;color:rgba(12,12,12,.45);margin-top:16px">grátis · joga no navegador · sem instalar nada</div>
  </div>
</body></html>`

const tmp = `/tmp/story-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA })
await b.close()
console.log(SAIDA)
