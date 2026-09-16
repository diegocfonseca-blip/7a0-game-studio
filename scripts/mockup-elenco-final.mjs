// 👥 A ABA ELENCO — versão do Diego (16/09): desktop lado a lado, celular empilhado
//
// Ordem dele: *"talvez p desktop vc deixa lateral o campo e a lista lateral ao campo…
// e dispositivo móvel deixe o campo em cima e lista dos jogadores embaixo… e c esses
// dados assim. Faça agora c seu visual, sem pôr gols no campinho e assistência no
// campinho tb, pq a pessoa já vê na lista"*.
//
// ⚠️ DESENHO, nada codado. Os rostos são os DE VERDADE do repo
// (`legend-avatars.json` · 157 prontos em `public/avatars/lendas-v1/`).
//
// 🚫 SEM selo de gol/assistência no campinho — ordem dele, e ele tem razão: os dois
// números agora vivem em COLUNA na tabela, então o selo virava repetição.
// (A régua de ontem continua valendo: campinho = história, lista = operação. Só que
// agora a lista dá conta da história também, e o campinho fica limpo.)
//
// Rodar: node scripts/mockup-elenco-final.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-elenco-final.png')
const VERM = '#C2452F', ROXO = '#7C3AED', SLATE = '#3E4A5A', AMB = '#D98324'
const SYS = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"
const corGas = g => g > 55 ? GREEN : g > 30 ? AMB : VERM
const rosto = src => `data:image/webp;base64,${readFileSync('public' + src).toString('base64')}`

// 👤 no campinho: SÓ rosto, posição e nome. Nada de selo (ordem dele).
const noCampo = (curto, tag, src, d = 46) => `
  <div style="text-align:center;width:${d + 14}px;flex:none">
    <img src="${rosto(src)}" style="width:${d}px;height:${d}px;object-fit:contain;display:block;margin:0 auto;
      filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45))">
    <div style="${OSW};font-weight:700;font-size:7.5px;background:${INK};color:${GOLD};border-radius:3px;
      padding:0 4px;display:inline-block;margin-top:1px;letter-spacing:.5px">${tag}</div>
    <div style="${OSW};font-weight:700;font-size:8px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${curto}</div>
  </div>`

const XI = [
  [['Romário', 'ATA', '/avatars/lendas-v1/romario-barcelona-1994.webp'], ['Careca', 'ATA', '/avatars/lendas-v1/careca-sao-paulo-1986.webp']],
  [['Zico', 'MEI', '/avatars/lendas-v1/zico-flamengo-1981.webp'], ['Sócrates', 'MEI', '/avatars/lendas-v1/socrates-corinthians-1983.webp'],
   ['Raí', 'MEI', '/avatars/lendas-v1/rai-sao-paulo-1992.webp'], ['Falcão', 'MEI', '/avatars/lendas-v1/falcao-internacional-1979.webp']],
  [['R. Carlos', 'LAT', '/avatars/lendas-v1/roberto-carlos-real-madrid-2002.webp'], ['L. Pereira', 'ZAG', '/avatars/lendas-v1/luis-pereira-palmeiras-1972.webp'],
   ['Bellini', 'ZAG', '/avatars/lendas-v1/hilderaldo-bellini-vasco-1958.webp'], ['Cafu', 'LAT', '/avatars/lendas-v1/cafu-milan-2004.webp']],
  [['R. Ceni', 'GOL', '/avatars/lendas-v1/rogerio-ceni-sao-paulo-2005.webp']],
]
const campinho = (d = 46) => { const g = Math.round(d * 0.26), pad = Math.round(d * 0.34)
  return `
  <div style="background:repeating-linear-gradient(180deg,#2d7a41 0 ${Math.round(d / 2)}px,#286e3a ${Math.round(d / 2)}px ${d}px);
    border:3px solid ${INK};border-radius:13px;padding:${pad}px ${Math.round(d * 0.12)}px ${Math.round(pad * 0.8)}px;
    box-shadow:3px 3px 0 ${INK};position:relative;overflow:hidden">
    <div style="position:absolute;left:6%;right:6%;top:3.5%;bottom:3.5%;border:${d > 50 ? 3 : 2}px solid rgba(255,255,255,.2);border-radius:5px"></div>
    <div style="position:absolute;left:50%;top:50%;width:${Math.round(d * 1.5)}px;height:${Math.round(d * 1.5)}px;transform:translate(-50%,-50%);
      border:${d > 50 ? 3 : 2}px solid rgba(255,255,255,.18);border-radius:999px"></div>
    <div style="position:absolute;left:0;right:0;top:50%;height:${d > 50 ? 3 : 2}px;background:rgba(255,255,255,.14)"></div>
    <div style="position:relative;display:flex;flex-direction:column;gap:${g}px">
      ${XI.map(l => `<div style="display:flex;justify-content:center;gap:${Math.round(d * 0.08)}px">${l.map(j => noCampo(j[0], j[1], j[2], d)).join('')}</div>`).join('')}
    </div></div>` }

// 📋 a tabela com as colunas que ele pediu
const NIVEL = { lenda: ['👑', GOLD], craque: ['⭐', '#CBD4DE'], promessa: ['💎', '#C9A9FF'], bom: ['🎯', '#41C07A'], prof: ['🪵', '#B2A583'] }
const cab = `
  <div style="display:flex;align-items:center;gap:5px;padding:0 7px 4px;${OSW};font-weight:700;font-size:7.5px;
    letter-spacing:1px;color:rgba(12,12,12,.38)">
    <span style="width:13px;text-align:right">Nº</span><span style="width:26px"></span>
    <span style="flex:1">NOME</span>
    <span style="width:22px;text-align:center">POS</span>
    <span style="width:20px;text-align:center">NÍVEL</span>
    <span style="width:22px;text-align:center">JOGOS</span>
    <span style="width:18px;text-align:center">GOLS</span>
    <span style="width:18px;text-align:center">ASS</span>
    <span style="width:42px;text-align:center">GÁS</span>
    <span style="width:20px;text-align:center">STA</span></div>`
const num = (v, cor) => `<span style="${OSW};font-weight:700;font-size:10.5px;color:${cor || 'rgba(12,12,12,.75)'};text-align:center;flex:none">${v}</span>`
const linha = (n, nome, ficha, src, pos, nivel, jogos, gols, ass, gas, sta, sel) => `
  <div style="display:flex;align-items:center;gap:5px;padding:3px 7px;background:${sel ? '#FFF3CE' : '#fff'};
    border:2px solid ${sel ? INK : 'rgba(12,12,12,.13)'};border-radius:7px;margin-bottom:3px;${sel ? `box-shadow:2px 2px 0 ${INK}` : ''}">
    <span style="${OSW};font-weight:700;font-size:9px;color:rgba(12,12,12,.38);width:13px;flex:none;text-align:right">${n}</span>
    <span style="width:26px;flex:none">${src ? `<img src="${rosto(src)}" style="width:26px;height:26px;object-fit:contain;display:block">` :
      `<span style="display:flex;width:22px;height:22px;margin:2px;border-radius:999px;background:linear-gradient(160deg,#DBD1B5,#B2A583);
        border:2px solid ${INK};align-items:center;justify-content:center;${OSW};font-weight:700;font-size:10px;color:#fff;text-shadow:1px 1px 0 #000">${nome[0]}</span>`}</span>
    <span style="flex:1;min-width:0">
      <span style="display:block;${OSW};font-weight:700;font-size:11px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}</span>
      <span style="display:block;${SYS};font-size:7.5px;font-weight:600;color:rgba(12,12,12,.42)">${ficha}</span></span>
    <span style="width:22px;flex:none;text-align:center"><span style="${OSW};font-weight:700;font-size:8px;background:${INK};color:${GOLD};border-radius:3px;padding:1px 4px">${pos}</span></span>
    <span style="width:20px;flex:none;text-align:center;font-size:11px">${NIVEL[nivel][0]}</span>
    <span style="width:22px;flex:none;text-align:center">${num(jogos)}</span>
    <span style="width:18px;flex:none;text-align:center">${num(gols, gols > 0 ? INK : 'rgba(12,12,12,.28)')}</span>
    <span style="width:18px;flex:none;text-align:center">${num(ass, ass > 0 ? '#2F6BAE' : 'rgba(12,12,12,.28)')}</span>
    <span style="width:42px;flex:none;display:flex;align-items:center;gap:3px">
      <span style="flex:1;height:6px;background:rgba(12,12,12,.14);border:1.5px solid ${INK};border-radius:4px;overflow:hidden">
        <span style="display:block;height:100%;width:${gas}%;background:${corGas(gas)}"></span></span></span>
    <span style="width:20px;flex:none;text-align:center;font-size:10px">${sta}</span></div>`

const TIT = [
  [1, 'Rogério Ceni', 'São Paulo · 2005', '/avatars/lendas-v1/rogerio-ceni-sao-paulo-2005.webp', 'GOL', 'lenda', 28, 3, 0, 78, '⭐'],
  [2, 'Cafu', 'Milan · 2004', '/avatars/lendas-v1/cafu-milan-2004.webp', 'LAT', 'lenda', 26, 1, 8, 64, '⭐'],
  [3, 'Bellini', 'Vasco · 1958', '/avatars/lendas-v1/hilderaldo-bellini-vasco-1958.webp', 'ZAG', 'craque', 25, 0, 2, 71, '⭐'],
  [4, 'Luís Pereira', 'Palmeiras · 1972', '/avatars/lendas-v1/luis-pereira-palmeiras-1972.webp', 'ZAG', 'craque', 27, 1, 0, 66, '⭐'],
  [6, 'Roberto Carlos', 'Real Madrid · 2002', '/avatars/lendas-v1/roberto-carlos-real-madrid-2002.webp', 'LAT', 'lenda', 24, 2, 7, 59, '⭐'],
  [5, 'Falcão', 'Internacional · 1979', '/avatars/lendas-v1/falcao-internacional-1979.webp', 'MEI', 'lenda', 28, 6, 3, 26, '🥵'],
  [8, 'Sócrates', 'Corinthians · 1983', '/avatars/lendas-v1/socrates-corinthians-1983.webp', 'MEI', 'lenda', 23, 4, 11, 74, '⭐'],
  [7, 'Raí', 'São Paulo · 1992', '/avatars/lendas-v1/rai-sao-paulo-1992.webp', 'MEI', 'lenda', 22, 3, 9, 69, '⭐'],
  [10, 'Zico', 'Flamengo · 1981', '/avatars/lendas-v1/zico-flamengo-1981.webp', 'MEI', 'lenda', 27, 9, 14, 58, '⭐'],
  [9, 'Romário', 'Barcelona · 1994', '/avatars/lendas-v1/romario-barcelona-1994.webp', 'ATA', 'lenda', 28, 18, 5, 67, '⭐'],
  [11, 'Careca', 'São Paulo · 1986', '/avatars/lendas-v1/careca-sao-paulo-1986.webp', 'ATA', 'lenda', 25, 12, 4, 72, '⭐'],
]
const RES = [
  [12, 'Dida', 'Milan · 2007', '/avatars/lendas-v1/dida-milan-2007.webp', 'GOL', 'lenda', 10, 0, 0, 99, '-'],
  [13, 'Taffarel', 'Internacional · 1989', '/avatars/lendas-v1/taffarel-internacional-1989.webp', 'GOL', 'craque', 0, 0, 0, 96, '-'],
  [14, 'Djalma Santos', 'Palmeiras · 1962', '/avatars/lendas-v1/djalma-santos-palmeiras-1962.webp', 'LAT', 'lenda', 12, 0, 3, 92, '-'],
  [15, 'Nílton Santos', 'Botafogo · 1958', '/avatars/lendas-v1/nilton-santos-botafogo-1958.webp', 'LAT', 'lenda', 9, 1, 2, 88, '-'],
  [16, 'Mauro Galvão', 'Vasco · 1997', '/avatars/lendas-v1/mauro-galvao-vasco-1997.webp', 'ZAG', 'bom', 24, 1, 3, 22, '🚑'],
  [17, 'Leandro', 'Flamengo · 1983', '/avatars/lendas-v1/leandro-flamengo-1983.webp', 'ZAG', 'craque', 7, 0, 1, 95, '-'],
  [18, 'Gérson', 'Botafogo · 1968', '/avatars/lendas-v1/gerson-botafogo-1968.webp', 'MEI', 'lenda', 14, 2, 9, 90, '-'],
  [19, 'Didi', 'Botafogo · 1958', '/avatars/lendas-v1/didi-botafogo-1958.webp', 'MEI', 'lenda', 11, 3, 6, 93, '-'],
  [20, 'Ademir da Guia', 'Palmeiras · 1972', '/avatars/lendas-v1/ademir-da-guia-palmeiras-1972.webp', 'MEI', 'craque', 19, 2, 7, 41, '😓'],
  [21, 'Rivaldo', 'Barcelona · 1999', '/avatars/lendas-v1/rivaldo-barcelona-1999.webp', 'MEI', 'lenda', 8, 4, 2, 97, '-'],
  [22, 'Kaká', 'Milan · 2007', '/avatars/lendas-v1/kaka-milan-2007.webp', 'MEI', 'lenda', 6, 2, 3, 89, '-'],
  [23, 'Garrincha', 'Botafogo · 1958', '/avatars/lendas-v1/garrincha-botafogo-1958.webp', 'ATA', 'lenda', 13, 5, 8, 91, '-'],
  [24, 'Jairzinho', 'Botafogo · 1970', '/avatars/lendas-v1/jairzinho-botafogo-1970.webp', 'ATA', 'craque', 10, 6, 1, 94, '-'],
  [25, 'Reinaldo', 'Atlético-MG · 1977', '/avatars/lendas-v1/reinaldo-atletico-mg-1977.webp', 'ATA', 'craque', 5, 3, 0, 86, '-'],
]

// 🎴 a barra do jogador selecionado (o "Aldair preto" que ele gostou)
const dado = (rot, val, cor) => `
  <span style="text-align:center;flex:none;min-width:34px">
    <span style="display:block;${OSW};font-weight:700;font-size:15px;color:${cor || '#fff'};line-height:1">${val}</span>
    <span style="display:block;${SYS};font-size:7px;font-weight:700;color:rgba(255,255,255,.42);letter-spacing:.6px">${rot}</span></span>`
const barraSel = `
  <div style="background:linear-gradient(160deg,#1a1a1a,#0C0C0C);border:3px solid ${INK};border-radius:12px;
    padding:8px 11px;display:flex;align-items:center;gap:11px;color:#fff;box-shadow:3px 3px 0 rgba(0,0,0,.3)">
    <img src="${rosto('/avatars/lendas-v1/mauro-galvao-vasco-1997.webp')}" style="width:42px;height:42px;object-fit:contain;flex:none;
      filter:drop-shadow(2px 2px 0 rgba(0,0,0,.5))">
    <span style="flex:1;min-width:0">
      <span style="display:block;${OSW};font-weight:700;font-size:14px;line-height:1.1">Mauro Galvão 🚑</span>
      <span style="display:block;${SYS};font-size:8.5px;font-weight:600;color:rgba(255,255,255,.5)">Vasco · 1997 · ZAG · 🎯 Bom</span>
      <span style="display:block;${SYS};font-size:8.5px;font-weight:700;color:#FF9C8A;margin-top:2px">Lesionado · volta em 2 rodadas</span></span>
    ${dado('JOGOS', '24')}${dado('GOLS', '1', GOLD)}${dado('ASS', '3', '#8FC0F0')}${dado('GÁS', '22%', '#FF8A73')}
    ${dado('VALOR', '38', '#FFE79A')}${dado('SAL.', '4', '#FFE79A')}${dado('CONTR.', 'T8')}
    <span style="${OSW};font-weight:700;font-size:10px;background:${GOLD};color:${INK};border:2.5px solid #000;border-radius:8px;
      padding:6px 11px;flex:none">DETALHES</span></div>`

// 📱 a MESMA barra, remontada pro estreito: rosto + nome em cima, números embaixo
const barraSelCel = `
  <div style="background:linear-gradient(160deg,#1a1a1a,#0C0C0C);border:3px solid ${INK};border-radius:12px;
    padding:9px 11px;color:#fff;box-shadow:3px 3px 0 rgba(0,0,0,.3)">
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px">
      <img src="${rosto('/avatars/lendas-v1/mauro-galvao-vasco-1997.webp')}" style="width:40px;height:40px;object-fit:contain;flex:none;
        filter:drop-shadow(2px 2px 0 rgba(0,0,0,.5))">
      <span style="flex:1;min-width:0">
        <span style="display:block;${OSW};font-weight:700;font-size:14px;line-height:1.1">Mauro Galvão 🚑</span>
        <span style="display:block;${SYS};font-size:8.5px;font-weight:600;color:rgba(255,255,255,.5)">Vasco · 1997 · ZAG · 🎯 Bom</span>
        <span style="display:block;${SYS};font-size:8.5px;font-weight:700;color:#FF9C8A;margin-top:1px">Lesionado · volta em 2 rodadas</span></span>
      <span style="${OSW};font-weight:700;font-size:9.5px;background:${GOLD};color:${INK};border:2.5px solid #000;border-radius:8px;
        padding:6px 9px;flex:none">DETALHES</span></div>
    <div style="display:flex;gap:4px;background:rgba(255,255,255,.06);border-radius:9px;padding:6px 4px">
      ${dado('JOGOS', '24')}${dado('GOLS', '1', GOLD)}${dado('ASS', '3', '#8FC0F0')}${dado('GÁS', '22%', '#FF8A73')}${dado('VALOR', '38', '#FFE79A')}${dado('SAL.', '4', '#FFE79A')}${dado('CONTR.', 'T8')}
    </div></div>`

const aba = (t, on, cor = INK) => `
  <span style="flex:1;text-align:center;${OSW};font-weight:700;font-size:10px;padding:6px 0;border:2.5px solid ${INK};
    border-radius:9px;background:${on ? cor : '#fff'};color:${on ? (cor === INK ? GOLD : '#fff') : INK};${on ? `box-shadow:2px 2px 0 ${INK}` : ''}">${t}</span>`
const atalho = (e, t, s) => `
  <span style="flex:1;background:#fff;border:2.5px solid ${INK};border-radius:10px;padding:6px 5px;text-align:center;box-shadow:2px 2px 0 ${INK}">
    <span style="${OSW};font-weight:700;font-size:10px">${e} ${t}</span>
    <span style="display:block;${SYS};font-size:7.5px;font-weight:600;color:rgba(12,12,12,.45)">${s}</span></span>`

const topoAbas = ['👥 ELENCO', '⚔️ TÁTICA', '🏛️ COMISSÃO', '📊 NÚMEROS', '🏆 CONQUISTAS']

// ── DESKTOP ────────────────────────────────────────────────────────────────
// 🖥️ NO DESKTOP O CAMPINHO CRESCE (Diego 16/09: *"o campinho ficou mt pequeno pro
// espaço que tem, não? ou ele tá do tamanho q sempre foi?"* — estava do tamanho do
// CELULAR dentro de um monitor, que é o erro clássico de "responsivo" mal feito:
// a coluna cresce e o conteúdo dela não). Agora o campo ocupa ~45% da largura e o
// rosto vai de 44 pra 64px.
const desktop = `
<div style="width:1120px;background:${CREME};border:5px solid ${INK};border-radius:20px;overflow:hidden;box-shadow:7px 7px 0 ${INK}">
  <div style="background:${INK};color:#fff;padding:10px 16px;display:flex;align-items:center;gap:12px">
    <span style="${OSW};font-weight:700;font-size:20px">MEU TIME</span>
    <span style="${SYS};font-size:9px;font-weight:700;letter-spacing:1.6px;color:rgba(255,255,255,.42)">ESCALAÇÃO E ELENCO</span>
    <span style="flex:1"></span>
    ${topoAbas.map((t, i) => `<span style="${OSW};font-weight:700;font-size:10px;padding:4px 11px;border-radius:7px;
      background:${i === 0 ? GOLD : 'rgba(255,255,255,.08)'};color:${i === 0 ? INK : 'rgba(255,255,255,.65)'}">${t}</span>`).join('')}
  </div>
  <div style="display:flex;gap:12px;padding:12px 14px 10px">
    <div style="width:480px;flex:none">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <span style="${OSW};font-weight:700;font-size:12px;letter-spacing:1px">⭐ TITULARES (11)</span><span style="flex:1"></span>
        <span style="${OSW};font-weight:700;font-size:10.5px;border:2px solid ${INK};border-radius:7px;padding:2px 8px;background:#fff">4-4-2 ▾</span></div>
      ${campinho(64)}
      <div style="display:flex;gap:6px;margin-top:9px">${atalho('🏛️', 'Comissão', 'téc · prep')}${atalho('🌱', 'Base', '11 vagas')}${atalho('🏢', 'SAF', '0 de 4')}</div>
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;gap:5px;margin-bottom:6px">${aba('⭐ TITULARES (11)', false)}${aba('🔁 RESERVAS (14)', true)}</div>
      ${cab}
      ${RES.map(r => linha(...r, r[0] === 16)).join('')}
    </div>
  </div>
  <div style="padding:0 14px 14px">${barraSel}</div>
</div>`

// ── CELULAR ────────────────────────────────────────────────────────────────
const celular = `
<div style="width:372px;background:${CREME};border:5px solid ${INK};border-radius:22px;overflow:hidden;box-shadow:7px 7px 0 ${INK}">
  <div style="background:${INK};color:#fff;padding:8px 12px;display:flex;align-items:baseline;gap:7px">
    <span style="${OSW};font-weight:700;font-size:15px;flex:1">MEU TIME</span>
    <span style="${OSW};font-weight:700;font-size:12px">25</span>
    <span style="${SYS};font-size:8.5px;font-weight:700;color:rgba(255,255,255,.45)">jogadores · folha 62</span></div>
  <div style="display:flex;gap:4px;padding:7px 10px 6px">${topoAbas.slice(0, 4).map((t, i) => aba(t.split(' ')[1], i === 0)).join('')}</div>
  <div style="padding:0 10px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <span style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:1px">⭐ TITULARES (11)</span><span style="flex:1"></span>
      <span style="${OSW};font-weight:700;font-size:10px;border:2px solid ${INK};border-radius:7px;padding:2px 8px;background:#fff">4-4-2 ▾</span></div>
    ${campinho(42)}
    <div style="${SYS};font-size:9px;font-weight:700;color:rgba(12,12,12,.5);text-align:center;padding:6px 0 7px">
      toque num jogador pra ver a ficha e trocar</div>
  </div>
  <div style="padding:0 10px 10px">
    <div style="display:flex;gap:4px;margin-bottom:6px">${aba('⭐ TITULARES (11)', true)}${aba('🔁 RESERVAS (14)', false)}${aba('🏢 SAF (0)', false, SLATE)}</div>
    ${cab}
    ${TIT.map(r => linha(...r, r[0] === 5)).join('')}
    <div style="display:flex;gap:5px;margin-top:8px">${atalho('🏛️', 'Comissão', '')}${atalho('🌱', 'Base', '')}${atalho('🏢', 'SAF', '')}</div>
  </div>
  <div style="padding:0 10px 11px">${barraSelCel}</div>
</div>`

const bloco = (emoji, titulo, txt, cor) => `
  <div style="border:4px solid ${INK};border-radius:15px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:11px">
    <div style="display:flex;align-items:center;gap:8px;background:${cor};padding:7px 12px">
      <span style="font-size:17px;line-height:1">${emoji}</span>
      <span style="${OSW};font-weight:700;font-size:14.5px;text-transform:uppercase;color:#fff;line-height:1.1">${titulo}</span></div>
    <div style="padding:9px 12px;${OSW};font-weight:400;font-size:12.5px;line-height:1.55">${txt}</div></div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1500px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  ROSTOS DE VERDADE DO REPO · SEM SELO NO CAMPINHO (ORDEM SUA) · DESENHO, NADA CODADO</div>
<h1 style="${OSW};font-weight:700;font-size:44px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  Desktop lado a lado, <span style="color:${ROXO}">celular empilhado</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 8px;max-width:1250px;opacity:.88">
  Do jeito que você mandou: no monitor o campo fica <b>à esquerda e a lista ao lado</b>; no celular o campo
  <b>em cima e a lista embaixo</b>. E o campinho ficou <b>limpo</b> — gol e assistência agora são
  <b>coluna na tabela</b>, então o selo virava repetição. Você tem razão.</p>
<div style="background:#F1F6F2;border:4px solid ${GREEN};border-radius:14px;padding:11px 15px;margin:0 0 20px;max-width:1250px">
  <span style="${OSW};font-weight:700;font-size:14px;color:${GREEN};text-transform:uppercase">✅ Consertado: o campinho do desktop</span>
  <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.55;margin-top:4px">
    Você perguntou se ele estava pequeno demais pro espaço ou se era o tamanho de sempre.
    <b>Era o tamanho de sempre — o do CELULAR.</b> Eu tinha crescido a coluna e deixado o conteúdo dela igual,
    que é o erro clássico de responsivo mal feito. Agora, no monitor, o campo ocupa <b>45% da largura</b> e o
    rosto vai de <b>44 pra 64px</b>. No celular ele continua igual, porque lá o tamanho estava certo.</div>
</div>

<div style="display:flex;gap:26px;align-items:flex-start;margin-bottom:26px">
  <div style="flex:none">
    <div style="text-align:center;margin-bottom:9px">
      <span style="display:inline-block;background:${SLATE};color:#fff;border:3px solid ${INK};border-radius:999px;
        padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;box-shadow:3px 3px 0 ${INK}">🖥️ DESKTOP · LADO A LADO</span></div>
    ${desktop}
  </div>
  <div style="flex:none">
    <div style="text-align:center;margin-bottom:9px">
      <span style="display:inline-block;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:999px;
        padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;box-shadow:3px 3px 0 ${INK}">📱 CELULAR · EMPILHADO</span></div>
    ${celular}
  </div>
  <div style="flex:1;min-width:280px">
    ${bloco('🚫', 'O campinho ficou limpo', `
      Sem ⚽ e sem 🅰️ em cima do rosto, como você mandou. E o motivo é bom: agora <b>GOLS</b> e <b>ASS</b>
      são <b>coluna da tabela</b>, com o número de todo mundo alinhado — dá pra <b>comparar</b>, que o selo
      solto nunca deixou.<br><br>
      O campinho volta a ser só <b>quem está em campo</b>: rosto, posição e nome.`, VERM)}
    ${bloco('📊', 'As colunas', `
      <b>Nº · NOME</b> (com clube e ano) <b>· POS · NÍVEL · JOGOS · GOLS · ASS · GÁS · STATUS</b>.<br><br>
      O <b>GÁS</b> é barra, não número solto: cor conta a história de longe (verde/amarelo/vermelho).
      O <b>STATUS</b> é o selo do que está pegando: ⭐ titular · 🚑 lesionado · 😓 cansado · 🥵 no limite.<br><br>
      Repare no <b>5 Falcão</b> (celular): titular, 28 jogos, barra vermelha e 🥵. A linha inteira conta
      o problema.`, GREEN)}
    ${bloco('🎴', 'A barra do selecionado', `
      É o "Aldair preto" que você gostou, agora com os dados: <b>jogos · gols · ass · gás · valor · salário ·
      contrato</b>, mais a faixa do que está acontecendo e o botão <b>DETALHES</b> (que abre a carta).<br><br>
      No desktop ela fica <b>fixa no pé</b>; no celular ela aparece quando você toca em alguém.`, ROXO)}
    ${bloco('⛔', 'O GER continua fora', `
      A sua referência tem a coluna <b>GER</b> (overall). No nosso jogo isso é <b>perk pago</b> do olheiro —
      pôr pra todos entrega de graça o que a loja vende.<br><br>
      Por isso a coluna é <b>NÍVEL</b> (🪵🎯💎⭐👑). Pra quem tem olheiro, <b>o número aparece no lugar do
      selo</b>, na mesma coluna — ninguém perde nada e a loja continua de pé.`, SLATE)}
  </div>
</div>

<div style="border:4px solid ${GOLD};border-radius:18px;background:#FFFBEE;padding:16px 20px">
  <div style="${OSW};font-weight:700;font-size:18px;text-transform:uppercase;margin-bottom:8px">👉 Está fechado no desenho</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    Campo + lista, nas duas larguras · campinho limpo · tabela com os números · barra do selecionado ·
    atalhos de Comissão, Base e SAF no pé.<br>
    <b>Nada foi codado.</b> Agora é só você mandar que eu <b>monto de verdade</b>, com o seu elenco real, e
    você vê rodando no celular antes de qualquer commit.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:13px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    desenho de 16/09 · nada codado<br>refazer: <b>node scripts/mockup-elenco-final.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1500, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
