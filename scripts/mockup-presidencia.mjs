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

// ── 🚗 A GARAGEM — prêmios de fim de ano (Diego: "igual a Audi sempre deu pro Real Madrid") ──
const CARROS = [['T1', 'Várzea', '🚜', 'Fusca 78 sem banco de trás', 'Vadico'], ['T3', 'Série D', '🚙', 'Brasília amarela', 'ERO'], ['T5', 'Série C', '🚗', 'Gol quadrado turbo', 'Rei das Tintas'], ['T6', 'Série B', '🏎️', 'Importado de vidro fumê', 'Max Joias']]
const garagem = `<div class="box" style="padding:10px 12px;margin-bottom:9px;background:linear-gradient(160deg,#fff,#EFEADB)">
  <div class="row" style="justify-content:space-between">
    <div><div class="tit">🚗 A garagem da diretoria</div><div class="sob">Bateu a meta do patrocínio? O patrocinador dá carro pro presidente e pro craque do ano.</div></div>
    <span class="pill" style="background:${INK};color:#fff">4 carros</span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px">
    ${CARROS.map(([t, div, ic, nome, marca]) => `<div style="border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:7px 8px;box-shadow:2px 2px 0 ${INK}">
      <div class="row" style="justify-content:space-between"><span style="font-size:22px;line-height:1">${ic}</span><span class="pill" style="font-size:8.5px">${t} · ${div}</span></div>
      <div style="font-size:10.5px;font-weight:900;margin-top:4px;line-height:1.2">${nome}</div>
      <div class="sob">presente do ${marca}</div></div>`).join('')}
  </div>
  <div style="margin-top:8px;border:2px dashed rgba(12,12,12,.3);border-radius:10px;padding:6px 8px;font-size:9.5px" class="muted">T7 · Série B — <b>meta: subir</b>. Bateu, ganha o carro da Série B. Não bateu, a garagem fica como está.</div>
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
const salaSvg = (cheia) => `<svg viewBox="0 0 720 340" style="width:100%;display:block">
  <defs>
    <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16233f"/><stop offset="1" stop-color="#2d4a6b"/></linearGradient>
    <linearGradient id="tapete" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d2f2a"/><stop offset="1" stop-color="#a83f36"/></linearGradient>
  </defs>
  <!-- parede e chão -->
  <rect x="0" y="0" width="720" height="250" fill="#E9DEC2"/>
  <rect x="0" y="250" width="720" height="90" fill="#7A4A26"/>
  ${[0, 90, 180, 270, 360, 450, 540, 630].map(x => `<line x1="${x}" y1="250" x2="${x - 18}" y2="340" stroke="#5e3719" stroke-width="2"/>`).join('')}
  <rect x="0" y="238" width="720" height="14" fill="#5e3719"/>
  <!-- janela com o estádio à noite -->
  <rect x="516" y="34" width="172" height="122" rx="6" fill="url(#ceu)" stroke="${INK}" stroke-width="5"/>
  ${cheia ? `<g><ellipse cx="602" cy="132" rx="66" ry="20" fill="#1B7A3D"/><rect x="548" y="104" width="108" height="26" rx="4" fill="#3b5a80"/>
    <circle cx="560" cy="70" r="4" fill="${GOLD}"/><circle cx="644" cy="70" r="4" fill="${GOLD}"/>
    <line x1="560" y1="74" x2="560" y2="104" stroke="#8fa4bd" stroke-width="3"/><line x1="644" y1="74" x2="644" y2="104" stroke="#8fa4bd" stroke-width="3"/></g>`
    : `<circle cx="660" cy="62" r="13" fill="#f1e4a8"/>`}
  <line x1="602" y1="34" x2="602" y2="156" stroke="${INK}" stroke-width="4"/><line x1="516" y1="95" x2="688" y2="95" stroke="${INK}" stroke-width="4"/>
  <!-- ESTANTE DE TROFÉUS -->
  ${cheia ? `<g><rect x="26" y="52" width="152" height="198" rx="6" fill="#8B5A2B" stroke="${INK}" stroke-width="5"/>
    ${[86, 130, 174].map(y => `<rect x="34" y="${y}" width="136" height="7" fill="#5e3719"/>`).join('')}
    ${[[52, 78], [86, 78], [120, 78], [52, 122], [86, 122], [120, 122], [66, 166], [110, 166]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-6" y="10" width="12" height="4" fill="${GOLD}" stroke="${INK}" stroke-width="1.5"/><path d="M-7 -8 h14 v8 a7 7 0 0 1 -14 0 z" fill="${GOLD}" stroke="${INK}" stroke-width="1.5"/><path d="M-7 -5 h-4 a4 4 0 0 0 4 5 M7 -5 h4 a4 4 0 0 1 -4 5" fill="none" stroke="${INK}" stroke-width="1.5"/></g>`).join('')}
    <rect x="34" y="210" width="136" height="34" rx="3" fill="#6b4420" stroke="${INK}" stroke-width="3"/>
    <text x="102" y="232" text-anchor="middle" font-family="Oswald" font-size="15" font-weight="700" fill="${GOLD}">TROFÉUS</text></g>`
    : `<g opacity=".45"><rect x="26" y="150" width="152" height="100" rx="4" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="9 7"/><text x="102" y="205" text-anchor="middle" font-family="Oswald" font-size="13" font-weight="700" fill="rgba(12,12,12,.6)">ESTANTE</text></g>`}
  <!-- ESCUDO NA PAREDE -->
  <g transform="translate(300,42)"><path d="M28 0 L54 9 V38 C54 56 42 66 28 72 C14 66 2 56 2 38 V9 Z" fill="${GREEN}" stroke="${INK}" stroke-width="5"/><path d="M28 8 L46 14 V37 C46 49 38 56 28 60 Z" fill="#0f5a2b"/><text x="28" y="46" text-anchor="middle" font-family="Oswald" font-size="26" font-weight="700" fill="#fff">T</text></g>
  <!-- MANTO EMOLDURADO -->
  ${cheia ? `<g transform="translate(196,60)"><rect x="0" y="0" width="86" height="104" rx="5" fill="#F4ECD6" stroke="${INK}" stroke-width="5"/>
    <path d="M22 16 L34 10 h18 l12 6 8 10 -10 9 -3 -4 v40 h-32 v-40 l-3 4 -10 -9 z" fill="#fff" stroke="${INK}" stroke-width="3"/>
    ${[30, 39, 48, 57].map(x => `<rect x="${x}" y="24" width="4.5" height="47" fill="${GREEN}"/>`).join('')}
    <text x="43" y="95" text-anchor="middle" font-family="Oswald" font-size="11" font-weight="700" fill="${INK}">O MANTO</text></g>`
    : `<g opacity=".4"><rect x="196" y="60" width="86" height="104" rx="5" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="9 7"/></g>`}
  <!-- MASCOTE NO PEDESTAL -->
  ${cheia ? `<g transform="translate(430,128)"><rect x="0" y="52" width="56" height="60" rx="4" fill="#C9C2AE" stroke="${INK}" stroke-width="4"/><text x="28" y="46" text-anchor="middle" font-size="46">🐯</text><rect x="-6" y="106" width="68" height="10" rx="3" fill="#9a927c" stroke="${INK}" stroke-width="3"/></g>`
    : ''}
  <!-- TAPETE -->
  ${cheia ? `<ellipse cx="330" cy="300" rx="180" ry="34" fill="url(#tapete)" stroke="${INK}" stroke-width="4"/>` : ''}
  <!-- MESA + POLTRONA -->
  ${cheia ? `<g><rect x="252" y="176" width="46" height="58" rx="14" fill="#4a2f18" stroke="${INK}" stroke-width="4"/>
    <rect x="228" y="228" width="212" height="20" rx="5" fill="#8B5A2B" stroke="${INK}" stroke-width="5"/>
    <rect x="240" y="248" width="188" height="42" rx="4" fill="#6b4420" stroke="${INK}" stroke-width="4"/></g>`
    : `<g><rect x="268" y="206" width="120" height="10" rx="3" fill="#b9ad90" stroke="${INK}" stroke-width="4"/>
       <line x1="280" y1="216" x2="276" y2="252" stroke="${INK}" stroke-width="4"/><line x1="376" y1="216" x2="380" y2="252" stroke="${INK}" stroke-width="4"/>
       <rect x="404" y="196" width="34" height="34" rx="4" fill="#cfd8e0" stroke="${INK}" stroke-width="4"/><rect x="410" y="230" width="22" height="22" fill="none" stroke="${INK}" stroke-width="3"/></g>`}
  <!-- 💎 O DIAMANTE NA REDOMA (o xodó — sempre no meio da mesa) -->
  ${cheia ? `<g transform="translate(322,182)">
      <rect x="-22" y="42" width="44" height="8" rx="2" fill="#3b2a16" stroke="${INK}" stroke-width="3"/>
      <path d="M-19 42 a19 26 0 0 1 38 0 z" fill="rgba(180,225,255,.42)" stroke="${INK}" stroke-width="3"/>
      <g transform="translate(0,26)"><path d="M0 -15 L11 -5 L0 12 L-11 -5 Z" fill="#8fe3ff" stroke="${INK}" stroke-width="2.5"/><path d="M-11 -5 h22" stroke="${INK}" stroke-width="2"/><path d="M0 -15 L0 12" stroke="rgba(12,12,12,.35)" stroke-width="1.5"/></g>
    </g>` : ''}
  <!-- PLANTA + CARRO PELA PORTA DA GARAGEM -->
  ${cheia ? `<g transform="translate(628,196)"><rect x="0" y="44" width="34" height="30" rx="4" fill="#b5642f" stroke="${INK}" stroke-width="4"/><path d="M17 44 C-4 26 6 4 17 12 C28 4 38 26 17 44 Z" fill="${GREEN}" stroke="${INK}" stroke-width="4"/></g>` : ''}
  <!-- moldura preta geral -->
  <rect x="2" y="2" width="716" height="336" rx="10" fill="none" stroke="${INK}" stroke-width="5"/>
</svg>`

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
const desk = `<style>${CSS} body{width:1440px;height:1760px;overflow:hidden;padding:16px 22px}</style>
<div style="max-width:1180px;margin:0 auto">
  ${faixa}
  <div class="row" style="gap:6px;margin-bottom:12px">
    ${[['🏟️', 'Estádio'], ['💰', 'Finanças'], ['🤝', 'Patrocínio'], ['💼', 'Agência'], ['🏛️', 'Presidência']]
      .map(([i, t]) => `<div class="sub${t === 'Presidência' ? ' on' : ''}" style="flex:0 0 auto;padding:6px 16px;font-size:11px">${i} ${t}</div>`).join('')}
  </div>
  ${mesa}
  <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:14px;align-items:start">
    <div>${salaMontada}${torcida}${tecnico}${parede}</div>
    <div>${loja}${trofeus}${vizinhos}${craque}${condec}</div>
  </div>
  ${placa}
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, html, w, h, dpr] of [['cel-1-sala', cel1, 390, 844, 2], ['cel-2-vazia', cel2, 390, 844, 2], ['cel-3-loja', cel3, 390, 844, 2], ['cel-4-status', cel4, 390, 844, 2], ['cel-5-tecnico', cel5, 390, 844, 2], ['cel-6-historia', cel6, 390, 844, 2], ['pc-presidencia', desk, 1440, 1760, 1]]) {
  const p = `${OUT}/${nome}.html`; writeFileSync(p, `<!doctype html><meta charset="utf-8">${html}`)
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  await pg.goto('file://' + p); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200)
  await pg.screenshot({ path: `${OUT}/${nome}.png` }); await pg.close(); console.log(`${OUT}/${nome}.png`)
}
await b.close()
