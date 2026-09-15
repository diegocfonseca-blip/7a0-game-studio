// 🛍️ LOJA DO CLUBE — mockup da proposta (Diego, 15/09).
//
// 👕 A CAMISA É ARTE DE VERDADE, NÃO VETOR (ele cortou duas versões em SVG:
// *"você tá fazendo em SVG e quero arte de verdade igual está é a do time"*).
// E o MOLDE é o da camisa do **Final Boss FC** — escolha dele: *"faz com base na
// do Final Boss, que é esse modelo que é o certo de camisa"*.
//
// Como isso não vira um arquivo por clube: o jogo guarda **UMA** arte de camisa
// em branco e pinta com as 2 cores do clube. Quem tem batismo continua usando a
// arte própria dele (as 31 que já estão em public/mantos-salao).
//
// As 3 peças entram sempre nos mesmos lugares, como ele desenhou:
//   · escudo no peito ESQUERDO · fornecedor no peito DIREITO · Master ABAIXO do peito
//
//   node scripts/mockup-loja-clube.mjs
import { chromium } from 'playwright-core'
import { INK, CREME, GOLD, GREEN, FONTES, OSW, img, escudoBase, camisa, vitrine, CAMISA_TIER, LOGO_VADICO } from './loja-pecas.mjs'

const pill = (txt, sub, on) => `
  <div style="flex:1;min-width:0;border:2.5px solid ${INK};border-radius:11px;padding:6px 4px;text-align:center;background:${on ? GOLD : '#fff'};box-shadow:${on ? `2px 2px 0 ${INK}` : 'none'}">
    <div style="${OSW};font-weight:700;font-size:11px;text-transform:uppercase">${txt}</div>
    <div style="${OSW};font-weight:400;font-size:9px;opacity:.65;margin-top:1px">${sub}</div>
  </div>`

const cartao = (titulo, corpo, rodape) => `
  <div style="border:3px solid ${INK};border-radius:13px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:9px 10px;margin-bottom:9px">
    <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase;margin-bottom:5px">${titulo}</div>
    ${corpo}${rodape ? `<div style="${OSW};font-weight:400;font-size:10px;opacity:.65;margin-top:6px;line-height:1.4">${rodape}</div>` : ''}
  </div>`

const tela = ({ titulo, sub, shirt, extra, forn, master, masterPe, vendeu }) => `
  <div style="width:392px;flex:none;background:${CREME};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px;color:${INK}">
    <div style="${OSW};font-weight:700;font-size:16px;text-transform:uppercase">🛍️ Loja do Clube</div>
    <div style="${OSW};font-weight:400;font-size:11px;opacity:.7;margin-bottom:8px">${titulo} · ${sub}</div>
    ${vitrine(shirt)}
    ${extra ?? ''}
    ${cartao('💰 Preço da camisa', `<div style="display:flex;gap:5px">${pill('Popular', '1 🪙 cada', false)}${pill('Normal', '2 🪙 cada', true)}${pill('Cara', '3 🪙 cada', false)}</div>`,
      'Barata vende pra torcida toda e rende pouco por peça. Cara rende mais e vende menos.')}
    ${cartao('👟 Fornecedor de material', `<div style="display:flex;align-items:center;gap:8px">
        <div style="width:38px;height:38px;border:2.5px solid ${INK};border-radius:9px;background:${forn.cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px">${forn.emoji}</div>
        <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:13px">${forn.nome}</div>
          <div style="${OSW};font-weight:400;font-size:10px;opacity:.7">${forn.linha}</div></div></div>`, forn.pe)}
    ${cartao('🤝 Patrocínio Master', `<div style="${OSW};font-weight:700;font-size:13px">${master}</div>`,
      `O Master que você já fechou aparece ESTAMPADO na camisa.<br>${masterPe}`)}
    <div style="border:3px solid ${INK};border-radius:13px;background:${GOLD};box-shadow:3px 3px 0 ${INK};padding:9px 10px">
      <div style="${OSW};font-weight:700;font-size:11.5px;text-transform:uppercase">📦 Vendeu na temporada</div>
      <div style="${OSW};font-weight:700;font-size:20px;margin-top:2px">${vendeu.n} camisas · <span style="color:${GREEN}">+${vendeu.m} 🪙</span></div>
      <div style="${OSW};font-weight:400;font-size:10px;opacity:.7;margin-top:2px">${vendeu.conta}</div>
    </div>
  </div>`

const html = `<style>${FONTES}body{margin:0;background:#E8DFC6;padding:16px;width:860px}</style>
  <div style="${OSW};font-weight:700;font-size:20px;text-transform:uppercase;color:${INK}">Loja do Clube · proposta</div>
  <div style="${OSW};font-weight:400;font-size:12px;color:${INK};opacity:.75;margin-bottom:12px">
    Escudo no peito <b>esquerdo</b>, fornecedor de material no peito <b>direito</b>, patrocínio Master na <b>barriga</b>.</div>
  <div style="display:flex;gap:14px;align-items:flex-start">
    ${tela({
      titulo: 'COM batismo', sub: 'Final Boss FC',
      shirt: camisa({
        arte: img('public/mantos-salao/finalboss-camisa.webp'), alt: 300,
        escudo: '', // a arte do batismo já traz o escudo dele — o jogo não carimba outro
        fornecedor: 'Naique', fornSimbolo: '✓', master: 'VADICO VEÍCULOS', masterCor: INK,
        masterLogo: LOGO_VADICO, masterW: 0.22, // 🏷️ marca REAL = logo de verdade, em cores
        pos: { fornX: 30, fornY: 27, masterX: 50, masterY: 58 },
      }),
      extra: cartao('👑 A camisa do seu clube', `<div style="${OSW};font-weight:700;font-size:12.5px">Arte própria do batismo</div>`,
        'Clube batizado usa a arte que o dono mandou — é ela que aparece na loja. As 2 cores do manto saem dessa arte.'),
      forn: { nome: 'Naique Sports', emoji: '👟', cor: GREEN, linha: 'contrato de 3 temporadas · 5 🪙 por ano<br>+30% nas vendas da loja', pe: 'Marca grande só te procura na Série B pra cima.' },
      master: '🚗 Vadico Veículos <span style="font-weight:400;font-size:10px;opacity:.7">· ano 2 de 5</span>',
      masterPe: 'Marca REAL (Vadico, ERO, Max Joias, Rei das Tintas): entra o <b>logo de verdade</b>, o mesmo que já está no jogo.',
      vendeu: { n: 44, m: 88, conta: '34 de base na Série B × estádio cheio × Naique (+30%)' },
    })}
    ${tela({
      titulo: 'SEM batismo', sub: 'Fulanos FC · tier 🪵 FOI PROFISSIONAL',
      shirt: camisa({
        arte: CAMISA_TIER, alt: 300,
        // 📐 medido na arte que o Diego mandou (542×620): gola escura até 12%, faixa de
        // cima 32→38%, faixa de baixo 42→48%, corpo entre x=128 e x=414.
        // Escudo no peito ESQUERDO de quem veste = lado DIREITO de quem olha.
        escudo: escudoBase({ letra: 'F', c1: '#2E9E5B', c2: '#14612F', size: Math.round(300 * 0.085) }),
        fornecedor: 'Adibas', fornSimbolo: '◣', master: 'VADICO VEÍCULOS', masterCor: '#4F462E',
        masterLogo: LOGO_VADICO, masterW: 0.22,
        pos: { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 },
      }),
      extra: cartao('🪵 A camisa e o escudo do seu clube', `<div style="display:flex;align-items:center;gap:9px">
          ${escudoBase({ letra: 'F', c1: '#2E9E5B', c2: '#14612F', size: 40 })}
          <div style="flex:1;min-width:0"><div style="${OSW};font-weight:700;font-size:12.5px">Fulanos FC</div>
            <div style="${OSW};font-weight:400;font-size:10px;opacity:.7">escudo base · letra F · verde escolhido por você</div></div></div>`,
        'A camisa é a MESMA arte de quem tem batismo, na cor do tier 🪵. E o clube sem batismo também tem escudo: o <b>escudo base</b> nasce da <b>primeira letra</b> do nome e das <b>2 cores</b> que você escolher — é desenho do jogo, não custa nada e serve pra qualquer nome.'),
      forn: { nome: 'Adibas', emoji: '🔺', cor: '#0E3E86', linha: 'contrato de 2 temporadas · 3 🪙 por ano<br>+20% nas vendas da loja', pe: 'Subiu de série, marca melhor bate na porta.' },
      master: '🚗 Vadico Veículos <span style="font-weight:400;font-size:10px;opacity:.7">· ano 1 de 3</span>',
      masterPe: 'Marca <b>real</b> entra com o <b>logo de verdade, em cores</b> (o vermelho da Vadico aparece). Marca <b>genérica</b> (Padaria do Zé, Espetinho do Baixinho…) não tem logo: entra o <b>nome escrito</b>.',
      vendeu: { n: 15, m: 30, conta: '22 de base na Série C × estádio 55% × Adibas (+20%)' },
    })}
  </div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 892, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'mockup-loja-clube.png', fullPage: true })
await b.close()
console.log('mockup-loja-clube.png')
