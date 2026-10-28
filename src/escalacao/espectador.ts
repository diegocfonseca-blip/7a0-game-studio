// 👁️ MODO ESPECTADOR "FANTASMA" (28/10, mockup aprovado: scripts/mockups/espectador.png).
// Diego: *"ele entra mas não joga, pode falar no chat… o nome não aparece na lista dos usuários… nem no gerenciar do host…
// como um fantasma"*. Só quem ele libera no #admin (`esc_espectadores`, por e-mail) vê o botão 👁️ ASSISTIR.
//
// 🛡️ COMO O FANTASMA NÃO ENCOSTA EM NADA (as cadeiras nunca mudam):
//   · nunca ganha linha em `room_players` nem entra no `seatUids` — pra sala, ele não existe;
//   · nunca anuncia presença no canal (é a presença que põe o nome na lista e que a coroa lê);
//   · o `dispatch` dele não manda ação nenhuma pro dono (só sair) — nem lance, nem voto, nem emote;
//   · nunca vira dono (BECOME_HOST / host_change / auto-cura ignoram o fantasma);
//   · e, por último, ESTA TRAVA: enquanto ele assiste, o aparelho não grava NADA no banco (insert/upsert/update/delete
//     em qualquer tabela) e só chama as funções de LEITURA da lista abaixo. Assim, se alguma tela que o jogo mostra pra
//     "você" tentar registrar resultado/carta/título, a gravação morre aqui — nunca vai pra conta do fantasma.
// Na dúvida, não grava: a tela pode ficar sem um enfeite, mas o banco nunca recebe nada do fantasma.

let ativo = false
export function setModoEspectador(v: boolean): void { ativo = v }
export function modoEspectador(): boolean { return ativo }

// só LEITURA — o que a tela de uma sala em jogo consulta (mantos, mimos, perfis, ranking, temas…)
const LEITURA = new Set([
  'esc_sou_espectador', 'esc_mantos_sala', 'esc_mimos_sala', 'esc_perfil', 'esc_perfil_publico2', 'esc_presidentes_publicos2',
  'esc_ranking', 'esc_mural', 'esc_votacao_atual', 'esc_vitrine_salas', 'esc_meus_temas', 'esc_copa_taticas',
  'esc_copa_preview_clock', 'esc_nuvem_regra', 'esc_minhas_fichas_extras', 'esc_clubes_recentes', 'esc_amigos_lista',
  'esc_amigos_lista2', 'esc_meus_direitos', 'esc_meu_nome_fake', 'esc_meu_socio', 'esc_cla_ranking', 'esc_clas_de',
  'esc_avisos', 'esc_avisos_semana', 'esc_salao_torcidas', 'esc_meta_mes_pct', 'esc_meu_rival', 'esc_tacas_online',
])

type Morto = PromiseLike<{ data: null; error: { message: string } }>
// resposta "não gravou" que aceita qualquer encadeamento (.eq().select().maybeSingle().then…)
function morto(): Morto {
  const r = { data: null, error: { message: 'espectador: só leitura' } }
  const p: unknown = new Proxy(function () { /* encadeia */ }, {
    get(_t, k) {
      if (k === 'then') return (ok?: (v: typeof r) => unknown, _f?: unknown) => Promise.resolve(r).then(ok)
      if (k === 'catch' || k === 'finally') return () => Promise.resolve(r)
      return () => p
    },
    apply() { return p },
  })
  return p as Morto
}

type Cliente = { from: (t: string) => unknown; rpc: (fn: string, args?: unknown, opts?: unknown) => unknown }
const instaladas = new WeakSet<object>()
/** Liga a trava no cliente do Supabase (uma vez). Fora do modo espectador, NADA muda: devolve o original. */
export function instalaTravaEspectador(c: Cliente): void {
  if (instaladas.has(c)) return
  instaladas.add(c)
  const from = c.from.bind(c)
  const rpc = c.rpc.bind(c)
  c.from = (t: string) => {
    const b = from(t) as Record<string, unknown>
    if (!ativo || !b) return b
    // a ÚNICA exceção: o medidor do canal (só contagem de mensagens, nada de jogo) — é como a gente enxerga se o chat chega nele
    for (const k of ['insert', 'upsert', 'update', 'delete']) if (!(k === 'insert' && t === 'esc_realtime_medidor')) b[k] = () => morto()
    return b
  }
  c.rpc = (fn: string, args?: unknown, opts?: unknown) => (ativo && !LEITURA.has(fn) ? morto() : rpc(fn, args, opts))
}
