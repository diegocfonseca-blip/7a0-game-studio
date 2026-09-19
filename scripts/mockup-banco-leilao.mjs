// ─── 🪑 O BANCO DO LEILÃO NÃO TINHA LUGAR PRA TODO MUNDO ────────────────────
//
// O Diego (19/09): *"o campinho que eu tava falando era o do leilão, quando vai
// pro leilão aparecem dois campinhos"*. Ele estava certo, e o buraco é real: o
// campinho de BAIXO (o banco) desenhava exatamente o mesmo número de lugares que
// a formação pede. Quem passasse disso numa posição — o +1 do elenco de 27, o
// emprestado da SAF, ou o 3º atacante de um 4-2-3-1 — ficava no elenco, dava
// lance, jogava… e não aparecia em campinho NENHUM.
//
// Este desenho põe lado a lado os dois campinhos DE VERDADE (bancada
// `scripts/teste-campinho-leilao`), antes e depois do conserto.
//
// Como se tira o "ANTES": o script aceita `--antes` apontando pra uma imagem já
// gerada com o código velho (`git stash` → print → `git stash pop`).
//
// Antes de rodar, suba o servidor:  DEPLOY_BASE=/ npx vite --port 5212
// Rodar:  node scripts/mockup-banco-leilao.mjs [--porta 5212] [--antes /tmp/antes.png] [--saida /tmp/banco.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5212')
const SAIDA = arg('saida', '/tmp/banco-leilao.png')
const ANTES = arg('antes', '')
const SO_TIRA = process.argv.includes('--so-tira') // só fotografa a bancada e sai

const INK = '#0C0C0C', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'
const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })

const tira = async () => {
  const p = await nav.newPage({ viewport: { width: 420, height: 1000 }, deviceScaleFactor: 2, locale: 'pt-BR' })
  await p.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ } })
  await p.goto(`http://localhost:${PORTA}/scripts/teste-campinho-leilao/?form=4-2-3-1&ata=3`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1600) // os rostos são .webp
  // corta no PÉ DO ÚLTIMO CAMPINHO, senão sobra uma faixa preta de fundo vazio
  // (o #root herda a altura da tela, não a do conteúdo)
  const alt = await p.evaluate(() => {
    const campos = [...document.querySelectorAll('.campinho-field')]
    const ultimo = campos[campos.length - 1]
    // +placa de patrocínio + a borda de baixo do quadro
    return Math.ceil(ultimo.getBoundingClientRect().bottom + scrollY + 42)
  })
  const png = await p.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 420, height: alt } })
  await p.close()
  return png
}

if (SO_TIRA) {
  fs.writeFileSync(SAIDA, await tira())
  await nav.close()
  console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
  process.exit(0)
}

const depois = `data:image/png;base64,${(await tira()).toString('base64')}`
const antes = ANTES ? `data:image/png;base64,${fs.readFileSync(ANTES).toString('base64')}` : null

const lado = (rotulo, cor, titulo, sub, img) => `
  <div style="flex:1;min-width:0">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:12px;color:#fff;background:${cor};border:2.5px solid ${INK};border-radius:7px;padding:2px 9px;box-shadow:2px 2px 0 ${INK}">${rotulo}</span>
      <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;color:${INK}">${titulo}</span>
    </div>
    <div style="font-size:12.5px;color:rgba(12,12,12,.68);line-height:1.45;margin-bottom:9px;min-height:52px">${sub}</div>
    <div style="border:4px solid ${cor};border-radius:14px;box-shadow:5px 5px 0 ${INK};overflow:hidden;background:${CREME}">
      <img src="${img}" style="display:block;width:100%">
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
 *{box-sizing:border-box} body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:26px 24px 30px;width:1040px}
</style></head><body>
 <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:33px;color:${INK};line-height:1.05">OS DOIS CAMPINHOS DO LEILÃO</div>
 <div style="font-size:14px;color:rgba(12,12,12,.68);margin:6px 0 20px;line-height:1.5;max-width:920px">
   Você tinha razão. No leilão aparecem <b>dois campinhos</b>: o <b>Banco</b> em cima e os <b>Titulares</b> embaixo.
   O de baixo é a formação — e tem que ser mesmo. Só que o <b>de cima também era</b>: ele desenhava exatamente
   o mesmo número de lugares, como um espelho. Resultado: quem passasse disso na posição
   <b>não aparecia em campinho nenhum</b>. Não é só o 3º atacante —
   <b>já acontece hoje</b> com o +1 do elenco de 27 e com o emprestado da SAF.
 </div>

 <div style="display:flex;gap:20px;align-items:flex-start">
   ${antes ? lado('HOJE', VERM, 'o banco é espelho', 'Elenco 4-2-3-1 com <b>3 atacantes</b>. O banco só tem <b>1 lugar de ATA</b> — o terceiro simplesmente não está no desenho.', antes) : ''}
   ${lado('CONSERTADO', VERDE, 'o banco cresce', 'Mesmo elenco. O banco ganhou <b>o lugar que faltava</b> e o atacante aparece. Nenhum outro campinho mudou.', depois)}
 </div>

 <div style="background:#FFF6E0;border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 rgba(0,0,0,.25);padding:14px 16px;margin-top:22px">
   <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;color:${INK}">✅ O QUE MUDA E O QUE NÃO MUDA</div>
   <ul style="margin:9px 0 0;padding-left:20px;font-size:13.5px;color:rgba(12,12,12,.8);line-height:1.7">
     <li><b>Só o campinho de cima (o Banco).</b> O dos Titulares continua sendo a formação e ponto — lá o número de lugares é regra de jogo.</li>
     <li><b>O banco continua com o mesmo desenho de sempre</b> pra quem não tem ninguém sobrando: ele só ganha um lugar quando há um jogador pra ocupar.</li>
     <li><b>Não é vaga nova.</b> Ninguém passa a poder comprar mais por causa disto — é só o desenho parando de esconder gente.</li>
     <li><b>Conserta dois buracos que já existem hoje</b>, sem o 4-2-3-1 entrar na história: o +1 por posição do elenco de 27 e o emprestado da SAF.</li>
     <li><b>Reversível num commit.</b></li>
   </ul>
 </div>
</body></html>`

const p = await nav.newPage({ viewport: { width: 1040, height: 1400 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true })
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
