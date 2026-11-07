#!/usr/bin/env node
// 🎨 MOCKUP — PAINEL DO DONO DENTRO DA LIGA (06/11)
// Diego: *"pro cara não ter que ficar saindo toda hora… uma opção pra ele fazer dentro, quando estiver jogando,
// algum botão lá embaixo, onde tem gerenciar técnicos… de convites, pra aceitar… coisas que só o host pode ver"*.
// 3 telas: (1) jogo rolando com o botão 👑 no rodapé + aviso discreto de pedido · (2) painel aberto
// (pedidos · próxima temporada · convidar · técnicos) · (3) aceitando: escolher quem sai.
// uso: node scripts/mockup-painel-dono-liga.mjs → scripts/mockups/painel-dono-liga.png
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`
const ESC = { fut: img('futpoint-escudo.webp'), pri: img('principe-escudo.webp'), sto: img('stocco-escudo.webp') }
const OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

const linhaTab = (p, nome, pts, eu = false, esc = '') => `<div class="lt${eu ? ' eu' : ''}"><span class="p">${p}</span>${esc ? `<img src="${esc}">` : '<i class="bola"></i>'}<b>${nome}</b><span class="pts">${pts}</span></div>`

const rodape = (aberto = false) => `
<div class="rod">
  <div class="links"><u>🏠 voltar pro menu</u><u>🚪 sair da sala</u></div>
  <button class="dono${aberto ? ' ab' : ''}">👑 PAINEL DO DONO <span class="bol">1</span></button>
  <small class="so">só você (dono da liga) vê este botão</small>
</div>`

const tela1 = `<div class="tela">
<div class="topo"><b>📋 LIGA DRAFT DO FUTPOINT</b><small>Temporada 9 · Rodada 12 de 18</small></div>
<div class="toast">📨 <b>Judas</b> pediu pra entrar na liga <span>ver ›</span></div>
<div class="placar"><div class="tm"><img src="${ESC.fut}"><b>FUTPOINT</b></div><div class="pl">2 <i>×</i> 1<small>67'</small></div><div class="tm"><img src="${ESC.pri}"><b>PRÍNCIPE R.N.</b></div></div>
<div class="tab">
${linhaTab(1, 'Futpoint', 28, true, ESC.fut)}${linhaTab(2, 'Príncipe Rubro Negro', 26, false, ESC.pri)}${linhaTab(3, 'Stocco FC 🤖', 21, false, ESC.sto)}${linhaTab(4, 'Duarte', 19)}${linhaTab(5, 'Real Várzea 🤖', 15)}
</div>
${rodape()}
<p class="obs">👆 O aviso aparece <b>no cantinho, sem parar o jogo</b>, e some sozinho em 6s. A bolinha vermelha no botão fica até você decidir.</p>
</div>`

const tela2 = `<div class="tela">
<div class="topo"><b>📋 LIGA DRAFT DO FUTPOINT</b><small>Temporada 9 · Rodada 12 de 18</small></div>
${rodape(true)}
<div class="painel">
  <div class="ph">👑 PAINEL DO DONO <span>✕</span></div>
  <div class="sec"><h3>📨 PEDIDOS PRA ENTRAR <em>1</em></h3>
    <div class="ped"><div class="av">J</div><div class="pi"><b>Judas</b><small>⭐ Craque · pediu há 3 min</small></div><button class="ok">ACEITAR</button><button class="no">✕</button></div>
    <p class="dica">Quem você aceita entra na <b>virada da temporada</b>, nunca no meio.</p>
  </div>
  <div class="sec"><h3>⚙️ PRÓXIMA TEMPORADA</h3>
    <div class="seg"><span class="on">10 times</span><span>20 times</span></div>
    <div class="seg"><span class="on">38 rodadas · ida e volta</span><span>19 · só ida</span></div>
    <p class="dica">Vale a partir da temporada 10. De 20 nunca volta pra 10.</p>
  </div>
  <div class="sec"><h3>🔗 CONVIDAR</h3>
    <div class="cod"><b>4RVDD8</b><button>📋 COPIAR CÓDIGO</button></div>
  </div>
  <div class="sec"><h3>👥 TÉCNICOS AGORA</h3>
    <div class="tec"><i class="on"></i>Futpoint <small>você</small></div>
    <div class="tec"><i class="off"></i>Príncipe Rubro Negro <small>fora há 2h · o time espera ele</small></div>
    <div class="tec"><i class="on"></i>Duarte</div>
  </div>
</div>
</div>`

const opc = (esc, nome, sub, sel = false) => `<div class="opc${sel ? ' sel' : ''}">${esc ? `<img src="${esc}">` : '<i class="bola"></i>'}<div><b>${nome}</b><small>${sub}</small></div>${sel ? '<span class="ck">✔</span>' : ''}</div>`
const tela3 = `<div class="tela">
<div class="topo"><b>📋 LIGA DRAFT DO FUTPOINT</b><small>Temporada 9 · Rodada 12 de 18</small></div>
<div class="painel" style="margin-top:14px">
  <div class="ph">✅ ACEITAR O JUDAS <span>✕</span></div>
  <div class="sec"><h3>NO LUGAR DE QUEM?</h3>
    <p class="gr">🤖 BOTS</p>
    ${opc(ESC.sto, 'Stocco FC', '3º · 21 pts · Judas fica com os jogadores', true)}
    ${opc('', 'Real Várzea', '5º · 15 pts')}
    <p class="gr">👤 TÉCNICOS</p>
    ${opc(ESC.pri, 'Príncipe Rubro Negro', 'sai da liga e vê "você foi removido pelo dono"')}
    <div class="aviso">⚠️ Trocar um técnico tira ele da liga de vez.</div>
  </div>
  <button class="grande">ACEITAR · ENTRA NA TEMPORADA 10</button>
  <p class="dica" style="text-align:center">Ele entra com o nome e a cor dele.</p>
</div>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#E9DFC3;font-family:system-ui,sans-serif;color:#0C0C0C;padding:28px}
h1.t{font-family:Oswald;font-weight:700;font-size:30px;text-transform:uppercase;margin-bottom:4px}
.sub{font-size:14px;margin-bottom:20px;opacity:.7}
.wrap{display:flex;gap:26px;align-items:flex-start}
.col{width:380px}.col>h2{font-family:Oswald;font-weight:700;font-size:17px;text-transform:uppercase;margin-bottom:8px}
.tela{background:#F4ECD6;border:4px solid #000;border-radius:26px;box-shadow:4px 4px 0 #000;padding:14px;min-height:760px;position:relative}
.topo{background:#fff;border:3px solid #000;border-radius:14px;padding:8px 12px;box-shadow:3px 3px 0 #000}
.topo b{font-family:Oswald;font-weight:700;font-size:15px;display:block}.topo small{font-size:11px;opacity:.6}
.toast{margin:10px 0;background:#fff;border:3px solid #000;border-left:10px solid #7C3AED;border-radius:12px;padding:8px 10px;font-size:13px;box-shadow:3px 3px 0 #000;display:flex;gap:6px;align-items:center}
.toast span{margin-left:auto;font-family:Oswald;font-weight:700;color:#7C3AED}
.placar{display:flex;align-items:center;justify-content:space-between;background:#0C0C0C;color:#fff;border-radius:16px;padding:14px 10px;margin:10px 0;border:3px solid #000}
.tm{width:100px;text-align:center}.tm img{height:44px}.tm b{display:block;font-family:Oswald;font-size:12px;margin-top:4px}
.pl{font-family:Oswald;font-weight:700;font-size:38px;text-align:center}.pl i{font-size:20px;opacity:.5;font-style:normal}.pl small{display:block;font-size:12px;color:#FFC400}
.tab{background:#fff;border:3px solid #000;border-radius:14px;overflow:hidden;box-shadow:3px 3px 0 #000}
.lt{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid #0001;font-size:13px}
.lt.eu{background:#FFF3C4}.lt .p{width:16px;font-family:Oswald;font-weight:700}.lt img{height:20px}.lt b{flex:1;font-weight:600}.lt .pts{font-family:Oswald;font-weight:700}
.bola{width:20px;height:20px;border-radius:50%;background:#ccc;border:2px solid #000;display:inline-block}
.rod{text-align:center;margin-top:16px}
.links{display:flex;justify-content:center;gap:18px;font-size:12px;opacity:.45;margin-bottom:10px}
.dono{font-family:Oswald;font-weight:700;font-size:16px;background:${OURO};border:3px solid #000;border-radius:14px;padding:10px 18px;box-shadow:3px 3px 0 #000;position:relative}
.dono.ab{box-shadow:none;transform:translate(3px,3px)}
.bol{position:absolute;top:-10px;right:-10px;background:#E8503A;color:#fff;border:2px solid #000;border-radius:50%;width:24px;height:24px;font-size:13px;display:flex;align-items:center;justify-content:center}
.so{display:block;font-size:11px;opacity:.5;margin-top:6px}
.obs{margin-top:16px;font-size:13px;background:#fff;border:2px dashed #0005;border-radius:12px;padding:10px}
.painel{background:#fff;border:4px solid #000;border-radius:20px;box-shadow:4px 4px 0 #000;margin-top:12px;overflow:hidden}
.ph{background:${OURO};border-bottom:3px solid #000;padding:10px 14px;font-family:Oswald;font-weight:700;font-size:17px;display:flex}.ph span{margin-left:auto}
.sec{padding:10px 14px;border-bottom:2px solid #0001}
.sec h3{font-family:Oswald;font-weight:700;font-size:13px;letter-spacing:.5px;margin-bottom:7px}
.sec h3 em{background:#E8503A;color:#fff;border-radius:8px;padding:0 6px;font-style:normal;margin-left:4px}
.ped{display:flex;align-items:center;gap:8px;background:#F4ECD6;border:2px solid #000;border-radius:12px;padding:7px}
.av{width:34px;height:34px;border-radius:50%;background:linear-gradient(160deg,#F4F7FB,#9BA7B5);border:2px solid #000;display:flex;align-items:center;justify-content:center;font-family:Oswald;font-weight:700}
.pi{flex:1}.pi b{display:block;font-size:14px}.pi small{font-size:11px;opacity:.6}
.ok{font-family:Oswald;font-weight:700;background:#1B7A3D;color:#fff;border:2px solid #000;border-radius:10px;padding:6px 10px;box-shadow:2px 2px 0 #000}
.no{font-family:Oswald;font-weight:700;background:#fff;border:2px solid #000;border-radius:10px;padding:6px 9px;box-shadow:2px 2px 0 #000}
.dica{font-size:11px;opacity:.6;margin-top:6px}
.seg{display:flex;border:2px solid #000;border-radius:10px;overflow:hidden;margin-bottom:6px}
.seg span{flex:1;text-align:center;font-family:Oswald;font-weight:500;font-size:12px;padding:6px 4px}.seg span.on{background:#0C0C0C;color:#FFC400;font-weight:700}
.cod{display:flex;align-items:center;gap:10px}.cod b{font-family:Oswald;font-size:24px;letter-spacing:3px}
.cod button{margin-left:auto;font-family:Oswald;font-weight:700;background:#7C3AED;color:#fff;border:2px solid #000;border-radius:10px;padding:7px 10px;box-shadow:2px 2px 0 #000}
.tec{display:flex;align-items:center;gap:7px;font-size:13px;padding:3px 0}.tec small{opacity:.5;font-size:11px}
.tec i{width:10px;height:10px;border-radius:50%;border:1.5px solid #000}.tec i.on{background:#1B7A3D}.tec i.off{background:#ccc}
.gr{font-family:Oswald;font-weight:700;font-size:11px;opacity:.5;margin:6px 0 4px}
.opc{display:flex;align-items:center;gap:9px;border:2px solid #0003;border-radius:12px;padding:8px;margin-bottom:6px}
.opc.sel{border:3px solid #000;background:#E7F5EC;box-shadow:2px 2px 0 #000}
.opc img{height:30px}.opc div{flex:1}.opc b{display:block;font-size:14px}.opc small{font-size:11px;opacity:.6}
.ck{font-size:18px;color:#1B7A3D;font-weight:900}
.aviso{font-size:12px;background:#FDECE8;border:2px solid #C2452F;border-radius:10px;padding:6px 8px;margin-top:4px}
.grande{display:block;width:calc(100% - 28px);margin:12px 14px 4px;font-family:Oswald;font-weight:700;font-size:16px;background:#1B7A3D;color:#fff;border:3px solid #000;border-radius:14px;padding:12px;box-shadow:3px 3px 0 #000}
.painel>.dica{padding-bottom:12px}
</style></head><body>
<h1 class="t">👑 Painel do dono — dentro da liga</h1>
<p class="sub">Liga Draft e Liga da Turma · tudo que hoje só dá pra fazer fora da sala, agora sem sair do jogo · só o dono vê</p>
<div class="wrap">
<div class="col"><h2>1 · Jogo rolando</h2>${tela1}</div>
<div class="col"><h2>2 · Painel aberto</h2>${tela2}</div>
<div class="col"><h2>3 · Aceitando alguém</h2>${tela3}</div>
</div></body></html>`

const dir = resolve(tmpdir(), 'mock-painel'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true })
writeFileSync(`${dir}/m.html`, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1270, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${dir}/m.html`); await p.waitForTimeout(300)
mkdirSync('scripts/mockups', { recursive: true })
await p.screenshot({ path: 'scripts/mockups/painel-dono-liga.png', fullPage: true })
await b.close()
console.log('ok → scripts/mockups/painel-dono-liga.png')
