// ─── 🎩 SALA DA PRESIDÊNCIA · V2 (Diego 24/08) ──────────────────────────────
//
// Pedido dele: *"Sim quero.. E q vai ter carros Tb em breve e técnicos em breve..
// E veja se alguma aba ou sub entra dentro Tb ou n"* — depois da conversa
// "o usuário é o PRESIDENTE (não o técnico), mas escala o time mesmo assim":
// a ficção assumida é o presidente brasileiro mão-na-massa, que manda em tudo.
//
// O que este mockup junta (nada aqui é invenção nova):
//   · a base que ele APROVOU em 16/08 (mockup-presidencia-v1.mjs): frase "você é
//     o dono", 🎩 Técnico e 🚗 Garagem com selo EM BREVE, patrimônio, estante;
//   · as peças pessoais de 21/08: retrato de posse + números + linha do mandato;
//   · a RESPOSTA da análise (CORRIGIDA 24/08 — o Diego pegou o erro: *"agência
//     hj nova fica ao lado da aba de elenco"*): na Agência 2.0 a sub-aba 💼 SOME
//     do Clube (mora em Elenco › 🕴️ Agenciados, filtro `agenciaOk` na linha das
//     pílulas), então o Clube hoje tem SÓ 3 pílulas. Uma 4ª até caberia — mas a
//     recomendação segue a de 16/08: a Presidência ENGOLE o Patrocínio (fechar
//     contrato e Rede Martelo TV é trabalho de presidente) e a fileira fica em
//     3. Estrutura e Finanças FICAM (estádio primeiro — regra sagrada). Só nos
//     saves ANTIGOS (agência clássica) a fileira segue com 4, com o 💼 no fim.
//
//   node scripts/mockup-sala-presidente-v2.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'sala-presidente-v2.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CO1 = '#0C0C0C', CO2 = '#FFFFFF'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 376px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:48px">${nota}</div>
  <div style="width:376px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

// linha de sub-abas: hoje × proposta (a Presidência no LUGAR do Patrocínio)
const pilulas = (abas, ativa) => `
  <div style="display:flex;gap:5px;padding:9px 10px 11px;background:${CREME};border-bottom:2.5px solid rgba(12,12,12,.16)">
    ${abas.map(([i, t]) => `
      <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:${t === ativa ? PURPLE : '#fff'};color:${t === ativa ? '#fff' : INK};
        box-shadow:2px 2px 0 ${INK};padding:7px 1px;text-align:center;${OSW};font-size:9px;text-transform:uppercase">${i} ${t}</div>`).join('')}
  </div>`
const cabecinha = `
  <div style="background:${INK};padding:10px 13px;color:#fff;display:flex;align-items:center;justify-content:space-between">
    <span style="${OSW};font-size:13px">🏟️ CLUBE</span>
    <span style="font-family:system-ui;font-size:9px;font-weight:800;color:rgba(255,255,255,.5)">NEYMARZETTI · SÉRIE C</span>
  </div>`

const emBreve = (ic, titulo, texto) => `
  <div style="${box('#EFEADA')};padding:12px;margin-bottom:10px;display:flex;gap:11px;align-items:flex-start">
    <span style="font-size:30px;line-height:1;flex:none;filter:grayscale(.35)">${ic}</span>
    <div style="min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <p style="${OSW};font-size:14.5px;margin:0;text-transform:uppercase">${titulo}</p>
        <span style="font-size:9px;${OSW};text-transform:uppercase;border:2px solid ${INK};border-radius:6px;padding:1px 6px;background:#EDE7FF;color:${PURPLE}">em breve</span>
      </div>
      <p style="font-family:system-ui;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:3px 0 0;line-height:1.4">${texto}</p>
    </div>
  </div>`

const linhaPat = (ic, nome, valor, obs) => `
  <div style="display:flex;align-items:center;gap:8px;border-top:1px solid rgba(0,0,0,.1);padding:7px 0">
    <span style="font-size:15px;flex:none">${ic}</span>
    <span style="flex:1;min-width:0;font-family:system-ui;font-weight:800;font-size:12.5px">${nome}${obs ? `<span style="font-weight:700;font-size:10px;color:rgba(0,0,0,.45)"> · ${obs}</span>` : ''}</span>
    <span style="${OSW};font-size:13.5px;white-space:nowrap">${valor}</span>
  </div>`

const patrimonio = `
  <div style="${box('#fff')};padding:12px;margin-bottom:10px">
    <p style="${OSW};font-size:14px;margin:0 0 1px">💰 Patrimônio do clube</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 4px">Tudo que é seu hoje, somado. Só leitura — nada aqui gasta nem rende.</p>
    ${linhaPat('🪙', 'Caixa', '626')}
    ${linhaPat('🏟️', 'Estádio', '4.100', 'o que você já investiu')}
    ${linhaPat('👥', 'Elenco', '2.940', '22 jogadores')}
    ${linhaPat('🏢', 'SAF', '1.200', 'Skyy FC')}
    <div style="display:flex;align-items:center;gap:8px;border-top:2.5px solid ${INK};margin-top:4px;padding-top:7px">
      <span style="flex:1;${OSW};font-size:13.5px;text-transform:uppercase">Patrimônio</span>
      <span style="${OSW};font-size:18px;color:${GREEN}">8.866 🪙</span>
    </div>
  </div>`

const trofeu = (label, n, bg, c) => `
  <div style="width:82px;border:2.5px solid ${INK};border-radius:12px;background:${bg};color:${c};box-shadow:3px 3px 0 ${INK};padding:10px 6px 8px;text-align:center">
    <div style="font-size:30px;line-height:1">🏆</div>
    <div style="${OSW};font-size:15px;margin-top:2px">×${n}</div>
    <div style="${OSW};font-size:9px;text-transform:uppercase;letter-spacing:.02em;margin-top:1px;opacity:.92">${label}</div>
  </div>`

const estante = `
  <div style="${box('linear-gradient(160deg,#FFF7E0,#FFEBB0)')};padding:12px;margin-bottom:10px">
    <p style="${OSW};font-size:14px;margin:0 0 2px">🏆 Hall de Troféus</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55);margin:0 0 10px">A estante do Neymarzetti — a MESMA da aba Rank, uma fonte só.</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${trofeu('Copa do Brasil', 1, '#0EA658', '#fff')}
      ${trofeu('Supercopa', 1, '#0D4FCC', '#fff')}
      ${trofeu('Série D', 2, '#CFE8FB', INK)}
      ${trofeu('Várzea', 1, '#DFF3E3', INK)}
    </div>
  </div>`

// 🤝 a mesa do patrocínio DENTRO da sala (o que muda de casa)
const mesaPatrocinio = `
  <div style="${box('#fff')};padding:12px;margin-bottom:10px;border-color:${GREEN}">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <p style="${OSW};font-size:14px;margin:0">🤝 Patrocínio da temporada</p>
      <span style="font-size:8.5px;${OSW};text-transform:uppercase;border:2px solid ${INK};border-radius:6px;padding:1px 6px;background:#DFF3E3;color:${GREEN}">mudou pra cá</span>
    </div>
    <p style="font-family:system-ui;font-size:11px;font-weight:700;color:rgba(0,0,0,.55);margin:3px 0 8px;line-height:1.4">Tudo que já existe na sub-aba Patrocínio, igualzinho — só muda de casa: fechar contrato é trabalho de presidente.</p>
    <div style="border:2.5px solid ${INK};border-radius:12px;padding:9px 11px;background:#F7FBF3;display:flex;align-items:center;gap:9px">
      <span style="font-size:22px">🥤</span>
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:12.5px;margin:0">Guaraná Gigante · meta: SUBIR</p>
        <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:1px 0 0">bateu a meta = 90 🪙 no fim da temporada</p>
      </div>
    </div>
    <div style="border:2.5px solid ${INK};border-radius:12px;padding:9px 11px;background:#FFF6D6;display:flex;align-items:center;gap:9px;margin-top:7px">
      <span style="font-size:22px">📺</span>
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:12.5px;margin:0">Rede Martelo TV · cota extra</p>
        <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:1px 0 0">1 vídeo por temporada = 10 moedas no clube</p>
      </div>
    </div>
  </div>`

const presidenteSvg = (s, tier = GOLD) => `
  <svg width="${s}" height="${s}" viewBox="0 0 80 80" style="display:block">
    <circle cx="40" cy="40" r="37" fill="#EFE6CF" stroke="${INK}" stroke-width="4"/>
    <circle cx="40" cy="30" r="13" fill="#D9C9A6" stroke="${INK}" stroke-width="3.5"/>
    <path d="M18 74 C18 58 28 50 40 50 C52 50 62 58 62 74 Z" fill="${INK}"/>
    <path d="M40 50 L33 74 H47 Z" fill="#fff"/>
    <path d="M40 52 L36 60 L40 74 L44 60 Z" fill="${tier}" stroke="${INK}" stroke-width="1.5"/>
  </svg>`

// 🛡️ escudo do batismo (placeholder do mockup — no jogo vem do .webp do dono)
const escudoSvg = (s) => `
  <svg width="${s}" height="${s}" viewBox="0 0 64 72" style="display:block">
    <path d="M32 3 L60 12 V38 C60 55 46 65 32 69 C18 65 4 55 4 38 V12 Z" fill="#1B7A3D" stroke="${INK}" stroke-width="4"/>
    <path d="M32 3 L60 12 V38 C60 55 46 65 32 69 Z" fill="#166332"/>
    <circle cx="32" cy="32" r="13" fill="${GOLD}" stroke="${INK}" stroke-width="3"/>
    <text x="32" y="38" text-anchor="middle" style="${OSW};font-size:16px" fill="${INK}">N</text>
  </svg>`
// 🎽 manto: as 2 cores medidas na arte do dono (listra em CSS, 0 KB — igual no jogo)
const mantoSvg = (s) => `
  <svg width="${s}" height="${s * 1.06}" viewBox="0 0 60 64" style="display:block">
    <defs><pattern id="lst" width="12" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
      <rect width="6" height="4" fill="#1B7A3D"/><rect x="6" width="6" height="4" fill="#FFFFFF"/></pattern></defs>
    <path d="M20 6 L8 12 L4 26 L14 29 V58 H46 V29 L56 26 L52 12 L40 6 C40 13 20 13 20 6 Z"
      fill="url(#lst)" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  </svg>`

const retrato = `
  <div style="${box('#fff')};overflow:hidden;margin-bottom:10px">
    <div style="height:8px;background:repeating-linear-gradient(90deg,${CO1} 0 12px,${CO2} 12px 24px);border-bottom:3px solid ${INK}"></div>
    <div style="padding:12px 12px 11px;display:flex;align-items:center;gap:11px;background:linear-gradient(180deg,#FBF6E9,#fff)">
      ${presidenteSvg(58)}
      <div style="min-width:0;flex:1">
        <p style="${OSW};font-size:16px;margin:0;text-transform:uppercase">🎩 Sala da Presidência</p>
        <p style="font-family:system-ui;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:2px 0 0;line-height:1.35">
          Você não é o técnico. <b style="color:${INK}">Você é o dono do Neymarzetti.</b><br>
          <span style="font-size:10px;color:rgba(0,0,0,.42)">(mas aqui presidente escala time — e quem paga, manda 😄)</span></p>
        <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.45);margin:4px 0 0">Presidente desde <b>27/07/2026</b></p>
      </div>
    </div>
    <!-- 🆕 A ARTE DO CLUBE: escudo · manto · mascote, na sala do dono -->
    <div style="display:flex;border-top:2.5px solid ${INK};background:#FBF6E9">
      ${[[escudoSvg(46), 'Escudo'], [mantoSvg(44), 'Manto'], ['<span style="font-size:42px;line-height:1">🦅</span>', 'Mascote']].map(([art, rot], i) => `
        <div style="flex:1;text-align:center;padding:9px 2px 8px;${i < 2 ? 'border-right:1.5px solid rgba(12,12,12,.12)' : ''}">
          <div style="display:flex;justify-content:center;align-items:flex-end;height:48px">${art}</div>
          <div style="${OSW};font-size:9px;text-transform:uppercase;color:rgba(0,0,0,.5);margin-top:3px">${rot}</div>
        </div>`).join('')}
    </div>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45);margin:0;padding:0 12px 9px;background:#FBF6E9;text-align:center;line-height:1.4">
      A cara do clube que <b>é sua</b> — nem a regra do barão tira. Cai de divisão? O escudo, o manto e a mascote descem junto com você.</p>
    <div style="display:flex;border-top:2.5px solid ${INK}">
      ${[['12', 'temporadas'], ['5', 'títulos'], ['146', 'contratados']].map(([n, t], i) => `
        <div style="flex:1;text-align:center;padding:8px 2px;${i < 2 ? 'border-right:1.5px solid rgba(12,12,12,.12)' : ''}">
          <div style="${OSW};font-size:17px;line-height:1">${n}</div>
          <div style="font-family:system-ui;font-size:8.5px;font-weight:700;color:rgba(0,0,0,.5);margin-top:1px">${t}</div>
        </div>`).join('')}
    </div>
  </div>`

// 🎩 O TÉCNICO, COM A ZOEIRA QUE O DIEGO PEDIU (24/08): *"tem q ser mais zueira
// sobre a formação do técnico.. Ele é técnico mas qm manda é vc algo do tipo"*.
// A piada é a mais brasileira que existe: o técnico ESCOLHE a formação dele,
// você chega e muda — e ele engole. Cada troca solta uma frase do treinador.
const tecnicoZoeira = `
  <div style="${box('#EFEADA')};padding:12px;margin-bottom:10px">
    <div style="display:flex;gap:11px;align-items:flex-start">
      <span style="font-size:30px;line-height:1;flex:none;filter:grayscale(.35)">🎩</span>
      <div style="min-width:0;flex:1">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <p style="${OSW};font-size:14.5px;margin:0;text-transform:uppercase">Técnico</p>
          <span style="font-size:9px;${OSW};text-transform:uppercase;border:2px solid ${INK};border-radius:6px;padding:1px 6px;background:#EDE7FF;color:${PURPLE}">em breve</span>
        </div>
        <p style="font-family:system-ui;font-size:11.5px;font-weight:700;color:rgba(0,0,0,.55);margin:3px 0 0;line-height:1.4">
          Contrate um treinador de verdade. Cada um tem a <b>formação preferida</b> dele e um jeito que muda
          alguma coisa em campo.</p>
      </div>
    </div>
    <div style="border:2.5px solid ${INK};border-radius:12px;background:#fff;padding:10px 11px;margin-top:10px">
      <p style="${OSW};font-size:11.5px;margin:0 0 6px;text-transform:uppercase">😂 E quem manda continua sendo você</p>
      <div style="display:flex;align-items:center;gap:7px;font-family:system-ui;font-size:11px;font-weight:700;margin-bottom:5px">
        <span style="flex:none;font-size:15px">🎩</span>
        <span style="background:#F1EDE0;border-radius:10px;padding:5px 9px;line-height:1.35">"Presidente, o 4-3-3 é o MEU esquema. Trabalhei a semana toda nele."</span>
      </div>
      <div style="display:flex;align-items:center;gap:7px;font-family:system-ui;font-size:11px;font-weight:700;justify-content:flex-end;margin-bottom:5px">
        <span style="background:${GOLD};border-radius:10px;padding:5px 9px;line-height:1.35;border:2px solid ${INK}">"Bonito. Vai de 3-5-2." 🫱</span>
        <span style="flex:none;font-size:15px">🧑‍💼</span>
      </div>
      <div style="display:flex;align-items:center;gap:7px;font-family:system-ui;font-size:11px;font-weight:700">
        <span style="flex:none;font-size:15px">🎩</span>
        <span style="background:#F1EDE0;border-radius:10px;padding:5px 9px;line-height:1.35">"3-5-2 é o meu esquema, presidente. Sempre foi." 😅</span>
      </div>
      <p style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.5);margin:9px 0 0;line-height:1.45;border-top:1.5px solid rgba(0,0,0,.1);padding-top:7px">
        A escalação <b>nunca sai da sua mão</b>. O técnico sugere, reclama e cede — e cada vez que você muda a
        formação dele, sai uma frase nova (tem umas 20, pra não repetir). Ele leva o crédito na vitória e a
        culpa na derrota, como na vida real. 😄</p>
    </div>
  </div>`

const linhaMandato = `
  <div style="${box('#fff')};padding:12px">
    <p style="${OSW};font-size:14px;margin:0 0 1px">📜 A linha do mandato</p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:0 0 8px">Sai do seu save — cada presidente tem uma história diferente.</p>
    <div style="position:relative;padding-left:14px">
      <div style="position:absolute;left:4px;top:4px;bottom:4px;width:3px;background:rgba(12,12,12,.15);border-radius:2px"></div>
      ${[['T1', 'Assumiu na Várzea', '#8a7d59'], ['T3', 'Subiu pra Série D', GREEN], ['T7', 'CAMPEÃO da Série D', GOLD], ['T12', 'Subiu pra Série C', GREEN]].map(l => `
        <div style="display:flex;align-items:center;gap:9px;padding:4px 0;position:relative">
          <span style="position:absolute;left:-13px;width:9px;height:9px;border-radius:999px;background:${l[2]};border:2px solid ${INK}"></span>
          <span style="${OSW};font-size:11px;width:26px;color:rgba(0,0,0,.45)">${l[0]}</span>
          <span style="${OSW};font-size:12px">${l[1]}</span>
        </div>`).join('')}
    </div>
  </div>`

// ── ① ONDE ENTRA: as pílulas hoje × proposta ───────────────────────────────
const ONDE = `${cabecinha}
  <div style="padding:13px 11px">
    <p style="${OSW};font-size:12px;text-transform:uppercase;margin:0 0 6px;color:rgba(0,0,0,.5)">Hoje — 3 sub-abas (a 💼 Agência mora em Elenco › 🕴️ Agenciados)</p>
    <div style="border:3px solid ${INK};border-radius:16px;overflow:hidden;background:#fff;margin-bottom:16px">
      ${pilulas([['🏗️', 'Estrutura'], ['💰', 'Finanças'], ['🤝', 'Patrocínio']], '')}
    </div>
    <p style="text-align:center;font-size:22px;margin:0 0 14px">⬇️</p>
    <p style="${OSW};font-size:12px;text-transform:uppercase;margin:0 0 6px;color:${PURPLE}">Proposta — a Presidência no LUGAR do Patrocínio</p>
    <div style="border:3px solid ${INK};border-radius:16px;overflow:hidden;background:#fff;margin-bottom:14px">
      ${pilulas([['🏗️', 'Estrutura'], ['💰', 'Finanças'], ['🎩', 'Presidência']], 'Presidência')}
    </div>
    <div style="${box('#FFF6D6')};padding:11px 12px;font-family:system-ui;font-size:11.5px;font-weight:700;line-height:1.5">
      ⚖️ <b>Com 3 pílulas, uma 4ª até CABERIA</b> (Estrutura · Finanças · Patrocínio · Presidência). Mas recomendo
      <b>engolir mesmo assim</b>: fechar patrocínio + Rede Martelo TV <b>é trabalho de presidente</b> — a mesa dele
      entra INTEIRA na sala, nada some. E a fileira fica folgada. Os atalhos que hoje abrem "Patrocínio" (banner da
      TV, recibo da temporada) passam a abrir a Presidência <b>já na mesa certa</b>.
    </div>
    <div style="${box('#EAF3FF')};padding:11px 12px;font-family:system-ui;font-size:11.5px;font-weight:700;line-height:1.5;margin-top:10px">
      🏟️ <b>O que NÃO muda de casa:</b><br>
      · <b>Estrutura</b> fica — e o desenho do estádio segue sendo a primeira coisa que aparece (regra sagrada);<br>
      · <b>Finanças</b> fica — extrato é rotina de caixa, não cerimônia;<br>
      · <b>Agência</b> não é daqui: na carreira nova ela fica em <b>Elenco › 🕴️ Agenciados</b> e não se mexe.
        Só os saves ANTIGOS (agência clássica) seguem com 4 pílulas, com o 💼 no fim — a Presidência entra no
        lugar do Patrocínio do mesmo jeito.
    </div>
  </div>`

// ── ② A SALA COMPLETA ──────────────────────────────────────────────────────
const SALA = `${cabecinha}
  ${pilulas([['🏗️', 'Estrutura'], ['💰', 'Finanças'], ['🎩', 'Presidência']], 'Presidência')}
  <div style="padding:11px">
    ${retrato}
    ${mesaPatrocinio}
    ${tecnicoZoeira}
    ${emBreve('🚗', 'Garagem do presidente', 'O carro do presidente. Clube maior, carreata melhor — e todo mundo vê o seu na hora do título.')}
    ${patrimonio}
    ${estante}
    ${linhaMandato}
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩 SALA DA PRESIDÊNCIA · V2 · 24/08</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    VOCÊ É O <span style="color:${RED}">PRESIDENTE</span> — E A SALA É SUA</h1>
  <p style="font-size:14px;font-weight:600;max-width:1080px;line-height:1.5;margin:0 0 24px">
    Tudo que você já tinha aprovado continua aqui (técnico e garagem <b>EM BREVE</b>, patrimônio, estante, retrato de posse).
    A novidade é a resposta da sua pergunta: <b>o Patrocínio entra pra dentro da sala</b> — o resto fica onde está.
  </p>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;margin-bottom:28px">
    ${fone(ONDE, '① Onde entra (corrigido)', GREEN, 'Você pegou o erro: a 💼 Agência NÃO é do Clube — na carreira nova ela fica em <b>Elenco › 🕴️ Agenciados</b>. O Clube tem 3 pílulas hoje, e a Presidência entra no lugar do Patrocínio.')}
    ${fone(SALA, '② A sala completa', PURPLE, 'De cima pra baixo: posse + <b>escudo · manto · mascote</b> · patrocínio + Rede Martelo TV · técnico EM BREVE (com a zoeira) · garagem EM BREVE · patrimônio · troféus · linha do mandato.')}
    <div style="flex:1;min-width:400px">
      ${bloco('🪑 A ficção que fecha tudo', '#E6F3EA', `
        Da nossa conversa de hoje: <b>o usuário é o PRESIDENTE</b> — e presidente brasileiro escala time,
        porque quem paga manda 😄. Então <b>nenhum poder sai da sua mão</b>: a sala só dá nome ao chapéu
        que o jogador já veste. Quando o técnico chegar, ele trabalha PRA você — dá bônus e palpite,
        <b>nunca tira a escalação de você</b>.`)}
      ${bloco('🎩🚗 Técnico e Garagem', '#EDE7FF', `
        Os dois entram <b>já no dia 1</b>, em cinza com selo <b>EM BREVE</b> (sem botão, ninguém clica no vazio).
        Serve de vitrine: todo mundo que abrir a sala fica sabendo o que vem por aí — e a sala já nasce
        com espaço reservado, sem precisar redesenhar depois.<br><br>
        <b>A zoeira da formação</b> (seu pedido): o técnico tem o esquema PREFERIDO dele, defende com unhas e
        dentes… e cede na hora que você muda. Cada troca solta uma frase nova (umas 20, pra não repetir).
        <b>Isso é só texto</b> — não muda nada na simulação, não adiciona passo nem espera. Entra no tempo morto,
        do jeito que você gosta.`)}
      ${bloco('🛡️🎽🦅 A cara do clube na sala', '#E9F6FF', `
        Escudo, manto e mascote na tira de baixo do retrato — <b>com a regra do barão escrita ali do lado</b>:
        <i>"cai de divisão? o escudo, o manto e a mascote descem junto com você"</i>. É o lugar certo pra isso:
        a sala é do DONO, e a arte do batismo é a coisa mais dele que existe.<br><br>
        No mockup os desenhos são de mentirinha (placeholder). No jogo vem o <b>.webp de verdade</b> do batismo,
        o manto sai das 2 cores medidas na arte do dono, e quem não batizou vê o escudo genérico — com o
        convite pra batizar.`)}
      ${bloco('🧍 O boneco (sua ideia de 21/08)', '#FFF6D6', `
        Continua de pé como <b>passo 2</b>: na primeira vez que a pessoa abrir a sala, cria o boneco
        (ou pula) e rola a <b>POSSE</b>. No dia 1 a sala abre com o boneco padrão — ninguém fica travado.`)}
      ${bloco('✅ Pra aprovar', '#fff', `
        1. <b>Patrocínio dentro da Presidência</b> (recomendo) — ou mantém sub-aba separada?<br>
        2. A frase da sala com a zoeira <i>"(mas aqui presidente escala time — e quem paga, manda)"</i> — fica ou sai?<br>
        3. Ordem das mesas na sala tá boa, ou quer troféus mais pra cima?<br><br>
        <b>Nada disso mexe no jogo ainda</b> — é só desenho. Quando você aprovar, eu codo por partes
        (cada parte um commit, tudo reversível).`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-presv2-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
