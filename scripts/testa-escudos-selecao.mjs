// 🛡️ Trava (30/10): toda seleção com bandeira cadastrada na Copa (FLAG em copa-mundo.tsx) tem que ter ESCUDO
// em national-crest.tsx e o arquivo em img/nations-v25 — senão a Copa mostra o NOME escrito no lugar do escudo
// (foi o que aconteceu com as 8 da Copa de 32 de 02/10 até 30/10).
import { readFileSync, existsSync } from 'node:fs'
const copa = readFileSync('src/escalacao/copa-mundo.tsx', 'utf8')
const bloco = copa.slice(copa.indexOf('const FLAG'), copa.indexOf('export const flagOf'))
const paises = [...bloco.matchAll(/'([^']+)':\s*'/g)].map(m => m[1])
const crest = readFileSync('src/escalacao/national-crest.tsx', 'utf8')
const names = JSON.parse(crest.match(/const names: Record<string,string> = (\{.*\})/)[1])
const falta = []
for (const p of paises) {
  const k = names[p]
  if (!k) falta.push(`${p}: sem linha em national-crest.tsx`)
  else if (!existsSync(`src/escalacao/img/nations-v25/${k}.webp`)) falta.push(`${p}: falta img/nations-v25/${k}.webp`)
}
if (falta.length) { console.error('❌ seleção sem escudo:\n  ' + falta.join('\n  ')); process.exit(1) }
console.log(`✅ ${paises.length} seleções, todas com escudo`)
