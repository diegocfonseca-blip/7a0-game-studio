// ─── 🤝 MOCKUP: A HORA DO PATROCÍNIO (início de temporada) ──────────────────
//
// Reclamação do Diego (21/08): *"a hora do patrocínio que o usuário tem que
// escolher na temporada… acho que tá sem graça o visual. E também MUITA
// informação perante as coisas em volta"* e *"não quero mais aparecendo a
// tabela de valores aí — coloque na aba de patrocínio que já existe. Além
// disso esse visual tá muito morto, não sei, é pouco organizado"*.
//
// 🔎 MEDIDO NA TELA DE HOJE (estadio.tsx: SponsorBetResultCard +
//    SponsorLoyaltyBanner + SponsorBetBanner + SponsorPayTable):
//    antes de conseguir apertar "Começar a temporada" a pessoa rola por
//    5 quadros grandes, 9 botões de marca, 4 parágrafos cinzas e 1 tabela de
//    5 linhas × 3 colunas. Tudo com o MESMO peso visual — nada grita "é AQUI
//    que você decide". Por isso parece morto: é uma parede de branco.
//
// 💡 A PROPOSTA: UM quadro só, DOIS toques, e a régua sai daqui.
//    1) o resultado da temporada passada vira FAIXA fina (não quadro);
//    2) passo 1 = a META (3 fichas grandes, valor gigante, uma linha cada);
//    3) passo 2 = a MARCA — só as 3 daquele nível aparecem (não as 9);
//       a marca fiel já chega com o selo 🎖️ dentro do botão (mata o banner
//       de fidelidade inteiro);
//    4) fechou = carimbo ASSINADO e o botão verde acende;
//    5) a TABELA DE VALORES muda de casa: vai pra aba 🤝 Patrocínio.
//
//   node scripts/mockup-patrocinio.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'patrocinio.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

// logos reais das marcas do Diego (data URI dentro dos .ts do jogo)
const logo = f => { const m = readFileSync(f, 'utf8').match(/'(data:image\/[^']+)'/); return m ? m[1] : '' }
const L_MAX = logo('src/escalacao/maxjoias.ts')
const L_VAD = logo('src/escalacao/vadico.ts')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CREME = '#F4ECD6'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:30px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const cab = `
  <div style="background:${INK};padding:11px 13px;color:#fff">
    <div style="${OSW};font-size:9.5px;letter-spacing:.08em;color:${GOLD}">TEMPORADA 11 · LIGA LEGENDS</div>
    <div style="${OSW};font-size:19px;margin-top:1px">Começando…</div>
    <div style="font-family:system-ui;font-size:10.5px;font-weight:700;opacity:.65">Série D</div>
  </div>`

// ── COMO ESTÁ HOJE (redesenho fiel do que o Diego printou) ─────────────────
const quadro = (bg, inner, mb = 10) =>
  `<div style="border:3px solid ${INK};border-radius:15px;background:${bg};box-shadow:3px 3px 0 ${INK};margin:0 0 ${mb}px;overflow:hidden">${inner}</div>`

const marcaHoje = (nome, emoji, img) => `
  <div style="flex:1;border:2.5px solid ${INK};border-radius:10px;background:#FBF6E9;padding:8px 5px;text-align:center">
    <div style="height:40px;display:flex;align-items:center;justify-content:center">
      ${img ? `<div style="background:#fff;border-radius:8px;padding:4px 6px;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><img src="${img}" style="max-height:100%;max-width:100%;object-fit:contain"></div>` : `<span style="font-size:26px">${emoji}</span>`}
    </div>
    <div style="${OSW};font-size:9.5px;margin-top:3px">${nome}</div>
  </div>`

const nivelHoje = (bg, tit, val, desc, marcas) => quadro('#fff', `
  <div style="background:${bg};padding:8px 11px;display:flex;align-items:center;justify-content:space-between">
    <span style="${OSW};font-size:13px">${tit}</span>
    <span style="${OSW};font-size:12px;background:${INK};color:#fff;border-radius:7px;padding:2px 8px">+${val}</span>
  </div>
  <div style="padding:8px 11px">
    <div style="font-family:system-ui;font-size:10px;font-weight:600;color:rgba(0,0,0,.55);margin-bottom:7px">${desc}</div>
    <div style="display:flex;gap:6px">${marcas}</div>
  </div>`)

const HOJE = `${cab}
  <div style="padding:11px">
    ${quadro('#fff', `<div style="padding:13px;text-align:center">
      <div style="font-size:28px">🛡️</div>
      <div style="${OSW};font-size:14px;margin:3px 0 2px">Aposta certeira!</div>
      <div style="font-family:system-ui;font-size:10.5px;font-weight:600;color:rgba(0,0,0,.6);line-height:1.4">Você apostou em 🛡️ <b>Não cair de divisão</b> com a <b>Max Joias</b> — e bateu a meta! O patrocínio pagou.</div>
      <div style="display:inline-block;margin-top:8px;${OSW};font-size:14px;background:${GREEN};color:#fff;border:2.5px solid ${INK};border-radius:10px;padding:5px 15px">+4 🪙 no caixa</div>
      <div style="font-family:system-ui;font-size:9px;font-weight:700;color:#8a6d00;margin-top:7px">Você foi além da meta — mas o prêmio é só o do nível apostado. 😉</div>
    </div>`)}
    ${quadro('#fff', `
      <div style="background:linear-gradient(150deg,${GREEN},#0f4f26);padding:10px;text-align:center;color:#fff">
        <div style="font-family:system-ui;font-size:9px;font-weight:800;letter-spacing:.06em;color:#BFF2D3">🎖️ FIDELIDADE</div>
        <div style="${OSW};font-size:14px">Max Joias quer continuar</div>
      </div>
      <div style="padding:10px">
        <div style="background:${CREME};border:2.5px solid ${INK};border-radius:12px 12px 12px 3px;padding:8px 10px;font-family:system-ui;font-size:10.5px;font-weight:600;font-style:italic;line-height:1.4">"Parabéns pelo resultado da temporada passada! A gente gostou de ver o nome da Max Joias junto do seu time — bora continuar juntos?"</div>
        <div style="margin-top:9px;background:#FFF6DE;border:2.5px solid ${INK};border-radius:12px;padding:9px 10px">
          <div style="${OSW};font-size:9px;color:#8a6d00">🤝 PROPOSTA</div>
          <div style="font-family:system-ui;font-size:10.5px;font-weight:600;line-height:1.4;margin-top:2px">Escolha a <b>Max Joias</b> de novo agora e, mesmo que não bata a meta, o patrocínio garante um mínimo:</div>
        </div>
      </div>`)}
    ${quadro(INK, `<div style="padding:9px;text-align:center;color:#fff">
      <div style="${OSW};font-size:14px;color:${GOLD}">🤝 PATROCÍNIO DA TEMPORADA</div>
      <div style="font-family:system-ui;font-size:10px;font-weight:700;opacity:.8">Escolha a APOSTA — quanto mais ambiciosa, mais paga</div></div>`)}
    ${nivelHoje('#EAF3FF', '🛡️ Não cair de divisão', 4, 'Aposta segura: termine fora da zona de rebaixamento (fora do Z4).',
      marcaHoje('Padaria do Zé', '🥖') + marcaHoje('Açougue Bom Corte', '🥩') + marcaHoje('Max Joias', '💍', L_MAX))}
    ${nivelHoje('#FBF3DC', '📈 Acesso (top 4)', 8, 'Termine entre os 4 primeiros da sua divisão.',
      marcaHoje('Espetinho', '🍗') + marcaHoje('Rei das Tintas', '🎨') + marcaHoje('Guaraná Craque', '🥤'))}
    ${nivelHoje('#FFD84D', '👑 Campeão (liga ou copa)', 12, 'Seja CAMPEÃO — da liga ou da Copa Legends.',
      marcaHoje('Vadico', '🚗', L_VAD) + marcaHoje('ERO', '🦷') + marcaHoje('Diamante', '💎'))}
    <div style="font-family:system-ui;font-size:10px;font-weight:700;color:${RED};text-align:center;margin-bottom:6px">👆 Escolha uma marca aí em cima pra liberar o início</div>
    <div style="font-family:system-ui;font-size:9px;font-weight:600;color:rgba(0,0,0,.45);text-align:center;line-height:1.4;margin-bottom:8px">Vale a temporada inteira. Ficou aquém do escolhido? Não paga nada. Bateu mas podia ter mirado mais alto? Recebe só o que apostou.</div>
    ${quadro('#fff', `<div style="padding:9px 11px;font-family:system-ui;font-size:9.5px;font-weight:700">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;color:rgba(0,0,0,.45);font-size:8px;text-transform:uppercase"><span>Divisão</span><span style="text-align:center">🛡️</span><span style="text-align:center">📈</span><span style="text-align:center">👑</span></div>
      ${[['🌱 Várzea', 2, 4, 6], ['Série D', 4, 8, 12], ['Série C', 8, 16, 24], ['Série B', 16, 32, 48], ['Série A', 32, 64, 96]]
        .map(r => `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;padding:3px 0;border-top:1px solid rgba(0,0,0,.08)"><span>${r[0]}</span><span style="text-align:center">${r[1]}</span><span style="text-align:center">${r[2]}</span><span style="text-align:center">${r[3]}</span></div>`).join('')}
      <div style="font-size:8.5px;color:rgba(0,0,0,.4);margin-top:6px;line-height:1.35">Dobra a cada divisão. Ficou aquém? Não paga nada. Superou? Paga só o que apostou.</div>
    </div>`, 0)}
  </div>`

// ── PROPOSTA ───────────────────────────────────────────────────────────────
// faixa fina do resultado passado (o quadro gigante vira UMA linha)
const faixa = `
  <div style="display:flex;align-items:center;gap:8px;background:#E6F3EA;border:2.5px solid ${INK};border-radius:12px;padding:7px 10px;box-shadow:2px 2px 0 ${INK};margin-bottom:11px">
    <span style="font-size:17px">🛡️</span>
    <div style="flex:1;min-width:0">
      <div style="${OSW};font-size:11.5px;line-height:1.1">Temporada passada: aposta certeira</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5)">Max Joias · não cair de divisão</div>
    </div>
    <span style="${OSW};font-size:12.5px;background:${GREEN};color:#fff;border:2px solid ${INK};border-radius:8px;padding:3px 9px;white-space:nowrap">+4 🪙</span>
  </div>`

// ficha de META — o valor é o herói, a explicação é UMA linha
const ficha = (emoji, tit, linha, val, cor, sel) => `
  <div style="flex:1;position:relative;border:3px solid ${INK};border-radius:14px;background:${sel ? cor.bg : '#fff'};
    box-shadow:${sel ? `3px 3px 0 ${INK}` : `2px 2px 0 rgba(12,12,12,.25)`};padding:9px 6px 8px;text-align:center;${sel ? '' : 'opacity:.72'}">
    ${sel ? `<div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:${INK};color:${GOLD};${OSW};font-size:8px;letter-spacing:.06em;border-radius:6px;padding:2px 7px;white-space:nowrap">SUA META</div>` : ''}
    <div style="font-size:23px;line-height:1">${emoji}</div>
    <div style="${OSW};font-size:11px;margin-top:3px;color:${sel ? cor.fg : INK};line-height:1.05">${tit}</div>
    <div style="font-family:system-ui;font-size:8.5px;font-weight:700;color:${sel ? cor.fg : 'rgba(0,0,0,.5)'};opacity:${sel ? .8 : 1};margin-top:2px;line-height:1.2">${linha}</div>
    <div style="${OSW};font-size:17px;margin-top:5px;color:${sel ? cor.fg : INK}">+${val} <span style="font-size:12px">🪙</span></div>
  </div>`

const AZUL = { bg: '#CFE3FF', fg: '#123B7A' }, AMAR = { bg: '#FFE79A', fg: '#7A5A00' }, OURO = { bg: GOLD, fg: INK }

const fichas = sel => `<div style="display:flex;gap:7px;margin-bottom:12px">
  ${ficha('🛡️', 'Não cair', 'ficar fora do Z4', 4, AZUL, sel === 1)}
  ${ficha('📈', 'Acesso', 'ficar no top 4', 8, AMAR, sel === 2)}
  ${ficha('👑', 'Campeão', 'liga ou copa', 12, OURO, sel === 3)}
</div>`

// botão de MARCA — o selo de fidelidade mora DENTRO dele
const marca = (nome, emoji, img, fiel, on) => `
  <div style="flex:1;position:relative;border:3px solid ${INK};border-radius:12px;background:${on ? INK : '#fff'};
    box-shadow:${on ? `3px 3px 0 ${INK}` : `2px 2px 0 rgba(12,12,12,.22)`};padding:9px 5px 7px;text-align:center;${on ? `outline:3px solid ${GOLD};outline-offset:-6px` : ''}">
    ${fiel ? `<div style="position:absolute;top:-8px;right:-5px;background:${GREEN};color:#fff;${OSW};font-size:8px;border:2px solid ${INK};border-radius:7px;padding:1px 5px;white-space:nowrap">🎖️ FIEL</div>` : ''}
    <div style="height:38px;display:flex;align-items:center;justify-content:center">
      ${img ? `<div style="background:#fff;border-radius:7px;padding:3px 5px;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><img src="${img}" style="max-height:100%;max-width:100%;object-fit:contain"></div>` : `<span style="font-size:25px">${emoji}</span>`}
    </div>
    <div style="${OSW};font-size:9.5px;margin-top:4px;color:${on ? '#fff' : INK};line-height:1.1">${nome}</div>
    ${fiel ? `<div style="font-family:system-ui;font-size:8px;font-weight:800;color:${on ? '#BFF2D3' : GREEN};margin-top:2px">garante 4 🪙</div>` : `<div style="height:12px"></div>`}
  </div>`

const caixaContrato = inner => `
  <div style="border:3.5px solid ${INK};border-radius:18px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden">
    <div style="background:linear-gradient(150deg,#2B2B2B,${INK});padding:9px 12px;display:flex;align-items:center;justify-content:space-between">
      <span style="${OSW};font-size:13px;color:${GOLD}">🤝 PATROCÍNIO DA TEMPORADA</span>
      <span style="font-family:system-ui;font-size:8.5px;font-weight:800;color:rgba(255,255,255,.55)">SÉRIE D</span>
    </div>
    ${inner}
  </div>`

const btnComecar = on => `
  <div style="margin-top:11px;border:3px solid ${INK};border-radius:13px;background:${on ? GREEN : '#cfc6ae'};
    box-shadow:${on ? `3px 3px 0 ${INK}` : 'none'};padding:11px;text-align:center;${OSW};font-size:15px;color:${on ? '#fff' : 'rgba(0,0,0,.45)'}">
    ${on ? '▶️ Começar a temporada' : '🤝 Escolha o patrocínio aí em cima'}</div>`

const PASSO1 = `${cab}<div style="padding:11px">
  ${faixa}
  ${caixaContrato(`<div style="padding:12px 11px 11px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <span style="${OSW};font-size:10px;background:${INK};color:#fff;border-radius:999px;padding:2px 8px">PASSO 1</span>
      <span style="${OSW};font-size:12.5px">Onde você quer chegar?</span>
    </div>
    ${fichas(0)}
    <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);text-align:center;line-height:1.35">Quanto mais alto você mira, mais o patrocínio paga — mas só paga se você <b>bater</b> a meta.</div>
  </div>`)}
  ${btnComecar(false)}
</div>`

const PASSO2 = `${cab}<div style="padding:11px">
  ${faixa}
  ${caixaContrato(`<div style="padding:12px 11px 11px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <span style="${OSW};font-size:10px;background:${INK};color:#fff;border-radius:999px;padding:2px 8px">PASSO 1</span>
      <span style="${OSW};font-size:12.5px">Onde você quer chegar?</span>
      <span style="margin-left:auto;${OSW};font-size:11px;color:${GREEN}">✓</span>
    </div>
    ${fichas(1)}
    <div style="border-top:2px dashed rgba(12,12,12,.18);margin:0 -11px 10px"></div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <span style="${OSW};font-size:10px;background:${INK};color:#fff;border-radius:999px;padding:2px 8px">PASSO 2</span>
      <span style="${OSW};font-size:12.5px">Quem estampa a camisa?</span>
    </div>
    <div style="display:flex;gap:7px">
      ${marca('Padaria do Zé', '🥖', '', false, false)}
      ${marca('Açougue Bom Corte', '🥩', '', false, false)}
      ${marca('Max Joias', '💍', L_MAX, true, false)}
    </div>
    <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:${GREEN};text-align:center;margin-top:9px;line-height:1.35">🎖️ A <b>Max Joias</b> quer continuar com você: escolhendo ela, mesmo sem bater a meta você leva <b>4 🪙</b>.</div>
  </div>`)}
  ${btnComecar(false)}
</div>`

const FECHADO = `${cab}<div style="padding:11px">
  ${faixa}
  ${caixaContrato(`<div style="padding:12px 11px 11px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <span style="${OSW};font-size:10px;background:${INK};color:#fff;border-radius:999px;padding:2px 8px">PASSO 1</span>
      <span style="${OSW};font-size:12.5px">Onde você quer chegar?</span>
      <span style="margin-left:auto;${OSW};font-size:11px;color:${GREEN}">✓</span>
    </div>
    ${fichas(1)}
    <div style="border-top:2px dashed rgba(12,12,12,.18);margin:0 -11px 10px"></div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <span style="${OSW};font-size:10px;background:${INK};color:#fff;border-radius:999px;padding:2px 8px">PASSO 2</span>
      <span style="${OSW};font-size:12.5px">Quem estampa a camisa?</span>
      <span style="margin-left:auto;${OSW};font-size:11px;color:${GREEN}">✓</span>
    </div>
    <div style="display:flex;gap:7px">
      ${marca('Padaria do Zé', '🥖', '', false, false)}
      ${marca('Açougue Bom Corte', '🥩', '', false, false)}
      ${marca('Max Joias', '💍', L_MAX, true, true)}
    </div>
  </div>
  <div style="position:relative;background:#E6F3EA;border-top:3px solid ${INK};padding:10px 12px;display:flex;align-items:center;gap:9px">
    <span style="font-size:19px">🛡️</span>
    <div style="flex:1;min-width:0">
      <div style="${OSW};font-size:12px;line-height:1.1">Contrato fechado com a Max Joias</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55)">Não cair de divisão · vale a temporada inteira</div>
    </div>
    <span style="${OSW};font-size:14px;background:${GREEN};color:#fff;border:2.5px solid ${INK};border-radius:9px;padding:4px 10px;white-space:nowrap">+4 🪙</span>
    <div style="position:absolute;top:-13px;right:14px;transform:rotate(-9deg);${OSW};font-size:12px;color:${RED};
      border:3px solid ${RED};border-radius:8px;padding:2px 9px;background:rgba(255,255,255,.85);letter-spacing:.06em">ASSINADO</div>
  </div>`)}
  <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45);text-align:center;margin-top:8px">Quanto paga em cada divisão? Está na aba <b>🏟️ Clube › 🤝 Patrocínio</b>.</div>
  ${btnComecar(true)}
</div>`

// ── onde a tabela vai morar agora: aba Clube › Patrocínio ──────────────────
const ABA = `
  <div style="background:${INK};padding:9px 12px;color:#fff;${OSW};font-size:12px">🏟️ CLUBE</div>
  <div style="padding:11px">
    <div style="display:flex;gap:5px;margin-bottom:11px">
      ${[['🏗️', 'Estrutura', 0], ['💰', 'Finanças', 0], ['🤝', 'Patrocínio', 1]].map(([i, t, on]) => `
        <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:${on ? '#7C3AED' : '#fff'};color:${on ? '#fff' : INK};
          box-shadow:2px 2px 0 ${INK};padding:7px 2px;text-align:center;${OSW};font-size:10px;text-transform:uppercase">${i} ${t}</div>`).join('')}
    </div>
    <div style="border:3px solid ${INK};border-radius:15px;background:#fff;box-shadow:3px 3px 0 ${INK};overflow:hidden;margin-bottom:10px">
      <div style="background:#E6F3EA;padding:9px 11px;display:flex;align-items:center;gap:8px;border-bottom:2.5px solid ${INK}">
        <span style="font-size:17px">🛡️</span>
        <div style="flex:1"><div style="${OSW};font-size:11.5px;line-height:1.1">Patrocínio desta temporada</div>
        <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55)">Max Joias · não cair de divisão</div></div>
        <span style="${OSW};font-size:12.5px;background:${GREEN};color:#fff;border:2px solid ${INK};border-radius:8px;padding:3px 9px">+4 🪙</span>
      </div>
      <div style="padding:10px 11px">
        <div style="${OSW};font-size:10px;color:rgba(0,0,0,.5);letter-spacing:.05em;margin-bottom:6px">QUANTO PAGA EM CADA DIVISÃO</div>
        <div style="font-family:system-ui;font-size:10px;font-weight:700">
          <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:4px;color:rgba(0,0,0,.45);font-size:8.5px;text-transform:uppercase"><span>Divisão</span><span style="text-align:center">🛡️ Não cair</span><span style="text-align:center">📈 Top 4</span><span style="text-align:center">👑 Campeão</span></div>
          ${[['🌱 Várzea', 2, 4, 6], ['Série D', 4, 8, 12], ['Série C', 8, 16, 24], ['Série B', 16, 32, 48], ['Série A', 32, 64, 96]]
            .map(r => `<div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:4px;padding:4px 0;border-top:1px solid rgba(0,0,0,.08);${r[0] === 'Série D' ? `background:#FFF6DE` : ''}"><span>${r[0]}</span><span style="text-align:center">${r[1]}</span><span style="text-align:center">${r[2]}</span><span style="text-align:center">${r[3]}</span></div>`).join('')}
        </div>
        <div style="margin-top:9px;background:#FBF6E9;border:2px solid rgba(12,12,12,.15);border-radius:10px;padding:8px 9px;font-family:system-ui;font-size:9.5px;font-weight:600;line-height:1.45">
          <b>Como funciona:</b> dobra a cada divisão que você sobe. Ficou <b>aquém</b> da meta (apostou "não cair" e caiu)? Não paga nada.
          <b>Superou</b> a meta (apostou "não cair" e foi campeão)? Paga só o que você apostou — mirou baixo, levou baixo.
          <b>Fidelidade:</b> acertou com uma marca e repetiu ela? Ela garante o mínimo mesmo se você não bater.
        </div>
      </div>
    </div>
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 38px;font-family:system-ui}</style>
<body>
  <div style="${OSW};font-size:31px;text-transform:uppercase">🤝 A hora do patrocínio — proposta</div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:5px 0 26px;max-width:1080px;line-height:1.5">
    Você tem razão: hoje são <b>5 quadros grandes, 9 botões e uma tabela</b> antes de conseguir apertar "Começar a temporada" —
    e tudo com o mesmo peso, então nada grita "é AQUI que você decide". A proposta é virar <b>um contrato só, de dois toques</b>.
  </div>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;margin-bottom:32px">
    ${fone(HOJE, '① Como está hoje', RED, 'Rola, rola, rola… 5 quadros + 9 marcas + a tabela. Quem entrou pra jogar bola desiste antes de escolher.')}
    ${fone(PASSO1, '② Proposta · passo 1', GREEN, 'Um quadro. A pergunta é uma só: <b>onde você quer chegar?</b> O valor é o herói, a explicação é uma linha.')}
    ${fone(PASSO2, '③ Proposta · passo 2', GREEN, 'Escolheu a meta → aparecem só as <b>3 marcas daquele nível</b>. A fidelidade vira um selo 🎖️ dentro do botão.')}
    ${fone(FECHADO, '④ Proposta · fechado', GREEN, 'Carimbo <b>ASSINADO</b>, a faixa verde resume o combinado e o botão verde acende. Fim.')}
  </div>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;margin-bottom:30px">
    ${fone(ABA, '⑤ Onde a tabela vai morar', '#7C3AED', 'A régua de valores <b>sai do início da temporada</b> e vai pra aba 🤝 Patrocínio, que já existe — junto com as regras miúdas. Quem quiser ver, vê; quem quer jogar, joga.')}
    <div style="flex:1;min-width:420px;max-width:640px">
      ${bloco('📉 O que sai da frente do jogador', '#FFF6D6', `
        · o quadro gigante do resultado passado → vira <b>uma faixa fina</b>;<br>
        · o banner inteiro de fidelidade → vira um <b>selo 🎖️ dentro da marca</b>;<br>
        · <b>9 botões de marca → 3</b> (só as do nível que você escolheu);<br>
        · a <b>tabela de valores</b> e os 2 parágrafos cinzas → mudam pra aba 🤝 Patrocínio.<br><br>
        Resultado: de <b>~5 telas de rolagem</b> pra <b>uma tela só</b>.`)}
      ${bloco('✨ Por que deixa de ser "morto"', '#EAF3FF', `
        Hoje tudo é branco com borda preta — nada tem hierarquia. Na proposta a <b>meta escolhida acende</b> na cor dela
        (azul / amarelo / dourado), o valor vira <b>número grande</b>, e o fechamento ganha o <b>carimbo ASSINADO</b>.
        É a mesma paleta do jogo — creme, borda preta, sombra dura, Oswald. Não inventei arte nova.`)}
      ${bloco('🛡️ O que NÃO muda', '#F1EDE0', `
        Os <b>valores são exatamente os mesmos</b> (2/4/6 · 4/8/12 · 8/16/24 · 16/32/48 · 32/64/96), as <b>9 marcas
        continuam todas</b> — inclusive Max Joias, Vadico, ERO e Rei das Tintas —, a regra de fidelidade é a mesma
        e o motor da carreira <b>não é tocado</b>. É só arrumação de tela.<br><br>
        E dá pra <b>voltar atrás</b>: é um commit isolado, revertível em 2 minutos.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-patroc-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1720, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
