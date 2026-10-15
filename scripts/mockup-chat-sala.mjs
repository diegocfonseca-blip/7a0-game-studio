// 💬 MOCKUP — CHAT DA SALA MELHORADO (13/10)
//
// Diego: *"sobre os chats, as pessoas usam muito os chats... teria algo que você faria pra
// melhorar mais ainda??"* → eu dei 4 ideias e ele pediu: *"faz o mockup do chat agora que deu ideia"*.
//
// Mostra o chat de HOJE (`ChatWidget`, screens.tsx) do lado do PROPOSTO:
//   1) nome com o ESCUDO do clube + a cor do TIER da pessoa (grátis = bege, nunca dourado pra todos)
//   2) ZOEIRA RÁPIDA: uma fileira de botões prontos (1 toque = 1 mensagem, espera de 3s)
//   3) RESPONDER: toque na mensagem → a resposta sai com a citação em cima
//   4) gaveta MAIS BAIXA: o chat ocupa metade da tela e o pregão continua visível em cima
// ⚠️ Nada aqui manda mensagem extra (sem "fulano está digitando"): botão pronto custa o mesmo
// que mensagem digitada — a conta do realtime não sobe.
//
//   node scripts/mockup-chat-sala.mjs --saida scripts/mockups/chat-sala.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'scripts/mockups/chat-sala.png')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const TIER = {
  bege: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)',
  verde: 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)',
  roxo: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)',
  ouro: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)',
}
const DOTS = ['#E8503A', '#1B7A3D', '#7C3AED', '#2F6FDB']

// ── conversa (a mesma nos dois lados, pra comparar) ──
const MSGS = [
  { nome: 'Bagres de Wall Street', esc: 'bagreswallst-escudo.webp', tier: 'ouro', sel: '👑', txt: '55 no clube?? KKKKKKK quem pagou isso' },
  { nome: 'Rossini Money', esc: 'rossini-escudo.webp', tier: 'ouro', sel: '👑', txt: 'fui eu e pagaria de novo 😤' },
  { nome: 'Tocaia FC', tier: 'bege', txt: 'rasgou dinheiro na frente de todo mundo', zoe: true },
  { nome: 'Você', esc: 'intervale-escudo.webp', tier: 'verde', txt: 'próximo setor eu lacro primeiro', mine: true, cita: { nome: 'Rossini Money', txt: 'fui eu e pagaria de novo 😤' } },
]

const hojeMsg = (m, i) => `
  <div class="hm ${m.mine ? 'mine' : ''}">
    <span class="dot" style="background:${DOTS[i % 4]}"></span>
    <div class="hb" style="background:${m.mine ? '#FFF3D6' : '#fff'}"><b>${m.nome}</b><span>${m.zoe ? '💸 ' + m.txt : m.txt}</span></div>
  </div>`

const novoMsg = m => `
  <div class="nm ${m.mine ? 'mine' : ''}">
    ${m.mine ? '' : `<div class="av" style="background:${TIER[m.tier]}">${m.esc ? `<img src="${img(m.esc)}">` : '⚽'}</div>`}
    <div class="nb ${m.zoe ? 'zoe' : ''}" style="${m.mine ? 'background:#FFF3D6' : ''}">
      ${m.mine ? '' : `<div class="cr" style="background:${TIER[m.tier]}">${m.sel ? m.sel + ' ' : ''}${m.nome}</div>`}
      ${m.cita ? `<div class="cita"><b>↩ ${m.cita.nome}</b>${m.cita.txt}</div>` : ''}
      <span>${m.zoe ? '💸 RASGOU DINHEIRO!' : m.txt}</span>
    </div>
  </div>`

const pregao = `
  <div class="preg">
    <div class="pt">🔨 PREGÃO · ZAGUEIROS <span>⏱ 0:12</span></div>
    <div class="cards">${['Lúcio', 'Thiago Silva', 'Aldair'].map(n => `<div class="cd"><div class="ft">👤</div><b>${n}</b></div>`).join('')}</div>
    <div class="lance">SEU LANCE: <b>18 🪙</b></div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Inter,Arial,sans-serif;color:${INK};width:1240px;padding:40px 46px}
h1{font:700 52px/1 Oswald;text-transform:uppercase;margin:0}h1 span{color:${RED}}
.sub{font:500 22px Oswald;color:rgba(0,0,0,.6);margin-top:8px}
.cols{display:flex;gap:40px;margin-top:30px;align-items:flex-start}
.col{flex:1}.lab{font:700 30px Oswald;text-transform:uppercase;text-align:center;margin-bottom:14px}
.lab.n{color:${GREEN}}
.ph{width:390px;height:760px;margin:0 auto;border:5px solid #000;border-radius:44px;box-shadow:8px 8px 0 #000;overflow:hidden;position:relative;background:#F4ECD6}
.dim{position:absolute;inset:0;background:rgba(0,0,0,.28)}
/* pregão de fundo */
.preg{padding:22px 16px}.pt{font:700 18px Oswald;display:flex;justify-content:space-between;background:#fff;border:3px solid #000;border-radius:14px;padding:8px 12px;box-shadow:3px 3px 0 #000}
.pt span{color:${RED}}.cards{display:flex;gap:8px;margin-top:14px}
.cd{flex:1;background:linear-gradient(160deg,#FFE79A,#FFC400);border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:8px 4px;text-align:center}
.cd .ft{font-size:40px}.cd b{font:700 14px Oswald;display:block;text-transform:uppercase}
.lance{margin-top:14px;background:#fff;border:3px solid #000;border-radius:12px;padding:10px;font:700 18px Oswald;text-align:center;box-shadow:3px 3px 0 #000}
/* gaveta */
.dr{position:absolute;left:0;right:0;bottom:0;background:#FBF6E7;border-top:3px solid #000;border-radius:18px 18px 0 0;display:flex;flex-direction:column}
.hd{background:${INK};color:#fff;font:700 17px Oswald;text-transform:uppercase;padding:10px 14px;border-radius:15px 15px 0 0;display:flex;justify-content:space-between}
.hd i{font-style:normal;background:#fff;color:#000;border-radius:99px;width:24px;height:24px;display:grid;place-items:center;font-size:13px}
.list{flex:1;padding:10px;display:flex;flex-direction:column;gap:8px;overflow:hidden}
.in{display:flex;gap:6px;padding:9px;border-top:2px solid #000;background:#F4ECD6}
.in div{flex:1;background:#fff;border:2px solid #000;border-radius:9px;padding:8px 10px;font-size:14px;color:#999}
.in b{background:${GREEN};color:#fff;border:2px solid #000;border-radius:9px;padding:0 14px;display:grid;place-items:center;font:700 14px Oswald;box-shadow:2px 2px 0 #000}
/* hoje */
.hm{display:flex;gap:7px;align-items:flex-start}.hm.mine{flex-direction:row-reverse}
.dot{width:12px;height:12px;border-radius:99px;border:1.5px solid #000;margin-top:5px;flex:none}
.hb{border:2px solid #000;border-radius:11px;padding:5px 10px;box-shadow:2px 2px 0 #000;max-width:78%;font-size:14px;font-weight:600}
.hb b{font:700 11px Oswald;display:block}
/* novo */
.nm{display:flex;gap:7px;align-items:flex-end}.nm.mine{flex-direction:row-reverse}
.av{width:34px;height:34px;border-radius:10px;border:2px solid #000;display:grid;place-items:center;flex:none;box-shadow:2px 2px 0 #000;font-size:17px}
.av img{max-width:26px;max-height:28px}
.nb{background:#fff;border:2px solid #000;border-radius:12px;padding:6px 10px;box-shadow:2px 2px 0 #000;max-width:78%;font-size:14px;font-weight:600}
.nb.zoe{background:${INK};color:${GOLD};font:700 17px Oswald;letter-spacing:.03em}
.cr{display:inline-block;font:700 11px Oswald;text-transform:uppercase;border:1.5px solid #000;border-radius:6px;padding:1px 6px;margin-bottom:3px;color:#000}
.cita{border-left:4px solid ${GOLD};background:#F4ECD6;border-radius:6px;padding:4px 7px;margin-bottom:4px;font-size:12px;color:#555}
.cita b{display:block;font:700 11px Oswald;color:#000}
.zr{display:flex;gap:6px;padding:8px 9px 0;flex-wrap:wrap;border-top:2px solid #000;background:#F4ECD6}
.z{border:2px solid #000;border-radius:9px;background:#fff;font:700 13px Oswald;padding:4px 8px;box-shadow:2px 2px 0 #000;text-transform:uppercase}
.z.off{opacity:.4;box-shadow:none}
.resp{background:#FFF3D6;border-top:2px solid #000;padding:6px 10px;font-size:12px;display:flex;justify-content:space-between}
.resp b{font:700 12px Oswald}
/* legendas */
.leg{margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.lg{background:#fff;border:4px solid #000;border-radius:20px;box-shadow:5px 5px 0 #000;padding:14px 18px;display:flex;gap:14px;align-items:flex-start}
.lg .n{flex:none;width:40px;height:40px;border-radius:12px;border:3px solid #000;background:${GOLD};font:700 24px Oswald;display:grid;place-items:center;box-shadow:3px 3px 0 #000}
.lg b{font:700 24px Oswald;text-transform:uppercase;display:block}.lg span{font-size:18px;line-height:1.35;font-weight:500}
.pin{position:absolute;width:34px;height:34px;border-radius:10px;border:3px solid #000;background:${GOLD};font:700 20px Oswald;display:grid;place-items:center;box-shadow:3px 3px 0 #000;z-index:5}
.nota{margin-top:22px;background:${GREEN};color:#fff;border:4px solid #000;border-radius:20px;box-shadow:5px 5px 0 #000;padding:14px 20px;font:700 22px/1.3 Oswald}
</style></head><body>
<h1>💬 Chat da sala <span>— proposta</span></h1>
<div class="sub">Mesma conversa nos dois celulares, pra comparar. Nada muda no jogo, só no chat.</div>
<div class="cols">
  <div class="col"><div class="lab">Hoje</div>
    <div class="ph">${pregao}<div class="dim"></div>
      <div class="dr" style="height:64%"><div class="hd">💬 Zoeira da sala <i>✕</i></div>
        <div class="list">${MSGS.map(hojeMsg).join('')}</div>
        <div class="in"><div>manda a real…</div><b>ENVIAR</b></div></div>
    </div>
  </div>
  <div class="col"><div class="lab n">Proposto</div>
    <div class="ph">${pregao}
      <div class="pin" style="right:10px;top:140px">4</div>
      <div class="dr" style="height:63%;box-shadow:0 -6px 0 rgba(0,0,0,.15)"><div class="hd">💬 Zoeira da sala <i>✕</i></div>
        <div class="list" style="position:relative">
          <div class="pin" style="right:6px;top:6px">1</div>
          ${MSGS.map(novoMsg).join('')}
        </div>
                <div class="zr" style="position:relative">
          ${['😂 KKKK', '💸 Rasgou dinheiro', '🐢 Anda logo', '🤡 Pagou caro', '🔨 Bateu!', '😭 Chora'].map((z, i) => `<span class="z ${i > 3 ? '' : ''}">${z}</span>`).join('')}
        </div>
        <div class="in" style="border-top:0"><div>manda a real…</div><b>ENVIAR</b></div></div>
      <div class="pin" style="right:8px;bottom:112px">2</div>
      <div class="pin" style="left:8px;bottom:200px">3</div>
    </div>
  </div>
</div>
<div class="leg">
  <div class="lg"><div class="n">1</div><div><b>Escudo + cor do plano</b><span>Cada um aparece com o escudo do clube e a cor do PRÓPRIO plano (grátis bege, verde, roxo, ouro 👑). Hoje é só uma bolinha colorida.</span></div></div>
  <div class="lg"><div class="n">2</div><div><b>Zoeira rápida</b><span>Botões prontos: 1 toque e a frase sai grande na conversa. Espera de 3s entre um e outro, pra ninguém metralhar.</span></div></div>
  <div class="lg"><div class="n">3</div><div><b>Responder</b><span>Toca na mensagem de alguém e a sua sai com a frase dele em cima. Dá pra saber quem está zoando quem.</span></div></div>
  <div class="lg"><div class="n">4</div><div><b>Pregão continua à vista</b><span>A gaveta fica mais baixa e sem escurecer o fundo: dá pra zoar sem perder o relógio e as cartas.</span></div></div>
</div>
<div class="nota">💰 Não gasta mais do Supabase: botão pronto custa o mesmo que mensagem digitada, e não entra "fulano está digitando".</div>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1240, height: 1400 }, deviceScaleFactor: 1 })
const tmp = resolve(tmpdir(), `chat-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: SAIDA, fullPage: true }); await b.close()
console.log('💬', SAIDA)
