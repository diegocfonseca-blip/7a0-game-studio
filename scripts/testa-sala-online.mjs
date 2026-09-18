// 🌐 TRAVAS DA SALA ONLINE — os dois bugs que o Bruno relatou em 18/09.
//
// Estes dois NÃO são teoria: são as contas exatas que o jogo faz, copiadas pra cá.
// O motivo de existirem é que os dois JÁ VOLTARAM depois de "consertados" — o Diego
// cobrou: *"eu já tinha pedido pra você arrumar o Minhas Ligas do online, mas pelo
// visto ainda tem erros"*. Teste que roda vale mais que um commit dizendo que arrumou.
//
// ⚠️ O QUE ISTO NÃO TESTA: a sala de verdade. Este ambiente não alcança o Supabase
// (o proxy bloqueia), então o que está travado aqui é a REGRA — as duas contas que
// decidem "restaura o pregão velho?" e "qual é o baralho da sala?".
//
// Rodar: node scripts/testa-sala-online.mjs
let falhas = 0
const ok = (cond, txt) => { console.log(`  ${cond ? '✅' : '❌'} ${txt}`); if (!cond) falhas++ }

// ── a conta do `triggerStart` (lobby.tsx), copiada ────────────────────────────
const emAndamento = gs => !!gs && Array.isArray(gs.managers) && gs.managers.length > 0
  && !!gs.screen && gs.screen !== 'intro' && gs.screen !== 'lobby'

// ── a conta do baralho da sala (lobby.tsx), copiada ───────────────────────────
const baralhoDaSala = gs => (typeof gs?.deckSala === 'string' ? gs.deckSala
  : typeof gs?.deck === 'string' ? gs.deck : 'br')

console.log('1) 📣 CHAMAR MAIS GENTE: o pregão velho NÃO pode ser restaurado')
{
  const pregaoRolando = { managers: [{ id: 0 }, { id: 1 }], screen: 'auction', deckSala: 'todos' }
  ok(emAndamento(pregaoRolando), 'pregão rolando: o jogo entende que há partida em andamento (era pra isso mesmo)')
  // é isto que o `chamarMaisGente` passou a gravar no banco
  const depoisDoChamar = { ...pregaoRolando, screen: 'lobby' }
  ok(!emAndamento(depoisDoChamar), 'depois do "chamar mais gente": NÃO é mais partida em andamento — a próxima largada monta do zero')
  ok(depoisDoChamar.deckSala === 'todos', 'e a sala não perdeu nada no caminho (baralho, liga, senha continuam lá)')
  // o amigo novo: com a largada montando do zero, ele entra pela lista de vagas
  ok(!emAndamento({ managers: [], screen: 'auction' }), 'sala sem managers também não restaura (nunca "veste" ninguém num time que não existe)')
}

console.log('2) 🌎 O BARALHO DA SALA sobrevive ao save do host')
{
  // o host salva o estado a cada 3 s: `{ ...estadoDoJogo, ...camposProtegidos }`
  const CAMPOS_PROTEGIDOS = ['mode', 'ligaAt', 'ligaRegras', 'ligaAdmins', 'mundoNaLiga', 'deckSala', 'rivals', 'rivalTeams']
  const salva = (naSala, estadoDoJogo) => {
    const guarda = {}
    for (const k of CAMPOS_PROTEGIDOS) if (naSala[k] !== undefined && naSala[k] !== null) guarda[k] = naSala[k]
    return { ...naSala, ...estadoDoJogo, ...guarda }
  }
  // a sala nasce com a escolha do host nos DOIS campos (o velho é só compatibilidade)
  const salaNova = { deck: 'todos', deckSala: 'todos', mode: 'liga' }
  ok(baralhoDaSala(salaNova) === 'todos', 'sala recém-criada: baralho do MUNDO')
  // ⚠️ `deck` no estado do jogo são as CARTAS — outro bicho com o mesmo nome
  const cartas = { deck: { GOL: [{ name: 'Taffarel' }], ATA: [] }, screen: 'auction', managers: [{ id: 0 }] }
  const depoisDoSave = salva(salaNova, cartas)
  ok(typeof depoisDoSave.deck !== 'string', 'depois do save o campo `deck` virou as CARTAS (é assim mesmo — quem reconecta precisa delas)')
  ok(baralhoDaSala(depoisDoSave) === 'todos', 'mas o baralho da SALA segue MUNDO — era AQUI que ele virava Brasil')
  // dez saves seguidos (o pregão inteiro) não derrubam a escolha
  let sala = salaNova
  for (let i = 0; i < 10; i++) sala = salva(sala, cartas)
  ok(baralhoDaSala(sala) === 'todos', 'dez saves depois (o pregão inteiro): ainda MUNDO')
  ok(sala.mode === 'liga', 'e a liga continua liga')
}

console.log('3) 🛟 sala ANTIGA (criada antes do conserto) não quebra')
{
  ok(baralhoDaSala({ deck: 'eu' }) === 'eu', 'sala velha ainda com texto em `deck`: vale o texto')
  ok(baralhoDaSala({ deck: { GOL: [] } }) === 'br', 'sala velha JÁ estragada (cartas no `deck`): cai no padrão Brasil, sem quebrar')
  ok(baralhoDaSala({}) === 'br', 'sala sem nada: padrão Brasil')
  ok(baralhoDaSala({ deck: { GOL: [] }, deckSala: 'todos' }) === 'todos', 'sala nova com as cartas por cima do `deck`: o `deckSala` manda')
}

console.log(falhas ? `\n❌ ${falhas} trava(s) quebrada(s)` : '\n✅ tudo certo')
process.exit(falhas ? 1 : 0)
