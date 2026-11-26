// 🧪 🎽 CORES DOS CLUBES DE VERDADE (26/11) — toda copa convocada (Libertadores, Super Mundial, Champions e regionais da sala) veste
// o clube com a camisa dele no Campo 2D, e camisa parecida nunca deixa os dois iguais (o visitante troca).
// uso: npm run cores-clubes
import { corDoClubeReal, CORES_CLUBES_REAIS } from '../src/escalacao/cores-clubes-reais'
import { SELOS } from '../src/escalacao/selos-clubes'
import { clubCanon } from '../src/escalacao/data'
import { camisasDoJogo } from '../src/escalacao/camisas-2d'
import { LIBERTA_CLUBES } from '../src/escalacao/liberta-sala'
import { MUNDIAL_CLUBES } from '../src/escalacao/mundial-sala'
import { CHAMPIONS_SALA_CLUBES } from '../src/escalacao/champions-sala'
import { COPAS_REGIONAIS, clubesDaCopa } from '../src/escalacao/copa-regional'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const todos = new Set<string>([...LIBERTA_CLUBES, ...MUNDIAL_CLUBES, ...CHAMPIONS_SALA_CLUBES].map(c => c.clube))
for (const id of Object.keys(COPAS_REGIONAIS)) for (const c of (clubesDaCopa as never as (i: string) => { todos: (string | { clube: string })[] })(id).todos) todos.add(typeof c === 'string' ? c : c.clube)
const SEM_REFERENCIA = new Set(['Ipatinga', 'River-PI']) // cor não confirmada: fica no escudo genérico (não se chuta)
const sem = [...todos].filter(c => !SELOS[clubCanon(c)] && !SELOS[c] && !CORES_CLUBES_REAIS[c] && !SEM_REFERENCIA.has(c))
ok(sem.length === 0, `${todos.size} clubes das copas convocadas com cor de verdade${sem.length ? ' — faltam: ' + sem.join(', ') : ''}`)
ok(corDoClubeReal('Flamengo') === SELOS['Flamengo'].c1 && corDoClubeReal('Palmeiras') === SELOS['Palmeiras'].c1, `Flamengo ${corDoClubeReal('Flamengo')} × Palmeiras ${corDoClubeReal('Palmeiras')} (o print do Diego)`)
// camisa parecida: o visitante nunca entra igual
const lista = [...todos]
let choques = 0
for (const a of lista) for (const b of lista) {
  if (a === b) continue
  const [c, f] = camisasDoJogo([corDoClubeReal(a)], [corDoClubeReal(b)])
  if (c.cor.toLowerCase() === f.cor.toLowerCase()) { choques++; if (choques < 4) ok(false, `${a} × ${b} entram com a mesma camisa`) }
}
ok(choques === 0, `${lista.length * (lista.length - 1)} confrontos possíveis: nenhum com as duas camisas iguais`)
// os arquivos das copas convocadas usam a cor do clube no 2D
import { readFileSync } from 'node:fs'
for (const f of ['copa-regional-online', 'liberta-sala-online', 'mundial-sala-online', 'champions-sala-online'])
  ok(/homeColor=\{c2d \? corDoClubeReal\(entrants\[h\]\.pais\)/.test(readFileSync(`src/escalacao/${f}.tsx`, 'utf8')), `${f}: Campo 2D com a camisa do clube`)
console.log(falhas ? `\n❌ ${falhas} falha(s) nas cores dos clubes` : '\n✅ cores dos clubes de verdade nas copas convocadas')
if (falhas) process.exit(1)
