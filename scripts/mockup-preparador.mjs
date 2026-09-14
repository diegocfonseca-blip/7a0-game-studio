// 🖼️ MOCKUP — 🏛️ DEPARTAMENTO TÉCNICO + PREPARADOR FÍSICO CONTRATÁVEL
// Pedido do Diego (14/09): *"a gente tem que tirar esse botão de rodiziar, e só
// aparecer esse botão se comprar o preparador físico… ele vai ter salário também…
// e também vai ter contrato de renovação. Inclusive técnico e o preparador físico
// agora eles têm que ter uma área dividida dos jogadores ali no mesmo local…
// departamento técnico"*.
// 🪜 2ª volta (14/09): ele pediu um QUARTO degrau, o 💎 roxo da categoria promessa,
// *"pq acho q o preparador de seleção deveria encher o tanque em menos rodadas
// ainda"* — ou seja, o topo ficou mais forte e abriu espaço no meio. Ficou:
// 🟢 Rui Faria (100) · 💎 Antonio Pintus (300) · ⭐ Paulo Paixão (600) ·
// 👑 Paco Seirulo (1000). Salário = 10% do preço por temporada (regra do técnico).
// NADA aqui está no jogo — é só pra ele aprovar o visual antes de codar (regra nº 2).
// Rodar: node scripts/mockup-preparador.mjs
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', CREME = '#F4ECD6'
// os MESMOS degradês dos tiers em apoio.tsx — cor de tier é sagrada, não se inventa
const G_VERDE = 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)'
const G_ROXO  = 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)'
const G_PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'
const G_OURO  = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

// ── a caixa amarela que JÁ EXISTE hoje na aba Elenco (o aviso do preparador) ──
const caixaHoje = (variante) => `
<div class="prep">
  <p class="pt"><span>🧑‍⚕️ Preparador físico</span><b class="q">?</b></p>
  <p class="pl">🥵 <b style="color:${RED}">Lúcio</b> &nbsp; 😓 <b style="color:#B8860B">Sócrates, Romário</b></p>
  ${variante === 'livre' ? `
  <div class="pbs">
    <button class="rod">🔁 RODIZIAR<span>Mozer no lugar de Lúcio · Raí no lugar de Sócrates</span></button>
    <button class="auto">🤖 AUTOMÁTICO<span>desligado</span></button>
  </div>` : ''}
  ${variante === 'travado' ? `
  <div class="trava">
    <b>🔒 Você não tem preparador físico</b>
    <span>Sem ele o rodízio é na mão: toque no cansado e no reserva pra trocar.
    Pra ter o botão 🔁 RODIZIAR (e o automático), contrate um preparador no
    <b>Departamento Técnico</b>, logo abaixo do campinho.</span>
  </div>` : ''}
</div>`

// ── o campinho, bem resumido (é só pra dar o lugar na tela) ──────────────────
const campo = `<div class="campo">
  <div class="cl">${'<i></i>'.repeat(3)}</div>
  <div class="cl">${'<i></i>'.repeat(3)}</div>
  <div class="cl">${'<i></i>'.repeat(4)}</div>
  <div class="cl">${'<i></i>'.repeat(1)}</div>
</div>`

// ── ficha de um contratado do departamento ──────────────────────────────────
const ficha = ({ emoji, papel, nome, sub, valor, grad, contrato, vencido }) => `
<div class="fic">
  <div class="fav" style="background:${grad}">${emoji}</div>
  <div class="fin">
    <span class="fpa">${papel}</span>
    <span class="fno">${nome}</span>
    <span class="fsu">${sub}</span>
    <span class="fnu">💰 ${valor} · 💸 salário <b>${Math.round(valor / 10)}</b>/temporada · 📝 ${contrato}
      ${vencido ? `<b class="venc">(VENCIDO — renove por ${valor} 🪙)</b>` : ''}</span>
  </div>
</div>`

const vaga = `<div class="vaga">
  <b>🏋️ Preparador físico — vaga aberta</b>
  <span>Ele é quem libera o botão <b>🔁 RODIZIAR</b> e o rodízio automático, e faz o
  jogador <b>recuperar mais gás</b> em cada rodada no banco.</span>
  <button class="cta">CONTRATAR PREPARADOR</button>
</div>`

const depto = (conteudo) => `
<div class="dep">
  <div class="dh"><span class="dht">🏛️ Departamento Técnico</span><span class="dhs">comissão — não entram em campo</span></div>
  ${conteudo}
</div>`

const TEC = { emoji: '🧢', papel: 'TÉCNICO', nome: 'Telê Santana', sub: '⭐ Craque · 4-3-3 · 4-4-2 · 3-5-2', valor: 120, grad: G_PRATA, contrato: 'faltam 3 temporadas' }
const PREP = { emoji: '🏋️', papel: 'PREPARADOR FÍSICO', nome: 'Rui Faria', sub: '🟢 Bom · o titular joga 4 seguidas e senta 1', valor: 100, grad: G_VERDE, contrato: 'faltam 5 temporadas' }

// ── a lojinha do preparador (o que abre no CONTRATAR) ───────────────────────
// ⚖️ o banco hoje devolve +4 e cada jogo gasta 1,4 → "joga 2, senta 1" é o ritmo
// em que o tanque nunca desce. Os quatro só mexem NESSE número.
const LOJA = [
  { grad: G_VERDE, selo: '🟢', cat: 'BOM', nome: 'Rui Faria', pais: '🇵🇹', bio: 'Começou como preparador físico do Mourinho e virou auxiliar dele no Porto, Chelsea, Inter, Real e United.', preco: 100, banco: 6 },
  { grad: G_ROXO, selo: '💎', cat: 'PROMESSA', nome: 'Antonio Pintus', pais: '🇮🇹', bio: 'Preparador físico da Juventus, Inter, Monaco e do Real Madrid.', preco: 300, banco: 9 },
  { grad: G_PRATA, selo: '⭐', cat: 'CRAQUE', nome: 'Paulo Paixão', pais: '🇧🇷', bio: 'Preparador físico da Seleção Brasileira em quatro Copas do Mundo seguidas.', preco: 600, banco: 12 },
  { grad: G_OURO, selo: '👑', cat: 'LENDA', nome: 'Paco Seirulo', pais: '🇪🇸', bio: 'Décadas no Barcelona — a preparação física por trás da era mais vitoriosa do clube.', preco: 1000, banco: 20 },
]
const seguidas = b => Math.floor(b / 1.4)
const encher = b => Math.ceil(100 / b)
const cardLoja = (p) => `<div class="lj" style="background:${p.grad}">
  <div class="ljin">
    <span class="ljc">${p.selo} ${p.cat}</span>
    <span class="ljn">${p.nome} <i>${p.pais}</i></span>
    <span class="ljb">${p.bio}</span>
    <span class="ljr">o titular joga <b>${seguidas(p.banco)} seguidas</b> e senta 1 — e nunca cansa
      <i>tanque vazio enche em ${encher(p.banco)} rodadas no banco (hoje: 25)</i></span>
    <button class="ljbt">${p.preco} 🪙 <span>salário ${p.preco / 10}/temporada · contrato de 5</span></button>
  </div>
</div>`

const painel = (titulo, fita, corpo) => `<div class="pan">
  <div class="ph" style="background:${fita}">${titulo}</div>
  <div class="pb">${corpo}</div>
</div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:${CREME};font-family:system-ui;color:${INK};width:1560px;padding:30px}
 h1{font-family:Oswald;font-size:38px;margin:0 0 4px;text-transform:uppercase}
 p.sub{font-size:17px;color:#4a4636;margin:0 0 24px;line-height:1.5;max-width:1180px}
 .grid{display:flex;gap:20px;align-items:flex-start;margin-bottom:22px}
 .pan{width:430px;background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};overflow:hidden}
 .ph{font-family:Oswald;font-weight:900;font-size:16px;text-transform:uppercase;padding:9px 13px;border-bottom:4px solid ${INK};letter-spacing:.5px}
 .pb{padding:12px;background:${CREME}}

 /* caixa amarela do preparador (a que já existe) */
 .prep{border:3px solid ${INK};background:#FFF6D6;border-radius:11px;padding:9px 12px;margin-bottom:10px;box-shadow:3px 3px 0 ${INK}}
 .pt{font-family:Oswald;font-weight:900;font-size:11px;letter-spacing:.6px;color:#5a5647;margin:0;text-transform:uppercase;display:flex;align-items:center}
 .pt span{flex:1} .pt .q{width:19px;height:19px;border-radius:99px;border:2px solid ${INK};background:#fff;font-size:11px;text-align:center;line-height:15px}
 .pl{font-size:12px;font-weight:700;margin:5px 0 0}
 .pbs{display:flex;gap:6px;margin-top:8px}
 .rod{flex:1.4;border:2.5px solid ${INK};border-radius:9px;padding:7px 9px;font-family:Oswald;font-weight:900;font-size:12px;background:${GREEN};color:#fff;box-shadow:2px 2px 0 ${INK};text-align:left}
 .rod span,.auto span{display:block;font-family:system-ui;font-weight:700;font-size:9px;opacity:.9;text-transform:none;margin-top:1px}
 .auto{flex:1;border:2.5px solid ${INK};border-radius:9px;padding:7px 8px;font-family:Oswald;font-weight:900;font-size:11px;background:#fff;color:${INK};box-shadow:2px 2px 0 ${INK};text-align:center}
 .trava{margin-top:8px;border:2.5px dashed #8a6d00;border-radius:9px;background:#FFFBEC;padding:8px 10px}
 .trava>b{display:block;font-family:Oswald;font-size:12.5px;color:#8a6d00}
 .trava>span{display:block;font-size:10.5px;font-weight:700;color:#6b5a1f;line-height:1.45;margin-top:3px}

 /* campinho resumido */
 .campo{border:3px solid ${INK};border-radius:12px;overflow:hidden;margin-bottom:10px;background:repeating-linear-gradient(180deg,${GREEN} 0 26px,#166332 26px 52px);padding:12px 6px;display:flex;flex-direction:column;gap:12px}
 .cl{display:flex;justify-content:center;gap:12px}
 .cl i{display:block;width:22px;height:30px;border-radius:6px;background:linear-gradient(180deg,#fff 0 58%,#0A0A0A 58%);border:2px solid ${INK}}

 /* departamento técnico */
 .dep{border:4px solid ${INK};border-radius:14px;background:#fff;box-shadow:3px 3px 0 ${INK};overflow:hidden;margin-bottom:10px}
 .dh{background:linear-gradient(150deg,#2A241A,#17130A);padding:7px 11px;border-bottom:3px solid ${INK}}
 .dht{display:block;font-family:Oswald;font-weight:900;font-size:13px;color:#fff;text-transform:uppercase;letter-spacing:.4px}
 .dhs{display:block;font-size:8.5px;font-weight:700;color:rgba(255,255,255,.55)}
 .fic{display:flex;gap:9px;align-items:center;padding:9px 10px;border-bottom:2px dashed #d9d0b4}
 .fic:last-child{border-bottom:0}
 .fav{width:44px;height:44px;flex:0 0 44px;border:3px solid ${INK};border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:21px;box-shadow:2px 2px 0 ${INK}}
 .fin{min-width:0}
 .fpa{display:block;font-family:Oswald;font-weight:900;font-size:9px;letter-spacing:.7px;color:#8a8266;text-transform:uppercase}
 .fno{display:block;font-family:Oswald;font-weight:900;font-size:16px;line-height:1.1}
 .fsu{display:block;font-size:10px;font-weight:800;color:#5a5647;margin-top:1px}
 .fnu{display:block;font-size:9.5px;font-weight:800;color:#5a5647;margin-top:3px}
 .venc{color:${RED}}
 .vaga{margin:9px 10px 10px;border:3px dashed ${INK};border-radius:12px;background:#FBF6E8;padding:10px 11px}
 .vaga>b{display:block;font-family:Oswald;font-size:13px}
 .vaga>span{display:block;font-size:10.5px;font-weight:700;color:#5a5647;line-height:1.45;margin:3px 0 8px}
 .cta{width:100%;border:3px solid ${INK};border-radius:10px;background:${GOLD};font-family:Oswald;font-weight:900;font-size:14px;padding:8px;box-shadow:3px 3px 0 ${INK}}

 /* folha */
 .folha{display:flex;align-items:center;gap:8px;background:linear-gradient(150deg,#2A241A,#17130A);border:2px solid ${INK};border-radius:10px;padding:7px 11px;box-shadow:2px 2px 0 ${INK}}
 .folha .fl{flex:1}
 .folha b{display:block;font-family:Oswald;font-weight:900;font-size:11.5px;color:#fff}
 .folha i{display:block;font-style:normal;font-size:8.5px;font-weight:700;color:rgba(255,255,255,.55)}
 .folha u{display:block;text-decoration:none;font-family:Oswald;font-weight:900;font-size:17px;color:#E7503A;text-align:right;line-height:1}

 /* loja */
 .lojawrap{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};overflow:hidden}
 .ljh{font-family:Oswald;font-weight:900;font-size:16px;text-transform:uppercase;padding:9px 13px;border-bottom:4px solid ${INK};background:${GOLD}}
 .ljg{display:flex;gap:13px;padding:16px;background:${CREME}}
 .lj{flex:1;min-width:0;border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:4px}
 .ljin{background:rgba(255,255,255,.92);border-radius:12px;padding:12px 13px;height:100%}
 .ljc{display:block;font-family:Oswald;font-weight:900;font-size:11px;letter-spacing:1px;color:#5a5647}
 .ljn{display:block;font-family:Oswald;font-weight:900;font-size:23px;line-height:1.05;margin-top:1px}
 .ljn i{font-style:normal;font-size:15px}
 .ljb{display:block;font-size:11.5px;font-weight:700;color:#4a4636;line-height:1.45;margin:6px 0 9px;min-height:64px}
 .ljr{display:block;font-size:12px;font-weight:800;color:${INK};background:#F1F7F2;border-left:4px solid ${GREEN};border-radius:6px;padding:7px 9px;line-height:1.4;min-height:62px}
 .ljr i{display:block;font-style:normal;font-weight:700;color:#5a5647;font-size:10.5px;margin-top:3px}
 .ljbt{width:100%;margin-top:10px;border:3px solid ${INK};border-radius:11px;background:${INK};color:#fff;font-family:Oswald;font-weight:900;font-size:18px;padding:9px;box-shadow:3px 3px 0 rgba(0,0,0,.35)}
 .ljbt span{display:block;font-family:system-ui;font-weight:700;font-size:9.5px;opacity:.75;margin-top:2px}
 .nota{margin-top:22px;background:#FFF4E2;border:4px solid #B8722A;border-radius:16px;padding:16px 20px;font-size:16px;line-height:1.55;color:#3A2C18}
 .nota b{font-weight:800}
</style>
<h1>🏛️ Departamento Técnico + preparador físico</h1>
<p class="sub">O técnico e o preparador saem do meio dos jogadores e ganham a <b>área deles</b>, na mesma aba Elenco, logo abaixo do campinho. E o botão <b>🔁 RODIZIAR</b> passa a ser coisa de quem <b>contratou</b> um preparador — sem ele, o rodízio continua existindo, só que na mão.</p>

<div class="grid">
  ${painel('1 · Como é hoje', GOLD, caixaHoje('livre') + campo + `<div class="dep"><div class="fic"><div class="fav" style="background:${G_PRATA}">🧢</div><div class="fin"><span class="fpa">SEU TÉCNICO</span><span class="fno">Telê Santana</span><span class="fsu">⭐ Craque · 4-3-3 · 4-4-2 · 3-5-2</span><span class="fnu">💰 120 · 💸 salário <b>12</b>/temporada · 📝 faltam 3 temporadas</span></div></div></div>` + `<div class="folha"><span class="fl"><b>FOLHA DO TIME</b><i>cobrada no fim da temporada · + o técnico</i></span><u>186</u></div>`)}
  ${painel('2 · Como fica — sem preparador', '#E8E2CE', caixaHoje('travado') + campo + depto(ficha(TEC) + vaga) + `<div class="folha"><span class="fl"><b>FOLHA DO TIME</b><i>cobrada no fim da temporada · + a comissão</i></span><u>186</u></div>`)}
  ${painel('3 · Como fica — com preparador', GREEN + ';color:#fff', caixaHoje('livre') + campo + depto(ficha(TEC) + ficha(PREP)) + `<div class="folha"><span class="fl"><b>FOLHA DO TIME</b><i>cobrada no fim da temporada · + a comissão</i></span><u>196</u></div>`)}
</div>

<div class="lojawrap">
  <div class="ljh">🏋️ Contratar preparador físico — abre no botão do Departamento Técnico</div>
  <div class="ljg">${LOJA.map(cardLoja).join('')}</div>
</div>

<div class="nota">
  <b>As regras, em uma linha cada.</b><br>
  · <b>Salário igual ao do técnico</b>: 10% do preço, por temporada (100 → 10 · 300 → 30 · 600 → 60 · 1000 → 100), e entra na <b>Folha do Time</b>.<br>
  · <b>Contrato de 5 temporadas</b>, igual ao técnico. Venceu, aparece <b>RENOVAR</b> pelo mesmo preço, ou você deixa ir sem multa.<br>
  · <b>Sem preparador nada trava</b>: você continua trocando na mão, tocando no cansado e no reserva. O que ele dá é o <b>botão</b> e o <b>automático</b>.<br>
  · <b>Quem já jogava não perde nada</b>: quem abrir o save sem preparador vê o aviso com o caminho, nunca um botão que sumiu sem explicação.
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2] ?? 'mockup-preparador.png', fullPage: true })
await b.close()
console.log('ok')
