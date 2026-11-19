// 🧪 19/11: deixa as travas (npx tsx) carregarem o store sem o Vite: arquivo de imagem/som/CSS vira texto e `import.meta.env` vira um objeto fixo.
// uso: npx tsx --import ./scripts/node-stub-reg.mjs scripts/<trava>.mts
import { register } from 'node:module'
globalThis.__IMEnv = { DEV: false, PROD: true, BASE_URL: '/', MODE: 'test' }
register('./node-stub-hooks.mjs', import.meta.url)
