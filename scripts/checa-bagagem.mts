// ─── 🧳 A SALA NÃO LEVA A CARREIRA NA MALA (24/09) ──────────────────────────
//
// Sala do Final Boss FC (Tocaia, jogo rápido online): o estado que o dono gravava
// pesava 881 KB — 745 KB eram da CARREIRA dele (elenco dos 80 bots, artilharia e
// garçons de todos os tempos) que ficaram no estado quando ele abriu a sala. Isso ia
// em toda gravação do dono e em todo convidado; na Tocaia, a cada degrau do preço.
// Resultado: preço travado na tela e celular dos convidados enchendo.
//
// Esta trava PROVA:
//   1. sala de jogo rápido (careerOnline = false) sai SEM a bagagem de carreira;
//   2. carreira online (careerOnline = true) sai com TUDO — lá esses campos são o jogo;
//   3. o que o jogo rápido usa de verdade continua indo (livro-caixa, elenco, Tocaia);
//   4. o aparelho do dono não perde nada (o `sanitize` não mexe no estado dele);
//   5. um estado do tamanho da sala do Final Boss cai pra menos de 1/3.
//
//   npm run bagagem
import { sanitize, SEM_BAGAGEM_DE_CARREIRA } from '../src/escalacao/store.tsx'

let falhas = 0
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'PASS' : 'FAIL'} ${msg}`); if (!c) falhas++ }

const carta = (i: number) => ({ id: `c${i}`, name: `Jogador ${i}`, club: 'Clube', year: 1990 + (i % 30), pos: 'MEI', fame: 3, lo: 70, hi: 80 })
const cpuSquads = Object.fromEntries(Array.from({ length: 80 }, (_, t) => [`Bot ${t}`, Array.from({ length: 16 }, (_, i) => ({ ...carta(t * 16 + i), bio: 'x'.repeat(120) }))]))
const artilharia = Object.fromEntries(Array.from({ length: 1500 }, (_, i) => [`Jogador ${i}|Clube|${1990 + (i % 30)}`, { name: `Jogador ${i}`, teamName: `Bot ${i % 80}`, teamId: -1, div: 'A', goals: i % 40, you: false, human: false, club: 'Clube', year: 1990 }]))
const garcons = Object.fromEntries(Object.entries(artilharia).map(([k, v]) => [k, { ...v, assists: v.goals }]))
const livro = { 0: [{ id: 'x', kind: 'buy', label: '🛒 Manga', amount: -8, player: 'Manga', season: 1 }] }

const base = {
  phase: 'holandes', hol: { preco: 38, passo: 9, tetos: { c1: { 3: 40 } }, levados: [], pedidos: [], ultimo: null, resgate: true },
  managers: [{ id: 0, name: 'Dono', squad: [carta(1)] }], deck: { MEI: [carta(2)] }, currentCards: [carta(3)],
  pendingEnvelopes: { 1: [] }, careerLedgers: livro,
  cpuSquads, careerScorersAll: artilharia, careerAssistsAll: garcons, careerMelhorMundo: { 190: { name: 'Sócrates' } },
} as any

// 1 + 3 + 5: jogo rápido
const rapido = { ...base, careerOnline: false }
const antesKb = JSON.stringify(sanitize({ ...rapido, careerOnline: true } as any)).length / 1024
const saida = JSON.parse(JSON.stringify(sanitize(rapido)))
for (const k of Object.keys(SEM_BAGAGEM_DE_CARREIRA)) ok(!(k in saida), `jogo rápido: \`${k}\` não viaja`)
ok(JSON.stringify(saida.careerLedgers) === JSON.stringify(livro), 'jogo rápido: o livro-caixa da partida continua indo')
ok(saida.managers?.[0]?.squad?.length === 1 && saida.currentCards?.length === 1 && saida.hol?.preco === 38, 'jogo rápido: elenco, cartas da mesa e o preço da Tocaia continuam indo')
ok(JSON.stringify(saida.hol?.tetos) === '{}' && JSON.stringify(saida.pendingEnvelopes) === '{}', 'segredos do dono continuam de fora (tetos dos robôs e envelopes)')
const depoisKb = JSON.stringify(saida).length / 1024
ok(depoisKb < antesKb / 3, `peso: ${Math.round(antesKb)} KB → ${Math.round(depoisKb)} KB`)

// 2: carreira online leva tudo
const carreira = JSON.parse(JSON.stringify(sanitize({ ...base, careerOnline: true })))
for (const k of Object.keys(SEM_BAGAGEM_DE_CARREIRA)) ok(k in carreira, `carreira online: \`${k}\` continua viajando`)

// 4: o aparelho do dono não perde nada
ok(rapido.cpuSquads === cpuSquads && rapido.careerScorersAll === artilharia && rapido.careerAssistsAll === garcons, 'o estado do dono fica intacto (só o pacote emagrece)')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ a sala viaja sem a carreira de ninguém na mala')
process.exit(falhas ? 1 : 0)
