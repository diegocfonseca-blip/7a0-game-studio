#!/usr/bin/env node
// ─── 📸 CASA LUCA DE VERDADE (05/11) ────────────────────────────────────────────────────────────────────────────────
// Os componentes REAIS de `casa-luca.tsx` e o painel do #admin (`CoracaoAdmin`), com dados de EXEMPLO (o banco é trocado por
// respostas falsas só dentro desta página), fotografados em 390×844 ×2. Serve pro Diego conferir o visual antes de liberar.
// uso: node scripts/foto-casa-luca.mjs [--porta 5262] [--saida scripts/mockups/casa-luca]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5262'), SAIDA = arg('saida', 'scripts/mockups/casa-luca')
mkdirSync(SAIDA, { recursive: true })
const vite = spawn('npx', ['vite', '--port', PORTA, '--strictPort'], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

// banco falso: só nesta página. `window.__rpc[nome]` responde cada função.
const PREPARA = `
  const S = await import('/src/lib/supabase.ts'); const sb = S.supabase
  window.__rpc = {}
  sb.rpc = async (n) => ({ data: typeof window.__rpc[n] === 'function' ? window.__rpc[n]() : (window.__rpc[n] ?? null), error: null })
  sb.auth.getSession = async () => ({ data: { session: { user: { id: 'u-exemplo', email: 'exemplo@teste.invalid' } } }, error: null })
  sb.auth.getUser = async () => ({ data: { user: { id: 'u-exemplo', email: 'exemplo@teste.invalid', user_metadata: { display_name: 'Leões da Vila EC' } } }, error: null })
  sb.functions.invoke = async () => ({ data: null, error: { message: 'exemplo' } })
  const SP = await import('/src/escalacao/sport.ts'); SP.casaLucaParaTeste(true)
  window.__CL = await import('/src/escalacao/casa-luca.tsx')
  const antigo = document.getElementById('root'); if (antigo) antigo.remove()
  document.body.style.cssText = 'margin:0;background:#F4ECD6'
  const dias = (d) => new Date(Date.now() - d * 864e5).toISOString()
  window.__MURAL = [['Real Quintal FC', 0], ['Leões da Vila EC', 0.1], ['Pé de Pano FC', 1], ['Unidos do Bairro', 2], ['Esporte Clube Varal', 2.2], ['Fúria Laranja FC', 4]].map(([nome, d]) => ({ nome, criado_em: dias(d) }))
`
// a tela abre por cima de tudo (fixa); pra foto da página inteira, ela vira bloco normal
const SOLTA = `document.querySelectorAll('[role=dialog]').forEach(d => { d.style.position = 'static'; d.style.minHeight = '844px' })`
const espere = ms => new Promise(r => setTimeout(r, ms))

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR' })
await ctx.addInitScript(() => { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ok */ } })
async function pagina() {
  const p = await ctx.newPage()
  p.on('pageerror', e => console.error('💥', e.message))
  await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })
  await p.evaluate(`(async () => { ${PREPARA} })()`)
  return p
}
const foto = async (p, nome) => { await p.evaluate(SOLTA); await espere(250); await p.screenshot({ path: `${SAIDA}/${nome}.png`, fullPage: true }); console.log(`📸 ${SAIDA}/${nome}.png`) }

// 1 · doação, mural VAZIO (o mural nem aparece)
{ const p = await pagina(); await p.evaluate(`window.__rpc.esc_luca_mural = []; window.__CL.abrirDoacaoLuca()`); await espere(900); await foto(p, 'real-doacao-mural-vazio'); await p.close() }
// 2 · doação, "outro valor" escolhido + mural COM nomes
{ const p = await pagina(); await p.evaluate(`window.__rpc.esc_luca_mural = window.__MURAL; window.__CL.abrirDoacaoLuca()`); await espere(900)
  await p.getByText('Outro valor', { exact: true }).click(); await p.locator('input[inputmode=decimal]').fill('15'); await espere(400)
  await foto(p, 'real-doacao-mural-com-nomes'); await p.close() }
// 3 · doação PAGA → pergunta do mural
{ const p = await pagina()
  await p.evaluate(`window.__rpc.esc_luca_mural = window.__MURAL; window.__rpc.esc_mp_meu_pendente2 = [{ pedido_id: 'p1', valor: 10, qr_code: '00020126...', qr_base64: null, expira_em: new Date(Date.now() + 864e5).toISOString() }]; window.__rpc.esc_mp_status_v2 = [{ status: 'liberado', ficha: null }]; window.__CL.abrirDoacaoLuca()`)
  await espere(1200); await p.getByText('Já paguei, conferir agora').click(); await espere(900)
  await foto(p, 'real-doacao-paga-mural'); await p.close() }
// 4 · Plano Coração (o que é)
const MEU = (st, selo = false) => `window.__rpc.esc_coracao_meu = { aberto: true, status: ${st ? `'${st}'` : 'null'}, desde: ${st === 'aprovado' ? "'2026-11-03T12:00:00Z'" : 'null'}, selo: ${selo} }`
{ const p = await pagina(); await p.evaluate(`${MEU(null)}; window.__CL.abrirPlanoCoracao()`); await espere(900); await foto(p, 'real-coracao-plano'); await p.close() }
// 5 · formulário preenchido (foto de exemplo)
{ const p = await pagina(); await p.evaluate(`${MEU(null)}; window.__CL.abrirPlanoCoracao()`); await espere(900)
  await p.getByText('Pedir o Plano Coração', { exact: false }).last().click(); await espere(300)
  await p.getByText('Sou pai/mãe/', { exact: false }).click()
  await p.evaluate(`(async () => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 400; const g = c.getContext('2d')
    g.fillStyle = '#dfe9f7'; g.fillRect(0, 0, 640, 400); g.fillStyle = '#9fb3cf'; g.fillRect(30, 40, 150, 190); g.fillStyle = '#7d8fa8'
    for (let i = 0; i < 5; i++) g.fillRect(210, 60 + i * 40, 380 - i * 40, 18)
    g.font = 'bold 34px sans-serif'; g.fillStyle = '#2c3e5a'; g.fillText('EXEMPLO', 230, 360)
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .9))
    const dt = new DataTransfer(); dt.items.add(new File([blob], 'foto_carteirinha.jpg', { type: 'image/jpeg' }))
    const inp = document.querySelector('input[type=file]'); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }))
  })()`)
  await espere(900); await foto(p, 'real-coracao-formulario'); await p.close() }
// 6 · aprovado: assinar pela metade + selo
{ const p = await pagina(); await p.evaluate(`${MEU('aprovado', true)}; window.__CL.abrirPlanoCoracao()`); await espere(900); await foto(p, 'real-coracao-aprovado'); await p.close() }
// 7 · #admin (fila + já decididos + mural)
{ const p = await pagina()
  await p.evaluate(`(async () => {
    const R = await import('/@id/react'); const React = R.default ?? R; const h = React.createElement
    const RD = await import('/@id/react-dom/client'); const createRoot = RD.createRoot ?? RD.default?.createRoot
    const A = await import('/src/escalacao/admin.tsx')
    document.body.style.cssText = 'margin:0;background:#14110c;padding:12px 14px;font-family:Inter,system-ui'
    const doc = (() => { const c = document.createElement('canvas'); c.width = 320; c.height = 200; const g = c.getContext('2d'); g.fillStyle = '#dfe9f7'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#9fb3cf'; g.fillRect(16, 20, 76, 96); g.fillStyle = '#7d8fa8'; for (let i = 0; i < 4; i++) g.fillRect(108, 30 + i * 22, 190 - i * 24, 10); return c.toDataURL() })()
    const d = (h) => new Date(Date.now() - h * 36e5).toISOString()
    const lista = [
      { id: 12, email: 'joao.exemplo@gmail.com', clube: 'Leões da Vila EC', quem: 'responsavel', prova: 'carteirinha', foto_path: 'x/1.jpg', status: 'pedido', criado_em: d(2), decidido_em: null, foto_apagada_em: null },
      { id: 11, email: 'maria.exemplo@hotmail.com', clube: 'Real Quintal FC', quem: 'pcd', prova: 'laudo', foto_path: 'x/2.jpg', status: 'pedido', criado_em: d(5), decidido_em: null, foto_apagada_em: null },
      { id: 9, email: 'renato.exemplo@gmail.com', clube: null, quem: 'pcd', prova: 'carteirinha', foto_path: null, status: 'aprovado', criado_em: d(60), decidido_em: d(50), foto_apagada_em: d(50) },
      { id: 8, email: 'ana.exemplo@gmail.com', clube: null, quem: 'responsavel', prova: 'laudo', foto_path: null, status: 'recusado', criado_em: d(90), decidido_em: d(80), foto_apagada_em: d(80) },
    ]
    const mural = window.__MURAL.slice(0, 3).map((m, i) => ({ email: 'e' + i + '@x', nome: m.nome, escondido: i === 2, criado_em: m.criado_em }))
    const root = document.createElement('div'); document.body.appendChild(root)
    createRoot(root).render(h('div', null, h('p', { style: { color: '#FFC400', font: '900 20px Oswald', margin: '0 0 4px' } }, 'PAINEL DO CRIADOR · #admin'), h(A.CoracaoAdmin, { previa: { lista, fotos: { 12: doc, 11: doc }, mural } })))
  })()`)
  await espere(900); await p.screenshot({ path: `${SAIDA}/real-admin.png`, fullPage: true }); console.log(`📸 ${SAIDA}/real-admin.png`); await p.close() }

await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
