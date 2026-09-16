// 👥 A ABA ELENCO, REFEITA DO ZERO (Diego 16/09)
//
// Ele: *"eu falei do elenco, cara, que a gente tava falando"* — ou seja, a pergunta
// "como você reformularia sem ser influenciado por mim" era sobre a ABA ELENCO.
//
// ⚠️ OPINIÃO, e nada foi codado. A tela da direita é DESENHO; a da esquerda é a tela
// REAL de hoje, fotografada pela bancada (`navega-carreira.mjs --fase abas`).
//
// A pergunta que eu me fiz antes de desenhar: pra que serve esta aba? Ela faz TRÊS
// trabalhos que hoje estão embaralhados —
//   1. ESCALAR (quem joga a próxima) · 2. CONHECER (quem eu tenho e como está) ·
//   3. GERIR (técnico, preparador, base, folha, agência).
// Hoje eles vêm intercalados: campinho → Depto Técnico → Base → folha → só então a
// lista. Quem entra pra trocar um jogador atravessa a gerência no caminho.
//
// Rodar: node scripts/mockup-elenco-do-zero.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-elenco-do-zero.png')
const VERM = '#C2452F', ROXO = '#7C3AED', SLATE = '#3E4A5A', BEGE = '#B2A583'
const png = c => `data:image/png;base64,${readFileSync(c).toString('base64')}`
const SYS = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"

// uma linha de jogador: tudo o que importa cabe numa linha só
const jog = (pos, nome, ficha, titular, gas, selo) => `
  <div style="display:flex;align-items:center;gap:7px;padding:5px 7px;background:#fff;border-radius:8px;
    border:2px solid ${titular ? 'rgba(12,12,12,.85)' : 'rgba(12,12,12,.16)'};margin-bottom:4px">
    <span style="width:6px;height:6px;border-radius:999px;flex:none;
      background:${titular ? GREEN : 'transparent'};border:2px solid ${titular ? GREEN : 'rgba(12,12,12,.3)'}"></span>
    <span style="flex:1;min-width:0">
      <span style="display:block;${OSW};font-weight:700;font-size:11.5px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}${selo ? ` <span style="font-size:9px">${selo}</span>` : ''}</span>
      <span style="display:block;${SYS};font-size:8.5px;font-weight:600;color:rgba(12,12,12,.45)">${ficha}</span></span>
    <span style="width:26px;height:4px;background:rgba(12,12,12,.12);border-radius:2px;flex:none;overflow:hidden">
      <span style="display:block;height:100%;width:${gas}%;background:${gas > 55 ? GREEN : gas > 30 ? '#D98324' : VERM}"></span></span>
  </div>`

const setor = (nome, tem, aviso, linhas) => `
  <div style="margin-bottom:9px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
      <span style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.3px;color:${aviso ? VERM : 'rgba(12,12,12,.5)'}">${nome}</span>
      <span style="flex:1;height:2px;background:rgba(12,12,12,.1)"></span>
      <span style="${OSW};font-weight:700;font-size:10.5px;color:${aviso ? VERM : 'rgba(12,12,12,.45)'}">${tem}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">${linhas}</div>
  </div>`

const bolinha = (ini, tag, nome) => `
  <div style="text-align:center;flex:none;width:52px">
    <div style="width:27px;height:27px;margin:0 auto;border-radius:999px;background:linear-gradient(160deg,#DBD1B5,#B2A583);
      border:2.5px solid ${INK};display:flex;align-items:center;justify-content:center;${OSW};font-weight:700;font-size:12px">${ini}</div>
    <div style="${OSW};font-weight:700;font-size:7px;background:${INK};color:#fff;border-radius:3px;padding:0 3px;display:inline-block;margin-top:3px">${tag}</div>
    <div style="${OSW};font-weight:700;font-size:7.5px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}</div>
  </div>`

const telaNova = `
<div style="width:352px;background:${CREME};border:5px solid ${INK};border-radius:24px;overflow:hidden;box-shadow:7px 7px 0 ${INK}">
  <!-- 1. cabeçalho fino: os três números do elenco num lugar só -->
  <div style="background:${INK};color:#fff;display:flex;align-items:baseline;gap:7px;padding:8px 11px">
    <span style="${OSW};font-weight:700;font-size:13.5px;flex:1">Elenco</span>
    <span style="${OSW};font-weight:700;font-size:13px">22</span>
    <span style="${SYS};font-size:9.5px;font-weight:700;color:rgba(255,255,255,.55)">jogadores</span>
    <span style="${OSW};font-weight:700;font-size:13px;color:${GOLD};margin-left:5px">675</span>
    <span style="${SYS};font-size:9.5px;font-weight:700;color:rgba(255,255,255,.55)">de elenco · folha 50</span>
  </div>

  <!-- 2. o que está ERRADO agora, uma linha, só quando existe -->
  <div style="background:#FDF1EE;border-bottom:2px solid rgba(194,69,47,.35);padding:7px 11px;display:flex;align-items:center;gap:7px">
    <span style="font-size:13px">⚠️</span>
    <span style="${SYS};font-size:10.5px;font-weight:700;color:#7d2d1f;line-height:1.35;flex:1">
      <b>Aldair</b> está no vermelho e é titular · o gol tem <b>só 2</b></span>
  </div>

  <!-- 3. o campinho: a ferramenta de escalar -->
  <div style="background:linear-gradient(180deg,#2d7a41,#1b5b2c);padding:11px 8px 9px">
    <div style="display:flex;justify-content:center;gap:4px;margin-bottom:7px">${bolinha('A','ATA','Adriano')}${bolinha('J','ATA','Juninho')}</div>
    <div style="display:flex;justify-content:center;gap:4px;margin-bottom:7px">${bolinha('M','MEI','Mozer')}${bolinha('R','MEI','Raí')}${bolinha('D','MEI','Djalminha')}${bolinha('E','MEI','Edmundo')}</div>
    <div style="display:flex;justify-content:center;gap:4px;margin-bottom:7px">${bolinha('L','LAT','Lúcio')}${bolinha('R','ZAG','Romário')}${bolinha('C','ZAG','Careca')}${bolinha('R','LAT','R. Carlos')}</div>
    <div style="display:flex;justify-content:center">${bolinha('R','GOL','R. Ceni')}</div>
  </div>
  <div style="${SYS};font-size:9.5px;font-weight:700;color:rgba(12,12,12,.5);text-align:center;padding:6px 0 3px">
    toque num jogador e depois no outro da mesma posição pra trocar</div>

  <!-- 4. a lista AGRUPADA POR POSIÇÃO -->
  <div style="padding:6px 11px 11px">
    ${setor('GOLEIROS', '2', true,
      jog('GOL', 'Rogério Ceni', 'São Paulo · 1990', true, 78) + jog('GOL', 'Taffarel', 'Santos · 2001', false, 96))}
    ${setor('LATERAIS', '4', false,
      jog('LAT', 'Lúcio', 'Inter · 1993', true, 71) + jog('LAT', 'R. Carlos', 'Real Madrid · 1994', true, 64) +
      jog('LAT', 'Cafu', 'Milan · 1991', false, 92) + jog('LAT', 'Júnior', 'São Paulo · 2002', false, 88))}
    ${setor('ZAGUEIROS', '4', false,
      jog('ZAG', 'Romário', 'Vasco · 1998', true, 59) + jog('ZAG', 'Careca', 'Palmeiras · 1999', true, 66) +
      jog('ZAG', 'Aldair', 'Roma · 1992', false, 22, '🚑') + jog('ZAG', 'Bebeto', 'Botafogo · 2000', false, 95))}
    ${setor('MEIAS', '8', false,
      jog('MEI', 'Mozer', 'Milan · 2003', true, 74) + jog('MEI', 'Raí', 'Roma · 2004', true, 69) +
      jog('MEI', 'Djalminha', 'Inter · 2005', true, 58) + jog('MEI', 'Edmundo', 'Real Madrid · 2006', true, 61) +
      jog('MEI', 'Kaká', 'Flamengo · 2009', false, 90) + jog('MEI', 'Marcelo', 'Corinthians · 2008', false, 93) +
      jog('MEI', 'Túlio', 'Internacional · 2007', false, 41, '😓') + jog('MEI', 'Ronaldinho', 'Palmeiras · 2011', false, 97))}
    ${setor('ATACANTES', '4', false,
      jog('ATA', 'Adriano', 'Botafogo · 2012', true, 67) + jog('ATA', 'Juninho', 'Santos · 2013', true, 72) +
      jog('ATA', 'Denílson', 'São Paulo · 2014', false, 89) + jog('ATA', 'Vampeta', 'Roma · 2016', false, 94))}
  </div>

  <!-- 5. o que é GERÊNCIA sai do caminho e vira atalho -->
  <div style="display:flex;gap:6px;padding:0 11px 12px">
    ${[['🏛️', 'Técnico', '1 vaga'], ['🌱', 'Base', '11 vagas'], ['🕴️', 'Agenciados', '4']].map(([e, t, s]) => `
      <span style="flex:1;background:#fff;border:2.5px solid ${INK};border-radius:11px;padding:7px 5px;text-align:center;
        box-shadow:2px 2px 0 ${INK}">
        <span style="display:block;font-size:15px;line-height:1">${e}</span>
        <span style="display:block;${OSW};font-weight:700;font-size:10px;margin-top:2px">${t}</span>
        <span style="display:block;${SYS};font-size:8.5px;font-weight:600;color:rgba(12,12,12,.45)">${s}</span></span>`).join('')}
  </div>
</div>`

const ponto = (n, titulo, hoje, eu, cor) => `
  <div style="border:4px solid ${INK};border-radius:16px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:9px;background:${cor};padding:8px 13px">
      <span style="background:rgba(255,255,255,.95);color:${cor};${OSW};font-weight:700;font-size:14px;width:23px;height:23px;
        border-radius:999px;display:flex;align-items:center;justify-content:center;flex:none">${n}</span>
      <span style="${OSW};font-weight:700;font-size:15.5px;text-transform:uppercase;color:#fff;flex:1;line-height:1.1">${titulo}</span></div>
    <div style="padding:10px 13px;${OSW};font-weight:400;font-size:13px;line-height:1.55">
      <div style="margin-bottom:5px"><b style="color:${VERM}">Hoje:</b> ${hoje}</div>
      <div><b style="color:${GREEN}">Eu faria:</b> ${eu}</div></div></div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1340px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  SÓ A ABA ELENCO · OPINIÃO MINHA, SEM FILTRO · NADA FOI CODADO</div>
<h1 style="${OSW};font-weight:700;font-size:44px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  O elenco, <span style="color:${ROXO}">do zero</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 20px;max-width:1180px;opacity:.88">
  A pergunta que eu me fiz antes de desenhar: <b>pra que serve esta aba?</b> Ela faz <b>três</b> trabalhos —
  <b>escalar</b> (quem joga a próxima), <b>conhecer</b> (quem eu tenho e como está) e <b>gerir</b> (técnico,
  preparador, base, folha, agência). Hoje os três vêm <b>intercalados</b>: campinho → Depto Técnico → Base →
  folha → e só então a lista. Quem entrou pra trocar um jogador <b>atravessa a gerência no caminho</b>.</p>

<div style="display:flex;gap:24px;align-items:flex-start">
  <div style="flex:none;text-align:center">
    <div style="display:inline-block;background:#8a8069;color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;margin-bottom:9px;box-shadow:3px 3px 0 ${INK}">HOJE · 3,8 TELAS</div>
    <div style="width:300px;height:1180px;overflow:hidden;border:5px solid ${INK};border-radius:22px;box-shadow:7px 7px 0 ${INK};background:#000">
      <img src="${png('/tmp/carreira-telas/aba-Elenco-tudo.png')}" style="width:300px;display:block">
    </div>
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;margin-top:9px;width:300px;text-align:left;opacity:.82">
      (o topo da tela; ela continua por mais 2 telas)</div>
  </div>

  <div style="flex:none;text-align:center">
    <div style="display:inline-block;background:${ROXO};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 15px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;margin-bottom:9px;box-shadow:3px 3px 0 ${INK}">COMO EU FARIA</div>
    ${telaNova}
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;margin-top:9px;width:352px;text-align:left;opacity:.82">
      <b>Tudo isto cabe em ~1,6 tela</b>: os 22 jogadores, o campinho, o aviso do que está errado e os três
      atalhos. Nada foi removido — só reorganizado.</div>
  </div>

  <div style="flex:1">
    ${ponto(1, 'Agrupar por POSIÇÃO, não por titular/reserva', 
      'Duas colunas: ⭐ Titulares de um lado, 🔁 Reservas do outro. Pra achar um substituto você <b>filtra por posição com o olho</b>, linha por linha.',
      'Um bloco por setor — <b>GOLEIROS · LATERAIS · ZAGUEIROS · MEIAS · ATACANTES</b> — com bolinha <b>cheia</b> pra titular e <b>vazia</b> pra reserva. Técnico não pensa "quem é reserva": pensa <b>"quem substitui meu goleiro?"</b>. E a troca do jogo <b>já exige a mesma posição</b> — a tela passa a falar a língua da regra.', ROXO)}
    ${ponto(2, 'A escassez aparece sozinha',
      'O jogo te avisa por texto, no pé da tela, em parágrafo. O "só tenho 2 goleiros" você só descobre contando.',
      'O contador fica no título do setor — <b>GOLEIROS 2</b>, em vermelho quando está no osso. Aquele problema dos 2 goleiros que a gente descobriu medindo <b>vira óbvio na tela</b>, sem eu precisar te explicar em texto.', VERM)}
    ${ponto(3, 'Uma linha diz tudo do jogador',
      'Nome e clube na lista · gás em barrinha · lesão/suspensão em outro lugar · emprestado num chip cinza. Espalhado.',
      '<b>Uma linha por jogador</b>: nome, clube·ano, a barrinha de gás e o selo do que está acontecendo (🚑 lesionado · 😓 cansado · 🔄 da SAF). Bate o olho e sabe.', GREEN)}
    ${ponto(4, 'A gerência sai do meio do caminho',
      'Depto Técnico, Base e folha ficam <b>entre</b> o campinho e a lista — você atravessa três caixas grandes pra chegar nos seus jogadores.',
      'Viram <b>três atalhos pequenos no pé</b>, com o número que importa (1 vaga · 11 vagas · 4). Continuam a um toque; só param de atrapalhar quem veio escalar.', SLATE)}
    ${ponto(5, 'O problema do buraco nem existe',
      'Duas colunas fixas de tamanhos diferentes = vazio na esquerda quando o elenco cresce.',
      'Como cada setor é um bloco de 2 colunas, no máximo sobra <b>meia linha</b> num setor ímpar. E o elenco pode crescer pra 27 <b>sem mudar nada</b> da estrutura — o setor só ganha mais uma linha.', GOLD)}
  </div>
</div>

<div style="border:4px solid ${GREEN};border-radius:18px;background:#EFF7F1;padding:16px 20px;margin-top:20px">
  <div style="${OSW};font-weight:700;font-size:18px;text-transform:uppercase;color:${GREEN};margin-bottom:9px">
    🎯 A conta de altura, que foi o que começou esta conversa</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    Hoje a lista são <b>16 linhas</b> (a coluna mais comprida) + 2 títulos. Agrupada por posição, com 2 colunas
    dentro de cada setor, são <b>11 linhas</b> + 5 títulos — e <b>nenhum buraco</b>. Com o elenco em 27, viram
    <b>14 linhas</b> + 5 títulos, ainda menos que as 16 de hoje com 22.<br>
    Ou seja: <b>a mesma mudança que deixa a tela mais fácil de entender também abre espaço</b> pro elenco maior
    que você queria. Não precisa escolher entre as duas coisas.<br><br>
    <b>Isto é opinião e não foi codado.</b> Se quiser, eu monto essa tela de verdade com o seu elenco real,
    como fiz com as outras, pra você ver rodando antes de decidir.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:13px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    opinião de 16/09 · nada foi codado<br>refazer: <b>node scripts/mockup-elenco-do-zero.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1340, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
