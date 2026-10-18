// 🏆📞💔 trava do PATROCINADOR MASTER COM HISTÓRIA (17/10, mockup `scripts/mockups/master-historia.png`). Confere no motor:
//   · todo contrato assinado nasce com META + bônus, e é a MESMA meta que a tela mostra (presa na semente)
//   · bateu a meta no fecho → bônus no caixa (uma vez só); não bateu → nada
//   · foi bem → no fim do contrato a marca LIGA (+25%); enquanto a ligação está na mesa, assinar outro papel é recusado
//   · OUVIR O MERCADO → a marca sai daquela virada; os outros papéis assinam normal
//   · caiu com contrato correndo → em 1 de 2 a marca rescinde: multa = 1 temporada, contrato acaba ali, marca fora na virada
//   npm run master-historia
import assert from 'node:assert/strict'
import { reducer } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
import { masterMetaOferta, masterMetaBatida, masterMetaBatidaFecho, masterMetaBatidaIntl, masterOfertaRenovacao, masterRescinde, metasDaDivisao, masterMetaBonus, RENOVA_MULT, MASTER_METAS, type MasterMetaId } from '../src/escalacao/master-historia'
import { masterPorTemporada, MASTER_PRAZOS } from '../src/escalacao/estadiodata'

// 1) regras puras
assert.ok(!metasDaDivisao('V').includes('nao_cair'), 'Várzea não tem meta de não cair')
assert.ok(!metasDaDivisao('A').includes('acesso'), 'Série A não tem meta de subir')
for (const d of ['V', 'D', 'C', 'B', 'A']) for (const m of metasDaDivisao(d)) assert.ok(masterMetaBonus(d, m) >= 1, `${d}/${m}: bônus >= 1`)
assert.deepEqual(masterMetaOferta(7, 3, 0, 'ero', 'B'), masterMetaOferta(7, 3, 0, 'ero', 'B'), 'meta presa na semente')
assert.equal(masterMetaBatida('campeao', 1, 'B', false), true); assert.equal(masterMetaBatida('campeao', 2, 'B', false), false)
assert.equal(masterMetaBatida('nao_cair', 16, 'B', false), true); assert.equal(masterMetaBatida('nao_cair', 17, 'B', false), false)
assert.equal(masterMetaBatida('acesso', 3, 'A', false), false, 'na A não existe acesso')
const metasVistas = new Set<string>()
for (let sd = 0; sd < 60; sd++) metasVistas.add(masterMetaOferta(sd, 1, 0, 'vadico', 'B').meta)
assert.ok(metasVistas.size >= 8, `as metas variam (${metasVistas.size} diferentes)`)
// copas e internacionais (17/10, 2ª conversa: "vareie sempre os tipos de bônus")
assert.ok(metasDaDivisao('B', true).includes('mundial') && !metasDaDivisao('C', true).includes('mundial') && !metasDaDivisao('A', false).includes('mundial'), 'internacionais só na A/B com a campanha aberta')
const f = (tags: string[]) => ({ pos: 12, div: 'B', artLiga: false, tags })
assert.equal(masterMetaBatidaFecho('copa_campeao', f(['copa_campeao'])), true); assert.equal(masterMetaBatidaFecho('copa_final', f(['copa_campeao'])), true, 'campeão também chegou na final')
assert.equal(masterMetaBatidaFecho('copa_final', f(['copa_final'])), true); assert.equal(masterMetaBatidaFecho('copa_campeao', f(['copa_final'])), false)
assert.equal(masterMetaBatidaFecho('art_copa', f(['art_copa'])), true); assert.equal(masterMetaBatidaFecho('super_campeao', f(['super_campeao'])), true)
assert.equal(masterMetaBatidaFecho('mundial', f(['copa_campeao'])), false, 'internacional nunca bate no fecho')
assert.equal(masterMetaBatidaIntl('continental', { continental: true, mundial: false, artilheiro: false }), true)
assert.equal(masterMetaBatidaIntl('mundial', { continental: true, mundial: false, artilheiro: false }), false)
assert.equal(masterMetaBatidaIntl('art_intl', { continental: false, mundial: false, artilheiro: true }), true)
for (const k of Object.keys(MASTER_METAS) as MasterMetaId[]) assert.ok(MASTER_METAS[k].pt && MASTER_METAS[k].en, `${k}: texto PT e EN`)

// 2) motor
let s = reducer({} as EscState, { type: 'NEW_GAME' } as never)
s = reducer(s, { type: 'START_CAREER_SOLO', teamName: 'Testador FC', formation: '4-3-3', rivals: 7, rivalTeams: [], league: 'both', intro: false } as never)
const id = s.managers[s.youIdx].id
const base = (season: number, div = 'B'): EscState => ({ ...s, careerOnline: true, onlineMode: 'cpu', seasonNo: season, careerPlacements: { ...(s.careerPlacements ?? {}), [`m${id}`]: div }, careerCoins: { [id]: 100 }, booksSeason: undefined, pagoAdiantado: {} } as EscState)
const caixa = (x: EscState) => x.careerCoins?.[id] ?? 0
const fecha = (x: EscState, pos: number, liga = false) => reducer(x, { type: 'CLOSE_SEASON_BOOKS', finalPos: { [id]: pos }, artilheiros: liga ? [{ mgr: id, txt: 'art', coins: 0, liga: true }] : [] } as never)

// assina a Vadico (5 temporadas) na Série B
let x = reducer(base(1), { type: 'SET_MASTER', brandId: 'vadico', mgrId: id } as never)
const c1 = x.careerMaster![id]
const esperada = masterMetaOferta(x.seed ?? 0, 1, id, 'vadico', 'B')
assert.equal(c1.meta, esperada.meta, 'a meta assinada é a que a tela mostra'); assert.equal(c1.bonus, esperada.bonus)
// fecho: bateu a meta (pos 1 + artilheiro bate qualquer meta da B)
const antes = caixa(x)
x = fecha(x, 1, true)
const pago = caixa(x) - antes
assert.ok(pago >= c1.bonus!, `bateu a meta: recebe o bônus (${pago} ≥ ${c1.bonus})`)
assert.equal(x.careerMaster![id].foiBem, true, 'foi bem fica anotado')
const depois = caixa(x); x = fecha(x, 1, true); assert.equal(caixa(x), depois, 'fecho repetido não paga de novo')

// 2b) meta de COPA paga no fecho de verdade (conquistas vindas da tela)
{
  let k = reducer(base(1), { type: 'SET_MASTER', brandId: 'ero', mgrId: id } as never)
  k = { ...k, careerMaster: { [id]: { ...k.careerMaster![id], meta: 'copa_campeao', bonus: 40 } } } as EscState
  const c0 = caixa(k)
  const sem = reducer(k, { type: 'CLOSE_SEASON_BOOKS', finalPos: { [id]: 12 }, artilheiros: [], conquistas: {} } as never)
  const com = reducer(k, { type: 'CLOSE_SEASON_BOOKS', finalPos: { [id]: 12 }, artilheiros: [], conquistas: { [id]: ['copa_campeao'] } } as never)
  assert.equal(caixa(com) - caixa(sem), 40, 'ganhou a Copa: +40 de bônus da meta')
  assert.ok(caixa(com) > c0)
  assert.ok(/Meta batida|Goal reached/.test(JSON.stringify(com)), 'aparece no extrato como Meta batida')
}
// 3) ligação: contrato de 1 temporada (Max Joias) que foi bem → na temporada seguinte a marca liga
let r = reducer(base(1, 'C'), { type: 'SET_MASTER', brandId: 'maxjoias', mgrId: id } as never)
r = fecha(r, 2) // top 4 = foi bem
r = { ...r, seasonNo: 2, careerPlacements: { ...(r.careerPlacements ?? {}), [`m${id}`]: 'B' }, booksSeason: undefined } as EscState
const of = masterOfertaRenovacao(r.careerMaster![id], 2, 'B', r.seed ?? 0, id)
assert.ok(of, 'foi bem → a marca liga')
assert.equal(of!.porTemporada, Math.round(masterPorTemporada('B', 1) * RENOVA_MULT), 'renovação = +25% na divisão de hoje')
assert.equal(reducer(r, { type: 'SET_MASTER', brandId: 'ero', mgrId: id } as never).careerMaster![id].brandId, 'maxjoias', 'com a ligação na mesa, não assina outro papel')
const ren = reducer(r, { type: 'MASTER_RENOVAR', mgrId: id } as never).careerMaster![id]
assert.equal(ren.brandId, 'maxjoias'); assert.equal(ren.desde, 2); assert.equal(ren.renovado, true); assert.equal(ren.porTemporada, of!.porTemporada)
// ouvir o mercado: a Max Joias sai, a ERO assina
const merc = reducer(r, { type: 'MASTER_MERCADO', mgrId: id } as never)
assert.equal(reducer(merc, { type: 'SET_MASTER', brandId: 'maxjoias', mgrId: id } as never).careerMaster![id].desde, 1, 'recusou: a marca não volta nesta virada')
assert.equal(reducer(merc, { type: 'SET_MASTER', brandId: 'ero', mgrId: id } as never).careerMaster![id].brandId, 'ero', 'os outros papéis assinam normal')
// não foi bem → sem ligação
let nb = reducer(base(1, 'C'), { type: 'SET_MASTER', brandId: 'maxjoias', mgrId: id } as never)
nb = { ...fecha(nb, 12), seasonNo: 2 } as EscState
if (!nb.careerMaster![id].foiBem) assert.equal(masterOfertaRenovacao(nb.careerMaster![id], 2, 'C', nb.seed ?? 0, id), null, 'não foi bem → ninguém liga')

// 4) rescisão: caiu com contrato longo correndo
let achou = false
for (let sd = 1; sd < 40 && !achou; sd++) {
  let q = reducer({ ...base(1), seed: sd } as EscState, { type: 'SET_MASTER', brandId: 'vadico', mgrId: id } as never)
  const c = q.careerMaster![id]
  const vai = masterRescinde(sd, 1, id, 'vadico')
  const cx = caixa(q)
  q = fecha(q, 18) // caiu
  const cq = q.careerMaster![id]
  if (vai) {
    achou = true
    assert.equal(cq.rescindido, 1); assert.equal(cq.anos, 1, 'o contrato acaba ali')
    assert.ok(caixa(q) - cx >= (cq.multa ?? 0) && (cq.multa ?? 0) > 0, 'multa no caixa')
    const q2 = { ...q, seasonNo: 2, booksSeason: undefined } as EscState
    assert.equal(reducer(q2, { type: 'SET_MASTER', brandId: 'vadico', mgrId: id } as never).careerMaster![id].desde, 1, 'quem rescindiu não volta nesta virada')
    assert.equal(reducer(q2, { type: 'SET_MASTER', brandId: 'ero', mgrId: id } as never).careerMaster![id].brandId, 'ero')
    assert.equal(masterOfertaRenovacao(cq, 2, 'C', sd, id), null, 'rescindiu → não liga')
  } else {
    assert.equal(cq.rescindido, undefined); assert.equal(cq.anos, c.anos, 'a outra metade: segue o contrato')
  }
}
assert.ok(achou, 'houve rescisão em alguma semente')
assert.equal(MASTER_PRAZOS.length, 5)
console.log('✅ Master com história: meta, bônus, ligação, mercado e rescisão conferidos')
process.exit(0)
