// ⭐⚔️ MOCKUP · CADA MEMBRO COM PLANO = +1 VAGA NO CLÃ (02/11). Diego: *"quem tem plano e tá no clã dobra p ter mais vagas… eu tô
// no clã do Lulubaba, com isso o clã ganha direito a mais uma vaga"*. Base 22 + 1 por membro com plano, teto 30 (proposta).
// uso: node scripts/mockup-cla-vagas-por-plano.mjs → scripts/mockups/cla-vagas-por-plano.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
// clã: membros grátis, membros com plano → limite = min(30, 22 + plano)
const vagas = (gratis, plano) => {
  const lim = Math.min(30, 22 + plano), dentro = gratis + plano, livres = Math.max(0, lim - dentro)
  return { lim, dentro, livres, html: '<span class="v pl">⭐</span>'.repeat(plano) + '<span class="v gr"></span>'.repeat(gratis) + '<span class="v livre"></span>'.repeat(livres) + '<span class="v trava">🔒</span>'.repeat(30 - lim) }
}
const cla = (nome, gratis, plano, nota) => {
  const v = vagas(gratis, plano)
  return `<div class="box"><div class="topo"><span style="font-size:32px">🛡️</span><div><b>⚔️ CLÃ ${nome}</b><small>${v.dentro}/${v.lim} · base 22 + ${plano} ⭐ de quem tem plano</small></div><span class="lim">${v.livres ? `${v.livres} vaga${v.livres > 1 ? 's' : ''} livre${v.livres > 1 ? 's' : ''}` : 'cheio'}</span></div>
  <div class="vagas">${v.html}</div><p class="leg">${nota}</p></div>`
}
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:900px}
h1{font:700 28px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.7;font-size:15px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin:6px 0 10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.box{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #0C0C0C;padding:14px 16px 12px;margin-bottom:16px}
.topo{background:linear-gradient(150deg,#262626,#0c0c0c);color:#fff;border-radius:12px;padding:10px 14px;display:flex;gap:12px;align-items:center}
.topo div{flex:1}.topo b{font:700 20px Oswald;display:block}.topo small{color:#FFC400;font-weight:800}
.lim{font:700 14px Oswald;background:#FFC400;color:#0C0C0C;border-radius:8px;padding:3px 10px;border:2px solid #0C0C0C}
.vagas{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0 4px}.v{width:23px;height:23px;border-radius:50%;border:2px solid #0C0C0C;display:inline-flex;align-items:center;justify-content:center;font-size:11px}
.pl{background:#FFC400}.gr{background:#DBD1B5}.livre{background:#fff;border-style:dashed;border-color:#1B7A3D}.trava{background:#eee;border-color:#bbb;opacity:.6}
.leg{font-size:14px;font-weight:600;line-height:1.5;margin:6px 0 0}
.chave{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;font-weight:700;margin-bottom:14px}.chave span{display:inline-flex;align-items:center;gap:6px}
.aviso{border:3px solid #0C0C0C;border-radius:12px;padding:12px;font-weight:700;font-size:14px;line-height:1.45;background:#FFF6D6}
</style></head><body>
<h1>⭐⚔️ Cada membro com plano = +1 vaga no clã</h1>
<p class="sub">Todo clã começa com 22 vagas. Cada pessoa com plano que está dentro dá +1 vaga pro clã, até o máximo de 30.</p>
<div class="chave"><span><i class="v pl">⭐</i> membro com plano</span><span><i class="v gr"></i> membro grátis</span><span><i class="v livre"></i> vaga livre (qualquer um entra)</span><span><i class="v trava">🔒</i> vaga que ainda não abriu</span></div>

<span class="tag">COMO FICARIA HOJE (números de verdade)</span>
${cla('LULUBABA', 16, 6, '6 com plano → limite 28. Já tem 22 dentro: <b>abrem 6 vagas</b> pra qualquer um.')}
${cla('FUTPOINT', 19, 3, '3 com plano → limite 25: <b>abrem 3 vagas</b>.')}
${cla('LEITE DE VERDADE', 21, 1, '1 com plano → limite 23: <b>abre 1 vaga</b>.')}

<span class="tag">QUANDO ENTRA ALGUÉM COM PLANO</span>
<div class="box"><div class="aviso">⭐ GAMA FC (com plano) entrou no Lulubaba → o clã ganhou +1 vaga: agora são 29.</div>
<p class="leg">Aparece pra todo o clã. É o próprio clã que passa a querer gente com plano dentro.</p></div>

<span class="tag">AS REGRAS</span>
<div class="box"><p class="leg" style="margin:0">
✅ Base 22 pra todo clã · +1 por membro com plano · máximo 30.<br>
✅ A vaga que abre é de QUALQUER um (grátis também entra nela).<br>
✅ Alguém perdeu o plano ou saiu? O limite baixa, mas <b>ninguém é tirado</b>: o clã só não aceita gente nova até ficar abaixo do limite.<br>
✅ Presidente continua aceitando e recusando como hoje.</p></div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const pg = await br.newPage({ viewport: { width: 944, height: 800 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/cla-vagas-por-plano.png', fullPage: true })
await br.close()
console.log('ok')
