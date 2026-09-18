// 📱 MOCKUP — O ONLINE NO CELULAR (Diego 18/09, logo depois de aprovar o desktop)
//
// Palavras dele: *"quero uma ideia melhor visual também pra dispositivos móveis
// igual fez pro desktop. Consegue? SEM DIMINUIR a área dos gols e tamanhos de
// mascote e etc"*.
//
// ⚠️ A REGRA DESTE DESENHO, e ela manda em tudo: **o placar não encolhe.** No
// celular o espaço é vertical, então a saída NÃO pode ser "espremer tudo" — tem
// que ser TIRAR DA FILA o que não é do momento. O placar (com a mascote do gol,
// o flash e as frases) continua do tamanho que é hoje; em alguns momentos ele
// até CRESCE.
//
// O problema medido na tela de hoje: pra ver a TABELA o jogador rola ~4 telas,
// passando por blocos que ele não está olhando naquele minuto.
//
// 🔁 VERSÃO 2 — o Diego pegou um erro meu na v1: *"mas embaixo das abas não tem
// negócio de estante ou troféu, sei lá"*. Ele estava certo: o LigaHub JÁ desenha
// uma barra FIXA embaixo (Rank · Estante · Temporadas · Ajustes,
// `position:fixed;bottom:0` em ligahub.tsx). A barra que eu propus viraria uma
// SEGUNDA barra colada na dela.
// E aí ele deu a direção: *"você pode talvez unificar algumas coisas dessas que
// já tinham, sei lá, pra não ficar muito também"*. É isso: hoje a MESMA tela tem
// DOIS sistemas de navegação (as abas em cima + a barra embaixo). Some 3 + 4 = 7
// controles de navegação disputando a tela do celular.
// 👉 Esta v2 não SOMA nada: junta os dois numa barra só, com 4 botões. Rank,
// Estante e Temporadas são a mesma coisa (a história da liga), então viram UM
// botão 🏆 Liga — e lá dentro as três abas continuam exatamente como são hoje.
//
// ⚠️ SÓ DESENHO. Nada mexido. Rodar: node scripts/mockup-online-celular.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const SAIDA = process.argv[2] || '/tmp/mockup-online-celular.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'
const b64 = p => 'data:image/webp;base64,' + readFileSync(p).toString('base64')
const MASCOTE = b64('src/escalacao/img/neymarzetti-mascote.webp')
const ESCUDO = b64('src/escalacao/img/neymarzetti-escudo.webp')

// 🏆 A TABELA INTEIRA — ordem do Diego (18/09): *"prefiro que mostre a tabela toda"*.
// São os 20 da divisão, não um pedaço. Com ela inteira aqui, nem precisa de um
// botão só pra tabela: ela mora na tela do jogo, que é onde ele quer olhar.
const TAB = [[1, 'Neymarzetti 👑', 12, 5, 1], [2, 'Flapingas', 11, 6, 0], [3, 'Bagres de Wall St.', 9, 2, 0],
  [4, 'Só Deus Sabe FC', 8, 6, 0], [5, 'Rei da Bola FC', 8, 4, 0], [6, 'Fala D10', 8, 2, 0], [7, 'Xurupitas FC', 8, 2, 0],
  [8, 'Vidraceiro FC', 7, 1, 0], [9, 'Nata de SP', 7, 0, 0], [10, 'Al Takhadao FC', 6, 0, 0],
  [11, 'Bagres 1993', 6, -1, 0], [12, 'São Luiz FC', 5, -2, 0], [13, 'Murriz FC', 5, -2, 0],
  [14, 'Papão United', 4, -3, 0], [15, 'Scorporila FC', 4, -4, 0], [16, 'Marolados FC', 3, -5, 0],
  [17, 'Barcenite FC', 3, -6, 0], [18, 'Fridão FC', 2, -7, 0], [19, 'Pesadelo Verde', 2, -8, 0],
  [20, 'La Bestia Negra', 1, -9, 0]]

// o placar, do MESMO tamanho nos dois lados — é a regra do pedido
const placar = (gol, alto) => `
<div style="background:#22352a;border:3px solid ${INK};border-radius:13px;overflow:hidden;position:relative">
  <div style="background:${gol ? GOLD : '#101a13'};text-align:center;padding:${alto ? 8 : 6}px 8px;font-size:${alto ? 13 : 12}px;font-weight:900;color:${gol ? INK : '#fff'}">
    ${gol ? '⚽ GOOOL! Neymar Jr 23′' : '🟢 BOLA ROLANDO'}</div>
  <div style="position:relative;padding:${alto ? '16px 8px 14px' : '12px 8px 10px'}">
    <div style="position:absolute;top:${alto ? 8 : 5}px;left:50%;transform:translateX(-50%);background:${INK};color:#fff;font-size:10px;font-weight:900;padding:2px 10px;border-radius:999px">${gol ? "23'" : "22'"}</div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px;margin-top:12px">
      <div style="text-align:center;color:#fff"><div style="font-size:13px;font-weight:900;line-height:1.1">Bagres<br>1993</div></div>
      <div style="display:flex;align-items:center;gap:5px;background:#fff;border:3px solid ${INK};border-radius:10px;padding:3px 11px">
        <span style="font-size:${alto ? 30 : 26}px;font-weight:900">0</span><span style="color:#b8b0a0;font-size:14px">×</span>
        <span style="font-size:${alto ? 30 : 26}px;font-weight:900;${gol ? `color:${VERDE}` : ''}">${gol ? '1' : '0'}</span></div>
      <div style="text-align:center;color:#fff">
        ${gol ? `<img src="${MASCOTE}" height="${alto ? 108 : 86}" width="${Math.round((alto ? 108 : 86) * 346 / 440)}" style="display:block;margin:0 auto -2px;filter:drop-shadow(0 0 9px rgba(255,196,0,.6))">`
              : `<img src="${ESCUDO}" height="40" style="display:block;margin:0 auto 3px">`}
        <div style="font-size:13px;font-weight:900;line-height:1.1">Neymarzetti 👑</div></div>
    </div>
  </div>
</div>`

const bx = (t, c = '#F7F4EA') => `<div style="background:${c};border:3px solid ${INK};border-radius:12px;padding:10px 11px;font-size:12px;font-weight:800">${t}</div>`

const tabelaMini = `<div style="background:#F7F4EA;border:3px solid ${INK};border-radius:12px;overflow:hidden">
  <div style="font-size:10px;font-weight:900;letter-spacing:1px;color:#7a7364;padding:8px 10px 4px">🏆 LIGA LEGENDS <span style="float:right;font-weight:700;color:#9aa">os 20</span></div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
   ${TAB.map(([p, t, P, SG, eu]) => `<tr style="${eu ? 'background:#FFF0C4' : p <= 8 ? 'background:#EAF5EE' : p >= 17 ? 'background:#FDECEA' : ''}"><td style="padding:4px 10px;font-weight:700;border-top:1px solid rgba(0,0,0,.08)">${p}. ${t}</td>
     <td style="padding:4px 4px;text-align:right;font-weight:900;border-top:1px solid rgba(0,0,0,.08)">${P}</td>
     <td style="padding:4px 10px 4px 4px;text-align:right;font-weight:700;color:#888;border-top:1px solid rgba(0,0,0,.08)">${SG}</td></tr>`).join('')}
  </table></div>`

const barra = (ativo) => `<div style="display:flex;gap:5px;background:#101a13;border:3px solid ${INK};border-radius:12px;padding:5px">
  ${[['⚽', 'Jogo'], ['📊', 'Estatísticas'], ['👥', 'Elenco'], ['🏆', 'Liga']].map(([e, n], i) =>
    `<div style="flex:1;text-align:center;padding:6px 0;border-radius:8px;font-size:10px;font-weight:900;${i === ativo ? `background:${ROXO};color:#fff` : 'color:#9aa79f'}">
      <div style="font-size:16px;line-height:1">${e}</div>${n}</div>`).join('')}</div>`

const tela = (titulo, corpo, cor) => `<div>
  <div style="display:inline-block;background:${cor};color:#fff;font-size:11px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;padding:5px 11px;border-radius:8px;margin-bottom:8px">${titulo}</div>
  <div style="width:330px;background:linear-gradient(180deg,#14261a,#0b1a12);border:4px solid ${INK};border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:8px">${corpo}</div></div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{font-family:Oswald,system-ui;color:${INK};background:${CREME};width:1520px;padding:28px}
h1{font-size:44px;font-weight:900;text-transform:uppercase;line-height:.95}h1 .g{color:${VERDE}}
.lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:13px 17px;font-size:16px;font-weight:700;margin:13px 0 20px;line-height:1.45}
.linha{display:flex;gap:20px;align-items:start}
.nota{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:16px 19px;margin-top:20px;font-size:14.5px;font-weight:700;line-height:1.6}
.nota b{color:${VERDE}}
.cx{background:#EAF5EE;border:3px solid ${VERDE};border-radius:13px;padding:13px 16px;margin-top:14px;font-size:15px;font-weight:700;line-height:1.5}.cx b{color:${VERDE}}</style>

<h1>O ONLINE NO <span class="g">CELULAR</span></h1>
<div class="lead">🔁 <b>Refeito com a sua correção.</b> Eu tinha proposto uma barra nova embaixo — e você lembrou que
<b>já existe uma</b> (Rank · Estante · Temporadas). A minha ia virar uma SEGUNDA barra colada na dela.<br>
Então agora a ideia não SOMA nada: <b>hoje a mesma tela tem DOIS sistemas de navegação</b> (3 abas em cima
+ 4 botões embaixo = 7 controles). Isto <b>junta os dois numa barra só, com 4</b>. E o placar e a mascote
continuam sem encolher, como você exigiu.</div>

<div class="linha">
  ${tela('❌ como está hoje', `
    ${placar(false, false)}
    ${bx('ABAS · jogos / estatísticas / elenco', '#efeade')}
    ${bx('⚔️ PRÓXIMO: Xurupitas FC × Neymarzetti (fora)<br><span style="font-size:10px;font-weight:600;color:#888">🛡️ Retranca &nbsp; ⚖️ Equilíbrio &nbsp; 🔥 Ataque<br>Retranca segura ataque · ataque atropela equilíbrio…</span>')}
    ${bx('OUTROS JOGOS · rodada 6')}
    ${bx('👑 Você é o novo LÍDER!', '#ded5f7')}
    ${bx('📣 Giro da rodada')}
    <div style="text-align:center;color:${VERM};font-size:11px;font-weight:900;padding:6px 0">↓ ↓ ↓ role mais ↓ ↓ ↓</div>
    ${bx('🏆 A TABELA fica aqui embaixo', '#fff0c4')}
    <div style="display:flex;gap:4px;background:rgba(250,247,238,.97);border:3px solid ${INK};border-radius:12px;padding:6px">
      ${[['🏅', 'Rank'], ['📚', 'Estante'], ['📄', 'Temporadas']].map(([e, n]) =>
        `<div style="flex:1;text-align:center;font-size:9.5px;font-weight:900;color:#8a8270"><div style="font-size:15px;line-height:1">${e}</div>${n}</div>`).join('')}
    </div>
    <div style="text-align:center;color:${VERM};font-size:10.5px;font-weight:900">☝️ e esta barra JÁ existe, fixa embaixo</div>`, VERM)}

  ${tela('✅ momento 1 · bola rolando', `
    ${placar(false, true)}
    ${tabelaMini}
    ${barra(0)}`, VERDE)}

  ${tela('✅ momento 2 · GOL', `
    ${placar(true, true)}
    ${bx('⚽ Neymar Jr 23′ · assistência de Zico', '#FFF3D6')}
    ${tabelaMini}
    ${barra(0)}`, VERDE)}

  ${tela('✅ aba 🏆 liga (o que já existia)', `
    ${placar(false, false)}
    <div style="background:#F7F4EA;border:3px solid ${INK};border-radius:12px;padding:11px">
      <div style="display:flex;gap:4px;margin-bottom:9px">
        <div style="flex:1;text-align:center;font-size:10px;font-weight:900;padding:5px 0;border-radius:7px;background:#B8860B;color:#fff">🏅 RANK</div>
        <div style="flex:1;text-align:center;font-size:10px;font-weight:900;padding:5px 0;border-radius:7px;color:#8a8270">📚 ESTANTE</div>
        <div style="flex:1;text-align:center;font-size:10px;font-weight:900;padding:5px 0;border-radius:7px;color:#8a8270">📄 TEMPORADAS</div>
      </div>
      <div style="font-size:11px;font-weight:900;color:#7a7364;letter-spacing:.8px;margin-bottom:8px">⚔️ PRÓXIMO · XURUPITAS FC (FORA)</div>
      <div style="display:flex;gap:6px">
        <div style="flex:1;text-align:center;border:2.5px solid ${INK};border-radius:9px;padding:7px 0;font-size:11px;font-weight:900;background:#fff">🛡️<br>Retranca</div>
        <div style="flex:1;text-align:center;border:2.5px solid ${INK};border-radius:9px;padding:7px 0;font-size:11px;font-weight:900;background:${GOLD}">⚖️<br>Equilíbrio</div>
        <div style="flex:1;text-align:center;border:2.5px solid ${INK};border-radius:9px;padding:7px 0;font-size:11px;font-weight:900;background:#fff">🔥<br>Ataque</div>
      </div>
      <p style="font-size:10px;font-weight:700;color:#8a8270;margin-top:8px;line-height:1.35">Retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca.</p>
    </div>
    ${bx('OUTROS JOGOS · rodada 6')}
    ${bx('📣 Giro da rodada')}
    ${barra(3)}`, VERDE)}
</div>

<div class="cx">🦇 <b>O placar e a mascote NÃO encolhem</b> — foi a sua condição. Na tela de "bola rolando" e na
de GOL ele fica <b>MAIOR</b> do que é hoje, porque deixou de dividir a tela com blocos que não são daquele
momento. Quem encolheu foi só o <b>caixote do próximo jogo</b>, e ele ganhou aba própria.</div>

<div class="nota">
  <b>A unificação, em linguagem de jogo</b><br>
  🔗 <b>Uma barra só, com 4 botões</b> — as abas de cima DESCEM pra barra que já existe embaixo:<br>
  &nbsp;&nbsp;&nbsp;⚽ <b>Jogo</b> (placar + tabela) · 📊 <b>Estatísticas</b> · 👥 <b>Elenco</b> · 🏆 <b>Liga</b><br>
  🏆 <b>Rank, Estante e Temporadas viram UM botão só (Liga)</b> — as três são a mesma coisa: a história da
  liga. Lá dentro elas continuam <b>exatamente como são hoje</b>, nas abinhas delas. <b>Nada some.</b><br>
  📊 <b>A tela do jogo mostra o jogo + a TABELA INTEIRA</b> (ordem sua: "prefiro que mostre a tabela toda").
  São os 20, com a zona de cima em verde e o Z4 em vermelho. Como ela está aqui, <b>nem precisa de um botão
  só pra tabela</b> — sobra espaço na barra. Outros jogos, giro da rodada e próximo jogo ficam na aba 🏆 Liga.<br>
  ⚽ <b>O momento do GOL abre espaço</b>: a mascote entra maior e nasce embaixo a linha do goleador com a
  assistência. Passado o gol, volta ao normal sozinho.<br>
  🖥️ <b>O desktop que você já aprovou não muda</b> — isto só vale em tela estreita.
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1520, height: 1100 }, deviceScaleFactor: 1.6 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
