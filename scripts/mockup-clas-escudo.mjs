// ─── 🛡️ CLÃS · O ESCUDO DO JOGADOR NÃO PODE SUMIR ──────────────────────────
//
// O Diego pegou o furo do meu 1º mockup de clãs (20/08): lá, nas listas e na
// tabela, aparecia SÓ o escudo do CLÃ do lado do nome. Palavras dele:
// *"gostei bastante mas o problema q tá sumindo o escudo do jogador q ele fez"*.
//
// 🚨 ELE ESTÁ CERTO, E ISSO QUEBRA UMA REGRA DELE MESMO. O escudo do batismo:
//   · é do **E-MAIL do dono** (regra de 20/08 — nunca da palavra, nunca de outro);
//   · custa arte de verdade (webp ≤30 KB) e vem com sócio + fundador vitalício;
//   · é a coisa mais pessoal que alguém tem no jogo.
// Trocar isso por um escudo de clã seria tirar do cara o que ele já conquistou.
//
// ✅ A REGRA NOVA, e ela não se discute: **o escudo do jogador NUNCA sai.**
// O clã é um SELO, do tamanho de um patch de manga de camisa, colado no canto.
//
// 🎁 E tem um bônus que eu não tinha visto: hoje a MAIORIA não tem escudo
// nenhum (só 28 batismos no jogo inteiro). Pra essa galera o escudo do clã
// preenche o vazio — eles GANHAM identidade em vez de perder.
//
//   node scripts/mockup-clas-escudo.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'clas-escudo.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// escudo do JOGADOR (no jogo é a arte .webp do batismo)
const escudoJog = (s, c1 = '#C2452F', c2 = '#1B2A5B', letra = 'N') => `
  <svg width="${s}" height="${Math.round(s * 1.09)}" viewBox="0 0 64 70" style="flex:none;display:block">
    <path d="M32 2 L60 12 V38 C60 54 46 64 32 68 C18 64 4 54 4 38 V12 Z" fill="${c2}" stroke="${INK}" stroke-width="4"/>
    <path d="M32 2 L60 12 V38 C60 54 46 64 32 68 Z" fill="${c1}"/>
    <text x="32" y="47" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="32" fill="#fff">${letra}</text>
  </svg>`
// selo do CLÃ (o "patch") — redondo, pra nunca ser confundido com escudo
const seloCla = (s, cor = '#1B7A3D', letra = 'R') => `
  <svg width="${s}" height="${s}" viewBox="0 0 40 40" style="flex:none;display:block">
    <circle cx="20" cy="20" r="17" fill="${cor}" stroke="${INK}" stroke-width="5"/>
    <text x="20" y="28" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="21" fill="#fff">${letra}</text>
  </svg>`

// jogador com escudo próprio + patch do clã no canto
const comPatch = (s, letra = 'N') => `
  <div style="position:relative;width:${s}px;height:${Math.round(s * 1.09)}px;flex:none">
    ${escudoJog(s, '#C2452F', '#1B2A5B', letra)}
    <div style="position:absolute;right:${-Math.round(s * .12)}px;bottom:${-Math.round(s * .06)}px">${seloCla(Math.round(s * .56))}</div>
  </div>`

const caixa = (inner, bg = '#fff', pad = '15px 17px') =>
  `<div style="background:${bg};border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:${pad}">${inner}</div>`
const rot = t => `<div style="${OSW};text-transform:uppercase;font-size:11.5px;letter-spacing:.09em;opacity:.55;margin:0 0 9px">${t}</div>`

// linha de lobby
const linha = (nome, tipo, nota) => {
  const ic = tipo === 'patch' ? comPatch(30) : tipo === 'cla' ? `<div style="padding-top:2px">${seloCla(26)}</div>` : tipo === 'so' ? escudoJog(30) : '<div style="width:30px"></div>'
  return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1.5px solid rgba(12,12,12,.09)">
    ${ic}<span style="${OSW};font-size:15px;flex:1">${nome}</span>
    ${nota ? `<span style="font-size:11px;font-weight:700;color:rgba(12,12,12,.45)">${nota}</span>` : ''}</div>`
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}body{margin:0;background:${CREME};color:${INK};font-family:system-ui;padding:34px 34px 28px}</style></head><body>

  <div style="display:inline-block;background:${RED};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🛡️ CONSERTO · CLÃS</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:44px;margin:14px 0 6px;line-height:1">
    O ESCUDO DO JOGADOR <span style="color:${RED}">NUNCA SAI</span></h1>
  <p style="font-size:15px;font-weight:600;max-width:1000px;line-height:1.5;margin:0 0 6px">
    Você pegou o furo: no meu 1º mockup, nas listas aparecia <b>só o escudo do clã</b> do lado do nome — o do jogador sumia.
    Isso quebra uma regra <b>sua</b>: o escudo do batismo é <b>do e-mail do dono</b>, custa arte de verdade e vem com sócio +
    fundador vitalício. É a coisa mais pessoal que alguém tem no jogo.
  </p>
  <p style="font-size:15px;font-weight:600;max-width:1000px;line-height:1.5;margin:0 0 26px">
    <b>A regra nova:</b> o clã vira um <b>SELO redondo</b>, do tamanho de um patch de manga de camisa, colado no canto do
    escudo do dono. Redondo de propósito — pra ninguém confundir com escudo.
  </p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    ${caixa(`${rot('❌ Como estava no meu mockup')}
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
        <div style="text-align:center">
          ${escudoJog(56)}
          <div style="font-size:10px;font-weight:800;color:rgba(12,12,12,.5);margin-top:5px">o escudo dele</div>
        </div>
        <div style="${OSW};font-size:26px;color:${RED}">➜</div>
        <div style="text-align:center">
          ${seloCla(48)}
          <div style="font-size:10px;font-weight:800;color:${RED};margin-top:5px">virava o do clã</div>
        </div>
      </div>
      <div style="border:3px solid ${INK};border-radius:12px;background:#FBE7E3;padding:10px 12px">
        ${linha('Nata de SP', 'cla', '')}
        ${linha('Você', 'cla', '')}
        <div style="font-size:11.5px;font-weight:800;color:${RED};padding-top:8px">☝️ o escudo que o cara batizou some da tela</div>
      </div>`, '#fff')}

    ${caixa(`${rot('✅ Como fica agora')}
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
        <div style="text-align:center">
          ${escudoJog(56)}
          <div style="font-size:10px;font-weight:800;color:rgba(12,12,12,.5);margin-top:5px">o escudo dele</div>
        </div>
        <div style="${OSW};font-size:26px;color:${GREEN}">➜</div>
        <div style="text-align:center">
          <div style="display:flex;justify-content:center">${comPatch(56)}</div>
          <div style="font-size:10px;font-weight:800;color:${GREEN};margin-top:5px">continua o dele, com o selo do clã</div>
        </div>
      </div>
      <div style="border:3px solid ${INK};border-radius:12px;background:#E6F3EA;padding:10px 12px">
        ${linha('Nata de SP', 'patch', '')}
        ${linha('Você', 'patch', '')}
        <div style="font-size:11.5px;font-weight:800;color:${GREEN};padding-top:8px">👍 o escudo é o dele — o clã é o selinho no canto</div>
      </div>`, '#fff')}
  </div>

  <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:20px;margin-bottom:20px">
    ${caixa(`${rot('Os 3 casos, e nenhum deles some com nada')}
      <div style="border:3px solid ${INK};border-radius:12px;background:#F8F4E8;padding:11px 13px">
        <div style="${OSW};font-size:11px;opacity:.5;margin-bottom:7px">NO LOBBY DA SALA</div>
        ${linha('Nata de SP', 'patch', 'batizado + clã')}
        ${linha('Marreco FC', 'cla', 'sem batismo, só clã')}
        ${linha('Skyy FC', 'so', 'batizado, sem clã')}
        ${linha('Murriz FC', 'nada', 'nem um nem outro')}
      </div>
      <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:11px 0 0">
        🎁 <b>E aqui tem um bônus que eu não tinha visto.</b> Hoje o jogo tem <b>28 batismos</b> — quase ninguém tem escudo
        próprio. Pra essa galera toda o selo do clã <b>preenche o vazio</b>: eles <b>ganham</b> identidade em vez de perder.
        Quem é batizado mantém o seu e ainda ganha o selo por cima.</p>`, '#fff')}

    ${caixa(`${rot('Onde o escudo do CLÃ aparece grande')}
      <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0 0 10px">
        Na <b>tela do clã</b> — que é a casa dele. Ali o escudo do clã é o dono da tela, e os <b>escudos dos membros</b>
        aparecem em volta, cada um o seu.</p>
      <div style="border:3px solid ${INK};border-radius:14px;background:${CREME};padding:13px;text-align:center">
        <div style="display:flex;justify-content:center;margin-bottom:6px">${seloCla(52)}</div>
        <div style="${OSW};font-size:18px">Resenha FC</div>
        <div style="font-size:11px;font-weight:700;opacity:.5;margin-bottom:10px">5 na casa · 1.120 pontos</div>
        <div style="display:flex;justify-content:center;gap:9px">
          ${escudoJog(26, '#C2452F', '#1B2A5B', 'N')}
          ${escudoJog(26, '#127A33', '#0d3f21', 'S')}
          ${escudoJog(26, '#7C3AED', '#3b1d70', 'T')}
          ${seloCla(24, '#8b8b8b', 'M')}
          ${seloCla(24, '#8b8b8b', 'V')}
        </div>
        <div style="font-size:10px;font-weight:700;opacity:.45;margin-top:7px">quem tem escudo mostra o seu · quem não tem mostra o do clã</div>
      </div>`, '#fff')}
  </div>

  ${caixa(`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
      <div>
        <p style="${OSW};font-size:15px;margin:0 0 8px">🛡️ A regra, pra ficar no papel</p>
        <p style="font-size:12.5px;font-weight:600;line-height:1.55;margin:0">
          <b>O escudo do batismo é do dono e não sai da tela por causa de nada.</b> Nem clã, nem liga fechada, nem
          nenhuma coisa nova que a gente invente depois.<br><br>
          O clã ganha um <b>selo redondo</b> (nunca escudo) no canto — dá pra ver de longe que a pessoa é da casa, sem
          apagar quem ela é. E o selo é <b>pequeno de propósito</b>: quem manda na linha é o nome e o escudo do dono.</p>
      </div>
      <div>
        <p style="${OSW};font-size:15px;margin:0 0 8px">🎨 O que continua igual</p>
        <p style="font-size:12.5px;font-weight:600;line-height:1.55;margin:0">
          <b>A cor continua sendo a do tier de cada um</b> — grátis vê bege, ouro vê ouro. O clã dá o SELO, nunca a cor
          de outro. Fidelidade de tier intacta.<br><br>
          E <b>sair do clã não tira nada de você</b>: o selo some, seu escudo, seu manto, seu mascote e seus títulos
          ficam exatamente onde estavam. O clã é uma casa que você visita, não uma troca de identidade.</p>
      </div>
    </div>`, '#F1EDE0')}

  <p style="margin-top:20px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-clase-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1420, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
