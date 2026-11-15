// 📸 FOTO DA SIMULAÇÃO DA PIRÂMIDE (15/11): imprime um hash de tabelas+jogos+artilharia de 2 carreiras fixas. Rodar ANTES e
// DEPOIS de mexer no motor da pirâmide: o hash tem que ser o MESMO (a carreira de sempre não pode mudar). Hash de 15/11:
// aeb8ae13379a190f2c5afc1c2f97686a751a3092bb7dd64a3822de75fb60f58e (re-semeado por carreira desde 15/11, noite)
let x = 123456789; Math.random = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1000000) / 1000000 }
Date.now = () => 1763251200000
const { createServer } = await import('/home/user/7a0-game-studio/node_modules/vite/dist/node/index.js')
const vite = await createServer({ root: '/home/user/7a0-game-studio', server: { middlewareMode: true, watch: null }, appType: 'custom', logLevel: 'silent' })
const { reducer, INITIAL } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const P = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
const { createHash } = await import('node:crypto')
let out = ''
for (const seedTeam of ['Foto FC', 'Outro EC']) {
  x = 123456789 // re-semeia aqui: a ordem de carga dos módulos não pode mexer na foto
  const s = reducer(INITIAL, { type: 'START_CAREER_SOLO', teamName: seedTeam, formation: '4-3-3', rivals: 5, league: 'both' })
  const w = P.buildPyramid(s.managers, 0, s.seed, s.deckLeague, s.careerPlacements, s.cpuSquads)
  for (const r of [1, 10, 38]) { const res = P.simulatePyramid(w, s.seed, r); out += JSON.stringify([res.tables, res.matches, res.scorersAll, res.assistsAll]) }
}
console.log(createHash('sha256').update(out).digest('hex'))
await vite.close()
