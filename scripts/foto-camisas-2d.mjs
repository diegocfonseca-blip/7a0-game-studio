// 📸 MOCKUP das CAMISAS do Campo 2D (06/11): o campinho DE VERDADE (bancada scripts/teste-campo2d/) em 390×844 ×2.
//   node scripts/foto-camisas-2d.mjs  →  scripts/mockups/camisas-2d-{1,2,3,4}.png
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const RAIZ = fileURLToPath(new URL('..', import.meta.url))
const PORTA = '5266'
const vite = spawn('npx', ['vite', '--port', PORTA, '--strictPort'], { cwd: RAIZ, env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORTA}/scripts/teste-campo2d/`); if (r.ok) break } catch { /* sobe */ } await new Promise(r => setTimeout(r, 500)) }
mkdirSync(`${RAIZ}scripts/mockups`, { recursive: true })
const BEGE = '#B2A583', PRATA = '#8E9BAB', OURO = '#C9A227'
const FOTOS = [
  { n: 1, casa: 'Crias do Bigão', corCasa: OURO, fora: 'Joaquim FC', corFora: BEGE, legenda: '🖋️ Batismo veste o MANTO (azul + amarelo)\n🟫 sem plano = camisa BEGE' },
  { n: 2, casa: 'Leões Dourados', corCasa: OURO, fora: 'Prata da Casa', corFora: PRATA, legenda: '👑 Lenda = DOURADO · ⭐ Craque = PRATA\n(as lendas continuam com o rosto)' },
  { n: 3, casa: 'Murriz FC', corCasa: OURO, fora: 'Wen Milan B', corFora: OURO, legenda: '⚔️ Dois mantos vermelho e preto: a casa fica de vermelho,\no visitante entra com a 2ª cor (preto, filete vermelho)' },
  { n: 5, casa: 'Leões Dourados', corCasa: OURO, fora: 'Reis do Ouro', corFora: OURO, legenda: '👑 × 👑 Dourado contra dourado: a casa fica DOURADA,\no visitante entra de reserva PRETA' },
  { n: 4, casa: 'Rei da Bola FC', corCasa: OURO, fora: 'Atlético Bot', corFora: '#3A7CA5', legenda: '🎽 Manto de 3 cores: vermelho + listras pretas\ne filete creme (Rei da Bola FC) × bot com a cor de hoje' },
]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
for (const f of FOTOS) {
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('💥', e.message))
  const q = new URLSearchParams({ casa: f.casa, corCasa: f.corCasa, fora: f.fora, corFora: f.corFora, de: '31', vel: '1', legenda: f.legenda, clima: 'sol', noite: '0' })
  await p.goto(`http://localhost:${PORTA}/scripts/teste-campo2d/?${q}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(6500)
  await p.screenshot({ path: `${RAIZ}scripts/mockups/camisas-2d-${f.n}.png` })
  await p.close(); console.log('📸', f.n, f.casa, '×', f.fora)
}
await b.close(); try { process.kill(-vite.pid) } catch { /* já foi */ }
process.exit(0)
