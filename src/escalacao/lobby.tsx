import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useEsc } from './store'
import { AdminButton } from './admin'
import type { EscState, FormationKey } from './types'

// A Escalação usa as mesmas tabelas do Draft (game_rooms/room_players).
// Marcamos a sala como nossa via game_state.__game pra não colidir com o Draft.
const GAME_TAG = 'escalacao'
const MAX_PLAYERS = 20 // a tabela sempre tem 20 times; os que faltam viram bots

type Phase = 'auth' | 'menu' | 'waiting'
type AuthTab = 'login' | 'register'

interface RoomPlayer { user_id: string; manager_name: string; player_index: number }
type GS = EscState & { __game?: string; formation?: FormationKey; roomName?: string }
interface RoomInfo { id: string; code: string; host_id: string; max_players: number; status: string; game_state?: GS }
type OpenRoom = RoomInfo & { count: number }

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' }
function randCode() { return Math.random().toString(36).slice(2, 8).toUpperCase() }

// Guarda a sala no aparelho: no celular, trocar de app (ex.: abrir o
// WhatsApp pra mandar o código) pode fazer o navegador descartar a aba da
// memória. Ao voltar, a página recarrega do zero e, sem isso, o código
// "some" — não porque saiu da sala, mas porque tudo que só existia em
// memória foi perdido. Com isso salvo, reconectamos sozinhos.
const LS_KEY = 'escalacao-room'
function saveRoom(id: string) { try { localStorage.setItem(LS_KEY, id) } catch { /* ignora */ } }
function clearSavedRoom() { try { localStorage.removeItem(LS_KEY) } catch { /* ignora */ } }
function loadSavedRoom(): string | null { try { return localStorage.getItem(LS_KEY) } catch { return null } }

// Detecta, já na HOME, se o técnico tem uma partida online em andamento pra
// retomar (sala salva no aparelho + estado ainda vivo no banco). Devolve o
// código da sala e um `resume()` que reconecta na hora — sem precisar entrar
// pelo "JOGAR ONLINE". Se não houver nada válido, devolve null.
export function useResumableRoom() {
  const { dispatch } = useEsc()
  const [info, setInfo] = useState<{ code: string } | null>(null)
  const roomRef = useRef<RoomInfo | null>(null)
  const userRef = useRef<User | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const savedId = loadSavedRoom()
      if (!savedId) return
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user || !alive) return
      userRef.current = user
      const { data: rd } = await supabase.from('game_rooms').select('*').eq('id', savedId).maybeSingle()
      if (!rd || rd.game_state?.__game !== GAME_TAG) { clearSavedRoom(); return }
      const gs = rd.game_state as GS | undefined
      const inProgress = rd.status === 'started' && !!gs && Array.isArray(gs.managers)
        && gs.managers.length > 0 && !!gs.screen && gs.screen !== 'intro' && gs.screen !== 'lobby'
      if (!inProgress) return
      // confirma que ainda sou um dos técnicos da sala
      const { data: mySlot } = await supabase.from('room_players').select('user_id').eq('room_id', rd.id).eq('user_id', user.id).maybeSingle()
      if (!mySlot || !alive) return
      roomRef.current = rd as RoomInfo
      setInfo({ code: rd.code })
    })()
    return () => { alive = false }
  }, [])

  const resume = useCallback(async () => {
    const rd = roomRef.current, user = userRef.current
    if (!rd || !user) return
    const { data: freshRoom } = await supabase.from('game_rooms').select('game_state').eq('id', rd.id).maybeSingle()
    const gs = (freshRoom?.game_state ?? rd.game_state) as GS | undefined
    const { data: allPlayers } = await supabase.from('room_players').select('*').eq('room_id', rd.id).order('player_index')
    const sorted = (allPlayers ?? []) as RoomPlayer[]
    const myPl = sorted.find(p => p.user_id === user.id)
    if (!myPl) return
    saveRoom(rd.id)
    const amHost = rd.host_id === user.id
    const inProgress = !!gs && Array.isArray(gs.managers) && gs.managers.length > 0
      && !!gs.screen && gs.screen !== 'intro' && gs.screen !== 'lobby'
    if (inProgress) {
      dispatch({ type: 'RESTORE_ONLINE', state: gs as EscState, roomId: rd.id, roomCode: rd.code, isHost: amHost, playerIndex: myPl.player_index })
    } else {
      dispatch({ type: 'START_ONLINE', roomId: rd.id, roomCode: rd.code, isHost: amHost, playerIndex: myPl.player_index, playerNames: sorted.map(p => p.manager_name), formation: gs?.formation ?? '4-3-3' })
    }
  }, [dispatch])

  return info ? { code: info.code, resume } : null
}

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
  const [formation, setFormation] = useState<FormationKey>('4-3-3')
  const [roomName, setRoomName] = useState('')
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [isHost, setIsHost] = useState(false)
  const [roomError, setRoomError] = useState('')
  // salas abertas (lista pública)
  const [tab, setTab] = useState<'create' | 'open' | 'join'>('open')
  const [openRooms, setOpenRooms] = useState<OpenRoom[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [search, setSearch] = useState('')
  // edição rápida do nome de técnico (na home)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

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

  // Reconecta sozinho se a página recarregou com uma sala salva (ex.: o
  // navegador descartou a aba ao trocar pro WhatsApp e voltar).
  useEffect(() => {
    if (!user) return
    const savedId = loadSavedRoom()
    if (!savedId) return
    ;(async () => {
      const { data: rd } = await supabase.from('game_rooms').select('*').eq('id', savedId).maybeSingle()
      if (!rd || rd.game_state?.__game !== GAME_TAG) { clearSavedRoom(); return }
      if (rd.status === 'started') { await triggerStart(rd); return }
      if (rd.status === 'waiting') {
        const { data: mySlot } = await supabase.from('room_players').select('*').eq('room_id', rd.id).eq('user_id', user.id).maybeSingle()
        if (!mySlot) { clearSavedRoom(); return }
        setRoom(rd); setIsHost(rd.host_id === user.id); setPhase('waiting')
        return
      }
      clearSavedRoom()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // carrega a lista quando o usuário abre a aba "Salas abertas"
  useEffect(() => {
    if (phase === 'menu' && tab === 'open') fetchOpenRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tab])

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

  // Busca a lista de jogadores DIRETO do banco (não confia em estado local
  // que pode estar vazio/desatualizado, ex.: logo após reconectar) — usar
  // uma lista errada aqui faz o jogo montar o time errado como "você".
  async function triggerStart(roomData: RoomInfo) {
    if (!user) return
    // pega o estado salvo MAIS recente (não confia no payload do evento, que
    // pode vir defasado) — é o que permite retomar a partida na reconexão.
    const { data: freshRoom } = await supabase.from('game_rooms').select('game_state').eq('id', roomData.id).maybeSingle()
    const gs = (freshRoom?.game_state ?? roomData.game_state) as GS | undefined
    const { data: allPlayers } = await supabase.from('room_players').select('*').eq('room_id', roomData.id).order('player_index')
    const sorted = (allPlayers ?? []) as RoomPlayer[]
    const myPl = sorted.find(p => p.user_id === user.id)
    if (!myPl) return
    // NÃO limpa a sala salva aqui: ela precisa sobreviver ao jogo inteiro pra
    // que atualizar a página (ou o app descartar a aba) reconecte o técnico —
    // inclusive o host. Só limpamos quando alguém sai de propósito (leaveRoom,
    // "Menu inicial", "Sair da conta"). Antes, limpar aqui fazia o host que
    // recarregava cair na lista de salas e abandonar a partida.
    saveRoom(roomData.id)
    const amHost = roomData.host_id === user.id
    // partida já em andamento salva no banco → RESTAURA (evita resetar tudo
    // quando alguém reconecta ou o host recarrega/cai). Caso contrário, é o
    // início de verdade: monta o jogo do zero (determinístico pelo código).
    const inProgress = !!gs && Array.isArray(gs.managers) && gs.managers.length > 0
      && !!gs.screen && gs.screen !== 'intro' && gs.screen !== 'lobby'
    if (inProgress) {
      dispatch({
        type: 'RESTORE_ONLINE',
        state: gs as EscState,
        roomId: roomData.id, roomCode: roomData.code,
        isHost: amHost, playerIndex: myPl.player_index,
      })
      return
    }
    dispatch({
      type: 'START_ONLINE',
      roomId: roomData.id, roomCode: roomData.code,
      isHost: amHost,
      playerIndex: myPl.player_index,
      playerNames: sorted.map(p => p.manager_name),
      formation: gs?.formation ?? '4-3-3',
    })
  }

  const nameOf = () => user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Técnico'

  // salva o nome de técnico (display_name) — usado no chip de edição rápida
  async function saveName() {
    const nm = nameDraft.trim()
    if (!nm) return
    setLoading(true)
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: nm } })
    if (!error && data.user) setUser(data.user)
    setEditingName(false); setLoading(false)
  }

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
    const name = (roomName.trim() || `Sala do ${nameOf()}`).slice(0, 24)
    const { data: rd, error: re } = await supabase.from('game_rooms')
      .insert({ code, host_id: user.id, mode: 'leilao', status: 'waiting', max_players: MAX_PLAYERS, game_state: { __game: GAME_TAG, formation, roomName: name } })
      .select().single()
    if (re || !rd) { setRoomError('Erro ao criar sala.'); setLoading(false); return }
    await supabase.from('room_players').insert({ room_id: rd.id, user_id: user.id, player_index: 0, manager_name: nameOf(), is_ready: true })
    saveRoom(rd.id)
    setRoom(rd); setIsHost(true); setPhase('waiting'); setLoading(false)
  }

  // lista pública de salas abertas (waiting) da Escalação
  async function fetchOpenRooms() {
    setListLoading(true)
    // só salas recentes: uma sala "waiting" de horas atrás é sala abandonada
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    const { data: rooms } = await supabase.from('game_rooms')
      .select('id, code, host_id, max_players, status, game_state')
      .eq('status', 'waiting')
      .eq('game_state->>__game', GAME_TAG)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50)
    const list = (rooms ?? []) as RoomInfo[]
    const ids = list.map(r => r.id)
    const counts: Record<string, number> = {}
    if (ids.length) {
      const { data: pls } = await supabase.from('room_players').select('room_id').in('room_id', ids)
      for (const p of (pls ?? []) as { room_id: string }[]) counts[p.room_id] = (counts[p.room_id] ?? 0) + 1
    }
    // só salas vivas: sem ninguém dentro (count 0) é sala fantasma abandonada
    setOpenRooms(list.map(r => ({ ...r, count: counts[r.id] ?? 0 })).filter(r => r.count >= 1))
    setListLoading(false)
  }

  // entra numa sala já carregada (por código ou pela lista de salas abertas)
  async function enterRoom(rd: RoomInfo) {
    if (!user) return
    if (rd.game_state?.__game !== GAME_TAG) { setRoomError('Essa sala é de outro jogo.'); setLoading(false); return }
    if (rd.status === 'started') {
      const { data: mySlot } = await supabase.from('room_players').select('*').eq('room_id', rd.id).eq('user_id', user.id).maybeSingle()
      if (!mySlot) { setRoomError('Você não está nessa sala.'); setLoading(false); return }
      triggerStart(rd); setLoading(false); return
    }
    if (rd.status !== 'waiting') { setRoomError('Sala indisponível.'); setLoading(false); return }
    const { data: existing } = await supabase.from('room_players').select('user_id, player_index').eq('room_id', rd.id)
    const rows = (existing ?? []) as { user_id: string; player_index: number }[]
    // já estou nessa sala? volta pro slot que já é meu (evita duplicar)
    const mine = rows.find(p => p.user_id === user.id)
    if (mine) { saveRoom(rd.id); setRoom(rd); setIsHost(rd.host_id === user.id); setPhase('waiting'); setLoading(false); return }
    const used = new Set(rows.map(p => p.player_index))
    let idx = 1; while (used.has(idx)) idx++
    if (idx >= rd.max_players) { setRoomError('Sala cheia!'); setLoading(false); return }
    await supabase.from('room_players').insert({ room_id: rd.id, user_id: user.id, player_index: idx, manager_name: nameOf(), is_ready: true })
    saveRoom(rd.id)
    setRoom(rd); setIsHost(false); setPhase('waiting'); setLoading(false)
  }

  async function joinRoom() {
    if (!user || !joinCode.trim()) return
    setLoading(true); setRoomError('')
    const code = joinCode.trim().toUpperCase()
    const { data: rd, error: re } = await supabase.from('game_rooms').select('*').eq('code', code).single()
    if (re || !rd) { setRoomError('Sala não encontrada.'); setLoading(false); return }
    if (rd.game_state?.__game !== GAME_TAG) { setRoomError('Esse código é de outro jogo.'); setLoading(false); return }
    await enterRoom(rd)
  }

  async function joinFromList(rd: OpenRoom) {
    if (!user) return
    setLoading(true); setRoomError('')
    await enterRoom(rd)
  }

  async function startOnline() {
    if (!room || !isHost || players.length < 2) return
    await supabase.from('game_rooms').update({ status: 'started' }).eq('id', room.id)
  }
  async function leaveRoom() {
    if (!room || !user) return
    await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', user.id)
    clearSavedRoom()
    setRoom(null); setPlayers([]); setPhase('menu')
  }

  const wrap = (children: React.ReactNode, onBack?: () => void) => (
    <div className="min-h-screen flex flex-col justify-center px-5 py-10 relative" style={{ backgroundColor: INK }}>
      {onBack && (
        <button onClick={onBack} aria-label="Voltar pra home"
          className="absolute top-4 left-4 z-10 flex items-center gap-1 text-white/70 font-black text-sm active:opacity-60" style={OSWALD}>
          <span className="text-xl leading-none">←</span> Home
        </button>
      )}
      <div className="max-w-sm mx-auto w-full space-y-5">{children}</div>
    </div>
  )

  if (phase === 'auth') return wrap(<>
    <div className="text-center">
      <div className="text-6xl mb-2">🔨</div>
      <h1 className="font-black text-3xl text-white" style={OSWALD}>LEILÃO LEGENDS 38 · ONLINE</h1>
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

  if (phase === 'menu') {
    const TABS: { id: 'create' | 'open' | 'join'; label: string }[] = [
      { id: 'create', label: 'Criar sala' }, { id: 'open', label: 'Salas abertas' }, { id: 'join', label: 'Entrar' },
    ]
    const hasName = !!user?.user_metadata?.display_name
    const filtered = openRooms.filter(r => {
      const nm = r.game_state?.roomName ?? r.code
      return nm.toLowerCase().includes(search.trim().toLowerCase())
    })
    return wrap(<>
      <div className="text-center space-y-2">
        <div className="text-6xl">🔨</div>
        <h1 className="font-black text-3xl text-white" style={OSWALD}>LEILÃO LEGENDS 38</h1>
        {editingName ? (
          <div className="flex gap-2 items-stretch max-w-xs mx-auto">
            <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)} maxLength={20}
              placeholder="Seu nome de técnico" onKeyDown={e => e.key === 'Enter' && saveName()}
              className="flex-1 border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm bg-white" />
            <button onClick={saveName} disabled={loading || !nameDraft.trim()}
              className="border-[3px] border-black rounded-lg px-3 font-black text-sm" style={{ background: GREEN, color: '#fff', ...OSWALD }}>OK</button>
            <button onClick={() => setEditingName(false)}
              className="border-[3px] border-black rounded-lg px-3 font-black text-sm bg-white text-black">✕</button>
          </div>
        ) : (
          <button onClick={() => { setNameDraft(user?.user_metadata?.display_name ?? ''); setEditingName(true) }}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border-2"
            style={{ background: hasName ? 'rgba(255,255,255,.08)' : GOLD, borderColor: hasName ? 'rgba(255,255,255,.25)' : '#000' }}>
            <span className="font-black text-sm" style={{ color: hasName ? '#fff' : '#000' }}>
              {hasName ? nameOf() : 'Toque pra pôr seu nome'}
            </span>
            <span style={{ fontSize: 13 }}>✏️</span>
          </button>
        )}
      </div>

      {/* abas */}
      <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setRoomError('') }}
            className="flex-1 py-2.5 font-black text-xs uppercase" style={{ backgroundColor: tab === t.id ? GOLD : '#fff', color: '#000', ...OSWALD }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'create' && <div className="space-y-3">
        <Field label="Nome da sala" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder={`Sala do ${nameOf()}`} maxLength={24} />
        <div>
          <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-1">Formação da sala (vale pra todo mundo)</p>
          <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
            {(['4-3-3', '4-4-2'] as FormationKey[]).map(f => (
              <button key={f} onClick={() => setFormation(f)}
                className="flex-1 py-2.5 font-black text-sm uppercase" style={{ backgroundColor: formation === f ? GOLD : '#fff', color: '#000' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <Big onClick={createRoom} color={GOLD}>{loading ? 'Criando...' : '🏠 Criar Sala'}</Big>
      </div>}

      {tab === 'open' && <div className="space-y-3">
        <Field label="Buscar sala" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sala…" />
        <div className="space-y-2">
          {listLoading && <p className="text-white/50 text-sm font-bold text-center py-3">Carregando salas…</p>}
          {!listLoading && filtered.length === 0 && <p className="text-white/50 text-sm font-bold text-center py-3">Nenhuma sala aberta agora. Crie a sua! 🔨</p>}
          {filtered.map(r => {
            const nm = r.game_state?.roomName ?? r.code
            const full = r.count >= r.max_players
            return (
              <div key={r.id} className="flex items-center gap-2 border-[3px] border-black rounded-xl p-3 bg-[#F4ECD6]" style={{ boxShadow: `3px 3px 0 ${INK}` }}>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-black text-sm truncate" style={OSWALD}>{nm}</p>
                  <p className="text-black/60 text-xs font-bold mt-0.5">👥 {r.count}/{r.max_players} · {r.code}</p>
                </div>
                <button onClick={() => joinFromList(r)} disabled={loading || full}
                  className="border-[2px] border-black rounded-lg px-3 py-2 font-black text-xs uppercase shrink-0"
                  style={{ backgroundColor: full ? '#ccc' : GREEN, color: full ? '#000' : '#fff', ...OSWALD }}>
                  {full ? 'Cheia' : 'Entrar'}
                </button>
              </div>
            )
          })}
        </div>
        <Big onClick={fetchOpenRooms} color="#fff">🔄 Atualizar lista</Big>
      </div>}

      {tab === 'join' && <div className="space-y-2">
        <Field label="Código da sala" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="EX: ABCD12" maxLength={6}
          onKeyDown={e => e.key === 'Enter' && joinRoom()} />
        <Big onClick={joinRoom} color="#fff">{loading ? 'Entrando...' : '🔑 Entrar com Código'}</Big>
      </div>}

      {roomError && <p className="text-red-400 text-sm font-bold">{roomError}</p>}
      <Big onClick={() => dispatch({ type: 'GO_ALBUM' })} color="#fff">📖 Meu Álbum</Big>
      <AdminButton />
      <button onClick={() => { clearSavedRoom(); supabase.auth.signOut() }} className="text-white/30 text-xs underline w-full text-center">Sair da conta</button>
      <button onClick={() => { clearSavedRoom(); dispatch({ type: 'GO_LOBBY' }) }} className="text-white/40 text-sm underline w-full text-center">← Menu inicial</button>
    </>, () => { clearSavedRoom(); dispatch({ type: 'GO_LOBBY' }) })
  }

  if (phase === 'waiting' && room) {
    const ready = players.length >= 2
    return wrap(<>
      <div className="text-center">
        {room.game_state?.roomName && <p className="text-white font-black text-xl mb-1" style={OSWALD}>{room.game_state.roomName}</p>}
        <p className="text-white/50 text-[11px] font-black uppercase tracking-widest">Código da Sala</p>
        <p className="font-black text-5xl text-white tracking-[0.2em] mt-1">{room.code}</p>
        <p className="text-white/30 text-xs mt-1">Aparece nas Salas Abertas ou compartilhe o código</p>
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
