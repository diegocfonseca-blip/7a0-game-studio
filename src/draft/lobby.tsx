import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useDraft } from './store'
import type { GameMode } from './types'
import { C, BrutalCard, BrutalButton } from '../empresario/ui'

type LobbyPhase = 'auth' | 'menu' | 'newGame' | 'join' | 'waiting'
type AuthTab = 'login' | 'register'

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
  const { dispatch, state } = useDraft()
  const hasSave = state.started && state.onlineMode !== 'online'

  // ── auth state ──
  const [user, setUser] = useState<User | null>(null)
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // ── lobby state ──
  const [phase, setPhase] = useState<LobbyPhase>('auth')
  const [onlineChoice, setOnlineChoice] = useState(false)
  const [selectedMode, setSelectedMode] = useState<GameMode>('draft')
  const [joinCode, setJoinCode] = useState('')
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [isHost, setIsHost] = useState(false)
  const [roomError, setRoomError] = useState('')
  const [roomLoading, setRoomLoading] = useState(false)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) setPhase('menu')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) setPhase('menu')
    })
    return () => subscription.unsubscribe()
  }, [])

  // Realtime: watch room when in waiting
  useEffect(() => {
    if (!room) return
    fetchPlayers(room.id)
    const ch = supabase
      .channel(`lobby:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` },
        () => fetchPlayers(room.id))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${room.id}` },
        ({ new: r }: { new: RoomInfo }) => { if (r.status === 'started') triggerStart(r) })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [room?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPlayers(roomId: string) {
    const { data } = await supabase.from('room_players').select('*').eq('room_id', roomId).order('player_index')
    if (data) setPlayers(data as RoomPlayer[])
  }

  function triggerStart(roomData: RoomInfo) {
    setPlayers(cur => {
      const myPl = cur.find(p => p.user_id === (user?.id ?? ''))
      const sorted = [...cur].sort((a, b) => a.player_index - b.player_index)
      dispatch({
        type: 'START_ONLINE',
        roomId: roomData.id,
        roomCode: roomData.code,
        isHost,
        playerIndex: myPl?.player_index ?? 0,
        mode: roomData.mode as GameMode,
        playerNames: sorted.map(p => p.manager_name),
      })
      return cur
    })
  }

  // ── auth actions ──
  async function handleLogin() {
    setAuthLoading(true); setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message)
    setAuthLoading(false)
  }

  async function handleRegister() {
    if (!displayName.trim()) { setAuthError('Escolha um nome de manager.'); return }
    setAuthLoading(true); setAuthError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName.trim() } },
    })
    if (error) setAuthError(error.message)
    else setAuthError('✉️ Verifique seu email para confirmar o cadastro.')
    setAuthLoading(false)
  }

  // ── room actions ──
  async function createRoom() {
    if (!user) return
    setRoomLoading(true); setRoomError('')
    let code = randCode()
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from('game_rooms').select('id').eq('code', code).maybeSingle()
      if (!data) break
      code = randCode()
    }
    const name = user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'Manager'
    const { data: rd, error: re } = await supabase
      .from('game_rooms')
      .insert({ code, host_id: user.id, mode: selectedMode, status: 'waiting', max_players: 4 })
      .select().single()
    if (re || !rd) { setRoomError('Erro ao criar sala.'); setRoomLoading(false); return }
    await supabase.from('room_players').insert({
      room_id: rd.id, user_id: user.id, player_index: 0, manager_name: name, is_ready: true,
    })
    setRoom(rd); setIsHost(true); setPhase('waiting'); setRoomLoading(false)
  }

  async function joinRoom() {
    if (!user || !joinCode.trim()) return
    setRoomLoading(true); setRoomError('')
    const { data: rd, error: re } = await supabase
      .from('game_rooms').select('*')
      .eq('code', joinCode.trim().toUpperCase()).eq('status', 'waiting').single()
    if (re || !rd) { setRoomError('Sala não encontrada ou já iniciada.'); setRoomLoading(false); return }
    const { data: existing } = await supabase.from('room_players').select('player_index').eq('room_id', rd.id)
    const used = new Set((existing ?? []).map((p: { player_index: number }) => p.player_index))
    let nextIdx = 1; while (used.has(nextIdx)) nextIdx++
    if (nextIdx >= rd.max_players) { setRoomError('Sala cheia!'); setRoomLoading(false); return }
    const name = user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'Manager'
    await supabase.from('room_players').insert({
      room_id: rd.id, user_id: user.id, player_index: nextIdx, manager_name: name, is_ready: true,
    })
    setRoom(rd); setIsHost(false); setPhase('waiting'); setRoomLoading(false)
  }

  async function startOnline() {
    if (!room || !isHost || players.length < 2) return
    await supabase.from('game_rooms').update({ status: 'started' }).eq('id', room.id)
  }

  async function leaveRoom() {
    if (!room || !user) return
    await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', user.id)
    setRoom(null); setPlayers([]); setPhase('menu')
  }

  // ── SCREEN: AUTH ────────────────────────────────────────────────
  if (phase === 'auth') {
    return (
      <div className="min-h-screen flex flex-col justify-center px-5 py-10" style={{ backgroundColor: C.black }}>
        <div className="max-w-sm mx-auto w-full space-y-5">
          <div className="text-center">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl mb-3">⚡</motion.div>
            <h1 className="font-black text-3xl text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>OS ELEITOS DE 92</h1>
          </div>

          {/* Tabs */}
          <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
            {(['login', 'register'] as AuthTab[]).map(tab => (
              <button key={tab} onClick={() => { setAuthTab(tab); setAuthError('') }}
                className="flex-1 py-2.5 font-black text-sm uppercase transition-colors"
                style={{ backgroundColor: authTab === tab ? C.yellow : '#fff', color: '#000' }}>
                {tab === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <BrutalCard color={C.cream} className="p-4 space-y-3" shadow={5}>
            {authTab === 'register' && (
              <div>
                <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-1">Nome de manager</p>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Como te chamam?"
                  className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm"
                  style={{ backgroundColor: '#fff' }} />
              </div>
            )}
            <div>
              <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-1">Email</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm"
                style={{ backgroundColor: '#fff' }} />
            </div>
            <div>
              <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-1">Senha</p>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm"
                style={{ backgroundColor: '#fff' }}
                onKeyDown={e => e.key === 'Enter' && (authTab === 'login' ? handleLogin() : handleRegister())} />
            </div>
            {authError && (
              <p className={`text-sm font-bold ${authError.startsWith('✉️') ? 'text-green-700' : 'text-red-600'}`}>{authError}</p>
            )}
          </BrutalCard>

          <motion.div whileTap={{ x: 3, y: 3 }}>
            <BrutalButton color={C.yellow} textColor="#000"
              onClick={authTab === 'login' ? handleLogin : handleRegister}>
              {authLoading ? '...' : authTab === 'login' ? 'Entrar →' : 'Criar conta →'}
            </BrutalButton>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── SCREEN: MENU ────────────────────────────────────────────────
  if (phase === 'menu') {
    const name = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Manager'
    return (
      <div className="min-h-screen flex flex-col justify-center px-5 py-10" style={{ backgroundColor: C.black }}>
        <div className="max-w-sm mx-auto w-full space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-3">⚡</div>
            <h1 className="font-black text-3xl text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>OS ELEITOS DE 92</h1>
            <p className="text-white/50 text-sm mt-1">Olá, <span className="text-white font-black">{name}</span></p>
          </div>

          <div className="space-y-3">
            {hasSave && (
              <motion.div whileTap={{ x: 3, y: 3 }}>
                <BrutalButton color={C.yellow} textColor="#000" onClick={() => dispatch({ type: 'RESTORE_SCREEN' })}>
                  ▶ Continuar Jogo Salvo
                </BrutalButton>
              </motion.div>
            )}
            <motion.div whileTap={{ x: 3, y: 3 }}>
              <BrutalButton color={hasSave ? 'white' : C.yellow} textColor="#000" onClick={() => setPhase('newGame')}>
                ⚡ {hasSave ? 'Nova Partida' : 'Começar Jogo'}
              </BrutalButton>
            </motion.div>
            <motion.div whileTap={{ x: 3, y: 3 }}>
              <BrutalButton color="white" textColor="#000" onClick={() => setPhase('join')}>
                🔑 Entrar em Partida Online
              </BrutalButton>
            </motion.div>
          </div>

          <button onClick={() => supabase.auth.signOut()}
            className="text-white/30 text-xs underline w-full text-center">Sair da conta</button>
        </div>
      </div>
    )
  }

  // ── SCREEN: NOVA PARTIDA ────────────────────────────────────────
  if (phase === 'newGame') {
    const MODES: { value: GameMode; label: string; desc: string }[] = [
      { value: 'draft', label: '🎟️ Draft', desc: 'Pior colocado escolhe primeiro' },
      { value: 'leilao', label: '💰 Leilão', desc: 'Lance cego — quem pagar mais leva' },
      { value: 'draft_leilao', label: '🔀 Draft + Leilão', desc: 'Alterna os dois modos' },
    ]
    return (
      <div className="min-h-screen flex flex-col justify-center px-5 py-6" style={{ backgroundColor: C.black }}>
        <div className="max-w-sm mx-auto w-full space-y-5">
          <h2 className="font-black text-2xl text-white text-center" style={{ fontFamily: 'Oswald, sans-serif' }}>NOVA PARTIDA</h2>

          {/* CPU vs Online */}
          <div className="flex gap-2">
            {[false, true].map(online => (
              <button key={String(online)} onClick={() => setOnlineChoice(online)}
                className="flex-1 border-[3px] border-black rounded-xl py-3 font-black text-sm transition-colors"
                style={{ backgroundColor: onlineChoice === online ? C.yellow : '#fff', color: '#000', boxShadow: onlineChoice === online ? '4px 4px 0 #0C0C0C' : '2px 2px 0 #0C0C0C' }}>
                {online ? '👥 Online' : '🤖 CPU'}
              </button>
            ))}
          </div>

          {/* Modo de jogo */}
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

          {roomError && <p className="text-red-400 text-sm font-bold">{roomError}</p>}

          <motion.div whileTap={{ x: 3, y: 3 }}>
            <BrutalButton color={C.yellow} textColor="#000"
              onClick={onlineChoice ? createRoom : () => dispatch({ type: 'GO_CPU' })}>
              {roomLoading ? 'Criando...' : onlineChoice ? '→ Criar Sala Online' : '→ Jogar contra CPU'}
            </BrutalButton>
          </motion.div>

          <button className="text-white/40 text-sm underline w-full text-center" onClick={() => setPhase('menu')}>← Voltar</button>
        </div>
      </div>
    )
  }

  // ── SCREEN: ENTRAR EM PARTIDA ───────────────────────────────────
  if (phase === 'join') {
    return (
      <div className="min-h-screen flex flex-col justify-center px-5" style={{ backgroundColor: C.black }}>
        <div className="max-w-sm mx-auto w-full space-y-5">
          <h2 className="font-black text-2xl text-white text-center" style={{ fontFamily: 'Oswald, sans-serif' }}>ENTRAR EM PARTIDA</h2>
          <div>
            <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-1">Código da sala</p>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="EX: ABCD12"
              maxLength={6}
              className="w-full border-[3px] border-black rounded-lg px-3 py-4 font-black text-black text-3xl text-center tracking-widest"
              style={{ backgroundColor: '#fff' }}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
            />
          </div>
          {roomError && <p className="text-red-400 text-sm font-bold">{roomError}</p>}
          <motion.div whileTap={{ x: 3, y: 3 }}>
            <BrutalButton color={C.yellow} textColor="#000" onClick={joinRoom}>
              {roomLoading ? 'Entrando...' : '→ Entrar'}
            </BrutalButton>
          </motion.div>
          <button className="text-white/40 text-sm underline w-full text-center" onClick={() => setPhase('menu')}>← Voltar</button>
        </div>
      </div>
    )
  }

  // ── SCREEN: SALA DE ESPERA ──────────────────────────────────────
  if (phase === 'waiting' && room) {
    const modeLabel: Record<string, string> = { draft: '🎟️ Draft', leilao: '💰 Leilão', draft_leilao: '🔀 Draft + Leilão' }
    const ready = players.length >= 2
    return (
      <div className="min-h-screen flex flex-col justify-center px-5 py-10" style={{ backgroundColor: C.black }}>
        <div className="max-w-sm mx-auto w-full space-y-5">
          <div className="text-center">
            <p className="text-white/50 text-[11px] font-black uppercase tracking-widest">Código da Sala</p>
            <p className="font-black text-5xl text-white tracking-[0.2em] mt-1">{room.code}</p>
            <p className="text-white/40 text-xs mt-1">{modeLabel[room.mode] ?? room.mode}</p>
            <p className="text-white/30 text-xs mt-0.5">Compartilhe o código com seus amigos</p>
          </div>

          <BrutalCard color={C.cream} className="p-4" shadow={4}>
            <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-3">
              Jogadores ({players.length}/{room.max_players})
            </p>
            <div className="space-y-2">
              {players.map(p => (
                <div key={p.user_id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-[2px] border-black bg-gray-300 flex items-center justify-center text-sm font-black">
                    {p.manager_name[0]?.toUpperCase()}
                  </div>
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
              <BrutalButton color={ready ? C.yellow : '#ccc'} textColor="#000" onClick={ready ? startOnline : undefined}>
                {ready ? '🚀 Iniciar Jogo!' : `Aguardando... (${players.length}/2 mín)`}
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

          <button className="text-white/30 text-xs underline w-full text-center" onClick={leaveRoom}>← Sair da sala</button>
        </div>
      </div>
    )
  }

  return null
}
