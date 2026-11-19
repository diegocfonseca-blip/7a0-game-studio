// ─── 🏁 MOCKUP: O COMEÇO DA CENTRAL (Diego 18/11) ───────────────────────────
// Pedido: *"achei bem sem graça essa central assim… começa o modo carreira e já aparece meio confuso…
// tem que ter o momento do patrocínio e tudo que for preciso, só não sei que momento é, aonde, como"*.
// Ideia: a pré-temporada vira UMA lista de passos na Central (TV → Master → Estreia), um botão só,
// e o Master abre em tela cheia (como a coletiva) e volta pra Central marcado.
// ⚠️ SÓ DESENHO — nada disto está no jogo.   node scripts/mockups/central-pretemporada.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = p => `data:image/webp;base64,${readFileSync(p).toString('base64')}`
const EST = img('src/escalacao/img/online-estadio-v25.webp')
const STA = img('public/escudos-clubes/santa-cruz.webp'), VRE = img('public/escudos-clubes/volta-redonda.webp')
const FEIRA = img('src/escalacao/img/sede-feira.webp')
const P = { oitto: img('src/escalacao/img/patro-oittolabs.webp'), tidex: img('src/escalacao/img/patro-tidex.webp'), vadico: img('src/escalacao/img/patro-vadico.webp'), dsouza: img('src/escalacao/img/patro-dsouza.webp') }

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6', BG = '#0E1210'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const card = (extra = '') => `background:${CREME};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 #000;${extra}`
const chip = (t, bg = GOLD, fg = INK) => `<span style="${OSW};font-size:11px;letter-spacing:.06em;text-transform:uppercase;background:${bg};color:${fg};border:2px solid ${INK};border-radius:999px;padding:3px 10px;white-space:nowrap">${t}</span>`
const btn = (t, bg = GOLD, fg = INK) => `<div style="${OSW};font-size:19px;text-transform:uppercase;text-align:center;background:${bg};color:${fg};border:3px solid ${INK};border-radius:13px;box-shadow:4px 4px 0 #000;padding:13px 8px">${t}</div>`
const topo = `<p style="margin:0;${OSW};font-size:12px;letter-spacing:.12em;color:#E8C66A">SANTA CRUZ · TEMPORADA 1 · SÉRIE C</p>
<p style="margin:4px 0 14px;${OSW};font-size:30px;color:${CREME};text-transform:uppercase">Central da carreira</p>`

const passo = (n, est, emoji, titulo, txt, dir = '') => {
  const cor = est === 'ok' ? GREEN : est === 'vez' ? GOLD : '#555'
  const bola = est === 'ok' ? '✓' : est === 'trava' ? '🔒' : n
  return `<div style="display:flex;gap:10px;align-items:center;background:${est === 'vez' ? 'rgba(255,196,0,.14)' : 'rgba(255,255,255,.06)'};border:2px solid ${est === 'vez' ? GOLD : 'rgba(255,255,255,.18)'};border-radius:12px;padding:9px 10px;opacity:${est === 'trava' ? .6 : 1}">
    <div style="flex:none;width:30px;height:30px;border-radius:50%;background:${cor};color:${est === 'vez' ? INK : '#fff'};border:2px solid ${INK};display:flex;align-items:center;justify-content:center;${OSW};font-size:15px">${bola}</div>
    <div style="flex:1;min-width:0"><p style="margin:0;${OSW};font-size:15px;color:#fff;text-transform:uppercase">${emoji} ${titulo}</p>
    <p style="margin:2px 0 0;font:600 12px/1.35 system-ui;color:rgba(255,255,255,.8)">${txt}</p></div>${dir}</div>`
}
const hero = (inner) => `<div style="position:relative;border:3px solid ${INK};border-radius:18px;overflow:hidden;box-shadow:4px 4px 0 #000">
  <img src="${EST}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.42)">
  <div style="position:relative;padding:14px">${inner}</div></div>`

const jogo = (rot) => `<div style="display:flex;align-items:center;justify-content:space-around;margin:8px 0 6px">
  <div style="text-align:center;width:120px"><img src="${STA}" style="width:66px;height:66px;object-fit:contain;background:#fff;border-radius:50%;padding:6px"><p style="margin:6px 0 0;${OSW};font-size:16px;color:#fff;text-transform:uppercase">Santa Cruz</p></div>
  <p style="margin:0;${OSW};font-size:24px;color:${GOLD}">×</p>
  <div style="text-align:center;width:120px"><img src="${VRE}" style="width:66px;height:66px;object-fit:contain;background:#fff;border-radius:50%;padding:6px"><p style="margin:6px 0 0;${OSW};font-size:16px;color:#fff;text-transform:uppercase">Volta Redonda</p></div></div>
  <p style="margin:0 0 12px;text-align:center;font:700 12.5px system-ui;color:#fff">${rot}</p>`

// ① Central ao abrir a carreira
const TELA1 = `${topo}
${hero(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">${chip('🏁 Pré-temporada')}${chip('Falta 1 passo', '#fff')}</div>
  <p style="margin:0 0 10px;${OSW};font-size:26px;color:#fff;text-transform:uppercase;line-height:1">Antes da estreia</p>
  <div style="display:grid;gap:7px;margin-bottom:12px">
    ${passo(1, 'ok', '📺', 'Contrato de TV', 'A Rede Martelo TV fechou com o clube: <b style="color:#8EE3A8">+10 🪙 por temporada</b>, direto no caixa.')}
    ${passo(2, 'vez', '🏆', 'Patrocinador Master', '5 marcas na mesa. Cada uma com prazo e meta. Escolha uma.')}
    ${passo(3, 'trava', '⚽', 'Estreia · em casa', 'Santa Cruz × Volta Redonda · jogo 1 de 19 da Série C')}
  </div>
  ${btn('🏆 Escolher o Master →')}
  <p style="margin:8px 0 0;text-align:center;font:600 11.5px system-ui;color:rgba(255,255,255,.7)">um passo de cada vez · o próximo acende sozinho</p>`)}
<div style="height:14px"></div>
<div style="${card('padding:12px 14px')}"><p style="margin:0 0 8px;${OSW};font-size:18px;text-transform:uppercase">🗓️ Agenda da temporada</p>
  ${[['🌎', 'Libertadores', 'a vaga sai da Série A e da Copa do Brasil'], ['🌍', 'Copa do Mundo', 'é este ano · as seleções mandam convite no fim da temporada']].map(([e, t, s]) => `<div style="display:flex;gap:10px;padding:7px 0;border-top:1.5px solid rgba(0,0,0,.12)"><span style="font-size:20px">${e}</span><div><p style="margin:0;${OSW};font-size:14.5px;text-transform:uppercase">${t}</p><p style="margin:1px 0 0;font:600 12px system-ui;color:rgba(0,0,0,.6)">${s}</p></div></div>`).join('')}</div>
<div style="height:14px"></div>
<div style="${card('overflow:hidden')}"><img src="${FEIRA}" style="width:100%;height:120px;object-fit:cover;display:block;border-bottom:3px solid ${INK}"><div style="padding:10px 14px"><p style="margin:0;${OSW};font-size:11px;color:#9A5B1E;letter-spacing:.1em">🎥 ENQUANTO ISSO NO BAIRRO</p><p style="margin:3px 0 0;${OSW};font-size:18px;text-transform:uppercase">A feira está montada</p></div></div>`

// ② toque no botão → o Master em tela cheia (a mesma escolha de hoje, sozinha na tela)
const contrato = (logo, nome, prazo, val, meta, bonus) => `<div style="background:#fff;border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 #000;padding:9px 10px">
  <div style="display:flex;align-items:center;gap:9px"><img src="${logo}" style="width:54px;height:34px;object-fit:contain"><div style="flex:1"><p style="margin:0;${OSW};font-size:15px;text-transform:uppercase">${nome}</p>${chip(prazo, INK, '#fff')}</div>
  <div style="text-align:right"><p style="margin:0;${OSW};font-size:22px;color:${GREEN}">+${val} 🪙</p><p style="margin:0;${OSW};font-size:10px;color:#555">POR TEMPORADA</p></div></div>
  <p style="margin:7px 0 0;border:2px dashed #C9A227;border-radius:8px;background:#FFF6D6;padding:5px 8px;${OSW};font-size:12.5px;text-transform:uppercase">🎯 Meta: ${meta} <span style="float:right;color:${GREEN}">bateu? +${bonus}</span></p></div>`
const TELA2 = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">${chip('Passo 2 de 3')}<span style="${OSW};font-size:13px;color:#fff">✕ voltar pra Central</span></div>
<p style="margin:0;${OSW};font-size:30px;color:#fff;text-transform:uppercase;line-height:1">🏆 Patrocinador Master</p>
<p style="margin:6px 0 12px;font:600 13px/1.4 system-ui;color:rgba(255,255,255,.8)">Toque no contrato que você quer. Bateu a meta no ano, ganha o bônus.</p>
<div style="display:grid;gap:9px">
${contrato(P.oitto, 'OittoLabs', '1 temporada', 13, 'não cair', 5)}
${contrato(P.dsouza, 'dSouza Empreend.', '3 temporadas', 23, 'não cair', 5)}
${contrato(P.tidex, 'Tidex', '5 temporadas', 33, 'subir de divisão', 20)}
${contrato(P.vadico, 'Vadico Veículos', '5 temporadas', 33, 'subir de divisão', 20)}
</div>
<p style="margin:12px 0 0;text-align:center;font:600 12px system-ui;color:rgba(255,255,255,.7)">escolheu → assina na hora e volta pra Central com o passo marcado</p>`

// ③ tudo pronto: a Central vira a de sempre, com a estreia
const TELA3 = `${topo}
${hero(`<div style="display:flex;justify-content:space-between;align-items:center">${chip('⚽ Estreia · jogo 1 de 19')}${chip('🏟️ Em casa', '#fff')}</div>
  ${jogo('Primeiro jogo na Série C · Master: <b style="color:#FFC400">Tidex</b> · TV: <b style="color:#8EE3A8">+10/temporada</b>')}
  ${btn('▶ Começar a temporada', GREEN, '#fff')}
  <p style="margin:8px 0 0;text-align:center;font:600 11.5px system-ui;color:rgba(255,255,255,.7)">o jogo roda na aba Jogos · você escolhe Placar ou Campo 2D lá</p>`)}
<div style="height:14px"></div>
<div style="${card('padding:12px 14px')}"><p style="margin:0 0 6px;${OSW};font-size:18px;text-transform:uppercase">📊 Tabela · Série C</p>
<p style="margin:0;font:600 12.5px system-ui;color:rgba(0,0,0,.6)">Ninguém jogou ainda. A tabela aparece aqui depois da 1ª rodada.</p></div>
<div style="height:14px"></div>
<div style="${card('padding:12px 14px')}"><p style="margin:0;${OSW};font-size:18px;text-transform:uppercase">🔎 Raio-X do adversário</p><p style="margin:4px 0 0;font:600 12.5px system-ui;color:rgba(0,0,0,.6)">Volta Redonda · 4-4-2 retranca · melhores: Lugão, Haroldo, Maciel</p></div>`

const tela = (n, titulo, corpo) => `<div style="width:390px;flex:none"><p style="margin:0 0 8px;${OSW};font-size:17px;color:${INK};text-transform:uppercase">${n} ${titulo}</p>
<div style="background:${BG};border:3px solid ${INK};border-radius:22px;padding:18px 16px;min-height:900px;box-shadow:5px 5px 0 #000">${corpo}</div></div>`
const NOTA = `<div style="${card('padding:14px 18px;margin-bottom:18px;max-width:1240px')}"><p style="margin:0;${OSW};font-size:24px;text-transform:uppercase">🏁 Começo da carreira, em 3 telas</p>
<p style="margin:6px 0 0;font:600 14px/1.5 system-ui">Sai: a caixa “Seu primeiro jogo, sem complicação”, a janela da TV com “BORA!”, o “Você é o líder” com 0 ponto e o vai-e-vem até a aba Jogos.
Entra: <b>uma lista de passos na Central</b> (TV já resolvida → Master → Estreia) com <b>um botão só</b>. O Master abre em tela cheia e volta marcado. Na Série C/D, o jogo é contado “jogo 1 de 19” (e não “rodada 2”).</p></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}body{margin:0;background:#E9DFC4;padding:22px;font-family:system-ui}</style></head><body>
${NOTA}<div style="display:flex;gap:26px;align-items:flex-start">${tela('①', 'Ao abrir a carreira', TELA1)}${tela('②', 'Toque → o Master', TELA2)}${tela('③', 'Pronto pra estreia', TELA3)}</div></body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await b.newPage({ viewport: { width: 1290, height: 900 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/central-pretemporada.png', fullPage: true })
await b.close()
console.log('ok scripts/mockups/central-pretemporada.png')
