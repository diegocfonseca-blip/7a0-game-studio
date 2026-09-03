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

// ══ 📱 TELA 1 — a mesa, os símbolos e a torcida ═════════════════════════════
const cel1 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${mesa}${simbolos}${torcida}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 2 — rolando: técnico (com humor) e troféus ══════════════════════
const cel2 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${tecnico}${trofeus}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 3 — rolando: garagem, craque, parede e placa ════════════════════
const cel3 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${garagem}${craque}${condec}
<div style="position:absolute;left:0;right:0;bottom:70px;height:40px;background:linear-gradient(to top,${CREME},rgba(244,236,214,0))"></div>
${rodape}`

// ══ 📱 TELA 4 — rolando: parede, placa e atalhos ════════════════════════════
const cel4 = `<style>${CSS} body{width:390px;height:844px;overflow:hidden;position:relative;padding:10px 10px 0}</style>
${faixa}${salas('Presidência')}${parede}${placa}${atalhos}
${rodape}`

// ══ 💻 PC LARGO — 2 colunas ═════════════════════════════════════════════════
const desk = `<style>${CSS} body{width:1440px;height:1500px;overflow:hidden;padding:16px 22px}</style>
<div style="max-width:1180px;margin:0 auto">
  ${faixa}
  <div class="row" style="gap:6px;margin-bottom:12px">
    ${[['🏟️', 'Estádio'], ['💰', 'Finanças'], ['🤝', 'Patrocínio'], ['💼', 'Agência'], ['🏛️', 'Presidência']]
      .map(([i, t]) => `<div class="sub${t === 'Presidência' ? ' on' : ''}" style="flex:0 0 auto;padding:6px 16px;font-size:11px">${i} ${t}</div>`).join('')}
  </div>
  ${mesa}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start">
    <div>${simbolos}${tecnico}${garagem}</div>
    <div>${torcida}${trofeus}${craque}${condec}${parede}</div>
  </div>
  ${placa}
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, html, w, h, dpr] of [['cel-1-mesa', cel1, 390, 844, 2], ['cel-2-tecnico', cel2, 390, 844, 2], ['cel-3-garagem', cel3, 390, 844, 2], ['cel-4-historia', cel4, 390, 844, 2], ['pc-presidencia', desk, 1440, 1500, 1]]) {
  const p = `${OUT}/${nome}.html`; writeFileSync(p, `<!doctype html><meta charset="utf-8">${html}`)
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  await pg.goto('file://' + p); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200)
  await pg.screenshot({ path: `${OUT}/${nome}.png` }); await pg.close(); console.log(`${OUT}/${nome}.png`)
}
await b.close()
