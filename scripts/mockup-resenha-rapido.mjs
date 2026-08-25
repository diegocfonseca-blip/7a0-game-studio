// 😈 MOCKUPS — RESENHA NO RÁPIDO ONLINE (proposta, 25/08)
//
// O Diego pediu mais zoeira pro rápido online e escolheu 3 das ideias:
//   3 · 🏆 A PREMIAÇÃO DA RESENHA (fim de partida) — e mandou JUNTAR nela os dois
//        prêmios que HOJE já aparecem na Cerimônia da Revelação: o
//        **🏅 Achado do Pregão** (melhor custo-benefício) e o **🐴 Mico do
//        Pregão** (pagou muito acima do nível). Ver `screens.tsx`, bestDeal /
//        worstDeal — hoje eles saem como duas linhas soltas numa caixa, só no
//        card do último técnico, e somem.
//   5 · 🎙️ NARRAÇÃO com o nome dos amigos durante a simulação (o maior tempo
//        morto do jogo: ~3 min de campeonato rodando com a tela quieta).
//   7 · 🐊 A MASCOTE do clube batizado como reação, no lugar do emoji.
//
// Regra de ouro respeitada nas três: tudo em TEMPO MORTO, nenhum passo novo.
//
//   node scripts/mockup-resenha-rapido.mjs            → resenha-3/5/7.png
//   node scripts/mockup-resenha-rapido.mjs --dir /tmp
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const DIR = arg('--dir', '.')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`

const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif'
const box = (bg = '#fff', r = 16, sh = 4) => `background:${bg};border:3px solid ${INK};border-radius:${r}px;box-shadow:${sh}px ${sh}px 0 ${INK}`
const chip = txt => `<div style="text-align:center;margin-bottom:12px"><span style="display:inline-block;${box(GOLD, 999, 3)};padding:5px 14px;${OSW};font-weight:700;font-size:11px;letter-spacing:1.1px;text-transform:uppercase">${txt}</span></div>`
const nota = (t, c) => `<div style="${box('#FBF6E9', 14, 3)};padding:11px 13px;margin-top:12px">
  <p style="font-size:11.5px;font-weight:700;line-height:1.42;margin:0;color:rgba(0,0,0,.72)">${c}</p></div>`.replace('§', t)
const page = (w, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,sans-serif;width:${w}px;padding:16px 14px 22px}
</style></head><body>${body}</body></html>`

// ═══════════════════════════════════════════════════════════════ 3
// prêmio: cor da faixa, ícone, título, quem levou, a conta que prova
const premio = (cor, ic, titulo, quem, detalhe, jaExiste) => `
  <div style="${box('#fff', 14, 3)};overflow:hidden;margin-bottom:9px">
    <div style="background:${cor};padding:6px 11px;display:flex;align-items:center;gap:7px">
      <span style="font-size:15px">${ic}</span>
      <b style="${OSW};font-weight:700;font-size:12.5px;color:#fff;letter-spacing:.6px;text-transform:uppercase;flex:1">${titulo}</b>
      ${jaExiste ? `<span style="${OSW};font-weight:700;font-size:8px;background:rgba(255,255,255,.9);color:${INK};border-radius:999px;padding:2px 7px">JÁ EXISTE</span>` : ''}
    </div>
    <div style="padding:8px 11px">
      <p style="${OSW};font-weight:700;font-size:15px;margin:0;line-height:1.15">${quem}</p>
      <p style="font-size:11.5px;font-weight:700;color:rgba(0,0,0,.6);margin:2px 0 0;line-height:1.3">${detalhe}</p>
    </div>
  </div>`

const P3 = page(412, `
${chip('🏆 Mockup · ideia 3 · premiação da resenha')}
<div style="${box(INK, 18, 4)};padding:15px;color:#fff;margin-bottom:14px">
  <p style="${OSW};font-weight:700;font-size:10.5px;letter-spacing:1.2px;margin:0;opacity:.6;text-transform:uppercase">Acabou o campeonato · sala do Braguinha</p>
  <p style="${OSW};font-weight:700;font-size:29px;margin:2px 0 4px;line-height:1;color:${GOLD}">Agora a conta.</p>
  <p style="font-size:12.5px;font-weight:600;line-height:1.35;margin:0;opacity:.85">O troféu já foi entregue. Isto aqui é o que ninguém queria que aparecesse.</p>
</div>

${premio(GREEN, '🏅', 'Achado do pregão', 'Romário · Neymarzetti', 'Nível 86–93 e pagou <b>4 moedas</b>. Roubou.', true)}
${premio('#8B5E3C', '🐴', 'Mico do pregão', 'Vampeta · Bar do Zé', 'Nível 58–74 e pagou <b>31 moedas</b>. Doeu.', true)}

<p style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(0,0,0,.45);margin:16px 0 8px">E os novos</p>

${premio(RED, '💸', 'Mão furada', 'Braguinha', 'Pagou <b>30</b> no Zico. O 2º lance era <b>8</b>. Jogou <b>22 moedas</b> no lixo.')}
${premio('#B45309', '🤏', 'Mão de vaca', 'Zé do Bar', '<b>9 lances de 1 moeda</b> na mesma partida. Terminou com 61 moedas na mão.')}
${premio(PURPLE, '⚡', 'Afobado', 'Gui', 'Lacrou o envelope em <b>4 segundos</b>, em todos os 6 setores.')}
${premio('#0E8A8A', '🐢', 'Enrolado', 'Lucas', 'A sala esperou <b>3min12</b> por ele. Todo mundo viu.')}
${premio('#6B7280', '🗑️', 'Perna-de-pau titular', 'Bar do Zé', 'Escalou o <b>Adriano Gol Contra</b> (41–55) como titular. De propósito?')}

<div style="${box(GOLD, 16, 4)};padding:12px 14px;margin-top:14px;text-align:center">
  <p style="${OSW};font-weight:700;font-size:16px;margin:0">📤 Mandar no grupo</p>
  <p style="font-size:10.5px;font-weight:700;margin:3px 0 0;opacity:.7">vira uma imagem pronta pro zap</p>
</div>

<div style="${box('#FBF6E9', 14, 3)};padding:11px 13px;margin-top:12px">
  <p style="${OSW};font-weight:700;font-size:12px;margin:0 0 4px;text-transform:uppercase">Os dois de cima já existem</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.42;margin:0;color:rgba(0,0,0,.72)">
    Hoje o <b>Achado</b> e o <b>Mico</b> saem como duas linhas soltas na Cerimônia, só no card do último técnico — e somem.
    Aqui eles <b>voltam no fim</b>, com pódio, do lado dos novos. Mesmo cálculo, nada muda no jogo.</p>
</div>
<div style="${box('#fff', 14, 3)};padding:11px 13px;margin-top:9px">
  <p style="${OSW};font-weight:700;font-size:12px;margin:0 0 4px;text-transform:uppercase">⏱️ Não atrasa nada</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.42;margin:0;color:rgba(0,0,0,.72)">
    É <b>depois do apito</b>, com a partida encerrada. Todo número aí já é calculado pelo jogo hoje — ninguém precisa fazer nada a mais.</p>
</div>`)

// ═══════════════════════════════════════════════════════════════ 5
const fala = (ic, t, destaque) => `
  <div style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:2px dashed rgba(255,255,255,.12)">
    <span style="font-size:14px;flex:none;margin-top:1px">${ic}</span>
    <p style="font-size:12.5px;font-weight:600;line-height:1.38;margin:0;color:${destaque ? '#fff' : 'rgba(255,255,255,.72)'}">${t}</p>
  </div>`

const P5 = page(412, `
${chip('🎙️ Mockup · ideia 5 · narração com o nome dos amigos')}

<div style="${box('#fff', 16, 4)};overflow:hidden;margin-bottom:12px">
  <div style="background:${GREEN};padding:9px 12px;display:flex;align-items:center;justify-content:space-between;color:#fff">
    <b style="${OSW};font-weight:700;font-size:13px">RODADA 27 de 38</b>
    <b style="${OSW};font-weight:700;font-size:12px;opacity:.85">⏱️ falta 1min40</b>
  </div>
  <div style="height:6px;background:#2b2721"><div style="height:100%;width:71%;background:linear-gradient(90deg,${GOLD},#ffde5c)"></div></div>
  <div style="padding:10px 12px">
    ${[['Neymarzetti 🔥', 3, 0, 'Bar do Zé'], ['Gui ⚔️', 1, 1, 'Perna de Pau City'], ['Lucas FC', 0, 2, 'Braguinha 🔥']]
      .map(([a, ga, gb, b]) => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-weight:800;font-size:12.5px">
        <span style="flex:1;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a}</span>
        <span style="${OSW};font-weight:700;background:${INK};color:#fff;border-radius:7px;padding:1px 9px;font-size:13px">${ga}×${gb}</span>
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b}</span></div>`).join('')}
  </div>
</div>

<div style="${box('#171512', 16, 4)};padding:12px 14px;color:#fff">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
    <span style="width:8px;height:8px;border-radius:50%;background:${RED};display:inline-block"></span>
    <b style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${GOLD}">Narração ao vivo</b>
  </div>
  ${fala('🎙️', 'O <b>Neymarzetti do Braguinha</b> tá dando aula. 3×0 e o <b>Zé</b> ainda não viu a bola passar.', true)}
  ${fala('⚽', '<b>Romário</b> fez mais um pro <b>Lucas</b>. Lembrando que ele pagou <b>4 moedas</b> nesse cara.')}
  ${fala('😬', '<b>Gui</b>, teu zagueirão de 31 moedas acabou de dar o pênalti.')}
  ${fala('📉', '<b>Bar do Zé</b> caiu pro 8º. Tá cheirando a lanterna.')}
</div>

<div style="${box('#FBF6E9', 14, 3)};padding:11px 13px;margin-top:12px">
  <p style="${OSW};font-weight:700;font-size:12px;margin:0 0 4px;text-transform:uppercase">⏱️ O maior tempo morto do jogo</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.42;margin:0;color:rgba(0,0,0,.72)">
    São <b>3 minutos</b> de campeonato rodando com a tela quieta. A narração ocupa esse tempo <b>sem adiantar resultado</b>:
    ela só fala do que <b>já apareceu no placar</b> — nada de spoiler.</p>
</div>
<div style="${box('#fff', 14, 3)};padding:11px 13px;margin-top:9px">
  <p style="${OSW};font-weight:700;font-size:12px;margin:0 0 4px;text-transform:uppercase">😈 A graça é citar os amigos</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.42;margin:0;color:rgba(0,0,0,.72)">
    Ela usa <b>o nome do time de cada um</b> e o <b>quanto pagou</b> no leilão. É a narração cobrando a conta do pregão em pleno jogo.</p>
</div>`)

// ═══════════════════════════════════════════════════════════════ 7
const P7 = page(412, `
${chip('🐊 Mockup · ideia 7 · a mascote como reação')}

<div style="${box('#fff', 16, 4)};overflow:hidden;margin-bottom:12px;position:relative">
  <div style="background:${PURPLE};padding:8px 12px;color:#fff">
    <b style="${OSW};font-weight:700;font-size:12.5px">🔨 SETOR: ATACANTES · lance secreto</b>
  </div>
  <div style="padding:12px;position:relative;min-height:190px;background:linear-gradient(180deg,#fff,#F7F1DD)">
    <div style="${box('#fff', 12, 3)};padding:9px 11px;display:flex;align-items:center;gap:9px;max-width:250px">
      <span style="width:34px;height:34px;border-radius:50%;background:linear-gradient(150deg,#FFE79A,#E8A200);border:2.5px solid ${INK};${OSW};font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px">R</span>
      <span><b style="display:block;${OSW};font-weight:700;font-size:15px">Romário</b>
      <b style="display:block;font-size:10px;font-weight:800;opacity:.55">Vasco · 2000</b></span>
    </div>
    <!-- mascotes flutuando (é isto que muda) -->
    <img src="${img('leao-estradinha-mascote.webp')}" style="position:absolute;right:14px;top:6px;height:96px" />
    <img src="${img('coringas-mascote.webp')}" style="position:absolute;right:104px;top:64px;height:74px;opacity:.85" />
    <div style="position:absolute;right:12px;bottom:10px;background:${INK};color:#fff;border-radius:999px;padding:3px 10px;${OSW};font-weight:700;font-size:10px">Leão da Estradinha soltou o bicho 🦁</div>
  </div>
</div>

<p style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(0,0,0,.45);margin:0 0 8px">O que você toca</p>
<div style="${box('#fff', 14, 3)};padding:11px">
  <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">
    ${['😈', '💸', '❤️', '🪙', '🥱', '🤣'].map(e => `<span style="border:2px solid ${INK};border-radius:999px;padding:4px 11px;font-size:14px;background:#fff">${e}</span>`).join('')}
  </div>
  <div style="display:flex;align-items:center;gap:9px;${box('#EAF0FB', 12, 3)};padding:8px 10px;border-color:${PURPLE}">
    <img src="${img('leao-estradinha-mascote.webp')}" style="height:40px" />
    <span style="flex:1"><b style="display:block;${OSW};font-weight:700;font-size:13.5px">🦁 SOLTA A SUA MASCOTE</b>
    <b style="display:block;font-size:11px;font-weight:700;opacity:.62">só quem tem clube batizado</b></span>
    <span style="${OSW};font-weight:700;font-size:10px;background:${PURPLE};color:#fff;border:2px solid ${INK};border-radius:999px;padding:3px 9px">NOVO</span>
  </div>
</div>

<div style="${box('#FBF6E9', 14, 3)};padding:11px 13px;margin-top:12px">
  <p style="${OSW};font-weight:700;font-size:12px;margin:0 0 4px;text-transform:uppercase">💛 Faz o batismo APARECER</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.42;margin:0;color:rgba(0,0,0,.72)">
    Hoje a mascote de quem batizou só sai no gol e na festa de campeão — <b>ninguém da sala vê</b>. Aqui ela invade a tela de todo mundo no meio do pregão.
    É a propaganda do batismo <b>dentro do jogo</b>, feita pelo próprio dono.</p>
</div>
<div style="${box('#fff', 14, 3)};padding:11px 13px;margin-top:9px">
  <p style="${OSW};font-weight:700;font-size:12px;margin:0 0 4px;text-transform:uppercase">🎨 Zero arte nova</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.42;margin:0;color:rgba(0,0,0,.72)">
    As mascotes <b>já estão no jogo</b> (as duas aí em cima são reais: o Leão da Estradinha e o Coringas do Diniz).
    Elas entram na mesma camada flutuante das reações que já existe — e no mesmo limite de tempo, pra não virar bagunça.</p>
</div>`)

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [nome, html] of [['resenha-3-premiacao', P3], ['resenha-5-narracao', P5], ['resenha-7-mascote', P7]]) {
  const tmp = `/tmp/${nome}-${process.pid}.html`
  writeFileSync(tmp, html)
  const p = await b.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 })
  await p.goto('file://' + tmp)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${DIR}/${nome}.png`, fullPage: true })
  await p.close()
  console.log(`${DIR}/${nome}.png`)
}
await b.close()
