// ─── 📰 MOCKUP: A SEGUNDA PÁGINA DE O MARTELO ───────────────────────────────
//
// Ideia do Diego (19/09): *"acho q vc deveria prolongar o jornal p baixo sei la..
// Como se fosse uma segunda página, mas embaixo, com mesmo estilo e arte, pra
// poder caber mais coisas"*.
//
// ✅ E DÁ, sem obra grande: o jornal JÁ cresce pra baixo. O canvas é desenhado num
//    buffer alto e depois CORTADO na altura que o conteúdo usou
//    (`const H = Math.min(MAXH, Math.round(y))`, `jornal.tsx`). O que existe é um
//    TETO — `MAXH = 2520`. "Segunda página" = subir o teto e desenhar mais blocos.
//    Nada precisa ser remontado; a página 1 fica exatamente como está hoje.
//
// 🎨 Cores, filetes e fontes copiados do arquivo de verdade, pra ele ver o jornal
//    e não um desenho parecido: papel `#fbf3df → #e3d0ad`, tinta `#0C0C0C`,
//    secundária `#413825`, ouro `#FFC400`, masthead em serifada, rótulos em Oswald.
//
// Rodar: node scripts/mockup-jornal-pagina2.mjs [--saida /tmp/jornal2.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/jornal-pagina2.png')

const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const ARTE = `data:image/webp;base64,${fs.readFileSync('src/escalacao/img/jornal-bola-ouro-v1.webp').toString('base64')}`

// 🎨 as constantes REAIS do jornal.tsx
const INK = '#0C0C0C', GOLD = '#FFC400', TINTA2 = '#413825', TINTA3 = '#615039'
const SER = "Georgia,'Times New Roman',serif", OSW = 'Oswald,sans-serif'
const DIVCOR = { A: '#B8892B', B: '#3E8E4E', C: '#9A7B33', D: '#7A7460', V: '#8B5E3C' }

const filete = (peso = 2.5, cor = TINTA2, mb = 0) => `<div style="height:${peso}px;background:${cor};margin-bottom:${mb}px"></div>`
const secao = t => `
  <div style="text-align:center;margin:26px 0 6px">
    <div style="font-family:${SER};font-weight:700;font-size:38px;color:${INK};line-height:1">${t}</div>
  </div>`

// 🏅 uma coluna de lista (artilharia / garçons)
const lista = (titulo, cabec, linhas) => `
  <div style="flex:1;min-width:0">
    <div style="font-family:${OSW};font-weight:700;font-size:17px;letter-spacing:.6px;color:${INK};text-transform:uppercase">${titulo}</div>
    ${filete(2, TINTA2, 6)}
    <table style="width:100%;border-collapse:collapse;font-family:${OSW}">
      <thead><tr style="text-align:left;font-size:11px;font-weight:700;color:${TINTA3}">
        <th style="padding-right:6px">#</th><th>Jogador</th><th style="text-align:center">${cabec}</th></tr></thead>
      <tbody>
        ${linhas.map((l, i) => `
          <tr style="border-top:1px solid rgba(65,56,37,.22)">
            <td style="padding:5px 6px 5px 0;vertical-align:top;font-size:15px;font-weight:700;color:${TINTA3}">${i + 1}</td>
            <td style="vertical-align:top">
              <div style="font-size:16px;font-weight:700;color:${INK};line-height:1.1">${l.voce ? '👤 ' : ''}${l.nome}</div>
              <div style="font-size:11.5px;font-weight:600;color:${TINTA3};line-height:1.2">${l.carta}</div>
              <div style="font-size:11.5px;font-weight:600;color:${TINTA3}">${l.time}</div>
            </td>
            <td style="text-align:center;vertical-align:top;font-size:20px;font-weight:700;color:${INK}">${l.n}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`

const ART = [
  { nome: 'Julián Álvarez', carta: 'Atlético de Madrid · 2025', time: 'Neymarzetti', n: 24, voce: true },
  { nome: 'Borges', carta: 'Santos · 2011', time: 'Sistematizados FC', n: 19 },
  { nome: 'Petit', carta: 'Arsenal · 1998', time: 'Tabajara', n: 17 },
  { nome: 'Malcom', carta: 'Barcelona · 2018', time: 'Braguinha FC', n: 15 },
  { nome: 'Peninha Foguete', carta: 'Sub-20 · 2026', time: 'Vasco da Grana', n: 12 },
]
const GAR = [
  { nome: 'Bernabei', carta: 'Internacional · 2025', time: 'Neymarzetti', n: 16, voce: true },
  { nome: 'Fubá Raio', carta: 'Sub-20 · 2026', time: 'Neymarzetti', n: 14, voce: true },
  { nome: 'Santiago Arias', carta: 'PSV · 2018', time: 'Tabajara', n: 13 },
  { nome: 'Júlio César', carta: 'Inter · 2010', time: 'Braguinha FC', n: 11 },
  { nome: 'Cafu', carta: 'Milan · 2004', time: 'Sistematizados FC', n: 9 },
]

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}
  body{margin:0;width:1080px;font-family:Arial,sans-serif;
       background:radial-gradient(circle at 30% 0%, #fbf3df 4%, #e3d0ad 125%);}
  .pad{padding:0 54px}
</style></head><body>

  <!-- ── fim da PÁGINA 1, do jeito que ela já termina hoje ── -->
  <div class="pad" style="padding-top:34px;opacity:.55">
    <div style="text-align:center;font-family:${SER};font-weight:700;font-size:38px;color:${INK}">Os donos da temporada</div>
    <div style="display:flex;gap:26px;margin-top:14px">
      ${['A', 'B'].map(d => `
        <div style="flex:1;border-left:6px solid ${DIVCOR[d]};padding-left:10px">
          <div style="font-family:${OSW};font-weight:700;font-size:12px;letter-spacing:1px;color:${DIVCOR[d]}">SÉRIE ${d}</div>
          <div style="font-family:${OSW};font-weight:700;font-size:20px;color:${INK}">${d === 'A' ? 'Neymarzetti' : 'Sistematizados FC'}</div>
          <div style="font-size:12.5px;color:${TINTA3};font-weight:600">⚽ Artilheiro: <b>${d === 'A' ? 'Julián Álvarez, 24 gols' : 'Borges, 19 gols'}</b></div>
        </div>`).join('')}
    </div>
  </div>

  <!-- ── A DOBRA: onde a página 2 começa ── -->
  <div class="pad" style="margin-top:34px">
    ${filete(3, TINTA2, 4)}
    <div style="display:flex;align-items:center;gap:14px;padding:6px 0">
      <div style="flex:1;height:1.5px;background:#6c604a"></div>
      <div style="font-family:${OSW};font-weight:700;font-size:15px;letter-spacing:3px;color:${TINTA2}">CONTINUA NA PÁGINA 2</div>
      <div style="flex:1;height:1.5px;background:#6c604a"></div>
    </div>
    ${filete(3, TINTA2, 0)}
  </div>

  <!-- ── CABEÇALHO DA PÁGINA 2 (mesmo masthead, menor) ── -->
  <div class="pad" style="padding-top:26px">
    <div style="text-align:center">
      <div style="font-family:${SER};font-weight:700;font-size:56px;color:${INK};line-height:1">O MARTELO</div>
      <div style="font-family:${SER};font-weight:700;font-size:17px;color:${TINTA2};margin-top:6px">PÁGINA 2 · OS PRÊMIOS DO ANO</div>
    </div>
    <div style="height:1.5px;background:#6c604a;margin:14px 0"></div>
  </div>

  <!-- ── 🥇 BOLA DE OURO: o carro-chefe da página 2 ── -->
  <div class="pad">
    ${secao('A Bola de Ouro')}
    <div style="font-family:${OSW};font-weight:700;font-size:13.5px;letter-spacing:1.4px;color:${TINTA3};text-align:center;margin-bottom:12px">
      O MELHOR DO MUNDO DA TEMPORADA — GOLS <span style="color:${INK}">+</span> ASSISTÊNCIAS
    </div>
    <div style="border:4px solid ${INK};border-radius:4px;overflow:hidden;position:relative;box-shadow:6px 6px 0 rgba(12,12,12,.18)">
      <img src="${ARTE}" style="width:100%;display:block">
      <div style="position:absolute;left:0;right:0;bottom:0;padding:70px 26px 20px;background:linear-gradient(to top,rgba(0,0,0,.93) 28%,rgba(0,0,0,0))">
        <div style="font-family:${OSW};font-weight:700;font-size:14px;letter-spacing:2px;color:${GOLD}">🥇 BOLA DE OURO · TEMPORADA 25</div>
        <div style="font-family:${OSW};font-weight:700;font-size:46px;line-height:1;color:#fff">Julián Álvarez</div>
        <div style="font-family:${OSW};font-weight:600;font-size:15px;color:rgba(255,255,255,.66)">Atlético de Madrid · 2025 — Neymarzetti · Série A</div>
      </div>
    </div>
    <div style="display:flex;justify-content:center;align-items:baseline;gap:16px;margin-top:14px;font-family:${OSW}">
      <span><b style="font-size:34px;color:${INK}">24</b><span style="font-size:13px;font-weight:700;color:${TINTA3}"> GOLS</span></span>
      <span style="font-size:26px;color:${TINTA3};font-weight:700">+</span>
      <span><b style="font-size:34px;color:${INK}">13</b><span style="font-size:13px;font-weight:700;color:${TINTA3}"> ASSISTÊNCIAS</span></span>
      <span style="font-size:26px;color:${TINTA3};font-weight:700">=</span>
      <span style="background:${GOLD};border:4px solid ${INK};border-radius:10px;padding:2px 16px;box-shadow:4px 4px 0 ${INK}">
        <b style="font-size:34px;color:${INK}">37</b></span>
    </div>
    <div style="text-align:center;font-size:14px;color:${TINTA3};font-weight:600;margin-top:12px;line-height:1.45;font-style:italic">
      Não foi o artilheiro do ano, nem quem mais deu passes.<br>Foi o único que fez as duas coisas.
    </div>
  </div>

  <!-- ── 🏆 as duas listas do ano, lado a lado ── -->
  <div class="pad" style="margin-top:30px">
    ${filete(2.5, TINTA2, 18)}
    <div style="display:flex;gap:36px">
      ${lista('🏆 Artilharia do ano', 'Gols', ART)}
      <div style="width:2px;background:rgba(65,56,37,.3)"></div>
      ${lista('🅰️ Os garçons do ano', 'Ass', GAR)}
    </div>
  </div>

  <!-- ── 🥇 a galeria: quem já levou a bola ── -->
  <div class="pad" style="margin-top:30px">
    ${filete(2.5, TINTA2, 14)}
    <div style="font-family:${OSW};font-weight:700;font-size:17px;letter-spacing:.6px;color:${INK};text-transform:uppercase">🥇 A galeria das bolas de ouro</div>
    <div style="font-size:13px;color:${TINTA3};font-weight:600;margin:3px 0 10px">Quem já foi o melhor do mundo desde que a premiação existe.</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px">
      ${[['Zico', 'Flamengo · 1981', 12, 'T3 T5 T6 T9 +8'],
         ['Julián Álvarez', 'Atlético de Madrid · 2025', 4, 'T18 T21 T24 T25'],
         ['Romário', 'Vasco · 2000', 3, 'T11 T12 T17'],
         ['Cafu', 'Milan · 2004', 1, 'T7']].map(([n, c, q, ts]) => `
        <div style="flex:1 1 calc(50% - 10px);border:2.5px solid ${INK};border-radius:6px;padding:8px 10px;background:rgba(255,255,255,.28)">
          <div style="display:flex;align-items:baseline;gap:8px">
            <span style="font-family:${OSW};font-weight:700;font-size:22px;color:${INK}">${q}</span>
            <span style="font-size:16px">🥇</span>
            <span style="font-family:${OSW};font-weight:700;font-size:18px;color:${INK};line-height:1.1">${n}</span>
          </div>
          <div style="font-size:12px;font-weight:600;color:${TINTA3}">${c}</div>
          <div style="font-family:${OSW};font-size:12px;font-weight:700;color:#8a6d1f;margin-top:3px">${ts}</div>
        </div>`).join('')}
    </div>
  </div>

  <!-- ── RODAPÉ, igual ao que já existe ── -->
  <div class="pad" style="margin-top:34px;padding-bottom:40px">
    ${filete(3, TINTA2, 4)}
    ${filete(1.5, TINTA2, 12)}
    <div style="text-align:center;font-family:${OSW};font-weight:700;font-size:15px;color:${TINTA2};letter-spacing:1px">
      leilaolegends.com · 📲 @leilaolegendscom
    </div>
  </div>
</body></html>`

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await nav.newPage({ viewport: { width: 1080, height: 1200 }, deviceScaleFactor: 1 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: SAIDA, fullPage: true })
const alturaTotal = await p.evaluate(() => document.body.scrollHeight)
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB · a página 2 mede ~${alturaTotal}px de altura`)
