// ─── 🔨 VITRINE DOS 100 CLUBES (ideia do Diego, 21/08) ──────────────────────
//
// Palavras dele: *"quero fazer as pessoas verem os clubes no jogo"* — uma aba
// na home listando as 100 vagas da pirâmide, quem já batizou e o que está livre,
// com o preço de cada divisão. Nasceu da conversa sobre o outbid.lol.
//
// ⚠️ CORREÇÃO DO DIEGO (21/08): eu tinha desenhado "batismo é pra sempre". Ele
// corrigiu: *"n é pra sempre... esqueceu q dps q lotar qm pagar mais entra? Mas
// a pessoa pode cobrir"*. Ou seja: a vaga é DISPUTÁVEL, e quem está nela tem o
// direito de COBRIR pra ficar.
//
// 🛡️ O jeito que isso vira jogo sem quebrar ninguém: quem perde a disputa NÃO
// perde o clube — ele CAI UMA DIVISÃO. Isso já é a linguagem da pirâmide
// (acesso e rebaixamento), a arte e o nome da pessoa continuam vivos, e mesmo
// assim a briga por dinheiro nunca acaba (a Série A é sempre disputada). Só
// quem cai da Várzea é que fica sem clube — e ainda guarda 👑 Lenda, o número
// de fundador e a arte no álbum.
//
//   node scripts/mockup-vitrine-batismos.mjs --saida vitrine.png
//
// Os escudos que aparecem são os DE VERDADE, lidos de `src/escalacao/img/`.
// Clube batizado que ainda não tem `.webp` (o escudo dele é SVG no código) sai
// com um escudo NEUTRO marcado — nunca inventar arte de ninguém.
//
// A lista de clubes é lida do `data.ts` na hora, então este mockup nunca
// envelhece: bateu um batismo novo, roda de novo e ele aparece.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'vitrine-batismos.png')

// ── lê as 100 vagas direto do baralho ───────────────────────────────────────
const src = fs.readFileSync('src/escalacao/data.ts', 'utf8')
function lista(chave) {
  let txt
  if (chave === 'V') {
    const i = src.indexOf('export const VARZEA_TEAMS')
    txt = src.slice(i, src.indexOf('\n]', i))
  } else {
    const i = src.indexOf('export const DIVISION_TEAMS')
    const bl = src.slice(i, i + 14000)
    const b = bl.indexOf(`\n  ${chave}: [`)
    txt = bl.slice(b, bl.indexOf('\n  ]', b))
  }
  const out = []
  for (const m of txt.matchAll(/\{ name: '([^']+)', team: '([^']+)' \}(.*)/g)) {
    const resto = m[3]
    let dono = null
    if (resto.includes('BATIZADO')) {
      const d = /BATIZADO[^(]*\(([^)]*)\)/.exec(resto)
      dono = d ? (/^([\w.\-+]+@[\w.\-]+|[\wÀ-ÿ .\-]+?)(?: —|,|;)/.exec(d[1])?.[1] ?? d[1]).trim() : '—'
      dono = dono.replace(/@[\w.\-]+$/, '').replace(/^time do Diego.*/, 'Diego').slice(0, 26)
    }
    out.push({ time: m[2], tec: m[1], dono })
  }
  return out
}

// ── escudos DE VERDADE que existem como arquivo ─────────────────────────────
const ARTE = {
  'Tricolor do Arruda FC': 'arruda', 'Crias do Bigão': 'bigao', 'Coringas do Diniz': 'coringas',
  'Eros FC': 'eros', 'SC Ferrari': 'ferrari', 'Futpoint FC': 'futpoint', 'Nata de SP': 'nata',
  'Sapekeiros FC': 'sapek', 'Skyy FC': 'skyy', 'Theuzudo FC': 'theuzudo', 'Tôka10': 'toka10',
}
const b64 = p => fs.readFileSync(p).toString('base64')
const escudoImg = time => {
  const k = ARTE[time]
  if (!k) return null
  const f = `src/escalacao/img/${k}-escudo.webp`
  return fs.existsSync(f) ? `data:image/webp;base64,${b64(f)}` : null
}
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

// ── as 5 divisões, de cima pra baixo ────────────────────────────────────────
const DIVS = [
  { k: 'A', nome: 'SÉRIE A', ic: '🏆', preco: 'R$ 69,90', cor: '#FFC400', escuro: '#8A6A00',
    linha: 'A elite. É a lista que aparece no ONLINE, na hora de escolher os rivais da sala.', online: true },
  { k: 'B', nome: 'SÉRIE B', ic: '🥈', preco: 'R$ 59,90', cor: '#C9CDD4', escuro: '#5A5F68',
    linha: 'Um degrau da elite. Quem cobre o lance mais baixo da Série A, sobe.' },
  { k: 'C', nome: 'SÉRIE C', ic: '🥉', preco: 'R$ 49,90', cor: '#D08B4A', escuro: '#7A4B18',
    linha: 'O meio da pirâmide. Time de tradição brigando pra voltar.' },
  { k: 'D', nome: 'SÉRIE D', ic: '⚽', preco: 'R$ 39,90', cor: '#7FB77E', escuro: '#2F5E2E',
    linha: 'Onde quase todo mundo começa a carreira. Muito jogo, muito clássico.' },
  { k: 'V', nome: 'VÁRZEA', ic: '🍺', preco: 'R$ 29,90', cor: '#B79CD6', escuro: '#4A2F70',
    linha: 'O peladão raiz. O degrau mais barato pra botar o nome no jogo.' },
]

const dados = DIVS.map(d => ({ ...d, vagas: lista(d.k) }))
const totalBat = dados.reduce((s, d) => s + d.vagas.filter(v => v.dono).length, 0)

// 💰 valores de EXEMPLO só pro mockup — o Diego ainda não fechou a tabela.
// Numa tela de verdade isso vem do banco (o lance que segura a vaga).
const exemploLance = (d, i) => {
  const base = Number(d.preco.replace(/[^0-9,]/g, '').replace(',', '.'))
  return (base + (i % 5) * 10).toFixed(2).replace('.', ',')
}
// 🔥 uma vaga EM DISPUTA no mockup, pra mostrar o direito de cobrir
const EM_DISPUTA = 'Coringas do Diniz'

const chip = (v, d, i) => {
  if (v.dono) {
    const img = escudoImg(v.time)
    const brasao = img
      ? `<img class="esc" src="${img}" alt="">`
      : `<span class="esc neutro" style="--c:${d.escuro}">${v.time.replace(/^(O |A |Os )/, '').charAt(0)}</span>`
    if (v.time === EM_DISPUTA) {
      return `<div class="chip disputa">
        ${brasao}
        <div class="txt"><b>${v.time}</b><small class="fogo">🔥 EM DISPUTA · cobrir até 23h</small></div>
        <span class="val">R$ 120,00</span>
      </div>`
    }
    return `<div class="chip tem">
      ${brasao}
      <div class="txt"><b>${v.time}</b><small>🖋️ ${v.dono}</small></div>
      <span class="val">R$ ${exemploLance(d, i)}</span>
    </div>`
  }
  return `<div class="chip livre">
    <span class="esc vazio">${v.time.replace(/^(O |A |Os )/, '').charAt(0)}</span>
    <div class="txt"><b>${v.time}</b><small>🟢 LIVRE</small></div>
    <span class="val livre">${d.preco}</span>
  </div>`
}

const blocos = dados.map(d => {
  const bat = d.vagas.filter(v => v.dono).length
  const livres = d.vagas.length - bat
  return `<section class="div">
    <div class="cab" style="--c:${d.cor};--e:${d.escuro}">
      <div class="cabL">
        <span class="ic">${d.ic}</span>
        <div>
          <h2>${d.nome}</h2>
          <p>${d.linha}</p>
        </div>
      </div>
      <div class="cabR">
        ${d.online ? '<span class="badge">📺 aparece no online</span>' : ''}
        <span class="preco">${d.preco}</span>
        <span class="conta"><b>${livres}</b> livre${livres === 1 ? '' : 's'} · ${bat} batizada${bat === 1 ? '' : 's'}</span>
      </div>
    </div>
    <div class="grade">${d.vagas.map((v, i) => chip(v, d, i)).join('')}</div>
  </section>`
}).join('')

const html = `<style>
 @font-face{font-family:Oswald;src:url(${fonte(500)}) format('woff2');font-weight:500}
 @font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
 @font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
 *{box-sizing:border-box}
 body{width:940px;margin:0;background:#F4ECD6;color:#0C0C0C;padding:30px 26px 22px;
      font-family:system-ui,'Segoe UI',Roboto,sans-serif}
 .pill{display:inline-flex;align-items:center;gap:8px;background:#FFC400;border:3px solid #0C0C0C;
   border-radius:999px;padding:7px 16px;font-family:Oswald;font-weight:700;font-size:14px;
   text-transform:uppercase;letter-spacing:.06em;box-shadow:3px 3px 0 #0C0C0C}
 h1{font-family:Oswald;font-weight:700;font-size:52px;line-height:.94;margin:14px 0 6px;text-transform:uppercase}
 h1 em{font-style:normal;color:#C2452F}
 .sub{font-size:15px;font-weight:600;line-height:1.5;margin:0 0 16px;max-width:730px}
 .resumo{display:flex;gap:10px;margin-bottom:22px}
 .rz{flex:1;background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:11px 14px}
 .rz b{display:block;font-family:Oswald;font-weight:700;font-size:30px;line-height:1}
 .rz small{font-size:11px;font-weight:700;color:rgba(0,0,0,.55);text-transform:uppercase;letter-spacing:.05em}
 .div{margin-bottom:20px}
 .cab{display:flex;align-items:center;justify-content:space-between;gap:12px;
   background:var(--c);border:3.5px solid #0C0C0C;border-radius:18px 18px 0 0;padding:11px 15px;
   border-bottom-width:0}
 .cabL{display:flex;align-items:center;gap:11px;min-width:0}
 .ic{font-size:30px;line-height:1}
 .cab h2{font-family:Oswald;font-weight:700;font-size:25px;margin:0;line-height:1;text-transform:uppercase}
 .cab p{margin:3px 0 0;font-size:11.5px;font-weight:700;color:rgba(12,12,12,.72);line-height:1.35;max-width:430px}
 .cabR{display:flex;align-items:center;gap:8px;flex:none}
 .badge{background:#0C0C0C;color:#fff;border-radius:999px;padding:4px 10px;font-family:Oswald;
   font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
 .preco{background:#fff;border:2.5px solid #0C0C0C;border-radius:11px;padding:5px 11px;
   font-family:Oswald;font-weight:700;font-size:19px;box-shadow:2px 2px 0 #0C0C0C;white-space:nowrap}
 .conta{font-size:10.5px;font-weight:800;color:rgba(12,12,12,.7);text-align:right;line-height:1.2;white-space:nowrap}
 .conta b{font-size:15px;display:block}
 .grade{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;background:#fff;
   border:3.5px solid #0C0C0C;border-radius:0 0 18px 18px;box-shadow:5px 5px 0 #0C0C0C;padding:11px}
 .chip{display:flex;align-items:center;gap:8px;border-radius:11px;padding:6px 8px;min-width:0}
 .chip.tem{background:#F7F2E4;border:2.5px solid #0C0C0C}
 .chip.livre{background:repeating-linear-gradient(45deg,#fff 0 7px,#F4ECD6 7px 14px);
   border:2.5px dashed rgba(12,12,12,.42)}
 .esc{width:32px;height:32px;flex:none;object-fit:contain;display:flex;align-items:center;
   justify-content:center;border-radius:8px}
 .esc.neutro{background:var(--c);color:#fff;font-family:Oswald;font-weight:700;font-size:17px;
   border:2px solid #0C0C0C}
 .esc.vazio{background:rgba(12,12,12,.07);color:rgba(12,12,12,.32);font-family:Oswald;
   font-weight:700;font-size:17px;border:2px dashed rgba(12,12,12,.3)}
 .txt{min-width:0}
 .txt b{display:block;font-family:Oswald;font-weight:600;font-size:12.5px;line-height:1.15;
   white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .txt small{display:block;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);
   white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .chip{position:relative}
 .chip.disputa{background:#FFF1E8;border:2.5px solid #C2452F;box-shadow:0 0 0 3px rgba(232,80,58,.18)}
 .val{margin-left:auto;flex:none;font-family:Oswald;font-weight:700;font-size:12px;
   background:#0C0C0C;color:#fff;border-radius:7px;padding:2px 7px;white-space:nowrap}
 .val.livre{background:#1B7A3D}
 .chip.disputa .val{background:#C2452F}
 .fogo{color:#C2452F!important;font-weight:800!important}
 .chip.livre .txt b{color:rgba(12,12,12,.55)}
 .chip.livre .txt small{color:#1B7A3D;font-weight:800}
 .como{background:#0C0C0C;color:#fff;border-radius:18px;padding:15px 18px;margin-top:4px}
 .como h3{font-family:Oswald;font-weight:700;font-size:17px;margin:0 0 9px;text-transform:uppercase;letter-spacing:.05em}
 .passos{display:flex;gap:10px}
 .passo{flex:1;background:rgba(255,255,255,.08);border-radius:12px;padding:10px 12px}
 .passo b{display:block;font-family:Oswald;font-weight:600;font-size:13px;margin-bottom:3px}
 .passo span{font-size:11px;font-weight:600;color:rgba(255,255,255,.72);line-height:1.4}
 .rod{display:flex;justify-content:space-between;align-items:center;margin-top:14px;
   font-size:11px;font-weight:700;color:rgba(0,0,0,.45)}
 .nota{font-size:10.5px;font-weight:700;color:rgba(0,0,0,.45);margin:6px 0 18px;line-height:1.45}
</style>
<span class="pill">🔨 os 100 clubes do leilão legends</span>
<h1>Bota o seu nome<br><em>na pirâmide.</em></h1>
<p class="sub">São <b>100 clubes</b>, da Várzea à Série A, e cada um leva o nome de uma pessoa — com escudo,
mascote e manto próprios. <b>Quem paga mais fica na divisão mais alta</b>, que é onde mais gente vê o seu clube
jogando. Chegou alguém cobrindo o seu lance? <b>Você tem 24h pra cobrir de volta e ficar.</b></p>

<div class="resumo">
  <div class="rz"><b>100</b><small>clubes na pirâmide</small></div>
  <div class="rz"><b>${totalBat}</b><small>já batizados</small></div>
  <div class="rz" style="background:#DFF3E3"><b style="color:#1B7A3D">${100 - totalBat}</b><small>vagas livres</small></div>
  <div class="rz" style="background:#FFF1E8"><b style="color:#C2452F">1</b><small>vaga em disputa agora</small></div>
</div>

${blocos}

<p class="nota">🛡️ <b>Ninguém fica sem clube por ser coberto.</b> Perdeu a disputa e não cobriu? O clube
<b>cai uma divisão</b> — o nome, o escudo e o mascote continuam seus, no jogo. Escudo com desenho é a arte de
verdade do clube; a bolinha com a letra é só espaço reservado neste mockup. Valores aqui são exemplo.</p>

<div class="como">
  <h3>🔨 Como funciona a disputa</h3>
  <div class="passos">
    <div class="passo"><b>1. Tem vaga livre? É sua</b><span>Paga o preço do degrau e o clube entra no jogo com o teu nome, escudo e mascote.</span></div>
    <div class="passo"><b>2. Lotou? Você cobre</b><span>Dá um lance acima do <b>menor lance daquela divisão</b> — mínimo R$ 5 a mais. Não dá pra pular de R$ 70 pra R$ 1.000 e matar a briga.</span></div>
    <div class="passo"><b>3. Quem tá lá tem 24h</b><span>O dono recebe o aviso e pode <b>cobrir de volta</b>. Cobriu, fica. Não cobriu, <b>cai uma divisão</b> — e nunca perde o clube.</span></div>
    <div class="passo"><b>4. Sempre dá pra subir</b><span>A Série A é a que aparece no online. Enquanto tiver alguém querendo subir, a briga não acaba.</span></div>
  </div>
</div>

<div class="rod"><span>⚽ Leilão <b style="color:#C2452F">Legends</b></span><span>leilaolegends.com</span></div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 940, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.waitForTimeout(600)
await p.screenshot({ path: saida, fullPage: true })
await b.close()
console.log(`${saida} · ${Math.round(fs.statSync(saida).size / 1024)} KB`)
