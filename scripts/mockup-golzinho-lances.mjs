#!/usr/bin/env node
// ─── ⚽🥅 MOCKUP: o GOLZINHO COM LANCES — chances, quase-gols e o gol de verdade ──
//
// Diego (26/09): *"eu queria vários estilos: a bola por cima do gol, na trave, pra
// fora, isolou… na qual o texto da narração acompanha o momento certo. E a bola tem
// que entrar no gol também se der. Seria um suspense. E o placar só mostrar o gol
// quando a bola entrar mesmo. Não mudaria a dinâmica dos gols, mas teria coisas
// acontecendo enquanto não sai gol."*
//
// O desenho: a faixa do golzinho (🥅 de cada lado, pista com a cor do time, bola no
// meio) ganha LANCES ao longo dos 90 minutos. Cada lance é a bola voando em arco pra
// um dos gols e terminando de um destes jeitos — o MESMO vocabulário do palco dos
// pênaltis, que ele já aprovou:
//   🧤 DEFENDEU  — a luva aparece na frente do gol e a bola volta
//   🥅 NA TRAVE  — bate no poste e volta pro campo
//   💨 PRA FORA  — passa do lado do gol e some
//   🚀 ISOLOU    — sobe por cima do travessão e sai por cima
//   ⚽ GOOOL     — entra, a rede balança, o número pula — SÓ AÍ o placar muda
// A faixa amarela de narração troca no MESMO instante em que a bola chega.
//
// O que NÃO muda: os gols são os da simulação (mesmo minuto, mesmo autor). As
// chances perdidas são teatro semeado (mesma cena pra todo mundo da sala) e nunca
// viram gol — o placar continua sendo o da conta. 🚫 Sem lance de pênalti (ordem
// dele de 19/09: pênalti tem tela própria).
//
// Rodar do raiz: node scripts/mockup-golzinho-lances.mjs /tmp/lances
import { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CASA = '#9C8B5A', FORA = '#2E6FB0'

// 🎬 a linha do tempo do jogo: gols DE VERDADE (da simulação) + chances (teatro)
// `lado` = quem ATACA (casa ataca o gol da direita). `fim` = como termina.
const LANCES = [
  { min: 12, lado: 'casa', fim: 'fora',     nome: 'Marcos Senna',  txt: 'Senna arrisca de longe… PRA FORA! Passou raspando.' },
  { min: 21, lado: 'fora', fim: 'defendeu', nome: 'Manfré FC',     txt: 'Manfré chega com perigo… DEFENDEU o goleiro! Que mão!' },
  { min: 33, lado: 'casa', fim: 'gol',      nome: 'Edin Džeko',    txt: 'GOL DO THE WOLF! Džeko cabeceou no cantinho!' },
  { min: 47, lado: 'fora', fim: 'trave',    nome: 'Manfré FC',     txt: 'Manfré bate cruzado… NA TRAVE! O estádio gelou.' },
  { min: 58, lado: 'casa', fim: 'gol',      nome: 'Marcos Senna',  txt: 'GOL DO THE WOLF! Senna de fora da área, no ângulo!' },
  { min: 59, lado: 'fora', fim: 'gol',      nome: 'Manfré FC',     txt: 'GOL DO MANFRÉ FC! Respondeu na hora, cruzamento e cabeçada!' },
  { min: 73, lado: 'casa', fim: 'isolou',   nome: 'Benni McCarthy', txt: 'McCarthy sozinho na área… ISOLOU! Foi pra arquibancada.' },
  { min: 81, lado: 'fora', fim: 'gol',      nome: 'Manfré FC',     txt: 'GOL DO MANFRÉ FC! Contra-ataque letal, empatou!' },
]
const LISTA = { defendeu: '🧤 DEFENDEU!', trave: '🥅 NA TRAVE!', fora: '💨 PRA FORA!', isolou: '🚀 ISOLOU!', gol: '⚽ GOOOL!' }

// o placar num instante: `lance` = o lance que está NA TELA agora (ou null)
const placar = (min, lance = null, opts = {}) => {
  const gols = LANCES.filter(l => l.fim === 'gol' && l.min <= min && (!lance || l.min <= lance.min))
  const hg = gols.filter(g => g.lado === 'casa').length, ag = gols.length - hg
  const golAgora = lance?.fim === 'gol'
  const narr = opts.narr ?? (lance ? lance.txt : min >= 90 ? 'Fim de jogo!' : 'Jogo rolando…')
  const cls = lance ? `${lance.lado} ${lance.fim}` : ''
  return `
  <section class="score">
    <div class="narr ${golAgora ? 'goal' : lance ? 'lance' : ''}">${narr}</div>
    <div class="duel">
      <div class="team" style="border-color:${CASA}"><div class="crest">🐺</div><strong>The Wolf</strong><small>VOCÊ</small></div>
      <div class="numbers"><small>${Math.min(90, min)}′</small><strong><i class="${golAgora && lance.lado === 'casa' ? 'pula' : ''}">${hg}</i> <span>×</span> <i class="${golAgora && lance.lado === 'fora' ? 'pula' : ''}">${ag}</i></strong></div>
      <div class="team" style="border-color:${FORA}"><div class="crest">🛡️</div><strong>Manfré FC</strong><small>RIVAL</small></div>
    </div>
    <div class="palco ${cls}">
      <span class="meta esq">🥅</span><span class="luva esq">🧤</span>
      <div class="pista"><i class="metade casa"></i><i class="metade fora"></i><span class="sombra"></span><span class="bola">⚽</span></div>
      <span class="luva dir">🧤</span><span class="meta dir">🥅</span>
      ${lance ? `<b class="veredito ${lance.fim}">${LISTA[lance.fim]}</b>` : ''}
    </div>
    <div class="scorers">
      <div>${gols.filter(g => g.lado === 'casa').map(g => `<p>⚽ ${g.nome} <b>${g.min}′</b></p>`).join('') || '<p>Sem gols</p>'}</div>
      <div>${gols.filter(g => g.lado === 'fora').map(g => `<p>⚽ ${g.nome} <b>${g.min}′</b></p>`).join('') || '<p>Sem gols</p>'}</div>
    </div>
  </section>`
}

const CSS = `${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE9DA;font-family:system-ui;color:${INK};padding:26px}
.wrap{max-width:900px;margin:0 auto}
h1{${OSW};font-size:20px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
.sub{font-size:13px;font-weight:600;color:#3d3a30;margin-bottom:14px;line-height:1.5}
.passo{${OSW};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:rgba(12,12,12,.45);margin:16px 0 6px}
.cap{font-size:12px;font-weight:500;color:#3d3a30;line-height:1.5;margin-top:8px}.cap b{font-weight:800}
.nota{background:#fff;border:3px solid ${INK};border-radius:13px;padding:12px 14px;font-size:12.5px;font-weight:500;line-height:1.6;color:#3d3a30;margin-top:18px}
.fundo{background:#1b3a25;background-image:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),repeating-linear-gradient(90deg,#2b6b3e 0 40px,#25603a 40px 80px);border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:14px}
.score{background:linear-gradient(135deg,rgba(10,28,22,.94),rgba(7,19,15,.87));color:${CREME};border:2px solid #847657;border-radius:18px;overflow:hidden;box-shadow:0 4px 0 ${INK}}
.narr{height:36px;line-height:36px;padding:0 10px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:700 13px/36px Oswald,sans-serif;background:#0a1911;transition:background .2s}
.narr.goal{background:${GOLD};color:${INK}}
.narr.lance{background:#1d3a2c;color:#fff}
.duel{display:grid;grid-template-columns:minmax(0,1fr) 88px minmax(0,1fr);align-items:center;padding:14px 8px 10px;gap:8px}
.team{text-align:center;min-width:0;border-bottom:3px solid;padding-bottom:8px}
.team .crest{font-size:30px;line-height:1;margin-bottom:4px}.team strong{${OSW};font-size:16px;display:block}.team small{font-size:10px;letter-spacing:.1em;opacity:.7}
.numbers{background:${CREME};color:${INK};border:3px solid ${INK};border-radius:12px;padding:8px 2px 10px;text-align:center;box-shadow:3px 4px 0 ${INK};font-family:Oswald,sans-serif}
.numbers small{display:block;font-weight:700;font-size:14px}.numbers strong{display:block;font-size:32px;line-height:1.3}.numbers span{font-size:18px}
.numbers i{font-style:normal;display:inline-block}.numbers i.pula{animation:pula .5s cubic-bezier(.2,1.6,.4,1);color:#1B7A3D}
@keyframes pula{0%{transform:scale(.6)}60%{transform:scale(1.35)}100%{transform:none}}
.scorers{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:10px 12px;border-top:1px solid #59624d;font-size:12px}.scorers p{margin:0 0 3px}.scorers b{font-weight:800}
/* ── ⚽🥅 O GOLZINHO COM LANCES (a faixa preta do palco dos pênaltis) ── */
.palco{position:relative;background:${INK};display:flex;align-items:center;gap:6px;padding:8px 12px;min-height:50px;overflow:hidden}
.pista{overflow:visible}
.meta{font-size:26px;line-height:1;display:inline-block;z-index:1}
.meta.esq{transform:scaleX(-1)}
.palco.casa.gol .meta.dir{animation:rede .45s ease .9s}
.palco.fora.gol .meta.esq{animation:rede-esq .45s ease .9s}
@keyframes rede{30%{transform:rotate(-10deg) scale(1.22)}60%{transform:rotate(8deg) scale(1.12)}}
@keyframes rede-esq{30%{transform:scaleX(-1) rotate(-10deg) scale(1.22)}60%{transform:scaleX(-1) rotate(8deg) scale(1.12)}}
.luva{position:absolute;top:50%;font-size:20px;line-height:1;transform:translateY(-50%) scale(0);z-index:2}
.luva.esq{left:34px;transform:translateY(-50%) scaleX(-1) scale(0)}.luva.dir{right:34px}
.palco.casa.defendeu .luva.dir{animation:luva .5s cubic-bezier(.2,1.5,.5,1) .5s forwards}
.palco.fora.defendeu .luva.esq{animation:luva-esq .5s cubic-bezier(.2,1.5,.5,1) .5s forwards}
@keyframes luva{to{transform:translateY(-50%) scale(1)}}
@keyframes luva-esq{to{transform:translateY(-50%) scaleX(-1) scale(1)}}
.pista{flex:1;position:relative;height:34px}
.metade{position:absolute;top:50%;height:0;border-top:2px dashed;width:50%;opacity:.55}
.metade.casa{left:0;border-color:${CASA}}.metade.fora{right:0;border-color:${FORA}}
.bola{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:18px;line-height:1;filter:drop-shadow(0 1px 0 rgba(0,0,0,.6));z-index:3}
.sombra{position:absolute;top:calc(50% + 8px);left:50%;width:14px;height:5px;border-radius:50%;background:rgba(0,0,0,.6);transform:translateX(-50%);filter:blur(1px)}
/* a viagem em arco (0,6s) e o final (depois) — o lado espelha */
.palco.casa .bola{animation-name:voa-dir;animation-duration:.6s;animation-timing-function:cubic-bezier(.3,.6,.5,1);animation-fill-mode:forwards}
.palco.fora .bola{animation-name:voa-esq;animation-duration:.6s;animation-timing-function:cubic-bezier(.3,.6,.5,1);animation-fill-mode:forwards}
.palco.casa .sombra,.palco.fora .sombra{animation:sombra .6s cubic-bezier(.3,.6,.5,1) forwards}
@keyframes voa-dir{0%{left:50%;transform:translate(-50%,-50%) rotate(0)}50%{transform:translate(-50%,-160%) rotate(300deg) scale(1.15)}100%{left:calc(100% - 6px);transform:translate(-50%,-50%) rotate(620deg)}}
@keyframes voa-esq{0%{left:50%;transform:translate(-50%,-50%) rotate(0)}50%{transform:translate(-50%,-160%) rotate(-300deg) scale(1.15)}100%{left:6px;transform:translate(-50%,-50%) rotate(-620deg)}}
@keyframes sombra{0%{left:50%;transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(.5);opacity:.4}100%{opacity:0}}
/* os finais: começam quando a bola chega (0,6s) */
.palco.casa.gol .bola{animation-name:voa-dir,entra-dir;animation-duration:.6s,.3s;animation-delay:0s,.6s}
.palco.fora.gol .bola{animation-name:voa-esq,entra-esq;animation-duration:.6s,.3s;animation-delay:0s,.6s}
/* a bola ENTRA e fica dentro da rede: termina em cima do 🥅 (que fica fora da pista,
   por isso o left passa do 100%) e balança junto com ele */
@keyframes entra-dir{60%{left:calc(100% + 22px);transform:translate(-50%,-50%) scale(.72)}100%{left:calc(100% + 20px);transform:translate(-50%,-50%) scale(.72)}}
@keyframes entra-esq{60%{left:-22px;transform:translate(-50%,-50%) scale(.72)}100%{left:-20px;transform:translate(-50%,-50%) scale(.72)}}
.palco.casa.gol .bola{animation-name:voa-dir,entra-dir,balanca-bola;animation-duration:.6s,.3s,.45s;animation-delay:0s,.6s,.9s}
.palco.fora.gol .bola{animation-name:voa-esq,entra-esq,balanca-bola;animation-duration:.6s,.3s,.45s;animation-delay:0s,.6s,.9s}
@keyframes balanca-bola{30%{margin-top:-3px;margin-left:3px}60%{margin-top:2px;margin-left:-2px}}
.palco.casa.trave .bola{animation-name:voa-dir,trave-dir;animation-duration:.6s,.55s;animation-delay:0s,.6s}
.palco.fora.trave .bola{animation-name:voa-esq,trave-esq;animation-duration:.6s,.55s;animation-delay:0s,.6s}
@keyframes trave-dir{0%{left:calc(100% - 6px)}30%{left:calc(100% - 6px);transform:translate(-50%,-56%) scale(1.15)}100%{left:calc(100% - 44px);transform:translate(-50%,-40%) rotate(-200deg)}}
@keyframes trave-esq{0%{left:6px}30%{left:6px;transform:translate(-50%,-56%) scale(1.15)}100%{left:44px;transform:translate(-50%,-40%) rotate(200deg)}}
.palco.casa.fora .bola{animation-name:voa-dir,fora-dir;animation-duration:.6s,.5s;animation-delay:0s,.6s}
.palco.fora.fora .bola{animation-name:voa-esq,fora-esq;animation-duration:.6s,.5s;animation-delay:0s,.6s}
@keyframes fora-dir{to{left:calc(100% + 40px);transform:translate(-50%,-90%);opacity:0}}
@keyframes fora-esq{to{left:-40px;transform:translate(-50%,-90%);opacity:0}}
/* rasteira no começo, sobe no meio do caminho e passa POR CIMA do gol (fora, mas por cima) */
.palco.casa.isolou .bola{animation-name:isolou-dir;animation-duration:1.1s;animation-timing-function:cubic-bezier(.4,.1,.6,1);animation-delay:0s}
.palco.fora.isolou .bola{animation-name:isolou-esq;animation-duration:1.1s;animation-timing-function:cubic-bezier(.4,.1,.6,1);animation-delay:0s}
.palco.isolou .sombra{animation:sombra-isolou 1.1s linear forwards}
@keyframes isolou-dir{0%{left:50%;transform:translate(-50%,-50%) rotate(0)}40%{left:calc(50% + 34px);transform:translate(-50%,-50%) rotate(260deg)}100%{left:calc(100% + 34px);transform:translate(-50%,-330%) rotate(900deg);opacity:.15}}
@keyframes isolou-esq{0%{left:50%;transform:translate(-50%,-50%) rotate(0)}40%{left:calc(50% - 34px);transform:translate(-50%,-50%) rotate(-260deg)}100%{left:-34px;transform:translate(-50%,-330%) rotate(-900deg);opacity:.15}}
@keyframes sombra-isolou{0%{transform:translateX(-50%) scale(1)}40%{transform:translateX(-50%) scale(1)}100%{transform:translateX(-50%) scale(.3);opacity:0}}
.palco.casa.defendeu .bola{animation-name:voa-dir,volta-dir;animation-duration:.6s,.55s;animation-delay:0s,.6s}
.palco.fora.defendeu .bola{animation-name:voa-esq,volta-esq;animation-duration:.6s,.55s;animation-delay:0s,.6s}
@keyframes volta-dir{0%{left:calc(100% - 6px)}100%{left:calc(100% - 56px);transform:translate(-50%,-50%) rotate(-360deg) scale(.9)}}
@keyframes volta-esq{0%{left:6px}100%{left:56px;transform:translate(-50%,-50%) rotate(360deg) scale(.9)}}
/* o veredito pula na faixa quando a bola chega — igual ao palco dos pênaltis */
.veredito{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.6);opacity:0;${OSW};font-size:13px;letter-spacing:.4px;padding:3px 9px;border-radius:8px;border:2px solid ${CREME};color:#fff;z-index:4;white-space:nowrap;animation:veredito .25s cubic-bezier(.2,1.5,.5,1) .62s forwards}
.veredito.isolou{animation-delay:1.05s}.veredito.gol{animation-delay:.9s}
.veredito.gol{background:#1B7A3D}.veredito.defendeu,.veredito.trave{background:#C2452F}.veredito.fora,.veredito.isolou{background:#5b5b5b}
@keyframes veredito{to{transform:translate(-50%,-50%) scale(1);opacity:1}}
`

const pagina = (corpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${extra}</style></head><body><div class="wrap">${corpo}</div></body></html>`
// 📸 na foto tudo fica congelado no FINAL do lance (bola já chegou, veredito na tela)
const PARADO = '.palco .bola,.palco .sombra,.palco .luva,.palco .meta{animation-play-state:paused!important;animation-delay:-3s!important}.palco.gol .bola{animation-name:entra-dir!important}.palco.fora.gol .bola{animation-name:entra-esq!important}.veredito{animation:none;transform:translate(-50%,-50%);opacity:1}.numbers i.pula{animation:none;color:#1B7A3D}'

const L = Object.fromEntries(LANCES.map(l => [l.fim + l.lado + l.min, l]))
const htmlPng = pagina(`
<h1>⚽🥅 O golzinho com lances — suspense nos 90 minutos</h1>
<p class="sub">A faixa do golzinho ganha <b>lances ao longo do jogo</b>. Cada lance é a bola voando em arco pra um dos gols, e ela termina de um destes jeitos — <b>o mesmo vocabulário do palco dos pênaltis</b>: 🧤 defendeu · 🥅 na trave · 💨 pra fora · 🚀 isolou · ⚽ GOOOL. A narração troca no <b>mesmo instante</b> em que a bola chega. <b>O placar só muda quando a bola entra de verdade.</b></p>

<p class="passo">12′ · Senna arrisca de longe → 💨 PRA FORA (passa do lado do gol e some)</p>
<div class="fundo">${placar(12, L['foracasa12'])}</div>

<p class="passo">21′ · Manfré chega com perigo → 🧤 DEFENDEU (a luva aparece na frente do gol, a bola volta)</p>
<div class="fundo">${placar(21, L['defendeufora21'])}</div>

<p class="passo">33′ · Džeko cabeceia → ⚽ GOOOL (entra, a rede balança, o 1 pula em verde — só agora o placar muda)</p>
<div class="fundo">${placar(33, L['golcasa33'])}</div>

<p class="passo">47′ · Manfré bate cruzado → 🥅 NA TRAVE (bate no poste e volta pro campo)</p>
<div class="fundo">${placar(47, L['travefora47'])}</div>

<p class="passo">73′ · McCarthy sozinho → 🚀 ISOLOU (sobe por cima do travessão e sai por cima)</p>
<div class="fundo">${placar(73, L['isoloucasa73'])}</div>

<div class="nota">🎲 <b>Não muda a dinâmica dos gols:</b> os gols são os da simulação, no mesmo minuto e com o mesmo autor. As chances perdidas são <b>teatro semeado</b> — a mesma cena pra todo mundo da sala — e <b>nunca viram gol</b>. Cada time recebe umas 3 a 5 chances por jogo, sorteadas entre um gol e outro.<br>🙈 <b>Anti-spoiler:</b> uma chance que <i>não</i> é gol nunca aparece no minuto de um gol de verdade — a bola só entra quando é gol mesmo. E a chance perdida não diz nada sobre o futuro.<br>🚫 <b>Sem lance de pênalti</b> (regra de 19/09 — pênalti tem tela própria). Falta, escanteio e chute de longe podem.<br>💾 <b>0 KB:</b> emoji + CSS, igual aos pênaltis. 🎭 Um teatro só, no lugar dos raios do GOOOL. ↩️ Reverter: um bloco só.</div>
`, PARADO)

// 🎥 vídeo: 8′ → 62′ em ~14s (os lances vão acontecendo; cada um fica ~2s na tela)
const htmlVid = pagina(`<div class="fundo" id="v">${placar(8)}</div>
<script>
  const lances = ${JSON.stringify(LANCES)}, LISTA = ${JSON.stringify(LISTA)}
  const el = document.getElementById('v'); const t0 = Date.now()
  let visto = -1
  function frame(){
    const min = 8 + Math.min(54, (Date.now() - t0) / 1000 * 3.9)
    const passados = lances.filter(l => l.min <= min)
    const ultimo = passados[passados.length - 1]; const naTela = ultimo && min - ultimo.min < 9
    const golsAte = lances.filter(l => l.fim === 'gol' && l.min <= min)
    const hg = golsAte.filter(g => g.lado === 'casa').length, ag = golsAte.length - hg
    const narr = el.querySelector('.narr')
    narr.textContent = naTela ? ultimo.txt : 'Jogo rolando…'
    narr.className = 'narr' + (naTela ? (ultimo.fim === 'gol' ? ' goal' : ' lance') : '')
    el.querySelector('.numbers small').textContent = Math.floor(min) + '′'
    const [n1, n2] = el.querySelectorAll('.numbers i'); n1.textContent = hg; n2.textContent = ag
    const palco = el.querySelector('.palco')
    if (ultimo && ultimo.min !== visto) {
      visto = ultimo.min
      palco.querySelector('.veredito')?.remove()
      palco.className = 'palco'; void palco.offsetWidth; palco.className = 'palco ' + ultimo.lado + ' ' + ultimo.fim
      const b = document.createElement('b'); b.className = 'veredito ' + ultimo.fim; b.textContent = LISTA[ultimo.fim]; palco.appendChild(b)
      if (ultimo.fim === 'gol') { const n = ultimo.lado === 'casa' ? n1 : n2; n.classList.remove('pula'); void n.offsetWidth; n.classList.add('pula') }
    }
    if (!naTela && palco.className !== 'palco') { palco.className = 'palco'; palco.querySelector('.veredito')?.remove(); n1.classList.remove('pula'); n2.classList.remove('pula') }
    const [c1, c2] = el.querySelectorAll('.scorers > div')
    c1.innerHTML = golsAte.filter(g => g.lado === 'casa').map(g => '<p>⚽ ' + g.nome + ' <b>' + g.min + '′</b></p>').join('') || '<p>Sem gols</p>'
    c2.innerHTML = golsAte.filter(g => g.lado === 'fora').map(g => '<p>⚽ ' + g.nome + ' <b>' + g.min + '′</b></p>').join('') || '<p>Sem gols</p>'
    if (min < 62) requestAnimationFrame(frame)
  }
  frame()
</script>`, 'body{padding:0 14px;background:#0C0C0C;zoom:1.6}.wrap{max-width:560px}')

const outDir = process.argv[2] ?? 'mockup-lances'
mkdirSync(outDir, { recursive: true })
const pngHtml = path.join(outDir, 'lances.html'), vidHtml = path.join(outDir, 'lances-video.html')
writeFileSync(pngHtml, htmlPng); writeFileSync(vidHtml, htmlVid)

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${path.resolve(pngHtml)}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)
await p.screenshot({ path: path.join(outDir, 'lances.png'), fullPage: true })
await p.close()
const ctx = await b.newContext({ viewport: { width: 940, height: 600 }, deviceScaleFactor: 1, recordVideo: { dir: outDir, size: { width: 940, height: 600 } } })
const v = await ctx.newPage()
await v.goto(`file://${path.resolve(vidHtml)}`, { waitUntil: 'networkidle' })
await v.evaluate(() => document.fonts.ready)
await v.waitForTimeout(16500)
await ctx.close()
await b.close()
const webm = readdirSync(outDir).find(f => f.endsWith('.webm'))
if (webm) {
  const src = path.join(outDir, webm), mp4 = path.join(outDir, 'lances.mp4')
  try { execSync(`ffmpeg -y -loglevel error -i "${src}" -ss 0.6 -t 14.5 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`); renameSync(src, path.join(outDir, 'lances.webm')) }
  catch (e) { console.log('⚠️ ffmpeg falhou:', e.message) }
}
console.log('ok →', outDir)
