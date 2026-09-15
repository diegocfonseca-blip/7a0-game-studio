// 🪣 MOCKUP — ver o campinho de TODO MUNDO no Monte Final (ideia do Diego, 15/09)
//
// Palavras dele: *"quando você tá no monte e tá escolhendo os times… não poderia
// aparecer o campinho de todos os times, igual quando acontece a simulação? Até pra
// gente saber o quê: como já tem um botão de gerenciar, se eu ver que tem um campinho
// com um monte de buraco, pode ser que esse cara já saiu do jogo. Aí é mais fácil eu
// apertar em gerenciar e tirar ele"*. E ele mesmo levantou o risco: *"vai prejudicar
// alguma coisa ou não? Digo isso porque pode ser que tenha até 20 campinhos"*.
//
// ✅ CONFERIDO NO CÓDIGO antes de desenhar (regra dele: nada de achismo):
//   · o tempo da vez é **15 s** — `MONTE_MS = 15_000` em `store.tsx`. O "13s" que ele
//     viu na live era o relógio JÁ CORRENDO (a tela mostra `remaining`);
//   · a sala vai a **20 técnicos** (`MAX_PLAYERS` em `lobby.tsx`; 40 em duplas);
//   · hoje o Monte desenha **só o seu** campinho (`<YourPitch />` em `screens.tsx`);
//   · cada campinho desenha **11 rostos** (`avatarIdentity` no `Campinho`);
//   · e a tela do Monte **re-renderiza 4× por segundo** enquanto o relógio corre
//     (`setInterval(…, 250)`).
//   · 🟢 O JOGO JÁ SABE QUEM SAIU: `state.presenceUids` é o crachá de quem está online
//     de verdade — é o que o código já usa pra liberar o "seu parceiro caiu".
//
// Rodar: node scripts/mockup-monte-campinhos.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-monte-campinhos.png')
const VERM = '#C2452F', ROXO = '#7C3AED'

// ── um campinho de mentirinha (só a silhueta, pro mockup) ──────────────────
const campinho = (buracos, alt = 150) => {
  const linhas = [[3, 'ATA'], [3, 'MEI'], [4, 'ZAG'], [1, 'GOL']]
  let faltam = buracos
  return `<div style="border:3px solid ${INK};border-radius:12px;overflow:hidden;background:
      repeating-linear-gradient(90deg,#2E9E5B 0 26px,#2B9354 26px 52px);padding:7px 6px;height:${alt}px;
      display:flex;flex-direction:column;justify-content:space-around">
    ${linhas.map(([n]) => `<div style="display:flex;justify-content:space-around">
      ${Array.from({ length: n }, () => {
        const vazio = faltam-- > 0
        return `<div style="width:22px;height:22px;border:2.5px solid ${INK};border-radius:999px;
          background:${vazio ? 'rgba(0,0,0,.28)' : GOLD};display:flex;align-items:center;justify-content:center;
          font-size:11px">${vazio ? '' : '🙂'}</div>`
      }).join('')}
    </div>`).join('')}
  </div>`
}

// ── a fileira de um time na lista (opção B) ────────────────────────────────
const linhaTime = (nome, buracos, online, aberto, voce) => `
  <div style="border:3px solid ${aberto ? ROXO : INK};outline:${aberto ? `2px solid ${ROXO}` : 'none'};
    border-radius:11px;background:${voce ? GOLD : '#fff'};box-shadow:2px 2px 0 ${INK};padding:7px 9px;
    display:flex;align-items:center;gap:8px">
    <span style="flex:none;font-size:13px">${online ? '🟢' : '🔴'}</span>
    <span style="${OSW};font-weight:700;font-size:12.5px;flex:1;min-width:0;overflow:hidden;
      text-overflow:ellipsis;white-space:nowrap">${voce ? '🫵 ' : ''}${nome}</span>
    ${!online ? `<span style="${OSW};font-weight:700;font-size:9px;color:#fff;background:${VERM};
      border-radius:999px;padding:1px 7px;white-space:nowrap">SAIU</span>` : ''}
    <span style="${OSW};font-weight:700;font-size:11px;color:${buracos > 4 ? VERM : 'rgba(12,12,12,.5)'};
      white-space:nowrap">${buracos} 🕳️</span>
  </div>`

const TIMES = [
  { n: 'Meia na Canela', b: 0, on: true, voce: true },
  { n: 'Migxz', b: 2, on: true },
  { n: 'Berretinho FC', b: 1, on: true },
  { n: 'Dv_777', b: 7, on: false },
  { n: 'Tricolor do Arruda', b: 3, on: true },
  { n: 'Papão da Curva', b: 6, on: false },
]

const cabecalho = (etiqueta, cor, titulo, sub) => `
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
    <span style="background:${cor};color:#fff;border:3px solid ${INK};border-radius:999px;padding:5px 14px;
      ${OSW};font-weight:700;font-size:13px;letter-spacing:1.2px;box-shadow:3px 3px 0 ${INK}">${etiqueta}</span>
    <span style="${OSW};font-weight:400;font-size:13px;opacity:.78">${titulo}</span>
  </div>
  <div style="${OSW};font-weight:400;font-size:11.5px;opacity:.7;margin-bottom:8px;line-height:1.35">${sub}</div>`

// o topo da tela do Monte, igual ao de hoje
const topoMonte = `
  <div style="${OSW};font-weight:700;font-size:22px;text-transform:uppercase">🪣 Monte Final</div>
  <div style="${OSW};font-weight:400;font-size:10.5px;opacity:.7;margin-top:2px">As sobras do pregão. Quem tem mais buracos escolhe primeiro, em serpente.</div>
  <div style="border:3px solid ${INK};border-radius:12px;background:#fff;box-shadow:3px 3px 0 ${INK};
    padding:9px;text-align:center;margin:9px 0;${OSW};font-weight:700;font-size:13px">Vez de <b>Migxz</b> · 13s…</div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:32px 36px 28px;width:1000px}
</style>

<div style="${OSW};font-weight:700;font-size:12px;letter-spacing:2.4px;opacity:.6">MOCKUP · LEILÃO ONLINE · MONTE FINAL</div>
<h1 style="${OSW};font-weight:700;font-size:36px;line-height:1.04;text-transform:uppercase;margin:4px 0 6px">
  Ver o time de <span style="color:${ROXO}">todo mundo</span> no Monte</h1>
<p style="${OSW};font-weight:400;font-size:14.5px;line-height:1.45;margin:0 0 20px;max-width:920px;opacity:.84">
  Hoje o Monte mostra <b>só o seu campinho</b>. A ideia é mostrar o dos outros também — pra dar pra ver o time
  de cada um e, principalmente, <b>sacar quem largou o jogo</b> e tirar pelo ⚙️ gerenciar.</p>

<div style="display:flex;gap:26px;align-items:flex-start">

  <!-- OPÇÃO A -->
  <div style="flex:none;width:430px">
    ${cabecalho('OPÇÃO A', VERM, 'os 20 campinhos, um embaixo do outro', 'Exatamente como você descreveu: o seu de cara, e os outros na sequência.')}
    <div style="border:4px solid ${INK};border-radius:18px;background:${CREME};box-shadow:5px 5px 0 ${INK};padding:12px">
      ${topoMonte}
      <div style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.4px;opacity:.5;margin:4px 0 6px">🫵 O SEU TIME</div>
      ${campinho(0, 150)}
      <div style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.4px;opacity:.5;margin:11px 0 6px">MIGXZ · 2 🕳️</div>
      ${campinho(2, 150)}
      <div style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.4px;opacity:.5;margin:11px 0 6px">DV_777 · 7 🕳️</div>
      ${campinho(7, 150)}
      <div style="text-align:center;${OSW};font-weight:700;font-size:12px;opacity:.45;margin-top:10px">⋮</div>
      <div style="text-align:center;${OSW};font-weight:400;font-size:11px;opacity:.6">+ 17 campinhos abaixo</div>
    </div>
  </div>

  <!-- OPÇÃO B -->
  <div style="flex:none;width:430px">
    ${cabecalho('OPÇÃO B ⭐', ROXO, 'a lista viva + o campinho que você abrir', 'Todos numa lista curtinha, com quem está online DE VERDADE. Toca num nome e o campinho dele abre ali.')}
    <div style="border:4px solid ${INK};border-radius:18px;background:${CREME};box-shadow:5px 5px 0 ${INK};padding:12px">
      ${topoMonte}
      <div style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.4px;opacity:.5;margin:4px 0 6px">👥 QUEM ESTÁ NA SALA</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${TIMES.map((t, i) => linhaTime(t.n, t.b, t.on, i === 3, t.voce)).join('')}
      </div>
      <div style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.4px;opacity:.5;margin:12px 0 6px">CAMPINHO DE DV_777</div>
      ${campinho(7, 168)}
      <div style="border:3px solid ${VERM};border-radius:12px;background:#FFF1EE;padding:9px 11px;margin-top:9px">
        <div style="${OSW};font-weight:700;font-size:12px;color:${VERM}">🔴 Dv_777 saiu da sala</div>
        <div style="${OSW};font-weight:400;font-size:10.5px;opacity:.8;line-height:1.35;margin-top:2px">
          Não é chute pelos buracos — o jogo sabe que o crachá dele não está mais aí.</div>
        <div style="border:3px solid ${INK};border-radius:10px;background:${GOLD};box-shadow:2px 2px 0 ${INK};
          padding:7px 0;text-align:center;margin-top:8px;${OSW};font-weight:700;font-size:12px;text-transform:uppercase">
          ⚙️ Gerenciar · remover da partida</div>
      </div>
    </div>
  </div>
</div>

<!-- a conta honesta -->
<div style="margin-top:24px;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
  <div style="background:${INK};color:${GOLD};${OSW};font-weight:700;font-size:14.5px;letter-spacing:1.2px;
    padding:10px 14px;text-transform:uppercase">⚖️ prejudica? o que eu medi no código</div>
  <div style="padding:12px 14px;${OSW};font-weight:400;font-size:13px;line-height:1.55">
    <div style="margin-bottom:8px">⏱️ <b>O tempo é 15 segundos</b> mesmo (o "13s" da sua tela era o relógio já
      correndo). Vale pro rápido, minhas ligas e carreira online — é o mesmo Monte.</div>
    <div style="margin-bottom:8px">👥 <b>A sala vai a 20 técnicos</b> (40 em duplas).</div>
    <div style="margin-bottom:8px">🐢 <b>Aí mora o risco da opção A:</b> cada campinho desenha <b>11 rostos</b>.
      Vinte campinhos = <b>220 fotos</b> de uma vez. E a tela do Monte se redesenha <b>4× por segundo</b> enquanto
      o relógio corre — ou seja, tudo isso junto, no lugar mais sensível do jogo, que é a tela com cronômetro.
      No celular isso engasga, e engasgar na hora de apertar PEGAR é o pior lugar possível.</div>
    <div style="margin-bottom:8px">🟢 <b>E tem um detalhe que melhora a ideia:</b> o jogo <b>já sabe</b> quem saiu —
      é o crachá online que ele usa pra liberar o "seu parceiro caiu". <b>Contar buraco é adivinhação:</b> um cara
      pode estar ali, jogando, e ter 7 buracos só porque perdeu os leilões; e quem saiu pode estar com o time cheio.
      Remover pelo buraco pode tirar alguém que está jogando.</div>
    <div>👉 Por isso a <b>opção B</b>: você vê o time de todo mundo do mesmo jeito (é só tocar no nome), decide pelo
      <b>fato</b> e não pelo palpite, e a tela continua leve — <b>um campinho por vez em vez de vinte</b>.</div>
  </div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
