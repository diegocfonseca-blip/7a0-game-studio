// 🏀 trava das Minhas Carreiras do basquete (nba-carreiras.ts): trocar/começar/apagar nunca perde carreira,
// nem com o aparelho cheio. Rodar: npm run nba-carreiras
let cheio = false
const mem = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem.has(k) ? mem.get(k)! : null,
  setItem: (k: string, v: string) => { if (cheio) throw new Error('QuotaExceeded'); mem.set(k, v) },
  removeItem: (k: string) => { mem.delete(k) },
}
const m = await import('../src/escalacao/nba-carreiras.ts')
const mk = (id: string, team: string, season = 1) => ({ sport: 'basquete', nbaCareer: true, nbaCareerId: id, youIdx: 0, seasonNo: season, managers: [{ teamName: team }] }) as any
const ok = (c: boolean, msg: string) => { if (!c) { console.log('FALHOU:', msg); process.exit(1) } else console.log('ok -', msg) }
// carreira A ativa
mem.set('bl-nba-career', JSON.stringify(mk('A', 'Alfa', 3)))
ok(m.listaNbaCarreiras().length === 1, 'uma carreira ativa')
// começa B: guarda A
ok(m.guardaAtivaNba(), 'guardou A')
mem.set('bl-nba-career', JSON.stringify(mk('B', 'Beta')))
let l = m.listaNbaCarreiras()
ok(l.length === 2 && l[0].ativa && l[0].slot.save.nbaCareerId === 'B', 'B ativa, A no arquivo')
// troca pra A
const a = m.ativaNbaCarreira('A')
l = m.listaNbaCarreiras()
ok(a?.nbaCareerId === 'A' && l.length === 2 && l[0].slot.save.nbaCareerId === 'A' && l[1].slot.save.nbaCareerId === 'B', 'trocou pra A, B foi pro arquivo, nada sumiu')
// aparelho cheio: troca não acontece e nada se perde
cheio = true
const r = m.ativaNbaCarreira('B')
cheio = false
l = m.listaNbaCarreiras()
ok(r === null && l.length === 2 && l[0].slot.save.nbaCareerId === 'A', 'aparelho cheio: não trocou e as duas continuam lá')
cheio = true
ok(m.guardaAtivaNba() === false, 'aparelho cheio: não deixa começar nova')
cheio = false
ok(m.listaNbaCarreiras().length === 2, 'aparelho cheio: ainda as duas')
// apaga B
m.apagaNbaCarreira('B')
l = m.listaNbaCarreiras()
ok(l.length === 1 && l[0].slot.save.nbaCareerId === 'A', 'apagou só B')
// carreira antiga sem código
mem.clear(); mem.set('bl-nba-career', JSON.stringify({ ...mk('x', 'Velho'), nbaCareerId: undefined }))
ok(m.guardaAtivaNba() && m.listaNbaCarreiras().length === 1, 'carreira antiga (sem código) vai pro arquivo')
ok(!!m.ativaNbaCarreira(m.idDe(m.listaNbaCarreiras()[0].slot.save)), 'e volta do arquivo')
console.log('TUDO OK')
