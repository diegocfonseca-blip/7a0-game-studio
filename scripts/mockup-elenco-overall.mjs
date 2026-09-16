// 🕵️ O OVERALL NA TABELA, COM A REGRA DO OLHEIRO + as abas que eu inventei (16/09)
//
// Diego: *"lembrando q temos q por o overall tb, e tb temos regras né pra aparecer o
// overall de acordo c o usuário pagante q pode ver, como já funciona hoje. Além disso
// n entendi q aba é aquela escrito números, conquistas…"*.
//
// ⚠️ DESENHO, nada codado.
//
// 🔎 A REGRA DO OLHEIRO, COPIADA DO CÓDIGO (`ElencoField`, pyramidseason.tsx):
//     const olheiroTier = olheiros ? myApoioPerk()?.tier : undefined
//     if (olheiroTier !== 'ouro' && !(olheiroTier === 'prata' && c.fame < 5)) return null
//   · 👑 OURO (Lenda) e batismo → vê TUDO
//   · ⭐ PRATA (Craque) → vê de craque pra baixo; LENDA (fame 5) fica escondida
//   · resto → não vê nada, e no lugar aparece a porta ("Quer ver o overall? É do Olheiro")
//   E o chip NÃO é um número só: é a FAIXA `lo–hi`, no degradê do tier da carta.
//   Lei do Diego anotada no código: *nunca a palavra da categoria escrita — só a cor*.
//
// Rodar: node scripts/mockup-elenco-overall.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-elenco-overall.png')
const VERM = '#C2452F', ROXO = '#7C3AED', SLATE = '#3E4A5A', AMB = '#D98324'
const SYS = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"
const corGas = g => g > 55 ? GREEN : g > 30 ? AMB : VERM
const rosto = src => `data:image/webp;base64,${readFileSync('public' + src).toString('base64')}`

// o chip do overall, exatamente como o código pinta (degradê do tier + faixa lo–hi)
const GRAD = {
  lenda: ['linear-gradient(150deg,#FFE79A,#FFC400)', INK],
  craque: ['linear-gradient(150deg,#F4F7FB,#CBD4DE)', INK],
  promessa: ['linear-gradient(150deg,#C9A9FF,#8B5CF6)', '#fff'],
  bom: ['linear-gradient(150deg,#41C07A,#2E9E5B)', '#fff'],
  prof: ['linear-gradient(150deg,#DBD1B5,#B2A583)', INK],
}
const SELO = { lenda: '👑', craque: '⭐', promessa: '💎', bom: '🎯', prof: '🪵' }
const chipOverall = (nivel, lo, hi, tier) => {
  const vê = tier === 'ouro' || (tier === 'prata' && nivel !== 'lenda')
  if (!vê) return `<span style="font-size:11px">${SELO[nivel]}</span>`
  const [g, ink2] = GRAD[nivel]
  return `<span style="${OSW};font-weight:700;font-size:9px;border:1.5px solid ${INK};border-radius:6px;
    padding:0 5px;background:${g};color:${ink2};line-height:14px;white-space:nowrap">${lo}–${hi}</span>`
}

const linha = (n, nome, ficha, src, pos, nivel, lo, hi, jogos, gols, ass, gas, sta, tier, sel) => `
  <div style="display:flex;align-items:center;gap:5px;padding:3px 7px;background:${sel ? '#FFF3CE' : '#fff'};
    border:2px solid ${sel ? INK : 'rgba(12,12,12,.13)'};border-radius:7px;margin-bottom:3px;${sel ? `box-shadow:2px 2px 0 ${INK}` : ''}">
    <span style="${OSW};font-weight:700;font-size:9px;color:rgba(12,12,12,.38);width:13px;flex:none;text-align:right">${n}</span>
    <span style="width:26px;flex:none"><img src="${rosto(src)}" style="width:26px;height:26px;object-fit:contain;display:block"></span>
    <span style="flex:1;min-width:0">
      <span style="display:block;${OSW};font-weight:700;font-size:11px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}</span>
      <span style="display:block;${SYS};font-size:7.5px;font-weight:600;color:rgba(12,12,12,.42)">${ficha}</span></span>
    <span style="width:22px;flex:none;text-align:center"><span style="${OSW};font-weight:700;font-size:8px;background:${INK};color:${GOLD};border-radius:3px;padding:1px 4px">${pos}</span></span>
    <span style="width:46px;flex:none;text-align:center">${chipOverall(nivel, lo, hi, tier)}</span>
    <span style="width:22px;flex:none;text-align:center;${OSW};font-weight:700;font-size:10.5px;color:rgba(12,12,12,.75)">${jogos}</span>
    <span style="width:18px;flex:none;text-align:center;${OSW};font-weight:700;font-size:10.5px;color:${gols > 0 ? INK : 'rgba(12,12,12,.28)'}">${gols}</span>
    <span style="width:18px;flex:none;text-align:center;${OSW};font-weight:700;font-size:10.5px;color:${ass > 0 ? '#2F6BAE' : 'rgba(12,12,12,.28)'}">${ass}</span>
    <span style="width:42px;flex:none;display:flex;align-items:center">
      <span style="flex:1;height:6px;background:rgba(12,12,12,.14);border:1.5px solid ${INK};border-radius:4px;overflow:hidden">
        <span style="display:block;height:100%;width:${gas}%;background:${corGas(gas)}"></span></span></span>
    <span style="width:20px;flex:none;text-align:center;font-size:10px">${sta}</span></div>`

const cab = `
  <div style="display:flex;align-items:center;gap:5px;padding:0 7px 4px;${OSW};font-weight:700;font-size:7.5px;
    letter-spacing:1px;color:rgba(12,12,12,.38)">
    <span style="width:13px;text-align:right">Nº</span><span style="width:26px"></span>
    <span style="flex:1">NOME</span><span style="width:22px;text-align:center">POS</span>
    <span style="width:46px;text-align:center">OVERALL</span>
    <span style="width:22px;text-align:center">JOGOS</span><span style="width:18px;text-align:center">GOLS</span>
    <span style="width:18px;text-align:center">ASS</span><span style="width:42px;text-align:center">GÁS</span>
    <span style="width:20px;text-align:center">STA</span></div>`

const TIME = [
  [1, 'Rogério Ceni', 'São Paulo · 2005', '/avatars/lendas-v1/rogerio-ceni-sao-paulo-2005.webp', 'GOL', 'lenda', 86, 93, 28, 3, 0, 78, '⭐'],
  [2, 'Cafu', 'Milan · 2004', '/avatars/lendas-v1/cafu-milan-2004.webp', 'LAT', 'lenda', 85, 92, 26, 1, 8, 64, '⭐'],
  [4, 'Luís Pereira', 'Palmeiras · 1972', '/avatars/lendas-v1/luis-pereira-palmeiras-1972.webp', 'ZAG', 'craque', 81, 88, 27, 1, 0, 66, '⭐'],
  [16, 'Mauro Galvão', 'Vasco · 1997', '/avatars/lendas-v1/mauro-galvao-vasco-1997.webp', 'ZAG', 'bom', 68, 79, 24, 1, 3, 22, '🚑'],
  [10, 'Zico', 'Flamengo · 1981', '/avatars/lendas-v1/zico-flamengo-1981.webp', 'MEI', 'lenda', 90, 96, 27, 9, 14, 58, '⭐'],
  [20, 'Ademir da Guia', 'Palmeiras · 1972', '/avatars/lendas-v1/ademir-da-guia-palmeiras-1972.webp', 'MEI', 'craque', 82, 89, 19, 2, 7, 41, '😓'],
  [9, 'Romário', 'Barcelona · 1994', '/avatars/lendas-v1/romario-barcelona-1994.webp', 'ATA', 'lenda', 89, 95, 28, 18, 5, 67, '⭐'],
  [24, 'Jairzinho', 'Botafogo · 1970', '/avatars/lendas-v1/jairzinho-botafogo-1970.webp', 'ATA', 'craque', 83, 90, 10, 6, 1, 94, '-'],
]
const porta = `
  <div style="border:2.5px dashed ${INK};border-radius:11px;padding:7px 10px;margin-top:5px;background:#FBF6E8;
    ${SYS};font-size:9.5px;font-weight:700;color:rgba(0,0,0,.6);line-height:1.45">
    🕵️ Quer ver o <b>overall</b> dos teus jogadores aqui? É do <b>Olheiro</b>: ⭐ Craque vê até craque ·
    👑 Lenda vê TUDO — <u>toca aqui</u></div>`

const painel = (rot, cor, sub, tier, mostraPorta) => `
  <div style="flex:1;min-width:0">
    <div style="text-align:center;margin-bottom:8px">
      <span style="display:inline-block;background:${cor};color:#fff;border:3px solid ${INK};border-radius:999px;
        padding:4px 13px;${OSW};font-weight:700;font-size:11px;letter-spacing:.8px;box-shadow:3px 3px 0 ${INK}">${rot}</span></div>
    <div style="background:${CREME};border:4px solid ${INK};border-radius:16px;padding:10px;box-shadow:5px 5px 0 ${INK}">
      ${cab}
      ${TIME.map(r => linha(...r, tier, r[0] === 16)).join('')}
      ${mostraPorta ? porta : ''}
    </div>
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.5;margin-top:8px;opacity:.85">${sub}</div>
  </div>`

const bloco = (emoji, titulo, txt, cor) => `
  <div style="border:4px solid ${INK};border-radius:15px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:11px">
    <div style="display:flex;align-items:center;gap:8px;background:${cor};padding:7px 12px">
      <span style="font-size:17px;line-height:1">${emoji}</span>
      <span style="${OSW};font-weight:700;font-size:14.5px;text-transform:uppercase;color:#fff;line-height:1.1">${titulo}</span></div>
    <div style="padding:9px 12px;${OSW};font-weight:400;font-size:12.5px;line-height:1.55">${txt}</div></div>`

const abaTopo = (t, on, morta) => `
  <span style="${OSW};font-weight:700;font-size:10.5px;padding:5px 12px;border-radius:7px;
    background:${on ? GOLD : morta ? 'rgba(194,69,47,.18)' : 'rgba(255,255,255,.08)'};
    color:${on ? INK : morta ? '#FF9C8A' : 'rgba(255,255,255,.65)'};
    ${morta ? 'text-decoration:line-through;' : ''}">${t}</span>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1480px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  A REGRA DO OLHEIRO COPIADA DO CÓDIGO · DESENHO, NADA CODADO</div>
<h1 style="${OSW};font-weight:700;font-size:44px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  O overall entra — <span style="color:${GOLD};-webkit-text-stroke:1.5px ${INK}">com a trava de hoje</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 20px;max-width:1240px;opacity:.88">
  A coluna <b>OVERALL</b> entra na tabela, e ela obedece <b>exatamente</b> a regra que já roda hoje no jogo —
  eu copiei do código, não inventei. Um detalhe importante: <b>não é um número só</b>, é a <b>FAIXA</b>
  (ex.: <b>90–96</b>), no degradê do tier da carta. E, lei sua que está escrita lá:
  <i>nunca a palavra da categoria — só a cor</i>.</p>

<div style="display:flex;gap:18px;align-items:flex-start;margin-bottom:26px">
  ${painel('👑 LENDA (ouro) · VÊ TUDO', GOLD.replace('#FFC400', '#C99700'),
    'Todos com a faixa, cada um no degradê do seu tier. É o topo do olheiro.', 'ouro', false)}
  ${painel('⭐ CRAQUE (prata) · VÊ ATÉ CRAQUE', '#8b8b8b',
    'Repare: <b>Rogério Ceni, Cafu, Zico e Romário</b> (lendas) ficam <b>só com o 👑</b> — a faixa deles não aparece. É a vitrine natural do plano de cima.', 'prata', false)}
  ${painel('SEM OLHEIRO · NÃO VÊ', SLATE,
    'A coluna mostra só o selo do nível (que todo mundo já vê hoje), e a <b>porta</b> aparece embaixo — a mesma frase que já existe no jogo.', 'bege', true)}
</div>

<div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:24px">
  <div style="flex:1">
    ${bloco('🕵️', 'A regra, do jeito que o código faz', `
      <b>👑 Lenda (ouro) e batismo</b> → vê <b>TUDO</b>.<br>
      <b>⭐ Craque (prata)</b> → vê de <b>craque pra baixo</b>; a <b>lenda fica escondida</b>.<br>
      <b>Sem olheiro</b> → não vê nada, e no lugar aparece a <b>porta</b> ("Quer ver o overall? É do Olheiro").<br><br>
      É literalmente esta linha, que já está no jogo:<br>
      <code style="font-size:10.5px;background:#F1EDE0;padding:2px 5px;border-radius:4px;display:inline-block;margin-top:3px">
      if (tier !== 'ouro' && !(tier === 'prata' && c.fame < 5)) return null</code><br><br>
      <b>Por isso a coluna funciona como vitrine:</b> quem é prata olha a tabela e vê o buraco <b>exatamente
      nos melhores jogadores dele</b>. Não precisa de anúncio — a falta vende sozinha.`, GOLD)}
  </div>
  <div style="flex:1">
    ${bloco('🙋', 'As abas NÚMEROS e CONQUISTAS: eu inventei', `
      <b>Você está certo em não entender: elas não existem.</b> Eu copiei da sua referência
      ("ESTATÍSTICAS" e "CONQUISTAS") sem conferir se tinham correspondente no nosso jogo. <b>Não têm.</b><br><br>
      E o pior: o que elas mostrariam <b>já existe</b> em outro lugar —
      <b>NÚMEROS</b> seria a artilharia e os garçons, que estão na aba <b>📊 Tabelas</b>;
      <b>CONQUISTAS</b> seriam os títulos, que estão na aba <b>🏆 Rank</b>.<br><br>
      <b>Eu tiro as duas.</b> Criar aba que duplica navegação é exatamente o problema que eu reclamei no
      levantamento — e aí eu fui e fiz igual.`, VERM)}
    <div style="border:4px solid ${INK};border-radius:15px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden">
      <div style="background:${INK};padding:9px 13px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="${OSW};font-weight:700;font-size:13px;color:#fff;margin-right:6px">MEU TIME</span>
        ${abaTopo('👥 ELENCO', true)}${abaTopo('⚔️ TÁTICA', false)}${abaTopo('🏛️ COMISSÃO', false)}
        ${abaTopo('📊 NÚMEROS', false, true)}${abaTopo('🏆 CONQUISTAS', false, true)}
      </div>
      <div style="padding:9px 13px;${OSW};font-weight:400;font-size:12.5px;line-height:1.55">
        Ficam as <b>três que existem de verdade</b>: <b>ELENCO</b> (o time e a lista), <b>TÁTICA</b> (retranca /
        equilíbrio / ataque, que hoje vive solta no meio da tela) e <b>COMISSÃO</b> (técnico e preparador, hoje
        o 🏛️ Departamento Técnico). As duas riscadas somem.</div>
    </div>
  </div>
</div>

<div style="border:4px solid ${GREEN};border-radius:18px;background:#EFF7F1;padding:16px 20px">
  <div style="${OSW};font-weight:700;font-size:18px;text-transform:uppercase;color:${GREEN};margin-bottom:8px">
    ✅ Como a tabela fica, então</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    <b>Nº · NOME</b> (clube e ano) <b>· POS · OVERALL · JOGOS · GOLS · ASS · GÁS · STATUS</b>.<br>
    A coluna <b>OVERALL</b> é a mesma pra todo mundo — muda só <b>o que ela mostra</b>, conforme o olheiro:
    a faixa <b>90–96</b> pra quem paga, o selo <b>👑</b> pra quem não vê. <b>A tabela não muda de forma</b>,
    e ninguém fica com buraco na tela.<br><br>
    <b>Nada foi codado.</b> Me dá o OK e eu monto de verdade, com o seu elenco real — inclusive testando as
    três visões (ouro, prata e sem olheiro) na bancada, pra você ver as três antes de qualquer commit.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:13px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    desenho de 16/09 · nada codado<br>refazer: <b>node scripts/mockup-elenco-overall.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1480, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
