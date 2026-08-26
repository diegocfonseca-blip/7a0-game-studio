import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { nomeLivre, NOME_MSG } from './manto'
import { useEsc, listAllCareers } from './store'
import type { PoolCard } from './pyramidseason'
import type { WonCard } from './types'
import { AdminButton, useCanCareerOnline } from './admin'
import { apoioSelo, stripEmoji, APOIO_PERKS, ApoioSheen, myApoioPerk, logout, emailProblema } from './apoio'
import { isMuted } from './sound'
import type { ApoioPerk } from './apoio'
import type { DeckChoice } from './careeronline'
import { DIVISION_TEAMS, CATALOG, CATALOG_EU, CATALOG_WORLD } from './data'
import { lerRegras, resumoRegra, RegrasDaLiga, type LigaRegras } from './ligahub' // ⚖️🏆 regras + sala de troféus moram no LigaHub agora
import { useLigaLiberada, useSalaElencoLiberada, useLibertaLiberada } from './sport' // 👔 Sala de Elenco / 🌎 Libertadores: modos novos, só a conta do Diego enxerga
import type { EscState, FormationKey, DuplaSeat, DuplaCat } from './types'
import { DUPLA_CATS, DUPLA_CAT_LABEL, DUPLA_CAT_ICON, duplaToggleCat } from './types'

// A Escalação usa as mesmas tabelas do Draft (game_rooms/room_players).
// Marcamos a sala como nossa via game_state.__game pra não colidir com o Draft.
const GAME_TAG = 'escalacao'
const MAX_PLAYERS = 20 // a tabela sempre tem 20 times; os que faltam viram bots

type Phase = 'auth' | 'menu' | 'waiting'
type AuthTab = 'login' | 'register'

interface RoomPlayer { user_id: string; manager_name: string; player_index: number; bafo?: BafoTime | null; dupla_partner_of?: string | null; dupla_categories?: Record<string, string> | null; dupla_seek?: 'aberta' | 'privada' | null; dupla_name?: string | null; dupla_request_to?: string | null; dupla_request_at?: string | null }
// 💬 mensagem do chat da sala de espera (uid = quem mandou, pra saber o "meu")
interface LobbyMsg { id: string; uid: string; name: string; text: string }
// 🎈 reação que FLUTUA (sobe e some) na sala de espera — NÃO entra no chat.
// Chat é pra escrever; emoji/zoeira flutua por cima de tudo (inclusive do chat aberto).
interface LobbyFloat { id: string; emoji: string; text?: string; name: string; x: number }
// tier de apoio de um jogador da sala, lido pelo SELO que viaja no nome dele
// (👑 ouro · ⭐ prata · 💎 roxo · ⁣ verde — o do verde é INVISÍVEL de
// propósito, pedido do Diego 17/08: cor sem símbolo nenhum aparecendo) —
// assim TODOS veem a bolinha brilhando, não só o dono
const perkFromName = (n: string): ApoioPerk | null =>
  n.includes('👑') ? APOIO_PERKS.ouro : n.includes('⭐') ? APOIO_PERKS.prata : n.includes('💎') ? APOIO_PERKS.roxo : n.includes('⁣') ? APOIO_PERKS.verde : null
type GS = EscState & { __game?: string; formation?: FormationKey; roomName?: string; locked?: boolean; pwHash?: string; stream?: boolean; manual?: boolean; mode?: 'rapido' | 'carreira' | 'elenco' | 'liga'; ligaAt?: string; ligaRegras?: unknown; ligaAdmins?: string[]; bafoSemCarta?: boolean; deck?: DeckChoice; ligaFechada?: boolean; rivals?: number; rivalTeams?: string[] }
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

// ⚖️🏆 AS REGRAS DA LIGA E A SALA DE TROFÉUS MUDARAM DE CASA (23/08).
// Tudo que era `TrofeusDaLiga` (ranking + sala de troféus + editor de regras)
// virou o **LigaHub** em `ligahub.tsx`, que aparece assim que o PREGÃO ACABA, em
// pílulas: 🏆 Rank · 🏅 Estante · 📜 Temporadas · ⚙️ Ajustes.
// Aqui na ESPERA ficou só o ⚖️ do dono (na faixa verde do próximo jogo), porque a
// regra tem que ser decidida ANTES da bola rolar — depois do pregão não tem volta.
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
      dispatch({ type: 'RESTORE_ONLINE', state: safeGs as EscState, roomId: rd.id, roomCode: rd.code, isHost: amHost, playerIndex: myPl.player_index, youUid: user.id })
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
// ─── 🃏 BAFO · PASSO 1 DO JOGADOR: qual carreira eu trago ───────────────────
// Regra do Diego (17/08): "só permitirá jogar quem tem save com pelo menos 11
// jogadores; se escolher agenciados, com pelo menos 11 também". E o jeito de
// travar é o dele: **não bloqueia a entrada na sala** — a pessoa entra, VÊ o
// porquê e o caminho pra destravar, e simplesmente não fica apta. Levar porta na
// cara no link do amigo é o pior jeito.
// Lê os saves com `listAllCareers()`, o MESMO leitor da tela "Minhas Carreiras" —
// nada de inventar um segundo jeito de achar carreira.
// 🃏 BAFO — o time que o técnico traz da carreira dele, do jeito que viaja pro
// host (coluna `bafo` em room_players; NULL em todos os outros modos).
export interface BafoTime { seed: number; via: 'elenco' | 'convocados'; squad: PoolCard[]; cartas: number; time: string }

// 🃏 carta do COFRE não guarda força (EmpCard só tem nome/clube/ano) — quem tem
// lo/hi é o baralho. Resolve pelo nome, varrendo os três catálogos, que é a
// MESMA fonte que a Copa do Mundo usa pra montar seleção. Carta que não bate em
// nenhum baralho (nome antigo, carta removida) simplesmente não entra: melhor
// faltar jogador e a trava dos 11 avisar do que inventar força e o time jogar
// com um fantasma.
function cartaDoBaralho(nome: string): PoolCard | null {
  for (const cat of [CATALOG, CATALOG_EU, CATALOG_WORLD] as Record<string, { name: string; club: string; year: number; fame: number; lo: number; hi: number }[]>[]) {
    for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
      const c = (cat[pos] ?? []).find(x => x.name === nome)
      if (c) return { id: `bafo-${pos}-${nome}`, name: c.name, club: c.club, year: c.year, pos: pos as PoolCard['pos'], fame: c.fame, lo: c.lo, hi: c.hi, paid: 0 } as PoolCard
    }
  }
  return null
}

// monta o time que vai pro host, a partir da carreira escolhida
function montarBafo(seed: number, via: 'elenco' | 'convocados'): BafoTime | null {
  const slot = listAllCareers().find(c => Number(c.slot.save.seed ?? 0) === seed)
  if (!slot) return null
  const sv = slot.slot.save
  const eu = sv.managers?.[sv.youIdx ?? 0]
  const time = eu?.teamName || eu?.name || 'Meu time'
  // 🚫 perna-de-pau (fake) NUNCA entra — nem pelo elenco, nem pelo álbum da carreira.
  const squad: PoolCard[] = via === 'elenco'
    ? ((eu?.squad ?? []) as PoolCard[]).filter(c => !(c as { fake?: boolean }).fake)
    : (sv.empresarioCards ?? []).map(c => cartaDoBaralho(c.name)).filter((c): c is PoolCard => !!c)
  return { seed, via, squad: squad.slice(0, 22), cartas: (sv.empresarioCards ?? []).length, time }
}

const BAFO_MIN = 11
function BafoEscolha({ escolha, onEscolha }: {
  escolha: { seed: number; via: 'elenco' | 'convocados' } | null
  onEscolha: (e: { seed: number; via: 'elenco' | 'convocados' } | null) => void
}) {
  const lista = listAllCareers()
  const dados = lista.map(({ slot, active }) => {
    const eu = slot.save.managers?.[slot.save.youIdx ?? 0]
    // 🚫 jogador FAKE (perna-de-pau) não conta pra fechar os 11 — regra da casa.
    const elenco = (eu?.squad ?? []).filter(c => !(c as { fake?: boolean }).fake).length
    const cofre = (slot.save.empresarioCards ?? []).length
    return {
      seed: Number(slot.save.seed ?? 0), at: slot.at, active,
      time: eu?.teamName || eu?.name || 'Meu time',
      temporada: slot.save.seasonNo ?? 1,
      div: (slot.save.careerPlacements?.['m' + (eu?.id ?? 0)] as string) ?? slot.save.careerDivision ?? 'D',
      elenco, cofre,
    }
  }).sort((a, b) => b.at - a.at)
  const sel = dados.find(d => d.seed === escolha?.seed) ?? null

  return (
    <div className="border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `4px 4px 0 ${INK}` }}>
      <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-1">🃏 Bafo · seu time</p>
      <p className="text-black/55 text-[11px] font-bold leading-snug mb-3">
        Aqui não tem leilão: você traz o time de uma carreira sua. <b>A carreira que entra é a que joga e é a que paga</b> — se rolar Bafo, a carta sorteada sai do <b>álbum de cartas dessa carreira</b> (não do seu álbum todo).
      </p>

      {/* 🚪 QUEM NÃO PODE JOGAR SÓ VÊ O CONVITE (decisão do Diego, 17/08): nada de
          elenco emprestado nem de time sorteado. São dois casos, e cada um tem o
          SEU caminho escrito — nunca uma porta fechada sem saída:
          1) nunca começou carreira    → convite pra começar;
          2) começou, mas nenhuma tem 11 no elenco NEM 11 no cofre → convite pra
             completar o time (e o que falta em cada uma aparece na lista abaixo). */}
      {dados.length === 0 ? (
        <div className="border-[2.5px] border-dashed border-black rounded-xl p-3" style={{ background: '#FFF1E8' }}>
          <p className="font-black text-[13px] text-black" style={OSWALD}>🪜 Comece uma carreira pra jogar o Bafo</p>
          <p className="text-black/60 text-[11px] font-bold leading-snug mt-1">
            Aqui não tem leilão: o time que entra é o que <b>você montou na sua carreira</b>. Toque em <b>Carreira</b> no menu e jogue uma temporada — depois é só voltar pra sala com o mesmo código. <b>Você pode ficar assistindo</b> esta partida.
          </p>
        </div>
      ) : dados.every(d => d.elenco < BAFO_MIN && d.cofre < BAFO_MIN) && (
        <div className="border-[2.5px] border-dashed border-black rounded-xl p-3" style={{ background: '#FFF1E8' }}>
          <p className="font-black text-[13px] text-black" style={OSWALD}>🧩 Falta completar o time</p>
          <p className="text-black/60 text-[11px] font-bold leading-snug mt-1">
            Nenhuma carreira sua chegou nos <b>{BAFO_MIN} jogadores</b> ainda — nem no elenco, nem no álbum de cartas da carreira. Jogue mais uma temporada (o elenco cresce) ou ganhe mais cartas nessa carreira. <b>Você fica na sala assistindo</b>, e na próxima já entra.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {dados.map(d => {
          const podeElenco = d.elenco >= BAFO_MIN
          const podeCofre = d.cofre >= BAFO_MIN
          const travado = !podeElenco && !podeCofre
          const escolhida = escolha?.seed === d.seed
          return (
            <div key={d.seed}
              className="rounded-xl p-3"
              style={{ border: `${escolhida ? 3 : 2.5}px ${travado ? 'dashed' : 'solid'} ${escolhida ? GREEN : INK}`,
                background: travado ? '#FFF1E8' : escolhida ? '#EFF9F2' : '#fff',
                boxShadow: `2.5px 2.5px 0 0 ${escolhida ? GREEN : INK}` }}>
              <div className="flex items-center gap-2">
                <span className="font-black text-[14.5px] text-black flex-1 truncate" style={OSWALD}>{d.time}</span>
                {d.active && <span className="text-[9px] font-black uppercase border-2 border-black rounded-md px-1.5" style={{ background: GOLD, color: INK, ...OSWALD }}>última</span>}
                <span className="text-[15px]">{travado ? '🔒' : escolhida ? '✅' : '○'}</span>
              </div>
              <p className="text-black/55 text-[10.5px] font-bold mt-1">
                Série {d.div} · Temporada {d.temporada} · <b className="text-black">{d.elenco} jogadores</b> no elenco · <b className="text-black">{d.cofre} cartas</b> no álbum
              </p>
              {travado ? (
                <p className="text-[10.5px] font-bold leading-snug mt-2" style={{ color: '#8E2A1B' }}>
                  ⚠️ Precisa de {BAFO_MIN} pra entrar — você tem {d.elenco} no elenco e {d.cofre} no álbum desta carreira. Jogue mais uma temporada ou ganhe mais cartas nesta carreira.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => onEscolha(escolhida && escolha?.via === 'elenco' ? null : { seed: d.seed, via: 'elenco' })}
                    disabled={!podeElenco}
                    className="border-[2.5px] border-black rounded-xl py-2 font-black text-[11.5px] active:translate-y-0.5"
                    style={{ background: escolhida && escolha?.via === 'elenco' ? GREEN : '#fff', color: escolhida && escolha?.via === 'elenco' ? '#fff' : '#000', opacity: podeElenco ? 1 : 0.4, ...OSWALD }}>
                    👔 Elenco{!podeElenco && <span className="block text-[8.5px]">só {d.elenco}</span>}
                  </button>
                  <button onClick={() => onEscolha(escolhida && escolha?.via === 'convocados' ? null : { seed: d.seed, via: 'convocados' })}
                    disabled={!podeCofre}
                    className="border-[2.5px] border-black rounded-xl py-2 font-black text-[11.5px] active:translate-y-0.5"
                    style={{ background: escolhida && escolha?.via === 'convocados' ? GREEN : '#fff', color: escolhida && escolha?.via === 'convocados' ? '#fff' : '#000', opacity: podeCofre ? 1 : 0.4, ...OSWALD }}>
                    🧢 Convocar 22{!podeCofre && <span className="block text-[8.5px]">só {d.cofre}</span>}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 border-[2.5px] border-black rounded-xl px-3 py-2 text-center"
        style={{ background: sel ? GREEN : '#fff' }}>
        <p className="font-black text-[12.5px]" style={{ color: sel ? '#fff' : 'rgba(0,0,0,.5)', ...OSWALD }}>
          {sel ? `✅ Apto — ${sel.time} ${escolha?.via === 'elenco' ? '(elenco)' : '(convocados)'}` : '⏳ Montando — escolha a carreira e como entra'}
        </p>
      </div>
    </div>
  )
}

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
  // 👔🃏 SALA DE ELENCO (17/08): 3º modo — em vez de leiloar, cada um traz o time
  // da PRÓPRIA carreira. EM CONSTRUÇÃO: só a conta do Diego vê o botão (sport.ts).
  const salaElenco = useSalaElencoLiberada()
  const [roomMode, setRoomMode] = useState<'rapido' | 'liga' | 'carreira' | 'elenco'>('rapido')
  // 🏆 LIGA FECHADA (20/08): a sala que fica de pé. O que ela guarda a mais que
  // uma sala rápida é só ISTO — quando vocês jogam e se tem bot. O resto (leilão,
  // temporada, fim de jogo) é o rápido de sempre, sem uma linha diferente.
  const hoje = new Date()
  const emDias = (n: number) => new Date(hoje.getTime() + n * 864e5).toISOString().slice(0, 10)
  const [ligaData, setLigaData] = useState(emDias(1)) // amanhã, pra já vir preenchido
  const [ligaHora, setLigaHora] = useState('21:00')
  const [ligaComBots, setLigaComBots] = useState(false) // liga fechada nasce SEM bot
  // 🃏 BAFO: qual carreira eu trago e como entro. Fica no aparelho por enquanto —
  // mandar os 22 pro host é o passo seguinte.
  const [bafoEscolha, setBafoEscolha] = useState<{ seed: number; via: 'elenco' | 'convocados' } | null>(null)
  // 🤝 DUPLAS (beta): 2 pessoas dividindo o comando de UM time. Escolha da SALA,
  // na criação — sala Solo é a de sempre e não muda em nada. Por enquanto só no
  // Rápido: a Carreira online tem caixa/temporada por técnico e merece um passo
  // próprio depois que as duplas rodarem no pregão.
  const [roomDuplas, setRoomDuplas] = useState(false)
  // 🤝 é sala de duplas? Perguntado DIRETO ao banco quando entro na sala de
  // espera. A lista de salas é "magra" (só baixa alguns campos pra não pesar),
  // então confiar só no objeto que veio dela já fez a tela achar que uma sala de
  // duplas era normal — foi o bug do "não aparece o botão".
  const [duplasSala, setDuplasSala] = useState<boolean | null>(null)
  const careerDeck: DeckChoice = 'both' // carreira: sempre BR + Europa juntos (preenche os 80 times das 4 divisões)
  const [rapidoDeck, setRapidoDeck] = useState<DeckChoice>('br') // rápido online: host escolhe o baralho (BR / Europa / os dois)
  const [rapidoVarzea, setRapidoVarzea] = useState(false) // 🥅 rápido online + BR: categoria "Sem craques" (várzea) — só bom jogador + foi profissional
  // 🃏 BAFO: o host decide se a partida vale carta (padrão) ou se é amistoso.
  // Ausente/antigo = VALENDO — é a identidade do modo; só o "não" é gravado.
  const [bafoValendo, setBafoValendo] = useState(true)
  const [bafoAviso, setBafoAviso] = useState(false) // 🃏 banner "ainda tem gente montando" (host)
  const [rapidoCopaMode, setRapidoCopaMode] = useState<'liga' | 'liga_copa' | 'liga_liberta'>('liga_copa') // 🏆 rápido online: liga só, liga + Copa dos 8 (padrão) ou liga + Libertadores
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
  // 🚪 QUEM ENTRA NA LIGA — mudou em 22/08, por decisão do Diego. Antes (regra de
  // 19/08) só Lenda/dono de batismo ENTRAVA. Ele reviu: *"vamos supor q só qm pode
  // criar e o lenda"* e, mais cedo, *"qm entra se tiver aberta pode ser qlqr um"*.
  // Faz sentido: quem paga é dono da liga; os amigos dele só precisam ser
  // convidados. Cobrar de quem só quer jogar espantava a turma inteira.
  // Pra voltar ao que era: `true` aqui.
  const LIGA_SO_LENDA_ENTRA = false
  const ligaOn = useLigaLiberada() // 🏆 modo Liga: em construção, só a conta do Diego
  const libertaOn = useLibertaLiberada() // 🌎 Libertadores: em construção, só a conta do Diego
  const [myLigas, setMyLigas] = useState<OpenRoom[]>([])
  // 🏆 SELETOR "Aberta × Liga Fechada" — DESENHO RECUSADO, NÃO RELIGAR.
  // ⚠️ Recado pras próximas sessões (e pra mim mesmo, que errei nisso em 22/08):
  // isto NÃO é uma feature esquecida esperando ser ligada. É o RESTO do desenho
  // ANTIGO, em que a Liga Fechada era um detalhezinho da sala rápida. O Diego
  // cortou esse desenho em 20/08, com estas palavras: *"tem q ser rápido, liga
  // fechada, carreira e bafo"* — ou seja, **Liga Fechada é MODO DE JOGO**, na
  // mesma fileira do Rápido/Carreira/Bafo, e é isso que está em
  // `scripts/mockup-liga-fechada.mjs` (o mockup que ele aprovou).
  // O modo de verdade JÁ EXISTE e funciona: `roomMode === 'liga'` (trava
  // `useLigaLiberada`), com data/hora marcada, o dono mandando nos troféus e o
  // SEU PRÓPRIO seletor de bots ("🤖 Bots na tabela").
  // Em 22/08 eu liguei este resto por engano e o Diego pegou na hora: *"mostra
  // duas vezes sobre bots ou não ao criar a sala e qd eu crio tá mt diferente do
  // mockup"*. Estava certo — a seção "A partida" aparece TAMBÉM no modo Liga, e
  // as duas perguntas de bot caíam na mesma tela.
  // Fica assim pra sempre. Quem for mexer em Liga Fechada, mexe no MODO.
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
  // 🚪 códigos das salas que estão travando a criação (ver a trava mais abaixo)
  const [salasPresas, setSalasPresas] = useState<string[]>([])
  const [encerrando, setEncerrando] = useState(false)
  const encerrarSalasPresas = async () => {
    if (!salasPresas.length) return
    setEncerrando(true)
    // apaga só as MINHAS (o filtro por host_id é a trava — ninguém encerra sala
    // de outro), e só as que estavam travando.
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('game_rooms').delete().eq('host_id', user.id).in('code', salasPresas).then(() => {}, () => {})
    }
    setSalasPresas([]); setRoomError(''); setEncerrando(false)
  }
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
  const [nameErr, setNameErr] = useState('') // 🔒 nome único: aviso quando o nome já tem dono
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
    // 📉 ECO REMOVIDO (04/08, OK do Diego): mandava em 'chat' E 'emote' (dobro de
    // mensagem Realtime na fatura). Agora só 'chat'; o OUVINTE de 'emote' fica
    // (mensagem de aba antiga ainda aparece pra todo mundo). Aba muito antiga
    // deixa de ver as novas até dar F5 — custo aceito.
    lobbyChanRef.current?.send({ type: 'broadcast', event: 'chat', payload: e })
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
      // 🐊☀️ os dois que o Diego mandou em 25/08. A `dur` é a duração REAL medida no
      // arquivo (ffprobe) — ela é a trava de "um som por vez na sala", então chutar
      // pra menos deixaria dois áudios tocando por cima um do outro.
      jacare: { file: 'jacare.mp3', dur: 5800, emoji: '🐊', balao: 'soltou o áudio do jacaré 🐊🔊' }, // 26/08: o Diego trocou o arquivo (era 1min06, agora 5,7s)
      bomdia: { file: 'bom-dia.mp3', dur: 27700, emoji: '☀️', balao: 'mandou um BOM DIA pra sala ☀️🔊' },
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
      // 🩹 SALA PRESA: diz que COMEÇOU mas não tem jogo nenhum dentro (nenhum
      // técnico montado). Acontecia quando o aviso do banco se perdia entre marcar
      // "começou" e montar a partida — e deixava a sala num beco sem saída: sem
      // botão de abrir o pregão (a sala já "começou") e sem partida pra voltar.
      // Foi o que travou a liga do Diego em 22/08. Aqui a sala é tratada como se
      // ainda estivesse ESPERANDO, e o dono consegue abrir o pregão de novo.
      // ⏱️ só depois de 20s parada: nos primeiros segundos de um início NORMAL o
      // estado ainda não subiu, e confundir os dois faria alguém remontar por cima
      // de uma partida de verdade.
      const semJogo = (rd.game_state?.managers?.length ?? 0) === 0
        && Date.now() - new Date(rd.updated_at ?? 0).getTime() > 20_000
      if (rd.status === 'started' && !semJogo) {
        // partida em andamento: NÃO entra direto. Confirma que ainda sou da
        // sala e mostra a pergunta "voltar pra partida ou sair" no menu.
        const { data: mySlot } = await supabase.from('room_players').select('user_id').eq('room_id', rd.id).eq('user_id', user.id).maybeSingle()
        if (!mySlot) { clearSavedRoom(); return }
        setResumeRoom(rd)
        return
      }
      if (rd.status === 'started' && semJogo) {
        // desfaz a marca errada pra o botão voltar (e pra sala não ficar "em jogo"
        // na lista de todo mundo, enganando quem tenta entrar).
        await supabase.from('game_rooms').update({ status: 'waiting' }).eq('id', rd.id)
          .eq('status', 'started').then(() => {}, () => {})
        rd.status = 'waiting'
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
    fetchMyCareers(); fetchMyLigas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, user])

  // carrega a lista ao abrir "Salas abertas" e ATUALIZA sozinha a cada 8s (era
  // 5s — corte de consumo 04/08, OK do Diego; sala nova aparece ~3s "depois",
  // e o botão 🔄 continua atualizando na hora pra quem tiver pressa).
  useEffect(() => {
    if (phase !== 'menu' || tab !== 'open') return
    fetchOpenRooms()
    const iv = setInterval(() => fetchOpenRooms(true), 8000)
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
  // 🧯 já montei o jogo desta sala? (guarda contra montar DUAS vezes quando o
  // início direto do host e o eco do banco chegam juntos)
  const jaIniciouRef = useRef<string | null>(null)
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
        youUid: user.id, // 🤝 crachá da dupla (local a este aparelho)
      })
      return true
    }
    if (!allowFresh) return false // reconexão sem estado salvo ainda: não recomeça
    if (jaIniciouRef.current === roomData.id) return true // já montei esta sala agora há pouco
    // SEGURANÇA (mesmo se uma vaga duplicada escapou): um assento por usuário.
    // Deduplica de forma DETERMINÍSTICA (mesma ordem em todo cliente) e usa a
    // POSIÇÃO na lista como número do técnico — o time é montado pela posição, não
    // pelo índice cru do banco. Assim ninguém vira dois times nem "veste" o assento
    // errado. No caso normal (host já limpou) isto não muda nada.
    const seenU = new Set<string>()
    // 🤝 DUPLA: só quem é DONO de assento vira time. A linha do parceiro é carona
    // (ela tem dupla_partner_of) e não pode entrar na contagem de técnicos, senão
    // a lista de nomes desalinha e todo mundo pega o time do vizinho.
    // 🛟 parceiro ÓRFÃO (o dono saiu/foi removido no último segundo) conta como
    // DONO do próprio time — senão ele entraria na partida sem time nenhum.
    const temDono = (uid?: string | null) => !!uid && sorted.some(d => d.user_id === uid && !d.dupla_partner_of)
    const donos = sorted.filter(p => !temDono(p.dupla_partner_of))
    const uniq = donos.filter(p => (seenU.has(p.user_id) ? false : (seenU.add(p.user_id), true)))
    // se EU sou o parceiro, meu assento é o do meu dono (o time é o mesmo).
    // 🛟 rede de segurança: se o meu dono não está mais na sala (saiu/foi
    // removido bem na hora), eu NÃO fico sem time — viro time próprio.
    const meuDonoUid = temDono(myPl.dupla_partner_of) ? myPl.dupla_partner_of! : user.id
    const myPos = uniq.findIndex(p => p.user_id === meuDonoUid)
    // monta o mapa das duplas na chave que o jogo usa: a POSIÇÃO na lista, que é
    // exatamente o id do técnico humano montado pelo motor.
    const duplasMode = !!(gs as GS & { duplasMode?: boolean })?.duplasMode
    const duplas: Record<number, DuplaSeat> = {}
    if (duplasMode) {
      uniq.forEach((dono, i) => {
        const par = sorted.find(p => p.dupla_partner_of === dono.user_id && p.user_id !== dono.user_id)
        duplas[i] = {
          ownerUid: dono.user_id, ownerName: dono.manager_name,
          ...(par ? { partnerUid: par.user_id, partnerName: par.manager_name } : {}),
          ...(dono.dupla_categories ? { cats: dono.dupla_categories as DuplaSeat['cats'] } : {}),
        }
      })
    }
    jaIniciouRef.current = roomData.id
    dispatch({
      type: 'START_ONLINE',
      roomId: roomData.id, roomCode: roomData.code,
      roomName: gs?.roomName,
      isHost: amHost,
      playerIndex: myPos >= 0 ? myPos : myPl.player_index,
      // 🏷️ time de dupla entra com o nome dos DOIS (escolhido ou automático);
      //    time de uma pessoa só continua com o nome dela, como sempre.
      playerNames: uniq.map(p => {
        if (!duplasMode) return p.manager_name
        const par = sorted.find(x => x.dupla_partner_of === p.user_id && x.user_id !== p.user_id)
        if (!par) return p.manager_name
        const corta = (n: string) => { const c = n.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '').trim(); return c.length > 11 ? c.slice(0, 11).trim() : c }
        return (p.dupla_name || `${corta(p.manager_name)}|${corta(par.manager_name)}`)
      }),
      duplasMode, duplas: duplasMode ? duplas : undefined, youUid: user.id,
      formation: gs?.formation ?? '4-3-3',
      stream: !!gs?.stream,
      manual: !!gs?.manual, // 🎮 sala manual: host controla o ritmo (botão manual/auto no jogo)
      chatOff: !!gs?.chatOff, // 💬 chat ligado/desligado (escolha do host na criação)
      auctionSecs: gs?.auctionSecs, // ⏱️ tempo do leilão (undefined=45s · N=N seg · 0=host avança)
      deck: gs?.deck ?? 'br', // carreira = 'both'; rápido = escolha do host (br/eu/both)
      varzea: !!gs?.varzea, // 🥅 rápido + BR, categoria "Sem craques" (só bom jogador + foi profissional)
      career: gs?.mode === 'carreira',
      // 🃏 BAFO: os times que cada técnico trouxe da carreira dele. A chave é a
      // POSIÇÃO na lista (uniq), que é exatamente o id do manager humano lá dentro
      // — a mesma amarração que as duplas usam. Errar isso é o bug clássico da
      // casa ("virei bot", "dei lance por outro"), então vai pelo índice da MESMA
      // lista que monta os playerNames, nunca por player_index do banco.
      bafo: gs?.mode === 'elenco' ? (() => {
        const out: Record<number, WonCard[]> = {}
        uniq.forEach((p, i) => {
          const sq = (p as RoomPlayer & { bafo?: BafoTime | null }).bafo?.squad
          if (sq && sq.length >= 11) out[i] = sq as unknown as WonCard[]
        })
        return out
      })() : undefined,
      // 🃏 e QUEM é o dono de cada time: a conta e a carreira que ele trouxe. É
      // o que a cascata do fim usa pra tirar a carta da carreira CERTA e pôr na
      // carreira CERTA — pela MESMA posição na lista (uniq), nunca por outra.
      bafoDonos: gs?.mode === 'elenco' ? (() => {
        const out: Record<number, { uid: string; seed: number; via: 'elenco' | 'convocados' }> = {}
        uniq.forEach((p, i) => {
          const b = (p as RoomPlayer & { bafo?: BafoTime | null }).bafo
          if (b && (b.squad?.length ?? 0) >= 11) out[i] = { uid: p.user_id, seed: b.seed, via: b.via }
        })
        return out
      })() : undefined,
      // 🃏 valendo carta? Só o "não" viaja gravado — sala antiga/sem o campo é
      //    VALENDO, que é como o modo foi desenhado.
      bafoValendo: gs?.mode === 'elenco' ? !gs?.bafoSemCarta : undefined,
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
    setLoading(true); setNameErr('')
    // 🔒 nome único (tipo @ do Instagram): manter o próprio nome passa; nome de
    // outra conta ou de clube de batismo alheio, não.
    const atual = stripEmoji((user?.user_metadata?.display_name as string | undefined) ?? '').trim()
    if (nm.toLowerCase() !== atual.toLowerCase()) {
      const chk = await nomeLivre(nm)
      if (!chk.livre) { setNameErr(NOME_MSG[chk.motivo ?? 'em_uso']); setLoading(false); return }
    }
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
        if (!displayName.trim()) { setAuthError('Escolha o nome do seu time.'); setLoading(false); return }
        // ✉️ trava anti-bounce: e-mail com cara de erro de digitação/temporário não cadastra
        const prob = emailProblema(email)
        if (prob) { setAuthError(prob); setLoading(false); return }
        // 🔒 nome único (tipo @ do Instagram): não deixa cadastrar com nome que já tem dono
        const chk = await nomeLivre(stripEmoji(displayName).trim())
        if (!chk.livre) { setAuthError(NOME_MSG[chk.motivo ?? 'em_uso']); setLoading(false); return }
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: stripEmoji(displayName).trim() } } })
        setAuthError(error ? friendlyAuthErr(error.message) : '✅ Conta criada! Guarde bem esse e-mail — é ele que recupera sua senha.')
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
    // ✉️ trava anti-bounce: não manda link pra endereço com cara de erro (voltaria)
    const prob = emailProblema(em)
    if (prob) { setAuthError(prob); return }
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
    // 🧯 TETO DE 2 SALAS RÁPIDAS ABERTAS (Diego 23/08: *"limite pode ser duas sim"*).
    // Por que: criar sala rápida NUNCA teve limite, e o banco mostrou o estrago —
    // 484 salas guardadas, 68% paradas há mais de um dia, uma pessoa só criou 20
    // numa semana e 52% das salas ninguém apareceu. Metade da lista de "Salas
    // Abertas" era sala morta, e quem chegava novo achava que o jogo estava vazio.
    // ⚠️ SÓ CONTA SALA VIVA (mexida nas últimas 3h). Sem isso, a sala que a pessoa
    // abandonou meses atrás travaria a conta dela PRA SEMPRE — uma trava que não
    // tem como destravar é pior que o problema que ela resolve.
    // A liga tem o teto dela (2 ligas, mais abaixo) e não entra nesta conta; a
    // carreira também não, porque ela é um SAVE, não uma sala de encontro.
    if (roomMode === 'rapido' || roomMode === 'elenco') {
      const vivasDesde = new Date(Date.now() - 3 * 3600_000).toISOString()
      const { data: minhas } = await supabase.from('game_rooms')
        .select('code, game_state->>mode')
        .eq('host_id', user.id).gt('updated_at', vivasDesde)
      const abertas = ((minhas ?? []) as { code: string; mode: string | null }[])
        .filter(r => r.mode !== 'liga' && r.mode !== 'carreira')
      if (abertas.length >= 2) {
        // 🚪 O CAMINHO PRA DESTRAVAR, ALI MESMO (bug que o Diego relatou 24/08:
        // *"o usuário não estava mais com sala aberta e apareceu esse erro"*).
        // A CAUSA: ao sair da sala, o último save do host BATE o updated_at — ou
        // seja, abandonar a sala a deixa marcada como VIVA bem na hora em que ela
        // deixa de existir pra pessoa. Pelas 3h seguintes ela conta na trava, e
        // quem fechou a aba não tem como saber disso.
        // Enquanto o batimento não é reescrito (mexer nele é arriscado no meio de
        // partida ao vivo), a trava passa a EXPLICAR e a DESTRAVAR na mesma tela:
        // um toque encerra as salas paradas, sem precisar entrar em cada uma.
        setSalasPresas(abertas.map(r => r.code))
        setRoomError(`Você já tem 2 salas abertas (${abertas.map(r => r.code).join(' e ')}) — é o máximo por pessoa, pra lista de salas não encher de sala vazia. Se você já saiu delas, é só encerrar aqui embaixo.`)
        setLoading(false); return
      }
    }
    let code = randCode()
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from('game_rooms').select('id').eq('code', code).maybeSingle()
      if (!data) break; code = randCode()
    }
    // 🏆 no modo Liga o padrão é "Liga do Fulano" (não "Sala do Fulano"): é o nome
    // que aparece no card de "Minhas ligas" e na sala de troféus, temporada após
    // temporada. O campo fica no quadro da liga, lá na criação.
    const name = cutName(roomName.trim() || `${roomMode === 'liga' ? 'Liga' : 'Sala'} do ${nameOf()}`)
    // sala fechada: exige uma senha
    if (roomLocked && !roomPw.trim()) { setRoomError('Digite uma senha ou desmarque "sala fechada".'); setLoading(false); return }
    const locked = roomLocked && !!roomPw.trim()
    const pwHash = locked ? hashPw(roomPw.trim().toLowerCase()) : undefined // sem diferenciar maiúsculas
    const carreira = canCareer && roomMode === 'carreira'
    // 👔 Sala de Elenco: NÃO tem Copa (decisão do Diego 17/08 — "não terá copa,
    // será apenas divisão de 38 rodadas nesse modo"). Por isso entra com
    // copaMode:'liga' TRAVADO, e o seletor de Copa nem aparece na criação.
    const elenco = salaElenco && roomMode === 'elenco'
    // 🏆 LIGA FECHADA: por baixo é a MESMA sala rápida — o que ela leva a mais é
    // o horário marcado (`ligaAt`) e o `mode: 'liga'`, que é o que faz ela não
    // sumir da lista e ganhar a sala de troféus na espera. Sem bot = a liga
    // fechada que o jogo já sabia fazer (`ligaFechada`).
    const liga = ligaOn && roomMode === 'liga'
    // 👑 CRIAR LIGA É SÓ DO LENDA — e até 22/08 isso NÃO estava travado de verdade:
    // o código só olhava `ligaOn` (quem enxerga o modo), nunca o tier. Como enxergar
    // era privilégio da conta do Diego, ninguém tinha notado; na hora de abrir pra
    // todos, qualquer um criaria liga. Trava explícita, com o porquê e o caminho —
    // e é ela que o Diego quer VER com a 2ª conta dele.
    if (liga && !canLiga) {
      setRoomError('🏆 Criar uma Liga é benefício do 👑 Lenda — é a liga que fica de pé, com a sala de troféus guardando campeão e artilheiro temporada após temporada. Pra jogar numa liga você NÃO precisa ser Lenda: peça o código pra quem criou. Pra criar a sua, vire Lenda em "Apoiar".')
      setLoading(false); return
    }
    const ligaAt = liga ? new Date(`${ligaData}T${ligaHora}`).toISOString() : undefined
    const gs = { __game: GAME_TAG, formation, roomName: name, ...(locked ? { locked: true, pwHash } : {}), ...(roomStream ? { stream: true } : {}), ...((roomManual && !carreira) ? { manual: true } : {}), ...(roomChat ? {} : { chatOff: true }), ...(roomStream && auctionSecs !== 45 ? { auctionSecs } : {}), ...(carreira ? { mode: 'carreira', deck: careerDeck, rivals: careerRivals, rivalTeams: careerRivalPicks } : { deck: rapidoDeck, ...(elenco ? { mode: 'elenco', copaMode: 'liga', ...(bafoValendo ? {} : { bafoSemCarta: true }) } : { copaMode: rapidoCopaMode }), ...(rapidoDeck === 'br' && rapidoVarzea ? { varzea: true } : {}), ...(liga ? { mode: 'liga', ligaAt, ligaFechada: !ligaComBots } : {}), ...(roomDuplas ? { duplasMode: true } : {}) }) }
    // 🧯 TETO DE 2 LIGAS POR PESSOA (Diego, 20/08: *"ele só pode criar duas ligas
    // por usuário; pra criar mais tem que excluir outra"*). Liga é sala que fica
    // de pé pra sempre — sem teto, uma pessoa sozinha encheria o banco de ligas
    // abandonadas. O aviso diz o número e o caminho pra destravar.
    if (liga) {
      const { count } = await supabase.from('game_rooms')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', user.id).eq('game_state->>mode', 'liga')
      if ((count ?? 0) >= 2) {
        setRoomError('Você já tem 2 ligas — é o máximo por pessoa. Pra criar outra, entre numa delas em "🏆 Minhas ligas" e use "🗑️ Excluir a liga".')
        setLoading(false); return
      }
    }
    const { data: rd, error: re } = await supabase.from('game_rooms')
      .insert({ code, host_id: user.id, mode: 'leilao', status: 'waiting', max_players: roomDuplas ? MAX_PLAYERS * 2 : MAX_PLAYERS, game_state: gs })
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
      .select('id, code, host_id, max_players, status, updated_at, gname:game_state->>roomName, gdeck:game_state->>deck, gvarzea:game_state->>varzea, gmode:game_state->>mode, gat:game_state->>ligaAt, gcareer:game_state->>careerOnline, gmanual:game_state->>manual, gcopa:game_state->>copaMode, gliga:game_state->>ligaFechada, glocked:game_state->>locked, gstream:game_state->>stream, gpw:game_state->>pwHash, gchat:game_state->>chatOff, gduplas:game_state->>duplasMode')
      .in('status', ['waiting', 'started'])
      .eq('game_state->>__game', GAME_TAG)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50)
    type SlimRow = { id: string; code: string; host_id: string; max_players: number; status: string; updated_at?: string; gname: string | null; gdeck: string | null; gvarzea: string | null; gmode: string | null; gat: string | null; gcareer: string | null; gmanual: string | null; gcopa: string | null; gliga: string | null; glocked: string | null; gstream: string | null; gpw: string | null; gchat: string | null; gduplas: string | null }
    const list: RoomInfo[] = ((rooms ?? []) as unknown as SlimRow[]).map(r => ({
      id: r.id, code: r.code, host_id: r.host_id, max_players: r.max_players, status: r.status, updated_at: r.updated_at,
      game_state: { __game: GAME_TAG, roomName: r.gname ?? undefined, deck: (r.gdeck ?? undefined) as GS['deck'], varzea: r.gvarzea === 'true' || undefined, mode: (r.gmode ?? undefined) as GS['mode'], ligaAt: r.gat ?? undefined, careerOnline: r.gcareer === 'true' || undefined, manual: r.gmanual === 'true' || undefined, copaMode: (r.gcopa ?? undefined) as GS['copaMode'], ligaFechada: r.gliga === 'true' || undefined, locked: r.glocked === 'true' || undefined, stream: r.gstream === 'true' || undefined, pwHash: r.gpw ?? undefined, chatOff: r.gchat === 'true' || undefined, duplasMode: r.gduplas === 'true' || undefined } as GS,
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
    // 🃏 BAFO também fica FORA da lista pública enquanto está em construção —
    // mesmo tratamento da carreira online. Quem tem o modo liberado vê normal.
    const isBafo = (r: RoomInfo) => r.game_state?.mode === 'elenco' && !salaElenco
    // 🏆 A LIGA AGORA APARECE NA LISTA (mudou em 22/08, com o Diego olhando ao vivo:
    // *"o Neymarzetti botou sala aberta e msm se fosse fechada deveria aparecer"*).
    // A regra velha (19/08) escondia a liga de todo mundo, e naquela época fazia
    // sentido: só Lenda ENTRAVA. Hoje a regra é outra — **só CRIAR é do Lenda,
    // entrar é de qualquer um**. Com a entrada aberta, esconder a sala só servia pra
    // ninguém achar a liga do amigo. Ela entra marcada com o selo 🏆 LIGA e o dia
    // marcado, pra não se confundir com sala rápida.
    // 🔒 ...MAS SÓ PRA QUEM TEM O MODO LIGA LIBERADO. Furo que o Diego pegou com uma
    // pergunta, minutos depois de eu subir isto: *"mas hj só o secundário q vai ver
    // né a sala aberta ne"*. Eu tinha tirado a liga da lista SEM pôr nada no lugar —
    // ou seja, JOGADOR NENHUM tinha o modo, e todos veriam a liga do Diego na lista
    // e (com a entrada liberada) entrariam nela. Enquanto a Liga está em construção
    // (`LIGA_GERAL = false`), ela só aparece pra quem enxerga o modo. Quando abrir
    // pra todos, `ligaOn` vira true pra todo mundo e a linha continua valendo.
    const isLiga = (r: RoomInfo) => r.game_state?.mode === 'liga'
    // 🏆 A LIGA VAZIA CONTINUA NA LISTA (Diego 22/08: ele marcou a liga, entrou antes
    // da hora com a 2ª conta, os dois saíram, e a liga sumiu da lista — *"ainda nem
    // bateu 21h tb"*). As duas regras de "sala viva" (ter gente dentro e ter batimento
    // recente) foram feitas pra SALA RÁPIDA, onde sala vazia é sala abandonada. A liga
    // é o contrário: ela nasce pra ficar de pé com todo mundo fora, e entre um jogo e
    // outro estará SEMPRE vazia — exigir gente dentro anulava a data marcada.
    // O que mantém a liga viva é o RELÓGIO: ela fica na lista enquanto a data marcada
    // não passou (com 6h de folga depois, pra quem atrasa). Passou, sai da lista
    // sozinha — e continua inteira, com os troféus, no "🏆 Minhas ligas" do dono.
    // Liga sem data marcada segue a regra antiga (precisa de gente dentro).
    const ligaNaAgenda = (r: RoomInfo) => {
      const at = (r.game_state as GS)?.ligaAt
      if (!isLiga(r) || !at) return false
      const t = new Date(at).getTime()
      return !isNaN(t) && Date.now() < t + 6 * 3600_000
    }
    setOpenRooms(list.map(r => ({ ...r, count: counts[r.id] ?? 0 }))
      .filter(r => (r.count >= 1 || ligaNaAgenda(r)) && (r.status === 'started' ? isFresh(r) : (waitingAlive(r) || ligaNaAgenda(r))) && !isCareer(r) && !isBafo(r) && (ligaOn || !isLiga(r)))
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'waiting' ? -1 : 1)))
    setListLoading(false)
  }

  // saves de CARREIRA ONLINE: salas em andamento onde EU participo — como host
  // (crio/continuo) OU como membro (volto quando o host retomar). A vaga do save
  // persiste mesmo depois de sair, então o amigo também vê e volta.
  // 📅 como a data marcada aparece pra quem joga: dia da semana + hora, e o quanto
  // falta em português de gente ("é HOJE", "amanhã", "faltam 3 dias"). Liga cuja
  // data já passou não some — vira "já passou", porque a sala continua valendo e
  // o dono pode remarcar.
  // ✏️ O DONO MANDA NA LIGA (peça 3.5): mudar o dia/hora, trocar com/sem bots e
  // excluir. Tudo dentro da própria sala, que é onde a pessoa está quando lembra
  // de remarcar.
  const [ligaEdit, setLigaEdit] = useState(false)
  const [ligaRegrasAberto, setLigaRegrasAberto] = useState(false) // ⚖️ painel de regras do ranking, na espera (só o dono)
  // 👑 só o DONO manda na liga (Diego 23/08: *"só quem manda é o host mesmo, não
  // tem adm não"*). Antes um "adm" da lista `ligaAdmins` também mandava; a lista
  // ficou no banco pra não quebrar liga antiga, mas NÃO dá mais poder nenhum.
  const mandaNaLiga = !!user && !!room && room.host_id === user.id
  // ✏️ editor do card de "Minhas ligas" (edição POR FORA): guarda o id da liga
  // aberta pra edição e os 4 campos que dá pra mudar sem entrar na sala.
  const [cardEdit, setCardEdit] = useState<string | null>(null)
  const [cardNome, setCardNome] = useState('')
  const [cardData, setCardData] = useState('')
  const [cardHora, setCardHora] = useState('')
  const [cardBots, setCardBots] = useState(false)
  const [ligaEditData, setLigaEditData] = useState('')
  const [ligaEditHora, setLigaEditHora] = useState('')
  // Mexe SÓ nos campos da liga dentro do game_state, sem reescrever o resto: o
  // estado da sala pode ser o JOGO INTEIRO, e sobrescrever seria perder tudo.
  // Por isso lê, junta e grava.
  // Salva pela FUNÇÃO do banco (`liga_patch`), não escrevendo na sala direto.
  // Motivo: o estado da sala é a PARTIDA INTEIRA e o online é host-autoritativo —
  // deixar mais gente escrever ali daria pra sobrescrever o jogo da galera no
  // meio. A função troca só o horário, as regras e a lista de adms, e confere na
  // entrada se quem chamou é o dono ou um adm.
  type LigaCampos = { ligaAt?: string; ligaRegras?: unknown; ligaAdmins?: string[]; ligaFechada?: boolean; roomName?: string }
  // 📝 versão por ID: serve pra editar a liga DE FORA, direto no card de
  // "🏆 Minhas ligas", sem precisar entrar na sala (Diego 22/08: *"dps q ele entra
  // ele pode excluir claramente dentro e fora tb... Editar e etc"*).
  async function patchLigaId(id: string, campos: LigaCampos): Promise<boolean> {
    const { data, error } = await supabase.rpc('liga_patch', {
      p_room: id,
      p_at: campos.ligaAt ?? null,
      p_regras: (campos.ligaRegras ?? null) as never,
      p_admins: (campos.ligaAdmins ?? null) as never,
      p_fechada: campos.ligaFechada ?? null,
      p_nome: campos.roomName ?? null,
    })
    if (error || data === false) { setRoomError('Não deu pra salvar agora — tente de novo.'); return false }
    return true
  }
  async function patchLiga(campos: LigaCampos) {
    if (!room) return
    if (!await patchLigaId(room.id, campos)) return
    setRoom(r => (r ? { ...r, game_state: { ...(r.game_state as GS), ...campos } as GS } : r))
    fetchMyLigas()
  }
  // 🗑️ excluir a liga — o MESMO caminho por dentro e por fora, pra não existirem
  // duas regras diferentes pra mesma coisa. Só o DONO exclui (adm ajuda a tocar,
  // não desfaz o que é do outro), e sempre com o aviso do que se perde.
  async function excluirLigaId(id: string, nome: string, souDono: boolean): Promise<boolean> {
    if (!souDono) { setRoomError('Só quem criou a liga pode excluir.'); return false }
    if (!window.confirm(`Excluir a liga "${nome}"?\n\nA sala e a SALA DE TROFÉUS dela somem pra todo mundo. Não dá pra desfazer.`)) return false
    await supabase.from('room_players').delete().eq('room_id', id).then(() => {}, () => {})
    await supabase.from('game_rooms').delete().eq('id', id).then(() => {}, () => {})
    fetchMyLigas()
    return true
  }
  async function excluirLiga() {
    if (!room || !user) return
    const nome = (room.game_state as GS)?.roomName ?? room.code
    if (!await excluirLigaId(room.id, nome, room.host_id === user.id)) return
    clearSavedRoom(); setRoom(null); setPlayers([]); setPhase('menu')
  }

  const quandoLiga = (iso?: string): { txt: string; cor: string } => {
    if (!iso) return { txt: 'sem horário marcado', cor: 'rgba(12,12,12,.5)' }
    const d = new Date(iso)
    if (isNaN(d.getTime())) return { txt: 'sem horário marcado', cor: 'rgba(12,12,12,.5)' }
    const DIA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const base = `${DIA[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1} · ${hora}`
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
    const alvo = new Date(d); alvo.setHours(0, 0, 0, 0)
    const dias = Math.round((alvo.getTime() - hoje.getTime()) / 864e5)
    if (dias < 0) return { txt: `${base} · já passou`, cor: '#B23B2E' }
    if (dias === 0) return { txt: `${base} · É HOJE`, cor: '#B23B2E' }
    if (dias === 1) return { txt: `${base} · amanhã`, cor: GREEN }
    return { txt: `${base} · faltam ${dias} dias`, cor: GREEN }
  }

  // 🏆 MINHAS LIGAS: as salas de liga onde EU estou — como dono ou como convidado.
  // Precisa de lista PRÓPRIA porque a lista de salas abertas só mostra sala mexida
  // nas últimas 6 horas: uma liga marcada pra sábado sumiria antes da hora. Aqui a
  // busca é por PARTICIPAÇÃO, não por "sala recente", então ela fica de pé o tempo
  // todo — que é justamente o ponto da liga.
  async function fetchMyLigas() {
    if (!user) { setMyLigas([]); return }
    const sel = 'id, code, host_id, max_players, status, updated_at, gname:game_state->>roomName, gmode:game_state->>mode, gtag:game_state->>__game, gat:game_state->>ligaAt, gliga:game_state->>ligaFechada'
    const { data: mine } = await supabase.from('room_players').select('room_id').eq('user_id', user.id)
    const memberIds = [...new Set(((mine ?? []) as { room_id: string }[]).map(r => r.room_id))]
    const [hosted, member] = await Promise.all([
      supabase.from('game_rooms').select(sel).eq('host_id', user.id).eq('game_state->>mode', 'liga').limit(30),
      memberIds.length ? supabase.from('game_rooms').select(sel).in('id', memberIds).eq('game_state->>mode', 'liga').limit(30) : Promise.resolve({ data: [] }),
    ])
    type SlimLiga = { id: string; code: string; host_id: string; max_players: number; status: string; updated_at?: string; gname: string | null; gmode: string | null; gtag: string | null; gat: string | null; gliga: string | null }
    const seen = new Set<string>(); const rooms: RoomInfo[] = []
    for (const r of [...((hosted.data ?? []) as unknown as SlimLiga[]), ...((member.data ?? []) as unknown as SlimLiga[])]) {
      if (seen.has(r.id) || r.gtag !== GAME_TAG) continue
      seen.add(r.id)
      rooms.push({ id: r.id, code: r.code, host_id: r.host_id, max_players: r.max_players, status: r.status, updated_at: r.updated_at,
        game_state: { __game: GAME_TAG, roomName: r.gname ?? undefined, mode: 'liga', ligaAt: r.gat ?? undefined, ligaFechada: r.gliga === 'true' || undefined } as GS })
    }
    // a próxima da agenda primeiro (liga sem horário vai pro fim)
    rooms.sort((a, b) => ((a.game_state as GS).ligaAt ?? '9') .localeCompare((b.game_state as GS).ligaAt ?? '9'))
    const contagem: Record<string, number> = {}
    if (rooms.length) {
      const { data: pls } = await supabase.from('room_players').select('room_id').in('room_id', rooms.map(r => r.id))
      for (const pl of (pls ?? []) as { room_id: string }[]) contagem[pl.room_id] = (contagem[pl.room_id] ?? 0) + 1
    }
    setMyLigas(rooms.map(r => ({ ...r, count: contagem[r.id] ?? 0 })))
  }

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
    // quantos técnicos tem em cada save — o aviso de apagar precisa dizer se
    // você vai levar a carreira de mais alguém junto.
    const contagem: Record<string, number> = {}
    if (rooms.length) {
      const { data: pls } = await supabase.from('room_players').select('room_id').in('room_id', rooms.map(r => r.id))
      for (const p of (pls ?? []) as { room_id: string }[]) contagem[p.room_id] = (contagem[p.room_id] ?? 0) + 1
    }
    setMyCareers(rooms.map(r => ({ ...r, count: contagem[r.id] ?? 0 })))
  }
  // 🗑️ APAGAR uma carreira da lista "Minhas carreiras". Só o HOST apaga de
  // verdade (a carreira é a sala dele); quem é convidado apenas SAI da sala e o
  // save continua vivo pros outros. Some coisa do banco, então o aviso é claro e
  // diz quantos técnicos vão perder o save junto.
  async function apagarCarreira(r: OpenRoom) {
    if (!user) return
    const nome = (r.game_state as GS)?.roomName ?? r.code
    const souHost = r.host_id === user.id
    if (!souHost) {
      if (!window.confirm(`Sair da carreira "${nome}"?\n\nEla some da sua lista, mas continua valendo pros outros técnicos.`)) return
      await supabase.from('room_players').delete().eq('room_id', r.id).eq('user_id', user.id)
      dismissRoom(r.id); if (loadSavedRoom() === r.id) clearSavedRoom()
      fetchMyCareers(); return
    }
    const outros = Math.max(0, (r.count ?? 1) - 1)
    const aviso = `Apagar a carreira "${nome}" (temporada ${(r.game_state as GS & { seasonNo?: number })?.seasonNo ?? 1}) PRA SEMPRE?\n\n`
      + (outros > 0 ? `⚠️ Tem mais ${outros} ${outros === 1 ? 'técnico' : 'técnicos'} nessa carreira — ${outros === 1 ? 'ele perde' : 'eles perdem'} o save junto.\n\n` : '')
      + 'Isso NÃO tem volta.'
    if (!window.confirm(aviso)) return
    const e1 = (await supabase.from('room_players').delete().eq('room_id', r.id)).error
    const e2 = (await supabase.from('game_rooms').delete().eq('id', r.id)).error
    if (e1 || e2) { setRoomError(`Não consegui apagar: ${(e2 ?? e1)?.message}`); return }
    dismissRoom(r.id); if (loadSavedRoom() === r.id) clearSavedRoom()
    fetchMyCareers(); fetchMyLigas()
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
    // 🃏 BAFO em construção: a trava é aqui, no FUNIL de entrada (enterRoom é por
    // onde passa TUDO — lista, código e link do zap). Esconder da lista não basta:
    // com o código na mão qualquer um entraria numa sala que vale carta de verdade.
    // 🏆 LIGA FECHADA — a trava do Diego, e ela é NA ENTRADA, não só na lista:
    // *"todos têm que ser Lenda ou batismo, ninguém consegue ver a sala se não
    // for"*. Tirar a liga da lista pública não bastava — quem recebesse o código
    // ou o link entrava assim mesmo. Aqui fecha pra valer.
    // (Todo batismo já nasce tier ouro pela regra de 17/08, então a conta é uma
    // só. E CRIAR liga continua preso à conta do Diego, em `sport.ts`.)
    if (LIGA_SO_LENDA_ENTRA && rd.game_state?.mode === 'liga' && myApoioPerk()?.tier !== 'ouro') {
      setRoomError('Essa é uma 🏆 Liga Fechada — só entra quem é 👑 Lenda ou dono de clube batizado.'); setLoading(false); return
    }
    if (rd.game_state?.mode === 'elenco' && !salaElenco) {
      setRoomError('Essa sala é do 🃏 Bafo, um modo novo ainda em construção — em breve libera pra todo mundo.'); setLoading(false); return
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
    if (!room || !isHost) return
    // trava do início: sala normal = 2 técnicos; sala de duplas = a regra do
    // bloco de cima (nenhuma vaga esperando parceiro + 1 dupla completa).
    // mesmo cinto de segurança da tela: o flag confiável é o do banco
    const ehDuplas = duplasSala ?? !!(room.game_state as GS & { duplasMode?: boolean })?.duplasMode
    if (!ehDuplas && players.length < 2) return
    if (ehDuplas) {
      // cinto e suspensório: o botão já fica apagado, mas a regra é re-checada
      // aqui — mínimo de DUAS duplas fechadas pra abrir o pregão.
      const dn = players.filter(p => !p.dupla_partner_of)
      const temPar = (uid: string) => players.some(p => p.dupla_partner_of === uid)
      if (dn.filter(d => temPar(d.user_id)).length < 2) return
    }
    // 🃏 BAFO: só entra em campo quem MONTOU o time (11+). Quem não montou fica
    // de fora de verdade — a vaga sai da sala ANTES da renumeração, então ele
    // nunca vira "time fantasma" nem entra com elenco sorteado (a regra da casa:
    // nada de perna-de-pau entrando em campo por regra nova). O host já foi
    // avisado no banner de quem ia ficar de fora antes de chegar aqui.
    if (room.game_state?.mode === 'elenco') {
      const aptos = players.filter(p => ((p.bafo?.squad?.length ?? 0) >= BAFO_MIN))
      if (aptos.length < 2) return
      for (const p of players) {
        if (aptos.some(a => a.user_id === p.user_id)) continue
        await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', p.user_id).then(() => {}, () => {})
      }
    }
    // LIMPA as vagas ANTES de começar (o jogo monta os times pela POSIÇÃO na lista):
    // (1) DEDUPLICA por usuário. Se o mesmo técnico ficou com DUAS vagas (leitura
    //     atrasada na entrada deixou passar), ele viraria DOIS times — um "fantasma"
    //     com o nome dele que trava o leilão esperando lacrar (o bug do "meu nome
    //     aparece e também diz 'eu'"). Mantém a vaga de menor índice e apaga o resto.
    // (2) RENUMERA pra 0..n-1. Buraco na numeração (0,1,3,4) fazia jogador procurar
    //     um time que não existe e ser devolvido pra tela inicial.
    const { data: pls } = await supabase.from('room_players').select('user_id, player_index, dupla_partner_of').eq('room_id', room.id).order('player_index')
    const allRows = (pls ?? []) as { user_id: string; player_index: number; dupla_partner_of?: string | null }[]
    // 🤝 DUPLA: a linha do PARCEIRO é carona no assento do dono — não é time.
    // Ela fica FORA da deduplicação e da renumeração; se entrasse, viraria um
    // time fantasma (exatamente o bug do "virei bot" que já aconteceu antes).
    const rows = allRows.filter(r => !r.dupla_partner_of)
    const seen = new Set<string>()
    const keep: { user_id: string; player_index: number }[] = []
    for (const r of rows) {
      if (seen.has(r.user_id)) {
        // vaga repetida do MESMO técnico → apaga (pelo índice, que é único na sala)
        await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', r.user_id).then(() => {}, () => {})
      } else { seen.add(r.user_id); keep.push(r) }
    }
    for (let i = 0; i < keep.length; i++) {
      if (keep[i].player_index !== i) {
        // mira o USER_ID (único de verdade): com parceiro carona, dois registros
        // podem compartilhar o mesmo player_index e o update pegaria o errado.
        await supabase.from('room_players').update({ player_index: i }).eq('room_id', room.id).eq('user_id', keep[i].user_id).then(() => {}, () => {})
      }
    }
    await supabase.from('game_rooms').update({ status: 'started' }).eq('id', room.id)
    // 🐛 O HOST NÃO ESPERA MAIS O ECO DO BANCO (Diego 22/08, na liga dele: *"o
    // usuário que criou, Neymarzetti, eu não tô conseguindo abrir o pregão"*).
    // Até aqui, quem apertava o botão só marcava a sala como "começou" e ficava
    // esperando o aviso do banco VOLTAR pra, aí sim, montar o jogo. Se esse aviso
    // se perdesse (rede, canal do lobby piscando), a sala ficava no PIOR estado
    // possível: `started` no banco e SEM jogo dentro. O botão sumia (a sala já
    // "começou"), e "voltar pra sala" não fazia nada — porque não havia partida
    // pra voltar. Foi exatamente o que travou a liga F1UALH.
    // Agora o dono monta o jogo NA HORA, com a linha fresca do banco. Se o eco
    // chegar depois, a guarda `jaIniciouRef` impede montar de novo.
    const { data: agora } = await supabase.from('game_rooms').select('*').eq('id', room.id).maybeSingle()
    if (agora) await triggerStart(agora as RoomInfo)
  }
  async function leaveRoom() {
    if (!room || !user) return
    // 🏆 LIGA: o dono sair NÃO apaga nada. A liga é feita pra ficar de pé — ele
    // sai, volta semana que vem e está tudo lá. (Bug achado em 20/08 pelo Diego:
    // como sala comum some quando o dono sai, a liga inteira — troféus incluídos —
    // ia junto. Uma saída da sala apagava meses de história da turma.)
    if (room.host_id === user.id && room.game_state?.mode === 'liga') {
      await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', user.id).then(() => {}, () => {})
      clearSavedRoom(); setRoom(null); setPlayers([]); setPhase('menu'); fetchMyLigas()
      return
    }
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
  useEffect(() => {
    const rid = room?.id
    if (!rid || phase !== 'waiting') { setDuplasSala(null); return }
    let vivo = true
    supabase.from('game_rooms').select('gd:game_state->>duplasMode').eq('id', rid).maybeSingle()
      .then(({ data }) => { if (vivo) setDuplasSala(((data as { gd?: string | null } | null)?.gd ?? null) === 'true') }, () => {})
    return () => { vivo = false }
  }, [room?.id, phase])

  // ── 🤝 DUPLAS: formar/desfazer dupla na sala de espera ──────────────────
  // Tudo aqui mexe SÓ nas 3 colunas novas de room_players (opcionais). Sala que
  // não é de duplas nunca chama nenhuma destas funções.
  // "Procuro parceiro": deixa a minha vaga visível pra sala (aberta) ou
  // reservada pra um amigo que já vem (privada).
  // 🏷️ nome automático do time da dupla: "Fulano | Beltrano". Sem emoji (o selo
  // de apoio é da PESSOA, não do time) e com cada metade curta pra caber no
  // placar, na tabela e no escudo sem virar uma linha gigante.
  function nomeAutoDupla(a: string, b: string) {
    const corta = (n: string) => { const c = stripEmoji(n).trim(); return c.length > 11 ? c.slice(0, 11).trim() : c }
    return `${corta(a)}|${corta(b)}`
  }
  // grava o nome que a dupla escolheu (vazio = volta pro automático)
  async function salvarNomeDupla(donoUid: string, nome: string) {
    if (!room || !user) return
    const limpo = stripEmoji(nome).trim().slice(0, 24)
    const { error } = await supabase.rpc('dupla_definir', { p_room: room.id, p_dono: donoUid, p_nome: limpo || null, p_set_nome: true })
    if (error) setRoomError(`Não consegui salvar o nome: ${error.message}`)
    fetchPlayers(room.id)
  }

  // 🔒 põe/tira o cadeado da minha vaga. `null` = aberta pra qualquer um da sala
  // (é o padrão). Não existe "jogar sozinho": em sala de duplas todo time é dupla.
  async function procurarParceiro(seek: 'privada' | null) {
    if (!room || !user) return
    await supabase.from('room_players').update({ dupla_seek: seek }).eq('room_id', room.id).eq('user_id', user.id)
    fetchPlayers(room.id)
  }
  // 🤝 PEDIDO DE DUPLA (09/08, pedido do Diego: "tem que aparecer um banner
  // perguntando se ela quer jogar com a outra"): tocar numa vaga não entra
  // mais na hora — manda um PEDIDO pra pessoa, que aceita ou recusa (ou deixa
  // expirar). Fica gravado na MINHA própria linha (RLS só deixa mexer na
  // própria) — o dono vê o pedido chegando e responde pela função
  // `dupla_responder` (só ela pode gravar na linha de quem pediu).
  const DUPLA_REQUEST_TIMEOUT_S = 30
  async function pedirDupla(dono: RoomPlayer) {
    if (!room || !user || dono.user_id === user.id) return
    // 🔒 confere no banco AGORA: vaga já fechou, já tem pedido de outra pessoa
    // chegando nela, ou eu já pedi/já sou de uma dupla — nada disso pode duplicar.
    const { data: fresh } = await supabase.from('room_players').select('user_id, dupla_partner_of, dupla_seek, dupla_request_to').eq('room_id', room.id)
    const rows = (fresh ?? []) as { user_id: string; dupla_partner_of?: string | null; dupla_seek?: string | null; dupla_request_to?: string | null }[]
    const alvo = rows.find(r => r.user_id === dono.user_id)
    if (!alvo || alvo.dupla_partner_of || alvo.dupla_seek === 'privada') { setRoomError('😅 Essa vaga não tá mais disponível.'); fetchPlayers(room.id); return }
    if (rows.some(r => r.dupla_request_to === dono.user_id)) { setRoomError('😅 Alguém já mandou um pedido pra essa pessoa — espera ela responder.'); fetchPlayers(room.id); return }
    const eu = rows.find(r => r.user_id === user.id)
    if (eu?.dupla_partner_of || eu?.dupla_request_to) return // já sou de uma dupla, ou já tenho um pedido em aberto
    const { error } = await supabase.from('room_players').update({ dupla_request_to: dono.user_id, dupla_request_at: new Date().toISOString() }).eq('room_id', room.id).eq('user_id', user.id)
    if (error) setRoomError(`Não consegui mandar o pedido: ${error.message}`)
    fetchPlayers(room.id)
  }
  // cancela o MEU pedido em aberto (desisti, ou o tempo acabou — self-clear,
  // não precisa de função porque é a minha própria linha).
  async function cancelarPedido() {
    if (!room || !user) return
    await supabase.from('room_players').update({ dupla_request_to: null, dupla_request_at: null }).eq('room_id', room.id).eq('user_id', user.id)
    fetchPlayers(room.id)
  }
  // responde um pedido que chegou pra MIM (sou o dono da vaga pedida). A troca
  // de verdade (dupla_partner_of na linha de QUEM PEDIU) só a função do banco
  // pode fazer — ela confere no servidor que o pedido é mesmo meu antes.
  async function responderPedido(requesterUid: string, aceitar: boolean) {
    if (!room || !user) return
    const { data, error } = await supabase.rpc('dupla_responder', { p_room: room.id, p_requester: requesterUid, p_aceitar: aceitar })
    if (error) setRoomError(`Não consegui responder: ${error.message}`)
    else if (data === false) setRoomError('😅 Esse pedido não existe mais (a pessoa deve ter cancelado).')
    fetchPlayers(room.id)
  }
  // ⏳ expira pedidos MEUS sozinho, sem precisar de ninguém responder — regra
  // de ouro do Diego: nada trava esperando a pessoa decidir pra sempre.
  useEffect(() => {
    if (phase !== 'waiting' || !room || !user) return
    const meuRow = players.find(p => p.user_id === user.id)
    if (!meuRow?.dupla_request_to || !meuRow.dupla_request_at) return
    const restante = DUPLA_REQUEST_TIMEOUT_S * 1000 - (Date.now() - new Date(meuRow.dupla_request_at).getTime())
    if (restante <= 0) { cancelarPedido(); return }
    const t = setTimeout(cancelarPedido, restante)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, room, user, players])
  // Desfazer a dupla. Vale pros DOIS lados: o parceiro pode "sair da dupla" e o
  // dono do time pode "jogar sozinho" — ninguém fica preso numa dupla que não
  // quer mais. Quem era parceiro volta a ter o time dele (o assento nunca foi
  // dado a ninguém: a linha continuou dele o tempo todo, só marcada como carona).
  async function desfazerDupla(donoUid: string, parceiroUid: string) {
    if (!room || !user) return
    if (user.id !== donoUid && user.id !== parceiroUid) return // só quem é da dupla desfaz
    await supabase.from('room_players').update({ dupla_partner_of: null }).eq('room_id', room.id).eq('user_id', parceiroUid)
    // a divisão das posições morava na linha do dono: sem dupla, ela não vale mais
    await supabase.from('room_players').update({ dupla_categories: null }).eq('room_id', room.id).eq('user_id', donoUid)
    fetchPlayers(room.id)
  }

  // ✋ Dividir as 6 posições (3 pra cada). Grava na linha do DONO do assento —
  // é ela que o início da partida lê pra montar a dupla. Usa a MESMA função do
  // jogo (duplaToggleCat), então tela e motor nunca discordam.
  async function tocarCategoria(dono: RoomPlayer, cat: DuplaCat) {
    if (!room || !user) return
    const par = players.find(p => p.dupla_partner_of === dono.user_id)
    if (!par) return
    if (user.id !== dono.user_id && user.id !== par.user_id) return // não é da dupla
    const outro = user.id === dono.user_id ? par.user_id : dono.user_id
    // relê do banco antes de gravar: os dois podem tocar quase junto e quem
    // chegou primeiro tem que ganhar de verdade, não só na tela.
    const { data: fresh } = await supabase.from('room_players').select('dupla_categories').eq('room_id', room.id).eq('user_id', dono.user_id).maybeSingle()
    const atual = (fresh?.dupla_categories ?? undefined) as Partial<Record<DuplaCat, string>> | undefined
    const novo = duplaToggleCat(atual, cat, user.id, outro)
    if (!novo) { fetchPlayers(room.id); return } // toque não valeu
    // a linha é do DONO do assento — quem escreve nela é a função do banco, que
    // confere se quem pediu é mesmo dessa dupla (o parceiro não pode editar a
    // linha do dono direto, senão daria pra mexer no assento dos outros).
    const { error } = await supabase.rpc('dupla_definir', { p_room: room.id, p_dono: dono.user_id, p_cats: novo })
    if (error) setRoomError(`Não consegui salvar a divisão: ${error.message}`)
    fetchPlayers(room.id)
  }

  // host remove um técnico da sala de espera (antes de abrir o pregão): apaga
  // a vaga dele. O cliente removido percebe pela realtime que sumiu da lista e
  // volta sozinho pro menu (efeito abaixo).
  async function kickFromRoom(p: RoomPlayer) {
    if (!room || !isHost || p.user_id === user?.id) return
    // 🤝 DUPLA: se eu tirar o DONO de um time que tem parceiro, o parceiro ficaria
    // pendurado num time que não existe mais — sem aparecer na lista e, na hora de
    // começar, sem time nenhum (é a família de bug do "virei bot"). Então o
    // parceiro é solto ANTES e volta a ter o time dele.
    const par = players.find(x => x.dupla_partner_of === p.user_id)
    const aviso = par
      ? `Remover ${p.manager_name} da sala?\n\n${par.manager_name} estava em dupla com ele e vai ficar com um time só pra ele.`
      : `Remover ${p.manager_name} da sala?`
    if (!window.confirm(aviso)) return
    if (par) {
      await supabase.from('room_players').update({ dupla_partner_of: null }).eq('room_id', room.id).eq('user_id', par.user_id)
    }
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
      {/* 🏷️ NOME DO TIME, não da pessoa (Diego 23/08: *"não precisa ser
          obrigatório o nome da pessoa nem o clube de coração, mas o time da
          pessoa e o e-mail tem que ter"*). Esta tela pedia "Nome de técnico ·
          como te chamam?" enquanto a JanelaConta (carreira) pedia o NOME DO
          TIME — mesmo campo (`display_name`), significados diferentes, e o
          ranking misturava os dois. Agora as duas pedem a mesma coisa. */}
      {authTab === 'register' && <Field label="Nome do seu time" value={displayName} onChange={e => setDisplayName(stripEmoji(e.target.value))} placeholder="Ex.: Lendas FC" />}
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
                placeholder="Nome do seu time" onKeyDown={e => e.key === 'Enter' && saveName()}
                className="flex-1 min-w-0 border-2 border-black rounded-md px-2 py-1 font-black text-black text-xs bg-white" />
              <button onClick={saveName} disabled={loading || !nameDraft.trim()}
                className="border-2 border-black rounded-md px-2 font-black text-xs" style={{ background: GREEN, color: '#fff', ...OSWALD }}>OK</button>
              <button onClick={() => { setEditingName(false); setNameErr('') }}
                className="border-2 border-black rounded-md px-2 font-black text-xs bg-white text-black">✕</button>
              {nameErr && <p className="w-full font-bold text-[11px] leading-tight mt-1" style={{ color: '#FFD9A0' }}>{nameErr}</p>}
            </div>
          ) : (
            <button onClick={() => { setNameDraft(user?.user_metadata?.display_name ?? ''); setEditingName(true) }}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border-2"
              style={{ background: hasName ? 'rgba(255,255,255,.1)' : GOLD, borderColor: hasName ? 'rgba(255,255,255,.3)' : '#000' }}>
              <span className="font-black text-xs" style={{ color: hasName ? '#fff' : '#000' }}>
                {hasName ? nameOf() : 'Toque pra pôr o nome do time'}
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

      {/* 🏆 MINHAS LIGAS — a sala que fica de pé. Vem ANTES das carreiras porque
          é a que tem hora marcada: é o que a pessoa abre o jogo pra ver. */}
      {ligaOn && myLigas.length > 0 && (
        <div className="rounded-2xl border-[3px] border-black p-3 space-y-2" style={{ background: '#FFF4CF', boxShadow: `4px 4px 0 ${INK}` }}>
          <p className="font-black text-sm" style={{ ...OSWALD, color: '#7a4d00' }}>🏆 Minhas ligas</p>
          {myLigas.map(r => {
            const gs = r.game_state as GS
            const nm = gs?.roomName ?? r.code
            const q = quandoLiga(gs?.ligaAt)
            const souDono = r.host_id === user?.id
            return (
              <div key={r.id} className="border-2 border-black rounded-xl px-3 py-2 bg-white">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-black text-sm truncate" style={OSWALD}>{nm}</p>
                    <p className="text-black/60 text-[11px] font-bold">👥 {r.count} · {r.code} · {gs?.ligaFechada ? 'sem bots' : 'com bots'}{souDono ? '' : ' · você é convidado'}</p>
                    <p className="font-black text-[11.5px]" style={{ ...OSWALD, color: q.cor }}>📅 {q.txt}</p>
                  </div>
                  <button onClick={() => joinFromList(r)} disabled={loading}
                    className="border-2 border-black rounded-lg px-3 py-2 font-black text-xs uppercase shrink-0"
                    style={{ background: GREEN, color: '#fff', ...OSWALD }}>
                    {r.status === 'started' ? '↩️ Voltar' : '▶️ Entrar'}
                  </button>
                </div>
                {/* ✏️🗑️ MEXER NA LIGA SEM ENTRAR NELA (Diego 22/08). Só pro DONO:
                    convidado nem vê os botões, pra não dar a entender que ele pode
                    apagar a liga dos outros. */}
                {souDono && cardEdit !== r.id && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => {
                      const d = gs?.ligaAt ? new Date(gs.ligaAt) : new Date()
                      const pad = (n: number) => String(n).padStart(2, '0')
                      setCardNome(nm)
                      setCardData(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
                      setCardHora(`${pad(d.getHours())}:${pad(d.getMinutes())}`)
                      setCardBots(!gs?.ligaFechada)
                      setCardEdit(r.id)
                    }} className="flex-1 border-2 border-black rounded-lg py-1.5 font-black text-[11.5px] bg-white text-black active:translate-y-0.5" style={OSWALD}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => { void excluirLigaId(r.id, nm, souDono) }}
                      className="flex-1 border-2 border-black rounded-lg py-1.5 font-black text-[11.5px] active:translate-y-0.5"
                      style={{ background: '#E8503A', color: '#fff', ...OSWALD }}>
                      🗑️ Excluir a liga
                    </button>
                  </div>
                )}
                {souDono && cardEdit === r.id && (
                  <div className="mt-2 rounded-xl border-2 border-black p-2.5" style={{ background: '#FFF4CF' }}>
                    <p className="font-black text-[10.5px] uppercase tracking-wider text-black/50 mb-1" style={OSWALD}>🖋️ Nome da liga</p>
                    <input value={cardNome} maxLength={24} onChange={e => setCardNome(stripEmoji(e.target.value))}
                      className="w-full border-2 border-black rounded-lg px-2.5 py-1.5 font-black text-black text-sm bg-white" style={OSWALD} />
                    <p className="font-black text-[10.5px] uppercase tracking-wider text-black/50 mt-2.5 mb-1" style={OSWALD}>📅 Quando vocês jogam</p>
                    <div className="flex gap-2">
                      <input type="date" value={cardData} onChange={e => setCardData(e.target.value)}
                        className="flex-1 min-w-0 border-2 border-black rounded-lg px-2 py-1.5 font-black text-black text-sm bg-white" style={OSWALD} />
                      <input type="time" value={cardHora} onChange={e => setCardHora(e.target.value)}
                        className="w-[96px] border-2 border-black rounded-lg px-2 py-1.5 font-black text-black text-sm bg-white" style={OSWALD} />
                    </div>
                    <p className="font-black text-[10.5px] uppercase tracking-wider text-black/50 mt-2.5 mb-1" style={OSWALD}>🤖 Bots na tabela</p>
                    <div className="flex border-2 border-black rounded-lg overflow-hidden">
                      {([[false, 'Sem bots'], [true, 'Com bots até 20']] as [boolean, string][]).map(([v, lb], i) => (
                        <button key={lb} onClick={() => setCardBots(v)}
                          className={`flex-1 font-black ${i ? 'border-l-2 border-black' : ''}`}
                          style={{ padding: '7px 2px', fontSize: 11, background: cardBots === v ? GOLD : '#fff', color: '#000', ...OSWALD }}>
                          {lb}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2.5">
                      <button onClick={async () => {
                        const nome = cardNome.trim()
                        if (!nome) { setRoomError('A liga precisa de um nome.'); return }
                        const quando = new Date(`${cardData}T${cardHora}`)
                        if (isNaN(quando.getTime())) { setRoomError('Confira o dia e a hora.'); return }
                        const ok = await patchLigaId(r.id, { roomName: nome, ligaAt: quando.toISOString(), ligaFechada: !cardBots })
                        if (!ok) return
                        setCardEdit(null); fetchMyLigas()
                      }} className="flex-1 border-2 border-black rounded-lg py-2 font-black text-[11.5px]"
                        style={{ background: GREEN, color: '#fff', ...OSWALD }}>
                        ✅ Salvar
                      </button>
                      <button onClick={() => setCardEdit(null)}
                        className="flex-1 border-2 border-black rounded-lg py-2 font-black text-[11.5px] bg-white text-black" style={OSWALD}>
                        Cancelar
                      </button>
                    </div>
                    <p className="text-black/45 text-[10px] font-bold mt-2 leading-snug">
                      Muda tudo isso quando quiser, na mesma liga — <b>nenhum troféu se perde</b>.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
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
                {/* 🗑️ tirar da lista: host apaga a carreira; convidado só sai dela */}
                <button onClick={() => apagarCarreira(r)} disabled={loading}
                  aria-label={iAmHost ? `Apagar a carreira ${nm}` : `Sair da carreira ${nm}`}
                  title={iAmHost ? 'Apagar essa carreira' : 'Sair dessa carreira'}
                  className="shrink-0 w-8 h-8 rounded-lg border-2 border-black font-black text-sm leading-none active:translate-y-0.5"
                  style={{ background: '#fff', color: '#B23B2E' }}>🗑️</button>
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
        const isElenco = salaElenco && roomMode === 'elenco'
        return (
        <div className="space-y-3">
          {/* ① O BÁSICO — modo, nome, baralho, formação */}
          <Section num={1} title="O básico" icon="📋">
            <div>
              <SegField label={canCareer ? 'Modo de jogo (teste)' : 'Modo de jogo'}>
                {/* 🎛️ OS TRÊS MODOS SEMPRE À VISTA (Diego 17/08: "pode deixar esse
                    modo aparecendo e também o do carreira, e os dois coloque em
                    breve — mas pode usar somente eu com meu usuário").
                    Quem não está liberado VÊ os dois, apagados e sem clique: desperta
                    o interesse sem prometer o que ainda não dá pra entregar, e sem
                    NUNCA deixar entrar num modo que não está pronto (a trava real é
                    por conta, em sport.ts — o botão apagado é só a cara dela). */}
                {(() => {
                  // 🏆 LIGA FECHADA (20/08): o Diego cortou que ela é MODO DE JOGO, não
                  // detalhe da partida — *"tem q ser rápido, liga fechada, carreira e
                  // bafo"*. Entra aqui na fileira, por enquanto APAGADA e sem clique:
                  // o resto da liga (horário marcado, troféus na sala de espera, o dono
                  // arrumando troféu e escrevendo a regra do ranking) ainda está sendo
                  // feito. `v: null` = aba de vitrine, não vira modo nem por acidente.
                  const abas: { v: typeof roomMode | null; label: string; liberado: boolean }[] = [
                    { v: 'rapido', label: '⚡ Rápido', liberado: true },
                    { v: 'liga', label: '🏆 Liga', liberado: ligaOn },
                    { v: 'carreira', label: '🌐 Carreira', liberado: canCareer },
                    { v: 'elenco', label: '🃏 Bafo', liberado: salaElenco },
                  ]
                  return (
                    <div className="flex border-[2.5px] border-black rounded-xl overflow-hidden">
                      {abas.map((a, i) => (a.liberado && a.v) ? (
                        <button key={a.label} onClick={() => setRoomMode(a.v!)}
                          className={`flex-1 font-black ${i > 0 ? 'border-l-[2.5px] border-black' : ''}`}
                          style={{ padding: '9px 1px', fontSize: 11, minWidth: 0, background: roomMode === a.v ? GOLD : '#fff', color: '#000', whiteSpace: 'nowrap', ...OSWALD }}>
                          {a.label}
                        </button>
                      ) : (
                        <button key={a.label} disabled
                          className={`flex-1 font-black ${i > 0 ? 'border-l-[2.5px] border-black' : ''}`}
                          style={{ padding: '9px 1px', fontSize: 9, minWidth: 0, background: '#fff', color: '#000', opacity: 0.4, cursor: 'default', lineHeight: 1.15, ...OSWALD }}>
                          {a.label}<br /><span style={{ fontSize: 8 }}>em breve</span>
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </SegField>
              <p className="text-white/40 text-[10px] font-bold mt-1 leading-snug">
                {roomMode === 'liga' ? '🏆 A liga da sua turma: você marca o dia e a hora, é sempre a MESMA sala, e os troféus ficam guardados nela — temporada após temporada.' : isElenco ? '🃏 SEM LEILÃO — cada um traz o time da PRÓPRIA carreira: o elenco de agora ou 22 do álbum de cartas da carreira. Liga de 38 rodadas, sem Copa. E vale carta: no fim, quem ficou atrás entrega uma carta da carreira pro de cima.' : !canCareer && !salaElenco ? '🌐 Carreira (4 divisões) e 🃏 Bafo (traga o time da sua carreira, valendo carta) estão chegando — em breve no online!' : !canCareer ? '🌐 Carreira (pirâmide de 4 divisões) tá chegando — em breve no online!' : isCareer ? '🏆 4 divisões — cada técnico sobe/cai por conta própria. Mesmo mundo pra todos.' : '🔨 O leilão de sempre — uma temporada avulsa.'}
              </p>
              {/* 🏆 LIGA FECHADA — o que ela guarda a mais que a sala rápida.
                  Fica aqui em cima, colado no modo, porque é o que a pessoa
                  precisa decidir ANTES de pensar em baralho e formação.
                  🏆 ARRUMADO EM 22/08 pra bater com o mockup que o Diego aprovou
                  (scripts/mockup-liga-fechada.mjs, quadro "O QUE ABRE AO ESCOLHER
                  🏆 LIGA"). Ele cobrou: *"ainda n tá legal… n parece igual qd se
                  cria a sala"*. As TRÊS coisas da liga ficam JUNTAS aqui — nome,
                  dia/hora e bots — em vez de o nome estar lá embaixo, solto e
                  chamado de "Nome da sala" como numa sala qualquer. */}
              {roomMode === 'liga' && (
                <div className="mt-3 rounded-xl border-[3px] border-black p-3" style={{ background: 'rgba(255,196,0,.16)', boxShadow: `3px 3px 0 ${INK}` }}>
                  <p className="font-black text-[11px] uppercase tracking-wider text-white/70 mb-2" style={OSWALD}>🏆 A sua liga</p>
                  <p className="font-black text-[11px] uppercase tracking-wider text-white/55 mb-1.5" style={OSWALD}>🖋️ Nome da liga</p>
                  <input value={roomName} maxLength={24} onChange={e => setRoomName(stripEmoji(e.target.value))}
                    placeholder={`Liga do ${nameOf()}`}
                    className="w-full border-[2.5px] border-black rounded-lg px-2.5 py-2 font-black text-black text-sm bg-white" style={OSWALD} />
                  <p className="font-black text-[11px] uppercase tracking-wider text-white/55 mt-3 mb-1.5" style={OSWALD}>📅 Quando vocês jogam</p>
                  <div className="flex gap-2">
                    <input type="date" value={ligaData} min={emDias(0)} onChange={e => setLigaData(e.target.value)}
                      className="flex-1 min-w-0 border-[2.5px] border-black rounded-lg px-2.5 py-2 font-black text-black text-sm bg-white" style={OSWALD} />
                    <input type="time" value={ligaHora} onChange={e => setLigaHora(e.target.value)}
                      className="w-[104px] border-[2.5px] border-black rounded-lg px-2.5 py-2 font-black text-black text-sm bg-white" style={OSWALD} />
                  </div>
                  <p className="font-black text-[11px] uppercase tracking-wider text-white/55 mt-3 mb-1.5" style={OSWALD}>🤖 Bots na tabela</p>
                  <Seg options={[[false, 'Sem bots — só vocês'], [true, 'Com bots até 20']] as [boolean, string][]} value={ligaComBots} onSet={v => setLigaComBots(v)} />
                  <p className="text-white/40 text-[10.5px] font-bold mt-1.5 leading-snug">
                    {ligaComBots
                      ? '🤖 Tabela de 20 times — os que faltam entram como CPU, como no rápido de sempre.'
                      : '🏆 Só a galera na tabela. A liga tem o tamanho de vocês (ida e volta). Copa destrava com 8+ jogadores.'}
                  </p>
                  <p className="text-white/35 text-[10px] font-bold mt-2 leading-snug">
                    Dá pra trocar o dia, a hora e os bots depois — na mesma sala, sem perder troféu nenhum.
                  </p>
                </div>
              )}
            </div>
            {/* 🤝 DUPLAS (beta) — só no Rápido por enquanto */}
            {!isCareer && (
              <div>
                <SegField label="Quem comanda cada time">
                  <Seg options={[[false, '👤 Solo'], [true, '🤝 Duplas (beta)']] as [boolean, string][]} value={roomDuplas} onSet={v => setRoomDuplas(v)} />
                </SegField>
                <p className="text-white/40 text-[10px] font-bold mt-1 leading-snug">
                  {roomDuplas
                    ? '🤝 Dá pra jogar de dois no MESMO time: um cuida de 3 posições, o outro das outras 3. Cabem 20 times, ou seja até 40 pessoas.'
                    : '👤 Cada pessoa comanda o próprio time — do jeito de sempre.'}
                </p>
              </div>
            )}
            {/* 🚫 no modo Liga o nome já foi pedido no quadro da liga, lá em cima.
                Deixar este campo aqui perguntaria a MESMA coisa duas vezes — foi
                exatamente a bronca que o Diego deu sobre os bots em 22/08. */}
            {roomMode !== 'liga' && (
              <Field label="Nome da sala" value={roomName} onChange={e => setRoomName(stripEmoji(e.target.value))} placeholder={`Sala do ${nameOf()}`} maxLength={24} />
            )}
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
              {/* 🚫 "SEM BOTS" É SÓ DA LIGA FECHADA (Diego 23/08, decisão fechada).
                  Palavras dele: *"sem bots n deve ter na sala aberta, apenas em liga
                  fechada"*. Aqui existia um seletor 🌍 Aberta × 🏆 Liga Fechada na
                  criação da sala RÁPIDA — o desenho que ele já tinha recusado em
                  22/08 (*"mostra duas vezes sobre bots"*), que vivia apagado atrás de
                  LIGA_FECHADA_LIBERADA = false. Agora saiu de vez, pra ninguém
                  religar achando que era feature esquecida.
                  A tabela sem bots continua existindo — mas SÓ no modo Liga, onde ela
                  é o ponto: `mode:'liga'` grava `ligaFechada: !ligaComBots`.
                  Sala rápida = sempre 20 times, os que faltam entram como CPU. */}
              {/* 🏆 A COPA NÃO EXISTE NA SALA DE ELENCO (Diego 17/08: "não terá copa,
                  será apenas divisão de 38 rodadas nesse modo"). Em vez de deixar o
                  seletor ligado e ignorar a escolha depois — que é o tipo de estado
                  torto que a casa não aceita — o seletor SAI da tela e o motivo fica
                  escrito. A sala já nasce com copaMode:'liga' travado. */}
              {isElenco ? (
                <>
                <SegField label="Depois da liga">
                  <div className="border-[2.5px] border-black rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,.06)' }}>
                    <p className="font-black" style={{ fontSize: 12, color: GOLD, ...OSWALD }}>📊 Só a liga · 38 rodadas</p>
                    <p className="text-white/45 text-[10.5px] font-bold mt-1 leading-snug">No Bafo <b>não tem Copa</b> — é a tabela do começo ao fim, e a classificação final é o que decide quem entrega carta pra quem.</p>
                  </div>
                </SegField>
                {/* 🃏 O host decide se a partida vale carta de verdade. Amistoso
                    existe pra galera experimentar o modo sem medo de perder carta
                    — e é o Diego quem sempre pede o caminho de volta. */}
                <SegField label="No fim da liga">
                  <Seg options={[[true, '🃏 Valendo carta'], [false, '🤝 Amistoso']] as [boolean, string][]} value={bafoValendo} onSet={v => setBafoValendo(v)} />
                  <p className="text-white/45 text-[10.5px] font-bold mt-1.5 leading-snug">
                    {bafoValendo
                      ? <>Quem ficou atrás entrega <b>uma carta sorteada</b> da carreira que trouxe pro time logo acima — e a carta <b>muda de dono de verdade</b>. Quem só tem uma carta não entrega: a casa cobre.</>
                      : <>Ninguém perde nem ganha carta. Só a tabela, pra brincar sem risco.</>}
                  </p>
                </SegField>
                </>
              ) : (
                <SegField label="Depois da liga">
                  {/* 🌎 A Libertadores é a TERCEIRA opção — e nunca vem junto com a
                      Copa dos 8: é uma OU a outra, porque as duas ocupam o mesmo
                      lugar (o que acontece quando a liga acaba). Como é um botão
                      só, não tem estado torto possível. 🔒 Enquanto está em
                      construção, só a conta do Diego enxerga a opção. */}
                  <Seg options={(libertaOn
                    ? [['liga_copa', '🏆 Liga + Copa'], ['liga_liberta', '🌎 Liga + Liberta'], ['liga', '📊 Só liga']]
                    : [['liga_copa', '🏆 Liga + Copa'], ['liga', '📊 Só liga']]) as ['liga_copa' | 'liga_liberta' | 'liga', string][]}
                    value={rapidoCopaMode} onSet={v => setRapidoCopaMode(v)} />
                  <p className="text-white/45 text-[10.5px] font-bold mt-1.5 leading-snug">
                    {rapidoCopaMode === 'liga_liberta'
                      ? <>🌎 Acabou a liga, os <b>8 primeiros</b> entram na Libertadores com <b>24 clubes do continente</b> (32 no total): 8 grupos de 4, passam 2, e o mata-mata vai até a final única. <b>Não tem Copa dos 8</b> nesta sala.</>
                      : rapidoCopaMode === 'liga_copa'
                        ? <>🏆 Acabou a liga, os 8 primeiros disputam a Copa dos 8 — ida e volta até a final única.</>
                        : <>📊 Só a tabela, do começo ao fim. Campeão é quem fizer mais pontos.</>}
                  </p>
                </SegField>
              )}
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
            const copaLbl = r.game_state?.copaMode === 'liga' ? '📊 só liga' : r.game_state?.copaMode === 'liga_liberta' ? '🌎 liga+liberta' : '🏆 liga+copa' // padrão = liga+copa
            const ligaFechadaRoom = !!(r.game_state as GS & { ligaFechada?: boolean })?.ligaFechada // 🏆 liga só com a galera
            const duplasRoom = !!(r.game_state as GS & { duplasMode?: boolean })?.duplasMode // 🤝 sala de duplas
            const ligaRoom = r.game_state?.mode === 'liga' // 🏆 liga: sala que fica de pé, com dia marcado
            return (
              <div key={r.id} className="flex items-center gap-2 border-[3px] border-black rounded-xl p-3" style={{ background: live ? '#EFE6C8' : '#F4ECD6', boxShadow: `3px 3px 0 ${INK}` }}>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-black text-sm flex items-center gap-1.5" style={OSWALD}>
                    {live && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                    <span className="truncate">{r.game_state?.locked ? '🔒 ' : ''}{r.game_state?.stream ? '🎥 ' : ''}{nm}</span>
                    <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border-2 border-black leading-none" style={{ background: GOLD, color: '#000', ...OSWALD }} title="Baralho da sala">{deckLbl}</span>
                    {duplasRoom && (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border-2 border-black leading-none" style={{ background: PURPLE, color: '#fff', ...OSWALD }} title="Sala de duplas: cada time é comandado por 2 pessoas">🤝 DUPLAS</span>
                    )}
                    {ligaRoom && (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border-2 border-black leading-none" style={{ background: GREEN, color: '#fff', ...OSWALD }} title="Liga: a sala fica de pé, com dia marcado e sala de troféus">🏆 LIGA</span>
                    )}
                  </p>
                  <p className="text-black/60 text-xs font-bold mt-0.5">👥 {r.count}{duplasRoom ? ` ${r.count === 1 ? 'pessoa' : 'pessoas'}` : `/${r.max_players}`} · {r.code}{ligaFechadaRoom ? ' · 🏆 liga fechada' : ''}{!isCareerRoom ? ` · ${ritmoLbl} · ${copaLbl}` : ''}{r.game_state?.locked ? ' · fechada' : ''}{r.game_state?.stream ? ' · stream' : ''}{live ? ' · 🔴 jogo rolando' : ''}</p>
                  {ligaRoom && (
                    <p className="font-black text-[11.5px] mt-0.5" style={{ ...OSWALD, color: quandoLiga((r.game_state as GS)?.ligaAt).cor }}>
                      📅 {quandoLiga((r.game_state as GS)?.ligaAt).txt}
                    </p>
                  )}
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
              {salasPresas.length > 0 && (
                <button onClick={encerrarSalasPresas} disabled={encerrando}
                  className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-xs uppercase mt-2"
                  style={{ background: '#C2452F', color: '#fff', boxShadow: '3px 3px 0 #0C0C0C', ...OSWALD }}>
                  {encerrando ? 'Encerrando…' : `🚪 Encerrar ${salasPresas.length === 1 ? 'a sala parada' : 'as salas paradas'} (${salasPresas.join(', ')})`}
                </button>
              )}
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
            {salasPresas.length > 0 && (
                <button onClick={encerrarSalasPresas} disabled={encerrando}
                  className="w-full border-[3px] border-black rounded-xl py-2.5 font-black text-xs uppercase mt-2"
                  style={{ background: '#C2452F', color: '#fff', boxShadow: '3px 3px 0 #0C0C0C', ...OSWALD }}>
                  {encerrando ? 'Encerrando…' : `🚪 Encerrar ${salasPresas.length === 1 ? 'a sala parada' : 'as salas paradas'} (${salasPresas.join(', ')})`}
                </button>
              )}
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
      <button onClick={() => { if (!window.confirm('Sair da conta? Você vai precisar entrar de novo (e-mail/senha ou Google) da próxima vez.')) return; clearSavedRoom(); logout() }} className="text-white/30 text-xs underline w-full text-center">Sair da conta</button>
      <button onClick={() => { clearSavedRoom(); dispatch({ type: 'GO_LOBBY' }) }} className="text-white/40 text-sm underline w-full text-center">← Menu inicial</button>
    </>, () => { clearSavedRoom(); dispatch({ type: 'GO_LOBBY' }) })
  }

  if (phase === 'waiting' && room) {
    // 🤝 DUPLAS — quem é DONO de assento é time; quem tem dupla_partner_of é
    // carona no time do dono. Tudo isto só existe em sala criada no modo Duplas.
    const duplasOn = duplasSala ?? !!(room.game_state as GS & { duplasMode?: boolean })?.duplasMode
    const donos = duplasOn ? players.filter(p => !p.dupla_partner_of) : players
    const parceiroDe = (uid: string) => players.find(p => p.dupla_partner_of === uid)
    const meuRow = players.find(p => p.user_id === user?.id)
    const souParceiro = !!meuRow?.dupla_partner_of
    // 🤝 REGRA DA SALA DE DUPLAS (decisão do Diego, 08/08): a ÚNICA trava é ter
    // pelo menos DUAS duplas fechadas. Mais nada segura o host — quem ficou sem
    // parceiro não trava a sala (senão, com gente ímpar, ninguém jogaria nunca).
    const duplasCompletas = duplasOn ? donos.filter(d => !!parceiroDe(d.user_id)).length : 0
    // 🃏 BAFO: a sala anda com 2 times MONTADOS (11+). Quem não montou não conta.
    const elencoOn = room.game_state?.mode === 'elenco'
    const bafoAptos = elencoOn ? players.filter(p => (p.bafo?.squad?.length ?? 0) >= BAFO_MIN) : []
    const bafoFaltam = elencoOn ? players.filter(p => (p.bafo?.squad?.length ?? 0) < BAFO_MIN) : []
    const ready = elencoOn ? bafoAptos.length >= 2 : duplasOn ? duplasCompletas >= 2 : players.length >= 2
    const travaMsg = elencoOn
      ? (ready ? '' : `🃏 O Bafo começa com 2 times montados. ${bafoAptos.length === 0 ? 'Ninguém montou ainda' : 'Só 1 montou até agora'} — cada um escolhe a carreira que traz aí em cima.`)
      : !duplasOn || ready ? '' :
      `🤝 O pregão abre com 2 duplas fechadas (dois times com 2 pessoas cada). ${duplasCompletas === 0 ? 'Ainda não tem nenhuma' : 'Tem 1 até agora'} — é só a galera ir entrando nos times uns dos outros.`
    const chatOff = !!room.game_state?.chatOff // host desligou o chat na criação
    return wrap(<>
      <div className="text-center">
        {room.game_state?.roomName && <p className="text-white font-black text-xl mb-1" style={OSWALD}>{room.game_state.roomName}</p>}
        <p className="text-white/50 text-[11px] font-black uppercase tracking-widest">Código da Sala</p>
        <p className="font-black text-5xl text-white tracking-[0.2em] mt-1">{room.code}</p>
      </div>

      {/* 🏆 A LIGA TEM HORA MARCADA — e é a primeira coisa que a pessoa precisa ver
          ao abrir a sala. Sem isto o combinado só vivia na cabeça da turma. */}
      {room.game_state?.mode === 'liga' && (() => {
        const gs = room.game_state as GS
        const q = quandoLiga(gs?.ligaAt)
        return (
          <div className="rounded-2xl border-[3px] border-black p-3" style={{ background: GREEN, boxShadow: `4px 4px 0 ${INK}` }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest" style={OSWALD}>🏆 Liga fechada · próximo jogo</p>
                <p className="text-white font-black text-lg leading-tight" style={OSWALD}>{q.txt}</p>
                <p className="text-white/70 text-[11px] font-bold mt-0.5">{gs?.ligaFechada ? '🚫 sem bots — só a galera na tabela' : '🤖 com bots até 20 times'}</p>
              </div>
            </div>
            {mandaNaLiga && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => {
                  const d = gs?.ligaAt ? new Date(gs.ligaAt) : new Date()
                  const pad = (n: number) => String(n).padStart(2, '0')
                  setLigaEditData(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
                  setLigaEditHora(`${pad(d.getHours())}:${pad(d.getMinutes())}`)
                  setLigaEdit(true)
                }} className="border-2 border-black rounded-xl py-2 font-black text-[11.5px] bg-white text-black active:translate-y-0.5" style={OSWALD}>
                  📅 Mudar dia e hora
                </button>
                <button onClick={() => patchLiga({ ligaFechada: !gs?.ligaFechada })}
                  className="border-2 border-black rounded-xl py-2 font-black text-[11.5px] bg-white text-black active:translate-y-0.5" style={OSWALD}>
                  🤖 {gs?.ligaFechada ? 'Pôr bots' : 'Tirar bots'}
                </button>
              </div>
            )}
            {/* 📅 REMARCAR EM UM TOQUE. O Diego: *"deve poder remarcar fácil pra
                qualquer dia e hora, seja dia seguinte, uma semana, tanto faz"*.
                Os atalhos empurram a MESMA hora pra frente; pra trocar a hora é
                o "mudar dia e hora" logo acima. E se ninguém remarcar, a data
                velha FICA — o jogo não inventa data por conta própria. */}
            {mandaNaLiga && !ligaEdit && (
              <div className="flex gap-2 mt-2">
                {([['+1 dia', 1], ['+1 semana', 7], ['+15 dias', 15]] as [string, number][]).map(([rot, dias]) => (
                  <button key={rot} onClick={() => {
                    const base = gs?.ligaAt ? new Date(gs.ligaAt) : new Date()
                    const d = new Date(base.getTime() + dias * 864e5)
                    void patchLiga({ ligaAt: d.toISOString() })
                  }} className="flex-1 border-2 border-black rounded-lg py-1.5 font-black text-[11px] bg-white text-black active:translate-y-0.5" style={OSWALD}>
                    📅 {rot}
                  </button>
                ))}
              </div>
            )}
            {/* ⚖️ A REGRA DO RANKING FICA AQUI, NA ESPERA (Diego 23/08): *"tem q
                ter algo pro criador da sala tipo os ajustes ter p ele na sala de
                espera... pq o jogo já começa no pregão"*. Ele precisa decidir ANTES
                da bola rolar — depois do pregão não tem volta. E a regra que está
                valendo aparece pra TODO MUNDO numa linha: o convidado não entra no
                escuro sem saber por que fulano lidera. */}
            <p className="text-white/60 text-[10px] font-bold leading-snug mt-2 pt-2" style={{ borderTop: '1.5px solid rgba(255,255,255,.2)' }}>
              ⚖️ {resumoRegra(lerRegras(gs?.ligaRegras))} <span className="text-white/40">— todo mundo vê</span>
            </p>
            {mandaNaLiga && !ligaEdit && (
              <button onClick={() => setLigaRegrasAberto(v => !v)}
                className="w-full mt-2 border-2 border-black rounded-xl py-2 font-black text-[11.5px] active:translate-y-0.5"
                style={{ ...OSWALD, background: ligaRegrasAberto ? '#fff' : GOLD, color: INK }}>
                ⚖️ {ligaRegrasAberto ? 'Fechar as regras' : 'Regras do ranking'}
              </button>
            )}
            {mandaNaLiga && ligaRegrasAberto && (
              <div className="mt-2">
                <RegrasDaLiga regras={lerRegras(gs?.ligaRegras)} salvar={(r: LigaRegras) => { void patchLiga({ ligaRegras: r }) }} />
              </div>
            )}
            {/* 👑 NÃO EXISTE ADM NA LIGA (Diego 23/08, decisão permanente).
                Palavras dele: *"não tem negócio de quem manda junto.. só quem manda
                é o host mesmo. Não tem adm não"*. Tinha aqui um botão "⭐ Quem mais
                pode mexer" que dava a outro jogador o poder de remarcar, arrumar
                troféu e mexer nas regras — SAIU. É a mesma régua da coroa
                (`ELEICAO_AUTOMATICA = false`): quem criou a sala manda do começo ao
                fim, e ninguém divide o comando. NÃO REPROPOR.
                O campo `ligaAdmins` continua existindo no banco só pra não quebrar
                liga antiga que já tenha alguém na lista — mas ele não dá poder
                nenhum e não tem mais tela pra mexer nele. */}
            {mandaNaLiga && ligaEdit && (
              <div className="mt-3 rounded-xl border-2 border-black bg-white p-3">
                <p className="font-black text-[11px] uppercase tracking-wider text-black/50 mb-1.5" style={OSWALD}>📅 Quando vocês jogam</p>
                <div className="flex gap-2">
                  <input type="date" value={ligaEditData} onChange={e => setLigaEditData(e.target.value)}
                    className="flex-1 min-w-0 border-2 border-black rounded-lg px-2 py-1.5 font-black text-black text-[13px] bg-white" style={OSWALD} />
                  <input type="time" value={ligaEditHora} onChange={e => setLigaEditHora(e.target.value)}
                    className="w-[96px] border-2 border-black rounded-lg px-2 py-1.5 font-black text-black text-[13px] bg-white" style={OSWALD} />
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={async () => {
                    const d = new Date(`${ligaEditData}T${ligaEditHora}`)
                    if (isNaN(d.getTime())) return
                    await patchLiga({ ligaAt: d.toISOString() }); setLigaEdit(false)
                  }} className="flex-1 border-2 border-black rounded-lg py-2 font-black text-xs text-white" style={{ background: GREEN, ...OSWALD }}>Salvar</button>
                  <button onClick={() => setLigaEdit(false)}
                    className="flex-1 border-2 border-black rounded-lg py-2 font-black text-xs bg-white text-black" style={OSWALD}>Cancelar</button>
                </div>
                <p className="text-black/45 text-[10.5px] font-bold leading-snug mt-2">
                  Mudar a data <b>não perde troféu nenhum</b> — a liga é a mesma sala de sempre.
                </p>
              </div>
            )}
          </div>
        )
      })()}

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

      {/* 🃏 BAFO: antes de tudo, o técnico escolhe qual carreira traz. Enquanto não
          escolher, ele fica "montando" — e o host vê isso na lista.
          A escolha vai pro banco na hora (coluna `bafo` do room_players): é assim
          que o time viaja pro host e que todo mundo vê quem já está apto. */}
      {/* 🃏 e ANTES de escolher, o aviso do que está em jogo nesta sala. Ninguém
          pode descobrir só no fim que a carta ia mudar de dono de verdade. */}
      {room.game_state?.mode === 'elenco' && (
        <div className="border-[3px] border-black rounded-2xl px-3 py-2.5 mb-3"
          style={{ background: room.game_state?.bafoSemCarta ? '#EAF4EC' : '#FFF6D6', boxShadow: `3px 3px 0 ${INK}` }}>
          <p className="font-black text-[13px]" style={OSWALD}>
            {room.game_state?.bafoSemCarta ? '🤝 Sala AMISTOSA' : '🃏 Sala VALENDO CARTA'}
          </p>
          <p className="text-black/60 text-[10.5px] font-bold leading-snug mt-0.5">
            {room.game_state?.bafoSemCarta
              ? 'Ninguém perde nem ganha carta aqui. É só a tabela.'
              : <>No fim da liga, quem ficar atrás <b>entrega uma carta sorteada</b> da carreira que trouxe pro time logo acima — e ela <b>muda de dono de verdade</b>. Quem só tem uma carta não entrega: a casa cobre.</>}
          </p>
        </div>
      )}
      {room.game_state?.mode === 'elenco' && (
        <BafoEscolha escolha={bafoEscolha} onEscolha={async (e) => {
          setBafoEscolha(e)
          if (!user) return
          const time = e ? montarBafo(e.seed, e.via) : null
          // 🛡️ trava de verdade (a tela é só a cara dela): time com menos de 11
          // NÃO grava — ninguém fica apto com elenco furado, nem por caminho torto.
          const ok = time && time.squad.length >= BAFO_MIN ? time : null
          await supabase.from('room_players').update({ bafo: ok }).eq('room_id', room.id).eq('user_id', user.id).then(() => {}, () => {})
        }} />
      )}

      <div className="border-[3px] border-black rounded-2xl p-4 bg-[#F4ECD6]" style={{ boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="text-black/60 text-[11px] font-black uppercase tracking-widest mb-3">
          {duplasOn ? `Times (${donos.length}/20) · ${players.length} ${players.length === 1 ? 'pessoa' : 'pessoas'}` : `Técnicos (${players.length}/${room.max_players})`}
        </p>
        <div className="space-y-2">
          {donos.map(p => {
            const par = duplasOn ? parceiroDe(p.user_id) : undefined
            const souEu = p.user_id === user?.id
            // 🤝 PEDIDO (09/08): quem, se alguém, mandou pedido pra ENTRAR na vaga
            // de `p`. `dupla_request_to` mora na linha de QUEM PEDIU, então acho
            // procurando quem aponta pra `p.user_id`.
            const pedidoPara = players.find(x => x.dupla_request_to === p.user_id)
            const euPediParaEla = pedidoPara?.user_id === user?.id
            // 🌍 PADRÃO ABERTO (pedido do Diego): a vaga nasce livre pra qualquer
            // um da sala — só o 🔒 cadeado fecha, ou já ter um pedido chegando nela
            // (não deixa dois pedidos brigando pela mesma pessoa). Posso pedir se eu
            // mesmo ainda não estou em dupla nem tenho outro pedido em aberto.
            const livreProMim = duplasOn && !par && !souEu && p.dupla_seek !== 'privada' && (!pedidoPara || euPediParaEla)
            const posso = livreProMim && !souParceiro && !parceiroDe(user?.id ?? '') && !meuRow?.dupla_request_to
            // 🎨 cor do NOME (não só a bolinha do avatar — pedido do Diego 17/08):
            // só pinta o texto quando tem um selo de verdade no nome (👑⭐💎🟢);
            // sem selo, o nome continua preto igual sempre foi — não muda a cara
            // de ninguém que não tem tier.
            const pk = perkFromName(p.manager_name)
            return (
            <div key={p.user_id} className={duplasOn ? 'rounded-xl border-2 border-black/15 p-2' : ''} style={duplasOn ? { background: '#fff' } : undefined}>
              <div className="flex items-center gap-3">
                {(() => { const pkAv = pk ?? APOIO_PERKS.bege; return (
                  <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-sm font-black"
                    style={{ background: pkAv.grad, position: 'relative', overflow: 'hidden', color: '#0C0C0C' }}>
                    <span style={{ position: 'relative', zIndex: 2 }}>{stripEmoji(p.manager_name).trim()[0]?.toUpperCase()}</span>
                    {pkAv.holo > 0 && <ApoioSheen holo={pkAv.holo} dur={2.6} />}
                  </div>
                ) })()}
                <span className="font-black text-black text-sm flex-1" style={pk ? { color: pk.solid } : undefined}>{duplasOn && par ? (p.dupla_name || nomeAutoDupla(p.manager_name, par.manager_name)) : p.manager_name}</span>
                {duplasOn && <span className="text-[10px] font-black uppercase border border-black px-2 py-0.5 rounded-full" style={{ background: par ? GREEN : '#e6dcbf', color: par ? '#fff' : 'rgba(0,0,0,.6)' }}>{par ? '2/2 ✅' : '1/2'}</span>}
                {/* 🃏 BAFO: o estado de cada um, na lista — o host bate o olho e sabe
                    quem é demora e quem é problema. Três estados só, sem meio-termo. */}
                {room.game_state?.mode === 'elenco' && (
                  <span className="text-[9.5px] font-black uppercase border-2 border-black rounded-full px-2 py-0.5 whitespace-nowrap"
                    style={p.bafo ? { background: GREEN, color: '#fff' } : { background: '#FFD9CE', color: '#8E2A1B' }}>
                    {p.bafo ? `✅ ${p.bafo.squad?.length ?? 0} jog.` : '⏳ montando'}
                  </span>
                )}
                {p.user_id === room.host_id && <span className="text-[10px] font-black uppercase bg-yellow-400 border border-black px-2 py-0.5 rounded-full">HOST</span>}
                {isHost && p.user_id !== user?.id && (
                  <button onClick={() => kickFromRoom(p)} aria-label={`Remover ${p.manager_name}`}
                    className="shrink-0 w-6 h-6 rounded-full border border-black/20 text-black/40 font-black text-xs leading-none active:opacity-60"
                    style={{ background: '#fff' }}>✕</button>
                )}
              </div>
              {/* 🤝 linha do PARCEIRO — mesmo time, embaixo do dono */}
              {par && (
                <div className="flex items-center gap-3 mt-1.5 pl-3" style={{ borderLeft: `3px solid ${GREEN}` }}>
                  <span className="text-sm">🤝</span>
                  <span className="font-black text-black/75 text-[13px] flex-1">{stripEmoji(p.manager_name).trim()} <span className="text-black/35">+</span> {par.manager_name}</span>
                  {(par.user_id === user?.id || p.user_id === user?.id) && (
                    <button onClick={() => desfazerDupla(p.user_id, par.user_id)} className="text-[10px] font-black uppercase underline text-black/45 active:opacity-60">
                      {par.user_id === user?.id ? 'Sair da dupla' : 'Desfazer a dupla'}
                    </button>
                  )}
                </div>
              )}
              {/* 🏷️ NOME DO TIME DA DUPLA — o time é dos dois, então precisa de um
                  nome dos dois. Vazio = "Fulano | Beltrano" automático. */}
              {par && (p.user_id === user?.id || par.user_id === user?.id) && (
                <div className="mt-2 pt-2" style={{ borderTop: '2px solid rgba(0,0,0,.1)' }}>
                  <p className="text-black/60 text-[10.5px] font-black uppercase tracking-wide mb-1" style={OSWALD}>🏷️ Nome do time de vocês</p>
                  <input
                    defaultValue={p.dupla_name ?? ''}
                    placeholder={nomeAutoDupla(p.manager_name, par.manager_name)}
                    maxLength={24}
                    onBlur={e => { if ((e.target.value ?? '') !== (p.dupla_name ?? '')) salvarNomeDupla(p.user_id, e.target.value) }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    className="w-full border-2 border-black rounded-xl px-2.5 py-1.5 font-black text-[13px] bg-white text-black"
                    style={OSWALD} />
                  <p className="text-black/45 text-[10.5px] font-bold leading-snug mt-1">
                    {p.dupla_name
                      ? 'É esse nome que vai aparecer na tabela e no placar. Qualquer um dos dois pode mudar.'
                      : `Deixando em branco, o time se chama "${nomeAutoDupla(p.manager_name, par.manager_name)}". Qualquer um dos dois pode escolher outro.`}
                  </p>
                </div>
              )}
              {/* ✋ DIVIDIR AS POSIÇÕES — só aparece pra quem É da dupla */}
              {par && (p.user_id === user?.id || par.user_id === user?.id) && (() => {
                const cats = (p.dupla_categories ?? {}) as Partial<Record<DuplaCat, string>>
                const meu = (c: DuplaCat) => cats[c] === user?.id
                const doOutro = (c: DuplaCat) => !!cats[c] && cats[c] !== user?.id
                const minhas = DUPLA_CATS.filter(meu).length
                const nomeDoOutro = stripEmoji(user?.id === p.user_id ? par.manager_name : p.manager_name).trim()
                const fechou = DUPLA_CATS.every(c => !!cats[c])
                return (
                  <div className="mt-2 pt-2" style={{ borderTop: '2px solid rgba(0,0,0,.1)' }}>
                    <p className="text-black/60 text-[10.5px] font-black uppercase tracking-wide mb-1.5" style={OSWALD}>
                      ✋ Quem cuida de quê {fechou ? '· dividido ✅' : `· suas ${minhas}/3`}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {DUPLA_CATS.map(c => (
                        <button key={c} onClick={() => tocarCategoria(p, c)} disabled={doOutro(c)}
                          className="border-2 border-black rounded-lg py-1.5 px-1 font-black text-[10.5px] leading-tight active:translate-y-0.5"
                          style={{
                            ...OSWALD,
                            background: meu(c) ? GREEN : doOutro(c) ? '#e6dcbf' : '#fff',
                            color: meu(c) ? '#fff' : doOutro(c) ? 'rgba(0,0,0,.45)' : '#000',
                            cursor: doOutro(c) ? 'default' : 'pointer',
                          }}>
                          <span style={{ fontSize: 13 }}>{DUPLA_CAT_ICON[c]}</span><br />{DUPLA_CAT_LABEL[c]}
                        </button>
                      ))}
                    </div>
                    <p className="text-black/45 text-[10.5px] font-bold leading-snug mt-1.5">
                      {fechou
                        ? `Tudo dividido: o verde é seu, o resto é do ${nomeDoOutro}. Na hora do leilão, só quem manda na posição dá o lance.`
                        : `Toque em 3 posições. As outras 3 ficam automático com o ${nomeDoOutro} — e se vocês não escolherem, o jogo divide sozinho na hora de começar.`}
                    </p>
                  </div>
                )
              })()}
              {/* 🤝 TIME SEM PARCEIRO — o que EU vejo depende de ser meu ou não,
                  e de ter (ou não) um pedido rolando nessa vaga */}
              {duplasOn && !par && (
                <div className="mt-1.5 pl-3" style={{ borderLeft: '3px dashed rgba(0,0,0,.25)' }}>
                  {/* time de OUTRA pessoa */}
                  {!souEu && (
                    euPediParaEla ? (
                      <div className="flex items-center justify-between gap-2 py-1">
                        <p className="text-black/55 text-[11.5px] font-black" style={OSWALD}>⏳ Pedido enviado — esperando {stripEmoji(p.manager_name).trim()} responder…</p>
                        <button onClick={cancelarPedido} className="text-[10px] font-black uppercase underline text-black/45 active:opacity-60 shrink-0">Cancelar</button>
                      </div>
                    ) : posso ? (
                      <button onClick={() => pedirDupla(p)}
                        className="w-full border-2 border-black rounded-xl py-2 font-black text-[12px] active:translate-y-0.5"
                        style={{ background: GOLD, color: '#000', ...OSWALD }}>
                        🤝 Pedir pra jogar junto com {stripEmoji(p.manager_name).trim()}
                      </button>
                    ) : (
                      <p className="text-black/45 text-[11.5px] font-bold py-1">
                        {p.dupla_seek === 'privada' ? '🔒 Guardando a vaga pra um amigo'
                          : pedidoPara ? `⏳ ${stripEmoji(pedidoPara.manager_name).trim()} já mandou um pedido — aguardando resposta`
                          : meuRow?.dupla_request_to ? '⏳ Você já tem um pedido em aberto com outra pessoa'
                          : '🤝 Já está em dupla'}
                      </p>
                    )
                  )}
                  {/* MEU time: se chegou pedido de alguém, primeiro isso — senão o
                      cadeado de sempre. Jogar sozinho não existe: a sala é de duplas. */}
                  {souEu && (pedidoPara ? (
                    <div className="rounded-xl border-2 border-black p-2.5" style={{ background: '#FFF7DE' }}>
                      <p className="font-black text-[12.5px] text-black" style={OSWALD}>🤝 {stripEmoji(pedidoPara.manager_name).trim()} quer jogar de dupla com você!</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => responderPedido(pedidoPara.user_id, true)}
                          className="flex-1 border-2 border-black rounded-lg py-1.5 font-black text-[11.5px] active:translate-y-0.5" style={{ background: GREEN, color: '#fff', ...OSWALD }}>✅ Aceitar</button>
                        <button onClick={() => responderPedido(pedidoPara.user_id, false)}
                          className="flex-1 border-2 border-black rounded-lg py-1.5 font-black text-[11.5px] active:translate-y-0.5" style={{ background: '#fff', color: '#000', ...OSWALD }}>✕ Recusar</button>
                      </div>
                    </div>
                  ) : (<>
                    <p className="text-black/55 text-[11.5px] font-black py-0.5" style={OSWALD}>
                      {p.dupla_seek === 'privada' ? '🔒 CADEADO — guardando a vaga pro seu amigo' : '🌍 QUALQUER UM PODE TE PEDIR PRA JOGAR JUNTO'}
                    </p>
                    <p className="text-black/40 text-[10.5px] font-bold leading-snug mb-1">
                      {p.dupla_seek === 'privada'
                        ? 'Ninguém de fora consegue te pedir. Mande o link pro seu amigo — quando ele chegar, tire o cadeado pra ele poder pedir.'
                        : 'Quem estiver na sala pode te chamar — você decide aceitar ou não. Corre atrás de um parceiro: o pregão abre assim que 2 duplas fecharem.'}
                    </p>
                    <button onClick={() => procurarParceiro(p.dupla_seek === 'privada' ? null : 'privada')}
                      className="w-full border-2 border-black rounded-xl py-1.5 font-black text-[11px] active:translate-y-0.5"
                      style={{ background: '#fff', color: '#000', ...OSWALD }}>
                      {p.dupla_seek === 'privada' ? '🌍 Tirar o cadeado (deixar qualquer um te pedir)' : '🔒 Pôr cadeado (guardar pro meu amigo)'}
                    </button>
                  </>))}
                </div>
              )}
            </div>
            )
          })}
          {players.length < 2 && <p className="text-black/40 text-xs italic mt-1">Aguardando mais técnicos…</p>}
          {duplasOn && (
            <p className="text-black/45 text-[11px] font-bold leading-snug mt-2 pt-2" style={{ borderTop: '2px solid rgba(0,0,0,.1)' }}>
              🤝 Aqui se joga de dois: um cuida de 3 posições, o outro das outras 3. Qualquer um da sala pode entrar no seu time; se quiser guardar a vaga pro seu amigo, é só pôr o 🔒 cadeado. O pregão abre com 2 duplas fechadas — então corre atrás do seu parceiro antes.
            </p>
          )}
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
              {([['ligar', '📞', '"Posso te ligar agora?"'], ['meme2', '🎙️', 'AQUELE áudio'], ['siuu', '🗣️', 'SIIIIUU!'], ['novo5', '🔊', 'Áudio novo'], ['jacare', '🐊', 'Silenciar aqui'], ['bomdia', '☀️', 'Bom dia']] as [string, string, string][]).map(([k, ic, tx]) => (
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
      {/* 🃏 BAFO: o host mandou começar com gente ainda montando. Mesmo padrão da
          votação do fim de jogo: diz QUEM falta e deixa ele escolher esperar ou
          seguir. Quem fica de fora sai da sala — não vira time sorteado. */}
      {bafoAviso && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div style={{ background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `6px 6px 0 0 ${INK}`, maxWidth: 400, width: '100%', padding: 20 }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, color: INK, textAlign: 'center' }}>⏳ Ainda tem gente montando</p>
            <p style={{ fontWeight: 700, fontSize: 12.5, color: 'rgba(0,0,0,.68)', marginTop: 8, lineHeight: 1.45 }}>
              Não escolheram a carreira ainda: <b>{bafoFaltam.map(p => stripEmoji(p.manager_name)).join(', ')}</b>.
            </p>
            <p style={{ fontWeight: 700, fontSize: 11.5, color: 'rgba(0,0,0,.5)', marginTop: 6, lineHeight: 1.45 }}>
              Se seguir agora, <b>eles ficam de fora desta partida</b> (ninguém entra em campo com time sorteado). Dá pra chamar de novo depois.
            </p>
            <button onClick={() => { setBafoAviso(false); void startOnline() }}
              style={{ ...OSWALD, fontWeight: 900, fontSize: 14.5, background: GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}`, padding: '11px 0', width: '100%', marginTop: 14, cursor: 'pointer' }}>
              ▶️ Seguir sem eles
            </button>
            <button onClick={() => setBafoAviso(false)}
              style={{ ...OSWALD, fontWeight: 900, fontSize: 14.5, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 0 ${INK}`, padding: '11px 0', width: '100%', marginTop: 8, cursor: 'pointer' }}>
              ⏳ Aguardar mais um pouco
            </button>
          </div>
        </div>
      )}
      {/* 🏆 O PAREDÃO DE TROFÉUS SAIU DAQUI (Diego 23/08). Palavras dele: *"talvez
          então n tenha nada na sala de espera... tb é uma ideia p n confundir"*.
          A mesma informação aparecia em dois lugares com dois nomes e duas caras
          (aqui e no fim do jogo), e nada batia. Agora é UM lugar só, em pílulas
          (🏆 Rank · 🏅 Estante · 📜 Temporadas · ⚙️ Ajustes), e ele aparece assim
          que o PREGÃO ACABA — ver `ligahub.tsx`. Na espera fica só o ⚖️ do dono
          (lá em cima, na faixa verde), porque a regra tem que ser decidida ANTES
          da bola rolar. */}
      {(() => {
        const carreira = room.game_state?.mode === 'carreira'
        const startLabel = carreira ? '🌐 Começar Carreira!' : elencoOn ? '🃏 Começar o Bafo!' : '🔨 Abrir o Pregão!'
        // 🏆 LIGA — decisão do Diego (20/08, opção A): *só o DONO abre o pregão*,
        // igual às salas de hoje. Simples, sem passar coroa pra ninguém. Pra isso
        // não virar novela quando ele atrasa, a tela DIZ o que está acontecendo:
        // se o dono ainda não chegou, todo mundo vê — em vez de ficar olhando um
        // "aguardando…" sem saber o quê.
        const ligaOnSala = room.game_state?.mode === 'liga'
        const donoNaSala = players.some(p => p.user_id === room.host_id)
        const waitMsg = carreira ? 'Aguardando o host começar a carreira…' : elencoOn ? 'Aguardando o host começar o Bafo…'
          : ligaOnSala ? (donoNaSala ? '👑 O dono da liga já está aqui — ele abre o pregão quando quiser.' : '👑 O dono da liga ainda não chegou. Só ele abre o pregão — chame no zap!')
          : 'Aguardando o host abrir o pregão…'
        const esperaLabel = elencoOn ? `Aguardando… (${bafoAptos.length}/2 montados)` : duplasOn ? 'Aguardando…' : `Aguardando… (${players.length}/2 mín)`
        // 🃏 se falta alguém montar, o toque abre o banner em vez de começar
        const onStart = () => { if (elencoOn && bafoFaltam.length > 0) setBafoAviso(true); else void startOnline() }
        return isHost
          ? <>
              <Big onClick={onStart} disabled={!ready} color={ready ? GREEN : '#ccc'}><span style={{ color: ready ? '#fff' : '#000' }}>{ready ? startLabel : esperaLabel}</span></Big>
              {/* explicação EMBAIXO do botão, no lugar exato — dizendo o porquê e o caminho pra destravar */}
              {!ready && !!travaMsg && <p className="text-white/60 text-[11.5px] font-bold text-center leading-snug mt-1.5 px-2">{travaMsg}</p>}
            </>
          : <p className="text-white/60 text-sm font-bold text-center py-3">{waitMsg}</p>
      })()}
      {/* 🚪🗑️ SAIR e EXCLUIR juntos, no PÉ DA TELA (Diego 22/08: *"eu acho q além de
          sair da sala deve ter um botão dentro da sala de excluir sala tb não?"*).
          O excluir da liga EXISTIA, mas morava lá em cima, dentro da faixa verde do
          próximo jogo — ninguém procura "apagar" no topo. Os pesos são diferentes de
          propósito: sair é um link discreto (você volta quando quiser), excluir é
          vermelho e chapado (some com tudo, pra todo mundo).
          🚨 E o SAIR passa a dizer a verdade na sala rápida: quando quem sai é o
          DONO, o jogo APAGA a sala inteira — sempre apagou, só que sem avisar
          ninguém. Sala rápida não existe sem dono. Na liga é o contrário: sair não
          apaga nada, por isso o texto muda. */}
      {(() => {
        const ehLiga = room.game_state?.mode === 'liga'
        const souDonoAqui = room.host_id === user?.id
        const rotuloSair = ehLiga || !souDonoAqui ? '🚪 Sair da sala' : '🚪 Sair e encerrar a sala'
        return (
          <div className="space-y-1.5">
            {ehLiga && isHost ? (
              <div className="flex gap-2">
                <button onClick={leaveRoom}
                  className="flex-1 rounded-xl py-2 font-black text-[12px] text-white/70 border-2 border-dashed border-white/30 active:opacity-60" style={OSWALD}>
                  🚪 Sair da sala
                </button>
                <button onClick={excluirLiga}
                  className="flex-1 rounded-xl py-2 font-black text-[12px] text-white border-2 border-black active:translate-y-0.5" style={{ background: '#C2452F', ...OSWALD }}>
                  🗑️ Excluir a liga
                </button>
              </div>
            ) : (
              <button onClick={leaveRoom} className="text-white/75 text-[13px] font-black underline w-full text-center active:opacity-60">{rotuloSair}</button>
            )}
            <p className="text-white/40 text-[10.5px] font-bold text-center leading-snug">
              {ehLiga
                ? (isHost
                  ? <>Sair <b>não apaga nada</b> — a liga fica de pé com os troféus. Excluir some com a sala <b>e a sala de troféus</b>, pra todo mundo.</>
                  : <>Você volta quando quiser — é só o código.</>)
                : (souDonoAqui
                  ? <>Sala rápida <b>não existe sem o dono</b>: ao sair, ela é encerrada pra todo mundo.</>
                  : <>Você volta quando quiser — é só o código.</>)}
            </p>
          </div>
        )
      })()}

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
