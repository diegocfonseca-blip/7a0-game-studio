// 🧭 ONDE A LOJA MORA — pergunta do Diego (15/09): *"gostei dessa forma… mas onde
// entra a arte da camisa, da loja e etc? Fica em alguma aba?? Ou o quê?"*.
//
// Resposta, olhando a navegação DE VERDADE (`pyramidseason.tsx`), não chutando:
//   · abas da carreira: 🗓️ Jogos · 📊 Tabelas · 👥 Elenco · 🏆 Rank · 🏟️ Clube
//   · sub-abas dentro de 🏟️ Clube: 🏗️ Estrutura · 💰 Finanças · 🤝 Patrocínio
//     (+ 🏛️ Presidência só na carreira privada)
// Hoje são 3 pílulas. A Loja entra como a 4ª: **🏟️ Clube › 🛍️ Loja**.
//
// Por que sub-aba própria e não dentro do Patrocínio: a Loja tem TRÊS coisas pra
// mostrar (a camisa na vitrine · o preço do ano · o fornecedor + o balanço) e o
// Patrocínio já está cheio (Master + Pontual + TV + régua de valores). E porque a
// camisa é a vitrine do orgulho — merece porta própria.
//
// 🔒 A pílula só aparece pra quem CONSTRUIU a 🛍️ Loja do Clube no estádio (ela já é
// uma obra de `STADIUM_EXTRAS` hoje, custo 80). Quem não construiu vê a porta
// fechada explicando o porquê e o caminho — regra permanente do Diego.
//
//   node scripts/mockup-loja-aba.mjs
import { chromium } from 'playwright-core'
import { INK, CREME, GOLD, GREEN, FONTES, OSW, escudoBase, camisa, vitrine, CAMISA_TIER, LOGO_VADICO } from './loja-pecas.mjs'

const ROXO = '#7C3AED'
const MEU = GREEN // cor do tier do usuário (as pílulas ativas usam a cor dele)

const ESCUDO = escudoBase({ letra: 'F', c1: '#2E9E5B', c2: '#14612F', size: 38 })

// ── as barras de navegação, como elas são hoje no jogo ─────────────────────
const abaPrincipal = (ativa) => `
  <div style="display:flex;gap:6px;margin-bottom:10px">
    ${[['🗓️', 'Jogos'], ['📊', 'Tabelas'], ['👥', 'Elenco'], ['🏆', 'Rank'], ['🏟️', 'Clube']].map(([ic, l]) => `
      <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;padding:7px 2px;text-align:center;
                  background:${l === ativa ? MEU : '#fff'};color:${l === ativa ? '#fff' : INK};
                  box-shadow:2px 2px 0 ${INK}">
        <div style="font-size:14px;line-height:1">${ic}</div>
        <div style="${OSW};font-weight:700;font-size:9.5px;text-transform:uppercase;line-height:1.2">${l}</div>
      </div>`).join('')}
  </div>`

const subAba = (ativa) => `
  <div style="display:flex;gap:6px;margin-bottom:10px">
    ${[['🏗️', 'Estrutura'], ['🛍️', 'Loja'], ['💰', 'Finanças'], ['🤝', 'Patrocínio']].map(([ic, l]) => `
      <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;padding:7px 2px;text-align:center;
                  background:${l === ativa ? MEU : '#fff'};color:${l === ativa ? '#fff' : INK};
                  box-shadow:2px 2px 0 ${INK};position:relative">
        ${l === 'Loja' ? `<span style="position:absolute;top:-6px;right:-5px;background:${GOLD};border:2px solid ${INK};
          border-radius:999px;${OSW};font-weight:700;font-size:8px;padding:1px 5px">NOVO</span>` : ''}
        <div style="font-size:13px;line-height:1">${ic}</div>
        <div style="${OSW};font-weight:700;font-size:9px;text-transform:uppercase;line-height:1.2">${l}</div>
      </div>`).join('')}
  </div>`

const cartao = (titulo, corpo, rodape, bg = '#fff') => `
  <div style="border:3px solid ${INK};border-radius:13px;background:${bg};box-shadow:3px 3px 0 ${INK};padding:9px 10px;margin-bottom:9px">
    <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase;margin-bottom:5px">${titulo}</div>
    ${corpo}${rodape ? `<div style="${OSW};font-weight:400;font-size:10px;opacity:.65;margin-top:6px;line-height:1.4">${rodape}</div>` : ''}
  </div>`

const pill = (txt, sub, on) => `
  <div style="flex:1;min-width:0;border:2.5px solid ${INK};border-radius:11px;padding:6px 4px;text-align:center;
              background:${on ? GOLD : '#fff'};box-shadow:${on ? `2px 2px 0 ${INK}` : 'none'}">
    <div style="${OSW};font-weight:700;font-size:11px;text-transform:uppercase">${txt}</div>
    <div style="${OSW};font-weight:400;font-size:9px;opacity:.65;margin-top:1px">${sub}</div>
  </div>`

const CAMISA = camisa({
  arte: CAMISA_TIER, alt: 290,
  escudo: escudoBase({ letra: 'F', c1: '#2E9E5B', c2: '#14612F', size: Math.round(290 * 0.085) }),
  fornecedor: 'Adibas', fornSimbolo: '◣', master: 'VADICO VEÍCULOS', masterCor: '#4F462E',
  masterLogo: LOGO_VADICO, masterW: 0.22,
  pos: { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 },
})

// ── TELA 1: a Loja aberta ──────────────────────────────────────────────────
const telaLoja = `
  <div style="width:392px;flex:none;background:${CREME};border:3px solid ${INK};border-radius:16px;
              box-shadow:4px 4px 0 ${INK};padding:12px;color:${INK}">
    <div style="${OSW};font-weight:700;font-size:14px;text-transform:uppercase;margin-bottom:8px">Fulanos FC · Série C</div>
    ${abaPrincipal('Clube')}
    ${subAba('Loja')}
    ${vitrine(CAMISA)}
    ${cartao('👕 A sua camisa', `<div style="display:flex;align-items:center;gap:9px">
        ${ESCUDO}
        <div style="flex:1;min-width:0">
          <div style="${OSW};font-weight:700;font-size:12.5px">Fulanos FC · temporada 7</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.72;line-height:1.35">
            escudo base (letra F) · fornecedor <b>Adibas</b> no peito · Master <b>Vadico</b> na barriga</div>
        </div></div>`,
      'Tudo que você fecha aparece aqui na camisa. Clube batizado usa a arte própria; sem batismo, o molde do jogo na cor do seu tier.')}
    ${cartao('💰 Preço da camisa deste ano',
      `<div style="display:flex;gap:5px">${pill('Popular', '1 🪙', false)}${pill('Normal', '2 🪙', true)}${pill('Cara', '3 🪙', false)}</div>`,
      'Escolhido na virada da temporada. É aposta: <b>se manteve</b> → a popular ganha · <b>classificação</b> → a normal · <b>campeão</b> → a cara. <b>Se cair, não vende nada.</b>')}
    ${cartao('👟 Fornecedor de material', `<div style="display:flex;align-items:center;gap:8px">
        <div style="width:34px;height:34px;flex:none;border:2.5px solid ${INK};border-radius:9px;background:#0E3E86;color:#fff;
                    display:flex;align-items:center;justify-content:center;font-size:16px">◣</div>
        <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:12.5px">Adibas</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.72">ano 2 de 2 · +4 🪙 por temporada · +20% nas vendas</div></div></div>`,
      'Contrato assinado na Série D e <b>não quebrou</b> quando você subiu. Proposta nova só quando acabar.')}
    ${cartao('📦 Última temporada', `<div style="${OSW};font-weight:700;font-size:19px;line-height:1.1">
        3.721 camisas · <span style="color:${GREEN}">+37 🪙</span></div>
      <div style="${OSW};font-weight:400;font-size:10px;opacity:.72;margin-top:2px">
        52.000 torcedores · 3º lugar (classificação) · preço Normal · Adibas +20%</div>`,
      'O balanço fecha na virada e cai direto no caixa. Durante a temporada a loja trabalha calada.', GOLD)}
  </div>`

// ── TELA 2: quem ainda não construiu a Loja ────────────────────────────────
const telaTrava = `
  <div style="width:392px;flex:none;background:${CREME};border:3px solid ${INK};border-radius:16px;
              box-shadow:4px 4px 0 ${INK};padding:12px;color:${INK}">
    <div style="${OSW};font-weight:700;font-size:14px;text-transform:uppercase;margin-bottom:8px">Fulanos FC · Série D</div>
    ${abaPrincipal('Clube')}
    ${subAba('Loja')}
    <div style="position:relative;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};
                margin-bottom:9px;overflow:hidden;background:linear-gradient(#2A1B10,#140C06)">
      <div style="padding:26px 18px;text-align:center">
        <div style="font-size:40px;line-height:1;opacity:.55">🔒</div>
        <div style="${OSW};font-weight:700;font-size:15px;color:#F0DFAE;text-transform:uppercase;margin-top:8px">
          A loja ainda não abriu</div>
        <div style="${OSW};font-weight:400;font-size:11px;color:#D8CEB4;opacity:.85;margin-top:5px;line-height:1.45">
          Sua camisa existe, mas não tem onde vender.</div>
      </div>
    </div>
    ${cartao('🔨 Como abrir', `<div style="display:flex;align-items:center;gap:8px">
        <div style="width:34px;height:34px;flex:none;border:2.5px solid ${INK};border-radius:9px;background:${GOLD};
                    display:flex;align-items:center;justify-content:center;font-size:16px">🛍️</div>
        <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:12.5px">🛍️ Loja do Clube · 80 🪙</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.72">precisa de 2 setores do estádio prontos</div></div></div>
      <div style="border:2.5px solid ${INK};border-radius:11px;background:${MEU};color:#fff;text-align:center;
                  ${OSW};font-weight:700;font-size:12px;text-transform:uppercase;padding:8px;margin-top:8px;
                  box-shadow:2px 2px 0 ${INK}">Ir pra 🏗️ Estrutura</div>`,
      'A obra <b>já existe no jogo hoje</b> (custo 80, rende +6 por temporada). Agora ela também abre esta aba. Quem já construiu encontra a loja aberta na primeira vez que entrar.')}
    ${cartao('👕 E a camisa?', `<div style="display:flex;justify-content:center;padding:4px 0">
        <div style="transform:scale(.62);transform-origin:top center;height:182px">${CAMISA}</div></div>`,
      'A camisa continua sendo a sua, com escudo e patrocínios, e aparece no Salão e no jornal. A loja é só o lugar onde ela <b>vira dinheiro</b>.')}
  </div>`

const html = `<style>${FONTES}body{margin:0;background:#E8DFC6;padding:16px;width:860px}</style>
  <div style="${OSW};font-weight:700;font-size:20px;text-transform:uppercase;color:${INK}">Onde a Loja mora</div>
  <div style="${OSW};font-weight:400;font-size:12px;color:${INK};opacity:.78;margin-bottom:12px;line-height:1.45">
    Nova sub-aba <b>🏟️ Clube › 🛍️ Loja</b> — ao lado de Estrutura, Finanças e Patrocínio (a barra de cima é a de
    verdade, do jogo). A camisa grande, o preço do ano, o fornecedor e o balanço moram todos aí.</div>
  <div style="display:flex;gap:14px;align-items:flex-start">${telaLoja}${telaTrava}</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 892, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'mockup-loja-aba.png', fullPage: true })
await b.close()
console.log('mockup-loja-aba.png')
