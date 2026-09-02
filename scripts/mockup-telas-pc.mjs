#!/usr/bin/env node
// ─── 🖥️ MOCKUP: os 5 ajustes de PC que faltam (30/08) ───────────────────────
//
// O Diego aprovou e publicou a PARTE 1 (moldura: coluna larga em tudo, zona
// morta do iPad, altura no celular, barrinha do iPhone). Sobraram 5 coisas que
// MUDAM O VISUAL — e visual novo só entra depois que ele vê. Este arquivo
// desenha o ANTES x DEPOIS de cada uma, no formato do jogo (creme, borda preta
// grossa, sombra dura, Oswald).
//
//   node scripts/mockup-telas-pc.mjs --saida /tmp/telas-pc.png
//
// ⚠️ É MOCKUP: nada aqui é código do jogo. Serve pra decisão, e mora no repo
// pra não se perder junto com o scratchpad da sessão (lição do Coringas).

import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'mockup-telas-pc.png')
const b64 = f => fs.readFileSync(f).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const CREME = '#F4ECD6', TINTA = '#0C0C0C', OURO = '#FFC400'
const VERDE = '#1B7A3D', ROXO = '#7C3AED', VERMELHO = '#C2452F'

// ── peças de desenho ────────────────────────────────────────────────────────
const salaCard = (nome, gente, cheia = false) => `
  <div class="sala">
    <div class="sala-esq">
      <p class="sala-nome">${nome}</p>
      <p class="sala-sub">${gente} de 8 · leilão · brasileirão</p>
    </div>
    <span class="btn-entrar ${cheia ? 'cheia' : ''}">${cheia ? 'Cheia' : 'Entrar'}</span>
  </div>`

const cartinha = (letra, cor, nome, tam) => `
  <div class="carta" style="width:${tam}px;background:${cor}">
    <span class="carta-pos">ATA</span>
    <div class="carta-bola">${letra}</div>
    <p class="carta-nome">${nome}</p>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url('${fonte(400)}') format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url('${fonte(600)}') format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url('${fonte(700)}') format('woff2');font-weight:700}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};font-family:Inter,system-ui,sans-serif;color:${TINTA};padding:34px 30px 40px;width:1360px}
h1{font-family:Oswald;font-weight:700;font-size:34px;text-transform:uppercase;letter-spacing:.5px}
.sub{font-weight:700;font-size:13px;color:rgba(12,12,12,.55);margin-top:4px;margin-bottom:22px}
.item{border:4px solid ${TINTA};border-radius:18px;background:#fff;box-shadow:6px 6px 0 ${TINTA};margin-bottom:26px;overflow:hidden}
.item-cab{background:${TINTA};color:#fff;padding:9px 16px;display:flex;align-items:center;gap:10px}
.item-cab b{font-family:Oswald;font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:.6px}
.item-cab span{font-size:11.5px;font-weight:700;color:rgba(255,255,255,.6)}
.par{display:grid;grid-template-columns:1fr 1fr;gap:0}
.lado{padding:16px 18px 18px}
.lado+.lado{border-left:3px dashed rgba(12,12,12,.2)}
.tag{display:inline-block;font-family:Oswald;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px;
     border:2.5px solid ${TINTA};border-radius:99px;padding:2px 10px;margin-bottom:12px}
.tag.a{background:#fff}.tag.d{background:${OURO}}
.tela{border:3px solid ${TINTA};border-radius:12px;background:${CREME};padding:12px;min-height:196px}
.tela.escura{background:#141414}
/* lista de salas */
.sala{display:flex;align-items:center;gap:8px;border:2.5px solid ${TINTA};border-radius:10px;background:#fff;padding:7px 9px;margin-bottom:7px}
.sala-esq{flex:1;min-width:0}
.sala-nome{font-family:Oswald;font-weight:700;font-size:14px;line-height:1.1}
.sala-sub{font-size:10px;font-weight:700;color:rgba(12,12,12,.5);margin-top:1px}
.btn-entrar{font-family:Oswald;font-weight:700;font-size:11px;text-transform:uppercase;color:#fff;background:${VERDE};
  border:2px solid ${TINTA};border-radius:7px;padding:5px 11px}
.btn-entrar.cheia{background:#ccc;color:${TINTA}}
.duas{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.duas .sala{margin-bottom:0}
/* barras de navegacao */
.barra{display:flex;gap:2px;background:rgba(250,247,238,.97);border:2.5px solid ${TINTA};border-radius:10px;padding:6px 4px}
.barra div{flex:1;text-align:center;font-family:Oswald;font-weight:700;font-size:10.5px}
.barra div i{display:block;font-style:normal;font-size:16px;margin-bottom:1px}
.barra .on{color:${ROXO}}
.barra .off{color:rgba(12,12,12,.55)}
.barra-topo{display:flex;gap:6px;justify-content:center;align-items:center;background:#fff;border:2.5px solid ${TINTA};border-radius:10px;padding:6px 10px}
.barra-topo div{font-family:Oswald;font-weight:700;font-size:12px;padding:3px 10px;border-radius:7px}
.barra-topo .on{background:${ROXO};color:#fff}
.miolo{height:118px;border:2px dashed rgba(12,12,12,.25);border-radius:9px;display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:rgba(12,12,12,.4);margin:8px 0}
/* cartas */
.linha-cartas{display:flex;gap:8px;align-items:flex-start;justify-content:center}
.carta{border:3px solid ${TINTA};border-radius:10px;box-shadow:3px 3px 0 ${TINTA};padding:7px;position:relative;aspect-ratio:3/4}
.carta-pos{position:absolute;top:6px;left:6px;background:${TINTA};color:#fff;font-family:Oswald;font-weight:700;font-size:9px;border-radius:5px;padding:1px 5px}
.carta-bola{width:44%;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.75);border:2px solid rgba(0,0,0,.25);
  margin:26px auto 0;display:flex;align-items:center;justify-content:center;font-family:Oswald;font-weight:700;font-size:17px}
.carta-nome{position:absolute;left:8px;bottom:7px;font-family:Oswald;font-weight:700;font-size:12px}
/* fundo online */
.tit-online{font-family:Oswald;font-weight:700;font-size:17px;text-transform:uppercase}
.tela.escura .tit-online{color:#fff}
.cx{border:2.5px solid ${TINTA};border-radius:9px;padding:7px 9px;font-size:11px;font-weight:700;margin-top:8px;background:#fff}
/* textos pequenos */
.mini7{font-size:7px;font-weight:700}
.mini9{font-size:9px;font-weight:700}
.mini11{font-size:11px;font-weight:700}
.mini13{font-size:13px;font-weight:700}
.nota{font-size:11.5px;font-weight:700;color:rgba(12,12,12,.6);margin-top:9px;line-height:1.35}
.rodape{margin-top:8px;font-size:12px;font-weight:700;color:rgba(12,12,12,.5);text-align:center}
</style></head><body>

<h1>🖥️ Os 5 ajustes de PC que faltam</h1>
<p class="sub">Só valem em tela de 768px pra cima. No celular NADA disso existe — ele nem lê essas regras.</p>

<div class="item">
  <div class="item-cab"><b>1 · Lista de salas em 2 colunas</b><span>só no PC · cabe o dobro sem rolar</span></div>
  <div class="par">
    <div class="lado"><span class="tag a">Antes</span>
      <div class="tela">
        ${salaCard('Bagres do Asfalto', 3)}${salaCard('Resenha FC', 5)}${salaCard('Peladão da Firma', 8, true)}
        <p class="nota">Uma embaixo da outra. No monitor sobra espaço dos dois lados e a lista fica comprida.</p>
      </div>
    </div>
    <div class="lado"><span class="tag d">Depois</span>
      <div class="tela">
        <div class="duas">
          ${salaCard('Bagres do Asfalto', 3)}${salaCard('Resenha FC', 5)}
          ${salaCard('Peladão da Firma', 8, true)}${salaCard('Craques do Zap', 2)}
        </div>
        <p class="nota">Duas por linha: vê o dobro de sala sem rolar. Mesma sala, mesmo botão, só a caixa muda.</p>
      </div>
    </div>
  </div>
</div>

<div class="item">
  <div class="item-cab"><b>2 · A barra sai de baixo e vai pro topo</b><span>só no PC</span></div>
  <div class="par">
    <div class="lado"><span class="tag a">Antes</span>
      <div class="tela">
        <div class="miolo">conteúdo da tela</div>
        <div class="barra">
          <div class="on"><i>🏠</i>Início</div><div class="off"><i>📖</i>Regras</div>
          <div class="off"><i>📔</i>Álbum</div><div class="off"><i>🏆</i>Ranking</div><div class="off"><i>❤️</i>Apoiar</div>
        </div>
        <p class="nota">Barra colada no pé da tela. No celular é o certo (é onde o dedo alcança). No monitor, o mouse tem que descer a tela toda.</p>
      </div>
    </div>
    <div class="lado"><span class="tag d">Depois</span>
      <div class="tela">
        <div class="barra-topo">
          <div class="on">🏠 Início</div><div>📖 Regras</div><div>📔 Álbum</div><div>🏆 Ranking</div><div>❤️ Apoiar</div>
        </div>
        <div class="miolo">conteúdo da tela</div>
        <p class="nota">No topo, do lado do título — que é onde o olho procura menu no PC. No celular continua embaixo, igualzinho.</p>
      </div>
    </div>
  </div>
</div>

<div class="item">
  <div class="item-cab"><b>3 · Carta para de esticar</b><span>tutorial do pregão e telas de exemplo</span></div>
  <div class="par">
    <div class="lado"><span class="tag a">Antes</span>
      <div class="tela">
        <div class="linha-cartas">
          ${cartinha('P', 'linear-gradient(135deg,#FFD34D,#F0A800)', 'Pelé', 178)}
          ${cartinha('G', 'linear-gradient(135deg,#E8EDF2,#B9C4CE)', 'Gabigol', 178)}
        </div>
        <p class="nota">A carta foi desenhada pra 150px. Na coluna larga ela estica pra quase 400 e fica um cartaz — os detalhes ficam gigantes.</p>
      </div>
    </div>
    <div class="lado"><span class="tag d">Depois</span>
      <div class="tela">
        <div class="linha-cartas">
          ${cartinha('P', 'linear-gradient(135deg,#FFD34D,#F0A800)', 'Pelé', 122)}
          ${cartinha('G', 'linear-gradient(135deg,#E8EDF2,#B9C4CE)', 'Gabigol', 122)}
          ${cartinha('R', 'linear-gradient(135deg,#A87BF5,#7C3AED)', 'Rayan', 122)}
        </div>
        <p class="nota">Teto de tamanho: a carta fica do tamanho que foi desenhada e sobra espaço pra mais uma. Nada de esticar.</p>
      </div>
    </div>
  </div>
</div>

<div class="item">
  <div class="item-cab"><b>4 · Fundo do online vira creme</b><span>hoje é preto — parece outro aplicativo</span></div>
  <div class="par">
    <div class="lado"><span class="tag a">Antes</span>
      <div class="tela escura">
        <p class="tit-online">🔨 Leilão Legends · Online</p>
        <div class="cx">Salas abertas · Criar sala · Minhas Ligas</div>
        ${salaCard('Bagres do Asfalto', 3)}
        <p class="nota" style="color:rgba(255,255,255,.55)">Você sai do jogo (creme) e cai numa tela preta. A cara muda no meio do caminho.</p>
      </div>
    </div>
    <div class="lado"><span class="tag d">Depois</span>
      <div class="tela">
        <p class="tit-online">🔨 Leilão Legends · Online</p>
        <div class="cx">Salas abertas · Criar sala · Minhas Ligas</div>
        ${salaCard('Bagres do Asfalto', 3)}
        <p class="nota">Mesmo creme do resto. É o mesmo jogo do começo ao fim — só o conteúdo muda.</p>
      </div>
    </div>
  </div>
</div>

<div class="item">
  <div class="item-cab"><b>5 · Texto miudinho cresce no monitor</b><span>38 lugares com 7, 8 e 9px</span></div>
  <div class="par">
    <div class="lado"><span class="tag a">Antes</span>
      <div class="tela">
        <p class="mini7">👑 lenda · ⭐ craque · 💎 promessa · 🃏 folclórico — 7px</p>
        <p class="mini9" style="margin-top:7px">Logado como · Multiplayer · até 20 na sala — 9px</p>
        <p class="mini11" style="margin-top:7px">O baralho vem por posição. Você só vê o nome — 11px</p>
        <p class="nota">No celular, coladinho no olho, 7px passa. No monitor, a um braço de distância, não dá pra ler.</p>
      </div>
    </div>
    <div class="lado"><span class="tag d">Depois</span>
      <div class="tela">
        <p class="mini11">👑 lenda · ⭐ craque · 💎 promessa · 🃏 folclórico — 11px</p>
        <p class="mini11" style="margin-top:7px">Logado como · Multiplayer · até 20 na sala — 11px</p>
        <p class="mini13" style="margin-top:7px">O baralho vem por posição. Você só vê o nome — 13px</p>
        <p class="nota">Piso de 11px no PC. Nenhum texto muda de lugar nem de cor — só para de ser miudinho.</p>
      </div>
    </div>
  </div>
</div>

<p class="rodape">⚽ Leilão Legends · mockup pra decisão — nada disso está no ar</p>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1360, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.waitForTimeout(400)
await p.screenshot({ path: saida, fullPage: true })
await b.close()
console.log(`${saida} · ${Math.round(fs.statSync(saida).size / 1024)} KB`)
