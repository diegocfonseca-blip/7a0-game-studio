// Falhas de envio/leitura e corrida entre carreiras. Só transporte simulado, sem escrever no Supabase.
import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve } }
try {
  const { Co2Fila, Co2Tentativas, co2CopiaRecente } = await vite.ssrLoadModule('/src/escalacao/co2-sincronia.ts')
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 100_000 })
  const sent = [], errors = [], first = deferred()
  const q = new Co2Fila(async x => { sent.push(x); return x === 'v1' ? first.promise : true }, x => errors.push(x))
  q.atualiza('1', 'v1'); const save = q.confirma()
  q.atualiza('2', 'v2'); q.atualiza('3', 'v3')
  first.resolve(true)
  assert.equal(await save, true)
  assert.deepEqual(sent, ['v1', 'v3'], 'serializa e envia o último estado, nunca o intermediário por cima do novo')
  assert.equal(await q.confirma(), true); assert.equal(sent.length, 2, 'sem mudança não grava de novo')
  q.fecha()
  let n = 0
  const f = new Co2Fila(async () => ++n > 1)
  f.atualiza('1', {})
  assert.equal(await f.confirma(), false, 'falha não confirma')
  assert.equal(await f.confirma(), true, 'mesmo estado pode ser reenviado após falha')
  f.fecha()
  const exceptions = new Co2Fila(async () => { throw Error('offline') })
  exceptions.atualiza('x', {})
  assert.equal(await exceptions.confirma(), false, 'exceção não perde a pendência')
  exceptions.fecha()
  const afterClose = [], close = new Co2Fila(async x => { afterClose.push(x); return true })
  close.atualiza('1', 'old'); close.fecha(); mock.timers.tick(10_000)
  assert.equal(afterClose.length, 0, 'sair cancela envio agendado da carreira antiga')
  const t = new Co2Tentativas(); let starts = 0
  assert.equal(await t.faz('rodada', async () => { starts++; return false }), false)
  assert.equal(await t.faz('rodada', async () => { starts++; return true }), false, 'recua antes de repetir falha')
  assert.equal(starts, 1)
  mock.timers.tick(2001)
  assert.equal(await t.faz('rodada', async () => { starts++; return true }), true, 'falha não deixa botão travado')
  await t.faz('rodada', async () => { starts++; return true })
  assert.equal(starts, 2, 'sucesso não duplica o início')
  const thrown = new Co2Tentativas(); assert.equal(await thrown.faz('x',()=>{throw Error('sync')}),false); mock.timers.tick(2001); assert.equal(await thrown.faz('x',async()=>true),true,'exceção síncrona também libera a tentativa')
  const d = deferred(), t2 = new Co2Tentativas(); let parallel = 0
  const pa = t2.faz('a', async () => { parallel++; return d.promise })
  const pb = t2.faz('a', async () => { parallel++; return true })
  d.resolve(true); assert.equal(await pa, true); assert.equal(await pb, true); assert.equal(parallel, 1)
  const received=[],same=new Co2Fila(async x=>{received.push(x);return true})
  same.atualiza('a',1);same.atualiza('a',2);await same.confirma();assert.deepEqual(received,[2],'mesma revisão mantém o payload mais recente sem adiar o envio');same.fecha()
  const maximum=[],busy=new Co2Fila(async x=>{maximum.push(x);return true},()=>{},5000)
  for(let i=0;i<5;i++){busy.atualiza(String(i),i);mock.timers.tick(2000)}
  await busy.confirma();assert.deepEqual(maximum,[4],'atividade contínua tem envio em até dez segundos');busy.fecha()
  mock.timers.reset()
  const pc = { state: { seasonNo: 2, round: 9 }, at: 1000 }, phone = { state: { seasonNo: 2, round: 23 }, at: 900 }
  assert.equal(co2CopiaRecente(pc, phone), phone.state, 'PC antigo não ganha de celular adiantado por relógio errado')
  assert.equal(co2CopiaRecente({ ...pc, state: { seasonNo: 3, round: 0 } }, phone).seasonNo, 3, 'virada nova supera rodada da temporada anterior')
  const changed = { state: { seasonNo: 2, round: 9, change: 'new' }, at: 2000 }; assert.equal(co2CopiaRecente(pc, changed), changed.state, 'gestão mais nova desempata na mesma rodada')
  assert.equal(co2CopiaRecente(null, phone), phone.state)
  assert.equal(co2CopiaRecente(pc, null), pc.state)
  assert.equal(co2CopiaRecente(null, null), null)
  const C = await vite.ssrLoadModule('/src/escalacao/co2.ts')
  const { supabase } = await vite.ssrLoadModule('/src/lib/supabase.ts')
  let onRead = () => null, writes = 0
  supabase.auth.getUser = async () => ({ data: { user: { id: 'uid' } } })
  let falhaVirada=false,tentativasVirada=0
  supabase.rpc = async (nome,args) => {if(nome==='esc_carr_comando'&&args.p_funcao==='esc_carr_virada_salva'){tentativasVirada++;return {data:falhaVirada?'erro':'ok',error:null}};return {data:'ok',error:null}}
  supabase.channel = () => ({ on() { return this }, subscribe() { return this }, unsubscribe() {}, send() {}, track() {}, presenceState() { return {} } })
  supabase.from = table => {
    let cols, id
    const read = async () => onRead({ table, cols, id }) ?? { data: table === 'esc_carr_clube' ? [] : cols === 'mundo' ? { mundo: { ordem: ['uid'] } } : { id }, error: null }
    const builder = { select(c) { cols = c; return this }, eq(_k, i) { id = i; return this }, maybeSingle: read, order: read,
      upsert() { writes++; return Promise.resolve({ error: null }) } }
    return builder
  }
  try {
    await C.co2Abrir('A')
    falhaVirada=true;assert.equal(await C.co2SalvaVirada(2,'foto-final'),'erro');falhaVirada=false;assert.equal(await C.co2ConfirmaEnvios(),true);assert.equal(tentativasVirada,2,'foto da virada falhou mas continua na fila e é confirmada antes de sair');assert.equal(await C.co2SalvaVirada(2,'foto-final'),'ok');assert.equal(tentativasVirada,2,'foto já confirmada não é enviada novamente')
    const old = deferred()
    onRead = ({ table, cols, id }) => table === 'esc_carr_sala' && cols !== 'mundo' && id === 'A' ? old.promise : null
    const late = C.co2RecarregaSala()
    await C.co2Abrir('B')
    old.resolve({ data: { id: 'A' } }); await late
    assert.equal(C.co2Agora().sala.id, 'B', 'resposta da carreira A não entra na B')
    const oldest = deferred(); let reads = 0
    onRead = ({ table, cols }) => table === 'esc_carr_sala' && cols !== 'mundo' ? (++reads === 1 ? oldest.promise : { data: { id: 'B', rodada: 9 } }) : null
    const stale = C.co2RecarregaSala(); await C.co2RecarregaSala(); oldest.resolve({ data: { id: 'B', rodada: 8 } }); await stale
    assert.equal(C.co2Agora().sala.rodada, 9, 'leitura velha da mesma carreira não regride a rodada')
    onRead = () => ({ data: null, error: { message: 'offline' } })
    assert.equal(await C.co2LeGavetasConferidas(), null, 'falha é diferente de lista vazia')
    await C.co2LeMundo(); assert.deepEqual(C.co2Agora().mundo.ordem, ['uid'], 'falha de leitura não apaga o mundo')
    onRead = () => null
    const privateSave = C.co2SalvaPrivado({ z: 'antigo' })
    C.co2Fechar(); await C.co2Abrir('C')
    assert.equal(await privateSave, false); assert.equal(writes, 0, 'troca de carreira durante autenticação não grava save em outra')
  } finally { C.co2Fechar() }
  console.log('✅ Falhas: envio serializado/última alteração, repetição sem perder mudanças, deduplicação, saída, leitura atrasada entre carreiras e na mesma carreira, mundo preservado e save privado preso à carreira.')
} finally { mock.timers.reset(); await vite.close() }
