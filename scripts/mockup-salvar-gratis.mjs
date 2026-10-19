// 💾 MOCKUP · SALVAR NA CARREIRA SEM PLANO (19/10). Um amigo do Diego reclamou que "não dá pra salvar, tá com bug" — era conta
// grátis: desde 07/10 a carreira NOVA de quem não paga salva só no APARELHO (regra `esc_nuvem_regra`). O aviso de hoje é uma
// faixinha âmbar que some em 2 s. Diego: *"precisa ter um aviso mais claro e já mostrar os planos pra ele"*.
// uso: node scripts/mockup-salvar-gratis.mjs → scripts/mockups/salvar-gratis.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#16130f;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px}
h1{font:700 26px Oswald;text-transform:uppercase;margin:0 0 4px;color:#F4ECD6}.sub{margin:0 0 18px;font-weight:700;color:rgba(244,236,214,.65)}
.cols{display:flex;gap:26px;align-items:flex-start}.col{width:400px}
.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:12px;box-shadow:3px 3px 0 #000;color:#fff}
.faixa{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:2px solid rgba(255,196,0,.35);border-radius:12px;background:rgba(255,255,255,.05)}
.faixa span{font:700 11px Oswald;letter-spacing:.05em;color:#FFB020}
.mini{font:700 12px Oswald;border:2px solid #0C0C0C;border-radius:10px;padding:7px 10px;box-shadow:2px 2px 0 #000}
.janela{background:#F4ECD6;border:3px solid #0C0C0C;border-radius:20px;box-shadow:5px 5px 0 #000;padding:14px}
.topo{background:#0C0C0C;color:#FFC400;border-radius:12px;padding:8px 12px;font:700 16px Oswald;display:flex;justify-content:space-between}
.ok{background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:10px 12px;margin:12px 0 10px;font-size:14px;line-height:1.35}
.ok b{font:700 17px Oswald;display:block;color:#1B7A3D;margin-bottom:2px}
.risco{font-size:13px;font-weight:700;line-height:1.4;margin:0 2px 12px}
.plano{display:flex;justify-content:space-between;align-items:center;border:3px solid #0C0C0C;border-radius:14px;padding:10px 12px;margin-bottom:9px;box-shadow:3px 3px 0 #000}
.plano b{font:700 17px Oswald;display:block}.plano small{font-size:11.5px;font-weight:700;opacity:.8}
.preco{font:700 16px Oswald;background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:10px;padding:6px 10px;box-shadow:2px 2px 0 #000;white-space:nowrap}
.depois{display:block;text-align:center;font:700 13px Oswald;text-decoration:underline;margin-top:6px;color:rgba(0,0,0,.6)}
.nota{font-size:12.5px;font-weight:700;line-height:1.4;color:rgba(244,236,214,.8);margin-top:12px}
</style></head><body>
<h1>💾 Salvar a carreira sem plano</h1>
<p class="sub">Hoje a pessoa aperta Salvar, vê uma faixinha que some em 2 segundos e acha que deu bug.</p>
<div class="cols">
 <div class="col"><span class="tag" style="background:#C2452F">HOJE</span>
  <div class="faixa"><span>📱 ESTA CARREIRA SALVA SÓ NESTE APARELHO · ☁️ A NUVEM É DO ⭐ CRAQUE</span>
   <span style="display:flex;gap:6px"><span class="mini" style="background:#7C3AED;color:#fff">⭐ Craque</span><span class="mini" style="background:#FFC400">💾 Salvar</span></span></div>
  <p class="nota">Letra pequena, some rápido, e não diz o principal: <b>a carreira dele ESTÁ salva</b> — só não está na nuvem.</p>
 </div>
 <div class="col"><span class="tag" style="background:#1B7A3D">COMO FICARIA (ao apertar 💾 Salvar)</span>
  <div class="janela">
   <div class="topo"><span>💾 CARREIRA SALVA</span><span>✕</span></div>
   <div class="ok"><b>✅ Salva neste celular</b>Pode fechar o jogo tranquilo: quando voltar <b style="display:inline;font:inherit;color:inherit">neste aparelho</b>, ela está aqui.</div>
   <p class="risco">⚠️ Mas ela <b>não está na nuvem</b>. Se você trocar de celular, limpar o navegador ou jogar no PC, ela não vai junto.</p>
   <p class="risco" style="margin-bottom:8px">☁️ Pra guardar na nuvem e jogar em qualquer aparelho:</p>
   <div class="plano" style="background:linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)"><span><b>⭐ CRAQUE</b><small>nuvem · Modo Manual · cor prata</small></span><span class="preco">R$ 29,90</span></div>
   <div class="plano" style="background:linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)"><span><b>👑 LENDA</b><small>tudo do Craque + salas à vontade · cor ouro</small></span><span class="preco">R$ 44,90</span></div>
   <span class="depois">Agora não — continuar só no celular</span>
  </div>
  <p class="nota">Abre só pra quem NÃO tem plano. Quem paga continua vendo o "✅ Salvo na nuvem" de sempre. Os botões levam direto pro Pix do plano.</p>
 </div>
</div>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 880, height: 700 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: 'scripts/mockups/salvar-gratis.png', fullPage: true }); await b.close()
console.log('scripts/mockups/salvar-gratis.png')
