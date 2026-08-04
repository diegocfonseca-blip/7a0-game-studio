import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useEsc } from './store'
import { AdminButton, useCanCareerOnline } from './admin'
import { apoioSelo, stripEmoji, APOIO_PERKS, ApoioSheen, myApoioPerk, logout } from './apoio'
import { isMuted } from './sound'
import type { ApoioPerk } from './apoio'
import type { DeckChoice } from './careeronline'
import { DIVISION_TEAMS } from './data'
import type { EscState, FormationKey } from './types'

// A Escalação usa as mesmas tabelas do Draft (game_rooms/room_players).
// Marcamos a sala como nossa via game_state.__game pra não colidir com o Draft.
const GAME_TAG = 'escalacao'
const MAX_PLAYERS = 20 // a tabela sempre tem 20 times; os que faltam viram bots

type Phase = 'auth' | 'menu' | 'waiting'
type AuthTab = 'login' | 'register'

interface RoomPlayer { user_id: string; manager_name: string; player_index: number }
// 💬 mensagem do chat da sala de espera (uid = quem mandou, pra saber o "meu")
interface LobbyMsg { id: string; uid: string; name: string; text: string }
// 🎈 reação que FLUTUA (sobe e some) na sala de espera — NÃO entra no chat.
// Chat é pra escrever; emoji/zoeira flutua por cima de tudo (inclusive do chat aberto).
interface LobbyFloat { id: string; emoji: string; text?: string; name: string; x: number }
// tier de apoio de um jogador da sala, lido pelo SELO que viaja no nome dele
// (👑 ouro · ⭐ prata · 💎 roxo) — assim TODOS veem a bolinha brilhando, não só o dono
const perkFromName = (n: string): ApoioPerk | null =>
  n.includes('👑') ? APOIO_PERKS.ouro : n.includes('⭐') ? APOIO_PERKS.prata : n.includes('💎') ? APOIO_PERKS.roxo : null
type GS = EscState & { __game?: string; formation?: FormationKey; roomName?: string; locked?: boolean; pwHash?: string; stream?: boolean; manual?: boolean; mode?: 'rapido' | 'carreira'; deck?: DeckChoice; ligaFechada?: boolean; rivals?: number; rivalTeams?: string[] }
interface RoomInfo { id: string; code: string; host_id: string; max_players: number; status: string; game_state?: GS; updated_at?: string }
type OpenRoom = RoomInfo & { count: number }

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const PURPLE = '#7C3AED'
const PURPLE_DARK = '#5B21B6'
const RED = '#E8503A'
const CREAM = '#F4ECD6'
const OSWALD = { fontFamily: 'Oswald, sans-serif' }
function randCode() { return Math.random().toString(36).slice(2, 8).toUpperCase() }
// cor por usuário (estável pelo nome) — diferencia as mensagens de cada um.
// tons escuros o suficiente pra ler no balão branco.
const CHAT_COLORS = ['#7C3AED', '#E8503A', '#1B7A3D', '#2E6FB0', '#C77800', '#B23B8E', '#0E8A8A', '#B8860B']
function chatColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return CHAT_COLORS[h % CHAT_COLORS.length]
}

// 💬 Gaveta de chat da sala de espera — MESMO desenho do chat do leilão
// (ChatWidget): botão flutuante no canto + gaveta que sobe de baixo com a lista
// de mensagens (que ficam), a caixa de digitar e o crachá de não-lidas.
function LobbyChatDock({ open, setOpen, unread, msgs, myUid, listRef, onSend }: {
  open: boolean; setOpen: (o: boolean) => void; unread: number
  msgs: LobbyMsg[]; myUid?: string; listRef: React.RefObject<HTMLDivElement | null>; onSend: (t: string) => void
}) {
  const [text, setText] = useState('')
  const send = (t: string) => { onSend(t); setText('') }
  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Abrir chat da sala"
          style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 99990, width: 46, height: 46, borderRadius: 999, background: GOLD, border: '3px solid #000', display: 'grid', placeItems: 'center', fontSize: 20, boxShadow: '3px 3px 0 0 #000', cursor: 'pointer' }}>
          💬
          {unread > 0 && (
            <span style={{ position: 'absolute', top: -5, right: -4, background: RED, color: '#fff', border: '2px solid #000', borderRadius: 999, ...OSWALD, fontWeight: 900, fontSize: 10, minWidth: 17, height: 17, display: 'grid', placeItems: 'center', padding: '0 3px', lineHeight: 1 }}>{unread}</span>
          )}
        </button>
      )}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99991, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.28)' }} />
          <div style={{ position: 'relative', color: INK, background: '#FBF6E7', borderTop: `3px solid ${INK}`, borderRadius: '18px 18px 0 0', maxWidth: 460, width: '100%', margin: '0 auto', maxHeight: '64vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -6px 0 0 rgba(0,0,0,.12)' }}>
            <div style={{ background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px' }}>
              <span style={{ ...OSWALD, fontWeight: 900, textTransform: 'uppercase', fontSize: 14 }}>💬 Zoeira da sala</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar" style={{ width: 24, height: 24, borderRadius: 999, background: '#fff', color: '#000', border: '2px solid #000', ...OSWALD, fontWeight: 900, cursor: 'pointer' }}>✕</button>
            </div>
            <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 7, minHeight: 90 }}>
              {msgs.length === 0
                ? <p style={{ textAlign: 'center', color: '#8a7d59', fontWeight: 700, fontSize: 12, marginTop: 10 }}>Manda a primeira zoeira 😎</p>
                : msgs.map(m => {
                  const mine = !!myUid && m.uid === myUid
                  return (
                    <div key={m.id} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', flexDirection: mine ? 'row-reverse' : 'row' }}>
                      <span style={{ width: 11, height: 11, borderRadius: 999, border: '1.5px solid #000', background: chatColor(m.name), marginTop: 4, flexShrink: 0 }} />
                      <div style={{ background: mine ? '#FFF3D6' : '#fff', border: '2px solid #000', borderRadius: 11, padding: '4px 9px', boxShadow: '2px 2px 0 0 #000', maxWidth: '78%' }}>
                        <span style={{ ...OSWALD, fontWeight: 900, fontSize: 10, display: 'block', lineHeight: 1, color: chatColor(m.name) }}>{mine ? 'Você' : m.name}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600, wordBreak: 'break-word' }}>{m.text}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
            <div style={{ display: 'flex', gap: 6, padding: 9, borderTop: '2px solid #000', background: CREAM }}>
              <input value={text} onChange={e => setText(e.target.value)} maxLength={160}
                onKeyDown={e => { if (e.key === 'Enter') send(text) }} placeholder="manda a real…"
                style={{ flex: 1, minWidth: 0, color: INK, background: '#fff', border: '2px solid #000', borderRadius: 9, padding: '7px 10px', fontSize: 13, fontWeight: 600 }} />
              <button onClick={() => send(text)} disabled={!text.trim()} style={{ ...OSWALD, fontWeight: 900, fontSize: 13, background: text.trim() ? GREEN : '#cfc6ae', color: '#fff', border: '2px solid #000', borderRadius: 9, padding: '0 14px', boxShadow: '2px 2px 0 0 #000', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0 }}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Guarda a sala no aparelho: no celular, trocar de app (ex.: abrir o
// WhatsApp pra mandar o código) pode fazer o navegador descartar a aba da
// memória. Ao voltar, a página recarrega do zero e, sem isso, o código
// "some" — não porque saiu da sala, mas porque tudo que só existia em
// memória foi perdido. Com isso salvo, reconectamos sozinhos.
const LS_KEY = 'escalacao-room'
// código de convite guardado quando o amigo abriu a URL ?j=CODE — usado
// pra entrar automaticamente na sala depois de logar/cadastrar (ou já entrar
// direto se ele já estava logado). Some depois de consumido.
const INVITE_KEY = 'esc_invite_code'
function loadInvite(): string | null { try { return sessionStorage.getItem(INVITE_KEY) } catch { return null } }
function clearInvite() { try { sessionStorage.removeItem(INVITE_KEY) } catch { /* ignora */ } }
// hash da senha da sala — puro em JS (cyrb53), pra funcionar em QUALQUER navegador.
// Antes usava crypto.subtle (SHA-256), que não existe em alguns webviews de
// celular e travava a entrada. Não é segurança forte; é só pra fechar a sala.
function hashPw(text: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}
function saveRoom(id: string) { try { localStorage.setItem(LS_KEY, id) } catch { /* ignora */ } }
function clearSavedRoom() { try { localStorage.removeItem(LS_KEY) } catch { /* ignora */ } }
// 🔒 corta o nome da sala/técnico por CARACTERE de verdade (nunca parte um emoji no
// meio) e descarta qualquer "meio-emoji" solto. BUG REAL corrigido: o selo ' 👑🖋️' do
// Lenda/Fundador + o corte antigo em 24 (por code unit) deixava metade de emoji pra
// certos TAMANHOS de nome → o Postgres rejeitava como json inválido (PGRST102) e ALGUNS
// Lendas não conseguiam criar sala (dependia do comprimento do nome; por isso uns davam
// erro e outros não). Agora é à prova disso pra qualquer nome.
function cutName(s: string, n = 24): string {
  const cut = [...s].slice(0, n).join('') // itera por code point: emoji fica inteiro
  let out = ''
  for (let i = 0; i < cut.length; i++) {
    const c = cut.charCodeAt(i)
    if (c >= 0xD800 && c <= 0xDBFF) { // metade de cima de um emoji
      const nx = cut.charCodeAt(i + 1)
      if (nx >= 0xDC00 && nx <= 0xDFFF) { out += cut[i] + cut[i + 1]; i++ } // par completo: mantém
      // senão (surrogate órfão): descarta
    } else if (c >= 0xDC00 && c <= 0xDFFF) { /* metade de baixo órfã: descarta */ }
    else out += cut[i]
  }
  return out
}
function loadSavedRoom(): string | null { try { return localStorage.getItem(LS_KEY) } catch { return null } }
// salas que o técnico dispensou no "Sair da sala e começar uma nova": a faixa da
// home NÃO volta a aparecer pra elas (mesmo que ele ainda seja host/membro no
// banco — o save continua em "Minhas carreiras" pra retomar depois se quiser).
const DISMISS_KEY = 'esc-dismissed-rooms'
function loadDismissed(): string[] { try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]') } catch { return [] } }
function dismissRoom(id: string) { try { const a = loadDismissed(); if (!a.includes(id)) localStorage.setItem(DISMISS_KEY, JSON.stringify([...a, id].slice(-40))) } catch { /* ignora */ } }
function isRoomDismissed(id: string): boolean { return loadDismissed().includes(id) }

// Quando o backend (Supabase) está fora do ar — instabilidade da plataforma
// ou manutenção — o supabase-js devolve/estoura "Failed to fetch". Em vez de
// mostrar esse erro cru pro jogador, mostramos um aviso amigável.
function isBackendDown(msg: string): boolean {
  return /failed to fetch|networkerror|network request failed|load failed|fetch|502|503|504|timeout|unavailable/i.test(msg)
}
function friendlyAuthErr(msg: string): string {
  if (isBackendDown(msg)) return '🔧 Estamos atualizando novidades no jogo! O servidor volta já já — dá uma passadinha daqui a pouquinho. 💛'
  if (msg === 'Invalid login credentials') return 'Email ou senha incorretos.'
  if (/email not confirmed/i.test(msg)) return 'Confirme seu email antes de entrar (olha a caixa de entrada ✉️).'
  return msg
}

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
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user || !alive) return
      userRef.current = user
      const isLive = (rd: RoomInfo | null | undefined): rd is RoomInfo => {
        const gs = rd?.game_state as GS | undefined
        return !!rd && rd.game_state?.__game === GAME_TAG && rd.status === 'started'
          && !!gs && Array.isArray(gs.managers) && gs.managers.length > 0
          && !!gs.screen && gs.screen !== 'intro' && gs.screen !== 'lobby'
      }
      let rd: RoomInfo | null = null
      // 1) ponteiro local (rápido, sem consultar o resto do banco)
      const savedId = loadSavedRoom()
      if (savedId) {
        const { data } = await supabase.from('game_rooms').select('*').eq('id', savedId).maybeSingle()
        if (data && data.game_state?.__game !== GAME_TAG) clearSavedRoom()
        else if (isLive(data as RoomInfo)) rd = data as RoomInfo
      }
      // 2) sem ponteiro local (ex.: limpou o cache) → procura no banco uma sala
      //    'started' onde EU sou host OU membro. Assim o host não perde o "voltar".
      if (!rd) {
        const { data: mine } = await supabase.from('room_players').select('room_id').eq('user_id', user.id)
        const memberIds = [...new Set(((mine ?? []) as { room_id: string }[]).map(r => r.room_id))]
        const [hostedRes, memberRes] = await Promise.all([
          supabase.from('game_rooms').select('*').eq('host_id', user.id).eq('status', 'started').order('updated_at', { ascending: false }).limit(10),
          memberIds.length ? supabase.from('game_rooms').select('*').in('id', memberIds).eq('status', 'started').order('updated_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] as RoomInfo[] }),
        ])
        rd = [...((hostedRes.data ?? []) as RoomInfo[]), ...((memberRes.data ?? []) as RoomInfo[])]
          .filter(isLive)
          .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))[0] ?? null
      }
      if (!rd || !alive) return
      if (isRoomDismissed(rd.id)) return // dispensada no "sair e começar uma nova" — não reaparece
      // confirma que ainda sou um dos técnicos da sala. O HOST é dono do save
      // (host_id) e pode voltar mesmo sem vaga (ex.: apertou "sair da sala").
      const amHostHere = rd.host_id === user.id
      const { data: mySlot } = await supabase.from('room_players').select('user_id').eq('room_id', rd.id).eq('user_id', user.id).maybeSingle()
      if ((!mySlot && !amHostHere) || !alive) return
      saveRoom(rd.id) // reancora o ponteiro local pra próxima vez
      roomRef.current = rd
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
    const amHost = rd.host_id === user.id
    let myPl = sorted.find(p => p.user_id === user.id)
    if (!myPl && amHost) {
      // host tinha saído (vaga removida) — recria a vaga NO ASSENTO DELE. Antes era
      // sempre a vaga 0: se o host não era o técnico 0, ele voltava controlando o
      // time de OUTRO ("tô dando lance por alguém que não sou eu"). Acha o assento
      // pelo NOME do host nos managers do save; só cai no 0 se não achar.
      const mgrs = (gs?.managers ?? []) as { isHuman?: boolean; name?: string; id?: number }[]
      const dn = stripEmoji((user.user_metadata?.display_name as string | undefined) ?? '').trim()
      const mineMgr = (dn ? mgrs.find(m => m.isHuman && stripEmoji(m.name ?? '').trim() === dn) : undefined) ?? mgrs.find(m => m.isHuman)
      const seatIdx = mineMgr?.id ?? 0
      const nm = mineMgr?.name ?? 'Host'
      await supabase.from('room_players').insert({ room_id: rd.id, user_id: user.id, player_index: seatIdx, manager_name: nm, is_ready: true }).then(() => {}, () => {})
      myPl = { room_id: rd.id, user_id: user.id, player_index: seatIdx, manager_name: nm, is_ready: true } as RoomPlayer
    }
    if (!myPl) return
    saveRoom(rd.id)
    const inProgress = !!gs && Array.isArray(gs.managers) && gs.managers.length > 0
      && !!gs.screen && gs.screen !== 'intro' && gs.screen !== 'lobby'
    // a faixa só aparece pra partida EM ANDAMENTO → aqui sempre restauramos.
    // Nunca recomeçamos do zero (isso reconstruía o leilão e resetava a sala).
    if (inProgress) {
      // nunca restaura numa tela lateral (álbum/ranking) — cai sempre no jogo.
      const safeGs = (gs.screen === 'album' || gs.screen === 'ranking') ? { ...gs, screen: 'season' } : gs
      dispatch({ type: 'RESTORE_ONLINE', state: safeGs as EscState, roomId: rd.id, roomCode: rd.code, isHost: amHost, playerIndex: myPl.player_index })
    }
  }, [dispatch])

  // sair da sala salva: esconde a faixa. Em CARREIRA a vaga NÃO é removida (o
  // save é seu e persiste — "sair da sala" ≠ "remover sala"). Só no rápido libera.
  const leave = useCallback(async () => {
    const rd = roomRef.current, user = userRef.current
    const gs = rd?.game_state as GS | undefined
    const isCareer = gs?.mode === 'carreira' || (gs as { careerOnline?: boolean } | undefined)?.careerOnline
    try {
      if (rd && user && !isCareer) await supabase.from('room_players').delete().eq('room_id', rd.id).eq('user_id', user.id)
    } catch { /* silencioso */ }
    if (rd) dismissRoom(rd.id) // não deixa a faixa voltar (o save persiste em Minhas carreiras)
    clearSavedRoom()
    setInfo(null)
  }, [])

  return info ? { code: info.code, resume, leave } : null
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-1">{label}</p>
      <input {...props} className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm bg-white" />
    </div>
  )
}
// 🔑 campo de SENHA com botão de mostrar/ocultar (olho) — mesma cara do Field
function PwField({ label, value, onChange, onKeyDown, placeholder }: { label: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement>; onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-1">{label}</p>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
          className="w-full border-[3px] border-black rounded-lg px-3 py-2 font-black text-black text-sm bg-white" style={{ paddingRight: 44 }} />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 7, border: '2px solid #000', background: '#fff', fontSize: 15, lineHeight: 1, cursor: 'pointer' }}>
          {show ? '🙈' : '👁️'}
        </button>
      </div>
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

// ── criar sala reformulado: bloco com cabeçalho numerado ──
function Section({ num, title, icon, children }: { num: number; title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 p-3" style={{ background: '#1c1a16', borderColor: 'rgba(255,255,255,.14)' }}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="grid place-items-center rounded-md font-black" style={{ width: 20, height: 20, background: GOLD, color: '#000', fontSize: 12, ...OSWALD }}>{num}</span>
        <span className="font-black text-sm uppercase tracking-wide" style={OSWALD}>{title}</span>
        <span className="ml-auto text-[15px] opacity-60">{icon}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}
// rótulo + controle (mesmo estilo do Field)
function SegField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-1">{label}</p>
      {children}
    </div>
  )
}
// controle segmentado genérico (selecionado = dourado)
function Seg<T extends string | number | boolean>({ options, value, onSet, small, dim }: { options: [T, string][]; value: T; onSet: (v: T) => void; small?: boolean; dim?: boolean }) {
  return (
    <div className="flex border-[2.5px] border-black rounded-xl overflow-hidden" style={dim ? { opacity: 0.45 } : undefined}>
      {options.map(([v, label], i) => (
        <button key={String(v)} onClick={() => onSet(v)}
          className={`flex-1 font-black ${i > 0 ? 'border-l-[2.5px] border-black' : ''}`}
          style={{ padding: small ? '8px 2px' : '9px 2px', fontSize: small ? 11 : 12.5, background: value === v ? GOLD : '#fff', color: '#000', whiteSpace: 'nowrap', ...OSWALD }}>
          {label}
        </button>
      ))}
    </div>
  )
}
// chavinha (switch) liga/desliga
function Sw({ on }: { on: boolean }) {
  return (
    <span className="relative flex-none rounded-full" style={{ width: 44, height: 25, border: '2.5px solid #000', background: on ? GREEN : '#d9d2be', transition: '.15s' }}>
      <span className="absolute rounded-full" style={{ top: 1.5, left: on ? 20 : 2, width: 17, height: 17, background: on ? '#fff' : '#000', transition: '.15s' }} />
    </span>
  )
}
// linha com ícone + título + subtítulo + chavinha
function ToggleRow({ icon, title, sub, on, onClick }: { icon: string; title: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 w-full border-[2.5px] border-black rounded-xl px-3 py-2.5 text-left" style={{ background: '#fff', color: '#000' }}>
      <span className="text-lg leading-none">{icon}</span>
      <span className="flex-1 min-w-0">
        <b className="block font-black leading-tight" style={{ fontSize: 13.5, ...OSWALD }}>{title}</b>
        <small className="font-bold" style={{ fontSize: 10.5, color: 'rgba(0,0,0,.5)' }}>{sub}</small>
      </span>
      <Sw on={on} />
    </button>
  )
}

export function EscLobby() {
  const { dispatch } = useEsc()
  const [user, setUser] = useState<User | null>(null)
  const [phase, setPhase] = useState<Phase>('auth')
  const [authTab, setAuthTab] = useState<AuthTab>(() => {
    // veio do aviso "ganhe uma carta" (home/setup)? já abre no Cadastrar
    try { if (localStorage.getItem('esc_open_register')) { localStorage.removeItem('esc_open_register'); return 'register' } } catch { /* ignora */ }
    return 'login'
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recovering, setRecovering] = useState(false) // 🔑 voltou pelo link de "esqueci a senha" → tela de nova senha
  // 🔑 trava da redefinição: o link de recuperação dispara TAMBÉM o evento de
  // "logou" (ordem varia), que jogava a pessoa pro MENU por cima da tela de nova
  // senha ("cliquei em redefinir e só voltou pro site"). Enquanto a trava está
  // de pé, NADA muda de tela — só o botão "Salvar nova senha" solta.
  const recoveringRef = useRef(false)
  const startRecovery = useCallback(() => { recoveringRef.current = true; setRecovering(true); setPhase('auth') }, [])
  const [newPw, setNewPw] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const canCareer = useCanCareerOnline()
  const [roomMode, setRoomMode] = useState<'rapido' | 'carreira'>('rapido')
  const careerDeck: DeckChoice = 'both' // carreira: sempre BR + Europa juntos (preenche os 80 times das 4 divisões)
  const [rapidoDeck, setRapidoDeck] = useState<DeckChoice>('br') // rápido online: host escolhe o baralho (BR / Europa / os dois)
  const [rapidoVarzea, setRapidoVarzea] = useState(false) // 🥅 rápido online + BR: categoria "Sem craques" (várzea) — só bom jogador + foi profissional
  const [rapidoCopaMode, setRapidoCopaMode] = useState<'liga' | 'liga_copa'>('liga_copa') // 🏆 rápido online: liga só, ou liga + Copa dos 8 no fim (padrão)
  const [ligaFechada, setLigaFechada] = useState(false) // 🏆 liga só com a galera (sem bots) — só quem tem Lenda cria
  // 🌐 CARREIRA ONLINE: o host escolhe os rivais CPU do leilão (igual offline).
  // Quantidade + quais times da Série D (vazio = padrões).
  const [careerRivals, setCareerRivals] = useState(5)
  const [careerRivalPicks, setCareerRivalPicks] = useState<string[]>([])
  const toggleCareerRival = (team: string) => setCareerRivalPicks(prev => {
    if (prev.includes(team)) return prev.filter(t => t !== team)
    const next = [...prev, team]
    return next.length > careerRivals ? next.slice(next.length - careerRivals) : next
  })
  const canLiga = myApoioPerk()?.tier === 'ouro' // 👑 criar Liga Fechada é benefício do Lenda
  // 🏆 Liga Fechada ainda NÃO liberada: esconde o seletor da tela de criar sala
  // (o Diego decide quando abrir). Toda sala nasce Aberta. Pra liberar de novo,
  // basta trocar pra `true` — o resto do código continua pronto.
  const LIGA_FECHADA_LIBERADA = false
  const [joinCode, setJoinCode] = useState('')
  const [formation, setFormation] = useState<FormationKey>('4-3-3')
  const [roomName, setRoomName] = useState('')
  const [roomLocked, setRoomLocked] = useState(false)  // sala fechada (com senha)
  const [roomPw, setRoomPw] = useState('')
  const [roomStream, setRoomStream] = useState(false)  // modo stream (esconde valores)
  const [streamModal, setStreamModal] = useState(false) // caixa explicando o modo stream
  const [roomManual, setRoomManual] = useState(false)  // 🎮 modo manual: host controla o ritmo (auto = padrão)
  const [roomChat, setRoomChat] = useState(true)  // 💬 chat da sala: o host decide na criação (padrão = ligado)
  const [auctionSecs, setAuctionSecs] = useState(45) // ⏱️ tempo do leilão: 45 (padrão), outro nº, ou 0 = host avança no botão
  const [pwModal, setPwModal] = useState<RoomInfo | null>(null) // pedindo senha pra entrar
  const [pwEntry, setPwEntry] = useState('')
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [isHost, setIsHost] = useState(false)
  const [roomError, setRoomError] = useState('')
  const [resumeRoom, setResumeRoom] = useState<RoomInfo | null>(null) // partida em andamento: pergunta voltar/sair
  const [myCareers, setMyCareers] = useState<OpenRoom[]>([]) // saves de carreira online do host (só do criador)
  const [resumingCareer, setResumingCareer] = useState<OpenRoom | null>(null) // painel "continuar carreira" com as 3 opções do amigo faltando
  // salas abertas (lista pública)
  const [tab, setTab] = useState<'create' | 'open' | 'join'>('open')
  const [openRooms, setOpenRooms] = useState<OpenRoom[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [search, setSearch] = useState('')
  // edição rápida do nome de técnico (na home)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  // 💬 CHAT DA SALA DE ESPERA: igual ao chat do leilão — mensagens que FICAM
  // (lista rolável, não somem), caixa pra digitar e as frases prontas. Trafegado
  // por broadcast no MESMO canal realtime da sala (esclobby). Badge de não-lidas
  // por usuário (zera ao abrir a gaveta).
  const [lobbyChat, setLobbyChat] = useState<LobbyMsg[]>([])
  const [lobbyChatOpen, setLobbyChatOpen] = useState(false)
  const [lobbyUnread, setLobbyUnread] = useState(0)
  const [hostLeft, setHostLeft] = useState(false) // 👑 host saiu da sala de espera → banner e volta pro menu
  const lobbyOpenRef = useRef(false)
  const lobbyListRef = useRef<HTMLDivElement>(null)
  const lobbyChanRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const addLobbyChat = useCallback((e: LobbyMsg, mine: boolean) => {
    setLobbyChat(prev => prev.some(x => x.id === e.id) ? prev : [...prev.slice(-60), e])
    if (!mine && !lobbyOpenRef.current) setLobbyUnread(u => Math.min(99, u + 1))
  }, [])
  const openLobbyChat = (open: boolean) => {
    lobbyOpenRef.current = open; setLobbyChatOpen(open)
    if (open) setLobbyUnread(0)
  }
  const sendLobbyChat = (text: string) => {
    const t = cutName(text.trim(), 160) // corte seguro (não parte emoji → nada de json inválido)
    if (!t) return
    const myName = players.find(p => p.user_id === user?.id)?.manager_name ?? 'Você'
    const e: LobbyMsg = { id: Math.random().toString(36).slice(2), uid: user?.id ?? 'me', name: myName, text: t }
    addLobbyChat(e, true) // mostra o meu na hora (o canal não devolve o próprio broadcast)
    // manda em 'chat' (persistente) e 'emote' (clientes antigos ainda enxergam).
    lobbyChanRef.current?.send({ type: 'broadcast', event: 'chat', payload: e })
    lobbyChanRef.current?.send({ type: 'broadcast', event: 'emote', payload: e })
  }
  // 🎈 zoeira que FLUTUA (não entra no chat): sobe na tela e some, pra todos da sala.
  const [lobbyFloats, setLobbyFloats] = useState<LobbyFloat[]>([])
  const addLobbyFloat = useCallback((f: LobbyFloat) => {
    setLobbyFloats(prev => prev.some(x => x.id === f.id) ? prev : [...prev.slice(-10), f])
    window.setTimeout(() => setLobbyFloats(prev => prev.filter(x => x.id !== f.id)), 3000)
  }, [])
  const sendLobbyFloat = (emoji: string, text?: string) => {
    const myName = players.find(p => p.user_id === user?.id)?.manager_name ?? 'Você'
    const f: LobbyFloat = { id: Math.random().toString(36).slice(2), emoji, text, name: myName, x: 14 + Math.random() * 62 }
    addLobbyFloat(f) // mostra o meu na hora (o canal não devolve o próprio broadcast)
    lobbyChanRef.current?.send({ type: 'broadcast', event: 'float', payload: f })
  }
  // 📞 BUZINA DA ZOEIRA (v1, sala de espera): áudio de meme que toca pra SALA
  // INTEIRA. Regras anti-bagunça: (1) UM som por vez na sala — chegou outro no
  // meio, é descartado (sem fila: som atrasado confunde); (2) cooldown de 30s
  // POR PESSOA (o botão mostra a contagem); (3) sempre com assinatura flutuante
  // de quem mandou. Fora do reducer/jogo — zero impacto em qualquer partida.
  const SFX_COOLDOWN_S = 30
  const sfxPlayingRef = useRef(false)
  const sfxLastRef = useRef(0)
  const [sfxCoolLeft, setSfxCoolLeft] = useState(0)
  useEffect(() => {
    if (sfxCoolLeft <= 0) return
    const t = setTimeout(() => setSfxCoolLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [sfxCoolLeft])
  const playSfx = useCallback((fromName: string, key = 'ligar') => {
    // cardápio da buzina: arquivo, duração (trava) e o balão de assinatura
    const lib: Record<string, { file: string; dur: number; emoji: string; balao: string }> = {
      ligar: { file: 'posso-te-ligar.mp3', dur: 9000, emoji: '📞', balao: 'mandou: "Posso te ligar agora?" 🔊' },
      meme2: { file: 'meme2.mp3', dur: 17000, emoji: '🎙️', balao: 'soltou AQUELE áudio 🔊' },
      siuu: { file: 'siuu.mp3', dur: 3000, emoji: '🗣️', balao: 'gritou SIIIIUUU! 🔊' },
      novo5: { file: 'myinstants5.mp3', dur: 6000, emoji: '🔊', balao: 'soltou um áudio novo 🔊' },
    }
    const s = lib[key] ?? lib.ligar
    if (sfxPlayingRef.current) return // um som por vez na sala
    sfxPlayingRef.current = true
    // 🔇 respeita o MUDO do jogo (o alto-falante do canto): quem silenciou vê o
    // balão da zoeira, mas não ouve nada. A trava de "um por vez" segue igual
    // pra manter o ritmo da sala sincronizado.
    if (!isMuted()) {
      try {
        const a = new Audio(`${import.meta.env.BASE_URL}sfx/${s.file}`)
        a.onended = () => { sfxPlayingRef.current = false }
        a.onerror = () => { sfxPlayingRef.current = false }
        a.play().catch(() => { sfxPlayingRef.current = false }) // autoplay bloqueado: falha em silêncio
      } catch { sfxPlayingRef.current = false }
    }
    window.setTimeout(() => { sfxPlayingRef.current = false }, s.dur) // trava de segurança (e janela do mudo)
    addLobbyFloat({ id: Math.random().toString(36).slice(2), emoji: s.emoji, text: s.balao, name: fromName, x: 14 + Math.random() * 62 })
  }, [addLobbyFloat])
  const sendSfx = (key: string) => {
    if (sfxPlayingRef.current || Date.now() - sfxLastRef.current < SFX_COOLDOWN_S * 1000) return
    sfxLastRef.current = Date.now(); setSfxCoolLeft(SFX_COOLDOWN_S)
    const myName = players.find(p => p.user_id === user?.id)?.manager_name ?? 'Você'
    lobbyChanRef.current?.send({ type: 'broadcast', event: 'sfx', payload: { name: myName, key } })
    playSfx(myName, key) // o canal não devolve o próprio broadcast — toca local também
  }

  useEffect(() => {
    // 🔑 o link do e-mail traz a marca de recuperação na URL (hash no fluxo
    // clássico, query no PKCE) — detecta JÁ no carregamento, antes de qualquer
    // evento, e arma a trava. Sem isso, dependia só do evento (que se perde).
    try {
      const marca = `${window.location.hash} ${window.location.search}`
      if (marca.includes('type=recovery')) startRecovery()
    } catch { /* ignora */ }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u); if (u && !recoveringRef.current) setPhase('menu')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      // 🔑 voltou pelo link de redefinição: NÃO cai no menu — abre a tela de nova senha
      if (event === 'PASSWORD_RECOVERY') { setUser(u); startRecovery(); return }
      setUser(u); if (u && !recoveringRef.current) setPhase('menu')
    })
    return () => subscription.unsubscribe()
  }, [startRecovery])

  // Reconecta sozinho se a página recarregou com uma sala salva (ex.: o
  // navegador descartou a aba ao trocar pro WhatsApp e voltar).
  // Também consome o código de convite (?j=CODE) e entra na sala automaticamente
  // — para quem já estava logado (0 clique) e para quem acabou de se cadastrar.
  useEffect(() => {
    if (!user || recoveringRef.current) return // 🔑 redefinindo senha: nada de navegar
    const invite = loadInvite()
    if (invite) {
      ;(async () => {
        const { data: rd } = await supabase.from('game_rooms').select('*').eq('code', invite).maybeSingle()
        if (!rd || rd.game_state?.__game !== GAME_TAG) { clearInvite(); return }
        clearInvite()
        setLoading(true)
        await enterRoom(rd as RoomInfo)
      })()
      return
    }
    const savedId = loadSavedRoom()
    if (!savedId) return
    ;(async () => {
      const rd = (await supabase.from('game_rooms').select('*').eq('id', savedId).maybeSingle()).data
      if (!rd || rd.game_state?.__game !== GAME_TAG) { clearSavedRoom(); return }
      if (rd.status === 'started') {
        // partida em andamento: NÃO entra direto. Confirma que ainda sou da
        // sala e mostra a pergunta "voltar pra partida ou sair" no menu.
        const { data: mySlot } = await supabase.from('room_players').select('user_id').eq('room_id', rd.id).eq('user_id', user.id).maybeSingle()
        if (!mySlot) { clearSavedRoom(); return }
        setResumeRoom(rd)
        return
      }
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

  // saves de carreira online do host: carrega ao abrir o menu
  useEffect(() => {
    if (phase !== 'menu' || !user) return
    fetchMyCareers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, user])

  // carrega a lista ao abrir "Salas abertas" e ATUALIZA sozinha a cada 5s —
  // assim uma sala criada agora aparece pra galera sem precisar apertar nada.
  useEffect(() => {
    if (phase !== 'menu' || tab !== 'open') return
    fetchOpenRooms()
    const iv = setInterval(() => fetchOpenRooms(true), 5000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tab])

  useEffect(() => {
    if (!room) return
    // 💾 hidrata o histórico salvo NESTE aparelho: o broadcast é só ao vivo, então
    // sem isso trocar de app / recarregar zerava o chat. Guardamos por sala.
    try {
      const raw = localStorage.getItem(`esc-lobbychat-${room.id}`)
      const arr = raw ? JSON.parse(raw) as LobbyMsg[] : []
      setLobbyChat(Array.isArray(arr) ? arr : [])
    } catch { setLobbyChat([]) }
    setLobbyUnread(0)
    fetchPlayers(room.id)
    const ch = supabase.channel(`esclobby:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` }, () => fetchPlayers(room.id))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${room.id}` },
        ({ new: r }: { new: RoomInfo }) => {
          if (r.status === 'started') { triggerStart(r); return }
          setRoom(prev => prev && prev.id === r.id ? { ...prev, host_id: r.host_id } : prev)
        })
      // 👑 host saiu → a sala é encerrada: banner + volta pro menu (broadcast é o
      // aviso na hora; a exclusão da sala é a rede de segurança).
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'game_rooms', filter: `id=eq.${room.id}` }, () => setHostLeft(true))
      .on('broadcast', { event: 'host_left' }, () => setHostLeft(true))
      .on('broadcast', { event: 'chat' }, ({ payload }: { payload: LobbyMsg }) => addLobbyChat(payload, false))
      .on('broadcast', { event: 'emote' }, ({ payload }: { payload: LobbyMsg }) => addLobbyChat(payload, false))
      .on('broadcast', { event: 'float' }, ({ payload }: { payload: LobbyFloat }) => addLobbyFloat(payload))
      // 📞 buzina: toca o meme pra sala toda (um por vez; regra no playSfx)
      .on('broadcast', { event: 'sfx' }, ({ payload }: { payload: { name: string; key?: string } }) => playSfx(payload?.name ?? 'Alguém', payload?.key ?? 'ligar'))
      .subscribe()
    lobbyChanRef.current = ch
    return () => { ch.unsubscribe(); lobbyChanRef.current = null }
  }, [room?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // rola pro fim quando chega mensagem nova (com a gaveta aberta)
  useEffect(() => {
    if (lobbyChatOpen && lobbyListRef.current) lobbyListRef.current.scrollTop = lobbyListRef.current.scrollHeight
  }, [lobbyChat, lobbyChatOpen])

  // 💾 salva o histórico do chat da sala NESTE aparelho (sobrevive a recarregar)
  useEffect(() => {
    if (!room || lobbyChat.length === 0) return // não sobrescreve o salvo com o vazio inicial
    try { localStorage.setItem(`esc-lobbychat-${room.id}`, JSON.stringify(lobbyChat.slice(-60))) } catch { /* ignora */ }
  }, [lobbyChat, room])

  async function fetchPlayers(roomId: string) {
    const { data } = await supabase.from('room_players').select('*').eq('room_id', roomId).order('player_index')
    if (data) setPlayers(data as RoomPlayer[])
  }

  // fui removido pelo host na sala de espera? sumi da lista (mas não sou o host
  // e a lista já carregou) → volto sozinho pro menu com um aviso.
  useEffect(() => {
    if (phase !== 'waiting' || !room || !user || isHost) return
    if (players.length === 0) return // lista ainda não carregou
    if (players.some(p => p.user_id === user.id)) return
    clearSavedRoom()
    setRoom(null); setPlayers([]); setPhase('menu')
    setTimeout(() => { try { alert('O host removeu você da sala.') } catch { /* ignora */ } }, 0)
  }, [players, phase, room, user, isHost])

  // 🛟 REDE DE SEGURANÇA CONTRA TELA PRETA: se a fase for "waiting" mas a sala
  // sumiu (host encerrou, sala apagada, restauração falhou), o app renderizava
  // NULL — só o rodapé num fundo escuro, travado (o bug relatado). Agora volta
  // sozinho pro menu depois de alguns segundos.
  useEffect(() => {
    if (phase !== 'waiting' || room) return
    const t = setTimeout(() => { clearSavedRoom(); setPhase('menu') }, 3500)
    return () => clearTimeout(t)
  }, [phase, room])

  // 👑 BATIMENTO DO HOST NA SALA DE ESPERA: enquanto o host está no lobby, grava
  // updated_at a cada 30s. É o sinal de "host vivo" — sem ele, um host que CAI
  // (fechou o app / perdeu sinal, sem apertar "sair") deixaria a sala presa pra
  // sempre. Os convidados vigiam esse batimento (efeito abaixo) e a lista de
  // Salas Abertas também usa ele pra sumir com sala sem dono.
  useEffect(() => {
    if (phase !== 'waiting' || !room || !isHost) return
    const beat = () => supabase.from('game_rooms').update({ updated_at: new Date().toISOString() }).eq('id', room.id).then(() => {}, () => {})
    beat()
    const iv = setInterval(beat, 30_000)
    return () => clearInterval(iv)
  }, [phase, room, isHost])

  // 🛟 HOST CAIU SEM AVISAR: o convidado vigia o batimento do host na sala de
  // espera. Se a sala sumiu (host apertou "sair" e apagou) → banner na hora. Se o
  // batimento parou há mais de 3 min (host travou/caiu) → encerra a sala e mostra
  // o banner. 3 min de folga pra NUNCA fechar por uma piscada de conexão. A saída
  // LIMPA do host já dispara host_left instantâneo; isto é a rede pro acidente.
  useEffect(() => {
    if (phase !== 'waiting' || !room || isHost) return
    const check = async () => {
      const { data } = await supabase.from('game_rooms').select('updated_at').eq('id', room.id).maybeSingle()
      if (!data) { setHostLeft(true); return } // sala já foi encerrada pelo host
      const beat = data.updated_at ? new Date(data.updated_at).getTime() : 0
      if (beat && Date.now() - beat > 180_000) {
        await supabase.from('room_players').delete().eq('room_id', room.id).then(() => {}, () => {})
        await supabase.from('game_rooms').delete().eq('id', room.id).then(() => {}, () => {})
        setHostLeft(true)
      }
    }
    const iv = setInterval(check, 30_000)
    return () => clearInterval(iv)
  }, [phase, room, isHost])

  // Busca a lista de jogadores DIRETO do banco (não confia em estado local
  // que pode estar vazio/desatualizado, ex.: logo após reconectar) — usar
  // uma lista errada aqui faz o jogo montar o time errado como "você".
  // allowFresh=false (reconexão por recarregar a página): SÓ restaura; nunca
  // recomeça do zero. Recomeçar como host reconstrói o leilão e, por ser
  // autoritativo, arrasta todo mundo pro início — o bug relatado. O início de
  // verdade (waiting→started) vem do evento realtime, com allowFresh=true.
  // Devolve true se conseguiu entrar (restaurou ou começou).
  async function triggerStart(roomData: RoomInfo, allowFresh = true): Promise<boolean> {
    if (!user) return false
    // pega o estado salvo MAIS recente (não confia no payload do evento, que
    // pode vir defasado) — é o que permite retomar a partida na reconexão.
    const { data: freshRoom } = await supabase.from('game_rooms').select('game_state').eq('id', roomData.id).maybeSingle()
    const gs = (freshRoom?.game_state ?? roomData.game_state) as GS | undefined
    // 🔒 TRAVA (listas magras): se o fetch do estado FRESCO falhou e a linha só tem
    // o mini-estado da lista (sem managers), NÃO segue — seguir cairia no "começa
    // do zero" e resetaria a partida de todo mundo. Melhor falhar e tentar de novo.
    if (!freshRoom?.game_state && !(gs && Array.isArray((gs as GS).managers))) return false
    const { data: allPlayers } = await supabase.from('room_players').select('*').eq('room_id', roomData.id).order('player_index')
    const sorted = (allPlayers ?? []) as RoomPlayer[]
    const myPl = sorted.find(p => p.user_id === user.id)
    if (!myPl) return false
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
      // TRAVA anti-"vestir bot": só assume a partida se ela tem um técnico
      // HUMANO com o SEU número. Sem isso, quem entrava na sala no exato
      // segundo do início ganhava um índice que não existia no jogo e virava
      // um bot de preenchimento (time completo, 💰 0) — bug do Red Bull Diet.
      const mineMgr = (gs as EscState).managers.find(m => m.id === myPl.player_index)
      if (!mineMgr || !mineMgr.isHuman) {
        await supabase.from('room_players').delete().eq('room_id', roomData.id).eq('user_id', user.id).then(() => {}, () => {})
        clearSavedRoom()
        setRoom(null); setPlayers([]); setPhase('menu')
        setRoomError('⏱️ Essa partida começou sem você (entrou bem na hora do início). Espera o host chamar no "Jogar de novo" ou entra em outra sala.')
        return true // já navegou (pro menu, com aviso) — não fica re-tentando
      }
      dispatch({
        type: 'RESTORE_ONLINE',
        state: gs as EscState,
        roomId: roomData.id, roomCode: roomData.code,
        isHost: amHost, playerIndex: myPl.player_index,
      })
      return true
    }
    if (!allowFresh) return false // reconexão sem estado salvo ainda: não recomeça
    // SEGURANÇA (mesmo se uma vaga duplicada escapou): um assento por usuário.
    // Deduplica de forma DETERMINÍSTICA (mesma ordem em todo cliente) e usa a
    // POSIÇÃO na lista como número do técnico — o time é montado pela posição, não
    // pelo índice cru do banco. Assim ninguém vira dois times nem "veste" o assento
    // errado. No caso normal (host já limpou) isto não muda nada.
    const seenU = new Set<string>()
    const uniq = sorted.filter(p => (seenU.has(p.user_id) ? false : (seenU.add(p.user_id), true)))
    const myPos = uniq.findIndex(p => p.user_id === user.id)
    dispatch({
      type: 'START_ONLINE',
      roomId: roomData.id, roomCode: roomData.code,
      roomName: gs?.roomName,
      isHost: amHost,
      playerIndex: myPos >= 0 ? myPos : myPl.player_index,
      playerNames: uniq.map(p => p.manager_name),
      formation: gs?.formation ?? '4-3-3',
      stream: !!gs?.stream,
      manual: !!gs?.manual, // 🎮 sala manual: host controla o ritmo (botão manual/auto no jogo)
      chatOff: !!gs?.chatOff, // 💬 chat ligado/desligado (escolha do host na criação)
      auctionSecs: gs?.auctionSecs, // ⏱️ tempo do leilão (undefined=45s · N=N seg · 0=host avança)
      deck: gs?.deck ?? 'br', // carreira = 'both'; rápido = escolha do host (br/eu/both)
      varzea: !!gs?.varzea, // 🥅 rápido + BR, categoria "Sem craques" (só bom jogador + foi profissional)
      career: gs?.mode === 'carreira',
      rivals: gs?.rivals, // 🌐 carreira online: nº de rivais CPU no leilão (escolha do host)
      rivalTeams: gs?.rivalTeams, // 🌐 carreira online: times da Série D escolhidos como rivais
      ligaFechada: !!(gs as GS & { ligaFechada?: boolean })?.ligaFechada, // 🏆 liga só com a galera, sem bots
      locked: gs?.locked, pwHash: gs?.pwHash, // preserva a senha da sala pelo autosave
      copaMode: gs?.copaMode, // 🏆 rápido: liga só ou liga + Copa dos 8 (escolha do host na criação)
    })
    return true
  }

  // "Voltar pra partida": só restaura (nunca recomeça). Tenta algumas vezes
  // caso o estado do host ainda esteja chegando ao banco.
  async function doResume() {
    if (!resumeRoom) return
    setLoading(true); setRoomError('')
    try {
      let rd = resumeRoom
      for (let i = 0; i < 5; i++) {
        if (await triggerStart(rd, false)) return // navegou pra partida — ok
        await new Promise(r => setTimeout(r, 800))
        const again = (await supabase.from('game_rooms').select('*').eq('id', rd.id).maybeSingle()).data
        if (again) rd = again as RoomInfo
      }
      setRoomError('Não consegui retomar a partida agora. Tente de novo em instantes.')
    } catch {
      // erro de rede (backend fora): não trava o loading — libera pra poder sair
      setRoomError('Servidor instável agora. Tente de novo, ou toque em "Sair da sala".')
    } finally {
      setLoading(false) // NUNCA deixa o loading preso (senão o botão Sair fica desabilitado)
    }
  }
  // "Sair da sala": libera a vaga e limpa — aí pode começar/entrar noutra.
  async function leaveResume() {
    // sempre libera localmente, mesmo se algo falhar — o técnico nunca fica preso.
    const gs = resumeRoom?.game_state as GS | undefined
    const isCareer = gs?.mode === 'carreira' || (gs as { careerOnline?: boolean } | undefined)?.careerOnline
    try {
      // carreira: NÃO remove a vaga (o save persiste em "Minhas carreiras"); só
      // some a faixa. Rápido libera a vaga.
      if (resumeRoom && user && !isCareer) await supabase.from('room_players').delete().eq('room_id', resumeRoom.id).eq('user_id', user.id)
    } catch { /* mesmo se o backend falhar, libera localmente */ }
    clearSavedRoom()
    setResumeRoom(null)
    setLoading(false) // destrava qualquer loading preso (ex.: um "voltar" que falhou)
  }
  // Compartilha o link de convite (?j=CODE) — abre o menu nativo do celular
  // (WhatsApp/Telegram/etc). Fallback: copia pro clipboard.
  const [shareOk, setShareOk] = useState<'link' | 'code' | null>(null)
  async function shareInvite(code: string, roomName?: string) {
    const url = `${window.location.origin}${window.location.pathname}?j=${code}`
    const text = `🔨 Te desafio no Leilão Legends! Entre na sala ${roomName ? `"${roomName}" ` : ''}(${code}):\n${url}`
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (typeof nav.share === 'function') {
      try { await nav.share({ title: 'Leilão Legends', text, url }); return } catch { /* usuário cancelou ou não suporta */ }
    }
    try { await navigator.clipboard.writeText(url); setShareOk('link'); setTimeout(() => setShareOk(null), 2000) } catch { /* ignora */ }
  }
  async function copyCode(code: string) {
    try { await navigator.clipboard.writeText(code); setShareOk('code'); setTimeout(() => setShareOk(null), 2000) } catch { /* ignora */ }
  }

  // selo de apoio (👑/⭐/💎) entra colado no nome — aparece pra TODO MUNDO na
  // sala e dentro do jogo, porque o manager_name é o que os outros veem.
  const nameOf = () => stripEmoji(user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Técnico').trim() + apoioSelo()

  // salva o nome de técnico (display_name) — usado no chip de edição rápida
  async function saveName() {
    const nm = stripEmoji(nameDraft).trim()
    if (!nm) return
    setLoading(true)
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: nm } })
    if (!error && data.user) setUser(data.user)
    setEditingName(false); setLoading(false)
  }

  async function handleAuth() {
    setLoading(true); setAuthError('')
    try {
      if (authTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setAuthError(friendlyAuthErr(error.message))
      } else {
        if (!displayName.trim()) { setAuthError('Escolha um nome de técnico.'); setLoading(false); return }
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: stripEmoji(displayName).trim() } } })
        setAuthError(error ? friendlyAuthErr(error.message) : '✉️ Verifique seu email pra confirmar o cadastro.')
      }
    } catch (e) {
      // erro de rede que estourou como exceção (backend fora) — trata igual
      setAuthError(friendlyAuthErr(e instanceof Error ? e.message : String(e)))
    }
    setLoading(false)
  }

  // 🔑 ESQUECI A SENHA: manda o email de redefinição pro endereço digitado.
  async function handleForgot() {
    const em = email.trim().toLowerCase()
    if (!em) { setAuthError('Digite seu email aí em cima primeiro — aí eu mando o link de redefinição.'); return }
    setLoading(true); setAuthError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin + window.location.pathname })
      setAuthError(error ? friendlyAuthErr(error.message) : '✉️ Enviei um link pro seu email pra criar uma senha nova. Confere a caixa de entrada (e o spam).')
    } catch (e) {
      setAuthError(friendlyAuthErr(e instanceof Error ? e.message : String(e)))
    }
    setLoading(false)
  }

  // 🔑 salva a nova senha (depois de voltar pelo link de redefinição)
  async function handleSaveNewPw() {
    if (newPw.length < 6) { setAuthError('A senha precisa de pelo menos 6 caracteres.'); return }
    setLoading(true); setAuthError('')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) { setAuthError(friendlyAuthErr(error.message)); setLoading(false); return }
      setNewPw(''); setRecovering(false); recoveringRef.current = false; setAuthError(''); setPhase('menu')
    } catch (e) {
      setAuthError(friendlyAuthErr(e instanceof Error ? e.message : String(e)))
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
    const name = cutName(roomName.trim() || `Sala do ${nameOf()}`)
    // sala fechada: exige uma senha
    if (roomLocked && !roomPw.trim()) { setRoomError('Digite uma senha ou desmarque "sala fechada".'); setLoading(false); return }
    const locked = roomLocked && !!roomPw.trim()
    const pwHash = locked ? hashPw(roomPw.trim().toLowerCase()) : undefined // sem diferenciar maiúsculas
    const carreira = canCareer && roomMode === 'carreira'
    const gs = { __game: GAME_TAG, formation, roomName: name, ...(locked ? { locked: true, pwHash } : {}), ...(roomStream ? { stream: true } : {}), ...((roomManual && !carreira) ? { manual: true } : {}), ...(roomChat ? {} : { chatOff: true }), ...(roomStream && auctionSecs !== 45 ? { auctionSecs } : {}), ...(carreira ? { mode: 'carreira', deck: careerDeck, rivals: careerRivals, rivalTeams: careerRivalPicks } : { deck: rapidoDeck, copaMode: rapidoCopaMode, ...(rapidoDeck === 'br' && rapidoVarzea ? { varzea: true } : {}), ...(canLiga && ligaFechada ? { ligaFechada: true } : {}) }) }
    const { data: rd, error: re } = await supabase.from('game_rooms')
      .insert({ code, host_id: user.id, mode: 'leilao', status: 'waiting', max_players: MAX_PLAYERS, game_state: gs })
      .select().single()
    if (re || !rd) {
      // 🔎 mostra a CAUSA real (antes era só "Erro ao criar sala." e a gente ficava no
      // escuro). O código do Postgres/PostgREST diz na hora o que houve — 42501 = RLS
      // (sem permissão), PGRST116 = criou mas não deixou ler de volta (RLS de leitura),
      // 23505 = código repetido. Assim dá pra consertar a trava certa sem adivinhar.
      console.error('[createRoom] falhou:', re)
      const code2 = re?.code
      const hint = code2 === '42501' ? 'sem permissão (RLS). Avise o Diego.'
        : code2 === 'PGRST116' ? 'a sala foi criada mas o app não pôde lê-la de volta (RLS de leitura). Avise o Diego.'
        : code2 === '23505' ? 'código repetido — tente de novo.'
        : (re?.message || 'tente de novo em instantes.')
      setRoomError(`Erro ao criar sala: ${hint}${code2 ? ` [${code2}]` : ''}`)
      setLoading(false); return
    }
    await supabase.from('room_players').insert({ room_id: rd.id, user_id: user.id, player_index: 0, manager_name: nameOf(), is_ready: true })
    saveRoom(rd.id)
    setRoom(rd); setIsHost(true); setPhase('waiting'); setLoading(false)
  }

  // lista pública de salas: as esperando gente (waiting) E as com jogo já
  // rolando (started) — pra galera ver que a sala tá viva mesmo depois de
  // começar o pregão. `silent` = atualização automática (não mostra o
  // "Carregando…" pra não piscar a cada 5s).
  async function fetchOpenRooms(silent = false) {
    if (!silent) setListLoading(true)
    // só salas recentes: uma sala de horas atrás é sala abandonada
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    // 🪶 LISTA MAGRA (03/08): NÃO baixa o game_state inteiro (podia ser MBs por
    // sala × 50 salas × refresh de 5s × cada pessoa na aba — era o nº 1 de
    // egress/lentidão). Puxa SÓ os campinhos que a lista mostra, via ->> do
    // JSON, e remonta um mini game_state. Quem ENTRA numa sala busca o estado
    // completo na hora (triggerStart/enterLoadedRoom já refetcham).
    const { data: rooms } = await supabase.from('game_rooms')
      .select('id, code, host_id, max_players, status, updated_at, gname:game_state->>roomName, gdeck:game_state->>deck, gvarzea:game_state->>varzea, gmode:game_state->>mode, gcareer:game_state->>careerOnline, gmanual:game_state->>manual, gcopa:game_state->>copaMode, gliga:game_state->>ligaFechada, glocked:game_state->>locked, gstream:game_state->>stream, gpw:game_state->>pwHash, gchat:game_state->>chatOff')
      .in('status', ['waiting', 'started'])
      .eq('game_state->>__game', GAME_TAG)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50)
    type SlimRow = { id: string; code: string; host_id: string; max_players: number; status: string; updated_at?: string; gname: string | null; gdeck: string | null; gvarzea: string | null; gmode: string | null; gcareer: string | null; gmanual: string | null; gcopa: string | null; gliga: string | null; glocked: string | null; gstream: string | null; gpw: string | null; gchat: string | null }
    const list: RoomInfo[] = ((rooms ?? []) as unknown as SlimRow[]).map(r => ({
      id: r.id, code: r.code, host_id: r.host_id, max_players: r.max_players, status: r.status, updated_at: r.updated_at,
      game_state: { __game: GAME_TAG, roomName: r.gname ?? undefined, deck: (r.gdeck ?? undefined) as GS['deck'], varzea: r.gvarzea === 'true' || undefined, mode: (r.gmode ?? undefined) as GS['mode'], careerOnline: r.gcareer === 'true' || undefined, manual: r.gmanual === 'true' || undefined, copaMode: (r.gcopa ?? undefined) as GS['copaMode'], ligaFechada: r.gliga === 'true' || undefined, locked: r.glocked === 'true' || undefined, stream: r.gstream === 'true' || undefined, pwHash: r.gpw ?? undefined, chatOff: r.gchat === 'true' || undefined } as GS,
    }))
    const ids = list.map(r => r.id)
    const counts: Record<string, number> = {}
    if (ids.length) {
      const { data: pls } = await supabase.from('room_players').select('room_id').in('room_id', ids)
      for (const p of (pls ?? []) as { room_id: string }[]) counts[p.room_id] = (counts[p.room_id] ?? 0) + 1
    }
    // "jogo rolando" só conta se alguém salvou recentemente: o host grava um
    // heartbeat a cada 3s enquanto a partida tá aberta numa aba de verdade.
    // Sem isso, uma sala cujo host sumiu (fechou a aba, caiu) ficava marcada
    // como "started" pra sempre — às vezes dias — e aparecia como ao vivo.
    // folga generosa: navegador em segundo plano (ex.: host foi mandar o
    // convite por fora) pode atrasar o salvamento por um tempo — não é sinal
    // de sala abandonada de verdade.
    const ROOM_HEARTBEAT_MS = 60_000
    const isFresh = (r: RoomInfo) => !!r.updated_at && Date.now() - new Date(r.updated_at).getTime() < ROOM_HEARTBEAT_MS
    // sala 'waiting' SEM host: o host bate updated_at a cada 30s enquanto está no
    // lobby. Parou de bater há mais de 3 min = host caiu/saiu → some da lista (não
    // deixa entrar numa sala que ninguém vai abrir). Folga maior que a do jogo
    // rolando pra não sumir por engano; a sala em si é encerrada pela vigia acima.
    const WAIT_STALE_MS = 180_000
    const waitingAlive = (r: RoomInfo) => !r.updated_at || Date.now() - new Date(r.updated_at).getTime() < WAIT_STALE_MS
    // só salas vivas: sem ninguém dentro (count 0) é sala fantasma abandonada.
    // esperando gente aparece primeiro (é nelas que dá pra entrar); as com
    // jogo rolando de verdade (heartbeat fresco) ficam depois, só como aviso.
    // carreira online é EM TESTE (só os e-mails liberados): não aparece na lista
    // pública — entra por convite/código ou por "Minhas carreiras" (host).
    const isCareer = (r: RoomInfo) => r.game_state?.mode === 'carreira' || (r.game_state as GS & { careerOnline?: boolean })?.careerOnline
    setOpenRooms(list.map(r => ({ ...r, count: counts[r.id] ?? 0 }))
      .filter(r => r.count >= 1 && (r.status === 'started' ? isFresh(r) : waitingAlive(r)) && !isCareer(r))
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'waiting' ? -1 : 1)))
    setListLoading(false)
  }

  // saves de CARREIRA ONLINE: salas em andamento onde EU participo — como host
  // (crio/continuo) OU como membro (volto quando o host retomar). A vaga do save
  // persiste mesmo depois de sair, então o amigo também vê e volta.
  async function fetchMyCareers() {
    if (!user) return
    const isCareer = (r: RoomInfo) => r.game_state?.__game === GAME_TAG && (r.game_state?.mode === 'carreira' || (r.game_state as GS & { careerOnline?: boolean })?.careerOnline)
    // 🪶 LISTA MAGRA (03/08): carreiras têm o MAIOR game_state do jogo — a lista
    // só precisa de nome/temporada/tipo. O estado completo é buscado na hora de
    // retomar (triggerStart refetcha), com trava pra nunca começar do zero.
    const sel = 'id, code, host_id, max_players, status, updated_at, gname:game_state->>roomName, gmode:game_state->>mode, gcareer:game_state->>careerOnline, gseason:game_state->>seasonNo, gtag:game_state->>__game'
    const { data: mine } = await supabase.from('room_players').select('room_id').eq('user_id', user.id)
    const memberIds = [...new Set(((mine ?? []) as { room_id: string }[]).map(r => r.room_id))]
    // inclui também a sala salva NO APARELHO (por id) — é assim que o banner do
    // topo acha a sala do HOST mesmo quando ele não tem vaga em room_players.
    const savedId = loadSavedRoom()
    const [hostedRes, memberRes, savedRes] = await Promise.all([
      supabase.from('game_rooms').select(sel).eq('host_id', user.id).eq('status', 'started').limit(30),
      memberIds.length ? supabase.from('game_rooms').select(sel).in('id', memberIds).eq('status', 'started').limit(30) : Promise.resolve({ data: [] as RoomInfo[] }),
      savedId ? supabase.from('game_rooms').select(sel).eq('id', savedId).eq('status', 'started').limit(1) : Promise.resolve({ data: [] as RoomInfo[] }),
    ])
    type SlimCareer = { id: string; code: string; host_id: string; max_players: number; status: string; updated_at?: string; gname: string | null; gmode: string | null; gcareer: string | null; gseason: string | null; gtag: string | null }
    const inflate = (r: SlimCareer): RoomInfo => ({ id: r.id, code: r.code, host_id: r.host_id, max_players: r.max_players, status: r.status, updated_at: r.updated_at,
      game_state: { __game: r.gtag ?? undefined, roomName: r.gname ?? undefined, mode: (r.gmode ?? undefined) as GS['mode'], careerOnline: r.gcareer === 'true' || undefined, seasonNo: r.gseason != null ? Number(r.gseason) : undefined } as GS })
    const seen = new Set<string>(); const rooms: RoomInfo[] = []
    for (const raw of [...((hostedRes.data ?? []) as unknown as SlimCareer[]), ...((memberRes.data ?? []) as unknown as SlimCareer[]), ...((savedRes.data ?? []) as unknown as SlimCareer[])]) {
      const r = inflate(raw)
      if (seen.has(r.id) || !isCareer(r)) continue
      seen.add(r.id); rooms.push(r)
    }
    rooms.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
    setMyCareers(rooms.map(r => ({ ...r, count: 0 })))
  }
  // abrir um save: HOST vê o painel de retomada (3 opções); PARTICIPANTE volta
  // direto pra sala (só o host inicia/conduz — ele espera o host retomar).
  function resumeCareer(rd: OpenRoom) {
    setRoomError('')
    if (rd.host_id === user?.id) { setResumingCareer(rd); return }
    ;(async () => {
      setLoading(true)
      saveRoom(rd.id)
      const ok = await triggerStart(rd)
      if (!ok) { setLoading(false); setRoomError('A carreira ainda não foi retomada pelo host. Peça pra ele continuar o save.') }
    })()
  }
  // continuar de verdade: reentra na sala (o host já está no room_players) e retoma.
  // quem não voltou joga como CPU (a temporada é simulada) e pode voltar depois.
  async function doContinueCareer() {
    const rd = resumingCareer
    if (!user || !rd) return
    setLoading(true); setRoomError('')
    saveRoom(rd.id)
    const ok = await triggerStart(rd)
    if (!ok) { setLoading(false); setRoomError('Não consegui abrir a carreira agora. Tente de novo.'); return }
    setResumingCareer(null)
  }
  // EXCLUIR de vez: o time do amigo vira CPU comum (não pode mais reassumir).
  async function excludeFromCareer(rd: OpenRoom, teamName: string) {
    if (!user) return
    if (!window.confirm(`Excluir ${teamName} de vez? O time vira CPU e o amigo não poderá reassumir.`)) return
    const gs = rd.game_state as GS
    const mgrs = (gs.managers ?? []).map(m => m.teamName === teamName ? { ...m, isHuman: false } : m)
    await supabase.from('game_rooms').update({ game_state: { ...gs, managers: mgrs } }).eq('id', rd.id)
    await supabase.from('room_players').delete().eq('room_id', rd.id).eq('manager_name', teamName)
    const next = { ...rd, game_state: { ...gs, managers: mgrs } }
    setResumingCareer(next)
    setMyCareers(cs => cs.map(c => c.id === rd.id ? next : c))
  }

  // entra numa sala já carregada (por código ou pela lista de salas abertas)
  async function enterRoom(rd: RoomInfo, pw?: string) {
    if (!user) return
    if (rd.game_state?.__game !== GAME_TAG) { setRoomError('Essa sala é de outro jogo.'); setLoading(false); return }
    // carreira online em teste: só os e-mails liberados entram
    if ((rd.game_state?.mode === 'carreira' || (rd.game_state as GS & { careerOnline?: boolean })?.careerOnline) && !canCareer) {
      setRoomError('Esse modo (Carreira Online) ainda está em teste fechado.'); setLoading(false); return
    }
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
    // sala FECHADA: quem ainda não está dentro precisa da senha (o host entra direto)
    const locked = !!rd.game_state?.locked && !!rd.game_state?.pwHash
    const amHost = rd.host_id === user.id
    if (locked && !amHost) {
      const pwT = (pw ?? '').trim()
      if (!pwT) { setPwModal(rd); setPwEntry(''); setLoading(false); return } // abre o pedido de senha
      setLoading(true); setRoomError('') // feedback: o clique registrou
      let h = ''
      try { h = hashPw(pwT.toLowerCase()) } // trim + minúsculas igual à criação
      catch { setRoomError('Não consegui checar a senha neste navegador. Atualize a página ou tente outro.'); setLoading(false); return }
      if (h !== rd.game_state!.pwHash) { setRoomError('❌ Senha incorreta (repara maiúsculas/minúsculas).'); setLoading(false); return }
    }
    // re-checa o status FRESCO logo antes de entrar: a lista/o código podem
    // estar defasados e o host pode ter COMEÇADO neste meio-tempo — entrar
    // agora criaria um jogador sem time na partida (o bug do "virei bot").
    const { data: freshSt } = await supabase.from('game_rooms').select('status').eq('id', rd.id).maybeSingle()
    if (freshSt?.status !== 'waiting') { setRoomError('⏱️ Essa sala começou agorinha — não deu tempo de entrar. Espera o "Jogar de novo" ou escolhe outra.'); setLoading(false); return }
    // pega uma vaga com RETRY: se dois entram no mesmo segundo e disputam o
    // mesmo slot, a trava única do banco derruba o segundo — que relê as vagas
    // e tenta a próxima, até 3 vezes, sem o usuário ver erro nenhum.
    let insOk = false, lastErr = ''
    for (let tent = 0; tent < 3 && !insOk; tent++) {
      const { data: cur } = tent === 0 ? { data: rows } : await supabase.from('room_players').select('user_id, player_index').eq('room_id', rd.id)
      const curRows = (cur ?? []) as { user_id: string; player_index: number }[]
      if (curRows.some(p => p.user_id === user.id)) { insOk = true; break } // já entrei noutra aba
      const used = new Set(curRows.map(p => p.player_index))
      let idx = 1; while (used.has(idx)) idx++
      if (idx >= rd.max_players) { setRoomError('Sala cheia!'); setLoading(false); return }
      const { error: insErr } = await supabase.from('room_players').insert({ room_id: rd.id, user_id: user.id, player_index: idx, manager_name: nameOf(), is_ready: true })
      if (!insErr) { insOk = true; break }
      lastErr = insErr.message
      if (!/duplicate|unique|23505/i.test(insErr.message)) break // erro real (não é corrida): desiste
    }
    if (!insOk) { setRoomError('Não consegui entrar: ' + lastErr); setLoading(false); return }
    saveRoom(rd.id)
    setPwModal(null); setRoomError('')
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
    // LIMPA as vagas ANTES de começar (o jogo monta os times pela POSIÇÃO na lista):
    // (1) DEDUPLICA por usuário. Se o mesmo técnico ficou com DUAS vagas (leitura
    //     atrasada na entrada deixou passar), ele viraria DOIS times — um "fantasma"
    //     com o nome dele que trava o leilão esperando lacrar (o bug do "meu nome
    //     aparece e também diz 'eu'"). Mantém a vaga de menor índice e apaga o resto.
    // (2) RENUMERA pra 0..n-1. Buraco na numeração (0,1,3,4) fazia jogador procurar
    //     um time que não existe e ser devolvido pra tela inicial.
    const { data: pls } = await supabase.from('room_players').select('user_id, player_index').eq('room_id', room.id).order('player_index')
    const rows = (pls ?? []) as { user_id: string; player_index: number }[]
    const seen = new Set<string>()
    const keep: { user_id: string; player_index: number }[] = []
    for (const r of rows) {
      if (seen.has(r.user_id)) {
        // vaga repetida do MESMO técnico → apaga (pelo índice, que é único na sala)
        await supabase.from('room_players').delete().eq('room_id', room.id).eq('player_index', r.player_index).then(() => {}, () => {})
      } else { seen.add(r.user_id); keep.push(r) }
    }
    for (let i = 0; i < keep.length; i++) {
      if (keep[i].player_index !== i) {
        await supabase.from('room_players').update({ player_index: i }).eq('room_id', room.id).eq('player_index', keep[i].player_index).then(() => {}, () => {})
      }
    }
    await supabase.from('game_rooms').update({ status: 'started' }).eq('id', room.id)
  }
  async function leaveRoom() {
    if (!room || !user) return
    // HOST saiu da sala de espera: NÃO passa a coroa — a sala não faz sentido sem o
    // dono (só ele abre o pregão). Avisa a galera (banner) e encerra a sala.
    if (room.host_id === user.id) {
      lobbyChanRef.current?.send({ type: 'broadcast', event: 'host_left', payload: {} })
      await supabase.from('room_players').delete().eq('room_id', room.id).then(() => {}, () => {})
      await supabase.from('game_rooms').delete().eq('id', room.id).then(() => {}, () => {})
    } else {
      await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', user.id)
    }
    clearSavedRoom()
    setRoom(null); setPlayers([]); setPhase('menu')
  }
  // host remove um técnico da sala de espera (antes de abrir o pregão): apaga
  // a vaga dele. O cliente removido percebe pela realtime que sumiu da lista e
  // volta sozinho pro menu (efeito abaixo).
  async function kickFromRoom(p: RoomPlayer) {
    if (!room || !isHost || p.user_id === user?.id) return
    if (!window.confirm(`Remover ${p.manager_name} da sala?`)) return
    await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', p.user_id)
    fetchPlayers(room.id)
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

  if (recovering) {
    return wrap(<>
    <div className="text-center">
      <div className="text-6xl mb-2">🔑</div>
      <h1 className="font-black text-3xl text-white" style={OSWALD}>NOVA SENHA</h1>
      <p className="text-white/60 text-sm font-bold mt-1">Crie uma senha nova pra sua conta.</p>
    </div>
    <div className="space-y-3">
      <PwField label="Nova senha" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="mínimo 6 caracteres"
        onKeyDown={e => e.key === 'Enter' && handleSaveNewPw()} />
      {authError && <p className={`text-sm font-bold ${authError.startsWith('✉️') ? 'text-green-400' : 'text-red-400'}`}>{authError}</p>}
    </div>
    <Big onClick={handleSaveNewPw}>{loading ? '...' : 'Salvar nova senha →'}</Big>
    <button onClick={() => { setRecovering(false); setPhase(user ? 'menu' : 'auth') }} className="text-white/40 text-sm underline w-full text-center">Pular</button>
  </>)
  }

  if (phase === 'auth') {
    const pendingInvite = loadInvite()
    return wrap(<>
    <div className="text-center">
      <div className="text-6xl mb-2">🔨</div>
      <h1 className="font-black text-3xl text-white" style={OSWALD}>LEILÃO LEGENDS · ONLINE</h1>
    </div>
    {pendingInvite && (
      <div className="rounded-xl border-[3px] border-black px-3 py-2.5" style={{ background: PURPLE, boxShadow: `3px 3px 0 ${INK}` }}>
        <p className="text-xs font-black text-white leading-snug" style={OSWALD}>
          🎮 Você foi convidado pra sala <span className="bg-white text-black px-1.5 rounded">{pendingInvite}</span>.<br />
          <span className="text-white/80">Entre ou crie sua conta — te levo direto pra sala.</span>
        </p>
      </div>
    )}
    <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
      {(['login', 'register'] as AuthTab[]).map(tab => (
        <button key={tab} onClick={() => { setAuthTab(tab); setAuthError('') }}
          className="flex-1 py-2.5 font-black text-sm uppercase" style={{ backgroundColor: authTab === tab ? GOLD : '#fff', color: '#000' }}>
          {tab === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>
      ))}
    </div>
    {authTab === 'register' && (
      <div className="rounded-xl border-[3px] border-black px-3 py-2.5" style={{ background: GOLD }}>
        <p className="text-xs font-black text-black leading-snug" style={OSWALD}>🎴 Com a conta, ser campeão (no CPU ou online) te dá uma carta-lembrança limitada pro álbum. Sem conta, não ganha carta.</p>
      </div>
    )}
    <div className="space-y-3">
      {authTab === 'register' && <Field label="Nome de técnico" value={displayName} onChange={e => setDisplayName(stripEmoji(e.target.value))} placeholder="Como te chamam?" />}
      <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
      <PwField label="Senha" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
        onKeyDown={e => e.key === 'Enter' && handleAuth()} />
      {authTab === 'login' && (
        <button onClick={handleForgot} className="text-white/50 text-xs font-bold underline w-full text-right" style={{ marginTop: -6 }}>
          Esqueci minha senha
        </button>
      )}
      {authError && (authError.startsWith('🔧')
        ? <div className="rounded-xl border-2 border-amber-400/60 bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-200">{authError}</div>
        : <p className={`text-sm font-bold ${authError.startsWith('✉️') ? 'text-green-400' : 'text-red-400'}`}>{authError}</p>)}
    </div>
    <Big onClick={handleAuth}>{loading ? '...' : authTab === 'login' ? 'Entrar →' : 'Criar conta →'}</Big>
    <button onClick={() => dispatch({ type: 'GO_LOBBY' })} className="text-white/40 text-sm underline w-full text-center">← Voltar</button>
  </>)
  }

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
      {/* Banner convidativo em roxo — o online é sobre CHAMAR A GALERA */}
      <div className="rounded-2xl border-[3px] border-black overflow-hidden" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
        <div className="px-4 py-4 relative" style={{ background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%)` }}>
          <div className="absolute top-2 right-3 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Multiplayer</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🔨</span>
            <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Leilão Legends</p>
          </div>
          <h1 className="font-black text-white text-[26px] leading-[1] mb-1.5" style={OSWALD}>
            CHAME A GALERA
          </h1>
          <p className="text-white/90 text-[13px] leading-snug font-medium">
            Toda a adrenalina do leilão, agora <b>contra seus amigos</b>. Cria a sala, manda o código no zap e briguem pelas lendas.
          </p>
        </div>
        <div className="px-4 py-2 flex items-center gap-2 justify-between" style={{ background: '#1a1220' }}>
          <span className="text-white/50 text-[10px] font-black uppercase tracking-widest">Logado como</span>
          {editingName ? (
            <div className="flex gap-1.5 items-stretch flex-1 ml-2">
              <input autoFocus value={nameDraft} onChange={e => setNameDraft(stripEmoji(e.target.value))} maxLength={20}
                placeholder="Seu nome de técnico" onKeyDown={e => e.key === 'Enter' && saveName()}
                className="flex-1 min-w-0 border-2 border-black rounded-md px-2 py-1 font-black text-black text-xs bg-white" />
              <button onClick={saveName} disabled={loading || !nameDraft.trim()}
                className="border-2 border-black rounded-md px-2 font-black text-xs" style={{ background: GREEN, color: '#fff', ...OSWALD }}>OK</button>
              <button onClick={() => setEditingName(false)}
                className="border-2 border-black rounded-md px-2 font-black text-xs bg-white text-black">✕</button>
            </div>
          ) : (
            <button onClick={() => { setNameDraft(user?.user_metadata?.display_name ?? ''); setEditingName(true) }}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border-2"
              style={{ background: hasName ? 'rgba(255,255,255,.1)' : GOLD, borderColor: hasName ? 'rgba(255,255,255,.3)' : '#000' }}>
              <span className="font-black text-xs" style={{ color: hasName ? '#fff' : '#000' }}>
                {hasName ? nameOf() : 'Toque pra pôr seu nome'}
              </span>
              <span style={{ fontSize: 11 }}>✏️</span>
            </button>
          )}
        </div>
      </div>

      {/* partida em andamento: pergunta se quer voltar ou sair */}
      {resumeRoom && (
        <div className="rounded-2xl border-[3px] border-black p-3 space-y-2.5" style={{ background: GREEN, boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black text-white text-sm leading-tight" style={OSWALD}>⏳ Você tem uma partida em andamento<br /><span className="opacity-80 text-xs">Sala {resumeRoom.code}</span></p>
          <div className="flex gap-2">
            <button onClick={doResume} disabled={loading}
              className="flex-1 rounded-xl border-2 border-black bg-white text-black font-black text-sm py-2.5 active:translate-y-0.5" style={OSWALD}>
              {loading ? '...' : '▶️ Voltar pra partida'}
            </button>
            <button onClick={leaveResume}
              className="flex-1 rounded-xl border-2 border-black font-black text-sm py-2.5 active:translate-y-0.5" style={{ background: '#E8503A', color: '#fff', ...OSWALD }}>
              🚪 Sair da sala
            </button>
          </div>
        </div>
      )}

      {/* Minhas carreiras (saves do host) — só aparece pra quem tem carreira em andamento */}
      {canCareer && myCareers.length > 0 && (
        <div className="rounded-2xl border-[3px] border-black p-3 space-y-2" style={{ background: '#EDE3FF', boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black text-sm" style={{ ...OSWALD, color: '#4C1D95' }}>🪜 Minhas carreiras</p>
          {myCareers.map(r => {
            const gs = r.game_state as GS & { seasonNo?: number; careerOnline?: boolean }
            const nm = gs?.roomName ?? r.code
            const iAmHost = r.host_id === user?.id
            return (
              <div key={r.id} className="flex items-center gap-2 border-2 border-black rounded-xl px-3 py-2 bg-white">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-black text-sm truncate" style={OSWALD}>{nm}</p>
                  <p className="text-black/60 text-[11px] font-bold">Temporada {gs?.seasonNo ?? 1} · sala {r.code}{iAmHost ? '' : ' · você é convidado'}</p>
                </div>
                <button onClick={() => resumeCareer(r)} disabled={loading}
                  className="border-2 border-black rounded-lg px-3 py-2 font-black text-xs uppercase shrink-0"
                  style={{ background: iAmHost ? GREEN : PURPLE, color: '#fff', ...OSWALD }}>
                  {iAmHost ? '▶️ Continuar' : '↩️ Voltar'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* abas */}
      <div className="flex border-[3px] border-black rounded-xl overflow-hidden">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setRoomError('') }}
            className="flex-1 py-2.5 font-black text-xs uppercase" style={{ backgroundColor: tab === t.id ? PURPLE : '#fff', color: tab === t.id ? '#fff' : '#000', ...OSWALD }}>
            {t.label}
          </button>
        ))}
      </div>


      {tab === 'create' && (() => {
        const isCareer = canCareer && roomMode === 'carreira'
        return (
        <div className="space-y-3">
          {/* ① O BÁSICO — modo, nome, baralho, formação */}
          <Section num={1} title="O básico" icon="📋">
            <div>
              <SegField label={canCareer ? 'Modo de jogo (teste)' : 'Modo de jogo'}>
                {canCareer ? (
                  <Seg options={[['rapido', '⚡ Rápido'], ['carreira', '🌐 Carreira']] as [typeof roomMode, string][]} value={roomMode} onSet={v => setRoomMode(v)} />
                ) : (
                  // Carreira ainda em teste fechado: aparece pra TODOS como "em breve",
                  // apagada e sem clique (só desperta o interesse). Sempre fica no Rápido.
                  <div className="flex border-[2.5px] border-black rounded-xl overflow-hidden">
                    <button className="flex-1 font-black" style={{ padding: '9px 2px', fontSize: 12.5, background: GOLD, color: '#000', ...OSWALD }}>⚡ Rápido</button>
                    <button disabled className="flex-1 font-black border-l-[2.5px] border-black" style={{ padding: '9px 2px', fontSize: 11, background: '#fff', color: '#000', opacity: 0.4, cursor: 'default', ...OSWALD }}>🌐 Carreira · em breve</button>
                  </div>
                )}
              </SegField>
              <p className="text-white/40 text-[10px] font-bold mt-1 leading-snug">
                {!canCareer ? '🌐 Carreira (pirâmide de 4 divisões) tá chegando — em breve no online!' : isCareer ? '🏆 4 divisões — cada técnico sobe/cai por conta própria. Mesmo mundo pra todos.' : '🔨 O leilão de sempre — uma temporada avulsa.'}
              </p>
            </div>
            <Field label="Nome da sala" value={roomName} onChange={e => setRoomName(stripEmoji(e.target.value))} placeholder={`Sala do ${nameOf()}`} maxLength={24} />
            {isCareer ? (
              <div className="border-[2.5px] border-black rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <p className="text-white font-black text-[12.5px]" style={OSWALD}>🌎 Baralho fixo: Brasil + Europa</p>
                <p className="text-white/55 text-[10.5px] font-bold mt-0.5 leading-snug">A Carreira usa os dois juntos (~700 nomes) pra preencher os 80 times das 4 divisões.</p>
              </div>
            ) : (
              <SegField label="Baralho de craques">
                <Seg options={[['br', '🇧🇷 Brasil'], ['eu', '🌍 Europa'], ['both', '🌎 Todos (BR+EU+Mundo)']] as [DeckChoice, string][]} value={rapidoDeck} onSet={v => setRapidoDeck(v)} />
                {/* 🥅 categoria SÓ do baralho Brasil: Todos (padrão) ou Várzea (sem craques) */}
                {rapidoDeck === 'br' && (
                  <div className="mt-2.5">
                    <p className="text-white/55 text-[10.5px] font-black uppercase tracking-wide mb-1" style={OSWALD}>Categoria</p>
                    <Seg options={[[false, 'Todos'], [true, '🥅 Várzea']] as [boolean, string][]} value={rapidoVarzea} onSet={v => setRapidoVarzea(v)} />
                    <p className="text-white/45 text-[10.5px] font-bold mt-1.5 leading-snug">{rapidoVarzea ? '🥅 Sem craques: só bom jogador e foi profissional — todo mundo no mesmo nível, peladão puro.' : '🇧🇷 Baralho BR inteiro, do craque ao perna-de-pau.'}</p>
                  </div>
                )}
              </SegField>
            )}
            {!isCareer && (
              <SegField label="Formação (vale pra todos)">
                <Seg options={[['4-3-3', '4-3-3'], ['4-4-2', '4-4-2']] as [FormationKey, string][]} value={formation} onSet={v => setFormation(v)} />
              </SegField>
            )}
          </Section>

          {/* ② OS RIVAIS — só na carreira (igual offline: host escolhe os CPUs do leilão) */}
          {isCareer && (
            <Section num={2} title="Os rivais" icon="🔥">
              <div>
                <p className="text-white/70 text-[11px] font-black uppercase mb-1.5" style={{ letterSpacing: '.1em' }}>Rivais no leilão (CPUs)</p>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 9].map(n => (
                    <button key={n} onClick={() => setCareerRivals(n)}
                      className="border-[2.5px] border-black rounded-xl py-2 font-black text-sm"
                      style={{ background: careerRivals === n ? PURPLE : '#fff', color: careerRivals === n ? '#fff' : '#000', ...OSWALD }}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-white/40 text-[10.5px] font-bold mt-1.5 leading-snug">Eles dão lance no pregão e disputam a temporada com vocês — igual ao offline. Na tabela aparecem como time comum (sem selo); só vocês e as SAFs ficam marcados.</p>
              </div>
              <div>
                <p className="text-white text-[11px] font-black uppercase mb-1">🔥 Escolha os rivais <span className="text-white/50">({careerRivalPicks.length}/{careerRivals})</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {DIVISION_TEAMS['D'].map(t => {
                    const on = careerRivalPicks.includes(t.team)
                    return (
                      <button key={t.team} onClick={() => toggleCareerRival(t.team)}
                        className="border-2 border-black rounded-lg px-2 py-1 font-black text-[11px] active:translate-y-0.5"
                        style={{ background: on ? '#E8503A' : '#fff', color: on ? '#fff' : '#000' }}>
                        {on ? '🔥 ' : ''}{t.team}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => setCareerRivalPicks([])} className="mt-2 border-2 border-black rounded-lg px-2.5 py-1 font-black text-[11px] bg-white text-black active:translate-y-0.5" style={OSWALD}>
                  🎲 Não escolher — usar rivais padrão
                </button>
              </div>
            </Section>
          )}

          {/* ② A PARTIDA — só no rápido (a carreira tem regras próprias) */}
          {!isCareer && (
            <Section num={2} title="A partida" icon="⚽">
              {LIGA_FECHADA_LIBERADA && (
              <SegField label="Tabela">
                {canLiga ? (
                  <>
                    <Seg options={[[false, '🌍 Aberta'], [true, '🏆 Liga Fechada']] as [boolean, string][]} value={ligaFechada} onSet={v => setLigaFechada(v)} />
                    <p className="text-white/40 text-[10.5px] font-bold mt-1.5 leading-snug">{ligaFechada ? '🏆 Só a galera na tabela — nenhum bot. A liga tem o tamanho de vocês (ida e volta). Copa destrava com 8+ jogadores.' : '🌍 Tabela de 20 times — os que faltam entram como CPU, como sempre.'}</p>
                  </>
                ) : (
                  // Liga Fechada é benefício do Lenda 👑 — pra quem não tem, aparece
                  // apagada como convite (sempre fica na tabela Aberta).
                  <>
                    <div className="flex border-[2.5px] border-black rounded-xl overflow-hidden">
                      <button className="flex-1 font-black" style={{ padding: '9px 2px', fontSize: 12.5, background: GOLD, color: '#000', ...OSWALD }}>🌍 Aberta</button>
                      <button disabled className="flex-1 font-black border-l-[2.5px] border-black" style={{ padding: '9px 2px', fontSize: 11, background: '#fff', color: '#000', opacity: 0.4, cursor: 'default', ...OSWALD }}>🏆 Liga Fechada · 👑 Lenda</button>
                    </div>
                    <p className="text-white/40 text-[10.5px] font-bold mt-1.5 leading-snug">🏆 <b>Liga Fechada</b> (liga só com amigos, sem bot) vem no <b>Lenda 👑</b> — desbloqueie no Apoie.</p>
                  </>
                )}
              </SegField>
              )}
              <SegField label="Depois da liga">
                <Seg options={[['liga_copa', '🏆 Liga + Copa'], ['liga', '📊 Só liga']] as ['liga_copa' | 'liga', string][]} value={rapidoCopaMode} onSet={v => setRapidoCopaMode(v)} />
              </SegField>
              {!roomStream && (
                <SegField label="Ritmo">
                  <Seg options={[[false, '⚡ Auto'], [true, '🎮 Manual']] as [boolean, string][]} value={roomManual} onSet={v => setRoomManual(v)} />
                  <p className="text-white/40 text-[10.5px] font-bold mt-1.5 leading-snug">{roomManual ? '🎮 O host aperta pra avançar cada partida — ideal pra jogar com amigos.' : '⚡ Anda sozinho, na velocidade normal do online.'}</p>
                </SegField>
              )}
            </Section>
          )}

          {/* ③ A SALA — privacidade, chat, stream (+ tempo do leilão) */}
          <Section num={3} title="A sala" icon="🔧">
            <div>
              <ToggleRow icon={roomLocked ? '🔒' : '🔓'} title={roomLocked ? 'Sala fechada' : 'Sala aberta'} sub={roomLocked ? 'Só entra com senha' : 'Qualquer um entra'} on={roomLocked} onClick={() => setRoomLocked(v => !v)} />
              {roomLocked && (
                <input type="text" value={roomPw} onChange={e => setRoomPw(e.target.value)} maxLength={20}
                  placeholder="Senha da sala (avise a galera)"
                  className="w-full mt-2 border-[2.5px] border-black rounded-xl px-3 py-2 font-black text-black bg-white" />
              )}
            </div>
            <ToggleRow icon={roomChat ? '💬' : '🔕'} title="Chat da sala" sub={roomChat ? 'A galera pode zoar na sala' : 'Sem chat'} on={roomChat} onClick={() => setRoomChat(v => !v)} />
            {/* 🎮 RITMO: na carreira NÃO se escolhe na criação — nasce em auto e o
                HOST liga/desliga o manual DENTRO do jogo (nas partidas). */}
            {!isCareer && (
              <div>
                <ToggleRow icon="🎥" title="Modo Stream" sub={roomStream ? 'Valores dos lances ocultos' : 'Esconde os valores (pra live)'} on={roomStream} onClick={() => { if (roomStream) setRoomStream(false); else setStreamModal(true) }} />
                {/* ⏱️ TEMPO DO LEILÃO — sub-opção do streamer (só com o Stream ligado) */}
                {roomStream && (
                  <div className="mt-2 rounded-xl border-[2.5px] border-black p-2.5" style={{ background: 'rgba(46,111,176,.16)' }}>
                    <p className="text-white/60 text-[10px] font-black uppercase mb-1.5" style={{ letterSpacing: '.12em' }}>⏱️ Tempo do leilão (pregão)</p>
                    <Seg small dim={auctionSecs === 0}
                      options={[[20, '20s'], [30, '30s'], [45, '45s'], [60, '60s'], [90, '90s']] as [number, string][]}
                      value={auctionSecs === 0 ? -1 : auctionSecs} onSet={v => setAuctionSecs(v)} />
                    <button onClick={() => setAuctionSecs(s => (s === 0 ? 45 : 0))}
                      className="flex items-center gap-2.5 w-full border-[2.5px] border-black rounded-xl px-3 py-2.5 mt-2 text-left"
                      style={{ background: auctionSecs === 0 ? '#2E6FB0' : '#fff', color: auctionSecs === 0 ? '#fff' : '#000' }}>
                      <span className="text-lg leading-none">🎮</span>
                      <span className="flex-1 min-w-0">
                        <b className="block font-black leading-tight" style={{ fontSize: 13, ...OSWALD }}>{auctionSecs === 0 ? 'Sem tempo — você avança' : 'Sem tempo (host avança)'}</b>
                        <small className="font-bold" style={{ fontSize: 10, color: auctionSecs === 0 ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.5)' }}>Você fecha cada envelope no botão</small>
                      </span>
                      <Sw on={auctionSecs === 0} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Big onClick={createRoom} color={isCareer ? PURPLE : GOLD}>
            <span style={{ color: isCareer ? '#fff' : '#000' }}>{loading ? 'Criando...' : isCareer ? '🌐 Criar Carreira' : '🏠 Criar Sala'}</span>
          </Big>
        </div>
        )
      })()}

      {tab === 'open' && <div className="space-y-3">
        <Field label="Buscar sala" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sala…" />
        <div className="space-y-2">
          {listLoading && <p className="text-white/50 text-sm font-bold text-center py-3">Carregando salas…</p>}
          {!listLoading && filtered.length === 0 && <p className="text-white/50 text-sm font-bold text-center py-3">Nenhuma sala aberta agora. Crie a sua! 🔨</p>}
          {filtered.map(r => {
            const nm = r.game_state?.roomName ?? r.code
            const full = r.count >= r.max_players
            const live = r.status === 'started'
            // baralho escolhido na criação: BR · EU · B/E (os dois). Sala antiga sem deck = BR.
            const deckLbl = (r.game_state?.deck === 'eu' ? 'EU' : r.game_state?.deck === 'both' ? 'B/E/M' : 'BR') + ((r.game_state as GS)?.varzea ? ' 🥅' : '')
            // carreira tem ritmo/copa próprios — auto/manual e liga/copa valem só no rápido
            const isCareerRoom = r.game_state?.mode === 'carreira' || (r.game_state as GS & { careerOnline?: boolean })?.careerOnline
            const ritmoLbl = r.game_state?.manual ? '🎮 manual' : '⚡ auto' // padrão = auto
            const copaLbl = r.game_state?.copaMode === 'liga' ? '📊 só liga' : '🏆 liga+copa' // padrão = liga+copa
            const ligaFechadaRoom = !!(r.game_state as GS & { ligaFechada?: boolean })?.ligaFechada // 🏆 liga só com a galera
            return (
              <div key={r.id} className="flex items-center gap-2 border-[3px] border-black rounded-xl p-3" style={{ background: live ? '#EFE6C8' : '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-black text-sm flex items-center gap-1.5" style={OSWALD}>
                    {live && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                    <span className="truncate">{r.game_state?.locked ? '🔒 ' : ''}{r.game_state?.stream ? '🎥 ' : ''}{nm}</span>
                    <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border-2 border-black leading-none" style={{ background: GOLD, color: '#000', ...OSWALD }} title="Baralho da sala">{deckLbl}</span>
                  </p>
                  <p className="text-black/60 text-xs font-bold mt-0.5">👥 {r.count}/{r.max_players} · {r.code}{ligaFechadaRoom ? ' · 🏆 liga fechada' : ''}{!isCareerRoom ? ` · ${ritmoLbl} · ${copaLbl}` : ''}{r.game_state?.locked ? ' · fechada' : ''}{r.game_state?.stream ? ' · stream' : ''}{live ? ' · 🔴 jogo rolando' : ''}</p>
                </div>
                {live ? (
                  <span className="border-[2px] border-black rounded-lg px-3 py-2 font-black text-xs uppercase shrink-0" style={{ backgroundColor: '#ccc', color: '#000', ...OSWALD }}>
                    Em jogo
                  </span>
                ) : (
                  <button onClick={() => joinFromList(r)} disabled={loading || full}
                    className="border-[2px] border-black rounded-lg px-3 py-2 font-black text-xs uppercase shrink-0"
                    style={{ backgroundColor: full ? '#ccc' : GREEN, color: full ? '#000' : '#fff', ...OSWALD }}>
                    {full ? 'Cheia' : 'Entrar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <Big onClick={() => fetchOpenRooms()} color="#fff">🔄 Atualizar lista</Big>
      </div>}

      {tab === 'join' && <div className="space-y-2">
        <Field label="Código da sala" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="EX: ABCD12" maxLength={6}
          onKeyDown={e => e.key === 'Enter' && joinRoom()} />
        <Big onClick={joinRoom} color="#fff">{loading ? 'Entrando...' : '🔑 Entrar com Código'}</Big>
      </div>}

      {!pwModal && roomError && <p className="text-red-400 text-sm font-bold">{roomError}</p>}

      {resumingCareer && (() => {
        const gs = resumingCareer.game_state as GS & { seasonNo?: number }
        const humans = (gs.managers ?? []).filter(m => m.isHuman)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,.7)' }}>
            <div className="w-full max-w-sm border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6] max-h-[85vh] overflow-y-auto" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
              <p className="font-black text-black text-lg" style={OSWALD}>🪜 Continuar carreira</p>
              <p className="text-black/60 text-xs font-bold mb-1">{gs.roomName ?? resumingCareer.code} · Temporada {gs.seasonNo ?? 1}</p>
              <p className="text-black/70 text-[12px] font-bold mb-2 leading-snug">Chame a galera de volta pelo código. Quem entrar reassume o time; <b>quem faltar joga como CPU</b> e pode voltar depois (nas paradas entre temporadas).</p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => shareInvite(resumingCareer.code, gs.roomName)} className="flex-1 border-2 border-black rounded-xl py-2 font-black text-xs uppercase bg-white text-black" style={OSWALD}>📤 Chamar (código {resumingCareer.code})</button>
              </div>
              <p className="text-black/50 text-[10px] font-black uppercase tracking-widest mb-1">Técnicos da carreira</p>
              <div className="space-y-1.5 mb-3">
                {humans.map((m, i) => (
                  <div key={m.id ?? i} className="flex items-center gap-2 border-2 border-black rounded-lg px-2.5 py-1.5 bg-white">
                    <div className="w-6 h-6 rounded-full border-2 border-black bg-gray-300 flex items-center justify-center text-[11px] font-black">{m.teamName?.[0]?.toUpperCase()}</div>
                    <span className="font-black text-black text-xs flex-1 truncate">{m.teamName}</span>
                    <button onClick={() => excludeFromCareer(resumingCareer, m.teamName)} aria-label={`Excluir ${m.teamName}`}
                      className="shrink-0 text-[10px] font-black uppercase text-red-500 border border-red-300 rounded px-1.5 py-0.5 active:opacity-60" style={OSWALD}>Excluir</button>
                  </div>
                ))}
                {humans.length === 0 && <p className="text-black/40 text-xs italic">Sem técnicos humanos salvos.</p>}
              </div>
              {roomError && <p className="text-red-500 text-xs font-bold mb-2">{roomError}</p>}
              <button onClick={doContinueCareer} disabled={loading}
                className="w-full border-[3px] border-black rounded-xl py-3 font-black text-sm uppercase mb-2" style={{ background: GREEN, color: '#fff', boxShadow: `3px 3px 0 ${INK}`, ...OSWALD }}>
                {loading ? 'Abrindo…' : '▶️ Continuar (quem faltar = CPU)'}
              </button>
              <button onClick={() => { setResumingCareer(null); setRoomError('') }} className="w-full text-black/50 text-xs font-bold underline" style={OSWALD}>⏳ Aguardar mais um pouco (voltar)</button>
            </div>
          </div>
        )
      })()}

      {streamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,.7)' }}>
          <div className="w-full max-w-xs border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
            <p className="font-black text-black text-lg" style={OSWALD}>🎥 Modo Stream</p>
            <p className="text-black/70 text-sm font-bold mt-1 leading-snug">
              É pra quem vai <b>transmitir ao vivo</b> (YouTube/Twitch). Como o leilão é cego, mostrar a tela na live entregaria seus lances.
            </p>
            <p className="text-black/70 text-sm font-bold mt-2 leading-snug">
              Com ele ligado, os <b>valores dos lances ficam escondidos na sua própria tela</b> (você aposta no dedo, sem ver o número) — aí pode mostrar tudo na live sem ninguém roubar. Os valores só aparecem no martelo.
            </p>
            <p className="text-black/50 text-xs font-bold mt-2">Se você não vai transmitir, deixe desligado.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setStreamModal(false)}
                className="flex-1 border-[3px] border-black rounded-xl py-2 font-black text-sm bg-white text-black" style={OSWALD}>Cancelar</button>
              <button onClick={() => { setRoomStream(true); setStreamModal(false) }}
                className="flex-1 border-[3px] border-black rounded-xl py-2 font-black text-sm" style={{ background: '#111', color: '#fff', ...OSWALD }}>Ligar mesmo assim</button>
            </div>
          </div>
        </div>
      )}

      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,.65)' }}>
          <div className="w-full max-w-xs border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `5px 5px 0 ${INK}` }}>
            <p className="font-black text-black text-lg" style={OSWALD}>🔒 Sala fechada</p>
            <p className="text-black/60 text-xs font-bold mb-2">Digite a senha pra entrar em “{pwModal.game_state?.roomName ?? pwModal.code}”.</p>
            <input autoFocus type="text" value={pwEntry} onChange={e => setPwEntry(e.target.value)} maxLength={20}
              placeholder="Senha" onKeyDown={e => e.key === 'Enter' && enterRoom(pwModal, pwEntry)}
              className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-black text-black bg-white" />
            {roomError && <p className="text-red-500 text-xs font-bold mt-1">{roomError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setPwModal(null); setRoomError('') }}
                className="flex-1 border-[3px] border-black rounded-xl py-2 font-black text-sm bg-white text-black" style={OSWALD}>Cancelar</button>
              <button onClick={() => enterRoom(pwModal, pwEntry)} disabled={loading}
                className="flex-1 border-[3px] border-black rounded-xl py-2 font-black text-sm" style={{ background: loading ? '#8aa892' : GREEN, color: '#fff', ...OSWALD }}>{loading ? 'Entrando…' : 'Entrar'}</button>
            </div>
          </div>
        </div>
      )}
      <AdminButton />
      <button onClick={() => { clearSavedRoom(); logout() }} className="text-white/30 text-xs underline w-full text-center">Sair da conta</button>
      <button onClick={() => { clearSavedRoom(); dispatch({ type: 'GO_LOBBY' }) }} className="text-white/40 text-sm underline w-full text-center">← Menu inicial</button>
    </>, () => { clearSavedRoom(); dispatch({ type: 'GO_LOBBY' }) })
  }

  if (phase === 'waiting' && room) {
    const ready = players.length >= 2
    const chatOff = !!room.game_state?.chatOff // host desligou o chat na criação
    return wrap(<>
      <div className="text-center">
        {room.game_state?.roomName && <p className="text-white font-black text-xl mb-1" style={OSWALD}>{room.game_state.roomName}</p>}
        <p className="text-white/50 text-[11px] font-black uppercase tracking-widest">Código da Sala</p>
        <p className="font-black text-5xl text-white tracking-[0.2em] mt-1">{room.code}</p>
      </div>

      {/* Convite: manda o link direto no zap — o amigo cai na sala automaticamente
          (se já tem conta) ou no cadastro rápido e depois na sala. */}
      <div className="rounded-2xl border-[3px] border-black p-3 space-y-2" style={{ background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%)`, boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="text-white font-black text-[13px] leading-tight" style={OSWALD}>📣 Chame a galera</p>
        <p className="text-white/80 text-[11px] font-medium leading-snug">
          Manda o link — quem já tem conta cai direto na sala; quem não tem, cadastra e vem parar aqui.
        </p>
        <div className="flex gap-2">
          <button onClick={() => shareInvite(room.code, room.game_state?.roomName)}
            className="flex-1 border-[2px] border-black rounded-xl py-2.5 font-black text-xs uppercase bg-white text-black active:translate-y-0.5" style={OSWALD}>
            📤 Compartilhar convite
          </button>
          <button onClick={() => copyCode(room.code)}
            className="border-[2px] border-black rounded-xl px-3 py-2.5 font-black text-xs uppercase bg-[#FFC400] text-black active:translate-y-0.5" style={OSWALD}
            aria-label="Copiar código">
            📋
          </button>
        </div>
        {shareOk && (
          <p className="text-white text-[11px] font-black text-center" style={OSWALD}>
            ✓ {shareOk === 'code' ? 'Código copiado' : 'Link copiado — cola no zap'}
          </p>
        )}
      </div>

      <div className="border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-3">Técnicos ({players.length}/{room.max_players})</p>
        <div className="space-y-2">
          {players.map(p => (
            <div key={p.user_id} className="flex items-center gap-3">
              {(() => { const pk = perkFromName(p.manager_name) ?? APOIO_PERKS.bege; return (
                <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-sm font-black"
                  style={{ background: pk.grad, position: 'relative', overflow: 'hidden', color: '#0C0C0C' }}>
                  <span style={{ position: 'relative', zIndex: 2 }}>{stripEmoji(p.manager_name).trim()[0]?.toUpperCase()}</span>
                  {pk.holo > 0 && <ApoioSheen holo={pk.holo} dur={2.6} />}
                </div>
              ) })()}
              <span className="font-black text-black text-sm flex-1">{p.manager_name}</span>
              {p.user_id === room.host_id && <span className="text-[10px] font-black uppercase bg-yellow-400 border border-black px-2 py-0.5 rounded-full">HOST</span>}
              {isHost && p.user_id !== user?.id && (
                <button onClick={() => kickFromRoom(p)} aria-label={`Remover ${p.manager_name}`}
                  className="shrink-0 w-6 h-6 rounded-full border border-black/20 text-black/40 font-black text-xs leading-none active:opacity-60"
                  style={{ background: '#fff' }}>✕</button>
              )}
            </div>
          ))}
          {players.length < 2 && <p className="text-black/40 text-xs italic mt-1">Aguardando mais técnicos…</p>}
        </div>
      </div>

      {/* Zoeira da sala de espera: frases prontas que caem no CHAT da sala (o
          mesmo do leilão — as mensagens ficam, não somem). Tocar numa frase já
          abre a gaveta do chat pra você ver ela cair. */}
      {!chatOff && (() => {
        const carreira = room.game_state?.mode === 'carreira'
        const hostName = players.find(p => p.player_index === 0)?.manager_name ?? 'host'
        const abrir = carreira ? 'começa logo a carreira!' : 'abre o pregão!'
        const jabs = isHost
          ? [
              { ic: '😏', tx: 'Calma que já vai começar…' },
              { ic: '📣', tx: 'Chamando mais gente, segura!' },
              { ic: '😈', tx: 'Preparados pra perder?' },
              { ic: '🍿', tx: 'Senta que o show vai começar!' },
            ]
          : [
              { ic: '🐢', tx: `Anda, ${hostName}, ${abrir}` },
              { ic: '🔨', tx: `Solta o martelo, ${hostName}!` },
              { ic: '😴', tx: `Dormiu, ${hostName}?` },
              { ic: '🔥', tx: 'Tô pronto pra ganhar de todo mundo!' },
            ]
        return (
          <div className="rounded-2xl border-[3px] border-black p-3 bg-[#F4ECD6]" style={{ boxShadow: `4px 4px 0 ${INK}` }}>
            <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-2">😜 Enquanto espera… zoa a galera</p>
            <div className="grid grid-cols-2 gap-2">
              {jabs.map((j, i) => (
                <button key={i} onClick={() => sendLobbyFloat(j.ic, j.tx)}
                  className="border-2 border-black rounded-xl px-2 py-2 font-black text-[11px] text-left bg-white text-black active:translate-y-0.5" style={OSWALD}>
                  {j.ic} {j.tx}
                </button>
              ))}
            </div>
            {/* 📞🎙️ BUZINA: áudios de meme pra sala TODA. 1 por pessoa a cada 30s
                (contagem compartilhada) e um som por vez na sala. */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([['ligar', '📞', '"Posso te ligar agora?"'], ['meme2', '🎙️', 'AQUELE áudio'], ['siuu', '🗣️', 'SIIIIUU!'], ['novo5', '🔊', 'Áudio novo']] as [string, string, string][]).map(([k, ic, tx]) => (
                <button key={k} onClick={() => sendSfx(k)} disabled={sfxCoolLeft > 0}
                  className="border-2 border-black rounded-xl px-2 py-2 font-black text-[11px] active:translate-y-0.5"
                  style={{ ...OSWALD, background: sfxCoolLeft > 0 ? '#e4ddc9' : GOLD, color: sfxCoolLeft > 0 ? 'rgba(0,0,0,.45)' : '#000' }}>
                  {sfxCoolLeft > 0 ? `${ic} ${sfxCoolLeft}s…` : `${ic} ${tx} 🔊`}
                </button>
              ))}
            </div>
            <button onClick={() => openLobbyChat(true)}
              className="mt-2 w-full border-2 border-black rounded-xl px-2 py-2 font-black text-[11px] bg-white text-black active:translate-y-0.5 flex items-center justify-center gap-1.5" style={OSWALD}>
              💬 Abrir chat da sala {lobbyChat.length > 0 && <span className="opacity-60">({lobbyChat.length})</span>}
            </button>
          </div>
        )
      })()}
      {(() => {
        const carreira = room.game_state?.mode === 'carreira'
        const startLabel = carreira ? '🌐 Começar Carreira!' : '🔨 Abrir o Pregão!'
        const waitMsg = carreira ? 'Aguardando o host começar a carreira…' : 'Aguardando o host abrir o pregão…'
        return isHost
          ? <Big onClick={startOnline} disabled={!ready} color={ready ? GREEN : '#ccc'}><span style={{ color: ready ? '#fff' : '#000' }}>{ready ? startLabel : `Aguardando… (${players.length}/2 mín)`}</span></Big>
          : <p className="text-white/60 text-sm font-bold text-center py-3">{waitMsg}</p>
      })()}
      <button onClick={leaveRoom} className="text-white/75 text-[13px] font-black underline w-full text-center active:opacity-60">🚪 Sair da sala</button>

      {/* 💬 CHAT DA SALA DE ESPERA — igual ao do leilão: botãozinho flutuante que
          abre uma gaveta com as mensagens (que FICAM), a caixa de digitar e o
          crachá de não-lidas. Só aparece se o host deixou o chat ligado. */}
      {!chatOff && <LobbyChatDock
        open={lobbyChatOpen} setOpen={openLobbyChat} unread={lobbyUnread}
        msgs={lobbyChat} myUid={user?.id} listRef={lobbyListRef} onSend={sendLobbyChat} />}

      {/* 🎈 CAMADA FLUTUANTE: as reações da zoeira sobem e somem POR CIMA de tudo —
          inclusive do chat aberto (z acima da gaveta). Não entra no chat. */}
      {lobbyFloats.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'none', overflow: 'hidden' }}>
          <style>{'@keyframes lobbyRise{0%{opacity:0;transform:translate(-50%,20px) scale(.7)}14%{opacity:1;transform:translate(-50%,0) scale(1)}72%{opacity:1}100%{opacity:0;transform:translate(-50%,-190px) scale(1)}}'}</style>
          {lobbyFloats.map(f => (
            <div key={f.id} style={{ position: 'absolute', left: `${f.x}%`, bottom: '24%', transform: 'translateX(-50%)', animation: 'lobbyRise 3s ease-out forwards', display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `2px solid ${INK}`, borderRadius: 999, padding: '5px 11px', boxShadow: `2px 2px 0 0 ${INK}`, maxWidth: '82vw' }}>
              <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{f.emoji}</span>
              <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ color: chatColor(f.name) }}>{f.name}:</span> {f.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 👑 BANNER: o host saiu → a sala acabou. Aperta OK e volta pro menu das salas. */}
      {hostLeft && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div style={{ background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `6px 6px 0 0 ${INK}`, maxWidth: 380, width: '100%', padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 42, lineHeight: 1 }}>👑🚪</div>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 20, color: INK, marginTop: 8 }}>O host saiu da sala</p>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'rgba(0,0,0,.65)', marginTop: 6, lineHeight: 1.4 }}>A sala foi encerrada — sem o host ninguém abre o pregão. Você volta pro menu das salas.</p>
            <button onClick={() => { setHostLeft(false); clearSavedRoom(); setRoom(null); setPlayers([]); setTab('open'); setPhase('menu') }}
              style={{ ...OSWALD, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}`, padding: '11px 0', width: '100%', marginTop: 16, cursor: 'pointer' }}>
              OK, voltar pras salas
            </button>
          </div>
        </div>
      )}
    </>)
  }
  // 🛟 fallback (nunca mais tela preta): "waiting" sem sala, ou qualquer estado
  // inesperado. Mostra saída em vez de renderizar vazio.
  return wrap(<>
    <div className="text-center space-y-3">
      <div className="text-5xl">⏳</div>
      <p className="font-black text-lg text-white" style={OSWALD}>Carregando a sala…</p>
      <p className="text-white/60 text-sm font-bold">Se demorar, a sala pode ter sido encerrada pelo host.</p>
      <button onClick={() => { clearSavedRoom(); setPhase('menu') }} className="w-full rounded-xl border-[3px] border-black py-3 font-black" style={{ background: GOLD, color: '#000', ...OSWALD }}>🏠 Voltar pras salas</button>
      <button onClick={() => dispatch({ type: 'GO_LOBBY' })} className="text-white/40 text-sm underline w-full">Sair pro início</button>
    </div>
  </>)
}
