// ─── 🔨 SE EU PUDESSE REFAZER A ÁREA DE CRIAR SALA ──────────────────────────
//
// Pergunta do Diego (29/08): *"se você pudesse reformular toda a área de criar
// sala, o que você faria? E me manda o mockup também"*.
//
// 📏 O DIAGNÓSTICO, MEDIDO E NÃO CHUTADO: contei no código — a tela de criação
// pede **11 decisões** antes de deixar a pessoa jogar (modo · solo/duplas ·
// baralho · formação · rivais · copa · ritmo · senha · chat · stream · tempo do
// leilão). E várias delas são coisas que só quem JÁ JOGOU consegue avaliar: o que
// é "liga + liberta"? o que muda no "ritmo manual"? O cara acabou de chegar,
// queria chamar os amigos, e leva um formulário.
//
// 💡 A IDEIA: **1 decisão + o botão.** O modo é a única coisa que muda o jogo de
// verdade; todo o resto tem um padrão bom e vira ⚙️ Ajustes, fechado. Nada some —
// uma linha embaixo do botão mostra o que está valendo, pra não virar caixa-preta
// (o Diego odeia estado escondido).
//
// Isto é PROPOSTA, não código: nada foi mexido no jogo.
//
//   node scripts/mockup-criar-sala.mjs [--saida x.png]
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const saida = process.argv.includes('--saida') ? process.argv[process.argv.indexOf('--saida') + 1] : 'criar-sala.png'
const GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A', PURPLE = '#7C3AED'

const rot = (t, bg, cor = '#0C0C0C') => `<span style="font:900 12.5px Oswald;letter-spacing:.6px;text-transform:uppercase;color:${cor};background:${bg};border:2px solid #000;border-radius:999px;padding:4px 12px;display:inline-block;margin-bottom:10px">${t}</span>`

// ── ANTES: o formulário de hoje, encolhido pra caber ────────────────────────
const campo = (rotulo, valor, destaque) => `
  <div style="font:900 9.5px Oswald;letter-spacing:.9px;text-transform:uppercase;color:rgba(255,255,255,.4);margin:9px 0 4px">${rotulo}</div>
  <div style="display:flex;border:2px solid #000;border-radius:8px;overflow:hidden">
    ${valor.map((v, i) => `<div style="flex:1;text-align:center;font:900 10.5px Oswald;padding:6px 0;background:${i === destaque ? GOLD : '#fff'};color:#000;${i ? 'border-left:2px solid #000' : ''}">${v}</div>`).join('')}
  </div>`

const ANTES = `
  <div style="width:390px;background:#161616;border:3px solid #000;border-radius:16px;padding:13px;box-shadow:4px 4px 0 #000">
    <div style="font:900 12px Oswald;color:${GOLD};text-transform:uppercase;margin-bottom:2px">① O básico</div>
    ${campo('Modo de jogo', ['⚡ Rápido', '🏆 Minhas ligas', '🌐 Carreira', '🃏 Bafo'], 0)}
    ${campo('Quem comanda cada time', ['👤 Solo', '🤝 Duplas'], 0)}
    ${campo('Baralho de craques', ['🇧🇷 Brasil', '🌍 Europa', '🌎 Todos'], 2)}
    ${campo('Formação (vale pra todos)', ['4-3-3', '4-4-2'], 0)}
    <div style="font:900 12px Oswald;color:${GOLD};text-transform:uppercase;margin:14px 0 2px">② A partida</div>
    ${campo('Depois da liga', ['🏆 Liga + Copa', '🌎 Liga + Liberta', '📊 Só liga'], 0)}
    ${campo('Ritmo', ['⚡ Auto', '🎮 Manual'], 0)}
    <div style="font:900 12px Oswald;color:${GOLD};text-transform:uppercase;margin:14px 0 2px">③ A sala</div>
    ${['🔓 Sala aberta · qualquer um entra', '💬 Chat da sala · a galera pode zoar', '🎥 Modo Stream · esconde os valores'].map(t => `
      <div style="border:2px solid #000;border-radius:9px;padding:7px 9px;background:#fff;font:900 10.5px Oswald;color:#000;margin-top:7px">${t}</div>`).join('')}
    <div style="margin-top:13px;text-align:center;border:3px solid #000;border-radius:11px;padding:10px 0;font:900 14px Oswald;background:${GREEN};color:#fff;box-shadow:3px 3px 0 #000">🔨 CRIAR SALA</div>
    <div style="font:700 10px system-ui;color:${RED};margin-top:9px;line-height:1.4">⚠️ 11 decisões antes de conseguir jogar — e o botão está lá embaixo, depois de tudo.</div>
  </div>`

// ── DEPOIS: 1 decisão + botão ───────────────────────────────────────────────
const cartao = (ic, nome, frase, sel, selo) => `
  <div style="display:flex;align-items:center;gap:11px;border:3px solid #000;border-radius:13px;padding:11px 12px;background:${sel ? GOLD : '#fff'};box-shadow:${sel ? `3px 3px 0 #000` : 'none'};margin-bottom:8px">
    <span style="font-size:24px">${ic}</span>
    <div style="flex:1;min-width:0">
      <div style="font:900 15px Oswald;color:#000;display:flex;align-items:center;gap:6px">${nome}${selo ? `<span style="font:900 8.5px Oswald;border:2px solid #000;border-radius:4px;padding:1px 5px;background:${sel ? '#fff' : GOLD};color:#000">${selo}</span>` : ''}</div>
      <div style="font:700 11px system-ui;color:rgba(0,0,0,.62);margin-top:1px">${frase}</div>
    </div>
    <span style="font-size:17px;opacity:${sel ? 1 : 0.18}">${sel ? '✅' : '⚪'}</span>
  </div>`

const DEPOIS = `
  <div style="width:390px;background:#161616;border:3px solid #000;border-radius:16px;padding:13px;box-shadow:4px 4px 0 #000">
    <div style="font:900 15px Oswald;color:#fff;text-transform:uppercase;margin-bottom:3px">O que vocês vão jogar?</div>
    <div style="font:700 11px system-ui;color:rgba(255,255,255,.45);margin-bottom:11px">Escolhe um. O resto já está no ponto.</div>
    ${cartao('⚡', 'Rápido', 'Uma temporada. Começa agora.', true, '')}
    ${cartao('🏆', 'Minhas ligas', 'A sala da turma que não acaba.', false, '👑 LENDA')}
    ${cartao('🌐', 'Carreira', '4 divisões — sobe e cai.', false, '')}
    ${cartao('🃏', 'Bafo', 'Traga o time da sua carreira, valendo carta.', false, '')}
    <div style="margin-top:14px;text-align:center;border:3px solid #000;border-radius:13px;padding:14px 0;font:900 17px Oswald;background:${GREEN};color:#fff;box-shadow:4px 4px 0 #000">🔨 CRIAR E CHAMAR A GALERA</div>
    <div style="display:flex;align-items:center;gap:7px;margin-top:10px;border:2px dashed rgba(255,255,255,.28);border-radius:10px;padding:8px 10px">
      <span style="font:700 10.5px system-ui;color:rgba(255,255,255,.6);flex:1;line-height:1.45">🌎 Todos · 4-3-3 · com bots · 45s · 💬 chat · 🔓 aberta</span>
      <span style="font:900 10px Oswald;text-transform:uppercase;color:#000;background:#fff;border:2px solid #000;border-radius:7px;padding:5px 9px">⚙️ Mudar</span>
    </div>
    <div style="font:700 10px system-ui;color:rgba(255,255,255,.35);margin-top:7px;line-height:1.45">A linha acima mostra tudo que está valendo. Nada fica escondido — só sai da frente de quem não quer mexer.</div>
  </div>`

const AJUSTES = `
  <div style="width:390px;background:#161616;border:3px solid #000;border-radius:16px;padding:13px;box-shadow:4px 4px 0 #000">
    <div style="font:900 15px Oswald;color:#fff;text-transform:uppercase;margin-bottom:3px">⚙️ Ajustes da sala</div>
    <div style="font:700 11px system-ui;color:rgba(255,255,255,.45);margin-bottom:11px">Aberto só por quem quiser. Fecha e volta pro botão.</div>
    ${[['🎴 Baralho', '🌎 Todos (BR+EU+Mundo)'],
       ['🎽 Formação de todos', '4-3-3'],
       ['🤖 Bots na tabela', 'Com bots até 20'],
       ['⏱️ Tempo do envelope', '45 segundos'],
       ['🤝 Duplas', 'Desligado — cada um no seu time'],
       ['💬 Chat da sala', 'Ligado'],
       ['🔒 Senha', 'Sem senha — qualquer um entra'],
       ['🎥 Modo Stream', 'Desligado'],
       ['🏆 Depois da liga', 'Liga + Copa']].map(([k, v]) => `
      <div style="display:flex;align-items:center;gap:9px;border:2px solid #000;border-radius:9px;padding:7px 10px;background:#fff;margin-bottom:6px">
        <div style="flex:1"><div style="font:900 11.5px Oswald;color:#000">${k}</div><div style="font:700 10px system-ui;color:rgba(0,0,0,.55)">${v}</div></div>
        <span style="font:900 15px Oswald;color:rgba(0,0,0,.3)">›</span>
      </div>`).join('')}
    <div style="font:700 10px system-ui;color:rgba(255,255,255,.35);margin-top:8px;line-height:1.45">Mesmas opções de hoje, na mesma ordem de importância. Nenhuma foi removida.</div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{background:#0a0a0a;padding:34px;font-family:system-ui}b{color:#fff}</style>
</head><body>
  <div style="font:900 27px Oswald;color:#fff;text-transform:uppercase;margin-bottom:4px">🔨 Criar sala — o que eu faria</div>
  <div style="font:700 13px system-ui;color:rgba(255,255,255,.5);margin-bottom:22px;max-width:1000px;line-height:1.5">
    Contei no código: a tela pede <b style="color:${RED}">11 decisões</b> antes de deixar a pessoa jogar. Várias só quem JÁ jogou consegue avaliar ("liga + liberta"? "ritmo manual"?). Minha proposta: <b>1 decisão + o botão</b>.
  </div>
  <div style="display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap">
    <div>${rot('❌ Hoje', RED, '#fff')}${ANTES}</div>
    <div>${rot('✅ Proposta', GREEN, '#fff')}${DEPOIS}</div>
    <div>${rot('⚙️ E quem quer mexer', '#fff')}${AJUSTES}</div>
  </div>
  <div style="margin-top:24px;background:#161616;border:3px solid #000;border-radius:14px;padding:16px;box-shadow:4px 4px 0 #000;max-width:1260px">
    <div style="font:900 15px Oswald;color:#fff;text-transform:uppercase;margin-bottom:10px">As 4 mudanças, e o porquê de cada uma</div>
    <div style="font:700 12px system-ui;color:rgba(255,255,255,.65);line-height:1.75">
      <b style="color:${GOLD}">1. O modo vira CARTÃO, não aba.</b> Hoje são 4 palavras espremidas numa faixa. Cartão cabe uma frase dizendo <i>o que é aquilo</i> — e é a única escolha que muda o jogo de verdade.<br>
      <b style="color:${GOLD}">2. O botão sobe pro alto.</b> Hoje ele está no fim de um formulário. Quem abriu o jogo quer chamar os amigos, não preencher ficha.<br>
      <b style="color:${GOLD}">3. Os outros 10 viram ⚙️ Ajustes, fechado.</b> Nenhuma opção sumiu, e a ordem é a mesma. Só saiu da frente de quem não quer mexer.<br>
      <b style="color:${GOLD}">4. Uma linha diz o que está valendo.</b> <span style="color:rgba(255,255,255,.85)">🌎 Todos · 4-3-3 · com bots · 45s · 💬 chat · 🔓 aberta</span> — porque esconder ajuste vira caixa-preta, e caixa-preta é o que o Diego mais odeia.
    </div>
  </div>
</body></html>`

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch(existsSync(CHROME) ? { executablePath: CHROME } : {})
const page = await browser.newPage({ viewport: { width: 1330, height: 1100 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(700)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`✅ ${saida}`)
