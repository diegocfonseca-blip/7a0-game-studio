// ─── 📰 MOCKUP: O MARTELO VIRA UM JORNAL DE VÁRIAS PÁGINAS ──────────────────
//
// Ele viu o mockup da página 2 e pegou o buraco: *"agora q eu vi q já dava p
// passar a página do jornal... porém ninguém percebe... tem q ter alguma dobra
// sei lá.. algo q dê vontade de virar a página… algo claro q tem outra página…
// outras páginas na verdade, q são mais de duas"*.
//
// 🔑 O PROBLEMA NÃO É CABER, É AVISAR. O jornal já cresce pra baixo — o que falta
//    é o papel DIZER que tem mais. Num jornal de papel isso é resolvido por três
//    coisas, e é delas que este mockup trata:
//      1. a ORELHA do canto (o papel levantado) — dá vontade de puxar
//      2. a CHAMADA DE CAPA ("nesta edição") — diz o que tem lá dentro
//      3. o NÚMERO DA PÁGINA ("PÁG. 1 DE 4") — diz quantas faltam
//    Sem as três, uma página só emenda na outra e vira rolagem sem graça.
//
// 📐 Desenhado na largura do CELULAR (430px), que é onde ele lê o jornal.
//
// Rodar: node scripts/mockup-jornal-paginas.mjs [--saida /tmp/paginas.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/jornal-paginas.png')

const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const ARTE = `data:image/webp;base64,${fs.readFileSync('src/escalacao/img/jornal-bola-ouro-v1.webp').toString('base64')}`

const INK = '#0C0C0C', GOLD = '#FFC400', TINTA2 = '#413825', TINTA3 = '#615039', CREME = '#F4ECD6'
const SER = "Georgia,'Times New Roman',serif", OSW = 'Oswald,sans-serif'
const PAPEL = 'radial-gradient(circle at 30% 0%, #fbf3df 6%, #e3d0ad 150%)'

const bloco = (titulo, nota, dentro) => `
  <section style="margin-bottom:20px">
    <div style="font-family:${OSW};font-weight:700;font-size:16px;letter-spacing:.5px;color:${INK};text-transform:uppercase">${titulo}</div>
    <div style="font-size:11.5px;color:rgba(12,12,12,.62);margin:1px 0 8px;line-height:1.45">${nota}</div>
    ${dentro}
  </section>`

// ── 1) A ORELHA: o canto do papel levantado, com a página de baixo aparecendo ──
const orelha = (texto, sub) => `
  <div style="position:relative;background:${PAPEL};border:3px solid ${INK};border-radius:4px;padding:14px 14px 0;overflow:hidden">
    <div style="font-family:${SER};font-weight:700;font-size:15px;color:${TINTA2};text-align:center">… fim da matéria de capa</div>
    <div style="font-size:11.5px;color:${TINTA3};font-weight:600;line-height:1.5;margin-top:6px">
      O Neymarzetti fechou a temporada com 82 pontos e o título da Série A. Na próxima página, os prêmios individuais do ano — e a pergunta que o país fez a semana inteira.
    </div>
    <!-- a página de baixo, espiando -->
    <div style="height:26px;margin:14px -14px 0;background:${PAPEL};border-top:2px solid rgba(65,56,37,.35);position:relative">
      <div style="position:absolute;left:14px;top:6px;font-family:${OSW};font-weight:700;font-size:10px;letter-spacing:1.6px;color:${TINTA3}">🥇 A BOLA DE OURO · OS GARÇONS · A ARTILHARIA</div>
    </div>
    <!-- 📄 A ORELHA: triângulo de papel levantado no canto -->
    <div style="position:absolute;right:0;bottom:0;width:86px;height:86px;
                background:linear-gradient(225deg,#d9c39a 0%,#efe3c6 42%,#fbf5e6 100%);
                clip-path:polygon(100% 0,100% 100%,0 100%);
                box-shadow:-4px -4px 10px rgba(65,56,37,.35);border-left:2px solid rgba(65,56,37,.25)"></div>
    <div style="position:absolute;right:8px;bottom:9px;font-size:17px;transform:rotate(-8deg)">👆</div>
  </div>`

// ── 2) A BARRA DE VIRAR: diz O QUE tem na próxima (é isso que dá vontade) ──
const barra = (n, titulo, chamada) => `
  <div style="display:flex;align-items:center;gap:11px;background:${INK};color:#fff;border:3px solid ${INK};border-radius:10px;padding:10px 12px;box-shadow:3px 3px 0 rgba(12,12,12,.25)">
    <div style="flex:none;width:34px;height:34px;border-radius:8px;border:2.5px solid ${GOLD};display:flex;align-items:center;justify-content:center;font-family:${OSW};font-weight:700;font-size:17px;color:${GOLD}">${n}</div>
    <div style="flex:1;min-width:0">
      <div style="font-family:${OSW};font-weight:700;font-size:9.5px;letter-spacing:1.6px;color:rgba(255,255,255,.55)">VIRAR PARA A PÁGINA ${n}</div>
      <div style="font-family:${OSW};font-weight:700;font-size:16px;line-height:1.1">${titulo}</div>
      <div style="font-size:10px;font-weight:600;color:rgba(255,255,255,.6);line-height:1.3">${chamada}</div>
    </div>
    <div style="flex:none;font-size:22px;color:${GOLD}">›</div>
  </div>`

// ── 3) A CHAMADA DE CAPA: o "nesta edição" ──
const chamadas = `
  <div style="background:${PAPEL};border:3px solid ${INK};border-radius:4px;padding:11px 13px">
    <div style="font-family:${OSW};font-weight:700;font-size:10px;letter-spacing:2px;color:${TINTA3};text-align:center">NESTA EDIÇÃO</div>
    <div style="height:2px;background:${TINTA2};margin:7px 0 9px"></div>
    ${[['2', '🥇 A Bola de Ouro', 'Ele não foi o artilheiro. Nem o garçom.'],
       ['3', '🏆 Os donos da temporada', 'Campeões de A, B, C, D, Copa e Supercopa.'],
       ['4', '🕴️ O mercado e a tua agência', 'Quem valorizou, quem despencou.']].map(([n, t, s]) => `
      <div style="display:flex;gap:9px;align-items:baseline;margin-bottom:7px">
        <div style="flex:none;font-family:${OSW};font-weight:700;font-size:13px;color:${GOLD};background:${INK};border-radius:4px;padding:0 6px">${n}</div>
        <div style="min-width:0">
          <div style="font-family:${OSW};font-weight:700;font-size:14px;color:${INK};line-height:1.1">${t}</div>
          <div style="font-size:11px;font-weight:600;color:${TINTA3};font-style:italic">${s}</div>
        </div>
      </div>`).join('')}
  </div>`

// ── 4) O CABEÇALHO DE CADA PÁGINA, com o número ──
const cabecalho = (n, de, titulo) => `
  <div style="background:${PAPEL};border:3px solid ${INK};border-radius:4px;padding:12px 13px 10px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="font-family:${OSW};font-weight:700;font-size:10px;letter-spacing:1.4px;color:${TINTA3}">O MARTELO</div>
      <div style="display:flex;gap:4px;align-items:center">
        ${Array.from({ length: de }, (_, i) => `<div style="width:${i + 1 === n ? 16 : 7}px;height:7px;border-radius:4px;background:${i + 1 === n ? INK : 'rgba(65,56,37,.3)'}"></div>`).join('')}
        <div style="font-family:${OSW};font-weight:700;font-size:10px;color:${TINTA3};margin-left:5px">PÁG. ${n} DE ${de}</div>
      </div>
    </div>
    <div style="height:1.5px;background:#6c604a;margin:9px 0"></div>
    <div style="font-family:${SER};font-weight:700;font-size:26px;color:${INK};text-align:center;line-height:1">${titulo}</div>
  </div>`

// ── 5) o mapa das páginas ──
const mapa = `
  <div style="display:flex;gap:7px">
    ${[['1', 'CAPA', 'A manchete e os teus números', '#B8892B'],
       ['2', 'PRÊMIOS', 'Bola de Ouro · artilharia · garçons', GOLD],
       ['3', 'DONOS', 'Campeões de tudo', '#3E8E4E'],
       ['4', 'MERCADO', 'Agência e valores', '#8B5E3C']].map(([n, t, s, c]) => `
      <div style="flex:1;background:${PAPEL};border:2.5px solid ${INK};border-radius:5px;padding:7px 6px;text-align:center;box-shadow:2px 2px 0 rgba(12,12,12,.2)">
        <div style="font-family:${OSW};font-weight:700;font-size:19px;color:${c === GOLD ? '#8a6d1f' : c}">${n}</div>
        <div style="font-family:${OSW};font-weight:700;font-size:10px;letter-spacing:.6px;color:${INK}">${t}</div>
        <div style="font-size:8.5px;font-weight:600;color:${TINTA3};line-height:1.25;margin-top:2px">${s}</div>
      </div>`).join('')}
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:20px 18px 26px;width:430px}
</style></head><body>
  <div style="font-family:${OSW};font-weight:700;font-size:25px;color:${INK};line-height:1.05">📰 O JORNAL VIRA PÁGINA</div>
  <div style="font-size:12px;color:rgba(12,12,12,.6);margin:3px 0 14px;line-height:1.5">
    Você falou certo: já dava pra continuar, mas <b>ninguém percebe</b>. Num jornal de papel isso se resolve com <b>três coisas</b>, e é o que está aqui.
  </div>

  ${bloco('1 · A orelha do papel', 'O canto levantado, com a página de baixo espiando. É o sinal mais antigo que existe de “tem mais” — e dá vontade de puxar. Tocar nele vira a página.', orelha())}

  ${bloco('2 · A barra que diz o que tem lá', 'Só “próxima página” não convence ninguém. O que dá vontade é <b>saber o que tem</b>. Fica grudada embaixo do fim de cada página.', barra('2', 'Os prêmios do ano', 'Quem levou a Bola de Ouro — e não foi o artilheiro.'))}

  ${bloco('3 · A chamada de capa', 'Jornal de verdade anuncia o miolo na capa. Esta caixa entra logo abaixo da manchete, na página 1 — e é ela que faz a pessoa saber que existem <b>4 páginas</b> antes mesmo de rolar.', chamadas)}

  ${bloco('4 · O número da página, sempre à vista', 'No topo de cada página: as bolinhas mostram onde você está e quantas faltam. Some a dúvida de “acabou ou não?”.', cabecalho(2, 4, 'Os prêmios do ano'))}

  ${bloco('5 · O mapa da edição', 'Minha sugestão de divisão. A capa fica leve de novo (hoje ela carrega tudo), e cada página tem um assunto só.', mapa)}

  ${bloco('Como fica a página 2', 'Cabeçalho com o número, a matéria, e no fim a orelha chamando a 3.', `
    <div style="background:${PAPEL};border:3px solid ${INK};border-radius:4px;overflow:hidden">
      <div style="padding:11px 12px 0">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:${OSW};font-weight:700;font-size:9.5px;letter-spacing:1.4px;color:${TINTA3}">O MARTELO</div>
          <div style="font-family:${OSW};font-weight:700;font-size:9.5px;color:${TINTA3}">PÁG. 2 DE 4</div>
        </div>
        <div style="height:1.5px;background:#6c604a;margin:8px 0"></div>
        <div style="font-family:${SER};font-weight:700;font-size:24px;color:${INK};text-align:center">A Bola de Ouro</div>
        <div style="font-family:${OSW};font-weight:700;font-size:9.5px;letter-spacing:1.2px;color:${TINTA3};text-align:center;margin:4px 0 9px">O MELHOR DO MUNDO — GOLS <span style="color:${INK}">+</span> ASSISTÊNCIAS</div>
      </div>
      <div style="position:relative;margin:0 12px;border:3px solid ${INK}">
        <img src="${ARTE}" style="width:100%;display:block">
        <div style="position:absolute;left:0;right:0;bottom:0;padding:34px 11px 8px;background:linear-gradient(to top,rgba(0,0,0,.93) 26%,rgba(0,0,0,0))">
          <div style="font-family:${OSW};font-weight:700;font-size:9px;letter-spacing:1.6px;color:${GOLD}">🥇 TEMPORADA 25</div>
          <div style="font-family:${OSW};font-weight:700;font-size:21px;line-height:1;color:#fff">Julián Álvarez</div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;align-items:baseline;gap:8px;margin:10px 0 12px;font-family:${OSW}">
        <span><b style="font-size:19px">24</b><span style="font-size:9px;font-weight:700;color:${TINTA3}"> GOLS</span></span>
        <span style="font-size:15px;color:${TINTA3};font-weight:700">+</span>
        <span><b style="font-size:19px">13</b><span style="font-size:9px;font-weight:700;color:${TINTA3}"> ASS.</span></span>
        <span style="font-size:15px;color:${TINTA3};font-weight:700">=</span>
        <span style="background:${GOLD};border:2.5px solid ${INK};border-radius:7px;padding:0 9px;box-shadow:2px 2px 0 ${INK}"><b style="font-size:19px">37</b></span>
      </div>
      <div style="position:relative;height:40px;border-top:2px solid rgba(65,56,37,.3)">
        <div style="position:absolute;left:12px;top:11px;font-family:${OSW};font-weight:700;font-size:9.5px;letter-spacing:1.4px;color:${TINTA3}">🏆 OS DONOS DA TEMPORADA …</div>
        <div style="position:absolute;right:0;bottom:0;width:62px;height:62px;
                    background:linear-gradient(225deg,#d9c39a 0%,#efe3c6 42%,#fbf5e6 100%);
                    clip-path:polygon(100% 0,100% 100%,0 100%);
                    box-shadow:-3px -3px 8px rgba(65,56,37,.35)"></div>
      </div>
    </div>`)}

  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2)">
    <div style="font-family:${OSW};font-weight:700;font-size:14px;color:${INK}">🤔 E O COMPARTILHAR?</div>
    <div style="font-size:12px;color:rgba(12,12,12,.75);margin-top:5px;line-height:1.5">
      Numa <b>imagem</b> ninguém vira página. Então o botão de compartilhar passa a perguntar:
      <br>· <b>“Esta página”</b> — só a que ele está vendo (boa pra mandar no grupo: uma imagem curta, com a Bola de Ouro, por exemplo).
      <br>· <b>“O jornal inteiro”</b> — as 4 páginas emendadas numa imagem só, com as dobras desenhadas.
      <br><br>Acho que a maioria vai mandar <b>só a página</b> — é mais fácil de olhar no celular dos amigos.
    </div>
  </div>
</body></html>`

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await nav.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: SAIDA, fullPage: true })
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
