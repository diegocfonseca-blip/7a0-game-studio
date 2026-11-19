import { CATALOG } from '../src/escalacao/data.ts'
import { CATALOG_OFICIAL_MODO } from '../src/escalacao/baralho-oficial.ts'
import { CLUBES_BR_TODOS } from '../src/escalacao/brasil-oficial.ts'
const nomes = new Set(CLUBES_BR_TODOS.flatMap((c: any) => [c.nome, ...(c.apelidos ?? [])]))
let tot = 0, lendas = 0, craques = 0
const ex: string[] = []
for (const p of Object.keys(CATALOG)) for (const c of [...(CATALOG as any)[p], ...((CATALOG_OFICIAL_MODO as any)[p] ?? [])]) {
  if (/Júlio César|Depay|Arrascaeta/.test(c.name)) ex.push(`${c.name} · ${c.club} ${c.year} · ${nomes.has(c.club) ? 'ENTRA' : 'fora'}`)
  if (!nomes.has(c.club)) continue
  tot++; if (c.fame >= 5 && !c.promessa) lendas++; if (c.fame === 4 && !c.promessa) craques++
}
console.log({ tot, lendas, craques }); console.log(ex.join('\n'))
