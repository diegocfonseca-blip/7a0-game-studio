import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useEsc } from './store'
import type { EscState } from './types'

// A Escalação usa as mesmas tabelas do Draft (game_rooms/room_players).
// Marcamos a sala como nossa via game_state.__game pra não colidir com o Draft.
const GAME_TAG = 'escalacao'
const MAX_PLAYERS = 8

type Phase = 'auth' | 'menu' | 'waiting'
type AuthTab = 'login' | 'register'

interface RoomPlayer { user_id: string; manager_name: string; player_index: number }
interface RoomInfo { id: string; code: string; host_id: string; max_players: number; status: string; game_state?: EscState & { __game?: string } }

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' }
function randCode() { return Math.random().toString(36).slice(2, 8).toUpperCase() }

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-1">{label}</p>
      <input {...props} className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm bg-white" />
    </div>
  )
}
function Big({ children, onClick, color = GOLD, disabled = false }: { children: React.ReactNode; onClick?: () => void; color?: string; disabled?: boolean }) {
  return (
    <motion.button whileTap={disabled ? undefined : { x: 3, y: 3 }} onClick={disabled ? undefined : onClick} disabled={disabled}
      className={`w-full border-[3px] border-black rounded-xl py-3 font-black uppercase text-sm ${disabled ? 'opacity-50' : ''}`}
      style={{ backgroundColor: color, color: '#000', boxShadow: disabled ? 'none' : `4px 4px 0 ${INK}`, ...OSWALD }}>
      {children}
    </motion.button>
  )
}

export function EscLobby() {
  const { dispatch } = useEsc()
  const [user, setUser] = useState<User | null>(null)
  const [phase, setPhase] = useState<Phase>('auth')
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const [joinCode, setJoinCode] = useState('')
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [isHost, setIsHost] = useState(false)
  const [roomError, setRoomError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u); if (u) setPhase('menu')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u); if (u) setPhase('menu')
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!room) return
    fetchPlayers(room.id)
    const ch = supabase.channel(`esclobby:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` }, () => fetchPlayers(room.id))
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
        roomId: roomData.id, roomCode: roomData.code,
        isHost: roomData.host_id === (user?.id ?? ''),
        playerIndex: myPl?.player_index ?? 0,
        playerNames: sorted.map(p => p.manager_name),
      })
      return cur
    })
  }

  const nameOf = () => user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Técnico'

  async function handleAuth() {
    setLoading(true); setAuthError('')
    if (authTab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthError(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message)
    } else {
      if (!displayName.trim()) { setAuthError('Escolha um nome de técnico.'); setLoading(false); return }
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName.trim() } } })
      setAuthError(error ? error.message : '✉️ Verifique seu email pra confirmar o cadastro.')
    }
    setLoading(false)
  }

  async function createRoom() {
    if (!user) return
    setLoading(true); setRoomError('')
    let code = randCode()
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from('game_rooms').select('id').eq('code', code).maybeSingle()
      if (!data) break; code = randCode()
    }
    const { data: rd, error: re } = await supabase.from('game_rooms')
      .insert({ code, host_id: user.id, mode: 'leilao', status: 'waiting', max_players: MAX_PLAYERS, game_state: { __game: GAME_TAG } })
      .select().single()
    if (re || !rd) { setRoomError('Erro ao criar sala.'); setLoading(false); return }
    await supabase.from('room_players').insert({ room_id: rd.id, user_id: user.id, player_index: 0, manager_name: nameOf(), is_ready: true })
    setRoom(rd); setIsHost(true); setPhase('waiting'); setLoading(false)
  }

  async function joinRoom() {
    if (!user || !joinCode.trim()) return
    setLoading(true); setRoomError('')
    const code = joinCode.trim().toUpperCase()
    const { data: rd, error: re } = await supabase.from('game_rooms').select('*').eq('code', code).single()
    if (re || !rd) { setRoomError('Sala não encontrada.'); setLoading(false); return }
    if (rd.game_state?.__game !== GAME_TAG) { setRoomError('Esse código é de outro jogo.'); setLoading(false); return }
    if (rd.status === 'started') {
      const { data: mySlot } = await supabase.from('room_players').select('*').eq('room_id', rd.id).eq('user_id', user.id).maybeSingle()
      if (!mySlot) { setRoomError('Você não está nessa sala.'); setLoading(false); return }
      triggerStart(rd); setLoading(false); return
    }
    if (rd.status !== 'waiting') { setRoomError('Sala indisponível.'); setLoading(false); return }
    const { data: existing } = await supabase.from('room_players').select('player_index').eq('room_id', rd.id)
    const used = new Set((existing ?? []).map((p: { player_index: number }) => p.player_index))
    let idx = 1; while (used.has(idx)) idx++
    if (idx >= rd.max_players) { setRoomError('Sala cheia!'); setLoading(false); return }
    await supabase.from('room_players').insert({ room_id: rd.id, user_id: user.id, player_index: idx, manager_name: nameOf(), is_ready: true })
    setRoom(rd); setIsHost(false); setPhase('waiting'); setLoading(false)
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

  const wrap = (children: React.ReactNode) => (
    <div className="min-h-screen flex flex-col justify-center px-5 py-10" style={{ backgroundColor: INK }}>
      <div className="max-w-sm mx-auto w-full space-y-5">{children}</div>
    </div>
  )

  if (phase === 'auth') return wrap(<>
    <div className="text-center">
      <div className="text-6xl mb-2">🔨</div>
      <h1 className="font-black text-3xl text-white" style={OSWALD}>A ESCALAÇÃO · ONLINE</h1>
    </div>
    <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
      {(['login', 'register'] as AuthTab[]).map(tab => (
        <button key={tab} onClick={() => { setAuthTab(tab); setAuthError('') }}
          className="flex-1 py-2.5 font-black text-sm uppercase" style={{ backgroundColor: authTab === tab ? GOLD : '#fff', color: '#000' }}>
          {tab === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>
      ))}
    </div>
    <div className="space-y-3">
      {authTab === 'register' && <Field label="Nome de técnico" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Como te chamam?" />}
      <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
      <Field label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
        onKeyDown={e => e.key === 'Enter' && handleAuth()} />
      {authError && <p className={`text-sm font-bold ${authError.startsWith('✉️') ? 'text-green-400' : 'text-red-400'}`}>{authError}</p>}
    </div>
    <Big onClick={handleAuth}>{loading ? '...' : authTab === 'login' ? 'Entrar →' : 'Criar conta →'}</Big>
    <button onClick={() => dispatch({ type: 'GO_LOBBY' })} className="text-white/40 text-sm underline w-full text-center">← Voltar</button>
  </>)

  if (phase === 'menu') return wrap(<>
    <div className="text-center">
      <div className="text-6xl mb-2">🔨</div>
      <h1 className="font-black text-3xl text-white" style={OSWALD}>A ESCALAÇÃO</h1>
      <p className="text-white/50 text-sm mt-1">Olá, <span className="text-white font-black">{nameOf()}</span></p>
    </div>
    <Big onClick={createRoom} color={GOLD}>{loading ? 'Criando...' : '🏠 Criar Sala'}</Big>
    <div className="space-y-2">
      <Field label="Código da sala" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="EX: ABCD12" maxLength={6}
        onKeyDown={e => e.key === 'Enter' && joinRoom()} />
      <Big onClick={joinRoom} color="#fff">{loading ? 'Entrando...' : '🔑 Entrar com Código'}</Big>
    </div>
    {roomError && <p className="text-red-400 text-sm font-bold">{roomError}</p>}
    <button onClick={() => supabase.auth.signOut()} className="text-white/30 text-xs underline w-full text-center">Sair da conta</button>
    <button onClick={() => dispatch({ type: 'GO_LOBBY' })} className="text-white/40 text-sm underline w-full text-center">← Menu inicial</button>
  </>)

  if (phase === 'waiting' && room) {
    const ready = players.length >= 2
    return wrap(<>
      <div className="text-center">
        <p className="text-white/50 text-[11px] font-black uppercase tracking-widest">Código da Sala</p>
        <p className="font-black text-5xl text-white tracking-[0.2em] mt-1">{room.code}</p>
        <p className="text-white/30 text-xs mt-1">Compartilhe com a galera</p>
      </div>
      <div className="border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-3">Técnicos ({players.length}/{room.max_players})</p>
        <div className="space-y-2">
          {players.map(p => (
            <div key={p.user_id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-300 flex items-center justify-center text-sm font-black">{p.manager_name[0]?.toUpperCase()}</div>
              <span className="font-black text-black text-sm flex-1">{p.manager_name}</span>
              {p.player_index === 0 && <span className="text-[10px] font-black uppercase bg-yellow-400 border border-black px-2 py-0.5 rounded-full">HOST</span>}
            </div>
          ))}
          {players.length < 2 && <p className="text-black/40 text-xs italic mt-1">Aguardando mais técnicos…</p>}
        </div>
      </div>
      {isHost
        ? <Big onClick={startOnline} disabled={!ready} color={ready ? GREEN : '#ccc'}><span style={{ color: ready ? '#fff' : '#000' }}>{ready ? '🔨 Abrir o Pregão!' : `Aguardando… (${players.length}/2 mín)`}</span></Big>
        : <p className="text-white/60 text-sm font-bold text-center py-3">Aguardando o host abrir o pregão…</p>}
      <button onClick={leaveRoom} className="text-white/30 text-xs underline w-full text-center">← Sair da sala</button>
    </>)
  }
  return null
}
