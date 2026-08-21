// ─── 🏛️ MOCKUP: A SALA DO PRESIDENTE ───────────────────────────────────────
//
// Retomada do que ficou PARADO em 16/08 (*"eu falei pra não fazer isso agora,
// falar que fazemos depois… deixa salvo aí"*), agora com o pedido novo do Diego
// (21/08): *"quero q a sala fosse algo tb pessoal do presidente e do usuário"*.
//
// 🔢 MEDIDO NO BANCO ANTES DE DESENHAR (é o que decide o que entra):
//   7.564 contas · 3.072 com carreira · 4.700 com carta no álbum
//   27 sócios · 68 linhas de nome batizado · **56 com time de coração**
// Ou seja: dá pra encher a sala pra MILHARES usando o que o jogo já sabe.
// O time de coração, hoje, serviria pra 0,7% — por isso ele entra como
// DECORAÇÃO (as cores) + CONVITE, nunca como o assunto principal.
//
// 🚫 O QUE FICOU DE FORA, E POR QUÊ (pedido dele de tabela/jogo ao vivo do time
// real): a regra da casa, escrita em `coracao.ts` e `manto.ts`, diz que **nome
// de clube real NUNCA aparece dentro do jogo — só as CORES**. Placar ao vivo
// quebraria isso, e ainda traria escudo de marca registrada + dependência de um
// serviço de fora que pode cair. Vira um segundo produto pra manter.
//
// 🚫 NÃO REAPRESENTADOS (lista de descartados do Diego, 08/08 — "N gostei nda
// disso"): recado do presidente · faixa da torcida · placas · aniversário ·
// pacote coração (manto / carteirinha-coração / escudo-com-alma).
//
//   node scripts/mockup-sala-presidente.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'sala-presidente.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
// cores do "coração" do exemplo (Vasco: preto e branco) — SÓ as cores, sem nome
const CO1 = '#0C0C0C', CO2 = '#FFFFFF'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:56px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const quadro = (inner, bg = '#fff', mb = 10) =>
  `<div style="border:3px solid ${INK};border-radius:15px;background:${bg};box-shadow:3px 3px 0 ${INK};margin:0 0 ${mb}px;overflow:hidden">${inner}</div>`
const rot = t => `<div style="${OSW};text-transform:uppercase;font-size:9.5px;letter-spacing:.09em;opacity:.5;margin:0 0 7px">${t}</div>`
const selo = t => `<span style="${OSW};font-size:8px;letter-spacing:.07em;background:${INK};color:${GOLD};border-radius:5px;padding:2px 6px;white-space:nowrap">${t}</span>`

// escudo do clube (no jogo é a arte do batismo, ou o desenho padrão)
const escudo = (s, c1 = '#C2452F', c2 = '#1B2A5B', L = 'N') => `
  <svg width="${s}" height="${Math.round(s * 1.09)}" viewBox="0 0 64 70" style="flex:none;display:block">
    <path d="M32 2 L60 12 V38 C60 54 46 64 32 68 C18 64 4 54 4 38 V12 Z" fill="${c2}" stroke="${INK}" stroke-width="4"/>
    <path d="M32 2 L60 12 V38 C60 54 46 64 32 68 Z" fill="${c1}"/>
    <text x="32" y="47" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="30" fill="#fff">${L}</text>
  </svg>`

// o presidente: silhueta de terno, com a gravata na cor do TIER
const presidente = (s, tier = GOLD) => `
  <svg width="${s}" height="${s}" viewBox="0 0 80 80" style="display:block">
    <circle cx="40" cy="40" r="37" fill="#EFE6CF" stroke="${INK}" stroke-width="4"/>
    <circle cx="40" cy="30" r="13" fill="#D9C9A6" stroke="${INK}" stroke-width="3.5"/>
    <path d="M18 74 C18 58 28 50 40 50 C52 50 62 58 62 74 Z" fill="${INK}"/>
    <path d="M40 50 L33 74 H47 Z" fill="#fff"/>
    <path d="M40 52 L36 60 L40 74 L44 60 Z" fill="${tier}" stroke="${INK}" stroke-width="1.5"/>
  </svg>`

// ── ① O RETRATO DE POSSE + números do mandato ──────────────────────────────
const TOPO = `
  <div style="background:${INK};padding:10px 13px;color:#fff;display:flex;align-items:center;justify-content:space-between">
    <span style="${OSW};font-size:13px">🏟️ CLUBE</span>
    <span style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(255,255,255,.5)">NEYMARZETTI · SÉRIE C</span>
  </div>
  <div style="display:flex;gap:6px;padding:9px 11px 11px;background:${CREME};border-bottom:2.5px solid rgba(12,12,12,.16)">
    ${[['🏗️', 'Estrutura', 0], ['💰', 'Finanças', 0], ['🏛️', 'Presidência', 1]].map(([i, t, on]) => `
      <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:${on ? PURPLE : '#fff'};color:${on ? '#fff' : INK};
        box-shadow:2px 2px 0 ${INK};padding:8px 2px;text-align:center;${OSW};font-size:10px;text-transform:uppercase">${i} ${t}</div>`).join('')}
  </div>
  <div style="padding:11px">
    ${quadro(`
      <!-- faixa nas CORES do coração (sem nome, sem escudo real) -->
      <div style="height:9px;background:repeating-linear-gradient(90deg,${CO1} 0 14px,${CO2} 14px 28px);border-bottom:3px solid ${INK}"></div>
      <div style="padding:13px 13px 11px;text-align:center;background:linear-gradient(180deg,#FBF6E9,#fff)">
        <div style="display:flex;justify-content:center;align-items:flex-end;gap:10px">
          ${presidente(74)}
          <div style="padding-bottom:5px">${escudo(40)}</div>
        </div>
        <div style="${OSW};font-size:19px;margin-top:8px;line-height:1.05">Diego</div>
        <div style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);margin-top:2px">Presidente do <b>Neymarzetti</b> desde 27/07/2026</div>
        <div style="display:flex;justify-content:center;gap:5px;margin-top:8px;flex-wrap:wrap">
          <span style="${OSW};font-size:9.5px;border:2px solid ${INK};border-radius:999px;padding:2px 9px;background:${GOLD}">👑 LENDA</span>
          <span style="${OSW};font-size:9.5px;border:2px solid ${INK};border-radius:999px;padding:2px 9px;background:#fff">SÓCIO Nº 1</span>
          <span style="${OSW};font-size:9.5px;border:2px solid ${INK};border-radius:999px;padding:2px 9px;background:#fff">FUNDADOR Nº 1</span>
        </div>
      </div>`)}

    ${quadro(`<div style="padding:11px 12px">
      ${rot('Os números do mandato')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
        ${[['🗓️', '12', 'temporadas no cargo'], ['🏆', '3', 'títulos'], ['🔨', '146', 'contratados no martelo'], ['🪙', '8.240', 'passaram pelo caixa']].map(n => `
          <div style="border:2.5px solid ${INK};border-radius:11px;background:#FBF6E9;padding:8px 9px">
            <div style="font-size:15px;line-height:1">${n[0]}</div>
            <div style="${OSW};font-size:19px;line-height:1;margin-top:2px">${n[1]}</div>
            <div style="font-family:system-ui;font-size:8.5px;font-weight:700;color:rgba(0,0,0,.5);margin-top:1px">${n[2]}</div>
          </div>`).join('')}
      </div>
    </div>`)}

    ${quadro(`<div style="padding:11px 12px">
      ${rot('📜 A linha do mandato')}
      <div style="position:relative;padding-left:14px">
        <div style="position:absolute;left:4px;top:4px;bottom:4px;width:3px;background:rgba(12,12,12,.15);border-radius:2px"></div>
        ${[['T1', 'Assumiu na Várzea', '#8a7d59'], ['T3', 'Subiu pra Série D', GREEN], ['T7', 'CAMPEÃO da Série D', GOLD], ['T9', 'Caiu pra Série D', RED], ['T12', 'Subiu pra Série C', GREEN]].map(l => `
          <div style="display:flex;align-items:center;gap:9px;padding:4px 0;position:relative">
            <span style="position:absolute;left:-13px;width:9px;height:9px;border-radius:999px;background:${l[2]};border:2px solid ${INK}"></span>
            <span style="${OSW};font-size:11px;width:26px;color:rgba(0,0,0,.45)">${l[0]}</span>
            <span style="${OSW};font-size:12px">${l[1]}</span>
          </div>`).join('')}
      </div>
      <div style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.4);margin-top:7px">Sai do seu save — cada presidente tem uma história diferente.</div>
    </div>`, '#fff', 0)}
  </div>`

// ── ② O RESTO DA SALA ──────────────────────────────────────────────────────
const RESTO = `
  <div style="background:${INK};padding:10px 13px;color:#fff;${OSW};font-size:13px">🏛️ PRESIDÊNCIA</div>
  <div style="padding:11px">
    ${quadro(`<div style="padding:11px 12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        ${rot('🎩 Seu técnico').replace('margin:0 0 7px', 'margin:0')}
        ${selo('EM BREVE')}
      </div>
      <div style="display:flex;align-items:center;gap:11px;opacity:.55">
        <span style="width:44px;height:44px;border:2.5px solid ${INK};border-radius:11px;background:#EFE6CF;display:flex;align-items:center;justify-content:center;font-size:22px">🎩</span>
        <div><div style="${OSW};font-size:13px">Contratar um técnico</div>
        <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5)">Cada um com um jeito de jogar. Demitir também é com você.</div></div>
      </div>
    </div>`)}

    ${quadro(`<div style="padding:11px 12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        ${rot('🚗 A garagem').replace('margin:0 0 7px', 'margin:0')}
        ${selo('EM BREVE')}
      </div>
      <div style="display:flex;align-items:center;gap:11px;opacity:.55">
        <span style="width:44px;height:44px;border:2.5px solid ${INK};border-radius:11px;background:#EFE6CF;display:flex;align-items:center;justify-content:center;font-size:22px">🚗</span>
        <div><div style="${OSW};font-size:13px">O carro do presidente</div>
        <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5)">Cresce junto com o patrimônio do clube. Fusca hoje, importado depois.</div></div>
      </div>
    </div>`)}

    ${quadro(`<div style="padding:11px 12px">
      ${rot('🏆 Sala de troféus')}
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${[['🏆', 'Série D', GOLD], ['🏆', 'Série D', GOLD], ['🥇', 'Copa BR', '#CFE8FB'], ['🎖️', 'Supercopa', '#F5D0E8']].map(t => `
          <div style="flex:1;min-width:70px;border:2.5px solid ${INK};border-radius:11px;background:${t[2]};padding:8px 4px;text-align:center">
            <div style="font-size:19px;line-height:1">${t[0]}</div>
            <div style="${OSW};font-size:9.5px;margin-top:3px">${t[1]}</div></div>`).join('')}
        <div style="flex:1;min-width:70px;border:2.5px dashed rgba(12,12,12,.28);border-radius:11px;padding:8px 4px;text-align:center;opacity:.55">
          <div style="font-size:19px;line-height:1">🫙</div>
          <div style="${OSW};font-size:9.5px;margin-top:3px">vazio</div></div>
      </div>
    </div>`)}

    ${quadro(`<div style="padding:11px 12px">
      ${rot('💼 Patrimônio do clube')}
      ${[['🏟️', 'Estádio', '18.400 lugares', '4.100 🪙'], ['💼', 'SAF', 'Skyy FC (50%)', '1.200 🪙'], ['👥', 'Elenco', '22 jogadores', '2.940 🪙']].map((l, i, a) => `
        <div style="display:flex;align-items:center;gap:9px;padding:7px 0;${i < a.length - 1 ? 'border-bottom:1.5px solid rgba(12,12,12,.10)' : ''}">
          <span style="font-size:15px">${l[0]}</span>
          <div style="flex:1"><div style="${OSW};font-size:11.5px;line-height:1.15">${l[1]}</div>
          <div style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.48)">${l[2]}</div></div>
          <span style="${OSW};font-size:11.5px">${l[3]}</span></div>`).join('')}
      <div style="display:flex;justify-content:space-between;border-top:2.5px solid ${INK};margin-top:6px;padding-top:6px;${OSW};font-size:13px">
        <span>TOTAL</span><span style="color:${GREEN}">8.240 🪙</span></div>
    </div>`)}

    <!-- ❤️ o coração: só as CORES + o convite pra quem não disse -->
    ${quadro(`
      <div style="height:8px;background:repeating-linear-gradient(90deg,${CO1} 0 12px,${CO2} 12px 24px);border-bottom:3px solid ${INK}"></div>
      <div style="padding:11px 12px">
        ${rot('❤️ A sua sala')}
        <div style="font-family:system-ui;font-size:11px;font-weight:600;line-height:1.5">
          A faixa da sala está nas <b>suas duas cores</b>. Trocar de time do coração é aqui.
        </div>
        <div style="margin-top:8px;border:2.5px solid ${INK};border-radius:10px;background:#FBF6E9;padding:7px;text-align:center;${OSW};font-size:11px">🎨 Trocar as cores da sala</div>
      </div>`, '#fff', 0)}
  </div>`

// ── ③ QUEM AINDA NÃO DISSE O TIME ──────────────────────────────────────────
const CONVITE = `
  <div style="background:${INK};padding:10px 13px;color:#fff;${OSW};font-size:13px">🏛️ PRESIDÊNCIA</div>
  <div style="padding:11px">
    ${quadro(`
      <div style="height:9px;background:repeating-linear-gradient(90deg,#cfc6ae 0 14px,#e8e0cc 14px 28px);border-bottom:3px solid ${INK}"></div>
      <div style="padding:13px 13px 11px;text-align:center;background:linear-gradient(180deg,#FBF6E9,#fff)">
        <div style="display:flex;justify-content:center;align-items:flex-end;gap:10px">
          ${presidente(74, '#cfc6ae')}
          <div style="padding-bottom:5px">${escudo(40, '#8a8a8a', '#5a5a5a', 'M')}</div>
        </div>
        <div style="${OSW};font-size:19px;margin-top:8px;line-height:1.05">Murriz FC</div>
        <div style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);margin-top:2px">Presidente desde 12/08/2026</div>
      </div>`)}
    ${quadro(`<div style="padding:12px">
      <div style="${OSW};font-size:14px;text-align:center;line-height:1.15">❤️ De que time você torce?</div>
      <div style="font-family:system-ui;font-size:10.5px;font-weight:600;color:rgba(0,0,0,.6);text-align:center;margin-top:4px;line-height:1.45">
        A sala fica nas <b>suas cores</b>. Só as cores — o jogo não usa nome nem escudo de clube de verdade.
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px">
        ${[['#C2001E', '#0C0C0C'], ['#0C0C0C', '#FFFFFF'], ['#1B7A3D', '#FFFFFF'], ['#C2001E', '#FFFFFF'], ['#8B1A3A', '#1B7A3D'], ['#2E6FB0', '#FFFFFF']].map(c => `
          <div style="width:42px;height:30px;border:2.5px solid ${INK};border-radius:8px;box-shadow:2px 2px 0 ${INK};
            background:repeating-linear-gradient(90deg,${c[0]} 0 7px,${c[1]} 7px 14px)"></div>`).join('')}
      </div>
      <div style="margin-top:11px;border:3px solid ${INK};border-radius:11px;background:${GREEN};color:#fff;padding:9px;text-align:center;${OSW};font-size:13px;box-shadow:3px 3px 0 ${INK}">Escolher meu time</div>
      <div style="font-family:system-ui;font-size:9px;font-weight:700;color:rgba(0,0,0,.4);text-align:center;margin-top:6px">ou <b>deixar pra depois</b> — a sala funciona igual</div>
    </div>`, '#fff', 0)}
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const linhaFonte = (peca, fonte, quantos, cor) => `
  <tr style="border-top:1.5px solid rgba(12,12,12,.12)">
    <td style="padding:7px 8px;${OSW};font-size:12px">${peca}</td>
    <td style="padding:7px 8px;font-family:system-ui;font-size:11px;font-weight:600;color:rgba(0,0,0,.6)">${fonte}</td>
    <td style="padding:7px 8px;${OSW};font-size:12.5px;color:${cor};text-align:right;white-space:nowrap">${quantos}</td>
  </tr>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🏛️ MOCKUP · SALA DO PRESIDENTE</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:44px;margin:14px 0 6px;line-height:1">
    A SALA É <span style="color:${RED}">SUA</span>, NÃO DO JOGO</h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1080px;line-height:1.5;margin:0 0 24px">
    Você pediu que ela fosse pessoal. Então tudo que está aqui dentro é <b>seu</b> — o retrato, os números do
    mandato, a sua história temporada por temporada, seus troféus, seu patrimônio. Nada é enfeite genérico.
  </p>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:28px">
    ${fone(TOPO, '① O retrato e o mandato', PURPLE, 'Você de terno com a gravata na cor do seu tier, o escudo do clube, e desde quando é presidente. Embaixo, os números do mandato e <b>a sua história</b>: subiu, caiu, foi campeão.')}
    ${fone(RESTO, '② O resto da sala', PURPLE, 'Técnico e garagem com o selo <b>EM BREVE</b> (como você já aprovou), a sala de troféus com as vagas vazias à mostra, o patrimônio somado e a faixa nas cores do seu coração.')}
    ${fone(CONVITE, '③ Quem ainda não disse o time', '#2E6FB0', 'A sala funciona igual, só sem cor. E é <b>aqui</b> que o jogo pergunta o time de coração — hoje só <b>56 de 7.564</b> contas responderam, porque isso só é perguntado no cadastro novo.')}
    <div style="flex:1;min-width:420px">
      ${bloco('🔢 De onde vem cada peça — e pra quantos funciona', '#EAF3FF', `
        Medi no banco antes de desenhar. A sala <b>não fica vazia</b>:
        <table style="width:100%;border-collapse:collapse;margin-top:9px">
          <tr><th style="text-align:left;padding:4px 8px;${OSW};font-size:9.5px;opacity:.5;text-transform:uppercase">Peça</th>
              <th style="text-align:left;padding:4px 8px;${OSW};font-size:9.5px;opacity:.5;text-transform:uppercase">Vem de</th>
              <th style="text-align:right;padding:4px 8px;${OSW};font-size:9.5px;opacity:.5;text-transform:uppercase">Gente</th></tr>
          ${linhaFonte('Retrato + desde quando', 'a própria conta', '7.564', GREEN)}
          ${linhaFonte('Números do mandato', 'o save da carreira', '3.072', GREEN)}
          ${linhaFonte('Linha do mandato', 'o save da carreira', '3.072', GREEN)}
          ${linhaFonte('Sala de troféus', 'títulos + álbum', '4.700', GREEN)}
          ${linhaFonte('Patrimônio', 'estádio + SAF + elenco', '3.072', GREEN)}
          ${linhaFonte('Escudo do batismo', 'esc_socios', '27', '#8a7d59')}
          ${linhaFonte('Cores do coração', 'cadastro', '56', RED)}
        </table>
        <p style="margin:10px 0 0;font-size:12px">Por isso o coração entra como <b>decoração + convite</b>, e não como o assunto da sala. Se ele
        fosse o centro, <b>99,3%</b> abriria uma sala vazia. Com o convite aqui dentro, esse número cresce sozinho.</p>`)}
    </div>
  </div>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:1;min-width:430px">
      ${bloco('🚫 Por que a tabela ao vivo do seu time NÃO entra', '#FBE7E3', `
        <b>1. É uma regra sua, já escrita no código.</b> Em <code>coracao.ts</code> e <code>manto.ts</code>:
        <i>"nome de clube real NUNCA aparece dentro do jogo — só as CORES"</i>. Um placar ao vivo quebra isso de frente,
        e escudo de clube real é marca registrada.<br><br>
        <b>2. Você passaria a manter um placar do futebol brasileiro.</b> API de fora (paga, cai, muda sem avisar),
        tabela que precisa estar certa senão o cara reclama. É um <b>segundo produto</b> — e quando a API cair,
        quem apanha é o Leilão Legends.<br><br>
        <b>3. E não é o que deixa a sala pessoal.</b> A tabela do Flamengo é igual pra 40 milhões de pessoas.
        <b>A sua história de 12 temporadas é só sua.</b> É aí que mora o pessoal de verdade.`)}
      ${bloco('🚫 O que eu NÃO trouxe de volta', '#F1EDE0', `
        Da sua lista de descartados (08/08 — <i>"N gostei nda disso"</i>): <b>recado do presidente</b>,
        <b>faixa da torcida</b>, <b>placas</b>, <b>aniversário</b> e o <b>pacote coração</b> (manto /
        carteirinha-coração / escudo-com-alma).<br><br>
        Estão anotados nas pendências como "não reapresentar" — não vou te oferecer isso de novo.`)}
    </div>
    <div style="flex:1;min-width:430px">
      ${bloco('🧱 O que dá pra fazer JÁ e o que é depois', '#FFF6D6', `
        <b>Já (tudo sai do save, zero dependência de fora):</b> o retrato de posse · os números do mandato ·
        a linha do mandato · a sala de troféus · o patrimônio · a faixa nas cores + o convite do coração.<br><br>
        <b>Depois, com selo EM BREVE na tela (como você aprovou):</b> o 🎩 técnico e a 🚗 garagem — são features
        com regra de jogo, e cada uma é uma entrega inteira.<br><br>
        A parte "já" é <b>só leitura</b>: não muda nenhuma regra, nenhum número, nenhum save. É uma tela que
        <b>conta</b> o que você já fez.`)}
      ${bloco('🙋 A decisão que ainda falta (de 16/08)', '#E6F3EA', `
        <b>São 3 ou 4 sub-abas no Clube?</b><br><br>
        Hoje são 3: Estrutura · Finanças · Patrocínio. Com a Presidência ficam 4.<br><br>
        <b>Minha recomendação continua sendo 3</b>, com a <b>Presidência engolindo o Patrocínio</b> — fechar
        patrocínio é trabalho de presidente, e 4 pílulas ficam apertadas no celular. Mas quem decide é você.<br><br>
        (No mockup desenhei com 3, já com a Presidência no lugar do Patrocínio.)`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-sala-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1720, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
