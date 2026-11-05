// 🤖 Trava da SOBRA PRO BOT na Liga Draft (05/11, Diego): fila de bots, de graça, nunca passa de 22, todos cheios = troca pelo
// pior da mesma posição só se o novo for melhor, senão fica livre; o bot escala sempre os melhores. Rodar: npx tsx scripts/testa-liga-draft-bots.mts
import { botDaSobra, ordenaBotPelaForca, xiPorOrdem, MLD_ELENCO_MAX } from '../src/escalacao/liga-draft'
import type { Manager, WonCard } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { if (!c) { falhas++; console.log('❌', m) } else console.log('✅', m) }
let n = 0
const carta = (pos: string, fame: number, hi = 70): WonCard => ({ id: `c${n++}`, name: `J${n}`, club: 'X', year: 2000, pos, fame, lo: hi - 5, hi, paid: 1 } as unknown as WonCard)
const bot = (id: number, tam: number): Manager => ({ id, teamName: `Bot${id}`, isHuman: false, formation: '4-3-3', money: 0,
  squad: Array.from({ length: tam }, (_, i) => carta(['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'][i % 5], 1)) } as unknown as Manager)

// fila: vez 0 com vaga → bot 0, próxima vez 1
let bots = [bot(3, 11), bot(4, 11), bot(5, 11)]
let r = botDaSobra(bots, 0, carta('MEI', 3))!
ok(r.bot.id === 3 && r.aceita && r.proxVez === 1, 'vez 0 com vaga: bot 1 recebe e a vez passa pro 2')
r = botDaSobra(bots, 2, carta('MEI', 3))!
ok(r.bot.id === 5 && r.proxVez === 0, 'último da fila recebe e a vez volta pro 1º')
// bot da vez cheio passa pro próximo
bots = [bot(3, MLD_ELENCO_MAX), bot(4, 15), bot(5, 11)]
r = botDaSobra(bots, 0, carta('MEI', 3))!
ok(r.bot.id === 4 && r.aceita && !r.sai, 'bot da vez com 22 pula pro próximo com vaga')
// todos cheios: melhor que o pior da mesma posição → troca; pior → fica livre
bots = [bot(3, MLD_ELENCO_MAX), bot(4, MLD_ELENCO_MAX)]
r = botDaSobra(bots, 0, carta('ZAG', 4))!
ok(r.bot.id === 3 && r.aceita && r.sai?.pos === 'ZAG' && r.proxVez === 1, 'todos cheios + melhor: troca pelo pior ZAG do bot da vez')
r = botDaSobra(bots, 1, { ...carta('ZAG', 0), fake: true } as WonCard)!
ok(!r.aceita && !r.sai && r.proxVez === 0, 'todos cheios + pior: ninguém pega (fica livre) e a vez anda')
ok(botDaSobra([], 0, carta('ATA', 3)) === null, 'sem bot na liga: nada acontece')
// o bot escala os melhores
const sq = ordenaBotPelaForca([carta('ATA', 1), carta('ATA', 5), carta('ATA', 3), carta('ATA', 2), carta('GOL', 1), carta('GOL', 4)])
const xi = xiPorOrdem(sq, '4-3-3')
ok(xi.filter(c => c.pos === 'ATA').map(c => c.fame).join(',') === '5,3,2' && xi.find(c => c.pos === 'GOL')!.fame === 4, 'XI do bot = os melhores de cada posição')
// 🔒 o que o bot pega fica 3 temporadas: com todos cheios, o recém-chegado não sai na troca
{
  const b = bot(3, MLD_ELENCO_MAX)
  for (const c of b.squad) if (c.pos === 'ZAG') (c as { mldDesde?: number }).mldDesde = 5 // chegaram na temporada 5
  const r1 = botDaSobra([b], 0, carta('ZAG', 4), 5)! // acabou a 5ª: só 1 temporada no time
  ok(!r1.aceita && !r1.sai, 'jogador recém-chegado no bot não sai (menos de 3 temporadas)')
  const r2 = botDaSobra([b], 0, carta('ZAG', 4), 7)! // acabou a 7ª: 3 temporadas
  ok(r2.aceita && r2.sai?.pos === 'ZAG', 'depois de 3 temporadas o bot já pode trocar ele')
}
if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1) } else console.log('\n🤖 sobra pro bot: tudo certo')
