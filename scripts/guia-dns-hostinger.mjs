// ─── 🔑 GUIA VISUAL: os 3 registros DNS do Resend na Hostinger (23/08) ───────
//
// O Diego comprou o leilaolegends.com na Hostinger e JÁ PAGA o e-mail deles
// (a caixa contato@ existe lá). Pra disparar e-mail marketing em massa em nome
// do mesmo endereço, o domínio precisa autorizar o Resend — são 3 registros
// que ele cola no hPanel. Este arquivo desenha a "cola" pra ele não errar.
//
// ⚠️ IMPORTANTE (e está no desenho): os 3 registros são ADIÇÕES. O MX novo é do
// subdomínio `send`, NÃO do domínio raiz — então o e-mail da Hostinger (que usa
// o MX da raiz) continua funcionando igual. Nada do que já existe é tocado.
//
//   node scripts/guia-dns-hostinger.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'guia-dns.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', GREEN = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const DKIM = 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDfqrpinAL4RM15IbhYdqX4lXhfDRp5G3ltNcTnos5KWlBaZN3tdNUzEs5cawzSazEYQ4BXu8z8E81ATW9eURs/tNvFrHtXozBFhah8Ps5tBeo+ZQnk68+j7uidcVM/GbE+/C/rJSu5xQAwZTY3ZOCK2/gB61Ph81KpJOvFb/pfwIDAQAB'

const campo = (rotulo, valor, mono) => `
<div style="margin-bottom:7px">
  <div style="${OSW};font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:rgba(12,12,12,.45)">${rotulo}</div>
  <div style="background:#FBF6E9;border:2px dashed rgba(12,12,12,.35);border-radius:8px;padding:6px 9px;margin-top:2px;font-weight:${mono ? 600 : 800};font-size:${mono ? 8.5 : 12}px;line-height:1.35;word-break:break-all;${mono ? 'font-family:ui-monospace,Menlo,monospace;' : ''}">${valor}</div>
</div>`

const registro = (n, titulo, campos) => `
<div style="background:#fff;border:3.5px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:13px 14px;margin-bottom:13px">
  <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">
    <span style="flex:none;width:28px;height:28px;border-radius:999px;background:${INK};color:${GOLD};display:flex;align-items:center;justify-content:center;${OSW};font-size:14px">${n}</span>
    <span style="${OSW};font-size:14px;text-transform:uppercase">${titulo}</span>
  </div>
  ${campos}
</div>`

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#F4ECD6;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:22px}
.fone{width:440px;margin:0 auto}
h1{${OSW};font-size:27px;line-height:1.05;text-transform:uppercase;margin:0}
h1 span{color:${RED}}
.sub{font-weight:700;font-size:12.5px;line-height:1.45;color:rgba(12,12,12,.72);margin:9px 0 16px}
.onde{background:${INK};color:#fff;border-radius:14px;padding:11px 13px;margin-bottom:16px}
.onde b{color:${GOLD}}
.aviso{background:#EAF7EE;border:3px solid ${GREEN};border-radius:14px;padding:11px 13px;font-weight:800;font-size:11.5px;line-height:1.45;margin-top:4px}
.rodape{text-align:center;font-weight:800;font-size:11px;color:rgba(12,12,12,.5);margin-top:14px;line-height:1.5}
</style>
<div class="fone">
  <h1>Colar na <span>Hostinger</span></h1>
  <p class="sub">3 registros pra autorizar o disparo em nome do <b>contato@leilaolegends.com</b>. É só <b>ADICIONAR</b> — não apague nada do que já está lá.</p>

  <div class="onde">
    <div style="${OSW};font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55)">Onde fica</div>
    <div style="font-weight:800;font-size:12.5px;line-height:1.5;margin-top:3px">hpanel.hostinger.com → <b>Domínios</b> → leilaolegends.com → <b>DNS / Nameservers</b> → <b>Adicionar registro</b></div>
  </div>

  ${registro(1, 'A assinatura (DKIM)', campo('Tipo', 'TXT') + campo('Nome', 'resend._domainkey') + campo('Valor (cola inteiro, é longo)', DKIM, true) + campo('TTL', 'deixa o padrão'))}
  ${registro(2, 'O carimbo (SPF)', campo('Tipo', 'TXT') + campo('Nome', 'send') + campo('Valor', 'v=spf1 include:amazonses.com ~all') + campo('TTL', 'deixa o padrão'))}
  ${registro(3, 'O retorno (MX)', campo('Tipo', 'MX') + campo('Nome', 'send') + campo('Valor / Aponta para', 'feedback-smtp.sa-east-1.amazonses.com') + campo('Prioridade', '10') + campo('TTL', 'deixa o padrão'))}

  <div class="aviso">✅ <b>Seu e-mail atual não corre risco.</b> O MX do registro 3 é do <b>send</b>.leilaolegends.com — um "puxadinho". O e-mail da Hostinger usa o MX do domínio principal, que continua intocado. Site e caixa de entrada seguem funcionando o tempo todo.</div>

  <p class="rodape">Colou os 3? Me avisa aqui que eu confiro a verificação. ⚽🔨</p>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 484, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
