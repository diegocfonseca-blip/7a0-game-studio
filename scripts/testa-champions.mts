// 🧪 TRAVA DA CHAMPIONS — a mesa tem que fechar antes de virar jogo
//
// O formato real (36 numa tabela, 8 jogos cada) tem três coisas que, se saírem
// erradas, só aparecem DEPOIS de alguém jogar uma competição inteira:
//   ① alguém pegar o MESMO adversário duas vezes (e outro ficar de fora);
//   ② alguém jogar mais ou menos que 8 (tabela injusta e ninguém percebe);
//   ③ o convidado não ser clube de GENTE (foi a ordem do Diego — a Champions
//     existe pra dar palco a quem batizou).
//
// Rodar:  npx tsx scripts/testa-champions.mts

import {
  championsConvidados, potesChampions, calendarioChampions, repescaoChampions,
  zonaChampions, CHAMPIONS_CLUBES, CHAMPIONS_RODADAS, CHAMPIONS_DIRETO, CHAMPIONS_REPESCAO,
} from '../src/escalacao/champions'
import { BATISMOS, chaveClube } from '../src/escalacao/batismos'

let erros = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) erros++ }

// dado preso: a mesa tem que ser a MESMA toda vez (reabrir o jogo não re-sorteia)
function rngDe(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } }

console.log('1) os 28 convidados: clube de GENTE, de cima pra baixo na pirâmide')
{
  const liga = ['Neymarzetti', 'Xurupitas FC'] // já estão na sala: não podem ser convidados
  const conv = championsConvidados(liga)
  ok(conv.length === 28, `vieram 28 convidados (vieram ${conv.length})`)
  ok(new Set(conv.map(c => chaveClube(c.name))).size === 28, 'nenhum repetido')
  ok(!conv.some(c => ['neymarzetti', 'xurupitas fc'].includes(chaveClube(c.name))), 'ninguém que já está na liga foi convidado de novo')

  const donos = new Set(BATISMOS.map(b => chaveClube(b.clube)))
  const deGente = conv.filter(c => donos.has(chaveClube(c.name))).length
  ok(deGente >= 20, `a maioria é clube de gente de verdade: ${deGente} de 28 têm dono`)

  // a ordem é A → B → C → D → Várzea (a divisão nunca SOBE no meio da lista)
  const peso: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, V: 4 }
  const foraDeOrdem = conv.some((c, i) => i > 0 && peso[c.divisao] < peso[conv[i - 1].divisao])
  ok(!foraDeOrdem, 'a ordem respeita a pirâmide: Série A primeiro, Várzea por último')
  ok(conv[0].divisao === 'A', `o primeiro convidado é da Série A (${conv[0].name})`)

  // dentro da divisão, quem tem DONO vem antes do genérico
  const primeiroA = conv.filter(c => c.divisao === 'A')
  const ultimoDono = primeiroA.map(c => donos.has(chaveClube(c.name))).lastIndexOf(true)
  const primeiroGenerico = primeiroA.map(c => donos.has(chaveClube(c.name))).indexOf(false)
  ok(primeiroGenerico === -1 || ultimoDono < primeiroGenerico, 'dentro da Série A, clube com dono vem antes do genérico')
}

console.log('\n2) o calendário: 8 jogos cada, sem repetir adversário')
{
  const ids = Array.from({ length: CHAMPIONS_CLUBES }, (_, i) => i + 1)
  const forcas = ids.map((_, i) => 80 - i) // do mais forte pro mais fraco
  const potes = potesChampions(forcas)
  ok(potes.filter(p => p === 1).length === 9 && potes.filter(p => p === 4).length === 9, '4 potes de 9')

  const cal = calendarioChampions(ids, potes, rngDe(2026))
  ok(cal.length === CHAMPIONS_RODADAS, `${CHAMPIONS_RODADAS} rodadas`)
  ok(cal.every(r => r.length === 18), 'cada rodada tem 18 jogos (os 36 em campo)')

  const jogos = new Map<number, number[]>(ids.map(i => [i, []]))
  const casa = new Map<number, number>(ids.map(i => [i, 0]))
  for (const rodada of cal) for (const [h, a] of rodada) {
    jogos.get(h)!.push(a); jogos.get(a)!.push(h); casa.set(h, casa.get(h)! + 1)
  }
  ok([...jogos.values()].every(v => v.length === CHAMPIONS_RODADAS), `todo clube joga exatamente ${CHAMPIONS_RODADAS}`)
  const repetiu = [...jogos.entries()].filter(([, v]) => new Set(v).size !== v.length)
  ok(repetiu.length === 0, `ninguém pega o mesmo adversário duas vezes${repetiu.length ? ` (falhou em ${repetiu.length})` : ''}`)
  ok([...jogos.entries()].every(([id, v]) => !v.includes(id)), 'ninguém joga contra si mesmo')
  ok([...casa.values()].every(n => n === 4), 'todo clube faz 4 em casa e 4 fora')

  // 🎱 a régua dos potes: os 8 adversários saem de potes DIFERENTES do seu
  const poteDe = new Map(ids.map((id, i) => [id, potes[i]]))
  const mesmoPote = [...jogos.entries()].filter(([id, v]) => v.some(o => poteDe.get(o) === poteDe.get(id)))
  ok(mesmoPote.length === 0, 'ninguém pega adversário do PRÓPRIO pote (é a régua do formato)')

  // e a mesa é PRESA na semente: reabrir o jogo devolve o mesmo calendário
  const cal2 = calendarioChampions(ids, potes, rngDe(2026))
  ok(JSON.stringify(cal) === JSON.stringify(cal2), 'mesma semente = mesmo calendário (reabrir não re-sorteia)')
  const cal3 = calendarioChampions(ids, potes, rngDe(7))
  ok(JSON.stringify(cal) !== JSON.stringify(cal3), 'semente diferente = calendário diferente (é sorteio de verdade)')
}

console.log('\n3) os cortes e o repescão')
{
  ok(zonaChampions(1) === 'direto' && zonaChampions(8) === 'direto', '1º ao 8º vão direto pras oitavas')
  ok(zonaChampions(9) === 'repescao' && zonaChampions(24) === 'repescao', '9º ao 24º jogam o repescão')
  ok(zonaChampions(25) === 'fora' && zonaChampions(36) === 'fora', '25º ao 36º estão fora')

  const tabela = Array.from({ length: CHAMPIONS_CLUBES }, (_, i) => i + 1) // 1º..36º
  const pares = repescaoChampions(tabela)
  ok(pares.length === 8, '8 confrontos no repescão (16 clubes por 8 vagas)')
  ok(pares[0][0] === 9 && pares[0][1] === 24, 'o 9º pega o 24º — quem foi melhor pega quem foi pior')
  ok(pares[7][0] === 16 && pares[7][1] === 17, 'e o 16º pega o 17º, que é o confronto mais parelho')
  const dentro = pares.flat()
  ok(new Set(dentro).size === 16, 'os 16 do meio entram uma vez cada')
  ok(!dentro.some(p => p <= CHAMPIONS_DIRETO || p > CHAMPIONS_REPESCAO), 'nenhum do top 8 e nenhum dos eliminados cai no repescão')

  // 8 do top + 8 que sobem = as 16 das oitavas
  ok(CHAMPIONS_DIRETO + pares.length === 16, 'top 8 + 8 do repescão = as 16 das oitavas')
}


// ─── 4) A COMPETIÇÃO INTEIRA, de ponta a ponta ──────────────────────────────
// Os testes de cima olham a MESA (quem entra, o calendário, os cortes). Este
// aqui joga a Champions COMPLETA com um motor de mentira, pra provar que a
// competição chega ao fim com um campeão — que é o que o jogador vive.
console.log('\n4) a competição inteira chega num campeão')
{
  const ids = Array.from({ length: CHAMPIONS_CLUBES }, (_, i) => i + 1)
  const forca = new Map(ids.map(i => [i, 80 - i]))
  const potes = potesChampions(ids.map(i => forca.get(i)!))
  const cal = calendarioChampions(ids, potes, rngDe(99))
  const pts = new Map(ids.map(i => [i, 0])), gf = new Map(ids.map(i => [i, 0])), ga = new Map(ids.map(i => [i, 0]))
  const rng = rngDe(4242)
  const joga = (h: number, a: number): [number, number] => {
    const vh = forca.get(h)! + 6, va = forca.get(a)!
    return [Math.floor(rng() * 3 * (vh / va)), Math.floor(rng() * 3 * (va / vh))]
  }
  for (const rodada of cal) for (const [h, a] of rodada) {
    const [x, y] = joga(h, a)
    gf.set(h, gf.get(h)! + x); ga.set(h, ga.get(h)! + y)
    gf.set(a, gf.get(a)! + y); ga.set(a, ga.get(a)! + x)
    if (x > y) pts.set(h, pts.get(h)! + 3); else if (y > x) pts.set(a, pts.get(a)! + 3)
    else { pts.set(h, pts.get(h)! + 1); pts.set(a, pts.get(a)! + 1) }
  }
  const tabela = [...ids].sort((p, q) => pts.get(q)! - pts.get(p)! || (gf.get(q)! - ga.get(q)!) - (gf.get(p)! - ga.get(p)!) || p - q)
  ok(tabela.length === CHAMPIONS_CLUBES, 'a tabela fechou com os 36')

  // repescão: ida e volta, agregado (empate → quem foi melhor na tabela passa)
  const sobem = repescaoChampions(tabela).map(([melhor, pior]) => {
    const [i1, i2] = joga(pior, melhor), [v1, v2] = joga(melhor, pior)
    const gMelhor = i2 + v1, gPior = i1 + v2
    return gMelhor >= gPior ? melhor : pior
  })
  ok(sobem.length === 8, '8 clubes sobem do repescão')
  ok(new Set(sobem).size === 8, 'sem repetido entre os que sobem')

  // oitavas → final, ida e volta
  let vivos = [...tabela.slice(0, CHAMPIONS_DIRETO), ...sobem]
  ok(vivos.length === 16, 'as oitavas começam com 16')
  const fases: string[] = []
  while (vivos.length > 1) {
    fases.push(`${vivos.length}`)
    const prox: number[] = []
    for (let i = 0; i < vivos.length; i += 2) {
      const A = vivos[i], B = vivos[i + 1]
      const [i1, i2] = joga(B, A), [v1, v2] = joga(A, B)
      const gA = i2 + v1, gB = i1 + v2
      prox.push(gA >= gB ? A : B)
    }
    vivos = prox
  }
  ok(vivos.length === 1, `sobrou UM campeão (clube ${vivos[0]})`)
  ok(fases.join('→') === '16→8→4→2', `as fases correram na ordem: ${fases.join(' → ')} → campeão`)
}

console.log(erros ? `\n❌ ${erros} problema(s)` : '\n✅ tudo certo — a Champions fecha, da mesa ao campeão')
process.exit(erros ? 1 : 0)
