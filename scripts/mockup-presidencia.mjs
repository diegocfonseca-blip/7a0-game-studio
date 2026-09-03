// ─── 🏛️ MOCKUP DA SALA DA PRESIDÊNCIA (03/09) ───────────────────────────────
//
// Pedido do Diego: *"vamos fazer a sala da presidência.. Como será? C técnico,
// sala de troféus q passará pra lá.. E mais oq??"*
//
// A proposta: a Presidência é a 5ª sala da aba 🏟️ CLUBE (Estádio · Finanças ·
// Patrocínio · Agência · **Presidência**). O desenho do estádio continua sendo
// a PRIMEIRA coisa que abre na área do clube — regra do Diego, a Presidência
// nunca vira a sala padrão.
//
// O que entra, e de onde vem (quase tudo já EXISTE, só está espalhado):
//   · 🪑 a mesa      — escudo, clube, temporada, divisão + 🎪 torcidômetro
//                      (careerTorcida / careerTorcidaHist, hoje só no fim de ano)
//   · 🧢 o técnico   — a FICHA sai do Elenco e vem pra cá (careerTecnicos,
//                      careerTecnicoContrato, careerTecnicoPago)
//   · 🏆 troféus     — a estante sai do RANK e vem pra cá (careerHonors,
//                      careerCopaHonors, careerSupercopaHonors)
//   · 📼 a parede    — NOVO na tela, dado VELHO: careerCronica já grava uma linha
//                      por temporada (divisão, campeão, copa, supercopa) e hoje
//                      só o jornal lê. Vira a linha do tempo do clube.
//   · 📊 a placa     — contas em cima da mesma crônica: temporadas no comando,
//                      acessos, quedas, maior sequência na elite, jejum atual
//   · atalhos        — Finanças · Patrocínio · Agência
//
// O que NÃO entra, de propósito:
//   · 🕵️ Sondar técnico continua no PRÉ-LEILÃO (decisão do Diego em 28/08 —
//     "não precisa ter repetido"). Aqui só a ficha de quem já é seu.
//   · nada que revele resultado antes do apito (a parede só mostra temporada
//     FECHADA) e nada que adicione passo antes da rodada.
//
// uso: node scripts/mockup-presidencia.mjs [--pasta /tmp/mock-presidencia]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = (i => i > 0 ? process.argv[i + 1] : '/tmp/mock-presidencia')(process.argv.indexOf('--pasta')); mkdirSync(OUT, { recursive: true })
const REPO = process.cwd()
const b64 = p => readFileSync(p).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`${REPO}/scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', PURPLE = '#7C3AED'

const CSS = `${FONTES}
*{box-sizing:border-box} html,body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:700}
.osw{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase}
.box{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK}}
.band{background:${INK};color:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK}}
.pill{display:inline-block;border:2px solid ${INK};border-radius:999px;padding:1px 8px;font-size:10px;font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;white-space:nowrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;padding:9px 10px;font-size:11px;background:#fff}
.muted{color:rgba(12,12,12,.55)}
.row{display:flex;align-items:center;gap:8px}
.sub{display:flex;flex-direction:column;align-items:center;gap:2px;font-family:Oswald,sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.04em;color:rgba(12,12,12,.5);border:2.5px solid rgba(12,12,12,.18);border-radius:11px;padding:5px 0;background:#fff;flex:1;min-width:0}
.sub.on{color:${INK};border-color:${INK};background:${GOLD};box-shadow:2px 2px 0 ${INK}}
.tab{display:flex;flex-direction:column;align-items:center;gap:2px;font-family:Oswald,sans-serif;font-weight:700;font-size:10px;letter-spacing:.06em;color:rgba(12,12,12,.45)}
.tab.on{color:${INK}}
.tit{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:13px;letter-spacing:.02em}
.sob{font-size:9.5px;font-weight:700;color:rgba(12,12,12,.55);margin-top:1px;line-height:1.35}
.chip{display:inline-flex;align-items:center;gap:4px;border:2px solid ${INK};border-radius:8px;padding:2px 6px;font-size:10px;background:#fff}
.trof{width:76px;border:2.5px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:8px 5px 6px;text-align:center}
`

// escudinho genérico (o mesmo truque dos outros mockups: quadrado com borda)
const esc = (c, s = 20) => `<span style="display:inline-block;width:${s}px;height:${s}px;border-radius:6px;border:2px solid ${INK};background:${c};vertical-align:-4px"></span>`

// ── faixa fina do topo da carreira (existe hoje) ────────────────────────────
const faixa = `<div class="row" style="justify-content:space-between;background:#fff;border:2.5px solid ${INK};border-radius:11px;padding:5px 9px;margin-bottom:8px">
  <span class="osw" style="font-size:10.5px">Temporada 7 · <span style="color:${GREEN}">Série B</span></span>
  <span class="row" style="gap:5px"><span class="pill">Rodada 12/38</span><span class="pill" style="background:${GOLD}">🪙 128</span></span>
</div>`

// ── as 5 salas do Clube ─────────────────────────────────────────────────────
const salas = on => `<div class="row" style="gap:5px;margin-bottom:9px">
  ${[['🏟️', 'Estádio'], ['💰', 'Finanças'], ['🤝', 'Patroc.'], ['💼', 'Agência'], ['🏛️', 'Presidência']]
    .map(([i, t]) => `<div class="sub${t === on ? ' on' : ''}"><span style="font-size:14px">${i}</span>${t}</div>`).join('')}
</div>`

// ── rodapé fixo da carreira (existe hoje) ───────────────────────────────────
const rodape = `<div style="position:absolute;left:0;right:0;bottom:0;background:${CREME};border-top:3px solid ${INK};padding:8px 12px 12px;display:flex;justify-content:space-between">
  ${[['🗓️', 'Jogos'], ['📊', 'Tabelas'], ['👥', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']]
    .map(([i, t]) => `<div class="tab${t === 'Clube' ? ' on' : ''}"><span style="font-size:17px">${i}</span>${t}</div>`).join('')}
</div>`

// ── 🪑 A MESA ───────────────────────────────────────────────────────────────
const mesa = `<div class="band" style="padding:10px 12px;margin-bottom:9px">
  <div class="row" style="justify-content:space-between">
    <div class="row" style="gap:9px">
      ${esc(GREEN, 34)}
      <div>
        <div class="osw" style="font-size:9.5px;color:${GOLD};letter-spacing:.09em">Sala da Presidência</div>
        <div class="osw" style="font-size:19px;line-height:1.05">Tigres do Asfalto</div>
        <div style="font-size:9.5px;color:rgba(255,255,255,.6);margin-top:2px;white-space:nowrap">Presidente <b style="color:#fff">Diego Fonseca</b> <span style="display:inline-block;border:1.5px solid rgba(255,255,255,.5);border-radius:6px;padding:0 4px;font-size:8.5px;margin-left:3px">✏️ editar</span></div>
      </div>
    </div>
    <span class="pill" style="background:${GOLD}">Série B</span>
  </div>
  <div style="margin-top:8px;border-top:1.5px dashed rgba(255,255,255,.25);padding-top:6px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:10.5px;font-style:italic;color:rgba(255,255,255,.85)">“Time de várzea, coração de Série A.”</span>
    <span style="font-size:8.5px;color:rgba(255,255,255,.5)">lema do clube ✏️</span>
  </div>
</div>`


// ── 🖼️ OS SÍMBOLOS DO CLUBE (escudo: todo mundo · manto: sócio · mascote: batismo) ──
const escudoSvg = (c1, c2, letra, s = 54) => `<svg width="${s}" height="${s * 1.12}" viewBox="0 0 50 56"><path d="M25 2 L47 9 V30 C47 43 36 51 25 54 C14 51 3 43 3 30 V9 Z" fill="${c1}" stroke="${INK}" stroke-width="3.5"/><path d="M25 8 L41 13 V29 C41 39 33 45 25 48 V8Z" fill="${c2}"/><text x="25" y="35" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="20" fill="#fff" stroke="${INK}" stroke-width="1.2">${letra}</text></svg>`
const moldura = (titulo, dentro, rodape, travado) => `<div style="flex:1;min-width:0;border:2.5px solid ${INK};border-radius:12px;background:${travado ? '#EFEADB' : '#FFFDF5'};box-shadow:2px 2px 0 ${INK};padding:7px 6px 6px;text-align:center;position:relative;overflow:hidden">
  <div class="osw" style="font-size:9px;color:rgba(12,12,12,.5);letter-spacing:.06em">${titulo}</div>
  <div style="height:64px;display:flex;align-items:center;justify-content:center;margin:4px 0 2px">${dentro}</div>
  <div style="font-size:8.5px;line-height:1.25;color:${travado ? RED : 'rgba(12,12,12,.6)'};font-weight:800">${rodape}</div>
</div>`
const simbolos = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="tit">🖼️ Os símbolos do clube</div>
  <div class="sob" style="margin-bottom:9px">Escudo, manto e mascote — o que veste o seu time.</div>
  <div class="row" style="gap:7px;align-items:stretch">
    ${moldura('Escudo', escudoSvg(GREEN, '#0f5a2b', 'T'), 'Tigres do Asfalto', false)}
    ${moldura('Manto', `<div style="width:46px;height:58px;border:2.5px solid ${INK};border-radius:8px 8px 12px 12px;background:repeating-linear-gradient(90deg,${GREEN} 0 8px,#fff 8px 16px)"></div>`, 'verde e branco · sócio ⭐', false)}
    ${moldura('Mascote', `<div style="font-size:40px;line-height:1">🐯</div>`, 'O Tigrão · carimba o gol', false)}
  </div>
  <div class="row" style="gap:7px;align-items:stretch;margin-top:7px">
    ${moldura('Escudo', escudoSvg('#7C3AED', '#4c1d95', 'R'), 'Ressaca United', false)}
    ${moldura('Manto', `<div style="font-size:26px;line-height:1;opacity:.5">🔒</div>`, 'mimo de sócio — apoie o jogo', true)}
    ${moldura('Mascote', `<div style="font-size:26px;line-height:1;opacity:.5">🔒</div>`, 'vem com o batismo do clube', true)}
  </div>
  <div class="sob" style="margin-top:6px">Em cima: clube batizado + sócio (tudo aberto). Embaixo: clube comum (escudo todo mundo tem; o resto mostra o caminho).</div>
</div>`

// ── ⭐ QUADRO DO CRAQUE DO ANO ──────────────────────────────────────────────
const craque = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="tit">⭐ Quadro do craque do ano</div>
  <div class="sob" style="margin-bottom:8px">Um por temporada, escolhido pelo presidente. A carta ganha o selo ⭐ nesta carreira.</div>
  ${[['T6', 'Meia Canela', '18 gols · 7 assist.'], ['T5', 'Zé Pilantra', '14 gols'], ['T4', 'Bola Murcha', '9 gols · 11 assist.']].map(([t, n, d]) => `<div class="row" style="justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(12,12,12,.07)"><span class="row" style="gap:6px"><span class="pill" style="font-size:8.5px">${t}</span><b style="font-size:11px">⭐ ${n}</b></span><span class="sob">${d}</span></div>`).join('')}
</div>`

// ── 🎖️ CONDECORAÇÕES DO PRESIDENTE (contas em cima da crônica) ─────────────
const condec = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="tit">🎖️ Condecorações do presidente</div>
  <div class="sob" style="margin-bottom:8px">O que VOCÊ conquistou como gestor — vai com você, não com o clube.</div>
  <div class="row" style="gap:6px;flex-wrap:wrap">
    ${[['🪜', 'Escalador', 'subiu 3 divisões'], ['🏆', 'Bicampeão', '2 títulos seguidos'], ['🧱', 'Resistente', '5 anos sem cair'], ['🔒', 'Década', '10 temporadas']].map(([i, n, d], k) => `<div style="border:2.5px solid ${INK};border-radius:11px;background:${k === 3 ? '#EFEADB' : '#FFF7E0'};padding:6px 8px;opacity:${k === 3 ? .55 : 1};flex:1;min-width:70px;text-align:center"><div style="font-size:18px;line-height:1">${i}</div><div class="osw" style="font-size:10px;margin-top:2px">${n}</div><div class="sob">${d}</div></div>`).join('')}
  </div>
</div>`


// ── 🏛️ O DESENHO DA SALA (mesma ideia do StadiumSvg: enche conforme você compra) ──
// Feito em SVG à mão, como o estádio: é UM desenho pra todo mundo, então custa
// ~0 KB e não cai na regra de peso dos batismos (aquela é arte POR CLUBE).
const salaSvg = (cheia) => `<svg viewBox="0 0 640 620" style="width:100%;display:block">
  <defs>
    <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16233f"/><stop offset="1" stop-color="#2d4a6b"/></linearGradient>
    <linearGradient id="tapete" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d2f2a"/><stop offset="1" stop-color="#a83f36"/></linearGradient>
    <linearGradient id="parede" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFE6CE"/><stop offset="1" stop-color="#E2D5B4"/></linearGradient>
  </defs>
  <rect x="0" y="0" width="640" height="420" fill="url(#parede)"/>
  <rect x="0" y="420" width="640" height="200" fill="#7A4A26"/>
  ${[-40, 40, 120, 200, 280, 360, 440, 520, 600, 680].map(x => `<line x1="${x}" y1="420" x2="${x - 60}" y2="620" stroke="#5e3719" stroke-width="2.5"/>`).join('')}
  <rect x="0" y="404" width="640" height="18" fill="#5e3719"/>
  <rect x="0" y="398" width="640" height="8" fill="#9a7a3f"/>

  <!-- 🪟 JANELA PRO ESTÁDIO -->
  <rect x="452" y="86" width="164" height="176" rx="7" fill="url(#ceu)" stroke="${INK}" stroke-width="6"/>
  ${cheia ? `<g><ellipse cx="534" cy="228" rx="66" ry="22" fill="#1B7A3D"/><ellipse cx="534" cy="228" rx="40" ry="12" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
      <rect x="478" y="196" width="112" height="28" rx="4" fill="#3b5a80"/>
      <circle cx="490" cy="126" r="6" fill="${GOLD}"/><circle cx="578" cy="126" r="6" fill="${GOLD}"/>
      <path d="M490 126 L466 176 L514 176 Z" fill="rgba(255,196,0,.16)"/><path d="M578 126 L554 176 L602 176 Z" fill="rgba(255,196,0,.16)"/>
      <line x1="490" y1="132" x2="490" y2="196" stroke="#8fa4bd" stroke-width="4"/><line x1="578" y1="132" x2="578" y2="196" stroke="#8fa4bd" stroke-width="4"/></g>`
    : `<circle cx="586" cy="122" r="16" fill="#f1e4a8"/><circle cx="500" cy="160" r="2.5" fill="#fff"/><circle cx="540" cy="132" r="2" fill="#fff"/>`}
  <line x1="534" y1="86" x2="534" y2="262" stroke="${INK}" stroke-width="5"/><line x1="452" y1="174" x2="616" y2="174" stroke="${INK}" stroke-width="5"/>

  <!-- 🏆 ESTANTE DE TROFÉUS -->
  ${cheia ? `<g><rect x="24" y="96" width="176" height="308" rx="7" fill="#8B5A2B" stroke="${INK}" stroke-width="6"/>
      <rect x="34" y="106" width="156" height="288" fill="#6b4420"/>
      ${[168, 236, 304].map(y => `<rect x="34" y="${y}" width="156" height="9" fill="#4a2f18"/>`).join('')}
      ${[[62, 156], [112, 156], [162, 156], [62, 224], [112, 224], [162, 224], [86, 292], [138, 292]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-8" y="12" width="16" height="5" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><path d="M-9 -12 h18 v11 a9 9 0 0 1 -18 0 z" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><path d="M-9 -8 h-6 a6 6 0 0 0 6 7 M9 -8 h6 a6 6 0 0 1 -6 7" fill="none" stroke="${INK}" stroke-width="2"/></g>`).join('')}
      <rect x="34" y="344" width="156" height="50" rx="4" fill="#4a2f18" stroke="${INK}" stroke-width="4"/>
      <text x="112" y="376" text-anchor="middle" font-family="Oswald" font-size="21" font-weight="700" fill="${GOLD}">TROFÉUS</text></g>`
    : `<g opacity=".4"><rect x="24" y="176" width="176" height="228" rx="6" fill="none" stroke="${INK}" stroke-width="5" stroke-dasharray="12 9"/><text x="112" y="300" text-anchor="middle" font-family="Oswald" font-size="18" font-weight="700" fill="rgba(12,12,12,.55)">ESTANTE</text></g>`}

  <!-- 👕 MANTO EMOLDURADO -->
  ${cheia ? `<g transform="translate(224,104)"><rect x="0" y="0" width="106" height="140" rx="6" fill="#F4ECD6" stroke="${INK}" stroke-width="6"/>
      <path d="M26 22 L42 14 h22 l16 8 10 14 -13 12 -4 -5 v52 h-40 v-52 l-4 5 -13 -12 z" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
      ${[38, 49, 60, 71].map(x => `<rect x="${x}" y="32" width="5.5" height="62" fill="${GREEN}"/>`).join('')}
      <text x="53" y="128" text-anchor="middle" font-family="Oswald" font-size="14" font-weight="700" fill="${INK}">O MANTO</text></g>`
    : `<g opacity=".35"><rect x="224" y="104" width="106" height="140" rx="6" fill="none" stroke="${INK}" stroke-width="5" stroke-dasharray="12 9"/></g>`}

  <!-- 🛡️ ESCUDO NA PAREDE -->
  <g transform="translate(354,92)"><path d="M40 0 L78 13 V55 C78 81 60 96 40 104 C20 96 2 81 2 55 V13 Z" fill="${GREEN}" stroke="${INK}" stroke-width="6"/>
    <path d="M40 12 L66 21 V54 C66 71 54 82 40 88 Z" fill="#0f5a2b"/>
    <text x="40" y="66" text-anchor="middle" font-family="Oswald" font-size="38" font-weight="700" fill="#fff">T</text></g>

  <!-- 🐯 MASCOTE NO PEDESTAL -->
  ${cheia ? `<g transform="translate(496,300)"><rect x="0" y="66" width="80" height="104" rx="5" fill="#CFC7B1" stroke="${INK}" stroke-width="5"/>
      <rect x="-10" y="162" width="100" height="16" rx="4" fill="#9a927c" stroke="${INK}" stroke-width="4"/>
      <text x="40" y="58" text-anchor="middle" font-size="66">🐯</text>
      <text x="40" y="122" text-anchor="middle" font-family="Oswald" font-size="13" font-weight="700" fill="${INK}">O</text>
      <text x="40" y="140" text-anchor="middle" font-family="Oswald" font-size="13" font-weight="700" fill="${INK}">TIGRÃO</text></g>` : ''}

  <!-- 🌿 PLANTA -->
  ${cheia ? `<g transform="translate(34,452)"><rect x="0" y="62" width="56" height="52" rx="6" fill="#b5642f" stroke="${INK}" stroke-width="5"/>
      <path d="M28 62 C-8 34 8 -8 28 10 C48 -8 64 34 28 62 Z" fill="${GREEN}" stroke="${INK}" stroke-width="5"/></g>` : ''}

  <!-- 🪑 TAPETE, POLTRONA E MESA -->
  ${cheia ? `<ellipse cx="300" cy="530" rx="220" ry="52" fill="url(#tapete)" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="300" cy="530" rx="176" ry="38" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/>` : ''}
  ${cheia ? `<g><rect x="252" y="300" width="96" height="112" rx="26" fill="#4a2f18" stroke="${INK}" stroke-width="6"/>
      <rect x="266" y="316" width="68" height="84" rx="18" fill="#63401f"/>
      <rect x="146" y="408" width="308" height="30" rx="7" fill="#8B5A2B" stroke="${INK}" stroke-width="6"/>
      <rect x="164" y="438" width="272" height="64" rx="5" fill="#6b4420" stroke="${INK}" stroke-width="5"/>
      ${[210, 300, 390].map(x => `<rect x="${x - 26}" y="452" width="52" height="9" rx="3" fill="#4a2f18"/>`).join('')}</g>`
    : `<g><rect x="212" y="352" width="176" height="14" rx="4" fill="#b9ad90" stroke="${INK}" stroke-width="5"/>
       <line x1="230" y1="366" x2="222" y2="430" stroke="${INK}" stroke-width="5"/><line x1="370" y1="366" x2="378" y2="430" stroke="${INK}" stroke-width="5"/>
       <g transform="translate(420,318)"><rect x="0" y="0" width="46" height="46" rx="6" fill="#cfd8e0" stroke="${INK}" stroke-width="5"/><circle cx="23" cy="23" r="13" fill="none" stroke="${INK}" stroke-width="4"/><rect x="14" y="46" width="18" height="40" fill="#cfd8e0" stroke="${INK}" stroke-width="4"/></g>
       <g transform="translate(96,120)"><rect x="0" y="0" width="66" height="86" rx="4" fill="#fff" stroke="${INK}" stroke-width="5"/><rect x="0" y="0" width="66" height="20" fill="${RED}" stroke="${INK}" stroke-width="4"/><text x="33" y="60" text-anchor="middle" font-family="Oswald" font-size="26" font-weight="700" fill="${INK}">12</text></g>`}

  <!-- 💎 O DIAMANTE NA REDOMA (o xodó, no meio da mesa) -->
  ${cheia ? `<g transform="translate(384,324)">
      <path d="M-30 84 a30 42 0 0 1 60 0 z" fill="rgba(180,228,255,.38)" stroke="${INK}" stroke-width="4"/>
      <path d="M-17 60 a18 28 0 0 1 12 -26" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="4"/>
      <g transform="translate(0,56)"><path d="M0 -24 L18 -8 L0 20 L-18 -8 Z" fill="#8fe3ff" stroke="${INK}" stroke-width="3.5"/>
        <path d="M-18 -8 h36" stroke="${INK}" stroke-width="3"/><path d="M0 -24 L-6 -8 L0 20 L6 -8 Z" fill="rgba(255,255,255,.55)" stroke="none"/></g>
      <rect x="-34" y="84" width="68" height="12" rx="3" fill="#3b2a16" stroke="${INK}" stroke-width="4"/>
    </g>` : ''}

  ${cheia ? `<g transform="translate(384,452)"><rect x="-52" y="0" width="104" height="20" rx="5" fill="${INK}"/>
      <text x="0" y="15" text-anchor="middle" font-family="Oswald" font-size="12" font-weight="700" fill="${GOLD}">O DIAMANTE</text></g>` : ''}
  <rect x="3" y="3" width="634" height="614" rx="12" fill="none" stroke="${INK}" stroke-width="6"/>
</svg>`

// ── 🚗 A GARAGEM (aba própria, pedido do Diego) ─────────────────────────────
const carroSvg = (tipo, cor, x, y, esc = 1) => {
  const teto = tipo === 'fusca' ? 'M32 34 C40 6 92 6 100 34 Z' : tipo === 'sport' ? 'M28 34 L48 14 h44 l20 20 Z' : 'M30 34 L44 10 h48 l14 24 Z'
  return `<g transform="translate(${x},${y}) scale(${esc})">
    <path d="${teto}" fill="#bfe0f0" stroke="${INK}" stroke-width="4"/>
    <path d="M8 34 h116 a10 10 0 0 1 10 10 v18 a6 6 0 0 1 -6 6 h-124 a6 6 0 0 1 -6 -6 v-18 a10 10 0 0 1 10 -10 z" fill="${cor}" stroke="${INK}" stroke-width="4.5"/>
    <circle cx="34" cy="68" r="14" fill="#22201c" stroke="${INK}" stroke-width="4"/><circle cx="34" cy="68" r="5" fill="#cfcfcf"/>
    <circle cx="102" cy="68" r="14" fill="#22201c" stroke="${INK}" stroke-width="4"/><circle cx="102" cy="68" r="5" fill="#cfcfcf"/>
    <rect x="118" y="42" width="12" height="8" rx="3" fill="${GOLD}" stroke="${INK}" stroke-width="2.5"/>
    <rect x="6" y="42" width="10" height="8" rx="3" fill="#E8503A" stroke="${INK}" stroke-width="2.5"/>
  </g>`
}
const garagemSvg = `<svg viewBox="0 0 640 420" style="width:100%;display:block">
  <rect x="0" y="0" width="640" height="300" fill="#D9D2C2"/>
  <rect x="0" y="300" width="640" height="120" fill="#8d867a"/>
  <rect x="0" y="292" width="640" height="12" fill="#5c564d"/>
  <!-- porta basculante meio aberta -->
  <rect x="26" y="16" width="588" height="70" rx="5" fill="#b9b2a2" stroke="${INK}" stroke-width="6"/>
  ${[30, 46, 62].map(y => `<line x1="32" y1="${y}" x2="608" y2="${y}" stroke="#8d867a" stroke-width="4"/>`).join('')}
  <rect x="26" y="86" width="588" height="10" fill="${INK}"/>
  <!-- vagas pintadas no chão -->
  ${[[40, 'vaga 1', true], [232, 'vaga 2', false], [424, 'vaga 3', false]].map(([x, lbl, cheia]) => `
    <g><path d="M${x} 300 h176 l26 96 h-228 z" fill="${cheia ? 'rgba(255,196,0,.18)' : 'rgba(0,0,0,.06)'}" stroke="#F4ECD6" stroke-width="4" stroke-dasharray="${cheia ? '0' : '14 10'}"/>
    <text x="${x + 92}" y="386" text-anchor="middle" font-family="Oswald" font-size="17" font-weight="700" fill="${cheia ? INK : 'rgba(255,255,255,.75)'}">${cheia ? 'FUSCA 78' : lbl}</text></g>`).join('')}
  ${carroSvg('fusca', '#2F6BAE', 52, 248, 1.24)}
  <!-- placa na parede -->
  <g transform="translate(360,120)"><rect x="0" y="0" width="240" height="66" rx="8" fill="${INK}" stroke="${INK}" stroke-width="5"/>
    <text x="120" y="29" text-anchor="middle" font-family="Oswald" font-size="17" font-weight="700" fill="${GOLD}">GARAGEM</text>
    <text x="120" y="52" text-anchor="middle" font-family="Oswald" font-size="17" font-weight="700" fill="#fff">DA PRESIDÊNCIA</text></g>
  <rect x="3" y="3" width="634" height="414" rx="12" fill="none" stroke="${INK}" stroke-width="6"/>
</svg>`

const CARROS_LOJA = [
  ['🚜', 'Fusca 78 sem banco de trás', 'Várzea', 12, 'tem'],
  ['🚙', 'Brasília amarela', 'Série D', 24, 'pode'],
  ['🚗', 'Gol quadrado turbo', 'Série C', 40, 'pode'],
  ['🚐', 'Uno com escada no teto', 'Série B', 60, 'caro'],
  ['🏎️', 'Importado de vidro fumê', 'Série A', 120, 'trava'],
]
const garagem = `<div class="box" style="padding:0;overflow:hidden;margin-bottom:9px">
  ${garagemSvg}
  <div style="border-top:3px solid ${INK};padding:9px 12px">
    <div class="row" style="justify-content:space-between">
      <div><div class="tit">🚗 A garagem</div><div class="sob">1 carro · 3 vagas. Mais vagas com a obra 🅿️ Estacionamento no estádio.</div></div>
      <span class="pill" style="background:${GOLD}">🪙 128</span>
    </div>
  </div>
</div>
<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="tit">🛒 A concessionária</div>
  <div class="sob" style="margin-bottom:9px">Cada carro pede a divisão dele. Ninguém compra importado na Várzea.</div>
  ${CARROS_LOJA.map(([ic, nome, div, preco, st]) => {
    const bg = st === 'tem' ? '#E4F4E8' : st === 'trava' ? '#EFEADB' : st === 'caro' ? '#FBE3DF' : '#fff'
    const bt = st === 'tem' ? `<span class="pill" style="background:${GREEN};color:#fff">na vaga ✓</span>`
      : st === 'pode' ? `<span class="pill" style="background:${GOLD}">🪙 ${preco} · comprar</span>`
      : st === 'caro' ? `<span class="pill" style="background:#EFEADB;color:rgba(12,12,12,.5)">🪙 ${preco} · falta caixa</span>`
      : `<span class="pill" style="background:#EFEADB;color:rgba(12,12,12,.5)">🔒 só na Série A</span>`
    return `<div class="row" style="justify-content:space-between;gap:8px;background:${bg};border:2px solid ${INK};border-radius:10px;padding:4px 8px;margin-bottom:4px">
      <span class="row" style="gap:8px;min-width:0"><span style="font-size:18px;line-height:1">${ic}</span>
        <span style="min-width:0"><b style="font-size:11px">${nome}</b><div class="sob" style="font-size:8.5px">a partir da ${div}</div></span></span>
      ${bt}</div>`
  }).join('')}
  <div style="border:2px dashed rgba(12,12,12,.3);border-radius:10px;padding:6px 8px;font-size:9.5px;margin-top:3px" class="muted">
    🔒 Não vende se o caixa ficar sem cobrir a folha. E carro <b>não dá vantagem nenhuma</b> em campo — é só o seu status.
  </div>
</div>
<div class="box" style="padding:10px 12px;margin-bottom:9px;background:linear-gradient(160deg,#FFF7E0,#FFEBB0)">
  <div class="tit">📰 O que o jornal disse</div>
  <div class="sob" style="margin-top:5px;font-style:italic">“O Tigres do Asfalto não contratou ninguém nesta janela. Mas o presidente Diego Fonseca chegou de Fusca zero pra reunião do conselho.”</div>
</div>`


const salaMontada = `<div class="box" style="padding:0;overflow:hidden;margin-bottom:9px">
  ${salaSvg(true)}
  <div style="border-top:3px solid ${INK};padding:8px 11px">
    <div class="row" style="justify-content:space-between">
      <div><div class="tit">🏛️ A sua sala</div><div class="sob">7 de 14 peças · cada uma você comprou.</div></div>
      <span class="pill" style="background:${GOLD}">Série B</span>
    </div>
    <div style="height:8px;border:2.5px solid ${INK};border-radius:999px;margin:8px 0 7px;background:#fff;overflow:hidden"><div style="width:50%;height:100%;background:${GOLD}"></div></div>
    <a class="btn" style="width:100%;background:${GOLD}">🛒 Mobiliar a sala</a>
  </div>
</div>`

const salaVazia = `<div class="box" style="padding:0;overflow:hidden;margin-bottom:9px">
  ${salaSvg(false)}
  <div style="border-top:3px solid ${INK};padding:8px 11px">
    <div class="row" style="justify-content:space-between">
      <div><div class="tit">🏛️ A sua sala</div><div class="sob">0 de 14 peças. Mesa de plástico e um ventilador.</div></div>
      <span class="pill">Várzea</span>
    </div>
    <div style="height:8px;border:2.5px solid ${INK};border-radius:999px;margin:8px 0 7px;background:#fff;overflow:hidden"><div style="width:0%;height:100%;background:${GOLD}"></div></div>
    <a class="btn" style="width:100%;background:${GOLD}">🛒 Mobiliar a sala</a>
    <div class="sob" style="margin-top:6px">Tudo se compra com o caixa do clube — o MESMO que contrata jogador e faz obra no estádio. Comprar aqui é escolha, não presente.</div>
  </div>
</div>`

// ── 🛒 A LOJA DA PRESIDÊNCIA ────────────────────────────────────────────────
const LOJA = [
  ['🪑', 'Poltrona de couro', 8, 'tem', ''],
  ['🖼️', 'Escudo na parede', 6, 'tem', ''],
  ['🏆', 'Estante de troféus', 14, 'tem', 'as taças saem da gaveta e vão pra parede'],
  ['👕', 'Manto emoldurado', 10, 'tem', 'só sócio ⭐'],
  ['🐯', 'Mascote no pedestal', 12, 'tem', 'só clube batizado'],
  ['💎', 'O diamante na redoma', 40, 'tem', 'o xodó da sala'],
  ['🪟', 'Janela pro estádio', 18, 'tem', 'de noite os refletores acendem'],
  ['🚗', 'Carro na garagem', 60, 'pode', 'o importado só na Série A'],
  ['🎱', 'Mesa de sinuca', 22, 'pode', ''],
  ['🐟', 'Aquário', 16, 'pode', ''],
  ['🍾', 'Bar com champanhe', 20, 'caro', 'abre sozinho no acesso'],
  ['🗿', 'Busto do fundador', 35, 'caro', ''],
]
const loja = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="row" style="justify-content:space-between">
    <div><div class="tit">🛒 Mobiliar a sala</div><div class="sob">Sai do caixa do clube. O que você gasta aqui não contrata jogador.</div></div>
    <span class="pill" style="background:${GOLD}">🪙 128</span>
  </div>
  <div style="margin-top:9px">
  ${LOJA.map(([ic, nome, preco, st, obs]) => {
    const cor = st === 'tem' ? '#E4F4E8' : st === 'caro' ? '#FBE3DF' : '#fff'
    const bt = st === 'tem' ? `<span class="pill" style="background:${GREEN};color:#fff">na sala ✓</span>`
      : st === 'pode' ? `<span class="pill" style="background:${GOLD}">🪙 ${preco} · comprar</span>`
      : `<span class="pill" style="background:#EFEADB;color:rgba(12,12,12,.5)">🪙 ${preco} · falta caixa</span>`
    return `<div class="row" style="justify-content:space-between;gap:8px;background:${cor};border:2px solid ${INK};border-radius:10px;padding:5px 8px;margin-bottom:5px">
      <span class="row" style="gap:7px;min-width:0"><span style="font-size:17px;line-height:1">${ic}</span><span style="min-width:0"><b style="font-size:11px">${nome}</b>${obs ? `<div class="sob" style="font-size:8.5px">${obs}</div>` : ''}</span></span>
      ${bt}</div>`
  }).join('')}
  </div>
  <div style="border:2px dashed rgba(12,12,12,.3);border-radius:10px;padding:6px 8px;font-size:9.5px;margin-top:3px" class="muted">
    🔒 <b>Trava:</b> a loja não deixa comprar se o caixa ficar sem cobrir a folha salarial da temporada — e diz quanto falta. Ninguém quebra o clube comprando poltrona.
  </div>
</div>`


// ── 📲 O CARTÃO: a sala vira IMAGEM pra mandar no grupo ─────────────────────
// (o código de gerar imagem + navigator.share JÁ existe no jornal.tsx / jornal-sala.tsx)
const cartao = `<div class="box" style="padding:0;overflow:hidden;margin-bottom:9px;background:${INK}">
  <div style="padding:9px 12px;display:flex;justify-content:space-between;align-items:center">
    <div><div class="osw" style="font-size:9.5px;color:${GOLD};letter-spacing:.09em">Cartão da presidência</div>
      <div class="osw" style="font-size:17px;color:#fff;line-height:1.05">Tigres do Asfalto</div>
      <div style="font-size:9px;color:rgba(255,255,255,.6)">Presidente Diego Fonseca · 7 temporadas</div></div>
    <div style="text-align:right"><div class="osw" style="font-size:22px;color:${GOLD};line-height:1">8 🏆</div><div style="font-size:8.5px;color:rgba(255,255,255,.55)">7 de 14 peças</div></div>
  </div>
  <div style="border-top:3px solid ${INK};border-bottom:3px solid ${INK}">${salaSvg(true)}</div>
  <div style="padding:8px 12px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
    <span class="pill" style="background:${GOLD}">💎 Diamante</span><span class="pill" style="background:#fff">🚗 Garagem</span>
    <span class="pill" style="background:#fff">🐯 Mascote</span><span style="margin-left:auto;font-size:8.5px;color:rgba(255,255,255,.5)">leilaolegends.com</span>
  </div>
</div>
<a class="btn" style="width:100%;background:#1faa54;color:#fff;margin-bottom:9px">📲 Mandar a sala no grupo</a>
<div class="sob" style="margin-bottom:9px;text-align:center">Vira imagem, igual à capa d'O Martelo. É a sala inteira, do jeito que você montou.</div>`

// ── 🚪 AS SALAS DA GALERA (status só existe se tiver quem veja) ─────────────
const VIZINHOS = [['Neymarzetti', 'Braguinha', 12, 14, '👑'], ['Nightfull FC', 'Rafa', 9, 14, '⭐'], ['Marolados FC', 'Tuca', 4, 14, ''], ['SC Ferrari', 'Léo', 1, 14, '']]
const vizinhos = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="row" style="justify-content:space-between">
    <div><div class="tit">🚪 As salas da galera</div><div class="sob">Entre e veja como está a sala dos seus amigos.</div></div>
    <span class="pill">👀 23 visitas</span>
  </div>
  <div style="margin-top:9px">
  ${VIZINHOS.map(([time, dono, n, tot, selo]) => `<div class="row" style="justify-content:space-between;gap:8px;border:2px solid ${INK};border-radius:10px;padding:5px 8px;margin-bottom:5px;background:#fff">
    <span class="row" style="gap:7px;min-width:0">${esc(time === 'Neymarzetti' ? PURPLE : time === 'Nightfull FC' ? '#2F6BAE' : time === 'Marolados FC' ? RED : '#8a6d1f', 22)}
      <span style="min-width:0"><b style="font-size:11px">${selo} ${time}</b><div class="sob" style="font-size:8.5px">presidente ${dono} · ${n}/${tot} peças</div></span></span>
    <span class="pill" style="background:${GOLD}">entrar</span></div>`).join('')}
  </div>
  <div class="sob">Só na sala online e nas Minhas Ligas. Ninguém mexe na sala do outro — é só olhar.</div>
</div>`

// ── 🎪 TORCIDÔMETRO ─────────────────────────────────────────────────────────
const torcida = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="row" style="justify-content:space-between">
    <div class="row" style="gap:9px"><span style="font-size:26px;line-height:1">😃</span>
      <div><div class="tit">🎪 A torcida</div><div class="sob">Como a arquibancada te vê hoje.</div></div></div>
    <div class="osw" style="font-size:26px;line-height:1;color:${GREEN}">72%</div>
  </div>
  <div style="height:9px;border:2.5px solid ${INK};border-radius:999px;margin:9px 0 8px;background:#fff;overflow:hidden"><div style="width:72%;height:100%;background:${GREEN}"></div></div>
  <div class="row" style="gap:5px;flex-wrap:wrap">
    <span class="chip" style="background:#E4F4E8">▲ 3º lugar <b>+6</b></span>
    <span class="chip" style="background:#E4F4E8">▲ Copa Legends <b>+4</b></span>
    <span class="chip" style="background:#FBE3DF">▼ Caiu na estreia <b>-2</b></span>
  </div>
</div>`

// ── 🧢 O SEU TÉCNICO (a ficha sai do Elenco e vem pra cá) ───────────────────
const tecnico = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="tit">🧢 O seu técnico</div>
  <div class="sob" style="margin-bottom:9px">Quem comanda o time em campo — e os esquemas que ele te libera.</div>
  <div class="row" style="gap:10px;align-items:stretch">
    <div style="width:88px;flex:none;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};background:linear-gradient(160deg,#FFF7E0,#FFD34D);padding:7px 5px;text-align:center">
      <div style="font-size:9px" class="osw">👑 Lenda</div>
      <div style="width:44px;height:44px;border-radius:50%;border:2.5px solid ${INK};background:#fff;margin:5px auto 4px;line-height:42px;font-size:22px">🧢</div>
      <div class="osw" style="font-size:11px;line-height:1.1">Zinedine<br>Zidane</div>
      <div class="osw" style="font-size:17px;margin-top:3px">88</div>
    </div>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:5px">
      <div class="row" style="justify-content:space-between;font-size:11px"><span class="muted">Contrato</span><b>3ª de 5 temporadas</b></div>
      <div style="height:7px;border:2px solid ${INK};border-radius:999px;background:#fff;overflow:hidden"><div style="width:60%;height:100%;background:${GOLD}"></div></div>
      <div class="row" style="justify-content:space-between;font-size:11px"><span class="muted">Salário</span><b>🪙 12 / temporada</b></div>
      <div class="row" style="gap:4px;flex-wrap:wrap;margin-top:2px">
        ${['4-3-3', '4-4-2', '4-3-1-2', '4-2-3-1', '3-5-2'].map(f => `<span class="chip" style="font-size:9.5px;padding:1px 5px">${f}</span>`).join('')}
      </div>
    </div>
  </div>
  <div style="margin-top:9px;border:2.5px solid ${INK};border-radius:11px;background:#FFF7E0;padding:7px 9px">
    <div class="row" style="justify-content:space-between">
      <span class="row" style="gap:6px"><span style="font-size:20px;line-height:1">😐</span><span><b style="font-size:11px">Humor do técnico</b><div class="sob">Como ele está com a diretoria.</div></span></span>
      <span class="osw" style="font-size:18px;color:#B8860B">54%</span>
    </div>
    <div style="height:7px;border:2px solid ${INK};border-radius:999px;background:#fff;overflow:hidden;margin:6px 0 5px"><div style="width:54%;height:100%;background:${GOLD}"></div></div>
    <div class="row" style="gap:4px;flex-wrap:wrap">
      <span class="chip" style="font-size:9.5px;background:#E4F4E8">▲ Copa Legends</span>
      <span class="chip" style="font-size:9.5px;background:#FBE3DF">▼ caiu pra C com um Lenda no banco</span>
    </div>
    <div class="sob" style="margin-top:5px">Abaixo de 30% no fim do contrato, ele <b>não renova</b> — e avisa uma temporada antes.</div>
  </div>
  <div style="margin-top:8px" class="sob">Quer outro técnico? A sondagem continua na tela antes do leilão, aba 🕵️ <b>Sondar</b>.</div>
</div>`

// ── 🏆 SALA DE TROFÉUS (sai do Rank e vem pra cá) ───────────────────────────
const TROF = [['A', 'Série A', 1, GOLD, INK], ['B', 'Série B', 2, '#D8D8D8', INK], ['C', 'Série C', 1, '#C98B4B', '#fff'], ['CP', 'Copa Legends', 3, PURPLE, '#fff'], ['SU', 'Supercopa', 1, GREEN, '#fff']]
const trofeus = `<div class="box" style="padding:10px 12px;margin-bottom:9px;background:linear-gradient(160deg,#FFF7E0,#FFEBB0)">
  <div class="tit">🏆 Sala de Troféus</div>
  <div class="sob" style="margin-bottom:9px">A estante do clube — tudo que você levantou nesta carreira.</div>
  <div class="row" style="gap:7px;flex-wrap:wrap">
    ${TROF.map(([, l, n, bg, c]) => `<div class="trof" style="background:${bg};color:${c}">
      <div style="font-size:26px;line-height:1">🏆</div><div class="osw" style="font-size:14px;margin-top:1px">×${n}</div>
      <div class="osw" style="font-size:8.5px;margin-top:1px;opacity:.92">${l}</div></div>`).join('')}
  </div>
  <div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">
    <span class="pill" style="background:${INK};color:#fff">Total: 8 🏆</span>
    <span class="pill" style="background:${GOLD}">⭐ Série A</span>
    <span class="pill" style="background:#fff">Hoje na Série B</span>
  </div>
</div>`

// ── 📼 A PAREDE DA HISTÓRIA (dado que já existe: careerCronica) ─────────────
const HIST = [
  [1, 'Várzea', 'campeao', 'Campeão · subiu'],
  [2, 'Série D', '', '7º lugar'],
  [3, 'Série D', 'campeao', 'Campeão · subiu'],
  [4, 'Série C', 'copa', 'Copa Legends 🏆'],
  [5, 'Série C', 'campeao', 'Campeão · subiu'],
  [6, 'Série B', 'caiu', 'Caiu pra Série C'],
  [7, 'Série B', 'hoje', 'Em andamento'],
]
const parede = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="tit">📼 A parede da história</div>
  <div class="sob" style="margin-bottom:9px">Temporada a temporada, desde o primeiro dia do clube.</div>
  ${HIST.map(([t, div, tipo, txt]) => {
    const cor = tipo === 'campeao' ? GOLD : tipo === 'copa' ? PURPLE : tipo === 'caiu' ? RED : tipo === 'hoje' ? '#fff' : '#EFEADB'
    const letra = tipo === 'copa' || tipo === 'caiu' ? '#fff' : INK
    return `<div class="row" style="gap:8px;padding:4px 0;border-bottom:1px solid rgba(12,12,12,.07)">
      <span class="osw" style="width:26px;flex:none;font-size:10px;color:rgba(12,12,12,.45)">T${t}</span>
      <span style="width:9px;height:9px;flex:none;border-radius:50%;border:2px solid ${INK};background:${cor}"></span>
      <b style="font-size:11px;width:62px;flex:none">${div}</b>
      <span style="font-size:10.5px;background:${cor};color:${letra};border:2px solid ${INK};border-radius:7px;padding:1px 6px">${txt}</span>
    </div>`
  }).join('')}
</div>`

// ── 📊 A PLACA (contas em cima da mesma crônica) ───────────────────────────
const PLACA = [['🗓️', '7', 'temporadas no comando'], ['🏆', '8', 'títulos no total'], ['⬆️', '3', 'acessos'], ['⬇️', '1', 'queda'], ['🅰️', '1', 'temporada na Série A'], ['⏳', '2', 'sem título (jejum atual)']]
const placa = `<div class="box" style="padding:10px 12px;margin-bottom:9px">
  <div class="tit">📊 A placa do clube</div>
  <div class="sob" style="margin-bottom:9px">Os números da sua gestão, do primeiro dia até hoje.</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
    ${PLACA.map(([i, n, t]) => `<div style="border:2.5px solid ${INK};border-radius:11px;background:#FFFDF5;padding:7px 8px">
      <div class="row" style="gap:5px"><span style="font-size:14px">${i}</span><span class="osw" style="font-size:19px;line-height:1">${n}</span></div>
      <div class="sob" style="margin-top:2px">${t}</div></div>`).join('')}
  </div>
</div>`

const atalhos = `<div class="row" style="gap:6px;margin-bottom:9px">
  <a class="btn" style="flex:1">💰 Finanças</a><a class="btn" style="flex:1">🤝 Patrocínio</a><a class="btn" style="flex:1">💼 Agência</a>
</div>`

// ══ 📱 TELA 1 — a SALA montada (o desenho é a primeira coisa) ═══════════════
const cel1 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${mesa}${salaMontada}${torcida}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 2 — a mesma sala no começo (Várzea), pra ver a diferença ════════
const cel2 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${mesa}${salaVazia}${simbolos}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 3B — A GARAGEM (aba própria) ═══════════════════════════════════
const celGar = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${garagem}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 3 — a loja ══════════════════════════════════════════════════════
const cel3 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${loja}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 4 — STATUS: o cartão pro grupo + as salas da galera ═════════════
const cel4 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${cartao}${vizinhos}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 5 — técnico (com humor) e troféus ═══════════════════════════════
const cel5 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${tecnico}${trofeus}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 6 — história: parede, craque, condecorações e placa ═════════════
const cel6 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${parede}${craque}${condec}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 💻 PC LARGO — tudo ══════════════════════════════════════════════════════
const desk = `<style>${CSS} body{width:1440px;height:2500px;overflow:hidden;padding:16px 22px}</style>
<div style="max-width:1180px;margin:0 auto">
  ${faixa}
  <div class="row" style="gap:6px;margin-bottom:12px">
    ${[['🏟️', 'Estádio'], ['💰', 'Finanças'], ['🤝', 'Patrocínio'], ['💼', 'Agência'], ['🏛️', 'Presidência']]
      .map(([i, t]) => `<div class="sub${t === 'Presidência' ? ' on' : ''}" style="flex:0 0 auto;padding:6px 16px;font-size:11px">${i} ${t}</div>`).join('')}
  </div>
  ${mesa}
  <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:14px;align-items:start">
    <div>${salaMontada}${garagem}${torcida}${tecnico}${parede}</div>
    <div>${loja}${trofeus}${vizinhos}${craque}${condec}</div>
  </div>
  ${placa}
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, html, w, h, dpr] of [['cel-1-sala', cel1, 390, 844, 2], ['cel-2-vazia', cel2, 390, 844, 2], ['cel-3-loja', cel3, 390, 844, 2], ['cel-3b-garagem', celGar, 390, 844, 2], ['cel-4-status', cel4, 390, 844, 2], ['cel-5-tecnico', cel5, 390, 844, 2], ['cel-6-historia', cel6, 390, 844, 2], ['pc-presidencia', desk, 1440, 2500, 1]]) {
  const p = `${OUT}/${nome}.html`; writeFileSync(p, `<!doctype html><meta charset="utf-8">${html}`)
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  await pg.goto('file://' + p); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200)
  await pg.screenshot({ path: `${OUT}/${nome}.png` }); await pg.close(); console.log(`${OUT}/${nome}.png`)
}
await b.close()
