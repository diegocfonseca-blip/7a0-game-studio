import { useEffect, useMemo, useRef, useState } from 'react'
import type { EscState, FormationKey } from './types'
import type { SimMatch, RoundCardMods } from './pyramidseason'
import { validateLivePlan, type CareerLiveDecision } from './career-live-plan'
import { co2Contexto, co2FotoJogo, co2JogoAtivo, co2RecarregaJogos, co2TrocaJogo, useCo2 } from './co2'
import { CO2_TROCAS_HABILITADAS, fotoJogoCo2, leFotoCo2, minutoJogoCo2 } from './co2-jogo-model'
import { Co2Tentativas } from './co2-sincronia'
import { useCo2Envio } from './co2-envio'
import { tr } from './lang'
const EMPTY: CareerLiveDecision[] = []
type Pedido = { id: string; season: number; round: number; base: number; novas: Omit<CareerLiveDecision, 't'>[]; contexto: string }
export function usePartidaCo2(state: EscState, matches: readonly SimMatch[], mods: RoundCardMods, duracao = 90_000) {
  const sn = useCo2(), contexto = co2Contexto(), active = !!state.co2 && co2JogoAtivo()
  const season = state.seasonNo ?? 1, round = state.round - 1, me = state.managers[state.youIdx]
  const game = active ? sn.jogos.find(j => j.temporada === season && j.rodada === round) : undefined
  const foto = useMemo(() => game ? leFotoCo2(game) : null, [game?.z]) // eslint-disable-line react-hooks/exhaustive-deps
  const slot = me ? foto?.clubes[me.id] : undefined
  const commands = me ? game?.comandos[me.id] ?? EMPTY : EMPTY
  const [agora, setAgora] = useState(Date.now)
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState<Pedido | null>(null)
  const pendingRef = useRef<Pedido | null>(null)
  const tentativas = useMemo(() => new Co2Tentativas(), [contexto])
  useEffect(() => {
    if (!active) return
    const tick = () => { const now = Date.now(), desvio = sn.desvioJogo ?? 0; setAgora(old => !game || Math.floor(minutoJogoCo2(game,now-desvio)) !== Math.floor(minutoJogoCo2(game,old-desvio)) ? now : old) }
    tick()
    const t = setInterval(tick, game ? 200 : 1000)
    return () => clearInterval(t)
  }, [active, game, sn.desvioJogo])
  useEffect(() => { if (active) void co2RecarregaJogos(true) }, [active, contexto, season])
  useEffect(() => { pendingRef.current = null; setPending(null); setNotice('') }, [contexto, season, round])
  useEffect(() => {
    if (!active || !state.co2?.comanda || game || sn.sala?.fase !== 'jogando' || sn.sala.temporada !== season || sn.sala.rodada !== round || !matches.some(m => m.m2)) return
    const repertorios: Record<number, FormationKey[]> = {}
    for (const g of [...(state.co2.gavetas ?? []), ...(state.co2.minha ? [state.co2.minha] : [])]) if (g.repertorio) repertorios[g.mgrId] = g.repertorio
    void tentativas.faz(`foto:${season}:${round}`, () => co2FotoJogo(season, round, { ...fotoJogoCo2(state, matches, mods, repertorios), duracao }))
  }, [active, game, state.co2?.comanda, sn.sala, season, round, agora]) // eslint-disable-line react-hooks/exhaustive-deps
  const minute = minutoJogoCo2(game, agora - (sn.desvioJogo ?? 0))
  const save = useCo2Envio(contexto, pending?.id ?? '', pending, async p => {
    if (p.contexto !== co2Contexto()) return false
    const r = await co2TrocaJogo(p.season, p.round, p.id, p.base, p.novas)
    if (p.contexto !== co2Contexto()) return false
    if (r === 'erro' || r === 'aguarde') { setNotice(tr('Aguardando confirmação da troca. Tentando novamente…', 'Waiting for the change to be confirmed. Retrying…')); return false }
    pendingRef.current = null; setPending(null)
    setNotice(r === 'ok' ? tr('Alteração confirmada para esta partida.', 'Change confirmed for this match.') : r === 'atualize' ? tr('O time foi atualizado em outro aparelho. Confira a escalação e escolha novamente.', 'The team was updated on another device. Check the lineup and choose again.') : tr('A alteração não foi aplicada. Confira as três substituições, os jogadores disponíveis e o tempo da partida.', 'Change not applied. Check the three-substitution limit, available players and match time.'))
    return true // erro de regra encerra o pedido; não repetir indefinidamente uma decisão inválida
  }, 0)
  useEffect(() => { if (save.falhou) setNotice(tr('A conexão falhou. A troca continua pendente de confirmação.', 'Connection failed. The change is still awaiting confirmation.')) }, [save.falhou])
  const send = (novas: Omit<CareerLiveDecision, 't'>[]) => {
    if (!active || !CO2_TROCAS_HABILITADAS || !game || !slot || !me || pendingRef.current || minute <= 0 || minute >= 89 || game.encerrado) return
    const base = { ids: slot.xi, formation: slot.formation }, proposed = [...commands, ...novas.map(x => ({ ...x, t: Math.max(...commands.map(c => c.t), minute * 90 / 93 + 2) }))]
    if (!validateLivePlan({ squad: slot.squad, initial: base.ids, formation: base.formation, commands: proposed, existing: commands, allowed: slot.allowed, blocked: new Set(slot.blocked) })) {
      setNotice(tr('Confira os jogadores disponíveis, a formação e o limite de três substituições.', 'Check available players, formation and the three-substitution limit.')); return
    }
    const p: Pedido = { id: crypto.randomUUID(), season, round, base: commands.length, novas, contexto }
    pendingRef.current = p; setPending(p); setNotice(tr('Confirmando alteração…', 'Confirming change…'))
  }
  return { active, canChange: active && CO2_TROCAS_HABILITADAS, game, slot, commands, minute, paused: game?.pausado ?? true, ready: !!game && minute >= 93, notice, send }
}
