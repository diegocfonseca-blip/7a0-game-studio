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
// ⚠️ SÓ DESENHO. Nada mexido. Rodar: node scripts/mockup-online-celular.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const SAIDA = process.argv[2] || '/tmp/mockup-online-celular.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F', ROXO = '#7C3AED'
const b64 = p => 'data:image/webp;base64,' + readFileSync(p).toString('base64')
const MASCOTE = b64('src/escalacao/img/neymarzetti-mascote.webp')
const ESCUDO = b64('src/escalacao/img/neymarzetti-escudo.webp')

const TAB = [[1, 'Neymarzetti 👑', 12, 5, 1], [2, 'Flapingas', 11, 6, 0], [3, 'Bagres de Wall St.', 9, 2, 0],
  [4, 'Só Deus Sabe FC', 8, 6, 0], [5, 'Rei da Bola FC', 8, 4, 0], [6, 'Fala D10', 8, 2, 0], [7, 'Xurupitas FC', 8, 2, 0]]

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
  <div style="font-size:10px;font-weight:900;letter-spacing:1px;color:#7a7364;padding:8px 10px 4px">🏆 LIGA LEGENDS</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
   ${TAB.map(([p, t, P, SG, eu]) => `<tr style="${eu ? 'background:#FFF0C4' : ''}"><td style="padding:5px 10px;font-weight:700;border-top:1px solid rgba(0,0,0,.08)">${p}. ${t}</td>
     <td style="padding:5px 4px;text-align:right;font-weight:900;border-top:1px solid rgba(0,0,0,.08)">${P}</td>
     <td style="padding:5px 10px 5px 4px;text-align:right;font-weight:700;color:#888;border-top:1px solid rgba(0,0,0,.08)">${SG}</td></tr>`).join('')}
  </table></div>`

const barra = (ativo) => `<div style="display:flex;gap:5px;background:#101a13;border:3px solid ${INK};border-radius:12px;padding:5px">
  ${[['⚽', 'Jogo'], ['🏆', 'Tabela'], ['⚔️', 'Próximo'], ['👥', 'Elenco']].map(([e, n], i) =>
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
<div class="lead">📱 No celular não dá pra abrir colunas — o espaço é vertical. Então a ideia NÃO é espremer:
é <b>tirar da fila</b> o que não é do momento. <b>A regra que você deu manda em tudo: o placar e a mascote
NÃO encolhem</b> — em dois dos três momentos o placar até cresce.</div>

<div class="linha">
  ${tela('❌ como está hoje', `
    ${placar(false, false)}
    ${bx('ABAS · jogos / estatísticas / elenco', '#efeade')}
    ${bx('⚔️ PRÓXIMO: Xurupitas FC × Neymarzetti (fora)<br><span style="font-size:10px;font-weight:600;color:#888">🛡️ Retranca &nbsp; ⚖️ Equilíbrio &nbsp; 🔥 Ataque<br>Retranca segura ataque · ataque atropela equilíbrio…</span>')}
    ${bx('OUTROS JOGOS · rodada 6')}
    ${bx('👑 Você é o novo LÍDER!', '#ded5f7')}
    ${bx('📣 Giro da rodada')}
    <div style="text-align:center;color:${VERM};font-size:11px;font-weight:900;padding:6px 0">↓ ↓ ↓ role mais ↓ ↓ ↓</div>
    ${bx('🏆 A TABELA fica aqui embaixo', '#fff0c4')}`, VERM)}

  ${tela('✅ momento 1 · bola rolando', `
    ${placar(false, true)}
    ${tabelaMini}
    ${barra(0)}`, VERDE)}

  ${tela('✅ momento 2 · GOL', `
    ${placar(true, true)}
    ${bx('⚽ Neymar Jr 23′ · assistência de Zico', '#FFF3D6')}
    ${tabelaMini}
    ${barra(0)}`, VERDE)}

  ${tela('✅ aba ⚔️ próximo', `
    ${placar(false, false)}
    <div style="background:#F7F4EA;border:3px solid ${INK};border-radius:12px;padding:11px">
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
    ${barra(2)}`, VERDE)}
</div>

<div class="cx">🦇 <b>O placar e a mascote NÃO encolhem</b> — foi a sua condição. Na tela de "bola rolando" e na
de GOL ele fica <b>MAIOR</b> do que é hoje, porque deixou de dividir a tela com blocos que não são daquele
momento. Quem encolheu foi só o <b>caixote do próximo jogo</b>, e ele ganhou aba própria.</div>

<div class="nota">
  <b>As três ideias, em linguagem de jogo</b><br>
  1️⃣ <b>Uma barrinha fixa embaixo, com 4 botões</b> (⚽ Jogo · 🏆 Tabela · ⚔️ Próximo · 👥 Elenco) — igual barra
  de app. A tabela deixa de ser "role até o fim" e vira <b>um toque</b>, de qualquer lugar da tela.<br>
  2️⃣ <b>A tela do jogo mostra só o jogo</b>: placar grande + os 7 primeiros da tabela (é o que interessa
  enquanto a bola rola). Outros jogos, giro da rodada e próximo jogo mudam pras abas deles — <b>nada some</b>.<br>
  3️⃣ <b>O momento do GOL abre espaço</b>: a mascote entra maior e nasce embaixo a linha do goleador com a
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
