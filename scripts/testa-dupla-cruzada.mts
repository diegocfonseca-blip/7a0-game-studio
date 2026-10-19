// 🤝 TRAVA: PAR CRUZADO NA DUPLA (19/10, sala WUQGBH). Os dois pediram dupla um ao outro e os dois aceitaram → a partida nascia
// com DOIS times espelhados ("Quase nada|Quebrador d" em 1º e "Quebrador d|Quase nada" em 13º). O banco (`dupla_responder`)
// agora barra; isto confere a rede de segurança da largada: par cruzado vira UMA dupla, dono = cadeira mais baixa.
//   npm run dupla-cruzada
import assert from 'node:assert/strict'
import { desfazParCruzado } from '../src/escalacao/types'
const linhas = [
  { user_id: 'quebrador', player_index: 9, dupla_partner_of: 'quase' },
  { user_id: 'quase', player_index: 10, dupla_partner_of: 'quebrador' },
  { user_id: 'luke', player_index: 1, dupla_partner_of: null },
  { user_id: 'nico', player_index: 2, dupla_partner_of: 'luke' },
  { user_id: 'solo', player_index: 3, dupla_partner_of: null },
]
const r = desfazParCruzado(linhas)
const de = (u: string) => r.find(x => x.user_id === u)!.dupla_partner_of
assert.equal(de('quebrador'), null, 'cadeira mais baixa do par cruzado vira DONO')
assert.equal(de('quase'), 'quebrador', 'a outra fica de parceiro')
assert.deepEqual([de('luke'), de('nico'), de('solo')], [null, 'luke', null], 'dupla normal e jogador sozinho não mudam')
// donos = quem não é carona de ninguém → 3 times (não 4)
const donos = r.filter(p => !(p.dupla_partner_of && r.some(d => d.user_id === p.dupla_partner_of && !d.dupla_partner_of)))
assert.equal(donos.length, 3, 'par cruzado vira UM time só')
// mesma resposta em qualquer ordem de chegada (todo aparelho monta igual)
const r2 = desfazParCruzado([...linhas].reverse())
assert.equal(r2.find(x => x.user_id === 'quebrador')!.dupla_partner_of, null)
assert.equal(r2.find(x => x.user_id === 'quase')!.dupla_partner_of, 'quebrador')
console.log('✅ dupla cruzada vira UMA dupla (dono = cadeira mais baixa) · dupla normal e solo intactos · mesma resposta em todo aparelho')
