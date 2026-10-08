// 📡💸 trava do TRÁFEGO DO CANAL AO VIVO (04/10). A fatura do Supabase do Diego: ~36 milhões de
// mensagens Realtime no mês (cota do plano: 5 milhões). Quase metade era o "tô vivo" do dono, a
// cada 4s, pra cada pessoa da sala, mesmo parado. Regras que esta trava segura:
//   1. o dono NÃO manda "tô vivo" (o convidado só continua ouvindo, pela janela do deploy);
//   2. o heartbeat de estado do dono só reenvia depois de ≥ 20s quieto, conferindo a cada ≥ 10s;
//   3. o convidado só pede o estado depois de ≥ 60s de silêncio, ou em ~8s se o PRÓPRIO lance
//      ficou sem resposta (`acaoPendenteRef`), e só consulta o banco pela coroa depois de ≥ 45s;
//   4. toda sala usa a caixa de entrada do dono (`hostInbox = true`): lance vai só pro dono.
//   npm run canal
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../src/escalacao/store.tsx', import.meta.url), 'utf8')
const num = s => Number(String(s).replace(/_/g, ''))

// 1. ninguém ENVIA host_ping (só o listener do convidado sobrevive)
const envios = [...src.matchAll(/event: 'host_ping'/g)].filter(m => /send\(\{[^}]*$/.test(src.slice(Math.max(0, m.index - 80), m.index)))
assert.equal(envios.length, 0, 'voltou um envio de host_ping')
assert.match(src, /ch\.on\('broadcast', \{ event: 'host_ping' \}/, 'o convidado continua ouvindo host_ping (dono em versão antiga)')

// 2. heartbeat de estado: quieto ≥ 20s, tique ≥ 10s
const hb = src.match(/const HEARTBEAT_QUIETO_MS = ([\d_]+)/); assert.ok(hb, 'sumiu HEARTBEAT_QUIETO_MS'); assert.ok(num(hb[1]) >= 20_000, 'heartbeat reenvia cedo demais')
const hbBloco = src.slice(src.indexOf('const HEARTBEAT_QUIETO_MS'), src.indexOf('[state.onlineMode, state.isHost, state.roomId])', src.indexOf('const HEARTBEAT_QUIETO_MS')))
const tique = hbBloco.match(/\}, ([\d_]+)\)\s*$/m); assert.ok(tique && num(tique[1]) >= 10_000, 'tique do heartbeat < 10s')

// 3. vigia do convidado
const stale = src.match(/const stale = caladoMs > ([\d_]+) \|\| \(meuLanceSemResposta && caladoMs > ([\d_]+)\)/)
assert.ok(stale, 'a régua do vigia do convidado mudou de forma')
assert.ok(num(stale[1]) >= 60_000, 'convidado pede estado cedo demais no silêncio normal')
assert.ok(num(stale[2]) <= 10_000, 'lance sem resposta tem que ser socorrido em até 10s')
assert.match(src, /acaoPendenteRef\.current = 0 \/\/ chegou estado do dono/, 'o estado do dono zera o recado pendente')
assert.match(src, /if \(!acaoPendenteRef\.current\) acaoPendenteRef\.current = Date\.now\(\)/, 'mandar recado marca o pendente')
const coroa = src.match(/if \(Date\.now\(\) - lastHostMsgRef\.current < ([\d_]+)\) return \/\/ tem dono vivo falando/)
assert.ok(coroa && num(coroa[1]) >= 45_000, 'a consulta da coroa voltou a bater no banco cedo demais')
assert.ok(num(coroa[1]) < num(stale[1]), 'a consulta da coroa tem que vir antes do pedido de estado')

// 4. caixa de entrada pra toda sala
assert.match(src, /s\.hostInbox = true/, 'hostInbox deixou de valer pra toda sala')

// 5. o estado do dono é agrupado em TODA sala, sempre levando a versão mais nova
const agrupado = src.match(/const ONLINE_ENVIO_MS = ([\d_]+)/)
assert.ok(agrupado, 'sumiu a janela global de agrupamento do Broadcast')
assert.ok(num(agrupado[1]) <= 400, 'a janela do Broadcast ficou perceptível demais')
const retransmite = src.slice(src.indexOf('// host retransmite estado'), src.indexOf('// 📮 a CAIXA DE ENTRADA', src.indexOf('// host retransmite estado')))
assert.match(retransmite, /const atual = stateRef\.current/, 'o Broadcast agrupado não leva o estado mais novo')
assert.match(retransmite, /setTimeout\([\s\S]*ONLINE_ENVIO_MS\)/, 'o estado deixou de ser agrupado')
assert.doesNotMatch(retransmite, /state\.copaMode === 'champions'/, 'o agrupamento voltou a valer só na Champions')
assert.equal((retransmite.match(/event: 'state'/g) ?? []).length, 1, 'voltou um envio imediato de estado a cada mudança')

console.log('✅ canal ao vivo: sem "tô vivo", heartbeat ≥ 20s, estado agrupado em toda sala, convidado pede estado só em 60s (8s se o lance dele ficou sem resposta), lance vai só pro dono')
