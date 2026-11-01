// 👕 MINHA LIGA DRAFT · ESCALAÇÃO (01/11, Diego: *"deve ser parecido visualmente com o da carreira, podendo até mudar formação…
// bem parecido visualmente e organizacionalmente também"*). É a MESMA aba Elenco da carreira (`SquadTab`): campinho, banco,
// troca tocando um e depois o outro, e a pílula de Formação. Só muda QUEM guarda a escolha: aqui os titulares são os primeiros
// de cada posição na ordem do elenco (`xiPorOrdem`) — a troca reordena o elenco (MLD_TROCA) e a formação vale na hora
// (MLD_FORMACAO), sempre conferida pelo motor (nunca fica posição faltando).
import { useMemo, useState } from 'react'
import { useEsc } from './store'
import { SquadTab, playerColors } from './pyramidseason'
import { perkFromSelo } from './pyramidseason'
import { xiPorOrdem } from './liga-draft'
import type { WonCard } from './types'

export function EscalacaoMinha() {
  const { state, dispatch } = useEsc()
  const you = state.managers[state.youIdx]
  const [selId, setSelId] = useState<string | null>(null)
  const xi = useMemo(() => (you ? xiPorOrdem(you.squad, you.formation) : []), [you])
  const xiIds = useMemo(() => new Set(xi.map(c => c.id)), [xi])
  if (!you) return null
  const humanos = state.managers.filter(m => m.isHuman).map(m => m.id)
  const perks = Object.fromEntries(state.managers.filter(m => m.isHuman).map(m => [m.id, perkFromSelo(m.name) ?? null]))
  const col = playerColors(humanos, you.id, state.seed, [], perks)[you.id]
  const onTap = (id: string) => {
    const card = you.squad.find(c => c.id === id)
    if (!card) return
    if (selId === null || selId === id) { setSelId(selId === id ? null : id); return }
    const sel = you.squad.find(c => c.id === selId)
    // mesma régua da carreira: só troca dentro da MESMA posição (titular↔reserva ou dois titulares trocando de lado)
    if (!sel || sel.pos !== card.pos) { setSelId(id); return }
    dispatch({ type: 'MLD_TROCA', mgrId: you.id, a: sel.id, b: card.id, by: state.youUid })
    setSelId(null)
  }
  return (
    <SquadTab mgr={you} col={col} coins={Math.max(0, Math.floor(you.money))} xiIds={xiIds} xi={xi as WonCard[]}
      onSwap={onTap} selId={selId} seasonNo={state.seasonNo}
      onSetFormation={f => dispatch({ type: 'MLD_FORMACAO', mgrId: you.id, formation: f, by: state.youUid })} />
  )
}
