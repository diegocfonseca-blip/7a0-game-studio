import { useReducer, useEffect, useCallback } from 'react'
import { ST_CARDS, ST_CARDS_MAP } from './cards'
import type { STState, STAction, STPlayer, Atributo } from './types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const CPU_NAMES = ['Maradona Bot', 'Pelé Bot', 'CR7 Bot']

function initial(): STState {
  return {
    screen: 'menu',
    players: [],
    activePlayerIdx: 0,
    phase: 'choose',
    chosenAttr: null,
    roundCards: [],
    warPile: [],
    roundWinnerId: null,
    isWar: false,
    gameWinnerId: null,
    roundNum: 1,
  }
}

function reducer(state: STState, action: STAction): STState {
  switch (action.type) {

    case 'START_GAME': {
      const { humanName, cpuCount } = action
      const numPlayers = 1 + cpuCount
      const allIds = shuffle(ST_CARDS.map(c => c.id))
      const perPlayer = Math.floor(allIds.length / numPlayers)

      const players: STPlayer[] = [
        {
          id: 'human',
          nome: humanName.trim() || 'Você',
          deck: allIds.slice(0, perPlayer),
          isCPU: false,
          isEliminated: false,
        },
        ...Array.from({ length: cpuCount }, (_, i) => ({
          id: `cpu${i}`,
          nome: CPU_NAMES[i],
          deck: allIds.slice((i + 1) * perPlayer, (i + 2) * perPlayer),
          isCPU: true,
          isEliminated: false,
        })),
      ]

      return {
        ...initial(),
        screen: 'playing',
        players,
        activePlayerIdx: 0,
        phase: 'choose',
        roundNum: 1,
      }
    }

    case 'PICK_ATTR': {
      const { attr } = action
      const activePlayers = state.players.filter(p => !p.isEliminated)

      const roundCards = activePlayers.map(p => ({
        playerId: p.id,
        cardId: p.deck[0],
      }))

      // Find winner (highest value wins; tie = no winner)
      let maxVal = -1
      let winnerId: string | null = null
      let isTie = false

      for (const { playerId, cardId } of roundCards) {
        const val = ST_CARDS_MAP[cardId].atributos[attr]
        if (val > maxVal) {
          maxVal = val
          winnerId = playerId
          isTie = false
        } else if (val === maxVal) {
          isTie = true
          winnerId = null
        }
      }

      return {
        ...state,
        phase: 'revealing',
        chosenAttr: attr,
        roundCards,
        roundWinnerId: isTie ? null : winnerId,
        isWar: isTie,
      }
    }

    case 'NEXT_ROUND': {
      const { roundWinnerId, roundCards, warPile, isWar } = state
      const allPlayedIds = roundCards.map(rc => rc.cardId)
      const allCards = [...warPile, ...allPlayedIds]

      // Remove top card from each active player
      let newPlayers = state.players.map(p => {
        if (p.isEliminated) return p
        return { ...p, deck: p.deck.slice(1) }
      })

      if (!isWar && roundWinnerId) {
        // Give all cards to winner (append to bottom of deck)
        newPlayers = newPlayers.map(p =>
          p.id === roundWinnerId
            ? { ...p, deck: [...p.deck, ...allCards] }
            : p
        )
      }
      // On tie: cards stay as new warPile for next round

      // Eliminate players with empty deck
      newPlayers = newPlayers.map(p => ({
        ...p,
        isEliminated: p.isEliminated || p.deck.length === 0,
      }))

      const alive = newPlayers.filter(p => !p.isEliminated)

      // Game winner?
      if (alive.length <= 1) {
        return {
          ...state,
          players: newPlayers,
          phase: 'gameover',
          gameWinnerId: alive[0]?.id ?? null,
          roundCards: [],
          chosenAttr: null,
        }
      }

      // Determine next active player
      // Winner becomes active; on tie rotate to next
      let nextIdx = state.activePlayerIdx
      if (!isWar && roundWinnerId) {
        const wi = newPlayers.findIndex(p => p.id === roundWinnerId)
        if (wi >= 0 && !newPlayers[wi].isEliminated) nextIdx = wi
      } else {
        // rotate
        let next = (state.activePlayerIdx + 1) % newPlayers.length
        let tries = 0
        while (newPlayers[next].isEliminated && tries < newPlayers.length) {
          next = (next + 1) % newPlayers.length
          tries++
        }
        nextIdx = next
      }

      const nextPlayer = newPlayers[nextIdx]

      return {
        ...state,
        players: newPlayers,
        activePlayerIdx: nextIdx,
        phase: nextPlayer.isCPU ? 'cpu_thinking' : 'choose',
        chosenAttr: null,
        roundCards: [],
        warPile: isWar ? allCards : [],
        roundWinnerId: null,
        isWar: false,
        roundNum: state.roundNum + 1,
      }
    }

    case 'RESTART':
      return initial()

    default:
      return state
  }
}

export function useSTGame() {
  const [state, dispatch] = useReducer(reducer, initial())

  // CPU picks attribute after a short thinking delay
  useEffect(() => {
    if (state.phase !== 'cpu_thinking') return
    const cpu = state.players[state.activePlayerIdx]
    if (!cpu?.isCPU || !cpu.deck[0]) return

    const topCard = ST_CARDS_MAP[cpu.deck[0]]
    const delay = 1000 + Math.random() * 800

    const t = setTimeout(() => {
      const attrs = (Object.entries(topCard.atributos) as [Atributo, number][])
        .sort((a, b) => b[1] - a[1])
      // 75% pick best, 25% random (makes CPU beatable)
      const pick = Math.random() < 0.75 ? attrs[0][0] : attrs[Math.floor(Math.random() * attrs.length)][0]
      dispatch({ type: 'PICK_ATTR', attr: pick })
    }, delay)

    return () => clearTimeout(t)
  }, [state.phase, state.activePlayerIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance from revealing → next round
  useEffect(() => {
    if (state.phase !== 'revealing') return
    const t = setTimeout(() => dispatch({ type: 'NEXT_ROUND' }), 2800)
    return () => clearTimeout(t)
  }, [state.phase, state.roundNum])

  const startGame  = useCallback((humanName: string, cpuCount: number) =>
    dispatch({ type: 'START_GAME', humanName, cpuCount }), [])
  const pickAttr   = useCallback((attr: Atributo) =>
    dispatch({ type: 'PICK_ATTR', attr }), [])
  const restart    = useCallback(() =>
    dispatch({ type: 'RESTART' }), [])

  return { state, startGame, pickAttr, restart }
}
