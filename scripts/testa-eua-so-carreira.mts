// 🏀🇺🇸 Trava (19/11, Diego): as cartas novas do EUA Oficial são SÓ da carreira — nunca salas online nem Partida Rápida.
// Reprova se alguém importar `data-basquete-eua` fora dos arquivos do modo (eua-*.ts/tsx), se uma carta nova repetir pessoa que
// já está no baralho NBA (mesma pessoa só em baralho diferente) ou se o nível sair da régua de 02/11.
import fs from 'node:fs'
import path from 'node:path'
import { CATALOG_NBA } from '../src/escalacao/data-basquete.ts'
import { CATALOG_NBA_EUA } from '../src/escalacao/data-basquete-eua.ts'
let erros = 0
const falha = (m: string) => { erros++; console.error('❌ ' + m) }
const dir = 'src/escalacao'
for (const f of fs.readdirSync(dir)) {
  if (!/\.(ts|tsx)$/.test(f) || f === 'data-basquete-eua.ts' || f.startsWith('eua-')) continue
  if (/from ['"]\.\/data-basquete-eua['"]|import\(['"]\.\/data-basquete-eua['"]\)/.test(fs.readFileSync(path.join(dir, f), 'utf8'))) falha(`${f} importa as cartas do EUA Oficial (só o modo pode)`)
}
const sa = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\./g, '').trim()
const antigas = new Set(Object.values(CATALOG_NBA).flat().map(c => sa(c.name)))
const vistas = new Set<string>()
const faixa: Record<number, [number, number]> = { 1: [55, 66], 2: [66, 79], 3: [68, 85], 4: [80, 89] }
let n = 0
for (const c of Object.values(CATALOG_NBA_EUA).flat()) {
  n++
  const k = sa(c.name)
  if (antigas.has(k)) falha(`${c.name} já tem carta no baralho NBA`)
  if (vistas.has(k)) falha(`${c.name} repetido nas cartas novas`); vistas.add(k)
  const m = (c.lo + c.hi) / 2, [a, b] = faixa[c.fame] ?? [0, 0]
  if (c.fame === 5 || m < a - 1 || m > b + 1) falha(`${c.name} fora da régua (fame ${c.fame}, média ${m})`)
  if (!c.bioPt || !c.bioEn) falha(`${c.name} sem bio PT/EN`)
}
console.log(erros ? `❌ ${erros} problema(s)` : `✅ EUA Oficial: ${n} cartas novas, só na carreira, sem repetir ninguém do baralho NBA, todas na régua`)
process.exit(erros ? 1 : 0)
