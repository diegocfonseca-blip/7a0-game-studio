// ─── 🧢 PRANCHA FINAL DO SISTEMA DE TÉCNICOS (27/08) ────────────────────────
// Retrato fiel do que está CODADO (gate: só a conta do Diego). 6 telas:
// ① Elenco sem técnico (2 formações + convite) · ② Aliciar às cegas (carta
// mistério + valor zerado + sem clube) · ③ Venceu o leilão (carta completa +
// cardápio novo) · ④ Demissão com multa (2 toques + atropelo) · ⑤ Janela de
// contratos (renovar/deixar ir) · ⑥ A vida dos bots (virada).
//   node scripts/mockup-tecnico-final.mjs [--saida tecnico-final.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tecnico-final.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const fone = (titulo, caixa, corpo) => `
  <div style="width:372px;background:${CREME};border:5px solid ${INK};border-radius:26px;box-shadow:6px 6px 0 ${INK};overflow:hidden;flex:none">
    <div style="background:${INK};color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
      <span style="${OSW};font-size:13px;text-transform:uppercase">${titulo}</span>
      <span style="${OSW};font-size:11px;color:${GOLD}">🪙 ${caixa}</span>
    </div>
    <div style="padding:12px 12px 16px">${corpo}</div>
  </div>`

const secT = (t) => `<p style="${OSW};font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:rgba(0,0,0,.55);margin:12px 0 4px">${t}</p>`
const btnForm = (rot, cur, dis) => `
  <button style="flex:1 1 28%;min-width:56px;border:2.5px solid ${INK};border-radius:9px;padding:8px 4px;${OSW};font-weight:900;
    font-size:${rot.length > 7 ? 10.5 : 12.5}px;background:${cur ? GREEN : dis ? '#efe9d8' : '#fff'};color:${cur ? '#fff' : dis ? '#b8b2a4' : INK};
    ${cur ? `box-shadow:2px 2px 0 ${INK};` : ''}">${rot}${cur ? ' ✓' : ''}</button>`
const formBox = (btns, msg, ok = true) => `
  <div style="background:#fff;border:2px solid ${INK};border-radius:8px;padding:7px 9px;margin-bottom:10px">
    <p style="${OSW};font-weight:900;font-size:11.5px;margin:0 0 6px">🎽 Formação</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${btns}</div>
    <p style="font-size:9.5px;font-weight:700;color:${ok ? '#2E7D46' : '#b23b2e'};margin:6px 0 0;line-height:1.35">${msg}</p>
  </div>`

const cartaMisterio = (nome, pais) => `
  <div style="border:3px solid ${INK};border-radius:14px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:10px 11px">
    <span style="${OSW};font-size:10px;background:${INK};color:#fff;border-radius:7px;padding:1px 7px">TEC</span>
    <p style="${OSW};font-weight:900;font-size:16.5px;margin:4px 0 0">${nome} <span style="font-size:12px">${pais}</span></p>
    <p style="font-size:9px;font-weight:700;color:#5a5647;margin:4px 0 0;line-height:1.35">🎲 Contratação às cegas: categoria, nível e formações só se revelam quando ele for SEU.</p>
  </div>`
const chip = (t) => `<span style="${OSW};font-weight:800;font-size:9.5px;border:2px solid ${INK};border-radius:8px;padding:2px 7px;background:rgba(255,255,255,.85);color:${INK}">${t}</span>`
const cartaCheia = (nome, pais, catRot, grad, ink2, estilo, faixa, chips) => `
  <div style="border:3px solid ${INK};border-radius:14px;background:${grad};box-shadow:3px 3px 0 ${INK};padding:10px 11px;color:${ink2}">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="${OSW};font-size:10px;background:${INK};color:#fff;border-radius:7px;padding:1px 7px">TEC</span>
      <span style="${OSW};font-weight:900;font-size:9.5px;opacity:.8;letter-spacing:.06em;text-transform:uppercase">${catRot}</span>
    </div>
    <p style="${OSW};font-weight:900;font-size:16.5px;margin:4px 0 0;line-height:1.1">${nome} <span style="font-size:12px">${pais}</span></p>
    <p style="font-size:10px;font-weight:800;opacity:.8;margin:2px 0 0">${estilo} · 📊 ${faixa}</p>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:7px">${chips.map(chip).join('')}</div>
  </div>`
const aviso = (cor, bg, html) => `<p style="font-size:9.5px;font-weight:800;color:${cor};margin:0 0 7px;line-height:1.4;background:${bg};border:2px solid ${cor};border-radius:9px;padding:5px 8px">${html}</p>`
const dashed = (html) => `<p style="font-size:9.5px;font-weight:700;color:#5a5647;margin:0 0 7px;line-height:1.4;background:rgba(255,255,255,.7);border:2px dashed ${INK};border-radius:9px;padding:5px 8px">${html}</p>`
const stepper = (v) => `
  <div style="display:flex;align-items:center;gap:6px;justify-content:center;margin-bottom:9px">
    ${['−5', '−1'].map(x => `<span style="border:2.5px solid ${INK};border-radius:9px;background:#fff;${OSW};font-weight:900;font-size:12px;padding:5px 9px">${x}</span>`).join('')}
    <span style="${OSW};font-weight:900;font-size:17px;min-width:64px;text-align:center;background:#fff;border:3px solid ${INK};border-radius:10px;padding:4px 8px">💰 ${v}</span>
    ${['+1', '+5'].map(x => `<span style="border:2.5px solid ${INK};border-radius:9px;background:#fff;${OSW};font-weight:900;font-size:12px;padding:5px 9px">${x}</span>`).join('')}
  </div>`
const botao = (txt, bg, fg = INK) => `<button style="width:100%;${OSW};font-weight:900;font-size:13px;text-transform:uppercase;background:${bg};color:${fg};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:10px 0">${txt}</button>`
const logBox = (ok, tit, corpo) => `
  <div style="border:3px solid ${ok ? GREEN : RED};border-radius:12px;background:${ok ? '#E9F9EF' : '#FDEEEA'};padding:9px 11px;margin:8px 0">
    <p style="${OSW};font-weight:900;font-size:12px;margin:0;color:${ok ? GREEN : RED}">${tit}</p>
    <p style="font-size:10.5px;font-weight:700;margin:2px 0 0;line-height:1.4;color:${INK}">${corpo}</p>
  </div>`
const clubeBtn = (nome, rival, aberto) => `
  <button style="width:100%;text-align:left;${OSW};font-weight:900;font-size:12.5px;border:3px solid ${INK};border-radius:12px;
    background:${rival ? '#FFF3C4' : '#fff'};box-shadow:2.5px 2.5px 0 ${INK};padding:9px 12px;margin-bottom:7px;display:flex;justify-content:space-between">
    <span>${rival ? '⚔️ ' : ''}${nome}</span><span style="font-size:10px;opacity:.55">${aberto ? '▾' : '›'}</span></button>`
const livreBtn = (nome, pais) => `
  <button style="width:100%;text-align:left;${OSW};font-weight:900;font-size:12.5px;border:3px dashed ${INK};border-radius:12px;
    background:#FBF6E8;padding:9px 12px;margin-bottom:7px;display:flex;justify-content:space-between">
    <span>🕴️ ${nome} ${pais}</span><span style="font-size:10px;opacity:.55">›</span></button>`

// ── ① ELENCO SEM TÉCNICO ──
const T1 = fone('🧢 Elenco · Série C', 64, `
  ${formBox(btnForm('4-3-3', 1) + btnForm('4-4-2'), '✅ Você pode trocar de formação quando quiser — vale do próximo jogo.')}
  <p style="font-size:9.5px;font-weight:700;color:#5a5647;margin:-4px 0 10px;line-height:1.35">🔒 Sem técnico é o feijão-com-arroz: 4-3-3 e 4-4-2 — e só LENDA 👑 traz 5 esquemas.</p>
  ${secT('🧢 Técnico')}
  <div style="border:3px dashed ${INK};border-radius:14px;background:#FBF6E8;padding:10px 12px">
    <p style="${OSW};font-weight:900;font-size:12px;margin:0">Você ainda não tem técnico</p>
    <p style="font-size:10px;font-weight:700;color:#5a5647;margin:3px 0 0;line-height:1.4">Os clubes da Série C têm — alicia um aqui embaixo. O time joga normal sem técnico; a carta é um reforço a mais e traz as formações dela.</p>
  </div>
  ${secT('🔎 Aliciar · Série C')}
  <p style="font-size:10px;font-weight:700;color:#5a5647;margin:0 0 7px;line-height:1.4">Toque num clube pra ver o <b>técnico</b> dele — quem você aliciar vai pro <b>LEILÃO</b> (você × seus rivais × o dono).</p>
  ${clubeBtn('Bagres do Rio', 1)}${clubeBtn('Caixote EC')}${clubeBtn('Nacional da Serra')}
  <p style="text-align:center;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45)">⚔️ = rival seu · as outras divisões ficam no mistério</p>
`)

// ── ② ALICIAR ÀS CEGAS + SEM CLUBE ──
const T2 = fone('🔎 Aliciar · Caixote EC', 64, `
  ${clubeBtn('Caixote EC', 0, 1)}
  <div style="border:3px solid ${INK};border-top:none;border-radius:0 0 12px 12px;background:rgba(255,255,255,.75);padding:10px 10px 12px;margin:-7px 3px 10px">
    ${cartaMisterio('Gian Piero Gasperini', '🇮🇹')}
    <p style="font-size:10px;font-weight:800;color:#5a5647;margin:9px 0 5px;text-align:center">💰 valor de mercado: <b>— (nunca teve lance)</b> · sua caixa: <b>🪙 64</b></p>
    ${dashed('🎲 Contratando, o cardápio de formações vira o DELE — e se ele não usar a sua atual, ela segue valendo como a formação da casa 🏠. Contrato de <b>5 temporadas</b>. Você só descobre o resto quando ele for seu.')}
    ${stepper(9)}
    ${botao('🔨 Aliciar pro leilão', GOLD)}
    <p style="font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55);margin:6px 2px 0;line-height:1.4">Vai pro pregão: <b>você × seus rivais × o Caixote EC</b> (o dono briga pra segurar). O lance só é cobrado de quem LEVA.</p>
  </div>
  ${secT('🕴️ Sem clube')}
  <p style="font-size:10px;font-weight:700;color:#5a5647;margin:0 0 7px;line-height:1.4">Técnicos livres da Série C. Aqui <b>ninguém defende</b> — o leilão é você × os bots da divisão.</p>
  ${livreBtn('Rogério Ceni', '🇧🇷')}${livreBtn('José Pékerman', '🇦🇷')}
`)

// ── ③ VENCEU: carta completa + cardápio novo ──
const T3 = fone('🧢 Elenco · deu bom', 43, `
  ${logBox(1, '🔨 Gasperini é SEU!', 'Fechou por 21 🪙 — o Caixote defendeu até 14 e o Bagres chegou a 17. Contrato de 5 temporadas (até a T8).')}
  ${secT('🧢 Técnico')}
  ${cartaCheia('Gian Piero Gasperini', '🇮🇹', '💜 Promessa', 'linear-gradient(160deg,#C9A9FF,#8B5CF6)', '#fff', '⚽ Ofensivo', '76–86', ['3-5-2', '3-4-3 losango', '3-4-3'])}
  <p style="font-size:10px;font-weight:800;color:#5a5647;margin:6px 2px 0;text-align:center">💰 valor 21 · 💸 salário 2/temporada · 📝 contrato até a T8</p>
  ${formBox(btnForm('3-5-2') + btnForm('3-4-3 losango') + btnForm('3-4-3') + btnForm('4-3-3', 1), '✅ Você pode trocar de formação quando quiser — vale do próximo jogo.')}
  <p style="font-size:9.5px;font-weight:700;color:#5a5647;margin:-4px 0 0;line-height:1.4">O 4-3-3 é a <b>formação da casa</b> 🏠 (o time já usava quando ele chegou) — soma ao cardápio dele sem dobrar. E o overall dele agora joga: é a <b>12ª carta</b> do time, sorteado na faixa a cada partida.</p>
`)

// ── ④ DEMISSÃO COM MULTA ──
const T4 = fone('🔎 Quero outro técnico', 43, `
  ${cartaMisterio('Xavi Hernández', '🇪🇸')}
  <p style="font-size:10px;font-weight:800;color:#5a5647;margin:9px 0 5px;text-align:center">💰 valor de mercado: <b>18</b> · sua caixa: <b>🪙 43</b></p>
  ${aviso(RED, '#FDEEEA', `⚠️ Você já tem técnico (<b>Gasperini</b>, contrato até a T8). Aliciar outro <b>DEMITE ele NA HORA</b> com multa de <b>💰 21</b> — e mesmo assim você pode <b>perder o leilão</b> (rivais e o dono também dão lance). Se não quiser pagar a multa, aguarde o contrato dele acabar.`)}
  ${stepper(18)}
  ${botao('🔥 Demitir Gasperini e ir pro leilão…', RED, '#fff')}
  <p style="text-align:center;font-size:9px;font-weight:700;color:#8a8478;margin:5px 0">— toque de novo pra confirmar —</p>
  ${botao('🔨 Confirmar: multa 💰 21 + lance 💰 18', GOLD)}
  ${logBox(0, '😤 O Bagres do Rio te atropelou', 'Cobriu com 24 🪙 (seu lance: 18) e levou Xavi. (Gasperini foi demitido com multa de 21 🪙 antes do pregão.) Você ficou SEM técnico — e mais pobre. Dureza.')}
`)

// ── ⑤ CONTRATO DE 5 ANOS ──
const T5 = fone('📋 Janela de contratos', 87, `
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:11px 12px;margin-bottom:10px">
    <p style="${OSW};font-weight:900;font-size:12.5px;margin:0 0 3px">🧢 Contrato do técnico ENCERROU</p>
    <p style="font-size:10.5px;font-weight:700;color:#5a5647;margin:0 0 8px;line-height:1.4"><b>Gasperini</b> cumpriu as 5 temporadas (venceu na T8). Renove por <b>💰 21</b> (+5 temporadas) ou deixe ir — sem multa, ele foi até o fim.</p>
    <div style="display:flex;gap:7px">
      <button style="flex:1;border:2.5px solid ${INK};border-radius:10px;padding:8px 4px;${OSW};font-weight:900;font-size:11.5px;text-transform:uppercase;background:${GREEN};color:#fff;box-shadow:2px 2px 0 ${INK}">📝 Renovar (💰 21)</button>
      <button style="flex:1;border:2.5px solid ${INK};border-radius:10px;padding:8px 4px;${OSW};font-weight:900;font-size:11.5px;text-transform:uppercase;background:#fff;box-shadow:2px 2px 0 ${INK}">👋 Deixar ir</button>
    </div>
  </div>
  ${logBox(0, '👋 Gasperini se foi', 'Contrato encerrado, sem multa — ele está na aba SEM CLUBE. Se alguém o contratar, você recupera METADE do preço.')}
  <div style="background:#fff;border:2px solid ${INK};border-radius:10px;padding:8px 10px">
    <p style="${OSW};font-weight:900;font-size:11px;margin:0 0 4px">🧾 Extrato</p>
    <p style="font-size:10px;font-weight:700;margin:0;color:#2E7D46">+ 13 🕴️ Parte da venda do técnico Gasperini</p>
    <p style="font-size:10px;font-weight:700;margin:2px 0 0;color:${RED}">− 2 💸 Folha: salário do técnico (valor ÷ 10)</p>
  </div>
`)

// ── ⑥ A VIDA DOS BOTS ──
const T6 = fone('🤖 Na virada de temporada', 87, `
  ${dashed('Os bots são <b>espertos</b>: sabem por dentro o que cada categoria vale — lance de 2 🪙 no Guardiola morre na risada (sem revelar nada na tela).')}
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:11px 12px;margin-bottom:10px">
    <p style="${OSW};font-weight:900;font-size:12px;margin:0 0 6px">O que acontece sozinho, 1× por temporada (rodada 0):</p>
    <p style="font-size:10.5px;font-weight:700;color:#333;margin:0;line-height:1.65">
      🤖 Bot <b>sem técnico</b> contrata um da aba SEM CLUBE<br>
      📈 Preços sobem ~<b>4% por temporada</b> (inflação do mercado)<br>
      💰 O valor de mercado <b>aprende</b> com cada compra de bot<br>
      🕴️ Bot que compra <b>tendo técnico</b> manda o antigo pra SEM CLUBE<br>
      🎽 Bot pode <b>trocar de formação</b> pra uma do técnico dele —<br>
      <span style="font-size:9.5px;color:#5a5647">&nbsp;&nbsp;&nbsp;&nbsp;só se o elenco preencher, e NUNCA no meio da temporada (placar já visto não muda — lei da casa)</span>
    </p>
  </div>
  ${logBox(1, '🕴️ + 13 🪙 na sua caixa', 'O Nacional da Serra contratou Gasperini (26 🪙) — você era o ex-dono e recuperou a metade.')}
  <p style="text-align:center;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45);margin:4px 0 0">Só os bots da SUA divisão disputam técnico com você.</p>
`)

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;padding:30px;font-family:system-ui}
button{cursor:default}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};padding:5px 16px;${OSW};font-size:12.5px;letter-spacing:.08em">🧢 O SISTEMA DE TÉCNICOS — como está NO AR (só a sua conta) · 27/08</div>
  <p style="font-size:12.5px;font-weight:600;max-width:1180px;line-height:1.5;margin:12px 0 20px">
    Retrato do que está codado, tela a tela: <b>①</b> sem técnico é feijão-com-arroz · <b>②</b> aliciar às cegas (só o nome) + aba sem clube ·
    <b>③</b> venceu: carta completa, cardápio do técnico + formação da casa 🏠, overall valendo como 12ª carta ·
    <b>④</b> quer outro? demissão NA HORA com multa (e dá pra perder o leilão mesmo assim) · <b>⑤</b> contrato de 5 temporadas + renovação junto dos jogadores · <b>⑥</b> a vida dos bots.</p>
  <div style="display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap">
    ${T1}${T2}${T3}${T4}${T5}${T6}
  </div>
  <p style="margin-top:18px;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55)">🤫 mapa de maquiagem das formações segue segredo de produção · ⚽ Leilão <span style="color:${RED};${OSW}">Legends</span></p>
</body>`

const tmp = `/tmp/mock-tecnico-final-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1260, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
