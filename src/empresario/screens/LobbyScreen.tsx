import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmpresario } from '../store'
import { supabase } from '../../lib/supabase'
import { C, BrutalCard, BrutalButton, BrutalTag, BrutalPill } from '../ui'
import type { RealtimeChannel } from '@supabase/supabase-js'

function makeCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

type Step = 'home' | 'online-pick' | 'create-wait' | 'join-form'

export default function LobbyScreen() {
  const { dispatch } = useEmpresario()
  const [name, setName] = useState('')
  const [step, setStep] = useState<Step>('home')
  const [roomCode, setRoomCode] = useState('')
  const [joinInput, setJoinInput] = useState('')
  const [roomPlayers, setRoomPlayers] = useState<string[]>([])
  const [joinError, setJoinError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const playerName = name.trim() || 'O Empresário'

  function cleanChannel() {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
  }

  useEffect(() => () => { cleanChannel() }, [])

  function startSolo() {
    dispatch({
      type: 'INIT_ROOM',
      onlineMode: 'cpu',
      roomCode: '',
      isHost: true,
      playerNames: [playerName],
      playerName,
    })
  }

  function createRoom() {
    const code = makeCode()
    setRoomCode(code)
    setRoomPlayers([playerName])
    setStep('create-wait')

    const ch = supabase.channel(`empresario-${code}`, { config: { presence: { key: playerName } } })

    ch.on('presence', { event: 'sync' }, () => {
      const pState = ch.presenceState<{ name: string }>()
      const names = Object.keys(pState).map(k => String(pState[k][0]?.name ?? k))
      setRoomPlayers(names)
    })

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ name: playerName })
      }
    })

    channelRef.current = ch
  }

  async function joinRoom() {
    const code = joinInput.trim().toUpperCase()
    if (!code) return
    setJoinError('')
    setConnecting(true)

    const ch = supabase.channel(`empresario-${code}`, { config: { presence: { key: playerName } } })
    let joined = false

    ch.on('presence', { event: 'sync' }, () => {
      const pState = ch.presenceState<{ name: string }>()
      const names = Object.keys(pState).map(k => String(pState[k][0]?.name ?? k))
      setRoomPlayers(names)
    })

    ch.on('broadcast', { event: 'start' }, ({ payload }) => {
      const names: string[] = payload.playerNames ?? [playerName]
      cleanChannel()
      dispatch({
        type: 'INIT_ROOM',
        onlineMode: 'online',
        roomCode: code,
        isHost: false,
        playerNames: names,
        playerName,
      })
    })

    ch.subscribe(async (status) => {
      setConnecting(false)
      if (status === 'SUBSCRIBED') {
        await ch.track({ name: playerName })
        const pState = ch.presenceState<{ name: string }>()
        const names = Object.keys(pState).map(k => String(pState[k][0]?.name ?? k))
        if (names.length > 0 || Object.keys(pState).length === 0) {
          joined = true
          setRoomCode(code)
          setStep('create-wait')
          channelRef.current = ch
        }
      } else {
        if (!joined) setJoinError('Sala não encontrada. Verifique o código.')
      }
    })
  }

  function startOnline() {
    if (!channelRef.current || roomPlayers.length < 2) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'start',
      payload: { playerNames: roomPlayers },
    })
    cleanChannel()
    dispatch({
      type: 'INIT_ROOM',
      onlineMode: 'online',
      roomCode,
      isHost: true,
      playerNames: roomPlayers,
      playerName,
    })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>
      {/* ── HEADER ── */}
      <div className="border-b-[3px] border-black" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto px-5 py-5 text-center">
          <BrutalPill color={C.yellow} textColor={C.black}>MODO EMPRESÁRIO</BrutalPill>
          <h1 className="text-white font-black text-4xl mt-3 leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>
            O LADRÃO<br />DE LENDAS
          </h1>
          <p className="text-white/50 text-sm font-bold mt-2">1993 · O futuro na sua memória</p>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-5 py-6 space-y-4">

        <AnimatePresence mode="wait">

          {/* ── HOME ── */}
          {step === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">

              <BrutalCard color="white" className="p-4" shadow={4}>
                <p className="text-black/50 text-xs font-black uppercase tracking-widest mb-2">Seu nome nos bastidores</p>
                <div className="border-[3px] border-black rounded-xl bg-white overflow-hidden" style={{ boxShadow: `3px 3px 0 ${C.black}` }}>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startSolo()}
                    placeholder="O Empresário..."
                    maxLength={20}
                    autoFocus
                    className="w-full px-4 py-3 text-black text-center text-xl font-black placeholder:text-black/20 focus:outline-none bg-transparent"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  />
                </div>
              </BrutalCard>

              <BrutalCard color={C.blue} className="p-5" onClick={startSolo} shadow={5} style={{ cursor: 'pointer' }}>
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🎮</span>
                  <div className="flex-1">
                    <p className="text-white font-black text-xl leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>JOGAR SOLO</p>
                    <p className="text-white/60 text-sm font-bold">Construa seu império contra a IA</p>
                  </div>
                  <span className="text-white text-3xl font-black">→</span>
                </div>
              </BrutalCard>

              <BrutalCard color={C.purple} className="p-5" onClick={() => setStep('online-pick')} shadow={5} style={{ cursor: 'pointer' }}>
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🌐</span>
                  <div className="flex-1">
                    <p className="text-white font-black text-xl leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>ONLINE</p>
                    <p className="text-white/60 text-sm font-bold">Dispute com amigos em tempo real</p>
                  </div>
                  <span className="text-white text-3xl font-black">→</span>
                </div>
              </BrutalCard>

              <BrutalCard color={C.creamDark} className="p-4" shadow={2}>
                <p className="text-black/50 text-xs font-bold leading-relaxed">
                  📔 Você tem o futuro inteiro na memória. Assine lendas antes do mundo descobrir, negocie comissões e fique podre de rico em 1993.
                </p>
              </BrutalCard>
            </motion.div>
          )}

          {/* ── ONLINE PICK ── */}
          {step === 'online-pick' && (
            <motion.div key="online-pick" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep('home')} className="text-black text-3xl font-black">←</button>
                <BrutalPill color={C.purple} textColor="#fff">MODO ONLINE</BrutalPill>
              </div>

              <BrutalCard color={C.green} className="p-5" onClick={createRoom} shadow={5} style={{ cursor: 'pointer' }}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🏠</span>
                  <div className="flex-1">
                    <p className="text-black font-black text-xl leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>CRIAR SALA</p>
                    <p className="text-black/60 text-sm font-bold">Gere o código e espere seus amigos</p>
                  </div>
                  <span className="text-black text-3xl font-black">→</span>
                </div>
              </BrutalCard>

              <BrutalCard color={C.yellow} className="p-5" onClick={() => setStep('join-form')} shadow={5} style={{ cursor: 'pointer' }}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🔑</span>
                  <div className="flex-1">
                    <p className="text-black font-black text-xl leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>ENTRAR NA SALA</p>
                    <p className="text-black/60 text-sm font-bold">Insira o código que seu amigo gerou</p>
                  </div>
                  <span className="text-black text-3xl font-black">→</span>
                </div>
              </BrutalCard>
            </motion.div>
          )}

          {/* ── JOIN FORM ── */}
          {step === 'join-form' && (
            <motion.div key="join-form" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setStep('online-pick'); setJoinError('') }} className="text-black text-3xl font-black">←</button>
                <BrutalPill color={C.yellow} textColor={C.black}>ENTRAR NA SALA</BrutalPill>
              </div>

              <BrutalCard color="white" className="p-4" shadow={4}>
                <p className="text-black/50 text-xs font-black uppercase tracking-widest mb-2">Código da sala</p>
                <div className="border-[3px] border-black rounded-xl bg-white overflow-hidden" style={{ boxShadow: `3px 3px 0 ${C.black}` }}>
                  <input
                    value={joinInput}
                    onChange={e => setJoinInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && joinRoom()}
                    placeholder="XYZAB"
                    maxLength={5}
                    autoFocus
                    className="w-full px-4 py-3 text-black text-center text-3xl font-black placeholder:text-black/20 focus:outline-none bg-transparent tracking-widest"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  />
                </div>
                {joinError && <p className="text-red-600 text-xs font-black mt-2 text-center">{joinError}</p>}
              </BrutalCard>

              <BrutalButton color={C.purple} textColor="#fff" onClick={joinRoom} disabled={connecting}>
                {connecting ? '⏳ Conectando...' : '🔑 ENTRAR NA SALA →'}
              </BrutalButton>
            </motion.div>
          )}

          {/* ── WAITING ROOM ── */}
          {step === 'create-wait' && (
            <motion.div key="wait" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <BrutalCard color={C.black} className="p-5 text-center" shadow={6}>
                <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-2">Código da sala</p>
                <p className="text-white font-black text-5xl tracking-widest" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {roomCode}
                </p>
                <p className="text-white/50 text-xs font-bold mt-2">Passe este código pra seus amigos</p>
              </BrutalCard>

              <BrutalCard color="white" className="p-4" shadow={3}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>JOGADORES NA SALA</p>
                  <BrutalTag color={C.teal}>{roomPlayers.length}/4</BrutalTag>
                </div>
                <div className="space-y-2">
                  {roomPlayers.map((p, i) => (
                    <motion.div
                      key={p}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 border-2 border-black rounded-lg px-3 py-2"
                      style={{ backgroundColor: i === 0 ? C.yellow : C.creamDark }}
                    >
                      <span className="text-lg">{i === 0 ? '👑' : '🎮'}</span>
                      <span className="font-black text-black text-sm flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{p}</span>
                      {i === 0 && <BrutalTag color={C.black} textColor="#fff">HOST</BrutalTag>}
                    </motion.div>
                  ))}
                  {roomPlayers.length < 2 && (
                    <div className="border-2 border-dashed border-black/30 rounded-lg px-3 py-2 text-center">
                      <p className="text-black/30 text-xs font-bold">Aguardando jogadores...</p>
                    </div>
                  )}
                </div>
              </BrutalCard>

              {roomPlayers[0] === playerName && (
                <BrutalButton
                  color={roomPlayers.length >= 2 ? C.green : '#C9C2AC'}
                  textColor={roomPlayers.length >= 2 ? '#000' : '#888'}
                  disabled={roomPlayers.length < 2}
                  onClick={startOnline}
                >
                  {roomPlayers.length < 2 ? '⏳ Aguardando pelo menos 1 rival...' : `🚀 INICIAR COM ${roomPlayers.length} JOGADORES →`}
                </BrutalButton>
              )}

              {roomPlayers[0] !== playerName && (
                <BrutalCard color={C.creamDark} className="p-4 text-center" shadow={2}>
                  <p className="text-black/60 text-sm font-bold">⏳ Aguardando o host iniciar a partida...</p>
                </BrutalCard>
              )}

              <button
                onClick={() => { cleanChannel(); setStep('online-pick'); setRoomPlayers([]) }}
                className="w-full text-black/40 text-xs font-bold underline text-center"
              >
                Sair da sala
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
