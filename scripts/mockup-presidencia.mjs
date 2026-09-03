// ─── 🏛️ MOCKUP DA SALA DA PRESIDÊNCIA (03/09) ───────────────────────────────
//
// ⚠️ ISTO É REFERÊNCIA DE COMPOSIÇÃO, NÃO É A ARTE FINAL (decidido em 03/09).
// O Diego olhou o desenho em SVG e disse: *"n quero criado a mão estilo svg
// cara"*. A arte final vem de gerador de imagem, em `.webp` por peça — o
// roteiro está em `docs/prompt-arte-presidencia.md`.
//
// O que ESTE arquivo continua valendo: ele resolveu a parte que não é traço —
// o QUE existe em cada divisão, ONDE cada coisa fica, e o que muda na CASCA
// (parede, rodapé, chão, luz) pra a sala parecer que enriqueceu em vez de só
// ganhar objeto. As imagens que ele gera vão junto com o prompt, como
// referência de layout.
//
// 📏 Peso, medido (o Diego achava o contrário, e isso muda o planejamento):
//   · SVG à mão das 5 salas = 15 KB cru → **4,4 KB comprimido**, no bundle,
//     baixado por TODO jogador.
//   · a MESMA sala em .webp 760px q88 = **37 KB** — uma só. Com base + peças +
//     5 divisões, a arte gerada dá uns 400-600 KB.
//   Ou seja: .webp é ~100x mais bytes. Fomos de .webp assim mesmo, e com razão:
//   a Presidência é a área de STATUS, existe pra impressionar, e desenho à mão
//   fica com cara de rascunho. A condição que torna isso seguro é a arte
//   carregar SÓ quando a Presidência abre — quem nunca entra baixa 0 KB.

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


// ── 🏛️ O CENÁRIO DA SALA (v5) ───────────────────────────────────────────────
// Regra que manda aqui: NÃO é um painel onde os objetos são colados — é uma
// sala que ENRIQUECE. A casca muda de divisão em divisão (parede, chão, luz),
// não só os móveis. Quem bate o olho numa screenshot tem que saber na hora se
// o presidente está na miséria ou milionário, sem ler uma palavra.
const ORDEM = ['V', 'D', 'C', 'B', 'A']
const de = (d, min) => ORDEM.indexOf(d) >= ORDEM.indexOf(min)
const NTROF = { V: 0, D: 1, C: 3, B: 6, A: 11 }
const DIVNOME = { V: 'Várzea', D: 'Série D', C: 'Série C', B: 'Série B', A: 'Série A' }

// sombra dura pequena embaixo de cada móvel — é o que faz tudo "pousar" no chão
const sombra = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.max(6, rx * 0.16)}" fill="rgba(12,12,12,.22)"/>`

const salaSvg = (d) => {
  const luxo = de(d, 'A'), rico = de(d, 'B')
  const parede = d === 'V' ? '#D6CBB0' : luxo ? '#E7DCC0' : '#EFE6CE'
  const chao = d === 'V' ? '#9a958b' : d === 'D' ? '#8a5730' : luxo ? '#5C3718' : '#7A4A26'
  const chaoLinha = d === 'V' ? '#7d786f' : luxo ? '#42260f' : '#5e3719'
  const nt = NTROF[d]
  // as taças ocupam as prateleiras de cima pra baixo, conforme vão sendo ganhas
  const vagasTrof = [[62, 178], [112, 178], [162, 178], [62, 246], [112, 246], [162, 246], [62, 314], [112, 314], [162, 314], [86, 382], [138, 382]]
  return `<svg viewBox="0 0 640 620" style="width:100%;display:block">
  <defs>
    <linearGradient id="ceu${d}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16233f"/><stop offset="1" stop-color="#2d4a6b"/></linearGradient>
    <linearGradient id="dia${d}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FC7EA"/><stop offset="1" stop-color="#CFE6F5"/></linearGradient>
    <linearGradient id="tap${d}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${luxo ? '#7d2320' : '#8d2f2a'}"/><stop offset="1" stop-color="${luxo ? '#a3312c' : '#a83f36'}"/></linearGradient>
    <linearGradient id="par${d}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${parede}"/><stop offset="1" stop-color="${d === 'V' ? '#C6BA9C' : luxo ? '#D8CBA8' : '#E2D5B4'}"/></linearGradient>
  </defs>

  <!-- PAREDE -->
  <rect x="0" y="0" width="640" height="446" fill="url(#par${d})"/>
  ${d === 'V' ? `<g opacity=".5"><path d="M96 60 q22 40 -6 78" fill="none" stroke="#a89b7d" stroke-width="4"/><ellipse cx="470" cy="120" rx="46" ry="30" fill="#c7bb9c"/><ellipse cx="180" cy="330" rx="34" ry="22" fill="#c7bb9c"/></g>` : ''}
  ${luxo ? `<g>${[0, 160, 320, 480].map(x => `<rect x="${x + 10}" y="286" width="140" height="150" rx="4" fill="#6b4420" stroke="#4a2f18" stroke-width="4"/>`).join('')}
      <rect x="0" y="272" width="640" height="14" fill="${GOLD}"/><rect x="0" y="266" width="640" height="7" fill="#4a2f18"/></g>`
    : de(d, 'C') ? `<g><rect x="0" y="330" width="640" height="106" fill="#DBCDA9"/><rect x="0" y="322" width="640" height="9" fill="#c3b58e"/></g>` : ''}

  <!-- RODAPÉ marcado + CHÃO -->
  <rect x="0" y="424" width="640" height="22" fill="${luxo ? '#4a2f18' : d === 'V' ? '#8b8579' : '#5e3719'}"/>
  <rect x="0" y="418" width="640" height="8" fill="${luxo ? GOLD : d === 'V' ? '#a09a8d' : '#9a7a3f'}"/>
  <rect x="0" y="446" width="640" height="174" fill="${chao}"/>
  ${d === 'V'
    ? `${[[40, 470, 150, 560], [300, 452, 420, 600], [520, 480, 590, 566]].map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1} L${(x1 + x2) / 2 + 14} ${(y1 + y2) / 2} L${x2} ${y2}" fill="none" stroke="${chaoLinha}" stroke-width="3.5"/>`).join('')}`
    : `${[-40, 40, 120, 200, 280, 360, 440, 520, 600, 680].map(x => `<line x1="${x}" y1="446" x2="${x - 62}" y2="620" stroke="${chaoLinha}" stroke-width="3"/>`).join('')}
       ${[482, 528, 578].map(y => `<line x1="0" y1="${y}" x2="640" y2="${y}" stroke="${chaoLinha}" stroke-width="1.5" opacity=".55"/>`).join('')}`}
  ${luxo ? `<rect x="0" y="446" width="640" height="174" fill="url(#tap${d})" opacity="0"/><path d="M0 446 h640 v40 h-640 z" fill="rgba(255,255,255,.07)"/>` : ''}

  <!-- 💡 LUZ: lâmpada pelada na Várzea · lustre na Série A -->
  ${d === 'V' ? `<g><line x1="320" y1="0" x2="320" y2="52" stroke="${INK}" stroke-width="4"/><circle cx="320" cy="66" r="16" fill="#f4e3a1" stroke="${INK}" stroke-width="4"/><path d="M312 78 h16" stroke="${INK}" stroke-width="4"/></g>` : ''}
  ${luxo ? `<g><line x1="320" y1="0" x2="320" y2="30" stroke="${INK}" stroke-width="5"/>
      <path d="M268 30 h104 l-18 28 h-68 z" fill="${GOLD}" stroke="${INK}" stroke-width="5"/>
      ${[290, 320, 350].map(x => `<circle cx="${x}" cy="68" r="8" fill="#FFF3C4" stroke="${INK}" stroke-width="3.5"/>`).join('')}</g>` : ''}

  <!-- 🪟 JANELA (grande, e cresce com a divisão) -->
  ${de(d, 'D') ? (() => {
    const jx = rico ? 438 : 470, jy = rico ? 62 : 96, jw = rico ? 182 : 140, jh = rico ? 250 : 168
    const noite = de(d, 'C')
    return `<g><rect x="${jx}" y="${jy}" width="${jw}" height="${jh}" rx="7" fill="url(#${noite ? 'ceu' : 'dia'}${d})" stroke="${INK}" stroke-width="6"/>
      ${noite
        ? `<ellipse cx="${jx + jw / 2}" cy="${jy + jh - 46}" rx="${jw * 0.42}" ry="${jh * 0.12}" fill="#1B7A3D"/>
           <ellipse cx="${jx + jw / 2}" cy="${jy + jh - 46}" rx="${jw * 0.26}" ry="${jh * 0.07}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2.5"/>
           <rect x="${jx + jw * 0.14}" y="${jy + jh - 84}" width="${jw * 0.72}" height="30" rx="4" fill="#3b5a80"/>
           ${[0.22, 0.78].map(f => `<g><circle cx="${jx + jw * f}" cy="${jy + 42}" r="7" fill="${GOLD}"/><path d="M${jx + jw * f} ${jy + 42} L${jx + jw * f - 26} ${jy + 106} L${jx + jw * f + 26} ${jy + 106} Z" fill="rgba(255,196,0,.18)"/><line x1="${jx + jw * f}" y1="${jy + 48}" x2="${jx + jw * f}" y2="${jy + jh - 84}" stroke="#8fa4bd" stroke-width="4"/></g>`).join('')}`
        : `<circle cx="${jx + jw * 0.76}" cy="${jy + 40}" r="17" fill="#FFF3C4"/><ellipse cx="${jx + jw * 0.3}" cy="${jy + 62}" rx="30" ry="12" fill="#fff" opacity=".85"/><ellipse cx="${jx + jw / 2}" cy="${jy + jh - 30}" rx="${jw * 0.4}" ry="${jh * 0.13}" fill="#1B7A3D"/>`}
      <line x1="${jx + jw / 2}" y1="${jy}" x2="${jx + jw / 2}" y2="${jy + jh}" stroke="${INK}" stroke-width="5"/>
      <line x1="${jx}" y1="${jy + jh / 2}" x2="${jx + jw}" y2="${jy + jh / 2}" stroke="${INK}" stroke-width="5"/>
      ${luxo ? `<rect x="${jx - 8}" y="${jy - 8}" width="${jw + 16}" height="${jh + 16}" rx="9" fill="none" stroke="${GOLD}" stroke-width="5"/>` : ''}</g>`
  })() : `<g opacity=".35"><rect x="470" y="96" width="140" height="168" rx="6" fill="none" stroke="${INK}" stroke-width="5" stroke-dasharray="13 10"/></g>`}

  <!-- 📅 CALENDÁRIO TORTO (só na Várzea) -->
  ${d === 'V' ? `<g transform="translate(120,120) rotate(-6)"><rect x="0" y="0" width="74" height="94" rx="4" fill="#fff" stroke="${INK}" stroke-width="5"/><rect x="0" y="0" width="74" height="22" fill="${RED}" stroke="${INK}" stroke-width="4"/><text x="37" y="66" text-anchor="middle" font-family="Oswald" font-size="28" font-weight="700" fill="${INK}">12</text><circle cx="37" cy="-6" r="4" fill="${INK}"/></g>` : ''}

  <!-- 🏆 ESTANTE (entra na Série C; na A ela é maior e dourada) -->
  ${de(d, 'C') ? (() => {
    const et = luxo ? 118 : 150, eh = 424 - et
    return `<g>${sombra(112, 432, 92)}
      <rect x="22" y="${et}" width="180" height="${eh}" rx="7" fill="${luxo ? '#5C3718' : '#8B5A2B'}" stroke="${INK}" stroke-width="6"/>
      <rect x="32" y="${et + 10}" width="160" height="${eh - 20}" fill="${luxo ? '#43260f' : '#6b4420'}"/>
      ${(luxo ? [164, 232, 300, 368] : [196, 264, 332]).map(y => `<rect x="32" y="${y}" width="160" height="10" fill="${luxo ? GOLD : '#4a2f18'}"/>`).join('')}
      ${vagasTrof.slice(0, nt).map(([x, y]) => `<g transform="translate(${x},${y - (luxo ? 32 : 0)})"><rect x="-9" y="13" width="18" height="6" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><path d="M-10 -13 h20 v12 a10 10 0 0 1 -20 0 z" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><path d="M-10 -9 h-7 a7 7 0 0 0 7 8 M10 -9 h7 a7 7 0 0 1 -7 8" fill="none" stroke="${INK}" stroke-width="2"/></g>`).join('')}
      <rect x="32" y="${luxo ? 386 : 366}" width="160" height="${luxo ? 30 : 48}" rx="4" fill="${luxo ? '#2e1a08' : '#4a2f18'}" stroke="${INK}" stroke-width="4"/></g>`
  })() : ''}

  <!-- 👕 MANTO EMOLDURADO (Série B pra cima) — bem ACIMA, fora da linha do escudo -->
  ${rico ? `<g transform="translate(228,118)"><rect x="0" y="0" width="112" height="146" rx="6" fill="${luxo ? '#3b2a16' : '#F4ECD6'}" stroke="${INK}" stroke-width="6"/>
      ${luxo ? `<rect x="7" y="7" width="98" height="132" rx="3" fill="none" stroke="${GOLD}" stroke-width="4"/>` : ''}
      <rect x="13" y="13" width="86" height="120" fill="#F4ECD6"/>
      <path d="M28 30 L44 21 h24 l16 9 11 15 -14 13 -5 -6 v56 h-44 v-56 l-5 6 -14 -13 z" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
      ${[41, 52, 63, 74].map(x => `<rect x="${x}" y="40" width="6" height="68" fill="${GREEN}"/>`).join('')}</g>` : ''}

  <!-- 🛡️ ESCUDO NA PAREDE (central, mais BAIXO que o manto — tira a cara de menu) -->
  ${de(d, 'D') ? `<g transform="translate(360,${rico ? 158 : 128})"><path d="M42 0 L82 14 V58 C82 86 63 102 42 110 C21 102 2 86 2 58 V14 Z" fill="${GREEN}" stroke="${INK}" stroke-width="6"/>
      <path d="M42 13 L69 22 V57 C69 75 56 87 42 93 Z" fill="#0f5a2b"/>
      <text x="42" y="70" text-anchor="middle" font-family="Oswald" font-size="40" font-weight="700" fill="#fff">T</text>
      ${luxo ? `<circle cx="42" cy="55" r="60" fill="none" stroke="${GOLD}" stroke-width="4" opacity=".8"/>` : ''}</g>` : ''}

  <!-- 🐯 PEDESTAL DO MASCOTE (abaixo/direita, Série B pra cima) -->
  ${rico ? `<g transform="translate(458,326)">${sombra(46, 154, 58)}
      <rect x="6" y="60" width="80" height="88" rx="5" fill="${luxo ? '#E4DCC4' : '#CFC7B1'}" stroke="${INK}" stroke-width="5"/>
      <rect x="-6" y="140" width="104" height="16" rx="4" fill="${luxo ? '#c9bf9f' : '#9a927c'}" stroke="${INK}" stroke-width="4"/>
      ${luxo ? `<rect x="6" y="76" width="80" height="6" fill="${GOLD}"/>` : ''}
      <text x="46" y="56" text-anchor="middle" font-size="64">🐯</text></g>` : ''}

  <!-- 🧶 TAPETE (Série C pra cima) -->
  ${de(d, 'C') ? `<ellipse cx="316" cy="546" rx="${luxo ? 250 : 214}" ry="${luxo ? 58 : 48}" fill="url(#tap${d})" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="316" cy="546" rx="${luxo ? 200 : 172}" ry="${luxo ? 42 : 35}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/>` : ''}

  <!-- 🪑 O TRONO: poltrona ATRÁS, mesa grande e robusta NA FRENTE -->
  ${de(d, 'C') ? `<g><rect x="256" y="286" width="112" height="128" rx="30" fill="${luxo ? '#3b2a16' : '#4a2f18'}" stroke="${INK}" stroke-width="6"/>
      <rect x="272" y="304" width="80" height="98" rx="22" fill="${luxo ? '#5a3d1c' : '#63401f'}"/>
      ${luxo ? `<rect x="290" y="292" width="44" height="8" rx="4" fill="${GOLD}"/>` : ''}</g>` : ''}
  ${de(d, 'D')
    ? `<g>${sombra(316, 540, 178)}
       <rect x="132" y="398" width="368" height="34" rx="8" fill="${luxo ? '#5C3718' : '#8B5A2B'}" stroke="${INK}" stroke-width="6"/>
       ${luxo ? `<rect x="132" y="398" width="368" height="9" rx="4" fill="${GOLD}"/>` : ''}
       <rect x="152" y="432" width="328" height="82" rx="6" fill="${luxo ? '#43260f' : '#6b4420'}" stroke="${INK}" stroke-width="5"/>
       ${[224, 316, 408].map(x => `<g><rect x="${x - 34}" y="452" width="68" height="12" rx="4" fill="${luxo ? '#2e1a08' : '#4a2f18'}"/><rect x="${x - 34}" y="480" width="68" height="12" rx="4" fill="${luxo ? '#2e1a08' : '#4a2f18'}"/></g>`).join('')}</g>`
    : `<g>${sombra(300, 500, 100)}
       <rect x="208" y="372" width="188" height="16" rx="5" fill="#DDD6C6" stroke="${INK}" stroke-width="5" transform="rotate(-2 302 380)"/>
       <line x1="228" y1="388" x2="218" y2="470" stroke="${INK}" stroke-width="5"/><line x1="378" y1="388" x2="388" y2="470" stroke="${INK}" stroke-width="5"/>
       <g transform="translate(408,336)">${sombra(24, 148, 30)}<rect x="0" y="0" width="50" height="50" rx="7" fill="#E4E9ED" stroke="${INK}" stroke-width="5"/><circle cx="25" cy="25" r="14" fill="none" stroke="${INK}" stroke-width="4"/><rect x="16" y="50" width="18" height="46" fill="#E4E9ED" stroke="${INK}" stroke-width="4"/><rect x="4" y="96" width="42" height="10" rx="4" fill="#cfd8e0" stroke="${INK}" stroke-width="4"/></g>
       <g transform="translate(150,352)">${sombra(30, 132, 30)}<rect x="6" y="0" width="48" height="52" rx="6" fill="#EFEFEF" stroke="${INK}" stroke-width="5"/><rect x="0" y="52" width="60" height="12" rx="4" fill="#EFEFEF" stroke="${INK}" stroke-width="5"/><line x1="10" y1="64" x2="4" y2="128" stroke="${INK}" stroke-width="5"/><line x1="50" y1="64" x2="56" y2="128" stroke="${INK}" stroke-width="5"/></g>`}

  <!-- 💎 O DIAMANTE — pedestal PRÓPRIO ao lado da mesa, redoma grande (Série B) -->
  ${rico ? `<g transform="translate(74,368)">${sombra(46, 228, 46)}
      <rect x="14" y="120" width="64" height="104" rx="5" fill="${luxo ? '#3b2a16' : '#4a2f18'}" stroke="${INK}" stroke-width="5"/>
      <rect x="2" y="214" width="88" height="16" rx="4" fill="${luxo ? '#2e1a08' : '#3b2a16'}" stroke="${INK}" stroke-width="4"/>
      <rect x="6" y="106" width="80" height="18" rx="4" fill="${luxo ? '#5C3718' : '#6b4420'}" stroke="${INK}" stroke-width="5"/>
      <path d="M10 106 a36 62 0 0 1 72 0 z" fill="rgba(180,228,255,.42)" stroke="${INK}" stroke-width="5"/>
      <path d="M26 76 a22 38 0 0 1 15 -34" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="5"/>
      <g transform="translate(46,66)"><path d="M0 -34 L26 -11 L0 30 L-26 -11 Z" fill="#8fe3ff" stroke="${INK}" stroke-width="4"/>
        <path d="M-26 -11 h52" stroke="${INK}" stroke-width="3.5"/><path d="M0 -34 L-9 -11 L0 30 L9 -11 Z" fill="rgba(255,255,255,.6)"/>
        <path d="M-13 -22 l7 -7" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>
      ${luxo ? `<rect x="6" y="112" width="80" height="6" fill="${GOLD}"/>` : ''}</g>` : ''}

  <!-- 🌿 VASO (Série D pra cima) -->
  ${de(d, 'D') && !luxo ? `<g transform="translate(556,452)">${sombra(28, 122, 32)}<rect x="0" y="60" width="58" height="56" rx="6" fill="#b5642f" stroke="${INK}" stroke-width="5"/>
      <path d="M29 60 C-8 30 8 -10 29 10 C50 -10 66 30 29 60 Z" fill="${GREEN}" stroke="${INK}" stroke-width="5"/></g>` : ''}

  <!-- 💸 O EXAGERO DA SÉRIE A: aquário, busto de si mesmo e carrinho de champanhe -->
  ${luxo ? `<g transform="translate(568,448)">${sombra(38, 186, 44)}
      <rect x="0" y="60" width="76" height="118" rx="6" fill="#2C6E8F" stroke="${INK}" stroke-width="5"/>
      <rect x="8" y="70" width="60" height="98" fill="#57A9CB"/>
      ${[[24, 96], [50, 122], [28, 146]].map(([x, y]) => `<g transform="translate(${x},${y})"><path d="M0 0 l12 -6 v12 z" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><circle cx="3" cy="0" r="1.6" fill="${INK}"/></g>`).join('')}
      <rect x="0" y="46" width="76" height="18" rx="4" fill="${GOLD}" stroke="${INK}" stroke-width="5"/></g>
    <g transform="translate(474,470)">${sombra(30, 128, 34)}
      <rect x="12" y="70" width="38" height="58" rx="4" fill="#CFC7B1" stroke="${INK}" stroke-width="5"/>
      <circle cx="31" cy="42" r="26" fill="#B07A2B" stroke="${INK}" stroke-width="5"/>
      <path d="M14 34 a17 15 0 0 1 34 0" fill="#8a5c1c"/><circle cx="24" cy="44" r="2.5" fill="${INK}"/><circle cx="39" cy="44" r="2.5" fill="${INK}"/>
      <path d="M25 56 q6 5 13 0" fill="none" stroke="${INK}" stroke-width="3"/></g>
    <g transform="translate(286,530)">${sombra(38, 92, 40)}
      <rect x="4" y="34" width="72" height="10" rx="3" fill="${GOLD}" stroke="${INK}" stroke-width="4"/>
      <rect x="4" y="66" width="72" height="10" rx="3" fill="${GOLD}" stroke="${INK}" stroke-width="4"/>
      <circle cx="16" cy="86" r="7" fill="${INK}"/><circle cx="64" cy="86" r="7" fill="${INK}"/>
      <path d="M30 6 h14 v12 l6 16 h-26 l6 -16 z" fill="#1f6b3a" stroke="${INK}" stroke-width="4"/>
      <path d="M56 14 l10 0 -5 12 z" fill="#F4ECD6" stroke="${INK}" stroke-width="3"/></g>` : ''}

  <rect x="3" y="3" width="634" height="614" rx="12" fill="none" stroke="${INK}" stroke-width="6"/>
</svg>`
}

// ── 🚗 A GARAGEM — também evolui de divisão em divisão ──────────────────────
const carroSvg = (tipo, cor, x, y, esc = 1) => {
  const teto = tipo === 'fusca' ? 'M32 34 C40 6 92 6 100 34 Z' : tipo === 'sport' ? 'M28 34 L48 14 h44 l20 20 Z' : 'M30 34 L44 10 h48 l14 24 Z'
  return `<g transform="translate(${x},${y}) scale(${esc})">
    <ellipse cx="68" cy="80" rx="72" ry="9" fill="rgba(12,12,12,.25)"/>
    <path d="${teto}" fill="#bfe0f0" stroke="${INK}" stroke-width="4"/>
    <path d="M8 34 h116 a10 10 0 0 1 10 10 v18 a6 6 0 0 1 -6 6 h-124 a6 6 0 0 1 -6 -6 v-18 a10 10 0 0 1 10 -10 z" fill="${cor}" stroke="${INK}" stroke-width="4.5"/>
    <circle cx="34" cy="68" r="14" fill="#22201c" stroke="${INK}" stroke-width="4"/><circle cx="34" cy="68" r="5" fill="#cfcfcf"/>
    <circle cx="102" cy="68" r="14" fill="#22201c" stroke="${INK}" stroke-width="4"/><circle cx="102" cy="68" r="5" fill="#cfcfcf"/>
    <rect x="118" y="42" width="12" height="8" rx="3" fill="${GOLD}" stroke="${INK}" stroke-width="2.5"/>
    <rect x="6" y="42" width="10" height="8" rx="3" fill="#E8503A" stroke="${INK}" stroke-width="2.5"/>
  </g>`
}
const garagemSvg = (d) => {
  const luxo = de(d, 'A'), rico = de(d, 'B'), vagas = d === 'V' ? 1 : de(d, 'C') ? 3 : 2
  const piso = d === 'V' ? '#8d867a' : luxo ? '#3f4652' : '#7d7a72'
  const par = d === 'V' ? '#C3BCAC' : luxo ? '#2B3038' : '#D9D2C2'
  return `<svg viewBox="0 0 640 420" style="width:100%;display:block">
  <rect x="0" y="0" width="640" height="300" fill="${par}"/>
  ${d === 'V' ? `<g opacity=".55"><path d="M120 108 l18 42 -12 36" fill="none" stroke="#9d9484" stroke-width="4"/><path d="M470 78 l-14 50" fill="none" stroke="#9d9484" stroke-width="4"/></g>` : ''}
  ${luxo ? `<g>${[20, 180, 340, 500].map(x => `<rect x="${x}" y="126" width="130" height="162" rx="5" fill="#232830" stroke="#151920" stroke-width="4"/>`).join('')}<rect x="0" y="112" width="640" height="12" fill="${GOLD}"/></g>` : ''}
  <rect x="0" y="292" width="640" height="12" fill="${luxo ? '#151920' : '#5c564d'}"/>
  <rect x="0" y="300" width="640" height="120" fill="${piso}"/>
  ${d === 'V' ? `<g opacity=".6">${[[30, 330, 190, 412], [300, 316, 460, 400], [470, 350, 620, 418]].map(([a, b, c, e]) => `<path d="M${a} ${b} L${(a + c) / 2 + 18} ${(b + e) / 2} L${c} ${e}" fill="none" stroke="#6f6960" stroke-width="4"/>`).join('')}</g>` : ''}
  ${luxo ? `<path d="M0 300 h640 v32 h-640 z" fill="rgba(255,255,255,.06)"/>` : ''}
  ${d === 'V' ? `<g><line x1="316" y1="0" x2="316" y2="40" stroke="${INK}" stroke-width="4"/><path d="M296 40 h40 l-10 22 h-20 z" fill="#b9b2a2" stroke="${INK}" stroke-width="4"/><circle cx="316" cy="74" r="13" fill="#f4e3a1" stroke="${INK}" stroke-width="4"/></g>`
    : `<g>${(luxo ? [130, 320, 510] : [220, 420]).map(x => `<g><line x1="${x}" y1="0" x2="${x}" y2="16" stroke="${INK}" stroke-width="4"/><rect x="${x - 52}" y="16" width="104" height="16" rx="6" fill="#FFF3C4" stroke="${INK}" stroke-width="4"/></g>`).join('')}</g>`}
  ${d === 'V'
    ? `<g transform="rotate(-2 168 128)"><rect x="34" y="104" width="268" height="52" rx="5" fill="#9d9484" stroke="${INK}" stroke-width="6"/>${[0, 15, 30].map(o => `<line x1="42" y1="${116 + o}" x2="294" y2="${116 + o}" stroke="#7d7566" stroke-width="4"/>`).join('')}</g>`
    : `<g><rect x="26" y="44" width="588" height="62" rx="5" fill="${luxo ? '#39404a' : '#b9b2a2'}" stroke="${INK}" stroke-width="6"/>${[0, 16, 32].map(o => `<line x1="32" y1="${56 + o}" x2="608" y2="${56 + o}" stroke="${luxo ? '#252a32' : '#8d867a'}" stroke-width="4"/>`).join('')}</g>`}
  ${rico ? `<g transform="translate(${luxo ? 466 : 480},164)"><rect x="0" y="0" width="132" height="126" rx="6" fill="${RED}" stroke="${INK}" stroke-width="5"/>
      ${[24, 58, 92].map(y => `<g><rect x="10" y="${y}" width="112" height="26" rx="4" fill="#c23a2a" stroke="${INK}" stroke-width="3"/><rect x="52" y="${y + 10}" width="28" height="6" rx="3" fill="${INK}"/></g>`).join('')}</g>` : ''}
  ${Array.from({ length: vagas }).map((_, i) => {
    const x = 40 + i * 192, ok = i === 0
    return `<g><path d="M${x} 300 h176 l26 96 h-228 z" fill="${ok ? 'rgba(255,196,0,.2)' : 'rgba(0,0,0,.08)'}" stroke="${luxo ? GOLD : '#F4ECD6'}" stroke-width="4" stroke-dasharray="${ok ? '0' : '14 10'}"/>
      ${ok ? '' : `<text x="${x + 92}" y="368" text-anchor="middle" font-family="Oswald" font-size="17" font-weight="700" fill="rgba(255,255,255,.7)">vaga ${i + 1}</text>`}</g>`
  }).join('')}
  ${carroSvg(luxo ? 'sport' : rico ? 'hatch' : 'fusca', d === 'V' ? '#7d8a94' : d === 'D' ? '#E5B32A' : d === 'C' ? '#C2452F' : rico && !luxo ? '#F0EDE4' : '#14161a', 52, 248, 1.24)}
  <g transform="translate(${d === 'V' ? 350 : 300},${d === 'V' ? 186 : 138})"><rect x="0" y="0" width="${d === 'V' ? 180 : 220}" height="${d === 'V' ? 42 : 60}" rx="8" fill="${INK}"/>
    <text x="${d === 'V' ? 90 : 110}" y="${d === 'V' ? 28 : 26}" text-anchor="middle" font-family="Oswald" font-size="16" font-weight="700" fill="${GOLD}">GARAGEM</text>
    ${d === 'V' ? '' : `<text x="110" y="48" text-anchor="middle" font-family="Oswald" font-size="16" font-weight="700" fill="#fff">DA PRESIDÊNCIA</text>`}</g>
  <rect x="3" y="3" width="634" height="414" rx="12" fill="none" stroke="${INK}" stroke-width="6"/>
</svg>`
}
const CARROS_LOJA = [
  ['🚜', 'Fusca 78 sem banco de trás', 'Várzea', 12, 'tem'],
  ['🚙', 'Brasília amarela', 'Série D', 24, 'pode'],
  ['🚗', 'Gol quadrado turbo', 'Série C', 40, 'pode'],
  ['🚐', 'Uno com escada no teto', 'Série B', 60, 'caro'],
  ['🏎️', 'Importado de vidro fumê', 'Série A', 120, 'trava'],
]
const garagem = `<div class="box" style="padding:0;overflow:hidden;margin-bottom:9px">
  ${garagemSvg('B')}
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
  ${salaSvg('B')}
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
  ${salaSvg('V')}
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
  <div style="border-top:3px solid ${INK};border-bottom:3px solid ${INK}">${salaSvg('B')}</div>
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


// ══ 🖼️ AS 5 SALAS + AS GARAGENS (a evolução: o coração da ideia) ═══════════
const quadro = (svg, d, txt) => `<style>${CSS} body{width:760px;padding:14px;background:${CREME}}</style>
<div class="band" style="padding:8px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
  <span class="osw" style="font-size:19px">${DIVNOME[d]}</span>
  <span class="pill" style="background:${GOLD}">${txt}</span>
</div>
<div class="box" style="padding:0;overflow:hidden">${svg}</div>`

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
for (const [nome, html, w, h, dpr] of [['cel-1-sala', cel1, 390, 844, 2], ['cel-2-vazia', cel2, 390, 844, 2], ['cel-3-loja', cel3, 390, 844, 2], ['cel-3b-garagem', celGar, 390, 844, 2], ['cel-4-status', cel4, 390, 844, 2], ['cel-5-tecnico', cel5, 390, 844, 2], ['cel-6-historia', cel6, 390, 844, 2], ['pc-presidencia', desk, 1440, 2500, 1], ['sala-1-V', quadro(salaSvg('V'), 'V', 'so o improviso'), 760, 10, 2], ['sala-2-D', quadro(salaSvg('D'), 'D', 'a primeira mesa de madeira'), 760, 10, 2], ['sala-3-C', quadro(salaSvg('C'), 'C', 'poltrona, estante e tapete'), 760, 10, 2], ['sala-4-B', quadro(salaSvg('B'), 'B', 'manto, mascote e o diamante'), 760, 10, 2], ['sala-5-A', quadro(salaSvg('A'), 'A', 'o exagero'), 760, 10, 2], ['garagem-V', quadro(garagemSvg('V'), 'V', 'concreto rachado, 1 vaga'), 760, 10, 2], ['garagem-C', quadro(garagemSvg('C'), 'C', '3 vagas e luz decente'), 760, 10, 2], ['garagem-A', quadro(garagemSvg('A'), 'A', 'garagem de presidente'), 760, 10, 2]]) {
  const p = `${OUT}/${nome}.html`; writeFileSync(p, `<!doctype html><meta charset="utf-8">${html}`)
  const pg = await b.newPage({ viewport: { width: w, height: Math.max(h, 200) }, deviceScaleFactor: dpr })
  await pg.goto('file://' + p); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200)
  await pg.screenshot({ path: `${OUT}/${nome}.png`, fullPage: h <= 20 }); await pg.close(); console.log(`${OUT}/${nome}.png`)
}
await b.close()
