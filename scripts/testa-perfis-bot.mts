// 🧪 TRAVA DOS PERFIS DOS BOTS NO LEILÃO (Diego 07/10)
// Pedido: *"pode fazer tudo isso que você disse dos bots, mais imprevisíveis e reais"*.
// O que esta trava garante:
//  1. o perfil é fixo DENTRO da carreira e sorteado de carreira pra carreira;
//  2. 'equilibrado' é EXATAMENTE o leilão de antes (mesmo lance, mesmo sorteio);
//  3. gastador estica por craque/lenda, pão-duro nunca passa do justo, obcecado põe o
//     dinheiro no setor dele, imprevisível às vezes endoidece numa carta média;
//  4. nenhum perfil dá lance acima do dinheiro que o bot tem;
//  5. 🚫📈 o exagero do bot NÃO entra no piso: livro e `paid` ficam no preço justo.
// Rodar:  npm run perfis
process.on('uncaughtException', e => { if (!String(e?.message).includes('DEV')) throw e })
const S: any = await import('../src/escalacao/store.tsx')
const P: any = await import('../src/escalacao/perfis-bot.ts')
const D: any = await import('../src/escalacao/data.ts')
const B: any = await import('../src/escalacao/batismos.ts')

let erros = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) erros++ }
const rngDe = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
const bot = (nome: string, money = 100): any => ({ id: 7, name: nome, teamName: nome, isHuman: false, auctionRival: true, formation: '4-3-3', money, squad: [], aggression: 0.6, starHunger: 0.6 })
const carta = (id: string, fame: number, lo: number, hi: number, pos = 'ATA'): any => ({ id, name: `Jogador ${id}`, club: 'Clube', year: 2000, pos, fame, lo, hi })
const mesa = [carta('a', 5, 88, 95), carta('b', 4, 82, 90), carta('c', 3, 74, 84), carta('d', 2, 68, 78), carta('e', 1, 55, 70)]
const SETOR_ATA = 4

console.log('1) perfil fixo DENTRO da carreira, sorteado de carreira pra carreira')
const bots: string[] = [...new Set([...Object.values(D.DIVISION_TEAMS).flat().map((t: any) => t.team), ...B.BATISMOS.map((b: any) => b.clube)])] as string[]
ok(bots.every(n => P.perfilDoClube(n, 123) === P.perfilDoClube(n, 123)), 'mesmo clube + mesma carreira → mesmo perfil, sempre')
const mudou = bots.filter(n => P.perfilDoClube(n, 123) !== P.perfilDoClube(n, 98765)).length
ok(mudou > bots.length * 0.5, `em outra carreira o perfil muda (${mudou} de ${bots.length} clubes trocaram)`)
const cont: Record<string, number> = {}
for (const n of bots) { const p = P.perfilDoClube(n, 123); cont[p] = (cont[p] ?? 0) + 1 }
console.log('     distribuição nos', bots.length, 'clubes bot:', JSON.stringify(cont))
ok(Object.keys(cont).length === 5 && Object.values(cont).every(v => v >= bots.length * 0.08), 'os 5 perfis aparecem, nenhum some')

console.log('2) equilibrado = o leilão de antes')
{
  const a = S.cpuEnvelope(bot('X'), mesa, SETOR_ATA, rngDe(42), false, 1)
  const b = S.cpuEnvelope(bot('X'), mesa, SETOR_ATA, rngDe(42), false, 1, 'equilibrado', undefined)
  ok(JSON.stringify(a) === JSON.stringify(b), 'mesmo lance e mesmo sorteio com perfil equilibrado')
}

console.log('3) cada perfil compra do seu jeito (média de 400 leilões)')
const media = (perfil: string, filtro: (id: string) => boolean, obs?: string, money = 100) => {
  let soma = 0
  for (let i = 1; i <= 400; i++) for (const b of S.cpuEnvelope(bot('X', money), mesa, SETOR_ATA, rngDe(i * 7919), false, 1, perfil, obs)) if (filtro(b.cardId)) soma += b.amount
  return soma / 400
}
const craque = (id: string) => id === 'a' || id === 'b'
const eq = media('equilibrado', craque), ga = media('gastador', craque), pd = media('paoduro', craque)
console.log(`     gasto médio em craque/lenda · equilibrado ${eq.toFixed(1)} · gastador ${ga.toFixed(1)} · pão-duro ${pd.toFixed(1)}`)
ok(ga > eq * 1.1, 'gastador paga mais por craque e lenda')
ok(pd < eq, 'pão-duro paga menos')
// (medido num setor do COMEÇO: no ataque, que é o último, todo bot já gasta o que sobrou)
const mesaLat = mesa.map(c => ({ ...c, pos: 'LAT' }))
const mediaLat = (obs: string) => { let soma = 0; for (let i = 1; i <= 400; i++) for (const b of S.cpuEnvelope(bot('X'), mesaLat, 1, rngDe(i * 7919), false, 1, 'obcecado', obs)) soma += b.amount; return soma / 400 }
const obsNoSetor = mediaLat('LAT'), obsFora = mediaLat('GOL')
ok(obsNoSetor > obsFora * 1.5, `obcecado põe o dinheiro no setor dele (${obsNoSetor.toFixed(1)} × ${obsFora.toFixed(1)} fora dele)`)
{
  let loucuras = 0
  for (let i = 1; i <= 400; i++) {
    const normal = S.cpuEnvelope(bot('X'), mesa, SETOR_ATA, rngDe(i * 31), false, 1, 'equilibrado')
    const louco = S.cpuEnvelope(bot('X'), mesa, SETOR_ATA, rngDe(i * 31), false, 1, 'imprevisivel')
    const maxN = Math.max(0, ...normal.filter((b: any) => !craque(b.cardId)).map((b: any) => b.amount))
    const maxL = Math.max(0, ...louco.filter((b: any) => !craque(b.cardId)).map((b: any) => b.amount))
    if (maxL > maxN * 1.4) loucuras++
  }
  ok(loucuras > 10 && loucuras < 200, `imprevisível endoidece às vezes numa carta média (${loucuras} de 400)`)
}

console.log('4) ninguém dá lance acima do bolso')
{
  let estourou = 0
  for (const perfil of ['gastador', 'paoduro', 'obcecado', 'imprevisivel', 'equilibrado'])
    for (let i = 1; i <= 300; i++) for (const money of [3, 15, 60, 400]) {
      const env = S.cpuEnvelope(bot('X', money), mesa, SETOR_ATA, rngDe(i * 13 + money), i % 2 === 0, 1, perfil, 'ATA')
      if (env.reduce((s: number, b: any) => s + b.amount, 0) > money) estourou++
    }
  ok(estourou === 0, 'soma dos lances nunca passa do dinheiro do bot, em nenhum perfil')
}

console.log('5) 🚫📈 o exagero do bot não entra no piso')
{
  const st: any = { careerOnline: true, managers: [], seasonNo: 3, seed: 123 }
  const gastador = bots.find(n => P.perfilDoClube(n, 123) === 'gastador')!
  const paoduro = bots.find(n => P.perfilDoClube(n, 123) === 'paoduro')!
  const c = carta('z', 4, 82, 90)
  const justo = S.justoDaCarta(st, c)
  const w = bot(gastador); w.squad.push({ ...c, paid: justo * 3 })
  const registrado = S.travaPisoDoBot(st, w, c, justo * 3)
  ok(registrado === justo && w.squad[0].paid === justo, `gastador pagou ${justo * 3}, a carta fica registrada no justo (${justo})`)
  const w2 = bot(paoduro); w2.squad.push({ ...c, paid: justo * 3 })
  ok(S.travaPisoDoBot(st, w2, c, justo * 3) === justo * 3, 'perfil que não paga acima (pão-duro) segue a regra de sempre')
  const humano = { ...bot('Eu'), isHuman: true }
  ok(S.travaPisoDoBot(st, humano, c, justo * 3) === justo * 3, 'humano nunca passa pela trava (o que ele paga é o que vale)')
  ok(S.travaPisoDoBot({ ...st, careerOnline: false }, w, c, justo * 3) === justo * 3, 'fora da carreira nada muda')
}

console.log(erros ? `\n❌ ${erros} falha(s)` : '\n✅ tudo certo — bots com perfil, sem mexer no piso do jogo')
process.exit(erros ? 1 : 0)
