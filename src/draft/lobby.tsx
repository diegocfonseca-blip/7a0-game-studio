import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useDraft } from './store'
import type { GameMode } from './types'
import { C, BrutalCard, BrutalButton } from '../empresario/ui'

type LobbyPhase = 'choose' | 'auth' | 'menu' | 'create' | 'join' | 'waiting'

interface RoomPlayer {
  user_id: string
  manager_name: string
  avatar_url?: string
  player_index: number
}

interface RoomInfo {
  id: string
  code: string
  mode: string
  host_id: string
  max_players: number
  status: string
}

function randCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function DraftLobby() {
  const { dispatch } = useDraft()
  const [phase, setPhase] = useState<LobbyPhase>('choose')
  const [user, setUser] = useState<User | null>(null)
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [selectedMode, setSelectedMode] = useState<GameMode>('draft')
  const [managerName, setManagerName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isHost, setIsHost] = useState(false)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u && !managerName) setManagerName(u.user_metadata?.user_name ?? '')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) setManagerName(prev => prev || u.user_metadata?.user_name || '')
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: watch room when in waiting room
  useEffect(() => {
    if (!room) return
    fetchPlayers(room.id)

    const ch = supabase
      .channel(`lobby:${room.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_players',
        filter: `room_id=eq.${room.id}`,
      }, () => fetchPlayers(room.id))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'game_rooms',
        filter: `id=eq.${room.id}`,
      }, ({ new: r }: { new: RoomInfo }) => {
        if (r.status === 'started') triggerGameStart(r)
      })
      .subscribe()

    return () => { ch.unsubscribe() }
  }, [room?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPlayers(roomId: string) {
    const { data } = await supabase
      .from('room_players').select('*').eq('room_id', roomId).order('player_index')
    if (data) setPlayers(data as RoomPlayer[])
  }

  function triggerGameStart(roomData: RoomInfo) {
    setPlayers(current => {
      const myPl = current.find(p => p.user_id === (user?.id ?? ''))
      const sorted = [...current].sort((a, b) => a.player_index - b.player_index)
      const names = sorted.map(p => p.manager_name)
      dispatch({
        type: 'START_ONLINE',
        roomId: roomData.id,
        roomCode: roomData.code,
        isHost,
        playerIndex: myPl?.player_index ?? 0,
        mode: roomData.mode as GameMode,
        playerNames: names,
      })
      return current
    })
  }

  async function loginWithGithub() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.href },
    })
  }

  async function createRoom() {
    if (!user) return
    setLoading(true); setError('')

    let code = randCode()
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from('game_rooms').select('id').eq('code', code).maybeSingle()
      if (!data) break
      code = randCode()
    }

    const name = managerName.trim() || user.user_metadata?.user_name || 'Manager'
    const { data: rd, error: re } = await supabase
      .from('game_rooms')
      .insert({ code, host_id: user.id, mode: selectedMode, status: 'waiting', max_players: 4 })
      .select().single()

    if (re || !rd) { setError('Erro ao criar sala. Tente novamente.'); setLoading(false); return }

    await supabase.from('room_players').insert({
      room_id: rd.id, user_id: user.id, player_index: 0,
      manager_name: name, avatar_url: user.user_metadata?.avatar_url ?? '', is_ready: true,
    })

    setRoom(rd); setIsHost(true); setPhase('waiting'); setLoading(false)
  }

  async function joinRoom() {
    if (!user || !joinCode.trim()) return
    setLoading(true); setError('')

    const { data: rd, error: re } = await supabase
      .from('game_rooms').select('*')
      .eq('code', joinCode.trim().toUpperCase()).eq('status', 'waiting')
      .single()

    if (re || !rd) { setError('Sala não encontrada ou já iniciada.'); setLoading(false); return }

    const { data: existing } = await supabase
      .from('room_players').select('player_index').eq('room_id', rd.id)
    const used = new Set((existing ?? []).map((p: { player_index: number }) => p.player_index))
    let nextIdx = 1
    while (used.has(nextIdx)) nextIdx++
    if (nextIdx >= rd.max_players) { setError('Sala cheia!'); setLoading(false); return }

    const name = managerName.trim() || user.user_metadata?.user_name || 'Manager'
    await supabase.from('room_players').insert({
      room_id: rd.id, user_id: user.id, player_index: nextIdx,
      manager_name: name, avatar_url: user.user_metadata?.avatar_url ?? '', is_ready: true,
    })

    setRoom(rd); setIsHost(false); setPhase('waiting'); setLoading(false)
  }

  async function startGame() {
    if (!room || !isHost || players.length < 2) return
    await supabase.from('game_rooms').update({ status: 'started' }).eq('id', room.id)
  }

  async function leaveRoom() {
    if (!room || !user) return
    await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', user.id)
    setRoom(null); setPlayers([]); setPhase('menu')
  }

  // ── SCREENS ────────────────────────────────────────────────────

  if (phase === 'choose') {
    return (
      <div className="min-h-screen flex flex-col justify-center px-5 py-10" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="text-center">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl mb-3">⚡</motion.div>
            <motion.h1 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="font-black text-4xl text-white leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>
              OS ELEITOS DE 92
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-white/50 text-sm mt-2">Como você quer jogar?</motion.p>
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
            <motion.div whileTap={{ x: 3, y: 3 }}>
              <BrutalButton color={C.yellow} textColor="#000" onClick={() => dispatch({ type: 'GO_CPU' })}>
                🤖 Contra a Máquina
              </BrutalButton>
            </motion.div>
            <motion.div whileTap={{ x: 3, y: 3 }}>
              <BrutalButton color={C.blue} textColor="#fff" onClick={() => setPhase(user ? 'menu' : 'auth')}>
                👥 Online com Amigos
              </BrutalButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (phase === 'auth') {
    return (
      <div className="min-h-screen flex flex-col justify-center px-5" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto w-full space-y-6 text-center">
          <div className="text-5xl mb-2">🔐</div>
          <h2 className="font-black text-2xl text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>ENTRE COM SUA CONTA</h2>
          <p className="text-white/60 text-sm">Faça login para criar ou entrar em uma sala online.</p>
          <BrutalButton color={C.yellow} textColor="#000" onClick={loginWithGithub}>
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Entrar com GitHub
            </span>
          </BrutalButton>
          <button className="text-white/40 text-sm underline" onClick={() => setPhase('choose')}>← Voltar</button>
        </div>
      </div>
    )
  }

  if (phase === 'menu') {
    const avatar = user?.user_metadata?.avatar_url
    const ghName = user?.user_metadata?.user_name ?? user?.email?.split('@')[0] ?? 'Manager'
    return (
      <div className="min-h-screen flex flex-col justify-center px-5" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto w-full space-y-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            {avatar
              ? <img src={avatar} className="w-10 h-10 rounded-full border-2 border-yellow-400" alt="" />
              : <div className="w-10 h-10 rounded-full border-2 border-yellow-400 bg-gray-600 flex items-center justify-center text-white font-black">{ghName[0]}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-xs">Logado como</p>
              <p className="text-white font-black truncate">{ghName}</p>
            </div>
            <button onClick={() => { supabase.auth.signOut(); setPhase('choose') }}
              className="text-white/30 text-xs underline shrink-0">Sair</button>
          </div>

          <div>
            <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-1">Seu nome de manager</p>
            <input
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              placeholder={ghName}
              className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black"
              style={{ backgroundColor: '#fff' }}
            />
          </div>

          <div className="space-y-3">
            <motion.div whileTap={{ x: 3, y: 3 }}>
              <BrutalButton color={C.yellow} textColor="#000" onClick={() => setPhase('create')}>➕ Criar Sala</BrutalButton>
            </motion.div>
            <motion.div whileTap={{ x: 3, y: 3 }}>
              <BrutalButton color="white" textColor="#000" onClick={() => setPhase('join')}>🔑 Entrar em Sala</BrutalButton>
            </motion.div>
          </div>

          <button className="text-white/40 text-sm underline w-full text-center" onClick={() => setPhase('choose')}>← Voltar</button>
        </div>
      </div>
    )
  }

  if (phase === 'create') {
    const MODES: { value: GameMode; label: string; desc: string }[] = [
      { value: 'draft', label: '🎟️ Draft', desc: 'Pior colocado escolhe primeiro' },
      { value: 'leilao', label: '💰 Leilão', desc: 'Lance cego — quem pagar mais leva' },
      { value: 'draft_leilao', label: '🔀 Draft + Leilão', desc: 'Alterna os dois modos' },
    ]
    return (
      <div className="min-h-screen flex flex-col justify-center px-5" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto w-full space-y-5">
          <h2 className="font-black text-2xl text-white text-center" style={{ fontFamily: 'Oswald, sans-serif' }}>CRIAR SALA</h2>
          <div>
            <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-2">Modo de jogo</p>
            <div className="space-y-2">
              {MODES.map(m => (
                <div key={m.value} onClick={() => setSelectedMode(m.value)}
                  className="border-[3px] border-black rounded-xl p-3 cursor-pointer"
                  style={{ backgroundColor: selectedMode === m.value ? C.yellow : '#fff', boxShadow: selectedMode === m.value ? '4px 4px 0 #0C0C0C' : '2px 2px 0 #0C0C0C' }}>
                  <p className="font-black text-black text-sm">{m.label}</p>
                  <p className="text-black/60 text-xs">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
          <motion.div whileTap={{ x: 3, y: 3 }}>
            <BrutalButton color={C.yellow} textColor="#000" onClick={createRoom}>
              {loading ? 'Criando...' : '✓ Criar Sala'}
            </BrutalButton>
          </motion.div>
          <button className="text-white/40 text-sm underline w-full text-center" onClick={() => setPhase('menu')}>← Voltar</button>
        </div>
      </div>
    )
  }

  if (phase === 'join') {
    return (
      <div className="min-h-screen flex flex-col justify-center px-5" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto w-full space-y-5">
          <h2 className="font-black text-2xl text-white text-center" style={{ fontFamily: 'Oswald, sans-serif' }}>ENTRAR NA SALA</h2>
          <div>
            <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-1">Código da sala</p>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="EX: ABCD12"
              maxLength={6}
              className="w-full border-[3px] border-black rounded-lg px-3 py-4 font-black text-black text-3xl text-center tracking-widest"
              style={{ backgroundColor: '#fff' }}
            />
          </div>
          {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
          <motion.div whileTap={{ x: 3, y: 3 }}>
            <BrutalButton color={C.yellow} textColor="#000" onClick={joinRoom}>
              {loading ? 'Entrando...' : '→ Entrar'}
            </BrutalButton>
          </motion.div>
          <button className="text-white/40 text-sm underline w-full text-center" onClick={() => setPhase('menu')}>← Voltar</button>
        </div>
      </div>
    )
  }

  if (phase === 'waiting' && room) {
    const modeLabel: Record<string, string> = {
      draft: '🎟️ Draft',
      leilao: '💰 Leilão',
      draft_leilao: '🔀 Draft + Leilão',
    }
    const ready = players.length >= 2

    return (
      <div className="min-h-screen flex flex-col justify-center px-5 py-10" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto w-full space-y-5">
          <div className="text-center">
            <p className="text-white/50 text-[11px] font-black uppercase tracking-widest">Código da Sala</p>
            <p className="font-black text-5xl text-white tracking-[0.2em] mt-1">{room.code}</p>
            <p className="text-white/40 text-xs mt-1">{modeLabel[room.mode] ?? room.mode} · máx {room.max_players} jogadores</p>
          </div>

          <BrutalCard color={C.cream} className="p-4" shadow={4}>
            <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-3">
              Jogadores ({players.length}/{room.max_players})
            </p>
            <div className="space-y-2">
              {players.map(p => (
                <div key={p.user_id} className="flex items-center gap-3">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="w-8 h-8 rounded-full border-[2px] border-black" alt="" />
                    : <div className="w-8 h-8 rounded-full border-[2px] border-black bg-gray-300 flex items-center justify-center text-sm font-black">
                        {p.manager_name[0]?.toUpperCase()}
                      </div>
                  }
                  <span className="font-black text-black text-sm flex-1">{p.manager_name}</span>
                  {p.player_index === 0 && (
                    <span className="text-[10px] font-black uppercase bg-yellow-400 border border-black px-2 py-0.5 rounded-full">HOST</span>
                  )}
                </div>
              ))}
              {players.length < 2 && (
                <p className="text-black/40 text-xs italic mt-1">Aguardando mais jogadores...</p>
              )}
            </div>
          </BrutalCard>

          {isHost ? (
            <motion.div whileTap={ready ? { x: 3, y: 3 } : {}}>
              <BrutalButton
                color={ready ? C.yellow : '#ccc'}
                textColor="#000"
                onClick={ready ? startGame : undefined}
              >
                {ready ? '🚀 Iniciar Jogo!' : `Aguardando jogadores... (${players.length}/2)`}
              </BrutalButton>
            </motion.div>
          ) : (
            <div className="text-center py-3">
              <p className="text-white/60 text-sm font-bold">Aguardando o host iniciar...</p>
              <div className="mt-3 flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-yellow-400"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ delay: i * 0.2, repeat: Infinity, duration: 1.2 }} />
                ))}
              </div>
            </div>
          )}

          <button className="text-white/30 text-xs underline w-full text-center" onClick={leaveRoom}>
            ← Sair da sala
          </button>
        </div>
      </div>
    )
  }

  return null
}
