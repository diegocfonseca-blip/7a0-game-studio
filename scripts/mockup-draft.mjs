// 📋 MOCKUP — DRAFT DAS LIGAS (19/10, ideia do Diego, lembrança do PES 19 com os amigos na pandemia): cada jogador é ÚNICO
// na liga, todo mundo começa com time RUIM (leilão só de jogador fraco) e, a cada temporada, cada técnico pega UM jogador
// no draft — de TODOS os jogadores do jogo. A ordem é a da tabela: o campeão escolhe primeiro. Cada escolha é revelada na
// hora pra todo mundo (suspense: ninguém sabe quem o outro vai pegar).
//   node scripts/mockup-draft.mjs  →  scripts/mockups/draft.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const CARTA = n => `data:image/png;base64,${b64(`scripts/mockups/carta-${n}.png`)}`
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const G = { bege: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)', roxo: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)', prata: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', ouro: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)' }

const topo = (t, s) => `<div class="topo"><span>📋</span><div><b>${t}</b><small>${s}</small></div></div>`
const ordem = (atual) => {
  const L = [['Butinas FC', 'bege', '🏆 campeão', 'Neymar'], ['Fabulous EC 👑', 'ouro', '2º', null], ['K9 FC 🖋', 'ouro', '3º', null], ['Tocaia SC', 'roxo', '4º', null], ['Chelsão', 'prata', '5º', null]]
  return `<div class="ordem"><div class="otit">ORDEM DO DRAFT · A TABELA MANDA</div>${L.map(([n, t, p, esc], i) => `<div class="ol ${i === atual ? 'vez' : ''} ${i < atual ? 'feito' : ''}"><span class="num">${i + 1}º</span><span class="quem" style="background:${G[t]}">${n}</span><small>${p}</small><b>${i < atual ? '✓ ' + (i === 0 ? esc : 'Romário') : i === atual ? '⏱ NA VEZ' : '…'}</b></div>`).join('')}</div>`
}

const tela1 = `<div class="fone">
  ${topo('LIGA DA FIRMA · TEMPORADA 1', 'o começo: todo mundo no mesmo buraco')}
  <div class="aviso"><b>🔨 LEILÃO DOS PERNAS-DE-PAU</b><p>Na 1ª temporada só vão a leilão jogadores <b>fracos</b>. Ninguém começa com craque.</p></div>
  <div class="real"><img src="${CARTA('muralha')}"></div>
  <div class="aviso verde"><b>📋 E DEPOIS?</b><p>Acabou a temporada, vem o <b>DRAFT</b>: cada técnico pega <b>1 jogador</b>, de <b>todos do jogo</b>. Lenda inclusa.</p></div>
  <div class="escada"><div><b>T1</b><small>leilão fraco</small></div><span>→</span><div><b>T2</b><small>+1 do draft</small></div><span>→</span><div><b>T3</b><small>+1 do draft</small></div><span>→</span><div><b>…</b><small>o time cresce</small></div></div>
  <p class="dica">Cada jogador é <b>único na liga</b>: tem um Neymar só, e é de quem pegar primeiro.</p>
</div>`

const tela2 = `<div class="fone">
  ${topo('NOITE DO DRAFT · TEMPORADA 2', 'cada técnico pega 1 jogador · ninguém vê a escolha do outro')}
  ${ordem(1)}
  <div class="anuncio"><small>COM A 2ª ESCOLHA DO DRAFT…</small><b>FABULOUS EC ESCOLHE</b></div>
  <div class="coberta"><div class="interro">?</div><small>a carta vira em 3… 2… 1…</small></div>
  <p class="dica">Enquanto o Fabulous escolhe, todo mundo só vê a carta coberta. Ninguém sabe se ele vai no seu jogador.</p>
</div>`

const tela3 = `<div class="fone">
  ${topo('NOITE DO DRAFT · TEMPORADA 2', 'a carta virou pra sala inteira ao mesmo tempo')}
  ${ordem(2)}
  <div class="anuncio"><small>COM A 2ª ESCOLHA DO DRAFT, FABULOUS EC ESCOLHE…</small></div>
  <div class="real"><img src="${CARTA('romario')}"></div>
  <p class="zoeira">😱 K9 FC: "ERA O MEU!!" — ele ia no Romário na 3ª.</p>
  <p class="dica">Agora é a vez do K9 FC. O Romário some da lista de todo mundo.</p>
</div>`

const lin = (pos, nome, clube, cat, cor, dono) => `<div class="li ${dono ? 'tomado' : ''}"><span class="lpos">${pos}</span><span class="lnome"><b>${nome}</b><small>${clube}</small></span>${dono ? `<em>já é do ${dono}</em>` : `<span class="lcat" style="background:${cor}">${cat}</span>`}</div>`
const tela4 = `<div class="fone">
  ${topo('SUA VEZ · 3ª ESCOLHA', 'K9 FC · escolha 1 jogador de todo o jogo')}
  <div class="relogio">⏱ <b>60s</b> pra escolher · acabou o tempo, o jogo pega o melhor livre pra você</div>
  <div class="busca">🔎 buscar jogador…</div>
  <div class="filtros"><span class="on">Todos</span><span>GOL</span><span>LAT</span><span>ZAG</span><span>MEI</span><span>ATA</span></div>
  <div class="lista">
    ${lin('ATA', 'Neymar', 'Barcelona · 2015', '', '', 'Butinas FC')}
    ${lin('ATA', 'Romário', 'Vasco · 2000', '', '', 'Fabulous EC')}
    ${lin('MEI', 'Zico', 'Flamengo · 1981', 'LENDA', '#FFE79A')}
    ${lin('ZAG', 'Thiago Silva', 'Fluminense · 2008', 'CRAQUE', '#E9DDFE')}
  </div>
  <div class="sai"><b>🔄 QUEM SAI PRA ELE ENTRAR?</b><p>O time tem vaga fixa. Escolhendo o Zico (MEI), sai um dos seus meias — e ele volta pro monte da liga.</p>
    <div class="sais"><span>Léo Lima</span><span>Adryan</span><span>Perdigão</span></div></div>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:26px}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.65;font-size:14px}
.cols{display:grid;grid-template-columns:repeat(2,420px);gap:26px}
.fone{width:420px;background:#0c0c0c;border:4px solid #0C0C0C;border-radius:30px;padding:12px;box-shadow:6px 6px 0 #0C0C0C}
.fone>*{margin-bottom:10px}.fone>*:last-child{margin-bottom:0}
.topo{display:flex;align-items:center;gap:9px;background:#0C0C0C;color:#fff;border-radius:13px;padding:8px 10px;border:2px solid #333}
.topo>span{font-size:24px}.topo b{font:700 15px Oswald;text-transform:uppercase;display:block}.topo small{font-size:10.5px;font-weight:700;opacity:.7}
.aviso{background:#FFC400;border:3px solid #0C0C0C;border-radius:14px;padding:10px 12px;box-shadow:3px 3px 0 #000}.aviso b{font:700 16px Oswald}.aviso p{margin:4px 0 0;font-size:13px;font-weight:600;line-height:1.35}
.aviso.verde{background:#1B7A3D;color:#fff}
.carta{position:relative;background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:14px 16px;text-align:center}
.carta .pos{position:absolute;left:12px;top:12px;font:700 13px Oswald;background:#FFC400;border:2px solid #0C0C0C;border-radius:8px;padding:2px 8px}
.carta .selo{position:absolute;right:12px;top:12px;font:700 12px Oswald;background:#7C3AED;color:#fff;border:2px solid #0C0C0C;border-radius:8px;padding:2px 8px}
.carta .nome{font:700 34px Oswald;text-transform:uppercase;margin-top:6px}.carta .clube{font-weight:700;opacity:.65;font-size:13px}
.carta .nivel{margin:8px auto 0;display:inline-block;font:700 15px Oswald;background:#FFE79A;border:2px solid #0C0C0C;border-radius:9px;padding:3px 10px}.carta .nivel span{color:#7C3AED;margin-right:6px}
.carta.revelada{background:linear-gradient(160deg,#FFF7D6,#fff 60%);border-color:#0C0C0C;box-shadow:0 0 22px rgba(255,196,0,.8),4px 4px 0 #000}
.escada{display:flex;align-items:center;justify-content:space-between;background:#fff;border:3px solid #0C0C0C;border-radius:13px;padding:8px}
.escada div{text-align:center}.escada b{font:700 18px Oswald;display:block}.escada small{font-size:10px;font-weight:700;opacity:.65}.escada span{font-weight:900}
.dica{margin:0;color:#fff;font-size:11.5px;font-weight:700;opacity:.85;text-align:center}
.ordem{background:#fff;border:3px solid #0C0C0C;border-radius:13px;overflow:hidden}
.otit{font:700 11px Oswald;letter-spacing:1px;background:#0C0C0C;color:#FFC400;padding:5px 10px}
.ol{display:flex;align-items:center;gap:8px;padding:6px 10px;border-top:1.5px solid rgba(0,0,0,.08);font-weight:700;font-size:12px}
.ol .num{font:700 15px Oswald;width:26px}.ol .quem{border:2px solid #0C0C0C;border-radius:8px;padding:2px 8px;font:700 12px Oswald;text-transform:uppercase}.ol small{font-size:10px;opacity:.6}.ol b{margin-left:auto;font:700 13px Oswald}
.ol.vez{background:#FFF1B8}.ol.vez b{color:#C2452F}.ol.feito b{color:#1B7A3D}
.anuncio{background:#7C3AED;color:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:10px 12px;text-align:center;box-shadow:3px 3px 0 #000}
.anuncio small{display:block;font:700 12px Oswald;letter-spacing:1px;opacity:.85}.anuncio b{font:700 26px Oswald}
.coberta{background:repeating-linear-gradient(45deg,#1a1a1a 0 12px,#232323 12px 24px);border:3px solid #FFC400;border-radius:16px;height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
.coberta .interro{width:86px;height:110px;border:3px solid #FFC400;border-radius:12px;background:#0C0C0C;color:#FFC400;font:700 64px Oswald;display:grid;place-items:center}
.coberta small{color:#FFC400;font:700 13px Oswald;letter-spacing:1px}
.zoeira{margin:0;background:#C2452F;color:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:8px 10px;font-size:12.5px;font-weight:700}
.relogio{background:#FFC400;border:3px solid #0C0C0C;border-radius:12px;padding:7px 10px;font-size:12px;font-weight:700}.relogio b{font:700 18px Oswald}
.busca{background:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:9px 12px;font-weight:700;opacity:.9;font-size:13px;color:#777}
.filtros{display:flex;gap:5px}.filtros span{flex:1;text-align:center;font:700 13px Oswald;background:#fff;border:2px solid #0C0C0C;border-radius:9px;padding:5px 0}.filtros .on{background:#FFC400}
.lista{background:#fff;border:3px solid #0C0C0C;border-radius:13px;overflow:hidden}
.li{display:flex;align-items:center;gap:9px;padding:7px 10px;border-top:1.5px solid rgba(0,0,0,.08)}.li:first-child{border-top:none}
.lpos{font:700 12px Oswald;background:#F4ECD6;border:2px solid #0C0C0C;border-radius:7px;padding:1px 6px}
.lnome b{font:700 16px Oswald;text-transform:uppercase;display:block;line-height:1.1}.lnome small{font-size:10.5px;font-weight:700;opacity:.6}
.lcat{margin-left:auto;font:700 12px Oswald;border:2px solid #0C0C0C;border-radius:8px;padding:2px 8px;color:#7C3AED}
.li.tomado{opacity:.45;background:#eee}.li.tomado em{margin-left:auto;font-size:11px;font-weight:800;font-style:normal;color:#C2452F}
.sai{background:#fff;border:3px solid #0C0C0C;border-radius:13px;padding:10px 12px}.sai b{font:700 15px Oswald}.sai p{margin:4px 0 8px;font-size:12px;font-weight:600;line-height:1.35}
.sais{display:flex;gap:6px}.sais span{flex:1;text-align:center;font:700 13px Oswald;background:#F4ECD6;border:2px solid #0C0C0C;border-radius:9px;padding:6px 0;box-shadow:2px 2px 0 #000}
.real{width:220px;margin:0 auto 10px;filter:drop-shadow(0 0 22px rgba(255,196,0,.75))}.real img{width:100%;display:block}
.leg{margin-top:20px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:12px 16px;box-shadow:4px 4px 0 #000;font-size:13px;font-weight:700;line-height:1.55;max-width:866px}
</style></head><body>
<h1>📋 Draft · Minhas Ligas</h1>
<p class="sub">Começa todo mundo fraco · cada temporada, 1 jogador por técnico, de todos do jogo · o campeão escolhe primeiro · cada escolha é revelada na hora</p>
<div class="cols">${tela1}${tela2}${tela3}${tela4}</div>
<div class="leg">① Temporada 1: leilão de sempre, mas só com jogador fraco. ② Fim da temporada: noite do draft, na ordem da tabela — a escolha do outro fica coberta. ③ A carta vira pra sala inteira ao mesmo tempo. ④ Na sua vez, você procura em todo o jogo (quem já foi pego aparece apagado) e escolhe quem sai do seu time pra ele entrar.</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 920, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/draft.png', fullPage: true })
await b.close(); console.log('📸 scripts/mockups/draft.png')
