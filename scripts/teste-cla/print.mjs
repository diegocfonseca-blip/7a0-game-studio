import { chromium } from 'playwright-core'
const PORTA = 5313, OUT = process.argv[2] ?? '/tmp/claude-0/cla'
process.chdir('/home/user/7a0-game-studio'); process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ root: '/home/user/7a0-game-studio', server: { port: PORTA, strictPort: true, watch: null, hmr: false } })
await vite.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ver = { id: 1, nome: 'Futpoint', emblema: 'FP', aberto: true, lider: 'u0', lider_nome: 'Futpoint FC', membros: 28, titulos: 131, pos: 1, campeao: false, sou: false, pedi: false,
  lista: [['Januzaj FC', 50], ['Gz FC', 23], ['Guarabu FC', 12], ['Zeca Paugordinho', 10]].map(([nome, titulos], i) => ({ uid: 'u' + i, nome, titulos })) }
const tacas = { copa: 187, liga: 773, ouro: 1, prata: 2, bronze: 2, membros: 28, mundial: 92, regional: 46, champions: 12, relampago: 19, libertadores: 117 }
for (const w of [390, 1280]) {
  const cx = await b.newContext({ viewport: { width: w, height: 900 }, locale: 'pt-BR', deviceScaleFactor: 2 })
  await cx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  await cx.route('**/*.supabase.co/**', r => { const u = r.request().url(); r.fulfill({ json: u.includes('esc_cla_ver') ? ver : u.includes('esc_cla_tacas') ? tacas : [] }) })
  const p = await cx.newPage(); p.on('pageerror', e => console.log('ERRO', String(e).slice(0, 200)))
  await p.goto(`http://localhost:${PORTA}/scripts/teste-cla/index.html`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
  await p.screenshot({ path: `${OUT}-${w}.png` }); await p.close(); console.log('ok', w)
}
await b.close(); await vite.close()
