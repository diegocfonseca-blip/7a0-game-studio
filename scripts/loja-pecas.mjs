// 🧩 PEÇAS DA LOJA — compartilhadas pelos mockups (`mockup-loja-clube.mjs` e
// `mockup-loja-aba.mjs`), pra a camisa, o escudo base e a vitrine serem LITERALMENTE
// os mesmos desenhos nos dois. Mockup que se repete acaba divergindo.
import { readFileSync } from 'node:fs'

export const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D'
export const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
export const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
export const OSW = 'font-family:Oswald,sans-serif'
export const img = (caminho, tipo = 'webp') => `data:image/${tipo};base64,${readFileSync(caminho).toString('base64')}`

// 👕 As peças do mockup moram em `scripts/kits/` (são do POST, não do jogo —
// no jogo o molde é pintado na hora, veja `scripts/tinge-camisa.py`):
//   · MOLDE-camisa-branca.webp  → o molde em branco (camisa do Final Boss, limpa)
//   · camisa-tier-foiprof.webp  → o molde já pintado no bege 🪵 Foi Profissional
//   · patro-vadico-alfa.webp    → o logo da Vadico com fundo transparente (cor intacta)
//   · patro-reidastintas-alfa.webp → o logo do Rei das Tintas (já nasce com alfa)
export const CAMISA_TIER = img('scripts/kits/MOLDE-camisa-tier.webp')
export const LOGO_VADICO = img('scripts/kits/patro-vadico-alfa.webp')
export const LOGO_REIDASTINTAS = img('scripts/kits/patro-reidastintas-alfa.webp')

// 🛡️ ESCUDO BASE — quem não tem batismo também tem escudo (pedido do Diego, 15/09):
// *"o escudo base que sempre vem com a primeira letra ou algo do tipo pra pôr no
// peito, com alguma cor também o escudo"*.
//
// Ele NASCE DA LETRA do clube e das 2 cores que o dono escolhe, então é DESENHO EM
// CÓDIGO, não arquivo — se fosse arquivo seria um por clube, e aí a regra de peso
// morria na hora (são dezenas de milhares de carreiras). Aqui ele custa 0 KB e serve
// pra qualquer nome: "Fulanos FC" → F.
export const escudoBase = ({ letra, c1, c2, size = 44 }) => {
  const L = (letra || '?').trim().charAt(0).toUpperCase()
  return `<svg viewBox="0 0 100 114" width="${Math.round(size * 100 / 114)}" height="${size}" style="display:block;overflow:visible">
    <defs><linearGradient id="g${L}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <path d="M50 3 L95 17 V60 C95 86 74 102 50 111 C26 102 5 86 5 60 V17 Z"
          fill="url(#g${L})" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M9 34 H91" stroke="${INK}" stroke-width="5" opacity=".85"/>
    <text x="50" y="82" text-anchor="middle" style="${OSW};font-weight:700;font-size:56px;letter-spacing:-1px"
          fill="#F4ECD6" stroke="${INK}" stroke-width="5" paint-order="stroke">${L}</text>
  </svg>`
}


// 🏬 A VITRINE DA LOJA — pedido do Diego (15/09): *"não tem uma arte foda que possa
// fazer também?"*. A camisa numa caixa branca é catálogo; loja é vitrine. Então a
// moldura virou cena: madeira escura, foco de luz quente em cima da camisa, chão
// refletindo e a placa de LOJA DO CLUBE. Tudo em degradê CSS — **0 KB**, e por isso
// funciona com QUALQUER camisa (batismo ou molde do tier) sem arquivo novo.
// 👉 Se ele aprovar uma das artes do Canva, essa cena vira UM `.webp` e a camisa
//    continua entrando por cima exatamente do mesmo jeito.
export const vitrine = (shirt) => `
  <div style="position:relative;overflow:hidden;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};
              margin-bottom:9px;background:
                radial-gradient(120% 70% at 50% 4%, rgba(255,213,120,.42) 0%, rgba(255,196,0,.10) 38%, transparent 66%),
                linear-gradient(#2A1B10 0%, #40281680 34%, #1A0F08 100%),
                repeating-linear-gradient(90deg,#3A2414 0 26px,#331F11 26px 52px)">
    <div style="position:absolute;inset:0 0 auto;height:30px;background:linear-gradient(#0B0704,#0B070400);opacity:.85"></div>
    <div style="position:relative;text-align:center;padding:7px 0 2px">
      <span style="${OSW};font-weight:700;font-size:10px;letter-spacing:.22em;color:#F0DFAE;text-transform:uppercase;
                   text-shadow:0 1px 0 #000">· Loja do Clube ·</span>
    </div>
    <div style="position:relative;display:flex;justify-content:center;padding:2px 10px 0;
                filter:drop-shadow(0 14px 16px rgba(0,0,0,.55))">${shirt}</div>
    <div style="position:relative;height:34px;margin-top:-6px;background:
                linear-gradient(#150C06,#0A0603);border-top:2px solid #54351C"></div>
  </div>`

// ── A CAMISA: a arte (imagem) + as 3 peças carimbadas por cima ──────────────
// `pos` = onde cada peça cai NAQUELA arte, em % (arte de batismo e molde têm
// enquadramentos diferentes, então cada uma traz as suas medidas).
export const camisa = ({ arte, alt = 300, escudo, fornecedor, fornSimbolo, master, masterLogo, masterCor, masterW = 0.27, masterH = 0.10, pos }) => `
  <div style="position:relative;height:${alt}px;flex:none;isolation:isolate">
    <img src="${arte}" style="height:${alt}px;display:block">
    ${!escudo ? '' : `<div style="position:absolute;left:${pos.escudoX}%;top:${pos.escudoY}%;transform:translate(-50%,-50%);
                filter:drop-shadow(0 1px 2px rgba(0,0,0,.42))">
      ${escudo.startsWith('data:')
        ? `<img src="${escudo}" style="height:${Math.round(alt * 0.135)}px;display:block">`
        : escudo /* escudo base desenhado em código (SVG) */}
    </div>`}
    <div style="position:absolute;left:${pos.fornX}%;top:${pos.fornY}%;transform:translate(-50%,-50%);
                display:flex;flex-direction:column;align-items:center;gap:${Math.round(alt * 0.006)}px;
                mix-blend-mode:multiply;opacity:.95;filter:blur(.15px);color:${masterCor ?? INK}">
      <span style="font-size:${(alt * 0.034).toFixed(1)}px;line-height:1">${fornSimbolo ?? '▸'}</span>
      <span style="${OSW};font-weight:700;font-size:${(alt * 0.022).toFixed(1)}px;line-height:1;letter-spacing:.6px;text-transform:uppercase;white-space:nowrap">${fornecedor}</span>
    </div>
    <div style="position:absolute;left:${pos.masterX}%;top:${pos.masterY}%;transform:translate(-50%,-50%);
                ${masterLogo ? 'opacity:.97' : 'mix-blend-mode:multiply;opacity:.93'};filter:blur(.15px)">
      ${masterLogo
        // 🔴 LOGO DE MARCA REAL ENTRA EM CORES DE VERDADE. O `multiply` casava a
        // estampa com o tecido, mas comia a cor do logo — o vermelho da Vadico
        // sumia. O Diego pegou: *"se eu por a logo da Vadico ali, que tem parte
        // vermelha, deve aparecer o vermelho. Não é pra ser sem cor"*. Como o
        // arquivo já tem alfa de verdade (o branco do fundo virou transparente,
        // veja `scripts/kits/patro-vadico-alfa.webp`), ele entra por cima normal
        // e a cor fica intacta; a sombrinha é que encaixa a estampa no pano.
        // 📐 a estampa entra numa CAIXA (larg × alt) e se ajusta dentro dela. Assim o
        // logo DEITADO (Vadico) e o REDONDO (Rei das Tintas) saem os dois no tamanho
        // certo pro peito, sem um virar gigante por causa do formato do arquivo.
        ? `<img src="${masterLogo}" style="max-width:${Math.round(alt * masterW)}px;max-height:${Math.round(alt * masterH)}px;
             width:auto;height:auto;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.28))">`
        : (() => {
            // 🖨️ marca SEM logo: o nome é impresso no peito e tem que CABER no corpo
            // da camisa (≈65% da largura dele). Nome comprido quebra em 2 linhas,
            // que é o que kit de verdade faz — não encolhe até virar formiga.
            const linhas = master.length > 14 ? (() => {
              const p = master.split(' '); const meio = Math.ceil(p.length / 2)
              return [p.slice(0, meio).join(' '), p.slice(meio).join(' ')]
            })() : [master]
            const maior = Math.max(...linhas.map(l => l.length))
            const fs = Math.max(alt * 0.028, Math.min(alt * 0.058, (alt * 0.30) / (maior * 0.52)))
            return `<div style="${OSW};font-weight:700;font-size:${fs.toFixed(1)}px;line-height:1.05;letter-spacing:.5px;
                      text-transform:uppercase;text-align:center;color:${masterCor ?? INK}">${linhas.join('<br>')}</div>`
          })()}
    </div>
  </div>`

