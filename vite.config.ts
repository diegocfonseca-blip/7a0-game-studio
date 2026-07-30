import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'

// selo de versão: SHA curto do commit (ou data como fallback). Aparece discreto
// no rodapé pra dar pra saber, no olho, se a pessoa está na versão nova ou no cache.
let buildId = ''
try { buildId = execSync('git rev-parse --short HEAD').toString().trim() } catch { /* sem git */ }
if (!buildId) buildId = new Date().toISOString().slice(0, 10)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.DEPLOY_BASE ?? '/7a0-game-studio/',
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  // 🔎 mantém os NOMES das funções/classes no build minificado — assim, quando dá
  // crash, o "stack" na tela de erro mostra o nome real (ex.: LiveScoreCard) e dá pra
  // achar EXATAMENTE onde quebrou pelo print. Custo: bundle um tico maior, nada demais.
  esbuild: { keepNames: true } as import('vite').ESBuildOptions & { keepNames: boolean },
})
