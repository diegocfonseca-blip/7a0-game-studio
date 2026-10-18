// ─── 👥 AMIGOS + PERFIL PÚBLICO (18/10) ───────────────────────────────────────────────────────────────────────────
// Ideia do Diego ("estilo Orkut", SEM comunidades — *"é doideira, melhor não"*). Mockup aprovado (*"adorei"*):
// `scripts/mockups/amigos-perfil.png`. Por enquanto só a conta dele enxerga (`useAmigos()` em sport.ts).
//
// · Tudo passa por funções do banco (`esc_amigo_pedir/responder/desfazer`, `esc_amigos_lista`, `esc_perfil_publico`,
//   migration 20261018030000): amizade só vale com os DOIS aceitando e nenhuma delas devolve e-mail.
// · "Online agora" = batida do jogo (`live_beats`) nos últimos 3 min, lida SÓ quando a lista abre — nada de canal nem
//   mensagem periódica (regra do tráfego, 04/10).
// · Cada um com a cor do PRÓPRIO plano (grátis = bege) e o presidente só de quem tem (Craque+); sem boneco, vai a inicial.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { APOIO_PERKS, ApoioSheen, type ApoioTier } from './apoio'
import { PresidenteDaConta } from './presidente-avatar'
import { Escudo } from './escudos'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const contaValida = (uid: string | null | undefined): uid is string => !!uid && UUID.test(uid)

type Titulos = { ligas: number; serie_a: number; copas: number; supercopas: number; libertadores: number; champions: number; mundial: number; copa_mundo: number; salas: number; temporadas: number }
type Perfil = {
  uid: string; nome: string; clube: string | null; tier: ApoioTier | null; fundador_n: number | null
  titulos: Titulos; rank: { pos: number; total: number; temporada: number; clube: string | null } | null; amigos_total: number; amigos: { uid: string; nome: string }[]
  relacao: 'aceito' | 'enviado' | 'recebido' | null; amizade_id: number | null; sou_eu: boolean
}
type Linha = { amizade_id: number; outro: string; nome: string; relacao: 'aceito' | 'enviado' | 'recebido'; visto_em: string | null; tela: string | null; online: boolean }

const inicial = (nome: string) => (nome.replace(/[^\p{L}\p{N}]/gu, '')[0] ?? '?').toUpperCase()
function Bolinha({ nome, size }: { nome: string; size: number }) {
  return <span style={{ width: size, height: size, flex: 'none', borderRadius: '50%', border: `2px solid ${INK}`, background: '#e9dfc4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...OSW, fontSize: size * .42 }}>{inicial(nome)}</span>
}
function Rosto({ uid, nome, size }: { uid: string; nome: string; size: number }) {
  return <PresidenteDaConta uid={uid} size={size} reserva={<Bolinha nome={nome} size={size} />} />
}

// "visto há 2 h" / "ontem" / "há 3 dias"
function vistoHa(iso: string | null): string {
  if (!iso) return tr('ainda não jogou', 'hasn’t played yet')
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 60) return tr(`visto há ${Math.max(1, min)} min`, `seen ${Math.max(1, min)} min ago`)
  const h = Math.round(min / 60)
  if (h < 24) return tr(`visto há ${h} h`, `seen ${h} h ago`)
  const d = Math.round(h / 24)
  return d <= 1 ? tr('visto ontem', 'seen yesterday') : tr(`visto há ${d} dias`, `seen ${d} days ago`)
}
// onde a pessoa está, pela última batida do jogo (modo:tela)
function ondeEsta(tela: string | null): string {
  const [modo, scr] = (tela ?? '').split(':')
  if (modo === 'online') return scr === 'lobby' ? tr('numa sala de espera', 'in a waiting room') : tr('jogando numa sala online', 'playing in an online room')
  if (modo === 'career') return tr('na carreira', 'in career mode')
  if (scr === 'intro' || scr === 'lobby' || scr === 'setup') return tr('no menu', 'in the menu')
  return tr('numa partida rápida', 'in a quick match')
}

function Janela({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '92vh', overflowY: 'auto', color: INK, background: CREME, border: `3px solid ${INK}`, borderRadius: 20, boxShadow: `5px 5px 0 ${INK}`, padding: 12 }}>
        <div style={{ background: INK, color: GOLD, borderRadius: 12, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...OSW, fontSize: 15 }}>
          <span>{titulo}</span>
          <button onClick={onClose} aria-label={tr('Fechar', 'Close')} style={{ background: 'none', border: 'none', color: GOLD, fontSize: 18, fontWeight: 900, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
const caixa: CSSProperties = { color: INK, background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10, marginTop: 10 }
const h3: CSSProperties = { ...OSW, fontSize: 14, margin: '0 0 6px', color: INK }
const bt = (bg: string, cor: string): CSSProperties => ({ ...OSW, fontSize: 12, border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 10px', background: bg, color: cor, boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer', whiteSpace: 'nowrap' })

// ── 👤 PERFIL ──────────────────────────────────────────────────────────────────────────────────────────────────
export function PerfilPublico({ uid, onClose, onAbrirOutro }: { uid: string; onClose: () => void; onAbrirOutro?: (uid: string) => void }) {
  const [p, setP] = useState<Perfil | null | 'erro'>(null)
  const [atual, setAtual] = useState(uid)
  const [ocupado, setOcupado] = useState(false)
  const carrega = (u: string) => {
    setP(null)
    supabase.rpc('esc_perfil_publico', { p_uid: u }).then(({ data, error }) => setP(error || !data ? 'erro' : data as Perfil), () => setP('erro'))
  }
  useEffect(() => { carrega(atual) }, [atual])
  const abrir = (u: string) => { if (onAbrirOutro) onAbrirOutro(u); else setAtual(u) }
  const acao = async (fn: () => PromiseLike<unknown>) => { setOcupado(true); try { await fn() } finally { setOcupado(false); carrega(atual) } }

  const perk = APOIO_PERKS[(p && p !== 'erro' && p.tier && APOIO_PERKS[p.tier]) ? p.tier : 'bege']
  const tits: [string, string, keyof Titulos][] = [
    ['🥇', tr('Ligas', 'Leagues'), 'ligas'], ['🏆', tr('Copas', 'Cups'), 'copas'], ['🛡️', tr('Supercopas', 'Super Cups'), 'supercopas'],
    ['🌎', 'Libertadores', 'libertadores'], ['⭐', 'Champions', 'champions'], ['🌍', tr('Mundial', 'Club World Cup'), 'mundial'],
    ['🌐', tr('Copa do Mundo', 'World Cup'), 'copa_mundo'], ['🥇', tr('Série A', 'Serie A'), 'serie_a'], ['📅', tr('Temporadas', 'Seasons'), 'temporadas'],
  ]
  return (
    <Janela titulo={tr('👤 Perfil', '👤 Profile')} onClose={onClose}>
      {p === null && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('carregando…', 'loading…')}</p>}
      {p === 'erro' && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('Não consegui abrir esse perfil agora. Tenta de novo.', 'Couldn’t open this profile right now. Try again.')}</p>}
      {p && p !== 'erro' && <>
        <div style={{ position: 'relative', overflow: 'hidden', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12, marginTop: 10, background: perk.grad, display: 'flex', gap: 12, alignItems: 'center' }}>
          {perk.holo > 0 && <ApoioSheen holo={perk.holo} dur={3} />}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <PresidenteDaConta uid={p.uid} size={86} reserva={p.clube ? <span style={{ width: 86, height: 86, borderRadius: '50%', border: `3px solid ${INK}`, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Escudo nome={p.clube} size={60} /></span> : <Bolinha nome={p.nome} size={86} />} />
          </div>
          <div style={{ position: 'relative', zIndex: 2, minWidth: 0 }}>
            <div style={{ ...OSW, fontSize: 22, lineHeight: 1, color: INK }}>{p.nome}</div>
            {p.clube && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, ...OSW, fontSize: 13, color: INK }}><Escudo nome={p.clube} size={22} />{p.clube}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {p.fundador_n != null && <span style={{ ...OSW, fontSize: 10.5, background: INK, color: GOLD, borderRadius: 7, padding: '2px 7px' }}>🖋 {tr('Fundador nº', 'Founder no.')} {p.fundador_n}</span>}
              {p.tier === 'ouro' && <span style={{ ...OSW, fontSize: 10.5, background: INK, color: GOLD, borderRadius: 7, padding: '2px 7px' }}>👑 {tr('Lenda', 'Legend')}</span>}
              {p.tier === 'prata' && <span style={{ ...OSW, fontSize: 10.5, background: INK, color: '#E6ECF2', borderRadius: 7, padding: '2px 7px' }}>⭐ Craque</span>}
            </div>
          </div>
        </div>

        {/* 📊 a melhor carreira no ranking global, na temporada em que ela está (mesma conta do ranking da carreira) */}
        <div style={{ ...caixa, background: '#FFF7DA', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center', minWidth: 92 }}>
            <div style={{ ...OSW, fontSize: 34, lineHeight: 1, color: INK }}>{p.rank ? `${p.rank.pos}º` : '—'}</div>
            {p.rank && <div style={{ fontSize: 10.5, fontWeight: 800, color: '#555' }}>{tr('de', 'of')} {p.rank.total.toLocaleString('pt-BR')}</div>}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ ...h3, margin: 0 }}>📊 {tr('Ranking global da carreira', 'Global career ranking')}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#555', margin: '3px 0 0', lineHeight: 1.35 }}>{p.rank
              ? <>{tr('Melhor carreira', 'Best career')}{p.rank.clube ? <> · <b style={{ color: INK }}>{p.rank.clube}</b></> : null} · {tr('temporada', 'season')} {p.rank.temporada}</>
              : tr('Ainda sem carreira no ranking (só conta carreira salva na nuvem).', 'No career in the ranking yet (only cloud-saved careers count).')}</p>
          </div>
        </div>

        <div style={caixa}>
          <p style={h3}>🏆 {tr('Títulos na carreira', 'Career titles')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {tits.map(([ic, nome, k]) => (
              <div key={k} style={{ border: `2px solid ${INK}`, borderRadius: 10, textAlign: 'center', padding: '6px 2px', background: (p.titulos?.[k] ?? 0) > 0 ? '#FFF7DA' : '#f3eee0' }}>
                <div style={{ fontSize: 18 }}>{ic}</div>
                <div style={{ ...OSW, fontSize: 18, color: INK }}>{p.titulos?.[k] ?? 0}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#555' }}>{nome}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#777', fontWeight: 700, margin: '6px 0 0' }}>{tr('Somando todas as carreiras salvas na nuvem.', 'All careers saved in the cloud added up.')}</p>
        </div>

        {/* 🔨 títulos de sala online, em forma de taça (até 15 desenhadas; o resto vira "+N") */}
        <div style={caixa}>
          <p style={h3}>🔨 {tr('Títulos no online', 'Online titles')} ({p.titulos?.salas ?? 0})</p>
          {(p.titulos?.salas ?? 0) === 0
            ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{tr('Ainda sem título em sala online.', 'No online room title yet.')}</p>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              {Array.from({ length: Math.min(15, p.titulos.salas) }, (_, i) => <span key={i} style={{ fontSize: 26, filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,.35))' }}>🏆</span>)}
              {p.titulos.salas > 15 && <span style={{ ...OSW, fontSize: 16, marginLeft: 4 }}>+{p.titulos.salas - 15}</span>}
            </div>}
        </div>

        <div style={caixa}>
          <p style={h3}>👥 {tr('Amigos', 'Friends')} ({p.amigos_total})</p>
          {p.amigos.length === 0
            ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{tr('Ainda sem amigos por aqui.', 'No friends here yet.')}</p>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {p.amigos.map(a => (
                <button key={a.uid} onClick={() => abrir(a.uid)} style={{ width: 62, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center', fontSize: 10, fontWeight: 800, color: INK }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}><Rosto uid={a.uid} nome={a.nome} size={44} /></div>
                  <div style={{ marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
                </button>
              ))}
            </div>}
        </div>

        {!p.sou_eu && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {p.relacao === null && <button disabled={ocupado} style={{ ...bt(GREEN, '#fff'), flex: 1, padding: 10, fontSize: 14 }} onClick={() => acao(() => supabase.rpc('esc_amigo_pedir', { p_para: p.uid }))}>➕ {tr('Adicionar amigo', 'Add friend')}</button>}
            {p.relacao === 'enviado' && <>
              <span style={{ ...bt('#e9dfc4', INK), flex: 1, padding: 10, fontSize: 13, textAlign: 'center', boxShadow: 'none' }}>⏳ {tr('Pedido enviado', 'Request sent')}</span>
              <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => acao(() => supabase.rpc('esc_amigo_desfazer', { p_outro: p.uid }))}>{tr('cancelar', 'cancel')}</button>
            </>}
            {p.relacao === 'recebido' && p.amizade_id != null && <>
              <button disabled={ocupado} style={{ ...bt(GREEN, '#fff'), flex: 1, padding: 10, fontSize: 14 }} onClick={() => acao(() => supabase.rpc('esc_amigo_responder', { p_id: p.amizade_id, p_aceita: true }))}>✅ {tr('Aceitar amizade', 'Accept')}</button>
              <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => acao(() => supabase.rpc('esc_amigo_responder', { p_id: p.amizade_id, p_aceita: false }))}>{tr('recusar', 'decline')}</button>
            </>}
            {p.relacao === 'aceito' && <>
              <span style={{ ...bt(GREEN, '#fff'), flex: 1, padding: 10, fontSize: 14, textAlign: 'center' }}>✅ {tr('Amigos', 'Friends')}</span>
              <button disabled={ocupado} style={bt('#fff', RED)} onClick={() => { if (window.confirm(tr(`Desfazer a amizade com ${p.nome}?`, `Unfriend ${p.nome}?`))) void acao(() => supabase.rpc('esc_amigo_desfazer', { p_outro: p.uid })) }}>{tr('desfazer', 'unfriend')}</button>
            </>}
          </div>
        )}
      </>}
    </Janela>
  )
}

// ── 👥 MEUS AMIGOS ─────────────────────────────────────────────────────────────────────────────────────────────
export function MeusAmigos({ onClose }: { onClose: () => void }) {
  const [lista, setLista] = useState<Linha[] | null | 'erro'>(null)
  const [perfil, setPerfil] = useState<string | null>(null)
  const carrega = () => { supabase.rpc('esc_amigos_lista').then(({ data, error }) => setLista(error ? 'erro' : (data ?? []) as Linha[]), () => setLista('erro')) }
  useEffect(carrega, [])
  const responder = async (id: number, sim: boolean) => { await supabase.rpc('esc_amigo_responder', { p_id: id, p_aceita: sim }); carrega() }
  const cancelar = async (uid: string) => { await supabase.rpc('esc_amigo_desfazer', { p_outro: uid }); carrega() }
  const l = Array.isArray(lista) ? lista : []
  const recebidos = l.filter(x => x.relacao === 'recebido')
  const enviados = l.filter(x => x.relacao === 'enviado')
  const amigos = l.filter(x => x.relacao === 'aceito')
  const on = amigos.filter(x => x.online), off = amigos.filter(x => !x.online)
  const linha = (x: Linha, direita: ReactNode, sub: ReactNode) => (
    <div key={x.amizade_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px dashed #d8ccaa' }}>
      <button onClick={() => setPerfil(x.outro)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: INK }}>
        <Rosto uid={x.outro} nome={x.nome} size={36} />
        <span style={{ minWidth: 0 }}><b style={{ display: 'block', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.nome}</b><span style={{ fontSize: 11, fontWeight: 700 }}>{sub}</span></span>
      </button>
      {direita}
    </div>
  )
  return (
    <Janela titulo={`${tr('👥 Meus amigos', '👥 My friends')}${amigos.length ? ` · ${amigos.length}` : ''}`} onClose={onClose}>
      {lista === null && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('carregando…', 'loading…')}</p>}
      {lista === 'erro' && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('Não consegui carregar agora. Tenta de novo.', 'Couldn’t load right now. Try again.')}</p>}
      {Array.isArray(lista) && <>
        {recebidos.length > 0 && <div style={{ ...caixa, background: '#FFF3C4' }}>
          <p style={h3}>📩 {recebidos.length === 1 ? tr('1 pedido de amizade', '1 friend request') : tr(`${recebidos.length} pedidos de amizade`, `${recebidos.length} friend requests`)}</p>
          {recebidos.map(x => linha(x, <span style={{ display: 'flex', gap: 5 }}><button style={bt(GREEN, '#fff')} onClick={() => void responder(x.amizade_id, true)}>{tr('aceitar', 'accept')}</button><button style={bt('#fff', INK)} onClick={() => void responder(x.amizade_id, false)}>{tr('recusar', 'decline')}</button></span>, <span style={{ color: '#7a4d00' }}>{tr('quer ser seu amigo', 'wants to be your friend')}</span>))}
        </div>}
        <div style={caixa}>
          <p style={h3}>🟢 {tr('Online agora', 'Online now')} ({on.length})</p>
          {on.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{tr('Nenhum amigo jogando agora.', 'No friends playing right now.')}</p>
            : on.map(x => linha(x, null, <span style={{ color: GREEN }}>● {ondeEsta(x.tela)}</span>))}
        </div>
        <div style={caixa}>
          <p style={h3}>⚪ {tr('Offline', 'Offline')} ({off.length})</p>
          {off.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{amigos.length === 0 ? tr('Você ainda não tem amigos. Toque no nome de alguém numa sala e aperte ➕ Adicionar amigo.', 'No friends yet. Tap someone’s name in a room and press ➕ Add friend.') : tr('Todo mundo online!', 'Everyone is online!')}</p>
            : off.map(x => linha(x, null, <span style={{ color: '#888' }}>{vistoHa(x.visto_em)}</span>))}
        </div>
        {enviados.length > 0 && <div style={caixa}>
          <p style={h3}>⏳ {tr('Pedidos que você mandou', 'Requests you sent')} ({enviados.length})</p>
          {enviados.map(x => linha(x, <button style={bt('#fff', INK)} onClick={() => void cancelar(x.outro)}>{tr('cancelar', 'cancel')}</button>, <span style={{ color: '#888' }}>{tr('esperando aceitar', 'waiting')}</span>))}
        </div>}
        <p style={{ fontSize: 11, color: '#666', fontWeight: 700, margin: '10px 2px 0', lineHeight: 1.4 }}>{tr('Amizade só vale com os dois lados aceitando, e dá pra desfazer quando quiser. Ninguém vê o seu e-mail.', 'A friendship needs both sides to accept, and you can undo it any time. Nobody sees your e-mail.')}</p>
      </>}
      {perfil && <PerfilPublico uid={perfil} onClose={() => { setPerfil(null); carrega() }} onAbrirOutro={u => setPerfil(u)} />}
    </Janela>
  )
}

// botão "👥 Amigos" (com o número de pedidos esperando) — lê a lista UMA vez quando aparece
export function BotaoAmigos({ style }: { style?: CSSProperties }) {
  const [aberto, setAberto] = useState(false)
  const [pedidos, setPedidos] = useState(0)
  useEffect(() => {
    let vivo = true
    supabase.rpc('esc_amigos_lista').then(({ data }) => { if (vivo) setPedidos(((data ?? []) as Linha[]).filter(x => x.relacao === 'recebido').length) }, () => {})
    return () => { vivo = false }
  }, [aberto])
  return <>
    <button onClick={() => setAberto(true)} style={{ ...bt(ROXO, '#fff'), position: 'relative', ...style }}>
      👥 {tr('Amigos', 'Friends')}
      {pedidos > 0 && <span style={{ position: 'absolute', top: -8, right: -8, minWidth: 20, height: 20, borderRadius: 10, background: RED, color: '#fff', border: `2px solid ${INK}`, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{pedidos}</span>}
    </button>
    {aberto && <MeusAmigos onClose={() => setAberto(false)} />}
  </>
}
