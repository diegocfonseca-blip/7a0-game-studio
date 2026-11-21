// 📸 fotos das telas REAIS do Bafo novo (os componentes do jogo, com dados de mentira), celular e computador.
// uso: node scripts/mockup-bafo2-telas.mjs → scripts/mockups/bafo2-real-*.png
import { chromium } from 'playwright-core'
const PORTA = '5291'
process.env.DEPLOY_BASE = '/'
const { createServer } = await import('vite')
const vite = await createServer({ server: { port: Number(PORTA), strictPort: true, watch: null, hmr: false } })
await vite.listen()
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const POS = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'], Q = { GOL: 2, LAT: 4, ZAG: 4, MEI: 6, ATA: 6 }
const NOMES = { GOL: ['Taffarel', 'Marcos', 'Dida', 'Rogério Ceni'], LAT: ['Cafu', 'Roberto Carlos', 'Maicon', 'Júnior', 'Leandro', 'Marcelo'], ZAG: ['Lúcio', 'Aldair', 'Thiago Silva', 'Juan', 'Gamarra', 'Mauro Galvão'], MEI: ['Kaká', 'Rivaldo', 'Zico', 'Sócrates', 'Falcão', 'Alex', 'Ganso', 'Arrascaeta'], ATA: ['Ronaldo', 'Romário', 'Neymar', 'Adriano', 'Bebeto', 'Careca', 'Fred', 'Jardel'] }
const time = (pre, n) => POS.flatMap(p => NOMES[p].slice(0, n ? Q[p] + 2 : Q[p]).map((nm, i) => ({ id: `${pre}-${p}-${i}`, bafoId: `${pre}-${p}-${i}`, name: nm, club: ['Flamengo', 'Milan', 'Santos', 'Barcelona', 'Inter'][i % 5], year: 1990 + i * 3, pos: p, fame: 3, lo: 70, hi: 80, paid: 0, via: 'leilao' })))
const managers = ['Futpoint FC', 'Robinhos FC', 'Abobados', 'The Wolf'].map((t, i) => ({ id: i, name: t, teamName: t, isHuman: true, squad: time('t' + i), formation: '4-3-3', money: 0 }))
const linha = { id: 1, dono: 'u0', valendo: true, fase: 'escolha', squads: Object.fromEntries(managers.map((m, i) => ['u' + i, m.squad.map(c => c.id)])), nomes: Object.fromEntries(managers.map((m, i) => ['u' + i, m.teamName])), campeao: 'u0', escolha_ate: new Date(Date.now() + 60000).toISOString(), batida_em: new Date().toISOString(), resultado: null, punicao: null }
for (const [nome, w, h] of [['cel', 390, 900], ['pc', 1280, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch {} })
  const p = await ctx.newPage()
  await p.route(/supabase\.co\/rest\/v1\/esc_bafo2/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(linha) }))
  await p.route(/supabase\.co\/rest\/v1\/rpc\//, r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  for (const tela of ['regras', 'convoca', 'elencos', 'fim']) {
    await p.evaluate(`(async()=>{
      const R = await import('/@id/react'); const h = (R.default ?? R).createElement
      const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
      const U = await import('/src/escalacao/bafo2-ui.tsx')
      document.getElementById('root')?.remove(); document.querySelectorAll('.bf-raiz').forEach(e=>e.remove()); document.body.style.background='#0c120e'
      const root=document.createElement('div'); root.className='bf-raiz'; root.style.cssText='padding:14px;max-width:${nome === 'pc' ? 1100 : 390}px;margin:0 auto'; document.body.appendChild(root)
      const managers=${JSON.stringify(managers)}, col=${JSON.stringify(time('eu', true))}
      const t='${tela}'
      const el = t==='regras' ? h(U.RegrasBafo,{valendo:true,nPessoas:4})
        : t==='convoca' ? h(U.ConvocacaoBafo,{colecao:col,marcadas:col.slice(0,14).map(c=>c.id),onMarcar(){},seg:74,pronto:false,onPronto(){}})
        : t==='elencos' ? h(U.ElencosBafo,{managers,youId:0})
        : h(U.Bafo2Fim,{roomId:'r',souDono:true,meuUid:'u0',campeaoUid:'u0',managers,assentos:['u0','u1','u2','u3'],aoVoltar(){}})
      createRoot(root).render(el)
    })()`)
    await p.waitForTimeout(tela === 'fim' ? 3500 : 1200)
    if (tela === 'fim') { await p.locator('button', { hasText: 'Ronaldo' }).first().click().catch(() => {}); await p.waitForTimeout(300) }
    await p.screenshot({ path: `scripts/mockups/bafo2-real-${tela}-${nome}.png`, fullPage: true })
  }
  await ctx.close()
}
await b.close(); await vite.close(); console.log('📸 ok'); process.exit(0)
