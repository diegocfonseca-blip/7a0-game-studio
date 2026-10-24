// 🔗 trava do ENTROSAMENTO (24/10): `npm run entrosamento`
import { gruposEntro, bonusEntro, comEntro, entrosaCom } from '../src/escalacao/entrosamento.ts'
let falhas = 0
const ok = (cond: boolean, msg: string) => { if (!cond) { falhas++; console.log('❌ ' + msg) } else console.log('✅ ' + msg) }
const c = (id: string, name: string, club: string, year: number, extra: object = {}) => ({ id, name, club, year, lo: 80, hi: 90, ...extra })
const xi = [
  c('1', 'Júnior', 'Flamengo', 1981), c('2', 'Adílio', 'Flamengo', 1981), c('3', 'Zico', 'Flamengo', 1981), c('4', 'Leandro', 'Flamengo', 1981),
  c('5', 'Edmundo', 'Vasco', 1997), c('6', 'Donizete', 'Vasco', 1997),
  c('7', 'Romário', 'Vasco', 2000), c('8', 'Zé', 'Várzea', 2000), c('9', 'Mané', 'Várzea', 2000), c('10', 'X', 'Grêmio', 1995, { fake: true }), c('11', 'Y', 'Grêmio', 1995),
]
const b = bonusEntro(xi)
ok(b['1'] === 2 && b['4'] === 2, '4 do Fla 81 juntos = +2 cada (teto)')
ok(b['5'] === 1 && b['6'] === 1, '2 do Vasco 97 = +1 cada')
ok(!b['7'], 'Romário Vasco 2000 é outro ano: não entrosa com o Vasco 97')
ok(!b['8'] && !b['9'], 'Várzea (jogador de mentira) nunca entrosa')
ok(!b['10'] && !b['11'], 'carta fake não conta (o Grêmio 95 sobra sozinho)')
ok(gruposEntro(xi).length === 2, 'dois grupos no time')
const com = comEntro(xi)
ok(com[0].lo === 82 && com[0].hi === 92 && xi[0].lo === 80, 'bônus no lo/hi da cópia; a carta original não muda')
const sem = [c('1', 'A', 'Santos', 1962), c('2', 'B', 'Santos', 1963)]
ok(comEntro(sem) === sem, 'sem grupo devolve o MESMO array (simulação byte a byte igual)')
ok(entrosaCom({ name: 'Andrade', club: 'Flamengo', year: 1981 }, xi).join(',') === 'Júnior,Adílio,Zico,Leandro', 'leilão: Andrade entrosa com os 4 do Fla 81')
ok(entrosaCom({ name: 'Zico', club: 'Flamengo', year: 1981 }, xi).length === 3, 'leilão: a própria pessoa não entra na lista')
if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1) }
console.log('\n🔗 entrosamento ok')
